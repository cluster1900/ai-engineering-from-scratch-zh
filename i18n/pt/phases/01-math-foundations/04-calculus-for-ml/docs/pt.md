# Aprendizagem automática 微积分

> 导数会告诉你哪边是下坡──这是神经网络学习所需的一切──

**Type:** Learn
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-03
**Time:** ~60 minutes

## Objectivo de aprendizagem

- 计算常见 ML 函数($x^2$、sigmoide、cross-entropy) de valores e de solução
- Desde zero para realizar Descenso Gradiente, em 1D e 2D Minimizar a Função de Perda
- 推导 linear regressão 模型的渐变,并通过手动更新权重来训练它
- Explicar a Matriz Hessiana, a série Taylor, e a sua ligação com os métodos de otimização

## 问题

Você tem uma rede neural que contém milhões de pesos. Cada pesos é um giro. Você precisa descobrir em que direção cada giro deve virar para fazer com que o modelo erra um pouco mais.

Sem mínimos, treinando a rede neural significa experimentar variadas mudanças, depois esperar boa sorte. Com um número de direções, você pode saber com certeza como cada peso afeta o erro.

## 概念

### O que é um número?

导数衡变化率──对函数 $y = f(x)$,导数 $f'(x)$Eu vou dizer-te: se tu...$x$- Não, não.$y$- Vai mudar?

De forma geometrica, o número de direção é a inclinação de um ponto na linha.

**$f(x) = x^2$：**

| $x$ | $f(x)$ | $f'(x)$（斜率） |
|---|------|---------------|
| 0 | 0    | 0（平坦，在底部） |
| 1 | 1    | 2 |
| 2 | 4    | 4（该点处切线的斜率） |
| 3 | 9    | 6 |

Em$x=2$时, a inclinância é 4... se você o fazer.$x$Para a direita move muito pequeno,$y$Mas, por isso, a mudança é 4 vezes maior.$x=0$时, inclinar é 0... você está no fundo da taça...

 формально определение:

```math
f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}
```

Em código, você vai saltar o limite, usando um muito pequeno.$h$. É o número de valores.

### 偏导数: uma vez só olha para uma variação

A perda da rede neural depende de milhares de milhões de pesos. O número de parâmetros mantém todas as variações imutáveis além de uma variação, e então procura orientação para essa variação.

```math
\begin{aligned}
f(x, y) &= x^2 + 3xy + y^2 \\[4pt]
\frac{\partial f}{\partial x} &= 2x + 3y \quad \text{（将 } y \text{ 视为常量）} \\
\frac{\partial f}{\partial y} &= 3x + 2y \quad \text{（将 } x \text{ 视为常量）}
\end{aligned}
```

Cada número de parábolas respondeu: se eu apenas diminuir esse peso, como a perda mudaria?

### Gradiente: todos os vectores de configuração de

Gradiente irá reunir cada um dos parâmetros em um vetor.$f(x, y, z)$, Gradiente é:

```math
\nabla f = \left[ \frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}, \frac{\partial f}{\partial z} \right]
```

Gradiente indica a direção de maior elevação.

**$f(x,y) = x^2 + y^2$ 的等高线图：**

Esta função forma um bowl-form curva, igual à linha alta é com o centro do círculo.

| 点 | $\nabla f$ | $-\nabla f$（下降方向） |
|-------|--------|----------------------------|
| (1, 1) | [2, 2]（指向上坡，远离最小值） | [-2, -2]（指向下坡，朝向最小值） |
| (0, 0) | [0, 0]（平坦，在最小值处） | [0, 0] |

É o descendo gradual do gráfico.

### Relação com a otimização

Treinamento da Rede Neural é otimizar.$L(w_1, w_2, \ldots, w_n)$É um modelo de medição com muitos erros.

```
Gradient descent update rule:

  w_new = w_old - learning_rate * dL/dw

For every weight:
  1. Compute the partial derivative of loss with respect to that weight
  2. Subtract a small multiple of it from the weight
  3. Repeat
```

Taxa de aprendizagem  controlar o progresso ∞ muito grande vai superar o objetivo ∞ muito pequeno vai subir muito lentamente ∞

