# 音频生成

> 音频是16-48kHz的1D信号――一个五秒片段有80-240k个样本――没有任何变压器会直接参加这个序列――2026年每个生产音频模型的解决方案都一样:神经编码器(Encodec、SoundStream、DAC) 将音频压缩成50-75Hz的离散标记,然后由变压器或扩散模型 生成标记――

**类型：**构建
**语言：**字符串
**先修要求：**阶段6 · 02(音频功能) 阶段6 · 04(ASR) 阶段8 · 06(DDPM)
**时间：**约45分钟

## 问题

三类音频生成任务:

1. **Text-to-speech。**给定文本,生成语音──干净语音是窄带的,并且有很强的音符结构,已经通过变压器-over-tokens 很好地解决了──VALL-E(Microsoft)、NaturalSpeech 3、ElevenLabs、OpenAI TTS──
2. **音乐生成。**给定一个提示(文本、旋律、弦的进步、类型),生成音乐──分布宽得多──音乐Gen(Meta)、稳定音频 2.5、苏诺 v4、音频、声──
3. **音频效果 / sound design。**给定一个提示,生成环境声或 Foley──AudioGen、AudioLDM 2、稳定音频开放──

这三种都运行在同一基础上:神经音频编程器 + 标志-AR 或扩散发电机.

## 概念

![Audio generation: codec tokens + transformer or diffusion](../assets/audio-generation.svg)

### 神经音频编程器

编码c(Meta,2022)、SoundStream(Google,2021)、Descript Audio Codec(DAC,2023)。一个卷积编码器将波形压缩成每一个时间步骤一个向量;残余向量量化(RVQ) 把每个向量 转换成K个代码书指数的级联──Decoder将其恢复──使用8个RVQ代码书、75 Hz,可将24 kHz 音频压缩为2 kbps =600代码/秒──

```
waveform (16000 samples/sec)
    └─ encoder conv ─┐
                     ├─ RVQ layer 1 → indices at 75 Hz
                     ├─ RVQ layer 2 → indices at 75 Hz
                     ├─ ...
                     └─ RVQ layer 8
```

### 两种产生范式

**Token-autoregressive。**将 RVQ 代币 展平成一个序列,运行单独解码器变压器──MusicGen 使用"延迟并行" 以并行方式发发出 K 个代码书流,并为每个流设置的偏移──VALL-E 根据文本提示+3秒语音样本 生成语音代币──

**Latent diffusion。**将代码标志 打包为连续潜伏,或用分类传播对其建模――稳定音频 2.5 在连续音频潜伏上使用流量匹配――AudioLDM 2 使用文本到邮件到音频传播――

2024-2026年趋势:流量匹配 正在音乐领域胜出(推理更快、样本更干净),而代币-AR 仍然主导语音,因为它是自然的原因,并且非常适合流量──

## 生产景观

| System | Task | Backbone | Latency |
|--------|------|----------|---------|
| ElevenLabs V3 | TTS | Token-AR + neural vocoder | ~300ms first token |
| OpenAI GPT-4o audio | Full-duplex speech | End-to-end Multimodal AR | ~200ms |
| NaturalSpeech 3 | TTS | Latent flow matching | Non-streaming |
| Stable Audio 2.5 | Music / SFX | DiT + flow matching on audio latents | ~10s for 1-minute clip |
| Suno v4 | Full songs | Undisclosed; token-AR suspected | ~30s per song |
| Udio v1.5 | Full songs | Undisclosed | ~30s per song |
| MusicGen 3.3B | Music | Token-AR on Encodec 32kHz | Real-time |
| AudioCraft 2 | Music + SFX | Flow matching | ~5s for 5s clip |
| Riffusion v2 | Music | Spectrogram diffusion | ~10s |


```figure
score-matching
```

## 构建它

`code/main.py`模拟核心思想:在合成的"音频代币"序列上训练一个小的下一个代币变压器,这些序列来自两种不同的"风格"(风格A 为低代币和高代币交换,风格B 为单调) ⋅基于风格进行条件并样子──

### 步骤1:合成音频代币

```python
def make_tokens(style, length, vocab_size, rng):
    if style == 0:  # "speech-like": alternating
        return [i % vocab_size for i in range(length)]
    # "music-like": ramp
    return [(i * 3) % vocab_size for i in range(length)]
```

### 步骤2:训练一个小的代币预测器

一个基于风格的条件式大图式预测器――重点是这个模式:代码符号 →跨体训练 →自动降低样本――

### 步骤3:条件式样本

给定风格的代币 和起始代币,从预测分布中样本 下一个代币――持续生成 20-40个代币――

## 陷

