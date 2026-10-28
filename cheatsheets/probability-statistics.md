---
id: probability-statistics
title: Probability and Statistics for ML
code: PS
subtitle: 分布、贝叶斯、检验、自助法、从 logits 采样与马尔可夫链。从零 Python 与 SciPy。
hue: 160
sources: phases/01-math-foundations/06-probability-and-distributions, phases/01-math-foundations/07-bayes-theorem, phases/01-math-foundations/15-statistics-for-ml, phases/01-math-foundations/16-sampling-methods, phases/01-math-foundations/22-stochastic-processes
source_hash: 229da09316216de4
---

## 从 logits 到 token
type: architecture
from: phases/01-math-foundations/16-sampling-methods/docs/en.md, phases/01-math-foundations/16-sampling-methods/code/sampling.py

```arch
node | logits | 1,1 | Logits | one per token
node | temp | 2,1 | Temperature | divide by T
node | soft | 3,1 | Softmax | subtract max first
node | topk | 1,2 | Top-k | keep k, renormalize
node | topp | 2,2 | Top-p | smallest set with cumsum >= p
node | pick | 3,2 | Sample | sample_from_probs
edge | logits | temp |
edge | temp | soft |
edge | soft | topk | probs
edge | topk | topp | then
edge | topp | pick |
```

## 贝叶斯 A/B 测试
type: flow
from: phases/01-math-foundations/07-bayes-theorem/docs/en.md, phases/01-math-foundations/07-bayes-theorem/code/bayes.py

1. **先验**：每个变体从 Beta(1, 1) 开始。它是均匀的。
2. **数据**：A 在 1000 次浏览中得到 50 次点击。B 在 1000 次浏览中得到 65 次点击。
3. **更新**：`beta_update(alpha, beta_param, successes, failures)` 加上计数。
4. **后验**：A 是 Beta(51, 951)，均值 0.051。B 是 Beta(66, 936)，均值 0.066。
5. **蒙特卡洛**：从每个后验抽 100000 个样本。P(B > A) 是 B 赢的比例。
6. **决策**：高于 0.95 上线 B。低于 0.05 上线 A。否则继续收集数据。

## 代码中的任务
type: task-table
span: 2
from: phases/01-math-foundations/07-bayes-theorem/docs/en.md, phases/01-math-foundations/07-bayes-theorem/code/bayes.py, phases/01-math-foundations/15-statistics-for-ml/code/statistics.py, phases/01-math-foundations/06-probability-and-distributions/code/probability.py

| 任务 | 代码 |
|---|---|
| 一次检验的后验 | `bayes(prior=0.0001, likelihood=0.99, false_positive_rate=0.01)` |
| 重复检验 | `sequential_bayes(prior, likelihood, false_positive_rate, num_tests)` |
| 带加一平滑的垃圾邮件过滤器 | `NaiveBayes(smoothing=1.0)`，然后 `classifier.train(train_docs, train_labels)` |
| 从 logits 算损失 | `cross_entropy_loss(logits, target_index)` |
| 自助法置信区间 | `bootstrap_statistic(data, stat_func, n_bootstrap=5000, ci=95)` |
| Welch t 检验、配对 t 检验 | `two_sample_ttest(data1, data2)`，`paired_ttest(data1, data2)` |
| 效应量 | `cohens_d(data1, data2)`，然后 `interpret_cohens_d(d)` |
| 校正多次检验 | `bonferroni_correction(p_values, alpha=0.05)` |

## 从零采样
type: annotated-code
lang: python
from: phases/01-math-foundations/16-sampling-methods/docs/en.md, phases/01-math-foundations/16-sampling-methods/code/sampling.py

```python
x = sample_exponential_inverse_cdf(lam)  # -log(u) / lam
x = rejection_sample(target_pdf, proposal_sample, proposal_pdf, M)  # accept rate 1/M
est = importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n)
idx = temperature_sample(logits, temperature)  # z / T, then softmax
idx = top_k_sample(logits, k)  # keep the k largest logits
idx = top_p_sample(logits, p)  # stop when cumsum >= p
z = reparam_sample(mu, sigma)  # mu + sigma * epsilon
y = gumbel_softmax_sample(log_probs, temperature)  # soft one-hot
```

