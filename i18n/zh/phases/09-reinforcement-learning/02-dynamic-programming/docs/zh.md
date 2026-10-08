# 动态编程 政策反复和值反复

> 动态编程是带作弊的RL. 你已经知道过渡和奖励函数;你只需要反复代贝尔曼方程,直到`V`或`π`它们是每种基于样本的方法都试图接近基准.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs)
**Time:** ~75 minutes

## 问题

你有一个已知模式的MDP:你可以对任意状态行动对查询`P(s' | s, a)`和 `R(s, a, s')`△库存经理知道需求分布――棋盘游戏有确定性过渡――格林世界只需要四行Python――你有一个模型*――

无模型RL(Q-学习、PPO、REINFORCE) 是为没有模型而发明的情况,也就是你只能从环境中样本化.但是当你确实有模型时,就有更快的方法:动态编程.贝尔曼在1957年设计了这些方法.

你在2026年仍然需要它们,原因有三点. 第一,RL研究中每个表格环境都将使用DP求解,以生成黄金标准政策.`V*(s_0)`根据研究的结果,你在学习中发现了一些问题.

## 概念

![Policy iteration and value iteration, side by side](../assets/dp.svg)

**两个算法，都是 Bellman 上的 fixed-point iteration。**

**Policy iteration。**交替执行两个步骤,直到政策不再变.

1. *评估:* 给定政策`π`反复应用`V(s) ← Σ_a π(a|s) Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`直到收,从而计算`V^π`,我知道.
2. 给定`V^π`让我们`π`对于`V^π`变为贪:`π(s) ← argmax_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`,我知道.

收是有保证的,因为 (a) 每一步的改进要保持`π`不变,要么严格提高某些州的`V^π`尽管在大型状态空间中,通常也会在520次的外部代中收.

**Value iteration。**将评估和改善 合并成一次扫描――应用贝尔曼 *优化*方程:

`V(s) ← max_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`

重复到底`max_s |V_{new}(s) - V(s)| < ε`◎最后通过选择贪行动 提取政策──每次代 严格更快,因为没有内部评估循环,但通常需要更多代 才能收──

**Generalized policy iteration (GPI)。**统一视角──值函数和政策被锁定在一个双向改进循环中;任何同时推动二者向彼此一致的方法──异步值代,修改政策代,Q学习,演员批评,PPO都是GPI的一个例子──

**为什么 `γ < 1` 很重要。**贝尔曼操作员在超级标准下是一个`γ`- 收缩:`||T V - T V'||_∞ ≤ γ ||V - V'||_∞`缩意味着唯一的固定点 和几何收.`γ < 1`你已经失去了保证,需要有限的视界或吸收终端状态.

## 动手构建

### 构建GridWorldMDP模型

通过使用1课时相同的4×4网格世界.`0.1`概率滑向随机垂直方向.

```python
SLIP = 0.1

def transitions(state, action):
    if state == TERMINAL:
        return [(state, 0.0, 1.0)]
    outcomes = []
    for direction, prob in action_probs(action):
        outcomes.append((apply_move(state, direction), -1.0, prob))
    return outcomes
```

`transitions(s, a)`返回`(s', r, p)`这就是整个模型.

### 步骤2:政策评估

给定政策`π(s) = {action: prob}`代贝尔曼方程,直到`V`变化:

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = sum(pi_a * sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a))
                   for a, pi_a in policy(s).items())
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

### 第三步:政策改进

用于`V`利政策的替代`π`如果`π`没有变化,就回来,因为我们已经达到最佳水平.

```python
def policy_improvement(V, gamma=0.99):
    new_policy = {}
    for s in states():
        best_a = max(
            ACTIONS,
            key=lambda a: sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a)),
        )
        new_policy[s] = best_a
    return new_policy
```

### 组合起来

```python
def policy_iteration(gamma=0.99):
    policy = {s: "up" for s in states()}   # arbitrary start
    for _ in range(100):
        V = policy_evaluation(lambda s: {policy[s]: 1.0}, gamma)
        new_policy = policy_improvement(V, gamma)
        if new_policy == policy:
            return V, policy
        policy = new_policy
```

在4×4上典型会在46次外表代内收──输出 `V*(0,0) ≈ -6`政策将严格减少步数.

### 步骤5:值代(单循环 版本)

```python
def value_iteration(gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = max(sum(p * (r + gamma * V[s_prime])
                       for s_prime, r, p in transitions(s, a))
                   for a in ACTIONS)
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            break
    policy = policy_improvement(V, gamma)
    return V, policy
```

相同的固定点,更少的代码行数.

## 常见陷

