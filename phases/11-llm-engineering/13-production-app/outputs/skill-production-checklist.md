---
name: skill-production-checklist
description: 用于将 LLM applications 发布到 production 的决策框架 -- 覆盖每个组件，并提供具体阈值与 pass/fail criteria
version: 1.0.0
phase: 11
lesson: 13
tags: [production, deployment, llm, architecture, scaling, cost, observability, guardrails]
---

# Production LLM Checklist

发布 LLM application 时，按顺序完成这份 checklist。每一节都有带具体阈值的 pass/fail criteria。

## 1. Security (Ship Blockers)

这里的每一项都必须在任何 deployment 前通过。

| Check | Pass Criteria | How to Verify |
|-------|--------------|---------------|
| API keys in env vars | codebase 中没有任何 hardcoded keys | `grep -r "sk-" --include="*.py"` 不返回任何内容 |
| Input guardrails active | Prompt injection patterns 被阻止 | 发送 "Ignore all previous instructions" -- 返回 blocked response |
| PII redaction | SSN、credit card、email patterns 被捕获 | 发送 "My SSN is 123-45-6789" -- LLM call 前 PII 已 redacted |
| Output filtering | 危险内容被阻止 | Model 不能返回 `DROP TABLE`、`rm -rf`、`exec()` patterns |
| Rate limiting | 强制执行 per-user request cap | 同一用户在 10 秒内发送 100 个 requests -- 最后 50+ 被拒绝 |
| Auth on all endpoints | 没有 unauthenticated LLM access | 不带 token 执行 `curl /v1/chat` 返回 401 |
| CORS restricted | 只允许 production domains | `Origin: evil.com` request 被拒绝 |
| Max input tokens | 超过 limit 的 requests 被拒绝 | 发送 50K Token input -- 返回 413 或 truncation |

## 2. Reliability（第一周生存）

这些会防止你的第一次 on-call incident。

| Check | Pass Criteria | How to Verify |
|-------|--------------|---------------|
| Retry with backoff | 5xx 时 retry 3 次，exponential delay | 在 request 中途 kill LLM mock -- logs 中可见 retries |
| Fallback model chain | chain 中有 2+ models | Primary model unavailable -- response 仍从 fallback 返回 |
| Request timeout | 所有 external calls 最大 30s | Slow LLM mock (60s) -- request 在 30s timeout |
| Graceful degradation | Cache/RAG failure 不会让 service 崩溃 | 停止 cache -- requests 仍成功（更慢、更贵） |
| Health check endpoint | 返回 dependency status | `GET /health` 返回 `{"status": "healthy", "cache": ..., "llm": ...}` |
| Streaming works | First Token 低于 500ms | Time-to-first-token 已测量，持续 < 500ms |
| Error messages are safe | Internal errors 永远不会泄露给用户 | 强制触发 500 -- 用户看到 generic error，而不是 stack trace |

## 3. 成本控制（第一个月经济性）

这些会防止 $50K 的意外 invoice。

| Check | Pass Criteria | How to Verify |
|-------|--------------|---------------|
| Cost per request tracked | 每个 request 记录 Token count + USD cost | Request log 包含 `input_tokens`、`output_tokens`、`cost_usd` fields |
| Semantic cache active | 重复 patterns 上 hit rate > 20% | 1000 个 test requests 后 cache stats 显示 hit rate |
| Cache TTL configured | Entries 会过期（默认：1 hour） | 插入 entry -- TTL 后不再返回 |
| Per-user cost tracking | Cost 按 user_id 聚合 | Dashboard/API 显示成本最高的 top 10 users |
| Cost alerting | 达到 daily budget 的 80% 时 alert | 设置 $10 daily budget，发送 $8.50 的 requests -- alert 触发 |
| Model routing by cost | 低复杂度 queries 使用更便宜的 model | 简单问题路由到 gpt-4o-mini，复杂问题路由到 gpt-4o |
| Max output tokens set | Responses 按 template 设置上限 | max_output_tokens=512 的 template -- response 永不超过它 |

**Cost estimation formula:**
```
Monthly LLM cost = DAU x queries_per_user x 30 x (1 - cache_hit_rate) x (avg_input_tokens x input_price + avg_output_tokens x output_price) / 1,000,000
```

**Benchmark thresholds by scale:**

