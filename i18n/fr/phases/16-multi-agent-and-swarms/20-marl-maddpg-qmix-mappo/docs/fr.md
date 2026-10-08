# MARL  MADDPG, QMIX, MAPPO

> L'apprentissage de renforcement multi-agent  coordonnés  transmettre, en 2026 encore influencer LLM-agent 系统**MADDPG**(Lowe et al., NeurIPS 2017, arXiv:1706.02275)  introduit la formation centralisée, exécution décentralisée (CTDE): pendant la formation, chaque critique peut voir l'état et l'action de tous les agents; testes sont uniquement utilisés par les acteurs locaux.**QMIX**(Rashid et coll., ICML 2018, arXiv:1803.11485) est une valeur-décomposition du réseau de mélange monotonique; chaque agent de Q 会组合成 joint Q, donc `argmax`Il peut être distribué à chaque agent en priorité dans le StarCraft Multi-Agent Challenge (SMAC).**MAPPO**(Yu et al., NeurIPS 2022, arXiv:2103.01955) est une fonction de valeur centralisée de PPO; dans le monde des particules, SMAC, Google Research Football, Hanabi, il faut seulement très peu de modifications sur une efficacité étonnante.**2026 年 cooperative-MARL 的默认 baseline** Le cours se déroule à partir d'un petit jouet de réseau-monde  Construire chaque méthode, avant de contacter la formation de l'agent LLM , d'abord mettre ces trois idées en pratique dans la mémoire de la musculature 

**类型：**Apprendre à apprendre
**语言：**Python (stdlib,小型无 NumPy 实现)
**先修：**Phase 09 (apprentissage par renforcement), phase 16 · 09 (réseaux de rassemblement parallèles)
**时间：**- 90 minutes

##  problématique

La politique de coordination entre les agents de formation en LLM:何时推迟、何时行动、调用哪个同行── vous dire comment entraîner ce type de politique est le multi-agent reinforcement learning (MARL), il a été plus tôt que la vague de LLM, et il existe déjà un petit groupe d'algorithmes principaux──

Si vous n'avez pas de vocabulaire de modèle, lisez MARL 论文会很痛苦──entraînement centralisé avec exécution décentralisée (CTDE), décomposition de la valeur et critiques centralisées ne sont pas des mots à la mode  它们是对具体问题具体答案:

- RL indépendant (à chaque agent) du point de vue de chaque agent (à chaque agent)
- RL centralisée (un agent contrôle tout) ne peut pas être étendu et enfreint les contraintes d'exécution.
- CTDE 兼得两者优点: utiliser l'information globale 训练, utiliser les politiques locales 部署。

## 概念

### 论文 usage de trois catégories d'environnement

- **Particle World (multi-agent particle env)。**简单 2D physique, comprenant une tâche coopérative/competitive.
- **StarCraft Multi-Agent Challenge (SMAC)。**La coopération dans le micro-gestion, l'observation partielle, le test de QMIX, les actions discrètes, les états continus,
- **Google Research Football, Hanabi, MPE。**L'indice de base de la carte de référence:

Il existe différents types d'algorithmes d'action/observation.

### MADDPG (2017)  modèle CTDE

Chaque agent .`i`Il y a un acteur dans la ville .`mu_i(o_i)`Il y a aussi un critique .`Q_i(x, a_1, ..., a_n)`Il a vu toutes les observations et toutes les actions durant l'entraînement.

```
actor update:    grad_theta_i J = E[grad_theta mu_i(o_i) * grad_a_i Q_i(x, a_1..n) at a_i=mu_i(o_i)]
critic update:   TD on Q_i(x, a_1..n) given next-state joint estimate
```

Pourquoi utiliser CTDE: En entraînement, nous savons l'action de chacun; nous utilisons ces informations pour réduire la variance de chaque critique.`o_i`,并调用 `mu_i(o_i)`Il y a une autre.

失败模式:critics 会随 N 个代理 增长(输入包含所有行动) ⋅ s'il n'y a pas d'approximation, il est difficile de se développer à ~10 个以上的代理──

### QMIX (2018)  décomposition de la valeur

仅适用于合作社――Global reward 之和:

```
Q_tot(tau, a) = f(Q_1(tau_1, a_1), ..., Q_n(tau_n, a_n)),   df/dQ_i >= 0
```

