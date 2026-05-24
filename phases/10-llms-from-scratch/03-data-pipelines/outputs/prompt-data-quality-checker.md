---
name: prompt-data-quality-checker
description: 验证并调试 LLM 预训练 pipeline 中的数据质量
version: 1.0.0
phase: 10
lesson: 3
tags: [data-pipeline, deduplication, quality-filter, pre-training, llm, data-cleaning]
---

# 面向 LLM 预训练的数据质量检查器

在构建或审计 LLM 预训练 data pipeline 时，使用这个框架在问题进入模型之前捕获它们。

## Pipeline 输出中的危险信号

**Deduplication 移除了少于 20% 的 web 数据。** Common Crawl 通常包含 30-40% 的重复内容。如果你的 dedup 步骤移除了少于 20%，说明你的 MinHash 参数过于保守，或者阈值过高。检查：shingle size k、hash 函数数量、LSH bands 数量、Jaccard 阈值。

**压缩率低于 2.0 chars/token。** 这意味着你的 Tokenizer 拆分得过于激进。要么用更多 merge 重新训练，要么增加词表大小，要么检查 pre-tokenization 是否不必要地碎片化了文本。

**压缩率高于 6.0 chars/token。** 你的 Tokenizer 学到了非常领域特定的 merge，可能无法泛化。对于领域特定模型这没问题，但对通用模型来说是一个警告信号。

**序列利用率低于 90%。** padding 过多。要么你的文档非常短（过滤它们或提高最小文档长度），要么你的 sequence packing 效率不高（从朴素 padding 切换到 multi-document packing）。

**词表利用率低于 50%。** 该语料中超过一半的词表没有被使用。要么词表对你的领域来说太大，要么 Tokenizer 是在非常不同的数据上训练的。

## Quality Filter 校准

在每个 pipeline 阶段，对 1,000 个文档的随机样本运行这些检查：

1. **清洗后读取 20 个随机文档。** 它们是否包含残留 HTML、JavaScript、导航文本或 boilerplate？如果是，说明你的 HTML stripping 不完整。

2. **读取 20 个通过 quality filter 的随机文档。** 其中是否有 spam、keyword lists 或机器生成内容？如果有，收紧过滤阈值。

3. **读取 20 个未通过 quality filter 的随机文档。** 其中是否有真正优质的内容？如果有，说明你的 filter 过于激进。放宽阈值，或为特定模式添加例外。

4. **从 dedup 中读取 20 对随机 near-duplicate。** 它们实际相似吗？如果不相似，降低 Jaccard 阈值或增加 hash 函数数量。

## 数据混合比例

没有通用公式。先从这些基线开始，再根据评估结果调整：

| Category | Llama 3 Ratio | Starting Point |
|----------|--------------|----------------|
| Web text | 50% | 50% |
| Code | 25% | 15-25% |
| Books/academic | 13% | 10-15% |
| Math | 8% | 5-10% |
| Multilingual web | 4% | 5-10% |

如果模型需要擅长编程，提高 code 比例。如果 reasoning 很重要，提高 math 比例。如果你需要更少噪声，降低 web 比例。修改比例后始终在 benchmark 上评估。

## 扩展估算

对于给定的目标 Token 数：

- 来自 web 的 1T Token：预计需要约 3-5TB 原始文本，清洗和 dedup 后约 1.5-2TB
- Tokenization 速度（Rust）：每个 core 约 100M Token/秒
- Tokenization 速度（Python）：每个 core 约 1-10M Token/秒
- MinHash dedup，128 hashes、16 bands：每个 core 约 10K 文档/秒
- Sequence packing：受 I/O 限制，对于 10GB 以上的语料使用 memory-mapped files

对于 15T Token（Llama 3 规模），规划约 30-50TB 原始输入数据、在 64-core 机器上 1-2 周的预处理，以及 100TB+ 磁盘用于中间文件。

## 训练前 Checklist

1. 总 Token 数与你的 compute budget 匹配（使用 Chinchilla scaling 或 Llama 3 overtrain ratio 作为参考）
2. Dedup 移除了 30-40% 的 web 数据
3. Quality filter 移除了剩余数据的 10-20%
4. 英文压缩率为 3-5 chars/token
5. 序列利用率高于 95%
6. 随机抽查显示每个 pipeline 阶段的文本都是干净、连贯的
7. 数据混合比例已通过小规模训练运行验证
8. PII 移除已在样本上验证
9. 所有二进制格式（packed sequences、Token ID arrays）都通过 round-trip encoding/decoding 测试
10. Pipeline 可复现：在固定 random seeds 下，相同输入会产生相同输出
