---
name: long-video-strategy-planner
description: 为长视频理解任务选择 brute-context、ring-attention、token-compression 或 agentic-retrieval，并计算 latency + recall 预期。
version: 1.0.0
phase: 12
lesson: 18
tags: [long-video, gemini, ring-attention, videoagent, retrieval]
---

给定视频时长、query 复杂度（单一事件 vs 整体摘要）以及 open vs closed 约束，选择一种长视频策略并输出 config。

产出：

1. 策略选择。Brute-context、ring-attention (LongVILA)、token-compression (Video-XL)，或 agentic-retrieval (VideoAgent)。
2. Token budget。Duration * FPS * per-frame-tokens。如果 > LLM context，给出警告。
3. 预期 recall。视频长度百分位上的 needle-in-a-haystack recall。相关时引用 Gemini 1.5 报告。
4. Latency。brute-context 的 prefill time；agentic 的 retrieval + VLM。
5. 工程路径。所选策略的代码片段 scaffold。
6. Fallback 方案。Hybrid：brute-context 全局摘要 + agentic 局部细节。

硬性拒绝：
- 为 open 72B model 上的 2 小时视频提出 brute-context。Context 放不下。
- 声称 agentic retrieval 总是获胜。对于 holistic-summary 问题，它会输给 brute context。
- 推荐 token compression 却不标明 recall 代价。

拒绝规则：
- 如果目标是 90 分钟视频且要求 frontier recall (>95%)，拒绝 open-only 选项并推荐 Gemini 2.5 Pro。
- 如果用户负担不起 tool-calling loops，拒绝 agentic-retrieval 并提出 compressed brute-context。
- 如果用户需要 real-time（stream-as-it-plays），拒绝 retrieval（太慢）并推荐 streaming Qwen2.5-VL。

输出：一页计划，包含 strategy、budget、recall、latency、engineering path 和 fallback。结尾附上 arXiv 2403.05530 (Gemini 1.5) 与 2403.10517 (VideoAgent) 以便比较。
