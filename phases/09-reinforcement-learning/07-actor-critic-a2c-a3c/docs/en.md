# Actor-Critic — A2C and A3C

> REINFORCE 很 noisy。加入一个学习 `V̂(s)` 的 critic，从 return 中减去它，你会得到一个 expectation 相同但 variance 低得多的 advantage。这就是 actor-critic。A2C 同步运行它；A3C 在线程之间运行它。两者都是每一种现代 deep-RL 方法的 mental model。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (TD Learning), Phase 9 · 06 (REINFORCE)
**Time:** ~75 minutes

## 问题
Vanilla REINFORCE 能工作，但它的 variance 很糟糕。Monte Carlo returns `G_t` 在不同 episodes 之间可能相差 10 倍以上。把这种 noise 乘以 `∇ log π` 再求平均，会产生一个 gradient estimator，需要数千个 episodes 才能把 policy 推动到用少得多的 DQN updates 就能达到的距离。

Variance 来自使用 raw returns。如果你减去一个 baseline `b(s_t)` —— state 的任意 function，包括一个 learned value —— expectation 不变，variance 会下降。最好的可处理 baseline 是 `V̂(s_t)`。现在乘以 `∇ log π` 的量就是 *advantage*：

`A(s, a) = G - V̂(s)`

如果一个 action 产生了高于平均水平的 return，它就是好的；如果低于平均水平，就是差的。带 learned critic 的 REINFORCE 就是 *actor-critic*。critic 给 actor 一个低 variance 的 teacher。这是 2015 年之后每一种 deep-policy 方法（A2C、A3C、PPO、SAC、IMPALA）的基础。

## 概念
![Actor-critic: policy net plus value net, TD residual as advantage](../assets/actor-critic.svg)

**Two networks, one shared loss:**

- **Actor** `π_θ(a | s)`：policy。通过 sample 来 act。用 policy gradient 训练。
- **Critic** `V_φ(s)`：估计从 state 出发的 expected return。训练目标是最小化 `(V_φ(s) - target)²`。

**The advantage.** 两种标准形式：

- *MC advantage:* `A_t = G_t - V_φ(s_t)`。Unbiased，variance 更高。
- *TD advantage:* `A_t = r_{t+1} + γ V_φ(s_{t+1}) - V_φ(s_t)`。Biased（使用 `V_φ`），variance 低得多。也叫 *TD residual* `δ_t`。

**n-step advantage.** 在两者之间插值：

`A_t^{(n)} = r_{t+1} + γ r_{t+2} + … + γ^{n-1} r_{t+n} + γ^n V_φ(s_{t+n}) - V_φ(s_t)`

`n = 1` 是纯 TD。`n = ∞` 是 MC。大多数实现对 Atari 使用 `n = 5`，对 MuJoCo 上的 PPO 使用 `n = 2048`。

**Generalized Advantage Estimation (GAE).** Schulman et al. (2016) 提出对所有 n-step advantages 做指数加权平均：

`A_t^{GAE} = Σ_{l=0}^{∞} (γλ)^l δ_{t+l}`

其中 `λ ∈ [0, 1]`。`λ = 0` 是 TD（低 variance，高 bias）。`λ = 1` 是 MC（高 variance，unbiased）。`λ = 0.95` 是 2026 年的默认值 —— 调整它，直到 bias/variance 旋钮到达你想要的位置。

**A2C: synchronous advantage actor-critic.** 在 `N` 个 parallel environments 中收集 `T` steps。为每个 step 计算 advantages。在合并后的 batch 上更新 actor 和 critic。重复。这是 A3C 更简单、更可扩展的 sibling。

**A3C: asynchronous advantage actor-critic.** Mnih et al. (2016)。启动 `N` 个 worker threads，每个运行一个 env。每个 worker 在自己的 rollout 上本地计算 gradients，然后异步应用到 shared parameter server。不需要 replay buffer —— workers 通过运行不同 trajectories 来 decorrelate。A3C 证明了可以在 CPUs 上大规模训练。到 2026 年，基于 GPU 的 A2C（batched parallel envs）占主导，因为 GPUs 需要 large batches。

**The combined loss.**

