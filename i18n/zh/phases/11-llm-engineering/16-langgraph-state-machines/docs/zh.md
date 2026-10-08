# 拉格格拉夫  代理的国家机器

> 写手的 ReAct循环是一个`while True`△使用LangGraph写的 ReAct循环是一个图,你可以对其进行检查点,断断分,并进行时间旅行.

**Type:** Build
**Languages:** Python
**前置要求:**阶段11·09 (职能调用),阶段11·14 (模式背景协议)
**Time:** ~75 minutes

## 问题

你发布了一个调用函数的代理. 它前三轮正常运行,然后出现问题:模型试图调用一个回500的工具,用户在任务中改变想法,或者代理在没有人签署的情况下决定退款订单.`while True:`你不能暂停它,不能回回它,也不能分叉出 如果模型当时选择了另一个工具会怎样──一旦你把它从演示推向真实环境,代理就变成了一个黑盒:要么成功,要么失败──

一旦你看清这一点,下一步就很明显――代理 本来就是一个状态机:系统提示加消息历史,加待机器调用,再加下一步行动――把这个状态机 显式化:用节点表示模型 思考工具运行人 批准,用边缘表示它们之间的条件转移――一旦图表 显式化,harness 就自动获得四种能力:检查点 (在步骤之间保存状态) 暂停等待人类) 播放流标和中间事件),以及时间旅行 (回到之前的状态,并尝试不同的分支)――

拉格格拉夫就是提供这种抽象的库――它不是拉格链的代理框架――这里有一个代理执行器,祝你好运)――它是一个图表运行时间,具有相同的状态――等级的持久性和等级的中断――代理循环是你画出来的东西,而不是你手写出来的东西――

## 概念

![LangGraph StateGraph: nodes, edges, and the checkpointer](../assets/langgraph-stategraph.svg)

一个`StateGraph`有三件事.

1. **State.**一个打字的句子 ([[TypedDict]] 或 Pydantic模型),会在图中流动──每个节点都接收完整状态,并返回一个部分更新,长度图会使用每个字段对应的 *减小器* 合并它们:对应的累积列表 使用`operator.add`默认则覆盖
2. **Nodes.** Python 函数`state -> partial_state`△每个节点是一个离散步骤: 调用模型运行工具总结。
3. **Edges.**节点之间的过渡――静态边缘指向固定位置――条件边缘接收一个路由器函数`state -> next_node_name`根据模型输出分支.

你会编译这个图片――编译会绑定拓,附加一个检查点(可选,但对生产至关重要),并返回一个可运行的――你使用初始状态 和 `thread_id`调用它. 每个执行步骤都会持续一个.`(thread_id, checkpoint_id)`为关键的检查点.

### 四种超能力

**Checkpointing.**每次节点转换都会把新的状态写入商店测试用在内存,产品用 Postgres/Redis/SQLite) ⋅用同一个 `thread_id`再调用图 即可恢复图 会从暂停位置继续

**Interrupts.**用`interrupt_before=["human_review"]`标记一个节点,执行会在该节点运行前停止――状态会被持久化――你的API向用户返回 等待批准――之后对同一个`thread_id`发起带有`Command(resume=...)`要求即可恢复执行.

**Streaming.** `graph.stream(state, mode="updates")`它们在州的海域发生时产生.`mode="messages"`会流模型节点 内部的LLM代币――`mode="values"`您可以选择在UI中显示哪种.

**Time-travel.** `graph.get_state_history(thread_id)`返回完整的检查站日志.`checkpoint_id`传给我`graph.invoke`您就能从那个点叉. 它非常适合调试.

### 减速器才是重点

每个状态字段都有一个减小器.`operator.add`通过减轻器将它们的更新合并. 如果两个节点都更新.`messages`你忘了了`Annotated[list, add_messages]`简单的内容是这本图书馆里唯一微妙的东西;把它写成,剩下的部分就能自然组合.

### 四个节点的 ReAct图

一个生产反应代理由四个节点和两条边缘组成:

1. `agent` 用当前消息历史调用LLM──返回助理消息(其中可能包含工具_调用)──
2. `tools` 执行最后一条助理消息 中所有工具_调用,并把工具结果 作为工具消息添加进去──
3. 从`agent`发出一个条款的条件边缘:如果最后一个消息有工具_调用,则路径到`tools`否则到`END`,我知道.
4. 从`tools`回到`agent`没有什么可靠的.

这就是这样. 你使用大约40行代码,就能获得完整的 ReAct循环.

### 州图与发送图

`Send(node_name, state)`允许一个节点发送并行子图. 例如:代理决定同时查询三个检索器.`Send`城市会产生一个目标节点的并行执行;它们的输出会通过状态减小器合并.

### 字幕

一个编译图可以作为另一个图中节点――外面图 看到是一个单个节点;内面图 拥有自己的状态和自己的检查点――这就是团队构建监督员工代理的方式:监督员工图将用户意图路线到某个域工子图――


```figure
l5-state-graph-ledger
```

## 构建它

### 步骤1:状态和节点

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

`add_messages`是让消息列表 积累而不是覆盖的减小器.

### 步骤 2:用线程运行

```python
config = {"configurable": {"thread_id": "user-42"}}
for event in app.stream(
    {"messages": [HumanMessage("find the Anthropic headquarters address")]},
    config,
    stream_mode="updates",
):
    print(event)
```

每次更新都是一个命令.`{node_name: state_delta}`你的前端可以把这些流向UI,让用户看到代理正在思考...正在调用搜索_网页...得到结果...正在回答

### 步骤3: 添加人-在循环中断

标记一个节点,让执行暂停在运行之前.

