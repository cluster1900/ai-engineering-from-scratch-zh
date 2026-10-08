# Phân tích cảm xúc

> 经典的NLP任务――关于传统文本分类你需要掌握的大部分内容,都会出现――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 2 · 14 (Naive Bayes)
**Time:** ~75 minutes

## 问题

"Món ăn không tuyệt vời". Có phải đúng hay không?

Cảm xúc  nghe rất đơn giản. Người bình luận nói rằng họ thích hoặc không thích một cái gì đó. Nó trở thành một nhiệm vụ NLP cổ điển, bởi vì mỗi trường hợp có vẻ đơn giản đều đằng sau một điểm khó khăn. Từ chối sẽ có nghĩa chuyển đổi.`tight`Với thời trang trong bình luận `tight`含义不同)

Cảm xúc là phòng thí nghiệm thực hành của NLP truyền thống. Nếu bạn hiểu tại sao mỗi dòng cơ sở ngây thơ đều có mô hình thất bại cụ thể, bạn đã hiểu tại sao sẽ phát triển mỗi mô hình phong phú hơn.

## 概念

传统情感是一个两步配方──

1. **表示。**把文本转成 tính năng vector──BoW、TF-IDF 或 n-gram──
2. **Classification。**Trong một mô hình hình tuyến tính, nó được thiết kế để phù hợp với mô hình này.

Bayes ngây thơ là mô hình tốt nhất của công việc. giả sử trong trường hợp của một nhãn nhất định, mỗi tính năng đều độc lập với nhau.`P(word | positive)`和 `P(word | negative)` Khi suy luận, hãy tăng tỷ lệ này lên.  Hiểu thuyết độc lập "sự ngây thơ" này là sai lầm, nhưng kết quả lại rất đáng ngạc nhiên.

Khối thọ logistic đã sửa đổi giả thuyết độc lập. Nó cho mỗi tính năng học một quyền, bao gồm cả quyền tiêu cực.`not good`Như một tính năng bigram 会得到负权重. Bayes 无奈 无法 đối phó với những bigram chưa được đánh dấu.


```figure
sentiment-logits
```

##  xây dựng nó

### Bước 1: Một tập dữ liệu nhỏ thực sự

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

Số liệu tập cố ý rất nhỏ. Thực tế sẽ sử dụng hàng ngàn mẫu.

### 步骤 2: Từ zero thực hiện đa số Bayes ngây thơ

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

