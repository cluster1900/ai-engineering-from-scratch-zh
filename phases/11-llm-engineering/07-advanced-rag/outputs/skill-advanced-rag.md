---
name: skill-advanced-rag
description: 使用 hybrid search、reranking 和 evaluation 构建生产级 RAG
version: 1.0.0
phase: 11
lesson: 7
tags: [rag, hybrid-search, bm25, reranking, hyde, evaluation]
---

# 高级 RAG 模式

基础 RAG：embed query -> vector search -> top-k -> generate。
高级 RAG：embed query + BM25 -> fuse ranks -> rerank -> top-k -> generate。

```
query -> [vector search (top-50)] -+-> RRF fusion -> reranker (top-5) -> prompt -> LLM
                                   |
query -> [BM25 search (top-50)]  --+
```

## 什么时候从基础 RAG 升级

- 检索质量低于 70% Recall@5
- 用户反馈答案错误或无关
- Corpus 增长到超过 100K chunks
- Queries 使用的词汇与 documents 不同
- Multi-hop questions 持续失败

## 实现检查清单

1. 在 vector index 旁边添加 BM25 index
2. 并行运行两种搜索（各自 top-50）
3. 使用 Reciprocal Rank Fusion（k=60）合并
4. 使用 cross-encoder 对 top candidates rerank
5. 取 top-5 用于最终 prompt
6. 在 test set 上添加忠实性评估

## 技术选择指南

- **Hybrid search**：生产环境中始终使用。查询时没有额外成本。
- **Reranking**：当 Recall@50 良好但 Recall@5 较差时使用。增加 50-200ms latency。
- **HyDE**：当 queries 模糊或使用了与 docs 不同的词汇时使用。增加一次 LLM call。
- **Parent-child chunks**：当 small chunks 缺少上下文但 large chunks 稀释相关性时使用。
- **Metadata filtering**：当 corpus 有清晰类别（date、source type、department）时使用。
- **Query decomposition**：用于需要来自多个 docs 的信息的 multi-hop questions。

## 常见错误

- 用不同 chunk sets 运行 BM25 和 vector search（它们必须搜索同一个 corpus）
- 为 reranking 使用过小的 candidate pool（top-10 太少；使用 top-50）
- 对每个 query 都添加 HyDE（只有当词汇不匹配是瓶颈时才有帮助）
- 不评估变更（在每种技术前后测量 Recall@k）
- 在测量失败位置之前过度设计 pipeline

## 评估工作流

1. 创建 50+ 个带已知 answer chunks 的测试问题
2. 针对每种检索方法测量 Recall@5 和 Recall@10
3. 对检索成功的 queries，测量生成答案的忠实性
4. 随着 corpus 增长，每周跟踪 metrics
5. 在添加更多技术之前，先调查单个失败案例
