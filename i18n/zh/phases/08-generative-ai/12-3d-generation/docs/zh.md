# 3D 世代

> 3D是2D到3D的最强大的模式.2023年的突破是3D高斯分光.2024-2026年的生成式推进,在此上叠加多视觉扩散+3D重建,从单个提示或照片生成物体和场景.

**Type:** Learn
**Languages:** Python
**先修要求:**光 (光) 转移
**Time:** ~45 minutes

## 问题

3D内容很难处理:

- **表示。**网格,点云,声格网,签名距离场 (SDF) 神经辐射场 (NeRF) 3D高质量.
- **数据稀缺。**图像网有14M张图像──最大的干净3D 数据集(Objaverse-XL, 2023) 有约10M个物体,其中大部分质量较低──
- **内存。**一个5123音符格有128M音符;一个可用的场景NeRF需要1M样本/射线――生成比重建更难――
- **监督。**对于2D图像,你有像素.对于3D,你通常只有一些2D视图,而且必须升到3D.

2026年堆 把这两个问题分开.第一步,使用扩散模型 生成 *2D多视图*──第二步,把这些图像拟合成一种 *3D表示*──通常是高斯的布)──

## 概念

![3D generation: multi-view diffusion + 3D reconstruction](../assets/3d-generation.svg)

### 表示:3D 盖斯斯派特 (Kerbl等, 2023)

设想表示大约1M个3D高质的云.每个有59个参数:位置 (3);共变性 (6,或四四+尺度3);度 (1);圆形和色 (,) 度3 时为 48,度0 时为 3) ⋅

转化 =投影+阿尔法编译──快(4090 上 1080p 约100fps)──可微──通过渐进下降对地面真相图片 拟合──一个场景可在消费级GPU 上使用 5-30 分钟完成拟合──

创新:
- **Generative Gaussian splats。**模型直接从一张或几张图像预测高斯云.
- **4D Gaussian Splatting。**带有每的偏移的高斯人,用于动态场景.

### 多视图传播

细调 一个预训练图像 扩散模型,使其能够从文本提示或单张图像生成相同物体的多个一致视角――零123 (Liu等人, 2023)  MVDream (Shi等人, 2023) 史维3D (稳定, 2024) 卡特3D (谷歌, 2024) 通常输出物体周围的4-16 个视图,再通过高斯式喷或NeRF升降到3D──

### 文字到3D管道

| Model | Input | Output | Time |
|-------|-------|--------|------|
| DreamFusion (2022) | text | NeRF via SDS | 每个 asset ~1 小时 |
| Magic3D | text | mesh + texture | ~40 分钟 |
| Shap-E (OpenAI, 2023) | text | implicit 3D | ~1 分钟 |
| SJC / ProlificDreamer | text | NeRF / mesh | ~30 分钟 |
| LRM (Meta, 2023) | image | triplane | ~5 秒 |
| InstantMesh (2024) | image | mesh | ~10 秒 |
| SV3D (Stability, 2024) | image | novel views | ~2 分钟 |
| CAT3D (Google, 2024) | 1-64 images | 3D NeRF | ~1 分钟 |
| TripoSR (2024) | image | mesh | ~1 秒 |
| Meshy 4 (2025) | text + image | PBR mesh | ~30 秒 |
| Rodin Gen-1.5 (2025) | text + image | PBR mesh | ~60 秒 |
| Tencent Hunyuan3D 2.0 (2025) | image | mesh | ~30 秒 |

2025-2026 方向:适合游戏引擎的、带PBR材料的直接文本到网格模型──对于通用物体,多视频传播中间步骤仍然是表现最好的配方──

### 其他类型

通过网络网络,我们可以通过网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络.`(x, y, z, view direction)`没有输出`(color, density)`通过沿线射线进行染.质量优于基于网格的新视图合成,但染速度慢100-1000倍.


```figure
v4-3d-multiview
```

## 构建它

`code/main.py`实现一个玩具版 2D 高斯分布 拟合:把一个合成目标图像 (平滑梯度) 表示为 2D高斯分布的和.通过渐进下降 优化位置、颜色和覆盖,以匹配目标──你会看到两个核心操作:前进染(平面 + 亚尔法复合) 和通过渐进下降 拟合──

### 步骤 1: 2D高斯

```python
def gaussian_at(x, y, gaussian):
    px, py = gaussian["pos"]
    sigma = gaussian["sigma"]
    d2 = (x - px) ** 2 + (y - py) ** 2
    return math.exp(-d2 / (2 * sigma * sigma))
```

### 步骤2:通过加点染

```python
def render(image_size, gaussians):
    img = [[0.0] * image_size for _ in range(image_size)]
    for g in gaussians:
        for y in range(image_size):
            for x in range(image_size):
                img[y][x] += g["color"] * gaussian_at(x, y, g)
    return img
```

实际的3D高斯人布会按深度对高斯人排序,并按顺序阿尔法复合物――我们的2D玩具版本只是求和――

### 步骤3: 用渐进下降 拟合

```python
for step in range(steps):
    pred = render(size, gaussians)
    loss = mse(pred, target)
    gradients = compute_grads(pred, target, gaussians)
    update(gaussians, gradients, lr)
```

