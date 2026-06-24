# Policy Gradient — 从零实现 REINFORCE

> 停止估计 value。直接 parameterize policy，计算 expected return 的 Gradient，然后沿上坡方向更新。Williams (1992) 用一个 theorem 写清了它。这也是 PPO、GRPO 以及每个 LLM RL loop 存在的原因。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 03 (Monte Carlo), Phase 9 · 04 (TD Learning)
**Time:** ~75 分钟

## 问题

Q-learning 和 DQN parameterize 的是 *value* function。你通过 `argmax Q` 选择 action。这对 discrete actions 和 discrete states 没问题。但当 actions 是 continuous 时就会失效（对一个 10-dimensional torque 怎么做 `argmax`？），或者当你想要 stochastic policy 时也会失效（`argmax` 按构造就是 deterministic）。

Policy gradients 改为 parameterize *policy*。`π_θ(a | s)` 是一个 Neural Network，输出 action 上的 distribution。从中 sample 来采取 action。计算 expected return 关于 `θ` 的 Gradient。沿上坡方向更新。没有 `argmax`。没有 Bellman recursion。只有对 `J(θ) = E_{π_θ}[G]` 做 Gradient ascent。

REINFORCE theorem (Williams 1992) 告诉你这个 Gradient 是可计算的：`∇J(θ) = E_π[ G · ∇_θ log π_θ(a | s) ]`。运行一个 episode。计算 return。把每一步的 `∇ log π_θ(a | s)` 乘以 return。取平均。做 Gradient-ascent。完成。

2026 年的每个 LLM-RL algorithm：PPO、DPO、GRPO，都是 REINFORCE 的 refinement。把它练到手上，是本 phase 后续内容，以及 Phase 10 · 07 (RLHF implementation) 和 Phase 10 · 08 (DPO) 的 prerequisite。

## 概念

![Policy gradient: softmax policy, log-π gradient, return-weighted update](../assets/policy-gradient.svg)

**Policy gradient theorem。** 对任意由 `θ` parameterized 的 policy `π_θ`：

`∇J(θ) = E_{τ ~ π_θ}[ Σ_{t=0}^{T} G_t · ∇_θ log π_θ(a_t | s_t) ]`

其中 `G_t = Σ_{k=t}^{T} γ^{k-t} r_{k+1}` 是从 step `t` 开始的 discounted return。expectation 是在从 `π_θ` sample 的完整 trajectories `τ` 上取得的。

**证明很短。** 在 expectation 下对 `J(θ) = Σ_τ P(τ; θ) G(τ)` 求导。使用 `∇P(τ; θ) = P(τ; θ) ∇ log P(τ; θ)`（log-derivative trick）。分解 `log P(τ; θ) = Σ log π_θ(a_t | s_t) + environment terms that do not depend on θ`。environment terms 消失。两行代数就得到 theorem。

**Variance reduction 技巧。** Vanilla REINFORCE 的 variance 非常高：returns 是 noisy 的，`∇ log π` 是 noisy 的，它们的乘积非常 noisy。两个标准修复：

1. **Baseline subtraction。** 对任意不依赖 `a_t` 的 baseline `b(s_t)`，把 `G_t` 替换成 `G_t - b(s_t)`。它是 unbiased 的，因为 `E[b(s_t) · ∇ log π(a_t | s_t)] = 0`。典型选择：由 critic 学到的 `b(s_t) = V̂(s_t)` → actor-critic（Lesson 07）。
2. **Reward-to-go。** 把 `Σ_t G_t · ∇ log π_θ(a_t | s_t)` 替换成 `Σ_t G_t^{from t} · ∇ log π_θ(a_t | s_t)`。对某个给定 action，只有未来 returns 相关，过去 rewards 只会贡献 zero-mean noise。

组合起来得到：

`∇J ≈ (1/N) Σ_{i=1}^{N} Σ_{t=0}^{T_i} [ G_t^{(i)} - V̂(s_t^{(i)}) ] · ∇_θ log π_θ(a_t^{(i)} | s_t^{(i)})`

这就是带 baseline 的 REINFORCE，也是 A2C（Lesson 07）和 PPO（Lesson 08）的直接祖先。

**Softmax policy parameterization。** 对 discrete actions，标准选择是：

`π_θ(a | s) = exp(f_θ(s, a)) / Σ_{a'} exp(f_θ(s, a'))`

其中 `f_θ` 是任何为每个 action 输出一个 score 的 Neural Network。Gradient 有一个干净的形式：

`∇_θ log π_θ(a | s) = ∇_θ f_θ(s, a) - Σ_{a'} π_θ(a' | s) ∇_θ f_θ(s, a')`

也就是已采取 action 的 score 减去它在 policy 下的 expected value。

**用于 continuous actions 的 Gaussian policy。** `π_θ(a | s) = N(μ_θ(s), σ_θ(s))`。`∇ log N(a; μ, σ)` 有 closed form。这就是 Phase 9 · 07 的 SAC 所需要的全部。


