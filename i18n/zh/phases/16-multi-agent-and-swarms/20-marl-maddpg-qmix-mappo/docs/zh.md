# 马德普格,QMIX,MAPPO

> 协调多代理 加强学习传承,在2026年仍将影响LLM代理系统**MADDPG**(Lowe et al., NeurIPS 2017, arXiv:1706.02275) 引入了集中式培训,分散式执行 (CTDE):在培训期间,每个评论家都能看到所有代理的状态和动作;测试时只运行本地演员──适用于合作、竞争和混合场景──**QMIX**(Rashid等,ICML 2018, arXiv:1803.11485) 是带有单调混合网络的值分解;每个代理的Q 会组合成联合Q,因此`argmax`能净地分配给各个代理人 在星际飞行多代理挑战 (SMAC) 中占主导地位.**MAPPO**(Yu et al., NeurIPS 2022, arXiv:2103.01955) 是带有中心化的价值函数的PPO;在粒子世界、SMAC、Google Research Football、Hanabi 上,只需极少调参就令人惊的有效──这些方法支了必须分散的行动的代理团队政策──训练──MAPPO 是**2026 年 cooperative-MARL 的默认 baseline**△本课将从一个小的网格世界玩具 构建每一种方法, 在接触LLM代理培训之前,先把这些三个想法练习成肌肉记忆.

**类型：**学习 课程
**语言：**字符串 (stdlib,小型无 NumPy 实现)
**先修：**九期 (加强学习),十六期 ·九期 (并行集群网络)
**时间：**时间90分钟

## 问题

如何推迟何时行动调用哪个同行.告诉你如何训练这种政策的文献是多代理增强学习 (MARL),它早于LLM潮,并且已经有一个小组主流算法.

如果没有模式词汇,阅读 MARL 论文会很痛苦――集中式训练与分散执行 (CTDE) 价值分解和集中式批评 不是流行词 它们是对具体问题的具体答案:

- 独立的RL (每一个代理人单独学习) 从每个代理人的角度看是非静止的.
- 集中式RL (RL) 无法扩展,并且违反执行限制.
- 技术发展:全球信息培训,地方政策部署

## 概念

### 论文使用的三类环境

- **Particle World (multi-agent particle env)。**简单的二维物理,包含合作/竞争任务――MADDPG的原始试验床――
- **StarCraft Multi-Agent Challenge (SMAC)。**合作微管理,部分观察──QMIX的试验床──分别行动,持续状态──
- **Google Research Football, Hanabi, MPE。**根据MAPPO的基线――

不同环境有不同的行动/观察类型――算法 会据此选择――

###       

每个代理人`i`城市有一个演员`mu_i(o_i)`让自己的观察被映射到行动中.`Q_i(x, a_1, ..., a_n)`根据评论员的评价,通过政策梯度,

```
actor update:    grad_theta_i J = E[grad_theta mu_i(o_i) * grad_a_i Q_i(x, a_1..n) at a_i=mu_i(o_i)]
critic update:   TD on Q_i(x, a_1..n) given next-state joint estimate
```

训练时,我们知道所有人的行动;我们使用这些信息降低每个批评者的差异.`o_i`并调用`mu_i(o_i)`,我知道.

失败模式:批评者会随着N个代理 增长 输入包含所有行动) ⋅如果没有近似,很难扩展到~10个以上的代理──

### 值分解 QMIX (2018)

仅适用于合作社. 全球奖励是每个代理的Q值的单调函数.

```
Q_tot(tau, a) = f(Q_1(tau_1, a_1), ..., Q_n(tau_n, a_n)),   df/dQ_i >= 0
```

单调性保证`argmax_a Q_tot`可以通过每个代理人 独立选择`argmax_{a_i} Q_i`计算. 这就是你需要的.**decentralized execution property**◎ 训练时,从每个代理的Q 生成`Q_tot`,我知道.

为什么QMIX在SMAC上获胜:合作型星际飞行器微型管理 具有同质的代理商,本地控制,全球奖励 与价值分解 完美契合――

失败模式:单调性限制 限制较强;有些任务的奖励结构不是单调的分解性 (例如一个代理为团队牺牲) ;;扩展方法 ((QTRAN、QPLEX) 将放松这一点).

### 被低估的默认选择

多代理PPO:带集中价值函数的PPO──每个代理都有自己的政策;所有代理 共享(或拥有每代理)能看到全状态的价值函数──Yu et al. 2022 在五个基准上将MAPPO与MADDPG、QMIX 及其扩展进行比较,并发现:

- 它们是""的,它们是""的,它们是""的.
- 极少的超参数调整所需
- 训练稳定;跨种子可复现――

在这篇论文之前,社区低估了政策上的MARL. 到2026年,MAPPO是合作伙伴 MARL的默认基线;任何新方法都必须击败它.

