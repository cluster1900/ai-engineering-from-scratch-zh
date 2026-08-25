# Prompt Caching 与 Semantic Caching 的经济性

> **定价快照日期为 2026-04。** 下文中的数字来自本课发布时记录的供应商价目表；在下游引用这些数字之前，请先根据链接文档进行核验。

> 缓存发生在两个层级。L2（供应商层）Prompt/前缀缓存会对重复前缀复用 Attention KV。Anthropic 的 Prompt Caching 文档宣称，对于长 Prompt，成本最多可降低 90%，延迟最多可降低 85%；对于 Claude 3.5 Sonnet，缓存读取价格为 $0.30/M，而新输入为 $3.00/M，默认 TTL 为 5 分钟，1 小时 TTL 选项的写入溢价为 2 倍（docs.anthropic.com，2026-04）。OpenAI Prompt Caching 会自动应用于 ≥1024 Token 的 Prompt，缓存输入价格约比新输入低 90%（platform.openai.com，2026-04）；每个 Model 的确切缓存价格取决于实时价目表。L1（应用层）Semantic Caching 会在 Embedding 相似度命中时完全跳过 LLM。供应商宣称的“95% accuracy”指匹配正确率，而不是命中率。报告中的生产命中率从 10%（开放式聊天）到 70%（结构化 FAQ）不等；两家供应商都没有发布官方基准，因此应将这些数据视为社区遥测，而不是保证。生产环境中的陷阱包括：并行化会破坏缓存（在首次缓存写入完成前发出 N 个并行请求，可能使支出增加数倍），而前缀中的动态内容会完全阻止缓存命中。ProjectDiscovery 报告称，通过将动态文本移出可缓存前缀，命中率从 7% 提升到了 74%（2025-11）。

**Type:** Learn
**Languages:** Python（stdlib，简化的双层缓存模拟器）
**Prerequisites:** Phase 17 · 04（Serving Engine 内部机制）、Phase 17 · 06（SGLang RadixAttention）
**Time:** ~60 分钟

## Learning Objectives

- 区分 L2 Prompt/前缀缓存（供应商端的 KV 复用）与 L1 Semantic Caching（对相似 Prompt 绕过 LLM）。
- 解释 Anthropic 的显式 `cache_control` 标记，以及两个 TTL 选项（5 分钟与 1 小时）及其价格倍数。
- 根据命中率、Prompt/响应比例和 Token 价格，计算预期的月度节省金额。
- 说明会使账单膨胀 5-10 倍的并行化反模式，以及会导致命中率崩溃的动态内容反模式。

## 问题

你为 RAG 服务添加了 Prompt Caching，但账单没有变化。测量后发现命中率只有 7%。你的 Prompt 看似静态，实际上却并非如此：系统 Prompt 包含精确到分钟的当前日期、请求 ID，以及为了增加多样性而随机调整顺序的示例。每个请求都会写入一个新的缓存条目，读取次数为零。

与此同时，你的 Agent 会针对每个用户问题并行执行十次 Tool 调用。这十个请求都在首次缓存写入完成前到达供应商。结果是十次写入，零次读取。你的账单是“启用缓存”预期成本的 5-10 倍。

缓存是一种协议，不是一个开关。两个层级，有两种不同的失败模式。

## 概念

### L2 — 供应商 Prompt/前缀缓存

供应商会存储可缓存前缀的 Attention KV，并在下一个请求匹配该前缀时复用。你只需支付一次写入成本，后续读取几乎免费。

**Anthropic（Claude 3.5 / 3.7 / 4 系列）**：请求中使用显式 `cache_control` 标记。你需要标记哪些 block 可缓存。TTL：5 分钟（写入成本为基础价格的 1.25 倍）或 1 小时（写入成本为基础价格的 2 倍）。Claude 3.5 Sonnet 的缓存读取价格为 $0.30/M，而新输入为 $3.00/M，便宜 10 倍（docs.anthropic.com，截至 2026-04）。不同 Model 的价格不同（Opus/Haiku 单独发布）；务必与实时定价页面交叉核验。

**OpenAI**：自动对 ≥1024 Token 的 Prompt 启用缓存（platform.openai.com，2026-04）。无需显式 flag。在当前 gpt-4o/gpt-5 价目表中，缓存输入的价格约为新输入的十分之一。文档和 release note 都没有发布官方命中率基准；在精心设计 Prompt 的情况下，社区报告通常集中在 30–60%。请监控 `usage.cached_tokens` 来测量自己的数据。

**Google（Gemini）**：通过显式 API 进行 Context Caching；对于 1M Token Context，缓存带来的收益更大。

**Self-hosted（vLLM、SGLang）**：Phase 17 · 06 介绍了 RadixAttention，即在自己的计算资源上采用相同模式。

### L1 — 应用层 Semantic Caching

在调用 LLM 之前，先对 Prompt 进行 hash 和 Embedding，然后查找相似的已缓存请求（余弦相似度高于阈值，通常为 0.95+）。命中时，返回缓存响应。未命中时，调用 LLM 并缓存结果。

Open-source：Redis Vector Similarity、GPTCache、Qdrant。Commercial：Portkey Cache、Helicone Cache。

供应商的 accuracy 声明指返回的缓存响应在语义上合适的频率，而不是缓存命中的频率。生产环境命中率如下：

