# Modelagem de tópicos  LDA e BERTopic

> LDA:documentos são tópicos de mistura, tópicos são palavras 上的分布──BERTópicos:documentos em embutidos espaços 中聚类, clusters são tópicos──objectivos são os mesmos, modo diferente de se deslocar──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word2Vec)
**Time:** ~45 分钟

## O problema

Você tem 10.000 artigos de bilhetes de suporte ao cliente 50.000 artigos de notícias, ou 200.000 artigos de tweets. Você precisa saber que essa coleção está falando. Você não tem categorias de marcação. Você nem sabe quantas categorias existem.

Modelagem de tópicos em caso de não supervisionamento responde a essa questão. Dá-lhe um corpus, obtém um grupo de tópicos conectados, e para cada documento obtém um tópico de distribuição.

两类算法家族占主导──LDA (2003) Colocar cada documento 视为潜题的混合,把每个题目 视为词上的分布──Inferência é bayesiana── ainda é usada para a necessidade de atribuições de tópicos de membros mistos 和可解释词级概率分布的生产环境──

BERTopic (2020) usa documentos de codificação BERT, usa UMAP 降维, usa HDBSCAN 聚类,并通过类型基于TF-IDF 提取话题词──它在短文本、社交媒体,以及任何语义相似之比词重叠更重要场景中胜出── um documento 得到一个话题,这对长形式内容是限制──

Esta aula irá construir um intuito entre os dois, e explicar o corpus que deve ser escolhido.

## O conceito

![LDA mixture model vs BERTopic clustering](../assets/topic-modeling.svg)

**LDA generative story。**Cada tópico é uma mistura de palavras. Cada documento é uma mistura de tópicos. Deve gerar uma palavra no documento, primeiro a partir da mistura de um tópico, depois a partir da distribuição do tópico.

关键 LDA saída:

- `doc_topic`:matrix `(n_docs, n_topics)`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,
- `topic_word`:matrix `(n_topics, vocab_size)`,每行和为 1 ((distribuição de palavras do tópico) ⋅

**BERTopic pipeline。**

1. Usar transformador de frases, por exemplo.`all-MiniLM-L6-v2`) codificar cada documento. 384 vetores de dimensão.
2. Utilize UMAP 降维到大约 5 维度. Embaixamentos emBERT para agrupamento para dimensiones muito altas.
3. Usar HDBSCAN 聚类── baseada na densidade, produzir grandes e variáveis aglomerados, e um rótulo "outlier"──
4. Para cada cluster, em documentos desse cluster, acima calcular TF-IDF baseado em classe, extrair as principais palavras:

输出是每个文件一个主题(外加 -1 outlier label) 也可以通过 HDBSCAN 变软会员


```figure
topic-drift
```

## Construí-lo

### Passo 1:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

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

Nota: remove stopwords,min_df 和 max_df 过罕见和无处不在的术语, use CountVectorizer( não TfidfVectorizer), pois LDA 期望原数。

### Passo 2: BERTopic (produzir)

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

`Topic != -1`O que é que é o "HBSCAN" (HBSCAN)`min_topic_size` controlar o tamanho mínimo do cluster do HDBSCAN; o valor de parâmetro da biblioteca do BERTopic é 10― neste exemplo, a escala do curso é definida como 15― para mais de 10.000 documentos, aumentando para 50 ou 100―.

### Passo 3: Avaliação

两种方法都会输出话题词――问题是这些词 是否连贯――

- **Topic coherence (c_v)。**Em contextos de janela deslizante 上组合顶词对的 NPMI(normalized pointwise mutual information),把分数聚合成话题向量,并通过共弦相似性比较这些向量──越高越好──使用 `gensim.models.CoherenceModel`Não está configurado`coherence="c_v"`- Não.
- **Topic diversity。**Todas as principais palavras de tópicos 中独特词的比例──越高越好(tópicos 不重叠)──
- **Qualitative inspection。**阅读每个话题的顶尖词――它们是否命名真实事物?

## Quando escolher qual

| Situation | Pick |
|-----------|------|
| 短文本（tweets、reviews、headlines） | BERTopic |
| 带 topic mixtures 的长 documents | LDA |
| 无 GPU / compute 受限 | LDA 或 NMF |
| 需要 document-level multi-topic distributions | LDA |
| 用于 topic labeling 的 LLM integration | BERTopic（直接支持） |
| 资源受限的 edge deployment | LDA |
| 最大 semantic coherence | BERTopic |

O maior considerável real é o comprimento do documento. Embutidos emBERT 会截断; LDA conta pode ser processada de qualquer comprimento.

## Usá-lo

Estaca 2026:

- **BERTopic。**短文本和任何语义 重要场景的默认选择──
- **`gensim.models.LdaModel`。**经典 LDA, para produção, madura e atravessada de verificações práticas
- **`sklearn.decomposition.LatentDirichletAllocation`。**Usado para a experiência simples LDA.
- **NMF。**Não-negativa factorization de matriz.
- **Top2Vec。**Com BERTopic  similar design── comunidade menor, mas em alguns benchmarks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- **FASTopic。**更新,在超大 corpora 上比BERTopic 更快──
- **LLM-based labeling。**运行任意 clustering, então pedir um modelo para cada cluster 命名──

## Envia-o

保存为 `outputs/skill-topic-picker.md`- Não .

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

## Exercícios

1. **Easy.**Em 20 grupos de notícias conjunto de dados 上用 5 个话题 拟合 LDA──打印每个话题的十个词语──手动标注每个话题──算法找到了真实类别?
2. **Medium.**No mesmo subconjunto de 20 Newsgroups 上拟合 BERTopic── vai encontrar tópicos números, palavras e coerência qualitativa com LDA比较── qual é mais claro浮现真实类别?
3. **Hard.**Em seu corpus, para LDA e BERTopic, todos os números de coerência são calculados.

## Termos-chave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Topic | corpus 在讲的一件事 | words 上的 probability distribution（LDA），或相似 documents 的 cluster（BERTopic）。 |
| Mixed membership | Doc 是多个 topics | LDA 为每个 document 分配一个覆盖所有 topics 的分布。 |
| UMAP | Dimensionality reduction | 保留局部结构的 manifold learning；用于 BERTopic。 |
| HDBSCAN | Density clustering | 查找可变大小 clusters；为 outliers 产生 "noise" label (-1)。 |
| c_v coherence | Topic quality metric | sliding windows 内 top topic words 的平均 pointwise mutual information。 |

## Mais leitura

- [Blei, Ng, Jordan (2003). Latent Dirichlet Allocation](https://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf) LDA 论文──
- [Grootendorst (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure](https://arxiv.org/abs/2203.05794) BERTópico 论文──
- [Röder, Both, Hinneburg (2015). Exploring the Space of Topic Coherence Measures](https://svn.aksw.org/papers/2015/WSDM_Topic_Evaluation/public.pdf) 引入 c_v 等指标的论文──
- [BERTopic documentation](https://maartengr.github.io/BERTopic/) 生产参考──例非常好──
