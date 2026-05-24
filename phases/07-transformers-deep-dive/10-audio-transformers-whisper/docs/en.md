# Audio Transformer — Whisper 架构

> Audio 是随时间变化的频率图像。Whisper 是一个吃 mel spectrogram 并输出语音内容的 ViT。

**Type:** Learn
**Languages:** Python
**先修要求:** Phase 7 · 05 (Full Transformer), Phase 7 · 08 (Encoder-Decoder), Phase 7 · 09 (ViT)
**Time:** ~45 分钟

## 问题

在 Whisper（OpenAI, Radford et al. 2022）之前，state-of-the-art automatic speech recognition (ASR) 意味着 wav2vec 2.0 和 HuBERT：self-supervised 特征提取器加一个 fine-tuned head。质量高，但数据 pipeline 昂贵，并且对 domain 很脆弱。Multilingual speech recognition 需要按语言家族分别训练模型。

Whisper 做了三个押注：

1. **在所有数据上训练。** 680,000 小时从互联网抓取的 weakly-labeled audio，覆盖 97 种语言。没有干净的学术语料库。没有 phoneme labels。
2. **Multi-task 单模型。** 一个 decoder 通过 task tokens 联合训练 transcription、translation、voice activity detection、language ID 和 timestamping。
3. **标准 encoder-decoder Transformer。** Encoder 消费 log-mel spectrograms。Decoder 以 autoregressive 方式生成 text tokens。没有 vocoder，没有 CTC，没有 HMM。

结果是：Whisper large-v3 在口音、噪声以及没有任何干净标注数据的语言上都很 robust。到 2026 年，它已经成为每个 open-source voice assistant 和大多数商业 voice assistant 的默认 speech front-end。

## 核心概念

![Whisper pipeline: audio → mel → encoder → decoder → text](../assets/whisper.svg)

### Step 1 — resample + window

Audio 采样率为 16 kHz。裁剪/填充到 30 秒。计算 log-mel spectrogram：80 个 mel bins，10 ms stride → 约 3,000 frames × 80 features。这就是 Whisper 看到的“input image”。

### Step 2 — convolutional stem

两个 Conv1D 层，kernel 为 3、stride 为 2，将 3,000 frames 减少到 1,500。在不增加大量参数的情况下将 sequence length 减半。

### Step 3 — encoder

一个 24 层（large 版本）的 Transformer encoder，处理 1,500 个 timesteps。使用 sinusoidal positional encoding、self-attention、GELU FFN。输出 1,500 × 1,280 hidden states。

### Step 4 — decoder

一个 24 层 Transformer decoder。它从一个 BPE vocabulary 中 autoregressive 地生成 tokens；这个 vocabulary 是 GPT-2 词表的超集，并加入了一些 audio-specific special tokens。

### Step 5 — task tokens

decoder prompt 以 control tokens 开头，用来告诉模型要做什么：

```
<|startoftranscript|>  <|en|>  <|transcribe|>  <|0.00|>
```

或者

```
<|startoftranscript|>  <|fr|>  <|translate|>   <|0.00|>
```

模型就是按这个约定训练的。你通过 prefix 控制任务。这相当于 2026 年的 instruction-tuning，但应用在 speech 上。

### Step 6 — output

使用 log-prob threshold 的 beam search（width 5）。当 `<|notimestamps|>` token 不存在时，timestamps 会按每 0.02 秒 audio 预测一次。

### Whisper sizes

| 模型 | 参数量 | 层数 | d_model | Heads | VRAM (fp16) |
|-------|--------|--------|---------|-------|-------------|
| Tiny | 39M | 4 | 384 | 6 | ~1 GB |
| Base | 74M | 6 | 512 | 8 | ~1 GB |
| Small | 244M | 12 | 768 | 12 | ~2 GB |
| Medium | 769M | 24 | 1024 | 16 | ~5 GB |
| Large | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3 | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3-turbo | 809M | 32 | 1280 | 20 | ~6 GB（4-layer decoder） |

Large-v3-turbo（2024）把 decoder 从 32 层削减到 4 层。decoding 快 8×，WER 回退小于 1 个点。这个 decode speed 解锁，是 Whisper-turbo 在 2026 年成为 real-time voice agents 默认选择的原因。

### Whisper 不做什么

- 没有 diarization（谁在说话）。需要这个能力时搭配 pyannote。
- 原生没有 real-time streaming：30-second window 是固定的。现代 wrapper（`faster-whisper`、`WhisperX`）通过 VAD + overlap 加上 streaming。
- 没有超过 30 s 的 long-form context，除非使用外部 chunking。实践中效果很好，因为人类 speech 在 transcription 中很少需要 long-range context。

### 2026 生态

| 任务 | 模型 | 备注 |
|------|-------|-------|
| English ASR | Whisper-turbo, Moonshine | Moonshine 在 edge 上快 4× |
| Multilingual ASR | Whisper-large-v3 | 97 种语言 |
| Streaming ASR | faster-whisper + VAD | 可达到 150 ms latency 目标 |
| TTS | Piper, XTTS-v2, Kokoro | Encoder-decoder pattern，但形态类似 Whisper |
| Audio + language | AudioLM, SeamlessM4T | Text tokens + audio tokens 在同一个 Transformer 中 |

## 构建它

见 `code/main.py`。我们不训练 Whisper，而是构建 log-mel spectrogram pipeline + task-token prompt formatter。这些才是你在生产环境中真正会接触的部分。

