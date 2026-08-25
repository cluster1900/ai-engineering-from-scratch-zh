# 缓存、速率限制与成本优化

> 大多数 AI 初创公司并不是因为 Model 不够好而倒闭，而是因为单位经济效益不佳。单次 GPT-4o 调用的成本只有几美分的一小部分。但如果一万名用户每天各调用十次，仅输入 Token 就要花费 250 美元，而此时你甚至还没有收取一美元。能够生存下来的公司，会把每次 API 调用视为一笔财务交易，而不是一次函数调用。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 09 (Function Calling)
**Time:** ~45 分钟
**Related:** Phase 11 · 15 (Prompt Caching) — 本课介绍应用层缓存（semantic cache、精确哈希缓存、Model routing）。Lesson 15 介绍提供商层的 Prompt caching（Anthropic cache_control、OpenAI 自动缓存、Gemini CachedContent）。将两者结合，可降低 50-95% 的成本。

## 学习目标

- 实现 semantic caching，从缓存中响应重复或相似查询，而不是发起新的 API 调用
- 计算不同提供商的单次请求成本，并实现 Token 感知的速率限制和预算告警
- 构建包含 Prompt 压缩、Model routing（高成本与低成本）和响应缓存的成本优化层
- 针对不同查询类型，使用精确匹配、语义相似度和前缀缓存设计分层缓存策略

## 问题

你构建了一个 RAG chatbot。它运行得非常出色，用户也很喜欢。

然后账单来了。

GPT-5 每百万输入 Token 的成本为 5 美元，每百万输出 Token 为 15 美元。Claude Opus 4.7 的输入成本为 15 美元，输出成本为 75 美元。Gemini 3 Pro 的输入成本为 1.25 美元，输出成本为 5 美元。GPT-5-mini 则为 0.25/2 美元。以下价格仅用于说明；请始终查看提供商当前的定价页面。

下面这笔账足以拖垮初创公司：

- 10,000 名每日活跃用户
- 每位用户每天查询 10 次
- 每次查询包含 1,000 个输入 Token（system prompt + Context + 用户消息）
- 每次响应包含 500 个输出 Token

**每日输入成本：** 10,000 x 10 x 1,000 / 1,000,000 x $2.50 = **$250/天**
**每日输出成本：** 10,000 x 10 x 500 / 1,000,000 x $10.00 = **$500/天**
**每月总成本：** **$22,500/月**

这还只是 LLM 的成本。再加上 Embedding、Vector 数据库托管和基础设施，一个 chatbot 的月成本将达到 30,000 美元。

更残酷的是：其中 40-60% 的查询几乎是重复的。用户只是用略有不同的措辞提出相同的问题。你的 system prompt 在每次请求中完全相同，却每次都会计费。通过 RAG 检索到的 Context 文档，也会在询问相同主题的不同用户之间反复出现。

你正在为重复计算支付全价。

## 概念

### LLM 调用的成本构成

每次 API 调用都包含五项成本。

```mermaid
graph LR
    A[用户查询] --> B[System Prompt<br/>500-2000 个 Token]
    A --> C[检索到的 Context<br/>500-4000 个 Token]
    A --> D[用户消息<br/>50-500 个 Token]
    B --> E[输入成本<br/>$2.50/1M Token]
    C --> E
    D --> E
    E --> F[Model 处理]
    F --> G[输出成本<br/>$10.00/1M Token]
```

System prompt 是隐藏的成本杀手。如果每次请求都发送一个包含 1,500 个 Token 的 system prompt，那么仅这个前缀，每百万次请求就要花费 3.75 美元。按照每天 10 万次请求计算，这就是每天 375 美元、每月 11,250 美元，而你付费发送的文本从未发生变化。

### 提供商缓存：内置折扣

到 2026 年，三家主要提供商都提供了提供商侧的 Prompt caching，但具体机制各不相同。深入内容请参阅 Phase 11 · 15。

| 提供商 | 机制 | 折扣 | 最低要求 | 缓存时长 |
|----------|-----------|----------|---------|----------------|
| Anthropic | 显式 cache_control 标记 | 缓存命中时优惠 90%（写入额外支付 25%） | 1,024 个 Token（Sonnet/Opus），2,048 个 Token（Haiku） | 默认 5 分钟；可延长至 1 小时（写入费用为 2 倍） |
| OpenAI | 自动前缀匹配 | 缓存命中时优惠 50% | 1,024 个 Token | 尽力而为，最长 1 小时 |
| Google Gemini | 显式 CachedContent API | 成本降低约 75%（另加存储费用） | 4,096（Flash）/ 32,768（Pro） | 用户可配置 TTL |

**Anthropic 的方案**是显式的。你需要使用 `cache_control: {"type": "ephemeral"}` 标记 Prompt 中的特定部分。第一次请求会额外支付 25% 的写入费用，之后具有相同前缀的请求可获得 90% 的折扣。一个通常花费 0.005 美元、包含 2,000 个 Token 的 system prompt，在缓存命中时只需 0.000625 美元。按 10 万次请求计算，每天可节省 437.50 美元。

**OpenAI 的方案**是自动的。任何与先前请求匹配的 Prompt 前缀都可以获得 50% 的折扣，无需添加标记。代价是折扣较低、控制能力较弱，但完全不需要实现工作。

### Semantic Caching：你的自定义层

提供商缓存只适用于完全相同的前缀。Semantic caching 处理的是更困难的情况：表达不同但含义相同的查询。

