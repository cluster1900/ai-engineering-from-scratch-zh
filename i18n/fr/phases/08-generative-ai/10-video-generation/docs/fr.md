# 视频生成

> 图像是一个2D tensor──视频是一个3D tensor──理论相同;compute 难度高出 10-100x──OpenAI的 Sora(2024年 2 月) prouve que c'est faisable──到2026年,Veo 2、Kling 1.5、Runway Gen-3、Pika 2.0 和 WAN 2.2 已能从文本生成 1080p的生产级视频,而开权重堆(CogVideoX、HunyuanVideo、Mochi-1、WAN 2.2)落后约12个月──

**Type:** Build
**Languages:** Python
**先修要求:**La phase 8 · 07 (diffusion latente), la phase 7 · 09 (ViT), la phase 8 · 06 (DDPM)
**Time:** ~45 minutes

##  problématique

Une vidéo de 10 secondes,1080p、24fps contient 240 pixels, par 20×1080×3 pixels── les données originales de chaque clip sont d'environ 1,5 Go── diffusion par pixels dans l'espace indéfectible── vous avez besoin:

1. **时空压缩。**Un VAE, pour la vidéo, c'est un processus de partage spatial-temporal.
2. **时间一致性。**Il faut partager le contenu en quelques secondes, la lumière et l'identité de l'objet.
3. **Compute budget。**Dans la même taille du modèle, la vidéo est 10 à 100 fois plus grande que la photo.
4. **Conditioning。**文本、图像(第一)、音频或另一个视频── la plupart des modèles de production acceptent ces quatre formes──

 résoudre ce problème                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         **Diffusion Transformer (DiT)**, dans un énorme ensemble de données, la perte de diffusion avec la leçon 06

## 概念

![Video diffusion: patchify, DiT, decode](../assets/video-generation.svg)

### Partage de la couche

Utilisation de la forme de la vidéo latente est`[T_latent, H_latent, W_latent, C_latent]` Décomposer en gros`[t_p, h_p, w_p]`Pour le modèle de Sora,`t_p = 1`(partage par patch) ou `t_p = 2`(每两) ⋅ un 10 secondes 1080p 视频会压缩成约20,000-100,000 个补丁──

### DiT spatiotemporal

Un transformateur 处理平化的 patch 序列── chaque patch a une intégration positionnelle 3D(temps + y + x)──Attention est généralement factorisée:

- **Spatial attention**Dans chaque pièce, des patchs sont effectués.
- **Temporal attention**Dans le même espace, les activités se déroulent.
- **Full 3D attention**¢16 à 100x; utilisation uniquement à faible résolution ou dans les études.

### 文本 conditionnement

Utilisez un encodeur de texte de grande taille  effectuer une attention croisée(Sora Utilisez T5-XXL,CogVideoX-5B Utilisez T5-XXL)  Long requêtes  très important, le train de Sora contient des sous-titres très étroits de GPT 生成, en moyenne 200 jetons pour chaque clip。

### 訓練

Dans les latences spatiotemporales, il faut également utiliser des données de diffusion standard (é ou v) (environ 100 millions de clips curatés + des sous-titres de texte synthétiques).

## 2026 année de production

| Model | Date | Max duration | Max res | Open weights? | Notable |
|-------|------|--------------|---------|---------------|---------|
| Sora (OpenAI) | 2024-02 | 60s | 1080p | No | 第一个在 scale 下展示 world simulator 属性的模型 |
| Sora Turbo | 2024-12 | 20s | 1080p | No | 推理快 5x 的生产版 Sora |
| Veo 2 (Google) | 2024-12 | 8s | 4K | No | 2025 年最高质量 + physics |
| Veo 3 | 2025 Q3 | 15s | 4K | No | 原生音频和更强的相机控制 |
| Kling 1.5 / 2.1 (Kuaishou) | 2024-2025 | 10s | 1080p | No | 2025 Q1 最好的人体运动 |
| Runway Gen-3 Alpha | 2024-06 | 10s | 768p | No | 在其之上的专业视频工具 |
| Pika 2.0 | 2024-10 | 5s | 1080p | No | 最强角色一致性 |
| CogVideoX (THUDM) | 2024 | 10s | 720p | Yes (2B, 5B) | 第一个开放的 5B-scale 视频模型 |
| HunyuanVideo (Tencent) | 2024-12 | 5s | 720p | Yes (13B) | 2024 年末开放 SOTA |
| Mochi-1 (Genmo) | 2024-10 | 5.4s | 480p | Yes (10B) | 许可证最宽松 |
| WAN 2.2 (Alibaba) | 2025-07 | 5s | 720p | Yes | 2025 年中最强开放模型 |

