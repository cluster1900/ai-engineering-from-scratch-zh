# 音乐生成  MusicGen, Stable Audio, Suno,以及许可格局的剧变

> 2026 yılının müzik üretimi:Suno v5 和 Udio v4 主导商业市场;MusicGen, Stable Audio Open 和 ACE-Step 引领开源方向──技术问题基本已解决──法律问题(Warner Music $500M 和解、UMG 和解) 2025-2026 yıllarında tüm alanı yeniden şekillendirdi──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 4 · 10 (Diffusion Models)
**Time:** ~75 minutes

## 问题

文本 → 一段 30 秒到 4 分钟的音乐片段,含歌词、人声和结构──三子问题:

1. **器乐生成。**像"lo-fi hip-hop davulları sıcak anahtarlarla" 这样文本 → 音频──MusicGen, Stable Audio, AudioLDM──
2. **歌曲生成（带人声 + 歌词）。**"Yağmurlu Teksas gecelerinden şarkı" → 完整歌曲──Suno, Udio, YuE, ACE-Step──
3. **条件式 / 可控。**扩展已有片段、再生成桥、切换类、干-separate,或 inpaint──Udio'nun boyanması +干分离 是 2026年要对标的功能──

## 概念

![音乐生成：token-LM vs diffusion，2026 模型地图](../assets/music-generation.svg)

### 基于神经码码的代码的代码 LM

Meta **MusicGen**(2023, MIT) ve birçok derived model:以文本 / 旋律 Embedding 为条件,自归归预测 EnCodec Token(32 kHz,4 个代书), EnCodec 解码──300M - 3.3B 参数──强基线; 30 秒后表现吃力──

**ACE-Step**(Open Source, 4B XL, 2026 Nisan ayında yayınlandı) bu yönü Suno'nun en yakın açık kaynak topluluğunun önerisi olarak sözcükle koşullanmış tam şarkı üretimine yayılacak.

### 基于 mel或 latent 的 扩散

**Stable Audio (2023)**和 **Stable Audio Open (2024)**Çevre yapısı, ses tasarımı, ses tasarımı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses yapısı, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses, ses,

**AudioLDM / AudioLDM2**T2I tarzı gizli yayılma yoluyla metin- ses, 泛化到音乐、音效、语音──

### Hibrit (Hibride) Suno, Udio, Lyria

闭源权重──很可能是AR codec LM + 基于 Diffusion 的 vocoder,并配有专门的声音 / drum / melody heads──Suno v5(2026) 是 ELO 1293 的质量领先者──Udio v4 增加了涂料 + stem separation(bass, drum, vocals 可分开下载)──

### 评估

- **FAD (Fréchet Audio Distance)。**VGGish veya PANN özellikleri kullanın,                                                                                                                                                                                                                                                         
- **音乐性（主观）。**İnsanların tercihleri.
- **文本-音频对齐。**Çıktı ve çıkış arasındaki CLAP puanı
- **音乐性瑕疵。**节拍错位的转场、人声短语漂移、30 saniye sonra yapı kaybedildi。

## 2026 model harita

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

- **Warner Music vs Suno 和解。**500 milyon dolar. WMG şimdi Suno'nun AI-likeliğine yönelik müzik hakları ve kullanıcı üretimi için bir dizi oluşturma hakkı vardır.
- **EU AI Act**+ **California SB 942**Bu yüzden de bunu açıklamalı.
- MIT  izin altında **Riffusion / MusicGen**没有合规包,但也没有商业级人声

Güvenli teslimat modeli:

1. Sadece üretimi için.
2. Suno, Udio, ElevenLabs Music),并带有按次生成的许可──
3. Bu yüzden, bu konuda bir çok şey yapmam gerekiyor.
4. İçeriği oluşturmak için 添水印 + metadata


```figure
sp-codec-tokens
```

## Yapın onu.

### 步骤 1: 使用 MusicGen 生成

