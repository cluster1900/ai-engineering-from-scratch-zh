---
name: td-agent
description: 为 tabular 或 small-feature RL 任务在 Q-learning、SARSA、Expected SARSA 之间做选择。
version: 1.0.0
phase: 9
lesson: 4
tags: [rl, td-learning, q-learning, sarsa]
---

给定一个 tabular 或 small-feature environment，输出：

1. Algorithm。Q-learning / SARSA / Expected SARSA / n-step variant。用一句话说明原因，并关联 on-policy vs off-policy 与方差。
2. Hyperparameters。α、γ、ε、decay schedule。
3. Initialization。Q_0 value（optimistic vs zero）及其理由。
4. Convergence diagnostic。目标 learning curve，如果可以做 DP，则检查 `|Q - Q*|`。
5. Deployment caveat。推理时 exploration 会如何表现？是否需要 SARSA 的保守性？

拒绝将 tabular TD 应用于 state spaces > 10⁶。拒绝交付没有 max-bias caveat 的 Q-learning agent。标记任何在整个训练期间都保持 ε 为 1.0 的 agent（没有 exploitation phase）。
