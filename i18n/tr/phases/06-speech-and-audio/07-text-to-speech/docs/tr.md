# Metin-dan-Söz (TTS)  Tacotron'dan F5'e Kokoro'ya

> ASR,语音反转为文本; TTS,文本反转为语音──2026 yılının tekniği分为三部分:text → Token → mel,mel → waveform──2026 yılının teknik 技术分为三部分:text → Token → mel,mel → waveform──2026 yılın teknik 技术分为三部分:text → Token → mel,mel → waveform──2026 yılın teknik 技术分为三部分:text → Token → mel,mel → waveform──2026 yılın teknik 技术分为三部分:text → Token → mel,mel → mel → waveform──2026 yılın teknik 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ?? 技术 ??

**Type:** Build
**Languages:** Python
**先修要求:**6 · 02 aşaması (spektrogramlar ve mel), 5 · 09 aşaması (Seq2Seq), 7 · 05 aşaması (Tüm Transformer)
**Time:** ~75 minutes

## 问题

"Sadece bana bitkileri saat 6'da sulamayı hatırlatın". "Sana bir 3 saniyelik sesli film lazım, doğaya bak, doğru bir prosody var, dur dur dur, ağır sesle bitkileri doğru bir sesle gönderin ve gerçek zamanlı ses yardımcısı için CPU'da 300 ms içinde çalıştırılsın.

Modern TTS boru hattı şöyle görünüyor:

1. **Text frontend。**规范化文本(日期、数字、电子邮件),转换为 Phoneme 或 alt kelime Token,预测 prosody 特征──
2. **声学模型。**Metin → mel spektrogramı──Tacotron 2 (2017), FastSpeech 2 (2020), VITS (2021), F5-TTS (2024), Kokoro (2024)──
3. **Vocoder。**Mel → dalga şekli──WaveNet (2016), WaveRNN, HiFi-GAN (2020), BigVGAN (2022), ve 2024+ nöral kodek vokodörleri──

2026 yılına kadar, Diffusion ve flow-matching modellerinin ortaya çıkmasıyla birlikte, akustik + vokoder bölümü bulanık hale geldi.

## 概念

![Tacotron, FastSpeech, VITS, F5/Kokoro side-by-side](../assets/tts.svg)

**Tacotron 2 (2017)。**Seq2seq:char-embedding → BiLSTM kodlayıcı → konum duyarlı dikkat → autoregressive LSTM dekodör 输出 mel frames──慢(AR),长文本上不稳定──仍被作为基线引用──

**FastSpeech 2 (2020)。**Otomatik olarak geri dönmeyen──Duration predictor 输出每个 Phoneme 获得多少 mel frames──1-pass,比塔科特龙 快 10×──损失一些自然度(monotonic alignment),但到处都在使用──

**VITS (2021)。**通過變化推論將編碼器 + 流式時間 + HiFi-GAN vocoder 端到端联合训练──質量高,单模型──20222024年主导开源 TTS──变体:YourTTS(multi-speaker zero-shot)、XTTS v2(2024,Coqui)──

**F5-TTS (2024)。**基于流匹配的 Diffusion Transformer──自然 prosody, 5 秒参考音频 kullanarak sıfır çekim ses klonlaması──2026年开源 TTS 排行榜顶尖──335M params──

**Kokoro (2024)。**Küçük tip(82M)、可在CPU上运行、实时使用场景下一流的英文 TTS──封闭词表、仅英文、apache-2.0──

**OpenAI TTS-1-HD, ElevenLabs v2.5, Google Chirp-3。**商业 state of the art──ElevenLabs v2.5 的 duygu etiketleri("[püşkatti]", "[kahkaha etti]")和 karakter sesleri 在 2026年主导 sesli kitap üretimi──

### Vocoder 演进

| Era | Vocoder | Latency | Quality |
|-----|---------|---------|---------|
| 2016 | WaveNet | 仅 offline | 发布时的 SOTA |
| 2018 | WaveRNN | ~realtime | good |
| 2020 | HiFi-GAN | 100× realtime | 接近人类 |
| 2022 | BigVGAN | 50× realtime | 可泛化到不同 speakers/langs |
| 2024 | SNAC, DAC (neural codecs) | 与 AR models 集成 | 离散 Token，比特效率高 |

2026 yılına kadar, çoğu "TTS" modeli metinden dalga biçimine kadar bir model; mel spektrogramı bir iç gösterimdir.

### 评估

- **MOS (Mean Opinion Score)。**Toplu kaynaklı, hala altın standart. Çok yavaş.
- **CMOS (Comparative MOS)。**A-vs-B 偏好── ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒ ⇒     ⇒    ⇒ ⇒  ⇒    ⇒         ⇒      ⇒                                                                                                                                                                                          
- **UTMOS, DNSMOS。**无参考神经MOS öngörücüleri──用于排行榜──
- **CER (Character Error Rate) via ASR。**TTS çıkışı Whisper, hesap ve giriş metni CER olarak anlaşılabilirlik proxy olarak 
- **SECS (Speaker Embedding Cosine Similarity)。**Ses klonlaması 质量。

