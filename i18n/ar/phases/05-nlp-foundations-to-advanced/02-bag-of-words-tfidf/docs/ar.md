# حقيبة الكلمات ¦TF-IDF وممثلة النص

> قبل الحساب، التفكير مرة أخرى. حتى عام 2026، ظلّت قوات التعاون الدولي (TF-IDF) على مهمة تحديد وضوحها.

**Type:** Build
**Languages:** Python
**先修要求：**المرحلة 5 · 01 (文本处理) ، المرحلة 2 · 02 (الانسحاب الخطي من الصفر)
**Time:** ~75 分钟

## 问题
模型需要数字──你手里是字符串──

كل خط أنابيب النفطية يجب أن يجيب على نفس السؤال. كيفية تحويل نوع من الجهازات التكنولوجية إلى متجهات ثابتة صغيرة يمكن استهلاكها.

هذا المتجه 支过的生产级 NLP,比任何嵌入 模型都多多.垃圾邮件过器,主题分类器,日志异常检测,搜排序 ((BM25 之前) ]]第一波情感分析,学术 NLP基准的第一十年. حتى عام 2026، الممارسين في المهمة الصفحة الضيقة 仍然优先使用它.

هذا الدروس سوف يبدأ من الصفر بناء كيس الكلمات، ثم بناء TF-IDF، ثم عرض التعلم القليل باستخدام ثلاثة أدوات، وإلى نهاية الأمر، وأخيراً، أن تُحرك إلى نمط الفشل في التثبيت.

## 概念
**Bag of Words (BoW)**سأترك الترتيب. في كل وثيقة، ستحصين عدد مرات ظهور كل كلمة.`i`نعم كلمة`i`عدد

**TF-IDF**سأعيد زيادة السلطة بو.و. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

```
TF-IDF(w, d) = TF(w, d) * IDF(w)
             = count(w in d) / |d| * log(N / df(w))
```

