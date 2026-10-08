# Generación 3D

> 3D es la modalidad más fuerte de 2D a 3D. La ruptura del año 2023 es la generación de 3D Gaussian Splating.

**Type:** Learn
**Languages:** Python
**先修要求:**Fase 4 (Visión), Fase 8 · 07 (Difusión latente)
**Time:** ~45 minutes

##  problemas

3D  contenido muy difícil de procesar:

- **表示。**Las redes de nubes de puntos, las redes de voxel, los campos de distancia señalados (SDF) y los campos de radiación neuronal (NeRF) han sido objeto de una serie de experimentaciones en el campo de la galaxia.
- **数据稀缺。**ImageNet tiene 14M 张图像──最大干净 3D 数据集(Objaverse-XL, 2023) Hay aproximadamente 10M 个物体, de los cuales la mayoría es de menor calidad──
- **内存。**Una red de 5123 voxel tiene 128M voxel; una escena disponible NeRF  necesita 1M muestras/ray──producir比重建更难──
- **监督。**Para las imágenes 2D, tienes píxeles. Para las 3D, normalmente sólo tienes una pequeña cantidad de vistas 2D, y tienes que elevar hasta 3D.

La pila de 2026 años Coloca estos dos problemas separados. Primer paso, con el modelo de difusión para producir imágenes multivistas en 2D. Segundo paso, coloca estas imágenes en una representación en 3D.

## 概念

![3D generation: multi-view diffusion + 3D reconstruction](../assets/3d-generation.svg)

### Indicar: 3D Gaussian Splatting (Kerbl et al., 2023)

Colocar un escenario en torno a 1M de Gaussianos 3D formados por nubes. Cada uno tiene 59 parámetros: posición (3); covariancia (6, o cuaternion 4 + escala 3); opacidad (1); color de armonía esférica; grado 3 时为 48, grado 0 时为 3);

Rendering = proyección + composición alfa──快(4090 上 1080p 约 100 fps)──可微──通过 Gradient Descent para fotos de la verdad de la tierra 拟合──一个场景可在消费级 GPU 上用5-30分钟完成拟合──

Sus dos principales 2023-2024 创新:
- **Generative Gaussian splats。**LGM、LRM、InstantMesh etc. Modelo directamente desde una o varias imágenes de la nube gaussiana.
- **4D Gaussian Splatting。**带有 per-frame offsets de Gaussians, para el uso en escenarios de movimiento

### Difusión de múltiples visualizaciones

Una imagen de difusión de un modelo de formación previa, que permite generar múltiples puntos de vista de un mismo objeto desde un texto rápido o una sola imagen. Zero123 (Liu et al., 2023) MVDream (Shi et al., 2023) SV3D (Stability, 2024) CAT3D (Google, 2024)

### Línea de conducción de texto a 3D

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

2025-2026 方向: Adaptado a motores de juego de 、带 PBR materiales de modelos de texto directo a malla── para objetos generales, la difusión de múltiples visuales, entre etapas sigue siendo la mejor combinación de la muestra──

### NeRF(背景)

Campo de radiación neuronal (Mildenhall et al., 2020) ― un pequeño MLP 接收 `(x, y, z, view direction)`Y la salida`(color, density)` A través de rayos 积分 se realiza renderización ∙质量上优于基于网的小说视觉合成, pero renderización 速度慢100-1000倍──对大多数实时用途已被Gaussian splatting 取代,但在研究中仍占主导──


```figure
v4-3d-multiview
```

## Construirlo

`code/main.py`实现 una versión de juguete 2D Gaussian splating 拟合:把一个合成目标图像(平滑梯度) se refiere a 2D Gaussian splats of和──通过 Gradient Descent 优化位置、颜色 和 covariances,以匹配目标──你会看到两个核心操作:前面 render(splat + alpha-composite) 和通过 Gradient Descent 拟合──

### 步骤 1: 2D esplata de Gaussian

```python
def gaussian_at(x, y, gaussian):
    px, py = gaussian["pos"]
    sigma = gaussian["sigma"]
    d2 = (x - px) ** 2 + (y - py) ** 2
    return math.exp(-d2 / (2 * sigma * sigma))
```

### Paso 2: por medio de los puntos de acumulación  

```python
def render(image_size, gaussians):
    img = [[0.0] * image_size for _ in range(image_size)]
    for g in gaussians:
        for y in range(image_size):
            for x in range(image_size):
                img[y][x] += g["color"] * gaussian_at(x, y, g)
    return img
```

Real 3D Gaussian Splatting 会按深度对Gaussian 排序,并按顺序 alfa-composite── nuestra versión 2D de juguete 只是求和──

### Paso 3: con Descenso Gradiente 拟合

```python
for step in range(steps):
    pred = render(size, gaussians)
    loss = mse(pred, target)
    gradients = compute_grads(pred, target, gaussians)
    update(gaussians, gradients, lr)
```

## 陷

