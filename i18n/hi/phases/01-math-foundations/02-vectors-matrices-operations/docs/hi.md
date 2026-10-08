# वेक्टर √ मैट्रिक्स और परिचालन

> प्रत्येक तंत्रिका नेटवर्क केवल मैट्रिक्स गुणा के साथ कुछ अतिरिक्त चरणों के साथ है।

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 1, Lesson 01（Linear Algebra 直觉）
**Time:** ~60 minutes

## 学习目标
- 构建一个矩阵类,支持元素智操作、矩阵乘法、转移、定量和逆
- 区分 तत्व-बुद्धिमान गुणा और मैट्रिक्स गुणा,并 व्याख्या अपने आप में उपयुक्त परिदृश्य
- केवल शून्य से प्राप्त करने के लिए मैट्रिक्स वर्ग का उपयोग, एक घने तंत्रिका नेटवर्क परत प्राप्त करने के लिए`relu(W @ x + b)`)
- 解释广播规则,以及神经网络框架中偏见添加的工作方式

## 问题
आप एक तंत्रिका नेटवर्क का निर्माण करना चाहते हैं.

```
output = activation(weights @ input + bias)
```

यहाँ पर`@`यह मैट्रिक्स गुणन है`weights`एक मैट्रिक्स है।`input`यदि आप नहीं जानते कि ये क्या कर रहे हैं, तो यह एक जादू है। यदि आप जानते हैं कि यह एक परत का पूरा आगे का रास्ता है, तो केवल तीन चाल का उपयोग करें।

模型处理的每张图像都是像素值的矩阵── प्रत्येक शब्द एम्बेडिंग 都是一个矢量── प्रत्येक तंत्रिका नेटवर्क की प्रत्येक परत एक矩阵 परिवर्तन──不能熟练掌握矩阵操作,就无法构建人工智能系统;这就像不了解变量就无法写代码一样──

इस वर्ग में इस प्रकार की प्रवीणता का निर्माण शून्य से शुरू होगा।

## 概念
### वेक्टरः क्रम संख्यात्मक सूची

वेक्टर एक बड़ी संख्या में आयामों और दिशाओं का एक समूह है।

```
v = [3, 4]        -- 一个 2D Vector
w = [1, 0, -2]    -- 一个 3D Vector
```

2D वेक्टर `[3, 4]`                                                                                                                                                                                                                                                              

### मैट्रिक्सः数字网格

मैट्रिक्स एक 2D 网格──由行和列组成──一个 m x n मैट्रिक्स 有 m 行和 n 列──

```
A = | 1  2  3 |     -- 2x3 Matrix（2 行，3 列）
    | 4  5  6 |
```

न्यूरल नेटवर्क में, वजन मैट्रिक्स इनपुट वेक्टरों को आउटपुट वेक्टरों में परिवर्तित करेंगे── एक में 784 इनपुट और 128 आउटपुट का परत है[12]

### क्यों आकार  बहुत महत्वपूर्ण

मैट्रिक्स गुणन के लिए सख्त नियम हैंः`(m x n) @ (n x p) = (m x p)` आंतरिक आयामों को मेल खाना चाहिए

```
(128 x 784) @ (784 x 1) = (128 x 1)
  weights       input       output

内部维度：784 = 784  -- 有效
```

यदि आप PyTorch में आकार असंगतता त्रुटि का सामना, कारण यहाँ है.

### 运算地图

| Operation | What it does | Neural network use |
|-----------|-------------|-------------------|
| Addition | Element-wise 组合 | 向 output 添加 bias |
| Scalar multiply | 缩放每个元素 | Learning rate * gradients |
| Matrix multiply | 转换 vectors | Layer forward pass |
| Transpose | 交换 rows 和 columns | Backpropagation |
| Determinant | 单个数字摘要 | 检查 invertibility |
| Inverse | 撤销一个 transformation | 求解 linear systems |
| Identity | 什么都不做的 Matrix | Initialization、residual connections |

### 逐元素乘法 बनाम मैट्रिक्स 乘法

यह अंतर अक्सर शुरुआती को गड़बड़ करने देता है।

तत्व-बुद्धिमान: समान स्थान相乘── दो मैट्रिक्स 必須具有相同形──

```
| 1  2 |   | 5  6 |   | 5  12 |
| 3  4 | * | 7  8 | = | 21 32 |
```

मैट्रिक्स गुणनः पंक्तियों तथा स्तंभों के अंक उत्पाद--- आंतरिक आयामों को मेल खाना चाहिए---

```
| 1  2 |   | 5  6 |   | 1*5+2*7  1*6+2*8 |   | 19  22 |
| 3  4 | @ | 7  8 | = | 3*5+4*7  3*6+4*8 | = | 43  50 |
```

अलग-अलग कामकाज, अलग-अलग परिणाम, अलग-अलग नियम।

