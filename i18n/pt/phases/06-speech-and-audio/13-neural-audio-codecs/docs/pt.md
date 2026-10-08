# Neural Audio Codecs  EnCodec, SNAC, Mimi, DAC 和 Semantic-Acoustic Split

> 2026 ano de geração de som quase todo são Token. EnCodec, SNAC, Mimi e DAC irá transformar a forma de onda em transformador.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 10 · 11 (Quantization), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 问题

语言模型处理离散 Token──音频是连续的── Se você quiser construir um modelo de estilo LLM para o seu idioma, como MusicGen、Moshi、Sesame CSM、VibeVoice、Orpheus, você primeiro precisa de um **neural audio codec**Um codificador de aprendizagem, transformando o seu freqüência em um token, foi equipado com um decodificador para reconstruir a sua forma.

Já surgiram duas famílias:

1. **Reconstruction-first codecs** EnCodec、DAC──优化感知音频质量──Token é acoustic 的, eles capturam incluindo falar pessoa身份、音色、背景噪音在内的一切──
2. **Semantic-first codecs** Mimi (Kyutai)、SpeechTokenizer。强制第一代码簿 编码语言 / 音素内容,通常通过从WavLM distill 得到──后续代码簿 是声学 细节──

As perspectivas para 2024-2026 são:**当你尝试从文本生成时，纯 reconstruction codec 会给你模糊的语音。**覆盖 Codec Token 的 LLM 必须在同一个代码书中同时学习语言结构和声学结构,这无法良好扩展──把它们分离出来,即语义代码书 0、声学代码书 1-N,正是Moshi 和芝麻CSM 能工作的原因──

## 概念

![Four codec landscape: EnCodec, DAC, SNAC (multi-scale), Mimi (semantic+acoustic)](../assets/codec-comparison.svg)

### 核心技巧: Quantização de vetores residuais (RVQ)

Em vez de usar um livro de códigos gigantesco, para obter boa qualidade, talvez seja necessário milhões de códigos, o moderno codec de rádio é usado.**RVQ**:一串小代码簿 级联──第一代码簿 量化编码器 输出;第二代量化残留;依此类推──每代码簿有1024 代码簿──8 代码簿 = 1024^8 = 10^24 的有效词表──

Em inferência, o decodificador irá reedificar todos os códigos selecionados em cada um.

### Quatro códecs mais importantes de 2026

**EnCodec (Meta, 2022)。**基线──基于波形的编码码器,RVQ瓶──24 kHz,最多可用32 代码簿,默认4 代码簿 @ 1.5 kbps──使用 `1D conv + transformer + 1D conv`架构──MusicGen Usá-lo──

**DAC (Descript, 2023)。**Utilize L2-normalized codebook、 periodical activation function and improve Loss' RVQ── na fidelidade de reconstrução em todos os codecs abertos máxima, às vezes usando 12 codebooks 时与原始语音几乎无法区分──44.1 kHz 全频带──

**SNAC (Hubert Siuzdak, 2024)。**Rate de quadros de RVQ em escala múltipla, de grosseira graça menor que o de grosseira graça menor. Na verdade, é feito em forma de nível.

**Mimi (Kyutai, 2024)。**2026 年の关键突破──12.5 Hz freqüência de quadros(极低),8 个代码簿 @ 4.4 kbps──Codebook 0 是 **从 WavLM distill 得到的**, treinamento objetivo é prever os caracteres do som do WavLM.

### Taxa de quadros é importante para a linguagem

Rate de quadros mais baixo = sequência mais curta = LM mais rápido.

| Codec | Frame rate | 1 s = N frames | 适合 |
|-------|-----------|----------------|---------|
| EnCodec-24k | 75 Hz | 75 | 音乐、通用音频 |
| DAC-44.1k | 86 Hz | 86 | 高保真音乐 |
| SNAC-24k (coarse) | ~12 Hz | 12 | AR-LM 高效生成 |
| Mimi | 12.5 Hz | 12.5 | 流式语音 |

Em 12,5 Hz, em 10 segundos, apenas 125 quadros de codec, o transformador pode facilmente previn-los.

### Token 语义 Token vs 声学 Token

```
frame_t → [semantic_token_t, acoustic_token_0_t, acoustic_token_1_t, ..., acoustic_token_6_t]
```

- **Semantic token（Mimi 中的 codebook 0）。**编码说了什么,即音素、词、内容──通过辅助预测 Losses de WavLM destilação 得到──
- **Acoustic tokens（codebooks 1-7）。**编码音色、说话人身份、律、背景噪音、精细细节──

