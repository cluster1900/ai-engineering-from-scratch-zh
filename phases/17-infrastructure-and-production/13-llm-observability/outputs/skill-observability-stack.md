---
name: observability-stack
description: 给定 stack、scale、budget 和 license posture，选择一个 LLM observability stack（development platform + gateway + optional scale layer），并定义 OpenTelemetry GenAI attribute set。
version: 1.0.0
phase: 17
lesson: 13
tags: [observability, langfuse, langsmith, phoenix, arize, helicone, opik, opentelemetry, genai-conventions]
---

给定 stack（LangChain / DSPy / raw SDK）、scale（traces/day）、budget、license posture（MIT-only vs commercial OK）和 self-host requirement，产出一个 observability plan。

产出：

1. Development platform choice。Langfuse（OSS）、LangSmith（LangChain-first commercial）、Opik（Comet OSS）或 none。用 stack 和 license 说明理由。
2. Gateway/telemetry choice。Helicone（proxy + gateway）、SigNoz（full APM）、OpenLLMetry（pure OTel）。如果已经在使用 AI gateway（Phase 17 · 19），说明 integration。
3. Scale/lake layer。可选；Arize AX 或 raw Iceberg 用于 long-term analytics，Phoenix 用于 RAG drift。
4. OTel GenAI conventions。指定最小 attribute set：`gen_ai.system`、`gen_ai.request.model`、`gen_ai.usage.input_tokens`、`gen_ai.usage.output_tokens`、`gen_ai.request.temperature`、`gen_ai.response.finish_reasons`，再加上组织特定项（tenant_id、user_id、task）。
5. Sampling policy。100% errors，100% high-cost（>$0.10/call），N% success sampling rate。Raw-retention window（14d / 30d / 90d）。Aggregates 保留更久。
6. Alerting。必须配置 alerts 的五个 metrics：error rate、P99 TTFT、cost/request、prompt-cache hit rate、refusal rate。

Hard rejects:
- 在没有 OTel fallback 的情况下，只在 framework-specific SDK 内部做 instrumentation。拒绝 —— framework lock-in。
- 对非 regulated workload，以 Datadog-class pricing >$500/mo 保留 100% traces。拒绝 —— 建议 sampling。
- 忽略 OpenTelemetry GenAI conventions。拒绝 —— 2026 interop 需要它们。

Refusal rules:
- 如果 traces/day > 5M 且团队坚持 full Datadog retention，在没有 cost forecast 的情况下拒绝。
- 如果团队是 MIT-only 却选择 LangSmith，拒绝 —— Langfuse 是 MIT equivalent。
- 如果团队没有 AI gateway，并选择 Helicone 同时作为 gateway 和 observability，接受 —— proxy 在约 500 RPS 以内可兼作 gateway（Phase 17 · 19 覆盖 gateway scale）。

Output：一页计划，命名 dev platform、gateway、scale layer（如有）、OTel attribute set、sampling rule、五个 alerts。最后给出一个用于提示 stack drift 的单一 metric：过去 7 天内具备完整 OTel GenAI attributes 的 LLM calls 百分比。
