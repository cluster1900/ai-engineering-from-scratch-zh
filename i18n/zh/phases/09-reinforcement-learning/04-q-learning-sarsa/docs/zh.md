# 时间差异 Q学习和SARSA

> 蒙特卡罗会一直等到集结.TD 通过启动下一个价值估计,在每一步之后更新.Q-学习是非政策的,且偏乐观的.SARSA是政策的,且偏谨慎的.

**Type:** Build
**Languages:** Python
**前置要求:**阶段9 · 01 (MDPs),阶段9 · 02 (动态编程),阶段9 · 03 (蒙特卡洛)
**Time:** ~75 minutes

## 问题

蒙特卡洛可行,但它有两个很高的要求. 它需要结束节目,并且只能在最终回归后更新. 如果你的节目有1000步,MC就需要等1000步才能更新任何东西.

动态编程则相反:零方差的启动备份,但要求已知模型──

根据单个过渡期,学习的时间差异 (TD) 折中了两者.`(s, a, r, s')`构建一个单步目标`r + γ V(s')`并把`V(s)`由于在RHS上使用近似的`V`虽然会引入偏差,但偏差远低于MC,并且从第一步开始就能在线更新.

这是所有现代RL (DQN、A2C、PPO、SAC) 所依赖的支点――9 阶段 剩下的内容,都是在你将在本课中写的单步TD更新 之上叠加函数近似和技巧――

## 概念

![Q-learning vs SARSA: off-policy max vs on-policy Q(s', a')](../assets/td.svg)

**用于 V 的 TD(0) update：**

`V(s) ← V(s) + α [r + γ V(s') - V(s)]`

方括号中的量是 TD 错误`δ = r + γ V(s') - V(s)`,这是一个MC中.`G_t - V(s_t)`收取要求`α`满足罗宾斯-蒙罗`Σ α = ∞`没有任何`Σ α² < ∞`),并且所有国家都受到无限次访问.

**Q-learning。**一种用于控制的非政策 TD 方法:

`Q(s, a) ← Q(s, a) + α [r + γ max_{a'} Q(s', a') - Q(s, a)]`

`max`假设从`s'`开始遵循*贪*政策,不管代理人实际上采取什么行动――这种解让Q学习在代理人通过 ε-贪 探索时仍然学习`Q*`〔Mnih et al. (2015) 将将其转换为Atari 上的深度Q学习(05课程〕

**SARSA。**一种政策上的TD方法:

`Q(s, a) ← Q(s, a) + α [r + γ Q(s', a') - Q(s, a)]`

这个名字来自tuple.`(s, a, r, s', a')`◎ SARSA 使用代理 下一步*实际*采取行动`a'`没有贪.`argmax`,它会收到当前运行的任意 ε-贪`π`应对`Q^π`在极限`ε → 0`下会变化`Q*`,我知道.

**cliff-walking 的差异。**在经典的悬崖走路任务中,Q-学习学习沿悬崖边缘最好的路径,但在探索期间偶尔会吃到惩罚.SARSA将学习从悬崖远走更安全的路径,因为它将探索噪音计入了自己的Q-值.随着训练,在`ε → 0`时两者都将达到最佳水平. 在实践中,这是很重要的:当部署时确实正在进行探索,SARSA的行为将更保持.

**Expected SARSA。**用`π`下的期望值替换`Q(s', a')`其他:

`Q(s, a) ← Q(s, a) + α [r + γ Σ_{a'} π(a'|s') Q(s', a') - Q(s, a)]`

方差低于SARSA(不对`a'`采样),目标也在政策上.现代教材通常将其视为默认选择.

**n-step TD 和 TD(λ)。**通过等待`n`步再启动,在 TD(0) 和 MC 之间插值.`n=1`是TD,`n=∞`是MC──TD(λ) 用几何权重`(1-λ)λ^{n-1}`对于所有人`n`求平均――大多数深度RL使用3到20之间`n`,我知道.


```figure
qlearning-gridworld
```

## 构建它

### 步骤1:基于 ε贪政策的 SARSA

```python
def sarsa(env, episodes, alpha=0.1, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})

    def choose(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        s = env.reset()
        a = choose(s)
        while True:
            s_next, r, done = env.step(s, a)
            a_next = choose(s_next) if not done else None
            target = r + (gamma * Q[s_next][a_next] if not done else 0.0)
            Q[s][a] += alpha * (target - Q[s][a])
            if done:
                break
            s, a = s_next, a_next
    return Q
```

八行――与Q学习的唯一区别是目标那一行――

### 步骤2:Q学习

```python
def q_learning(env, episodes, alpha=0.1, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    for _ in range(episodes):
        s = env.reset()
        while True:
            a = choose(s, Q, epsilon)
            s_next, r, done = env.step(s, a)
            target = r + (gamma * max(Q[s_next].values()) if not done else 0.0)
            Q[s][a] += alpha * (target - Q[s][a])
            if done:
                break
            s = s_next
    return Q
```

`max`这种符号就是在政策和政策之外的区别.

### 步骤3:学习曲线

随着每100集的平均回归──Q-学习 在简单的确定性格里德世界上收更快;SARSA 在悬崖上行走上更保守──在`code/main.py`两者之间.`α=0.1, ε=0.1`下,大约2000集后都接近最优.

### 步骤 4:与DP真值比较

运行值反复(课02)得到 `Q*`查查`max_{s,a} |Q_learned(s,a) - Q*(s,a)|`,一个健康的表表格TD代理在4×4格林世界上训练10,000个集后,应落在`~0.5`在内

## 陷

- **初始 Q values 很重要。**乐观初始化 负奖励 任务中`Q = 0`们的丧可能永远困在贪的政策中.
- **α schedule。**常数`α`对于不平稳问题是可以的.`α_n = 1/n`在理论上能收,但在实践中太慢;把`α`固定在`[0.05, 0.3]`并监控学习曲线.
- **ε schedule。**从高值开始`ε=1.0`),衰减到`ε=0.05`,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
- **Q-learning 中的 max bias。**当 当`Q`有噪音,`max`操作员存在上偏差――会导致高估;哈塞尔特的双重Q学习(05课中DDQN使用的做法) 用两个Q表修复这个问题――
- **非终止 episodes。**标准做法:把上限视为非终端,继续启动.
- **State hashing。**如果状态是体/体,使用可哈希的键(体,不是列表;四舍五进后的浮体,不是原始浮体)