Les poids ouverts dans le domaine vidéo réduisent la vitesse de la différence par rapport au domaine des images plus rapidement: d'ici 2026, HunyuanVideo + WAN 2.2 LoRAs ont déjà entraîné la plupart des flux de travail open source.


```figure
video-diffusion-denoise
```

## - Je le construis.

`code/main.py`模拟核心的空间时代的 DiT 思路:patchify 一个小型合成视频,加入 per-patch position embedding,并用变压器式注意 在 patches 上对整个序列的代号――不用 numpy;纯 Python――我们展示了即使在1-D 中,当相邻 patches 共享代号和位置嵌入时,也会出现时间一致性――

### Pas 1: patch une synthèse 1D "vidéo"

```python
def make_video(T_frames=8, rng=None):
    # a "video" is a sequence of 1-D values following a smooth trajectory
    base = rng.gauss(0, 1)
    return [base + 0.3 * t + rng.gauss(0, 0.1) for t in range(T_frames)]
```

### 步骤 2: Embedding de position de chaque

```python
def pos_embed(t, dim):
    return sinusoidal(t, dim)
```

### 步骤 3: dénonciateur  voir l'ensemble du processus

Nos réseaux de micro-type ne désignent pas chaque jour, mais composent tous les emblèmes de position + leur valeur, et prédisent tous les bruits.

### 步骤 4: 时间一致性测试

訓練後,サンプル 一个视频──测量frame-to-frame delta──如果模型学到了时间结构,deltas 会比独立样本 每一更小──

## La trappe

- **独立逐帧 sampling = flicker。**Si vous utilisez la diffusion d'images par chacune des parties, vous pouvez cliquer sur le flash, car le bruit de chacune des parties est indépendant.
- **朴素 3D attention = OOM。**Pour une latence de 10 secondes 1080p faire une attention 3D complète, il faut des milliards de fois de fonctionnement. Factoriser pour l'espace + le temps.
- **数据 captioning 比规模更重要。**La mise à niveau principale de Sora comparé à la précédente, est d'environ 10 fois plus détaillée avec des sous-titres  entraînement  GPT-4 重新标注片) ⋅ Le rapport technique de OpenAI en parle très clairement ⋅
- **First-frame conditioning。**La plupart des modèles de production acceptent également une image comme première.
- **Physics drift。**长 clips(>10s) 会积累细微不一致。Génération de fenêtre coulissante + ancrage de la carte clé 会有帮助──

## Utilisez-le

| Use case | 2026 pick |
|----------|-----------|
| 最高质量 text-to-video，hosted | Veo 3 or Sora |
| 可控相机的 cinematic | Runway Gen-3 with motion brushes |
| 跨 clips 的角色一致性 | Pika 2.0 or Kling 2.1 |
| Open weights，快速 fine-tune | WAN 2.2 + LoRA |
| Image-to-video | WAN 2.2-I2V, Kling 2.1 I2V, or Runway |
| Audio-to-video lip sync | Veo 3 (native audio) or a dedicated lip-sync model |
| 视频编辑 | Runway Act-Two, Kling Motion Brush, Flux-Kontext (still-frame) |

Dans un contexte de qualité équivalente, le coût de la vidéo par seconde a diminué de 20 fois entre 2024 et 2026:

## Je le livre.

