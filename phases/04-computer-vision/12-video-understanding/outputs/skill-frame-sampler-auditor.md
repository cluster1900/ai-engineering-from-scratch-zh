---
name: skill-frame-sampler-auditor
description: 审计视频 pipeline 的 frame sampler，检查 off-by-one、短 clip 处理和 crop 一致性
version: 1.0.0
phase: 4
lesson: 12
tags: [computer-vision, video, sampling, debugging]
---

# Frame Sampler 审计器

Frame sampling 是视频 pipeline 最容易出问题的地方。这里的 bug 会传播到每一个下游 metric。

## 何时使用

- 编写新的视频 data loader。
- 复现论文中的数字，但训练 accuracy 低于报告值。
- 调试 eval accuracy 在不同运行之间不稳定的视频 model。

## 输入

- `sampler_code`: Python function，接收 (num_frames_total, T) 并返回 T 个 indices。
- `T`: 目标 clip 长度。
- 可选 test cases: 用于测试的 `num_frames_total` 值（例如 `[3, T-1, T, T+1, 30, 300, 3000]`）。

## 检查项

### 1. 短 clip 处理
输入 `num_frames_total < T`。每个返回的 index 都必须在 `[0, num_frames_total - 1]` 内。标准 padding 策略是对剩余位置重复最后一帧。

### 2. 边界 indices
输入 `num_frames_total == T`。返回的 indices 应该精确为 `[0, 1, ..., T-1]`。

### 3. 均匀分布
输入 `num_frames_total == 10 * T`。返回的 indices 应该单调递增，并且间隔大致均匀。

### 4. Dense window 边界
对于 dense sampling，输入 `num_frames_total == 3 * T`。返回的 indices 应该形成一个连续 window，且永远不越过 clip 末尾。

### 5. 确定性
用相同输入调用 sampler 两次，并且（对于 deterministic samplers）使用相同的 RNG。Indices 应该一致。

### 6. Crop 一致性
如果 pipeline 还会返回每帧的 spatial crop，则对同一个 clip 使用相同 seed 运行 sampler 两次，并确认每一帧使用相同的 crop box（相同的 `(x, y, w, h)`）。同一个 clip 内每帧使用不同 crop 会破坏时间一致性，是典型的静默 bug。可接受的变化：augmentation 按 *每个 clip* 应用，并且在一个 clip 内保持一致。

## 报告

```
[sampler audit]
  name: <function name>
  T:    <int>

[short-clip handling]
  passed | failed (<details>)

[boundary]
  passed | failed

[uniform spacing]
  passed | failed (<stddev of gaps>)

[dense window]
  passed | failed (<details>)

[determinism]
  passed | failed

[crop consistency]
  passed | failed (<per-frame crop varies: yes/no>)

[verdict]
  ok | fix required
```

## 规则

- 如果短 clip 处理返回越界 indices，绝不能把 sampler 标记为 "ok"。
- Dense samplers 绝不能返回越过 `num_frames_total - 1` 的 window。
- 如果 sampler 是 stochastic（dense），只在显式 seeded RNG 下测试确定性。
- 可以建议 canonical 策略，但不要静默修复：用最后一帧 padding、将 window clamp 到末尾、对 half-open intervals 进行 round。
