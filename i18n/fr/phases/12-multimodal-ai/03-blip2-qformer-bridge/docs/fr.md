# De CLIP à BLIP-2  Q-Former  comme pont de modalité

> CLIP pour les images et le texte, mais ne peut pas générer de sous-titre, répondre aux questions ou de faire des conversations. BLIP-2 (Salesforce, 2023) a résolu ce problème avec un petit trainage de pontes:32 个学习查询 Vecteur 通过横向关注结结结 ViT的特点,然后直接插入结结 LLM的输入流──188M 参数的桥接将一个11B LLM 连接到 ViT-g/14──到2026年,每个基于适配器的VLM  MiniGPT-4、Instruction 近亲的LLaVA都是它的后代──本课阅读Q-Former的架构,解释其两阶段玩具训练,并输建一个 版本,把Token 视觉 decoder 进入结结结文中──

**Type:** Build
**Languages:** Python (stdlib, cross-attention + learnable-query demo)
**前置要求:**Phase 12 · 02 (CLIP), phase 7 (transformateurs)
**Time:** ~180 minutes

## Objectif de l'apprentissage
- Expliquer pourquoi mettre un boîtier entraînant entre un encodeur de vision gelé et un LLM gelé est préférable à un fin-to-end sur le coût et la stabilité.
- ¢ réaliser un bloc d'attention croisée, dont un groupe de requêtes apprenantes fixes ¢ se concentrer sur les caractéristiques de l'image externe¬
- 走读 BLIP-2 的两阶段预训练:représentation (ITC + ITM + ITG), puis générative(Utiliser la perte de LM du décodeur gelé)。
- Comparer Q-Former avec le projecteur MLP plus simple utilisé dans LLaVA  faire des comparaisons,并论证各自何时更占优──

##  problématique
Vous avez un ViT gelé, il produit 256 pièces de patch pour chaque image de la LLM. Vous avez un 7B LLM gelé, il attend de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de la LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM de LLM

Le problème de BLIP-2 est: est-ce que le 256-Token image représentation est comprimé en beaucoup moins de Token (par exemple 32), tout en conservant suffisamment d'informations, pour que LLM soit capable de générer des images sous-titres, répondre aux questions et de faire des raisonnements?

答案是:Q-Former──32 个可学习的"query" Vector,对 ViT的补丁符号做交叉参加,生成一个32Token的视觉摘要为LLM使用──总计188M 参数──在接触LLM 之前,先使用对比性、匹配和生成目标 训练──

## 概念
### Questions à apprendre

Q-Former's core technique: ne pas faire de LLM's textbook Token pour se concentrer sur les patches d'image, mais introduire un nouveau groupe de 32                                                                                                                                                                                                                                           `Q`,并让*它们*关注图像补丁. Ces requêtes sont des paramètres de modèle. Elles sont apprises pendant l'entraînement, et le même groupe de 32 requêtes est utilisé pour chaque image.

 Après avoir été examiné, chaque requête  possède un résumé de l'image   décrivant les principaux objets    décrivant le contexte                                                                                                                                                                                                                                         

### Architecture

Q-Former est un transformateur de petite taille (environ 100M de paramètres)

1. Voie de requête:32 个 requête Vecteur 流经自注意(彼此), puis par le patch gelé de ViT Token faire l'attention croisée, finalement traversé FFN。
2. Voie de texte: un encodeur de texte similaire à BERT avec voie de requête 共享自我注意 和 FFN weights──text path 禁用交叉注意──

訓練時二条路都会运行──questions 和文本通过共享自我注意 交互, ce qui signifie que dans les tâches qui nécessitent du texte ITM、ITG), les requêtes peuvent être conditionnées par le texte──VLM 交互的推断 阶段, 只有让问题流过,产生32 视觉代币──

### Formation en deux étapes

BLIP-2 分两阶段预训练:

Étapes 1: apprentissage de la représentation ((无 LLM)。三种损失:
- ITC (image-text contrastive): contraste de style CLIP,作用于 pooled query Token 和 text CLS Token。
- ITM (image-text matching):classificateur binaire  这对图像-text 是否匹配?
- ITG (Génération de texte basée sur l'image): tête de LM causale sur le texte, à des requêtes 为条件――迫使 queries 编码可由文本生成的内容――

Il n'y a pas de diplôme de droit.

Étape 2: apprentissage génératif. Il est nécessaire de se connecter à un LLM congelé.

La phase 2 之后,Q-Former + projection 就是完整的视觉适配器──Inference 时:image → ViT → Q-Former → linear project → 前置到文 → frozen LLM 发出输出──

### Économie des paramètres

BLIP-2 Utilisation ViT-g/14(1.1B, gelé) + OPT-6.7B(6.7B, gelé) + Q-Former(188M, entraîné) = 总计 8B, entraînement 188M。Q-Former 本身约为完整堆积 参数的 2.4%── entraînement coûts也体现这一点:少量 A100 上训练数天,而不是结尾训练数周──

La qualité:BLIP-2 en VQA à tir zéro atteint ou dépasse Flamingo-80B, simultanément en taille de 50 fois.

### InstructionBLIP et instruction感知型 Q-Former

InstructBLIP (2023) a utilisé un extra-输入 pour étendre Q-Former:instruction text 本身──在交叉注意时,queries 现在可以访问图像补丁和指示──queries 可以根据指示 专门化("numer les voitures"",décrire l'humeur"), plutôt que de apprendre un seul résumé fixe──在举办任务上基准 提升──

### MiniGPT-4 avec approche uniquement à projecteur

MiniGPT-4 conserve Q-Former, mais seulement entraîne la production de projection linéaire, tout en finissant toutes les autres parties.

### Pourquoi LLaVA est devenu plus simple

LLaVA(2023,Létion 12.05) remplacé par le Q-Former, chaque ViT patch Token 投影到LLM 空间  投影到LLM 空间  对于24x24 网格,每张图像 576 个 Token,全部输入LLM──压缩更差,但让LLM 能关注原始 patches──当时, c'était très discuté; jusqu'à la fin de l'année 2023, il est devenu courant, car les données d'instruction visuelle(LLaVA-Instruct-150k) prouvent que le MLP peut s'entraîner à conserver suffisamment de signal──舍是:LLaVA prend le contexte 填充快得, mais il peut naturellement se développer à la vidéo et à la vidéo multi-image──

D'ici 2026, le secteur est en train de se développer: Q-Former dans le budget des jetons  Réservation dans les scénarios importants 长视频、多图像; MLP projecteur dans chaque jeton 原始质量优先场景占主导──

### Attention croisée: Flamingo, cet ancêtre

Flamingo (leçon 12.04) a utilisé la même attention croisée avant BLIP-2, mais elle se produit dans chaque couche de LLM gelée, plutôt que comme un seul pont. BLIP-2 montre que vous ne pouvez vous compresser qu'à la couche d'entrée, toujours valable.

### Les descendants de 2026

- Q-Ancien:BLIP-2、InstructBLIP、MiniGPT-4, ainsi que la plupart des raisons du budget des jetons 原因的视频语言模型──
- Le modèle de réception:Flamingo 的变体 (leçon 12.04);Famille de l'Idefics,Eagle,OmniMAE,
- Le projetor MLP:LLaVA、LLaVA-NeXT、LLaVA-OneVision、Cambrian-1。
- La poche d'attention:VILA、PaliGemma。

Qu'est-ce qui est important ? Le problème est que vous êtes limité au budget des jetons ou à la qualité par jeton.


```figure
modality-projection
```

## Utilisez-le
`code/main.py`Construire une attention croisée de style Q-Former:

1. 模拟 256 个 image patch Token(dim 128)。
2. 实例化 32 个可学习的查询 (dim 128)
3. 运行 échelle-point-produit attention croisée ((Q de requêtes, K/V de patches)
4. 通过线性层 投影到 LLM-dim ((512) ⋅
5. 输出 32 个 LLM-prêt Token visuel

Toutes les mathématiques utilisent Python purement (à partir de vecteurs avec des boucles nichées) Mais la forme est exacte.

## Je le livre.
本课生成 `outputs/skill-modality-bridge-picker.md` Donner un objectif VLM 配置(Vision encoder Token 数、LLM contexte budget、部署约束、质量目标), il recommandera Q-Former vs MLP vs Perceiver resampler, et donne une raison courte ainsi que des estimations de paramètres pour chaque type de pont。

## 练习
1. Utilisez PyTorch  réaliser le bloc d'attention croisée.

2. En BLIP-2, étape 1, Q-Former 同时运行三种损失:ITC、ITM、ITG──使用伪代码写出每种前进签名──哪一种需要文字编码路径 处于活跃?

3. Comparer avec le projetor MLP à 2 couches: Q-Former (environ 12 couches, 768 couches cachées) contre MLP à 2 couches (environ 1408 → 4096, deux couches)

4. 阅读 BLIP-2 paper(arXiv:2301.12597) Section 3.2, comprendre comment Q-Former 初始化── expliquer pourquoi de la base BERT初始化(au lieu de l'initialisation au hasard)

5. Pour une vidéo de 10 minutes, à 1 FPS 采样到60 ,计算每 Token 成本:(Q-Former → 32 tokens/frame) vs (MLP projector → 576 tokens/frame)──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Q-Former | "Querying transformer" | 带有 32 个可学习 query Vector 的小型 transformer，对 frozen ViT features 做 cross-attend |
| Learnable queries | "Soft prompt for vision" | 一组固定参数，作为 cross-attention 的 query 侧；按模型学习，在所有输入之间共享 |
| Cross-attention | "Q from here, K/V from there" | query、key、value 来自不同来源的 Attention；queries 从 ViT patches 拉取信息的方式 |
| ITC | "Image-text contrastive" | 应用于 Q-Former pooled queries vs text CLS 的 CLIP-style loss |
| ITM | "Image-text matching" | 在 hard-negative-mined pairs 上的 binary classifier；迫使 queries 区分细粒度不匹配 |
| ITG | "Image-grounded text generation" | 文本以 queries 为条件生成时的 causal LM loss；迫使 queries 编码 text-decodable content |
| Two-stage pretraining | "Representation then generative" | Stage 1 单独训练 Q-Former（ITC/ITM/ITG）；Stage 2 接入 frozen LLM，并且只训练 projection + Q-Former |
| Frozen backbone | "Do not finetune" | vision encoder 和 LLM weights 固定；只训练 bridge |
| Projection head | "Linear to LLM dim" | 将 Q-Former 输出映射到 LLM Embedding dimension 的最终 linear layer |
| Perceiver resampler | "Flamingo's version" | 类似的 learnable-query cross-attention，由 Flamingo 在每一层使用，而不是作为单个 bridge |

## 延伸阅读
- [Li et al. — BLIP-2 (arXiv:2301.12597)](https://arxiv.org/abs/2301.12597)  papier central
- [Li et al. — BLIP (arXiv:2201.12086)](https://arxiv.org/abs/2201.12086) 使用 ITC/ITM/ITG 三件套的前身──
- [Li et al. — ALBEF (arXiv:2107.07651)](https://arxiv.org/abs/2107.07651) "alignement avant fusible"  stage 1 formation concept ancestor。
- [Dai et al. — InstructBLIP (arXiv:2305.06500)](https://arxiv.org/abs/2305.06500) Q-Former, qui connaît les instructions.
- [Zhu et al. — MiniGPT-4 (arXiv:2304.10592)](https://arxiv.org/abs/2304.10592)                                                                                                                                                                                                                                                              
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) l'architecture générale de l'attention croisée à l'apprentissage-quête.
