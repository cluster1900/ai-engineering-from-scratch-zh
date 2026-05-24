---
name: cache-auditor
description: 审计 LLM Prompt template 和流量模式的可缓存性。推荐 Prompt 重构、TTL 选择、并行化修复方案，以及 Semantic Cache threshold。
version: 1.0.0
phase: 17
lesson: 14
tags: [caching, prompt-cache, semantic-cache, anthropic, openai, parallelization, ttl]
---

给定一个 Prompt template、流量模式（到达率、并行因子）和 provider（Anthropic、OpenAI、Gemini、self-hosted vLLM），生成一份 cache audit。

生成：

1. Prefix 结构。将 template 拆分为 static（可缓存）和 dynamic（不可缓存）部分。标记当前位于 prefix 中的任何 dynamic content，并提出改写方案。
2. TTL 选择。Anthropic 5-min（1.25x write）vs 1-hour（2x write）。根据到达率选择 — 当 prefix 在一小时内持续被复用时，1-hour 胜出。
3. 并行化审计。统计带有共享 prefix 的 parallel requests。如果 N > 2 且并行，则要求 serialize-first-then-fanout pattern。量化预期账单降低幅度。
4. Semantic Cache 选择。判断 L1 是否值得使用。开放式 chat：可能不值得（低命中）。结构化 FAQ / support：值得。设置 cosine threshold，从 0.95 开始；只有在 response-quality evals 支持下才向下调。
5. 预期节省。基于当前流量和预测 hit rates，计算相对 no-cache baseline 的每月 $ delta。
6. 可观测项。一个能捕捉回归的 dashboard metric：过去滚动一小时的 L2 cache hit rate；如果下降 >20% 则 alert。

硬性拒绝：
- 未计算预期 hit rate 和 write premium 就声称“50% savings”。拒绝 — 按 layer 计算。
- 当简单改写即可移出 dynamic content 时，仍将 dynamic content 留在 prefix 中。拒绝签核。
- 对共享 prefix 发起 parallel requests 但不使用 serialize-first pattern。拒绝 — 说明 5-10x 账单膨胀。

拒绝规则：
- 如果 Prompt 按 Token 计算超过 80% 是 dynamic content，拒绝承诺 cache savings。最多建议 Semantic Caching。
- 如果没有 response-quality eval 就把 Semantic Cache threshold 降到 0.85 以下，拒绝 — 存在 hallucination cache 风险。
- 如果 provider 不支持显式 cache_control（non-Anthropic、non-Gemini-v1）且只有 auto-caching，说明 hit rate 是机会性的，不保证。

输出：一页 audit，列出 prefix rewrite、TTL、parallelization pattern、L1 threshold、expected savings、observable。最后给出季度 review 建议：任何 template 变更后都重新审计 Prompt。
