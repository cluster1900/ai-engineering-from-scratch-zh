# 蒙特卡罗方法 从完整的剧集中学习

> 动态编程需要模型――蒙特卡洛除了节目 什么都不需要――运行政策,观察回报,取平均――这是RL中最简单的想法,也是解锁后续一切的想法――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming)
**Time:** ~75 minutes

## 问题

动态编程很优秀,但假设你可以对每个状态和行动查询`P(s' | s, a)`△现实世界中几乎没有什么是这样的工作. 机器人无法解析地计算施加合点扭矩 后摄像头像素的分布. 价格算法无法对待每种可能的客户反应.

你需要一种只依赖于环境中的 *样本*方法――运行政策――得到一个轨迹:`s_0, a_0, r_1, s_1, a_1, r_2, …, s_T`,用它来估计价值.

从DP到MC的转变在理念上很重要:我们从 *已知模型 +精确备份* 转向 *样本推出 +平均回报*。变量会上升,但适用性会爆炸式扩大──本课后的每个RL算法,TD、Q-学习、REINFORCE、PPO、GRPO,本质上都是蒙特卡罗估计器,有时会叠加上它的启动────

## 概念

![Monte Carlo: rollout, compute returns, average; first-visit vs every-visit](../assets/monte-carlo.svg)

**核心思想，一行表达：** `V^π(s) = E_π[G_t | s_t = s] ≈ (1/N) Σ_i G^{(i)}(s)`在其中`G^{(i)}(s)`是在政策中`π`下访问 `s`之后观察到的回报――

**First-visit vs every-visit MC。**给定一个多次访问状态`s`首先访问的MC只统计第一次访问后的回归;每次访问的MC统计所有访问――第二次在极限下都是无偏见的――第一次访问更容易分析的样本――每次访问 每次访问使用更多数据,在实践中通常收获更快――

**Incremental mean。**不存储所有回报,而是更新运行平均值:

`V_n(s) = V_{n-1}(s) + (1/n) [G_n - V_{n-1}(s)]`

重新整理:`V_new = V_old + α · (target - V_old)`在其中`α = 1/n`子`1/n`换成常态步骤尺寸`α ∈ (0, 1)`你得到了一个非静止的MC估计器,它会跟踪`π`这种动作就是从MC跳到TD跳到每个现代RL算法的全部关键.

**Exploration 现在成了问题。**通过枚举触及每个州.`π`它们的价值估计将永远停留在零.

1. **Exploring starts。**从随机 (s, a) 双开始每个集.
2. **ε-greedy。**对于当前Q,采取贪行动,但概率很高.`ε`选择随机行动――所有状态行动对都会逐渐被抽样.
3. **Off-policy MC。**在行为政策中`μ`下收集数据,通过重要样本学习目标政策`π`△高变量,但这是通向DQN等重播缓冲方法的桥梁.

**Monte Carlo Control。**评估 → 改善 → 评估,就像政策代一样,但评估是基于样本:

1. 运行`π`得到一个集.
2. 根据观察到的报表更新`Q(s, a)`,我知道.
3. 让我`π`对于`Q`变成了贪的.
4. 复制

在温和条件下,每个对被无限次访问,`α`满足罗宾斯-蒙罗),会以概率1 收到`Q*`和 `π*`,我知道.

## 动手构建

### 步骤1:推出 → (s, a, r) 列表

```python
def rollout(env, policy, max_steps=200):
    trajectory = []
    s = env.reset()
    for _ in range(max_steps):
        a = policy(s)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r))
        s = s_next
        if done:
            break
    return trajectory
```

没有模型,只有`env.reset()`和 `env.step(s, a)`接口与健身房环境相似,但做了精简.

### 计算返回(反向扫描)

```python
def returns_from(trajectory, gamma):
    returns = []
    G = 0.0
    for _, _, r in reversed(trajectory):
        G = r + gamma * G
        returns.append(G)
    return list(reversed(returns))
```

一次通过,`O(T)`△反向复发`G_t = r_{t+1} + γ G_{t+1}`避免了重复求和――

### 步骤3:第一次访问的MC评估

```python
def mc_policy_evaluation(env, policy, episodes, gamma=0.99):
    V = defaultdict(float)
    counts = defaultdict(int)
    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for t, ((s, _, _), G) in enumerate(zip(trajectory, returns)):
            if s in seen:
                continue
            seen.add(s)
            counts[s] += 1
            V[s] += (G - V[s]) / counts[s]
    return V
```

真正工作的就是三行:第一次访问时标记状态 为见,增加数量,更新运行平均量──

### ,我认为这是一个非常重要的问题.

```python
def mc_control(env, episodes, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    counts = defaultdict(lambda: {a: 0 for a in ACTIONS})

    def policy(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for (s, a, _), G in zip(trajectory, returns):
            if (s, a) in seen:
                continue
            seen.add((s, a))
            counts[s][a] += 1
            Q[s][a] += (G - Q[s][a]) / counts[s][a]
    return Q, policy
```

### 第五步:与DP黄金标准相比

当剧情 → ∞ 时,你对 `V^π`实际上:在4×4 GridWorld上运行5万集,可以达到与DP答案相差约`~0.1`在这个范围内.

## 常见陷

