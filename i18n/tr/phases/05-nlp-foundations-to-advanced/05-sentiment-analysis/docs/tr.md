# Duygu Analisi

> Klasik NLP görevleri. Burada ortaya çıkacak olan geleneksel metin sınıflandırması hakkında bilmeniz gereken en büyük kısım.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 2 · 14 (Naive Bayes)
**Time:** ~75 minutes

## 问题

"Yemek çok iyi değildi". Doğru mu, yoksa olumsuz mu?

Duygular  çok basit görünüyor. Yorumcular onlar beğenmiş veya beğenmemiş bir şey diyor. Sözcüklere etiketlenmiş olan bu sözcükler ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒ ⇒                                                                                                                             `tight`Zamanla birlikte`tight`含义不同) 』

Duygu, geleneksel NLP'nin pratik laboratuvarıdır. Eğer her naif temel çizginin neden belirli bir başarısızlık modeli olduğunu anlarsanız, her daha zengin bir modelin neden geliştirileceğini anlarsınız. Bu ders, sıfırdan naif Bayes temel çizgisini oluşturmak, lojistik gerilemeyi katmak ve üretim seviyesindeki duyguları ırkın uygun seviyesindeki sorunların tuzağına dönüştürmek için geçerlidir.

## 概念

傳統情緒 是一個兩步配方──

1. **表示。**Get text into feature vector──BoW、TF-IDF veya n-gram──
2. **Classification。**Bu model, bir çizgi modeli ile uyumlu olarak kullanılır.

Naive Bayes, en iyi çalışma modelidir.`P(word | positive)`和 `P(word | negative)`◊ Düşünce sırasında, bu olasılıkları çarpıtmak ◊ bu "saçma"  bağımsızlık hipotezi komik, ama sonuçlar çok şaşırtıcı ◊ neden:

Logistik gerileme 修正した独立性假设── her bir özelliğe göre 负权重を含む 负权重を学ぶ──`not good`作为一个bigram特征 会得到负权重――Naive Bayes 无法对待从未标记过的bigrams 做到这一点――


```figure
sentiment-logits
```

## Yapın onu.

### Adım 1: Gerçek bir mini veri kümesi

```python
POSITIVE = [
    "absolutely loved this movie",
    "beautiful cinematography and a great story",
    "one of the best films of the year",
    "brilliant acting from the lead",
    "heartwarming and funny",
]

NEGATIVE = [
    "boring and far too long",
    "not worth your time",
    "the plot made no sense",
    "terrible acting, awful script",
    "i want my two hours back",
]
```

Gerçek çalışma, birkaç bin numune kullanıyor.

### 步骤 2: Multinomal Naive Bayes ' i gerçekleştirmek

```python
import math
from collections import Counter


def train_nb(docs_by_class, vocab, alpha=1.0):
    class_priors = {}
    class_word_probs = {}
    total_docs = sum(len(d) for d in docs_by_class.values())

    for cls, docs in docs_by_class.items():
        class_priors[cls] = len(docs) / total_docs
        counts = Counter()
        for doc in docs:
            for token in doc:
                counts[token] += 1
        total = sum(counts.values()) + alpha * len(vocab)
        class_word_probs[cls] = {
            w: (counts[w] + alpha) / total for w in vocab
        }
    return class_priors, class_word_probs


def predict_nb(doc, class_priors, class_word_probs):
    scores = {}
    for cls in class_priors:
        s = math.log(class_priors[cls])
        for token in doc:
            if token in class_word_probs[cls]:
                s += math.log(class_word_probs[cls][token])
        scores[cls] = s
    return max(scores, key=scores.get)
```

