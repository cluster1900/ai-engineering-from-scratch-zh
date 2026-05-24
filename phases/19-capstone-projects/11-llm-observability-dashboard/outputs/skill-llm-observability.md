---
name: llm-observability
description: 构建一个 self-hosted LLM observability dashboard，用于 ingest OpenTelemetry GenAI spans、运行 evals，并在五分钟内捕获注入的 regressions。
version: 1.0.0
phase: 19
lesson: 11
tags: [capstone, observability, otel, langfuse, phoenix, evals, drift, clickhouse]
---

给定跨至少六类 SDK family（OpenAI、Anthropic、Google GenAI、LangChain、LlamaIndex、vLLM）的生产 LLM 流量，部署一个 self-hosted observability plane，用于 ingest OTLP GenAI-semconv spans、运行 evals、检测 drift 并发出告警。

Build plan:

1. OpenTelemetry Collector，包含 OTLP HTTP receiver、tail-sampling processor（保留 100% errors、10% success、100% high-toxicity/PII），以及导出到 ClickHouse + S3 的 exporters。
2. ClickHouse span schema 镜像 GenAI semconv：gen_ai.system、gen_ai.request.model、usage.input/output_tokens、latency_ms、user_id、app_id，再加一个用于 prompts/completions 的 JSON bag。
3. Postgres metadata store，用于 apps、users、sessions、annotation queue。
4. 为每个 SDK family 的 client app 配置 OpenLLMetry auto-instrumentation；验证 canonical spans 落入。
5. DeepEval + RAGAS + Phoenix evaluator pack 定期在 sampled traces 上运行；为 PII 和 off-policy 配置 custom LLM-judge。
6. Weekly PSI / KL drift detector 运行在 pooled prompt Embeddings 上；alert threshold 为 0.2。
7. Prometheus exporter 提供 eval score aggregates 和 latency percentiles；Alertmanager 路由到 Slack（warning）+ PagerDuty（critical）。
8. Next.js 15 App Router dashboard：overview、trace search + waterfall、eval trends、drift chart、alerts。
9. Regression probe：注入一种 response pattern，使其以 1% 的概率泄露假的 SSNs；测量 MTTR（alert-fire time）。

Assessment rubric:

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | Trace-schema coverage | 生成 canonical GenAI spans 的 SDK families 数量（目标 6+） |
| 20 | Eval correctness | DeepEval / RAGAS scores 对比 hand-labeled set |
| 20 | Dashboard UX | 注入 regression 的 MTTR（目标低于 5 分钟） |
| 20 | Cost / scale | 持续 1k spans/sec ingest 且无 backlog |
| 15 | Alerting + drift detection | Prometheus/Alertmanager chain 端到端演练 |

Hard rejects:

- Span schemas 发明了 OpenTelemetry GenAI semconv 中不存在的 attribute names。
- Tail-sampling policies 丢弃 errors（一个众所周知的 anti-pattern）。
- Evals 不经 sampling 就按 ingest rate 运行（成本不可接受）。
- Dashboards 显示 "latency" 但不区分 p50/p95/p99。

Refusal rules:

- 没有 PII redaction policy 时，拒绝持久化 prompts 或 completions。
- 没有 per-SDK canonical-span regression test 时，拒绝声称 "multi-SDK support"。
- 没有 baseline window 时，拒绝发布 drift detection；zero-shot drift 没有用。

Output: 一个 repo，包含 collector config、ClickHouse schema、Next.js 15 dashboard、eval jobs、drift detector、alerting chain、带 annotated regressions 的 10k-trace demo dataset，以及一份 write-up，记录注入的 PII regression 的 MTTR，并说明经过迭代后让 MTTR 下降的前三个 dashboard UX improvements。
