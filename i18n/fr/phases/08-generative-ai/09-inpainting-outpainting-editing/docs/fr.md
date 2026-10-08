# Peinture, décoration et édition d'images

> Le texte à l'image va créer de nouvelles choses. La peinture va réhabiliter les vieilles choses. Dans l'environnement de production, 70% des images sont éditées.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 8 · 08 (ControlNet & LoRA)
**Time:** ~75 minutes

##  problématique

客户发来一张完美产品照片,但背景有分散注意的标牌――你想擦掉标牌,并让其他部分保持像素级一致――你不能从头运行文字-图片,因为结果会有不同的颜色,不同的光照,不同的产品角度――你想只重生被蒙面的区域,并且希望重生的内容尊重周围下文――

C'est la peinture.

- **Inpainting.**Dans le masque, il est ré-généré, il est conservé.
- **Outpainting.**Dans le cadre de la mise en œuvre de la nouvelle loi, le gouvernement a adopté une loi sur la protection des données.
- **Image editing.**Réconsidérer la totalité du diagramme, mais maintenir la cohérence avec le texte ou la structure de l'original diagramme.

Chaque pipeline de diffusion de 2026 est dotée d'un système de peinture.

## 概念

![Inpainting: mask-aware denoising with context-preserving reinjection](../assets/inpainting.svg)

### 朴素方法 (et pourquoi c'est faux)

带着面具 运行标准 text-to-image。 Dans chaque étape de l'échantillonnage, remplacer la zone bruyante latente du masque par une image de nettoyage diffusée vers l'avant―, mais l'effet est très mauvais―, l'artéfact de la frontière 会出, parce que le modèle ne sait pas ce que le masque dans la région devrait avoir。

### Modèle de peinture

entraînement d'un U-Net modifié, laissez-le recevoir 9 canaux d'entrée, plutôt que 4:

```
input = concat([ noisy_latent (4ch), encoded_image (4ch), mask (1ch) ], dim=channel)
```

Les canaux supplémentaires sont une copie de l'image source codée par l'AEV, avec un masque de canal unique. En train, le modèle ne désigne que le masque de la région, tout en fournissant un signal de conditionnement à la zone non masquée.

SD-Inpaint、SDXL-Inpaint、Flux-Fill 都 utiliser ce type de 9 canaux(ou similaire)`StableDiffusionInpaintPipeline`- Je suis là.`FluxFillPipeline`Il y a une autre.

### SDEdit (Meng et coll., 2022)  免费编辑

Donnez une image de source de bruit à un certain milieu.`t`, puis utiliser un nouveau prompt de `t`Reversé à 0,.. pas besoin de reentraînement,..`t`Le choix sera le poids entre la vérité et la liberté de création:

- `t/T = 0.3`→  presque avec la même source, seulement faire de petits changements de style
- `t/T = 0.6`→ 中等编辑, conservation de la structure grossière
- `t/T = 0.9`→  proche du bruit 生成,对源图保留最小

### InstructPix2Pix (Brooks et coll., 2023)

Dans le`(input_image, instruction, output_image)`Un modèle de diffusion, en même temps basé sur l'entrée d'images et de textes instruits, est conditionné.

### RePaint (Lugmayr et coll., 2022)

Maintenir un modèle de diffusion inconditionnelle standard. Dans chaque étape inverse, effectuer un échantillonnage: parfois sauter dans un état plus bruyant et se reproduire.


```figure
inpaint-mask-reinject
```

## Faites-le

`code/main.py`Nous avons réalisé une édition de jeu de peinture en 1D sur 5 dimensions. Nous avons utilisé des données de mélange en 5 dimensions pour former un DDPM, dont chaque échantillon est tiré de 5 floats de l'un des deux clusters.

### Étape 1: 5 - D données de la MDD

```python
def sample_data(rng):
    cluster = rng.choice([0, 1])
    center = [-1.0] * 5 if cluster == 0 else [1.0] * 5
    return [c + rng.gauss(0, 0.2) for c in center], cluster
```

### Étape 2: dans tous les 5 dimensions de l'entraînement dénoiser

标准 DDPM。Net pour l'entrée bruyante 5D 输出 prédiction bruyante 5D。

### Étape 3: utilisation de la face cachée à l'envers

```python
def inpaint_step(x_t, mask, clean_image, alpha_bars, t, rng):
    # replace unmasked dims with a freshly noised version of the clean source
    a_bar = alpha_bars[t]
    for i in range(len(x_t)):
        if not mask[i]:
            x_t[i] = math.sqrt(a_bar) * clean_image[i] + math.sqrt(1 - a_bar) * rng.gauss(0, 1)
    # ...then run the normal reverse step on x_t
```

C'est une méthode simple, et elle est efficace sur les données 1D du jeu.

### Étape 4: peinture

Peinture est la peinture de masque. Le masque est le même.

## La trappe

- **Seams.**朴素方法会留下可见边界,因为 Gradient 信息不会跨口罩 流动──修复方式:把口罩 膨胀 8-16 个像素,或使用正确的涂料模型──
- **Mask leakage.**Si la qualité de l'image de conditionnement est faible ou bruyante, elle peut contaminer le masque.
- **CFG interacts with mask size.**Il faut utiliser le CFG pour réduire le CFG.
- **SDEdit fidelity cliff.**De `t/T = 0.5`À la`t/T = 0.6`Il faut fouiller et vérifier.
- **Prompt mismatch.**Rapidement 应该描述*整张*图,而不只是新内容──用 A cat sitting on a chair, instead of a cat──

