# Logistic Regression

> Logistic regression 将一条直线弯成 S-curve，用概率回答是或否的问题。

**类型：** Build
**语言：** Python
**先修要求：** Phase 2 Lesson 1-2 (What Is ML, Linear Regression)
**时间：** 约 90 分钟

## 学习目标

- 使用 sigmoid function 和 binary cross-entropy loss 从零实现 logistic regression
- 计算并解释 binary classification 中的 precision、recall、F1 score 和 confusion matrix
- 解释为什么 MSE 不适合 Classification，以及为什么 binary cross-entropy 会产生 convex cost surface
- 构建用于 multi-class classification 的 softmax regression model，并评估 threshold tuning 的权衡

## 问题

你想根据肿瘤大小预测它是 malignant 还是 benign。你尝试使用 linear regression。它会输出 0.3、1.7 或 -0.5 这样的数字。这些数字是什么意思？1.7 是“非常 malignant”吗？-0.5 是“非常 benign”吗？Linear regression 输出的是无界数字。Classification 需要 0 到 1 之间的有界概率，以及明确的决策：是或否。

Logistic regression 解决了这个问题。它使用相同的线性组合 (wx + b)，然后通过 sigmoid function，将任意数字压缩到 (0, 1) 范围内。输出就是概率。你设置一个 threshold（通常是 0.5），然后做出决策。

这是实践中使用最广泛的算法之一。尽管名字里有 regression，logistic regression 是一个 Classification algorithm，而不是 Regression algorithm。这个名字来自它所使用的 logistic（sigmoid）function。

## 核心概念

### 为什么 Linear Regression 不适合 Classification

假设根据学习时长预测通过/未通过（1/0）。Linear regression 会拟合一条穿过数据的直线：

```
hours:  1   2   3   4   5   6   7   8   9   10
actual: 0   0   0   0   1   1   1   1   1   1
```

线性拟合可能会在第 1 小时给出 -0.2，在第 10 小时给出 1.3。这样的值不是概率。它们会低于 0，也会高于 1。更糟的是，一个 outlier（例如某人学习了 50 小时）会拖动整条直线，改变所有人的预测。

Classification 需要一个满足以下条件的 function：
- 输出 0 到 1 之间的值（概率）
- 产生清晰的转变（decision boundary）
- 不会被远离 boundary 的 outlier 扭曲

### Sigmoid Function

sigmoid function 正是这样做的：

```
sigmoid(z) = 1 / (1 + e^(-z))
```

性质：
- 当 z 是很大的正数时，sigmoid(z) 接近 1
- 当 z 是很大的负数时，sigmoid(z) 接近 0
- 当 z = 0 时，sigmoid(z) = 0.5
- 输出始终位于 0 和 1 之间
- 该 function 处处平滑且可微

它的 derivative 具有方便的形式：sigmoid'(z) = sigmoid(z) * (1 - sigmoid(z))。这让 Gradient 计算更高效。

### Logistic Regression = Linear Model + Sigmoid

模型先计算 z = wx + b（与 linear regression 相同），然后应用 sigmoid：

```mermaid
flowchart LR
    X[Input features x] --> L["Linear: z = wx + b"]
    L --> S["Sigmoid: p = 1/(1+e^-z)"]
    S --> D{"p >= 0.5?"}
    D -->|Yes| P[Predict 1]
    D -->|No| N[Predict 0]
```

输出 p 被解释为 P(y=1 | x)，即输入属于 class 1 的概率。decision boundary 位于 wx + b = 0 的位置，此时 sigmoid 输出恰好为 0.5。

### Binary Cross-Entropy Loss

不能在 logistic regression 中使用 MSE。带 sigmoid 的 MSE 会产生非凸的 cost surface，并存在许多 local minima。应使用 binary cross-entropy（log loss）：

```
Loss = -(1/n) * sum(y * log(p) + (1-y) * log(1-p))
```

为什么它有效：
- 当 y=1 且 p 接近 1 时：log(1) = 0，因此 loss 接近 0（正确，低成本）
- 当 y=1 且 p 接近 0 时：log(0) 接近负无穷，因此 loss 很大（错误，高成本）
- 当 y=0 且 p 接近 0 时：log(1) = 0，因此 loss 接近 0（正确，低成本）
- 当 y=0 且 p 接近 1 时：log(0) 接近负无穷，因此 loss 很大（错误，高成本）

