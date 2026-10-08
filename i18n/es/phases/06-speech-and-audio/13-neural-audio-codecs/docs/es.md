# Códec de audio neural  EnCodec, SNAC, Mimi, DAC y Semántico-Acoustic Split

> 2026 años de producción de sonido casi todo son Token. EnCodec, SNAC, Mimi y DAC se convertirán en Transformer.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 10 · 11 (Quantization), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

##  problemas

语言模型处理离散 Token──音频是连续的── si quieres construir un modelo de estilo LLM para el lenguaje, por ejemplo MusicGen、Moshi、Sesame CSM、VibeVoice、Orpheus, primero necesitas uno **neural audio codec**Un codificador que ha aprendido a usar en su lenguaje, se ha dispersado en un pequeño lenguaje.

Ya han surgido dos familias:

1. **Reconstruction-first codecs** EnCodec、DAC──优化感知音频质量──Token es acoustic 的, que capturan incluyendo el habla persona身份、音色、背景噪音在内的一切──
2. **Semantic-first codecs** Mimi (Kyutai)、SpeechTokenizer。强制第一代码簿 编码语言 / 音素内容, usualmente a través de la destilación de WavLM 得到──后续代码簿 是声学 细节──

Las perspectivas de 2024-2026 son:**当你尝试从文本生成时，纯 reconstruction codec 会给你模糊的语音。**覆盖 Codec Token 的 LLM 必须在同一个代码书中同时学习语言结构和声学结构,这无法良好扩展──把它们分离出来,即语义代码书 0、声学代码书 1-N,正是Moshi 和芝麻CSM 能工作的原因──

## 概念

![Four codec landscape: EnCodec, DAC, SNAC (multi-scale), Mimi (semantic+acoustic)](../assets/codec-comparison.svg)

### 核心技巧: Cuantización de vectores residuales (RVQ)

En lugar de usar un libro de códigos enorme, puede necesitar millones de códigos para obtener un buen código.**RVQ**:一串小代码簿 级联──第一代码簿 量化编码器 输出;第二代量化残留;依此类推── cada código libro tiene 1024 代码簿──8 代码簿 = 1024^8 = 10^24 的有效词表──

En la inferencia, el decodificador se reunirá con todos los códigos seleccionados para que se reestructuren.

### Cuatro códecs más importantes del año 2026

**EnCodec (Meta, 2022)。**基线──基于波形的编码码器-decoder,RVQ瓶──24 kHz, max maximo disponible 32 代码簿,默认 4 代码簿 @ 1.5 kbps──使用 `1D conv + transformer + 1D conv`架构──MusicGen Usalo──

**DAC (Descript, 2023)。**Utiliza el código L2 normalizado  Función de activación periódica y mejoras de pérdida  RVQ  Fidelidad de reconstrucción en todos los códecs abiertos  máxima, a veces utiliza 12 códecs  casi imposible de distinguir  44.1 kHz 

**SNAC (Hubert Siuzdak, 2024)。**Rate de cuadros de RVQ a gran escala, de código de gran tamaño 低于细粒度代码书. En realidad, se construye de manera de nivel.

**Mimi (Kyutai, 2024)。**2026  年的关键突破──12.5 Hz frecuencia de cuadros(极低),8 个代码簿 @ 4.4 kbps──Codebook 0 是 **从 WavLM distill 得到的**, el objetivo del entrenamiento es predecir las características del contenido del lenguaje de WavLM. Los códigos 1-7 son residuos acústicos.

### La velocidad de marcos es importante para el lenguaje

Rate de cuadros más bajo = secuencia más corta = LM más rápido.

| Codec | Frame rate | 1 s = N frames | 适合 |
|-------|-----------|----------------|---------|
| EnCodec-24k | 75 Hz | 75 | 音乐、通用音频 |
| DAC-44.1k | 86 Hz | 86 | 高保真音乐 |
| SNAC-24k (coarse) | ~12 Hz | 12 | AR-LM 高效生成 |
| Mimi | 12.5 Hz | 12.5 | 流式语音 |

En 12,5 Hz, en 10 segundos, sólo 125 cadros de códec, el transformador puede predecirlos fácilmente.

### 语义 Token vs 声学 Token

```
frame_t → [semantic_token_t, acoustic_token_0_t, acoustic_token_1_t, ..., acoustic_token_6_t]
```

- **Semantic token（Mimi 中的 codebook 0）。**编码说了什么,即音素、词、内容──通过辅助预测 Perdida de la destilación de onda 得到──
- **Acoustic tokens（codebooks 1-7）。**编码音色、说话人身份、律、背景噪音、精细细节──

