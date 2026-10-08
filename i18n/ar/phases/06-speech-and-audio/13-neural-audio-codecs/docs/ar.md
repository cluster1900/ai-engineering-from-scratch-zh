# كوديكات الصوت العصبي  EnCodec، SNAC، Mimi، DAC 和 تقسيم التسمية والصوتية

> 2026 سنة الصوت توليد تقريبا كل من الـ Token. EnCodec、SNAC、Mimi 和 DAC 会把连续波形转换为变former 可以预测的离散序列──语义对音频 拆分,即第一代码书 作为语义,其余作为音频,是自变former 以来音频领域最重要的结构转变──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 10 · 11 (Quantization), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 问题

语言模型处理离散 Token──音频是连续的── إذا كنت تريد أن تبني نموذجًا في مجال الجامعة للأنسجة / الموسيقى مثل MusicGen、Moshi、Sesame CSM、VibeVoice、Orpheus، فأنت بحاجة إلى واحد أولاً**neural audio codec**: إعدادات عبر التعلم، تفرق الصوت إلى علامة كلمة صغيرة،并配套 إعدادات لتعيد بناءها بشكل جديد.

ظهرت عائلات:

1. **Reconstruction-first codecs** EnCodec、DAC──优化感知音频质量──Token 是 acoustic 的,它们捕获包括说话人身份、音色、背景噪声在内的一切──
2. **Semantic-first codecs** Mimi (Kyutai)、SpeechTokenizer。强制第一代码簿 编码语言 / 音素内容,通常通过从WavLM蒸蒸得到──后续代码簿 是声学细节──

رؤى السنوات 2024-2026 هي:**当你尝试从文本生成时，纯 reconstruction codec 会给你模糊的语音。**覆盖代码符号的LLM 必须在同一个代码书中同时学习语言结构和声学结构,这无法良好扩展──把它们分开出来,即语义代码书 0、声学代码书 1-N,正是Moshi 和芝麻CSM 能工作的原因──

## 概念

![Four codec landscape: EnCodec, DAC, SNAC (multi-scale), Mimi (semantic+acoustic)](../assets/codec-comparison.svg)

### 核心技巧:تقييم المتجهات المتبقية (RVQ)

بدلاً من استخدام كتاب كود ضخم، يمكن استخدام ملايين الكود للحصول على جودة جيدة.**RVQ**:一串小代码簿 级联──第一代码簿 量化编码器 输出;第二代量化残留;依此类推──每代码簿有1024 代码簿──8 代码簿 = 1024^8 = 10^24 的有效词表──

في الاستنتاج، سوف يقوم المُعَدِّد بإنشاء كل رمز من كلّ المُختَرَفين

### أربعة أهم مقاطع في عام 2026

**EnCodec (Meta, 2022)。**基线──基于波形的编码码器-decoder,RVQ瓶──24kHz,最多可用32 代码书,默认4 代码书 @ 1.5 kbps──使用 `1D conv + transformer + 1D conv`架构──MusicGen استخدامها──

**DAC (Descript, 2023)。**استخدام L2 كتاب كود طبيعي ∆ دوري فعالية وظيفة وتحسين RVQ ∆ خسارة ∆ في جميع الكودك المفتوحة أعلى، في بعض الأحيان استخدام 12 كتاب كود ∆ مع الأصلي ∆ تقريبا لا يمكن التمييز ∆ 44.1 kHz ∆

**SNAC (Hubert Siuzdak, 2024)。**المجموعة المتعددة من المعدلات RVQ، المعدل الإطارية للكود الكبرى القاسية 低 من الكود الكبرى القاسية  عمليا على مستوى من الصيغة  رسم  زيادة 50 Hz  أورفيوس-3B استخدامه، لأن هذه الهيكلات القاسية تتصور بشكل جيد إلى إنتاج LM 

**Mimi (Kyutai, 2024)。**2026 年的关键突破──12.5 هرتز معدلات الإطار(极低),8 个代码簿 @ 4.4 kbps──代码簿 0 是 **从 WavLM distill 得到的**، التدريب الهدف هو التنبؤ الموجة من المكونات الصوتية الصوتية. الكتب 1-7 هي بقايا الصوتية.

