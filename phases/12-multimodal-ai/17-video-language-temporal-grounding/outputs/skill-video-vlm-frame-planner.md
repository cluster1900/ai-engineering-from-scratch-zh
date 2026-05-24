---
name: video-vlm-frame-planner
description: 为 video-language model 部署规划帧采样、逐帧 pooling、输出格式和 benchmark 目标。
version: 1.0.0
phase: 12
lesson: 17
tags: [video-vlm, temporal-grounding, tmrope, dynamic-fps, benchmarks]
---

给定一个视频任务（动作识别、temporal grounding、摘要、监控、agent-workflow replay）和部署约束（模型 context、延迟预算、吞吐量），输出一个帧采样和输出计划。

生成：

1. 帧采样器选择。稳定内容用 uniform，混合运动用 dynamic-FPS，动作密集用 event-driven，电影化内容用 keyframe+context。
2. 逐帧 pooling。高细节用 2x2，默认用 3x3；对于内容密度不如覆盖范围重要的 agent workflows，用 4x4 或 6x6。
3. 时间编码。Qwen2.5-VL-family 用 TMRoPE；较小模型用 learned temporal embedding；single-clip 任务不使用编码。
4. 输出格式。grounding 用包含 `{event, start, end, confidence}` 的 JSON；摘要用自由文本；混合流程用 token-delimited。
5. Benchmark 计划。通用用 VideoMME，grounding 用 TempCompass，长时程用 EgoSchema。指定预期准确率层级。
6. Context / 延迟预算。Total tokens = duration * fps * tokens_per_frame。如果超过 context 的 40%，给出警告。

硬性拒绝：
- 为动作密集视频提出 uniform sampling。会丢失峰值事件。
- 声称 token-delimited 输出在下游解析中能匹配 JSON 准确率。JSON 更稳健。
- 为任何 2026 年开始的项目推荐 Video-LLaMA。较旧架构已不再有竞争力。

拒绝规则：
- 如果 duration > 10 minutes 且 context < 32k，拒绝并推荐 hierarchical summarization 或 agentic retrieval（Lesson 12.18）。
- 如果目标准确率是 frontier（在 VideoMME 上距离 Gemini 2.5 Pro 2 分以内），拒绝开放 7B 模型，并要求 32B+ 或 proprietary。
- 如果 dynamic-FPS 目标在 7B、> 30s clip 上 > 8，从延迟角度拒绝，并建议更低上限。

输出：一页帧计划，包含 sampler、pooling、temporal encoding、output format、benchmark targets、context estimate。结尾附 arXiv 2502.13923（Qwen2.5-VL）和 2306.02858（Video-LLaMA）作为对比阅读。
