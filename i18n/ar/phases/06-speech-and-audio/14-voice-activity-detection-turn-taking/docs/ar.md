# اكتشاف النشاط الصوتي مع التحولات  Silero、Cobra و Flush Trick

> كل وكيل صوت نجاح يعتمد على حكمين: المستخدم الآن هل في الكلام، و هم هل يقولون قد انتهوا؟ VAD  الإجابة على السؤال الأول.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 11（Real-Time Audio），Phase 6 · 12（Voice Assistant）
**Time:** ~45 分钟

## 问题

وكيل الصوت في كل 20 ms جزء أعلى القيام ثلاثة قرارات مختلفة:

1. **这一帧是 speech 吗？** VAD──二元判断,逐进行──
2. **用户是否开始了新的 utterance？** اكتشاف بداية
3. **用户是否说完了？** إشارة نهاية

朴素答案(عتبة الطاقة) 在任何噪音下都会失败:交通声、键盘声、人群杂声。2026 年的答案是:Silero VAD(开放、深度学习 训练) + نموذج اكتشاف التحولات(التوجيه النهائي المفاجئ) + 基于 VAD 校准的沉默霍霍尔。

## 概念

![VAD 级联：energy → Silero → turn-detector → flush trick](../assets/vad-turn-taking.svg)

### ثلاث مستويات

**Tier 1: energy gate。**يُمكن أن يكون هناك صوت ثابت واضح، ولكن أي ضجيج يتجاوز قيمته سيتم إطلاقه.

