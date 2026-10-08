# 音频生成

> 音频是16-48 kHz của 1D tín hiệu. Một đoạn 5 giây có 80-240k 个样本. Không có bất kỳ Transformer nào sẽ trực tiếp tham dự chuỗi này.

**类型：**构建
**语言：**Python
**先修要求：**Giai đoạn 6 · 02(Tác phẩm âm thanh) Giai đoạn 6 · 04(ASR) Giai đoạn 8 · 06(DDPM)
**时间：**45 phút

## 问题

三类音频生成任务:

1. **Text-to-speech。**给定文本,生成语音──干净语音是窄带的,并且有很强的音响结构,已经可以通过变压器-over-tokens 很好地解决──VALL-E(Microsoft)、NaturalSpeech 3、ElevenLabs、OpenAI TTS──
2. **音乐生成。**给定一个快速(文本、旋律、chord progression、genre),生成音乐──分布宽得多──MusicGen(Meta)、Stable Audio 2.5、Suno v4、Udio、Riffusion──
3. **音频效果 / sound design。**给定一个提示,生成环境声或 Foley──AudioGen、AudioLDM 2、Stable Audio Open──

Tất cả đều hoạt động trên cùng một cơ sở: codec âm thanh thần kinh + token-AR hoặc máy phát sóng.

## 概念

![Audio generation: codec tokens + transformer or diffusion](../assets/audio-generation.svg)

### Các codec âm thanh thần kinh

Encodec(Meta,2022)、SoundStream(Google,2021)、Descript Audio Codec(DAC,2023)。 Một mã hóa convolutional sẽ nén dạng sóng ưng cục thành từng bước thời gian một vector; lượng hóa vector dư thừa(RVQ) đưa mỗi vector  chuyển thành K 个 codebook index 的级联──Decoder 将其还原── sử dụng 8 RVQ codebook、75 Hz, có thể nén 24 kHz 音频 thành 2 kbps = 600 token/sec──

```
waveform (16000 samples/sec)
    └─ encoder conv ─┐
                     ├─ RVQ layer 1 → indices at 75 Hz
                     ├─ RVQ layer 2 → indices at 75 Hz
                     ├─ ...
                     └─ RVQ layer 8
```

### Hai kiểu tạo ra trên

**Token-autoregressive。**将 RVQ Token 展平成一个序列,运行单独解码器 Transformer。MusicGen 使用"延迟平行" 以并行方式发发出 K 个代码书流,并为每个流 设置 offset。VALL-E 根据文本提示 + 3 秒语音样本 生成语音 Token。

**Latent diffusion。**将 codec Token 打包为连续潜伏,或用分类传播对其建模──Stable Audio 2.5 在连续音频潜伏 上使用流匹配──AudioLDM 2 使用文字-to-mail-to-audio diffusion──

2024-2026 Trend:flow matching 正在音乐领域胜出(推理更快、样本 更干净), trong khi token-AR 仍然主导语音, vì nó là nguyên nhân tự nhiên, và rất phù hợp với streaming。

## Tâm lý sản xuất

| System | Task | Backbone | Latency |
|--------|------|----------|---------|
| ElevenLabs V3 | TTS | Token-AR + neural vocoder | ~300ms first token |
| OpenAI GPT-4o audio | Full-duplex speech | End-to-end Multimodal AR | ~200ms |
| NaturalSpeech 3 | TTS | Latent flow matching | Non-streaming |
| Stable Audio 2.5 | Music / SFX | DiT + flow matching on audio latents | ~10s for 1-minute clip |
| Suno v4 | Full songs | Undisclosed; token-AR suspected | ~30s per song |
| Udio v1.5 | Full songs | Undisclosed | ~30s per song |
| MusicGen 3.3B | Music | Token-AR on Encodec 32kHz | Real-time |
| AudioCraft 2 | Music + SFX | Flow matching | ~5s for 5s clip |
| Riffusion v2 | Music | Spectrogram diffusion | ~10s |


```figure
score-matching
```

##  xây dựng nó

`code/main.py`模拟核心思想: 在合成的"audio token"序列上训练一个微小的下一个代码变压器,这些序列来自两种不同的"风格"(风格 A 为低代码和高代码交换,风格 B 为单调调) ⋅基于风格 进行条件并样子──

### 步骤 1: tạo các mã thông báo âm thanh

```python
def make_tokens(style, length, vocab_size, rng):
    if style == 0:  # "speech-like": alternating
        return [i % vocab_size for i in range(length)]
    # "music-like": ramp
    return [(i * 3) % vocab_size for i in range(length)]
```

### 步骤 2: đào tạo một dự đoán token nhỏ

Một predictor kiểu bigram dựa trên phong cách  điều kiện hóa.

### 步骤 3: mẫu điều kiện

给定 style Token 和 start token, từ dự đoán phân bố trong mẫu 下一个 Token──持续生成 20-40 个 Token──

## 陷

