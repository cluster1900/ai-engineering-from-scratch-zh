---
name: skill-convexity-checker
description: 判断一个优化问题是否为凸问题，并选择合适的 solver
version: 1.0.0
phase: 1
lesson: 18
tags: [optimization, convexity, solvers]
---

# 凸性检查器

如何验证一个优化问题是否为凸问题，以及如何根据结果采取行动。

## 决策检查清单

1. 目标函数是凸的吗？（检查 Hessian 是否为 positive semi-definite，或使用组合规则。）
2. 所有不等式约束是否都是 g_i(x) <= 0 的形式，并且每个 g_i 都是凸函数？
3. 所有等式约束是否都是 affine（linear）？
4. 如果三项都为 yes，则问题是凸的。使用带有收敛保证的 convex solver。
5. 如果任意一项为 no，则问题是 non-convex。使用 SGD/Adam，并接受 local optima。

## 如何测试函数的凸性

| Test | Applies to | Method |
|---|---|---|
| Second derivative >= 0 | Scalar functions f(x) | 计算 f''(x)。如果对所有 x 都有 f''(x) >= 0，则为凸函数。 |
| Hessian is PSD | Multivariate functions f(x) | 计算 H(x)。如果所有 eigenvalues 在任意位置都 >= 0，则为凸函数。 |
| Definition test | Any function | 对采样的 x, y, t，检查 f(tx + (1-t)y) <= t*f(x) + (1-t)*f(y)。 |
| Composition rules | Composed functions | 见下方组合表。 |
| Restriction to a line | Multivariate f | f 是凸的，当且仅当对所有 x, v，g(t) = f(x + tv) 关于 t 是凸的。 |

## 组合规则（保持凸性）

| Operation | Result |
|---|---|
| f + g（两者均凸） | Convex |
| c * f（c > 0，f 凸） | Convex |
| max(f, g)（两者均凸） | Convex |
| f(Ax + b)，其中 f 为凸函数 | Convex |
| g(f(x))，其中 g 是凸且 non-decreasing，f 是凸函数 | Convex |
| g(f(x))，其中 g 是凸且 non-increasing，f 是 concave | Convex |
| 凸函数之和 | Convex |
| 凸函数的 pointwise supremum | Convex |

## 常见 ML objectives：凸还是非凸？

| Objective | Convex? | Reason |
|---|---|---|
| MSE: (1/n) sum(y - Xw)^2 | Yes | 关于 w 的 quadratic，Hessian = (2/n) X^T X 是 PSD |
| Logistic loss: sum(log(1 + exp(-y_i * w^T x_i))) | Yes | 凸函数之和（log-sum-exp family） |
| Hinge loss: sum(max(0, 1 - y_i * w^T x_i)) | Yes | 凸（linear）函数的 max |
| L2 regularization: lambda * \|\|w\|\|^2 | Yes | Quadratic，Hessian = 2*lambda*I |
| L1 regularization: lambda * \|\|w\|\|_1 | Yes | absolute values 之和（凸但不可微） |
| Ridge regression: MSE + L2 | Yes | 两个凸函数之和 |
| LASSO: MSE + L1 | Yes | 两个凸函数之和 |
| Elastic net: MSE + L1 + L2 | Yes | 凸函数之和 |
| SVM (primal): hinge + L2 | Yes | 凸函数之和 |
| Cross-entropy with softmax | Yes（在 logits 中） | Log-sum-exp 是凸的 |
| Neural network（任意 loss） | No | 非线性 activations 会产生 non-convex 组合 |
| k-means objective | No | 离散 assignment step |
| Matrix factorization: \|\|X - UV^T\|\|^2 | No | 关于 U 和 V 是 bilinear |
| GAN loss | No | Minimax，关于 generator 是 non-convex |
| Contrastive loss (InfoNCE) | No | 带 negative samples 的 exponentials 比值的 log |

## 基于凸性的 solver 选择

| Problem type | Solver | Convergence guarantee |
|---|---|---|
| Convex, smooth, unconstrained | Gradient descent | O(1/k) 到 global minimum |
| Convex, smooth, unconstrained | L-BFGS | Superlinear 到 global minimum |
| Convex, smooth, unconstrained | Newton's method | 在 minimum 附近 quadratic（如果 Hessian 可处理） |
| Convex, smooth, constrained | Interior point method | Polynomial time |
| Convex, non-smooth (L1) | Proximal gradient / ISTA | O(1/k) 到 global minimum |
| Convex, non-smooth (L1) | ADMM | 灵活，可处理 constraints |
| Convex, quadratic | Conjugate gradient | n 步精确求解 |
| Non-convex, smooth | SGD / Adam | 收敛到 local minimum |
| Non-convex, smooth | SGD + restarts | 平均而言得到更好的 local minimum |
| Non-convex, smooth | Overparameterize + SGD | Flat minima，良好的 generalization |

## 常见错误

- 因为 loss function 是凸的，就假设问题是凸的。loss 必须关于你正在优化的参数是凸的。Cross-entropy 关于 logits 是凸的，但从输入到 logits 的完整 Neural Network 映射是 non-convex。
- 在 non-convex 问题上使用 Newton's method。Hessian 可能有负 eigenvalues，导致 Newton 移向 saddle points 或 maxima，而不是 minima。
- 忘记 L1 regularization 会让 objective 在零点不可微。标准 Gradient descent 效果不好。使用 proximal gradient descent 或 subgradient methods。
- 通过构造 A^T A 使 condition number 平方放大。如果需要求解 least-squares 问题且 A ill-conditioned，请使用 QR 或 SVD，而不是 normal equations。
- 没有检查就声明问题是 non-convex。许多 ML 问题（linear models, SVMs, logistic regression）是凸的，并能从更强的 solvers 中受益。

## 快速测试：我的问题是凸的吗？

```
1. 写出 objective：minimize f(w) subject to constraints
2. 对 f(w) 中的每一项：
   - 它是否是带 PSD matrix 的 quadratic？-> Convex
   - 它是否是 norm？-> Convex
   - 它是否是 log-sum-exp？-> Convex
   - 它是否以非线性方式涉及 w（sigmoid(w), w1*w2）？-> 很可能 non-convex
3. 所有 constraints 是否都是 linear 或 convex inequalities？
4. 如果所有项都是 convex，且 constraints 是 convex/linear -> problem is convex
5. 如果任意一项是 non-convex -> problem is non-convex
```
