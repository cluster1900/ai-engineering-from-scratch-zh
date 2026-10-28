---
id: rag
title: Retrieval-Augmented Generation (RAG)
code: RA
subtitle: 分块、索引、检索、融合、重排、带引用生成，并对每一阶段打分。来自课文的 Python。
hue: 100
sources: phases/11-llm-engineering/06-rag, phases/11-llm-engineering/07-advanced-rag, phases/05-nlp-foundations-to-advanced/13-question-answering, phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag, phases/19-capstone-projects/64-chunking-strategies-advanced, phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense, phases/19-capstone-projects/66-reranker-cross-encoder, phases/19-capstone-projects/67-query-rewriting-hyde, phases/19-capstone-projects/68-rag-eval-precision-recall, phases/19-capstone-projects/69-end-to-end-rag-system
source_hash: daba05d015cad49c
---

## 端到端 RAG 流水线
type: architecture
from: phases/19-capstone-projects/69-end-to-end-rag-system/docs/en.md, phases/19-capstone-projects/69-end-to-end-rag-system/code/main.py

```arch
node | docs | 1,1 | Documents | offline indexing
node | chunk | 2,1 | Chunker | recursive split
node | index | 3,1 | HybridIndex | BM25 + dense
node | gen | 4,1 | Generator | cited answer or refuse
node | query | 1,2 | User query |
node | rewrite | 2,2 | Rewriter | HyDE, multi-query, decompose
node | retr | 3,2 | Retriever | RRF, top_n 12
node | rerank | 4,2 | Reranker | cross-encoder, top_k 5
edge | docs | chunk |
edge | chunk | index | chunks
edge | query | rewrite |
edge | rewrite | retr | rewrites
edge | index | retr | search
edge | retr | rerank | top_n
edge | rerank | gen | top_k
```

## 一次查询：Pipeline.query
type: flow
from: phases/19-capstone-projects/69-end-to-end-rag-system/code/main.py, phases/19-capstone-projects/69-end-to-end-rag-system/docs/en.md

1. **Rewriter**：`pick_strategy` 在有 " and " 时选 decompose，对 api 或 config 选 hyde，否则 multiquery。
2. **HyDE**：BM25 搜查询。Dense 搜假设段落。
3. **Subqueries**：每一次改写单独搜索。`rrf` 融合排序列表。
4. **HybridIndex**：BM25 top 8 与 dense top 8，融合后保留 `top_n` 12。
5. **Reranker**：交叉编码器分数加上 0.3 倍查询重叠。保留 `top_k` 5。
6. **Generator**：最高分低于 `REFUSE_THRESHOLD` 时给出 "I do not know."
7. **Generator**：否则从最多 2 个块各写一句，每句带 `[doc_id:chunk_index]` 锚点。

## 代码中的任务
type: task-table
from: phases/19-capstone-projects/64-chunking-strategies-advanced/code/main.py, phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense/code/main.py, phases/19-capstone-projects/67-query-rewriting-hyde/code/main.py, phases/19-capstone-projects/68-rag-eval-precision-recall/code/main.py, phases/19-capstone-projects/69-end-to-end-rag-system/code/main.py

| 任务 | 代码 |
|---|---|
| 固定窗口分块 | `fixed_window(doc_id, text, size=400, overlap=80)` |
| 按标题分块 | `structural_markdown(doc_id, text)` |
| 给分块器打分 | `eval_recall(chunker, fixture, ks=(1, 3, 5))` |
| 融合排序列表 | `rrf(rankings, k=60, weights=[1.0, 1.0])` |
| 经改写器检索 | `retrieve_with_rewriter(query, rewriter, retriever)` |
| 重排候选 | `rerank(model, query, candidates, top_k)` |
| 分级排序分数 | `ndcg_at_k(retrieved, graded, k)` |
| 跑带门控的演示 | `python3 code/main.py` 在 FAIL 时退出码 1 |

## 用 RRF 做混合检索
type: annotated-code
lang: python
from: phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense/code/main.py