“What is the return policy?” 和 “How do I return an item?” 是不同的字符串，但意图完全相同。Semantic cache 会为两个查询生成 Embedding，计算 cosine similarity，并在相似度超过阈值时返回缓存的响应，该阈值通常为 0.92-0.95。

```mermaid
flowchart TD
    A[用户查询] --> B[为查询生成 Embedding]
    B --> C{缓存中是否存在<br/>相似查询？}
    C -->|sim > 0.95| D[返回缓存响应]
    C -->|sim < 0.95| E[调用 LLM API]
    E --> F[将响应与 Embedding<br/>一同缓存]
    F --> G[返回响应]
    D --> G
```

Embedding 的成本可以忽略不计。OpenAI 的 text-embedding-3-small 每百万 Token 只需 0.02 美元。与完整的 LLM 调用相比，检查缓存几乎不产生成本。

### 精确缓存：哈希与匹配

对于确定性调用（temperature=0、相同 Model、相同 Prompt），精确缓存更简单也更快。对完整 Prompt 计算哈希，检查缓存，找到后直接返回。

它非常适合以下场景：

- System prompt + 固定 Context + 完全相同的用户查询
- 使用相同 Tool 定义的 Function calling
- 同一文档被多次处理的 Batch processing

### 速率限制：保护预算

速率限制不仅关乎公平，也关乎生存。

**Token bucket algorithm：** 每位用户都有一个容量为 N 个 Token 的 bucket，并以每秒 R 个 Token 的速率补充。每个请求都会消耗 bucket 中的 Token。如果 bucket 为空，请求就会被拒绝。该算法既允许突发请求（一次用完整个 bucket），又能强制执行平均速率。

**按用户设置配额：** 根据用户等级设置每日或每月 Token 上限。

| 等级 | 每日 Token 上限 | 每分钟最大请求数 | Model 访问权限 |
|------|------------------|------------------|-------------|
| Free | 50,000 | 10 | 仅 GPT-4o-mini |
| Pro | 500,000 | 60 | GPT-4o、Claude Sonnet |
| Enterprise | 5,000,000 | 300 | 所有 Model |

### Model Routing：为任务选择合适的 Model

并非每个查询都需要 GPT-4o。

“What time does the store close?” 不需要每百万输出 Token 成本为 10 美元的 Model。每百万输出 Token 仅需 0.60 美元的 GPT-4o-mini 就能很好地处理它，每百万输出 Token 1.25 美元的 Claude Haiku 也可以。一个简单的 classifier 可以把简单查询路由到低成本 Model，把复杂查询路由到高成本 Model。

```mermaid
flowchart TD
    A[用户查询] --> B[复杂度 Classifier]
    B -->|简单：查找、FAQ| C[GPT-4o-mini<br/>每 1M Token $0.15/$0.60]
    B -->|中等：分析、摘要| D[Claude Sonnet<br/>每 1M Token $3.00/$15.00]
    B -->|复杂：推理、代码| E[GPT-4o / Claude Opus<br/>$2.50/$10.00+]
```

经过良好调优的 router，仅在 Model 成本方面就能节省 40-70%。

### 成本追踪：了解资金流向

无法度量的东西就无法优化。记录每次 API 调用的以下信息：

- 时间戳
- Model 名称
- 输入 Token
- 输出 Token
- 延迟（ms）
- 计算得出的成本（$）
- 用户 ID
- 缓存命中/未命中
- 请求类别

这些数据可以揭示哪些 Feature 成本高、哪些用户消耗量大，以及缓存在哪些位置能产生最大影响。

### Batching：批量折扣

OpenAI 的 Batch API 以 50% 的折扣异步处理请求。你可以提交最多包含 50,000 个请求的 Batch，并在 24 小时内获得结果。

Batching 适用于：

- 每晚文档处理
- 批量 Classification
- Evaluation 运行
- 数据扩充 Pipeline

不适用于：面向用户的实时查询，因为这类查询对延迟敏感。

### 预算告警与 Circuit Breaker

Circuit breaker 会在达到限制时停止支出。如果没有它，bug 或滥用行为可能会在几小时内耗尽整月预算。

设置三个阈值：

1. **警告**（预算的 70%）：发送告警
2. **限流**（预算的 85%）：仅切换到成本更低的 Model
3. **停止**（预算的 95%）：拒绝新请求，仅返回缓存响应

### 优化栈

按以下顺序应用这些技术。每一层都会在前一层的基础上叠加收益。

| 层级 | 技术 | 典型节省比例 | 实现工作量 |
|-------|-----------|----------------|----------------------|
| 1 | 提供商 Prompt caching | 30-50% | 低（添加缓存标记） |
| 2 | 精确缓存 | 10-20% | 低（哈希 + dict） |
| 3 | Semantic caching | 15-30% | 中（Embedding + 相似度） |
| 4 | Model routing | 40-70% | 中（classifier） |
| 5 | 速率限制 | 预算保护 | 低（Token bucket） |
| 6 | Prompt 压缩 | 10-30% | 中（重写 Prompt） |
| 7 | Batching | 符合条件的请求优惠 50% | 低（Batch API） |

应用第 1-5 层的 RAG 应用，通常可以将成本从每月 22,500 美元降至每月 4,000-6,000 美元。这可能就是耗尽资金与成功建立业务之间的差别。

### 实际节省：优化前后对比

下面是一个为 10,000 名 DAU 提供服务的 RAG chatbot 的实际成本明细。