`L(θ, φ) = -E[ A_t · log π_θ(a_t | s_t) ]  +  c_v · E[(V_φ(s_t) - G_t)²]  -  c_e · E[H(π_θ(·|s_t))]`

三项：policy-gradient loss、value regression、entropy bonus。`c_v ~ 0.5`、`c_e ~ 0.01` 是典型起点。

## 构建它
### 步骤 1： a critic

Linear critic `V_φ(s) = w · features(s)` 使用 MSE 更新：

```python
def critic_update(w, x, target, lr):
    v_hat = dot(w, x)
    err = target - v_hat
    for j in range(len(w)):
        w[j] += lr * err * x[j]
    return v_hat
```

在 tabular env 上，critic 会在几百个 episodes 内 converge。在 Atari 上，把 linear critic 替换为 shared CNN trunk + value head。

### 步骤 2： n-step advantage

给定长度为 `T` 的 rollout 和一个 bootstrapped final `V(s_T)`：

```python
def compute_advantages(rewards, values, gamma=0.99, lam=0.95, last_value=0.0):
    advantages = [0.0] * len(rewards)
    gae = 0.0
    for t in reversed(range(len(rewards))):
        next_v = values[t + 1] if t + 1 < len(values) else last_value
        delta = rewards[t] + gamma * next_v - values[t]
        gae = delta + gamma * lam * gae
        advantages[t] = gae
    returns = [a + v for a, v in zip(advantages, values)]
    return advantages, returns
```

`returns` 是 critic target。`advantages` 是乘以 `∇ log π` 的内容。

### 步骤 3： combined update

```python
for step_i, (x, a, _r, probs) in enumerate(traj):
    adv = advantages[step_i]
    target_v = returns[step_i]

    # critic
    critic_update(w, x, target_v, lr_v)

    # actor
    for i in range(N_ACTIONS):
        grad_logpi = (1.0 if i == a else 0.0) - probs[i]
        for j in range(N_FEAT):
            theta[i][j] += lr_a * adv * grad_logpi * x[j]
```

On-policy，每次 update 使用一个 rollout，actor 和 critic 使用 separate learning rates。

### 步骤 4： parallelization (A3C vs A2C)

- **A3C:** 启动 `N` 个 threads。每个 thread 运行自己的 env 和自己的 forward pass。定期把 gradient updates 推送到 shared master。master 上不加 locks —— races 是可以接受的，它们只是增加 noise。
- **A2C:** 在单个 process 中运行 `N` 个 env instances，把 observations 堆叠成 `[N, obs_dim]` batch，执行 batched forward pass、batched backward pass。GPU utilization 更高、deterministic、更容易推理。2026 年的默认选择。

我们的 toy code 为了清晰是 single-threaded；改写成 batched A2C 只需要三行 numpy。

## 陷阱
- **Critic bias before actor gradient.** 如果 critic 是 random，它的 baseline 没有信息量，你就在 pure noise 上训练。在启用 policy gradient 前先 warm up critic 几百步，或使用较慢的 actor learning rate。
- **Advantage normalization.** 对每个 batch 的 advantages 做 zero-mean/unit-std normalization。几乎零成本，却能极大稳定训练。
- **Shared trunk.** 对 image inputs，为 actor 和 critic 使用 shared feature extractor。使用 separate heads。shared features 会从两个 losses 中搭便车。
- **On-policy contract.** A2C 对数据只复用一次 update。更多复用会让 gradient 产生 bias（importance-sampling correction 正是 PPO 添加的内容）。
- **Entropy collapse.** 没有 `c_e > 0`，policy 会在几百次 updates 内变得近似 deterministic，并停止探索。
- **Reward scale.** Advantage magnitudes 取决于 reward scale。Normalize rewards（例如除以 running-std），以便在不同 tasks 上获得一致的 gradient magnitudes。

## 使用它
A2C/A3C 在 2026 年很少是最终选择，但它们是后续所有架构 refinement 的基础：

