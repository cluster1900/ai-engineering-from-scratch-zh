# Contrôle du réseau, de l'ARL et du climatisation

> 仅靠文本是一种拙的控制信号――ControlNet 让你克隆一个预训练的扩散模型,并使用深度地图、pose skeleton、scribble或边形图像来引导它──LoRA 让你通过训练1000万参数来调整一个2B-参数模型──二者结合,将稳定扩散从玩具变成2026年各机构都在交付图像管道──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 10 (LLMs from Scratch — LoRA 基础)
**Time:** ~75 minutes

##  problématique

 " Une femme en robe rouge promenant un chien dans une rue animée " Ce genre de commentaire ne dit pas à quel point la femme est en position ou dans la rue.

Pour chaque signal (à partir de zéro, un nouveau modèle conditionnel, le coût est trop élevé, vous souhaitez maintenir la colonne vertébrale SDXL de 2,6B-paramètre, puis le petit réseau côté du conditionnement de lecture, le rendre plus facile à régler.

Vous voulez aussi, dans le cas d'un modèle complet non reconstitué, une nouvelle conception de modèle de votre visage, de votre produit, de votre style. Vous avez besoin d'un petit delta de 100x.

ControlNet + LoRA + text = boîte à outils des praticiens de 2026 ⋅ la plupart des images de production sont basées sur SDXL / SD3 / Flux ⋅ sur 2 à 5 ⋅ LoRA ⋅ 1 à 3 ⋅ ControlNet ainsi qu'un adaptateur IP ⋅

## 概念

![ControlNet clones the encoder; LoRA adds low-rank deltas](../assets/controlnet-lora.svg)

### Le contrôle des données (Zhang et coll., 2023)

Prenez un SD pré-entraîné──*Klon* U-Net encodeur 半边──结原始模型──训练这个克隆版本,让它接受额外的条件输入(边缘,深度,pose)──使用 *zero-convolution* skip connections(初始化为零的1×1 convs,一开始是无-op,随后学习 delta) 把克隆版本连接回原始模型的解码器 半边──

```
SD U-Net decoder:   ... ← orig_enc_features + zero_conv(controlnet_enc(condition))
```

Le principe de zéro-conv initiation signifie que le contrôle du réseau est identique à l'identité, même si la formation ne cause pas de dommages.

Chaque mode de contrôle de la réseau se présente comme un petit modèle secondaire 发布(SDXL 约360M,SD 1.5 约70M)  Vous pouvez les assembler en déduisant:

```
features += weight_a * control_a(depth) + weight_b * control_b(pose)
```

### L'ACE (Hu et coll., 2021)

Pour la couche linéaire`W ∈ R^{d×d}`, 结 `W`Il n'y a pas de delta de rang inférieur.

```
W' = W + ΔW,  ΔW = B @ A,  A ∈ R^{r×d},  B ∈ R^{d×r}
```

Parmi eux `r << d`Pour la position de la charge, le rang 4-16 est la classification standard; pour la position de la gravité, le rang 64-128 est le plus fréquent.`2 · d · r`, au lieu de `d²`Pour le`d=640`L'attention de SDXL,`r=16`Lorsque chaque adaptateur ne contient que 20k de paramètres, au lieu de 410k, réduit de 20x, il est mis sur l'ensemble du modèle, un LORA est généralement de 20 à 200MB, tandis que la base est de 5GB.

En déduisant, vous pouvez réduire LORA:`W' = W + α · B @ A`Il y a une autre.`α = 0.5-1.5`很常见──多个LoRA会加法方式叠加(habituellement, il faut noter qu'elles se affectent mutuellement de manière non-linéaire)──

### Adapteur IP (Ye et coll., 2023)

Un très petit adaptateur, accepte un un image comme conditionnement avec le texte. Il utilise un encodeur d'image CLIP pour créer des jetons d'image, et les injecte avec des jetons de texte.

## Coupe de matrice

| Tool | 它控制什么 | Size | 何时使用 |
|------|------------|------|----------|
| ControlNet | 空间结构（pose、depth、edges） | 70-360MB | 精确 layout、composition |
| LoRA | 风格、主体、概念 | 20-200MB | 个性化、风格 |
| IP-Adapter | 来自 reference image 的风格或主体 | 20MB | 文本无法描述外观 |
| Textual Inversion | 将单个概念作为新 token | 10KB | 旧方案，大多已被 LoRA 替代 |
| DreamBooth | 对主体做 full fine-tune | 2-5GB | 强身份一致性、高计算成本 |
| T2I-Adapter | 更轻量的 ControlNet 替代方案 | 70MB | Edge devices、inference budget |

Le contrôle de la communication est un processus de communication.


```figure
v4-controlnet-zero
```

## - Je le construis.

`code/main.py`Dans la 1re dimension, on peut simuler ces deux mécanismes:

1. **LoRA。**Une couche linéaire prétrainée .`W`- Il est un peu trop petit.`B @ A`,使 `W + BA`L'objectif est de faire correspondre la couche linéaire.`r = 1`足以完美学习 une correction de rang 1

2. **ControlNet-lite。**Un prédicteur de base gelé, ainsi qu'un signal supplémentaire de lecture du réseau de côté, la sortie du réseau de côté est effectuée par un gateau de volume de formation initiale à zéro.

### 步骤 1: mathématiques de la LORA

```python
def lora(W, A, B, x, alpha=1.0):
    # W is frozen; A, B are the trainable low-rank factors.
    return [W[i][j] * x[j] for i, j in ...] + alpha * (B @ (A @ x))
```

### 步骤 2: réseau côté zéro-initi

```python
side_out = control_net(x, condition)
gated = gate * side_out  # gate initialized to 0
h = base(x) + gated
```

Dans l'étape 0, le sort et la base sont exactement les mêmes.`gate`, ne se produira pas de catastrophe.

## 常见坑

- **LoRA 过度缩放。** `α = 2`Ou `α = 3`C'est une méthode courante pour le rendre plus fort, mais qui entraîne une sur-formation ou une détérioration des sorties.`α ≤ 1.5`Il y a une autre.
- **ControlNet weight 冲突。**Le poids de la pose de 1.0 et le poids de la profondeur de 1.0 sont généralement utilisés.
- **LoRA 用在错误的 base 上。**SDXL LoRA dans SD 1.5 上会静默 no-op, parce que les dimensions d'attention ne correspondent pas.
- **Textual Inversion 漂移。**Dans un point de contrôle, les jetons de formation, changés à un autre point de contrôle, seront gravement déplacés.
- **LoRA weight-merging 和存储。**Vous pouvez faire cuire le LoRA à la base des poids du modèle, pour obtenir une inférence plus rapide, sans ajout de temps de course, mais perdra en temps de course  diminution `α`La capacité de conserver deux versions.

## Utilisez-le

| Goal | 2026 pipeline |
|------|---------------|
| 复现某个品牌的艺术风格 | 在约 ~30 张精选图像上训练的 rank 32 LoRA |
| 把我的脸放进生成图像 | DreamBooth 或 LoRA + IP-Adapter-FaceID |
| 指定 pose + prompt | ControlNet-Openpose + SDXL + text |
| Depth-aware composition | ControlNet-Depth + SD3 |
| Reference + prompt | IP-Adapter + text |
| 精确 layout | ControlNet-Scribble 或 ControlNet-Canny |
| 替换背景 | ControlNet-Seg + Inpainting（Lesson 09） |
| 快速 1-step 风格 | SDXL-Turbo 上的 LCM-LoRA |

## Je le livre.

保存 `outputs/skill-sd-toolkit-composer.md` cette compétence 接收一个任务(actifs d'entrée:images de référence immédiates, optionnelles, positions, profondeurs, scripts),并输出工具堆, weights 和可复现的种子协议──

## 练习

1. **Easy。**Dans le`code/main.py`Le rang de l'Agence Loira`r`De 1 à 4... Où est le delta cible de la classe 2 ?
2. **Medium。**Dans les deux transformations cibles, on entraîne deux LORA indépendantes. On les charge ensemble et on montre leur interaction accrue.
3. **Hard。**Utilisation de diffuseurs 叠加:SDXL-base + Canny-ControlNet(poids 0,8) + un style LoRA(α 0,8) + IP-adapter(poids 0,6)。 Avec les poids de pile 变化, mesure FID-vs-prompt-adhésion-off。

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|------------|------------------|
| ControlNet | "Spatial control" | 克隆 encoder + zero-conv skips；读取一张 conditioning image。 |
| Zero convolution | "Starts as identity" | 初始化为零的 1×1 conv；ControlNet 一开始是 no-op。 |
| LoRA | "Low-rank adapter" | `W + B @ A`，`r << d`；比 full fine-tune 少 100x 参数。 |
| rank r | "The knob" | LoRA 压缩；典型值为 4-16，重度个性化使用 64+。 |
| α | "LoRA strength" | LoRA delta 的 runtime scaling。 |
| IP-Adapter | "Reference image" | 通过 CLIP-image tokens 实现的小型 image-conditioning adapter。 |
| DreamBooth | "Full subject fine-tune" | 在约 ~30 张主体图像上训练完整模型。 |
| Textual Inversion | "New token" | 只学习一个新的 word embedding；旧方案，大多已被替代。 |

## 生产说明:Swaps LoRA, voies de contrôle réseau, service multi-locataires

Un vrai SaaS texte à image se trouve dans le même point de contrôle de base.

- **Hot-swap LoRAs，不要 merge。**Il va`W' = W + α·B·A`fusionner à la base, nous pouvons faire des inférences à chaque étape`α`Et la base. Il y a des délits de la LRA dans le VRAM.`pipe.load_lora_weights()`+ `pipe.set_adapters([...], adapter_weights=[...])`, pouvant être utilisé sur demande pour activer.`2 · d · r · num_layers`Les poids, c'est-à-dire les poids de MB
- **ControlNet 作为第二条 attention lane。**                                                                                                                                                                                                                                                              
- **Quantized LoRAs 也适用。**Si vous avez mesuré la base (voir leçon 07, Flux sur 8 Go), LoRA delta peut également être mesuré à 8 bits ou 4 bits.

Flux-specific:Le portable de Niels Flux-on-8GB va être basé à 4 bits; dans cette base quantifiée, le style LoRA est supérieur à la moyenne.`pipe.load_lora_weights("user/style-lora")`),并使用 `weight_name="pytorch_lora_weights.safetensors"`C'est la recette de livraison de la plupart des organisations SaaS en 2026.

## 延伸阅读

- [Zhang, Rao, Agrawala (2023). Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543) Réseau de contrôle
- [Hu et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) LoRA(d'abord utilisé dans les LLM; ensuite transféré à la diffusion)
- [Ye et al. (2023). IP-Adapter: Text Compatible Image Prompt Adapter](https://arxiv.org/abs/2308.06721) Adapteur IP。
- [Mou et al. (2023). T2I-Adapter: Learning Adapters to Dig Out More Controllable Ability](https://arxiv.org/abs/2302.08453) L'alternative plus léger de ControlNet
- [Ruiz et al. (2023). DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation](https://arxiv.org/abs/2208.12242)Le DreamBooth.
- [HuggingFace Diffusers — ControlNet / LoRA / IP-Adapter docs](https://huggingface.co/docs/diffusers/training/controlnet) 参考 pipelines。