- **Codec quality caps output quality。**如果代克不能忠实表示某个声音,再高质量的发电机也帮不上忙.
- **RVQ error accumulation。**每一个RVQ层都在建前一层的残留.
- **Musical structure。**75 Hz 下 30 秒 标志 超过 20k 个个──对变压器 很难──音乐Gen 使用滑窗+快速延续;稳定音频 使用较短剪辑+交叉──
- **Artifacts at boundaries。**生成剪辑之间的交叉需要谨慎的重叠添加.
- **Clean-data appetite。**音乐发电机 需要数万小时授权音乐──苏诺 / 乌迪奥RIAA诉讼(2024) 让这个问题浮出水面──
- **Voice cloning ethics。**一个3秒样本加一个文本提示 就足以让VALL-E / XTTS / ElevenLabs 克隆声音──每个生产模型都需要发现滥用+选择退出列表──

## 使用它

| Task | 2026 stack |
|------|------------|
| Commercial TTS | ElevenLabs, OpenAI TTS, or Azure Neural |
| Voice cloning (consent-verified) | XTTS v2 (open) or ElevenLabs Pro |
| Background music, fast | Stable Audio 2.5 API, Suno, or Udio |
| Music with lyrics | Suno v4 or Udio v1.5 |
| Sound effects / Foley | AudioCraft 2, ElevenLabs SFX, or Stable Audio Open |
| Real-time voice agent | GPT-4o realtime or Gemini Live |
| Open-weights music research | MusicGen 3.3B, Stable Audio Open 1.0, AudioLDM 2 |
| Dubbing / translation | HeyGen, ElevenLabs Dubbing |

## 交付它

保存`outputs/skill-audio-brief.md`‧ 技能 接收一个音频简报(任务、持续时间、风格、声音、许可证),并输出:模型 + 托管、即时格式(类型标签、风格描述符、结构标记) ‧ 码克+生成器+ vocoder 链、种子协议,以及评估计划(MOS / CLAP 评分 / CER for TTS / user A/B) ‧

## 练习

1. **简单。**运行`code/main.py`并显然设置风格──验证生成序列是否符合该风格的模式──
2. **中等。**添加延迟并行解码:模拟 2 条 代币流,它们必须保持1步的偏移――训练一个联合预测器――
3. **困难。**使用 HuggingFace变压器 在本地运行 MusicGen-small。用三个不同的提示 生成 10 秒剪辑;对风格的坚持做 A/B。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Codec | "Neural compression" | 用于音频的 Encoder / decoder；典型输出是 50-75 Hz Token。 |
| RVQ | "Residual VQ" | K 个 quantizer 的级联；每个都建模前一个的 residual。 |
| Token | "One codec symbol" | 指向 codebook 的离散 index；通常为 1024 或 2048。 |
| Delayed parallel | "Offset codebooks" | 以 staggered offset 发出 K 条 Token stream，从而减少 sequence length。 |
| Flow matching | "The 2024 win for audio" | diffusion 的 straighter-path 替代方案；sampling 更快。 |
| Voice prompt | "3-second sample" | 引导克隆声音的 speaker Embedding 或 Token prefix。 |
| Mel spectrogram | "The visual" | Log-magnitude perceptual spectrogram；许多 TTS system 会使用。 |
| Vocoder | "Mel to wave" | 将 mel spectrogram 转回音频的 neural component。 |

## 制作说明:音频是流媒体问题

音频是用户期望的 *边生成边到达* 的输出模式,而不是一次性全部返回. 用生产术语来说,这意味着TPOT 很重要.

两个架构后果:

- **Flow-matching audio models cannot stream trivially。**稳定音频2.5 和音频Craft 2 会一次性染 固定长度的剪辑──若要流,需要对剪辑分片并重叠边界,可以理解为滑动窗口扩散;相比编程 AR 模型,将增加100-300ms的延迟过度──

如果产品是"直播语音聊天"或"实时音乐延续",选择编程程序AR路径──如果是"提交时发放30秒的剪辑",流量匹配 在质量和总延迟上胜出──

## 延伸阅读
- [Défossez et al. (2022). Encodec: High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438)编码标准――
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312)首个广泛使用的神经音频编程.
- [Kumar et al. (2023). High-Fidelity Audio Compression with Improved RVQGAN (DAC)](https://arxiv.org/abs/2306.06546)   
- [Wang et al. (2023). Neural Codec Language Models are Zero-Shot Text to Speech Synthesizers (VALL-E)](https://arxiv.org/abs/2301.02111)   
- [Copet et al. (2023). Simple and Controllable Music Generation (MusicGen)](https://arxiv.org/abs/2306.05284)音乐Gen。
- [Liu et al. (2023). AudioLDM 2: Learning Holistic Audio Generation with Self-supervised Pretraining](https://arxiv.org/abs/2308.05734) 音频LDM 2。
- [Stability AI (2024). Stable Audio 2.5](https://stability.ai/news/introducing-stable-audio-2-5) 使用流量匹配的2025文字到音乐──