## 库调用
type: annotated-code
lang: python
from: phases/01-math-foundations/06-probability-and-distributions/docs/en.md, phases/01-math-foundations/16-sampling-methods/docs/en.md, phases/01-math-foundations/22-stochastic-processes/docs/en.md

```python
normal = stats.norm(loc=0, scale=1)
normal.cdf(1.96)  # P(X < 1.96)
normal.ppf(0.975)  # inverse CDF
samples = normal.rvs(size=10000)
probs = softmax(logits)  # from scipy.special
rng = np.random.default_rng(42)
token = rng.choice(len(logits), p=probs)
distribution = distribution @ P  # power method, repeat 100 times
eigenvalues = np.linalg.eigvals(P)
spectral_gap = 1 - sorted(np.abs(eigenvalues))[-2]  # mixing time near 1/gap
```

## 关键公式
type: concepts
from: phases/01-math-foundations/06-probability-and-distributions/docs/en.md, phases/01-math-foundations/07-bayes-theorem/docs/en.md, phases/01-math-foundations/15-statistics-for-ml/docs/en.md, phases/01-math-foundations/16-sampling-methods/docs/en.md, phases/01-math-foundations/22-stochastic-processes/docs/en.md

- **贝叶斯**：$P(A \mid B) = \frac{P(B \mid A) \cdot P(A)}{P(B)}$。$P(B)$ 是归一化项。
- **方差**：$\mathrm{Var}(X) = \mathbb{E}[X^2] - (\mathbb{E}[X])^2$。样本方差除以 $n-1$。
- **带 T 的 Softmax**：$p_i = \exp(z_i / T) / \sum_j \exp(z_j / T)$。
- **Laplace 平滑**：每个计数加 1，总数加词表大小。
- **Beta 更新**：先验 Beta(a, b)，s 次成功、f 次失败得到 Beta(a + s, b + f)。
- **重要性权重**：$w(x) = p(x) / q(x)$。对 $x_i \sim q$ 平均 $f(x_i) \, w(x_i)$。
- **Metropolis-Hastings**：以 $\min(1, a)$ 接受。对称提议给出 $a = p(x') / p(x)$。
- **Langevin**：$x_{t+1} = x_t - dt \, \nabla U(x_t) + \sqrt{2 T \, dt} \, z_t$。

## 分布
type: command-table
from: phases/01-math-foundations/06-probability-and-distributions/docs/en.md, phases/01-math-foundations/07-bayes-theorem/docs/en.md, phases/01-math-foundations/16-sampling-methods/docs/en.md, phases/01-math-foundations/22-stochastic-processes/docs/en.md

| 命令 | 作用 |
|---|---|
| Bernoulli | 均值 p，方差 p(1-p)。二分类 |
| Categorical | 概率和为 1。Softmax 输出 |
| Poisson | 均值与方差都是 lambda。事件计数 |
| Uniform(0, 1) | E[U] = 0.5，Var(U) = 1/12。每个采样器的起点 |
| Normal | 68%、95%、99.7% 落在 1、2、3 个 sigma 内 |
| Beta(a, b) | 均值 a/(a+b)。Bernoulli 的共轭先验 |
| Exponential | 逆 CDF 给出 x = -ln(u) / lambda |
| Brownian motion | B(t) 是均值 0、方差 t 的正态 |

## 选检验
type: command-table
from: phases/01-math-foundations/15-statistics-for-ml/docs/en.md

| 命令 | 作用 |
|---|---|
| One-sample t-test | 均值对 mu_0。自由度 n - 1 |
| Welch t-test | 两个独立组。不假设等方差 |
| Paired t-test | 两个模型用同一折。对 0 检验 d_i |
| Chi-squared | 观测对期望频率 |
| Mann-Whitney U | 两组，不假设正态 |
| Wilcoxon signed-rank | 配对数据。适合 5 或 10 折 |
| Spearman rho | 秩上的单调关系。对离群点稳健 |
| Bootstrap | 任意指标。95% CI 取第 2.5 与 97.5 百分位 |

## 数字与默认值
type: defaults
from: phases/01-math-foundations/07-bayes-theorem/docs/en.md, phases/01-math-foundations/15-statistics-for-ml/docs/en.md, phases/01-math-foundations/15-statistics-for-ml/code/statistics.py, phases/01-math-foundations/16-sampling-methods/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Significance level alpha | 0.05 | p 低于它时拒绝 H0 |
| z for a 95% interval | 1.96 | x_bar 加减 z 乘 s / sqrt(n) |
| `n_bootstrap` | 5000 | 课程范围是 1000 到 10000 |
| CLT sample size | n >= 30 | 偏斜数据用 n >= 100 |
| Cohen's d, large effect | 0.8 | 0.2 小，0.5 中 |
| MH acceptance, Gaussian proposal | 0.234 | 高维 |
| Top-k `k` | 40 | 典型设置 |
| Temperature with top-p | 0.7 + top-p 0.9 | 通用 |

## 故障排查
type: troubleshooting
from: phases/01-math-foundations/06-probability-and-distributions/docs/en.md, phases/01-math-foundations/07-bayes-theorem/docs/en.md, phases/01-math-foundations/15-statistics-for-ml/docs/en.md, phases/01-math-foundations/16-sampling-methods/docs/en.md, phases/01-math-foundations/22-stochastic-processes/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| softmax 中 exp(102) 溢出 | logits 过大 | 先减去最大 logit |
| 序列概率变成 0.0 | 约 30 项后下溢 | 对对数概率相加 |
| Naive Bayes 分数是 0 | 未见词的 MLE 计数为 0 | 加一 Laplace 平滑 |
| 99% 检验大约给出 1% 患病 | 稀有先验主导 | 用基础率。再做第二次检验 |
| 20 个指标里有一个显著 | 64% 机会出现假阳性 | Bonferroni：alpha / m |
| 0.03% 增益上有极小 p 值 | n 非常大 | 同时报告效应量 |
| MH 链卡住或很慢 | 提议尺度过大或过小 | 调到约 23% 接受率 |
| 少数样本主导估计 | 提议 q 远离 p | 自归一化权重 |

## 问答
type: qa
from: phases/01-math-foundations/15-statistics-for-ml/docs/en.md, phases/01-math-foundations/16-sampling-methods/docs/en.md, phases/01-math-foundations/22-stochastic-processes/docs/en.md, phases/01-math-foundations/07-bayes-theorem/docs/en.md

- **p 值是 H0 为真的概率吗？** 不是。它是在 H0 下数据如此极端的概率。
- **95% CI 是什么意思？** 重复实验中 95% 的区间包含真实均值。
- **为什么要重参数化技巧？** 采样会阻断梯度。z = mu + sigma * epsilon 可微。
- **为什么 top-p 优于 top-k？** Top-p 按模型置信度自适应候选集。
- **链混合有多快？** 谱隙 0.2 大约需要 5 步。0.01 大约需要 100。
- **MAP 与正则化有何关系？** 高斯先验是 L2。Laplace 先验是 L1。

## 提示
type: tips
from: phases/01-math-foundations/15-statistics-for-ml/docs/en.md, phases/01-math-foundations/16-sampling-methods/docs/en.md, phases/01-math-foundations/22-stochastic-processes/docs/en.md

- 在同一测试集和同一折上评估两个模型。
- 同时报告 p 值与效应量。
- 蒙特卡洛误差在任意维度都是 O(1 / sqrt(N))。
- 丢掉 burn-in 样本。从不同起点跑几条链。
- 随机游走 n 步后大约从原点漂移 sqrt(n)。
- 事实性答案与确定性任务用 T = 0.0（贪心）。
