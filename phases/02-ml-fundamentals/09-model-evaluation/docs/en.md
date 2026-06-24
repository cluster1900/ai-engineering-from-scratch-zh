# Model Evaluation

> 一个 model 的好坏，取决于你衡量它的方式。

**Type:** Build
**Languages:** Python
**先修要求：** Phase 1（Probability & Distributions, Statistics for ML）、Phase 2 Lessons 1-8
**Time:** ~90 分钟

## 学习目标

- 从零实现 K-fold 和 stratified K-fold cross-validation，并解释为什么 stratification 对 imbalanced data 很重要
- 从零计算 precision、recall、F1、AUC-ROC，以及 Regression 指标（MSE、RMSE、MAE、R-squared）
- 解读 learning curves，诊断 model 是否存在 high bias 或 high variance
- 识别常见评估错误，包括 data leakage、错误的 metric 选择，以及 test set contamination

## 问题

你训练了一个 model。它在你的数据上达到了 95% accuracy。它好吗？

也许好。也许不好。如果你的数据中 95% 都属于同一个 class，那么一个总是预测这个 class 的 model 也能得到 95% accuracy，但它完全没用。如果你在训练用过的同一批数据上评估，95% 这个数字没有意义，因为 model 只是记住了答案。如果你的 dataset 有时间成分，而你在切分前随机打乱了数据，那么 model 可能正在用未来数据预测过去。

Model evaluation 是大多数 ML 项目出错的地方。错误的 metric 会让差 model 看起来很好。错误的 split 会让 model 作弊。错误的比较会让你选到更差的 model。正确做好评估不是可选项。它决定了一个 model 是能在 production 中工作，还是一见到真实数据就失败。

## 概念

### Train, Validation, Test

```mermaid
flowchart LR
    A[Full Dataset] --> B[Train Set 60-70%]
    A --> C[Validation Set 15-20%]
    A --> D[Test Set 15-20%]
    B --> E[Fit Model]
    E --> C
    C --> F[Tune Hyperparameters]
    F --> E
    F --> G[Final Model]
    G --> D
    D --> H[Report Performance]
```

三个 split，三种用途：

- **Training set**：model 从这些数据中学习。训练期间它会看到这些样本。
- **Validation set**：用于调优 hyperparameters，并在多个 models 之间做选择。model 不会在这些数据上训练，但你的决策会受到它的影响。
- **Test set**：只在最后触碰一次，用来报告最终 performance。如果你查看了 test performance，然后回头修改 model，它就不再是 test set 了。它已经变成了第二个 validation set。

Test set 是你的 hold-out 保证，用来确保报告的 performance 反映 model 在真正未见数据上的表现。

### K-Fold Cross-Validation

对于小 dataset，单次 train/validation split 会浪费数据，并产生噪声较大的估计。K-fold cross-validation 会把所有数据都用于 training 和 validation：

```mermaid
flowchart TB
    subgraph Fold1["Fold 1"]
        direction LR
        V1["Val"] --- T1a["Train"] --- T1b["Train"] --- T1c["Train"] --- T1d["Train"]
    end
    subgraph Fold2["Fold 2"]
        direction LR
        T2a["Train"] --- V2["Val"] --- T2b["Train"] --- T2c["Train"] --- T2d["Train"]
    end
    subgraph Fold3["Fold 3"]
        direction LR
        T3a["Train"] --- T3b["Train"] --- V3["Val"] --- T3c["Train"] --- T3d["Train"]
    end
    subgraph Fold4["Fold 4"]
        direction LR
        T4a["Train"] --- T4b["Train"] --- T4c["Train"] --- V4["Val"] --- T4d["Train"]
    end
    subgraph Fold5["Fold 5"]
        direction LR
        T5a["Train"] --- T5b["Train"] --- T5c["Train"] --- T5d["Train"] --- V5["Val"]
    end
    Fold1 --> R["Average scores"]
    Fold2 --> R
    Fold3 --> R
    Fold4 --> R
    Fold5 --> R
```

1. 将数据分成 K 个大小相等的 folds
2. 对每个 fold，在 K-1 个 folds 上训练，并在剩余 fold 上验证
3. 对 K 个 validation scores 求平均

