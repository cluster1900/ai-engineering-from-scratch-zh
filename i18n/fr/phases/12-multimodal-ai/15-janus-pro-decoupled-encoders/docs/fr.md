# Janus-Pro: utilisé pour l'intégration Multimodal 模型的解 Encoder

> 统一 Multimodal 模型 existe un pouvoir inévitable. 了解需要语义特征,即 SigLIP ou DINOv2 输出矢量,富含概念级信息. 生成需要有利于重建代码,即能够重新组合清晰像素的 VQ Tokens. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 统一 模拟模型. 模拟模型. 模拟模型. 模拟模型. 模拟模型. 模拟模型. 模拟模型. 模拟模型. 模拟模型. 模拟模型. 模拟模型. 模拟模型. 模拟模型. 模拟模型. 模拟模型. 模拟. 模拟. 模拟. 模拟. 模拟. 模拟. 模拟. 模拟. 模拟. 模拟. 模具. 模具. 模具. 模具. 模. 模具. 模. 模. 模. 模. 模. 模. 模. 模. 模. 模. 模. 模. 模. 模. 模. 模. 模. 模. 模. 模

**类型：**Construire
**语言：**Python(stdlib, routage à double encodeur + signal de corps partagé)
**先修：**Phase 12 · 13(Transfusion),Phase 12 · 14(Montre-o)
**时间：**À environ 120 minutes

## Objectif de l'apprentissage
- Expliquer pourquoi un encodeur partagé unique va sacrifier une partie de sa capacité à comprendre la qualité ou à générer la qualité.
- 描述 Janus-Pro's routing: comprendre les fonctionnalités SigLIP utilisées sur le côté de l'entrée, générer des jetons VQ utilisés sur les deux côtés de l'entrée et de la sortie.
-  Suivre le succès de Janus-Pro, alors que Janus n'a pas réussi à réaliser le même résultat.
- Comparer avec des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique, des appareils de communication numérique numérique, des appareils numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique numérique num

##  problématique
统一模型在理解和生成之间共享 Transformer body──此前的尝试(Chameleon、Show-o、Transfusion) sont utilisés dans deux directions avec le même Tokenizer visuel── ce Tokenizer est un type de déformation:

- Pour la reconstruction de l'optimisation (Generation):VQ-VAE  Capture de la petite taille des pixels 细节, mais générer des jetons 语义一致性较弱──
- Pour le mieux comprendre: SigLIP Embeddings 会把"cat" 图像聚到"cat" Tokens 附近, mais ne peut pas bien reconstruire.

Le show-o et la transfusion ont donc payé un coût de qualité visible dans une certaine direction. Janus-Pro pose la question: pourquoi avoir besoin d'un Tokenizer ?

## 概念
### 解视觉编码

L'architecture de Janus-Pro est divisée en deux encoders:

- Comprendre le chemin.
- 生成路径──输入图像(如果基于已有图像进行条件化)→ VQ Tokenizer → Token ID → Transformer body──
- 输出生成──Transformer 预测的图像代币 → décodeur VQ → pixels──

Le corps transformateur est commun. Tout ce qui monte et descend du corps est un travail spécifique.

输入通过快速格式 消除歧义:`<understand>`Tag 通过 SigLIP 路由;`<generate>`通過VQ 路由──或路由也可以由任务隐式决定──

### Pourquoi ça marche ?

Comprendre la perte de sensation  obtenir des fonctionnalités SigLIP, tandis que la pré-entraînement à la CLIP  déjà la modifié pour s'adapter à la signification de la similitude.

生成 loss 获得 VQ Tokens, alors que Tokenizer 已被调优为适合重建──图像质量优于 Show-o,因为 VQ codes 能干净地组合回像素──

Le corps transformateur verra deux types d'entrée distribuée (SigLIP et VQ), et apprendra à traiter simultanément les deux.

### Numéro d'accès: Janus contre Janus-Pro

Janus (original version, arXiv 2410.13848) introduit la connaissance, mais la taille est plus petite (paramètres 1.3B, données limitées)

- Paramètres 7B (environ 1,3B)
- étape 1 (alignement) utilisant 90M de paires d'images et de texte,高于 72M。
- étape 2 (unifié) utilisation 72M,高于 26M。
- étape 3  augmenter 200k d'échantillons d'instructions de génération d'images。

La conclusion est: Janus-Pro-7B sur MMMU, correspondant à LLaVA (6,03% contre 58) et sur GenEval (5,01% contre 0,67): un modèle ouvert, les deux extrémités du système de généalogie ont une compétitivité.

