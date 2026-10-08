# استرداد المعلومات والبحث

> BM25 精确但脆弱── كثافة 覆面广,但会漏掉关键词──混合 是 2026 年的默认选择──其他都是调──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 分钟

## 问题

المستخدم يدخل "ما يحدث إذا كان شخص يكذب للحصول على المال"، يتوقع أن يجد حقا تغطي هذا الوضع قانونية: "القسم 420 IPC." بحث الكلمات الرئيسية 会完全错过它(没有共享词汇)

إنّه نظام كلّ RAG، كلّ شريط بحث، كلّ محطة وثائق، بحث غامض، خط أنابيب الأساس.

هذا الدروس سوف يُبني كل جزء، ويشرح كل جزء كيفية فهم ما فشل في ذلك.

## 概念

![Hybrid retrieval: BM25 + dense + RRF + cross-encoder rerank](../assets/retrieval.svg)

أربع مستويات

1. **Sparse retrieval (BM25)。**快,对 exact match 很精确,但对语义 很差──运行在逆指数上──在数百万文档上.在每次查询 低于10ms──能正确找到法规引用、产品代码、错误信息、命名实体──
2. **Dense retrieval。**سوف يُفقد فقط فرق بين كلمة رئيسية دقيقة من حرف واحد.
3. **Fusion。**合并稀和密集的排名列表──RRF (الاندماج المتبادل للدرجة) هو خيار افتراضي بسيط ، لأنه يتجاهل النتائج الخامة(يقع في مقياس مختلف) ، لا يستخدم سوى مواقف الدرجة── عندما تعرف إشارة في مجالك المملكة ، يمكنك اختيار الاندماج الموزن──
4. **Cross-encoder rerank。**من نتيجة الاندماج  تأخذ أعلى 30  تنفيذ الترجمة عبر المرموزات  استفسار + وثيقة  إدخال واحد، لجميع الأزواج 打分) ・ الحفاظ على أعلى 5  ترجمة عبر المرموزات أكثر من المرموزات الثنائية كل زوج أبطأ، ولكن بالضبط أكثر‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

استرداد 三路 (BM25 + كثيفة + متعلمة-الخرصة، مثل SPLADE) في مقياس 2026 中优于两路方法, ولكن تحتاج إلى البنية التحتية لمؤشرات المتعلمة-الخرصة.


```figure
gx-hybrid-retrieval
```

## بناءها

### الخطوة الأولى: من الصفر لتحقيق BM25

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

هناك اثنين من العناصر التي يجب أن تعرفها`k1=1.5`控制术语频率 saturation;值越高,术语重复的权重越大──`b=0.75`控制 length normalization;0 表示忽略文档长度,1 表示完全正常化──这些默认值来自原始论文中罗伯茨顿的建议,很少需要调整──

### الخطوة الثانية: استخدام المُرمّع الثنائي القيام بإسترداد كثيف

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

لـ إضافة عمل L2 تطبيعي، جعل النقطة المنتج等于 cosine.`all-MiniLM-L6-v2`هو 384 طول، سرعت快، على معظم English استرداد 来说足够强──多语言任务使用 `paraphrase-multilingual-MiniLM-L12-v2`若追求最高准确率, استخدام `bge-large-en-v1.5`أو`e5-large-v2`.

### الخطوة الثالثة: الاندماج المتبادل

```python
def reciprocal_rank_fusion(rankings, k=60):
    scores = {}
    for ranking in rankings:
        for rank, (_, doc_idx) in enumerate(ranking):
            scores[doc_idx] = scores.get(doc_idx, 0.0) + 1.0 / (k + rank + 1)
    fused = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [(score, doc_idx) for doc_idx, score in fused]
```

`k=60`常量来自原始RRF 论文──更高的 `k`会弱化 الاختلافات في الرتبة`k`سوف يجعل الرتب العليا تُحتوي على 60

### 步骤 4: البحث الهجين + إعادة التصنيف

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

三个阶段组合在一起──BM25 找词典匹配──Dense 找语义匹配──RRF 合并两种排名,不需要分数校准──Cross-encoder 使用查询文件对一起对 top-30 重新打分,从而捕捉双编码 错过的细粒度相关性──保留 top-5──

### الخطوة 5: التقييم

| Metric | 含义 |
|--------|---------|
| Recall@k | 在正确 document 存在的 queries 中，它出现在 top-k 中的频率是多少？ |
| MRR (Mean Reciprocal Rank) | 第一个 relevant document 的 1/rank 的平均值。 |
| nDCG@k | 考虑 relevance 的等级差异，而不仅是 binary relevant/not。 |

