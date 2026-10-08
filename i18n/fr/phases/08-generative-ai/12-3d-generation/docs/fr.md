# Génération 3D

> La 3D est la modalité la plus forte de 2D à 3D. La révolution de 2023 est la génération de 3D Gaussian Splating.

**Type:** Learn
**Languages:** Python
**先修要求:**La phase 4 (Vision), la phase 8 · 07 (diffusion latente)
**Time:** ~45 minutes

##  problématique

3D  Contenu difficile à traiter:

- **表示。**Les réseaux de voxel, les champs de distances signés (SDF), les champs de radiance neurale (NeRF), les gaussiens 3D,
- **数据稀缺。**ImageNet a 14M 张图像──最大的干净 3D 数据集(Objaverse-XL, 2023) Il y a environ 10M 个物体, dont la plupart de qualité est inférieure──
- **内存。**Une grille de 5123 voxels a 128 M de voxels; une scène utilisable NeRF  nécessite 1 M d'échantillons/rays ⋅ génération de reconstruction ⋅
- **监督。**Pour les images en 2D, vous avez des pixels. Pour les images en 3D, vous n'avez généralement que peu de vues en 2D et vous devez les porter en 3D.

La première étape consiste à créer des images multivuees en 2D avec une représentation en 3D.

## 概念

![3D generation: multi-view diffusion + 3D reconstruction](../assets/3d-generation.svg)

### Indiquer: 3D Splating gaussienne (Kerbl et coll., 2023)

Pour les paysages, les nuages sont composés de Gaussins 3D. Chacun possède 59 paramètres: position (3); covariance (6, ou quaternion 4 + échelle 3); opacité (1); couleur sphérique-harmonique (°3); degré 3 = 48, degré 0 = 3).

Rendering = projection + alpha-compositioning。快(4090 上 1080p 约 100 fps)。可微──通过 Gradient Descent pour les photos de la vérité au sol 拟合──一个场景可在消费级 GPU 上用5-30分钟完成拟合──

Deux de ses principales nouveautés 2023-2024:
- **Generative Gaussian splats。**LGM、LRM、InstantMesh et autres modèles directement à partir d'une ou plusieurs images prédiction de nuage gaussien。
- **4D Gaussian Splatting。**带有每框的 Gaussians, utilisé dans les scènes en mouvement

### Diffusion multi-vue

Une image diffusion, qui peut être produite à partir d'un texte rapide ou d'une seule image, génère plusieurs points de vue d'un même objet. Zéro123 (Liu et al., 2023) MVDream (Shi et al., 2023) SV3D (Stabilité, 2024) CAT3D (Google, 2024)

### Les pipelines de texte à 3D

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

2025-2026 方向: adaptation aux moteurs de jeu de 、带 PBR matériels de textes directs à des modèles de filets── pour les objets généraux, la diffusion multi-vues 中间步骤 est toujours la meilleure méthode de démonstration──

### NeRF(背景)

Le champ de radiance neurale (Mildenhall et coll., 2020)`(x, y, z, view direction)`Il n' y a pas de sortie`(color, density)` Le rendement est supérieur à la synthèse de vision novatrice basée sur des réseaux, mais le rendement est lent de 100 à 1000 fois.


```figure
v4-3d-multiview
```

## - Je le construis.

`code/main.py`实现一个玩具版 2D Gaussian splating 拟合:把一个合成目标图像(平滑梯度) signifie pour 2D Gaussian splats of和──通过 Gradient Descent 优化位置、颜色 和 covariances,以匹配目标──你会看到两个核心操作:前进 render(splat + alpha-composite) 和通过 Gradient Descent 拟合──

### 步骤 1: 2D splat gaussienne

```python
def gaussian_at(x, y, gaussian):
    px, py = gaussian["pos"]
    sigma = gaussian["sigma"]
    d2 = (x - px) ** 2 + (y - py) ** 2
    return math.exp(-d2 / (2 * sigma * sigma))
```

### Étape 2: Transmission de l'eau par le biais de spots accumulés

```python
def render(image_size, gaussians):
    img = [[0.0] * image_size for _ in range(image_size)]
    for g in gaussians:
        for y in range(image_size):
            for x in range(image_size):
                img[y][x] += g["color"] * gaussian_at(x, y, g)
    return img
```

Réelle 3D Gaussie splatting 会按深度对Gaussie 排序,并按顺序 alpha-composite。

### 步骤 3: avec la descente gradiente 拟合

