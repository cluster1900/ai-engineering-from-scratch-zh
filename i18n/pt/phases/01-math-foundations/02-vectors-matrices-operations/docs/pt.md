# Vector ∆ Matrix e cálculo

> Cada rede neural é apenas uma multiplicação de Matrix com alguns passos adicionais.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 1, Lesson 01（Linear Algebra 直觉）
**Time:** ~60 minutes

## Objectivo de aprendizagem
- Construir uma classe de Matrix, apoiar operações de elementos-sabio 、multiplicação de matriz 、transposição 、determinante 和 inversos
- 区分元素智乘与矩阵乘法,并解释各自适用场景
- Apenas usando a classe Matrix do zero realizado, realize uma camada densa de Rede Neural`relu(W @ x + b)`)
- 解释广播规则, bem como frameworks de redes neurais

## 问题
Você quer construir uma rede neural. Você pode ler o código e ver esta linha:

```
output = activation(weights @ input + bias)
```

Aqui está .`@`É a multiplicação de matriz.`weights`É uma Matrix.`input`Se você não sabe o que estes cálculos estão fazendo, esta linha é mágica. Se você sabe, é uma camada de passagem para a frente, só usamos três cálculos.

Cada imagem processada pelo modelo é uma Matriz de valores de pixels. Cada palavra embutida é um vetor. Cada camada da rede neural é uma transformação de Matrix. Não podemos aprender a operar com a Matrix, não podemos construir sistemas de IA.

Esta aula vai começar a construir essa habilidade a partir de zero.

## 概念
### Vector: Código de números

Um vetor é um conjunto de números de grande dimensão e direção.

```
v = [3, 4]        -- 一个 2D Vector
w = [1, 0, -2]    -- 一个 3D Vector
```

Vector 2D `[3, 4]`Indicações de longitudes em quadrado (3, 4)

### Matriz: digital网格

Matriz é uma 2D 网格──由行 和列 组成──一个 m x n Matrix 有 m 行和 n 列──

```
A = | 1  2  3 |     -- 2x3 Matrix（2 行，3 列）
    | 4  5  6 |
```

Em redes neurais, matrizes de peso vão transformar vetores de entrada em vetores de saída.

### Por que a forma é importante?

Multiplicação de matriz tem regras rigorosas:`(m x n) @ (n x p) = (m x p)`◊ dimensões internas devem corresponder.

```
(128 x 784) @ (784 x 1) = (128 x 1)
  weights       input       output

内部维度：784 = 784  -- 有效
```

Se você encontrar um erro de desajuste de forma no PyTorch, a razão está aqui.

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

Esta diferença faz com que os iniciantes caçam no chão.

Elementos-wise: mesma posição相乘── duas matriz 必須具有相同形──

```
| 1  2 |   | 5  6 |   | 5  12 |
| 3  4 | * | 7  8 | = | 21 32 |
```

Multiplicação de matriz: linhas e colunas dos produtos de pontos.

```
| 1  2 |   | 5  6 |   | 1*5+2*7  1*6+2*8 |   | 19  22 |
| 3  4 | @ | 7  8 | = | 3*5+4*7  3*6+4*8 | = | 43  50 |
```

Diferentes cálculos, diferentes resultados, diferentes regras.

### Transmissão

Quando você adiciona vetor de viés para as saídas da matriz, a forma não se encaixa.

```
| 1  2  3 |   +   [10, 20, 30]
| 4  5  6 |

Broadcasting 会把 Vector 沿 rows 方向拉伸：

| 1  2  3 |   | 10  20  30 |   | 11  22  33 |
| 4  5  6 | + | 10  20  30 | = | 14  25  36 |
```

Cada framework moderno faz isso automaticamente. Entender que pode ser evitado em forma parece não ser certo, mas o código pode funcionar.


```figure
vector-projection
```

## Construí-lo
### 步骤 1: Classe de vetores

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

### 步骤 2: 带核心运算的matrix class

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

### Passo 3: Olha que funciona

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

### 步骤 4:  Conectar-se a redes neurais

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

É uma camada densa única:`output = relu(W @ x + b)`Todas as camadas densas de cada rede neural estão a fazer isto.

## Use-o
NumPy usando menos código para completar tudo acima, e rapidamente alguns níveis numéricos.

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

Python 中中 `@`operador 会调用 `__matmul__`◊ NumPy utiliza em C 和 Fortran 编写的优化BLAS rutinas 为了实现它──同样数学,快 100x──

NumPy 中的广播:

```python
matrix = np.array([[1, 2, 3], [4, 5, 6]])
bias = np.array([10, 20, 30])
print(matrix + bias)
```

NumPy 会自動將1D bias broadcast到两行上──這是每個神經網絡框架中偏見添加的工作方式──

## Entrega-o
Este curso produz um método para fazer a análise das operações de matriz.`outputs/prompt-matrix-operations.md`- Não.

A classe Matrix que construímos aqui é a base para construir o mini framework de rede neural na fase 3, lição 10.

## 练习
1. **验证 inverse。**计算 `A @ A.inverse_2x2()`Confirme que você tem uma matriz de identidade. Usando três matrizes 2x2 diferentes.

2. **实现 3x3 inverse。**扩展 Matrix class, usando o método adjugado 计算 3x3 matrices 的逆点──用 NumPy 的 `np.linalg.inv` fazer um teste de controle.

3. **构建一个 two-layer network。**Apenas usando sua classe Matrix((不使用NumPy), criar uma rede neural de duas camadas: entrada (3) -> oculta (4) -> saída (2)── inicialização de pesos aleatórios,运行一次前传,并验证所有形状都正确──

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
- [3Blue1Brown: Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra)- Esta aula abrange cada operação de visão
- [NumPy documentation on broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)- NumPy  seguir de regras precisas
- [Stanford CS229 Linear Algebra Review](http://cs229.stanford.edu/section/cs229-linalg.pdf)- 面向 ML 简明参考 面向 ML 面向 ML 面向 ML 的线性代数 简明参考
