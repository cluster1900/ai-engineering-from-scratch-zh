# Bag of Words、TF-IDF và đại diện văn bản

> Trước tiên tính toán, suy nghĩ lại. Đến năm 2026, TF-IDF vẫn thắng trong nhiệm vụ xác định rõ ràng.

**Type:** Build
**Languages:** Python
**先修要求：**Giai đoạn 5 · 01 (文本处理), Giai đoạn 2 · 02 (Liniary Regression from Scratch)
**Time:** ~75 分钟

## 问题
模型需要数字──你手里是字符串──

Mỗi dòng ống dẫn NLP đều phải trả lời cùng một câu hỏi. Làm thế nào để đưa một dòng token có chiều dài thay đổi thành phần của một loại máy tính có thể tiêu thụ một khối lượng lớn nhất của một vector.

Đây là một trong những năm đầu tiên của các ngành phân tích cảm xúc, phân tích học thuật của NLP. Đến năm 2026, các nhà kinh doanh trong nhiệm vụ phân loại  hạn hẹp sẽ vẫn ưu tiên sử dụng nó. Nó có thể được giải thích nhanh chóng, và liệu việc xuất hiện của từ ngữ là nhiệm vụ quan trọng hay không, thường xuyên và mô hình Embedding có số lượng 400M hầu như không khác nhau.

本课会从零构建 包 of Words,然后构建 TF-IDF―― tiếp theo trình bày các bài học nhỏ bằng 3行代码完成同样的事――最后指出让你转向嵌入式的失败模式――

## 概念
**Bag of Words (BoW)**会丢弃顺序―― đối với mỗi tài liệu, thống kê mỗi từ表词 xuất hiện bao nhiêu lần―― Vêctor 长度就是词表大小――位置`i` 是词 `i`Số lượng:

**TF-IDF**Một từ xuất hiện trong mỗi tài liệu không có lượng thông tin cao, vì vậy hãy giảm trọng lượng của nó. Một từ xuất hiện rất ít trong thư viện ngôn ngữ, nhưng trong các tài liệu đơn lẻ thường xuyên là tín hiệu, vì vậy hãy giảm trọng lượng của nó.

```
TF-IDF(w, d) = TF(w, d) * IDF(w)
             = count(w in d) / |d| * log(N / df(w))
```

