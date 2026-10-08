# 音乐生成  MusicGen, Stable Audio, Suno, bem como licença

> 2026 年的音乐生成:Suno v5 和 Udio v4 主导商业市场;MusicGen, Stable Audio Open 和 ACE-Step 引领开源方向──技术问题基本已解决──法律问题(Warner Music $500M 和解、UMG 和解) em 2025-2026 年重塑整个领域──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 4 · 10 (Diffusion Models)
**Time:** ~75 minutes

## 问题

文本 → 一段 30 秒到 4 分钟的音乐片段, contendo歌词、人声和结构──三子问题:

1. **器乐生成。**Como "bateria de hip-hop com teclas quentes" 这样文本 → 音频──MusicGen, Stable Audio, AudioLDM──
2. **歌曲生成（带人声 + 歌词）。**"Canção country sobre noites chuvosas no Texas" → 完整歌曲──Suno, Udio, YuE, ACE-Step──
3. **条件式 / 可控。**扩展已有片段、重新生成桥、切换类型、stam-separate,或 inpaint──Udio de pintura + separação de tronco é 2026 anos para se tratar de características──

## 概念

![音乐生成：token-LM vs diffusion，2026 模型地图](../assets/music-generation.svg)

### Baseado em código neural Token of Token LM

Meta de **MusicGen**(2023, MIT) e muitos modelos derivados:以文本 / 旋律 Embedding 为条件,自归归预测 EnCodec Token(32 kHz,4 个代码书), reutilização EnCodec 解码──300M - 3.3B 参数──强基线; mais de 30 segundos后表现吃力──

**ACE-Step**(Open Source, 4B XL 于 2026 4月发布) vai expandir essa direção para a produção de canções completas condicionadas a canções.

### Baseada em mel ou latente Diffusão

**Stable Audio (2023)**和 **Stable Audio Open (2024)**O que é um "song" de uma música que é muito diferente de "song" de um outro?

**AudioLDM / AudioLDM2**através de difusão latente de estilo T2I fazer texto-aúdio,泛化到音乐、音效、语音──

### Híbrido ( Suno, Udio, Lyria)

闭源权重──很可能是AR codec LM + 基于 Diffusion 的 vocoder,并配有专门的声音 / drum / melody heads──Suno v5(2026) é líder em qualidade do ELO 1293──Udio v4 增加了涂料 + stem separation(bass, drums, vocals 可分开下载)──

###  avaliação

- **FAD (Fréchet Audio Distance)。**Utilize VGGish ou PANNs, medir a produção de distribuição de som e a distribuição de som real em embutidos em níveis de distância.
- **音乐性（主观）。**O que é que é que é?
- **文本-音频对齐。**pontuação CLAP entre saída e saída.
- **音乐性瑕疵。**节拍错位的转场、人声短语漂移、30 segundos depois a estrutura foi perdida。

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

- **Warner Music vs Suno 和解。**US$ 500 milhões. WMG agora tem direitos de criação de músicas e de usuários, e tem direitos de supervisão.
- **EU AI Act**+ **California SB 942**Não há nada que não seja um "conhecimento".
- MIT  licença **Riffusion / MusicGen**Não há nenhuma regulamentação, mas também não há uma classe de pessoas.

Modelo de entrega segura:

1. Apenas geradores de música, Stable Audio Open, MIT/CC0 输出)
2. Utilize API comercial (Suno, Udio, ElevenLabs Music),并带有按次生成的许可.
3. Em sua própria ou autorizada formação em curricula (Most enterprises eventually will go here)
4. Para gerar conteúdo + metadados.


```figure
sp-codec-tokens
```

## Construí-lo

### 步骤 1: Use MusicGen 生成

```python
from audiocraft.models import MusicGen
import torchaudio

model = MusicGen.get_pretrained("facebook/musicgen-small")
model.set_generation_params(duration=10)
wav = model.generate(["upbeat synthwave with driving drums, 128 BPM"])
torchaudio.save("out.wav", wav[0].cpu(), 32000)
```

