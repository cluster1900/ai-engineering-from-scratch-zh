# Nhầm  Kiến trúc & Định vị

> Whisper là một bộ mã hóa-chế vị biến đổi cửa sổ 30 giây, được đào tạo vào 680k 小时 của nhiều ngôn ngữ yếu giám sát âm thanh-đọc đôi. Một kiến trúc, nhiều loại nhiệm vụ,跨 99 种语言都 robust.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 5 · 10 (Attention), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## Vấn đề

Whisper được công bố bởi OpenAI vào tháng 9 năm 2022, là mô hình ASR đầu tiên giao dịch với hàng hóa: dán âm thanh, nhận văn bản, hỗ trợ 99 ngôn ngữ, chống nhiễu mạnh mẽ, có thể hoạt động trên máy tính xách tay. Đến năm 2024, OpenAI đã phát hành các biến thể Large-v3 và Turbo; đến năm 2026, Whisper là từ bản sao podcast đến trợ lý giọng nói và đến cơ sở mặc định của phụ đề YouTube.

Nhưng thì thầm không phải là một đường ống mà bạn có thể sử dụng mãi mãi trong hộp đen.

1. Nó là cái gì bên trong nó?
2. Làm sao để nó được phát trực tuyến hoặc âm thanh dài?
3. 什么时候细调,以及如何细调──

## Khái niệm

![Whisper encoder-decoder, tasks, chunked inference, fine-tune](../assets/whisper.svg)

**Architecture。**标准 biến đổi mã hóa-bản giải

- Nhập 30 giây log-mail spectrogram,80 mels,10 ms hop → 3000 khung hình.
- Mã hóa:conv-downsample (phases 2) + `N`Các khối biến thể... đối với các lớp lớn v3:32... 1280 chiều... 20 đầu...
- Decoder:带 nguyên nhân tự-attn + đối với đầu ra encoder làm cross-attn `N`khối biến đổi.
- Kết quả: bao gồm 51,865 token của các token BPE.

Large-v3 có param 1.55B──Turbo sử dụng 4 lớp decoder( từ 32 tầng giảm),以 <1% WER 损失换到 8× độ trễ 降低──

**Prompt format。**Whisper là một lệnh từ trình giải mã Trung ̓s đặc biệt mã thông báo 控制的多任务模型:

```text
<|startoftranscript|><|en|><|transcribe|><|notimestamps|> Hello world.<|endoftext|>
```

- `<|en|>` ngôn ngữ thẻ;强制 dịch-vs-transcription 行为。
- `<|transcribe|>`Hoặc`<|translate|>` Từ bất kỳ ngôn ngữ nhập 翻译为英语输出,或逐字转写。
- `<|notimestamps|>` 跳过 từ độ thời gian dấu 更快)

Hãy nhanh chóng để một mô hình có thể hoàn thành rất nhiều nhiệm vụ.`<|en|>`改成 `<|fr|>`Nó sẽ được viết bằng tiếng Pháp.

**30-second window。**Tất cả đều cố định trong 30 giây. Clip dài hơn cần phải chunking. Clip ngắn hơn sẽ được đệm. Windows không phải là dòng phát trực tuyến, đó là lý do tại sao có WhisperX, Whisper-Streaming và nhanh hơn.

**Log-mel normalization。** `(log_mel - mean) / std`, trong số đó số liệu từ Whisper  tập luyện của riêng mình.`whisper.audio.log_mel_spectrogram`), thay vì `librosa.feature.melspectrogram`

### Các biến thể vào năm 2026

| Variant | Params | Latency (A100) | WER (LibriSpeech-clean) |
|---------|--------|----------------|------------------------|
| Tiny | 39M | 1× realtime | 5.4% |
| Base | 74M | 1× | 4.1% |
| Small | 244M | 1× | 3.0% |
| Medium | 769M | 1× | 2.7% |
| Large-v3 | 1.55B | 2× | 1.8% |
| Large-v3-turbo | 809M | 8× | 1.58% |
| Whisper-Streaming (2024) | 1.55B | streaming | 2.0% |

### Định nghĩa tinh tế

Phương trình công việc theo quy định của năm 2026:

1. 收集 10100 小时目标领域音频,并配有配合的转录──
2. Sử dụng `transformers.Seq2SeqTrainer`,带 `generate_with_loss`gọi lại.
3. Parameter-efficient: trong các lớp chú ý của`q_proj``k_proj``v_proj`上使用LoRA,可将 GPU bộ nhớ 降低 4×,WER 代价 <0.3──
4. Nếu chỉ có 10 giờ, hãy đóng băng mã hóa.
5. Sử dụng Whisper  chính mình Tokenizer 和 định dạng nhanh chóng;绝不要替换tokenizer──

社区结果: trong 20 giờ chỉ thị y tế 上调 平均,将医疗词汇上调 WER từ 12% 降至 4.5% ⋅ trong 4 giờ Icelandic 上调 Turbo,将 WER từ 18% 降至 6% ⋅


```figure
sp-asr-attention
```

## Hãy xây dựng nó

### Bước 1: 直接运行 Nhầm

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe(
    "clip.wav",
    language="en",
    task="transcribe",
    temperature=0.0,
    condition_on_previous_text=False,  # prevents runaway repetition
)
print(result["text"])
for seg in result["segments"]:
    print(f"[{seg['start']:.2f}–{seg['end']:.2f}] {seg['text']}")
