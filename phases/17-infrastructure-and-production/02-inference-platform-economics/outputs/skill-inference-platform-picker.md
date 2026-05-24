---
name: inference-platform-picker
description: 根据 workload、SLA、预算和运营约束选择 inference platform（Fireworks、Together、Baseten、Modal、Replicate、Anyscale 或 custom silicon）。规范化 per-token、per-minute 和 per-prediction 定价。
version: 1.0.0
phase: 17
lesson: 02
tags: [inference, fireworks, together, baseten, modal, replicate, anyscale, economics]
---

给定一个 workload profile（model、tokens/day、持续利用率、TTFT SLA、burst factor、compliance、Python vs mixed stack），产出一个平台推荐。

产出：

1. Primary platform。命名平台和具体 pricing tier（serverless vs dedicated vs batch）。用匹配的 workload 特征来说明理由，例如：“Fireworks serverless，因为 TTFT < 500 ms 是 SLA，且流量是 bursty 的。”
2. Effective cost。将所选 pricing model 规范化为 $/M output tokens。与至少两个替代方案比较。指出 per-minute 何时优于 per-token（持续利用率高于约 30%），或反之。
3. Cold-start plan。对于 serverless 选择（Fireworks、Modal、Replicate），说明预期 cold-start latency 和一个缓解措施（pre-warming、min_workers=1、live-migration）。对于 dedicated 选择（Baseten、Anyscale），跳过本节，但说明 trade-off。
4. Runner-up。命名第二个平台，并说明你会切换的明确条件（例如：“如果我们签下一个要求 HIPAA + dedicated GPUs 的 enterprise deal，就迁移到 Baseten”）。
5. Gateway layer。推荐是否在平台前加一层 AI gateway（LiteLLM、Portkey、Kong AI Gateway），以隔离产品与 provider churn。默认：yes，除非规模低于 500 RPS。

Hard rejects:
- 未规范化就比较 per-token 和 per-minute。拒绝并坚持使用 effective $/M tokens。
- 因为 Fireworks “最快”就选择它，而没有根据已发布 benchmarks 验证 TTFT SLA。
- 为任何非 latency-bound 的 workload 推荐 custom silicon（Groq、Cerebras、SambaNova）。它们定价有溢价，只有在 interactive SLAs 上才有正当性。

Refusal rules:
- 如果 workload 要求 regulated framework（SOC 2 Type II、HIPAA），且客户选择了 Modal 或 Replicate，则拒绝，因为二者没有 Baseten 或 Anyscale 那样的 enterprise footprint。建议 Baseten。
- 如果预期流量低于 100k tokens/day，拒绝推荐 per-minute（Baseten、Modal、Anyscale）。经济性不成立，应默认选择 marketplace（OpenRouter、DeepInfra）或 managed hyperscaler。
- 如果客户想要“最便宜的”，拒绝，因为需要命名多维成本函数（token rate + cold start + attribution + gateway + DX）。

Output：一页推荐，命名 primary platform、effective cost、cold-start plan、runner-up、gateway posture。以一个能够揭示误选的单一 metric 结尾（cold-start P99、per-token rate 或 utilization drift）。
