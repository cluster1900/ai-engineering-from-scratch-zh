# StyleGAN

> La plupart des générateurs vont le faire.`z`En même temps, dans chaque étage.`z`映射到中间表示 `w`, puis par AdaIN dans chaque niveau de résolution * injection * `w` Ce changement a ouvert l'espace latent, et fait de la photo un problème résolu pendant sept ans.

**类型：**Construction
**语言：**Python
**前置要求：**La phase 8 · 03 (ANG), la phase 4 · 08 (normalité), la phase 3 · 07 (CNN)
**时间：**- 45 minutes

##  problématique

DCGAN  via des convolutions transposées`z`映射成一张图像── la question est:`z`Tout est contrôlé, y compris la posture, la lumière, l'identité, le contexte, et ils sont tous enlisés ensemble.`z`Vous ne pouvez pas exiger un modèle de la même personne, une posture différente, car ce n'est pas comme ça.

Karras et coll. (2019, NVIDIA)  proposé: arrêter`z`Envoyer directement dans les couches de convection.`4×4×512`Ténseur 作为网络输入──学习一个8层 MLP,把 `z ∈ Z → w ∈ W` par * normalisation d'instance adaptative* (AdaIN) en chaque résolution`w`: d'abord normaliser chaque carte de fonctionnalités de con, puis utiliser `w`Les projections affine faire l'échelle 和 shift。为随机细节(皮毛孔、发丝)

Le résultat est:`W`Pour le style de haute altitude (gestition、身份) avec le style de petite taille (光照、颜色) il y a un grand nombre de faces de l'axe.`w` comme style de niveau de résolution basse, 并使用图像B的`w`En tant que style à haute résolution, il est possible de changer les styles entre les deux images.

## 概念

![StyleGAN: mapping network + AdaIN + per-layer noise](../assets/stylegan.svg)

**Mapping network。** `f: Z → W`Une 8 étages de MLP.`Z = N(0, I)^512`Il y a une autre.`W`Il n'est pas forcé pour Gaussian, mais il apprend à adapter les données à la forme.

**Synthesis network。**De l'apprentissage à la formation`4×4×512`開始── chaque bloc de résolution:`upsample → conv → AdaIN(w_i) → noise → conv → AdaIN(w_i) → noise`La résolution est de 4, 8, 16, 32, 64, 128, 256, 512, 1024

**AdaIN。**

```
AdaIN(x, y) = y_scale · (x - mean(x)) / std(x) + y_bias
```

Parmi eux `y_scale`et `y_bias`Je suis venu .`w`Les projections affine  selon la carte des caractéristiques se normalisent, puis se réappliquent au style                                                                                                                                                                                                                                                  

**逐层 noise。**À chaque carte de caractéristiques addition de bruit gaussien à travers un seul canal, et par l'apprentissage de chaque facteur de passage, il contrôle les détails, sans affecter la structure globale 

**Truncation trick。**En effet, les résultats de l'enquête ont été obtenus.`z`, calcul `w = mapping(z)`Alors ...`w' = ŵ + ψ·(w - ŵ)`, parmi lesquels `ŵ`C'est la moyenne de beaucoup de modèles.`w`Il y a une autre.`ψ < 1`Avec beaucoup de changements de qualité.`ψ ≈ 0.7`Il y a une autre.

## StyleGAN 1 → 2 → 3

| 版本 | 年份 | 创新 |
|---------|------|------------|
| StyleGAN | 2019 | Mapping network + AdaIN + noise + progressive growing。 |
| StyleGAN2 | 2020 | Weight demodulation 替代 AdaIN（修复 droplet artifacts）；skip/residual architecture；path-length regularization。 |
| StyleGAN3 | 2021 | Alias-free convolution + equivariant kernels；消除 texture 粘在 pixel grid 上的问题。 |
| StyleGAN-XL | 2022 | Class-conditional, 1024², ImageNet。 |
| R3GAN | 2024 | 以更强的 reg 重新包装；在 FFHQ-1024 上用少 20 倍的 params 缩小与 diffusion 的差距。 |

Jusqu'en 2026, StyleGAN3 est toujours la priorité de la situation suivante: a) la production de photos dans un domaine restreint de haute fréquence de diffusion, b) l'adaptation à quelques coups de domaine, avec 100 images dans un nouveau ensemble de données, et la cartographie. c) l'édition basée sur l'inversion.`w`, réédite cette .`w`Pour le secteur de la diffusion, le texte à l'image n'est pas un outil adapté.


```figure
gx-stylegan-mapping
```

## - Je le construis.

`code/main.py`实现 un 1-D de jouets version style-GAN lite: un MLP de cartographie, une fonction de synthèse, il reçoit appris à de la constante de la quantité Vecteur,并用从 `w`L'échelle/bias des émissions  sont modulées, il y a aussi des niveaux de bruit .`w`, peut atteindre ou dépasser `z`拼接进生成器输入方式──

### 步骤 1: réseau de cartographie

```python
def mapping(z, M):
    h = z
    for i in range(num_layers):
        h = leaky_relu(add(matmul(M[f"W{i}"], h), M[f"b{i}"]))
    return h
```

### 步骤 2: normalisation de l'instance adaptative

```python
def adain(x, w_scale, w_bias):
    mu = mean(x)
    sd = std(x)
    x_norm = [(xi - mu) / (sd + 1e-8) for xi in x]
    return [w_scale * xi + w_bias for xi in x_norm]
