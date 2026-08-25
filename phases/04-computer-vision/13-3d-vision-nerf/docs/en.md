# 3D Vision — Point Clouds & NeRFs

> 3D vision 有两种形式。Point cloud 是 sensor 的原始输出。NeRF 是学习得到的 volumetric field。两者都回答“空间中哪里有什么”。

**类型：** Learn + Build
**语言：** Python
**先修：** Phase 4 Lesson 03 (CNNs), Phase 1 Lesson 12 (Tensor Operations)
**时间：** ~45 分钟

## 学习目标
- 区分显式（point cloud、mesh、voxel）和隐式（signed distance field、NeRF）3D representations，并理解各自适用场景
- 理解 PointNet 的 symmetric-function 技巧：它如何让 Neural Network 对无序点集具备 permutation-invariant 性质
- 追踪 NeRF forward pass：ray casting、volumetric rendering、positional encoding、MLP density+colour head
- 使用 `nerfstudio` 或 `instant-ngp` 基于少量带 pose 的图像进行 pretrained 3D reconstruction

## 问题
Camera 产生 2D image。LIDAR 产生一组没有顺序的 3D points。Structure-from-motion pipeline 产生稀疏的 3D keypoints cloud。NeRF 可以从少量带 pose 的图像重建完整 3D scene。这些都属于“vision”，但它们都不像 CNN 想要的 dense tensor。

3D vision 很重要，因为几乎所有高价值 robot task 都在 3D 中运行：grasping、obstacle avoidance、navigation、AR occlusion、3D content capture。只理解 2D images 的 vision engineer，会被排除在该领域增长最快的部分之外（AR/VR content、robotics、autonomous driving stacks、用于 real-estate 或 construction 的 NeRF-based 3D reconstruction）。

这两类 representations 因不同原因占据主导。Point clouds 是 sensor 免费给你的东西。NeRFs 及其后继者（3D Gaussian splatting、neural SDFs）是你要求 Neural Network 学习一个 scene 时得到的东西。

## 概念
### Point clouds

Point cloud 是 R^3 中 N 个点的无序集合，每个点可选地带有 features（colour、intensity、normal）。

```
cloud = [
  (x1, y1, z1, r1, g1, b1),
  (x2, y2, z2, r2, g2, b2),
  ...
  (xN, yN, zN, rN, gN, bN),
]
```

没有 grid，没有 connectivity。两个性质让这对 Neural Network 来说很困难：

- **Permutation invariance** — 输出不能依赖点的顺序。
- **Variable N** — 单个 model 必须能处理不同大小的 clouds。

PointNet (Qi et al., 2017) 用一个想法解决了两者：对每个点应用 shared MLP，然后用 symmetric function（max pool）聚合。结果是一个固定大小的 Vector，并且不依赖顺序。

```
f(P) = max_{p in P} MLP(p)
```

这就是 PointNet 的整个核心。更深的变体（PointNet++、Point Transformer）加入了 hierarchical sampling 和 local aggregation，但 symmetric-function 技巧保持不变。

### The PointNet architecture

```mermaid
flowchart LR
    PTS["N points<br/>(x, y, z)"] --> MLP1["shared MLP<br/>(64, 64)"]
    MLP1 --> MLP2["shared MLP<br/>(64, 128, 1024)"]
    MLP2 --> MAX["max pool<br/>(symmetric)"]
    MAX --> FEAT["global feature<br/>(1024,)"]
    FEAT --> FC["MLP classifier"]
    FC --> CLS["class logits"]

    style MLP1 fill:#dbeafe,stroke:#2563eb
    style MAX fill:#fef3c7,stroke:#d97706
    style CLS fill:#dcfce7,stroke:#16a34a
```

“Shared MLP”表示同一个 MLP 独立地运行在每个点上。为了效率，通常实现为沿 point dimension 的 1x1 conv。

### Neural Radiance Fields (NeRFs)

