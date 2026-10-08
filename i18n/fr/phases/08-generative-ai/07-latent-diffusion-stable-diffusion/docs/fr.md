# Diffusion latente et diffusion stable

> Rombach et al. (2022) notent que la production d'une image ne nécessite pas la totalité des 786k dimensions, vous avez besoin de suffisamment pour capturer la dimension de la structure de la langue, ainsi qu'un décodeur unique pour traiter le reste de la partie.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 02 (VAE), Phase 8 · 06 (DDPM), Phase 7 · 09 (ViT)
**Time:** ~75 minutes

##  problématique

La diffusion de l'espace-pixel 5122 signifie que U-Net doit être en forme`[B, 3, 512, 512]`Pour un réseau U de 500 M, chaque étape de mise en œuvre est d'environ 100 GFLOPS.

Ces FLOPs ont été largement utilisés pour faire la perception de détails non importants sur le réseau, c'est-à-dire ceux qui ont perdu VAE en pouvant être comprimés en haute fréquence.

C' est la diffusion stable . SD 1.x / 2.x Utilisez un 860M U-Net  traitement `64×64×4`Les données sont en cours de rédaction.`128×128×4`,SD3 Utility Flow Matching Diffusion Transformer (DiT) a remplacé U-Net。Flux.1-dev (Black Forest Labs, 2024)  a publié un DiT-MMDiT de 12B-paramètre── elles fonctionnent toutes sur le même dosage basse.

## 概念

![Latent diffusion: VAE compression + diffusion in latent space](../assets/latent-diffusion.svg)

**两个阶段，分别训练。**

1. **Stage 1 — VAE.**Le codeur `E(x) → z`, décodeur `D(z) → x` taux de contraction de l'objectif: pour chaque espace axé sous la forme de 8×, réajustement du canal, rendant la taille totale latente d'environ 1/16 du nombre de pixels.`z`Je ne serai pas forcé de faire trop de Gaussian, parce que nous n'avons pas besoin de lui.`z`Faites un bon exemple. Il est généralement accompagné de la perte de l'adversaire.

2. **Stage 2 — 在 `z` 上做 diffusion。**Je ne sais pas .`z = E(x_real)`Quand on est en train de dénoncer`z_t`◊ 推理时: par diffusion 采样 `z_0`Alors ...`x = D(z_0)`Il y a une autre.

**文本 conditioning。**Il y a aussi deux extra-components. Un codeur de texte: SD 1.x avec CLIP-L, SD 2/XL avec CLIP-L+OpenCLIP-G, SD3 et Flux avec T5-XXL)`[Q = image features, K = V = text tokens]`Les jetons sont le seul moyen de modifier le texte.

**Loss Function 与 Lesson 06 完全相同。**De même, dans le bruit, vous faites DDPM / flux correspondant MSE. Vous avez simplement remplacé le domaine de données.

## 架构变体

| Model | Year | Backbone | Latent shape | Text encoder | Params |
|-------|------|----------|--------------|--------------|--------|
| SD 1.5 | 2022 | U-Net | 64×64×4 | CLIP-L (77 tokens) | 860M |
| SD 2.1 | 2022 | U-Net | 64×64×4 | OpenCLIP-H | 865M |
| SDXL | 2023 | U-Net + refiner | 128×128×4 | CLIP-L + OpenCLIP-G | 2.6B + 6.6B |
| SDXL-Turbo | 2023 | Distilled | 128×128×4 | same | 1-4 step sampling |
| SD3 | 2024 | MMDiT (multimodal DiT) | 128×128×16 | T5-XXL + CLIP-L + CLIP-G | 2B / 8B |
| Flux.1-dev | 2024 | MMDiT | 128×128×16 | T5-XXL + CLIP-L | 12B |
| Flux.1-schnell | 2024 | MMDiT distilled | 128×128×16 | T5-XXL + CLIP-L | 12B, 1-4 step |

趋势是: utiliser DiT(作用于潜伏补丁的变压器) remplacer U-Net, étendre l'encodage texte(T5 在快速遵守上胜过CLIP), augmenter les canaux latente(4 → 16 带来更多细节余量)


