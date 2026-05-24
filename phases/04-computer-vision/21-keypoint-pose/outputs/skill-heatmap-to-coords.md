---
name: skill-heatmap-to-coords
description: 编写每个生产级 pose model 都会使用的 sub-pixel heatmap-to-coordinate routine
version: 1.0.0
phase: 4
lesson: 21
tags: [keypoint, pose, subpixel, inference]
---

# Heatmap to Coords

将原始 keypoint heatmaps 转换为 sub-pixel 精度坐标。这是每个 pose pipeline 中成本最低的准确率升级。

## 何时使用

- 部署基于 heatmap 的 keypoint model。
- Benchmark pose metrics —— OKS 对 sub-pixel accuracy 极其敏感。
- 将 pose code 从一个 framework 移植到另一个 framework。

## 输入

- `heatmaps`: `(N, K, H, W)` tensor，来自 model 的 per-keypoint heatmaps。
- `confidence_threshold`: 丢弃峰值低于此值的 keypoints。

## 步骤

1. 对每个 heatmap 执行 **Argmax**，找到整数峰值位置。
2. **First-difference offset** —— 从邻近 pixels 估计 sub-pixel offset。`0.25` 系数是一个 heuristic，针对 `sigma >= 1` 的 Gaussian heatmaps 校准；若要进行更 principled 的 sub-pixel recovery，请使用完整 quadratic fit（DARK）或 Gaussian fit。

```
dx = 0.25 * sign(heatmap[y, x+1] - heatmap[y, x-1])
dy = 0.25 * sign(heatmap[y+1, x] - heatmap[y-1, x])
```

对于 DARK / quadratic variant，使用局部 quadratic 近似：

```
dx = -0.5 * (heatmap[y, x+1] - heatmap[y, x-1])
        / (heatmap[y, x+1] - 2 * heatmap[y, x] + heatmap[y, x-1] + eps)
```

quadratic fit 在峰值明显的 heatmaps 上更准确；当 heatmaps 噪声较大时，基于 sign 的 offset 是更安全的默认选择。

3. 将 **offset** 加到整数峰值上。
4. **Confidence** —— 返回每个 keypoint 的峰值；客户端用它 mask 低置信度预测。
5. **Boundary case** —— 当峰值落在某个轴的第一个或最后一个 pixel 上时，其中一个邻居会被 clamped；offset 折叠为零，这是最安全的 fallback。

## 输出模板

```python
import torch

def heatmap_to_coords_subpixel(heatmaps, threshold=0.2):
    N, K, H, W = heatmaps.shape
    flat = heatmaps.reshape(N, K, -1)
    conf, idx = flat.max(dim=-1)
    ys = (idx // W).float()
    xs = (idx % W).float()

    ys_int = ys.long()
    xs_int = xs.long()

    x_minus = (xs_int - 1).clamp(min=0)
    x_plus = (xs_int + 1).clamp(max=W - 1)
    y_minus = (ys_int - 1).clamp(min=0)
    y_plus = (ys_int + 1).clamp(max=H - 1)

    batch_idx = torch.arange(N).view(-1, 1).expand(-1, K)
    kp_idx = torch.arange(K).view(1, -1).expand(N, -1)

    dx_raw = (heatmaps[batch_idx, kp_idx, ys_int, x_plus]
              - heatmaps[batch_idx, kp_idx, ys_int, x_minus])
    dy_raw = (heatmaps[batch_idx, kp_idx, y_plus, xs_int]
              - heatmaps[batch_idx, kp_idx, y_minus, xs_int])
    dx = 0.25 * torch.sign(dx_raw)
    dy = 0.25 * torch.sign(dy_raw)

    at_left = xs_int == 0
    at_right = xs_int == (W - 1)
    at_top = ys_int == 0
    at_bottom = ys_int == (H - 1)
    dx = torch.where(at_left | at_right, torch.zeros_like(dx), dx)
    dy = torch.where(at_top | at_bottom, torch.zeros_like(dy), dy)

    refined_x = xs + dx
    refined_y = ys + dy
    coords = torch.stack([refined_x, refined_y], dim=-1)
    mask = conf >= threshold
    return coords, conf, mask
```

## 报告

```
[subpixel decode]
  keypoints:   K
  threshold:   <float>
  valid_rate:  fraction of keypoints above threshold
```

## 规则

- 始终将邻居 indices clamp 到有效范围；off-edge keypoints 会得到 zero-difference offset，但不会 crash。
- 将 confidence 与 coordinates 一起返回，这样客户端可以 mask 低置信度 points。
- sub-pixel refinement 只在 heatmap 峰值周围平滑时有效 —— 检查训练是否使用了 sigma >= 1 的 Gaussian target。
- 对于非常小的 heatmap resolutions（< 48x48），考虑先将 heatmap upsampling 到 full image size，再提取 coordinates；sub-pixel offset 会随 stride 缩放。
