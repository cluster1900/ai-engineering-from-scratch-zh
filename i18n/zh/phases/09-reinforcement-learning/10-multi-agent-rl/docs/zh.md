# 多代理的RL

> 假设一个代理的RL环境是静止的.把两个正在学习的代理放进同一个世界,这个假设就会失效:每个代理都是另一个代理的环境的一部分,而且两者都在变化.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (Q-learning), Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~45 minutes

## 问题

一个机器人学习在房间中导航,是单机机器人. 一个足球队 不是. 星球对战的阿尔法星对战的星球.

在每个多代理设置中,从任何一个代理人的角度来看,其他代理人是环境的一部分.随着它们学习并改变自身行为,环境会变得非静止.

这会破坏表式融合证据 (Q-learning的保证假设环境是静止的) ⋅也会破坏天真的深层次的RL:代理会在循环中追逐彼此,永远无法获得稳定政策.

2026年应用包括:机器人群,交通路线,自动驾驶车队,市场模拟器,多代理的LLM系统 (第16阶段) 以及任何有多个智能玩家的游戏.

## 概念

![Four MARL regimes: indep, centralized critic, self-play, league](../assets/marl.svg)

**Formalism: Markov Game.**民党的泛化:国家`S`、联合行动`a = (a_1, …, a_n)`过渡`P(s' | s, a)`并且每个代理人的奖励.`R_i(s, a, s')`,每个代理人`i`在自己的政策中`π_i`如果奖励完全相同,它是**fully cooperative**如果是零和,它是**adversarial**如果混合,则是**general-sum**,我知道.

**核心挑战：**

- **Non-stationarity.**经纪人`i`视角看,`P(s' | s, a_i)`取决于`π_{-i}`现在它正在变化.
- **Credit assignment.**在分享奖励下,是哪个代理导致它?
- **Exploration coordination.**代理人必须探索互补策略,而不是重复探索同一个国家.
- **Scalability.**共同行动空间 会随`n`升的数量.
- **Partial observability.**每个特工只能看到自己的观察;

**四种主导范式：**

**1. Independent Q-learning / independent PPO (IQL, IPPO).**每个代理学习自己的Q或政策,把其他代理当作环境的一部分――简单,有时有效――特别是经验重演作为一种平滑的代理模型――技巧时――理论收性:没有――实践中:适合宽的任务,不适合紧密的任务――

**2. Centralized training, decentralized execution (CTDE).**每个代理都有自己的政策.`π_i`通过当地观察.`o_i`为了实现部署时是标准的分散执行.`Q(s, a_1, …, a_n)`以完整的全球状态和联合行动为条件.
- **MADDPG**带有每个代理人一个集中批评的DPG──
- **COMA**问题:如果我当时采取行动`a'`我会得到多少奖励?
- **MAPPO**现在,**IPPO**带有集中价值函数的PPO──2026年合作社MARL 中的主导方法──
- **QMIX**值分解`Q_tot(s, a) = f(Q_1(s, a_1), …, Q_n(s, a_n))`,并使用单调的混合物──

**3. Self-play.**同一个代理的两个副本对战对手的政策 *就是*我过去某个快照 中的政策──阿尔法戈 / 阿尔法零 / 穆泽罗──OpenAI Five──最适合零积分游戏;训练信号是对称的──

**4. League play.**专注击败当前最佳策略) 和主要利用者 (专注击败利用者) ‧阿尔法星 (StarCraft II) ・当游戏存在时岩纸刀策略循环时,这是必要的──

**Communication.**允许代理人互相发送学习信息`m_i`在合作环境中有效──Foerster等人 (2016) 表明,可分辨的代理间通信可以端到端训练──今天基于LLM的多代理系统 (Phase 16) 本质上是用自然语言通信──


```figure
f3-marl-orbit
```

## 构建它

本课使用一个6×6网格世界,包含两个合作代理.`-1`两者都到达时`+10`参见`code/main.py`,我知道.

### 步骤1:多代理环境

