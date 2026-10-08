# 音乐生成  MusicGen, Stable Audio, Suno, ainsi que les évolutions de la gamme

> 2026 années de musique génération:Suno v5 和 Udio v4 主导商业市场;MusicGen, Stable Audio Open 和 ACE-Step 引领开源方向──技术问题基本已解决──法律问题(Warner Music $500M 和解、UMG 和解) a remodelé l'ensemble du domaine en 2025-2026

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 4 · 10 (Diffusion Models)
**Time:** ~75 minutes

##  problématique

文本 → 一段 30 秒到 4 分钟的音乐片段, contenant des chansons, des voix humaines et des structures.

1. **器乐生成。**像"lo-fi hip-hop drums avec des touches chaudes" 这样文本 → 音频──MusicGen, Stable Audio, AudioLDM──
2. **歌曲生成（带人声 + 歌词）。**"Cant country sur les nuits pluvieuses au Texas" → 完整歌曲──Suno, Udio, YuE, ACE-Step──
3. **条件式 / 可控。**扩展已有片段、重新生成桥、切换类型、干-separate,或 inpaint──Udio's inpainting + stem separation is 2026 年要对标的功能──

## 概念

![音乐生成：token-LM vs diffusion，2026 模型地图](../assets/music-generation.svg)

### basé sur le codec neural Token of Token LM

Meta **MusicGen**(2023, MIT) ainsi que de nombreux modèles dérivés:以文本 / 旋律 Embedding 为条件,自归归预测 EnCodec Token(32 kHz,4 个代码书), réutilisation EnCodec 解码──300M - 3.3B 参数──强基线;

**ACE-Step**(Open Source, 4B XL 于 2026 4月发布) va élargir cette direction à la production complète de chansons à condition de paroles.

### Diffusion à base de méle ou latente

**Stable Audio (2023)**et **Stable Audio Open (2024)**Le son est très bien conçu, il est très facile de le faire.

**AudioLDM / AudioLDM2**: par diffusion latente de style T2I faire texte à audio,泛化到音乐、音效、语音。

### Hybride (production) Suno, Udio, Lyria

闭源权重──很可能是AR codec LM + 基于 Diffusion vocal,并配有专门的声音 /鼓 /旋律头子──Suno v5(2026) 是ELO 1293质量领先者──Udio v4 增加了涂料 +干分离(bass,鼓,声可分开下载)──

###  évaluer

- **FAD (Fréchet Audio Distance)。**Utilisation de fonctionnalités VGGish ou PANNs, mesure de la production de la distribution de son et de la distribution de son réel Embedding 层级距离──越低越好──MusicGen petit:MusicCaps 上 4.5 FAD;SOTA ~3.0──
- **音乐性（主观）。**Il est le premier à avoir été tué.
- **文本-音频对齐。**Rappelez-vous le score CLAP entre le point de sortie et le point de sortie.
- **音乐性瑕疵。**La structure est perdue.

## 2026 模型地图

| Model | Params | Length | Vocals | License |
|-------|--------|--------|--------|---------|
| MusicGen-large | 3.3B | 30 s | no | MIT |
| Stable Audio Open | 1.2B | 47 s | no | Stability non-commercial |
| ACE-Step XL (Apr 2026) | 4B | &gt; 2 min | yes | Apache-2.0 |
| YuE | 7B | &gt; 2 min | yes, multilingual | Apache-2.0 |
| Suno v5 (closed) | ? | 4 min | yes, ELO 1293 | commercial |
| Udio v4 (closed) | ? | 4 min | yes + stems | commercial |
| Google Lyria 3 (closed) | ? | real-time | yes | commercial |
| MiniMax Music 2.5 | ? | 4 min | yes | commercial API |

## 法律格局(2025-2026)

- **Warner Music vs Suno 和解。**$500M──WMG 现在对Suno 上的AI-likeness、音乐权利和用户生成曲目拥有监督权──Udio 上也有类似的UMG 和解──
- **EU AI Act**+ **California SB 942**Il faut le montrer.
- Le MIT  licence **Riffusion / MusicGen**Il n'y a pas de code de conduite, mais il n'y a pas de code de conduite.

Mode de livraison en toute sécurité:

1. Il est également un des principaux acteurs de la musique.
2. Utilisation de l'API commerciale (Suno, Udio, ElevenLabs Music), et avec une licence de production suivante.
3. Dans la plupart des entreprises, les formations sont finalement disponibles ici.
4. Pour générer du contenu + métadonnées.


```figure
sp-codec-tokens
```

## - Je le construis.

### 步骤 1: Utilisez MusicGen 生成

