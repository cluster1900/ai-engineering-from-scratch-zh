# 神经音频代码 EnCodec,SNAC,Mimi,DAC 和语音分区

> 2026年的音频生成几乎全部都是代币.EnCodec、SNAC、Mimi 和 DAC 会将连续波形转换为变体. 可以预测的离散序列.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 10 · 11 (Quantization), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 问题

语言模型处理离散代币――音频是连续的――如果你想为语音/音乐构建LLM风格的模型,例如音乐Gen、莫希、芝麻CSM、VibeVoice、奥尔菲斯,你首先需要一个**neural audio codec**通过学习的编码器,把音频分散为小词表代币,并配套一个编码器来重建波形――

已经出现了两个家庭:

1. **Reconstruction-first codecs** EnCodec、DAC──优化感知音频质量──Token 是声的,它们捕获包括说话人身份、音色、背景噪音在内的一切──
2. **Semantic-first codecs** Mimi (Kyutai)、SpeechTokenizer──强制第一代码书 编码语言 / 音素内容,通常通过从波LM蒸得到──后续代码书 是声学 细节──

2024-2026年的洞察是:**当你尝试从文本生成时，纯 reconstruction codec 会给你模糊的语音。**覆盖代码符号的LLM 必须同时学习语言结构和声学结构在同一代码书中,这无法很好地扩展.

## 概念

![Four codec landscape: EnCodec, DAC, SNAC (multi-scale), Mimi (semantic+acoustic)](../assets/codec-comparison.svg)

### 核心技巧:残留向量定量化 (RVQ)

为了获得好质量的代码,可能需要数百万代码),现代音频代码都使用.**RVQ**根据此类推,每个代码书有1024个代码书,8个代码书 = 1024^8 = 10^24 的有效词表。

在推断中,解码器会对每一个中所有选中的代码进行求和来重建.

### 2026年最重要的四个编码

**EnCodec (Meta, 2022)。**基线──基于波形的编码器-解码器,RVQ瓶──24 kHz,最多可用32个代码簿,默认4个代码簿 @ 1.5 kbps──使用 `1D conv + transformer + 1D conv`架构――音乐Gen 使用它――

**DAC (Descript, 2023)。**使用L2规范化代码簿、周期性激活函数和改进损失的RVQ──在所有开放代码中重建忠诚度最高,有时使用12个代码簿 时与原始语音几乎无法区分──44.1 kHz 全频带──

**SNAC (Hubert Siuzdak, 2024)。**多尺度RVQ,粗粒度代码书的框架率低于细粒度代码书.实际上以层级方式建模.

**Mimi (Kyutai, 2024)。**2026 年的关键突破──12.5 Hz 框架速度(极低),8 个代码簿 @ 4.4 kbps──代码簿 0 是 **从 WavLM distill 得到的**训练目标是预测波LM的语音内容特征――"编码书"1-7是声学残留物――这个分支支了莫希 (Moshi) (课 15) 和芝麻CSM――

### 框架率对语言建模非常重要

更低的率 = 更短的序列 = 更快的LM。

| Codec | Frame rate | 1 s = N frames | 适合 |
|-------|-----------|----------------|---------|
| EnCodec-24k | 75 Hz | 75 | 音乐、通用音频 |
| DAC-44.1k | 86 Hz | 86 | 高保真音乐 |
| SNAC-24k (coarse) | ~12 Hz | 12 | AR-LM 高效生成 |
| Mimi | 12.5 Hz | 12.5 | 流式语音 |

在12.5Hz下,10秒话语只有125个编程框,变压器可以轻松预测它们.

### 语义标志与声学标志

```
frame_t → [semantic_token_t, acoustic_token_0_t, acoustic_token_1_t, ..., acoustic_token_6_t]
```

- **Semantic token（Mimi 中的 codebook 0）。**编码说了什么,即音素、词、内容──通过辅助预测 损失从波蒸 得到──
- **Acoustic tokens（codebooks 1-7）。**编码音色、说话人身份、律、背景噪音、精细细节──

