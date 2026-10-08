# Các bộ biến âm thanh  Thiết kế thì thầm

> Âm thanh là tần số 随着时间的变化形成图像── sussur 是一个吃 mel谱程并吐回文字的 ViT──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 08 (Encoder-Decoder), Phase 7 · 09 (ViT)
**Time:** ~45 分钟

## Vấn đề

Trong Whisper,Radford và đồng nghiệp 2022) trước đó, công nghệ tiên tiến của tự động nhận dạng giọng nói,ASR có nghĩa là wav2vec 2.0 và HuBERTcác bộ phận tự giám sát, cộng với đầu điều chỉnh tốt,质量高, nhưng đường ống dữ liệu 昂贵,而且对域 脆弱──多语言语音识别 需要按语言家族 使用不同模型──

Whisper đã làm ba điều:

1. **Train on everything。**Từ Internet thu thập được 680,000 tiếng tiếng nói có nhãn yếu, bao gồm 97 ngôn ngữ. Không có hệ thống học thuật sạch. Không có nhãn âm thanh.
2. **Multi-task single model。**Một decoder thông qua các mã công việc 联合训练 transcription、translation、soạn hoạt động phát hiện、language ID 和 timestamping。
3. **标准 encoder-decoder transformer。**Mã hóa 消耗 log-mail spectrograms──Decoder 以 autoregressive 方式生成文字代码──没有 vocoder,没有 CTC,没有HMM──

Kết quả:Whisper large-v3 đối với giọng nói, tiếng ồn, cũng như không có thông tin có nhãn hiệu sạch 语言都很稳健── đến năm 2026, nó đã là đầu tiên của mỗi trợ lý giọng nói nguồn mở và hầu hết các trợ lý giọng nói thương mại.

## Khái niệm

![Whisper pipeline: audio → mel → encoder → decoder → text](../assets/whisper.svg)

### Bước 1  mẫu lại + cửa sổ

Audio 为 16 kHz──clip/pad 到 30 秒──计算 log-mail spectrogram:80 个 mel bins,10 ms bước → 约 3,000 khung hình × 80 tính năng──这就是 Whisper 看到的输入图片──

### Bước 2  thân lưng

Hai lớp Conv1D, lõi 3 ∞ bước 2, sẽ giảm 3.000 khung xuống 1.500 ∞ trong trường hợp không tăng số lượng lớn các tham số sẽ giảm chiều dài chuỗi một nửa ∞

### Bước 3  mã hóa

Một phiên bản lớn (một phiên bản lớn) biến thể mã hóa, xử lý 1.500 bước thời gian.

### Bước 4  decoder

Một decoder biến thể 24 tầng. Nó được tạo ra tự động từ từ vựng BPE; từ vựng này là một tập hợp siêu của vựng GPT-2,并额外包含少量音频 cụ thể đặc biệt các token.

### Bước 5  mã công việc

Đơn giản là khi kiểm soát mã thông báo, hãy cho mô hình biết phải làm gì.

```
<|startoftranscript|>  <|en|>  <|transcribe|>  <|0.00|>
```

Hoặc

```
<|startoftranscript|>  <|fr|>  <|translate|>   <|0.00|>
```

模型就是按这种约定训练的──你通过前 控制任务──这相当于2026年的指示调整,只是应用在语音上──

### Bước 6  đầu ra

