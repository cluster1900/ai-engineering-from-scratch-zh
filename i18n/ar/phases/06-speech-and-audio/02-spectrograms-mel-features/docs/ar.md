# المجموعات المتطرفة، مقياس ميل ومصادر الصوت

> شبكة العصبية غير مناسبة بشكل مباشر للاستهلاك من أشكال الموجات الخامة. فهي تستهلك الطيف. فهي تستهلك الطيف.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 01 (Audio Fundamentals)
**Time:** ~45 分钟

## 问题

خذ شريط 10 ثانية 16 كيلوهرتز هذا 160 ألف طائرة`[-1, 1]`، و تقريبا مع علامة "كلب اللحوم" أو "الكلمة القط" 完全 غير مرتبطة.

يضغط البرنامج على التفاصيل الزمنية التي يتجاهلها الإدراك البشري (<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

طيف ميل  مزيد من التقدم. البشر على نحو مقارنة مع الأرقام الحسبانة: 100 هرتز مقابل 200 هرتز  الصوت مع 1000 هرتز مقابل 2000 هرتز هو  نفس المسافة .

## 概念

![Waveform to STFT to mel spectrogram to MFCC ladder](../assets/mel-features.svg)

**STFT (Short-Time Fourier Transform).**سوف يعد كل إطار 乘以 وظيفة نافذة ان هو默认选择; هاميغ 取舍略有不同) 对每个框架做FFT把大小谱 堆叠成形为`(n_frames, n_freq_bins)`ماتريكس، هذا هو طيفك

**Log-magnitude.**الحجم الخام 跨越 5-6 个数量级──使用 `log(|X| + 1e-6)`أو`20 * log10(|X|)`لضغط النطاق الديناميكي. كل خط إنتاج يستخدم حجم الحسابات، وليس الحجم الخام.

**Mel scale.**تردد حرارة`f` من خلال `m = 2595 * log10(1 + f / 700)`映射到 mel `m`◊ يجب أن يتم تصويرها في 1 كيلوهرتز أدناه على الاطلاق ، في 1 كيلوهرتز أدناه على الاطلاق على الاطلاق على الاطلاق على الاطلاق

**Mel filterbank.**مجموعة في مقياس الميل 上等间排列的三角式过── كل مرشح هو المجموع الموزن للفنادق المجاورة FFT── سوف تكون حجم STFT 乘以 المصفوفة المصفوفة،即可通过一次 ماتمل 得到 mel спект로그램──

**Log-mel spectrogram.** `log(mel_spec + 1e-10)` دخول الهمس‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**MFCCs.**取 log-mail spectrogram,应用 DCT(نوع الثاني) ، الحفاظ على قبل 13 个系数── سوف تذهب إلى ميزة ذات صلة ومضغوطة المزيد── في حوالي عام 2015 قبل أن كانت ميزة رئيسية، بعد ذلك على أساس السجلات الخام CNNs / Transformers 赶到了 .

**Resolution trade.**ففت أكبر = تحديد تردد أفضل، ولكن تحديد الوقت أقل  25 ms / 10 ms هو الصوت-ML 默认值;音乐使用 50 ms / 12.5 ms; تحديد انتقالية(ضربات الطبول، عكسية) استخدام 5 ms / 2 ms。


```figure
spectrogram-window
```

## بناءها

### الخطوة الأولى: على

```python
def frame(signal, frame_len, hop):
    n = 1 + (len(signal) - frame_len) // hop
    return [signal[i * hop : i * hop + frame_len] for i in range(n)]
```

شريط 10 ثواني 16 كيلوهرتز، في`frame_len=400, hop=160`ستنتج 998 إطار

### 步骤 2: نافذة Hann

```python
import math

def hann(N):
    return [0.5 * (1 - math.cos(2 * math.pi * n / (N - 1))) for n in range(N)]
```

في FFT  قبل كل عنصر في المعدل. فإنه سوف يزيل التسربات الطيفية الناجمة عن قطع نقطة غير التنفيذية.

### 步骤 3: حجم STFT

```python
def stft_magnitude(signal, frame_len=400, hop=160):
    win = hann(frame_len)
    frames = frame(signal, frame_len, hop)
    return [magnitudes(dft([w * s for w, s in zip(win, f)])) for f in frames]
```

إنتاج استخدام `torch.stft`أو`librosa.stft`(FFT مدعوم ∞ متجهة) ∞ الحلقة في هذا الموقع يستخدم للتعليم ؛ انها سوف تكون في ∞`code/main.py`وسط قصير المقطع 上运行──

### 步骤 4: ميل filterbank

```python
def hz_to_mel(f):
    return 2595.0 * math.log10(1.0 + f / 700.0)

def mel_to_hz(m):
    return 700.0 * (10 ** (m / 2595.0) - 1)

def mel_filterbank(n_mels, n_fft, sr, fmin=0, fmax=None):
    fmax = fmax or sr / 2
    mels = [hz_to_mel(fmin) + (hz_to_mel(fmax) - hz_to_mel(fmin)) * i / (n_mels + 1)
            for i in range(n_mels + 2)]
    hzs = [mel_to_hz(m) for m in mels]
    bins = [int(h * n_fft / sr) for h in hzs]
    fb = [[0.0] * (n_fft // 2 + 1) for _ in range(n_mels)]
    for m in range(n_mels):
        for k in range(bins[m], bins[m + 1]):
            fb[m][k] = (k - bins[m]) / max(1, bins[m + 1] - bins[m])
        for k in range(bins[m + 1], bins[m + 2]):
            fb[m][k] = (bins[m + 2] - k) / max(1, bins[m + 2] - bins[m + 1])
    return fb
```