```python
class CoopGridWorld:
    def __init__(self):
        self.size = 6
        self.goal = (5, 5)

    def reset(self):
        return ((0, 0), (5, 0))  # 两个 agents

    def step(self, state, actions):
        a1, a2 = state
        new1 = move(a1, actions[0])
        new2 = move(a2, actions[1])
        done = (new1 == self.goal) and (new2 == self.goal)
        reward = 10.0 if done else -1.0
        return (new1, new2), reward, done
```

共同行动空间是`|A|² = 16`◎全球状态是两个位置.

### 步骤2:独立的Q学习

每个代理运行自己的Q表,以共同状态作为关键. 每一步:两者都选择 ε-贪的行动,收集联合过渡,并各自使用共享奖励更新自己的Q.

```python
def independent_q(env, episodes, alpha, gamma, epsilon):
    Q1, Q2 = defaultdict(default_q), defaultdict(default_q)
    for _ in range(episodes):
        s = env.reset()
        while not done:
            a1 = epsilon_greedy(Q1, s, epsilon)
            a2 = epsilon_greedy(Q2, s, epsilon)
            s_next, r, done = env.step(s, (a1, a2))
            target1 = r + gamma * max(Q1[s_next].values())
            target2 = r + gamma * max(Q2[s_next].values())
            Q1[s][a1] += alpha * (target1 - Q1[s][a1])
            Q2[s][a2] += alpha * (target2 - Q2[s][a2])
            s = s_next
```

在紧密关联的任务中,上会失败 (例如,一个代理必须*等待*另一个代理的任务)

### 步骤3:集中式Q与分解值更新

对于联合行动使用一个Q:`Q(s, a_1, a_2)`〔使用共享奖励〕 更新──执行时通过边缘化来分散:`π_i(s) = argmax_{a_i} max_{a_{-i}} Q(s, a_1, a_2)`换一个*正确*的全球观.

### 步骤4: 简单的自动玩

一个代理,两个角色. 一个训练代理, 一个对抗代理.`K`个节目,把A的重量 复制到B──对称训练,进展一致──阿尔法零食谱的缩写版──

## 常见陷

- **Non-stationary replay.**经验重复比单机更糟糕,因为旧的转变是由现在已经过去了的对手生成的.
- **Credit assignment ambiguity.**长集 后得到共享奖励;没有明确的方式说明哪个代理做出贡献──修复:反事实基线(COMA),或按代理做奖励塑造──
- **Policy drift / chasing.**每个代理的最佳反应都随着另一个代理的更新而变化.
- **Reward hacking via coordination.**经纪人 找到了设计者没有预期到的协调的实践――拍卖员 会收到零的报价――修复:谨慎的奖励设计――行为限制――
- **Exploration redundancy.**两个代理 探索相同的状态行动对子──修复:每个代理使用体奖金,或角色条件──
- **League cycles.**纯自动游戏可能卡在统治周期 中──修复:使用包含多样的对手的联赛游戏──
- **Sample explosion.** `n`个代理 × 状态空间 × 联合行动──用函数近似;使用因子化行动空间(每个代理 一个政策输出头)。

## 使用它

2026 年 MARL 应用图谱:

| Domain | Method | Notes |
|--------|--------|-------|
| Cooperative navigation / manipulation | MAPPO / QMIX | CTDE；shared critic + decentralized actors。 |
| Two-player games (chess, Go, poker) | Self-play with MCTS (AlphaZero) | Zero-sum；对称训练。 |
| Complex multiplayer (Dota, StarCraft) | League play + imitation pretraining | OpenAI Five, AlphaStar。 |
| Autonomous-vehicle fleets | CTDE MAPPO / PPO with attention | Partial obs；可变 team sizes。 |
| Auction markets | Game-theoretic equilibrium + RL | 当 `n` → ∞ 时使用 mean-field RL。 |
| LLM multi-agent systems (Phase 16) | Natural-language comm + role conditioning | RL loop 位于 agent-planning layer。 |

