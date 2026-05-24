# Sentiment Analysis

> 经典的 NLP 任务。关于传统文本 Classification 你需要掌握的大部分内容，都会在这里出现。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 2 · 14 (Naive Bayes)
**Time:** ~75 minutes

## 问题

"The food was not great." 是正面还是负面？

Sentiment 听起来很简单。评论者说他们喜欢或不喜欢某样东西。给句子打标签即可。它之所以成为经典 NLP 任务，是因为每个看似简单的案例背后都藏着难点。否定会翻转含义。讽刺会反转含义。"Not bad at all" 尽管有两个带负面编码的词，却是正面的。Emoji 承载的信号可能比周围文本更多。领域词汇很重要（音乐评论里的 `tight` 与时尚评论里的 `tight` 含义不同）。

Sentiment 是传统 NLP 的实践实验室。如果你理解为什么每个 naive baseline 都有特定的失效模式，你就理解了为什么会发明每一种更丰富的模型。本课会从零构建一个 Naive Bayes baseline，加入 logistic regression，并指出那些让生产级 sentiment 变成合规级问题的陷阱。

## 概念

传统 sentiment 是一个两步配方。

1. **表示。** 把文本转成 feature vector。BoW、TF-IDF 或 n-grams。
2. **Classification。** 在带标签样本上拟合一个 linear model（Naive Bayes、logistic regression、SVM）。

Naive Bayes 是能工作的最笨模型。假设在给定标签的情况下，每个 feature 都相互独立。根据计数估计 `P(word | positive)` 和 `P(word | negative)`。推理时，将这些概率相乘。这个 "naive" 独立性假设错得可笑，但结果却强得惊人。原因是：在稀疏文本 features 和中等规模数据下，classifier 更关心每个词偏向哪一边，而不是偏向程度有多大。

Logistic regression 修正了独立性假设。它为每个 feature 学习一个权重，包括负权重。`not good` 作为一个 bigram feature 会得到负权重。Naive Bayes 无法对从未标注过的 bigrams 做到这一点。

## 构建它

### 步骤 1： 一个真实的迷你数据集

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

数据集故意很小。真实工作会使用数万条样本（IMDb、SST-2、Yelp polarity）。数学原理完全相同。

### 步骤 2： 从零实现 multinomial Naive Bayes

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

Additive smoothing（alpha=1.0）就是 Laplace smoothing。没有它，一个在某个类别中未出现过的词会得到零概率，log 会爆掉。实践中常用 `alpha=0.01`。`alpha=1.0` 是教学默认值。

### 步骤 3： 从零实现 logistic regression

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

L2 regularization 在这里很重要。文本 features 是稀疏的；没有 L2，模型会记住训练样本。从 `0.01` 开始，然后调参。

### 步骤 4： 处理否定（失效模式）

考虑 "not good" 和 "not bad"。BoW classifier 会看到 `{not, good}` 和 `{not, bad}`，并从训练中出现更多的那一侧学习。bigram classifier 会看到 `not_good` 和 `not_bad`，并把它们学成不同 features。这通常就足够了。

当你没有 bigrams 时，一个更粗糙但有效的修复方式是：**negation scoping**。把否定词之后直到下一个标点前的 tokens 加上 `NOT_` 前缀。

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

现在 `good` 和 `NOT_good` 是不同 features。classifier 可以给它们相反的权重。三行预处理，就能在 sentiment benchmarks 上带来可测量的准确率提升。

### 步骤 5： 真正重要的评估指标

如果类别不平衡，只看 accuracy 会产生误导。真实 sentiment corpora 通常是 70-80% positive 或 70-80% negative；一个始终预测多数类的 classifier 可以拿到 80% accuracy，但毫无价值。请报告以下每一项：