- **Infinite episodes。**要求节目必须结束. 如果你的政策可能永远循环,请设置.`max_steps`随着随机政策的 GridWorld 经常的时间,这是正常的,只要确保你正确计数.
- **Variance。**长期的剧情上,变化很大,最后一次倒的回报会以相同的量移动`V(s_0)`◎TD方法 (课4) 通过启动 降低这一点.
- **State coverage。**在新Q上做贪的MC,如果出现关系,只会不断尝试一个行动――你 *必须*做探索-贪、探索开始、UCB) 』
- **Non-stationary policies。**如果`π`发生变化 (如MC控制中那样),旧返回来自不同的政策.
- **Off-policy importance sampling。**权重`π(a|s)/μ(a|s)`随着视界的变化 爆炸――用每决策权重的IS 截断,或切换到 TD――


```figure
epsilon-greedy
```

## 使用它

蒙特卡罗方法在2026年角色:

| Use case | Why MC |
|----------|--------|
| Short-horizon games（blackjack、poker） | Episodes 自然 terminate；returns 清晰。 |
| Logged policy 的 offline evaluation | 对 stored trajectories 的 discounted returns 求平均。 |
| Monte Carlo Tree Search（AlphaZero） | 从 tree leaves 发起的 MC rollouts 指导 selection。 |
| LLM RL evaluation | 为给定 policy 计算 sampled completions 的 average reward。 |
| PPO 中的 baseline estimation | Advantage target `A_t = G_t - V(s_t)` 使用 MC `G_t`。 |
| RL 教学 | 最简单且真正有效的 algorithm；去掉 bootstrapping 就能看到核心。 |

现代深度RL算法将通过`n`两个端点都是同一类估计器的实例.

## 交付它

保存为`outputs/skill-mc-evaluator.md`其他:

```markdown
---
name: mc-evaluator
description: 通过 Monte Carlo rollouts 评估 policy，并在可用时生成带有 DP-comparison 的 convergence report。
version: 1.0.0
phase: 9
lesson: 3
tags: [rl, monte-carlo, evaluation]
---

给定一个 environment（episodic，带 reset+step API）和一个 policy，输出：

1. 方法。First-visit vs every-visit MC。理由。
2. Episode budget。目标数量、variance diagnostic、预期 standard error。
3. Exploration plan。ε schedule（如需要）或 exploring starts。
4. Gold-standard comparison。如果是 tabular，则给出 DP-optimal V*；否则给出来自 Q-learning / PPO baseline 的 bound。
5. Termination check。Max-step cap、timeouts、non-terminating trajectories 的处理。

没有 finite horizon cap 时，拒绝在 non-episodic tasks 上运行 MC。对于 tabular tasks，如果每个 state 少于 100 个 episodes，拒绝报告 V^π estimates。将任何具有 zero-variance actions 的 policy 标记为 exploration risk。
```

## 练习

1. **Easy.**实现4×4格林世界 上统一随机政策的第一次访问MC评价――运行10,000集――将`V(0,0)`随剧情数量变化的曲线与DP 答案对照绘制
2. **Medium.**用`ε ∈ {0.01, 0.1, 0.3}`实现 ε-贪的MC控制――比较20,000集后的平均回报――曲线看起来是什么样子?偏差变量交易体现在哪里?
3. **Hard.**使用重要性采样 实现*非政策* MC:在统一随机政策`μ`下收集数据,估计确定性最佳政策`π`的`V^π`△比较单纯的IS、每决策IS 和权重的IS──哪个变量最低?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Monte Carlo | “Random sampling” | 通过对来自分布的 iid samples 求平均来估计 expectations。 |
| Return `G_t` | “Future reward” | 从 step `t` 到 episode 结束的 discounted rewards 总和：`Σ_{k≥0} γ^k r_{t+k+1}`。 |
| First-visit MC | “Count each state once” | 一个 episode 中只有第一次访问会贡献到 value estimate。 |
| Every-visit MC | “Use all visits” | 每次访问都会贡献；略有 biased，但 sample-efficient 更高。 |
| ε-greedy | “Exploration noise” | 以概率 `1-ε` 选择 greedy action；以概率 `ε` 选择 random action。 |
| Importance sampling | “Correcting for sampling from the wrong distribution” | 通过 `π(a\|s)/μ(a\|s)` 乘积对 returns 重新加权，从 `μ` 数据估计 `V^π`。 |
| On-policy | “Learn from my own data” | Target policy = behavior policy。Vanilla MC、PPO、SARSA。 |
| Off-policy | “Learn from someone else's data” | Target policy ≠ behavior policy。Importance-sampled MC、Q-learning、DQN。 |

## 延伸阅读

- [Sutton & Barto (2018). Ch. 5 — Monte Carlo Methods](http://incompleteideas.net/book/RLbook2020.pdf) 经典处理.
- [Singh & Sutton (1996). Reinforcement Learning with Replacing Eligibility Traces](https://link.springer.com/article/10.1007/BF00114726)第一次访问与每次访问分析――
- [Precup, Sutton, Singh (2000). Eligibility Traces for Off-Policy Policy Evaluation](http://incompleteideas.net/papers/PSS-00.pdf)非政策 MC 和变化控制
- [Mahmood et al. (2014). Weighted Importance Sampling for Off-Policy Learning](https://arxiv.org/abs/1404.6362) 现代低变量IS估计器──
- [Tesauro (1995). TD-Gammon, A Self-Teaching Backgammon Program](https://dl.acm.org/doi/10.1145/203330.203343) MC/TD自动玩 收到超人玩的第一场大规模实证展示;也是本阶段的后半部分每节课的概念先驱.
