# 音频基础  波形、采样、Fourier Transform

> Các dạng sóng là tín hiệu nguyên liệu. Các quang phổ là biểu hiện hình thức. Các tính năng của MEL là phù hợp với hình thức ML. Mỗi hệ thống ống ASR và TTS hiện đại đều đi qua tầng này, và giai đoạn đầu tiên là hiểu mẫu và Fourier.

**类型：**Học tập
**语言：**Python
**前置要求：**Giai đoạn 1 · 06 (Vêctor & Matrices), Giai đoạn 1 · 14 (概率分布)
**时间：**~ 45 phút

## 问题

麦克风 sẽ tạo ra một tín hiệu áp lực-về thời gian. Hệ thống thần kinh của bạn tiêu thụ các tensor. Một khi nó bị vi phạm, sẽ tạo ra một bộ lỗi âm thanh.

Mỗi lỗi trong hệ thống nói chuyện đều có thể được tìm thấy trong ba vấn đề:

1. Số liệu là theo tỷ lệ mẫu nào, mô hình mong đợi gì?
2. tín hiệu là không?
3. Bạn đang làm việc trên mẫu nguyên liệu, hoặc đang làm việc trên đại diện tần số?

Để làm việc này, phần còn lại của giai đoạn 6 sẽ được xử lý.

## 概念

![Waveform, sampling, DFT, and frequency bins visualized](../assets/audio-fundamentals.svg)

**Waveform。** `[-1.0, 1.0]`Trong một kích thước float array── theo số mẫu 索引── phải chuyển đổi为秒, trừ theo tỷ lệ mẫu:`t = n / sr`Một clip 16 kHz,10 giây là một bộ sưu tập có 160.000 bộ nổi.

**Sampling rate (sr)。**Mỗi giây có bao nhiêu mẫu.

| Rate | Use |
|------|-----|
| 8 kHz | Telephony、legacy VOIP。Nyquist 在 4 kHz，会损失辅音。ASR 中应避免。 |
| 16 kHz | ASR 标准。Whisper、Parakeet、SeamlessM4T v2 都使用 16 kHz。 |
| 22.05 kHz | 较旧 models 的 TTS vocoder training。 |
| 24 kHz | 现代 TTS（Kokoro、F5-TTS、xTTS v2）。 |
| 44.1 kHz | CD audio、music。 |
| 48 kHz | Film、pro audio、high-fidelity TTS（VALL-E 2、NaturalSpeech 3）。 |

**Nyquist-Shannon。** `sr`Tỷ lệ mẫu có thể xác định cao nhất`sr/2`Các tần số của nó.`sr/2`边界是 *Nýquist tần số*。高于 Nyquist 的能量会被 *aliased*,也就是折叠到更低的频率中,并污染信号──下样式 前始终需要低通过过──

