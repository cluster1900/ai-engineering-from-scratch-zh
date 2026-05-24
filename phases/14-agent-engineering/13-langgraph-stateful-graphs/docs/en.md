# LangGraph：Stateful Graphs 与 Durable Execution

> LangGraph 是 2026 年 low-level stateful orchestration 的参考标准。Agent 是一个状态机；nodes 是函数；edges 是状态转移；state 是 immutable 的，并且在每一步之后 checkpoint。任何失败都可以从中断处精确 resume。

**类型：** 学习 + 构建
**语言：** Python (stdlib)
**先修要求：** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**时间：** ~75 分钟

## 学习目标

- 描述 LangGraph 的核心模型：带有 immutable state、function nodes、conditional edges 和 post-step checkpoints 的状态机。
- 说出文档强调的四项能力：durable execution、streaming、human-in-the-loop、comprehensive memory。
- 解释 LangGraph 支持的三种 orchestration topologies：supervisor、peer-to-peer (swarm)、hierarchical (nested subgraphs)。
- 实现一个 stdlib state graph，包含 immutable state、conditional edges，以及 checkpoint/resume cycle。

## 问题

Agents 和 workflows 有一个共同问题：当一个 40 步的运行在第 38 步失败时，你希望从第 38 步 resume，而不是从头开始。二等 state model 会让 operators 围绕一个假设每次都是全新运行的 library 去手写 retry。

LangGraph 的设计答案是：state 是一等 typed object，mutations 是显式的，并且 checkpoints 会在每个 node 之后持久化。Resume 就是一次 `load_state(session_id)` 调用。

## 概念

### graph

一个 graph 由以下部分定义：

- **State type.** 一个 typed dict（或 Pydantic model），每个 node 都会读取并修改它。
- **Nodes.** 纯函数 `(state) -> state_update`。Updates 会在返回后合并进 state。
- **Edges.** Nodes 之间的 conditional 或 direct transitions。
- **Entry and exit.** `START` 和 `END` sentinel nodes 标记边界。

示例：一个包含 `classify`、`refund`、`bug`、`sales`、`done` nodes 的 Agent，即一个 graph 形式的 routing workflow。

### Durable execution

每个 node 返回后，runtime 会序列化 state，并将其写入 checkpointer（SQLite、Postgres、Redis、自定义）。如果在第 N 步失败，runtime 可以 `resume(session_id)`，并带着精确 state 从第 N+1 步继续。

LangGraph 文档明确强调了这一点对 production users 的重要性：Klarna、Uber、J.P. Morgan。核心主张不只是 graph shape；而是 graph shape 加上 checkpointing 让恢复成本变低。

### Streaming

每个 node 都可以 yield partial output。graph 会向 caller stream per-node-delta events，让 UI 能在 graph 运行时更新。

### Human-in-the-loop

在 nodes 之间检查并修改 state。实现方式：在 critical node 前暂停，将 state 展示给 human，接受修改，然后 resume。Checkpointer 让这件事变得简单，因为 state 已经被序列化。

### Memory

Short-term（一次运行内，即 state 中的 conversation history）和 long-term（跨运行，即通过 checkpointer 加上独立 long-term store 持久化）。LangGraph 通过 tools 与外部 memory systems（Mem0、自定义）集成。

### 三种 topologies

1. **Supervisor.** Central router LLM 分发给 specialist subagents。`langgraph-supervisor` 中的 `create_supervisor()`（不过 LangChain 团队在 2026 年建议直接通过 tool calls 来做，以获得更好的 context control）。
2. **Swarm / peer-to-peer.** Agents 通过 shared tool surface 直接 hand off。没有 central router。
3. **Hierarchical.** Supervisors 管理 sub-supervisors，以 nested subgraphs 实现。

### 这种模式容易出错的地方

- **Checkpoints too small.** 只 checkpoint conversation turns 会让 tool state 和 memory writes 无法恢复。Full state 必须可序列化。
- **Non-deterministic nodes.** Resume 假设 node inputs 会产生相同的 state update。Random seeds、wall-clock、external APIs 都必须被捕获。
- **Over-use of conditional edges.** 每条 edge 都是 conditional 的 graph，是一个无法推理的状态机。优先使用 linear chains，只偶尔分支。

## 构建它

`code/main.py` 实现了一个 stdlib stateful graph：

- `State`：一个 typed dict，包含 `messages`、`step`、`route`、`output`、`human_approval`。
- `Node`：接收 state 并返回 update dict 的 callable。
- `StateGraph`：nodes + edges + conditional edges + run + resume。
- `SQLiteCheckpointer`（in-memory fake）：在每个 node 后序列化 state；`load(session_id)` 恢复。
- 一个 demo graph：classify -> branch(refund / bug / sales) -> human gate -> send。

运行它：

```
python3 code/main.py
```

Trace 会显示第一次运行在 human gate 失败、完成持久化，然后 resume 并产生最终 output。

## 使用它

- **LangGraph**：参考实现，production-ready。使用 `create_react_agent`、`create_supervisor`，或构建你自己的 graph。
- **AutoGen v0.4**（Lesson 14）：适用于 high-concurrency scenarios 的 actor model 替代方案。
- **Claude Agent SDK**（Lesson 17）：带 built-in session store 的 managed harness。
- **Custom**：当你需要对 state shape 或 checkpointer backend 进行精确控制时使用。

## 交付它

`outputs/skill-state-graph.md` 会在任意目标 runtime 中生成一个 LangGraph-shaped state graph，并接好 checkpointing 与 resume。

## 练习

1. 当 classification confidence 低于阈值时，从 `classify` 添加一条 conditional edge 到 `end`。在 human 手动设置 `route` 后 resume 运行。
2. 将类似 SQLite 的 fake 替换为真正的 SQLite checkpointer。测量每一步的 serialization overhead。
3. 实现 parallel edges：两个 nodes 并发运行，并通过 custom reducer 合并。Immutable state 在这里带来了什么？
4. 阅读 `langgraph-supervisor` reference。把 toy 移植到 `create_supervisor`。比较 trace shapes。
5. 添加 streaming：每个 node 在运行时 yield partial state。打印到达的 deltas。

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| State graph | “Agent 即状态机” | Typed state + nodes + edges + reducers |
| Checkpointer | “Persistence backend” | 在每个 node 后序列化 state；支持 resume |
| Reducer | “State merger” | 将当前 state 与 node update 组合起来的函数 |
| Conditional edge | “Branch” | 由 state 函数选择的 edge |
| Subgraph | “Nested graph” | 作为另一个 graph 中 node 使用的 graph |
| Durable execution | “从失败处 resume” | 使用精确 state 从最后一个成功 node 重启 |
| Supervisor | “Router LLM” | 面向 specialist subagents 的 central dispatcher |
| Swarm | “P2P agents” | Agents 通过 shared tools hand off；没有 central router |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — reference docs
- [langgraph-supervisor reference](https://reference.langchain.com/python/langgraph/supervisor/) — supervisor pattern API
- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — actor-model 替代方案
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — session store 与 subagents
