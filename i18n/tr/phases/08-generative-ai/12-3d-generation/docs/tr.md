# 3D Nesli

> 3D, 2D-den 3D'ye en güçlü modalitedir. 2023 yılının ilk gelişimi 3D Gaussian Splating'dir. 2024-2026 yıllarının üretim biçimi ilerliyor.

**Type:** Learn
**Languages:** Python
**先修要求:**4. aşama (görünüş), 8. aşama · 07 (Latent Diffusion)
**Time:** ~45 minutes

## 问题

3D  içerik çok zor işlenir:

- **表示。**Meshler, nokta bulutları, vokel ağları, imzalanan mesafe alanları (SDF) neural ışın alanları (NeRF) 3 boyutlu Gaussians──
- **数据稀缺。**ImageNet'in 14M 张图像──最大的干净 3D 数据集(Objaverse-XL, 2023) yaklaşık 10M 个物体, bunların çoğu daha düşük质量──
- **内存。**Bir 5123 voksel şebekesi 128M voksel var; kullanılabilir bir sahne NeRF 1M örnek/ışın gerektirir.
- **监督。**2 boyutlu görüntüler için, pikseller vardır. 3 boyutlu görüntüler için genellikle 2 boyutlu görüntülerin sayısı azdır.

2026 yılının yığınını Bu iki sorunu ayırın. İlk adım, Diffusion modeli ile * 2D çok görüntü görüntülerini * 2 adım, bu görüntüleri bir * 3D temsil biçimi * * genellikle Gaussian splating olarak oluşturun.

## 概念

![3D generation: multi-view diffusion + 3D reconstruction](../assets/3d-generation.svg)

### 3: 3D Gaussian Splatting (Kerbl et al., 2023)

Szeneni yaklaşık 1M 个 3D Gaussians 组成的云──每个有 59 个参数:位置 (3) ‧covariance (6,或四角体 4 + 尺度 3) ‧opacity (1) ‧spherical-harmonics color(度 3 时为 48,度 0 时为 3) ‖ olarak gösterir.

Rendering = projeksiyon + alfa-kompozisyonu──快(4090 上 1080p 约100 fps)──可微──通过 Gradient Descent对地面真相拟合──一个场景可在消费级 GPU 上用5-30分完成拟合──

2023-2024'te iki yenilik:
- **Generative Gaussian splats。**LGM、LRM、InstantMesh 等 model doğrudan bir veya birkaç görüntüden Gaussian bulut öngörüsü
- **4D Gaussian Splatting。**带有每框对冲的Gaussians,动态场景的使用──

### Çok görüntüli yayılma

Net ayarlama, bir pre-training image Diffusion modelini, tek bir metin anında veya tek bir resimden aynı nesnenin çok sayıda uyumlu görüş açısını oluşturabilmesini sağlar. Zero123 (Liu ve diğerleri, 2023) MVDream (Shi ve diğerleri, 2023) SV3D (Stability, 2024) CAT3D (Google, 2024) ◊ genellikle nesnenin çevresinde 4-16 个 görüş çıkarır, Gaussian splating veya NeRF kaldırımı ile 3D'ye kadar yeniden çıkarır.

### Metin--3D boru hattı

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

2025-2026 方向: Adapt Game Engines 、带 PBR materyallerinin doğrudan metin-a-mesh modelleri── Genel nesne için,Multi-view difüsiyon 中间步骤 halen performansın en iyi biçimi──

### NeRF(背景)

Nöral Radyans Alanı (Mildenhall et al., 2020) ∼一个小型 MLP 接收 `(x, y, z, view direction)`Ve çıkış`(color, density)`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊                                                                                                                                                                                                        


```figure
v4-3d-multiview
```

## Yapın onu.

`code/main.py`实现一个玩具版 2D Gaussian splating 拟合:把一个合成目标图像(平滑梯度) olarak gösterilmiştir 2D Gaussian splats 的和──通过 Gradient Descent 优化位置、色 和 covariances,以匹配目标──你会看到两个核心操作:前面 rendering(splat + alpha-composite) 和通过 Gradient Descent 拟合──

### 步骤 1: 2D Gaussian splat

```python
def gaussian_at(x, y, gaussian):
    px, py = gaussian["pos"]
    sigma = gaussian["sigma"]
    d2 = (x - px) ** 2 + (y - py) ** 2
    return math.exp(-d2 / (2 * sigma * sigma))
```

### 2 adım: 累加 spots   染

```python
def render(image_size, gaussians):
    img = [[0.0] * image_size for _ in range(image_size)]
    for g in gaussians:
        for y in range(image_size):
            for x in range(image_size):
                img[y][x] += g["color"] * gaussian_at(x, y, g)
    return img
```

