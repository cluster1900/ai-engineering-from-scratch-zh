# 生产扩展：队列、Checkpoint 与持久性

> 将 Multi-Agent 系统扩展到数千个并发运行实例，需要**持久化执行**：使用工作队列和 Checkpoint，使任何 worker 都能在任意崩溃后恢复任何运行实例，前提是已正确处理 lease、幂等副作用和确定性重放。LangGraph runtime 是参考示例：它在每个 super-step 后写入一个以 `thread_id` 为 key 的 Checkpoint（默认使用 Postgres）；worker 崩溃时会释放 lease，另一个 worker 随后恢复执行。Agent 可以无限期休眠，等待人工输入。**MegaAgent**（arXiv:2408.09955）为每个 Agent 运行一个生产者-消费者队列，其中包含三个状态（Idle / Processing / Response）和两层协调机制（组内聊天 + 组间管理员聊天）。对于 LLM 流式传输，**Fiber/async** 优于每个任务一个线程的模式：线程有 99% 的时间都在空闲等待 Token，而 Fiber 会在 I/O 时协作式让出执行权。作为反面观点，Ashpreet Bedi 的《Scaling Agentic Software》主张，在负载证明有必要之前，只使用 **FastAPI + Postgres + nothing else**，因为简单架构的适用范围往往比预期更广。本课将构建持久化 Checkpoint 日志、具有状态转换的每 Agent 工作队列以及 async 与线程的对比演示，并最终落实务实的“从简单方案开始”原则。

**Type:** 学习 + 构建
**Languages:** Python（stdlib、`asyncio`、`sqlite3`）
**Prerequisites:** Phase 16 · 09（Parallel Swarm Networks）、Phase 16 · 13（Shared Memory）
**Time:** 约 75 分钟

## 问题

一个 Multi-Agent 系统原型使用内存事件循环，在一台笔记本电脑上由三个 Agent 运行。将它迁移到生产环境后：

- Agent 有时会运行数小时，例如长时间研究或等待 human-in-the-loop 操作。
- worker 进程会崩溃，重启会丢失状态。
- 峰值负载是平均负载的 10 倍，需要进行水平扩展。
- 用户按 Agent 运行次数付费，因此收费需要 exactly-once 语义。

内存事件循环无法处理其中任何一个问题。你需要在其下方增加持久化执行层。2026 年的典型选择包括：

1. 带 Checkpoint 的 workflow engine（Temporal、LangGraph runtime）。
2. 配合状态存储的消息队列（Postgres + SQS/RabbitMQ）。
3. Actor-model 框架（MegaAgent 的每 Agent 生产者-消费者模式）。
4. 手动构建的 FastAPI + Postgres（Bedi 的主张）。

本课将构建每种方案的微型版本。

## 概念

### 持久化执行模式

持久化执行引擎会在每个“步骤”之后持久化完整程序状态；在 LangGraph 中，这种步骤称为 super-step。发生崩溃时：

```
worker crashes mid-step
  -> lease timeout
  -> another worker picks up the thread_id
  -> resumes from last checkpoint
  -> no duplicate side effects
```

要让这一机制正常工作，需要满足以下要求：

- **可序列化状态。** 所有 Agent 状态都必须能够持久化。包含活动数据库连接的函数 closure 无法在恢复后继续存在。
- **确定性恢复。** 对于相同的状态和输入，Agent 会产生相同的行动；或者在调用 LLM 时交由外部确定性 oracle 处理。
- **幂等副作用。** 外部调用（Tool 调用、支付）必须具有幂等性，或使用去重 key。

LangGraph 在每个 super-step 后写入 Checkpoint；Temporal 在每个 activity 后写入；Restate 使用 event-sourced journal。这三者都实现了相同的模式。

### 每步一个 Checkpoint 的 runtime

LangGraph runtime 是完整示例：每个 Agent 都有一个 `thread_id`；状态是 typed dict；每个 super-step 都会向 Checkpoint 表中写入一行。恢复时，runtime 会从最后一个 Checkpoint 开始重放，而不是从头开始。Agent 可以调用 `interrupt()` 等待人工输入；runtime 会持久化状态并释放 worker。输入到达后，任何 worker 都可以恢复执行。

