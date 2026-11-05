---
id: video-3d-vision
title: Video, Depth and 3D Vision
code: VD
subtitle: 采样帧、建模时间，渲染 NeRF 与 Gaussian splat，预测深度并跨帧跟踪物体。
hue: 190
sources: phases/04-computer-vision/12-video-understanding, phases/04-computer-vision/13-3d-vision-nerf, phases/04-computer-vision/22-3d-gaussian-splatting, phases/04-computer-vision/26-monocular-depth, phases/04-computer-vision/27-multi-object-tracking, phases/04-computer-vision/28-world-models-video-diffusion
source_hash: c86ac84265db2ca6
---

## 视频模型
type: concepts
from: phases/04-computer-vision/12-video-understanding/docs/en.md

- **2D + 池化**：每帧一个 CNN，再对时间取平均。
- **3D 卷积**：(T, H, W) 卷积核。能建模运动。
- **I3D**：把 2D 卷积核沿时间轴膨胀。
- **(2+1)D**：先做 2D 空间卷积，再做 1D 时间卷积。
- **分离注意力**：先对时间做注意力，再对空间做注意力。
- **均匀采样**：均匀取 T 帧。这是 2D + 池化的默认做法。
- **稠密采样**：随机的连续窗口。用于 3D 卷积。
- **片段 / 视频准确率**：一个片段，或者各片段的平均。

## 选择 3D、深度或跟踪模型
type: concepts
from: phases/04-computer-vision/13-3d-vision-nerf/docs/en.md, phases/04-computer-vision/22-3d-gaussian-splatting/docs/en.md, phases/04-computer-vision/26-monocular-depth/docs/en.md, phases/04-computer-vision/27-multi-object-tracking/docs/en.md

- **NeRF**：场景就是一个 MLP。训练要数小时。
- **3DGS**：显式的 Gaussian。训练只要数分钟。
- **Depth Anything V3**：相对深度，冻结 DINOv2。
- **ZoeDepth**：度量深度。对内参敏感。
- **Marigold**：扩散深度。10-50 步。
- **ByteTrack**：车辆和行人，30+ fps。
- **DeepSORT**：严重遮挡，用 ReID 特征。
- **SAM 3.1 Multiplex**：同一类别的密集目标。

## 基于检测的跟踪
type: architecture
from: phases/04-computer-vision/27-multi-object-tracking/docs/en.md

```arch
node | frame | 1,1 | Frame t | video input | client
node | det | 2,1 | Detector | detections at t | model
node | assoc | 3,1 | Hungarian assignment | IoU, cosine, motion
node | upd | 4,1 | Update | matched tracks
node | prev | 1,2 | Tracks up to t-1 | | store
node | kal | 2,2 | Kalman predict | constant velocity
node | born | 3,2 | Birth | new tracks
node | age | 4,2 | Age unmatched | delete after N
edge | frame | det |
edge | det | assoc | detections
edge | prev | kal |
edge | kal | assoc | predicted boxes
edge | assoc | upd | matched
edge | assoc | born | unmatched detections
edge | assoc | age | unmatched tracks
```

## 公式
type: concepts
from: phases/04-computer-vision/13-3d-vision-nerf/docs/en.md, phases/04-computer-vision/22-3d-gaussian-splatting/docs/en.md, phases/04-computer-vision/26-monocular-depth/docs/en.md, phases/04-computer-vision/27-multi-object-tracking/docs/en.md

- **PointNet**：$f(P) = \max_{p \in P} \mathrm{MLP}(p)$。点的顺序不会改变它。
- **位置编码**：$\sin(2^l \pi p), \cos(2^l \pi p)$，最高到 $L = 10$ 层。
- **体渲染**：$C = \sum_i T_i (1 - e^{-\sigma_i \delta_i}) c_i$，$T_i = e^{-\sum_{j<i} \sigma_j \delta_j}$
- **3DGS 形状**：$\Sigma = R S S^T R^T$。在屏幕上 $\Sigma' = J W \Sigma W^T J^T$。
- **3DGS 像素**：$C = \sum_i \alpha_i T_i c_i$，$T_i = \prod_{j<i} (1 - \alpha_j)$
- **针孔反投影**：$X = (u - c_x) d / f_x$，$Y = (v - c_y) d / f_y$，$Z = d$
- **AbsRel**：$|d_{pred} - d_{gt}| / d_{gt}$ 的均值。越低越好。
- **MOTA**：$1 - (FN + FP + \mathrm{IDSW}) / GT$