```python
retriever = HybridRetriever()                # BM25Index + DenseIndex
for d in CORPUS:
    retriever.add(d)                         # indexes both modalities
result = retriever.search(q, k_each=5, k_out=5)
result["bm25"], result["dense"], result["fused"]  # three ranked lists
bm25 = BM25Index(k1=1.5, b=0.75)             # title tokens count 3 times
idf = math.log((n - df + 0.5) / (df + 0.5) + 1.0)  # stays positive
score[doc.doc_id] += w * (1.0 / (k + rank + 1))    # rank starts at 0
```

## 组装并查询流水线
type: annotated-code
lang: python
from: phases/19-capstone-projects/69-end-to-end-rag-system/code/main.py

```python
p = Pipeline()                        # chunker, index, rewriter, reranker
p.ingest(CORPUS)                      # recursive split, target 400
p.train_reranker_on(TRAIN_TRIPLES)    # fits the small cross-encoder
result = p.query("<question>")
result.answer                         # sentences plus anchors
result.citations                      # list of doc_id:chunk_index
result.rewriter_strategy              # hyde, multiquery or decompose
result.latency_ms                     # rewrite, retrieve, rerank, generate
```

## 分块策略
type: command-table
from: phases/19-capstone-projects/64-chunking-strategies-advanced/docs/en.md, phases/19-capstone-projects/64-chunking-strategies-advanced/code/main.py, phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag/docs/en.md

| 命令 | 作用 |
|---|---|
| `recursive_split` | 没有结构的散文。最强的单一基线 |
| `structural_markdown` | Markdown、RFC 与 API 文档。按标题切断 |
| `sentence_chunks` | 长的单主题段落。目标 500 |
| `semantic_chunks` | 短的混合主题段落。阈值 0.6 |
| `fixed_window` | 仅作对照。会在代码符号中间切断 |
| Parent-document | 搜小的子块，返回父块。对父块去重 |
| Contextual retrieval | 给每个块前置 50-100 词的 LLM 上下文 |
| Late chunking | 按 token 嵌入整篇文档，再按块池化 |

## 关键公式
type: concepts
from: phases/11-llm-engineering/06-rag/docs/en.md, phases/11-llm-engineering/07-advanced-rag/docs/en.md, phases/19-capstone-projects/68-rag-eval-precision-recall/docs/en.md, phases/19-capstone-projects/68-rag-eval-precision-recall/code/main.py

- **Cosine**: $\cos(a, b) = \frac{a \cdot b}{\lVert a \rVert \, \lVert b \rVert}$，从 -1 到 1。
- **BM25 term**: $\mathrm{IDF}(t) \frac{tf \, (k_1 + 1)}{tf + k_1 (1 - b + b \, |d| / \mathrm{avgdl})}$
- **RRF**: $\mathrm{RRF}(d) = \sum_R \frac{1}{k + \mathrm{rank}_R(d)}$
- **Precision@k**: 前 k 里的金标文档，除以 k。
- **Recall@k**: 前 k 里的金标文档，除以全部金标文档。
- **MRR**: 第一个相关文档的 1 / rank 的均值。
- **DCG gain**: $\frac{2^{rel} - 1}{\log_2(i + 2)}$ 位置 $i$ 从 0 起。
- **nDCG@k**: DCG 除以理想顺序的 DCG。从 0 到 1。

## 默认值与数字
type: defaults
from: phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense/code/main.py, phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense/docs/en.md, phases/11-llm-engineering/06-rag/docs/en.md, phases/11-llm-engineering/07-advanced-rag/docs/en.md, phases/19-capstone-projects/66-reranker-cross-encoder/docs/en.md, phases/19-capstone-projects/69-end-to-end-rag-system/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| BM25 `k1` | 1.5 | 课文 11.07 代码用 1.2 |
| BM25 `b` | 0.75 | 0 忽略长度，1 完全归一化 |
| RRF `k` | 60 | 排名 1 加 1/61 |
| 块大小 | 256-512 | Token，带 50 token 重叠 |
| 每次查询的块数 | 5 to 10 | 2,500-5,000 token 的上下文 |
| 重排池 N | 50 到 200 | 交叉编码器保留 top K |
| `top_n`, `top_k` | 12 | 流水线重排后保留 5 |
| `REFUSE_THRESHOLD` | 0.05 | 低于它答案是 "I do not know." |

