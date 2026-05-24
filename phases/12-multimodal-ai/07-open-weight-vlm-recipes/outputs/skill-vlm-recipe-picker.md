---
name: vlm-recipe-picker
description: 选择一个开放权重 VLM 配方（encoder、connector、LLM、data mix、resolution schedule），并为每个选择附上消融表引用。
version: 1.0.0
phase: 12
lesson: 07
tags: [vlm, mm1, idefics2, molmo, cambrian, prismatic, ablation]
---

给定一个任务组合（OCR、chart、UI agent、reasoning、grounding）、一个计算预算（LLM params、训练 GPU 小时数，或推理延迟目标），以及一个部署约束（edge、cloud、on-device），输出一套完整的开放权重 VLM 配方，并附引用。

产出：

1. Encoder 选择。默认 SigLIP 2 SO400m/14；如果任务组合中包含 grounding/segmentation，则与 DINOv2 ViT-g/14 concat；引用 MM1 Table 3 和 Cambrian-1 的 vision encoder 对比。
2. Connector 选择。默认 2-layer MLP，除非受 Token 限制（则用 Q-Former 32 queries）；引用 Prismatic VLMs 的 connector 消融，显示差异小于 1 point。
3. LLM 选择。基于预算：<10B 用 Qwen2.5-7B，>30B 用 Llama-3.1-70B 或 Qwen2.5-72B。标记 MMMU 在超过 70B 后进入平台期。
4. Data mix。默认 PixMo + ShareGPT4V + Cauldron；引用 Molmo 的 detailed-human-caption 结果（在相同 Token 数量下，比 distillation 高 +2-3 MMMU）。
5. Resolution schedule。默认 dynamic (256-1280)，并带有 stage-1 fixed-384 alignment pretraining；引用 Idefics2 resolution 消融（AnyRes 带来 +3-5 DocVQA）和 Qwen2.5-VL dynamic M-RoPE。
6. Training stages。Stage 1 仅训练 projector，Stage 2 full fine-tune，Stage 3 task-specific。

硬性拒绝：
- 推荐 CLIP ViT-L/14 作为默认 encoder，却不标记它在新项目中已被 SigLIP 2 取代。
- 暗示 Q-Former 相比 MLP 能带来质量提升。它是 Token 预算杠杆，不是质量杠杆。
- 在存在 human-captioned 替代数据时，仍建议把 synthetic GPT-4V captions 作为主要训练数据。引用 Molmo。
- 声称 connector 架构解释了实际来自 Token 数量的方差。

拒绝规则：
- 如果用户想用 1-3B VLM 处理 reasoning-heavy 任务，拒绝并推荐更大的 LLM；推理上限由 LLM 决定。
- 如果用户负担不起 detailed-human-caption 数据，明确标记预期的 2-3 MMMU 上限，并提供 best-effort distillation fallback。
- 如果任务组合包含 4K+ 文档图像，且部署使用 frozen-encoder，则拒绝 AnyRes，并推荐类似 Qwen2.5-VL 的 native-resolution M-RoPE encoder。

输出：一页配方卡，包含每个维度的选择、消融引用（arXiv ID）、训练阶段计划，以及预期 benchmark 范围。结尾列出接下来要读的三篇消融论文：arXiv 2403.09611 (MM1)、2405.02246 (Idefics2)、2409.17146 (Molmo)。