```python
for step in range(steps):
    pred = render(size, gaussians)
    loss = mse(pred, target)
    gradients = compute_grads(pred, target, gaussians)
    update(gaussians, gradients, lr)
```

## La trappe

- **View inconsistency。**Si vous générez indépendamment 4 vues, alors qu'elles ne sont pas conformes à la structure de l'objet, la diffusion multi-vue de l'attention partagée est utilisée.
- **Back-side hallucination。**单图像 → 3D 必须想象看不见的一侧――质量差异极大――
- **Gaussian splat explosion。**无约束训练会增长到10M splats并过拟合──Densification + pruning heuristiques(来自3D-GS 原论文) est nécessaire──
- **Topology issues。**Les réseaux de champs implicites (SDF) ont généralement des trous ou des intersections autonomes.
- **训练数据许可。**Objaverse 混杂; usage commercial en fonction du modèle

## Utilisez-le

| Task | 2026 pick |
|------|-----------|
| 从照片进行场景重建 | Gaussian splatting (3DGS, Gsplat, Scaniverse) |
| 面向游戏的 Text-to-3D object | Meshy 4 or Rodin Gen-1.5 (PBR output) |
| Image-to-3D | Hunyuan3D 2.0, TripoSR, InstantMesh |
| 从少量图像进行 Novel-view synthesis | CAT3D, SV3D |
| 动态场景重建 | 4D Gaussian Splatting |
| Avatar / clothed human | Gaussian Avatar, HUGS |
| Research / SOTA | 上周刚发布的任何东西 |

Pour les gamers ou les e-commerce, la production de 3D: Meshy 4 ou Rodin Gen-1.5 peut être directement intégrée à Unity / Unreal.

## Je le livre.

保存 `outputs/skill-3d-pipeline.md` Skilled 接收一个3D brief(input: text / one image / few images;output: mesh / splat / NeRF;use: render / game / VR),并输出:pipeline(multi-view diffusion + fit, ou direct mesh model)

## 练习

1. **Easy。**Avec 4 16 64 Gaussiens`code/main.py` Rapport final MSE vs cible
2. **Medium。**扩展为色Gaussians (RGB) ――确认重建匹配目标色图案──
3. **Hard。**Utilisation gsplat ou Nerfstudio, à partir de 50 photos de capture 重建真实物体──rapport temps de couture 和 vues prolongées 上的最终SSIM──

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

## Produit note: 3D n'a pas encore de substrat partagé

Il n'y a pas encore de 3D unique pour l'année 2026.

- **NeRF / triplane。**L'inference est la marquage de rayons + chaque échantillon une fois MLP en avant― une fois 5122 rendus  nécessitent plusieurs millions de fois MLP en avant― des échantillons de rayons de lot actifs; SDPA/xformers 适用―
- **Multi-view diffusion + LRM reconstruction。**两阶段管道──Stage 1(multi-view DiT) 是和 Lesson 07 一样 Diffusion server──Stage 2(LRM transformateur) 是对 views的一次性前进通过──整体延迟配置是diffusion + one-shot,因此必须按阶段选择服务原始的──
- **SDS / DreamFusion。**L'optimisation par actif, ce n'est pas une inférence, mais une construction d'emplois, plutôt que des gestionnaires de demandes.

Pour la plupart des produits de 2026, la réponse est de fonctionner selon le modèle de diffusion multi-vue, de reconstruire progressivement jusqu'à 3DGS, et de servir 3DGS pour la visualisation en temps réel.

## 延伸阅读
- [Mildenhall et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields](https://arxiv.org/abs/2003.08934) NeRF。
- [Kerbl et al. (2023). 3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://arxiv.org/abs/2308.04079) 3DGS
- [Poole et al. (2022). DreamFusion: Text-to-3D using 2D Diffusion](https://arxiv.org/abs/2209.14988) SDS。
- [Liu et al. (2023). Zero-1-to-3: Zero-shot One Image to 3D Object](https://arxiv.org/abs/2303.11328) Zéro123。
- [Shi et al. (2023). MVDream](https://arxiv.org/abs/2308.16512) diffusion multi-vue。
- [Hong et al. (2023). LRM: Large Reconstruction Model for Single Image to 3D](https://arxiv.org/abs/2311.04400) LRM。
- [Gao et al. (2024). CAT3D: Create Anything in 3D with Multi-View Diffusion Models](https://arxiv.org/abs/2405.10314)- C'est une série de trois.
- [Stability AI (2024). Stable Video 3D (SV3D)](https://stability.ai/research/sv3d)- Je suis en train de vous dire.