2026年,MARL最大的增长领域是基于LLM的系统:由语言模型代理组成的群体进行协商,辩论,构建软件.

## 交付它

保存为`outputs/skill-marl-architect.md`其他:

```markdown
---
name: marl-architect
description: 为给定任务选择正确的 multi-agent RL regime（IPPO, CTDE, self-play, league）。
version: 1.0.0
phase: 9
lesson: 10
tags: [rl, multi-agent, marl, self-play]
---

给定一个包含 `n` 个 agents 的任务，输出：

1. Regime classification。Cooperative / adversarial / general-sum。说明理由。
2. Algorithm。IPPO / MAPPO / QMIX / self-play / league。理由要关联 coupling tightness 和 reward structure。
3. Information access。Centralized training（哪些 global info 会进入 critic）？Decentralized execution？
4. Credit assignment。Counterfactual baseline、value decomposition，或 reward shaping。
5. Exploration plan。Per-agent entropy、population-based training，或 league。

在 tightly-coupled cooperative tasks 上拒绝 independent Q-learning。拒绝为存在 cycle risks 的 general-sum 推荐 self-play。标记任何没有 fixed-opponent eval 的 MARL pipeline（cherry-picked self-play numbers 很常见）。
```

## 练习

1. **Easy.**在2代理合作社GridWorld上训练独立Q学习――需要多少集才能让平均回报 > 0?绘制联合学习曲线――
2. **Medium.**添加一个协调任务:只有当两个代理在同一回合踏上目标时,才算到达目标.
3. **Hard.**实现一个用于MAPPO类型的培训的集中批评,并协调任务上与独立的PPO相比,

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Markov game | "Multi-agent MDP" | `(S, A_1, …, A_n, P, R_1, …, R_n)`；每个 agent 都有自己的 reward。 |
| CTDE | "Centralized training, decentralized execution" | Training time 使用 joint critic；每个 agent 的 policy 只使用 local obs。 |
| IPPO | "Independent PPO" | 每个 agent 单独运行 PPO。简单 baseline；经常被低估。 |
| MAPPO | "Multi-agent PPO" | 带有以 global state 为条件的 centralized value function 的 PPO。 |
| QMIX | "Monotonic value decomposition" | `Q_tot = f_monotone(Q_1, …, Q_n)` 允许 decentralized argmax。 |
| COMA | "Counterfactual multi-agent" | Advantage = 我的 Q 减去对我的 action 做 marginalizing 后的 expected Q。 |
| Self-play | "Agent vs past self" | 单个 agent，两个 roles；zero-sum games 的标准方法。 |
| League play | "Population training" | 缓存过去的 policies，从 pool 中采样 opponents；处理 strategy cycles。 |

## 延伸阅读

- [Lowe et al. (2017). Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments (MADDPG)](https://arxiv.org/abs/1706.02275)带集中批评的CTDE。
- [Foerster et al. (2017). Counterfactual Multi-Agent Policy Gradients (COMA)](https://arxiv.org/abs/1705.08926) 根据信用分配的反事实基线――
- [Rashid et al. (2018). QMIX: Monotonic Value Function Factorisation](https://arxiv.org/abs/1803.11485) 带单调性的价值分解――
- [Yu et al. (2022). The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games (MAPPO)](https://arxiv.org/abs/2103.01955)                    
- [Vinyals et al. (2019). Grandmaster level in StarCraft II using multi-agent reinforcement learning (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z) 大规模联赛比赛――
- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270)零积分游戏中的纯粹自动游戏
- [Sutton & Barto (2018). Ch. 15 — Neuroscience & Ch. 17 — Frontiers](http://incompleteideas.net/book/RLbook2020.pdf)包含教材对多代理设置和非站立性问题的简短处理,而CTDE正是为解决这个问题而设计的.
- [Zhang, Yang & Başar (2021). Multi-Agent Reinforcement Learning: A Selective Overview](https://arxiv.org/abs/1911.10635) 覆盖合作,竞争和混合 MARL以及融合结果的综述
