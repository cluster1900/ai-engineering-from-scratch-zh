---
name: skill-segmentation-mask-inspector
description: 报告类别分布、预测 mask 统计信息，以及最可能被低估预测或边界模糊的类别
version: 1.0.0
phase: 4
lesson: 7
tags: [computer-vision, segmentation, debugging, evaluation]
---

# Segmentation Mask 检查器

用于诊断“loss 下降了”和“mask 实际看起来正确”之间差距的工具。

## 何时使用

- 训练运行刚结束后，当 mIoU 看起来不错但视觉检查显示并非如此。
- 部署前：检查预测的类别平衡与 ground truth 的对比。
- 当大对象的 per-class IoU 很高，但小对象的 per-class IoU 很低时。
- 调试 boundary artefacts，它们因为 pixel count 很小而不会在 IoU 中显现。

## 输入

- `preds`: (N, H, W) tensor，包含预测的 class IDs。
- `targets`: (N, H, W) tensor，包含 ground-truth class IDs。
- `num_classes`: integer。
- 可选 `class_names`: C 个字符串的列表。

## 步骤

1. **Class pixel histograms。** 计算 `preds` 和 `targets` 中每类像素的百分比。标记任何满足 `|pred% - gt%| / max(gt%, 1e-6) > 0.30` 的类别（relative deviation 超过 30%）。对于 ground truth 中不存在的类别（`gt% == 0`），直接标记任何预测占比超过 `0.3` 的类别。

2. **IoU per class** 和 **boundary F1 per class**。Boundary F1 通过将每个 mask 膨胀 3 pixels、求交集并打分来计算。IoU > 0.7 但 boundary F1 < 0.5 的类别存在边缘模糊。

3. **Small-object recall。** 将每个 ground-truth connected component 分成 size buckets（tiny < 100 px，small < 1000 px，medium < 10000 px，large >= 10000 px）。按 bucket、按 class 报告 recall。当 small-object recall 低于 0.3 而 large-object recall 高于 0.9 时，说明存在 resolution / receptive-field 问题。

4. **Confusion pairs。** 对每个类别，找出它最常混淆的类别（其 ground-truth mask 内最常见的错误预测类别）。报告 top 3 pairs。

5. **Saturation check（需要 `probs` 或 `logits`，不能只有 `preds`）。** 如果调用方传入原始 per-pixel probability distribution `probs: (N, C, H, W)`，计算每个类别中 `probs.max(dim=1) > 0.99` 的像素比例。高 saturation（某类别像素中 >0.9）表示过度自信，是 label smoothing 或 calibration 的候选。当只有 argmax 后的 `preds` 可用时，跳过此步骤并在报告中注明。

## 报告格式

```
[mask-inspector]
  classes: C

[class distribution]
  name       gt %    pred %   delta
  ...

[metrics]
  class       IoU     bF1    recall_tiny  recall_small  recall_medium  recall_large
  ...

[confusion pairs]
  class A confused with class B: <N> pixels (most common)
  class B confused with class A: <N> pixels
  ...

[verdict]
  most impactful issue: <one sentence>
```

## 规则

- 按 gt pixel share 降序排列类别行，使最常见的类别排在前面。
- 将 IoU < 0.4 或 boundary F1 < 0.3 的类别标记为 `critical`。
- 当 small-object recall 是主要失败原因时，建议：higher-resolution training、last encoder stage 使用更小 stride，或 feature-pyramid decoder。
- 当 boundary F1 是主要失败原因时，建议：boundary-aware loss（Lovasz 或 BoundaryLoss）、带 horizontal flip 的 TTA，以及 stride-less decoder。
- 永远不要只输出 class indices 作为唯一标识符；如果提供了 `class_names`，则在每一行都使用它。