بالنسبة لـ (راغ) ، (ريتريفر)**Recall@k**هو الأرقام الأهم... إذا كان المقطع الصحيح غير موجود في المجموعة المكتسبة، فلن يستطيع القارئ الإجابة.

تحرير النصيحة: بالنسبة للطلبات الفاشلة،فريدة من نوعها و مرتبات كثيفة. إذا وجدت واحدة منها وثيقة صحيحة، بينما الآخر لا، ثم تواجه عدم توافق المفردات.

## استخدمها

2026 سنة:

| Scale | Stack |
|-------|-------|
| 1k-100k docs | In-memory BM25 + `all-MiniLM-L6-v2` embeddings + RRF。不需要单独 DB。 |
| 100k-10M docs | dense 使用 FAISS 或 pgvector + BM25 使用 Elasticsearch / OpenSearch。并行运行。 |
| 10M+ docs | Qdrant / Weaviate / Vespa / Milvus，带 hybrid support。在 top-30 上做 cross-encoder rerank。 |
| Best-quality frontier | 三路（BM25 + dense + SPLADE）+ ColBERT late-interaction reranking |

无论你选择什么,都要为评估 预留预算――先基准检索回忆,再基准端到端RAG精度――读者无法修复检索器 漏掉的内容――

### 2026 الإنتاج RAG 中来之不易的经验

- **80% 的 RAG 失败可追溯到 ingestion 和 chunking，而不是 model。**团队花几周时间替换LLMs、调节提示,而检索每三次查询 就返回错误背景──先修复 chunking──
- **Chunking strategy 比 chunk size 更重要。**تقسيمات الحجم الثابت 会破坏 جداول、 رمز 和 سرات مستوىها── شعور-وعي هو الاختيار المُ默认؛ بالنسبة للوثائق الفنية ومذكرات المنتجات، والترميز أو القائمة على ماجستير في إدارة الأعمال 值得 الاستفادة منها──
- **Parent-doc pattern。**检索小的"孩子"块以获得精度──当来自同一父母部分的多个孩子出现时,换进父母块以保留背景──这会稳定提升答案质量,而且不需要重训──
- **k_rerank=3 通常是最优。** كل جزء إضافي يتجاوز هذا العدد يزيد من تكلفة الوهم وملاحظة الجيل، ولكن لا يزيد من جودة الإجابة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- **HyDE / query expansion。**من السؤال 生成 جواب افتراضي، لذلك قم بتثبيت، استعادة.
- **Context budget 低于 8K tokens。**إذا استمر في هذا الحد العلوي، فمن الواضح أنّ عتبة المُعدّلين هي متساعدة جداً
- **Version everything。**الإشارات  قواعد التقاط  نموذج إدماج  رينكر‬ أي تدفق  تدمير جودة الإجابة‬ بناء على الوفاء  دقة السياق و ‬ معدل الأسئلة غير المطلوبة ‬
- **三路 retrieval（BM25 + dense + learned-sparse，如 SPLADE）优于两路方法**، هذا في 2026 مقاييس على وجه الخصوص في حال الاختلاط بين الأسماء المناسبة والسؤال عن التعبيرات.

وفقاً لقياسات الصناعة لعام 2026، يمكن تصميم الاسترداد المعقول أن يقلل من الهلوسات 70 إلى 90٪. معظم النتائج عن أداء RAG تأتي من استرداد أفضل، وليس من تحسين النموذج.

## 交付 it

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

## التدريب

1. **Easy.**في مجموعة من 500 وثيقة على تحقيق ما هو فوق`hybrid_search`△测试 20 个查询──比较 BM25 فقط、 كثافة فقط 和混合在 5 上的回忆──
2. **Medium.**إضافة حساب MRR. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
3. **Hard.**استخدام MultipleNegativesRankingLoss (Sentence Transformers) في مجالك 上 fine-tune واحد مُرمّع كثيف── من 500 زوج من المفاوضات وثائق 构建训练套──比较 fine-tune 前后的回忆──

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
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR، كلاسيكي ثنائي المُرمّد
- [Formal et al. (2021). SPLADE: Sparse Lexical and Expansion Model](https://arxiv.org/abs/2107.05720) 弥合与密集差距的学会-sparse retriever──
- [Cormack, Clarke, Büttcher (2009). Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) RRF 论文。
- [Khattab and Zaharia (2020). ColBERT: Efficient and Effective Passage Search](https://arxiv.org/abs/2004.12832) التفاعل المتأخر 检索
