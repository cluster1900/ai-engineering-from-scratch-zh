---
id: text-processing-classic
title: Classic Text Processing and TF-IDF
code: CT
subtitle: 分词、词干、词形还原、计数、用 TF-IDF 加权、分类情感，并用 LDA 或 BERTopic 找主题。
hue: 30
sources: phases/05-nlp-foundations-to-advanced/01-text-processing, phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf, phases/05-nlp-foundations-to-advanced/05-sentiment-analysis, phases/05-nlp-foundations-to-advanced/15-topic-modeling
source_hash: 8993666a55a0debd
---

## 经典文本流水线
type: flow
from: phases/05-nlp-foundations-to-advanced/01-text-processing/docs/en.md, phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md, phases/05-nlp-foundations-to-advanced/05-sentiment-analysis/docs/en.md

1. **Tokenize**：把字符串切成词 token。把标点留作独立 token。
2. **Stem 或 lemmatize**：要速度就做词干。含义重要时带 POS 标签做词形还原。
3. **否定范围**：在否定词之后到标点之前，给 token 加上 `NOT_` 前缀。
4. **Count**：词袋。每行一个文档，每列一个词表词。
5. **Weight**：TF-IDF 压低常见词。L2 行让余弦变成点积。
6. **Classify**：基线用朴素贝叶斯，生产用逻辑回归。
7. **Evaluate**：每类精确率与召回率、macro-F1、混淆矩阵。

## 代码中的任务
type: task-table
span: 2
from: phases/05-nlp-foundations-to-advanced/01-text-processing/code/main.py, phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/code/main.py, phases/05-nlp-foundations-to-advanced/05-sentiment-analysis/docs/en.md, phases/05-nlp-foundations-to-advanced/15-topic-modeling/code/main.py

| 任务 | 代码 |
|---|---|
| 分词、词干和词形还原 | `preprocess(text, pos_tagger=demo_pos_tagger)` |
| Porter 步骤 1a | `stem_step_1a(word)` |
| 带回退的表查找词形还原 | `lemmatize(word, pos)` |
| 计数矩阵 | `bag_of_words(docs, build_vocab(docs))` |
| 单位球面上的 TF-IDF 行 | `l2_normalize(tfidf(bow))` |
| 限定否定范围 | `apply_negation(tokens)` |
| 朴素贝叶斯基线 | `train_nb(docs_by_class, vocab, alpha=1.0)` |
| 用折叠 Gibbs 采样做 LDA | `collapsed_gibbs_lda(docs, n_topics=3, n_iters=300, seed=42)` |

## NLTK：token、词干、lemma
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/01-text-processing/docs/en.md

```python
nltk.download("punkt_tab")
nltk.download("wordnet")
nltk.download("averaged_perceptron_tagger_eng")
tokens = word_tokenize(text)                      # contractions, Unicode
stems = [PorterStemmer().stem(t) for t in tokens] # all five phases
tagged = pos_tag(tokens)                          # Penn Treebank tags
lemmatizer = WordNetLemmatizer()
lemmas = [lemmatizer.lemmatize(t, nltk_pos_to_wordnet(tag)) for t, tag in tagged]  # V>v J>a R>r else n
```

## scikit-learn 中的情感基线
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/05-sentiment-analysis/docs/en.md

```python
pipe = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),       # bigrams, so not_good is a feature
        min_df=2,
        sublinear_tf=True,        # dampens repeated words
        stop_words=None)),        # keeps negations
    ("clf", LogisticRegression(C=1.0, max_iter=1000)),
])
pipe.fit(X_train, y_train)
print(pipe.score(X_test, y_test))  # 75% to 85% on SST-2 with the 3 flags
```

## Vectorizer 旋钮
type: command-table
from: phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md

| 命令 | 作用 |
|---|---|
| `CountVectorizer()` | 一次调用完成分词、词表和 BoW |
| `TfidfVectorizer()` | 加上 IDF 加权和 L2 归一化 |
| `ngram_range=(1, 2)` | 包含 bigram。通常能提升分类 |
| `min_df=2` | 丢掉出现在少于 2 个文档中的词 |
| `max_df=0.95` | 丢掉出现在超过 95% 文档中的词 |
| `stop_words="english"` | 内置停用词表。不用于情感 |
| `sublinear_tf=True` | 用 `1 + log(tf)` 代替原始 `tf` |
| `get_feature_names_out()` | 按列顺序列出词表 |

## 主题模型
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/15-topic-modeling/docs/en.md

```python
cv = CountVectorizer(max_features=max_features, stop_words="english",
                     min_df=2, max_df=0.9)   # LDA needs raw counts
X = cv.fit_transform(documents)
lda = LatentDirichletAllocation(n_components=n_topics, random_state=42,
                                max_iter=50, learning_method="online")
doc_topic = lda.fit_transform(X)           # (n_docs, n_topics), rows sum to 1
topic_model = BERTopic(
    embedding_model="sentence-transformers/all-MiniLM-L6-v2",
    min_topic_size=15)                     # library default is 10
topics, probs = topic_model.fit_transform(documents)
info = topic_model.get_topic_info()       # Topic -1 is the outlier bucket
```

