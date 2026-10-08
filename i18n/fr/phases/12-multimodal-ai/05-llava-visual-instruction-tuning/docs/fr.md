# LLaVA et l'écoute des instructions visuelles

> LLaVA(4 mois de 2023) est la plus grande architecture multimodale à avoir été reproduite sur Terre. Elle a remplacé le Q-Former de BLIP-2 par une MLP à 2 couches, avec une simple concatenation de jetons. Elle a remplacé l'attention croisée fermée de Flamingo et a effectué des exercices d'instruction visuelle à 158 000 pages. Ces données ont été produites par GPT-4 à partir de titres de texte pur.

**类型：**Construction
**语言：**Python(stdlib、projecteur + constructeur de modèles d'instructions)
**先修：**Phase 12 · 02(CLIP),Phase 11(LLM Engineering  réglage des instructions)
**时间：**- 180 minutes

## Objectif de l'apprentissage

- Construire un projecteur MLP à 2 couches, va intégrer le patch ViT dim 1024)映射到 LLM 的 dim 4096)。
- 走通 LLaVA recette en deux étapes: 1) dans 558k paires de sous-titres, 2) dans 158k tours générés par GPT-4, 上做 visuel instruction de réglage。
- 构建一个LLaVA-format prompt, contenant une image Token placeholder、system prompt 和 user/assistant turns。
- 解释为什么社区从Q-Former 转向MLP,尽管Q-Former 在代币预算上有优势──

##  problématique

Le Q-Former de BLIP-2 (leçon 12.03) est de réduire une image en 32 Token.

Première étape: Q-Former est entraînable, mais sa perte n'est pas une tâche finale.

Deuxièmement, Q-Former a 188 millions de paramètres, et à l'échelle de 2023 de LLaVA, vous devez le mettre en œuvre et l'objectif LLM un ensemble de conception, changer de LLM, refaire une formation Q-Former, changer de vision encodeur, faire une nouvelle formation, chaque composé est un projet de R&D indépendant.

LLaVA's Answer Simple to Embarrassing: Prenez les 576 pièces de patch de ViT, laissez chaque pièce passer par un MLP à 2 couches`1024 → 4096 → 4096`), puis mettre tous les 576 个都塞进LLM's输入序列──没有瓶──没有基于奇怪目标的阶段1预训──只是在直接的LM损失上训练MLP──

Les données de l'image sont fournies par GPT-4, permettant de générer des conversations, des descriptions et des questions de raisonnement complexes.

Résultat: un VLM sur 8 张 A100 上运行一天、在MMMU 上击败 Flamingo、并发布社区可扩展的开放检查点 VLM──en 2023 , il a déjà produit plus de 50 fourchettes──

## 概念

### 架构

LLaVA-1.5 à 13B:
- Le codeur de vision: CLIP ViT-L/14 @ 336(étape 1 结,étape 2 可选解)
- Projecteur: 2 couches de MLP avec activation GELU,`1024 → 4096 → 4096`Il y a une autre.
- LLM: Vicky-13B (plus tard est Llama-3.1-8B)

图像 + 文本 prompt de passe avant:

```
img -> ViT -> 576 patches of dim 1024
patches -> MLP -> 576 tokens of dim 4096
prompt: system + "<image>" placeholder + user question
replace <image> token with the 576 projected tokens
feed the full sequence to the LLM
decode response
```

Dans le contexte de la LM, il reste encore 1472 Token. Dans le contexte de 32k, il s'agit d'une simple erreur.

### Étape 1: alignement du projecteur

结 ViT──结 LLM──只训练 2-layer MLP──Dataset:558k paires d'images-titres(LAION-CC-SBU)──Loss:在投影图像代币 条件下,对标题做语言建模──

