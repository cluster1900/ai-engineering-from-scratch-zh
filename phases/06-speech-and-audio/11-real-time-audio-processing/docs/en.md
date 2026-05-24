# 实时音频处理

> Batch pipeline 处理一个文件。Real-time pipeline 必须在下一个 20 毫秒到来之前处理完当前 20 毫秒。每一个对话式 AI、广播工作室和 telephony bot 的成败都取决于这个 latency budget。

**Type:** Build
**Languages:** Python, Rust
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 6 · 04 (ASR), Phase 6 · 07 (TTS)
**Time:** ~75 minutes

## 问题

你想要一个感觉鲜活的 voice assistant。人类对话轮替 latency 约为 230 ms（从沉默到回应）。超过 500 ms 就会显得像机器人；超过 1500 ms 就会感觉坏掉了。2026 年，一个完整的 **hear → understand → respond → speak** loop 的预算是：

| 阶段 | 预算 |
|-------|--------|
| Mic → buffer | 20 ms |
| VAD | 10 ms |
| ASR (streaming) | 150 ms |
| LLM (first token) | 100 ms |
| TTS (first chunk) | 100 ms |
| Render → speaker | 20 ms |
| **Total** | **~400 ms** |

Moshi (Kyutai, 2024) 达到了 200 ms full-duplex。GPT-4o-realtime (2024) 约为 320 ms。2022 年交付的 cascaded pipeline 是 2500 ms。10× 的改进来自三项技术：（1）处处 streaming，（2）使用 partial result 的 asynchronous pipelining，（3）可中断生成。

## 概念

![Streaming audio pipeline with ring buffer, VAD gate, interruption](../assets/real-time.svg)

**Frame / chunk / window。** Real-time audio 以固定大小的 block 流动。常见选择是 20 ms（16 kHz 下 320 个 sample）。下游所有环节都必须跟上这个节奏。

**Ring buffer。** 固定大小的 circular buffer。Producer thread 写入新 frame，consumer thread 读取。避免在 hot path 上分配内存。大小 ≈ 最大 latency × sample rate；一个 2 秒的 16 kHz ring = 32,000 个 sample。

**VAD (Voice Activity Detection)。** 当没人说话时，拦住下游工作。Silero VAD 4.0 (2024) 在 CPU 上每 30 ms frame 运行时间 <1 ms。`webrtcvad` 是更早的替代方案。

**Streaming ASR。** 随着 audio 到达而发出 partial transcript 的 model。Parakeet-CTC-0.6B 在 streaming mode（NeMo, 2024）下，以 320 ms latency 达到 2–5% WER。Whisper-Streaming (Macháček et al., 2023) 将 Whisper 分 chunk，以约 2 s latency 实现近似 streaming。

**Interruption。** 当 assistant 说话时用户开口，你必须（a）检测 barge-in，（b）停止 TTS，（c）丢弃剩余 LLM output。全部在 100 ms 内完成，否则用户会感到 assistant 听不见。

**WebRTC Opus transport。** 20 ms frame，48 kHz，自适应 bitrate 8–128 kbps。它是 browser 和 mobile 的标准。LiveKit、Daily.co、Pion 是 2026 年构建 voice app 的 stack。

**Jitter buffer。** Network packet 会乱序 / 延迟到达。Jitter buffer 会重排并平滑；太小 → 可听见的空隙，太大 → latency。典型值为 60–80 ms。

### 常见坑

- **Thread contention。** Python 的 GIL + 重型 model 可能让 audio thread 饥饿。使用 C-callback audio library（sounddevice、PortAudio），并让 Python 远离 hot path。
- **Sample-rate conversion latency。** 在 pipeline 内 resampling 会增加 5–20 ms。要么提前 resample，要么使用 zero-latency resampler（PolyPhase、`soxr_hq`）。
- **TTS priming。** 即使像 Kokoro 这样快的 TTS，第一次请求也有 100–200 ms warm-up。缓存 model，并在第一个真实 turn 前用 dummy run 预热。
- **Echo cancellation。** 没有 AEC，TTS output 会重新进入 mic，并触发 ASR 识别 bot 自己的声音。WebRTC AEC3 是 open-source 默认方案。

## 构建它

### 步骤 1： ring buffer

```python
import collections

class RingBuffer:
    def __init__(self, capacity):
        self.buf = collections.deque(maxlen=capacity)
    def write(self, frame):
        self.buf.extend(frame)
    def read(self, n):
        return [self.buf.popleft() for _ in range(min(n, len(self.buf)))]
    def level(self):
        return len(self.buf)
```

Capacity 决定最大 buffering latency。16 kHz 下 32,000 个 sample = 2 s。

### 步骤 2： VAD gate

