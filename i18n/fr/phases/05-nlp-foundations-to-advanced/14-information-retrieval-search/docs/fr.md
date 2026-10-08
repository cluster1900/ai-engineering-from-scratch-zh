# Récupération et recherche d'informations

> BM25 精确但脆弱──Dense 覆盖面广,但会漏掉关键词──Hybrid est la préférence de l'année 2026──其他都是调整──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 分钟

##  problématique

Utilisateur entre "Qu'est-ce qui se passe si quelqu'un ment pour obtenir de l'argent", attendre de trouver une véritable couverture de cette situation de la loi article:" Section 420 IPC. " Recherche de mots clés 会完全错过它(没有共享词汇) ⋅ si Embedding ne se pratique pas dans le texte juridique, recherche sémantique aussi va la faire passer.

L'IR est chaque système RAG, chaque barre de recherche, chaque station de documents, un pipeline de recherche floue.

Ce cours va construire chaque partie, et expliquer chaque partie capture ce qui a échoué.

## 概念

![Hybrid retrieval: BM25 + dense + RRF + cross-encoder rerank](../assets/retrieval.svg)

Quatre niveaux.

1. **Sparse retrieval (BM25)。**快,对精确匹配 很精确,但对语义 很差──运行在逆索引上──在数百万文档上 每次查询 低于10ms──能正确找到法规引用、产品代码、错误信息、命名实体──
2. **Dense retrieval。**Pour les requêtes et documents, la recherche de vecteurs et de vecteurs est la plus proche.
3. **Fusion。**合并稀和密集的排名列表──RRF (Reciprocal Rank Fusion) est une simple option par défaut, car elle ignore les scores bruts, elles sont à différentes échelles, et utilisent uniquement les positions de rang── lorsque vous savez qu'un signal occupe une place dominante dans votre domaine, vous pouvez choisir une fusion pondérée──
4. **Cross-encoder rerank。**De la fusion 结果中取 top-30──运行跨编码器(查询 +文档 一起输入,对每对打分)──保留 top-5──跨编码器比双编码器 每对更慢,但准确得多──你通过只在 top-30 上运行它们来摊薄成本──

La récupération de trois voies (BM25 + dense + learn-sparse, comme SPLADE) est un des meilleurs indicateurs de référence de 2026, mais nécessite l'infrastructure des indices d'épargne apprise.


```figure
gx-hybrid-retrieval
```

## - Je le construis.

### étape 1: réalisation de la BM25 à zéro

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

Il y a deux paramètres à comprendre.`k1=1.5` contrôler la saturation de la fréquence des termes; valeur plus élevée, le pouvoir de répétition des termes plus grand¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬`b=0.75`控制长度正常化;0 表示忽略文档长度,1 表示完全正常化──这些默认值来自原始论文中罗伯茨森的建议,很少需要调整──

### 步骤 2: Utilisez un bi-encodeur pour effectuer une récupération dense

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

Pour l'intégration faire L2 normaliser, faire produit de point égal à cosine.`all-MiniLM-L6-v2`C'est un peu plus rapide que le français.`paraphrase-multilingual-MiniLM-L12-v2`                                                                                                                                                                                                                                                              `bge-large-en-v1.5`Ou `e5-large-v2`Il y a une autre.

### 步骤 3: fusion de rang réciproque

```python
def reciprocal_rank_fusion(rankings, k=60):
    scores = {}
    for ranking in rankings:
        for rank, (_, doc_idx) in enumerate(ranking):
            scores[doc_idx] = scores.get(doc_idx, 0.0) + 1.0 / (k + rank + 1)
    fused = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [(score, doc_idx) for doc_idx, score in fused]
```

`k=60`常量来自原始RRF论文──更高的 `k`Réduction des différences de rang;`k`Il faut bien les mettre en place.

### 步骤 4: recherche hybride + réaffectation

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

Les résultats de la recherche sont les mêmes que ceux de la recherche de résultats de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de recherche de

### 步骤 5: évaluation

| Metric | 含义 |
|--------|---------|
| Recall@k | 在正确 document 存在的 queries 中，它出现在 top-k 中的频率是多少？ |
| MRR (Mean Reciprocal Rank) | 第一个 relevant document 的 1/rank 的平均值。 |
| nDCG@k | 考虑 relevance 的等级差异，而不仅是 binary relevant/not。 |

Pour le RAG, le Retriever.**Recall@k**Si le passage correct n'est pas dans l'ensemble récupéré, le lecteur ne peut pas répondre.

