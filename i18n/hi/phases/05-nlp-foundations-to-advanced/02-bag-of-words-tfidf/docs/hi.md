# शब्दों का बैग、TF-IDF तथा पाठ प्रतिनिधित्व

> पहले गणना, फिर से सोचें. 2026 तक, टीएफ-आईडीएफ ने स्पष्ट रूप से परिभाषित किए गए मिशन पर अभी भी विजय प्राप्त की है।

**Type:** Build
**Languages:** Python
**先修要求：**चरण 5 · 01 (文本处理), चरण 2 · 02 (शुरुआत से रैखिक प्रतिगमन)
**Time:** ~75 分钟

## 问题
模型需要数字──你手里是字符串──

प्रत्येक एनएलपी पाइपलाइन को एक ही प्रश्न का उत्तर देना होगा। एक परिवर्तनीय लंबाई के टोकन को कैसे परिवर्तित किया जा सकता है।

इस वेक्टर ने किसी भी एम्बेडिंग मॉडल से अधिक उत्पादन स्तर की एनएलपी का समर्थन किया है। यह किसी भी एम्बेडिंग मॉडल से अधिक है। यह एक महत्वपूर्ण कार्य है। यह तेजी से समझा जा सकता है, और यह शब्द में केवल महत्वपूर्ण कार्य है, जो अक्सर 400M पैरामीटर के एम्बेडिंग मॉडल से अलग नहीं होता है।

इस वर्ग में शब्द के बैग का निर्माण करने के बाद TF-IDF का निर्माण किया जाएगा। इसके बाद, इस तरह के कामों को पूरा करने के लिए तीन कोड का उपयोग करके छोटे से सीखे हुए तरीके का प्रदर्शन किया जाएगा।

## 概念
**Bag of Words (BoW)**                                                                                                                                                                                                                                                              `i` 是词`i`की गणना

**TF-IDF**एक शब्द जो प्रत्येक दस्तावेज़ में दिखाई देता है, उसका भार कम करता है, इसलिए उसका भार कम करता है।

```
TF-IDF(w, d) = TF(w, d) * IDF(w)
             = count(w in d) / |d| * log(N / df(w))
```

उनमें से `TF`文档中的术语频率,`df`यह दस्तावेज़ आवृत्ति है,`N`                                                                                                                                                                                                                                                              `log`会让高频常见词的权重保持有界――

关键性质:二者都会产生具有解释的坐标轴的稀疏矢量── आप प्रशिक्षण के बाद वर्गीकरण के वजन को देख सकते हैं, पढ़ सकते हैं कि कौन से शब्द दस्तावेज़ को किस श्रेणी में ले जाएंगे── एक 768 维 के लिए BERT एम्बेडिंग के लिए, आप इस बिंदु तक नहीं पहुंच सकते──


```figure
bow-tfidf
```

##  इसे निर्माण
### 步骤 1: शब्दावली का निर्माण

```python
def build_vocab(docs):
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    return vocab
```

输入:已 टोकनized 的文档列表(任意词级 टोकनייז 都可以;本课的 `code/main.py`प्रयोग एक सरलीकृत लघु लेखन परिवर्तन) ⋅输出:`{word: index}`                                                                                                                                                                                                                                                              

### 步骤 2: शब्द के बैग

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

行是文档──列是词表索引──条目 `[i][j]`表示词 `j`दस्तावेज में `i`इसमें कितनी बार ──文档 1 中 `cat`यह दो बार देखा गया है, क्योंकि यह वास्तव में दो बार देखा गया है।`ran`यह शून्य बार प्रकट होता है, क्योंकि यह प्रकट नहीं होता है।

### 步骤 3: शब्द आवृत्ति और दस्तावेज़ आवृत्ति

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

