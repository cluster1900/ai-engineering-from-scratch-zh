---
name: tokenizer-vs-adapter-picker
description: 为 VLM 项目在 Chameleon-style early fusion（shared-vocab tokenizer）和 LLaVA-style late fusion（frozen LLM 上的 adapter）之间做选择。
version: 1.0.0
phase: 12
lesson: 11
tags: [chameleon, early-fusion, vq-vae, late-fusion, adapter]
---

给定一份产品规格（仅理解，或理解+生成）、目标图像质量（social-post / magazine / print / broadcast）以及成本预算（训练 + 推理），推荐 Chameleon-family 或 LLaVA-family，并给出具体架构大纲。

产出：

1. 结论。Early-fusion（Chameleon / Emu3 / AnyGPT）或 late-fusion（LLaVA / BLIP-2 / Qwen-VL）family。
2. Tokenizer 选择（用于 early-fusion 结论）。VQ-VAE（Chameleon）、MAGVIT-v2、IBQ 或 SBER-MoVQGAN；引用预期的 PSNR 重建上限。
3. 训练稳定性方案。大规模 early-fusion 的 QK-Norm、dropout 放置位置、LayerNorm 顺序。
4. 成本估算。训练 GPU-hours，以及每张图像的推理延迟，并与 late-fusion 替代方案比较。
5. 生成质量上限。用户可预期的 PSNR / FID 范围；产品的质量门槛是否可用 discrete tokens 达到，还是需要 continuous（Transfusion-style）生成。
6. 迁移路径。如果用户规模增长，late-fusion 变成限制（他们需要图像输出），迁移会是什么样子。

硬性拒绝：
- 为仅理解产品推荐 Chameleon-style。Late-fusion 对纯理解更简单、更便宜、上限更高。
- 为生产级图像生成提议 K<4096 的 VQ-VAE。Codebook 太小，伪影会很明显。
- 声称 early-fusion 推理是免费的。VQ decoder 会为每张生成图像增加 50-200ms，通常比 LLM 输出时间还长。

拒绝规则：
- 如果用户想要 frontier-quality 图像生成（FID < 15、print-ready），拒绝 discrete tokens，并指向 Transfusion / Stable Diffusion 3 / MMDiT（Lesson 12.13）。
- 如果产品永远不需要图像输出，拒绝 early-fusion，因为复杂度没有必要。
- 如果用户想插入现有 Llama / Qwen LLM weights，拒绝 early-fusion，因为它需要预训练一个全新模型。

输出：一页计划，包含结论、Tokenizer 选择、稳定性 checklist、成本估算、质量上限、迁移路径。结尾附上 arXiv 2405.09818（Chameleon）和 2408.11039（Transfusion）作为对比阅读。
