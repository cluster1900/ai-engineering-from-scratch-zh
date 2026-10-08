# Les VLA incarnées:RT-2, OpenVLA, π0, GR00T

> La première fois que le modèle a été mis en œuvre dans les machines de cuisine, c'est RT-2 (Google DeepMind, 2023 juillet) ⋅ RT-2 va se démarquer en texte Token, co-finitionner les données Web avec les données d'action robot sur VLM, et prouver que le langage de vision à l'échelle Web la connaissance peut être transférée au contrôle des machines. OpenVLA (OpenVLA) a publié en juin 2024, une référence ouverte à la réalisation de la série 7B ⋅ Physical Intelligence ⋅ π0 ⋅ 2024-2025) ⋅ rejoindre des experts en action de parallèle de flux ⋅ NVIDIA GR00T N1 ⋅ 2025 3 mois) ⋅ Système 1 / Système 2) ⋅ Système 2 ⋅ VLA contrôle d'action primitive, langage de vision, un module de l'action entre les deux phases ⋅ Read-B ⋅ Modèle ⋅ Modèle de l'action de la phase 15 ⋅ See module de l'action de l'action de la phase 1 ⋅ NVIDIA GR00T N1 ⋅ 3 mois de 2025 ⋅ Nvidia ⋅ 3 ⋅ 2025 ⋅ 3 mois ⋅

**Type:** 学习
**语言：**Python (stdlib, action Tokenizer + VLA)
**Prerequisites:** Phase 12 · 05（LLaVA），Phase 15（Autonomous Systems，已引用）
**Time:** ~180 分钟

## Objectif de l'apprentissage

- 描述 action tokenization:离散 bin 编码(RT-2)、FAST 高效 action Token、连续 flow-matching actions(π0)。
- Expliquer pourquoi les données web + robot sont co-finement ajustées, ce qui permet de conserver le transfert de connaissances générales des nouvelles missions.
- Dans le même mécanisme, on peut comparer le système de l'OpenVLA avec le système de l'OpenVLA avec le système de l'OpenVLA avec le système de l'OpenVLA avec le système de l'OpenVLA avec le système de l'OpenVLA.
- Il est également possible de détecter les données de l'ensemble de données Open X-Embodiment et son rôle en tant que corpus de formation RT-X.

##  problématique

能根据自然语言指令做家务的机器人, depuis les années 1970 est toujours un objectif de recherche. La réponse des années 2020 est: vision-language-action (VLA) modèle (VLM) utilisé avec VQA similaire architecture, mais la sortie n'est pas un texte, mais une activation (Joint torques, effets de fin, commandes discrètes)

Les défis particuliers de la VLA:

1. 动作空间是连续的(joint angles、forces),并且高维(7-DOF arm + 3-DOF gripper = 10 dims à 30 Hz)
2. 机器人专专专训数据稀缺──Open X-Embodyment Il y a environ 1M de trajectoires; image de texte Web est 5B+──
3. La fréquence de contrôle est importante. La boucle de contrôle de 30 Hz signifie que chaque mouvement ne fait que 33 ms. Budget.
4. Sécurité. Échec de travail.

## 概念

### Tokenization de l'action (RT-2)

RT-2: mettre chaque cible commune indiquant un texte quantifié après Token。 sera regroupé en [-1, 1]  Réserve dispersée en 256 bin,并将每个 bin 映射到一个词汇 ID。 une action 10-DOF dans chaque étape de contrôle Se transformera en 10 个 Token。

Dans les données mixtes, il est possible de co-finir le PaLM-X VLM:

- Parties d'images et de texte sur le Web
- Des démonstrations de robots, des actions, des symboles.

模型看 pick up the red cube(language)→ image(vision)→ 10-sequence d'action Token(objectifs conjoints discrets)。Web pré-entraînement 保留 transfert de connaissances générales:

RT-2 论文中的推理为 3-5 Hz, limité au décode autorégressif VLM

### OpenVLA  开放的 7B 参考实现

OpenVLA(Kim et al.,2024 年 6 月) est une activité de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l'écran de l

Dans le cadre de l'opération X-Embodiment, les équipements utilisent des systèmes de réglage de l'air à l'aide de l'appareil.

Inférence: à la fréquence A100, la quantification peut atteindre 4 à 5 Hz.

### FAST Tokenizer  Décoder plus rapide de l'action

Pertsch et coll. (en 2024) soulignent que la tokenization discrète-bin n'est pas élevée, car la plupart des mouvements se concentrent dans la petite région du bin-space.

Une trajectoire d'action de 30 étapes  devient environ 10 Tokens FAST, au lieu de 300 Tokens discrets-bin──Inference  Speed提升 3-5x,且不损失质量──

### π0 和 actions de correspondance des flux

L'intelligence physique de l'homme est une technique de calcul de la quantité d'énergie utilisée pour calculer les flux d'énergie.

- Un petit transformateur d'action 读取 VLM's hidden states,并通过 rectifié flow 输出连续的50-step action sequence──
- tête d'action Utilisation de la perte de correspondance de flux 训练; VLM prétraining 保持不变。
- Inference: une séquence d'action complète dans environ 5 étapes de dénonciation, atteignant en réalité 50 Hz 控制。

π0 的主张: sur un large ensemble de tâches d'opération, il a battu OpenVLA et Octo.

