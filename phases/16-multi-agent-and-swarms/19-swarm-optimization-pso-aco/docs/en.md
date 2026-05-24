# 面向 LLMs 的 Swarm Optimization（PSO, ACO）

> 生物启发式 optimization 正在 LLM 领域回归。**LMPSO**（arXiv:2504.09247）使用 PSO，其中每个 particle 的 velocity 是一个 prompt，LLM 生成下一个 candidate；它在结构化序列输出（数学表达式、程序）上效果很好。**Model Swarms**（arXiv:2410.11163）把每个 LLM expert 视为模型权重 manifold 上的一个 PSO particle，并报告在 9 个数据集上相较 12 个 baselines 有 **13.3% average gain**，且每轮只需 200 个 instances。**SwarmPrompt**（ICAART 2025）将 PSO + Grey Wolf 混合用于 prompt optimization。**AMRO-S**（arXiv:2603.12933）是受 ACO 启发的 pheromone specialists，用于 multi-agent LLM routing — **4.7x speedup**、可解释的 routing evidence，以及将 inference 与 learning 解耦的 quality-gated asynchronous update。本课会在 prompt 参数空间上实现 PSO，在 agent routing 上实现 ACO，衡量这些经典算法为什么适合 LLM 时代，以及什么时候不适合。

**类型：** Learn + Build
**语言：** Python (stdlib)
**先修：** Phase 16 · 09 (Parallel Swarm Networks), Phase 16 · 14 (Consensus and BFT)
**时间：** ~75 minutes

## 问题

你有一个 prompt，在任务 eval 上得分 62%。你想改进它。朴素做法是无 Gradient 的手动调参，但这种方式扩展性很差。Reinforcement Learning 需要 reward signals 和足够多的 rollouts 来训练。通过 prompts 做 Backpropagation 并不现实 — prompt 是离散字符串，不是可微参数。

经典生物启发式 optimization — 用于连续搜索空间的 PSO、用于路径选择的 ACO — 正是为这种场景设计的：无 Gradient、基于种群、每次 evaluation 成本低。把它们与 LLMs 配合用于无 Gradient 搜索步骤，就能得到一个出人意料地实用的 Optimizer。

同样的模式也适用于 multi-agent systems 中的 agent *routing*。ACO 风格的 pheromone trail 会记录哪个 agent 在哪类任务上表现最好，让 router 利用这条 trail，并让 pheromones 衰减，以便 route 可以被重新发现。

## 概念

### PSO refresher（Kennedy & Eberhart 1995）

Particle Swarm Optimization：连续搜索空间中的 particle 种群。每个 particle 有 position `x_i` 和 velocity `v_i`。每次 iteration：

```
v_i <- w * v_i + c1 * r1 * (p_best_i - x_i) + c2 * r2 * (g_best - x_i)
x_i <- x_i + v_i
evaluate fitness(x_i)
update p_best_i if improved
update g_best if global best
```

其中 `p_best` 是 particle 自己的最佳结果，`g_best` 是 swarm 的最佳结果，`w, c1, c2` 是 inertia + cognitive + social weights，`r1, r2` 是随机因子。

### LLM 输出上的 PSO — LMPSO

arXiv:2504.09247 将 PSO 适配到 LLM 生成的结构化输出（数学表达式、程序）。每个 particle 是一个 candidate output。Velocity 是一个 *prompt*，描述如何把当前 output 向 personal/global best 修改。LLM 根据 velocity prompt 生成新的 output。Velocity 的 “inertia” 是类似 “make small incremental changes” 的 prompt。

这在以下情况下效果很好：
- 输出是结构化的（可解析、可评估）。
- Fitness 是自动的（测试运行、算术评估）。
- Population 较小（~10-30 particles），因此总 LLM calls 保持可控。

当 fitness 需要人工 review 时，它效果不好 — 每次 iteration 的成本会变得过高。

### Model Swarms

