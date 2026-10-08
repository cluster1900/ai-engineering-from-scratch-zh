# Text-to-Speech (TTS)  De Tacotron à F5 et Kokoro

> ASR va transformer le langage en texte; TTS va transformer le langage en texte.

**Type:** Build
**Languages:** Python
**先修要求:**Phase 6 · 02 (spectrogrammes et mécanismes), phase 5 · 09 (seq2seq), phase 7 · 05 (transformateur complet)
**Time:** ~75 minutes

##  problématique

Vous avez besoin d'un clip de 3 secondes pour l'eau des plantes à 18h. Vous avez besoin d'une session de 3 secondes pour vous réveiller naturellement, vous avez une bonne prosodie, vous avez besoin d'un bon son pour émettre des " plants " et vous pouvez être en CPU pendant 300 ms à l'intérieur de votre système pour aider les assistants de son en temps réel.

Le pipeline moderne TTS ressemble à ceci:

1. **Text frontend。**规范化文本(日期、数字、电子邮件),转换为 Phoneme 或 sous-mot Token,预测 prosody 特征──
2. **声学模型。**Text → mel spectrogrammes。Tacotron 2 (2017), FastSpeech 2 (2020), VITS (2021), F5-TTS (2024), Kokoro (2024)。
3. **Vocoder。**Mel → forme d'onde──WaveNet (2016), WaveRNN, HiFi-GAN (2020), BigVGAN (2022), ainsi que les vocoders de codec neural de 2024+.

Dès 2026, avec l'apparition de modèles de diffusion et de correspondance de flux, la division acoustique + vocodère devient floue.

## 概念

![Tacotron, FastSpeech, VITS, F5/Kokoro side-by-side](../assets/tts.svg)

**Tacotron 2 (2017)。**Seq2seq:char-embedding → encodeur BiLSTM → attention à la localisation → décodeur LSTM autorégressif 输出 mel frames──慢(AR),长文本上不稳定──仍被作为基线引用──

**FastSpeech 2 (2020)。**Prédicteur de durée non autorégressif, mais jusqu'à présent utilisé.

**VITS (2021)。**通过变化推断将编码 + durée basée sur le flux + vocoder HiFi-GAN 端到端联合训练。质量高,单模型。20222024年主导开源 TTS。变体:YourTTS(multi-speaker zero-shot)、XTTS v2(2024,Coqui)。

**F5-TTS (2024)。**基于流量匹配的 Diffusion Transformer──自然 prosody, using 5 秒参考音频进行零射语音克隆──2026 年开源 TTS 排行榜顶尖──335M paramètres──

**Kokoro (2024)。**Il est également utilisé dans les systèmes de gestion de données (CPU) et les systèmes de gestion de données (CPU).

**OpenAI TTS-1-HD, ElevenLabs v2.5, Google Chirp-3。**商业 state of the art──ElevenLabs v2.5 的情感标签("[hésitant]", "[rires]")和角色声音 在 2026 年 主导听书制作──

### Vocoder 演进

| Era | Vocoder | Latency | Quality |
|-----|---------|---------|---------|
| 2016 | WaveNet | 仅 offline | 发布时的 SOTA |
| 2018 | WaveRNN | ~realtime | good |
| 2020 | HiFi-GAN | 100× realtime | 接近人类 |
| 2022 | BigVGAN | 50× realtime | 可泛化到不同 speakers/langs |
| 2024 | SNAC, DAC (neural codecs) | 与 AR models 集成 | 离散 Token，比特效率高 |

En 2026, la plupart des modèles "TTS" sont des modèles de texte à forme d'onde; le spectrogramme mail est une représentation interne.

###  évaluer

- **MOS (Mean Opinion Score)。**C'est toujours le standard d'or, très lent.
- **CMOS (Comparative MOS)。**A-vs-B 偏好── 更多
- **UTMOS, DNSMOS。**无参考 neural MOS predictors── pour être utilisé dans la liste de classement──
- **CER (Character Error Rate) via ASR。**Pour obtenir une sortie TTS  via Whisper, calcul et le texte d'entrée CER comme proxy de l'intelligibilité
- **SECS (Speaker Embedding Cosine Similarity)。**Le clonage vocale 质量。

L'épreuve de livres TTS est nette

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

## - Je le construis.

### 步骤 1: phonémiser l'entrée

```python
from phonemizer import phonemize
ph = phonemize("Hello world", language="en-us", backend="espeak")
# 'həloʊ wɜːld'
```