| 指标 | 优化前 | 优化后 | 节省 |
|--------|--------------------|--------------------|---------|
| 每月 LLM 成本 | $22,500 | $5,200 | 77% |
| 每次查询的平均成本 | $0.0075 | $0.0017 | 77% |
| 缓存命中率 | 0% | 52% | -- |
| 路由到 mini 的查询 | 0% | 65% | -- |
| P95 延迟 | 2,800ms | 900ms（缓存命中：50ms） | 68% |
| 每月 Embedding 成本 | $0 | $180 | （新增成本） |
| 每月总成本 | $22,500 | $5,380 | 76% |

Semantic caching 的 Embedding 成本（每月 180 美元）在缓存开始命中后的第一个小时内就能收回。

```figure
semantic-cache
```

## 动手构建

### 第 1 步：成本计算器

构建一个了解主要 Model 当前定价的 Token 成本计算器。

```python
import hashlib
import time
import json
import math
from dataclasses import dataclass, field


MODEL_PRICING = {
    "gpt-4o": {"input": 2.50, "output": 10.00, "cached_input": 1.25},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60, "cached_input": 0.075},
    "gpt-4.1": {"input": 2.00, "output": 8.00, "cached_input": 0.50},
    "gpt-4.1-mini": {"input": 0.40, "output": 1.60, "cached_input": 0.10},
    "gpt-4.1-nano": {"input": 0.10, "output": 0.40, "cached_input": 0.025},
    "o3": {"input": 2.00, "output": 8.00, "cached_input": 0.50},
    "o3-mini": {"input": 1.10, "output": 4.40, "cached_input": 0.55},
    "o4-mini": {"input": 1.10, "output": 4.40, "cached_input": 0.275},
    "claude-opus-4": {"input": 15.00, "output": 75.00, "cached_input": 1.50},
    "claude-sonnet-4": {"input": 3.00, "output": 15.00, "cached_input": 0.30},
    "claude-haiku-3.5": {"input": 0.80, "output": 4.00, "cached_input": 0.08},
    "gemini-2.5-pro": {"input": 1.25, "output": 10.00, "cached_input": 0.3125},
    "gemini-2.5-flash": {"input": 0.15, "output": 0.60, "cached_input": 0.0375},
}


def calculate_cost(model, input_tokens, output_tokens, cached_input_tokens=0):
    if model not in MODEL_PRICING:
        return {"error": f"Unknown model: {model}"}
    pricing = MODEL_PRICING[model]
    non_cached = input_tokens - cached_input_tokens
    input_cost = (non_cached / 1_000_000) * pricing["input"]
    cached_cost = (cached_input_tokens / 1_000_000) * pricing["cached_input"]
    output_cost = (output_tokens / 1_000_000) * pricing["output"]
    total = input_cost + cached_cost + output_cost
    return {
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cached_input_tokens": cached_input_tokens,
        "input_cost": round(input_cost, 6),
        "cached_input_cost": round(cached_cost, 6),
        "output_cost": round(output_cost, 6),
        "total_cost": round(total, 6),
    }
```

### 第 2 步：精确缓存

对完整 Prompt 计算哈希，并为完全相同的请求返回缓存响应。

```python
class ExactCache:
    def __init__(self, max_size=1000, ttl_seconds=3600):
        self.cache = {}
        self.max_size = max_size
        self.ttl = ttl_seconds
        self.hits = 0
        self.misses = 0

    def _hash(self, model, messages, temperature):
        key_data = json.dumps({"model": model, "messages": messages, "temperature": temperature}, sort_keys=True)
        return hashlib.sha256(key_data.encode()).hexdigest()

    def get(self, model, messages, temperature=0.0):
        if temperature > 0:
            self.misses += 1
            return None
        key = self._hash(model, messages, temperature)
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry["timestamp"] < self.ttl:
                self.hits += 1
                entry["access_count"] += 1
                return entry["response"]
            del self.cache[key]
        self.misses += 1
        return None

    def put(self, model, messages, temperature, response):
        if temperature > 0:
            return
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.cache, key=lambda k: self.cache[k]["timestamp"])
            del self.cache[oldest_key]
        key = self._hash(model, messages, temperature)
        self.cache[key] = {
            "response": response,
            "timestamp": time.time(),
            "access_count": 1,
        }

    def stats(self):
        total = self.hits + self.misses
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(self.hits / total, 4) if total > 0 else 0,
            "cache_size": len(self.cache),
        }
```

### 第 3 步：Semantic Cache

为查询生成 Embedding，并在相似度超过阈值时返回缓存响应。

```python
def simple_embed(text):
    words = text.lower().split()
    vocab = {}
    for w in words:
        vocab[w] = vocab.get(w, 0) + 1
    norm = math.sqrt(sum(v * v for v in vocab.values()))
    if norm == 0:
        return {}
    return {k: v / norm for k, v in vocab.items()}


def cosine_similarity(a, b):
    if not a or not b:
        return 0.0
    all_keys = set(a) | set(b)
    dot = sum(a.get(k, 0) * b.get(k, 0) for k in all_keys)
    return dot


class SemanticCache:
    def __init__(self, similarity_threshold=0.85, max_size=500, ttl_seconds=3600):
        self.entries = []
        self.threshold = similarity_threshold
        self.max_size = max_size
        self.ttl = ttl_seconds
        self.hits = 0
        self.misses = 0

    def get(self, query):
        query_embedding = simple_embed(query)
        now = time.time()
        best_match = None
        best_sim = 0.0
        for entry in self.entries:
            if now - entry["timestamp"] > self.ttl:
                continue
            sim = cosine_similarity(query_embedding, entry["embedding"])
            if sim > best_sim:
                best_sim = sim
                best_match = entry
        if best_match and best_sim >= self.threshold:
            self.hits += 1
            best_match["access_count"] += 1
            return {"response": best_match["response"], "similarity": round(best_sim, 4), "original_query": best_match["query"]}
        self.misses += 1
        return None

    def put(self, query, response):
        if len(self.entries) >= self.max_size:
            self.entries.sort(key=lambda e: e["timestamp"])
            self.entries.pop(0)
        self.entries.append({
            "query": query,
            "embedding": simple_embed(query),
            "response": response,
            "timestamp": time.time(),
            "access_count": 1,
        })

    def stats(self):
        total = self.hits + self.misses
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(self.hits / total, 4) if total > 0 else 0,
            "cache_size": len(self.entries),
        }
```

