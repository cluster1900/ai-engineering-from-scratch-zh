# Chameleon et les modèles multimodels à jetons de fusion précoce seulement

> Jusqu'à présent, nous avons vu chaque VLM qui a traité des images et du texte séparément. Les jetons visuels sont fournis par un encodeur de vision, qui se déploie dans un projecteur, puis dans le LLM. L'interne rencontre avec le texte. Les jetons visuels et du texte sont fournis en un seul type de perte autorégressive. Les effets secondaires sont: le modèle peut générer des modèles mixtes en sortie, c'est-à-dire qu'une fois qu'il est possible de générer des jetons et des jetons.

**类型：**Construire
**语言：**Python(stdlib, jeton VQ-VAE + décodeur interligé)
**先修：**Phase 12 · 05, phase 8 (IA générative)
**时间：**À environ 180 minutes

## Objectif de l'apprentissage

- Expliquer pourquoi le vocabulaire partagé + la perte unique 会改变模型能力。
-  description VQ-VAE  comment mettre en symbole l'image 成与变形 next-token objective 兼容的离散序列──
- Pour les caméléons, il faut savoir qu'ils sont en train de se préparer.
- Comparer le Chameleon avec le Q-Former de BLIP-2, et décrire leurs scénarios adaptés.

##  problématique

基于适配器的VLM(LLaVA、BLIP-2、Qwen-VL) 把文本和图像当作两种不同的东西──文本代码 经过`embed(text_token)`- Je suis là !`visual_encoder(image) → projector → ... pseudo_tokens` Le modèle a deux voies d'entrée et se trouve au milieu de la route.

Trois résultats:

1. LLM ne peut consommer que des images, ne peut pas exporter des images.
2. 混合模态文档 (exemple:文章中段落和图像交换出现) très différemment: vous devez être en train de résoudre un modèle extérieur Multimodal 输入, ou encore串联多次生成──
3. Les jetons de vision et de texte sont situés dans différentes zones de l'espace caché, ce qui entraîne des problèmes de coordination mineurs.

Chameleon  refusait cette hypothèse: image est simplement une séquence de jetons de la liste commune 序列── Using交错文档训练模型, a loss、 a autoregressive decoder,就能直接获得混合模态生成能力──

## 概念

### VQ-VAE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

Ce Tokenizer est un autoencodeur variatif quantifié par vecteur.

- Encodeur:CNN + ViT, images seront cartographiées pour la carte des caractéristiques spatiales, par exemple 32x32 个 dim 为 256 个特征.
- Codebook: un apprendre obtenir de K 个 Vector 的词表(Chameleon 使用 8192), également dim 为 256。
- Quantification: pour chaque caractéristique spatiale, par distance L2 查找最近的代码簿入口──用整数指数 替换连续特征──
- Décoder:CNN, va quantifier les caractéristiques 转回像素──

訓練:perte de reconstruction de l'AVE + perte d'engagement + perte de codebook──indices de codebook 构成图像的离散字母──

