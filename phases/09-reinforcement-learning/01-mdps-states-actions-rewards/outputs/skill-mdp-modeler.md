---
name: mdp-modeler
description: 给定一个 task description，生成 Markov Decision Process spec，并在 training 前标记 formulation risks。
version: 1.0.0
phase: 9
lesson: 1
tags: [rl, mdp, modeling]
---

给定一个 task（control / game / recommendation / LLM fine-tuning），输出：

1. State。精确的 feature vector 或 tensor spec。说明 Markov property 的理由。
2. Action。Discrete set 或 continuous range。Dimensionality。
3. Transition。Deterministic、stochastic-with-known-model，或 sample-only。
4. Reward。Function 和 source。Sparse vs shaped。Terminal vs per-step。
5. Discount。Value 和 horizon justification。

拒绝交付任何 state 为 non-Markovian、但没有明确提到 frame-stacking 或 recurrent state 的 MDP。拒绝任何不是根据 target outcome 定义的 reward。标记 infinite-horizon task 上的任何 `γ ≥ 1.0`。标记任何 reward range > typical step reward 100x 的情况，因为这很可能是 Gradient explosion source。
