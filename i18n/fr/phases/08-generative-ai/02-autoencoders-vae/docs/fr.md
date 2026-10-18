# Autodécodateurs et Autodécodateurs variatifs (VAE)

> Ordinary Autoencoder pré-compression re-construction. Il se souviendra. Il ne se générera pas. Ajouter une technique.$z = \mu + \sigma \cdot \epsilon$La réparamétrisation, c'est pourquoi chaque modèle d'image de diffusion latente et de correspondance de flux utilisé en 2026 a un VAE à l'entrée.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 07 (CNNs), Phase 8 · 01 (Taxonomy)
**Time:** ~75 分钟

## Le problème

Mettre un chiffre MNIST de 784 pixels  Comprimé en 16 chiffres de code, puis reconstruire── un ordinar Autoencoder se présente bien dans la reconstruction MSE, mais l'espace de code est un trou dans l'espace de code 凸不平── choisir un point, décoder, vous obtenez le bruit── il n'y a pas de échantillon── il ne sert que de modèle de compression de l'extérieur──

Vous voulez vraiment: a) l'espace de code est une distribution propre, plate, disponible dans l'échantillon, par exemple Gaussia isotrope$\mathcal{N}(0, I)$,(b) décoder n'importe quel échantillon, c) générer un chiffre raisonnable, c) encoder et décoder, c) encore très bien comprimé, trois objectifs, une architecture, une perte,

Kingma's 2013 VAE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       $q(z \mid x) = \mathcal{N}(\mu(x), \sigma(x)^2)$Pour résoudre ce problème, utilisez la pénalité KL et placez cette distribution en avant.$\mathcal{N}(0, I)$, puis en décodant avant de .$q(z \mid x)$échantillon $z$Dans l'inférence, j'ai perdu le codeur, l'échantillon.$z \sim \mathcal{N}(0, I)$La sanction KL est un mécanisme de structuration qui oblige l'espace de code.

En 2026, VAE 很少单独交付  Dans la qualité d'image originale, elles ont déjà été diffusées 超越  Mais elles sont le premier encodeur de chaque modèle de diffusion latente SD 1/2/XL/3、Flux、AudioCraft).

## Le concept

![Autoencoder vs VAE: the reparameterization trick](../assets/vae.svg)

**Autoencoder.** $z = \text{encoder}(x)$- Je suis là .$\hat{x} = \text{decoder}(z)$, perte = $\lVert x - \hat{x} \rVert^2$◊Espace de code 无结构。

**VAE encoder.**输出 Deux vecteurs:$\mu(x)$et $\log \sigma^2(x)$Ils ont défini.$q(z \mid x) = \mathcal{N}(\mu, \mathop{\mathrm{diag}}(\sigma^2))$Il y a une autre.

**Reparameterization trick.**De $q(z \mid x)$échantillon incontournable.$z = \mu + \sigma \cdot \epsilon$, parmi lesquels $\epsilon \sim \mathcal{N}(0, I)$Je suis là.$z$Oui $(\mu, \sigma)$ des gradients peuvent être traités `μ`et $\sigma$Il y a une autre.

**Loss.**Les preuves de la Bande inférieure (ELBO), deux éléments:

```math
\begin{aligned}
\text{loss} &= \text{重建误差} + \beta \cdot \mathrm{KL}[q(z \mid x) \,\Vert\, \mathcal{N}(0, I)] \\
&= \lVert x - \hat{x} \rVert^2 + \beta \cdot \sum_i \frac{\sigma_i^2 + \mu_i^2 - \log \sigma_i^2 - 1}{2}
\end{aligned}
```

La reconstruction$\hat{x}$           $x$Je vous en prie.$q(z \mid x)$推向前──它们相互权衡──小 $\beta$(le secteur de l'énergie)$<1$) = plus de échantillons, espace de code 不那么高斯人──大$\beta$(le secteur de l'énergie)$>1$) = 更干净的代码空间,更模糊的样本──β-VAE(Higgins 2017) fait connaître ce cycle,并开启了分解研究──

**Sampling.**Inference 时:抽取 $z \sim \mathcal{N}(0, I)$,avant par décodeur,.. une fois avant passage  不像拡散 那样需要反复采样──


```figure
vae-latent-grid
```

