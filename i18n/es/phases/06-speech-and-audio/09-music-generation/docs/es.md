# 音乐生成  MusicGen, Stable Audio, Suno, así como las secuencias de la escena

> 2026 años de música generación:Suno v5 y Udio v4 主导商业市场;MusicGen, Stable Audio Open 和 ACE-Step 引领开源方向──技术问题基本已解决──法律问题(Warner Music $500M 和解、UMG 和解) en 2025-2026 años ha vuelto a transformar todo el campo──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 4 · 10 (Diffusion Models)
**Time:** ~75 minutes

##  problemas

文本 → 一段 30 秒到 4 分钟的音乐片段, contenía歌词、人声和结构──三子问题:

1. **器乐生成。**像"lo-fi tambores de hip-hop con teclas calientes" 这样文本 → 音频──MusicGen, Stable Audio, AudioLDM──
2. **歌曲生成（带人声 + 歌词）。**"Cantada de país sobre las noches lluviosas de Texas" → 完整歌曲──Suno, Udio, YuE, ACE-Step──
3. **条件式 / 可控。**扩展已有片段、重新生成桥、切换类型、干部分离,或涂料──Udio de la pintura + separación de la tallo es 2026 años que debe hacer frente a la función de la marca──

## 概念

![音乐生成：token-LM vs diffusion，2026 模型地图](../assets/music-generation.svg)

### Basado en el código neuronal Token of Token LM

Meta de **MusicGen**(2023, MIT) así como muchos modelos derivados:以文本 / 旋律 Embedding 为条件,自归归预测 EnCodec Token(32 kHz,4 个代书), reutilización de EnCodec 解码──300M - 3.3B 参数──强基线; más de 30 segundos después de la presentación 吃力──

**ACE-Step**(Open Source, 4B XL 于 2026 4月发布) se extenderá esta dirección hasta la producción de canciones completas en condiciones de palabras.

### basado en la difusión mel o latente

**Stable Audio (2023)**Y **Stable Audio Open (2024)**En la actualidad, el diseño de sonido es un proceso de diseño de sonido.

**AudioLDM / AudioLDM2**A través de la difusión latente de estilo T2I hacer texto a audio,泛化到音乐、音效、语音──

### Hybrid (producción) Suno, Udio, Lyria

闭源权重──很可能是AR codec LM + 基于 Diffusion的 Vocoder,并配有专门的声音/鼓/旋律头部──Suno v5(2026) es el líder en calidad de ELO 1293──Udio v4 增加了涂料+干分离(bass,鼓,声可分开下载)──

###  evaluación

- **FAD (Fréchet Audio Distance)。**Utiliza VGGish o PANNs, mezclar la producción de distribución de sonido entre la distribución de sonido real y la distribución de sonido real.
- **音乐性（主观）。**El hombre está en el camino.
- **文本-音频对齐。**puntuación CLAP entre la salida y la salida.
- **音乐性瑕疵。**节拍错位的转场、人声短语漂移、30 segundos después la estructura se perdió。

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

- **Warner Music vs Suno 和解。**$500M──WMG ahora tiene derechos de supervisión sobre la inteligencia artificial de Suno, derechos musicales y derechos de generación de usuarios.
- **EU AI Act**¿ Qué es eso ?**California SB 942**No hay que dejarlo pasar.
- MIT  bajo licencia **Riffusion / MusicGen**No hay ningún acuerdo, pero tampoco hay un nivel comercial.

Modelo de entrega segura:

1. Sólo genereadores de música, Audio estable abierto, MIT/CC0 输出)
2. Utiliza API comercial (Suno, Udio, ElevenLabs Music), y con permiso de producción en línea.
3. En la mayoría de las empresas finalmente se van a este lugar.
4. Para generar contenido añadir agua + metadatos.


```figure
sp-codec-tokens
```

## Construirlo

### Paso 1: Utiliza MusicGen 生成

```python
from audiocraft.models import MusicGen
import torchaudio

model = MusicGen.get_pretrained("facebook/musicgen-small")
model.set_generation_params(duration=10)
wav = model.generate(["upbeat synthwave with driving drums, 128 BPM"])
torchaudio.save("out.wav", wav[0].cpu(), 32000)
```

Tres dimensiones:`small`(Capacidad de trabajo de la empresa)`medium`(1.5B)`large`(3.3B) ―Pequeño 足足验证 esta idea si se ha establecido──

