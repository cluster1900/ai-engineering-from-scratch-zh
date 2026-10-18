# التعلم الآلي 微积分

> 导数会告诉你哪边是下坡──这是网络神经学学需要的一切──

**Type:** Learn
**Language:**بايثون
**Prerequisites:** Phase 1, Lessons 01-03
**Time:** ~60 minutes

## 學习目标

- 计算常见 ML 函数($x^2$、سيمويد 、تقاطع الانتروبيا) من عدد القيم والتحليلات
- من صفر تحقيق التراجع التدريجي، في 1D و 2D الحد الأدنى من وظيفة الخسارة
- 推导 خطية التراجع 模型的渐变,并通过手动更新权重来训练它
-  شرح المصفوفة الهيسيانية  سلسلة تايلور 近似، وكذلك ارتباطها مع طريقة التحسين

## 问题

لديك شبكة عصبية تحتوي على ملايين الوزن. كل الوزن هو دورة واحدة. تحتاج إلى معرفة أي اتجاه يجب أن يذهب كل دورة، حتى جعل خطأ النموذج قليلاً.

لا توجد نقاط، تدريب شبكة العصبية يعني محاولة التغييرات في كل مرة ثم التأمل في الحظ الجيد.

## 概念

### ما هو الرقم؟

导数衡变化率──对于函数 $y = f(x)$,导数 $f'(x)$سأخبرك إن كنتِ$x$微小地 دفع ونقطة،$y$-كيف تغيرت؟

من الناحية الجينية، العدد الموجّه هو التوجه في نقطة ما على الخط.

**$f(x) = x^2$：**

| $x$ | $f(x)$ | $f'(x)$（斜率） |
|---|------|---------------|
| 0 | 0    | 0（平坦，在底部） |
| 1 | 1    | 2 |
| 2 | 4    | 4（该点处切线的斜率） |
| 3 | 9    | 6 |

في$x=2$时, التكهن هو 4... إذا كنت تـ$x$إلى اليمين تحرك قليلا جدا،$y$وربما يزيد عدد الحركة 4 مرات$x=0$时, التكهن هو 0... أنت تقع في أسفل الكأس...

形式化定义:

```math
f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}
```

في الـ "كود" ، ستقفز فوق الحد الأقصى، مباشرة باستخدام واحد صغير جداً$h$هذا هو عدد القيم

### 偏导数: مرة واحدة فقط انظر إلى واحد

المهام الحقيقية لديها الكثير من الإدخالات. فقدان الشبكة العصبية يعتمد على مئات الآلاف من الوزن.

```math
\begin{aligned}
f(x, y) &= x^2 + 3xy + y^2 \\[4pt]
\frac{\partial f}{\partial x} &= 2x + 3y \quad \text{（将 } y \text{ 视为常量）} \\
\frac{\partial f}{\partial y} &= 3x + 2y \quad \text{（将 } x \text{ 视为常量）}
\end{aligned}
```

كل محور يرد: إذا قمت بتقليل الوزن، كيف ستغير الخسارة؟

### الدرجة: جميع الدرجات المتحركة التي تشكل المتجه

سوف تجمع كل محور في متجه واحد.$f(x, y, z)$,الدرجة هي:

```math
\nabla f = \left[ \frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}, \frac{\partial f}{\partial z} \right]
```

درجة الإشارة إلى أقصى اتجاه صعودي.

**$f(x,y) = x^2 + y^2$ 的等高线图：**

هذه الوظيفة تشكل صورة كعبية،等高線是同心圆.

| 点 | $\nabla f$ | $-\nabla f$（下降方向） |
|-------|--------|----------------------------|
| (1, 1) | [2, 2]（指向上坡，远离最小值） | [-2, -2]（指向下坡，朝向最小值） |
| (0, 0) | [0, 0]（平坦，在最小值处） | [0, 0] |

هذا هو التراجع التدريجي في الصورة.

### الاتصال مع المُحسنين

شبكة عصبية تعليميّة، هذا هو التحسين. لديك وظيفة فقدان.$L(w_1, w_2, \ldots, w_n)$،إنه يقيّم النموذج لديه الكثير من الأخطاء.

```
Gradient descent update rule:

  w_new = w_old - learning_rate * dL/dw

For every weight:
  1. Compute the partial derivative of loss with respect to that weight
  2. Subtract a small multiple of it from the weight
  3. Repeat
```