3 dimensões:`small`(300M, rápido)`medium`(1.5B)`large`(3.3B) ― Pequeno 足足验证 Esta ideia se é válida──

### 步骤 2: 旋律条件控制

```python
melody, sr = torchaudio.load("humming.wav")
wav = model.generate_with_chroma(
    ["jazz piano cover"],
    melody.squeeze(),
    sr,
)
```

MusicGen-melody 接收染色,在替换节奏的同时保留调──适合把这个旋律变成弦乐四旋奏──

### 步骤 3: FAD 评估

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()

fad.get_fad_score("generated_folder/", "reference_folder/")
```

計算 VGGish-Embedding 距离──适合类层级的回归测试;不能替代人类听众── não pode substituir o público-alvo.

### 步骤 4: 加入 LLM-music workflow

结合 Lições 7-8 中的思路:

```python
prompt = "Write a 30-second jazz loop. Describe the drums, bass, and piano voicing."
description = llm.complete(prompt)
music = musicgen.generate([description], duration=30)
```

## Use-o

| Goal | Stack |
|------|-------|
| 器乐 sound design | Stable Audio Open |
| 游戏 / adaptive music | Google Lyria RealTime (closed) |
| 带人声的完整歌曲（商业） | Suno v5 or Udio v4 with explicit license |
| 带人声的完整歌曲（开源） | ACE-Step XL or YuE |
| 短广告 jingle | MusicGen melody-conditioned on a hummed reference |
| 音乐视频背景 | MusicGen + Stable Video Diffusion |

## 2026 ainda entrará em produção

- **版权洗白 prompt。**"Canção no estilo de Taylor Swift"  商业 Suno/Udio 现在会过这些,开源模型不会──添加你自己的过列表──
- **30 秒后的重复 / 漂移。**AR 模型会循环── para várias gerações fazer crossfade, ou usar ACE-Step  obter união estrutural──
- **Tempo 漂移。**模型会偏离BPM──在 prompt 中使用BPM tags,并使用图书馆的 `beat_track`Fazer o que fizemos.
- **人声清晰度。**Suno 很出色; open source模型在人声单词上常常很糊──如果歌词重要,使用商业API或细调──
- **Mono 输出。**开源模型生成 mono或假立体音频──用合适的立体音频重建 升级(e.g., Cartesia de estereo Diffusion)──

## Entrega-o

保存为 `outputs/skill-music-designer.md` Para uma vez de implantação de música-gen 选择模型、许可策略、长度 / 结构计划和披露元数据──

## 练习

1. **Easy.**运行 `code/main.py`△ Ele irá usar o símbolo ASCII para gerar um padrão de tambor + 鼓, é o mesmo que um desenho animado de geração musical.
2. **Medium.**Instalação`audiocraft`, usando MusicGen-small  para 4 个类型提示 生成 10 秒片段,并根据参考类型集合 测量 FAD。
3. **Hard.**Utilize ACE-Step(or MusicGen-melody), use diferentes timbre prompts 为同一段调 生成三个变体──计算与 prompt 的 CLAP相似性 来验证对齐──

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

- [Copet et al. (2023). MusicGen](https://arxiv.org/abs/2306.05284) 开源自归归基准──
- [Evans et al. (2024). Stable Audio Open](https://arxiv.org/abs/2407.14358) design de som 默认选择。
- [ACE-Step](https://github.com/ace-step/ACE-Step) 开源 4B 完整歌曲生成器,2026 年 4 月。
- [Suno v5 platform docs](https://suno.com) 商业质量领先者──
- [AudioLDM2](https://arxiv.org/abs/2308.05734) Usó em Música + 音效的潜伏 Diffusion──
- [WMG-Suno settlement coverage](https://www.musicbusinessworldwide.com/suno-warner-music-settlement/) 2025 年 11 月先例。