- **View inconsistency。**Si independientemente se producen 4 puntos de vista, mientras que no coinciden en los juicios de la estructura del objeto,3D 拟合会变模糊──修复:使用带分享关注的多视频扩散──
- **Back-side hallucination。**单图像 → 3D 必须想象看不见的一侧――质量差异极大――
- **Gaussian splat explosion。**无约束训练会增长到10M spots并过拟合──Densificación + heurística de poda(proveniente de 3D-GS
- **Topology issues。**Las redes de campos implícitos (SDF) suelen tener agujeros o intersecciones propias.
- **训练数据许可。**Licencia de Objaverse 混杂; uso comercial en modelos而异──

## Usalo

| Task | 2026 pick |
|------|-----------|
| 从照片进行场景重建 | Gaussian splatting (3DGS, Gsplat, Scaniverse) |
| 面向游戏的 Text-to-3D object | Meshy 4 or Rodin Gen-1.5 (PBR output) |
| Image-to-3D | Hunyuan3D 2.0, TripoSR, InstantMesh |
| 从少量图像进行 Novel-view synthesis | CAT3D, SV3D |
| 动态场景重建 | 4D Gaussian Splatting |
| Avatar / clothed human | Gaussian Avatar, HUGS |
| Research / SOTA | 上周刚发布的任何东西 |

对于在游戏或电子商务管道中发布生产级 3D:Meshy 4或Rodin Gen-1.5 输出可直接进入 Unity / Unreal 的 PBR网

##  entregarlo

保存 `outputs/skill-3d-pipeline.md`Habilidad de recibir un resumen en 3D (input: text / one image / few images; output: mesh / splat / NeRF; use: render / game / VR),并输出: pipeline (difusión de múltiples visualizaciones + fit, o modelo de malla directa)

##  ejercicios

1. **Easy。**Usó 4 16 64 Gaussians 运行 `code/main.py` Report final MSE vs objetivo
2. **Medium。**扩展为 color Gaussians (RGB) ――确认重建匹配目标色图案──
3. **Hard。**Utiliza gsplat o Nerfstudio, desde 50 fotos de captura 重建真实物体──报告适时 和持久的视图 上的最终SSIM──

## 关键术语: "El hombre es un hombre"
| Term | 人们怎么说 | 它实际意味着什么 |
|------|------------|------------------|
| 3D Gaussian Splatting | "3DGS" | 把场景作为 3D Gaussians 的 cloud；可微的 alpha-composite render。 |
| NeRF | "Neural radiance field" | 在 3D point 输出 color + density 的 MLP；通过 ray integration render。 |
| Triplane | "Three 2-D planes" | 把 3D 分解成三个 2-D axis-aligned feature grids；比 volumetric 更便宜。 |
| SDS | "Score distillation sampling" | 使用 2D-diffusion score 作为 pseudo-Gradient 来训练 3D model。 |
| Multi-view diffusion | "Many views at once" | 输出一批一致 camera views 的 Diffusion model。 |
| PBR | "Physically-based rendering" | 具有 albedo、roughness、metallic、normal channels 的 material。 |
| Densification | "Grow splats" | 3DGS 训练 heuristic：在高 Gradient 区域 split / clone splats。 |

## Productos de la planta: 3D no tiene sustrato compartido

Diferente a la imagen: la difusión latente + DiT) y el video: el 3D del año 2026 todavía no tiene un solo tiempo de ejecución.

- **NeRF / triplane。**Inferencia es marcado de rayos + Cada muestra una vez MLP hacia adelante― una vez 5122 renderización  necesita millones de veces MLP hacia adelante― muestras de rayos de lote activo; SDPA/xformers 适用―
- **Multi-view diffusion + LRM reconstruction。**两阶段管道。Stage 1(multi-view DiT) 是和 Lesson 07 一样 Diffusion server。Stage 2(LRM transformador) 是对 views的一次性前传――整体延迟配置是diffusion + one-shot,因此必须按阶段选择服务原始的──
- **SDS / DreamFusion。**Optimización por activo, no es inferencia, sino gestión de solicitudes.

Para la mayoría de los productos de 2026, la respuesta correcta es que se ejecute un modelo de difusión de múltiples visualizaciones según lo solicitado, de forma gradual se reconstruye hasta 3DGS, y el servicio 3DGS se utiliza para ver en tiempo real. Esto dividirá la carga de trabajo en servidores de interferencia GPU (GPU) y optimizador fuera de línea (OFFLINE) entre:

## 延伸阅读
- [Mildenhall et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields](https://arxiv.org/abs/2003.08934) NeRF。
- [Kerbl et al. (2023). 3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://arxiv.org/abs/2308.04079)¿Qué es eso?
- [Poole et al. (2022). DreamFusion: Text-to-3D using 2D Diffusion](https://arxiv.org/abs/2209.14988) SDS。
- [Liu et al. (2023). Zero-1-to-3: Zero-shot One Image to 3D Object](https://arxiv.org/abs/2303.11328) Zero123。
- [Shi et al. (2023). MVDream](https://arxiv.org/abs/2308.16512) difusión de múltiples vistas。
- [Hong et al. (2023). LRM: Large Reconstruction Model for Single Image to 3D](https://arxiv.org/abs/2311.04400) LRM。
- [Gao et al. (2024). CAT3D: Create Anything in 3D with Multi-View Diffusion Models](https://arxiv.org/abs/2405.10314) CAT3D
- [Stability AI (2024). Stable Video 3D (SV3D)](https://stability.ai/research/sv3d) SV3D。
