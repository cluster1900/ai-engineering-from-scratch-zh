# Les codecs audio neuraux  EnCodec, SNAC, Mimi, DAC 和 Split sémantique-acoustique

> La génération de tokens en 2026 est presque entièrement Token. EnCodec, SNAC, Mimi et DAC seront transformés en transformateur.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 10 · 11 (Quantization), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

##  problématique

Si vous voulez créer un modèle de style LLM, par exemple MusicGen、Moshi、Sesame CSM、VibeVoice、Orpheus, vous en avez d'abord besoin.**neural audio codec**Un codeur de formation, transformé en un codeur de formation, et un codeur de formation.

Il y a eu deux familles:

1. **Reconstruction-first codecs** EnCodec、DAC──优化感知音频质量──Token acoustic 的, elles capturent notamment le langage de la personne, son identité, son contexte, son son intérieur.
2. **Semantic-first codecs** Mimi (Kyutai)、SpeechTokenizer。强制第一代码簿 编码语言 / 音素内容,通常通过从WavLM distill 得到──后续代码簿 是音响 细节──

Les perspectives de l'année 2024-2026 sont les suivantes:**当你尝试从文本生成时，纯 reconstruction codec 会给你模糊的语音。**Les symboles de codec doivent être utilisés dans le même codebook en même temps que les structures linguistiques et acoustiques, ce qui est impossible à étendre.

## 概念

![Four codec landscape: EnCodec, DAC, SNAC (multi-scale), Mimi (semantic+acoustic)](../assets/codec-comparison.svg)

### 核心技巧:Quantification des vecteurs résiduels (RVQ)

Au lieu d'utiliser un codec énorme, il faut des millions de codes pour obtenir une bonne qualité.**RVQ**: un petit codebook 级联──le premier codebook 量化编码器 输出; le second quantization residual; selon ce type de recommandation── chaque codebook a 1024 个码库──8 个码库 = 1024^8 = 10^24 的有效词表──

En déduction, le décodeur va rechercher et reconstruire le code de chaque édition.

### Les quatre codecs les plus importants de l'année 2026

**EnCodec (Meta, 2022)。**基线──基于波形的编码码器,RVQ瓶──24 kHz,maximum可用32 代码簿,默认4 代码簿 @ 1.5 kbps──使用 `1D conv + transformer + 1D conv`La musique est une musique.

**DAC (Descript, 2023)。**Utilisation de codebook L2 normalisé ∞ fonction d'activation périodique et amélioration de la perte de RVQ∞ fidélité de reconstruction dans tous les codecs ouverts La plus haute, parfois l'utilisation de 12 codebook ∞ avec le langage original est presque impossible de distinguer ∞ 44.1 kHz ∞

**SNAC (Hubert Siuzdak, 2024)。**Le taux d'image du livre de code RVQ à grande échelle est inférieur à celui du livre de code à petite échelle.

**Mimi (Kyutai, 2024)。**Le nombre de cadres est de 12,5 Hz, 8 个_codebook @ 4.4 kbps──codebook 0 是 **从 WavLM distill 得到的**Les codes 1-7 sont résiduels acoustiques, ce qui a été décomposé par Moshi (leçon 15) et Sesame CSM.

### Le taux de cadres est important pour la formation de langages

Réduction du taux de cadres = Réduction de la fréquence = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres = Réduction de la fréquence de cadres

| Codec | Frame rate | 1 s = N frames | 适合 |
|-------|-----------|----------------|---------|
| EnCodec-24k | 75 Hz | 75 | 音乐、通用音频 |
| DAC-44.1k | 86 Hz | 86 | 高保真音乐 |
| SNAC-24k (coarse) | ~12 Hz | 12 | AR-LM 高效生成 |
| Mimi | 12.5 Hz | 12.5 | 流式语音 |

En 12,5 Hz, en 10 secondes, il n'y a que 125 cadres de codec, le Transformer peut facilement les prédire.

### 语义 Token vs 声学 Token

```
frame_t → [semantic_token_t, acoustic_token_0_t, acoustic_token_1_t, ..., acoustic_token_6_t]
```

- **Semantic token（Mimi 中的 codebook 0）。**编码说了什么,即音素、词、内容──通过辅助预测 Losses de la distillation de la L'onde 得到──
- **Acoustic tokens（codebooks 1-7）。**编码音色、说话人身份、律、背景噪音、精细细节──

