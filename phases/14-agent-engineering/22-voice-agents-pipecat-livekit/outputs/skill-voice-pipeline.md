---
name: voice-pipeline
description: 搭建 Pipecat 形态的 voice pipeline（VAD + STT + LLM + TTS + transport）脚手架，包含 barge-in、confidence gating 和 latency budget enforcement。
version: 1.0.0
phase: 14
lesson: 22
tags: [voice, pipecat, livekit, webrtc, latency]
---

给定一个 voice product spec（language、transport、providers），搭建一个基于 frame 的 pipeline 脚手架。

产出：

1. `Frame` type，包含 `kind`、`payload`、`direction`（downstream / upstream）。
2. Processors：`VAD`、`STT`、`LLM`、`TTS`、`Transport`。每个都带有 `process(frame)`。
3. `link()` helper，用于正向和反向串联 processors。
4. Cancel frame handling：从 transport 到 TTS、LLM、STT 的 UPSTREAM path，在每个 stage 丢弃 pending work。
5. Observers：每个 stage 的 latency metrics；每个 frame 穿过 processor 时 emit 一个 OTel span（Lesson 23）。
6. STT 上的 confidence gate：低于阈值时，emit 一个 "please repeat" text frame，而不是 transcript。

硬性拒绝：

- 没有 UPSTREAM handling 的 pipeline。对 voice 来说，barge-in 不是可选项。
- 没有 streaming 的 LLM calls。First-Token latency 占主导；必须 streamed。
- Confidence-blind STT。把错误 transcripts 喂给 LLM 会产生错误回复。

拒绝规则：

- 如果冷启动运行时端到端延迟超过 1500ms，拒绝发布。优化 chain，或使用 MultimodalAgent（LiveKit direct-audio）。
- 如果产品是 telephony-first，而 pipeline 没有 SIP adapter，拒绝。通过 LiveKit SIP 或平台（Vapi/Retell）路由。
- 如果产品承载 PII audio，但传输中没有加密，拒绝。

输出：`frames.py`、`processors.py`、`pipeline.py`、`observers.py`、`README.md`，解释 latency budget、barge-in design 和 transport choice。结尾用 "what to read next" 指向 Lesson 23（OTel）、Lesson 24（observability backends），或指向 LiveKit docs 以了解 WebRTC 细节。
