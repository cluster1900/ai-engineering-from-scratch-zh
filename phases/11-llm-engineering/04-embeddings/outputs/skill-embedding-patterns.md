---
name: skill-embedding-patterns
description: Embedding、Vector search 和相似度的生产环境模式
version: 1.0.0
phase: 11
lesson: 4
tags: [embeddings, vectors, similarity, search, chunking, quantization]
---

# Embedding 模式

每个 Embedding 工作流都遵循这个契约：

```
text -> embed(text) -> vector (float array)
similarity(vector_a, vector_b) -> score (float)
```

Embedding 模型和相似度度量是唯二重要的决策。其他一切都是管道工作。

## 何时使用 Embeddings

- 跨文档的语义搜索（查找含义，而不是关键词）
- 对相似项进行 Clustering（支持工单、产品评论、bug 报告）
- 通过最近邻进行 Classification（根据与已标注样本的相似度为新项目打标签）
- 推荐系统（查找与用户喜欢的内容相似的项目）
- 去重（使用相似度阈值查找近重复内容）

## 何时不要使用 Embeddings

- 精确关键词匹配（使用全文搜索）
- 结构化查询（使用 SQL、过滤器）
- 手动标注更快的小数据集（<100 个项目）
- 可解释性比准确率更重要的任务（Embeddings 是不透明的）

## 模型选择

根据你的约束来选择：

- **需要 API、最佳性价比**：OpenAI text-embedding-3-small（1536d，$0.02/1M tokens）
- **需要最高准确率**：Voyage-3（1024d，$0.06/1M tokens，最高 MTEB）
- **需要本地/私有**：BGE-M3（1024d，免费，多语言，推荐 GPU）
- **需要快速本地原型**：all-MiniLM-L6-v2（384d，免费，可在 CPU 上运行）
- **需要多语言**：Cohere embed-v3（1024d）或 BGE-M3（两者都有很强的多语言能力）

规则：永远不要在索引和查询之间混用 Embedding 模型。来自不同模型的 Vectors 位于不兼容的空间中。

## 分块规则

1. 目标是每个 chunk 256-512 tokens，并有 50-token 重叠
2. 如果可以避免，绝不要在句子中间切分
3. 每个 chunk 都包含 metadata（源文件、章节标题、位置）
4. 对于结构化文档（Markdown、HTML），优先在标题边界处分割
5. 通过搜索已知答案并检查检索结果来测试 chunk 质量

## 相似度度量选择

- **Cosine similarity**：默认选择，处理变长文本，已归一化
- **Dot product**：当 Vectors 已经单位归一化时使用（OpenAI 模型是这样），速度略快
- **Euclidean distance**：用于 Clustering，当绝对位置很重要时使用

当 Vectors 已归一化时，三者会给出相同的排序。这个选择只对未归一化的 Vectors 有影响。

## 存储优化

三层可叠加的压缩：

1. **Matryoshka truncation**：降低维度（1536 -> 256 = 节省 6x，准确率损失 3-5%）
2. **Float16 quantization**：每个维度的存储减半（节省 2x，准确率损失 <1%）
3. **Binary quantization**：每个维度 1 bit（节省 32x，准确率损失 5-10%，配合 rescoring 使用）

生产环境模式：在完整语料库上进行 binary search，然后用 float32 Vectors 对 top-1000 重新评分。

## 先检索再重排

获得最佳准确率的两阶段 pipeline：

1. Bi-encoder 检索 top-100 候选项（快，使用预计算的 Embeddings）
2. Cross-encoder 重排到 top-10（慢，处理每个 query-doc 对）

在 precision 指标上，这比单阶段检索高 10-15%。当准确率比延迟更重要时使用。

## 常见错误

- 为索引和查询使用不同的 Embedding 模型
- 对整个文档而不是 chunks 做 Embedding（Embedding 会变成所有内容的平均）
- 在 cosine similarity 之前没有归一化 Vectors（大多数模型会预归一化，但要验证）
- 忽略 chunk 重叠（在边界处切分的句子会丢失上下文）
- 只存储 Vectors 而不存储原始文本（检索需要两者）
- 模型变更时没有重新做 Embedding（旧 Vectors 不兼容）
- 只基于准确率选择维度（存储和延迟会随维度线性增长）

## 调试 Embeddings

如果搜索结果很差：

1. 验证 query Embedding 非零（空输入或空白输入会产生零 Vectors）
2. 手动检查一个已知相关文档的相似度分数
3. 尝试改写 query，使其匹配文档词汇
4. 检查 chunk 边界，确保相关内容没有被切分到多个 chunks 中
5. 比较不同度量（cosine、dot、euclidean）的 top-k 结果，以发现归一化问题
6. 用一个显然匹配的 query 做测试（从文档中复制一句话），确认 pipeline 正常工作

## 生产环境参数

- Chunk size：256-512 tokens
- Chunk overlap：50 tokens（chunk size 的 10-20%）
- Top-k retrieval：直接使用时 5-10，reranking 时 50-100
- Similarity threshold：cosine 为 0.7+（低于此值，结果通常不相关）
- Batch embedding：每次 API 调用处理 100-500 个文本以提高吞吐量
- Index rebuild：当模型变更或文档有重大更新时重新做 Embedding
