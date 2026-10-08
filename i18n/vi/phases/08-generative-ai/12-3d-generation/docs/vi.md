# Tạo 3D

> 3D là phương thức 2D-to-3D 借力最强的模式──2023 năm đột phá là 3D Gaussian Splating──2024-2026 năm của sự phát triển, được lắp đặt trên nó đa hình ảnh phân phối + 3D tái tạo, từ đơn lẻ nhanh hoặc ảnh tạo vật thể và cảnh──

**Type:** Learn
**Languages:** Python
**先修要求:**Giai đoạn 4 (Vision), Giai đoạn 8 · 07 (Làn sóng trôi qua)
**Time:** ~45 minutes

## 问题

3D  nội dung rất khó xử lý:

- **表示。**Các lưới, đám mây điểm, lưới âm thanh, trường đường cách (SDF) ở trường tới thần kinh (NeRF) ở các Gaussians 3D.
- **数据稀缺。**ImageNet có 14M 张图像──最大的干净 3D 数据集(Objaverse-XL, 2023) có khoảng 10M 个物体, trong đó phần lớn chất lượng thấp hơn──
- **内存。**Một lưới 5123 voxel có 128M voxel; một trường hợp có thể sử dụng NeRF  cần 1M mẫu/màn quang.
- **监督。**Đối với hình ảnh 2D, bạn có pixel. Đối với 3D, bạn thường chỉ có một số ít xem 2D, và phải nâng lên 3D.

2026 năm xếp hàng Đặt hai vấn đề này chia rẽ. bước đầu tiên, sử dụng mô hình Diffusion sinh ra hình ảnh đa hình ảnh 2D. bước thứ hai, đưa những hình ảnh này được tạo thành một cách đại diện 3D.

## 概念

![3D generation: multi-view diffusion + 3D reconstruction](../assets/3d-generation.svg)

### biểu hiện:3D Gaussian Splatting (Kerbl et al., 2023)

Hãy cho hình ảnh biểu hiện khoảng 1M 个 3D Gaussians 组成的云──每个有 59 个参数:位置 (3) ‧covariance (6,或四旋翼 4 + thang 3) ‧opacity (1) ‧spherical-harmonics color(度 3 时为 48,度 0 时为 3) ‖

Định dạng = chiếu + alpha-compositing。快(4090 上 1080p 约 100 fps)。可微。通过 Gradient Descent đối với hình ảnh thực tại mặt đất 拟合。一个场景可在消费级 GPU 上用5-30分钟完成拟合。

Hai trong số đó là 2023-2024:
- **Generative Gaussian splats。**LGM、LRM、InstantMesh 等模型 trực tiếp từ một hoặc vài bức ảnh dự đoán đám mây Gaussian。
- **4D Gaussian Splatting。**带有每框 bù đắp của Gaussians, được sử dụng trong động trường cảnh.

### Phân phối nhiều hình ảnh

Phân âm một mô hình phân tán trước khi được đào tạo, giúp nó có thể tạo ra nhiều quan điểm phù hợp của cùng một vật thể từ text prompt hoặc đơn张图像. Zero123 (Liu et al., 2023) MVDream (Shi et al., 2023) SV3D (Stability, 2024) CAT3D (Google, 2024)  thường xuất ra 4-16 个视图, qua Gaussian splating hoặc NeRF lift đến 3D.

### Các đường ống dẫn văn bản đến 3D

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

2025-2026 方向: phù hợp với các động cơ trò chơi 、带 PBR vật liệu mô hình văn bản trực tiếp-to-mesh。 đối với các vật dụng chung, Phân phối đa dạng hiện vẫn là phương pháp tốt nhất để biểu hiện。

### NeRF(背景)

Phân xạ thần kinh (Mildenhall et al., 2020)。 một MLP nhỏ 接收 `(x, y, z, view direction)`Không xuất khẩu`(color, density)`Qua thông qua các tia 积分 được thực hiện rendering. Quality trên tốt hơn so với tổng hợp nhìn mới dựa trên lưới, nhưng rendering  tốc độ chậm 100-1000 lần.


```figure
v4-3d-multiview
```

##  xây dựng nó

`code/main.py`实现一个玩具版 2D Gaussian splating 拟合:把一个合成目标图像(平滑梯度) biểu hiện cho 2D Gaussian splats 的和──通过 Gradient Descent 优化位置、颜色 和 covariances,以匹配目标──你会看到两个核心操作:前面 render(splat + alpha-composite) 和通过 Gradient Descent 拟合──

### 步骤 1: 2D Gaussian splat

```python
def gaussian_at(x, y, gaussian):
    px, py = gaussian["pos"]
    sigma = gaussian["sigma"]
    d2 = (x - px) ** 2 + (y - py) ** 2
    return math.exp(-d2 / (2 * sigma * sigma))
```

### Bước 2: Thông qua các điểm tích lũy  tiến hành 染

```python
def render(image_size, gaussians):
    img = [[0.0] * image_size for _ in range(image_size)]
    for g in gaussians:
        for y in range(image_size):
            for x in range(image_size):
                img[y][x] += g["color"] * gaussian_at(x, y, g)
    return img
```

