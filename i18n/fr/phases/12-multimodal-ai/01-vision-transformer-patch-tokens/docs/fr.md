# Transformateurs de vision et patch-tokens

> Avant tout traitement multimodal, les images doivent être transformées en transformateur 序列 de jetons pouvant être traités. Le texte de 2020 de ViT 论文 utilise 16x16 像素补丁、线性投影和位置 Embedding 回答这个问题.

**Type:** Learn
**Languages:** Python (stdlib, patch tokenizer + geometry calculator)
**Prerequisites:** Phase 7 (Transformers), Phase 4 (Computer Vision)
**Time:** ~120 分钟

## Objectif de l'apprentissage
- HxWx3 image transformée en avec une position correcte de code de patch Token 序列。
- Pour une certaine VT ((taille de patch, résolution, épaisseur cachée, profondeur) calculer la longueur de la séquence, le nombre de paramètres et les FLOPs。
- Il a été ajouté à la liste des trois évolutions du système de production de 2020 à 2026: pré-entraînement autosuffisant (DINO/MAE) ✓ jetons de registre, ainsi que l'emballage à résolution native ✓
- Pour les tâches suivantes:

##  problématique
Le transformateur  traite est un vecteur 序列。文本本就是序列(bytes ou tokens)。 l'image est accompagnée de trois couleurs traversant le 2D 像素网格, pas un序列。 si vous évoluez chaque image, un张 224x224 RGB 图像将变成 150,528 符号, alors que l'attention personnelle sur cette longueur 完全不可行(par rapport à la longueur de la séquence est une seconde complexité)。

Avant 2020, les méthodes précédentes se sont développées sur un extracteur de fonctionnalités de CNN: ResNet  générer une carte de fonctionnalités 7x7 composée de vecteurs 2048 dimensions, re-réparer ces 49 Tokens 输入 Transformer── This能工作, mais hériter de la position de CNN ([[équivalence de traduction]], champs réceptifs locaux ),并削弱 Transformer pour l'adaptabilité à l'expansion de la taille──

Dosovitskiy et coll. (2020) ont posé une question directe: si vous sautez CNN 会怎么?把图像切割成固定大小的补丁(例如16x16像素),将每个补丁线性投影成一个矢量,加入位置嵌入,然后把序列输入到一个香变器──当时, cela appartenait à une pratique différente   没有卷积做视觉──只要数据足够多(JFT-300M,之后是LAION), il est sur ImageNet surpassé ResNet,并持续改进──

Jusqu'en 2026, le ViT original language est déjà sans aucun doute une base. Chaque tour de vision VLM à poids ouvert est une sorte de nouvelle génération.

## 概念
### Les patches en tant que jetons

给定一个形状为 `(H, W, 3)`                      `x`和 taille du patch `P`Tu vas couper l' image en une .`(H/P) x (W/P)`网格── chaque patch était un `P x P x 3`Les images de chaque carré seront transformées en un.`3 P^2`Vecteur ∙ appliquer une forme ∙`(3 P^2, D)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `W_E`, mettre chaque patch  mappé à la dimension cachée du modèle `D`Il y a une autre.

Pour le ViT-B/16 cette configuration classique:
- Résolution 224, taille du patch 16 → grille 14x14 → 196 个 patch tokens。
- Chaque patch est`16 x 16 x 3 = 768`个像素值, projetée à `D = 768`Il y a une autre.
- 加入一个可学习的 `[CLS]`- le symbole → la longueur de la séquence 197。

La projection de patch est mathématiquement égale à la taille du noyau`P`La marche est faite.`P`、 les échanges de données`D`La convection 2D. La production de code est en fait réalisée.`nn.Conv2d(3, D, kernel_size=P, stride=P)`

### Embeddings positionnels

Le patch 没有内在顺序  Transformer 看到的是一个集合──早期 ViT 加入可学习的 1D 位置 嵌入((每个位置一个768-dim Vector,总共 197 个) ──

现代视觉背骨 使用 2D-RoPE(Qwen2-VL 的 M-RoPE、SigLIP 2 的默认方案) 或因子化 2D-RoPE 会根据补丁的(排列,列)索引旋转查询 和键向量,因此模型可以从旋转角度推断对 2D位置──不需要位置表──模型在推理时可以处理任意的格格尺寸──

### Les codes CLS, les sorties combinées, les codes de registre

图像级表示是什么?

1. `[CLS]`token──把一个可学习向量 前置到补丁序列──经过所有变体块 后,CLS token's hidden state 就是图像表示──继承自BERT──原始 ViT、CLIP 使用这种方式──
2. La moyenne de la quantité de jetons de patch 取平均──SigLIP、DINOv2 和大多数现代VLM使用这种方式──
3. Les symboles de registre sont en train de se développer. Les symboles de registre sont en train de se développer.

Cette sélection affectera les tâches de mise en œuvre. CLS  adapté à la classification. Pour les jetons de patch 输入 LLM's VLM, vous sauteriez complètement le pooling.

### 预训练:监督式、对比式、masked、自蒸

Les techniques suivantes sont rapidement remplacées:

- CLIP (2021): faire une image-texte contrastée sur 400M de données graphiques.
- MAE (2021, He et al.): masquer 75% des patchs, reconstruire les images, auto-surveiller, adapté aux images pures,
- DINO (2021) / DINOv2 (2023): utilisation de l'étudiant-enseignant faire l'auto-distillation, sans étiquettes, sans sous-titres.
- SigLIP / SigLIP 2 (2023, 2025): Avec perte de sigmoïde 和 NaFlex 原生宽高比支持的 CLIP──2026年开放VLMs(Qwen、Idefics2、LLaVA-OneVision) dans la tour de vision principale──

Vous avez choisi de préapprentissage décider de l'épine dorsale 擅长什么:CLIP/SigLIP 擅长与文本做语义匹配,DINOv2 擅长密集视觉特征,MAE 适合作为下游细节调整的起点──

### Les lois de l'échelle

L'échelle de ViT (Zhai et coll. 2022) indique que la qualité de ViT est basée sur la taille du modèle, la taille des données et le calcul suivant les règles de prédiction.
- Plus de données → meilleure qualité.
- La taille du patch est la longueur de la séquence et la fidélité 杆──Patch 14 ((DINOv2/SigLIP SO400m) par rapport au patch 16 会为每张图像产生更多代币;更适合 OCR 和密集任务,但速度更慢──
- La résolution est un autre grand pilier: de 224 à 384 à 512 de nouveau, il est presque toujours utile, mais les FLOP sont en croissance secondaire.

ViT-g/14(1B paramètres、patch 14、resolution 224 → 256 jetons) et SigLIP SO400m/14(400M paramètres、patch 14) sont les deux principaux encoders des VLM ouverts de 2026 année。

### Le nombre de paramètres pour un ViT

完整计算位于 `code/main.py`Pour les 224 vi-B/16:

```
patch_embed = 3 * 16 * 16 * 768 + 768  =  591k
cls + pos    = 768 + 197 * 768          =  152k
block        = 4 * 768^2 (QKVO) + 2 * 4 * 768^2 (MLP) + 2 * 2*768 (LN)
             = 12 * 768^2 + 3k          =  7.1M
12 blocks    = 85M
final LN    = 1.5k
total       ≈ 86M
```

Avant de charger le point de contrôle, utilisez d'abord cette méthode pour estimer grossièrement la taille de chaque vitre.

### Configuration de la production 2026

La plupart des VLM ouverts de 2026 随模型 fournis sont encodés en résolution originale NaFlex) sous SigLIP 2 SO400m/14──
- Paramètres de 400 M:
- Taille de patch 14, résolution par défaut 384 → 每张图像 729 个 patch tokens。
- 图像级任务使用平均池;VQA en tous les 729 补丁都流入LLM。
- 4 jetons de registre, dans la remise de LLM avant abandonné.
- Utilisation de l'échelle d'image 2D-RoPE,并带有面向本地面积比例的图像水平扩展──

Chaque décision de cette configuration peut être remise à un article que vous pouvez lire.


```figure
image-patch-tokens
```

## Utilisez-le
`code/main.py`Il est un patch tokenizer 和 géométrie calculateur. Il reçoit une image H、W、patch P、hidden D、depth L)并报告:

- patchage de la forme de la grille et de la longueur de la séquence.
- Une synthèse 8x8 像素 jouet image de jeton 序列(逐步走过平坦 + projet 路径) ⋅
-  selon le patch emballé position emballé blocs transformateurs 和 tête 拆分的参数数──
- 目標 résolution 下单次前进通过的FLOPs──
- Les résultats de l'enquête ont été obtenus au cours de la dernière période de l'enquête.

运行它──把参数 counts 和已发布数字对齐──调整补丁尺寸和分辨率,感受令牌 数量成本──

## Je le livre.
本课会生成 `outputs/skill-patch-geometry-reader.md` Donner une configuration ViT  taille de patch, résolution, profondeur, elle génère avec raison de la notation de nombre de jetons, nombre de paramètres et estimation VRAM  chaque fois que vous choisissez la colonne vertébrale de vision pour VLM, tout le monde utilise cette compétence  elle peut éviter  Token explosion puis mettre mon contexte LLM 填满 of une accident 

## 练习
1. 计算 Qwen2.5 VL 在原生 1280x720 输入、补丁尺寸 14 下的补丁-代码序列长度──它和只使用 CLS 的表示相比如何?

2. Une image 1080p [1] 1920x1080) sur le patch 14 下会产生多少代币? 30 FPS、5 分钟视频会有多少代币视觉?哪种成本削减最有效:pooling、frame sampling,还是代币合并?

