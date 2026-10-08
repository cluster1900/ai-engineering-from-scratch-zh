# Modélisation autorégressive visuelle (VAR): Prédiction à l'échelle suivante

> Diffusion 模型在时间上代采样 (代采样) .VAR在尺度上代采样, c'est-à-dire d'abord prédire un jeton 1x1, puis 2x2, puis 4x4, jusqu'à la résolution finale, chaque mesure est conditionnée à la mesure précédente.

**Type:** Build
**Languages:** Python (with PyTorch)
**Prerequisites:** Phase 7 Lesson 03 (Multi-Head Attention), Phase 8 Lesson 06 (DDPM)
**Time:** ~90 minutes

##  problématique

L'autorégressive 生成之所以主导语言建模,是因为它能预测地扩展:更多计算、更多参数、更低困惑、更好的输出──2024年之前, la génération d'images a principalement deux types de AR 尝试: pixelRNN/pixelCNN(逐像素) et DALL-E 1 / Parti / MuseGAN(在VQ-VAE codes 上逐 Token) ⋅

Les deux sont confrontés à des problèmes de séquence de génération. Les images et les jetons sont classés dans le réseau 2D, mais les modèles AR doivent utiliser l'ordre raster 1D pour les visiter. Les images de premier plan ne savent pas ce que l'image deviendra finalement.

VAR 通过改变生成对象来解决生成顺序问题──VAR ne se déroule pas dans l'espace individuellement pour prévoir des images Token, mais avec une résolution toujours meilleure pour prévoir des images 图像.

Chaque mesure se met à regarder toutes les mesures précédentes (en fonction de la cause) et se retrouve dans sa propre mesure.

## 概念

### Le marqueur à échelle multiple VQ-VAE

VAR  besoin d' un **multi-scale discrete Tokenizer**Pour une image x, il génère une série de jetons qui augmentent progressivement leur résolution:

```
x -> encoder -> latent f
f -> tokenize at 1x1: token grid z_1 of shape (1, 1)
f -> tokenize at 2x2: token grid z_2 of shape (2, 2)
...
f -> tokenize at (H/p)x(W/p): token grid z_K of shape (H/p, W/p)
```

Chaque z_k utilise le même codebook (typiquement 4096-16384) ⋅ Tokenization à chaque échelle n'est pas indépendante de l'autre, mais est entraînée à faire des besoins et à pouvoir reconstruire les résidus de chaque échelle:

```
f ≈ upsample(embed(z_1), target_size) + ... + upsample(embed(z_K), target_size)
```

C' est un .**residual VQ**变体──尺度 k 捕获尺度 1..k-1 遗漏的内容──Decoder 接收所有尺度 嵌入的和并生成图像──

Le Tokenizer VQ à grande échelle ne fait que s'entraîner une fois, alors tout le travail généré est réalisé par le modèle autorégressif.

### Prédition à l'échelle suivante

生成模型 est un transformateur, il voit tous les symboles de la précédente mesure, et prédit le symbole de la prochaine mesure.

Structure de séquence d'entrée:
```
[START, z_1 tokens, z_2 tokens, z_3 tokens, ..., z_K tokens]
```

Position Embedding avec code de mesure indication et position spatiale dans la mesure. L'attention sur la mesure de séquence est causelle de: mesure k, position (i, j) du Token Attention à la mesure 1..k de tous les Tokens, ou attention à la mesure k est utilisé dans l'ordre de l'ordre de l'échelle.

訓練 Loss: dans chaque mesure k, given all previousmeasure's Token, prédiction Token z_k。对离散 VQ codes ⇒ Utilisation de la perte de l'entropie croisée。 structure et GPT sont similaires, juste ici sequence est devenue une séquence structurée de la mesure。

### Produit

推理时:
```
generate z_1 = sample from p(z_1)                    # 1 token
generate z_2 = sample from p(z_2 | z_1)              # 4 tokens in parallel
generate z_3 = sample from p(z_3 | z_1, z_2)         # 16 tokens in parallel
...
decode: f = sum of embed-and-upsample scales 1..K
image = VAE_decoder(f)
```

Lorsque K = 10 dimensions, la génération nécessite 10 fois Transformer passer en avant. Chaque passage est effectué pour générer toute la taille, plutôt que de se retourner à chaque jeton dans la mesure. Pour 256x256 images, c'est environ 10 fois de passer, tandis que le DiT est de 28 à 50 fois.

### Pourquoi la prochaine échelle gagne la prochaine échelle ?

Trois avantages structurels:
1. **从粗到细符合自然图像统计规律。**Les règles relatives à la mesure présentée par le groupe de données et les perceptions visuelles de l'homme: structure stable et prévisible à faible fréquence; détails à faible fréquence en fonction du contenu.
2. **尺度内并行生成。**Contrairement au GPT, le Token AR, VAR, est un processus de génération de la longueur de génération de Token.
3. **没有生成顺序偏置。**Le jeton de taille k peut voir toute la taille k-1; il n'y a pas de décalage du côté gauche ou du côté supérieur, ne nécessite pas de faire des engagements avant que le jeton de taille k ne soit disponible en fin de période.

### Loi de l'échelle

