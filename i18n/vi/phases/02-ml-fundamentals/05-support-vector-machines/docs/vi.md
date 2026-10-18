# Máy hỗ trợ vector

> Trong hai loại tìm thấy đường phố rộng nhất. Đó là toàn bộ ý tưởng.

**Type:** Build
**Language:**Python
**先修要求：**Giai đoạn 1 ((Dạy học 08 Tối ưu hóa, 14 tiêu chuẩn và khoảng cách, 18 Tối ưu hóa ngọc)
**Time:** ~90 分钟

## Học mục tiêu
- Sử dụng mất vòng xoắn và công thức nguyên tố trên của sự giảm gradient, từ không thực hiện một SVM tuyến tính
- 解释 nguyên tắc biên tối đa,并从训练好的模型中识别支持向量
- So sánh các hạt nhân tuyến tính, đa nôn và RBF, và giải thích thủ thuật hạt nhân  làm thế nào để tránh hiển nhiên của high维映射
-  đánh giá bởi tham số C  kiểm soát chiều rộng biên và lỗi phân loại  cân bằng

## 问题
Bạn có hai loại điểm dữ liệu, cần vẽ một đường thẳng (hoặc siêu phẳng) để phân chia chúng. Có thể có vô hạn nhiều đường dẫn để làm điều đó. Bạn nên chọn một đường nào?

选择边界 最大的那一条──margin là ranh giới quyết định với khoảng cách giữa hai bên gần nhất dữ liệu điểm──宽的边界意味着分类者更有信心,并且能更好地概括到未见数据──

Sự trực tiếp này đã đưa ra các Máy hỗ trợ vector, nó là một trong những thuật toán tốt nhất trong toán học trung học ML. SVM trước khi Deep Learning  đã là phương pháp phân loại chủ đạo, và trong các vấn đề về tập hợp dữ liệu nhỏ, dữ liệu cao, cũng như các mô hình cần có nguyên tắc, hiểu đầy đủ, có chứng minh lý thuyết, vẫn là lựa chọn tốt nhất.

SVM  trực tiếp kết nối đến giai đoạn 1: tối ưu hóa là cong cong của (Lớp 18) , biên sử dụng các tiêu chuẩn để đo lường (Lớp 14) , trong khi các thủ thuật hạt nhân sử dụng các sản phẩm chấm, trong trường hợp không thực sự tính toán không gian cao , xử lý ranh giới phi tuyến tính.

## 概念
### Cân loại chia cắt tối đa

给定标签 $y_i \in \lbrace -1, +1 \rbrace$和 các vector tính năng $x_i$của dữ liệu phân tách tuyến tính, chúng tôi muốn tìm thấy một siêu phẳng $w^T x + b = 0$Để phân biệt lớp.

Điểm$x_i$Khoảng cách từ siêu phẳng là:

```math
\text{距离} = \frac{\lvert w^T x_i + b \rvert}{\lVert w \rVert}
```

Đối với các điểm chính xác:$y_i (w^T x_i + b) > 0$◊đánh giá là từ siêu phẳng đến phía gần nhất điểm khoảng cách hai lần.

```mermaid
graph LR
    subgraph Margin
        direction TB
        A["w^T x + b = +1"] ~~~ B["w^T x + b = 0"] ~~~ C["w^T x + b = -1"]
    end
    D["+ class points"] --> A
    E["- class points"] --> C
    B --- F["Decision boundary"]
```

vấn đề tối ưu hóa:

```math
\begin{aligned}
\text{最大化} \quad & \frac{2}{\lVert w \rVert} \quad \text{（间隔宽度）} \\
\text{约束为} \quad & y_i (w^T x_i + b) \ge 1 \quad \text{对于所有 } i
\end{aligned}
```

等价地(đối thiểu $\lVert w \rVert^2$Hơn dễ dàng tối ưu hóa):

```math
\begin{aligned}
\text{最小化} \quad & \frac{1}{2} \lVert w \rVert^2 \\
\text{约束为} \quad & y_i (w^T x_i + b) \ge 1 \quad \text{对于所有 } i
\end{aligned}
```

Đây là một chương trình hình vuông ng. Nó có giải pháp toàn cầu duy nhất. Nó nằm ở biên giới biên giới trên các điểm dữ liệu.$y_i (w^T x_i + b) = 1$(c) là các vector hỗ trợ. Chúng là điểm quyết định duy nhất của ranh giới quyết định.

### Các vector hỗ trợ:关键的少数点

```mermaid
graph TD
    subgraph Classification
        SV1["Support Vector（+ class）<br>y(w'x+b) = 1"] --- DB["Decision Boundary<br>w'x+b = 0"]
        DB --- SV2["Support Vector（- class）<br>y(w'x+b) = 1"]
    end
    O1["其他 + points<br>（不影响 boundary）"] -.-> SV1
    O2["其他 - points<br>（不影响 boundary）"] -.-> SV2
```

Hầu hết các điểm đào tạo đều không liên quan gì. Chỉ có các vector hỗ trợ 重要. Đó là lý do tại sao SVM trong thời gian dự đoán có hiệu quả bộ nhớ: bạn chỉ cần lưu trữ các vector hỗ trợ, chứ không phải là toàn bộ bộ tập hợp đào tạo.

Số lượng các vector hỗ trợ cũng cho thấy lỗi tổng quát.

### Lượng nhượng: 使用 C tham số  xử lý tiếng ồn

Thực tế dữ liệu rất ít là hoàn toàn phân tách được. Có một số điểm có thể nằm ở bên sai của biên giới, hoặc nằm bên trong biên giới.

```math
\begin{aligned}
\text{最小化} \quad & \frac{1}{2} \lVert w \rVert^2 + C \sum_i \xi_i \\
\text{约束为} \quad & y_i (w^T x_i + b) \ge 1 - \xi_i \\
& \xi_i \ge 0 \quad \text{对于所有 } i
\end{aligned}
```

biến tính $\xi_i$Đường điểm$i$违反差距的程度──$C$控制 tradeoff này:

| $C$ value | Behavior |
|---------|----------|
| Large $C$ | 对 violations 施加重罚。margin 窄，misclassifications 更少。Overfits |
| Small $C$ | 允许更多 violations。margin 宽，misclassifications 更多。Underfits |

$C$là sức mạnh của sự điều chỉnh của倒数──Lớn $C$= 更少 quy định.$C$= 更多规范化──

### Loss Hinge:SVM của Loss Function

SVM margin mềm có thể được viết lại cho tối ưu hóa không hạn chế:

```math
\text{最小化} \quad \frac{1}{2} \lVert w \rVert^2 + C \sum_i \max(0, 1 - y_i (w^T x_i + b))
```

项 $\max(0, 1 - y_i f(x_i))$Đó là sự mất mát của vòng tròn. Khi điểm được phân loại đúng và nằm bên ngoài biên giới, nó là không. Khi điểm nằm bên trong biên giới hoặc bị phân loại sai, nó là tuyến tính.

```
单个点的 Hinge loss：

loss
  |
  | \
  |  \
  |   \
  |    \
  |     \_______________
  |
  +-----|-----|-------->  y * f(x)
       0     1

当 y*f(x) >= 1 时为 zero loss（正确分类，位于 margin 外）。
当 y*f(x) < 1 时为 linear penalty。
```

Comparison:

```math
\begin{aligned}
\text{Hinge：} \quad & \max(0, 1 - y f(x)) && \text{在间隔处硬截断} \\
\text{Logistic：} \quad & \log(1 + \exp(-y f(x))) && \text{平滑，永不精确为零}
\end{aligned}
```

Thiếu hinge  tạo ra các giải pháp hiếm có( chỉ có các vector hỗ trợ 有非零贡献) ―― Thiếu hư hỏng logic Sử dụng tất cả các điểm dữ liệu── điều này làm cho SVM trong thời gian dự đoán hiệu quả hơn trí nhớ──

### 用 gradient giảm 训练 đường thẳng SVM

Bạn có thể sử dụng mất sợi đệm cộng với L2 điều chỉnh giảm độ cao để đào tạo SVM tuyến tính, không cần phải tìm giải pháp QP bị hạn chế:

```math
\begin{aligned}
& L(w, b) = \frac{\lambda}{2} \lVert w \rVert^2 + \frac{1}{n} \sum_i \max(0, 1 - y_i (w^T x_i + b)) \\[6pt]
& \text{关于 } w \text{ 的梯度：} \\
& \quad \text{若 } y_i (w^T x_i + b) \ge 1\text{:} \quad \frac{\partial L}{\partial w} = \lambda w \\
& \quad \text{若 } y_i (w^T x_i + b) < 1\text{:} \quad \frac{\partial L}{\partial w} = \lambda w - y_i x_i \\[6pt]
& \text{关于 } b \text{ 的梯度：} \\
& \quad \text{若 } y_i (w^T x_i + b) \ge 1\text{:} \quad \frac{\partial L}{\partial b} = 0 \\
& \quad \text{若 } y_i (w^T x_i + b) < 1\text{:} \quad \frac{\partial L}{\partial b} = -y_i
\end{aligned}
```

Đây được gọi là công thức ban đầu.$O(n \cdot d)$, trong số đó $n$Số lượng mẫu,$d$Đó là số lượng các tính năng. Đối với quy mô lớn, không gian, dữ liệu cao, phân loại văn bản, đây là rất nhanh.

### Công thức kép và thủ thuật hạt nhân

Vấn đề SVM của Lagrangian dual (được học từ giai đoạn 1 Bài học 18, điều kiện KKT) là:

```math
\begin{aligned}
\text{最大化} \quad & \sum_i \alpha_i - \frac{1}{2} \sum_{i,j} \alpha_i \alpha_j y_i y_j (x_i \cdot x_j) \\
\text{约束为} \quad & 0 \le \alpha_i \le C \\
& \sum_i \alpha_i y_i = 0
\end{aligned}
```

Dual chỉ liên quan đến các sản phẩm điểm giữa các điểm dữ liệu $x_i \cdot x_j$ Đó là quan trọng trong quan điểm.$K(x_i, x_j)$Thay vì mỗi sản phẩm điểm, SVM 就能学习非线性界限, không cần phải chuyển đổi toán học rõ ràng.

```math
\begin{aligned}
\text{线性核：} \quad & K(x, z) = x \cdot z \\
\text{多项式核：} \quad & K(x, z) = (x \cdot z + c)^d \\
\text{RBF（高斯核）：} \quad & K(x, z) = \exp(-\gamma \lVert x - z \rVert^2)
\end{aligned}
```

RBF hạt nhân sẽ hiển thị dữ liệu vào không gian không gian không giới hạn. Không gian đầu vào trung bình gần điểm, giá trị hạt nhân của nó gần 1.

```mermaid
graph LR
    subgraph "Input Space（不可 separable）"
        A["2D 中的 data points<br>circular boundary"]
    end
    subgraph "Feature Space（可 separable）"
        B["更高维中的 data points<br>linear boundary"]
    end
    A -->|"Kernel trick<br>K(x,z) = phi(x).phi(z)"| B
```

Trick của kernel trong trường hợp không vào trong không gian cao, tính toán các điểm trong không gian cao.$D$维中 độ $d$của hạt nhân đa nôn, không gian tính năng rõ ràng có$O(D^d)$Nhưng...$K(x, z)$Có thể là $O(D)$时间内计算――

### SVM cho sự lùi (SVR)

Hỗ trợ Vector Regression sẽ xoay quanh dữ liệu phù hợp với một độ rộng cho $\epsilon$Các điểm bên trong ống có lỗ không.

```math
\begin{aligned}
\text{最小化} \quad & \frac{1}{2} \lVert w \rVert^2 + C \sum_i (\xi_i + \xi_i^*) \\
\text{约束为} \quad & y_i - (w^T x_i + b) \le \epsilon + \xi_i \\
& (w^T x_i + b) - y_i \le \epsilon + \xi_i^* \\
& \xi_i, \xi_i^* \ge 0
\end{aligned}
```

$\epsilon$tham số 控制 ống rộng── ống 越宽 = hỗ trợ vector 越少 = phù hợp 更平滑── ống 越窄 = hỗ trợ vector 越多 = phù hợp 更紧──

### Tại sao SVM 输给了深度学习 (Điều gì chúng vẫn đang làm)

SVM từ cuối thập niên 1990 đến đầu thập niên 2010 đã chủ yếu là ML. Học sâu vượt qua chúng vì một số lý do:

| Factor | SVMs | Deep learning |
|--------|------|---------------|
| Feature engineering | 需要它 | 学习 features |
| Scalability | kernel 为 $O(n^2)$ 到 $O(n^3)$ | 使用 SGD 时每个 epoch 为 $O(n)$ |
| Image/text/audio | 需要 handcrafted features | 从 raw data 学习 |
| Large datasets (>100k) | 慢 | 扩展良好 |
| GPU acceleration | 收益有限 | 巨大加速 |

SVM trong những tình huống này vẫn thắng:
- Các bộ dữ liệu nhỏ ((100 đến thấp hàng ngàn mẫu)
- 高维 dữ liệu hiếm có (带 TF-IDF tính năng 的文本)
- 当你需要数学保证 (cần bảo đảm về số dư)
- 当 thời gian đào tạo 必须最小化(SVM tuyến tính 非常快)
- 具有清晰边际结构的二进制分类
- Khám phá bất thường (SVM một lớp)


```figure
svm-margin
```

##  xây dựng nó
### 步骤 1: mất và nghiêng

基础――计算一个批量的关损失及其梯度――

```python
def hinge_loss(X, y, w, b):
    n = len(X)
    total_loss = 0.0
    for i in range(n):
        margin = y[i] * (dot(w, X[i]) + b)
        total_loss += max(0.0, 1.0 - margin)
    return total_loss / n
```

### 步骤 2: SVM tuyến tính thông qua giảm gradient

通过最小化规律化关损 来训练──不需要QP solver──

```python
class LinearSVM:
    def __init__(self, lr=0.001, lambda_param=0.01, n_epochs=1000):
        self.lr = lr
        self.lambda_param = lambda_param
        self.n_epochs = n_epochs
        self.w = None
        self.b = 0.0

    def fit(self, X, y):
        n_features = len(X[0])
        self.w = [0.0] * n_features
        self.b = 0.0

        for epoch in range(self.n_epochs):
            for i in range(len(X)):
                margin = y[i] * (dot(self.w, X[i]) + self.b)
                if margin >= 1:
                    self.w = [wj - self.lr * self.lambda_param * wj
                              for wj in self.w]
                else:
                    self.w = [wj - self.lr * (self.lambda_param * wj - y[i] * X[i][j])
                              for j, wj in enumerate(self.w)]
                    self.b -= self.lr * (-y[i])

    def predict(self, X):
        return [1 if dot(self.w, x) + self.b >= 0 else -1 for x in X]
```

### 步骤 3: chức năng lõi

实现 tuyến tính, đa nôn và RBF hạt nhân.

```python
def linear_kernel(x, z):
    return dot(x, z)

def polynomial_kernel(x, z, degree=3, c=1.0):
    return (dot(x, z) + c) ** degree

def rbf_kernel(x, z, gamma=0.5):
    diff = [xi - zi for xi, zi in zip(x, z)]
    return math.exp(-gamma * dot(diff, diff))
```

### 步骤 4: Định dạng đường biên và vector hỗ trợ

训练后,识别哪些点是支持向量,并计算边缘宽度──

```python
def find_support_vectors(X, y, w, b, tol=1e-3):
    support_vectors = []
    for i in range(len(X)):
        margin = y[i] * (dot(w, X[i]) + b)
        if abs(margin - 1.0) < tol:
            support_vectors.append(i)
    return support_vectors
```

完整实现和所有 demos 见 `code/svm.py`

## Sử dụng nó
Sử dụng scikit-learn:

```python
from sklearn.svm import SVC, LinearSVC, SVR
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

clf = Pipeline([
    ("scaler", StandardScaler()),
    ("svm", SVC(kernel="rbf", C=1.0, gamma="scale")),
])
clf.fit(X_train, y_train)
print(f"Accuracy: {clf.score(X_test, y_test):.4f}")
print(f"Support vectors: {clf['svm'].n_support_}")
```

重要: training SVM 之前始终要规模你的特征──SVMs đối với tính năng magnitudes 敏感,因为 边界 取决于 $\lVert w \rVert$, và các tính năng không có quy mô sẽ bị biến dạng về cấu trúc.

对于大数据集,使用 `LinearSVC`(pháp nguyên, mỗi thời đại 为 $O(n)$) thay vì `SVC`(sự tạo ra đôi,$O(n^2)$Đến$O(n^3){}$):

```python
from sklearn.svm import LinearSVC

clf = Pipeline([
    ("scaler", StandardScaler()),
    ("svm", LinearSVC(C=1.0, max_iter=10000)),
])
```

## 练习
1. 生成一个2D线性分离数据集──训练你的线性SVM,并识别支持向量──验证支持向量是最接近决策边界的点──

2. Trong một bộ dữ liệu ồn ào  上将 $C$Từ 0,001  biến đổi đến 1000 ⋅ cho mỗi $C$giá trị  vẽ ranh giới quyết định。观察 từ biên giới rộng(lên phù hợp) đến biên giới hẹp(lên phù hợp) 过渡。

3. 创建一个类界限 为圆形(非线性) 的数据集──展示线性SVM 会失败──计算RBF核矩阵,并展示类别在内核诱导功能空间 中变得可分离──

4. Trong cùng một tập dữ liệu 上比较                                                                                                                                                                                                                                                           

5. 实现 SVR(epsilon-insensitive loss) ⋅将它拟合到 $y = \sin(x) + \text{噪声}$◊ vẽ dự đoán 周围的epsilon tube,并突出显示支持向量(tube 外的点)。

## 关键术语
| Term | What it actually means |
|------|----------------------|
| Support vectors | 最接近 decision boundary 的 training points。唯一决定 hyperplane 的点 |
| Margin | decision boundary 与最近 support vectors 之间的距离。SVMs 会最大化它 |
| Hinge loss | $\max(0, 1 - y f(x))$。正确分类且位于 margin 外时为零。否则为 linear penalty |
| C parameter | margin width 与 classification errors 之间的 trade-off。Large $C$ = narrow margin，small $C$ = wide margin |
| Soft margin | 通过 slack variables 允许 margin violations 的 SVM formulation。处理 non-separable data |
| Kernel trick | 在不显式映射到高维 feature space 的情况下，计算该空间中的 dot products |
| Linear kernel | $K(x, z) = x \cdot z$。等价于标准 dot product。用于 linearly separable data |
| RBF kernel | $K(x, z) = \exp(-\gamma \Vert x-z \Vert^2)$。映射到 infinite dimensions。学习任意 smooth boundary |
| Polynomial kernel | $K(x, z) = (x \cdot z + c)^d$。映射到 polynomial combinations 的 feature space |
| Dual formulation | SVM problem 的重写形式，只依赖数据点之间的 dot products。支持 kernels |
| SVR | Support Vector Regression。围绕数据拟合 epsilon-tube。tube 内的点具有 zero loss |
| Slack variables | $\xi_i$：衡量一个点违反 margin 的程度。正确分类且位于 margin 外的点为零 |
| Maximum margin | 选择能够最大化到每个类别最近点距离的 hyperplane 的原则 |

## 延伸阅读
- [Vapnik: The Nature of Statistical Learning Theory (1995)](https://link.springer.com/book/10.1007/978-1-4757-3264-1)- 关于SVMs và học thống kê
- [Cortes & Vapnik: Support-vector networks (1995)](https://link.springer.com/article/10.1007/BF00994018)- giấy SVM nguyên thủy
- [Platt: Sequential Minimal Optimization (1998)](https://www.microsoft.com/en-us/research/publication/sequential-minimal-optimization-a-fast-algorithm-for-training-support-vector-machines/)- 让SVM training 变得实用 SMO algorithm
- [scikit-learn SVM documentation](https://scikit-learn.org/stable/modules/svm.html)- 包含详细实施的实践指南
- [LIBSVM: A Library for Support Vector Machines](https://www.csie.ntu.edu.tw/~cjlin/libsvm/)- 大多数 SVM thực hiện 背后 của thư viện C ++
