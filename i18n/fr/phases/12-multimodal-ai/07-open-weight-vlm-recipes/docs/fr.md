# Récipes VLM à poids ouvert: ce qui est vraiment important ?

> La littérature VLM en poids ouvert de 2024-2026 est une série de tables d'ablation de la forêt. La MM1 d'Apple a testé 13 types d'encodeurs d'images, de connecteurs et de mélanges de données.

**Type:** Learn + lab
**Languages:** Python (stdlib, ablation table parser + recipe picker)
**Prerequisites:** Phase 12 · 05 (LLaVA baseline)
**Time:** ~180 分钟

## Objectif de l'apprentissage
- Il s'agit d'un espace de conception VLM:encodeur d'image, connecteur, LLM, mixage de données, calendrier de résolution.
- 阅读 MM1 / Idefics2 / Cambrian-1 table d'ablation,并预测哪个按 会改变给定基准──
- Dans le cas d'un budget et d'un mélange de tâches de calcul, choisissez une nouvelle recette de VLM (encodeur, connecteur, données, résolution).
- Expliquez pourquoi le nombre de symboles est le même.

##  problématique
已有数百个开放权重VLM──大多从好到最先进的差距不来自建筑,而是来自数据,分辨率时间表和编码选择──当你的模型表现不佳时,知道先调哪个按,可以避免一次500万 GPU 小时的错误──

2023 年浪潮(LLaVA-1.5、InstructBLIP、MiniGPT-4) basé sur la préparation au coup de titre + LLaVA-Instruct-150k──不错的基线──上限约在MMMU 35%──

Les VLM ont fait le plus d'ablations possibles.

## 概念
### 五轴 espace de conception

