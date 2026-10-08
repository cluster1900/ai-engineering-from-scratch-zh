# 音频生成

> 音频是16-48 kHz'in 1-D sinyali。一个五秒片段有80-240k 个样本。没有任何变压器会直接参加这个序列。2026年每个生产音频模型的解决方案都一样:神经编码器(Encodec、SoundStream、DAC) 音频压缩到50-75 Hz的离散代币,然后由变压器或扩散模型 生成代币。

**类型：**Yapım
**语言：**Python
**先修要求：**6. aşama · 02(Audio Özellikleri)
**时间：**45 dakika kadar .

## 问题

Üç sınıf sesli üretim görevleri:

1. **Text-to-speech。**给定文本,生成语音──干净语音是窄带的,并且有很强的音学结构,已经通过变压器-over-tokens 很好地解决──VALL-E(Microsoft)、NaturalSpeech 3、ElevenLabs、OpenAI TTS──
2. **音乐生成。**给定一个快速(文本、旋律、弦 ilerleme、genre),生成音乐──分布宽得多──MusicGen(Meta)、Stable Audio 2.5、Suno v4、Udio、Riffusion──
3. **音频效果 / sound design。**给定一个提示,生成环境声或 Foley──AudioGen、AudioLDM 2、Stable Audio Open──

Bu üç şey aynı temel üzerinde çalışır: sinir ses kodek + token-AR veya difüzyon jeneratörü.

## 概念

![Audio generation: codec tokens + transformer or diffusion](../assets/audio-generation.svg)

### Nöral ses kodekleri

Encodec(Meta,2022)、SoundStream(Google,2021)、Descript Audio Codec(DAC,2023)。 bir konvulyonal kodlayıcı  waveform                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

```
waveform (16000 samples/sec)
    └─ encoder conv ─┐
                     ├─ RVQ layer 1 → indices at 75 Hz
                     ├─ RVQ layer 2 → indices at 75 Hz
                     ├─ ...
                     └─ RVQ layer 8
```

### Üstteki iki tür üretim biçimi

**Token-autoregressive。**将 RVQ Token 展平成一个序列,运行 解码器-only Transformer。MusicGen 使用 "delayed parallel" 以并行方式发发出 K 个代码簿流,并为每个流 设置 offset。VALL-E 根据文本提示 + 3 秒语音样本 生成语音 Token。

**Latent diffusion。**打包为连续潜伏,或用分类传播对其建模──Stable Audio 2.5 在连续音频潜伏 上使用流匹配──AudioLDM 2 使用文字-to-mail-to-audio difusion──

2024-2026 yıl tendensi: akış eşleşimi 正在音乐领域胜出(推理更快、样品 更干净), token-AR 仍然主导语音,因为它自然因果,并且非常适合流媒体──

## Üretim manzarası

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

## Yapın onu.

`code/main.py`模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟核心思想: 模拟语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语音语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语语

### 步骤 1: Senzet ses simgeler

```python
def make_tokens(style, length, vocab_size, rng):
    if style == 0:  # "speech-like": alternating
        return [i % vocab_size for i in range(length)]
    # "music-like": ramp
    return [(i * 3) % vocab_size for i in range(length)]
```

### 步骤 2: training a tiny token predictor

Bir stil tabanlı  koşullanmış bigram tarzı öngörücü。重点是这个模式:codec Token → cross-entropy training → autoregressive sampling。

### 步骤 3: şartlı örnek

给定 style Token 和 start token,预测分布中样本 下一个 Token──持续生成 20-40 个 Token──

## 陷