Pour le Chameleon, une image est transformée en 32*32 = 1024 Token, de la taille de la taille de 8192 pour les mots表── avec des textes Token(de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la taille de la

### 共享词表

Le mot de passe de Chameleon est composé de textos Token、图像 Token 和模态分隔符── chaque Token a un seul ID──输入 Embedding layer把每个 ID 映射到 D-dim hidden Vector──输出投影把 hidden 映射回语音 logits──Softmax 下选择一个 Token, no matter what it belongs to any模态──

Il est important de se séparer .`<image>`et `</image>`标签包住图像 Token 序列──生成时,如果模型输出 `<image>`Le logiciel de téléchargement sait que les 1024 prochains jetons doivent être envoyés au décodeur pour effectuer des images de VQ indices.

### 混合模态生成

L'inference est une prédiction de jeton suivant sur le tableau de la communauté.

```
<image> 4821 1029 2891 ... (1024 image tokens) </image>
The cat is orange, sitting on a windowsill...
```

模型自选择序:它可能先生成图像再生成文本,先生成文本再生成图像,或交错生成── le même décodeur, la même perte──

En comparaison, la production de l'adaptateur VLM est limitée au texte.

### 训练稳定性:QK-Norm  dropout  LayerNorm commanding

L'entraînement de la fusion précoce est à grande échelle instable.

- QK-Norm──在 Attention 内部, à la requête et à la projection de clé, avant d'appliquer LayerNorm, de faire de nouveau un produit dot── pour empêcher la magnitude de logite dans le réseau profond d'exploser──
- Placement de la décomposition ⋅ après chaque ajout résiduel ⋅ appliquer la décomposition, et non seulement l'attention 和 MLP ⋅ après ⋅ lorsque le gradient de la marque d'image peut dominer, il faut une meilleure normalisation ⋅
- LayerNorm ordonnage。Réduction branche 上 utilisation Pré-LN(standard practice), re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re re

 sans ces techniques,34B-param Chameleon  entraînement dans plusieurs points de contrôle 发散── après avoir ces techniques, l'entraînement peut recevoir──

### Récupération du Tokenizer

VQ-VAE est une perte de valeur. Dans 8192 entrées de codebook, chaque image 512x512 est mise en 1024 Token, la PSNR est rétablie à 26-28 dB.

Le Tokenizer est un bon Tokenizer (MAGVIT-v2、IBQ、SBER-MoVQGAN) va monter à la limite.

### Chameleon contre BLIP-2 / LLaVA

Chameleon (la première fusion, commune parole):
- Une perte, un décodeur.
- Produit et production
- Le Tokenizer est la limite de qualité.
- 成本高:path d'inférence 上每张生成图像都需要VQ-VAE décodeur。

BLIP-2 / LLaVA: fusion tardive, séparation des tours:
- 视觉输入, seulement peut sortir le texte.
- 复用 LLM prétrainé
- Comprendre les tâches sans Tokenizer
- 便宜: un seul passe à l'avant

Si vous avez besoin de générer des images, choisissez la famille Chameleon. Si vous avez juste besoin de comprendre, adapter-VLM plus simple, et de refaire plus de calcul prétrainé.

### Fuyu et AnyGPT

Fuyu(Adept,2023) est une méthode liée: complètement sauter un encodeur de vision unique, mettre des patchs d'image originaux 像 Token 一样送入 LLM's input projection, pas utiliser Tokenizer──比 Chameleon 更简单, mais avoir perdu la capacité de partage de vocabulaire 输出生成──

AnyGPT(Zhan et al., 2024) a étendu le Chameleon à quatre modèles:文本、图像、语音、音乐──每种模态都使用相同的VQ-VAE 技巧,共享变形器──Any-to-any generation──Lesson 12.16 中会进一步介绍──


```figure
vq-codebook
```

## Utilisez-le

`code/main.py`Construire un modèle de fusion précoce de bout en bout de jouet:

- Un très petit quantificateur de style VQ-VAE, met 8x8 patches 映射到代码簿指数(K=16)。
- Un seul mot commun est utilisé pour séparer les parties de texte.
- Un décodeur autorégressif de jouets, en synthétisation de sous-titres + séquences de jetons d'image 上训练。
- Une boucle d'échantillonnage, donné une demande 后输出交换的文本 + 图像 Token。

Le Transformer est très petit, donc tu peux suivre le flux de signal de bout en bout.

## Je le livre.

本课产 出 `outputs/skill-tokenizer-vs-adapter-picker.md` Donner une spécification de produit (en anglais seulement compréhension vs compréhension + 生成、 需图像质量、成本预算), il sera fait un choix entre la famille Chameleon (la fusion précoce) et la famille LLaVA (la fusion tardive), et il sera utilisé pour l'expérience de la quantité.

## 练习

1. Chameleon utilise K=8192 个代码簿条目,每张 512x512 图像 1024 个代码──estimation par rapport à la compression des images RGB de 24 bits──¿Est-ce que c'est une perte?

2. Une seule image 4K est-elle produite en une seule fois par appel d'induction ? Le premier problème est le contexte, la qualité du tokenizer ou le cache KV ?

3. Utilisez Python purement pour réaliser QK-Norm. Donnez une requête en 64 dimensions et une clé, montrant le produit de point de LayerNorm. Pourquoi est-il important de contrôler la magnitude dans le réseau profond ?

4. Le modèle 34B observé dans le cadre de la "explosion de la norme" est caractéristique de la "explosion de la norme" sans QK-Norme.

5.  étendre le décodeur de jouets, en le rendant plus rapide dans un texte pur donné 时输出混合模态响应── dans la distribution de données de formation à 60% de texte-premier / 40% d'image-premier, dans le cas de la fréquence de sélection de modèle de mesure image-premier et de texte-premier──

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Early fusion | "Unified tokens" | 图像从第一步起就被转换为离散 Token，并共享 Transformer 的词表 |
| VQ-VAE | "Image tokenizer" | CNN + ViT + codebook，将图像映射为 Transformer 可预测的整数 indices |
| Shared vocabulary | "One dictionary" | 覆盖文本 + 图像 + 模态分隔符的单一 Token ID 空间 |
| QK-Norm | "Attention stabilizer" | 在 query 和 key 做 dot product 之前对它们应用 LayerNorm，防止 norm blowup |
| Mixed-modality generation | "Text + image output" | 一次 pass 中自主生成交错文本和图像 Token 的 inference |
| Codebook size | "K entries" | VQ-VAE 可 quantize 到的离散 Vector 数量；在压缩率和 fidelity 之间权衡 |
| Tokenizer ceiling | "Reconstruction limit" | 解码 VQ Token 能达到的最佳 PSNR；限制模型的图像质量 |

## 延伸阅读

- [Chameleon Team — Chameleon: Mixed-Modal Early-Fusion Foundation Models (arXiv:2405.09818)](https://arxiv.org/abs/2405.09818)
- [Aghajanyan et al. — CM3 (arXiv:2201.07520)](https://arxiv.org/abs/2201.07520)
- [Yu et al. — CM3Leon (arXiv:2309.02591)](https://arxiv.org/abs/2309.02591)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Adept — Fuyu-8B blog (adept.ai)](https://www.adept.ai/blog/fuyu-8b)
