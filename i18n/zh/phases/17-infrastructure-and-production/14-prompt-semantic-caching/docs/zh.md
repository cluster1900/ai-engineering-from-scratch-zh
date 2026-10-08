# 快速缓存与语义缓存 经济学

> **Pricing snapshot 日期为 2026-04。**下列数值声明反映本课程发布时采集的供应商利率卡; 在下游引用前,请先对照链接文档核查.

> 缓存发生在两层――L2(提供商级) 缓存/预写会为重复预写 复用注意 KV  人类的缓存文件 宣称,在长时间的提示上最高可降低90% 成本、降低85%延迟;对于Claude 3.5 Sonnet,缓存读为$0.30/M，而 fresh 为 $开AI提示缓存会自动应用于1024个代币的提示,并将缓存输入定价比新鲜约90%折扣 (platform.openai.com,2026-04);具体的每模型缓存率取决于现场率卡.L1应用级) 语义缓存会在嵌入式相似性中完全跳过LLM.

**Type:** Learn
**Languages:** Python (stdlib, toy two-layer cache simulator)
**前置要求：**阶段17 · 04 (vLLM服务内部),阶段17 · 06 (SGLang RadixAttention)
**Time:** ~60 分钟

## 学习目标
- 区分 L2提示/前置缓存(提供者侧 KV 复用) 与 L1语义缓存(对相似提示 绕过LLM) 。
- 解释人类的`cache_control`显式标记,以及两个TTL选项 ((5分钟和1小时) 以及价格乘法──
- 根据击率、快速/响应混合和代币价格,计算预期月度节省。
- 通过"缩"的模式,并将导致"崩"的动态内容反模式.

## 问题
你给了自己的RAG服务加了快速缓存.账单没有变化. 你测量了击率.只有7%. 你的提示看起来静态,但实际上不是系统提示.

另外,你的代理会为每个用户问题进行运行,10 个工具调用.

缓存是协议,不是一个旗.

## 概念
### L2 提供商提示/预设缓存

提供商存储可缓存的预写的注意 KV,并下一个匹配该预写的请求 上复用它──你只支付一次写费,阅读 几乎免费──

**Anthropic (Claude 3.5 / 3.7 / 4 series)**要求 中的显式`cache_control`标记者──你标记哪些块可缓存──TTL:5分钟(写费为1.25x基础) 或1小时(写费为2x基础)──缓存读:Claude 3.5 Sonnet 上为$0.30/M，而 fresh 为 $截至2026-04) ・不同型号的价格 不同(Opus/Haiku 分别发布);始终交叉核对现场定价页面──

**OpenAI**对于 ≥1024个代币的提示自动缓存(platform.openai.com,2026-04)。没有显式旗──在当前的gpt-4o/gpt-5率卡上,缓存输入 约比新鲜便宜 10x──doc 和发布说明都没有发布官方的关键率基线;社区报告在精心设计提示后大多集中在 3060%──监控`usage.cached_tokens`为了测量自己的情况.

**Google (Gemini)**通过显式API做语境缓存;1M-代币语境意味着缓存的收益更大.

**Self-hosted (vLLM, SGLang)**介绍 雷迪克斯注意力 在自己的计算上采用相同模式.

### L1 应用程序 级语义缓存

在调用LLM之前,先哈希提示、对其做嵌入,并查找相似的缓存请求(同胞性高于门,通常为0.95+) ⋅命中时,返回缓存响应──未命中时,调用LLM 并缓存结果──

开源:Redis 矢量相似性、GPTCache、Qdrant──商业:Portkey Cache、直升机 Cache──

供应商的准确性要求指的是返回缓存响应在语义上合适的频率,而不是命中频率――生产击中率:

- 开放式聊天:105%
- 结构性常见问题/支持:40-70%──
- 编码问题:20-30%
- 语音代理重复提示:50-80%

### 平式化反模式

你的代理并发行10个工具调用. 所有10个都具有相同的4K代码系统提示.

修复:批次序列-第一  单独发起请求 1,然后在 1 的缓存 已填充 后再触发 2-10──给第一个工具调用 增加 300 ms;节省 5-10x 账单──

### 动态内容反模式

你的系统提示看起来像:

```
You are a helpful assistant. The current time is 14:32:17.
User ID: abc123. Today is Tuesday...
```

每个请求都是唯一的. 每个请求都会写入.

修复:把所有真正静态的内容移动到可缓存的前置;把动态内容 添加到缓存边界 之后:

```
[cacheable]
You are a helpful assistant. [rules, examples, instructions]
[/cacheable]
[dynamic, not cached]
Current time: 14:32:17. User: abc123.
```

通过这种方式,Cache 击率从7%升至74%并发布了该解剖学.

### 堆批量+夜间工作负载的缓存

按24小时回转下提供50%折扣. 存储输入 叠加后又能获得约10倍.

### 你应该记住的数字

价格点是从链接供应商文件中收集的2026-04数据,并且每几个月会变化.

- 据报道,这次的"大陆"的新增增量是3%.
- 人类缓存写入溢价:1.25x(5分钟TL) 或2x(1小时TL)
- 开放AI自动缓存:适用于1024个代币的提示;在当前的利率卡上,缓存输入 定价约为新输入的10% ((platform.openai.com) 。
- 语义缓存击中率(社区报告):开放聊天 约 ~ 10%;结构化查询最高约 ~ 70%──不是供应商记录的基线──
- 通过将动态移出前, 击败率从7% → 74%
- 典型报告显示,当 N 个平行请求 错过第一次缓存写时,账单会膨胀 510x。


```figure
semantic-cache-hit
```

## 使用它
`code/main.py`模拟混合工作负载 上的L1 + L2缓存――报告撞击率、账单,并显示并行处罚――

## 交付它
本课产出发 `outputs/skill-cache-auditor.md`△ 给定即时模板和流量,它会审计缓存性并推重组.

## 练习
1. 运行`code/main.py`切换并行标志 账单变化多少?
2. 你的系统提示 有日期――把它移出去――显示前/后的击率数学――
3. 在给定请求到达率的情况下,计算1小时的TTL (写2x) 与5分钟的TTL (写1.25x) 的差距.
4. 在0.95下命中20%──在0.85下命中50%──但你看到错误的缓存答案──选择正确的门并说明理由──
5. 你对每个用户问题批量进行10个并行子查询. 重写为缓存友好,同时不增加端到端延迟.

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
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)官方`cache_control`语义与TLS──
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching)自动缓存行为与资格性――
- [TianPan — Semantic Caching for LLMs Production](https://tianpan.co/blog/2026-04-10-semantic-caching-llm-production)
- [ProjectDiscovery — Cut LLM Costs 59% With Prompt Caching](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching)
- [DigitalOcean / Anthropic — Prompt Caching](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)