```

Chaque carte de caractéristiques de l'échelle et de l'inclinaison sont par projection linéaire de `w`Je l'ai reçu.

### 步骤 3: bruit par couche

```python
def add_noise(x, sigma, rng):
    return [xi + sigma * rng.gauss(0, 1) for xi in x]
```

Chaque passage de Sigma est appréciable.

## La trappe

- **Droplet artifacts。**StyleGAN 1 apparaît sur les cartes de fonctionnalités pour produire une goutte en forme de bloc, car AdaIN Place signifie 归零了──StyleGAN 2 démodulation du poids 通过缩放卷积重量来修复它──
- **Texture sticking。**Les textures de StyleGAN 1 et 2 suivent les coordonnées de pixel, et non les coordonnées d'objet.
- **Mode coverage。**La découpe`ψ < 0.7`Il semble propre, mais il ne prend qu'une très petite forme de zone; si vous avez besoin de diversité, utilisez `ψ = 1.0`Il y a une autre.
- **Inversion 有损。**Pour faire inverser la photo réelle`W`Il est généralement réalisé par optimisation ou par encoder (e4e, ReStyle, HyperStyle)

## Utilisez-le

| 使用场景 | 方法 |
|----------|----------|
| 照片级真实人脸（anime、product、窄领域） | StyleGAN3 FFHQ / custom fine-tune |
| 从照片进行人脸编辑 | e4e inversion + StyleSpace / InterFaceGAN directions |
| Face swap / reenactment | StyleGAN + encoder + blending |
| Avatar pipelines | StyleGAN3 w/ ADA for low-data fine-tune |
| 从少量图像做 domain adaptation | 冻结 mapping network，fine-tune synthesis |
| Multimodal 或 text-conditioned generation | 不要用它，使用 diffusion |

Pour la réponse est  une photo de visage  de la démo de produit, StyleGAN en déduction coût  un seul passage à l'avant, en 4090 au dessus <10ms) et la même qualité  sous la netteté  de la diffusion 

## Je le livre.

保存 `outputs/skill-stylegan-inversion.md`◊Skill 接收一张真实照片并输出:méthode d'inversion (e4e / ReStyle / HyperStyle) 、 prévision de perte latente 、 édition du budget ]]`W`Le nombre de personnes concernées est de plus en plus élevé.

## 练习

1. **简单。**Pour moi .`adain_on=True`et `adain_on=False`运行  référencement`code/main.py`◊ Comparer le latent fixe à celui du perturbateur latent
2. **中等。**实现 la régularisation du mélange: pour un lot de formation, calcul `w_a`- Je suis là.`w_b`, et appliqué à la première moitié de la synthèse.`w_a`, dernière partie de l'application`w_b`Le décodeur y a-t-il des styles démêlés ?
3. **困难。**取一个预训练的StyleGAN3 FFHQ模型(ffhq-1024.pkl) ⋅通过在带标签样本上训练 SVM,找到控制 smile 的 `w`Le rapport sur la situation de la population peut être considéré comme un facteur important.

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Mapping network | “那个 MLP” | `f: Z → W`，8 层，把 latent geometry 与数据统计解耦。 |
| W space | “Style space” | Mapping network 的输出；大致 disentangled。 |
| AdaIN | “Adaptive instance norm” | Normalize feature map，然后由 `w`-projection 做 scale + shift。 |
| Truncation trick | “Psi” | `w = mean + ψ·(w - mean)`，ψ<1 用多样性换质量。 |
| Path-length regularization | “PL reg” | 惩罚 `w` 中单位变化导致的图像大幅变化；让 `W` 更平滑。 |
| Weight demodulation | “StyleGAN2 的修复” | Normalize conv weights 而不是 activations；消除 droplet artifacts。 |
| Alias-free | “StyleGAN3 的技巧” | Windowed sinc filters；消除 texture 粘在 pixel grid 上的问题。 |
| Inversion | “为真实图像找到 w” | Optimize 或 encode `x → w`，使 `G(w) ≈ x`。 |

## Produit: Pourquoi StyleGAN en 2026 peut encore être en ligne

4090 StyleGAN3 能在10 ms内生成一张 10242 FFHQ 人脸:`num_steps = 1`Il n'y a pas de décodage VAE, pas de passe d'attention croisée.**300× 差距**, pour les produits de secteur restreint, les services d'avatar, les pipelines de documents d'identification, la génération de faces de stock, il est en TCO 上胜出.

Les résultats:

- **没有 scheduler，没有 batcher。**Le débit de la demande est le plus élevé. Le débit continu est indispensable pour les LLM et la diffusion.
- **Truncation `ψ` 是安全旋钮。** `ψ < 0.7`De la carte réseau                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `ψ`, pour les utilisateurs premium  améliorer ⋅

## 延伸阅读

- [Karras et al. (2019). A Style-Based Generator Architecture for GANs](https://arxiv.org/abs/1812.04948) StyleGAN。
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2。
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) StyleGAN3。
- [Tov et al. (2021). Designing an Encoder for StyleGAN Image Manipulation](https://arxiv.org/abs/2102.02766) inversion e4e。
- [Sauer et al. (2022). StyleGAN-XL: Scaling StyleGAN to Large Diverse Datasets](https://arxiv.org/abs/2202.00273) StyleGAN-XL
- [Huang et al. (2024). R3GAN: The GAN is dead; long live the GAN!](https://arxiv.org/abs/2501.05441) 现代最小化 GAN recette。
