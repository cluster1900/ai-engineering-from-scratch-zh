# Transformateurs de vision (ViT)

> Une image est constituée de patch 组成网格── une phrase est constituée de Token 组成网格──同一个变压器都能处理──

**Type:** Build
**Languages:** Python
**先修要求:**Phase 7 · 05 (transformateur complet), phase 4 · 03 (CNN), phase 4 · 14 (introduction des transformateurs de vision)
**Time:** ~45 minutes

##  problématique

Avant 2020, la vision informatique 基本就意味着 convolution──ImageNet、COCO 和 Detection benchmark 上所有SOTA都使用CNN backbone──Transformers 则用于语言──

Dosovitskiy et al. (2020) Un image vaut 16x16 mots  indiquent que vous pouvez complètement supprimer la convulsion。 mettre l'image en petits patchs fixes, projeter chaque patch 线性 into an Embedding, re-envoyer ce séquence dans un encodeur transformateur ordinaire。 en taille suffisamment grande.

ViT est le début d'une tendance majeure de 2026: une architecture, plusieurs modalités. ViT Tokenize audio. ViT Tokenize images.

En 2026, les VTT et leurs successeurs ont déjà pris la majeure partie de la vision. Les CNN sont toujours en phase avec les appareils de pointe et les tâches sensibles à la latence.

## 概念

![Image → patches → tokens → transformer](../assets/vit.svg)

### Étape 1  patch

Je vais en faire un .`H × W × C`- Une image décomposée en une .`N × (P·P·C)`序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列   序列 序列 序列     序列 序列    序列  序列          序列          序列     序列                 序列            序列                                                             `224 × 224`- Une image.`16 × 16`patches → 196 patches, chacune comprenant 768 valeurs 个──

```
image (224, 224, 3) → 14 × 14 grid of 16x16x3 patches → 196 vectors of length 768
```

La taille du patch est un facteur clé de contrôle. Les patches plus petites = plus de jetons, une meilleure résolution.

### Étape 2  intégration linéaire

Une matrice unique apprise va chaque patch plat projeter à`d_model`                                                                                                                                                                                                                                                              `P`La marche est faite.`P`Dans PyTorch, c'est en fait le cas.`nn.Conv2d(C, d_model, kernel_size=P, stride=P)`Il faut seulement 2 pages pour le réaliser.

### 步骤 3  前置 `[CLS]`- les symboles, ajouter des emplacements positionnels

- En commençant à ajouter un apprenant `[CLS]`Son état caché final sera utilisé comme indice d'image de Classification.
- 添加可学习的位置嵌入式 (ViT) ou sinusoïdale 2D (后续变体)
- Après 2024, le RoPE sera étendu à la position 2D, il n'est plus nécessaire d'implémentation apparente.

### 步骤 4  标准 Encodeur de transformateur

Je suis en train de me faire une idée .`LayerNorm → Self-Attention → + → LayerNorm → MLP → +`Les blocs sont totalement identiques à la BERT. Il n'y a pas de couches spécifiques à la vision.

### Étape 5 - tête

对于 Classification:取 `[CLS]`L'état caché → linéaire → douxmax── pour DINOv2 ou SAM, il est abandonné `[CLS]`, utiliser directement les emplacements de patch,

### importants

| Model | Year | Change |
|-------|------|--------|
| ViT | 2020 | 原始版本。固定 patch size，完整 global attention。 |
| DeiT | 2021 | Distillation；只用 ImageNet-1k 就能训练。 |
| Swin | 2021 | 使用 shifted windows 的层级结构。固定的 sub-quadratic 成本。 |
| DINOv2 | 2023 | Self-supervised（无 labels）。最好的通用 vision features。 |
| ViT-22B | 2023 | 22B 参数；scaling laws 适用。 |
| SigLIP | 2023 | ViT + language pair，sigmoid contrastive loss。 |
| SAM 3 | 2025 | Segment anything；ViT-Large + promptable mask decoder。 |

### Pourquoi ça a pris du temps pour réussir ?

ViT a besoin d'une quantité importante de données pour correspondre aux CNN, car il n'a pas de biais inductif de CNN (invariance de traduction, localisation) ⋅ Si il n'y a pas plus de 100M d'images étiquetées ou de pré-entraînement auto-supervisé fort, dans le même calcul, les CNN sont encore plus forts ⋅ DeiT a réussi à résoudre ce problème en 2021 avec des techniques de distillation ⋅ DINOv2 en 2023 avec l'auto-supervision ⋅ Réalisé complètement le problème ⋅


```figure
n5-patch-stream
```

## - Je le construis.

参见 `code/main.py` Patchfichage de pur stdlib + intégration linéaire + vérification de l'état d'esprit― ne pas effectuer de formation, car toute vitesse de taille réelle nécessite PyTorch et un GPU de temps−

### 步骤 1: image fausse

Une image RGB 24 × 24 , utilisez`(R, G, B)`Nous utilisons des patchs 6×6 → 16 patchs, chaque patch de vecteur d'embedding 长度为 108。

