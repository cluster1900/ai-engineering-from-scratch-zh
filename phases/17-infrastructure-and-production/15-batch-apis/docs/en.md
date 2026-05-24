# Batch APIs — 50% 折扣成为行业标准

> 每个主要 provider 都提供 async batch API，带有 50% 折扣和约 24 小时 turnaround。OpenAI、Anthropic、Google，以及大多数 inference platforms（Fireworks batch tier、Together batch）都实现了同样的模式。把 batch 和 prompt caching 叠加，overnight pipelines 的成本会降到同步未缓存成本的约 10%。规则极其简单：如果它不是交互式的，就应该放到 batch。内容生成 pipelines、document Classification、数据提取、报告生成、批量 labeling、catalog tagging——任何能容忍 24 小时延迟的工作，在迁移到 batch 之前都是把钱留在桌上。2026 年的生产模式是把每个新的 LLM workload 分流到三条 lane：interactive（同步并带 caching）、semi-interactive（async queue 并带 fallback）、batch（overnight，叠加 cached input）。那些假装是 interactive、但其实能容忍数分钟延迟的 workloads 浪费最多。

**Type:** Learn
**Languages:** Python (stdlib, toy batch-vs-sync cost simulator)
**前置要求：** Phase 17 · 14 (Prompt & Semantic Caching)
**Time:** ~45 minutes

## 学习目标
- 说出三个 provider batch APIs（OpenAI、Anthropic、Google）以及共同的 50% 折扣 + 24h turnaround 保证。
- 计算 overnight Classification workload 中叠加 batch + cached-input 的成本，并与 synchronous-uncached baseline 对比。
- 将一个 workload 分流到 interactive / semi-interactive / batch，并说明 lane 的理由。
- 说出两个陷阱：partial interactivity（用户期待比 24h 更快）和 output-schema drift（batch file format 因 provider 而异）。

## 问题
你的团队发布了一个 nightly report generation pipeline。50,000 个 documents，逐个 summarize，cluster summaries，再起草 executive brief。同步运行需要 4 小时，成本是 $2,000/night。你听说了 batch APIs。

batch 能给你 50% 折扣。你还在 system prompt（所有 50k calls 共享）上启用了 prompt caching。叠加后，账单降到 $180/night——约为 baseline 的 9%。同一个 pipeline，只改了三个 config。

Batch 是 LLM 成本工具箱里最便宜、却很少有人使用的杠杆。原因主要是组织层面的：团队以为是 “real-time”，但 SLA 实际上是 “by morning”。本课讲的是不要把 90% 的账单留在桌上。

## 概念
### 三个 batch APIs

**OpenAI Batch API**：上传包含请求列表的 JSONL file。承诺 24 小时 turnaround（实践中通常约 2-8 小时）。input 和 output tokens 均有 50% 折扣。`/v1/batches` endpoint。符合 cache 条件的 inputs 还可以在此基础上获得 cached-input pricing。

**Anthropic Message Batches**：JSONL upload。24 小时 turnaround。50% 折扣。支持 `cache_control`——cache writes 是显式的，reads 会在 batch 内自动发生。

**Google Vertex AI Batch Prediction**：BigQuery 或 GCS input。Gemini 有类似的 50% 折扣。与 Vertex pipelines 集成。

### Semantic：asynchronous，不是 slow

Batch 是“我承诺在 24 小时内返回”——不是“这会花 24 小时”。典型 P50 是 2-6 小时。Provider 会在 GPU 库存利用不足的非高峰窗口调度你的 batch。

### 与 caching 叠加

一个 50k-document summarization，使用相同的 4K-token system prompt：

- Synchronous uncached：50000 × ($input × 4000 + $output × 200)，按 full rates。
- Synchronous cached：system prompt 在首次 write 后被缓存；剩余 49999 次获得便宜 10x 的 input。
- Batch cached：以上全部，再加上 read 和 write 两者的 50% 折扣。

叠加效果：batch + cache = 约为 sync uncached bill 的 10%。任何 overnight 运行且拥有 shared system prompt 的 workload 都应该使用它。

### Workload triage

**Interactive** — 用户等待响应。TTFT 很重要。使用带 prompt caching 的 synchronous call。不能 batch。