这是 2026 年 4 月的参考生产设计。

### MegaAgent 的每 Agent 队列

arXiv:2408.09955 描述了一项规模实验：一个集群中运行着数千个并发 Agent。其架构如下：

```
agent i:
  state ∈ {Idle, Processing, Response}
  in_queue   <- messages addressed to agent i
  out_queue  -> replies + side effects

coordinators:
  intra-group chat  (agents in the same group)
  inter-group admin chat  (high-level routing)
```

两层协调允许组内进行密集对话，同时让组间通信保持稀疏。这种模式可在存在数千个 Agent 时使成本保持线性增长。

### Async 与每个任务一个线程的对比

LLM 调用受 I/O 限制。等待下一个 Token 的线程有 99% 的时间处于空闲状态。每个线程消耗约 1MB RAM；在 10,000 个并发调用下，仅线程栈就会消耗 10GB。

Fiber（Python `asyncio`、Go goroutine、Rust `tokio`）会在 I/O 时协作式让出执行权。同一个进程可以轻松容纳 10,000 个调用。在 LLM Agent 规模下，async 不是优化措施，而是架构本身。

例外情况：受 CPU 限制的后处理，例如 Embedding 和 Tokenizer 技巧，仍然适合使用线程或进程。应将 I/O 层与 CPU 层分开。

### Bedi 的反面观点

Ashpreet Bedi 在 2026 年的《Scaling Agentic Software》中主张，大多数团队在测量负载之前就进行了过度设计。务实的默认方案是：

- FastAPI + Postgres。
- 每次 Agent 运行对应一行数据，使用乐观并发控制就地更新状态。
- 通过 `pg_notify` 或简单的 Celery worker 处理后台任务。
- 在应用代码中实现重试策略。

对于并发 Agent 运行数低于约 100 且任务规模可控的负载，通常只需要这些组件。当测量结果表明它已无法满足需求时，再进行升级。

原则是：当遇到简单架构无法解决的具体问题时，再采用持久化执行框架。过早采用会把时间消耗在无法产生回报的繁琐流程上。

### Exactly-once 语义

对于付费 Agent 运行，需要实现“有效 exactly-once”，即至少一次交付加幂等消费者。工程实现方法包括：

- **每次运行使用去重 key。** 在每个副作用调用中包含该 key。
- **Outbox pattern。** 副作用先写入表，再由独立进程执行。两个步骤都需要具备幂等性。
- **补偿事务。** 当副作用执行成功但跟踪记录写入失败时，调度补偿操作。

这些是数据库工程模式，并非 LLM 特有。LLM 带来的额外成本只在于调用速度较慢；其他部分都属于标准分布式系统问题。

### Rainbow deployment

Anthropic 的 Multi-Agent 研究系统使用“rainbow deployment”：同时运行多个版本的 Agent runtime，这样每次部署代码时都不必终止长期运行的 Agent。先让新版本承接一部分流量进行 canary；旧版本中的 Agent 全部结束后，再停用旧版本。

这是长期运行的有状态系统中的标准做法。2026 年的适配点在于，Agent 可能存活数小时，因此部署周期必须对此作出安排。

### 典型生产检查清单

- 持久化状态（Checkpoint、snapshot，或 outbox + 可重放日志）。
- 幂等副作用。
- 为 LLM 调用提供 async I/O 层。
- 配合去重机制的至少一次交付。
- 为有状态工作负载提供 rainbow/canary deployment。
- 可观察性：每 Agent trace、super-step 审计和重试计数器。

```figure
sw-checkpoint-replay
```

## 动手构建

`code/main.py` 实现了：

- `CheckpointStore`：由 SQLite 支持并使用 thread-id key 的 Checkpoint 日志。每个 super-step 都会追加一行。
- `run_with_checkpoint(agent, thread_id)`：模拟运行过程中发生崩溃，随后由第二个 worker 从最后一个 Checkpoint 恢复。
- `AgentQueue`：具有小型工作队列的每 Agent Idle / Processing / Response 状态机。
- `demo_async_vs_threads()`：分别通过 asyncio 和线程运行 500 个并发模拟“LLM 调用”，并报告实际耗时和近似的内存峰值。

