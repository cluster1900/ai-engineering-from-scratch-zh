# Batch API — 50% 折扣成为行业标准

> 每家主要供应商都提供异步 Batch API，折扣为 50%，周转时间约为 24 小时。OpenAI、Anthropic、Google 以及大多数 Inference 平台（Fireworks Batch tier、Together Batch）都实现了相同模式。将 Batch 与 Prompt Caching 叠加后，隔夜 Pipeline 的成本可以降至同步、无缓存成本的约 10%。规则极其简单：只要不需要交互，就应该使用 Batch。内容生成 Pipeline、文档 Classification、数据提取、报告生成、批量 Labeling、目录标记，只要能够容忍 24 小时延迟，在迁移到 Batch 之前就是在浪费成本。2026 年的生产模式是将每个新的 LLM 工作负载分流到三个通道：交互式（同步并使用缓存）、半交互式（异步队列并提供 fallback）、Batch（隔夜运行并叠加缓存输入）。那些假装需要交互、实际却能容忍数分钟延迟的工作负载浪费最为严重。

**Type:** Learn
**Languages:** Python（stdlib，简化的 Batch 与同步成本模拟器）
**Prerequisites:** Phase 17 · 14（Prompt Caching 与 Semantic Caching）
**Time:** ~45 分钟

## Learning Objectives

- 说出三种供应商 Batch API（OpenAI、Anthropic、Google），以及它们共同提供的 50% 折扣和 24 小时周转保证。
- 计算在隔夜 Classification 工作负载中叠加 Batch + 缓存输入的成本，并与同步、无缓存基准进行比较。
- 将工作负载分流为交互式 / 半交互式 / Batch，并说明选择该通道的理由。
- 说明两个陷阱：部分交互性（用户期望速度快于 24 小时）和输出 schema 漂移（不同供应商的 Batch 文件格式不同）。

## 问题

你的团队发布了一条夜间报告生成 Pipeline。它需要处理 50,000 份文档，逐份生成摘要，对摘要进行聚类，并起草一份高管简报。同步运行需要 4 小时，每晚成本为 $2,000。随后你听说了 Batch API。

Batch 可以提供 50% 折扣。你还为系统 Prompt 启用了 Prompt Caching（所有 50k 次调用共享该 Prompt）。叠加后，账单降至每晚 $180，约为基准的 9%。同一条 Pipeline，只改变了三个配置。

Batch 是 LLM 成本工具箱中最便宜、却无人使用的手段。其主要原因在于组织认知：团队认为需求是“实时”，而 SLA 实际上只是“早上之前完成”。本课的重点是避免白白浪费 90% 的预算。

## 概念

### 三种 Batch API

**OpenAI Batch API**：上传包含请求列表的 JSONL 文件。承诺在 24 小时内完成（实践中通常约为 2-8 小时）。输入和输出 Token 均享受 50% 折扣。endpoint 为 `/v1/batches`。符合缓存条件的输入还可以在此基础上享受缓存输入定价。

**Anthropic Message Batches**：上传 JSONL。周转时间为 24 小时。折扣为 50%。支持 `cache_control`，缓存写入需要显式声明，Batch 内的读取会自动发生。

**Google Vertex AI Batch Prediction**：输入来自 BigQuery 或 GCS。Gemini 提供类似的 50% 折扣。可与 Vertex Pipeline 集成。

### 语义：异步，不代表缓慢

Batch 的含义是“我承诺在 24 小时内返回”，而不是“这项任务需要 24 小时”。典型 P50 为 2-6 小时。供应商会在 GPU 库存利用率较低的非高峰时段调度你的 Batch。

### 与缓存叠加

对 50k 份文档执行摘要，且所有请求使用相同的 4K Token 系统 Prompt：

- 同步且无缓存：按全价计算 50000 ×（$input × 4000 + $output × 200）。
- 同步且有缓存：系统 Prompt 在首次写入后被缓存；其余 49999 个请求的输入价格降低 10 倍。
- Batch 且有缓存：获得上述全部收益，并对读取和写入额外应用 50% 折扣。

叠加效果：Batch + 缓存 = 同步、无缓存账单的约 10%。所有隔夜运行且共享系统 Prompt 的工作负载都应该使用这种方式。

### 工作负载分流

**交互式** — 用户需要等待响应。TTFT 很重要。使用带 Prompt Caching 的同步调用。不能使用 Batch。

**半交互式** — 用户提交任务，几分钟后回来查看。使用异步队列，并在 Batch 不可用时 fallback 到同步。中等规模的 RAG indexing 就属于这种情况。

