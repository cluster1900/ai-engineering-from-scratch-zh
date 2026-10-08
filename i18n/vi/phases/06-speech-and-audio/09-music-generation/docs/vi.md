# 音乐生成  MusicGen, Stable Audio, Suno, cũng như giấy phép格局的剧变

> 2026 năm của sản xuất âm nhạc:Suno v5 和 Udio v4 主导商业市场;MusicGen, Stable Audio Open 和 ACE-Step 引领开源方向──技术问题基本已解决──法律问题(Warner Music $500M 和解、UMG 和解) trong năm 2025-2026 năm tái định hình toàn bộ lĩnh vực──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 4 · 10 (Diffusion Models)
**Time:** ~75 minutes

## 问题

文本 → 一段 30 秒到 4 分钟的音乐片段,包含歌词、人声和结构──三个子问题:

1. **器乐生成。**像"lo-fi hip-hop trống với khóa ấm áp" 这样文本 → 音频──MusicGen, Stable Audio, AudioLDM──
2. **歌曲生成（带人声 + 歌词）。**"Câu nhạc quốc gia về những đêm mưa ở Texas" → 完整歌曲──Suno, Udio, YuE, ACE-Step──
3. **条件式 / 可控。**扩展已有片段、重新生成桥、切换类型、干-lân,或涂料──Udio's inpainting +干分离是2026年要对标的功能──

## 概念

![音乐生成：token-LM vs diffusion，2026 模型地图](../assets/music-generation.svg)

### 基于神经码码的代码代码的代码 LM

Meta của **MusicGen**(2023, MIT) cũng như nhiều mô hình dẫn xuất:以文本 / 旋律 嵌入为条件,自归归预测 EnCodec Token(32 kHz,4 个代码书), tái sử dụng EnCodec 解码──300M - 3.3B 参数──强基线; hơn 30 秒后表现吃力──

**ACE-Step**(Open Source, 4B XL 于 2026 4月发布) sẽ mở rộng hướng này đến việc tạo ra bài hát hoàn chỉnh với điều kiện từ ngữ.

### Dựa trên mel hoặc ẩn

**Stable Audio (2023)**和 **Stable Audio Open (2024)**Trong khi đó, các bản nhạc có thể được phát hành trong một số trường hợp khác nhau.

**AudioLDM / AudioLDM2**: Thông qua T2I kiểu phân tán ẩn làm văn bản-đâu âm thanh,泛化到音乐、音效、语音。

### Hybrid (生产级)  Suno, Udio, Lyria

闭源权重──很可能是 AR codec LM + 基于 Diffusion 的 vocoder,并配有专门的声音 / drum / 旋律头子──Suno v5(2026) là ELO 1293质量领先者──Udio v4 增加了涂料 + 干分离(bass, drum, giọng hát 可分开下载)。

### 评估

- **FAD (Fréchet Audio Distance)。**Sử dụng VGGish hoặc PANN tính năng, đo lường tạo phân bố âm thanh频 và phân bố âm thanh thực sự giữa Embedding 层级距离──越低越好──MusicGen nhỏ:MusicCaps 上 4.5 FAD;SOTA ~3.0──
- **音乐性（主观）。**Nhân loại Ưu tiên: Suno v5 ELO 1293 领先:
- **文本-音频对齐。**CLAP điểm giữa prompt và output.
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

- **Warner Music vs Suno 和解。**500 triệu đô la. WMG hiện đang có quyền giám sát đối với Suno trên AI-likeness, quyền âm nhạc và quyền tạo ra các nhạc tựa của người dùng.
- **EU AI Act**+ **California SB 942**Ai sinh thành âm nhạc phải được tiết lộ.
- MIT  giấy phép **Riffusion / MusicGen**Không có quy định, nhưng cũng không có cấp độ thương mại.

Mô hình giao hàng an toàn:

1. Chỉ tạo máy乐(MusicGen, Stable Audio Open, MIT/CC0 输出)
2. Sử dụng API thương mại (Suno, Udio, ElevenLabs Music),并带有按次生成的许可.
3. Trong tự có hoặc đã được ủy quyền tập thể trên đào tạo (trong phần lớn các doanh nghiệp cuối cùng sẽ đi đến đây)
4. 为生成内容添加水印 + siêu dữ liệu.


```figure
sp-codec-tokens
```

##  xây dựng nó

### 步骤 1: 使用 MusicGen 生成

