# RL à plusieurs agents

> L'agent unique RL 假设环境是静止的──把两个正在学习的代理 放进同一个世界,这个假设就会失效: chaque agent 作为另一个代理 环境的一部分,而且两者都在变化──多代理 RL 是一组让学习在马科夫假设不再成立时仍能收取技巧──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (Q-learning), Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~45 minutes

##  problématique

Un robot apprend à naviguer dans une pièce, est un seul agent RL 问题── une équipe de football Non ⋅ AlphaStar pour la bataille StarCraft contre les autres Non ⋅ un marché composé d'agents d'appel d'offres Non ⋅ Deux véhicules négocient à travers les routes de stationnement à quatre coins Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né Né

Dans chaque réglage multi-agents, du point de vue d'un agent, les autres agents font partie de l'environnement. Avec leur apprentissage et leur changement de comportement, l'environnement devient non-stationnaire. La propriété de Markov dépend seulement de l'état actuel et mon action sera violée, car l'état suivant dépend également de ce que les autres agents ont choisi, tandis que leurs politiques sont des objectifs en constante évolution.

Ceci va ruiner les preuves de convergence tabulaire (((Q-learning de garantie hypothèse de l'environnement est stationnaire de)  Il va également ruiner naïf profonde RL: les agents 会在循环中相互追逐,永远无法收获到稳定政策──你需要多代理 专用技术:集中训练 /集中执行、反事实基线、联赛游戏、自动游戏──

Les applications de l'année 2026 comprennent: essaims de robots, routage de trafic, flottes de véhicules autonomes, simulateurs de marché, systèmes de gestion de la gestion des risques multi-agents, phase 16), ainsi que les jeux de tout joueur intelligent.

## 概念

![Four MARL regimes: indep, centralized critic, self-play, league](../assets/marl.svg)

**Formalism: Markov Game.**MDP                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `S`、action conjointe `a = (a_1, …, a_n)`、transition `P(s' | s, a)`, ainsi que les récompenses de chaque agent `R_i(s, a, s')` Chaque agent `i`Dans sa propre politique .`π_i`Si les récompenses sont identiques, c'est ça.**fully cooperative**Si c'est une somme nulle, c'est une somme nulle.**adversarial**Si on est mélangé, alors c'est**general-sum**Il y a une autre.

**核心挑战：**

- **Non-stationarity.**De l' agent`i`À l'évidence,`P(s' | s, a_i)`取决于 `π_{-i}`Elle est en train de changer.
- **Credit assignment.**Dans la récompense partagée, quel agent l'a provoqué ?
- **Exploration coordination.**Les agents doivent explorer des stratégies de complément mutuel, plutôt que de répéter la recherche du même État.
- **Scalability.**Espace d'action commun`n`Le nombre de personnes qui ont été
- **Partial observability.**Chaque agent ne peut voir que ses propres observations; l'état mondial est caché.

**四种主导范式：**

**1. Independent Q-learning / independent PPO (IQL, IPPO).**Chaque agent apprend sa propre Q ou politique, met les autres agents dans son environnement.

**2. Centralized training, decentralized execution (CTDE).**Les agents ont leur propre politique.`π_i`, il est basé sur l' observation locale .`o_i`Pour les conditions de la mise en œuvre, il s'agit d'une exécution décentralisée standard.`Q(s, a_1, …, a_n)`Dans le cadre de l'état mondial complet et de l'action commune, les conditions sont:
- **MADDPG**(Lowe et coll. 2017): 带有每个代理 一个集中批评的DDPG──
- **COMA**(Foerster et coll. 2017): base contrefactuelle 问`a'`Je ne peux pas me permettre de faire de la musique.
- **MAPPO**- Je suis là .**IPPO**avec critique partagée (Yu et coll. 2022): 带有集中价值函数的PPO──2026年合作社 MARL 中的主导方法──
- **QMIX**(Rashid et coll. 2018): décomposition de la valeur`Q_tot(s, a) = f(Q_1(s, a_1), …, Q_n(s, a_n))`,并使用 mélange monotone。

**3. Self-play.**Les deux copies d'un agent se battent l'une contre l'autre. La politique de l'autre est la politique de l'AlphaGo / AlphaZero / MuZero.

**4. League play.**L'expansion de l'auto-jeu vers des environnements généraux / adversitaires: conserver un ensemble de politiques du passé et du présent, de la ligue à l'échelle de l'adversaire, et de les cibler pour les entraîner.

**Communication.**允许 les agents  envoyer des messages apprises `m_i` Dans les milieux coopératifs, Foerster et coll. (2016) ont montré que la communication interagente différenciable peut être mise en œuvre de manière continue.


```figure
f3-marl-orbit
```

## - Je le construis.

Cette classe utilise un 6×6 GridWorld, comprenant deux agents coopératifs. Ils doivent commencer par un angle relatif, et atteindre un objectif commun.`-1`Ils sont tous arrivés .`+10`参见 `code/main.py`Il y a une autre.

### 步骤 1: environnement multi-agent

```python
class CoopGridWorld:
    def __init__(self):
        self.size = 6
        self.goal = (5, 5)

    def reset(self):
        return ((0, 0), (5, 0))  # 两个 agents

    def step(self, state, actions):
        a1, a2 = state
        new1 = move(a1, actions[0])
        new2 = move(a2, actions[1])
        done = (new1 == self.goal) and (new2 == self.goal)
        reward = 10.0 if done else -1.0
        return (new1, new2), reward, done
```

* espace d'action communes`|A|² = 16`L'état mondial est à deux positions.

### 步骤 2: apprentissage indépendant de Q

Chaque agent 运行自己的 Q-table,以 joint state 作为关键──每一步:两者都选择 ε-greedy actions, collectant la transition commune,并各自使用共享奖励 更新自己的 Q──

```python
def independent_q(env, episodes, alpha, gamma, epsilon):
    Q1, Q2 = defaultdict(default_q), defaultdict(default_q)
    for _ in range(episodes):
        s = env.reset()
        while not done:
            a1 = epsilon_greedy(Q1, s, epsilon)
            a2 = epsilon_greedy(Q2, s, epsilon)
            s_next, r, done = env.step(s, (a1, a2))
            target1 = r + gamma * max(Q1[s_next].values())
            target2 = r + gamma * max(Q2[s_next].values())
            Q1[s][a1] += alpha * (target1 - Q1[s][a1])
            Q2[s][a2] += alpha * (target2 - Q2[s][a2])
            s = s_next
```

Il est efficace dans cette tâche, car les récompenses sont denses et en jeu. Dans les tâches étroitement liées, il y a des défaillances.

### 步骤3: mise à jour centralisée Q et valeur décomposée

Pour les actions conjointes, utilisez un Q:`Q(s, a_1, a_2)` Avec une récompense partagée 更新──执行时通过边缘化 来分散:`π_i(s) = argmax_{a_i} max_{a_{-i}} Q(s, a_1, a_2)`Il utilise un espace d'action commun de classe index pour échanger une vision globale *correcte*

### 步骤 4: 简单 jeu personnel

Avec un agent, deux rôles.`K`个节目,把 A's weights 复制到 B。对称训练,进展一致── AlphaZero recipe 的缩写版──

## 常见陷

- **Non-stationary replay.**Utiliser des agents indépendants 时,Expérience replay par rapport à un agent unique, pire, car les anciennes transitions sont réalisées par des adversaires déjà passés de temps.
- **Credit assignment ambiguity.**长 后得到共享奖励;没有明确方式说明哪个代理做出贡献──修复:counterfactual baselines(COMA),或按代理做奖励塑造──
- **Policy drift / chasing.**La meilleure réponse de chaque agent est celle de l'agent qui change avec la mise à jour de l'autre agent.
- **Reward hacking via coordination.**Les agents 找到了设计者没有预期到的协调 exploits──Augmentation agents 会收到报价零──修复:谨慎的奖励设计、行为限制──
- **Exploration redundancy.**两个代理 探索相同的状态-action paires──修复: chaque agent Utilise des bonus d'entropie, ou de la condition de rôle──
- **League cycles.**純自遊可能卡在支配周期 中──修复:使用包含多样对手的联赛比赛──
- **Sample explosion.** `n`个 agents × espace d'état × actions conjointes。用 fonction approximation 近似;使用 காரணி action espaces(每个 agent 一个政策输出头)。

## Utilisez-le

2026 années MARL 应用图谱:

| Domain | Method | Notes |
|--------|--------|-------|
| Cooperative navigation / manipulation | MAPPO / QMIX | CTDE；shared critic + decentralized actors。 |
| Two-player games (chess, Go, poker) | Self-play with MCTS (AlphaZero) | Zero-sum；对称训练。 |
| Complex multiplayer (Dota, StarCraft) | League play + imitation pretraining | OpenAI Five, AlphaStar。 |
| Autonomous-vehicle fleets | CTDE MAPPO / PPO with attention | Partial obs；可变 team sizes。 |
| Auction markets | Game-theoretic equilibrium + RL | 当 `n` → ∞ 时使用 mean-field RL。 |
| LLM multi-agent systems (Phase 16) | Natural-language comm + role conditioning | RL loop 位于 agent-planning layer。 |

En 2026, le domaine de la croissance la plus importante de MARL est basé sur le système de LLM: des groupes composés d'agents de modèle de langue négocient, débattent, construisent des logiciels.

## Je le livre.

保存为 `outputs/skill-marl-architect.md`- Le numéro de la liste:

```markdown
---
name: marl-architect
description: 为给定任务选择正确的 multi-agent RL regime（IPPO, CTDE, self-play, league）。
version: 1.0.0
phase: 9
lesson: 10
tags: [rl, multi-agent, marl, self-play]
---

给定一个包含 `n` 个 agents 的任务，输出：

1. Regime classification。Cooperative / adversarial / general-sum。说明理由。
2. Algorithm。IPPO / MAPPO / QMIX / self-play / league。理由要关联 coupling tightness 和 reward structure。
3. Information access。Centralized training（哪些 global info 会进入 critic）？Decentralized execution？
4. Credit assignment。Counterfactual baseline、value decomposition，或 reward shaping。
5. Exploration plan。Per-agent entropy、population-based training，或 league。

在 tightly-coupled cooperative tasks 上拒绝 independent Q-learning。拒绝为存在 cycle risks 的 general-sum 推荐 self-play。标记任何没有 fixed-opponent eval 的 MARL pipeline（cherry-picked self-play numbers 很常见）。
```

## 练习

1. **Easy.**Dans la coopérative à 2 agents GridWorld 上 entraînement indépendant Q-apprentissage.
2. **Medium.** Ajouter une tâche de coordination: seulement lorsque deux agents dans le même cycle se lancent dans un but, est-ce que l'on compte atteindre l'objectif.
3. **Hard.** réaliser un critique centralisé de la formation à la mode MAPPO, et de la coordination des tâches de convergence avec le PPO indépendant 

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Markov game | "Multi-agent MDP" | `(S, A_1, …, A_n, P, R_1, …, R_n)`；每个 agent 都有自己的 reward。 |
| CTDE | "Centralized training, decentralized execution" | Training time 使用 joint critic；每个 agent 的 policy 只使用 local obs。 |
| IPPO | "Independent PPO" | 每个 agent 单独运行 PPO。简单 baseline；经常被低估。 |
| MAPPO | "Multi-agent PPO" | 带有以 global state 为条件的 centralized value function 的 PPO。 |
| QMIX | "Monotonic value decomposition" | `Q_tot = f_monotone(Q_1, …, Q_n)` 允许 decentralized argmax。 |
| COMA | "Counterfactual multi-agent" | Advantage = 我的 Q 减去对我的 action 做 marginalizing 后的 expected Q。 |
| Self-play | "Agent vs past self" | 单个 agent，两个 roles；zero-sum games 的标准方法。 |
| League play | "Population training" | 缓存过去的 policies，从 pool 中采样 opponents；处理 strategy cycles。 |

## 延伸阅读

- [Lowe et al. (2017). Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments (MADDPG)](https://arxiv.org/abs/1706.02275) 带中心化批评的CTDE──
- [Foerster et al. (2017). Counterfactual Multi-Agent Policy Gradients (COMA)](https://arxiv.org/abs/1705.08926) Utilisation des lignes de base contrefactuelles de l'attribution de crédit。
- [Rashid et al. (2018). QMIX: Monotonic Value Function Factorisation](https://arxiv.org/abs/1803.11485) 带 monotonie de la valeur de décomposition.
- [Yu et al. (2022). The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games (MAPPO)](https://arxiv.org/abs/2103.01955)Le PPO pour le MARL
- [Vinyals et al. (2019). Grandmaster level in StarCraft II using multi-agent reinforcement learning (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z) Grand jeu de ligue 
- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270)Jeux à somme nulle.
- [Sutton & Barto (2018). Ch. 15 — Neuroscience & Ch. 17 — Frontiers](http://incompleteideas.net/book/RLbook2020.pdf)  contenant des éléments de formation pour les réglages multi-agents et le problème de non-stationnalité, tandis que CTDE est conçu pour résoudre ce problème.
- [Zhang, Yang & Başar (2021). Multi-Agent Reinforcement Learning: A Selective Overview](https://arxiv.org/abs/1911.10635)  couverture des coopératives, des relations concurrentielles et des relations mixtes, ainsi que des résultats de convergence