```python
app = graph.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["tools"],  # pause before every tool call
)

state = app.invoke({"messages": [HumanMessage("delete the production database")]}, config)
# state["__interrupt__"] is set. Inspect proposed tool calls.
# If approved:
from langgraph.types import Command
app.invoke(Command(resume=True), config)
# If denied: write a rejection message and resume
app.update_state(config, {"messages": [AIMessage("Blocked by human reviewer.")]})
```

除了执行期间,没有任何东西只存在于内存中.

### 步骤4: 用于调试时间旅行

```python
history = list(app.get_state_history(config))
for snapshot in history:
    print(snapshot.values["messages"][-1].content[:80], snapshot.config)

# Fork from a prior checkpoint
target = history[3].config  # three steps back
for event in app.stream(None, target, stream_mode="values"):
    pass  # replay from that point forward
```

让我`None`作为输入 传入,将从给定的检查点重播;传入一个值,则将在恢复前将其作为更新添加到该检查点状态上.

### 步骤5:为生产环境换取检查点

```python
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string("postgresql://...") as checkpointer:
    checkpointer.setup()
    app = graph.compile(checkpointer=checkpointer)
```

提供了SQLite、Redis 和 Postgres 都已提供了──`MemorySaver`任何需要跨重启的东西都应该使用真正的商店.

## 技能

> 你把代理构建成图形,而不是`while True`子

在使用LangGraph之前,先做一个60秒设计:

1. **命名 nodes。**每个分离决定或副作用都是一个节点. 代理认为工具运行. 评论员批准了响应流.
2. **声明 state。**使用最小的TypedDict,并为每个列表字段 配减小器.`messages`;把任务特定的领域`plan`一个`budget`计数器`retrieved_docs`提升到最高水平.
3. **画出 edges。**除非下一步依赖于模型输出,否则使用静态――每条条件边都需要一个带名为分支的路由器功能――
4. **一开始就选择 checkpointer。**用的测试`MemorySaver`其他场景使用 Postgres/Redis/SQLite──不要在没有检查点的情况下发布没有检查点就没有恢复,没有中断,没有时间旅行──
5. **在 tools 运行前决定 interrupts，而不是运行后。**批准应放在侧效节点的边缘上,这样你就可以在影响前取消;验证应放在模型输出后的边缘上,这样你能低成本拒绝坏电话.
6. **默认 stream。**用户`mode="updates"`模型节点内部的代币级流量使用`mode="messages"`,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`mode="values"`,我知道.

拒绝发布没有检查点的LangGraph代理──拒绝发布在副作用后才中断的LangGraph代理──拒绝发布`messages`没有使用`add_messages`作为减轻剂的兰格拉夫代理.

## 练习

1. **Easy.**用计算器工具和网络搜索工具实现上面的四节点 ReAct图.`list(app.get_state_history(config))`至少返回四个检查站.
2. **Medium.**添加一个在`agent`之前运行的`planner`结,并向状态 写入结构化 `plan: list[str]`让我`agent`让计划步骤标记为完成.`plan`在检查点恢复后丢失,测试应失败.
3. **Hard.**构建一个监督图,使用 `Send`在三个子图中`researcher`,我知道.`writer`,我知道.`reviewer`) 之间路线――每个子图都有自己的状态和检查点――在外面图上添加`interrupt_before=["writer"]`让人类可以批准研究简报. 确认从前的检查点, 进行时间旅行.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| StateGraph | “LangGraph graph” | 你在 compile 前向其中添加 nodes 和 edges 的 builder object。 |
| Reducer | “field 如何 merge” | 当 node 返回某个 field 的 update 时应用的函数 `(old, new) -> merged`；默认是 overwrite，`add_messages` 会 append。 |
| Thread | “一个 conversation ID” | 一个 `thread_id` 字符串，用于限定一个 session 的所有 checkpoints。 |
| Checkpoint | “一个 paused state” | node transition 后完整 graph state 的持久化 snapshot，以 `(thread_id, checkpoint_id)` 为 key。 |
| Interrupt | “暂停等待 human” | `interrupt_before` / `interrupt_after` 会在 node boundary 停止 execution；用 `Command(resume=...)` resume。 |
| Time-travel | “从之前的 step fork” | `graph.invoke(None, config_with_old_checkpoint_id)` 会从该 checkpoint 向前 replay。 |
| Send | “Parallel subgraph dispatch” | node 可以返回的 constructor，用于 spawn N 个 target node 的 parallel executions。 |
| Subgraph | “作为 node 的 compiled graph” | 在另一个 graph 中作为 node 使用的 compiled StateGraph；保留自己的 state scope。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/)国家图,减速器,检查点和中断的权力参考.
- [LangGraph concepts: state, reducers, checkpointers](https://langchain-ai.github.io/langgraph/concepts/low_level/) 本课使用的心理模型,直接来自官方来源.
- [LangGraph Persistence and Checkpoints](https://langchain-ai.github.io/langgraph/concepts/persistence/) 关于Postgres/SQLite/Redis店铺,检查点名字空间和线程ID的细节.
- [LangGraph Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/) `interrupt_before`,我知道.`interrupt_after`,我知道.`Command(resume=...)`和编辑状态模式.
- [Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)](https://arxiv.org/abs/2210.03629) 每个LangGraph代理都实现了模式;阅读它可以理解推理的痕迹的依据.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) 说明应该在何时选择哪些图形形 (链路由器,管弦乐队员,评价者优化器)
- 11 阶段 · 09 (函数调用)  每个LangGraph代理节点 复用工具调用原始──
- 通过MCP适配器可通过MCP适配器接入LangGraph`ToolNode`,我知道.
- 阶段11 · 17 (代理框架交易)  何时选择LangGraph,而不是CrewAI、AutoGen或Agno。
