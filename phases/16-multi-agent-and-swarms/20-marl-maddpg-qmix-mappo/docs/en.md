# MARL — MADDPG, QMIX, MAPPO

> multi-agent 协调的 Reinforcement Learning 传承，在 2026 年仍然影响着 LLM-agent 系统。**MADDPG** (Lowe et al., NeurIPS 2017, arXiv:1706.02275) 引入了 Centralized Training, Decentralized Execution (CTDE)：训练期间，每个 critic 都能看到所有 agent 的状态和动作；测试时只运行本地 actor。适用于 cooperative、competitive 和 mixed 场景。**QMIX** (Rashid et al., ICML 2018, arXiv:1803.11485) 是带有 monotonic mixing network 的 value-decomposition；每个 agent 的 Q 会组合成 joint Q，因此 `argmax` 可以干净地分配到各 agent — 在 StarCraft Multi-Agent Challenge (SMAC) 中占主导地位。**MAPPO** (Yu et al., NeurIPS 2022, arXiv:2103.01955) 是带 centralized value function 的 PPO；在 particle-world、SMAC、Google Research Football、Hanabi 上，只需极少调参就“surprisingly effective”。这些方法支撑了必须 decentralized 行动的 agent team policy 训练。MAPPO 是 **2026 年 cooperative-MARL 的默认 baseline**。本课会从一个小型 grid-world toy 构建每一种方法，在接触 LLM-agent training 之前，先把这三个想法练成肌肉记忆。

**类型：** 学习
**语言：** Python (stdlib，小型无 NumPy 实现)
**先修：** Phase 09 (Reinforcement Learning), Phase 16 · 09 (Parallel Swarm Networks)
**时间：** ~90 分钟

## 问题

LLM-agent 系统越来越多地训练 inter-agent coordination 的 policy：何时 defer、何时 act、调用哪个 peer。告诉你如何训练这类 policy 的文献就是 Multi-Agent Reinforcement Learning (MARL)，它早于 LLM 浪潮，并且已有一小组主流 algorithm。

如果没有 pattern vocabulary，阅读 MARL 论文会很痛苦。Centralized training with decentralized execution (CTDE)、value decomposition 和 centralized critics 不是 buzzword — 它们是对具体问题的具体答案：

- Independent RL（每个 agent 单独学习）从每个 agent 的视角看是 non-stationary。很糟。
- Centralized RL（一个 agent 控制全部）无法扩展，并且违反 execution constraints。
- CTDE 兼得两者优点：用 global information 训练，用 local policies 部署。

## 概念

### 论文使用的三类 environment

- **Particle World (multi-agent particle env)。** 简单 2D physics，包含 cooperative/competitive task。MADDPG 的原始 testbed。
- **StarCraft Multi-Agent Challenge (SMAC)。** cooperative micro-management，partial observation。QMIX 的 testbed。Discrete actions，continuous states。
- **Google Research Football, Hanabi, MPE。** MAPPO baseline。

不同 env 有不同的 action/observation 类型。algorithm 会据此选择。

### MADDPG (2017) — CTDE pattern

每个 agent `i` 都有一个 actor `mu_i(o_i)`，把自己的 observation 映射到 action。每个 agent 也有一个 critic `Q_i(x, a_1, ..., a_n)`，它在训练期间看到所有 observation 和所有 action。actor 通过 policy gradient，依据 critic 的评估来更新。

```
actor update:    grad_theta_i J = E[grad_theta mu_i(o_i) * grad_a_i Q_i(x, a_1..n) at a_i=mu_i(o_i)]
critic update:   TD on Q_i(x, a_1..n) given next-state joint estimate
```

为什么用 CTDE：训练时，我们知道所有人的 action；我们用这些信息降低每个 critic 的 variance。部署时，每个 agent 只看到 `o_i`，并调用 `mu_i(o_i)`。

失败模式：critics 会随 N 个 agent 增长（输入包含所有 action）。如果没有 approximation，很难扩展到 ~10 个以上的 agent。

### QMIX (2018) — value decomposition

仅适用于 cooperative。Global reward 是每个 agent 的 Q-value 的 monotone function 之和：

```
Q_tot(tau, a) = f(Q_1(tau_1, a_1), ..., Q_n(tau_n, a_n)),   df/dQ_i >= 0
```