## 公式
type: concepts
from: phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md, phases/05-nlp-foundations-to-advanced/05-sentiment-analysis/docs/en.md, phases/05-nlp-foundations-to-advanced/15-topic-modeling/docs/en.md

- **TF-IDF**：$\frac{\mathrm{count}(w \text{ in } d)}{|d|} \cdot \log\frac{N}{\mathrm{df}(w)}$
- **平滑 IDF**：$\log\frac{n + 1}{d + 1} + 1$。每个文档都出现的词保持 IDF 1。
- **L2 行**：把每行除以它的范数。长文档不再占主导。
- **朴素贝叶斯**：对数先验加上对数 $P(\text{word} \mid \text{class})$ 的和。取最大。
- **Laplace**：$(\mathrm{count} + \alpha) / (\mathrm{total} + \alpha |V|)$。没有零概率。
- **逻辑回归**：$Xw + b$ 的 sigmoid。在 0.5 或以上预测 1。
- **Macro-F1**：每类 F1 的均值，等权。
- **c_v 连贯性**：top-word 对的 NPMI，用余弦比较。越高越好。

## 默认值
type: defaults
from: phases/05-nlp-foundations-to-advanced/05-sentiment-analysis/docs/en.md, phases/05-nlp-foundations-to-advanced/15-topic-modeling/docs/en.md, phases/05-nlp-foundations-to-advanced/15-topic-modeling/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| NB `alpha` | 1.0 | 教学默认值。实践中常用 0.01 |
| LR `l2` | 0.01 | 从这里开始再调。稀疏特征会过拟合 |
| LR `epochs`、`lr` | 500 | 学习率 0.05 |
| LR `C` | 1.0 | 在 scikit-learn 中配合 `max_iter=1000` |
| BERTopic `min_topic_size` | 10 | 超过 10,000 个文档时用 50 或 100 |
| Gibbs `alpha`、`beta` | 0.1 | Beta 是 0.01。二者都必须为正 |
| Gibbs `n_iters` | 200 | 演示跑 300 |
| 主题数 | `max(5, round(sqrt(n_docs)))` | 不到 40,000 个文档时钳到 200 |

## 排障
type: troubleshooting
from: phases/05-nlp-foundations-to-advanced/01-text-processing/docs/en.md, phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md, phases/05-nlp-foundations-to-advanced/05-sentiment-analysis/docs/en.md, phases/05-nlp-foundations-to-advanced/15-topic-modeling/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 部署后准确率下降 | 训练与推理的预处理不同 | 在模型里随一份预处理函数一起交付 |
| 升级后 token 变了 | 库版本漂移 | 钉住版本。冻结 20 个样例句 |
| `ponies` 词干变成 `poni` | 只有步骤 1a 的 `ies` 规则 | 使用带步骤 1b 的完整 Porter |
| `watched` 仍是 `watched` | Lemma 表没有 `ed` 规则 | 使用 WordNet 或 spaCy |
| "not good" 读成正面 | 停用词表丢掉了否定 | `stop_words=None` 再加 bigram |
| 分数高，少数类差 | 不平衡上的 Micro-F1 或准确率 | 报告 macro-F1，在 95-5 上用 AUPRC |
| LDA 垃圾主题 | 停用词和高频词 | 设置 `min_df` 和 `max_df` |
| 许多文档落在主题 -1 | HDBSCAN 的异常桶 | 检查 `min_topic_size`，阅读 -1 文档 |

## 何时用 X
type: qa
from: phases/05-nlp-foundations-to-advanced/01-text-processing/docs/en.md, phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md, phases/05-nlp-foundations-to-advanced/05-sentiment-analysis/docs/en.md, phases/05-nlp-foundations-to-advanced/15-topic-modeling/docs/en.md

- **词干还是词形还原？** 搜索索引用词干。用户会读的文本用词形还原。
- **NLTK 还是 spaCy？** 教学和替换部件用 NLTK。生产速度用 spaCy。
- **TF-IDF 还是嵌入？** 垃圾邮件、日志、低数据和可解释模型用 TF-IDF。
- **何时上 transformer？** 讽刺、方面、情感偏移和低资源语言。
- **LDA 还是 BERTopic？** 带主题混合的长文档用 LDA。短文本用 BERTopic。
- **没有 GPU？** 使用 LDA 或 NMF。

## 提示
type: tips
from: phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/docs/en.md, phases/05-nlp-foundations-to-advanced/05-sentiment-analysis/docs/en.md, phases/05-nlp-foundations-to-advanced/15-topic-modeling/docs/en.md

- 保持稀疏。10 万文档的稠密 TF-IDF 装不进内存。
- 在信任指标前，每类读 5 个错误预测。
- 在你自己的流水线上重新生成基线，不要用论文里的数字。
