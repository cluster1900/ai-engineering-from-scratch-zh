# Capstone 11 — LLM 可观测性与 Eval Dashboard

> Langfuse 转向 open-core。Arize Phoenix 发布了 2026 GenAI semconv 映射。Helicone 和 Braintrust 都加码了按用户成本归因。Traceloop 的 OpenLLMetry 成为事实上的 SDK instrumentation。生产形态是用 ClickHouse 存 traces，用 Postgres 存 metadata，用 Next.js 做 UI，再加上一小支 eval jobs（DeepEval、RAGAS、LLM-judge）在 sampled traces 上运行。构建一个 self-hosted 版本，至少从四类 SDK family ingest，并演示在五分钟内捕获一个注入的 regression。

**Type:** Capstone
**Languages:** TypeScript (UI), Python / TypeScript (ingest + evals), SQL (ClickHouse)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P11 · P13 · P17 · P18
**Time:** 25 小时

## 问题
到 2026 年，每个运行生产流量的 AI 团队都会在 model 旁边保留一个 observability plane。成本归因。幻觉检测。漂移监控。jailbreak 信号。SLO dashboards。PII 泄露告警。开源参考实现 — Langfuse、Phoenix、OpenLLMetry — 已经围绕 OpenTelemetry GenAI semantic conventions 收敛为 ingest schema。现在你可以用一个 SDK instrumentation 覆盖 OpenAI、Anthropic、Google、LangChain、LlamaIndex 和 vLLM，并发送兼容的 spans。

你将构建一个 self-hosted dashboard，它至少从四类 SDK family ingest，针对 sampled traces 运行一小组 eval jobs，检测漂移并发出告警。衡量门槛：给定一个故意注入的 regression（一个开始产生 PII 的 prompt），dashboard 能在五分钟内捕获它并触发告警。

## 概念
Ingest 使用 OTLP HTTP。SDK 生成 GenAI-semconv spans：`gen_ai.system`、`gen_ai.request.model`、`gen_ai.usage.input_tokens`、`gen_ai.response.id`、`llm.prompts`、`llm.completions`。Spans 落入 ClickHouse 做 columnar analytics；metadata（users、sessions、apps）落入 Postgres。

Evals 作为 batch jobs 在 sampled traces 上运行。DeepEval 评估 faithfulness、toxicity 和 answer relevance。当 trace 携带 retrieval context 时，RAGAS 评估 retrieval metrics。自定义 LLM-judges 运行 domain-specific checks（PII leak、off-policy response）。Eval runs 会作为链接到 parent trace 的 eval spans 写回同一个 ClickHouse。

Drift detection 观察随时间变化的 Embedding 空间分布（基于 prompt Embeddings 的 PSI 或 KL divergence）以及 eval-score 趋势。Alerts 进入 Prometheus Alertmanager，然后到 Slack / PagerDuty。UI 使用 Next.js 15 和 Recharts。

## 架构
```
production apps:
  OpenAI SDK  +  Anthropic SDK  +  Google GenAI SDK
  LangChain + LlamaIndex + vLLM
       |
       v
  OpenTelemetry SDK with GenAI semconv
       |
       v  OTLP HTTP
  collector (ingest, sample, fan-out)
       |
       +-------------+-----------+
       v             v           v
   ClickHouse    Postgres    S3 archive
   (spans)       (metadata)  (raw events)
       |
       +---> eval jobs (DeepEval, RAGAS, LLM-judge)
       |     sampled or all-trace
       |     write eval spans back
       |
       +---> drift detector (PSI / KL on prompt embeddings)
       |
       +---> Prometheus metrics -> Alertmanager -> Slack / PagerDuty
       |
       v
   Next.js 15 dashboard (Recharts)
```

## 技术栈
- Ingest: OpenTelemetry SDKs + GenAI semantic conventions; OTLP HTTP transport
- Collector: OpenTelemetry Collector，带 tail-sampling processor（用于成本控制）
- Storage: ClickHouse for spans, Postgres for metadata, S3 for raw event archive
- Evals: DeepEval, RAGAS 0.2, Arize Phoenix evaluator pack, custom LLM-judge
- Drift: PSI / KL on pooled prompt embeddings (sentence-transformers) weekly
- Alerting: Prometheus Alertmanager -> Slack / PagerDuty
- UI: Next.js 15 App Router + Recharts + server actions
- 开箱即用支持的 SDKs: OpenAI, Anthropic, Google GenAI, LangChain, LlamaIndex, vLLM

## 构建它
1. **Collector config.** 配置 OpenTelemetry Collector，包含 OTLP HTTP receiver、一个保留 100% error traces 和 10% success traces 的 tail-sampler，以及导出到 ClickHouse 和 S3 的 exporters。

2. **ClickHouse schema.** 表 `spans` 的 columns 镜像 GenAI semconv：`gen_ai_system`、`gen_ai_request_model`、`input_tokens`、`output_tokens`、`latency_ms`、`prompt_hash`、`trace_id`、`parent_span_id`，再加一个用于长 payloads 的 JSON bag。按 user_id 和 app_id 添加 secondary indexes。

