---
name: mdp-modeler
description: 给定一个任务描述，生成 Markov Decision Process 规范，并在 Training 前标记建模风险。
version: 1.0.0
phase: 9
lesson: 1
tags: [rl, mdp, modeling]
---

给定一个任务（控制 / 游戏 / 推荐 / LLM Fine-tuning），输出：

1. State。精确的 Feature Vector 或 Tensor 规范。说明满足 Markov property 的理由。
2. Action。离散集合或连续范围。维度。
3. Transition。确定性、具有已知模型的随机性，或仅可采样。
4. Reward。函数和来源。稀疏还是塑形。终止时还是每一步。
5. Discount。取值和时域依据。

如果 State 不满足 Markov property，且未明确提及帧堆叠或循环状态，则拒绝交付该 MDP。拒绝任何未根据目标结果定义的 Reward。标记无限时域任务中的任何 `γ ≥ 1.0`。标记任何 Reward 范围超过典型单步 Reward 100 倍的情况，因为这很可能是 Gradient 爆炸的来源。
