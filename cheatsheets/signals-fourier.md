---
id: signals-fourier
title: Complex Numbers, Fourier and Signals
code: CN
subtitle: 复数旋转、DFT 与 FFT、窗函数、采样、频谱图、梅尔滤波器组与 MFCC。来自课文的 Python。
hue: 290
sources: phases/01-math-foundations/19-complex-numbers, phases/01-math-foundations/20-fourier-transform, phases/06-speech-and-audio/01-audio-fundamentals, phases/06-speech-and-audio/02-spectrograms-mel-features
source_hash: 0f1df4b429171683
---

## Cooley-Tukey FFT，8 点
type: architecture
from: phases/01-math-foundations/20-fourier-transform/docs/en.md

```arch
node | x | 1,1 | x[0..7] | 8 samples
node | even | 2,1 | Even half | x[0,2,4,6]
node | odd | 2,2 | Odd half | x[1,3,5,7]
node | ek | 3,1 | E[0..3] | 4-pt FFT
node | ok | 3,2 | O[0..3] | 4-pt FFT
node | out | 4,1 | X[0..7] | E[k] +/- twiddle * O[k]
edge | x | even | split
edge | x | odd | split
edge | even | ek |
edge | odd | ok |
edge | ek | out | combine
edge | ok | out | twiddle
```

## 从波形到 log-mel 与 MFCC
type: flow
from: phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md, phases/06-speech-and-audio/02-spectrograms-mel-features/code/main.py

1. **Frame**：切 25 ms 窗，hop 为 10 ms。16 kHz 下是 400 和 160 个样本。
2. **Window**：每帧乘以 `hann(N)`。它把边缘渐变到零。
3. **STFT**：对每帧取 FFT 幅度。形状是 `(n_frames, n_freq_bins)`。
4. **Mel**：乘以三角滤波器组。0 到 8 kHz 上 80 个梅尔是 ASR 标准。
5. **Log**：`log(mel_spec + 1e-10)` 压缩动态范围。
6. **MFCC**：对每个 log-mel 帧做 `dct_ii`。保留前 13 个系数。

## 代码中的任务
type: task-table
from: phases/01-math-foundations/19-complex-numbers/docs/en.md, phases/01-math-foundations/20-fourier-transform/docs/en.md, phases/01-math-foundations/20-fourier-transform/code/fourier.py, phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md

| 任务 | 代码 |
|---|---|
| 把一个点旋转 45 度 | `point * euler(math.pi / 4)` |
| 单位圆上的 N 个点 | `roots_of_unity(N)` |
| 变换并求逆，O(N^2) | `dft(x)`，然后 `idft(X)` |
| 快速变换，2 的幂 | `fft(x)` |
| 每个频率的能量 | `power_spectrum(X)` |
| 用 FFT 做线性卷积 | `convolve_fft(x, h)` |
| 把信号切成帧 | `frame(signal, frame_len, hop)` |
| 梅尔滤波器组矩阵 | `mel_filterbank(n_mels, n_fft, sr)` |

## NumPy 与 SciPy 中的频谱
type: annotated-code
lang: python
from: phases/01-math-foundations/19-complex-numbers/docs/en.md, phases/01-math-foundations/20-fourier-transform/docs/en.md, phases/06-speech-and-audio/01-audio-fundamentals/docs/en.md

```python
waveform, sr = sf.read("clip.wav", dtype="float32")  # float32 in [-1, 1]
spectrum = np.fft.fft(signal)
freqs = np.fft.fftfreq(256, d=1/256)  # frequency of each bin
power = np.abs(spectrum) ** 2  # power spectrum
window = windows.hann(256)  # from scipy.signal
result = fftconvolve(signal, kernel, mode='full')
frequencies, times, Zxx = stft(signal, fs=sample_rate, nperseg=256)
spectrogram = np.abs(Zxx) ** 2  # (n_frequencies, n_time_frames)
print(cmath.exp(1j * cmath.pi))  # Euler: close to -1
```

## 从零实现梅尔特征
type: annotated-code
lang: python
from: phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md, phases/06-speech-and-audio/02-spectrograms-mel-features/code/main.py

```python
def hz_to_mel(f):
    return 2595.0 * math.log10(1.0 + f / 700.0)
mag = stft_magnitude(signal, frame_len=400, hop=160)  # Hann + DFT per frame
fb = mel_filterbank(n_mels, n_fft, sr)  # 80 mels, n_fft=400 gives (80, 201)
mel_spec = apply_filterbank(cmag, fb)  # one weighted sum per mel bin
lm = log_transform(mel_spec)  # eps=1e-10
mfcc = dct_ii(lm[len(lm) // 2], 13)  # coefficient 0 is overall energy
```

## 关键公式
type: concepts
from: phases/01-math-foundations/19-complex-numbers/docs/en.md, phases/01-math-foundations/20-fourier-transform/docs/en.md, phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md

