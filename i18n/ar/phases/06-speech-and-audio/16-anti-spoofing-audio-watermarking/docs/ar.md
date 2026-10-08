# 语音反欺骗与音频水印  ASVspoof 5، AudioSeal، WaveVerify

> السرعة السريعة للإنتاج من طراز الصوت تمتد بسرعة إلى الوسائل الدفاعية. تحتاج النظام الصوتي للإنتاج في عام 2026 إلى شيئين: جهاز اختبار للصوت الحقيقي والصوت المزيف (AASIST, RawNet2) ، ومركز مائي يمكن أن يتكثر من الضغط والتحرير (AudioSeal) ، كلاهما يجب أن يكون على الإنترنت، وإلا لا تحتاج إلى إنشاء جهاز إنتاج الصوت على الإنترنت.

**Type:** Build
**Languages:** Python
**先修要求：**المرحلة 6 · 06 (تعرف المتحدثين) ، المرحلة 6 · 08 (تخفيض الصوت)
**Time:** ~75 minutes

## 问题

ثلاث فصائل ذات صلة بالدفاع:

1. **Anti-spoofing / deepfake detection.**给定一段音频، هل هو مصنوع أم حقيقي؟
2. **Audio watermarking.**في توليد الصوتاتمن خلال إدراج إشارة لا يمكن فهمها، يمكن بعد جهاز الاختبار إستخراجها.
3. **Authenticated provenance.**على الصور الملفية والبيانات النقدية  إجراء توقيع加密──C2PA / مبادرة مصادقة المحتوى──

الكشف 处理不配合的对抗者── watermarking 处理合规性,AI 生成的音频应被识别为此类音频──2026年都必需──

## 概念

![Anti-spoofing vs watermarking vs provenance — 三层防御](../assets/spoofing-watermark.svg)

### ASVspoof 5  مقياس 2024-2025

相比以前版本,最大的变化:

- **Crowdsourced data**(ليس في الصفحة التلفزيونية)
- **~2000 speakers**(قبل حوالي ~100)
- **32 个 attack algorithms.**TTS + تحويل الصوت + اضطراب معادلة
- **Two tracks.**الاعتراض (CM) 独立检测;面向生物识别系统的SPOofing-robust ASV (SASV) ⋅

ASVspoof 5 上 上 上的最新:~7.23% EER── مقارنة بالASSpoof 2019 LA:0.42% EER──真实世界部署:预计野外片段上 EER 为 5-10%──

### AASIST 和 راونيت2  检测模型家族

**AASIST**(2021, مستمرة تحديثها حتى 2026)  في الميزات الطيفية 上 استخدام الرسم البياني الاهتمام‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**RawNet2.**基于原波形的卷曲前端+TDNN后脊──更简单的基线;经过细调后仍有竞争力──

**NeXt-TDNN + SSL features.**2025 变体:ECAPA-style + WavLM ميزات + فقدان التركيز──在 ASVspoof 2019 LA 上达到0.42% EER──

### AudioSeal  2024 年默认 علامة مياه

الميتا **AudioSeal**(2024 年 1 月,v0.2 2024 年 12 月) ✿