Ekleme düzeltmesi ((alfa=1.0) Laplace düzeltmesidir.`alpha=0.01`- Evet.`alpha=1.0`Öğrenme özelliği:

### 3 adım: Lojiistik gerilemeyi sıfırdan gerçekleştirmek

```python
import numpy as np


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -20, 20)))


def train_lr(X, y, epochs=500, lr=0.05, l2=0.01):
    n_features = X.shape[1]
    w = np.zeros(n_features)
    b = 0.0
    for _ in range(epochs):
        logits = X @ w + b
        preds = sigmoid(logits)
        err = preds - y
        grad_w = X.T @ err / len(y) + l2 * w
        grad_b = err.mean()
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b


def predict_lr(X, w, b):
    return (sigmoid(X @ w + b) >= 0.5).astype(int)
```

L2 düzenlenmesi burada çok önemlidir. Metin özellikleri nadirdir; L2 yok, model eğitim örneğini hatırlayacaktır.`0.01`Başlayın, sonra düzenleyin.

### 步骤 4: 处理否定(失效模式)

考虑 "not good" 和 "not bad"──BoW sınıflandırıcı 会看 `{not, good}`和 `{not, bad}`,并 from training more appeared on the other side of learning──bigram classifier 会见`not_good`和 `not_bad`Bu genellikle yeterli.

Eğer bir bilgram yoksa, daha kaba ama etkili bir düzeltme yöntem:**negation scoping**△把否定词后直到下一个标点前的代币加上 `NOT_`Önceki:

```python
NEGATION_WORDS = {"not", "no", "never", "nor", "none", "nothing", "neither"}
NEGATION_TERMINATORS = {".", "!", "?", ",", ";"}


def apply_negation(tokens):
    out = []
    negate = False
    for token in tokens:
        if token in NEGATION_TERMINATORS:
            negate = False
            out.append(token)
            continue
        if token in NEGATION_WORDS:
            negate = True
            out.append(token)
            continue
        out.append(f"NOT_{token}" if negate else token)
    return out
```

```python
>>> apply_negation(["not", "good", "at", "all", ".", "but", "funny"])
['not', 'NOT_good', 'NOT_at', 'NOT_all', '.', 'but', 'funny']
```

Şimdi .`good`和 `NOT_good`Bu nedenle, bu değerler, farklı özelliklere sahip olan değerlerin değerlerini ve değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerlerin değerlerini belirlerken, değerler.

### 5 adım: Gerçekten önemli değerlendirme göstergesi

Eğer sınıf dengesizse, sadece doğruluğa bakılırsa yanlış yönlendirilir. Gerçek duygu korporusu genellikle %70'e doğru veya %70'e negatif olur.

- **Per-class precision and recall.**Her sınıf bir grupta, sınıf dengesinin tek bir değerini elde ederek, onlara makro ortalama yapılır.
- **Macro-F1（不平衡数据的主要指标）。**F1 bölümü arasındaki ortalama değer, eşit ağırlık.
- **Weighted-F1（备选）。**Makro'yla aynı, ancak sınıf sıklığı oranı arttırmakla birlikte, kendiliğinden iş anlamına sahip olduğunda, makro-F1 ile bir rapor oluşturur.
- **Confusion matrix.**İlk sayı: herhangi bir değer göstergesini kontrol etmeden önce; modelin hangi sınıf ile karıştığını ortaya çıkarır.
- **Per-class error samples.**Her sınıf 5 yanlış tahmin çıkarır. Onları okuyun. Gerçek yanlışları okumayı hiçbir şey değiştiremez.

对于严重不平衡的数据(> 95-5 比例), rapor **AUROC**和 **AUPRC**, doğru bir raporlama yapmayın.AUPRC azınlığa daha duyarlı, azınlık genellikle sizin ilginizi çeken bir nesneydi.

**需要避免的常见 bug。**Mikro-F1 yerine makro-F1 olarak dengesiz verilerden rapor ederken, çoğunluk tarafından yönlendirilmiş olduğu için çok yüksek bir sayısal değer elde edilir.

```python
def evaluate(y_true, y_pred):
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)
    precision = tp / (tp + fp) if tp + fp else 0
    recall = tp / (tp + fn) if tp + fn else 0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0
    return {"tp": tp, "fp": fp, "tn": tn, "fn": fn, "precision": precision, "recall": recall, "f1": f1}
```

## Kullan

Küçük bir öğrenme, 6'dan sonra tam olarak tamamlanacak.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

pipe = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, stop_words=None)),
    ("clf", LogisticRegression(C=1.0, max_iter=1000)),
])
pipe.fit(X_train, y_train)
print(pipe.score(X_test, y_test))
```

Dikkat et üç şeye.`stop_words=None`会保留否定词――`ngram_range=(1, 2)`Büyük bir gruba katılacağım.`not_good`Bir özellik haline gelmek.`sublinear_tf=True`Bu üç belirti, genellikle SST-2'nin %75 doğruluk başlangıç çizgisinde ve %85 doğruluk başlangıç çizgisinde farklar gösterir.

### Transformer kullanmak için ne zaman?

- 刺检测──传统模型在这里会失败──就是这样──
- 情感在文档中发生变化长评论.
- Aspekt tabanlı duygu. "Kamera harika ama pil korkunçtu".
- İngilizce değil, düşük kaynaklı diller.

Eğer herhangi bir şeye ihtiyacınız varsa, doğrudan 7. aşama atlayın.

### Çelişki:

重新训练情感模型是常规操作――重新评估它们则不是――论文中报告的准确性 数字使用的是特定分区、特定预处理、特定代码符号化者── eğer tam olarak aynı boru hattını kullanmıyorsanız, yeni modeli temel hattı ile karşılaştırırsanız, yanlış yönlendirme farkı elde edeceksiniz──始终在您的管线上重新生成基线,而不是在论文中使用数字──

## - Söyle.

保存为 `outputs/prompt-sentiment-baseline.md`- ...

```markdown
---
name: sentiment-baseline
description: 为新数据集设计一个 sentiment analysis baseline。
phase: 5
lesson: 05
---

