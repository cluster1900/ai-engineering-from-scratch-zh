# Máy học 微积分

> 导数会告诉你哪边是下坡──这是神经网络学习所需的一切──

**Type:** Learn
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-03
**Time:** ~60 minutes

## Học mục tiêu

- 计算常见 ML 函数($x^2$、sigmoid、cross-entropy) số lượng và phân tích
- Từ zero thực hiện giảm độ, trong 1D và 2D tối thiểu hóa Loss Function
- 推导 tuyến tính hồi quy 模型的渐变,并通过手动更新权重来训练它
- Giải thích Hessian Matrix、Taylor series gần giống, cũng như mối liên hệ của chúng với phương pháp tối ưu hóa

## 问题

Bạn có một mạng Neural có hàng triệu trọng lượng. Mỗi trọng lượng là một vòng quay. Bạn cần phải tìm ra hướng mà mỗi vòng quay nên chuyển hướng, để làm cho lỗi của mô hình nhỏ hơn một chút.

Không có điểm nhỏ, đào tạo mạng thần kinh là cố gắng thay đổi bất cứ lúc nào, sau đó hy vọng vào may mắn. Với số lượng dẫn, bạn có thể biết chính xác mỗi trọng lượng ảnh hưởng đến sai lầm.

## 概念

### - Quý vị là gì?

导数衡变化率── đối với hàm $y = f(x)$,导数 $f'(x)$Anh sẽ nói với anh nếu anh...$x$微小地 đẩy một chút,$y$Sẽ thay đổi bao nhiêu?

Từ quan điểm, số dẫn là độ nghiêng của một đường cắt ở một điểm nào đó.

**$f(x) = x^2$：**

| $x$ | $f(x)$ | $f'(x)$（斜率） |
|---|------|---------------|
| 0 | 0    | 0（平坦，在底部） |
| 1 | 1    | 2 |
| 2 | 4    | 4（该点处切线的斜率） |
| 3 | 9    | 6 |

Trong $x=2$时, tỷ lệ nghiêng là 4... nếu bạn đưa $x$Nhìn về bên phải.$y$Đại hội tăng số lượng chuyển động này 4 lần.$x=0$时, tỷ lệ nghiêng là 0...

形式化定义:

```math
f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}
```

Trong mã, bạn sẽ nhảy qua giới hạn, trực tiếp sử dụng một rất nhỏ $h$ Đó là số giá trị của số.

### 偏导数: một lần chỉ nhìn một biến số

Thực hàm có rất nhiều đầu vào. Khung mất mạng thần kinh phụ thuộc vào hàng ngàn trọng lượng.

```math
\begin{aligned}
f(x, y) &= x^2 + 3xy + y^2 \\[4pt]
\frac{\partial f}{\partial x} &= 2x + 3y \quad \text{（将 } y \text{ 视为常量）} \\
\frac{\partial f}{\partial y} &= 3x + 2y \quad \text{（将 } x \text{ 视为常量）}
\end{aligned}
```

Mỗi số hướng dẫn trả lời là: Nếu tôi chỉ giảm trọng lượng này, mất sẽ thay đổi như thế nào?

### Gradient: tất cả các đường dẫn cấu thành của vector

Gradient sẽ thu thập mỗi định hướng số thành một vector.$f(x, y, z)$,Gradient là:

```math
\nabla f = \left[ \frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}, \frac{\partial f}{\partial z} \right]
```

Gradient chỉ hướng lên nhất. Để tối thiểu hóa một hàm, hãy hướng ngược hướng đi.

**$f(x,y) = x^2 + y^2$ 的等高线图：**

Hàm này hình thành một hình dạng cong,等高线是同心圆.

| 点 | $\nabla f$ | $-\nabla f$（下降方向） |
|-------|--------|----------------------------|
| (1, 1) | [2, 2]（指向上坡，远离最小值） | [-2, -2]（指向下坡，朝向最小值） |
| (0, 0) | [0, 0]（平坦，在最小值处） | [0, 0] |

Đây là một bức tranh về sự giảm dần.

### Liên hệ với Optimization

训练 Neural Network 就是优化. Bạn có một chức năng mất mát.$L(w_1, w_2, \ldots, w_n)$Nó đo lường mô hình có nhiều sai lầm.

```
Gradient descent update rule:

  w_new = w_old - learning_rate * dL/dw

For every weight:
  1. Compute the partial derivative of loss with respect to that weight
  2. Subtract a small multiple of it from the weight
  3. Repeat
```

