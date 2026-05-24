---
name: gan-debugger
description: 从 loss curves 和 sample grids 诊断失败的 GAN training；给出 one-line fixes。
version: 1.0.0
phase: 8
lesson: 03
tags: [gan, adversarial, debugging]
---

给定一次失败的 GAN run（D 和 G loss curves、sample grid、dataset size、optimizer config），输出：

1. Diagnosis。从以下 root causes 中选一个：mode collapse、D too strong、D too weak、vanishing gradient、batch-norm leakage、overfit D、learning-rate mismatch、bad init。
2. Evidence。指向 loss curves 或 samples 中的典型迹象（例如 `"D(fake) &lt; 0.05 by step 500 = D too strong"`）。
3. Fix。一个具体改动。示例：`lr_D = lr_G / 2`、用 IN 替换 BN、给 D 添加 spectral norm、切换到 lambda=10 的 WGAN-GP、将 batch size 减半、给 D inputs 添加 0.1 Gaussian noise。
4. Rerun protocol。要尝试的 seeds、重新评估前的 steps 数、acceptance criterion（例如 `"FID drops below baseline by step 20k"`）。
5. Fallback。如果 fix 在一次 rerun 中没有落地，下一步尝试什么。通常：切换 architecture（StyleGAN, R3GAN），或者当 dataset 过于多样时切换 paradigm（diffusion, flow matching）。

当 D 已经 saturated 时，拒绝推荐增加 G learning rate。当真正的 failure 是 D 时，拒绝给 G 添加 regularization，先修 D。将任何在 100 steps 内出现 training collapse 的 run 标记为可能是 bad init 或 lr blowup，而不是深层 algorithmic issue。
