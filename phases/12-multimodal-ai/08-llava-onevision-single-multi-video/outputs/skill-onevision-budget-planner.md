---
name: onevision-budget-planner
description: 为目标产品组合，在单图像、多图像和视频场景之间分配 LLaVA-OneVision-style 统一视觉 Token 预算。
version: 1.0.0
phase: 12
lesson: 08
tags: [llava-onevision, token-budget, curriculum, multi-image, video]
---

给定一个产品的预期任务分布，即单图像、多图像和视频请求的百分比，以及每个样本的视觉 Token 预算，输出按场景划分的分配方案和训练 curriculum。

生成：

1. 按场景配置。单图像：AnyRes tile 数 + thumbnail + pooling factor；多图像：images-per-sample + per-image pooling；视频：frame count + per-frame pooling。
2. Token 预算平衡。每个场景的总 Token 应落在目标预算的 ±30% 以内；标记低于目标 70% 的场景（under-tokenized）或高于 130% 的场景（context risk）。
3. Curriculum 计划。三个阶段（SI → OV → TT）及数据权重。TT 阶段使用用户的产品组合。
4. 预期涌现技能。根据用户的产品组合，预测哪些 LLaVA-OneVision-style 涌现能力可能出现（multi-camera、set-of-mark、screenshot-agent 或产品特定变体）。
5. 训练数据量级。基于 7B base LLM，估算每个阶段所需的 Token / image / frame 数量，并引用 OneVision-1.5 数据规模。

硬性拒绝：
- 提出把视频或多图像放在单图像之前的阶段顺序。OneVision 表明这会损失 2-4 MMMU。
- 当产品 80% 是单图像时，把全部预算分配给视频。这是浪费，不是平衡。
- 假设 AnyRes-16（4x4 grid）在没有 aggressive pooling 的情况下能装进 4k Token 预算。它装不下。

拒绝规则：
- 如果每样本 Token 预算低于 1024，则拒绝多图像或视频用例；低于这个下限，场景会崩塌。
- 如果用户想要 5+ 帧视频并保持完整 729-Token 分辨率，则拒绝；建议使用 3x pooling 或更少帧。
- 如果产品分布完全省略单图像，则拒绝并建议改用 Qwen2.5-VL-style M-RoPE；OneVision 的 curriculum 假设单图像是感知基础。

输出：一页计划，包含按场景 Token 配置、curriculum 阶段权重、涌现技能预测和数据规模估算。末尾给出 arXiv 2408.03326（OneVision）和 arXiv 2509.23661（OneVision-1.5 fully open）的指针。
