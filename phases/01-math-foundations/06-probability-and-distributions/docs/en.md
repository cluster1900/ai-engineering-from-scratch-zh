# 概率与分布

> 概率是 AI 用来表达不确定性的语言。

**Type:** 学习
**Language:** Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~75 分钟

## 学习目标

- 从零实现 Bernoulli、categorical、Poisson、uniform 和 normal distributions 的 PMF 与 PDF
- 计算 expected value、variance，并使用 Central Limit Theorem 解释为什么 Gaussian 如此常见
- 使用数值稳定技巧（减去最大 logit）构建 softmax 和 log-softmax 函数
- 从 logits 计算 cross-entropy loss，并将其与 negative log-likelihood 联系起来

## 问题

一个 classifier 输出 `[0.03, 0.91, 0.06]`。一个 language model 从 50,000 个候选词中选择下一个词。一个 diffusion model 通过从学习到的 distributions 中采样生成图像。这些都是概率在发挥作用。

模型做出的每一次预测都是一个 probability distribution。每个 Loss function 都在衡量预测分布与真实分布之间的距离。每个训练步骤都会调整参数，让一个分布看起来更像另一个分布。没有概率，你就无法读懂任何一篇 ML paper，无法 debug 任何一个模型，也无法理解为什么训练 Loss 会变成 NaN。

## 概念

### Events、Sample Spaces 与 Probability

sample space S 是所有可能 outcomes 的集合。event 是 sample space 的一个子集。Probability 将 events 映射到 0 到 1 之间的数。

```
Coin flip:
  S = {H, T}
  P(H) = 0.5,  P(T) = 0.5

Single die roll:
  S = {1, 2, 3, 4, 5, 6}
  P(even) = P({2, 4, 6}) = 3/6 = 0.5
```

三个公理定义了整个概率体系：
1. 对任意 event A，P(A) >= 0
2. P(S) = 1（总会发生某件事）
3. 当 A 和 B 不能同时发生时，P(A or B) = P(A) + P(B)

其他所有内容（Bayes' theorem、expectations、distributions）都可以从这三条规则推出。

### Conditional Probability 与 Independence

P(A|B) 表示在 B 已经发生的条件下 A 发生的概率。

```
P(A|B) = P(A and B) / P(B)

Example: deck of cards
  P(King | Face card) = P(King and Face card) / P(Face card)
                      = (4/52) / (12/52)
                      = 4/12 = 1/3
```

当知道一个 event 对另一个 event 没有任何信息增益时，这两个 events 就是 independent：

```
Independent:   P(A|B) = P(A)
Equivalent to: P(A and B) = P(A) * P(B)
```

抛硬币是 independent 的。不放回抽牌则不是。

### Probability Mass Functions 与 Probability Density Functions

离散 random variables 有 probability mass function（PMF）。每个 outcome 都有一个可以直接读取的具体概率。

```
PMF: P(X = k)

Fair die:
  P(X = 1) = 1/6
  P(X = 2) = 1/6
  ...
  P(X = 6) = 1/6

  Sum of all probabilities = 1
```

连续 random variables 有 probability density function（PDF）。单个点处的 density 不是概率。概率来自对某个区间上的 density 进行积分。

```
PDF: f(x)

P(a <= X <= b) = integral of f(x) from a to b

f(x) can be greater than 1 (density, not probability)
integral from -inf to +inf of f(x) dx = 1
```

这个区别在 ML 中很重要。Classification 输出是 PMF（离散选择）。VAE latent spaces 使用 PDF（连续）。

### 常见 Distributions

**Bernoulli：** 一次试验，两个 outcomes。用于建模 binary classification。

```
P(X = 1) = p
P(X = 0) = 1 - p
Mean = p,  Variance = p(1-p)
```

**Categorical：** 一次试验，k 个 outcomes。用于建模 multi-class classification（softmax 输出）。

```
P(X = i) = p_i,  where sum of p_i = 1
Example: P(cat) = 0.7,  P(dog) = 0.2,  P(bird) = 0.1
```

**Uniform：** 所有 outcomes 等概率。用于随机初始化。