### 第 4 步：速率限制器

实现带有按用户配额的 Token bucket 速率限制器。

```python
class TokenBucketRateLimiter:
    def __init__(self):
        self.buckets = {}
        self.tiers = {
            "free": {"capacity": 50_000, "refill_rate": 500, "max_requests_per_min": 10},
            "pro": {"capacity": 500_000, "refill_rate": 5_000, "max_requests_per_min": 60},
            "enterprise": {"capacity": 5_000_000, "refill_rate": 50_000, "max_requests_per_min": 300},
        }

    def _get_bucket(self, user_id, tier="free"):
        if user_id not in self.buckets:
            tier_config = self.tiers.get(tier, self.tiers["free"])
            self.buckets[user_id] = {
                "tokens": tier_config["capacity"],
                "capacity": tier_config["capacity"],
                "refill_rate": tier_config["refill_rate"],
                "last_refill": time.time(),
                "request_timestamps": [],
                "max_rpm": tier_config["max_requests_per_min"],
                "tier": tier,
                "total_tokens_used": 0,
            }
        return self.buckets[user_id]

    def _refill(self, bucket):
        now = time.time()
        elapsed = now - bucket["last_refill"]
        refill = int(elapsed * bucket["refill_rate"])
        if refill > 0:
            bucket["tokens"] = min(bucket["capacity"], bucket["tokens"] + refill)
            bucket["last_refill"] = now

    def check(self, user_id, tokens_needed, tier="free"):
        bucket = self._get_bucket(user_id, tier)
        self._refill(bucket)
        now = time.time()
        bucket["request_timestamps"] = [t for t in bucket["request_timestamps"] if now - t < 60]
        if len(bucket["request_timestamps"]) >= bucket["max_rpm"]:
            return {"allowed": False, "reason": "rate_limit", "retry_after_seconds": 60 - (now - bucket["request_timestamps"][0])}
        if bucket["tokens"] < tokens_needed:
            deficit = tokens_needed - bucket["tokens"]
            wait = deficit / bucket["refill_rate"]
            return {"allowed": False, "reason": "token_limit", "tokens_available": bucket["tokens"], "retry_after_seconds": round(wait, 1)}
        return {"allowed": True, "tokens_available": bucket["tokens"]}

    def consume(self, user_id, tokens_used, tier="free"):
        bucket = self._get_bucket(user_id, tier)
        bucket["tokens"] -= tokens_used
        bucket["request_timestamps"].append(time.time())
        bucket["total_tokens_used"] += tokens_used

    def get_usage(self, user_id):
        if user_id not in self.buckets:
            return {"error": "User not found"}
        b = self.buckets[user_id]
        return {
            "user_id": user_id,
            "tier": b["tier"],
            "tokens_remaining": b["tokens"],
            "capacity": b["capacity"],
            "total_tokens_used": b["total_tokens_used"],
            "utilization": round(b["total_tokens_used"] / b["capacity"], 4) if b["capacity"] else 0,
        }
```

### 第 5 步：成本追踪器

记录每次调用并计算累计总额。

