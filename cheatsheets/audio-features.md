---
id: audio-features
title: Audio Features, Classification and Metrics
code: AF
subtitle: 对音频进行采样、分帧、加窗、梅尔、MFCC、分类和评分。课程中的标准库 Python。
hue: 25
sources: phases/06-speech-and-audio/01-audio-fundamentals, phases/06-speech-and-audio/02-spectrograms-mel-features, phases/06-speech-and-audio/03-audio-classification, phases/06-speech-and-audio/17-audio-evaluation-metrics
source_hash: bfd4e5e3ac478c89
---

## 从波形到标签
type: architecture
from: phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md, phases/06-speech-and-audio/03-audio-classification/docs/en.md, phases/06-speech-and-audio/03-audio-classification/code/main.py

```arch
node | wav | 1,1 | Waveform | floats in [-1, 1] | client
node | frame | 2,1 | Frames | 400 samples, hop 160 | process
node | stft | 3,1 | STFT | Hann window, FFT | process
node | mel | 4,1 | Mel filterbank | 80 triangles | process
node | log | 4,2 | Log-mel | Whisper input | store
node | mfcc | 3,2 | MFCC | DCT-II, keep 13 | process
node | pool | 2,2 | Pool | mean + var, 26 dims | process
node | clf | 1,2 | Classifier | k-NN, CNN, AST, BEATs | model
edge | wav | frame |
edge | frame | stft |
edge | stft | mel | magnitude
edge | mel | log | log
edge | log | mfcc | DCT
edge | mfcc | pool |
edge | pool | clf | cosine
```

## 公式
type: concepts
from: phases/06-speech-and-audio/01-audio-fundamentals/docs/en.md, phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md, phases/06-speech-and-audio/03-audio-classification/docs/en.md

- **时间**：$t = n / sr$。16 kHz 下 10 s 的片段是 160,000 个浮点数。
- **奈奎斯特**：$sr / 2$。高于它的能量会混叠到较低的频点。
- **混叠**：以 10 kHz 采样的 7 kHz 音调折叠为 $10 - 7 = 3$ kHz。
- **频点**：频点 $k$ 为 $k \cdot sr / N$ Hz。分辨率为 $sr / N$。
- **梅尔**：$m = 2595 \cdot \log_{10}(1 + f / 700)$
- **Hann**：$w(n) = 0.5 (1 - \cos(2 \pi n / (N - 1)))$
- **帧数**：$1 + (T - L) / hop$。16 kHz 下 10 s 得到 998 帧。
- **Mixup**：$x = \lambda x_1 + (1 - \lambda) x_2$，$y$ 同理。

## 特征默认值
type: defaults
from: phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md, phases/06-speech-and-audio/01-audio-fundamentals/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 帧长 | 400 | 16 kHz 下 25 ms |
| 帧移 | 160 | 16 kHz 下 10 ms |
| 窗函数 | Hann | 把帧边缘渐变到零 |
| 梅尔频带数，ASR | 80 | 覆盖 0 到 8 kHz |
| 梅尔频带数，分类 | 128 | AST、PANNs、BEATs |
| MFCC 数量 | 13 | 丢弃系数 0，它是能量 |
| 对数下限 `eps` | 1e-10 | log(mel_spec + 1e-10) |
| 关键词识别 | 40 MFCCs | 面向微型设备 |

## 代码中的任务
type: task-table
from: phases/06-speech-and-audio/01-audio-fundamentals/code/main.py, phases/06-speech-and-audio/02-spectrograms-mel-features/code/main.py, phases/06-speech-and-audio/03-audio-classification/code/main.py

| 任务 | 代码 |
|---|---|
| 合成一个音调 | `sine(freq_hz, sr, seconds, amp=0.5)` |
| 找到主频 | `peak_freq(samples, sr)` |
| 对信号分帧 | `frame_signal(signal, frame_len, hop)` |
| STFT 幅度 | `stft_magnitude(signal, frame_len, hop)` |
| 梅尔滤波器组 | `mel_filterbank(n_mels, n_fft, sr)` |
| 对数梅尔 | `log_transform(mel_spec, eps=1e-10)` |
| MFCC | `dct_ii(x, n_coeffs)` |
| k-NN 投票 | `knn(q, bank, labels, k=3)` |

## MFCC k-NN 基线
type: annotated-code
lang: python
from: phases/06-speech-and-audio/03-audio-classification/code/main.py

```python
sr = 8000                                   # demo rate in the code
mag = stft_mag(signal, frame_len, hop)      # Hann, then DFT per frame
fb = mel_filterbank(n_mels, frame_len, sr)  # n_mels x (n_fft // 2 + 1)
mels = apply_filterbank(mag, fb)            # weighted sum per mel bin
lm = log_transform(mels)                    # log(max(v, eps))
feats = [dct_ii(f, n_mfcc) for f in lm]     # 13 coefficients per frame
emb = summarize(feats)                      # mean + var, 26 dims
pred = knn(emb, X_train, y_train, k=3)      # cosine top k, majority vote
```

## 为模型打分
type: annotated-code
lang: python
from: phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md
span: 2

