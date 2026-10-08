# 音频生成

> 音频是16-48 kHz de sinal 1-D. Em um pedaço de cinco segundos, há 80-240k de amostras. Nenhum transformador irá participar diretamente desta sequência.

**类型：**Construção
**语言：**Python
**先修要求：**Fase 6 · 02(Fonte de áudio) 、Fase 6 · 04(ASR) 、Fase 8 · 06(DDPM)
**时间：**Cerca de 45 minutos

## 问题

3 tipos de tarefas de gerenciamento de rádio:

1. **Text-to-speech。**给定文本,生成语音──干净语音是窄带的,并且有很强的音符结构,已经可以通过变压器-over-tokens 很好地解决──VALL-E(Microsoft)、NaturalSpeech 3、ElevenLabs、OpenAI TTS──
2. **音乐生成。**给定一个快速(文本、旋律、chord progression、genre),生成音乐──分布宽得多──MusicGen(Meta)、Stable Audio 2.5、Suno v4、Udio、Riffusion──
3. **音频效果 / sound design。**给定一个提示,生成环境声或 Foley──AudioGen、AudioLDM 2、Stable Audio Open──

Isto tudo funciona na mesma base: codec de áudio neural + token-AR ou gerador de difusão.

## 概念

![Audio generation: codec tokens + transformer or diffusion](../assets/audio-generation.svg)

### Códecagem de áudio neural

Encodec(Meta,2022)、SoundStream(Google,2021)、Descript Audio Codec(DAC,2023)。 Um codificador convolucional irá comprimir a forma de onda em cada passo de tempo; uma vector restante; quantização de vetores(RVQ) Colocar cada vetor  transformado em K 个代码书指数的级联──Decoder 将其还原── usando 8 个 RVQ codebook、75 Hz,可将 24 kHz 音频压缩为 2 kbps = 600 tokens/sec──

```
waveform (16000 samples/sec)
    └─ encoder conv ─┐
                     ├─ RVQ layer 1 → indices at 75 Hz
                     ├─ RVQ layer 2 → indices at 75 Hz
                     ├─ ...
                     └─ RVQ layer 8
```

### As duas formas de gerar

**Token-autoregressive。**将 RVQ Token 展平成一序列,运行单独解码器 Transformer。MusicGen 使用"delayed parallel" 以并行方式发发出 K 个代码簿流,并为每个流 设置 offset。VALL-E 根据文本提示 + 3 秒语音样本 生成语音 Token。

**Latent diffusion。**将 codec Token 打包为连续潜伏,或用类型传播对其建模──Stable Audio 2.5 在连续音频潜伏 上使用流量匹配──AudioLDM 2 使用文字-to-mail-to-audio diffusion──

2024-2026 Trend:flow matching 正在音乐领域胜出(推理更快、样本 更干净), enquanto token-AR 仍然主导语音,因为它是自然因果,并且非常适合流媒体──

## Paisagem da produção

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

## Construí-lo

`code/main.py`模拟核心思想:在合成的"audio token"序列上训练一个微小的下一个代号变压器, estas序列来自两种不同的"style"(stílo A 为低代号和高代号交换,stílo B 为单调调 ramp) ⋅基于样式 进行条件并样子──

### 步骤 1: sintetizar tokens de áudio

```python
def make_tokens(style, length, vocab_size, rng):
    if style == 0:  # "speech-like": alternating
        return [i % vocab_size for i in range(length)]
    # "music-like": ramp
    return [(i * 3) % vocab_size for i in range(length)]
```

### 步骤 2: treinar um pequeno preditor de tokens

Um predictor de estilo baseado em estilo  condicional ⋅ bigram-style ⋅重点是这个模式:codec Token → cross-entropy training → autoregressive sampling―

### 步骤 3: amostra condicional

给定 style Token 和 start token, de pré-estimado distribuição sample 下一个 Token──持续生成 20-40 个 Token──

## 陷

- **Codec quality caps output quality。**Se o codec 无法忠实表示某声音,再高质量生成器也帮不上忙──DAC é a melhor escolha entre os programas de abertura atuais──
- **RVQ error accumulation。**Cada camada RVQ está no residual da camada anterior à construção. O erro da camada 1 vai se espalhar.
- **Musical structure。**75 Hz 下 30 秒 Token 超過 20k 个──对 Transformer 很難──MusicGen 使用滑窗 + 快速延续;Stable Audio 使用较短剪辑 + 交变──
- **Artifacts at boundaries。**O transplante entre os clipes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
- **Clean-data appetite。**音乐 generator 需要数万小时授权音乐──Suno / Udio processo RIAA(2024) Deixe esse problema surgir em sua face──
- **Voice cloning ethics。**Uma amostra de 3 segundos Adição de um texto de solicitação 就足以让 VALL-E / XTTS / ElevenLabs 克隆声音── cada modelo de produção precisa de detecção de abuso + opta-out listas──

## Use-o

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

## Entrega-o

保存 `outputs/skill-audio-brief.md` Habilidade de receber um breve de áudio (task, duration, style, voice, license),并输出:model + hosting, formatos de "prompt" (formato de "hosting") (tags de gênero, descriptórios de estilo, marcadores estruturais) (codec + generator + cadeia de vocoder, protocolo de semente, bem como plano de avaliação (MOS/CLAP score / CER for TTS/user A/B) (MOS/CLAP score/CER for TTS/user A/B)

## 练习

1. **简单。**运行 `code/main.py`Não é evidente que o estilo de configuração.
2. **中等。**Adicionar decodificação paralela atrasada:模拟 2 条 Token stream, eles devem manter um passo de compensação.
3. **困难。**Utilize HuggingFace transformadores 在本地运行 MusicGen-small──用三不同提示 生成 10秒剪辑;对风格的依依做做 A/B──

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

## Nota de produção:音频是流媒体问题

音频 é uma modalidade de saída que o usuário espera *边生成边到达* , em vez de uma única volta completa. Para termos de produção, isso significa TPOT 很重要 (Tempo por Token de saída), pois a velocidade de escuta do usuário é apenas a velocidade de saída, e não a velocidade de leitura.

两个架构后果:

- **Flow-matching audio models cannot stream trivially。**Stable Audio 2.5 和 AudioCraft 2 会一次性 render 固定长度的 clip──若要流,需要对 clip 分片并重叠界限,可以理解为滑窗扩散;相比编程AR模型,将增加100-300ms的延迟过度──

Se o produto é "chat de voz ao vivo" ou "continuidade de música em tempo real", escolha o caminho do codec AR.

## 延伸阅读
- [Défossez et al. (2022). Encodec: High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) Códec 标准。
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) Primeiro código de áudio neural amplamente utilizado.
- [Kumar et al. (2023). High-Fidelity Audio Compression with Improved RVQGAN (DAC)](https://arxiv.org/abs/2306.06546) DAC。
- [Wang et al. (2023). Neural Codec Language Models are Zero-Shot Text to Speech Synthesizers (VALL-E)](https://arxiv.org/abs/2301.02111)- Não, não.
- [Copet et al. (2023). Simple and Controllable Music Generation (MusicGen)](https://arxiv.org/abs/2306.05284) MúsicaGênero。
- [Liu et al. (2023). AudioLDM 2: Learning Holistic Audio Generation with Self-supervised Pretraining](https://arxiv.org/abs/2308.05734) AudioLDM 2。
- [Stability AI (2024). Stable Audio 2.5](https://stability.ai/news/introducing-stable-audio-2-5) Utilize flow matching  2025 texto-para-música
