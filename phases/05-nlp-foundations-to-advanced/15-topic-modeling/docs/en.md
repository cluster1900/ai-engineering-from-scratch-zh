# Topic Modeling — LDA and BERTopic

> LDA：documents 是 topics 的混合，topics 是 words 上的分布。BERTopic：documents 在 embedding space 中聚类，clusters 就是 topics。目标相同，分解方式不同。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word2Vec)
**Time:** ~45 分钟

## The Problem

你有 10,000 条 customer support tickets、50,000 篇 news articles，或 200,000 条 tweets。你需要在不阅读它们的情况下知道这个集合在讲什么。你没有标注类别。你甚至不知道有多少类别存在。

Topic modeling 在没有监督的情况下回答这个问题。给它一个 corpus，得到一小组连贯 topics，并且对每个 document 得到一个 topics 上的分布。

两类算法家族占主导。LDA (2003) 把每个 document 视为 latent topics 的混合，把每个 topic 视为 words 上的分布。Inference 是 Bayesian。它仍然用于需要 mixed-membership topic assignments 和可解释 word-level probability distributions 的生产环境。

BERTopic (2020) 用 BERT 编码 documents，用 UMAP 降维，用 HDBSCAN 聚类，并通过 class-based TF-IDF 提取 topic words。它在短文本、社交媒体，以及任何 semantic similarity 比 word overlap 更重要的场景中胜出。一个 document 得到一个 topic，这对 long-form content 是限制。

本课会为两者建立直觉，并说明给定 corpus 时该选哪一个。

## The Concept

![LDA mixture model vs BERTopic clustering](../assets/topic-modeling.svg)

**LDA generative story。** 每个 topic 是 words 上的分布。每个 document 是 topics 的混合。要在 document 中生成一个 word，先从 document 的混合中采样一个 topic，再从该 topic 的分布中采样一个 word。Inference 反过来做：给定观测到的 words，推断每个 document 的 topic distribution，以及每个 topic 的 word distribution。Collapsed Gibbs sampling 或 variational Bayes 完成数学部分。

关键 LDA output：

- `doc_topic`：matrix `(n_docs, n_topics)`，每行和为 1（document 的 topic mixture）。
- `topic_word`：matrix `(n_topics, vocab_size)`，每行和为 1（topic 的 word distribution）。

**BERTopic pipeline。**

1. 用 sentence transformer（例如 `all-MiniLM-L6-v2`）编码每个 document。384-dim vectors。
2. 用 UMAP 降维到约 5 维。BERT embeddings 对 clustering 来说维度太高。
3. 用 HDBSCAN 聚类。基于密度，产生可变大小 clusters 和一个 "outlier" label。
4. 对每个 cluster，在该 cluster 的 documents 上计算 class-based TF-IDF，提取 top words。

输出是每个 document 一个 topic（外加 -1 outlier label）。也可以通过 HDBSCAN 的 probability vector 得到 soft membership。

## Build It

### Step 1: 通过 scikit-learn 实现 LDA

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

注意：移除 stopwords，min_df 和 max_df 过滤罕见和无处不在的 terms，使用 CountVectorizer（不是 TfidfVectorizer），因为 LDA 期望 raw counts。

### Step 2: BERTopic（生产）

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

`Topic != -1` 上的过滤会丢弃 BERTopic 的 outlier bucket（HDBSCAN 无法聚类的 documents）。`min_topic_size` 控制 HDBSCAN 的最小 cluster size；BERTopic 的 library 默认值是 10。本示例为本课规模显式设为 15。对于超过 10,000 个 documents 的 corpora，增加到 50 或 100。

### Step 3: evaluation

两种方法都会输出 topic words。问题是这些 words 是否连贯。

- **Topic coherence (c_v)。** 在 sliding-window contexts 上组合 top-word pairs 的 NPMI（normalized pointwise mutual information），把分数聚合成 topic vectors，并通过 cosine similarity 比较这些 vectors。越高越好。使用 `gensim.models.CoherenceModel` 并设置 `coherence="c_v"`。
- **Topic diversity。** 所有 topics 的 top words 中 unique words 的比例。越高越好（topics 不重叠）。
- **Qualitative inspection。** 阅读每个 topic 的 top words。它们是否命名了真实事物？Human judgment 仍然是最后一道防线。

## When to pick which

| Situation | Pick |
|-----------|------|
| 短文本（tweets、reviews、headlines） | BERTopic |
| 带 topic mixtures 的长 documents | LDA |
| 无 GPU / compute 受限 | LDA 或 NMF |
| 需要 document-level multi-topic distributions | LDA |
| 用于 topic labeling 的 LLM integration | BERTopic（直接支持） |
| 资源受限的 edge deployment | LDA |
| 最大 semantic coherence | BERTopic |

最大的实际考量是 document length。BERT embeddings 会截断；LDA counts 可以处理任意长度。对于超过 embedding model context 的 documents，要么 chunk + aggregate，要么使用 LDA。

## Use It

2026 stack：

- **BERTopic。** 短文本和任何 semantics 重要场景的默认选择。
- **`gensim.models.LdaModel`。** 经典 LDA，用于生产，成熟且经过实战检验。
- **`sklearn.decomposition.LatentDirichletAllocation`。** 用于实验的简单 LDA。
- **NMF。** Non-negative matrix factorization。LDA 的快速替代方案，在短文本上质量相当。
- **Top2Vec。** 与 BERTopic 类似的设计。社区更小，但在一些 benchmarks 上表现不错。
- **FASTopic。** 更新，在超大 corpora 上比 BERTopic 更快。
- **LLM-based labeling。** 运行任意 clustering，然后 prompt 一个模型为每个 cluster 命名。

## Ship It

保存为 `outputs/skill-topic-picker.md`：

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

## Exercises

1. **Easy.** 在 20 Newsgroups dataset 上用 5 个 topics 拟合 LDA。打印每个 topic 的 top 10 words。手动标注每个 topic。算法找到了真实类别吗？
2. **Medium.** 在同一个 20 Newsgroups subset 上拟合 BERTopic。将找到的 topics 数量、top words 和 qualitative coherence 与 LDA 比较。哪个更清晰地浮现真实类别？
3. **Hard.** 在你的 corpus 上为 LDA 和 BERTopic 都计算 c_v coherence。分别用 5、10、20、50 个 topics 运行。绘制 coherence vs topic count。报告哪种方法在不同 topic counts 下更稳定。

## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Topic | corpus 在讲的一件事 | words 上的 probability distribution（LDA），或相似 documents 的 cluster（BERTopic）。 |
| Mixed membership | Doc 是多个 topics | LDA 为每个 document 分配一个覆盖所有 topics 的分布。 |
| UMAP | Dimensionality reduction | 保留局部结构的 manifold learning；用于 BERTopic。 |
| HDBSCAN | Density clustering | 查找可变大小 clusters；为 outliers 产生 "noise" label (-1)。 |
| c_v coherence | Topic quality metric | sliding windows 内 top topic words 的平均 pointwise mutual information。 |

## Further Reading

- [Blei, Ng, Jordan (2003). Latent Dirichlet Allocation](https://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf) — LDA 论文。
- [Grootendorst (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure](https://arxiv.org/abs/2203.05794) — BERTopic 论文。
- [Röder, Both, Hinneburg (2015). Exploring the Space of Topic Coherence Measures](https://svn.aksw.org/papers/2015/WSDM_Topic_Evaluation/public.pdf) — 引入 c_v 等指标的论文。
- [BERTopic documentation](https://maartengr.github.io/BERTopic/) — 生产参考。示例非常好。
