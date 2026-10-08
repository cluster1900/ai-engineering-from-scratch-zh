# 实时音频处理

> خطوط الأنابيب المكونة من مجموعات  معالجة ملف واحد. خطوط الأنابيب في الوقت الحقيقي يجب أن تتعامل في المرحلة التالية 20 ملث ثانية حتى تصل قبل معالجة هذه 20 ملث ثانية. كل محادثة AI ٬ استوديو البث و الروبوت الهاتفية تمت من خلال هذا الميزانية المتأخرة يقرر أن يكون ناجحا.

**类型：**الإنشاء
**语言：**بايثون
**先修：**المرحلة 6 · 02(القطاعات الطيفية)
**时间：**حوالي 75 دقيقة

## 问题

أنت تريد مساعد صوتي حيوي للحساسية. التأخير في محادثات الإنسان يتراوح حوالي 230 ms.**hear → understand → respond → speak**الميزانية الدائرة هي:

| 阶段 | 预算 |
|-------|--------|
| Mic → buffer | 20 ms |
| VAD | 10 ms |
| ASR (streaming) | 150 ms |
| LLM (first token) | 100 ms |
| TTS (first chunk) | 100 ms |
| Render → speaker | 20 ms |
| **Total** | **~400 ms** |

موشي (كيوتاي، 2024) صل إلى 200 ميس كامل المزدوج──GPT-4o-في الوقت الحقيقي (2024) 约为 ~320 ميس──2022年发布的化管道是 2500 ميس──这10× 改进来自三种技术:(1) 全链路流,(2) 使用部分结果的异步管道,(3)قاطع التوليد──

## 概念

![包含 ring buffer、VAD gate 和 interruption 的 streaming audio pipeline](../assets/real-time.svg)

**Frame / chunk / window。**صوت في الوقت الحقيقي 以固定大小的块流动──常见选择:20 ms(16 kHz 下 320 عينات)──下游一切都必须跟上这个节奏──

**Ring buffer。**固定大小的圆形缓冲──Producer thread 写入新框架,消费者 thread 读取──避免在热路中分配内存──大小 ≈ أقصى تأخر × معدل العينة؛ 2 ثانية من حلقة 16 كيلوهرتز = 32,000 عينة──

**VAD (Voice Activity Detection)。**عندما لا أحد يتحدث، أغلق العمل، Silero VAD 4.0 (2024) على CPU في كل إطار 30 ms  الوقت التشغيلي <1 ms ‬`webrtcvad`هو بديل قديم

**Streaming ASR。**随着音频到达而输出部分转录的模型──Parakeet-CTC-0.6B 在流媒体模式 (NeMo, 2024) 下,以 320 ms latency 达到 25% WER──Whisper-Streaming (Macháček et al., 2023) 将 Whisper 切成 chunks, 在 ~2s latency 下实现近流媒体──

**Interruption。**عندما يقوم المساعد بالحديث عندما يفتح المستخدم، يجب عليك (أ) اختبار القفز، (ب) توقف TTS، (ج) التخلص من الناتج المتبقي لـ LLM.

**WebRTC Opus transport。**20 ميس إطار، 48 كيلوهرتز، تكييف الذاتي مع معدل بيت 8128 كيبس.

**Jitter buffer。**حزم الشبكة قد تكون متأخرة أو متأخرة في الوصول.

### 常见坑

- **Thread contention。**Python GIL + النماذج الثقيلة ممكن جعل خيط الصوت 饥饿── استخدام C-callback مكتبة الصوت  Sounddevice、PortAudio),并让 Python 远离热路──
- **Sample-rate conversion latency。**في خط الأنابيب، سيتم زيادة الوزن في 520 ms.`soxr_hq`(‬)
- **TTS priming。**حتى مثل كوكورو مثل تسي سريع، الطلب الأول أيضا 100200 ms التدفئة-up── نموذج الحفاظ على الحفاظ، وفي أول مرة حقيقية تحول 前用 dummy run 预热──
- **Echo cancellation。**没有 AEC,TTS output 会重新进入mic,并触发 ASR 识别bot 自己的声音──WebRTC AEC3 هو مفتوح المصدر الافتراضي──

## 动手构建

### الخطوة 1: خيط عازف

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

القدرة تحدد أقصى تأخر البفر 16.16 كيلوهرتز.

### 步骤 2: بوابة VAD

```python
def simple_energy_vad(frame, threshold=0.01):
    return sum(x * x for x in frame) / len(frame) > threshold ** 2
```

生产环境中替换为 سيلرو VAD:

```python
import torch
vad, _ = torch.hub.load("snakers4/silero-vad", "silero_vad")
is_speech = vad(torch.tensor(frame), 16000).item() > 0.5
```

### 步骤 3: تدفق ASR

```python
# Parakeet-CTC-0.6B streaming via NeMo
from nemo.collections.asr.models import EncDecCTCModelBPE
asr = EncDecCTCModelBPE.from_pretrained("nvidia/parakeet-ctc-0.6b")
# chunk_ms=320 ms, look_ahead_ms=80 ms
for chunk in audio_stream():
    partial_text = asr.transcribe_streaming(chunk)
    print(partial_text, end="\r")
```

### 步骤 4: معالج التوقف

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

هذا يعتمد على التواصل التزامنية ويمكن إزالة التدفق التدفقي التدفقي.


```figure
nyquist-aliasing
```

## استخدمها

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

- **Buffering 500 ms to be safe。**المضخة *就是* سطح تأخرك
- **Not pinning threads。**إعادة الاتصال الصوتي في الدرجة الأولوية أقل من خيط UI 上 = حمله تحدث أخطاء
- **TTS chunks too small。**قطع صغيرة من 200 ميس سوف تجعل القطع الأثرية الصوتية قابل للسمع.
- **No jitter buffer。**شبكة حقيقية لديها اضطرابات، لا توجد سلاسل ستظهر البوبس.
- **Single-shot error handling。**أنابيب الصوت يجب أن تكون مضادة للصدمات استثناء في جلسة قتل

## 交付 it

保存为 `outputs/skill-realtime-designer.md` تصميم خط أنابيب صوتية في الوقت الحقيقي، ومواصلة كل مرحلة  إعطاء ميزانيات تأخر محددة

## التدريب

1. **Easy。**运行 `code/main.py`◊ انها تشبه حلقة الرفع + الطاقة VAD ؛
2. **Medium。**استخدام `sounddevice`، قم ببناء حلقة عبر، في إطار 20 ميس إصدار الميكروفون الخاص بك، ووضع في كل إطار طباعة حالة VAD
3. **Hard。**استخدام `aiortc`构建一个完整的双重回声测试:浏览器 → WebRTC → Python → WebRTC →浏览器──用1kHz脉冲测量玻璃到玻璃延迟──

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

- [Macháček et al. (2023). Whisper-Streaming](https://arxiv.org/abs/2307.14743) قطع تقريبا التدفق همس
- [Kyutai (2024). Moshi](https://kyutai.org/Moshi.pdf) تأخير كامل المزدوج 200 ميس
- [LiveKit Agents framework (2024)](https://docs.livekit.io/agents/) إنتاج وكيل صوتي التوسيقي
- [Silero VAD repo](https://github.com/snakers4/silero-vad) sub-1 ms VAD،Apache 2.0
- [WebRTC AEC3 paper](https://webrtc.googlesource.com/src/+/main/modules/audio_processing/aec3/) مفتوح المصدر 下的回音 إلغاء‬
