---
name: actor-critic-trainer
description: 为给定环境生成 A2C / A3C / GAE 配置，并指定 advantage estimation 和 loss weights。
version: 1.0.0
phase: 9
lesson: 7
tags: [rl, actor-critic, gae]
---

给定一个环境和计算预算，输出：

1. 并行度。A2C（GPU batched）vs A3C（CPU async）以及 worker 数量。
2. Rollout 长度 T。每个 env 每次 update 的 step 数。
3. Advantage estimator。n-step 或 GAE(λ)；指定 λ。
4. Loss weights。`c_v`（value）、`c_e`（entropy）、gradient clip。
5. Learning rates。Actor 和 critic（如果使用分离设置）。

拒绝在 horizon > 1000 的环境上使用 single-worker A2C（过于 on-policy，过慢）。拒绝在没有 advantage normalization 的情况下交付。将任何 `c_e = 0` 且 observed entropy < 0.1 的运行标记为 entropy-collapsed。
