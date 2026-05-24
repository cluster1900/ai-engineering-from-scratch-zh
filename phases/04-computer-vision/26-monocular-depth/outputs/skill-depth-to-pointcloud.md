---
name: skill-depth-to-pointcloud
description: 使用正确的 intrinsics 处理从 depth maps 构建 point clouds，并导出为 .ply
version: 1.0.0
phase: 4
lesson: 26
tags: [depth, point-cloud, 3d, intrinsics]
---

# Depth 到 Point Cloud

将 depth map 加上一张彩色图像转换为带纹理的 point cloud，可导出用于可视化或进一步的 3D 工作。

## 何时使用

- 将 depth 预测可视化为真实的 3D 场景。
- 从单张图像启动稀疏 3D 重建。
- 当 SfM 失败时，为 3DGS 训练生成输入。
- 将预测 depth 与 LiDAR ground truth 进行比较。

## 输入

- `depth`：`(H, W)` numpy array，depth 单位应与输出中想要的单位一致（推荐 metres）。
- `rgb`：`(H, W, 3)` numpy array，颜色（uint8 或 float32 [0, 1]）。
- `intrinsics`：`(fx, fy, cx, cy)`，单位为 pixel。
- 可选 `depth_scale`：用于将预测 depth 单位转换为 metres 的乘数。

## Pipeline

1. **Validate** — depth 必须在你计划包含的所有位置为正且有限。屏蔽无效 pixels。
2. **Lift** — 每个 pixel 使用 `X = (u - cx) * d / fx`、`Y = (v - cy) * d / fy`、`Z = d`。
3. **Pair** with RGB — 每个 3D point 从匹配 pixel 获得一个 `(r, g, b)` triple。
4. **Export** — PLY（portable）、`.xyz`（轻量）、`.pcd`（Open3D-native）、`.las`/`.laz`（geospatial）。

## Implementation template

```python
import numpy as np

def depth_to_point_cloud(depth, intrinsics, depth_scale=1.0, min_depth=0.1, max_depth=100.0):
    H, W = depth.shape
    fx, fy, cx, cy = intrinsics
    v, u = np.meshgrid(np.arange(H), np.arange(W), indexing="ij")
    z = depth.astype(np.float32) * depth_scale
    valid = (z > min_depth) & (z < max_depth) & np.isfinite(z)
    x = (u - cx) * z / fx
    y = (v - cy) * z / fy
    points = np.stack([x, y, z], axis=-1)
    return points, valid


def write_ply(path, points, colors=None, valid_mask=None):
    p = points.reshape(-1, 3)
    if valid_mask is not None:
        p = p[valid_mask.flatten()]
    lines = [
        "ply",
        "format ascii 1.0",
        f"element vertex {p.shape[0]}",
        "property float x", "property float y", "property float z",
    ]
    if colors is not None:
        c = colors.reshape(-1, 3).astype(np.uint8)
        if valid_mask is not None:
            c = c[valid_mask.flatten()]
        lines += ["property uchar red", "property uchar green", "property uchar blue"]
    lines.append("end_header")
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")
        if colors is not None:
            for pt, col in zip(p, c):
                f.write(f"{pt[0]:.4f} {pt[1]:.4f} {pt[2]:.4f} {col[0]} {col[1]} {col[2]}\n")
        else:
            for pt in p:
                f.write(f"{pt[0]:.4f} {pt[1]:.4f} {pt[2]:.4f}\n")
```

## 报告
```
[export]
  input depth shape:  (H, W)
  valid points:       <N> of <H*W>
  output format:      ply | xyz | pcd | las
  coordinate system:  camera (+X right, +Y down, +Z forward)
  scale:              metres | millimetres | normalised
```

## 规则

- 始终屏蔽无效 depth（zero、NaN、inf、saturated）；包含它们会在原点生成一团垃圾 points。
- 对于来自 relative-depth model 的预测，不要导出为 metric；输出文件名前加上 `relative_`，以标明该约定。
- 保持 camera coordinate 约定一致（OpenCV：+X right，+Y down，+Z forward）。如果下游工具预期 OpenGL（+Y up），则交换符号。
- 对于密集场景（> 1M points），提供 subsample 参数；大于 500 MB 的 PLY 文件在各处加载都很麻烦。
- 绝不要为了生成“reasonable”的输出而静默裁剪 depth；应使用带警告的阈值显式裁剪，让用户知道哪些内容被丢弃。