```python
from audiocraft.models import MusicGen
import torchaudio

model = MusicGen.get_pretrained("facebook/musicgen-small")
model.set_generation_params(duration=10)
wav = model.generate(["upbeat synthwave with driving drums, 128 BPM"])
torchaudio.save("out.wav", wav[0].cpu(), 32000)
```

3 dimensions:`small`(à 300 M, rapide)`medium`- le nombre de personnes concernées`large`(3.3B) ― Petit suffisamment pour vérifier si cette idée est vraie

### 步骤 2: 旋律条件控制

```python
melody, sr = torchaudio.load("humming.wav")
wav = model.generate_with_chroma(
    ["jazz piano cover"],
    melody.squeeze(),
    sr,
)
```

La musique Gen-melodie 接收染色,在替换节奏的同时保留音调──适合把这个旋律变成弦乐四旋奏──

### 步骤 3: évaluation du FAD

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()

fad.get_fad_score("generated_folder/", "reference_folder/")
```

計算 VGGish-Embedding 距离──适合类层级的回归测试;不能替代人类听众──

### 步骤 4: 加入 le flux de travail de la musique LLM

结合 Les leçons 7-8 中的思路:

```python
prompt = "Write a 30-second jazz loop. Describe the drums, bass, and piano voicing."
description = llm.complete(prompt)
music = musicgen.generate([description], duration=30)
```

## Utilisez-le

| Goal | Stack |
|------|-------|
| 器乐 sound design | Stable Audio Open |
| 游戏 / adaptive music | Google Lyria RealTime (closed) |
| 带人声的完整歌曲（商业） | Suno v5 or Udio v4 with explicit license |
| 带人声的完整歌曲（开源） | ACE-Step XL or YuE |
| 短广告 jingle | MusicGen melody-conditioned on a hummed reference |
| 音乐视频背景 | MusicGen + Stable Video Diffusion |

## 2026 encore dans la production

- **版权洗白 prompt。**"C'est une chanson au style de Taylor Swift"  商业 Suno/Udio 现在会过这些,开源模型不会──添加你自己的过列表──
- **30 秒后的重复 / 漂移。**AR 模型会循环── faire une croisée de plusieurs générations, ou utiliser ACE-Step  obtenir une cohérence structurelle──
- **Tempo 漂移。**模型会偏离BPM──在 prompt 中使用BPM tags,并使用图书馆的 `beat_track`Après avoir traité le problème.
- **人声清晰度。**Suno 很出色; open source模型在人声单词上常常很糊──如果歌词重要,使用商业API或细节调──
- **Mono 输出。**开源模型生成 mono或假立体音──用合适的立体音 reconstruction 升级(zzz, diffusion stéréo de Cartesia)。

## Je le livre.

保存为 `outputs/skill-music-designer.md` Pour une fois le déploiement de la génération de musique 选择模型、许可策略、长度 / 结构计划和披露元数据──

## 练习

1. **Easy.**运行  référencement`code/main.py`Il est utilisé pour générer un modèle de tambourinage génératif avec un symbole ASCII.
2. **Medium.**Montage`audiocraft`, utiliser MusicGen-small  pour 4 généros de prompt 生成 10 秒片段,并根据参考 жанр सेट 测量 FAD。
3. **Hard.**Utilisation de l'ACE-Step (ou de la musique générique) avec des commandes de différents timbres pour le même segment de la mélodie.

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| FAD | Audio FID | 真实音频与生成音频的 Embedding 分布之间的 Fréchet distance。 |
| Chromagram | 作为 pitches 的旋律 | 每帧 12 维 Vector；作为 melody conditioning 的输入。 |
| Stems | 乐器 tracks | 分离出的 bass / drums / vocals / melody，格式为 WAV。 |
| Inpainting | 重新生成某一段 | Mask 一个时间窗口；模型只重新生成那一段。 |
| CLAP | Text-audio CLIP | 对比式 audio-text Embedding；评估 text-audio alignment。 |
| EnCodec | Music codec | MusicGen 使用的 Meta neural codec；32 kHz，4 个 codebooks。 |

## 延伸阅读

- [Copet et al. (2023). MusicGen](https://arxiv.org/abs/2306.05284) 开源自归归基准:
- [Evans et al. (2024). Stable Audio Open](https://arxiv.org/abs/2407.14358) design sonore 默认选择。
- [ACE-Step](https://github.com/ace-step/ACE-Step) 开源 4B 完整歌曲生成器,2026 年 4 月。
- [Suno v5 platform docs](https://suno.com) 商业质量领先者──
- [AudioLDM2](https://arxiv.org/abs/2308.05734) Utilisé pour diffuser la musique + l'effet sonore.
- [WMG-Suno settlement coverage](https://www.musicbusinessworldwide.com/suno-warner-music-settlement/) 2025 年 11 月先例。
