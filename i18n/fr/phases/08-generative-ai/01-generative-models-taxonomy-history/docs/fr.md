# Modèles génératifs  分类法与历史

> Chaque modèle d'image, modèle de texte, modèle vidéo et modèle 3D appartient à l'une des cinq catégories.

**类型:**Apprendre à apprendre
**语言:**Python
**先修要求:**Phase 2 (fonctionnalités de l'enseignement supérieur), phase 3 (centre d'apprentissage profond), phase 7 · 14 (transformateurs)
**时间:**- 45 minutes

##  problématique

Modèle génératif faire une chose: déterminer une distribution inconnue`p_data(x)`extraction de l'échantillon d'entraînement, la sortie semble provenir d'un nouveau échantillon de la même distribution 

Il est difficile de trouver`p_data`Il existe dans un espace de plusieurs millions de dimensions (une image RGB 512x512 avec environ 786k dimensions), le modèle se trouve dans cet espace avec une très petite variété de variétés, et vous ne pouvez avoir que 10M de variétés. La densité de recherche de résolution est sans espoir.

Au cours des 12 dernières années, cinq familles ont survécu. Comprendre ce que chaque famille fait, vous dira pourquoi elle réussit sur certaines missions et pourquoi elle s'effondre sur d'autres.

## 概念

![Generative models 的五个家族 — 按它们建模的对象分类](../assets/taxonomy.svg)

**1. Explicit density, tractable。**Il va`log p(x)`写成一个你真的能计算的求和──Modèles autorégressifs (PixelCNN, WaveNet, GPT) seront `p(x) = ∏ p(x_i | x_<i)`Pour les flux de normalisation (NVP réel, Glow)`p(x)`构建一个简单基础 分布的可逆变换――优点:精确概率,干净的训练 Loss──缺点:autorégressive 推理是顺序的(长序列会慢),流动 需要可逆架构(架构限制很强)。

**2. Explicit density, approximate。**De la définition ci-dessous`log p(x)`(ELBO)并优化这个界限──VAEs (Kingma 2013) 使用带变化后的编码-decoder──Diffusion models (DDPM, Ho 2020) 训练一个指标,它隐式优化加权 ELBO──Diffusion is 2026 年图像、视频和 3D 的主导脊柱──

**3. Implicit density。** complètement sauter la densité; apprendre un générateur de génération de l'échantillon `G(z)`, ainsi qu' un discriminateur de jugement vrai et faux .`D(x)`GANs (Goodfellow 2014) 推理很快(一次进步通过), mais le processus de formation est devenu un succès incertain── même en 2026, StyleGAN 1/2/3 dans le domaine du photoréalisme fixe ((人脸、卧室) est toujours à la pointe de la technologie──

**4. Score-based / continuous-time。**直接学习 log-densité de la gradient `∇_x log p(x)`(score) ――Song & Ermon (2019)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

**5. 基于 Token 的离散 codes 上的 autoregressive。**Utilisez VQ-VAE ou quantificateur résiduel pour compresser les données en un segment de séquences de jetons dispersés plus courts, puis utilisez Transformer pour la séquence de jetons 建模──Parti、MuseNet、AudioLM、VALL-E、Sora.

## 简史

| 年份 | 模型 | 为什么重要 |
|------|-------|-----------------|
| 2013 | VAE (Kingma) | 第一个拥有可用训练 Loss 的 deep generative model。 |
| 2014 | GAN (Goodfellow) | Implicit density，没有 likelihood，却能产生惊人锐利的样本。 |
| 2015 | DRAW, PixelCNN | 顺序图像生成。 |
| 2017 | Glow, RealNVP | 可逆 flows；通过 depth 获得精确 likelihood。 |
| 2017 | Progressive GAN | 第一个 megapixel 人脸。 |
| 2019 | StyleGAN / StyleGAN2 | 在人脸这个单一领域中，photorealistic faces 依然很难被击败。 |
| 2020 | DDPM (Ho) | Diffusion 变得实用。 |
| 2021 | CLIP, DALL-E 1, VQGAN | Text-to-image 进入主流。 |
| 2022 | Imagen, Stable Diffusion 1, DALL-E 2 | Latent diffusion + text conditioning = 商品化。 |
| 2022 | ControlNet, LoRA | 对 pretrained diffusion 进行精细控制。 |
| 2023 | SDXL, Midjourney v5, Flow matching | 规模 + 更好的训练动态。 |
| 2024 | Sora, Stable Diffusion 3, Flux.1 | Video diffusion；flow matching 胜出。 |
| 2025 | Veo 2, Kling 1.5, Runway Gen-3, Nano Banana | 生产级视频。 |
| 2026 | Consistency + Rectified Flow | 从 diffusion backbones 进行一步采样。 |

## 五问分诊

Lorsque un nouveau modèle génératif apparaît, avant de commencer à lire la section méthode, réponds à ces cinq questions:

1. **建模的是什么？**Des pixels, des latences, des jetons de dispersion, des gaussiens 3D, des réseaux, des formes d'onde ?
2. **Density 是 explicit 还是 implicit？**Ils ont écrit ?`log p(x)`- Je suis désolé .
3. **Sampling：one-shot 还是 iterative？**Iteratif signifie "attendre plus lentement"; un coup signifie généralement "adversitaire" ou "destilé".
4. **Conditioning：unconditional、class、text、image、pose？**C'est ce qui décide de la perte et de la construction.
5. **Evaluation：FID、CLIP score、IS、human preference、task accuracy？**Chacun a des modes d'échec connus.

Vous répéterez ces cinq questions à chaque cours de cette phase.


```figure
autoencoder-bottleneck
```

## - Je le construis.

Le code de ce cours est une visualisation à faible quantité: utilisez trois méthodes de jouets (la densité du noyau, l'histogramme de dispersion, ainsi que le générateur de l'échantillon le plus proche) pour adapter un mélange 1D de Gaussins à partir du modèle, afin que vous puissiez voir la différence de densité explicite vs implicite sur une question qui peut imprimer à l'écran.

运行  référencement`code/main.py`Il est extrait d'un mélange gaussien à deux sommets, puis imprimé:

```
explicit density (histogram): p(x in [-0.5, 0.5]) ≈ 0.38
approximate density (KDE):     p(x in [-0.5, 0.5]) ≈ 0.41
implicit (nearest-sample gen): 20 new samples printed, no p(x)
```

Remarque: les deux premiers vous permettent de vous demander si ce point est possible.

## Utilisez-le

En 2026, quelle famille va s'adapter à quelles missions ?

| 任务 | 最佳家族 | 原因 |
|------|-------------|-----|
| Photoreal faces，窄领域 | StyleGAN 2/3 | 仍然最锐利，推理最快。 |
| 通用 text-to-image | Latent diffusion + flow matching | SD3, Flux.1, DALL-E 3。 |
| 快速 text-to-image | Rectified flow + distillation | SDXL-Turbo, SD3-Turbo, LCM。 |
| Text-to-video | Diffusion Transformer + flow matching | Sora, Veo 2, Kling。 |
| Speech + music | Token-based AR (AudioLM, VALL-E, MusicGen) 或 flow matching (AudioCraft 2) | 离散 tokens 扩展成本低。 |
| 3D scenes | Gaussian Splatting fit, diffusion prior | 3D-GS 用于重建，diffusion 用于 novel-view。 |
| Density estimation（不采样） | Flows | 唯一拥有精确 `log p(x)` 的家族。 |
| Simulation / physics | Flow matching, score SDE | 直线路径，平滑 Vector fields。 |

## Je le livre.

保存为 `outputs/skill-model-chooser.md`Il y a une autre.

Cette compétence  recevoir une tâche description并输出: 1) utiliser quelles familles, 2) trois options ouvertes et trois séries d'options hébergées, 3) vous devriez vous soucier du mode d'échec possible, ainsi que 4) calculer / budget de temps.