NeRFs (Mildenhall et al., 2020) 提出问题：“我们能否从 N 张照片重建一个 3D scene？”它的回答是：用一个本身就是 scene 的 Neural Network。该 network 将 `(x, y, z, viewing_direction)` 映射到 `(density, colour)`。渲染新视角就是一个围绕该 network 的 ray-casting 循环。

```
NeRF MLP:  (x, y, z, theta, phi) -> (sigma, r, g, b)

To render a pixel (u, v) of a new view:
  1. Cast a ray from the camera through pixel (u, v)
  2. Sample points along the ray at distances t_1, t_2, ..., t_N
  3. Query the MLP at each point
  4. Composite the colours weighted by (1 - exp(-sigma * dt))
  5. The sum is the rendered pixel colour
```

Loss 会将渲染出的 pixel 与训练照片中的 ground-truth pixel 进行比较。通过 rendering step 做 Backprop 来更新 MLP。没有 3D ground truth，没有显式 geometry — scene 存储在 MLP weights 中。

### NeRF 中的 Positional encoding

作用在 `(x, y, z)` 上的 vanilla MLP 无法表示高频细节，因为 MLPs 在频谱上偏向低频。NeRF 通过在送入 MLP 前，将每个 coordinate 编码成 Fourier feature Vector 来修正这一点：

```
gamma(p) = (sin(2^0 pi p), cos(2^0 pi p), sin(2^1 pi p), cos(2^1 pi p), ...)
```

最高到 L=10 个 frequency levels。这与 transformers 用于 positions 的技巧相同，也会在 diffusion time conditioning（Lesson 10）中再次出现。没有它，NeRFs 看起来会很模糊。

### Volumetric rendering

```
C(r) = sum_i T_i * (1 - exp(-sigma_i * delta_i)) * c_i

T_i  = exp(- sum_{j<i} sigma_j * delta_j)
delta_i = t_{i+1} - t_i
```

`T_i` 是 transmittance，也就是有多少光能到达点 i。`(1 - exp(-sigma_i * delta_i))` 是点 i 处的 opacity。`c_i` 是 colour。最终 pixel 是沿 ray 的加权和。

### What replaced NeRFs

纯 NeRFs 训练慢（数小时），渲染也慢（每张图数秒）。此后的发展脉络如下：

- **Instant-NGP** (2022) — hash-grid encoding 替代 MLP 的 position input；数秒内完成训练。
- **Mip-NeRF 360** — 处理 unbounded scenes 和 anti-aliasing。
- **3D Gaussian Splatting** (2023) — 用数百万个 3D Gaussians 替代 volumetric field；数分钟训练，实时渲染。当前生产环境的默认选择。

2026 年几乎所有真实 NeRF product 实际上都是 3D Gaussian splatting。心智模型仍然是 NeRF。

### Datasets and benchmarks

- **ShapeNet** — 将 3D CAD models 作为 point clouds 进行 classification 和 segmentation。
- **ScanNet** — 用于 segmentation 的真实室内 scans。
- **KITTI** — 用于 autonomous driving 的户外 LIDAR point clouds。
- **NeRF Synthetic** / **Blended MVS** — 用于 view synthesis 的 posed-image datasets。
- **Mip-NeRF 360** dataset — unbounded real scenes。

```figure
nerf-rays
```

## 构建它
### 步骤 1： PointNet classifier

