# Nöral Ses Kodekleri  EnCodec, SNAC, Mimi, DAC 和 Semantic-Acoustic Split

> 2026 yılının sesli üretim neredeyse tümü Tokenlerdir. EnCodec、SNAC、Mimi 和 DAC 会将连续波形转换为变体 可以预测的离散序列──语义反音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音音

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 10 · 11 (Quantization), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 问题

语言模型处理离散 Token──音频是连续的── eğer siz de 音乐语音 / 音乐构建 LLM 风格的模型,如 MusicGen、Moshi、Sesame CSM、VibeVoice、Orpheus gibi bir LLM 风格的模型, you first need one **neural audio codec**Bir kodlayıcı, ses ses seslerini küçük bir kelime şeklinde ayırır.

İki aile oluştu:

1. **Reconstruction-first codecs** EnCodec、DAC──优化感知音频质量──Token is acoustic 的, bunlar konuşmacıların kimliğini, seslerini, arka plan gürültüsünü içeren her şeyi yakalar.
2. **Semantic-first codecs** Mimi (Kyutai)、SpeechTokenizer。强制第一个代码簿 编码语言 / 音素内容,通常通过从WavLM destill 得到──后续代码簿 是声学 细节──

2024-2026 yıllarındaki anlayış:**当你尝试从文本生成时，纯 reconstruction codec 会给你模糊的语音。**覆盖 Codec Token 的 LLM 必须在同一个代码书中同时学习语言结构和声学结构,这无法良好扩展──把它们分离出来,即语义代码书 0、声学代码书 1-N,正是Moshi 和芝麻 CSM 能工作的原因──

## 概念

![Four codec landscape: EnCodec, DAC, SNAC (multi-scale), Mimi (semantic+acoustic)](../assets/codec-comparison.svg)

### 核心技巧: Geri kalan vektör kvantizasyonu (RVQ)

Büyük bir kod defteri kullanmak yerine, iyi kalite elde etmek için milyonlarca kod gerekebilir.**RVQ**Birinci kod kitabı 量化エンコーディング 输出; ikinci 量化残留;依此类推── her kod kitabı 1024 代码書──8 代码簿 = 1024^8 = 10^24 的有效词表──

Sonuç olarak, dekodör her bir seçilen kodun yeniden oluşturulmasını bekler.

### 2026 yılının en önemli dört kodeksi

**EnCodec (Meta, 2022)。**基线──波形的编码码器-decoder,RVQ瓶──24 kHz,最多可用32 代码簿,默认4 代码簿 @ 1.5 kbps──使用 `1D conv + transformer + 1D conv`架构──MusicGen kullanmak──

**DAC (Descript, 2023)。**L2 normallaştırılmış kod defteri kullanmak, döngülü etkinleştirme işlevi ve gelişmiş Kayıpların RVQ¬ı kullanmak, tüm açık kodeklerde yeniden yapılandırma sadakati en yüksek, bazen 12 kod defteri kullanmak 时与原始语音几乎无法区分──44.1 kHz 全频带──

**SNAC (Hubert Siuzdak, 2024)。**Çok ölçekli RVQ, kaba derecede kod defterinin çerçeve oranı 细粒度 kod defterinden düşüktür. Aslında, LM'ye dayalı bir yapı olarak iyi görüntülenir.

**Mimi (Kyutai, 2024)。**2026 yılının anahtar sonu: 12.5 Hz çerçeve hızı:**从 WavLM distill 得到的**, eğitim amacı ise WavLM'in ses içeriği özelliklerini tahmin etmek. Kod kitapları 1-7 akustik kalıntılardır.

### Çerçeve oranı dil oluşturma için çok önemlidir

Daha düşük çerçeve oranı = daha kısa dizi = daha hızlı LM。

| Codec | Frame rate | 1 s = N frames | 适合 |
|-------|-----------|----------------|---------|
| EnCodec-24k | 75 Hz | 75 | 音乐、通用音频 |
| DAC-44.1k | 86 Hz | 86 | 高保真音乐 |
| SNAC-24k (coarse) | ~12 Hz | 12 | AR-LM 高效生成 |
| Mimi | 12.5 Hz | 12.5 | 流式语音 |

12.5 Hz'de, aşağıda, 10 saniye içinde, sadece 125 kodek çerçevesinde, Transformer kolayca tahmin edilebilir.

### 语义 Token vs 声学 Token

```
frame_t → [semantic_token_t, acoustic_token_0_t, acoustic_token_1_t, ..., acoustic_token_6_t]
```

- **Semantic token（Mimi 中的 codebook 0）。**编码说了什么,即音素、词、内容──通过辅助预测 Loss 从 WavLM destill 得到──
- **Acoustic tokens（codebooks 1-7）。**编码音色、说话人身份、律、背景噪音、精细细节──

AR LM 先预测 semantik token(以文本为条件),再预测 akustik token(以 semantik + hoparlör referansı 为条件) ・・・ Bu faktörleşme 现代 TTS 能够零射 克隆声音的原因:semantic model 处理内容;acoustic model 处理音色。

### 2026 yeniden inşaat kalitesi(sekonda bitler,bitrate 越低越好)

| Codec | Bitrate | PESQ | ViSQOL |
|-------|---------|------|--------|
| Opus-20kbps | 20 kbps | 4.0 | 4.3 |
| EnCodec-6kbps | 6 kbps | 3.2 | 3.8 |
| DAC-6kbps | 6 kbps | 3.5 | 4.0 |
| SNAC-3kbps | 3 kbps | 3.3 | 3.8 |
| Mimi-4.4kbps | 4.4 kbps | 3.1 | 3.7 |