LibriTTS test-clean 上的2026 数字:

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

## Yapın onu.

### 步骤 1: fonemize giriş

```python
from phonemizer import phonemize
ph = phonemize("Hello world", language="en-us", backend="espeak")
# 'həloʊ wɜːld'
```

Telefonum genel bir köprü. Kırmızı metni VITS seviyesindeki kaliteye aktarmaktan kaçın.

### 步骤 2:运行 Kokoro(2026 CPU 默认)

```python
from kokoro import KPipeline
tts = KPipeline(lang_code="a")  # "a" = American English
audio, sr = tts("Please remind me to water the plants at 6 pm.", voice="af_bella")
# audio: float32 tensor, sr=24000
```

离线运行,单文件,82M params──

### 步骤 3: Kullanın ses klonlaması 运行 F5-TTS

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="my_voice_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please remind me to water the plants.",
)
```

传入一个 5 秒参考片段及其转录;F5 会 klon prosody 和 timbre。

### 步骤 4: HiFi-GAN vokoderi sıfırdan gerçekleştirmek

Çok büyük, öğretim senaryolarına yer veremem ama şekli şöyle:

```python
class HiFiGAN(nn.Module):
    def __init__(self, mel_channels=80, upsample_rates=[8, 8, 2, 2]):
        super().__init__()
        # 4 upsample blocks, total 256x to go from mel-rate to audio-rate
        ...
    def forward(self, mel):
        return self.blocks(mel)  # -> waveform
```

訓練:adversarial(short windows üzerinde ayrımcı) + mel-spektrogram yeniden yapılandırma Kayıp + özellik eşleşimi Kayıp──已商品化使用 `hifi-gan`repo veya nvidia-NeMo'nun önceden eğitilmiş kontrol noktaları

### 步骤 5: tam boru hattı (pseudokod)

```python
text = "Please remind me at 6 pm."
phones = phonemize(text)
mel = acoustic_model(phones, speaker=alice)      # [T, 80]
wav = vocoder(mel)                                # [T * 256]
soundfile.write("out.wav", wav, 24000)
```

## Kullan

2026 yıl teknik:

| Situation | Pick |
|-----------|------|
| 实时 English voice assistant | Kokoro (CPU) 或 XTTS v2 (GPU) |
| 从 5 s reference 进行 voice cloning | F5-TTS |
| 商业 character voices | ElevenLabs v2.5 |
| Audiobook narration | ElevenLabs v2.5 或 XTTS v2 + fine-tune |
| Low-resource language | 在 5–20 h target-lang data 上训练 VITS |
| Expressive / emotion tags | ElevenLabs v2.5 或 StyleTTS 2 fine-tune |

2026 yılına kadar açık kaynaklı liderler:**F5-TTS 代表质量，Kokoro 代表效率**Tarihçi olmadıkça, Tacotron'u seçmeyin.

## 陷

- **没有 text normalizer。**"Dr. Smith" 读作 "Doctor" 还是 "Drive"?"2026" 读作 "twenty twenty six" 还是 "two zero two six"?
- **OOV proper nouns。**"Ghumare" → "ghyu-mair"?
- **Clipping。**Vocoder çıkışı  çok az kesim, ama sonuç 时 mel ölçekleme eşleşmez olabilir ± 1.0 ∞始终使用 `np.clip(wav, -1, 1)`- Evet.
- **Sample-rate mismatch。**Kokoro 输出 24 kHz; Your downstream pipeline 期望 16 kHz → resampling, yoksa aliasing ortaya çıkacaktır。

## - Söyle.

保存为 `outputs/skill-tts-designer.md`◊ belirli ses 、 geçicilik 、 dil hedefi  TTS borusunu tasarlamak ◊

## 练习

1. **Easy。**运行  İşlem`code/main.py`▽ Oyuncak sözcüklerinden 构建 Phoneme sözlüğü,估计每个 Phoneme的持续时间,并印一假的"mel"日程──
2. **Medium。**Anasayfa: Kokoro,分別使用音声`af_bella`和 `am_adam`合成同一句话──比较 ses süreleri 和主观质量──
3. **Hard。**录制一段你自己的5秒参考片段――使用F5-TTS klonu 它──报告引用和克隆输出 之间SECS──

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

- [Shen et al. (2017). Tacotron 2](https://arxiv.org/abs/1712.05884) sek2 sek2 baseline。
- [Kim, Kong, Son (2021). VITS](https://arxiv.org/abs/2106.06103) 端到端 akış tabanlı。
- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) 当前开源 SOTA。
- [Kong, Kim, Bae (2020). HiFi-GAN](https://arxiv.org/abs/2010.05646)2026 yılında hala yayımlanan kullanımda olan vokoder
- [Kokoro-82M on HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M) 2024 CPU dostu İngiliz TTS。
