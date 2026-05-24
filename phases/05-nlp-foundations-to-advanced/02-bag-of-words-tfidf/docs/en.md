# Bag of Words、TF-IDF 与 Text Representation

> 先计数，再思考。到 2026 年，TF-IDF 在定义清晰的任务上仍然胜过 Embeddings。

**Type:** Build
**Languages:** Python
**先修要求：** Phase 5 · 01 (文本处理), Phase 2 · 02 (Linear Regression from Scratch)
**Time:** ~75 分钟

## 问题
模型需要数字。你手里是字符串。

每条 NLP pipeline 都必须回答同一个问题。如何把一个可变长度的 Token 流转换成分类器可以消费的固定大小 Vector。这个领域最早落到的答案，是能工作的最笨方法。统计词。做成一个 Vector。

这个 Vector 支撑过的生产级 NLP，比任何 Embedding 模型都多。垃圾邮件过滤器、主题分类器、日志异常检测、搜索排序（BM25 之前）、第一波情感分析、学术 NLP benchmark 的第一个十年。到 2026 年，从业者在狭窄的 Classification 任务上仍然会优先使用它。它速度快、可解释，而且在词是否出现才是关键的任务上，往往和一个 400M 参数的 Embedding 模型几乎没有差别。

本课会从零构建 Bag of Words，然后构建 TF-IDF。接着展示 scikit-learn 用三行代码完成同样的事。最后指出让你转向 Embeddings 的失败模式。

## 概念
**Bag of Words (BoW)** 会丢弃顺序。对每个文档，统计每个词表词出现了多少次。Vector 长度就是词表大小。位置 `i` 是词 `i` 的计数。

**TF-IDF** 会重新加权 BoW。一个出现在每个文档中的词信息量不高，所以把它的权重调低。一个在语料库中很少见、但在单个文档中频繁出现的词是信号，所以把它的权重调高。

```
TF-IDF(w, d) = TF(w, d) * IDF(w)
             = count(w in d) / |d| * log(N / df(w))
```

其中 `TF` 是文档中的 term frequency，`df` 是 document frequency（有多少个文档包含该词），`N` 是文档总数。`log` 会让高频常见词的权重保持有界。

关键性质：二者都会产生具有可解释坐标轴的稀疏 Vector。你可以查看训练后分类器的权重，读出哪些词会把文档推向哪个类别。对于一个 768 维的 BERT Embedding，你做不到这一点。

## 构建它
### 步骤 1： build the vocabulary

```python
def build_vocab(docs):
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    return vocab
```

输入：已 Tokenize 的文档列表（任意词级 Tokenizer 都可以；本课的 `code/main.py` 使用了一个简化的小写变体）。输出：`{word: index}` dict。稳定的插入顺序意味着词索引 0 是第一个文档中第一次看到的词。约定会有所不同；scikit-learn 按字母顺序排序。

### 步骤 2： bag of words

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

行是文档。列是词表索引。条目 `[i][j]` 表示“词 `j` 在文档 `i` 中出现了多少次”。文档 1 中 `cat` 出现两次，因为它确实出现了两次。文档 0 中 `ran` 出现零次，因为它没有出现。

### 步骤 3： term frequency and document frequency

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

有两个值得点名的平滑技巧。`(n+1)/(d+1)` 避免了 `log(x/0)`。末尾的 `+1` 确保出现在每个文档中的词仍然有 IDF 1（不是 0），这与 scikit-learn 的默认行为一致。其他实现会使用原始的 `log(N/df)`。二者都能工作；平滑版本更友好。

### 步骤 4： TF-IDF

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

三个文档，五个词表词（`the`、`cat`、`sat`、`dog`、`ran`）。`the` 出现在全部三个文档中，所以它的 IDF 低。`dog` 只出现一次，所以它的 IDF 高。这些 Vector 是稀疏的（大多数条目都很小），判别性词会凸显出来。

### 步骤 5： L2-normalize rows

```python
def l2_normalize(matrix):
    out = []
    for row in matrix:
        norm = math.sqrt(sum(x * x for x in row))
        out.append([x / norm if norm else 0 for x in row])
    return out
```

如果不做归一化，更长的文档会得到更大的 Vector，并主导相似度分数。L2 normalization 会把每个文档放到单位超球面上。行与行之间的 cosine similarity 现在就是 dot product。

