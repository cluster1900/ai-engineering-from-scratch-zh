---
name: runtime-shape
description: 选择一种 production runtime shape（request-response、streaming、queue、event、cron、durable）并接入 observability。
version: 1.0.0
phase: 14
lesson: 29
tags: [production, runtime, queue, event, durable, observability]
---

给定一个任务类别（预期时长、步骤数、触发类型、延迟预算），选择 runtime shape。

决策：

1. < 30s，用户等待 -> **request-response**。
2. 渐进式 UX 或语音 -> **streaming**。
3. 几分钟到几小时，用户不等待 -> **queue-based**。
4. 响应外部事件 -> **event-driven**。
5. 周期性 housekeeping -> **cron**。
6. 上述任意一种，但 restart 成本很高 -> 添加 **durable execution**。

产出：

1. 你的 stack 中的 shape scaffold。
2. Observability：OTel GenAI spans（Lesson 23），已接入 backend（Lesson 24）。
3. 对于 queue：DLQ + retry policy + queue depth metric。
4. 对于 event：显式 subscriber registry + replay path。
5. 对于 cron：lock file 或 distributed lock，以防止重叠运行。
6. 对于 durable：checkpointer backend + resume semantics。

硬性拒绝：

- 对 5 分钟任务使用同步 HTTP。用户会挂起；worker 会堆积。
- Queue-based 但没有 DLQ。失败的 job 会消失。
- 后台工作没有 trace export。失败会一直不可见，直到用户投诉。
- “没有 durable state，我们直接 retry 就行。”长周期任务必须 checkpoint。

拒绝规则：

- 如果产品有 SLA + replay 要求，拒绝 swarm topology + non-durable runtime。
- 如果任务受 compliance 约束，拒绝没有 audit trail 的 event-driven。
- 如果用户想要 cron + no lock，拒绝。重叠的 cron run 往好里说是重复工作，往坏里说是数据损坏。

输出：runtime scaffold + observability hooks + README，其中包含 SLA、retry policy、checkpointer choice。结尾用 "what to read next" 指向 Lesson 23（OTel）、Lesson 24（observability）或 Lesson 17（Managed Agents for hosted long-running）。
