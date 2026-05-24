---
name: skill-anchor-designer
description: 给定一个 ground-truth box 数据集，对 (w, h) 运行 k-means，并返回每个 FPN level 的 anchor sets 以及 coverage statistics
version: 1.0.0
phase: 4
lesson: 6
tags: [computer-vision, detection, anchors, kmeans]
---

# Anchor Designer

Anchors 是 anchor-based detector 中最依赖数据集的单个 hyperparameter。默认 COCO anchors 在 cell-culture images、satellite tiles 或 small-object surveillance 上表现不足。这个 skill 会推导出真正匹配目标数据的 anchors。

## 何时使用

- 在新数据集上进行第一次 training run 之前。
- 当一个其他方面健康的 model 在非常小或非常大的 objects 上 recall 较弱时。
- 在一次重大 dataset expansion 之后，此时 box size distribution 可能已经发生变化。

## 输入
- `boxes`: shape 为 (N, 4) 的 numpy array，格式为 `(cx, cy, w, h)` 或 `(x1, y1, x2, y2)`；建议至少有 1000 个 positive boxes。
- `num_anchors_per_level`: 通常为 3。
- `num_fpn_levels`: 通常为 3 (P3, P4, P5) 或 4。
- `input_size`: training-resolution HxW。
- 可选 `strides`: 每个 level 的 strides；省略时，取 `[8, 16, 32, 64]` 的前 `num_fpn_levels` 项。如果 detector 的 FPN 使用不同 strides，请显式传入更长或更短的 array。

## 步骤
1. **归一化 boxes** 为 `input_size` 下以 pixel 为单位的 `(w, h)` pairs。丢弃任何 w 或 h < 2 pixels 的 box。

2. **运行 k-means**，输入为 `(w, h)` pairs，且 `k = num_anchors_per_level * num_fpn_levels`。使用 `1 - IoU(box, cluster)` 作为 distance function，而不是 Euclidean distance — 在 `(w, h)` 上使用 Euclidean 会把细高 boxes 和方形 boxes 聚到一起。所有 boxes 权重相同（unweighted）；如果你有 class-imbalanced dataset 并且希望提升 larger-box recall，请在 input array 中重复 rare-class boxes，而不是传入 weight vector。

3. **按 area 升序排序 clusters**。拆分为 `num_fpn_levels` 组，每组 `num_anchors_per_level` 个。最小的 areas 分配给最高分辨率 level（最小 stride）。

4. **计算每个 level 的 coverage statistics**：
   - 每个 ground-truth box 到该 level 最佳 anchor 的 `median IoU`。
   - `recall@IoU=0.5` — best anchor 的 IoU >= 0.5 的 boxes 百分比。
   - `area coverage` — box area 落在该 level 的 `[anchor_min_area / 4, anchor_max_area * 4]` 范围内的比例。

5. **报告每个 level 的 anchors**，并标记 `recall@IoU=0.5 < 0.9` 的 levels；该 level 的 anchors 与数据匹配不佳，应重新调优，或增加每个 level 的 anchors 数量。

## Report format

```
[anchor-designer]
  total boxes:         <N>
  clusters:            <k>
  distance metric:     1 - IoU

[level P3  stride=8]
  anchors (w, h):      [(A, B), (C, D), (E, F)]
  median IoU:          <X>
  recall@IoU=0.5:      <X>
  coverage:            <X>
  flag:                ok | retune

[level P4  stride=16]
  ...

[summary]
  overall recall@IoU=0.5: <X>
  smallest anchor:        <w x h>
  largest anchor:         <w x h>
  recommendation:         <one sentence if any level flagged>
```

## 规则
- 始终使用基于 IoU 的 distance；Euclidean k-means 会产生视觉上合理但实证效果更差的 anchors。
- 按 area 对 clusters 排序，然后按升序分配到 levels。
- 当 `num_anchors_per_level = 1` 时，完全跳过 k-means：按 area quantile 将 boxes 拆分为 `num_fpn_levels` 个 bins（例如 3 个 levels 使用 terciles），并将每个 level 的 anchor 设为对应 bin 内的 median (w, h)。这比在小数据集上使用 `k = num_fpn_levels` 运行 k-means 更稳健。
- 绝不要输出负数 anchor dimensions；最小 clamp 到 1。
- 如果数据集少于 200 个 boxes，提醒用户 anchor search 不可靠，并建议使用默认 COCO anchors 加上更多 training data。
