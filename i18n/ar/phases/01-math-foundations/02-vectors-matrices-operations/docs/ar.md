# المتجهات والمصفوفات مع الحساب

> كل شبكة عصبية مجرد مضاعفة المصفوفة مع بعض الخطوات الإضافية

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 1, Lesson 01（Linear Algebra 直觉）
**Time:** ~60 minutes

## 學习目标
- 构建一个矩阵类,支持元素-wise operations、矩阵乘法、转移、确定和逆
- 区分元素-حكمة ضرب ومصفوفة ضرب،并 تفسير المشهد الملائمة الخاصة بهم
- فقط باستخدام من الصف المصفوفة التنفيذية، لتحقيق طبقة كثيفة شبكة عصبية`relu(W @ x + b)`)
- تفسير قواعد البث، وكذلك إطاريات شبكة العصبية

## 问题
هل تريد بناء شبكة عصبية؟

```
output = activation(weights @ input + bias)
```

هنا`@`هو مضاعفة المصفوفة`weights`إنها ماتريكس`input`إن كنت لا تعرف ما تفعله هذه الحسابات، فإن هذه هي السحر. إن كنت تعرف أنها مجرد خطة واحدة، فستستخدم ثلاثة حسابات فقط.

كل صورة في النموذج المعالجة هي قيم البيكسل في المصفوفة. كل كلمة تضمين مدينة متجهة. كل طبقة من الشبكة العصبية هي تحول مدينة متريكس. لا يمكن أن تتعلم عمليات المصفوفة. لا يمكن أن تكوين أنظمة الذكاء الاصطناعي.

هذا الدرس سوف يبدأ من الصفر في بناء هذه المهارة

## 概念
### المتجه: قائمة رقمية

المتجه هو مع مجموعة كبيرة من الأرقام والتي تتبع الاتجاهات. في AI، المتجه يعبر عن نقاط البيانات أو الميزات أو المعلمات.

```
v = [3, 4]        -- 一个 2D Vector
w = [1, 0, -2]    -- 一个 3D Vector
```

متجه ثنائي`[3, 4]`إندسترت إلى المنحدر على المسطح (3, 4)。 طوله(حجم) هو 5(3-4-5 三角形)。

### المصفوفة: رقم

المصفوفة هي 2D 网格──由行 和 الأعمدة 组成──一个 m x n المصفوفة 有 m 行和 n 列──

```
A = | 1  2  3 |     -- 2x3 Matrix（2 行，3 列）
    | 4  5  6 |
```

في الشبكات العصبية، ستقوم المصفوفات الوزنية بتحويل متجهات المدخلات إلى متجهات الخروج.

### لماذا الشكل مهم

مضاعفة المصفوفة لديها قواعد صارمة:`(m x n) @ (n x p) = (m x p)`◊ الدرجة الداخلية يجب أن تتطابق

```
(128 x 784) @ (784 x 1) = (128 x 1)
  weights       input       output

内部维度：784 = 784  -- 有效
```

إذا واجهت خطأ في عدم مطابقة الشكل في PyTorch، السبب هنا.

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

### 逐元素乘法 مقابل ماتريكس 乘法

هذا الفصل يجعل المبتدئين يرتدون على الحفرة

في العنصر: نفس الموقع 乘── المصفوفات 必须具有相同形状──

```
| 1  2 |   | 5  6 |   | 5  12 |
| 3  4 | * | 7  8 | = | 21 32 |
```

مضاعفة المصفوفة: الصفوف و أعمدة منتجات النقاط.

```
| 1  2 |   | 5  6 |   | 1*5+2*7  1*6+2*8 |   | 19  22 |
| 3  4 | @ | 7  8 | = | 3*5+4*7  3*6+4*8 | = | 43  50 |
```

مختلفة النتائج مختلفة القواعد مختلفة

### الإذاعة

عندما تضع متجه التحيز إضافة إلى المخرجات من المصفوفة، الصورة لا تتطابق.

```
| 1  2  3 |   +   [10, 20, 30]
| 4  5  6 |

Broadcasting 会把 Vector 沿 rows 方向拉伸：

| 1  2  3 |   | 10  20  30 |   | 11  22  33 |
| 4  5  6 | + | 10  20  30 | = | 14  25  36 |
```

كل إطار حديث يقوم بذلك تلقائياً. فهمه يمكن تجنبه في الشكل يبدو غير صحيح، ولكن الكود يمكن أن ينجح في التشغيل.


```figure
vector-projection
```

## بناءها
### 步骤 1: فئة المتجهات

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

### الخطوة الثانية: 带核心运算的矩阵类

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

### الخطوة الثالثة: انظر انها تعمل

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

### الخطوة الرابعة: الاتصال بالشبكات العصبية

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

هذا طبقة كثيفة واحدة:`output = relu(W @ x + b)`كل طبقة كثيفة في كل شبكة عصبية تفعل ذلك

## استخدمها
وبالإضافة إلى ذلك، أستخدم عدد أقل من الكود لإنجاز كل شيء فوق، وسرعان ما عدد القليل من الدرجات.

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

Python 中中 `@`المُشغل 会调用 `__matmul__`◊NumPy استخدام باستخدام C 和 فورتان 编写的优化BLAS روتين لتحقيق ذلك──同样数学,快 100x──

الإذاعة في:

```python
matrix = np.array([[1, 2, 3], [4, 5, 6]])
bias = np.array([10, 20, 30])
print(matrix + bias)
```

NumPy 会自动把1D تحيز البث إلى اثنين من الخطوط على. هذا هو كل إطار شبكة عصبية طريقة عمل إضافة التحيز في.

## 交付 it
هذا المرحلة تُنتج عن مفكرة تستخدم من خلال علم الهندسة مباشرة لعمليات المصفوفة.`outputs/prompt-matrix-operations.md`.

فصيلة المصفوفة التي بنيت فيها هي أساس بناء إطار شبكة عصبية صغيرة في المرحلة الثالثة، الدروس 10

## التدريب
1. **验证 inverse。**计算 `A @ A.inverse_2x2()`, تأكد من أنك حصلت على المصفوفة الهوية. باستخدام ثلاث المصفوفات المختلفة 2x2 . حاولي أن تجري محاولة.

2. **实现 3x3 inverse。**扩展 ماتريكس طبقة، استخدام طريقة الجمع 计算 3x3 ماتريكس 的逆点──用 NumPy 的 `np.linalg.inv`إجراء تجارب

3. **构建一个 two-layer network。**فقط باستخدام صف ماتريسك (((不使用NumPy) ، إنشاء شبكة عصبية ذات طبقتين: المدخل (3) -> مخفي (4) -> الخروج (2)── ابتداء الوزن العشوائية،运行一次向前,并验证所有形状都正确──

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
- [3Blue1Brown: Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra)- هذا الدروس يغطي كل عملية
- [NumPy documentation on broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)- النظام المحدد الذي يتبع
- [Stanford CS229 Linear Algebra Review](http://cs229.stanford.edu/section/cs229-linalg.pdf)- 面向 ML 的线性代数 简明参考
