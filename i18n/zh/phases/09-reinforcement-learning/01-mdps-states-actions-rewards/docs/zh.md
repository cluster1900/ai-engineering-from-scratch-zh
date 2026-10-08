# 发展计划,国家,行动和奖励

> 马科夫决策过程由五件事组成:状态,行动,转型,奖励,折扣.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Probability & Distributions), Phase 2 · 01 (ML Taxonomy)
**Time:** ~45 minutes

## 问题

你正在写一个棋牌机器人――或者一个库存规划者――或者一个交易代理――或者训练推理模型的PPO循环――四个不同领域,但有一个令人惊的事实:它们都归类为同一个数学对象――

监督学习给你`(x, y)`强化学习不给你标签,只给你一系列状态,你采取的行动,以及一个标量奖励. 这一举动赢得了棋吗? 这次补充决定 省钱吗? 这笔交易是否利?LLM刚刚生成的代币是否从法官那里带来更高的奖励?

在形式化之前,你无法从这个流中学习. 我看到了什么、我做了什么、接下来发生了什么、这是好事. 每个都必须变成你能推理的对象.

## 概念

![Markov decision process: states, actions, transitions, rewards, discount](../assets/mdp.svg)

**五个对象。**

- **States** `S`在网球世界,是格子.在棋牌中,是棋盘.在LLM中,是背景窗口加上任何记忆.
- **Actions** `A`△可选行为──上/下/左/右移动──下一步棋──输出一个代币──
- **Transitions** `P(s' | s, a)`给定状态`s`和行动`a`在棋中是决定性,在库存中是 Stochastic,在 LLM解码中几乎是决定性.
- **Rewards** `R(s, a, s')`△标量信号──赢 = +1,输 = -1──收入减成本──GRPO 中的日志概率比率
- **Discount** `γ ∈ [0, 1)`△未来的奖励 相对于当前的奖励权重.`γ = 0.99`买到大约100步的视界;`γ = 0.9`买到大约10个.

**Markov property** `P(s_{t+1} | s_t, a_t) = P(s_{t+1} | s_0, a_0, …, s_t, a_t)`未来只依赖于当前状态. 如果不成立,说明国家代表性不完整.

**Policies 与 returns。**政策`π(a | s)`把状态映射到行动分布――回归`G_t = r_t + γ r_{t+1} + γ² r_{t+2} + …`是未来奖励的折扣金额――价值`V^π(s) = E[G_t | s_t = s]`是在政策中`π`下从`s`开始的预期回报──Q值`Q^π(s, a) = E[G_t | s_t = s, a_t = a]`每个RL算法都会估计其中一个,然后相应改进`π`,我知道.

**Bellman equations。**在本阶段,所有内容都将被用于固定点方程:

`V^π(s) = Σ_a π(a|s) Σ_{s', r} P(s', r | s, a) [r + γ V^π(s')]`
`Q^π(s, a) = Σ_{s', r} P(s', r | s, a) [r + γ Σ_{a'} π(a'|s') Q^π(s', a')]`

它们将预期的回报 拆成 此步的回报加上落点的折扣值──递归──本9期中每个算法,要么将这个方程代到收收──动态编程),要么从中采样──蒙特卡罗,要么用一步进行启动──时间差距)──


```figure
discount-horizon
```

## 建立它

### 步骤1:一个极小的确定性MDP

一个4×4网球世界――从左上角开始,终端在右下角,每步奖励为 -1,行动为`{up, down, left, right}`见面`code/main.py`,我知道.

```python
GRID = 4
TERMINAL = (3, 3)
ACTIONS = {"up": (-1, 0), "down": (1, 0), "left": (0, -1), "right": (0, 1)}

def step(state, action):
    if state == TERMINAL:
        return state, 0.0, True
    dr, dc = ACTIONS[action]
    r, c = state
    nr = min(max(r + dr, 0), GRID - 1)
    nc = min(max(c + dc, 0), GRID - 1)
    return (nr, nc), -1.0, (nr, nc) == TERMINAL
```

五行――这就是完整环境――确定性过渡――恒定步骤惩罚――吸收终端状态――

### 步骤2:制定一项政策

政策是从状态到行动分布的函数.

```python
def uniform_policy(state):
    return {a: 0.25 for a in ACTIONS}

def rollout(policy, max_steps=200):
    s, total, steps = (0, 0), 0.0, 0
    for _ in range(max_steps):
        a = sample(policy(s))
        s, r, done = step(s, a)
        total += r
        steps += 1
        if done:
            break
    return total, steps
```

运行随机政策 1000 次──这个4×4板的平均回报 大约是 -60到 -80──最佳回报是 -6──沿直线路径向下再向右)──缩小这个差距,就是9期的全部内容──

### 通过贝尔曼方程 精确计算`V^π`

对于小型MDP,贝尔曼方程是一个线性系统.

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in all_states()}
    while True:
        delta = 0.0
        for s in all_states():
            if s == TERMINAL:
                continue
            v = 0.0
            for a, pi_a in policy(s).items():
                s_next, r, _ = step(s, a)
                v += pi_a * (r + gamma * V[s_next])
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

这是Sutton & Barto中第一个算法,也是后续每个RL方法的理论基础.

### 步骤4:`γ`是具有物理含义的超参数

有效的视野大约是`1 / (1 - γ)`,我知道.`γ = 0.9`十个步骤.`γ = 0.99`百步.`γ = 0.999`千个步骤.

