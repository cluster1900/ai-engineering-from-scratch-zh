# Modèles vidéo: Tokens temporels et de la mise au sol

> Video 不是一叠照片──一 5 second clip 有因果序、动作动词和事件时序,这些是图像模型 无法表示的──Video-LLaMA(Zhang et al., juin 2023) a publié la première vidéo-LLM videocate et vidéo-LLaVA 扩展了这一模式──到2025年,Qwen2.5-VL TMRoPE 缩小了与边境专属模型的差距──每个系统都以不同的方式解决时间代币:Q-former per clip,concat-pool per frame,TMRoPE per token──本课程将解读这些模式,构建统一反动态框架样本,并进行时间测量任务 上评估──

**Type:** Build
**Languages:** Python (stdlib, frame sampler + temporal-grounding evaluator)
**Prerequisites:** Phase 12 · 08 (LLaVA-OneVision)
**Time:** ~180 minutes

## Objectif de l'apprentissage
- 解释为什么时间定位编码会独立于视觉编码器 改变视频VLM性能──
- Comparer l'échantillonnage de cadres de type uniforme, dynamique et événement-orienté avec la précision de mise au sol.
- 描述 Q-ex-per-clip(Video-LLaMA)、pooled-per-frame(Video-LLaVA) et M-RoPE-per-token(Qwen2.5-VL)
- Il y a quatre critères de référence: Vidéo-MME, TempCompass, EgoSchema, Vidéo-MMMU.

##  problématique
Une vidéo de 1 min 30 FPS a 1800 images. Pour chaque image, 196 images.

Il existe trois stratégies de contraction:

