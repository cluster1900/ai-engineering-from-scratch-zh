---
name: skill-point-cloud-loader
description: 为 .ply / .pcd / .xyz 文件编写 PyTorch Dataset，包含正确的 normalisation、centring 和 point sampling
version: 1.0.0
phase: 4
lesson: 13
tags: [3d-vision, point-cloud, data-loading, pytorch]
---

# Point Cloud Loader

将一个包含 3D scan files 的文件夹转换为可直接训练的 PyTorch `Dataset`。

## 何时使用
- 开始一个新的 point-cloud classification / segmentation 项目。
- 在 `.ply`、`.pcd` 和 `.xyz` 格式之间切换。
- 调试一个训练无报错但收敛很差的 model；通常是 data loader normalisation 错了。

## 输入
- `data_root`: point-cloud files 文件夹，以及可选的带 labels 的 CSV。
- `file_format`: ply | pcd | xyz | npy.
- `num_points`: 固定 sampling size，通常为 1024 或 2048。
- `augmentation`: none | rotate | jitter | mixup.

## Normalisation policy

每个 production point-cloud pipeline 都按顺序执行：

1. **Centre** cloud：减去 centroid。
2. **Scale** 到 unit sphere：除以距离 centre 的最大距离。
3. **Sample** `num_points` 个 points。如果 cloud 有更多 points，对忠实的 shape representation 使用 **farthest point sampling**（FPS），或为速度使用 random sampling。如果更少，则重复 points。
4. **Shuffle** point order（无论如何，order 对 model 都不应重要，但 shuffling 会打破意外的 order dependencies）。

## 输出模板
```python
import numpy as np
import torch
from torch.utils.data import Dataset

try:
    import open3d as o3d
    HAS_O3D = True
except ImportError:
    HAS_O3D = False

def _read_ply(path):
    if HAS_O3D:
        pc = o3d.io.read_point_cloud(path)
        return np.asarray(pc.points, dtype=np.float32)
    # Fallback: minimal ascii-ply reader
    ...

def _fps(points, k):
    idx = np.zeros(k, dtype=np.int64)
    dist = np.full(len(points), np.inf)
    seed = np.random.randint(len(points))
    idx[0] = seed
    for i in range(1, k):
        dist = np.minimum(dist, ((points - points[idx[i-1]]) ** 2).sum(axis=1))
        idx[i] = int(np.argmax(dist))
    return idx

def normalise(points):
    centre = points.mean(axis=0)
    points = points - centre
    scale = np.max(np.linalg.norm(points, axis=1))
    return points / max(scale, 1e-8)

class PointCloudDataset(Dataset):
    def __init__(self, files, labels, num_points=1024, augment=False):
        self.files = files
        self.labels = labels
        self.num_points = num_points
        self.augment = augment

    def __len__(self):
        return len(self.files)

    def __getitem__(self, i):
        pts = _read_ply(self.files[i])
        pts = normalise(pts)
        if len(pts) >= self.num_points:
            idx = _fps(pts, self.num_points)
            pts = pts[idx]
        else:
            reps = int(np.ceil(self.num_points / len(pts)))
            pts = np.tile(pts, (reps, 1))[:self.num_points]
        # Shuffle point order to break any accidental dependencies (especially
        # important when tiling repeats points in deterministic order).
        np.random.shuffle(pts)
        if self.augment:
            theta = np.random.uniform(0, 2 * np.pi)
            R = np.array([[np.cos(theta), 0, np.sin(theta)],
                          [0, 1, 0],
                          [-np.sin(theta), 0, np.cos(theta)]], dtype=np.float32)
            pts = pts @ R
            pts = pts + np.random.normal(0, 0.02, pts.shape).astype(np.float32)
        pts = np.ascontiguousarray(pts, dtype=np.float32)
        return torch.from_numpy(pts).transpose(0, 1), int(self.labels[i])
```

## 报告
```
[dataset]
  files:          <N>
  format:         <ply|pcd|xyz|npy>
  points_per_sample: <int>
  normalise:      centre + unit sphere
  sampling:       FPS | random
  augmentation:   <list>
```

## 规则
- 始终先 centre 再 scale；交换顺序会改变 "unit sphere" 的含义。
- 对 shape tasks，优先使用 FPS 而不是 random sampling；对于 segmentation，random 可以，因为每个 point 本来都重要。
- 绝不要在 evaluation 期间做 augment；只在 training 期间做。
- 如果 point cloud files 包含 colour 或 normals 作为额外 channels，请扩展 Dataset，使其返回 `(3 + C, num_points)` tensor，而不只是 xyz。