Tốc độ học tập  kiểm soát bước dài.  quá lớn sẽ vượt quá mục tiêu.  quá nhỏ sẽ trèo chậm.

**Loss landscape（1D 切片）：**

Phụ thể mất tích$L(w)$ Với trọng lượng $w$Sự thay đổi hình thành một đường cong có đỉnh có thung lũng.

| 特征 | 描述 |
|---------|-------------|
| Global minimum | 整条曲线上的最低点，即最佳解 |
| Local minimum | 比邻近位置更低、但不是整体最低点的谷 |
| Slope | Gradient Descent 会从任意起点沿斜率向下走 |

Sự giảm dần sẽ theo chiều dốc giảm. Nó có thể rơi vào mức tối thiểu địa phương, nhưng trong không gian cao (năm triệu trọng), đây là một vấn đề thực tế.

### 数值导数 vs 解析导数

计算导数 có hai cách:

解析方式:手动应用微积分规则── đối với $f(x) = x^2$,导数 là $f'(x) = 2x$                                                                                                                                                                                                                            

Số giá trị cách: sử dụng định nghĩa để thực hiện gần giống.$h$计算 $f(x+h)$和 $f(x-h)$, rồi lấy khác biệt.

```
Numerical (central difference):

f'(x) ~= f(x + h) - f(x - h)
          -----------------------
                  2h

h = 0.0001 works well in practice
```

Số giá trị dẫn đường chậm hơn, nhưng áp dụng cho bất kỳ hàm nào.

### 手动推导简单函数的导数

Đây là số lượng dẫn bạn sẽ thấy nhiều lần trong ML.

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

 Đối với $f(x) = x^2$- Có thể là:

```
f(x) = x^2    f'(x) = 2x

  x    f(x)   f'(x)   meaning
  -2    4      -4      slope tilts left (decreasing)
  -1    1      -2      slope tilts left (decreasing)
   0    0       0      flat (minimum!)
   1    1       2      slope tilts right (increasing)
   2    4       4      slope tilts right (increasing)
```

 Đối với $f(w) = wx + b$, và$x=3$$b=1$- Có thể là:

```
f(w) = 3w + 1    f'(w) = 3

The derivative with respect to w is just x.
If x is big, a small change in w causes a big change in output.
```

### 链式法则

Khi hàm xảy ra, các quy tắc chuỗi sẽ cho bạn biết làm thế nào để tìm kiếm hướng dẫn.

```
If y = f(g(x)), then dy/dx = f'(g(x)) * g'(x)

Example: y = (3x + 1)^2
  outer: f(u) = u^2       f'(u) = 2u
  inner: g(x) = 3x + 1    g'(x) = 3
  dy/dx = 2(3x + 1) * 3 = 6(3x + 1)
```

Mạng thần kinh là một chuỗi hàm: input -> linear -> activation -> linear -> activation -> loss。Backpropagation chính là từ输出 đến输入反复应用链式法则。 đây là toàn bộ thuật toán。

### Matrix Hessian

Gradient 告诉你斜率──Hessian 告诉你曲率──

Hessian là một matrix cấu thành các hàm.$f(x_1, x_2, \ldots, x_n)$,Hessian của $(i, j)$项 là:

```math
H_{ij} = \frac{\partial^2 f}{\partial x_i \, \partial x_j}
```

对于二变量函数 $f(x, y)$- Có thể là:

```math
H = \begin{bmatrix} \dfrac{\partial^2 f}{\partial x^2} & \dfrac{\partial^2 f}{\partial x \, \partial y} \\[8pt] \dfrac{\partial^2 f}{\partial y \, \partial x} & \dfrac{\partial^2 f}{\partial y^2} \end{bmatrix}
```

**Hessian 在临界点（Gradient = 0 的地方）告诉你什么：**

| Hessian 性质 | 含义 | 示例曲面 |
|-----------------|---------|-----------------|
| 正定（所有 eigenvalues > 0） | Local minimum | 向上开口的碗 |
| 负定（所有 eigenvalues < 0） | Local maximum | 向下开口的碗 |
| 不定（eigenvalues 正负混合） | Saddle point | 马鞍形 |

**示例：** $f(x, y) = x^2 - y^2$(một saddle 函数)