Phoneme est un pont général. Évitez de faire entrer du texte brut dans le texte de qualité au niveau de VITS.

### 步骤 2:运行 Kokoro(2026 CPU 默认)

```python
from kokoro import KPipeline
tts = KPipeline(lang_code="a")  # "a" = American English
audio, sr = tts("Please remind me to water the plants at 6 pm.", voice="af_bella")
# audio: float32 tensor, sr=24000
```

Il y a aussi des projets de recherche.

### 步骤 3: Utiliser le clonage vocale 运行 F5-TTS

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="my_voice_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please remind me to water the plants.",
)
```

传入一个 5 秒参考片段及其转录;F5 会克隆试听和音符和

### étape 4: réaliser le vocoder HiFi-GAN à partir de zéro

Trop grand, je ne peux pas mettre dans le script du tutoriel, mais il est en forme de ceci:

```python
class HiFiGAN(nn.Module):
    def __init__(self, mel_channels=80, upsample_rates=[8, 8, 2, 2]):
        super().__init__()
        # 4 upsample blocks, total 256x to go from mel-rate to audio-rate
        ...
    def forward(self, mel):
        return self.blocks(mel)  # -> waveform
```

訓練:adversarial(discriminateur sur les fenêtres courtes) + reconstruction du spectrogramme méle Perte + correspondance des caractéristiques Perte──已商品化使用 `hifi-gan`Les points de contrôle pré-entraînés de repo ou de Nvidia-NeMo.

### 步骤 5: le pipeline complet (pseudocode)

```python
text = "Please remind me at 6 pm."
phones = phonemize(text)
mel = acoustic_model(phones, speaker=alice)      # [T, 80]
wav = vocoder(mel)                                # [T * 256]
soundfile.write("out.wav", wav, 24000)
```

## Utilisez-le

2026: année technique

| Situation | Pick |
|-----------|------|
| 实时 English voice assistant | Kokoro (CPU) 或 XTTS v2 (GPU) |
| 从 5 s reference 进行 voice cloning | F5-TTS |
| 商业 character voices | ElevenLabs v2.5 |
| Audiobook narration | ElevenLabs v2.5 或 XTTS v2 + fine-tune |
| Low-resource language | 在 5–20 h target-lang data 上训练 VITS |
| Expressive / emotion tags | ElevenLabs v2.5 或 StyleTTS 2 fine-tune |

截至 2026 年的开源领袖:**F5-TTS 代表质量，Kokoro 代表效率**Si vous n'êtes pas historien, ne choisissez pas Tacotron.

## La trappe

- **没有 text normalizer。**"Dr. Smith" 读作 "Doctor" 还是 "Drive"?"2026" 读作 "twenty twenty six" 还是 "two zero two six"?
- **OOV proper nouns。**"Ghumare" → "ghyu-mair"? Pour des jetons inconnus 配备 fallback grapheme-to-phoneme modèle。
- **Clipping。**Les résultats du vocoder  très peu de coupures, mais l'incompatibilité de l'échelle des résultats 时 mel peut dépasser ± 1.0──始终使用 `np.clip(wav, -1, 1)`Il y a une autre.
- **Sample-rate mismatch。**Kokoro 输出 24 kHz; votre pipeline en aval 期望 16 kHz → reprendre l'échantillon, sinon il y aura un aliasing.

## Je le livre.

保存为 `outputs/skill-tts-designer.md`◊ Pour une voix déterminée, la latence et la langue cible                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## 练习

1. **Easy。**运行  référencement`code/main.py` À partir du vocabulaire de jouets 构建 Phoneme Dictionary, estimation de la durée de chaque Phoneme,并印一假的"mel"时间表──
2. **Medium。**Arrêtez de parler.`af_bella`et `am_adam`合成同一句话──比较音频持续和主观质量──
3. **Hard。**录制一段你自己的 5 秒参考片段──使用F5-TTS clone 它──报告引用和克隆输出 之间SECS──

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

- [Shen et al. (2017). Tacotron 2](https://arxiv.org/abs/1712.05884) ligne de base suivante 
- [Kim, Kong, Son (2021). VITS](https://arxiv.org/abs/2106.06103) 端到端 basé sur le flux
- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) 当前开源 SOTA。
- [Kong, Kim, Bae (2020). HiFi-GAN](https://arxiv.org/abs/2010.05646) Vocoder encore en usage en 2026
- [Kokoro-82M on HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M) 2024 TTS anglais convivial pour le processeur。
