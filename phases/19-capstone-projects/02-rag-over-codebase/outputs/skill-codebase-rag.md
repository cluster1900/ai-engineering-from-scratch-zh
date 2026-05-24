---
name: codebase-rag
description: 构建一个跨 repo 语义搜索系统，具备 AST-aware chunking、hybrid retrieval、增量 re-index，以及带 citation 的答案。
version: 1.0.0
phase: 19
lesson: 02
tags: [capstone, rag, code-search, tree-sitter, qdrant, bm25, hybrid-retrieval]
---

给定 10+ 个 repositories，总计至少 2M 行代码，构建一个 ingestion pipeline、一个 hybrid index，以及一个强制 citation 的 query agent，用可验证的 file:line anchor 回答跨 repo 问题。

构建计划：

1. 使用 tree-sitter 解析每个文件。在 function 和 class node 边界处进行 chunk。存储 `{repo, path, start_line, end_line, symbol, body}`。
2. 使用 Claude Haiku 4.5 或 Gemini 2.5 Flash，并配合 prompt-cached system prompts，为每个 chunk 生成摘要。将一句话摘要存储在 chunk 旁边。
3. Index 到三种结构中：Qdrant（dense，Voyage-code-3 或 nomic-embed-code）、Tantivy（带 field weights 的 BM25），以及 kuzu（用于 imports、calls、inheritance 的 symbol graph edges）。
4. 构建一个 LangGraph query agent，包含三个 nodes：retrieve（dense 并行 BM25）、rerank（Cohere rerank-3 或 bge-reranker-v2-gemma-2b）、synth（Claude Sonnet 4.7，带 prompt caching 和 file:line citation 要求）。
5. 后置过滤：拒绝任何没有可验证 `(repo/path:start-end)` anchor 的 claim；重新询问或丢弃。
6. 接入一个 git push webhook，计算 symbol-level diff，并且只对变更的 chunks 重新生成 Embedding。目标：在 2M-LOC 代码集上，50-file commit 在 60s 内可被搜索。
7. 使用一个 100-question held-out set 进行评估。报告 MRR@10、nDCG@10、citation faithfulness，以及 latency percentiles。
8. 运行一个 weekly drift job，重新执行 eval，并在 MRR@10 下降 > 5% 时告警。

评估 rubric：

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | Retrieval quality | 在 100-question held-out set 上的 MRR@10 和 nDCG@10 |
| 20 | Citation faithfulness | answer claims 中带有可验证 file:line anchors 的比例 |
| 20 | Latency and scale | 在已 index corpus size 上，10k QPS 下的 p95 query latency |
| 20 | Incremental indexing correctness | 从 git push 到 50-file commit 可搜索所需的时间 |
| 15 | UX and answer formatting | Citation clickability、snippet previews、follow-up affordance |

硬性拒绝项：

- 使用固定大小的 token chunking，而不是 AST-aware chunking。这会污染 generated-code-heavy corpora。
- 只有 cosine retrieval，没有 BM25 或 rerank。已知会在 exact-symbol-name queries 上失败。
- 答案缺少强制性的 file:line citations。
- 每次 git push 都对 full-corpus 重新生成 Embedding；必须是增量式的。

拒绝规则：

- 在未阅读 repos license 的情况下，拒绝 index 这些 repos。有些 license 禁止在 third-party Vector stores 中做 Embedding。
- 拒绝回答声称引用了 index 从未见过的文件的 queries；返回前必须始终验证 anchor。
- p95 超过 4s 时拒绝提供 answer；改为返回 partial result 和 follow-up handle。

输出：一个 repo，包含 ingestion pipeline、LangGraph query agent、100-question labeled eval set、Langfuse dashboard link，以及一份 write-up，说明你修复的三种 retrieval failure modes（generated-code poisoning、long-tail symbol recall、cross-repo symbol resolution）以及修复每一种的 exact change。
