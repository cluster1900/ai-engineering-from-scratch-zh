# Các mô hình tiếng  Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio

> Các mô hình tiếng nói năm 2026 có thể được xem xét đối với语音 + 环境声音 + 音乐. Qwen2.5-Omni-7B trên MMAU-Pro đạt GPT-4o Audio 水平.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 12 · 03 (Vision-Language Models), Phase 7 · 10 (Audio Transformers)
**Time:** ~45 分钟

## 问题

Bạn có 5 giây: chó kêu, ai đó kêu "hết!", rồi là im lặng.

- **转写。**" nói đã gì?" Đó là lĩnh vực của ASR.
- **语义推理。**"Người này có nguy hiểm không?" cần phải cùng hiểu chó kêu + 喊 + 沉默.
- **音乐推理。**"Những nhạc cụ nào đang chơi旋律?"
- **长音频检索。**"Trong bài giảng 90 phút này, vị giảng viên ở đâu giải thích sự xuống cấp?"

Một mô hình có thể trả lời tất cả những câu hỏi này bằng một cách đơn giản là**audio-language model**(LALM / ALM)  Nó khác với đơn thuần ASR:LALM 输出自由形式的自然语言答案, không chỉ là bản sao

## 概念

![Audio-language model: audio encoder + projector + LLM decoder](../assets/alm-architecture.svg)

### 三组件模板

Mỗi năm 2026 LALM đều có cùng một cấu trúc:

1. **Audio encoder.**Whisper encoder · BEATs · CLAP · WavLM · 或每个模型自定义的编码者──
2. **Projector.**Linear hoặc MLP,把 âm thanh-encoder tính năng 桥接到 LLM của Token Embedding 空间。
3. **LLM.**基于 Llama / Qwen / Gemma 的解码器──接收交错的文本 +音频代码;生成文本──

训练:

- **Stage 1.**结 mã hóa + LLM; chỉ trong ASR / captioning 数据上训练投影机。
- **Stage 2.**Trong hướng dẫn theo dõi 音频任务上进行全 / LoRA fine-tune ((QA、理性、音乐理解) ]]
- **Stage 3（可选）。**Voice-in / voice-out 会添加语音解码器──Qwen2.5-Omni 和 AF3-Chat 会这样做──

### 2026 模型地图

| Model | Backbone | Audio encoder | Output modality | Access |
|-------|----------|---------------|-----------------|--------|
| Qwen2.5-Omni-7B | Qwen2.5-7B | Custom + Whisper | text + speech | Apache-2.0 |
| Qwen3-Omni | Qwen3 | Custom | text + speech | Apache-2.0 |
| Audio Flamingo 3 | Qwen2 | AF-CLAP | text | NVIDIA non-commercial |
| Audio Flamingo Next | Qwen2 | AF-CLAP v2 | text | NVIDIA non-commercial |
| SALMONN | Vicuna | Whisper + BEATs | text | Apache-2.0 |
| LTU / LTU-AS | Llama | CAV-MAE | text | Apache-2.0 |
| GAMA | Llama | AST + Q-Former | text | Apache-2.0 |
| Gemini 2.5 Flash/Pro (closed) | Gemini | proprietary | text + speech | API |
| GPT-4o Audio (closed) | GPT-4o | proprietary | text + speech | API |

### Định nghĩa 现实检查(2026)

**MMAU-Pro.**1800 个 QA đối với, bao gồm ngôn ngữ / âm thanh / âm nhạc / hỗn hợp.

| Model | Overall | Speech | Sound | Music | Multi-audio |
|-------|---------|--------|-------|-------|-------------|
| Gemini 2.5 Pro | ~60% | 73.4% | 51.9% | 64.9% | ~22% |
| Gemini 2.5 Flash | ~57% | 73.4% | 50.5% | 64.9% | 21.2% |
| GPT-4o Audio | 52.5% | — | — | — | 26.5% |
| Qwen2.5-Omni-7B | 52.2% | 57.4% | 47.6% | 61.5% | ~20% |
| Audio Flamingo 3 | ~54% | — | — | — | — |
| Audio Flamingo Next | LongAudioBench 上的 SOTA | — | — | — | — |

**multi-audio 列对所有模型都很致命。**4  chọn 1  chọn nhiều bài toán có tỷ lệ có thể xảy ra = 25%; hầu hết các mô hình nằm gần mức này.

### LALM trong năm 2026 phù hợp sử dụng ở đâu

- **呼叫中心录音的合规审计。**"Sitting chair có đề cập đến các thông báo cần thiết?"
- **无障碍。**向聋人用户描述声音事件(不只是转写)
- **内容审核。**检测暴力语言 + 威胁语气 + 背景上下文。
- **播客 / 会议章节划分。**语义摘要,而不只是讲者转而而来──
- **音乐目录分析。**"đ tìm tất cả những gì có phần B chuyển调 của các bài hát:"

### Chúng cũng không phù hợp với nơi nào

- 细粒度乐理 (nếu là ở cấp độ thấp hơn)
- Chuyện này đã xảy ra trong thời gian dài.
- + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
- 实时流式推理 ( Hầu hết là kết luận lô hàng không)


```figure
v4-alm-tokens
```

##  xây dựng nó

### 步骤 1: 查询 Qwen2.5-Omni

