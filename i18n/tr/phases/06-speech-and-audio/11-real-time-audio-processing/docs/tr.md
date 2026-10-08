# 实时音频处理

> Batch boru hattları  bir dosyayı işlemeyi sürdürmek için. Gerçek zamanlı boru hattları, bir sonraki 20 毫秒ye kadar işlemeyi sürdürmek için.

**类型：**Yapım
**语言：**Python
**先修：**6. aşama · 02(spektrogramlar)
**时间：**75 dakika kadar .

## 问题

İnsan konuşmalarının dönüşü geçicilik süresi yaklaşık 230 ms.**hear → understand → respond → speak**Bu döngü bütçesi:

| 阶段 | 预算 |
|-------|--------|
| Mic → buffer | 20 ms |
| VAD | 10 ms |
| ASR (streaming) | 150 ms |
| LLM (first token) | 100 ms |
| TTS (first chunk) | 100 ms |
| Render → speaker | 20 ms |
| **Total** | **~400 ms** |

Moshi (Kyutai, 2024)  200 ms tam çiftlemeyi ulaştı GPT-4o-real-time (2024) 约为 ~320 ms。2022 yıl yayınlanan kaskadalı boru hattları 2500 ms。这10× 改进来自三种技术:(1) 全链路流,(2) Use partial results of asynchronous pipelining,(3) interruptible generation。

## 概念

![包含 ring buffer、VAD gate 和 interruption 的 streaming audio pipeline](../assets/real-time.svg)

**Frame / chunk / window。**Gerçek zamanlı ses, sabit büyüklükteki bloklar akışında.

**Ring buffer。**固定大小的圆形缓冲──Producer thread 写入新框架,consumer thread 读取──避免在热路中分配内存──大小 ≈ maksimum gecikme × örnek oranı;2 saniyelik 16 kHz yüzük = 32.000 örnek──

**VAD (Voice Activity Detection)。**Silero VAD 4.0 (2024) CPU'da her 30 ms çerçeve  Çalışma süresi <1 ms。`webrtcvad`Daha eski bir alternatif yöntem.

**Streaming ASR。**Paraket-CTC-0.6B'nin sesli yayımlama modunda (NeMo, 2024) aşağı, 320 ms gecikme ile 25% WER'e ulaştığı için.

**Interruption。**Asistanın konuşma sırasında kullanıcı açılması, (a) 检测 barge-in, (b) 停止 TTS, (c) 丢弃剩余的LLM output──所有这些必须在100 ms内完成,否则用户会感知到助手 听不见──

**WebRTC Opus transport。**20 ms çerçeveleri, 48 kHz, özelleştirilmiş bit hızı 8128 kbps── bu tarayıcı ve mobil standartlardır──LiveKit、Daily.co、Pion 2026 yılında ses uygulamaları inşa etme teknolojisidir──

**Jitter buffer。**Ağ paketleri, belki de bir sıralama veya geç saatlere kadar gerçekleşebilir.

### 常见坑

- **Thread contention。**Python'un GIL + ağır modeller 饥饿―― C-callback ses kütüphanesi kullanmak, 音器、PortAudio),并让 Python 远离热路──
- **Sample-rate conversion latency。**Bu, 5~20 ms artışa yol açacak. Ya da önceden ağırlık çekmek ya da sıfır gecikme ile yeniden örnekleme yapmak için PolyPhase kullanmak.`soxr_hq`)。
- **TTS priming。**Hatta Kokoro gibi hızlı TTS, ilk istek de 100200 ms ısınma vardır.
- **Echo cancellation。**没有AEC,TTS output 会重新进入mic,并触发 ASR 识别bot 自己的声音──WebRTC AEC3 açık kaynaklı varsayılan──

## 动手构建

### 步骤 1: Yüzük tamponu

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

Kapasite, en fazla tamponlama gecikmesini belirler. 16 kHz.

### 步骤 2: VAD kapısı

```python
def simple_energy_vad(frame, threshold=0.01):
    return sum(x * x for x in frame) / len(frame) > threshold ** 2
```

生产环境中替换为 Silero VAD:

```python
import torch
vad, _ = torch.hub.load("snakers4/silero-vad", "silero_vad")
is_speech = vad(torch.tensor(frame), 16000).item() > 0.5
```

### 步骤 3: ASR akışı

```python
# Parakeet-CTC-0.6B streaming via NeMo
from nemo.collections.asr.models import EncDecCTCModelBPE
asr = EncDecCTCModelBPE.from_pretrained("nvidia/parakeet-ctc-0.6b")
# chunk_ms=320 ms, look_ahead_ms=80 ms
for chunk in audio_stream():
    partial_text = asr.transcribe_streaming(chunk)
    print(partial_text, end="\r")
```

### 步骤 4: kesinti yöneticisi

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

Bu asynk I/O ve TTS akışı kaldırılabilir.


```figure
nyquist-aliasing
```

## Kullan

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

- **Buffering 500 ms to be safe。**Buffer *就是* Senin gecikme zemin.
- **Not pinning threads。**Ses geri çağırışı, UI'nin dizisinden öncelikli olarak düşük bir dize üzerinde yüklenirken sorunlar oluşur.
- **TTS chunks too small。**200 ms'lık parçalar, ses kodlayıcı eserlerini görüyor. 320 ms'lık parçalar, tatlı bir noktayı.
- **No jitter buffer。**Gerçek ağda bir gerginlik var, hiç bir sorun yok.
- **Single-shot error handling。**Ses boruları  çarpışma geçirmez olmalı.

## - Söyle.

保存为 `outputs/skill-realtime-designer.md`❖ Gerçek zamanlı ses borusunu tasarlayın, her aşama için belirli gecikme bütçelerini belirleyin.

## 练习

1. **Easy。**运行  İşlem`code/main.py`◊ Bu, yüzük tamponu + enerji VAD'i;
2. **Medium。**Kullanım`sounddevice`, bir geçiş halinde bir döngü oluşturun, 20 ms çerçeveler ile mikrofonunuzu işleyin ve her çerçeveye VAD durumu yazdırın.
3. **Hard。**Kullanım`aiortc`构建一个全双复lex回声测试:browser → WebRTC → Python → WebRTC → browser──用1 kHz脉冲──测量玻璃到玻璃延迟──

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

- [Macháček et al. (2023). Whisper-Streaming](https://arxiv.org/abs/2307.14743) parçalanmış neredeyse akışlı fısıltılıyor。
- [Kyutai (2024). Moshi](https://kyutai.org/Moshi.pdf) Tam duplex 200 ms gecikme
- [LiveKit Agents framework (2024)](https://docs.livekit.io/agents/) üretim ses aracı orkestrasyonu。
- [Silero VAD repo](https://github.com/snakers4/silero-vad) Sub-1 ms VAD,Apache 2.0
- [WebRTC AEC3 paper](https://webrtc.googlesource.com/src/+/main/modules/audio_processing/aec3/)Açık kaynaklı.