**Bit depth。**PCM 16-bit ((được ký int16, phạm vi ±32,767) là giao dịch chung hình thức──音乐 dùng 24-bit, DSP bên trong dùng 32-bit nổi──像 `soundfile`Như thế sẽ đọc được trong 16 nhưng lộ ra`[-1, 1]`Trung tâm float32 arrays

**Fourier Transform。**任意有限信号 都是不同频的突状体 之和── Diskrete Fourier Transform (DFT) đối với `N`个 mẫu 计算 `N`个 phức tạp hệ số, cũng là mỗi tần số bin một.`bin k`映射到频率 `k · sr / N`Hz──đường độ là tần số trên, góc là giai đoạn──

**FFT。**Chuyển đổi Fourier nhanh:当 `N`là 2 时, được sử dụng cho DFT `O(N log N)`Algoritm── mỗi thư viện âm thanh 底层都使用FFT──16 kHz 下 1024-sample FFT 会给出 512 个可用频箱,覆盖08 kHz,解析度为15.6 Hz──

**Framing + window。**Chúng tôi sẽ không làm FFT cho toàn bộ clip. Chúng tôi sẽ cắt nó thành các khung hình chồng lên. Thông thường là 25 ms, chạy 10 ms.


```figure
mel-scale
```

##  xây dựng nó

### 步骤 1: đọc clip và vẽ hình dạng sóng

`code/main.py`Chỉ sử dụng stdlib `wave`module, để giữ cho demo 无依赖;;`soundfile`Hoặc`torchaudio.load`(两者都回归 `(waveform, sr)`(Tuples):

```python
import soundfile as sf
waveform, sr = sf.read("clip.wav", dtype="float32")  # shape (T,), sr=int
```

### 步骤 2: Từ nguyên tắc đầu tiên tạo sóng xơ

```python
import math

def sine(freq_hz, sr, seconds, amp=0.5):
    n = int(sr * seconds)
    return [amp * math.sin(2 * math.pi * freq_hz * i / sr) for i in range(n)]
```

16 kHz 下持续 1 秒的 440 Hz sine(concert A) là 16.000 个 floats──使用16 bit PCM encoding,通过 `wave.open(..., "wb")`写入.

### 步骤 3: viết tay tính toán DFT

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

`O(N²)` đối với `N=256`Không có vấn đề nào, nhưng không cần thiết cho âm thanh thực.`numpy.fft.rfft`Hoặc`torch.fft.rfft`

### 步骤 4: tìm tần số thống trị

Chỉ số đỉnh độ lớn `k_star`映射到频率 `k_star * sr / N`△ Trong 440 Hz sine 上运行时,应返回位于bin `440 * N / sr`Đỉnh của nó.

### 步骤 5: biểu diễn aliasing

以 10 kHz 采样 7 kHz sine ((Nyquist = 5 kHz) ⋅7 kHz 音 高于 Nyquist,会折叠到 `10 − 7 = 3 kHz`FFT đỉnh 会出现在3kHz──这是经典的号示范,也是每个DAC/ADC都配有墙低通过过的原因──

## Sử dụng nó

2026 năm bạn thực sự sẽ giao hàng:

| Task | Library | Why |
|------|---------|-----|
| 读/写 WAV/FLAC/OGG | `soundfile`（libsndfile wrapper） | 最快、稳定、返回 float32。 |
| Resample | `torchaudio.transforms.Resample` 或 `librosa.resample` | 内置正确的 anti-aliasing。 |
| STFT / Mel | `torchaudio` 或 `librosa` | GPU-friendly；PyTorch ecosystem。 |
| Real-time streaming | `sounddevice` 或 `pyaudio` | Cross-platform PortAudio bindings。 |
| Inspect a file | `ffprobe` 或 `soxi` | CLI、快速、报告 sr/channels/codec。 |

决策规则:**先匹配 sample rate，再匹配其他任何东西**❖ Nhầm ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ ơ   ơ              ơ                                   

## 交付 nó

保存为 `outputs/skill-audio-loader.md`◊ kỹ năng này giúp bạn kiểm tra đầu vào âm thanh có phù hợp với mô hình chơi dưới đây không, và thực sự lấy lại mẫu khi không phù hợp.

## 练习

1. **简单。**Trong 16 kHz 下合成 1 giây của 220 Hz + 440 Hz + 880 Hz 混合音──运行 DFT── xác nhận trong dự kiến thùng 处有三峰──
2. **中等。**录制一段 48 kHz、3 giây của bạn bản thân WAV 语音──使用 `torchaudio.transforms.Resample`(带 chống liên kết) downsample đến 16 kHz, sau đó sử dụng sự phân bố ngây thơ ((( mỗi 3 mẫu lấy một) downsample đến 16 kHz;; đối với hai làm FFT;; liên kết xuất hiện ở đâu?
3. **困难。**Chỉ sử dụng `math`和 bước 3 của DFT, từ零构建 STFT── khung kích thước 400,hop 160,Hann cửa sổ──用 `matplotlib.pyplot.imshow`绘制 quy mô. Đó là phổ của Bài học 02.

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

- [Shannon (1949). Communication in the Presence of Noise](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf) định lý lấy mẫu 背后的论文──
- [Smith — The Scientist and Engineer's Guide to Digital Signal Processing](https://www.dspguide.com/ch8.htm) 免费、经典的DSP 教科书──
- [librosa docs — audio primer](https://librosa.org/doc/latest/tutorial.html) 带代码的实用走过──
- [Heinrich Kuttruff — Room Acoustics (6th ed.)](https://www.routledge.com/Room-Acoustics/Kuttruff/p/book/9781482260434) Để hiểu tại sao âm thanh thế giới thực không phải là tài liệu tham khảo của sinus tinh sạch.
- [Steve Eddins — FFT Interpretation notebook](https://blogs.mathworks.com/steve/2020/03/30/fft-spectrum-and-spectral-densities/) dùng 10 phút để giải quyết tần số của bin 直觉.
