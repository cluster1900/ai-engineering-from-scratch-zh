# Agent 状态机——图、节点与 Checkpoint

> 手写的 ReAct 循环是一个 `while True`。把同一个循环写成显式图后，就可以对其创建 Checkpoint、中断、分支和时间回溯。Agent 没有改变，改变的是它周围的执行框架。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 14 (Model Context Protocol)
**Time:** ~75 分钟

## 问题

你交付了一个支持 Function Calling 的 Agent。它运行了三个回合，然后出了问题：Model 尝试调用一个返回 500 的 Tool、用户在任务进行到一半时改变主意，或者 Agent 决定在未经人工批准的情况下为订单退款。`while True:` 循环没有任何挂钩点。你无法暂停、回退，也无法创建“如果 Model 选择了另一个 Tool 会怎样”的分支。一旦它不再只是 Demo，Agent 就会变成一个黑盒：要么成功，要么失败。

看清这一点后，下一步就很明显了。Agent 本来就是一个状态机——system prompt、消息历史、待处理的 Tool 调用以及下一步操作。让这个状态机变得显式：用节点表示“Model 思考”“运行 Tool”“人工批准”，用边表示它们之间的条件转换。图一旦显式化，执行框架就自然获得四种能力：Checkpointing（在步骤之间保存状态）、中断（暂停并等待人工处理）、流式传输（流式输出 Token 和中间事件）以及时间回溯（回到先前状态并尝试不同分支）。

这种抽象的参考实现是 LangGraph。它不是 LangChain 意义上的 Agent 框架（“这是一个 AgentExecutor，祝你好运”）。它是一个将状态、持久化和中断都视为一等能力的图运行时。Agent 循环是你画出来的，而不是手写出来的。

## 概念

![LangGraph StateGraph：节点、边和 checkpointer](../assets/langgraph-stategraph.svg)

一个 `StateGraph` 包含三部分。

1. **状态。** 一个在图中流动的类型化字典（TypedDict 或 Pydantic model）。每个节点都会接收完整状态并返回部分更新，LangGraph 使用每个字段对应的 *reducer* 合并这些更新——需要累积的列表使用 `operator.add`，默认行为是覆盖。
2. **节点。** Python 函数 `state -> partial_state`。每个函数都是一个离散步骤，例如“调用 Model”“运行 Tools”“生成摘要”。
3. **边。** 节点之间的转换。静态边始终通向同一个位置。条件边接收路由函数 `state -> next_node_name`，使图能够根据 Model 输出选择分支。

然后编译这个图。编译过程会绑定拓扑结构、连接 checkpointer（可选，但对生产环境至关重要），并返回一个可运行对象。你使用初始状态和 `thread_id` 调用它。每个执行步骤都会持久化一个以 `(thread_id, checkpoint_id)` 为键的 Checkpoint。

### 四种超能力

**Checkpointing。** 每次节点转换都会把新状态写入存储（测试使用内存，生产环境使用 Postgres/Redis/SQLite）。再次使用同一个 `thread_id` 调用图即可恢复执行。图会从暂停的位置继续运行。

**中断。** 使用 `interrupt_before=["human_review"]` 标记节点后，执行会在该节点运行前停止。状态会被持久化。你的 API 向用户返回“等待批准”。稍后向同一个 `thread_id` 发送包含 `Command(resume=...)` 的请求即可恢复执行。

**流式传输。** `graph.stream(state, mode="updates")` 会在状态增量产生时逐个返回。`mode="messages"` 会流式传输 Model 节点中的 LLM Token。`mode="values"` 会返回完整快照。你可以选择在 UI 中呈现哪一种。

**时间回溯。** `graph.get_state_history(thread_id)` 返回完整的 Checkpoint 日志。将任意先前的 `checkpoint_id` 传给 `graph.invoke`，就能从该位置创建分支。这非常适合调试（“如果 Model 选择了 Tool B 会怎样？”）以及重放生产环境轨迹的 Regression 测试。

### Reducer 才是关键

每个状态字段都有一个 reducer。多数默认行为都没有问题——新值覆盖旧值。但消息列表需要使用 `operator.add`，这样新消息才会追加，而不是替换旧消息。并行边通过 reducer 合并各自的更新。如果两个节点都更新 `messages`，而你忘记添加 `Annotated[list, add_messages]`，第二个更新会悄无声息地覆盖第一个，导致半个回合的数据丢失。Reducer 是这个库中唯一需要特别留意的部分；把它配置正确，其余部分就能自然组合。

### 由四个节点构成的 ReAct 图

一个生产级 ReAct Agent 由四个节点和两条边组成：