- **Codec quality caps output quality。**Eğer kodek 无法忠实表示某声音,再高质量生成器也帮不上忙──DAC, mevcut açılan programın en iyi seçeneğidir──
- **RVQ error accumulation。**Her RVQ katmanı inşaatın ön katmanının kalıntıları içinde bulunmaktadır. 1. katmanın hatası yayılır.
- **Musical structure。**75 Hz 下 30 秒 Token 超過 20k 个──对 Transformer 很难──MusicGen 使用滑窗 + 快速延续;Stable Audio 使用较短剪辑 + 交变──
- **Artifacts at boundaries。**Çizgi klipleri arasında çaprazlama  dikkatli bir örtüşme eklenmesi gerekir.
- **Clean-data appetite。**音乐 generator 需要数万小时授权音乐──Suno / Udio RIAA dava(2024) 让这个问题浮出水面──
- **Voice cloning ethics。**Bir 3 saniyelik örnek ekle bir metin istekli, VALL-E / XTTS / ElevenLabs 隆声── her üretim modeli kötüye kullanımı tespit edilmesi + seçme listesine ihtiyaç duyar.

## Kullan

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

## - Söyle.

保存 `outputs/skill-audio-brief.md` Bilik 接收一个音频简介(タスク、duration、style、音声、license),并输出:model + hosting、prompt format(genre etiketler、style descriptors、structural markers)、codec + generator + vocoder chain、seed protocol,以及 eval plan(MOS / CLAP skor / CER for TTS / user A/B)

## 练习

1. **简单。**运行  İşlem`code/main.py`Ve açıkça ayarlama tarzı── test üretilen dizilerin bu tarzı ile uyumlu olup olmadığını göstermek.
2. **中等。**添加延期平行解码:模拟 2 条 Token stream, bunlar 1 adımlı bir karşılaştırmayı sürdürmelidir.
3. **困难。**Kullanım HuggingFace transformörleri 在本地运行 MusicGen-small。用三不同提示 生成 10秒剪辑;对风格的依依做做 A/B。

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

## Üretim Notu:音频是 流出问题

音频, kullanıcı beklentilerinin *边生成边到达* olarak bir kez yerine tüm geri dönüşün bir şekilde çıkış biçimidir. 音频, üretim 术语来说, this means TPOT 很重要,因为用户的听速度才是目标吞吐量,而不是阅读速度. 音频, user's听速度才是目标吞吐量,而不是阅读速度. 音频, user's听速度才是目标吞吐量. 音频, 音频, 音频, 服务器, 对于对用户产生 ≥75 token/sec,才能保持播放流.

İki yapı:

- **Flow-matching audio models cannot stream trivially。**Stable Audio 2.5 和 AudioCraft 2 会一次性レンダー 固定长度的 clip──若要流, cần对 clip 分片并重叠界,可理解为滑窗扩散; Codec AR modeliyle karşılaştırıldığında, 100-300ms'lik gecikme overheadı artıracaktır──

Eğer ürün "canlı ses sohbet" veya "gerçek zamanlı müzik devamı" ise, "30 saniyelik bir klip göndermek" ise, akış eşleşmesi, "质量和总延迟上胜出" olarak seçilir.

## 延伸阅读
- [Défossez et al. (2022). Encodec: High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) kodek 标准。
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312)İlk yaygın kullanılan sinirsel ses kodekleri.
- [Kumar et al. (2023). High-Fidelity Audio Compression with Improved RVQGAN (DAC)](https://arxiv.org/abs/2306.06546)DAC.
- [Wang et al. (2023). Neural Codec Language Models are Zero-Shot Text to Speech Synthesizers (VALL-E)](https://arxiv.org/abs/2301.02111)- VALL-E.
- [Copet et al. (2023). Simple and Controllable Music Generation (MusicGen)](https://arxiv.org/abs/2306.05284) MusicGen。
- [Liu et al. (2023). AudioLDM 2: Learning Holistic Audio Generation with Self-supervised Pretraining](https://arxiv.org/abs/2308.05734) AudioLDM 2。
- [Stability AI (2024). Stable Audio 2.5](https://stability.ai/news/introducing-stable-audio-2-5) 使用 flow matching 的 2025 metin-müzik için。
