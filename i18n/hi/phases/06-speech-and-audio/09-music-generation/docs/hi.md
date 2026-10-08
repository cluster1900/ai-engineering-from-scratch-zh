# 音乐生成  MusicGen, स्थिर ऑडियो, सूनो, तथा अनुमति格局的剧变

> 2026 साल का संगीत उत्पादन:सुनो v5 和 यूडियो v4 主导商业市场;MusicGen, Stable Audio Open 和 ACE-Step 引领开源方向──技术问题基本已解决──法律问题(Warner Music $500M 和解、UMG 和解) 2025-2026 साल में पूरे क्षेत्र को फिर से आकार दिया──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 4 · 10 (Diffusion Models)
**Time:** ~75 minutes

## 问题

文本 → 一段 30 सेकंड से 4 मिनट तक के संगीत के टुकड़े, जिसमें गीत, मनुष्य आवाज और संरचना शामिल हैंः

1. **器乐生成。**像"लो-फी हिप-हॉप ड्रम गर्म कुंजी के साथ" 这样文本 → 音频──MusicGen, स्थिर ऑडियो, ऑडियोLDM──
2. **歌曲生成（带人声 + 歌词）。**"वर्षात के बारे में देश गीत टेक्सास रातों" → 完整歌曲──सुनो, यूडियो, यूई, एसीई-स्टेप──
3. **条件式 / 可控。**扩展已有片段、重新生成桥、切换类别、干-अलग,或涂料──Udio का涂料+干分离是2026年要对标的功能──

## 概念

![音乐生成：token-LM vs diffusion，2026 模型地图](../assets/music-generation.svg)

### 基于神经-कोडेक टोकन 的 टोकन LM

मेटा **MusicGen**(2023,MIT) तथा कई व्युत्पन्न मॉडल:以文本 / 旋律 एम्बेडिंग 为条件,自归归预测 EnCodec Token(32 kHz,4 个代码簿), पुनः EnCodec 解码──300M - 3.3B 参数──强基线; 30 से अधिक सेकंड बाद प्रदर्शन吃力──

**ACE-Step**(Open Source, 4B XL 于 2026年4月发布) यह दिशा विस्तारित होगी और यह गीत के लिए एक पूर्ण गीत उत्पादन की शर्त पर होगी।

### 基于 mel या लटेंट का विसारण

**Stable Audio (2023)**和 **Stable Audio Open (2024)**:在压缩音频上做潜散──擅长循环、音响设计、环境纹理──不太适合结构化完整歌曲──

**AudioLDM / AudioLDM2**: T2I शैली के लटेंट विसारण के माध्यम से पाठ-ऑडियो,泛化到音乐、音效、语音──

### हाइब्रिड (उत्पादन)

闭源权重──很可能是AR कोडेक LM + 基于 Diffusion 的 Vocoder,并配有专门的声音 /鼓 /旋律头子──Suno v5(2026) 是ELO 1293 के质量领先者──Udio v4 增加了涂料 +干分离(bass,鼓,声乐可分开下载)。

### 评估

- **FAD (Fréchet Audio Distance)。**VGGish या PANNs सुविधाओं का उपयोग करें, ध्वनि वितरण और वास्तविक ध्वनि वितरण के बीच इम्बेडिंग स्तर की दूरी──越低越好── संगीतGen छोटाः संगीत कैप्स 上 4.5 FAD; SOTA ~3.0──
- **音乐性（主观）。**的人类偏好──Suno v5 ELO 1293 领先──
- **文本-音频对齐。**शीघ्र और आउटपुट के बीच CLAP स्कोर
- **音乐性瑕疵。**节拍错位的转场、人声短语漂移、30 सेकंड के बाद संरचना गायब हो गयी──

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

- **Warner Music vs Suno 和解。**$500M──WMG अब Suno के लिए AI-likeness、 संगीत अधिकार और उपयोगकर्ता उत्पादन曲目 के लिए निगरानी अधिकार है──Udio ऊपर भी इसी तरह के UMG और समाधान──
- **EU AI Act**+ **California SB 942**. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
- MIT के अनुमतियों के तहत**Riffusion / MusicGen** कोई अनुबंध नहीं है, लेकिन कोई व्यावसायिक स्तर की आवाज नहीं है

सुरक्षित वितरण का तरीकाः

1. केवल生成器乐(MusicGen, स्थिर ऑडियो ओपन, MIT/CC0 输出)
2. उपयोग वाणिज्यिक एपीआई (Suno, Udio, ElevenLabs Music),并带有按次生成的许可──
3. ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️
4. ऩय उत्पन्न सामग्री +मेटाडेटा


```figure
sp-codec-tokens
```

##  इसे निर्माण

### 步骤 1: 使用 MusicGen 生成