K=5 或 K=10 是标准选择。每个 data point 都恰好被用于 validation 一次。平均 score 比任何单次 split 都是更稳定的估计。

**Stratified K-fold**：在每个 fold 中保留 class distribution。如果你的 dataset 是 70% class A 和 30% class B，那么每个 fold 都会大致保持相同比例。这对 imbalanced datasets 很重要，因为随机 split 可能会把所有 minority samples 都放进一个 fold。

### Classification 指标

**Confusion matrix**：基础。对于 binary classification：

|  | Predicted Positive | Predicted Negative |
|--|---|---|
| Actually Positive | True Positive (TP) | False Negative (FN) |
| Actually Negative | False Positive (FP) | True Negative (TN) |

从这个 Matrix 可以得到所有其他指标：

- **Accuracy** = (TP + TN) / (TP + TN + FP + FN)。预测正确的比例。当 classes 不平衡时会产生误导。
- **Precision** = TP / (TP + FP)。在所有预测为 positive 的对象中，有多少确实是 positive？当 false positives 代价高时使用（例如 spam filter 把真实邮件标记为 spam）。
- **Recall**（sensitivity）= TP / (TP + FN)。在所有真实 positives 中，我们抓住了多少？当 false negatives 代价高时使用（例如 cancer screening 漏掉 tumor）。
- **F1 score** = 2 * precision * recall / (precision + recall)。precision 和 recall 的 harmonic mean。当二者都不明显更重要时，用它来平衡两者。
- **AUC-ROC**：Receiver Operating Characteristic curve 下的面积。它在不同 classification thresholds 下绘制 true positive rate 与 false positive rate。AUC = 0.5 表示随机猜测，AUC = 1.0 表示完美分离。它与 threshold 无关：衡量的是 model 将 positives 排在 negatives 前面的能力，而不受你选择的 cutoff 影响。

### Regression 指标

- **MSE**（Mean Squared Error）= mean((y_true - y_pred)^2)。以平方方式惩罚大误差。对 outliers 敏感。
- **RMSE**（Root Mean Squared Error）= sqrt(MSE)。与 target variable 单位相同。比 MSE 更容易解释。
- **MAE**（Mean Absolute Error）= mean(|y_true - y_pred|)。线性对待所有误差。比 MSE 对 outliers 更稳健。
- **R-squared** = 1 - SS_res / SS_tot，其中 SS_res = sum((y_true - y_pred)^2)，SS_tot = sum((y_true - y_mean)^2)。表示 model 解释了多少方差。R^2 = 1.0 表示完美。R^2 = 0.0 表示 model 并不比总是预测均值更好。如果 model 比预测均值还差，R^2 可能为负。

### Learning Curves

将 training 和 validation scores 绘制为 training set size 的函数：

- **High bias（underfitting）**：两条曲线收敛到较低 score。增加更多数据没有帮助。你需要更复杂的 model。
- **High variance（overfitting）**：training score 很高，但 validation score 低得多。两者之间差距很大。增加更多数据通常会有帮助。

### Validation Curves

将 training 和 validation scores 绘制为某个 hyperparameter 的函数：

- 低复杂度时：两个 scores 都低（underfitting）
- 合适复杂度时：两个 scores 都高且接近
- 高复杂度时：training score 保持较高，但 validation score 下降（overfitting）

最佳 hyperparameter value 是 validation score 达到峰值的位置。

### 常见评估错误

**Data leakage**：来自 test set 的信息泄漏到 training 中。例如：在 split 之前对完整 dataset fit scaler，在 time series prediction 中包含未来数据，使用从 target 派生出来的 feature。始终先 split，再 preprocess。

**Class imbalance**：99% 的交易是 legitimate，1% 是 fraud。一个总是预测 “legitimate” 的 model 会得到 99% accuracy。应改用 precision、recall、F1 或 AUC-ROC。

**Wrong metric**：本应优化 recall（medical diagnosis）却优化 accuracy，或者当数据有严重 outliers 时优化 RMSE（应改用 MAE）。

**Not using stratified splits**：对于 imbalanced data，随机 split 可能会让 validation fold 中 minority samples 很少，从而产生不稳定估计。

**Testing too often**：每次你查看 test performance 并做调整，都会对 test set 过拟合。Test set 只能使用一次。


```figure
precision-recall-threshold
```