3. Utilisation pure Python  réalisation de jetons patch                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `forward`Les résultats du retour sont conformes.

4. 阅读 "Les transformateurs de vision ont besoin de registres" (ArXiv:2309.16588) Section 3──用两句话描述 registres 吸收的艺术品是什么,以及它为什么影响下游密集预测──

5. 修改 `code/main.py`Pour le support du patch-n'-pack: donner un ensemble d'images à différentes résolutions, générer une séquence emballée et un masque d'attention à diagonale de blocage.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Patch | “16x16 像素方块” | 输入图像中固定大小、非重叠的区域；会变成一个 Token |
| Patch embedding | “Linear projection” | 一个共享的学习 Matrix（或 stride=P 的 Conv2d），将展平后的 patch 像素映射到 D-dim Vector |
| CLS token | “Class token” | 前置的可学习 Vector，其最终 hidden state 表示整张图像；在 2026 年是可选项 |
| Register token | “Sink token” | 额外的可学习 Token，用于吸收 ViT 在 pretraining 期间产生的高范数 Attention artifacts |
| Position embedding | “Positional info” | 每个位置的 Vector 或旋转，使序列具备顺序感知；2D-RoPE 是现代默认方案 |
| Grid | “Patch grid” | 对于给定 resolution 和 patch size，patch 形成的 (H/P) x (W/P) 2D 数组 |
| NaFlex | “Native flexible resolution” | SigLIP 2 特性：单个模型无需重新训练即可服务多种 aspect ratios 和 resolutions |
| Backbone | “Vision tower” | 预训练 image encoder，其 patch-token 输出会在 VLM 中输入 LLM |
| Pooling | “Image-level summary” | 将 patch tokens 转换为一个 Vector 的策略：CLS、mean、attention pool 或 register-based |
| Patch 14 vs 16 | “Finer vs coarser grid” | Patch 14 每张图像产生更多 Token，对 OCR 有更好 fidelity，但更慢；patch 16 是经典默认值 |

## 延伸阅读
- [Dosovitskiy et al. — An Image is Worth 16x16 Words (arXiv:2010.11929)](https://arxiv.org/abs/2010.11929) 原始 ViT。
- [He et al. — Masked Autoencoders Are Scalable Vision Learners (arXiv:2111.06377)](https://arxiv.org/abs/2111.06377) MAE, pré-entraînement auto-supervisé
- [Oquab et al. — DINOv2 (arXiv:2304.07193)](https://arxiv.org/abs/2304.07193) Autodistillation à grande échelle, sans étiquettes。
- [Darcet et al. — Vision Transformers Need Registers (arXiv:2309.16588)](https://arxiv.org/abs/2309.16588) enregistrement des jetons 和 artefact 分析。
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) 2026 默认 vision tower
- [Zhai et al. — Scaling Vision Transformers (arXiv:2106.04560)](https://arxiv.org/abs/2106.04560) 经验性 loi de mise à l'échelle
