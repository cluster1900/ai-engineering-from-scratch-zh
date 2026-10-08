# सूचना प्राप्ति और खोज

> BM25 精确但脆弱──Dense 覆盖面广,但会漏掉关键词──混合是2026年的默认选择──其他都是调──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 分钟

## 问题

उपयोगकर्ता प्रविष्ट करें "क्या होता है अगर कोई पैसा पाने के लिए झूठ बोलता है", "आकांक्षाएं" की खोज करें "धारा 420 आईपीसी" कीवर्ड खोजें 会完全错过它(没有共享词汇)

आईआर प्रत्येक आरएजी प्रणाली है, प्रत्येक खोज पट्टी, प्रत्येक दस्तावेज़ स्टेशन बिंदु, धुंधली खोज, नीचे की पाइपलाइन है। 2026 में उत्पादन में काम करने वाली संरचना एक एकल विधि नहीं है। यह एक श्रृंखला है जिसमें एक दूसरे के साथ एक दूसरे के साथ काम करना शामिल है। प्रत्येक चरण पहले चरण की विफलता को पकड़ने में है।

इस वर्ग में प्रत्येक भाग का निर्माण किया जाएगा, और प्रत्येक भाग को क्या विफलताएं हैं, वे समझाई जाएंगी।

## 概念

![Hybrid retrieval: BM25 + dense + RRF + cross-encoder rerank](../assets/retrieval.svg)

चार स्तरों पर चयन करना

1. **Sparse retrieval (BM25)。**快,对精确匹配 很精确,但对语义 很差──运行在逆向索引上──在数百万文档上每次查询 低于10ms──能正确找到法规引用、产品代码、错误信息、名称实体──
2. **Dense retrieval。**                                                                                                                                                                                                                                                              
3. **Fusion。**合并稀和密集的排列列表──相互排列融合 (RRF) एक साधारण默认选择 है, क्योंकि यह कच्चे स्कोर को अनदेखा करता है, वे विभिन्न माप पर हैं, केवल रैंक पदों का उपयोग करते हैं── जब आप जानते हैं कि आपके डोमेन में कोई संकेत प्रमुख है, तो आप एक भारित संलयन का चयन कर सकते हैं──
4. **Cross-encoder rerank。**फ़्यूजन के परिणामों में शीर्ष-30 को प्राप्त करना- क्रॉस-एन्कोडर का संचालन करना- क्वेरी + दस्तावेज़ एक-एक इनपुट, प्रत्येक जोड़ी के लिए 打分)  शीर्ष-5 को बनाए रखना- क्रॉस-एन्कोडर प्रति जोड़ी द्वि-एन्कोडर से धीमी गति से, लेकिन सटीक से अधिक है- आप केवल शीर्ष-30 पर ही काम करते हैं और उन्हें कम लागत पर खर्च करते हैं-

三路 रिट्रीवल (BM25 + घने + सीखे-अवकाश, जैसे SPLADE) 2026 बेंचमार्क में बेहतर है, लेकिन सीखे-अवकाश सूचकांक के बुनियादी ढांचे की आवश्यकता है।


```figure
gx-hybrid-retrieval
```

##  इसे निर्माण

### 步骤 1: शून्य से BM25 को प्राप्त करना

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

दो तत्वों को समझने लायक है।`k1=1.5` नियंत्रण शब्द-आवृत्ति संतृप्ति; मूल्य越高,शब्द पुनरावृत्ति का अधिकार越大──`b=0.75`控制 लंबाई सामान्यीकरण;0 表示忽略文档长度,1 表示完全正常化──这些默认值来自原始论文中罗伯茨顿的建议,很少需要调整──

### 步骤 2: दो-संकेतक का उपयोग करें घने पुनर्प्राप्ति

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

