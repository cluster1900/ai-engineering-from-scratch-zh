# 采样方法

> 采样是AI探索可能性空间的方法.

**Type:** Build
**Language:**字符串
**Prerequisites:** Phase 1, Lessons 06-07 (Probability, Bayes' Theorem)
**Time:** ~120 minutes

## 学习目标
- 仅使用统一的随机数,从零实现反向CDF、拒绝和重要性采样
- 为语言模型代号 生成构建温度、顶-k 和顶-p (核) 样本
- 解释重构化技巧以及为什么它可以在VAEs中让样本采集 支持反传播
- 运行 都市-哈斯廷斯 MCMC,从未归化目标分布中采样

## 问题
一个语言模型 完成处理你的提示后,会产生一个包含50,000个逻辑的矢量――词汇库中的每个符号对应一个――现在它必须选择一个――怎么选择?

如果它总是选择最高概率的代币,每次响应都会完全相同.确定,单调,无趣.如果它完全均随机选择,输出就会变成乱码.

采样不仅用于文本生成――强化学习 通过采样轨迹来估计政策梯度――VAE 通过从学习到分布中的采样并通过随机性进行后传播,来学习隐藏的表示――分散模型 通过采样噪音并代码来生成图像――蒙特卡洛方法 估计没有封闭形式的解决方案的积分――MCMC算法 探索无法举出高维后分布――

每个生成人工智能系统都是一个样本采集系统. 样本采集策略决定了输出的质量,多样性和可控性. 本课程将从零构建到每种主要样本采集方法,从统一的随机数量开始,直到现代的LLM和生成模型的技术.

## 概念
### 为什么样本采样是重要的

采样在人工智能和机器学习中承担四种基础角色:

**Generation.**通过采样产生输出. 采样算法直接控制创造性连贯性和多样性.

**Training.**史托卡斯式渐进降落会采样迷你批量―― 推进会采样要停止使用神经元―― 数据增强会采样随机转变―― 重要性采样会对样本重新加权,以后降低强化学习 (PPO,TRPO) 中的渐进差距――

**Estimation.**在ML中很多量没有封闭形式的解决方案――数据分布上的期望 损失――基于能量的模型的分区函数――贝叶斯推理中证据――蒙特卡洛估计通过样本寻求平均来近似所有这些量――

**Exploration.**在贝耶斯推理中探索后续分布――进化策略 会采样参数扰乱――普森采样在盗中平衡探索和利用――

核心挑战是:你只能直接从简单分布中抽样 (统一,正常) .

### 统一的随机抽样

每种样本采集方法都从这里开始. 统一的随机数生成器会在 [0, 1) 中产生数值,其中任意等长子区间都有相等概率.

```
U ~ Uniform(0, 1)

P(a <= U <= b) = b - a    for 0 <= a <= b <= 1

Properties:
  E[U] = 0.5
  Var(U) = 1/12
```

要从 n个项目中分散集合中均抽样,生成 U 并返回地板(n * U) ――要从连续区间 [a, b] 中抽样,计算 a + (b - a) * U。

关键洞察:单个统一的随机数恰好包含在任意分布中生成一个样本的随机性.

### 逆转CDF方法 (逆转转换样本采样)

累积分布函数 (CDF) 会把数值映射到概率:

```
F(x) = P(X <= x)

Properties:
  F is non-decreasing
  F(-inf) = 0
  F(+inf) = 1
  F maps the real line to [0, 1]
```

如果 U ~ 均的(0, 1),那么 X = F_inverse(U) 服从目标分布──

```
Algorithm:
  1. Generate u ~ Uniform(0, 1)
  2. Return F_inverse(u)

Why it works:
  P(X <= x) = P(F_inverse(U) <= x) = P(U <= F(x)) = F(x)
```

**Exponential distribution 示例：**

```
PDF: f(x) = lambda * exp(-lambda * x),   x >= 0
CDF: F(x) = 1 - exp(-lambda * x)

Solve F(x) = u for x:
  u = 1 - exp(-lambda * x)
  exp(-lambda * x) = 1 - u
  x = -ln(1 - u) / lambda

Since (1 - U) and U have the same distribution:
  x = -ln(u) / lambda
```

当你能写出封闭形式的F_inverse 时,这种方法效果完美――对于正常分布,没有封闭形式的反向CDF,因此我们使用其他方法 ((Box-Muller,或数值近似) 』――

**离散版本：**对于分离分布,把CDF构成累积数,生成U,然后找到累积数超过U的第一个指数.`sample_categorical`的工作方式.

### 拒绝样本

当你不能反转CDF,但可以在不同的常数的情况下评估目标 PDF 时,拒绝样本就可用.

```
Target distribution: p(x)  (can evaluate, possibly unnormalized)
Proposal distribution: q(x)  (can sample from)
Bound: M such that p(x) <= M * q(x) for all x

Algorithm:
  1. Sample x ~ q(x)
  2. Sample u ~ Uniform(0, 1)
  3. If u < p(x) / (M * q(x)), accept x
  4. Otherwise, reject and go to step 1

Acceptance rate = 1/M
```

在高维中,接受率会下降,因为大部分的提案量都会被拒绝.

**示例：从 truncated normal 中 sampling。**在缩小范围上使用统一的建议──包裹M是该区间正常的 PDF 的最大值──

**示例：从 semicircle 中 sampling。**在边缘矩形中均的提案.如果点落在半圆内,则接受.

### 重要性样本

有时你不需要来自目标分布 p(x) 的样本――你需要估计下面的期望,而且你有来自另一个分布 q(x) 的样本――

```
Goal: estimate E_p[f(x)] = integral of f(x) * p(x) dx

Rewrite:
  E_p[f(x)] = integral of f(x) * (p(x)/q(x)) * q(x) dx
            = E_q[f(x) * w(x)]

where w(x) = p(x) / q(x)  are the importance weights.

Estimator:
  E_p[f(x)] ~ (1/N) * sum(f(x_i) * w(x_i))    where x_i ~ q(x)
```

在加强学习中非常关键. 在PPO (近距离政策优化) 中,你在旧政策中收集轨迹,但希望优化新政策 pi_new──重要重量是 pi_news) / pi_olds.

重要性采样估计器的差异取决于q与p的相似程度. 如果q与p非常不同,少数样本会获得巨大的重量并主导估计.

```
E_p[f(x)] ~ sum(w_i * f(x_i)) / sum(w_i)
```

### 蒙特卡罗估计

通过随机样本的蒙特卡罗估计 求平均来近似积分――大数的定律保证其收──

```
Goal: estimate I = integral of g(x) dx over domain D

Method:
  1. Sample x_1, ..., x_N uniformly from D
  2. I ~ (Volume of D / N) * sum(g(x_i))

Error: O(1 / sqrt(N))   regardless of dimension
```

误差率与维度无关. 这就是为什么在高维场景中,蒙特卡洛方法占据了主导地位.

**估计 pi：**

```
Sample (x, y) uniformly from [-1, 1] x [-1, 1]
Count how many fall inside the unit circle: x^2 + y^2 <= 1
pi ~ 4 * (count inside) / (total count)
```

**估计期望：**

```
E[f(X)] ~ (1/N) * sum(f(x_i))    where x_i ~ p(x)

The sample mean converges to the true expectation.
Variance of the estimator = Var(f(X)) / N
```

### 马科夫链蒙特卡罗 (MCMC):大都会-哈斯廷斯

 MCMC 构建一个马科夫链,使其静止分布是目标分布 p(x) ・经过足够多步后,链中样本就像是来自 p(x) 的样本.

```
Target: p(x)  (known up to a normalizing constant)
Proposal: q(x'|x)  (how to propose the next state given the current state)

Metropolis-Hastings algorithm:
  1. Start at some x_0
  2. For t = 1, 2, ..., T:
     a. Propose x' ~ q(x'|x_t)
     b. Compute acceptance ratio:
        alpha = [p(x') * q(x_t|x')] / [p(x_t) * q(x'|x_t)]
     c. Accept with probability min(1, alpha):
        - If u < alpha (u ~ Uniform(0,1)): x_{t+1} = x'
        - Otherwise: x_{t+1} = x_t
  3. Discard first B samples (burn-in)
  4. Return remaining samples
```

对于对称性提案 (q) 对于对称性提案 (q) 对于对称性提案 (q) 对于对称性提案 (q) 对于对称性提案 (q) 对于对称性提案 (q) 对于对称性提案 (q) 对称性建议 (q) 对称性比 (q) 对称性比 (q) 对称性比 (q) 对称性比 (q) 对称性比 (q) 对称性比 (q) 对称性比 (q) 对称性比 (q) 对称性比 (q) 对称性比 (q) 对称性比 (q) 对称性比 (q) 对于对称性比 (q) 对于对称性比 (x) 对于对称性比 (x) 对于对称性比 (x) 对于对称性比 (x) 对于对称性比 (x) 对于对称性比) 则是原始的 Metropolis算法 ()

