# AI Gateways — LiteLLM、Portkey、Kong AI Gateway、Bifrost

> Gateway 位于你的 app 和 model provider 之间。核心功能是 provider routing、fallback、retries、rate limiting、secret references、observability、guardrails。2026 年的市场分化：**LiteLLM** 是 MIT OSS，支持 100+ providers，OpenAI-compatible，但在约 2000 RPS 时会崩溃（8 GB memory，已发布 benchmark 中出现 cascading failures）；最适合 Python、<500 RPS、dev/prototyping。**Portkey** 定位为 control plane（guardrails、PII redaction、jailbreak detection、audit trails），2026 年 3 月转为 Apache 2.0 open-source，latency overhead 为 20-40 ms，production tier 为 $49/mo。**Kong AI Gateway** 基于 Kong Gateway 构建 — Kong 在相同 12 CPUs 上的自有 benchmark：比 Portkey 快 228%，比 LiteLLM 快 859%；定价 $100/model/month（Plus tier 最多 5 个）；如果你已经在使用 Kong，它适合 enterprise。**Bifrost**（Maxim AI）— automatic retries，支持 configurable backoff，OpenAI 429 时 fallback 到 Anthropic。**Cloudflare / Vercel AI Gateways** — managed、zero-ops、basic retry。Data residency 决定 self-host；Portkey 和 Kong 处于中间位置，提供 OSS + optional managed。

**Type:** Learn
**Languages:** Python (stdlib, toy gateway-routing simulator)
**前置要求:** Phase 17 · 01 (Managed LLM Platforms), Phase 17 · 16 (Model Routing)
**Time:** ~60 minutes

## 学习目标
- 列举六个核心 gateway 功能（routing、fallback、retries、rate limits、secrets、observability、guardrails）。
- 将四个 2026 gateway（LiteLLM、Portkey、Kong AI、Bifrost）映射到 scale ceilings 和 use cases。
- 引用 Kong benchmark（相比 Portkey 228%，相比 LiteLLM 859%），并解释它为什么对 >500 RPS 很重要。
- 在给定 data residency 和 ops budget 的情况下选择 self-hosted 或 managed。

## 问题
你的产品调用 OpenAI、Anthropic 和一个 self-hosted Llama。每个 provider 都有不同的 SDK、error model、rate limit 和 auth scheme。你需要 failover（如果 OpenAI 返回 429，就尝试 Anthropic）、单一 credential store、统一 observability，以及按 tenant 的 rate limits。

在 app layer 重新实现这些，会让每个 service 与每个 provider 耦合。Gateway layer 会把它整合到一个 process 中，提供一个 API（通常 OpenAI-compatible），再分发到各个 providers。

## 概念
### Six core features

1. **Provider routing** — 将 OpenAI、Anthropic、Gemini、self-hosted 等放在一个 API 后面。
2. **Fallback** — 遇到 429、5xx 或 quality failure 时，在别处重试。
3. **Retries** — exponential backoff，有界 attempts。
4. **Rate limits** — 按 tenant、key、model。
5. **Secret references** — 运行时从 vault 拉取 credentials（绝不放在 app 中）。
6. **Observability** — OTel + GenAI attributes（Phase 17 · 13）+ cost attribution。
7. **Guardrails** — PII redaction、jailbreak detection、allowed-topics filters。

### LiteLLM — MIT OSS, Python

- 100+ providers、OpenAI-compatible、router config、fallback、basic observability。
- 在 Kong 的 benchmark 中约 2000 RPS 时崩溃；8 GB memory footprint，在 sustained load 下出现 cascading failures。
- 最适合：Python app、<500 RPS、dev/staging gateways、experimental routing。
- Cost：OSS 为 $0；存在 cloud free tier。

### Portkey — control plane positioning

- 截至 2026 年 3 月为 Apache 2.0 OSS。Guardrails、PII redaction、jailbreak detection、audit trails。
- 每个 request 的 latency overhead 为 20-40 ms。
- Production tier 为 $49/mo，包含 retention + SLA。
- 最适合：需要捆绑 guardrails + observability 的 regulated industries。

### Kong AI Gateway — the scale play

- 基于 Kong Gateway 构建（成熟的 API gateway 产品，lua+OpenResty）。
- Kong 自有 benchmark 在 12-CPU equivalent 上：比 Portkey 快 228%，比 LiteLLM 快 859%。
- Pricing：$100/model/month，Plus tier 最多 5 个。
- 最适合：已经在使用 Kong；>1000 RPS；愿意购买 license。

### Bifrost (Maxim AI)

- Automatic retries，支持 configurable backoff。
- OpenAI 429 时 fallback 到 Anthropic 是 canonical recipe。
- 较新的 entrant；commercial。

### Cloudflare AI Gateway / Vercel AI Gateway

