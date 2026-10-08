# 音乐生成  MusicGen, سيبل أوديو, سونو, و

> 2026 سنة من الموسيقى إنتاج:Suno v5 و Udio v4 主导商业市场;MusicGen, Stable Audio Open و ACE-Step 引领开源方向──技术问题基本已解决──法律问题(Warner Music $500M 和解、UMG 和解) في 2025-2026 سنة أعادت تشكيل المجال بأكمله──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 4 · 10 (Diffusion Models)
**Time:** ~75 minutes

## 问题

文本 → 一段 30 秒到 4 分钟的音乐片段,包含歌词、人声和结构──三子问题:

1. **器乐生成。**مثل "طبولات هيب هوب لو-في مع مفاتيح دافئة" 这样文本 → 音频──MusicGen, Stable Audio, AudioLDM──
2. **歌曲生成（带人声 + 歌词）。**"غنية بلدية عن ليال تكساس المطرية" → 完整歌曲──Suno, Udio, YuE, ACE-Step──
3. **条件式 / 可控。**扩展已有片段、重新生成桥、切换类型、干部分离,或涂料──涂料+分离干部的Udio 是2026年要对标的功能──

## 概念

![音乐生成：token-LM vs diffusion，2026 模型地图](../assets/music-generation.svg)

### 基于神经码码标的标 LM

الميتا **MusicGen**(2023,MIT) وكذلك العديد من النماذج المنتجة:以文本 / 旋律 Embedding 为条件,自归预测 EnCodec Token(32 kHz,4 个代书), إعادة استخدام EnCodec 解码──300M - 3.3B 参数──强基线; أكثر من 30 ثانية بعد

**ACE-Step**(Open Source، 4B XL) تم نشرها في 4 أشهر من عام 2026) سوف يمتد هذا الاتجاه إلى إنتاج أغنية كاملة مشروطة بالغزل.

### على أساس الميل أو الخفية

**Stable Audio (2023)**和 **Stable Audio Open (2024)**:在压缩音频上做 latence Diffusion──擅长循环、音形设计、环境 texture──不太适合结构化完整歌曲──

**AudioLDM / AudioLDM2**: من خلال التوزيع المتخفي في نمط T2I جعل النص إلى الصوت،泛化到音乐、音效、语音。

### المختلفة (Suno, Udio, Lyria)

闭源权重──很可能是AR codec LM + 基于 Diffusion 的 vocoder,并配有专门的声音 /鼓 /旋律头部──Suno v5(2026) 是 ELO 1293 的质量领先者──Udio v4 增加了涂料 +干分离(bass, drum, vocals 可分开下载)──

### 评估

- **FAD (Fréchet Audio Distance)。**استخدام VGGish أو PANNs ميزات، قياس توليد التوزيع الصوتي وتوزيع الصوت الحقيقي بين إدمج 层级距离──越低越好──MusicGen small:MusicCaps 上 4.5 FAD;SOTA ~3.0──
- **音乐性（主观）。**人类偏好──Suno v5 ELO 1293 领先──
- **文本-音频对齐。**النتيجة CLAP بين الناتج والخروج
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

- **Warner Music vs Suno 和解。**500 مليون دولار. وومغ الآن تتعامل مع صونو على شبكة الذكاء الاصطناعي.
- **EU AI Act**+ **California SB 942**لا بد أن يظهر
- تحت رخصة MIT**Riffusion / MusicGen**لا توجد أيّة قوانين، ولكن لا توجد أيّة صوتاً تجارية.

نمط تسليم آمن:

1. فقط توليد آلات乐(MusicGen, استقرار الصوت مفتوح, MIT/CC0 输出)
2. استخدام API تجاري ((Suno, Udio, ElevenLabs Music),并带有按次生成的许可──
3. في التدريب على المجموعة المعتمدة أو المعتمدة (معظم الشركات ستذهب إلى هنا)
4. لتوليد المحتوى إضافة المعلومات المعلوماتية


```figure
sp-codec-tokens
```

## بناءها

### 步骤 1: استخدام MusicGen 生成

```python
from audiocraft.models import MusicGen
import torchaudio

model = MusicGen.get_pretrained("facebook/musicgen-small")
model.set_generation_params(duration=10)
wav = model.generate(["upbeat synthwave with driving drums, 128 BPM"])
torchaudio.save("out.wav", wav[0].cpu(), 32000)
```

ثلاثة أبعاد:`small`(300م، بسرعة)`medium`(1.5ب)`large`(3.3ب) ✿ صغير 足足验证 هل هذا الفكر قد تم التحقق منه──

### 步骤 2: 旋律条件控制

```python
melody, sr = torchaudio.load("humming.wav")
wav = model.generate_with_chroma(
    ["jazz piano cover"],
    melody.squeeze(),
    sr,
)
```

الموسيقىGen-melody 接收染色,在替换节奏的同时保留音调──适合把这段旋律变成弦乐四旋奏──

### الخطوة الثالثة: FAD 评估

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()

fad.get_fad_score("generated_folder/", "reference_folder/")
```

计算 VGGish-Embedding 距离──适合类 层级的回归测试;不能替代人类听众──

### الخطوة 4:  إضافة إلى تدفق عمل LLM- الموسيقى

结合 الدروس 7-8 中的思路:

```python
prompt = "Write a 30-second jazz loop. Describe the drums, bass, and piano voicing."
description = llm.complete(prompt)
music = musicgen.generate([description], duration=30)
```

## استخدمها

| Goal | Stack |
|------|-------|
| 器乐 sound design | Stable Audio Open |
| 游戏 / adaptive music | Google Lyria RealTime (closed) |
| 带人声的完整歌曲（商业） | Suno v5 or Udio v4 with explicit license |
| 带人声的完整歌曲（开源） | ACE-Step XL or YuE |
| 短广告 jingle | MusicGen melody-conditioned on a hummed reference |
| 音乐视频背景 | MusicGen + Stable Video Diffusion |

## 2026 سيبقى في حالة حدوث حدوث

- **版权洗白 prompt。**"غناء في أسلوب تيلور سويفت"  商业 سونو/أوديو 现在会过这些,开源模型不会──添加你自己的过列表──
- **30 秒后的重复 / 漂移。**AR 模型会循环── لعدة أوقات من التوليد إلى التقاطع، أو استخدام ACE-Step  للحصول على توافق هيكلي
- **Tempo 漂移。**模型会偏离BPM──在 prompt 中使用BPM标签,并使用图书馆的 `beat_track`بعد التعامل
- **人声清晰度。**Suno 很出色; open source模型在人声单词上常常很糊──如果歌词重要,使用商业API或细调──
- **Mono 输出。**开源模型生成 mono أو false stereo──用合适的立体重建 升级((مثلاً، Diffusion of Cartesia)。

## 交付 it

保存为 `outputs/skill-music-designer.md` لتنفيذ موسيقى الجين مرة واحدة 选择模型、许可策略、长度 / 结构计划和披露元数据──

## التدريب

1. **Easy.**运行 `code/main.py` يستخدم رمز ASCII لإنتاج نمط + 鼓 , وذلك هو صورة كارتونية من نوع الموسيقى.
2. **Medium.**إعداد`audiocraft`, استخدام MusicGen-small 针对 4 类型提示 生成 10 秒片段,并根据参考类型集 测量 FAD。
3. **Hard.**استخدام ACE-Step (((أو MusicGen-melody) ، باستخدام استفسارات مختلفة الزمنية 为同一段旋律 生成三个变体──计算与快速的CLAP相似性 来验证对齐──

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

- [Copet et al. (2023). MusicGen](https://arxiv.org/abs/2306.05284) 开源自归归 مقياس
- [Evans et al. (2024). Stable Audio Open](https://arxiv.org/abs/2407.14358) تصميم الصوت 默认选择。
- [ACE-Step](https://github.com/ace-step/ACE-Step) 开源 4B 完整歌曲生成器,2026 年 4 月。
- [Suno v5 platform docs](https://suno.com) 商业质量领先者──
- [AudioLDM2](https://arxiv.org/abs/2308.05734) 用于音乐 + 音效的潜伏传播──
- [WMG-Suno settlement coverage](https://www.musicbusinessworldwide.com/suno-warner-music-settlement/) 2025 年 11 月先例。