```figure
policy-gradient-landscape
```

## Build It

### Step 1: softmax policy network

```python
def policy_logits(theta, state_features):
    return [dot(theta[a], state_features) for a in range(N_ACTIONS)]

def softmax(logits):
    m = max(logits)
    exps = [exp(l - m) for l in logits]
    Z = sum(exps)
    return [e / Z for e in exps]
```

对 tabular env 使用 linear policy（每个 action 一个 weight Vector）。对 Atari，换成 CNN，并保留 softmax head。

### Step 2: sampling and log-probability

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

### Step 3: rollout with log-probs captured

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

### Step 4: REINFORCE update

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

Gradient `∇ log π(a|s) = e_a - π(·|s)`（`a` 的 onehot 减去 probabilities）是 softmax policy gradients 的核心。把它练成肌肉记忆。

### Step 5: baselines

对近期 episodes 的 `G` 取 running mean，已经足够把 4×4 GridWorld 跑起来；大约需要 500 个 episodes 收敛。把 baseline 升级为 learned `V̂(s)`，就得到 actor-critic。

## Pitfalls

- **Exploding gradients。** Returns 可能非常大。乘以 `∇ log π` 之前，始终在 batch 内把 `G` normalize 到 `~N(0, 1)`。
- **Entropy collapse。** Policy 过早收敛到近似 deterministic 的 action，停止探索，然后卡住。修复方式：向 objective 添加 entropy bonus `β · H(π(·|s))`。
- **High variance。** Vanilla REINFORCE 需要成千上万 episodes。critic baseline（Lesson 07）或 TRPO/PPO 的 trust region（Lesson 08）是标准修复。
- **Sample inefficiency。** On-policy 意味着每条 transition 在一次 update 后就会被丢弃。通过 importance sampling 做 off-policy corrections 可以把数据带回来，代价是 variance（PPO 的 ratio 是 clipped IS weight）。
- **Non-stationary gradients。** 100 个 episodes 之前的同一个 Gradient 使用的是旧的 `π`。这就是 on-policy methods 每隔几个 rollouts 就 update 的原因。
- **Credit assignment。** 没有 reward-to-go 时，过去 rewards 会贡献 noise。始终使用 reward-to-go。

## Use It

2026 年，REINFORCE 很少被直接运行，但它的 Gradient 公式无处不在：

| Use case | Derived method |
|----------|---------------|
| Continuous control | PPO / SAC with Gaussian policy |
| LLM RLHF | PPO with KL penalty, running on token-level policy |
| LLM reasoning (DeepSeek) | GRPO — REINFORCE with group-relative baseline, no critic |
| Multi-agent | Centralized-critic REINFORCE (MADDPG, COMA) |
| Discrete action robotics | A2C, A3C, PPO |
| Preference-only settings | DPO — REINFORCE rewritten as a preference-likelihood loss, no sampling |

当你在 2026 年的 training script 中看到 `loss = -advantage * log_prob`，那就是带 baseline 的 REINFORCE。整篇论文（DPO、GRPO、RLOO）都是建立在这一行之上的 variance-reduction 技巧。

## Ship It

保存为 `outputs/skill-policy-gradient-trainer.md`：

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

## Exercises

1. **Easy。** 在 4×4 GridWorld 上用 linear softmax policy 实现 REINFORCE。不使用 baseline，训练 1,000 个 episodes。绘制 learning curve；测量 variance（returns 的 std）。
2. **Medium。** 添加 running-mean baseline。再次训练。把 sample efficiency 和 variance 与 vanilla run 对比。baseline 让收敛所需 steps 降低了多少？
3. **Hard。** 添加 entropy bonus `β · H(π)`。扫描 `β ∈ {0, 0.01, 0.1, 1.0}`。绘制 final return 和 policy entropy。这个 task 上的 sweet spot 在哪里？

## Key Terms

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

## Further Reading

- [Williams (1992). Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning](https://link.springer.com/article/10.1007/BF00992696) — 最初的 REINFORCE paper。
- [Sutton et al. (2000). Policy Gradient Methods for Reinforcement Learning with Function Approximation](https://papers.nips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html) — 带 function approximation 的现代 policy-gradient theorem。
- [Sutton & Barto (2018). Ch. 13 — Policy Gradient Methods](http://incompleteideas.net/book/RLbook2020.pdf) — textbook presentation。
- [OpenAI Spinning Up — VPG / REINFORCE](https://spinningup.openai.com/en/latest/algorithms/vpg.html) — 清晰的教学式讲解，包含 PyTorch code。
- [Peters & Schaal (2008). Reinforcement Learning of Motor Skills with Policy Gradients](https://homes.cs.washington.edu/~todorov/courses/amath579/reading/PolicyGradient.pdf) — variance-reduction，以及把 REINFORCE 连接到 trust-region family（TRPO, PPO）的 natural-gradient 视角。