Gerçek 3D Gaussian splating 会按深度对Gaussian 排序,并按顺序 alfa-komposite──我们的2D玩具版本只是求和──

### 步骤 3: Gradient Descent ile 拟合

```python
for step in range(steps):
    pred = render(size, gaussians)
    loss = mse(pred, target)
    gradients = compute_grads(pred, target, gaussians)
    update(gaussians, gradients, lr)
```

## 陷

- **View inconsistency。**Eğer bağımsız olarak 4 görüş üretirseniz, bunlar nesnelerin yapısına yönelik yargılamalar arasında uyumsuzluklar oluşursa,3D 拟合会变模糊──修复:使用带共享关注的多视频扩散──
- **Back-side hallucination。**单图像 → 3D 必须想象看不见的一侧――质量差异极大――
- **Gaussian splat explosion。**无约束训练会增长到10M spots并过拟合──Densification + pruning heuristics(来自3D-GS 原论文) 是必要──
- **Topology issues。**İstihbarat alanlarının (SDF) ağları genellikle delikler veya kendi kendine kesişmeler vardır.
- **训练数据许可。**Objaverse'ın lisansı 混杂; ticari kullanım modelleri için farklıdır.

## Kullan

| Task | 2026 pick |
|------|-----------|
| 从照片进行场景重建 | Gaussian splatting (3DGS, Gsplat, Scaniverse) |
| 面向游戏的 Text-to-3D object | Meshy 4 or Rodin Gen-1.5 (PBR output) |
| Image-to-3D | Hunyuan3D 2.0, TripoSR, InstantMesh |
| 从少量图像进行 Novel-view synthesis | CAT3D, SV3D |
| 动态场景重建 | 4D Gaussian Splatting |
| Avatar / clothed human | Gaussian Avatar, HUGS |
| Research / SOTA | 上周刚发布的任何东西 |

Oyun veya e-ticaret boru hattında 3D üretim sınıfı: Meshy 4 veya Rodin Gen-1.5 için 输出可直接进入 Unity / Unreal 的 PBR mesh──

## - Söyle.

保存 `outputs/skill-3d-pipeline.md` Bilik 接收一个3D简介(输入:文字 / one image / few images;输出: mesh / splat / NeRF;使用: render / game / VR),并输出:pipeline(multi-view diffusion + fit,或 direct mesh model)

## 练习

1. **Easy。**4/1664 Gaussian kullanıyor.`code/main.py`❖ son MSE vs hedef raporı
2. **Medium。**扩展为色 Gaussians (RGB) 』确认重建匹配目标色模式──
3. **Hard。**Gsplat veya Nerfstudio kullanın, 50 fotoğraf çekiminden 重建真实物──報告適合時間 和持久的 views 上的最終SSIM──

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

## 生产备注:3D paylaşılan altyapı yok

İzleme ile video arasında farklılıklar var.

- **NeRF / triplane。**İnferans ise ışın gösterimi + Her örnek bir kez MLP ileri.
- **Multi-view diffusion + LRM reconstruction。**两阶段管道──Stage 1(multi-view DiT) 是和 Lesson 07 一样 Diffusion server──Stage 2(LRM transformator) 是对 views 的一次性前进通过──整体延迟配置是diffusion + one-shot,因此按阶段选择服务原始的──
- **SDS / DreamFusion。**Aset başına optimizasyon, sonuç değil, iş yapma, istek işleyicileri değil.

 2026  ürünlerinin çoğu için,                                                                                                                                                                                                                                                          

## 延伸阅读
- [Mildenhall et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields](https://arxiv.org/abs/2003.08934)NeRF.
- [Kerbl et al. (2023). 3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://arxiv.org/abs/2308.04079)3DGS.
- [Poole et al. (2022). DreamFusion: Text-to-3D using 2D Diffusion](https://arxiv.org/abs/2209.14988) SDS。
- [Liu et al. (2023). Zero-1-to-3: Zero-shot One Image to 3D Object](https://arxiv.org/abs/2303.11328) Zero123。
- [Shi et al. (2023). MVDream](https://arxiv.org/abs/2308.16512) çok görüntülü yayılma。
- [Hong et al. (2023). LRM: Large Reconstruction Model for Single Image to 3D](https://arxiv.org/abs/2311.04400) LRM。
- [Gao et al. (2024). CAT3D: Create Anything in 3D with Multi-View Diffusion Models](https://arxiv.org/abs/2405.10314) CAT3D
- [Stability AI (2024). Stable Video 3D (SV3D)](https://stability.ai/research/sv3d)- SV3D.
