# Janus-Pro：用于统一 Multimodal 模型的解耦 Encoder

> 统一 Multimodal 模型存在一种无法避免的张力。理解需要语义特征，即 SigLIP 或 DINOv2 输出的 Vectors，富含概念级信息。生成需要有利于重建的 codes，即能够重新组合成清晰 pixels 的 VQ Tokens。这两个目标在单个 Encoder 中并不兼容。Janus（DeepSeek，2024 年 10 月）和 Janus-Pro（DeepSeek，2025 年 1 月）认为修复方式是停止强行统一：解耦两个 Encoder。任务之间共享 Transformer body，但理解通过 SigLIP 路由，生成通过 VQ Tokenizer 路由。在 7B 规模下，Janus-Pro 在 GenEval 上超过 DALL-E 3，同时在 MMMU 上匹配 LLaVA。本课会解释为什么两个 Encoder 能在单个 Encoder 失败的地方奏效。

**类型：** Build
**语言：** Python（stdlib，dual-encoder routing + shared-body signal）
**先修：** Phase 12 · 13（Transfusion），Phase 12 · 14（Show-o）
**时间：** 约 120 分钟

## 学习目标
- 解释为什么单个共享 Encoder 会在理解质量或生成质量中牺牲一方。
- 描述 Janus-Pro 的 routing：理解在输入侧使用 SigLIP features，生成在输入和输出两侧使用 VQ Tokens。
- 追踪让 Janus-Pro 成功、而 Janus 未能做到的数据混合扩展。
- 比较 decoupled（Janus-Pro）、coupled-continuous（Transfusion）和 coupled-discrete（Show-o）架构。

## 问题
统一模型在理解和生成之间共享 Transformer body。此前的尝试（Chameleon、Show-o、Transfusion）都在两个方向上使用同一个 visual Tokenizer。这个 Tokenizer 是一种折中：

- 为重建优化（生成）：VQ-VAE 捕捉细粒度 pixel 细节，但产生的 Tokens 语义一致性较弱。
- 为语义优化（理解）：SigLIP Embeddings 会把 "cat" 图像聚到 "cat" Tokens 附近，但无法支持良好重建。

Show-o 和 Transfusion 因此在某一个方向上付出了可见的质量代价。Janus-Pro 提出问题：当任务需求不同，为什么还要求一个 Tokenizer？

## 概念
### 解耦视觉编码

Janus-Pro 的架构分离了两个 Encoder：

- 理解路径。输入图像 → SigLIP-SO400m → 2-layer MLP → Transformer body。
- 生成路径。输入图像（如果基于已有图像进行 conditioning）→ VQ Tokenizer → Token IDs → Transformer body。
- 输出生成。Transformer 预测的图像 Tokens → VQ decoder → pixels。

Transformer body 是共享的。body 上游和下游的一切都是任务特定的。

输入通过 prompt format 消除歧义：`<understand>` tag 通过 SigLIP 路由；`<generate>` 通过 VQ 路由。或者 routing 也可以由任务隐式决定。

### 为什么这有效

理解 loss 获得 SigLIP features，而 CLIP-style pretraining 已经将其调优为适合语义相似性。模型的感知 benchmark 优于 Show-o / Transfusion，因为输入 features 更适合该任务。

生成 loss 获得 VQ Tokens，而 Tokenizer 已经被调优为适合重建。图像质量优于 Show-o，因为 VQ codes 能干净地组合回 pixels。

共享 Transformer body 会看到两种输入分布（SigLIP 和 VQ），并学习同时处理二者。其主张是：只要数据足够多、参数足够多，body 就能吸收这种切换。

### 数据扩展：Janus vs Janus-Pro

Janus（原始版，arXiv 2410.13848）引入了解耦，但规模较小（1.3B params，数据有限）。Janus-Pro（arXiv 2501.17811）进行了扩展：

- 7B params（相对 1.3B）。
- stage 1（alignment）使用 90M image-text pairs，高于 72M。
- stage 2（unified）使用 72M，高于 26M。
- stage 3 增加 200k image-gen instruction samples。

结论是：Janus-Pro-7B 在 MMMU 上匹配 LLaVA（60.3 vs ~58），并在 GenEval 上超过 DALL-E 3（0.80 vs 0.67）。一个 open 模型，在统一谱系的两端都具备竞争力。

### JanusFlow：rectified flow 变体

JanusFlow（arXiv 2411.07975）用 rectified-flow 生成路径（continuous）替换了 VQ 生成路径。拆分变成 SigLIP-for-understanding + rectified-flow-for-generation。质量上限进一步提高。架构仍然是 decoupled-encoders-shared-body。

