# 音乐生成 音乐Gen,稳定音频,苏诺以及许可格局的剧变

> 2026年的音乐产量:Suno v5 和 Udio v4 主导商业市场;MusicGen, Stable Audio Open 和 ACE-Step 引领开源方向――技术问题基本已解决――法律问题(Warner Music $500M 和解、UMG 和解) 在2025-2026年重塑整个领域――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 4 · 10 (Diffusion Models)
**Time:** ~75 minutes

## 问题

文本 → 一段 30 秒到 4 分钟的音乐片段,包含歌词、人声和结构──三子问题:

1. **器乐生成。**像"热键的低音哈普鼓" 这样文本 → 音频――音乐Gen,稳定音频,音频LDM――
2. **歌曲生成（带人声 + 歌词）。**关于雨天的德克萨斯州夜晚的乡村歌曲
3. **条件式 / 可控。**扩展已有段段"",重新生成桥"",切换类型"",干部分离,或涂料"",Udio的涂料+干部分离是2026年要对标的功能──

## 概念

![音乐生成：token-LM vs diffusion，2026 模型地图](../assets/music-generation.svg)

### 基于神经码码的标志 LM

标签:**MusicGen**(2023,MIT) 以及许多衍生模型:以文本 /旋律嵌入为条件,自归预测EnCodec Token(32 kHz,4 个代码书),再使用EnCodec 解码──300M - 3.3B 参数──强基线;超过30秒后表现吃力──

**ACE-Step**开源4B XL 于2026年4月发布) 将扩展到以歌词为条件的完整歌曲生成.

### 基于或隐藏的传播

**Stable Audio (2023)**和 **Stable Audio Open (2024)**在压缩音频上做潜伏散播――擅长循环、音响设计、环境纹理――不太适合结构化完整歌曲――

**AudioLDM / AudioLDM2**通过T2I式隐藏传播做文字到音频,泛化到音乐、音效、语音──

### 混合生产级苏诺,乌迪奥,丽亚

闭源权重──很可能是AR编程器 LM + 基于 Diffusion 的声器,并配有专门的声音 / 鼓 / 旋律头──Suno v5(2026) 是 ELO 1293 的质量领先者──Udio v4 增加了涂料 + 干部分离(bass,鼓,声乐可分开下载)。

### 评估

- **FAD (Fréchet Audio Distance)。**使用VGGish或PANN功能,衡量生成音频分布与真音频分布之间的嵌入层次距离──越低越好──音乐Gen小:音乐Caps 上 4.5 FAD;SOTA ~3.0──
- **音乐性（主观）。**人类偏好──苏诺 v5 ELO 1293 领先──
- **文本-音频对齐。**快速输出与输出之间的CLAP分数.
- **音乐性瑕疵。**节拍错位的转场、人声短语漂移、30秒后结构丢失──

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

- **Warner Music vs Suno 和解。**现在,Suno的AI像,音乐权利和用户生成曲目拥有监督权.
- **EU AI Act**其他**California SB 942**音乐必须披露.
- 在 MIT 许可下**Riffusion / MusicGen**没有合规包,但也没有商业级人声.

可安全交付模式:

1. 音乐Gen,稳定音频开放,MIT/CC0 输出)
2. 使用商业API (Suno,Udio,ElevenLabs Music),并带有按次生成的许可.
3. 在自有或已授权曲库上训练中,大多数企业最终会走到这里.
4. 为生成内容添加水印+元数据──


```figure
sp-codec-tokens
```

## 构建它

### 步骤1: 使用音乐Gen 生成

```python
from audiocraft.models import MusicGen
import torchaudio

model = MusicGen.get_pretrained("facebook/musicgen-small")
model.set_generation_params(duration=10)
wav = model.generate(["upbeat synthwave with driving drums, 128 BPM"])
torchaudio.save("out.wav", wav[0].cpu(), 32000)
```

三种尺寸:`small`快速的速度`medium`其他类型`large`很少有足够验证这个想法是否成立.

### 步骤 2: 旋律条件控制

```python
melody, sr = torchaudio.load("humming.wav")
wav = model.generate_with_chroma(
    ["jazz piano cover"],
    melody.squeeze(),
    sr,
)
```

音乐Gen-melody 接收染色符号,在替换节奏的同时保留调音.

### 步骤3:FAD 评估

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()

fad.get_fad_score("generated_folder/", "reference_folder/")
```

计算 VGGish-Embedding 距离――适合类型层级的回归测试;不能替代人类听众――

### 步骤4: 加入LLM音乐工作流程

结合课程 7-8 中的思路:

```python
prompt = "Write a 30-second jazz loop. Describe the drums, bass, and piano voicing."
description = llm.complete(prompt)
music = musicgen.generate([description], duration=30)
```

## 使用它

| Goal | Stack |
|------|-------|
| 器乐 sound design | Stable Audio Open |
| 游戏 / adaptive music | Google Lyria RealTime (closed) |
| 带人声的完整歌曲（商业） | Suno v5 or Udio v4 with explicit license |
| 带人声的完整歌曲（开源） | ACE-Step XL or YuE |
| 短广告 jingle | MusicGen melody-conditioned on a hummed reference |
| 音乐视频背景 | MusicGen + Stable Video Diffusion |

## 2026年仍将进入生产陷

- **版权洗白 prompt。**现在会过这些,开源模型不会――添加你自己的过列表――
- **30 秒后的重复 / 漂移。**模型会循环. 对于多次生成做交叉,或使用ACE-Step 获得结构一致性.
- **Tempo 漂移。**模型会偏离BPM──在即时中使用BPM标签,并使用图书馆的`beat_track`后处理过.
- **人声清晰度。**很出色;开源模型在人声单词上常常很糊涂.
- **Mono 输出。**开源模型生成单个或假立体音.

## 交付它

保存为`outputs/skill-music-designer.md`◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎

## 练习

1. **Easy.**运行`code/main.py`△它会使用ASCII符号生成一个+鼓模式,也就是一幅音乐代卡通.
2. **Medium.**装备`audiocraft`根据参考类型的设置测量FAD──
3. **Hard.**使用ACE-Step (或音乐Gen-旋律),使用不同节奏提示 为同一段调子 生成三个变体――计算与提示的CLAP相似性 来验证对齐――

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

- [Copet et al. (2023). MusicGen](https://arxiv.org/abs/2306.05284) 开源自归归基准.
- [Evans et al. (2024). Stable Audio Open](https://arxiv.org/abs/2407.14358)音响设计 默认选择──
- [ACE-Step](https://github.com/ace-step/ACE-Step) 开源 4B 完整歌曲生成器,2026年 4 月。
- [Suno v5 platform docs](https://suno.com)商业质量领先者
- [AudioLDM2](https://arxiv.org/abs/2308.05734) 用于音乐+音效的隐藏传播――
- [WMG-Suno settlement coverage](https://www.musicbusinessworldwide.com/suno-warner-music-settlement/) 2025 年 11 月先例。
