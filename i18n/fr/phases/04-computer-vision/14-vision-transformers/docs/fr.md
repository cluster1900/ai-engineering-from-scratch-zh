# Transformateurs de vision (ViT)

> Pour couper les images en patchs, pour chaque patch en un mot, pour utiliser le transformateur standard, ne regardez pas en arrière.

**类型：**Construction
**语言：**Python
**前置要求：**La phase 7 leçon 02 (auto-attention), la phase 4 leçon 04 (classification des images)
**时间：**- 45 minutes

## Objectif de l'apprentissage

- De l'implantation de patch à zéro, de l'implantation positionnelle apprise, des jetons de classe et des blocs d'encodeur de transformateur, construire un minimum de ViT
- Expliquer pourquoi les VT ont été considérés comme ayant besoin de données de formation de la mer, jusqu'à ce que les DeiT et MAE prouvent que ce n'est pas le cas
- À partir de l'angle de l'architecture, comparez ViT、Swin 和 ConvNeXt ((无先验、局部窗口注意、conv spine)
- Utilisation `timm`和标准 linear-probe / fine-tune 流程, dans un petit groupe de données

##  problématique

Depuis dix ans, la conversion 几乎就是计算机视觉的同义词──CNN 具有很强的诱导偏见,包括本地化、翻译等差,没人认为你能替代它们──随后Dosovitskiy et al. (2020) 证明, a directly应用于展平图像补丁的普通变压器,完全不使用 convolutional 机制,也能在规模足够大时匹配甚至超过最好的CNN──

La conclusion de l'époque est que les transformateurs manquent de pré-expérience utile, mais peuvent apprendre ces pré-expériences à partir de suffisamment de données. Les travaux ultérieurs de la DET, MAE, DINO) montrent que, à condition que la formation soit correcte, par exemple, l'augmentation forte, la pré-expérience autosuffisante, la distillation, la DET peut également s'entraîner très bien.

Jusqu'en 2026, la CNN pure sur les appareils de bord est encore en compétition, mais les transformateurs ont dominé presque toutes les autres directions: segmentation, détection, détection, CLIP, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, vidéo, etc.

## 核心概念

### Le processus

```mermaid
flowchart LR
    IMG["Image<br/>(3, 224, 224)"] --> PATCH["Patch embedding<br/>conv 16x16 s=16<br/>-> (768, 14, 14)"]
    PATCH --> FLAT["Flatten to<br/>(196, 768) tokens"]
    FLAT --> CAT["Prepend<br/>[CLS] token"]
    CAT --> POS["Add learned<br/>positional embed"]
    POS --> ENC["N transformer<br/>encoder blocks"]
    ENC --> CLS["Take [CLS]<br/>token output"]
    CLS --> HEAD["MLP classifier"]

    style PATCH fill:#dbeafe,stroke:#2563eb
    style ENC fill:#fef3c7,stroke:#d97706
    style HEAD fill:#dcfce7,stroke:#16a34a
```

七个步骤――Patches -> tokens -> attention -> classifier──每个变体(DeiT、Swin、ConvNeXt、MAE pré-entraînement)都只改变这七步中的一个两个,其余保持不变──

### Embedding de patch

Le premier conve est clé. Le noyau de taille 16, étape 16, de sorte qu'un张 224x224 图像会变成 14x14 网格, composé de 16x16 patches, chaque patch est projeté en 768-dimension intégration.

```
Input:  (3, 224, 224)
Conv (3 -> 768, k=16, s=16, no padding):
Output: (768, 14, 14)
Flatten spatial: (196, 768)
```

196 patches = 196 jetons。 la dimension de chaque jeton est de 768(ViT-B)、1024(ViT-L) ou 1280(ViT-H)。

### Token de classe

Dans le premier ordre, il y a un vecteur:

```
tokens = [CLS; patch_1; patch_2; ...; patch_196]   shape (197, 768)
```

Après avoir traversé N 个 transformateur blocs,`[CLS]`Le résultat est le résultat de l'image.

### Embedding positionnel

Transformateurs 没有内置的空间位置概念── Pour chaque symbole, ajouter un vecteur appris:

```
tokens = tokens + learned_pos_embedding   (also shape (197, 768))
```

Cette intégration est un paramètre du modèle; la formation basée sur le gradient le rendra adapté à la structure d'image en 2D. Il existe également un substitut sinusoïdale en 2D, mais en pratique, il est très peu utilisé.

### Bloc de codeur de transformateur

标准结构──auto-attention multi-tête、MLP、connexions résiduelles、pré-coucheNorm──

```
x = x + MSA(LN(x))
x = x + MLP(LN(x))

MLP is two-layer with GELU: Linear(d -> 4d) -> GELU -> Linear(4d -> d)
```

ViT-B/16                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

### Pourquoi utiliser la pré-LN

早期 transformateurs 使用 post-LN(`x = LN(x + sublayer(x))`), en l'absence de réchauffement, l'entraînement dépasse les 6 à 8 niveaux est très difficile.`x = x + sublayer(LN(x))`Il est possible de former des réseaux plus profonds sans chauffage.

### Taille du patch 权衡

- 16x16 patches -> 196 jetons, standard setting。
- 32x32 patches -> 49 jetons, plus rapide mais moins résolu.
- 8x8 patches -> 784 jetons, plus précis, mais O(n^2) coût de l'attention 扩展性很差──

Les patches plus grandes = les jetons plus petits = les jetons plus rapides mais les détails spatiaux plus petits。SwinV2 utilise des patches 4x4 dans les fenêtres hiérarchiques。

### DeiT dans la formation de la vidéo de l'imageNet-1k

Il faut que les VTT soient plus efficaces que les VTT.

1. Augmentation lourde: Augmentation aléatoire, mélange, coupe, mélange, effacement aléatoire,
2. La profondeur stochastique entraîne le temps de laisser tomber les blocs entiers.
3. Augmentation répétée (s)
4. Depuis l'enseignant de CNN  effectuer la distillation 可选,会进一步提升精度)

Chaque formation moderne de ViT est basée sur le DeiT.

### Swin contre ConvNeXt

- **Swin**(Liu et al., 2021)                                                                                                                                                                                                                                                           
- **ConvNeXt**(Liu et coll., 2022)  重新设计的CNN,匹配 Swin的架构选择(profondeur convs、LayerNorm、GELU、invertit bottleneck) 

En 2026, ConvNeXt-V2 et Swin-V2 sont des choix de classe de production; correctement choisir dépend de votre pile d'inférence(ConvNeXt 更适合边缘 编译)

### Pré-entraînement

Autoencodeur masqué(He et al., 2022): Avec masque 75% des correctifs, encodeur d'entraînement seulement traiter 25% de visible, reentraînement un petit décodeur, selon la sortie de l'encodeur 重建被 mask 的补丁.

MAE 让 ViT seulement avec ImageNet-1k également entraîné, atteindre SOTA, et est actuellement un appareil auto-supervisé.


```figure
batchnorm-inference
```

## - Je le construis.

### 步骤 1: Embedding du patch

```python
import torch
import torch.nn as nn

class PatchEmbedding(nn.Module):
    def __init__(self, in_channels=3, patch_size=16, dim=192, image_size=64):
        super().__init__()
        assert image_size % patch_size == 0
        self.proj = nn.Conv2d(in_channels, dim, kernel_size=patch_size, stride=patch_size)
        num_patches = (image_size // patch_size) ** 2
        self.num_patches = num_patches

    def forward(self, x):
        x = self.proj(x)
        return x.flatten(2).transpose(1, 2)
```

Un con, un plat, un transposé... voilà le processus complet d'image à jetons.

### 步骤 2: bloc du transformateur

Pré-LN, attention à soi à plusieurs têtes, MLP, connexions résiduelles avec GELU.

```python
class Block(nn.Module):
    def __init__(self, dim, num_heads, mlp_ratio=4, dropout=0.0):
        super().__init__()
        self.ln1 = nn.LayerNorm(dim)
        self.attn = nn.MultiheadAttention(dim, num_heads, dropout=dropout, batch_first=True)
        self.ln2 = nn.LayerNorm(dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim, dim * mlp_ratio),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(dim * mlp_ratio, dim),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        a, _ = self.attn(self.ln1(x), self.ln1(x), self.ln1(x), need_weights=False)
        x = x + a
        x = x + self.mlp(self.ln2(x))
        return x
```

`nn.MultiheadAttention` responsable de la décomposition des têtes ‧ produit de point à l'échelle et projection de sortie `batch_first=True`, donc les formes sont `(N, seq, dim)`Il y a une autre.

### 步骤 3: ViT

```python
class ViT(nn.Module):
    def __init__(self, image_size=64, patch_size=16, in_channels=3,
                 num_classes=10, dim=192, depth=6, num_heads=3, mlp_ratio=4):
        super().__init__()
        self.patch = PatchEmbedding(in_channels, patch_size, dim, image_size)
        num_patches = self.patch.num_patches
        self.cls_token = nn.Parameter(torch.zeros(1, 1, dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, dim))
        self.blocks = nn.ModuleList([
            Block(dim, num_heads, mlp_ratio) for _ in range(depth)
        ])
        self.ln = nn.LayerNorm(dim)
        self.head = nn.Linear(dim, num_classes)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)

    def forward(self, x):
        x = self.patch(x)
        cls = self.cls_token.expand(x.size(0), -1, -1)
        x = torch.cat([cls, x], dim=1)
        x = x + self.pos_embed
        for blk in self.blocks:
            x = blk(x)
        x = self.ln(x[:, 0])
        return self.head(x)

vit = ViT(image_size=64, patch_size=16, num_classes=10, dim=192, depth=6, num_heads=3)
x = torch.randn(2, 3, 64, 64)
print(f"output: {vit(x).shape}")
print(f"params: {sum(p.numel() for p in vit.parameters()):,}")
```

Environ 2,8 M de paramètres, un petit ViT qui peut être traité sur le CPU. Le vrai ViT-B est 86 M.`dim=768, depth=12, num_heads=12`Il y a une autre.

### 步骤 4: vérification de la santé mentale  单图像 inference

```python
logits = vit(torch.randn(1, 3, 64, 64))
print(f"logits: {logits}")
print(f"probs:  {logits.softmax(-1)}")
```

应该能无错运行──Possibilités 总和为 1──

## Utilisez-le

`timm`提供了所有 ViT 变体及其ImageNet préentraînés poids──一行代码:

```python
import timm

model = timm.create_model("vit_base_patch16_224", pretrained=True, num_classes=10)
```

`timm`Il est dans la même API, il prend en charge ViT, DeiT, Swin, Swin-V2, ConvNeXt, ConvNeXt-V2, MaxViT, MViT, EfficientFormer et d'autres modèles.

对于多模工作 (image + texte),`transformers`提供 CLIP、SigLIP、BLIP-2、LLaVA── ces modèles encodent des images sont une sorte de ViT 变体──

## Je le livre.

Le cours est ouvert à:

- `outputs/prompt-vit-vs-cnn-picker.md` Un prompt, selon la taille du jeu de données, calcul et pile d'inférence, dans le ViT, ConvNeXt ou Swin 之间 faire le choix.
- `outputs/skill-vit-patch-and-pos-embed-inspector.md` Une compétence, pour vérifier l'intégration de patch de ViT et les formes d'intégration positionnelle si elles correspondent à la longueur de séquence de l'attente du modèle, capturer le plus courant de bug de transplantation。

## 练习

1. **（Easy）**打印上小型 ViT 中一次前进通过的每个中间子形――确认:input `(N, 3, 64, 64)`-> patchs `(N, 16, 192)`-> avec CLS `(N, 17, 192)`-> entrée du classifiateur `(N, 192)`-> sortie `(N, num_classes)`Il y a une autre.
2. **（Medium）**Dans la leçon 4 de la synthèse-CIFAR données sur la mise au point d' une préparation à l' entraînement`timm`Comparison des temps de formation et de précision finale du rapport
3. **（Hard）**Pour les petits ViT                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| Patch embedding | “第一个 conv” | kernel size = stride = patch size 的 conv；将图像转换为 token embeddings 的网格 |
| Class token | “[CLS]” | 加在 token sequence 前面的 learned vector；它的最终 output 是全局图像表示 |
| Positional embedding | “Learned pos” | 添加到每个 token 上的 learned vector，让 transformer 知道每个 patch 来自哪里 |
| Pre-LN | “LayerNorm before sublayer” | 稳定的 transformer 变体：使用 `x + sublayer(LN(x))`，而不是 `LN(x + sublayer(x))` |
| Multi-head attention | “Parallel attention” | 标准 transformer attention，被拆分为 num_heads 个独立子空间，之后再 concatenated |
| ViT-B/16 | “Base, patch 16” | 规范尺寸：dim=768、depth=12、heads=12、patch_size=16、image=224；约 86M params |
| DeiT | “Data-efficient ViT” | 只用 ImageNet-1k 并配合强 augmentation 训练的 ViT；证明大型 pretraining datasets 并非绝对必要 |
| MAE | “Masked autoencoder” | Self-supervised pretraining：mask 75% 的 patches 并重建；主流 ViT pretraining 配方 |

## 延伸阅读

- [An Image is Worth 16x16 Words (Dosovitskiy et al., 2020)](https://arxiv.org/abs/2010.11929) ViT 论文
- [DeiT: Data-efficient Image Transformers (Touvron et al., 2020)](https://arxiv.org/abs/2012.12877) 如何只使用ImageNet-1k 训练ViT
- [Masked Autoencoders are Scalable Vision Learners (He et al., 2022)](https://arxiv.org/abs/2111.06377) MAE 预训练
- [timm documentation](https://huggingface.co/docs/timm) Reference document de chaque transformateur de vision que vous utilisez dans la production
