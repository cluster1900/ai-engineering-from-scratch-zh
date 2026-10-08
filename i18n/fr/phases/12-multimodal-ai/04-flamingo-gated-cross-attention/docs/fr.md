# Flamingo et les VLM à faible portée

> Le modèle de DeepMind a réalisé deux choses plus tôt que les autres. Il prouve qu'un seul modèle peut traiter des images, des vidéos et des textes en séquence de synchronisation arbitraire. Il prouve également que les VLM peuvent être effectués dans le contexte.

**Type:** Learn
**Languages:** Python (stdlib, gated cross-attention + Perceiver resampler demo)
**Prerequisites:** Phase 12 · 03 (BLIP-2 Q-Former)
**Time:** ~120 minutes

## Objectif de l'apprentissage
- 解释 gated cross-attention 如何通过 tanh(gate) = 0 在初始化时保留结 LLM 的文本能力──
- 逐步讲解 Reéchantillonneur de percepteur: N 个 image patches → K 个 fixe latentqueries, travers l'attention croisée 完成。
-  description Flamingo  comment utiliser le masquage causal de la position de l'image  traitement des séquences d'image-texte 
- 复现 quelques coups Multimodal prompt 结构(3 个 image-caption Example, puis une image de requête)。

##  problématique
BLIP-2 va faire 32 jetons visuels 输入结 LLM's input layer。 chaque prompt 图像时可以工作。 mais si vous voulez importer*多张* avec des images de texte, par exemple                                                                                                                                                                                                                                      

Flamingo répond à cette question: ne modifiez pas complètement le flux d'entrée de LLM. Dans les blocs existants de LLM, il y a des couches de l'attention croisée supplémentaires entre les couches. Les jetons de texte sont toujours comme d'habitude dans le processus de LLM.

Flamingo répond à la deuxième question: comment traiter chaque prompt avec un nombre d'images variable ?Le rééchantillon de percepteur  Un petit module d'attention croisée, qui reçoit un nombre arbitratif de patchs, et génère un nombre fixe de jetons visuels latents.

## 概念
### Le LLM congelé

Flamingo 结的Chinchilla 70B LLM 开始──全部 70B weights 保持不变──现有文本 自注意 和 FFN 正常运行──

### Remplacement de l'échantillon de percepteur

Pour le prompt en milieu de chaque image, ViT va générer N 个 patch tokens── le reéchantillon de percepteur a K 个 fixes latences apprenables(Flamingo utilise K=64)── chaque bloc de reéchantillon a deux étapes:

1. Attention croisée: K 个 latences attend jusqu'à N 个 patch tokens ((Q de latences, K / V de patches) ⋅
2. L'attention à soi + FFN

Après avoir passé 6 blocs de repérage, le produit est K=64 个 dim 1024 de jetons visuels, peu importe le nombre de jetons de ViT.

Pour les vidéos, le échantillon sera appliqué en temps: chaque patch se compose de 64 patches latences, tandis que le codage positionnel temporel se démarque de t=0 et t=N [...].

### Attention croisée par voie ferrée

Dans le cadre de la formation de la M.L.M. entre les deux niveaux, le M=4 est inséré dans un nouveau bloc de l'attention croisée:

```
x_after_llm_block = llm_block(x_before)
cross = cross_attn(x_after, resampler_output)
gated = tanh(alpha) * cross + x_after
x_before_next_block = gated
```

- `alpha`C'est une échelle appréciable de zéro initialisation.
- `tanh(0) = 0`, donc initialisation en branche fermée  contribuer pour zéro.
- Avec moi .`alpha`远离零,cross-attention 贡献会平滑增长──
- La connexion résiduelle signifie que même si la porte est complètement ouverte, elle ne couvrira pas le texte de la LLM.

C'est le choix de conception le plus important de Flamingo: le conditionnement visuel est additif, fermé, et à l'initialisation, pour le zéro.

### Utilisé pour la mise en scène masquée des entrées interdites

Dans le même ordre que "<image A> caption A <image B> caption B <image C> ?" , chaque jeton de texte  devrait seulement voir les images de la séquence précédente ∙`t`Les jetons de texte suivent seulement l'index d'image `i < i_t`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `i_t`est position `t`之前最近的图像──只看最近的前置图像或看到所有的前置图像都是有效选择; Flamingo 选择前者──

### Apprendre en quelques coups dans le contexte

Le rappel flamingo ressemble à:

```
<image1> A photo of a cat. <image2> A photo of a dog. <image3> A photo of a
```

模型看补全模式并输出 "bird" () 图片3 显示的任何内容) ⋅没有 Gradient steps──结 LLM's in-context learning 能力通过门禁横断注意保留下来

### Données de formation

Flamingo utilise trois données:

1. MultiModal MassiveWeb (M3W):43 millions de pages contiennent des images et du texte, reconstruit en suivant le même ordre:
2. Par exemple, les paires d'images et de texte (ALIGN + LTIP) sont de 44 milliards de mots.
3. Partage de vidéos-texte (VTP): 27 millions de clips vidéo courts.

OBÉLICS (en 2023) sont des modèles de communication ouverts, des idées, des idées et de la plupart des modèles ouverts, comme les flamingos, qui sont tous formés.

### OpenFlamingo et la lentille

OpenFlamingo(2023) est ouvert à nouveau.