من بينهم`TF`هو تعدد المفهوم في الملف،`df`هو تعدد الوثيقة ((有多少文档包含该词),`N`هو الملفات المجموعية`log`سوف يجعل القلق في الكلمات العادة

關鍵性:二者都會產生具有可解释坐标轴的稀疏矢量──你可以查看训练后分类器的重量,读出哪些词会推文档到哪个类──对于一个768 维的BERT嵌入,你做不到这一点──


```figure
bow-tfidf
```

## بناءها
### الخطوة الأولى: بناء المفردات

```python
def build_vocab(docs):
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    return vocab
```

输入:已 Tokenize 的文档列表(任意词级 Tokenizer 都可以;本课的 `code/main.py`استخدام صيغة تصنيفية معتدلة:`{word: index}`تعني إدخال ثابتة في الترتيب الكلمة 0 هي أول كلمة رأيتها لأول مرة في المقالة.

### 步骤 2: حقيبة الكلمات

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

行是文档──列是词表索引──条目 `[i][j]`تعبير`j`في الملفات`i`في المقالة 1`cat`ظهرت مرتين، لأنه ظهرت مرتين فعلا.`ran`ظهرت بلا ثمرة، لأنه لم يظهر

### الخطوة الثالثة: تردد المادة وتردد الوثائق

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

هناك طريقتان من المهارات المميزة`(n+1)/(d+1)` evit `log(x/0)`✿ آخر آخر ✿`+1` ضمان ظهور الكلمات في كل وثيقة لا يزال هناك IDF 1(ليس 0) ، وهذا يتفق مع التعلم القليل من الاعتبار.`log(N/df)`◊二者都能工作;平滑版本更友好──

### الخطوة الرابعة: TF-IDF

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

ثلاث وثائق، خمسة كلمات`the`.`cat`.`sat`.`dog`.`ran`(‬)`the`ظهرت الآن في جميع الملفات الثلاثة، لذلك قواتها الدفاعية`dog`يظهر مرة واحدة فقط ، لذلك فإن قواتها العسكرية عالية.

### 步骤 5: L2-تطبيع الصفوف

```python
def l2_normalize(matrix):
    out = []
    for row in matrix:
        norm = math.sqrt(sum(x * x for x in row))
        out.append([x / norm if norm else 0 for x in row])
    return out
```

إذا لم يتم تخصيصها، فإن الملفات الأكبر حجمًا سوف تحصل على متجه أكبر، وتتحكم في عدد من المواد المماثلة.

## استخدمها
سيكيت-تعلم قدم نسخة درجة الإنتاج

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

`CountVectorizer`في المستخدمين المختلفين، إنجاز التكنولوجيا، الكلمات تشكيل وبو.`TfidfVectorizer`إضافة إلى إضافة قوات الجيش إلى إعادة القانونية والطبيعية في L2، والتي تعود إلى المصفوفة النادرة.

يمكن أن تغير كل شيء

| Arg | Effect |
|-----|--------|
| `ngram_range=(1, 2)` | 包含 bigram。通常会提升 Classification。 |
| `min_df=2` | 丢弃出现在少于 2 个文档中的词。在噪声数据上裁剪词表。 |
| `max_df=0.95` | 丢弃出现在超过 95% 文档中的词。不使用硬编码列表也能近似移除 stopword。 |
| `stop_words="english"` | scikit-learn 内置的 stopword 列表。取决于任务——情感分析不应该丢弃否定词。 |
| `sublinear_tf=True` | 使用 `1 + log(tf)` 而不是原始 `tf`。当某个 term 在一个文档中重复很多次时有帮助。 |

### TF-IDF 仍然胜出的场景 (截至 2026 年)

- 垃圾邮件检测、主题标注、日志异常标注── كلمة ما إذا ظهرت هو فقط المفتاح؛语义细微差异不重要──
- 低数据场景(مئات معملات) ――TF-IDF 加物流 رجعة 没有预训成本──
- أي مكان حساس للتأخير  نموذج TF-IDF 加线性 يمكن أن يقدم إجابة في درجة ثواني صغيرة  عبر المحول لتحقيق الملفات
- يجب تفسير النظام.

### عندما تفشل نظام التأمين التجاري

语义盲区失败──考虑这两个文档:

- "الفيلم لم يكن جيدا على الإطلاق".
- "كان الفيلم ممتازاً"

واحد هو تعليقات سلبية، والآخر هو تعليقات صحية، والتي تمثل إضافة إلى تعليقات إضافية.`{the, movie, was}`حقيبة الكلمات يجب أن تتذكر`not`قرباً`good`عندما يكون هناك الكثير من البيانات يمكن أن تتعلم ذلك، ولكن لا تفهم أبدا نموذج القانون اللغوي أن الرائعة.

另一个失败:推理时遇到出口词典词──一个在IMDb 评论上训练的BoW 模型,如果 `Zoomer-approved`هذه الوهمية لم تظهر في التدريب، انها لا تعرف تماما كيفية التعامل معها.

### الهجين:TF-IDF 加权 إدراج

2026 سنة متوسط حجم البيانات التصنيف: باستخدام TF-IDF 权重作为词嵌上的注意──

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

أنت من Embeddings  الحصول على القدرة على القول، من TF-IDF  الحصول على كلمة نادرة التركيز.

## 交付 it
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

## التدريب
1. **Easy.**في L2 تقني TF-IDF 输出 upon realization `cosine_similarity(doc_vec_a, doc_vec_b)` تجربة نفس المستندات النتيجة 1.0, كلمة表不相交的文档 النتيجة 0.0♦
2. **Medium.**أعطني`bag_of_words`إضافة`n-gram`支持──参数 `n`سأنتج`n`-غرامات 计数──测试 `n=2`作用于`["the", "cat", "sat"]`سأفعل`["the cat", "cat sat"]`生成 بيكرام 计数
3. **Hard.**استخدام GloVe 100d المتجهات ((download once并缓存) تشكيل فوق TF-IDF-موزن-إدمج الهجين.

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
- ["Why TF-IDF Still Beats Embeddings" — Ashfaque Thonikkadavan (Medium)](https://medium.com/@cmtwskb/why-tf-idf-still-beats-embeddings-ad85c123e1b2) 2026 سنة على الطريقة القديمة
