# Modèles de diffusion  DDPM à partir de zéro

> Ho、Jain、Abbeel(2020) a donné à ce domaine une méthode inébranlable―utiliser le bruit 经过一千个小步骤摧毁数据―trainer un réseau neural pour prédire le bruit―en inference 时反转这个过程―aujourd'hui, chaque image, vidéo、3D和音乐模型都运行在这个循环上,可能还在上面叠加流量匹配或一致性技巧―

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 8 · 02 (VAE)
**Time:** ~75 分钟

## Le problème

Tu veux un usage ?`p_data(x)`Les GAN jouent à un jeu de minimax régulièrement diffusé. Les VAEs se produisent par décodeur gaussien.`log p(x)`Les échantillons de qualité SOTA correspondent à la qualité de la SOTA.

Sohl-Dickstein et coll. (2015) ont donné une réponse théorique: définir une chaîne de Markov qui s'inscrit progressivement dans le bruit gaussien.`q(x_t | x_{t-1})`,并训练一个逆链 `p_θ(x_{t-1} | x_t)`Pour dénoncer. Ho, Jain, Abel, 2020) a démontré que la perte peut être simplifiée en une ligne  预测 noise  并整理数学.

## Le concept

![DDPM: forward noise, reverse denoise](../assets/ddpm.svg)

**Forward process `q`.**Dans le`T`个小步骤中加入 Gaussia noise──Forme fermée  数学可处理的原因  是累积步骤 仍然是 Gaussia:

```
q(x_t | x_0) = N( sqrt(α̅_t) · x_0,  (1 - α̅_t) · I )
```

Parmi eux `α̅_t = ∏_{s=1..t} (1 - β_s)`, à l' égard d' un`β_t`Le calendrier`β_t`Dans T = 1000 étapes, de 1e-4 à 0,02 linear change,`x_T`J' ai été proche de toi .`N(0, I)`Il y a une autre.

**Reverse process `p_θ`.**Apprendre à utiliser un réseau neuronal`ε_θ(x_t, t)`, pré测被加入的噪音──给定 `x_t`, selon le terme désigné:

```
x_{t-1} = (1 / sqrt(α_t)) · ( x_t - (β_t / sqrt(1 - α̅_t)) · ε_θ(x_t, t) )  +  σ_t · z
```

Parmi eux `σ_t`Il faut que ça soit.`sqrt(β_t)`C'est une variance apprise. Cette expression est horrible, mais c'est juste un nombre.`q(x_{t-1} | x_t, x_0)`Dans ce cas, il est nécessaire de trouver une solution.`x_{t-1}`,并用 estimation prévue par le bruit 替换 `x_0`Il y a une autre.

**Training loss.**

```
L_simple = E_{x_0, t, ε} [ || ε - ε_θ( sqrt(α̅_t) · x_0 + sqrt(1 - α̅_t) · ε,  t ) ||² ]
```

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `x_0`, choisissez un .`t`, échantillon `ε ~ N(0, I)`, par la forme fermée , une fois de plus bruyant`x_t`,并对噪音做回归──一个 Loss,没有最小x,没有KL,没有重构技巧──

**Sampling.**De `x_T ~ N(0, I)`Je suis en train de commencer.`t = T`À la`1`代 pas inverse。完成。

## Pourquoi ça marche ?

Je suis en train de vous dire:

1. **Denoising is easy; generating is hard.**Dans le`t=T`Les données sont un bruit pur. Il faut résoudre un problème trivial.`t=0`Il suffit de nettoyer quelques pixels.`t`Le problème est difficile, mais le réseau obtient de nombreux gradients parmi le même groupe de poids de chaque niveau de bruit.

2. **Score matching in disguise.**Vincent(2011) preuve, pré测 bruit et ainsi de suite`∇_x log q(x_t | x_0)`,也就是 *score*──reverse SDE Utilisez ce score 沿着密度梯度 上行  一次被引导的随机走,走向高概率地区──

3. **The ELBO reduces to simple MSE.**完整变化下界在每步步都有一个KL terme──使用DDPM的参数化,这些KL termes 会简化为带特定系数的噪音预测MSE;Ho 去掉系数(称其为 简单损失),质量反而 *提高* 了──


```figure
diffusion-denoise
```

## Faites-le

