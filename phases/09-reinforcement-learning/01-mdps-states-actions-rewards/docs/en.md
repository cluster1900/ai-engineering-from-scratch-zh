# MDPs、States、Actions 与 Rewards

> Markov Decision Process 由五件事组成：states、actions、transitions、rewards、discount。RL 中的一切：Q-learning、PPO、DPO、GRPO，都是在这个形状上优化。学一次，后面的 Reinforcement Learning 都能顺着读下去。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Probability & Distributions), Phase 2 · 01 (ML Taxonomy)
**Time:** ~45 minutes

## 问题

你正在写一个 chess bot。或者一个 inventory planner。或者一个 trading agent。或者训练 reasoning model 的 PPO loop。四个不同领域，却有一个出人意料的事实：它们都可以归约为同一个数学对象。

Supervised learning 给你 `(x, y)` pairs，并要求你拟合一个函数。Reinforcement Learning 不给你 labels，只给你一串 states、你采取的 actions，以及一个标量 reward。这个 move 赢了棋吗？这次 restock decision 省钱了吗？这笔 trade 盈利了吗？LLM 刚刚生成的 Token 是否从 judge 那里带来了更高 reward？

在形式化之前，你无法从这条 stream 中学习。“我看到了什么”、“我做了什么”、“接下来发生了什么”、“这有多好”——每一个都必须变成你能推理的对象。这个形式化就是 Markov Decision Process。本 phase 中的每个 RL algorithm，包括最后的 RLHF 和 GRPO loops，都是在这个形状上优化。

## 概念

![Markov decision process: states, actions, transitions, rewards, discount](../assets/mdp.svg)

**五个对象。**

- **States** `S`。Agent 做决策所需的一切。在 GridWorld 中，是格子。在 chess 中，是棋盘。在 LLM 中，是 context window 加上任何 memory。
- **Actions** `A`。可选行为。上/下/左/右移动。下一步棋。输出一个 Token。
- **Transitions** `P(s' | s, a)`。给定 state `s` 和 action `a`，next state 的分布。在 chess 中是 deterministic，在 inventory 中是 stochastic，在 LLM decoding 中几乎 deterministic。
- **Rewards** `R(s, a, s')`。标量信号。赢 = +1，输 = -1。收入减成本。GRPO 中的 log-likelihood ratio 项。
- **Discount** `γ ∈ [0, 1)`。未来 reward 相对于当前 reward 的权重。`γ = 0.99` 买到约 100 steps 的 horizon；`γ = 0.9` 买到约 10。

**Markov property** `P(s_{t+1} | s_t, a_t) = P(s_{t+1} | s_0, a_0, …, s_t, a_t)`。未来只依赖当前 state。如果不成立，说明 state representation 不完整。这不是方法失败，而是 state 失败。

**Policies 与 returns。** Policy `π(a | s)` 把 states 映射到 action distributions。Return `G_t = r_t + γ r_{t+1} + γ² r_{t+2} + …` 是未来 rewards 的 discounted sum。Value `V^π(s) = E[G_t | s_t = s]` 是在 policy `π` 下从 `s` 开始的 expected return。Q-value `Q^π(s, a) = E[G_t | s_t = s, a_t = a]` 是以特定 action 开始的 expected return。每个 RL algorithm 都会估计这两者之一，然后相应改进 `π`。

**Bellman equations。** 本 phase 中所有内容都会用到的 fixed-point equations：

`V^π(s) = Σ_a π(a|s) Σ_{s', r} P(s', r | s, a) [r + γ V^π(s')]`
`Q^π(s, a) = Σ_{s', r} P(s', r | s, a) [r + γ Σ_{a'} π(a'|s') Q^π(s', a')]`

它们把 expected return 拆成“这一步的 reward”加上“落点的 discounted value”。递归。本 Phase 9 中的每个 algorithm，要么把这个 equation 迭代到收敛（dynamic programming），要么从中采样（Monte Carlo），要么用一步进行 bootstrap（temporal difference）。


```figure
discount-horizon
```

## Build It

### Step 1：一个极小的 deterministic MDP

一个 4×4 GridWorld。Agent 从左上角开始，terminal 在右下角，每步 reward 为 -1，actions 为 `{up, down, left, right}`。见 `code/main.py`。

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

五行。这就是完整环境。Deterministic transitions、恒定 step penalty、absorbing terminal state。

### Step 2：roll out 一个 policy

Policy 是从 state 到 action distribution 的函数。最简单的是 uniform random。

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

运行 random policy 1000 次。这个 4×4 board 的 average return 大约是 -60 到 -80。Optimal return 是 -6（沿直线路径向下再向右）。缩小这个 gap，就是 Phase 9 的全部内容。

