# Transfert sim-réel

> Une politique qui échoue dans le matériel, en fait, est de se rappeler le simulateur. La randomisation du domaine, l'adaptation du domaine et l'identification du système permettent aux contrôleurs d'apprendre à traverser les lacunes de la réalité.

**Type:** 学习
**Languages:** Python
**Prerequisites:** Phase 9 · 08 (PPO), Phase 2 · 10 (Bias/Variance)
**Time:** ~45 分钟

##  problématique

訓練真人机器人 很慢、危险且昂贵── un biped 需要数百万训练集 才能学会走走;而真人 biped 哪怕摔倒一次,也可能损坏硬件── la simulation 给你无限重设、确定性可复现、并行环境,并且不会造成物理损坏──

Mais les simulateurs sont faux. Les roulements sont plus gros que les modèles MuJoCo. Les caméras ont des distorsions de lentilles, et le simulateur ne contient pas. Les moteurs ont des retards, des rétroaction et une saturation, et 99% des modèles sim ont sauté à travers ces éléments.**reality gap**La différence systémique entre la distribution sim et la distribution réelle est le problème central de la RL déployée dans la robotique.

Vous avez besoin d'une politique de distribution *sim-to-real* 具有强烈性政策──三种历史方法:randomize simulator(domain randomisation)、用少量真数据 适配政策(domain adaptation / fine-tuning),或识别真系统的参数并匹配它们 (identification du système)──到2026年, les principales méthodes de traitement vont mettre ces trois personnes en relation avec une simulation parallèle à grande échelle(Isaac Sim、Isaac LabMujoco MJX sur GPU) 结合────

## 概念

![Three sim-to-real regimes: domain randomization, adaptation, system identification](../assets/sim-to-real.svg)

**Domain Randomization (DR)。**Tobin et coll., 2017,Peng et coll., 2018;; au cours de la formation, randomiser chaque possible sim dans un robot réel sur différents paramètres sim: masses, coefficients de frottement, gains de PD moteur, bruit de capteur, position de caméra, éclairage, textures, modèles de contact;; politique Apprendre à une distribution des conditions de sim dans lequel il se trouve aujourd'hui, et à une généralisation dans l'ensemble du champ;; si le robot réel est dans une enveloppe de formation, la politique pourra travailler;;

- **优点：**Il n'y a pas besoin de données réelles.
- **缺点：**L'entraînement de la randomisation excessive entraîne une politique universelle mais trop prudente.

**System Identification (SI)。**Avant l'entraînement, utilisez les paramètres du simulateur réel avec des données du monde réel. Si vous pouvez mesurer la friction du robot réel, remplissez-le dans le simulateur.

- **优点：**精确、低噪音 de formation cible
- **缺点：**Les erreurs de modèle restantes dans la politique sont invisibles; les effets de petite incognition (par exemple, la bande morte du moteur) peuvent encore nuire au déploiement.

**Domain Adaptation。**Dans le sim, vous pouvez utiliser une petite quantité de données réelles en mode fine-tune.

- **Real2Sim2Real：**Utilisez des déploiements réels.`f(s, a, z) - f_sim(s, a)`Il n'y a pas besoin de beaucoup de données réelles pour réduire la différence.
- **Observation adaptation：**训练一个政策, via un extracteur de fonctionnalités appris (par exemple GAN pixel-to-pixel) va être un véritable obs → sim-like obs.

**Privileged learning / teacher-student。**Miki et coll. 2022(Animal quadruped) ・・・ dans la simulation entraînement une capacité d'accès aux informations privilégiées(truth friction du sol, altitude du sol, dérive IMU) de *professeur*。 re distiller un unique observation de sensors réels de *étudiant*。étudiant 学会从历史中推断特权特征,并在物理参数变下保持强──

**Massively parallel simulation。**20242026── Isaac Lab、Mujoco MJX、Brax DATABLE peut fonctionner sur un seul GPU avec des milliers de robots parallèles──PPO 搭配 4,096 paraleles humanoïdes, peut être rassemblé en quelques heures 多年经验── Avec la distribution de formation 变宽,reality gap 缩小; alors que ces 4,096  envs ont chacun des paramètres randomisés différents 时,DR 几乎是免费的──

**2026 年真实世界配方（quadruped walking 示例）：**