Thực tế 3D Gaussian Splatting 会按深度对Gaussian 排序,并按顺序 alpha-composite。

### 步骤 3: dùng Gradient Descent 拟合

```python
for step in range(steps):
    pred = render(size, gaussians)
    loss = mse(pred, target)
    gradients = compute_grads(pred, target, gaussians)
    update(gaussians, gradients, lr)
```

## 陷

- **View inconsistency。**Nếu độc lập tạo ra 4 quan điểm, thì chúng không phù hợp với các phán đoán về cấu trúc vật thể,3D 拟合会变模糊──修复: sử dụng với sự phân phối đa quan điểm của sự chú ý chung──
- **Back-side hallucination。**单图像 → 3D 必须想象看不见的一侧――质量差异极大――
- **Gaussian splat explosion。**无约束训练会增长到10M spots并过拟合──Densification + cắt heuristics(来自3D-GS 原论文) là cần thiết──
- **Topology issues。**Các lưới của các trường ngầm (SDF) thường có lỗ hoặc giao lộ chính mình.
- **训练数据许可。**Thỏa thuận của Objaverse 混杂; sử dụng thương mại因模型而异──

## Sử dụng nó

| Task | 2026 pick |
|------|-----------|
| 从照片进行场景重建 | Gaussian splatting (3DGS, Gsplat, Scaniverse) |
| 面向游戏的 Text-to-3D object | Meshy 4 or Rodin Gen-1.5 (PBR output) |
| Image-to-3D | Hunyuan3D 2.0, TripoSR, InstantMesh |
| 从少量图像进行 Novel-view synthesis | CAT3D, SV3D |
| 动态场景重建 | 4D Gaussian Splatting |
| Avatar / clothed human | Gaussian Avatar, HUGS |
| Research / SOTA | 上周刚发布的任何东西 |

Đối với các game hoặc đường ống thương mại điện tử trong phát hành cấp sản xuất 3D: Meshy 4 hoặc Rodin Gen-1.5 输出可直接进入 Unity / Unreal của PBR lưới.

## 交付 nó

保存 `outputs/skill-3d-pipeline.md`Skill 接收一个3D brief(input: text / one image / few images;output: mesh / splat / NeRF;usage: render / game / VR),并输出:pipeline(multi-view diffusion + fit,或 direct mesh model)

## 练习

1. **Easy。**4 16 64 người Gaussia`code/main.py` báo cáo cuối cùng MSE vs mục tiêu
2. **Medium。**扩展为色 Gaussians (RGB) ▽确认重建匹配 mục tiêu màu sắc
3. **Hard。**Sử dụng gsplat hoặc Nerfstudio, từ 50 bức ảnh chụp 重建真实物体──报告适时 和持久的观看 上的最终SSIM──

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

## 生产备注:3D Không còn phân nhựa chia sẻ

Không giống như hình ảnh(sự phân tán laten + DiT) và video(spaceotemporal DiT), năm 2026 3D còn không có một chủ đạo chạy thời gian.

- **NeRF / triplane。**Inference là ray-marking + Mỗi mẫu một lần MLP tiến. Một lần 5122 render cần hàng triệu lần MLP tiến.
- **Multi-view diffusion + LRM reconstruction。**两阶段管道──Stage 1(multi-view DiT) 是和Dition 07 一样 Diffusion server──Stage 2(LRM transformer) 是对 views的一次性前传传──整体延迟配置是diffusion + one-shot,因此必须按阶段选择服务原始的──
- **SDS / DreamFusion。**Tối ưu hóa trên mỗi tài sản, không phải là suy luận, xây dựng công việc, chứ không phải là xử lý yêu cầu.

Đối với hầu hết các sản phẩm năm 2026, câu trả lời chính xác là:  theo yêu cầu vận hành mô hình phân phối đa xem, xẩy ra tái cấu trúc đến 3DGS,并 dịch vụ 3DGS dùng cho xem thực thời gian──

## 延伸阅读
- [Mildenhall et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields](https://arxiv.org/abs/2003.08934) NeRF。
- [Kerbl et al. (2023). 3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://arxiv.org/abs/2308.04079) 3DGS。
- [Poole et al. (2022). DreamFusion: Text-to-3D using 2D Diffusion](https://arxiv.org/abs/2209.14988) SDS。
- [Liu et al. (2023). Zero-1-to-3: Zero-shot One Image to 3D Object](https://arxiv.org/abs/2303.11328) Zero123。
- [Shi et al. (2023). MVDream](https://arxiv.org/abs/2308.16512) Di truyền đa hình ảnh。
- [Hong et al. (2023). LRM: Large Reconstruction Model for Single Image to 3D](https://arxiv.org/abs/2311.04400) LRM。
- [Gao et al. (2024). CAT3D: Create Anything in 3D with Multi-View Diffusion Models](https://arxiv.org/abs/2405.10314) CAT3D
- [Stability AI (2024). Stable Video 3D (SV3D)](https://stability.ai/research/sv3d) SV3D
