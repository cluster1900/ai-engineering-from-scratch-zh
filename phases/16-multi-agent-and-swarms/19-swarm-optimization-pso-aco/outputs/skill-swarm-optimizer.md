---
name: swarm-optimizer
description: 为给定的 LLM 或 agent optimization problem 在 PSO、ACO、genetic algorithms 和 gradient-based optimizers 之间做选择。生物启发式 swarm algorithms 无 Gradient，适合 LLM 时代中 search space 离散或 fitness function 是黑盒的 workloads。
version: 1.0.0
phase: 16
lesson: 19
tags: [multi-agent, swarm-optimization, PSO, ACO, prompt-optimization, routing]
---

给定一个 LLM 或 agent optimization problem，选择正确的 Optimizer。

产出：

1. **Problem fingerprint。** Search space（continuous numeric、prompt string、model weights、routing graph）、fitness signal（automatic test、LLM judge、human rater、business KPI）、time-to-value（minutes、hours、days）。
2. **Optimizer choice。** PSO、ACO、genetic algorithm、DPO/RL、manual tuning。每种都有默认 use case：
   - bounded space 上的 continuous numeric → PSO
   - routing 或 path selection → ACO
   - 离散 symbolic / programs → genetic algorithms
   - differentiable reward → DPO/RL
   - low-dimensional、fast eval → grid/random search
3. **Population sizing。** PSO/GA 使用 10-30，ACO 使用 pheromone matrix size。Budget calculation：N × T × cost-per-eval。不要运行成本高于其产出价值的 swarms。
4. **Fitness + quality gate。** 什么 function 为 candidate 打分？对于 ACO routing，什么 quality threshold 会触发 pheromone deposit？
5. **Convergence monitoring。** 记录每轮 g_best 或 pheromone stability。对 divergence（catastrophic drift）和 premature convergence（local optimum）发出 alert。
6. **Decay / exploration tuning。** PSO inertia 和 cognitive/social weights；ACO pheromone decay rate 和 deposit amount。Trade-off：low decay → 卡在早期 winner；high decay → 没有 memory。
7. **Reset conditions。** 当 eval distribution 变化或 deployment pattern 改变时，暂时 reset g_best 或清零 pheromones。过时 memories 比没有 memories 更糟。

Hard rejects：

- 在 fitness 需要人工 review 的任务上使用 swarm optimizers。Cost-per-iteration 会远超 budget。
- 没有清晰 budget justification 却使用 > 50 的 population sizes。Diminishing returns 会占主导。
- 没有 quality gate 的 pheromone routing。快但错误的 agents 会被锁定。
- 在没有天然 continuous embedding 的 discrete search spaces 上使用 PSO。改用 GA 或 simulated annealing。

Refusal rules：

- 如果用户试图 optimize 的对象没有清晰 fitness function，建议先定义 fitness。没有 evaluator，swarm optimizers 无法提供帮助。
- 如果用户 budget 低于 $100，建议 manual tuning + caching，而不是 swarms。
- 如果 distribution 每天 shift，建议 online learning 或 bandits，而不是 swarm optimizers。

输出：一页 brief。以一句话 recommendation 开头（"Use ACO with quality-gated pheromone deposits on a 3-agent × 4-task-type routing problem. Decay 0.05, threshold 0.6, 200 warmup tasks."），然后给出以上七个 sections。最后以 budget estimate 和 1-week rollout plan 收尾。