```
Discrete: P(X = k) = 1/n for k in {1, ..., n}
Continuous: f(x) = 1/(b-a) for x in [a, b]
```

**Normal（Gaussian）：** 钟形曲线。由 mean（mu）和 variance（sigma^2）参数化。

```
f(x) = (1 / sqrt(2*pi*sigma^2)) * exp(-(x - mu)^2 / (2*sigma^2))

Standard normal: mu = 0, sigma = 1
  68% of data within 1 sigma
  95% within 2 sigma
  99.7% within 3 sigma
```

**Poisson：** 固定区间内罕见事件的计数。用于建模事件发生率。

```
P(X = k) = (lambda^k * e^(-lambda)) / k!
Mean = lambda,  Variance = lambda
```

### Expected Value 与 Variance

Expected value 是 outcome 的加权平均。

```
Discrete:   E[X] = sum of x_i * P(X = x_i)
Continuous: E[X] = integral of x * f(x) dx
```

Variance 衡量围绕 mean 的离散程度。

```
Var(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2
Standard deviation = sqrt(Var(X))
```

在 ML 中，expected value 会以 Loss function 的形式出现（数据分布上的平均 Loss）。Variance 描述模型稳定性。Gradients 的 high variance 意味着训练噪声大。

### Joint 与 Marginal Distributions

joint distribution P(X, Y) 同时描述两个 random variables。

Joint PMF 示例（X = weather，Y = umbrella）：

| | Y=0（不带伞） | Y=1（带伞） | Marginal P(X) |
|---|---|---|---|
| X=0（晴天） | 0.40 | 0.10 | P(X=0) = 0.50 |
| X=1（下雨） | 0.05 | 0.45 | P(X=1) = 0.50 |
| **Marginal P(Y)** | P(Y=0) = 0.45 | P(Y=1) = 0.55 | 1.00 |

marginal distribution 会把另一个变量求和消去：

```
P(X = x) = sum over all y of P(X = x, Y = y)
```

上表中的行合计和列合计就是 marginals。

### 为什么 Normal Distribution 到处出现

Central Limit Theorem：许多 independent random variables 的和（或平均值）会收敛到 normal distribution，无论原始 distribution 是什么。

```
Roll 1 die:  uniform distribution (flat)
Average of 2 dice:  triangular (peaked)
Average of 30 dice: nearly perfect bell curve

This works for ANY starting distribution.
```

这就是为什么：
- 测量误差近似服从 normal distribution（许多小的 independent 来源）
- Neural Network 的权重初始化使用 normal distributions
- SGD 中的 Gradient noise 近似服从 normal distribution（许多样本 gradients 的和）
- 在给定 mean 和 variance 的条件下，normal distribution 是最大熵分布

### Log Probabilities

原始概率会引发数值问题。将许多很小的概率相乘会很快下溢为零。

```
P(sentence) = P(word1) * P(word2) * ... * P(word_n)
            = 0.01 * 0.003 * 0.02 * ...
            -> 0.0 (underflow after ~30 terms)
```

Log probabilities 可以解决这个问题。乘法变成加法。

```
log P(sentence) = log P(word1) + log P(word2) + ... + log P(word_n)
                = -4.6 + -5.8 + -3.9 + ...
                -> finite number (no underflow)
```

规则：
- log(a * b) = log(a) + log(b)
- log probabilities 总是 <= 0（因为 0 < P <= 1）
- 越负 = 越不可能
- Cross-entropy loss 是正确 class 的 negative log probability

### Softmax 作为 Probability Distribution

Neural Network 输出原始分数（logits）。Softmax 将它们转换为有效的 probability distribution。

```
softmax(z_i) = exp(z_i) / sum(exp(z_j) for all j)

Properties:
  - All outputs are in (0, 1)
  - All outputs sum to 1
  - Preserves relative ordering of inputs
  - exp() amplifies differences between logits
```

softmax 技巧：在 exponentiating 之前减去最大 logit，以防止 overflow。

```
z = [100, 101, 102]
exp(102) = overflow

z_shifted = z - max(z) = [-2, -1, 0]
exp(0) = 1  (safe)

Same result, no overflow.
```

