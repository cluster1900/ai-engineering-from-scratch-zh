# 实时音频处理

> 批量管道处理一个文件――实时管道必须在下一个20毫秒到来之前处理当前这20毫秒――每个对话AI、广播工作室和电话机器人都由这个延迟预算决定成败――

**类型：**构建
**语言：**字符串
**先修：**频谱 (?? 期6 · 04(ASR)
**时间：**约75分钟

## 问题

你想要一个感觉鲜活的语音助理――人类对话转变延迟约为 ~ 230 ms(沉默回应)――高于 500 ms 会感觉机械;高于 1500 ms 会感觉坏掉――2026年完整**hear → understand → respond → speak**循环预算是:

| 阶段 | 预算 |
|-------|--------|
| Mic → buffer | 20 ms |
| VAD | 10 ms |
| ASR (streaming) | 150 ms |
| LLM (first token) | 100 ms |
| TTS (first chunk) | 100 ms |
| Render → speaker | 20 ms |
| **Total** | **~400 ms** |

莫希 (九台, 2024) 达到200 ms全双重――GPT-4o实时 (2024) 约为 ~320 ms──2022年发布的管线是2500 ms──这10× 改进来自三种技术:(1) 全链路流,(2) 使用部分结果的异步管线,(3) 可断交的生成──

## 概念

![包含 ring buffer、VAD gate 和 interruption 的 streaming audio pipeline](../assets/real-time.svg)

**Frame / chunk / window。**实时音频以固定大小的块流动──常见选择:20 ms(16 kHz 下 320 样本)──下游一切都必须跟上这个节奏──

**Ring buffer。**固定大小的圆形缓冲器──生产线 写入新框架,消费线 读取──避免在热路中分配内存──大小 ≈最大延迟 ×样品速率;2秒的16kHz环 =32,000个样本──

**VAD (Voice Activity Detection)。**当没人说话时,关闭下游工作──Silero VAD 4.0 (2024) 在CPU上每30ms框架运行时间 <1ms──`webrtcvad`是一个更老的替代方案.

**Streaming ASR。**随着音频到达和输出部分转录的模型──Parakeet-CTC-0.6B 在流媒体模式下 (NeMo, 2024) 下,以 320 ms延迟 达到 25% WER──声流 (Macháček等, 2023) 将声流切成块,在 ~2 秒延迟下实现近流――

**Interruption。**当助理 正在说话时用户开口,你必须 (a) 检测入, (b) 停止TTS, (c) 丢弃剩余的LLM输出――所有这些都必须在100ms内完成,否则用户会感知到助理 听不见――

**WebRTC Opus transport。**基于用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户的用户数量.

**Jitter buffer。**网络包可能乱序或延迟到达──Jitter缓冲 会重排并平滑;太小 → 可听的间隙,太大 →延迟──典型值为6080 ms──

### 常见坑

- **Thread contention。**通过C-callback音频库 (C-callback音频库) 实现Python的GIL+重型模型,并让Python远离热路径.
- **Sample-rate conversion latency。**在管道内重采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采采`soxr_hq`
- **TTS priming。**即便像Kokoro这样的快速TTS,第一次请求也有100200 ms的加热.缓存模型,并在第一次真实转向前用木偶运行.
- **Echo cancellation。**没有AEC,TTS输出会重新进入mic,并触发ASR识别机器人自己的声音――WebRTC AEC3是开源默认的――

## 动手构建

### 步骤1:环保

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

容量决定最大缓冲延迟──16kHz 下32,000个样本 =2秒──

### 步骤2:VAD门

```python
def simple_energy_vad(frame, threshold=0.01):
    return sum(x * x for x in frame) / len(frame) > threshold ** 2
```

生产环境中替换为Silero VAD:

```python
import torch
vad, _ = torch.hub.load("snakers4/silero-vad", "silero_vad")
is_speech = vad(torch.tensor(frame), 16000).item() > 0.5
```

### 步骤3: 流动ASR

```python
# Parakeet-CTC-0.6B streaming via NeMo
from nemo.collections.asr.models import EncDecCTCModelBPE
asr = EncDecCTCModelBPE.from_pretrained("nvidia/parakeet-ctc-0.6b")
# chunk_ms=320 ms, look_ahead_ms=80 ms
for chunk in audio_stream():
    partial_text = asr.transcribe_streaming(chunk)
    print(partial_text, end="\r")
```

### 步骤4:中断处理器

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

这取决于无同步I/O 和可取消的TTS流媒体──WebRTC 中在音频轨道上调用同行连接.


```figure
nyquist-aliasing
```

## 使用它

2026 技术:

| 层 | 选择 |
|-------|------|
| Transport | LiveKit (WebRTC) or Pion (Go) |
| VAD | Silero VAD 4.0 |
| Streaming ASR | Parakeet-CTC-0.6B or Whisper-Streaming |
| LLM first-token | Groq, Cerebras, vLLM-streaming |
| Streaming TTS | Kokoro or ElevenLabs Turbo v2.5 |
| Echo cancel | WebRTC AEC3 |
| End-to-end native | OpenAI Realtime API or Moshi |

## 常见陷

- **Buffering 500 ms to be safe。**缓冲器是你的延迟地板.
- **Not pinning threads。**音频回调在优先级低于UI的线程上 = 负载出现故障──
- **TTS chunks too small。**微于200ms的块 会让声码器的文物可听──320ms的块是甜点──
- **No jitter buffer。**网络有,没有平滑就会出现.
- **Single-shot error handling。**音频管道必须防.

## 交付它

保存为`outputs/skill-realtime-designer.md`△设计一个实时音频管道,并为每个阶段 给出具体的延迟预算.

## 练习

1. **Easy。**运行`code/main.py`模拟环保器+能量VAD;为假的10秒流 打印阶段延迟.
2. **Medium。**使用 `sounddevice`通过一个循环,以20ms的框架构建一个通过,处理你的麦克风,并在每个框架中打印VAD状态.
3. **Hard。**使用 `aiortc`构建一个全复lex回声测试:浏览器 → WebRTC → Python → WebRTC →浏览器──使用1 kHz脉冲测量玻璃到玻璃延迟──

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| Ring buffer | circular queue | 用于 audio frames 的固定大小、lock-free（或 SPSC-locked）FIFO。 |
| VAD | Silence gate | 标记 speech 与 non-speech 的 model 或 heuristic。 |
| Streaming ASR | Real-time STT | 随着 audio 到达输出 partial text；bounded lookahead。 |
| Jitter buffer | Network smoother | 对乱序 packets 进行 queue reordering；典型值 60–80 ms。 |
| AEC | Echo cancellation | 减去 speaker-to-mic feedback path。 |
| Barge-in | User interrupt | 系统在 TTS 中途检测到用户说话；必须取消 playback。 |
| Full duplex | Simultaneous both ways | 用户和 bot 可以同时说话；Moshi 是 full duplex。 |

## 延伸阅读

- [Macháček et al. (2023). Whisper-Streaming](https://arxiv.org/abs/2307.14743)碎片的近流语.
- [Kyutai (2024). Moshi](https://kyutai.org/Moshi.pdf)全双式200 ms延迟――
- [LiveKit Agents framework (2024)](https://docs.livekit.io/agents/)制作音频代理配乐――
- [Silero VAD repo](https://github.com/snakers4/silero-vad)下-1 ms VAD,Apache 2.0
- [WebRTC AEC3 paper](https://webrtc.googlesource.com/src/+/main/modules/audio_processing/aec3/)开源下面的回声取消.
