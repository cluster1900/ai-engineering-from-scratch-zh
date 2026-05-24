---
name: skill-rag-pipeline
description: 从第一性原理构建和调试 RAG pipelines
version: 1.0.0
phase: 11
lesson: 6
tags: [rag, retrieval, embeddings, vector-search, llm-engineering]
---

# RAG Pipeline 模式

每个 RAG 系统都遵循这个模式：

```
documents -> chunk -> embed -> store
query -> embed -> search(top_k) -> build_prompt -> generate
```

索引会针对每个文档执行一次。查询会在每次用户请求时执行。

## 什么时候使用 RAG

- LLM 需要访问私有文档或近期文档
- Fine-tuning 成本太高，或更新速度太慢
- 你需要为答案引用来源
- 知识库经常变化

## 什么时候不要使用 RAG

- 答案是 LLM 已经具备的通用知识
- 任务是创造性的（写作、头脑风暴），而不是事实性的
- 你需要模型采用特定的推理风格（使用 fine-tuning）

## 实现 checklist

1. 将文档切分为 256-512 个 Token 的片段，并设置 50 个 Token 的 overlap
2. 使用一致的 Embedding model 为每个 chunk 生成 Embedding
3. 将 Embeddings 与原始文本一起存储在 Vector database 中
4. 在查询时，使用同一个 model 为用户的问题生成 Embedding
5. 通过 cosine similarity 取回最相似的 top-k（5-10）个 chunks
6. 构建 prompt：system instruction + retrieved context + user question
7. 生成答案，并将其 grounding 到 retrieved context 中
8. 返回带有来源引用的答案

## 常见错误

- 索引和查询使用不同的 Embedding models（Vectors 不兼容）
- Chunks 太小（丢失上下文）或太大（稀释相关性）
- Chunks 之间没有包含 overlap（会在边界处切断句子）
- 文档变化后忘记重新索引
- 不生成连贯答案，直接把 retrieved chunks 返回给用户
- 对事实性 RAG 查询没有设置 temperature=0（更高 temperature = 更多 hallucination）

## 调试 retrieval

如果没有取回正确的 chunks：
1. 打印 query embedding，并确认它不是全零
2. 针对一个已知相关的 chunk，手动检查 cosine similarities
3. 尝试改写 query，使其匹配文档词汇
4. 确认索引和查询时使用的 Embedding model 一致
5. 检查相关内容是否在 chunking 过程中丢失

## 生产环境参数

- Chunk size: 256-512 tokens
- Overlap: 50 tokens（chunk size 的 10-20%）
- Top-k: 大多数 use cases 使用 5-10
- Temperature: 事实性答案使用 0
- Embedding model: text-embedding-3-small（成本效益高）或 text-embedding-3-large（准确率更高）
