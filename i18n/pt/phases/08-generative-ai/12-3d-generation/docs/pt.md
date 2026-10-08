# Geração 3D

> 3D é a modalidade mais forte de 2D-to-3D. A ruptura de 2023 é a 3D Gaussian Splating.

**Type:** Learn
**Languages:** Python
**先修要求:**Fase 4 (Visão), Fase 8 · 07 (Difusão latente)
**Time:** ~45 minutes

## 问题

3D  Conteúdo difícil de processar:

- **表示。**Métodos, nuvens de pontos, redes de voxel, campos de distância assinados (SDFs) campos de radiação neural (NeRFs) Gaussians tridimensionais.
- **数据稀缺。**ImageNet tem 14M 张图像──最大干净 3D 数据集(Objaverse-XL, 2023) tem cerca de 10M 个物体, da maioria menor qualidade──
- **内存。**Uma rede de 5123 voxels tem 128M voxels; uma cena disponível NeRF  necessita de 1M amostras/raios── gerar
- **监督。**Para imagens 2D, você tem pixels. Para 3D, você geralmente tem apenas uma pequena quantidade de visualizações 2D, e você tem que subir para 3D.

Estaca de 2026 ano Coloque estes dois problemas separados. Primeiro passo, usando o modelo de difusão, produzir * 2D imagens multi-visão *2..

## 概念

![3D generation: multi-view diffusion + 3D reconstruction](../assets/3d-generation.svg)

### Indicações: 3D Gaussian Splatting (Kerbl et al., 2023)

