# 生产扩展 — 队列、Checkpoints、Durability

> 将 multi-agent systems 扩展到数千个并发运行，需要 **durable execution**。LangGraph 的 runtime 会在每个 super-step 后写入一个由 `thread_id` 标识的 checkpoint（默认使用 Postgres）；worker 崩溃会释放 lease，另一个 worker 会接手恢复。Agents 可以无限期休眠，等待人工输入。**MegaAgent** (arXiv:2408.09955) 运行了一个按 agent 划分的 producer-consumer queue，包含三种状态（Idle / Processing / Response）和两层协调（组内聊天 + 组间管理聊天）。对于 LLM streaming，**Fiber/async** 优于 thread-per-job：threads 99% 的时间都在空闲等待 tokens，而 fibers 会在 I/O 上协作式让出。反方观点：Ashpreet Bedi 的 "Scaling Agentic Software" 主张在负载证明需要之前使用 **FastAPI + Postgres + nothing else**，简单架构比预期走得更远。本课会构建一个 durable checkpoint log、一个带状态转换的 per-agent work queue、一个 async-vs-thread demo，并落地务实的“从简单开始”规则。

**Type:** Learn + Build
**Languages:** Python (stdlib, `asyncio`, `sqlite3`)
**前置要求：** Phase 16 · 09 (Parallel Swarm Networks), Phase 16 · 13 (Shared Memory)
**Time:** ~75 minutes

## 问题

一个 prototype multi-agent system 在一台 laptop 上用三个 agents 和一个 in-memory event loop 能正常工作。你把它迁移到生产环境：

- Agents 有时会运行数小时（长研究任务、human-in-the-loop 等待）。
- Worker processes 会崩溃。重启会丢失状态。
- 峰值负载是平均负载的 10 倍；你需要水平扩展。
- 用户按 agent-run 付费；你需要用于计费的 exactly-once semantics。

in-memory event loop 无法处理这些问题。你需要在底层增加一个 durable execution layer。2026 年的典型选项是：

1. 带 checkpoints 的 workflow engine（Temporal、LangGraph runtime）。
2. 带 state store 的 message queue（Postgres + SQS/RabbitMQ）。
3. Actor-model frameworks（MegaAgent 的 per-agent producer-consumer）。
4. 手写 FastAPI + Postgres（Bedi 的观点）。

本课会构建每种方案的微型版本。

## 概念

### Durable execution，这个模式

durable-execution engine 会在每个 "step"（LangGraph 术语中的 super-step）之后持久化完整 program state。崩溃时：

```
worker crashes mid-step
  -> lease timeout
  -> another worker picks up the thread_id
  -> resumes from last checkpoint
  -> no duplicate side effects
```

要让它工作，需要满足：

- **Serializable state。** 所有 agent state 都必须可持久化。带有实时 database connections 的 function closures 无法存活。
- **Deterministic resume。** 给定相同 state 和相同 inputs，agent 会产生相同 actions（或者将 LLM calls 委托给外部 deterministic oracle）。
- **Idempotent side effects。** External calls（tool calls、payments）必须是 idempotent，或使用 deduplication key。

LangGraph 在每个 super-step 后写 checkpoint；Temporal 在每个 activity 后写；Restate 使用 event-sourced journals。三者实现的是同一个模式。

### LangGraph 的 runtime

每个 agent 都有一个 `thread_id`；state 是 typed dict；每个 super-step 都向 checkpoints table 写入一行。恢复时，runtime 从最后一个 checkpoint 继续，而不是从头开始。Agents 可以 `interrupt()` 来等待人工输入；runtime 会持久化并释放 worker。当输入到达时，任意 worker 都可以恢复。

这是 2026 年 4 月的参考生产设计。

### MegaAgent 的 per-agent queue

arXiv:2408.09955 描述了一个 scale experiment：一个 cluster 中有数千个并发 agents。架构如下：

```
agent i:
  state ∈ {Idle, Processing, Response}
  in_queue   <- messages addressed to agent i
  out_queue  -> replies + side effects

coordinators:
  intra-group chat  (agents in the same group)
  inter-group admin chat  (high-level routing)
```

两层协调允许组内 conversation 高密度发生，而组间保持稀疏。这是在数千个 agents 中保持成本线性的模式。

### Async vs thread-per-job

LLM calls 是 I/O-bound。等待下一个 token 的 thread 99% 的时间都是空闲的。每个 thread 约消耗 1MB RAM；在 10,000 个并发 calls 时，光 stacks 就需要 10GB。

Fibers（Python `asyncio`、Go goroutines、Rust `tokio`）会在 I/O 上协作式让出。同样 10,000 个 calls 可以轻松放进一个 process。到了 LLM-agent 规模，async 不是优化，而是架构。

例外：CPU-bound post-processing（embedding、tokenizer 技巧）仍然需要 threads 或 processes。把 I/O layer 和 CPU layer 分离。

### Bedi 的反方观点

"Scaling Agentic Software"（Ashpreet Bedi，2026）认为，多数团队在测量负载之前就过度工程化。务实默认方案是：

- FastAPI + Postgres。
- 每个 agent run 是一行；state 使用 optimistic concurrency 原地更新。
- 通过 `pg_notify` 或简单 Celery worker 执行 background jobs。
- 在 application code 中实现 retry policy。

对于低于约 100 个并发 agent-runs、任务可控的负载，这通常已经足够。等你测到它失败时再升级。

规则是：当你遇到简单架构无法解决的具体问题时，再采用 durable-execution frameworks。过早采用会把时间消耗在没有回报的仪式上。

### Exactly-once semantics