- Managed、zero-ops。Basic retry 和 observability。
- 最适合：运行在 Cloudflare/Vercel 上的 Edge-serving JavaScript apps。
- 在 guardrails 和 rate limits 方面不如 Kong/Portkey。

### Self-hosted vs managed

Data residency 是决定因素。Healthcare 和 finance 默认 self-host（LiteLLM 或 Portkey OSS 或 Kong）。Consumer products 默认 managed（Cloudflare AI Gateway）或 middle-tier（Portkey managed）。Hybrid：regulated tenant 使用 self-hosted，其他使用 managed。

### Latency budget

- LiteLLM：典型 overhead 为 5-15 ms。
- Portkey：overhead 为 20-40 ms。
- Kong：overhead 为 3-8 ms。
- Cloudflare/Vercel：overhead 为 1-3 ms（edge advantage）。

Gateway latency 会直接增加 TTFT。对于 TTFT P99 < 100 ms SLA，选 Kong 或 Cloudflare。对于 P99 < 500 ms，任何都可以。

### Rate-limit semantics matter

简单的 token-bucket 可支撑到 moderate scale。Multi-tenant 需要 sliding-window + burst allowance + per-tenant tiering。LiteLLM 内置 token-bucket；Kong 内置 sliding-window；Portkey 内置 tiered。

### Gateway + observability + routing compose

Phase 17 · 13（observability）+ 16（model routing）+ 19（gateways）在 production 中属于同一层。选择一个覆盖三者的工具，或仔细把它们串起来：多数 2026 deployments 会组合 Helicone（observability）或 Portkey（guardrails）与 Kong（scale），用于 split roles。

### Numbers you should remember

- LiteLLM：约 ~2000 RPS 崩溃，8 GB memory。
- Portkey：20-40 ms overhead；自 2026 年 3 月起 Apache 2.0。
- Kong：比 Portkey 快 228%，比 LiteLLM 快 859%。
- Kong pricing：$100/model/month，Plus tier 最多 5 个。
- Cloudflare/Vercel：edge 上 1-3 ms overhead。

## 使用它
`code/main.py` 模拟 3 个 providers 在 429/5xx injection 下的 gateway routing with fallback。报告 latency、retry rate 和 fallback hit rate。

## 交付它
本课产出 `outputs/skill-gateway-picker.md`。给定 scale、ops posture、compliance、latency budget，选择一个 gateway。

## 练习
1. 运行 `code/main.py`。配置 OpenAI→Anthropic→self-hosted 的 fallback。在 5% provider error rate 下，预期 hit rate 是多少？
2. 你的 SLA 是 TTFT P99 < 200 ms，baseline 为 300 ms。哪些 gateways 仍在 budget 内？
3. 一个 healthcare customer 要求 self-hosted + PII redaction + audit。选择 Portkey OSS 还是 Kong。
4. 比较 LiteLLM 与 Kong：团队应该在什么 RPS ceiling 迁移？
5. 为 multi-tenant SaaS 设计 rate-limit policy：free tier、trial tier、paid tier。选择 token-bucket 还是 sliding-window？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Gateway | “API broker” | 位于 apps 和 providers 之间的 process |
| LiteLLM | “the MIT one” | Python OSS，100+ providers，2K RPS 时崩溃 |
| Portkey | “guardrails gateway” | Control plane + observability，Apache 2.0 |
| Kong AI Gateway | “the scale one” | 基于 Kong Gateway 构建，benchmark leader |
| Bifrost | “Maxim's gateway” | Retries + Anthropic fallback recipe |
| Cloudflare AI Gateway | “edge managed” | Edge-deployed managed gateway，zero-ops |
| PII redaction | “data scrub” | 发送到 model 前进行 Regex + NER mask |
| Jailbreak detection | “prompt injection guard” | 对 user input 的 Classifier |
| Audit trail | “regulated log” | 每次 LLM call 的 immutable record |
| Token-bucket | “simple rate limit” | 基于 refill 的 rate limiter |
| Sliding-window | “precise rate limit” | Time-windowed rate limiter；fairness 更好 |

## 延伸阅读
- [Kong AI Gateway Benchmark](https://konghq.com/blog/engineering/ai-gateway-benchmark-kong-ai-gateway-portkey-litellm)
- [TrueFoundry — AI Gateways 2026 Comparison](https://www.truefoundry.com/blog/a-definitive-guide-to-ai-gateways-in-2026-competitive-landscape-comparison)
- [Techsy — Top LLM Gateway Tools 2026](https://techsy.io/en/blog/best-llm-gateway-tools)
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [Portkey GitHub](https://github.com/Portkey-AI/gateway)
- [Kong AI Gateway docs](https://docs.konghq.com/gateway/latest/ai-gateway/)