```

Bạn nên luôn bao gồm các mặc định chính:`temperature=0.0`(tạm dịch: 默认是 0.0 → 0.2 → 0.4 ... chuỗi quay trở lại)`condition_on_previous_text=False`(để ngăn ngừa vấn đề ảo giác ngập ngập), cũng như `no_speech_threshold=0.6`(khám phá âm thanh)

### Bước 2: hình dạng dài bị cắt

```python
# whisperx is the 2026 reference for long-form with word-level timestamps
import whisperx
model = whisperx.load_model("large-v3-turbo", device="cuda", compute_type="float16")
segments = model.transcribe("1hour.mp3", batch_size=16, chunk_size=30)
```

WhisperX 添加了 (1) Silero VAD gating,(2) 通过 wav2vec 2.0 làm việc liên kết bằng từ,(3) 通过 `pyannote.audio`Làm nhật ký hóa. Đó là con ngựa lao động sản xuất bản sao năm 2026

### Bước 3: Sử dụng LoRA fine-tune

```python
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from peft import LoraConfig, get_peft_model

model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-large-v3-turbo")
lora = LoraConfig(
    r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"],
    lora_dropout=0.1, bias="none", task_type="SEQ_2_SEQ_LM",
)
model = get_peft_model(model, lora)
# model.print_trainable_parameters()  -> ~3M trainable / 809M total
```

Sau đó sử dụng Standard Trainer loop.

### Bước 4: kiểm tra từng lớp học đã học được gì

```python
# Grab cross-attention weights during decode to see what the decoder attends to.
with torch.inference_mode():
    out = model.generate(
        input_features=features,
        return_dict_in_generate=True,
        output_attentions=True,
    )
# out.cross_attentions: layer × head × step × src_len
```

Sử dụng heatmap 可视化, bạn sẽ thấy các bước decoder 扫 qua khung encoder 时形成横向对齐──这条横向就是对词时刻的理解──

## Sử dụng nó

2026:

| Situation | Pick |
|-----------|------|
| 通用 English，offline | 通过 `whisperx` 使用 Large-v3-turbo |
| Mobile / edge | Whisper-Tiny quantized (int8) 或 Moonshine |
| Multilingual long-form | Large-v3 via `whisperx` + diarization |
| Low-resource language | 用 LoRA fine-tune Medium 或 Turbo |
| Streaming（2 s latency） | Whisper-Streaming 或 Parakeet-TDT |
| Word-level timestamps | WhisperX（通过 wav2vec 2.0 forced alignment） |

`faster-whisper`(CTranslate2 backend) là thời gian chạy CPU + GPU suy luận nhanh nhất năm 2026 , so với vanilla 快 4x,输出 tương tự.

## Những bẫy vẫn còn tồn tại vào năm 2026

- **Hallucinated text on silence。**Whisper 基于标题 训练,包含"Cảm ơn đã xem!"、"Đăng ký!"、歌词──调用前始终做 VAD-gate──
- **`condition_on_previous_text` cascade。**Một ảo giác sẽ làm bẩn cửa sổ sau đó trừ khi bạn cần sự thịnh vượng của các mảnh, nếu không thì đặt cho `False`
- **Short-clip padding。**Một clip 2 giây đệm đến 30 giây sau, có thể trong cuối bộ tĩnh音 mê mê.`pad=False`Hoặc VAD-gate.
- **Wrong mel stats。**Sử dụng các mỉa mai của thư viện thay vì mỉa mai của thì thầm, sẽ xảy ra gần như bất cứ khi nào.`whisper.audio.log_mel_spectrogram`

## Chuyển nó

保存为 `outputs/skill-whisper-tuner.md`◊ Để thiết kế một lĩnh vực mầm âm thanh tinh tế hoặc đường ống suy luận.

## Các bài tập

1. **Easy.**运行 `code/main.py`Nó sẽ biểu tượng hóa một lời nhắc kiểu thì thầm, tính toán ngân sách hình dạng được giải mã,并打印 10 phút clip lịch trình phần tử.
2. **Medium.**                                          `faster-whisper`,转写一个10分钟播客,并与人类转录比较 WER――尝试 `language="auto"`Với sự bắt buộc`language="en"`
3. **Hard.**Sử dụng HF `datasets`, chọn một ngôn ngữ Whisper biểu hiện吃力的 (ví dụ tiếng Urdu), trong 2 小时数据上使用 LoRA fine-tune Medium 2 epochs,并报告 WER delta──

## Các điều khoản chính

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| 30-sec window | Whisper 的限制 | 硬性 input cap；对更长 audio 做 chunk。 |
| SOT | Start-of-transcript | `<\|startoftranscript\|>` 启动 decoder prompt。 |
| Timestamps token | Temporal alignment | 每个 0.02 s offset 都是 51k vocab 中的 special token。 |
| Turbo | 快速 variant | 4-decoder layers，快 8×，<1% WER regression。 |
| WhisperX | long-form wrapper | VAD + Whisper + wav2vec alignment + diarization。 |
| LoRA fine-tune | Efficient tuning | 向 attention 添加 low-rank adapters；训练约 0.3% 的 params。 |
| Hallucination | 静音 failure | Whisper 从 noise/silence 中产生流畅 English。 |

## Đọc thêm

- [Radford et al. (2022). Whisper paper](https://arxiv.org/abs/2212.04356) kiến trúc nguyên thủy và công thức đào tạo.
- [OpenAI (2024). Whisper Large-v3-turbo release](https://github.com/openai/whisper/discussions/2363) 4 lớp decoder, 8x tốc độ.
- [Bain et al. (2023). WhisperX](https://arxiv.org/abs/2303.00747) hình dạng dài 、 từ phù hợp 、 diary ‖
- [Systran — faster-whisper repo](https://github.com/SYSTRAN/faster-whisper) CTranslate2 hỗ trợ,快4×。
- [HuggingFace — Whisper fine-tune tutorial](https://huggingface.co/blog/fine-tune-whisper) LoRA theo truyền thống / đi bộ toàn bộ FT。
