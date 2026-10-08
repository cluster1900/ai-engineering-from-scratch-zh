# 频谱,梅尔尺度与音频特征

> 网络不太适合直接消费原始波形――它们消费光谱――它们消费光谱的效果更好――2026年每个ASR、TTS和音频分类器,成败都取决于这个单一的预处理选择――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 01 (Audio Fundamentals)
**Time:** ~45 分钟

## 问题

拿一个10秒16kHz的剪辑.这是16万个浮动,全部位于`[-1, 1]`几乎与标签"狗吠声"或"猫的词"完全不相关.

频谱图解决了这个问题. 它将缩小人类感知会忽略的时间细节 (微秒级动),并保留感知会关注的结构 (哪些频率有能量,以及这些能量在大约1025ms的时间窗口中如何变化)

谱谱 进一步推进――人类以对数的方式感知音速:100 Hz vs 200 Hz 听起来与1000 Hz vs 2000 Hz 是相同的距离──谱尺度会扭曲频率轴 来匹配这一点──谱谱谱是2010年至2026年 ML演讲中最重要的单一特征──

## 概念

![Waveform to STFT to mel spectrogram to MFCC ladder](../assets/mel-features.svg)

**STFT (Short-Time Fourier Transform).**将波形 切成重叠框架 (典型设置:25 ms窗口,10 ms跳=16 kHz 下400个样本 / 160个样本) ⋅将每个框架乘以一个窗口函数 (Hann 是默认选择;Hamming 的取舍略有不同) ⋅对每个框架做FFT──把大小谱 堆叠成形状为`(n_frames, n_freq_bins)`这就是你的光谱.

**Log-magnitude.**跨越 5-6 个数量级.`log(|X| + 1e-6)`或`20 * log10(|X|)`压缩动态范围――每一个生产管道都使用日志大小,而不是原始大小――

**Mel scale.**频率中 Hz`f`通过`m = 2595 * log10(1 + f / 700)`映射到我`m`△该映射在1kHz以下大致是线性的,在1kHz以上大致是对数的──覆盖08kHz的80个 melbin是标准ASR输入──

**Mel filterbank.**一组在MEL尺度上等间排列的三角形过器──每一个过器是相邻的FFT垃圾的权重总量──将STFT大小乘以过基矩阵,即可通过一次 得到MEL谱──

**Log-mel spectrogram.** `log(mel_spec + 1e-10)`〔语的输入〕パラ基特的输入──无M4T的输入──2026年通用音频前端──

**MFCCs.**取日志邮件谱,应用DCT(类 II),保留前13个系数――它将去相关功能并进一步缩小――大约2015年之前一直是主导功能,之后基于原始日志邮件的CNN/变压器赶上了――它仍然用于扬声器识别(x向量,ECAPA) 』

**Resolution trade.**更大的FFT = 更好的频率分辨率,但更差的时间分辨率──25 ms / 10 ms 是音频-ML默认值;音乐使用50 ms / 12.5 ms;过渡检测(鼓击,插曲) 使用5 ms / 2 ms──


```figure
spectrogram-window
```

## 构建它

### 步骤1:对波形分

```python
def frame(signal, frame_len, hop):
    n = 1 + (len(signal) - frame_len) // hop
    return [signal[i * hop : i * hop + frame_len] for i in range(n)]
```

一个10秒16千克Hz的剪辑,在`frame_len=400, hop=160`时会产生998个框架.

### 步骤 2: 窗户

```python
import math

def hann(N):
    return [0.5 * (1 - math.cos(2 * math.pi * n / (N - 1))) for n in range(N)]
```

在FFT之前,元素的相乘. 它会移除非零端点切断造成的光谱泄漏.

### 步骤3:STFT大小

```python
def stft_magnitude(signal, frame_len=400, hop=160):
    win = hann(frame_len)
    frames = frame(signal, frame_len, hop)
    return [magnitudes(dft([w * s for w, s in zip(win, f)])) for f in frames]
```

生产使用`torch.stft`或`librosa.stft`它们是为了教学,它会在`code/main.py`中的短片 上运行――

### 步骤 4: 片片

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

