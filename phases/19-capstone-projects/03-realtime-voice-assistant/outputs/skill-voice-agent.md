---
name: voice-agent
description: 构建一个具备低于 800ms first-audio-out、barge-in 处理和对话中途 tool use 的实时语音 agent。
version: 1.0.0
phase: 19
lesson: 03
tags: [capstone, voice, webrtc, livekit, pipecat, asr, tts, streaming]
---

给定一个 domain（customer support、scheduling、retail assistant），部署一个 WebRTC 语音 agent，在处理 barge-in、tool calls 和 packet loss 的同时，将端到端 first-audio-out 保持在 800ms 以下。

构建计划：

1. 启动一个 LiveKit Agents 1.0 room 和一个 streaming microphone audio 的 web client。添加 Twilio PSTN gateway 以覆盖电话场景。
2. 运行 streaming ASR（托管 Deepgram Nova-3，或在 g5.xlarge 上运行 faster-whisper Whisper-v3-turbo）。订阅 partial 和 final transcripts。
3. 在 20ms frames 上运行 Silero VAD v5。在 speech-end 时，用 LiveKit turn-detector 为最新 partial 打分；只有当 VAD silence >= 500ms 且 completion score >= 0.6 时，才提交为 turn-complete。
4. Stream LLM（GPT-4o-realtime、Gemini 2.5 Flash Live，或级联 Claude Haiku 4.5）。在 200ms 内将第一个 Token 交给 TTS。
5. Stream TTS（Cartesia Sonic-2 或 ElevenLabs Flash v3）。第一个 audio chunk 必须在第一个 LLM Token 后 200ms 内离开 server。
6. Barge-in：当 VAD 在 SPEAKING 或 THINKING 期间检测到新的用户语音时，取消 TTS，丢弃剩余 LLM output，重新启动 ASR。发布一个 `tts_canceled` span。
7. Tool side-channel：并发运行 function calls；如果延迟 > 300ms，发出 acknowledgment filler，确保 audio stream 永不停顿。
8. 录制 100 次通话。基于 held-out transcripts 测量 WER，在 Hamming VAD benchmark 上测量误截断率，测量 first-audio-out p50、NISQA MOS，以及 3% packet drop 下的行为。
9. 用 synthetic caller 在单台 g5.xlarge 上对 50 路并发通话进行 load-test；报告持续 first-audio-out p95。

评估 rubric：

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | 端到端延迟 | 100 次已录制通话中的 p50 first-audio-out 低于 800ms |
| 20 | Turn-taking 质量 | Hamming VAD benchmark 上误截断率低于 3% |
| 20 | Tool-use 正确性 | 对话中途 tool calls 返回正确数据且不让音频停顿 |
| 20 | packet loss 下的可靠性 | 注入 3% packet drop 时的 WER 和 turn-taking 稳定性 |
| 15 | Eval harness 完整性 | 带 public config 的可复现实验测量 |

硬性拒收：

- Non-streaming pipelines（batch ASR、batch TTS）无法达到延迟目标。
- 任何不立即取消 TTS buffer 的 barge-in 策略。延迟取消会产生最糟糕的用户体验回归。
- 同步阻塞 LLM stream 的 tool calls。它们必须在 side channel 上运行。

拒绝规则：

- 没有 VAD 或 turn-detector 时，拒绝部署。固定超时的 turn-taking 会产生不可接受的截断率。
- 未说明 MOS 是 human-rated 还是 NISQA-proxied 时，拒绝报告 MOS。
- 没有至少 100 次已录制通话并发布 call traces 时，拒绝报告 "p50 latency under X"。

输出：一个 repo，包含 LiveKit agent worker、PSTN gateway config、100-call eval harness、public Langfuse voice dashboard、与一个托管竞品（Retell、Vapi 或直接使用 OpenAI Realtime API）的并排对比，以及一篇说明你观察到的三大 turn-taking 失败和修复每个失败所用 detector tuning 的 write-up。