```python
class CostTracker:
    def __init__(self, monthly_budget=1000.0):
        self.logs = []
        self.monthly_budget = monthly_budget
        self.alerts = []

    def log_call(self, model, input_tokens, output_tokens, cached_input_tokens=0, latency_ms=0, user_id="anonymous", cache_status="miss"):
        cost = calculate_cost(model, input_tokens, output_tokens, cached_input_tokens)
        entry = {
            "timestamp": time.time(),
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cached_input_tokens": cached_input_tokens,
            "latency_ms": latency_ms,
            "cost": cost["total_cost"],
            "user_id": user_id,
            "cache_status": cache_status,
        }
        self.logs.append(entry)
        self._check_budget()
        return entry

    def _check_budget(self):
        total = self.total_cost()
        pct = total / self.monthly_budget if self.monthly_budget > 0 else 0
        if pct >= 0.95 and not any(a["level"] == "stop" for a in self.alerts):
            self.alerts.append({"level": "stop", "message": f"Budget 95% consumed: ${total:.2f}/${self.monthly_budget:.2f}", "timestamp": time.time()})
        elif pct >= 0.85 and not any(a["level"] == "throttle" for a in self.alerts):
            self.alerts.append({"level": "throttle", "message": f"Budget 85% consumed: ${total:.2f}/${self.monthly_budget:.2f}", "timestamp": time.time()})
        elif pct >= 0.70 and not any(a["level"] == "warning" for a in self.alerts):
            self.alerts.append({"level": "warning", "message": f"Budget 70% consumed: ${total:.2f}/${self.monthly_budget:.2f}", "timestamp": time.time()})

    def total_cost(self):
        return round(sum(e["cost"] for e in self.logs), 6)

    def cost_by_model(self):
        by_model = {}
        for e in self.logs:
            m = e["model"]
            if m not in by_model:
                by_model[m] = {"calls": 0, "cost": 0, "input_tokens": 0, "output_tokens": 0}
            by_model[m]["calls"] += 1
            by_model[m]["cost"] = round(by_model[m]["cost"] + e["cost"], 6)
            by_model[m]["input_tokens"] += e["input_tokens"]
            by_model[m]["output_tokens"] += e["output_tokens"]
        return by_model

    def cache_savings(self):
        cache_hits = [e for e in self.logs if e["cache_status"] == "hit"]
        if not cache_hits:
            return {"saved": 0, "cache_hits": 0}
        saved = 0
        for e in cache_hits:
            full_cost = calculate_cost(e["model"], e["input_tokens"], e["output_tokens"])
            saved += full_cost["total_cost"]
        return {"saved": round(saved, 4), "cache_hits": len(cache_hits)}

    def summary(self):
        if not self.logs:
            return {"total_calls": 0, "total_cost": 0}
        total_latency = sum(e["latency_ms"] for e in self.logs)
        cache_hits = sum(1 for e in self.logs if e["cache_status"] == "hit")
        return {
            "total_calls": len(self.logs),
            "total_cost": self.total_cost(),
            "avg_cost_per_call": round(self.total_cost() / len(self.logs), 6),
            "avg_latency_ms": round(total_latency / len(self.logs), 1),
            "cache_hit_rate": round(cache_hits / len(self.logs), 4),
            "cost_by_model": self.cost_by_model(),
            "cache_savings": self.cache_savings(),
            "budget_remaining": round(self.monthly_budget - self.total_cost(), 2),
            "budget_utilization": round(self.total_cost() / self.monthly_budget, 4) if self.monthly_budget > 0 else 0,
            "alerts": self.alerts,
        }
```

### 第 6 步：Model Router

将查询路由到能够处理它的最便宜 Model。

```python
SIMPLE_KEYWORDS = ["what time", "hours", "address", "phone", "price", "return policy", "hello", "hi", "thanks", "yes", "no"]
COMPLEX_KEYWORDS = ["analyze", "compare", "explain why", "write code", "debug", "architect", "design", "trade-off", "evaluate"]


def classify_complexity(query):
    q = query.lower()
    if len(q.split()) <= 5 or any(kw in q for kw in SIMPLE_KEYWORDS):
        return "simple"
    if any(kw in q for kw in COMPLEX_KEYWORDS):
        return "complex"
    return "medium"


def route_model(query, tier="pro"):
    complexity = classify_complexity(query)
    routing_table = {
        "simple": {"free": "gpt-4.1-nano", "pro": "gpt-4o-mini", "enterprise": "gpt-4o-mini"},
        "medium": {"free": "gpt-4o-mini", "pro": "claude-sonnet-4", "enterprise": "claude-sonnet-4"},
        "complex": {"free": "gpt-4o-mini", "pro": "gpt-4o", "enterprise": "claude-opus-4"},
    }
    model = routing_table[complexity].get(tier, "gpt-4o-mini")
    return {"query": query, "complexity": complexity, "model": model, "tier": tier}
```

### 第 7 步：运行 Demo