Tian et al. proven VAR dans le FID de ImageNet following power-law scaling curve, justement comme la perplexité de GPT ∙∙∙∙∙ parametres ou calcul de la quantité doublée, sera fiable pour faire l'erreur ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙      ∙                                                                                                                                                                                                                                  

### Relation avec la diffusion

VAR et Diffusion partagent un seul récit de compression de données: les deux ont décomposé le problème de génération en une série de problèmes plus faciles.

- Diffusion: progressivement ajouter du bruit, apprendre à retirer un pas.
- VAR: progressivement augmenter la résolution, apprendre à prévoir la prochaine mesure.

Ils traversent différents axes de la même question. Ils produisent toutes deux une distribution de conditions à traiter.


```figure
gx-var-next-scale
```

## - Je le construis.

Dans le`code/main.py`Vous allez:
1. Dans le synthèse de l'image, il est possible de construire un petit ensemble d'anneaux gaussiens en 2D.**multi-scale VQ Tokenizer**Il y a une autre.
2. - Je suis un homme.**VAR-style Transformer**Pour le prochain jeton de prédiction à grande échelle.
3. 通過调用變壓器 4 次(4 个尺度)并解码来采样──
4. L'épreuve de la mise en œuvre de la méthode de formation permettra de générer des résultats dans la mesure.

Ceci est une mise en œuvre de jouets. L'important est de voir la dimension structurée.

## Je le livre.

本课会生成 `outputs/skill-var-tokenizer-designer.md`, c'est une compétence utilisée pour concevoir un Tokenizer à grande échelle: quantité de dimensions, proportion de dimensions, taille de codebook, partage résiduel, architecture de décodeur.

## 练习

1. **尺度数量消融。**Utilisez 4 ̊6 ̊8 ̊10 ̊ Travailler VAR― Mesurer la qualité de reconstruction avec la relation numérique des passes autorégressifs―Plus de mesure = plus de résidu = mieux de qualité, mais passe 更多―

2. **Codebook size。**Le codebook est plus grand que le codebook 512 4096 16384 et il est plus facile de le reconstruire.

3. **尺度内并行检查。**À l'échelle de l'échelle, le modèle est-il attentif à la position à l'échelle transversale mais pas à l'échelle intra-échelle ?

4. **VAR vs DiT scaling。**Pour la même tâche de classe-conditionnelle de ImageNet, dans le cadre du budget de l'image, entraînez VAR et DiT (par exemple 33M,130M、458M)  dessiner FID contre calcul.

5. **Text conditioning。**扩展 VAR,让它通过 adaLN 接收文本嵌入(CLIP pooled) comme input de conditionnement supplémentaire──这是HART 配方──它能让文本一致的样本上的FID 改善多少?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| VAR | "Visual AutoRegressive" | 通过在 VQ Token 网格金字塔上进行 next-scale prediction 来生成图像 |
| Next-scale prediction | "Predict coarser, then finer" | 模型以不断增加的分辨率尺度预测 Token，并以所有之前尺度为条件 |
| Multi-scale VQ tokenizer | "Residual VQ" | 生成 K 个分辨率递增 Token 网格的 VQ-VAE，decoder 会对所有尺度求和 |
| Scale k | "Pyramid level k" | K 个分辨率层级之一，从 k=1 的 1x1 到 k=K 的 (H/p)x(W/p) |
| Parallel-within-scale | "One forward per scale" | 尺度 k 的所有 Token 在一次 Transformer pass 中预测，而不是自回归预测 |
| Causal-across-scales | "Scale-ordered attention" | 尺度 k 的 Token 可以 Attention 到尺度 1..k 的全部内容，但不能 Attention 到尺度 k+1..K |
| Residual VQ | "Additive tokenization" | 每个尺度的 Token 编码较低尺度留下的 residual；decoder 对所有尺度 Embedding 求和 |
| VAR scaling law | "Image GPT scaling" | FID 随 compute 遵循可预测的 power law，类似语言模型的 perplexity |
| HART | "Hybrid VAR + text" | Text-conditional VAR 变体，将 MaskGIT-style iterative decoding 与 VAR 的尺度结构结合 |
| Scale position embedding | "(scale, row, col) triple" | Positional encoding 同时携带尺度索引和尺度内空间坐标 |

## 延伸阅读
- [Tian et al., 2024 — "Visual Autoregressive Modeling: Scalable Image Generation via Next-Scale Prediction"](https://arxiv.org/abs/2404.02905) VAR 论文, référence standard
- [Peebles and Xie, 2022 — "Scalable Diffusion Models with Transformers"](https://arxiv.org/abs/2212.09748) DiT, Diffusion par rapport à la ligne de référence
- [Esser et al., 2021 — "Taming Transformers for High-Resolution Image Synthesis"](https://arxiv.org/abs/2012.09841) VQGAN, VAR's multi-échelle Tokenizer
- [van den Oord et al., 2017 — "Neural Discrete Representation Learning"](https://arxiv.org/abs/1711.00937) VQ-VAE, base de la Tokenization des images
- [Tang et al., 2024 — "HART: Efficient Visual Generation with Hybrid Autoregressive Transformer"](https://arxiv.org/abs/2410.10812) VAR en termes de texte
