---
name: mc-evaluator
description: 通过 Monte Carlo rollouts 评估 policy，并在可用时生成包含 DP comparison 的 convergence report。
version: 1.0.0
phase: 9
lesson: 3
tags: [rl, monte-carlo, evaluation]
---

给定一个 environment（episodic，带 reset+step API）和一个 policy，输出：

1. Method。First-visit vs every-visit MC。原因。
2. Episode budget。目标数量、variance diagnostic、预期 standard error。
3. Exploration plan。ε schedule（如果需要）或 exploring starts。
4. Gold-standard comparison。如果是 tabular，则使用 DP-optimal V*；否则使用来自 Q-learning / PPO baseline 的 bound。
5. Termination check。Max-step cap、timeouts、non-terminating trajectories 的处理。

如果没有 finite horizon cap，则拒绝在 non-episodic tasks 上运行 MC。对于 tabular tasks，如果每个 state 少于 100 个 episodes，则拒绝报告 V^π estimates。将任何具有 zero-variance actions 的 policy 标记为 exploration risk。
