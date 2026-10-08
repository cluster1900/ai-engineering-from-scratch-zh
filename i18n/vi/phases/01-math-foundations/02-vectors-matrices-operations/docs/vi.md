# Vector √ Matrix và vận hành

> Mỗi mạng thần kinh chỉ là sự nhân đếm của Matrix với một số bước bổ sung.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 1, Lesson 01（Linear Algebra 直觉）
**Time:** ~60 minutes

## Học mục tiêu
-  cấu trúc một lớp Matrix, hỗ trợ các hoạt động thông minh về các yếu tố, nhân số matrix, chuyển đổi, xác định và ngược lại
- 区分元素-wise multiplication với matrix multiplication,并 giải thích các trường hợp thích hợp của riêng mình
- Chỉ sử dụng từ zero thực hiện của lớp Matrix, thực hiện một lớp lưới thần kinh dày đặc`relu(W @ x + b)`(văn)
- 解释 truyền hình 规则, cũng như các khung mạng thần kinh Trung bias bổ sung của cách làm

## 问题
Bạn muốn xây dựng một mạng thần kinh. Bạn đọc code khi xem đoạn này:

```
output = activation(weights @ input + bias)
```

Ở đây.`@`Đó là sự nhân số của matrix.`weights`Đó là một Matrix.`input`Nếu bạn không biết những điều này đang làm gì, thì đây là phép thuật. Nếu bạn biết, nó là một lớp của toàn bộ chuyển tiếp, chỉ cần sử dụng ba điều.

Mỗi hình ảnh được xử lý trong mô hình là một Matrix của các giá trị pixel. Mỗi từ được nhúng là một vector. Mỗi lớp của mạng thần kinh đều là một sự chuyển đổi của Matrix. Không thể làm việc với Matrix, không thể xây dựng các hệ thống AI.

Bài học này sẽ bắt đầu xây dựng sự quen thuộc này từ không.

## 概念
### Vêctor: có序 số列表

Vector là một nhóm số có chiều hướng và lớn. Trong AI, vector biểu thị các điểm dữ liệu, tính năng hoặc tham số.

```
v = [3, 4]        -- 一个 2D Vector
w = [1, 0, -2]    -- 一个 3D Vector
```

2D Vector `[3, 4]`指向平面上的坐标 (3, 4) ・・・长度(大小) là 5 ((3-4-5 三角形) ・・・

### Matrix: số mạng

Matrix là một 2D 网格──由行 和列组成──一个 m x n Matrix có m 行和 n 列──

```
A = | 1  2  3 |     -- 2x3 Matrix（2 行，3 列）
    | 4  5  6 |
```

Trong mạng thần kinh, các khối lượng tử liệu sẽ chuyển các vector đầu vào thành các vector đầu ra. Một có 784 đầu vào và 128 đầu ra.

### Tại sao hình dạng  rất quan trọng

Sự nhân số của matrix có quy tắc nghiêm ngặt:`(m x n) @ (n x p) = (m x p)`❖ kích thước bên trong phải phù hợp

```
(128 x 784) @ (784 x 1) = (128 x 1)
  weights       input       output

内部维度：784 = 784  -- 有效
```

Nếu trong PyTorch gặp lỗi không phù hợp hình dạng, lý do là ở đây.

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

Sự khác biệt này thường khiến cho học sinh mới bắt đầu đi vào vỏ bọc.

Điểm yếu tố: cùng vị trí相乘── hai Matrix  phải có cùng hình dạng──

```
| 1  2 |   | 5  6 |   | 5  12 |
| 3  4 | * | 7  8 | = | 21 32 |
```

Matrix nhân: hàng và cột của các sản phẩm điểm.

```
| 1  2 |   | 5  6 |   | 1*5+2*7  1*6+2*8 |   | 19  22 |
| 3  4 | @ | 7  8 | = | 3*5+4*7  3*6+4*8 | = | 43  50 |
```

Các hoạt động khác nhau, kết quả khác nhau, quy tắc khác nhau.

### Truyền thông

Khi bạn đưa vector thiên vị thêm vào các đầu ra của Matrix 上时, hình dạng không phù hợp.

```
| 1  2  3 |   +   [10, 20, 30]
| 4  5  6 |

Broadcasting 会把 Vector 沿 rows 方向拉伸：

| 1  2  3 |   | 10  20  30 |   | 11  22  33 |
| 4  5  6 | + | 10  20  30 | = | 14  25  36 |
```

Mỗi khung hiện đại sẽ tự động làm như vậy. Nhận thức nó có thể tránh được trong hình dạng trông giống như không phù hợp nhưng có thể gây ra sự bối rối khi mã chạy.


```figure
vector-projection
```

##  xây dựng nó
### 步骤 1: lớp vector

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

### Bước 3: Xem nó hoạt động

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

### Bước 4: Kết nối với mạng thần kinh

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

Đây là một lớp dày đặc đơn:`output = relu(W @ x + b)`Mỗi lớp dày đặc trong mỗi mạng thần kinh đều làm như vậy.

## Sử dụng nó
NumPy sử dụng ít mã hơn để hoàn thành tất cả mọi thứ trên, và nhanh chóng một vài số lượng cấp.

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

Python 中中 `@`Nhà khai thác 会调用 `__matmul__`◊NumPy sử dụng C và Fortran 编写 các thói quen BLAS tối ưu để thực hiện nó── tương tự toán học,快 100x──

NumPy 中的广播:

```python
matrix = np.array([[1, 2, 3], [4, 5, 6]])
bias = np.array([10, 20, 30])
print(matrix + bias)
```

NumPy sẽ tự động đưa phát sóng thiên vị 1D đến hai đường trên. Đây là cách làm việc của việc bổ sung thiên vị trong mỗi khung mạng thần kinh.

## 交付 nó
本课会产出一个用于通过几何直觉教授 Matrix operations的提示.`outputs/prompt-matrix-operations.md`

Các lớp Matrix được xây dựng trong đó là nền tảng của việc xây dựng một khung mạng Neural Mini trong giai đoạn 3, bài học 10.

## 练习
1. **验证 inverse。**计算 `A @ A.inverse_2x2()`, xác nhận bạn đã nhận được các hình tử dạng. Với ba hình tử 2x2 khác nhau.

2. **实现 3x3 inverse。**扩展 Matrix class, sử dụng phương pháp so sánh 计算 3x3 matrices 的逆点──用 NumPy 的 `np.linalg.inv` tiến hành đối chiếu test。

3. **构建一个 two-layer network。**Chỉ sử dụng lớp Matrix của bạn(不使用NumPy), tạo một mạng Neural hai lớp: input (3) -> hidden (4) -> output (2)──初始化随机权重,运行一次前传,并验证所有形状都正确──

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
- [3Blue1Brown: Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra)- Bài học này bao gồm mỗi hoạt động của trực quan trực quan
- [NumPy documentation on broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)- Số người theo dõi quy tắc chính xác
- [Stanford CS229 Linear Algebra Review](http://cs229.stanford.edu/section/cs229-linalg.pdf)- 面向 ML 的线性代数 简明参考