```python
from audiocraft.models import MusicGen
import torchaudio

model = MusicGen.get_pretrained("facebook/musicgen-small")
model.set_generation_params(duration=10)
wav = model.generate(["upbeat synthwave with driving drums, 128 BPM"])
torchaudio.save("out.wav", wav[0].cpu(), 32000)
```

तीन आकारः`small`(३०० एम, शीघ्र)`medium`(1.5B)`large`(3.3B) ✿ लघु 足足验证 यह विचार क्या सही है──

### 步骤 2: 旋律条件控制

```python
melody, sr = torchaudio.load("humming.wav")
wav = model.generate_with_chroma(
    ["jazz piano cover"],
    melody.squeeze(),
    sr,
)
```

संगीतGen-melody 接收染色符,在替换节奏的同时保留音调──适合把这段旋律变成弦乐四旋奏──

### 步骤 3: FAD 评估

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()

fad.get_fad_score("generated_folder/", "reference_folder/")
```

计算 VGGish-Embedding 距离──适合类别 层级的归归测试;不能替代人类听众──

### 步骤 4: 加入 LLM-संगीत कार्यप्रवाह

结合 पाठ 7-8 中的思路:

```python
prompt = "Write a 30-second jazz loop. Describe the drums, bass, and piano voicing."
description = llm.complete(prompt)
music = musicgen.generate([description], duration=30)
```

## इसका उपयोग करें

| Goal | Stack |
|------|-------|
| 器乐 sound design | Stable Audio Open |
| 游戏 / adaptive music | Google Lyria RealTime (closed) |
| 带人声的完整歌曲（商业） | Suno v5 or Udio v4 with explicit license |
| 带人声的完整歌曲（开源） | ACE-Step XL or YuE |
| 短广告 jingle | MusicGen melody-conditioned on a hummed reference |
| 音乐视频背景 | MusicGen + Stable Video Diffusion |

## 2026 में उत्पादन में फंसे हुए हैं।

- **版权洗白 prompt。**"टायलर स्विफ्ट की शैली में गीत"  商业 Suno/Udio 现在会过这些,开源模型不会──添加你自己的过列表──
- **30 秒后的重复 / 漂移。**एआर 模型会循环── अनेक उपक्रमों के लिए क्रॉसफेड, या एसीई-स्टेप का उपयोग  संरचनात्मक सामंजस्य प्राप्त करना──
- **Tempo 漂移。**模型会偏离BPM──在即时中使用BPM टैग,并使用图书馆的 `beat_track`किया है, और किया है।
- **人声清晰度。**Suno 很出色;开源模型在人声单词上常常很糊──如果歌词重要,使用商业API或细节调──
- **Mono 输出。**开源模型生成 моно अथवा झूठी स्टीरियो──用合适的 स्टीरियो पुनर्निर्माण 升级(उदाहरण, कार्टेशिया का स्टीरियो विसारण)。

## 交付 यह

保存为 `outputs/skill-music-designer.md`◊ एक बार संगीत-जन के तैनाती के लिए 选择模型、许可策略、长度/ 结构计划和披露 मेटाडेटा──

## अभ्यास

1. **Easy.**运行 `code/main.py` यह ASCII 符号 के साथ एक जनरेटिव和弦 उत्पन्न करने के लिए + 鼓 पैटर्न, यानि एक संगीत-जन कार्टून  यह  से उत्पन्न होता है  यदि इच्छा हो, तो आप किसी भी MIDI रेंडर 播放  से कर सकते हैं
2. **Medium.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `audiocraft`, उपयोग संगीतGen-छोटे  के लिए 4 类型 शीघ्र 生成 10 秒片段,并根据参考类型 सेट 测量 FAD。
3. **Hard.**उपयोग एसीई-स्टेप (ACE-Step) या म्यूजिक-जेन-मेलोडिस), विभिन्न टाइम्बर्स प्रॉम्प्ट्स के साथ एक ही खंड के लिए।

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

- [Copet et al. (2023). MusicGen](https://arxiv.org/abs/2306.05284) 开源自归归基准――
- [Evans et al. (2024). Stable Audio Open](https://arxiv.org/abs/2407.14358) ध्वनि-डिजाइन 默认选择──
- [ACE-Step](https://github.com/ace-step/ACE-Step) 开源 4B 完整歌曲生成器,2026 年 4 月。
- [Suno v5 platform docs](https://suno.com) 商业质量 अग्रणी
- [AudioLDM2](https://arxiv.org/abs/2308.05734) उपयोग में संगीत + 音效 का लटेंट विसारण──
- [WMG-Suno settlement coverage](https://www.musicbusinessworldwide.com/suno-warner-music-settlement/) 2025 साल 11 月先例。