معدل التعلم  التحكم فى التقدم ٬ جداً يتجاوز الهدف ٬ جداً يتجاوز التخطى بطيئة ٬

**Loss landscape（1D 切片）：**

وظيفة الخسارة$L(w)$مع الوزن$w$تغيرات تشكل منحنى ذو قمة ذو وادي

| 特征 | 描述 |
|---------|-------------|
| Global minimum | 整条曲线上的最低点，即最佳解 |
| Local minimum | 比邻近位置更低、但不是整体最低点的谷 |
| Slope | Gradient Descent 会从任意起点沿斜率向下走 |

يمكن أن يقع في الحد الأدنى المحلي، ولكن في الملايين من الوزن، هذا هو القليل من المشكلة العملية.

### عدد القيم المتحركة مقابل 解析导数

هناك طريقتان في الحساب

解析方式:手动应用微积分规则──对 $f(x) = x^2$,导数是 $f'(x) = 2x$‬ ‫وأنا متأكد، ‬ ‫

طريقة عدد القيم: استخدام تعريف إجراء تقريب.$h$计算 $f(x+h)$和 $f(x-h)$ثم تأخذ الاختلاف

```
Numerical (central difference):

f'(x) ~= f(x + h) - f(x - h)
          -----------------------
                  2h

h = 0.0001 works well in practice
```

عدد القيم التوجيهية أبطأ، ولكن ينطبق على أي وظيفة.

### 手动推导简单函数的导数

هذه هي النتائج التي ستراها في المادة الثنائية

```
Function        Derivative       Used in
--------        ----------       -------
f(x) = x^2     f'(x) = 2x      Loss functions (MSE)
f(x) = wx + b  f'(w) = x        Linear layer (gradient w.r.t. weight)
                f'(b) = 1        Linear layer (gradient w.r.t. bias)
                f'(x) = w        Linear layer (gradient w.r.t. input)
f(x) = e^x     f'(x) = e^x     Softmax, attention
f(x) = ln(x)   f'(x) = 1/x     Cross-entropy loss
f(x) = 1/(1+e^-x)  f'(x) = f(x)(1-f(x))   Sigmoid activation
```

لـ$f(x) = x^2$:

```
f(x) = x^2    f'(x) = 2x

  x    f(x)   f'(x)   meaning
  -2    4      -4      slope tilts left (decreasing)
  -1    1      -2      slope tilts left (decreasing)
   0    0       0      flat (minimum!)
   1    1       2      slope tilts right (increasing)
   2    4       4      slope tilts right (increasing)
```

لـ$f(w) = wx + b$و$x=3$.$b=1$:

```
f(w) = 3w + 1    f'(w) = 3

The derivative with respect to w is just x.
If x is big, a small change in w causes a big change in output.
```

### 链式法则

عندما تحدث المهام، قواعد السلسلة سوف تخبرك كيف تطلب التوجيه.

```
If y = f(g(x)), then dy/dx = f'(g(x)) * g'(x)

Example: y = (3x + 1)^2
  outer: f(u) = u^2       f'(u) = 2u
  inner: g(x) = 3x + 1    g'(x) = 3
  dy/dx = 2(3x + 1) * 3 = 6(3x + 1)
```

شبكة العصبية هي سلسلة من وظائف:إدخال -> خطي -> تنشيط -> خطي -> تنشيط -> خسارة。الانتشار الخلفي هو من النفاذ إلى النفاذ

### المصفوفة الهيسي

الدرجة  أخبرك المعدل...

هيسيان هو المصفوفة المكونة من المصفوفة.$f(x_1, x_2, \ldots, x_n)$،Hessian $(i, j)$项是:

```math
H_{ij} = \frac{\partial^2 f}{\partial x_i \, \partial x_j}
```

对于二变量函数 $f(x, y)$:

```math
H = \begin{bmatrix} \dfrac{\partial^2 f}{\partial x^2} & \dfrac{\partial^2 f}{\partial x \, \partial y} \\[8pt] \dfrac{\partial^2 f}{\partial y \, \partial x} & \dfrac{\partial^2 f}{\partial y^2} \end{bmatrix}
```

**Hessian 在临界点（Gradient = 0 的地方）告诉你什么：**

