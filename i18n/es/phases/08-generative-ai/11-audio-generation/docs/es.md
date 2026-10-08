# 音频生成

> 音频是16-48 kHz de señal 1-D. En un segmento de cinco segundos hay una muestra de 80-240k. Ningún Transformer asistirá directamente a esta secuencia.

**类型：**Construcción
**语言：**Python
**先修要求：**Fase 6 · 02(Features de audio) Fase 6 · 04(ASR) Fase 8 · 06(DDPM)
**时间：** 45 minutos

##  problemas

Tres clases de tareas de generación de sonidos:

1. **Text-to-speech。**给定文本,生成语音──干净语音是窄带的,并且有很强的音符结构,已经可以通过变压器-over-tokens 很好地解决──VALL-E(Microsoft)、NaturalSpeech 3、ElevenLabs、OpenAI TTS──
2. **音乐生成。**给定一个快速(文本、旋律、chord progression、genre),生成音乐──分布宽得多──MusicGen(Meta)、Stable Audio 2.5、Suno v4、Udio、Riffusion──
3. **音频效果 / sound design。**给定一个提示,生成环境声或 Foley──AudioGen、AudioLDM 2、Stable Audio Open──

Esto funciona en la misma base: codec de audio neuronal + token-AR o generador de difusión.

## 概念

![Audio generation: codec tokens + transformer or diffusion](../assets/audio-generation.svg)

### Códec de audio neuronal

Encodec(Meta,2022)、SoundStream(Google,2021)、Descript Audio Codec(DAC,2023)。Un codificador convolucional comprimirá la forma de onda en cada paso de tiempo; una vector residual cuantización(RVQ) Colocar cada vector 转换成 K 个代码书指数的级联──Decoder 将其还原──使用 8 个 RVQ代码书、75 Hz,可将24 kHz 音频压缩为 2 kbps = 600 tokens/sec──

```
waveform (16000 samples/sec)
    └─ encoder conv ─┐
                     ├─ RVQ layer 1 → indices at 75 Hz
                     ├─ RVQ layer 2 → indices at 75 Hz
                     ├─ ...
                     └─ RVQ layer 8
```

### Sus dos tipos de generación

**Token-autoregressive。**将 RVQ Token 展平成一个序列,运行单独解码器变压器──MusicGen 使用"延迟平行" 以并行方式发发发 K 个代码书流,并为每个流 设置 offset──VALL-E 根据文本提示 + 3 秒语音样本 生成语音 Token──

**Latent diffusion。**将 codec Token 打包为连续潜伏,或用分类传播对其建模──Stable Audio 2.5 在连续音频潜伏 上使用流量匹配──AudioLDM 2 使用文字通音频传播──

Tendencias 2024-2026: flujo de coincidencia está en el campo de la música.

## Paisaje de producción

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

## Construirlo

`code/main.py`模拟核心思想: en sintética "token de audio" 序列上训练一个微小的下一个代币变压器, estos序列来自两种不同的"风格"(风格A 为低代币 和高代币 交换,风格B 为单调调) ⋅基于风格 进行条件并样子──

### Paso 1: Sintificar tokens de audio

```python
def make_tokens(style, length, vocab_size, rng):
    if style == 0:  # "speech-like": alternating
        return [i % vocab_size for i in range(length)]
    # "music-like": ramp
    return [(i * 3) % vocab_size for i in range(length)]
```

### Paso 2: entrenar un pequeño predictor de tokens

Un predictor de estilo de bigram basado en el estilo  condicional ⋅重点是这个模式:codec Token → entrenamiento de entropía cruzada → muestreo autoregressivo―

### 步骤 3: muestra condicional

给定风格 Token 和起点 token, de la muestra de la distribución de la predicción 下一个 Token──持续生成 20-40 个 Token──

## 陷

- **Codec quality caps output quality。**Si el codec 无法忠实表示某声音,再高质量发电机也帮不上忙――DAC es la mejor opción entre los programas abiertos actuales―
- **RVQ error accumulation。**Cada capa RVQ está en el residuo de la primera capa de construcción. El error de la primera capa se propagará.
- **Musical structure。**75 Hz 下 30 秒 Token 超过 20k 个──对 Transformer 很难──MusicGen 使用滑窗+快速延续;Stable Audio 使用较短剪辑+交变──
- **Artifacts at boundaries。**El cruce entre los clipes necesita un sobrepeso cuidadoso.
- **Clean-data appetite。**音乐 generator 需要数万小时授权音乐──Suno / Udio demanda de la RIAA(2024) Deja que este problema surja en el agua──
- **Voice cloning ethics。**Una muestra de 3 segundos, un texto de texto de prueba, así que se puede hacer que VALL-E / XTTS / ElevenLabs 克隆声音── cada modelo de producción necesita una lista de abuso + opt-out──

## Usalo

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

##  entregarlo

保存 `outputs/skill-audio-brief.md` Conocimiento 接收一个音频简介(task、duration、style、voice、license),并输出:model + hosting、prompt format(genre tags、style descriptors、structural markers) ‧codec + generator + vocoder chain、seed protocol, así como plan de evaluación(MOS / CLAP score / CER for TTS / user A/B) 

##  ejercicios

1. **简单。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`Y claramente establecer estilo. ¿El ensayo generado está en conformidad con el modelo del estilo?
2. **中等。**Añadir decodificación paralela retrasada:模拟 2 条 Token stream, deben mantener un paso de compensación.
3. **困难。**Usar transformadores de HuggingFace en su propio país.

## 关键术语: "El hombre es un hombre"
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

## Nota de producción:音频是流动问题

音频 es una modalidad de salida de la expectativa del usuario *边生成边到达* , en lugar de una sola vez todo volver. En términos de producción, esto significa TPOT 很重要 (Tempo por Token de salida), ya que la velocidad de escucha del usuario es el rendimiento objetivo, en lugar de la velocidad de lectura.

两个架构后果:

- **Flow-matching audio models cannot stream trivially。**Estable Audio 2.5 y AudioCraft 2 会一次性 render 固定长度的 clip──若要流,需要对片分分分并重叠边界,可以理解为滑窗扩散;相比编码 AR模型,将增加100-300ms的延迟过费──

Si el producto es "chat de voz en vivo" o "continuidad de música en tiempo real", elija el camino de AR de codec. Si es "rendir un clip de 30 segundos en la presentación", flujo de coincidencia en la calidad y la latencia total.

## 延伸阅读
- [Défossez et al. (2022). Encodec: High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) Códec 标准。
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) El primer código de audio neuronal ampliamente utilizado.
- [Kumar et al. (2023). High-Fidelity Audio Compression with Improved RVQGAN (DAC)](https://arxiv.org/abs/2306.06546) DAC。
- [Wang et al. (2023). Neural Codec Language Models are Zero-Shot Text to Speech Synthesizers (VALL-E)](https://arxiv.org/abs/2301.02111)¿Qué es eso?
- [Copet et al. (2023). Simple and Controllable Music Generation (MusicGen)](https://arxiv.org/abs/2306.05284) MúsicaGen。
- [Liu et al. (2023). AudioLDM 2: Learning Holistic Audio Generation with Self-supervised Pretraining](https://arxiv.org/abs/2308.05734) AudioLDM 2。
- [Stability AI (2024). Stable Audio 2.5](https://stability.ai/news/introducing-stable-audio-2-5) Utiliza el flujo de correspondencia de texto a música de 2025