## 构建它

### 步骤 1： Train/validation/test split

```python
import random
import math


def train_val_test_split(X, y, train_ratio=0.6, val_ratio=0.2, seed=42):
    random.seed(seed)
    n = len(X)
    indices = list(range(n))
    random.shuffle(indices)

    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))

    train_idx = indices[:train_end]
    val_idx = indices[train_end:val_end]
    test_idx = indices[val_end:]

    X_train = [X[i] for i in train_idx]
    y_train = [y[i] for i in train_idx]
    X_val = [X[i] for i in val_idx]
    y_val = [y[i] for i in val_idx]
    X_test = [X[i] for i in test_idx]
    y_test = [y[i] for i in test_idx]

    return X_train, y_train, X_val, y_val, X_test, y_test
```

### 第 2 步：K-fold 和 stratified K-fold cross-validation

```python
def kfold_split(n, k=5, seed=42):
    random.seed(seed)
    indices = list(range(n))
    random.shuffle(indices)

    fold_size = n // k
    folds = []

    for i in range(k):
        start = i * fold_size
        end = start + fold_size if i < k - 1 else n
        val_idx = indices[start:end]
        train_idx = indices[:start] + indices[end:]
        folds.append((train_idx, val_idx))

    return folds


def stratified_kfold_split(y, k=5, seed=42):
    random.seed(seed)

    class_indices = {}
    for i, label in enumerate(y):
        class_indices.setdefault(label, []).append(i)

    for label in class_indices:
        random.shuffle(class_indices[label])

    folds = [{"train": [], "val": []} for _ in range(k)]

    for label, indices in class_indices.items():
        fold_size = len(indices) // k
        for i in range(k):
            start = i * fold_size
            end = start + fold_size if i < k - 1 else len(indices)
            val_part = indices[start:end]
            train_part = indices[:start] + indices[end:]
            folds[i]["val"].extend(val_part)
            folds[i]["train"].extend(train_part)

    return [(f["train"], f["val"]) for f in folds]


def cross_validate(X, y, model_fn, k=5, metric_fn=None, stratified=False):
    n = len(X)

    if stratified:
        folds = stratified_kfold_split(y, k)
    else:
        folds = kfold_split(n, k)

    scores = []
    for train_idx, val_idx in folds:
        X_train = [X[i] for i in train_idx]
        y_train = [y[i] for i in train_idx]
        X_val = [X[i] for i in val_idx]
        y_val = [y[i] for i in val_idx]

        model = model_fn()
        model.fit(X_train, y_train)
        predictions = [model.predict(x) for x in X_val]

        if metric_fn:
            score = metric_fn(y_val, predictions)
        else:
            score = sum(1 for yt, yp in zip(y_val, predictions) if yt == yp) / len(y_val)
        scores.append(score)

    return scores
```

### 步骤 3： Confusion matrix 和 Classification 指标

```python
def confusion_matrix(y_true, y_pred):
    tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
    tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 0)
    fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)
    fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)
    return tp, tn, fp, fn


def accuracy(y_true, y_pred):
    tp, tn, fp, fn = confusion_matrix(y_true, y_pred)
    total = tp + tn + fp + fn
    return (tp + tn) / total if total > 0 else 0.0


def precision(y_true, y_pred):
    tp, tn, fp, fn = confusion_matrix(y_true, y_pred)
    return tp / (tp + fp) if (tp + fp) > 0 else 0.0


def recall(y_true, y_pred):
    tp, tn, fp, fn = confusion_matrix(y_true, y_pred)
    return tp / (tp + fn) if (tp + fn) > 0 else 0.0


def f1_score(y_true, y_pred):
    p = precision(y_true, y_pred)
    r = recall(y_true, y_pred)
    return 2 * p * r / (p + r) if (p + r) > 0 else 0.0


def roc_curve(y_true, y_scores):
    thresholds = sorted(set(y_scores), reverse=True)
    tpr_list = []
    fpr_list = []

    total_positives = sum(y_true)
    total_negatives = len(y_true) - total_positives

    for threshold in thresholds:
        y_pred = [1 if s >= threshold else 0 for s in y_scores]
        tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
        fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)

        tpr = tp / total_positives if total_positives > 0 else 0.0
        fpr = fp / total_negatives if total_negatives > 0 else 0.0

        tpr_list.append(tpr)
        fpr_list.append(fpr)

    return fpr_list, tpr_list, thresholds


def auc_roc(y_true, y_scores):
    fpr_list, tpr_list, _ = roc_curve(y_true, y_scores)

    pairs = sorted(zip(fpr_list, tpr_list))
    fpr_sorted = [p[0] for p in pairs]
    tpr_sorted = [p[1] for p in pairs]

    area = 0.0
    for i in range(1, len(fpr_sorted)):
        width = fpr_sorted[i] - fpr_sorted[i - 1]
        height = (tpr_sorted[i] + tpr_sorted[i - 1]) / 2
        area += width * height

    return area
```

