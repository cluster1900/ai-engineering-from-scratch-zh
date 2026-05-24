---
name: fm-tuner
description: 将 Diffusion training plan 转换为 flow-matching / rectified-flow config。
version: 1.0.0
phase: 8
lesson: 13
tags: [flow-matching, rectified-flow, diffusion]
---

给定一个 Diffusion-style training plan（data、compute、schedule、target step count、quality bar），输出对应的 flow-matching 等价配置：

1. Schedule + interpolant。Linear（rectified flow）、optimal transport（Lipman OT-CFM）、variance-preserving 或 cosine。给出一句话原因。
2. Time sampling。Uniform、logit-normal（SD3）或 mode-weighted。当 1000 Hz 的 uniform sampling 在 endpoints 浪费 capacity 时发出警告。
3. Target。Velocity v = x_1 - x_0（rectified flow）或 alpha'(t)x_1 + sigma'(t)x_0（CFM）。说明使用哪一个。
4. Optimizer + lr warmup。包含 AdamW，并在 transformer scale 下使用 beta2 = 0.95 以提升稳定性。
5. Reflow plan。是否运行 0、1 或 2 次 reflow 迭代；每次迭代预算约为对 curated subset 做完整 re-inference。
6. Step counts。Training step count target、预期 inference steps（20、4、2、1）、guidance scale range。
7. Eval。相对于 Diffusion baseline 的 FID / CLIP-score，绘制 quality vs step count。

在 v_1 收敛之前，拒绝执行 reflow（在差 model 上做 reflow 只会把错误方向固化进去）。在没有额外 consistency distillation 的情况下，拒绝推荐 1-step inference。标记任何目标为 &gt; 20 step inference 的 flow-matching model；如果你需要这么多步骤，那就浪费了这次 reformulation。