L2 को सामान्य बनाने के लिए, डॉट उत्पाद को कॉसिन के समान बनाएं।`all-MiniLM-L6-v2`है 384-dim, गति तेजी से, अधिकांश अंग्रेजी पुनः प्राप्त करने के लिए पर्याप्त मजबूत है।`paraphrase-multilingual-MiniLM-L12-v2` यदि उच्चतम सटीकता दर का पीछा किया जाए, उपयोग `bge-large-en-v1.5`या `e5-large-v2`

### 步骤 3: पारस्परिक रैंक फ्यूजन

```python
def reciprocal_rank_fusion(rankings, k=60):
    scores = {}
    for ranking in rankings:
        for rank, (_, doc_idx) in enumerate(ranking):
            scores[doc_idx] = scores.get(doc_idx, 0.0) + 1.0 / (k + rank + 1)
    fused = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [(score, doc_idx) for doc_idx, score in fused]
```

`k=60`常量来自原始RRF 论文──更高的 `k`रैंक अंतर को कमजोर करने का योगदान;`k`                                                                                                                                                                                                                                                              

### 步骤 4: हाइब्रिड खोज + पुनः रैंक

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

तीन चरणों में एक साथ सामिल होना──BM25 找 शब्दावली मैचों──Dense 找 सांकेतिक मैचों──RRF 合并两种排名,不需要分数校准──क्रॉस-एन्कोडर प्रयोग करें क्वेरी-डॉक्यूमेंट जोड़े एक से ऊपर-30 重新打分, ताकि द्वि-एन्कोडर 错过的细粒度 सान्दर्भिकता──保留前-5──

### 步骤 5: मूल्यांकन

| Metric | 含义 |
|--------|---------|
| Recall@k | 在正确 document 存在的 queries 中，它出现在 top-k 中的频率是多少？ |
| MRR (Mean Reciprocal Rank) | 第一个 relevant document 的 1/rank 的平均值。 |
| nDCG@k | 考虑 relevance 的等级差异，而不仅是 binary relevant/not。 |

 RAG के लिए, रिट्रीवर **Recall@k**यह सबसे महत्वपूर्ण संख्या है। यदि सही पाठ न हो तो पाठक उत्तर नहीं दे सकता।

डिबगिंग 提示: असफल प्रश्नों के लिए,diff दुर्लभ 和 घने रैंकिंग। यदि उनमें से एक ने सही दस्तावेज़ पाया, जबकि दूसरा नहीं, तो आपको शब्दावली के असंगतता का सामना करना पड़ा।

## इसका उपयोग करें

2026 वर्ष का स्टैकः

| Scale | Stack |
|-------|-------|
| 1k-100k docs | In-memory BM25 + `all-MiniLM-L6-v2` embeddings + RRF。不需要单独 DB。 |
| 100k-10M docs | dense 使用 FAISS 或 pgvector + BM25 使用 Elasticsearch / OpenSearch。并行运行。 |
| 10M+ docs | Qdrant / Weaviate / Vespa / Milvus，带 hybrid support。在 top-30 上做 cross-encoder rerank。 |
| Best-quality frontier | 三路（BM25 + dense + SPLADE）+ ColBERT late-interaction reranking |

 whatever you choose, gotta for evaluation 预留预算── पहले बेंचमार्क रिट्रीवल रिकॉल, फिर से बेंचमार्क एंड-टू-एंड आरएजी सटीकता── पाठक 无法修复 रिट्रीवर 漏掉的内容──

### 2026 उत्पादन RAG 中来之不易的经验