**Batch** — 用户期望“早上之前”或“下一个小时”拿到结果。适用于内容 Pipeline、大规模 Classification、离线分析。始终使用 Batch，并始终叠加缓存。

常见错误：因为 Pipeline 用于生产环境，就将一切归类为交互式。生产环境不是延迟规范，SLA 才是。

### 部分交互性陷阱

有些 Feature 看似交互式，但其实可以容忍 5-10 分钟。例如，一份带“刷新”按钮的夜间客户健康报告。用户点击刷新后，等待 10 分钟完全可以接受，团队却将其实现为同步操作。50 个并发刷新请求的成本，是分 Batch 处理并通过电子邮件交付的 10 倍。

应该提出的问题是：“24 小时对这个用户意味着什么？”如果答案是“他们根本不会注意到”，就应使用 Batch。

### 输出 schema 陷阱

不同供应商的 Batch 文件格式不同：

- OpenAI：JSONL，每行一个请求。
- Anthropic：JSONL，每行一条 message；响应格式Embedding其中。
- Vertex：BigQuery 表，或包含 TFRecord 的 GCS 前缀。

要跨供应商编写“统一 Batch client”，意味着需要为每家供应商编写 adapter 代码。即使 gateway 宣称支持多供应商 Batch（Portkey、LiteLLM 的某些 tier），也仍然只是对原始格式的轻量封装。

### 你应该记住的数字

- 各供应商的 Batch 折扣：输入 + 输出统一享受 50% 折扣。
- 周转 SLA：保证在 24 小时内完成，典型 P50 为 2-6 小时。
- 叠加 Batch + 缓存输入：成本约为同步、无缓存成本的 10%。
- 工作负载分流规则：如果可以接受 24 小时延迟，就始终使用 Batch。

```figure
batch-lane-triage
```

## 使用它

`code/main.py` 会针对一个包含 50k 份文档的工作负载，计算同步、同步+缓存、Batch 和 Batch+缓存四种方式的成本，并以金额和百分比报告节省情况。

## 交付它

本课将生成 `outputs/skill-batch-triager.md`。给定工作负载特征后，它会将其分流为交互式/半交互式/Batch，并估算节省金额。

## 练习

1. 运行 `code/main.py`。对于包含 100k 份文档、使用 3K Token 系统 Prompt 和 500 Token 输出的 Pipeline，计算完整组合（Batch + 缓存）相对于同步基准的节省金额。
2. 从你了解的真实产品中选择三个 Feature。将每个 Feature 分流为交互式/半交互式/Batch。
3. 用户抱怨报告花了 3 小时。这是 Batch 分流错误，还是合理的交互需求？写出决策标准。
4. 你的 Batch API 返回 SLA 为 24 小时，但 P99 为 20 小时。你应如何向用户传达这一点？在边界情况下，下游系统应采取什么行为？
5. 计算盈亏平衡点：共享前缀达到多长时，Batch + 缓存会比在自有预留 GPU 上隔夜运行更便宜？

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Batch API | “异步折扣” | 以 24 小时周转时间换取 50% 折扣 |
| JSONL | “Batch 格式” | 每行一个 JSON 请求；OpenAI/Anthropic 标准 |
| Message Batches | “Anthropic Batch” | Anthropic 的 Batch API 产品名称 |
| Batch prediction | “Vertex Batch” | Vertex AI 的 Batch API 产品 |
| Turnaround SLA | “24 小时承诺” | 这是保证时间而非典型时间；典型时间为 2-6 小时 |
| Workload triage | “交互性决策” | 交互式 / 半交互式 / Batch 路由决策 |
| Output schema | “响应格式” | 各供应商自己的 JSONL 布局；不可直接移植 |
| Stacked discount | “Batch + 缓存” | 两者同时应用时，成本约为无缓存同步账单的 10% |

## 延伸阅读

- [OpenAI Batch API](https://platform.openai.com/docs/guides/batch) — JSONL 格式和 `/v1/batches` 语义。
- [Anthropic Message Batches](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing) — Batch 格式及其与 `cache_control` 的交互。
- [Vertex AI Batch Prediction](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/batch-prediction-gemini) — Gemini Batch 语义。
- [Finout — OpenAI 与 Anthropic API 定价对比 2026](https://www.finout.io/blog/openai-vs-anthropic-api-pricing-comparison)
- [Zen Van Riel — LLM API 成本对比 2026](https://zenvanriel.com/ai-engineer-blog/llm-api-cost-comparison-2026/)