```python
from audiocraft.models import MusicGen
import torchaudio

model = MusicGen.get_pretrained("facebook/musicgen-small")
model.set_generation_params(duration=10)
wav = model.generate(["upbeat synthwave with driving drums, 128 BPM"])
torchaudio.save("out.wav", wav[0].cpu(), 32000)
```

Üç boyut:`small`(Hızlı 300M)`medium`(1.5B)`large`(3.3B) ✿ Küçük 足足验证 bu fikirin gerçek olup olmadığını ✿

### 步骤 2: 旋律条件控制

```python
melody, sr = torchaudio.load("humming.wav")
wav = model.generate_with_chroma(
    ["jazz piano cover"],
    melody.squeeze(),
    sr,
)
```

MüzikGen-melody 接收染色,在替换调的同时保留音──适合把这段旋律变成弦乐四旋奏──

### 步骤 3: FAD 评估

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()

fad.get_fad_score("generated_folder/", "reference_folder/")
```

計算 VGGish-Embedding 距离──适合类层级的回归测试;不能替代人类听众──

### 步骤 4: 加入 LLM-music iş akışına

结合 Dersler 7-8 中的思路:

```python
prompt = "Write a 30-second jazz loop. Describe the drums, bass, and piano voicing."
description = llm.complete(prompt)
music = musicgen.generate([description], duration=30)
```

## Kullan

| Goal | Stack |
|------|-------|
| 器乐 sound design | Stable Audio Open |
| 游戏 / adaptive music | Google Lyria RealTime (closed) |
| 带人声的完整歌曲（商业） | Suno v5 or Udio v4 with explicit license |
| 带人声的完整歌曲（开源） | ACE-Step XL or YuE |
| 短广告 jingle | MusicGen melody-conditioned on a hummed reference |
| 音乐视频背景 | MusicGen + Stable Video Diffusion |

## 2026 yılında hala üretim tuzağından geçecek.

- **版权洗白 prompt。**"Taylor Swift'in tarzı şarkısı"  商业 Suno/Udio 现在会过这些,开源模型不会──添加你自己的过列表──
- **30 秒后的重复 / 漂移。**AR model döngüsü, birçok nesne için çaprazlama yapımı veya ACE-Step kullanımı ile yapısal uyum elde edilmesi
- **Tempo 漂移。**Model BPM'den uzaklaşacak.`beat_track`Yapma sonrası işleme.
- **人声清晰度。**Suno 很出色;开源模型在人声单词上常常很糊──如果歌词重要,使用商业API或细调──
- **Mono 输出。**开源模型生成 mono 或假立体──用合适的立体重建 升级(e.g., Cartesia'nın 立体 Diffusion) 

## - Söyle.

保存为 `outputs/skill-music-designer.md`◊ Bir kez müzik jenerasyonu dağıtımı için 选择模型、许可策略、长度 / 结构计划和披露元数据──

## 练习

1. **Easy.**运行  İşlem`code/main.py`△ bu ASCII 符号 ile bir generative和弦 oluşturur ve 鼓 tarzı, yani bir müzik-gen çizgi romanı oluşturur.
2. **Medium.**- Yapımcılık`audiocraft`, MusicGen-small kullanmak  4 个类型 提示 生成 10 秒片段,并根据参考类型 测量 FAD──
3. **Hard.**ACE-Step (or MusicGen-melody) kullanın, farklı timbre istekleri kullanın, aynı ses için.

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

- [Copet et al. (2023). MusicGen](https://arxiv.org/abs/2306.05284) 开源自归基准――
- [Evans et al. (2024). Stable Audio Open](https://arxiv.org/abs/2407.14358) ses tasarımı 默认选择──
- [ACE-Step](https://github.com/ace-step/ACE-Step) 开源 4B 完整歌曲生成器,2026 年 4 月。
- [Suno v5 platform docs](https://suno.com) 商业质量 öncüsü
- [AudioLDM2](https://arxiv.org/abs/2308.05734) Musik + 音效的潜伏传播──
- [WMG-Suno settlement coverage](https://www.musicbusinessworldwide.com/suno-warner-music-settlement/) 2025 yıl 11 月先例。