En effet, les projets de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de formation de l'équipe de formation de l'équipe de formation de formation de l'équipe de formation de formation de l'équipe de formation de l'équipe de formation de formation de l'équipe de formation de l'équipe de formation de formation de l'équipe de formation de l'équipe de formation de formation de l'équipe de formation de formation de l'équipe de formation de formation de l'équipe de formation de l'équipe de formation de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de l'équipe de formation de l'équipe de formation de l'équipe de l'équipe de l'équipe de l'équipe de formation de l'équipe de formation de l'équipe de l'équipe de l'équipe de formation de l'équipe de l'équipe de l'équipe de la programmation de projet de projet de projet de projet de projet de projet de projet de projet de projet de projet de projet de projet de l'équipe de projet de l'équipe de projet de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de la région de la région de la région de la région ne sont

### Étape 2: réglage des instructions visuelles

解 projecteur (→ encore entraînement) ――解 LLM(通常全量,有时使用LoRA)──在158k视觉指令转上训──

Les données d'instruction sont des techniques essentielles.
1. Je suis en train de faire une photo de la photo.
2. 提取文本描述(5 条 sous-titres humains + liste de boîtes limites)
3. Utilisez trois modèles de commande  Envoyez à GPT-4:
   - Conversation:  générer un segment d'utilisateurs et d'assistants  autour de cette image pour revenir à l'échange de conversations 
   - 详细描述:Donnez une description riche et détaillée de l'image.
   - 复杂推理:  poser une question qui doit être examinée en fonction de l'image, puis la répondre.
4. Pour les résultats de l'enquête, il faut savoir si le rapport de travail est correct.

Le processus n'a pas été directement contacté avec l'image  seulement contacté avec le texte description  GPT-4 会 halucinate 合理的图像内容── il y a eu un certain bruit, mais il a fonctionné:

### Pourquoi la communauté a-t-elle répliqué ce programme ?

- 无需调调的阶段-1-specific losses──全程使用 LM loss──
- Le projetor est entraîné en heure, et non en jour.
-                                                                                                                                                                                                                                                               
- Le coût de la re-génération des données visuelles-instructions est très faible en utilisant GPT-4, et pour les nouveaux domaines.

### LLaVA-1.5 et LLaVA-NeXT

LLaVA-1.5(2023 年 10 月)
- Les données de la tâche académique seront ajoutées à la mise en forme des instructions.
- Un meilleur système rapide.
- 2048 → 32k contexte

LLaVA-NEXT(2024 年 1 月)
- AnyRes: mettre des images haute résolution coupées en 2x2 ou 1x3 网格 de 336x336 cultures, ajouter une miniature globale à faible résolution.
- Utilisation de la meilleure combinaison de données d'instructions.
- Les diplômes de base sont plus élevés que les diplômes de base.

### LLaVA-OneVision

Leçon 12.08 会深入讲 OneVision──简短版: Avec un même projecteur, mais avec un programme de formation, dans un modèle, couvrir une seule image、 plusieurs images 和 vidéo,并共享视觉标志预算──

### Comparison avec Q-Former

| | Q-Former（BLIP-2） | MLP（LLaVA） |
|---|---|---|
| 每张图像的 visual Token | 32 | 576（base）或 2880（AnyRes） |
| 可训练参数 | 188M + LM | 40M + LM |
| Stage 1 loss | ITC+ITM+ITG | 仅 LM |
| LLM drop-in | 需要重新训练 | 最小重新训练即可替换 |
| Multi-image | 别扭 | 自然（concat） |
| Video | 别扭 | 自然（per-frame concat） |
| Token budget | 小 | 大 |

Le projet de loi de l'Union européenne sur les droits de l'homme (CEL) a été adopté en décembre 2003 et a été adopté en décembre 2003.

### Format de la mise en œuvre

```
A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions. USER: <image> Describe this image in detail. ASSISTANT: The image shows ...
```

`<image>`Il est remplacé par 576 Tokens visuels (environ 2880). Le Tokenizer voit une séquence plus longue que celle de l'entraînement, mais le LLM peut traiter ce nouveau type de saisie, car la phase 1 l'a déjà enseignée.

### 参数经济性

LLaVA-1.5-7B
- C'est une bonne idée.
- Projecteur (x2x linéaire): ~ 22M 可训练。
- Llama-7B:7B:
- 总计:7.3B paramètres。étape 2 期间可训练:完整 7B + 22M projecteur。

