# Sự lùi hậu cần

> Sự lùi lại hậu cần sẽ được chuyển thành đường thẳng của đường cong S, với tỷ lệ xác suất trả lời câu hỏi là hay không.

**类型：**Xây dựng
**语言：**Python
**先修要求：**Giai đoạn 2 Bài học 1-2 (Điều gì là ML, Khôi phục tuyến tính)
**时间：**约90分钟

## Học mục tiêu

- Sử dụng hàm sigmoid 和 mất tích giao hợp phân tử từ zero để thực hiện sự lùi hậu cần
- 计算并解释 phân loại nhị phân Trung tâm của chính xác, nhớ lại, điểm số F1 và trật tự
- 解释 tại sao MSE không phù hợp với phân loại, và tại sao sự chéo trôi qua nhị phân sẽ tạo ra bề mặt chi phí ngập
- 构建用于 đa lớp phân loại của mô hình hồi quy softmax,并 đánh giá điều chỉnh ngưỡng

## 问题

Bạn nghĩ theo 瘤大小预测 nó là ác tính hay tốt lành. Bạn thử sử dụng sự lùi lại tuyến tính. Nó sẽ xuất phát 0.3、1.7 hoặc -0.5 như vậy. Những con số này có nghĩa là gì?1.7  rất ác tính??-0.5  rất tốt lành?

Khối tháo hậu cần  đã giải quyết vấn đề này. Nó sử dụng cùng một kết hợp 线性组合 (wx + b), sau đó thông qua hàm sigmoid, sẽ được nén bất kỳ số nào đến (0, 1) 范围内.

Đây là một trong những thuật toán được sử dụng rộng rãi nhất trong thực tế. Mặc dù có sự lùi lại, sự lùi lại hậu cần là một thuật toán phân loại, chứ không phải thuật toán lùi lại.

## 核心概念

### Tại sao sự lùi ngược tuyến tính không phù hợp với phân loại

假设根据学习时长预测通过/未通过(1/0) ――Tình ngược tuyến tính 会拟合一条穿过数据的直线:

```
hours:  1   2   3   4   5   6   7   8   9   10
actual: 0   0   0   0   1   1   1   1   1   1
```

线性拟合可能会在第1小时给出 -0.2,在第10小时给出 1.3── loại giá trị này không phải là xác suất── chúng sẽ thấp hơn 0, cũng sẽ cao hơn 1.── tệ hơn, một ngoại lệ (ví dụ: ai đó học 50小时) sẽ kéo dài toàn bộ条直线, thay đổi dự đoán của chủ sở hữu──

Định dạng 需要一个满足以下条件的函数:
- 输出 0 đến 1 之间的值(概率)
- 产生清晰的转变 (tự quyết định)
- Không được xa biên giới của ngoại lệ

### Chức năng Sigmoid

chức năng sigmoid 正是这样做:

```
sigmoid(z) = 1 / (1 + e^(-z))
```

性质:
- Khi z là số lượng chính xác lớn,sigmoid(z)  gần 1
- Khi z là số lượng lớn,sigmoid(z)  gần 0
- 当 z = 0 时,sigmoid(z) = 0,5
- 输出始终位于0 和 1 之间
- Chức năng này là đơn giản và dễ dàng

Nó của dẫn xuất 具有方便的形式:sigmoid'(z) = sigmoid(z) * (1 - sigmoid(z))。这让 Gradient 计算更高效。

### Lệ nở logistics = mô hình tuyến tính + Sigmoid

模型先计算 z = wx + b(与线性回归相同), rồi áp dụng sigmoid:

```mermaid
flowchart LR
    X[Input features x] --> L["Linear: z = wx + b"]
    L --> S["Sigmoid: p = 1/(1+e^-z)"]
    S --> D{"p >= 0.5?"}
    D -->|Yes| P[Predict 1]
    D -->|No| N[Predict 0]
```

输出 p được giải thích là P(y=1 ∈ x), tức là输入 thuộc lớp 1 của tỷ lệ có thể xảy ra.

### Loss Cross-Entropy Binary

