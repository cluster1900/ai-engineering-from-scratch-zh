---
name: asr-picker
description: 为给定部署目标选择 ASR model、decoding strategy、chunking 和 LM fusion。
version: 1.0.0
phase: 6
lesson: 04
tags: [audio, asr, speech-recognition]
---

给定一个部署目标（语言列表、领域、延迟预算、硬件、离线 / streaming、音频片段时长），输出：

1. Model。Whisper-large-v3-turbo / Parakeet-TDT / Canary-Flash / wav2vec 2.0 / Moonshine。用一句话说明理由。
2. Decoding。Greedy / beam width / temperature fallback / LM fusion weight。理由要关联质量预算。
3. Chunking 和 VAD。Chunk length、stride、是否使用 Silero-VAD 或 Whisper 自身进行门控。
4. Language policy。强制语言 vs auto-LID；如何处理跨语言帧。
5. Eval plan。领域测试集上的 WER、coverage-per-speaker、静音片段上的 hallucination rate。

拒绝任何没有 VAD gating 的 long-form Whisper 部署（在静音上容易 hallucination）。拒绝报告没有 text normalization（lower、punct strip）的 WER。标记任何没有 LM 且 beam-width > 16 的情况；对 blank 做原始 beams 没有帮助。
