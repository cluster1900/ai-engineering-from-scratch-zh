# Voice Agents：Pipecat 和 LiveKit

> Voice agents 是 2026 年的一类一等生产级类别。Pipecat 提供基于 Python frame 的 pipeline（VAD → STT → LLM → TTS → transport）。LiveKit Agents 通过 WebRTC 将 AI models 连接到用户。高级技术栈的生产延迟目标会落在端到端 450–600ms。

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~60 minutes

## 学习目标
- 描述 Pipecat 基于 frame 的 pipeline：DOWNSTREAM（source→sink）和 UPSTREAM（control）。
- 说出标准 voice pipeline stages，以及 Pipecat 支持哪些 transports。
- 解释 LiveKit Agents 的两个 voice agent classes（MultimodalAgent、VoicePipelineAgent）以及各自适用的场景。
- 总结 2026 年生产环境的延迟预期，以及这些预期如何驱动架构选择。

## 问题
Voice agents 不是一个外挂了 TTS 的 text loop。延迟预算非常严苛（~600ms），partial audio 是默认情况，turn detection 本身就是一个 model，而 transports 覆盖从 telephony SIP 到 WebRTC 的范围。你要么构建一个基于 frame 的 pipeline（Pipecat），要么依赖一个平台（LiveKit）。

## 概念
### Pipecat (pipecat-ai/pipecat)

- 基于 Python frame 的 pipeline framework。
- `Frame` → `FrameProcessor` chain。
- 两个 flow directions：
  - **DOWNSTREAM** — source → sink（audio in，TTS out）。
  - **UPSTREAM** — feedback 和 control（cancellation、metrics、barge-in）。
- `PipelineTask` 通过 events（`on_pipeline_started`、`on_pipeline_finished`、`on_idle_timeout`）以及用于 metrics/tracing/RTVI 的 observers 管理 lifecycle。

典型 pipeline：

```
VAD (Silero) → STT → LLM (context alternates user/assistant) → TTS → transport
```

Transports：Daily、LiveKit、SmallWebRTCTransport、FastAPI WebSocket、WhatsApp。

Pipecat Flows 增加 structured conversations（state machines）。Pipecat Cloud 是 managed runtime。

### LiveKit Agents (livekit/agents)

- 通过 WebRTC 将 AI models 连接到用户。
- 核心概念：`Agent`、`AgentSession`、`entrypoint`、`AgentServer`。
- 两个 voice agent classes：
  - **MultimodalAgent** — 通过 OpenAI Realtime 或等价方案直接处理 audio。
  - **VoicePipelineAgent** — STT → LLM → TTS cascade；提供 text-level control。
- 通过 Transformer model 实现 semantic turn detection。
- 原生 MCP 集成。
- 通过 SIP 支持 telephony。
- 通过 LiveKit Inference 提供 50+ models，无需 API keys；通过 plugins 还可接入 200+ 更多 models。

### Commercial platforms

Vapi（优化后的高级技术栈约 ~450–600ms）和 Retell（180 次测试通话中端到端约 ~600ms）构建在这些方案之上。当你想要 managed voice stack 且没有 WebRTC team 时，选择平台。

### 这个模式容易出错的地方

- **没有 barge-in handling。** 用户打断；agent 继续说话。在 Pipecat 中需要 UPSTREAM cancel frames，LiveKit 中需要等价机制。
- **忽略 STT confidence。** 低 confidence transcripts 被当成事实送入 LLM。应基于 confidence 做 gate，或请求确认。
- **TTS mid-sentence cutoff。** 当 pipeline 在一句话中途取消时，TTS 需要知道这一点，否则要截断 audio。
- **忽略 latency budget。** 每个 component 都会增加 50–200ms。上线前先把整条 chain 的延迟加总。

### Typical 2026 latencies

- VAD：20–60ms
- STT partial：100–250ms
- LLM 首个 Token：150–400ms
- TTS first audio：100–200ms
- Transport RTT：30–80ms

端到端 450–600ms 属于高级体验。800–1200ms 很常见。任何 > 1500ms 的体验都会感觉已经坏了。

```figure
voice-pipeline
```

## 构建它
`code/main.py` 是一个基于 frame 的 toy pipeline，包含：

- `Frame` types（audio、transcript、text、tts_audio、control）。
- 带有 `process(frame)` 的 `Processor` interface。
- 一个五阶段 pipeline（VAD → STT → LLM → TTS → transport），以 scripted processors 实现。
- 一个 UPSTREAM cancel frame，用来演示 barge-in。

运行它：

```
python3 code/main.py
```

trace 会展示正常 flow，以及一次让 TTS 在话语中途停止的 barge-in cancel。

## 使用它
- **Pipecat** 用于完全控制 — custom processors、Python-first、可插拔 providers。
- **LiveKit Agents** 用于 WebRTC-first deployments 和 telephony。
- **Vapi / Retell** 用于没有 WebRTC team 的 hosted voice agents。
- **OpenAI Realtime / Gemini Live** 用于直接 audio-in/audio-out（MultimodalAgent）。

## 交付它
`outputs/skill-voice-pipeline.md` 搭建一个 Pipecat 形态的 voice pipeline 脚手架，包含 VAD + STT + LLM + TTS + transport，以及 barge-in handling。

## 练习
1. 给你的 toy pipeline 添加 metrics observer：统计每个 stage 每秒的 frames 数量。延迟在哪里累积？
2. 实现 confidence-gated STT：低于阈值时，请求“could you repeat that?”
3. 添加 semantic turn detection：简单规则 — 如果 transcript 以 "?" 结尾，则视为 end of turn。
4. 阅读 Pipecat 的 transport docs。把 stdlib transport 替换为 SmallWebRTCTransport config（stub）。
5. 在同一 query 上测量 OpenAI Realtime 与 STT+LLM+TTS cascade。text-level control 带来了多少延迟成本？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Frame | "Event" | pipeline 中有类型的数据单元（audio、transcript、text、control） |
| Processor | "Pipeline stage" | 带有 process(frame) 的 handler |
| DOWNSTREAM | "Forward flow" | 从 source 到 sink：audio in，speech out |
| UPSTREAM | "Feedback flow" | Control：cancel、metrics、barge-in |
| VAD | "Voice activity detection" | 检测用户何时正在说话 |
| Semantic turn detection | "Smart end-of-turn" | 基于 model 判断用户已经说完 |
| MultimodalAgent | "Direct audio agent" | Audio in，audio out；中间没有 text |
| VoicePipelineAgent | "Cascade agent" | STT + LLM + TTS；text-level control |

## 延伸阅读
- [Pipecat docs](https://docs.pipecat.ai/getting-started/introduction) — 基于 frame 的 pipeline、processors、transports
- [LiveKit Agents docs](https://docs.livekit.io/agents/) — WebRTC + voice primitives
- [Vapi](https://vapi.ai/) — managed voice platform
- [Retell AI](https://www.retellai.com/) — managed voice，latency-benchmarked
