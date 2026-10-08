# Recuperación y búsqueda de información

> BM25 精确但脆弱──Dense 覆盖面广,但会漏掉关键词──Hybrid es la opción de 2026 años默认──其他都是调──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 分钟

##  problemas

Usuario de entrada "qué sucede si alguien miente para obtener dinero", espera encontrar realmente cubierto esta situación de la ley: "Sección 420 IPC".

IR es cada sistema RAG, cada barra de búsqueda, cada punto de archivo de búsqueda confusa de la tubería de fondo. La estructura de trabajo en producción en el año 2026 no es un solo método. Es una cadena compuesta por métodos complementarios, cada uno de los cuales está en la captura del fracaso del primer ciclo.

Esta clase construirá cada parte, y explicará cada parte capturar qué fracasó.

## 概念

![Hybrid retrieval: BM25 + dense + RRF + cross-encoder rerank](../assets/retrieval.svg)

Cuatro niveles.

1. **Sparse retrieval (BM25)。**快,对精确匹配 很精确,但对语义 很差──运行在逆向索引上──在数百万文档上 每次查询 低于10ms──能正确找到法规引用、产品代码、错误信息、命名实体──
2. **Dense retrieval。**Se puede encontrar una búsqueda y documentos 编码为 Vector──Nearest neighbor search──捕捉抛词和语义相似之──会漏掉只差差一个字符的精确关键字匹配──使用 FAISS或 Vector DB 时,每次查询 约50-200ms──
3. **Fusion。**合并稀和密的排名列表──RRF (Reciprocal Rank Fusion) es una opción de tipo preferido, ya que ignora las puntuaciones en bruto, sólo utiliza posiciones de rango──cuando sabes que una señal ocupa la posición dominante en tu dominio, puedes elegir la fusión ponderada──
4. **Cross-encoder rerank。**Desde la fusión 结果中取 top-30──运行跨编码器(查询 +文档 一起输入,对每对打分)──保留 top-5──跨编码器比双编码器 每对更慢,但准确得多──你通过只在 top-30 上运行它们来摊薄成本──

三路 retrieval (BM25 + denso + aprendido-sparse, como SPLADE) en los índices de referencia 2026 es un método de recuperación de datos, pero necesita la infraestructura de los índices de aprendizaje-sparse. Para la mayoría de los equipos, el rango de los codificadores cruzados de dos tramos es el mejor punto de equilibrio.


```figure
gx-hybrid-retrieval
```

## Construirlo

### Paso 1: Desde cero lograr BM25

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

Hay dos parámetros que hay que entender.`k1=1.5` controlar la saturación de la frecuencia del término; valor cada vez mayor, el peso de la repetición del término cada vez mayor`b=0.75`控制 length normalization;0 表示忽略文档长度,1 表示完全正常化──这些默认值来自原始论文中罗伯茨森的建议,很少需要调整──

### Paso 2: Utiliza un bi-encoder y realiza una recuperación densa

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

Para el embebimiento hacer L2 normalizar, hacer el producto punto é igual a cosino.`all-MiniLM-L6-v2`Es 384 dimensiones, velocidad rápida, para la mayoría de los retrieval en inglés para decir suficiente fuerte.`paraphrase-multilingual-MiniLM-L12-v2`若追求最高准确率,使用 `bge-large-en-v1.5`O `e5-large-v2`¿Qué es eso?

### Paso 3: Fusión de rango recíproco

```python
def reciprocal_rank_fusion(rankings, k=60):
    scores = {}
    for ranking in rankings:
        for rank, (_, doc_idx) in enumerate(ranking):
            scores[doc_idx] = scores.get(doc_idx, 0.0) + 1.0 / (k + rank + 1)
    fused = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [(score, doc_idx) for doc_idx, score in fused]
```

`k=60`常量来自原始RRF论文──更高的 `k`Contribución de reducción de las diferencias de rango;`k`Las categorías de los principales grupos de trabajo de la Universidad de San Francisco (U.S.A.)

### 步骤 4: búsqueda híbrida + rango

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

Tres fases 组合在一起──BM25 找词汇匹配──Dense 找语义匹配──RRF 合并两种排名,不需要分分校准──Cross-encoder Utiliza pares de documentos de consulta 起起对 top-30 重新打分,从而捕捉双编码 错过的细粒度相关性──保留 top-5──

### Paso 5: evaluación