## 陷

- **View inconsistency。**如果独立生成4个观点,而它们对物体结构的判断不一致,3D 拟合会变模糊――修复:使用带共享关注的多视图传播――
- **Back-side hallucination。**单图像 → 3D 必须想象看不见的一面――质量差异极大――
- **Gaussian splat explosion。**无约束训练会增长到10M个空间并过拟合――加密化+剪切演习――来自3D-GS原论文) 是必要的――
- **Topology issues。**来自隐含场 (SDF) 的网格通常有洞或自交点.
- **训练数据许可。**商业用途因模型而异.

## 使用它

| Task | 2026 pick |
|------|-----------|
| 从照片进行场景重建 | Gaussian splatting (3DGS, Gsplat, Scaniverse) |
| 面向游戏的 Text-to-3D object | Meshy 4 or Rodin Gen-1.5 (PBR output) |
| Image-to-3D | Hunyuan3D 2.0, TripoSR, InstantMesh |
| 从少量图像进行 Novel-view synthesis | CAT3D, SV3D |
| 动态场景重建 | 4D Gaussian Splatting |
| Avatar / clothed human | Gaussian Avatar, HUGS |
| Research / SOTA | 上周刚发布的任何东西 |

对于游戏或电子商务管道中发布的生产级3D:Meshy 4或Rodin Gen-1.5 输出可直接进入Unity / Unreal的PBR网.

## 交付它

保存`outputs/skill-3d-pipeline.md`△技能 接收一个3D简介(输入:文本/一张图像/几张图像;输出:网格/斑块/NeRF;使用:染/游戏/VR),并输出:管线(多视频传播+合适或直接网格模型) 、基模型、代预算、拓后处理、所需材料道──

## 练习

1. **Easy。**用4/1664个高斯人运行`code/main.py`△报告最终的MSE对目标
2. **Medium。**扩展为颜色高素 (RGB) 确认重建匹配目标颜色模式
3. **Hard。**使用gsplat或Nerfstudio,从50张照片捕获 重建真实物体――报告适时和持久的视图 上的最终SSIM――

## 关键术语
| Term | 人们怎么说 | 它实际意味着什么 |
|------|------------|------------------|
| 3D Gaussian Splatting | "3DGS" | 把场景作为 3D Gaussians 的 cloud；可微的 alpha-composite render。 |
| NeRF | "Neural radiance field" | 在 3D point 输出 color + density 的 MLP；通过 ray integration render。 |
| Triplane | "Three 2-D planes" | 把 3D 分解成三个 2-D axis-aligned feature grids；比 volumetric 更便宜。 |
| SDS | "Score distillation sampling" | 使用 2D-diffusion score 作为 pseudo-Gradient 来训练 3D model。 |
| Multi-view diffusion | "Many views at once" | 输出一批一致 camera views 的 Diffusion model。 |
| PBR | "Physically-based rendering" | 具有 albedo、roughness、metallic、normal channels 的 material。 |
| Densification | "Grow splats" | 3DGS 训练 heuristic：在高 Gradient 区域 split / clone splats。 |

## 生产备注:3D 还没有共享基板

不同于图像(延迟扩散+DT) 和视频(空间时间DT),2026年3D还没有单一主导运行时间――生产决策树会按表示分叉:

- **NeRF / triplane。**推理是射线行程 + 每个样本 一次MLP前进――一次5122 render 需要数百万次MLP前进――积极批量射线样本;SDPA/xformers 适用――
- **Multi-view diffusion + LRM reconstruction。**两阶段管道. 阶段 1(多视频diT) 是和07课程 一样的传播服务器. 阶段 2(LRM变压器) 是对视频的一次性前进通过.
- **SDS / DreamFusion。**对于资产的优化,不是推断,而不是构建工作,而不是处理请求.

对于大多数2026 产品,正确答案是按要求运行多视频扩散模型,异步重建到3DGS,并服务3DGS 用于实时观看──这将把工作负载清晰分开到GPU-输入服务器(快) 和离线优化器(慢) 之间──

## 延伸阅读
- [Mildenhall et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields](https://arxiv.org/abs/2003.08934)    
- [Kerbl et al. (2023). 3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://arxiv.org/abs/2308.04079) 3DGS──
- [Poole et al. (2022). DreamFusion: Text-to-3D using 2D Diffusion](https://arxiv.org/abs/2209.14988)   
- [Liu et al. (2023). Zero-1-to-3: Zero-shot One Image to 3D Object](https://arxiv.org/abs/2303.11328)零123──
- [Shi et al. (2023). MVDream](https://arxiv.org/abs/2308.16512)多视图传播――
- [Hong et al. (2023). LRM: Large Reconstruction Model for Single Image to 3D](https://arxiv.org/abs/2311.04400) LRM。
- [Gao et al. (2024). CAT3D: Create Anything in 3D with Multi-View Diffusion Models](https://arxiv.org/abs/2405.10314) CAT3D──
- [Stability AI (2024). Stable Video 3D (SV3D)](https://stability.ai/research/sv3d) SV3D──
