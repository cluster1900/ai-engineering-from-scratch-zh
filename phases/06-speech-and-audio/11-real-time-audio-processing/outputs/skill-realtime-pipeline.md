---
name: realtime-voice-pipeline
description: 为目标端到端 latency 选择 transport、VAD、streaming STT、LLM、streaming TTS 和 orchestration。
version: 1.0.0
phase: 6
lesson: 11
tags: [voice-agent, livekit, pipecat, silero, streaming, latency]
---

给定目标（latency P50/P95、language、channel、offline vs cloud、call volume），输出：

1. Transport。WebRTC (LiveKit / Daily) · WebSocket · SIP trunking (Twilio / Telnyx)。理由要绑定 jitter tolerance + use case。
2. VAD + turn-taking。Silero VAD（open，99.5% TPR）· Cobra（commercial）· LiveKit turn-detector。Threshold、min speech duration、silence hang-over。
3. Streaming STT。Parakeet TDT（最快 open 方案）· Kyutai STT（with flush trick）· Deepgram Nova-3（API，~150 ms）· Whisper-streaming。说明理由。
4. LLM + streaming。在 TTS 启动前 pin 住前 20 个 Token。Model + streaming config + prompt injection guardrails。
5. Streaming TTS。Kokoro-82M（~100 ms TTFA）· Orpheus · Cartesia Sonic · ElevenLabs Turbo。Voice-pack 或 cloning guard（Lesson 8）。
6. Orchestration。LiveKit Agents · Pipecat · Vapi · Retell · custom Rust。理由要绑定 team skills + scale。
7. Observability。每个阶段的 P50/P95/P99 histogram；false-positive interruption rate；drop-call rate；call sample 上的 WER。

拒绝在 STT 前 buffer 整段 utterance 的 deploy。拒绝不支持 stream 的 TTS。拒绝用 average latency 做 evaluation — 要求 P95。对于 &gt; 100k minutes/month 的场景，如果没有与 build-your-own 的 cost-comparison，拒绝 managed platform（Vapi / Retell）。

示例输入: "用于汽车保险报价的 voice agent。&lt; 500 ms P95。英语，美国。50k 分钟/周。合规：接近 HIPAA（日志中无 PII）。"

Example output:
- Transport: LiveKit Agents + Twilio SIP。已在 call-center scale 得到验证，HIPAA-mode 可 opt-in。
- VAD: Silero VAD @ threshold 0.45，min speech 220 ms，silence hang-over 400 ms。叠加 LiveKit turn-detector。
- STT: Deepgram Nova-3 English（~150 ms P95）；如果需要 on-prem audit，则 fallback 到 Parakeet-TDT。
- LLM: GPT-4o streaming via OpenAI realtime API；用 post-filter 防御 prompt injection；将前 20 个 Token pin 到 TTS。
- TTS: Cartesia Sonic 2（~150 ms TTFA，未使用 voice cloning — 使用 predefined voice）。
- Orchestration: LiveKit Agents。生产环境 Observability 通过 Hamming AI。
- Logs: 在 persistence 前，用 regex + NER pass 去除 CVV / SSN / DOB。保留 30 天。