- **80% 的 RAG 失败可追溯到 ingestion 和 chunking，而不是 model。**团队花几周时间替换LLMs、调节提示,而检索每三次查询就返回错误背景──先修复分化──
- **Chunking strategy 比 chunk size 更重要。**फिक्स्ड साइज स्प्लिट 会破坏 तालिकाएँ、 कोड 和 नेस्टेड हेडर──Sentence-aware is默认选择; तकनीकी दस्तावेजों एवं उत्पाद मैनुअल, अर्थशास्त्र या LLM आधारित का टुकड़ाकरण 
- **Parent-doc pattern。**检索小的"बच्चा" टुकड़े  सटीकता प्राप्त करें जब एक ही अभिभावक सेक्शन से कई बच्चे आते हैं, तब वे परिवेश में बने रहते हैं यह उत्तर की गुणवत्ता में सुधार करेगा, और पुनर्व्यवस्था की आवश्यकता नहीं है
- **k_rerank=3 通常是最优。** इस राशि से अधिक प्रत्येक अतिरिक्त टुकड़ा टोकन लागत और पीढ़ी की विलंबता को बढ़ाएगा, लेकिन उत्तर की गुणवत्ता में सुधार नहीं करेगा यदि आपके लिए k=8  अभी भी k=3 से बेहतर है, तो रेनकर को दिखाएँ प्रदर्शन में कमी
- **HyDE / query expansion。**प्रश्न से उत्पन्न एक परिकल्पनात्मक उत्तर, इसके लिए करना एम्बेड, पुनः प्राप्त करना।
- **Context budget 低于 8K tokens。**यदि इस ऊपरी सीमा पर निरंतर जीवन में, रेनकर की सीमा बहुत अधिक है
- **Version everything。**प्रम्प्ट्स、चंकिंग नियम、एम्बेडिंग मॉडल、रेरेंकर。 कोई भी बहाव  उत्तर गुणवत्ता को खराब करेगा── वफादारी、संदर्भ सटीकता एवं उत्तरहीन प्रश्न दर के आधार पर आईसी गेट ̊ उपयोगकर्ता रिग्रेशन को देखने के लिए पहले उन्हें रोकेगा──
- **三路 retrieval（BM25 + dense + learned-sparse，如 SPLADE）优于两路方法**, जो 2026 में बेंचमार्क ऊपर विशेष रूप से वर्तमान में मिश्रित उचित संज्ञाओं और अर्थशास्त्र के प्रश्नों के साथ है।

2026 के उद्योग के माप के अनुसार, उचित पुनर्प्राप्ति डिजाइन हलूसिनेशन को 70 से 90% तक कम कर सकता है।

## 交付 यह

保存为 `outputs/skill-retrieval-picker.md`:

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

## अभ्यास

1. **Easy.**एक 500 दस्तावेज निकाय में ऊपर के लिए पूरा करने के लिए `hybrid_search`△测试 20 个查询──比较 BM25-केवल、घनत्व-केवल 和混合在 5 上的回忆──
2. **Medium.**添加MRR计算── प्रत्येक ज्ञात सही दस्तावेज़ के परीक्षण क्वेरी के लिए, BM25 में सही दस्तावेज़ ढूंढें、 घनत्व एवं हाइब्रिड रैंकिंग में रैंक── रिपोर्ट प्रत्येक विधि के MRR──
3. **Hard.**उपयोग मल्टीपलनेगेटिव रैंकिंग लॉस (संज्ञा परिवर्तनकर्ता) अपने डोमेन में ऊपर बारीक-ट्यून एक घने एन्कोडर── 500  क्वेरी-दस्तावेज़ जोड़े से  प्रशिक्षण सेट का निर्माण── तुलना करें बारीक-ट्यून पूर्व后的回忆──

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
- [Robertson and Zaragoza (2009). The Probabilistic Relevance Framework: BM25 and Beyond](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf) BM25 का अधिकार论述──
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) डीपीआर, क्लासिक द्वि-संकेतक
- [Formal et al. (2021). SPLADE: Sparse Lexical and Expansion Model](https://arxiv.org/abs/2107.05720) 弥合与密集差距的学会-स्पेस रिट्रीवर──
- [Cormack, Clarke, Büttcher (2009). Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) आरआरएफ 论文──
- [Khattab and Zaharia (2020). ColBERT: Efficient and Effective Passage Search](https://arxiv.org/abs/2004.12832) देर से बातचीत 检索。