### 步骤 1： synthesize audio

生成一个 1 秒、440 Hz、16 kHz 采样的 sine wave。共 16,000 个 samples。

### 步骤 2： log-mel spectrogram（简化版）

完整 mel spectrogram 需要 FFT。我们做一个简化的 framing + per-frame energy 版本，在不依赖 `librosa` 的情况下展示 pipeline：

```python
def frame_signal(x, frame_size=400, hop=160):
    frames = []
    for start in range(0, len(x) - frame_size + 1, hop):
        frames.append(x[start:start + frame_size])
    return frames
```

Frame = 25 ms，hop = 10 ms。匹配 Whisper 的 windowing。出于教学目的，per-frame energy 用来代表 mel bins。

### 步骤 3： pad to 30 s

Whisper 总是处理 30-second chunks。将 spectrogram 填充（或裁剪）到 3,000 frames。

### 步骤 4: 构建 prompt tokens

```python
def whisper_prompt(lang="en", task="transcribe", timestamps=True):
    tokens = ["<|startoftranscript|>", f"<|{lang}|>", f"<|{task}|>"]
    if not timestamps:
        tokens.append("<|notimestamps|>")
    return tokens
```

这就是完整的 task-control surface。一个 4-token prefix。

## 使用它

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("meeting.wav", language="en", task="transcribe")
print(result["text"])
print(result["segments"][0]["start"], result["segments"][0]["end"])
```

更快、兼容 OpenAI：

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3-turbo", compute_type="int8_float16")
segments, info = model.transcribe("meeting.wav", vad_filter=True)
for s in segments:
    print(f"{s.start:.2f} - {s.end:.2f}: {s.text}")
```

**2026 年何时选择 Whisper：**

- 用一个模型做 Multilingual ASR。
- 对 noisy、diverse audio 进行 robust transcription。
- 研究 / prototype ASR：最快的起点。

**何时选择其他方案：**

- edge 上的 ultra-low latency streaming：在质量相当时 Moonshine 胜过 Whisper。
- 需要 <200 ms 的 real-time conversational AI：使用专用 streaming ASR。
- Speaker diarization：Whisper 不做这个；用 pyannote 补上。

## 交付它

见 `outputs/skill-asr-configurator.md`。这个 skill 会为新的 speech application 选择 ASR model、decoding parameters 和 preprocessing pipeline。

## 练习

1. **Easy.** 运行 `code/main.py`。确认在 16 kHz、10 ms hop 下，1 秒信号的 frame count 约为 100 frames。30 秒则约为 3,000 frames。
2. **Medium.** 使用 `numpy.fft` 构建完整 log-mel spectrogram。验证 80 个 mel bins 与 `librosa.feature.melspectrogram(n_mels=80)` 在 numerical error 范围内匹配。
3. **Hard.** 实现 streaming inference：将 audio 切成 10 s windows，带 2 s overlap；对每个 chunk 运行 Whisper；合并 transcripts。在一个 5-minute podcast sample 上测量与 single-pass 相比的 word-error rate。

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| Mel spectrogram | “Audio image” | 2D 表示：一个轴是 frequency bins，另一个轴是 time frames；每个 cell 是 log-scaled energy。 |
| Log-mel | “Whisper 看到的东西” | 经过 log 处理的 mel spectrogram；近似人类对响度的感知。 |
| Frame | “一个时间切片” | 25 ms 的 samples window；以 10 ms stride 重叠。 |
| Task token | “speech 的 prompt prefix” | decoder prompt 中的 special tokens，例如 `<|transcribe|>` / `<|translate|>`。 |
| Voice activity detection (VAD) | “找到 speech” | 在 ASR 之前移除 silence 的 gate；大幅降低成本。 |
| CTC | “Connectionist Temporal Classification” | 用于 alignment-free training 的经典 ASR loss；Whisper 不使用它。 |
| Whisper-turbo | “小 decoder，完整 encoder” | large-v3 encoder + 4-layer decoder；decoding 快 8×。 |
| Faster-whisper | “生产环境 wrapper” | CTranslate2 重新实现；int8 quantization；比 OpenAI reference 快 4×。 |

## 延伸阅读

- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) — Whisper 论文。
- [OpenAI Whisper repo](https://github.com/openai/whisper) — reference code + model weights。阅读 `whisper/model.py`，可以在约 400 行中从头到尾看到 Conv1D stem + encoder + decoder。
- [OpenAI Whisper — `whisper/decoding.py`](https://github.com/openai/whisper/blob/main/whisper/decoding.py) — Steps 5–6 中描述的 beam-search + task-token logic 就在这里；500 行，完全可读。
- [Baevski et al. (2020). wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477) — 前身；在某些场景中仍然是 SOTA features。
- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) — production wrapper，比 reference 快 4×。
- [Jia et al. (2024). Moonshine: Speech Recognition for Live Transcription and Voice Commands](https://arxiv.org/abs/2410.15608) — 2024 年适合 edge 的 ASR，形态类似 Whisper 但更小。
- [HuggingFace blog — "Fine-Tune Whisper For Multilingual ASR with 🤗 Transformers"](https://huggingface.co/blog/fine-tune-whisper) — canonical fine-tuning recipe，包含 mel spectrogram preprocessor 和 token-timestamp handling。
- [HuggingFace `modeling_whisper.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/whisper/modeling_whisper.py) — 完整实现（encoder、decoder、cross-attention、generation），与本课的 architecture diagram 对应。
