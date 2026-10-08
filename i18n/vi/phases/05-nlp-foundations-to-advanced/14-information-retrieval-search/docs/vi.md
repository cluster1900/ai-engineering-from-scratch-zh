# Tìm kiếm và tìm kiếm thông tin

> BM25 精确但脆弱──Dense 覆盖面广,但会漏掉关键词──Hybrid là lựa chọn cố định năm 2026──其他都是调──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 分钟

## 问题

Người dùng nhập vào "what happens if someone lies to get money",期望找到真正覆盖该情形的法条:"Chap 420 IPC." Tìm kiếm từ khóa 会完全错过它(没有共享词汇) ⋅ Nếu Nhập không nằm trong văn bản pháp lý được đào tạo, tìm kiếm ngữ nghĩa cũng sẽ bị lỗi nó── tìm kiếm thực sự 必须同时处理这两类问题──

IR là mỗi hệ thống RAG, mỗi thanh tìm kiếm, mỗi điểm tìm kiếm tài liệu, đường ống dẫn đường ống dẫn đường dưới cùng.

Bài học này sẽ xây dựng từng phần, và giải thích từng phần nắm bắt những thất bại nào.

## 概念

![Hybrid retrieval: BM25 + dense + RRF + cross-encoder rerank](../assets/retrieval.svg)

4 tầng 按需选择

1. **Sparse retrieval (BM25)。**快,对精确匹配 很精确,但对语义 很差──运行在逆向索引上──在数百万文档上 每次查询 低于10ms──能正确找到法规引用、产品代码、错误信息、命名实体──
2. **Dense retrieval。**将 truy vấn và tài liệu 编码为 Vector──Thiên cận gần nhất──Tận dụng các đoạn phrases 和 ngữ nghĩa tương tự──会漏掉只差差一个字符的精确关键字匹配──使用 FAISS 或 Vector DB 时,每次查询 约50-200ms──
3. **Fusion。**合并稀和密的排名列表――Reciprocal Rank Fusion (RRF) là một lựa chọn mặc định đơn giản, bởi vì nó bỏ qua điểm số thô (rất điểm), chỉ sử dụng các vị trí xếp hạng―― khi bạn biết một tín hiệu nào đó chiếm ưu thế trong miền của bạn, bạn có thể chọn sự hợp nhất cân nặng――
4. **Cross-encoder rerank。**Từ kết quả hợp 结合中取 top-30──运行跨码码器(查询 + tài liệu 一起输入,对每对打分)──保留 top-5──跨码器比双码器 每对更慢,但准确得多──你通过只在 top-30 上运行它们来摊薄成本──

三路 lấy lại (BM25 + dày + học-sparse, như SPLADE) trong các điểm chuẩn 2026 中优于两路方法, nhưng cần cơ sở hạ tầng của chỉ số học-sparse. Đối với hầu hết các nhóm, hai đường tăng ranc cross-encoder là điểm cân bằng tốt nhất.


```figure
gx-hybrid-retrieval
```

##  xây dựng nó

### Bước 1: Từ không thực hiện BM25

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

Có hai yếu tố đáng hiểu.`k1=1.5` kiểm soát độ bão hòa tần số thuật ngữ; giá trị越高, quyền trọng lượng lặp lại thuật ngữ越大。`b=0.75`控制长度正常化;0 表示忽略文档长度,1 表示完全正常化──这些默认值来自原始论文中罗伯逊的建议,很少需要调整──

### 步骤 2: Sử dụng bộ mã hóa làm lấy lại dày đặc

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

Đối với việc nhúng làm L2 bình thường hóa, làm cho sản phẩm chấm等于 cosine.`all-MiniLM-L6-v2`là 384-dim, tốc độ nhanh, đối với hầu hết các English truy xuất 来说足够强──多语言任务使用 `paraphrase-multilingual-MiniLM-L12-v2` Nếu theo đuổi tỷ lệ xác thực cao nhất, sử dụng `bge-large-en-v1.5`Hoặc`e5-large-v2`

### 步骤 3: Phối hợp cấp độ tương ứng

```python
def reciprocal_rank_fusion(rankings, k=60):
    scores = {}
    for ranking in rankings:
        for rank, (_, doc_idx) in enumerate(ranking):
            scores[doc_idx] = scores.get(doc_idx, 0.0) + 1.0 / (k + rank + 1)
    fused = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [(score, doc_idx) for doc_idx, score in fused]
```

`k=60`常量来自原始RRF 论文──更高的 `k`会削弱 sự khác biệt cấp bậc;`k`会让顶级排名占主导──60 是论文默认值, rất ít cần điều chỉnh──

### 步骤 4: Tìm kiếm lai + xếp hạng lại

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

三个阶段组合在一起──BM25 找词汇匹配──Dense 找语义匹配──RRF 合并两种排名,不需要分分校准──Cross-encoder 使用查询-document pairs 一起对 top-30 重新打分,从而捕捉双-encoder 错过的细粒度相关性──保留 top-5──

### Bước 5: đánh giá