## Utilisez-le

| Task | Pipeline |
|------|----------|
| 移除物体，小 mask | SD-Inpaint 或 Flux-Fill，标准 prompt |
| 替换天空 | SD-Inpaint + "blue sky at sunset" |
| 扩展画布 | SDXL outpaint mode（8px feather）或带 outpaint mask 的 Flux-Fill |
| 重新生成手 / 脸 | SD-Inpaint，prompt 重新描述主体 + ControlNet-Openpose |
| 改变某个区域的风格 | 在 mask 区域上使用 `t/T=0.5` 的 SDEdit |
| "Make it sunset" | InstructPix2Pix 或 Flux-Kontext |
| 背景替换 | SAM mask → SD-Inpaint |
| 超高保真 | 最难场景使用 Flux-Fill 或 GPT-Image（hosted） |

SAM(Meta's Segment Anything,2023) + diffusion inpaint is 2026 年的背景移除管道──SAM 2(2024)适用于视频──

## La faire partir

保存 `outputs/skill-editing-pipeline.md` Skil 接收一张原图 + 编辑描述 + 可选面膜(或 SAM prompt),并输出:mask 生成方法、基模型、CFG scales(image + text)、SDEdit-t 或 inpainting mode, ainsi que liste de contrôle QA。

## 练习

1. **Easy.**Dans le`code/main.py`En moyenne, le ratio de dimension du masque est passé de 0,2 à 0,8...
2. **Medium.**实现 RePaint: chaque jusqu'à la 10e étape inverse, sauter 5 étapes 加噪)并重新指名──测量它是否降低面具 边缘的边界残留──
3. **Hard.**Utilisation de diffuseurs faciaux en échange de:SD 1.5 Inpaint + ControlNet-Openpose avec Flux.1-Fill, dans 20 个 facial regeneration 任务上测试──分别评分 pose adhérence 和 préservation de l'identité──

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Inpainting | “填洞” | 在 mask 内重新生成；保留外部像素。 |
| Outpainting | “扩展画布” | 在画布外重新生成；保留内部。 |
| 9-channel U-Net | “正确的 inpainting model” | 输入为 `noisy \| encoded-source \| mask` 的 U-Net。 |
| SDEdit | “带 noise level 的 img2img” | 加噪到时间 `t`，用新 prompt denoise。 |
| InstructPix2Pix | “纯文本编辑” | 在 (image, instruction, output) 三元组上 fine-tuned 的 diffusion。 |
| RePaint | “无需重新训练” | 在 reverse 过程中周期性 re-noise，以减少 seams。 |
| SAM | “Segment Anything” | 通过点击或框生成 mask；与 inpaint 配合使用。 |
| Flux-Kontext | “带上下文编辑” | 接收 reference image + instruction 进行编辑的 Flux 变体。 |

## 生产提示:éditer les pipelines très sensibles au retard

Utilisateur édite image en temps réel, l'attente de retour est inférieure à 5 secondes. Dans L4 en haut, 10242 SDXL-Inpaint en 30 étapes nécessite 3 à 4 secondes, reajoute la génération de masques SAM (environ 200 ms) et le code/décodage VAE (environ 500 ms) de la production.

- **SAM-H 是慢的那个。**10242 下 SAM-H 约200 ms; SAM-ViT-B 约40 ms,质量损失很小──SAM 2(video) augmentera le temps dimension开销; ne le mettez pas en édition seule──
- **能跳过 encode 就跳过。** `pipe.image_processor.preprocess(img)`La plupart des utilisateurs utilisent des logiciels de code de type "LATENTS".`latents=...`J'ai déjà sauté une fois.
- **Mask dilation 也影响吞吐。**La plupart des calculs de la passer-avant U-Net sont gaspillés.`diffusers``StableDiffusionInpaintPipeline`Quoi qu'il en soit, tout fonctionne parfaitement sur le réseau U-Net; seulement une imprimante correcte de 9 canaux peut être utilisée pour le calcul masqué.
- **Flux-Kontext 是 2025 年的答案。**Pour le`(source_image, instruction)`Faire un seul passage en avant: pas de masque unique, pas de balayage de bruit SDEdit.

## 延伸阅读

- [Lugmayr et al. (2022). RePaint: Inpainting using Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2201.09865) 无需训练的涂料──
- [Meng et al. (2022). SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations](https://arxiv.org/abs/2108.01073) SDEdit。
- [Brooks, Holynski, Efros (2023). InstructPix2Pix](https://arxiv.org/abs/2211.09800) 文本指令编辑──
- [Kirillov et al. (2023). Segment Anything](https://arxiv.org/abs/2304.02643)SAM, masque, source
- [Ravi et al. (2024). SAM 2: Segment Anything in Images and Videos](https://arxiv.org/abs/2408.00714) Vidéo SAM。
- [Hertz et al. (2022). Prompt-to-Prompt Image Editing with Cross-Attention Control](https://arxiv.org/abs/2208.01626)Attention à la mise en page de la section
- [Black Forest Labs (2024). Flux.1-Fill and Flux.1-Kontext](https://blackforestlabs.ai/flux-1-tools/) 2024 outillage