**为什么有效。**接受规则保证详细平衡:处于 x 并移动到 x 的概率,等于处于 x 并移动到 x 的概率.

**实践注意事项：**
- 燃烧:在链中 达到平衡 之前丢弃早期样本
- 稀释:每隔一个样本保留一个,以减少自动相关性
- 太小会让链 移动缓慢(高接受,缓慢探索);太大会让大多数提案被拒绝(低接受,停留)
- 高维中高斯人的最佳接受率约为0.234

### 吉布斯样本

吉布斯样本采集是多变量分布的特殊MCMC. 它不是一次性提出所有维度的移动,而是每次从条件分布更新一个变量.

```
Target: p(x_1, x_2, ..., x_d)

Algorithm:
  For each iteration t:
    Sample x_1^{t+1} ~ p(x_1 | x_2^t, x_3^t, ..., x_d^t)
    Sample x_2^{t+1} ~ p(x_2 | x_1^{t+1}, x_3^t, ..., x_d^t)
    ...
    Sample x_d^{t+1} ~ p(x_d | x_1^{t+1}, x_2^{t+1}, ..., x_{d-1}^{t+1})
```

基布斯的样本取样需要你从每个条件分布中取样.
- 贝叶斯网络:从图结构的条件
- 斯混合物:条件是斯
- 单轮模型:每个旋转的条件只依赖于其邻居