| Method | Relation to A2C |
|--------|----------------|
| PPO | A2C + clipped importance ratio，用于 multi-epoch updates |
| IMPALA | A3C + V-trace off-policy correction |
| SAC (Phase 9 · 07) | 带 soft-value critic 的 off-policy A2C（下一课） |
| GRPO (Phase 9 · 12) | 没有 critic 的 A2C —— group-relative advantage |
| DPO | A2C 折叠为 preference-ranking loss，不做 sampling |
| AlphaStar / OpenAI Five | A2C + league training + imitation pre-training |

如果你在 2026 年的 paper 中看到 "advantage"，就想到 actor-critic。

## 交付它
保存为 `outputs/skill-actor-critic-trainer.md`：

```markdown
---
name: actor-critic-trainer
description: 为给定 environment 生成 A2C / A3C / GAE 配置，并指定 advantage estimation 和 loss weights。
version: 1.0.0
phase: 9
lesson: 7
tags: [rl, actor-critic, gae]
---

给定一个 environment 和 compute budget，输出：

1. Parallelism。A2C（GPU batched）vs A3C（CPU async）以及 workers 数量。
2. Rollout length T。每个 env 在每次 update 中的 steps 数。
3. Advantage estimator。n-step 或 GAE(λ)；指定 λ。
4. Loss weights。`c_v`（value）、`c_e`（entropy）、gradient clip。
5. Learning rates。Actor 和 critic（如果使用，则 separate）。

拒绝在 horizon > 1000 的 environments 上使用 single-worker A2C（太 on-policy，太慢）。拒绝在没有 advantage normalization 的情况下交付。将任何 `c_e = 0` 且 observed entropy < 0.1 的 run 标记为 entropy-collapsed。
```

## 练习
1. **Easy.** 在 4×4 GridWorld 上用 MC advantage（`G_t - V(s_t)`）训练 actor-critic。将 sample efficiency 与 Lesson 06 中的 REINFORCE-with-running-mean-baseline 比较。
2. **Medium.** 切换到 TD-residual advantage（`r + γ V(s') - V(s)`）。测量 advantage batches 的 variance。它下降了多少？
3. **Hard.** 实现 GAE(λ)。Sweep `λ ∈ {0, 0.5, 0.9, 0.95, 1.0}`。绘制 final return vs sample efficiency。这个 task 的 bias/variance sweet spot 在哪里？

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Actor | "The policy net" | `π_θ(a|s)`，由 policy gradient 更新。 |
| Critic | "The value net" | `V_φ(s)`，通过对 returns / TD targets 做 MSE regression 来更新。 |
| Advantage | "How much better than average" | `A(s, a) = Q(s, a) - V(s)` 或它的 estimators。`∇ log π` 的 multiplier。 |
| TD residual | "δ" | `δ_t = r + γ V(s') - V(s)`；one-step advantage estimate。 |
| GAE | "The interpolation knob" | n-step advantages 的指数加权和，由 `λ` 参数化。 |
| A2C | "Synchronous actor-critic" | 跨 envs 做 batching；每个 rollout 做一次 gradient step。 |
| A3C | "Async actor-critic" | Worker threads 将 gradients 推送到 shared param server。原始 paper；2026 年较少见。 |
| Bootstrap | "Use V at the horizon" | 截断 rollout，添加 `γ^n V(s_{t+n})` 来闭合求和。 |

## 延伸阅读
- [Mnih et al. (2016). Asynchronous Methods for Deep Reinforcement Learning](https://arxiv.org/abs/1602.01783) — A3C，原始 async actor-critic paper。
- [Schulman et al. (2016). High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438) — GAE。
- [Sutton & Barto (2018). Ch. 13 — Actor-Critic Methods](http://incompleteideas.net/book/RLbook2020.pdf) — foundations；当 critic 是 neural net 时，将它与 Ch. 9 的 function approximation 搭配阅读。
- [Espeholt et al. (2018). IMPALA](https://arxiv.org/abs/1802.01561) — 可扩展 distributed actor-critic，带 V-trace off-policy correction。
- [OpenAI Baselines / Stable-Baselines3](https://stable-baselines3.readthedocs.io/) — 值得阅读的 production A2C/PPO implementations。
- [Konda & Tsitsiklis (2000). Actor-Critic Algorithms](https://papers.nips.cc/paper/1786-actor-critic-algorithms) — two-timescale actor-critic decomposition 的 foundational convergence result。
