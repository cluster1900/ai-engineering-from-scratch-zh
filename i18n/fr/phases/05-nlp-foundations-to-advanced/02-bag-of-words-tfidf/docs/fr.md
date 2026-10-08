# Sac de mots ¦TF-IDF et représentation du texte

> Avant de compter, de réfléchir, jusqu'en 2026, le FDI-TF sur les missions de définition de la définition continue de surmonter les embedding.

**Type:** Build
**Languages:** Python
**先修要求：**Phase 5 · 01 (文本处理), phase 2 · 02 (régrésion linéaire à partir de zéro)
**Time:** ~75 分钟

##  problématique
Le modèle a besoin de chiffres.

Chaque ligne de pipeline de PNL doit répondre à la même question. Comment mettre un vecteur de taille fixe en ligne de manière à ce que les éléments de la catégorie de Token soient transformés en un vecteur ?

Ce vecteur a été soutenu par le niveau de production de la PNL, plus que toute autre embedding 模型都多──垃圾邮件过器、主题分类器、日志异常检测、搜索排序(BM25 之前) 、第一波情感分析、学术 NLP benchmark first decade──到2026年, les praticiens dans les tâches de classification 狭窄 任务 仍然将优先使用它──它速度快可解释, et dans la question de savoir si la PNL apparaît est la seule tâche clé, il y a presque aucune différence avec un modèle d'embedding de 400M 参数──

Le cours commence par la création de sacs de mots, puis la création de TF-IDF, puis la démonstration de l'apprentissage avec trois codes pour faire la même chose.

## 概念
**Bag of Words (BoW)**Pour chaque document, chaque expression de mot est apparue plusieurs fois.`i`C' est le mot`i`Le nombre de personnes.

**TF-IDF**Une fois que le texte est rédigé, le texte est rédigé en deux parties.

```
TF-IDF(w, d) = TF(w, d) * IDF(w)
             = count(w in d) / |d| * log(N / df(w))
```

Parmi eux `TF`La fréquence des termes est dans le document,`df`Il y a beaucoup de documents qui contiennent ce mot.`N`C'est le nombre total des archives.`log`Le pouvoir de maintenir un niveau de vie est limité.

关键性:二者都会产生具有可解释坐标轴的稀疏矢量──you can check the weight of the train 后分类器, read out which words will push the document to which category── Pour un embed BERT de 768 维, vous ne faites pas cela──


```figure
bow-tfidf
```

## - Je le construis.
### 步骤 1: construire le vocabulaire

```python
def build_vocab(docs):
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    return vocab
```

输入: déjà Tokenize 的文档列表(任意词级 Tokenizer 都可以;本课的 `code/main.py`Utilisez un petit changement de texte simplifié:`{word: index}`C'est le premier mot vu dans le premier document.

### 步骤 2: sac de mots

```python
def bag_of_words(docs, vocab):
    matrix = [[0] * len(vocab) for _ in docs]
    for i, doc in enumerate(docs):
        for token in doc:
            if token in vocab:
                matrix[i][vocab[token]] += 1
    return matrix
```

```python
>>> docs = [["cat", "sat", "on", "mat"], ["cat", "cat", "ran"]]
>>> vocab = build_vocab(docs)
>>> bag_of_words(docs, vocab)
[[1, 1, 1, 1, 0], [2, 0, 0, 0, 1]]
```

行是文档──列是词表索引──条目 `[i][j]`Prononcer`j`Dans les archives`i`Il y a eu plusieurs fois.`cat`Il est apparu deux fois, parce qu'il est apparu deux fois.`ran`Il est apparu à zéro, parce qu'il n'est pas apparu.

### 步骤 3: fréquence des termes et fréquence des documents

```python
import math


def term_frequency(doc_bow, doc_length):
    return [c / doc_length if doc_length else 0 for c in doc_bow]


def document_frequency(bow_matrix):
    df = [0] * len(bow_matrix[0])
    for row in bow_matrix:
        for j, count in enumerate(row):
            if count > 0:
                df[j] += 1
    return df


def inverse_document_frequency(df, n_docs):
    return [math.log((n_docs + 1) / (d + 1)) + 1 for d in df]
```

Il y a deux techniques de placement à la hauteur.`(n+1)/(d+1)`- Je ne veux pas .`log(x/0)`Le dernier.`+1` s'assurer que les mots apparaissent dans chaque document avec IDF 1 ((non 0), ce qui est conforme à l'acceptation de l'apprentissage peu instructif.`log(N/df)`◊二者都能工作;平滑版本更友好──

### 步骤 4: TF-IDF

```python
def tfidf(bow_matrix):
    n_docs = len(bow_matrix)
    df = document_frequency(bow_matrix)
    idf = inverse_document_frequency(df, n_docs)
    out = []
    for row in bow_matrix:
        length = sum(row)
        tf = term_frequency(row, length)
        out.append([tf_j * idf_j for tf_j, idf_j in zip(tf, idf)])
    return out
```

```python
>>> docs = [
...     ["the", "cat", "sat"],
...     ["the", "dog", "sat"],
...     ["the", "cat", "ran"],
... ]
>>> vocab = build_vocab(docs)
>>> bow = bag_of_words(docs, vocab)
>>> tfidf(bow)
```

Il y a trois mots, cinq expressions.`the`- Je suis là.`cat`- Je suis là.`sat`- Je suis là.`dog`- Je suis là.`ran`)。`the`Il est présent dans tous les trois archives, donc son IDF est bas.`dog`Il n'apparaît qu'une seule fois, donc ses IDF 高──这些矢量是稀疏的──大多数条目都很小),判别性词会凸显──

