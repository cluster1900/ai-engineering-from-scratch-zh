---
id: value-vs-policy-rl
title: Value Methods against Policy Methods
code: VM
subtitle: 并列对比 Q-learning、SARSA、DQN、REINFORCE、A2C 与 PPO。目标、默认值、诊断与修复。
hue: 150
sources: phases/09-reinforcement-learning/04-q-learning-sarsa, phases/09-reinforcement-learning/05-dqn, phases/09-reinforcement-learning/06-policy-gradients-reinforce, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c, phases/09-reinforcement-learning/08-ppo
source_hash: 7bd8a51529d66de6
---

## 四种方法并列对比
type: comparison
span: 2
from: phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/05-dqn/docs/en.md, phases/09-reinforcement-learning/06-policy-gradients-reinforce/docs/en.md, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md

| 因素 | Q-learning, SARSA | DQN | REINFORCE | A2C, PPO |
|---|---|---|---|---|
| 学习什么 | Q 表 | 神经网络 $Q(s, a; \theta)$ | 策略 $\pi_\theta(a \mid s)$ | Actor $\pi_\theta$ 加 critic $V_\phi(s)$ |
| 选动作 | 在 Q 上 ε-greedy | 在 Q 上 ε-greedy | 从 $\pi_\theta$ 采样 | 从 $\pi_\theta$ 采样 |
| 数据 | Q-learning 异策略，SARSA 同策略 | 异策略，回放缓冲 | 同策略，一次更新 | A2C 一次更新，PPO K 个 epoch |
| 目标 | $r + \gamma \max_{a'} Q(s', a')$ | 相同，来自目标网 $\theta^-$ | 回报 $G_t$ | GAE 优势 |
| 偏差与方差 | 自举偏差，低方差 | Max 向上偏差 | 无偏，高方差 | Critic 偏差，方差低得多 |
| 连续动作 | 否 | 否，转到 SAC 或 TD3 | 是，高斯策略 | 是，高斯策略 |
| 玩具 GridWorld | 约 2,000 个 episode | 约 500 个 episode | 带基线约 500 个 episode | PPO，ε 为 0.2，K 为 4 |

## 何时用 X
type: tips
from: phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/05-dqn/docs/en.md, phases/09-reinforcement-learning/06-policy-gradients-reinforce/docs/en.md, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md

- Q-learning：小型表格环境。它直接学习最优策略。
- SARSA 或 Expected SARSA：同策略的安全关键任务。它们在探索期间保持保守。
- DQN：高维状态配离散动作。它是参考的异策略算法。
- REINFORCE：读它，很少跑它。`loss = -advantage * log_prob` 就是带基线的 REINFORCE。
- A2C：GPU 上成批并行环境。到 2026 年，基于 GPU 的 A2C 压过 A3C。
- PPO：MuJoCo、Atari 和 LLM 的 RLHF 的默认选择。
- SAC 或 TD3：连续控制。DQN 没有策略网络。
- GRPO：推理 LLM。它是没有 critic 的 PPO 变体。

## DQN 训练循环
type: architecture
from: phases/09-reinforcement-learning/05-dqn/docs/en.md, phases/09-reinforcement-learning/05-dqn/code/main.py

```arch
node | env | 1,1 | Environment | 4x4 GridWorld | client
node | buf | 2,1 | Replay buffer | capacity 2000 | store
node | online | 3,1 | Online net | weights theta | model
node | target | 3,2 | Target net | frozen copy | model
node | loss | 4,1 | train_step | squared TD error | process
edge | env | buf | transitions
edge | buf | online | minibatch 32
edge | online | env | ε-greedy action
edge | target | loss | y = r + γ max
edge | online | loss | q[a]
edge | online | target | clone every 200 steps
```

## PPO 训练循环
type: flow
from: phases/09-reinforcement-learning/08-ppo/docs/en.md, phases/09-reinforcement-learning/08-ppo/code/main.py

1. **Rollout**：在 N 个并行环境上收集 N 乘 T 条转移。
2. **快照**：在 rollout 时为每个动作存下 `log_pi_old`。
3. **GAE**：计算优势，冻结它们，按 batch 归一化。
4. **Epoch**：做 K 个 epoch，把缓冲洗牌成 minibatch。
5. **比率**：`ratio = exp(logp - rec["log_pi_old"])`。
6. **裁剪**：有益一侧越过 1 ± ε 的样本得到零梯度。
7. **损失**：加上价值 MSE 和熵奖励。走一步梯度。
8. **丢弃**：丢掉这次 rollout，再收集一次新的。

## 价值侧：TD 目标
type: annotated-code
lang: python
from: phases/09-reinforcement-learning/04-q-learning-sarsa/code/main.py

```python
a = epsilon_greedy(Q, s, rng, epsilon)     # behaviour action
s_next, r, done = step(s, a)
best_next = max(Q[s_next].values())        # Q-learning: greedy max
target = r + gamma * best_next
a_next = epsilon_greedy(Q, s_next, rng, epsilon)
target = r + gamma * Q[s_next][a_next]     # SARSA: the next action taken
Q[s][a] += alpha * (target - Q[s][a])      # same TD update for both
Q[s][a] += alpha * (r - Q[s][a])           # terminal step, no bootstrap
```

## 策略侧：梯度、GAE、裁剪
type: annotated-code
lang: python
from: phases/09-reinforcement-learning/06-policy-gradients-reinforce/code/main.py, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/code/main.py, phases/09-reinforcement-learning/08-ppo/code/main.py

```python
G = r + gamma * G                           # reward-to-go, walked backwards
grad = (1.0 if i == a else 0.0) - probs[i]  # onehot minus probs
theta[i][j] += lr * adv * grad * x[j]       # REINFORCE ascent
delta = traj[t]["r"] + gamma * next_v - traj[t]["v"]  # TD residual
gae = delta + gamma * lam * gae             # GAE with lam=0.95
ratio = math.exp(logp - rec["log_pi_old"])  # PPO importance ratio
clipped = (adv > 0 and ratio > 1 + eps) or (adv < 0 and ratio < 1 - eps)
pg_scale = 0.0                              # clipped sample, no gradient
```

## 代码中的任务
type: task-table
from: phases/09-reinforcement-learning/04-q-learning-sarsa/code/main.py, phases/09-reinforcement-learning/05-dqn/code/main.py, phases/09-reinforcement-learning/06-policy-gradients-reinforce/code/main.py, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/code/main.py, phases/09-reinforcement-learning/08-ppo/code/main.py

| 任务 | 代码 |
|---|---|
| 表格 SARSA | `sarsa(episodes, alpha=0.1, gamma=0.99)` |
| 表格 Q-learning | `q_learning(episodes, alpha=0.1, gamma=0.99)` |
| 一次 DQN 梯度步 | `train_step(online, target, mb, gamma, lr)` |
| 同步目标网 | `target = clone(online)` |
| 带基线的 REINFORCE | `reinforce(episodes, use_baseline=True)` |
| GAE 优势 | `gae_advantages(traj, gamma=0.99, lam=0.95)` |
| 训练 A2C | `actor_critic(episodes, lam=0.95)` |
| 带诊断的 PPO 更新 | `mean_kl, clip_frac = ppo_update(...)` |

## 关键公式
type: concepts
from: phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/05-dqn/docs/en.md, phases/09-reinforcement-learning/06-policy-gradients-reinforce/docs/en.md, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md

- **TD 误差**：$\delta = r + \gamma V(s') - V(s)$
- **SARSA 目标**：$r + \gamma Q(s', a')$，用接下来采取的动作。
- **DQN 损失**：$(r + \gamma \max_{a'} Q(s', a'; \theta^-) - Q(s, a; \theta))^2$
- **Double DQN**：$r + \gamma Q(s', \arg\max_{a'} Q(s', a'; \theta); \theta^-)$
- **策略梯度**：$\nabla J = \mathbb{E}[G_t \nabla_\theta \log \pi_\theta(a_t \mid s_t)]$
- **优势**：$A = G - \hat{V}(s)$。期望相同，方差更低。
- **GAE**：$A_t = \sum_l (\gamma \lambda)^l \delta_{t+l}$。λ 为 0 是 TD，λ 为 1 是 MC。
- **PPO 裁剪**：$\min(r_t A_t, \mathrm{clip}(r_t, 1-\epsilon, 1+\epsilon) A_t)$

## 默认值
type: defaults
from: phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/05-dqn/docs/en.md, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 表格 α 与 ε | 0.1 | 把 α 钉在 [0.05, 0.3] |
| 折扣 γ | 0.99 | 课程代码中的默认值 |
| DQN 目标同步 | 10,000 | Atari 环境步 |
| GAE λ | 0.95 | 2026 年的默认值 |
| 价值权重 `c_v` | 0.5 | A2C 与 PPO |
| 熵权重 `c_e` | 0.01 | A2C 与 PPO |
| PPO 裁剪 ε | 0.2 | 0.1 太保守，0.3+ 不稳定 |
| PPO 的 epoch 数 K | 10 | 大小为 64 的 minibatch |

## 排障
type: troubleshooting
from: phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/05-dqn/docs/en.md, phases/09-reinforcement-learning/06-policy-gradients-reinforce/docs/en.md, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| Q 值过高 | 噪声 Q 上的 `max` 向上偏差 | Double DQN 或 Double Q-learning |
| DQN 发散 | 致命三角 | 保留目标网和回放缓冲 |
| DQN 早期过拟合 | 梯度落在约 20 个样本上 | 等到几千条转移 |
| 策略停止探索 | 熵崩溃 | 熵奖励，`c_e` 大于 0 |
| 策略梯度爆炸 | 回报巨大 | 把 G 按 batch 归一化到约 N(0, 1) |
| Actor 在学噪声 | Critic 仍是随机的 | 先热身 critic，放慢 actor 的 LR |
| PPO 平均 KL 超过 0.1 | epoch 太多或 LR 太高 | 降低 `K_EPOCHS` 或 `LR` |
| 裁剪比例接近 0 | 裁剪从未触发 | 提高 `LR` 或 `K_EPOCHS` |

## 缩写
type: glossary
from: phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/05-dqn/docs/en.md, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md

- **TD**：temporal difference。每一步都用自举目标更新。
- **SARSA**：元组 (s, a, r, s', a')。同策略 TD。
- **GLIE**：Greedy in the Limit with Infinite Exploration。ε 条件。
- **DQN**：带神经网络 Q、回放缓冲和目标网络的 Q-learning。
- **GAE**：Generalized Advantage Estimation。n 步优势的加权和。
- **A2C, A3C**：同步批处理，或异步多线程的 actor-critic。
- **TRPO**：Trust Region Policy Optimization。KL 约束，共轭梯度。
- **PPO**：Proximal Policy Optimization。裁剪重要性比率。

## 问题
type: qa
from: phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/06-policy-gradients-reinforce/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md

- **为什么 Q-learning 是异策略？** `max` 假定贪心策略，不管智能体实际采取什么动作。
- **为什么悬崖上 SARSA 更安全？** 它把探索噪声写进 Q 值。
- **为什么价值方法在连续动作上弱？** 在 10 维力矩上做 `argmax` 很难。
- **为什么基线无偏？** 期望中的基线乘以对数策略梯度是 0。
- **为什么 PPO 能复用一次 rollout？** 策略漂得太远时，裁剪会停住更新。
- **最常见的 PPO bug？** 符号反了。最小化裁剪替代目标的相反数。
