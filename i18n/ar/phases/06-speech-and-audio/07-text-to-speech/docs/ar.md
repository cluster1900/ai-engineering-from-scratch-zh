# النص إلى الكلام (TTS)  من تاكوترون إلى F5 و Kokoro

> ASR 将语音反转为文本;TTS 将文本反转为语音──2026 年的技术分为三部分:文字 → رمز، رمز → مل، ميل → موجة شکل──每部分都有一个适合笔记本电脑运行的默认模型──

**Type:** Build
**Languages:** Python
**先修要求:**المرحلة 6 · 02 (القطاعات الطيفية & Mel) ، المرحلة 5 · 09 (Seq2Seq) ، المرحلة 7 · 05 (المحول الكامل)
**Time:** ~75 minutes

## 问题

أنت لديك خطوطة:"رجاءً تذكرني بتسقيط النباتات في الساعة السادسة مساءً". أنت تحتاج إلى 3 ثواني من الصوت الصوت الصوتي، اسمع طبيعياً، هل هناك عملية صحيحة ((وقف、重音) ، باستخدام الصوت الصوت الصوتي الصحيح لإصدار "النباتات"، ويمكن أن تكون في CPU على 300 ms داخل النشاط، لدعم مساعد الصوت في الوقت الحقيقي.

أنابيب "هودين تيتس" تبدو هكذا:

1. **Text frontend。**规范化文本(日期、数字、电子邮件),转换为 فونيم أو كلمة فرعية رمز,预测 prosody 特征。
2. **声学模型。**النص → الميل الطيفيات: تاكوترون 2 (2017) ، FastSpeech 2 (2020) ، VITS (2021) ، F5-TTS (2024) ، كوكورو (2024):
3. **Vocoder。**ميل → شكل الموجة──ويف نت (2016) ، وويف آر اين ، HiFi-GAN (2020) ، BigVGAN (2022) ، ومدفوعات المودف العصبي 2024+‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

بحلول عام 2026، مع ظهور نماذج التوزيع والتناسب التدريجي، أصبح الانقسام الصوتي + الصوتي مضحكا. ولكن ما زال هناك ثلاثة أجزاء من النموذج الذهني في التجربة.

## 概念

![Tacotron, FastSpeech, VITS, F5/Kokoro side-by-side](../assets/tts.svg)

**Tacotron 2 (2017)。**Seq2seq:char-embedding → مرموز BiLSTM → الاهتمام الحساس للموقع → مرموز LSTM autoregressive 输出 mel frames──慢(AR),长文本上不稳定──仍被作为基线引用──

**FastSpeech 2 (2020)。**غير ذاتية التراجع.  توقعات الدوران 输出每 Phoneme 获得多少 mel frames──1-pass,比塔科特رون 快 10×──损失一些自然度(مواجهة واحدة) ، ولكن到处都在用──

**VITS (2021)。**通過 الاستنتاج المتغير 将编码 + مدة القائمة على التدفق + vocoder HiFi-GAN 端到端联合训练──质量高,单模型──20222024年主导开源 TTS──变体:YourTTS(متعدد المتحدثين صفر-shot)、XTTS v2(2024,Coqui)──

**F5-TTS (2024)。**基于流量匹配的扩散变压器──自然 prosody,使用5秒参考音频进行零射语音克隆──2026年开源 TTS 排行榜顶尖──335M参数──

**Kokoro (2024)。**小型(82M)、可在CPU 上运行、实时使用场景下一流的英文 TTS──封闭词表、仅英文、apache-2.0──

**OpenAI TTS-1-HD, ElevenLabs v2.5, Google Chirp-3。**商业状态 of the art──ElevenLabs v2.5 的情感标签("[هتتفت]", "[ضحك]")和角色声音 在 2026 年 主导 音频书制作──

### المُتَصَرِّفُ

| Era | Vocoder | Latency | Quality |
|-----|---------|---------|---------|
| 2016 | WaveNet | 仅 offline | 发布时的 SOTA |
| 2018 | WaveRNN | ~realtime | good |
| 2020 | HiFi-GAN | 100× realtime | 接近人类 |
| 2022 | BigVGAN | 50× realtime | 可泛化到不同 speakers/langs |
| 2024 | SNAC, DAC (neural codecs) | 与 AR models 集成 | 离散 Token，比特效率高 |

بحلول عام 2026، معظم نماذج "تتس" كانت من النص إلى نموذج موجة من نهاية إلى نهاية؛ وبرنامج الطيف الميل هو نوع من الإعلانات الداخلية.

### 评估

- **MOS (Mean Opinion Score)。**15 分制,موارد الجماهير.
- **CMOS (Comparative MOS)。**A-vs-B 偏好── كل تحليل من فترات الثقة 更紧──
- **UTMOS, DNSMOS。**لا يوجد أي دليل على أنواع التنبؤات العصبية للمعدل العصبي.
- **CER (Character Error Rate) via ASR。**أن تنفيذ TTS 通过 Whisper,计算与输入文本的 CER──作为理解性的代理──
- **SECS (Speaker Embedding Cosine Similarity)。**النسخ الصوتية 质量。

كتابات اختبار التنظيف 上 of 2026 数字:

| Model | UTMOS | CER (via Whisper) | Size |
|-------|-------|-------------------|------|
| Ground truth | 4.08 | 1.2% | — |
| F5-TTS | 3.95 | 2.1% | 335M |
| XTTS v2 | 3.81 | 3.5% | 470M |
| VITS | 3.62 | 3.1% | 25M |
| Kokoro v0.19 | 3.87 | 1.8% | 82M |
| Parler-TTS Large | 3.76 | 2.8% | 2.3B |


```figure
sp-tts-stack
```

## بناءها

### 步骤 1: تلفونية المدخل

```python
from phonemizer import phonemize
ph = phonemize("Hello world", language="en-us", backend="espeak")
# 'həloʊ wɜːld'
```

الهاتف هو الجسر العام. تجنب إدخال النص الخام إلى نوعية مستوى VITS.

### 步骤 2:运行 Kokoro(2026 CPU 默认)

```python
from kokoro import KPipeline
tts = KPipeline(lang_code="a")  # "a" = American English
audio, sr = tts("Please remind me to water the plants at 6 pm.", voice="af_bella")
# audio: float32 tensor, sr=24000
```

离线运行,单文件,82M پارامس

### الخطوة الثالثة: استخدام النسخ الصوتية

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="my_voice_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please remind me to water the plants.",
)
```

传入一个 5 秒参考片段及其转录;F5 会克隆 prosody 和 timbre。

### الخطوة 4: من الصفر لتحقيق HiFi-GAN vocoder

ضخمة جداً، لا يمكن وضعها في النص التعليمي، لكن شكلها على النحو التالي:

```python
class HiFiGAN(nn.Module):
    def __init__(self, mel_channels=80, upsample_rates=[8, 8, 2, 2]):
        super().__init__()
        # 4 upsample blocks, total 256x to go from mel-rate to audio-rate
        ...
    def forward(self, mel):
        return self.blocks(mel)  # -> waveform
