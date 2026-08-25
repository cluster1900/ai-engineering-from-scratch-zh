# Chameleon 与 Early-Fusion Token-Only Multimodal Models

> 到目前为止，我们见过的每个 VLM 都把图像和文本分开处理。视觉 Token 来自 vision encoder，流入 projector，然后在 LLM 内部与文本相遇。视觉词表和文本词表从不重叠。Chameleon（Meta，2024 年 5 月）提出了一个问题：如果它们重叠会怎样？训练一个 VQ-VAE，把图像转换为来自共享词表的一串离散 Token。现在，每个 Multimodal 文档都是一个序列：文本 Token 和图像 Token 交错排列，使用单一 autoregressive loss。副作用是：模型可以生成混合模态输出，也就是在一次 inference call 中交替生成文本和图像 Token。本课阅读 early-fusion thesis，并从头到尾构建一个 toy version。

**类型：** Build
**语言：** Python（stdlib, VQ-VAE tokenizer + interleaved decoder）
**先修：** Phase 12 · 05, Phase 8 (Generative AI)
**时间：** 约 180 分钟

## 学习目标

- 解释为什么 shared vocabulary + single loss 会改变模型能力。
- 描述 VQ-VAE 如何把图像 Tokenize 成与 Transformer next-token objective 兼容的离散序列。
- 说出 Chameleon 的训练稳定性技巧：QK-Norm、dropout placement、LayerNorm ordering。
- 比较 Chameleon 与 BLIP-2 的 Q-Former 方法，并描述各自适合的场景。

## 问题

基于 adapter 的 VLM（LLaVA、BLIP-2、Qwen-VL）把文本和图像当作两种不同的东西。文本 Token 经过 `embed(text_token)`；图像经过 `visual_encoder(image) → projector → ... pseudo_tokens`。模型有两条输入路径，并在中途合并。

三个后果：

1. LLM 只能消费图像，不能输出图像。输出只能是文本。
2. 混合模态文档（例如文章中段落和图像交替出现）很别扭：你要么在模型外部解析 Multimodal 输入，要么串联多次生成。
3. 分布不匹配。视觉 Token 和文本 Token 位于 hidden space 的不同区域，会造成细微的对齐问题。

Chameleon 拒绝这个前提：图像只是来自共享词表的离散 Token 序列。用交错文档训练模型，一个 loss、一个 autoregressive decoder，就能直接获得混合模态生成能力。

## 概念

### VQ-VAE 作为图像 Tokenizer

这个 Tokenizer 是一个 vector-quantized variational autoencoder。架构如下：

- Encoder：CNN + ViT，将图像映射为 spatial feature map，例如 32x32 个 dim 为 256 的特征。
- Codebook：一个学习得到的 K 个 Vector 的词表（Chameleon 使用 8192），同样 dim 为 256。
- Quantization：对每个 spatial feature，通过 L2 distance 查找最近的 codebook entry。用整数 index 替换连续特征。
- Decoder：CNN，将 quantized features 转回像素。

训练：VAE reconstruction loss + commitment loss + codebook loss。Codebook indices 构成图像的离散 alphabet。

对 Chameleon 来说：一张图像变成 32*32 = 1024 个 Token，来自大小为 8192 的词表。与文本 Token（来自 LLM 的 BPE 词表，例如 32000）拼接。最终词表：40192。Transformer 看到的是一个序列、一个 loss。

### 共享词表

Chameleon 的词表组合了文本 Token、图像 Token 和模态分隔符。每个 Token 都有单一 ID。输入 Embedding 层把每个 ID 映射到 D-dim hidden Vector。输出投影把 hidden 映射回 vocab logits。Softmax 选择下一个 Token，不管它属于什么模态。

分隔符很重要：`<image>` 和 `</image>` 标签包住图像 Token 序列。生成时，如果模型输出 `<image>`，下游软件就知道接下来的 1024 个 Token 是要发送给 decoder 进行像素渲染的 VQ indices。

### 混合模态生成

Inference 是在共享词表上的 next-token prediction。示例 prompt："Draw a cat and describe it." Chameleon 输出：

```
<image> 4821 1029 2891 ... (1024 image tokens) </image>
The cat is orange, sitting on a windowsill...
```

模型自主选择顺序：它可能先生成图像再生成文本，先生成文本再生成图像，或交错生成。相同 decoder，相同 loss。

相比之下，adapter VLM 的生成仅限文本。Chameleon 重新打开了关于模型输出模态的问题。

### 训练稳定性：QK-Norm、dropout、LayerNorm ordering

Early-fusion 训练在大规模下不稳定。Chameleon 论文记录了三个技巧：

- QK-Norm。在 Attention 内部，对 query 和 key projection 先应用 LayerNorm，再做 dot product。防止深层网络中 logit magnitude 爆炸。多个 2024 年之后的大模型都使用了它。
- Dropout placement。在每次 residual-add 之后应用 dropout，而不只是 attention 和 MLP 之后。当来自图像 Token 的 Gradient 可能占主导时，需要更强的正则化。
- LayerNorm ordering。Residual branch 上使用 Pre-LN（标准做法），再在最后一个 block 的 skip connection 上额外加一个 LN。稳定最后一层的 Gradient flow。

没有这些技巧时，34B-param Chameleon 训练在多个 checkpoint 发散。有了这些技巧后，训练可以收敛。训练 recipe 和架构本身一样重要。