```python
def simulate_llm_call(model, query):
    input_tokens = len(query.split()) * 4 + 500
    output_tokens = 150 + (len(query.split()) * 2)
    latency = 200 + (output_tokens * 2)
    return {
        "model": model,
        "response": f"[Simulated {model} response to: {query[:50]}...]",
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "latency_ms": latency,
    }


def run_demo():
    print("=" * 60)
    print("  Caching, Rate Limiting & Cost Optimization Demo")
    print("=" * 60)

    print("\n--- Model Pricing ---")
    for model, pricing in list(MODEL_PRICING.items())[:6]:
        cost_1k = calculate_cost(model, 1000, 500)
        print(f"  {model}: ${cost_1k['total_cost']:.6f} per 1K in + 500 out")

    print("\n--- Cost Comparison: 100K Requests ---")
    for model in ["gpt-4o", "gpt-4o-mini", "claude-sonnet-4", "claude-haiku-3.5"]:
        cost = calculate_cost(model, 1000 * 100_000, 500 * 100_000)
        print(f"  {model}: ${cost['total_cost']:.2f}")

    print("\n--- Anthropic Cache Savings ---")
    no_cache = calculate_cost("claude-sonnet-4", 2000, 500, 0)
    with_cache = calculate_cost("claude-sonnet-4", 2000, 500, 1500)
    saving = no_cache["total_cost"] - with_cache["total_cost"]
    print(f"  Without cache: ${no_cache['total_cost']:.6f}")
    print(f"  With 1500 cached tokens: ${with_cache['total_cost']:.6f}")
    print(f"  Savings per call: ${saving:.6f} ({saving/no_cache['total_cost']*100:.1f}%)")

    exact_cache = ExactCache(max_size=100, ttl_seconds=300)
    semantic_cache = SemanticCache(similarity_threshold=0.75, max_size=100)
    rate_limiter = TokenBucketRateLimiter()
    tracker = CostTracker(monthly_budget=100.0)

    print("\n--- Exact Cache ---")
    messages_1 = [{"role": "user", "content": "What is the return policy?"}]
    result = exact_cache.get("gpt-4o-mini", messages_1, 0.0)
    print(f"  First lookup: {'HIT' if result else 'MISS'}")
    exact_cache.put("gpt-4o-mini", messages_1, 0.0, "You can return items within 30 days.")
    result = exact_cache.get("gpt-4o-mini", messages_1, 0.0)
    print(f"  Second lookup: {'HIT' if result else 'MISS'} -> {result}")
    result = exact_cache.get("gpt-4o-mini", messages_1, 0.7)
    print(f"  With temp=0.7: {'HIT' if result else 'MISS (non-deterministic, skip cache)'}")
    print(f"  Stats: {exact_cache.stats()}")

    print("\n--- Semantic Cache ---")
    test_queries = [
        ("What is the return policy?", "Items can be returned within 30 days with receipt."),
        ("How do I return an item?", None),
        ("What are your store hours?", "We are open 9am-9pm Monday through Saturday."),
        ("When does the store open?", None),
        ("Tell me about quantum computing", "Quantum computers use qubits..."),
        ("Explain quantum mechanics", None),
    ]
    for query, response in test_queries:
        cached = semantic_cache.get(query)
        if cached:
            print(f"  '{query[:40]}' -> CACHE HIT (sim={cached['similarity']}, original='{cached['original_query'][:40]}')")
        elif response:
            semantic_cache.put(query, response)
            print(f"  '{query[:40]}' -> MISS (stored)")
        else:
            print(f"  '{query[:40]}' -> MISS (no match)")
    print(f"  Stats: {semantic_cache.stats()}")

    print("\n--- Rate Limiting ---")
    for i in range(12):
        check = rate_limiter.check("user_1", 1000, "free")
        if check["allowed"]:
            rate_limiter.consume("user_1", 1000, "free")
        status = "OK" if check["allowed"] else f"BLOCKED ({check['reason']})"
        if i < 5 or not check["allowed"]:
            print(f"  Request {i+1}: {status}")
    print(f"  Usage: {rate_limiter.get_usage('user_1')}")

    print("\n--- Model Routing ---")
    routing_queries = [
        "What time do you close?",
        "Summarize this quarterly earnings report",
        "Analyze the trade-offs between microservices and monoliths",
        "Hello",
        "Write code for a binary search tree with deletion",
    ]
    for q in routing_queries:
        route = route_model(q, "pro")
        print(f"  '{q[:50]}' -> {route['model']} ({route['complexity']})")

    print("\n--- Full Pipeline: Before vs After Optimization ---")
    queries = [
        "What is the return policy?",
        "How do I return something?",
        "What are your hours?",
        "When do you open?",
        "Explain the difference between TCP and UDP",
        "Compare TCP vs UDP protocols",
        "Hello",
        "What is your phone number?",
        "Write a Python function to sort a list",
        "Analyze the pros and cons of serverless architecture",
    ]

    print("\n  [Before: no caching, single model (gpt-4o)]")
    tracker_before = CostTracker(monthly_budget=1000.0)
    for q in queries:
        result = simulate_llm_call("gpt-4o", q)
        tracker_before.log_call("gpt-4o", result["input_tokens"], result["output_tokens"], latency_ms=result["latency_ms"], cache_status="miss")
    before = tracker_before.summary()
    print(f"  Total cost: ${before['total_cost']:.6f}")
    print(f"  Avg cost/call: ${before['avg_cost_per_call']:.6f}")
    print(f"  Avg latency: {before['avg_latency_ms']}ms")

    print("\n  [After: caching + routing + rate limiting]")
    exact_c = ExactCache()
    semantic_c = SemanticCache(similarity_threshold=0.75)
    tracker_after = CostTracker(monthly_budget=1000.0)

    for q in queries:
        messages = [{"role": "user", "content": q}]
        cached = exact_c.get("gpt-4o", messages, 0.0)
        if cached:
            tracker_after.log_call("gpt-4o-mini", 0, 0, latency_ms=5, cache_status="hit")
            continue
        sem_cached = semantic_c.get(q)
        if sem_cached:
            tracker_after.log_call("gpt-4o-mini", 0, 0, latency_ms=15, cache_status="hit")
            continue
        route = route_model(q)
        result = simulate_llm_call(route["model"], q)
        tracker_after.log_call(route["model"], result["input_tokens"], result["output_tokens"], latency_ms=result["latency_ms"], cache_status="miss")
        exact_c.put(route["model"], messages, 0.0, result["response"])
        semantic_c.put(q, result["response"])

    after = tracker_after.summary()
    print(f"  Total cost: ${after['total_cost']:.6f}")
    print(f"  Avg cost/call: ${after['avg_cost_per_call']:.6f}")
    print(f"  Avg latency: {after['avg_latency_ms']}ms")
    print(f"  Cache hit rate: {after['cache_hit_rate']:.0%}")

    if before["total_cost"] > 0:
        savings_pct = (1 - after["total_cost"] / before["total_cost"]) * 100
        print(f"\n  SAVINGS: {savings_pct:.1f}% cost reduction")
        print(f"  Latency improvement: {(1 - after['avg_latency_ms'] / before['avg_latency_ms']) * 100:.1f}% faster")

    print("\n--- Budget Alerts Demo ---")
    alert_tracker = CostTracker(monthly_budget=0.01)
    for i in range(5):
        alert_tracker.log_call("gpt-4o", 5000, 2000, latency_ms=500)
    print(f"  Total spent: ${alert_tracker.total_cost():.6f} / ${alert_tracker.monthly_budget}")
    for alert in alert_tracker.alerts:
        print(f"  ALERT [{alert['level'].upper()}]: {alert['message']}")

    print("\n--- Cost Breakdown by Model ---")
    multi_tracker = CostTracker(monthly_budget=500.0)
    for _ in range(50):
        multi_tracker.log_call("gpt-4o-mini", 800, 200, latency_ms=150)
    for _ in range(30):
        multi_tracker.log_call("claude-sonnet-4", 1500, 500, latency_ms=400)
    for _ in range(10):
        multi_tracker.log_call("gpt-4o", 2000, 800, latency_ms=600)
    for _ in range(10):
        multi_tracker.log_call("claude-opus-4", 3000, 1000, latency_ms=1200)
    breakdown = multi_tracker.cost_by_model()
    for model, data in sorted(breakdown.items(), key=lambda x: x[1]["cost"], reverse=True):
        print(f"  {model}: {data['calls']} calls, ${data['cost']:.6f}, {data['input_tokens']:,} in / {data['output_tokens']:,} out")
    print(f"  Total: ${multi_tracker.total_cost():.6f}")

    print("\n" + "=" * 60)
    print("  Demo complete.")
    print("=" * 60)


if __name__ == "__main__":
    run_demo()
```

