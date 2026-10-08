# 任意分辨率 Vision: patch-n'-Pack 和 NaFlex

> La réponse de VLM est de redimensionner tout le contenu en forme carrée fixe  perdu pour permettre à OCR DATA de compréhension du document et de résolution élevée de scène de résoudre des signaux réellement utiles NaViT Google,2023) a montré que le masking par bloc-diagonal va changer les patchs de résolution  emballer dans un seul lot de transformateur  M-RoPE de Qwen2-VL 2024) a complètement supprimé la table de position  LaVA va changer la résolution de l'image de résolution élevée de la base  SigL 2 NaFlex 2025) maintenant ouvert par le VLM en en ligne, l'ensemble des patchs de contrôle est utilisé pour atteindre un seul point de contrôle 

**Type:** Build
**Languages:** Python (stdlib, patch packer + block-diagonal mask)
**Prerequisites:** Phase 12 · 01 (ViT patches), Phase 12 · 05 (LLaVA)
**Time:** ~120 minutes

## Objectif de l'apprentissage
- Envelopper une série de patchs dans une image en une séquence, et construire un masque d'attention à diagonale de bloc.
- Pour une tâche déterminée, on fait un choix entre AnyRes tiling (LLaVA-NeXT) 、NaFlex (SigLIP 2) et M-RoPE (Qwen2-VL) ⋅
- Dans le cas d'une taille non modifiée, calculer les budgets des jetons pour OCR, diagramme et photographies
- Il y a trois modes d'échec de la taille carrée: le texte étressé, le contenu coupé, le tamponage des jetons.

##  problématique
Les transformateurs ont besoin d'une séquence. Un lot est une séquence de même longueur. Si votre image est de 224x224, chaque fois vous obtiendrez 196 patchs.

La version de l'image est généralement de 2048x2048 ou plus grande.

Les trois options qui précèdent 2024 et pourquoi elles échoueront:

1. Résisez jusqu'à la forme carrée fixe ((224x224 ou 336x336) ⋅ extrusion de texte et de visage humains ⋅ 下采样会破坏图表标签和 OCR 内容── 在 LLaVA-1.5 之前, c'était la pratique standard──
2. Le rapport d'aspect fixe du produit est un problème.
3. Le pad jusqu'au plus long côté. Il a été résolu, mais pour les images, 50% de Token seront gaspillés sur le padding.

Réponse de 2024-2025: Faites en sorte que le transformateur 吃下图像原生分辨率的补丁,并弄清楚如何把不同构成批量 打包成一个序列,同时避免浪费计算──

## 概念
### NaViT et le patch-n'-pack

NaViT(Dehghani et coll., 2023) est la preuve que cette méthode peut être mise à l'échelle de travail.

1. Pour chaque image du lot, selon la taille du patch sélectionnée (par exemple 14) calculer sa grille de patch originale.
2. Les patchs de chaque image se flatteront en leur propre séquence de longueur variable.
3. Tous les patchs de l'image seront concatenés en une longue séquence de lot.
4. Construire un masque d'attention à diagonale de bloc, faire des patchs d'image A
5. 携带每个补丁的位置信息(2D RoPE ou intégrations de position fractionnelle)。

