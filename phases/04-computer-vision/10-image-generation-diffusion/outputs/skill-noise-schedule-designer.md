---
name: skill-noise-schedule-designer
description: 根据 T 和目标损坏程度生成 linear、cosine 或 sigmoid beta schedule，并提供 SNR plot
version: 1.0.0
phase: 4
lesson: 10
tags: [computer-vision, diffusion, noise-schedule, training]
---

# Noise Schedule 设计器

beta schedule 控制每个 Diffusion step 保留多少信号。糟糕的 schedule 会在所有下游决策中限制训练效率和样本质量。

## 何时使用

- 开始新的 Diffusion 训练运行，并选择 T 和 beta。
- 调试产生模糊样本（schedule 过于激进）或无法学习结构（schedule 过于温和）的 Diffusion model。
- 比较论文中报告的不同 schedule 设计。

## 输入

- `T`: timesteps 数量，通常为 100-1000。
- `type`: linear | cosine | sigmoid。
- `target_alpha_bar_final`: 在 t=T 时要保留的信号比例，默认 0.001（99.9% 已损坏）。
- 可选 `image_resolution` — 更大的图像适合损坏更慢的 schedule（cosine 或 shifted schedules）。

## Schedule 公式

### Linear
```
beta_t = beta_start + (beta_end - beta_start) * (t - 1) / (T - 1)
```
默认值：beta_start=1e-4，beta_end=0.02（DDPM paper）。

### Cosine (Nichol & Dhariwal, 2021)
```
alpha_bar_t = cos^2((t/T + s) / (1 + s) * pi/2)
beta_t = 1 - alpha_bar_t / alpha_bar_{t-1}
```
s = 0.008。让信号保留更久；在低 step 数时效果更好。

### Sigmoid
```
alpha_bar_t = 1 / (1 + exp(k * (t/T - 0.5)))
```
k = 6 到 12。很好的折中方案；一些 SDXL variants 使用它。

## 步骤

1. 按公式计算 betas。
2. 预计算 `alphas`、`alphas_cumprod`、`sqrt_alphas_cumprod`、`sqrt_one_minus_alphas_cumprod`。
3. 计算 SNR_t = alpha_bar_t / (1 - alpha_bar_t)；生成 SNR 随时间变化的摘要。
4. 验证 `alphas_cumprod[T-1]` 是否在 `target_alpha_bar_final` 的 10% 范围内；否则调整 beta_end（linear）、s（cosine）或 k（sigmoid）并重试。
5. 报告三个检查点：
   - `t=T*0.25` — 早期损坏
   - `t=T*0.5` — 中途
   - `t=T*0.75` — 接近最终阶段

## 报告

```
[schedule]
  type:   <name>
  T:      <int>
  beta_start: <float>   beta_end: <float>

[signal retention]
  t=0.25T:  alpha_bar=<X>  SNR=<X>
  t=0.5T:   alpha_bar=<X>  SNR=<X>
  t=0.75T:  alpha_bar=<X>  SNR=<X>
  t=T:      alpha_bar=<X>  SNR=<X>

[warnings]
  - <if alpha_bar collapses before 0.75T>
  - <if beta_end produces NaN in log-SNR>
```

## 规则

- 绝不要输出任何 `alpha_bar_t <= 0` 的 schedule；将低于 1e-5 的值 clamp，并给出 warning。
- 对于低 step 数采样（< 30 steps），Cosine 是默认推荐。
- 当 `quality_target == research` 时，Linear 是默认选择 — DDPM baselines 使用 linear schedules 报告。
- 当 `image_resolution > 256` 时，推荐 shifting the schedule（Chen, 2023），以在高分辨率下保留更多信号。
