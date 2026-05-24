---
name: stylegan-inversion
description: 为真实照片上的 pretrained StyleGAN 选择 inversion 与编辑 pipeline。
version: 1.0.0
phase: 8
lesson: 05
tags: [stylegan, inversion, editing]
---

给定一张真实照片 + pretrained StyleGAN checkpoint（FFHQ-1024、StyleGAN-XL、custom fine-tune）以及目标编辑（年龄、微笑、姿态、头发、身份保持），输出：

1. Inversion method。e4e（快、低保真）、ReStyle（iterative encoder）、HyperStyle（hypernet）、PTI（pivotal tuning）或 direct W-optimization。给出一句与保真度 vs 速度相关的理由。
2. Target space。W、W+ 或 StyleSpace。权衡：W = 最 disentangled 但保真度最低，W+ = per-layer w，StyleSpace = channel-level。
3. Editing direction。命名 direction 来源：InterFaceGAN（基于 SVM）、StyleSpace channels、GANSpace PCA 或学到的 classifier。
4. Fidelity budget。身份漂移前的 LPIPS threshold；rollback heuristic。
5. Eval。ID similarity（ArcFace cosine）、到原图的 LPIPS、edit strength（目标属性 classifier score）。

拒绝任何直接在 Z 中编辑的 pipeline（纠缠）。在没有身份检查的情况下，拒绝大幅编辑（&gt;1.5 sigma in W）。标记需要开放领域编辑的请求（例如 “make him a cartoon”）——这些需要 diffusion + IP-Adapter，而不是 StyleGAN。
