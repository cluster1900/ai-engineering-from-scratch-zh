# Les flux correspondant aux flux corrigés

> Les modèles de diffusion ont besoin de 20 à 50 étapes de mise en œuvre, car ils vont suivre le chemin du bruit vers les données.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 06 (DDPM), Phase 1 · Calculus
**Time:** ~45 minutes

##  problématique

Le processus de réaction du DDPM est un processus de réaction.`N(0, I)`Retour à la distribution des données 1000 étapes avec le processus de détail. Le DIM est réduit à 20 à 50 étapes de détermination.

Si vous pouvez entraîner un modèle, faire de la route du bruit aux données une ligne droite, alors de `t=1`À la`t=0`Le processus de construction de l'équipement de l'équipement est de type:`x_1 ∼ N(0, I)`À la`x_0 ∼ data`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `v_θ(x, t)`Pour le faire correspondre à son temps, et en déduire le temps de calcul.

Le flux rectifié (Liu 2022) est plus approfondi: avec la procédure de reflux 代地拉直路径, générer un ODE progressivement plus proche de la ligne.

## 核心概念

![Flow matching: straight-line interpolation between noise and data](../assets/flow-matching.svg)

### Flux direct

定义:

```
x_t = t · x_1 + (1 - t) · x_0,   t ∈ [0, 1]
```

Parmi eux `x_0 ~ data`- Je suis désolé .`x_1 ~ N(0, I)` Le nombre de temps de la ligne droite est le nombre constant:

```
dx_t / dt = x_1 - x_0
```

 définir un champ de vecteur neuronal `v_θ(x_t, t)`,并训练它匹配这个导数:

```
L = E_{x_0, x_1, t} || v_θ(x_t, t) - (x_1 - x_0) ||²
```

C' est ça .**conditional flow matching**Loss(Lipman 2023)。 entraînement n'a pas besoin de simulation:`(x_0, x_1, t)`Il n'y a pas de régression.

### 采样

Dans l'inférence, le champ vectoriel de l'instruction est:

```
x_{t-Δt} = x_t - Δt · v_θ(x_t, t)
```

De `x_1 ~ N(0, I)`Commencez avec l'étape d'Euler.`t=0`Il y a une autre.

### Flux rectifié (Liu 2022)

Le flux direct peut fonctionner, mais le chemin de l'apprentissage* n'est pas en fait direct*, car il y a beaucoup de`x_0`Ça peut être diffusé sur le même.`x_1`❖ Étapes de reflux du débit rectifié:

1. Utilisation de l'entraînement avec le modèle de flux v_1──
2. 通过将 v_1 从 `x_1`积分到其落点 `x_0`, en ce qui concerne`(x_1, x_0)`Il y a une autre.
3. En effet, ces deux types de couplage sont actuellement en phase avec l'ODE, la ligne d'interaction entre eux est plus plate.
4. Je vous en prie.

En pratique, 2 fois le reflux est capable de se rapprocher de la ligne, ce qui permet de réaliser une inférence en 2 à 4 étapes.

### Pourquoi a-t-il gagné en 2024 dans le domaine de l'image ?

Trois raisons:

1. **Simulation-free training**Le programme de formation est très simple à réaliser.
2. **更好的 Loss geometry**Le direct-routeau a un signal-à-bruit uniforme, tandis que le DDPM ε-perte est très faible en SNR.
3. **更快的 inference**: en SDXL-Turbo 质量下 nécessite 4 à 8 étapes;

## Parallèle des flux versus DDPM:

带 Gauss conditionné de la trajectoire de flux correspondant est l'utilisation de * un programme de bruit spécifique * de Diffusion。选择 `x_t = α(t) x_0 + σ(t) x_1`Le calendrier, le flux correspondant, et la diffusion réformée par Stratonovich, entre autres.`v = α'·x_0 - σ'·x_1`Pour les chemins gaussiens, les deux sont égaux en prix.

Le flux de correspondance est augmenté par: objectif de la * clarté de la * normale de la vitesse)


```figure
normalizing-flow
```

## - Je le construis.

`code/main.py`Dans le double sommet de la mixture gaussienne, il est possible de réaliser une correspondance de flux en 1D.`v_θ(x, t)`Il s'agit d'un petit MLP, en utilisant une formation directe de but.

### 步骤 1: Perte de formation

```python
def train_step(x0, net, rng, lr):
    x1 = rng.gauss(0, 1)
    t = rng.random()
    x_t = t * x1 + (1 - t) * x0
    target = x1 - x0
    pred = net_forward(x_t, t)
    loss = (pred - target) ** 2
    # backprop + update
```

### 步骤 2: inférence en plusieurs étapes

```python
def sample(net, num_steps):
    x = rng.gauss(0, 1)
    for i in range(num_steps):
        t = 1.0 - i / num_steps
        dt = 1.0 / num_steps
        x -= dt * net_forward(x, t)
    return x
```

### 步骤 3: Comparer le nombre de étapes

Le prélèvement de l'échantillon de 4 étapes est déjà capable de répondre à la qualité de 20 étapes, ce qui est important pour la latence.

## - C' est facile.

