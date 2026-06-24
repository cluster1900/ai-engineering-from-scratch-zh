# 长时间运行的后台 Agents：持久化执行

> 生产级长周期 Agents 不会运行在 `while True` 中。每一次 LLM 调用都会成为一个带有 checkpoint、retry 和 replay 的 Activity。Temporal 的 OpenAI Agents SDK 集成已于 2026 年 3 月 GA。Claude Code Routines (Anthropic) 可以运行定时的 Claude Code 调用，而不需要持久的本地进程。Sessions 会在等待人工输入时暂停，能在部署后继续存在，并从以 `thread_id` 为 key 的最新 checkpoint 恢复。新的易用性背后，是一种旧模式——Workflow 编排——只是多了一个新的输入：LLM 调用作为非确定性的 Activities，必须在恢复时被确定性地 replay。

**Type:** Learn
**Languages:** Python (stdlib, minimal durable-execution state machine)
**先修要求：** Phase 15 · 10 (Permission modes), Phase 15 · 01 (Long-horizon agents)
**Time:** ~60 minutes

## 问题

设想一个运行四小时的 Agent。它调用三个 tools，两次提示用户，并进行四十次 LLM 调用。运行到一半时，承载它的主机重启了。会发生什么？

- 在朴素的 `while True` 循环中：一切都会丢失。Run 从头开始。三个 tool calls（带有真实 side effects）会再次执行。用户会再次被要求批准已经批准过的事项。四十次 LLM 调用会被重新计费。
- 使用持久化执行：Run 会从最近的 checkpoint 恢复。已经完成的 Activities 不会重新执行；它们的结果会从持久化 log 中 replay。用户不需要再次批准已经批准过的事项。已经完成的 LLM 调用不会被重新计费。

这是 Workflow engines 十年来一直交付的同一种模式（Temporal, Cadence, Uber's Cherami）。新变化是 LLM 调用现在也成为一种 Activity——非确定性、昂贵、带有 side effects——并且它们很自然地适配这一模式。

本课的主线是：长周期可靠性会衰减（METR 观察到“35-minute degradation”——成功率大致随周期呈二次下降）。持久化执行让 run 可以超过可靠性曲线所支持的时长；如果设计正确，这是一种新的安全失败方式，如果设计错误，则会以不安全的方式失败。

## 概念

### Activities、Workflows 与 replay

- **Workflow**：确定性的编排代码。定义 Activities 的顺序、分支和等待。它必须是确定性的，这样才能从 event log 中 replay，而不会出现意外分歧。
- **Activity**：一个非确定性、可能失败的工作单元。LLM call、tool call、file write、HTTP request。每个 Activity 都会连同其 inputs，以及完成后的 outputs，一起被记录。
- **Event log**：持久化 backing store。每个 Activity start、complete、fail、retry，以及每个 Workflow decision 都会被记录。
- **Replay**：恢复时，Workflow 代码会从头重新运行；每个已经完成的 Activity 都会返回其已记录的结果，而不会重新执行。只有尚未完成的 Activities 才会实际运行。

这与 React 针对 virtual DOM 重新渲染，或 Git 从 commits 重建 working tree 的形态相同。Orchestrator 的确定性让 durability 变得低成本。

### 为什么 LLM 调用适合这一模式

LLM 调用具有以下特点：
- 非确定性（temperature > 0；即使 temperature 0 也会因 model versions 变化而漂移）。
- 昂贵（成本和延迟）。
- 可能失败（rate limits、timeouts）。
- 带有 side effects（如果它们调用 tools）。

这正是 Activity 的典型画像。把每一次 LLM 调用封装为 Activity，可以获得带 exponential backoff 的 retry、跨重启的 checkpointing，以及可 replay 的调试 trace。

### 以 `thread_id` 为 key 的 Checkpoints

LangGraph、Microsoft Agent Framework、Cloudflare Durable Objects 和 Claude Code Routines 都收敛到同一种 API 形态：一个 `thread_id`（或等价物）标识 session；每次 state transition 都持久化到后端（PostgreSQL 默认，SQLite 用于 dev，Redis 用于 cache）；resume 会读取最新 checkpoint。

后端选择很重要：