接受率总是1 (每一个提案都被接受),因为从精确的条件采样会自动满足详细的平衡.

**局限。**当变量高度相关时,吉布斯的样本混合速度很慢,因为一次更新一个变量无法在分布中做出大 diagonal 动作.

### 温度样本采用 (用于LLM)

语言模型 会为词汇 中每个代号输出 logits z_1, ..., z_V──软max 会把它们转换为概率──温度 会在软max 前重新缩放 logits:

```
p_i = exp(z_i / T) / sum(exp(z_j / T))

T = 1.0: standard softmax (original distribution)
T -> 0:  argmax (deterministic, always picks highest logit)
T -> inf: uniform (all tokens equally likely)
T < 1.0: sharpens the distribution (more confident, less diverse)
T > 1.0: flattens the distribution (less confident, more diverse)
```

**为什么有效。**如果z_1 = 2且z_2 = 1,用T = 0.5 除后得到z_1/T = 4 和z_2/T = 2,使差距变大.经过软max 之后,最高的logit的代币会获得更大的概率份额.

**实践中：**
- 率为0.0:贪的解码,最适合事实型问答
- 适合代码生成的创意性
- 率: 0.7-1.0:平衡,适合一般对话
- 创意写作,大脑风暴
- 越来越随机,通常很少有用

温度不会改变任何代币是可能的. 它改变分配给每个代币的概率量.

### 顶部样本

顶级k样本会将选项集合限制在最高概率的 k 个标志,然后重新归结并从该受限集合中样本.

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Keep only the top k tokens
  4. Renormalize: p_i' = p_i / sum(p_j for j in top-k)
  5. Sample from the renormalized distribution

