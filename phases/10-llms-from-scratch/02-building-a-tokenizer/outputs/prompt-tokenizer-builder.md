---
name: prompt-tokenizer-builder
description: 为 LLM 项目构建和调试生产级 Tokenizers
version: 1.0.0
phase: 10
lesson: 2
tags: [tokenizer, bpe, byte-level, special-tokens, chat-template, multilingual]
---

# 生产级 Tokenizer 构建器

在为 LLM 项目构建或调试 Tokenizer 时，请遵循这个框架。

## Pipeline 检查清单

每个生产级 Tokenizer 都需要这五个阶段。如果缺少其中一个，你就会在生产环境中遇到边缘情况。

1. **Normalize** -- 应用 NFKC Unicode normalization。这会折叠连字（"fi" -> "fi"），规范化全角字符，并标准化空白。跳过这一步时，同一个单词会根据输入方式不同而得到不同的 Token IDs。

2. **Pre-Tokenize** -- 在 BPE 之前把文本拆分成块。对于以英语为中心的模型，使用 GPT-2 的 regex pattern。对于 Multilingual 模型，使用 SentencePiece 的 raw-byte 方法。这个选择决定了 BPE 是否可以跨单词边界进行合并。

3. **BPE Merge** -- 在每个块内对 byte sequences 应用已学习的 merge table。merge table 就是 Tokenizer 学到的知识。其他所有部分都是管道工程。

4. **Special Token Injection** -- 在 BPE 运行之前精确匹配 special tokens。[BOS]、[EOS]、[PAD]、chat template markers 会获得固定 ID。它们永远不参与合并。

5. **ID Mapping** -- 将 Token 字符串转换为整数。模型只看见整数。

## 调试 Tokenizer 问题

**症状：模型在 chat input 上产生垃圾输出**
- 检查 chat template。每个模型都有不同格式。Llama 3 使用 `<|start_header_id|>` markers。ChatGPT 使用 `<|im_start|>` markers。错误的 template 会把输入放到训练分布之外。

**症状：非英语文本使用过多 Token**
- 检查 fertility（每个单词的 Token 数）。高于 2.0 意味着 Tokenizer 在该语言上浪费 context window。解决方案：用更多 Multilingual 数据重新训练、增加 vocabulary size，或使用带 Unigram 的 SentencePiece。

**症状：数字和算术失败**
- 检查数字是如何 Tokenized 的。"1234" 作为一个 Token 意味着模型无法执行 digit-level 操作。在 pre-tokenization 期间单独拆分数字。

**症状：代码 Token 效率低**
- 检查缩进的处理方式。GPT-2 的 Tokenizer 会在空格上浪费 Token。Codex 和 StarCoder 使用特殊缩进 Token（4 个空格 = 1 个 Token）。

## Vocabulary Size 决策

- 32K Token：单语言、小模型、有限计算。Embedding layer 是 32K * d_model 参数。
- 50K-64K：Multilingual 或 code-heavy。对大多数项目来说是良好平衡。
- 100K+（GPT-4、Llama 3）：仅在有海量训练数据时使用。序列更短，但有 100K * d_model 个 Embedding parameters。

对于 4096 维模型：32K vocab = 131M Embedding params。128K vocab = 524M Embedding params。仅 Embedding layer 就相差 400M 参数。

## 速度要求

- 训练数据 Tokenization：使用 Rust-backed libraries（tiktoken、HuggingFace tokenizers）。纯 Python 慢 10-100 倍。
- Inference Tokenization：latency 重要性较低（单序列），但仍然使用 compiled implementations。
- Benchmark：Tokenize 1GB 文本并测量 wall clock time。如果超过 60 秒，切换到 Rust backend。

## Chat Template 验证

在部署任何 chat model 之前，验证 template：

1. 用 Tokenizer 编码一个已知对话
2. 将其解码回文本
3. 与模型文档中的预期格式逐字符比较
4. 注意：header tokens 后的换行、content 前的空格、end-of-turn markers
5. 测试边缘情况：空 system message、很长的 user message、多轮 assistant turns

弄错 chat template 是 chat model 性能下降最常见的来源。
