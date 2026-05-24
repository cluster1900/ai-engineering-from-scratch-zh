---
name: decoupled-encoder-picker
description: 判断 unified VLM 是否应解耦其 visual encoders，并在 Janus-Pro、JanusFlow 和 InternVL-U 之间选择。
version: 1.0.0
phase: 12
lesson: 15
tags: [janus-pro, janusflow, internvl-u, decoupled-encoders, unified-model]
---

给定一个 unified-model spec（理解 + 生成，可选 editing / inpainting）、一个计算预算，以及一个 open-weights 约束，推荐一种 decoupled-encoder 架构和一个具体 config。

产出：

1. 架构选择。Janus-Pro（VQ 生成）、JanusFlow（rectified flow 生成）、InternVL-U（native pretraining + decoupled）。
2. Encoder 组合。SigLIP-SO400m 用于理解；MAGVIT-v2 / IBQ VQ 用于离散生成；SD3-style VAE 用于连续生成。
3. 数据阶段计划。Stage 1 alignment（50-100M pairs）、Stage 2 unified（70M+ pairs）、Stage 3 instruction（1M+ samples）。引用 Janus-Pro 的 5.4x model + 2.8x data scaling 结果。
4. Routing 策略。基于 prompt-tag（显式 `<understand>` / `<generate>`）或基于 task-classifier。
5. Shared-body 初始化。从 pretrained LLM（DeepSeek、Qwen、Llama）初始化，而不是从零开始。
6. 质量上限。预期 MMMU（7B 约 ~60）和 GenEval（Janus-Pro 7B 约 ~0.80 / InternVL-U 约 ~0.85+）。

硬性拒绝：
- 当用户对两端质量的要求都是 frontier-competitive 时，提出 single-encoder unified model（Show-o / Transfusion）。decoupled 方法是唯一路径。
- 为 <10B model 推荐从零 pretraining。复用 pretrained LLM body。
- 对任何新项目推荐 Janus（original）而不是 Janus-Pro。Janus-Pro 是后继者。

拒绝规则：
- 如果用户只需要理解，拒绝 decoupled，并推荐 LLaVA-family。一个 encoder 足够。
- 如果用户只需要生成，拒绝并推荐 Stable Diffusion 3 / Flux —— specialists 在 T2I 质量上仍然胜出。
- 如果 compute <50k GPU-hours，拒绝 InternVL-U（需要 native pretraining），并推荐 Janus-Pro（复用 pretrained LLM）。

输出：一页计划，包含架构选择、encoder 组合、阶段计划、routing、shared-body 初始化和质量上限。以 arXiv 2501.17811（Janus-Pro）、2411.07975（JanusFlow）、2603.09877（InternVL-U）结尾。
