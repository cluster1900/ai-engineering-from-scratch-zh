---
name: img2img-chooser
description: 根据 paired 与 unpaired data、domain specificity 和 latency budget 选择 image-to-image approach。
version: 1.0.0
phase: 8
lesson: 04
tags: [pix2pix, img2img, conditional]
---

给定一个 task description（source domain、target domain、data availability - paired/unpaired/N samples、latency budget、quality bar），输出：

1. Approach。Pix2Pix（paired、narrow）、Pix2PixHD（paired、high-res）、CycleGAN（unpaired）、SPADE（seg-to-image），或 SD3 / Flux.1 上的 ControlNet variant（general、open-domain）。
2. Training data spec。最少 pair count、resolution、augmentations、license considerations。
3. Architecture。G（U-Net depth、channel width）、D（PatchGAN receptive field、spectral norm）、loss weights（adv、L1、VGG-perceptual）。
4. Inference latency。单张 consumer GPU（RTX 4090、M3 Max）上的目标 ms/image、resolution trade-off。
5. Eval。针对 held-out paired data 的 LPIPS、5k samples 上的 FID、task-specific metrics（seg tasks 的 mIoU、super-resolution 的 PSNR）、human preference。

当 data 是 unpaired 时，拒绝推荐 Pix2Pix - 改为指定 CycleGAN 或 ControlNet。在没有 augmentation / pretraining advice 的情况下，拒绝用少于 500 pairs 训练 paired model。标记任何包含 “arbitrary text prompt” 的请求 - 这些需要 diffusion + ControlNet，而不是 paired GAN。
