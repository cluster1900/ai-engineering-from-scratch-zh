---
name: skill-tokenizer
description: 为 LLM 项目选择和构建 Tokenizer
version: 1.0.0
phase: 10
lesson: 1
tags: [tokenizer, bpe, wordpiece, sentencepiece, llm, nlp]
---

# Tokenizer 选择与实现

启动 LLM 项目时，应用这个 Tokenizer 选择决策框架。

## 何时使用每种 Tokenizer

**Byte-level BPE (tiktoken):** 你正在基于 GPT-family models 构建或进行 fine-tuning。你需要保证能够处理任意输入字节序列。你不希望出现 unknown tokens。

**WordPiece (Hugging Face):** 你正在使用 BERT-family models 处理 Classification、NER 或 Embedding 任务。你需要 "##" continuation prefix，以支持依赖词边界信号的下游任务。

**SentencePiece (BPE or Unigram):** 你正在从零训练。你需要与语言无关的 Tokenization。你的数据包含 CJK languages、Thai，或其他没有空白词边界的文字系统。LLaMA、T5 和大多数 Multilingual models 都使用它。

## Vocabulary 大小指南

- 32K tokens：单语言模型的良好默认值，可保持 Embedding layer 较小
- 50K-64K tokens：更适合 Multilingual 或 code-heavy models
- 100K+ tokens：仅当你拥有海量训练数据并希望序列更短时使用

更大的 vocabulary 意味着更短的序列（inference 成本更低），但 Embedding Matrix 中的参数更多。对于 100K vocabulary 和 4096 维 Embedding，仅 Embedding layer 就有 400M 参数。

## 重要的 pre-tokenization 规则

1. 在 BPE 之前按空白字符拆分，以防止跨词合并
2. 如果希望模型学习算术，请将数字逐位分开
3. 在 Tokenization 前进行 Unicode (NFC) 规范化，以获得一致行为
4. 为你的使用场景添加 special tokens：`<pad>`、`<eos>`、`<bos>`、`<unk>`，以及任何任务特定标记

## Tokenizer 行为中的危险信号

- 目标语言的 fertility 高于 2.0：模型在浪费 context window
- 常见领域词被拆分为 3+ 个 Token：使用领域数据重新训练
- 数字的 Tokenization 不一致：检查数字拆分规则
- 大 vocabulary 中有许多只使用一次的 Token：降低 vocabulary 大小

## 构建 custom Tokenizer - checklist

1. 收集有代表性的训练数据（目标领域中至少 1GB 文本）
2. 选择算法：通用场景使用 BPE，Multilingual 场景使用 Unigram
3. 根据上方指南设置 vocabulary 大小
4. 配置 pre-tokenization：空白拆分、数字处理、标点
5. 添加 special tokens
6. 使用 Hugging Face tokenizers library 训练（Rust backend，速度快）
7. 验证：在所有目标语言的 held-out text 上检查 fertility
8. 测试边界情况：空字符串、超长输入、二进制数据、emoji、RTL text
9. 将 Tokenizer 与 model checkpoints 一起保存并进行版本管理
