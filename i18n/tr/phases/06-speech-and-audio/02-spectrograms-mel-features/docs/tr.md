# Spektrogramlar, Mel Skala ve ses sıklığı özellikleri

> Neural Network, doğrudan tüketilen çiğ dalga biçimi için uygun değildir. Bunlar spektrogram tüketir.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 01 (Audio Fundamentals)
**Time:** ~45 分钟

## 问题

10 saniye 16 kHz'li bir klip alın. 160.000 tane kaynaktan.`[-1, 1]`, ve neredeyse "köpek havlaması" veya " kedi kelimesi" etiketleriyle tamamen ilişkili değildir.

Spektrogram  bu sorunu çözdü. İnsan algısının göz ardı ettiği zaman ayrıntılarını sıkıştırır, algının dikkatini çekmiş yapısını korur ve bu enerjilerin yaklaşık 10~25 ms sürede nasıl değişeceğini gösterir.

Mel spektrogramı  Daha fazla ilerleme. İnsanın sayısal olarak algılama alanı: 100 Hz vs. 200 Hz  1000 Hz vs. 2000 Hz ile eşit mesafe ──mel ölçeği, eğri frekans ekseniyle uyum sağlayacak.

## 概念

![Waveform to STFT to mel spectrogram to MFCC ladder](../assets/mel-features.svg)

**STFT (Short-Time Fourier Transform).** 切成重叠框架 (tipiği ayar: 25 ms penceresi,10 ms hop = 16 kHz 下 400 örnek / 160 örnek)                                                                                                                                                                                                                                                `(n_frames, n_freq_bins)`Matrix. İşte spektrogramın.

**Log-magnitude.**Çiğ büyüklük 跨越 5-6 个量级──使用 `log(|X| + 1e-6)`Ya da`20 * log10(|X|)`Dönemsel aralığı sıkıştırmak için, her üretim borusunun çiğ büyüklük yerine, log büyüklüğü kullanılması gerekir.

**Mel scale.**Hz Orta frekans `f`- Evet .`m = 2595 * log10(1 + f / 700)`映射到 mel `m`◊ Bu harita 1 kHz aşağıda büyüklükte linear, 1 kHz üzerinde büyüklükte sayısal ◊ kapsamı 08 kHz 80 mel binleri standart ASR giriş ◊

**Mel filterbank.**Bir grup mel ölçeğinde yukarıdaki sırayla üçgenli filtreler vardır. Her filtrenin ağırlıklı toplamı, birbirine yakın FFT kutularıdır.

**Log-mel spectrogram.** `log(mel_spec + 1e-10)`❖ Sisper'in girişimi──Parakeet'in girişimi──SeamlessM4T'nin girişimi──2026 yıl genel kullanımı olan ses ön uçları──

**MFCCs.**取 log-mail spektrogram,应用 DCT(type II),保留前 13 个系数──它将去相关功能并进一步缩小──大约2015年之前一直是主导功能,之后基于原始log-mels的CNNs/Transformers 赶到了上来──它仍然用于扬声器识别(x-vectors, ECAPA)──

**Resolution trade.**Daha büyük FFT = daha iyi frekans çözünürlüğü, ama daha kötü zaman çözünürlüğü──25 ms / 10 ms 默认值;音乐使用 50 ms / 12.5 ms;transient detection(drum hits, plosives) 5 ms / 2 ms kullanmak──


```figure
spectrogram-window
```

## Yapın onu.

### Adım 1: Göğüs şekli

```python
def frame(signal, frame_len, hop):
    n = 1 + (len(signal) - frame_len) // hop
    return [signal[i * hop : i * hop + frame_len] for i in range(n)]
```

Bir 10 saniye 16 kHz klip,`frame_len=400, hop=160`998 adet çerçeve oluşacak.

### 步骤 2: Hann penceresi

```python
import math

def hann(N):
    return [0.5 * (1 - math.cos(2 * math.pi * n / (N - 1))) for n in range(N)]
```

FFT'den önce elementlerin birbiriyle çarpılması, non-zero-end nokta kesimi tarafından kaynaklanan spektral sızıntıların ortadan kaldırılmasıdır.

### 步骤 3: STFT büyüklüğü

```python
def stft_magnitude(signal, frame_len=400, hop=160):
    win = hann(frame_len)
    frames = frame(signal, frame_len, hop)
    return [magnitudes(dft([w * s for w, s in zip(win, f)])) for f in frames]
```

Üretim `torch.stft`Ya da`librosa.stft`Bu döngü öğretim için kullanılır.`code/main.py`Orta kısa klip 上运行──

### 4 adım: Mel filterbank

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

- Evet .`n_fft=400`80 kmHz'de bir tane alacağım.`(80, 201)`Matrix.`(n_frames, 201)`STFT büyüklüğü, transposed olarak elde edilebilir.`(n_frames, 80)`Mel spektrogramı.