### प्रसारण

जब आप पूर्वाग्रह वेक्टर को आउटपुट के मैट्रिक्स में जोड़ते हैं, तब आकार मेल नहीं खाता है।

```
| 1  2  3 |   +   [10, 20, 30]
| 4  5  6 |

Broadcasting 会把 Vector 沿 rows 方向拉伸：

| 1  2  3 |   | 10  20  30 |   | 11  22  33 |
| 4  5  6 | + | 10  20  30 | = | 14  25  36 |
```

प्रत्येक आधुनिक ढांचे में स्वचालित रूप से ऐसा किया जाता है। इसे समझने से यह रूप में बच सकता है।


```figure
vector-projection
```

##  इसे निर्माण
### 步骤 1: वेक्टर वर्ग

```python
class Vector:
    def __init__(self, data):
        self.data = list(data)
        self.size = len(self.data)

    def __repr__(self):
        return f"Vector({self.data})"

    def __add__(self, other):
        return Vector([a + b for a, b in zip(self.data, other.data)])

    def __sub__(self, other):
        return Vector([a - b for a, b in zip(self.data, other.data)])

    def __mul__(self, scalar):
        return Vector([x * scalar for x in self.data])

    def dot(self, other):
        return sum(a * b for a, b in zip(self.data, other.data))

    def magnitude(self):
        return sum(x ** 2 for x in self.data) ** 0.5
```

### 步骤 2: 带核心运算的矩阵类

```python
class Matrix:
    def __init__(self, data):
        self.data = [list(row) for row in data]
        self.rows = len(self.data)
        self.cols = len(self.data[0])
        self.shape = (self.rows, self.cols)

    def __repr__(self):
        rows_str = "\n  ".join(str(row) for row in self.data)
        return f"Matrix({self.shape}):\n  {rows_str}"

    def __add__(self, other):
        return Matrix([
            [self.data[i][j] + other.data[i][j] for j in range(self.cols)]
            for i in range(self.rows)
        ])

    def __sub__(self, other):
        return Matrix([
            [self.data[i][j] - other.data[i][j] for j in range(self.cols)]
            for i in range(self.rows)
        ])

    def scalar_multiply(self, scalar):
        return Matrix([
            [self.data[i][j] * scalar for j in range(self.cols)]
            for i in range(self.rows)
        ])

    def element_wise_multiply(self, other):
        return Matrix([
            [self.data[i][j] * other.data[i][j] for j in range(self.cols)]
            for i in range(self.rows)
        ])

    def matmul(self, other):
        return Matrix([
            [
                sum(self.data[i][k] * other.data[k][j] for k in range(self.cols))
                for j in range(other.cols)
            ]
            for i in range(self.rows)
        ])

    def transpose(self):
        return Matrix([
            [self.data[j][i] for j in range(self.rows)]
            for i in range(self.cols)
        ])

    def determinant(self):
        if self.shape == (1, 1):
            return self.data[0][0]
        if self.shape == (2, 2):
            return self.data[0][0] * self.data[1][1] - self.data[0][1] * self.data[1][0]
        det = 0
        for j in range(self.cols):
            minor = Matrix([
                [self.data[i][k] for k in range(self.cols) if k != j]
                for i in range(1, self.rows)
            ])
            det += ((-1) ** j) * self.data[0][j] * minor.determinant()
        return det

    def inverse_2x2(self):
        det = self.determinant()
        if det == 0:
            raise ValueError("Matrix is singular, no inverse exists")
        return Matrix([
            [self.data[1][1] / det, -self.data[0][1] / det],
            [-self.data[1][0] / det, self.data[0][0] / det]
        ])

    @staticmethod
    def identity(n):
        return Matrix([
            [1 if i == j else 0 for j in range(n)]
            for i in range(n)
        ])
```

### 步骤 3: इसे देखो

```python
A = Matrix([[1, 2], [3, 4]])
B = Matrix([[5, 6], [7, 8]])

print("A + B =", (A + B).data)
print("A @ B =", A.matmul(B).data)
print("A^T =", A.transpose().data)
print("det(A) =", A.determinant())
print("A^-1 =", A.inverse_2x2().data)

I = Matrix.identity(2)
print("A @ A^-1 =", A.matmul(A.inverse_2x2()).data)
```

### 步骤 4:  तंत्रिका नेटवर्क से कनेक्ट

```python
import random

inputs = Matrix([[0.5], [0.8], [0.2]])
weights = Matrix([
    [random.uniform(-1, 1) for _ in range(3)]
    for _ in range(2)
])
bias = Matrix([[0.1], [0.1]])

def relu_matrix(m):
    return Matrix([[max(0, val) for val in row] for row in m.data])

pre_activation = weights.matmul(inputs) + bias
output = relu_matrix(pre_activation)

print(f"Input shape: {inputs.shape}")
print(f"Weight shape: {weights.shape}")
print(f"Output shape: {output.shape}")
print(f"Output: {output.data}")
```