```python
from jiwer import wer, Compose, ToLowerCase, RemovePunctuation, Strip
transform = Compose([ToLowerCase(), RemovePunctuation(), Strip()])
score = wer(truth="Please turn on the lights.", hypothesis="please turn on the light",
            truth_transform=transform, hypothesis_transform=transform)
sv = EncoderClassifier.from_hparams("speechbrain/spkrec-ecapa-voxceleb")
secs = torch.nn.functional.cosine_similarity(emb_ref, emb_clone, dim=-1).item()  # SECS
fad = FrechetAudioDistance()
score = fad.get_fad_score("generated_folder/", "reference_folder/")  # lower is better
```

## 库
type: command-table
from: phases/06-speech-and-audio/01-audio-fundamentals/docs/en.md, phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md, phases/06-speech-and-audio/03-audio-classification/docs/en.md, phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md

| 命令 | 作用 |
|---|---|
| `soundfile` | 以 float32 读取 WAV、FLAC、OGG |
| `torchaudio.transforms.Resample` | 内置抗混叠的重采样 |
| `numpy.fft.rfft` | 针对实数音频的实数 FFT |
| `torch.stft` | 向量化 STFT |
| `librosa.power_to_db` | 以参考值归一化的 dB |
| `ffprobe` | 报告文件的 sr、声道数和编解码器 |
| `jiwer` | 带归一化的 WER 和 CER |
| `ASTForAudioClassification.from_pretrained` | 加载 AST 以便微调 |

## 选择分类器
type: concepts
from: phases/06-speech-and-audio/03-audio-classification/docs/en.md

- **少于 1000 个片段**：在 MFCC 均值上做 k-NN，加音频增强。
- **1K 到 100K 个片段**：微调 BEATs 或 AST。
- **超过 100K 个片段**：从头训练或微调 Whisper-encoder。
- **实时、边缘端**：40-MFCC CNN，量化到 int8。
- **多标签**：BEATs-iter3，配合 BCE 损失、mixup 和 SpecAugment。
- **互斥类别**：报告 top-1 和 top-5 准确率。
- **类别不平衡**：报告各类召回率和宏 F1。

## 指标
type: glossary
from: phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md

- **WER**：词错误率。归一化后的 (S + D + I) / N。
- **CER**：字符错误率。用于声调语言。
- **RTFx**：每挂钟秒处理的音频秒数。越高越好。
- **MOS**：平均意见分。1 到 5 分，20+ 名听众，100+ 个样本。
- **UTMOS**：学习得到的 MOS 预测器。与人类 MOS 相关性约 ~0.9。
- **SECS**：参考与克隆的 ECAPA 余弦相似度。高于 0.75 即可辨认。
- **EER**：FAR 等于 FRR 时的阈值。ECAPA 在 VoxCeleb1-O 上为 0.87%。
- **DER**：(FA + Miss + Confusion) / 说话人总时长。
- **FAD**：VGGish 嵌入上的 Fréchet 距离。越低越好。

## 故障排查
type: troubleshooting
from: phases/06-speech-and-audio/01-audio-fundamentals/docs/en.md, phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md, phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 输出乱码，看似模型缺陷 | 把 44.1 kHz 立体声喂给 Whisper | 重采样为 16 kHz 单声道 float32 |
| FFT 峰值出现在错误频率 | 高于奈奎斯特的能量发生混叠 | 降采样前先做低通滤波 |
| 部署后静默失败 | 训练时 80 个梅尔，推理时 128 个 | 在两端记录特征形状 |
| 梅尔谱看起来不一样 | 以 22.05 kHz 提取特征 | 提取特征前固定 SR |
| Whisper 输入看起来不对 | 用了 dB 梅尔而非对数梅尔 | 输入对数梅尔。自定义代码不会自动识别 |
| 生产中 WER 翻倍 | 训练时按语句归一化，推理时全局归一化 | 使用相同的归一化 |
| 尾部帧平坦 | 片段末尾补零 | 对称填充或复制填充 |
| 5% 的 WER 掩盖了口音上的 30% | 聚合 WER | 按人群切片报告 |

## 问题
type: qa
from: phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md, phases/06-speech-and-audio/01-audio-fundamentals/docs/en.md, phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md

- **为什么用梅尔而不是 Hz？** 人类按对数尺度感知音高。
- **为什么要加窗？** 它消除帧边缘的频谱泄漏。
- **为什么取对数幅度？** 原始幅度跨越 5-6 个数量级。
- **更大的 FFT？** 频率分辨率更好，时间分辨率更差。
- **为什么用 FFT 而不是 DFT？** DFT 是 O(N²)。FFT 是 O(N log N)。
- **为什么用 minDCF？** 它在选定的工作点上对代价加权。

## 技巧
type: tips
from: phases/06-speech-and-audio/01-audio-fundamentals/docs/en.md, phases/06-speech-and-audio/02-spectrograms-mel-features/docs/en.md, phases/06-speech-and-audio/03-audio-classification/docs/en.md, phases/06-speech-and-audio/17-audio-evaluation-metrics/docs/en.md

- 先对齐采样率，再对齐其他任何东西。
- 如果不是做音乐，先从 80 个对数梅尔开始。
- 从冻结的骨干网络开始，而不是全新的模型。
- 训练时用均衡采样，评估时不要用。
- 计算 WER 前先归一化文本，并报告所用规则。
- 延迟要报告 P50/P95/P99。
- 保留一个内部留出集。公开基准会饱和。
