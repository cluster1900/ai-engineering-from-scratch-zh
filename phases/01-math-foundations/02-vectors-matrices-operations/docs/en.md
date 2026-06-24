# Vector、Matrix 与运算

> 每个 Neural Network 都只是 Matrix multiplication 加上一些额外步骤。

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 1, Lesson 01（Linear Algebra 直觉）
**Time:** ~60 minutes

## 学习目标
- 构建一个 Matrix class，支持 element-wise operations、matrix multiplication、transpose、determinant 和 inverse
- 区分 element-wise multiplication 与 matrix multiplication，并解释各自适用的场景
- 只使用从零实现的 Matrix class，实现一个 dense Neural Network layer（`relu(W @ x + b)`）
- 解释 broadcasting 规则，以及 Neural Network frameworks 中 bias addition 的工作方式

## 问题
你想构建一个 Neural Network。你阅读代码时看到这一行：

```
output = activation(weights @ input + bias)
```

这里的 `@` 是 matrix multiplication。`weights` 是一个 Matrix。`input` 是一个 Vector。如果你不知道这些运算在做什么，这一行就是魔法。如果你知道，它就是一个 layer 的整个 forward pass，只用了三个运算。

模型处理的每张图像都是 pixel values 的 Matrix。每个 word Embedding 都是一个 Vector。每个 Neural Network 的每个 layer 都是一次 Matrix transformation。不能熟练掌握 Matrix operations，就无法构建 AI systems；这就像不了解变量就无法写代码一样。

本课会从零开始建立这种熟练度。

## 概念
### Vector：有序数字列表

Vector 是带有方向和大小的一组数字。在 AI 中，Vector 表示 data points、features 或 parameters。

```
v = [3, 4]        -- 一个 2D Vector
w = [1, 0, -2]    -- 一个 3D Vector
```

2D Vector `[3, 4]` 指向平面上的坐标 (3, 4)。它的长度（magnitude）是 5（3-4-5 三角形）。

### Matrix：数字网格

Matrix 是一个 2D 网格。由 rows 和 columns 组成。一个 m x n Matrix 有 m 行和 n 列。

```
A = | 1  2  3 |     -- 2x3 Matrix（2 行，3 列）
    | 4  5  6 |
```

在 Neural Networks 中，weight matrices 会把 input vectors 转换为 output vectors。一个有 784 个 inputs 和 128 个 outputs 的 layer 使用 128x784 weight matrix。

### 为什么 shape 很重要

Matrix multiplication 有严格规则：`(m x n) @ (n x p) = (m x p)`。内部维度必须匹配。

```
(128 x 784) @ (784 x 1) = (128 x 1)
  weights       input       output

内部维度：784 = 784  -- 有效
```

如果你在 PyTorch 中遇到 shape mismatch error，原因就在这里。

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

### 逐元素乘法 vs Matrix 乘法

这个区别经常让初学者踩坑。

Element-wise：相同位置相乘。两个 Matrix 必须具有相同 shape。

```
| 1  2 |   | 5  6 |   | 5  12 |
| 3  4 | * | 7  8 | = | 21 32 |
```

Matrix multiplication：rows 和 columns 的 dot products。内部维度必须匹配。

```
| 1  2 |   | 5  6 |   | 1*5+2*7  1*6+2*8 |   | 19  22 |
| 3  4 | @ | 7  8 | = | 3*5+4*7  3*6+4*8 | = | 43  50 |
```

不同的运算、不同的结果、不同的规则。

### Broadcasting

当你把 bias vector 加到 outputs 的 Matrix 上时，shape 并不匹配。Broadcasting 会拉伸较小的 array 来适配。

```
| 1  2  3 |   +   [10, 20, 30]
| 4  5  6 |

Broadcasting 会把 Vector 沿 rows 方向拉伸：

| 1  2  3 |   | 10  20  30 |   | 11  22  33 |
| 4  5  6 | + | 10  20  30 | = | 14  25  36 |
```

每个现代 framework 都会自动这样做。理解它可以避免在 shape 看似不对但代码能运行时产生困惑。


```figure
vector-projection
```

## 构建它
### 步骤 1： Vector class

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

### 步骤 2： 带核心运算的 Matrix class

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

### 步骤 3： 看它运行

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

### 步骤 4： 连接到 Neural Networks

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

这是一个 single dense layer：`output = relu(W @ x + b)`。每个 Neural Network 中的每个 dense layer 都正是这样做的。

## 使用它
NumPy 用更少的代码完成上面所有事情，而且快几个数量级。

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

Python 中的 `@` operator 会调用 `__matmul__`。NumPy 使用以 C 和 Fortran 编写的 optimized BLAS routines 来实现它。同样的数学，快 100x。

NumPy 中的 broadcasting：

```python
matrix = np.array([[1, 2, 3], [4, 5, 6]])
bias = np.array([10, 20, 30])
print(matrix + bias)
```

NumPy 会自动把 1D bias broadcast 到两行上。这就是每个 Neural Network framework 中 bias addition 的工作方式。

## 交付它
本课会产出一个用于通过几何直觉教授 Matrix operations 的 prompt。见 `outputs/prompt-matrix-operations.md`。

这里构建的 Matrix class 是我们在 Phase 3, Lesson 10 中构建 mini Neural Network framework 的基础。

## 练习
1. **验证 inverse。** 计算 `A @ A.inverse_2x2()`，确认你得到 identity matrix。用三个不同的 2x2 matrices 试一试。当 determinant 为零时会发生什么？

2. **实现 3x3 inverse。** 扩展 Matrix class，使用 adjugate method 计算 3x3 matrices 的 inverses。用 NumPy 的 `np.linalg.inv` 进行对照测试。

3. **构建一个 two-layer network。** 只使用你的 Matrix class（不使用 NumPy），创建一个 two-layer Neural Network：input (3) -> hidden (4) -> output (2)。初始化 random weights，运行一次 forward pass，并验证所有 shapes 都正确。

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
- [3Blue1Brown: Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra) - 本课涵盖的每个运算的视觉直觉
- [NumPy documentation on broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html) - NumPy 遵循的精确规则
- [Stanford CS229 Linear Algebra Review](http://cs229.stanford.edu/section/cs229-linalg.pdf) - 面向 ML 的 linear algebra 简明参考