```python
from audiocraft.models import MusicGen
import torchaudio

model = MusicGen.get_pretrained("facebook/musicgen-small")
model.set_generation_params(duration=10)
wav = model.generate(["upbeat synthwave with driving drums, 128 BPM"])
torchaudio.save("out.wav", wav[0].cpu(), 32000)
```

3 kích thước:`small`(300M, tốc độ nhanh)`medium`(1.5B)`large`(3.3B) ✿ Đúng là đủ để chứng minh ý tưởng này có được thực hiện hay không.

### 步骤 2: 旋律条件控制

```python
melody, sr = torchaudio.load("humming.wav")
wav = model.generate_with_chroma(
    ["jazz piano cover"],
    melody.squeeze(),
    sr,
)
```

MusicGen-melody 接收染色符, trong thay đổi timbre, đồng thời giữ âm thanh.

### 步骤 3: FAD 评估

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()

fad.get_fad_score("generated_folder/", "reference_folder/")
```

计算 VGGish-Embedding 距离──适合类型 层级的回归测试;不能替代人类听众──

### 步骤 4: 加入 LLM- nhạc dòng công việc

结合 Bài học 7-8 中的思路:

```python
prompt = "Write a 30-second jazz loop. Describe the drums, bass, and piano voicing."
description = llm.complete(prompt)
music = musicgen.generate([description], duration=30)
```

## Sử dụng nó

| Goal | Stack |
|------|-------|
| 器乐 sound design | Stable Audio Open |
| 游戏 / adaptive music | Google Lyria RealTime (closed) |
| 带人声的完整歌曲（商业） | Suno v5 or Udio v4 with explicit license |
| 带人声的完整歌曲（开源） | ACE-Step XL or YuE |
| 短广告 jingle | MusicGen melody-conditioned on a hummed reference |
| 音乐视频背景 | MusicGen + Stable Video Diffusion |

## Năm 2026 vẫn sẽ rơi vào bẫy sản xuất

- **版权洗白 prompt。**"Câu hát theo phong cách của Taylor Swift"  商业 Suno/Udio 现在会过这些,开源模型不会──添加你自己的过列表──
- **30 秒后的重复 / 漂移。**AR 模型会循环── để tạo ra nhiều lần làm crossfade, hoặc sử dụng ACE-Step  đạt được sự thống nhất cấu trúc──
- **Tempo 漂移。**模型会偏离 BPM──在 prompt 中使用 BPM tags,并使用图书馆的 `beat_track`Làm sau xử lý quá 🏼
- **人声清晰度。**Suno 很出色; 开源模型在人声单词上常常很糊──如果歌词重要,使用商业API或细节调──
- **Mono 输出。**开源模型生成 mono或假立体──用合适的立体重建 升级(tức, Cartea 的立体 Diffusion)──

## 交付 nó

保存为 `outputs/skill-music-designer.md` Để triển khai một lần nhạc-gen  chọn mô hình, phép chiến lược, độ dài / cấu trúc kế hoạch và công bố siêu dữ liệu

## 练习

1. **Easy.**运行 `code/main.py`Nó sẽ sử dụng mã ASCII để tạo ra một mô hình trống + 鼓, cũng là một hình ảnh hoạt hình nhạc-gen. Nếu muốn, bạn có thể sử dụng bất kỳ trình chiếu MIDI nào.
2. **Medium.**                                          `audiocraft`, sử dụng MusicGen-small  nhắm đến 4 个类型提示 生成 10 秒片段,并根据参考类型集合 测量 FAD。
3. **Hard.**Sử dụng ACE-Step(or MusicGen-melody), sử dụng các lời nhắc âm thanh khác nhau 为同一段调 生成三个变体──计算与快速的CLAP相似性 来验证对齐──

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
- [Evans et al. (2024). Stable Audio Open](https://arxiv.org/abs/2407.14358) âm thanh thiết kế 默认选择。
- [ACE-Step](https://github.com/ace-step/ACE-Step) 开源 4B 完整歌曲生成器,2026 年 4 月。
- [Suno v5 platform docs](https://suno.com) 商业质量领先者──
- [AudioLDM2](https://arxiv.org/abs/2308.05734) 用于音乐 + 音效的潜伏传播──
- [WMG-Suno settlement coverage](https://www.musicbusinessworldwide.com/suno-warner-music-settlement/) 2025 年 11 月先例。
