---
id: video-3d-generation
title: Video and 3D Generation
code: V3
subtitle: 视频 DiT 的 patch 与分解注意力、世界模型、Gaussian splat、NeRF 与多视图 3D。公式与修复。
hue: 170
sources: phases/08-generative-ai/10-video-generation, phases/08-generative-ai/12-3d-generation, phases/04-computer-vision/22-3d-gaussian-splatting, phases/04-computer-vision/28-world-models-video-diffusion
source_hash: 25b0ab34ed437c9b
---

## 视频扩散流水线
type: architecture
from: phases/08-generative-ai/10-video-generation/docs/en.md, phases/04-computer-vision/28-world-models-video-diffusion/docs/en.md

```arch
node | vid | 1,1 | Video | T frames | client
node | vae | 2,1 | 3D VAE | spatiotemporal compression | model
node | patch | 3,1 | Patchify | t_p, h_p, w_p patches | process
node | txt | 1,2 | Prompt | dense re-captions | client
node | te | 2,2 | Text encoder | T5-XXL | model
node | dit | 3,2 | Video DiT | 3D positions, divided attention | gpu
node | lat | 4,2 | Denoised latent | ε or v prediction | store
node | out | 4,1 | Frames | VAE decode | client
edge | vid | vae |
edge | vae | patch | latent
edge | patch | dit | tokens
edge | txt | te |
edge | te | dit | cross-attention
edge | dit | lat | each step
edge | lat | out |
```

## 渲染并拟合 Gaussian splat
type: flow
from: phases/04-computer-vision/22-3d-gaussian-splatting/docs/en.md

1. **投影**：用相机外参和内参把每个 3D Gaussian 映射到 2D。
2. **分块**：把每个 2D Gaussian 分配到 16x16 屏幕块。
3. **排序**：在每个块内按深度排序 Gaussian。
4. **合成**：从前到后混合进像素颜色。
5. **损失**：把渲染结果与真值照片比较。
6. **反向传播**：用梯度下降更新 `(mu, q, s, alpha, c_lm)`。
7. **稠密化**：在梯度高的地方复制小 Gaussian、拆分大 Gaussian。
8. **剪枝**：去掉低不透明度的 Gaussian。训练约 30,000 次迭代。

## 公式与数字
type: concepts
from: phases/04-computer-vision/22-3d-gaussian-splatting/docs/en.md, phases/04-computer-vision/28-world-models-video-diffusion/docs/en.md, phases/08-generative-ai/10-video-generation/docs/en.md

- **协方差**：$\Sigma = R S S^T R^T$，来自四元数和尺度。
- **投影**：$\Sigma' = J W \Sigma W^T J^T$，一个 2 × 2 协方差。
- **合成**：$C = \sum_i \alpha_i T_i c_i$，其中 $T_i = \prod_{j < i} (1 - \alpha_j)$。NeRF 用同一个方程。
- **SH 颜色**：度数 L 时每个通道有 $(L+1)^2$ 项。度数 3 给出 16 项。
- **Gaussian 大小**：大约 60 个浮点数。五百万个 Gaussian 占用 240 MB。
- **视频 token**：$(T / P_t) \cdot (H / P_h) \cdot (W / P_w)$
- **分解注意力**：$(HW) \cdot T^2 + T \cdot (HW)^2$，而不是 $O((THW)^2)$。
- **原始视频**：10 秒 1080p、24 fps 是 240 帧，大约 1.5 GB。

## 微型视频 DiT
type: annotated-code
lang: python
from: phases/04-computer-vision/28-world-models-video-diffusion/code/main.py, phases/04-computer-vision/28-world-models-video-diffusion/docs/en.md