- **Codec quality caps output quality。**Nếu codec không thể trung thành cho một số âm thanh, một máy phát điện chất lượng cao cũng sẽ không bận rộn.
- **RVQ error accumulation。**Mỗi lớp RVQ đều có phần còn lại của tầng trước xây dựng.
- **Musical structure。**75 Hz 下 30 秒 Đèn hiệu 超过 20k 个──对变压器 很难──MusicGen 使用滑窗+快速延续;Stable Audio 使用较短剪辑+交叉──
- **Artifacts at boundaries。**生成 clip   giữa các giao diện  cần phải thận trọng để gia tăng sự chồng chéo.
- **Clean-data appetite。**音乐 generator 需要数万小时授权音乐──Suno / Udio RIAA kiện(2024) Hãy để vấn đề này xuất hiện trên mặt nước──
- **Voice cloning ethics。**Một mẫu 3 giây thêm một lời nhắc văn bản 就足以让 VALL-E / XTTS / ElevenLabs 克隆声音── mỗi mô hình sản xuất đều cần phát hiện lạm dụng + danh sách bỏ phiếu──

## Sử dụng nó

| Task | 2026 stack |
|------|------------|
| Commercial TTS | ElevenLabs, OpenAI TTS, or Azure Neural |
| Voice cloning (consent-verified) | XTTS v2 (open) or ElevenLabs Pro |
| Background music, fast | Stable Audio 2.5 API, Suno, or Udio |
| Music with lyrics | Suno v4 or Udio v1.5 |
| Sound effects / Foley | AudioCraft 2, ElevenLabs SFX, or Stable Audio Open |
| Real-time voice agent | GPT-4o realtime or Gemini Live |
| Open-weights music research | MusicGen 3.3B, Stable Audio Open 1.0, AudioLDM 2 |
| Dubbing / translation | HeyGen, ElevenLabs Dubbing |

## 交付 nó

保存 `outputs/skill-audio-brief.md` Khả năng nhận một đoạn văn âm thanh ngắn gọn (task,duration,style,voice,license),并输出:model + hosting,prompt format,genre tags,style descriptors,structural markers,codec + generator + vocoder chain,seed protocol,以及 eval plan,MOS/CLAP score/CER for TTS/user A/B)

## 练习

1. **简单。**运行 `code/main.py`Và rõ ràng thiết lập phong cách.
2. **中等。**添加延迟并行解码:模拟 2 条 Điểm soạn dòng, chúng phải giữ 1 bước của sự bù đắp.
3. **困难。**Sử dụng HuggingFace biến đổi 在本地运行 MusicGen-small。用三个不同的提示 生成 10秒剪辑;对风格的依依做 A/B。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Codec | "Neural compression" | 用于音频的 Encoder / decoder；典型输出是 50-75 Hz Token。 |
| RVQ | "Residual VQ" | K 个 quantizer 的级联；每个都建模前一个的 residual。 |
| Token | "One codec symbol" | 指向 codebook 的离散 index；通常为 1024 或 2048。 |
| Delayed parallel | "Offset codebooks" | 以 staggered offset 发出 K 条 Token stream，从而减少 sequence length。 |
| Flow matching | "The 2024 win for audio" | diffusion 的 straighter-path 替代方案；sampling 更快。 |
| Voice prompt | "3-second sample" | 引导克隆声音的 speaker Embedding 或 Token prefix。 |
| Mel spectrogram | "The visual" | Log-magnitude perceptual spectrogram；许多 TTS system 会使用。 |
| Vocoder | "Mel to wave" | 将 mel spectrogram 转回音频的 neural component。 |

## Lưu ý sản xuất:音频是流媒体 vấn đề

音频 là một phương thức phát ra của người dùng *边生成边到达* , thay vì một lần hoàn toàn trả lại. Trong ngữ nghĩa sản xuất, điều này có nghĩa là TPOT  rất quan trọng (Time Per Output Token), vì tốc độ nghe của người dùng là tốc độ thông qua mục tiêu, thay vì tốc độ đọc. Đối với 音频 16kHz của Tokenize, máy chủ phải tạo ≥75 token/sec cho mỗi người dùng, để giữ cho phát lại hoạt động.

2 cấu trúc hậu quả:

- **Flow-matching audio models cannot stream trivially。**Stable Audio 2.5 và AudioCraft 2 会一次性 render 固定长度的 clip──若要流,需要对 clip 分块并重叠边界,可以理解为滑窗扩散;相比编码 AR模型, sẽ tăng 100-300ms 延迟 overhead──

Nếu sản phẩm là "live voice chat" hoặc "real-time music continuation", chọn codec AR path── nếu là "render a 30-second clip on submit",flow-matching 在质量和总延迟 上胜出──

## 延伸阅读
- [Défossez et al. (2022). Encodec: High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) codec 标准。
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) Đầu tiên được sử dụng rộng rãi codec âm thanh thần kinh
- [Kumar et al. (2023). High-Fidelity Audio Compression with Improved RVQGAN (DAC)](https://arxiv.org/abs/2306.06546) DAC。
- [Wang et al. (2023). Neural Codec Language Models are Zero-Shot Text to Speech Synthesizers (VALL-E)](https://arxiv.org/abs/2301.02111) VALL-E。
- [Copet et al. (2023). Simple and Controllable Music Generation (MusicGen)](https://arxiv.org/abs/2306.05284) MusicGen。
- [Liu et al. (2023). AudioLDM 2: Learning Holistic Audio Generation with Self-supervised Pretraining](https://arxiv.org/abs/2308.05734) AudioLDM 2。
- [Stability AI (2024). Stable Audio 2.5](https://stability.ai/news/introducing-stable-audio-2-5) Sử dụng dòng chảy phù hợp của 2025 văn bản-đối với âm nhạc。