monotonicity 保证 `argmax_a Q_tot` 可以通过每个 agent 独立选择 `argmax_{a_i} Q_i` 来计算。这正是你需要的 **decentralized execution property**。训练时，mixing network 从每个 agent 的 Q 生成 `Q_tot`。

为什么 QMIX 在 SMAC 上获胜：cooperative StarCraft micro-management 具有 homogeneous agents、local obs、global reward — 与 value decomposition 完美契合。

失败模式：monotonicity constraint 限制较强；有些 task 的 reward structure 不是 monotone decomposable（例如一个 agent 为团队牺牲）。扩展方法（QTRAN、QPLEX）会放松这一点。

### MAPPO (2022) — 被低估的默认选择

Multi-Agent PPO：带 centralized value function 的 PPO。每个 agent 有自己的 policy；所有 agent 共享（或拥有 per-agent）能看到 full state 的 value function。Yu et al. 2022 在五个 benchmark 上将 MAPPO 与 MADDPG、QMIX 及其扩展进行比较，并发现：

- MAPPO 在 particle-world、SMAC、Google Research Football、Hanabi、MPE 上匹配或超过 off-policy MARL 方法。
- 所需 hyperparameter tuning 极少。
- 训练稳定；跨 seed 可复现。

在这篇论文之前，community 低估了 on-policy MARL。到 2026 年，MAPPO 是 cooperative MARL 的默认 baseline；任何新方法都必须击败它。

### 为什么 LLM-agent engineer 应该关心

三个直接用途：

1. **Router training。** meta-agent 选择哪个 sub-agent 处理 task。这是一个包含 N 个 decentralized sub-agents 和一个 centralized router 的 MARL 问题。MAPPO 适合。
2. **Role emergence。** 在 generative-agent simulation 中，训练 agent 随时间采用互补 role，本质上是伪装成别的形式的 MARL 问题。QMIX-style value decomposition 通过结构强制 complementarity。
3. **Multi-agent tool use。** 当 agent 共享 tool 并争夺 budget 时，通过 CTDE 训练它们可以得到可部署的 local policies，并遵守 resource constraints。

实践提醒：到 2026 年，大多数 production LLM-agent 系统是 prompt 它们的 policy，而不是训练它们。MARL 适用于你具备以下条件时：(a) 大量 interaction data，(b) 清晰的 reward signal，(c) 愿意投入 training infrastructure。

### CTDE 作为 RL 之外的 design pattern

即使不训练，CTDE 也是有用的 architecture pattern：

- 在 *design* 阶段，假设拥有完整 team visibility。
- 在 *runtime* 阶段，强制 decentralized execution：每个 agent 只看到 `o_i`。

这个 pattern 迫使你明确维护 per-agent state，并提前思考 partial observability。许多 production multi-agent 系统默默假设 everywhere 都有 shared state — CTDE discipline 可以防止这一点。

### non-stationarity 问题

当多个 agent 同时学习时，每个 agent 的 environment（包含其他 agent 的 policy）都是 non-stationary。经典 single-agent RL 证明会失效。本课中的 MARL algorithm 都在处理这个问题：

- MADDPG：global critic 看到所有 action，因此它的 value estimate 是 stationary 的。
- QMIX：value decomposition 将 learning 移到 joint-Q space，在那里 optimality 有明确定义。
- MAPPO：centralized value function 会抑制来自其他 agent policy change 的 variance。

在 LLM-agent 系统中，non-stationarity 表现为“我的 agent 上个月还正常，现在上游另一个 agent 改了，我的就异常了”。带 CTDE 的 MARL training 是原则性的修复方式；prompt-level fix 更快，但耐久性较差。

### 本课不涵盖什么

训练真实 network 是 Phase 09 的主题。本课构建 scripted-policy 版本，在没有 gradient update 的情况下演示 CTDE、value-decomposition 和 centralized-value pattern。目标是在你使用完整 MARL library（PyMARL、MARLlib、RLlib multi-agent）之前，先内化这些 pattern。

```figure
sw-ctde
```

## 构建它

`code/main.py` 在一个很小的 2-agent cooperative grid-world 上实现了三个 pattern demonstration：

- Environment：2 个 agent 在 4x4 grid 上，一个 reward pellet。Reward = 如果任一 agent 到达 pellet 则为 1；task 结束。
- `IndependentAgents` — 每个 agent 把其他 agent 当作 environment。Baseline。
- `MADDPGStyle` — centralized critic 计算 joint value；actor policy 从中更新。Scripted policy improvement。
- `QMIXStyle` — 使用 monotone mixer 的 value decomposition。
- `MAPPOStyle` — centralized value function；policy 根据 shared baseline 更新。

