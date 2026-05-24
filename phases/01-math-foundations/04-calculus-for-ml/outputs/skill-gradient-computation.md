---
name: skill-gradient-computation
description: 计算常见 ML Loss functions 的 Gradient，并选择合适的求导方法
version: 1.0.0
phase: 1
lesson: 4
tags: [calculus, gradients, backpropagation]
---

# 面向 ML 的 Gradient 计算

用于计算 Neural Network 中 Loss functions、activation functions 和 layer operations 的 Gradient 的实用参考。

## 决策检查清单

1. 函数是否由简单原语（power、exp、log、trig）组成？使用解析导数和 chain rule。
2. 函数是否是自定义或 black-box operation？使用数值微分：`(f(x+h) - f(x-h)) / (2h)`，其中 h = 1e-7。
3. 函数是否由 PyTorch/JAX 中的 tensor operations 构建？交给 autograd 处理。用数值检查来验证。
4. 你是否需要标量 Loss 相对于 weight Matrix 的 Gradient？沿 computation graph 逐个 node 应用 chain rule。
5. 是否存在不可微 operation（argmax、rounding、sampling）？使用 straight-through estimator 或 reparameterization trick。

## 何时使用每种方法

| 方法 | 何时使用 | 成本 |
|---|---|---|
| Analytical（手动推导） | 简单函数、验证 autograd 输出 | 运行时免费 |
| Numerical（finite differences） | 调试、Gradient checking、black-box functions | 对 n 个参数需要 2n 次 forward passes |
| Automatic differentiation | 任何可微 computation graph（默认选择） | 一次 backward pass |
| Symbolic（SymPy, Mathematica） | 为论文推导 closed-form Gradients | 仅 compile time |

## 快速参考：常见导数

| Function | f(x) | f'(x) | ML context |
|---|---|---|---|
| MSE loss | (1/n) sum(y_hat - y)^2 | (2/n)(y_hat - y) | Regression |
| Cross-entropy (binary) | -(y log(p) + (1-y) log(1-p)) | p - y (after sigmoid) | Binary classification |
| Cross-entropy (multi) | -log(p_true_class) | p - one_hot(y) (after softmax) | Multi-class classification |
| Sigmoid | 1 / (1 + e^(-x)) | sigma(x) * (1 - sigma(x)) | Output gates, binary output |
| Tanh | (e^x - e^(-x)) / (e^x + e^(-x)) | 1 - tanh(x)^2 | Hidden activations（legacy） |
| ReLU | max(0, x) | 1 if x > 0, 0 if x < 0 | 默认 hidden activation |
| Leaky ReLU | max(0.01x, x) | 1 if x > 0, 0.01 if x < 0 | 避免 dead neurons |
| GELU | x * Phi(x) | Phi(x) + x * phi(x) | Transformers |
| Softmax_i | e^(x_i) / sum(e^(x_j)) | s_i(1 - s_i) for i=j, -s_i*s_j for i!=j | Output layer（Jacobian） |
| Log-softmax | x_i - log(sum(e^(x_j))) | 1 - softmax(x_i) for the i-th entry | 数值稳定的 CE |
| Linear layer | y = Wx + b | dL/dW = dL/dy * x^T, dL/db = dL/dy | 每一层 |
| L2 regularization | lambda * sum(w^2) | 2 * lambda * w | Weight decay |
| L1 regularization | lambda * sum(\|w\|) | lambda * sign(w) | Sparsity |

## 常见错误

- 忘记 batch-averaged losses（MSE、cross-entropy）中的 1/n 因子。Gradient 会按 batch size 缩放。
- 将 softmax Gradient 当作 Vector 计算，而它实际上是 Jacobian Matrix。对于 cross-entropy + softmax 的组合，Gradient 会简化为 (p - y)，从而避免完整 Jacobian。
- 以错误顺序应用 chain rule。从 Loss 反向推导：dL/dW = dL/dy * dy/dW。
- 对数值导数使用过大（h = 0.1）或过小（h = 1e-15）的 h。float64 下坚持使用 h = 1e-7。
- 忘记 ReLU 在 x = 0 时 Gradient 未定义。实践中，将其设为 0 或 0.5。

## Gradient checking 配方

```
For each parameter w:
  numeric_grad = (loss(w + h) - loss(w - h)) / (2h)
  auto_grad = backward pass value
  relative_error = |numeric - auto| / max(|numeric|, |auto|, 1e-8)
  assert relative_error < 1e-5
```

Relative error 高于 1e-3 表示有问题。介于 1e-5 和 1e-3 之间时，需要调查。
