# Emu3：用于图像和视频生成的 Next-Token Prediction

> BAAI 的 Emu3（Wang et al.，2024 年 9 月）是 2024 年本应终结 Diffusion 与 autoregressive 之争的结果。一个单一的 Llama-style decoder-only Transformer，只在 next-token-prediction 目标上训练，覆盖 text + VQ image tokens + 3D VQ video tokens 的统一 vocabulary，在图像生成上击败 SDXL，在感知上击败 LLaVA-1.6。没有 CLIP loss。没有 Diffusion schedule。Classifier-free guidance 在推理时用于提升质量，但核心训练目标是带 teacher forcing 的 next-token prediction。发表于 Nature。本课阅读 Emu3 的论点，即为什么一个更好的 Tokenizer 加上规模就是你所需要的一切，并将其与 Diffusion 方法进行对比。

**Type:** Learn
**语言：** Python（stdlib，3D video tokenizer math + autoregressive sampler skeleton）
**Prerequisites:** Phase 12 · 11（Chameleon）
**Time:** ~120 分钟

## 学习目标
- 解释为什么 Emu3 的 single-loss next-token 目标能够奏效，尽管长期以来人们一直假设图像质量需要 Diffusion。
- 描述 3D video tokenizer：spatiotemporal VQ codebook 是什么样子，为什么 patch 会跨越时间。
- 比较 Emu3 与 Stable Diffusion XL 在训练 compute、推理成本和质量上限上的差异。
- 说出同一个 Emu3 model 扮演的三个角色：Emu3-Gen（image gen）、Emu3-Chat（perception）、Emu3-Stage2（video gen）。

## 问题
截至 2024 年的传统观点是：图像生成需要 Diffusion。其论点是：discrete image tokens 会丢失太多信息，无法重建细节，而 autoregressive sampling 会在数千个 tokens 上累积误差。Stable Diffusion、DALL-E 3、Imagen、Midjourney 都使用某种形式的 Diffusion。Chameleon（Lesson 12.11）在小规模上部分反驳了这一点，但质量上没有追平 SDXL。

Emu3 正面挑战了这个论点。它的主张是：更好的 visual Tokenizer + 足够的规模 + next-token loss = 在同一个也能做感知的模型中，实现击败 Diffusion 的图像生成。

它发表时这个赌注很有争议。两年后，开源 unified-generation family（Emu3、Show-o、Janus-Pro、Transfusion）已成为研究默认路径；生产级 frontier models 似乎也使用了某种变体。

## 概念
### The Emu3 tokenizer

关键成分是 visual Tokenizer。Emu3 训练了一个 custom IBQ-class Tokenizer（Inverse Bottleneck Quantizer，SBER-MoVQGAN family），每个 Token 做 8x8 resolution-reduction。一张 512x512 图像会变成 64x64 = 4096 tokens，codebook size 为 32768。

这比 Chameleon 在 K=8192 时每张 512x512 的 1024 tokens 更大，但每个 Token 更便宜（更小的 codebook lookups、更简单的 codec）。关键指标：重建 PSNR 为 30.5 dB，能与 Stable Diffusion 的 32 dB continuous latent space 竞争。

对于视频：3D VQ Tokenizer 将一个 spatiotemporal patch（4x4x4 pixels）编码为一个整数。一个 4s clip，8 FPS，有 32 frames；在 256x256、4x spatial 与 4x temporal reduction 下，Token 数量为 (256/4) * (256/4) * (32/4) = 64 * 64 * 8 = 32,768 tokens。

Tokenizer 质量就是上限。Emu3 的贡献部分在于“我们训练了一个非常好的 Tokenizer”。

### Single-loss training

Emu3 使用一个目标：在 text tokens、2D image tokens 和 3D video tokens 的 shared vocabulary 上做 next-token prediction。训练期间会按 modality-specific factors 乘以权重来平衡贡献，但 Loss Function 是相同的。

训练数据混合包括：
- Image gen：`<text caption> <image> image_tokens </image>`
- Image perception：`<image> image_tokens </image> <question> text_tokens`
- Video gen：`<text caption> <video> video_tokens </video>`
- Video perception：类似。
- Text only：标准 NTP。

模型会从数据分布中学习何时输出 image tokens、何时输出 text tokens。生成能力来自模型在 `<image>` 标签之后预测 image tokens。

### Classifier-free guidance 和 temperature

Autoregressive 图像生成在推理时使用 classifier-free guidance（CFG）会好很多。Emu3 使用了它：生成两次，一次使用完整 caption，一次使用空 caption，然后用 guidance weight 混合 logits（典型值 3.0-7.0）。这是 Diffusion 使用的同一个 CFG 技巧，借用到了 autoregressive 设置中。

Temperature 很重要：太高会产生伪影；太低会 mode collapse。Emu3 推荐的 temperature 是：感知用 1.0，图像生成用 0.8。

### Three roles, one model

Emu3 以三个功能上不同的 API 发布，但底层是一套 weights：

- Emu3-Gen。图像生成。输入 text，输出 image tokens。
- Emu3-Chat。VQA 和 captioning。输入图像（tokens），输出 text。
- Emu3-Stage2。视频生成和 video VQA。输入 text 或 video，输出 text 或 video。

