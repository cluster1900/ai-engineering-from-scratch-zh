# Text-to-Speech (TTS)  Từ Tacotron đến F5 và Kokoro

> ASR sẽ chuyển ngữ âm ngược sang văn bản; TTS sẽ chuyển văn bản ngược sang văn bản.

**Type:** Build
**Languages:** Python
**先修要求:**Giai đoạn 6 · 02 (Spectogram & Mel), Giai đoạn 5 · 09 (Seq2Seq), Giai đoạn 7 · 05 (Tổng biến thể)
**Time:** ~75 minutes

## 问题

Bạn có một字符串:"Vui lòng nhắc tôi để tưới cây vào lúc 6 giờ chiều". Bạn cần một đoạn âm thanh 3 giây, nghe lên tự nhiên, có đúng prosody( dừng lại、重音), sử dụng đúng âm để phát ra "cây", và có thể ở trên CPU trên 300 ms 内运行, để hỗ trợ trợ thực时语音助手── bạn cũng cần chuyển đổi âm thanh、 xử lý mã chuyển đổi đầu vào (("Hãy nhớ tôi vào lúc 6 giờ chiều, daijoubu?"), và trong tên phát âm lên không xuất hiện xấu──

Đường ống TTS现代 trông như thế này:

1. **Text frontend。**规范化文本(日期、数字、电子邮件),转换为 Phoneme 或子词 代号,预测 prosody 特征──
2. **声学模型。**Text → mel spectrogram。Tacotron 2 (2017), FastSpeech 2 (2020), VITS (2021), F5-TTS (2024), Kokoro (2024)。
3. **Vocoder。**Mel → dạng sóng──WaveNet (2016), WaveRNN, HiFi-GAN (2020), BigVGAN (2022), và các bộ phận codec thần kinh của 2024+.

Đến năm 2026, với sự xuất hiện của các mô hình phân phối và phù hợp dòng chảy, phân chia âm thanh + vocoder trở nên mơ hồ.

## 概念

![Tacotron, FastSpeech, VITS, F5/Kokoro side-by-side](../assets/tts.svg)

**Tacotron 2 (2017)。**Seq2seq:char-embedding → BiLSTM encoder → vị trí nhạy cảm chú ý → autoregressive LSTM decoder 输出 mel frames──慢(AR),长文本上不稳定──仍被作为基线引用──

**FastSpeech 2 (2020)。**Không tự rút lại──Tầm dự đoán thời gian 输出每个 Phoneme 获得多少 mel frame──1-pass,比 Tacotron 快 10×──损失一些自然度(monotonic alignment), nhưng到处都在用──

**VITS (2021)。**Thông qua suy luận biến thể sẽ mã hóa + thời gian dựa trên dòng chảy + vocoder HiFi-GAN 端到端联合训练。质量高,单模型。20222024年主导开源 TTS。变体:YourTTS(multi-speaker zero-shot)、XTTS v2(2024,Coqui)。

**F5-TTS (2024)。**基于流相匹配的 Diffusion Transformer──自然 prosody, sử dụng 5 秒参考音频 tiến hành sao chép âm thanh bằng cú đánh không──2026 年开源 TTS 排行榜顶尖──335M params──

**Kokoro (2024)。**小型(82M)、可在 CPU 上运行、实时使用场景下一流的英文 TTS──封闭词表、仅英文、apache-2.0──

**OpenAI TTS-1-HD, ElevenLabs v2.5, Google Chirp-3。**商业状态艺术──ElevenLabs v2.5 的情感标签("[phầm lặng]", "[cười]")和角色声音 在 2026 年 主导音频书制作──

### Vocoder 演进

| Era | Vocoder | Latency | Quality |
|-----|---------|---------|---------|
| 2016 | WaveNet | 仅 offline | 发布时的 SOTA |
| 2018 | WaveRNN | ~realtime | good |
| 2020 | HiFi-GAN | 100× realtime | 接近人类 |
| 2022 | BigVGAN | 50× realtime | 可泛化到不同 speakers/langs |
| 2024 | SNAC, DAC (neural codecs) | 与 AR models 集成 | 离散 Token，比特效率高 |

Đến năm 2026, hầu hết các mô hình "TTS" đều là mô hình từ văn bản đến hình dạng sóng; quang phổ email là một biểu hiện bên trong.

### 评估

- **MOS (Mean Opinion Score)。**15 分制, nguồn gốc đám đông.
- **CMOS (Comparative MOS)。**A-vs-B 偏好── từng dòng ghi chú.
- **UTMOS, DNSMOS。**Không có liên quan đến các dự báo MOS thần kinh.
- **CER (Character Error Rate) via ASR。**Để TTS xuất  thông qua Phầmầm, tính toán và nhập văn bản của CER.
- **SECS (Speaker Embedding Cosine Similarity)。**Phân tạo giọng nói 质量。

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

##  xây dựng nó

### 步骤 1: Phóng âm đầu vào

```python
from phonemizer import phonemize
ph = phonemize("Hello world", language="en-us", backend="espeak")
# 'həloʊ wɜːld'
```

Phoneme là một hệ thống thông dụng. Đừng đưa văn bản thô vào chất lượng cấp VITS.

### 步骤 2:运行 Kokoro(2026 CPU 默认)

```python
from kokoro import KPipeline
tts = KPipeline(lang_code="a")  # "a" = American English
audio, sr = tts("Please remind me to water the plants at 6 pm.", voice="af_bella")
# audio: float32 tensor, sr=24000
```

离线运行,单文件,82M params──

### 步骤 3: Sử dụng sao chép giọng nói 运行 F5-TTS

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="my_voice_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please remind me to water the plants.",
)
```

传入一个 5 秒参考片段及其转录;F5 会克隆 prosody 和 timbre。

### Bước 4: Từ zero thực hiện HiFi-GAN vocoder

太大, không thể đưa vào kịch bản hướng dẫn, nhưng hình dạng như sau:

```python
class HiFiGAN(nn.Module):
    def __init__(self, mel_channels=80, upsample_rates=[8, 8, 2, 2]):
        super().__init__()
        # 4 upsample blocks, total 256x to go from mel-rate to audio-rate
        ...
    def forward(self, mel):
        return self.blocks(mel)  # -> waveform
