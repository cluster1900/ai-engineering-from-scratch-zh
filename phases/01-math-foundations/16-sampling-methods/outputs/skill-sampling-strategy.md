---
name: skill-sampling-strategy
description: 为 generation、estimation 或 inference 选择合适的 sampling 方法
version: 1.0.0
phase: 1
lesson: 16
tags: [sampling, mcmc, generation]
---

# Sampling 策略选择

如何为文本生成、Bayesian inference、Monte Carlo estimation 和训练选择合适的 sampling 方法。

## 决策清单

1. 你是在生成输出（文本、图像），还是在估计某个量（积分、期望）？
2. 你能直接从目标分布 sampling，还是只能评估它的 density？
3. 目标分布是离散的还是连续的？
4. sample space 的维度是多少？低（< 5）、中（5-100），还是高（> 100）？
5. 你需要精确 samples 还是近似 samples？
6. 你是否需要通过 sampling 操作传递 gradients？

## 何时使用每种方法

| Method | When to use | Complexity | Exact? |
|---|---|---|---|
| Direct sampling | 你有 CDF，或可以使用库函数 | 每个 sample 为 O(1) | 是 |
| Inverse CDF | 已知闭式 CDF inverse（exponential、Cauchy） | 每个 sample 为 O(1) | 是 |
| Box-Muller | 不依赖库时需要 normal samples | 每个 sample 为 O(1) | 是 |
| Rejection sampling | 可以评估目标 PDF，低维（1-3） | 每个 sample 为 O(1/acceptance) | 是 |
| Importance sampling | 需要期望，而不是单个 samples | n 个 samples 为 O(n) | 近似 |
| Stratified sampling | Monte Carlo estimation，希望降低方差 | n 个 samples 为 O(n) | 近似 |
| Metropolis-Hastings | 高维，可以评估未归一化 density | 每步 O(1) + burn-in | 渐近成立 |
| Gibbs sampling | 可以从每个条件分布 sampling | 每次完整 sweep 为 O(d) | 渐近成立 |
| HMC/NUTS | 高维连续、平滑 density | 每步 O(L * d) | 渐近成立 |
| Temperature sampling | LLM 文本生成，控制创造性 | vocab size V 为 O(V) | N/A |
| Top-k sampling | LLM generation，移除不太可能的 Token | O(V log k) | N/A |
| Top-p (nucleus) | LLM generation，自适应候选集 | O(V log V) | N/A |
| Reparameterization | 需要通过 Gaussian sampling 传递 gradients（VAEs） | O(d) | 是 |
| Gumbel-Softmax | 需要通过 categorical sampling 传递 gradients | k 个 classes 为 O(k) | 近似 |

## LLM generation 设置

| Use case | Temperature | Top-p | Top-k | Notes |
|---|---|---|---|---|
| Factual Q&A | 0.0（greedy） | -- | -- | 确定性，无随机性 |
| Code generation | 0.2-0.5 | 0.9 | -- | 低创造性，高连贯性 |
| General chat | 0.7 | 0.9 | -- | 平衡 |
| Creative writing | 0.9-1.2 | 0.95 | -- | 更高多样性 |
| Brainstorming | 1.0-1.5 | 0.95 | -- | 最大多样性，可能损失连贯性 |

Temperature 和 top-p 可以组合使用。先应用 temperature（缩放 logits），再应用 top-p filtering。

## MCMC 方法选择

| Property | Metropolis-Hastings | Gibbs | HMC/NUTS |
|---|---|---|---|
| Dimension | 任意 | 任意（最好 < 100） | 高（100+） |
| Requires conditionals | 否 | 是 | 否 |
| Requires gradient | 否 | 否 | 是 |
| Acceptance rate | 调到约 23% | 始终 100% | 调到约 65% |
| Correlation | 高（random walk） | 中等 | 低 |
| Burn-in | 长 | 中等 | 短 |
| Best for | 探索、简单 models | Conjugate models、Bayesian networks | 连续 posteriors、deep probabilistic models |

## 常见错误

- 在高维中使用 rejection sampling。acceptance rate 会随维度指数级下降。超过 5 维时，切换到 MCMC。
- 将 MCMC proposal variance 设置得过高或过低。过高：大多数 proposals 被拒绝，chain 卡住。过低：所有 proposals 都被接受，chain 移动缓慢。random walk MH 的目标 acceptance 约为 23%。
- 忘记 burn-in。MCMC 的前 N 个 samples 会受到起点影响而有偏。至少丢弃 1000 步（复杂分布需要更多）。
- 使用与目标差异很大的 proposal 做 importance sampling。少数 samples 会获得巨大权重，使估计不可靠。监控 effective sample size：ESS = (sum w_i)^2 / sum(w_i^2)。
- 对需要确定性输出的任务（例如 classification、structured extraction）使用 temperature > 0。改用 greedy（T=0）或 beam search。
- 不将 top-p 与 temperature 结合。单独使用 temperature 不会从长尾中移除垃圾 Token。top-p 可以做到。
- 通过标准 sampling 操作进行 backpropagating。连续（Gaussian）使用 reparameterization trick，离散（categorical）使用 Gumbel-Softmax。

## 快速参考：方差降低技术

| Technique | How it works | Variance reduction |
|---|---|---|
| Stratified sampling | 将空间划分为 strata，并对每个 strata sampling | 始终 <= 标准 MC |
| Antithetic variates | 同时使用 U 和 1-U | 适用于单调函数 |
| Control variates | 减去一个已知 mean 的变量 | 与 correlation 成比例 |
| Importance sampling | 对来自更好 proposal 的 samples 重新加权 | 取决于 proposal quality |
| Latin hypercube | 独立地对每个维度分层 | 在高维中优于 stratified |
