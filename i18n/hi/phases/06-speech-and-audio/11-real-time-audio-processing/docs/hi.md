# 实时音频处理

> बैच पाइपलाइनें  एक फाइल को संसाधित करना  रीअल टाइम पाइपलाइनें  अगला 20 毫秒 तक आने से पहले संसाधित करना  वर्तमान में यह 20 毫秒  प्रत्येक वार्तालाप एआई  प्रसारण स्टूडियो और टेलीफोन बॉट इस लटेंसी बजट से तय होता है 

**类型：**构建
**语言：**पायथन
**先修：**चरण 6 · 02(स्पेक्ट्रोग्राम) चरण 6 · 04(ASR) चरण 6 · 07(TTS)
**时间：** 75 मिनट

## 问题

आप एक महसूस करना चाहते हैं जीवंत आवाज सहायक── मानव वार्तालाप टर्न- लेने की लटेंसी 约为 ~230 ms(चुपचाप-प्रतिसाद)──高于 500 ms 会感觉机械;高于 1500 ms 会感觉坏掉──2026年完整**hear → understand → respond → speak**循环的预算是:

| 阶段 | 预算 |
|-------|--------|
| Mic → buffer | 20 ms |
| VAD | 10 ms |
| ASR (streaming) | 150 ms |
| LLM (first token) | 100 ms |
| TTS (first chunk) | 100 ms |
| Render → speaker | 20 ms |
| **Total** | **~400 ms** |

मोशी (क्यूताई, 2024)  पूर्ण-डूप्लेक्स में 200 ms तक पहुँचना── जीपीटी-4o-रियल टाइम (2024) 约为 ~320 ms──2022 साल में जारी की गई कैस्केड पाइपलाइनें 2500 ms── यह 10× 改进来自三种技术:(1) 全链路流,(2) आंशिक परिणामों का उपयोग करें

## 概念

![包含 ring buffer、VAD gate 和 interruption 的 streaming audio pipeline](../assets/real-time.svg)

**Frame / chunk / window。**वास्तविक समय ऑडियो 以固定大小的块流动──常见选择:20 ms(16 kHz 下 320 नमूने)──下游一切都必须跟上这个节奏──

**Ring buffer。**固定大小的圆形缓冲──उत्पादक धागा 写入新框架,消费者 धागा 读取──避免在热路中分配内存──大小 ≈ अधिकतम विलंबता × नमूना दर;2 सेकंड का 16 kHz रिंग = 32,000 नमूने──

**VAD (Voice Activity Detection)。**जब没人说话时,关闭下游工作──Silero VAD 4.0 (2024) CPU पर प्रति 30 ms फ्रेम 运行时间 <1 ms──`webrtcvad`यह एक पुराने विकल्प है।

**Streaming ASR。** ऑडियो तक पहुंचने और आंशिक प्रतिलेखन के आउटपुट के साथ मॉडल── पैराकीट-सीटीसी-0.6बी स्ट्रीमिंग मोड में (NeMo, 2024) नीचे, 320 ms विलंबता  25% WER तक पहुँचने── विस्मय-प्रवाह (Macháček et al., 2023)  विस्मय 切成 块, में ~2s विलंबता 下实现近-प्रवाह──

**Interruption。**जब सहायक 正在说话时用户开口,你必须 (a) 检测 barge-in,(b) 停止 TTS,(c) 丢弃剩余的 LLM आउटपुट──所有这些都必须在100ms内完成,否则用户会感知到助手 听不见──

**WebRTC Opus transport。**20 ms फ्रेम,48 kHz, स्व-अनुकूलित बिटरेट 8128 kbps── यह ब्राउज़र एवं मोबाइल के मानक──लाइवकिट、डेली.को、पियन है 2026 में वॉयस ऐप बनाने की तकनीक──

**Jitter buffer。**नेटवर्क पैकेट हो सकता है कि वे विघटित हो जाएं या देरी से पहुंचें।

### 常见坑