Les trois images figurent dans le lot: 336x336 ((576 Token) 、224x224 ((256 Token) et 448x336 ((768 Token), qui deviennent une séquence de 1600 Token, avec un masque de bloc-diagonale de 1600x1600 ⋅ pas de rembourrage ⋅ pas de calcul ⋅ pas de dépense ⋅ Transformer peut traiter n'importe quel ratio d'aspect ⋅

NaViT a également introduit dans l'entraînement une chute de patch fractionnelle dans l'ensemble du lot.

### Les produits de la catégorie "récipients"

L'AnyRes de LLaVA-NeXT est un programme de remplacement de l'image.

1. De pré définition de collection choisir une mise en page de la grille (1x1) (1x2) (2x1) (1x3) (3x1) (2x2) 等 faire le plus correspondant à l'image de la relation d'aspect。
2. Il coupe l'image complète dans la grille; chaque carreaux devient une culture 336x336
3. En même temps, générez une miniature:整张图像大小到336x336, en tant que jeton de contexte mondial.
4. Chaque carreaux sera envoyé dans un code congelé 336 编码。Concatenate carreaux Token + thumbnail Token。

Pour une image, utilisez une grille 2x2 avec une miniature: 4 * 576 + 576 = 2880 Token visuels.

Lorsque votre codeur est gelé et ne prend en charge qu'une résolution, AnyRes est la première option. Il permet de créer une image de jeton numérique explosion.

### Le produit est le produit de l'équipement de la production de l'équipement.

Qwen2-VL introduit l'intégration de position rotative multimodale. Contrairement aux positions fractionnelles de NaViT ou à la carreaux-et-thumbnail d'AnyRes, chaque patch est équipé d'une position 3D:

M-RoPE 原生提供动态分辨率,无需重新训练――Inference 时输入任意 HxW 图像,patch embedder 生成 H/14 x W/14 个代币,每个代币 获得自己的 (t=0, r=row, c=col) 位置,RoPE Using correct frequency rotation Attention,完成──Qwen2.5-VL 和 Qwen3-VL 延续了这一点──V2PE de l'InternVL3 est la même pensée, juste selon la modalité 使用可编码──

Différent de NaViT, il est toujours attendu à chaque fois de plus, seulement pour traiter des images uniques.

### Le produit est le NaFlex (SigLIP 2)

NaFlex est le modèle natif de la ligne de contrôle SigLIP 2. Modèle: Un seul modèle dans l'inférence  Support multiple séquences lengths  256、729、1024 Token) 

语义任务(classification、retrieval) avec 256 Token。OCR 或图表理解用 1024 Token。无需重新训练。

### Le masque d'emballage

Le masque à diagonale de bloc est le plus facilement réalisé.`N_total`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `i=0..B-1`, leur durée`n_i`, forme pour`(N_total, N_total)`Le masque`M`Dans deux indices placés dans le même bloc d'image 时为 1,否则为 0. Vous pouvez le construire à partir de la liste de longueur cumulée:

```
offsets = [0, n_0, n_0+n_1, ..., N_total]
M[i, j] = 1 iff there exists b where offsets[b] <= i < offsets[b+1] and offsets[b] <= j < offsets[b+1]
```

Dans PyTorch, ça peut être utilisé.`torch.block_diag`Ou apparemment rassembler 一行实现── FlashAttention de la trajectoire de longueur variable(`cu_seqlens`) complètement saut à travers le masque, directement à l'aide de tensor de longueur cumulée dans les séquences  internes attend pour le lot typique, par rapport au masque dense 快约10x。

### Budgets des jetons

按任务选择策略:

- OCR / documents:1024-4096 Token。SigLIP 2 NaFlex à 1024, ou AnyRes 3x3 + miniature。
- Charts et UI:384-448 Orig生分辨率下 729-1024 Token。使用带max pixels cap 的 Qwen2.5VL résolution dynamique。
- Photos naturelles: 256-576 Token 就够了──下游 LLM 能看到足够信息──把 Token 花在内容密度高的地方──
- Vidéo: espace de mise en commun 后每 64-128 Token,2-8 FPS──L'enseignement 12.17 会讲这个──

Règles de production de 2026: choisir une capsule maximale de pixels par tâche, selon le rapport d'aspect original 编码到该 capsule,打包批量,并跳过填充;; Qwen2.5VL 暴露了`min_pixels`et `max_pixels`C'est pour cette rotation.


```figure
mm-patch-n-pack
```

## Utilisez-le
`code/main.py`Pour un ensemble d'images, l'utilisation de l'intégralité des images est associée à la réalisation du patch-n'-pack.

- 接收一个 (H, W) 图像尺寸列表──
- 按补丁尺寸 14 计算每张图像的补丁序列长度──
- Les mettre en un ensemble de longueur.`sum(n_i)`La séquence de la
- 构建块-diagonal attention mask (为了清晰起见,使用密集)
- Comparer le coût de l'emballage avec le carré et le carrelage de l'ensemble des matériaux.
- Pour un lot mixte ((receipt, graphique, capture d'écran, photo) imprimer la table du budget des jetons

Les chiffres de sortie expliquent pourquoi chaque VLM ouvert de 2026 utilise des patch-n'-pack.

## Je le livre.
本课生成 `outputs/skill-resolution-budget-planner.md` Donner un ratio d'aspect mixte 工作负载(OCR、charts、photos、videos frames) et le budget total des jetons, il choisira correctement la stratégie (((NaFlex、AnyRes、M-RoPE ou fixe), et sort par configuration de demande― lorsque vous faites des VLM dans le produit faire la taille 时使用此技能它能避免静默的10x Token 膨胀,否则会杀死延迟预算―

## 练习
1. Une échelle de partage de 600x1500 ((1:2.5)。 taille de patch = 14 时, combien de jetons à résolution native ?

2. Pour un lot de quatre images, construire un masque de bloc-diagonale, leur longueur est de 256,576,729,1024.`256^2 + 576^2 + 729^2 + 1024^2`个非零条目──

3. Pour un tableau, patch 14, comparez: a) taille carrée jusqu'à 336 后编码, b) AnyRes 2x1 + miniature, c) M-RoPE à native──哪种使用最少 Token?哪种保留最多细节?

4. 实现 fractionnel patch dropping: given determining a packed sequence, uniformly at random 丢弃 50% 的Token,并相应更新块-diagonal mask──测量 mask 的稀缺性 变化──

5. 阅读 Qwen2-VL 论文(arXiv:2409.12191) de la section 3.2──用两句话描述 `min_pixels`et `max_pixels`Le contrôle de ce que c'est, et pourquoi les deux frontières sont importantes.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Patch-n'-pack | "NaViT-style packing" | 将来自不同图像的可变长度 patch sequences concatenate 到一个 batch dimension 中 |
| Block-diagonal mask | "Packing mask" | Attention mask，将每张图像的 patches 限制为只 attend 自己，而不是 pack 中的相邻图像 |
| AnyRes | "LLaVA-NeXT tiling" | 将高分辨率图像切成固定大小 tiles 的 grid，并加一个全局 thumbnail；用固定 encoder 编码每个 tile |
| NaFlex | "SigLIP 2 native-flex" | 单个 SigLIP 2 checkpoint，可在 inference 时服务 256/729/1024-Token budgets，无需重新训练 |
| M-RoPE | "Multimodal RoPE" | 3D rotary position encoding（time、row、column），无需 position tables 即可处理任意 H、W、T |
| cu_seqlens | "FlashAttention packing" | FlashAttention varlen path 使用的 cumulative-length tensor，用来替代 dense block-diagonal mask |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的 per-request knobs，用于限制非常小或非常大输入上的 Token count |
| Visual token budget | "How many tokens per image" | 每张图像发出的 patch Token 粗略数量；决定 LLM 的 prompt budget 和 Attention cost |

## 延伸阅读
- [Dehghani et al. — Patch n' Pack: NaViT (arXiv:2307.06304)](https://arxiv.org/abs/2307.06304)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Laurençon et al. — What matters when building vision-language models? (Idefics2, arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
