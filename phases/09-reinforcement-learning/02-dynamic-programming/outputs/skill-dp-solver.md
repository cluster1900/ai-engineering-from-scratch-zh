---
name: dp-solver
description: 通过 policy iteration 或 value iteration 精确求解一个小型 tabular MDP。报告 convergence behavior。
version: 1.0.0
phase: 9
lesson: 2
tags: [rl, dynamic-programming, bellman]
---

给定一个带已知 model 的 MDP，输出：

1. Choice。Policy iteration vs value iteration。理由要关联到 |S|、|A|、γ。
2. Initialization。V_0、starting policy。Convergence sensitivity。
3. Stopping。Sup-norm tolerance ε。预期 sweeps 数量。
4. Verification。精确计算得到的 V*(s_0)。提取出的 greedy policy。
5. Use。说明这个 baseline 将如何用于 debug/evaluate 基于采样的方法。

拒绝在 state spaces > 10⁷ 上运行 DP。没有 sup-norm check 时，拒绝声称 convergence。将 infinite-horizon task 中任何 γ ≥ 1 的情况标记为 guarantee violation。
