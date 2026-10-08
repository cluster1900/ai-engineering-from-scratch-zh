# 字符包,TF-IDF和文本表示

> 之前计数,再思考.到2026年,TF-IDF在定义清晰的任务中仍然胜利了嵌入式.

**Type:** Build
**Languages:** Python
**先修要求：**五期·01 (文本处理),二期·02 (从零开始的线性回归)
**Time:** ~75 分钟

## 问题
模型需要数字. 你手里是字符串.

每条NLP管道都必须回答同一个问题――如何把可变长度的代币流转换成成元器件类器可以消费的固定大小向量――这个领域最早的答案是能工作的最方法――统计词――做成一个向量――

这个向量支过的生产级 NLP,比任何嵌入式模型都多.垃圾邮件过器,主题分类器,日志异常检测,搜索排序 (BM25之前) 首波情感分析,学术NLP基准的第一十年.到2026年,从业者在狭窄的分类任务中仍然将优先使用它. 它的速度快速可解释,并且在词汇是否出现才是关键任务,往往与400M参数的嵌入式模型几乎没有区别.

本课程将从零构建字包,然后构建TF-IDF――然后展示使用三行代码完成相同的事物――最后指出让你转向嵌入式的失败模式――

## 概念
**Bag of Words (BoW)**会丢弃顺序――对每个文档,统计每个词表词出现了多少次――矢量长度就是词表大小――位置`i`是词`i`计数量

**TF-IDF**会重新加权BoW──一个词在每文档中出现的词信息量不高,所以把它的权重调低──一个词在语料库中很少见,但在单个文档中频繁出现的词是信号,所以把它的权重调高──

```
TF-IDF(w, d) = TF(w, d) * IDF(w)
             = count(w in d) / |d| * log(N / df(w))
```

其中`TF`是文档中的术语频率,`df`是文件频率(有多少文档包含该词),`N`是档案总数.`log`会让高频常见词的权力保持有界限.

关键性质:二者都会产生可解释坐标轴的稀疏向量.你可以查看训练后分类器的权重,读出将文档推向哪个类别.


```figure
bow-tfidf
```

## 构建它
### 步骤1:建立词汇库

```python
def build_vocab(docs):
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    return vocab
```

输入:已标记的文档列表(任意词级标记的都可以;本课的 `code/main.py`使用一个简化的小写变体 (※输出:`{word: index}`字符串排序 0 是第一个文档中第一次看到的词.

### 步骤2: 字包

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

行是文档──列是词表索引──条目 `[i][j]`表示词`j`在文档中`i`文档 1 中出现了多少次`cat`由于它确实出现了两次.`ran`出现零次,因为它没有出现.

### 步骤3:术语频率和文件频率

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

两种值得一提的平滑技巧.`(n+1)/(d+1)`避免了`log(x/0)`结尾的`+1`确保每个文档中的词仍然有IDF 1(不是0),这与小学学习的默认行为一致.`log(N/df)`△二者都能工作;平滑版本更友好──

### 步骤4:TF-IDF

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

三文档,五个词表词(`the`,我知道.`cat`,我知道.`sat`,我知道.`dog`,我知道.`ran``the`现在所有的三档中,所以它的IDF低.`dog`只有一次出现,所以它的 IDF 高──这些向量是稀疏的──大多数条目都很小,判别性词会凸显出来──

### 步骤 5: L2规范行

```python
def l2_normalize(matrix):
    out = []
    for row in matrix:
        norm = math.sqrt(sum(x * x for x in row))
        out.append([x / norm if norm else 0 for x in row])
    return out
```

如果不归化,更长的文档会得到更大的向量,并主导相似度分数――L2正常化将每个文档放到单元超球面上――行与行之间的宇宙相似性现在就是点产量――

## 使用它
简单学习提供了生产级版本.

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

`CountVectorizer`在一次调用中完成标识化,词表构建和BoW──`TfidfVectorizer`加上IDF加权和L2正常化──二者都回归稀疏矩阵──对于100万个文档,密集版本无法存储;在分类器要求密集之前保持稀疏──

能改变一切的旋律:

| Arg | Effect |
|-----|--------|
| `ngram_range=(1, 2)` | 包含 bigram。通常会提升 Classification。 |
| `min_df=2` | 丢弃出现在少于 2 个文档中的词。在噪声数据上裁剪词表。 |
| `max_df=0.95` | 丢弃出现在超过 95% 文档中的词。不使用硬编码列表也能近似移除 stopword。 |
| `stop_words="english"` | scikit-learn 内置的 stopword 列表。取决于任务——情感分析不应该丢弃否定词。 |
| `sublinear_tf=True` | 使用 `1 + log(tf)` 而不是原始 `tf`。当某个 term 在一个文档中重复很多次时有帮助。 |

### 国际货币基金组织 (TF-IDF) 仍胜出的场景 (截至2026年)

- 垃圾邮件检测、主题标签、日志异常标记──词是否出现才是关键;语义细微差异不重要──
- 低数据场景 (数百个标签样本) ‧TF-IDF 加物流回归 没有预训成本‧
- 任何对延迟敏感的地方――TF-IDF 加线性模型可以在微秒级中提供答案――通过变压器对文档进行嵌入需要10-100ms――
- 必须解释预测结果的系统――检查分类器的系数――排名靠前正向词就是原因――

### 当TF-IDF失败时

语义盲区失败――考虑这两个文档:

- "这部电影根本不好.
- "这部电影很棒.

一个是负面评论. 一个是正面评论.`{the, movie, was}`,我必须记住.`not`靠近`good`时会翻转标签――数据足够多时它可以学会这一点,但永远没有理解语法模型那么优雅――

另一个失败:推理时遇到出口词汇词语.`Zoomer-approved`这种标志从训练中未出现,它完全不知道该如何处理.

### 混合型:TF-IDF 加权嵌入

2026年中等数据量分类的务实默认方案:使用TF-IDF 权重作为词嵌入 上的注意力

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

你从嵌入式获得语义能力,从TF-IDF获得稀有词强调――分类器在聚合向量上训练――对于大约50万个带标签样本下面的情感、主题和意图分类,这种方法将胜过单独使用的其中任何一种――

## 交付它
保存为`outputs/prompt-vectorization-picker.md`其他:

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
1. **Easy.**在 L2规范化的TF-IDF 输出实现`cosine_similarity(doc_vec_a, doc_vec_b)`证实同文档分分为1.0,词表不相交的文档分为0.0──
2. **Medium.**给我一个`bag_of_words`添加`n-gram`支持──参数`n`会产生`n`子的数量.`n=2`作用于`["the", "cat", "sat"]`时,会为`["the cat", "cat sat"]`生成大图数
3. **Hard.**在20个新闻集团数据集中,将与纯F-IDF和纯平均集成嵌入式进行分类精确性对比.

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
- [scikit-learn — feature extraction from text](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) 权威 API 参考,并包含每个旋的说明.
- [Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text retrieval](https://www.sciencedirect.com/science/article/pii/0306457388900210) 让TF-IDF成为十年默认方法论文.
- ["Why TF-IDF Still Beats Embeddings" — Ashfaque Thonikkadavan (Medium)](https://medium.com/@cmtwskb/why-tf-idf-still-beats-embeddings-ad85c123e1b2) 2026年对旧方法的解读