यह एक एकल घने परत हैः`output = relu(W @ x + b)` प्रत्येक तंत्रिका नेटवर्क में प्रत्येक घने परत  यह कर रहा है 

## इसका उपयोग करें
संख्यात्मक रूप से कम कोड के साथ ऊपर की सभी चीजें पूरी करें, और कुछ संख्यात्मक स्तरों को जल्दी से।

```python
import numpy as np

A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

print("A + B =\n", A + B)
print("A * B (element-wise) =\n", A * B)
print("A @ B (matrix multiply) =\n", A @ B)
print("A^T =\n", A.T)
print("det(A) =", np.linalg.det(A))
print("A^-1 =\n", np.linalg.inv(A))
print("I =\n", np.eye(2))

inputs = np.random.randn(3, 1)
weights = np.random.randn(2, 3)
bias = np.array([[0.1], [0.1]])
output = np.maximum(0, weights @ inputs + bias)

print(f"\nNeural network layer: {weights.shape} @ {inputs.shape} = {output.shape}")
print(f"Output:\n{output}")
```

पायथन मध्य `@`ऑपरेटर 会调用 `__matmul__`◊NumPy उपयोग C एवं Fortran 编写的优化BLAS दिनचर्या इसे प्राप्त करने हेतु ◊同样数学,快 100x──

NumPy 中的广播:

```python
matrix = np.array([[1, 2, 3], [4, 5, 6]])
bias = np.array([10, 20, 30])
print(matrix + bias)
```

NumPy 会 स्वचालित रूप से 1D पूर्वाग्रह प्रसारण को दो पंक्तियों तक पहुँचाता है। यह प्रत्येक न्यूरल नेटवर्क फ्रेमवर्क में पूर्वाग्रह जोड़ने का काम करता है।

## 交付 यह
इस वर्ग में मैट्रिक्स संचालन के लिए एक त्वरित प्रयोग किया जाता है।`outputs/prompt-matrix-operations.md`

इसमे निर्मित मैट्रिक्स वर्ग हम चरण 3, पाठ 10 में निर्मित मिनी न्यूरल नेटवर्क फ्रेमवर्क का आधार है।

## अभ्यास
1. **验证 inverse。**计算 `A @ A.inverse_2x2()`, पुष्टि आप पहचान मैट्रिक्स प्राप्त किया है. . . तीन अलग 2x2 मैट्रिक्स के साथ 试一试.

2. **实现 3x3 inverse。**扩展 मैट्रिक्स वर्ग, उपयोग जुआउट विधि 计算 3x3 मैट्रिक्स के उलटों──用 NumPy 的 `np.linalg.inv`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

3. **构建一个 two-layer network。**केवल अपने मैट्रिक्स वर्ग का उपयोग करके(不使用NumPy), एक दो परत न्यूरल नेटवर्क बनाएंः इनपुट (3) -> छिपा (4) -> आउटपुट (2)──初始化 यादृच्छिक वजन,运行一次前进通过,并验证所有形状都正确──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Vector | “一支箭头” | 有序数字列表。在 AI 中：高维空间中的一个点。 |
| Matrix | “一张数字表” | 一种 linear transformation。它把 vectors 从一个空间映射到另一个空间。 |
| Matrix multiply | “就是把数字相乘” | 第一个 Matrix 的每一行与第二个 Matrix 的每一列之间的 dot products。顺序很重要。 |
| Transpose | “翻转它” | 交换 rows 和 columns。把一个 m x n Matrix 变成 n x m。在 Backpropagation 中很关键。 |
| Determinant | “来自 Matrix 的某个数字” | 衡量 Matrix 对面积（2D）或体积（3D）的缩放程度。零表示这个 transformation 压扁了一个维度。 |
| Inverse | “撤销这个 Matrix” | 反转该 transformation 的 Matrix。只有 determinant 不为零时才存在。 |
| Identity matrix | “无聊的 Matrix” | Matrix 中等价于乘以 1 的对象。用于 residual connections（ResNets）。 |
| Broadcasting | “魔法般的 shape 修复” | 通过沿缺失维度重复，把较小 array 拉伸到匹配较大 array。 |
| Element-wise | “普通乘法” | 相同位置相乘。两个 arrays 必须具有相同 shape（或可 broadcast）。 |

## 延伸阅读
- [3Blue1Brown: Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra)- इस वर्ग में शामिल प्रत्येक संचालन के दृश्य直觉
- [NumPy documentation on broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)- संख्या के अनुसार ऩय करने के लिए
- [Stanford CS229 Linear Algebra Review](http://cs229.stanford.edu/section/cs229-linalg.pdf)- 面向 ML का रैखिक बीजगणित 简明参考