| Hessian 性质 | 含义 | 示例曲面 |
|-----------------|---------|-----------------|
| 正定（所有 eigenvalues > 0） | Local minimum | 向上开口的碗 |
| 负定（所有 eigenvalues < 0） | Local maximum | 向下开口的碗 |
| 不定（eigenvalues 正负混合） | Saddle point | 马鞍形 |

**示例：** $f(x, y) = x^2 - y^2$(فصل صعد)

```
df/dx = 2x       df/dy = -2y
d^2f/dx^2 = 2    d^2f/dy^2 = -2    d^2f/dxdy = 0

H = | 2   0 |
    | 0  -2 |

Eigenvalues: 2 and -2 (one positive, one negative)
--> Saddle point at (0, 0)
```

مع$f(x, y) = x^2 + y^2$(一个碗形函数) (بناء على الملفات)

```
H = | 2  0 |
    | 0  2 |

Eigenvalues: 2 and 2 (both positive)
--> Local minimum at (0, 0)
```

**为什么 Hessian 在 ML 中重要：**

طريقة نيوتن باستخدام هيسيان لاتخاذ مقارنة مع التراجع الدرجي أفضل تحسين خطواتها.

```math
\begin{aligned}
\text{牛顿法更新：} \quad & w_{\text{new}} = w_{\text{old}} - H^{-1} \cdot \text{梯度} \\
\text{梯度下降：} \quad & w_{\text{new}} = w_{\text{old}} - \text{lr} \cdot \text{梯度}
\end{aligned}
```

طريقة نيوتن 收更快, لأن Hessian 会重新缩放Gradient:方向的步子更小,平坦方向的步子更大──

المشكلة تكمن في:$N$شبكة عصبية، هيسيان هو$N \times N$نموذج مع مليون عنصر يحتاج إلى ماتريكس يحتوي على مليارات عنصر، وهذا هو السبب في استخدامنا للوجه التقريبي.

| 方法 | 使用什么 | 成本 | 收敛 |
|--------|-------------|------|-------------|
| Gradient Descent | 只使用一阶导数 | 每步 $O(N)$ | 慢（线性） |
| Newton's method | 完整 Hessian | 每步 $O(N^3)$ | 快（二次） |
| L-BFGS | 从 Gradient 历史近似 Hessian | 每步 $O(N)$ | 中等（超线性） |
| Adam | 每参数自适应 rate（对角 Hessian 近似） | 每步 $O(N)$ | 中等 |
| Natural gradient | Fisher information matrix（统计 Hessian） | 每步 $O(N^2)$ | 快 |

في الممارسة العملية، آدم هو المحفّظ المتبقي للتعلم العميق.

### سلسلة تايلور 近似

أي وظيفة مسطحة يمكن أن تكون مقاربة باستخدام العديد من النقاط:

```math
f(x + h) = f(x) + f'(x)\,h + \frac{1}{2} f''(x)\,h^2 + \frac{1}{6} f'''(x)\,h^3 + \cdots
```

يحتوي على أكثر من ذلك، تقريبا أفضل، ولكن فقط في نقطة$x$قرب تأسيسها

**为什么 Taylor series 对 ML 重要：**

- **一阶 Taylor = Gradient Descent。**عندما كنت تستخدم$f(x + h) \approx f(x) + f'(x) h$عندما تكون في صناعة التشابهات التشريعية، فإن التسلل المتدريج سوف يقلل من هذا النموذج التشريعي، لذلك تختار$h = -\text{lr} \cdot f'(x)$.

- **二阶 Taylor = Newton's method。**استخدام $f(x + h) \approx f(x) + f'(x) h + \frac{1}{2} f''(x) h^2$عندما تحصل على نموذج ثانوي... تحدّد من ذلك$h = -f'(x)/f''(x)$, هذا خطوة نيوتن

- **Loss Function 设计。**إن MSE و التقاطع بين النخاعات هو سليم، وهذا يعني أن توسعات تيلور لها تبدوا بشكل جيد.

```
Approximation order    What it captures    Optimization method
-------------------    -----------------   -------------------
0th order (constant)   Just the value      Random search
1st order (linear)     Slope               Gradient descent
2nd order (quadratic)  Curvature           Newton's method
Higher orders          Finer structure     Rarely used in ML
```