### 步骤 5: L2- normaliser les lignes

```python
def l2_normalize(matrix):
    out = []
    for row in matrix:
        norm = math.sqrt(sum(x * x for x in row))
        out.append([x / norm if norm else 0 for x in row])
    return out
```

Si on ne le regroupe pas, les documents plus longs obtiendront un vecteur plus grand, et dominera le nombre de points de similitude. La normalisation L2 mettra chaque document en unité sur la surface de la planète.

## Utilisez-le
Sikit-learn a fourni une version de production.

```python
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

docs = ["the cat sat on the mat", "the dog sat on the mat", "the cat ran"]

bow_vectorizer = CountVectorizer()
bow = bow_vectorizer.fit_transform(docs)
print(bow_vectorizer.get_feature_names_out())
print(bow.toarray())

tfidf_vectorizer = TfidfVectorizer()
tfidf = tfidf_vectorizer.fit_transform(docs)
print(tfidf.toarray().round(3))
```

`CountVectorizer`Dans une fois调用中完成Tokenisation、词表构建和BoW──`TfidfVectorizer`Les données de l'équipe de l'armée de l'air sont en cours de révision.

Il peut tout changer.

| Arg | Effect |
|-----|--------|
| `ngram_range=(1, 2)` | 包含 bigram。通常会提升 Classification。 |
| `min_df=2` | 丢弃出现在少于 2 个文档中的词。在噪声数据上裁剪词表。 |
| `max_df=0.95` | 丢弃出现在超过 95% 文档中的词。不使用硬编码列表也能近似移除 stopword。 |
| `stop_words="english"` | scikit-learn 内置的 stopword 列表。取决于任务——情感分析不应该丢弃否定词。 |
| `sublinear_tf=True` | 使用 `1 + log(tf)` 而不是原始 `tf`。当某个 term 在一个文档中重复很多次时有帮助。 |

### TF-IDF 仍然胜出的场景 (截至 2026 年)

- Le fait que le mot apparaisse est essentiel; la différence de signification est peu importante.
- 低数据场景(100带标签样本) ――TF-IDF 加物流回归 没有预训成本──
- 任何地方对延迟敏感的──TF-IDF 加线性模型可以在微秒级中提供答案──通过变压器对文档做嵌入 需要10-100ms──
- Il faut expliquer le système de résultats prévisionnels.

### Lorsque le TF-IDF échoue

语义盲区失败──考虑这两个文档:

- "Le film n'était pas du tout bon".
- "Le film était excellent".

Une est une réaction négative. Une est une réaction positive.`{the, movie, was}`Les mots doivent être mémorisés.`not`- À proximité .`good`Il est possible de le comprendre, mais il ne comprend jamais le modèle de la linguistique.

另一个失败:推理时遇到出口词典词──一个在IMDb 评论上训练的BoW 模型,如果 `Zoomer-approved`Ce jeton n'est pas encore apparu dans l'entraînement, il ne sait pas comment le traiter.

### Hybride: TF-IDF 加权 Embedding

Le programme de classification des données de 2026: utilisation du TF-IDF 权重

