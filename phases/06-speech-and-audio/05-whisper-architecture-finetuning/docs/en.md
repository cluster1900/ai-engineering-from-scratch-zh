# Whisper — 架构与 Fine-Tuning

> Whisper 是一个 30 秒窗口的 Transformer encoder-decoder，在 68 万小时多语言弱监督音频-文本对上训练而成。一个架构，多个任务，在 99 种语言上都很稳健。2026 年的参考 ASR。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 5 · 10 (Attention), Phase 7 · 05 (Full Transformer)
**Time:** ~75 minutes

## 问题

Whisper 由 OpenAI 于 2022 年 9 月发布，是第一个以商品化方式交付的 ASR 模型：粘贴音频，得到文本，支持 99 种语言，对噪声稳健，可在 laptop 上运行。到 2024 年，OpenAI 已经发布了 Large-v3 和 Turbo 变体；到 2026 年，Whisper 是从 podcast 转写到 voice assistants 再到 YouTube subtitles 的默认 baseline。

但 Whisper 不是一个你可以永远当作黑盒处理的 pipeline。Domain shift 会毁掉它——技术术语、说话人 accent、proper nouns、短片段、静音。你需要知道：

1. 它内部实际是什么。
2. 如何正确地给它提供 chunked、streaming 或 long-form 音频。
3. 什么时候 fine-tune，以及如何 fine-tune。

## 概念

![Whisper encoder-decoder, tasks, chunked inference, fine-tune](../assets/whisper.svg)

**架构。** 标准 Transformer encoder-decoder。

- 输入：30 秒 log-mel spectrogram，80 mels，10 ms hop → 3000 frames。更短的 clips 会 zero-padded，更长的 clips 会被 chunked。
- Encoder：conv-downsample (stride 2) + `N` 个 Transformer blocks。对于 Large-v3：32 层，1280-dim，20 heads。
- Decoder：`N` 个 Transformer blocks，带 causal self-attn + 到 encoder output 的 cross-attn。大小与 encoder 相同。
- 输出：覆盖 51,865-Token vocab 的 BPE Tokens。

Large-v3 有 1.55B 参数。Turbo 使用 4-layer decoder（从 32 层减少而来），以 <1% WER 损失将延迟降低 8×。

**Prompt 格式。** Whisper 是一个 multitask 模型，由 decoder prompt 中的特殊 Tokens 控制：

```
<|startoftranscript|><|en|><|transcribe|><|notimestamps|> Hello world.<|endoftext|>
```

- `<|en|>` — 语言标签；强制 translation-vs-transcription 行为。
- `<|transcribe|>` 或 `<|translate|>` — 从任意语言输入翻译成英文输出，或逐字转写。
- `<|notimestamps|>` — 跳过 word-level timestamps（更快）。

Prompt 让一个模型可以执行许多任务。把 `<|en|>` 改成 `<|fr|>`，它就会转写法语。

**30 秒窗口。** 一切都固定在 30 秒。更长的 clips 需要 chunking；更短的 clips 会被 padding。Windows 并非原生 streaming——这就是 WhisperX、Whisper-Streaming 和 faster-whisper 存在的原因。

**Log-mel normalization。** `(log_mel - mean) / std`，其中 stats 来自 Whisper 自己的训练语料。你*必须*使用 Whisper 的 preprocessing（`whisper.audio.log_mel_spectrogram`），而不是 `librosa.feature.melspectrogram`。

### 2026 年的变体

| Variant | Params | Latency (A100) | WER (LibriSpeech-clean) |
|---------|--------|----------------|------------------------|
| Tiny | 39M | 1× realtime | 5.4% |
| Base | 74M | 1× | 4.1% |
| Small | 244M | 1× | 3.0% |
| Medium | 769M | 1× | 2.7% |
| Large-v3 | 1.55B | 2× | 1.8% |
| Large-v3-turbo | 809M | 8× | 1.58% |
| Whisper-Streaming (2024) | 1.55B | streaming | 2.0% |

### Fine-tuning

2026 年的标准 workflow：

1. 收集 10–100 小时目标 domain 音频，并配有对齐 transcripts。
2. 使用带 `generate_with_loss` callback 的 `transformers.Seq2SeqTrainer`。
3. 参数高效：在 attention layers 的 `q_proj`、`k_proj`、`v_proj` 上使用 LoRA，可在 <0.3 WER 成本下降低 GPU memory 4×。
4. 如果你只有 <10 小时数据，freeze encoder。只 tune decoder。
5. 使用 Whisper 自己的 Tokenizer 和 prompt 格式；永远不要替换 Tokenizers。

社区结果：在 20 小时医学 dictation 上 fine-tune Medium，可将医学 vocabulary 上的 WER 从 12% 降到 4.5%。在 4 小时 Icelandic 上 fine-tune Turbo，可将 WER 从 18% 降到 6%。

## 构建它

### 步骤 1：开箱即用运行 Whisper

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

