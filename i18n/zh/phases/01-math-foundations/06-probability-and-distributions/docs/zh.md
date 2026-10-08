# 概率和分布

> 概率是AI使用的表达不确定性的语言.

**Type:** 学习
**Language:**字符串
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~75 分钟

## 学习目标

- 从零实现伯诺利的类别的波森的统一和正常分布的PMF和PDF
- 计算预期值,并使用中央限量定理 解释为什么高斯人如此常见
- 使用数值稳定技巧(减去最大逻辑) 构建软max 和日志软max 函数
- 从逻辑计算交叉缩损失,并将其与负记载概率联系起来

## 问题

一个分类器 输出`[0.03, 0.91, 0.06]`△一个语言模型从50,000个候选词中选择下一个词――一个扩散模型通过从学习到的分布中采样生成图像――这些都是概率在发挥作用――

模型做出的每一次预测都是一个概率分布――每一个损失函数都在衡量预测分布与实际分布之间的距离――每一个训练步骤都会调整参数,让一个分布看起来更像另一个分布――没有概率,你就无法读任何一个ML论文,无法调试任何模型,也无法理解为什么训练损失会变成NaN――

## 概念

### 事件、样本空间与概率

样本空间 S 是所有可能的结果的集合――事件 是样本空间的一个子集――概率将事件映射到0到1之间的数量――

```
Coin flip:
  S = {H, T}
  P(H) = 0.5,  P(T) = 0.5

Single die roll:
  S = {1, 2, 3, 4, 5, 6}
  P(even) = P({2, 4, 6}) = 3/6 = 0.5
```

三个公理定义了整个概率体系:
1. 对任意事件 A,P(A) >= 0
2. 总会发生某事)
3. 当A 和B 不能同时发生时,P(A或B) =P(A) +P(B)

其他所有内容 ((贝斯定理,期望,分布) 都可以从这三条规则推出.

### 条件概率与独立性

 A  B) 表示在 B 已经发生的条件下 A 发生的概率

```
P(A|B) = P(A and B) / P(B)

Example: deck of cards
  P(King | Face card) = P(King and Face card) / P(Face card)
                      = (4/52) / (12/52)
                      = 4/12 = 1/3
```

当一个事件对另一个事件没有任何信息的增长时,

```
Independent:   P(A|B) = P(A)
Equivalent to: P(A and B) = P(A) * P(B)
```

抛硬币是独立的.

### 概率质量函数与概率密度函数

离散随机变量有概率质量函数 (PMF) .每个结果都有一个可以直接读取的具体概率.

```
PMF: P(X = k)

Fair die:
  P(X = 1) = 1/6
  P(X = 2) = 1/6
  ...
  P(X = 6) = 1/6

  Sum of all probabilities = 1
```

连续随机变量 有概率密度函数 (PDF) ⋅单个点的密度 不是概率.

```
PDF: f(x)

P(a <= X <= b) = integral of f(x) from a to b

f(x) can be greater than 1 (density, not probability)
integral from -inf to +inf of f(x) dx = 1
```

这个区别在 ML 中很重要. 类别输出是 PMF (离散选择) ⋅VAE 隐藏空间 使用 PDF (连续) ⋅

### 常见 分布

**Bernoulli：**一次试验,两个结果――用于建模二进制分类――

```
P(X = 1) = p
P(X = 0) = 1 - p
Mean = p,  Variance = p(1-p)
```

**Categorical：**一次试验,k 个结果――用于建模多类分类的类别(软最大输出)

```
P(X = i) = p_i,  where sum of p_i = 1
Example: P(cat) = 0.7,  P(dog) = 0.2,  P(bird) = 0.1
```

**Uniform：**所有结果等概率――用于随机初始化――

```
Discrete: P(X = k) = 1/n for k in {1, ..., n}
Continuous: f(x) = 1/(b-a) for x in [a, b]
```

**Normal（Gaussian）：**钟形曲线──由中意和变异

```
f(x) = (1 / sqrt(2*pi*sigma^2)) * exp(-(x - mu)^2 / (2*sigma^2))

Standard normal: mu = 0, sigma = 1
  68% of data within 1 sigma
  95% within 2 sigma
  99.7% within 3 sigma
```

**Poisson：**固定区间内罕见事件的计量――用于建模事件发生率――

```
P(X = k) = (lambda^k * e^(-lambda)) / k!
Mean = lambda,  Variance = lambda
```

### 预期值与变化

预期值是结果的加权平均量.

```
Discrete:   E[X] = sum of x_i * P(X = x_i)
Continuous: E[X] = integral of x * f(x) dx
```

差异量量度在平均分离程度.

```
Var(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2
Standard deviation = sqrt(Var(X))
```

在ML中,预期值会以损失函数的形式出现.

### 联合与边际分销

共同分布 P(X,Y) 同时描述两个随机变量──