Idefics2 ((Laurençon et al., 2024) ont nommé ces axes:

1. Encodeur d'image: Clip ViT-L/14、SigLIP SO400m/14、DINOv2 ViT-g/14、InternViT-6B──Encodeurs en taille de patch、résolution 和 objectif de prétrainage 上不同──
2. Connecteur──MLP(2-4 couches)、Q-Former(32 requêtes + cross-attn)、Percepteur Re-Sampler(64 requêtes)、C-Abstractor(convolution + pooling bilinéaire)。
3. Modèle de langage: Llama-3 8B / 70B, Mistral 7B, Phi-3, Gemma-2, Quwen2,5
4. Les données de formation sont fournies par les équipes de formation.
5. Résolution du calendrier de résolution ⋅ Fixé 224/336/448 ⋅ AnyRes ⋅ dynamique native ⋅ en cours de formation

Chaque production VLM ville sur chaque axe 上做选择── la plupart des variations des scores MMMU sont expliquées par les axes 1、4 和 5 ⋅ au lieu de par le connecteur que vous avez choisi ⋅ expliqué──

### Axe 1:encodeur > connecteur

MM1 Section 3.2 显示: de CLIP ViT-L/14 换成 SigLIP SO400m/14,MMMU 增加 3+ points。 de MLP 换成 Perceiver Resampler,增加不到 1 point。Idefics2 复现这一点:SigLIP > CLIP,Q-Former ≈ MLP ≈ Perceiver,在同等代币计下相近。

Le classement des encoders de vision cambriennes est composé de plus de 20 encoders. Le classement des encoders de vision cambrienne est composé de 5 à 7 points.

L'encodeur par défaut des VLMs ouverts de 2026 est utilisé pour les fonctionnalités sémantiques + denses de SigLIP 2 SO400m/14, parfois rencontré avec DINOv2 ViT-g/14 fonctionnalités 拼接(Cambrian Spatial Vision Aggregator 就这样做)

### Axe 2: conception du connecteur 差异不大

MM1、Idefics2、Prismatic 和 MM-Interleaved ont été réalisés à la même conclusion: dans le nombre fixe de jetons visuels, l'architecture du connecteur est presque non importante, pour les patchs à double couche utilisant le même budget de jetons, la distance de performance de 32 requêtes Q-Former n'est pas de 1 point.

Il est vraiment important de compter les jetons. Plus de jetons visuels = 更多 LLM compute = 更好表现,直到某个点后收益递减.

Q-Former vs MLP est un problème de coûts, pas de qualité: quelle que soit la résolution de l'image 如何, Q-Former 都把 token 限制在 32-64;MLP 输出全部补丁 token──对高分辨率输入,Q-Former 省 LLM context;对低分辨率,差异只是噪声──

### Axe 3: Taille de la LM détermine la limite

Dans chaque article du VLM, pour faire passer le LLM de 7B à 13B, on peut généralement faire en sorte que le MMMU augmente de 2 à 4 points.

C'est pourquoi Qwen2.5VL-72B et Claude Opus 4.7 sont les meilleurs au monde en termes de langage. Un VLM 7B ne peut pas se fier à une conception de connecteur intelligente.

### Axe 4: données  详细的人类字幕 胜过蒸留

Molmo + PixMo(Deitke et coll., 2024) est le résultat de 2024 que tout le monde devrait lire. Allen AI 让人类标注员使用 1-3 分钟的密集语文通文通行传递 描述图像, obtenir 712K images avec des sous-titres denses.

Molmo-72B en 11/11 个基准 上击败 Llama-3.2-90B-Vision。 La différence n'est pas dans l'architecture, mais dans la qualité des légendes。

Les résultats de la recherche ont été obtenus en raison de la forte concentration de l'eau dans les eaux de l'Afrique du Sud.

### 5ème axe: résolution  et calendrier

Les ablations de Idefics2:384 -> 448  augmenter 1-2 points──448 -> 980 配合 image splitting(AnyRes) dans les benchmarks OCR 上再增加 3-5──Flat resolution training 会在中等 précision 附近平原; résolution ramping(à partir de 224 开始,以 448 或 native 结束)

Cambrian-1 a fait une résolution contre des jetons Comparatif: dans le calcul fixe, vous pouvez choisir une résolution basse, plus de jetons, ou une résolution élevée, moins de jetons.

Récipes de production 2026:Étape 1 以 384 fixé  entraînement,Étape 2 pour les tâches OCR lourdes Utilisation de résolution dynamique maximale de 1280 ⋅

### Comparatif prismatique

Les VLM prismatiques ((Karamcheti et coll., 2024) sont des documents contrôlant tous les axes.

- Compte visuel-token par image  expliquer environ 60% de variance。
- Choix de codeur  explication environ 20%。
- L'architecture du connecteur 解释约 5%──
- 其他所有因素(data mix、scheduler、LR) expliquer le reste d'environ 15%──

Ceci est une décomposition grossière, mais aussi une réponse claire à la question que je devrais abler d'abord.

### 2026 année de sélection

Basé sur des preuves, la recette de VLM ouvert à titre d'option pour les nouveaux projets de 2026:

- Encoder: résolution native 下的 SigLIP 2 SO400m/14 avec NaFlex; si besoin de segmentation/terrestation,则拼音 DINOv2 ViT-g/14 以获得密集功能──
- Connecteur: patch tokens 上的2层 MLP──除非 token-constraint,否则跳过Q-Former──
- LLM: Qwen2.5 / Llama-3.1 / Gemma 2;7B Utilisé pour le coût, 70B Utilisé pour la qualité, selon la latence cible 选择──
- Données:PixMo + ShareGPT4V + Cauldron,并用任务特定指示数据 补足。
- Résolution: dynamique (长边 min 256、max 1280 pixels)
- Étapes: alignement de la phase 1 (seulement le projecteur)  Étapes 2 et 2 - mise en forme complète  Étapes 3 - mise en forme spécifique à la tâche 

Chacun de ces éléments de référence peut être daté des derniers articles de ce cours.


```figure
l5-vlm-recipe-knobs
```

## Utilisez-le
`code/main.py`Il est un analyseur de table d'ablation et un sélecteur de recettes. Il a codé MM1 et Idefics2.

-  Donnez-moi un budget X et une tâche Y, quelle recette 胜出?
- Si j'étais à 7B Llama, j'aurais changé SigLIP en CLIP, combien est le delta de MMMU ?
- Pour obtenir une réponse de confiance de 80%, je devrais d'abord ablater quel axe ?

输出 est une liste de recettes classées, contenant des délais de référence prévus et des recommandations de première édition.

## Je le livre.
本课生成 `outputs/skill-vlm-recipe-picker.md` un mix de tâches à but déterminé, un budget de calcul et un objectif de latence, il produira une recette complète, un codeur, un connecteur, un programme de résolution, et pour chaque choix de référence à l'ablation correspondante, il peut empêcher les ingénieurs de réélaborer une table d'ablation des idées à chaque début de projet VLM.

## 练习
1. Pour le programme de formation 2B fixe, dans le budget de 50M images, quel codeur a gagné ? Si c'est changé en programme de formation 13B, l'acte va-t-il changer ? Pourquoi ?

2. Cambrian-1 发现,拼音 DINOv2 + SigLIP 在视觉中心的基准上胜过单独使用任一者,但在MMMU上没有新增信号──预测哪些基准会升升,哪些会持平──

3. Votre objectif est de construire un agent de l'interface utilisateur mobile. Choisir un encodeur, un connecteur, une résolution et un mélange de données.

4. Molmo a publié des modèles 4B et 72B. Les 4B et les 7B VLM fermés sont compétitifs.

5. Œuvre d'un tableau d'ablation, utilisé dans le 7B VLM 上隔离 data-mix quality 和 encoder quality── le moins nécessaire pour le nombre de séances de formation? proposer quatre réglages d'axe──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Ablation | “调一个 knob” | 训练多次 runs，它们只在一个 design-space axis 上不同，其他全部保持 constant |
| Connector | “Bridge” / “projector” | 将 vision encoder output 映射到 LLM token space 的 trainable module（MLP、Q-Former、Perceiver） |
| Detailed human caption | “Dense caption” | 多句人类撰写的描述（通常 80-300 tokens），比 web alt text 更丰富 |
| Distillation | “GPT-4V captions” | 由更强的 proprietary VLM 生成的 training data；方便，但容易继承 hallucination |
| AnyRes / dynamic res | “High-res path” | 通过 tiling 或 M-RoPE 输入大于 encoder native resolution 的图像的 strategy |
| Resolution ramp | “Curriculum” | 从 low-resolution 开始并逐步提高的 training schedule，可加快 alignment learning |
| Vision-centric bench | “CV-Bench / BLINK” | 强调细粒度 visual perception，而非 language-heavy reasoning 的 evaluation |
| PixMo | “Molmo's data” | Allen AI 的 712K densely-captioned image dataset；人类语音被转写为 dense captions |

## 延伸阅读
- [McKinzie et al. — MM1 (arXiv:2403.09611)](https://arxiv.org/abs/2403.09611)
- [Laurençon et al. — Idefics2 / What matters building VLMs (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Deitke et al. — Molmo and PixMo (arXiv:2409.17146)](https://arxiv.org/abs/2409.17146)
- [Tong et al. — Cambrian-1 (arXiv:2406.16860)](https://arxiv.org/abs/2406.16860)
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865)