### معدل الإطار مهم جداً لتنمية اللغة

معدل الإطار أقل = سلسلة قصيرة = LM أسرع

| Codec | Frame rate | 1 s = N frames | 适合 |
|-------|-----------|----------------|---------|
| EnCodec-24k | 75 Hz | 75 | 音乐、通用音频 |
| DAC-44.1k | 86 Hz | 86 | 高保真音乐 |
| SNAC-24k (coarse) | ~12 Hz | 12 | AR-LM 高效生成 |
| Mimi | 12.5 Hz | 12.5 | 流式语音 |

في 12.5 هرتز أسفل، 10 ثانية فقط 125 إطار كوديك، يمكن للمتحول بسهولة التنبؤ بهم.

### 语义 رمز مقابل صوت学 رمز

```
frame_t → [semantic_token_t, acoustic_token_0_t, acoustic_token_1_t, ..., acoustic_token_6_t]
```

- **Semantic token（Mimi 中的 codebook 0）。**编码说了什么,即音素、词、内容──通过辅助预测 فقدان من الموجة المزروعة 得到──
- **Acoustic tokens（codebooks 1-7）。**编码音色、说话人身份、律、背景噪音、精细细节──

AR LM 先预测 رمزية ((以文本为条件),再预测 رمزية صوتية ((以语音 + مرجع المتحدث 为条件) ・・・ هذا التعامل هو TTS الحديث 能够零射 克隆声音的原因:

### 2026 جودة إعادة الإعمار ((بيتات في الثانية، بيترات 越低越好)

| Codec | Bitrate | PESQ | ViSQOL |
|-------|---------|------|--------|
| Opus-20kbps | 20 kbps | 4.0 | 4.3 |
| EnCodec-6kbps | 6 kbps | 3.2 | 3.8 |
| DAC-6kbps | 6 kbps | 3.5 | 4.0 |
| SNAC-3kbps | 3 kbps | 3.3 | 3.8 |
| Mimi-4.4kbps | 4.4 kbps | 3.1 | 3.7 |

像Opus مثل codec التقليدي في كل بيت من الاعتبار نوعية لا تزال ننتصر.**离散 Token**(أوبوس 不产生这种 Token) و **generative-model quality**(LM 能如何使用这些代币)


```figure
rvq-codec-cascade
```

## بناءها

### 步骤 1: استخدام EnCodec تشفير

```python
from encodec import EncodecModel
import torch

model = EncodecModel.encodec_model_24khz()
model.set_target_bandwidth(6.0)  # kbps

wav = torch.randn(1, 1, 24000)
with torch.no_grad():
    encoded = model.encode(wav)
codes, scale = encoded[0]
# codes: (1, n_codebooks, n_frames), dtype=int64
```

6 كيبس 时`n_codebooks=8`كل رمز هو 0-1023(10 بت)

### الخطوة 2: إعادة تشكيل القياس

```python
with torch.no_grad():
    wav_recon = model.decode([(codes, scale)])

from torchaudio.functional import compute_deltas
import torch.nn.functional as F

mse = F.mse_loss(wav_recon[:, :, :wav.shape[-1]], wav).item()
```

### 步骤 3: الانقسام السمينتي-الاصوتي

```python
from moshi.models import loaders
mimi = loaders.get_mimi()

with torch.no_grad():
    codes = mimi.encode(wav)  # shape (1, 8, frames@12.5Hz)

semantic = codes[:, 0]
acoustic = codes[:, 1:]
```

كتاب التعليمات التعليمية 0 مع WavLM على齐── يمكنك تدريب صانع النص إلى النص، كلمة表比直接到音频小得多── ثم، واحد منفصلة صوتية إلى موجة تشكيل المقطع العشوائي 以 المتحدث مرجع 为条件──

### الخطوة 4: لماذا رمز الكوديك فوق AR LM قابل للتنفيذ

بالنسبة لميمي 12.5 هرتز × 8 كتاب كود، واحد 10 ثانية 语音片段:

```
N_tokens = 10 * 12.5 * 8 = 1000 tokens
```

1000 رمز على المحول يعد صغيراً جداً على التالي. محول ذو 256 م يمكن أن يُولد في GPU الحديثة على مستوى ملي ثانية بـ 10 ثوانٍ.

## استخدمها

问题 → كوديك 映射:

| Task | Codec |
|------|-------|
| 通用音乐生成 | EnCodec-24k |
| 最高保真 reconstruction | DAC-44.1k |
| 覆盖语音的 AR LM (TTS) | SNAC or Mimi |
| 流式全双工语音 | Mimi (12.5 Hz) |
| 带文本的音效库 | EnCodec + T5 condition |
| 细粒度音频编辑 | DAC + inpainting |

经验法则:**如果你在构建 generative model，从 Mimi 或 SNAC 开始。如果你在构建压缩 pipeline，使用 Opus。**

## 常见坑

- **Codebook 太多。**إضافة كتاب التعليمات العلمية تحسين الوفاء، ولكن أيضا تحسين الوصول إلى LM 序列长度── توقف في 8-12 个──
- **Frame-rate mismatch。**في 12.5 هرتز (ميمي) ، ثم في 50 هرتز (إنكوديك) ، ثمّ أضعف، ثمّ يُفشل.
- **假设所有 codebook 都等价。**في ميمي، كتاب التعليمات 0  تحمل المحتوى؛ فقدانها سوف تدمير قابلة للتفهم. فقدان كتاب التعليمات 7  تقريبا لا يدرك.
- **把 reconstruction quality 当作唯一指标。**إذا كان الهيكل الزمني سيئا جدا، فإن كوديك حتى إعادة الإعمار جيد جدا، وربما لا فائدة لإنتاج القواعد المستندة إلى LM.

## 交付 it

保存为 `outputs/skill-codec-picker.md` لمهام محددة لإنتاج أو ضغط اختيار كوديك

## التدريب

1. **Easy。**运行 `code/main.py`◊ لقد تم تحقيق كمياتية لعبة مقياسية + بقية،并测量 مع إضافة خطأ إعادة بناء الكودكوب 如何变化‬
2. **Medium。**إعداد`encodec`, في الحفاظ على الصوت على مقارنة 1⁄4, 8⁄32 كتاب كودها
3. **Hard。**加载 Mimi──Encode 一片段──把代码簿 0 替换为随机整数;decode──然后以类似的方式替换代代码簿 7──比较这两种破坏,代码簿 0 腐败 应该摧毁可理解度;代码簿 7 腐败 应该几乎不改变任何东西──

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| RVQ | Residual quantization | 小 codebook 级联；每个 codebook 量化前一个 residual。 |
| Frame rate | Codec speed | 每秒有多少个 Token-frame。更低 = 更快的 LM。 |
| Semantic codebook | Codebook 0 (Mimi) | 从 SSL 特征 distill 得到的 codebook；编码内容。 |
| Acoustic codebooks | 其他所有 codebook | 音色、韵律、噪声、精细细节。 |
| PESQ / ViSQOL | Perceptual quality | 与 MOS 相关的客观指标。 |
| EnCodec | Meta codec | RVQ 基线；MusicGen 使用它。 |
| Mimi | Kyutai codec | 12.5 Hz frame rate；semantic-acoustic split；支撑 Moshi。 |

## 延伸阅读

- [Défossez et al. (2023). EnCodec](https://arxiv.org/abs/2210.13438) RVQ 基线。
- [Kumar et al. (2023). Descript Audio Codec (DAC)](https://arxiv.org/abs/2306.06546) أعلى ضمان حقا مفتوحة كوديك
- [Siuzdak (2024). SNAC](https://arxiv.org/abs/2410.14411) RVQ متعدد النطاقات
- [Kyutai (2024). Mimi codec](https://kyutai.org/codec-explainer) الانقسام المفاهيمي الصوتي، التقطير المفاهيم
- [Borsos et al. (2023). AudioLM](https://arxiv.org/abs/2209.03143) 两阶段 تعبيرات/صوتية 范式。
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) أوائل ملفات RvQ القابلة للتدفق