```

训练: đối thủ (các phân biệt đối xử trên cửa sổ ngắn) + tái tạo quang phổ mel Loss + tính năng phù hợp Loss。已商品化使用 `hifi-gan`repo hoặc các trạm kiểm soát được đào tạo trước của NVIDIA-NeMo.

### 步骤 5: toàn bộ đường ống (pseudocode)

```python
text = "Please remind me at 6 pm."
phones = phonemize(text)
mel = acoustic_model(phones, speaker=alice)      # [T, 80]
wav = vocoder(mel)                                # [T * 256]
soundfile.write("out.wav", wav, 24000)
```

## Sử dụng nó

2026 年技术:

| Situation | Pick |
|-----------|------|
| 实时 English voice assistant | Kokoro (CPU) 或 XTTS v2 (GPU) |
| 从 5 s reference 进行 voice cloning | F5-TTS |
| 商业 character voices | ElevenLabs v2.5 |
| Audiobook narration | ElevenLabs v2.5 或 XTTS v2 + fine-tune |
| Low-resource language | 在 5–20 h target-lang data 上训练 VITS |
| Expressive / emotion tags | ElevenLabs v2.5 或 StyleTTS 2 fine-tune |

截至 2026 年的开源领先者:**F5-TTS 代表质量，Kokoro 代表效率**Trừ khi bạn là nhà sử học, nếu không thì đừng chọn Tacotron.

## 陷

- **没有 text normalizer。**"Dr. Smith" 读作 "Doctor" 还是 "Drive"?"2026" 读作 "twenty twenty six" 还是 "two zero two six"?
- **OOV proper nouns。**"Ghumare" → "ghyu-mair"?
- **Clipping。**Nguồn phát ra của Vocoder  rất ít cắt, nhưng suy luận 时 mel quy mô không phù hợp có thể vượt quá ± 1.0──始终使用 `np.clip(wav, -1, 1)`
- **Sample-rate mismatch。**Kokoro 输出 24 kHz; ống dẫn dòng chảy của bạn 期望 16 kHz → lấy lại mẫu, nếu không sẽ xuất hiện aliasing。

## 交付 nó

保存为 `outputs/skill-tts-designer.md`◊ vì một giọng nói nhất định, độ trễ và ngôn ngữ mục tiêu  thiết kế một đường ống TTS ◊

## 练习

1. **Easy。**运行 `code/main.py`Từ từ ngữ đồ chơi 构建 Phoneme từ điển, ước tính thời gian của mỗi Phoneme,并打印一个假的"mel" lịch trình
2. **Medium。**安装 Kokoro,分別使用 giọng `af_bella`和 `am_adam`合成同一句话──比较音频持续和主观质量──
3. **Hard。**录制一段你自己的5秒参考片段――使用F5-TTS clone 它──报告参考和克隆输出 之间SECS──

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

- [Shen et al. (2017). Tacotron 2](https://arxiv.org/abs/1712.05884) đường cơ sở tiếp theo
- [Kim, Kong, Son (2021). VITS](https://arxiv.org/abs/2106.06103) 端到端 dựa trên dòng chảy
- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) 当前开源 SOTA。
- [Kong, Kim, Bae (2020). HiFi-GAN](https://arxiv.org/abs/2010.05646) 2026 năm vẫn đang phát hành vocoder sử dụng
- [Kokoro-82M on HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M) 2024 CPU thân thiện tiếng Anh TTS。
