# Evidence: cheatsheets/rag.md

Abbreviations: P11 = phases/11-llm-engineering, P05 = phases/05-nlp-foundations-to-advanced, P19 = phases/19-capstone-projects, L64 = phases/19-capstone-projects/64-chunking-strategies-advanced, L65 = phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense, L66 = phases/19-capstone-projects/66-reranker-cross-encoder, L67 = phases/19-capstone-projects/67-query-rewriting-hyde, L68 = phases/19-capstone-projects/68-rag-eval-precision-recall, L69 = phases/19-capstone-projects/69-end-to-end-rag-system, d = docs/en.md, c = code/main.py.

## Architecture: 端到端 RAG 流水线 (8 nodes, 7 edges)
- Documents, source documents: L69/d:26
- Chunker recursive split: L69/d:95, L69/c:130-136
- HybridIndex BM25 + dense: L69/d:96, L69/c:212-223
- User query: L69/d:28
- Rewriter HyDE, multi-query, decompose: L69/d:97, L69/c:249-255
- Retriever RRF, top_n 12: L69/c:200, 220, 476
- Reranker cross-encoder, top_k 5: L69/d:98, L69/c:477, 515
- Generator cited answer or refuse: L69/d:57-60, 99

## Flow: 一次查询：Pipeline.query (7 steps)
1. pick_strategy " and " decompose, api/function/endpoint/config hyde, else multiquery: L69/c:250-255, 491
2. HyDE: BM25 on query, dense on hypothetical: L69/c:225-229, 501-502
3. subqueries searched alone and fused with rrf: L69/c:503-509
4. BM25 top 8 and dense top 8, fused, top_n 12: L69/c:220-223, 476, 510-511
5. cross-encoder plus overlap_weight 0.3 times overlap, top_k 5: L69/c:397-424, 477, 515
6. top score below REFUSE_THRESHOLD gives "I do not know.": L69/c:431-432, 437-440
7. first sentence of up to 2 chunks, each with [doc_id:chunk_index] anchor: L69/c:93-94, 441-454, L69/d:57-60

## 代码中的任务 (task-table, 8)
- fixed_window(doc_id, text, size=400, overlap=80): L64/c:38, 381
- structural_markdown(doc_id, text): L64/c:229
- eval_recall(chunker, fixture, ks=(1, 3, 5)): L64/c:363
- rrf(rankings, k=60, weights=...): L65/c:143-147
- retrieve_with_rewriter(query, rewriter, retriever): L67/c:321-326
- rerank(model, query, candidates, top_k): L69/c:397-398
- ndcg_at_k(retrieved, graded, k): L68/c:84
- python3 code/main.py exits 1 on a FAIL: L69/c:14, 704-717, 721

## 用 RRF 做混合检索 (annotated-code, 8 lines)
- HybridRetriever with BM25Index + DenseIndex: L65/c:166-176
- retriever.add per doc: L65/c:232-234
- retriever.search(q, k_each=5, k_out=5): L65/c:247
- result keys bm25, dense, fused: L65/c:186-190
- BM25Index k1=1.5, b=0.75, field_weights title 3: L65/c:50-53
- idf formula: L65/c:87, plus-one keeps IDF positive: L65/d:41
- score += w * (1.0 / (k + rank + 1)), enumerate from 0: L65/c:155-156

## 组装并查询流水线 (annotated-code, 8 lines)
- Pipeline() with chunker, index, rewriter, reranker: L69/c:471-477
- p.ingest(CORPUS), p.train_reranker_on(TRAIN_TRIPLES): L69/c:663-667
- Chunker target 400: L69/c:131
- p.query returns Result(answer, citations, top_k, rewriter_strategy, latency_ms): L69/c:462-467, 523-529
- latency keys rewrite, retrieve, rerank, generate: L69/c:496, 512, 517, 521

