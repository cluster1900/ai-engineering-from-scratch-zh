---
id: math-for-ml
title: Math for Machine Learning
code: MM
subtitle: 梯度、概率、信息论、优化器、矩阵分解与浮点安全。NumPy、SciPy 与 PyTorch。
hue: 260
sources: phases/01-math-foundations/02-vectors-matrices-operations, phases/01-math-foundations/04-calculus-for-ml, phases/01-math-foundations/05-chain-rule-and-autodiff, phases/01-math-foundations/06-probability-and-distributions, phases/01-math-foundations/07-bayes-theorem, phases/01-math-foundations/08-optimization, phases/01-math-foundations/09-information-theory, phases/01-math-foundations/10-dimensionality-reduction, phases/01-math-foundations/11-singular-value-decomposition, phases/01-math-foundations/12-tensor-operations, phases/01-math-foundations/13-numerical-stability, phases/01-math-foundations/14-norms-and-distances, phases/01-math-foundations/16-sampling-methods, phases/01-math-foundations/17-linear-systems
source_hash: 9cf5b9af88d8d2f2
---

## 计算图：前向与反向
type: architecture
from: phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md

```arch
node | x1 | 1,1 | x1 = 2 | dy/dx1 = 3
node | x2 | 1,2 | x2 = 3 | dy/dx2 = 2
node | mul | 2,1 | Multiply | a = 6
node | b | 2,2 | b = 1 | dy/db = 1
node | add | 3,1 | Add | c = 7
node | relu | 4,1 | relu | y = 7
node | seed | 4,2 | Seed | dy/dy = 1
edge | x1 | mul |
edge | x2 | mul |
edge | mul | add | a
edge | b | add |
edge | add | relu | c
edge | relu | seed | backward
```

## 关键公式
type: concepts
from: phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md, phases/01-math-foundations/07-bayes-theorem/docs/en.md, phases/01-math-foundations/09-information-theory/docs/en.md, phases/01-math-foundations/13-numerical-stability/docs/en.md, phases/01-math-foundations/14-norms-and-distances/docs/en.md, phases/01-math-foundations/11-singular-value-decomposition/docs/en.md

- **链式法则**：$\frac{dy}{dx} = f'(g(x)) \cdot g'(x)$
- **贝叶斯**：$P(A \mid B) = \frac{P(B \mid A) \cdot P(A)}{P(B)}$
- **熵**：$H(P) = -\sum_{x} p(x) \log(p(x))$
- **交叉熵**：$H(P, Q) = -\sum_{x} p(x) \log(q(x))$
- **KL 散度**：$D_{KL}(P \,\|\, Q) = H(P, Q) - H(P)$。不对称。
- **Log-sum-exp**：$\log \sum_i e^{x_i} = \max(x) + \log \sum_i e^{x_i - \max(x)}$
- **余弦相似度**：$\frac{a \cdot b}{\lVert a \rVert_2 \, \lVert b \rVert_2}$，范围 -1 到 +1
- **SVD**：$A = U \Sigma V^T$。秩 $k$：$A_k = U_k \Sigma_k V_k^T$

## 更新规则
type: concepts
from: phases/01-math-foundations/08-optimization/docs/en.md, phases/01-math-foundations/04-calculus-for-ml/docs/en.md, phases/01-math-foundations/16-sampling-methods/docs/en.md

- **梯度下降**：$w = w - \text{lr} \cdot \text{gradient}$
- **动量**：$v = \beta v + \text{gradient}$，然后 $w = w - \text{lr} \cdot v$
- **Adam 矩估计**：$m = \beta_1 m + (1 - \beta_1) g$，$v = \beta_2 v + (1 - \beta_2) g^2$
- **偏差修正**：$\hat{m} = m / (1 - \beta_1^t)$，$\hat{v} = v / (1 - \beta_2^t)$
- **Adam 步**：$w = w - \text{lr} \cdot \hat{m} / (\sqrt{\hat{v}} + \epsilon)$
- **余弦调度**：$\text{lr}_{\min} + 0.5 (\text{lr}_{\max} - \text{lr}_{\min})(1 + \cos(\pi t / T))$
- **牛顿步**：$w_{\text{new}} = w_{\text{old}} - H^{-1} \cdot \text{gradient}$
- **温度**：$p_i = e^{z_i / T} / \sum_j e^{z_j / T}$

