# 主题建模  LDA 和 BERTopic

> 文件是主题的混合,主题是单词上的分布――BER

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word2Vec)
**Time:** ~45 分钟

## 问题

你有1万条客户支持门票,5万条新闻文章或200万条推文――你需要在不读它们的情况下知道这个集合在讲什么――你没有标签类别――你甚至不知道有多少类别――

问题在没有监督的情况下回答这个问题.给它一个体积,得到一小组连贯的主题,并对每个文件得到一个主题上分布.

两类算法家族占主导――LDA (2003) 把每个文件视为隐藏的主题的混合,把每个主题视为词上的分布――推理是贝耶斯式――它仍然用于需要混合成员主题分配和可解释词级概率分布的生产环境――

通过类型基于TF-IDF提取话题词――它在短文本、社交媒体,以及任何语义相似之处比词汇重叠更重要场景中胜出――一个文档得到一个话题,这对长形式内容是限制――

这课将为两者建立直觉,并说明给定体 时应选择哪个.

## 概念

![LDA mixture model vs BERTopic clustering](../assets/topic-modeling.svg)

**LDA generative story。**每个主题都是词上的分布. 每个文档是主题的混合. 必须在文档中生成一个词,首先从文档的混合中采样一个话题,然后从该主题的分布中采样一个词. 推理反过来做:给定观测到的词,推断每个文档的主题分布,以及每个主题的词分布.

关键 LDA输出:

- `doc_topic`列表`(n_docs, n_topics)`文件的主题混合)
- `topic_word`列表`(n_topics, vocab_size)`单词分布为 1 ((主题的词分布)

**BERTopic pipeline。**

1. 用语句变换器 (例如)`all-MiniLM-L6-v2`)编码每一个文件──384维向量──
2. 用UMAP 降维到大约5维度.
3. 用HDBSCAN聚类.基于密度,产生可变的大小集群和一个"异端"标签.
4. 对于每个集群,在该集群的文件上计算基于类的TF-IDF,提取顶级词语.

输出是每个文件一个主题 (外加 -1外标签) 也可以通过HDBSCAN的概率向量 得到软会员


```figure
topic-drift
```

## 建立它

### 通过学习实现LDA

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

注意:移除停止字,min_df 和 max_df 过罕见和无处不在的术语,使用 CountVectorizer(不是 TfidfVectorizer),因为LDA 期望原始数量。

### 步骤2:BERTopic (生产)

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

`Topic != -1`上的过会丢弃BERTopic的外观桶(HDBSCAN 无法收集文件)`min_topic_size`控制HDBSCAN的最小集群大小;BERTopic的库默认值为10──本例为本课程的规模显然设为15──对于超过10,000个文件的体格,增加到50或100──

### 步骤3:评估

两种方法都会输出话题词.

- **Topic coherence (c_v)。**在滑窗文本上组合顶级词对的NPMI(正常化的点向互通信息),把分数聚合成主题向量,并通过共数相似比较这些向量──越高越好──使用`gensim.models.CoherenceModel`并设置`coherence="c_v"`,我知道.
- **Topic diversity。**所有主题的顶级词 中独特词的比例──越高越好──主题不重叠──
- **Qualitative inspection。**阅读每个话题的顶级词语.它们是否命名为真实事物?

## 什么时候选择哪个

| Situation | Pick |
|-----------|------|
| 短文本（tweets、reviews、headlines） | BERTopic |
| 带 topic mixtures 的长 documents | LDA |
| 无 GPU / compute 受限 | LDA 或 NMF |
| 需要 document-level multi-topic distributions | LDA |
| 用于 topic labeling 的 LLM integration | BERTopic（直接支持） |
| 资源受限的 edge deployment | LDA |
| 最大 semantic coherence | BERTopic |

最大的实际考量是文档长度――BERT嵌入式 会截断;LDA数量可处理任意长度――对于超过嵌入式模型文本的文档,要么是块+集体,要么是使用LDA――

## 用它

根据第1个单元的规定,

- **BERTopic。**短文本和任何语义 重要场景的默认选择.
- **`gensim.models.LdaModel`。**经典LDA,用于生产,成熟且经过实战检查.
- **`sklearn.decomposition.LatentDirichletAllocation`。**实验的简单LDA.
- **NMF。**没有负矩阵因子化――LDA的快速替代方案,在短文本上质量相当――
- **Top2Vec。**与BERTopic类似的设计.社区更小,但在一些基准上表现不错.
- **FASTopic。**更新,在超大公司上比BERTopic更快.
- **LLM-based labeling。**运行任意的集群,然后提示一个模型为每个集群命名.

## 运送它

保存为`outputs/skill-topic-picker.md`其他:

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

## 运动

1. **Easy.**在20个新闻群数据集 上使用5个主题 拟合LDA――打印每个主题的前10个字――手动标注每个主题――算法找到了真实类别吗?
2. **Medium.**在同一个20个新闻小组上拟合BERTopic――将找到的话题 数量,顶级词和与LDA相比较的质量一致性――哪个更清晰地浮现真实类别?
3. **Hard.**在你的体内 上为LDA 和BERTopic 都计算c_v连贯性――分别使用5、10、20、50个主题运行――绘制连贯性与主题数量――报告哪种方法在不同主题数量 下更稳定――

## 关键词

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Topic | corpus 在讲的一件事 | words 上的 probability distribution（LDA），或相似 documents 的 cluster（BERTopic）。 |
| Mixed membership | Doc 是多个 topics | LDA 为每个 document 分配一个覆盖所有 topics 的分布。 |
| UMAP | Dimensionality reduction | 保留局部结构的 manifold learning；用于 BERTopic。 |
| HDBSCAN | Density clustering | 查找可变大小 clusters；为 outliers 产生 "noise" label (-1)。 |
| c_v coherence | Topic quality metric | sliding windows 内 top topic words 的平均 pointwise mutual information。 |

## 进一步阅读

- [Blei, Ng, Jordan (2003). Latent Dirichlet Allocation](https://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf) LDA 论文──
- [Grootendorst (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure](https://arxiv.org/abs/2203.05794) BERTopic 论文──
- [Röder, Both, Hinneburg (2015). Exploring the Space of Topic Coherence Measures](https://svn.aksw.org/papers/2015/WSDM_Topic_Evaluation/public.pdf) 引入了等标志论文.
- [BERTopic documentation](https://maartengr.github.io/BERTopic/) 生产参考――例子非常好――
