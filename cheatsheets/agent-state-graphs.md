---
id: agent-state-graphs
title: Agent State Machines and Durable Graphs
code: AM
subtitle: 状态、节点、边、reducer、checkpoint、中断与带租约的任务恢复。LangGraph 与一个 Go 任务队列。
hue: 165
sources: phases/11-llm-engineering/16-langgraph-state-machines, phases/14-agent-engineering/13-langgraph-stateful-graphs, projects/durable-agent-jobs
source_hash: 9903f6332bc1bd69
---

## 状态图的组成
type: concepts
from: phases/11-llm-engineering/16-langgraph-state-machines/docs/en.md, phases/14-agent-engineering/13-langgraph-stateful-graphs/docs/en.md

- **State**：在图中流动的类型化 dict。每个节点拿到完整状态。
- **Node**：一个函数 `state -> partial_state`。一个离散步骤。
- **Edge**：静态边指向一个节点。条件边调用路由函数。
- **Reducer**：每个字段一个 `(old, new) -> merged`。默认是覆盖。
- **Thread**：一个 `thread_id` 字符串，限定一个会话的全部 checkpoint。
- **Checkpoint**：节点执行后的完整状态，以 `(thread_id, checkpoint_id)` 为键。
- **Send**：节点返回 `Send(node_name, state)` 以并行运行节点。
- **Subgraph**：编译后的图，在另一个图中作为一个节点使用。

## 四节点 ReAct 图
type: annotated-code
lang: python
from: phases/11-llm-engineering/16-langgraph-state-machines/code/main.py, phases/11-llm-engineering/16-langgraph-state-machines/docs/en.md

```python
class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]  # append, not overwrite
def should_continue(state: State) -> str:
    last = state["messages"][-1]
    return "tools" if getattr(last, "tool_calls", None) else END
graph = StateGraph(State)
graph.add_node("agent", agent_node)  # calls the LLM
graph.add_node("tools", ToolNode(TOOLS))  # runs tool_calls
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")  # static edge back
app = graph.compile(checkpointer=MemorySaver(),
                    interrupt_before=["tools"])  # pause before side effects
```

## 带 checkpointer 的 ReAct 循环
type: architecture
from: phases/11-llm-engineering/16-langgraph-state-machines/docs/en.md

```arch
node | user | 1,1 | User | thread_id | client
node | agent | 2,1 | agent | calls the LLM | model
node | tools | 3,1 | tools | ToolNode | process
node | end | 2,2 | END | no tool_calls |
node | ckpt | 3,2 | Checkpointer | state after each node | store
edge | user | agent | messages
edge | agent | tools | tool_calls
edge | tools | agent | tool results
edge | agent | end | done
edge | tools | ckpt | save
```

## 图任务
type: task-table
from: phases/11-llm-engineering/16-langgraph-state-machines/docs/en.md, phases/11-llm-engineering/16-langgraph-state-machines/code/main.py

| 任务 | 代码 |
|---|---|
| 设置 thread | `{"configurable": {"thread_id": "<id>"}}` |
| 流式输出增量 | `app.stream(<state>, config, stream_mode="updates")` |
| 读取暂停时的状态 | `app.get_state(config)` |
| 批准并恢复 | `app.invoke(Command(resume=True), config)` |
| 拒绝并附消息 | `app.update_state(config, {"messages": [...]})` |
| 列出 checkpoint | `list(app.get_state_history(config))` |
| 从某个 checkpoint 重放 | `app.stream(None, <old_config>)` |
| Postgres 存储 | `PostgresSaver.from_conn_string(<url>)` |

## Stream 模式
type: comparison
from: phases/11-llm-engineering/16-langgraph-state-machines/docs/en.md

| 维度 | `updates` | `messages` | `values` |
|---|---|---|---|
| 产出 | 状态增量 | LLM token | 完整快照 |
| 形态 | `{node_name: state_delta}` | 模型节点中的 token | 整个状态 |
| 用于 | UI | token 流式输出 | 评估 |

## 暂停、批准、恢复
type: flow
from: phases/11-llm-engineering/16-langgraph-state-machines/docs/en.md, phases/11-llm-engineering/16-langgraph-state-machines/code/main.py

1. **Compile**：设置 `interrupt_before=["tools"]` 和一个 checkpointer。
2. **Run**：图在 `tools` 之前停下。状态被持久化。
3. **API**：回复用户 "awaiting approval"。
4. **Reviewer**：从 `app.get_state(config)` 读取待处理的 `tool_calls`。
5. **Approve**：在同一个 `thread_id` 上发送 `Command(resume=True)`。
6. **Deny**：用 `app.update_state` 写入拒绝消息，然后恢复。

## 标准库图：暂停与恢复
type: flow
from: phases/14-agent-engineering/13-langgraph-stateful-graphs/code/main.py, phases/14-agent-engineering/13-langgraph-stateful-graphs/docs/en.md