### Paso 2: 旋律条件控制

```python
melody, sr = torchaudio.load("humming.wav")
wav = model.generate_with_chroma(
    ["jazz piano cover"],
    melody.squeeze(),
    sr,
)
```

MusicGen-melody 接收染色,在替换节奏的同时保留音调──适合把这个旋律变成弦乐四奏──

### Paso 3: FAD  evaluación

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()

fad.get_fad_score("generated_folder/", "reference_folder/")
```

计算 VGGish-Embedding 距离──适合类层级的归归测试;不能替代人类听众──

### Paso 4:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

结合 Lecciones 7-8 中的思路:

```python
prompt = "Write a 30-second jazz loop. Describe the drums, bass, and piano voicing."
description = llm.complete(prompt)
music = musicgen.generate([description], duration=30)
```

## Usalo

| Goal | Stack |
|------|-------|
| 器乐 sound design | Stable Audio Open |
| 游戏 / adaptive music | Google Lyria RealTime (closed) |
| 带人声的完整歌曲（商业） | Suno v5 or Udio v4 with explicit license |
| 带人声的完整歌曲（开源） | ACE-Step XL or YuE |
| 短广告 jingle | MusicGen melody-conditioned on a hummed reference |
| 音乐视频背景 | MusicGen + Stable Video Diffusion |

## El año 2026 todavía se encuentra en la trampa de la producción

- **版权洗白 prompt。**"Cantando al estilo de Taylor Swift"  商业 Suno/Udio 现在会过这些,开源模型不会──添加你自己的过列表──
- **30 秒后的重复 / 漂移。**AR 模型会循环── para hacer una cruz en varias generaciones, o utilizar ACE-Step  obtener coherencia estructural──
- **Tempo 漂移。**模型会偏离BPM──在提示中使用BPM tags,并使用图书馆的 `beat_track`Hacer después de procesar.
- **人声清晰度。**Suno 很出色; open source模型在人声单词上常常很糊──如果歌词重要,使用商业API或细节调──
- **Mono 输出。**开源模型生成 mono或假立体用合适的立体重建 升级(ex, Cartesia de la difusión de la estereo) 

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-music-designer.md` Para una vez la implementación de la música-gen 选择模型、许可策略、长度 / 结构计划和披露转载数据──

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`△ Se utiliza un símbolo ASCII para generar un patrón de tambor + generativo 和弦, es decir, una caricatura de género musical △ Si quieres, puedes usar cualquier renderizado MIDI 播放。
2. **Medium.**Instalación`audiocraft`, usando MusicGen-small  dirigido a 4 géneros de preguntas 生成 10 秒片段,并根据参考类型集 测量 FAD。
3. **Hard.**Utilización de ACE-Step (o MusicGen-melody), con diferentes timbres de instrucciones para la misma canción 生成三变体──计算与快速的 CLAP similitud 来验证对齐──

## 关键术语: "El hombre es un hombre"

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| FAD | Audio FID | 真实音频与生成音频的 Embedding 分布之间的 Fréchet distance。 |
| Chromagram | 作为 pitches 的旋律 | 每帧 12 维 Vector；作为 melody conditioning 的输入。 |
| Stems | 乐器 tracks | 分离出的 bass / drums / vocals / melody，格式为 WAV。 |
| Inpainting | 重新生成某一段 | Mask 一个时间窗口；模型只重新生成那一段。 |
| CLAP | Text-audio CLIP | 对比式 audio-text Embedding；评估 text-audio alignment。 |
| EnCodec | Music codec | MusicGen 使用的 Meta neural codec；32 kHz，4 个 codebooks。 |

## 延伸阅读

- [Copet et al. (2023). MusicGen](https://arxiv.org/abs/2306.05284) 开源自归归基准──
- [Evans et al. (2024). Stable Audio Open](https://arxiv.org/abs/2407.14358) diseño de sonido 默认选择。
- [ACE-Step](https://github.com/ace-step/ACE-Step) 开源 4B 完整歌曲生成器,2026 年 4 月。
- [Suno v5 platform docs](https://suno.com) 商业质量领先者──
- [AudioLDM2](https://arxiv.org/abs/2308.05734) Usó en la difusión latente de música + 音效──
- [WMG-Suno settlement coverage](https://www.musicbusinessworldwide.com/suno-warner-music-settlement/) 2025 年 11 月先例。
