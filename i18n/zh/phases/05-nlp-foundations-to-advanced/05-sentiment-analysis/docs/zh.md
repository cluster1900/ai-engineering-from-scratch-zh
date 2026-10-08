# 感觉分析

> 经典的NLP任务.关于传统文本分类,你需要掌握的大部分内容,都会出现.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 2 · 14 (Naive Bayes)
**Time:** ~75 minutes

## 问题

"食物不好". 是正面还是负面?

感觉 听起来很简单――评论家说他们喜欢或不喜欢某种东西――给句子打标签即可――它之所以成为经典的NLP任务,是因为每个看似简单的案例背后都藏着难点――否定会翻转含义――刺会反转含义――"不坏的"尽管有两个带负面编码的词,但正面的――情感 承载的信号可能比周围文本更多――领域词汇很重要(音乐评论中的`tight`时尚评论中的`tight`含义不同) 』

感觉是传统的NLP实践实验室.如果你明白为什么每一个天真的基线都具有特定的失败模式,你就明白了为什么会发明每一个更丰富的模型. 本课程将从零构建一个天真的贝尔基线,加入物流回归,并指出那些让生产级感觉变成合规级问题的陷.

## 概念

传统情感是一个两步配方.

1. **表示。**把文本转换为特征向量──BoW、TF-IDF 或n-gram──
2. **Classification。**在带标签样本上拟合一个线性模型 ((无码贝斯、物流回归、SVM) 

假设在给定标签的情况下,每个特征都相互独立.`P(word | positive)`和 `P(word | negative)`,在推理时,将这些概率相乘.这个"无明"独立性假设是可笑的,但结果却强烈令人惊.原因是:在稀疏文本的特征和中等规模数据下,

逻辑回归修改了独立性假设. 它为每个特征学习一个权重,包括负权重.`not good`作为一个大图的特征会得到负权重.


```figure
sentiment-logits
```

## 构建它

### 步骤1:一个真实的迷你数据集

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

数据集故意很小. 真实工作会使用数万条样本.

### 步骤2:从零实现多个个体的天真

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

没有它,一个在某个类别中未出现的词会得到零概率,log会爆掉――实践中常用`alpha=0.01`,我知道.`alpha=1.0`是教学默认值.

### 步骤3:从零实现物流回归

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

没有L2,模型会记住训练样本.`0.01`开始,然后调参.

### 步骤 4: 处理否定(失效模式)

考虑"不好" 和"不坏"──BoW分类器 会看到`{not, good}`和 `{not, bad}`,从训练中出现更多的学习.`not_good`和 `not_bad`它们通常是足够的.

当你没有大图时,一个粗略但有效的修复方法是:**negation scoping**把否定词后直到下一个标点前的代币加上`NOT_`之前的

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

现在`good`和 `NOT_good`它们的重量可以相反的重量.

### 步骤5:真正重要的评估指标

如果类别不平衡,只看准确度会产生误导――真情体通常是70-80%积极或70-80%负面;一个总是预测大多数类型的分类器可以获得80%准确度,但没有价值――请报告以下每一个项目:

- **Per-class precision and recall.**每个类型一组. 对它们做一个宏观平均值,得到一个尊重类别平衡的单一数值.
- **Macro-F1（不平衡数据的主要指标）。**类别F1 分数的平均值等权重.当类别不平衡时,用其替代准确性.
- **Weighted-F1（备选）。**与宏观相似,但按类别频率加权.
- **Confusion matrix.**首先,我们必须检查任何标志指标之前;它会揭示模型混的是哪个对类.
- **Per-class error samples.**每个类别抽取了5个错误预测.阅读它们.没有什么可以替代阅读真实错误.

对于严重不平衡的数据 (例如: 95-5),报告**AUROC**和 **AUPRC**对于少数群体而言,AUPRC更敏感,而少数群体通常是你关心的对象.

**需要避免的常见 bug。**在不平衡数据上报告微F1而不是宏F1,会得到一个看起来很高的数值,因为它由大多数类主导.

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

简单的学习 用六行就能正确完成.

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

注意三件事.`stop_words=None`会保留否定词.`ngram_range=(1, 2)`加入大片,让`not_good`成为一个特征.`sublinear_tf=True`由于这些三种标志,往往就是SST-2上75%的精度基线和85%的精度基线的差异.

### 什么时候该使用变压器

- 刺检测――传统模型在这里会失败――就是这样――
- 情感在文档中发生了变化长评论.
- 基于面貌的感觉――"相机很棒,但电池很糟糕". 你需要把感觉归因于具体的面貌――只能使用变压器或结构化输出模型――
- 无英语、低资源语言──多语言BERT 会免费给你一个零射线基础――

如果需要以上任何一项,直接跳到第7阶段 (转变器深入潜水) 否则,基于TF-IDF加大图加否定处理的天真,或物流回归,就是你的2026生产基线.

### 可复现性陷 (再次出现)

重新训练情感模型是常规操作.重新评估它们不是.论文中报告的准确性 数字使用的是特定的分区,特定的预处理,特定的代币化器.如果你没有使用完全相同的管道,而把新模型与基线比较,就会得到误导的差值.

## 交付它

保存为`outputs/prompt-sentiment-baseline.md`其他:

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

1. **简单。**让我`apply_negation`作为小学习管道中的预处理步骤加入,并在一个小情绪数据集上测量F1 变化.
2. **中等。**实现按类重量的物流回归 转向小学学习 传入 `class_weight="balanced"`综合 90-10 类别不平衡量测量效果
3. **困难。**通过在情感模型的残差上训练第二个分类器,构建一个刺检测器――记录你的实验设置――当你的准确性低于随机水平时提醒读者――二级刺任务的随机水平约为50%,大多数第一次尝试都会落在那里)

## 关键术语

| Term | 人们常说的含义 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Polarity | 正面或负面 | 二元标签；有时扩展到中性或细粒度（5-star）。 |
| Aspect-based sentiment | 每个 aspect 的 polarity | 将 sentiment 归因到文本中提到的特定实体或属性。 |
| Negation scoping | 反转附近的 tokens | 在 "not" 之后直到标点前，为 tokens 加上 `NOT_` 前缀。 |
| Laplace smoothing | 给计数加 1 | 防止 Naive Bayes 中出现零概率 features。 |
| L2 regularization | 缩小权重 | 向 Loss 中加入 `lambda * sum(w^2)`。对稀疏文本 features 至关重要。 |

## 延伸阅读

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) 奠基性综述――很长,但前四节覆盖了传统方法的全部内容――
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/) 这篇论文展示了巨人 + 简单的贝斯 在短文中很难被击败.
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) `CountVectorizer`,我知道.`TfidfVectorizer`您将调节的每个参数的参考文档.