- **Localized.**以 16 kHz 采样分辨率 ((1/16000s)
- **Generator + detector jointly trained.**الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز الجهاز
- **Robust.**能经受 MP3 / AAC 压缩、EQ、速度- shift ±10%、混合噪音 +10 dB SNR。
- **Fast.**الكشف 以 485 × الوقت الحقيقي 运行;比 WavMark 快 1000 ×。
- **Capacity.**الحمل المفيد 16-bit ((可编码 النموذج ID、تجريبة العلامة الزمنية、تعرف المستخدم)

### (واف مارك)

أوديوسيل 之前的开放基线──شبكة عصبية لا يمكن تحويلها،32 بت/ثانية──问题:

- التزامن القوة الخامة 很慢──
- يمكن أن تكون ضجيج غوسيا أو MP3
- غير مناسبة للوقات الحقيقية

### (WaveVerify(2025 年 7 月)

حل نقاط ضعف AudioSeal، وخاصة التلاعبات الزمنية(العكس، السرعة)。 استخدام بناء على FiLM جنراتور + اختلاط من خبراء الكشف──在标准攻击上与 AudioSeal 竞争;能处理时间编辑──

### عجز في استخدام المعارضين

من AudioMarkBench:"في ظل تغيير الصوت، تظهر جميع علامات المياه دقة استعادة البيت أقل من 0.6، مما يشير إلى إزالة شبه كاملة". **Pitch-shift 是通用攻击。**2026 سنة لا يوجد أي علامة مياه يمكن أن تتصدى تماما للتغييرات في النطاق الإثارة. هذا هو السبب في أنك بحاجة للكشف.

### مبادرة C2PA / مصداقية المحتوى

ليس من تقنية ML ، بل هو صيغة واضحة. الصور الملفة تحمل حول أدوات إنشاء، والموضوف، والمسجلات.


```figure
v4-audio-watermark
```

## بناءها

### الخطوة الأولى: جهاز كشف الميزات الطيفية البسيطة

```python
def spectral_rolloff(spec, percentile=0.85):
    cum = 0
    total = sum(spec)
    if total == 0:
        return 0
    threshold = total * percentile
    for k, v in enumerate(spec):
        cum += v
        if cum >= threshold:
            return k
    return len(spec) - 1

def is_suspicious(audio):
    spec = magnitude_spectrum(audio)
    rolloff = spectral_rolloff(spec)
    return rolloff / len(spec) > 0.92
```

الخطاب الاصطناعي عادة ما يكون هناك طاقة عالية من المعدل المميز.

### 步骤 2: AudioSeal إضافة + اكتشاف

```python
from audioseal import AudioSeal
import torch

generator = AudioSeal.load_generator("audioseal_wm_16bits")
detector = AudioSeal.load_detector("audioseal_detector_16bits")

audio = load_wav("generated.wav", sr=16000)[None, None, :]
payload = torch.tensor([[1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0]])
watermark = generator.get_watermark(audio, sample_rate=16000, message=payload)
watermarked = audio + watermark

result, decoded_payload = detector.detect_watermark(watermarked, sample_rate=16000)
# result: float in [0, 1] — probability of watermark presence
# decoded_payload: 16 bits; match against embedded payload
```

### الخطوة الثالثة: التقييم

```python
def eer(real_scores, fake_scores):
    thresholds = sorted(set(real_scores + fake_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in fake_scores if s >= t) / len(fake_scores)
        frr = sum(1 for s in real_scores if s < t) / len(real_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

### الخطوة الرابعة:

```python
def safe_tts(text, voice, clone_reference=None):
    if clone_reference is not None:
        verify_consent(user_id, clone_reference)
    audio = tts_model.synthesize(text, voice)
    audio_with_wm = audioseal_embed(audio, payload=build_payload(user_id, model_id))
    manifest = c2pa_sign(audio_with_wm, user_id, timestamp=now())
    return audio_with_wm, manifest
```

كلّ عملية تُحتوي على: 1) علامة مياه، 2) مذكرة موقعة، 3) تُطابق سجلات التدقيق في سياسة الاحتفاظ.

## استخدمها

| Use case | Defense |
|----------|---------|
| 上线 TTS / voice cloning | 每个输出都Embedding AudioSeal（不可协商） |
| Biometric voice unlock | AASIST + ECAPA ensemble；liveness challenge |
| Call-center fraud detection | 对 20% 的来电样本运行 AASIST |
| Podcast authenticity | 上传时进行 C2PA signing，若为 AI-generated 则使用 AudioSeal |
| Research / training detectors | ASVspoof 5 train/dev/eval sets |

## فخ

- **Watermark 从未被 detector 运行检测。**لا معنى لها. ضع جهاز الكشف في جهازك.
- **Detection 没有 calibration。**في الولايات المتحدة، أعلى تدريبات AASIST سوف تتجاوز؛
- **Pitch-shift gap.**激进的音速转会移除大多数水标――准备检测倒退――
- **Metadata strip-and-rehost.**C2PA  سهل من خلال إعادة التدوين حولها.
- **把 liveness 当成 detection。**要求用户说一个随机短语──它可以阻止重播攻击,但不能阻止实时克隆──

## 交付 it

保存为 `outputs/skill-spoof-defender.md` لـ "جين الصوتي" 部署 اختيار نموذج الكشف 、علامة المياه٬ منشور المواصلة و كتاب اللعب التشغيلي

## التدريب

1. **Easy.**运行 `code/main.py`── في الصوت الاصطناعي 上 استخدام كاشف الألعاب + علامة مياه الألعاب إدراج / اكتشاف──
2. **Medium.**إعداد`audioseal`, فى TTS 输出中إدمج الحمل المفيد 16-بيت,再重新解码──用噪声破坏音频并测量Bit Recovery Accuracy──
3. **Hard.**في ASVspoof 2019 LA 上 fine-tune 一个 RawNet2 或 AASIST──测量 EER──在一组的F5-TTS 生成片段上测试,观察 OOD 检测 如何退化──

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| ASVspoof | benchmark | 两年一次的 challenge；2024 = ASVspoof 5。 |
| CM (countermeasure) | Detector | Classifier：真实语音 vs synthetic / converted。 |
| SASV | Speaker verif + CM | 集成的 biometric + spoof detection。 |
| AudioSeal | Meta watermark | Localized，16-bit payload，比 WavMark 快 485×。 |
| Bit Recovery Accuracy | Watermark survival | 攻击后恢复的 payload bits 比例。 |
| C2PA | Provenance manifest | 关于创建 / 作者身份的加密 metadata。 |
| AASIST | Detector family | 基于 graph-attention 的 anti-spoofing SOTA。 |

## 延伸阅读

- [Todisco et al. (2024). ASVspoof 5](https://dl.acm.org/doi/10.1016/j.csl.2025.101825) 当前 مقياس المقياس
- [Defossez et al. (2024). AudioSeal](https://arxiv.org/abs/2401.17264) 默认 علامة مياه
- [Chen et al. (2025). WaveVerify](https://arxiv.org/abs/2507.21150)كاشف الـ MoE للاعتداءات الزمنية
- [Jung et al. (2022). AASIST](https://arxiv.org/abs/2110.01200) العمود الفقري للكشف عن SOTA。
- [AudioMarkBench (2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/5d9b7775296a641a1913ab6b4425d5e8-Paper-Datasets_and_Benchmarks_Track.pdf) تقييم الصمود
- [C2PA specification](https://c2pa.org/specifications/specifications/) إشارة أصل 格式。