1. Les cadres de sous-échantillons (en fonction du contenu utilisé à partir de 1 à 8 FPS)
2. Pour chaque cadre de patch tokens  effectuer un fort force pooling ((3x3 ou 4x4 bilinéaire pool) 👇
3. 通过 Q-former 压缩:输入一个16frame clip,输出64tokens。

Chaque échantillon est différent. Les échantillons perdent les détails temporels. Les poulings perdent les détails spatiaux.

Le codeur de position temporelle est une autre dimension: modèle comment savoir que le cadre 5 se produit dans le cadre 6 之前?

## 概念
### Vidéo-LLaMA: chaque clip Un ancien Q + branche audio

Vidéo-LLaMA(2023) est la première vidéo-LLM à être mise à jour:

- Clips à 16 images à 2 FPS ((即 8 秒) ⋅
- Les fonctionnalités de ViT par cadre -> Vidéo Q-ancien, pour l'ensemble des 16 cadres faire des interventions -> 32 requêtes apprises -> LLM。
- Il s'agit d'un codeur audio de type imageBind.

优势:réflexion conjointe audiovisuelle―défaut: longueur de clip fixe, incapable de traiter le repérage de temps arbitraire―

### VidéoChat et Vidéo-LLaVA

Le vidéochat a gardé le chemin du vidéo-LAMA, mais a supprimé l'audio et l'a simplifié. Le vidéo-LAVA, Lin et al., 2023)

Deuxièmement, il n'y a pas de système de 8 à 16 images.

### Qwen2,5-VL et TMRoPE

Qwen2.5-VL  introduit TMRoPE, c'est-à-dire Embedding de position rotative Temporal-Modality.

Les principales différences avec l'intégration temporaire simple:

- Le temps est absolument le même que l'index. Le modèle est de 4,2 secondes, pas de 15 secondes.
- Rotation par jeton, et non par clip. Chaque jeton visuel fonctionne selon son propre timestamp.
- 兼容动态FPS──如果这里采用2FPS 采样、那里采用4FPS 采样,TMRoPE peut être utilisé à partir de cette différence.

TMRoPE 支持猫在第几秒跳起? 这类查询──模型可以输出在 4.2秒──视频-LLaMA 只有可以说在片段──

### Stratégies de prélèvement d'échantillons

Unique: pendant toute la durée, les cadres sont simples, mais perdent des pics de mouvement.

FPS dynamique: selon l'intensité du mouvement 自适应采样――Optique flux ou différenciation de cadre 会在高动作段 选择更密集的采样――Qwen2.5-VL 会这样训练――

Événement-driven:运行一个轻量探测器,在行动 发生处采样更多──VideoAgent 使用这种方式──

Tasté + contexte: dans les limites de la prise de vue + cadres adjacents 采样── pour le contenu cinématographique──

### Rassemblement par cadre

Dans un contexte de 128K de Qwen2.5-VL-72B, 576 jetons par frame sont disponibles, mais le coût est élevé.

3x3 bilinéaire pool sera chaque cadre réduit à 64 jetons -> 5 minutes pour 19 200 jetons― pour la plupart des tâches c'est un bon point―

Pour les flux de travail des agents, il est possible de mieux gérer le pooling (en 6x6 -> 16 jetons par cadre), car les détails spatiaux sont importants.

### Les quatre critères de référence vidéo

- Vidéo-MME: compréhension globale de la vidéo, comprenant courte + moyenne + longue。
- TempCompass:细粒度 raisonnement temporel, contenant des questions "avant" / "après"
- Il est également connu pour sa grande popularité.
- Vidéo-MMMU:Multimodal 多学科视频问题──

完整视频-VLM evaluation 会覆盖全部四个──它们强调不同维度:TempCompass 关注订单,EgoSchema 关注3+minutes de raisonnement,VideoMME 覆盖多种持续时间──

### Format de sortie de mise au sol

Temporal de la mise à terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre de la mise en terre

- Textes libres:"Le chat saute autour de la marque de 4 secondes. " 于解析但不精确。
- JSON structuré:`{"event": "jump", "start": 4.1, "end": 4.3}`◊ Quwen2.5VL 会训练这种形式──
- Basé sur des jetons: speciale `<time>4.1</time>`Les jetons avec les réponses sont en mode Qwen2.5-VL.

Le format de sortie JSON de Qwen2.5VL peut être directement résolu.

### 2026 les meilleures pratiques

Les meilleures pratiques des VLMs vidéo de 2026:

- Le codeur:带 M-RoPE 或 TMRoPE 的 SigLIP 2(Qwen2.5-VL)。
- Prise d'échantillons de cadres: FPS dynamique (en fonction du mouvement utilisé 1 à 4), avec capot maximal de cadres
- Le regroupement par cadre: 3x3 bilinéaire.
- Résultats: contenant le temps + événement 字段的结构化 JSON。
- Benchmarks: Vidéo PME + TempCompass Utilisé pour le général; EgoSchema Utilisé pour le long horizon。


```figure
video-temporal-patches
```

## Utilisez-le
`code/main.py`包含:

- Pratiquant de cadres uniques et dynamiques FPS
- Un évaluateur de la fondation temporelle du jouet: donné à un temps déterminé, la "vérité de base" de l'événement et la sortie du modèle, dans la tolérance, dans l'évaluation de la précision.
- Comparison entre les deux types de vidéo:

## Je le livre.
本课会产出 `outputs/skill-video-vlm-frame-planner.md` Donner une tâche vidéo (monitoring, action recognition, temporalisation, synthèse), elle choisit le format de l'échantillon de cadre, le facteur de regroupement, le format de sortie et le niveau de précision attendu.

## 练习
1. Pour une démo de cuisson de 3 minutes, choisissez l'uniforme ou le FPS dynamique.

2. TMRoPE  spécifiquement ajouté quoi, est simple temporelle table d'intégration faire pas de?

3. 写一个VLM 可学习输出 temporale de mise à terre du schéma JSON―contenant des cas d'erreur―

4. 阅读 Video-LLaVA Section 3 中的"Alignment Before Projection"── Pourquoi est-ce mieux que d'entraîner les encoders d'images et de vidéos indépendants ?

5. détail Le classement des PME vidéo, jusqu'en 2026, quelle est la différence entre le modèle ouvert supérieur et le modèle propriétaire supérieur?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Temporal grounding | "Time-localized answers" | VLM 会为事件发生时间输出具体 timestamp range |
| TMRoPE | "Time-Multimodal RoPE" | 带绝对 timestamps 的 3D rotary position，由 Qwen2.5-VL 使用 |
| Dynamic FPS | "Motion-aware sampling" | 在 high-motion segments 采样更多 frames，在 static segments 采样更少 |
| Frame pooling | "Spatial compress per frame" | 在进入 LLM 前用 bilinear interpolation 减少每个 frame 的 patches |
| Video Q-former | "Clip compressor" | 将 N frames 映射到 K learned queries 的 cross-attention bottleneck |
| VideoMME | "Video bench" | 综合 short/medium/long video benchmark，2500+ samples |

## 延伸阅读
- [Zhang et al. — Video-LLaMA (arXiv:2306.02858)](https://arxiv.org/abs/2306.02858)
- [Li et al. — VideoChat (arXiv:2305.06355)](https://arxiv.org/abs/2305.06355)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Qwen Team — Qwen2.5-VL (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Lin et al. — VILA-1.5 (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