```python
vid = torch.randn(1, 4, 8, 16, 16)                # (N, C, T, H, W)
model = TinyVideoDiT(in_channels=4, dim=64, depth=2, heads=2)
out, grid = model(vid)                            # grid (4, 8, 8), out (1, 256, 32)
tokens, grid = self.patch(x)                      # Conv3d, stride equals kernel
xt = x.view(n, T, H * W, d).permute(0, 2, 1, 3).reshape(n * H * W, T, d)
a, _ = self.time_attn(self.ln1(xt), self.ln1(xt), self.ln1(xt), need_weights=False)
xs = xt.view(n, T, H * W, d).reshape(n * T, H * W, d)
a, _ = self.space_attn(self.ln2(xs), self.ln2(xs), self.ln2(xs), need_weights=False)
xs = xs + self.mlp(self.ln3(xs))                  # MLP after time and space
```

## 把 2D splat 拟合到图像
type: annotated-code
lang: python
from: phases/04-computer-vision/22-3d-gaussian-splatting/docs/en.md, phases/04-computer-vision/22-3d-gaussian-splatting/code/main.py

```python
model = Splats2D(num_splats=64, image_size=64)
opt = torch.optim.Adam(model.parameters(), lr=0.05)
for step in range(200):
    pred = model((64, 64))                        # rasterise_2d inside
    loss = F.mse_loss(pred, target)
    opt.zero_grad(); loss.backward(); opt.step()
alphas = alphas.clamp(0.0, 0.99)                  # in rasterise_2d
order = torch.argsort(depths)                     # learned depth scalar in 2D
out = out + (T * a)[..., None] * colours_sorted[i][None, None, :]
T = T * (1.0 - a)                                 # transmittance
```

## 课程中的函数
type: task-table
from: phases/04-computer-vision/28-world-models-video-diffusion/code/main.py, phases/04-computer-vision/28-world-models-video-diffusion/docs/en.md, phases/04-computer-vision/22-3d-gaussian-splatting/code/main.py, phases/08-generative-ai/10-video-generation/code/main.py

| 任务 | 代码 |
|---|---|
| 统计视频 token | `count_tokens(T, H, W, p_t=2, p_h=8, p_w=8)` |
| 加入 3D 位置 | `rope_3d(tokens, t_dim, h_dim, w_dim, grid)` |
| 先时间后空间的块 | `DividedAttentionBlock(dim=64, heads=2)` |
| Patch 加时间嵌入 | `patchify_with_pos(noisy)` |
| 测量闪烁 | `frame_deltas(clip)` |
| Gaussian 密度 | `eval_2d_gaussian(means, covs, points)` |
| 构建协方差 | `R @ S @ R.transpose(-1, -2)` |
| 视角相关颜色 | `eval_sh_degree_3(sh_coeffs, dirs)` |

## nerfstudio 与导出
type: command-table
from: phases/04-computer-vision/22-3d-gaussian-splatting/docs/en.md

| 命令 | 作用 |
|---|---|
| `pip install nerfstudio gsplat` | 安装训练器和 CUDA 光栅化器 |
| `ns-download-data example` | 下载示例数据 |
| `ns-train splatfacto --data path/to/data` | 训练 3DGS。RTX 4090 上 10-30 分钟 |
| `.ply` | 原始 Gaussian 点云。可移植，文件最大 |
| `.splat` | 量化格式 |
| `KHR_gaussian_splatting` | glTF 标准，可在查看器间移植 |
| `UsdVolParticleField3DGaussianSplat` | OpenUSD 26.03 schema |

## 3D 表示并列对比
type: comparison
from: phases/08-generative-ai/12-3d-generation/docs/en.md, phases/04-computer-vision/22-3d-gaussian-splatting/docs/en.md
span: 2

| 因素 | NeRF | 3D Gaussian splats | Triplane | Mesh |
|---|---|---|---|---|
| 存储 | MLP 权重 | 显式 Gaussian | 三个 2-D 特征网格 | 表面加 PBR 材质 |
| 渲染 | 射线积分 | 光栅化并 alpha 合成 | 射线行进加 MLP | 游戏引擎 |
| 速度 | 比 mesh 慢 100-1000x | 4090 上 1080p 约 100 fps | LRM 约 5 秒给出一个 | TripoSR 约 1 秒给出一个 |
| 编辑 | 重训 | 移动一部分 Gaussian | 未覆盖 | 出货前重新网格化 |