1. `agent`——使用当前消息历史调用 LLM。返回 assistant 消息，其中可能包含 tool_calls。
2. `tools`——执行最后一条 assistant 消息中的所有 tool_calls，并把 Tool 结果作为 Tool 消息追加进去。
3. 从 `agent` 出发的一条条件边：如果最后一条消息包含 tool_calls，则路由到 `tools`，否则路由到 `END`。
4. 从 `tools` 返回 `agent` 的一条静态边。

仅此而已。只需大约 40 行代码，你就能获得完整的 ReAct 循环（Thought → Action → Observation → Thought → …），以及 Checkpointing、中断和流式传输能力。

### StateGraph 与 Send（fanout）

`Send(node_name, state)` 允许一个节点分派并行子图。例如，Agent 决定同时查询三个 retriever。每个 `Send` 都会为目标节点启动一次并行执行，其输出通过状态 reducer 合并。LangGraph 通过这种方式表达 orchestrator-workers 模式，而不需要线程原语。

### 子图

编译后的图可以作为另一个图中的节点。外层图看到的是一个节点；内层图拥有自己的状态和 Checkpoint。团队可以通过这种方式构建 supervisor-worker Agent：supervisor 图将用户意图路由到各领域对应的 worker 子图。

```figure
l5-state-graph-ledger
```

## 动手构建

### 第 1 步：状态和节点

```python
from typing import Annotated, TypedDict
from langchain_core.messages import AnyMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

def agent_node(state: State) -> dict:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: State) -> str:
    last = state["messages"][-1]
    return "tools" if getattr(last, "tool_calls", None) else END

tool_node = ToolNode(tools=[search_web, read_file])

graph = StateGraph(State)
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

app = graph.compile(checkpointer=MemorySaver())
```

`add_messages` 是让消息列表累积而不是被覆盖的 reducer。忘记使用它是最常见的 LangGraph bug。

### 第 2 步：使用 thread 运行

```python
config = {"configurable": {"thread_id": "user-42"}}
for event in app.stream(
    {"messages": [HumanMessage("find the Anthropic headquarters address")]},
    config,
    stream_mode="updates",
):
    print(event)
```

每次更新都是一个字典 `{node_name: state_delta}`。你的 frontend 可以将这些更新流式传输到 UI，让用户看到“Agent 正在思考……正在调用 search_web……已获得结果……正在回答。”

### 第 3 步：添加 human-in-the-loop 中断

标记一个节点，使执行在该节点运行前暂停。

```python
app = graph.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["tools"],  # 在每次 Tool 调用前暂停
)

state = app.invoke({"messages": [HumanMessage("delete the production database")]}, config)
# state["__interrupt__"] 已设置。检查建议的 Tool 调用。
# 如果批准：
from langgraph.types import Command
app.invoke(Command(resume=True), config)
# 如果拒绝：写入拒绝消息并恢复执行
app.update_state(config, {"messages": [AIMessage("Blocked by human reviewer.")]})
```

状态、Checkpoint 和 thread 都会跨中断持久保存。除了执行期间，没有任何内容只保存在内存中。

### 第 4 步：使用时间回溯进行调试

```python
history = list(app.get_state_history(config))
for snapshot in history:
    print(snapshot.values["messages"][-1].content[:80], snapshot.config)

# 从先前的 Checkpoint 创建分支
target = history[3].config  # 回退三个步骤
for event in app.stream(None, target, stream_mode="values"):
    pass  # 从该位置开始向前重放
```

将 `None` 作为输入会从指定 Checkpoint 开始重放；传入一个值则会先把它作为更新追加到该 Checkpoint 的状态，然后恢复执行。通过这种方式，你无需重新运行整段对话，就能复现一次有问题的 Agent 执行。

### 第 5 步：将 checkpointer 替换为生产环境实现

```python
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string("postgresql://...") as checkpointer:
    checkpointer.setup()
    app = graph.compile(checkpointer=checkpointer)
```

已经提供 SQLite、Redis 和 Postgres 实现。`MemorySaver` 用于测试。任何需要跨重启持久化的场景都应该使用真实存储。

## Skill

> 使用图而不是 `while True` 循环来构建 Agent。

在使用 LangGraph 之前，先花 60 秒完成设计：