- **忘记处理 terminals。**如果你对吸收状态应用贝尔曼,它仍然会得到一个什么都不会改变的最佳行动──用`if s == terminal: V[s] = 0`防护.
- **Sup-norm vs L2 convergence。**使用 `max |V_new - V|`理论保证是超级标准上.
- **In-place vs synchronous updates。**原地更新`V[s]`比使用单独的`V_new`收更快──制作代码 使用本地──
- **Policy ties。**如果两个操作具有相同的Q值,`argmax`可能每次代用不同方式打破平局,导致政策稳定 检查振荡──使用稳定的结合断裂 固定序列中的第一个行动)。
- **State-space explosion。**每次扫描都是`O(|S| · |A|)`△最多可用于约107个州. △超过这个规模,你需要函数近似.


```figure
value-iteration-gamma
```

## 使用它

在2026年,DP是正确的基准,也是规划者的内部循环:

| Use case | Method |
|----------|--------|
| 精确求解小型 tabular MDP | Value iteration（更简单）或 policy iteration（outer steps 更少） |
| 验证 Q-learning / PPO 实现 | 在 toy environment 上与 DP-optimal V* 对比 |
| Model-based RL（Phase 9 · 10） | 在 learned transition model 上做 Bellman backup |
| AlphaZero / MuZero 中的 Planning | Monte Carlo Tree Search = async Bellman backup |
| Offline RL（CQL、IQL） | Conservative Q-iteration，即带有 OOD actions penalty 的 DP |

每当有人说 最佳值函数时,他们指的是 DP 固定点──当你在论文中看到`V*`或`Q*`时,请想象这个循环.

## 交付它

保存为`outputs/skill-dp-solver.md`其他:

```markdown
---
name: dp-solver
description: 通过 policy iteration 或 value iteration 精确求解小型 tabular MDP。报告收敛行为。
version: 1.0.0
phase: 9
lesson: 2
tags: [rl, dynamic-programming, bellman]
---

给定一个已知 model 的 MDP，输出：

1. 选择。Policy iteration vs value iteration。理由需关联 |S|、|A|、γ。
2. 初始化。V_0、starting policy。Convergence sensitivity。
3. 停止条件。Sup-norm tolerance ε。预期 sweeps 数。
4. 验证。精确计算的 V*(s_0)。提取出的 Greedy policy。
5. 使用方式。这个 baseline 将如何用于 debug/evaluate sampling-based methods。

拒绝在 state spaces > 10⁷ 上运行 DP。没有 sup-norm check 时，拒绝声称收敛。将 infinite-horizon task 上任何 γ ≥ 1 标记为 guarantee violation。
```

## 练习

1. **Easy.**在4×4格林世界上使用`γ ∈ {0.9, 0.99}`运行值回复――直到`max |ΔV| < 1e-6`需要多少次扫描?`V*`打印为4×4网.
2. **Medium.**在"逼式"的网格世界中,`0.1`) 上比较政策代和值代――统计:扫描、墙钟时间、最终`V*(0,0)`哪个在代上收更快?哪个在墙钟上更快?
3. **Hard.**构建修改政策代:在评估阶段中,只运行`k`接下来扫描,而不是运行到收收.`k ∈ {1, 2, 5, 10, 50}`绘制`V*(0,0)`错误与`k` 节 告诉你评估/改进交易的什么信息?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy iteration | “DP algorithm” | 交替进行 evaluation（`V^π`）和 improvement（相对于 `V^π` 的 greedy `π`），直到 policy 不再变化。 |
| Value iteration | “Faster DP” | Bellman optimality backup 在一次 sweep 中应用；几何收敛到 `V*`。 |
| Bellman operator | “The recursion” | `(T V)(s) = max_a Σ P (r + γ V(s'))`；sup-norm 下的 `γ`-contraction。 |
| Contraction | “Why DP converges” | 任何满足 `\|\|T x - T y\|\| ≤ γ \|\|x - y\|\|` 的 operator `T` 都有唯一 fixed point。 |
| GPI | “Everything is DP” | Generalized Policy Iteration：任何推动 `V` 和 `π` 达到相互一致的方法。 |
| Synchronous update | “Jacobi-style” | 在一次 sweep 中始终使用旧的 `V`；便于清晰分析，但更慢。 |
| In-place update | “Gauss-Seidel-style” | 使用正在被更新的 `V`；实践中收敛更快。 |

## 延伸阅读

- [Sutton & Barto (2018). Ch. 4 — Dynamic Programming](http://incompleteideas.net/book/RLbook2020.pdf)政策代和值代的经典呈现――
- [Bertsekas (2019). Reinforcement Learning and Optimal Control](http://www.athenasc.com/rlbook.html)对缩减绘图论证的严谨处理
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887)修改政策代及其融合分析――
- [Howard (1960). Dynamic Programming and Markov Processes](https://mitpress.mit.edu/9780262582300/dynamic-programming-and-markov-processes/) 原始的政策反复论文──
- [Bertsekas & Tsitsiklis (1996). Neuro-Dynamic Programming](http://www.athenasc.com/ndpbook.html)从DP到大约DP/深度RL的桥梁,后续每节都会使用到──