```python
import torch
import torch.nn as nn

class PointNet(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.mlp1 = nn.Sequential(
            nn.Conv1d(3, 64, 1),    nn.BatchNorm1d(64),   nn.ReLU(inplace=True),
            nn.Conv1d(64, 64, 1),   nn.BatchNorm1d(64),   nn.ReLU(inplace=True),
        )
        self.mlp2 = nn.Sequential(
            nn.Conv1d(64, 128, 1),  nn.BatchNorm1d(128),  nn.ReLU(inplace=True),
            nn.Conv1d(128, 1024, 1), nn.BatchNorm1d(1024), nn.ReLU(inplace=True),
        )
        self.head = nn.Sequential(
            nn.Linear(1024, 512),   nn.BatchNorm1d(512),  nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(512, 256),    nn.BatchNorm1d(256),  nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        # x: (N, 3, num_points) — transposed for Conv1d
        x = self.mlp1(x)
        x = self.mlp2(x)
        x = torch.max(x, dim=-1)[0]       # (N, 1024)
        return self.head(x)

pts = torch.randn(4, 3, 1024)
net = PointNet(num_classes=10)
print(f"output: {net(pts).shape}")
print(f"params: {sum(p.numel() for p in net.parameters()):,}")
```

约 1.6M parameters。每个 cloud 运行在 1,024 个点上。

### 步骤 2： Positional encoding

```python
def positional_encoding(x, L=10):
    """
    x: (..., D) -> (..., D * 2 * L)
    """
    freqs = 2.0 ** torch.arange(L, dtype=x.dtype, device=x.device)
    args = x.unsqueeze(-1) * freqs * 3.141592653589793
    sinc = torch.cat([args.sin(), args.cos()], dim=-1)
    return sinc.reshape(*x.shape[:-1], -1)

x = torch.randn(5, 3)
y = positional_encoding(x, L=10)
print(f"input:  {x.shape}")
print(f"encoded: {y.shape}     # (5, 60)")
```

乘以 `2^l * pi` 会得到逐步更高的 frequencies。

### 步骤 3： Tiny NeRF MLP

```python
class TinyNeRF(nn.Module):
    def __init__(self, L_pos=10, L_dir=4, hidden=128):
        super().__init__()
        self.L_pos = L_pos
        self.L_dir = L_dir
        pos_dim = 3 * 2 * L_pos
        dir_dim = 3 * 2 * L_dir
        self.trunk = nn.Sequential(
            nn.Linear(pos_dim, hidden), nn.ReLU(inplace=True),
            nn.Linear(hidden, hidden),  nn.ReLU(inplace=True),
            nn.Linear(hidden, hidden),  nn.ReLU(inplace=True),
            nn.Linear(hidden, hidden),  nn.ReLU(inplace=True),
        )
        self.sigma = nn.Linear(hidden, 1)
        self.color = nn.Sequential(
            nn.Linear(hidden + dir_dim, hidden // 2), nn.ReLU(inplace=True),
            nn.Linear(hidden // 2, 3), nn.Sigmoid(),
        )

    def forward(self, x, d):
        x_enc = positional_encoding(x, self.L_pos)
        d_enc = positional_encoding(d, self.L_dir)
        h = self.trunk(x_enc)
        sigma = torch.relu(self.sigma(h)).squeeze(-1)
        rgb = self.color(torch.cat([h, d_enc], dim=-1))
        return sigma, rgb

nerf = TinyNeRF()
x = torch.randn(128, 3)
d = torch.randn(128, 3)
s, c = nerf(x, d)
print(f"sigma: {s.shape}   rgb: {c.shape}")
```

与原始 NeRF（有 2 个深度为 8 的 MLP trunks）相比非常小。足以演示 architecture。

### 步骤 4： Volumetric rendering along a ray

```python
def volumetric_render(sigma, rgb, t_vals):
    """
    sigma: (..., N_samples)
    rgb:   (..., N_samples, 3)
    t_vals: (N_samples,) distances along the ray
    """
    delta = torch.cat([t_vals[1:] - t_vals[:-1], torch.full_like(t_vals[:1], 1e10)])
    alpha = 1.0 - torch.exp(-sigma * delta)
    trans = torch.cumprod(torch.cat([torch.ones_like(alpha[..., :1]), 1.0 - alpha + 1e-10], dim=-1), dim=-1)[..., :-1]
    weights = alpha * trans
    rendered = (weights.unsqueeze(-1) * rgb).sum(dim=-2)
    depth = (weights * t_vals).sum(dim=-1)
    return rendered, depth, weights


N = 64
t_vals = torch.linspace(2.0, 6.0, N)
sigma = torch.rand(N) * 0.5
rgb = torch.rand(N, 3)
rendered, depth, weights = volumetric_render(sigma, rgb, t_vals)
print(f"rendered colour: {rendered.tolist()}")
print(f"depth:           {depth.item():.2f}")
```