## NumPy 中的任务
type: task-table
from: phases/01-math-foundations/02-vectors-matrices-operations/docs/en.md, phases/01-math-foundations/11-singular-value-decomposition/docs/en.md, phases/01-math-foundations/17-linear-systems/docs/en.md, phases/01-math-foundations/14-norms-and-distances/docs/en.md, phases/01-math-foundations/12-tensor-operations/docs/en.md

| 任务 | 代码 |
|---|---|
| 全连接层 | `np.maximum(0, weights @ inputs + bias)` |
| 解方阵方程组 | `np.linalg.solve(A, b)` |
| 最小二乘 | `np.linalg.lstsq(X, y, rcond=None)[0]` |
| 精简 SVD | `U, S, Vt = np.linalg.svd(A, full_matrices=False)` |
| 秩 k 近似 | `U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]` |
| 伪逆求解 | `np.linalg.pinv(A) @ b` |
| 行范数 | `np.linalg.norm(X, axis=1, keepdims=True)` |
| 批量矩阵乘法 | `np.einsum("bij,bjk->bik", batch_A, batch_B)` |

## PyTorch 与 SciPy 中的任务
type: task-table
from: phases/01-math-foundations/08-optimization/docs/en.md, phases/01-math-foundations/13-numerical-stability/docs/en.md, phases/01-math-foundations/16-sampling-methods/docs/en.md, phases/01-math-foundations/10-dimensionality-reduction/docs/en.md

| 任务 | 代码 |
|---|---|
| Transformer 用 AdamW | `torch.optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)` |
| 余弦调度 | `torch.optim.lr_scheduler.CosineAnnealingLR(adam, T_max=100)` |
| 按范数裁剪 | `torch.nn.utils.clip_grad_norm_()` |
| 检查反向传播 | `torch.autograd.gradcheck()` |
| 稳定的 log softmax | `torch.nn.functional.log_softmax()` |
| N(0, 1) 的逆 CDF | `stats.norm(loc=0, scale=1).ppf(0.975)` |
| PCA 降到 2D | `SklearnPCA(n_components=2).fit_transform(X)` |
| t-SNE 降到 2D | `TSNE(n_components=2, perplexity=30, random_state=42)` |

## 几行代码实现自动微分
type: annotated-code
lang: python
from: phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md

```python
x = torch.tensor(2.0, requires_grad=True)  # record operations on x
y = x ** 2 + 3 * x + 1                     # builds the graph
y.backward()                               # reverse mode pass
print(x.grad)                              # 7.0 = 2*x + 3
def __mul__(self, other):
    out = Value(self.data * other.data, (self, other), '*')
    def _backward():
        self.grad += other.data * out.grad  # local grad times upstream
        other.grad += self.data * out.grad  # += sums over all uses
    out._backward = _backward
    return out
self.grad = 1.0                            # seed dy/dy = 1
for v in reversed(topo):                   # output to inputs
    v._backward()                          # chain rule at each node
```

## 稳定的 softmax 与交叉熵
type: annotated-code
lang: python
from: phases/01-math-foundations/13-numerical-stability/docs/en.md

```python
def softmax_stable(logits):
    max_logit = max(logits)                           # subtract the max first
    exps = [math.exp(z - max_logit) for z in logits]  # largest term is 1
    total = sum(exps)
    return [e / total for e in exps]
def cross_entropy_stable(true_class, logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    log_sum_exp = math.log(sum(math.exp(s) for s in shifted))
    log_prob = shifted[true_class] - log_sum_exp     # stay in log space
    return -log_prob
```

## 用 SVD 做 PCA
type: flow
from: phases/01-math-foundations/10-dimensionality-reduction/docs/en.md, phases/01-math-foundations/11-singular-value-decomposition/docs/en.md