保存 `outputs/skill-video-brief.md` Apprendre à recevoir un bref vidéo (durée, rapport d'aspect, style, plan de caméra, cohérence du sujet, audio),并输出: modèle + hébergement, échafaudage rapide, langage de la caméra, description du sujet, descripteurs de mouvement)

## 练习

1. **Easy.**Dans le`code/main.py`Par rapport à (a) échantillonnage indépendant par cadre et (b) échantillonnage de séquence conjointe de cadre à cadre delta, rapport delta, moyenne et variance
2. **Medium.**添加一个第一框条件:将 frame 0 pin 到给定值并 sample 其余部分──测量 如何传播──
3. **Hard.**Utilisation de diffuseurs HuggingFace dans le GPU local 上运行 CogVideoX-2B── contre 720p、6 secondes clip 计时 20 个推断步骤──Profil attention spatio-temporal 以识别瓶──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Video VAE | "3-D VAE" | 将 `(T, H, W, C)` 压缩为 spatiotemporal latent 的 Encoder。 |
| Patches | "The tokens" | latent 的固定大小 3-D blocks；作为 DiT 的输入。 |
| Factorized attention | "Spatial + temporal" | 先在空间上运行 Attention，再在时间上运行；跳过 full 3-D attention。 |
| Image-to-video (I2V) | "Animate this photo" | 模型接收一张图像 + 文本，并输出从它开始的视频。 |
| Keyframe conditioning | "Anchor frames" | Pin 特定帧来控制视频的 arc。 |
| Motion brush | "Directional hint" | 用户在图像上绘制 motion vectors 的 UI 输入。 |
| Re-captioning | "Dense captions" | 使用 LLM 用详细 prompts 重新标注训练 clips。 |
| Flicker | "Temporal artifact" | Frame-to-frame 不一致；通过 coupled denoising 修复。 |

## 生产说明:la latence vidéo est la mémoire-largeur de bande  problème

Un clip de 10 secondes 1080p、24 fps  contient 240 images × 1920 × 1080 × 3 ≈ 1,5 Go de pixels originaux── traversé par 4× compression vidéo VAE(`2 × spatial × 2 × temporal`) , latente Chaque requête est d'environ 100 MB. Le faire passer par le temps et l'espace.

Les trois boutons de production, tous directement provenant de la littérature de production-inférence inférence chapitre:

- **跨 DiT 的 TP。**Modèles texte à vidéo habituellement ≥10B paramètres。4 个 H100 上 TP=4 est la configuration standard;405B-modèles de classe Utilisation PP=2 × TP=2。 La latence par étape 随 TP 大致线性下降,直到撞击全降墙──
- **Frame batching = continuous batching。**Dans le temps de génération, le concept de vidéo est un ensemble de cadres Attention 连接的框架──Continuous batching(in-flight scheduling)适用:`t-1`Je suis en train de revenir.`t+1`Il y a une autre.
- **Clip-level prefill cache。**Pour l'image à la vidéo, le conditionnement de première image est similaire à la pré-remplissage rapide de LLM: calculer une fois, et passer le décodeur temporel.

## 延伸阅读
- [Brooks et al. (2024). Video generation models as world simulators](https://openai.com/index/video-generation-models-as-world-simulators/) Sora 技术报告──
- [Yang et al. (2024). CogVideoX: Text-to-Video Diffusion Models with An Expert Transformer](https://arxiv.org/abs/2408.06072) CogVideoX。
- [Kong et al. (2024). HunyuanVideo: A Systematic Framework for Large Video Generative Models](https://arxiv.org/abs/2412.03603) HunyuanVideo。
- [Genmo (2024). Mochi-1 Technical Report](https://www.genmo.ai/blog/mochi) Mochi-1。
- [Alibaba (2025). WAN 2.2](https://wanvideo.io/) 2025 année de SOTA
- [Ho, Salimans, Gritsenko et al. (2022). Video Diffusion Models](https://arxiv.org/abs/2204.03458) 开创性 vidéo diffusion 论文。
- [Blattmann et al. (2023). Align your Latents (Video LDM)](https://arxiv.org/abs/2304.08818) Précessionnaire de la diffusion vidéo stable
