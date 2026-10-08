# GAN conditionnels avec Pix2Pix

> La première percée majeure de 2014-2017 est de contrôler GAN 生成什么──附加一个标签、一张图像,或一个句子──Pix2Pix fait une version image, et sur une tâche étroite d'image à image, elle a encore gagné chaque modèle général de texte à image──

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 06 (U-Net), Phase 3 · 07 (CNNs)
**Time:** ~75 分钟

##  problématique
无条件 GAN 会采样任意人脸──做演示 有用,进生产 没用──你想要的是:*把草图 映射成照片*、*把地图 映射成空图*、*把白天场景 映射成夜间*、*给灰色图片 上色*──在所有这些任务中,你会得到一个输入图片`x`, et doit être produite avec une correspondance sémantique de`y`Tout le monde.`x`Tout est possible pour beaucoup de choses raisonnables.`y`◊ L'erreur de la moyenne carré les réduira en erreur.

GAN conditionnelle (Mirza & Osindero, 2014)`c`作为输入加入 `G`et `D`Pix2Pix (Isola et coll., 2017) a fait une spécialisation à ce sujet: condition est une image d'entrée complète, générateur est U-Net, discriminateur est un classifiateur par patch (PatchGAN), Perte est adversaire + L1── même en 2026 année, ce ensemble de composition est encore plus important que le modèle texte-image, car il s'entraîne sur les données parées*.

## 概念
![Pix2Pix: U-Net generator, PatchGAN discriminator](../assets/pix2pix.svg)

**Conditional G.** `G(x, z) → y`Dans Pix2Pix,`z`Il n'y a pas de bruit de sortie  Isola 发现显式噪音 会被忽略)

**Conditional D.** `D(x, y) → [0, 1]`◊输入是 *pair*(condition, sortie) ◊这是关键差异:D 必须判断 `y`      `x`Un coup, et pas seulement juger.`y`Ça semble être vrai.

**U-Net generator.**带有跨瓶跳连接的编码器-decoder──对于输入和输出共享低级结构的任务至关重要──没有这些跳转,高频细节会消失──

**PatchGAN discriminator.**D ne sort pas un seul score réel/faux, mais une seule.`N×N`Grille, chaque cellule juge environ 70×70 pixels de champ réceptif.

**Loss.**

```
loss_G = -log D(x, G(x)) + λ · ||y - G(x)||_1
loss_D = -log D(x, y) - log (1 - D(x, G(x)))
```

L1 项稳定训练,并推动 G 接近已知目标──L1 产生更利的边缘 (médiens, et non moyens) ⋅`λ = 100`C'est la valeur par défaut de Pix2Pix.

## CycleGAN  lorsque vous n'avez pas de paires

Pix2Pix 需要对合 `(x, y)`Les données CycleGAN (Zhu et coll., 2017) 通过额外的 Loss 放弃这个要求:*consistance du cycle* perte――deux générateurs:`G: X → Y`et `F: Y → X` Les entraîner, faire`F(G(x)) ≈ x`且 `G(F(y)) ≈ y`                                                                                                                                                                                                                                                              

En 2026, une image à image non couplée (ControlNet、IP-Adapter) est terminée, et non CycleGAN, mais la cohérence du cycle est toujours présente dans presque tous les domaines d'adaptation non couplée.


```figure
gx-patchgan
```

## - Je le construis.
`code/main.py`Dans les données 1D, une condition conditionnelle GAN est mise en œuvre.`c`≈ étiquette de classe ≈ 0 ou 1) ≈ mission: ≈ pour une classe déterminée 生成一个来自条件分布的样本──

### 步骤 1: Va condition 添加到 G 和 D 的输入

```python
def G(z, c, params):
    return mlp(concat([z, one_hot(c)]), params)

def D(x, c, params):
    return mlp(concat([x, one_hot(c)]), params)
```

Le codage à l'une des chaînes est le moyen le plus simple. Les modèles plus grands utiliseront des intégrations apprises.

### 步骤 2: train conditionné

```python
for step in range(steps):
    x, c = sample_real_conditional()
    noise = sample_noise()
    update_D(x_real=x, x_fake=G(noise, c), c=c)
    update_G(noise, c)
```

Le générateur doit correspondre à la réelle distribution de la condition ci-dessous, et non à la marge.

### Étape 3: vérifier chaque classe de sortie

```python
for c in [0, 1]:
    samples = [G(noise, c) for noise in batch]
    mean_c = mean(samples)
    assert_near(mean_c, real_mean_for_class_c)
```

## La trappe
- **Condition 被忽略。**G 学会 marginaliser, D 从不惩罚,因为 condition signal 太弱──修复:更强地 condition D(région précoce,而不只是 tard), utiliser le discriminateur de projection (Miyato & Koyama 2018)──
- **L1 weight 过低。**G 漂移到任意看起来真实输出, plutôt que fidèles ones──Pix2Pix style 任务从 λ≈100 开始──
- **L1 weight 过高。**G                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- **D 中 ground-truth leakage。**Il va`(x, y)`Concat  comme entrée D,而不只是 `y`◊ sinon D 无法检查一致性──
- **每个 class 的 mode collapse。**Chaque classe peut s'effondrer indépendamment.

