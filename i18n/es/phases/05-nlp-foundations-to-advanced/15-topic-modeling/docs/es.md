# Modelado de temas  LDA y BERTopic

> LDA:documentos es una mezcla de temas, temas son palabras 上的分布──BERTópicos:documentos en el espacio de inserción 中聚类, clusters 就是 topics──目标相同,分解方式不同──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word2Vec)
**Time:** ~45 分钟

## El problema

Tienes 10.000 artículos de apoyo al cliente, 50.000 artículos de noticias, o 200.000 artículos de tuits. Necesitas saber que esta colección está en el tema. No tienes categorías de etiquetado.

Modelado de temas en la falta de supervisión para responder a esta pregunta.

两类算法家族占主导──LDA (2003) Colocar cada documento 视为隐藏话题的混合,把每个话题 视为词语 上的分布──Inferencia es bayesiano── todavía se utiliza para la producción de las asignaciones de temas de miembros mixtos 和可解释词级概率分布的环境──

BERTopic (2020) utiliza documentos codificados BERT, utiliza UMAP 降维, utiliza HDBSCAN 聚类,并通过类型基于TF-IDF 提取话题词――它在短文本、社交媒体,以及任何语义相似之比词重叠更重要场景中胜出―― un documento 得到一个话题,这对长形式内容是限制――

Este curso se centra en la creación de la conciencia, y explica el cuerpo determinado cuando debe elegir cual.

## El concepto

![LDA mixture model vs BERTopic clustering](../assets/topic-modeling.svg)

**LDA generative story。**Cada tema es palabras arriba de distribución. Cada documento es una mezcla de temas. Debe generar una palabra en el documento, primero desde la mezcla de un documento, luego desde la distribución de ese tema. Inferencia.

关键 salida de LDA:

- `doc_topic`: matriz `(n_docs, n_topics)`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , y , , , , , , , , , y , , , , , , , y , , , , , , , y , , , y , , , , , y , , , , y , , , y , , , , y , , , , , y , , , y , , , y , , , y , , y , , , , y , y , , , y , , y , , , y , y , y , , , , y , y , y , , , y , , y , y , y , y , , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y , y ,
- `topic_word`: matriz `(n_topics, vocab_size)`,每行和为 1 ((diferencia de palabras del tema) ⋅

**BERTopic pipeline。**

1. Usar el transformador de oraciones`all-MiniLM-L6-v2`) codificar cada documento. 384 vectores de dimensiones.
2. Utiliza UMAP 降维到大约 5 维──BERT embedments para el agrupamiento para dimensiones demasiado altas──
3. Utilizando HDBSCAN 聚类── basado en la densidad, generar grandes y grandes racimos y una etiqueta "outlier"──
4. Para cada grupo, en los documentos del mismo, se calcula el TF-IDF basado en clases, y se extraen las palabras principales.

输出是每个文件一个主题(外加 -1 outlier label) 也可以通过 HDBSCAN的概率向量 得到软会员──


```figure
topic-drift
```

## Construye el mismo

### Paso 1:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

```python
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
import numpy as np


def fit_lda(documents, n_topics=5, max_features=1000):
    cv = CountVectorizer(
        max_features=max_features,
        stop_words="english",
        min_df=2,
        max_df=0.9,
    )
    X = cv.fit_transform(documents)
    lda = LatentDirichletAllocation(
        n_components=n_topics,
        random_state=42,
        max_iter=50,
        learning_method="online",
    )
    doc_topic = lda.fit_transform(X)
    feature_names = cv.get_feature_names_out()
    return lda, cv, doc_topic, feature_names


def print_top_words(lda, feature_names, n_top=10):
    for idx, topic in enumerate(lda.components_):
        top_idx = np.argsort(-topic)[:n_top]
        words = [feature_names[i] for i in top_idx]
        print(f"topic {idx}: {' '.join(words)}")
```

Nota: Eliminación de palabras de parada, min_df 和 max_df 过罕见和无处不在的术语, utiliza CountVectorizer(no TfidfVectorizer), ya que LDA 期望原数。

### Paso 2: BERTopic (producción)

```python
from bertopic import BERTopic

topic_model = BERTopic(
    embedding_model="sentence-transformers/all-MiniLM-L6-v2",
    min_topic_size=15,
    verbose=True,
)

topics, probs = topic_model.fit_transform(documents)
info = topic_model.get_topic_info()
print(info.head(20))
valid_topics = info[info["Topic"] != -1]["Topic"].tolist()
for topic_id in valid_topics[:5]:
    print(f"topic {topic_id}: {topic_model.get_topic(topic_id)[:10]}")
```

`Topic != -1`Por lo tanto, el proyecto de investigación de la Universidad de Barcelona (UAE) se ha convertido en un proyecto de investigación de la Universidad de Barcelona.`min_topic_size` control HDBSCAN tamaño de grupo mínimo; BERTopic biblioteca 默认值是10──本例为本课规模显式设为15──对于超过10,000 文件的 corpora,增加到50或100──

### Paso 3: evaluación

两种方法都会输出话题词――问题是这些词 是否连贯――