```python
from transformers import AutoModelForCausalLM, AutoProcessor

processor = AutoProcessor.from_pretrained("Qwen/Qwen2.5-Omni-7B")
model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-Omni-7B", torch_dtype="auto")

audio, sr = load_wav("clip.wav", sr=16000)
messages = [{
    "role": "user",
    "content": [
        {"type": "audio", "audio": audio},
        {"type": "text", "text": "What sounds do you hear, and what's happening?"},
    ],
}]
inputs = processor.apply_chat_template(messages, tokenize=True, return_tensors="pt")
output = model.generate(**inputs, max_new_tokens=200)
print(processor.decode(output[0], skip_special_tokens=True))
```

### 步骤 2: máy chiếu 模式

```python
import torch.nn as nn

class AudioProjector(nn.Module):
    def __init__(self, audio_dim=1280, llm_dim=4096):
        super().__init__()
        self.down = nn.Linear(audio_dim, llm_dim)
        self.act = nn.GELU()
        self.up = nn.Linear(llm_dim, llm_dim)

    def forward(self, audio_features):
        return self.up(self.act(self.down(audio_features)))
```

Đó là cách mà máy chiếu thường là 1-3 lớp tuyến tính. Trong ASR đối với âm thanh → bản sao) trên đào tạo nó, đó là nhiệm vụ giả vờ giai đoạn 1.

### 步骤 3: Benchmark MMAU / LongAudioBench

```python
from datasets import load_dataset
mmau = load_dataset("MMAU/MMAU-Pro")

correct = 0
for item in mmau["test"]:
    answer = call_model(item["audio"], item["question"], item["choices"])
    if answer == item["correct_choice"]:
        correct += 1
print(f"Accuracy: {correct / len(mmau['test']):.3f}")
```

分別報告每个类别(khás/ âm thanh/ âm nhạc/ đa âm thanh) ――聚合数字会掩盖模型在哪里失败──

## Sử dụng nó

| Task | 2026 pick |
|------|-----------|
| 自由形式 audio QA（open） | Qwen2.5-Omni-7B |
| 长音频上最好的 open 模型 | Audio Flamingo Next |
| 最好的 closed 模型 | Gemini 2.5 Pro |
| Voice-in / voice-out agent | Qwen2.5-Omni 或 GPT-4o Audio |
| 音乐推理 | Audio Flamingo 3 或 2（music-specialized AF-CLAP） |
| 呼叫中心审计 | Gemini 2.5 Pro via API，结合基于你的 policy docs 的 RAG |

## 陷

- **过度信任 multi-audio。**Nếu nhiệm vụ của bạn cần "những clip có X", gần như có hiệu suất ngang ngang là thực sự tồn tại.
- **长音频退化。**超过10分钟后, hầu hết các mô hình của người nói thuộc về 会崩――先日記ze(Lớp 6),再总结――
- **沉默上的幻觉。**Sử dụng Whisper encoder của LALMs 会继承同类 Whisper-style 问题──使用 VAD-gate──
- **Benchmark cherry-picking。**Các bài đăng trên blog của nhà cung cấp sẽ nổi bật nhất.

## 交付 nó

保存为 `outputs/skill-alm-picker.md`◊为给定的音频理解任务选择 LALM + điểm tham khảo phụ + output-modality(text vs speech)。

## 练习

1. **简单。**运行 `code/main.py`,查看一个玩具投影器模式 + 假 LALM 对 (audio-embedding, text-tokens) → output token 的路由──
2. **中等。**Trong 100 bài phát biểu MMAU-Pro, hãy xem Qwen2.5-Omni-7B 打分―― với báo cáo  báo cáo 数字比较――
3. **困难。**构建一个最小的音频标题基线:BEATs encoder + 2层投影机 + đông lạnh Llama-3.2-1B── chỉ ở AudioCaps 上细调投影机──与Clotho-AQA 上的 SALMONN 比较──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| LALM | Audio ChatGPT | Audio encoder + projector + LLM decoder. |
| Projector | Adapter | 将音频特征映射到 LLM Embedding 空间的小型 MLP。 |
| MMAU | 这个 benchmark | 覆盖 speech、sound、music 的 10k audio-QA 对。 |
| MMAU-Pro | 更难的 MMAU | 1800 个 multi-audio / reasoning-heavy 问题。 |
| LongAudioBench | 长形式 eval | 带语义查询的多分钟片段。 |
| Voice-in / voice-out | Speech-native | 模型接收语音并输出语音，不绕经文本。 |

## 延伸阅读

- [Chu et al. (2024). Qwen2-Audio](https://arxiv.org/abs/2407.10759) 参考架构──
- [Alibaba (2025). Qwen2.5-Omni](https://huggingface.co/Qwen/Qwen2.5-Omni-7B) nói chuyện trong nói chuyện ngoài 
- [NVIDIA (2025). Audio Flamingo 3](https://arxiv.org/abs/2507.08128) mở âm thanh dài 领先者。
- [NVIDIA (2026). Audio Flamingo Next](https://arxiv.org/abs/2604.10905) LongAudioBench SOTA。
- [Tang et al. (2023). SALMONN](https://arxiv.org/abs/2310.13289) mã hóa kép 先驱。
- [MMAU-Pro leaderboard](https://mmaubenchmark.github.io/) 2026 实时排名──