### Tokenizer 的重建上限

VQ-VAE 是有损的。在 8192 个 codebook entries、每张 512x512 图像 1024 个 Token 的设置下，重建 PSNR 上限约为 26-28 dB。这足以生成可辨认的图像，但明显不如 continuous-space diffusion（Stable Diffusion 3 达到 32+ dB）。

Tokenizer 是瓶颈。更好的 Tokenizer（MAGVIT-v2、IBQ、SBER-MoVQGAN）会抬高上限。Emu3（Lesson 12.12）仅凭更好的 Tokenizer 就达到 SDXL 质量的生成。

### Chameleon vs BLIP-2 / LLaVA

Chameleon（early fusion，共享词表）：
- 一个 loss，一个 decoder。
- 生成混合模态输出。
- Tokenizer 是质量上限。
- 成本高：inference path 上每张生成图像都需要 VQ-VAE decoder。

BLIP-2 / LLaVA（late fusion，分离 towers）：
- 视觉输入，只能输出文本。
- 复用 pretrained LLM。
- 理解任务没有 Tokenizer 瓶颈。
- 便宜：单次 forward pass。

按任务选择。如果你需要图像生成，选择 Chameleon family。如果你只需要理解，adapter-VLM 更简单，并且复用更多 pretrained compute。

### Fuyu 和 AnyGPT

Fuyu（Adept，2023）是一个相关方法：完全跳过单独的 vision encoder，把原始图像 patches 像 Token 一样送入 LLM 的 input projection，不使用 Tokenizer。比 Chameleon 更简单，但失去了 shared-vocab 输出生成能力。

AnyGPT（Zhan et al., 2024）把 Chameleon 扩展到四种模态：文本、图像、语音、音乐。每种模态都使用相同的 VQ-VAE 技巧，共享 Transformer。Any-to-any generation。Lesson 12.16 中会进一步介绍。

```figure
vq-codebook
```

## 使用它

`code/main.py` 构建了一个 toy end-to-end early-fusion model：

- 一个很小的 VQ-VAE-style quantizer，把 8x8 patches 映射到 codebook indices（K=16）。
- 一个共享词表，由（text ids 0..31）+（image ids 32..47）+（separators 48, 49）组成。
- 一个 toy autoregressive decoder（bigram table），在合成 caption + image-token sequences 上训练。
- 一个 sampling loop，给定 prompt 后输出交替的文本 + 图像 Token。

代码有意让 Transformer 极小（bigrams），这样你可以从头到尾追踪 signal flow。

## 交付它

本课产出 `outputs/skill-tokenizer-vs-adapter-picker.md`。给定 product spec（仅理解 vs 理解 + 生成、所需图像质量、成本预算），它会在 Chameleon-family（early fusion）和 LLaVA-family（late fusion）之间做选择，并用定量经验法则说明理由。

## 练习

1. Chameleon 使用 K=8192 个 codebook entries，每张 512x512 图像 1024 个 Token。估算相对于 24-bit RGB 图像的压缩比。它是有损的吗？有多有损？

2. 一张 4K 图像（3840x2160）在相同 VQ-VAE density 下会产生多少图像 Token？Chameleon-style 模型能在一次 inference call 中生成一张 4K 图像吗？最先出问题的是 context、Tokenizer 质量，还是 KV cache？

3. 用纯 Python 实现 QK-Norm。给定一个 64-dim query 和 key，展示 LayerNorm 前后的 dot product。为什么在深层网络中控制 magnitude 很重要？

4. 阅读 Chameleon Section 2.3 中关于训练稳定性的内容。描述论文观察到的 34B 模型在没有 QK-Norm 时的确切失败模式。"norm explosion" 的特征是什么？

5. 扩展 toy decoder，使其在给定纯文本 prompt 时输出混合模态响应。在 training-data distribution 为 60% text-first / 40% image-first 的情况下，测量模型选择 image-first 与 text-first 的频率。

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Early fusion | "Unified tokens" | 图像从第一步起就被转换为离散 Token，并共享 Transformer 的词表 |
| VQ-VAE | "Image tokenizer" | CNN + ViT + codebook，将图像映射为 Transformer 可预测的整数 indices |
| Shared vocabulary | "One dictionary" | 覆盖文本 + 图像 + 模态分隔符的单一 Token ID 空间 |
| QK-Norm | "Attention stabilizer" | 在 query 和 key 做 dot product 之前对它们应用 LayerNorm，防止 norm blowup |
| Mixed-modality generation | "Text + image output" | 一次 pass 中自主生成交错文本和图像 Token 的 inference |
| Codebook size | "K entries" | VQ-VAE 可 quantize 到的离散 Vector 数量；在压缩率和 fidelity 之间权衡 |
| Tokenizer ceiling | "Reconstruction limit" | 解码 VQ Token 能达到的最佳 PSNR；限制模型的图像质量 |

## 延伸阅读

- [Chameleon Team — Chameleon: Mixed-Modal Early-Fusion Foundation Models (arXiv:2405.09818)](https://arxiv.org/abs/2405.09818)
- [Aghajanyan et al. — CM3 (arXiv:2201.07520)](https://arxiv.org/abs/2201.07520)
- [Yu et al. — CM3Leon (arXiv:2309.02591)](https://arxiv.org/abs/2309.02591)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Adept — Fuyu-8B blog (adept.ai)](https://www.adept.ai/blog/fuyu-8b)