- **Topic coherence (c_v)。**En contextos de ventana deslizante 上组合顶词对的 NPMI(normalized pointwise mutual information),把分数聚合成话题向量,并通过共数相似比较这些向量──越高越好──使用 `gensim.models.CoherenceModel`Y la configuración `coherence="c_v"`¿Qué es eso?
- **Topic diversity。**Proporción de palabras únicas en todos los temas.
- **Qualitative inspection。**¿Lea las palabras principales de cada tema? ¿Son las que nombran cosas reales?

## ¿Cuándo elegir cuál

| Situation | Pick |
|-----------|------|
| 短文本（tweets、reviews、headlines） | BERTopic |
| 带 topic mixtures 的长 documents | LDA |
| 无 GPU / compute 受限 | LDA 或 NMF |
| 需要 document-level multi-topic distributions | LDA |
| 用于 topic labeling 的 LLM integration | BERTopic（直接支持） |
| 资源受限的 edge deployment | LDA |
| 最大 semantic coherence | BERTopic |

El mayor cálculo real es la longitud del documento. Las incorporaciones BERT se interceptan; los recuentos LDA se pueden tratar de cualquier longitud.

## Usalo

Estaca 2026:

- **BERTopic。**短文本和任何语义 重要场景的默认选择──
- **`gensim.models.LdaModel`。**经典 LDA, para la producción, maduro y pasado por el examen de la práctica
- **`sklearn.decomposition.LatentDirichletAllocation`。**Usado para la experiencia simple LDA.
- **NMF。**La factorization de matriz no negativa.
- **Top2Vec。**Con BERTopic  similar design── comunidad menor, pero en algunos puntos de referencia arriba se muestra incorrecto──
- **FASTopic。**更新,在超大 corpora 上比BERTopic 更快──
- **LLM-based labeling。**运行任意 clustering, entonces pedir un modelo para cada cluster 命名──

## Envío

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-topic-picker.md`¿Qué es esto ?

```markdown
---
name: topic-picker
description: Pick LDA or BERTopic for a corpus. Specify library, knobs, evaluation.
version: 1.0.0
phase: 5
lesson: 15
tags: [nlp, topic-modeling]
---

Given a corpus description (document count, avg length, domain, language, compute budget), output:

1. Algorithm. LDA / NMF / BERTopic / Top2Vec / FASTopic. One-sentence reason.
2. Configuration. Number of topics: `recommended = max(5, round(sqrt(n_docs)))`, clamped to 200 for corpora under 40,000 docs; permit >200 only when the corpus is genuinely large (>40k) and note the increased compute cost. `min_df` / `max_df` filters and embedding model for neural approaches also belong here.
3. Evaluation. Topic coherence (c_v) via `gensim.models.CoherenceModel`, topic diversity, and a 20-sample human read.
4. Failure mode to probe. For LDA, "junk topics" absorbing stopwords and frequent terms. For BERTopic, the -1 outlier cluster swallowing ambiguous documents.

Refuse BERTopic on documents longer than the embedding model's context window without a chunking strategy. Refuse LDA on very short text (tweets, reviews under 10 tokens) as coherence collapses. Flag any n_topics choice below 5 as likely wrong; flag >200 on corpora under 40k docs as likely over-splitting.
```

## Los ejercicios

1. **Easy.**En 20 grupos de noticias conjunto de datos 上用 5 个话题 拟合 LDA──打印每话题的前十字──手动标注每话题──算法找到了真实类别?
2. **Medium.**En el mismo subconjunto de 20 grupos de noticias 上拟合BERTopic──将找到的话题 数量、顶词 和质量一致与LDA比较──¿Cuál es el más claro浮现真实类别?
3. **Hard.**En su corpus 上为 LDA 和 BERTopic 都计算c_v coherencia──分别用5、10、20、50 话题运行──绘制 coherence vs. topic count──报告哪种方法在不同话题 counts 下更稳定──

## Términos clave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Topic | corpus 在讲的一件事 | words 上的 probability distribution（LDA），或相似 documents 的 cluster（BERTopic）。 |
| Mixed membership | Doc 是多个 topics | LDA 为每个 document 分配一个覆盖所有 topics 的分布。 |
| UMAP | Dimensionality reduction | 保留局部结构的 manifold learning；用于 BERTopic。 |
| HDBSCAN | Density clustering | 查找可变大小 clusters；为 outliers 产生 "noise" label (-1)。 |
| c_v coherence | Topic quality metric | sliding windows 内 top topic words 的平均 pointwise mutual information。 |

## Leer más

- [Blei, Ng, Jordan (2003). Latent Dirichlet Allocation](https://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf) LDA 论文──
- [Grootendorst (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure](https://arxiv.org/abs/2203.05794) BERTópico 论文──
- [Röder, Both, Hinneburg (2015). Exploring the Space of Topic Coherence Measures](https://svn.aksw.org/papers/2015/WSDM_Topic_Evaluation/public.pdf) 引入 c_v 等指标的论文──
- [BERTopic documentation](https://maartengr.github.io/BERTopic/) 生产参考──例非常好──
