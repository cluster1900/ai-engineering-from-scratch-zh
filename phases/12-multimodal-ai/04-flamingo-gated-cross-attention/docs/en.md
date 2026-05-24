# Flamingo 与用于 Few-Shot VLMs 的 Gated Cross-Attention

> DeepMind 的 Flamingo（2022）比其他人更早完成了两件事。它证明单个模型可以处理图像、video 和文本任意交错的序列。它还证明 VLMs 可以进行 in-context 学习 — 给出包含三个（图像，caption）示例对的 few-shot prompt，模型就能在没有任何 Gradient step 的情况下为新图像生成 caption。机制是：gated cross-attention layers，插入到冻结 LLM 的现有 layers 之间，并带有一个 learned tanh gate，该 gate 从零开始，因此 LLM 的文本能力在初始化时得以保留。本课讲解 Flamingo 的 Perceiver resampler 和 gated cross-attention architecture — 它是 Gemini 交错输入和 Idefics2 visual tokens 的先祖。

**Type:** Learn
**Languages:** Python (stdlib, gated cross-attention + Perceiver resampler demo)
**Prerequisites:** Phase 12 · 03 (BLIP-2 Q-Former)
**Time:** ~120 minutes

## 学习目标
- 解释 gated cross-attention 如何通过 tanh(gate) = 0 在初始化时保留冻结 LLM 的文本能力。
- 逐步讲解 Perceiver resampler：N 个 image patches → K 个固定“latent”queries，经 cross-attention 完成。
- 描述 Flamingo 如何用尊重图像位置的 causal masking 处理交错的 image-text sequences。
- 复现 few-shot Multimodal prompt 结构（3 个 image-caption 示例，然后是一个 query image）。

## 问题
BLIP-2 将 32 个 visual tokens 输入冻结 LLM 的 input layer。每个 prompt 一张图像时可以工作。但如果你想输入*多张*与文本交错的图像，例如“这里是 image A，为它生成 caption；这里是 image B，为它生成 caption；现在这里是 image C，为它生成 caption”呢？LLM 的 Self-Attention 需要在单一 stream 中处理 image tokens 和 text tokens，而且哪些位置可以 attend 到哪些图像这个问题会变得繁琐。

Flamingo 的答案是：完全不要改变 LLM 的输入 stream。在现有 LLM blocks 之间插入额外的 cross-attention layers。Text tokens 仍然像往常一样流经 LLM 的 causal Self-Attention。每隔几个 LLM blocks，text tokens 也会通过一个新的 gated layer 对 image features 做 cross-attend。gate（初始化为零）意味着在 step zero 新 layers 是 no-ops — 模型行为与 pretrained LLM 完全相同。随着训练推进，gate 打开，视觉信息开始流动。

Flamingo 回答的第二个问题是：如何处理每个 prompt 中可变数量的图像（0、1 或多张）？Perceiver resampler — 一个小型 cross-attention module，接收任意数量的 patches，并生成固定数量的 visual latent tokens。无论 prompt 中有多少张图像，LLM cross-attention layer 看到的 shape 都相同。

## 概念
### The frozen LLM

Flamingo 从冻结的 Chinchilla 70B LLM 开始。全部 70B weights 保持不变。现有的文本 Self-Attention 和 FFN 正常运行。

### Perceiver resampler

对于 prompt 中的每张图像，ViT 会生成 N 个 patch tokens。Perceiver resampler 有 K 个固定的 learnable latents（Flamingo 使用 K=64）。每个 resampler block 有两个子步骤：

1. Cross-attention：K 个 latents attend 到 N 个 patch tokens（Q 来自 latents，K/V 来自 patches）。
2. Latents 内部的 Self-Attention + FFN。

经过 6 个 resampler blocks 后，输出是 K=64 个 dim 1024 的 visual tokens，无论 ViT 生成了多少 patches。224x224 图像（196 patches）和 480x480 图像（900 patches）都会输出为 64 个 resampler tokens。

对于 video，resampler 会按时间应用：每一帧的 patches 生成 64 个 latents，而 temporal positional encoding 让模型区分 t=0 和 t=N。完整 video 变成 T * 64 个 visual tokens。

