---
name: skill-information-theory
description: 将信息论概念应用于 ML Loss function、模型评估和特征选择
version: 1.0.0
phase: 1
lesson: 9
tags: [information-theory, entropy, loss-functions]
---

# 面向 ML 的信息论

在 ML 系统中，什么时候使用熵、cross-entropy、KL divergence 和 mutual information。

## 决策清单

1. 衡量单个分布中的不确定性？使用 **entropy**。
2. 衡量模型对真实标签的近似程度？使用 **cross-entropy**（这就是你的 Classification Loss）。
3. 衡量两个分布之间的距离？使用 **KL divergence**。
4. 检查两个变量是否相关？使用 **mutual information**。
5. 报告 language model 质量？使用 **perplexity**（cross-entropy 的指数）。
6. 将一个模型蒸馏到另一个模型中？最小化从 teacher 到 student 的 **KL divergence**。

## 什么时候使用每种度量

| 度量 | Formula | 使用场景 | ML 应用 |
|---|---|---|---|
| Entropy H(P) | -sum(p log p) | 这个分布有多不确定？ | 数据复杂度、maximum entropy models |
| Cross-entropy H(P,Q) | -sum(p log q) | 模型 Q 预测真实 P 的效果有多好？ | Classification Loss、language model Loss |
| KL divergence D(P\|\|Q) | sum(p log(p/q)) | P 和 Q 有多不同？ | VAE Loss (ELBO)、知识蒸馏、RLHF |
| Mutual information I(X;Y) | H(X) - H(X\|Y) | Y 能告诉我们多少关于 X 的信息？ | 特征选择、representation learning |
| Perplexity | exp(H(P,Q)) or 2^H | 模型有多困惑？ | Language model evaluation |
| Conditional entropy H(X\|Y) | -sum(p(x,y) log p(x\|y)) | 已知 Y 后 X 中剩余的不确定性 | 特征信息量 |

## 关键关系

```
Cross-entropy  = Entropy + KL divergence
H(P, Q)        = H(P)   + D_KL(P || Q)

Since H(P) is constant during training:
  Minimizing cross-entropy = Minimizing KL divergence

Mutual information = Entropy - Conditional entropy
I(X; Y) = H(X) - H(X|Y) = H(Y) - H(Y|X)

Perplexity = exp(cross-entropy in nats)
           = 2^(cross-entropy in bits)
```

## 快速参考：公式和单位

| Formula | Bits (log base 2) | Nats (log base e) |
|---|---|---|
| Information: -log(p) | -log2(p) | -ln(p) |
| Entropy: -sum(p log p) | bits | nats |
| 1 nat = | 1.4427 bits | 1 nat |
| PyTorch default | -- | nats |
| 信息论论文 | bits | -- |

## 解读数值

| Entropy 值 | 含义 |
|---|---|
| 0 | 确定性。某一个 outcome 的概率为 1。 |
| log(n) | 最大不确定性。n 个 outcome 上的均匀分布。 |
| Low | 分布是尖峰状的。模型很有把握。 |
| High | 分布是平坦的。模型不确定。 |

| Perplexity 值 | Language model 质量 |
|---|---|
| 1 | 完美预测（实践中不会发生） |
| 10 | 平均而言，在约 10 个同等可能的 Token 中选择 |
| 50 | 标准 benchmark 上的 GPT-2 水平 |
| < 10 | 在代表性充分的领域中达到 state-of-the-art |

## 常见错误

- 计算 KL divergence 并把它当作对称的。D_KL(P||Q) != D_KL(Q||P)。对于对称度量，使用 Jensen-Shannon divergence：JS = 0.5 * KL(P||M) + 0.5 * KL(Q||M)，其中 M = 0.5*(P+Q)。
- 忘记带 one-hot 标签的 cross-entropy 会简化为 -log(p_true_class)。当真实分布是 one-hot 时，不需要对所有类别求和。
- 在代码中使用 log base 2，却报告 nats（或反过来）。PyTorch 默认使用自然对数。乘以 log2(e) = 1.4427 可将 nats 转换为 bits。
- 计算空事件或零概率事件的 entropy。约定：0 * log(0) = 0，因为 lim(p->0) p*log(p) = 0。
- 跨不同 vocabulary 比较 perplexity。一个 vocab size 为 50k 且 perplexity 为 30 的模型，不能与 vocab size 为 10k 且 perplexity 为 30 的模型直接比较。

## 每个概念在生产 ML 中出现的位置

| 概念 | 你会在哪里看到它 |
|---|---|
| Cross-entropy Loss | 每个 Classification 模型 (nn.CrossEntropyLoss) |
| KL divergence | VAE ELBO、PPO clipping、知识蒸馏 |
| Entropy regularization | RL 中的 exploration bonus（更高 entropy = 更多 exploration） |
| Mutual information | 特征选择、InfoNCE Loss（contrastive learning） |
| Perplexity | Language model benchmark（越低越好） |
| Label smoothing | 用 soft targets 替代 one-hot，降低 cross-entropy 过度自信 |
| Temperature scaling | 在 softmax 前用 T 除以 logits，控制输出的 entropy |