k = 1:  greedy decoding
k = V:  no filtering (standard sampling)
k = 40: typical setting, removes long tail of unlikely tokens
```

问题在于:无论上下文如何,k 都是固定的. 当模型很有把握时,k = 40 仍然允许 39 个替代项. 当模型不确定时,k = 40 个截止合理选择.

### 顶部 (核) 样本

顶部p样本集 会动态调整候选集合大小――它不是保留固定数量的代币,而是保留累计概率超过p的最小代币集――

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Find smallest k such that sum of top-k probabilities >= p
  4. Keep only those k tokens
  5. Renormalize and sample

p = 0.9:  keeps tokens covering 90% of probability mass
p = 1.0:  no filtering
p = 0.1:  very restrictive, nearly greedy
```

当模型很有把握时,核样本会保留很少的标志(可能2-3个) ・当模型不确定时,它会保留很多(可能200个) ・这种自适应行为是核样本的原因通常比上层生成更好文本的原因――

**常见组合：**
- 温度0.7+上层p0.9:良好的通用设置
- 温度0.0 (贪):最适合确定性任务
- 温度 1.0 + 顶级50:Fan et al. (2018) 原论文设置

顶-k 和顶-p 可以组合――先应用 top-k,再在剩余集合上应用 top-p――

### 修复法 (用于 VAEs)

变化自动编码器 (VAE) 的学习方式是:把输入编码成隐藏空间中的分布,从该分布中采样,然后把样本解码回来.问题是:你不能通过采样操作进行反扩散.

```
Standard sampling (not differentiable):
  z ~ N(mu, sigma^2)

  The randomness blocks gradient flow.
  d/d_mu [sample from N(mu, sigma^2)] = ???
```

复制化技巧将随机性与参数分离:

```
Reparameterized sampling:
  epsilon ~ N(0, 1)          (fixed random noise, no parameters)
  z = mu + sigma * epsilon   (deterministic function of parameters)

  Now z is a deterministic, differentiable function of mu and sigma.
  d(z)/d(mu) = 1
  d(z)/d(sigma) = epsilon

  Gradients flow through mu and sigma.
```

这之所以有效,是因为N(mu,sigma^2) 与mu +sigma *N(0,1) 具有相同的分布.关键洞察是:把随机性移动到一个无参数源 (epsilon),然后把表示样本为参数可微转化.

**在 VAE training loop 中：**
1. 编码器为每一个输入输出 mu 和 log(sigma^2)
2. 样本 (N(0,1)
3. 计算 z = mu + sigma * epsilon
4. 解码 z 以重建输入
5. 通过步骤 4、3、2、1 进行反扩散(可行,因为步骤 3 是可微的)

没有重构化技巧,VAE就无法使用标准的反扩散训练.

### 贝尔-软max(可微的类型样本)

对于分离类分布,我们需要另一种方法.

**Gumbel-Max trick（不可微）：**

```
To sample from a categorical distribution with log-probabilities log(p_1), ..., log(p_k):
  1. Sample g_i ~ Gumbel(0, 1) for each category
     (g = -log(-log(u)), where u ~ Uniform(0, 1))
  2. Return argmax(log(p_i) + g_i)

This produces exact categorical samples.
```

**Gumbel-Softmax（可微近似）：**

```
Replace the hard argmax with a soft softmax:
  y_i = exp((log(p_i) + g_i) / tau) / sum(exp((log(p_j) + g_j) / tau))

tau (temperature) controls the approximation:
  tau -> 0:  approaches a one-hot vector (hard categorical)
  tau -> inf: approaches uniform (1/k, 1/k, ..., 1/k)
  tau = 1.0: soft approximation
```

在训练中,你可以使用"直径"估计器:前进传输 使用硬 argmax,但倒退传输 使用软 Gumbel-Softmax梯度。

**应用：**
- 间 VAEs 的隐形变量
- 选择离散操作)
- 硬注意力机制
- 带离散行动的强化学习

### 层次采样

标准蒙特卡罗采样可能是由于随机性在样本空间中留下空缺.

