---
id: marl-sim-to-real
title: Multi-Agent RL and Sim-to-Real
code: MR
subtitle: CTDE、值分解、自博弈、域随机化和 VLA 动作格式。公式、数字与修复方法。
hue: 60
sources: phases/09-reinforcement-learning/10-multi-agent-rl, phases/09-reinforcement-learning/11-sim-to-real-transfer, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo, phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot
source_hash: 8c321f58504cb71c
---

## 核心概念与公式
type: concepts
from: phases/09-reinforcement-learning/10-multi-agent-rl/docs/en.md, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/docs/en.md, phases/09-reinforcement-learning/11-sim-to-real-transfer/docs/en.md, phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/docs/en.md

- **马尔可夫博弈**：$(S, A_1, \ldots, A_n, P, R_1, \ldots, R_n)$。每个 agent 有自己的奖励。
- **奖励类型**：相同奖励为合作，零和为对抗，混合为一般和。
- **非平稳性**：$P(s' \mid s, a_i)$ 依赖于 $\pi_{-i}$，而 $\pi_{-i}$ 会变化。
- **CTDE**：训练时 critic 为 $Q(s, a_1, \ldots, a_n)$。策略 $\pi_i$ 只读取 $o_i$。
- **QMIX**：$Q_{\text{tot}} = f(Q_1, \ldots, Q_n)$，且 $\partial f / \partial Q_i \ge 0$。
- **COMA**：优势等于我的 Q 减去对我自身动作求期望的 Q。
- **现实差距**：仿真与真实物理或感知之间的偏移。
- **控制预算**：30 Hz 的控制环给每个动作 33ms。

## MADDPG、QMIX、MAPPO
type: comparison
from: phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/docs/en.md, phases/09-reinforcement-learning/10-multi-agent-rl/docs/en.md

| 因素 | MADDPG | QMIX | MAPPO |
|---|---|---|---|
| 年份 | 2017 | 2018 | 2022 |
| 思路 | 每个 agent 的 critic 能看到全部观测和动作 | 对各 agent 的 Q 做单调混合 | 带中心化价值函数的 PPO |
| 场景 | 合作、竞争、混合 | 仅合作 | 合作 |
| 测试平台 | Particle World | SMAC | Particle-world、SMAC、Football、Hanabi、MPE |
| 学习方式 | 离策略，DDPG | 值分解 | 在策略，PPO |
| 关键特点 | critic 随 N 增长，约 ~10 个 agent | 单调约束很严格 | 稳定，几乎无需调参 |
| 地位 | 提出了 CTDE | 在 SMAC 上占主导 | 默认的合作基线 |

## CTDE：集中训练，分散执行
type: architecture
from: phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/docs/en.md, phases/09-reinforcement-learning/10-multi-agent-rl/docs/en.md

```arch
node | o1 | 1,1 | Agent 1 obs | local only | client
node | o2 | 1,2 | Agent 2 obs | local only | client
node | act1 | 2,1 | Actor 1 | maps own obs to action | model
node | act2 | 2,2 | Actor 2 | maps own obs to action | model
node | env | 3,1 | Environment | joint action, shared reward
node | critic | 3,2 | Centralized critic | all obs and actions, training only | process
edge | o1 | act1 |
edge | o2 | act2 |
edge | act1 | env | action
edge | act2 | env | action
edge | env | critic | reward
edge | critic | act1 | gradient
edge | critic | act2 | gradient
```

## 仿真到现实的流程（四足机器人）
type: flow
from: phases/09-reinforcement-learning/11-sim-to-real-transfer/docs/en.md

1. **仿真**：大规模并行仿真，随机化重力、摩擦、电机增益和负载。
2. **教师**：用特权信息、地形图和真实机身速度训练。
3. **学生**：只用本体感知从教师蒸馏。
4. **适配**：可选，用真实 IMU 上的自编码器做观测适配。
5. **部署**：在 10+ 个环境中零样本部署。
6. **兜底**：用带安全约束的 PPO 做几分钟真实微调。

## 独立 Q 与联合 Q 对比
type: annotated-code
lang: python
from: phases/09-reinforcement-learning/10-multi-agent-rl/code/main.py

```python
a1 = epsilon_greedy(Q1, s, rng, epsilon)       # each agent picks alone
a2 = epsilon_greedy(Q2, s, rng, epsilon)
s_next, r, done = step(s, (a1, a2))            # joint step, shared reward
target1 = r + gamma * max(Q1[s_next].values())
Q1[s][a1] += alpha * (target1 - Q1[s][a1])     # own Q table
reward = 10.0 if done else -1.0                # +10 when both arrive
joint_actions = [(a, b) for a in ACTIONS for b in ACTIONS]  # 16 pairs
ja = max(joint_actions, key=lambda a: Q[s][a]) # one greedy joint pick
```

## 代码中的域随机化
type: annotated-code
lang: python
from: phases/09-reinforcement-learning/11-sim-to-real-transfer/code/main.py

```python
slip_ep = rng.uniform(slip_low, slip_high)     # new sim each episode
s_next, r, done = step(s, a, slip_ep, rng)     # slip moves perpendicular
Q_fixed = train_fixed(0.0, rng=rng)            # policy A, no DR
Q_dr = train_dr(0.0, 0.3, rng=rng)             # policy B, DR
for slip in (0.0, 0.1, 0.2, 0.3, 0.5, 0.7):    # 0.5 and 0.7 are OOD
    r_fixed = evaluate(Q_fixed, slip)
    r_dr = evaluate(Q_dr, slip)
```

## 四个 VLA 并列对比
type: comparison
span: 2
from: phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/docs/en.md

| 因素 | RT-2 | OpenVLA | π0 | GR00T N1 |
|---|---|---|---|---|
| 动作格式 | 文本 token，256 个分箱 | 256 分箱 token | Flow-matching 动作专家 | System 1 动作头 |
| 主干 | PaLM-X VLM | 7B Llama，DINOv2 + SigLIP | VLM 加小型动作 transformer | 大型 VLM 加小型动作头 |
| 速度 | 3-5 Hz | A100 上 4-5 Hz | ~5 步去噪，约 50 Hz | System 1 为 50-100 Hz，System 2 约 ~1 Hz |
| 细节 | 10-DOF 每步 10 个 token | 用 LoRA 微调适配新机器人 | 50 步动作序列 | 关节指令，>30 DOF |
| 数据 | 网页加机器人，约 ~1:1 | Open X-Embodiment，网页对机器人约 ~0.5:1 | Open X-Embodiment，比例相近 | 来自 Omniverse 的仿真到现实数据 |

## 代码中的任务
type: task-table
from: phases/09-reinforcement-learning/10-multi-agent-rl/code/main.py, phases/09-reinforcement-learning/11-sim-to-real-transfer/code/main.py, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/code/main.py, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/docs/en.md, phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/code/main.py

| 任务 | 代码 |
|---|---|
| 两个 agent 的独立 Q | `independent_q(episodes=1500)` |
| 对 16 个联合动作的单个 Q | `joint_q_learning(episodes=1500)` |
| 用 DR 训练 | `train_dr(0.0, 0.3, rng=rng)` |
| 在某个打滑值下零样本评估 | `evaluate(Q_dr, slip)` |
| 对 CTDE 模式做基准 | `bench(label, run_mappo_style)` |
| 运行 MARL 模式演示 | `python3 code/main.py` |
| 动作映射到 256 个分箱 | `discretize(action, bins=256)` |
| FAST 式压缩 | `fast_compress(trajectory, keep_coeff=4)` |

## 课程代码中的默认值
type: defaults
from: phases/09-reinforcement-learning/10-multi-agent-rl/code/main.py, phases/09-reinforcement-learning/11-sim-to-real-transfer/code/main.py, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/code/main.py, phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `alpha` | 0.1 | MARL 与 DR 玩具实验 |
| `gamma` | 0.95 | MARL 与 DR 玩具实验 |
| `epsilon`, `eps` | 0.15 | ε-greedy 探索 |
| MARL `episodes` | 1500 | DR 玩具实验中为 3000 |
| DR 打滑范围 | Uniform[0.0, 0.3] | 策略 B |
| `max_steps` | 50 | CTDE 模式演示，500 次试验 |
| `bins` | 256 | 分箱宽度 2/255 |
| `keep_coeff` | 4 | 每个维度的低频 DCT 项数 |

## 故障排查
type: troubleshooting
from: phases/09-reinforcement-learning/10-multi-agent-rl/docs/en.md, phases/09-reinforcement-learning/11-sim-to-real-transfer/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| agent 互相追逐 | 每个最优响应都在变 | 中心化 critic、低学习率、冻结其中一个 |
| 经验回放反而更差 | 旧数据里是过时的对手 | 重新标注，或按新近程度加权 |
| 共享奖励无法分配功劳 | 功劳分配问题 | COMA 基线或按 agent 塑形奖励 |
| 自博弈陷入循环 | 克制循环 | 与多样对手进行联赛式训练 |
| DR 策略过于谨慎 | 随机化过多 | 匹配预期的真实分布 |
| DR 没有帮助 | 随机化了错误的参数 | 先剖析真实机器人 |
| 学生追不上教师 | 特权信息泄漏 | 保证教师能由观测实现 |
| 策略损坏硬件 | 没有安全包络 | 在外部限制速率、力矩和关节范围 |

## 缩写
type: glossary
from: phases/09-reinforcement-learning/10-multi-agent-rl/docs/en.md, phases/09-reinforcement-learning/11-sim-to-real-transfer/docs/en.md, phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/docs/en.md

- **CTDE**：Centralized training, decentralized execution，集中训练、分散执行。
- **IPPO**：Independent PPO。每个 agent 单独运行 PPO。
- **COMA**：反事实多智能体。分离出我的贡献。
- **DR**：domain randomization，域随机化。训练中随机化仿真参数。
- **SI**：system identification，系统辨识。测量真实机器人并拟合仿真。
- **ADR**：Automatic Domain Randomization。随策略变好而扩大 DR 范围。
- **VLA**：vision-language-action。输入图像和指令，输出动作。
- **FAST**：Frequency-domain Action Sequence Tokenizer。先 DCT，再量化。

## 经验法则
type: tips
from: phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/docs/en.md, phases/09-reinforcement-learning/10-multi-agent-rl/docs/en.md, phases/09-reinforcement-learning/11-sim-to-real-transfer/docs/en.md, phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/docs/en.md

- 合作型 MARL 从 MAPPO 开始。
- 只在松耦合任务上使用独立 Q。
- 零和博弈用自博弈。存在策略循环时用联赛式训练。
- 记录每个 agent 的观测与动作流。
- 部署前在留出的仿真变体上测试。
- DR 范围超过实测真实波动的 3× 时要标出来。
- 用 100-1000 个任务演示上的 LoRA 缩小 VLA 的领域差距。

## 问答
type: qa
from: phases/09-reinforcement-learning/10-multi-agent-rl/docs/en.md, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/docs/en.md, phases/09-reinforcement-learning/11-sim-to-real-transfer/docs/en.md, phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/docs/en.md

- **独立 Q 在哪里失效？** 在紧耦合任务中，一个 agent 必须等待另一个。
- **为什么 QMIX 允许局部 argmax？** 混合器对每个 agent 的 Q 单调。
- **窄范围训练会怎样？** 只在打滑 0.0 下训练，一旦真实打滑大于 0 就会大幅下降。
- **为什么要联合微调 VLA？** 只用机器人数据的模型在新指令上会失败。
- **为什么 GR00T 要分层？** 慢速规划不会阻塞快速控制。