## 分块策略 (command-table, 8)
- recursive_split, prose with no structure, strongest single baseline: L64/d:115, 121
- structural_markdown, Markdown / RFC / API docs: L64/d:64, 116
- sentence_chunks, long single topic, target 500: L64/d:118
- semantic_chunks, short mixed topics, threshold 0.6: L64/d:119
- fixed_window as a control, mid-symbol cuts: L64/d:48, 101
- Parent-document, retrieve child, return parent, dedupe: P05/23-chunking-strategies-rag/d:36, 153
- Contextual retrieval, 50-100 words of context: P05/23-chunking-strategies-rag/d:40, 162
- Late chunking, token-level embed then pool: P05/23-chunking-strategies-rag/d:38

## 关键公式 (concepts, 8)
- Cosine, -1 to 1: P11/06-rag/d:92-96
- BM25 term: P11/07-advanced-rag/d:42-47
- RRF: P11/07-advanced-rag/d:55-60
- Precision@k: L68/d:47, L68/c:39-45
- Recall@k: L68/d:51, L68/c:48-52
- MRR: L68/d:57
- DCG gain (2^rel - 1) / log2(i + 2): L68/c:74-81
- nDCG@k = DCG / IDCG, range 0 to 1: L68/d:63, L68/c:84-91

## 默认值与数字 (defaults, 8)
- BM25 k1 1.5: L65/c:51, L65/d:90. Lesson 11.07 uses 1.2: P11/07-advanced-rag/d:47, 187
- b 0.75, 0 ignores length, 1 full: L65/c:52, L65/d:135
- RRF k 60, rank 1 adds 1/61: L65/c:145, L65/d:55
- chunk size 256-512 with 50-token overlap: P11/06-rag/d:128
- 5 to 10 chunks, 2,500-5,000 tokens: P11/06-rag/d:171, 173
- rerank pool N 50 to 200: L66/d:26
- top_n 12, top_k 5: L69/c:476-477
- REFUSE_THRESHOLD 0.05, REFUSE_TEXT: L69/c:431-432

## 排障 (troubleshooting, 8)
- low recall and precision, chunker or retriever: L68/d:133
- good recall, low MRR, reranker: L68/d:134
- high MRR, low faithfulness, force cite or refuse: L68/d:135
- high faithfulness, low relevance, query rewriter: L68/d:136
- E-4021 missed by embedding: P11/07-advanced-rag/d:34, BM25 exact match: P11/07-advanced-rag/d:36-38
- N = K gives zero lift, N at least 3 times K: L66/d:95
- HyDE invents identifier, cap length, weight BM25 lower: L67/d:130
- 40-token fragments, enforce min_tokens: P05/23-chunking-strategies-rag/d:190

## 缩写 (glossary, 8)
- RAG: P11/06-rag/d:410
- BM25 Best Matching 25: P11/07-advanced-rag/d:40, 516
- RRF: P11/07-advanced-rag/d:518
- HyDE: P11/07-advanced-rag/d:105
- MRR: L68/d:55, 175
- nDCG: L68/d:63
- Qrels: L68/d:179
- Bi-encoder, cross-encoder: L66/d:127-128

## 问题 (qa, 5)
- RRF vs score interpolation, BM25 unbounded: L65/d:61
- cross-encoder 100-1000x slower: P11/07-advanced-rag/d:74
- recall@k quoted, generator cannot use unseen chunk: L68/d:53
- HyDE wrong answer still helps, token distribution: L67/d:58
- RAG for facts, fine-tuning for style, tone, reasoning pattern: P11/06-rag/d:67

## 提示 (tips, 6)
- recursive 512, recall@5 on 50 queries: P05/23-chunking-strategies-rag/d:208
- answer only from context, say "I don't know": P05/13-question-answering/d:107, 112
- pin bi-encoder, cross-encoder and N: L66/d:107
- different model family for the judge: L68/d:141
- slice qrels by query class: L68/d:147
- tier 20 / 200 / 2000: L68/d:155
