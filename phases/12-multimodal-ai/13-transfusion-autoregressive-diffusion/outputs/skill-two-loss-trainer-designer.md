---
name: two-loss-trainer-designer
description: 设计一个 Transfusion / MMDiT 风格的 two-loss 训练设置（一个 modality 使用 NTP，另一个使用 Diffusion），包括 Loss 权重、mask 设计和 schedule。
version: 1.0.0
phase: 12
lesson: 13
tags: [transfusion, mmdit, two-loss, flow-matching, hybrid-attention]
---

给定一个 Multimodal 训练 spec（两种 modalities，哪一种使用 NTP、哪一种使用 Diffusion，目标模型规模，目标样本长度），设计一个可工作的 two-loss 设置。

产出：

1. Modality split。哪些 Tokens 是离散的（NTP），哪些是连续的（Diffusion）。按内容类型说明理由（text 总是离散的；images、audio、video 可以走任一方式）。
2. Attention mask。为一个示例序列画出 block-triangular mask。指定 bidirectional 区域和 causal 区域。
3. Loss 权重。(text_loss, image_loss) 的起始权重。建议按目标 gradient-norm ratio 调参。引用 Transfusion 的约 ~0.1 默认值。
4. Flow-matching vs DDPM。选择 Diffusion 变体；flow matching 数学更简单，rectified flow 推理步数更少。
5. 推理计划。NTP 路径（对 text 做 autoregressive sampling）+ Diffusion 路径（对 image patches 做 conditional denoise）。指定 denoise 步数（10-30）。
6. MMDiT vs Transfusion split。何时添加 modality-specific block weights（MMDiT），何时完全共享（Transfusion）；按 parameter count 给出经验规则。

硬性拒绝：
- 声称一种 mask 适用于所有序列。每个样本都有不同的 image span，需要自己的 block-triangular mask。
- 使用 DDPM 而不使用 rectified flow 或 flow matching。两者都需要更少推理步数，也更容易调优。
- 不测量 gradient-norm ratio，只用固定权重来平衡 Loss。

拒绝规则：
- 如果用户只需要 understanding（image in, text out），拒绝并推荐 LLaVA 风格的 late fusion（Lesson 12.05）。Two-loss 用于 generation。
- 如果用户想要 <1B 模型，拒绝 two-loss 并推荐 discrete tokens（Chameleon）——在小规模下 Diffusion head 会 underfit。
- 如果用户承担不起双重推理（NTP + Diffusion loops），拒绝并推荐 Show-o（discrete diffusion，single loop）或 Emu3。

输出：一页设计，包含 modality split、mask diagram、Loss 权重、flow 变体、推理计划，以及 MMDiT-vs-shared 决策。结尾给出 arXiv 2408.11039 (Transfusion) 和 2403.03206 (SD3) 作为 canonical references。
