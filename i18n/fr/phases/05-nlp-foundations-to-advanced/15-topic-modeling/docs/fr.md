# Modélisation de thèmes  LDA et BERTopic

> LDA:documents sont des sujets mélangés, les sujets sont des mots 上的分布──BERThomic:documents dans l'espace de mise en place 中聚类, clusters 就是 topics──目标相同,分解方式不同──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word2Vec)
**Time:** ~45 分钟

## Le problème

Vous avez 10 000 billets de support client, 50 000 articles d'actualité ou 200 000 tweets. Vous devez savoir ce que cette collection dit sans les lire. Vous n'avez pas de catégories de marquage.

Le modèle de thèmes répond à cette question sans surveillance. Il donne un corpus, obtient un groupe de sujets en continu et une distribution de sujets pour chaque document.

两类算法家族占主导──LDA (2003) Placez chaque document 视为隐藏话题的混合,把每个话题 视为词上的分布──Inference is Bayesian──它仍然用于需要混合成员类话题 assignments 和可解释词级概率分布的生产环境──

BERTopic (2020) utilise des documents de codage BERT, utilise UMAP 降维, utilise HDBSCAN 聚类, et par le biais de TF-IDF 提取 topic words──it est dans les textes courts, les médias sociaux, ainsi que toute similitude sémantique par rapport au chevauchement de mots.

Ce cours sera pour les deux d'établir un intuition, et d'expliquer à déterminer le corps  quand choisir lequel 

## Le concept

![LDA mixture model vs BERTopic clustering](../assets/topic-modeling.svg)

**LDA generative story。**Chaque sujet est une combinaison de mots. Chaque document est une combinaison de sujets. Il faut générer un mot dans le document, d'abord à partir de l'échantillon de mélange de documents, puis à partir de la distribution de ce sujet.

关键 sortie de LDA:

- `doc_topic`: matrice `(n_docs, n_topics)`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,
- `topic_word`: matrice `(n_topics, vocab_size)`,每行和为 1 ((distribution des mots du sujet) ⋅

**BERTopic pipeline。**

1. Utilisez le transformateur de phrases`all-MiniLM-L6-v2`) code chaque document ⋅ vecteurs de 384 dimensions ⋅
2. Utilisez UMAP 降维到大约 5 维──BERT intégrations pour le regroupement de dimension 维度太高──
3. Utilisation de l'étiquette HDBSCAN 聚类── basée sur la densité, produisant des groupes de taille variable et un label "outlier"──
4. Pour chaque cluster, dans les documents de ce cluster, il faut calculer TF-IDF basé sur la classe, et utiliser les mots les plus importants.

输出是每个文件一个主题 (外加 -1 outlier label) 也可以通过HDBSCAN的概率向量 得到软会员


```figure
topic-drift
```

## Faites-le

### Étape 1:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

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

Remarque: déplacez les mots d'arrêt, min_df 和 max_df 过罕见和无处不在的术语, utilisez CountVectorizer(pas TfidfVectorizer), car LDA 期望原数。

### Étape 2: BERTopic (production)

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

`Topic != -1`Le plus haut niveau de la liste des documents de la société est le plus bas de la liste des documents de la société.`min_topic_size` contrôler la taille minimale du cluster HDBSCAN; la valeur par défaut de la bibliothèque de BERTopic est 10♦ Dans cet exemple, la taille de la classe est clairement fixée à 15♦ pour plus de 10 000 documents, augmenter à 50 ou 100♦

### Étape 3: évaluation

两种方法都会输出话题词――问题是这些词 是否连贯――

- **Topic coherence (c_v)。**Dans les contextes de fenêtre coulissante 上组合 top-word pairs de NPMI(informations mutuelles normalizées point de vue),把分数聚合成对象向量,并通过共性相似比较这些向量──越高越好──使用 `gensim.models.CoherenceModel`Il est mis en place`coherence="c_v"`Il y a une autre.
- **Topic diversity。**Proportion de mots uniques en termes de tous les sujets.
- **Qualitative inspection。**Les mots les plus importants de chaque sujet.

## Quand choisir lequel

| Situation | Pick |
|-----------|------|
| 短文本（tweets、reviews、headlines） | BERTopic |
| 带 topic mixtures 的长 documents | LDA |
| 无 GPU / compute 受限 | LDA 或 NMF |
| 需要 document-level multi-topic distributions | LDA |
| 用于 topic labeling 的 LLM integration | BERTopic（直接支持） |
| 资源受限的 edge deployment | LDA |
| 最大 semantic coherence | BERTopic |

Le plus grand calcul réel est la longueur du document. Les emplacements BERT seront coupés; les comptes LDA peuvent être traités de toute longueur. Pour les documents qui dépassent le contexte du modèle d'embedding, soit un morceau + un agrégat, soit un LDA.

## Utilisez-le

L'étape 2026:

- **BERTopic。**短文本和任何语义 重要场景的默认选择──
- **`gensim.models.LdaModel`。**经典 LDA, utilisé pour la production, mature et passé par des contrôles de guerre
- **`sklearn.decomposition.LatentDirichletAllocation`。**Utilisé pour l'expérimentation simple LDA.
- **NMF。**Factorisation de matrice non négative. Le schéma de rapid substitution de LDA, en français, est équivalent à la qualité.
- **Top2Vec。**Avec BERTopic  similaire à la conception.
- **FASTopic。**更新, dans les super grandes corporations 升高比BERTopic 更快──
- **LLM-based labeling。**运行任意 clustering, puis demander un modèle pour chaque cluster 命名。

## La faire partir

保存为 `outputs/skill-topic-picker.md`- Le numéro de la liste:

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

## Exercices

1. **Easy.**Dans 20 groupes de nouvelles, le ensemble de données est utilisé avec 5 sujets qui correspondent à lda.
2. **Medium.**Dans le même sous-ensemble de 20 groupes de nouvelles, il y aura des sujets qui correspondent au BERTopic.
3. **Hard.**Dans votre corpus, vous pouvez calculer la cohérence entre les différents sujets.

## Les termes clés

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Topic | corpus 在讲的一件事 | words 上的 probability distribution（LDA），或相似 documents 的 cluster（BERTopic）。 |
| Mixed membership | Doc 是多个 topics | LDA 为每个 document 分配一个覆盖所有 topics 的分布。 |
| UMAP | Dimensionality reduction | 保留局部结构的 manifold learning；用于 BERTopic。 |
| HDBSCAN | Density clustering | 查找可变大小 clusters；为 outliers 产生 "noise" label (-1)。 |
| c_v coherence | Topic quality metric | sliding windows 内 top topic words 的平均 pointwise mutual information。 |

## Pour en savoir plus

- [Blei, Ng, Jordan (2003). Latent Dirichlet Allocation](https://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf) LDA 论文。
- [Grootendorst (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure](https://arxiv.org/abs/2203.05794) BERTopic 论文──
- [Röder, Both, Hinneburg (2015). Exploring the Space of Topic Coherence Measures](https://svn.aksw.org/papers/2015/WSDM_Topic_Evaluation/public.pdf) 引入 c_v 等指标的论文──
- [BERTopic documentation](https://maartengr.github.io/BERTopic/) 生产参考──exemple très bon──