Không có khả năng trong sự lùi hậu cần sử dụng MSE。带 sigmoid của MSE 会产生非凸的成本表面,并存在许多地方最小──应使用二进制交叉缩 (tạm dịch:

```
Loss = -(1/n) * sum(y * log(p) + (1-y) * log(1-p))
```

Tại sao nó hiệu quả:
- 当 y=1 且 p 接近 1 时:log(1) = 0, do đó, mất mát 接近 0(正确,低成本)
- 当 y=1 且 p 接近 0 时:log(0) 接近负无穷, do đó mất mát 很大(错误,高成本)
- 当 y=0 且 p 接近 0 时:log(1) = 0, do đó, mất mát 接近 0(正确,低成本)
- 当 y=0 且 p 接近 1 时:log(0) 接近负无穷, do đó mất mát 很大(错误,高成本)

Đối với sự lùi hậu cần, chức năng mất mát này là cao, do đó đảm bảo chỉ có một mức tối thiểu toàn cầu.

### Sự giảm dần về hậu cần

sigmoid 搭配 binary cross-entropy 时,Gradient 具有简洁形式:

```
dL/dw = (1/n) * sum((p - y) * x)
dL/db = (1/n) * sum(p - y)
```

它们看起来与线性回归的渐进式完全相同──区别在于p = sigmoid(wx + b),而不是p = wx + b──sigmoid 引入非线性,但渐进式 更新规则保持不变──

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

### Biên giới quyết định

Đối với 2D 输入( hai tính năng), ranh giới quyết định là đáp ứng các điều kiện sau:

```
w1*x1 + w2*x2 + b = 0
```

Một bên của điểm được phân loại là 1, bên kia của điểm được phân loại là 0―― Lập ngược logic 总是产生线性决策界限――如果需要曲的界限,要么添加多项函数,要么使用非线性模型――

### Sử dụng Softmax  thực hiện phân loại đa lớp

Trình ngược hậu cần nhị phân  xử lý hai lớp。 đối với các lớp k 个, sử dụng hàm softmax:

```
softmax(z_i) = e^(z_i) / sum(e^(z_j) for all j)
```

Mỗi lớp có vector trọng lượng riêng của mình. Mô hình cho mỗi lớp tính toán một điểm z_i, sau đó softmax sẽ chuyển đổi điểm thành tổng và tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ lệ tỷ số tỷ số tỷ số tỷ lệ tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ số tỷ tỷ tỷ số tỷ số tỷ tỷ tỷ tỷ tỷ số tỷ số tỷ tỷ tỷ số tỷ số tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ tỷ

Hàm mất 变为 phân loại chéo entropy:

```
Loss = -(1/n) * sum(sum(y_k * log(p_k)))
```

Trong đó y_k đối với lớp thực 为 1, đối với tất cả các lớp khác 为 0(một mã hóa nóng)

### Các số liệu đánh giá

Chỉ dựa vào độ chính xác không đủ. Đối với một tập dữ liệu tích cực 95%-5% thì một mô hình tổng thể dự đoán tiêu cực có thể đạt được độ chính xác 95%, nhưng không có ích gì.

**Confusion Matrix**- Có thể là:

| | Predicted Positive | Predicted Negative |
|---|---|---|
| Actually Positive | True Positive (TP) | False Negative (FN) |
| Actually Negative | False Positive (FP) | True Negative (TN) |

**Precision**Trong tất cả các dự đoán tích cực, có bao nhiêu thực tế là tích cực?
```
Precision = TP / (TP + FP)
```

**Recall**(Sensitivity): Trong tất cả các mẫu thực sự tích cực, chúng ta đã bắt được bao nhiêu?
```
Recall = TP / (TP + FN)
```

**F1 Score**: độ chính xác và trung bình hài hòa của việc thu hồi.
```
F1 = 2 * (Precision * Recall) / (Precision + Recall)
```

 ưu tiên:
- **Precision**:当 giả tích cực 代价高时(spam filter,你不希望阻止合法电子邮件)
- **Recall**Khi âm tính sai 代价高时(bệnh ung thư, bạn không muốn bị khối u)
- **F1**Khi bạn cần một cân bằng đơn vị métrics


```figure
logistic-sigmoid
```

##  xây dựng nó

### 步骤 1: chức năng Sigmoid và tạo dữ liệu

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

### 步骤 2: Từ zero thực hiện Lịch lý

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

### Bước 3: Từ zero thực hiện sự nhầm lẫn matrix và métrics

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

### 步骤 4: Biên giới quyết định 分析

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

### 步骤 5: 使用 softmax  xử lý đa lớp

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

### 步骤 6: Định hướng ngưỡng

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

## Sử dụng nó

Giờ thì hãy học cách làm như vậy.

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

Bạn từ đầu thực hiện sẽ tạo ra cùng một ranh giới quyết định và métrics。Scikit-learn  tăng các tùy chọn giải pháp (liblinear、lbfgs、saga)、 tự động điều chỉnh lại、 nhiều lớp chiến lược ((one-vs-rest、multi-nomal) và tối ưu hóa ổn định số。

## 交付 nó

本课会产出:
- `code/logistic_regression.py`- Từ zero thực hiện sự lùi hậu cần, bao gồm các métrics

## 练习

1. 生成一个不是线性分离的数据集 (例如两个同心圆) ――训练物流回归并观察它的失败――然后添加多项函数 (x1^2、x2^2、x1*x2)并再次训练――展示精度得到提升――
2. Để mô hình softmax 3 lớp  thực hiện một matrix nhầm lẫn đa lớp ⋅ tính toán chính xác mỗi lớp 和 nhớ lại ⋅ loại nào khó nhất?
3. Từ zero cấu trúc đường cong ROC── đối với 100 giá trị ngưỡng giữa 0 đến 1 , tính toán tỷ lệ tích cực thực và tỷ lệ tích cực sai── sử dụng quy tắc trapezoidal  tính toán AUC(vùng dưới đường cong)。

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
