# Sampling Methods

> Sampling 是 AI 探索可能性空间的方式。

**Type:** Build
**Language:** Python
**Prerequisites:** Phase 1, Lessons 06-07 (Probability, Bayes' Theorem)
**Time:** ~120 minutes

## 学习目标
- 仅使用 uniform random numbers，从零实现 inverse CDF、rejection 和 importance sampling
- 为 language model Token 生成构建 temperature、top-k 和 top-p (nucleus) sampling
- 解释 reparameterization trick，以及它为什么能在 VAEs 中让 sampling 支持 Backpropagation
- 运行 Metropolis-Hastings MCMC，从未归一化的目标分布中 sampling

## 问题
一个 language model 完成对你的 prompt 的处理后，会产生一个包含 50,000 个 logits 的 Vector。Vocabulary 中的每个 Token 对应一个。现在它必须选出一个。怎么选？

如果它总是选择概率最高的 Token，每次响应都会完全相同。确定、单调、无趣。如果它完全均匀随机选择，输出就会变成乱码。答案位于这两个极端之间，而这个位置由 sampling 控制。

Sampling 不只用于文本生成。Reinforcement Learning 通过 sampling trajectories 来估计 policy gradients。VAEs 通过从学习到的分布中 sampling 并穿过随机性进行 Backpropagation，来学习 latent representations。Diffusion models 通过 sampling noise 并迭代 denoising 来生成图像。Monte Carlo methods 估计没有 closed-form solution 的积分。MCMC algorithms 探索无法枚举的高维 posterior distributions。

每个 generative AI system 都是一个 sampling system。Sampling strategy 决定输出的质量、多样性和可控性。本课会从零构建每一种主要 sampling method，从 uniform random numbers 开始，直到支撑现代 LLMs 和 generative models 的技术。

## 概念
### Why Sampling Matters

Sampling 在 AI 和 Machine Learning 中承担四种基础角色：

**Generation.** Language models、diffusion models 和 GANs 都通过 sampling 产生输出。Sampling algorithm 直接控制创造性、连贯性和多样性。Temperature、top-k 和 nucleus sampling 是工程师每天都会调整的旋钮。

**Training.** Stochastic Gradient Descent 会 sampling mini-batches。Dropout 会 sampling 要停用的 neurons。Data augmentation 会 sampling random transformations。Importance sampling 会对样本重新加权，以降低 Reinforcement Learning (PPO, TRPO) 中的 Gradient 方差。

**Estimation.** ML 中很多量没有 closed-form solution。数据分布上的期望 Loss、energy-based model 的 partition function、Bayesian inference 中的 evidence。Monte Carlo estimation 通过对 samples 求平均来近似所有这些量。

**Exploration.** MCMC algorithms 在 Bayesian inference 中探索 posterior distributions。Evolutionary strategies 会 sampling parameter perturbations。Thompson sampling 在 bandits 中平衡 exploration 和 exploitation。

核心挑战是：你只能直接从简单分布中 sampling（uniform、normal）。对于其他所有分布，你都需要一种方法，把简单 samples 转换成来自目标分布的 samples。

### Uniform Random Sampling

每种 sampling method 都从这里开始。Uniform random number generator 会在 [0, 1) 中产生数值，其中任意等长子区间都有相等概率。

```
U ~ Uniform(0, 1)

P(a <= U <= b) = b - a    for 0 <= a <= b <= 1

Properties:
  E[U] = 0.5
  Var(U) = 1/12
```

要从 n 个 item 的离散集合中 uniform sampling，生成 U 并返回 floor(n * U)。要从连续区间 [a, b] 中 sampling，计算 a + (b - a) * U。

关键洞察：单个 uniform random number 恰好包含从任意分布中生成一个 sample 所需的随机性。技巧在于找到正确的 transformation。

### Inverse CDF Method (Inverse Transform Sampling)

Cumulative distribution function (CDF) 会把数值映射到概率：

```
F(x) = P(X <= x)

Properties:
  F is non-decreasing
  F(-inf) = 0
  F(+inf) = 1
  F maps the real line to [0, 1]
```

Inverse CDF 会把概率映射回数值。如果 U ~ Uniform(0, 1)，那么 X = F_inverse(U) 服从目标分布。

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

当你能写出 closed form 的 F_inverse 时，这种方法效果完美。对于 normal distribution，不存在 closed-form inverse CDF，因此我们使用其他方法（Box-Muller，或 numerical approximation）。

**离散版本：** 对于 discrete distributions，把 CDF 构建为 cumulative sum，生成 U，然后找到 cumulative sum 超过 U 的第一个 index。这就是 Lesson 06 中 `sample_categorical` 的工作方式。

### Rejection Sampling

当你不能反转 CDF，但可以在差一个常数的情况下评估目标 PDF 时，rejection sampling 就可用。

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

Bound M 越紧，acceptance rate 越高。在低维（1-3）中，rejection sampling 效果很好。在高维中，acceptance rate 会指数级下降，因为 proposal volume 的大部分都会被拒绝。这就是 rejection sampling 的 curse of dimensionality。

**示例：从 truncated normal 中 sampling。** 在 truncated range 上使用 uniform proposal。Envelope M 是该区间内 normal PDF 的最大值。

**示例：从 semicircle 中 sampling。** 在 bounding rectangle 中 uniform proposal。如果点落在 semicircle 内，则接受。这就是 Monte Carlo 计算 pi 的方式：acceptance rate 等于面积比 pi/4。

### Importance Sampling

有时你不需要来自目标分布 p(x) 的 samples。你需要估计 p(x) 下的期望，并且你有来自另一个分布 q(x) 的 samples。

```
Goal: estimate E_p[f(x)] = integral of f(x) * p(x) dx

Rewrite:
  E_p[f(x)] = integral of f(x) * (p(x)/q(x)) * q(x) dx
            = E_q[f(x) * w(x)]

where w(x) = p(x) / q(x)  are the importance weights.

Estimator:
  E_p[f(x)] ~ (1/N) * sum(f(x_i) * w(x_i))    where x_i ~ q(x)
```

这在 Reinforcement Learning 中非常关键。在 PPO (Proximal Policy Optimization) 中，你在旧 policy pi_old 下收集 trajectories，但希望优化新的 policy pi_new。Importance weight 是 pi_new(a|s) / pi_old(a|s)。PPO 会 clip 这些 weights，防止新 policy 偏离旧 policy 太远。

Importance sampling estimator 的方差取决于 q 与 p 的相似程度。如果 q 与 p 非常不同，少数 samples 会得到巨大的 weights 并主导估计。Self-normalized importance sampling 会除以 weights 的总和，以减轻这个问题：

```
E_p[f(x)] ~ sum(w_i * f(x_i)) / sum(w_i)
```

### Monte Carlo Estimation

Monte Carlo estimation 通过对 random samples 求平均来近似积分。Law of large numbers 保证其收敛。

```
Goal: estimate I = integral of g(x) dx over domain D

Method:
  1. Sample x_1, ..., x_N uniformly from D
  2. I ~ (Volume of D / N) * sum(g(x_i))

Error: O(1 / sqrt(N))   regardless of dimension
```

误差率与维度无关。这就是为什么在 grid-based integration 不可能实现的高维场景中，Monte Carlo methods 占据主导地位。

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

### Markov Chain Monte Carlo (MCMC)：Metropolis-Hastings

MCMC 构造一个 Markov chain，使其 stationary distribution 是目标分布 p(x)。经过足够多步之后，chain 中的 samples 就（近似）是来自 p(x) 的 samples。

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

对于 symmetric proposals（q(x'|x) = q(x|x')），ratio 会简化为 p(x')/p(x)。这就是原始的 Metropolis algorithm。

**为什么有效。** Acceptance rule 保证 detailed balance：处于 x 并移动到 x' 的概率，等于处于 x' 并移动到 x 的概率。Detailed balance 意味着 p(x) 是该 chain 的 stationary distribution。

**实践注意事项：**
- Burn-in：在 chain 达到 equilibrium 之前丢弃早期 samples
- Thinning：每隔 k 个 sample 保留一个，以减少 autocorrelation
- Proposal scale：太小会让 chain 移动缓慢（high acceptance，slow exploration）；太大会让大多数 proposals 被拒绝（low acceptance，stuck in place）
- 高维中 Gaussian proposal 的最优 acceptance rate 约为 0.234

### Gibbs Sampling

Gibbs sampling 是 multivariate distributions 的一种特殊 MCMC。它不是一次性在所有维度上提出 move，而是每次从 conditional distribution 更新一个 variable。

```
Target: p(x_1, x_2, ..., x_d)

Algorithm:
  For each iteration t:
    Sample x_1^{t+1} ~ p(x_1 | x_2^t, x_3^t, ..., x_d^t)
    Sample x_2^{t+1} ~ p(x_2 | x_1^{t+1}, x_3^t, ..., x_d^t)
    ...
    Sample x_d^{t+1} ~ p(x_d | x_1^{t+1}, x_2^{t+1}, ..., x_{d-1}^{t+1})
```

Gibbs sampling 要求你能从每个 conditional distribution p(x_i | x_{-i}) 中 sampling。对很多模型来说这很直接：
- Bayesian networks：conditionals 来自 graph structure
- Gaussian mixtures：conditionals 是 Gaussian
- Ising models：每个 spin 的 conditional 只依赖其 neighbors

Acceptance rate 总是 1（每个 proposal 都被接受），因为从精确 conditional sampling 会自动满足 detailed balance。

**局限。** 当 variables 高度相关时，Gibbs sampling mixing 很慢，因为一次更新一个 variable 无法在分布中做大的 diagonal moves。

### Temperature Sampling（用于 LLMs）

Language models 会为 vocabulary 中每个 Token 输出 logits z_1, ..., z_V。Softmax 会把它们转换成概率。Temperature 会在 softmax 前重新缩放 logits：

```
p_i = exp(z_i / T) / sum(exp(z_j / T))

T = 1.0: standard softmax (original distribution)
T -> 0:  argmax (deterministic, always picks highest logit)
T -> inf: uniform (all tokens equally likely)
T < 1.0: sharpens the distribution (more confident, less diverse)
T > 1.0: flattens the distribution (less confident, more diverse)
```

**为什么有效。** 用 T < 1 除以 logits 会放大 logits 之间的差异。如果 z_1 = 2 且 z_2 = 1，用 T = 0.5 除后得到 z_1/T = 4 和 z_2/T = 2，使差距变大。经过 softmax 后，最高 logit 的 Token 会获得大得多的概率份额。

**实践中：**
- T = 0.0：greedy decoding，最适合事实型 Q&A
- T = 0.3-0.7：略有创造性，适合 code generation
- T = 0.7-1.0：平衡，适合一般对话
- T = 1.0-1.5：creative writing、brainstorming
- T > 1.5：越来越随机，通常很少有用

Temperature 不会改变哪些 Token 是可能的。它改变分配给每个 Token 的 probability mass。

### Top-k Sampling

Top-k sampling 会把候选集合限制为概率最高的 k 个 Token，然后重新归一化，并从该受限集合中 sampling。

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

Top-k 会防止模型选择极低概率的 Token（拼写错误、无意义内容），这些 Token 存在于 vocabulary distribution 的长尾中。问题在于：无论上下文如何，k 都是固定的。当模型很有把握时（一个 Token 有 95% 概率），k = 40 仍会允许 39 个替代项。当模型不确定时（概率分散在 1000 个 Token 上），k = 40 会截断合理选项。

### Top-p (Nucleus) Sampling

Top-p sampling 会动态调整候选集合大小。它不是保留固定数量的 Token，而是保留累计概率超过 p 的最小 Token 集合。

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

当模型很有把握时，nucleus sampling 会保留很少的 Token（可能 2-3 个）。当模型不确定时，它会保留很多（可能 200 个）。这种自适应行为就是 nucleus sampling 通常比 top-k 生成更好文本的原因。

**常见组合：**
- Temperature 0.7 + top-p 0.9：良好的通用设置
- Temperature 0.0 (greedy)：最适合确定性任务
- Temperature 1.0 + top-k 50：Fan et al. (2018) 原论文设置

Top-k 和 top-p 可以组合。先应用 top-k，再在剩余集合上应用 top-p。

### Reparameterization Trick（用于 VAEs）

Variational autoencoders (VAEs) 的学习方式是：把 inputs 编码成 latent space 中的一个分布，从该分布中 sampling，然后把 sample 解码回来。问题是：你不能穿过一个 sampling operation 进行 Backpropagation。

```
Standard sampling (not differentiable):
  z ~ N(mu, sigma^2)

  The randomness blocks gradient flow.
  d/d_mu [sample from N(mu, sigma^2)] = ???
```

Reparameterization trick 会把随机性与参数分离：

```
Reparameterized sampling:
  epsilon ~ N(0, 1)          (fixed random noise, no parameters)
  z = mu + sigma * epsilon   (deterministic function of parameters)

  Now z is a deterministic, differentiable function of mu and sigma.
  d(z)/d(mu) = 1
  d(z)/d(sigma) = epsilon

  Gradients flow through mu and sigma.
```

这之所以有效，是因为 N(mu, sigma^2) 与 mu + sigma * N(0, 1) 具有相同分布。关键洞察是：把随机性移动到一个无参数源（epsilon），然后把 sample 表示为参数的可微 transformation。

**在 VAE training loop 中：**
1. Encoder 为每个 input 输出 mu 和 log(sigma^2)
2. Sample epsilon ~ N(0, 1)
3. 计算 z = mu + sigma * epsilon
4. Decode z 以重建 input
5. 穿过步骤 4、3、2、1 进行 Backpropagation（可行，因为步骤 3 是可微的）

没有 reparameterization trick，VAEs 就无法用标准 Backpropagation 训练。这个单一洞察让 VAEs 变得可行。

### Gumbel-Softmax（可微的 Categorical Sampling）

Reparameterization trick 适用于连续分布（Gaussian）。对于离散 categorical distributions，我们需要另一种方法。Gumbel-Softmax 为 categorical sampling 提供了可微近似。

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

Gumbel-Softmax 会产生 discrete sample 的连续松弛。输出是 probability vector（soft one-hot），而不是 hard one-hot。Gradients 会穿过 softmax 流动。在训练的 forward pass 中，你可以使用 "straight-through" estimator：forward pass 使用 hard argmax，但 backward pass 使用 soft Gumbel-Softmax gradients。

**应用：**
- VAEs 中的 discrete latent variables
- Neural architecture search（选择离散 operations）
- Hard Attention mechanisms
- 带 discrete actions 的 Reinforcement Learning

### Stratified Sampling

标准 Monte Carlo sampling 可能会因为随机性在 sample space 中留下空缺。Stratified sampling 通过把空间划分为 strata，并从每个 stratum 中 sampling，强制实现均匀覆盖。

```
Standard Monte Carlo:
  Sample N points uniformly from [0, 1]
  Some regions may have clusters, others gaps

Stratified sampling:
  Divide [0, 1] into N equal strata: [0, 1/N), [1/N, 2/N), ..., [(N-1)/N, 1)
  Sample one point uniformly within each stratum
  x_i = (i + u_i) / N   where u_i ~ Uniform(0, 1),  i = 0, ..., N-1
```

与标准 Monte Carlo 相比，Stratified sampling 的方差总是更低或相等：

```
Var(stratified) <= Var(standard Monte Carlo)

The improvement is largest when f(x) varies smoothly.
For piecewise-constant functions, stratified sampling is exact.
```

**应用：**
- Numerical integration（quasi-Monte Carlo）
- Training data splits（确保每个 fold 中的 class balance）
- 带 stratification 的 importance sampling（组合两种技术）
- NeRF (Neural Radiance Fields) 沿 camera rays 使用 stratified sampling

### Connection to Diffusion Models

Diffusion models 通过 sampling process 生成图像。Forward process 会在 T 步中向图像添加 Gaussian noise，直到它变成纯噪声。Reverse process 学习 denoise，逐步恢复原始图像。

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

与本课方法的联系：
- 每个 denoising step 都使用 reparameterization trick（sample noise，应用 deterministic transform）
- Noise schedule {alpha_t} 控制一种 temperature annealing
- Training 使用 Monte Carlo estimation 来近似 ELBO (evidence lower bound)
- Diffusion models 中的 ancestral sampling 是一个 Markov chain（每一步只依赖当前状态）

整个图像生成过程就是 iterative sampling：从 noise 开始，在每一步中，基于学到的 denoising model，sample 一个噪声稍少的版本。


```figure
monte-carlo-pi
```

## 构建它
### 步骤 1： Uniform and inverse CDF sampling

```python
import math
import random

def sample_uniform(a, b):
    return a + (b - a) * random.random()

def sample_exponential_inverse_cdf(lam):
    u = random.random()
    return -math.log(u) / lam
```

生成 10,000 个 exponential samples，并验证均值为 1/lambda。

### 步骤 2： Rejection sampling

```python
def rejection_sample(target_pdf, proposal_sample, proposal_pdf, M):
    while True:
        x = proposal_sample()
        u = random.random()
        if u < target_pdf(x) / (M * proposal_pdf(x)):
            return x
```

使用 rejection sampling 从 truncated normal distribution 中抽样。通过对 samples 绘制 histogram 来验证形状。

### 步骤 3： Importance sampling

```python
def importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n):
    total = 0
    for _ in range(n):
        x = proposal_sample()
        w = target_pdf(x) / proposal_pdf(x)
        total += f(x) * w
    return total / n
```

使用 uniform proposal 估计 normal distribution 下的 E[X^2]。与已知答案（mu^2 + sigma^2）比较。

### 步骤 4： Monte Carlo estimation of pi

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

### 步骤 5： Metropolis-Hastings MCMC

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

从 bimodal distribution（两个 Gaussians 的 mixture）中 sampling。可视化 chain 的 trajectory。

### 步骤 6： Gibbs sampling

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

### 步骤 7： Temperature sampling

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

展示 temperature 如何改变一组 Token logits 的输出分布。

### 步骤 8： Top-k and top-p sampling

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

### 步骤 9： Reparameterization trick

```python
def reparam_sample(mu, sigma):
    epsilon = random.gauss(0, 1)
    return mu + sigma * epsilon

def reparam_gradient(mu, sigma, epsilon):
    dz_dmu = 1.0
    dz_dsigma = epsilon
    return dz_dmu, dz_dsigma
```

演示 Gradients 可以穿过 reparameterized sample 流动，但不能穿过 direct sampling 流动。

### 步骤 10： Gumbel-Softmax

```python
def gumbel_sample():
    u = random.random()
    return -math.log(-math.log(u))

def gumbel_softmax(logits, temperature):
    gumbels = [math.log(p) + gumbel_sample() for p in logits]
    return softmax([g / temperature for g in gumbels])
```

展示降低 temperature 如何让输出接近 one-hot Vector。

完整实现和所有可视化都在 `code/sampling.py` 中。

## 使用它
使用 NumPy 和 SciPy 时，production 版本如下：

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

对于大规模 MCMC，使用专门的库：
- PyMC：使用 NUTS (adaptive HMC) 的完整 Bayesian modeling
- emcee：ensemble MCMC sampler
- NumPyro/JAX：GPU-accelerated MCMC

你已经从零构建了这些方法。现在你知道这些 library calls 在做什么。

## 练习
1. 为 Cauchy distribution 实现 inverse CDF sampling。CDF 是 F(x) = 0.5 + arctan(x)/pi。生成 10,000 个 samples，并把 histogram 与真实 PDF 画在一起。注意 heavy tails（远离中心的极端值）。

2. 使用 rejection sampling，通过 Uniform(0, 1) proposal 从 Beta(2, 5) distribution 生成 samples。把 accepted samples 与真实 Beta PDF 画在一起。理论 acceptance rate 是多少？

3. 使用 Monte Carlo，用 1,000、10,000 和 100,000 个 samples 估计 sin(x) 从 0 到 pi 的积分。比较每个级别的误差。验证误差按 O(1/sqrt(N)) 缩放。

4. 实现 Metropolis-Hastings，从一个 2D distribution 中 sampling，其中 p(x, y) proportional to exp(-(x^2 * y^2 + x^2 + y^2 - 8*x - 8*y) / 2)。绘制 samples 和 chain trajectory。尝试不同的 proposal standard deviations。

5. 构建一个完整 text generation demo：给定一个包含 10 个词及 logits 的 vocabulary，使用 (a) greedy、(b) temperature=0.7、(c) top-k=3、(d) top-p=0.9 生成长度为 20 Token 的序列。比较 5 次运行中输出的多样性。

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
- [Holbrook (2023): The Metropolis-Hastings Algorithm](https://arxiv.org/abs/2304.07010) - 关于 MCMC 基础的详细教程
- [Jang, Gu, Poole (2017): Categorical Reparameterization with Gumbel-Softmax](https://arxiv.org/abs/1611.01144) - 原始 Gumbel-Softmax 论文
- [Holtzman et al. (2020): The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751) - nucleus (top-p) sampling 论文
- [Kingma & Welling (2014): Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) - 介绍 reparameterization trick 的 VAE 论文
- [Ho, Jain, Abbeel (2020): Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) - DDPM 将 sampling 与图像生成联系起来
