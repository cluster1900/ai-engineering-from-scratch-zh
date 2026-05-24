---
name: resolution-budget-planner
description: 为 mixed-aspect-ratio VLM workload 在 square-resize、AnyRes、M-RoPE 和 NaFlex 之间做选择，并输出 per-task token budget plan。
version: 1.0.0
phase: 12
lesson: 06
tags: [vlm, patch-n-pack, naflex, anyres, m-rope, token-budget]
---

给定一个 workload —— 描述 VLM 将看到的图像（OCR documents、charts、UI screenshots、natural photos、video frames）以及总的 per-request token budget —— 为每个 image class 选择一种 resolution strategy，并生成可运行的配置。

生成：

1. Per-image-class strategy。对于每个声明的 class（OCR、chart、UI、photo、video-frame），从 {square-resize, AnyRes, M-RoPE, NaFlex} 中选择一个。用一句话说明理由，并引用该 task 的 resolution sensitivity。
2. Token budget per image。包含 min_pixels、max_pixels（Qwen2.5-VL 风格），以及在所选 strategy 下的预期 sequence length。如果任何单张图像超过 LLM context 的 40%，需要标记。
3. Batch packing plan。如果 requests 被 batch，说明使用 `cu_seqlens`（FlashAttn varlen）、dense block-diagonal mask，还是 unbatched single-image inference。当 batch aspect ratios 变化超过 2x 时，注明 varlen 的 FLOP 节省。
4. Encoder recommendation。混合 workloads 使用 SigLIP 2 NaFlex；agent UIs 使用 Qwen2.5-VL native；frozen-encoder deployments 使用 CLIP-336 + AnyRes；photo-only paths 使用 raw ViT at 224。
5. Failure-mode alarms。所选 config 下的 tokens-per-image；30 tok/s prefill 时的 latency cost；context-fill percentage；相对 square-resize 在典型 OCR benchmarks 上的预期 accuracy delta。

Hard rejects:
- 在 OCR 或 chart tasks 中推荐 square-resize，却没有引用用户会损失哪个 benchmark number。
- 提出一种生成 tokens 数超过 LLM context 允许范围的 strategy。始终基于声明的 context window 做预算。
- 把 AnyRes 当作万能答案 —— 它的 multiplicative tile overhead 可能在一张图像编码完成前就超过 LLM context。

Refusal rules:
- 如果用户声明的 token budget 低于每张图像 256 tokens，除 photo-only semantic task 外都拒绝 —— 在该 budget 下，无论怎样 pooling 都无法恢复 OCR accuracy。
- 如果用户需要 dense-prediction outputs（segmentation、depth），但 encoder 中没有 ViT register tokens，拒绝并指向 DINOv2 / SigLIP 2 with registers enabled。
- 如果用户的 LLM context < 8k，且 workload 包含 documents 或 screenshots，拒绝并建议更大的 context 或 OCR-first pipeline。

Output：一页 budget plan，包含 per-class strategy table、batch-packing plan、encoder recommendation 和 alarm list。最后附上用于后续阅读的相关 arXiv paper —— NaViT 为 2307.06304，SigLIP 2 / NaFlex 为 2502.14786，Qwen2.5-VL 为 2502.13923。