```
Standard Monte Carlo:
  Sample N points uniformly from [0, 1]
  Some regions may have clusters, others gaps

Stratified sampling:
  Divide [0, 1] into N equal strata: [0, 1/N), [1/N, 2/N), ..., [(N-1)/N, 1)
  Sample one point uniformly within each stratum
  x_i = (i + u_i) / N   where u_i ~ Uniform(0, 1),  i = 0, ..., N-1
```

与蒙特卡罗标准相比, 聚合式采样的差距总是较低或相等:

```
Var(stratified) <= Var(standard Monte Carlo)

The improvement is largest when f(x) varies smoothly.
For piecewise-constant functions, stratified sampling is exact.
```

**应用：**
- 数字整合 (马尔卡罗)
- 培训数据分开,确保每个层中的类平衡)
- 带层次化的重要性采样 (组合两种技术)
- 沿着摄像头射线使用层次采样

### 连接到扩散模型

通过采样过程生成图像――前进过程 会在T 步中向图像添加高斯噪音,直到它变成纯噪音――反转过程 学习毁,逐步恢复原始图像――

```
Forward process (known):
  x_t = sqrt(alpha_t) * x_{t-1} + sqrt(1 - alpha_t) * epsilon
  where epsilon ~ N(0, I)

  After T steps: x_T ~ N(0, I)  (pure noise)

Reverse process (learned):
  x_{t-1} = (1/sqrt(alpha_t)) * (x_t - (1 - alpha_t)/sqrt(1 - alpha_bar_t) * epsilon_theta(x_t, t)) + sigma_t * z
  where z ~ N(0, I)

  Each denoising step is a sampling step.
```

与本课程的联系:
- 每个指责步骤都使用重设方法 (样本噪音,应用定性转换)
- 控制一种温度调节
- 训练使用蒙特卡罗估计 来近似 ELBO (证据下限)
- 扩散模型中的祖先采样是一个马科夫链 (每一步只依赖于当前状态)

整个图像生成过程都是反复采样:从噪音开始,在每一步中,基于学到的指责模型,


```figure
monte-carlo-pi
```

## 构建它
### 步骤1:统一和反向的CDF样本采集

```python
import math
import random

def sample_uniform(a, b):
    return a + (b - a) * random.random()

def sample_exponential_inverse_cdf(lam):
    u = random.random()
    return -math.log(u) / lam
```

生成10,000个指数样本并验证平均值为1/lambda──

### 步骤2:拒绝采样

```python
def rejection_sample(target_pdf, proposal_sample, proposal_pdf, M):
    while True:
        x = proposal_sample()
        u = random.random()
        if u < target_pdf(x) / (M * proposal_pdf(x)):
            return x
```

使用拒绝样本从截断的正常分布中抽样――通过对样本的绘制历史图 来验证形状――

### 步骤3:重要性采样

```python
def importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n):
    total = 0
    for _ in range(n):
        x = proposal_sample()
        w = target_pdf(x) / proposal_pdf(x)
        total += f(x) * w
    return total / n
```