Ōpus gibi geleneksel kodekler her bitin algılama kalitesi üzerinde hâlâ üstünlük kazanıyor.**离散 Token**(Opus 不产生这种 Token)**generative-model quality**(LM 能如何使用这些代币)


```figure
rvq-codec-cascade
```

## Yapın onu.

### 步骤 1: EnCodec kodlaması ile

```python
from encodec import EncodecModel
import torch

model = EncodecModel.encodec_model_24khz()
model.set_target_bandwidth(6.0)  # kbps

wav = torch.randn(1, 1, 24000)
with torch.no_grad():
    encoded = model.encode(wav)
codes, scale = encoded[0]
# codes: (1, n_codebooks, n_frames), dtype=int64
```

6 kbps 时`n_codebooks=8`△ Her kod 0-1023 △10 bit.

### 步骤 2: dekode etmek ve yeniden ölçmek

```python
with torch.no_grad():
    wav_recon = model.decode([(codes, scale)])

from torchaudio.functional import compute_deltas
import torch.nn.functional as F

mse = F.mse_loss(wav_recon[:, :, :wav.shape[-1]], wav).item()
```

### 步骤 3: semantik-akustik bölünme

```python
from moshi.models import loaders
mimi = loaders.get_mimi()

with torch.no_grad():
    codes = mimi.encode(wav)  # shape (1, 8, frames@12.5Hz)

semantic = codes[:, 0]
acoustic = codes[:, 1:]
```

Semantik kod kitabı 0 ile WavLM 对齐. Sözcük-semantik Transformer,词表比直接到音频小得多. Sonra, bir tek özel akustik-to-wave form dekoder, 以扬声器参考 为条件.

### 步骤 4: neden kodek Token 上的 AR LM 可行

Mimi'nin 12.5 Hz × 8 kod defteri için, bir 10 saniyelik 语音片段:

```
N_tokens = 10 * 12.5 * 8 = 1000 tokens
```

1000 Token Transformer için çok küçük bir üst aşağı bölümdür. 256M  параметрli bir Transformer, modern GPU'da 10 saniyelik bir ses üretimi yapabilir.

## Kullan

问题 → kodek 映射:

| Task | Codec |
|------|-------|
| 通用音乐生成 | EnCodec-24k |
| 最高保真 reconstruction | DAC-44.1k |
| 覆盖语音的 AR LM (TTS) | SNAC or Mimi |
| 流式全双工语音 | Mimi (12.5 Hz) |
| 带文本的音效库 | EnCodec + T5 condition |
| 细粒度音频编辑 | DAC + inpainting |

经验法则:**如果你在构建 generative model，从 Mimi 或 SNAC 开始。如果你在构建压缩 pipeline，使用 Opus。**

## 常见坑

- **Codebook 太多。**添加代码簿 会线性提高忠诚性,但也会线性增加 LM 序列长度──停在8-12 个──
- **Frame-rate mismatch。**12.5 Hz Mimi'ye LM'yi eğit, sonra 50 Hz EnCodec'e ince ayar yap, başarısız olur.
- **假设所有 codebook 都等价。**Mimi'de, kod defteri 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
- **把 reconstruction quality 当作唯一指标。**Eğer semantik  yapı çok kötü ise, bir kodek hatta yeniden yapılandırma  çok iyi, LM tabanlı üretime de faydası olmayabilir.

## - Söyle.

保存为 `outputs/skill-codec-picker.md`❖ belirli bir üretim veya basınç görevi için bir kodek seçmek.

## 练习

1. **Easy。**运行  İşlem`code/main.py`◊ Bu bir oyuncak skalar + geri kalan kuantitör gerçekleştirdi, ◊ ölçüm kod defteri yeniden yapılandırma hatası ◊ nasıl değişir ◊
2. **Medium。**- Yapımcılık`encodec`, 1⁄4, 8⁄32 kod defteriyi oluşturmak için PESQ veya MSE vs bitrate çizimleri oluşturmak için
3. **Hard。**Üzerine bir kod kitabı 0'u değiştirerek bir kod sayısını tamamlayın. Sonra da bir kod kitabı 7'i değiştirerek bir kod kitabı oluşturun.

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| RVQ | Residual quantization | 小 codebook 级联；每个 codebook 量化前一个 residual。 |
| Frame rate | Codec speed | 每秒有多少个 Token-frame。更低 = 更快的 LM。 |
| Semantic codebook | Codebook 0 (Mimi) | 从 SSL 特征 distill 得到的 codebook；编码内容。 |
| Acoustic codebooks | 其他所有 codebook | 音色、韵律、噪声、精细细节。 |
| PESQ / ViSQOL | Perceptual quality | 与 MOS 相关的客观指标。 |
| EnCodec | Meta codec | RVQ 基线；MusicGen 使用它。 |
| Mimi | Kyutai codec | 12.5 Hz frame rate；semantic-acoustic split；支撑 Moshi。 |

## 延伸阅读

- [Défossez et al. (2023). EnCodec](https://arxiv.org/abs/2210.13438) RVQ 基线。
- [Kumar et al. (2023). Descript Audio Codec (DAC)](https://arxiv.org/abs/2306.06546)En iyi açık kodek.
- [Siuzdak (2024). SNAC](https://arxiv.org/abs/2410.14411) Çok ölçekli RVQ。
- [Kyutai (2024). Mimi codec](https://kyutai.org/codec-explainer) semantik-akustik bölünme,WavLM destillasyonı。
- [Borsos et al. (2023). AudioLM](https://arxiv.org/abs/2209.03143) 两阶段 semantik/akustik 范式。
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) En erken kullanılabilir RVQ kodekleri