运行：

```
python3 code/main.py
```

预期输出：模拟崩溃后能够成功从 Checkpoint 恢复；async 版本可在不到 1 秒内处理 500 个并发调用；线程版本需要数秒时间，而且每个并发单元的内存使用量会高出多个数量级。

## 实际应用

`outputs/skill-scaling-advisor.md` 会根据负载、状态保留需求和部署频率，就持久化执行方案提供建议：FastAPI + Postgres、LangGraph runtime、Temporal 或自定义方案。

## 交付成果

典型的生产强化措施：

- **从简单方案开始（Bedi 原则）。** 使用 FastAPI + Postgres，直到测量结果表明它无法满足需求。
- **在优化前检测所有内容。** 记录每次运行的延迟直方图、每步耗时、重试次数和失败分类。
- **对副作用使用 Outbox pattern。** 尤其是支付和外部 API 调用。
- **Rainbow deployment。** 部署过程中绝不终止正在运行的 Agent。
- **在遇到具体问题时采用持久化执行引擎（Temporal / LangGraph / Restate）：** 例如持续数小时的 human-in-the-loop 等待、跨区域协调以及复杂的重试或补偿策略。
- **I/O 层使用 async。** 线程只用于受 CPU 限制的后处理。

## 练习

1. 运行 `code/main.py`。确认能够从 Checkpoint 恢复，并测量 async 与线程在并发处理上的差异。
2. 实现一个 **outbox** 表：每个 Tool 调用先写入 outbox，再由独立的 goroutine/task 执行。通过执行两次 Tool 调用来验证幂等性。
3. 模拟一次 **rainbow deployment**：同时运行两个 runtime 版本，将一半的新 `thread_id` 分配给每个版本；确认旧版本中正在运行的 thread 不会中断。
4. 阅读下方链接中的 LangGraph runtime 文档。找出在手动构建的 FastAPI + Postgres 版本中，哪些 runtime 功能需要最长时间才能复刻。这是否足以成为采用该方案的理由，还是可以推迟？
5. 阅读 MegaAgent（arXiv:2408.09955）第 3 节。双层协调机制（组内 + 组间管理员聊天）得到了明确描述。请勾勒如何将它映射到具有两个队列系列的消息队列。

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|----------------|------------------------|
| 持久化执行 | “持久化程序状态” | 引擎在每个 super-step 后写入状态；崩溃恢复具有确定性。 |
| Super-step | “事务边界” | Checkpoint 之间的工作单元，是 LangGraph 的术语。 |
| thread_id | “Agent 运行标识符” | 将 Checkpoint 与恢复逻辑绑定在一起的 key。 |
| 幂等性 | “可以安全重试” | 重复执行某个副作用所产生的结果与执行一次相同。 |
| Outbox pattern | “解耦副作用” | 将执行意图写入表中，再由独立执行器处理并标记为完成。 |
| 至少一次交付 | “可能出现重复” | 消息队列语义；去重 key 使消费者实现有效单次处理。 |
| Rainbow deployment | “版本重叠运行” | 长期运行的工作负载执行期间，同时运行多个 runtime 版本。 |
| Async fiber | “协作式让出执行权” | 用户态并发；对于受 I/O 限制的负载，其成本低于线程。 |
| Checkpoint | “状态 snapshot” | super-step 边界处的序列化状态，是恢复执行的关键。 |

## 延伸阅读

- [LangChain — The runtime behind production deep agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) — LangGraph runtime 设计
- [MegaAgent](https://arxiv.org/abs/2408.09955) — 每 Agent 生产者-消费者队列；数千个并发 Agent 规模下的双层协调
- [Matrix](https://arxiv.org/abs/2511.21686) — 以消息队列为协调基础的去中心化框架
- [Temporal docs](https://docs.temporal.io/) — 持久化执行的参考 workflow engine
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — 包括 rainbow deployment 在内的生产经验