### Step 3：通过 Bellman equation 精确计算 `V^π`

对于小型 MDPs，Bellman equation 是一个 linear system。枚举 states，应用 expectation，迭代直到 values 不再变化。

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

这是 iterative policy evaluation。它是 Sutton & Barto 中的第一个 algorithm，也是后续每个 RL method 的理论基础。

### Step 4：`γ` 是具有物理含义的 hyperparameter

Effective horizon 大约是 `1 / (1 - γ)`。`γ = 0.9` → 10 steps。`γ = 0.99` → 100 steps。`γ = 0.999` → 1000 steps。

太低时，agent 会目光短浅。太高时，credit assignment 会变 noisy，因为许多早期 steps 都会共同承担远未来 reward 的责任。LLM RLHF 通常使用 `γ = 1`，因为 episodes 短且有界。Control tasks 使用 `0.95–0.99`。Long-horizon strategy games 使用 `0.999`。

## 陷阱

- **Non-Markovian state.** 如果你需要最近三次 observations 才能决策，那么 “state” 不只是当前 observation。修复：stack frames（DQN 在 Atari 上堆叠 4 帧）或使用 recurrent state（在 observations 上用 LSTM/GRU）。
- **Sparse rewards.** 只在胜利时给 reward，会让大 state spaces 中的学习几乎不可能。使用 shape rewards（中间信号）或用 imitation bootstrap（Phase 9 · 09）。
- **Reward hacking.** 优化 proxy reward 经常产生病态行为。OpenAI 的 boat-racing agent 一直原地转圈收集 powerups，而不是完成比赛。始终从目标结果定义 reward，而不是从 proxy 定义。
- **Discount mis-spec.** 在 infinite-horizon task 上使用 `γ = 1` 会让每个 value 都变成无穷。始终使用 finite horizon 或 `γ < 1` 来限制。
- **Reward scale.** {+100, -100} 与 {+1, -1} 的 rewards 会给出相同 optimal policies，但 Gradient magnitude 会非常不同。接入 PPO/DQN 前，把它 normalize 到近似 `[-1, 1]`。

## Use It

2026 年的 stack 会在接触代码之前，把每条 RL pipeline 都归约为一个 MDP：

| Situation | State | Action | Reward | γ |
|-----------|-------|--------|--------|---|
| Control（locomotion, manipulation） | Joint angles + velocities | Continuous torques | Task-specific shaped | 0.99 |
| Games（chess, Go, poker） | Board + history | Legal move | Win=+1 / loss=-1 | 1.0（finite） |
| Inventory / pricing | Stock + demand | Order qty | Revenue - cost | 0.95 |
| RLHF for LLMs | Context tokens | Next token | Reward-model score at end | 1.0（episode ~200 tokens） |
| GRPO for reasoning | Prompt + partial response | Next token | Verifier 0/1 at end | 1.0 |

在写任何 training loop 之前，先写出这五元组。大多数 “RL does not work” 的 bug report，最终都能追溯到纸面上已经破损的 MDP formulation。

## Ship It

保存为 `outputs/skill-mdp-modeler.md`：

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

1. **Easy.** 在 `code/main.py` 中实现 4×4 GridWorld 和 random-policy rollout。运行 10,000 个 episodes。报告 return 的 mean 和 std。与 optimal return（-6）比较。
2. **Medium.** 对 uniform-random policy，使用 `γ ∈ {0.5, 0.9, 0.99}` 运行 `policy_evaluation`。把每个 `V` 打印为 4×4 grid。解释为什么 terminal 附近的 state values 会随更大的 `γ` 更快增长。
3. **Hard.** 把 GridWorld 改成 stochastic：每个 action 以概率 `p = 0.1` 滑向相邻方向。重新评估 uniform policy。`V[start]` 会变好还是变差？为什么？

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

- [Sutton & Barto (2018). Reinforcement Learning: An Introduction, 2nd ed.](http://incompleteideas.net/book/RLbook2020.pdf) — 教科书。第 3 章介绍 MDPs 和 Bellman equations；第 1 章提出 reward hypothesis，它支撑后续每一课。
- [Bellman (1957). Dynamic Programming](https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming) — Bellman equation 的源头。
- [OpenAI Spinning Up — Part 1: Key Concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) — 从 deep-RL 角度写的简洁 MDP primer。
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) — 关于 MDPs 和 exact solution methods 的 operations-research 参考书。
- [Littman (1996). Algorithms for Sequential Decision Making (PhD thesis)](https://www.cs.rutgers.edu/~mlittman/papers/thesis-main.pdf) — 将 MDPs 作为 dynamic-programming 特例的最清晰推导。