没有 task-specific heads。只有不同 prompt templates。同一个 checkpoint。

### Benchmarks

来自 Emu3 paper（2024 年 9 月）：

- 图像生成：在 MJHQ-30K FID（5.4 vs 5.6）、GenEval overall（0.54 vs 0.55，统计上打平）和 Deep-Eval 的 composite 上达到相当水平或更好，超过 SDXL。
- 图像感知：在 VQAv2（75.1 vs 72.4）上超过 LLaVA-1.6，在 MMMU 上大致持平。
- 视频生成：4-second-clip 质量在 FVD 上与 Sora-era 公开 benchmarked models 具备竞争力。

这些数字并不总是获胜，Emu3 会在这里多一分、那里少一分，但“next-token prediction is all you need”这个主张在不同 modalities 上是站得住脚的。

### Compute cost

Emu3 使用 7B-parameter model，在约 300 billion Multimodal tokens 上训练。GPU-hours 大致相当于 Llama-2-7B pretraining（A100-class silicon 上 2k-4k GPU-years）。Stable Diffusion 3 这样的 Diffusion models 训练预算类似，但需要独立的 text encoders 和更复杂的 pipelines。

推理时，Emu3 每张图像比 SDXL 慢：4096 image tokens，以 30 tok/s 计算，大约每张 512x512 图像 2 分钟，而 SDXL 为 2-5 秒。Speculative decoding 和 KV-cache optimization 会缩小差距，但无法消除差距。Autoregressive image gen 计算量很大；这是目前的固定取舍。

### Why it matters

Emu3 的深层贡献是概念性的。如果 next-token prediction 能够扩展到在图像生成上匹配 Diffusion，那么 unified-model 路径（一个 Loss、一个 backbone、任意 modality）就是可行的。未来模型不需要独立的 text encoders、独立的 Diffusion schedulers、独立的 VAEs。一个 Transformer，每个 modality 一个 Tokenizer，然后扩大规模。

Show-o、Janus-Pro 和 InternVL-U 都建立在这个论点之上，或对其提出挑战。到 2025 年，中国实验室（BAAI、DeepSeek）在这个方向上的发表比美国实验室更积极。

## 使用它
`code/main.py` 构建两个 toy pieces：

- 一个 2D vs 3D VQ Tokenizer 数量计算器：给定（resolution、patch、clip_length、FPS），计算图像与视频的 Token 数。
- 一个带 classifier-free guidance 和 temperature 的 autoregressive image-token sampler。

CFG 实现与 Emu3 的配方一致，即用 guidance weight 混合 conditional 和 unconditional logits。

## 交付它
本课产出 `outputs/skill-token-gen-cost-analyzer.md`。给定一个生成产品规格（图像或视频、目标 resolution、quality tier、latency budget），它会计算 Token 数、推理成本，并在 Emu3-family 与 Diffusion 之间做选择。

## 练习
1. Emu3 在 8x8 reduction 下，每张 512x512 图像产生 4096 tokens。计算 1024x1024 和 2048x2048 的等价数量。推理延迟会发生什么？

2. 阅读 Emu3 Section 3.3 中关于 video tokenizer 的内容。描述 3D VQ patch shape，以及为什么它是 4x4x4 而不是 8x8x1。

3. Classifier-free guidance weight 5.0 vs 3.0：视觉效果有什么变化？追踪 `code/main.py` 中的数学过程。

4. 计算 Emu3-7B 在 300B tokens 下的训练 FLOPs，并与 Stable Diffusion 3 比较。哪个训练成本更高？

5. Emu3 在 FID 上超过 SDXL，但在 VQAv2 上不如 specialized VLMs。解释为什么 unified-loss 方法在不同 benchmarks 上相对于 specialists 会表现出不同优势。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Next-token prediction | "NTP" | 标准 autoregressive loss：给定 token[0..i] 预测 token[i+1]；tokenized 后适用于每种 modality |
| IBQ tokenizer | "Inverse bottleneck quantizer" | 一类 VQ-VAE，codebooks 更大（32768+），重建效果优于 Chameleon 的 Tokenizer |
| 3D VQ | "Spatiotemporal quantizer" | 由（time、row、col）索引的 codebook；一个 Token 覆盖一个 4x4x4 pixel cube |
| Classifier-free guidance | "CFG" | 用 weight gamma 混合 conditional 和 unconditional logits；在推理时提升图像质量 |
| Unified vocabulary | "Shared tokens" | Text + image + video 都来自同一个 integer space；模型预测接下来出现的任何 modality |
| MJHQ-30K | "Image gen benchmark" | 含 30k prompts 的 Midjourney-quality benchmark；Emu3 在这里报告 FID |

## 延伸阅读
- [Wang et al. — Emu3: Next-Token Prediction is All You Need (arXiv:2409.18869)](https://arxiv.org/abs/2409.18869)
- [Sun et al. — Emu: Generative Pretraining in Multimodality (arXiv:2307.05222)](https://arxiv.org/abs/2307.05222)
- [Liu et al. — LWM (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Yu et al. — MAGVIT-v2 (arXiv:2310.05737)](https://arxiv.org/abs/2310.05737)
- [Tian et al. — VAR (arXiv:2404.02905)](https://arxiv.org/abs/2404.02905)
