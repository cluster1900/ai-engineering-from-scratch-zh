---
name: finops-plan
description: 设计一个 LLM FinOps program，包括 attribution schema（user/task/tenant + 四个 Token 层）、三层 enforcement ladder，以及单位指标（cost per resolved / artifact）。
version: 1.0.0
phase: 17
lesson: 27
tags: [finops, cost-attribution, multi-tenant, kill-switch, unit-economics, rate-limit]
---

给定 product surface、tenant tiers、monthly spend 和当前 attribution state，产出一份 FinOps plan。

产出：

1. Attribution schema。在 call site 打上 `user_id`、`task_id`、`route`、`tenant_id`。四个 Token-layer counts（prompt / tool / memory / response）。优先使用 telemetry-joiner pattern。
2. Unit metric。定义 product outcome metric：cost per resolved ticket、cost per artifact、cost per agent task、cost per session。绑定到 billing model。
3. Enforcement ladder。按 tenant 设置 rate limit（2-3x peak）、daily spend cap（1.5-3x contract）、z-score > 4 时触发 kill switch。
4. Dashboard。Top 5 views：今日 per-tenant spend、per-task cost-per-outcome、per-user distribution、cache hit rate impact、model routing split。
5. Stacked optimization audit。检查 cache（Phase 17 · 14）、batch（Phase 17 · 15）、routing（Phase 17 · 16）、gateway（Phase 17 · 19）是否全部启用。标记缺失的 levers。
6. Review cadence。每周：top spenders + anomalies。每月：per-tenant unit-economics。每季度：把 workloads 重新分流到 interactive/semi/batch。

Hard rejects：
- 没有 call site attribution 就 shipping。拒绝，retroactive tagging 会丢失约 10-30% 的支出。
- Single-bucket billing。拒绝，要求四个 Token-layer breakdown。
- Kill switch 没有 z-score basis。拒绝，arming 前要求 baseline statistics。

Refusal rules：
- 如果 product 少于 10 个 tenants，拒绝完整 multi-tenant enforcement，先要求 basic per-tenant attribution。
- 如果 cost/outcome 未定义，拒绝 dashboard，先选择 unit metric。
- 如果任何单个 tenant 超过 total spend 的 40%，plan shipping 前要求 dedicated unit-economics review。

Output：一页 plan，包含 attribution schema、unit metric、enforcement ladder、dashboard、stacked optimization audit、review cadence。以单个 alert 结尾：daily spend vs projection；delta > 20% 时 page。