**Loss landscape（1D 切片）：**

Função de perda $L(w)$Com o peso$w$A mudança forma uma curva de um pico de um vale.

| 特征 | 描述 |
|---------|-------------|
| Global minimum | 整条曲线上的最低点，即最佳解 |
| Local minimum | 比邻近位置更低、但不是整体最低点的谷 |
| Slope | Gradient Descent 会从任意起点沿斜率向下走 |

A descida gradual irá se prolongar em direção ao descenso da inclinância. Pode ser um problema local, mas em um espaço elevado, isso é muito raro.

### Número de valores em relação a números de resolução

Há duas formas de calcular os números.

解析方式: 手动应用微积分规则──对 $f(x) = x^2$,导数是 $f'(x) = 2x$❖ É preciso, rápido.

Numero de valor: usar a definição para fazer aproximação.$h$计算 $f(x+h)$和 $f(x-h)$E depois, faz diferença.

```
Numerical (central difference):

f'(x) ~= f(x + h) - f(x - h)
          -----------------------
                  2h

h = 0.0001 works well in practice
```

O número de direções de valores é mais lento, mas é aplicável a qualquer função.

### Manual de execução

Estes são os números que você vai ver repetidamente no ML.

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

Para o$f(x) = x^2$- Não .

```
f(x) = x^2    f'(x) = 2x

  x    f(x)   f'(x)   meaning
  -2    4      -4      slope tilts left (decreasing)
  -1    1      -2      slope tilts left (decreasing)
   0    0       0      flat (minimum!)
   1    1       2      slope tilts right (increasing)
   2    4       4      slope tilts right (increasing)
```

Para o$f(w) = wx + b$, e$x=3$- Não.$b=1$- Não .

```
f(w) = 3w + 1    f'(w) = 3

The derivative with respect to w is just x.
If x is big, a small change in w causes a big change in output.
```

### 链式法则

Quando as funções se juntam, a lei da cadeia diz-lhe como procurar orientação.

```
If y = f(g(x)), then dy/dx = f'(g(x)) * g'(x)

Example: y = (3x + 1)^2
  outer: f(u) = u^2       f'(u) = 2u
  inner: g(x) = 3x + 1    g'(x) = 3
  dy/dx = 2(3x + 1) * 3 = 6(3x + 1)
```

Rede Neural é uma série de funções: input -> linear -> ativação -> linear -> ativação -> perda。Backpropagation é do output ao input反复应用链式法则── é o algoritmo inteiro──

### Matriz Hessiana

Gradiente 告诉你斜率──Hessian 告诉你曲率──

Hessian é a matriz de componentes de um segundo grau de orientação.$f(x_1, x_2, \ldots, x_n)$, Hessian de $(i, j)$项是:

```math
H_{ij} = \frac{\partial^2 f}{\partial x_i \, \partial x_j}
```

对于二变量函数 $f(x, y)$- Não .

```math
H = \begin{bmatrix} \dfrac{\partial^2 f}{\partial x^2} & \dfrac{\partial^2 f}{\partial x \, \partial y} \\[8pt] \dfrac{\partial^2 f}{\partial y \, \partial x} & \dfrac{\partial^2 f}{\partial y^2} \end{bmatrix}
```

**Hessian 在临界点（Gradient = 0 的地方）告诉你什么：**

| Hessian 性质 | 含义 | 示例曲面 |
|-----------------|---------|-----------------|
| 正定（所有 eigenvalues > 0） | Local minimum | 向上开口的碗 |
| 负定（所有 eigenvalues < 0） | Local maximum | 向下开口的碗 |
| 不定（eigenvalues 正负混合） | Saddle point | 马鞍形 |

**示例：** $f(x, y) = x^2 - y^2$(uma função de sela)

```
df/dx = 2x       df/dy = -2y
d^2f/dx^2 = 2    d^2f/dy^2 = -2    d^2f/dxdy = 0

H = | 2   0 |
    | 0  -2 |

Eigenvalues: 2 and -2 (one positive, one negative)
--> Saddle point at (0, 0)
```