## 使用它

2026年的TD景观:

| Task | Method | Reason |
|------|--------|--------|
| 小型 tabular environments | Q-learning | 直接学习 optimal policy。 |
| On-policy safety-critical | SARSA / Expected SARSA | 探索期间更保守。 |
| High-dimensional state | DQN (Phase 9 · 05) | 带 replay 和 target net 的 Neural Network Q-function。 |
| Continuous actions | SAC / TD3 (Phase 9 · 07) | 在 Q-network 上做 TD update；policy net 发出 actions。 |
| LLM RL (reward-model-based) | PPO / GRPO (Phase 9 · 08, 12) | 使用通过 GAE 得到的 TD-style advantage 的 actor-critic。 |
| Offline RL | CQL / IQL (Phase 9 · 08) | 带 conservative regularization 的 Q-learning。 |

你在2026年论文中读到的九成"RL",都是Q学习或SARSA的某种扩展.

## 交付它

保存为`outputs/skill-td-agent.md`其他:

```markdown
---
name: td-agent
description: Pick between Q-learning, SARSA, Expected SARSA for a tabular or small-feature RL task.
version: 1.0.0
phase: 9
lesson: 4
tags: [rl, td-learning, q-learning, sarsa]
---

Given a tabular or small-feature environment, output:

1. Algorithm. Q-learning / SARSA / Expected SARSA / n-step variant. One-sentence reason tied to on-policy vs off-policy and variance.
2. Hyperparameters. α, γ, ε, decay schedule.
3. Initialization. Q_0 value (optimistic vs zero) and justification.
4. Convergence diagnostic. Target learning curve, `|Q - Q*|` check if DP is possible.
5. Deployment caveat. How will exploration behave at inference? Is SARSA's conservatism needed?

Refuse to apply tabular TD to state spaces > 10⁶. Refuse to ship a Q-learning agent without a max-bias caveat. Flag any agent trained with ε held at 1.0 throughout (no exploitation phase).
```

## 练习

1. **Easy。**在4×4 GridWorld 上实现Q学习和SARSA──绘制2000个节目的学习曲线――每100个节目的平均回报――谁收更快?
2. **Medium。**构建一个悬崖走路环境,4×12,最后一行是悬崖,奖励 -100并重置到起点) ――比较Q学习和SARSA的最终政策――截图展示它们各自走过的路径――哪个更接近悬崖?
3. **Hard。**实现双重Q学习――在噪音奖励 GridWorld 上(给每步奖励 添加高斯噪音 σ=5),展示Q学习 会明显高估 `V*(0,0)`双重Q学习会不会.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| TD error | "The update signal" | `δ = r + γ V(s') - V(s)`，bootstrapped residual。 |
| TD(0) | "One-step TD" | 每次 transition 后只使用 next state's estimate 进行更新。 |
| Q-learning | "Off-policy RL 101" | 对 next-state actions 使用 `max` 的 TD update；无论 behavior policy 如何，都会学习 `Q*`。 |
| SARSA | "On-policy Q-learning" | 使用实际 next action 的 TD update；为当前 ε-greedy π 学习 `Q^π`。 |
| Expected SARSA | "The low-variance SARSA" | 用 π 下的期望替换采样得到的 `a'`。 |
| GLIE | "Correct exploration schedule" | Greedy in the Limit with Infinite Exploration；Q-learning 收敛所需。 |
| Bootstrapping | "Using current estimate in the target" | 区分 TD 和 MC 的关键。是偏差来源，但能大幅降低方差。 |
| Maximization bias | "Q-learning overestimates" | 对有噪声 estimates 取 `max` 会产生向上偏差；由 Double Q-learning 修复。 |

## 延伸阅读
- [Watkins & Dayan (1992). Q-learning](https://link.springer.com/article/10.1007/BF00992698) 原始论文和收证明.
- [Sutton & Barto (2018). Ch. 6 — Temporal-Difference Learning](http://incompleteideas.net/book/RLbook2020.pdf) TD(0) 、SARSA、Q-学习、预期的SARSA──
- [Hasselt (2010). Double Q-learning](https://papers.nips.cc/paper_files/paper/2010/hash/091d584fced301b442654dd8c23b3fc9-Abstract.html)最大化偏见的修复方法──
- [Seijen, Hasselt, Whiteson, Wiering (2009). A Theoretical and Empirical Analysis of Expected SARSA](https://ieeexplore.ieee.org/document/4927542)预期的SARSA的动机.
- [Rummery & Niranjan (1994). On-line Q-learning using connectionist systems](https://www.researchgate.net/publication/2500611_On-Line_Q-Learning_Using_Connectionist_Systems) 创造SARSA 这个术语的论文 ((当时被称为"修改的连接主义Q学习")
- [Sutton & Barto (2018). Ch. 7 — n-step Bootstrapping](http://incompleteideas.net/book/RLbook2020.pdf)将 TD(0) 泛化为 TD(n),这是从Q学习向资格的痕迹,以及后来在PPO中GAE的路径.
