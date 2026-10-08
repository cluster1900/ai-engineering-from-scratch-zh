# CLIP et l'entraînement en langage de vision contrasté

> OpenAI's CLIP(2021) prouve une idée centrale suffisante pour stimuler les cinq prochaines années: uniquement en utilisant des paires de titres d'images Web et une perte contrastante, mettre l'encodeur d'image et l'encodeur de texte en phase avec le même espace vectoriel.

**Type:** Build
**Languages:** Python（stdlib，InfoNCE + sigmoid loss 实现）
**Prerequisites:** Phase 12 · 01（ViT patches），Phase 7（Transformers）
**Time:** ~180 分钟

## Objectif de l'apprentissage
- De l'information mutuelle 推导 InfoNCE perte,并 réaliser une valeur fixe numérique Vectorisée 版本。
- 解释为什么sigmoid pairwise loss(SigLIP) peut être étendu au lot 32768+, sans avoir besoin de softmax
- 通过构造 text templates(`a photo of a {class}`)并对 cosine similarity 取 argmax,运行 zéro prise de vue imageNet classification。
- Pour le classement de la pré-entraînement CLIP / SigLIP, donnez-vous quatre points: taille de lot, température, modèle de mise en page, qualité des données.

##  problématique
La vision précédente de CLIP était supervisée. Elle regroupait des ensembles de données étiquetés (ImageNet:1.2M images, 1000 classes), entraînait CNN, puis publiait. Les étiquettes étaient chères, les étiquettes seraient orientées vers un contenu cohérent, et, sans fin de réglage, les étiquettes ne pouvaient pas être transférées vers une nouvelle tâche.

Le texte est "Mon chien Max dans le parc", il porte un signal de surveillance:

Réponse de CLIP: mettre en place des paires d'images-titres lorsque vous êtes en phase avec une tâche correspondante. Donner un lot de contenu N 张 images 和 N 条 captions, apprendre à chaque image correspondre à sa propre sous-titre, et à distinguer N-1 个分扰器──监督信号是 ces deux choses appartiennent ensemble; cette N-1 个不属于一起──没有类标签──没有人工标签──只有一个反击损失──

得到的嵌入空间 能做不止 CLIP 被训练做的事情──ImageNet zero-shot 能工作,是因为"une photo d'un chat" de l'embedding se rapprochera de ceux qui n'ont jamais été clairement marqués pour un chat image── c'est la raison pour laquelle chaque 2026 VLM 注──

## 概念
### Le double encodeur

Il y a deux tours:

- Encodeur d' image `f`:VIT ou ResNet, chaque image 输出一个D-dim Vector──
- Encodeur de texte `g`: petit transformateur, chaque titre 输出一个D-dim Vector。

Les deux tours ont normalité de sortie jusqu'à la longueur de l'unité.`cos(f(x), g(y)) = f(x)^T g(y)`Il y a une autre.