联合 PMF示例 ((X = 天气,Y = 雨):

| | Y=0（不带伞） | Y=1（带伞） | Marginal P(X) |
|---|---|---|---|
| X=0（晴天） | 0.40 | 0.10 | P(X=0) = 0.50 |
| X=1（下雨） | 0.05 | 0.45 | P(X=1) = 0.50 |
| **Marginal P(Y)** | P(Y=0) = 0.45 | P(Y=1) = 0.55 | 1.00 |

边际分布会把另一个变量求和消去:

```
P(X = x) = sum over all y of P(X = x, Y = y)
```

上表中的行合计和列合计是边缘数.

### 为什么正常分布到处出现

中央限量定理:许多独立随机变量的和(或平均值) 将收到正常分布,无论原始分布是什么.

```
Roll 1 die:  uniform distribution (flat)
Average of 2 dice:  triangular (peaked)
Average of 30 dice: nearly perfect bell curve

This works for ANY starting distribution.
```

这就是为什么:
- 测量差差差近似从正常分布中得到了许多小的独立来源)
- 网络的权重初始化使用正常分布
- 中的渐变噪音近似服从正常分布的许多样本梯度的和)
- 在给定平均和差异的条件下,正常分布是最大的分布

### 记录概率

基本概率会引发数值问题.

```
P(sentence) = P(word1) * P(word2) * ... * P(word_n)
            = 0.01 * 0.003 * 0.02 * ...
            -> 0.0 (underflow after ~30 terms)
```

记载概率可以解决这个问题.

```
log P(sentence) = log P(word1) + log P(word2) + ... + log P(word_n)
                = -4.6 + -5.8 + -3.9 + ...
                -> finite number (no underflow)
```

规则:
- 标签: 标签: 标签: 标签:
- 总是 <= 0(因为 0 < P <= 1)
- 越负 = 越不可能
- 交叉缩损失是正确的类的负记录概率

### 软max 作为概率分布

网络输出原始分数 (logits) ‧软max将将它们转换为有效的概率分布‧

```
softmax(z_i) = exp(z_i) / sum(exp(z_j) for all j)

Properties:
  - All outputs are in (0, 1)
  - All outputs sum to 1
  - Preserves relative ordering of inputs
  - exp() amplifies differences between logits
```

技巧:在指数化之前减去最大的逻辑,以防止过剩.

```
z = [100, 101, 102]
exp(102) = overflow

z_shifted = z - max(z) = [-2, -1, 0]
exp(0) = 1  (safe)

Same result, no overflow.
```

软max 将软max 和 log 结合起来以获得数值稳定性. PyTorch 在内部使用它来计算跨损失.

### 采样

抽取随机值从一个分布中.
- 放弃会随时采用哪些神经元 置零
- 数据增强 会采样随着变化
- 语言模型 会从预测分布中采样下一个标志
- 扩散模型 会采样噪音并逐步指明

从任意分布中采样需要反转变样本采样,拒绝样本采样或重设方法 (用于VAE等技术).


```figure
gaussian-pdf
```

## 构建它

### 步骤1:概率基础

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

### 步骤2:从零实现PMF和PDF

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

### 步骤3:预期值与差异

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

### 步骤4:从分发中采样

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

### 步骤5:软max与日志概率

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

### 步骤 6:中央限量定理演示

```python
def demonstrate_clt(dist_fn, n_samples, n_averages):
    averages = []
    for _ in range(n_averages):
        samples = [dist_fn() for _ in range(n_samples)]
        averages.append(sum(samples) / len(samples))
    return averages
```

### 步骤 7:可视化

```python
import matplotlib.pyplot as plt

xs = [mu + sigma * (i - 500) / 100 for i in range(1001)]
ys = [normal_pdf(x, mu, sigma) for x, mu, sigma in ...]
plt.plot(xs, ys)
```

包含所有可视化的完整实现`code/probability.py`,我知道.

## 使用它

通过使用NumPy和SciPy,上面的内容可以完成:

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

你已经从零开始构建了这些内容.

## 练习

1. 通过采样10,000个值并将历史图与真实PDF对比进行验证.

2. 为两个有偏子构建一个共同分布 表――计算边际分布,并检查这两个子是否独立――

3. 计算一个5级分类器的交叉缩损失:它输出记录`[2.0, 0.5, -1.0, 3.0, 0.1]`现在,正确的类别是3......然后使用 PyTorch 的`nn.CrossEntropyLoss`验证你的答案.

4. 编写一个函数,接收一组记录概率,并返回最可能的序列,以及等价的原始概率. 用一个50个词的句子测试它,其中每个词的概率是0.01──

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

- [3Blue1Brown: But what is the Central Limit Theorem?](https://www.youtube.com/watch?v=zeJD6dqJ5lo)关于为什么平均值会变得正常的可视性证明
- [Stanford CS229 Probability Review](https://cs229.stanford.edu/section/cs229-prob.pdf)- 覆盖本文及更多内容精炼参考
- [The Log-Sum-Exp Trick](https://gregorygundersen.com/blog/2020/02/09/log-sum-exp/)- 为什么数值稳定性很重要,以及如何实现它
