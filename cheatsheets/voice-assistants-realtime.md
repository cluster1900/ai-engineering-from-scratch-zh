---
id: voice-assistants-realtime
title: Real-Time Voice Assistants
code: RT
subtitle: VAD、轮次检测、barge-in、延迟预算与全双工语音，让语音 agent 及时应答。
hue: 285
sources: phases/06-speech-and-audio/11-real-time-audio-processing, phases/06-speech-and-audio/12-voice-assistant-pipeline, phases/06-speech-and-audio/14-voice-activity-detection-turn-taking, phases/06-speech-and-audio/15-streaming-speech-to-speech-moshi-hibiki, phases/14-agent-engineering/22-voice-agents-pipecat-livekit, phases/19-capstone-projects/03-realtime-voice-assistant
source_hash: bd10481585db3e17
---

## 级联语音流水线
type: architecture
from: phases/06-speech-and-audio/12-voice-assistant-pipeline/docs/en.md, phases/19-capstone-projects/03-realtime-voice-assistant/docs/en.md

```arch
node | mic | 1,1 | Mic | 16 kHz mono, 20 ms | client
node | vad | 2,1 | VAD | Silero, speech gate | process
node | stt | 3,1 | Streaming STT | partial transcripts | model
node | turn | 4,1 | Turn detector | score above 0.6 | model
node | llm | 4,2 | LLM with tools | streams tokens | model
node | tool | 3,2 | Tool side channel | filler after 300ms | process
node | tts | 2,2 | Streaming TTS | first chunk in 200ms | model
node | spk | 1,2 | Speaker | WebRTC jitter buffer | client
edge | mic | vad | frames
edge | vad | stt | speech
edge | stt | turn | partials
edge | turn | llm | commit
edge | llm | tool | call
edge | llm | tts | tokens
edge | tts | spk | audio
edge | vad | tts | barge-in cancel
```

## 毕业项目调度器，一轮
type: flow
from: phases/19-capstone-projects/03-realtime-voice-assistant/code/ts/src/orchestrator.ts, phases/19-capstone-projects/03-realtime-voice-assistant/code/main.py

1. **IDLE**：第一个语音帧把状态转到 LISTENING。
2. **LISTENING**：每个静音帧给 `silenceRunMs` 加上 20 ms。
3. **LISTENING**：静音达到 500 ms 时，`turnCompletionScore` 读取最后的部分转写。
4. **WAITING**：分数达到 0.6 或以上就提交本轮，并设置 `turnCompleteMs`。
5. **THINKING**：工具调用发出。到 300 ms 时智能体说 "one second, let me check"。
6. **THINKING**：工具在 420 ms 返回。第一个 LLM token 再过 140 ms 到来。
7. **SPEAKING**：第一个音频输出在第一个 LLM token 之后 180 ms 到来。
8. **Barge-in**：THINKING 或 SPEAKING 中的语音会取消 TTS 并重新启用 ASR。

## 每轮延迟预算
type: defaults
from: phases/06-speech-and-audio/11-real-time-audio-processing/docs/en.md, phases/06-speech-and-audio/12-voice-assistant-pipeline/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 麦克风到缓冲 | 20 ms | 一帧 |
| VAD | 10 ms | Silero 每帧运行不到 1 ms |
| ASR（流式） | 150 ms | 部分转写 |
| LLM（首个 token） | 100 ms | 把 token 流式发出 |
| TTS（首个 chunk） | 100 ms | 在完整回复之前启动 |
| 渲染到扬声器 | 20 ms | 一帧 |
| 总计 | ~400 ms | 高于 500 ms 会感觉机械 |
| 首个 TTS 音频，笔记本 CPU | 800 ms | Phase 6 毕业项目目标 |

## VAD 与轮次设置
type: defaults
from: phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/docs/en.md, phases/06-speech-and-audio/11-real-time-audio-processing/docs/en.md, phases/19-capstone-projects/03-realtime-voice-assistant/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Silero 阈值 | 0.5 | 0.3 较敏感。首词被截得更少 |
| 最短语音 | 250 ms | 拒绝咳嗽和椅子噪声 |
| 静音拖尾 | 500-800 ms | 太短会打断用户 |
| 预录缓冲 | 300-500 ms | 保住第一个词 |
| 能量门控 | -40 dBFS | 任何超过它的噪声都会触发 |
| 帧大小 | 20 ms | 16 kHz 下 320 个样本 |
| 环形缓冲 | 32,000 samples | 16 kHz 下 2 秒 |
| 轮次提交（毕业项目） | 0.6 | 外加 500ms 的 VAD 静音 |

## Silero VAD 片段
type: annotated-code
lang: python
from: phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/docs/en.md

```python
from silero_vad import load_silero_vad, get_speech_timestamps
vad = load_silero_vad()
audio = torch.tensor(waveform_16k, dtype=torch.float32)
segments = get_speech_timestamps(
    audio, vad, sampling_rate=16000,
    threshold=0.5,  # 0.3 is sensitive
    min_speech_duration_ms=250,  # drops coughs
    min_silence_duration_ms=500,  # silence hangover
    speech_pad_ms=300,  # pre-roll pad
)
for s in segments:
    print(f"{s['start']/16000:.2f}s - {s['end']/16000:.2f}s")
```

## Barge-in 与 flush 技巧
type: annotated-code
lang: python
from: phases/06-speech-and-audio/12-voice-assistant-pipeline/docs/en.md, phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/docs/en.md

```python
tts_task = asyncio.create_task(tts_loop())
while True:
    chunk = await mic.get()
    if vad(chunk):  # user speaks during TTS
        tts_task.cancel()  # stop the reply
        await speaker.stop()
        await new_turn()  # restart STT
        break

def flush_on_end(stt_client, audio_buffer):
    stt_client.send_audio(audio_buffer)
    stt_client.send_flush()  # forces output now
    return stt_client.recv_transcript(timeout_ms=150)
```