| Metric | 含义 |
|--------|---------|
| Recall@k | 在正确 document 存在的 queries 中，它出现在 top-k 中的频率是多少？ |
| MRR (Mean Reciprocal Rank) | 第一个 relevant document 的 1/rank 的平均值。 |
| nDCG@k | 考虑 relevance 的等级差异，而不仅是 binary relevant/not。 |

Đối với RAG, Retriever của**Recall@k**Đó là con số quan trọng nhất. Nếu đúng đoạn không nằm trong bộ truy cập, người đọc sẽ không thể trả lời.

Trả lỗi 提示: Đối với các truy vấn thất bại, khác biệt hiếm và xếp hạng dày đặc. Nếu một trong số đó đã tìm thấy tài liệu chính xác, còn một khác không có, thì bạn gặp sự không phù hợp từ vựng.

## Sử dụng nó

2026 năm:

| Scale | Stack |
|-------|-------|
| 1k-100k docs | In-memory BM25 + `all-MiniLM-L6-v2` embeddings + RRF。不需要单独 DB。 |
| 100k-10M docs | dense 使用 FAISS 或 pgvector + BM25 使用 Elasticsearch / OpenSearch。并行运行。 |
| 10M+ docs | Qdrant / Weaviate / Vespa / Milvus，带 hybrid support。在 top-30 上做 cross-encoder rerank。 |
| Best-quality frontier | 三路（BM25 + dense + SPLADE）+ ColBERT late-interaction reranking |

Bất kể bạn chọn gì, phải cho đánh giá 预留预算。 trước khi đánh giá lấy lại nhớ, đánh giá lại độ chính xác của RAG từ đầu đến cuối。 người đọc không thể sửa chữa nội dung bị mất 漏掉。

### 2026 sản xuất RAG Trung来之难经验

- **80% 的 RAG 失败可追溯到 ingestion 和 chunking，而不是 model。**团队花几周时间替换 LLM,调整提示,而检索 每三次查询 就返回错误背景――先修复 chunking――
- **Chunking strategy 比 chunk size 更重要。**Các phân chia kích thước cố định 会破坏 bảng 、code 和 nested headers。Sentence-aware là một lựa chọn ngẫu nhiên; đối với các tài liệu kỹ thuật và các hướng dẫn sản phẩm, phân tích về ngữ nghĩa hoặc dựa trên LLM ≠ đáng để đầu tư。
- **Parent-doc pattern。**检索小的"child" chunks 以获得精度──当来自同一父母部分的多个孩子出现时,换进父母块 以保留背景──这会稳定提升答案质量,而且不需要重训──
- **k_rerank=3 通常是最优。**Mỗi phần phụ của số này sẽ tăng chi phí token và thời gian trễ phát triển, nhưng sẽ không nâng cao chất lượng trả lời. Nếu đối với bạn k=8 vẫn tốt hơn k=3, hãy cho thấy trình xếp hạng lại biểu hiện thiếu hụt.
- **HyDE / query expansion。**Từ câu hỏi 生成 một câu trả lời giả thuyết, cho nó làm nhúng, lấy lại lại. Nó có thể khắc phục khoảng cách cụm từ giữa vấn đề ngắn và hồ sơ dài.
- **Context budget 低于 8K tokens。**Nếu trong thời gian dài trên giới hạn này, chỉ ra ngưỡng xếp hạng lại quá rộng rãi.
- **Version everything。**Các quy tắc yêu cầu, quy tắc chia sẻ, mô hình nhúng, xếp hạng lại, bất kỳ sự buông lánh nào sẽ phá hủy chất lượng câu trả lời, dựa trên độ trung thành, độ chính xác trong ngữ cảnh và tỷ lệ câu hỏi không trả lời.
- **三路 retrieval（BM25 + dense + learned-sparse，如 SPLADE）优于两路方法**, trong năm 2026 điểm chuẩn trên đặc biệt hiện đang được hỗn hợp các từ chính xác với các câu hỏi về ngữ nghĩa.

Theo các phép đo ngành công nghiệp năm 2026, thiết kế thu hồi hợp lý có thể giảm ảo giác 70-90%── hầu hết lợi ích hiệu suất RAG đến từ thu hồi tốt hơn, chứ không phải là điều chỉnh mô hình.

## 交付 nó

保存为 `outputs/skill-retrieval-picker.md`- Có thể là:

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

1. **Easy.**Trong một bộ tài liệu 500 lên thực hiện trên `hybrid_search`△测试 20 个 câu hỏi──比较 BM25- chỉ ✓ chỉ ✓ chỉ ✓ ✓ 和 hybrid 在 5 上的召回──
2. **Medium.**+ Lưu ý MRR: + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
3. **Hard.**Sử dụng MultipleNegativesRankingLoss (Sentence Transformers) trong miền của bạn 上细调 一个密集编码──从500 个查询-文档对构建训练套──比较细调 前后的回忆──

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
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR, bi-encoder cổ điển
- [Formal et al. (2021). SPLADE: Sparse Lexical and Expansion Model](https://arxiv.org/abs/2107.05720) 弥合与密差的学会-sparse retriever──
- [Cormack, Clarke, Büttcher (2009). Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) RRF 论文。
- [Khattab and Zaharia (2020). ColBERT: Efficient and Effective Passage Search](https://arxiv.org/abs/2004.12832) tương tác muộn 检索。