## 实际使用

### Anthropic Prompt Caching

```python
# import anthropic
#
# client = anthropic.Anthropic()
#
# response = client.messages.create(
#     model="claude-sonnet-5",
#     max_tokens=1024,
#     system=[
#         {
#             "type": "text",
#             "text": "You are a helpful customer support agent for Acme Corp...",
#             "cache_control": {"type": "ephemeral"},
#         }
#     ],
#     messages=[{"role": "user", "content": "What is the return policy?"}],
# )
#
# print(f"Input tokens: {response.usage.input_tokens}")
# print(f"Cache creation tokens: {response.usage.cache_creation_input_tokens}")
# print(f"Cache read tokens: {response.usage.cache_read_input_tokens}")
```

第一次调用会写入缓存，并额外支付 25% 的费用。之后每次具有相同 system prompt 前缀的调用都会从缓存中读取，并获得 90% 的折扣。缓存持续 5 分钟，每次命中都会重置计时器。

### OpenAI 自动缓存

```python
# from openai import OpenAI
#
# client = OpenAI()
#
# response = client.chat.completions.create(
#     model="gpt-4o",
#     messages=[
#         {"role": "system", "content": "You are a helpful customer support agent..."},
#         {"role": "user", "content": "What is the return policy?"},
#     ],
# )
#
# print(f"Prompt tokens: {response.usage.prompt_tokens}")
# print(f"Cached tokens: {response.usage.prompt_tokens_details.cached_tokens}")
# print(f"Completion tokens: {response.usage.completion_tokens}")
```

OpenAI 会自动进行缓存。任何包含 1,024 个以上 Token 且与最近请求匹配的 Prompt 前缀，都可以获得 50% 的折扣。不需要修改代码，只需检查响应中的 `prompt_tokens_details.cached_tokens`，即可验证缓存是否生效。

### OpenAI Batch API

```python
# import json
# from openai import OpenAI
#
# client = OpenAI()
#
# requests = []
# for i, query in enumerate(queries):
#     requests.append({
#         "custom_id": f"request-{i}",
#         "method": "POST",
#         "url": "/v1/chat/completions",
#         "body": {
#             "model": "gpt-4o-mini",
#             "messages": [{"role": "user", "content": query}],
#         },
#     })
#
# with open("batch_input.jsonl", "w") as f:
#     for r in requests:
#         f.write(json.dumps(r) + "\n")
#
# batch_file = client.files.create(file=open("batch_input.jsonl", "rb"), purpose="batch")
# batch = client.batches.create(input_file_id=batch_file.id, endpoint="/v1/chat/completions", completion_window="24h")
# print(f"Batch ID: {batch.id}, Status: {batch.status}")
```

Batch API 对所有 Token 提供统一的 50% 折扣，结果会在 24 小时内返回。它非常适合非实时工作负载，例如 Evaluation、数据标注和批量摘要。

### 使用 Redis 的生产级 Semantic Cache

```python
# import redis
# import numpy as np
# from openai import OpenAI
#
# r = redis.Redis()
# client = OpenAI()
#
# def get_embedding(text):
#     response = client.embeddings.create(model="text-embedding-3-small", input=text)
#     return response.data[0].embedding
#
# def semantic_cache_lookup(query, threshold=0.95):
#     query_emb = np.array(get_embedding(query))
#     keys = r.keys("cache:emb:*")
#     best_sim, best_key = 0, None
#     for key in keys:
#         stored_emb = np.frombuffer(r.get(key), dtype=np.float32)
#         sim = np.dot(query_emb, stored_emb) / (np.linalg.norm(query_emb) * np.linalg.norm(stored_emb))
#         if sim > best_sim:
#             best_sim, best_key = sim, key
#     if best_sim >= threshold and best_key:
#         response_key = best_key.decode().replace("cache:emb:", "cache:resp:")
#         return r.get(response_key).decode()
#     return None
```

在生产环境中，应使用 Vector 索引（Redis Vector Search、Pinecone 或 pgvector）替代线性扫描。线性扫描适用于少于 1,000 个条目的情况。超过该规模后，应使用 ANN（approximate nearest neighbor）实现 O(log n) 查找。

## 交付成果

本课会生成 `outputs/prompt-cost-optimizer.md`，这是一个可复用 Prompt，用于分析你的 LLM 应用，并根据预计节省金额推荐具体的成本优化措施。

本课还会生成 `outputs/skill-cost-patterns.md`，这是一个决策框架，可帮助你根据具体使用场景选择合适的缓存策略、速率限制配置和 Model routing 规则。

## 练习