`code/main.py`réaliser un DDPM 1-D──Les données sont un mélange à deux modes──net est un micro type de MLP, recevoir `(x_t, t)`Il n'y a pas de bruit prévisible.

### Étape 1: calendrier anticipé (formule fermé)

```python
betas = [1e-4 + (0.02 - 1e-4) * t / (T - 1) for t in range(T)]
alphas = [1 - b for b in betas]
alpha_bars = []
cum = 1.0
for a in alphas:
    cum *= a
    alpha_bars.append(cum)
```

### Étape 2: échantillon `x_t`en une seule prise

```python
def forward_sample(x0, t, alpha_bars, rng):
    a_bar = alpha_bars[t]
    eps = rng.gauss(0, 1)
    x_t = math.sqrt(a_bar) * x0 + math.sqrt(1 - a_bar) * eps
    return x_t, eps
```

### Étape 3: une étape de formation

```python
def train_step(x0, model, alpha_bars, rng):
    t = rng.randrange(T)
    x_t, eps = forward_sample(x0, t, alpha_bars, rng)
    eps_hat = model_forward(model, x_t, t)
    loss = (eps - eps_hat) ** 2
    return loss, gradient_step(model, ...)
```

### Étape 4: prélèvement inverse

```python
def sample(model, alpha_bars, T, rng):
    x = rng.gauss(0, 1)
    for t in range(T - 1, -1, -1):
        eps_hat = model_forward(model, x, t)
        beta_t = 1 - alphas[t]
        x = (x - beta_t / math.sqrt(1 - alpha_bars[t]) * eps_hat) / math.sqrt(alphas[t])
        if t > 0:
            x += math.sqrt(beta_t) * rng.gauss(0, 1)
    return x
```

Pour un problème 1D de 40 étapes et 24 unités de MLP, il faut environ 200 époques pour apprendre à mélanger deux modes.

## Conditionnement du temps

Il faut savoir quel est le temps que cela dénote.

- **Sinusoidal embedding.**类似 Transformer de codage positionnel。`embed(t) = [sin(t/ω_0), cos(t/ω_0), sin(t/ω_1), ...]`❖ Transmission en MLP, diffusion sur le net
- **Film / group-norm conditioning.**Dans chaque bloc, le projet d'intégration est pour l'échelle/bias par canal.

Nous avons un code de jouet utilisé en synusoïde → concat.

## Les pièges

