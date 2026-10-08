# Emu3: pour la génération d'images et de vidéos Prédiction de la prochaine touche

> Emu3(Wang et al., 2024 9 月) est le résultat de la dispute de diffusion et autorégressive 之争的2024年本应终结 Diffusion与autoregressive 之争的结果── un transformateur décodeur de style Llama unique, uniquement entraîné dans la prédiction du prochain jeton 目标, couvrant le texte + jetons d'image VQ + jetons vidéo 3D VQ, battre SDXL sur la génération d'images, sur le sensation de battre LLaVA-1.6── pas de perte CLIP── pas de guide gratuit de diffusion dans la raisonnerie, mais c'est le but de l'entraînement central qui est de forcer le professeur à prévoir le jeton suivant── publié dans la Nature── Le thème de l'Emu3 sur la nature, c'est pourquoi un meilleur jeton à la taille de votre jeton, vous pouvez lire tout ce que vous pouvez faire avec Diffusion, et il y aura une comparaison entre les méthodes de diffusion et la diffusion.

**Type:** Learn
**语言：**Python(stdlib,3D vidéo Tokenizer math + schéma de l'échantillon autorégressif)
**Prerequisites:** Phase 12 · 11（Chameleon）
**Time:** ~120 分钟

## Objectif de l'apprentissage
- 解释为什么Emu3's single-loss next-token 目标能够奏效, bien que depuis longtemps on ait supposé que la qualité d'image nécessite une diffusion.
- 描述 3D vidéo tokenizer:spatiotemporal VQ codebook 是什么样子,为什么补丁 会跨越时间──
- Comparer Emu3 à Stable Diffusion XL en calcul de formation  différence de calcul de coûts et de qualité
- Pour le modèle ému3, il joue trois rôles: ému3, génération d'images, ému3, chat, perception, ému3, stade, génération vidéo.

##  problématique
Le point de vue traditionnel de l'année 2024 est que la génération d'images nécessite une diffusion. Son point de vue est que les jetons d'image discrets perdent trop d'informations, ne peuvent pas reconstruire les détails, tandis que le prélèvement autorégressif se produit sur des milliers de jetons.

Emu3 正面挑战这个论点──它的主张是: meilleur Tokenizer visuel + 足够的规模 + next-token loss = Dans le même modèle qui peut également faire sensation, réaliser la génération d'images de Diffusion.

Il est devenu un chemin de recherche standard; les modèles de production de niveau frontalier semblent également utiliser une sorte de variation.

## 概念
### Le jeton ému3

关键成分是视觉Tokenizer──Emu3 训练一个定制IBQ-classTokenizer(Inverse Bottleneck Quantizer,SBER-MoVQGAN family), chaque jeton faire 8x8 résolution-réduction──一张 512x512 图像会变成64x64 = 4096 jetons,size codebook 为 32768──

Ceci par rapport à Chameleon en K=8192 时每张 512x512 1024 jetons plus gros, mais chaque jeton plus abordable(Plus petits codebook recherches, plus simple codec)  Indicateur clé: reconstruire PSNR pour 30,5 dB, et peut avec 32 dB d'espace latent continu de Diffusion stable 竞争──

Pour le vidéo: 3D VQ Tokenizer va être un patch spatiotemporal ((4x4x4 pixels) codé pour un nombre entier.

Le Tokenizer est le plus grand et le plus grand.

### Formation à perte unique

Emu3 utilise un objectif: le vocabulaire partagé des jetons de texte, des jetons d'image 2D et des jetons vidéo 3D, et effectue la prédiction du jeton suivant.

訓練数据混合 comprend:
- Genre d'image:`<text caption> <image> image_tokens </image>`
- Perception de l'image:`<image> image_tokens </image> <question> text_tokens`
- Génération vidéo:`<text caption> <video> video_tokens </video>`
- Perception vidéo: similaire.
- Seul texte: NTP standard

模型会从数据分布中学习何时输出图像代币何时输出文本代币―― capacité de génération de la capacité du modèle `<image>`标签后预测 des jetons d'image

### Guidance sans classifiant et température

L'image autorégressive est générée dans le cadre de la formation en utilisant des conseils sans classifiateur.

Température  très important: trop haute produira une pseudo-ombre; trop basse coïncidence du mode.

### Trois rôles, un modèle

Emu3 est diffusé par trois API différentes, mais la base est un ensemble de poids:

- Emu3-Gen──image generation──输入 text,输出 image tokens──
- Emu3-Chat──VQA 和 sous-titres──输入图像(tokens),输出文──
- Emu3-Étape2──video génération et vidéo VQA──输入文字或视频,输出文字或视频──

Note de tête spécifique à la tâche  seulement différents modèles de prompt  le même point de contrôle 

### Les points de référence

Il est également possible de faire des recherches sur les différents types de produits.

- 图像生成: dans le MJHQ-30K FID(5.4 vs 5.6)、GenEval globalement(0.54 vs 0.55,统计上打平) et composé de Deep-Eval 上 atteindre un niveau équivalent ou meilleur, dépassant SDXL。
- 图像感知: dans VQAv2(75.1 vs 72.4) supérieur à LLaVA-1.6, dans MMMU
- 视频生成:4-seconde de clip 质量在 FVD 上与 Sora-era Public benchmarked models 具备竞争力──

Ces chiffres ne sont pas toujours gagnants, les ému3 seront ici plus, là moins, mais la prédiction du prochain jeton est tout ce dont vous avez besoin.

### Coût de calcul

Emu3 utilise le modèle 7B-paramètre, dans environ 300 milliards de jetons multimodaux 上 тренинг。GPU-hours 大致相当于Llama-2-7B pré-entraînement(A100-class silicium 上 2k-4k GPU-years)。Stable Diffusion 3 这样 Diffusion models 训练预算类似,但需要独立的文码和更复杂的管道──

推理时,Emu3 每张图像比SDXL 慢:4096 image tokens,以 30 tok/s 计算,大约每张 512x512 图像 2 分钟,而SDXL 为 2-5 秒── Spéculative décoding 和 KV-cache optimisation 会缩小差距,但无法消除差距──Autoregressive image gen 计算量很大;这是目前的固定取舍──

### Pourquoi cela importe ?

Si la prédiction de la prochaine marque peut s'étendre à la diffusion correspondante dans la génération d'images, alors le modèle unifié est viable. Le futur modèle n'a pas besoin d'encodateurs de texte indépendants.

Le programme de recherche et de développement de l'information sur les données de l'entreprise (Show-o、Janus-Pro 和 InternVL-U) est basé sur ce thème ou sur des défis à relever.


```figure
l5-emu3-next-token
```

## Utilisez-le
`code/main.py`Construire deux jouets:

- Un jeton VQ 2D vs 3D numérique calculateur: given ((résolution, patch, clip_length、FPS), calculé image et vidéo des jetons numérique
- Un échantillon d'image autorégressive de température et de température.

La mise en œuvre du CFG est conforme à la coïncidence de l'Emu3, c'est-à-dire avec le poids de référence 混合 conditionnelle 和 logits inconditionnels。

## Je le livre.
本课产 出 `outputs/skill-token-gen-cost-analyzer.md` déterminer une spécification de produit de production (image ou vidéo  résolution de but  niveau de qualité  budget de latence), elle calcule le nombre de jetons  coût de calcul et fait le choix entre la famille Emu3 et la diffusion 

## 练习
1. Emu3 en 8x8 réduction, par page 512x512 image produisant 4096 jetons ⋅ calculer 1024x1024 et 2048x2048 de la même valeur ⋅ estimation de retard

2. 阅读Emu3 Section 3.3 中关于视频代码器的内容──描述3D VQ patch shape,以及为什么它是4x4x4而不是8x8x1──

3. Poids de guidage sans classifiateur 5.0 contre 3.0: quels sont les effets visuels ?`code/main.py`Le processus mathématique intermédiaire

4.  calculé Emu3-7B en 300B jetons 下的训练 FLOPs,并与稳定扩散3比较──哪个训练成本更高?

5. Les ému3 dans le FID sont supérieurs à ceux de SDXL, mais dans le VQAv2 ne sont pas aussi efficaces que dans les VLM spécialisés.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Next-token prediction | "NTP" | 标准 autoregressive loss：给定 token[0..i] 预测 token[i+1]；tokenized 后适用于每种 modality |
| IBQ tokenizer | "Inverse bottleneck quantizer" | 一类 VQ-VAE，codebooks 更大（32768+），重建效果优于 Chameleon 的 Tokenizer |
| 3D VQ | "Spatiotemporal quantizer" | 由（time、row、col）索引的 codebook；一个 Token 覆盖一个 4x4x4 pixel cube |
| Classifier-free guidance | "CFG" | 用 weight gamma 混合 conditional 和 unconditional logits；在推理时提升图像质量 |
| Unified vocabulary | "Shared tokens" | Text + image + video 都来自同一个 integer space；模型预测接下来出现的任何 modality |
| MJHQ-30K | "Image gen benchmark" | 含 30k prompts 的 Midjourney-quality benchmark；Emu3 在这里报告 FID |

## 延伸阅读
- [Wang et al. — Emu3: Next-Token Prediction is All You Need (arXiv:2409.18869)](https://arxiv.org/abs/2409.18869)
- [Sun et al. — Emu: Generative Pretraining in Multimodality (arXiv:2307.05222)](https://arxiv.org/abs/2307.05222)
- [Liu et al. — LWM (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Yu et al. — MAGVIT-v2 (arXiv:2310.05737)](https://arxiv.org/abs/2310.05737)
- [Tian et al. — VAR (arXiv:2404.02905)](https://arxiv.org/abs/2404.02905)
