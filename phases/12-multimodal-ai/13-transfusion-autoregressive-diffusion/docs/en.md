# Transfusion：在一个 Transformer 中结合 Autoregressive Text + Diffusion Image

> Chameleon 和 Emu3 把全部筹码押在离散 Token 上。它们能工作，但量化瓶颈很明显：图像质量会在低于连续空间 diffusion 模型的位置进入平台期。Transfusion（Meta，Zhou et al.，2024 年 8 月）押了相反的方向：保持图像连续，完全去掉 VQ-VAE，并用两个 loss 训练一个 transformer。文本 Token 使用 next-token-prediction。图像 patch 使用 flow-matching / diffusion loss。两个目标优化同一组权重。Stable Diffusion 3 底层架构（MMDiT）是一个近亲。本课会阅读 Transfusion 论点，构建一个玩具级双 loss trainer，并追踪让一个 transformer 同时完成两类工作的 attention mask。

**Type:** Build
**Languages:** Python（stdlib，MNIST-scale 玩具双 loss trainer）
**Prerequisites:** Phase 12 · 11（Chameleon），Phase 8（Generative AI）
**Time:** ~180 minutes

## 学习目标
- 连接一个在同一 backbone 上运行两个 loss 的 transformer（文本 Token 上的 NTP，图像 patch 上的 diffusion MSE）。
- 解释为什么图像 patch 之间使用 bidirectional attention，同时文本 Token 使用 causal attention，是正确的 mask 选择。
- 在计算、质量和代码复杂度上，对比 Transfusion-style（连续图像，diffusion loss）与 Chameleon-style（离散图像，NTP）。
- 说出 MMDiT 的贡献：每个 block 使用 modality-specific weights，在 residual stream 上进行 joint attention。

## 问题
离散图像 Token 与连续图像 Token 的争论比 LLMs 更早。连续表示（raw pixels、VAE latents）保留细节。离散 Token（VQ indices）适配 transformer 的原生词表，但会在量化步骤丢失细节。

Chameleon / Emu3 选择了离散路线：一个 loss，一个架构，但图像保真度受 Tokenizer 质量限制。

Diffusion 模型选择了连续路线：图像质量很强，但它是与 LLM 分开的模型，噪声调度工程复杂，也没有与文本生成的干净集成方式。

Transfusion 提出的问题是：能不能两者兼得？保持图像连续，仍然训练一个模型，并把两个 loss 缝合进一次 gradient step。

## 概念
### 双 loss 架构

一个 decoder-only transformer 处理包含以下内容的序列：

- 文本 Token（离散，来自 BPE vocab）。
- 图像 patch（连续，16x16 pixel blocks，通过 linear embedding 投影到 hidden dim，与 ViT encoder 的输入相同）。
- `<image>` 和 `</image>` 标签，用来标记连续 patch 所在位置。

Forward pass 只运行一次。loss 会为每个 Token 选择两个 head 之一：

- 对文本 Token：在 vocab-logits head 上使用标准 cross-entropy。
- 对图像 patch：在连续 patch 上使用 diffusion loss，预测加入到每个 patch 的噪声。

Gradient 会流经共享的 transformer body。两个 loss 同时改进共享权重。

### Attention mask：causal text + bidirectional image

文本 Token 必须是 causal 的；不能让文本 Token attend 到未来文本，否则 teacher forcing 会被破坏。但图像 patch 表示同一个快照；它们应该在同一个图像 block 内彼此 bidirectionally attend。

mask：

```
M[i, j] = 1 if:
  (i is text and j is text and j <= i)   # causal for text
  OR (i is image and j is image and same_image_block(i, j))   # bidirectional within image
  OR (i is text and j is image and j < i_image_end)   # text attends to previous images
  OR (i is image and j is text and j < i_image_start)   # image attends to preceding text
```

在训练和推理中实现为 block-triangular mask。

### Transformer 内部的 diffusion loss

diffusion loss 是标准形式：给图像 patch 加噪声，让模型预测噪声（或等价地预测 clean patch）。Transfusion 的版本使用 flow matching：预测从 noisy 到 clean 的 velocity field。

训练期间：
1. 对每个图像 patch x0，采样一个随机 timestep t。
2. 采样噪声 ε，计算 xt = (1-t) * x0 + t * ε（flow matching 的线性插值）。
3. transformer 预测 v_theta(xt, t)；loss = MSE(v_theta(xt, t), ε - x0)。
4. 与同一序列中的文本 NTP loss 一起 Backprop。

推理时，生成流程是：
- 文本 Token：标准 autoregressive sampling。
- 图像 patch：以此前文本 Token 为条件的 diffusion sampling loop（通常 10-30 steps）。

### MMDiT：Stable Diffusion 3 的变体

Stable Diffusion 3（Esser et al.，2024 年 3 月）在与 Transfusion 接近的时间发布了 MMDiT（Multimodal Diffusion Transformer）。这两个架构是同宗分支。

MMDiT 的关键差异：

