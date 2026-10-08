# InternVL3: Pré-entraînement multimodaux natif

> Le programme de formation est basé sur la conception de la conception de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience de l'expérience.

**Type:** Learn
**Languages:** Python (stdlib, training-corpus mixer)
**Prerequisites:** Phase 12 · 05, Phase 12 · 07 (recipes)
**Time:** ~120 minutes

## Objectif de l'apprentissage
- 解释为什么后期VLM training 会累积对齐债务,并引用三个可测量症状(oubli catastrophique、attribution de réponses、incohérence visuelle-textuelle)
- 描述 InternVL3's native pre-training corpus mix, ainsi que le texte : interlevées : proportion de sous-titres:
- Comparer V2PE avec M-RoPE de Qwen2-VL
- Dites-moi que le routeur de résolution visuelle (ViR) et le langage de vision découplé (DvD) sont deux optimisations de déploiement.

##  problématique
La formation post-hoc de la VLM est une pratique standard. Les étudiants de la LVA, BLIP-2, Qwen-VL, Idefics, recevront une formation prétrainée de la LLM, Llama, Vicuna, Qwen, Mistral, et rejoindront la vision.

1. LLM gelé + encodeur de vision gelé + projecteur entraîneur, en couples de sous-titres
2. Défriger le LLM, dans les données d'instruction
3. - Les éditions de la section "Préparation"

Les taux de déficit de l'alignement 会表现出三个症状:

- L'oubli catastrophique. Le VLM va oublier le texte seulement.
- Réponse dérive. Les modifications de la même question visuelle obtiennent des réponses différentes.
- L'incohérence visuelle-textuelle. Le VLM peut décrire correctement une image, puis répondre à un problème de contradiction avec sa propre description.

Ces symptômes sont bien documentés. MM1.5 Section 4 sur eux ont été quantifiés. Les ablations de LLaVA-OneVision les ont également suggérés.

## 概念
### Pré-entraînement multimodaux natif

InternVL3 à partir du début de formation dans un corpus de multimodale d'origine.

