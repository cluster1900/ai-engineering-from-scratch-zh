# Capstone 03 — 实时语音 Assistant（ASR 到 LLM 到 TTS）

> 一个感觉自然的语音 agent 需要端到端延迟低于 800ms，知道你何时停止说话，能处理 barge-in，并且能在不中断的情况下调用工具。Retell、Vapi、LiveKit Agents 和 Pipecat 在 2026 年都达到了这个标准。它们采用相同的形态：streaming ASR、turn-detector、streaming LLM 和 streaming TTS，全部通过 WebRTC 连接，并在每一跳都设置激进的延迟预算。构建一个，测量 WER、MOS 和误截断率，并在 packet loss 下运行它。

**Type:** Capstone
**Languages:** Python（agent + pipeline）、TypeScript（web client）
**Prerequisites:** Phase 6（speech and audio）、Phase 7（transformers）、Phase 11（LLM engineering）、Phase 13（tools）、Phase 14（agents）、Phase 17（infrastructure）
**Phases exercised:** P6 · P7 · P11 · P13 · P14 · P17
**Time:** 30 小时

## 问题

语音一直是 2025-2026 年发展最快的 AI UX 类别。技术上限每个季度都在下降。OpenAI Realtime API、Gemini 2.5 Live、Cartesia Sonic-2、ElevenLabs Flash v3、LiveKit Agents 1.0 和 Pipecat 0.0.70 都让低于 800ms 的 first-audio-out 变得可实现。标准不只是延迟。它是交互感：不打断用户，不被用户打断，能从句子中途的打断中恢复，在对话中途调用工具而不让音频停顿，并能承受抖动的移动网络。

你无法通过拼接三个 REST 调用做到这一点。架构必须是端到端 pipelined streaming。构建它之后，失败模式会变得可见：为电话音频调优的 VAD 被背景电视触发，turn-detector 等待永远不会出现的标点，TTS 在输出前缓冲 400ms。这个 Capstone 的目标是在负载下逐个修复这些问题，并发布一份延迟与质量报告。

## 概念

pipeline 有五个 streaming 阶段：**audio in**（来自 browser 或 PSTN 的 WebRTC）、**ASR**（来自 Deepgram Nova-3 或 faster-whisper 的 streaming partial transcripts）、**turn detection**（VAD 加上读取 partial transcripts 以判断完成线索的小型 turn-detector model）、**LLM**（一旦判断 turn 完成就开始 streaming tokens）、**TTS**（在第一个 LLM Token 后约 200ms 内开始 streaming audio out）。

三个横切关注点。**Barge-in**：当用户在 agent 说话时开始说话，TTS 会取消，ASR 立即接管。**Tool use**：对话中途的 function calls（weather、calendar）必须在 side channel 上运行，不能让音频停顿；如果延迟超过 300ms，agent 会预先填充一个 acknowledgement Token（"one second..."）。**Backpressure**：在 packet loss 下，partial transcripts 会被保留，VAD 提高 speech-gate 阈值，agent 避免在未确认消息上方继续说话。

测量标准是定量的。在 15 dB SNR 的 Hamming VAD benchmark 上 WER 低于 8%。100 次已测量通话的 first-audio-out p50 低于 800ms。误截断率低于 3%。TTS 的 MOS 高于 4.2。单台 g5.xlarge 支持 50 路并发通话。这些数字就是交付物。

## 架构

```
browser / Twilio PSTN
        |
        v
   WebRTC / SIP edge
        |
        v
  LiveKit Agents 1.0  (or Pipecat 0.0.70)
        |
   +----+--------------+--------------+-----------------+
   |                   |              |                 |
   v                   v              v                 v
  ASR              VAD v5         turn-detector     side-channel
(Deepgram         (Silero)          (LiveKit)        tools
 Nova-3 /         speech-gate    completion score    (weather,
 Whisper-v3)      per 20ms        on partials        calendar)
   |                   |              |
   +--------+----------+--------------+
            v
        LLM (streaming)
     GPT-4o-realtime / Gemini 2.5 Flash /
     cascaded Claude Haiku 4.5
            |
            v
        TTS streaming
     Cartesia Sonic-2 / ElevenLabs Flash v3
            |
            v
     audio back to caller
            |
            v
   OpenTelemetry voice traces -> Langfuse
```

## 技术栈

- Transport：LiveKit Agents 1.0（WebRTC）加 Twilio PSTN gateway；Pipecat 0.0.70 作为备用 framework
- ASR：Deepgram Nova-3（streaming，低于 300ms 的 first partial）或自托管的 faster-whisper Whisper-v3-turbo
- VAD：Silero VAD v5 加 LiveKit turn-detector（读取 partial transcripts 的小型 transformer）
- LLM：用于紧密集成的 OpenAI GPT-4o-realtime、Gemini 2.5 Flash Live，或级联 Claude Haiku 4.5（streaming completions，独立 audio path）
- TTS：Cartesia Sonic-2（最低 first-byte）、ElevenLabs Flash v3，或用于自托管的开源 Orpheus
- Tools：用于 weather/calendar/booking 的 FastMCP side-channel；如果 tool 耗时 >300ms，agent 预先发出 filler
- Observability：OpenTelemetry voice spans、带 audio replay 的 Langfuse voice traces
- Deployment：单台 g5.xlarge（24GB VRAM）用于自托管 Whisper + Orpheus；托管 APIs 用于最低延迟

```figure
ce-voice-latency
```

## 构建它

1. **WebRTC session。** 启动一个 LiveKit room 和一个 streaming microphone audio 的 web client。在 server 上，附加一个加入 room 的 agent worker。

