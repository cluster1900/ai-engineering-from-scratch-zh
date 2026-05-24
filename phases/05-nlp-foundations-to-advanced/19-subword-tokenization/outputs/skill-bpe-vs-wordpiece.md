---
name: skill-bpe-vs-wordpiece
description: 为给定 corpus 和部署目标选择 Tokenizer algorithm、vocab size、library。
version: 1.0.0
phase: 5
lesson: 19
tags: [nlp, tokenization]
---

给定一个 corpus（大小、语言、领域）和部署目标（从零训练 / fine-tuning / API-compatible inference），输出：

1. Algorithm。BPE、Unigram 或 WordPiece。用一句话说明原因。
2. Library。SentencePiece、HF Tokenizers 或 tiktoken。说明原因。
3. Vocab size。四舍五入到最近的 1k。原因要关联到模型大小和语言覆盖。
4. Coverage settings。`character_coverage`、`byte_fallback`、special-token list。
5. Validation plan。在 held-out set 上的 average tokens-per-word、OOV rate、compression ratio、round-trip decode equality。

拒绝在含有 rare-script 内容的 corpora 上训练 character-coverage <0.995 的 Tokenizer。拒绝发布没有在 CI 中进行冻结 `tokenizer.json` hash 检查的 vocab。标记任何低于 16k vocab 的 monolingual Tokenizer 为可能规格不足。