### Gated cross-attention

在冻结 LLM 的每 M 层之间（Flamingo 使用 M=4）插入一个新的 gated cross-attention block：

```
x_after_llm_block = llm_block(x_before)
cross = cross_attn(x_after, resampler_output)
gated = tanh(alpha) * cross + x_after
x_before_next_block = gated
```

- `alpha` 是一个初始化为零的 learnable scalar。
- `tanh(0) = 0`，所以初始化时 gated branch 贡献为零。
- 随着 `alpha` 远离零，cross-attention 贡献会平滑增长。
- residual connection 意味着即使 gate 完全打开，也不会覆盖 LLM 的文本表示；它只是在其上添加视觉信息。

这是 Flamingo 中最重要的设计选择：visual conditioning 是 additive、gated，并且在初始化时为零。step 0 的 Flamingo 在 text-only inputs 上就是一个完整的 Chinchilla 70B。

### 用于 interleaved inputs 的 masked cross-attention

在类似 "<image A> caption A <image B> caption B <image C> ?" 的 prompt 中，每个 text token 应该只看到序列中位于它之前的图像。cross-attention mask 强制执行：位置 `t` 的 text token 只 attend 到图像索引 `i < i_t` 的 image resampler tokens，其中 `i_t` 是位置 `t` 之前最近的图像。“只看到最近的前置图像”或“看到所有前置图像”都是有效选择；Flamingo 选择了前者。

### In-context few-shot learning

Flamingo prompt 看起来像：

```
<image1> A photo of a cat. <image2> A photo of a dog. <image3> A photo of a
```

模型看到补全模式并输出 "bird"（或 image3 显示的任何内容）。没有 Gradient steps。冻结 LLM 的 in-context learning 能力通过 gated cross-attention 保留下来 — 这是论文的 punchline，也是它重要的原因。

### Training data

Flamingo 使用三个数据集训练：

1. MultiModal MassiveWeb (M3W)：4300 万个包含交错图像和文本的网页，重建阅读顺序。
2. Image-Text Pairs (ALIGN + LTIP)：44 亿对。
3. Video-Text Pairs (VTP)：2700 万个短 video clips。

OBELICS（2023）是交错网页语料的开放复现，Idefics、Idefics2 和大多数开放的“Flamingo-like”模型都在其上训练。

### OpenFlamingo and Otter

OpenFlamingo（2023）是开放复现。Architecture 相同（Perceiver resampler + 冻结 LLaMA 或 MPT 上的 gated cross-attention）。Checkpoints 为 3B、4B、9B。由于 base LLM 更小且数据更少，质量落后于 Flamingo。

Otter（2023）基于 OpenFlamingo，并在 MIMIC-IT（一个 Multimodal instructions 数据集）上进行 instruction tuning，表明 gated cross-attention 也适用于 instruction following。

### The descendants

- Idefics / Idefics2 / Idefics3：Hugging Face 的 gated cross-attention lineage，逐步简化（Idefics2 放弃 resampler，改为使用带 adaptive pooling 的 direct patch tokens）。
- Flamingo-to-Chameleon transition：到 2024 年，许多团队转向 early-fusion（Lesson 12.11）；在需要冻结 backbone 的生产环境中，Flamingo-style gated cross-attention 仍然存在。
- Gemini 的 interleaved input：概念上继承了 Flamingo 的 interleaved-format 灵活性，尽管确切机制是 proprietary。

### Comparison to BLIP-2

| | BLIP-2 | Flamingo |
|---|---|---|
| Visual bridge | 输入处一次性使用 Q-Former | 每 M 层使用 gated cross-attention |
| Visual tokens | 每张图像 32 个 | 每张图像每个 cross-attn layer 64 个 |
| Frozen LLM | Yes | Yes |
| Few-shot in-context | 弱 | 强 — 论文的核心 |
| Interleaved inputs | 无原生支持 | Yes，设计目标 |
| Training data | 130M pairs | 1.3B pairs + 43M interleaved pages |
| Parameter count | 188M trained | ~10B trained (cross-attn layers) |
| Compute | 8 个 A100 上数天 | 数千个 TPUv4 上数周 |