Otter(2023) basé sur OpenFlamingo, et MIMIC-IT(((((un Numéro de données) sur effectuer l'écoute des instructions, indiquant une attention croisée fermée également applicable à l'instruction suivante。

### Les descendants

- Idéfics / Idefics2 / Idefics3: L'attention croisée de la face accrocheuse, progressivement simplifié (Idefics2  abandonner le modèle,改为使用带适应性聚合的直接补丁代币) ⋅
- La transition Flamingo-Chameleon: jusqu'en 2024, de nombreux équipes se tournent vers la fusion précoce.
- L'entrée interlevé de Gémeaux: conceptuellement, il a hérité de la flexibilité interlevé de Flamingo, bien que le mécanisme soit propriétaire.

### Comparé à BLIP-2

| | BLIP-2 | Flamingo |
|---|---|---|
| Visual bridge | 输入处一次性使用 Q-Former | 每 M 层使用 gated cross-attention |
| Visual tokens | 每张图像 32 个 | 每张图像每个 cross-attn layer 64 个 |
| Frozen LLM | Yes | Yes |
| Few-shot in-context | 弱 | 强 — 论文的核心 |
| Interleaved inputs | 无原生支持 | Yes，设计目标 |
| Training data | 130M pairs | 1.3B pairs + 43M interleaved pages |
| Parameter count | 188M trained | ~10B trained (cross-attn layers) |
| Compute | 8 个 A100 上数天 | 数千个 TPUv4 上数周 |

预算有限的单图 VQA 选择BLIP-2──需要交错输入、少数投注或多图推理时选择Flamingo/Idefics2──


```figure
cross-attention-fusion
```

## Utilisez-le
`code/main.py`演示:

1. Dans 36 faux patch tokens, utilisez 8 latences appréciables (pure attention croisée Python)
2. Un pas de l'attention croisée fermée, parmi eux.`alpha = 0`→ 输出等于输入 (LLM 不变), puis `alpha = 2.0`→ 混入视觉贡献──
3. Un constructeur de masques interleavés, pour "(image 1) (texte 1) (image 2) (texte 2)" 序列生成 2D attention mask。

## Je le livre.
本课产 出 `outputs/skill-gated-bridge-diagnostic.md` Donner une configuration VLM ouverte (resampleur Y/N、cross-attn frequency、gate scheme), il reconnaîtra les éléments de lignée Flamingo et expliquera la stratégie de congélation.

## 练习
1. 计算 Flamingo-9B's visuel paramètre count:9B LLM + 1.4B garées couches de l'attention croisée + 64M resampler── quelle est la proportion de l'entraînement paramètres pour le total paramètres ?

2. Dans PyTorch, réaliser des résidus fermés `y = tanh(alpha) * cross + x` À travers des expériences`alpha=0`时, initiale `y==x`Il est vrai.

3. 阅读OpenFlamingo Section 3.2(arXiv:2308.01390), comprendre comment ils traitent le lot de nombreuses images dans chaque demande en fonction du nombre d'images différentes, décrire la stratégie de rembourrage

4. Pourquoi le masque d'attention croisée de Flamingo  laisse le jeton texte assister à la * la plus récente * image préposée, plutôt que toutes les images préposées ?

5. Dans le contexte, quelques coups: pour une nouvelle variante Flamingo 构建一个包含 4 个图像 → principal objet de couleur exemples de prompt── description When the number of examples from 0 to 8  change, the expected accuracy pattern 如何变──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Perceiver resampler | "Fixed-latent cross-attention" | 从可变数量的 input patches 中生成 K 个固定 tokens 的 module |
| Gated cross-attention | "Tanh-gated bridge" | residual layer `y = tanh(alpha)*cross + x`，learnable alpha，初始化为 0 |
| Interleaved input | "Mixed sequence" | 图像和文本按阅读顺序自由混合的 prompt format |
| Frozen LLM | "No LLM gradients" | 文本 LLM 的 weights 不更新；只训练 resampler + cross-attn layers |
| Few-shot | "In-context examples" | 在 prompt 中给出少量（image, answer）对；模型无需 finetuning 即可泛化 |
| OBELICS | "Interleaved web corpus" | 包含 141M 个网页的开放数据集，图像和文本按阅读顺序排列 |
| Chinchilla | "70B frozen base" | Flamingo 的冻结文本 LLM，来自 DeepMind 的 Chinchilla paper |
| Gate schedule | "How alpha moves" | 训练期间 cross-attention gate 打开的速率 |
| Cross-attn frequency | "Every M layers" | 插入 gated cross-attention block 的频率；Flamingo 使用 M=4 |
| OpenFlamingo | "Open reproduction" | MosaicML/LAION 的 3-9B 开放 checkpoint；architecture 与 Flamingo 相同 |

## 延伸阅读
- [Alayrac et al. — Flamingo (arXiv:2204.14198)](https://arxiv.org/abs/2204.14198) 原始论文──
- [Awadalla et al. — OpenFlamingo (arXiv:2308.01390)](https://arxiv.org/abs/2308.01390) 开放复现──
- [Laurençon et al. — OBELICS (arXiv:2306.16527)](https://arxiv.org/abs/2306.16527) 交错网页语料──
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) 通用 Architecture du percepteur。
- [Li et al. — Otter (arXiv:2305.03726)](https://arxiv.org/abs/2305.03726) 经过 instruction-tuned 的 Flamingo 后续模型──
- [Laurençon et al. — Idefics2 (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246) L'approche flamingo de la modernité simplifiée
