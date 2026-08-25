# Stateful Graph 编排——Durable Execution 与 Checkpoint

> Agent 是状态机；node 是函数；edge 是转换；每个 node 执行后都会创建状态 Checkpoint。发生任何故障时，都可以从最后一个成功的 Checkpoint 恢复。LangGraph 是 2026 年这种底层 Stateful Orchestration Model 的参考实现。

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~75 分钟

## 学习目标

- 描述 LangGraph 的核心 Model：包含 typed state、function node、conditional edge 和 post-node Checkpoint 的状态机。
- 说出 docs 强调的四项能力：durable execution、streaming、human-in-the-loop、comprehensive memory。
- 解释 LangGraph 支持的三种编排拓扑：supervisor、peer-to-peer（swarm）、hierarchical（嵌套 subgraph）。
- 实现一个 stdlib state graph，其中包含 typed state、conditional edge 和 Checkpoint/resume 循环。

## 问题

Agent 和 workflow 面临同一个问题：当一个包含 40 个步骤的执行过程在第 38 步失败时，你希望从第 38 步恢复，而不是从头开始。将 state 视为次要概念的 Model，会迫使操作人员围绕一个假定每次都全新运行的库拼凑 retry 逻辑。

LangGraph 的设计答案是：state 是一等 typed object，state 变更必须显式执行，并且每个 node 之后都会持久化 Checkpoint。恢复只需调用 `load_state(session_id)`。

## 概念

### Graph

graph 由以下部分定义：

- **State type。** 每个 node 都会读取和修改的 typed dict（或 Pydantic model）。
- **Node。** 纯函数 `(state) -> state_update`。函数返回后，update 会合并到 state 中。
- **Edge。** node 之间的 conditional 或 direct transition。
- **入口和出口。** `START` 和 `END` sentinel node 用于标记边界。

示例：一个包含 `classify`、`refund`、`bug`、`sales`、`done` node 的 Agent——即表示为 graph 的 routing workflow。

### Durable execution

每个 node 返回后，runtime 都会序列化 state，并将其写入 checkpointer（SQLite、Postgres、Redis 或自定义 backend）。在第 N 步发生故障时，runtime 可以执行 `resume(session_id)`，使用完全一致的 state 从第 N+1 步继续。

LangGraph docs 明确列出了这一能力发挥作用的生产用户：Klarna、Uber、J.P. Morgan。关键不在于 graph 形态本身，而在于 graph 形态与 Checkpoint 结合后能够降低恢复成本。

### Streaming

每个 node 都可以 yield 部分输出。graph 会向调用方流式发送每个 node 的 delta event，使 UI 能够在 graph 运行时持续更新。

### Human-in-the-loop

在 node 之间检查并修改 state。实现方式包括：在关键 node 前暂停、向人工展示 state、接受修改，然后恢复执行。checkpointer 让这一过程变得简单，因为 state 已经完成序列化。

### Memory

短期记忆（单次运行内部——state 中的对话历史）和长期记忆（跨运行——通过 checkpointer 和单独的长期存储实现持久化）。LangGraph 通过 Tool 与外部记忆系统（Mem0、自定义系统）集成。

### 三种拓扑

1. **Supervisor。** 中央 router LLM 将任务分派给专业 subagent。使用 `langgraph-supervisor` 中的 `create_supervisor()`（不过 LangChain 团队在 2026 年建议直接通过 Tool 调用实现，以获得更强的 Context 控制能力）。
2. **Swarm / peer-to-peer。** Agent 通过共享 Tool 接口直接 handoff，不使用中央 router。
3. **Hierarchical。** 由 supervisor 管理 sub-supervisor，通过嵌套 subgraph 实现。

### 此模式容易出错的地方

- **Checkpoint 范围过小。** 只为对话轮次创建 Checkpoint，会导致 Tool state 和记忆写入无法恢复。必须序列化完整 state。
- **非确定性 node。** resume 假定相同的 node 输入会产生相同的 state update。必须捕获随机种子、wall-clock 和外部 API。
- **过度使用 conditional edge。** 如果每条 edge 都是 conditional，这个状态机将难以推理。优先使用仅偶尔分支的线性 chain。

```figure
langgraph-state
```

## 动手构建

`code/main.py` 实现了一个 stdlib Stateful Graph：

- `State`——包含 `messages`、`step`、`route`、`output`、`human_approval` 的 typed dict。
- `Node`——接收 state 并返回 update dict 的 callable。
- `StateGraph`——node + edge + conditional edge + 运行 + 恢复。
- `SQLiteCheckpointer`（内存 fake）——在每个 node 后序列化 state；`load(session_id)` 用于恢复。
- 一个演示 graph：classify -> branch(refund / bug / sales) -> human gate -> send。

运行：

```
python3 code/main.py
```

trace 展示了第一次运行在 human gate 处失败、state 被持久化，然后 resume 生成最终输出的过程。

## 实际使用

- **LangGraph**——已可用于生产环境的参考实现。可以使用 `create_react_agent`、`create_supervisor`，也可以构建自己的 graph。
- **AutoGen v0.4**（Lesson 14）——适用于高并发场景的 actor model 替代方案。
- **Claude Agent SDK**（Lesson 17）——包含内置 session store 的 managed harness。
- **自定义实现**——适用于需要精确控制 state 形态或 checkpointer backend 的情况。

## 交付成果

`outputs/skill-state-graph.md` 可在任意目标 runtime 中生成 LangGraph 风格的 state graph，并接入 Checkpoint 和 resume。

## 练习

1. 当 Classification 置信度低于阈值时，添加一条从 `classify` 到 `end` 的 conditional edge。在人工手动设置 `route` 后恢复运行。
2. 将类似 SQLite 的 fake 替换为真实的 SQLite checkpointer。测量每一步的序列化开销。
3. 实现 parallel edge：两个 node 并发运行，通过自定义 reducer 合并。immutable state 在这里能带来什么？
4. 阅读 `langgraph-supervisor` reference。将玩具实现移植到 `create_supervisor`。比较 trace 的形态。
5. 添加 streaming：每个 node 在运行时 yield 部分 state。在 delta 到达时将其打印出来。

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|----------------|------------------------|
| State graph | “作为状态机的 Agent” | Typed state + node + edge + reducer |
| Checkpointer | “持久化 backend” | 在每个 node 后序列化 state；支持 resume |
| Reducer | “状态合并器” | 将当前 state 与 node update 合并的函数 |
| Conditional edge | “分支” | 由 state 函数选择的 edge |
| Subgraph | “嵌套 graph” | 在另一个 graph 内部作为 node 使用的 graph |
| Durable execution | “从故障中恢复” | 使用完全一致的 state，从最后一个成功的 node 重新启动 |
| Supervisor | “Router LLM” | 面向专业 subagent 的中央 dispatcher |
| Swarm | “P2P Agent” | Agent 通过共享 Tool 进行 handoff；没有中央 router |

## 延伸阅读

- [LangGraph 概览](https://docs.langchain.com/oss/python/langgraph/overview)——参考 docs
- [langgraph-supervisor 参考](https://reference.langchain.com/python/langgraph/supervisor/)——supervisor 模式 API
- [AutoGen v0.4，Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/)——actor-model 替代方案
- [Claude Agent SDK 概览](https://platform.claude.com/docs/en/agent-sdk/overview)——session store 和 subagent
