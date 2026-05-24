# Visual Autoregressive Modeling (VAR)：Next-Scale Prediction

> Diffusion 模型在时间上迭代采样（去噪步骤）。VAR 在尺度上迭代采样，即先预测一个 1x1 Token，再预测 2x2，然后 4x4，一直到最终分辨率，每个尺度都以之前的尺度为条件。2024 年的论文表明，VAR 在图像生成上符合 GPT 风格的 scaling laws，并且在相同计算预算下胜过 DiT。本课会构建其核心机制。

**Type:** Build
**Languages:** Python (with PyTorch)
**Prerequisites:** Phase 7 Lesson 03 (Multi-Head Attention), Phase 8 Lesson 06 (DDPM)
**Time:** ~90 minutes

## 问题

Autoregressive 生成之所以主导语言建模，是因为它能可预测地扩展：更多计算、更多参数、更低 perplexity、更好的输出。2024 年之前，图像生成主要有两类 AR 尝试：PixelRNN/PixelCNN（逐像素）和 DALL-E 1 / Parti / MuseGAN（在 VQ-VAE codes 上逐 Token）。

两者都受困于生成顺序问题。像素和 Token 排列在 2D 网格中，但 AR 模型必须用 1D raster order 访问它们。早期的角落像素不知道图像最终会变成什么。生成质量的扩展性差于文本上的 GPT，也从未在匹配计算量时达到 Diffusion 模型质量。

VAR 通过改变生成对象来解决生成顺序问题。VAR 不是在空间中逐个预测图像 Token，而是以不断提高的分辨率预测整张图像。步骤 1：预测一个 1x1 Token（整体图像“摘要”）。步骤 2：预测一个 2x2 Token 网格（更粗的特征）。步骤 3：预测一个 4x4 网格。步骤 K：预测最终的 (H/8)x(W/8) 网格。

每个尺度都会 Attention 到所有之前的尺度（在“尺度顺序”上 causal），并在自身尺度内并行。顺序问题消失了：尺度 k 的整张图像在一次 Transformer pass 中生成。

## 概念

### VQ-VAE Multi-Scale Tokenizer

VAR 需要一个 **multi-scale discrete Tokenizer**。对于图像 x，它会生成一系列分辨率逐渐提高的 Token 网格：

```
x -> encoder -> latent f
f -> tokenize at 1x1: token grid z_1 of shape (1, 1)
f -> tokenize at 2x2: token grid z_2 of shape (2, 2)
...
f -> tokenize at (H/p)x(W/p): token grid z_K of shape (H/p, W/p)
```

每个 z_k 使用相同的 codebook（典型大小为 4096-16384）。每个尺度上的 Tokenization 不是相互独立的，而是被训练为让各尺度 residual 的求和能够重建 f：

```
f ≈ upsample(embed(z_1), target_size) + ... + upsample(embed(z_K), target_size)
```

这是一个 **residual VQ** 变体。尺度 k 捕获尺度 1..k-1 遗漏的内容。Decoder 接收所有尺度 Embedding 的和，并生成图像。

multi-scale VQ Tokenizer 只训练一次（类似 VQGAN），然后冻结。所有生成工作都由其上的 Autoregressive 模型完成。

### Next-Scale Prediction

生成模型是一个 Transformer，它看到所有之前尺度的 Token，并预测下一个尺度的 Token。

Input sequence structure:
```
[START, z_1 tokens, z_2 tokens, z_3 tokens, ..., z_K tokens]
```

Position Embedding 同时编码尺度索引和尺度内的空间位置。Attention 在尺度顺序上是 causal 的：尺度 k、位置 (i, j) 的 Token 可以 Attention 到尺度 1..k 的所有 Token，也可以 Attention 到尺度 k 本身在所用 intra-scale 顺序中更早出现的 Token（VAR 使用固定 positional attention，没有 intra-scale causality，即一个尺度内所有位置并行预测）。

训练 Loss：在每个尺度 k，给定所有之前尺度的 Token，预测 Token z_k。对离散 VQ codes 使用 cross-entropy Loss。结构与 GPT 相同，只是这里的“sequence”变成了尺度结构化的 sequence。

### 生成

推理时：
```
generate z_1 = sample from p(z_1)                    # 1 token
generate z_2 = sample from p(z_2 | z_1)              # 4 tokens in parallel
generate z_3 = sample from p(z_3 | z_1, z_2)         # 16 tokens in parallel
...
decode: f = sum of embed-and-upsample scales 1..K
image = VAE_decoder(f)
```

当 K = 10 个尺度时，生成需要 10 次 Transformer forward pass。每次 pass 都并行生成整个尺度，而不是在尺度内逐 Token 自回归。对于 256x256 图像，这大约是 10 次 pass，而 DiT 是 28-50 次。

### 为什么 Next-Scale 胜过 Next-Token

三个结构性优势：
1. **从粗到细符合自然图像统计规律。** 人类视觉感知和图像数据集都呈现尺度相关的规律：低频结构稳定且可预测；高频细节以低频内容为条件。Next-scale prediction 利用了这一点。
2. **尺度内并行生成。** 不同于 GPT 风格的 Token AR，VAR 一步生成某个尺度的所有 Token。有效生成长度是对数尺度，而不是线性尺度。
3. **没有生成顺序偏置。** 尺度 k 的 Token 能看到整个尺度 k-1；不存在“左侧”或“上方”的偏置，不会迫使早期 Token 在晚期上下文可用之前就做出承诺。