Log-softmax 将 softmax 和 log 结合起来以获得数值稳定性。PyTorch 在内部用它来计算 cross-entropy loss。

### Sampling

Sampling 指从一个 distribution 中抽取随机值。在 ML 中：
- Dropout 会随机采样哪些 neurons 置零
- Data augmentation 会采样随机变换
- Language models 会从预测分布中采样下一个 Token
- Diffusion models 会采样 noise 并逐步 denoise

从任意 distributions 中采样需要 inverse transform sampling、rejection sampling 或 reparameterization trick（用于 VAEs）等技术。

## 构建它

### 步骤 1：概率基础

```python
import math
import random

def factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

def combinations(n, k):
    return factorial(n) // (factorial(k) * factorial(n - k))

def conditional_probability(p_a_and_b, p_b):
    return p_a_and_b / p_b

p_king_given_face = conditional_probability(4/52, 12/52)
print(f"P(King | Face card) = {p_king_given_face:.4f}")
```

### 步骤 2：从零实现 PMF 和 PDF

```python
def bernoulli_pmf(k, p):
    return p if k == 1 else (1 - p)

def categorical_pmf(k, probs):
    return probs[k]

def poisson_pmf(k, lam):
    return (lam ** k) * math.exp(-lam) / factorial(k)

def uniform_pdf(x, a, b):
    if a <= x <= b:
        return 1.0 / (b - a)
    return 0.0

def normal_pdf(x, mu, sigma):
    coeff = 1.0 / (sigma * math.sqrt(2 * math.pi))
    exponent = -0.5 * ((x - mu) / sigma) ** 2
    return coeff * math.exp(exponent)
```

### 步骤 3：Expected value 与 variance

```python
def expected_value(values, probabilities):
    return sum(v * p for v, p in zip(values, probabilities))

def variance(values, probabilities):
    mu = expected_value(values, probabilities)
    return sum(p * (v - mu) ** 2 for v, p in zip(values, probabilities))

die_values = [1, 2, 3, 4, 5, 6]
die_probs = [1/6] * 6
mu = expected_value(die_values, die_probs)
var = variance(die_values, die_probs)
print(f"Die: E[X] = {mu:.4f}, Var(X) = {var:.4f}, SD = {var**0.5:.4f}")
```

### 步骤 4：从 distributions 中采样

```python
def sample_bernoulli(p, n=1):
    return [1 if random.random() < p else 0 for _ in range(n)]

def sample_categorical(probs, n=1):
    cumulative = []
    total = 0
    for p in probs:
        total += p
        cumulative.append(total)
    samples = []
    for _ in range(n):
        r = random.random()
        for i, c in enumerate(cumulative):
            if r <= c:
                samples.append(i)
                break
    return samples

def sample_normal_box_muller(mu, sigma, n=1):
    samples = []
    for _ in range(n):
        u1 = random.random()
        u2 = random.random()
        z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
        samples.append(mu + sigma * z)
    return samples
```

### 步骤 5：Softmax 与 log probabilities

```python
def softmax(logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    exps = [math.exp(z) for z in shifted]
    total = sum(exps)
    return [e / total for e in exps]

def log_softmax(logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    log_sum_exp = max_logit + math.log(sum(math.exp(z) for z in shifted))
    return [z - log_sum_exp for z in logits]

def cross_entropy_loss(logits, target_index):
    log_probs = log_softmax(logits)
    return -log_probs[target_index]
```

### 步骤 6：Central Limit Theorem 演示

```python
def demonstrate_clt(dist_fn, n_samples, n_averages):
    averages = []
    for _ in range(n_averages):
        samples = [dist_fn() for _ in range(n_samples)]
        averages.append(sum(samples) / len(samples))
    return averages
```

### 步骤 7：可视化

```python
import matplotlib.pyplot as plt

xs = [mu + sigma * (i - 500) / 100 for i in range(1001)]
ys = [normal_pdf(x, mu, sigma) for x, mu, sigma in ...]
plt.plot(xs, ys)
```

包含全部可视化的完整实现位于 `code/probability.py`。

## 使用它