arXiv:2410.11163 将 PSO 从 output layer 带到 *model* layer。每个 “particle” 是一个 expert LLM（parameters）。Swarm 通过无 Gradient update 将 parameters 向 collective best 移动。报告结果：在 9 个数据集、12 个 baselines 上平均提升 13.3%，且每轮只需 200 个 instances。

关键洞察是 LLM expert models 已经在共享参数 manifold 中彼此接近（adapter weights、LoRA deltas）。在这个低维子空间上做 PSO 成本低且有效。

### ACO refresher（Dorigo 1992）

Ant Colony Optimization：ants 遍历 graph；每条 path 都有 pheromone trail。Ant 的移动概率按 pheromone strength 加权。完成任务的 ants 会按 solution quality 成比例地 deposit pheromone。Pheromone 会随时间衰减。

### AMRO-S — 用于 agent routing 的 ACO

arXiv:2603.12933 使用 ACO 做 multi-agent routing。每种 task-type 是一个 “destination”；每个 agent 是一条可能 route。产出好结果的 routes 会强化 pheromones。关键贡献：

- **可解释的 routing evidence。** Pheromone strength 是人类可读的 signal。
- **Quality-gated asynchronous update。** Pheromones 只有在 quality checks 通过后才 update，将 inference 与 learning 解耦。
- 在 multi-agent routing benchmark 上实现 **4.7x speedup**。

Quality gate 很重要：没有它，快但错误的 agents 会累积 pheromone，系统会锁定在坏 routes 上。

### 什么时候为 LLMs 使用 PSO / ACO

**使用 PSO 当：**
- Search space 是连续的，或可映射到连续参数（prompt Embeddings、LoRA weights、数值生成参数）。
- Fitness 便宜且自动。
- Population 可以很小（10-30）。

**使用 ACO 当：**
- 你有 routing 或 path-selection 问题。
- Decisions 会随时间强化（相同 task types 会反复出现）。
- 你需要 routing decisions 的可解释 evidence。

**不要使用二者当：**
- Fitness 需要人工 review（每次 iteration 成本过高）。
- Search space 是离散且组合式的，而 PSO 无法覆盖（改用 genetic algorithms）。
- Real-time decisions 需要严格 latency（PSO/ACO 相比 single-pass heuristics 收敛较慢）。

### 为什么 bio-inspired 仍然胜出

基于 Gradient 的方法需要可微 signals。LLM outputs 和 routing decisions 并不天然可微。Pseudo-gradient 方法（reinforcement-learned routers、DPO-style prompt tuners）可行，但需要昂贵训练。

PSO 和 ACO 只需要一个 *evaluator* function。如果你能为 candidate output 或 routing decision 打分，就能在这个空间上 optimize。这让适用门槛低得多。

### 实用限制

- **Population budget。** N particles × T iterations × per-eval cost。对于每次 LLM eval 约 ~$0.02 / call 的情况，一个 20-particle PSO 跑 50 iterations 大约花费 ~$20。按此规划。
- **Exploration vs exploitation。** Pheromone decay rate 与 PSO inertia 之间有 trade off；decay 太快 → 忘记 solutions；太慢 → 卡在早期 local optima。
- **Catastrophic drift。** 如果 fitness landscape 发生变化（新的 data distribution），两种算法都可能先 converge 然后 diverge。监控 best-fitness stability。

## 构建

`code/main.py` 实现：

- `LMPSO` — 在数值 prompt parameters（temperature、top_k weights）上运行 PSO。每个 particle 的 “LLM generation” 被模拟为一个脚本化 fitness function。运行算法 30 iterations，并展示 g_best convergence。
- `AMRO_S` — ACO 风格 routing。3 个 agents、4 种 task types、pheromone matrix、100 个 routed tasks。打印一段时间内（task_type → agent choices）的分布，展示 trail formation。
- 对比：在相同 task stream 上比较 random routing 与 ACO routing。衡量 quality 和 latency。

运行：

```
python3 code/main.py
```