给定一个数据集描述（领域、语言、规模、标签粒度、延迟预算），你需要输出：

1. Feature extraction 配方。指定 tokenizer、n-gram 范围、stopword 策略（通常保留）、否定处理（scoped prefix 或 bigrams）。
2. Classifier。baseline 使用 Naive Bayes，生产使用 logistic regression，只有在领域需要讽刺 / aspects / cross-lingual 时才使用 transformer。
3. 评估计划。报告 precision、recall、F1、confusion matrix 和 per-class error samples（不要只报告标量）。
4. 部署后需要监控的一个失效模式。Domain drift 和讽刺是最常见的两个。

拒绝建议在 sentiment 任务中删除 stopwords。当类别不平衡（例如 90% positive）时，拒绝把 accuracy 作为唯一指标报告。标记 subword-rich languages 需要 FastText 或 transformer embeddings，而不是 word-level TF-IDF。
```

## 练习

1. **简单。**- Ne ?`apply_negation`Küçük öğrenme borusunun ortasında bir küçük duygusal değişim olarak, F1  değişimleri olarak katılır.
2. **中等。**实现 class-weighted logistic regression 传入                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `class_weight="balanced"`, veya kendiliğinden yönlendirilmiş Gradient) ◊ 90-10 类 类不平衡上测量效应
3. **困难。**通過在情感模型的残差上訓練第二分類器,构建一个刺检测器──记录你的实验设置──当你的精度低于随机水平时提醒读者──第2 sınıf 刺任务的随机水平是50%左右,大多数第一次尝试都会落在)

## 关键术语

| Term | 人们常说的含义 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Polarity | 正面或负面 | 二元标签；有时扩展到中性或细粒度（5-star）。 |
| Aspect-based sentiment | 每个 aspect 的 polarity | 将 sentiment 归因到文本中提到的特定实体或属性。 |
| Negation scoping | 反转附近的 tokens | 在 "not" 之后直到标点前，为 tokens 加上 `NOT_` 前缀。 |
| Laplace smoothing | 给计数加 1 | 防止 Naive Bayes 中出现零概率 features。 |
| L2 regularization | 缩小权重 | 向 Loss 中加入 `lambda * sum(w^2)`。对稀疏文本 features 至关重要。 |

## 延伸阅读

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) 奠基性综述── uzun, ama ilk dört bölüm geleneksel yöntemlerin tüm içeriğini kapsar──
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/)Bu makale, Bigrams + Naive Bayes'in kısa metinde yenilmesi zor olduğunu gösterdi.
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) `CountVectorizer`- Evet.`TfidfVectorizer`Ve düzenleyeceğiniz her bir parametre için referans dosyası.