使用 NumPy 和 SciPy，上面的内容都可以一行完成：

```python
import numpy as np
from scipy import stats

normal = stats.norm(loc=0, scale=1)
samples = normal.rvs(size=10000)
print(f"Mean: {np.mean(samples):.4f}, Std: {np.std(samples):.4f}")
print(f"P(X < 1.96) = {normal.cdf(1.96):.4f}")

logits = np.array([2.0, 1.0, 0.1])
from scipy.special import softmax, log_softmax
probs = softmax(logits)
log_probs = log_softmax(logits)
print(f"Softmax: {probs}")
print(f"Log-softmax: {log_probs}")
```

你已经从零构建过这些内容。现在你知道 library 调用在做什么。

## 练习

1. 为 exponential distribution 实现 inverse transform sampling。通过采样 10,000 个值并将 histogram 与真实 PDF 对比来验证。

2. 为两个有偏骰子构建一个 joint distribution 表。计算 marginal distributions，并检查这两个骰子是否 independent。

3. 计算一个 5-class classifier 的 cross-entropy loss：它输出 logits `[2.0, 0.5, -1.0, 3.0, 0.1]`，正确 class 的 index 为 3。然后用 PyTorch 的 `nn.CrossEntropyLoss` 验证你的答案。

4. 编写一个函数，接收一组 log probabilities，并返回最可能的序列、total log probability，以及等价的原始概率。用一个 50 个词的句子测试它，其中每个词的概率都是 0.01。

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| Sample space | “所有可能性” | 实验中每个可能 outcome 构成的集合 S |
| PMF | “概率函数” | 给出每个离散 outcome 精确概率的函数，所有概率之和为 1 |
| PDF | “概率曲线” | 用于连续变量的 density function。对某个区间积分即可得到概率 |
| Conditional probability | “给定某事的概率” | P(A\|B) = P(A and B) / P(B)。Bayesian thinking 和 Bayes' theorem 的基础 |
| Independence | “它们互不影响” | P(A and B) = P(A) * P(B)。知道一个 event 对另一个没有任何信息增益 |
| Expected value | “平均值” | 所有 outcomes 的概率加权和。Loss function 就是一个 expected value |
| Variance | “分散程度” | 相对 mean 的 squared deviation 的期望。High variance = 噪声大、不稳定的估计 |
| Normal distribution | “钟形曲线” | f(x) = (1/sqrt(2*pi*sigma^2)) * exp(-(x-mu)^2/(2*sigma^2))。由于 CLT 而无处不在 |
| Central Limit Theorem | “平均值会变成 normal” | 无论来源如何，许多 independent samples 的 mean 都会收敛到 normal distribution |
| Joint distribution | “两个变量放在一起” | P(X, Y) 描述 X 和 Y outcomes 每一种组合的概率 |
| Marginal distribution | “把另一个变量求和消去” | P(X) = sum_y P(X, Y)。从 joint 中恢复单个变量的 distribution |
| Log probability | “概率的 log” | log P(x)。把乘积变成求和，避免长序列中的数值下溢 |
| Softmax | “把分数变成概率” | softmax(z_i) = exp(z_i) / sum(exp(z_j))。将实值 logits 映射为有效的 probability distribution |
| Cross-entropy | “Loss function” | -sum(p_true * log(p_predicted))。衡量两个 distributions 有多不同。越低越好 |
| Logits | “模型原始输出” | softmax 之前的未归一化分数。命名来自 logistic function |
| Sampling | “抽取随机值” | 按照 probability distribution 生成值。模型生成输出的方式 |

## 延伸阅读

- [3Blue1Brown: But what is the Central Limit Theorem?](https://www.youtube.com/watch?v=zeJD6dqJ5lo) - 关于为什么平均值会变成 normal 的可视化证明
- [Stanford CS229 Probability Review](https://cs229.stanford.edu/section/cs229-prob.pdf) - 覆盖本文及更多内容的精炼参考
- [The Log-Sum-Exp Trick](https://gregorygundersen.com/blog/2020/02/09/log-sum-exp/) - 为什么数值稳定性重要，以及如何实现它
