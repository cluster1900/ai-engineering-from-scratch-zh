# Sözcükler Çantaı ‒TF-IDF ve Metin Temsil

> Önceden hesaplayın, yeniden düşünün. 2026 yılına kadar, TF-IDF, açık bir görevde embedings'i yenmeye devam ediyor.

**Type:** Build
**Languages:** Python
**先修要求：**5 · 01 aşama (文本处理), 2 · 02 aşama (Sıfırdan Dönüş)
**Time:** ~75 分钟

## 问题
Model'in sayılara ihtiyacı var.

Her NLP borusu aynı soruya cevap vermeli. Nasıl bir değişen boyutlu Token 流 dönüştürülebilir bir bileşen sınıfı tüketilebilir sabit büyüklükteki vektör. Bu alanın en erken ulaştığı cevap, en iyi yöntemdir.

Bu vektör, herhangi bir yerleştirme modeliden daha fazla üretim seviyesinde desteklenen NLP'yi oluşturur. Bu, herhangi bir yerleştirme modeliden daha fazladır. İcracılık filtre cihazları, konulardaki ayrımcılık, 日志异常检测, arama sıralaması (BM25'den önce) 、 ilk dalga duygusal analiz, akademik NLP referansının ilk on yılının sonunda. 2026 yılına kadar, işadamları, dar sınıflandırma görevlerinde önceliklerini kullanmaya devam edecekler.

Bu ders, ZERO'dan oluşturulur, sonra TF-IDF oluşturulur. Sonra küçük bir öğrenme gösterisi yapılır.

## 概念
**Bag of Words (BoW)**Bu sayede, her bir dosya için, her bir kelime için bir dizi kelime ortaya çıkmıştır.`i`Evet , evet .`i`- Evet.

**TF-IDF**Bir sözcük, her bir makalede ortaya çıkan sözcüklerin bilgisi miktarı yüksek değildir, bu yüzden onun ağırlığını düşürür.

```
TF-IDF(w, d) = TF(w, d) * IDF(w)
             = count(w in d) / |d| * log(N / df(w))
```

İçlerinden `TF`Dosyaların içinde term frekansı,`df`Bu ifadeyi içeren bir belge sıklığıdır.`N`Bu da bir kayıt.`log`会让高频常见词的权重保持有界──

关键性:二者都会产生具有解释可解释坐标轴的稀疏矢量──你可以查看训练后分类器的权重,读出哪些词会把文档推向到哪个类──对于一个768 维的BERT Embedding,你做不到这一点──


```figure
bow-tfidf
```

## Yapın onu.
### 步骤 1: kelime birikimi oluşturun

```python
def build_vocab(docs):
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    return vocab
```

输入:已 Tokenize 的文档列表(任意词级 Tokenizer 都可以;本课的 `code/main.py`Bir basit küçük yazım kullanın.`{word: index}`Dik· stabilisyen 插入序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符序列 字符符 字符序列 字符 字符 字符 字符 字符 字符 字符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符 符  符 符 符 符 符 符 符   符 符                                               

### 步骤 2: kelimelerden bir çanta

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

行是文档──列是词表索引──条目 `[i][j]` 表示词 `j`Dosyalarda .`i`İçinde kaç kez ortaya çıktı?`cat`İki kez ortaya çıktı çünkü gerçekten iki kez ortaya çıktı.`ran`Çıkış yok çünkü ortaya çıkmadı.

### 步骤 3: term frekansı ve belge frekansı

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

İki tane iyi düzeltme tekniği var.`(n+1)/(d+1)`- Hayır .`log(x/0)`Sonunun sonu.`+1`                                                                                                                                                                                                                                                              `log(N/df)`△二者都能工作;平滑版本更友好──

### 4 adım: TF-IDF

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

Üç tane kayıt, beş tane ifade`the`- Evet.`cat`- Evet.`sat`- Evet.`dog`- Evet.`ran`)。`the`Şu anda üç arşivde, bu yüzden İsrail Ordusu'nun altındaki.`dog`Bu vektörler çok nadirdir.

### 步骤 5: L2-sırları normalleştir

```python
def l2_normalize(matrix):
    out = []
    for row in matrix:
        norm = math.sqrt(sum(x * x for x in row))
        out.append([x / norm if norm else 0 for x in row])
    return out
```