预测语音代币 (以文本为条件),再预测音声代币 (以语音+扬声器引用为条件) ⋅这种因素化是现代TTS 能够零射 克隆声音的原因:语音模型 处理内容;音声模型 处理音色。

### 2026重建质量 (比特/秒,比特rate 越低越好)

| Codec | Bitrate | PESQ | ViSQOL |
|-------|---------|------|--------|
| Opus-20kbps | 20 kbps | 4.0 | 4.3 |
| EnCodec-6kbps | 6 kbps | 3.2 | 3.8 |
| DAC-6kbps | 6 kbps | 3.5 | 4.0 |
| SNAC-3kbps | 3 kbps | 3.3 | 3.8 |
| Mimi-4.4kbps | 4.4 kbps | 3.1 | 3.7 |

像Opus这样的传统编程器在每位的感知质量上仍然胜出.**离散 Token**,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,**generative-model quality**(LM 能如何使用这些标志)


```figure
rvq-codec-cascade
```

## 构建它

### 步骤1:使用EnCodec编码

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

时速6 kbps`n_codebooks=8`每个代码是0-1023(10位)

### 步骤2:解码并测量重建

```python
with torch.no_grad():
    wav_recon = model.decode([(codes, scale)])

from torchaudio.functional import compute_deltas
import torch.nn.functional as F

mse = F.mse_loss(wav_recon[:, :, :wav.shape[-1]], wav).item()
```

### 步骤3:语音分离

```python
from moshi.models import loaders
mimi = loaders.get_mimi()

with torch.no_grad():
    codes = mimi.encode(wav)  # shape (1, 8, frames@12.5Hz)

semantic = codes[:, 0]
acoustic = codes[:, 1:]
```

语义代码书 0 与波LM对齐.你可以训练一个文字-语义变压器,词表比直接到音频小得多.然后,一个单独的声态-波形解码器 以扬声器参考为条件.

### 步骤 4:为什么代码符号上 AR LM 可行

对于米米的12.5Hz × 8个代码书,一个10秒语音片段:

```
N_tokens = 10 * 12.5 * 8 = 1000 tokens
```

转换器的1000个代币是很小的上下文──一个256M参数的转换器可以在现代GPU上以毫秒级生成10秒语音──

## 使用它

问题 → 映射:

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

- **Codebook 太多。**添加代码书 会线性提高忠诚度,但也会线性增加 LM 序列长度――停在 8-12 个――
- **Frame-rate mismatch。**在12.5Hz里,米米上练 LM,然后在50HzEnCodec上调,会失败.
- **假设所有 codebook 都等价。**在米米中,代码书0 载内容;丢失它会摧毁可理解度.
- **把 reconstruction quality 当作唯一指标。**如果语义结构很差,一个编程程序甚至重建很好,也可能对基于LM的生成毫无用处.

## 交付它

保存为`outputs/skill-codec-picker.md`△为给定的生成或压缩任务选择一个代码.

## 练习

1. **Easy。**运行`code/main.py`△它实现了一个玩具尺度量化+残余量化器,并测量随着添加代码簿重建错误 如何变化──
2. **Medium。**装备`encodec`对于使用的语音片段,比较 1、4、8、32个代码书──绘制 PESQ或 MSE与位率──
3. **Hard。**加载 Mimi──Encode 一片段──把代码簿 0 换成随机整数;解码──然后以类似的方式换代码簿 7──比较这两种破坏,代码簿 0 腐败 应该摧毁可理解度;代码簿 7 腐败 应该几乎没有改变任何东西──

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
- [Kumar et al. (2023). Descript Audio Codec (DAC)](https://arxiv.org/abs/2306.06546)最高保真开放的编码.
- [Siuzdak (2024). SNAC](https://arxiv.org/abs/2410.14411)多尺度的RVQ──
- [Kyutai (2024). Mimi codec](https://kyutai.org/codec-explainer)语音分离,WavLM蒸
- [Borsos et al. (2023). AudioLM](https://arxiv.org/abs/2209.03143) 两阶段语义/音声范式──
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) 最早可流式RVQ编程.
