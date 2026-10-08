# 音频基础  波形、采样、Fourier Transform

> أشكال الموجات هي إشارة خامة. الأسكتروغرامات هي أشكال تعبير.

**类型：**學习
**语言：**بايثون
**前置要求：**المرحلة 1 · 06 (مقاطع ومصفوفات) ، المرحلة 1 · 14 (概率分布)
**时间：**45 دقيقة

## 问题

麦克风会产生信号压力对时间――你的神经网络 消耗器──之间有一套约定,一旦违反,就会产生无声的 bug:模型 训练看起来正常但 WER 翻倍,或 TTS 发布后带有声,或语音克隆系统 记得麦克风而不是说话人──

كل حذية في أنظمة الكلام تعود إلى واحدة من ثلاثة مشاكل:

1. ما هي معدلات الاختبار؟ ما هي توقعات النموذج؟
2. إشارة هو أو لا مستعار؟
3. هل أنت في عملية العينات الخامة أو تمثيل التردد؟

إذا قمت بتحقيق هذه المشكلة، فالباقي من المرحلة 6 يمكن التعامل معه.

## 概念

![Waveform, sampling, DFT, and frequency bins visualized](../assets/audio-fundamentals.svg)

**Waveform。** `[-1.0, 1.0]`中一维浮动阵列──按样本号索引──要转换为秒,除以样本率:`t = n / sr`كليب 16 كيلوهرتز 10 ثانية هو مُصفّح يحتوي على 160 ألف طائرة عائمة

**Sampling rate (sr)。**في كل ثانية كم عدد العينات؟

| Rate | Use |
|------|-----|
| 8 kHz | Telephony、legacy VOIP。Nyquist 在 4 kHz，会损失辅音。ASR 中应避免。 |
| 16 kHz | ASR 标准。Whisper、Parakeet、SeamlessM4T v2 都使用 16 kHz。 |
| 22.05 kHz | 较旧 models 的 TTS vocoder training。 |
| 24 kHz | 现代 TTS（Kokoro、F5-TTS、xTTS v2）。 |
| 44.1 kHz | CD audio、music。 |
| 48 kHz | Film、pro audio、high-fidelity TTS（VALL-E 2、NaturalSpeech 3）。 |

**Nyquist-Shannon。** `sr`معدل العينة يمكن أن يوضح أعلى`sr/2`تردداتها`sr/2`边界是 * Nyquist تردد*。高于 Nyquist 的能量会被 *aliased*,也就是折叠到更低的频率中,并污染信号──下样式 前始终需要低通过过过──

