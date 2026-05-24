# Capstone 02 — Codebase 上的 RAG（跨 Repo Semantic Search）

> 2026 年，每个严肃的 engineering org 都会运行一个能理解含义而不只是匹配字符串的内部 code search。Sourcegraph Amp、Cursor 的 codebase answers、Augment 的 enterprise graph、Aider 的 repomap、Pinterest 的内部 MCP，形态都一样。摄入多个 repos，用 tree-sitter 解析，对 function 和 class 级别的 chunks 做 Embedding，hybrid-search，re-rank，并用 citations 回答。本 capstone 要求你构建一个系统：能处理 10 个 repos 中的 2M 行代码，并能在每次 git push 后完成 incremental re-indexing。

**类型：** Capstone
**语言：** Python（ingestion）、TypeScript（API + UI）
**前置要求：** Phase 5（NLP foundations）、Phase 7（transformers）、Phase 11（LLM engineering）、Phase 13（tools）、Phase 17（infrastructure）
**练习到的 Phases：** P5 · P7 · P11 · P13 · P17
**时间：** 30 小时

## 问题
到 2026 年，每个 frontier coding agent 都会配备 codebase retrieval 层，因为仅靠 context windows 无法解决跨 repo 问题。Claude 的 1M-Token context 有帮助；但它并不会消除对 ranked retrieval 的需求。对 raw chunks 做朴素 cosine search，会在 generated code、monorepo duplication，以及很少被 import 的 symbols 长尾上污染结果。生产级答案是：在 AST-aware chunks 上做 hybrid（dense + BM25）search，加上 re-ranker，并由 symbol references graph 支撑。

你会通过索引一组真实 fleet 来学习这一点，而不是只索引一个 tutorial repo，并衡量 MRR@10、citation faithfulness 和 incremental freshness。failure modes 都是基础设施层面的：一个 100k-file monorepo、一次改动半数文件的 push、一个必须跨四个 repos 才能正确回答的 query。

## 概念
AST-aware ingestion pipeline 使用 tree-sitter 解析每个文件，提取 function 和 class nodes，并在 node boundaries 而不是固定 Token windows 上切 chunk。每个 chunk 会得到三种表示：dense Embedding（Voyage-code-3 或 nomic-embed-code）、sparse BM25 terms，以及一句简短的自然语言 summary。summary 增加了第三种可检索模态：用户会问 “how is X authorized”，而 summary 会提到 “authz”，即使代码里只有 `check_permission`。

Retrieval 是 hybrid 的。一个 query 会同时触发 dense 和 BM25 searches，合并 top-k，并把 union 交给 cross-encoder re-ranker（Cohere rerank-3 或 bge-reranker-v2-gemma-2b）。re-ranked list 会进入 long-context synthesizer（带 prompt caching 的 Claude Sonnet 4.7，或 self-hosted Llama 3.3 70B），并要求每个 claim 都用 file 和 line range 引用。没有 citations 的答案会被 post-filter 拒绝。

Incremental freshness 是基础设施问题。Git push 会触发 diff：哪些文件变了，哪些 symbols 变了。只有受影响的 chunks 会重新 Embedding。受影响的跨文件 symbol edges（imports、method calls）会重新计算。index 在每次 commit 时无需重新处理 2M 行代码，也能保持一致。

## 架构
```
git push --> webhook --> ingest worker (LlamaIndex Workflow)
                           |
                           v
             tree-sitter parse + AST chunk
                           |
            +--------------+----------------+
            v              v                v
          dense        BM25 index       summary (LLM)
        (Voyage / bge)  (Tantivy)        (Haiku 4.5)
            |              |                |
            +------> Qdrant / pgvector <----+
                            |
                            v
                      symbol graph (Neo4j / kuzu)
                            |
  query --> LangGraph agent (retrieve -> rerank -> synth)
                            |
                            v
                 Claude Sonnet 4.7 1M context
                            |
                            v
                 answer + file:line citations
```

## 技术栈
- Parsing：带 17 种 language grammars 的 tree-sitter（Python、TS、Rust、Go、Java、C++ 等）
- Dense embeddings：Voyage-code-3（hosted）或 nomic-embed-code-v1.5（self-host），bge-code-v1 fallback
- Sparse index：带 BM25F 的 Tantivy（Rust），对 symbol name 和 body 做 field-weighted
- Vector DB：Qdrant 1.12，支持 hybrid search；或面向 50M vectors 以下团队的 pgvector + pgvectorscale
- Chunk summary model：Claude Haiku 4.5 或 Gemini 2.5 Flash，带 prompt caching
- Re-ranker：Cohere rerank-3 或自托管 bge-reranker-v2-gemma-2b
- Orchestration：LlamaIndex Workflows 用于 ingestion，LangGraph 用于 query agent
- Synthesizer：Claude Sonnet 4.7（1M context），带 prompt caching
- Symbol graph：Neo4j（managed）或 kuzu（embedded），用于 import 和 call edges
- Observability：每个 retrieval + synthesis step 的 Langfuse spans

## 构建它
1. **Ingestion walker。** 在每个 push hook 上遍历 git history。收集 changed files。对每个文件，用 tree-sitter 解析，提取 function 和 class nodes 及其完整 source span。输出 chunk records `{repo, path, start_line, end_line, symbol, body}`。

2. **Chunk summarizer。** 将 chunks 批量打包进 Haiku 4.5 calls，并在 system preamble 上使用 prompt caching。Prompt：“用一句话总结这个 function，说明它的 public contract 和 side effects。” 将 summary 与 chunk 一起存储。

3. **Embedding pool。** 两个并行 queues：dense（Voyage-code-3 batch 128）和 summary（同一个 model，但输入 summary string）。将 vectors 写入 Qdrant，并带上 payload `{repo, path, start_line, end_line, symbol, kind}`。

