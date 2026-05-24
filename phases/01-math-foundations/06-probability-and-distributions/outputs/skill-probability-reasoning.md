---
name: skill-probability-reasoning
description: 为给定的 ML 问题选择合适的概率分布
version: 1.0.0
phase: 1
lesson: 6
tags: [probability, distributions, modeling]
---

# 概率分布选择

在建模数据、设计 Loss functions 或设置 priors 时，如何选择合适的分布。

## 决策检查清单

1. 结果是离散的（类别、计数）还是连续的（测量值、分数）？
2. 结果是否有界（例如 [0, 1]）还是无界？
3. 有多少种可能结果？两个？k 个？无限个？
4. 数据是对称的还是偏斜的？
5. 事件是独立的还是相关的？
6. 你建模的是速率、计数、比例，还是测量值？

## 分布决策树

```
变量是离散的吗？
  是 --> 只有 2 个结果？ --> Bernoulli (p)
     |    k 个结果，一次试验？ --> Categorical (p1...pk)
     |    k 个结果，n 次试验？ --> Multinomial (n, p1...pk)
     |    n 次试验中的成功次数？ --> Binomial (n, p)
     |    每个区间内的事件次数？ --> Poisson (lambda)
     |    直到第一次成功所需的试验次数？ --> Geometric (p)
     |    直到 r 次成功所需的试验次数？ --> Negative Binomial (r, p)
  否 --> 对称、钟形？ --> Normal (mu, sigma)
     |   正值、右偏？ --> Log-normal 或 Exponential
     |   有界于 [0, 1]？ --> Beta (alpha, beta)
     |   正值、形状灵活？ --> Gamma (alpha, beta)
     |   事件之间的时间？ --> Exponential (lambda)
     |   需要重尾？ --> Student's t (nu) 或 Cauchy
     |   多变量、钟形？ --> Multivariate Normal
     |   在 simplex 上（总和为 1）？ --> Dirichlet (alpha)
```

## 将真实世界 ML 场景映射到分布

| Scenario | Distribution | Parameters |
|---|---|---|
| Binary classification 输出 | Bernoulli | p = sigmoid(logit) |
| Multi-class classification 输出 | Categorical | p = softmax(logits) |
| language models 中的 Token 预测 | Categorical over vocab | p from softmax |
| 像素强度（归一化后） | Beta or Uniform [0, 1] | 取决于图像统计 |
| 文档中的词数 | Poisson | lambda = avg word count |
| 用户请求之间的时间 | Exponential | lambda = request rate |
| 测量误差 | Normal | mu = 0, sigma from data |
| 权重初始化 | Normal or Uniform | Kaiming/Xavier 规则 |
| VAE latent space prior | Standard Normal | mu = 0, sigma = 1 |
| 比例上的 Bayesian prior | Beta | alpha, beta from belief |
| 类别权重上的 Bayesian prior | Dirichlet | alpha vector |
| Regression targets 中的噪声 | Normal | mu = 0, sigma estimated |
| 对 outliers 鲁棒的 Regression | Student's t | 低自由度 |
| 时长/寿命建模 | Weibull or Gamma | shape and scale |
| 每个文档的 topic distribution（LDA） | Dirichlet | alpha < 1 for sparse |

## 分布出错的情况

- 当数据有硬下界时（例如价格、距离）使用 Normal。Normal 会给负值分配非零概率。请改用 log-normal 或 gamma。
- 当方差不同于均值时使用 Poisson。Poisson 假设 mean = variance。如果 variance > mean，请使用 negative binomial。
- 对 multi-class 问题使用 Bernoulli。Bernoulli 严格来说是二元的。对于 k > 2，请使用 categorical。
- 在观测值相关时假设独立。Time series、空间数据和分组数据都违反独立性。请使用 autoregressive 或 hierarchical models。

## 常见错误

- 混淆 PDF 值和概率。PDF 可以超过 1。概率来自对某个区间上的 PDF 积分。
- 忘记 softmax 输出是 categorical probabilities，而不是独立的 Bernoulli probabilities。它们按构造总和为 1。
- 当你有领域知识时仍使用 uniform prior。如果选择得当，informative priors 可以在不偏置结果的情况下降低方差。
- 将 log-probabilities 当作 probabilities。Log-probs 总是负数（或零）。它们的总和不为 1。

## 快速参考：分布属性

| Distribution | Support | Mean | Variance | Key property |
|---|---|---|---|---|
| Bernoulli(p) | {0, 1} | p | p(1-p) | 最简单的离散分布 |
| Binomial(n, p) | {0..n} | np | np(1-p) | n 个 Bernoulli 之和 |
| Poisson(lam) | {0, 1, 2, ...} | lam | lam | Mean = variance |
| Normal(mu, s^2) | (-inf, inf) | mu | s^2 | 给定 mean/var 时的最大 entropy |
| Exponential(lam) | [0, inf) | 1/lam | 1/lam^2 | Memoryless |
| Beta(a, b) | [0, 1] | a/(a+b) | ab/((a+b)^2(a+b+1)) | Conjugate to Binomial |
| Gamma(a, b) | (0, inf) | a/b | a/b^2 | Conjugate to Poisson |
| Dirichlet(alpha) | Simplex | alpha_i/sum | (see formula) | Conjugate to Categorical |