```
df/dx = 2x       df/dy = -2y
d^2f/dx^2 = 2    d^2f/dy^2 = -2    d^2f/dxdy = 0

H = | 2   0 |
    | 0  -2 |

Eigenvalues: 2 and -2 (one positive, one negative)
--> Saddle point at (0, 0)
```

Với$f(x, y) = x^2 + y^2$(一个碗形函数)

```
H = | 2  0 |
    | 0  2 |

Eigenvalues: 2 and 2 (both positive)
--> Local minimum at (0, 0)
```

**为什么 Hessian 在 ML 中重要：**

Phương pháp Newton sử dụng Hessian để áp dụng hơn là giảm độ tốt hơn. Nó không chỉ theo đường cong, cũng sẽ xem xét tỷ lệ cong:

```math
\begin{aligned}
\text{牛顿法更新：} \quad & w_{\text{new}} = w_{\text{old}} - H^{-1} \cdot \text{梯度} \\
\text{梯度下降：} \quad & w_{\text{new}} = w_{\text{old}} - \text{lr} \cdot \text{梯度}
\end{aligned}
```

Phương pháp của Newton 收更快, vì Hessian 会 tái缩缩 Gradient:方向的步子更小,平坦方向的步子更大──

 vấn đề là: đối với có$N$个参数 của mạng thần kinh, Hessian là $N \times N$Một mô hình có 100 triệu tham số cần một matrix chứa 1 tỷ nguyên tố. Đó là lý do tại sao chúng ta sử dụng phương pháp gần gũi.

| 方法 | 使用什么 | 成本 | 收敛 |
|--------|-------------|------|-------------|
| Gradient Descent | 只使用一阶导数 | 每步 $O(N)$ | 慢（线性） |
| Newton's method | 完整 Hessian | 每步 $O(N^3)$ | 快（二次） |
| L-BFGS | 从 Gradient 历史近似 Hessian | 每步 $O(N)$ | 中等（超线性） |
| Adam | 每参数自适应 rate（对角 Hessian 近似） | 每步 $O(N)$ | 中等 |
| Natural gradient | Fisher information matrix（统计 Hessian） | 每步 $O(N^2)$ | 快 |

Trong thực tế, Adam là Optimizer mặc định của Deep Learning. Nó theo dõi mỗi yếu tố của Gradient, để giảm chi phí gần như 2 giai đoạn thông tin.

### Taylor Series gần似

Bất kỳ hàm phẳng nào có thể được sử dụng nhiều phương pháp gần như:

```math
f(x + h) = f(x) + f'(x)\,h + \frac{1}{2} f''(x)\,h^2 + \frac{1}{6} f'''(x)\,h^3 + \cdots
```

包含的项越多,近似越好, nhưng chỉ ở điểm $x$附近成立──

**为什么 Taylor series 对 ML 重要：**

- **一阶 Taylor = Gradient Descent。**当你使用 $f(x + h) \approx f(x) + f'(x) h$Khi, bạn đang làm đường dẫn gần giống.$h = -\text{lr} \cdot f'(x)$

- **二阶 Taylor = Newton's method。**Sử dụng $f(x + h) \approx f(x) + f'(x) h + \frac{1}{2} f''(x) h^2$Khi, bạn có được một mô hình thứ hai.$h = -f'(x)/f''(x)$Đó là bước đi của Newton.

- **Loss Function 设计。**MSE và cross-entropy là trơn tru, có nghĩa là sự mở rộng Taylor của chúng biểu hiện tốt.

```
Approximation order    What it captures    Optimization method
-------------------    -----------------   -------------------
0th order (constant)   Just the value      Random search
1st order (linear)     Slope               Gradient descent
2nd order (quadratic)  Curvature           Newton's method
Higher orders          Finer structure     Rarely used in ML
```

关键洞见是: tất cả các tối ưu hóa dựa trên Gradient, bản chất đều là hàm mất gần như tại chỗ, và hướng tới giá trị tối thiểu của hàm gần như.

### ML Trung tâm积分

导数 nói với bạn tỷ lệ biến đổi.

Trong ML, bạn rất ít tính toán bằng tay, nhưng khái niệm này không có ở đâu cả:

**概率。**Đối với độ mật độ$p(x)$                                                                                                                                                                                                                                                              
```math
P(a < X < b) = \int_a^b p(x) \, dx
```
概率 độ 曲线 $a$和 $b$间面积,就是落在该区间内的概率──

