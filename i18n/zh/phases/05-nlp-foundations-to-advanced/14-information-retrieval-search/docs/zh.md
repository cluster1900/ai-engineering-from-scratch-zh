# 获取信息和搜索

> 混合物是2026年默认选择,其它都是调整.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 分钟

## 问题

用户输入"如果有人说谎,会怎么办?"期望找到真正覆盖该情形的法条:"第420条.

它们是每个RAG系统,每个搜索,每个文档站点模糊的搜索,下层的管道.

本课程将构建每个部分,并说明每个部分抓住哪些失败.

## 概念

![Hybrid retrieval: BM25 + dense + RRF + cross-encoder rerank](../assets/retrieval.svg)

按需选择的四层.

1. **Sparse retrieval (BM25)。**快,对精确匹配很精确,但对语义很差.运行在反向索引上. 在数百万文档中,每次查询时间低于10ms.
2. **Dense retrieval。**将查询和文件编码为向量. 邻居查找. 捕捉句子和语义相似性.
3. **Fusion。**合并稀少和密集的排名列表――相互排名融合 (RRF) 是简单的默认选择,因为它忽略了原始分数,它们处于不同尺度上,只使用排名位置――当你知道某个信号在你的域中占主导地位时,你可以选择权重的融合――
4. **Cross-encoder rerank。**从融合结果中取30个顶部――运行跨编码器――查询+文档 一起输入,对每对打分) ─保留前五个顶部――跨编码器比双编码器 每对更慢,但确实得多――你只通过在前30个上运行它们来摊薄成本――

三路检索 (BM25 +密集+学习空间,如SPLADE) 在2026年基准中优于两路方法,但需要学习空间指数的基础设施.


```figure
gx-hybrid-retrieval
```

## 构建它

### 步骤1:从零实现BM25

```python
import math
import re
from collections import Counter

TOKEN_RE = re.compile(r"[a-z0-9]+")


def tokenize(text):
    return TOKEN_RE.findall(text.lower())


class BM25:
    def __init__(self, corpus, k1=1.5, b=0.75):
        if not corpus:
            raise ValueError("corpus must not be empty")
        self.corpus = [tokenize(d) for d in corpus]
        self.k1 = k1
        self.b = b
        self.n_docs = len(self.corpus)
        self.avg_dl = sum(len(d) for d in self.corpus) / self.n_docs
        self.df = Counter()
        for doc in self.corpus:
            for term in set(doc):
                self.df[term] += 1

    def idf(self, term):
        n = self.df.get(term, 0)
        return math.log(1 + (self.n_docs - n + 0.5) / (n + 0.5))

    def score(self, query, doc_idx):
        q_tokens = tokenize(query)
        doc = self.corpus[doc_idx]
        dl = len(doc)
        freq = Counter(doc)
        score = 0.0
        for term in q_tokens:
            f = freq.get(term, 0)
            if f == 0:
                continue
            numerator = f * (self.k1 + 1)
            denominator = f + self.k1 * (1 - self.b + self.b * dl / self.avg_dl)
            score += self.idf(term) * numerator / denominator
        return score

    def rank(self, query, top_k=10):
        scored = [(self.score(query, i), i) for i in range(self.n_docs)]
        scored.sort(reverse=True)
        return scored[:top_k]
```

两个参数值得了解.`k1=1.5`控制术语频率和;值越高,术语重复权越大──`b=0.75`控制长度正常化;0 表示忽略文档长度,1 表示完全正常化──这些默认值来自原始论文中罗伯逊的建议,很少需要调整──

### 步骤2:使用双码码做密集检索

```python
from sentence_transformers import SentenceTransformer
import numpy as np


def build_dense_index(corpus, model_id="sentence-transformers/all-MiniLM-L6-v2"):
    encoder = SentenceTransformer(model_id)
    embeddings = encoder.encode(corpus, normalize_embeddings=True)
    return encoder, embeddings


def dense_search(encoder, embeddings, query, top_k=10):
    q_emb = encoder.encode([query], normalize_embeddings=True)
    sims = (embeddings @ q_emb.T).flatten()
    order = np.argsort(-sims)[:top_k]
    return [(float(sims[i]), int(i)) for i in order]
```

