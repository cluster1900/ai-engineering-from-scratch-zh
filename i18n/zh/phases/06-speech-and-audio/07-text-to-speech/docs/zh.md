# 文字到语音 (TTS) 从塔科特朗到F5 和科科罗

> 语音将转换为文本;TTS将文本转换为语音――2026年技术分为三部分:文本 →标记 →标记 →标记,mel →波形――每部分都有一个适合笔记本电脑运行的默认模型――

**Type:** Build
**Languages:** Python
**先修要求:**阶段6 · 02 (光谱图和MEL),阶段5 · 09 (Seq2Seq),阶段7 · 05 (全变压器)
**Time:** ~75 minutes

## 问题

你有一个字符串:"请提醒我在下午6点点点灌水植物. 你需要一个3秒的音频片段,听起来自然,有正确的 prosody(停顿、重音),使用正确的元音发出"植物",并且可以在CPU上300 ms内运行,以支持实时语音助手.

现代TTS管道看起来像这样:

1. **Text frontend。**规范化文本(日期、数字、电子邮件),转换为 Phoneme 或子词代币,预测 prosody 特征──
2. **声学模型。**文字 → 梅谱图――塔科特龙2 (2017), 快速讲话2 (2020), 维茨 (2021), F5-TTS (2024), 科科罗 (2024) ――
3. **Vocoder。** →波形──WaveNet (2016),WaveRNN,HiFi-GAN (2020),BigVGAN (2022),以及2024+的神经编码器──

到2026年,随着端到端的扩散和流量匹配模型的出现,音声+声器的分离变得模糊.

## 概念

![Tacotron, FastSpeech, VITS, F5/Kokoro side-by-side](../assets/tts.svg)

**Tacotron 2 (2017)。**后二次:char-embedding → BiLSTM编码器 →位置敏感注意 → autoregressive LSTM解码器 输出 mel frames──慢(AR),长文本上不稳定──仍被作为基线引用──

**FastSpeech 2 (2020)。**无自行降低的――持续时间预测器 输出每一个电话 获得多少个电话框――1通过,比塔科特龙快10×――损失一些自然度 (调性排列),但到处都在使用――

**VITS (2021)。**通过变化推断将编码器+基于流量的持续时间+高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清高清中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中

**F5-TTS (2024)。**基于流量匹配的扩散变压器──自然 prosody,使用5秒参考音频进行零射声克隆──2026年开源 TTS 排行榜顶尖──335M参数──

**Kokoro (2024)。**小型(82M)、可在CPU上运行、实时使用场景下一流的英语TTS──封闭词表、仅英语、apache-2.0──

**OpenAI TTS-1-HD, ElevenLabs v2.5, Google Chirp-3。**商业最新技术――ElevenLabs v2.5 的情感标签――"[低声]","笑]") 和角色声音 在2026年主导听力书制作――

### 演进

| Era | Vocoder | Latency | Quality |
|-----|---------|---------|---------|
| 2016 | WaveNet | 仅 offline | 发布时的 SOTA |
| 2018 | WaveRNN | ~realtime | good |
| 2020 | HiFi-GAN | 100× realtime | 接近人类 |
| 2022 | BigVGAN | 50× realtime | 可泛化到不同 speakers/langs |
| 2024 | SNAC, DAC (neural codecs) | 与 AR models 集成 | 离散 Token，比特效率高 |

到2026年,大多数"TTS"模型都是从文本到波形的端到端模型;

### 评估

- **MOS (Mean Opinion Score)。**现在,我还在做.
- **CMOS (Comparative MOS)。**偏好――每条注释的信任间隔更紧――
- **UTMOS, DNSMOS。**无参考神经MOS预测器──用于排行榜──
- **CER (Character Error Rate) via ASR。**将TTS输出通过Whisper,计算与输入文本的 CER──作为理解性的代理──
- **SECS (Speaker Embedding Cosine Similarity)。**语音克隆质量――

图书TTS测试清洁 上的2026 数字:

| Model | UTMOS | CER (via Whisper) | Size |
|-------|-------|-------------------|------|
| Ground truth | 4.08 | 1.2% | — |
| F5-TTS | 3.95 | 2.1% | 335M |
| XTTS v2 | 3.81 | 3.5% | 470M |
| VITS | 3.62 | 3.1% | 25M |
| Kokoro v0.19 | 3.87 | 1.8% | 82M |
| Parler-TTS Large | 3.76 | 2.8% | 2.3B |


```figure
sp-tts-stack
```

## 构建它

### 步骤1:调音输入

```python
from phonemizer import phonemize
ph = phonemize("Hello world", language="en-us", backend="espeak")
# 'həloʊ wɜːld'
```