使用统一提案 估计正常分布 下的 E[X^2]──与已知答案 ((mu^2 + sigma^2) 比较──

### 步骤 4:蒙特卡罗估计 pi

```python
def monte_carlo_pi(n):
    inside = 0
    for _ in range(n):
        x = random.uniform(-1, 1)
        y = random.uniform(-1, 1)
        if x*x + y*y <= 1:
            inside += 1
    return 4 * inside / n
```

### 步骤5: 都市-哈斯廷斯 MCMC

```python
def metropolis_hastings(target_log_pdf, proposal_sample, proposal_log_pdf, x0, n_samples, burn_in):
    samples = []
    x = x0
    for i in range(n_samples + burn_in):
        x_new = proposal_sample(x)
        log_alpha = (target_log_pdf(x_new) + proposal_log_pdf(x, x_new)
                     - target_log_pdf(x) - proposal_log_pdf(x_new, x))
        if math.log(random.random()) < log_alpha:
            x = x_new
        if i >= burn_in:
            samples.append(x)
    return samples
```

从二模分布 (两个高素的混合物) 中采样――可视化链的轨迹――

### 步骤 6:吉布斯样本

```python
def gibbs_sampling_2d(conditional_x_given_y, conditional_y_given_x, x0, y0, n_samples, burn_in):
    x, y = x0, y0
    samples = []
    for i in range(n_samples + burn_in):
        x = conditional_x_given_y(y)
        y = conditional_y_given_x(x)
        if i >= burn_in:
            samples.append((x, y))
    return samples
```

### 步骤 7:温度采样

```python
def softmax(logits):
    max_l = max(logits)
    exps = [math.exp(z - max_l) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

def temperature_sample(logits, temperature):
    scaled = [z / temperature for z in logits]
    probs = softmax(scaled)
    return sample_from_probs(probs)
```

展示温度 如何改变一组标记记录的输出分布──

### 步骤 8: 顶部和顶部采样

```python
def top_k_sample(logits, k):
    indexed = sorted(enumerate(logits), key=lambda x: -x[1])
    top = indexed[:k]
    top_logits = [l for _, l in top]
    probs = softmax(top_logits)
    idx = sample_from_probs(probs)
    return top[idx][0]

def top_p_sample(logits, p):
    probs = softmax(logits)
    indexed = sorted(enumerate(probs), key=lambda x: -x[1])
    cumsum = 0
    selected = []
    for token_idx, prob in indexed:
        cumsum += prob
        selected.append((token_idx, prob))
        if cumsum >= p:
            break
    sel_probs = [pr for _, pr in selected]
    total = sum(sel_probs)
    sel_probs = [pr / total for pr in sel_probs]
    idx = sample_from_probs(sel_probs)
    return selected[idx][0]
```

### 步骤 9: 修复尺寸化技巧

```python
def reparam_sample(mu, sigma):
    epsilon = random.gauss(0, 1)
    return mu + sigma * epsilon

def reparam_gradient(mu, sigma, epsilon):
    dz_dmu = 1.0
    dz_dsigma = epsilon
    return dz_dmu, dz_dsigma
```

演示 梯度可以穿过重构样本流动,但不能穿过直接样本流动.

### 步骤 10: 贝尔-软max

```python
def gumbel_sample():
    u = random.random()
    return -math.log(-math.log(u))

def gumbel_softmax(logits, temperature):
    gumbels = [math.log(p) + gumbel_sample() for p in logits]
    return softmax([g / temperature for g in gumbels])
```

展示降温 如何让输出接近一个热向量.

完整实现和所有可视化都在`code/sampling.py`在中.

## 使用它
使用NumPy 和SciPy 时,制作版本如下:

```python
import numpy as np

rng = np.random.default_rng(42)

exponential_samples = rng.exponential(scale=2.0, size=10000)
print(f"Exponential mean: {exponential_samples.mean():.4f} (expected 2.0)")

from scipy import stats
normal = stats.norm(loc=0, scale=1)
print(f"CDF at 1.96: {normal.cdf(1.96):.4f}")
print(f"Inverse CDF at 0.975: {normal.ppf(0.975):.4f}")

logits = np.array([2.0, 1.0, 0.5, 0.1, -1.0])
temperature = 0.7
scaled = logits / temperature
probs = np.exp(scaled - scaled.max()) / np.exp(scaled - scaled.max()).sum()
token = rng.choice(len(logits), p=probs)
print(f"Sampled token index: {token}")
```

对于大规模的MCMC,使用专门库:
- PyMC:使用 NUTS (适应性HMC) 的完整贝耶斯模型
- 组合MCMC样品
- 编码/JAX:GPU加速 MCMC

你已经从零开始构建了这些方法.

## 练习
1. 为缓慢分布实现反向CDF采样――CDF是F(x) =0.5+ arctan(x)/pi──生成10,000个样本,并把历史图与真实的PDF图画在一起――注意重尾 (重尾)

2. 使用拒绝样本,通过统一的(0, 1) 提案 从 Beta(2, 5) 分布 生成样本──把接受的样本与真实Beta PDF 画在一起──理论接受率是多少?

3. 使用蒙特卡罗,使用1000、10,000 和100,000 个样本 估计罪 (x) 从0到pi的积分――比较每个级别的误差――验证误差按O(1/sqrt(N)) 缩放――

4. 实现大都会-哈斯廷斯,从2D分布中采样,其中 p(x,y) 与 exp(-(x^2 * y^2 + x^2 + y^2 - 8*x - 8*y) / 2);;绘制样本 和链路轨迹──尝试不同的提案标准偏差──

5. 构建一个完整的文本生成演示:给定一个包含10个词和符号的词汇,使用 (a) 贪、(b) 温度=0.7、((c) 顶-k=3、((d) 顶-p=0.9 生成长度为20个符号的序列──比较 5 次运行中输出多样性──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Sampling | “抽取随机值” | 按照 probability distribution 生成数值。所有 generative AI 背后的机制 |
| Uniform distribution | “所有值同等可能” | [a, b] 中每个值都有相同 probability density 1/(b-a)。所有 sampling methods 的起点 |
| Inverse CDF | “概率变换” | F_inverse(U) 会把 uniform sample 转换成来自任意已知 CDF 分布的 sample。精确且高效 |
| Rejection sampling | “提出并接受/拒绝” | 从简单 proposal 中生成，按 target/proposal ratio 成比例的概率接受。精确但浪费 samples |
| Importance sampling | “重新加权 samples” | 使用来自 q(x) 的 samples，通过用 p(x)/q(x) 加权每个 sample，估计 p(x) 下的期望。RL 中 PPO 的核心 |
| Monte Carlo | “平均 random samples” | 将积分近似为 sample averages。误差 O(1/sqrt(N))，与维度无关 |
| MCMC | “会收敛的 random walk” | 构造一个 Markov chain，使其 stationary distribution 是目标分布。Metropolis-Hastings 是基础算法 |
| Metropolis-Hastings | “接受上坡，有时接受下坡” | 提出 moves，基于 density ratio 接受。Detailed balance 确保收敛到目标分布 |
| Gibbs sampling | “一次一个 variable” | 在固定其他 variables 的情况下，从每个 variable 的 conditional distribution 中更新。Acceptance rate 为 100% |
| Temperature | “置信度旋钮” | 在 softmax 前用 T 除以 logits。T<1 使分布更尖锐（更自信），T>1 使分布更平坦（更多样） |
| Top-k sampling | “保留最好的 k 个” | 除概率最高的 k 个 Token 外全部置零，重新归一化，然后 sampling。候选集合大小固定 |
| Nucleus sampling (top-p) | “保留可能性高的那些” | 保留累计概率超过 p 的最小 Token 集合。候选集合大小自适应 |
| Reparameterization trick | “把随机性移到外部” | 写成 z = mu + sigma * epsilon，其中 epsilon ~ N(0,1)。让 sampling 可微。VAE training 的关键 |
| Gumbel-Softmax | “软 categorical sampling” | 使用 Gumbel noise + 带 temperature 的 softmax，对 categorical sampling 做可微近似 |
| Stratified sampling | “强制覆盖” | 把 sample space 分成 strata，并从每个 stratum 中 sampling。方差总是低于 naive Monte Carlo |
| Burn-in | “预热期” | 在 chain 达到其 stationary distribution 之前丢弃的初始 MCMC samples |
| Detailed balance | “可逆性条件” | p(x) * T(x->y) = p(y) * T(y->x)。这是 p 成为 Markov chain stationary distribution 的充分条件 |
| Diffusion sampling | “迭代 denoising” | 从 noise 开始，并应用学到的 denoising steps 来生成数据。每一步都是 conditional sampling operation |

## 延伸阅读
- [Holbrook (2023): The Metropolis-Hastings Algorithm](https://arxiv.org/abs/2304.07010)- 关于MCMC基础的详细教程
- [Jang, Gu, Poole (2017): Categorical Reparameterization with Gumbel-Softmax](https://arxiv.org/abs/1611.01144)- 原始 甘贝尔-软max论文
- [Holtzman et al. (2020): The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)- 核 (上) 样本采集论文
- [Kingma & Welling (2014): Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)- 介绍重构化技巧的VAE论文
- [Ho, Jain, Abbeel (2020): Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)- 查将与图像生成联系