3. **SDK coverage test.** 使用每个 SDK（OpenAI、Anthropic、Google、LangChain、LlamaIndex、vLLM）和 OpenLLMetry auto-instrument 编写一个小型 client app。验证每个 SDK 都能生成 canonical GenAI spans，并落入 ClickHouse。

4. **Eval jobs.** 一个 scheduled job 读取最近 15 分钟的 sampled traces，并运行 DeepEval faithfulness、toxicity 和 answer relevance。输出是链接到 parent trace 的 eval spans。

5. **Custom LLM-judge.** 一个 PII-leak judge：给定一个 response，调用一个 guard LLM 来评分 PII leak 的可能性。高分 responses 进入 triage queue。

6. **Drift detection.** Weekly job 计算本周 pooled prompt Embeddings 与过去 4 周 baseline 之间的 PSI。如果 PSI 超过 threshold，则告警。

7. **Dashboard.** 使用 Next.js 15，包含页面：overview（spans/sec、cost/user、p95 latency）、traces（search + waterfall）、evals（faithfulness trend、toxicity）、drift（PSI over time）、alerts。

8. **Alerting chain.** Prometheus exporter 读取 eval score aggregates 和 latency percentiles；Alertmanager 将 warnings 路由到 Slack，将 critical breaches 路由到 PagerDuty。

9. **Regression probe.** 注入一个 bug：被评估的 chatbot 有 1% 的概率开始泄露假的 SSNs。测量 MTTR：从 bug deployed 到 Slack alert。

## 使用它
```
$ curl -X POST https://my-otel-collector/v1/traces -d @trace.json
[collector]  accepted 1 trace, 3 spans
[clickhouse] inserted 3 spans (app=chat, user=u_42)
[eval]       DeepEval faithfulness 0.82, toxicity 0.03
[drift]      weekly PSI 0.08 (below 0.2 threshold)
[ui]         live at https://obs.example.com
```

## 交付它
`outputs/skill-llm-observability.md` 是交付物。给定一个 LLM application，dashboard 能 ingest 它的 traces、运行 evals、对 drift 发出告警，并在 Next.js 中展示 cost/user breakdown。

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Trace-schema coverage | 生成 canonical GenAI spans 的 SDK families 数量（目标：6+） |
| 20 | Eval correctness | DeepEval / RAGAS scores 对比 hand-labeled set |
| 20 | Dashboard UX | 注入 regression 的 MTTR（目标低于 5 分钟） |
| 20 | Cost / scale | 持续以 1k spans/sec ingest 且无 backlog |
| 15 | Alerting + drift detection | Prometheus/Alertmanager chain 端到端演练 |
| **100** | | |

## 练习
1. 为 Haystack framework 添加 custom instrumentation。验证 canonical spans 以忠实的 `gen_ai.*` attributes 落入 ClickHouse。

2. 在同一批 traces 上把 DeepEval 换成 Phoenix evaluators。测量两个 eval engines 之间的 score drift。

3. 强化 drift detector：按 app-id 而不是全局计算 PSI。展示 per-app drift trails。

4. 添加一个 "user impact" 页面：cost-per-user 和 failure-rate-per-user，并带有 sparklines。

5. 构建一个 tail-sampling policy：保留 100% toxicity > 0.5 的 traces，再对其余 traces 做 10% stratified sample。测量引入的 sampling bias。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GenAI semconv | "OTel LLM attributes" | 2025 OpenTelemetry spec，用于 LLM span attributes（system、model、tokens） |
| Tail sampling | "Post-trace sample" | Collector 在 trace 完成后决定保留还是丢弃（可以查看 errors） |
| PSI | "Population stability index" | 比较两个分布的 drift metric；> 0.2 通常表示有意义的 drift |
| LLM-judge | "Eval as model" | 一个 LLM 按 rubric（faithfulness、toxicity、PII）为另一个 LLM 的 output 打分 |
| Tail-sampling policy | "Keep-rule" | 决定哪些 traces 持久化、哪些丢弃的规则；errored + sample-rate |
| Eval span | "Linked eval trace" | 携带 eval score、并链接到原始 LLM call span 的 child span |
| Cost per user | "Unit economics" | 在一个窗口内归因到某个 user_id 的美元成本；关键 product metric |

## 延伸阅读
- [Langfuse](https://github.com/langfuse/langfuse) — 参考 open-core observability 平台
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) — 具备强 drift support 的另一个 reference
- [OpenLLMetry (Traceloop)](https://github.com/traceloop/openllmetry) — auto-instrumentation SDK family
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — ingest schema
- [Helicone](https://www.helicone.ai) — 另一个 hosted observability
- [Braintrust](https://www.braintrust.dev) — 另一个 eval-first platform
- [ClickHouse documentation](https://clickhouse.com/docs) — columnar span store
- [DeepEval](https://github.com/confident-ai/deepeval) — evaluator library
