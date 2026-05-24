---
name: unified-gen-model-picker
description: 为一个既需要 Multimodal 理解又需要生成、且要求 open weights 的产品，在 Show-o / Transfusion / Emu3 / Janus-Pro 系列之间做选择。
version: 1.0.0
phase: 12
lesson: 14
tags: [show-o, masked-diffusion, unified, t2i, inpainting]
---

给定一个需要统一理解 + 生成（VQA、captioning、T2I，可选 inpainting）、并受 open-weights 约束和 latency 预算限制的产品，选择一个模型系列并输出参考配置。

产出：

1. 系列结论。Show-o（masked discrete diffusion）、Transfusion / MMDiT（continuous diffusion）、Emu3 / Chameleon（autoregressive discrete），或 Janus-Pro（decoupled encoders）。
2. Inference-step 预算。Show-o 为 16 steps，Transfusion 为 20，Emu3 为 1024+。用用户的 latency 预算证明选择合理。
3. Inpainting 支持。Show-o 原生支持；Transfusion 增加一个 mask channel；Emu3 需要单独 fine-tune。向用户标出这一点。
4. Tokenizer 选择。对 discrete 系列，推荐 IBQ / MAGVIT-v2 / SBER；对 continuous，推荐 SD3 的 VAE。
5. 训练稳定性。Two-loss（Transfusion）需要权重调节；Show-o 的单一 loss 更干净。
6. 用户规模增长后的迁移路径。当质量成为限制时，从 Show-o 迁移到 Transfusion。

硬性拒绝：
- 当 inference latency 是每张图 <10s 时，提出 Emu3 / Chameleon。对约 1024 Tokens 做 autoregressive 太慢。
- 声称 Show-o 在 frontier 图像质量上匹配 Transfusion。它不能。Tokenizer 是上限。
- 为一个需要 VQA 的产品推荐 Stable Diffusion。SD 不能对图像进行推理。

拒绝规则：
- 如果用户希望每张图生成 <2s，拒绝 Show-o，并推荐 Stable Diffusion + 单独的 VLM 来做理解。接受 multi-model 复杂性。
- 如果用户希望在 open weights 下获得 "best-in-class quality"，拒绝 Show-o / Emu3，并推荐 Transfusion-family（MMDiT）或 JanusFlow。
- 如果用户无法承诺使用某个 Tokenizer（担心 licensing、质量上限），拒绝 discrete-only 系列，并推荐 Transfusion。

输出：一页选择建议，包含系列结论、step 预算、inpainting 支持、Tokenizer 推荐、稳定性计划和迁移路径。结尾附上 arXiv 2408.12528（Show-o）、2408.11039（Transfusion）、2501.17811（Janus-Pro）。