## 帧、膨胀与 (2+1)D
type: annotated-code
lang: python
from: phases/04-computer-vision/12-video-understanding/docs/en.md, phases/04-computer-vision/12-video-understanding/code/main.py

```python
idx = sample_uniform(num_frames_total, T)          # even spread
idx = sample_dense(num_frames_total, T)            # contiguous window
model = FramePool(num_classes=10)                  # ResNet-18 per frame, mean over T
x = torch.randn(2, 8, 3, 224, 224)                 # (N, T, 3, H, W)
conv2d = nn.Conv2d(3, 64, kernel_size=3, padding=1, bias=False)
conv3d = inflate_2d_to_3d(conv2d, time_kernel=3)   # repeat on time, divide by 3
c = Conv2Plus1D(3, 64)                             # spatial, then temporal
c(torch.randn(1, 3, 8, 56, 56))                    # same 3D input as conv3d
```

## 渲染一条 NeRF 射线
type: annotated-code
lang: python
from: phases/04-computer-vision/13-3d-vision-nerf/docs/en.md, phases/04-computer-vision/13-3d-vision-nerf/code/main.py

```python
y = positional_encoding(x, L=10)                   # (5, 3) to (5, 60)
t_vals = torch.linspace(2.0, 6.0, N)               # N = 64 samples on the ray
delta = torch.cat([t_vals[1:] - t_vals[:-1], torch.full_like(t_vals[:1], 1e10)])
alpha = 1.0 - torch.exp(-sigma * delta)            # opacity of each sample
trans = torch.cumprod(torch.cat([torch.ones_like(alpha[..., :1]), 1.0 - alpha + 1e-10], dim=-1), dim=-1)[..., :-1]
weights = alpha * trans                            # transmittance times opacity
rendered = (weights.unsqueeze(-1) * rgb).sum(dim=-2)  # pixel colour
depth = (weights * t_vals).sum(dim=-1)             # depth along the ray
```

## 深度指标与提升
type: annotated-code
lang: python
from: phases/04-computer-vision/26-monocular-depth/docs/en.md, phases/04-computer-vision/26-monocular-depth/code/main.py

```python
aligned = align_scale_shift(pred, gt)              # fit a * pred + b for relative depth
abs_rel_error(aligned, gt)                         # 0.05-0.1 for production models
delta_accuracy(pred, target, threshold=1.25)       # 0.9+ for SOTA
intr = (320.0, 320.0, 160.0, 120.0)                # fx, fy, cx, cy
pc = depth_to_point_cloud(depth, intr)             # (H, W, 3)
pipe = pipeline(task="depth-estimation", model="depth-anything/Depth-Anything-V2-Large-hf")
out = pipe(image)
depth_np = np.array(out["depth"])                  # PIL grayscale to numpy
```

## IoU 与匈牙利关联
type: annotated-code
lang: python
from: phases/04-computer-vision/27-multi-object-tracking/docs/en.md, phases/04-computer-vision/27-multi-object-tracking/code/main.py

```python
iou = bbox_iou(track_boxes, det_boxes)             # (tracks, detections)
cost = 1 - iou
cost[iou < self.iou_threshold] = 1e6               # block weak matches
row, col = linear_sum_assignment(cost)             # minimum total cost
for r, c in zip(row, col):
    if cost[r, c] < 1.0:
        self.tracks[r].update(det_boxes[c], frame)
self.tracks = [t for t in self.tracks if frame - t.last_frame <= self.max_age]
tracker = SimpleTracker()                          # iou_threshold=0.3, max_age=5
tracks = tracker.step(dets, f)                     # list of (id, bbox)
```

