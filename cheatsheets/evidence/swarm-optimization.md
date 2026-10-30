# Evidence: cheatsheets/swarm-optimization.md

Abbreviations: P = phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco, M = phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo, S = phases/16-multi-agent-and-swarms/09-parallel-swarm-networks, R = phases/09-reinforcement-learning/10-multi-agent-rl. d = docs/en.md, c = code/main.py.

## PSO 对照 ACO (comparison, 7 rows)
- Problem: continuous vs routing: P/d:68, 73
- Memory p_best / g_best vs pheromone task-type × agent: P/d:32, 145-146
- Agent use LMPSO, Model Swarms, AMRO-S: P/d:36, 47, 57
- 13.3% over 12 baselines, 4.7x speedup: P/d:47, 61
- Population 10-30, 3 agents 4 task types: P/d:41, 70, 104
- Inertia + cognitive + social, decay then gated deposit: P/d:32, P/c:97-101
- run_lmpso(), run_amro_s(): P/c:34, 116

## MARL 算法 (comparison, 7 rows)
- NeurIPS 2017, ICML 2018, NeurIPS 2022: M/d:3
- Cooperative, competitive, mixed; cooperative only; cooperative baseline: M/d:3, 45, 65
- Critic sees all actions, monotone mixer, centralized value: M/d:32, 51, 59
- Off-policy vs on-policy PPO: M/d:61, 158
- Particle World, SMAC, Football / Hanabi / MPE: M/d:24-26
- Past ~10 agents, monotone limit, default baseline: M/d:41, 55, 65
- run_maddpg_style, run_qmix_style, run_mappo_style: M/c:94, 107, 124

## MARL 范式 (comparison, 4 rows)
- IQL / IPPO others as environment: R/d:36
- CTDE central critic, local policy: R/d:38
- Self-play copy of past self: R/d:44
- League population of past policies: R/d:46
- Fits: loosely-coupled R/d:36, cooperative navigation R/d:128, zero-sum R/d:44, cycles R/d:46
- Examples: MADDPG, COMA, MAPPO, QMIX R/d:39-42, AlphaZero R/d:44, AlphaStar R/d:46
- Notes: convergence none R/d:36, most common R/d:38, dominance cycle R/d:118, exploiters R/d:46

## 队列 swarm 对照固定分配 (comparison, 5 rows)
- Who picks: S/c:30-35, 39-43, 60-64
- run_sequential, run_fixed_assignment, run_swarm: S/c:30, 39, 60
- Load balance, fast workers idle: S/d:81, S/c:120, 124
- Fits: sequential baseline S/d:77, durations anticipated S/d:37, independent tasks S/d:36
- Weak points: worker 0 slow tasks S/c:89-90, 120; ordering and debugging S/d:42-44

## 何时用各方法 (concepts, 8)
- PSO: P/d:67-70
- ACO: P/d:72-75
- Neither: P/d:77-80
- Genetic algorithm: P/d:79
- Swarm: S/d:36-37
- Supervisor for global plan: S/d:3, 43
- Start with MAPPO: M/d:133
- Self-play zero-sum, league for cycles: R/d:44, 46

## 运行这些模式 (task-table, 8)
- python3 code/main.py: P/d:110
- history = run_lmpso(): P/c:153
- run_amro_s(n_tasks=200, seed=0): P/c:116
- print_pheromone_table(router): P/c:142, 169
- bench(label, runner), 500 trials: M/c:131-133
- run_swarm(tasks, n_workers): S/c:60
- independent_q(episodes=1500): R/c:41, 131
- joint_q_learning(episodes=1500), 16 joint actions: R/c:67, 69, 132

## PSO 更新 (annotated-code, 9 lines)
- w, c1, c2 = 0.6, 1.2, 1.2: P/c:36
- r1, r2: P/c:54
- cognitive, social: P/c:56-57
- velocity and position update: P/c:58-59
- clamp to bounds: P/c:60
- f = fitness(p.x): P/c:61
- if f > p.p_best_fit, then g_best_fit: P/c:62-67

## ACO 路由器 (annotated-code, 7 lines)
- PheromoneRouter(task_types, agents), trails start at 1.0: P/c:84, 121
- router.choose sample by weight: P/c:86-95, 134
- simulate_task: P/c:135
- router.deposit: P/c:137
- decay all agents: P/c:98-99
- quality gate and reinforce: P/c:100-101

## CTDE 模式 (architecture, 6 nodes, 5 edges)
- Global state, all obs + joint action: R/d:38, M/d:32
- Centralized critic at training time: M/d:39, R/d:38
- Agent 1 obs o_i: M/d:32, 82
- Actor 1 mu_i(o_i): M/d:32, 35
- Agent 2 obs o_i: M/d:32, 82
- Actor 2 mu_i(o_i): M/d:32, 35

## 课文代码中的默认值 (defaults, 8)
- n_particles 20: P/c:34
- iterations 30: P/c:34
- decay 0.05: P/c:77
- reinforce 0.2: P/c:77
- quality_threshold 0.6: P/c:78
- n_tasks 200: P/c:116
- epsilon 0.15: R/c:41
- gamma 0.95, alpha 0.1: R/c:41

## 失败模式 (troubleshooting, 8)
- Fast-but-wrong agent, quality gate: P/d:63, 125
- Catastrophic drift, reset or double decay: P/d:92, 126
- Decay too fast forgets solutions: P/d:91-92
- Starvation, priority queue with aging: S/d:58-61, 97
- Crash mid-run, idempotent and durable: S/d:98-99
- Policy drift, centralized critic, slow learning rates: R/d:116
- Non-stationary replay, relabel or weight by recency: R/d:114
- Auction agents bid zero, reward design: R/d:116

## 问题 (qa, 5)
- Discrete prompt, evaluator only: P/d:12, 86
- 20 particles, 50 iterations, ~$20 at ~$0.02: P/d:90
- Monotone mixing, decentralized argmax: M/d:51
- Prompt policies, train only with data, reward, infrastructure: M/d:75
- |A|² = 16: R/d:79

## 上线检查清单 (tips, 6)
- 10-20 particles, 20-50 iterations: P/d:123
- Log pheromones or g_best: P/d:124
- Cost-per-iteration metric: P/d:127
- Trace ID and back-pressure: S/d:100-101
- Execution path sees only o_i: M/d:135
- Log every agent's streams: M/d:134