दो उल्लेखनीय स्लाइडिंग तकनीकें हैं`(n+1)/(d+1)`避免了 `log(x/0)`末尾 के `+1` सुनिश्चित करें कि प्रत्येक दस्तावेज़ में शब्द अभी भी IDF 1 ((न०) है, जो कि स्किट-लर्न के पूर्वनिर्धारित व्यवहार के अनुरूप है।`log(N/df)`二者都能工作;平滑版本更友好──

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

तीन文档,五个词表词(`the``cat``sat``dog``ran`)。`the`अब सभी तीन दस्तावेजों में दिखाई दिया, इसलिए इसकी आईडीएफ 低──`dog`केवल एक बार ही दिखाई देता है, इसलिए इसकी आईडीएफ उच्च। ये वेक्टर दुर्लभ हैं।

### 步骤 5: L2-सामान्य पंक्तियों

```python
def l2_normalize(matrix):
    out = []
    for row in matrix:
        norm = math.sqrt(sum(x * x for x in row))
        out.append([x / norm if norm else 0 for x in row])
    return out
```

यदि एकीकरण न हो तो, अधिक लम्बे दस्तावेज़ को अधिक बड़ा वेक्टर प्राप्त होगा, और समानता की संख्या को नियंत्रित करेगा। L2 सामान्यीकरण प्रत्येक दस्तावेज़ को एक इकाई पर रख देगा।

## इसका उपयोग करें
स्किट-लर्न  उपलब्ध कराया गया उत्पादन स्तर संस्करण 

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

`CountVectorizer`एक बार调用中完成 टोकनाइजेशन、词表构建和 BoW──`TfidfVectorizer`इसके अलावा आईडीएफ के अतिरिक्त अधिकार और एल 2 सामान्यीकरण──二者都返回稀疏矩阵── 100k 个文档, घन 版本 नहीं रख सकते内存 में;在分类器要求密集 之前保持稀疏──

能改变一切的旋:

| Arg | Effect |
|-----|--------|
| `ngram_range=(1, 2)` | 包含 bigram。通常会提升 Classification。 |
| `min_df=2` | 丢弃出现在少于 2 个文档中的词。在噪声数据上裁剪词表。 |
| `max_df=0.95` | 丢弃出现在超过 95% 文档中的词。不使用硬编码列表也能近似移除 stopword。 |
| `stop_words="english"` | scikit-learn 内置的 stopword 列表。取决于任务——情感分析不应该丢弃否定词。 |
| `sublinear_tf=True` | 使用 `1 + log(tf)` 而不是原始 `tf`。当某个 term 在一个文档中重复很多次时有帮助。 |

### TF-IDF 仍然胜出的场景 (截至2026年)

- 垃垃邮检测、主题标注、日志异常标注── शब्द का उद्भव होना ही महत्वपूर्ण है;语义细微差异不重要──
- 低数据场景(数百带标签样本) ――TF-IDF 加物流回归 没有预训成本──
- 任何延迟敏感的地方──TF-IDF 加线性模型微秒级中提供答案──通过变压器对文档做嵌入 需要10-100ms──
- 必须解释预测结果的系统──检查分类器的系数──排名靠前正向词就是原因──

### जब TF-IDF विफल हो जाता है

语义盲区失败──考虑这两个文档:

- "फिल्म बिल्कुल अच्छा नहीं था। "
- "फिल्म उत्कृष्ट था।

एक नकारात्मक टिप्पणी है, एक सकारात्मक टिप्पणी है, और एक नकारात्मक टिप्पणी है।`{the, movie, was}`✿ शब्द का बैग 分类器 ✿ याद रखना चाहिए`not` निकट `good`时会翻转标签―― पर्याप्त डेटा होने पर यह सीख सकता है, लेकिन हमेशा भाषा के नियम के मॉडल को नहीं समझता है।

另一个失败:推理时遇到出口词典词――一个在IMDb 评论上训练的BoW 模型,如果 `Zoomer-approved`यह टोकन प्रशिक्षण में नहीं आया है, यह पूरी तरह से पता नहीं है कि कैसे संभालना है।

### हाइब्रिडःटीएफ-आईडीएफ 加权 एम्बेडिंग

2026 साल मध्यवर्ती डेटा मात्रा वर्गीकरण का务实默认方案: TF-IDF 权重作为词嵌入上的注意──

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

आप से सम्मिलित  प्राप्त语义能力, से TF-IDF  प्राप्त दुर्लभ शब्द जोर दिया──分类器在聚向量上训练── लगभग 50k 带标签样本下面的情感、主题和意图分类, इस पद्धति से अकेले उपयोग में से किसी एक को भी जीत जाएगा──

## 交付 यह
保存为 `outputs/prompt-vectorization-picker.md`:

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

## अभ्यास
1. **Easy.**输出上实现 L2 मानकीकृत TF-IDF `cosine_similarity(doc_vec_a, doc_vec_b)`验证 समान दस्तावेज स्कोर 1.0, शब्द表不相交的文档 स्कोर 0.0──
2. **Medium.** दे `bag_of_words`添加 `n-gram`支持──参数 `n`会生成 `n`-ग्राम का गणना---परीक्षण`n=2`作用于 `["the", "cat", "sat"]`时,会为 `["the cat", "cat sat"]`जीवात्मा बड़ा ग्रंथ 计数
3. **Hard.**ग्लोवे 100 डी वेक्टरों का उपयोग करके ({{download time并缓存}}) ऊपर के TF-IDF-weighted-embedding hybrid का निर्माण करें।

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
- [Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text retrieval](https://www.sciencedirect.com/science/article/pii/0306457388900210)  TF-IDF  को दशैं के लिए एक आदर्श विधि का विषय बना दें
- ["Why TF-IDF Still Beats Embeddings" — Ashfaque Thonikkadavan (Medium)](https://medium.com/@cmtwskb/why-tf-idf-still-beats-embeddings-ad85c123e1b2) 2026 वर्ष पुरानी विधि के प्रति किस समय विजय प्राप्त हुई तथा इसके कारणों का विश्लेषण