## 使用它
scikit-learn 提供了生产级版本。

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

`CountVectorizer` 在一次调用中完成 Tokenization、词表构建和 BoW。`TfidfVectorizer` 加上 IDF 加权和 L2 normalization。二者都返回稀疏 Matrix。对于 100k 个文档，dense 版本无法放进内存；在分类器要求 dense 之前保持 sparse。

能改变一切的旋钮：

| Arg | Effect |
|-----|--------|
| `ngram_range=(1, 2)` | 包含 bigram。通常会提升 Classification。 |
| `min_df=2` | 丢弃出现在少于 2 个文档中的词。在噪声数据上裁剪词表。 |
| `max_df=0.95` | 丢弃出现在超过 95% 文档中的词。不使用硬编码列表也能近似移除 stopword。 |
| `stop_words="english"` | scikit-learn 内置的 stopword 列表。取决于任务——情感分析不应该丢弃否定词。 |
| `sublinear_tf=True` | 使用 `1 + log(tf)` 而不是原始 `tf`。当某个 term 在一个文档中重复很多次时有帮助。 |

### TF-IDF 仍然胜出的场景 (截至 2026 年)

- 垃圾邮件检测、主题标注、日志异常标记。词是否出现才是关键；语义细微差别不重要。
- 低数据场景（数百个带标签样本）。TF-IDF 加 logistic regression 没有预训练成本。
- 任何对延迟敏感的地方。TF-IDF 加线性模型可以在微秒级给出答案。通过 Transformer 对文档做 Embedding 需要 10-100ms。
- 必须解释预测结果的系统。检查分类器的系数。排名靠前的正向词就是原因。

### When TF-IDF fails

语义盲区失败。考虑这两个文档：

- "The movie was not good at all."
- "The movie was excellent."

一个是负面评论。一个是正面评论。它们的 TF-IDF 重叠恰好是 `{the, movie, was}`。Bag of Words 分类器必须记住 `not` 靠近 `good` 时会翻转标签。数据足够多时它可以学会这一点，但永远没有理解语法的模型那么优雅。

另一个失败：推理时遇到 out-of-vocabulary 词。一个在 IMDb 评论上训练的 BoW 模型，如果 `Zoomer-approved` 这个 Token 从未出现在训练中，它完全不知道该怎么处理。Subword Embeddings（lesson 04）可以处理这一点。TF-IDF 不能。

### Hybrid：TF-IDF 加权 Embedding

2026 年中等数据量 Classification 的务实默认方案：用 TF-IDF 权重作为 word embeddings 上的 Attention。

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

你从 Embeddings 获得语义能力，从 TF-IDF 获得稀有词强调。分类器在 pooled vector 上训练。对于大约 50k 个带标签样本以下的情感、主题和意图 Classification，这种方法会胜过单独使用其中任一种。

## 交付它
保存为 `outputs/prompt-vectorization-picker.md`：

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
1. **Easy.** 在 L2-normalized TF-IDF 输出上实现 `cosine_similarity(doc_vec_a, doc_vec_b)`。验证相同文档得分为 1.0，词表不相交的文档得分为 0.0。
2. **Medium.** 给 `bag_of_words` 添加 `n-gram` 支持。参数 `n` 会生成 `n`-gram 的计数。测试 `n=2` 作用于 `["the", "cat", "sat"]` 时，会为 `["the cat", "cat sat"]` 生成 bigram 计数。
3. **Hard.** 使用 GloVe 100d vectors（下载一次并缓存）构建上面的 TF-IDF-weighted-embedding hybrid。在 20 Newsgroups 数据集上，将 Classification accuracy 与纯 TF-IDF 和纯 mean-pooled Embeddings 对比。报告哪种方法在哪些场景胜出。

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
- [scikit-learn — feature extraction from text](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) — 权威 API 参考，并包含每个旋钮的说明。
- [Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text retrieval](https://www.sciencedirect.com/science/article/pii/0306457388900210) — 让 TF-IDF 成为十年默认方法的论文。
- ["Why TF-IDF Still Beats Embeddings" — Ashfaque Thonikkadavan (Medium)](https://medium.com/@cmtwskb/why-tf-idf-still-beats-embeddings-ad85c123e1b2) — 2026 年对旧方法何时胜出以及原因的解读。
