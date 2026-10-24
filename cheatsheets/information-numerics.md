---
id: information-numerics
title: Information Theory and Numerical Stability
code: IT
subtitle: 熵、交叉熵与 KL，稳定的 softmax 与 log-sum-exp，浮点格式，PCA 与距离选择。
hue: 280
sources: phases/01-math-foundations/09-information-theory, phases/01-math-foundations/10-dimensionality-reduction, phases/01-math-foundations/13-numerical-stability, phases/01-math-foundations/14-norms-and-distances
source_hash: d0a4a6ec261cbebc
---

## 信息论公式
type: concepts
from: phases/01-math-foundations/09-information-theory/docs/en.md

- **惊奇度**：$I(x) = -\log p(x)$。以 2 为底得到 bit，以 e 为底得到 nat。
- **熵**：$H(P) = -\sum_x p(x) \log p(x)$。公平硬币 1 bit。99% 的硬币 0.08 bit。
- **交叉熵**：$H(P,Q) = -\sum_x p(x) \log q(x)$。one-hot 标签给出 $-\log q(\text{true class})$。
- **KL 散度**：$D_{KL}(P \Vert Q) = H(P,Q) - H(P)$。它不对称。
- **互信息**：$I(X;Y) = H(X) + H(Y) - H(X,Y)$。为零表示独立。
- **条件熵**：$H(Y \mid X) = H(X,Y) - H(X)$。决策树的划分最小化它。
- **困惑度**：以 nat 计的 $e^{H(P,Q)}$。困惑度 50 相当于从 50 个 token 中均匀挑选。
- **标签平滑**：$(1-\epsilon)\,\text{hard} + \epsilon / K$。取 0.1 和 4 个类别时，真实类别得到 0.925。
- **单位**：1 nat 等于 1.4427 bit。PyTorch 和 TensorFlow 使用 nat。

## 稳定的损失计算路径
type: architecture
from: phases/01-math-foundations/13-numerical-stability/docs/en.md, phases/01-math-foundations/13-numerical-stability/code/numerical.py, phases/01-math-foundations/09-information-theory/docs/en.md

```arch
node | logits | 1,1 | Logits | raw scores z
node | max | 2,1 | Subtract max | c = max(x)
node | lse | 3,1 | Log-sum-exp | largest term is exp(0) = 1
node | lsm | 4,1 | log_softmax_stable | z minus lse
node | ce | 4,2 | Cross-entropy | minus log prob of true class
node | kl | 3,2 | KL divergence | CE minus entropy
node | ppl | 2,2 | Perplexity | exp of mean CE
edge | logits | max |
edge | max | lse | shifted
edge | lse | lsm |
edge | lsm | ce | log probs
edge | ce | kl |
edge | ce | ppl |
```

## 稳定的 softmax、LSE 与交叉熵
type: annotated-code
lang: python
from: phases/01-math-foundations/13-numerical-stability/code/numerical.py

```python
def logsumexp_stable(values):
    c = max(values)                                # largest exponent becomes 0
    return c + math.log(sum(math.exp(v - c) for v in values))

def log_softmax_stable(logits):
    c = max(logits)
    lse = c + math.log(sum(math.exp(z - c) for z in logits))
    return [z - lse for z in logits]               # log probs, no overflow

def cross_entropy_stable(true_class, logits):
    log_probs = log_softmax_stable(logits)
    return -log_probs[true_class]                  # never calls log(0)
```

## 代码中的任务
type: task-table
from: phases/01-math-foundations/09-information-theory/code/information_theory.py, phases/01-math-foundations/13-numerical-stability/code/numerical.py

| 任务 | 代码 |
|---|---|
| 以 bit 计的熵 | `entropy(probs, base=2)` |
| KL 散度 | `kl_divergence(p, q, base=2)` |
| 由平均 CE 得到困惑度 | `perplexity(avg_cross_entropy, base="e")` |
| 安全的 softmax | `softmax_stable(logits)` |
| 数值梯度 | `numerical_gradient(f, x, h=1e-5)` |
| 与反向传播对比 | `check_gradient(analytical, numerical)` |
| 裁剪梯度范数 | `clip_by_norm(gradients, max_norm)` |
| 均值很大时的方差 | `welford_variance(values)` |

## 浮点格式与极限
type: defaults
from: phases/01-math-foundations/13-numerical-stability/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| float64 最大值 | 1.8e308 | 11 位指数，约 15-16 位有效数字 |
| float32 最大值 | 3.4028235e+38 | 8 位指数，约 7-8 位有效数字 |
| float32 最小正规数 | 1.175e-38 | 非规格化数可到 1.401e-45 |
| float32 exp 上溢 | exp(89.0) | 得到 inf。exp(88.7) 仍可表示 |
| float32 exp 下溢 | exp(-104) | 得到 0.0 |
| float16 最大值 | 65,504 | 低于约 6e-8 的梯度变为 0 |
| bfloat16 最大值 | 3.4e38 | 8 位指数，7 位尾数 |
| float32 机器 epsilon | 1.19e-7 | 使 1.0 + e != 1.0 的最小 e |

## 带损失缩放的混合精度
type: flow
from: phases/01-math-foundations/13-numerical-stability/docs/en.md

1. **主权重**：保留一份 float32 的权重副本。
2. **前向传播**：为速度用 float16 运行。
3. **损失**：用 float32 计算以防上溢。
4. **缩放**：把损失乘以一个因子，例如 1024。
5. **反向传播**：用 float16 运行。梯度放大 1024x。
6. **反缩放**：更新前把梯度除以 1024。
7. **更新**：修改 float32 主权重。
8. **动态缩放**：从 65536 开始。遇到 inf 减半，连续 N 步正常后加倍。

