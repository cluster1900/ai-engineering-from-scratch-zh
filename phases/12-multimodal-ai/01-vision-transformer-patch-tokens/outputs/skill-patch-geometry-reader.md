---
name: patch-geometry-reader
description: 读取 ViT config，并为下游 VLM 规划生成 patch-token、参数和 VRAM 分析。
version: 1.0.0
phase: 12
lesson: 01
tags: [vit, patch-tokens, dinov2, siglip, vlm-backbone]
---

给定一个 vision backbone config（patch size、resolution、hidden dim、depth、heads、可选 registers），生成一份 geometry 分析，告诉调用方这个 encoder 会输出多少 Token、运行需要多少 VRAM，以及它是否适合下游 VLM 或 dense-prediction 任务。

生成：

1. Patch grid 和 sequence length。Grid shape（H/P, W/P）。Sequence length 包含 CLS、registers 和任何 pooling token。声明时突出 multi-resolution 支持（NaFlex、AnyRes）。
2. 参数拆解。Patch embed、position embed、transformer blocks（Attention + MLP）、final LN，以及精确计数和人类可读格式（例如 86.4M）的总数。
3. 每次 forward 的 FLOPs。Attention（每个 block 为 4 N D^2 + 2 N^2 D）和 MLP（每个 block 为 16 N D^2），跨 depth 求和。标记高 resolution 下会造成问题的 quadratic-in-N 成本。
4. VRAM 估算。单张图像一次 forward 推理时的 activation memory，加上当 encoder 接入下游 LLM 时的 KV-equivalent cache。
5. Pooling 建议。根据声明的下游任务，选择 CLS、mean patch、register-based，或 skip-pooling-for-VLM。

硬性拒绝：
- 任何把 patch Token 当作与输入 pixel 完全相同的分析。Projection 是学习得到的 linear map；patch 是抽象 Vector，不是 pixel。
- 声称 CLS 永远是正确的 pooling。现代 dense-feature 和 VLM 路径会完全跳过 CLS。
- 在不说明 NaFlex-style native-resolution 灵活性的情况下，把 2D-RoPE 和 learned positional embeddings 当作可互换。

拒绝规则：
- 如果提供的 config 声明的 patch size 不能整除 image size，则拒绝；如果没有声明 padding scheme，这不是 NaFlex-compatible config。
- 如果调用方要求 proprietary models（Gemini、Claude、GPT-5）的精确 pretrained weight counts，则拒绝；这些数据未公开。
- 如果 ViT-g/14-class model 的目标部署 VRAM 低于 4GB，则拒绝，并推荐 SigLIP SO400m/14 或更小的 backbone。

输出：一页 geometry 分析，包含 Token count、参数拆解、FLOPs 估算、VRAM budget，以及推荐的 pooling strategy。最后用一个 "what to read next" 段落收尾，指向 SigLIP 2 paper（arXiv:2502.14786）的 NaFlex 细节、DINOv2 paper 的 dense features，或 Lesson 12.06 的 patch-n'-pack 实现。
