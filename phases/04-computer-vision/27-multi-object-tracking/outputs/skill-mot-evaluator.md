---
name: skill-mot-evaluator
description: 编写完整的 evaluation harness，用于基于 ground-truth tracks 评估 MOTA / IDF1 / HOTA
version: 1.0.0
phase: 4
lesson: 27
tags: [mot, evaluation, tracking, metrics]
---

# MOT Evaluator

将你的 tracker 输出封装到标准 MOTA/IDF1/HOTA pipeline 中，以便与文献进行公平比较。

## 何时使用

- 在 MOT17 / MOT20 / DanceTrack / SportsMOT 上 benchmark 一个新的 tracker。
- 在你自己的 footage 上比较 ByteTrack、BoT-SORT 和 SAM 2。
- 为 paper 或 PR description 生成可复现的数字。

## 输入

- `predictions`: 每帧的 `(track_id, x, y, w, h, confidence)` tuple 列表。
- `ground_truth`: 每帧的 `(gt_id, x, y, w, h)` tuple 列表。
- `iou_threshold`: MOTA 通常使用 0.5；HOTA 使用一次 sweep。
- `evaluator`: `py-motmetrics`（MOTA, IDF1）或 `TrackEval`（HOTA）。

## 输出格式契约

`py-motmetrics` 和 `TrackEval` 都期望特定的磁盘格式：

```
# predictions.txt
<frame>,<track_id>,<x>,<y>,<w>,<h>,<confidence>,-1,-1,-1

# ground_truth.txt
<frame>,<gt_id>,<x>,<y>,<w>,<h>,1,-1,-1,-1
```

Frames 从 1 开始索引，boxes 是 (x, y, w, h)，不是 (x1, y1, x2, y2)。转换环节是大多数集成 bug 出现的地方。

## 步骤

1. 将你的 tracker 输出转换为 MOT Challenge text format。
2. 对两个文件运行 `py-motmetrics.io.loadtxt`。
3. 使用 `mm.metrics.create().compute()` 计算 MOTA + IDF1。
4. 对于 HOTA，使用相同文件调用 `TrackEval`，并设置 `Metrics: HOTA`。
5. 将结果保存为 JSON，供 dashboards 使用。

## 实现草图

```python
import motmetrics as mm

def evaluate_mota_idf1(pred_path, gt_path):
    gt = mm.io.loadtxt(gt_path, fmt="mot15-2D")
    pred = mm.io.loadtxt(pred_path, fmt="mot15-2D")
    acc = mm.utils.compare_to_groundtruth(gt, pred, dist="iou", distth=0.5)
    metrics = mm.metrics.create().compute(
        acc, metrics=["num_frames", "mota", "motp", "idf1", "idp", "idr", "num_switches"]
    )
    return metrics


def write_mot_txt(predictions, path):
    with open(path, "w") as f:
        for frame_idx, detections in enumerate(predictions, start=1):
            for tid, x, y, w, h, conf in detections:
                f.write(f"{frame_idx},{tid},{x:.2f},{y:.2f},{w:.2f},{h:.2f},{conf:.3f},-1,-1,-1\n")
```

## 报告

```
[mot evaluation]
  frames:     <int>
  gt tracks:  <int>
  pred tracks: <int>

[metrics]
  MOTA:       <float>
  MOTP:       <float>
  IDF1:       <float>
  IDP/IDR:    <float/float>
  ID switches: <int>
  HOTA:       <float>  (from TrackEval)
```

## 规则

- 输出 text file 中始终使用 1-indexed frames；MOT tooling 期望这种格式。
- 写入前将 (x1, y1, x2, y2) 转换为 (x, y, w, h)。
- 现代比较中不要只报告 MOTA；包括 IDF1 和 HOTA。
- 注意 MOT17 上的 private vs public detections，它们会分别评估，混用会抬高分数。
- 记录 per-sequence scores；聚合结果会隐藏单个困难 sequences 上的失败。