Déboguer 提示: Pour les requêtes ratées,différent rare 和 classements denses。Si l'un d'entre eux a trouvé un document correct, tandis que l'autre n'a pas, alors vous avez rencontré un déséquilibre vocabulaire(修复:补上缺失一半) ou une ambiguïté sémantique(修复:更好的嵌入或重排)。

## Utilisez-le

Stack de l'année 2026:

| Scale | Stack |
|-------|-------|
| 1k-100k docs | In-memory BM25 + `all-MiniLM-L6-v2` embeddings + RRF。不需要单独 DB。 |
| 100k-10M docs | dense 使用 FAISS 或 pgvector + BM25 使用 Elasticsearch / OpenSearch。并行运行。 |
| 10M+ docs | Qdrant / Weaviate / Vespa / Milvus，带 hybrid support。在 top-30 上做 cross-encoder rerank。 |
| Best-quality frontier | 三路（BM25 + dense + SPLADE）+ ColBERT late-interaction reranking |

Quoi que vous choisissiez, vous devez faire une évaluation 预留预算。先基准检索回忆,再基准端到端RAG精度──读者无法修复检索器 漏掉的内容──

### 2026 production RAG 中来之不易的经验

- **80% 的 RAG 失败可追溯到 ingestion 和 chunking，而不是 model。**L'équipe passe quelques semaines à remplacer les LLM, à régler les instructions, et à récupérer chaque requête.
- **Chunking strategy 比 chunk size 更重要。**Les tableaux seront détruits, les codes seront enchaînés et les titres seront mis en place.
- **Parent-doc pattern。**检索小的"child" chunks 以获得精度──当来自同一父母部分的多个孩子出现时,换进父母块 以保留背景──这会稳定提升答案质量,而且不需要重训──
- **k_rerank=3 通常是最优。** chaque pièce supplémentaire de ce nombre augmentera le coût des jetons et la latence de génération, mais ne fera pas de résultat supérieur. Si pour vous k=8  est encore supérieur à k=3, indiquez que le réranqueur est insuffisant.
- **HyDE / query expansion。**De la requête 生成一个假定答案,对它做嵌入,再获取──它能弥合短问题与长文档之间的短语差距──无需培训 即可免费提升精度──
- **Context budget 低于 8K tokens。**Si on continue à vivre à cette limite, on peut dire que le seuil de ré-rangement est trop large.
- **Version everything。**Les règles de prompting, de chunking, de modèle de reclassement, de référencement, tout dérivé perturberait la qualité des réponses, basé sur la fidélité, la précision du contexte et le taux de questions non répondues.
- **三路 retrieval（BM25 + dense + learned-sparse，如 SPLADE）优于两路方法**, qui est en 2026 référence de référence, en particulier en ce qui concerne la mixture de noms propres avec des questions de sémantique.

Selon les mesures de l'industrie de 2026, une conception de récupération raisonnable permet de réduire les hallucinations de 70-90%[6]. La plupart des résultats de RAG proviennent de meilleures récupérations, plutôt que de réglages de modèles.

## Je le livre.

保存为 `outputs/skill-retrieval-picker.md`- Le numéro de la liste:

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

1. **Easy.**Dans un corpus de 500 documents, réaliser ce qui précède.`hybrid_search`△测试 20 个问题──比较 BM25-only、density-only 和 hybrid 在 5 上的回忆──
2. **Medium.**Pour chaque requête de test de document connu, trouvez le document correct dans le classement BM25 ∆ dense et hybride ∆ rapport de chaque méthode de MRR 
3. **Hard.**Utilisez MultipleNegativesRankingLoss (Sentence Transformers) dans votre domaine en haut de la mise en forme d'un encodeur dense。 de 500 paires de requêtes-documents construire un ensemble de formation。 comparer la mise en forme de pré-retrouver 

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
- [Robertson and Zaragoza (2009). The Probabilistic Relevance Framework: BM25 and Beyond](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf) BM25 权威论述──
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR, classique bi-encodeur。
- [Formal et al. (2021). SPLADE: Sparse Lexical and Expansion Model](https://arxiv.org/abs/2107.05720) 弥合与密差的学会-sparse retriever──
- [Cormack, Clarke, Büttcher (2009). Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) RRF 论文。
- [Khattab and Zaharia (2020). ColBERT: Efficient and Effective Passage Search](https://arxiv.org/abs/2004.12832) Interaction tardive 检索。