## 数值 bug
type: troubleshooting
from: phases/01-math-foundations/13-numerical-stability/docs/en.md, phases/01-math-foundations/13-numerical-stability/code/numerical.py

| 症状 | 原因 | 修复 |
|---|---|---|
| 几个 epoch 后损失变成 NaN | logits 过大，softmax 上溢 | 稳定 softmax、降低学习率、裁剪梯度 |
| 损失卡在 log(num_classes) | 输出接近均匀，没有学习 | 检查标签、损失和死亡 ReLU |
| 验证准确率低 1-3% | 混合精度未做损失缩放 | 动态损失缩放或 bfloat16 |
| 某些层梯度范数为 0.0 | 死亡 ReLU 或 float16 下溢 | LeakyReLU 或 GELU，梯度缩放 |
| 不同 GPU 结果不同 | 浮点加法不满足结合律 | `torch.use_deterministic_algorithms(True)` |
| `exp()` 在损失中返回 inf | 原始 logits 没有减去最大值 | `torch.nn.functional.log_softmax()` |
| 切到 float16 后发散 | 梯度低于 6e-8，数值超过 65,504 | 带损失缩放的 AMP，或 bfloat16 |
| 大数值的方差算错 | 灾难性抵消 | `welford_variance` 或先中心化数据 |

## 旋钮与阈值
type: defaults
from: phases/01-math-foundations/13-numerical-stability/docs/en.md, phases/01-math-foundations/10-dimensionality-reduction/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 梯度检查 `h` | 1e-5 | 常见范围 1e-5 到 1e-7 |
| 梯度检查通过 | 1e-7 | 高于 1e-3 说明有问题 |
| `max_norm` | 1.0 | Transformer。RL 用 0.5，简单网络用 5.0 |
| LayerNorm `epsilon` | 1e-5 | 防止除以零 |
| log 与除法中的 epsilon | 1e-8 | `log(x + 1e-8)` |
| t-SNE 困惑度 | 5-50 | 课程中用 30 |
| UMAP `n_neighbors` | 15 | 配合 `min_dist` 0.1 |
| PCA 累计方差 | 0.95 | 或 90-95% 的阈值 |

## 选择距离
type: command-table
from: phases/01-math-foundations/14-norms-and-distances/docs/en.md, phases/01-math-foundations/14-norms-and-distances/code/distances.py

| 命令 | 作用 |
|---|---|
| `cosine_similarity(a, b)` | 文本与嵌入。忽略模长 |
| `dot_product(a, b)` | 推荐。模长编码热度 |
| `l2_distance(a, b)` | 尺度相当的像素与空间数据 |
| `l1_distance(a, b)` | 稀疏高维特征。对离群值稳健 |
| `linf_distance(a, b)` | 单一维度上的最坏偏差 |
| `mahalanobis_distance(x, y, cov_matrix)` | 特征相关时的离群值 |
| `jaccard_similarity(set_a, set_b)` | 集合与标签。分割中的 IoU |
| `edit_distance(s1, s2)` | 字符串。插入、删除或替换 |

## 降维
type: concepts
from: phases/01-math-foundations/10-dimensionality-reduction/docs/en.md, phases/01-math-foundations/10-dimensionality-reduction/code/dim_reduction.py

- **维度灾难**：在 1000 维时，最大/最小距离比约为 ~1.02。
- **PCA**：中心化、协方差、`np.linalg.eigh`、按特征值排序、保留前 k 个。
- **解释比例**：一个特征值除以所有特征值之和。
- **选择 k**：保留 90-95% 的方差、找拐点，或在任务上扫描 k。
- **重构误差**：被丢弃特征值之和。误差高说明是离群点。
- **t-SNE**：保留局部邻居。随机且为 $O(n^2)$。簇之间的间距没有意义。
- **UMAP**：比 t-SNE 快，保留更多全局结构。
- **Kernel PCA**：在核特征空间中做 PCA。RBF 能分开同心圆。

## 问答
type: qa
from: phases/01-math-foundations/13-numerical-stability/docs/en.md, phases/01-math-foundations/14-norms-and-distances/docs/en.md, phases/01-math-foundations/09-information-theory/docs/en.md

- **为什么要减去最大值？** 最大项变成 exp(0) = 1，和至少为 1。
- **为什么训练用 bfloat16？** 它有 float32 的范围，通常不需要损失缩放。
- **为什么最小化交叉熵？** 它等于负对数似然，H(P) 是常数。
- **为什么 KL 不是距离？** 它不对称，也不满足三角不等式。
- **为什么 GAN 用 Wasserstein？** 分布不重叠时它仍能给出梯度。
- **为什么 L1 得到稀疏权重？** 损失等高线在角点处接触 L1 菱形。
- **为什么用中心差分？** 误差为 $O(h^2)$。前向差分是 $O(h)$。

## 提示
type: tips
from: phases/01-math-foundations/13-numerical-stability/docs/en.md, phases/01-math-foundations/14-norms-and-distances/docs/en.md

- 不要用 `==` 比较浮点数。用 `math.isclose()`。
- 调试时在每次前向传播后检查 nan 和 inf：`math.isfinite(x)`。
- 限制 exp 的输入：`exp(clamp(x, -80, 80))`。
- 用 `torch.nn.utils.clip_grad_norm_()` 按范数裁剪，它保持梯度方向。
- 用 `torch.autograd.gradcheck()` 检查每个新层或损失。
- 嵌入做 L2 归一化后，余弦与点积结果相同。
