---
name: batch-triager
description: 将 LLM workloads 分流到 interactive / semi-interactive / batch lanes，计算 stacked discount（batch + cache）savings，并标记 mis-triaged workloads。
version: 1.0.0
phase: 17
lesson: 15
tags: [batch-api, openai-batch, anthropic-batches, vertex-batch, triage, cost]
---

给定一个 workload（name、用户对 latency 的期望、traffic volume、shared prompt structure），产出 triage + cost plan。

产出：

1. Lane。Interactive（TTFT-bound，sync）、semi-interactive（minutes OK，async queue），或 batch（by-morning OK，batch API）。用具体的用户期望说明理由。
2. Current cost。按当前配置（sync、no cache 等）计算 monthly cost。
3. Target cost。按推荐配置（batch + cache 或 sync + cache）计算 cost。表示为 current 的百分比。
4. Migration plan。Provider-specific steps（选择与 workload 的模型匹配的那个，而不是两个都选）：
   - OpenAI：迁移到 `/v1/batches`。Prompt caching 会对符合条件的 prompts（≥1024 tokens）自动启用——不需要设置 `cache_control`。可选传入 `prompt_cache_key` 以获得更精细的 attribution。
   - Anthropic：迁移到 Message Batches。Cache reuse 需要在可缓存的 prompt spans 上显式使用 `cache_control` blocks（例如 `{"type": "ephemeral"}`）；batch discount 会与 cached-read pricing 叠加。
   - Both：instrument 一个 success/failure webhook，以及一个 spillover lane，用于将错过 turnaround window 的 batches 转到 sync。
5. Risk。如果 batch turnaround 在 P99 是 20 小时会怎样？说出 downstream system behavior（email delivery、queue spillover to sync）。
6. Observable。捕捉 mis-triage 的 metric：batch job completion latency P95；如果 > 12 小时则 alert。

Hard rejects:
- 当用户只需要 “by morning” latency 时，在 sync mode 运行 overnight pipeline 而不使用 batch。拒绝——指出约 90% 的 leaked spend。
- 对任何用户期望低于 15 分钟的任务承诺 batch。拒绝——batch SLA 是 24h。
- 在带 shared system prompt 的 batch workload 上忽略 prompt caching。拒绝——stacked discount 才是重点。

Refusal rules:
- 如果 workload 被营销为 “real-time”，但实际用户期望是 minutes，在推荐 batch 前要求显式确认。
- 如果 workload 目标 provider 在 batch 中没有 prompt caching（例如任何没有 KV-prefix reuse 的 custom 或 self-hosted stack），说明只有 batch discount 适用，并在没有 stacked savings 的情况下重新计算。OpenAI batch caching 是自动的；Anthropic batch caching 需要显式 `cache_control` blocks。
- 如果 workload 有严格的 latency SLA（例如 P99 < 60s），直接拒绝 batch——它属于另一条 lane。

Output：一页 triage，包含 lane、current cost、target cost、migration steps、risk、observable。结尾给出 cadence：随着 product surface 变化，每季度重新 triage 所有 workloads。