### 步骤 4： Regression 指标

```python
def mse(y_true, y_pred):
    n = len(y_true)
    return sum((yt - yp) ** 2 for yt, yp in zip(y_true, y_pred)) / n


def rmse(y_true, y_pred):
    return math.sqrt(mse(y_true, y_pred))


def mae(y_true, y_pred):
    n = len(y_true)
    return sum(abs(yt - yp) for yt, yp in zip(y_true, y_pred)) / n


def r_squared(y_true, y_pred):
    mean_y = sum(y_true) / len(y_true)
    ss_res = sum((yt - yp) ** 2 for yt, yp in zip(y_true, y_pred))
    ss_tot = sum((yt - mean_y) ** 2 for yt in y_true)
    if ss_tot == 0:
        return 0.0
    return 1.0 - ss_res / ss_tot
```

### 步骤 5： Learning curves

```python
def learning_curve(X, y, model_fn, metric_fn, train_sizes=None, val_ratio=0.2, seed=42):
    random.seed(seed)
    n = len(X)
    indices = list(range(n))
    random.shuffle(indices)

    val_size = int(n * val_ratio)
    val_idx = indices[:val_size]
    pool_idx = indices[val_size:]

    X_val = [X[i] for i in val_idx]
    y_val = [y[i] for i in val_idx]

    if train_sizes is None:
        train_sizes = [int(len(pool_idx) * r) for r in [0.1, 0.2, 0.4, 0.6, 0.8, 1.0]]

    train_scores = []
    val_scores = []

    for size in train_sizes:
        subset = pool_idx[:size]
        X_train = [X[i] for i in subset]
        y_train = [y[i] for i in subset]

        model = model_fn()
        model.fit(X_train, y_train)

        train_pred = [model.predict(x) for x in X_train]
        val_pred = [model.predict(x) for x in X_val]

        train_scores.append(metric_fn(y_train, train_pred))
        val_scores.append(metric_fn(y_val, val_pred))

    return train_sizes, train_scores, val_scores
```

### 步骤 6： 一个用于测试的简单 classifier，以及完整 demo