```python
def simple_energy_vad(frame, threshold=0.01):
    return sum(x * x for x in frame) / len(frame) > threshold ** 2
```

生产环境中替换为 Silero VAD：

```python
import torch
vad, _ = torch.hub.load("snakers4/silero-vad", "silero_vad")
is_speech = vad(torch.tensor(frame), 16000).item() > 0.5
```

### 步骤 3： streaming ASR

```python
# Parakeet-CTC-0.6B streaming via NeMo
from nemo.collections.asr.models import EncDecCTCModelBPE
asr = EncDecCTCModelBPE.from_pretrained("nvidia/parakeet-ctc-0.6b")
# chunk_ms=320 ms, look_ahead_ms=80 ms
for chunk in audio_stream():
    partial_text = asr.transcribe_streaming(chunk)
    print(partial_text, end="\r")
```

### 步骤 4: interruption handler

```python
class Dialog:
    def __init__(self):
        self.tts_task = None

    def on_user_speech(self, frame):
        if self.tts_task and not self.tts_task.done():
            self.tts_task.cancel()   # barge-in
        # then feed to streaming ASR

    def on_final_user_utterance(self, text):
        self.tts_task = asyncio.create_task(self.reply(text))

    async def reply(self, text):
        async for tts_chunk in llm_then_tts(text):
            speaker.write(tts_chunk)
```

关键在于 async I/O 和可取消的 TTS streaming。对 audio track 调用 WebRTC peerconnection.stop() 是 canonical 做法。

## 使用它

2026 年的 stack：

| Layer | Pick |
|-------|------|
| Transport | LiveKit (WebRTC) or Pion (Go) |
| VAD | Silero VAD 4.0 |
| Streaming ASR | Parakeet-CTC-0.6B or Whisper-Streaming |
| LLM first-token | Groq, Cerebras, vLLM-streaming |
| Streaming TTS | Kokoro or ElevenLabs Turbo v2.5 |
| Echo cancel | WebRTC AEC3 |
| End-to-end native | OpenAI Realtime API or Moshi |

## 陷阱
- **Buffering 500 ms to be safe。** Buffer *就是* 你的 latency floor。缩小它。
- **Not pinning threads。** Audio callback 在优先级低于 UI 的 thread 上 = 负载下出现 glitch。
- **TTS chunks too small。** 小于 200 ms 的 chunk 会让 vocoder artifact 变得可闻。320 ms chunk 是 sweet spot。
- **No jitter buffer。** 真实网络有 jitter；没有平滑就会产生 pop。
- **Single-shot error handling。** Audio pipeline 必须 crash-proof。一个 exception 就会杀掉 session。

## 交付它

保存为 `outputs/skill-realtime-designer.md`。设计一个 real-time audio pipeline，并为每个阶段给出具体 latency budget。

## 练习

1. **Easy。** 运行 `code/main.py`。模拟 ring buffer + energy VAD；为一个假的 10 秒 stream 打印各阶段 latency。
2. **Medium。** 使用 `sounddevice` 构建 passthrough loop，以 20 ms frame 处理你的 mic，并在每个 frame 打印 VAD state。
3. **Hard。** 使用 `aiortc` 构建 full duplex echo test：browser → WebRTC → Python → WebRTC → browser。用 1 kHz pulse 测量 glass-to-glass latency。

## 关键术语
| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| Ring buffer | 循环队列 | 用于 audio frame 的固定大小、lock-free（或 SPSC-locked）FIFO。 |
| VAD | Silence gate | 标记 speech 与 non-speech 的 model 或 heuristic。 |
| Streaming ASR | Real-time STT | 随 audio 到达发出 partial text；有界 lookahead。 |
| Jitter buffer | Network smoother | 重排 out-of-order packet 的 queue；典型值 60–80 ms。 |
| AEC | Echo cancellation | 抵消 speaker-to-mic feedback path。 |
| Barge-in | User interrupt | 系统在 TTS 过程中检测到用户说话；必须取消 playback。 |
| Full duplex | 双向同时 | 用户和 bot 可以同时说话；Moshi 是 full duplex。 |

## 延伸阅读
- [Macháček et al. (2023). Whisper-Streaming](https://arxiv.org/abs/2307.14743) — 分块式近实时流式 Whisper。
- [Kyutai (2024). Moshi](https://kyutai.org/Moshi.pdf) — full-duplex 200 ms 延迟。
- [LiveKit Agents framework (2024)](https://docs.livekit.io/agents/) — 生产级 audio agent 编排。
- [Silero VAD repo](https://github.com/snakers4/silero-vad) — sub-1 ms VAD，Apache 2.0。
- [WebRTC AEC3 paper](https://webrtc.googlesource.com/src/+/main/modules/audio_processing/aec3/) — open source 下的 echo cancellation。