对于 logistic regression，这个 Loss Function 是凸的，因此保证只有一个 global minimum。

### Logistic Regression 的 Gradient Descent

sigmoid 搭配 binary cross-entropy 时，Gradient 具有简洁形式：

```
dL/dw = (1/n) * sum((p - y) * x)
dL/db = (1/n) * sum(p - y)
```

它们看起来与 linear regression 的 Gradient 完全相同。区别在于 p = sigmoid(wx + b)，而不是 p = wx + b。sigmoid 引入了非线性，但 Gradient 更新规则保持不变。

```mermaid
flowchart TD
    A[Initialize w=0, b=0] --> B[Forward pass: z = wx+b, p = sigmoid z]
    B --> C[Compute loss: binary cross-entropy]
    C --> D["Compute gradients: dw = (1/n) * sum((p-y)*x)"]
    D --> E[Update: w = w - lr*dw, b = b - lr*db]
    E --> F{Converged?}
    F -->|No| B
    F -->|Yes| G[Model trained]
```

### Decision Boundary

对于 2D 输入（两个 features），decision boundary 是满足以下条件的直线：

```
w1*x1 + w2*x2 + b = 0
```

一侧的点被 Classification 为 1，另一侧的点被 Classification 为 0。Logistic regression 总是产生线性的 decision boundary。如果需要弯曲的 boundary，要么添加 polynomial features，要么使用 nonlinear model。

### 使用 Softmax 进行 Multi-Class Classification

Binary logistic regression 处理两个 classes。对于 k 个 classes，使用 softmax function：

```
softmax(z_i) = e^(z_i) / sum(e^(z_j) for all j)
```

每个 class 都有自己的 weight vector。模型为每个 class 计算一个 score z_i，然后 softmax 将 scores 转换为总和为 1 的概率。预测 class 是概率最高的那个 class。

Loss Function 变为 categorical cross-entropy：

```
Loss = -(1/n) * sum(sum(y_k * log(p_k)))
```

其中 y_k 对 true class 为 1，对所有其他 classes 为 0（one-hot encoding）。

### Evaluation Metrics

仅靠 Accuracy 不够。对于一个 95% negative、5% positive 的 dataset，一个总是预测 negative 的模型可以获得 95% Accuracy，但毫无用处。

**Confusion Matrix**：

| | Predicted Positive | Predicted Negative |
|---|---|---|
| Actually Positive | True Positive (TP) | False Negative (FN) |
| Actually Negative | False Positive (FP) | True Negative (TN) |

**Precision**：在所有预测为 positive 的样本中，有多少实际是 positive？
```
Precision = TP / (TP + FP)
```

**Recall**（Sensitivity）：在所有实际为 positive 的样本中，我们抓住了多少？
```
Recall = TP / (TP + FN)
```

**F1 Score**：precision 和 recall 的 harmonic mean。平衡两个 metrics。
```
F1 = 2 * (Precision * Recall) / (Precision + Recall)
```

优先考虑的场景：
- **Precision**：当 false positives 代价高时（spam filter，你不希望阻止 legitimate email）
- **Recall**：当 false negatives 代价高时（cancer screening，你不希望漏掉 tumor）
- **F1**：当你需要一个平衡的单一 metric 时

## 构建它

### 步骤 1：Sigmoid function 与数据生成

```python
import random
import math

def sigmoid(z):
    z = max(-500, min(500, z))
    return 1.0 / (1.0 + math.exp(-z))


random.seed(42)
N = 200
X = []
y = []

for _ in range(N // 2):
    X.append([random.gauss(2, 1), random.gauss(2, 1)])
    y.append(0)

for _ in range(N // 2):
    X.append([random.gauss(5, 1), random.gauss(5, 1)])
    y.append(1)

combined = list(zip(X, y))
random.shuffle(combined)
X, y = zip(*combined)
X = list(X)
y = list(y)

print(f"Generated {N} samples (2 classes, 2 features)")
print(f"Class 0 center: (2, 2), Class 1 center: (5, 5)")
print(f"First 5 samples:")
for i in range(5):
    print(f"  Features: [{X[i][0]:.2f}, {X[i][1]:.2f}], Label: {y[i]}")
```

### 步骤 2：从零实现 Logistic Regression