```python
def tfidf_weighted_embedding(doc, tfidf_scores, embedding_table, dim):
    vec = [0.0] * dim
    total_weight = 0.0
    for token in doc:
        if token not in embedding_table or token not in tfidf_scores:
            continue
        weight = tfidf_scores[token]
        emb = embedding_table[token]
        for i in range(dim):
            vec[i] += weight * emb[i]
        total_weight += weight
    if total_weight == 0:
        return vec
    return [v / total_weight for v in vec]
```

Vous avez obtenu une capacité de synthèse, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent rare, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un accent particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu particulier, un peu de l'autre, un peu de l'autre, un peu de l'autre, un peu de l'autre, un peu de l'autre, un peu de l'autre, un peu de l'autre, un peu de l'autre, un peu de l'autre, peut être un peu de l'autre, un peu de l'autre, un peu de l'autre, un autre, un autre, un peu de l'autre, un peu de l'autre, un autre, un autre, un peu de l'autre, un autre, un peu de l'autre, un autre, un peu de l'autre, un autre, un

## Je le livre.
保存为 `outputs/prompt-vectorization-picker.md`- Le numéro de la liste:

```markdown
---
name: vectorization-picker
description: 给定一个文本 Classification 任务，推荐 BoW、TF-IDF、Embeddings 或 hybrid。
phase: 5
lesson: 02
---

你推荐一种文本 Vectorization 策略。给定任务描述，输出：

1. Representation（BoW、TF-IDF、Transformer Embeddings，或 hybrid）。用一句话解释原因。
2. 具体的 vectorizer 配置。写出库名。引用参数（`ngram_range`、`min_df`、`max_df`、`sublinear_tf`、`stop_words`）。
3. 发布前要测试的一个失败模式。

当用户少于 500 个带标签样本时，拒绝推荐 Embeddings，除非他们展示了 TF-IDF baseline 存在语义失败的证据。拒绝为情感分析移除 stopwords（否定词携带信号）。指出类别不平衡需要的不只是更改 vectorizer。

Example input: "Classifying 30k customer support tickets into 12 categories. Most tickets are 2-3 sentences. English only. Need explainability for audit logs."

Example output:

- Representation: TF-IDF。30k 个样本不算少；可解释性要求排除了 dense Embeddings。
- Config: `TfidfVectorizer(ngram_range=(1, 2), min_df=3, max_df=0.95, sublinear_tf=True, stop_words=None)`。保留 stopwords，因为类别关键词有时就是 stopwords（"not working" vs "working"）。
- Failure to test: 验证 `min_df=3` 不会丢弃稀有类别关键词。运行 `get_feature_names_out`，按类别筛选并人工检查。
```

## 练习
1. **Easy.**Dans L2 normalisé TF-IDF 输出上实现 `cosine_similarity(doc_vec_a, doc_vec_b)` Évaluation du même document avec un score de 1.0, les états de référence avec un score de 0.0♦
2. **Medium.**Je vous en donne .`bag_of_words`添加 `n-gram`支持──参数 `n`J' ai été créé .`n`-grammes de chiffres.`n=2`作用于`["the", "cat", "sat"]`Je vais faire ça.`["the cat", "cat sat"]`Il est devenu un grand nombre.
3. **Hard.**Utilisation de vecteurs GloVe 100d (en anglais) (en anglais)

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BoW | 词频 Vector | 一个文档中词表词的计数。丢弃顺序。 |
| TF | Term frequency | 一个词在文档中的计数，可选地按文档长度归一化。 |
| DF | Document frequency | 至少包含该词一次的文档数量。 |
| IDF | Inverse document frequency | 平滑后的 `log(N / df)`。降低到处都出现的词的权重。 |
| Sparse vector | 大多为零 | 词表通常有 10k-100k 个词；对任意给定文档来说，大多数词都不存在。 |
| Cosine similarity | Vector 夹角 | L2-normalized vectors 的 dot product。1 表示相同，0 表示正交。 |

## 延伸阅读
- [scikit-learn — feature extraction from text](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) 权威 API 参考,并包含每个旋的说明──
- [Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text retrieval](https://www.sciencedirect.com/science/article/pii/0306457388900210) 让TF-IDF 成为十年默认方法论文──
- ["Why TF-IDF Still Beats Embeddings" — Ashfaque Thonikkadavan (Medium)](https://medium.com/@cmtwskb/why-tf-idf-still-beats-embeddings-ad85c123e1b2) 2026 ans à l'ancienne méthode 何時胜出以及原因解讀──
