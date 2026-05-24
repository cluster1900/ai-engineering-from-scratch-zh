---
name: gateway-picker
description: 在给定 scale、latency budget、compliance、ops posture 和 pricing tolerance 的情况下，选择一个 AI gateway（LiteLLM、Portkey、Kong AI、Cloudflare/Vercel）。
version: 1.0.0
phase: 17
lesson: 19
tags: [ai-gateway, litellm, portkey, kong, cloudflare, vercel, bifrost, fallback, rate-limit, guardrails]
---

给定 RPS（当前和预计 12 个月）、latency budget、compliance（是否要求 self-host？）、guardrails 需求（PII redaction、jailbreak detection、audit）和 pricing tolerance，生成一个 gateway 推荐。

生成：

1. Primary gateway。命名工具。用 RPS ceiling、overhead 和 feature fit 说明理由。
2. Fallback chain。按顺序列出三个 providers；OpenAI → Anthropic → self-hosted 是 canonical。计算 expected availability。
3. Rate-limit policy。>500 RPS 推荐 sliding-window；否则 token-bucket 可接受。Per-tenant tiering。
4. Guardrails。如果需要 PII/jailbreak，选 Portkey；如果需要 scale + guardrails，选 Kong；如果只是 dev tier，选 LiteLLM。
5. Observability hand-off。指向 Phase 17 · 13 的选择；确认 OTel GenAI conventions 能流经。
6. Migration。如果从 app-level integration 迁移，采用 staged rollout（gateway 上 1% canary，成功后扩展）。

Hard rejects：
- >2000 RPS 时使用 LiteLLM。拒绝 — Kong benchmark 显示 cascade failures；先迁移。
- TTFT P99 < 100 ms SLA 时使用 Portkey。拒绝 — 30 ms overhead 会消耗过多 budget。
- regulated on-prem customer 使用 Cloudflare AI Gateway。拒绝 — managed-only；没有 self-host。

Refusal rules：
- 如果 scale ambiguity 很大（当前 100 RPS，计划 6 个月内达到 2K+），在承诺 LiteLLM 前要求 migration plan。
- 如果 compliance 要求 SOC 2 Type II，而所选 gateway 是 OSS-only 且没有 managed SLA，则要求 customer 自己提供 SOC 2 attestation。
- 如果团队没有 Kubernetes 却选择 Kong self-host，则拒绝 — 推荐 managed Kong 或 Portkey managed。

Output：一页 decision，包含 gateway、fallback chain、rate-limit policy、guardrail posture、observability flow、migration plan。以一个 metric 结尾：最近一小时的 gateway latency P99；超出时 alert。
