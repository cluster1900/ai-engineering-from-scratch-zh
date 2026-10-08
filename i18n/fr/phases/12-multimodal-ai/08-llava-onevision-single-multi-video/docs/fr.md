# LLaVA-OneVision: une seule image dans un modèle, plusieurs images et vidéos

> Avant la mise en place de VLM World has a a distinct spectrum: pour une seule image LLaVA-1.5, un modèle multi-image comme Mantis et VILA, ainsi que des modèles vidéo comme Video-LLaVA et Video-LLaMA. Chacun a gagné sa propre référence, mais a échoué dans d'autres scénarios.

**Type:** Build
**Languages:** Python (stdlib, token budget solver + curriculum planner)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 12 · 06 (any-resolution)
**Time:** ~180 minutes

## Objectif de l'apprentissage
- Design a maintenir un étalon visuel constant entre les entrées de plusieurs images et vidéos  Budget。
- 排列一训练课程, faire des compétences de l'image unique à la vidéo, tout en évitant l'oubli catastrophique.
- Expliquez pourquoi, dans la même dimension, si le programme est bien fait, un modèle unique vaincra le modèle spécialiste.
- Il s'agit d'une série de fonctionnalités qui ont été développées par l'entreprise pour la première fois en 2008.

##  problématique
Les images, les images et les vidéos sont diffusées à différentes reprises.

单图像需要高分辨率 Token(AnyRes,约2880 视觉代币) pour capturer OCR 和细节──每个样本的预算:1张图像,2880 代币──

Il faut un tableau à grande résolution pour chaque image (environ 576 Tokens), de sorte que les images peuvent être analysées dans le contexte.

视频需要许多低分辨率(pooling 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后后每约196 代币) 后后每约196 代币) 后后后每约196 代币) 后后每约196 代币,后每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每每

Si vous entraînez plusieurs modèles indépendants, vous choisissez un budget pour chaque modèle. Si vous entraînez un modèle, vous devez faire en sorte que le budget se réduise raisonnablement entre les différents scénarios, sans pouvoir explorer le contexte.

En OneVision  précédent, la réponse est  entraîner un scénario, ignorer les autres scénarios ──Video-LLaVA                                                                                                                                                                                                                                             

## 概念
### OneVision Token  budgèt

LLaVA-OneVision  choisit un ensemble de jetons visuels  budget, chaque échantillon environ 3000-4000 jetons, et distribué selon les différentes scènes:

- 单图像:AnyRes-9(3x3 carreaux + miniature), chaque carreaux pour 384, contient 729 patch, utilisant un pooling bilinéaire 2x2 activé → Chaque carreaux 182 个 Token。总计:9 * 182 + 182 = 1820 个 Token。或 AnyRes-4, chaque carreaux 729 个 Token = 2916 + 729。
- Pour les images, il est nécessaire de faire une mise en page complète.
- 视频:32 ,384 分辨率, utiliser激进的3x3 bilinéaire de la piscine → 每 81 个代币──总数:32 * 81 = 2592 个代币──

Cette distribution permet de maintenir le nombre de jetons en série. LLM ne verra jamais le lot de contextes de conflit.

### 3e étape du programme

LLaVA-OneVision, trois étapes de formation:

1. 单图像 SFT(étape SI) ―― tous les données sont une seule image-plus-texte―utiliser une haute résolution AnyRes 输入训练― This会教会模型感知、OCR 和细粒度理解―utiliser LLaVA-NeXT 数据加上 OneVision-specific 单图像数据―
2. Une vision SFT(étape OV)。混合单图像 + 多图像 + 视频(均采样)。在统一代币 预算上训练。这会教会模型处理异构批形──不重置权重,而是从阶段 SI 继续──
3. Transfert de tâches (étape TT) ◊ Continuer à utiliser le groupe de tâches cibles, généralement en fonction du produit nécessitant une surcharge d'images ou de vidéos ◊ Option de mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre.

关键点:curriculum 顺序很重要──即使使用相同数据,先训练视频或先训练多图像,也会比先训练单图像得到更差的图像性能──论文明确实做了这一消融──

### Pourquoi le programme est efficace

单图像训练建立感知基础──Patch Token 携带细粒度视觉特征;LLM 学会把它们与文本整合──多图像和视频引入结构性挑战(哪张图像是哪张,什么先发生), si aucune base de perception solide n'existe, ces défis sont difficiles à relever──

Si vous commencez à mélanger tous les scénarios à partir de zéro, le modèle sera inadapté à la perception de chaque lot, et à la structure adéquate à la conception de nombreux images/vidéos.

Le programme de formation vous permet d'obtenir une intensité de perception à partir de la phase SI, de recommencer à la phase OV et d'acquérir la capacité de calcul du temps sans perdre aucune partie.

### 跨场景 compétences émergentes

LLaVA-OneVision 论文 a rapporté trois capacités émergentes:

