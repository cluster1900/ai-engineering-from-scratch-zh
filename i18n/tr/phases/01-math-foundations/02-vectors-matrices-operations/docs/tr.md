# vektör matris ve hesaplama

> Her sinir ağı sadece bir matris çarpımı ve ekstra adımlarla birlikte.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 1, Lesson 01（Linear Algebra 直觉）
**Time:** ~60 minutes

## Öğrenme hedefi
- Matrix sınıfı oluşturmak, element-bize işlemleri desteklemek, matris çarpımı, transpose, determinant, ve ters
- 区分元素-wise çarpma ve matrix çarpma,并解释各自适用场景
- Sadece sıfırdan gerçekleştirilen Matrix sınıfı kullanarak yoğun bir Nöral Ağ katmanı gerçekleştirmek için`relu(W @ x + b)`)
- 解释广播规则,以及 Neural Network frameworks 中偏见添加的工作方式

## 问题
Bu satırın bir kısmını okuduğunda,

```
output = activation(weights @ input + bias)
```

Burada .`@`Bu matris çarpımı.`weights`Bir Matrix.`input`Bu bir vektör. Eğer bu işlemlerin ne olduğunu bilmiyorsan, bu işlemin sihirli olduğunu biliyorsun. Eğer bir katmanın tümünü bir katmanın önüne geçirdiğini biliyorsan, sadece üç işlem kullanıyorsun.

Model işleme yapılan her resim piksel değerleri olan Matrix'tir. Her kelime yerleştirilmek bir vektördür. Her sinir ağının her tabakası bir Matrix dönüşümüdür. Matrix işlemlerini bilerek beceremezsiniz, AI sistemleri inşa edemezsiniz. Bu sanki değişimi anlamıyor, kod yazamazsınız gibi.

Bu ders bu becerileri sıfırdan kurmaya başlar.

## 概念
### Vektor: Bir dizi sayı listesi

Vektör, bir dizi büyük sayı ve yönlü bir vektördür.

```
v = [3, 4]        -- 一个 2D Vector
w = [1, 0, -2]    -- 一个 3D Vector
```

2D vektörü `[3, 4]`Görevi düzlemdeki koordinat (3, 4)。 uzunluğu (magnitüde) 5(3-4-5 三角形)。

### Matrix: dijital net格

Matris bir 2 boyutlu 网格──由行和列组成──一个 m x n Matrix 有 m 行和 n 列──

```
A = | 1  2  3 |     -- 2x3 Matrix（2 行，3 列）
    | 4  5  6 |
```

Nöral ağlarda ağırlık matrisleri girme vektörlerini çıkış vektörlerine dönüştürür.

### Neden şekil  çok önemli

Matrix çarpımı sıkı kuralları vardır:`(m x n) @ (n x p) = (m x p)`❖ İç boyutlar uyumludur.

```
(128 x 784) @ (784 x 1) = (128 x 1)
  weights       input       output

内部维度：784 = 784  -- 有效
```

PyTorch'de bir biçim eşleşmezliği hatası varsa, nedeni burada.

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

Bu farkı sık sık yeni öğrencilere kazık yaptırır.

Element-wise: identical location相乘──2 Matrix 必須 相同形──

```
| 1  2 |   | 5  6 |   | 5  12 |
| 3  4 | * | 7  8 | = | 21 32 |
```

Matrix çarpımı:satırlar ve sütunların nokta ürünleri--- iç boyutlar uyumlu olmalıdır---

```
| 1  2 |   | 5  6 |   | 1*5+2*7  1*6+2*8 |   | 19  22 |
| 3  4 | @ | 7  8 | = | 3*5+4*7  3*6+4*8 | = | 43  50 |
```

Farklı çalışmalar, farklı sonuçlar, farklı kurallar.

### Yayınlama

Eğer bir tarafsızlık vektörü çıkışlara eklerken, biçim uyumlu değil.

```
| 1  2  3 |   +   [10, 20, 30]
| 4  5  6 |

Broadcasting 会把 Vector 沿 rows 方向拉伸：

| 1  2  3 |   | 10  20  30 |   | 11  22  33 |
| 4  5  6 | + | 10  20  30 | = | 14  25  36 |
```

Her modern çerçeve bunu otomatik olarak yapar. Anlamak için, şekilden kaçınabilirsiniz. Görünüşe göre doğru değil ama kod çalıştırılırken sorun çıkarabilir.


```figure
vector-projection
```

## Yapın onu.
### 步骤 1: vektör sınıfı

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

### 3 adım: Görelim

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

### 4 adım: Nöral ağlara bağlanmak

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

Bu tek yoğun bir katman:`output = relu(W @ x + b)`Neural ağının her yoğun tabakası bunu yapıyor.

## Kullan
Daha az kodla tüm işleri tamamlayacağım.

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

Python'da `@`Operatör 会调用 `__matmul__`◊ NumPy C ve Fortran 编写的优化BLAS 程序实现它──同样数学,快 100x──

NumPy 中的广播:

```python
matrix = np.array([[1, 2, 3], [4, 5, 6]])
bias = np.array([10, 20, 30])
print(matrix + bias)
```

NumPy, 1D tersi yayınını iki satırdan otomatik olarak yayınlar. Bu, her sinir ağ çerçevesinde tersi eklemenin çalışma biçimidir.

## - Söyle.
Bu ders, matris işlemlerinin bir süreti olarak kullanılır.`outputs/prompt-matrix-operations.md`- Evet.

Bu yapılandırılan Matrix sınıfı, 3. aşamada, 10. derste mini sinir ağı çerçevesini oluşturma temelindedir.

## 练习
1. **验证 inverse。**计算 `A @ A.inverse_2x2()`, kimlik matrisi elde ettiğini doğrula. Üç farklı 2x2 matrisi kullan.

2. **实现 3x3 inverse。**扩展 Matrix sınıfı, adjugat yöntemi kullanılarak 计算 3x3 matrices的逆──用 NumPy 的 `np.linalg.inv`进行对照测试──

3. **构建一个 two-layer network。**Sadece Matrix sınıfını kullanmak için NumPy kullanmayın), iki katlı sinir ağı oluşturun: giriş (3) -> gizli (4) -> çıkış (2)──初始化随机重量,运行一次前进通过,并验证所有形都正确──

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
- [3Blue1Brown: Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra)- Bu ders kapsamlı her işlemin görsel doğrudan
- [NumPy documentation on broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)- NumPy 遵循的精确规则
- [Stanford CS229 Linear Algebra Review](http://cs229.stanford.edu/section/cs229-linalg.pdf)- 面向 ML'nin çizgi cebir 简明参考