### 步骤 2: parche

```python
def patchify(image, P):
    H = len(image)
    W = len(image[0])
    patches = []
    for i in range(0, H, P):
        for j in range(0, W, P):
            patch = []
            for di in range(P):
                for dj in range(P):
                    patch.extend(image[i + di][j + dj])
            patches.append(patch)
    return patches
```

Résultats de l'ordre: selon la ligne principale du réseau.

### 步骤 3: intégration linéaire

Pour chaque plaque, multipliez-la par un.`(patch_flat_size, d_model)`Matrix `[CLS]`后,验证输出形 为 `(N_patches + 1, d_model)`Il y a une autre.

### Étape 4: 统计真实 ViT 的参数

打印 ViT-Base 参数:12 couches、12 têtes、d=768、patch=16──与ResNet-50(~25M) comparison。ViT-Base 大约是 ~86M──ViT-Large ~307M──ViT-Huge ~632M──

## Utilisez-le

```python
from transformers import ViTImageProcessor, ViTModel
import torch
from PIL import Image

processor = ViTImageProcessor.from_pretrained("google/vit-base-patch16-224-in21k")
model = ViTModel.from_pretrained("google/vit-base-patch16-224-in21k")

img = Image.open("cat.jpg")
inputs = processor(img, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, 197, 768): [CLS] + 196 patches
cls_emb = out[:, 0]                       # image representation
```

**DINOv2 embeddings 是 2026 年 image features 的默认选择。**结脊椎, entraîner une très petite tête。 adapté à la classification、 récupération、 détection、 encapsulation。 Les points de contrôle DINOv2 de Meta sont en train de réaliser toutes les tâches de vision non-littérale 上都超越 CLIP。

**Patch-size 选择。**小模型使用 16×16(ViT-B/16)。 prédiction de la densité(segmentation) utiliser 8×8 ou 14×14(SAM、DINOv2)。超大模型使用 14×14。

## Je le livre.

参见 `outputs/skill-vit-configurator.md`◊ Cette compétence sera basée sur la taille du jeu de données, la résolution et le budget de calcul, pour une nouvelle tâche de vision   selectionner une variante ViT et la taille du patch ◊

## 练习

1. **Easy.**运行  référencement`code/main.py` le patch de vérification`(H/P) * (W/P)`, 平 patch 维度等于 `P*P*C`Il y a une autre.
2. **Medium.**实现 2D sinusoïdes positionnelles intégrées, c'est-à-dire pour chaque patch `row`et `col` Créer deux codes sinusoïdal indépendants, les faire coller ⋅ les envoyer dans un petit PyTorch ViT, et comparer la précision de CIFAR-10 avec les emblèmes positionnels appréciables ⋅
3. **Hard.**Construire un ViT de 3 couches (PyTorch), en utilisant des patchs 4×4 dans 1000 张 MNIST 图像上训练――测试精度──然后在同样 1000 张图像上加入 DINOv2 pré-entraînement(简化版:只训练编码器 根据面膜补丁 预测补丁嵌入) ―― La précision est-elle améliorée?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Patch | “vision-transformer token” | 图像中一个 `P × P × C` 区域的 pixel values 所组成的扁平 Vector。 |
| Patchify | “Chop + flatten” | 将图像切成不重叠的 patches，并将每个 patch flatten 成一个 Vector。 |
| `[CLS]` token | “图像摘要” | 添加在开头的可学习 token；它的最终 Embedding 是图像表示。 |
| Inductive bias | “模型预设的假设” | ViT 的 priors 比 CNNs 少；需要更多数据来弥补差距。 |
| DINOv2 | “Self-supervised ViT” | 使用 image augmentation + momentum teacher，在没有 labels 的情况下训练。2026 年最好的通用 image features。 |
| SigLIP | “CLIP 的继任者” | ViT + text encoder，使用 sigmoid contrastive loss 训练；在相同 compute 下优于 CLIP。 |
| Swin | “Windowed ViT” | 带有 local attention + shifted windows 的层级 ViT；sub-quadratic。 |
| Register tokens | “2023 trick” | 几个额外的可学习 tokens，用来吸收 attention sinks；可以改进 DINOv2 features。 |

## 延伸阅读

- [Dosovitskiy et al. (2020). An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929) ViT 论文。
- [Touvron et al. (2021). Training data-efficient image transformers & distillation through attention](https://arxiv.org/abs/2012.12877)- Je suis désolé.
- [Liu et al. (2021). Swin Transformer: Hierarchical Vision Transformer using Shifted Windows](https://arxiv.org/abs/2103.14030)- Je suis un cochon.
- [Oquab et al. (2023). DINOv2: Learning Robust Visual Features without Supervision](https://arxiv.org/abs/2304.07193) DINOv2──
- [Darcet et al. (2023). Vision Transformers Need Registers](https://arxiv.org/abs/2309.16588) DINOv2 修复方案
