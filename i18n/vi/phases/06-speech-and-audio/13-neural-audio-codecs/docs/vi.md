# Codec âm thanh thần kinh  EnCodec, SNAC, Mimi, DAC 和 Semantic-Acoustic Split

> 2026 năm của âm thanh sản xuất gần như toàn bộ là Token. EnCodec, SNAC, Mimi và DAC sẽ chuyển đổi hình dạng liên tục thành Transformer có thể dự đoán các chuỗi phân tán.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 10 · 11 (Quantization), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 问题

语言模型处理离散 Token──音频是连续的── Nếu bạn muốn xây dựng mô hình LLM 风格, ví dụ như MusicGen、Moshi、Sesame CSM、VibeVoice、Orpheus, bạn cần một thứ đầu tiên**neural audio codec**Một bộ mã hóa học tập, biến âm thanh thành biểu tượng nhỏ,并配套 một bộ mã hóa để xây dựng lại hình dạng.

Đã có hai gia đình:

1. **Reconstruction-first codecs** EnCodec、DAC──优化感知音频质量──Token là acoustic 的, chúng bắt giữ bao gồm cả nói thoại người身份、音色、背景噪音在内的一切──
2. **Semantic-first codecs** Mimi (Kyutai)、SpeechTokenizer。强制第一代码簿 编码语言 / 音素内容, thường thông qua từ WavLM chưng cất 得到──后续代码簿 是声学 细节──

Những quan điểm trong năm 2024-2026 là:**当你尝试从文本生成时，纯 reconstruction codec 会给你模糊的语音。**覆盖 Codec Token của LLM 必须在同一个代码书中同时学习语言结构和声学结构,这无法良好扩展――把它们分离出来,即语义代码书 0、声学代码书 1-N,正是Moshi 和芝麻CSM 能工作的原因――

## 概念

![Four codec landscape: EnCodec, DAC, SNAC (multi-scale), Mimi (semantic+acoustic)](../assets/codec-comparison.svg)

### 核心技巧:Quantization Vektor dư thừa (RVQ)

Thay vì sử dụng một cuốn sách mã khổng lồ (để có được chất lượng tốt có thể cần hàng triệu mã), Moderne Audio Codec đều sử dụng.**RVQ**Một chuỗi nhỏ codebook 级联── thứ nhất codebook 量化编码器 输出; thứ hai量化残余;依此类推── mỗi codebook có 1024 个 code¬8 个 codebook = 1024^8 = 10^24 的有效词表──

Trong suy luận, decoder sẽ tìm kiếm và xây dựng lại mã trong mỗi  trong tất cả các code được chọn.

### 4 codec quan trọng nhất năm 2026

**EnCodec (Meta, 2022)。**基线──基于波形的编码解码器,RVQ瓶──24 kHz,最多可用32 代码簿,默认4 代码簿 @ 1.5 kbps──使用 `1D conv + transformer + 1D conv`架构──MusicGen Sử dụng nó──

**DAC (Descript, 2023)。**Sử dụng L2 chuẩn hóa sổ mã ∆y periodic activation function và cải tiến Loss của RVQ¬ trong tất cả các codec mở trung thành tái tạo cao nhất, đôi khi sử dụng 12 sổ mã  khi với tiếng gốc gần như không thể phân biệt.

**SNAC (Hubert Siuzdak, 2024)。**RVQ đa quy mô, tỷ lệ khung của cuốn sách mã khối lượng thô thấp hơn cuốn sách mã khối lượng thô nhỏ. Thực tế, nó được xây dựng theo cách cấp độ.

**Mimi (Kyutai, 2024)。**2026 年的关键突破──12.5 Hz frame rate(极低),8 个代码簿 @ 4.4 kbps──Codebook 0 是 **从 WavLM distill 得到的**, tập luyện mục tiêu là dự đoán các đặc điểm nội dung tiếng của WavLM.

### Tỷ lệ khung hình rất quan trọng đối với ngôn ngữ xây dựng

Tốc độ khung hình thấp hơn = chuỗi ngắn hơn = LM nhanh hơn.

| Codec | Frame rate | 1 s = N frames | 适合 |
|-------|-----------|----------------|---------|
| EnCodec-24k | 75 Hz | 75 | 音乐、通用音频 |
| DAC-44.1k | 86 Hz | 86 | 高保真音乐 |
| SNAC-24k (coarse) | ~12 Hz | 12 | AR-LM 高效生成 |
| Mimi | 12.5 Hz | 12.5 | 流式语音 |

Trong 12,5 Hz 下,10 秒话语 chỉ có 125 khung codec, Transformer có thể dễ dàng dự đoán chúng.

### 语义 Token vs 声学 Token

```
frame_t → [semantic_token_t, acoustic_token_0_t, acoustic_token_1_t, ..., acoustic_token_6_t]
```

- **Semantic token（Mimi 中的 codebook 0）。**编码说了什么,即音素、词、内容──通过辅助预测 Loss từ WavLM 蒸得到──
- **Acoustic tokens（codebooks 1-7）。**编码音色、说话人身份、律、背景噪音、精细细节──

