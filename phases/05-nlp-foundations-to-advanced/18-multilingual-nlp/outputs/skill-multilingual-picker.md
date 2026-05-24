---
name: multilingual-picker
description: 为多语言 NLP 任务选择源语言、目标模型和评估计划。
version: 1.0.0
phase: 5
lesson: 18
tags: [nlp, multilingual, cross-lingual]
---

给定需求（目标语言、任务类型、每种语言可用的标注数据），输出：

1. 用于 fine-tuning 的源语言。默认 English；如果目标语言有类型学上接近的高资源语言，检查 LANGRANK 或 qWALS。
2. Base model。XLM-R（classification）、mT5（generation）、NLLB（translation）、Aya-23（generative LLM）。
3. Few-shot 预算。如果可用，从 100-500 个目标语言示例开始。仅在标注不可行时使用 Zero-shot。
4. 评估计划。按语言分别计算 accuracy（不要 aggregate）、跨语言一致性、非拉丁文字上的 entity-level F1。

如果没有按语言分别评估，拒绝发布多语言模型，因为 aggregate metrics 会隐藏长尾失败。将 tokenization 覆盖率低的文字系统（Amharic、Tigrinya、许多 African languages）标记为需要具备 byte-fallback 的模型（SentencePiece with byte_fallback=True，或像 GPT-2 这样的 byte-level tokenizer）。