Trong số đó `TF`là tần số trong tài liệu,`df`là tần số tài liệu ((有多少文档包含该词),`N`Đó là tổng số tài liệu.`log`会让高频常见词的权重保持有界――

关键性质:二者都会产生具有可解释坐标轴的稀疏矢量──你可以查看训练后分类器的权重,读出哪些词会推文档到哪个类──对于一个768 维的BERT嵌入,你做不到这一点──


```figure
bow-tfidf
```

##  xây dựng nó
### 步骤 1: xây dựng từ vựng

```python
def build_vocab(docs):
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    return vocab
```

输入:已 Tokenize 的文档列表(任意词级 Tokenizer 都可以;本课的 `code/main.py`Sử dụng một viết nhỏ đơn giản hóa (※输出:`{word: index}`                                                                                                                                                                                                                                                              

### 步骤 2: túi từ

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

行是文档──列是词表索引──条目 `[i][j]`表示词 `j`Trong tài liệu`i`Trong đó có bao nhiêu lần xuất hiện.`cat`xuất hiện hai lần, vì nó thực sự xuất hiện hai lần.`ran`xuất hiện không lần, vì nó không xuất hiện.

### 步骤 3: tần suất thuật ngữ và tần suất tài liệu

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

Có hai kỹ năng trượt bình thường đáng kể.`(n+1)/(d+1)`避免了 `log(x/0)`末尾 của `+1`确保 xuất hiện trong mỗi tài liệu vẫn có IDF 1 ((không phải 0), điều này phù hợp với hành vi cố định của học tập nhỏ.`log(N/df)`△二者都能工作;平滑版本更友好──

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

三文档,五个词表词(`the``cat``sat``dog``ran`(■)`the`Hiện tại trong tất cả 3 tài liệu, vì vậy IDF của nó thấp.`dog`Chỉ xuất hiện một lần, vì vậy IDF cao. Những vector này là hiếm.

### 步骤 5: L2- bình thường hóa hàng

```python
def l2_normalize(matrix):
    out = []
    for row in matrix:
        norm = math.sqrt(sum(x * x for x in row))
        out.append([x / norm if norm else 0 for x in row])
    return out
```

Nếu không làm phân tích, các tài liệu dài hơn sẽ có được một vector lớn hơn, và chủ yếu là điểm tương tự. L2 bình thường hóa sẽ đưa mỗi tài liệu lên một đơn vị siêu cầu trên.

## Sử dụng nó
Scikit-learn  cung cấp phiên bản cấp sản xuất.

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

`CountVectorizer`Trong một lần调用中完成 Tokenization、词表构建和 BoW──`TfidfVectorizer`Với IDF 加权和 L2 bình thường hóa──二者都返回稀疏矩阵── đối với 100k 个文档, 密集 版本无法存储; 在分类器要求密集 之前保持稀疏──

Có thể thay đổi mọi thứ.

| Arg | Effect |
|-----|--------|
| `ngram_range=(1, 2)` | 包含 bigram。通常会提升 Classification。 |
| `min_df=2` | 丢弃出现在少于 2 个文档中的词。在噪声数据上裁剪词表。 |
| `max_df=0.95` | 丢弃出现在超过 95% 文档中的词。不使用硬编码列表也能近似移除 stopword。 |
| `stop_words="english"` | scikit-learn 内置的 stopword 列表。取决于任务——情感分析不应该丢弃否定词。 |
| `sublinear_tf=True` | 使用 `1 + log(tf)` 而不是原始 `tf`。当某个 term 在一个文档中重复很多次时有帮助。 |

### TF-IDF  vẫn thắng out场景 (截至 2026 年)

- 垃圾邮件检测、主题标注、日志异常标注──词是否出现才是关键;语义细微差异不重要──
- 低数据场景(100个带标签样本) ――TF-IDF 加物流回归 没有预训成本――
- 任何地方对延迟敏感的──TF-IDF 加线性模型可以在微秒级中提供答案──通过变压器对文档做嵌入 需要10-100ms──
- 必须解释预测结果的系统──检查分类器的系数──排名靠前的正向词就是原因──

### Khi TF-IDF thất bại

语义盲区失败──考虑这两个文档:

- "Trong phim không tốt cả".
- "Tác phẩm phim rất tuyệt vời".

Một là bình luận tiêu cực. Một là bình luận chính xác.`{the, movie, was}`✿Thùng từ phân loại cần phải ghi nhớ ✿`not`靠近 `good`时会翻转标签―― dữ liệu đủ nhiều khi nó có thể học được điều này, nhưng không bao giờ hiểu được mô hình pháp luật ngữ pháp quá đẹp.

另一个失败:推理时遇到出口词典词──一个在IMDb 评论上训练的BoW 模型,如果 `Zoomer-approved`Từ khi được đào tạo, nó hoàn toàn không biết phải xử lý như thế nào.

### Hybrid:TF-IDF 加权 Nhập

Chương trình chia sẻ thực tế của phân loại dữ liệu trung bình năm 2026: sử dụng TF-IDF 权重作为词嵌上的注意──

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

Bạn từ Embeddings  thu được khả năng ngữ nghĩa, từ TF-IDF  thu được hiếm có từ nhấn mạnh.

## 交付 nó
保存为 `outputs/prompt-vectorization-picker.md`- Có thể là:

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
1. **Easy.**Trong L2 chuẩn hóa TF-IDF 输出实现 `cosine_similarity(doc_vec_a, doc_vec_b)`▽验证 cùng tài liệu điểm số là 1.0, từ表不相交的文档 điểm số là 0.0──
2. **Medium.** Đưa `bag_of_words`添加 `n-gram`支持──参数 `n`会生成 `n`-gram của tính toán.`n=2`作用于`["the", "cat", "sat"]`时,会为 `["the cat", "cat sat"]`sinh thành một số lượng lớn.
3. **Hard.**Sử dụng GloVe 100d vectors (download once并缓存) xây dựng trên TF-IDF-weighted-embedding hybrid.

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
- [Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text retrieval](https://www.sciencedirect.com/science/article/pii/0306457388900210) 让TF-IDF 成为十年默认方法的论文──
- ["Why TF-IDF Still Beats Embeddings" — Ashfaque Thonikkadavan (Medium)](https://medium.com/@cmtwskb/why-tf-idf-still-beats-embeddings-ad85c123e1b2) 2026 năm đối với phương pháp cũ ở thời điểm chiến thắng và lý do giải thích 
