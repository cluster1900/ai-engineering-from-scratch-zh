---
name: var-tokenizer-designer
description: 为 next-scale visual autoregressive 图像生成设计 multi-scale residual VQ Tokenizer。
version: 1.0.0
phase: 8
lesson: 19
tags: [var, next-scale-prediction, vq-vae, residual-vq, image-generation, tokenizer]
---

给定图像目标（分辨率、通道数、彩色 vs 灰度、数据集大小、下游 LM 计算预算、目标 FID），输出：

1. 尺度计划。列出从 1x1 到 (H/p) x (W/p) 的 K 个分辨率层级。默认 256x256 使用 10 个尺度，512x512 使用 14 个尺度。根据 LM 的有效 sequence length（尺度面积之和）和每个 pass 的 parallel-within-scale 预算论证 K。
2. Codebook。所有尺度使用单个共享 codebook size V（典型值 4096 / 8192 / 16384）。根据数据集大小和 decoder 容量选择 V。确认在 calibration batch 上 codebook usage 保持在 50 percent 以上，否则缩小 V。
3. Residual sharing。确认尺度 1..K 共同通过求和后的上采样 Embedding 重建 latent（residual VQ）。说明 patch size p 和 VAE backbone（VQGAN-style discriminator on / off、perceptual loss weight）。
4. Decoder。VAE decoder 将求和后的 latent 映射回像素。从 VQGAN decoder、VAR-paper decoder 或更轻的 MAGVIT-style decoder 中选择。根据 FID 目标和 decoder VRAM 论证选择。
5. Position embedding。确认使用 (scale_index, row, col) triple，每个尺度有一个 learned Embedding，并在尺度内使用 2D sin-cos。拒绝 flat 1D positions；LM 需要尺度标签来应用正确的条件。

拒绝用于 VAR 的非 residual multi-scale Tokenizer。没有求和 residual，next-scale conditional 会变得定义不清，LM 优化的目标也会不同于论文证明的目标。拒绝单独的 per-scale codebooks，除非 V 已针对较小尺度的像素数校准，并且已缓解 codebook collapse。当 K x average-scale-area 超过 LM 的最大 sequence length 减去 text conditioning 预留空间时，完全拒绝 next-scale prediction。

示例输入: "ImageNet class-conditional 256x256，dataset 1.2M，LM budget 1.5B params，target FID 低于 5.0。"

示例输出:
- Scale schedule: K=10，sizes 1, 2, 3, 4, 5, 6, 8, 10, 13, 16。Total tokens 671。
- Codebook: shared, V=4096。ImageNet 256 上预期 usage 为 70-80 percent。
- Residual sharing：已确认；p=16，VQGAN backbone 使用 perceptual + adversarial Loss，residual sum 重建 f。
- Decoder: VQGAN decoder，4 个 upsampling blocks，不使用 extra refiner。
- Position embedding: (scale, row, col) triple，learned scale token + 尺度内 2D sin-cos。
