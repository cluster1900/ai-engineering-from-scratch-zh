# GANs  Générateur contre Discriminateur

> Bon compagnon, les techniques de 2014 ont complètement sauté la densité. Deux réseaux. Un fabricant de faux. Un les capture. Ils s'opposent les uns aux autres jusqu'à ce que les faux ne soient pas distingués du vrai.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 08 (Optimizers), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

##  problématique

Les VAE produisent des échantillons flou, car leur perte de décodeur MSE est la meilleure pour les images Bayes, tandis que la moyenne de nombreux nombres raisonnables est un nombre flou. Vous voulez une perte de récompense* de raisonnabilité* plutôt que de récompense avec un objectif à un niveau approximatif de pixel.

Bon compagnon de l' idée: entraîner un classifiateur `D(x)`Pour distinguer la réalité et la fausse image.`G(z)`Pour vous tromper .`D`Il y a une autre.`G`Le signal de perte est le suivant:`D`On pense que quelque chose semble réel.`G`改进, ce signal sera également mis à jour, poursuite d'un objectif mobile.`G`Je n'ai jamais écrit.`log p(x)`Dans le cas où les données sont distribuées,

C'est une formation à l'adversité.

```
min_G max_D  E_real[log D(x)] + E_fake[log(1 - D(G(z)))]
```

Dès 2026, les GAN ne sont plus générateurs de SOTA, mais les deux tiers des modèles de faces les plus utiles ont encore été publiés, les discriminateurs GAN sont utilisés pour la diffusion dans la formation des pertes perceptuelles*, tandis que la formation des adversaires est basée sur des distillations rapides en 1 étape, SDXL-Turbo, SD3-Turbo, LCM, permettant la diffusion en temps réel.

## 概念

![GAN training: generator and discriminator in minimax](../assets/gan.svg)

**Generator `G(z)`。**Vecteur de bruit`z ~ N(0, I)`映射到样品 `x̂`◊ Un décodeur 形状的网络(dense 或转换 conv)

**Discriminator `D(x)`。**Pour le modèle, la probabilité de la probabilité est de 0,0 .

**Loss。**两个交替更新:

- **训练 `D`：** `loss_D = -[ log D(x) + log(1 - D(G(z))) ]`Pour faire une entropie binaire croisée,
- **训练 `G`：** `loss_G = -log D(G(z))`C'est un bon compagnon utilisé par les gens qui ne sont pas saturés.`log(1 - D(G(z)))`Il se saturait et il se sentait bien.`D`Je suis très confiant.

**Training loop。**Un pas`D`, étape `G`Je suis en train de vous dire.

**为什么它能工作。**Si `G`完美匹配 `p_data`Alors ...`D`Faire des suppositions est mieux que faire des suppositions, et il y a des sorties de 0,5;`G`Il n'y a pas de dégradation.

**为什么它会失效。**L'effondrement du mode`G`Trouver une`D`Je ne peux pas le faire, puis je le fais.`D`Je suis très rapide.`log D`Les taux d'apprentissage sont très élevés.

## 让 GANs Variantes utilisables

| Year | Innovation | Fix |
|------|------------|-----|
| 2015 | DCGAN | Conv/deconv、batch norm、LeakyReLU —— 第一个稳定 architecture。 |
| 2017 | WGAN, WGAN-GP | 用 Wasserstein distance + gradient penalty 替换 BCE。修复 vanishing gradient。 |
| 2017 | Spectral normalization | 对 discriminator 做 Lipschitz-bound。2026 年的 discriminators 中仍在使用。 |
| 2018 | Progressive GAN | 先训练低分辨率，再添加 layers。首次达到 megapixel results。 |
| 2019 | StyleGAN / StyleGAN2 | Mapping network + adaptive instance norm。固定领域 photorealism 的 state of the art。 |
| 2021 | StyleGAN3 | Alias-free、translation-equivariant —— 2026 年仍然是 face gold standard。 |
| 2022 | StyleGAN-XL | Conditional、class-aware、更大 scale。 |
| 2024 | R3GAN | 以更强 regularization 重新包装；无需 tricks 即可在 1024² 上工作。 |


```figure
gan-minimax
```

## - Je le construis.

`code/main.py`Dans les données 1-D 上训练一个小型GAN:两个高西亚的混合──生成器和分辨器 都是单层隐藏MLPs──我们手写实现前进、后退 和最小x loop──目标是看两个关键失败模式(模式崩 +消失梯度) 如何发生──

### 步骤 1: perte non saturante

La perte de la vanille Goodfellow`log(1 - D(G(z)))`Le gradient de G est essentiellement à zéro, G ne peut pas être amélioré, non saturant.`-log D(G(z))`具有相反的表情: Quand D 很自信时它会爆增, donnez à G un signal fort.

```python
def g_loss(d_fake):
    # maximize log D(G(z))  <=>  minimize -log D(G(z))
    return -sum(math.log(max(p, 1e-8)) for p in d_fake) / len(d_fake)
```

### 步骤 2: Chaque étape génératrice est confrontée à une étape discriminatoire

```python
for step in range(steps):
    # train D
    real_batch = sample_real(batch_size)
    fake_batch = [G(z) for z in sample_noise(batch_size)]
    update_D(real_batch, fake_batch)

    # train G
    fake_batch = [G(z) for z in sample_noise(batch_size)]  # fresh fakes
    update_G(fake_batch)
```

给 G utiliser des faux frais, sinon des gradients 会过期。

### 步骤 3: 观察 mode effondrement

