# Vector ∆ Matrix y cálculo

> Cada red neuronal es sólo una multiplicación de la matriz con algunos pasos adicionales.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 1, Lesson 01（Linear Algebra 直觉）
**Time:** ~60 minutes

## El objetivo del aprendizaje
- Construir una clase de Matrix, apoyar operaciones de elementos-sabio 、multiplicación de matrix 、transposición 、determinante 和 inverso
- 区分 elemento-wise multiplicación y matriz multiplicación,并 explicar sus respectivos escenarios de uso adecuado
- Sólo usando la clase de Matrix de la realización de la cero, lograr una capa densa de red neuronal`relu(W @ x + b)`(en inglés)
- 解释广播规则, así como los marcos de redes neuronales

##  problemas
Tú quieres construir una red neuronal...

```
output = activation(weights @ input + bias)
```

Aquí está .`@`Es la multiplicación de la matriz.`weights`Es una Matrix.`input`Si no sabes qué hacen estos cálculos, esta línea es mágica. Si sabes que es un paso adelante de una capa, sólo se usan tres cálculos.

模型处理的每张图像都是像素值的矩阵──每个字符嵌都是一向量──每一个神经网络的每一个层都是一次矩阵转变──不能熟练掌握矩阵操作,就无法构建AI系统;这就像不了解变量就无法写代码一样──

Este curso comenzará a construir esta habilidad desde cero.

## 概念
### Vector: tiene una lista de números

El vector es un grupo de números de gran tamaño y de dirección. En la IA, el vector representa puntos de datos, características o parámetros.

```
v = [3, 4]        -- 一个 2D Vector
w = [1, 0, -2]    -- 一个 3D Vector
```

Vector 2D `[3, 4]`Indicando el punto de la superficie (3, 4),... su longitud (magnitud) es de 5 ((3-4-5 三角形) ⋅

### Matriz: digital网格

Matriz es una 2D 网格──由行 和列 组成──一个 m x n Matrix 有 m 行和 n 列──

```
A = | 1  2  3 |     -- 2x3 Matrix（2 行，3 列）
    | 4  5  6 |
```

En las redes neuronales, las matrices de peso se convertirán en vectores de entrada y salida. Una capa de entradas y 128 salidas.

### ¿ Por qué la forma es importante ?

La multiplicación de matrices tiene reglas estrictas:`(m x n) @ (n x p) = (m x p)`◊ las dimensiones internas deben coincidir.

```
(128 x 784) @ (784 x 1) = (128 x 1)
  weights       input       output

内部维度：784 = 784  -- 有效
```

Si en PyTorch se encuentra un error de desajuste de forma, la razón está aquí.

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

Esta diferencia a menudo hace que los principiantes pisen el cano.

Elementos-wise: la misma posición相乘── dos matrices  deben tener la misma forma──

```
| 1  2 |   | 5  6 |   | 5  12 |
| 3  4 | * | 7  8 | = | 21 32 |
```

Multiplicación de matriz:ramas y columnas de productos de puntos.

```
| 1  2 |   | 5  6 |   | 1*5+2*7  1*6+2*8 |   | 19  22 |
| 3  4 | @ | 7  8 | = | 3*5+4*7  3*6+4*8 | = | 43  50 |
```

Diferentes cálculos, diferentes resultados, diferentes reglas.

### La radiodifusión

Cuando se añade el vector de sesgo a las salidas de la matriz, la forma no coincide.

```
| 1  2  3 |   +   [10, 20, 30]
| 4  5  6 |

Broadcasting 会把 Vector 沿 rows 方向拉伸：

| 1  2  3 |   | 10  20  30 |   | 11  22  33 |
| 4  5  6 | + | 10  20  30 | = | 14  25  36 |
```

Cada marco moderno lo hace automáticamente. Comprender que puede evitarse en forma parece ir en contra, pero el código puede funcionar.


```figure
vector-projection
```

## Construirlo
### 步骤 1: Clase de vectores

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

### Paso 2: 带核心运算的 matriz clase

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

### Paso 3: Mira que funciona

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

### Paso 4: Conectar a las redes neuronales

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

Esta es una sola capa densa:`output = relu(W @ x + b)`◊ Cada capa densa de la red neuronal está haciendo esto.

## Usalo
NumPy con menos código para hacer todo lo anterior, y rápidamente varios niveles numéricos.

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

Python en el medio`@`operador 会调用 `__matmul__`◊NumPy utiliza en C y Fortran 编写的优化BLAS rutinas para lograrlo―Same math,快 100x―

NumPy 中的 radiodifusión:

```python
matrix = np.array([[1, 2, 3], [4, 5, 6]])
bias = np.array([10, 20, 30])
print(matrix + bias)
```

NumPy 会自动把 1D bias broadcast到两行上――这就是每个 Neural Network framework中偏差的工作方式――

##  entregarlo
Este curso ha producido un método para la aplicación de las operaciones de matriz.`outputs/prompt-matrix-operations.md`¿Qué es eso?

La clase Matrix que construimos aquí es la base de la construcción de un mini marco de red neuronal en la fase 3, lección 10.

##  ejercicios
1. **验证 inverse。**计算 `A @ A.inverse_2x2()`, confirme que tienes una matriz de identidad... con tres diferentes matrices 2x2 试一试―― Cuando determinante ¿qué ocurre cuando es?

2. **实现 3x3 inverse。**扩展 Matrix class, usando el método adjugado 计算 3x3 matrices 的逆点──用 NumPy 的 `np.linalg.inv` realizar un control de la prueba ∙

3. **构建一个 two-layer network。**Sólo usando tu Matrix clase((no usando NumPy), crear una red neuronal de dos capas: entrada (3) -> oculta (4) -> salida (2)── inicializando pesos aleatorios,运行一次前传,并验证所有形状都正确──

## 关键术语: "El hombre es un hombre"
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
- [3Blue1Brown: Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra)- Este curso abarca cada operación de la visión de la intuición
- [NumPy documentation on broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)- Número de normas de precisión que se siguen
- [Stanford CS229 Linear Algebra Review](http://cs229.stanford.edu/section/cs229-linalg.pdf)- 面向 ML 简明参考 面向 ML 面向 ML 的线性代数 简明参考
