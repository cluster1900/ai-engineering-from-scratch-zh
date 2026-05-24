---
name: marl-picker
description: 为给定 multi-agent task 选择 MARL algorithm（MADDPG、QMIX、MAPPO、IQL 或扩展）。考虑 cooperative vs competitive、action-space type、heterogeneity、reward structure 和 scale。
version: 1.0.0
phase: 16
lesson: 20
tags: [multi-agent, MARL, MADDPG, QMIX, MAPPO, CTDE]
---

给定一个 multi-agent task description，选择 MARL algorithm。

产出：

1. **Task taxonomy。** Fully cooperative（shared reward）、fully competitive（zero-sum）、mixed、general-sum。agent 数量。Homogeneous vs heterogeneous。
2. **Observability。** Full（每个 agent 都看到 global state）、partial（每个 agent 只看到自己的 observation），或 communication-enabled。
3. **Action space。** Discrete（Atari-like、SMAC）或 continuous（particle world、MuJoCo）。这会影响 algorithm choice。
4. **Reward structure。** Dense（per-step shaped）vs sparse（terminal only）。Dense 使 MAPPO 更实用；sparse 需要 credit assignment 帮助（QMIX 的 value decomposition）。
5. **Algorithm recommendation。** 按 Yu et al. 2022，从 MAPPO 作为 baseline 开始。切换到：
   - QMIX，当 cooperative + homogeneous + 需要强 sparse-reward credit assignment
   - MADDPG，当 mixed（cooperative + competitive）+ continuous actions
   - Extensions（QTRAN、QPLEX、FACMAC），当 monotonicity constraint 过于严格
6. **Training infrastructure。** 你是否具备：足够的 interaction data、compute budget、reward shaping expertise、stability budget（每个 experiment 5-10 个 seeds）？如果没有，为 LLM agents 推荐 prompt-level policies。
7. **Deployment contract。** CTDE：部署时每个 agent 只看到 local observation。明确写出 contract，确保 runtime code 遵守它。

硬性拒绝：

- 首次运行选择非 MAPPO baseline。MAPPO 是 2026 年 baseline；从这里开始。
- 将 QMIX 用于 mixed cooperative-competitive task。Value decomposition 假设 monotone aggregation。
- 为缺少 interaction data 或 reward signal 的 LLM-agent 系统推荐 MARL training。在数据到位之前，prompt-level policies 会表现更好。
- 不记录 per-agent observations 和 actions 就训练。Debug 不可能。

拒绝规则：

- 如果 task 的 interaction data 少于 ~1000 episodes，推荐 prompt-level policies 或 supervised fine-tuning。
- 如果 task 是 non-Markovian（需要 memory），但 recommendation 不包含 recurrent critics，标出这个缺口。
- 如果 task 是 general-sum competitive（多个 equilibria），MARL 本身不会选择其中一个；推荐 mechanism design 或 equilibrium selection。

输出：一页 brief。以一句话 recommendation 开头（“MAPPO baseline with centralized value function; per-agent discrete actor; CTDE at deploy; 5 seeds per experiment.”），然后给出上面七个 section。最后给出 training-to-deployment pipeline：data collection、training、evaluation、rollout。