关键洞见是: جميع التحسينات القائمة على الدرجة، في الأساس كلها في مقاربتها تقريب الخسارة وظيفة، و إلى الحد الأدنى من القيمة القريبة وظيفة.

### ML 中的积分

导数告诉你变化率──积分计算累积量,也就是曲线下面积──

في مجال اللغة الإنجليزية، كنت قد قمت بالكاد بالتحديد، ولكن هذا المفهوم لا يوجد:

**概率。**لـ"ثابتة"$p(x)$                                                                                                                                                                                                                                                              
```math
P(a < X < b) = \int_a^b p(x) \, dx
```
概率 كثافة منحنى $a$和 $b$间面积,就是落在该区间内的概率

**期望值。**按概率加权的平均结果:
```math
\mathbb{E}[f(X)] = \int f(x) \, p(x) \, dx
```
الخسارة المتوقعة على توزيع البيانات هي 积分―― التدريب يقلل من تجربته تقريبها.

**KL divergence。**قياس توزيعين مختلفين:
```math
\mathrm{KL}(p \,\|\, q) = \int p(x) \log \frac{p(x)}{q(x)} \, dx
```
باستخدام VAEs ، التقطير المعرفة و استنتاج بايزيان

**归一化常数。**في استنتاج بايسي وسط:
```math
p(w \mid \text{data}) = \frac{p(\text{data} \mid w) \, p(w)}{\int p(\text{data} \mid w) \, p(w) \, dw}
```
المياه هي النقاط من جميع القيم المعادلة المحتملة. عادة ما تكون غير قابلة للتعامل، وهذا هو السبب في استخدامنا لـ MCMC و الاستنتاج المتغير وغيره من الطرق المقاربة.

| 积分概念 | 在 ML 中出现的位置 |
|-----------------|----------------------|
| 曲线下面积 | 由 density functions 得到概率 |
| 期望值 | Loss Functions、risk minimization |
| KL divergence | VAEs、policy optimization、distillation |
| 归一化 | Bayesian posteriors、softmax denominator |
| Marginal likelihood | Model comparison、evidence lower bound (ELBO) |

### رسم الحسابات 中的多变量链式法则

链式法则不仅适用一条线上的标量函数――在神经网络中,变量会分叉并合并―― 下面展示导数如何流过一个简单的前进传:

```mermaid
graph LR
    x["x (input)"] -->|"*w"| z1["z1 = w*x"]
    z1 -->|"+b"| z2["z2 = w*x + b"]
    z2 -->|"sigmoid"| a["a = sigmoid(z2)"]
    a -->|"loss fn"| L["L = -(y*log(a) + (1-y)*log(1-a))"]
```

الممر الخلفي 会从右到左计算 درج:

```mermaid
graph RL
    dL["dL/dL = 1"] -->|"dL/da"| da["dL/da = -y/a + (1-y)/(1-a)"]
    da -->|"da/dz2 = a(1-a)"| dz2["dL/dz2 = dL/da * a(1-a)"]
    dz2 -->|"dz2/dw = x"| dw["dL/dw = dL/dz2 * x"]
    dz2 -->|"dz2/db = 1"| db["dL/db = dL/dz2 * 1"]
```

كل سهم يُضاعف على الدرجات المحلية. درجات أي عنصر، هو ضرب جميع الدرجات المحلية على طريق الدرجات المحلية من الخسارة إلى ذلك الدرجات المحلية. عندما يتم تقسيم الطرق وتجمعها، سوف تضيف مساهمة كل طريق إلى بعضها البعض.

كل المحتوى في التوزيع الخلفي هو: من الخروج إلى الخروج، نظاميا في رسم الحسابات في قانون التطبيق للسلسلة.

### ماتريكس جاكوبيان

عندما تقوم وظيفة بتركيب متجه إلى متجه، مثل طبقة الشبكة العصبية، فإن عدد توجيهاتها هو ماتريكس.

لـ$f: \mathbb{R}^n \to \mathbb{R}^m$، جاكوبيان$J$نعم واحد$m \times n$المصفوفة:

| | $x_1$ | $x_2$ | ... | $x_n$ |
|---|---|---|---|---|
| $f_1$ | $\partial f_1/\partial x_1$ | $\partial f_1/\partial x_2$ | ... | $\partial f_1/\partial x_n$ |
| $f_2$ | $\partial f_2/\partial x_1$ | $\partial f_2/\partial x_2$ | ... | $\partial f_2/\partial x_n$ |
| ... | ... | ... | ... | ... |
| $f_m$ | $\partial f_m/\partial x_1$ | $\partial f_m/\partial x_2$ | ... | $\partial f_m/\partial x_n$ |

لن تقوم بتحليل شبكة العصبية بشكلٍ يدوي.$\mathbb{R}^n$映射到 $\mathbb{R}^m$، هو جاكوبيانه هو$m \times n$◊ الحد الأدنى من خلال هذه المصفوفة

### لماذا هذا مهم للشبكة العصبية

كل وزن في الشبكة العصبية سيحصل على درجة.

```mermaid
graph LR
    subgraph Forward["Forward Pass"]
        I["input"] --> W1["W1"] --> R["relu"] --> W2["W2"] --> S["softmax"] --> L["loss"]
    end
```

```mermaid
graph RL
    subgraph Backward["Backward Pass"]
        dL["dL/dloss"] --> dW2["dL/dW2"] --> d2["..."] --> dW1["dL/dW1"]
    end
```

كل مرة
- `W1 = W1 - lr * dL/dW1`
- `W2 = W2 - lr * dL/dW2`

المضي قدما 计算预测和损失──المرور الخلفي 计算损失 相对于每权重的梯度──然后每权重都向下坡方向迈一小步──重复数百万步──这就是深度学习──


```figure
derivative-tangent
```

## بناءها

### الخطوة 1: من الصفر تحقيق عدد القيم

```python
def numerical_derivative(f, x, h=1e-7):
    return (f(x + h) - f(x - h)) / (2 * h)

def f(x):
    return x ** 2

for x in [-2, -1, 0, 1, 2]:
    numerical = numerical_derivative(f, x)
    analytical = 2 * x
    print(f"x={x:2d}  f'(x) numerical={numerical:.6f}  analytical={analytical:.1f}")
```

يتناسب عدد القيم مع عدد القيم في عدد كبير من الأرقام الصغيرة.

### الخطوة الثانية: الاختيارات

```python
def numerical_gradient(f, point, h=1e-7):
    gradient = []
    for i in range(len(point)):
        point_plus = list(point)
        point_minus = list(point)
        point_plus[i] += h
        point_minus[i] -= h
        partial = (f(point_plus) - f(point_minus)) / (2 * h)
        gradient.append(partial)
    return gradient

def f_multi(point):
    x, y = point
    return x**2 + 3*x*y + y**2

grad = numerical_gradient(f_multi, [1.0, 2.0])
print(f"Numerical gradient at (1,2): {[f'{g:.4f}' for g in grad]}")
print(f"Analytical gradient at (1,2): [2*1+3*2, 3*1+2*2] = [{2*1+3*2}, {3*1+2*2}]")
```

### 步骤 3: باستخدام التراجع التدريجي 找到 f(x) = x^2

```python
x = 5.0
lr = 0.1
for step in range(20):
    grad = 2 * x
    x = x - lr * grad
    print(f"step {step:2d}  x={x:8.4f}  f(x)={x**2:10.6f}")
```

من$x=5$يبدأ كل خطوة تقترب$x=0$(أقل قيمة)

### الخطوة 4: تنفيذ التراجع التدريجي على وظيفة 2D

```python
def f_2d(point):
    x, y = point
    return x**2 + y**2

point = [4.0, 3.0]
lr = 0.1
for step in range(30):
    grad = numerical_gradient(f_2d, point)
    point = [p - lr * g for p, g in zip(point, grad)]
    loss = f_2d(point)
    if step % 5 == 0 or step == 29:
        print(f"step {step:2d}  point=({point[0]:7.4f}, {point[1]:7.4f})  f={loss:.6f}")
```

### الخطوة 5: مقارنة القيم والحسابات