1. Le raisonnement multi-caméras── séparément dans plusieurs images + vidéos; lors de la formation, il est demandé de comprendre un scénario de conduite à plusieurs caméras── bien que le modèle ne soit jamais venu à l'épreuve dans la formation, il peut encore intégrer correctement plusieurs points de vue──
2. L'utilisation de la marque de référence est une méthode de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence.
3. L'utilisateur fournit un écran d'iPhone, et il a besoin de planifier la prochaine fois.

Ce ne sont pas des tâches de formation; elles sont issues de la structure composée du programme.

### 视觉 Le regroupement de jetons

Les jetons  budgétaire nécessitent un pooling. OneVision dans le réseau de patch 2D 上 utilise une interpolation bilinéaire:24x24 = 576 个补丁 变成 12x12 = 144(2x factor) ou 8x8 = 64(3x factor) ⋅ Pooling dans le réseau de patch 空间完成, plutôt que dans le Token 空间完成, pour conserver la localité ⋅

Chaque scène de pooling est un facteur de choisir en soi un hyperparamètre.

### LLaVA-OneVision-1.5

La version suivante de 2025 est la suivante: LLaVA-OneVision-1.5, arXiv 2509.23661) est complètement ouverte sur les données de formation, le pouvoir et le code du modèle. Elle réduit la différence avec le modèle propriétaire dans certains indicateurs de référence, et rend cette approche plus démocratique.

### Comparé à Qwen2,5-VL

Qwen2.5-VL(Létion 12.09) a fait un choix différent. Il utilise M-RoPE et FPS dynamique, plutôt que le pooling fixe. Son budget sera avec une entrée en échange: 1 minute de vidéo utilisée.


```figure
l5-onevision-budget
```

## Utilisez-le
`code/main.py`C'est un programme et un budget de VLM de style OneVision. Il est utilisé pour déterminer chaque échantillon de Token Budget, ainsi qu'un ensemble de scénarios cibles (par exemple, 40% d'images uniques, 30% de photos multiples, 30% de vidéos), il sera:

- Pour chaque scène, la résolution de la répartition de la résolution, le facteur de regroupement et les cadres.
- Check si chaque scène est dans le budget commun ⋅
- 报告预期 Token 数量、LLM FLOPs, ainsi que les scénarios sous-tokénisés
- 打印逐阶段训练计划──

Utilisez-le pour planifier une mise à jour de OneVision ou pour vérifier le coût de chaque demande de déploiement de VLM.

## Je le livre.
本课会产出 `outputs/skill-onevision-budget-planner.md` Donner une distribution de tâches et un budget de chaque échantillon, il produira un facteur AnyRes, un regroupement par cadre, un nombre de vidéos et des poids de la phase du programme.

## 练习
1. Vos produits supportent 80% 单图像、10% 多图像(2-4 张图像)、10% 视频(8-16 ) ・・・ Design Token 预算──由于不做重度多图像而省下额外预算, où allez-vous le mettre?

2. 阅读 LLaVA-OneVision Section 4.3 (capacités émergentes)  propose un programme de formation possible à débloquer, mais aucun article ne rapporte qu'une quatrième compétence émergente

3. 交换课程 顺序:先训练多图像,再训练单图像,最后训练视频──预测哪些基准会下降,以及原因──

4. Le rapport de l'article de référence vidéo chaque échantillon ne nécessite que 8 exercices. Cela peut-il se transformer en un vidéo de 30 secondes de temps de réflexion ?

5. Pour le partage de 24x24, il faut faire un pooling bilinéaire jusqu'à 12x12, en réduisant 4x chaque dimension.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OneVision scenario | “单图像、多图像，或视频” | 统一 VLM 处理的三种输入 shape 之一；预算在三者之间保持恒定 |
| Token budget | “每个样本多少 Token” | LLM 在每个训练/推理样本中看到的视觉 Token 总数，通常为 3000-4000 |
| Curriculum | “训练顺序” | 为了 emergent transfer 而选择的阶段排序（单图像 → 多图像 → 视频） |
| Bilinear pooling | “Token 缩减” | 对 patch grid（2D）应用 bilinear interpolation，以在保留局部性的同时减少 Token 数量 |
| Emergent skill | “没训练过，但仍然能用” | 由于 curriculum composition，在没有匹配训练数据的情况下于推理时出现的能力 |
| AnyRes-k | “k-tile setup” | k 个固定分辨率子 tile 加一个 thumbnail，典型 k ∈ {4, 9} |
| Task transfer | “跨场景泛化” | 在单图像上学到的技能，通过共享 backbone 应用于视频（反之亦然） |

## 延伸阅读
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326)
- [LLaVA-OneVision-1.5: Fully Open Framework (arXiv:2509.23661)](https://arxiv.org/abs/2509.23661)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Lin et al. — VILA (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
