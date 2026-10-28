---
id: reinforcement-learning
title: Reinforcement Learning
code: RL
subtitle: MDP、价值方法、策略梯度、PPO、RLHF 与 GRPO。公式、更新行与诊断来自 Phase 9。
hue: 75
sources: phases/09-reinforcement-learning/01-mdps-states-actions-rewards, phases/09-reinforcement-learning/02-dynamic-programming, phases/09-reinforcement-learning/03-monte-carlo-methods, phases/09-reinforcement-learning/04-q-learning-sarsa, phases/09-reinforcement-learning/05-dqn, phases/09-reinforcement-learning/06-policy-gradients-reinforce, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c, phases/09-reinforcement-learning/08-ppo, phases/09-reinforcement-learning/09-reward-modeling-rlhf, phases/09-reinforcement-learning/12-rl-for-games
source_hash: a115ea75e61f42aa
---

## PPO 训练循环
type: architecture
from: phases/09-reinforcement-learning/08-ppo/docs/en.md, phases/09-reinforcement-learning/08-ppo/code/main.py, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md

```arch
node | envs | 1,1 | N parallel envs | T steps each
node | actor | 2,1 | Actor | softmax policy
node | buf | 1,2 | Rollout buffer | s, a, r, log_pi_old
node | critic | 2,2 | Critic | v_old per state
node | gae | 1,3 | GAE | advantages, returns
node | clip | 2,3 | Clipped surrogate | K epochs, minibatches
node | diag | 1,4 | Diagnostics | mean KL, clip fraction
edge | actor | envs | action
edge | envs | buf | transition
edge | critic | buf | value
edge | buf | gae |
edge | gae | clip | advantage
edge | clip | actor | update
edge | clip | diag |
```

## RLHF 的三个阶段
type: flow
from: phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md

1. **SFT**：在人类示范上微调基座模型。
2. **Preference data**：收集 prompt、chosen 与 rejected 的行。
3. **Reward model**：在 SFT 模型上用 Bradley-Terry 损失训练标量头。
4. **Policy and reference**：从 SFT 启动策略。冻结一份副本作参考。
5. **Reward**：RM 分数减去 $\beta$ 倍相对参考的 KL。
6. **PPO**：对照该奖励更新 token 级策略。
7. **Monitor**：盯住平均 KL。大约超过 5 到 10，漂移或奖励黑客就开始了。

## 价值公式
type: concepts
from: phases/09-reinforcement-learning/01-mdps-states-actions-rewards/docs/en.md, phases/09-reinforcement-learning/02-dynamic-programming/docs/en.md, phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/05-dqn/docs/en.md

