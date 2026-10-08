# 音频基础  波形、采样、Fourier Transform

> Dalga şekilleri çiğ sinyallerdir. Spektrogramlar biçimlerini ifade eder.

**类型：**Öğrenme
**语言：**Python
**前置要求：**1 · 06 aşaması (Vektorlar ve Matrisler), 1 · 14 aşaması (概率分布)
**时间：**~ 45 dakika

## 问题

麦克风 will generate a pressure-vs-time signal── Your Neural Network consume tensors── 它们之间有一套约定, once violated,就会产生无声的 bug:model 训练看起来正常但 WER 翻倍,或 TTS 发布后带有声,或语音克隆系统 记得麦克风而不是说话人──

Konuşma sistemlerinde her bir hata üç sorunun birinden kaynaklanır:

1. Veriler hangi örnek oranı ile kaydedildi?
2. - İsim, yani is not alias?
3. Çiğ örnekler üzerinde çalışıyorsun, frekans temsilinde çalışıyorsun?

Bu işleri yaparsanız, 6. aşamada kalan kısmı da işlenebilir. Hata yaparsanız, Whisper-Large-v4 bile çöp sonuçları doğuracaktır.

## 概念

![Waveform, sampling, DFT, and frequency bins visualized](../assets/audio-fundamentals.svg)

**Waveform。** `[-1.0, 1.0]`İçinde bir boyutlu yüzen dizisi, örnek numarasına göre, 索引, 索引, 转换为秒,除以样品率:`t = n / sr`16 kHz,10 saniyelik bir klip 160.000 tane yüzen bir dizi içerir.

**Sampling rate (sr)。**Her saniye kaç numune var? 2026 yılın normal görüldüğü oran:

| Rate | Use |
|------|-----|
| 8 kHz | Telephony、legacy VOIP。Nyquist 在 4 kHz，会损失辅音。ASR 中应避免。 |
| 16 kHz | ASR 标准。Whisper、Parakeet、SeamlessM4T v2 都使用 16 kHz。 |
| 22.05 kHz | 较旧 models 的 TTS vocoder training。 |
| 24 kHz | 现代 TTS（Kokoro、F5-TTS、xTTS v2）。 |
| 44.1 kHz | CD audio、music。 |
| 48 kHz | Film、pro audio、high-fidelity TTS（VALL-E 2、NaturalSpeech 3）。 |

**Nyquist-Shannon。** `sr`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `sr/2`- Evet.`sr/2`边界是 *Nyquist frekansı*。高于 Nyquist'in enerjisi *aliased*,也就是折叠到更低的频率中,并污染信号──下样式 前始终需要低通过过──