Tìm kiếm chùm chùm ((vành 5)配合 log-prob ngưỡng。当 `<|notimestamps|>`token không tồn tại, dấu thời gian sẽ theo âm thanh của mỗi 0.02 giây dự đoán một lần.

### Kích thước thì thầm

| Model | Params | Layers | d_model | Heads | VRAM (fp16) |
|-------|--------|--------|---------|-------|-------------|
| Tiny | 39M | 4 | 384 | 6 | ~1 GB |
| Base | 74M | 6 | 512 | 8 | ~1 GB |
| Small | 244M | 12 | 768 | 12 | ~2 GB |
| Medium | 769M | 24 | 1024 | 16 | ~5 GB |
| Large | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3 | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3-turbo | 809M | 32 | 1280 | 20 | ~6 GB（4-layer decoder） |

Large-v3-turbo(2024) sẽ decoder từ 32 lớp  cắt giảm đến 4。 giải mã tốc độ nhanh 8×,WER quay trở lại nhỏ hơn 1 个点。

### Nhầm thì thầm

- Không làm nhật ký hóa (?? 谁在说话) 
- 原生不做实时流30秒窗口是固定的──现代 wrappers(`faster-whisper``WhisperX`) Thông qua VAD + chồng chéo 补上流量──
- Không có sự chia cắt bên ngoài, không hỗ trợ hơn 30 s của ngữ cảnh hình dạng dài. Thực tế hiệu quả rất tốt, vì ngôn ngữ của con người trong bản dịch rất ít cần ngữ cảnh dài hạn.

### 2026 phong cảnh

| Task | Model | Notes |
|------|-------|-------|
| English ASR | Whisper-turbo, Moonshine | Moonshine 在 edge 上快 4× |
| Multilingual ASR | Whisper-large-v3 | 97 种语言 |
| Streaming ASR | faster-whisper + VAD | 可达到 150 ms latency targets |
| TTS | Piper, XTTS-v2, Kokoro | Encoder-decoder pattern，但形状类似 Whisper |
| Audio + language | AudioLM, SeamlessM4T | Text tokens + audio tokens 在一个 transformer 中 |


```figure
n5-mel-decode
```

## Hãy xây dựng nó

见 `code/main.py`Chúng tôi không tập Whisper Chúng tôi xây dựng đường ống quang phổ log-mail + định dạng nhanh chóng mã chỉ mục nhiệm vụ.

### Bước 1: tổng hợp âm thanh

生成一个采样率为16 kHz,频率为440 Hz,时长1秒的弦波,16000样本.

### Bước 2: Log-mail spectrogram

完整 mel spectrogram 需要 FFT──我们做一个简化框架+ per frame energy 版本,用来展示管道,而不需要`librosa`- Có thể là:

```python
def frame_signal(x, frame_size=400, hop=160):
    frames = []
    for start in range(0, len(x) - frame_size + 1, hop):
        frames.append(x[start:start + frame_size])
    return frames
```

Frame = 25 ms,hop = 10 ms──与 Whisper的窗口匹配──Per-frame energy 在教学上替代 mel bins──

### Bước 3: Pad đến 30 s

Whisper 始终处理 30 秒块──将谱谱pad (hoặc clip) đến 3.000 khung hình──

### Bước 4:  cấu trúc các token nhanh

```python
def whisper_prompt(lang="en", task="transcribe", timestamps=True):
    tokens = ["<|startoftranscript|>", f"<|{lang}|>", f"<|{task}|>"]
    if not timestamps:
        tokens.append("<|notimestamps|>")
    return tokens
```

Đây là bề mặt kiểm soát nhiệm vụ hoàn chỉnh.

## Sử dụng nó

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("meeting.wav", language="en", task="transcribe")
print(result["text"])
print(result["segments"][0]["start"], result["segments"][0]["end"])
```

Hơn nữa,兼容 OpenAI:

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3-turbo", compute_type="int8_float16")
segments, info = model.transcribe("meeting.wav", vad_filter=True)
for s in segments:
    print(f"{s.start:.2f} - {s.end:.2f}: {s.text}")
```

**2026 年何时选择 Whisper：**

- Sử dụng một mô hình làm ASR đa ngôn ngữ.
- Đối với 杂、多样音频的稳健转录──
- Nghiên cứu / nguyên mẫu ASR最快起点──

**何时选择别的方案：**

- Edge trên của siêu thấp trễ phát sóng  Moonshine trong chất lượng tương tự dưới tốt hơn thì thầm 
- 需要 <200 ms 的实时对话 AI使用专用流媒体 ASR──
- Đăng ký diễn giảWhisper 不做这个;接上 pyannote。

## Chuyển nó

见 `outputs/skill-asr-configurator.md`◊该技能 会为新语音应用 选择ASR model、解码参数 和预处理管道──

## Các bài tập

1. **Easy。**运行 `code/main.py`❖ xác nhận 16 kHz、10 ms hop của 1 giây khung tín hiệu  khoảng 100 khung hình──30 giây则 khoảng 3.000 khung hình──
2. **Medium。**Sử dụng `numpy.fft`构建完整 log-mail spectrogram──验证 80 个melbins 与 `librosa.feature.melspectrogram(n_mels=80)`Trong số giá trị sai lầm trong phù hợp.
3. **Hard。**实现 streaming inference:将 audio 切成 10 s windows,2 s chồng chéo, đối với mỗi phần 运行  sussper,再合并 transcripts──测量与 5 分钟播客样本 单次处理相比的字错率──

## Các điều khoản chính

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Mel spectrogram | “Audio image” | 2D representation：一个轴是 frequency bins，另一个轴是 time frames；每个 cell 是 log-scaled energy。 |
| Log-mel | “Whisper 看到的东西” | 经过 log 的 Mel spectrogram；近似人类对 loudness 的感知。 |
| Frame | “一个 time slice” | 25 ms 的 samples window；以 10 ms stride overlap。 |
| Task token | “speech 的 prompt prefix” | decoder prompt 中类似 `<\|transcribe\|>` / `<\|translate\|>` 的 special tokens。 |
| Voice activity detection (VAD) | “找到 speech” | 在 ASR 前移除 silence 的 gate；大幅降低 cost。 |
| CTC | “Connectionist Temporal Classification” | 用于 alignment-free training 的经典 ASR loss；Whisper 不使用它。 |
| Whisper-turbo | “小 decoder，完整 encoder” | large-v3 encoder + 4-layer decoder；解码快 8×。 |
| Faster-whisper | “生产 wrapper” | CTranslate2 reimplementation；int8 quantization；比 OpenAI reference 快 4×。 |

## Đọc thêm

- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) Bức giấy thì thầm
- [OpenAI Whisper repo](https://github.com/openai/whisper) mã tham chiếu + trọng lượng mô hình。阅读 `whisper/model.py`, có thể nhìn thấy conv1D gốc + mã hóa + mã hóa trên 400 行内向下.
- [OpenAI Whisper — `whisper/decoding.py`](https://github.com/openai/whisper/blob/main/whisper/decoding.py) Bước 56 中描述的光束搜索 + nhiệm vụ mã thông minh logic 在这里;500 行,完全可读。
- [Baevski et al. (2020). wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477) 前身; trong một số trường hợp vẫn còn các tính năng SOTA.
- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) bọc sản xuất,比 tham chiếu 快 4×。
- [Jia et al. (2024). Moonshine: Speech Recognition for Live Transcription and Voice Commands](https://arxiv.org/abs/2410.15608) 2024 năm cạnh thân thiện ASR, hình dạng giống như thì thầm nhưng hơn nhỏ.
- [HuggingFace blog — "Fine-Tune Whisper For Multilingual ASR with 🤗 Transformers"](https://huggingface.co/blog/fine-tune-whisper) công thức điều chỉnh tinh tế của Canon, bao gồm bộ xử lý trước của quang phổ và xử lý dấu thời gian token
- [HuggingFace `modeling_whisper.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/whisper/modeling_whisper.py) 完整实现(encoder、decoder、cross-attention、generation), với biểu đồ kiến trúc của bài học này đối ứng¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