## Utilisez-le
2026  tâche de l'image à l'image:

| Task | Best approach |
|------|---------------|
| Sketch → photo, same domain, paired data | Pix2Pix / Pix2PixHD（仍然快，仍然锐利） |
| Sketch → photo, unpaired | 带 Scribble conditioning model 的 ControlNet |
| Semantic seg → photo | SPADE / GauGAN2 或 SD + ControlNet-Seg |
| Style transfer | 带 IP-Adapter 或 LoRA 的 Diffusion；GAN methods 属于 legacy |
| Depth → photo | Stable Diffusion 上的 ControlNet-Depth |
| Super-resolution | Real-ESRGAN (GAN), ESRGAN-Plus, 或 SD-Upscale (diffusion) |
| Colorization | ColTran、diffusion-based colorizers，或 Pix2Pix-color |
| Daytime → nighttime, seasons, weather | CycleGAN 或 ControlNet-based |

Lorsque (a) vous avez des milliers d'exemples en couple, (b) les tâches sont étroites et récurrentes, et (c) vous avez besoin d'une inférence rapide, Pix2Pix est toujours un outil correct.

## Je le livre.
保存 `outputs/skill-img2img-chooser.md` Skiller 接收 tâche description  disponibilité des données (paré contre non paré  échantillons N) et budget de latence/qualité, puis输出:approche Pix2Pix CycleGAN ControlNet variant SDXL + IP-Adapter)  exigences de formation des données  coût d'inference 和 protocole d'évaluation  LPIPS  FID、 tâche spécifique) 

## 练习
1. **Easy.**修改 `code/main.py`, rejoindre la troisième classe. Confirmer que G continue de faire le bruit de chaque classe.
2. **Medium.**Dans le cadre de la 1D, utilisez la perte de style perceptuel pour remplacer la L1 (par exemple, un petit D gelé comme extracteur de fonctionnalités)
3. **Hard.**Dans le cadre de la 1ère dimension, un CycleGAN est élaboré: deux distributions, deux générateurs, perte de cycle, démontrant qu'il peut être cartographié entre les deux sans données en paire.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Conditional GAN | “带 labels 的 GAN” | G(z, c), D(x, c)。两个 networks 都看到 condition。 |
| Pix2Pix | “Image-to-image GAN” | 带 U-Net G 和 PatchGAN D + L1 loss 的 paired cGAN。 |
| U-Net | “带 skips 的 encoder-decoder” | 对称 conv network；skips 保留 high-freq。 |
| PatchGAN | “Local-realism classifier” | D 输出 per-patch score，而不是 global score。 |
| CycleGAN | “Unpaired image translation” | 两个 G + cycle-consistency loss；没有 paired data。 |
| SPADE | “GauGAN” | 用 semantic map normalize intermediate activations；segmentation-to-image。 |
| FiLM | “Feature-wise linear modulation” | 来自 condition 的 per-feature affine transform；便宜的 conditioning。 |

## Produit: Pix2Pix  comme ligne de base de la réception

Lorsque vous avez des données en couple et des tâches restreintes, le schéma → la carte sémantique → la photo, le jour → la nuit)

| Path | Steps | Typical latency at 512² on a single L4 |
|------|-------|----------------------------------------|
| Pix2Pix (U-Net forward) | 1 | ~30 ms |
| SD-Inpaint or SD-Img2Img | 20 | ~1.2 s |
| SDXL-Turbo Img2Img | 1-4 | ~0.15-0.35 s |
| ControlNet + SDXL base | 20-30 | ~3-5 s |

Pix2Pix dans les lots statiques de débit 上胜出(Chaque demande 都是相同的 FLOPs)。Diffusion dans la qualité 和 généralisation 上胜出。 La pratique moderne est généralement pour une tâche étroite de livraison du modèle distillé Pix2Pix,并为尾输入 提供diffusion fallback。

## 延伸阅读
- [Mirza & Osindero (2014). Conditional Generative Adversarial Nets](https://arxiv.org/abs/1411.1784) cGAN 论文。
- [Isola et al. (2017). Image-to-Image Translation with Conditional Adversarial Networks](https://arxiv.org/abs/1611.07004) Pix2Pix
- [Zhu et al. (2017). Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks](https://arxiv.org/abs/1703.10593) CycleGAN。
- [Wang et al. (2018). High-Resolution Image Synthesis with Conditional GANs](https://arxiv.org/abs/1711.11585) Pix2PixHD
- [Park et al. (2019). Semantic Image Synthesis with Spatially-Adaptive Normalization](https://arxiv.org/abs/1903.07291) SPADE / GauGAN。
- [Miyato & Koyama (2018). cGANs with Projection Discriminator](https://arxiv.org/abs/1802.05637) projection D。
