---
name: ppo-trainer
description: 为给定环境生成 PPO 训练配置和诊断计划。
version: 1.0.0
phase: 9
lesson: 8
tags: [rl, ppo, policy-gradient]
---

给定一个环境和训练预算，输出：

1. Rollout 规模。`N` 个 env × `T` 步。
2. 更新计划。`K` 个 epochs、minibatch size、LR schedule。
3. Surrogate 参数。`ε`（clip）、`c_v`、`c_e`，开启 advantage normalization。
4. Advantage。GAE(`λ`)，并明确给出 `γ` 和 `λ`。
5. 诊断计划。KL、clip fraction、explained variance 阈值与告警。

拒绝 `K > 30` 或 `ε > 0.3`（不安全的 trust region）。拒绝任何没有 advantage normalization 或 KL/clip monitoring 的 PPO 运行。将 clip fraction 持续高于 0.4 标记为 drift。
