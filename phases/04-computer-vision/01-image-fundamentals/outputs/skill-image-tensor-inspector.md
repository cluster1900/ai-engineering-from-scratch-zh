---
name: skill-image-tensor-inspector
description: 检查任何 image-shaped tensor 或 array，并报告 dtype、layout、range，以及它看起来是 raw、normalized 还是 standardized
version: 1.0.0
phase: 4
lesson: 1
tags: [computer-vision, debugging, preprocessing, tensors]
---

# Image Tensor Inspector

一种 diagnostic skill，适用于 vision pipeline 中任何你持有 image-shaped array 并需要准确知道它处于什么状态的位置。

## 何时使用

- pretrained model 返回垃圾 predictions，而你怀疑 preprocessing 有问题。
- 在 OpenCV 和 torchvision 之间迁移 pipeline，且 channel order 不清楚。
- 堆叠来自多个 frameworks 的 layers，而 batch axis 总是出现在错误位置。
- debugging 一个 training loop，其中 loss 卡在 `log(num_classes)`。

## 输入

- `x`：任何 2-D、3-D 或 4-D array-like（NumPy、PyTorch、JAX）。
- 可选 `expected`：要检查的一组 invariants dict，例如 `{"layout": "CHW", "range": "standardized"}`。

## 步骤

1. **Resolve backend** — 检测 `x` 是 NumPy、Torch 还是 JAX。转换为 NumPy 以便检查，同时不改变原始对象。

2. **Classify rank**：
   - rank 2 -> 单通道图像 (H, W)。
   - rank 3 -> 如果最后一个 axis 是 1、3 或 4，且严格小于另外两个 axis，则为 `HWC`；否则为 `CHW`。
   - rank 4 -> 如果 axis 1 在 {1, 3, 4} 中，**并且** axis 2 或 axis 3 大于 16，则优先判为 `NCHW`；否则优先判为 `NHWC`。纯 axis-1 检查会误分类 small-image NHWC batches，例如 `(3, 4, 224, 3)`。
   - 始终将 ambiguous cases（例如 `(1, 3, 3, 3)`）标记为 `ambiguous`，而不是猜测；要求 caller 提供 `expected`。

3. **Classify dtype and range**：
   - `uint8` in [0, 255] -> `raw`。
   - `float*` 且 min >= 0、max <= 1.01 -> `normalized`。
   - `float*` 且 min < 0、|mean| < 0.5、0.5 <= std <= 1.5 -> `standardized`。
   - 其他任何情况 -> `unusual`，打印 histogram。

4. **Per-channel stats** — 报告每个 channel 的 mean 和 std。如果 array 看起来已 standardized，则与 ImageNet mean/std 比较，并给出 match confidence。

5. **Report** 使用以下精确 block：

```
[inspector]
  backend:   numpy | torch | jax
  rank:      2 | 3 | 4
  layout:    HW | HWC | CHW | NHWC | NCHW
  dtype:     <dtype>
  shape:     <shape>
  range:     raw | normalized | standardized | unusual
  min/max:   <min> / <max>
  per-channel mean: [ ... ]
  per-channel std:  [ ... ]
  likely source:    camera | PIL | OpenCV | torchvision | random init
  likely target:    display | training | inference
```

6. 根据 `likely target` **Recommend next action**：
   - 对于 `display`：transpose 到 HWC，clip，convert to uint8。
   - 对于 `training`：使用 dataset stats 进行 standardize，transpose 到 CHW，添加 batch axis。
   - 对于 `inference`：匹配 model card 中的精确 invariants。

## 规则

- 绝不要 mutate input。只打印 diagnostics。
- 如果提供了 `expected`，用 `[expected X got Y]` 标记每一个 mismatch。
- 当 layout 或 channel order ambiguous 时，指出 silent-failure risks。
- 一次只推荐一个 action，不要给出 options 列表。
