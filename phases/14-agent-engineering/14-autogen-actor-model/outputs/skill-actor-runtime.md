---
name: actor-runtime
description: 构建一个 AutoGen v0.4 形态的 actor runtime，具备 private state、每个 actor 一个 inbox、仅通过 message 的 IPC、fault isolation，以及 dead-letter queue。
version: 1.0.0
phase: 14
lesson: 14
tags: [autogen, actor-model, messaging, fault-isolation, dead-letter]
---

给定一个 multi-agent 任务，产出一个 actor runtime 以及所需的 agent actors。

产出：

1. 一个 `Message` type，包含 `sender`、`recipient`、`topic`、`body`、`mid`。
2. 一个 `Actor` base class，包含 `receive(message, runtime)`。Actor state 是私有的。
3. 一个 `Runtime`，包含 shared queue、`send()`、`run_until_idle()`，以及 dead-letter queue。handler 中的 exception 进入 DLQ；不要向外传播。
4. 一个 topology helper：RoundRobin（固定轮转）、Selector（LLM 选择下一个），或自定义 broadcast。
5. 每条 message 的 observability hooks：按照 Lesson 23，为每条 message emit OTel spans，并带有 `gen_ai.agent.name` 和 `gen_ai.operation.name`。

硬性拒绝：

- 同步 message passing，即 sender 阻塞直到 recipient 返回。这是 v0.2 model；它会破坏 fault isolation。
- actors 之间共享 mutable state。Actors 只能通过 messages 读取 state，或者完全不读取。
- 会传播 handler exceptions 的 runtime。Failures 应进入 DLQ；让其他 actors 继续运行。

拒绝规则：

- 如果任务只有两个 actors，并且是固定的来回交互，拒绝 actor framing，并建议使用 prompt chain（Lesson 12）。当有 >=3 个 actors 或 async concurrency 时，actors 的成本才值得付出。
- 如果用户为了“更容易 debugging”而想要 "synchronous mode"，拒绝。改为建议 logging + tracing（Lesson 23）。
- 如果 domain 严格是 request/response，并且只有一个 specialist，建议使用 routing（Lesson 12），而不是 actor team。

输出：`message.py`、`actor.py`、`runtime.py`、`teams.py`、`README.md`，说明 DLQ policy、topology choice，以及 OTel spans 如何接线。最后以 "what to read next" 结尾：如果 actors 需要协商，指向 Lesson 25（multi-agent debate）；如果需要 tracing，指向 Lesson 23（OTel）；如果想要面向未来的 runtime，指向 Microsoft Agent Framework。