```python
import math

test_functions = [
    ("x^2",      lambda x: x**2,          lambda x: 2*x),
    ("x^3",      lambda x: x**3,          lambda x: 3*x**2),
    ("sin(x)",   lambda x: math.sin(x),   lambda x: math.cos(x)),
    ("e^x",      lambda x: math.exp(x),   lambda x: math.exp(x)),
    ("1/x",      lambda x: 1/x,           lambda x: -1/x**2),
]

x = 2.0
print(f"{'Function':<12} {'Numerical':>12} {'Analytical':>12} {'Error':>12}")
print("-" * 50)
for name, f, df in test_functions:
    num = numerical_derivative(f, x)
    ana = df(x)
    err = abs(num - ana)
    print(f"{name:<12} {num:12.6f} {ana:12.6f} {err:12.2e}")
```

### 步骤 6: عدد القيمة الحسابية

```python
def hessian_2d(f, x, y, h=1e-5):
    fxx = (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h ** 2)
    fyy = (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h ** 2)
    fxy = (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h ** 2)
    return [[fxx, fxy], [fxy, fyy]]

def saddle(x, y):
    return x ** 2 - y ** 2

def bowl(x, y):
    return x ** 2 + y ** 2

H_saddle = hessian_2d(saddle, 0.0, 0.0)
H_bowl = hessian_2d(bowl, 0.0, 0.0)
print(f"Saddle Hessian: {H_saddle}")  # [[2, 0], [0, -2]] -- mixed signs
print(f"Bowl Hessian:   {H_bowl}")    # [[2, 0], [0, 2]]  -- both positive
```

صعد  وظيفة من هيسيان لديه قيم خاصة 2 和 -2(符号混合,确认是 صعد نقطة)。وعاء  وظيفة لديه قيم خاصة 2 和 2(均为正,确认是最小)。

### الخطوة 7: تايلور 近似的实际效果

```python
import math

def taylor_approx(f, f_prime, f_double_prime, x0, h, order=2):
    result = f(x0)
    if order >= 1:
        result += f_prime(x0) * h
    if order >= 2:
        result += 0.5 * f_double_prime(x0) * h ** 2
    return result

x0 = 0.0
for h in [0.1, 0.5, 1.0, 2.0]:
    true_val = math.sin(h)
    t1 = taylor_approx(math.sin, math.cos, lambda x: -math.sin(x), x0, h, order=1)
    t2 = taylor_approx(math.sin, math.cos, lambda x: -math.sin(x), x0, h, order=2)
    print(f"h={h:.1f}  sin(h)={true_val:.4f}  order1={t1:.4f}  order2={t2:.4f}")
```