- **Thread contention。**Python का GIL + भारी मॉडल 饥饿――使用C-callback ऑडियो लाइब्रेरी(ध्वनि डिवाइस、PortAudio),并让 Python 远离热路──
- **Sample-rate conversion latency。**पाइपलाइन में 520 ms में वृद्धि होगी। या तो अग्रिम में वजन का नमूना लिया जाएगा, या फिर शून्य विलंबता वाले पुनः नमूना का उपयोग किया जाएगा।`soxr_hq`)。
- **TTS priming。**यहां तक कि जैसे कोकोरो इस तरह के तेजी से टीटीएस, पहली बार अनुरोध भी 100200 ms वार्म-अप──缓存 मॉडल, और पहली बार वास्तविक बारी 前用 dummy run 预热──
- **Echo cancellation。**没有AEC,TTS आउटपुट 会重新进入mic,并触发ASR 识别bot 自己的声音──WebRTC AEC3 ओपन सोर्स डिफ़ॉल्ट है──

## 动手构建

### 步骤 1: रिंग बफर

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

क्षमता अधिकतम बफरिंग लटेंसी निर्धारित करती है ∙16 kHz ∙ 32,000 नमूने = 2 सेकंड ∙

### 步骤 2:VAD गेट

```python
def simple_energy_vad(frame, threshold=0.01):
    return sum(x * x for x in frame) / len(frame) > threshold ** 2
```

生产环境中替换为 सिलेरो VAD:

```python
import torch
vad, _ = torch.hub.load("snakers4/silero-vad", "silero_vad")
is_speech = vad(torch.tensor(frame), 16000).item() > 0.5
```

### 步骤 3: स्ट्रीमिंग एएसआर

```python
# Parakeet-CTC-0.6B streaming via NeMo
from nemo.collections.asr.models import EncDecCTCModelBPE
asr = EncDecCTCModelBPE.from_pretrained("nvidia/parakeet-ctc-0.6b")
# chunk_ms=320 ms, look_ahead_ms=80 ms
for chunk in audio_stream():
    partial_text = asr.transcribe_streaming(chunk)
    print(partial_text, end="\r")
```

### 步骤 4: विराम के संचालक

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

यह असिनक्रॉनिक I/O और हटाने योग्य TTS स्ट्रीमिंग पर निर्भर करता है।


```figure
nyquist-aliasing
```

## इसका उपयोग करें

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

- **Buffering 500 ms to be safe。**बफर *就是* आपके लटेंसी फ्लोर──缩小它──
- **Not pinning threads。**ऑडियो कॉलबैक में प्राथमिकता UI के धागे से कम ऊपर = लोड के तहत त्रुटियां होंगी。
- **TTS chunks too small。**200 एमएस के टुकड़े देखेंगे Vocoder कलाकृतियों को सुनने के लिए. 320 एमएस के टुकड़े एक मीठा स्थान है.
- **No jitter buffer。**वास्तविक नेटवर्क में घबराहट है; कोई भी स्लाइड नहीं है, पॉप-अप दिखाई देंगे।
- **Single-shot error handling。**ऑडियो पाइपलाइनों को दुर्घटना-प्रूफ होना चाहिए।

## 交付 यह

保存为 `outputs/skill-realtime-designer.md`एक वास्तविक समय ऑडियो पाइपलाइन डिजाइन करें, प्रत्येक चरण के लिए एक विशिष्ट लटेंसी बजट दें

## अभ्यास

1. **Easy。**运行 `code/main.py` यह रिंग बफर + ऊर्जा VAD की तरह है; एक झूठी 10 सेकंड धारा के लिए 印刻阶段延迟
2. **Medium。**उपयोग `sounddevice`, एक पासथ्रू लूप बनाएं, 20 एमएस फ्रेम के साथ अपने माइक्रोफ़ोन को संसाधित करें, और प्रत्येक फ्रेम में VAD स्टेट प्रिंट करें।
3. **Hard。**उपयोग `aiortc`构建一个全双复lex echo test:browser → WebRTC → Python → WebRTC → ब्राउज़र──用1kHz पल्स 测量玻璃到玻璃延迟──

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

- [Macháček et al. (2023). Whisper-Streaming](https://arxiv.org/abs/2307.14743) लगभग प्रवाह के टुकड़े चुप्पी 
- [Kyutai (2024). Moshi](https://kyutai.org/Moshi.pdf) पूर्ण-डूप्लेक्स 200 एमएस विलंबता
- [LiveKit Agents framework (2024)](https://docs.livekit.io/agents/) उत्पादन ऑडियो एजेंट ऑर्केस्ट्रेशन。
- [Silero VAD repo](https://github.com/snakers4/silero-vad) उप-1 ms VAD,Apache 2.0
- [WebRTC AEC3 paper](https://webrtc.googlesource.com/src/+/main/modules/audio_processing/aec3/) ओपन सोर्स 下的 इको रद्द करना
