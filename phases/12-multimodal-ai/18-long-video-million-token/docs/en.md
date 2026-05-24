# Million-Token Context 下的长视频理解

> 一个 1 小时的 4K 视频，24 FPS，经过 patching 和 Embedding 后，会产生约 6000 万个 Token。一个转录后的 2 小时播客单集是 30,000 个 Token。一部长篇 Blu-ray 电影，即使使用激进的 pooling 压缩，也会有数十万 Token。Google 的 Gemini 1.5（2024 年 3 月）以 1000 万 Token context 开启了这个时代，能够在小时级视频上可靠地完成 needle-in-a-haystack 召回。LWM（Liu et al.，2024 年 2 月）展示了 ring attention 的扩展路径。LongVILA 和 Video-XL 进一步扩展了摄入能力。VideoAgent 用 agentic retrieval 替代原始 context。每种方法都在计算、召回和工程复杂度之间做了不同取舍。本课将把它们并排阅读。

**Type:** Build
**Languages:** Python (stdlib, needle-in-haystack simulator + agentic-retrieval router)
**Prerequisites:** Phase 12 · 17 (video temporal tokens)
**Time:** ~180 minutes

## 学习目标
- 计算不同 FPS 和 pooling 下长视频的总 visual-token 数量。
- 解释三条扩展路径：brute context（Gemini 1.5）、ring attention（LWM）、token compression（LongVILA / Video-XL）。
- 在准确率和延迟上比较 raw-context video VLMs 与 agentic-retrieval video VLMs（VideoAgent）。
- 为 30 分钟视频设计一个 needle-in-a-haystack 测试，并测量特定分钟处的召回率。

## 问题
Qwen2.5-VL 尺寸的 patch 在 384 原生分辨率下，单帧约为 729 个 Token。使用 3x3 pooling 后，每帧 81 个 Token。一个 30 分钟片段按 1 FPS 计算 = 1800 帧 = 145,800 个 Token。到 2025 年的开放 VLMs 可以做到，但很紧。按 2 FPS 计算，则是 291,600 个 Token，只有最大 context 的模型能装下。

一部 2 小时电影按 1 FPS 是 583k Token。超出多数 2026 年开放模型能力；需要 Gemini 2.5 Pro，或更激进地 pooling。

出现了三条扩展路径。

## 概念
### Path 1: brute context（Gemini 1.5, Claude Opus）

用硬件解决问题。把 context 扩展到数百万 Token，在一次 forward pass 中处理所有内容。

Gemini 1.5 Pro 发布时支持 1M Token；Gemini 1.5 Ultra 达到 10M；2026 年的 Gemini 2.5 Pro 能可靠处理数小时视频。论文（arXiv:2403.05530）记录了在最高约 9.5M Token 下，needle-in-a-haystack 召回率达到 99.7%。

工程上：一种带内存层级（local + global + sparse）的自定义 attention 实现，加上用于 long-context 效率的 MoE expert routing。完整细节未公开发表。不开源。

### 路径 2：Ring attention (LWM, LongVILA)

Ring attention 把长序列分布到多个设备上，形成一个“ring”，每个设备持有一个 chunk。对完整序列的 attention 通过 ring 模式完成：每个设备把自己的 chunk 发送给下一个设备，计算 partial attention，并进行聚合。

LWM（Liu et al., 2024）用这种方式训练了一个 1M-Token context 模型。训练计算量随 context 线性扩展，而不是平方扩展，因为 attention 的平方成本被分摊到了 ring 中的设备上。

LongVILA（arXiv:2408.10188）把该模式适配到 VLMs。1400 帧视频，每帧 192 个 Token = 268k context，并使用 8-way parallelism 的 ring attention 训练。

### 路径 3：Token 压缩 (Video-XL, LongVA)

比 brute context 更便宜：在 LLM 看到序列之前进行激进压缩。

Video-XL（arXiv:2409.14485）使用 visual summary token：每个包含 N 帧的 clip 产生一个单独的“summary”Token，该 Token 会 attend 到这 N 帧。在 inference 时，LLM 每个 clip 只看到一个 summary Token，从而大幅缩小 context。

LongVA 使用“long context transfer”技术，将 LLM context 从 200k 扩展到 2M。先在 long-context text 上训练，再通过共享表示迁移到 long-context video。

Token compression 用特定时间戳的召回能力换取可扩展性。模型通常知道发生了什么，但有时会漏掉精确帧。

### 路径 4：Agentic retrieval (VideoAgent)

不要把完整视频输入 LLM。相反，把视频视为数据库，并使用 LLM 来查询它。

VideoAgent（arXiv:2403.10517）：