## Faites-le

`code/main.py`实现一个不使用 numpy或火的微型VAE──输入是从8D中的2组件高斯混合 抽取的8维合成数据──编码和解码都是单层密密 MLP──我们实现 tanh激活、前进通过、损失,以及手写后退通过──不是生产是教学──

### Étape 1: encodeur vers l'avant

```python
def encode(x, enc):
    h = tanh(add(matmul(enc["W1"], x), enc["b1"]))
    mu = add(matmul(enc["W_mu"], h), enc["b_mu"])
    log_sigma2 = add(matmul(enc["W_sig"], h), enc["b_sig"])
    return mu, log_sigma2
```

Utilisation $\log \sigma^2$Au lieu de$\sigma$, de sorte que la sortie du réseau est non-restrictée$\sigma \approx 0$Les gradients disparaîtront.

### Étape 2: réparamétrifier et décoder

```python
def reparameterize(mu, log_sigma2, rng):
    eps = [rng.gauss(0, 1) for _ in mu]
    sigma = [math.exp(0.5 * lv) for lv in log_sigma2]
    return [m + s * e for m, s, e in zip(mu, sigma, eps)]

def decode(z, dec):
    h = tanh(add(matmul(dec["W1"], z), dec["b1"]))
    return add(matmul(dec["W_out"], h), dec["b_out"])
```

### Étape 3: l'ELBO

```python
def elbo(x, x_hat, mu, log_sigma2, beta=1.0):
    recon = sum((a - b) ** 2 for a, b in zip(x, x_hat))
    kl = 0.5 * sum(math.exp(lv) + m * m - lv - 1 for m, lv in zip(mu, log_sigma2))
    return recon + beta * kl, recon, kl
```

精确的闭式KL,因为两个分布都是高斯的──不要数值积分──2026年仍然有人交付带蒙特卡洛KL的估算的代码  无理由地慢3x──

### Étape 4: générer

```python
def sample(dec, z_dim, rng):
    z = [rng.gauss(0, 1) for _ in range(z_dim)]
    return decode(z, dec)
```

C'est le modèle génératif.

## Les pièges

- **Posterior collapse.**Le terme KL est trop stimulant .$q(z \mid x) \to \mathcal{N}(0, I)$, à cause de$z$Je ne sais pas$x$Il est également possible de faire une analyse de la situation.$\beta=0$開始, progressivement monter à 1) 、free bits, ou dans les dimensions inactives sur KL ∼
- **Blurry samples.**La probabilité du décodeur gaussien signifie la reconstruction de l'ESM, elle est à l'égard de L2 l'optimal Bayes (mean)  un groupe de chiffres raisonnables  signifie un chiffre maladroit  modification: décodeur discrète (VQ-VAE、NVAE), ou simplement utiliser le VAE comme encodeur, et les latents sont en compilation de diffusion (Stable Diffusion c'est ce que nous faisons) 
- **β too large, too early.**- Il s'est effondré.$\beta \approx 0.01$Il y a une nouvelle étape.
- **Latent dim too small.**16-D  adapté au MNIST,256-D  adapté à ImageNet 2562,2048-D  adapté à ImageNet 10242。 VAE de diffusion stable va être 512×512×3  comprimé à 64×64×4;; surface spatiale supérieure à 32x facteur de échantillonnage en bas, canaux supérieure à 32x)。

## Utilisez-le

L'accumulation de 2026 de VAE:

| Situation | Pick |
|-----------|------|
| Image-latent encoder for diffusion | Stable Diffusion VAE (`sd-vae-ft-ema`) or Flux VAE |
| Audio-latent encoder | Encodec (Meta), SoundStream, or DAC (Descript) |
| Video latents | Sora's spatiotemporal patches, Latte VAE, WAN VAE |
| Disentangled representation learning | β-VAE, FactorVAE, TCVAE |
| Discrete latents (for transformer modelling) | VQ-VAE, RVQ (ResidualVQ) |
| Continuous latents for generation | Plain VAE, then condition a flow/diffusion model in that latent space |

Le modèle de diffusion latente est un modèle de diffusion, situé entre le codeur et le décodeur.

## La faire partir

保存 `outputs/skill-vae-trainer.md`Il y a une autre.