在`n_fft=400`时,覆盖08kHz的80个钟会得到一个`(80, 201)`矩阵`(n_frames, 201)`转移的STFT大小乘以它,即可得到`(n_frames, 80)`它们的光谱.

### 步骤 5: 记录

```python
def log_mel(mel_spec, eps=1e-10):
    return [[math.log(max(v, eps)) for v in frame] for frame in mel_spec]
```

常见替代方案:`librosa.power_to_db`(参考标准化 dB)`10 * log10(power + eps)`◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎`log_mel_spectrogram`

### 步骤 6: 金融金融机构

```python
def dct_ii(x, n_coeffs):
    N = len(x)
    return [
        sum(x[n] * math.cos(math.pi * k * (2 * n + 1) / (2 * N)) for n in range(N))
        for k in range(n_coeffs)
    ]
```

对于每个日志邮件框架, 应用DCT,保留前13个系数――这是你的MFCC矩阵――第一个系数通常会被丢弃――它编码总能)

## 使用它

2026 年:

| Task | Features |
|------|----------|
| ASR (Whisper, Parakeet, SeamlessM4T) | 80 log-mels, 10 ms hop, 25 ms window |
| TTS acoustic model (VITS, F5-TTS, Kokoro) | 80 mels, 5–12 ms hop，用于精细 temporal control |
| Audio classification (AST, PANNs, BEATs) | 128 log-mels, 10 ms hop |
| Speaker embedding (ECAPA-TDNN, WavLM) | 80 log-mels 或 raw-waveform SSL |
| Music (MusicGen, Stable Audio 2) | EnCodec discrete tokens（不是 mels） |
| Keyword spotting | 40 MFCCs，用于 tiny devices |

经验法则:**如果你不是在处理 music，就从 80 log-mels 开始。**任何偏离都需要承担举证责任.

## 2026年仍将进入生产陷

- **Mel count mismatch.**使用80m 训练,使用128m推断――静默失败――在两端都记录特征形状――
- **Sample-rate mismatch upstream.**在 22.05 kHz 计算出的 mels 与 16 kHz 不同──在特征化 *之前* 修复 SR──
- **dB vs log.**微笑 期望记录,而不是 dB-mel――一些HF管道会自动检测;你的定制代码不会――
- **Normalization drift.**训练时使用每表达标准化,推理时使用全球标准化――这会让生产错误翻倍――
- **Leakage from padding.**对于剪辑末尾进行零接 会在后框架中产生平面谱──使用对称接或复制──

## 交付它

保存为`outputs/skill-feature-extractor.md`△该技能 会为给定模型目标 选择特征类型、邮件数量、框架/跳和正常化──

## 练习

1. **Easy.**运行`code/main.py`△它会成一个声,从频率从200 → 4000 Hz 扫过),并打印每一个框架的 argmax mel bin──绘图(可选)并确认它与扫描匹配──
2. **Medium.**使用 `{40, 80, 128}`中中 `n_mels`和 `{200, 400, 800}`中中 `frame_len`重新运行――测量时间轴 上尖峰带宽――哪种组合最好解析?
3. **Hard.**实现`power_to_db`并比较AudioMNIST 上微小的CNN分类器 使用以下输入时的ASR精度:`ref=max`报告的前一点准确性――

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
- [Davis, Mermelstein (1980). Comparison of parametric representations for monosyllabic word recognition](https://ieeexplore.ieee.org/document/1163420) 国际金融委员会论文
- [Stevens, Volkmann, Newman (1937). A Scale for the Measurement of the Psychological Magnitude Pitch](https://pubs.aip.org/asa/jasa/article-abstract/8/3/185/735757/) 原始的尺.
- [OpenAI — Whisper source, log_mel_spectrogram](https://github.com/openai/whisper/blob/main/whisper/audio.py) 阅读参考实施──
- [librosa feature extraction docs](https://librosa.org/doc/main/feature.html) `mfcc`,我知道.`melspectrogram`和跳/窗口的参考
- [NVIDIA NeMo — audio preprocessing](https://docs.nvidia.com/deeplearning/nemo/user-guide/docs/en/main/asr/asr_all.html#featurizers) 用于"帕拉基特+加拿大"模型的生产规模管道.