2. **ASR streaming。** 将 20ms PCM frames 送入 Deepgram Nova-3（或 GPU 上的 faster-whisper）。订阅 partial 和 final transcripts。记录每个 partial 的延迟。

3. **VAD and turn detector。** 在 frame stream 上运行 Silero VAD v5。在 speech-end event 上，用最新的 partial transcript 触发 LiveKit turn-detector。只有当 VAD 表示静默 500ms 且 turn-detector 的 completion 分数 > 0.6 时，才提交为 "turn complete"。

4. **LLM stream。** 在 turn complete 后，用正在进行的 conversation 加 final transcript 启动 LLM call。stream tokens。第一个 Token 出现时，交给 TTS。

5. **TTS stream。** Cartesia Sonic-2 将 audio chunks stream 回来。第一个 chunk 必须在第一个 LLM Token 后 200ms 内离开 server。将 chunks 发到 LiveKit room；client 通过 WebRTC jitter buffer 播放。

6. **Barge-in。** 当 VAD 在 TTS 播放期间检测到新的用户语音时，立即取消 TTS stream，丢弃剩余 LLM output，并重新启动 ASR。发布一个 `tts_canceled` span。

7. **Tool side channel。** 将 weather 和 calendar 注册为 function-calling tools。调用时并发发起 call；如果 300ms 内未返回，让 LLM 发出 "one second, let me check" 作为 filler；tool 返回后继续。

8. **Eval harness。** 录制 100 次通话。计算 WER（对照 held-out transcript）、误截断率（用户句子中途时 TTS 被取消）、first-audio-out p50、TTS MOS（human 或 NISQA），以及 jitter-loss test（丢弃 3% 的 packets）。

9. **Load test。** 用 synthetic caller 在单台 g5.xlarge 上驱动 50 路并发通话。测量持续 first-audio-out p95。

## 使用它

```
caller: "what is the weather in tokyo tomorrow"
[asr  ] partial @280ms: "what is the"
[asr  ] partial @540ms: "what is the weather"
[turn ] completion score 0.82 at @820ms; commit
[llm  ] first token @960ms
[tool ] weather.tokyo tomorrow -> 68/52 partly cloudy @1140ms
[tts  ] first audio-out @1040ms: "Tokyo tomorrow will be partly cloudy..."
turn latency: 1040ms user-stop -> audio-out
```

## 交付它

`outputs/skill-voice-agent.md` 是交付物。给定一个 domain（customer support、scheduling 或 kiosk），它会启动一个 LiveKit agent，并将 ASR/VAD/LLM/TTS pipeline 调优到测量标准。Rubric：

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 端到端延迟 | 100 次已录制通话中的 p50 first-audio-out 低于 800ms |
| 20 | Turn-taking 质量 | Hamming VAD benchmark 上误截断率低于 3% |
| 20 | Tool-use 正确性 | 对话中途 tool calls 返回正确数据且不让音频停顿 |
| 20 | packet loss 下的可靠性 | 注入 3% packet drop 时的 WER 和 turn-taking 稳定性 |
| 15 | Eval harness 完整性 | 带 public config 的可复现实验测量 |
| **100** | | |

## 练习

1. 将 Deepgram Nova-3 替换为 g5.xlarge 上的 faster-whisper v3 turbo。测量延迟和 WER 差距。识别 CPU-vs-GPU 决策在哪些位置重要。

2. 添加 interruption-arbitration 策略：当用户在 tool call 期间 barge in 时，agent 怎么做？比较三种策略（hard cancel、finish-tool-then-stop、queue next turn）。

3. 运行 adversarial turn-detector test：让用户在句子中途长时间停顿。调优 VAD silence threshold 和 turn-detector score threshold，在不超过 900ms 的前提下实现最低误截断。

4. 通过 Twilio 将同一个 agent 部署到 PSTN。比较 PSTN first-audio-out 与 WebRTC。解释 jitter-buffer 和 codec 差异。

5. 为非英语语言（Japanese、Spanish）添加 voice activity detection。测量 Silero VAD v5 的 false-trigger rate，并与 language-specific fine-tunes 比较。

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Turn detection | "End of utterance" | 给定 VAD silence 和 partial transcript，判断用户已经说完的 classifier |
| Barge-in | "Interruption handling" | 当 VAD 检测到新的用户语音时，取消正在播放的 TTS |
| First-audio-out | "Latency" | 从用户停止说话到第一个 audio packet 离开 server 的时间 |
| VAD | "Speech gate" | 将 audio frames 分类为 speech 或 silence 的 model；Silero VAD v5 是 2026 年默认选择 |
| Jitter buffer | "Audio smoothing" | client-side buffer，会短暂保留 packets 以吸收网络波动 |
| Filler | "Acknowledgment token" | tool 较慢时 agent 发出的短语，用于避免沉默 |
| MOS | "Mean opinion score" | 感知语音质量评分；NISQA 是自动化代理指标 |

## 延伸阅读

- [LiveKit Agents 1.0](https://github.com/livekit/agents) — 参考 WebRTC agent framework
- [Pipecat](https://github.com/pipecat-ai/pipecat) — 备用的 Python-first streaming agent framework
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) — 集成 speech models 的参考
- [Deepgram Nova-3 documentation](https://developers.deepgram.com/docs) — streaming ASR 参考
- [Silero VAD v5](https://github.com/snakers4/silero-vad) — VAD reference model
- [Cartesia Sonic-2](https://docs.cartesia.ai) — 低延迟 TTS 参考
- [Retell AI architecture](https://docs.retellai.com) — 生产级语音 agent 架构
- [Vapi.ai production stack](https://docs.vapi.ai) — 备用生产级参考