| DAU | Target cost/request | Monthly budget |
|-----|-------------------|----------------|
| 1K | < $0.005 | < $750 |
| 10K | < $0.003 | < $4,500 |
| 100K | < $0.001 | < $15,000 |

## 4. Observability (生产环境调试)

你无法修复看不见的问题。

| Check | Pass Criteria | How to Verify |
|-------|--------------|---------------|
| Structured JSON logging | 每个 request 生成一行 JSON log | Log 包含：request_id、user_id、model、tokens、latency_ms、cost |
| Request tracing | 带 component timing 的 end-to-end trace | 单个 request 显示：guardrail (5ms) + cache (2ms) + llm (3200ms) + eval (1ms) |
| Latency tracking | 测量 P50、P95、P99 | 1000 个 requests 后：P50 < 2s，P99 < 10s |
| Error rate monitoring | Errors 被计数并分类 | Dashboard 显示：0.5% API errors、0.1% guardrail blocks、0.01% timeouts |
| Cache metrics | Hit rate、miss rate、entry count 可见 | `GET /v1/cache/stats` 返回当前数值 |
| A/B test metrics | 记录 per-variant quality metrics | 每个 request 记录 prompt_template + version 以便比较 |
| Eval logging | 每个 request 记录 quality signals | Response length、latency、model、template version 被存储用于 offline analysis |

## 5. Prompt Management

Prompts 就是 code。像对待 code 一样对待它们。

| Check | Pass Criteria | How to Verify |
|-------|--------------|---------------|
| Versioned templates | 每个 template 都有 name + version string | Template 变更会创建新 version，旧 version 被保留 |
| A/B testing support | 按 deterministic user hash 切分 traffic | 同一 user 在 experiment 内总是看到相同 variant |
| Rollback capability | 在 < 1 minute 内回退到 previous version | 修改 experiment config -- traffic 立即切换 |
| Template validation | Variables 在 rendering 前被验证 | Template 缺少 variable 时抛出清晰 error，而不是 KeyError |
| System prompt separation | System 和 user messages 位于不同 fields | System prompt 不会拼接到 user message 中 |

## 6. Scaling Readiness

Launch 时不需要。10x 时需要。

| Check | Pass Criteria | How to Verify |
|-------|--------------|---------------|
| Async LLM calls | API calls 不阻塞 thread | 50 个 concurrent requests -- server CPU 保持 < 30% |
| Connection pooling | HTTP connections 被复用 | Network trace 显示到 LLM provider 的 persistent connections |
| Horizontal scaling | Stateless server design | Load balancer 后有 2 个 instances -- 所有 requests 成功 |
| Queue support | Non-real-time tasks 进入 queue | Summarization request 返回 job_id，result 可通过 polling 获取 |
| Load tested | 100 concurrent users，error rate < 5% | `wrk` 或 `locust` test 在目标 concurrency 下通过 |

## 新项目的实现顺序

1. **Day 1:** API server + prompt templates + 带 retry 的单次 LLM call
2. **Day 2:** Input guardrails + output guardrails + error handling
3. **Day 3:** Semantic cache + 每个 request 的 cost tracking
4. **Day 4:** Streaming (SSE) + health check endpoint
5. **Day 5:** Structured logging + request tracing + eval logging
6. **Week 2:** A/B testing + prompt versioning + rollback
7. **Week 3:** Fallback model chain + graceful degradation
8. **Week 4:** Load testing + async optimization + horizontal scaling

## Quick diagnostic

如果 production 中出了问题，按这个顺序检查：

1. **Users complaining about errors?** 先检查 health endpoint，再检查 logs 中的 error rate，然后检查 LLM provider status page
2. **Responses are slow?** 检查 P99 latency，再检查 cache hit rate，然后检查 traces 中的 LLM response times
3. **Cost spiking?** 检查 cost-per-request trend，再检查 cache hit rate，然后检查成本最高的 users，再查找是否有 prompt template changes 增加了 Token count
4. **Quality dropped?** 检查是否部署了新的 prompt version，检查 RAG retrieval accuracy 是否变化，检查 model provider 是否更改了 default model version
5. **Security incident?** 检查 guardrail block rate（突然下降 = guardrails disabled），检查 request logs 中的异常 patterns，立即 rotate API keys