1. **classify**：把 `route` 设为 refund、bug 或 sales。
2. **Router**：`add_conditional_edges` 从 `route` 中挑选分支节点。
3. **Branch**：写入一个 `ticket`，例如 `BUG-...`。
4. **human_gate**：没有 `human_approval`，于是设置 `_pause_reason`。
5. **Runner**：保存状态，然后抛出 `PausedAtNode`。
6. **Human**：`load_latest(session)`，把 `human_approval` 设为 True。
7. **Resume**：`runner.run(..., resume_from="send", state_override=...)`。

## 持久化任务状态
type: architecture
from: projects/durable-agent-jobs/solution/stage1.go, projects/durable-agent-jobs/solution/stage2.go, projects/durable-agent-jobs/solution/stage3.go

```arch
node | new | 1,1 | NewJob | version 0 |
node | q | 2,1 | queued | waits for a claim | queue
node | r | 3,1 | running | LeaseUntil = now + ttl | process
node | c | 4,1 | completed | LeaseUntil 0 | store
node | lim | 2,2 | ErrLimit | Attempts at cap |
edge | new | q |
edge | q | r | ClaimJob
edge | r | c | Finish
edge | r | q | Reclaim
edge | q | lim | cap
```

## 运行任务队列
type: command-table
from: projects/durable-agent-jobs/README.md, projects/durable-agent-jobs/API.md

| 命令 | 作用 |
|---|---|
| `go build -o /tmp/durable-jobs .` | 构建参考 worker |
| `enqueue --store "$STORE" --input samples/jobs.json` | 添加 id/text 记录 |
| `worker --store "$STORE" --max-jobs 100` | 认领并运行任务 |
| `status --store "$STORE"` | 显示任务、效果和范围 |
| `worker ... --crash-after effect` | 写出回执后以 86 退出 |
| `worker ... --now-ms 111 --lease-ms 10` | 恢复已过期的认领 |
| `--crash-after claim` | 在任何输出产生前崩溃 |
| `go run . demo` | 自动化的效果崩溃序列 |

## Worker 默认值
type: defaults
from: projects/durable-agent-jobs/API.md, projects/durable-agent-jobs/solution/main.go, projects/durable-agent-jobs/solution/stage4.go, projects/durable-agent-jobs/README.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `--lease-ms` | 30000 | 认领租约，单位毫秒 |
| `--max-attempts` | 3 | 达到上限时任务仍可见 |
| `--max-jobs` | 1 | 每次 worker 调用处理的任务数 |
| `--delay-ms` | 0 | 范围 0..60000 |
| `--now-ms` | -1 | 表示当前墙钟时间 |
| `--store` | jobs-data | 本地目录 |
| 快照大小 | 4 MiB | 超过则 `ErrLimit` |

## 故障排查
type: troubleshooting
from: phases/11-llm-engineering/16-langgraph-state-machines/docs/en.md, phases/14-agent-engineering/13-langgraph-stateful-graphs/docs/en.md, projects/durable-agent-jobs/README.md, projects/durable-agent-jobs/API.md, projects/durable-agent-jobs/solution/stage3.go

| 现象 | 原因 | 解决 |
|---|---|---|
| 丢了半轮内容 | 没有 `add_messages` reducer | `Annotated[list, add_messages]` |
| 无法恢复或时间回溯 | 没有 checkpointer | 测试用 `MemorySaver`，生产用真实存储 |
| 批准前已造成损害 | 中断放在副作用之后 | 在有副作用的节点之前中断 |
| 恢复时工具状态丢失 | checkpoint 太小 | 序列化完整状态 |
| 恢复得到不同结果 | 节点不确定 | 记录种子、时钟和 API 响应 |
| 旧 worker 的完成失败 | 版本或租约已变化 | 符合预期。`Finish` 隔离过时的 worker |
| 入队 `conflict` | 旧 ID 下的文本变了 | 使用新的标识符 |
| 退出码 86 | 设置了 `--crash-after` | 符合预期。再运行一次 worker |

## 问答
type: qa
from: phases/11-llm-engineering/16-langgraph-state-machines/docs/en.md, phases/14-agent-engineering/13-langgraph-stateful-graphs/docs/en.md, projects/durable-agent-jobs/README.md, projects/durable-agent-jobs/solution/stage2.go, projects/durable-agent-jobs/solution/stage3.go

- **以 `None` 作为输入会怎样？** 从给定 checkpoint 重放。
- **为什么崩溃一次后完成时是 v4？** 认领、重新认领、认领和完成各加 1。
- **执行是恰好一次吗？** 不是。是至少一次。
- **为什么没有重复回执？** 本地不可变回执让效果具有幂等性。
- **`Reclaim` 何时触发？** 运行中的任务 `now` 达到或超过 `LeaseUntil` 时。
- **哪三种拓扑？** Supervisor、swarm 和分层式。

## 提示
type: tips
from: phases/11-llm-engineering/16-langgraph-state-machines/docs/en.md, phases/14-agent-engineering/13-langgraph-stateful-graphs/docs/en.md, projects/durable-agent-jobs/README.md

- 先给节点命名。每个决策或副作用都是一个节点。
- 把 `plan` 和 `budget` 等任务字段从 `messages` 中提出来。
- 优先用线性链，偶尔分支。
- 把审批放在进入有副作用节点的那条边上。
- 不要把任务存储放在 NFS 上。
- 每个可重复的崩溃测试都用一个新的存储。