### 5 adım: log-mel

```python
def log_mel(mel_spec, eps=1e-10):
    return [[math.log(max(v, eps)) for v in frame] for frame in mel_spec]
```

常见替代方案:`librosa.power_to_db`(referans normallaştırılmış dB)`10 * log10(power + eps)`❖ Şapışmak 使用更复杂的剪辑 + normalize 例例(参见 Şapışmanın `log_mel_spectrogram`)。

### 步骤 6: MFCC'ler

```python
def dct_ii(x, n_coeffs):
    N = len(x)
    return [
        sum(x[n] * math.cos(math.pi * k * (2 * n + 1) / (2 * N)) for n in range(N))
        for k in range(n_coeffs)
    ]
```

Her log-mail çerçevesine  DCT uygulamak, 13 ı koefisien korumak.

## Kullan

2026 yıl:

| Task | Features |
|------|----------|
| ASR (Whisper, Parakeet, SeamlessM4T) | 80 log-mels, 10 ms hop, 25 ms window |
| TTS acoustic model (VITS, F5-TTS, Kokoro) | 80 mels, 5–12 ms hop，用于精细 temporal control |
| Audio classification (AST, PANNs, BEATs) | 128 log-mels, 10 ms hop |
| Speaker embedding (ECAPA-TDNN, WavLM) | 80 log-mels 或 raw-waveform SSL |
| Music (MusicGen, Stable Audio 2) | EnCodec discrete tokens（不是 mels） |
| Keyword spotting | 40 MFCCs，用于 tiny devices |

经验法则:**如果你不是在处理 music，就从 80 log-mels 开始。**Herhangi bir yönü sorumluluk taşımak gerekir.

## 2026 yılı hala üretim tuzağına girecek.

- **Mel count mismatch.**80 mels  訓練, 128 mels sonucu kullanın.
- **Sample-rate mismatch upstream.**Bu nedenle, bu durumun daha önce de belirtildiği gibi, bu durumun daha önce de belirtildiği gibi, bu durumun daha önce de belirtildiği gibi, bu durumun daha önce de belirtildiği gibi, bu durumun daha önce de belirtildiği gibi, bu durumun daha önce de belirtildiği gibi, bu durumun sonucunda, bu durumun daha da belirgin bir şekilde belirtilmesi gerekmektedir.
- **dB vs log.**HF boru hattı otomatik olarak tespit edilecek. Özel kodunuz olmayacak.
- **Normalization drift.**訓練時使用每發表標準化,inference 時使用全球標準化──これはWER 倍増の生産バグをさせる──
- **Leakage from padding.**Klip sonuna sıfır dolandırma yapılır. Arka çerçevelerde düz spektrum üretilir.

## - Söyle.

保存为 `outputs/skill-feature-extractor.md`◊ bu beceri ◊ için belirlenmiş model hedefi    seçim özellik tipi ∙ mail count ∙ frame/hop 和 normalization ∙

## 练习

1. **Easy.**运行  İşlem`code/main.py`△ bu bir çırpı olarak toplanır. △ frequency from 200 → 4000 Hz 扫过),并印每 frame 的 argmax mel bin──绘图(可选)并确认它与扫匹配──
2. **Medium.**Kullanım`{40, 80, 128}`Orta `n_mels`和 `{200, 400, 800}`Orta `frame_len`重新运行──测量时间轴 上尖峰带宽──哪种组合最好解析了
3. **Hard.** gerçekleştirmek `power_to_db`,并比较 AudioMNIST 上微小CNN分類器 使用以下输入时的ASR精度:(a) xam log-mel,(b) 带 `ref=max`dB-mel, (c) MFCC-13 + delta + delta-delta── rapor en iyi bir doğruluk──

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
- [Davis, Mermelstein (1980). Comparison of parametric representations for monosyllabic word recognition](https://ieeexplore.ieee.org/document/1163420) MFCC 论文。
- [Stevens, Volkmann, Newman (1937). A Scale for the Measurement of the Psychological Magnitude Pitch](https://pubs.aip.org/asa/jasa/article-abstract/8/3/185/735757/) 原始 mel ölçeği。
- [OpenAI — Whisper source, log_mel_spectrogram](https://github.com/openai/whisper/blob/main/whisper/audio.py) 阅读 referans uygulanması。
- [librosa feature extraction docs](https://librosa.org/doc/main/feature.html) `mfcc`- Evet.`melspectrogram`和 hop/window'ın referansı
- [NVIDIA NeMo — audio preprocessing](https://docs.nvidia.com/deeplearning/nemo/user-guide/docs/en/main/asr/asr_all.html#featurizers)Parakeet + Canary modellerinin üretim ölçeği borusuna göre kullanılmıştır.