- **Multiply**：$(a + bi)(c + di) = (ac - bd) + (ad + bc)i$。模相乘，角相加。
- **Polar**：$r = \sqrt{a^2 + b^2}$ 且 $\theta = \mathop{\mathrm{atan2}}(b, a)$。
- **Euler**：$e^{i\theta} = \cos\theta + i \sin\theta$。乘上它就旋转 $\theta$。
- **DFT**：$X[k] = \sum_{n=0}^{N-1} x[n] \, e^{-2\pi i k n/N}$。
- **Inverse DFT**：正指数和一个 $1/N$ 因子。重建是精确的。
- **Bins**：$f_k = k \cdot f_s / N$，分辨率 $f_s / N$，最大 $f_s / 2$。
- **Convolution theorem**：$x * h = \text{IFFT}(\text{FFT}(x) \cdot \text{FFT}(h))$。
- **Mel**：$m = 2595 \cdot \log_{10}(1 + f / 700)$。

## 采样率
type: command-table
from: phases/06-speech-and-audio/01-audio-fundamentals/docs/en.md

| 命令 | 作用 |
|---|---|
| 8 kHz | 电话。4 kHz 处的奈奎斯特会毁掉辅音。ASR 不要用 |
| 16 kHz | ASR 标准。10 s 片段是 160,000 个浮点数 |
| 22.05 kHz | 较老模型的 TTS vocoder 训练 |
| 24 kHz | 现代 TTS |
| 44.1 kHz | CD 音频、音乐 |
| 48 kHz | 电影、专业音频、高保真 TTS |

## 窗函数
type: command-table
from: phases/01-math-foundations/20-fourier-transform/docs/en.md

| 命令 | 作用 |
|---|---|
| Rectangular | 不加窗。旁瓣 -13 dB。信号在 N 内恰好周期 |
| Hann | 0.5 (1 - cos(2 pi n / (N-1)))。-31 dB。通用 |
| Hamming | 0.54 - 0.46 cos(2 pi n / (N-1))。-42 dB。语音分析 |
| Blackman | 主瓣宽。-58 dB。旁瓣抑制很关键 |

## 数字与默认值
type: defaults
from: phases/06-speech-and-audio/01-audio-fundamentals/docs/en.md, phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 16 kHz 下的帧长 | 400 | 25 ms 窗 |
| 16 kHz 下的 hop | 160 | 10 ms。10 s 得到 998 帧 |
| ASR 的梅尔频带数 | 80 | 音频分类用 128 |
| MFCC 系数 | 13 | 关键词识别用 40 |
| Log-mel epsilon | 1e-10 | 在 log(mel_spec + eps) 里 |
| Log-magnitude epsilon | 1e-6 | 在 log(abs(X) + eps) 里 |
| 16 kHz 下的 1024 点 FFT | 15.6 Hz | 0 到 8 kHz 上 512 个可用频点 |
| PCM 交换格式 | 16-bit | int16，范围正负 32,767 |

## 排障
type: troubleshooting
from: phases/06-speech-and-audio/01-audio-fundamentals/docs/en.md, phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md, phases/01-math-foundations/20-fourier-transform/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 垃圾输出，看起来像模型 bug | 采样率不匹配 | 先对齐采样率。16 kHz 单声道 float32 |
| 7 kHz 音调在 3 kHz 出现峰值 | 高于奈奎斯特的混叠 | 降采样前先低通滤波 |
| 虚假的高频 | 帧边缘的频谱泄漏 | 加 Hann 或 Hamming 窗 |
| 推理时静默失败 | 梅尔数量不匹配，80 对 128 | 两端都记录特征形状 |
| Whisper 的输入不对 | dB-mel，不是 log-mel | 喂 log-mel |
| 生产里 WER 翻倍 | 归一化漂移 | 训练和推理用同一套归一化 |
| 最后几帧频谱平坦 | 末尾零填充 | 对称填充或复制 |
| FFT 卷积绕回来 | DFT 算的是循环卷积 | 零填充到 N + M - 1 |

## 问题
type: qa
from: phases/01-math-foundations/19-complex-numbers/docs/en.md, phases/01-math-foundations/20-fourier-transform/docs/en.md, phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md

- **零填充会增加分辨率吗？** 不会。分辨率需要 $T = 1 / \Delta f$ 秒的数据。
- **为什么只保留前 N/2 + 1 个频点？** 对实数输入，$X[N-k]$ 是 $X[k]$ 的共轭。
- **为什么 i 是旋转？** 乘 i 转 90 度。转两次得到 $i^2 = -1$。
- **RoPE 怎么用这个？** 它旋转 query 和 key。相对位置变成一个角。
- **为什么用梅尔，不用 Hz？** 人按对数听音高。100 到 200 Hz 听起来像 1000 到 2000 Hz。
- **Parseval 说了什么？** 时域和频域的能量相同。

## 提示
type: tips
from: phases/01-math-foundations/19-complex-numbers/docs/en.md, phases/01-math-foundations/20-fourier-transform/docs/en.md, phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md

- 从 80 个 log-mel 开始，除非你做音乐。
- 更大的 FFT 给出更好的频率分辨率和更差的时间分辨率。
- FFT 用 2 的幂长度。零填充到下一个 2 的幂。
- N 个单位根模为 1，和为零。
- 用 x 检查 `idft(dft(x))`。必须匹配到机器精度。
- MFCC 系数 0 编码总体能量。模型通常丢掉它。