- **MDP**：元组 $(S, A, P, R, \gamma)$，带马尔可夫性质。
- **Return**：$G_t = r_t + \gamma r_{t+1} + \gamma^2 r_{t+2} + \ldots$
- **Bellman V**：$V^\pi(s) = \sum_a \pi(a \mid s) \sum_{s', r} P(s', r \mid s, a) [r + \gamma V^\pi(s')]$
- **Value iteration**：$V(s) \leftarrow \max_a \sum_{s',r} P(s',r \mid s,a) [r + \gamma V(s')]$
- **TD(0)**：$V(s) \leftarrow V(s) + \alpha [r + \gamma V(s') - V(s)]$
- **Q-learning**：$Q(s, a) \leftarrow Q(s, a) + \alpha [r + \gamma \max_{a'} Q(s', a') - Q(s, a)]$
- **SARSA**：$Q(s, a) \leftarrow Q(s, a) + \alpha [r + \gamma Q(s', a') - Q(s, a)]$
- **DQN loss**：在回放样本上 $(r + \gamma \max_{a'} Q(s', a'; \theta^-) - Q(s, a; \theta))^2$。

## 策略公式
type: concepts
from: phases/09-reinforcement-learning/06-policy-gradients-reinforce/docs/en.md, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md, phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md, phases/09-reinforcement-learning/12-rl-for-games/docs/en.md

- **Policy gradient**：$\nabla J(\theta) = \mathbb{E}[ \sum_t G_t \cdot \nabla_\theta \log \pi_\theta(a_t \mid s_t) ]$
- **TD advantage**：$\delta_t = r_{t+1} + \gamma V(s_{t+1}) - V(s_t)$
- **GAE**：$A_t^{\text{GAE}} = \sum_{l=0}^{\infty} (\gamma \lambda)^l \delta_{t+l}$
- **PPO ratio**：$r_t(\theta) = \pi_\theta(a_t \mid s_t) / \pi_{\theta_{\text{old}}}(a_t \mid s_t)$
- **PPO clip**：$\mathbb{E}_t [ \min( r_t A_t, \mathop{\mathrm{clip}}(r_t, 1-\epsilon, 1+\epsilon) A_t ) ]$
- **Bradley-Terry**：$L(\phi) = -\mathbb{E}[ \log \sigma(R_\phi(x, y_+) - R_\phi(x, y_-)) ]$
- **RLHF reward**：$R_\phi(x, y) - \beta \cdot \mathrm{KL}(\pi_\theta \Vert \pi_{\text{ref}})$
- **GRPO advantage**：$A_i = (r_i - \text{mean}_r) / \text{std}_r$，对同一 prompt 的 $G$ 个样本。

## 选择方法
type: command-table
from: phases/09-reinforcement-learning/02-dynamic-programming/docs/en.md, phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/05-dqn/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md, phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md, phases/09-reinforcement-learning/12-rl-for-games/docs/en.md

| 情境 | 方法 |
|---|---|
| 小型表格 MDP，模型已知 | value iteration 或 policy iteration |
| 小型表格 MDP，只有样本 | Q-learning |
| 同策略，安全关键 | SARSA 或 Expected SARSA |
| 高维状态，离散动作 | DQN，生产中用 Double DQN |
| 连续控制 | 高斯策略的 PPO，或 SAC 与 TD3 |
| 从偏好对齐 LLM | 先 DPO，带 KL 惩罚的 RLHF-PPO |
| LLM 数学与代码推理 | 带验证器奖励的 GRPO |
| 双人棋类 | AlphaZero 或 MuZero |

## 更新行
type: task-table
from: phases/09-reinforcement-learning/03-monte-carlo-methods/docs/en.md, phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/05-dqn/docs/en.md, phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md, phases/09-reinforcement-learning/12-rl-for-games/docs/en.md

| 任务 | 代码 |
|---|---|
| 回报，反向扫 | `G = r + gamma * G` |
| 用 epsilon greedy 探索 | `if random() < epsilon: return choice(ACTIONS)` |
| Q-learning 目标 | `target = r + (gamma * max(Q[s_next].values()) if not done else 0.0)` |
| SARSA 目标 | `target = r + (gamma * Q[s_next][a_next] if not done else 0.0)` |
| TD 步 | `Q[s][a] += alpha * (target - Q[s][a])` |
| 同步 DQN 目标网 | `if steps % sync_every == 0: target = copy(online)` |
| 带 KL 的 RLHF 奖励 | `reward = dot(w, bag([token])) - beta * kl(probs, probs_ref)` |
| GRPO 组优势 | `advs = [(r - mean_r) / std_r for r in rewards]` |

## PPO 裁剪更新
type: annotated-code
lang: python
from: phases/09-reinforcement-learning/08-ppo/code/main.py

```python
for rec, adv in zip(mb, adv_norm):                 # advantages normalized per minibatch
    x = rec["x"]
    probs = softmax(logits(theta, x))              # current policy
    logp = math.log(max(probs[rec["a"]], 1e-12))
    ratio = math.exp(logp - rec["log_pi_old"])     # new over old probability
    clipped = (adv > 0 and ratio > 1 + eps) or (adv < 0 and ratio < 1 - eps)
    pg_scale = 0.0 if clipped else ratio * adv     # clipped means zero gradient
    for action in range(N_ACTIONS):
        grad_logpi = (1.0 if action == rec["a"] else 0.0) - probs[action]
        for j in range(N_FEAT):
            theta[action][j] += lr_a * pg_scale * grad_logpi * x[j]
    err = rec["ret"] - value(w, x)                 # critic error
    for j in range(N_FEAT):
        w[j] += lr_v * err * x[j]                  # critic step
```

## 默认值与数字
type: defaults
from: phases/09-reinforcement-learning/01-mdps-states-actions-rewards/docs/en.md, phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md, phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md, phases/09-reinforcement-learning/12-rl-for-games/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 折扣 $\gamma$ | 0.99 | 视界约 $1 / (1 - \gamma)$，因此约 100 步 |
| 表格 $\alpha$ 与 $\epsilon$ | 0.1 | 4x4 GridWorld 上的 Q-learning 与 SARSA |
| PPO 裁剪 $\epsilon$ | 0.2 | 0.1 太保守，0.3 及以上不稳定 |
| 价值系数 $c_v$ | 0.5 | PPO 与 A2C |
| 熵系数 $c_e$ | 0.01 | PPO 与 A2C |
| GAE $\lambda$ | 0.95 | 0 是 TD，1 是 MC |
| RLHF KL $\beta$ | 0.01-0.05 | 让策略靠近 SFT |
| GRPO 组大小 $G$ | 8 | 8 到 64 是标准，低于 4 噪声大 |

## 排障
type: troubleshooting
from: phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/05-dqn/docs/en.md, phases/09-reinforcement-learning/06-policy-gradients-reinforce/docs/en.md, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md, phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 平均 KL 超过 0.1 | 策略相对旧策略漂得太远 | 降低 `K_EPOCHS` 或 `LR` |
| 裁剪比例接近 0 | 裁剪从未触发 | 提高 `LR` 或 `K_EPOCHS` |
| 裁剪比例 0.5 或更高 | 对 rollout 过拟合 | 降低 `LR` 或 `K_EPOCHS` |
| 奖励上升，人工评估下降 | 对 RM 的奖励黑客 | 早停，提高 $\beta$，拓宽 RM 数据 |
| 回复变长 | RM 奖励长度 | 长度归一化奖励 |
| Q 值过高 | 噪声 Q 上的 max 偏差 | Double DQN |
| DQN 发散 | 致命三角 | 保留目标网与回放缓冲 |
| 策略停止探索 | 熵崩溃 | 用 $c_e > 0$ 的熵奖励 |

## 缩写
type: glossary
from: phases/09-reinforcement-learning/01-mdps-states-actions-rewards/docs/en.md, phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/05-dqn/docs/en.md, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md, phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md, phases/09-reinforcement-learning/12-rl-for-games/docs/en.md

- **MDP**：Markov Decision Process。状态、动作、转移、奖励、折扣。
- **TD**：Temporal Difference。用一步自举目标更新。
- **DQN**：Deep Q-Network。带回放、目标网与奖励裁剪的 Q-learning。
- **A2C**：Advantage Actor-Critic。同步批处理并行环境。
- **GAE**：Generalized Advantage Estimation。TD 残差的加权和。
- **PPO**：Proximal Policy Optimization。裁剪重要性比率，多轮 epoch。
- **RLHF**：Reinforcement Learning from Human Feedback。SFT，然后 RM，然后 PPO。
- **GRPO**：Group Relative Policy Optimization。没有 critic 的 PPO 变体。

## 问题
type: qa
from: phases/09-reinforcement-learning/03-monte-carlo-methods/docs/en.md, phases/09-reinforcement-learning/04-q-learning-sarsa/docs/en.md, phases/09-reinforcement-learning/06-policy-gradients-reinforce/docs/en.md, phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md, phases/09-reinforcement-learning/12-rl-for-games/docs/en.md

- **同策略还是异策略？** 同策略从自己的数据学习。异策略从另一策略的数据学习。
- **Q-learning 还是 SARSA？** Q-learning 在 max 上自举。SARSA 用它采取的下一步动作，更谨慎。
- **为什么减去基线？** 它保持梯度无偏并降低方差。
- **为什么 RLHF 里有 KL？** 它让策略靠近训练 RM 的数据。
- **为什么推理用 GRPO？** 没有价值网络，所以内存减半。按 prompt 归一化适合稀疏奖励。

## 提示
type: tips
from: phases/09-reinforcement-learning/01-mdps-states-actions-rewards/docs/en.md, phases/09-reinforcement-learning/02-dynamic-programming/docs/en.md, phases/09-reinforcement-learning/05-dqn/docs/en.md, phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/docs/en.md, phases/09-reinforcement-learning/08-ppo/docs/en.md

- 写训练循环之前先写五个 MDP 元组。
- 用 DP 价值 $V^{\ast}$ 对照检查表格智能体。
- 在训练前 10% 把 $\epsilon$ 从 1.0 衰减到 0.01。
- 按批把优势归一化到零均值单位方差。
- 用 exp(log_new 减 log_old) 计算比率以保证数值稳定。
- 从 $K = 10$ 个 epoch 与 64 的小批量开始 PPO。