对于付费 agent runs，你需要 "exactly-once effective"（at-least-once delivery + idempotent consumer）。工程做法包括：

- **每个 run 一个 dedup key。** 在每个 side-effect call 中包含它。
- **Outbox pattern。** Side effects 先写入一个 table，再由独立 process 执行。两个步骤都要 idempotent。
- **Compensating transactions。** 当 side effect 成功但 tracking write 失败时，安排补偿操作。

这些是 database-engineering patterns，不是 LLM-specific。LLM tax 只在于 LLM calls 很慢；其他都是标准 distributed systems。

### Rainbow deployment

Anthropic 的 multi-agent research system 使用 "rainbow deployments"：多个 agent runtime 版本并发运行，这样长时间运行的 agents 不必在每次 code deploy 时被杀掉。对一小部分流量 canary 新版本；当旧版本的 agents 结束后再淘汰旧版本。

这是 long-running stateful systems 的标准做法；2026 年的适配点在于 agents 可以存活数小时，因此 deployment cycles 必须兼容这一点。

### 典型生产 checklist

- Durable state（checkpoints、snapshots，或 outbox + replayable log）。
- Idempotent side effects。
- 用于 LLM calls 的 async I/O layer。
- 带 dedup 的 at-least-once delivery。
- 面向 stateful workloads 的 rainbow/canary deployment。
- Observability：per-agent traces、super-step audit、retry counter。

## 构建它

`code/main.py` 实现了：

- `CheckpointStore` — SQLite-backed checkpoint log，使用 thread-id keys。每个 super-step 追加一行。
- `run_with_checkpoint(agent, thread_id)` — 模拟 mid-run 崩溃；第二个 worker 从最后一个 checkpoint 恢复。
- `AgentQueue` — per-agent Idle / Processing / Response state machine，带一个小型 work queue。
- `demo_async_vs_threads()` — 通过 asyncio 和 threads 运行 500 个并发模拟 "LLM calls"；报告 wall-clock 和 peak memory（近似）。

运行：

```
python3 code/main.py
```

预期输出：模拟崩溃后 checkpoint resume 成功；async version 在 < 1s 内处理 500 个并发 calls；thread version 需要数秒，并且每个并发单元使用的 memory 高出数个数量级。

## 使用它

`outputs/skill-scaling-advisor.md` 会根据负载、state-retention 需求和 deploy 频率，建议 durable-execution 选择：FastAPI + Postgres、LangGraph runtime、Temporal 或 custom。

## 发布它

典型生产加固：

- **从简单开始（Bedi 的规则）。** 使用 FastAPI + Postgres，直到你测到它失败。
- **在优化之前 instrument everything。** Per-run latency histogram、per-step time、retry count、failure categorization。
- **为 side effects 使用 outbox pattern。** 尤其是 payments 和 external API calls。
- **Rainbow deploys。** deploys 期间永远不要杀掉 in-flight agent runs。
- **当你遇到具体问题时采用 durable-execution engines（Temporal / LangGraph / Restate）：** hour-long human-in-the-loop waits、cross-region coordination、复杂 retry/compensation policies。
- **I/O layer 使用 async。** Threads 只用于 CPU-bound post-processing。

## 练习

1. 运行 `code/main.py`。确认 checkpoint resume 生效；测量 async vs thread concurrency 差异。
2. 实现一个 **outbox** table：每个 tool call 先写入 outbox，然后由单独的 goroutine/task 执行。通过运行两次 tool call 来验证 idempotency。
3. 模拟一个 **rainbow deploy**：两个并发 runtime versions；将一半新的 thread_ids 路由到各自版本；确认旧版本上的 in-flight threads 不会被中断。
4. 阅读下面链接中的 LangGraph runtime doc。识别 runtime 中哪些功能在手写 FastAPI + Postgres 版本中最耗时。那是采用它的理由，还是可以延后？
5. 阅读 MegaAgent (arXiv:2408.09955) Section 3。两层协调（intra-group + inter-group admin chat）是显式的。画出你会如何将它映射到带两类 queue families 的 message queue。

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| Durable execution | "Persist the program state" | Engine 在每个 super-step 后写入 state；crash recovery 是 deterministic 的。 |
| Super-step | "Transactional boundary" | Checkpoints 之间的 work unit。LangGraph 术语。 |
| thread_id | "Agent run identifier" | 绑定 checkpoints 和 resume logic 的 key。 |
| Idempotency | "Safe to retry" | 重复一个 side effect 产生的结果与一次尝试相同。 |
| Outbox pattern | "Decouple side effects" | 将 intent 写入 table；独立 executor 执行并标记完成。 |
| At-least-once delivery | "Possible duplicates" | Message queue semantics；dedup key 让 consumer 达到 effective-once。 |
| Rainbow deploy | "Overlapping versions" | 长时间运行 workloads 期间多个 runtime versions 并发存在。 |
| Async fiber | "Cooperative yielding" | User-mode concurrency；对于 I/O-bound loads，相比 threads 成本很低。 |
| Checkpoint | "State snapshot" | super-step 边界处的 serialized state；是 resume 的 key。 |

## 延伸阅读

- [LangChain — The runtime behind production deep agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) — LangGraph runtime design
- [MegaAgent](https://arxiv.org/abs/2408.09955) — per-agent producer-consumer queue；数千个并发 agents 下的两层协调
- [Matrix](https://arxiv.org/abs/2511.21686) — 使用 message queues 作为 coordination substrate 的 decentralized framework
- [Temporal docs](https://docs.temporal.io/) — durable execution 的参考 workflow engine
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — 包括 rainbow deployment 在内的生产经验
