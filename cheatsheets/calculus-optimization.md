---
id: calculus-optimization
title: Calculus, Gradients and Convex Optimization
code: CG
subtitle: 导数、自动微分、梯度下降、动量、Adam、牛顿法与凸性检验。从零实现的 Python 与 PyTorch。
hue: 30
sources: phases/01-math-foundations/04-calculus-for-ml, phases/01-math-foundations/05-chain-rule-and-autodiff, phases/01-math-foundations/08-optimization, phases/01-math-foundations/18-convex-optimization
source_hash: e8999348285411d1
---

## 单个神经元的前向与反向传播
type: architecture
from: phases/01-math-foundations/04-calculus-for-ml/docs/en.md

```arch
node | x | 1,1 | x | input
node | z1 | 2,1 | z1 = w*x | multiply
node | z2 | 3,1 | z2 = w*x + b | add bias
node | a | 4,1 | a = sigmoid(z2) | activation
node | dw | 1,2 | dL/dw | dL/dz2 * x
node | db | 2,2 | dL/db | dL/dz2 * 1
node | dz2 | 3,2 | dL/dz2 | dL/da * a(1-a)
node | loss | 4,2 | L | cross-entropy loss
edge | x | z1 | *w
edge | z1 | z2 | +b
edge | z2 | a |
edge | a | loss |
edge | loss | dz2 | backward
edge | dz2 | dw | x
edge | dz2 | db | 1
```

## Value.backward 中的反向模式自动微分
type: flow
from: phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md, phases/01-math-foundations/05-chain-rule-and-autodiff/code/autodiff.py

1. **记录**：每个运算都生成一个新的 `Value`，带有它的子节点和一个 `_backward` 闭包。
2. **排序**：`build_topo` 把每个节点排在它所依赖的节点之后。
3. **起点**：在输出上设置 `self.grad = 1.0`。这就是 dy/dy = 1。
4. **反向遍历**：按逆拓扑顺序对每个节点调用 `v._backward()`。
5. **累加**：每个闭包用 `+=` 加到 `.grad` 上。被使用两次的值得到的是两者之和。
6. **清零**：在下一次 `loss.backward()` 之前，为每个参数设置 `p.grad = 0.0`。
7. **更新**：对每个参数执行 `p.data -= lr * p.grad`。

## 代码中的任务
type: task-table
from: phases/01-math-foundations/04-calculus-for-ml/code/derivatives.py, phases/01-math-foundations/05-chain-rule-and-autodiff/code/autodiff.py, phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md, phases/01-math-foundations/08-optimization/code/optimizers.py, phases/01-math-foundations/18-convex-optimization/code/convex.py

| 任务 | 代码 |
|---|---|
| 中心差分 | `numerical_derivative(f, x, h=1e-7)` |
| 多输入的梯度 | `numerical_gradient(f, point, h=1e-7)` |
| f(x, y) 的 Hessian | `hessian_2d(f, x, y, h=1e-5)` |
| 检查自动微分梯度 | `gradient_check(build_expr, x_val, h=1e-7)` |
| XOR 网络，4 个隐藏单元 | `model = MLP([2, 4, 1])` |
| 运行优化器 | `optimize(optimizer, func, grad_func, start)` |
| 通过采样检验凸性 | `check_convexity(f, dim)` |
| 2D 牛顿迭代 | `newtons_method(grad_f, hessian_f, x0)` |

## 从零实现的优化器
type: annotated-code
lang: python
from: phases/01-math-foundations/08-optimization/docs/en.md, phases/01-math-foundations/08-optimization/code/optimizers.py

```python
GradientDescent(lr=0.001)  # w = w - lr * gradient
SGDMomentum(lr=0.001, momentum=0.9)  # v = beta * v + gradient
Adam(lr=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8)  # two moments per weight
m_hat = [m / (1 - self.beta1 ** self.t) for m in self.m]  # bias correction
p - self.lr * mh / (vh ** 0.5 + self.epsilon)  # per-weight step size
adam_history = optimize(Adam(lr=0.01), rosenbrock, rosenbrock_gradient, start)
```

## PyTorch 中的 autograd 与优化器
type: annotated-code
lang: python
from: phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md, phases/01-math-foundations/08-optimization/docs/en.md

```python
x = torch.tensor(2.0, requires_grad=True)
y = x ** 2 + 3 * x + 1
y.backward()  # reverse mode through the recorded graph
print(x.grad)  # 7.0 = 2*x + 3
sgd = torch.optim.SGD(model.parameters(), lr=0.01, momentum=0.9)
adam = torch.optim.Adam(model.parameters(), lr=0.001)
adamw = torch.optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(adam, T_max=100)
```

## 关键公式
type: concepts
from: phases/01-math-foundations/04-calculus-for-ml/docs/en.md, phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md, phases/01-math-foundations/08-optimization/docs/en.md, phases/01-math-foundations/18-convex-optimization/docs/en.md

