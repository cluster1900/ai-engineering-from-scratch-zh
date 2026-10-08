# 音频基础 波形、采样、Fourier转换

> 波形是原始信号――光谱是表示形式―― 波形的特征是适合ML的形式―― 每个现代的ASR和TTS管道都经过了这个层次的阶段,而第一阶段就是理解采样和Fourier――

**类型：**学习 课程
**语言：**字符串
**前置要求：**阶段1 · 06 (向量和矩阵),阶段1 · 14 (概率分布)
**时间：**时间45分钟

## 问题

麦克风会产生压力与时间信号――你的神经网络消耗器――它们之间有一套约定,一旦违反,就会产生无声的 bug:模型训练看起来正常但 WER 翻倍,或 TTS 发布后带有声,或语音克隆系统记住麦克风而不是说话的人――

语音系统中的每一个错误都追溯到三个问题之一:

1. 根据什么样本率记录,模型预期什么?
2. 信号是否名?
3. 你是在原始样本上操作,还是在频率表示上操作?

现在,我们要把这些搞定,第六阶段的剩余部分就能处理.

## 概念

![Waveform, sampling, DFT, and frequency bins visualized](../assets/audio-fundamentals.svg)

**Waveform。** `[-1.0, 1.0]`中一维浮动阵列――按样本号码索引――要转换为秒,除以样本率:`t = n / sr`△一个16kHz,10秒的剪辑是包含16万个浮动的阵列.

**Sampling rate (sr)。**每秒钟多少样本,2026年常见率:

| Rate | Use |
|------|-----|
| 8 kHz | Telephony、legacy VOIP。Nyquist 在 4 kHz，会损失辅音。ASR 中应避免。 |
| 16 kHz | ASR 标准。Whisper、Parakeet、SeamlessM4T v2 都使用 16 kHz。 |
| 22.05 kHz | 较旧 models 的 TTS vocoder training。 |
| 24 kHz | 现代 TTS（Kokoro、F5-TTS、xTTS v2）。 |
| 44.1 kHz | CD audio、music。 |
| 48 kHz | Film、pro audio、high-fidelity TTS（VALL-E 2、NaturalSpeech 3）。 |

**Nyquist-Shannon。** `sr`样本率可以明确表示最高`sr/2`频率的.`sr/2`边界是尼奎斯特频率高于尼奎斯特的能量会被缩到更低的频率中,并污染信号.

**Bit depth。**通过16位PCM (注:int16,范围32,767) 是通用交换格式──音乐用24位,内部DSP用32位浮式──像`soundfile`这样会读到16个,但暴露了`[-1, 1]`它们的中部是 float32 阵列.

**Fourier Transform。**任意有限信号 都是不同频率的突形 之和──对`N`个样本 计算`N`个复杂系数,也就是每个频率的一个.`bin k`映射到频率`k · sr / N`度是该频率上方的幅度,角是相度.

**FFT。**快速福利尔转换:当 `N`是 2 的时,用于 DFT 的`O(N log N)`每个音频库都使用FFT──16kHz 下1024样本FFT 会提供512个可用频率桶,覆盖08kHz,分辨率为15.6Hz──

**Framing + window。**我们不会对整个片段做FFT──我们把它切成重叠的 *frames*(通常25ms,跳10ms),将每个框乘以窗户函数(Hann、Hamming) 消除边缘不连续,然后对每个框做FFT──这就是短时间福利尔转换 (STFT) ──课程02将从这里继续──


```figure
mel-scale
```

## 构建它

### 步骤1:读取剪辑并绘制波形

`code/main.py`只使用dlib `wave`模块,以保持演示 无依赖.`soundfile`或`torchaudio.load`(两者都回来了)`(waveform, sr)`双:

```python
import soundfile as sf
waveform, sr = sf.read("clip.wav", dtype="float32")  # shape (T,), sr=int
```

### 步骤2:从第一性原理合成弦波

```python
import math

def sine(freq_hz, sr, seconds, amp=0.5):
    n = int(sr * seconds)
    return [amp * math.sin(2 * math.pi * freq_hz * i / sr) for i in range(n)]
```

通过16位PCM编码,通过`wave.open(..., "wb")`写入.

### 步骤3:手写计算 DFT

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

`O(N²)`对`N=256`为了确认正确性没有问题,但对真实的音频没有用.`numpy.fft.rfft`或`torch.fft.rfft`,我知道.

### 步骤4:找到主导频率

极度峰值指数`k_star`映射到频率`k_star * sr / N`应返回位于bin 的位置`440 * N / sr`峰.

### 步骤 5:演示位

以10kHz 采样7kHz弦 尼奎斯特=5kHz) ・7kHz音调 高于尼奎斯特,会折叠到`10 − 7 = 3 kHz`△FFT峰值会出现在3kHz──这是经典的称演示,也是每个DAC/ADC都配有墙低通过器的原因──

## 使用它

现在,我们需要一个新的计划.

| Task | Library | Why |
|------|---------|-----|
| 读/写 WAV/FLAC/OGG | `soundfile`（libsndfile wrapper） | 最快、稳定、返回 float32。 |
| Resample | `torchaudio.transforms.Resample` 或 `librosa.resample` | 内置正确的 anti-aliasing。 |
| STFT / Mel | `torchaudio` 或 `librosa` | GPU-friendly；PyTorch ecosystem。 |
| Real-time streaming | `sounddevice` 或 `pyaudio` | Cross-platform PortAudio bindings。 |
| Inspect a file | `ffprobe` 或 `soxi` | CLI、快速、报告 sr/channels/codec。 |

决策规则:**先匹配 sample rate，再匹配其他任何东西**语 预期16kHz单机浮动32──传给它44.1kHz立体音频,你会看起来像模型错误的垃圾结果──

## 交付它

保存为`outputs/skill-audio-loader.md`△这个技能帮助你检查音频输入是否匹配下游模型的期望,并在不匹配时正确复制样本.

## 练习

1. **简单。**在16kHz下合成1秒的220Hz +440Hz +880Hz混合音――运行 DFT――确认在预期桶里有三个峰值――
2. **中等。**录制一段48kHz、3秒的你自己的WAV语音──使用`torchaudio.transforms.Resample`通过简单的除,每三种样本都取一个.
3. **困难。**只使用`math`和步骤3的DFT,从零构建STFT──框架尺寸400,hop 160,Hann窗──用`matplotlib.pyplot.imshow`这就是第02课的光谱.

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

- [Shannon (1949). Communication in the Presence of Noise](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf)样本定理 背后的论文──
- [Smith — The Scientist and Engineer's Guide to Digital Signal Processing](https://www.dspguide.com/ch8.htm) 免费,经典的DSP教科书.
- [librosa docs — audio primer](https://librosa.org/doc/latest/tutorial.html) 带代码的实用通行.
- [Heinrich Kuttruff — Room Acoustics (6th ed.)](https://www.routledge.com/Room-Acoustics/Kuttruff/p/book/9781482260434)为了了解为什么真实世界音频不是干净的鼻体参考资料.
- [Steve Eddins — FFT Interpretation notebook](https://blogs.mathworks.com/steve/2020/03/30/fft-spectrum-and-spectral-densities/) 用10分钟清清频器直觉.