### 共享 body 的职责

Transformer body 处理统一序列，但面对两种输入分布。它的职责是：

- 对理解：消费 SigLIP features + text Tokens → 自回归地输出文本。
- 对生成：消费 text Tokens +（可选 image VQ Tokens）→ 自回归地输出 image VQ Tokens。

body 在每个 block 中没有 modality-specific weights。它就是你预期会在 Qwen 或 Llama 内部看到的 text-style Transformer，再加上两个 input adapters。

有意思的是，这意味着 Janus-Pro 的 body 可以从 pretrained LLM 初始化。Janus-Pro 确实从 DeepSeek-MoE-7B 初始化。这个选择很重要：LLM 提供了推理能力，而纯 from-scratch 的统一模型很难达到这种能力。

### 与 InternVL-U 对比

InternVL-U（Lesson 12.10）是 2026 年的后续工作。它结合了：

- Native Multimodal pretraining（InternVL3 backbone）。
- Decoupled-encoder routing（SigLIP in，VQ + diffusion heads out）。
- 统一理解 + 生成 + 编辑。

InternVL-U 将 Janus-Pro 的架构选择吸收到一个更大的框架中。decoupled-encoder 思想现在是大规模统一模型的默认选择。

### 局限

解耦 Encoder 会增加架构复杂性。需要训练两个 Tokenizers，维护两个输入路径，处理两组 failure modes。对于不需要生成的产品，Janus-Pro 是过度设计，选择 LLaVA-family 理解模型即可。

对于不需要理解的产品，Janus-Pro 能力过剩，选择 Stable Diffusion 3 / Flux 模型即可。

对于两者都需要的产品，Janus-Pro 现在是参考 open 架构。

## 使用它
`code/main.py` 模拟 Janus-Pro routing：

- 两个 mock encoders：SigLIP-like（产生 256-dim 语义 Vectors）和 VQ-like（产生 integer codes）。
- 一个 prompt router，根据 task tag 选择 Encoder。
- 一个共享 body（stand-in），无论 Tokens 序列由哪个 Encoder 产生，都进行处理。
- 从 stage 1（alignment）到 stage 3（instruction tune）的 weighted-sample schedule 切换。

打印 3 个示例的 routed paths：image QA、T2I、image editing。

## 交付它
本课会生成 `outputs/skill-decoupled-encoder-picker.md`。给定一个希望在 frontier-ish 质量下同时获得统一生成 + 理解的产品，它会选择 Janus-Pro、JanusFlow 或 InternVL-U，并给出具体的数据规模建议。

## 练习
1. Janus-Pro-7B 在 GenEval 上超过 DALL-E 3。解释为什么一个 7B open 模型能在生成上匹配 frontier 专有模型，但在理解上不能。

2. 实现一个 router function：给定 prompt text，将其分类为 `understand` 或 `generate`。你如何处理像 "describe and then sketch" 这样的模糊 prompts？

3. JanusFlow 用 rectified flow 替换 VQ 路径。Transformer body 现在输出什么？loss 会发生什么变化？

4. 提出 Janus-Pro 架构可以通过再增加一个解耦 Encoder 来处理的第四种任务。示例：image segmentation（DINO-style）、depth（MiDaS-style）。

5. 阅读 Janus-Pro Section 4.2 中关于数据扩展的内容。哪个数据阶段对相对 Janus 的 T2I 质量提升贡献最大？

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Decoupled encoding | "两个 visual encoders" | 每个方向使用单独的 Tokenizer 或 Encoder：理解使用语义向，生成使用重建向 |
| Shared body | "一个 Transformer" | 单个 Transformer 处理任一 Encoder 的输出；没有 modality-specific weights |
| SigLIP for understanding | "语义 features" | CLIP-family vision tower，提供丰富的概念 features，但重建较差 |
| VQ for generation | "重建 codes" | Vector-quantized Tokens，可以干净地 decode 回 pixels |
| JanusFlow | "Rectified-flow variant" | 使用 continuous flow-matching generation head 替代 VQ 的 Janus-Pro |
| Routing tag | "Task tag" | Prompt marker（`<understand>` / `<generate>`），用于选择输入 Encoder |

## 延伸阅读
- [Wu et al. — Janus (arXiv:2410.13848)](https://arxiv.org/abs/2410.13848)
- [Chen et al. — Janus-Pro (arXiv:2501.17811)](https://arxiv.org/abs/2501.17811)
- [Ma et al. — JanusFlow (arXiv:2411.07975)](https://arxiv.org/abs/2411.07975)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Dong et al. — DreamLLM (arXiv:2309.11499)](https://arxiv.org/abs/2309.11499)
