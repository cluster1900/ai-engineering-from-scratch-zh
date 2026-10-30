---
id: swarm-optimization
title: Swarm Optimization and MARL for Agents
code: SM
subtitle: 用 PSO 和 ACO 做 prompt 与路由，队列 swarm，以及 MADDPG、QMIX、MAPPO 与自博弈并列对比。
hue: 160
sources: phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo, phases/16-multi-agent-and-swarms/09-parallel-swarm-networks, phases/09-reinforcement-learning/10-multi-agent-rl
source_hash: 9890d657357bead1
---

## PSO 对照 ACO
type: comparison
from: phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/docs/en.md, phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/code/main.py

| 因素 | PSO | ACO |
|---|---|---|
| 问题 | 连续搜索空间 | 路由或路径选择 |
| 记忆 | `p_best` 与 `g_best` | 每种 task-type × agent 的信息素 |
| Agent 用途 | LMPSO、Model Swarms | AMRO-S 路由 |
| 报告收益 | 相对 12 个基线 13.3% | 4.7x 加速 |
| 种群 | 10-30 个粒子 | 演示中 3 个 agent、4 种任务类型 |
| 更新规则 | 惯性 + 认知 + 社会 | 衰减，然后门控沉积 |
| 演示函数 | `run_lmpso()` | `run_amro_s()` |

## MARL 算法
type: comparison
from: phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/docs/en.md, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/code/main.py

| 因素 | MADDPG | QMIX | MAPPO |
|---|---|---|---|
| 年份、会议 | NeurIPS 2017 | ICML 2018 | NeurIPS 2022 |
| 场景 | 合作、竞争、混合 | 仅合作 | 合作 |
| 训练信号 | 每个 agent 的 critic 能看到全部动作 | 对各 agent 的 Q 做单调混合 | 中心化价值函数 |
| 策略类型 | 离策略 | 离策略 | 在策略 PPO |
| 测试平台 | Particle World | SMAC | Football、Hanabi、MPE |
| 限制 | 超过约 ~10 个 agent 时 critic 会增长 | 奖励必须单调 | 要超越的默认基线 |
| 演示 | `run_maddpg_style` | `run_qmix_style` | `run_mappo_style` |

## MARL 范式
type: comparison
from: phases/09-reinforcement-learning/10-multi-agent-rl/docs/en.md

| 因素 | IQL / IPPO | CTDE | Self-play | League play |
|---|---|---|---|---|
| 思路 | 其他 agent 就是环境 | 中心 critic，局部策略 | 过去自己的副本 | 过去策略的种群 |
| 适用 | 松耦合任务 | 合作导航 | 零和博弈 | 策略循环 |
| 例子 | Independent Q | MADDPG、COMA、MAPPO、QMIX | AlphaZero | AlphaStar |
| 说明 | 理论收敛：无 | 最常见的现代范式 | 可能卡在支配循环 | 加入 exploiters 和 main exploiters |

## 队列 swarm 对照固定分配
type: comparison
from: phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/docs/en.md, phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/code/main.py

| 因素 | Sequential | Fixed assignment | Swarm |
|---|---|---|---|
| 谁挑选工作 | 一个 worker | 预先分配的 worker id | Worker 从共享队列拉取 |
| 函数 | `run_sequential` | `run_fixed_assignment` | `run_swarm` |
| 负载均衡 | 无 | 快 worker 闲坐 | 自动 |
| 适用 | 仅作基线 | 时长事先已知 | 许多独立任务 |
| 弱点 | 墙钟时间 | Worker 0 拿到所有慢任务 | 排序与调试 |

## 何时用各方法
type: concepts
from: phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/docs/en.md, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/docs/en.md, phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/docs/en.md, phases/09-reinforcement-learning/10-multi-agent-rl/docs/en.md

- **PSO**：连续参数、便宜的自动适应度、种群 10-30。
- **ACO**：随时间重复、需要可解释证据的路由。
- **二者都不要**：适应度需要人工审阅，或延迟必须严格。
- **遗传算法**：PSO 覆盖不了的离散组合空间。
- **Swarm**：许多时长可变的独立任务。
- **Supervisor**：任务需要一份连贯的全局计划。
- **MAPPO**：合作 MARL 从这里开始。
- **Self-play**：零和博弈。策略循环时用 league play。

## 运行这些模式
type: task-table
from: phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/code/main.py, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/code/main.py, phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/code/main.py, phases/09-reinforcement-learning/10-multi-agent-rl/code/main.py, phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/docs/en.md

| 任务 | 代码 |
|---|---|
| 跑任意一课演示 | `python3 code/main.py` |
| 在 2 个 prompt 参数上做 PSO | `history = run_lmpso()` |
| ACO 路由对照随机 | `run_amro_s(n_tasks=200, seed=0)` |
| 打印轨迹 | `print_pheromone_table(router)` |
| 每种 MARL 风格到达目标的步数 | `bench(label, runner)` 跑 500 次试验 |
| 从共享队列拉取 | `run_swarm(tasks, n_workers)` |
| 网格上的独立 Q | `independent_q(episodes=1500)` |
| 16 个动作上的联合 Q | `joint_q_learning(episodes=1500)` |