电话是通用桥梁. 避免输入原始文本,

### 步骤 2:运行 Kokoro(2026 CPU 默认)

```python
from kokoro import KPipeline
tts = KPipeline(lang_code="a")  # "a" = American English
audio, sr = tts("Please remind me to water the plants at 6 pm.", voice="af_bella")
# audio: float32 tensor, sr=24000
```

离线运行,单文件,82M参数.

### 步骤3:使用语音克隆运行 F5-TTS

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="my_voice_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please remind me to water the plants.",
)
```

传入一个5秒参考片段及其转录;F5 会克隆散文和音符.

### 步骤 4:从零实现 HiFi-GAN 语码器

太大,不能放进教程脚本,但形状如下:

```python
class HiFiGAN(nn.Module):
    def __init__(self, mel_channels=80, upsample_rates=[8, 8, 2, 2]):
        super().__init__()
        # 4 upsample blocks, total 256x to go from mel-rate to audio-rate
        ...
    def forward(self, mel):
        return self.blocks(mel)  # -> waveform
```

训练:对立性 (短窗上的歧视) + 黑色谱谱重建 损失 + 功能匹配 损失──已商品化使用 `hifi-gan`印度的前训练检查站.

### 步骤 5: 整个管道 (伪代码)

```python
text = "Please remind me at 6 pm."
phones = phonemize(text)
mel = acoustic_model(phones, speaker=alice)      # [T, 80]
wav = vocoder(mel)                                # [T * 256]
soundfile.write("out.wav", wav, 24000)
```

## 使用它

2026 年技术:

| Situation | Pick |
|-----------|------|
| 实时 English voice assistant | Kokoro (CPU) 或 XTTS v2 (GPU) |
| 从 5 s reference 进行 voice cloning | F5-TTS |
| 商业 character voices | ElevenLabs v2.5 |
| Audiobook narration | ElevenLabs v2.5 或 XTTS v2 + fine-tune |
| Low-resource language | 在 5–20 h target-lang data 上训练 VITS |
| Expressive / emotion tags | ElevenLabs v2.5 或 StyleTTS 2 fine-tune |

截至2026年开源领先者:**F5-TTS 代表质量，Kokoro 代表效率**否则不要选择塔科特伦.

## 陷

- **没有 text normalizer。**读作"医生"还是"驱动"吗?2026"读作"二十六"还是"两个零两个六"?在音符调用器 之前规范化。
- **OOV proper nouns。**为未知的代币 备备后落图为音模型――
- **Clipping。**声码输出 很少剪切,但推断时 微量化不匹配可能超出 ±1.0──始终使用`np.clip(wav, -1, 1)`,我知道.
- **Sample-rate mismatch。**东北24kHz输出;你的下游管道16kHz的期望 →再样本,否则会出现号.

## 交付它

保存为`outputs/skill-tts-designer.md`△为给定的语音,延迟和语言目标 设计一个TTS管道──

## 练习

1. **Easy。**运行`code/main.py`〔从玩具词汇 构建Phoneme词典,估计每个Phoneme的持续时间,并打印一个假的"邮件"时间表〕
2. **Medium。**安装 Kokoro,分别使用声音 `af_bella`和 `am_adam`合成同句话──比较音频持续时间和主观质量──
3. **Hard。**录制一段你自己的5秒参考片段――使用F5-TTS克隆 它――报告参考和克隆输出 之间的SECS――

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Phoneme | 声音单位 | 抽象声音类别；English 中有 39 个（ARPABet）。 |
| Duration predictor | 每个 Phoneme 持续多久 | Non-AR model output；每个 Phoneme 的整数 frames。 |
| Vocoder | Mel → waveform | 将 mel-spec 映射到 raw samples 的 Neural net。 |
| HiFi-GAN | 标准 vocoder | 基于 GAN；主导 2020–2024。 |
| MOS | 主观质量 | 来自 human raters 的 1–5 mean opinion score。 |
| SECS | Voice-clone metric | target 和 output speaker Embedding 之间的 cosine similarity。 |
| F5-TTS | 2024 开源 SOTA | Flow-matching Diffusion；zero-shot cloning。 |
| Kokoro | CPU English leader | 82M-param model，Apache 2.0。 |

## 延伸阅读

- [Shen et al. (2017). Tacotron 2](https://arxiv.org/abs/1712.05884) 后后后的基线──
- [Kim, Kong, Son (2021). VITS](https://arxiv.org/abs/2106.06103)端到端的流量基础.
- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) 当前开源SOTA。
- [Kong, Kim, Bae (2020). HiFi-GAN](https://arxiv.org/abs/2010.05646) 2026年仍在发行使用的声码器
- [Kokoro-82M on HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M) 2024 年的英语TTS,
