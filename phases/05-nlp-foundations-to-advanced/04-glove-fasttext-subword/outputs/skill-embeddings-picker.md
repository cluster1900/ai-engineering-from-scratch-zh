---
name: skill-embeddings-picker
description: 为新的语言模型或文本 pipeline 选择一种 tokenization 方法。
version: 1.0.0
phase: 5
lesson: 04
tags: [nlp, tokenization, embeddings]
---

给定一个任务和 dataset 描述，你输出：

1. Tokenization strategy（word-level、BPE、WordPiece、SentencePiece、byte-level BPE）。一句话理由。
2. Vocabulary size target。English-only LM：32k。Multilingual：64k-100k。Code：50k-100k。
3. 带有精确训练命令的 library call。写出 library 名称（Hugging Face `tokenizers`、`sentencepiece`）。引用参数。
4. 一个 reproducibility pitfall。Tokenizer-model mismatch 是最常见的隐性生产 bug。指出哪个 Tokenizer 与哪个 pretrained checkpoint 配对，并警告不要替换。

当用户正在 fine-tuning pretrained LLM 时，拒绝推荐训练自定义 Tokenizer（fine-tune 必须使用 pretrained Tokenizer）。拒绝为任何 production inference path 推荐 word-level tokenization。将非 English 或 multi-script corpora 标记为需要带 byte fallback 的 SentencePiece。