في`n_fft=400`عندما تغطي 80 كيلوهرتز سأحصل على واحد`(80, 201)`المصفوفة`(n_frames, 201)`حجم STFT ضرب تحويلها، يمكن الحصول عليه`(n_frames, 80)`من طيف الميل

### الخطوة 5: المخطط

```python
def log_mel(mel_spec, eps=1e-10):
    return [[math.log(max(v, eps)) for v in frame] for frame in mel_spec]
```

常见替代方案:`librosa.power_to_db`(دبليو بي إيه المرجعي)`10 * log10(power + eps)`✿ همس 使用更复杂的剪辑 + عادي مثالات ✿参见 همس`log_mel_spectrogram`(‬)

### الخطوة 6: المفوضيات المالية

```python
def dct_ii(x, n_coeffs):
    N = len(x)
    return [
        sum(x[n] * math.cos(math.pi * k * (2 * n + 1) / (2 * N)) for n in range(N))
        for k in range(n_coeffs)
    ]
```

على كل إطار لوج ميل  تطبيق DCT، الحفاظ على قبل 13 ٪ معدل  هذا هو المصفوفة MFCC الخاص بك  الأول معدل عادة ما يتم التخلص من 

## استخدمها

2026 سنة:

| Task | Features |
|------|----------|
| ASR (Whisper, Parakeet, SeamlessM4T) | 80 log-mels, 10 ms hop, 25 ms window |
| TTS acoustic model (VITS, F5-TTS, Kokoro) | 80 mels, 5–12 ms hop，用于精细 temporal control |
| Audio classification (AST, PANNs, BEATs) | 128 log-mels, 10 ms hop |
| Speaker embedding (ECAPA-TDNN, WavLM) | 80 log-mels 或 raw-waveform SSL |
| Music (MusicGen, Stable Audio 2) | EnCodec discrete tokens（不是 mels） |
| Keyword spotting | 40 MFCCs，用于 tiny devices |

经验法则:**如果你不是在处理 music，就从 80 log-mels 开始。**أيّة جانبٍ يتطلب تحمل المسؤولية

## 2026 سيبقى في عائق الإنتاج

- **Mel count mismatch.**استخدم 80 ميل  تدريب، استخدم 128 ميل استنتاج ✿
- **Sample-rate mismatch upstream.**في 22.05 كيلوهرتز  حسابات الميول مع 16 كيلوهرتز مختلفة.
- **dB vs log.***فيسر *توقعات الملفات الموثوقة بدلاً من الملفات الموثوقة* *بعض خطوط الأنابيب HF سوف تكتشف نفسها* *كودك المخصص لا يكتشفها*
- **Normalization drift.**訓練時使用每發表正常化,Inference 时使用全球正常化──這是讓 WER 翻倍的產品錯誤──
- **Leakage from padding.**لـ 末尾 المقطع إجراء التعبئة الصفرية في الأطر المتأخرة تنتج الطيف المسطح.

## 交付 it

保存为 `outputs/skill-feature-extractor.md` هذه المهارة سوف تكون لهدف نموذج محدد  اختيار نوع الميزة  عدد الميل  الإطار / المرجع و التطبيع 

## التدريب

1. **Easy.**运行 `code/main.py`△ يلتقي في تردد من 200 → 4000 هرتز 扫过),并印 كل إطار من argmax mel bin──绘图(可选)并确认它与扫匹配──
2. **Medium.**استخدام `{40, 80, 128}`وسط`n_mels`和 `{200, 400, 800}`وسط`frame_len`重新运行── قياس محور الوقت فوق عرض النطاق الحاد للقمة── أي مجموعة أفضل حل للشيرب؟
3. **Hard.** تحقيق `power_to_db`,并比较 AudioMNIST 上 صغرى سي إن إن تصنيف استخدام:`ref=max`يُذكر أنّه من المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين في المُحَدِّثين.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Frame | 一个 slice | 输入给一次 FFT 的 25 ms waveform chunk。 |
| Hop | Stride | 相邻 frames 之间的 samples；10 ms 是 ASR 默认值。 |
| Window | Hann/Hamming 那类东西 | 逐点 multiplier，将 frame 边缘渐变到零。 |
| STFT | Spectrogram generator | Framed + windowed FFT；产生 time × frequency Matrix。 |
| Mel | Warped frequency | 对数感知 scale；`m = 2595·log10(1 + f/700)`。 |
| Filterbank | 那个 Matrix | 将 STFT 投影到 mel bins 的 triangular filters。 |
| Log-mel | Whisper 的 input | `log(mel_spec + eps)`；在 2026 年已标准化。 |
| MFCC | Old-school feature | log-mel 的 DCT；13 个 coeffs，去相关。 |

## 延伸阅读
- [Davis, Mermelstein (1980). Comparison of parametric representations for monosyllabic word recognition](https://ieeexplore.ieee.org/document/1163420) MFCC 论文──
- [Stevens, Volkmann, Newman (1937). A Scale for the Measurement of the Psychological Magnitude Pitch](https://pubs.aip.org/asa/jasa/article-abstract/8/3/185/735757/) أولى مقياس الميل
- [OpenAI — Whisper source, log_mel_spectrogram](https://github.com/openai/whisper/blob/main/whisper/audio.py) 阅读 إنجاز المرجعية。
- [librosa feature extraction docs](https://librosa.org/doc/main/feature.html) `mfcc`.`melspectrogram`و الإشارة إلى الصعود/ النوافذ
- [NVIDIA NeMo — audio preprocessing](https://docs.nvidia.com/deeplearning/nemo/user-guide/docs/en/main/asr/asr_all.html#featurizers) باستخدام خط أنابيب على نطاق الإنتاج للنماذج باراكيت + كاناري