## PSO 更新
type: annotated-code
lang: python
from: phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/code/main.py

```python
w, c1, c2 = 0.6, 1.2, 1.2                  # inertia, cognitive, social
r1, r2 = rng.random(), rng.random()
cognitive = c1 * r1 * (p.p_best[d] - p.x[d])
social = c2 * r2 * (g_best_x[d] - p.x[d])
p.v[d] = w * p.v[d] + cognitive + social
p.x[d] += p.v[d]
p.x[d] = max(bounds[d][0], min(bounds[d][1], p.x[d]))  # clamp to bounds
f = fitness(p.x)                           # only an evaluator, no gradient
if f > p.p_best_fit:                       # then check g_best_fit
```

## ACO 路由器
type: annotated-code
lang: python
from: phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/code/main.py

```python
router = PheromoneRouter(task_types, agents)   # every trail starts at 1.0
aco_agent = router.choose(tt, rng)             # sample by pheromone weight
aq = simulate_task(aco_agent, tt, rng)
router.deposit(tt, aco_agent, aq)
self.pheromones[task_type][a] *= (1.0 - self.decay)    # all agents decay
if quality >= self.quality_threshold:                   # quality gate
    self.pheromones[task_type][agent] += self.reinforce * quality
```

## CTDE 模式
type: architecture
from: phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/docs/en.md, phases/09-reinforcement-learning/10-multi-agent-rl/docs/en.md

```arch
node | state | 1,1 | Global state | all obs + joint action | store
node | critic | 2,1 | Centralized critic | training time only | model
node | o1 | 1,2 | Agent 1 obs | o_i |
node | a1 | 2,2 | Actor 1 | mu_i(o_i) | process
node | o2 | 3,2 | Agent 2 obs | o_i |
node | a2 | 4,2 | Actor 2 | mu_i(o_i) | process
edge | state | critic | train
edge | critic | a1 | gradient
edge | o1 | a1 | deploy
edge | o2 | a2 | deploy
edge | critic | a2 | gradient
```

## 课文代码中的默认值
type: defaults
from: phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/code/main.py, phases/09-reinforcement-learning/10-multi-agent-rl/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `n_particles` | 20 | `run_lmpso` 的种群 |
| `iterations` | 30 | PSO 迭代次数 |
| `decay` | 0.05 | 每次沉积的信息素衰减 |
| `reinforce` | 0.2 | 沉积量是 reinforce 乘以质量 |
| `quality_threshold` | 0.6 | 低于它不沉积 |
| `n_tasks` | 200 | `run_amro_s` 中路由的任务 |
| `epsilon` | 0.15 | `independent_q` 中的探索 |
| `gamma` | 0.95 | 折扣，配合 `alpha` 0.1 |

## 失败模式
type: troubleshooting
from: phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/docs/en.md, phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/docs/en.md, phases/09-reinforcement-learning/10-multi-agent-rl/docs/en.md, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 路由器锁定在一个坏 agent 上 | 快但错误的 agent 拿到了信息素 | 对沉积做质量门控 |
| 最佳适应度发散 | 数据偏移后的灾难性漂移 | 重置或把衰减率加倍 |
| Swarm 忘掉好解 | 衰减太快 | 更慢的衰减，监控最佳适应度 |
| 长任务永远不跑 | 队列饥饿 | 带老化的优先队列 |
| 任务输出出现两次 | Worker 中途崩溃 | 幂等 worker、持久队列 |
| Agent 互相追逐 | 策略漂移、非平稳性 | 中心化 critic，慢学习率 |
| 旧回放伤害学习 | 来自过时对手的转移 | 按新近度重标或加权 |
| 拍卖 agent 出价为零 | 通过协调做奖励黑客 | 仔细的奖励设计、约束 |

## 问题
type: qa
from: phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/docs/en.md, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/docs/en.md, phases/09-reinforcement-learning/10-multi-agent-rl/docs/en.md

- **为什么 prompt 用无梯度方法？** Prompt 是离散字符串。PSO 和 ACO 只需要一个评估器。
- **20 粒子、50 次迭代的 PSO 要花多少？** 按每次调用约 ~$0.02 计，大约 $20。
- **为什么 QMIX 能去中心化？** 单调混合让每个 agent 取自己的 argmax。
- **为什么不为 LLM agent 训练 MARL？** 大多数系统用 prompt 策略。只在有数据、奖励和基础设施时才训练。
- **为什么联合 Q 演示难以扩展？** 两个 agent 时动作空间是 `|A|² = 16`。

## 上线检查清单
type: tips
from: phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/docs/en.md, phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/docs/en.md, phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/docs/en.md

- 从 10-20 个粒子和 20-50 次迭代开始。
- 每轮记录信息素或 g_best。
- 发出每次迭代成本指标。
- 给每个 swarm 任务一个 trace ID。队列变长时施加反压。
- 让执行路径只看见 `o_i`。
- 记录每个 agent 的观测与动作流。