- **Per-class precision and recall.** 每个类别一组。对它们做 macro-average，得到一个尊重类别平衡的单一数值。
- **Macro-F1（不平衡数据的主要指标）。** 各类别 F1 分数的均值，等权重。当类别不平衡时，用它替代 accuracy。
- **Weighted-F1（备选）。** 与 macro 相同，但按类别频率加权。当不平衡本身具有业务意义时，与 macro-F1 一起报告。
- **Confusion matrix.** 原始计数。信任任何标量指标之前都要检查它；它会揭示模型混淆的是哪一对类别。
- **Per-class error samples.** 每个类别抽取 5 个错误预测。阅读它们。没有什么能替代阅读真实错误。

对于严重不平衡的数据（> 95-5 比例），报告 **AUROC** 和 **AUPRC**，不要报告 accuracy。AUPRC 对少数类更敏感，而少数类通常才是你关心的对象（spam、fraud、稀有 sentiment）。

**需要避免的常见 bug。** 在不平衡数据上报告 micro-F1 而不是 macro-F1，会得到一个看起来很高的数值，因为它由多数类主导。Macro-F1 会迫使你看见少数类表现。

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

## 使用它

scikit-learn 用六行就能正确完成。

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

注意三件事。`stop_words=None` 会保留否定词。`ngram_range=(1, 2)` 会加入 bigrams，让 `not_good` 成为一个 feature。`sublinear_tf=True` 会削弱重复词的影响。这三个标志，往往就是 SST-2 上 75% accuracy baseline 和 85% accuracy baseline 的差别。

### 什么时候该使用 transformer

- 讽刺检测。传统模型在这里会失败。就是这样。
- 情感在文档中途发生变化的长评论。
- Aspect-based sentiment。"Camera was great but battery was terrible." 你需要把 sentiment 归因到具体 aspect。只能用 Transformers 或 structured output models。
- 非英语、低资源语言。Multilingual BERT 会免费给你一个 zero-shot baseline。

如果你需要以上任何一项，直接跳到 phase 7（transformers deep dive）。否则，基于 TF-IDF 加 bigrams 加否定处理的 Naive Bayes 或 logistic regression，就是你的 2026 生产 baseline。

### 可复现性陷阱（再次出现）

重新训练 sentiment models 是常规操作。重新评估它们则不是。论文中报告的 accuracy 数字使用的是特定 splits、特定 preprocessing、特定 tokenizers。如果你没有使用完全相同的 pipeline，却把新模型与 baseline 比较，就会得到误导性的差值。始终在你的 pipeline 上重新生成 baseline，而不是使用论文里的数字。

## 交付它

保存为 `outputs/prompt-sentiment-baseline.md`：

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

1. **简单。** 把 `apply_negation` 作为 scikit-learn pipeline 中的预处理步骤加入，并在一个小型 sentiment 数据集上测量 F1 变化。
2. **中等。** 实现 class-weighted logistic regression（向 scikit-learn 传入 `class_weight="balanced"`，或自行推导 Gradient）。在合成的 90-10 类别不平衡上测量效果。
3. **困难。** 通过在 sentiment model 的残差上训练第二个 classifier，构建一个讽刺检测器。记录你的实验设置。当你的 accuracy 低于随机水平时提醒读者（2-class 讽刺任务的随机水平约为 50%，大多数第一次尝试都会落在那里）。

## 关键术语

| Term | 人们常说的含义 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Polarity | 正面或负面 | 二元标签；有时扩展到中性或细粒度（5-star）。 |
| Aspect-based sentiment | 每个 aspect 的 polarity | 将 sentiment 归因到文本中提到的特定实体或属性。 |
| Negation scoping | 反转附近的 tokens | 在 "not" 之后直到标点前，为 tokens 加上 `NOT_` 前缀。 |
| Laplace smoothing | 给计数加 1 | 防止 Naive Bayes 中出现零概率 features。 |
| L2 regularization | 缩小权重 | 向 Loss 中加入 `lambda * sum(w^2)`。对稀疏文本 features 至关重要。 |

## 延伸阅读

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) — 奠基性综述。很长，但前四节覆盖了传统方法的全部内容。
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/) — 这篇论文展示了 bigrams + Naive Bayes 在短文本上很难被击败。
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) — `CountVectorizer`、`TfidfVectorizer` 以及你会调节的每个参数的参考文档。