Les compétences 接收:profil du ensemble de données + cible latente-dim + utilisation en aval(réconstruction, échantillonnage ou entrée de diffusion latente),并输出: choix d'architecture(plain/β/VQ/RVQ)$q(z \mid x)$et $\mathcal{N}(0, I)$¦ entre la distance Fréchet) ¦

## Exercices

1. **Easy.**Je ne sais pas .`code/main.py`Le centre$\beta$改为 `0.01`- Je suis là.`0.1`- Je suis là.`1.0`- Je suis là.`5.0` enregistrer la reconstruction finale de MSE 和 KL. Pour vos données synthétiques, quelle est la taille de votre corps ?$\beta$C'est le meilleur ?
2. **Medium.**Utiliser la probabilité de Bernoulli (perte de croisée entropie) pour remplacer la probabilité du décodeur gaussien (en anglais) dans la même version binaire des données synthétiques.
3. **Hard.**Il va`code/main.py`扩展成一个 mini VQ-VAE:用 K=32 entrées du codebook 中的近邻搜索 替换连续 $z$◊ Comparer la reconstruction MSE,并 rapporté qu'il y a beaucoup d'entrées de codebook utilisées ◊ effondrement du codebook est réellement existant ◊

## Les termes clés

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Autoencoder | Encode-decode network | $x \to z \to \hat{x}$，学习 MSE。不是 generative。 |
| VAE | 带 sampler 的 AE | Encoder 输出一个 distribution，KL penalty 塑造 code space。 |
| ELBO | Evidence lower bound | $\log p(x) \ge \text{recon} - \mathrm{KL}[q(z \mid x) \Vert p(z)]$；当 $q = p(z \mid x)$ 时 tight。 |
| Reparameterization | $z = \mu + \sigma \cdot \epsilon$ | 将 stochastic node 重写为 deterministic + pure noise。使 sampling 可参与 backprop。 |
| Prior | $p(z)$ | latent 的目标 distribution，通常是 $\mathcal{N}(0, I)$。 |
| Posterior collapse | “KL term wins” | Encoder 忽略 $x$，输出 prior；decoder 必须 hallucinate。 |
| β-VAE | 可调 KL weight | $\text{loss} = \text{recon} + \beta \cdot \mathrm{KL}$。更高 $\beta$ = 更 disentangled 但更模糊。 |
| VQ-VAE | Discrete latent | 用 nearest codebook vector 替换 continuous $z$；支持 transformer modelling。 |

## 生产提示:VAE est le serveur de diffusion Le plus chaud des itinéraires

Dans le pipeline Stable Diffusion / Flux / SD3, chaque demande sera utilisée deux fois  Une fois pour encoder (si on fait img2img / inpainting), une fois pour décoder.`128×128×16`échantillon de l'échantillon`1024×1024×3`◊ Deux résultats concrets:

- **对 decode 做 slicing 或 tiling。** `diffusers` exposé `pipe.vae.enable_slicing()`et `pipe.vae.enable_tiling()`❖ Tiling avec une petite quantité d' artefacts de couture 换取 $O(\text{tile}^2)$La mémoire, plutôt que $O(H \cdot W)$◊ Pour les GPU de consommation, le 10242+ est essentiel.
- **bf16 decoder，最终 resize 使用 fp32 numerics。**SD 1.x VAE a été publié à partir de fp32 et a été lancé à partir de 10242+ à partir de fp16 时会 *stillness produire NaNs*──SDXL 提供 `madebyollin/sdxl-vae-fp16-fix` 总是 prioritaire l'utilisation de la variante fp16-fix, ou l'utilisation de bf16。

## Pour en savoir plus

- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) papier VAE。
- [Higgins et al. (2017). β-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework](https://openreview.net/forum?id=Sy2fzU9gl) β-VAE démêlées
- [van den Oord et al. (2017). Neural Discrete Representation Learning](https://arxiv.org/abs/1711.00937) VQ-VAE。
- [Vahdat & Kautz (2021). NVAE: A Deep Hierarchical Variational Autoencoder](https://arxiv.org/abs/2007.03898) image de pointe VAE。
- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) Diffusion stable;VAE comme encodeur。
- [Défossez et al. (2022). High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) Encodec, standard audio VAE