AR LM 先预测 semântico token(以文本为条件),再预测 acústico tokens(以 semântico + alto-falantes referência 为条件) ・・・ essa fatorização é moderno TTS 能够零射 克隆声音的原因:semantic model 处理内容;acoustic model 处理音色。

### 2026 qualidade da reconstrução ((bites por segundo, bitrate 越低越好)

| Codec | Bitrate | PESQ | ViSQOL |
|-------|---------|------|--------|
| Opus-20kbps | 20 kbps | 4.0 | 4.3 |
| EnCodec-6kbps | 6 kbps | 3.2 | 3.8 |
| DAC-6kbps | 6 kbps | 3.5 | 4.0 |
| SNAC-3kbps | 3 kbps | 3.3 | 3.8 |
| Mimi-4.4kbps | 4.4 kbps | 3.1 | 3.7 |

Como o Opus, o codec tradicional continua a ganhar na qualidade de percepção de cada bit.**离散 Token**(Opus 不产生这种 Token) e**generative-model quality**(LM 能如何使用这些代币)


```figure
rvq-codec-cascade
```

## Construí-lo

### 步骤 1: usar EnCodec para codificar

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

6 kbps 时`n_codebooks=8`Cada código é 0-1023 ((10 bits)

### 步骤 2: decodificar e reconstrução de medição

```python
with torch.no_grad():
    wav_recon = model.decode([(codes, scale)])

from torchaudio.functional import compute_deltas
import torch.nn.functional as F

mse = F.mse_loss(wav_recon[:, :, :wav.shape[-1]], wav).item()
```

### 步骤 3: separação semântica-acústica

```python
from moshi.models import loaders
mimi = loaders.get_mimi()

with torch.no_grad():
    codes = mimi.encode(wav)  # shape (1, 8, frames@12.5Hz)

semantic = codes[:, 0]
acoustic = codes[:, 1:]
```

Código semântico 0 Com WavLM 对齐. Você pode treinar um Transformador de texto para semântica,词表比直接到音频小得多.

### 步骤 4: Por que código de Token 上的 AR LM 可行

Para Mimi, 12,5 Hz × 8 códigos, um 10 s 语音片段:

```
N_tokens = 10 * 12.5 * 8 = 1000 tokens
```

1000 Tokens para Transformer é muito pequeno. Um Transformer com 256M de parâmetros pode ser gerado em 10 segundos em GPUs modernos.

## Use-o

问题 → codec 映射:

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

- **Codebook 太多。**Adicionar um livro de códigos aumenta a fidelidade, mas também aumenta a longitude do processo de LM.
- **Frame-rate mismatch。**A mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mim, a mais mais mais mais mais mais mais mais mais mais mais mais mais mais mais, a mais mais mais mais mais mais.
- **假设所有 codebook 都等价。**Em Mimi, o livro de códigos 0 carrega conteúdo; perder-se-á destruir a compreensão.
- **把 reconstruction quality 当作唯一指标。**Se a estrutura semântica é muito ruim, um codec mesmo reconstrução é muito bom, também pode ser inútil para a geração baseada em LM.

## Entrega-o

保存为 `outputs/skill-codec-picker.md`❖ Para uma determinada tarefa de produção ou compressão escolher um codec。

## 练习

1. **Easy。**运行 `code/main.py`◊ Implementou um quantificador escalar + residual de brinquedo,并测量 com o adicionamento de erro de reconstrução do livro de códigos 如何变化──
2. **Medium。**Instalação`encodec`, em linguagem em segmentos de conservação, comparar 1⁄4, 8⁄32 de código-books, e desenhar PESQ ou MSE vs bitrate,
3. **Hard。**Codificar o código 0 em número completo; decodificar o código. Depois, substituir o código 7 em forma semelhante.

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
- [Kumar et al. (2023). Descript Audio Codec (DAC)](https://arxiv.org/abs/2306.06546)O código está aberto.
- [Siuzdak (2024). SNAC](https://arxiv.org/abs/2410.14411) RVQ em larga escala。
- [Kyutai (2024). Mimi codec](https://kyutai.org/codec-explainer) separação semântica-acústica, destilação de WAVLM
- [Borsos et al. (2023). AudioLM](https://arxiv.org/abs/2209.03143) 两阶段 semântica/acústica 范式──
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) O mais antigo código RVQ disponível.