对于嵌入做L2正常化,使点产品等于宇宙.`all-MiniLM-L6-v2`是384dim,速度快,对大多数英文检索来说足够强――多语言任务使用`paraphrase-multilingual-MiniLM-L12-v2`△若追求最高准确率,使用`bge-large-en-v1.5`或`e5-large-v2`,我知道.

### 步骤3:相互级别融合

```python
def reciprocal_rank_fusion(rankings, k=60):
    scores = {}
    for ranking in rankings:
        for rank, (_, doc_idx) in enumerate(ranking):
            scores[doc_idx] = scores.get(doc_idx, 0.0) + 1.0 / (k + rank + 1)
    fused = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [(score, doc_idx) for doc_idx, score in fused]
```

`k=60`常量来自原始的RRF论文.`k`会削弱等级差异的贡献;更低的`k`让排名占主导地位.60是论文默认值,很少需要调整.

### 步骤4:混合搜索+重排

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


def hybrid_search(query, bm25, encoder, dense_embeddings, corpus, top_k=5, pool_size=30, reranker=reranker):
    sparse_ranking = bm25.rank(query, top_k=pool_size)
    dense_ranking = dense_search(encoder, dense_embeddings, query, top_k=pool_size)
    fused = reciprocal_rank_fusion([sparse_ranking, dense_ranking])[:pool_size]

    pairs = [(query, corpus[doc_idx]) for _, doc_idx in fused]
    scores = reranker.predict(pairs)
    reranked = sorted(zip(scores, [doc_idx for _, doc_idx in fused]), reverse=True)
    return reranked[:top_k]
```

三个阶段组合在一起――BM25 找词汇匹配――Dense 找语义匹配――RRF 合并两种排名,不需要分数校准――Cross-encoder 使用查询文档对一起对前-30重新打分,从而捕捉双编码的细粒度相关性――保留前-5――

### 步骤5:评估

| Metric | 含义 |
|--------|---------|
| Recall@k | 在正确 document 存在的 queries 中，它出现在 top-k 中的频率是多少？ |
| MRR (Mean Reciprocal Rank) | 第一个 relevant document 的 1/rank 的平均值。 |
| nDCG@k | 考虑 relevance 的等级差异，而不仅是 binary relevant/not。 |

对于RAG来说,救器的**Recall@k**是最重要的数字. 如果正确的段落不存在,读者就无法回答.

调试提示:对于失败的查询,差异稀少和密集排名. 如果其中一个发现正确的文档,而另一个没有,那么你遇到了词汇不匹配 (修复:补上缺失一半) 或语义模糊性 (修复:更好的嵌入或重排)

## 使用它

2026 年的堆:

| Scale | Stack |
|-------|-------|
| 1k-100k docs | In-memory BM25 + `all-MiniLM-L6-v2` embeddings + RRF。不需要单独 DB。 |
| 100k-10M docs | dense 使用 FAISS 或 pgvector + BM25 使用 Elasticsearch / OpenSearch。并行运行。 |
| 10M+ docs | Qdrant / Weaviate / Vespa / Milvus，带 hybrid support。在 top-30 上做 cross-encoder rerank。 |
| Best-quality frontier | 三路（BM25 + dense + SPLADE）+ ColBERT late-interaction reranking |

无论你选择什么,都必须为评估预留预算――先进行基准检索回忆,再进行基准结尾到结尾的RAG准确性――读者无法修复检索器 漏掉的内容――

### 2026年生产RAG 中来之难经验

- **80% 的 RAG 失败可追溯到 ingestion 和 chunking，而不是 model。**团队花几周时间替换LLM,调整提示,而检索每三次查询就回错误的背景――先修复分量――
- **Chunking strategy 比 chunk size 更重要。**对于技术文档和产品手册,语义或基于LLM的分类值得投入.
- **Parent-doc pattern。**检索小的"孩子"块以获得精确性. 很多孩子出现在同一父母部分,换入父母区块以保留背景.
- **k_rerank=3 通常是最优。**超过这个数量的每个额外的部分都会增加代币成本和生成延迟,但不会提高答案质量.
- **HyDE / query expansion。**从查询生成一个假设答案,对它做嵌入,再检索――它能弥补短问题与长文档之间的句子差距――无需培训即可免费提升精度――
- **Context budget 低于 8K tokens。**如果在这个上限上持续命中,说明重排门太宽松.
- **Version everything。**基于忠诚度,文本精确性和未回答问题的率的CI门会在用户看到回归前阻止它们――
- **三路 retrieval（BM25 + dense + learned-sparse，如 SPLADE）优于两路方法**基础设施支持SPLADE指数 时就上线了.

根据2026年行业测量,合理的检索设计可将幻觉降低70-90%.

## 交付它

保存为`outputs/skill-retrieval-picker.md`其他:

```markdown
---
name: retrieval-picker
description: 为给定 corpus 和 query pattern 选择 retrieval stack。
version: 1.0.0
phase: 5
lesson: 14
tags: [nlp, retrieval, rag, search]
---