AR LM 先预测 sémantique token(以文本为条件),再预测 sémantique + haut-parleur référence 为条件) ・・・ Cette factualisation est moderne TTS 能够零射 克隆声音的原因:sémantique modèle 处理内容;acoustic model 处理音色。

### 2026 qualité de la reconstruction ((bit par seconde, bitrate 越低越好)

| Codec | Bitrate | PESQ | ViSQOL |
|-------|---------|------|--------|
| Opus-20kbps | 20 kbps | 4.0 | 4.3 |
| EnCodec-6kbps | 6 kbps | 3.2 | 3.8 |
| DAC-6kbps | 6 kbps | 3.5 | 4.0 |
| SNAC-3kbps | 3 kbps | 3.3 | 3.8 |
| Mimi-4.4kbps | 4.4 kbps | 3.1 | 3.7 |

Comme Opus, le codec traditionnel sur la qualité de perception de chaque bit est encore en train de surmonter.**离散 Token**(Opus 不产生这种 Token)**generative-model quality**(LM 能如何使用这些代币)


```figure
rvq-codec-cascade
```

## - Je le construis.

### 步骤 1: utiliser EnCodec pour encoder

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

6 kbps 时`n_codebooks=8`◊ chaque code est 0-1023 ◊10-bit) ◊

### 步骤 2: décode et reconstruction de la mesure

```python
with torch.no_grad():
    wav_recon = model.decode([(codes, scale)])

from torchaudio.functional import compute_deltas
import torch.nn.functional as F

mse = F.mse_loss(wav_recon[:, :, :wav.shape[-1]], wav).item()
```

### 步骤 3: séparation sémantique-acoustique

```python
from moshi.models import loaders
mimi = loaders.get_mimi()

with torch.no_grad():
    codes = mimi.encode(wav)  # shape (1, 8, frames@12.5Hz)

semantic = codes[:, 0]
acoustic = codes[:, 1:]
```

Le code de la sémantique 0 avec WavLM 对齐. Vous pouvez entraîner un transformateur texte à sémantique,词表比直接到音频小得多.

### étape 4: Pourquoi codec Token de l'AR LM

Pour Mimi, 12,5 Hz × 8 codes, un film de 10 secondes:

```
N_tokens = 10 * 12.5 * 8 = 1000 tokens
```

1000 Tokens pour Transformer pour dire un très petit sur la page ci-dessous. Un Transformer de 256M parametres peut être généré en 10 secondes par GPU moderne.

## Utilisez-le

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

- **Codebook 太多。**L'ajout d'un codebook augmentera la fidélité, mais augmentera également la longueur de la séquence de LM.
- **Frame-rate mismatch。**À 12,5 Hz Mimi s'entraîne à LM, puis à 50 Hz EnCodec s'affiche à la fine, et ça ne va pas.
- **假设所有 codebook 都等价。**Dans Mimi, le codebook 0 porte du contenu; perdre il détruira la compréhension.
- **把 reconstruction quality 当作唯一指标。**Si la structure sémantique est très mauvaise, un codec même une reconstruction  très bien, il est également possible de ne pas utiliser la génération basée sur LM.

## Je le livre.

保存为 `outputs/skill-codec-picker.md`◊ Choisir un codec pour une tâche de production ou de compression déterminée.

## 练习

1. **Easy。**运行  référencement`code/main.py`Il a réalisé un quantificateur de jouets scalaire + résiduel,并测量 avec l'ajout d'erreur de reconstruction du codebook 如何变化──
2. **Medium。**Montage`encodec`, en conservant des séquences de voix, comparer 1⁄4, 8⁄32 de livres de code, et en dessinant PESQ ou MSE par rapport au bitrate.
3. **Hard。**La mise en place de la carte de code 0 est un processus de décomposition. La mise en place de la carte de code 7 est une méthode de décomposition.

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
- [Kumar et al. (2023). Descript Audio Codec (DAC)](https://arxiv.org/abs/2306.06546) Le codec le plus sûr de tous.
- [Siuzdak (2024). SNAC](https://arxiv.org/abs/2410.14411) RVQ à grande échelle。
- [Kyutai (2024). Mimi codec](https://kyutai.org/codec-explainer) séparation sémantique-acoustique, distillation de WAVLM
- [Borsos et al. (2023). AudioLM](https://arxiv.org/abs/2209.03143) 两阶段 sémantique/acoustique 范式。
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) Le plus ancien codec RVQ disponible