- **PostgreSQL**：持久、可查询、可跨部署存活。LangGraph 的默认选择。
- **SQLite**：仅用于本地 dev；跨 host 会丢失数据。
- **Redis**：速度快，但如果未配置 AOF/snapshot 则是临时性的。
- **Cloudflare Durable Objects**：透明分布式；由唯一 key 限定范围；可存活数小时到数周。

### 人工输入作为一等状态

Propose-then-commit（Lesson 15）需要一个持久化的“waiting on human”状态。Workflow 暂停，外部 queue 保存 pending request，approval 会从精确位置恢复执行。没有 durability，这只能是 best-effort；有了 durability，隔夜 approval 到达后，Workflow 可以在早上继续运行。

### 35-minute degradation

METR 观察到，所有被测量的 Agent 类别在连续运行超过约 35 分钟后都会出现可靠性衰减。任务时长翻倍，失败率大致变为四倍。持久化执行不会修复这一点；它只是让你能够运行超过可靠性曲线所支持的时长。安全模式是将 durability 与 re-entry 时需要 fresh HITL 的 checkpoints 结合，并配合 budget kill switches（Lesson 13），无论 wall-clock time 如何都限制总 compute。

### 什么时候持久化执行不是正确答案

- 运行时间短于几分钟且没有人工输入。开销 > 收益。
- 严格只读的信息检索。
- 正确性要求在一个 context window 内端到端完成的任务（某些推理任务；某些一次性生成任务）。


```figure
memory-consolidation
```

## 使用它

`code/main.py` 用 stdlib Python 实现了一个最小持久化执行 engine。它支持：

- `@activity` decorator，将 inputs 和 outputs 记录到 JSON event log。
- 一个用于排列 Activities 顺序的 Workflow function。
- 一个 `run_or_replay(workflow, event_log)` function，可以 replay 已完成的 Activities，而不重新执行它们。

Driver 会模拟一个三 Activity 的 Workflow，在中途崩溃，并展示 (a) 朴素 retry 会重新执行所有内容，而 (b) replay 只运行缺失的 Activity。

## 交付它

`outputs/skill-durable-execution-review.md` 会审查一个拟议的长时间运行 Agent 部署是否具备正确的持久化执行形态：Activities、determinism、checkpoint backend、human-input state，以及 HITL-on-resume policy。

## 练习

1. 运行 `code/main.py`。观察朴素 retry 与 replay 之间 Activity 执行次数的差异。修改 crash point，并展示 replay count 会相应变化。

2. 将 toy engine 改为显式使用 `thread_id`。模拟两个共享同一 engine 的并发 sessions，并确认它们的 event logs 不会冲突。

3. 在 toy engine 中选择一个 Activity。引入一个 non-determinism（Workflow decision 中的 wall-clock timestamp）。演示 replay 时的 divergence。解释真实 engines 如何处理这一点（side-effect registration、`Workflow.now()` APIs）。

4. 阅读 LangChain 的 “Runtime behind production deep agents” 文章。列出 runtime 持久化的每一种 state，并说明每一种覆盖了哪种 failure mode。

5. 为一个 6 小时的 autonomous coding task 设计 checkpoint policy。你会在哪里 checkpoint？resume-on-crash 是什么样？哪些地方需要 fresh HITL？

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|---|---|---|
| Workflow | “Agent 的脚本” | 确定性编排代码；可从 event log replay |
| Activity | “一个步骤” | 非确定性单元（LLM call、tool call）；执行前后都会被记录 |
| Event log | “backing store” | 每一次 state transition 的持久化记录 |
| Replay | “恢复” | 重新运行 Workflow；已完成 Activities 返回已记录结果，不重新执行 |
| Checkpoint | “保存点” | 以 thread_id 为 key 的持久化 state；resume 时最新状态胜出 |
| thread_id | “Session key” | 用来限定 durable state 范围的 identifier |
| 35-minute degradation | “可靠性衰减” | METR：成功率随周期大约呈二次下降 |
| Non-determinism | “replay 漂移” | Wall clock、random、LLM output；必须注册为 side effect |

## 延伸阅读

- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) — budget、turns 与 resume 语义。
- [Microsoft — Agent Framework: human-in-the-loop and checkpointing](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) — RequestInfoEvent 形态。
- [LangChain — The Runtime Behind Production Deep Agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) — 具体 runtime requirements。
- [OpenAI Agents SDK + Temporal integration (Trigger.dev announcement)](https://trigger.dev) — LLM 调用的 Activity 形态。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — 35-minute degradation 参考。
