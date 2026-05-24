---
name: qwen-vl-pipeline-designer
description: 为目标视频或图像任务配置 Qwen2.5-VL 或 Qwen3-VL 部署：resolution bounds、dynamic-FPS policy、window-attention flag，以及 JSON agent output mode。
version: 1.0.0
phase: 12
lesson: 09
tags: [qwen-vl, m-rope, dynamic-fps, json-agent, video-understanding]
---

给定一个任务描述（image QA、video action recognition、UI-agent workflow、OCR-heavy document、security-camera monitoring、streaming live feed）和一个部署约束（context window、latency budget、GPU class），输出一个可运行的 Qwen2.5-VL 或 Qwen3-VL 配置。

生成：

1. Resolution bounds。为任务选择 `min_pixels` 和 `max_pixels`。Documents 和 UI：max 设高（>=1,806,336 = 1344x1344 等效）。Photos：默认。Video frames：降低以保留 frame count。
2. FPS policy。低运动使用固定 1 FPS；中等运动使用 dynamic 2-4；高运动使用 4-8。只要任务涉及 temporal grounding，就启用 absolute-time tokens。
3. Frame budget。每个视频的总 Token = duration * fps * tokens_per_frame。适配可用 context（为 prompt + output 留出 20% 余量）。
4. Window attention。对 >720p 输入启用；对低分辨率输入禁用，因为 global attention 更便宜。
5. Output mode。captioning 或 QA 使用自由文本；agent 和 grounding 任务使用 JSON tool-call；detection 使用 `<box>` tags。
6. Inference kwargs。用户传给 `process_vision_info` + model forward 的具体 dict。

硬性拒绝：
- 将 Qwen2-VL（原始版，pre-2.5）作为新项目默认方案。它缺少 dynamic FPS 和 absolute time tokens。
- 声称 M-RoPE 需要 position table。它不需要，这正是它的核心卖点。
- 对高运动视频使用固定 1 FPS，然后期待正确的 action recognition。sampler 必须自适应。

拒绝规则：
- 如果 requested FPS * duration * tokens_per_frame 超过 context window，拒绝并提出 pooling 或 frame reduction。
- 如果用户想在 >30s 视频上使用 >8 FPS，且模型 >7B、VRAM <40 GB，拒绝并建议 frame reduction 或更大的 GPU。
- 如果用户为 agent task 请求自由文本输出，拒绝并建议使用 JSON output mode，并在 prompt 中预先声明 tool schema。

输出：一页配置，包含 resolution bounds、FPS policy、frame budget、window-attention flag、output mode、inference kwargs 和 expected latency。最后附上 arXiv 2502.13923 (Qwen2.5-VL) 和 2511.21631 (Qwen3-VL)，供进一步跟进。