**期望值。**按概率加权的平均结果:
```math
\mathbb{E}[f(X)] = \int f(x) \, p(x) \, dx
```
Sự mất mát dự kiến trên phân bố dữ liệu là một积分―― tập luyện tối thiểu hóa là kinh nghiệm của nó gần như――

**KL divergence。**- đo hai phân bố khác nhau:
```math
\mathrm{KL}(p \,\|\, q) = \int p(x) \log \frac{p(x)}{q(x)} \, dx
```
Sử dụng VAEs, phân giải tri thức và suy luận Bayesian.

**归一化常数。**Trong suy luận Bayesian 中:
```math
p(w \mid \text{data}) = \frac{p(\text{data} \mid w) \, p(w)}{\int p(\text{data} \mid w) \, p(w) \, dw}
```
分母 là số lượng của tất cả các giá trị tham số có thể. Nó thường là không thể xử lý, đó là lý do chúng tôi sử dụng MCMC và suy luận biến đổi, ví dụ.

| 积分概念 | 在 ML 中出现的位置 |
|-----------------|----------------------|
| 曲线下面积 | 由 density functions 得到概率 |
| 期望值 | Loss Functions、risk minimization |
| KL divergence | VAEs、policy optimization、distillation |
| 归一化 | Bayesian posteriors、softmax denominator |
| Marginal likelihood | Model comparison、evidence lower bound (ELBO) |

### Xếp tính toán Trung 中的多变量链式法则

链式法则不仅适用于一条线上的标量函数――在神经网络中,变量会分叉并合并――下面展示导数如何流过一个简单的前进传:

```mermaid
graph LR
    x["x (input)"] -->|"*w"| z1["z1 = w*x"]
    z1 -->|"+b"| z2["z2 = w*x + b"]
    z2 -->|"sigmoid"| a["a = sigmoid(z2)"]
    a -->|"loss fn"| L["L = -(y*log(a) + (1-y)*log(1-a))"]
```

Hướng ngược 会从右到左计算 Gradient:

```mermaid
graph RL
    dL["dL/dL = 1"] -->|"dL/da"| da["dL/da = -y/a + (1-y)/(1-a)"]
    da -->|"da/dz2 = a(1-a)"| dz2["dL/dz2 = dL/da * a(1-a)"]
    dz2 -->|"dz2/dw = x"| dw["dL/dw = dL/dz2 * x"]
    dz2 -->|"dz2/db = 1"| db["dL/db = dL/dz2 * 1"]
```

Mỗi mũi tên đều được nhân trên số dẫn địa phương. Tỷ lệ của bất kỳ tham số nào, là số nhân của tất cả các số dẫn địa phương trên đường dẫn từ Loss đến các tham số này. Khi đường dẫn phân chia và hợp nhất, bạn sẽ đưa phần đóng góp của các đường dẫn vào nhau.

Tất cả nội dung của backpropagation là: từ đầu ra đến nhập, hệ thống trong biểu đồ tính toán.

### Matrix Jacobian

Khi một hàm把 Vector 映射到 Vector 时(ví dụ như lớp mạng thần kinh), số dẫn của nó là một Matrix。 Jacobian 包含每个输出对每个输入的所有偏导数。

 Đối với $f: \mathbb{R}^n \to \mathbb{R}^m$, Giacobia $J$Là một $m \times n$Matrix:

| | $x_1$ | $x_2$ | ... | $x_n$ |
|---|---|---|---|---|
| $f_1$ | $\partial f_1/\partial x_1$ | $\partial f_1/\partial x_2$ | ... | $\partial f_1/\partial x_n$ |
| $f_2$ | $\partial f_2/\partial x_1$ | $\partial f_2/\partial x_2$ | ... | $\partial f_2/\partial x_n$ |
| ... | ... | ... | ... | ... |
| $f_m$ | $\partial f_m/\partial x_1$ | $\partial f_m/\partial x_2$ | ... | $\partial f_m/\partial x_n$ |

Bạn sẽ không làm việc với mạng Neural Hand-Moving Jacobian. Python sẽ xử lý nó. Nhưng biết nó tồn tại, sẽ giúp bạn hiểu hình dạng trong Backpropagation.$\mathbb{R}^n$映射到 $\mathbb{R}^m$, nó là Jacobian là $m \times n$❖ Gradient 会通过这个矩阵的转移向后流动――

### Tại sao điều này rất quan trọng đối với mạng thần kinh?

Mỗi trọng lượng trong mạng thần kinh sẽ được một Gradient.

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