四者运行相同 episode，并报告 average steps-to-goal。CTDE variant 会收敛到比 independent baseline 更短的 path。

运行：

```
python3 code/main.py
```

预期输出：independent agents 平均需要 ~6 步；CTDE variant 会收敛到 ~3.5 步（4x4 grid 的 optimal 是 3）。即使使用 scripted policies，pattern 差异也会显现。

## 使用它

`outputs/skill-marl-picker.md` 是一个 skill，用来为给定 multi-agent task 选择 MARL algorithm：cooperative vs competitive、homogeneous vs heterogeneous、action-space type、scale、reward signal。

## 交付它

production 中的 MARL 很少见。当你确实使用它时：

- **从 MAPPO 开始。** 2022 年论文将它确立为 baseline；先复现它可以省下数周追逐更花哨方法的时间。
- **记录每个 agent 的 observation 和 action stream。** 没有 per-agent trace，debug MARL 几乎无望。
- **分离 training code 和 execution code。** CTDE 是一种 discipline；让 execution path 真的只看到 `o_i`。
- **Reward shaping 警告。** MARL 对 reward design 极其敏感。shaping 中一个 coordination bug，agent 就会学会利用它。运行 adversarial tests。
- **对于 LLM agents**，优先考虑 prompt-level policies。只有当 interaction data + reward signal + infrastructure 都具备时，才投入 MARL training。

## 练习

1. 运行 `code/main.py`。测量 independent 与 MAPPO-style agents 之间的 steps-to-goal 差距。在 6x6 grid 上，这个差距会变大还是变小？
2. 实现一个 competitive variant：两个 agent，一个 pellet，只有第一个到达的 agent 获得 reward。哪种 pattern 能干净地处理 competition？历史上是 MADDPG。
3. 阅读 MADDPG (arXiv:1706.02275) Section 3。用你自己的话，以 pseudocode 形式 symbolically 实现确切的 critic update rule。
4. 阅读 MAPPO (arXiv:2103.01955)。为什么作者认为 centralized value + PPO 在他们的 benchmark 上胜过 off-policy MARL？列出三个最强主张。
5. 将 CTDE 作为 design pattern 应用于一个假想的 LLM-agent 系统（例如 research agent + summarizer + coder）。有哪些 design time 可用、但 runtime 不可用的 joint information？

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| MARL | "Multi-Agent RL" | 面向 multi-agent 系统的 Reinforcement Learning。 |
| CTDE | "Centralized Training, Decentralized Execution" | 用 global info 训练；用 local policies 部署。 |
| MADDPG | "Multi-Agent DDPG" | CTDE，每个 agent 的 critic 能看到所有 observations + actions。 |
| QMIX | "Value decomposition" | 每个 agent 的 Q 的 monotonic mixing。Cooperative。 |
| MAPPO | "Multi-Agent PPO" | 带 centralized value function 的 PPO。2026 年默认 baseline。 |
| Value decomposition | "Sum of individual Qs" | Joint Q 表示为每个 agent 的 Q 的 monotone function。 |
| Non-stationarity | "Moving targets" | 当其他 agent 学习时，每个 agent 的 env 都在变化。MARL 的核心问题。 |
| On-policy / off-policy | "Learn from current / replay" | PPO 是 on-policy (MAPPO)；DDPG 和 Q-learning 是 off-policy。 |
| SMAC | "StarCraft Multi-Agent Challenge" | cooperative micromanagement benchmark；QMIX 的本土主场。 |

## 延伸阅读

- [Lowe et al. — Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments](https://arxiv.org/abs/1706.02275) — MADDPG；NeurIPS 2017
- [Rashid et al. — QMIX: Monotonic Value Function Factorisation for Deep Multi-Agent Reinforcement Learning](https://arxiv.org/abs/1803.11485) — QMIX；ICML 2018
- [Yu et al. — The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games](https://arxiv.org/abs/2103.01955) — MAPPO；NeurIPS 2022
- [BAIR blog post on MAPPO](https://bair.berkeley.edu/blog/2021/07/14/mappo/) — 对 MAPPO 结果的易读 framing
- [SMAC repository](https://github.com/oxwhirl/smac) — StarCraft Multi-Agent Challenge