## 世界模型家族
type: comparison
from: phases/04-computer-vision/28-world-models-video-diffusion/docs/en.md

| 因素 | 视频生成 | 动作条件 | RL 世界模型 |
|---|---|---|---|
| 输入 | 文本或图像 prompt | 过去帧 + 动作 | 状态 + 动作 |
| 输出 | 视频帧 | 下一帧 | 下一 latent + 奖励 |
| 中途操控 | 否 | 是，latent 动作 | 是 |
| 例子 | Sora 2 | Genie 3 | DreamerV3 |

## 代码中的默认值
type: defaults
from: phases/04-computer-vision/28-world-models-video-diffusion/code/main.py, phases/04-computer-vision/22-3d-gaussian-splatting/docs/en.md, phases/04-computer-vision/22-3d-gaussian-splatting/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `patch_t`, `patch_h`, `patch_w` | 2 | `VideoPatch3D` 把 T、H 和 W 减半 |
| `dim` | 64 | Token 宽度 |
| `heads` | 2 | 块里每一次注意力 |
| `count_tokens` 中的 `p_h`、`p_w` | 8 | `p_t` 是 2 |
| `num_splats` | 64 | 代码文件里的 `Splats2D` |
| Adam `lr` | 0.05 | 代码文件用 0.08 |
| Alpha 钳位 | 0.99 | 每个 Gaussian 的上限 |
| 初始 Gaussian | 约 100k | 由 SfM 点播种 |

## 排障
type: troubleshooting
from: phases/08-generative-ai/10-video-generation/docs/en.md, phases/08-generative-ai/12-3d-generation/docs/en.md, phases/04-computer-vision/28-world-models-video-diffusion/code/main.py, phases/04-computer-vision/28-world-models-video-diffusion/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 帧在闪烁 | 每一帧单独采样 | 用注意力或共享噪声把帧耦合起来 |
| 内存耗尽 | 完整 3D 注意力 | 分解成空间和时间 |
| 超过 10 秒的片段会漂移 | 误差累积 | 滑动窗口和关键帧锚点 |
| 物体消失或融合 | 没有持久的物体模型 | 出货前跑物体恒存检查 |
| 3D 拟合模糊 | 各视角对结构意见不一 | 带共享注意力的多视图扩散 |
| 10M 个 splat，过拟合 | 没有稠密化和剪枝控制 | 用稠密化和剪枝启发式 |
| Mesh 有洞 | 隐式场拓扑 | 出货前跑重新网格化 |
| `rope_3d` 里的 `ValueError` | `t_dim+h_dim+w_dim` 不是 D | 把 D 拆到三个轴上 |

## 问题
type: qa
from: phases/04-computer-vision/22-3d-gaussian-splatting/docs/en.md, phases/08-generative-ai/10-video-generation/docs/en.md, phases/08-generative-ai/12-3d-generation/docs/en.md, phases/04-computer-vision/28-world-models-video-diffusion/docs/en.md

- **为什么 3DGS 取代了 NeRF？** 它以 100+ fps 渲染，几分钟训完，还能直接编辑。
- **为什么 3DGS 能达到 NeRF 质量？** 两者积分同一个辐射场方程。
- **服务时限制视频 DiT 的是什么？** 内存带宽，不是 FLOPs。
- **什么最能提升 Sora？** 大约 10x 更详细的标题。
- **2026 年的 3D 栈怎么工作？** 扩散做出多视图图像。然后做一次 3D 拟合，常常是 splat。
- **视频质量怎么量？** 视觉用 FVD，prompt 对齐用每帧 CLIPScore。