monotonie 保证 `argmax_a Q_tot`Il peut être choisi par chaque agent.`argmax_{a_i} Q_i`C'est exactement ce dont tu as besoin.**decentralized execution property** En train, mélangez le réseau de chaque agent`Q_tot`Il y a une autre.

Pourquoi QMIX en SMAC 上获胜:coopérationnelle micro-gestion StarCraft 具有同质的代理人、本地 obs、全球奖励 与价值分解 完美契合──

失败模式:constraint de monotonie 限制较强; certaines tâches de récompense ne sont pas monotones décomposables (par exemple, un agent pour le sacrifice d'une équipe)  méthode de développement (QTRAN、QPLEX) 

### MAPPO (2022)  被低估的默认选择

PPO multi-agent: avec une fonction de valeur centralisée PPO;. chaque agent a sa propre politique; tous les agents 共享(或拥有 per-agent) peuvent voir la fonction de valeur de l'état complet. Yu et al. 2022

- MAPPO dans le monde des particules, SMAC, Google Research Football, Hanabi, MPE, en plus de la méthode MARL non-politique.
- - l'hyperparamètre nécessaire à l'ajustement
- 訓練稳定; transcendant la semence 可复现。

Avant cet article, la communauté a sous-estimé la MARL en matière de politique.

### Pourquoi l'ingénieur agent LLM  devrait s'inquiéter

3 utilisations directes:

1. **Router training。**Meta-agent 选择哪个子代理 处理任务──这是一个包含N 个分散子代理和一个集中路由器的 MARL 问题──MAPPO 适合──
2. **Role emergence。**Dans la simulation générative-agent, l'agent de formation prend le rôle de complément à temps, en substance est une forme de MARL déformée en autre forme.
3. **Multi-agent tool use。**Lorsque les agents partagent des outils et se disputent le budget, ils peuvent obtenir des politiques locales déployables et respecter les contraintes de ressources.

实践提醒: jusqu'en 2026, la plupart des produits LLM-agent 系统 系统 是 prompt 它们的政策, et non pas les entraîner.

### CTDE  comme modèle de conception en dehors de RL 

Même si vous ne vous entraînez pas, CTDE est également un modèle d'architecture utile:

- Dans la phase de conception, on suppose une visibilité de l'équipe complète.
- Dans la phase de " runtime ", l'exécution décentralisée est obligatoire.`o_i`Il y a une autre.

Ce modèle vous oblige à déterminer le maintien par état d'agent, et à réfléchir à l'observabilité partielle.

### non-stationnalité 问题

Lorsque plusieurs agents sont en cours d'apprentissage, chaque agent de l'environnement (incluant les autres agents) sont non-stationnaires.

- MADDPG: le critique mondial voit toutes les actions, donc son estimation de valeur est stationnaire.
- QMIX: la décomposition des valeurs va déplacer l'apprentissage dans l'espace joint-Q, où l'optimisation a une signification définie.
- MAPPO: fonction de valeur centralisée, qui réduirait les variations des changements de politique d'autres agents.

Dans le système de l'agent LLM, la non-stationnalité se traduit par un agent de mon agent 上个月还正常,现在上游另一个 agent 改了,我的就异常了──带 CTDE的 MARL training是原则性的修复方式;

### 本课不涵盖什么

训练真实网络是Phase 09 的主题──本课构建脚本政策 版本,在没有梯度更新的情况下演示CTDE、值分解和集中值模式──目标是你使用完整的MARL库──(PyMARL、MARLlib、RLlib multi-agent) 之前,先内化这些模式──


```figure
sw-ctde
```

## - Je le construis.

`code/main.py`Dans un très petit monde de réseaux coopératifs de 2 agents, trois modèles ont été démontrés:

- Environnement: 2 agents sur la grille 4x4 en haut, une pellette de récompense. Récompense = Si un agent arrive à la pellette, c'est pour 1 agent.
- `IndependentAgents` Chaque agent, chaque autre agent, chaque environnement.
- `MADDPGStyle` critique centralisée 计算 valeur commune; politique des acteurs 从中更新;; amélioration de la politique écrite。
- `QMIXStyle` Utilisation de la décomposition de la valeur du mélangeur monotone.
- `MAPPOStyle` fonction de valeur centralisée; politique basée sur la base partagée 更新。

Les résultats de la recherche ont été obtenus en moyenne en moyenne par rapport à la variante CTDE.

运行:

```
python3 code/main.py
```

预期输出: agents indépendants 平均需要 ~6 步; CTDE variant 会收到 ~3.5 步(4x4 grid 的最佳是 3)──

## Utilisez-le

`outputs/skill-marl-picker.md`C'est une compétence utilisée pour déterminer la tâche multi-agent  sélectionner l'algorithme MARL: coopératif vs compétitif  homogène vs hétérogène  type d'espace d'action  échelle  signal de récompense 

## Je le livre.

MARL en production 很少见──当你确实使用它时:

- **从 MAPPO 开始。**Le thème de l'année 2022 sera établi comme une référence; il pourra être repris dans les semaines à venir pour poursuivre les méthodes plus fantaisistes.
- **记录每个 agent 的 observation 和 action stream。**Pas de trace de l'agent, débogage du MARL.
- **分离 training code 和 execution code。**CTDE est une discipline; laissez-vous entraîner par la voie de l'exécution.`o_i`Il y a une autre.
- **Reward shaping 警告。**MARL à la conception de récompenses 极其敏感──forming 中一个协调 bug,agent 就会学会利用它──运行对抗性测试──
- **对于 LLM agents**, une priorité est accordée aux politiques de niveau rapide. Seulement lorsque les données d'interaction + signal de récompense + infrastructure sont disponibles, il est possible de se lancer dans la formation MARL.

## 练习

1. 运行  référencement`code/main.py`◊ la différence entre les agents indépendants de la mesure et les agents de type MAPPO  étapes vers les objectifs ◊ dans la grille 6x6, cette différence va-t-elle être plus grande ou plus petite ?
2. ¢ réaliser une variante concurrentielle: deux agents, une pelle, seul le premier agent qui arrive ¢ obtenir une récompense¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
3. 阅读 MADDPG (arXiv:1706.02275) Section 3──用你自己的话,以伪代码形式象征性实现确切的批评更新规则──
4. Pourquoi les auteurs considèrent-ils la valeur centralisée + PPO dans leur benchmark ?
5. Pour utiliser le CTDE comme modèle de conception, il est utilisé dans un faux système d'agent LLM (par exemple, agent de recherche + résumé + codeur).

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| MARL | "Multi-Agent RL" | 面向 multi-agent 系统的 Reinforcement Learning。 |
| CTDE | "Centralized Training, Decentralized Execution" | 用 global info 训练；用 local policies 部署。 |
| MADDPG | "Multi-Agent DDPG" | CTDE，每个 agent 的 critic 能看到所有 observations + actions。 |
| QMIX | "Value decomposition" | 每个 agent 的 Q 的 monotonic mixing。Cooperative。 |
| MAPPO | "Multi-Agent PPO" | 带 centralized value function 的 PPO。2026 年默认 baseline。 |
| Value decomposition | "Sum of individual Qs" | Joint Q 表示为每个 agent 的 Q 的 monotone function。 |
| Non-stationarity | "Moving targets" | 当其他 agent 学习时，每个 agent 的 env 都在变化。MARL 的核心问题。 |
| On-policy / off-policy | "Learn from current / replay" | PPO 是 on-policy (MAPPO)；DDPG 和 Q-learning 是 off-policy。 |
| SMAC | "StarCraft Multi-Agent Challenge" | cooperative micromanagement benchmark；QMIX 的本土主场。 |

## 延伸阅读

- [Lowe et al. — Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments](https://arxiv.org/abs/1706.02275) MADDPG;NeurIPS 2017
- [Rashid et al. — QMIX: Monotonic Value Function Factorisation for Deep Multi-Agent Reinforcement Learning](https://arxiv.org/abs/1803.11485) QMIX;ICML 2018
- [Yu et al. — The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games](https://arxiv.org/abs/2103.01955) MAPPO;NeurIPS 2022
- [BAIR blog post on MAPPO](https://bair.berkeley.edu/blog/2021/07/14/mappo/) à l'encadrement facile à lire des résultats de la carte
- [SMAC repository](https://github.com/oxwhirl/smac) Défi multi-agents StarCraft