4. **BM25 index。** Field-weighted Tantivy index：symbol name weight 4，symbol body weight 1，summary weight 2。它既支持 “find the function named X” 查询，也支持 “find the function that does X” 查询。

5. **Symbol graph。** 对每个 chunk 记录 edges：imports（这个文件使用来自 repo Z 的 symbol Y）、calls（这个 function 调用了 class C 上的 method M）、inheritance。存入 kuzu。在 query time 用它跨 repo boundaries 扩展 retrieval。

6. **Query agent。** 包含三个 nodes 的 LangGraph。`retrieve` 并行触发 dense + BM25，按 (repo, path, symbol) 去重。`rerank` 在 top-50 上运行 cross-encoder，并保留 top-10。`synth` 调用 Claude Sonnet 4.7，把 reranked chunks 放进 context，缓存 system prompt，并要求 file:line citations。

7. **Citation enforcement。** 解析 model output；任何没有 `(repo/path:start-end)` anchor 的 claim 都会被标记为 re-ask 或丢弃。只向用户返回带引用的答案。

8. **Incremental re-index。** 每次 webhook 时，计算 symbol-level diff。只重新 Embedding 文本发生变化的 chunks。为 imports 发生变化的 chunks 重新计算 symbol edges。衡量目标：对 2M-LOC fleet，一次 50-file push 的 re-index 在 60 秒内完成。

9. **Eval。** 标注 100 个跨 repo questions，并给出 gold file:line answers。衡量 MRR@10、nDCG@10、citation faithfulness（带可验证 anchors 的 claims 比例）以及 p50/p99 latency。

## 使用它
```
$ code-rag ask "how is S3 multipart abort wired into our retry budget?"
[retrieve]  12 chunks dense + 7 chunks bm25, 16 unique after dedup
[rerank]    top-5 kept (cohere rerank-3)
[synth]     claude-sonnet-4.7, cache hit rate 68%, 2.1s
answer:
  Multipart aborts are triggered by `AbortMultipartOnFail` in
  services/uploader/retry.go:122-148, which decrements the per-bucket
  retry budget defined in config/budgets.yaml:34-51 ...
  citations: [services/uploader/retry.go:122-148, config/budgets.yaml:34-51,
              libs/s3client/multipart.ts:44-61]
```

## 交付它
Deliverable skill `outputs/skill-codebase-rag.md`。给定一组 repos 语料，它能启动 ingestion pipeline、hybrid index 和 query agent，并为任何跨 repo 问题返回带引用的答案。Rubric：

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Retrieval quality | 在 100-question held-out set 上的 MRR@10 和 nDCG@10 |
| 20 | Citation faithfulness | answer claims 中带可验证 file:line anchors 的比例 |
| 20 | Latency and scale | 在 indexed corpus size 上 10k QPS 时的 p95 query latency |
| 20 | Incremental indexing correctness | 从 git push 到可被搜索的时间，在 50-file commit 上衡量 |
| 15 | UX and answer formatting | Citation 可点击性、snippet previews、follow-up affordance |
| **100** | | |

## 练习
1. 将 Voyage-code-3 替换为 self-hosted nomic-embed-code。衡量 MRR@10 delta。报告启用 re-ranking 后差距是否缩小。

2. 向 corpus 注入 20% generated code（LLM-produced boilerplate）并重新评估。观察 retrieval poisoning。向 payload 添加一个 “generated” flag，并降低这些 hits 的权重。

3. 在你的 corpus size 上 benchmark Qdrant hybrid search 与 pgvector + pgvectorscale。报告 batch size 1 时的 p99。

4. 添加一个 sampling-based drift check：每周重新运行 100-question eval。当 MRR@10 下降 > 5% 时告警。

5. 扩展到 cross-language symbol resolution：一个 Python function 通过 gRPC 调用 Go service。使用 symbol graph 将它们关联起来。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| AST-aware chunking | “Function-level splits” | 在 tree-sitter node boundaries 而不是固定 Token windows 上切分代码 |
| Hybrid search | “Dense + sparse” | 并行运行 BM25 和 Vector search，合并 top-k，然后 rerank |
| Cross-encoder rerank | “Second-stage rank” | 将每个 (query, candidate) pair 放在一起评分的 model，比 cosine 更准确 |
| Prompt caching | “Cached system prompt” | 2026 年 Claude / OpenAI feature，可将重复 prefix Tokens 最高折扣 90% |
| Symbol graph | “Code graph” | 跨 files 和 repos 的 imports、calls、inheritance edges |
| Citation faithfulness | “Grounded answer rate” | 用户可以通过点击 anchor 并阅读 referenced span 来验证的 claims 比例 |
| Incremental re-index | “Push-to-search time” | 从 git push 到 changed symbols 可被查询的 wall-clock 时间 |

## 延伸阅读
- [Sourcegraph Amp](https://ampcode.com) — 生产级 cross-repo code intelligence
- [Sourcegraph Cody RAG architecture](https://sourcegraph.com/blog/how-cody-understands-your-codebase) — 本 capstone 的参考 deep-dive
- [Aider repo-map](https://aider.chat/docs/repomap.html) — tree-sitter 排序的 repo 视图
- [Augment Code enterprise graph](https://www.augmentcode.com) — 商业 symbol-graph RAG
- [Qdrant hybrid search docs](https://qdrant.tech/documentation/concepts/hybrid-queries/) — reference implementation
- [Voyage AI code embeddings](https://docs.voyageai.com/docs/embeddings) — Voyage-code-3 details
- [Cohere rerank-3](https://docs.cohere.com/reference/rerank) — cross-encoder reference
- [Pinterest MCP internal search](https://medium.com/pinterest-engineering) — internal-platform 参考