### JanusFlow: flux rectifié 变体

JanusFlow (arXiv 2411.07975) a remplacé VQ par un flux rectifié 生成路径 (continuous) en VQ 生成路径 (→ points de vue de la société).

### Responsabilité de l'organisme commun

Le corps transformateur traite la même série, mais face à deux types de distribution de l'entrée.

- Pour comprendre: consommation SigLIP fonctionnalités + text Tokens → 自回归地输出文本。
- Pour la génération: consommer des textes Tokens +(可选图像VQ Tokens)→ 自回归地输出图像VQ Tokens。

Il n'y a pas de poids spécifique à la modalité dans chaque bloc.

Il est intéressant de noter que le corps de Janus-Pro peut être utilisé à partir de la formation préalable de la formation LLM.

### Comparé à la RVL-U

Le cours de l'année 2026 est le suivant:

- Pré-entraînement multimodale natif (rétectrice interne de la VL3)
- En route de codeur déconnecté (sigLIP en, VQ + diffusion se déplace)
- 统一理解 + 生成 + 编辑。

InternVL-U va adopter l'architecture de Janus-Pro dans un cadre plus large.

###  Limite

解 L'encodeur augmentera la complexité de l'architecture. Il faut entraîner deux Tokenizers, maintenir deux voies d'entrée, traiter deux modes d'échec.

Pour les produits qui ne nécessitent pas d'intelligence, Janus-Pro 能力过剩, choisir Stable Diffusion 3 / Flux 模型即可──

Pour les produits dont ils ont tous besoin, Janus-Pro est maintenant une référence à l'architecture ouverte.


```figure
l5-janus-decouple
```

## Utilisez-le
`code/main.py`模拟 Janus-Pro routage:

- 两个 mock encoders:SigLIP-like (produire des vecteurs de signification de 256 dimensions) et VQ-like (produire des codes entiers) ⋅
- Un routeur rapide, selon la balise de tâche 选择 Encoder。
- Un corps commun (stand-in) est créé pour traiter les Tokens.
- De l'étape 1 (alignement) à l'étape 3 (tune d'instruction) du calendrier de l'échantillon pondéré 切换。

打印 3 个例的路由路径:image QA、T2I、image editing──

## Je le livre.
本课会生成 `outputs/skill-decoupled-encoder-picker.md` Donner une perspective d'obtenir un produit de qualité et de compréhension tout en étant à la frontière, elle choisit Janus-Pro、JanusFlow ou InternVL-U, et donne des recommandations de taille de données spécifiques.

## 练习
1. Janus-Pro-7B en GenEval 上 dépasse DALL-E 3。 expliquer pourquoi un modèle 7B ouvert 模型能在生成上匹配边界 专有模型,但在理解上不能──

2. 实现 un routeur fonction: donner un texte prompt,将其分类为 `understand`Ou `generate`Comment gérer des "décrire et ensuite dessiner" de ce genre ?

3. JanusFlow avec le flux rectifié remplacement de VQ cheminement.

4.  proposé Janus-Pro 架构可以通过再增加一个解编码 来处理的第四种任务──例:segmentation des images (DINO-style) 深度 (MiDaS-style) 

5. 阅读 Janus-Pro Section 4.2 concernant le contenu de l'expansion des données.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Decoupled encoding | "两个 visual encoders" | 每个方向使用单独的 Tokenizer 或 Encoder：理解使用语义向，生成使用重建向 |
| Shared body | "一个 Transformer" | 单个 Transformer 处理任一 Encoder 的输出；没有 modality-specific weights |
| SigLIP for understanding | "语义 features" | CLIP-family vision tower，提供丰富的概念 features，但重建较差 |
| VQ for generation | "重建 codes" | Vector-quantized Tokens，可以干净地 decode 回 pixels |
| JanusFlow | "Rectified-flow variant" | 使用 continuous flow-matching generation head 替代 VQ 的 Janus-Pro |
| Routing tag | "Task tag" | Prompt marker（`<understand>` / `<generate>`），用于选择输入 Encoder |

## 延伸阅读
- [Wu et al. — Janus (arXiv:2410.13848)](https://arxiv.org/abs/2410.13848)
- [Chen et al. — Janus-Pro (arXiv:2501.17811)](https://arxiv.org/abs/2501.17811)
- [Ma et al. — JanusFlow (arXiv:2411.07975)](https://arxiv.org/abs/2411.07975)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Dong et al. — DreamLLM (arXiv:2309.11499)](https://arxiv.org/abs/2309.11499)