```figure
noise-schedule
```

## - Je le construis.

`code/main.py`Mettre un jouet 1-D VAE(encodeur d'identité + décodeur, uniquement pour démontrer; réel VAE 会是 conv net) superposé sur le DDPM de la leçon 06 ,并通过类型免费指导 加入类条件化──它显示同一个扩散损失 无论运行在原始1-D值上,还是运行在加码值上都有效,这就是关键洞见──

### 步骤 1: codeur/décodeur

```python
def encode(x):    return x * 0.5          # toy "compression" to smaller scale
def decode(z):    return z * 2.0
```

Pour les besoins de l'enseignement, cette carte de la ligne est suffisante pour expliquer la diffusion peut être`z`Il est aussi un élément clé de la stratégie de l'entreprise.

### Pas 2:`z`- diffusion dans l'espace

Les données vues sur le réseau sont les mêmes que celles de la leçon 06`z = E(x)`- Je suis en train de le faire.`z_0`后,用 `D(z_0)`décodeur

### 步骤 3: orientation sans classifiant

Pendant l'entraînement, 10% du temps a été abandonné pour la classe.`ε_cond`et `ε_uncond`Puis:

```python
eps_cfg = (1 + w) * eps_cond - w * eps_uncond
```

`w = 0`= 无指导(完全多样性),`w = 3`= 默认值,`w = 7+`= 和 / 过化。

### 步骤 4: 文本 conditioning(概念,不是代码)

Pour mettre l'étiquette de classe 替换为结 text encoder 的输出──通过跨重点 把文字嵌入 输入 U-Net:

```python
h = h + CrossAttention(Q=h, K=text_embed, V=text_embed)
```

C'est la seule différence substantielle entre le modèle de diffusion conditionné par classe et la diffusion stable.

## La trappe

- **VAE-scale mismatch。**SD 1.x VAEs dans le codage 后会应用一个缩放常数(`scaling_factor ≈ 0.18215`Il faut oublier que le U-Net a des erreurs latentes et que chaque point de contrôle a une valeur.
- **Text encoder silently wrong。**SD3 需要带 >=128 tokens of T5-XXL, fallback till only CLIP 会有损──始终检查 `use_t5=True`Si ce n'est pas le cas, la fidélité sera immédiate.
- **混用 latent spaces。**SDXL、SD3、Flux sont utilisés dans différents VAEs。 dans les latences SDXL, le LoRA de l'entraînement n'est pas utilisé dans le SD3。 Les diffuseurs de la face en éclats 0.30+ refusent de charger des points de contrôle non correspondants。
- **CFG too high。** `w > 10`Il a été créé pour la production d'images et de dessins, et a été adapté rapidement à la variété.`w = 3-7`Il y a une autre.
- **Negative prompts leaking。**Le prompt négatif vide deviendra un jeton nul; le prompt négatif rempli deviendra un jeton`ε_uncond` Les deux ne sont pas les mêmes; certains pipelines seront utilisés en silence sans valeur

## Utilisez-le

Production de 2026:

| Target | Recommended backbone |
|--------|----------------------|
| 窄领域、配对数据、从零训练模型 | SDXL fine-tune (LoRA / full) — 最快交付 |
| 开放域 text-to-image，开放权重 | Flux.1-dev (12B, Apache / non-commercial) 或 SD3.5-Large |
| 最快推理，开放权重 | Flux.1-schnell (1-4 step, Apache) 或 SDXL-Lightning |
| 最佳 prompt adherence，托管服务 | GPT-Image / DALL-E 3 (still), Midjourney v7, Imagen 4 |
| 编辑工作流 | Flux.1-Kontext (Dec 2024) — 原生接受 image + text |
| 研究、baseline | SD 1.5 — 古老但研究充分 |

## Je le livre.

保存 `outputs/skill-sd-prompter.md` Apprendre à recevoir un texte prompt + 目标风格,并输出: modèle + point de contrôle, échelle CFG, échantillon, prompt négatif, résolution, ensemble de contrôle de réseau/adaptateur IP, ainsi qu'une liste de contrôle de qualité étape par étape.

## 练习

1. **Easy.**Utiliser des conseils `w ∈ {0, 1, 3, 7, 15}`运行  référencement`code/main.py`◊ enregistrer l'échantillon moyen de chaque classe ◊ dans quoi `w`La classe signifie-t-elle qu'elle sera différente de la moyenne des données réelles ?
2. **Medium.**Pour remplacer le codeur de jouets en ligne par un codeur/découreur tanh-MLP, rejoindre la perte de reconstruction.
3. **Hard.**Utilisez des diffuseurs pour créer une réelle diffusion stable`sdxl-base`, avec CFG=7 运行 30 个 Euler steps,并计时――然后切换到 `sdxl-turbo`, en utilisant 4 étapes 和 CFG=0── le même sujet, de qualité différente, décrivant ce qui a changé et les causes──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| First stage | “The VAE” | 训练好的 encoder/decoder 对；把 512² 压缩到 64²。 |
| Second stage | “The U-Net” | latent space 上的 diffusion model。 |
| CFG | “Guidance scale” | `(1+w)·ε_cond - w·ε_uncond`；调节 conditioning strength。 |
| Null token | “Empty prompt embed” | 用于 `ε_uncond` 的 unconditional embed。 |
| Cross-attention | “How text gets in” | 每个 U-Net block 都以 text tokens 作为 K 和 V 进行 attention。 |
| DiT | “Diffusion Transformer” | 用作用于 latent patches 的 transformer 替换 U-Net；扩展性更好。 |
| MMDiT | “Multi-modal DiT” | SD3 的架构：带 joint attention 的文本与图像流。 |
| VAE scaling factor | “Magic number” | 将 latents 除以约 5.4，使 diffusion 在 unit-variance 空间中运行。 |

## Description de production: sur 8GB de GPU de consommation de fonctionnement de flux-12B

参考流集是经典的我有一张消费级GPU,能交付吗?配方──技巧就是把生产推理文献列出的同一个三旋配方应用到扩散 DiT:

1. **Staggered loading。**Le flux a trois non-obligations de coexister dans le réseau VRAM: T5-XXL encodeur de texte ((fp32 下约 10 GB) 、CLIP-L(小)、12B MMDiT, ainsi que VAE。
2. **通过 bitsandbytes 做 4-bit quantization。**Dans le T5 encodeur 和 DiT 上都使用 `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)` la qualité du texte à l'image est en baisse presque invisible, selon les critères d'Aritra.
3. **CPU offload。** `pipe.enable_model_cpu_offload()`L'interface de l'interface est automatique entre les modules de transfert entre le processeur et le processeur.

Le compte en cache est:`10 GB T5 / 8 = 1.25 GB`quantifiés,`12 B params × 0.5 bytes = ~6 GB`En termes de fonctionnalités de la méthode de calcul, le taux de débit est de 0,0 à 0,0 et le taux de débit est de 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0,0 à 0, et à 0,0 à 0,0 à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, et à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, et à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, et à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, et à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, en 0, et à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, en 0, à 0, à 0, et à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, en 0, à 0, à 0, en 0, et à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, à 0, en 0, et à 0, à 0, à 0,

## 延伸阅读

- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) Diffusion stable。
- [Podell et al. (2023). SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis](https://arxiv.org/abs/2307.01952) SDXL。
- [Peebles & Xie (2023). Scalable Diffusion Models with Transformers (DiT)](https://arxiv.org/abs/2212.09748)- Je suis désolé.
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, MMDiT。
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG。
- [Labs (2024). Flux.1 — Black Forest Labs announcement](https://blackforestlabs.ai/announcing-black-forest-labs/) Flux.1 系列。
- [Hugging Face Diffusers docs](https://huggingface.co/docs/diffusers/index) Réalisation de chaque point de contrôle mentionné ci-dessus.
