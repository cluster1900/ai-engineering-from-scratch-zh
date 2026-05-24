---
name: seq2seq-picker
description: 为新的 sequence-to-sequence 任务选择 encoder-decoder 还是 decoder-only。
version: 1.0.0
phase: 7
lesson: 8
tags: [transformers, t5, bart, seq2seq]
---

给定一个 seq2seq 任务（translation / summarization / speech-to-text / 结构化抽取 / 改写）、input 和 output 长度分布，以及质量与 latency 优先级，输出：

1. 架构。从以下选择一个：encoder-decoder（T5 / BART / Whisper-style）、decoder-only instruction-tuned、encoder-only + prompt template。用一句话说明理由。
2. Pretraining objective。Span corruption（T5）、denoising（BART）、next-token（decoder-only），或“跳过 pretraining，fine-tune 现有 checkpoint。”注明 checkpoint。
3. Input formatting。Task prefix string（T5 style）vs system prompt（decoder-only）vs raw tokens（BART）。包括 BOS/EOS 处理。
4. Decoding strategy。Beam search width 和 length penalty（translation/summary），或 nucleus/min-p（chat-like tasks）。说明该任务使用哪一种。
5. Eval。适合任务的 metric：BLEU / ROUGE / WER / F1 / exact match。包括 test split size。

拒绝为生成式 output 推荐 encoder-only。当 input 已经是 conversation 时，拒绝推荐 encoder-decoder，因为 decoder-only 天然适合 conversation memory。对于 speech-to-text，如果选择 decoder-only 却没有提到 Whisper 是需要超越的 baseline，则标记该问题。
