# Prompt Caching 与 Semantic Caching 经济学

> **Pricing snapshot 日期为 2026-04。** 以下数值声明反映本课发布时采集的 vendor rate cards；在下游引用前，请先对照链接文档核验。

> Caching 发生在两层。L2（provider-level）prompt/prefix caching 会为重复 prefix 复用 attention KV —— Anthropic 的 prompt-caching docs 宣称，在长 prompts 上最高可降低 90% 成本、降低 85% latency；对于 Claude 3.5 Sonnet，cache reads 为 $0.30/M，而 fresh 为 $3.00/M，TTL 为 5 分钟，1-hour TTL 选项有 2x write premium（docs.anthropic.com，2026-04）。OpenAI prompt caching 会自动应用于 ≥1024 tokens 的 prompts，并将 cached input 定价为相对 fresh 约 90% 折扣（platform.openai.com，2026-04）；精确的 per-model cached rate 取决于 live rate card。L1（app-level）semantic caching 会在 Embedding similarity 命中时完全跳过 LLM。Vendor “95% accuracy” 指的是匹配正确性，而不是 hit rate —— 报告的生产 hit rates 从 10%（open-ended chat）到 70%（structured FAQ）不等；两家 provider 都没有发布 official baseline，因此应把这些视为 community telemetry，而不是保证。生产陷阱：parallelization 会破坏 caching（在第一次 cache write 之前发出的 N 个 parallel requests 会让花费膨胀数倍），而 prefix 内的 dynamic content 会完全阻止 cache hits。ProjectDiscovery 报告称，通过将 dynamic text 移出 cacheable prefix，hit rate 从 7% 提升到 74%（2025-11）。

**Type:** Learn
**Languages:** Python (stdlib, toy two-layer cache simulator)
**前置要求：** Phase 17 · 04 (vLLM Serving Internals), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 分钟

## 学习目标
- 区分 L2 prompt/prefix caching（provider 侧 KV 复用）与 L1 semantic caching（对相似 prompts 绕过 LLM）。
- 解释 Anthropic 的 `cache_control` 显式标记，以及两个 TTL 选项（5-min 与 1-hour）及其 price multipliers。
- 根据 hit rate、prompt/response mix 和 Token prices，计算预期月度节省。
- 说出会让账单膨胀 5-10x 的 parallelization anti-pattern，以及会让 hit rate 崩塌的 dynamic-content anti-pattern。

## 问题
你给自己的 RAG service 加了 prompt caching。账单没有变化。你测量 hit rate；只有 7%。你的 prompts 看起来是静态的，但其实不是 —— system prompt 包含按分钟格式化的当前日期、request ID，以及为了多样性而随机重排的示例。每个 request 都写入一个新的 cache entry，读取为零。

另外，你的 agent 会为每个 user question 并行运行十个 tool calls。十个请求都在第一次 cache write 完成之前到达 provider。十次写入，零次读取。你的账单是“开启 caching 后”本应成本的 5-10x。

Caching 是一种协议，不是一个 flag。两层，两种不同的 failure modes。

## 概念
### L2 — provider prompt/prefix caching

Provider 存储 cacheable prefix 的 attention KV，并在下一个匹配该 prefix 的 request 上复用它。你只支付一次 write cost，reads 几乎免费。

**Anthropic (Claude 3.5 / 3.7 / 4 series)**：request 中的显式 `cache_control` marker。你标记哪些 blocks 可 cache。TTL：5-minute（write costs 为 1.25x base）或 1-hour（write costs 为 2x base）。Cache reads：Claude 3.5 Sonnet 上为 $0.30/M，而 fresh 为 $3.00/M —— 便宜 10x（docs.anthropic.com，截至 2026-04）。不同 model 的 rates 不同（Opus/Haiku 分别发布）；始终交叉核对 live pricing page。

**OpenAI**：对 ≥1024 tokens 的 prompts 自动 caching（platform.openai.com，2026-04）。没有显式 flag。在当前 gpt-4o/gpt-5 rate cards 上，cached input 约比 fresh 便宜 10x。docs 和 release notes 都没有发布 official hit-rate baseline；community reports 在精心设计 prompt 后大多集中在 30–60%。监控 `usage.cached_tokens` 来测量你自己的情况。

**Google (Gemini)**：通过显式 API 做 context caching；1M-token context 意味着 caching 的收益更大。

**Self-hosted (vLLM, SGLang)**：Phase 17 · 06 介绍 RadixAttention —— 在你自己的 compute 上采用相同模式。

### L1 — app 级 semantic caching

在调用 LLM 之前，先 hash prompt、对其做 Embedding，并查找相似的 cached request（cosine similarity 高于 threshold，通常为 0.95+）。命中时，返回 cached response。未命中时，调用 LLM 并 cache 结果。

Open-source：Redis Vector Similarity、GPTCache、Qdrant。Commercial：Portkey Cache、Helicone Cache。

Vendor accuracy claims 指的是返回的 cached response 在语义上合适的频率，而不是命中频率。生产 hit rates：

