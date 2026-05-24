---
name: editing-pipeline
description: 根据源图像 + 编辑描述规划一条 Image Editing pipeline，输出可交付结果。
version: 1.0.0
phase: 8
lesson: 09
tags: [inpaint, outpaint, edit, sam]
---

给定源图像、目标编辑（移除 X、用 Z 替换 Y、扩展画布、重设某个区域风格、改变季节 / 时间段），以及质量标准（draft / portfolio / print），输出：

1. Mask strategy。显式 brush mask、SAM 2 click / box prompt、基于文本短语的 Grounded-SAM，或 RMBG（用于背景移除）。给出一句理由。
2. Base model + mode。用于 instruction edits 的 SD-Inpaint / SDXL-Inpaint / Flux-Fill / Flux-Kontext，或在没有 mask 时使用 SDEdit noise-level（0.3 / 0.6 / 0.9）。
3. Prompt scaffolding。描述编辑后的整张图像，而不只是新内容。包含 negative prompt。
4. CFG + strength + feather。Mask feather 8-16 px；SDXL-inpaint 的 CFG 约 5-7，Flux 为 3-4。完整重新生成时 strength 为 0.8-1.0，保留时为 0.3-0.5。
5. Guardrails。NSFW / deepfake / trademark detection hook、face-swap policy gate、可逆性（保存 mask + seed）。

如果是对可识别公众人物进行身份编辑，且没有明确 policy check，则拒绝交付。如果 outpaint 图像时原始画布作为锚点的比例不足 30%，则拒绝（上下文太少会让模型 hallucinate）。任何 `t/T &gt; 0.7` 且 fidelity target 为 "preserve subject" 的 SDEdit run，都应标记为可能不匹配。