## 练习

1. **Easy。**Pour les cinq produits suivants, identifier sa famille et sa colonne vertébrale: Image ChatGPT, Midjourney v7, Sora, Runway Gen-3, ElevenLabs,
2. **Medium。**Vous devez lire le texte qui affirme que le taux de diffusion est de 100 fois plus élevé.
3. **Hard。**选择一个你关心的领域 (例如蛋白质结构,CAD,分子轨迹) ⋅ Pour ce domaine, le modèle SOTA actuel répond à cinq questions, et trace un meilleur modèle qui changera quoi¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## 关键术语

| 术语 | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| Generative model | “它会生成新东西” | 学习 `p_data(x)` 的 sampler，可选地暴露 `log p(x)`。 |
| Explicit density | “你可以计算它” | 模型提供 closed-form 或 tractable 的 `log p(x)`。 |
| Implicit density | “GAN-style” | 只有 sampler——无法计算给定点的 `p(x)`。 |
| ELBO | “Evidence lower bound” | `log p(x)` 的一个 tractable 下界；VAEs 和 diffusion 会优化它。 |
| Score | “log-density 的 Gradient” | `∇_x log p(x)`；diffusion 和 SDE models 学习这个 field。 |
| Manifold hypothesis | “数据存在于一个表面上” | 高维数据集中在低维 manifold 上；这就是 dimensionality reduction 有效的原因。 |
| Autoregressive | “预测下一个片段” | 将 joint 因式分解为 conditionals 的乘积。 |
| Latent | “压缩 code” | 一种低维表示，decoder 可以从中重建输入。 |

## Produit: 5 familles, 5 types de formations

Chaque famille est projetée sur différents serveurs d'inférence 成本曲线──production-inférence 文献将 LLM 推理框定为预填 +解码;

- **Autoregressive（类别 1 和 5）。**顺序 decode 主导 latency;KV-cache、continuous batching 和 speculative decoding 都可以直接应用──
- **VAE / diffusion / flow-matching（类别 2 和 4）。**Il n'y a pas de décode LLM.`num_steps × step_cost`, et `step_cost`Il est en résolution latente complète.
- **GAN（类别 3）。**Une fois de plus, il n'y a pas de calendrier, pas de cache KV, pas de latence totale.

Lorsque vous voyez dans un résumé d'article un coût plus rapide que diffusion, traduisez-le en moins de étapes × coût de la même étape × coût de la même étape × coût de la même étape × plus abordable.

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) GAN 论文。
- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) VAE 论文。
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) DDPM 论文。
- [Song et al. (2021). Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456) 作为 SDE diffusion。
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) flux correspondant 论文。
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) Diffusion stable 3。
