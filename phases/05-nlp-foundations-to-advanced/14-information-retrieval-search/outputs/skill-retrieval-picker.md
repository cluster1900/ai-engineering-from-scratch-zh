---
name: retrieval-picker
description: 为给定语料库和查询模式选择 retrieval stack。
version: 1.0.0
phase: 5
lesson: 14
tags: [nlp, retrieval, rag, search]
---

给定需求（语料库大小、查询模式、延迟预算、质量标准、基础设施约束），输出：

1. Stack。仅 BM25、仅 dense、hybrid（BM25 + dense + RRF）、hybrid + cross-encoder rerank，或 three-way（BM25 + dense + learned-sparse）。
2. Dense encoder。写出具体模型（`all-MiniLM-L6-v2`、`bge-large-en-v1.5`、`e5-large-v2`、`paraphrase-multilingual-MiniLM-L12-v2`）。匹配语言、领域和上下文长度。
3. Reranker。如果使用，写出 cross-encoder 模型（`cross-encoder/ms-marco-MiniLM-L-6-v2`、`BAAI/bge-reranker-large`）。标记在 top-30 上约增加 ~30-100ms 延迟。
4. 评估计划。Recall@10 是主要 retriever metric。多答案场景使用 MRR。先建立 baseline，再相对它衡量增量改进。

对于包含 named entities、error codes 或 product SKUs 的语料库，除非用户有证据表明 dense 能处理 exact matches，否则拒绝推荐 dense-only。对于高风险 retrieval（法律、医疗），如果最终 top-5 决定用户答案，则拒绝跳过 reranking。
