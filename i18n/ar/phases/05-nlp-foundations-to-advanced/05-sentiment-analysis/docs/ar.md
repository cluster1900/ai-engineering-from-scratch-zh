# تحليل المشاعر

> مهمة النمط النووي الكلاسيكية حول تصنيف النصوص التقليدية تحتاج إلى فهم معظم المحتوى، كل شيء سوف يظهر هنا

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 2 · 14 (Naive Bayes)
**Time:** ~75 minutes

## 问题

"الطعام لم يكن رائعاً" هل هو صواب أم سلبي؟

الشعور يبدو بسيط جدا. المعلقين يقولون أنهم يحبون أو لا يحبون شيئا ما. يعطي العبارات ضرب العلامة. يمكن أن يكون.`tight`مع عصريات`tight`含义不同)

المشاعر هي المختبر العملي التقليدي لبرنامج النفط النووي. إذا كنت تفهم لماذا كل خط أساسي ساذج لديه نمط فاشل محدد، فأنت تفهم لماذا سوف تطورت كل نموذج أكثر غنى.

## 概念

الشعور التقليدي هو تصفيحي

1. **表示。**ضع النص تحويل إلى متجه ميزة بوع أو تف-إدف أو n-جرام
2. **Classification。**في带标签样本上拟合一个线性模型 ((نايف بايز、لوجستيكا رجعة、SVM) 

البغاء بايز هو أفضل نموذج للعمل. افترض في حالة وضع علامات محددة، كل ميزة مستقلة عن بعضها البعض.`P(word | positive)`和 `P(word | negative)`في التفكير، سوف نضاعف هذه الاحتمالات. هذه الفرضية "الساذجة" للاستقلال خاطئة ومضحكة، ولكن النتائج تثير الدهشة. السبب هو: في ميزات الكتابة النادرة و تحت بيانات واسعة الحجم، فإن المصنف أكثر اهتماماً بتحديد كل كلمة إلى أي جانب، وليس إلى حد كبير من التحديد.

التراجع اللوجستي 修正ت افتراض استقلالية .‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬`not good`كجزء من الميزات الكبيرة سوف تحصل على الوزن السلبي.


```figure
sentiment-logits
```

## بناءها

### الخطوة الأولى: مجموعة بيانات صغيرة حقيقية

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

عدد المعلومات في الصورة الصغيرة.

### الخطوة الثانية: من التحقق من التعددية البديلة

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

التسهيل الإضافي ((البفا=1.0) هو التسهيل اللابلاسي.`alpha=0.01`.`alpha=1.0`تعليميّةٌ مُعتمدةٌ

### الخطوة الثالثة: من الصفر تحقيق الرجعة اللوجستية

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

التنظيم L2 هنا مهم جدا. ميزات النص هي نادرة. لا يوجد L2، النموذج سوف يتذكر نموذج التدريب.`0.01`開始, ثم调参。

### 步骤 4: 处理否定(失效模式)

考虑 "ليس جيد" 和 "ليس سيئا"──BoW تصنيف 会看到 `{not, good}`和 `{not, bad}`, ومع ذلك من خلال التدريبات تظهر المزيد من ذلك الجانب التعلم.`not_good`和 `not_bad`، و تَعلمُهم في مختلف الميزاتِ.

عندما لا يكون لديك الكلمات الكبيرة، طريقة أكثر صرامة ولكن فعالة هي:**negation scoping**把否定词后直到下一个标点前的代币加上 `NOT_`قبل ♪

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

الآن`good`和 `NOT_good`يُمكن أن يُعطى المُصنفين الوزن المُعكس لهما.

### الخطوة 5: مؤشر تقييم مهم حقا

إذا كان الفئة غير متوازنة، فقط انظر الدقة سوف تسبب خطأ. عادة ما تكون العواطف الحقيقية إيجابية بنسبة 70-80٪ أو سلبية بنسبة 70-80٪. يمكن الحصول على دقة 80٪ من تصنيف الفئة الأكبر، ولكن لا قيمة لها.

- **Per-class precision and recall.**كل فئة واحدة، وذلك من أجل إجراء متوسط كبير، والحصول على قيمة واحدة من التوازن الفئة.
- **Macro-F1（不平衡数据的主要指标）。**متوسط قيمة الفئات الف1، ويمثل الوزن. عندما تكون الفئات غير متوازنة، فاستبدلها بالدقة.
- **Weighted-F1（备选）。**تشبه الكليات، ولكن حسب الفئة المعدل زيادة الوزن.
- **Confusion matrix.**التركيبات المختلفة في المجموعة هي:
- **Per-class error samples.**كل فئة تستخرج 5 أخطاء توقعات.

对于严重不平衡的数据 ((> 95-5 比例) ، تقرير **AUROC**和 **AUPRC**لا تقرير الدقة. (أو برك) أكثر حساسية للقسم الأقليمي، والقسم الأقليمي عادة ما يكون هو فقط موضوع اهتمامك (البريد الإلكتروني والاحتيال والشعور النادر)

**需要避免的常见 bug。**في بيانات غير متوازنة تقرير F1 الصغيرة بدلا من F1 الكلي، سوف تحصل على قيمة عددية تبدو عالية جدا، لأنه يسيطر على غالبية الفئات.

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

## استخدمها

تعلم قليلاً واستعمل 6 صفوف

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

انتبه إلى ثلاثة أشياء`stop_words=None`سأحتفظ بكلمة إرفض`ngram_range=(1, 2)`سأضيف الكبيرة، دعني`not_good`لتصبح ميزة`sublinear_tf=True`سوف يضعف تأثير الكلمات الردية. هذه العلامات الثلاثة، والتي هي في السابق SST-2 على 75% من الدقة في خط الأساس و 85% من الدقة في خط الأساس.

### 什么时候该使用变压器

- 刺检测──模型传统在这里会失败──就是这样──
- 情感在文档中发生变化长评论.
- الشعور القائم على الجوانب. الكاميرا كانت رائعة ولكن البطارية كانت رهيبة.
- غير انجليزية 低资源语言──BERT متعددة اللغات 会免费给你一个零shot基线──

إذا كنت بحاجة إلى أي شيء، قفز مباشرة إلى المرحلة 7 ((محولات الغوص العميقة)

### تعرض للخطر

重新训练情绪模型是常规操作.重新评估它们则不是.

## 交付 it

保存为 `outputs/prompt-sentiment-baseline.md`:

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

## التدريب

1. **简单。**- لا .`apply_negation`كخطوط للتعلم القليل، ووضع في مجموعة صغيرة من الحالات.
2. **中等。**实现 طبقة معززة التراجع اللوجستي                                                                                                                                                                                                                                                         `class_weight="balanced"`أو تحديد نفسها درجي) ◊ في المختلفة 90-10 类别不平衡上测量效果
3. **困难。**通過 دراسة الثانية على فجوة نموذج المشاعر ، قم ببناء جهاز فحص الحالة.

## 关键术语

| Term | 人们常说的含义 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Polarity | 正面或负面 | 二元标签；有时扩展到中性或细粒度（5-star）。 |
| Aspect-based sentiment | 每个 aspect 的 polarity | 将 sentiment 归因到文本中提到的特定实体或属性。 |
| Negation scoping | 反转附近的 tokens | 在 "not" 之后直到标点前，为 tokens 加上 `NOT_` 前缀。 |
| Laplace smoothing | 给计数加 1 | 防止 Naive Bayes 中出现零概率 features。 |
| L2 regularization | 缩小权重 | 向 Loss 中加入 `lambda * sum(w^2)`。对稀疏文本 features 至关重要。 |

## 延伸阅读

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) 奠基性综述── طويل، ولكن أول أربعة أجزاء تغطي كل محتوى الطرق التقليدية──
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/) هذا المقال يظهر الكبار + البراهية الباهظة في قصص قصيرة
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) `CountVectorizer`.`TfidfVectorizer`وكل المرجعية التي ستقوم بتنظيمها