Mỗi lần quyền tải:
- `W1 = W1 - lr * dL/dW1`
- `W2 = W2 - lr * dL/dW2`

Chuyển về phía trước 计算预测和 Loss── lùi qua 计算 Loss 相对于每权重的梯度──然后每权重都向下坡方向迈一小步──重复数百万步──这就是深度学习──


```figure
derivative-tangent
```

##  xây dựng nó

### 步骤 1: Từ 0 thực hiện số giá trị

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

Các định vị số và định vị phân tích đều phù hợp trên nhiều số nhỏ.

### 步骤 2: định hướng số với Gradient

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

### 步骤 3: dùng Gradient Descent  tìm f(x) = x ^ 2 của giá trị tối thiểu

```python
x = 5.0
lr = 0.1
for step in range(20):
    grad = 2 * x
    x = x - lr * grad
    print(f"step {step:2d}  x={x:8.4f}  f(x)={x**2:10.6f}")
```

Từ $x=5$ bắt đầu, mỗi bước sẽ gần hơn $x=0$(đối thiểu giá trị)

### 步骤 4: thực hiện Gradient Descent trên hàm 2D

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

### Bước 5: So sánh số lượng và phân tích số lượng

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

### 步骤 6: số giá trị tính toán Hessian

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

saddle  hàm của Hessian có eigenvalues 2 和 -2(符号混合, xác nhận là điểm saddle)。 bowl  hàm có eigenvalues 2 和 2(均为正, xác nhận là tối thiểu)。

### 步骤 7:Taylor gần似的实际效果

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

Trong $x_0=0$附近,$\sin(x) \approx x$(一阶泰勒) ✿对于很小的$h$, gần như rất tốt; nhưng đối với lớn hơn $h$, nó sẽ không hiệu quả. Đó là lý do tại sao Gradient Descent ở tỷ lệ học tập nhỏ:

### Bước 8: Tại sao điều này rất quan trọng đối với mạng thần kinh

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

Mỗi vòng tập dựa trên Gradient đều theo mô hình này: dự đoán, tính Loss, tính Gradient, tính quyền tải mới.

## Sử dụng nó

Sử dụng NumPy 时, tương tự hoạt động sẽ nhanh hơn, đơn giản hơn:

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

Bạn刚刚从零构建 Gradient Descent──PyTorch 会 tự động hoàn thành Gradient 计算, nhưng vòng lặp mới là hoàn toàn giống như vậy──

## 练习

1. Sử dụng调用两次 `numerical_derivative`Cách thực hiện`numerical_second_derivative(f, x)`❖ 验证$x^3$Trong $x=2$Số thứ hai của 处 là 12 ⋅
2. 使用 Gradient Descent 找到 $f(x, y) = (x - 3)^2 + (y + 1)^2$≈ ≈ ≈ ≈ ≈ ≈ ≈$(0, 0)$开始──答案应收到 $(3, -1)$
3. Trong vòng tròn giảm cấp độ gia nhập động lực:维护一个会累积过去$f(x) = x^4 - 3x^2$Tăng tốc độ nhận động lực

### 提示

**练习 1。**定义一个返回 `numerical_derivative(f, x)`của phụ trợ hàm, tái đưa nó truyền cho `numerical_derivative` Nếu kết quả tiếng ồn lớn hơn, hai lần điều chỉnh đều sử dụng bước dài lớn hơn, ví dụ:`h=1e-4`; trong $x=2$Kết quả của việc làm nên gần 12

**练习 2。**写出梯度 $(2(x - 3), 2(y + 1))$, hoặc sử dụng `numerical_gradient`, từ$(0, 0)$ bắt đầu调用 `gradient_descent_nd`❖ Mỗi 10 bước in một lần 坐标; nó phải hướng tới $(3, -1)$ di chuyển, mất mát phải giảm xuống gần 0:

**练习 3。**保存速度 `v`,按 `v = momentum * v - lr * grad`更新,再将 `v`Chuyện này`x`上── 2 phương pháp thống kê cần nhiều bước để làm cho độ gần với 0; giá trị tối thiểu nằm ở $x = \pm\sqrt{1.5} \approx \pm 1.225$

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

- [3Blue1Brown: Essence of Calculus](https://www.3blue1brown.com/topics/calculus)- Về định lượng,积分 và quy tắc chuỗi trực quan
- [Stanford CS231n: Backpropagation](https://cs231n.github.io/optimization-2/)- Gradient 如何流过神经网络层