```python
class LogisticRegression:
    def __init__(self, n_features, learning_rate=0.01):
        self.weights = [0.0] * n_features
        self.bias = 0.0
        self.lr = learning_rate
        self.loss_history = []

    def predict_proba(self, x):
        z = sum(w * xi for w, xi in zip(self.weights, x)) + self.bias
        return sigmoid(z)

    def predict(self, x, threshold=0.5):
        return 1 if self.predict_proba(x) >= threshold else 0

    def compute_loss(self, X, y):
        n = len(y)
        total = 0.0
        for i in range(n):
            p = self.predict_proba(X[i])
            p = max(1e-15, min(1 - 1e-15, p))
            total += y[i] * math.log(p) + (1 - y[i]) * math.log(1 - p)
        return -total / n

    def fit(self, X, y, epochs=1000, print_every=200):
        n = len(y)
        n_features = len(X[0])
        for epoch in range(epochs):
            dw = [0.0] * n_features
            db = 0.0
            for i in range(n):
                p = self.predict_proba(X[i])
                error = p - y[i]
                for j in range(n_features):
                    dw[j] += error * X[i][j]
                db += error
            for j in range(n_features):
                self.weights[j] -= self.lr * (dw[j] / n)
            self.bias -= self.lr * (db / n)
            loss = self.compute_loss(X, y)
            self.loss_history.append(loss)
            if epoch % print_every == 0:
                print(f"  Epoch {epoch:4d} | Loss: {loss:.4f} | w: [{self.weights[0]:.3f}, {self.weights[1]:.3f}] | b: {self.bias:.3f}")
        return self

    def accuracy(self, X, y):
        correct = sum(1 for i in range(len(y)) if self.predict(X[i]) == y[i])
        return correct / len(y)


split = int(0.8 * N)
X_train, X_test = X[:split], X[split:]
y_train, y_test = y[:split], y[split:]

print("\n=== Training Logistic Regression ===")
model = LogisticRegression(n_features=2, learning_rate=0.1)
model.fit(X_train, y_train, epochs=1000, print_every=200)

print(f"\nTrain accuracy: {model.accuracy(X_train, y_train):.4f}")
print(f"Test accuracy:  {model.accuracy(X_test, y_test):.4f}")
print(f"Weights: [{model.weights[0]:.4f}, {model.weights[1]:.4f}]")
print(f"Bias: {model.bias:.4f}")
```

### 步骤 3： 从零实现 confusion matrix 和 metrics

```python
class ClassificationMetrics:
    def __init__(self, y_true, y_pred):
        self.tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
        self.tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)
        self.fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
        self.fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)

    def accuracy(self):
        total = self.tp + self.tn + self.fp + self.fn
        return (self.tp + self.tn) / total if total > 0 else 0

    def precision(self):
        denom = self.tp + self.fp
        return self.tp / denom if denom > 0 else 0

    def recall(self):
        denom = self.tp + self.fn
        return self.tp / denom if denom > 0 else 0

    def f1(self):
        p = self.precision()
        r = self.recall()
        return 2 * p * r / (p + r) if (p + r) > 0 else 0

    def print_confusion_matrix(self):
        print(f"\n  Confusion Matrix:")
        print(f"                  Predicted")
        print(f"                  Pos   Neg")
        print(f"  Actual Pos     {self.tp:4d}  {self.fn:4d}")
        print(f"  Actual Neg     {self.fp:4d}  {self.tn:4d}")

    def print_report(self):
        self.print_confusion_matrix()
        print(f"\n  Accuracy:  {self.accuracy():.4f}")
        print(f"  Precision: {self.precision():.4f}")
        print(f"  Recall:    {self.recall():.4f}")
        print(f"  F1 Score:  {self.f1():.4f}")


y_pred_test = [model.predict(x) for x in X_test]
print("\n=== Classification Report (Test Set) ===")
metrics = ClassificationMetrics(y_test, y_pred_test)
metrics.print_report()
```

### 步骤 4：Decision boundary 分析