Pour un lot de paires contenant N 个(image, sous-titre, forme de construction 为 `(N, N)` Matrix de similitude`S`- Le numéro de la liste:

```
S[i, j] = cos(f(x_i), g(y_j)) / tau
```

Parmi eux `tau`C'est la température de l'apprentissage que vous obtenez.

### Perte de l'infoNCE

CLIP dans les lignes 和 colonnes 上 utiliser entropie croisée symétrique:

```
loss_i2t = CE(S, labels=identity)     # each image's positive is its own caption
loss_t2i = CE(S^T, labels=identity)   # each caption's positive is its own image
loss = (loss_i2t + loss_t2i) / 2
```

C'est le softmax de l'InfoNCE──CE 强制每张图像与其标题的匹配程度高于所有其他标题中所有其他标题中──"negatives"是所有其他批品──较大的批品 = 更多负面 = 更强信号──CLIP 在批量32k 上训练;规模 很重要──

### Température

`tau`控制 softmax 的尖──低 tau →尖分布,具有硬负矿业效果──高 tau →软,所有样品都会贡献──CLIP 学习 log(1/tau),并进行剪切以防崩──SigLIP 2 固定初始 tau,并改用学习偏见──

### Pourquoi sigmoid 扩展性更好(SigLIP)

Softmax  nécessite toute la similitude Matrice  garder le même rythme  Dans l'entraînement distribué, vous devez mettre chaque intégration tout-ensemble à chaque réplique, puis faire softmax.

SigLIP Utilisation de sigmoïdes à base d'éléments  remplacement de la douceur max: pour chaque paire `(i, j)`,perte est une classification binaire, juger si c'est une paire de correspondances ?Les étiquettes de classe positives sont diagonales, tout le reste est négatif──perte est:

```
L = -1/N sum over (i, j) [ y_ij log sigmoid(S[i,j]) + (1-y_ij) log sigmoid(-S[i,j]) ]
```

Si `i == j`, `y_ij = 1`, sinon pour 0── chaque paire de perte est indépendante── ne nécessite pas de tout rassembler── chaque GPU  calculer son propre bloc local 并求和──SigLIP 2 peut être étendu à faible coût à 32k-512k lot, tandis que CLIP 会需要比例增加通信──

### Classification à tir zéro

给定 N 个 class names, pour chaque classe 构建一个文本模板:

```
"a photo of a {class}"
```

Utilisation d'un encodeur de texte Embedding Chaque modèle. Utilisation d'un encodeur d'image Embedding Votre image.

Les modèles rapides sont très importants. Pour chaque classe, l'utilisation de 80 modèles est prévue.

### Sondes linéaires et réglage fin

La sonde linéaire est baseline. La sonde linéaire est baseline. Elle est utilisée dans les classes CLIP froides.

### SigLIP 2:NaFlex et caractéristiques denses

SigLIP 2(2025)
- NaFlex: un modèle unique  traitement des ratios d'aspect variables 和 résolutions。
- Les caractéristiques denses, utilisées pour la segmentation et l'estimation de la profondeur, sont plus précisément utilisées dans les VLM comme colonne vertébrale gelée.
- Multilingue: dans plus de 100 langues, et CLIP en anglais seulement.
- 1B par paramètre, et le CLIP maximum jusqu'à 400M.

Dans les VLM ouverts de 2026, SigLIP 2 SO400m/14 est une tour de vision par défaut. Pour la récupération de texte et d'images purement, si la distribution de formation LAION-2B spécifique correspond à votre modèle de requête, CLIP est toujours une option par défaut.

### Les produits de base sont les produits de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de

ALIGN(Google,2021): avec CLIP similaire idée,1,8B paire d'échelle,90% bruyant。 prouver des données bruyantes 可以规模──OpenCLIP(LAION): dans LAION-400M / 2B 上对 CLIP的开放复制,多种规模,是常用的开放检查点──EVA-CLIP:从面膜图像建模初始化;是VLMs强的脊柱──BASIC:Google的 CLIP+ALIGN混合物──它们都属于同一家族,只是数据和调整不同──

### Le plafond de tir zéro

Les modèles de classe CLIP de l'ImageNet à tir zéro sont à 76% (CCLIP-G、OpenCLIP-G)  Continuer à améliorer nécessite plus de données (CCLIP-G SigLIP 2  atteindre 80%+) ou des changements d'architecture (CCLIP-Class)  Les paramètres sont supervisés (CCLIP-G、Class-Class)  Benchmark est en cours de développement (CCLIP-G、OpenCLIP-G)  Réaliser la valeur de la valeur de la valeur de la valeur de l'espace de mise en place des VLMs 消费的嵌入空间──


```figure
multimodal-fusion
```

## Utilisez-le
`code/main.py`实现:

1. Un jouet double encodeur (à partir de fonctionnalités d'image basées sur des hashtags, des fonctionnalités de graphiques de texte), vous permet de voir la forme d'InfoNCE.
2. 纯 Python 的 InfoNCE loss(通过 log-sum-exp保证数值稳定)
3. Utilisé pour la perte par paire sigmoïde par rapport à la perte par paire.
4. Une routine de classification à tir zéro: calculer avec un groupe de requêtes de texte de similitude cosine,并使用 argmax 进行预测。

运行它并观察损失曲线──绝对数值是玩具;形状与真实CLIP trainer 输出一致──

## Je le livre.
本课生成 `outputs/skill-clip-zero-shot.md`△ donner un groupe d'images (à travers le chemin) et un groupe de classes cibles, il utilisera le modèle CLIP pour créer des invites de texte, par exemple avec un point de contrôle spécifié`openai/clip-vit-large-patch14`)Inplementation 两侧,并返回带相似度的前-1 /前-5预测──该技能 拒绝对提示列表 中不存在的类做出判断──

## 练习
1. Hand动为一个包含4 个对的批量实现 InfoNCE──构建4x4 similarity Matrix,运行软max,取出横向,计算交叉.

2. En plus de la température, SigLIP utilise également le paramètre de biais.`b`- Le numéro de la liste:`S'[i,j] = S[i,j]/tau + b`◊ lorsque le lot  existe un déséquilibre de classe plus important`b`Le projet de loi de l'Union européenne sur les droits de l'homme est un projet de loi de l'Union européenne.

3. Pour les chats contre les chiens, construisez un classifiateur à tir zéro.`a photo of a {class}`et `a picture of a {class}`◊ dans 100 张 images de test  la précision de mesure ◊ ensemble de modèles est-il supérieur à un seul modèle ?

4. 計算 512-GPU、batch 32k 运行时,softmax InfoNCE avec sigmoid par pair de coûts de communication──哪个按 O(N) échelle,哪个按 O(N^2) échelle?引用 SigLIP Section 4──

5. 阅读OpenCLIP scaling-law paper(arXiv:2212.07143,Cherti et al.)。 Basé sur le diagramme de leur réaction concernant l'échelle des données:

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| InfoNCE | "Contrastive loss" | 对一个 batch 的 similarity Matrix 做 cross-entropy；每个 item 的 positive 是它配对的 item，negatives 是其他所有项 |
| Sigmoid loss | "SigLIP loss" | Per-pair binary cross-entropy；没有 softmax，没有 all-gather，在 distributed training 中低成本 scale |
| Temperature | "tau" | 在 softmax/sigmoid 之前缩放 logits 的 scalar；控制 distribution 的 sharpness |
| Zero-shot | "no-finetune classification" | 使用 text prompts 构建 class Embeddings，并通过 cosine similarity 分类；不在目标 classes 上训练 |
| Prompt template | "a photo of a ..." | 围绕 class name 的文本脚手架；会影响 zero-shot accuracy 1-5 points |
| Dual encoder | "Two-tower" | 一个 image encoder + 一个 text encoder，输出到共享 D-dim space |
| Hard negative | "Tough distractor" | 与 positive 足够相似的 negative，迫使 model 努力将它们分开 |
| Linear probe | "Frozen + one layer" | 只在 frozen features 之上训练一个 linear classifier；衡量 feature quality |
| NaFlex | "Native flexible resolution" | SigLIP 2 的能力：无需 resize 即可摄入任意 aspect ratio 和 resolution 的 images |
| Temperature scaling | "log-parametrized tau" | CLIP 将 `log(1/tau)` 参数化，使 gradients 表现良好；通过 clipping 防止 collapse 到接近零的 tau |

## 延伸阅读
- [Radford et al. — Learning Transferable Visual Models From Natural Language Supervision (arXiv:2103.00020)](https://arxiv.org/abs/2103.00020) papier CLIP
- [Zhai et al. — Sigmoid Loss for Language Image Pre-Training (arXiv:2303.15343)](https://arxiv.org/abs/2303.15343) SigLIP。
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) multilingue + NaFlex。
- [Jia et al. — ALIGN (arXiv:2102.05918)](https://arxiv.org/abs/2102.05918) Avec une échelle de données Web bruyante。
- [Cherti et al. — Reproducible scaling laws for contrastive language-image learning (arXiv:2212.07143)](https://arxiv.org/abs/2212.07143) Loi sur l'évolutivité de l'OpenCLIP
