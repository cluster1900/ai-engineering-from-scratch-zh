# 政策渐进  从零实现再强化

> 停止估值值――直接参数化政策,计算预期回报的梯度,然后沿上坡方向更新――威廉斯 (1992) 用一个定理写清了它――这也是PPO、GRPO以及每个LLM RL循环存在的原因――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 03 (Monte Carlo), Phase 9 · 04 (TD Learning)
**Time:** ~75 分钟

## 问题

如何实现Q-学习和DQN参数化的是 *值*函数──你通过`argmax Q`选择行动――这对离散行动和离散状态没有问题――但当行动是持续的时就会失效了.`argmax`没有什么可做,或者你想要一个断政策,`argmax`按构造就是决定性)

政策梯度 改为参数化 *政策*。`π_θ(a | s)`是一个神经网络,输出行动 上的分布. 从样本中来采取行动.`θ`没有任何变化.`argmax`没有贝尔曼复发,只有对.`J(θ) = E_{π_θ}[G]`让我们爬上梯度.

强化定理 (威廉斯 1992) 告诉你这个梯度是可计算的:`∇J(θ) = E_π[ G · ∇_θ log π_θ(a | s) ]`运行一个集 计算回归 把每一步的`∇ log π_θ(a | s)`乘以回归――取平均――做渐进式升级――完成――

2026年每一个LLM-RL算法:PPO、DPO、GRPO都是REINFORCE的改进.

## 概念

![Policy gradient: softmax policy, log-π gradient, return-weighted update](../assets/policy-gradient.svg)

**Policy gradient theorem。**任何一个`θ`参数化的政策`π_θ`其他:

`∇J(θ) = E_{τ ~ π_θ}[ Σ_{t=0}^{T} G_t · ∇_θ log π_θ(a_t | s_t) ]`

其中`G_t = Σ_{k=t}^{T} γ^{k-t} r_{k+1}`是从步骤`t`开始的折扣回报.`π_θ`样本的完整轨迹`τ`取得的.

**证明很短。**在预期下对`J(θ) = Σ_τ P(τ; θ) G(τ)`求导──使用`∇P(τ; θ) = P(τ; θ) ∇ log P(τ; θ)`解算的方法`log P(τ; θ) = Σ log π_θ(a_t | s_t) + environment terms that do not depend on θ`△环境术语消失.

**Variance reduction 技巧。**尼拉强度变化非常高:回报是的,`∇ log π`它们的乘积非常.

1. **Baseline subtraction。**无赖于任意`a_t`的基线`b(s_t)`让你`G_t`换成`G_t - b(s_t)`,这是一个公平的,因为`E[b(s_t) · ∇ log π(a_t | s_t)] = 0`◎典型选择:由评论家学到的`b(s_t) = V̂(s_t)`演员评论家 (07课)
2. **Reward-to-go。**让我`Σ_t G_t · ∇ log π_θ(a_t | s_t)`换成`Σ_t G_t^{from t} · ∇ log π_θ(a_t | s_t)`△对某种特定的行动,只有未来的回报 相关,过去的回报只会贡献零平均噪音──

组合起来得到:

`∇J ≈ (1/N) Σ_{i=1}^{N} Σ_{t=0}^{T_i} [ G_t^{(i)} - V̂(s_t^{(i)}) ] · ∇_θ log π_θ(a_t^{(i)} | s_t^{(i)})`

这就是带基线的强化,也是A2C的直接祖先.

**Softmax policy parameterization。**对于单独的行动,标准选择是:

`π_θ(a | s) = exp(f_θ(s, a)) / Σ_{a'} exp(f_θ(s, a'))`

其中`f_θ`任何一个动作都能输出一个分数.

`∇_θ log π_θ(a | s) = ∇_θ f_θ(s, a) - Σ_{a'} π_θ(a' | s) ∇_θ f_θ(s, a')`

也就是采取行动的分数减去政策下预期值.

**用于 continuous actions 的 Gaussian policy。** `π_θ(a | s) = N(μ_θ(s), σ_θ(s))`,我知道.`∇ log N(a; μ, σ)`现在,我们需要一个新的系统.


```figure
policy-gradient-landscape
```

## 建立它

### 步骤1:软max政策网络

```python
def policy_logits(theta, state_features):
    return [dot(theta[a], state_features) for a in range(N_ACTIONS)]

def softmax(logits):
    m = max(logits)
    exps = [exp(l - m) for l in logits]
    Z = sum(exps)
    return [e / Z for e in exps]
```

对图表环境使用线性政策 (每一个操作一个权重矢量) 对Atari,换成CNN,并保留软max头

### 步骤2:采样和记录概率

```python
def sample_action(probs, rng):
    x = rng.random()
    cum = 0
    for a, p in enumerate(probs):
        cum += p
        if x <= cum:
            return a
    return len(probs) - 1

def log_prob(probs, a):
    return log(probs[a] + 1e-12)
```

### 步骤3: 随着记录探测器的捕获,部署

```python
def rollout(theta, env, rng, gamma):
    trajectory = []
    s = env.reset()
    while not done:
        logits = policy_logits(theta, s)
        probs = softmax(logits)
        a = sample_action(probs, rng)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r, probs))
        s = s_next
    return trajectory
```

### 步骤4: 更新 REINFORCE

```python
def reinforce_step(theta, trajectory, gamma, lr, baseline=0.0):
    returns = compute_returns(trajectory, gamma)
    for (s, a, _, probs), G in zip(trajectory, returns):
        advantage = G - baseline
        grad_log_pi_a = [-p for p in probs]
        grad_log_pi_a[a] += 1.0
        for i in range(N_ACTIONS):
            for j in range(len(s)):
                theta[i][j] += lr * advantage * grad_log_pi_a[i] * s[j]
```