```python
class SimpleLogistic:
    def __init__(self, lr=0.1, epochs=100):
        self.lr = lr
        self.epochs = epochs
        self.weights = None
        self.bias = 0.0

    def sigmoid(self, z):
        z = max(-500, min(500, z))
        return 1.0 / (1.0 + math.exp(-z))

    def fit(self, X, y):
        n_features = len(X[0])
        self.weights = [0.0] * n_features
        self.bias = 0.0

        for _ in range(self.epochs):
            for xi, yi in zip(X, y):
                z = sum(w * x for w, x in zip(self.weights, xi)) + self.bias
                pred = self.sigmoid(z)
                error = yi - pred
                for j in range(n_features):
                    self.weights[j] += self.lr * error * xi[j]
                self.bias += self.lr * error

    def predict_proba(self, x):
        z = sum(w * xi for w, xi in zip(self.weights, x)) + self.bias
        return self.sigmoid(z)

    def predict(self, x):
        return 1 if self.predict_proba(x) >= 0.5 else 0


class SimpleLinearRegression:
    def __init__(self, lr=0.001, epochs=200):
        self.lr = lr
        self.epochs = epochs
        self.weights = None
        self.bias = 0.0

    def fit(self, X, y):
        n_features = len(X[0])
        self.weights = [0.0] * n_features
        self.bias = 0.0
        n = len(X)

        for _ in range(self.epochs):
            for xi, yi in zip(X, y):
                pred = sum(w * x for w, x in zip(self.weights, xi)) + self.bias
                error = yi - pred
                for j in range(n_features):
                    self.weights[j] += self.lr * error * xi[j] / n
                self.bias += self.lr * error / n

    def predict(self, x):
        return sum(w * xi for w, xi in zip(self.weights, x)) + self.bias


def standardize(values):
    n = len(values)
    mean = sum(values) / n
    var = sum((v - mean) ** 2 for v in values) / n
    std = math.sqrt(var) if var > 0 else 1.0
    return [(v - mean) / std for v in values], mean, std


def make_classification_data(n=300, seed=42):
    random.seed(seed)
    X = []
    y = []
    for _ in range(n):
        x1 = random.gauss(0, 1)
        x2 = random.gauss(0, 1)
        label = 1 if (x1 + x2 + random.gauss(0, 0.5)) > 0 else 0
        X.append([x1, x2])
        y.append(label)
    return X, y


def make_regression_data(n=200, seed=42):
    random.seed(seed)
    X = []
    y = []
    for _ in range(n):
        x1 = random.uniform(0, 10)
        x2 = random.uniform(0, 5)
        target = 3 * x1 + 2 * x2 + random.gauss(0, 2)
        X.append([x1, x2])
        y.append(target)
    return X, y


def make_imbalanced_data(n=300, minority_ratio=0.05, seed=42):
    random.seed(seed)
    X = []
    y = []
    for _ in range(n):
        if random.random() < minority_ratio:
            x1 = random.gauss(3, 0.5)
            x2 = random.gauss(3, 0.5)
            label = 1
        else:
            x1 = random.gauss(0, 1)
            x2 = random.gauss(0, 1)
            label = 0
        X.append([x1, x2])
        y.append(label)
    return X, y


if __name__ == "__main__":
    X_clf, y_clf = make_classification_data(300)

    print("=== Train/Validation/Test Split ===")
    X_train, y_train, X_val, y_val, X_test, y_test = train_val_test_split(X_clf, y_clf)
    print(f"  Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    print(f"  Train class distribution: {sum(y_train)}/{len(y_train)} positive")
    print(f"  Val class distribution: {sum(y_val)}/{len(y_val)} positive")

    model = SimpleLogistic(lr=0.1, epochs=200)
    model.fit(X_train, y_train)

    print("\n=== Classification Metrics ===")
    y_pred = [model.predict(x) for x in X_test]
    tp, tn, fp, fn = confusion_matrix(y_test, y_pred)
    print(f"  Confusion matrix: TP={tp}, TN={tn}, FP={fp}, FN={fn}")
    print(f"  Accuracy:  {accuracy(y_test, y_pred):.4f}")
    print(f"  Precision: {precision(y_test, y_pred):.4f}")
    print(f"  Recall:    {recall(y_test, y_pred):.4f}")
    print(f"  F1 Score:  {f1_score(y_test, y_pred):.4f}")

    y_scores = [model.predict_proba(x) for x in X_test]
    auc = auc_roc(y_test, y_scores)
    print(f"  AUC-ROC:   {auc:.4f}")

    print("\n=== K-Fold Cross-Validation (K=5) ===")
    cv_scores = cross_validate(
        X_clf, y_clf,
        model_fn=lambda: SimpleLogistic(lr=0.1, epochs=200),
        k=5,
        metric_fn=accuracy,
    )
    mean_cv = sum(cv_scores) / len(cv_scores)
    std_cv = math.sqrt(sum((s - mean_cv) ** 2 for s in cv_scores) / len(cv_scores))
    print(f"  Fold scores: {[round(s, 4) for s in cv_scores]}")
    print(f"  Mean: {mean_cv:.4f} (+/- {std_cv:.4f})")

    print("\n=== Stratified K-Fold Cross-Validation (K=5) ===")
    strat_scores = cross_validate(
        X_clf, y_clf,
        model_fn=lambda: SimpleLogistic(lr=0.1, epochs=200),
        k=5,
        metric_fn=accuracy,
        stratified=True,
    )
    strat_mean = sum(strat_scores) / len(strat_scores)
    strat_std = math.sqrt(sum((s - strat_mean) ** 2 for s in strat_scores) / len(strat_scores))
    print(f"  Fold scores: {[round(s, 4) for s in strat_scores]}")
    print(f"  Mean: {strat_mean:.4f} (+/- {strat_std:.4f})")

    print("\n=== Imbalanced Data: Why Accuracy Lies ===")
    X_imb, y_imb = make_imbalanced_data(300, minority_ratio=0.05)
    positives = sum(y_imb)
    print(f"  Class distribution: {positives} positive, {len(y_imb) - positives} negative ({positives/len(y_imb)*100:.1f}% positive)")

    always_negative = [0] * len(y_imb)
    print(f"  Always-negative baseline:")
    print(f"    Accuracy:  {accuracy(y_imb, always_negative):.4f}")
    print(f"    Precision: {precision(y_imb, always_negative):.4f}")
    print(f"    Recall:    {recall(y_imb, always_negative):.4f}")
    print(f"    F1 Score:  {f1_score(y_imb, always_negative):.4f}")

    X_tr_i, y_tr_i, X_v_i, y_v_i, X_te_i, y_te_i = train_val_test_split(X_imb, y_imb)
    model_imb = SimpleLogistic(lr=0.5, epochs=500)
    model_imb.fit(X_tr_i, y_tr_i)
    y_pred_imb = [model_imb.predict(x) for x in X_te_i]
    print(f"\n  Trained model on imbalanced data:")
    print(f"    Accuracy:  {accuracy(y_te_i, y_pred_imb):.4f}")
    print(f"    Precision: {precision(y_te_i, y_pred_imb):.4f}")
    print(f"    Recall:    {recall(y_te_i, y_pred_imb):.4f}")
    print(f"    F1 Score:  {f1_score(y_te_i, y_pred_imb):.4f}")

    print("\n=== Regression Metrics ===")
    X_reg, y_reg = make_regression_data(200)

    col0 = [x[0] for x in X_reg]
    col1 = [x[1] for x in X_reg]
    col0_s, m0, s0 = standardize(col0)
    col1_s, m1, s1 = standardize(col1)
    X_reg_scaled = [[col0_s[i], col1_s[i]] for i in range(len(X_reg))]

    X_tr_r, y_tr_r, X_v_r, y_v_r, X_te_r, y_te_r = train_val_test_split(X_reg_scaled, y_reg)
    reg_model = SimpleLinearRegression(lr=0.01, epochs=500)
    reg_model.fit(X_tr_r, y_tr_r)
    y_pred_r = [reg_model.predict(x) for x in X_te_r]

    print(f"  MSE:       {mse(y_te_r, y_pred_r):.4f}")
    print(f"  RMSE:      {rmse(y_te_r, y_pred_r):.4f}")
    print(f"  MAE:       {mae(y_te_r, y_pred_r):.4f}")
    print(f"  R-squared: {r_squared(y_te_r, y_pred_r):.4f}")

    mean_baseline = [sum(y_tr_r) / len(y_tr_r)] * len(y_te_r)
    print(f"\n  Mean baseline:")
    print(f"    MSE:       {mse(y_te_r, mean_baseline):.4f}")
    print(f"    R-squared: {r_squared(y_te_r, mean_baseline):.4f}")

    print("\n=== Learning Curve ===")
    sizes, train_sc, val_sc = learning_curve(
        X_clf, y_clf,
        model_fn=lambda: SimpleLogistic(lr=0.1, epochs=200),
        metric_fn=accuracy,
    )
    print(f"  {'Size':>6} {'Train':>8} {'Val':>8}")
    for s, tr, va in zip(sizes, train_sc, val_sc):
        print(f"  {s:>6} {tr:>8.4f} {va:>8.4f}")

    print("\n=== Statistical Model Comparison ===")
    model_a_scores = cross_validate(
        X_clf, y_clf,
        model_fn=lambda: SimpleLogistic(lr=0.1, epochs=100),
        k=5, metric_fn=accuracy,
    )
    model_b_scores = cross_validate(
        X_clf, y_clf,
        model_fn=lambda: SimpleLogistic(lr=0.1, epochs=500),
        k=5, metric_fn=accuracy,
    )
    diffs = [a - b for a, b in zip(model_a_scores, model_b_scores)]
    mean_diff = sum(diffs) / len(diffs)
    std_diff = math.sqrt(sum((d - mean_diff) ** 2 for d in diffs) / len(diffs))
    t_stat = mean_diff / (std_diff / math.sqrt(len(diffs))) if std_diff > 0 else 0.0
    print(f"  Model A (100 epochs) mean: {sum(model_a_scores)/len(model_a_scores):.4f}")
    print(f"  Model B (500 epochs) mean: {sum(model_b_scores)/len(model_b_scores):.4f}")
    print(f"  Mean difference: {mean_diff:.4f}")
    print(f"  Paired t-statistic: {t_stat:.4f}")
    print(f"  (|t| > 2.78 for significance at p<0.05 with df=4)")
```