- **Schedule matters a lot.**Linear `β`C'est le DDPM par défaut, mais le calendrier cosine (Nichol & Dhariwal, 2021) dans le même calcul, donne un meilleur FID.
- **Timestep embedding is fragile.**Je ne sais pas .`t`作为浮游 传入对玩具 1-D 可行,但对图像会失败;始终使用适当嵌入──
- **V-prediction vs ε-prediction.**pour un régime très petit ou très grand,`ε`很差──V-prédition`v = α·ε - σ·x`) plus stable;SDXL、SD3 和 Flux sont utilisés.
- **Classifier-free guidance.**Inference 时, simultanément calculé conditionnel 和 inconditionnel `ε`Alors ...`ε_cfg = (1 + w) · ε_cond - w · ε_uncond`, parmi lesquels `w ≈ 3-7`Leçon 08 sera couverte.
- **1000 steps is a lot.**La production utilise le DDIM ((20-50 étapes)、DPM-Solver ((10-20 étapes) ou la distillation ((1-4 étapes)―see Leçon 12―

## Utilisez-le

| Role | Typical stack in 2026 |
|------|-----------------------|
| Image pixel-space diffusion (small, toy) | DDPM + U-Net |
| Image latent diffusion | VAE encoder + U-Net or DiT (Lesson 07) |
| Video latent diffusion | Spatiotemporal DiT (Sora, Veo, WAN) |
| Audio latent diffusion | Encodec + diffusion transformer |
| Science (molecules, proteins, physics) | Equivariant diffusion (EDM, RFdiffusion, AlphaFold3) |

La diffusion est la colonne vertébrale générative générale. Le flux correspondant (leçon 13) est le concurrent des années 2024-2026, en la même qualité.

## La faire partir

保存 `outputs/skill-diffusion-trainer.md` Skille 接收数据集 + budget de calcul,并输出:schedule(linear/cosine/sigmoid) objectif de prédiction(ε/v/x)  nombre d'étapes、échelle de guidage、famille d'échantillons 和 protocole d'évaluation。

## Exercices

1. **Easy.**Dans le`code/main.py`Comment est-il possible de réduire la qualité de l'échantillon ?
2. **Medium.**De la prédiction ε 切换到 v-prediction──重新推导 l'étape inverse──比较最终样品质──
3. **Hard.**添加 guidance sans classifiateur ∙以 étiquette de classe `c ∈ {0, 1}`Pour condition, pendant l'entraînement, 10% du temps de la chute, et l'utilisation de l'échantillonnage.`ε = (1+w)·ε_cond - w·ε_uncond`La mesure`w = 0, 1, 3, 7`Le taux de coupe de mode conditionnel

## Les termes clés

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Forward process | “Adding noise” | 固定 Markov chain `q(x_t \| x_{t-1})`，用于摧毁 data。 |
| Reverse process | “Denoising” | Learned chain `p_θ(x_{t-1} \| x_t)`，用于重构 data。 |
| β schedule | “The noise ladder” | Per-step variance；linear、cosine 或 sigmoid。 |
| α̅ | “Alpha bar” | Cumulative product `∏(1 - β)`；给出从 `x_0` 得到 `x_t` 的 closed-form。 |
| Simple loss | “MSE on noise” | `\|\|ε - ε_θ(x_t, t)\|\|²`；所有 variational derivations 都 collapse 到这里。 |
| ε-prediction | “Predict noise” | 输出是被加入的 noise；standard DDPM。 |
| V-prediction | “Predict velocity” | 输出是 `α·ε - σ·x`；在整个 t 上有更好的 conditioning。 |
| DDPM | “The paper” | Ho et al. 2020；linear β、1000 steps、U-Net。 |
| DDIM | “Deterministic sampler” | Non-Markov sampler，20-50 steps，同一个 training objective。 |
| Classifier-free guidance | “CFG” | 混合 conditional 和 unconditional noise predictions 来放大 conditioning。 |

## Note de production: l'inférence de diffusion est un problème de décompte par étapes

Le papier DDPM 运行 T=1000 revers steps── nobody put it into production 交付── chaque véritable pile d'inférence 城市会选择三种策略之一  并且每种都能清晰映射到生产框架:延迟 来源:

1. **Faster sampler, same model.**DDIM(20-50 étapes)、DPM-Solver++(10-20)、UniPC(8-16)。Remplacement de la boucle inverse; déjà entraîné `ε_θ`Les poids sont différents. La latence est réduite de 20 à 50 fois.
2. **Distillation.**訓練 student 以更少步骤 匹配 teacher:Progressive Distillation(2 → 1)、Modèles de cohérence(arbitrary → 1-4)、LCM、SDXL-Turbo、SD3-Turbo── ultérieurement réduire la latence de 5-10×, nécessite une reformation。
3. **Caching and compilation.** `torch.compile(unet, mode="reduce-overhead")`Les arrière-plan de diffusion de TensorRT-LLM`xformers`/SDPA attention、bf16 poids── va par étape latence réduire environ 2×──可与 (1) 和 (2) 叠加──

 Pour le serveur de diffusion de production, la conversation budgétaire et la littérature de production  pour les LLM: la latence est la même `num_steps × step_cost + VAE_decode`, le débit est `batch_size × (num_steps × step_cost)^-1`TTFT 很小(un pas);TPOT-équivalent est le temps de réponse complet, parce que, du point de vue de l'utilisateur, la génération d'images est all-at-one──

## Pour en savoir plus

- [Sohl-Dickstein et al. (2015). Deep Unsupervised Learning using Nonequilibrium Thermodynamics](https://arxiv.org/abs/1503.03585) papier de diffusion,超前于时代。
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) DDPM。
- [Song, Meng, Ermon (2021). Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502) DDIM, moins de mesures 
- [Nichol & Dhariwal (2021). Improved DDPM](https://arxiv.org/abs/2102.09672) calendrier cosine, variance apprise 
- [Dhariwal & Nichol (2021). Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/abs/2105.05233) orientation pour le classement
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG。
- [Karras et al. (2022). Elucidating the Design Space of Diffusion-Based Generative Models (EDM)](https://arxiv.org/abs/2206.00364) notation unifiée, la recette la plus claire.