1. **为节点命名。** 每个离散决策或带副作用的操作都是一个节点。“Agent 思考”“运行 Tool”“审阅者批准”“响应流式传输”。如果你无法列出这些节点，这项任务还不具备 Agent 的形态。
2. **声明状态。** 使用最小化的 TypedDict，并为每个列表字段配置 reducer。不要把所有内容都塞进 `messages`；将任务特定字段（工作中的 `plan`、`budget` 计数器、`retrieved_docs` 列表）提升到顶层。
3. **画出边。** 除非下一步依赖 Model 输出，否则使用静态边。每条条件边都需要一个具有命名分支的路由函数。
4. **预先选择 checkpointer。** 测试使用 `MemorySaver`，其他场景使用 Postgres/Redis/SQLite。不要在没有 checkpointer 的情况下交付——没有 checkpointer 就无法恢复、无法中断，也无法时间回溯。
5. **在 Tools 运行前决定是否中断，而不是运行后。** 批准操作应放在进入带副作用节点的边上，这样可以在造成损害前取消；验证操作应放在离开 Model 的边上，这样可以低成本拒绝错误调用。
6. **默认使用流式传输。** UI 使用 `mode="updates"`，Model 节点内的 Token 级流式传输使用 `mode="messages"`，Evaluation 期间的完整快照使用 `mode="values"`。

拒绝交付没有 checkpointer 的 LangGraph Agent。拒绝交付在副作用发生后才中断的 LangGraph Agent。拒绝交付 reducer 不是 `add_messages` 的 `messages` 字段。

## 练习

1. **简单。** 使用计算器 Tool 和 web 搜索 Tool 实现上面的四节点 ReAct 图。验证对于一段两回合对话，`list(app.get_state_history(config))` 至少返回四个 Checkpoint。
2. **中等。** 添加一个在 `agent` 之前运行的 `planner` 节点，并向状态写入结构化的 `plan: list[str]`。让 `agent` 将计划步骤标记为已完成。如果 `plan` 在从 Checkpoint 恢复后丢失（reducer 错误），则测试失败。
3. **困难。** 构建一个使用 `Send` 在三个子图（`researcher`、`writer`、`reviewer`）之间路由的 supervisor 图。每个子图都有自己的状态和 checkpointer。在外层图上添加 `interrupt_before=["writer"]`，以便人工批准研究简报。确认从先前 Checkpoint 进行时间回溯时，只会重新运行创建分支的部分。

## 关键术语

| 术语 | 人们怎么说 | 实际含义 |
|------|------------|----------|
| StateGraph | “LangGraph 图” | 编译前用于添加节点和边的 builder 对象。 |
| Reducer | “字段如何合并” | 当节点返回该字段的更新时应用的函数 `(old, new) -> merged`；默认覆盖，`add_messages` 执行追加。 |
| Thread | “对话 ID” | 一个 `thread_id` 字符串，用于限定一次会话的所有 Checkpoint。 |
| Checkpoint | “暂停时的状态” | 节点转换后持久化的完整图状态快照，以 `(thread_id, checkpoint_id)` 为键。 |
| Interrupt | “暂停并等待人工处理” | `interrupt_before` / `interrupt_after` 在节点边界停止执行；使用 `Command(resume=...)` 恢复。 |
| Time-travel | “从先前步骤创建分支” | `graph.invoke(None, config_with_old_checkpoint_id)` 从该 Checkpoint 开始向前重放。 |
| Send | “并行子图分派” | 节点可以返回的构造器，用于启动目标节点的 N 次并行执行。 |
| Subgraph | “作为节点的已编译图” | 在另一个图中用作节点的已编译 StateGraph；保留自己的状态作用域。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/)——StateGraph、reducers、checkpointers 和 interrupts 的规范参考。
- [LangGraph concepts: state, reducers, checkpointers](https://langchain-ai.github.io/langgraph/concepts/low_level/)——本课使用的思维模型，直接来自官方来源。
- [LangGraph Persistence and Checkpoints](https://langchain-ai.github.io/langgraph/concepts/persistence/)——关于 Postgres/SQLite/Redis 存储、Checkpoint namespace 和 thread ID 的详细说明。
- [LangGraph Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/)——`interrupt_before`、`interrupt_after`、`Command(resume=...)` 和编辑状态模式。
- [Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)](https://arxiv.org/abs/2210.03629)——每个 LangGraph Agent 实现的模式；阅读它以理解 reasoning trace 的设计依据。
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents)——应在何时选择哪些图结构（chain、router、orchestrator-workers、evaluator-optimizer）。
- Phase 11 · 09 (Function Calling)——每个 LangGraph Agent 节点都会复用的 Tool 调用原语。
- Phase 11 · 14 (Model Context Protocol)——通过 MCP adapter 接入 LangGraph `ToolNode` 的外部 Tool 发现机制。
- Phase 11 · 17 (Agent framework tradeoffs)——何时应选择 LangGraph，而不是 CrewAI、AutoGen 或 Agno。