- **Time parameterization。**Correspondance de débit`t ∈ [0, 1]`, parmi lesquels `t=0`Les données sont`t=1`Il y a beaucoup de bruit.`t ∈ [0, T]`, parmi lesquels `t=0`Les données sont`t=T`C'est le même bruit, les mêmes directions, les mêmes dimensions.
- **Schedule choice。**Le flux rectifié de l'échantillonnage est le calendrier de correspondance de flux, mais vous pouvez également utiliser le cosine ou le t-échantillonnage normal logique (SD3) pour obtenir une meilleure mesure de couverture.
- **Reflow cost。**Pour reflux, un ensemble de données de production de reflux est équivalent à chaque échantillon qui fait une inférence complète une fois.
- **Classifier-free guidance 仍然适用。**Il suffit de mettre en ligne le composé et de le changer en v:`v_cfg = (1+w) v_cond - w v_uncond`Il y a une autre.

## Utilisez-le

| Use case | 2026 stack |
|----------|-----------|
| Text-to-image，最佳质量 | Flow matching：SD3、Flux.1-dev |
| Text-to-image，1-4 步 | Distilled flow matching：Flux.1-schnell、SD3-Turbo、SDXL-Turbo |
| 实时 inference | 来自 flow-matched base 的 consistency distillation（LCM、PCM） |
| Audio generation | Flow matching：Stable Audio 2.5、AudioCraft 2 |
| Video generation | Flow matching 与 Diffusion 混合（Sora、Veo、Stable Video） |
| Science / physics（particle trajectories、molecules） | Flow matching + equivariant Vector field |

Il s'agit de la même méthode de distillation.

## Je le livre.

保存 `outputs/skill-fm-tuner.md` cette compétence 接收一个 Diffusion-style model spec,并将其转换为流量匹配训练配置:schedule choice、time sampling distribution(uniform/logit-normal) Optimiser、reflow plan、target step count、val protocol。

## 练习

1. **Easy。**运行  référencement`code/main.py`, comparer la performance de la distribution de données réelles par rapport à la MSE de 1 étape et de 20 étapes.
2. **Medium。**De l'uniforme`t`Le prélèvement 切换到logit-normal (en anglais) 将采样集中在中 t) ・model 质量是否提升?
3. **Hard。**实现一次回流 代: 通过积分第一个模型 生成对 (x_0, x_1), 在这些对上训练第二个模型,并比较1步样品质量──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Flow matching | “Straight-line diffusion” | 训练 `v_θ(x, t)`，使其沿 interpolant 匹配 `x_1 - x_0`。 |
| Rectified flow | “Reflow” | 拉直已学习 flows 的迭代过程。 |
| Velocity field | “v_θ” | model 的输出，即移动 `x_t` 的方向。 |
| Straight-line interpolant | “The path” | `x_t = (1-t)·x_0 + t·x_1`；目标导数很简单。 |
| Euler sampler | “1st order ODE solver” | 最简单的 integrator；当路径较直时效果很好。 |
| Logit-normal t | “SD3 sampling” | 将 `t` sampling 集中到 gradients 最强的中间值附近。 |
| Consistency distillation | “1-step sampler” | 训练 student 将任意 `x_t` 直接映射到 `x_0`。 |
| CFG with velocity | “v-CFG” | `v_cfg = (1+w) v_cond - w v_uncond`；同样技巧，新的变量。 |

## Note de production:Flux.1-schnell est le plus rapide de forme de correspondance de flux

Le flux de production est de 1 à 4 étapes de déduction, tout en conservant le flux de débit sur un ordinateur de 8 Go.

| Variant | Steps | Latency at 1024² on L4 | Total FLOPs (relative) |
|---------|-------|------------------------|------------------------|
| Flux.1-dev (raw) | 50 | ~15 s | 1.0× |
| Flux.1-schnell | 4 | ~1.2 s | 0.08× (12× faster) |
| SDXL-base | 30 | ~4 s | 0.25× |
| SDXL-Lightning 2-step | 2 | ~0.3 s | 0.03× |

Règles de production:**flow-matched base + distillation = 2026 年快速 text-to-image 的默认方案。**Chaque fabricant principal est en train de publier ce composé:SD3-Turbo(SD3 + flux + distillation)、Flux-schnell(Flux-dev + rectifié-flux)、CogView-4-Flash──pure base de diffusion Il existe uniquement dans les points de contrôle anciens

## 延伸阅读
- [Liu, Gong, Liu (2022). Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003) flux rectifié。
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) correspondance de flux。
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, débit rectifié à grande échelle
- [Albergo, Vanden-Eijnden (2023). Stochastic Interpolants](https://arxiv.org/abs/2303.08797) 覆盖 FM + Diffusion
- [Song et al. (2023). Consistency Models](https://arxiv.org/abs/2303.01469) Destilation en 1 étape de diffusion / flux 
- [Sauer et al. (2023). Adversarial Diffusion Distillation (SDXL-Turbo)](https://arxiv.org/abs/2311.17042) Variante turbo。
- [Black Forest Labs (2024). Flux.1 models](https://blackforestlabs.ai/announcing-black-forest-labs/) correspondance des flux de production