## 运行各课
type: command-table
from: phases/06-speech-and-audio/11-real-time-audio-processing/code/main.py, phases/06-speech-and-audio/12-voice-assistant-pipeline/docs/en.md, phases/19-capstone-projects/03-realtime-voice-assistant/code/main.py, phases/19-capstone-projects/03-realtime-voice-assistant/code/ts/README.md

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` | 运行一课的模拟器 |
| `python main.py` | 毕业项目调度器，干净通话和 barge-in 通话 |
| `pip install silero-vad` | 用真正的 VAD 替换桩 |
| `npm install` | 安装 TypeScript 客户端 |
| `npm start` | 两次离线会话和一次 ws 探测，以 0 退出 |
| `npm start -- --serve` | 保持 ws 服务器运行 |
| `npm test` | 通过 tsx 运行 node --test |
| `npm run typecheck` | 运行 `tsc --noEmit` |

## 核心术语
type: concepts
from: phases/06-speech-and-audio/11-real-time-audio-processing/docs/en.md, phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/docs/en.md, phases/19-capstone-projects/03-realtime-voice-assistant/docs/en.md, phases/14-agent-engineering/22-voice-agents-pipecat-livekit/docs/en.md

- **环形缓冲**：固定环形缓冲区。热路径上不做分配。
- **抖动缓冲**：重排迟到的包。太小会有间隙。太大会增加延迟。
- **预录**：VAD 触发前保留的音频。它防止首词被截断。
- **静音拖尾**：VAD 回到 0 之后、轮次结束之前的等待。
- **语义端点**：读词语的分类器，不只看静音。
- **Flush 技巧**：在语音结束时 flush STT。500 ms 的前瞻约 125 ms 结束。
- **填充语**：工具耗时超过 300ms 时的短句。
- **DOWNSTREAM**：Pipecat 从源到汇的帧，音频进、语音出。
- **UPSTREAM**：Pipecat 控制帧，例如 cancel、metrics 和 barge-in。

## 全双工 Moshi，一个 80 ms 步骤
type: flow
from: phases/06-speech-and-audio/15-streaming-speech-to-speech-moshi-hibiki/docs/en.md, phases/06-speech-and-audio/15-streaming-speech-to-speech-moshi-hibiki/code/main.py

1. **Mimi**：以 12.5 Hz、8 个码本编码用户音频。
2. **Temporal Transformer**：7B 参数。读取用户 token 和它自己最近的 token。
3. **Temporal Transformer**：发出下一个文本 token，即内心独白。
4. **Depth Transformer**：2 层。依次预测 8 个码本。
5. **客户端**：`decode_audio_mimi` 把 token 变成音频并播放。
6. **预算**：80 ms 帧加 80 ms 声学延迟是 160 ms。一块 L4 GPU 上是 200 ms。

## 排障
type: troubleshooting
from: phases/06-speech-and-audio/12-voice-assistant-pipeline/docs/en.md, phases/06-speech-and-audio/11-real-time-audio-processing/docs/en.md, phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 第一个词缺失 | VAD 启动晚了一拍 | 阈值 0.3 和一段预录 |
| 机器人抢用户的话 | 打断后 LLM 仍继续 | 把 VAD 接到取消 LLM |
| 静音时出现 "Thanks for watching" | Whisper 跑在静音帧上 | 始终做 VAD-gate |
| ASR 听到机器人的声音 | 没有回声消除 | WebRTC AEC3 |
| 智能体在句中打断用户 | 拖尾太短 | 500-800 ms 加一个轮次检测器 |
| 第一次回复很慢 | 第一次请求时 TTS 预热 | 用一次空跑预热 |
| 听得见声码器伪影 | 小于 200 ms 的 TTS chunk | 320 ms 的 chunk |
| 负载下出现毛刺 | GIL 让音频线程饥饿 | C-callback 音频库 |

## 术语表
type: glossary
from: phases/06-speech-and-audio/11-real-time-audio-processing/docs/en.md, phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/docs/en.md, phases/14-agent-engineering/22-voice-agents-pipecat-livekit/docs/en.md

- **AEC**：echo cancellation。减去扬声器到麦克风的路径。
- **TPR @ 5% FPR**：VAD 基准点。Silero 87.7%，WebRTC VAD 50.0%。
- **MultimodalAgent**：LiveKit 类。音频进，音频出，中间没有文本。
- **VoicePipelineAgent**：LiveKit 类。STT、LLM、TTS，带文本级控制。

## 问题
type: qa
from: phases/06-speech-and-audio/11-real-time-audio-processing/docs/en.md, phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/docs/en.md, phases/06-speech-and-audio/15-streaming-speech-to-speech-moshi-hibiki/docs/en.md, phases/14-agent-engineering/22-voice-agents-pipecat-livekit/docs/en.md, phases/19-capstone-projects/03-realtime-voice-assistant/docs/en.md

- **人类轮次有多快？** 约 230 ms。高于 1500 ms 就会让人感觉系统出了故障。
- **Pipeline 还是 Moshi？** 需要工具时用 pipeline。Moshi 没有针对工具调用训练。
- **为什么 Whisper streaming 没有 flush？** 它是基于块的，总是等待 chunk。
- **端到端的高端水平是多少？** 450 到 600 ms。800 到 1200 ms 很常见。
- **毕业项目的门槛是什么？** first-audio-out 的 p50 低于 800ms，误截断低于 3%。
- **Pipecat 里 barge-in 需要什么？** 回到 TTS 和 LLM 的 UPSTREAM cancel 帧。
