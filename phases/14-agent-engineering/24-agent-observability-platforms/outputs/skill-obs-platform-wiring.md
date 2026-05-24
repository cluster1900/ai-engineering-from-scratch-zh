---
name: obs-platform-wiring
description: 选择一个可观测性平台（Langfuse、Phoenix、Opik、Datadog），并将 traces + evals + prompt versions 接入现有 Agent。
version: 1.0.0
phase: 14
lesson: 24
tags: [observability, langfuse, phoenix, opik, datadog, tracing]
---

给定一个 Agent runtime 和产品需求，选择一个可观测性平台并 scaffold wiring。

决策：

1. 需要 prompt management + session replay 集中在一个地方 -> **Langfuse**。
2. 需要深度 RAG relevancy + drift/anomaly detection -> **Phoenix**。
3. 需要自动化 prompt optimization + PII guardrails -> **Opik**。
4. 已经运行 Datadog -> **Datadog LLM Observability**（从 v1.37+ 开始原生映射 GenAI）。
5. 需要无 ELv2 的 license -> **Langfuse** (MIT) 或 **Opik** (Apache 2.0)；对于纯 OSS distribution，避免 Phoenix。

产出：

1. OTel GenAI instrumentation（Lesson 23）— 这是共同底座。
2. 平台专用 SDK 或 OTel exporter 配置。
3. 面向你的领域的 LLM-judge rubric（事实正确性、范围、语气、拒答质量）。
4. Prompt versioning 接入 traces（Langfuse），或 trace clustering config（Phoenix），或 experiment definitions（Opik）。
5. Logged content 上的 guardrails：PII redaction、secret scrubbing。
6. Dashboards：session health、failure taxonomy、latency distribution、cost per session。

硬性拒绝：

- 没有 evals 就 shipping。单独的 tracing 是昂贵的 logging。
- 使用没有外部验证的自写 LLM-judge。CRITIC pattern（Lesson 05）：judges 需要外部工具进行事实 grounding。
- 在 span bodies 中存储 PII。始终使用外部存储 + reference IDs。

拒绝规则：

- 如果用户要求“一个平台解决所有问题”，拒绝并提供上面的决策。没有单一平台在三个维度上都占优。
- 如果产品没有为每个 Agent task 定义 acceptance criteria，拒绝交付 evals。LLM-judge 需要 rubric；rubric 需要产品决策。
- 如果用户想要“no sampling, capture everything”，拒绝。Trace volume 会随 traffic 线性扩展；在规模化时必须使用 sampling（head-based 或 tail-based）。

输出：`instrumentation.py`、`judge.py`、`dashboards.md`、`README.md`，解释平台选择、rubric、sampling strategy 和 incident response。最后用“what to read next”指向 Lesson 30（eval-driven development）或 Lesson 26（failure-mode taxonomy）。