1. **为 semantic cache 实现 LRU 淘汰。** 使用 least-recently-used 替换优先淘汰最旧条目的策略。追踪每个条目的最后访问时间，并在缓存已满时淘汰访问时间最早的条目。在 100 次查询中比较两种策略的命中率。

2. **构建成本预测 Tool。** 给定一份 API 调用日志（CostTracker 日志），根据过去 7 天的平均值预测每月成本。考虑工作日和周末的模式。如果预测的每月成本超出预算 20% 以上，则触发告警。

3. **实现分层 Semantic caching。** 使用两个相似度阈值：0.98 用于高置信度命中（立即返回），0.90 用于中等置信度命中（返回时附带免责声明：“Based on a similar previous question...”）。追踪每次命中所属的层级，并衡量用户满意度的差异。

4. **构建 Model routing classifier。** 使用基于 Embedding 的 classifier 替换基于关键词的 classifier。为 50 个已标注查询（simple/medium/complex）生成 Embedding，然后通过查找最近的已标注示例来对新查询进行 Classification。使用包含 20 个查询的测试集衡量 Classification 准确率。

5. **实现具有降级级别的 Circuit breaker。** 预算达到 70% 时记录警告；达到 85% 时，自动将所有路由切换到最便宜的 Model（gpt-4o-mini）；达到 95% 时，仅提供缓存响应并拒绝新查询。针对 1.00 美元预算模拟 1,000 次请求，验证每个阈值都能正确触发。

## 关键术语

| 术语 | 人们常说的含义 | 实际含义 |
|------|----------------|----------------------|
| Prompt caching | “缓存 system prompt” | 提供商级缓存，重复的 Prompt 前缀可获得折扣（Anthropic 为 90%，OpenAI 为 50%）；OpenAI 无需修改代码，Anthropic 需要显式标记 |
| Semantic caching | “智能缓存” | 为查询生成 Embedding，计算它与历史查询的相似度，并在相似度超过阈值时返回缓存响应；它能够捕获精确匹配无法识别的改写表达 |
| 精确缓存 | “哈希缓存” | 对完整 Prompt（Model + 消息 + temperature）计算哈希，并为相同输入返回缓存响应；仅适用于 temperature=0 的确定性调用 |
| Token bucket | “速率限制器” | 一种算法，每位用户都有一个包含 N 个 Token 的 bucket，并以每秒 R 个 Token 的速率补充；它允许最多 N 个 Token 的突发用量，同时强制执行平均速率 R |
| Model routing | “省钱路由” | 使用 classifier 将简单查询发送给低成本 Model（GPT-4o-mini、Haiku），将复杂查询发送给高成本 Model（GPT-4o、Opus）；可节省 40-70% 的 Model 成本 |
| 成本追踪 | “计量” | 记录每次 API 调用的 Model、Token、延迟、成本和用户 ID，从而准确了解资金流向以及哪些 Feature 成本较高 |
| Circuit breaker | “紧急停止开关” | 当支出接近预算上限时，自动降级服务（使用更便宜的 Model、仅使用缓存），或完全停止处理请求 |
| Batch API | “批量折扣” | OpenAI 提供的异步处理服务，折扣为 50%；最多可提交 50,000 个请求，并在 24 小时内获得结果 |
| Prompt 压缩 | “Token 瘦身” | 在保留含义的同时，重写 system prompt 和 Context 以减少 Token；更短的 Prompt 成本更低，而且通常表现更好 |
| 缓存命中率 | “缓存效率” | 从缓存提供响应而不是调用 LLM 的请求比例；生产级 chatbot 的典型值为 40-60%，成本会按相同比例降低 |

## 延伸阅读

- [Anthropic Prompt Caching Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — Anthropic 显式 `cache_control` 标记、定价和缓存生命周期行为的官方文档
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) — OpenAI 的自动缓存机制、如何通过 usage 字段验证缓存命中，以及最小前缀长度
- [OpenAI Batch API](https://platform.openai.com/docs/guides/batch) — 异步处理可享受 50% 折扣，并介绍 JSONL 格式、24 小时完成窗口和 50K 请求限制
- [GPTCache](https://github.com/zilliztech/GPTCache) — 开源 Semantic caching 库，支持多种 Embedding 后端、Vector store 和淘汰策略
- [Martian Model Router](https://docs.withmartian.com) — 生产级 Model routing，可自动选择能够处理每个查询的最便宜 Model
- [Not Diamond](https://www.notdiamond.ai) — 基于 ML 的 Model router，可从流量模式中学习，以优化不同提供商之间的成本与质量权衡
- [Helicone](https://www.helicone.ai) — LLM 可观测性平台，以代理层形式提供成本追踪、缓存、速率限制和预算告警
- [Dean & Barroso, "The Tail at Scale" (CACM 2013)](https://research.google/pubs/the-tail-at-scale/) — 延迟、吞吐量、TTFT/TPOT 百分位数和 hedged requests；“选择仍能满足 P95 的最便宜 Model”背后的成本模型
- [Kwon et al., "Efficient Memory Management for Large Language Model Serving with PagedAttention" (SOSP 2023)](https://arxiv.org/abs/2309.06180) — vLLM 论文；解释 paged KV-cache + continuous batching 为何能在吞吐量方面以 24 倍优势击败朴素 server，也是“缓存与成本”之下的基础设施层
- [Dao et al., "FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning" (ICLR 2024)](https://arxiv.org/abs/2307.08691) — 与 Prompt caching 正交的 kernel 级成本降低方法；可结合 speculative decoding 和 GQA 阅读，以获得完整的成本曲线视图