Com$f(x, y) = x^2 + y^2$(一个碗形函数) (um quadro de função)

```
H = | 2  0 |
    | 0  2 |

Eigenvalues: 2 and 2 (both positive)
--> Local minimum at (0, 0)
```

**为什么 Hessian 在 ML 中重要：**

O método de Newton utiliza Hessian para tomar a descida gradiente melhor melhor optimization. Não é apenas a seguir a curva de curva, também considera a curva:

```math
\begin{aligned}
\text{牛顿法更新：} \quad & w_{\text{new}} = w_{\text{old}} - H^{-1} \cdot \text{梯度} \\
\text{梯度下降：} \quad & w_{\text{new}} = w_{\text{old}} - \text{lr} \cdot \text{梯度}
\end{aligned}
```

O método de Newton 收更快, porque Hessian 会重新缩放Gradiente: 方向的步子更小,平坦方向的步子更大──

O problema é:$N$个参数的 Neural Network, Hessian é $N \times N$Um modelo com um milhão de parâmetros precisa de uma matriz com 1 bilhão de elementos. É por isso que usamos métodos de aproximação.

| 方法 | 使用什么 | 成本 | 收敛 |
|--------|-------------|------|-------------|
| Gradient Descent | 只使用一阶导数 | 每步 $O(N)$ | 慢（线性） |
| Newton's method | 完整 Hessian | 每步 $O(N^3)$ | 快（二次） |
| L-BFGS | 从 Gradient 历史近似 Hessian | 每步 $O(N)$ | 中等（超线性） |
| Adam | 每参数自适应 rate（对角 Hessian 近似） | 每步 $O(N)$ | 中等 |
| Natural gradient | Fisher information matrix（统计 Hessian） | 每步 $O(N^2)$ | 快 |

Na prática, Adam é o Optimizador padrão do Deep Learning.

### Série Taylor 近似

Qualquer função plana pode ser localmente usada em vários métodos de aproximação:

```math
f(x + h) = f(x) + f'(x)\,h + \frac{1}{2} f''(x)\,h^2 + \frac{1}{6} f'''(x)\,h^3 + \cdots
```

Conteremos mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais mais, mais, mais, mais mais, mais, mais, mais mais, mais, mais mais, mais mais, mais mais, mais mais, mais, mais mais, mais mais, mais mais, mais, mais mais, mais mais, mais mais, mais mais, mais, mais mais, mais mais, mais mais, mais, mais, mais, mais mais, mais, mais, mais, mais mais, mais, mais, mais, mais, mais, mais, mais, mais mais, mais, mais, mais, mais, mais mais, mais, mais mais mais mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais mais mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais, mais,$x$附近成立──

**为什么 Taylor series 对 ML 重要：**

- **一阶 Taylor = Gradient Descent。**Quando você usa$f(x + h) \approx f(x) + f'(x) h$Quando você está fazendo uma aproximação linear.$h = -\text{lr} \cdot f'(x)$- Não.

- **二阶 Taylor = Newton's method。**Utilização $f(x + h) \approx f(x) + f'(x) h + \frac{1}{2} f''(x) h^2$Quando, você obtém um segundo modelo... Minimizar que vai obter.$h = -f'(x)/f''(x)$É o passo de Newton.

- **Loss Function 设计。**MSE e entropia cruzada são planejadas, o que significa que as expansões de Taylor deles se manifestam bem. Não é coincidência.

```
Approximation order    What it captures    Optimization method
-------------------    -----------------   -------------------
0th order (constant)   Just the value      Random search
1st order (linear)     Slope               Gradient descent
2nd order (quadratic)  Curvature           Newton's method
Higher orders          Finer structure     Rarely used in ML
```

关键洞见是: todas as optimizações baseadas em gradiente, em essência, são em local, a função de perda aproximada, e em direção ao valor mínimo da função aproximada.

### ML 中的积分

导数告诉你变化率──积分计算累积量,也就是曲线下面积──

No ML, você tem poucas maneiras de calcular, mas esse conceito está presente:

**概率。** para a densidade $p(x)$O que é que se passa?
```math
P(a < X < b) = \int_a^b p(x) \, dx
```
概率 densidade curva em $a$和 $b$间面积,就是落在该区间内的概率──