给定 requirements（corpus size、query pattern、latency budget、quality bar、infra constraints），输出：

1. Stack。BM25 only、dense only、hybrid (BM25 + dense + RRF)、hybrid + cross-encoder rerank，或三路 (BM25 + dense + learned-sparse)。
2. Dense encoder。命名具体 model。匹配 language(s)、domain 和 context length。
3. Reranker。如果使用，命名具体 cross-encoder model。标明 rerank 会在 top-30 上额外增加 30-100ms latency。
4. Evaluation plan。Recall@10 是主要 retriever metric。MRR 用于 multi-answer。先建立 baseline，再用 incremental improvements 与它对比。

除非用户有证据证明 dense 能处理 exact matches，否则拒绝为包含 named entities、error codes 或 product SKUs 的 corpora 推荐 dense-only。对于 final top-5 决定用户答案的 high-stakes retrieval（legal、medical），拒绝跳过 reranking。
```

## 练习

1. **Easy.**在一个500份文件中实现了上面的`hybrid_search`测试 20个问题――比较BM25-只、密度-只 和混合物 在 5 上的回忆――
2. **Medium.**添加MRR计算──对于每个已知正确文档的测试查询,查找正确文档在BM25、密度和混合排名中的排名──报告每种方法的MRR──
3. **Hard.**使用多个负面排名损失 (Sentence Transformers) 在你的域名上细调一密集编码器──从500个查询文档对构建训练集──比较细调前后的回忆──

## 关键术语
| Term | 人们通常怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| BM25 | Keyword search | Okapi BM25。按 term frequency、IDF 和 length 为 documents 打分。 |
| Dense retrieval | Vector search | 将 query + doc 编码为 vectors，寻找 nearest neighbors。 |
| Bi-encoder | Embedding model | 独立编码 query 和 doc。query time 很快。 |
| Cross-encoder | Reranker model | 将 query + doc 一起编码。慢但准确。 |
| RRF | Rank fusion | 通过求和 `1/(k + rank)` 合并两个 rankings。 |
| Recall@k | Retrieval metric | relevant doc 位于 top-k 中的 queries 占比。 |

## 延伸阅读
- [Robertson and Zaragoza (2009). The Probabilistic Relevance Framework: BM25 and Beyond](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf) BM25 的权威论述──
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906)            
- [Formal et al. (2021). SPLADE: Sparse Lexical and Expansion Model](https://arxiv.org/abs/2107.05720)弥合与密集差距的学习空间回收器.
- [Cormack, Clarke, Büttcher (2009). Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) 论文:
- [Khattab and Zaharia (2020). ColBERT: Efficient and Effective Passage Search](https://arxiv.org/abs/2004.12832) 晚间互动检索