```

訓練:عكسية(تمييز على نوافذ قصيرة) + إعادة بناء الطيف الميل الخسارة + تناغم الميزات الخسارة──已商品化使用 `hifi-gan`نقاط التفتيش المسبقة لتدريبات NVIDIA-NeMo

### 步骤 5: خط الأنابيب الكامل (مخطط مزيف)

```python
text = "Please remind me at 6 pm."
phones = phonemize(text)
mel = acoustic_model(phones, speaker=alice)      # [T, 80]
wav = vocoder(mel)                                # [T * 256]
soundfile.write("out.wav", wav, 24000)
```

## استخدمها

2026 年技术:

| Situation | Pick |
|-----------|------|
| 实时 English voice assistant | Kokoro (CPU) 或 XTTS v2 (GPU) |
| 从 5 s reference 进行 voice cloning | F5-TTS |
| 商业 character voices | ElevenLabs v2.5 |
| Audiobook narration | ElevenLabs v2.5 或 XTTS v2 + fine-tune |
| Low-resource language | 在 5–20 h target-lang data 上训练 VITS |
| Expressive / emotion tags | ElevenLabs v2.5 或 StyleTTS 2 fine-tune |

截至 2026 年的开源领袖:**F5-TTS 代表质量，Kokoro 代表效率**إلا إذا كنت مؤرخاً، لا تختار "تاكوترون"

## فخ

- **没有 text normalizer。**"دكتور سميث" 读作 "دكتور" 还是 "Drive"؟"2026" 读作 "ربعين و ستة" 还是 "ثنان صفر اثنان ستة"?
- **OOV proper nouns。**"Ghumare" → "ghyu-mair"?
- **Clipping。**إنتاج المكالمة  قليل جدا من التقطيع، ولكن الاستنتاج 时 mel مقياس عدم الملاءمة قد تتجاوز ± 1.0──始终使用 `np.clip(wav, -1, 1)`.
- **Sample-rate mismatch。**كوكورو 输出 24 كيلوهرتز; خط أنابيبك التدريجي 期望 16 كيلوهرتز → إعادة العينة، وإلا ستظهر الاسم الأليف:

## 交付 it

保存为 `outputs/skill-tts-designer.md`◊ لـصوت محدد ‬التأخير و لغة هدف ‬تصميم خط أنابيب TTS‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## التدريب

1. **Easy。**运行 `code/main.py` من لغة اللعب 构建 Phoneme قاموس، تقدير مدة كل Phoneme،并打印一个假的"mel" جدول أعمال‬
2. **Medium。**安装 Kokoro,分別使用 صوت `af_bella`和 `am_adam`合成同一句话──比较 مدة الصوت 和主观质量──
3. **Hard。**录制一段你自己的5秒参考片段──使用F5-TTS clone 它──报告引用和克隆输出 之间SECS──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Phoneme | 声音单位 | 抽象声音类别；English 中有 39 个（ARPABet）。 |
| Duration predictor | 每个 Phoneme 持续多久 | Non-AR model output；每个 Phoneme 的整数 frames。 |
| Vocoder | Mel → waveform | 将 mel-spec 映射到 raw samples 的 Neural net。 |
| HiFi-GAN | 标准 vocoder | 基于 GAN；主导 2020–2024。 |
| MOS | 主观质量 | 来自 human raters 的 1–5 mean opinion score。 |
| SECS | Voice-clone metric | target 和 output speaker Embedding 之间的 cosine similarity。 |
| F5-TTS | 2024 开源 SOTA | Flow-matching Diffusion；zero-shot cloning。 |
| Kokoro | CPU English leader | 82M-param model，Apache 2.0。 |

## 延伸阅读

- [Shen et al. (2017). Tacotron 2](https://arxiv.org/abs/1712.05884) خط أساسي بعد التأثير
- [Kim, Kong, Son (2021). VITS](https://arxiv.org/abs/2106.06103) 端到端 على أساس التدفق
- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) 当前开源 SOTA。
- [Kong, Kim, Bae (2020). HiFi-GAN](https://arxiv.org/abs/2010.05646) 2026 سنة لا تزال في إصدار استخدام vocoder。
- [Kokoro-82M on HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M) 2024 TTS الإنجليزية صديقة للمعالجات المركزية