```python
print("\n=== Decision Boundary ===")
w1, w2 = model.weights
b = model.bias
print(f"Decision boundary: {w1:.4f}*x1 + {w2:.4f}*x2 + {b:.4f} = 0")
if abs(w2) > 1e-10:
    print(f"Solved for x2:     x2 = {-w1/w2:.4f}*x1 + {-b/w2:.4f}")

print("\nSample predictions near the boundary:")
test_points = [
    [3.0, 3.0],
    [3.5, 3.5],
    [4.0, 4.0],
    [2.5, 2.5],
    [5.0, 5.0],
]
for point in test_points:
    prob = model.predict_proba(point)
    pred = model.predict(point)
    print(f"  [{point[0]}, {point[1]}] -> prob={prob:.4f}, class={pred}")
```

### 步骤 5: 使用 softmax 处理 multi-class

```python
class SoftmaxRegression:
    def __init__(self, n_features, n_classes, learning_rate=0.01):
        self.n_features = n_features
        self.n_classes = n_classes
        self.lr = learning_rate
        self.weights = [[0.0] * n_features for _ in range(n_classes)]
        self.biases = [0.0] * n_classes

    def softmax(self, scores):
        max_score = max(scores)
        exp_scores = [math.exp(s - max_score) for s in scores]
        total = sum(exp_scores)
        return [e / total for e in exp_scores]

    def predict_proba(self, x):
        scores = [
            sum(self.weights[k][j] * x[j] for j in range(self.n_features)) + self.biases[k]
            for k in range(self.n_classes)
        ]
        return self.softmax(scores)

    def predict(self, x):
        probs = self.predict_proba(x)
        return probs.index(max(probs))

    def fit(self, X, y, epochs=1000, print_every=200):
        n = len(y)
        for epoch in range(epochs):
            grad_w = [[0.0] * self.n_features for _ in range(self.n_classes)]
            grad_b = [0.0] * self.n_classes
            total_loss = 0.0
            for i in range(n):
                probs = self.predict_proba(X[i])
                for k in range(self.n_classes):
                    target = 1.0 if y[i] == k else 0.0
                    error = probs[k] - target
                    for j in range(self.n_features):
                        grad_w[k][j] += error * X[i][j]
                    grad_b[k] += error
                true_prob = max(probs[y[i]], 1e-15)
                total_loss -= math.log(true_prob)
            for k in range(self.n_classes):
                for j in range(self.n_features):
                    self.weights[k][j] -= self.lr * (grad_w[k][j] / n)
                self.biases[k] -= self.lr * (grad_b[k] / n)
            if epoch % print_every == 0:
                print(f"  Epoch {epoch:4d} | Loss: {total_loss / n:.4f}")
        return self

    def accuracy(self, X, y):
        correct = sum(1 for i in range(len(y)) if self.predict(X[i]) == y[i])
        return correct / len(y)


random.seed(42)
X_3class = []
y_3class = []

centers = [(1, 1), (5, 1), (3, 5)]
for label, (cx, cy) in enumerate(centers):
    for _ in range(50):
        X_3class.append([random.gauss(cx, 0.8), random.gauss(cy, 0.8)])
        y_3class.append(label)

combined = list(zip(X_3class, y_3class))
random.shuffle(combined)
X_3class, y_3class = zip(*combined)
X_3class = list(X_3class)
y_3class = list(y_3class)

split_3 = int(0.8 * len(X_3class))
X_train_3 = X_3class[:split_3]
y_train_3 = y_3class[:split_3]
X_test_3 = X_3class[split_3:]
y_test_3 = y_3class[split_3:]

print("\n=== Multi-class Softmax Regression (3 classes) ===")
softmax_model = SoftmaxRegression(n_features=2, n_classes=3, learning_rate=0.1)
softmax_model.fit(X_train_3, y_train_3, epochs=1000, print_every=200)
print(f"\nTrain accuracy: {softmax_model.accuracy(X_train_3, y_train_3):.4f}")
print(f"Test accuracy:  {softmax_model.accuracy(X_test_3, y_test_3):.4f}")

print("\nSample predictions:")
for i in range(5):
    probs = softmax_model.predict_proba(X_test_3[i])
    pred = softmax_model.predict(X_test_3[i])
    print(f"  True: {y_test_3[i]}, Predicted: {pred}, Probs: [{', '.join(f'{p:.3f}' for p in probs)}]")
```

### 步骤 6： Threshold tuning