1. Utiliser une simulation parallèle massive,并 à la gravité, à la friction, à la gains motrices, à la charge utile, à la randomisation du domaine.
2. Utiliser des informations privilégiées: carte du terrain, vitesse du corps, vérité du terrain, politique des enseignants.
3. Il faut utiliser des codes de l'articulation des jambes pour distiller la politique des élèves.
4. 可选: par le biais de l'autocodeur IMU 上 de réel faire une adaptation d'observation.
5. Déployer dans 10 environnements supérieurs à zéro. Si vous ne réussissez pas, utilisez PPO restreint à la sécurité pour effectuer quelques minutes de réglage réel.


```figure
f3-reality-gap
```

## - Je le construis.

Le code de ce cours est une très petite démonstration de randomisation de domaine, le scénario est avec des transitions * bruyantes* de GridWorld。 nous avons entraîné une politique, laissez-la vivre des probabilités de glissement aléatoire dans sim et en real en utilisant un niveau de glissement jamais vu lors d'un entraînement pour faire une évaluation。 cette forme peut être directement mappée à MuJoCo-to-hardware transfer。

### 步骤 1: sim paramétrié

```python
def step(state, action, slip):
    if rng.random() < slip:
        action = random_perpendicular(action)
    ...
```

`slip`Dans la vraie robotique, il peut s'agir de friction, de masse, de gain moteur, ou de tout changement qui se produit entre le sim et le réel.

### 步骤 2: Utiliser le DR

Dans chaque épisode, on commence par le même genre.`slip ~ Uniform[0.0, 0.4]`◊ entraînement PPO / Q-apprentissage / 任意方法──重复许多集──

### Étape 3: Dans les feuilles réelles, faites un tir zéro

Dans le`slip ∈ {0.0, 0.1, 0.2, 0.3, 0.5, 0.7}`上评估──前四个在培训支持内;`0.5`et `0.7`La politique de formation en RD doit être soutenue et maintenue à la meilleure distance possible.

### Étape 4: Comparé à une formation étroite

- Je ne peux pas.`slip = 0.0` Dans le même groupe `slip`Vous devriez voir, une fois que le vrai glissement > 0, le retour, la catastrophe sera plus basse.

## La trappe

- **过多 randomization。**Dans le`slip ∈ [0, 0.9]`En haut de l'entraînement, votre politique deviendra extrêmement averse au risque, jusqu'à ce que vous ne tentiez pas de suivre une voie optimale.
- **过少 randomization。**Dans une très faible partie du cadre de formation, la politique completement impossible à généraliser  utilise un programme adaptatif  Automatic Domain Randomization), avec la politique 改进逐步拓宽分布
- **误判 parameter space。**Randonner 错误的东西(真实差距是机器延迟,但随机化摄像头色),DR 不会有帮助──先配置 真实机器人──
- **Privileged info leakage。**Si un enseignant utilise l'état mondial pour faire des actions, et non seulement des observations, il peut produire des résultats que l'étudiant ne peut pas suivre.
- **Sim-to-sim transfer failure。**Si votre politique pour une variante sim plus difficile n'est pas robuste, elle ne sera pas robuste pour le monde réel.
- **没有 real-world safety envelope。**Une politique qui est valide et efficace en sim, si le disque de sécurité de faible niveau n'est pas utilisé, il peut encore être endommagé.

## Utilisez-le

2026 année sim-à-réel pile:

| Domain | Stack |
|--------|-------|
| Legged locomotion (ANYmal, Spot, humanoid) | Isaac Lab + DR + privileged teacher / student |
| Manipulation (dexterous hands, pick-and-place) | Isaac Lab + DR + DR-GAN for vision |
| Autonomous driving | CARLA / NVIDIA DRIVE Sim + DR + real fine-tune |
| Drone racing | RotorS / Flightmare + DR + online adaptation |
| Finger/in-hand manipulation | OpenAI Dactyl (DR at unprecedented scale) |
| Industrial arms | MuJoCo-Warp + SI + small real fine-tune |

Pour tous les contrôles, le flux de travail est le même: essayer de simuler, randomiser les parties que vous ne pouvez pas, entraîner des politiques énormes, distiller, puis déployer un bouclier de sécurité.

##  La publier

