---
name: skill-cost-patterns
description: LLM 成本优化决策框架 -- caching 策略、rate limiting、model routing 和预算控制
version: 1.0.0
phase: 11
lesson: 11
tags: [caching, cost-optimization, rate-limiting, model-routing, budget, llm-ops]
---

# LLM 成本优化模式

在构建需要控制成本的 LLM 应用时，应用这个决策框架。

## 何时优化

**在以下情况立即优化：**
- 月度 LLM 支出超过 $500 或基础设施预算的 10%
- 面向消费者产品的单次查询成本高于 $0.01
- 你的 system prompt 超过 1,000 tokens，并随每次请求发送
- 超过 30% 的查询是重复或近似重复
- 你正在从 100 名日活跃用户扩展到 10,000+ 名日活跃用户

**在以下情况暂不优化：**
- DAU 少于 100，且仍在验证 product-market fit
- 月度支出低于 $100，且增长缓慢
- 你仍在迭代 prompt 设计（caching 会把你锁定在某个 prompt 上）

## Caching 策略选择

### Exact caching

**适用场景：** temperature=0、相同 prompts 会重复、需要确定性 outputs。

```python
key = sha256(json.dumps({"model": m, "messages": msgs, "temp": 0}))
```

- 实施：30 分钟
- 命中率：大多数 app 为 10-25%，FAQ bots 为 40-60%
- Latency：<1ms（dict lookup）
- 风险：底层数据变化时，responses 可能过时

**跳过场景：** temperature > 0、每个查询都唯一、需要实时数据。

### Semantic caching

**适用场景：** 用户用不同措辞问同一个问题、FAQ 密集型产品、客户支持。

- 实施：2-4 小时（Embedding + similarity + storage）
- 命中率：在 exact cache 之上再增加 15-35%
- Latency：10-50ms（Embedding + ANN search）
- 风险：false positives（为相似但不同的问题返回错误的 cached answer）

**阈值指南：**
- 0.98+：非常保守，几乎没有 false positives，命中率更低
- 0.95：适合事实型 Q&A 的良好平衡
- 0.90：激进，命中率更高，但有错误答案风险
- 0.85：仅适用于低风险应用（suggestions、autocomplete）

**跳过场景：** 每个查询都有唯一 context（code generation）、responses 必须反映最新数据、查询空间无边界。

### Provider prompt caching

**适用场景：** system prompt > 1,024 tokens（OpenAI）或达到 model 特定最小值，且重复发送相同 prefix。

| Provider | Action | Savings |
|----------|--------|---------|
| Anthropic | 向 system message 添加 `cache_control: {"type": "ephemeral"}` | cached prefix 节省 90%（在 25% write premium 之后） |
| OpenAI | 无需操作（自动） | cached prefix 节省 50% |
| Google | 使用带显式 TTL 的 Context Caching API | cached context 约节省 75% |

**跳过场景：** system prompt 每次请求都会变化，或 prompt 低于最小长度。

## Model routing 规则

### 基于 keyword（简单、快速）

```
simple:  <= 5 words OR matches FAQ keywords -> gpt-4o-mini ($0.15/$0.60)
medium:  general queries, summaries        -> claude-sonnet ($3/$15)
complex: "analyze", "compare", "debug"     -> gpt-4o ($2.50/$10)
```

- 实施：1 小时
- 准确率：70-80%
- 节省：model 成本的 40-60%

### 基于 Embedding（更准确）

为每个类别 embed 50-100 条已标注查询。按 nearest neighbor 对新查询分类。

- 实施：4-8 小时
- 准确率：85-92%
- 节省：model 成本的 50-70%
- 额外成本：用于分类 embeddings 约 ~$0.02/1M tokens（可忽略）

### 基于 ML（生产级）

在历史 query/model pairs 上训练一个小型 classifier（logistic regression 或小型 BERT）。

- 实施：1-2 周
- 准确率：90-95%
- 节省：model 成本的 60-75%
- 要求：来自生产流量的已标注训练数据

## Rate limiting 配置

### 按 tier 设置的 Token bucket 参数

| Tier | Bucket Size | Refill Rate | Max RPM | Daily Cap |
|------|-------------|-------------|---------|-----------|
| Free | 50K tokens | 500/sec | 10 | 50K |
| Pro | 500K tokens | 5K/sec | 60 | 500K |
| Enterprise | 5M tokens | 50K/sec | 300 | 5M |

### 实施 checklist

