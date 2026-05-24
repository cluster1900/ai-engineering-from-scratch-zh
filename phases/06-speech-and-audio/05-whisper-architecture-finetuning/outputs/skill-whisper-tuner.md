---
name: whisper-tuner
description: 为给定语言、domain 和延迟预算设计 Whisper fine-tune 或 inference pipeline。
version: 1.0.0
phase: 6
lesson: 05
tags: [audio, whisper, asr, fine-tuning, lora]
---

给定目标（language set、domain、clip length distribution、latency budget、hardware）和数据（可用小时数、质量），输出：

1. Variant。Tiny / Base / Small / Medium / Large-v3 / Turbo。原因。
2. Runtime。vanilla / faster-whisper / whisperx / whisper-streaming。原因。
3. Fine-tune plan。Full-FT vs LoRA（r、target_modules）、freeze-encoder policy、epoch count。
4. Inference guards。VAD（Silero 或 Whisper 自身）、`temperature=0`、`condition_on_previous_text=False`、`no_speech_threshold`。
5. Evaluation。Domain WER target、text normalization rules、静音 clips 上的 hallucination-rate check。

拒绝在没有 VAD 的任意音频上部署 Whisper。对于没有 runaway guard 的 multi-chunk jobs，拒绝设置 `condition_on_previous_text=True`。标记任何替换 Whisper Tokenizer 或 mel pipeline 的 fine-tune。