**Semi-interactive** — 用户提交任务，数分钟后回来查看。Async queue，并在 batch 不可用时 fallback 到 sync。可以想到中等规模的 RAG indexing。

**Batch** — 用户期待结果 “by morning” 或 “next hour”。Content pipelines、大规模 Classification、offline analysis。始终 batch，始终叠加 caching。

常见错误：因为 pipeline 是 production，就把所有东西都归类为 interactive。Production 不是 latency spec——SLA 才是。

### partial-interactivity 陷阱

有些功能看起来是 interactive，但能容忍 5-10 分钟。例如：带有 “refresh” 按钮的 nightly customer health report。用户点击 refresh；等待 10 分钟是可以接受的。团队却把它做成 synchronous。50 个并发 refresh 的成本，是 batched-and-delivered-via-email 的 10x。

要问的问题是：“24-hour 对这个用户意味着什么？”如果答案是“他们不会注意到”，就 batch 它。

### output-schema 陷阱

Batch file formats 因 provider 而异：

- OpenAI：JSONL，每行一个 request。
- Anthropic：JSONL，每行一个 message；response format 内嵌。
- Vertex：BigQuery table 或带 TFRecord 的 GCS prefix。

跨 provider 编写 “one batch client” 意味着每个 provider 都需要 adapter code。宣传 multi-provider batch 的 gateways（Portkey、LiteLLM 的某些 tiers）仍然只是对 raw format 做 thin-wrap。

### 你应该记住的数字

- 跨 provider 的 batch discount：input + output 统一 50%。
- Turnaround SLA：保证 24 小时，典型 P50 为 2-6 小时。
- 叠加 batch + cached input：约为 sync uncached cost 的 10%。
- Workload triage 规则：如果 24h latency 可接受，始终 batch。

## 使用它
`code/main.py` 为一个 50k-document workload 计算 sync、sync+cache、batch、batch+cache 的成本。报告以 $ 和百分比表示的 savings。

## 交付它
本课会产出 `outputs/skill-batch-triager.md`。给定 workload characteristics，分流到 interactive/semi/batch，并估算 savings。

## 练习
1. 运行 `code/main.py`。对于一个 100k-doc pipeline，使用 3K-token system prompt 和 500-token output，计算 full stack（batch + cache）相对于 sync baseline 的 savings。
2. 选择一个你熟悉的真实产品中的三个 features。将每个 feature 分流到 interactive/semi/batch。
3. 用户抱怨他们的报告花了 3 小时。这是 batch mis-triage，还是合法的 interactive？写出 decision criterion。
4. 你的 batch API return SLA 是 24h，但 P99 是 20 小时。你如何向用户沟通这一点——在 edge case 上 downstream system behavior 是什么？
5. 计算 break-even：shared-prefix length 达到多少时，batch + cache 会比在你自己的 reserved GPU 上 overnight 运行更便宜？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Batch API | “async discount” | 50% off，24h turnaround |
| JSONL | “batch format” | 每行一个 JSON request；OpenAI/Anthropic standard |
| Message Batches | “Anthropic batch” | Anthropic 的 batch API product name |
| Batch prediction | “Vertex batch” | Vertex AI 的 batch API product |
| Turnaround SLA | “24h promise” | 保证，不是典型值；典型是 2-6h |
| Workload triage | “interactivity decision” | Interactive / semi / batch routing decision |
| Output schema | “response format” | 每个 provider 的 JSONL layout；不可移植 |
| Stacked discount | “batch + cache” | 两者都适用时，约为 uncached sync bill 的 10% |

## 延伸阅读
- [OpenAI Batch API](https://platform.openai.com/docs/guides/batch) — JSONL format 和 `/v1/batches` semantics。
- [Anthropic Message Batches](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing) — batch format 和 `cache_control` interaction。
- [Vertex AI Batch Prediction](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/batch-prediction) — Gemini batch 语义。
- [Finout — OpenAI vs Anthropic API Pricing 2026](https://www.finout.io/blog/openai-vs-anthropic-api-pricing-comparison)
- [Zen Van Riel — LLM API Cost Comparison 2026](https://zenvanriel.com/ai-engineer-blog/llm-api-cost-comparison-2026/)