**Bit depth。**16 bit PCM ((signature int16, range ±32,767) is通用交换格式──音乐用24 bit,内部 DSP用32 bit float──像 `soundfile`Bu kitapta 16'dan fazla bilgi var ama açıkça görüldü.`[-1, 1]`Orta float32 dizisi

**Fourier Transform。**任意有限信号 都是不同频的阴道之和──Diskret Fourier Transform (DFT) 对于 `N`个 örnekler 计算 `N`个 karmaşık katılık,也就是每个频 bin 一个──`bin k`映射到频率   映射到频率`k · sr / N`Hz. Büyüklük bu frekansın genişliği, açı fazıdır.

**FFT。**Hızlı Fourier Değişimi:当 `N`DFT'de kullanılır.`O(N log N)`Algoritm.  her ses kütüphanesi 底层都使用FFT──16 kHz 下 1024 örnek FFT 会给出512 可用频桶,覆盖08 kHz,解析为15.6 Hz──

**Framing + window。**Biz tüm klip için FFT yapmayız. Biz onu üzerine dönen *frame'lere ayırırız. Genellikle 25 ms, 10 ms'dir. Her frame'i pencere işleviyle kullanırız.


```figure
mel-scale
```

## Yapın onu.

### 步骤 1:读取 clip 并绘制波形

`code/main.py`Sadece kullanın.`wave`Modül, demo tutmak için kullanılır.`soundfile`Ya da`torchaudio.load`(两者都回归)`(waveform, sr)`Tüpler:

```python
import soundfile as sf
waveform, sr = sf.read("clip.wav", dtype="float32")  # shape (T,), sr=int
```

### 步骤 2: İlk doğadan sinüs dalgası

```python
import math

def sine(freq_hz, sr, seconds, amp=0.5):
    n = int(sr * seconds)
    return [amp * math.sin(2 * math.pi * freq_hz * i / sr) for i in range(n)]
```

16 kHz 下持续 1 秒的 440 Hz sine(koncert A) 16,000 个浮点──使用16 bit PCM kodlaması,通过 `wave.open(..., "wb")`- Yazıştı.

### 步骤 3: Handaş Yazın

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

`O(N²)`  `N=256`Doğruyu doğrulamak için sorun yok ama gerçek ses için gerek yok.`numpy.fft.rfft`Ya da`torch.fft.rfft`- Evet.

### 4 adım: baskın frekansı bul

Büyüklük zirvesi endeksi `k_star`映射到频率   映射到频率`k_star * sr / N`△ 440 Hz sine 上运行时,应返回位于bin `440 * N / sr`- En yüksek noktada.

### 步骤 5: gösterim isim değiştirme

E 10 kHz 采样 7 kHz sine ((Nyquist = 5 kHz) ⋅7 kHz ton 高于 Nyquist,会折叠到 `10 − 7 = 3 kHz`◦FFT zirvesi 3 kHz'de gerçekleşir. Bu klasik bir demo, ayrıca her DAC/ADC'nin tuğla duvarı düşük geçiş filtreye sahip olmasının nedeni.

## Kullan

2026 yılın gerçekleşmesi:

| Task | Library | Why |
|------|---------|-----|
| 读/写 WAV/FLAC/OGG | `soundfile`（libsndfile wrapper） | 最快、稳定、返回 float32。 |
| Resample | `torchaudio.transforms.Resample` 或 `librosa.resample` | 内置正确的 anti-aliasing。 |
| STFT / Mel | `torchaudio` 或 `librosa` | GPU-friendly；PyTorch ecosystem。 |
| Real-time streaming | `sounddevice` 或 `pyaudio` | Cross-platform PortAudio bindings。 |
| Inspect a file | `ffprobe` 或 `soxi` | CLI、快速、报告 sr/channels/codec。 |

决策规则:**先匹配 sample rate，再匹配其他任何东西**❖ Şapış ♀️ 16 kHz mono float32♦ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀️ ♀

## - Söyle.

保存为 `outputs/skill-audio-loader.md`Bu beceri ◊ size ses girişini kontrol etmenize yardımcı olur.

## 练习

1. **简单。**16 kHz'de aşağıda bir saniyelik 220 Hz + 440 Hz + 880 Hz 混合音──运行 DFT──确认在预期 tins 处有三峰──
2. **中等。**48 kHz'de kayıt yapın.`torchaudio.transforms.Resample`(带 anti-aliasing) downsample to 16 kHz, then use naive decimation (((per three sample take one) downsample to 16 kHz──对两者做FFT──aliasing 出现在哪里?
3. **困难。**Sadece kullan `math`Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacaklar: Yapacak: Yapacak: Yapacak: Yapacak: Yapacak: Yapacak: Yapacak: Yapacak: Yapacak: Yapacak: Yapacak: Yapacak: Yapacak: Yapacak: Yapacak: Yapa`matplotlib.pyplot.imshow`Büyüklükleri çizmek. İşte 02 dersin spektrogramı.

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

- [Shannon (1949). Communication in the Presence of Noise](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf) örnekleme teoremi 背后的论文──
- [Smith — The Scientist and Engineer's Guide to Digital Signal Processing](https://www.dspguide.com/ch8.htm) 免费、经典的DSP 教科书──
- [librosa docs — audio primer](https://librosa.org/doc/latest/tutorial.html) 带代码的实用走廊──
- [Heinrich Kuttruff — Room Acoustics (6th ed.)](https://www.routledge.com/Room-Acoustics/Kuttruff/p/book/9781482260434) Gerçek dünya sesinin neden temiz sinusoid değil anlamaya yöneliktir.
- [Steve Eddins — FFT Interpretation notebook](https://blogs.mathworks.com/steve/2020/03/30/fft-spectrum-and-spectral-densities/)10 dakika sonra frekansı temizle.
