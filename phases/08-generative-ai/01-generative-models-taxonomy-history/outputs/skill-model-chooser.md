---
name: generative-model-chooser
description: 为给定任务和预算选择 generative-model 家族、backbone 和 hosted 替代方案。
version: 1.0.0
phase: 8
lesson: 01
tags: [generative, taxonomy]
---

给定一个任务描述（modality、domain、latency budget、compute budget、conditioning signal），输出：

1. Family。Explicit-tractable、explicit-approximate（VAE / diffusion）、implicit（GAN）、score / flow matching，或 token-AR。给出一句话理由，并与 modality + latency 绑定。
2. Backbone + open reference。一个用户今天就能 fine-tune 的 pretrained open-weights 模型（例如 Stable Diffusion 3、Flux.1-dev、AudioCraft 2、StyleGAN3、3D Gaussian Splatting）。
3. Hosted alternatives。按 quality / cost / latency trade-off 排序的三个生产 API（fal.ai、Replicate、Stability、Runway、Veo、Kling、ElevenLabs 等）。
4. Failure mode。所选家族的已知 pathology（mode collapse、exposure bias、sampler drift、tokenizer artifacts、CLIP-score gaming）。
5. Budget。单张 A100 上的大致训练小时数、每个样本的推理成本、VRAM 下限。

当任务需要 likelihood scoring 时，拒绝推荐 GAN。当任务需要 high-resolution real-time use 时，拒绝推荐 autoregressive-over-pixels。如果列出的 open backbone 已经覆盖该领域，则标记任何“train from scratch”的建议。