- 40% de données uniquement textuelles ((FineWeb、Proof-Pile-2 etc)
- 35% de données entrelacées entre images et textes (à la manière OBELICS、MMC4)
- 20% de données de sous-titres d'images parallèles
- 5% de données vidéo-texte

Les jetons de vision, les jetons de texte, ainsi que les interactions intermodelles, sont tous partis de la première étape du gradient  commencer à participer à la même perte ⋅ pas de prétraining d'alignement, pas de phase de congélation du projecteur, ni besoin de récupérer l'oubli catastrophique ⋅

Le modèle de base est un entraînement de phase unique.

### V2PE (codation de position visuelle variable)

Qwen2-VL Utilisation M-RoPE,并 adoption d'une allocation d'axe fixe。InternVL3  introduction V2PE:position encoding 会按 modality type((text、image、video) changement,并带有可学习扩展──实践中:

- Les jetons de texte  obtenir une position 1D (index de texte)
- Les patchs d'image  obtenir position 2D ((row, col) 。
- Les images vidéo  obtenir position 3D ((temps, rangée, colonne) ⋅

Les trois participants partagent la même base de fréquences RoPE, mais l'allocation de dim-occultation de chaque bande est un paramètre d'apprentissage, et non un divisor fixe.

Prétendance d'ablation de V2PE: dans le même calcul, les indices de référence vidéo par rapport à M-RoPE sont élevés de 1 à 2 分── pas une modification révolutionnaire, mais plus propre──

### Routeur à résolution visuelle (ViR)

L'optimisation du déploiement. Il n'y a pas besoin de codage à haute résolution. Si l'objet est en code natif de 1280px, il perdra des jetons.

Environ 60% des requêtes de trafic de production utilisent un taux faible ou moyen de rendement suffisant.

### Déploiement de la vision-langue déconnectée (DvD)

Lorsque vous servez un grand VLM, un encodeur de vision Chaque image fonctionne une fois, mais LLM va servir chaque jeton de sortie pour la récupération de fonctionnement.

Pour un modèle d'encodeur 8B + 400M, le co-loqué de DVD en comparaison, le débit de chaque module peut être multiplié par deux.

### Qualité en un seul stade par rapport à celle en plusieurs étapes

InternVL3  principale référence de référence: dans les paramètres 78B 下匹配 Gemini 2.5 Pro 的 MMMU-Pro──在 38B 下匹配 GPT-4o──在 8B 下领先 open-8B leaderboard──全部基于单阶段预训+指令调节配方──

L'hypothèse de l'alignement-dette est à démontrer: par rapport au gain de la vision-benchmark, InternVL3-8B perd les fractions de l'indexation du texte de référence (MMLU、GSM8K), par rapport à Qwen2.5-VL-7B, et moins. Ce modèle ressemble plus à un généraliste, parce que l'entraînement est un ensemble, et non deux parties.

### Les résultats de l'enquête

InternVL3.5 (août 2025) a étendu cette recette.

InternVL-U(2026) rejoindre la génération unifiée, est dans le même médulature 顶部通过MMDiT heads 输出图像──在这里"U" 代表"Understanding + generation", suivre les modèles unifiés de style Transfusion(Lesson 12.13)──

### Pré-entraînement natif

Pré-entraînement natif n'est pas gratuit:

- Compute── de la tête à la tête de l'entraînement d'un nouveau VLM et de l'entraînement d'un LLM de texte Égalité: plusieurs millions d'heures GPU── adaptation post-hoc  Répondre aux poids existants de LLM, économiser la plupart des coûts──
- Les données, les images et le texte interligés à grande échelle sont rares. Les obélices ont 141 millions de documents, les MMC4 ont 571 millions.
- Reutilisation de base de l'LLM. Le prétrainage natif a été abandonné après avoir été remplacé par un nouvel LLM.

Les prêts de l'alignement sont plus élevés que les pertes de réutilisation, et les critères de référence sont plus élevés.


```figure
l5-native-pretrain
```

## Utilisez-le
`code/main.py`C'est un mélangeur de formation et un simulateur de routeur ViR.

- 接收一个目标 corpus mix(%text、%interleaved、%caption、%video),并计算每种方式的预期步骤──
- Dans un groupe de requêtes, la distribution: 50% de faible détail, 30% de moyenne, 20% de haute détail), et le nombre moyen de jetons.
- basé sur des chiffres d'affaires d'encodeur par rapport aux FLOP de LLM  rapport des estimations de débit de DVD。
- Il s'agit d'une formation de base de la formation professionnelle et de la formation professionnelle.

## Je le livre.
本课会产出 `outputs/skill-native-vs-posthoc-auditor.md` Donner un plan de formation VLM proposé, il devrait être choisi natif ou post-hoc, marquer l'alignement-risque de la dette, et recommander un corpus mixte.

## 练习
1.  Estimation du delta de calcul entre InternVL3-8B (pré-train natif) et LLaVA-OneVision-7B (post-hoc) ⋅ GPU-heure de rapport approximativement combien est-il ?

2. InternVL3  Rapport de rapport est 40% texte / 35% interlevé / 20% sous-titre / 5% vidéo。 Si votre objectif est de faire des tâches vidéo-heavy, veuillez proposer un nouveau rapport,并论证为什么基模型 仍然需要大量文字和字幕数据。

3. 阅读 MM1.5 Section 4 中关于忘记的内容――说出后校训中出现最大回归的确切基准―― Cette régression 损失了多少?

4. ViR va 60% du trafic 路由到低解析度编码──它会错路由哪类查询──在需要高分辨率时发送到低分辨率时发送? propose trois modes de défaillance du routeur──

5. Dans quel modèle de trafic, le DVD va-t-il endommager le débit plutôt que de le faire augmenter ?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Native multimodal pretraining | "From scratch together" | Text + image + video tokens 从第 1 步开始参与 Loss，而不是之后再接上 |
| Alignment debt | "Post-hoc penalty" | 由把 vision 接到 frozen LLM 上导致的 text skills 和 answer consistency 可测量退化 |
| V2PE | "Variable visual pos encoding" | 每个 modality 的可学习 position encoding allocation；InternVL3 的 M-RoPE 后继方案 |
| ViR | "Resolution router" | 小 classifier，在 encoding 前按 query 选择所需最低 resolution，从而节省 inference tokens |
| DvD | "Decoupled deployment" | Vision encoder 在一个 GPU 上，LLM 在另一个 GPU 上，并通过 stream handoff；可让大型 VLMs 的 throughput 翻倍 |
| InternVL-U | "Unified understanding + generation" | 2026 年后续版本，为 native-pretrain backbone 加入 image-generation heads |
| Interleaved corpus | "OBELICS / MMC4" | 文本和图像按自然阅读顺序排列的 documents；native pretraining 的原材料 |

## 延伸阅读
- [Chen et al. — InternVL 1 (arXiv:2312.14238)](https://arxiv.org/abs/2312.14238)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
- [InternVL3.5 (arXiv:2508.18265)](https://arxiv.org/abs/2508.18265)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Zhang et al. — MM1.5 (arXiv:2409.20566)](https://arxiv.org/abs/2409.20566)