## 使用它

使用 scikit-learn 时，evaluation 已经内置在 workflow 中：

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold, learning_curve
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, mean_squared_error, r2_score,
)
from sklearn.linear_model import LogisticRegression

model = LogisticRegression()
scores = cross_val_score(model, X, y, cv=StratifiedKFold(5), scoring="f1")
```

从零实现的版本会清楚展示 cross-validation 到底做了什么（没有魔法，只是 for-loops 和 index tracking）、每个 metric 如何计算（只是统计 TP/FP/TN/FN），以及为什么 stratification 很重要（在每个 fold 中保留 class ratios）。库版本则提供 parallelism、更多 scoring options，以及与 pipelines 的集成。

## 交付它

本课会产出：
- `outputs/skill-evaluation.md` - 一个覆盖 Classification 和 Regression models 评估策略的 skill

## 练习

1. 实现 precision-recall curves：在不同 thresholds 下绘制 precision 与 recall。计算 average precision（PR curve 下的面积）。在 imbalanced dataset 上比较 PR curve 和 ROC curve，并解释什么时候哪一个更有信息量。
2. 构建 nested cross-validation loop：外层 loop 评估 model performance，内层 loop 调优 hyperparameters。用它公平比较两个 models，避免把 validation data 泄漏到 evaluation 中。
3. 实现用于 model comparison 的 permutation test：打乱 labels、重新训练并衡量 performance。重复 100 次构建 null distribution。计算 observed model performance 相对于这个 distribution 的 p-value。

## 关键术语

| Term | 人们通常怎么说 | 它实际是什么意思 |
|------|----------------|----------------------|
| Overfitting | “记住了 training data” | model 捕捉了 training data 中的噪声，在 training 上表现好，但在 unseen data 上表现差 |
| Cross-validation | “在不同子集上测试” | 系统地轮换用于 validation 的数据部分，并对所有轮换的结果求平均 |
| Precision | “预测为 positive 的里面有多少是正确的” | TP / (TP + FP)：positive predictions 中实际为 positive 的比例 |
| Recall | “我们找到了多少真实 positives” | TP / (TP + FN)：actual positives 中被正确识别出来的比例 |
| AUC-ROC | “model 区分类别的能力有多好” | 在所有 thresholds 下，true positive rate 与 false positive rate 曲线下的面积，范围从 0.5（随机）到 1.0（完美） |
| R-squared | “解释了多少方差” | 1 -（squared residuals 之和 / total sum of squares）：model 捕捉到的 target variance 比例 |
| Data leakage | “model 作弊了” | 在 training 期间使用了 prediction time 不可用的信息，导致 evaluation 过于乐观 |
| Learning curve | “数据更多时 performance 如何变化” | training 和 validation scores 相对于 training set size 的图，用来揭示 underfitting 或 overfitting |
| Stratified split | “保持 class ratios 平衡” | split 数据时，让每个 subset 中各 class 的比例与完整 dataset 相同 |

## 延伸阅读

- [scikit-learn Model Selection Guide](https://scikit-learn.org/stable/model_selection.html) - 关于 cross-validation、metrics 和 hyperparameter tuning 的全面参考
- [Beyond Accuracy: Precision and Recall (Google ML Crash Course)](https://developers.google.com/machine-learning/crash-course/classification/precision-and-recall) - 带交互示例的清晰解释
- [A Survey of Cross-Validation Procedures (Arlot & Celisse, 2010)](https://projecteuclid.org/journals/statistics-surveys/volume-4/issue-none/A-survey-of-cross-validation-procedures-for-model-selection/10.1214/09-SS054.full) - 对不同 CV 策略何时以及为何有效的严谨讨论
