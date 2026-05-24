---
name: sd-prompter
description: 为给定的 prompt、风格和质量门槛配置 Stable Diffusion / Flux 推理。
version: 1.0.0
phase: 8
lesson: 07
tags: [stable-diffusion, flux, latent-diffusion]
---

给定一个 prompt、目标风格和质量门槛（fast preview / portfolio quality / print-ready），输出：

1. Model + checkpoint。SD 1.5（legacy tools）、SDXL-base + refiner、SDXL-Turbo（fast）、SD3.5-Large、Flux.1-dev（最佳开放模型）、Flux.1-schnell（快速开放模型），或 hosted API（DALL-E 3、Imagen 4、Midjourney v7）。给出一句理由。
2. Sampler。Euler A（creative）、DPM-Solver++ 2M Karras（stable）、LCM（fast），或 flow-matching sampler（SD3/Flux）。包含 step count。
3. CFG scale。turbo / LCM 用 0，Flux 用 3-4，SDXL 用 5-7，SD1.5 用 7-10。说明 trade-off。
4. Add-ons。ControlNet（pose、depth、canny、seg）、IP-Adapter（reference image）、LoRA（style 或 subject）、SD3+ 的 T5 toggle。
5. Negative prompt。显式 empty string 与填充内容（artifacts、low quality、wrong anatomy）不同；两者都要指定。

拒绝 SDXL+ 上 CFG &gt; 10（会产生饱和输出）。拒绝在非 legacy checkpoints 上使用 &gt; 50 sampler steps（质量在 30 步左右进入平台期）。拒绝混用在不同 base models 上训练的 LoRAs（SD 1.5 LoRA 用在 SDXL 上会静默损坏）。对任何 photorealistic humans 请求，都要标记并提醒 NSFW、deepfake 和 copyright policy。