Eğer birleştirilmezse, daha uzun dosyalar daha büyük vektör elde eder, ve benzerlik oranını yönlendirir. L2 normallaşımı her dosyayı birim süper küresel yüzeye yerleştirecektir.

## Kullan
Sikit-learn 提供了生产级版本──

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

`CountVectorizer`Bir kez调用中完成 Tokenization、词表构建和 BoW──`TfidfVectorizer`Ayrıca, IDF 加权和 L2 normalisasyonu──二者都返回稀疏矩阵── 100k 个文档, dense 版本 cannot be put into内存;在分类器要求 dense 之前保持稀少──

Her şeyi değiştirebilir.

| Arg | Effect |
|-----|--------|
| `ngram_range=(1, 2)` | 包含 bigram。通常会提升 Classification。 |
| `min_df=2` | 丢弃出现在少于 2 个文档中的词。在噪声数据上裁剪词表。 |
| `max_df=0.95` | 丢弃出现在超过 95% 文档中的词。不使用硬编码列表也能近似移除 stopword。 |
| `stop_words="english"` | scikit-learn 内置的 stopword 列表。取决于任务——情感分析不应该丢弃否定词。 |
| `sublinear_tf=True` | 使用 `1 + log(tf)` 而不是原始 `tf`。当某个 term 在一个文档中重复很多次时有帮助。 |

### TF-IDF 仍然胜出的场景 (截至2026年)

- 垃垃邮检测、主题标注、日志异常标注──词是否出现才是关键;语义细微差不重要──
- 低数据场景(100带标签样本) ――TF-IDF 加物流回归 没有预训成本──
- 任何地方对延迟敏感的──TF-IDF 加线性模型可以在微秒级中提供答案──通过变压器对文档进行嵌入 需要10-100ms──
- 必須解释预测结果的系统──检查分类器的系数──排名靠前的正向词就是原因──

### TF-IDF'nin başarısız olması

语义盲区失败──考虑这两个文档:

- "Film hiç de iyi değildi".
- "Film mükemmeldi".

Bir negatif yorum. Bir olumlu yorum.`{the, movie, was}`✿ Sözler Çantaları ✿ Klasörler hatırlamak zorundadır ✿`not`Yakınlık .`good`时会翻转标签──数据足够多时它可以学会这一点,但永远没有理解语法模型那么优雅──

另一个失败:推理时遇到出语库词──一个在IMDb 评论上训练的BoW 模型,如果 `Zoomer-approved`Bu işareti, eğitim sırasında henüz ortaya çıkmamıştır. Nasıl işleneceğini tam olarak bilmiyor.

### Hibrit:TF-IDF 加权 Ekleme

2026 yıl ortalama veri miktarı sınıflandırma 务实默认方案:用TF-IDF 权重作为词嵌上的注意──

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

You from Embeddings  get语义能力, from TF-IDF  get rare rare word emphasis。 分类器在聚向上训练──

## - Söyle.
保存为 `outputs/prompt-vectorization-picker.md`- ...

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
1. **Easy.**L2 normallaştırılmış TF-IDF 输出上实现 `cosine_similarity(doc_vec_a, doc_vec_b)`▽验证 同文档分分为 1.0,词表不相交的文档分为 0.0──
2. **Medium.**- Ver .`bag_of_words`添加 `n-gram`支持──参数 `n`- Evet .`n`-gramın sayıları--- test`n=2`作用于`["the", "cat", "sat"]`- Evet.`["the cat", "cat sat"]`Özgür bir sayı.
3. **Hard.**GloVe 100d vektörleri kullanın ({{lang-en_glove_100d vector}}) Bu konuda, 20 haber grubunda, sınıflandırma doğruluğu, saf TF-IDF ve saf ortalama birleştirilmiş yerleşimlerle karşılaştırıldığında ortaya çıkacaktır.

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
- ["Why TF-IDF Still Beats Embeddings" — Ashfaque Thonikkadavan (Medium)](https://medium.com/@cmtwskb/why-tf-idf-still-beats-embeddings-ad85c123e1b2)2026 yılının eski yöntemleri nasıl kazanılır ve nedenler nasıl çözülür.