## 命令与导出
type: command-table
from: phases/04-computer-vision/22-3d-gaussian-splatting/docs/en.md, phases/04-computer-vision/27-multi-object-tracking/docs/en.md

| 命令 | 作用 |
|---|---|
| `pip install nerfstudio gsplat` | 安装 3DGS 工具 |
| `ns-download-data example` | 获取示例数据集 |
| `ns-train splatfacto --data path/to/data` | 训练 3DGS，RTX 4090 上 10-30 分钟 |
| `.ply` | 原始 Gaussian 点云。可移植，文件最大 |
| `.splat` | 量化格式 |
| `KHR_gaussian_splatting` | 各查看器通用的 glTF 标准 |
| `UsdVolParticleField3DGaussianSplat` | OpenUSD 模式 |
| `model.track(source, tracker="bytetrack.yaml")` | 带 ByteTrack 的 YOLOv8 |

## 默认值与数字
type: defaults
from: phases/04-computer-vision/12-video-understanding/docs/en.md, phases/04-computer-vision/13-3d-vision-nerf/docs/en.md, phases/04-computer-vision/22-3d-gaussian-splatting/docs/en.md, phases/04-computer-vision/26-monocular-depth/docs/en.md, phases/04-computer-vision/27-multi-object-tracking/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 每个片段的帧数 T | 8、16、32 或 64 | T 更大时，信号和计算都更多 |
| `time_kernel` | 3 | 膨胀后的权重除以它 |
| NeRF 的 `L` | 10 | 方向用 `L_dir=4` |
| 每条射线的采样数 | 64 | t 从 2.0 到 6.0 |
| 球谐阶数 | 3 | 每个通道 16 个系数，共 48 个浮点数 |
| 3DGS 迭代次数 | 约 30,000 | 从约 100k 个 Gaussian 增长到 1-5M |
| 跟踪器的 `iou_threshold` | 0.3 | 配合 `max_age=5` |
| Delta 阈值 | 1.25 | 误差在 25% 以内的像素所占比例 |

## 排障
type: troubleshooting
from: phases/04-computer-vision/12-video-understanding/docs/en.md, phases/04-computer-vision/13-3d-vision-nerf/docs/en.md, phases/04-computer-vision/26-monocular-depth/docs/en.md, phases/04-computer-vision/27-multi-object-tracking/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| "Open door" 等于 "close door" | 时间池化与顺序无关 | 改用 3D 卷积或 (2+1)D |
| 膨胀后 BN 坏了 | 权重没有缩放 | 除以 `time_kernel` |
| NeRF 看起来模糊 | 没有位置编码 | 加上 Fourier 特征 |
| 顺序对了，米数不对 | 用了相对深度模型 | 换度量模型，并加上内参 |
| 玻璃和镜子上的深度不对 | 反射表面 | 不要相信这些像素 |
| MiDaS 输出的 AbsRel 很高 | 尺度和偏移没有对齐 | 先做 `align_scale_shift` |
| 人群附近出现 ID 切换 | 只靠 IoU 做关联 | ByteTrack 的第二轮，或者用 ReID |
| 短暂遮挡后轨迹丢失 | 没有运动模型 | 加上一步 Kalman 预测 |

## 问题
type: qa
span: 2
from: phases/04-computer-vision/12-video-understanding/docs/en.md, phases/04-computer-vision/22-3d-gaussian-splatting/docs/en.md, phases/04-computer-vision/26-monocular-depth/docs/en.md, phases/04-computer-vision/27-multi-object-tracking/docs/en.md

- **为什么 3DGS 能达到 NeRF 的质量？** 两者用的是同一个合成方程。
- **为什么从 2D + 池化开始？** 它能复用 ImageNet 的权重。结果往往落在 5-10 分以内。
- **用哪个跟踪指标？** IDF1 用来分清是谁。HOTA 用于体育和对比。
- **一张图像给不出什么？** 没有内参就没有绝对尺度，也给不出被遮挡的几何。
- **为什么保留低置信度的框？** ByteTrack 用它们做第二轮匹配。这样能找回短暂的遮挡。