预期输出：
- LMPSO：g_best fitness 在 30 iterations 内从随机值提升到接近最优。
- AMRO-S：pheromone table 稳定到每种 task-type 对应的正确 agent；ACO routing 在 quality 上比 random 高约 ~30-40%，同时减少 latency（更少 retries）。

## 使用

`outputs/skill-swarm-optimizer.md` 帮助在 PSO、ACO、genetic algorithms 和 gradient-based optimizers 之间选择，用于 LLM / agent optimization problems。

## 交付

- **从小开始。** 10-20 particles，20-50 iterations。只有当 convergence curve 显示明确收益时才扩展。
- **记录每轮 pheromones 或 g_best。** 没有 trail 的 swarm optimizers 很难 debug。
- **Quality-gate updates。** 尤其是 ACO routing：快但错误的 agents 绝不能累积 pheromone。
- **在 distribution shift 时 reset decay。** 当 eval distribution 改变时，老化的 pheromones 已经过时；reset 或暂时把 decay rate 加倍。
- **限制每轮成本。** 输出 cost-per-iteration metric。一个每轮花费 $500、只带来 0.5% 提升的 PSO 不能 ship。

## 练习

1. 运行 `code/main.py`。观察 LMPSO convergence。改变 population size 为 5、10、20、50。在哪个 size 上 time-to-converge 开始饱和？
2. 实现一个 “catastrophic drift” 实验：在 iteration 30 后改变 fitness function。PSO 适应得多快？Reset `p_best` 有帮助吗？
3. 给 AMRO-S 添加 quality gate：只有 eval score > 0.7 的 runs 才 deposit pheromone。与未加 gate 的版本相比，这如何改变 convergence？
4. 阅读 LMPSO（arXiv:2504.09247）。把论文中的 “velocity as a prompt” 映射回你的数值 velocity。模拟中丢失了什么，又保留了什么？
5. 阅读 AMRO-S（arXiv:2603.12933）。实现带 asynchronous pheromone update 的解耦 “inference fast-path”。这会如何改变 sustained load 下的 system latency？

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| PSO | "Particle Swarm Optimization" | Kennedy-Eberhart 1995。基于种群的无 Gradient Optimizer。 |
| ACO | "Ant Colony Optimization" | Dorigo 1992。通过 pheromone trails 进行 path/route optimization。 |
| LMPSO | "PSO with LLM generation" | arXiv:2504.09247。Velocity 是 prompt；LLM 生成 candidates。 |
| Model Swarms | "PSO on expert weights" | arXiv:2410.11163。在 model parameter subspace 上进行无 Gradient update。 |
| AMRO-S | "ACO for agent routing" | arXiv:2603.12933。覆盖 task-type × agent 的 pheromone matrix。 |
| p_best / g_best | "Personal / global best" | 每个 particle 和整个 swarm 目前找到的最佳 solutions。 |
| Pheromone | "Routing memory" | Edge 上的强度；随时间衰减；根据 quality deposit。 |
| Quality-gated update | "Only learn from good runs" | 以 quality check 为条件进行 pheromone deposit。 |
| Catastrophic drift | "Distribution shift" | Fitness landscape 改变；旧的 p_best 和 pheromones 变得过时。 |

## 延伸阅读

- [Kennedy & Eberhart — Particle Swarm Optimization](https://ieeexplore.ieee.org/document/488968) — 1995 年 PSO 论文
- [Dorigo — Ant Colony Optimization](https://www.aco-metaheuristic.org/about.html) — 1992 年 ACO 基础
- [LMPSO — Language Model Particle Swarm Optimization](https://arxiv.org/abs/2504.09247) — 面向结构化 LLM outputs 的 PSO
- [Model Swarms — gradient-free LLM expert optimization](https://arxiv.org/abs/2410.11163) — 在 model-weight subspace 上的 PSO
- [AMRO-S — ant-colony multi-agent routing](https://arxiv.org/abs/2603.12933) — 带 quality gate 的 pheromone-driven routing