Le coût de formation de la phase 2 est de 8xA100, sur une durée d'environ 20 heures. C'est le chiffre clé de la journée.


```figure
mm-llava-projector
```

## Utilisez-le

`code/main.py`实现:

1. 纯 Python 中的2 couches de projecteur MLP(échelle jouet 下 dim 16 → 32 → 32)。
2. Pipeline de construction rapide: système rapide + 用 N 个 projeté Token 替换 `<image>`+ tour d'utilisateur + place-hold de génération assistante。
3. Un visualisateur, utilisé pour afficher un bloc visuel de 576 jetons dans le contexte de LLM

## Je le livre.

本课产 出 `outputs/skill-llava-vibes-eval.md` Donner un point de contrôle de la famille LLaVA, il fonctionnera une suite de 10 vibes-evals rapides  3 sous-titres  3 VQA  2 raisonnements  2 refus), et de signaler une carte de score humaine.

## 练习

1. 计算 `1024 → 4096 → 4096`Combien de paramètres entraînables du projecteur MLP à 2 couches avec GELU et bias ?

2. Pour un cas de refus, construire une image contenant des individus privés, écrire une réponse de l'assistant attendue, pourquoi la demande doit-elle être rejetée ?

3. 阅读 LLaVA-NeXT blog de AnyRes 部分──计算一张 1344x672 图像在 AnyRes 下的视觉代币计量──与 336x336 下的基础 576代币对比──

4. LLaVA phase 1 projecteur Utilisation de sous-titres 上的 LM loss 训练──如果跳过阶段1,直接进入阶段2(visuelle instruction de réglage),会发生什么?引用Prismatic VLMs ablation(arXiv:2402.07865)作答──

5. LLaVA-Instruction-150k utilisant les sous-titres GPT-4 et COCO 生成指示── Pour un nouveau domaine (radiologie médicale, images satellites), décrire la génération de données fourni par les instructions de domaine──

## 关键术语

| 术语 | 人们的说法 | 它实际上的含义 |
|------|----------------|------------------------|
| Projector | “MLP bridge” | 带 GELU 的 2-layer MLP，将 ViT dim 映射到 LLM dim |
| Image Token | “<image> placeholder” | Prompt marker，在 inference 前被 N 个 projected visual Token 替换 |
| Visual instruction tuning | “LLaVA stage 2” | 在 GPT-4-generated（image, instruction, response）triplets 上训练 |
| Stage 1 alignment | “Projector pretraining” | 冻结 ViT 和 LLM，用 captions 上的 LM loss 训练 projector |
| AnyRes | “Multi-crop tiling” | 将高分辨率图像切分为 tile grid，并拼接每个 tile 的 visual Token |
| LLaVA-Instruct | “GPT-4-generated” | 从 COCO captions + GPT-4 合成的 158k instruction-response pairs |
| Vision encoder freeze | “Backbone locked” | CLIP weights 在 stage 1 不更新，有时在 stage 2 也不更新 |
| ShareGPT4V | “Better captions” | 由 GPT-4V 生成的 1M dense captions，用于更高质量 alignment |
| VQA | “Visual question answering” | 回答关于图像的自由形式问题的任务 |
| Prismatic VLMs | “Design-space paper” | Karamcheti 2024 ablation，系统测试 projector 和 data choices |

## 延伸阅读

- [Liu et al. — Visual Instruction Tuning (arXiv:2304.08485)](https://arxiv.org/abs/2304.08485) LLaVA 论文。
- [Liu et al. — Improved Baselines with Visual Instruction Tuning (arXiv:2310.03744)](https://arxiv.org/abs/2310.03744) LLaVA-1.5。
- [Chen et al. — ShareGPT4V (arXiv:2311.12793)](https://arxiv.org/abs/2311.12793) sous-titres denses 数据集。
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865) ablations de conception de l'espace。
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326) 统一的单图、多图、视频──
