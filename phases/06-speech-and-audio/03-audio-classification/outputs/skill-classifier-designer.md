---
name: classifier-designer
description: 为 audio classification 任务选择 architecture、augmentation、class-balance strategy 和 eval metric。
version: 1.0.0
phase: 6
lesson: 03
tags: [audio, classification, beats, ast]
---

给定一个 audio classification 任务（domain、label count、每个片段的 label density、data volume、deployment target），输出：

1. Architecture。k-NN-MFCC / 2D CNN / AST / BEATs / Whisper-encoder。用一句话说明原因。
2. Augmentations。SpecAugment 参数（time mask、freq mask counts）、mixup α、background noise mix level。
3. Class balance。Balanced sampler vs focal loss vs class weights。锚定到 tail-to-head ratio。
4. Loss + metric。CE / BCE / focal；primary metric（top-1 / mAP / macro-F1）和 secondary。
5. Split + eval plan。Stratified k-fold；如果是 speech，使用 speaker-disjoint；如果是 streaming data，使用 temporal split。

拒绝任何只用 top-1 accuracy 评分的 multi-label 任务；要求使用 mAP。拒绝在没有 speaker-disjoint splits 的情况下评估 speaker-conditioned 任务。标记任何在 <10k labeled clips 上从头开始的 architecture — 从 SSL-pretrained backbone 开始。