1. **中心化**：每个特征减去其均值。
2. **协方差**：对中心化后的 X，$C = \frac{1}{n-1} X^T X$。
3. **分解**：对数据调用 `np.linalg.svd(A)`。避免对 $A^T A$ 求特征分解。
4. **主成分**：右奇异向量 V 就是主成分。
5. **方差**：第 i 个主成分解释 $\sigma_i^2 / (n-1)$。
6. **选择 k**：保留主成分直到累计方差达到 90 到 95%。
7. **投影**：保留前 k 个方向，丢弃其余。

## 默认值与数字
type: defaults
from: phases/01-math-foundations/08-optimization/docs/en.md, phases/01-math-foundations/13-numerical-stability/docs/en.md, phases/01-math-foundations/16-sampling-methods/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Adam lr | 0.001 | 大多数问题从这里开始 |
| Adam beta2 | 0.999 | beta1 为 0.9 |
| Adam epsilon | 1e-8 | 避免除以零 |
| SGD 动量 lr | 0.01 | 配合动量 0.9 |
| 梯度检查 h | 1e-5 | 常用 1e-5 到 1e-7 |
| Transformer max_norm | 1.0 | RL 用 0.5，简单网络用 5.0 |
| 动态损失缩放初值 | 65536 | 遇 inf 减半，连续 N 步正常后加倍 |
| Top-p | 0.9 | 一般用途配合温度 0.7 |

## 故障排查
type: troubleshooting
from: phases/01-math-foundations/13-numerical-stability/docs/en.md, phases/01-math-foundations/17-linear-systems/docs/en.md, phases/01-math-foundations/07-bayes-theorem/docs/en.md, phases/01-math-foundations/08-optimization/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 几个 epoch 后损失变成 NaN | softmax 上溢或学习率过高 | 稳定 softmax、降低学习率、裁剪梯度 |
| 损失卡在 log(num_classes) | 输出接近均匀 | 检查标签、损失函数和死亡 ReLU |
| 用 float16 时准确率低 1 到 3% | 梯度下溢 | 动态损失缩放或 bfloat16 |
| 某些层梯度范数为 0.0 | 死亡 ReLU 或 float16 下溢 | LeakyReLU 或 GELU，梯度缩放 |
| 不同 GPU 结果不同 | 浮点加法不满足结合律 | `torch.use_deterministic_algorithms(True)` |
| `0.1 + 0.2 == 0.3` 为 False | 0.1 在二进制中无法精确表示 | `math.isclose()` 或使用容差 |
| 输入稍变解就大幅变化 | 条件数很大 | 加上 $\lambda I$ 或删除共线特征 |
| 一个未见过的词让朴素贝叶斯归零 | MLE 给出概率零 | 拉普拉斯平滑，计数加 1 |

## 问答
type: qa
from: phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md, phases/01-math-foundations/09-information-theory/docs/en.md, phases/01-math-foundations/13-numerical-stability/docs/en.md, phases/01-math-foundations/11-singular-value-decomposition/docs/en.md, phases/01-math-foundations/16-sampling-methods/docs/en.md

- **为什么用反向模式？** 输入多、损失只有一个。一次反向传播得到所有梯度。
- **为什么用交叉熵？** 最小化它就是最大化数据的似然。
- **为什么训练用 bfloat16？** 它有 float32 的范围，超过 65,504 的值不会上溢。
- **为什么用 SVD 而不是 A.T @ A 的特征向量？** 该乘积会让条件数平方。
- **为什么用重参数化技巧？** $z = \mu + \sigma \epsilon$ 让梯度能流过 $\mu$ 和 $\sigma$。

## 提示
type: tips
from: phases/01-math-foundations/02-vectors-matrices-operations/docs/en.md, phases/01-math-foundations/13-numerical-stability/docs/en.md, phases/01-math-foundations/07-bayes-theorem/docs/en.md, phases/01-math-foundations/09-information-theory/docs/en.md, phases/01-math-foundations/08-optimization/docs/en.md

- 检查形状：`(m x n) @ (n x p) = (m x p)`。
- 对数概率相加，不要把许多小概率相乘。
- 绝不用 `==` 比较浮点数。
- 写新的层或损失时检查梯度。
- 困惑度是以 nat 计的交叉熵的指数。
- 梯度检查中，相对误差低于 1e-5 即可接受。
