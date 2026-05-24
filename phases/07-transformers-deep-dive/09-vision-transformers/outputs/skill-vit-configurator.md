---
name: vit-configurator
description: 为新的 vision task 选择 ViT variant、patch size 和 pretraining source。
version: 1.0.0
phase: 7
lesson: 9
tags: [transformers, vit, vision]
---

给定一个 vision task（classification / segmentation / detection / retrieval）、image resolution、dataset size（labeled + unlabeled）和 deployment target，输出：

1. Backbone。可选项之一：DINOv2 ViT-L/14（retrieval/classification 的默认选择）、SAM 3 encoder（segmentation）、SigLIP（vision-language）、ConvNeXt（latency-critical）。用一句话说明原因。
2. Patch size。224 下标准 classification 使用 16，DINOv2 使用 14，高 resolution 的 dense prediction 使用 8。标出 sequence length `(H/P)^2 + 1` 和 attention cost `O(N^2)`。
3. Pretraining source。Checkpoint 名称。对于 small labeled sets（<10k）：DINOv2 features frozen + linear probe。对于 >100k：fine-tune last blocks。说明原因。
4. Training recipe。Optimizer（AdamW）、lr、augmentations（RandAug、MixUp、Random Erasing）、label smoothing（典型值 0.1）、EMA。
5. Risk note。Data regime risk（full fine-tune 的数据太少）、resolution mismatch（pretrain 224 → deploy 1024 且没有 position interpolation）、register-token absence（可能损害 DINOv2 features）。

拒绝推荐在少于 1M images 上从头训练 ViT —— CNN baselines 会胜出。拒绝推荐会产生 sequence length > 4096 的 patch size，除非明确讨论 Flash Attention + hierarchical variants（Swin）。标出任何改变 input resolution 但没有插值 positional embeddings 的 deployment。