**期望值。**按概率加权的平均结果:
```math
\mathbb{E}[f(X)] = \int f(x) \, p(x) \, dx
```
A perda esperada na distribuição de dados é um积分―― o treino minimizado é a sua experiência aproximada―.

**KL divergence。**∆ Medir duas distribuições diferentes:
```math
\mathrm{KL}(p \,\|\, q) = \int p(x) \log \frac{p(x)}{q(x)} \, dx
```
Utilizando VAEs, destilação do conhecimento e inferência Bayesiana.

**归一化常数。**Em inferência Bayesiana
```math
p(w \mid \text{data}) = \frac{p(\text{data} \mid w) \, p(w)}{\int p(\text{data} \mid w) \, p(w) \, dw}
```
A divisão é o ponto de todos os valores dos parâmetros possíveis. É geralmente indisponível, e é por isso que usamos o método MCMC e inferência variável, etc.

| 积分概念 | 在 ML 中出现的位置 |
|-----------------|----------------------|
| 曲线下面积 | 由 density functions 得到概率 |
| 期望值 | Loss Functions、risk minimization |
| KL divergence | VAEs、policy optimization、distillation |
| 归一化 | Bayesian posteriors、softmax denominator |
| Marginal likelihood | Model comparison、evidence lower bound (ELBO) |

### Grafico de computação 中的多变量链式法则

A lei de cadeia não se aplica apenas a funções de quantidade de um conjunto de linhas. Em rede neural, a variação pode ser dividida e combinada.

```mermaid
graph LR
    x["x (input)"] -->|"*w"| z1["z1 = w*x"]
    z1 -->|"+b"| z2["z2 = w*x + b"]
    z2 -->|"sigmoid"| a["a = sigmoid(z2)"]
    a -->|"loss fn"| L["L = -(y*log(a) + (1-y)*log(1-a))"]
```

Passagem para trás 会从右到左计算 Gradiente:

```mermaid
graph RL
    dL["dL/dL = 1"] -->|"dL/da"| da["dL/da = -y/a + (1-y)/(1-a)"]
    da -->|"da/dz2 = a(1-a)"| dz2["dL/dz2 = dL/da * a(1-a)"]
    dz2 -->|"dz2/dw = x"| dw["dL/dw = dL/dz2 * x"]
    dz2 -->|"dz2/db = 1"| db["dL/db = dL/dz2 * 1"]
```

Cada arco-íris multiplica-se em direção local. Gradiente de qualquer parâmetro, é a multiplicação de todas as direções locais de um caminho para outro. Quando o caminho se divide e se combina, você vai adicionar a contribuição de cada caminho.

Todo o conteúdo da backpropagation é: de saída a entrada, sistematicamente aplicado em gráfico de computação.

### Matriz Jacobiana

Quando uma função traz um vector 映射到 vector 时(por exemplo, a camada de rede neural), seu número de direções é uma matriz。 Jacobian 包含每个输出对每个输入的所有偏导数。

Para o$f: \mathbb{R}^n \to \mathbb{R}^m$Jacobiano.$J$É um .$m \times n$Matrix:

| | $x_1$ | $x_2$ | ... | $x_n$ |
|---|---|---|---|---|
| $f_1$ | $\partial f_1/\partial x_1$ | $\partial f_1/\partial x_2$ | ... | $\partial f_1/\partial x_n$ |
| $f_2$ | $\partial f_2/\partial x_1$ | $\partial f_2/\partial x_2$ | ... | $\partial f_2/\partial x_n$ |
| ... | ... | ... | ... | ... |
| $f_m$ | $\partial f_m/\partial x_1$ | $\partial f_m/\partial x_2$ | ... | $\partial f_m/\partial x_n$ |

Não vais fazer cálculos Jacobianos para a Rede Neural. Mas saber que existe ajuda a entender a forma da Backpropagation.$\mathbb{R}^n$映射到 $\mathbb{R}^m$É Jacobiano.$m \times n$❖ Gradiente irá passar por esta Matriz de Transposição para Pós-Reguimento ❖

