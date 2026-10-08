# 音频生成

> 音频是16-48 kHz du signal 1-D. Dans un fragment de cinq secondes, il y a 80-240k de l'échantillon. Aucun transformateur ne sera directement présent à cette séquence.

**类型：**Construction
**语言：**Python
**先修要求：**Phase 6 · 02(Fonctions audio) Phase 6 · 04(ASR) Phase 8 · 06(DDPM)
**时间：**Il est 45 minutes.

##  problématique

3 types de tâches de production:

1. **Text-to-speech。**给定文本,生成语音──干净语音是窄带的,并且有很强的音频结构,已经可以通过变压器-over-tokens 很好地解决──VALL-E(Microsoft)、NaturalSpeech 3、ElevenLabs、OpenAI TTS──
2. **音乐生成。**给定一个快速(文本、旋律、chord progression、genre),生成音乐──分布宽得多──MusicGen(Meta)、Stable Audio 2.5、Suno v4、Udio、Riffusion──
3. **音频效果 / sound design。**给定一个提示,生成环境声或 Foley──AudioGen、AudioLDM 2、Stable Audio Open──

Tout fonctionne sur la même base: codec audio neuronal + token-AR ou générateur de diffusion.

## 概念

![Audio generation: codec tokens + transformer or diffusion](../assets/audio-generation.svg)

### Codecs audio neuronaux

Encodec(Meta,2022)、SoundStream(Google,2021)、Descript Audio Codec(DAC,2023)。Un encodeur convolutionnel va compresser la forme d'onde en chaque étape de temps, un vecteur;Quantification vectorielle résiduelle(RVQ) Place chaque vecteur en K 个代码书指数的级联──Decoder 将其还原──Utilisez 8 个 RVQ codebook、75 Hz,可将24 kHz 音频压缩为2 kbps = 600 tokens/sec。

```
waveform (16000 samples/sec)
    └─ encoder conv ─┐
                     ├─ RVQ layer 1 → indices at 75 Hz
                     ├─ RVQ layer 2 → indices at 75 Hz
                     ├─ ...
                     └─ RVQ layer 8
```

### Les deux types de génération

**Token-autoregressive。**Pour chaque flux, il est possible de configurer un code de code de manière à ce que les utilisateurs puissent utiliser des fichiers de code de manière à ce que les fichiers soient configurés en fonction de la demande de texte + 3 secondes.

**Latent diffusion。**Le codec est utilisé pour la diffusion de texte à la diffusion audio à la diffusion audio à la diffusion audio à la diffusion audio à la diffusion audio à la diffusion audio.

Les tendances de 2024-2026: le flux correspondant est très adapté au streaming.

## Paysage de production

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

## - Je le construis.

`code/main.py`模拟核心思想: dans la séquence synthétique de "tokens audio" 序列上训练一个微小的下一个代币变压器, ces séquences proviennent de deux types différents de "style" ((style A 为低 Token 和高 Token 交换,style B 为单调 兰坡) ⋅ Basé sur le style 进行条件 并样子。

### 步骤 1: synthétiser des jetons audio

```python
def make_tokens(style, length, vocab_size, rng):
    if style == 0:  # "speech-like": alternating
        return [i % vocab_size for i in range(length)]
    # "music-like": ramp
    return [(i * 3) % vocab_size for i in range(length)]
```

### 步骤 2: entraîner un petit prédicteur de jetons

Un prédicteur de style bigram en fonction de la condition.

### 步骤 3: échantillon conditionnel

给定 style Token 和 start token, de pré测分布中样本 下一个 Token──持续生成 20-40 个 Token──

## La trappe

- **Codec quality caps output quality。**Si le codec 无法忠实表示某个声音,再高质量生成器也帮不上忙──DAC est la meilleure option du programme actuellement ouvert──
- **RVQ error accumulation。**Chaque couche RVQ est située dans le résidu de la première couche de construction. L'erreur de la première couche sera propagée.
- **Musical structure。**75 Hz 下 30 秒 Token 超過 20k 个──对 Transformer 很难──MusicGen 使用滑窗 + prompt continuation;Stable Audio 使用较短剪辑 + crossfading──
- **Artifacts at boundaries。**Il faut une superposition prudente.
- **Clean-data appetite。**音乐 generator 需要数万小时授权音乐──Suno / Udio RIAA suit(2024) Fais que le problème se pose
- **Voice cloning ethics。**Un échantillon de 3 secondes plus un texte rapide 就足以让 VALL-E / XTTS / ElevenLabs 克隆声音── chaque modèle de production a besoin de détection des abus + listes de refus de vote──

## Utilisez-le

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

## Je le livre.

保存 `outputs/skill-audio-brief.md` Apprendre à recevoir un bref résumé audio (task, duration, style, voix, licence),并输出:modèle + hosting, format rapide, étiquettes de genre, descripteurs de style, marqueurs structurels, codec + générateur + chaîne vocoder, protocole de semence, ainsi que le plan d'évaluation, score de MOS/CLAP / CER pour TTS/utilisateur A/B)

## 练习

1. **简单。**运行  référencement`code/main.py`Il est évident que le style de mise en place de la séquence est conforme au modèle de ce style.
2. **中等。**添加延迟并行解码:模拟 2 条 Token stream, elles doivent maintenir un décalage de 1 étape.
3. **困难。**Utilisation de transformateurs HuggingFace dans le domaine de la musique Gen-small. Utilisation de trois instantanés différents.

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

## Note de production:音频是 problème de diffusion

Le temps de production est une méthode d'exécution de l'attente de l'utilisateur, et non une seule fois. Pour chaque utilisateur, le serveur doit générer au moins 75 jetons par seconde pour maintenir la lecture en douceur.

两个架构后果:

- **Flow-matching audio models cannot stream trivially。**Stable Audio 2.5 和 AudioCraft 2 会一次性 render 固定长度的 clip──若要流,需要对片分块并重叠边界,可以理解为滑窗扩散;相比编程AR模型,会增加100-300ms的延迟过head──

Si le produit est "chat vocal en direct" ou "continuation de la musique en temps réel", choisissez le chemin du codec AR。 si est "render un clip de 30 secondes sur le soumission", flux-matching 在质量和总延迟上胜出。

## 延伸阅读
- [Défossez et al. (2022). Encodec: High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) codec 标准。
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) Le premier codec audio neural largement utilisé.
- [Kumar et al. (2023). High-Fidelity Audio Compression with Improved RVQGAN (DAC)](https://arxiv.org/abs/2306.06546) DAC。
- [Wang et al. (2023). Neural Codec Language Models are Zero-Shot Text to Speech Synthesizers (VALL-E)](https://arxiv.org/abs/2301.02111)- Je suis un homme.
- [Copet et al. (2023). Simple and Controllable Music Generation (MusicGen)](https://arxiv.org/abs/2306.05284) MusiqueGen。
- [Liu et al. (2023). AudioLDM 2: Learning Holistic Audio Generation with Self-supervised Pretraining](https://arxiv.org/abs/2308.05734) AudioLDM 2。
- [Stability AI (2024). Stable Audio 2.5](https://stability.ai/news/introducing-stable-audio-2-5) Utilisation de l'échange de flux de texte à musique de 2025