- 每个 block 使用 modality-specific weights。每个 transformer block 对文本 Token 和图像 patch 分别有独立的 Q、K、V 和 MLP 权重。Attention 是 joint 的（cross-modality）；其他部分是 modality-specific 的。
- Rectified flow training。一种特定的 flow-matching 变体，采样方式明确，数学上比 DDPM 更简单。
- 规模。MMDiT 是 SD3 的 backbone（2B 和 8B 参数变体）。Transfusion 论文扩展到 7B。

两者汇聚到同一个核心想法：一个 transformer 对文本运行 NTP，对连续图像表示运行 diffusion。

### 为什么它胜过 Chameleon-style

连续 diffusion 与离散 NTP 在图像生成上的质量差距是可测量的。Transfusion 论文报告：

- 在 7B 参数规模下，FID 比同规模 Chameleon-style 模型好 3-5 分。
- 不需要训练 Tokenizer：图像 encoder 更简单（linear projection 到 hidden，与 ViT 的 input layer 相同）。
- 图像 patch 去噪可以并行化推理，不像 autoregressive image tokens。

缺点：Transfusion 是双 loss 模型，训练动态更难。loss weights 需要调参。NTP 与 diffusion 之间的 schedule mismatch 可能导致某个 head 占主导。

### 下游分支

Janus-Pro（Lesson 12.15）通过解耦用于理解与生成的 vision encoder 来改进 Transfusion 的想法：一个使用 SigLIP，另一个使用 VQ，同时共享 transformer body。Show-o（Lesson 12.14）把 diffusion 换成 discrete-diffusion（masked prediction）。统一生成家族在 Transfusion 之后迅速分叉。

2026 年能输出图像的生产级 VLMs，例如 Gemini 3 Pro、GPT-5、Claude Opus 4.7 的图像生成路径，几乎肯定使用了这个家族的某种后代。细节是专有的。

## 使用它
`code/main.py` 在一个很小的 MNIST-like 问题上构建玩具 Transfusion：

- 文本 caption 是描述数字（0-9）的短整数序列。
- 图像是 4x4 字节网格。
- 一对共享权重的 linear projections 充当 transformer 替身；文本上使用 NTP loss，noisy patches 上使用 MSE loss。
- 训练循环交替使用两个 loss，attention mask 是显式的。
- 生成在一次 forward pass 中产生文本 caption 和 4x4 图像。

这个 transformer 是玩具级的。双 loss plumbing、attention mask 构造和推理循环才是真正的产物。

## 交付它
本课产出 `outputs/skill-two-loss-trainer-designer.md`。给定一个新的 Multimodal 训练任务（文本 + 图像、文本 + 音频、文本 + 视频），它会设计双 loss schedule（loss weights、mask shape、shared vs modality-specific blocks），并标记实现风险。

## 练习
1. 一个 Transfusion-style 模型训练时包含 70% 文本 Token 和 30% 图像 patch。图像 diffusion loss 的数量级约为文本 NTP loss 的 10x。什么样的 loss weights 可以平衡它们？

2. 为这个序列实现 block-triangular mask：`[T, T, <image>, P, P, P, P, </image>, T]`。将每个条目标为 0 或 1。

3. MMDiT 有 modality-specific QKV 权重。相比 Transfusion 的完全共享 transformer，这会增加多少参数开销？在 7B 参数规模下，值得吗？

4. 生成：给定一个文本 prompt，模型先运行 NTP 生成 50 个 Token，然后遇到 `<image>`，接着在 256 个 patch 上运行 20 个 denoise steps 的 diffusion。总共需要多少次 forward pass？

5. 阅读 SD3 论文 Section 3。描述 rectified flow，以及它为什么比 DDPM 用更少的推理 steps 就能收敛。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Two-loss training | "NTP + diffusion" | 一个 transformer 在同一个 gradient step 中，同时优化文本 Token 上的 cross-entropy 和连续图像 patch 上的 MSE |
| Flow matching | "Rectified flow" | 一种 diffusion 变体，预测从噪声到 clean data 的 velocity field；数学上比 DDPM 更简单 |
| MMDiT | "Multimodal DiT" | Stable Diffusion 3 的架构：joint attention、modality-specific MLPs 和 norms |
| Block-triangular mask | "Causal text + bidirectional image" | 一种 attention mask：跨文本是 causal 的，但在图像区域内是 bidirectional 的 |
| Continuous image representation | "No VQ" | 图像 patch 作为实值 Vector，而不是整数 codebook indices |
| Velocity prediction | "v-parameterization" | 网络输出是噪声与数据之间的 velocity field，而不是噪声本身 |

## 延伸阅读
- [Zhou et al. — Transfusion (arXiv:2408.11039)](https://arxiv.org/abs/2408.11039)
- [Esser et al. — Stable Diffusion 3 / MMDiT (arXiv:2403.03206)](https://arxiv.org/abs/2403.03206)
- [Peebles & Xie — DiT (arXiv:2212.09748)](https://arxiv.org/abs/2212.09748)
- [Zhao et al. — MonoFormer (arXiv:2409.16280)](https://arxiv.org/abs/2409.16280)
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