你应该总是覆盖的关键默认值：`temperature=0.0`（sampling 默认是 0.0 → 0.2 → 0.4 … fallback chain）、`condition_on_previous_text=False`（防止级联 hallucination 问题），以及 `no_speech_threshold=0.6`（silence detection）。

### 步骤 2：chunked long-form

```python
# whisperx is the 2026 reference for long-form with word-level timestamps
import whisperx
model = whisperx.load_model("large-v3-turbo", device="cuda", compute_type="float16")
segments = model.transcribe("1hour.mp3", batch_size=16, chunk_size=30)
```

WhisperX 增加了：(1) Silero VAD gating，(2) 通过 wav2vec 2.0 做 word-level alignment，(3) 通过 `pyannote.audio` 做 diarization。它是 2026 年 production transcription 的主力。

### 步骤 3：使用 LoRA fine-tune

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

然后使用标准 Trainer loop。每 1000 steps checkpoint 一次。用 held-out 上的 WER 进行评估。

### 步骤 4：检查每一层学到了什么

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

用 heatmap 可视化——你会看到 decoder steps 扫过 encoder frames 时形成的 diagonal alignment。这个 diagonal 就是 Whisper 对 word timestamps 的理解。

## 使用它

2026 年的 stack：

| Situation | Pick |
|-----------|------|
| 通用英文，offline | 通过 `whisperx` 使用 Large-v3-turbo |
| Mobile / edge | Whisper-Tiny quantized (int8) 或 Moonshine |
| 多语言 long-form | 通过 `whisperx` + diarization 使用 Large-v3 |
| 低资源语言 | 用 LoRA fine-tune Medium 或 Turbo |
| Streaming（2 s 延迟） | Whisper-Streaming 或 Parakeet-TDT |
| Word-level timestamps | WhisperX（通过 wav2vec 2.0 forced alignment） |

`faster-whisper`（CTranslate2 backend）是 2026 年最快的 CPU+GPU inference runtime——比 vanilla 快 4×，输出完全相同。

## 2026 年仍然会被带到线上系统的坑

- **静音上的 hallucinated text。** Whisper 在 captions 上训练，包含 “Thanks for watching!”、“Subscribe!”、song lyrics。调用前始终进行 VAD-gate。
- **`condition_on_previous_text` 级联。** 一次 hallucination 会污染后续 windows。除非你需要跨 chunks 的流畅性，否则设为 `False`。
- **短 clip padding。** 一个 2 秒 clip padding 到 30 秒后，可能在后续静音中 hallucinate。使用 `pad=False` 或 VAD-gate。
- **错误的 mel stats。** 使用 librosa 的 mels 而不是 Whisper 的 mels，会产生近乎随机的输出。使用 `whisper.audio.log_mel_spectrogram`。

## 交付它

保存为 `outputs/skill-whisper-tuner.md`。为给定 domain 设计一个 Whisper fine-tune 或 inference pipeline。

## 练习

1. **Easy。** 运行 `code/main.py`。它会 tokenize 一个 Whisper-style prompt，计算 decoded shape budgets，并打印 10 分钟 clip 的 chunk schedule。
2. **Medium。** 安装 `faster-whisper`，转写一个 10 分钟 podcast，并与人工 transcript 比较 WER。尝试 `language="auto"` 与强制 `language="en"`。
3. **Hard。** 使用 HF `datasets`，选择一种 Whisper 表现困难的语言（例如 Urdu），在 2 小时数据上用 LoRA fine-tune Medium 2 个 epochs，并报告 WER delta。

## 关键术语

| 术语 | 人们怎么说 | 实际含义 |
|------|------------|----------|
| 30-sec window | Whisper 的限制 | 硬输入上限；对更长音频进行 chunk。 |
| SOT | Start-of-transcript | `<|startoftranscript|>` 启动 decoder prompt。 |
| Timestamps Token | 时间对齐 | 每 0.02 s offset 都是 51k vocab 中的一个特殊 Token。 |
| Turbo | 快速变体 | 4 个 decoder layers，快 8×，<1% WER regression。 |
| WhisperX | Long-form wrapper | VAD + Whisper + wav2vec alignment + diarization。 |
| LoRA fine-tune | 高效 tuning | 向 attention 添加 low-rank adapters；训练约 0.3% 的参数。 |
| Hallucination | 静默失败 | Whisper 会从噪声/静音中生成流畅英文。 |

## 延伸阅读

- [Radford et al. (2022). Whisper paper](https://arxiv.org/abs/2212.04356) — 原始架构和训练 recipe。
- [OpenAI (2024). Whisper Large-v3-turbo 发布](https://github.com/openai/whisper/discussions/2363) — 4-layer decoder，8× speedup。
- [Bain et al. (2023). WhisperX](https://arxiv.org/abs/2303.00747) — 长音频、词级对齐、说话人分离。
- [Systran — faster-whisper repo](https://github.com/SYSTRAN/faster-whisper) — CTranslate2-backed，快 4×。
- [HuggingFace — Whisper fine-tune tutorial](https://huggingface.co/blog/fine-tune-whisper) — 标准 LoRA / full-FT walkthrough。
