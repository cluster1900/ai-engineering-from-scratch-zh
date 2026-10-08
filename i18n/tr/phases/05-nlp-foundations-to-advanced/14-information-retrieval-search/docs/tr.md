# Bilgi Arama ve Arama

> BM25 精确但脆弱──Dense 覆面广,但会漏掉关键词──混合是2026年的默认选择──其他都是调──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 分钟

## 问题

Utenti input "Birisi para almak için yalan söylerse ne olur?" ("Section 420 IPC. "Keyword search 会完全错过它(没有共享词汇) ⋅ If Embedding is not in the法律文本上训练的, semantic search will also miss it──real search ⋅ must deal simultaneously with these two kinds of problems──

IR her RAG sistemidir, her arama çubuğu, her dosya istasyonunun bulanık aramaları alt kat boru hattıdır. 2026 yılında üretim içinde çalışabilecek yapı tek bir yöntem değildir.

Bu ders her bölümün nasıl başarısız olduğunu anlatacak ve her bölümün nasıl başarısız olduğunu açıklayacaktır.

## 概念

![Hybrid retrieval: BM25 + dense + RRF + cross-encoder rerank](../assets/retrieval.svg)

Dört katlı.

1. **Sparse retrieval (BM25)。**快,对精确匹配 很精确,但对语义 很差──运行在逆索引上──在数百万文档上 每次查询 低于10ms──能正确找到法规引用、产品代码、错误信息、命名实体──
2. **Dense retrieval。**Bu sorgu ve belgeler, 编码为 Vector──Nearest neighbor search──捕捉抛词和语义相似性──会漏掉只差差一个字符的精确关键词匹配──使用FAISS 或 Vector DB 时,每次查询 约50-200ms──
3. **Fusion。**合并稀和密集的排列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列列
4. **Cross-encoder rerank。**Füzyon sonucu arasında top-30 alıntı yapılır. Yapılan işlemi ise top-30'dan daha yavaş yapılır.

Üç yol geri alım (BM25 + yoğun + öğrenilmiş-sparse, SPLADE gibi) 2026 referans değerlerinde iki yolun arasında üstünlük sağlar, ancak öğrenilmiş-sparse indekslerinin altyapısına ihtiyaç duyar. Çoğu ekip için iki yolun da çapraz kodlayıcı yeniden sıralaması en iyi dengedir.


```figure
gx-hybrid-retrieval
```

## Yapın onu.

### 步骤 1: BM25'i sıfırdan gerçekleştirmek

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

Bilmemiz gereken iki parametre var.`k1=1.5`控制 term-frequency saturation; value越高,term repetition's权重越大──`b=0.75`控制 length normalization;0 表示忽略文档长度,1 表示完全正常化──这些默认值来自原始论文中罗伯茨顿的建议,很少需要调──

### 步骤 2: Bi-encoder kullanın yoğun çekim yapın

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

L2 normalleştirmek için, nokta ürünü cosine gibi yapın.`all-MiniLM-L6-v2`384 boyutlu, hızlı, çoğu İngilizce için yeterince güçlü.`paraphrase-multilingual-MiniLM-L12-v2`                                                                                                                                                                                                                                                              `bge-large-en-v1.5`Ya da`e5-large-v2`- Evet.

### 步骤 3: karşılıklı sıra birleşimi

```python
def reciprocal_rank_fusion(rankings, k=60):
    scores = {}
    for ranking in rankings:
        for rank, (_, doc_idx) in enumerate(ranking):
            scores[doc_idx] = scores.get(doc_idx, 0.0) + 1.0 / (k + rank + 1)
    fused = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [(score, doc_idx) for doc_idx, score in fused]
```

`k=60`常量 来源原始RRF论文──更高的 `k`Rank farklarını zayıflatmak için katkı; daha düşük `k`Bu yüzden, bu konuda çok az ayarlama yapılması gerekiyor.

### 步骤 4: hibrid arama + yeniden sıralama

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

Üç aşama组合在一起──BM25 找词典匹配──Dense 找语义匹配──RRF 合并两种排行,不需要分校准──Cross-encoder 使用查询-document pairs 一起对 top-30 重新打分,从而捕捉双编码 错过的细粒度相关性──保留 top-5──

### 5 adım: değerlendirme

| Metric | 含义 |
|--------|---------|
| Recall@k | 在正确 document 存在的 queries 中，它出现在 top-k 中的频率是多少？ |
| MRR (Mean Reciprocal Rank) | 第一个 relevant document 的 1/rank 的平均值。 |
| nDCG@k | 考虑 relevance 的等级差异，而不仅是 binary relevant/not。 |

RAG için, Retriever için.**Recall@k**Eğer doğru pasaj alınmamış bir sette ise, okuyucu cevap veremez.

Debugging 提示: For failure queries,diff sparse 和 dense rankings──If one of them found a correct document, while the other does not, then you encountered vocabulary mismatch (sözlük eşleşmezliği)

## Kullan

2026 yılının birimi:

| Scale | Stack |
|-------|-------|
| 1k-100k docs | In-memory BM25 + `all-MiniLM-L6-v2` embeddings + RRF。不需要单独 DB。 |
| 100k-10M docs | dense 使用 FAISS 或 pgvector + BM25 使用 Elasticsearch / OpenSearch。并行运行。 |
| 10M+ docs | Qdrant / Weaviate / Vespa / Milvus，带 hybrid support。在 top-30 上做 cross-encoder rerank。 |
| Best-quality frontier | 三路（BM25 + dense + SPLADE）+ ColBERT late-interaction reranking |

Seçtiğiniz her şey, değerlendirme için gereklidir 预留预算。 önce referans geri alımı hatırlatmak, yeniden sondan sonuna kadar RAG doğruluğunu göstermek。 okuyucu 无法修复 retriever 漏掉的内容。

### 2026 üretim RAG 中来之不易的经验

- **80% 的 RAG 失败可追溯到 ingestion 和 chunking，而不是 model。**团队花几周时间替换LLMs、调节提示,而复苏 每三次查询就返回错误背景──先修复 chunking──
- **Chunking strategy 比 chunk size 更重要。**Sıkı boyutlu bölünmeler, tabloları yok eder, kodlar ve yuva başlıkları oluşturur.
- **Parent-doc pattern。**检索小的"child" chunks以获得精度──当来自同一父母部分的多个孩子出现时,换进父母块以保留背景──这会稳稳提升答案质量,而且不需要重训──
- **k_rerank=3 通常是最优。**Bu miktarın her ek bölümü Token maliyetini ve jenerasyon gecikmesini artıracak, ancak cevap kalitesini artırmayacaktır.
- **HyDE / query expansion。**Sorgulardan 生成 hipotetik bir cevap, ona embed,再取得────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
- **Context budget 低于 8K tokens。**Eğer bu sınır üzerinde devam edersen, reanker eşiğinin çok rahat olduğunu göster.
- **Version everything。**İhtiyaçlılık, bağlamsal hassasiyet ve yanıtlanmamış sorular oranına dayanan CI kapıları, kullanıcıların gerileme görmesi öncesinde onları durdurmak için kullanılır.
- **三路 retrieval（BM25 + dense + learned-sparse，如 SPLADE）优于两路方法**Bu, 2026'da, özellikle de şimdi, özel isimlerin semantik soruları ile karıştığı bir dönemde gerçekleşecek.

2026 yılının endüstri ölçümlerine göre, mantıklı bir geri çekim tasarımı halüsinasyonları %70-90% oranında azaltır. RAG'lerin çoğu daha iyi geri çekimden elde edilen performans kazanımlarından gelir.

## - Söyle.

保存为 `outputs/skill-retrieval-picker.md`- ...

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

1. **Easy.**Yukarıdakiları gerçekleştirmek için 500 belgelik bir korpusda.`hybrid_search`△ test 20 个问题──比较 BM25-only、density-only 和 hybrid 在 5 上的回忆──
2. **Medium.**添加MRR hesaplaması──Bilirilen her doğru belge için doğru belge bul BM25、densite 和混合 sıralamaları sırasındaki sıralamayı── rapor her türlü MRR──
3. **Hard.**MultipleNegativesRankingLoss (Sentence Transformers) kullanın. Üst düzeyde ince ayarlama yapın.

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
- [Robertson and Zaragoza (2009). The Probabilistic Relevance Framework: BM25 and Beyond](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf)BM25'in yetkilileri
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR, klasik iki kodlayıcı
- [Formal et al. (2021). SPLADE: Sparse Lexical and Expansion Model](https://arxiv.org/abs/2107.05720) 弥合与密集差距的学会-sparse retriever──
- [Cormack, Clarke, Büttcher (2009). Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) RRF 论文。
- [Khattab and Zaharia (2020). ColBERT: Efficient and Effective Passage Search](https://arxiv.org/abs/2004.12832) geç etkileşim 检索。