### Por que é importante para a rede neural ?

Cada peso na rede neural vai ter um gradiente. O gradiente vai dizer-lhe como ajustar esse peso para reduzir a perda.

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

Cada vez mais:
- `W1 = W1 - lr * dL/dW1`
- `W2 = W2 - lr * dL/dW2`

Passar para frente 计算预测和 Loss──pass para trás 计算 Loss  相对每权重的格里亚因──然后每权重都向下坡方向迈一小步──重复数百万步──这就是深度学习──


```figure
derivative-tangent
```

## Construí-lo

### 步骤 1: desde zero realizar um número de valores

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

Os valores de referência e os valores de análise correspondem a um número muito pequeno.

### 步骤 2: Orientação e Gradiente

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

### 步骤 3: Usando Descenso Gradiente 找到 f(x) = x^2 的最小值

```python
x = 5.0
lr = 0.1
for step in range(20):
    grad = 2 * x
    x = x - lr * grad
    print(f"step {step:2d}  x={x:8.4f}  f(x)={x**2:10.6f}")
```

De$x=5$Começa, cada passo vai ser mais próximo.$x=0$(mínimo valor)

### 步骤 4: Execução de Descenso Gradiente em função 2D

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

### 步骤 5: Comparar os valores-chave e os valores-chave

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

### 步骤 6: Número de valores de cálculo Hessian

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

Saddle  Função de Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian  Hessian

### 步骤 7:Taylor 近似的实际效果

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

Em$x_0=0$ perto,$\sin(x) \approx x$(Ista fase Taylor) ― Para muito pequeno $h$, esta aproximação parece muito boa; mas para maior $h$É por isso que a descida gradual em taxas de aprendizagem menores, os melhores resultados: cada passo é assumido como linear quase que preciso.

### Passo 8: Por que isso é importante para a rede neural

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

Cada ciclo de treinamento baseado em gradiente segue este modelo: pré-determinar, calcular, perder, calcular, aumentar o peso.

## Use-o

Usando NumPy 时, assim como operação será mais rápido ‧ mais simples:

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

Você acabou de construir o Descenso Gradiente. O PyTorch irá completar automaticamente o cálculo do Gradiente, mas o ciclo de atualização é o mesmo.

## 练习

1. Utilize调用两次 `numerical_derivative`Como realizar`numerical_second_derivative(f, x)`❖ O teste $x^3$Em$x=2$O número de dois estágios é 12.
2. 使用 Gradient Descent 找到 $f(x, y) = (x - 3)^2 + (y + 1)^2$O valor mínimo é de:$(0, 0)$開始──答案应收到 $(3, -1)$- Não.
3. Em um ciclo de descida gradiente, adicione o momento:$f(x) = x^4 - 3x^2$A velocidade de recepção é relativamente baixa.

### 提示

**练习 1。**Definir um regresso`numerical_derivative(f, x)`de função auxiliar, re-transmitir-lhe.`numerical_derivative` Se o resultado for maior, duas vezes os dois tipos de ruído são utilizados em grandes intervalos, por exemplo `h=1e-4`• em$x=2$Os resultados devem aproximar-se de 12

**练习 2。**- Escrever a escala.$(2(x - 3), 2(y + 1))$, ou utilizar `numerical_gradient`, de$(0, 0)$Começou a ser usado`gradient_descent_nd`❖ Imprimir uma placa a cada 10 passos; deve ser dirigida$(3, -1)$Movimento, perda deve diminuir para quase 0:

**练习 3。**保存速度 `v`, por`v = momentum * v - lr * grad`更新,再将 `v`- Não .`x`上── Os dois métodos de estatística precisam de vários passos para aproximar a gradiência de 0, o valor mínimo está localizado.$x = \pm\sqrt{1.5} \approx \pm 1.225$- Não.

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

- [3Blue1Brown: Essence of Calculus](https://www.3blue1brown.com/topics/calculus)-  sobre o número de direções  积分 e lei da cadeia
- [Stanford CS231n: Backpropagation](https://cs231n.github.io/optimization-2/)- Gradiente  como fluir através da camada da rede neural