```python
if step % 200 == 0:
    samples = [G(z) for z in sample_noise(500)]
    mode_a = sum(1 for s in samples if s < 0)
    mode_b = 500 - mode_a
    if min(mode_a, mode_b) < 50:
        print("  [!] mode collapse: one mode is starved")
```

经典症状: entre les deux modes réels, un est arrêté de se produire.

## La trappe

- **Discriminator 太强。**Le taux d'apprentissage de D est réduit de 2 à 5 fois, ou l'instance/couche de bruit est ajoutée. Si D atteint une précision de > 95%, G est mort.
- **Generator 记住了一个 mode。** donner des entrées D, plus de bruit, utiliser la couche de discriminateur minibatch, ou changer à WGAN-GP。
- **Batch norm 泄漏 statistics。**Les statistiques de l'échantillon réel + du faux échantillon sont combinées avec une couche BN.
- **Inception-score gaming。**FID 和 IS dans le nombre d'échantillons basse.
- **对于 conditional tasks，one-shot sampling 是谎言。**Vous avez encore besoin de balances CFG, de trucs de tronçage et de re-échantillonnage pour obtenir des résultats disponibles.

## Utilisez-le

GAN stack pour l'année 2026:

| Situation | Pick |
|-----------|------|
| Photoreal human faces, fixed pose | StyleGAN3（最锐利、最小） |
| Anime / stylized faces | StyleGAN-XL 或 Stable Diffusion LoRA |
| Image-to-image translation | Pix2Pix / CycleGAN（Phase 8 · 04）或 ControlNet（Phase 8 · 08） |
| Fast 1-step text-to-image | diffusion 的 adversarial distillation（SDXL-Turbo, SD3-Turbo） |
| Perceptual loss inside a diffusion trainer | image crops 上的小型 GAN discriminator |
| Anything multi-modal, open-ended | 不要用 —— 使用 diffusion 或 flow matching |

Les GAN sont très rares mais restreintes. Une fois que votre domaine est ouvert, par exemple, les photos, les textes, les vidéos, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, les messages, etc.

## Je le livre.

保存 `outputs/skill-gan-debugger.md` Skiller à recevoir une fois une GAN défaillante (coupes de perte, grille d'échantillon, taille du jeu de données), et à produire des causes selon la possibilité de répartition, des corrections en une seule ligne et des protocoles de répétition

## 练习

1. **Easy。**Utilisation de paramètres de fonctionnement`code/main.py` puis mise en place `D_LR = 5 * G_LR`La perte de G s'est effondrée rapidement.
2. **Medium。**Utilisation de la perte WGAN  remplacement de la perte de la BCE de Goodfellow:`loss_D = E[D(fake)] - E[D(real)]`- Je suis désolé .`loss_G = -E[D(fake)]`, et va faire le clip de poids de D à `[-0.01, 0.01]`◊ La formation est-elle plus stable ?
3. **Hard。**Pour étendre l'exemple 1-D aux données 2-D, le générateur de suivi des 8 mélanges gaussiens sur le cercle a capturé 8 modes, dont plusieurs ont été réalisés et a reconditionné les mesures.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Generator | "G" | noise-to-sample network，`G: z → x̂`。 |
| Discriminator | "D" | Classifier `D: x → [0, 1]`，real vs fake。 |
| Minimax | "The game" | joint objective 的 `min_G max_D`。 |
| Non-saturating loss | "The fix" | 对 G 使用 `-log D(G(z))`，而不是 `log(1 - D(G(z)))`。 |
| Mode collapse | "G memorized one thing" | 尽管 data 多样，Generator 只产生少量不同 outputs。 |
| WGAN | "Wasserstein" | 用 Earth-Mover distance + gradient penalty 替换 BCE；gradient 更平滑。 |
| Spectral norm | "Lipschitz trick" | 约束 D 的 weight norms 来 bound 它的 slope；稳定 training。 |
| StyleGAN | "The one that works" | Mapping network + AdaIN；faces 领域 best-in-class，2026 年仍然如此。 |

## Note de production: une seule prise d'effet est la durée de la GAN

Les GAN en génération de domaine ouvert ne gagnent plus en qualité d'échantillon, mais ils restent en coût d'inférence.

- **没有 prefill，没有 decode stages。**Une fois`G(z)`Passage à l'avant:
- **没有 KV-cache pressure。**L'état unique est les poids. La taille du lot est limitée par la mémoire d'activation.
- **Trivial continuous batching。**Comme chaque demande consomme les mêmes FLOP fixes, le serveur  objectif de l'occupation du lot statique est généralement le meilleur de la plupart.

C'est pourquoi la distillation GAN (SDXL-Turbo, SD3-Turbo, ADD, LCM) est une technologie de diffusion rapide de 2026 à 2050 étapes, qui se concentre sur des passages avant de 1 à 4 fois à la manière de la GAN, tout en conservant la distribution de la base de diffusion.

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) Origini GAN papier
- [Radford et al. (2015). Unsupervised Representation Learning with DCGAN](https://arxiv.org/abs/1511.06434) La première architecture stable
- [Arjovsky, Chintala, Bottou (2017). Wasserstein GAN](https://arxiv.org/abs/1701.07875) WGAN。
- [Miyato et al. (2018). Spectral Normalization for GANs](https://arxiv.org/abs/1802.05957) SN。
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2。
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) StyleGAN3。
- [Sauer et al. (2023). Adversarial Diffusion Distillation](https://arxiv.org/abs/2311.17042) SDXL-Turbo