保存为 `outputs/skill-sim2real-planner.md`- Le numéro de la liste:

```markdown
---
name: sim2real-planner
description: 为给定 robot + task 规划 sim-to-real transfer pipeline，覆盖 DR、SI 和 safety。
version: 1.0.0
phase: 9
lesson: 11
tags: [rl, sim2real, robotics, domain-randomization]
---

给定一个 robot platform、一个 task，以及可访问真实硬件的时间，输出：

1. Reality gap 清单。按预期影响排序的可疑来源（contact、sensing、actuation delay、vision）。
2. DR parameters。精确列表、范围、distribution。针对 real measurements 论证每个范围。
3. SI steps。要测量哪些参数；测量方法。
4. Teacher/student 拆分。teacher 使用哪些 privileged info；student 使用哪些 obs。
5. Safety envelope。Low-level limits、emergency stops、backup controller。

拒绝在没有 (a) zero-shot sim-variant test，(b) safety shield，(c) rollback plan 的情况下 deploy。标记任何超过 measured real variability 3× 的 DR range，因为它很可能 over-randomized。
```

## 练习

1. **Easy。**Dans le monde de la grille à glissage fixe, on apprend à trainer un agent Q-apprentissage.
2. **Medium。**train a DR Q-apprentissage agent,采样 `slip ~ Uniform[0, 0.3]`En effet, les résultats obtenus par la Commission ont été très satisfaisants.
3. **Hard。** réaliser un programme de formation: à partir de 0,0 ), chaque fois que la politique atteint 90% de l'optimisation, élargir la gamme de DR, et atteindre 0,3 étapes de l'environnement total nécessaire, en comparaison avec la base fixe de DR.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Reality gap | “Sim-to-real difference” | training 与 deployment 的 physics/sensing 之间的 distribution shift。 |
| Domain randomization (DR) | “Train across random sims” | 训练期间 randomize sim parameters，让 policy 泛化。 |
| System identification (SI) | “Measure real and fit sim” | 估计真实物理参数；设置 sim 来匹配。 |
| Domain adaptation | “Fine-tune on real data” | sim training 后进行少量 real-world fine-tune；可能适配 obs 或 dynamics。 |
| Privileged info | “Ground truth for teacher” | 只有 sim 拥有的信息；student 必须从 obs history 中推断它。 |
| Teacher/student | “Distill privileged -> observable” | teacher 使用捷径训练；student 学会在没有这些捷径的情况下模仿。 |
| ADR | “Automatic Domain Randomization” | 随着 policy 改进而拓宽 DR ranges 的 curriculum。 |
| Real2Sim | “Close the gap with real data” | 学习一个 residual，让 sim 模仿 real rollouts。 |

##  ultérieur

- [Tobin et al. (2017). Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World](https://arxiv.org/abs/1703.06907) Origini DR papier  vision robotique)
- [Peng et al. (2018). Sim-to-Real Transfer of Robotic Control with Dynamics Randomization](https://arxiv.org/abs/1710.06537) dynamique de la DR, locomotion quadruple
- [OpenAI et al. (2019). Solving Rubik's Cube with a Robot Hand](https://arxiv.org/abs/1910.07113) Dactyl, ADR à grande échelle
- [Miki et al. (2022). Learning robust perceptive locomotion for quadrupedal robots in the wild](https://www.science.org/doi/10.1126/scirobotics.abk2822) Animaux de l'enseignant-étudiant
- [Makoviychuk et al. (2021). Isaac Gym: High Performance GPU Based Physics Simulation for Robot Learning](https://arxiv.org/abs/2108.10470) 驱动 20252026 déploiements de simulation massiquement parallèle
- [Akkaya et al. (2019). Automatic Domain Randomization](https://arxiv.org/abs/1910.07113) Métode du programme d'ADR:
- [Sutton & Barto (2018). Ch. 8 — Planning and Learning with Tabular Methods](http://incompleteideas.net/book/RLbook2020.pdf) Dyna framing(使用模型做规划 + rollouts),支现代 sim-to-real pipelines。
- [Zhao, Queralta & Westerlund (2020). Sim-to-Real Transfer in Deep Reinforcement Learning for Robotics: a Survey](https://arxiv.org/abs/2009.13303) Taxonomie des méthodes sim-to-real,并包含 les résultats de référence.