太低时,代理会目光短浅――太高时,信用分配会变得,因为许多早期步骤都会共同承担远未来的奖励责任――LLM RLHF通常使用`γ = 1`由于剧情短且有界限.`0.95–0.99`◎ 长远战略游戏 使用`0.999`,我知道.

## 陷

- **Non-Markovian state.**如果您需要最近三次观测才能做出决策,那么, 状态 不仅仅是当前观测──修复:堆框架 (DQN 在 Atari 上堆叠 4 ) 或使用复制状态 (在观测上上使用 LSTM/GRU) ──
- **Sparse rewards.**只有在胜利时给予奖励,会让大状态空间中学习几乎不可能.
- **Reward hacking.**优化代理奖励 经常产生病态行为――OpenAI的船车竞赛代理 一直原地转圈收集强势,而不是完成比赛――始终从目标结果定义奖励,而不是从代理定义――
- **Discount mis-spec.**在无限视界任务上使用 `γ = 1`让每个值都变成无穷.`γ < 1`限制.
- **Reward scale.**随着 {+100, -100} 与 {+1, -1} 的回报会给出相同的最佳政策,但渐进大小会非常不同.`[-1, 1]`,我知道.

## 用它

在2026年的堆积会在接触代码之前,将每个RL管道归类为一个MDP:

| Situation | State | Action | Reward | γ |
|-----------|-------|--------|--------|---|
| Control（locomotion, manipulation） | Joint angles + velocities | Continuous torques | Task-specific shaped | 0.99 |
| Games（chess, Go, poker） | Board + history | Legal move | Win=+1 / loss=-1 | 1.0（finite） |
| Inventory / pricing | Stock + demand | Order qty | Revenue - cost | 0.95 |
| RLHF for LLMs | Context tokens | Next token | Reward-model score at end | 1.0（episode ~200 tokens） |
| GRPO for reasoning | Prompt + partial response | Next token | Verifier 0/1 at end | 1.0 |

在写任何训练循环之前,先写出这个五元组.

## 运送它

保存为`outputs/skill-mdp-modeler.md`其他:

```markdown
---
name: mdp-modeler
description: 给定一个 task description，在训练前产出 Markov Decision Process spec 并标记 formulation risks。
version: 1.0.0
phase: 9
lesson: 1
tags: [rl, mdp, modeling]
---

给定一个 task（control / game / recommendation / LLM fine-tuning），输出：

1. State。精确的 feature vector 或 tensor spec。解释 Markov property。
2. Action。Discrete set 或 continuous range。Dimensionality。
3. Transition。Deterministic、stochastic-with-known-model，或 sample-only。
4. Reward。Function 与 source。Sparse vs shaped。Terminal vs per-step。
5. Discount。Value 与 horizon justification。

拒绝交付任何 state 为 non-Markovian、且未明确提到 frame-stacking 或 recurrent state 的 MDP。拒绝任何不是根据 target outcome 定义的 reward。标记 infinite-horizon task 上的任何 `γ ≥ 1.0`。标记任何 reward range 超过 typical step reward 100x 的情况，因为这很可能是 gradient-explosion source。
```

## 练习

1. **Easy.**在`code/main.py`中实现4×4 GridWorld 和随机政策推广――运行10,000个集――报告回报的平均和std――与最佳回报――6) 比较――
2. **Medium.**对于统一随机政策,使用`γ ∈ {0.5, 0.9, 0.99}`运行`policy_evaluation`把每个`V`打印为4×4格子.解释为什么终端附近的状态值会变得更大.`γ`更快增长.
3. **Hard.**把网格世界 转化为股票:每一个行动以概率`p = 0.1`滑向相邻方向――重新评估统一政策――`V[start]`变得好还是坏?

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| MDP | “Reinforcement Learning setup” | 满足 Markov property 的元组 `(S, A, P, R, γ)`。 |
| State | “Agent 看到的东西” | 在所选 policy class 下，future dynamics 的 sufficient statistic。 |
| Policy | “Agent 的行为” | Conditional distribution `π(a \| s)` 或 deterministic map `s → a`。 |
| Return | “Total reward” | 从当前 step 开始的 discounted sum `Σ γ^t r_t`。 |
| Value | “一个 state 有多好” | 在 `π` 下从 `s` 开始的 expected return。 |
| Q-value | “一个 action 有多好” | 在 `π` 下从 `s` 开始并以第一个 action `a` 开始的 expected return。 |
| Bellman equation | “Dynamic programming recursion” | 把 value / Q 分解为 one-step reward 加 discounted successor value 的 fixed-point。 |
| Discount `γ` | “未来 vs 现在” | 远未来 reward 的 geometric weight；effective horizon 为 `~1/(1-γ)`。 |

## 延伸阅读

- [Sutton & Barto (2018). Reinforcement Learning: An Introduction, 2nd ed.](http://incompleteideas.net/book/RLbook2020.pdf)教科书──第3章介绍MDP和贝尔曼方程;第1章提出奖励假设,它支后续每一课──
- [Bellman (1957). Dynamic Programming](https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming)贝尔曼方程的源头
- [OpenAI Spinning Up — Part 1: Key Concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) 从深度RL角度写的简洁MDP原始.
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) 关于MDP和精确解决方法的操作研究 参考书.
- [Littman (1996). Algorithms for Sequential Decision Making (PhD thesis)](https://www.cs.rutgers.edu/~mlittman/papers/thesis-main.pdf)将MDP作为动态编程特例的最清晰推导.