一条 ray，64 个 samples，合成为一个 RGB pixel 和一个 depth。

## 使用它
用于真实工作：

- `nerfstudio` (Tancik et al.) — 当前用于 NeRF / Instant-NGP / Gaussian Splatting 的参考 library。命令行加 web viewer。
- `pytorch3d` (Meta) — differentiable rendering、point-cloud utilities、mesh ops。
- `open3d` — point cloud processing、registration、visualisation。

部署时，3D Gaussian splatting 已基本取代纯 NeRFs，因为它渲染速度快 100 倍。Reconstruction quality 具有可比性。

## 交付它
本课产出：

- `outputs/prompt-3d-task-router.md` — 一个 prompt，会根据 task 和 input data 路由到合适的 3D representation（point cloud、mesh、voxel、NeRF、Gaussian splat）。
- `outputs/skill-point-cloud-loader.md` — 一个 skill，用于编写 PyTorch `Dataset`，加载 .ply / .pcd / .xyz 文件，并进行正确的 normalisation、centring 和 point sampling。

## 练习
1. **（Easy）** 证明 PointNet 是 permutation-invariant：将同一个 cloud 运行两次，一次保持原顺序，一次打乱 points。验证输出除了 floating-point noise 之外完全相同。
2. **（Medium）** 实现一个最小 ray-generation function：给定 camera intrinsics 和 pose，为 H x W image 的每个 pixel 生成 ray origins 和 directions。
3. **（Hard）** 在 coloured cube 的 rendered views 合成 dataset 上训练 TinyNeRF（可通过 differentiable rendering 或简单 ray tracer 生成）。报告 epoch 1、10 和 100 的 rendering loss。Model 在哪个 epoch 产生可识别的 views？

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| Point cloud | “来自 LIDAR 的 3D points” | 无序的 (x, y, z) 集合 + 每个点可选的 features |
| PointNet | “第一个用于 point clouds 的 neural net” | 每个点一个 shared MLP + symmetric (max) pool；结构上天然 permutation-invariant |
| NeRF | “本身就是 scene 的 MLP” | 将 (x, y, z, dir) 映射到 (density, colour) 的 network；通过 ray casting 渲染 |
| Positional encoding | “Fourier features” | 将每个 coordinate 编码为多个 frequencies 下的 sin/cos，以克服 MLP 的低频偏置 |
| Volumetric rendering | “Ray integration” | 使用 transmittance 和 alpha 将 ray 上的 samples 合成为单个 pixel |
| Instant-NGP | “Hash-grid NeRF” | 用 multi-resolution hash grid 替换 NeRF 的 coordinate MLP；快 100-1000 倍 |
| 3D Gaussian splatting | “数百万个 Gaussians” | Scene = 3D Gaussians 的集合；实时渲染，数分钟训练 |
| SDF | “Signed distance field” | 返回到最近 surface 的 signed distance 的 function；另一种 implicit representation |

## 延伸阅读
- [PointNet (Qi et al., 2017)](https://arxiv.org/abs/1612.00593) — permutation-invariant classifier
- [NeRF (Mildenhall et al., 2020)](https://arxiv.org/abs/2003.08934) — 让从照片进行 3D reconstruction 成为 neural-net problem 的论文
- [Instant-NGP (Müller et al., 2022)](https://arxiv.org/abs/2201.05989) — hash grids，1000 倍加速
- [3D Gaussian Splatting (Kerbl et al., 2023)](https://arxiv.org/abs/2308.04079) — 在生产中取代 NeRFs 的 architecture