### Scaling Law

Tian et al. 证明 VAR 在 ImageNet 上的 FID 遵循 power-law scaling curve，正如 GPT 的 perplexity 一样。参数或计算量翻倍，会可靠地让 error 减半。这是第一个像语言模型一样清晰表现出这种 scaling behavior 的图像生成模型。结果是 VAR-scale 预测可以由计算量预测，而不是依赖每个架构的经验猜测。

### 与 Diffusion 的关系

VAR 和 Diffusion 共享同一个数据压缩叙事：两者都把生成问题拆成一系列更容易的子问题。

- Diffusion：逐渐加入噪声，学习撤销一步。
- VAR：逐渐增加分辨率，学习预测下一个尺度。

它们是穿过同一问题的不同轴线。两者都会产生可处理的条件分布。经验上，VAR 推理更快（pass 更少，尺度内全并行），并且在 class-conditional ImageNet 上匹配或胜过 DiT。Text-conditional VAR（VARclip、HART）是一个活跃研究方向。

## 构建它

在 `code/main.py` 中，你将：
1. 在合成“image”数据（2D Gaussian rings）上构建一个小型 **multi-scale VQ Tokenizer**。
2. 训练一个 **VAR-style Transformer** 来 next-scale-predict Token。
3. 通过调用 Transformer 4 次（4 个尺度）并解码来采样。
4. 验证按尺度顺序训练会让生成在尺度内并行。

这是一个 toy implementation。重点是看到尺度结构化 Attention mask 和尺度内并行生成确实在工作。

## 交付它

本课会生成 `outputs/skill-var-tokenizer-designer.md`，这是一个用于设计 multi-scale Tokenizer 的 skill：尺度数量、尺度比例、codebook size、residual sharing、decoder architecture。

## 练习

1. **尺度数量消融。** 用 4、6、8、10 个尺度训练 VAR。衡量重建质量与 Autoregressive pass 数量的关系。更多尺度 = 更细 residual = 更好质量，但 pass 更多。

2. **Codebook size。** 训练 codebook size 为 512、4096、16384 的 Tokenizer。更大的 codebook 带来更好的重建，但预测更难。找到拐点。

3. **尺度内并行检查。** 对训练好的 VAR，显式测量 Attention pattern。在尺度 k 内，模型是否 Attention 到 cross-scale 位置但不 Attention 到 intra-scale？验证 mask 实现。

4. **VAR vs DiT scaling。** 对同一个 ImageNet class-conditional 任务，在匹配参数预算下训练 VAR 和 DiT（例如 33M、130M、458M）。绘制 FID vs compute。VAR 应该在每个尺寸上领先 DiT，在小规模上复现论文结果。

5. **Text conditioning。** 扩展 VAR，让它通过 adaLN 接收 text Embedding（CLIP pooled）作为额外 conditioning input。这是 HART 配方。它能让 text-aligned sampling 上的 FID 改善多少？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| VAR | "Visual AutoRegressive" | 通过在 VQ Token 网格金字塔上进行 next-scale prediction 来生成图像 |
| Next-scale prediction | "Predict coarser, then finer" | 模型以不断增加的分辨率尺度预测 Token，并以所有之前尺度为条件 |
| Multi-scale VQ tokenizer | "Residual VQ" | 生成 K 个分辨率递增 Token 网格的 VQ-VAE，decoder 会对所有尺度求和 |
| Scale k | "Pyramid level k" | K 个分辨率层级之一，从 k=1 的 1x1 到 k=K 的 (H/p)x(W/p) |
| Parallel-within-scale | "One forward per scale" | 尺度 k 的所有 Token 在一次 Transformer pass 中预测，而不是自回归预测 |
| Causal-across-scales | "Scale-ordered attention" | 尺度 k 的 Token 可以 Attention 到尺度 1..k 的全部内容，但不能 Attention 到尺度 k+1..K |
| Residual VQ | "Additive tokenization" | 每个尺度的 Token 编码较低尺度留下的 residual；decoder 对所有尺度 Embedding 求和 |
| VAR scaling law | "Image GPT scaling" | FID 随 compute 遵循可预测的 power law，类似语言模型的 perplexity |
| HART | "Hybrid VAR + text" | Text-conditional VAR 变体，将 MaskGIT-style iterative decoding 与 VAR 的尺度结构结合 |
| Scale position embedding | "(scale, row, col) triple" | Positional encoding 同时携带尺度索引和尺度内空间坐标 |

## 延伸阅读
- [Tian et al., 2024 — "Visual Autoregressive Modeling: Scalable Image Generation via Next-Scale Prediction"](https://arxiv.org/abs/2404.02905) — VAR 论文，标准参考
- [Peebles and Xie, 2022 — "Scalable Diffusion Models with Transformers"](https://arxiv.org/abs/2212.09748) — DiT，Diffusion 对比 baseline
- [Esser et al., 2021 — "Taming Transformers for High-Resolution Image Synthesis"](https://arxiv.org/abs/2012.09841) — VQGAN，VAR 的 multi-scale Tokenizer 所扩展的 Tokenizer 家族
- [van den Oord et al., 2017 — "Neural Discrete Representation Learning"](https://arxiv.org/abs/1711.00937) — VQ-VAE，离散图像 Tokenization 的基础
- [Tang et al., 2024 — "HART: Efficient Visual Generation with Hybrid Autoregressive Transformer"](https://arxiv.org/abs/2410.10812) — text-conditional VAR