预算有限的单图 VQA 选择 BLIP-2。需要交错输入、few-shot 或多图推理时选择 Flamingo/Idefics2。

## 使用它
`code/main.py` 演示：

1. 在 36 个 fake patch tokens 上运行 Perceiver resampler，使用 8 个 learnable latents（纯 Python cross-attention）。
2. 一个 gated cross-attention step，其中 `alpha = 0` → 输出等于输入（LLM 不变），然后 `alpha = 2.0` → 混入视觉贡献。
3. 一个 interleaved-mask builder，为 "(image 1) (text 1) (image 2) (text 2)" 序列生成 2D attention mask。

## 交付它
本课产出 `outputs/skill-gated-bridge-diagnostic.md`。给定一个开放 VLM 的 config（resampler Y/N、cross-attn frequency、gate scheme），它会识别 Flamingo lineage elements 并解释 freezing strategy。适用于调试为什么某次 fine-tune 降低了文本性能（答案：gate 过快开得太大）。

## 练习
1. 计算 Flamingo-9B 的 visual parameter count：9B LLM + 1.4B gated cross-attention layers + 64M resampler。训练参数占总参数的比例是多少？

2. 在 PyTorch 中实现 gated residual `y = tanh(alpha) * cross + x`。通过实验展示当 `alpha=0` 时，初始化处 `y==x` 精确成立。

3. 阅读 OpenFlamingo Section 3.2（arXiv:2308.01390），了解当每个 prompt 的图像数量不同时，他们如何处理 batch 中的多张图像。描述 padding strategy。

4. 为什么 Flamingo 的 cross-attention mask 让 text token attend 到*最近的*前置图像，而不是所有前置图像？阅读 Flamingo paper Section 2.4 并解释 tradeoff。

5. In-context few-shot：为一个新的 Flamingo variant 构造一个包含 4 个“image → main object 的 color”示例的 prompt。描述当示例数量从 0 到 8 变化时，预期 accuracy pattern 如何变化。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Perceiver resampler | "Fixed-latent cross-attention" | 从可变数量的 input patches 中生成 K 个固定 tokens 的 module |
| Gated cross-attention | "Tanh-gated bridge" | residual layer `y = tanh(alpha)*cross + x`，learnable alpha，初始化为 0 |
| Interleaved input | "Mixed sequence" | 图像和文本按阅读顺序自由混合的 prompt format |
| Frozen LLM | "No LLM gradients" | 文本 LLM 的 weights 不更新；只训练 resampler + cross-attn layers |
| Few-shot | "In-context examples" | 在 prompt 中给出少量（image, answer）对；模型无需 finetuning 即可泛化 |
| OBELICS | "Interleaved web corpus" | 包含 141M 个网页的开放数据集，图像和文本按阅读顺序排列 |
| Chinchilla | "70B frozen base" | Flamingo 的冻结文本 LLM，来自 DeepMind 的 Chinchilla paper |
| Gate schedule | "How alpha moves" | 训练期间 cross-attention gate 打开的速率 |
| Cross-attn frequency | "Every M layers" | 插入 gated cross-attention block 的频率；Flamingo 使用 M=4 |
| OpenFlamingo | "Open reproduction" | MosaicML/LAION 的 3-9B 开放 checkpoint；architecture 与 Flamingo 相同 |

## 延伸阅读
- [Alayrac et al. — Flamingo (arXiv:2204.14198)](https://arxiv.org/abs/2204.14198) — 原始论文。
- [Awadalla et al. — OpenFlamingo (arXiv:2308.01390)](https://arxiv.org/abs/2308.01390) — 开放复现。
- [Laurençon et al. — OBELICS (arXiv:2306.16527)](https://arxiv.org/abs/2306.16527) — 交错网页语料。
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) — 通用 Perceiver architecture。
- [Li et al. — Otter (arXiv:2305.03726)](https://arxiv.org/abs/2305.03726) — 经过 instruction-tuned 的 Flamingo 后续模型。
- [Laurençon et al. — Idefics2 (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246) — Flamingo approach 的现代简化。