## 排障
type: troubleshooting
from: phases/19-capstone-projects/68-rag-eval-precision-recall/docs/en.md, phases/11-llm-engineering/07-advanced-rag/docs/en.md, phases/19-capstone-projects/66-reranker-cross-encoder/docs/en.md, phases/19-capstone-projects/67-query-rewriting-hyde/docs/en.md, phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| recall@k 与 precision@k 低 | 块切掉了答案，或检索器漏了它 | 修好边界或加一种模态 |
| recall@k 好，MRR 低 | 正确块不在位置 1 | 加交叉编码器重排 |
| MRR 高，忠实度低 | 生成器编造内容 | 在 prompt 里强制引用或拒绝 |
| 忠实度高，相关性低 | 有依据但跑题 | 改写查询 |
| 精确代码 `E-4021` 漏掉 | 嵌入把它当噪声 | 加 BM25 并用 RRF 融合 |
| 重排没有提升 | N 等于 K | 把 N 设成至少 3 倍 K |
| HyDE 丢掉正确文档 | 段落里编造了标识符 | 限制长度，降低 BM25 权重 |
| 40 token 碎片 | 语义分块没有下限 | 强制 `min_tokens` |

## 缩写
type: glossary
from: phases/11-llm-engineering/06-rag/docs/en.md, phases/11-llm-engineering/07-advanced-rag/docs/en.md, phases/19-capstone-projects/66-reranker-cross-encoder/docs/en.md, phases/19-capstone-projects/68-rag-eval-precision-recall/docs/en.md

- **RAG**：Retrieval-Augmented Generation。检索，放进 prompt，生成。
- **BM25**：Best Matching 25。带 IDF 与长度归一化的关键词排序。
- **RRF**：Reciprocal Rank Fusion。对排序列表求和 1/(k + rank)。
- **HyDE**：Hypothetical Document Embeddings。用假答案去搜索。
- **MRR**：Mean Reciprocal Rank。第一次命中的 1/rank 的均值。
- **nDCG**：Normalized Discounted Cumulative Gain。分级排序质量。
- **Qrels**：金标标签。带金标文档与答案的查询。
- **Bi / cross-encoder**：分别嵌入查询与文档，或一起读它们。

## 问题
type: qa
from: phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense/docs/en.md, phases/11-llm-engineering/07-advanced-rag/docs/en.md, phases/19-capstone-projects/68-rag-eval-precision-recall/docs/en.md, phases/19-capstone-projects/67-query-rewriting-hyde/docs/en.md, phases/11-llm-engineering/06-rag/docs/en.md

- **为什么用 RRF，而不是分数混合？** BM25 分数无界。排名可以跨模态比较。
- **为什么只重排 top N？** 交叉编码器比双编码器慢 100-1000 倍。
- **为什么引用 recall@k？** 生成器可以丢掉坏块。它用不了从未见过的块。
- **错误的 HyDE 答案为什么有用？** 检索器用它的词，不是它的事实。
- **RAG 还是微调？** 事实用 RAG。风格、语气或推理模式用微调。

## 提示
type: tips
from: phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag/docs/en.md, phases/05-nlp-foundations-to-advanced/13-question-answering/docs/en.md, phases/19-capstone-projects/66-reranker-cross-encoder/docs/en.md, phases/19-capstone-projects/68-rag-eval-precision-recall/docs/en.md

- 从递归 512 token 开始。在 50 条查询的评估集上量 recall@5。
- 告诉模型只用上下文，并说 "I don't know."
- 把双编码器、交叉编码器与 N 钉在一起。
- 用与生成器不同的模型族来评判。
- 按查询类别切分 qrels：字面、改写、多主题。
- 分层评估：CI 里 20 条查询，每晚 200，每周 2000。
