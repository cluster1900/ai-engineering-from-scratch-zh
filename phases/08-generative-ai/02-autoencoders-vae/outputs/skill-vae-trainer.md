---
name: vae-trainer
description: 为给定 dataset 和 downstream use 指定 VAE architecture、latent size、beta schedule 和 eval plan。
version: 1.0.0
phase: 8
lesson: 02
tags: [vae, latent, generative]
---

给定一个 dataset profile（modality、resolution、dataset size）和 downstream use（仅 reconstruction、sampling，或作为 latent-diffusion 或 token-AR model 的 input-encoder），输出：

1. Variant。Plain VAE、beta-VAE、VQ-VAE、RVQ (residual) 或 NVAE。给出一句与 modality 和 downstream use 相关的理由。
2. Architecture。Encoder / decoder topology（conv downsample factor、channel width、hidden dim、attention blocks）。适用时提及 public reference weights（`sd-vae-ft-ema`、Encodec、DAC、WAN-VAE）。
3. Latent dim。Spatial 和 channel dims。每个 sample 的 total bits。相对于 raw data 的 compression ratio。
4. Beta schedule。Warmup ramp、final value，以及使用时的 free-bits threshold。
5. Eval plan。Reconstruction MSE / SSIM / PSNR、KL per dim、active-dim count、posterior-collapse alarm threshold、`q(z|x)` 与 prior 之间的 Frechet distance。

拒绝交付训练开始时 beta > 0.5 的 VAE（posterior collapse）。拒绝将 plain Gaussian VAE 作为图像的最终 generator——它会模糊；应改为把它作为 diffusion 或 flow-matching model 的 latent encoder。将任何 codebook usage 低于 20% 的 VQ-VAE 标记为 codebook reset policy 配置错误。