- **中心差分**：$f'(x) \approx \frac{f(x + h) - f(x - h)}{2h}$。
- **链式法则**：$\frac{dy}{dx} = f'(g(x)) \cdot g'(x)$。计算图分叉处对各条路径求和。
- **梯度下降**：$w = w - \text{lr} \cdot \text{gradient}$。
- **动量**：$v = \beta \cdot v + \text{gradient}$，然后 $w = w - \text{lr} \cdot v$。
- **Adam**：$w = w - \text{lr} \cdot \hat{m} / (\sqrt{\hat{v}} + \epsilon)$，矩估计经过偏差修正。
- **牛顿法**：$x_{\text{new}} = x - H^{-1} \cdot \text{gradient}$。
- **凸**：对 $t \in [0, 1]$，$f(tx + (1-t)y) \le t f(x) + (1-t) f(y)$。
- **拉格朗日函数**：$L(x, \lambda) = f(x) + \lambda g(x)$。令其梯度为零。

## 需要掌握的导数
type: command-table
from: phases/01-math-foundations/04-calculus-for-ml/docs/en.md, phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md

| 命令 | 作用 |
|---|---|
| x^2 | 2x。MSE 损失 |
| wx + b | 对 w 为 x，对 b 为 1，对 x 为 w。线性层 |
| e^x | e^x。Softmax、注意力 |
| ln(x) | 1/x。交叉熵损失 |
| sigmoid | f(x)(1-f(x))。Sigmoid 激活 |
| tanh | 1 - tanh^2。经典激活函数 |
| x^n | n x^(n-1)。`__pow__` 用到它 |
| sin(x^2) | cos(x^2) * 2x。链式法则示例 |

## 选择方法
type: command-table
from: phases/01-math-foundations/04-calculus-for-ml/docs/en.md, phases/01-math-foundations/08-optimization/docs/en.md, phases/01-math-foundations/18-convex-optimization/docs/en.md

| 命令 | 作用 |
|---|---|
| 梯度下降 | 一阶导数。O(n) 内存。基线 |
| 带动量的 SGD | 调参更多，最终准确率最好 |
| Adam | 由梯度矩估计得到对角曲率。深度学习默认选择 |
| AdamW | 权重衰减解耦的 Adam。Transformer |
| 牛顿法 | 完整 Hessian。每步 O(n^3)。小规模凸问题 |
| L-BFGS | 最近 m 个梯度差。中等规模凸问题 |
| K-FAC | Kronecker 分解的 Fisher。大 batch 训练 |

## 数字与默认值
type: defaults
from: phases/01-math-foundations/04-calculus-for-ml/code/derivatives.py, phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md, phases/01-math-foundations/08-optimization/docs/en.md, phases/01-math-foundations/08-optimization/code/optimizers.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| Adam `lr` | 0.001 | 大多数问题从这里开始 |
| Adam `beta2` | 0.999 | `beta1` 为 0.9。矩的衰减率 |
| Adam `epsilon` | 1e-8 | 防止除以零 |
| SGD 动量 `lr` | 0.01 | 配合动量 0.9 |
| AdamW `weight_decay` | 0.01 | 与梯度步解耦 |
| Mini-batch 大小 | 32-256 | 梯度估计较好，噪声适中 |
| 有限差分 `h` | 1e-7 | 在 `numerical_derivative` 中 |
| 梯度检查差值 | < 1e-5 | 自动微分对比数值梯度 |

## 故障排查
type: troubleshooting
from: phases/01-math-foundations/04-calculus-for-ml/docs/en.md, phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md, phases/01-math-foundations/08-optimization/docs/en.md, phases/01-math-foundations/18-convex-optimization/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 损失增大或变成 nan | 学习率过大 | 降低学习率 |
| 训练太慢 | 学习率过小 | 调大学习率，加上调度 |
| 在狭窄山谷中来回震荡 | Hessian 条件数高 | 加动量，或使用牛顿法 |
| 梯度接近 0，没有进展 | 鞍点 | 动量与 mini-batch 噪声 |
| 梯度每步都在变大 | `.grad` 用 `+=` 累加 | 在 `backward` 之前设置 `p.grad = 0.0` |
| 自动微分与数值结果不一致 | 某条 `_backward` 规则有 bug | 运行 `gradient_check` |
| 二阶导数噪声大 | 步长 h 太小 | 两次调用都使用 `h=1e-4` |
| 大模型用牛顿法代价过高 | O(n^2) 内存，O(n^3) 求逆 | 使用 L-BFGS 或 Adam |

## 问答
type: qa
from: phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md, phases/01-math-foundations/18-convex-optimization/docs/en.md

- **为什么神经网络用反向模式？** 输入很多、损失只有一个。一次反向传播就能得到所有梯度。
- **如何检验凸性？** 1D 时 f'' >= 0。多维时 Hessian 半正定。
- **为什么 SGD 在非凸损失上也有效？** 大多数临界点是鞍点。大多数极小值都不错。
- **为什么 L1 会产生稀疏权重？** 菱形的角落在坐标轴上。
- **什么是互补松弛？** $\lambda_i \, g_i(x) = 0$。支持向量满足 $\lambda > 0$。

## 提示
type: tips
from: phases/01-math-foundations/04-calculus-for-ml/docs/en.md, phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md, phases/01-math-foundations/08-optimization/docs/en.md, phases/01-math-foundations/18-convex-optimization/docs/en.md

- 训练超过几个 epoch 时使用学习率调度。
- 余弦退火加 warmup 适合 Transformer 和大模型。
- 牛顿法一步就能解出二次函数。
- 梯度检查每个参数需要 2 次前向传播。不要在生产训练中运行。
- 临界点处 Hessian 特征值有正有负，说明是鞍点。
- 平坦的极小值比尖锐的极小值泛化更好。