- 开放式聊天：10-15%。
- 结构化 FAQ / 支持服务：40-70%。
- 代码问题：20-30%（微小变体就会导致无法命中）。
- 重复 Prompt 的语音 Agent：50-80%（语音规范化为固定集合）。

### 并行化反模式

你的 Agent 会并行执行 10 次 Tool 调用。所有调用都包含相同的 4K Token 系统 Prompt。Anthropic 的缓存写入按请求执行；供应商收到 Prompt 后约 300 ms，首次缓存写入才会完成。请求 2-10 在同一个毫秒时间窗口内到达，每一个都会发生缓存未命中。你支付了 10 次写入溢价，却没有获得任何读取折扣。

修复方法：使用 sequential-first 方式分 Batch。先单独发出请求 1，等其缓存填充完成后再发出请求 2-10。这会给首次 Tool 调用增加 300 ms 延迟，但可以将账单降低 5-10 倍。

### 动态内容反模式

你的系统 Prompt 如下：

```
You are a helpful assistant. The current time is 14:32:17.
User ID: abc123. Today is Tuesday...
```

每个请求都是唯一的。每个请求都会写入缓存。命中次数为零。

修复方法：将所有真正静态的内容移到可缓存前缀中，并在缓存边界后附加动态内容：

```
[cacheable]
You are a helpful assistant. [rules, examples, instructions]
[/cacheable]
[dynamic, not cached]
Current time: 14:32:17. User: abc123.
```

ProjectDiscovery 通过这种方式将缓存命中率从 7% 提升到了 74%，并公开了具体结构。

### 为隔夜工作负载叠加 Batch 与缓存

Batch API（Phase 17 · 15）可在 24 小时周转时间下提供 50% 折扣。再叠加缓存输入，成本还能在此基础上降低约 10 倍。隔夜 Classification、Labeling 和报告生成工作负载通过叠加这些机制，可将成本降至同步、无缓存成本的约 10%。

### 你应该记住的数字

以下定价数据于 2026-04 从链接的供应商文档中获取，每隔几个月就可能发生变化，请在依赖这些数字前重新核验。

- Anthropic 缓存读取：Claude 3.5 Sonnet 为 $0.30/M，约比新输入便宜 10 倍（docs.anthropic.com）。
- Anthropic 缓存写入溢价：1.25 倍（5 分钟 TTL）或 2 倍（1 小时 TTL）。
- OpenAI 自动缓存：适用于 ≥1024 Token 的 Prompt；在当前价目表中，缓存输入价格约为新输入的 10%（platform.openai.com）。
- Semantic Cache 命中率（社区报告）：开放式聊天约 10%；结构化 FAQ 最高约 70%。这不是供应商记录的基准。
- ProjectDiscovery：通过将动态内容移出前缀，将命中率从 7% 提升到 74%（项目博客，2025-11）。
- 并行化反模式：当 N 个并行请求错过首次缓存写入时，典型报告显示账单会膨胀 5–10 倍。

```figure
semantic-cache-hit
```

## 使用它

`code/main.py` 在混合工作负载上模拟 L1 + L2 缓存。它会报告命中率和账单，并展示并行化带来的成本惩罚。

## 交付它

本课将生成 `outputs/skill-cache-auditor.md`。给定 Prompt template 和流量后，它会审计可缓存性并建议如何重构。

## 练习

1. 运行 `code/main.py`。切换并行化 flag。账单会发生多大变化？
2. 你的系统 Prompt 中包含日期。将其移出，并展示调整前后的命中率计算。
3. 给定请求到达率，计算 1 小时 TTL（2 倍写入成本）与 5 分钟 TTL（1.25 倍写入成本）的盈亏平衡点。
4. Semantic Cache 在 0.95 阈值下的命中率为 20%。在 0.85 阈值下，命中率为 50%，但会出现错误的缓存响应。选择正确的阈值并说明理由。
5. 你会针对每个用户问题并行分 Batch 执行 10 个子查询。重写流程，使其更有利于缓存，同时不增加端到端延迟。

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| L2 Prompt Cache | “前缀缓存” | 供应商为重复前缀存储 KV |
| `cache_control` | “Anthropic 缓存标记” | 用于标记可缓存 block 的显式属性 |
| Cache write premium | “写入税” | 首次从未命中到写入缓存的额外成本（1.25 倍或 2 倍） |
| L1 Semantic Cache | “Embedding 缓存” | 调用 LLM 前在应用层执行 hash 和 Embedding |
| GPTCache | “LLM 缓存库” | 流行的 OSS L1 缓存库 |
| Cache hit rate | “命中数 / 总数” | 由缓存提供服务的请求比例 |
| Parallelization anti-pattern | “N 次写入陷阱” | N 个并行请求导致 N 次缓存未命中 |
| Dynamic content trap | “Prompt 中的时间陷阱” | 前缀中的动态字节会破坏命中率 |
| RadixAttention | “副本内缓存” | SGLang 的前缀缓存实现 |

## 延伸阅读

- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — 官方 `cache_control` 语义和 TTL。
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) — 自动缓存行为和适用条件。
- [TianPan — 生产环境中的 LLM Semantic Caching](https://tianpan.co/blog/2026-04-10-semantic-caching-llm-production)
- [ProjectDiscovery — 使用 Prompt Caching 将 LLM 成本降低 59%](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching)
- [DigitalOcean / Anthropic — Prompt Caching](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)