- Open-ended chat：10-15%。
- Structured FAQ / support：40-70%。
- Code questions：20-30%（小变体会破坏 hits）。
- Voice agents repeating prompts：50-80%（voice normalization fixed set）。

### The parallelization anti-pattern

你的 agent 并行发起 10 个 tool calls。全部 10 个都有相同的 4K-token system prompt。Anthropic cache writes 是 per-request 的；第一次 cache-write 在 provider 看到 prompt 后约 300 ms 完成。Requests 2-10 在同一毫秒窗口到达，并且每个都会看到 cache miss。你支付了 10 次 write premiums，0 次 read discounts。

修复：batch with sequential-first —— 单独发起 request 1，然后在 1 的 cache 已经 populated 后再触发 2-10。给第一个 tool call 增加 300 ms；节省 5-10x 账单。

### The dynamic content anti-pattern

你的 system prompt 看起来像：

```
You are a helpful assistant. The current time is 14:32:17.
User ID: abc123. Today is Tuesday...
```

每个 request 都是唯一的。每个 request 都会写入。零 hits。

修复：把所有真正静态的内容移动到 cacheable prefix；把 dynamic content 追加到 cache boundary 之后：

```
[cacheable]
You are a helpful assistant. [rules, examples, instructions]
[/cacheable]
[dynamic, not cached]
Current time: 14:32:17. User: abc123.
```

ProjectDiscovery 通过这种方式把 cache hit rate 从 7% 提升到 74%，并发布了该 anatomy。

### Stack batch + cache for overnight workloads

Batch APIs（Phase 17 · 15）在 24-hour turnaround 下提供 50% 折扣。Cached input 叠加后又能获得约 10x。Overnight classification、labeling 和 report generation workloads 可以通过叠加降到 synchronous-uncached 成本的约 10%。

### Numbers you should remember

Pricing points 是从链接的 vendor docs 中采集的 2026-04 数据，并且每几个月会变化 —— 依赖它们之前请重新核验。

- Anthropic cached read：Claude 3.5 Sonnet 上 $0.30/M，约比 fresh input 便宜 10x（docs.anthropic.com）。
- Anthropic cache write premium：1.25x（5-min TTL）或 2x（1-hour TTL）。
- OpenAI auto-cache：适用于 ≥1024 tokens 的 prompts；在当前 rate cards 上，cached input 定价约为 fresh input 的 10%（platform.openai.com）。
- Semantic cache hit rate（community-reported）：open chat 约 ~10%；structured FAQ 最高约 ~70%。不是 vendor-documented baseline。
- ProjectDiscovery：通过将 dynamic 移出 prefix，hit rate 从 7% → 74%（project blog，2025-11）。
- Parallelization anti-pattern：典型报告显示，当 N 个 parallel requests 错过第一次 cache write 时，账单会膨胀 5–10x。

## 使用它
`code/main.py` 模拟混合 workloads 上的 L1 + L2 caching。报告 hit rates、bill，并展示 parallelization penalty。

## 交付它
本课产出 `outputs/skill-cache-auditor.md`。给定 prompt template 和 traffic，它会审计 cacheability 并推荐 restructure。

## 练习
1. 运行 `code/main.py`。切换 parallelization flag。账单变化多少？
2. 你的 system prompt 有日期。把它移出去。展示 before/after hit rate math。
3. 在给定 request arrival rate 的情况下，计算 1-hour TTL（2x write）与 5-minute TTL（1.25x write）的 break-even。
4. Semantic cache 在 0.95 threshold 下命中 20%。在 0.85 下命中 50%，但你看到错误的 cached responses。选择正确 threshold 并说明理由。
5. 你对每个 user question batch 10 个 parallel sub-queries。重写为 cache-friendly，同时不增加 end-to-end latency。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| L2 prompt cache | "prefix cache" | Provider 存储重复 prefix 的 KV |
| `cache_control` | "Anthropic cache marker" | 标记 cacheable blocks 的显式 attribute |
| Cache write premium | "write tax" | 从首次 miss 到 cache 的额外成本（1.25x 或 2x） |
| L1 semantic cache | "embedding cache" | 调用 LLM 前在 app-level 进行 hash-and-embed |
| GPTCache | "LLM caching lib" | 流行的 OSS L1 cache library |
| Cache hit rate | "hits / total" | 从 cache 服务的 requests 占比 |
| Parallelization anti-pattern | "the N-write trap" | N 个 parallel requests 会 N 次 miss cache |
| Dynamic content trap | "the time-in-prompt trap" | prefix 中的 dynamic bytes 会破坏 hit rate |
| RadixAttention | "intra-replica cache" | SGLang 的 prefix-cache implementation |

## 延伸阅读
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — official `cache_control` semantics 与 TTLs。
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) — automatic caching behavior 与 eligibility。
- [TianPan — Semantic Caching for LLMs Production](https://tianpan.co/blog/2026-04-10-semantic-caching-llm-production)
- [ProjectDiscovery — Cut LLM Costs 59% With Prompt Caching](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching)
- [DigitalOcean / Anthropic — Prompt Caching](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)
