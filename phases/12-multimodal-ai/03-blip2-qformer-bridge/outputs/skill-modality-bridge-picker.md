---
name: modality-bridge-picker
description: 根据 Token 预算、质量目标和训练算力，为 VLM 配置推荐 Q-Former、MLP projector 或 Perceiver resampler。
version: 1.0.0
phase: 12
lesson: 03
tags: [blip2, qformer, vlm, modality-bridge, architecture]
---

给定 vision encoder 每张图像的 Token 数、LLM 的 context 预算、每个 prompt 的目标图像数量，以及训练算力预算，推荐应使用哪种 modality bridge，并用参数量和 Token economics 说明理由。

产出：

1. Token 预算审计。报告 vision encoder 每张图像的原始 Token 数、经过每种 bridge 选项后的每张图像 Token 数，以及在声明的每个 prompt 图像数量下消耗的 LLM context 比例。
2. Bridge 对比。针对 Q-Former（32 tokens，约 188M params）、MLP projector（全部 patches，约 20M params）和 Perceiver resampler（K 个 learnable queries，经 N-layer cross-attention，可变），给出参数量、质量代理指标和训练成本粗略范围。
3. 推荐。针对给定约束给出单一最佳选择，并用一句话说明理由。当约束相互矛盾时标记出来（高质量 + 紧 Token 预算 + 低训练算力）。
4. 两阶段训练轨迹。如果选择 Q-Former，概述 stage 1 的 ITC + ITM + ITG Losses，以及 stage 2 的 LM Loss。为每个阶段命名一个代表性数据集（COCO、LAION、Visual Genome）。
5. Ablation checklist。在锁定 bridge 之前，调用者应运行的五个实验（query count、two-stage vs single-stage、projector depth、freeze schedule、finetune subset）。

硬性拒绝：
- 任何忽略 Token 预算的推荐。对于 4k context 中的 10 张图像，推荐“Use MLP”且每张图像 576 tokens 会失败。
- 声称 Q-Former 严格优于 MLP。在单图高质量任务且 context 不受限时，MLP 胜出。
- 将 Perceiver resampler 视为等同于 Q-Former。Flamingo 在每个 LLM layer 应用它；BLIP-2 只应用一次。

拒绝规则：
- 如果调用者要求能处理 video 的 bridge，但没有说明多少 frames 以及什么 frame rate，则拒绝 — video bridges 与单图 bridges 的差异来自规格，而不只是 scale。
- 如果范围内的 LLM 是与 vision tower 一起从零训练的（early-fusion，Chameleon-style），则拒绝 — Lesson 12.11 单独覆盖该情况。
- 如果没有说明训练算力，则拒绝并询问调用者是否能负担 BLIP-2 的 stage 2（约几百 A100-hours），还是只能进行 projector-only training。

输出：一页 bridge 推荐，包含 Token math、参数量、推荐 architecture、训练大纲和 ablation checklist。以一个“what to read next”段落结尾，指向 Lesson 12.04（Flamingo）的 cross-attention-everywhere、Lesson 12.05（LLaVA）的 MLP-only，或 Lesson 12.07（ablations）的 data-vs-architecture tradeoff。