1. LLM 读取问题。
2. LLM 请求 retrieval tool 提供相关 clips（“show me segments with a cat”）。
3. Tool 返回匹配的 clip timestamps。
4. LLM 通过 VLM 读取这些 clips。
5. LLM 组织答案，或提出后续查询。

这是应用到长视频上的 LLM-as-agent 模式。Inference 更便宜（只编码相关 clips），工程更难（retrieval 质量成为瓶颈）。

### Needle-in-a-haystack benchmark

标准 long-context 测试：在视频中的随机位置插入一个唯一的视觉或文本标记，然后提出一个需要回忆该标记的查询。

Metric：跨视频长度和标记位置的 Recall@k。

Gemini 2.5 Pro 在最长 90 分钟视频上得分 >99% 召回率。开放 72B 模型（Qwen2.5-VL-72B、InternVL3-78B）在 30 分钟处得分约 85-90%，超过 60 分钟后下降。

如果 tool 足够好，VideoAgent 在 2+ 小时场景下可以匹配或超过 raw-context 模型，因为 retrieval 能命中 needle。

### Which path to pick

对于 frontier accuracy 的 15 分钟 clip：开放 72B + 原生 context 通常可行。选择 Qwen2.5-VL-72B。

对于 30 分钟到 1 小时内容：开放模型选择 LongVILA 或 Video-XL；闭源选择 Gemini 2.5 Pro。质量门槛很重要，frontier 走闭源。

对于 2+ 小时内容：VideoAgent 或类似 retrieval 模式。或者，摘要成更小 chunks，并输入 hierarchical summaries。

### 2026 production pattern

实践中，生产级长视频 pipelines 是混合式的：

1. 对整个视频运行 dynamic-FPS sampling + aggressive pooling（得到 100k-Token 的全局表示）。
2. 传给 72B VLM 生成全局摘要。
3. 如果用户提出细节问题，使用该摘要作为 index 运行 agentic retrieval。

这结合了 brute-context 的全局理解和 retrieval 的局部细节能力。

## 使用它
`code/main.py`：

- 计算 1 分钟到 3 小时视频在不同 FPS + pooling 下的 Token 预算。
- 模拟一次 needle-in-a-haystack 运行：在随机 timestamp 注入 marker，提出问题，并评估召回。
- 包含一个 agentic-retrieval router simulator，用于选择要输入下游 VLM 的特定 clips。

运行预算表，感受尺度差距。

## 交付它
本课产出 `outputs/skill-long-video-strategy-planner.md`。给定视频时长和查询复杂度，它会在 brute-context、compression 和 agentic retrieval 之间选择，并计算延迟 + 质量预期。

## 练习
1. 一段 45 分钟讲座，1 FPS，每帧 81 个 Token。总 Token 数是多少？适合哪些模型的 context？

2. 设计一个 needle-in-a-haystack 测试：你会在第几分钟注入 marker，精确查询格式是什么？

3. 在 1 小时视频上比较 brute-context Qwen2.5-VL-72B（80k context）与 VideoAgent（Claude 3.5 + retrieval）。哪个在召回上胜出？哪个在延迟上胜出？

4. Ring attention 的内存成本随序列长度线性扩展，也随设备数量线性扩展。解释为什么，以及如果去掉 ring-rotation 阶段会失败在哪里。

5. 阅读 Gemini 1.5 第 5 节关于 needle-in-a-haystack 的内容。论文对 1M 与 10M Token 边界处的召回有什么发现？

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Brute context | “只是更多 Token” | 将 LLM context 扩展到数百万 Token；一次性处理所有内容 |
| Ring attention | “LWM-style parallel” | 分布式 attention 模式：每个设备持有一个 chunk 并轮转 |
| Token compression | “Summary tokens” | 在进入 LLM 前，通过 learned compressor 减少每个 clip 的 Token |
| Needle-in-haystack | “NIH test” | 在随机位置插入唯一 marker，在测试时要求模型回忆它 |
| Agentic retrieval | “LLM as query planner” | LLM 向 retrieval tool 请求相关 clips，通过 VLM 读取它们，并组织答案 |
| VideoAgent | “Retrieval pattern for video” | 规范的 agentic-retrieval 设计：question -> tool -> clip -> answer |

## 延伸阅读
- [Gemini Team — Gemini 1.5 (arXiv:2403.05530)](https://arxiv.org/abs/2403.05530)
- [Liu et al. — LWM / RingAttention (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Xue et al. — LongVILA (arXiv:2408.10188)](https://arxiv.org/abs/2408.10188)
- [Shu et al. — Video-XL (arXiv:2409.14485)](https://arxiv.org/abs/2409.14485)
- [Wang et al. — VideoAgent (arXiv:2403.10517)](https://arxiv.org/abs/2403.10517)
