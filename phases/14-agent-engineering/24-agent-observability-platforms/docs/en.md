# Agent 可观测性：Langfuse, Phoenix, Opik

> 三个 open-source Agent 可观测性平台主导了 2026 年。Langfuse (MIT) — 每月 6M+ installs，tracing + prompt management + evals + session replay。Arize Phoenix (Elastic 2.0) — 深入的 Agent 专用 evals、RAG 相关性、OpenInference auto-instrumentation。Comet Opik (Apache 2.0) — 自动化 prompt 优化、guardrails、LLM-judge 幻觉检测。

**类型：** 学习
**语言：** Python (stdlib)
**前置要求：** Phase 14 · 23 (OTel GenAI)
**时间：** 约 45 分钟

## 学习目标

- 说出三个顶级 open-source Agent 可观测性平台及其 license。
- 区分每个平台最擅长的方面：Langfuse (prompt mgmt + sessions)、Phoenix (RAG + auto-instrumentation)、Opik (optimization + guardrails)。
- 解释为什么到 2026 年，89% 的组织报告已经部署 Agent 可观测性。
- 实现一个带有 LLM-judge 评估的 stdlib trace-to-dashboard pipeline。

## 问题

OTel GenAI（Lesson 23）给了你 schema。你仍然需要一个平台来 ingest spans、运行评估、存储 prompt versions，并暴露 regressions。这三个竞争者各自强调生命周期中的不同部分。

## 核心概念

### Langfuse (MIT)

- 每月 6M+ SDK installs，19k+ GitHub stars。
- 功能：tracing、带 versioning + playground 的 prompt management、评估（LLM-as-judge、用户反馈、自定义）、session replays。
- 2025 年 6 月：原先的商业模块（LLM-as-a-judge、annotation queues、prompt experiments、Playground）在 MIT 下 open-sourced。
- 最擅长：带紧密 prompt-management loop 的端到端可观测性。

### Arize Phoenix (Elastic License 2.0)

- 更深入的 Agent 专用评估：trace clustering、anomaly detection、面向 RAG 的 retrieval relevancy。
- 原生 OpenInference auto-instrumentation。
- 可与托管版 Arize AX 配合用于 production。
- 没有 prompt versioning — 定位是与更广泛平台配合使用的 drift/behavioral-regression 工具。
- 最擅长：RAG 相关性、behavioral drift、anomaly detection。

### Comet Opik (Apache 2.0)

- 通过 A/B experiments 实现自动化 prompt 优化。
- Guardrails（PII redaction、topic constraints）。
- LLM-judge 幻觉检测。
- 来自 Comet 自身测量的 benchmark：Opik logs + evals 用时 23.44s，而 Langfuse 为 327.15s（约 14x 差距）— 将 vendor benchmarks 视为方向性参考。
- 最擅长：optimization loop、自动化 experimentation、guardrail enforcement。

### 行业数据

根据 Maxim（2026 年 field analysis）：89% 的组织已经部署 Agent 可观测性；质量问题是最主要的 production 障碍（32% 的受访者提到它们）。

### 如何选择

| 需求 | 选择 |
|------|------|
| 带 prompt management 的一体化方案 | Langfuse |
| 深度 RAG 评估 + drift | Phoenix |
| 自动化 optimization + guardrails | Opik |
| 开放 license，不要 ELv2 | Langfuse (MIT) 或 Opik (Apache 2.0) |
| Datadog / New Relic 集成 | 任意 — 它们都导出 OTel |

### 这个模式容易出错的地方

- **没有 eval strategy。** 没有评估的 tracing 只是昂贵的 logging。
- **没有 grounding 的自建 LLM-judge。** CRITIC pattern（Lesson 05）适用 — judges 需要外部工具进行事实验证。
- **Prompt versions 没有关联到 traces。** 当 prod 出现 regression 时，你无法 bisect 到导致问题的 prompt。

## 构建它

`code/main.py` 实现了一个 stdlib trace collector + LLM-judge evaluator：

- Ingest GenAI 形态的 spans。
- 按 session 分组，标记失败 runs（guardrail trips、低置信度 evals）。
- 一个 scripted LLM-judge，按照 rubric 对 Agent responses 评分。
- 类似 dashboard 的 summary：failure rate、top failure reasons、eval score distribution。

运行：

```
python3 code/main.py
```

输出：每个 session 的 eval scores 和 failure categorization，与 Langfuse/Phoenix/Opik 会展示的内容一致。

## 使用它

- **Langfuse** self-hosted 或 cloud；通过 OTel 或它们的 SDK 接入。
- **Arize Phoenix** self-hosted；auto-instrument OpenInference。
- **Comet Opik** self-hosted 或 cloud；自动化 optimization loop。
- **Datadog LLM Observability** 适合已经运行 Datadog 的混合 ops+ML 团队。

## 交付它

`outputs/skill-obs-platform-wiring.md` 选择一个平台，并将 traces + evals + prompt versions 接入现有 Agent。

## 练习

1. 将一周的 OTel traces 导出到 Langfuse cloud（free tier）。哪些 sessions 失败了？为什么？
2. 为你的领域编写一个 LLM-judge rubric（事实正确性、语气、范围遵循）。在 50 条 traces 上测试。
3. 比较 Langfuse prompt versioning 与 Phoenix 的 trace clustering。哪个能更快告诉你哪里坏了？
4. 阅读 Opik 的 guardrail docs。为你的一个 Agent run 接入 PII redaction guardrail。
5. 在你的 corpus 上 benchmark 这三个平台。忽略 vendor 发布的数字；测量你自己的。

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tracing | “Spans collector” | Ingest OTel / SDK spans；按 session 建索引 |
| Prompt management | “Prompt CMS” | 关联到 traces 的 versioned prompts |
| LLM-as-judge | “Automated eval” | 单独的 LLM 按 rubric 对 Agent output 评分 |
| Session replay | “Trace playback” | 逐步回放过去的 runs 以便 debugging |
| RAG relevancy | “Retrieval quality” | retrieved context 是否匹配 query |
| Trace clustering | “Behavioral grouping” | 对相似 runs 聚类，用于 drift detection |
| Guardrail enforcement | “Policy at log time” | 对 logged content 做 PII/toxicity/scope checks |

## 延伸阅读

- [Langfuse docs](https://langfuse.com/) — tracing、evals、prompt mgmt
- [Arize Phoenix docs](https://docs.arize.com/phoenix) — auto-instrumentation、drift
- [Comet Opik](https://www.comet.com/site/products/opik/) — optimization + guardrails
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — 三个平台都会消费的 schema