```python
print("\n=== Threshold Tuning ===")
print("Default threshold: 0.5. Adjusting the threshold trades precision for recall.\n")

thresholds = [0.3, 0.4, 0.5, 0.6, 0.7]
print(f"{'Threshold':>10} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10}")
print("-" * 52)

for t in thresholds:
    y_pred_t = [1 if model.predict_proba(x) >= t else 0 for x in X_test]
    m = ClassificationMetrics(y_test, y_pred_t)
    print(f"{t:>10.1f} {m.accuracy():>10.4f} {m.precision():>10.4f} {m.recall():>10.4f} {m.f1():>10.4f}")
```

## 使用它

现在用 scikit-learn 做同样的事。

```python
from sklearn.linear_model import LogisticRegression as SklearnLR
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import numpy as np

np.random.seed(42)
X_0 = np.random.randn(100, 2) + [2, 2]
X_1 = np.random.randn(100, 2) + [5, 5]
X_sk = np.vstack([X_0, X_1])
y_sk = np.array([0] * 100 + [1] * 100)

X_tr, X_te, y_tr, y_te = train_test_split(X_sk, y_sk, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_tr_sc = scaler.fit_transform(X_tr)
X_te_sc = scaler.transform(X_te)

lr = SklearnLR()
lr.fit(X_tr_sc, y_tr)
y_pred = lr.predict(X_te_sc)

print("=== Scikit-learn Logistic Regression ===")
print(f"Accuracy:  {accuracy_score(y_te, y_pred):.4f}")
print(f"Precision: {precision_score(y_te, y_pred):.4f}")
print(f"Recall:    {recall_score(y_te, y_pred):.4f}")
print(f"F1:        {f1_score(y_te, y_pred):.4f}")
print(f"\nConfusion Matrix:\n{confusion_matrix(y_te, y_pred)}")
print(f"\nClassification Report:\n{classification_report(y_te, y_pred)}")
```

你的 from-scratch 实现会产生相同的 decision boundary 和 metrics。Scikit-learn 增加了 solver options（liblinear、lbfgs、saga）、自动 regularization、multi-class strategies（one-vs-rest、multinomial）以及 numerical stability optimizations。

## 交付它

本课会产出：
- `code/logistic_regression.py` - 从零实现的 logistic regression，包含 metrics

## 练习

1. 生成一个不是 linearly separable 的 dataset（例如两个同心圆）。训练 logistic regression 并观察它的失败。然后添加 polynomial features（x1^2、x2^2、x1*x2）并再次训练。展示 Accuracy 得到提升。
2. 为 3-class softmax model 实现一个 multi-class confusion matrix。计算 per-class precision 和 recall。哪个 class 最难 Classification？
3. 从零构建 ROC curve。对 0 到 1 之间的 100 个 threshold values，计算 true positive rate 和 false positive rate。使用 trapezoidal rule 计算 AUC（area under the curve）。

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| Logistic regression | “用于 Classification 的 Regression” | 一个 linear model 后接 sigmoid function，用于输出 class probabilities |
| Sigmoid function | “S-curve” | function 1/(1+e^(-z))，将任意实数映射到 (0, 1) 范围 |
| Binary cross-entropy | “Log loss” | Loss Function -[y*log(p) + (1-y)*log(1-p)]，会严厉惩罚自信但错误的预测 |
| Decision boundary | “分界线” | 模型输出概率等于 0.5 的 surface，用于分隔 predicted classes |
| Softmax | “Multi-class sigmoid” | 将 scores 的 Vector 转换为总和为 1 的概率的 function |
| Precision | “选中的有多少是相关的” | TP / (TP + FP)，positive predictions 中实际为 positive 的比例 |
| Recall | “相关的有多少被选中” | TP / (TP + FN)，actual positives 中被模型正确识别的比例 |
| F1 score | “平衡 Accuracy” | precision 和 recall 的 harmonic mean：2*P*R / (P+R) |
| Confusion matrix | “错误分解” | 展示每个 class pair 的 TP、TN、FP、FN 计数的表格 |
| Threshold | “cutoff” | 超过该 probability value 时模型预测 class 1（默认 0.5，可调） |
| One-hot encoding | “类别的二进制列” | 将 class k 表示为一个 Vector：除位置 k 为 1 外，其余位置均为 0 |
| Categorical cross-entropy | “Multi-class log loss” | binary cross-entropy 到 k 个 classes 的扩展，使用 one-hot encoded labels |