| Metric | 含义 |
|--------|---------|
| Recall@k | 在正确 document 存在的 queries 中，它出现在 top-k 中的频率是多少？ |
| MRR (Mean Reciprocal Rank) | 第一个 relevant document 的 1/rank 的平均值。 |
| nDCG@k | 考虑 relevance 的等级差异，而不仅是 binary relevant/not。 |

Para el RAG, el recuperador.**Recall@k**Es el número más importante. Si el pasaje correcto no está en el conjunto recuperado, el lector no puede responder.

Debugging 提示:对于失败的查询,diff sparse 和 dense rankings──如果其中一个发现正确文档,而另一个没有,那么你遇到了词汇不匹配(修复:补上缺失一半) 或语义模糊(修复:更好嵌入或重排)──

## Usalo

Estaca de 2026 años:

| Scale | Stack |
|-------|-------|
| 1k-100k docs | In-memory BM25 + `all-MiniLM-L6-v2` embeddings + RRF。不需要单独 DB。 |
| 100k-10M docs | dense 使用 FAISS 或 pgvector + BM25 使用 Elasticsearch / OpenSearch。并行运行。 |
| 10M+ docs | Qdrant / Weaviate / Vespa / Milvus，带 hybrid support。在 top-30 上做 cross-encoder rerank。 |
| Best-quality frontier | 三路（BM25 + dense + SPLADE）+ ColBERT late-interaction reranking |

无论你选择什么,都要为评估 预留预算――先基准检索回忆,再基准端到端RAG精度――读者无法修复检索器 漏掉的内容――

### 2026 Producción RAG 中来之不易的经验

- **80% 的 RAG 失败可追溯到 ingestion 和 chunking，而不是 model。**团队花几周时间替换LLMs、调整提示,而检索 每三次查询 就返回错误背景──先修复 chunking──
- **Chunking strategy 比 chunk size 更重要。**Las divisiones de tamaño fijo 会破坏 tablas、code 和 nested header。Sentence-conscious is默认选择; para los documentos técnicos y manuales de productos, semántica o basada en LLM 
- **Parent-doc pattern。**检索小的"child" chunks 以获得精度──当来自同一父母部分的多个孩子出现时,换进父母块 以保留背景──这会稳定提升答案质量,而且不需要重训──
- **k_rerank=3 通常是最优。** Cada pieza adicional que exceda esta cantidad aumentará el costo de los tokens y la latencia de generación, pero no mejorará la calidad de la respuesta― si para ti k=8  sigue siendo superior a k=3, indique que el reranqueador muestra insuficiencia―
- **HyDE / query expansion。**Desde la consulta 生成一个假设答案,对它做嵌入,再获取──它能弥合短问题与长文档之间的短语差距──无需培训 即可免费提升精度──
- **Context budget 低于 8K tokens。**Si en este límite superior se mantiene el destino, el umbral de rebanqueo es demasiado fácil.
- **Version everything。**Las reglas de instrucciones, despezas, modelos de incorporación, rebanqueadores, cualquier derivación puede destruir la calidad de las respuestas, basándose en la fidelidad, la precisión del contexto y la tasa de preguntas sin respuesta.
- **三路 retrieval（BM25 + dense + learned-sparse，如 SPLADE）优于两路方法**, esto en 2026 índices de referencia, especialmente ahora se encuentra mezcla de nombres apropiados con las preguntas de semántica.

Según las mediciones del sector de 2026, el diseño razonable de recuperación puede reducir las alucinaciones de 70-90%― la mayoría de los beneficios de RAG                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-retrieval-picker.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy.**En un corpus de 500 documentos para lograr lo anterior.`hybrid_search`△测试 20 个查询──比较 BM25-only、density-only 和 hybrid 在 5 上的回忆──
2. **Medium.**Añadir el cálculo de MRR― para cada consulta de prueba de un documento válido conocido, encontrar el documento válido en el BM25―denso y híbrido ‒ para el ranking― para reportar cada método de MRR―.
3. **Hard.**Utiliza MultipleNegativesRankingLoss (Sentence Transformers) en tu dominio 上细调 一个密集编码──从500 个查询-文档对构建训练集──比较细调 前后的回忆──

## 关键术语: "El hombre es un hombre"
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
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR, clásico bi-encoder.
- [Formal et al. (2021). SPLADE: Sparse Lexical and Expansion Model](https://arxiv.org/abs/2107.05720) 弥合与密差的学会-sparse retriever──
- [Cormack, Clarke, Büttcher (2009). Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) RRF 论文──
- [Khattab and Zaharia (2020). ColBERT: Efficient and Effective Passage Search](https://arxiv.org/abs/2004.12832) Interacción tardía 检索。