AR LM 先预测 token semántico(以文本为条件),再预测 tokens acústicos(以 semántico + referencia de altavoz 为条件) ・・・ Esta factorization es moderna TTS 能够零射 克隆声音的原因:semántico modelo 处理内容;acoustic model 处理音色。

### 2026 calidad de la reconstrucción ((bites por segundo, bitrate 越低越好)

| Codec | Bitrate | PESQ | ViSQOL |
|-------|---------|------|--------|
| Opus-20kbps | 20 kbps | 4.0 | 4.3 |
| EnCodec-6kbps | 6 kbps | 3.2 | 3.8 |
| DAC-6kbps | 6 kbps | 3.5 | 4.0 |
| SNAC-3kbps | 3 kbps | 3.3 | 3.8 |
| Mimi-4.4kbps | 4.4 kbps | 3.1 | 3.7 |

Como Opus, el código tradicional sigue siendo un éxito en la calidad de percepción de cada bit.**离散 Token**(Opus 不产生这种 Token) y **generative-model quality**(LM 能如何使用这些代币)


```figure
rvq-codec-cascade
```

## Construirlo

### 步骤 1: codificar con EnCodec

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

6 kbps 时`n_codebooks=8`△ Cada código es 0-1023 ⋅ 10 bits) ⋅

### Paso 2: decodificar y reconstruir la medida

```python
with torch.no_grad():
    wav_recon = model.decode([(codes, scale)])

from torchaudio.functional import compute_deltas
import torch.nn.functional as F

mse = F.mse_loss(wav_recon[:, :, :wav.shape[-1]], wav).item()
```

### 步骤 3: división semántica-acústica

```python
from moshi.models import loaders
mimi = loaders.get_mimi()

with torch.no_grad():
    codes = mimi.encode(wav)  # shape (1, 8, frames@12.5Hz)

semantic = codes[:, 0]
acoustic = codes[:, 1:]
```

Se puede entrenar un transformer de texto a semántica, palabra表比直接到音频小得多──, luego, un decodificador acústico a onda de forma única, en el que el altavoz sea de referencia 为条件──

### Paso 4: ¿Por qué el código de token de AR LM arriba se puede hacer

对于Mimi 的 12.5 Hz × 8 个代码书, una 10 s 语音片段:

```
N_tokens = 10 * 12.5 * 8 = 1000 tokens
```

1000 Tokens para el Transformer para decirlo es muy pequeño en la siguiente página. Un Transformer de 256M puede generarse en 10 segundos en la GPU moderna.

## Usalo

问题 → Códec 映射:

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

- **Codebook 太多。**Añadir un libro de códigos 会线性 mejora la fidelidad, pero también aumentará la longitud de la secuencia LM ∞
- **Frame-rate mismatch。**En 12,5 Hz Mimi arriba entrenando LM, luego en 50 Hz EnCodec arriba a la perfección, se va a perder.
- **假设所有 codebook 都等价。**En Mimi, el código 0 cargar contenido; perderlo destruirá la comprensibilidad― perder el código 7  casi no se percibe―
- **把 reconstruction quality 当作唯一指标。**Si la estructura semántica es muy mala, un codec incluso la reconstrucción es muy buena, también puede ser inútil para la generación basada en LM.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-codec-picker.md`◊ para una determinada tarea de generación o compresión seleccionar un codec。

##  ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ ha logrado un cuantificador escalar + residual de juguete,并测量 con el añadido error de reconstrucción de código de libro 如何变化──
2. **Medium。**Instalación`encodec`, en el segmento de voz reservado comparar 1⁄4, 8⁄32 de libros de código, dibujar PESQ o MSE vs bitrate,
3. **Hard。**Encuentra un fragmento de código: ¡Cuáles son las características de la corrupción en el código: ¿Cuál es la forma en que se puede cambiar el código?

## 关键术语: "El hombre es un hombre"

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
- [Kumar et al. (2023). Descript Audio Codec (DAC)](https://arxiv.org/abs/2306.06546)                                                                                                                                                                                                                                                              
- [Siuzdak (2024). SNAC](https://arxiv.org/abs/2410.14411) RVQ a múltiples escalas。
- [Kyutai (2024). Mimi codec](https://kyutai.org/codec-explainer) división semántica-acústica, destilación de WAVLM
- [Borsos et al. (2023). AudioLM](https://arxiv.org/abs/2209.03143) 两阶段 semántica/acústica 范式──
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) El más temprano códec RVQ disponible