1. 将 buckets 存储在 Redis 中（不要用 in-memory），以支持多实例 app
2. 使用 atomic operations（MULTI/EXEC）防止 race conditions
3. 在拒绝 responses 中返回 `Retry-After` header
4. 将被拒绝的请求作为 metric 跟踪（>5% rejection = tier limits 过紧）
5. 实施 graceful degradation：优先拒绝昂贵 model 请求，保留廉价 model 访问

## 预算控制

### 三阈值 circuit breaker

| Threshold | Action | Reversible |
|-----------|--------|------------|
| 月度预算的 70% | 记录 warning，并通过 Slack/PagerDuty 提醒团队 | Yes（自动） |
| 月度预算的 85% | 将所有流量 route 到最便宜的 model | Yes（自动，下个 billing cycle） |
| 月度预算的 95% | 仅提供 cached responses，拒绝新的 LLM calls | Yes（manual reset 或下个 cycle） |

### 按用户追踪成本

追踪每位用户的累计成本。标记超过中位数 10 倍的用户。常见原因：
- 合法 power user（升级他们的 tier）
- Prompt injection loop（bot 发送自动化请求）
- 低效集成（client 在每个 error 上重试）

## 成本追踪字段

记录每次 API call，包含以下字段：

```json
{
  "timestamp": "2026-04-02T10:30:00Z",
  "model": "gpt-4o",
  "input_tokens": 1523,
  "output_tokens": 487,
  "cached_input_tokens": 1024,
  "latency_ms": 1847,
  "cost_usd": 0.006142,
  "user_id": "user_abc123",
  "cache_status": "partial_hit",
  "request_category": "customer_support",
  "complexity_class": "medium",
  "routed_from": "gpt-4o"
}
```

### Dashboard 的关键 metrics

- **Cost per query**（P50, P95, P99）-- 按 model、feature、user tier
- **Cache hit rate** -- exact vs semantic，随时间的趋势
- **Model distribution** -- 每个 model 的流量百分比、每个 model 的成本
- **Budget burn rate** -- 当前支出 vs 按当前速率预测的月度支出
- **Rejection rate** -- 被 rate-limited 的请求百分比，按 tier

## 常见错误

| Mistake | Why it hurts | Fix |
|---------|-------------|-----|
| 在 temperature > 0 时 caching | Outputs 非确定性，stale cache 会给出错误的变化 | 只 cache temp=0 的 calls，或接受 cached responses 会失去随机性 |
| Semantic cache 阈值太低 | 对表面相似的 queries 返回错误答案 | 从 0.95 开始，只在测量 false positive rate 后再降低 |
| 没有 cache invalidation | 底层数据变化时 responses 会过时 | 设置 TTL（动态数据 1 小时，静态数据 24 小时），数据更新时 invalidate |
| 将所有流量 route 到最便宜的 model | 质量下降，用户会注意到 | 按复杂度 route，按 tier 测量质量，设置最低质量阈值 |
| 没有 per-user limits | 一个滥用用户会耗尽整个预算 | 始终实施 per-user quotas，即使额度很宽松 |
| 忽略 output tokens | Output 每 token 成本是 input 的 2-5 倍 | 合理设置 max_tokens，使用 stop sequences，压缩 outputs |
| 在 prompt 稳定前 caching | Cache 中会充满旧 prompts 的 responses | 只在 prompt finalized 后启用 caching，并在 prompt 变化时 flush cache |

## Pricing reference（截至 2026 年 4 月）

| Model | Input ($/1M) | Output ($/1M) | Cached Input ($/1M) | Best For |
|-------|-------------|--------------|--------------------|---------| 
| gpt-4.1-nano | $0.10 | $0.40 | $0.025 | 高容量简单任务 |
| gpt-4o-mini | $0.15 | $0.60 | $0.075 | 简单 routing、classification |
| gemini-2.5-flash | $0.15 | $0.60 | $0.0375 | 预算型 Multimodal |
| claude-haiku-3.5 | $0.80 | $4.00 | $0.08 | 快速中档任务 |
| o4-mini | $1.10 | $4.40 | $0.275 | 预算内 reasoning |
| gemini-2.5-pro | $1.25 | $10.00 | $0.3125 | Long context、Multimodal |
| gpt-4o | $2.50 | $10.00 | $1.25 | 通用用途、function calling |
| claude-sonnet-4 | $3.00 | $15.00 | $0.30 | 质量/成本平衡 |
| claude-opus-4 | $15.00 | $75.00 | $1.50 | 最高质量、复杂 reasoning |