Additive smoothing ((alpha=1.0) là Laplace smoothing。 không có nó, một từ trong một loại nào đó không xuất hiện sẽ có tỷ lệ 0, log sẽ nổ bỏ。`alpha=0.01``alpha=1.0`Là học tập tiêu chuẩn.

### Bước 3: Từ không thực hiện sự lùi lại hậu cần

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

L2 thường xuyên ở đây rất quan trọng. Các tính năng văn bản là hiếm có; không có L2, mô hình sẽ nhớ tập luyện mẫu.`0.01`开始,然后调参。

### 步骤 4: 处理否定(失效模式)

考虑 "không tốt" 和 "không xấu"──BoW phân loại 会看 `{not, good}`和 `{not, bad}`,并 xuất hiện nhiều hơn trong tập luyện bên kia学习──bigram classifier 会看`not_good`和 `not_bad`, và học chúng thành các tính năng khác nhau.

Khi bạn không có các biểu tượng lớn, một cách sửa chữa thô hơn nhưng hiệu quả là:**negation scoping**把否定词后直到下一个标点前的代币加上 `NOT_`Trước đây

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

现在 `good`和 `NOT_good`Các tính năng khác nhau. Các phân loại có thể cho chúng trọng lượng ngược lại.

### Bước 5: Chỉ số đánh giá thực sự quan trọng

Nếu loại không cân bằng, chỉ xem độ chính xác sẽ tạo ra sai hướng. Các cơ quan cảm xúc thực thường là 70-80% tích cực hoặc 70-80% tiêu cực. Một phân loại đa số luôn dự đoán có thể đạt được độ chính xác 80%, nhưng không có giá trị. Xin báo cáo mỗi mục sau:

- **Per-class precision and recall.**Mỗi nhóm phân loại được phân tích với một trung bình lớn, đạt được một giá trị đơn lẻ của cân bằng phân loại.
- **Macro-F1（不平衡数据的主要指标）。**Giá trị trung bình của các phân loại F1, bằng trọng lượng.
- **Weighted-F1（备选）。**Tương tự như macro, nhưng theo loại tần suất tăng lên.
- **Confusion matrix.**Đáng kể: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đáng tin: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng: Đăng:
- **Per-class error samples.**Mỗi loại rút ra 5 sai lầm dự đoán. Đọc chúng. Không có gì có thể thay thế. Đọc sai lầm thực sự.

对于严重不平衡的数据 ((> 95-5 比例), báo cáo **AUROC**和 **AUPRC**, không báo cáo chính xác. AUPRC nhạy cảm hơn với nhóm thiểu số, và nhóm thiểu số thường là đối tượng bạn quan tâm.

**需要避免的常见 bug。**Trong dữ liệu không cân bằng, báo cáo micro-F1 thay vì macro-F1, sẽ có một giá trị số cao, vì nó được thống trị bởi đa số các loại.

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

## Sử dụng nó

Nhìn lại, hãy học hỏi.

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

chú ý đến 3 điều.`stop_words=None`会保留否定词――`ngram_range=(1, 2)`会加入bigrams,让 `not_good`成为一个特征――`sublinear_tf=True`会削弱重复词的影响──Thês三个标志,往往就是SST-2 上 75% chính xác cơ sở và 85% chính xác cơ sở khác biệt──

### 什么时候该使用变压器

- 刺检测──传统模型在这里会失败──就是这样──
- 情感在文档中发生变化长评论.
- "Hình ảnh rất tuyệt vời nhưng pin rất tệ". Bạn cần phải chuyển cảm xúc thành một khía cạnh cụ thể.
- Không tiếng Anh, nguồn gốc thấp,... BERT đa ngôn ngữ 会免费给你一个零射基线――

Nếu bạn cần bất cứ điều gì, nhảy thẳng vào giai đoạn 7 (transactor deep dive) ⋅ không thì, dựa trên TF-IDF 加大грам 加否定处理的 Naive Bayes 或物流回归,就是你的2026 生产基线──

### 可复现性陷(một lần nữa xuất hiện)

重新训练情感模型是常规操作. 重新评估它们则不是. 数字使用的是特定分区,特定预处理,特定代币器. Nếu bạn không sử dụng hoàn toàn cùng một đường ống, nhưng so sánh mô hình mới với đường cơ sở, bạn sẽ nhận được sự khác biệt sai lầm.

## 交付 nó

保存为 `outputs/prompt-sentiment-baseline.md`- Có thể là:

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

1. **简单。**- Đưa đi.`apply_negation`作为小学学习管道 中的预处理步骤加入,并加入一个小情感 数据集上测量 F1 变化.
2. **中等。**实现 lớp cân đối hậu cần regression(向小学学习 传入 `class_weight="balanced"`, hoặc tự giới thiệu Gradient) ⋅ trong tổng hợp 90-10 类别不平衡上测量效果
3. **困难。**Thông qua tập luyện phân loại thứ hai của mô hình cảm xúc, xây dựng một máy kiểm tra 刺. ghi lại thiết lập thí nghiệm của bạn. Khi độ chính xác của bạn thấp hơn mức độ 刺.

## 关键术语

| Term | 人们常说的含义 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Polarity | 正面或负面 | 二元标签；有时扩展到中性或细粒度（5-star）。 |
| Aspect-based sentiment | 每个 aspect 的 polarity | 将 sentiment 归因到文本中提到的特定实体或属性。 |
| Negation scoping | 反转附近的 tokens | 在 "not" 之后直到标点前，为 tokens 加上 `NOT_` 前缀。 |
| Laplace smoothing | 给计数加 1 | 防止 Naive Bayes 中出现零概率 features。 |
| L2 regularization | 缩小权重 | 向 Loss 中加入 `lambda * sum(w^2)`。对稀疏文本 features 至关重要。 |

## 延伸阅读

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) 奠基性综述── dài, nhưng phần trước bốn bao gồm toàn bộ nội dung của phương pháp truyền thống──
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/) Bài viết này cho thấy Bigrams + Naive Bayes trong ngắn bài viết rất khó bị đánh bại.
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) `CountVectorizer``TfidfVectorizer`Và các tài liệu tham khảo của mỗi tham số bạn sẽ điều chỉnh.