渐进式`∇ log π(a|s) = e_a - π(·|s)`(`a`软max政策梯度的核心.

### 步骤5:基线

对于近期的事件`G`取运行平均,已经足够把4×4格里德世界 运行起来;大约需要500集收──把基线升级为学习`V̂(s)`现在,我们得到了演员评论.

## 陷

- **Exploding gradients。**收益可能非常大.`∇ log π`之前,始终在批量内把 `G`正常化到`~N(0, 1)`,我知道.
- **Entropy collapse。**政策过早收到近似决定性的行动,停止探索,然后卡住――修复方式:向目标 添加化奖金`β · H(π(·|s))`,我知道.
- **High variance。**尼拉反弹力 需要成千上万集.
- **Sample inefficiency。**通过重要样本采集,做出非政策修改,可以带回数据,代价是变化.
- **Non-stationary gradients。**之前的100集同一个级别使用的是旧的`π`由于这些政策的方法,
- **Credit assignment。**没有回报的回报,过去的回报会贡献噪音――始终使用回报的回报――

## 用它

据了解,在2026年,强势力很少被直接运行,但它的渐进式公式无处不在:

| Use case | Derived method |
|----------|---------------|
| Continuous control | PPO / SAC with Gaussian policy |
| LLM RLHF | PPO with KL penalty, running on token-level policy |
| LLM reasoning (DeepSeek) | GRPO — REINFORCE with group-relative baseline, no critic |
| Multi-agent | Centralized-critic REINFORCE (MADDPG, COMA) |
| Discrete action robotics | A2C, A3C, PPO |
| Preference-only settings | DPO — REINFORCE rewritten as a preference-likelihood loss, no sampling |

在2026年的训练剧本中看到`loss = -advantage * log_prob`根据" 基线"的强化,

## 运送它

保存为`outputs/skill-policy-gradient-trainer.md`其他:

```markdown
---
name: policy-gradient-trainer
description: 为给定 task 生成 REINFORCE / actor-critic / PPO training config，并诊断 variance 问题。
version: 1.0.0
phase: 9
lesson: 6
tags: [rl, policy-gradient, reinforce]
---

给定一个 environment（discrete / continuous actions、horizon、reward stats），输出：

1. Policy head。Softmax（discrete）或 Gaussian（continuous），并包含 parameter counts。
2. Baseline。None（vanilla）、running mean、learned `V̂(s)`，或 A2C critic。
3. Variance controls。默认启用 reward-to-go、return normalization、gradient clip value。
4. Entropy bonus。Coefficient β 和 decay schedule。
5. Batch size。每次 update 的 episodes 数；on-policy data freshness contract。

拒绝在 horizons > 500 steps 上使用 REINFORCE-no-baseline。拒绝为 continuous-action control 使用 softmax head。把任何 `β = 0` 且 observed policy entropy < 0.1 的 run 标记为 entropy-collapsed。
```

## 运动

1. **Easy。**在4×4格里德世界上使用线性软max政策实现 REINFORCE──不使用基线,训练1000个节目──绘制学习曲线;测量变异的回报的STD)──
2. **Medium。**增加运行平均基线――再训练――把样本效率和与尼拉运行相比的差异――基线 让收费需要的步骤 降低了多少?
3. **Hard。**添加了体积奖金`β · H(π)`扫描`β ∈ {0, 0.01, 0.1, 1.0}`绘制最终回报和政策缩. 这个任务的上位点在哪里?

## 关键词

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy gradient | “直接训练 policy” | `∇J(θ) = E[G · ∇ log π_θ(a\|s)]`；由 log-derivative trick 推导而来。 |
| REINFORCE | “最初的 PG algorithm” | Williams (1992)；Monte Carlo returns 乘以 log-policy Gradient。 |
| Log-derivative trick | “Score function estimator” | `∇P(τ;θ) = P(τ;θ) · ∇ log P(τ;θ)`；让 expectations 的 gradients 变得 tractable。 |
| Baseline | “Variance reduction” | 从 `G` 中减去的任意 `b(s)`；是 unbiased 的，因为 `E[b · ∇ log π] = 0`。 |
| Reward-to-go | “只计算未来 returns” | 使用 `G_t^{from t}` 而不是完整的 `G_0`；正确且 variance 更低。 |
| Entropy bonus | “鼓励探索” | `+β · H(π(·\|s))` 项防止 policy collapse。 |
| On-policy | “用你刚看到的数据训练” | Gradient expectation 是相对于当前 policy 的，不能直接复用旧数据。 |
| Advantage | “比平均好多少” | `A(s, a) = G(s, a) - V(s)`；带 baseline 的 REINFORCE 所乘的带符号 quantity。 |

## 进一步阅读

- [Williams (1992). Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning](https://link.springer.com/article/10.1007/BF00992696)最初的强化学报纸
- [Sutton et al. (2000). Policy Gradient Methods for Reinforcement Learning with Function Approximation](https://papers.nips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html) 带函数近似的现代政策渐变定理.
- [Sutton & Barto (2018). Ch. 13 — Policy Gradient Methods](http://incompleteideas.net/book/RLbook2020.pdf)教科书介绍――
- [OpenAI Spinning Up — VPG / REINFORCE](https://spinningup.openai.com/en/latest/algorithms/vpg.html) 清晰的教学式讲解,包含PyTorch代码.
- [Peters & Schaal (2008). Reinforcement Learning of Motor Skills with Policy Gradients](https://homes.cs.washington.edu/~todorov/courses/amath579/reading/PolicyGradient.pdf)变化降低以及把 REINFORCE 连接到信托区域家族 (TRPO,PPO) 的自然梯度视角
