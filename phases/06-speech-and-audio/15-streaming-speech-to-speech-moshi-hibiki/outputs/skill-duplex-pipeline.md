---
name: duplex-pipeline
description: 为语音 agent workload 选择 full-duplex (Moshi) 或 pipeline (VAD + STT + LLM + TTS) 架构。
version: 1.0.0
phase: 6
lesson: 15
tags: [moshi, hibiki, full-duplex, voice-agent, streaming]
---

给定 workload（latency target、tool-calling needs、language coverage、hardware budget、cloud vs edge），输出：

1. Architecture。Full-duplex (Moshi / GPT-4o Realtime / Gemini Live) vs pipeline (LiveKit + STT + LLM + TTS, Lesson 12)。一句话说明理由。
2. Model。Moshi · Hibiki · Hibiki-Zero · Sesame CSM · GPT-4o Realtime · Gemini 2.5 Live · traditional pipeline。说明理由。
3. Scale。每个 session 的 GPU cost（Moshi 会占住一个 slot）、最大并发 session、cold-start impact。
4. Tool-calling path。如有需要，使用 hybrid pipeline（duplex + external LLM for tool calls）或 pure pipeline。解释 trade-off。
5. Language coverage。Full-duplex model 的语言支持范围较窄；pipeline 继承 LLM 的 Multilingual 能力。

对于需要 tool-calling / retrieval 的企业 agent，拒绝 full-duplex-only 架构，因为 Moshi 是 dialogue model，不是 agent framework。对于低于 250 ms 的 conversational agent，拒绝 pipeline-only，因为各个阶段会累加延迟。对于单张 GPU 上超过 4 个并发 session 的场景，拒绝 Moshi，因为会遇到 contention。

示例输入: "用于语言学习的 voice companion — 会话流利度练习。英语 + 法语。&lt; 250 ms 响应速度。10k 日活。"

示例输出:
- Architecture: full-duplex (Moshi)。低于 250 ms 的 latency requirement + conversational fluency 很适合 Moshi 的强项。
- Model: Moshi。EN + FR 都有良好支持。CC-BY 4.0 license。
- 规模: 每 4-6 个并发会话使用一块 L4 GPU → 10k DAU、10% 并发时峰值约 1500 块 GPU。为安静路径规划端侧轻量模式，使用 Kyutai Pocket TTS + local Whisper。
- Tool calling: 极少 — "reveal grammar hint" 和 "translate this phrase" 可以路由到一个 tiny LLM sidecar；大部分交互是 open-ended dialogue，正是 Moshi 擅长的场景。
- Language coverage: EN + FR (native)；ES / DE / JP 通过 Hibiki-Zero adaptation 支持（每种新语言需要 1000 h audio）。
