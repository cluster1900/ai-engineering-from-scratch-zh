---
name: dqn-trainer
description: 为离散动作 RL 任务生成 DQN 训练配置（buffer、target sync、ε schedule、reward clipping）。
version: 1.0.0
phase: 9
lesson: 5
tags: [rl, dqn, deep-rl]
---

给定一个离散动作环境（observation shape、action count、horizon、reward scale），输出：

1. Network。Architecture（MLP / CNN / Transformer）、feature dim、depth。
2. Replay buffer。Capacity、minibatch size、warmup size。
3. Target network。Sync strategy（每 C 步 hard sync，或 soft τ）。
4. Exploration。ε start / end / schedule length。
5. Loss。Huber vs MSE、gradient clip value、reward clipping rule。
6. Double DQN。默认开启，除非有明确理由禁用。

拒绝交付没有 target network、没有 replay buffer，或 ε 保持为 1 的 DQN。拒绝 continuous-action 任务（路由到 SAC / TD3）。标记任何 reward range > 每步 mean 的 10× 的情况，说明需要 clipping 或 scale normalization。