**Bit depth。**16 بت PCM ((موقع int16, مجموعة ±32,767) هو通用交换格式──音乐用24 بت,内部 DSP用32 بت flot──像 `soundfile`هذا النوع من المكتبات ستقرأ في 16، ولكن تعرض`[-1, 1]`وسط صفوف float32

**Fourier Transform。**أي إشارة محدودة 都是 مختلف ترددات 之和──تحول فوريه متواضع (DFT) على`N`عينة 计算 `N`معايير معقدة، وذلك لكل تردد`bin k`映射到频率 `k · sr / N`هز، والعظم هو هذا التردد، والعرض هو المرحلة.

**FFT。**تحويل فوريه سريع:当 `N`هو 2 时, يستخدم في DFT `O(N log N)`خوارزمية. كل مكتبة صوتية 底层都使用FFT──16 kHz 下 1024-نموذج FFT 会给出 512 个可用频箱,覆盖 08 kHz,解析为 15.6 Hz──

**Framing + window。**لن نقوم بقطع كل المقطع على الفور. سوف نقوم بقطع كل المقطع على الفور.


```figure
mel-scale
```

## بناءها

### الخطوة 1: قراءة المقطع و رسم شكل الموجة

`code/main.py`فقط استخدام الملفات`wave`الوحدة، للحفاظ على التجربة 无依赖――`soundfile`أو`torchaudio.load`(两者都回归 `(waveform, sr)`(أربعة):

```python
import soundfile as sf
waveform, sr = sf.read("clip.wav", dtype="float32")  # shape (T,), sr=int
```

### الخطوة الثانية: من المبدأ الأول

```python
import math

def sine(freq_hz, sr, seconds, amp=0.5):
    n = int(sr * seconds)
    return [amp * math.sin(2 * math.pi * freq_hz * i / sr) for i in range(n)]
```

16 كيلوهرتز 下持续 1 秒 440 هرتز سينوس(مؤتمر A) هو 16000 个浮点──使用16位 PCM编码,通过 `wave.open(..., "wb")`-كتابة

### 步骤 3: كتابة كتابة

```python
def dft(x):
    N = len(x)
    out = []
    for k in range(N):
        re = sum(x[n] * math.cos(-2 * math.pi * k * n / N) for n in range(N))
        im = sum(x[n] * math.sin(-2 * math.pi * k * n / N) for n in range(N))
        out.append((re, im))
    return out
```

`O(N²)` على `N=256`لا يوجد مشكلة في التأكد من الصوت الحقيقي`numpy.fft.rfft`أو`torch.fft.rfft`.

### الخطوة الرابعة: إيجاد التردد المهيمن

مؤشر ذروة الحجم`k_star`映射到频率 `k_star * sr / N`في 440 هرتز الصناعي 上运行时,应返回位于bin `440 * N / sr`ذروة

### 步骤 5: عرض الاسم التلقائي

以 10 كيلو هرتز 采样 7 كيلو هرتز سينوس ((نيكوست = 5 كيلو هرتز) ⋅7 كيلو هرتز طنز 高于نيكوست,会折叠到 `10 − 7 = 3 kHz` ذروة FFT 会出现在 3 kHz──这是 الادم الاكتفاء الكلاسيكي، و هو أيضا السبب في كل DAC / ADC 都配有 حائط الطوب حائط منخفض الممر المرور فلتر──

## استخدمها

2026 سنة عملية تجارة:

| Task | Library | Why |
|------|---------|-----|
| 读/写 WAV/FLAC/OGG | `soundfile`（libsndfile wrapper） | 最快、稳定、返回 float32。 |
| Resample | `torchaudio.transforms.Resample` 或 `librosa.resample` | 内置正确的 anti-aliasing。 |
| STFT / Mel | `torchaudio` 或 `librosa` | GPU-friendly；PyTorch ecosystem。 |
| Real-time streaming | `sounddevice` 或 `pyaudio` | Cross-platform PortAudio bindings。 |
| Inspect a file | `ffprobe` 或 `soxi` | CLI、快速、报告 sr/channels/codec。 |

قواعد القرار:**先匹配 sample rate，再匹配其他任何东西**✿ ضوس ✿ توقع 16 كيلو هرتز مونو فلوات32٬٬ ✿ إرسالها إلى 44.1 كيلو هرتز استرييو، ستحصل على نظرة مثل النموذج حطام النموذج

## 交付 it

保存为 `outputs/skill-audio-loader.md`◊ هذه المهارة ‬ ساعدتك على فحص المدخلات الصوتية إذا كانت تتطابق مع توقعات النموذج، وإذا لم تتطابق مع ذلك، فعلى الرغم من ذلك، فهي ستقوم بإعادة عيناتها بشكل صحيح‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## التدريب

1. **简单。**في 16 كيلوهرتز أسفل التكوين 1 ثانية 220 هرتز + 440 هرتز + 880 هرتز 混合音──运行 DFT──确认在预期桶中处有三个峰──
2. **中等。**录制一段 48 كيلوهرتز、3 ثانية من WAV الخاص بك 语音──使用 `torchaudio.transforms.Resample`(带 anti-aliasing) downsample إلى 16 kHz، ثم باستخدام العشر البديهية (((كل ثلاثة عينات 取 واحدة) downsample إلى 16 kHz──对两者做FFT──aliasing 出现在哪里?
3. **困难。**فقط استخدم`math`و الخطوة 3 من DFT، من صفر بناء STFT──الإطار حجم 400،hop 160,ان نافذة──`matplotlib.pyplot.imshow`رسم الكبرى، وهذه هي المجموعة الطيفية للدرس 02

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sample rate | 每秒多少个 samples | ADC 测量 signal 的 frequency，单位为 Hz。 |
| Nyquist | 你可以表示的最大 frequency | `sr/2`；高于它的能量会 alias 回低频。 |
| Bit depth | 每个 sample 的 resolution | `int16` = 65,536 levels；`float32` = `[-1, 1]` 中的 24-bit precision。 |
| DFT | sequences 的 Fourier Transform | `N` samples → `N` 个 complex frequency coefficients。 |
| FFT | 快速 DFT | `O(N log N)` algorithm，要求 `N` = 2 的幂。 |
| Bin | Frequency column | `k · sr / N` Hz；resolution = `sr / N`。 |
| STFT | Spectrogram 的底层机制 | 随时间进行 framed + windowed FFT。 |
| Aliasing | 奇怪的 frequency 幽影 | 高于 Nyquist 的能量镜像到更低 bins。 |

## 延伸阅读

- [Shannon (1949). Communication in the Presence of Noise](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf)نظرية العينات 背后的论文。
- [Smith — The Scientist and Engineer's Guide to Digital Signal Processing](https://www.dspguide.com/ch8.htm) 免费、经典的DSP教科书──
- [librosa docs — audio primer](https://librosa.org/doc/latest/tutorial.html) 带代码的实用走过──
- [Heinrich Kuttruff — Room Acoustics (6th ed.)](https://www.routledge.com/Room-Acoustics/Kuttruff/p/book/9781482260434) استغلال لفهم لماذا الصوت الحقيقي العالم ليس مجرد المعلومات المرجعية للخلف الصناعي
- [Steve Eddins — FFT Interpretation notebook](https://blogs.mathworks.com/steve/2020/03/30/fft-spectrum-and-spectral-densities/) باستخدام 10 دقيقة لتصفية تردد بن 直觉
