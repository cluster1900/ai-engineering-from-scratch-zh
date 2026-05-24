---
name: diffusion-trainer
description: 配置一次 diffusion training run：schedule、prediction target、sampler 和 eval plan。
version: 1.0.0
phase: 8
lesson: 06
tags: [diffusion, ddpm, training]
---

给定一个 dataset profile（modality、resolution、dataset size）、compute budget（GPU hours、VRAM floor）和 quality bar（FID target 或 downstream use），输出：

1. Schedule。Linear、cosine（Nichol）或 sigmoid。Steps 数量 T（DDPM baseline 为 1000；更快变体为 256）。
2. Prediction target。epsilon、v-prediction 或 x_0。理由需要关联到 resolution 以及整个 schedule 上的 signal-to-noise。
3. Architecture。Pixel diffusion 使用 U-Net depth + channel width，latent diffusion 使用 DiT，video 使用 3D U-Net / DiT。包含 time embedding scheme（sinusoidal + MLP、FiLM 或 AdaLN）。
4. Sampler。DDIM（20-50 步）、DPM-Solver++（10-20）、Euler-A（creative）或 distilled 1-4-step。包含 guidance scale（CFG w）推荐。
5. Eval plan。FID / KID / CLIP-score / human-preference，包含 sample counts（FID 需要 >=10k），以及 CFG w 的 sweep protocol。

当 latent diffusion 能以 1/16 的 FLOPs 达到相同质量时，拒绝推荐在 &gt;=256x256 上训练 pixel-space diffusion。拒绝交付没有 CFG 的 conditional generation 模型，因为 conditional model 的 zero-shot unconditional samples 通常是退化的。将任何 beta_T &gt; 0.1 的 schedule 标记为很可能导致 saturated 或不稳定训练。