AR LM 先预测 ngữ nghĩa token(以文本为条件),再预测 âm thanh token(以 ngữ nghĩa + loa tham chiếu 为条件) ・・・ loại phân tích này là现代 TTS 能够零射 克隆声音的原因:semantic model 处理内容;acoustic model 处理音色。

### 2026 chất lượng tái tạo ((bit/s, bitrate 越低越好)

| Codec | Bitrate | PESQ | ViSQOL |
|-------|---------|------|--------|
| Opus-20kbps | 20 kbps | 4.0 | 4.3 |
| EnCodec-6kbps | 6 kbps | 3.2 | 3.8 |
| DAC-6kbps | 6 kbps | 3.5 | 4.0 |
| SNAC-3kbps | 3 kbps | 3.3 | 3.8 |
| Mimi-4.4kbps | 4.4 kbps | 3.1 | 3.7 |

像Opus như codec truyền thống trong mỗi bit của cảm nhận chất lượng vẫn thắng đi.**离散 Token**(Opus 不产生这种 Token) và **generative-model quality**(LM 能如何使用这些代币)


```figure
rvq-codec-cascade
```

##  xây dựng nó

### 步骤 1: sử dụng EnCodec mã hóa

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

6 kbps 时`n_codebooks=8`△ Mỗi mã là 0-1023(10 bit) ⋅

### 步骤 2: decode và đo tái tạo

```python
with torch.no_grad():
    wav_recon = model.decode([(codes, scale)])

from torchaudio.functional import compute_deltas
import torch.nn.functional as F

mse = F.mse_loss(wav_recon[:, :, :wav.shape[-1]], wav).item()
```

### 步骤 3: phân chia âm nghĩa-tâm âm

```python
from moshi.models import loaders
mimi = loaders.get_mimi()

with torch.no_grad():
    codes = mimi.encode(wav)  # shape (1, 8, frames@12.5Hz)

semantic = codes[:, 0]
acoustic = codes[:, 1:]
```

Bộ mã ngữ nghĩa 0 với WavLM đối齐. Bạn có thể đào tạo một Transformer văn bản-từ ngữ nghĩa, từ表比直接到音频小得多.

### 步骤 4: Tại sao codec token trên AR LM có thể đi

Đối với Mimi của 12,5 Hz × 8 个 codebook, một 10 s 语音片段:

```
N_tokens = 10 * 12.5 * 8 = 1000 tokens
```

1000 token đối với Transformer là rất nhỏ trên dưới đây. Một Transformer 256M có số lượng có thể tạo ra 10 giây trong GPU hiện đại.

## Sử dụng nó

问题 → codec 映射:

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

- **Codebook 太多。**Thêm sách mã 会线性 nâng cao độ trung thành, nhưng cũng sẽ tăng LM 序列长度―― dừng ở 8-12 个――
- **Frame-rate mismatch。**Trong 12.5 Hz Mimi lên tập LM, rồi trong 50 Hz EnCodec lên tinh chỉnh, sẽ thất bại.
- **假设所有 codebook 都等价。**Trong Mimi, cuốn sách mã 0  tải nội dung; mất nó sẽ phá hủy có thể hiểu được.
- **把 reconstruction quality 当作唯一指标。**Nếu cấu trúc ngữ nghĩa rất kém, một codec ngay cả khi tái tạo  rất tốt, cũng có thể không có ích cho việc tạo dựa trên LM.

## 交付 nó

保存为 `outputs/skill-codec-picker.md`❖ Cho một nhiệm vụ tạo hoặc nén cho một codec.

## 练习

1. **Easy。**运行 `code/main.py`Nó thực hiện một máy tính định lượng đồ chơi scalar + residual,并测量 với thêm lỗi tái tạo sổ cái mã 如何变化──
2. **Medium。**                                          `encodec`, trong các đoạn văn trong dự trữ so sánh 1、4、8、32 冊 mã sách── vẽ PESQ hoặc MSE vs bitrate──
3. **Hard。**加载 Mimi──Encode 一片段──把代码簿 0 替换为随机整数;decode──然后以类似的方式替换代代代码簿 7──比较这两种破坏,代码簿 0 腐败 应该摧毁可理解度;代码簿 7 腐败 应该几乎不改变任何东西──

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
- [Kumar et al. (2023). Descript Audio Codec (DAC)](https://arxiv.org/abs/2306.06546)                                                                                                                                                                                                                                                              
- [Siuzdak (2024). SNAC](https://arxiv.org/abs/2410.14411) RVQ đa quy mô
- [Kyutai (2024). Mimi codec](https://kyutai.org/codec-explainer) phân chia ngữ nghĩa-những âm thanh,WavLM chưng cất
- [Borsos et al. (2023). AudioLM](https://arxiv.org/abs/2209.03143) 两阶段 ngữ nghĩa/ âm thanh 范式。
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312)                                                                                                                                                                                                                                                              