### 为什么LLM代理工程师应该关心

三个直接用途:

1. **Router training。**选择哪个子代理处理任务――这是一个包含N 个分散的子代理和一个集中式路由器的 MARL 问题――MAPPO 适合――
2. **Role emergence。**在生成代理模拟中,训练代理随着时间的推移, 互补作用, 本质上是伪装成另一种形式的 MARL 问题――QMIX式的价值分解 通过结构强制补充性――
3. **Multi-agent tool use。**通过CTDE培训,他们可以获得可部署的本地政策,并遵守资源限制.

实践提醒:到2026年,大多数生产的LLM代理系统是快速的政策,而不是训练它们──MARL 适用于你有以下条件时:

### CTDE 作为RL之外的设计模式

即使不训练,CTDE也是一种有用的建筑模式:

- 在设计阶段,假设拥有完整的团队可见性.
- 在"运行时间"阶段,强制分散执行:每个代理只看到`o_i`,我知道.

许多生产多代理系统默默假设在任何地方都有共享状态 CTDE纪律可以防止这一点

### 无定位性问题

当多个代理同时学习时,每个代理的环境 (包含其他代理的政策) 都是非静止的.

- 由于全球批评者看到所有行动,因此它的价值估计是静止的.
- 值分解将学习移到联合Q空间,在那里优化有明确的意义.
- 果:集中价值函数会抑制来自其他代理政策变化的变化.

在LLM代理系统中,非站立性表现为我的代理 上个月还正常,现在上游另一个代理 改了,我的就异常了──带着CTDE的 MARL培训是原则性的修复方式;快速级别的修复更快,但耐久性较差──

### 本课不包括什么

训练真实网络是第09阶段的主题. 本课构建脚本政策版本,在没有梯度更新的情况下演示CTDE、值分解和集中值模式.


```figure
sw-ctde
```

## 构建它

`code/main.py`在一个很小的2个代理合作网上实现了三个模式示范:

- 环境:2个代理在4x4格里上,一个奖励片.奖励=如果任一代理到达片,则为 1;任务结束.
- `IndependentAgents` 每个代理 把其他代理当作环境――基本线――
- `MADDPGStyle`集中批评 计算共同价值;演员政策 从中更新;; 书面政策改进──
- `QMIXStyle` 使用单调混合器的值分解──
- `MAPPOStyle`集中价值功能;政策 根据共享基线更新。

四者运行同一个事件,并报告平均步骤到目标――CTDE变体 会收到比独立的基线更短的路径――

运行:

```
python3 code/main.py
```

预期输出:独立代理 平均需要 ~6 步;CTDE变体 会收到 ~3.5 步(4x4格式的最佳是 3)──即使使用脚本的政策,模式差异也会显现──

## 使用它

`outputs/skill-marl-picker.md`是一种技能,用于确定多代理任务 选择MARL算法:合作与竞争,均与异质,行动空间类型,规模,奖励信号.

## 交付它

在生产中, MARL 很少见.

- **从 MAPPO 开始。**文章将作为基线;先复现它可以省下几周追逐更花哨方法的时间.
- **记录每个 agent 的 observation 和 action stream。**没有每位代理的痕迹, 几乎没有希望.
- **分离 training code 和 execution code。**除了除,`o_i`,我知道.
- **Reward shaping 警告。**对于奖励设计,MARL非常敏感. 形成中一个协调错误,
- **对于 LLM agents**只有当互动数据+奖励信号+基础设施都具备时才投入MARL培训――

## 练习

1. 运行`code/main.py`△测量独立与MAPPO类代理之间的步骤到目标差距.
2. 实现竞争变异:两个代理,一个片,只有第一个到达的代理获得奖励.
3. 阅读MADDPG (arXiv:1706.02275) 第3节──用你的话,以伪码形式象征性实现确切的批评更新规则──
4. 阅读MAPPO (arXiv:2103.01955) ――为什么作者认为集中价值+PPO在他们的基准上胜过非政策 MARL?列出三个强大主张──
5. 作为设计模式,将CTDE应用于假想的LLM代理系统 (例如研究代理+总结器+编码器) .

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

- [Lowe et al. — Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments](https://arxiv.org/abs/1706.02275) MADDPG;NeurIPS 2017 年
- [Rashid et al. — QMIX: Monotonic Value Function Factorisation for Deep Multi-Agent Reinforcement Learning](https://arxiv.org/abs/1803.11485) QMIX;ICML 2018 年
- [Yu et al. — The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games](https://arxiv.org/abs/2103.01955) 美国经济发展局 (MAPPO;NeurIPS 2022)
- [BAIR blog post on MAPPO](https://bair.berkeley.edu/blog/2021/07/14/mappo/)对MAPPO结果的易读框架
- [SMAC repository](https://github.com/oxwhirl/smac)星际飞行多代理挑战
