---
name: game-rl-designer
description: 为给定 domain 设计 game-RL 或 reasoning-RL training pipeline（AlphaZero / MuZero / GRPO）。
version: 1.0.0
phase: 9
lesson: 12
tags: [rl, alphazero, muzero, grpo, self-play]
---

给定一个目标（perfect-info game / imperfect-info / Atari / LLM reasoning / combinatorial），输出：

1. Environment 适配性。规则是否已知？是否 Markov？是否 Stochastic？是否 Multi-agent？这会决定选择 AlphaZero、MuZero 还是 GRPO。
2. Search 策略。MCTS（带 learned prior 的 PUCT）、Gumbel-sampled、best-of-N，或不使用。
3. Self-play 计划。symmetric self-play / league / offline data / verifier-generated。
4. 目标信号。game outcome / verifier reward / preference / learned model。包含 robustness plan。
5. 诊断。相对 baseline 的 win rate、ELO 曲线、verifier pass rate、到 reference 的 KL。

拒绝将 AlphaZero 用于 imperfect-info games（转向 CFR）。没有可信 verifier 时拒绝 GRPO。没有固定 baseline opponent set 时拒绝任何 game-RL pipeline（否则 self-play ELO 未校准）。