**Tier 2: Silero VAD**(2020-2026, MIT) ・ 1M المعلمات‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**Tier 3: semantic turn detector。**نموذج كشف التحول في LiveKit ((2024-2026) أو تصنيف صغير الخاص بك.

### 关键参数 ومتميزة

- **Threshold。**Silero 输出 احتمال;在 &gt; 0.5(默认) أو &gt; 0.3( حساس) 时分类为语音──值越低,首词被截断越少,但假积极 越多──
- **Minimum speech duration。**رفض 250 ms من الكلام، عادة ما يكون ذلك السعال أو ضجيج الكرسي.
- **Silence hangover（end-pointing）。**بعد VAD 回到 0 之后, انتظر 500-800 ms لإعلان آخر التحول.
- **Pre-roll buffer。**في VAD 触发前保留 300-500 ms من الصوت...

### خدعة "فلاش" ((كيوتاي 2025)

تمتلك أسلوبات STT المتداولة مع تأخير المشاهدة المقبلة (((كيوتا STT-1B = 500 ميس، STT-2.6B = 2.5 ثانية)**向 STT 发送 flush signal**، إضطراب فور فور إصدارها. ستت على نحو 4× في الوقت الحقيقي.

端到端:125 ms VAD + flush STT = 对话式延迟──

### 2026 VAD مقابل

| VAD | TPR @ 5% FPR | Latency | License |
|-----|--------------|---------|---------|
| WebRTC VAD（Google，2013） | 50.0% | 30 ms | BSD |
| Silero VAD（2020-2026） | 87.7% | ~1 ms | MIT |
| Cobra VAD（Picovoice） | 98.9% | ~1 ms | commercial |
| pyannote segmentation | 95% | ~10 ms | MIT-ish |

سيلرو هو صحيح الاختيار المتبني. كوبرا هو المكونات / 准确率升级.


```figure
sp-vad-cascade
```

## بناءها

### الخطوة 1: بوابة الطاقة

```python
def energy_vad(chunk, threshold_dbfs=-40.0):
    rms = (sum(x * x for x in chunk) / len(chunk)) ** 0.5
    dbfs = 20.0 * math.log10(max(rms, 1e-10))
    return dbfs > threshold_dbfs
```

### 步骤 2: سيلرو في Python 中的 VAD

```python
from silero_vad import load_silero_vad, get_speech_timestamps

vad = load_silero_vad()
audio = torch.tensor(waveform_16k, dtype=torch.float32)
segments = get_speech_timestamps(
    audio, vad, sampling_rate=16000,
    threshold=0.5,
    min_speech_duration_ms=250,
    min_silence_duration_ms=500,
    speech_pad_ms=300,
)
for s in segments:
    print(f"{s['start']/16000:.2f}s - {s['end']/16000:.2f}s")
```

### 步骤 3: آلة الدولة التحول

```python
class TurnDetector:
    def __init__(self, silence_hangover_ms=500, min_speech_ms=250):
        self.state = "idle"
        self.speech_ms = 0
        self.silence_ms = 0
        self.silence_hangover_ms = silence_hangover_ms
        self.min_speech_ms = min_speech_ms

    def update(self, is_speech, chunk_ms=20):
        if is_speech:
            self.speech_ms += chunk_ms
            self.silence_ms = 0
            if self.state == "idle" and self.speech_ms >= self.min_speech_ms:
                self.state = "speaking"
                return "START"
        else:
            self.silence_ms += chunk_ms
            if self.state == "speaking" and self.silence_ms >= self.silence_hangover_ms:
                self.state = "idle"
                self.speech_ms = 0
                return "END"
        return None
```

### الخطوة الرابعة: خدعة الحمراء

```python
def flush_on_end(stt_client, audio_buffer):
    stt_client.send_audio(audio_buffer)
    stt_client.send_flush()
    return stt_client.recv_transcript(timeout_ms=150)
```

STT(Kyutai、Deepgram、AssemblyAI) يجب أن يدعم الفلوس، هذا الوسيلة才有效──سوسر التدفق غير مدعوم، لأنه يعتمد على الحجر، و دائما ينتظر قطع──

## استخدمها

| Situation | VAD choice |
|-----------|-----------|
| 开放、快速、通用 | Silero VAD |
| 商业 call center | Cobra VAD |
| On-device（phone） | Silero VAD ONNX |
| Research / diarization | pyannote segmentation |
| 零依赖 fallback | WebRTC VAD（legacy） |
| 需要 turn-ending 质量 | Silero + LiveKit turn-detector 分层 |

 تجربة قانون: إلا إذا كنت حقا别无选择، وإلا أبدا لا تنشر الطاقة فقط VAD

## فخ

- **Fixed threshold。**في بيئة هادئة قابلة للاستخدام، في بيئة مزدحمة فشلت.
- **Silence hangover 太短。**الوكيل 会在句中打断用户──500-800 ms هي أفضل منطقة للحوار 语音──
- **Hangover 太长。**感觉迟──用目标用户做 A/B test──
- **没有 pre-roll buffer。**المستخدم الصوتية من قبل 200-300 م.س 会失失──始终保留滚动前滚──
- **忽略 semantic endpointing。**دعيني أفكر...  包含长停顿──用户讨厌思路中途被打断──使用LiveKit的转检器或类似方案──

## أصدرها

保存为 `outputs/skill-vad-tuner.md` لتحمل العمل  اختيار نموذج VAD ‬الحد الأدنى ‬التدفق ‬المتقدمة ‬المتقدمة والستراتيجية للكشف عن التدفق‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## التدريب

1. **Easy。**运行 `code/main.py`∼ it模拟 خطاب + صمت + خطاب + سعال 序列,并测试三层 VAD──
2. **Medium。**إعداد`silero-vad`,处理一段 5 分钟录音,调优门,同时最小化首词截断和误触发──报告精度/回忆──
3. **Hard。**构建一个小型转变检测器:Silero VAD + 基于近10个字的嵌入的3层 MLP(使用句子变化器) ――在手工标注的转变数据集 上练──以10% F1 击败Silero-only──

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| VAD | Voice detector | 逐帧二元判断：这是 speech 吗？ |
| Turn detection | End-pointing | VAD + silence-hangover + semantic endpoint。 |
| Silence hangover | Wait-after-speech | 宣布 turn end 前等待的时间；500-800 ms。 |
| Pre-roll | Pre-speech buffer | 在 VAD 触发前保留 300-500 ms audio。 |
| Flush trick | Kyutai hack | VAD → flush-STT → 125 ms，而不是 500 ms delay。 |
| Semantic endpoint | “他们是真的想停下吗？” | 查看 words 的 ML classifier，而不只是看 silence。 |
| TPR @ FPR 5% | ROC point | 标准 VAD benchmark；Silero 为 87.7%，WebRTC 为 50%。 |

## 延伸阅读

- [Silero VAD](https://github.com/snakers4/silero-vad) 开放 VAD 参考实现──
- [Picovoice Cobra VAD](https://picovoice.ai/products/cobra/) 商业准确率领导者──
- [Kyutai — Unmute + flush trick](https://kyutai.org/stt) 低于200 ms 的工程技巧──
- [LiveKit — turn detection](https://docs.livekit.io/agents/logic/turns/) إشارة نهاية معنوية في بيئة 生产
- [WebRTC VAD](https://webrtc.googlesource.com/src/) القاعدة القديمة
- [pyannote segmentation](https://github.com/pyannote/pyannote-audio) يوميّة 级 تقسيمها