في$x_0=0$قرب،$\sin(x) \approx x$(إلى مرحلة الأولى (تايلور)$h$هذا يبدو جيداً جداً، لكن بالنسبة للكبير$h$هذا هو السبب في أن التراجع التدريجي في معدلات التعلم الصغيرة، والتي هي أفضل نتيجة: كل خطوة فرض أن التقارير السريعة هي دقيقة.

### الخطوة الثامنة: لماذا هذا مهم جداً للشبكة العصبية

```python
import random

random.seed(42)

w = random.gauss(0, 1)
b = random.gauss(0, 1)
lr = 0.01

xs = [1.0, 2.0, 3.0, 4.0, 5.0]
ys = [3.0, 5.0, 7.0, 9.0, 11.0]

for epoch in range(200):
    total_loss = 0
    dw = 0
    db = 0
    for x, y in zip(xs, ys):
        pred = w * x + b
        error = pred - y
        total_loss += error ** 2
        dw += 2 * error * x
        db += 2 * error
    dw /= len(xs)
    db /= len(xs)
    total_loss /= len(xs)
    w -= lr * dw
    b -= lr * db
    if epoch % 40 == 0 or epoch == 199:
        print(f"epoch {epoch:3d}  w={w:.4f}  b={b:.4f}  loss={total_loss:.6f}")

print(f"\nLearned: y = {w:.2f}x + {b:.2f}")
print(f"Actual:  y = 2x + 1")
```

كل دورة تدريبية مبنية على الدرجة تتبع هذا النموذج: التنبؤ والتحساب الخسارة وتحساب الدرجة وتحديث الوزن.

## استخدمها

استخدم NumPy 时, نفس التشغيل سوف يكون أسرع 、 أكثر بساطة:

```python
import numpy as np

x = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([3, 5, 7, 9, 11], dtype=float)

w, b = np.random.randn(), np.random.randn()
lr = 0.01

for epoch in range(200):
    pred = w * x + b
    error = pred - y
    loss = np.mean(error ** 2)
    dw = np.mean(2 * error * x)
    db = np.mean(2 * error)
    w -= lr * dw
    b -= lr * db

print(f"Learned: y = {w:.2f}x + {b:.2f}")
```

أنت刚刚从零构建了渐进式下降――PyTorch 会自动完成渐进式计算,但更新循环是完全一样――

## التدريب

1. استخدام استخدام اثنين من المرات`numerical_derivative`كيفية تحقيقها`numerical_second_derivative(f, x)` التحقق$x^3$في$x=2$处的二阶导数是12──
2. استخدام النزول الدرجي 找到 $f(x, y) = (x - 3)^2 + (y + 1)^2$من الحد الأدنى من القيمة$(0, 0)$开始──答案应收到 $(3, -1)$.
3. في حلقة التراجع التدريجي إضافة الزخم:维护一个会累积过去$f(x) = x^4 - 3x^2$السرعة المقبلة مقارنة مع عدم الزخم

### 提示

**练习 1。**定义一个返回  تحديد واحد`numerical_derivative(f, x)`من وظيفة مساعد، وإعادة إرسالها إلى `numerical_derivative` إذا كان النتيجة ضجة أكبر، فإن المستخدمين يستخدمون المقياسات الأكبر، على سبيل المثال`h=1e-4`في$x=2$处的结果应接近12

**练习 2。**كتب خارج التعدد $(2(x - 3), 2(y + 1))$أو استخدام`numerical_gradient`, من$(0, 0)$开始调用 `gradient_descent_nd` كل 10 خطوات طباعة واحدة坐标؛ يجب أن تكون نحو $(3, -1)$الحركة، الخسارة يجب أن تنخفض إلى ما يقرب من 0.

**练习 3。** حفظ السرعة `v`, حسب `v = momentum * v - lr * grad`更新,再将 `v`إضافة إلى`x`上── احصائيات الطرق تحتاج كل خطوة لجعلها تقترب من 0؛ الحد الأدنى من القيمة تقع $x = \pm\sqrt{1.5} \approx \pm 1.225$.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| Derivative | “斜率” | 函数在某一点的变化率。告诉你输入每变化一个单位，输出会变化多少。 |
| Partial derivative | “一个变量的导数” | 在保持其他所有变量不变时，对某一个变量求导。 |
| Gradient | “最陡上升方向” | 由所有偏导数组成的 Vector。指向让函数增长最快的方向。 |
| Gradient Descent | “往下坡走” | 从参数中减去 Gradient（乘以 learning rate），从而降低 Loss。Neural Network 训练的核心。 |
| Learning rate | “步长” | 控制每一步 Gradient Descent 有多大的标量。太大：发散。太小：收敛缓慢。 |
| Chain rule | “把导数相乘” | 对复合函数求导的规则：$\frac{df}{dx} = \frac{df}{dg} \cdot \frac{dg}{dx}$。Backpropagation 的数学基础。 |
| Jacobian | “导数 Matrix” | 当一个函数把 Vector 映射到 Vector 时，Jacobian 是所有输出相对于输入的偏导数组成的 Matrix。 |
| Numerical derivative | “有限差分” | 通过在两个相邻点上评估函数并计算它们之间的斜率来近似导数。 |
| Backpropagation | “Reverse-mode autodiff” | 使用链式法则，从输出到输入逐层计算 Gradient。Neural Network 就是这样学习的。 |
| Hessian | “二阶导数 Matrix” | 所有二阶偏导数组成的 Matrix。描述函数的曲率。在临界点处 Hessian 正定意味着 local minimum。 |
| Taylor series | “多项式近似” | 使用函数的导数在某一点附近近似函数：$f(x+h) \approx f(x) + f'(x)h + \frac{1}{2}f''(x)h^2 + \cdots$ 它是理解 Gradient Descent 和 Newton's method 为什么有效的基础。 |
| Integral | “曲线下面积” | 某个量在一个范围内的累积。在 ML 中，积分定义概率、期望值和 KL divergence。 |

## 延伸阅读

- [3Blue1Brown: Essence of Calculus](https://www.3blue1brown.com/topics/calculus)- حول الوصول الى القانون
- [Stanford CS231n: Backpropagation](https://cs231n.github.io/optimization-2/)- درجة  كيف يمر عبر طبقة الشبكة العصبية
