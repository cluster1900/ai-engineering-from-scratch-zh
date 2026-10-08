# Famille Qwen-VL avec vidéo Dynamic-FPS

> La famille Qwen-VL  Qwen-VL (2023) ✓ Qwen2-VL (2024) ✓ Qwen2.5-VL (2025) ✓ Qwen3-VL (2025) ✓ est le modèle de langage de vision ouvert le plus influent de 2026 ✓ Chaque génération a fait un pari architectural déterminant et a copié d'autres projets en mode ouvert en 12 mois: à travers M-RoPE ✓ Réalisation de la résolution de l'état d'esprit de l'état d'esprit original ✓ Avec une fenêtre d'attention absolue pour le prélèvement de l'échantillonnage FPS dynamique ✓ ViT, ainsi que l'agent de sortie ✓ Formation ✓ Formation ✓ Qwen3-VL ✓ En cours, ce ensemble est déjà stable: un ensemble de base de haute résistance à la sortie 2D-ViT, qui va intégrer un grand projet de langage MLP ✓ OCP ✓ Lire la suite et comprendre les objectifs de chaque classe de formation ✓ Lire la suite ✓

**Type:** Learn
**Languages:** Python (stdlib, M-RoPE encoder + dynamic-FPS sampler)
**Prerequisites:** Phase 12 · 06 (patch-n'-pack)
**Time:** ~120 minutes

## Objectif de l'apprentissage
- 計算 M-RoPE 的三轴旋转(temporal、高度、宽度),并解释为什么三者都需要──
- Pour le choix de l'échantillonnage dynamique-FPS 策略,并推理令子-per-seconde et la précision de la détection des événements 取舍──
- 按顺序说出Qwen-VL 4 génération de mise à niveau, ainsi que chaque génération a mis en œuvre quoi.
- 连接一个Qwen2.5VL-style JSON agent 输出格式,并从VLM 响应中解析结构化工具调用──

##  problématique
Qwen-VL est publié en août 2023 et est une réponse directe à LLaVA-1.5 et BLIP-2.

La première innovation de la Qwen-VL est la 448x448 et la boîte de bordure terrestre 输出, faire en sorte que le modèle puisse se diriger vers l'objet.

视频:Video-LLaMA 堆叠逐编码并把它们给LLM── Elle est valable pour les courtes séries, mais ne s'applique pas aux vidéos de plusieurs heures, car le temps de ces types de vidéos est le seul signal──Qwen 团队 wants a single understanding of time──

结构化输出:LLaVA 输出自由格式文本──Agent 需要 JSON──Qwen-VL 使用显式 JSON 输出格式训练,包括把边界框 坐标作为文本──

Chaque génération de Qwen-VL a été élargie.

## 概念
### Qwen-VL (août 2023)

Première étape:OpenCLIP ViT-bigG/14 作为编码(2.5B params)、LLama-compatible Q-Former(1 étape avec 256 requêtes)、Qwen-7B base。贡献:

- 448x448 résolution (à l'époque de l'ouverture du SOTA du VLM)
- Le chat est à la boîte <box> ((112, 204), (280, 344)</box>"―
- Depuis le début, on fait des entraînements en chinois + en anglais.

Le niveau de base de l'équipe est de 4 à 5 ans.

### Qwen2-VL (septembre 2024)  M-RoPE avec résolution de l'origine

Qwen2-VL Utilisé avec un encodeur ViT résolution originale  a remplacé résolution fixe + Q-Former stack── Modification clé:

- Origins: le modèle de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de la résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de résolution de
- M-RoPE (RoPE multimodale)。 chaque jeton porte 3D 位置 (t, h, w), et non 1D。 pour l'image t=0; pour le vidéoclip t = frame_index。RoPE 按每个轴的频率旋转查询/key Vector。
- MLP projecteur──去掉 Q-Former; dans les jetons de patch fusionné 上使用2 couches MLP──
- 带动态 FPS 的视频──默认以1-2 FPS 采样视频,但模型接受任意数──

结果:Qwen2-VL-7B dans plusieurs Multimodal 基准上追平 GPT-4o, et DocVQA 上上超过它(94.5 vs 88.4)。 La modification de l'architecture est une étape décisive。

### Qwen2.5-VL(2025 年 2 月)  FPS dynamique + temps absolu

Le changement majeur de Qwen2.5VL est le vidéo.

- 绝对时间 Token──不使用位置索引(frame 0, 1, 2...),而使用实际时间──"À 0:04, le chat saute. " 模型会看到与框架代币 交错的 交错的`<time>0.04</time>`Les jetons
- FPS dynamique, matériel à faible vitesse à 1 FPS, scène d'action à 4+ FPS, sélectionné par l'utilisateur ou le trainageur; M-RoPE 会适配,
- Attention spatiale  adoption de fenêtres (bloc intérieur) pour augmenter la capacité de débit; chaque étage rejoint l'attention globale。
- 显式 JSON 输出格式──使用工具-call 数据训练:"{\"outil\": \"click\", \"coords\": [380, 220]}"──开箱即代理-ready──
- L'échelle MRoPE-v2 ⋅ position sera avec le plus grand nombre d'entrée, donc 10 minutes de vidéo ne consommeront pas le maximum de fréquence ⋅

基准:Qwen2.5-VL-72B 在多数视频基准上超过GPT-4o,在文档上追平Gemini 2.0,并为GUI grounding 设定开放模型SOTA(ScreenSpot: 84% de précision par rapport à GPT-4o's 38%)。

### Qwen3-VL (novembre 2025)

Qwen3-VL est une fois augmentation de la quantité de mise à niveau, l'accent est mis sur l'intégration plutôt que sur la réinvention: plus grande colonne vertébrale LLM ((Qwen3-72B) 、 étendre la formation données、 améliorer l'OCR, ainsi que par le biais du mode de pensée Qwen3  obtenir un raisonnement plus fort―.

Cette génération est d'abord composée de données et de calcul, et non de données primitives.

### M-RoPE mathématiquement

经典 RoPE 使用成对坐标, selon la position `m`旋转维度为 `d` `q`- Le numéro de la liste:

```
q_rot[2i]   = q[2i]   * cos(m * theta_i) - q[2i+1] * sin(m * theta_i)
q_rot[2i+1] = q[2i]   * sin(m * theta_i) + q[2i+1] * cos(m * theta_i)
theta_i     = 10000^(-2i/d)
```

M-RoPE va être caché dans une bande de trois tranches.`d = 96` Distribuer 32 dims 给 temporal、32 给 height、32 给 width── chaque bande 按自己的轴位置旋转──位于 (t=5, h=10, w=20) du patch 会在其三条带上分别应用旋转`R_t(5)`- Je suis là.`R_h(10)`- Je suis là.`R_w(20)`Il y a une autre.

Les jetons texte`t = text_index, h = 0, w = 0`(ou une sorte de réduction), pour maintenir la capacité de l'utilisation.`t = frame_time, h = row, w = col` usage de l'image`t = 0`Il y a une autre.

Avantage: un code de position est capable de traiter du texte, des images et des vidéos, sans avoir à décomposer le code ou un autre tableau de position.

### Dynamique-FPS 采样逻辑

Je suis en train de faire une fête.`T`秒的视频和目标 Token  budget `B`- Le numéro de la liste:

1. 计算你能承担的最大FPS:`fps_max = B / (T * tokens_per_frame)`Il y a une autre.
2. De `{1, 2, 4, 8}`中选择满足 `fps <= fps_max`Le but de la FPS:
3. Si le mouvement est faible, choisissez un FPS plus faible.
4. 按选定 FPS 均采样; entre 插入 `<time>t</time>`Les jetons

Qwen2.5VL 会隐式训练这种逻辑;推理时用户通过 `fps`Un séquence de 60 secondes, avec 4 FPS, pour 81 jetons calculés, égal à 19440 jetons, dans un contexte de 32k 中可管理──

### Produit d'agent structuré

Qwen2.5-VL   訓練 显式面向结构化工具调用:

```
{
  "tool": "mouse_click",
  "coords": [1024, 512],
  "button": "left",
  "modifier": null
}
```

解析是确定性的: pour le modèle de sortie d'exécution JSON.parse。 par rapport, le format libre de "cliquer à (1024, 512) " nécessite un traitement regex 和歧义── ce changement explique pourquoi le nombre de scènes de Qwen2.5 à VL passe de 55% à 84%──


```figure
mm-mrope-axes
```

## Utilisez-le
`code/main.py`实现:

- Pour les images et les images de texte mixte, effectuer des calculs de position M-RoPE.
- Pratiquant de l'échantillonnage FPS dynamique:给定 (durée, budget, niveau de mouvement), sélectionner FPS 并输出 frame timestamps。
- Un parseur de sortie JSON Qwen2.5VL, utilisé pour traiter les réponses aux appels d'outils.

- C'est un peu comme ça. - C'est un peu comme ça.

## Je le livre.
本课产 出 `outputs/skill-qwen-vl-pipeline-designer.md` donner une tâche de vidéos (monitoring, agent, action recognition, accessibilité), elle produira Qwen2.5 VL configuration, cadre budget, stratégie FPS, fenêtre-attention flag, mode de sortie de l'agent) et de retard d'estimation.

## 练习
1. 計算 hidden 48(每条 band 16,base theta 10000)时,位于 (t=3, h=5, w=7) du patch de M-RoPE 旋转──展示每条 band 中前三对的旋转角度──

2. Une vidéo de sécurité de 10 minutes, à 1 FPS, produira combien ? À 384 résolution et 3x pool, le total du nombre de jetons est combien ?

3. Pour 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, 30 secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, secondes, etc.

4. Qwen2.5VL  complètement éliminé Q-Former── Pourquoi simple MLP en 2025 disponible, mais impossible en 2023?

5. Qu'est-ce qui ne va pas arriver ? Qu'est-ce qui ne va pas arriver ? Qu'est-ce qui va arriver ?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| M-RoPE | "Multimodal RoPE" | hidden dim 中带 temporal、height 和 width bands 的 3D rotary position embedding |
| Dynamic FPS | "Smart sampling" | 根据运动、时长和 Token 预算为每个视频选择的帧采样率 |
| Absolute time token | "Timestamp token" | 在序列中交错插入的 `<time>t</time>`，让模型看到实际秒数而不是帧索引 |
| Window attention | "Local attention" | 为提速而限制在小窗口内的 spatial self-attention；周期性加入 global attention |
| Structured agent output | "JSON mode" | 通过训练数据监督教 VLM 输出可解析 JSON，其中包含 coords 和 tool names |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的每请求控制项，用来约束总像素数，从而约束 Token 数 |
| Grounding | "Point-at-it" | 将 bounding-box 坐标作为文本 Token 输出；自 Qwen-VL v1 起使用 |

## 延伸阅读
- [Bai et al. — Qwen-VL (arXiv:2308.12966)](https://arxiv.org/abs/2308.12966)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Qwen Team — Qwen3-VL (arXiv:2511.21631)](https://arxiv.org/abs/2511.21631)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