π0.5 和 π0-FAST est la mise à niveau de la quantité.

### GR00T N1  面向人形的双系统

NVIDIA GR00T N1(2025 年 3 月) Face vers des robots humanoïdes ((> 30 DOF, tout corps) Construction:

- Système 2: VLM 读取场景 + 指令,并以约1 Hz 产生高水平子目标──
- Système 1: transformateur à tête d'action de petite taille, selon les sous-objectifs  produire des commandes conjointes de 50 à 100 Hz de basse couche ⋅

Cette division s'oppose à la rapidité de Kahneman et à la lenteur de la réflexion: Système 2  planification, Système 1  exécution.

GR00T N1.7(2025 année de fin) a amélioré l'échelle des données。GR00T utilise des données sim-à-réelle de l'Omniverse  effectuer une mise à jour fine。

### Le corps X ouvert

训练数据──RT-X(2023 年 10 月)汇集了 22 数据集, couvrant 22 机器人上的 1M trajectoires──Open X-Embodiment est le corpus utilisé par tous:

- ALOHA / Bridge V2 / Droid / RT-2 Cuisine / Tableau de langue。
- Chaque exemple: état du robot, vue de la caméra, instruction, séquence d'action)
- 訓練卫生: unification de l'espace d'action 归一化 joint ranges 调整摄像机尺寸

OpenVLA et π0 sont utilisés dans Open X-Embodiment pour la formation.

### Co-finition avec robot seulement

Co-finition des données VQA du Web avec les trajectoires des robots 混合──比例 很重要:VQA 太多,模型会忘记动作;

RT-2: approximativement 1:1──OpenVLA:web-to-robot: approximativement 0.5:1──π0: analogues──

Les robots seulement 训练会产生任务专用模型,遇到出发的指令就会失败。Co-fine-tuning 的差异在于,模型不仅能处理 挑起红立方块(在演示中) ,还能处理 挑起左边第三大物体(novel phrasing) ──

### Limits de sécurité et d'action

Chaque VLA de production est équipée de:

- 硬 joint limits ((( ne peut dépasser le couple de la réglementation)
- Limite de vitesse (coupage doux)
- Limits de l'espace de travail (effect final)
- Pour les nouvelles missions, l'utilisation de l'homologation humaine en cours de réalisation.

Ces contrôles de couche de contrôle sont effectués à l'extérieur du VLA.


```figure
mm-action-tokens
```

## Utilisez-le

`code/main.py`- Le numéro de la liste:

- ¢ réaliser la tokenization et la détokenization d'action 256-bin¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- 基于 DCT + quantification 草拟 FAST Tokenizer。
- Comparer avec le nombre de jetons de chaque étape d'action.
- 打印 RT-2 → OpenVLA → π0 → GR00T 的谱系摘要──

## Je le livre.

本课产 出 `outputs/skill-vla-action-format-picker.md` donner une tâche de machine à machine (manipulation, navigation, tout corps humain), en train de faire des choix entre un bin discrète + RT-2、FAST + OpenVLA、parallèle de flux + π0 ou un système double + GR00T

## 练习

1. Un bras 10 DOF, à 30 Hz  contrôler la fréquence de fonctionnement ∙ 256 bins de la sélection discrète-bin Tokenization par seconde émet combien de jetons ?

2. La symbolisation rapide va réduire les trajectoires de 30 étapes à environ 10 Tokens. Si la trajectoire contient des mouvements de fréquence élevée (par exemple, le tambour), les utilisateurs vont perdre quoi ?

3. Le décodage autorégressif de π0 est défini en 5 étapes.

4. Le système 1 / système 2 de GR00T 拆分对应 Kahneman── propose un système différent de la division.

5. 阅读Open X-Embodiment Section 4 关于数据集库存的内容──说出防止域名泄漏的三条库存规则──

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|----------|
| VLA | "Vision-language-action" | 接收 image + instruction 并输出 action commands 的模型 |
| Action tokenization | "Discrete bins" | 将连续 joint targets 量化为每个 dim 256 个 bin，每个 bin 是一个 vocab ID |
| FAST tokenizer | "Frequency action tokens" | DCT + quantize，将 30-step trajectories 压缩到约 10 个 Token |
| Co-fine-tune | "Mix web + robot" | 在 robot demos 旁边同时使用 web VQA data 训练，以保留通用知识 |
| Flow-matching action head | "π0 continuous output" | 小型 transformer，通过 rectified flow 输出 50-step action sequence |
| System 1 / System 2 | "Dual-system control" | 大型 VLM 慢速规划，小型 action head 快速行动；GR00T 模式 |
| Open X-Embodiment | "RT-X dataset" | 1M-trajectory 跨机器人 dataset；training corpus |

## 延伸阅读

- [Brohan et al. — RT-2 (arXiv:2307.15818)](https://arxiv.org/abs/2307.15818)
- [Kim et al. — OpenVLA (arXiv:2406.09246)](https://arxiv.org/abs/2406.09246)
- [Black et al. — π0 (arXiv:2410.24164)](https://arxiv.org/abs/2410.24164)
- [NVIDIA — GR00T N1 (arXiv:2503.14734)](https://arxiv.org/abs/2503.14734)
- [Open X-Embodiment Collab — RT-X (arXiv:2310.08864)](https://arxiv.org/abs/2310.08864)
