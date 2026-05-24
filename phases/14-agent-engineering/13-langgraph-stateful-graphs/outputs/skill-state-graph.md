---
name: state-graph
description: 构建一个 LangGraph-shaped 状态机，包含 typed state、conditional edges、per-node checkpointing 和 durable resume。
version: 1.0.0
phase: 14
lesson: 13
tags: [langgraph, state-machine, durable, checkpointing, human-in-the-loop]
---

给定一个目标 runtime、一个 state shape、一组 node functions，以及一个 checkpointer backend，生成一个 stateful agent graph。

产出：

1. 一个 typed `State`（dict 或 Pydantic）。记录每个 field。Nodes 读取 state；它们返回 updates。
2. 一个 `StateGraph`，包含 `add_node`、`add_edge`、`add_conditional_edges`、`set_entry`，以及 `START`/`END` sentinels。
3. 一个 `Checkpointer` interface，包含 `save(session_id, node, state)` 和 `load_latest(session_id)`。默认使用 SQLite；允许 Postgres/Redis/custom。
4. 一个 `Runner`，它逐步执行 graph，在每个 node 后序列化 state，捕获用于 human-in-the-loop 的 `PausedAtNode`，并支持带可选 `state_override` 的 `resume_from`。
5. 三个 topology helpers：supervisor（central router）、swarm（shared-tool handoffs）、hierarchical（subgraphs）。

硬性拒绝：

- 没有显式捕获 random-seed 或 wall-clock 的 non-deterministic nodes。Resume 假设给定 input state 后 node output 可复现。
- 只保存 “summary” state 的 checkpointer。必须序列化 full state，否则 resume 会失效。
- 每条 edge 都是 conditional 的 graphs。优先使用 linear chains，只偶尔分支。

拒绝规则：

- 如果用户要求没有 persistence 的 state graph，则拒绝。核心意义就是 durable resume；如果不需要 resume，请使用 Lesson 12 中的 workflow patterns。
- 如果用户要求 “checkpoint only on success”，则拒绝。失败也需要 state，因为 debugging 从那里开始。
- 如果 graph 超过约 30 个 nodes，则拒绝 flat layout，并要求 nested subgraphs。Flat 30-node graphs 无法审查。

输出：`state.py`、`graph.py`、`checkpointer.py`、`runner.py`、`README.md`，解释 state schema、checkpointer choice 和 resume semantics。最后以 “what to read next” 结尾，指向 Lesson 14 的 actor-model 替代方案、Lesson 16 的 handoffs/guardrails layer，或 Lesson 23 的 graph steps 上的 OTel spans。