Colocar cenários em torno de 1M de Gaussianos 3D compostos de nuvem. Cada um tem 59 parâmetros: posição (3); covariância (6, ou quaternion 4 + escala 3); opacidade (1); cor esférica-harmónica ((grado 3 时为 48, grau 0 时为 3);;

Rendering = projeção + composição alfa──快(4090 上 1080p 约 100 fps)──可微──通过 Gradient Descent para fotos de verdade no solo 拟合──一个场景可在消费级 GPU 上用5-30分钟完成拟合──

As duas principais 2023-2024 创新:
- **Generative Gaussian splats。**LGM、LRM、InstantMesh etc. Modelo diretamente de um ou vários imagens pré-anúncios nuvem Gaussian。
- **4D Gaussian Splatting。**带有 per-frame offsets of Gaussians, para uso em cenários de movimento.

### Difusão de visualização múltipla

A técnica de difusão permite que o modelo de difusão de imagem seja usado para gerar vários pontos de vista do mesmo objeto a partir de um texto rápido ou de uma única imagem. Zero123 (Liu et al., 2023) MVDream (Shi et al., 2023) SV3D (Stability, 2024) CAT3D (Google, 2024)

### Tubos de texto para 3D

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

2025-2026 方向: Adaptada para motores de jogos 、带 PBR materiais de modelos diretos de texto-a-mesca── para objetos gerais, difusão multi-visão 中间步骤 ainda é a melhor combinação para o desempenho──

### NeRF(背景)

Campo de Radiância Neural (Mildenhall et al., 2020) ― um pequeno MLP 接收 `(x, y, z, view direction)`Não é de exportação`(color, density)` Através de raios 积分 for rendering ⋅质量上优于基于网的小说视觉合成,但 rendering 速度慢 100-1000倍──对大多数实时用途已被Gaussian splatting 取代,但在研究中仍占主导──


```figure
v4-3d-multiview
```

## Construí-lo

`code/main.py`实现一玩具版 2D Gaussian splating 拟合:把一个合成目标图像(平滑梯度) significa para 2D Gaussian splats 的和──通过 Gradient Descent 优化位置、色和覆变,以匹配目标──你会看到两个核心操作:前面 render(splat + alpha-composite) 和通过 Gradient Descent 拟合──

### 步骤 1: 2D Gaussian splat

```python
def gaussian_at(x, y, gaussian):
    px, py = gaussian["pos"]
    sigma = gaussian["sigma"]
    d2 = (x - px) ** 2 + (y - py) ** 2
    return math.exp(-d2 / (2 * sigma * sigma))
```

### Passo 2:  através de pontos adicionais                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

```python
def render(image_size, gaussians):
    img = [[0.0] * image_size for _ in range(image_size)]
    for g in gaussians:
        for y in range(image_size):
            for x in range(image_size):
                img[y][x] += g["color"] * gaussian_at(x, y, g)
    return img
```

Real 3D Gaussian splatting 会按深度对Gaussian 排序,并按顺序 alfa-composite──我们的2D玩具版本只是求和──

### 步骤 3: Usando Descenso Gradiente 拟合

```python
for step in range(steps):
    pred = render(size, gaussians)
    loss = mse(pred, target)
    gradients = compute_grads(pred, target, gaussians)
    update(gaussians, gradients, lr)
```

## 陷

- **View inconsistency。**Se independentemente gerar 4 pontos de vista, enquanto eles não concordam com os julgamentos da estrutura do objeto, 3D 拟合会变模糊──修复:使用带分享关注的多视频扩散──
- **Back-side hallucination。**单图像 → 3D 必须想象看不见的一侧――质量差异极大――
- **Gaussian splat explosion。**无约束训练会增长到10M spots并过拟合──Densificação + heurística de poda( provém de 3D-GS
- **Topology issues。**As malhas de campos implícitos (SDFs) geralmente têm buracos ou auto-interseções.
- **训练数据许可。**Licença de Objaverse 混杂; uso comercial因模型而异──

## Use-o

| Task | 2026 pick |
|------|-----------|
| 从照片进行场景重建 | Gaussian splatting (3DGS, Gsplat, Scaniverse) |
| 面向游戏的 Text-to-3D object | Meshy 4 or Rodin Gen-1.5 (PBR output) |
| Image-to-3D | Hunyuan3D 2.0, TripoSR, InstantMesh |
| 从少量图像进行 Novel-view synthesis | CAT3D, SV3D |
| 动态场景重建 | 4D Gaussian Splatting |
| Avatar / clothed human | Gaussian Avatar, HUGS |
| Research / SOTA | 上周刚发布的任何东西 |

对于在游戏或电子商务管道中发布生产级 3D:Meshy 4或Rodin Gen-1.5 输出可直接进入 Unity / Unreal 的 PBR Meshes──

## Entrega-o

保存 `outputs/skill-3d-pipeline.md` Habilidade de receber um brief 3D (input: text / one image / few images; output: mesh / splat / NeRF; use: render / game / VR),并输出: pipeline (difusão de múltiplas visualizações + fit, ou modelo de mesh direto)

## 练习

1. **Easy。**Usando 4 16 64 Gaussians`code/main.py` relatório final MSE vs. objectivo
2. **Medium。**扩展为 color Gaussians (RGB) ▽确认重建匹配 目標色圖案──
3. **Hard。**Utilize gsplat ou Nerfstudio, de 50 fotos capturadas 重建真实物体──報告適合時間 和持久的 views 上的最終SSIM──

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

## Produção Nota: 3D ainda não há substrato compartilhado

Não é igual à imagem (((difusão latente + DiT) e vídeo (((DiT espacial-temporal), 2026 anos 3D ainda não tem um único principal tempo de execução ~~

- **NeRF / triplane。**Inferência é marcado de raios + Cada amostra, uma vez MLP para frente, uma vez 5122 renderização, precisa de milhões de MLP para frente, uma vez, amostra de raios em lote ativo, SDPA/xformers,
- **Multi-view diffusion + LRM reconstruction。**两阶段管道。Stage 1(multi-view DiT) é和 Lesson 07 一样 Diffusion server。Stage 2(LRM transformador) é uma passagem para frente única das visões。O perfil de latência total é diffusion + one-shot, portanto, é necessário escolher por fase para servir primitivos。
- **SDS / DreamFusion。**Otimizar por ativo, não é inferência, mas construção de empregos, e não manipuladores de solicitações.

Para a maioria dos produtos de 2026, a resposta certa é que, sob pedido, o modelo de difusão de visualização múltipla seja executado, de forma gradual, reconstruído até 3DGS, e o serviço 3DGS seja usado para visualização em tempo real.

## 延伸阅读
- [Mildenhall et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields](https://arxiv.org/abs/2003.08934) NeRF。
- [Kerbl et al. (2023). 3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://arxiv.org/abs/2308.04079)3DGS.
- [Poole et al. (2022). DreamFusion: Text-to-3D using 2D Diffusion](https://arxiv.org/abs/2209.14988) SDS。
- [Liu et al. (2023). Zero-1-to-3: Zero-shot One Image to 3D Object](https://arxiv.org/abs/2303.11328)Zero123
- [Shi et al. (2023). MVDream](https://arxiv.org/abs/2308.16512) Difusão de visualização múltipla。
- [Hong et al. (2023). LRM: Large Reconstruction Model for Single Image to 3D](https://arxiv.org/abs/2311.04400) LRM。
- [Gao et al. (2024). CAT3D: Create Anything in 3D with Multi-View Diffusion Models](https://arxiv.org/abs/2405.10314)- CAT3D
- [Stability AI (2024). Stable Video 3D (SV3D)](https://stability.ai/research/sv3d)- O que é isso?
