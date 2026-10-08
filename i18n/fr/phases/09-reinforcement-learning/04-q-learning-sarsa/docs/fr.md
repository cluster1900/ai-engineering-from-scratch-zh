# Différence temporelle  Q-Learning et SARSA

> Monte Carlo 会一直等到集结.TD 通过bootstrap 下一个价值估计,在每一步后更新.Q-learning est hors politique et préférentiel.SARSA est en politique et préférentiel.

**Type:** Build
**Languages:** Python
**前置要求:**Phase 9 · 01 (MDPs), phase 9 · 02 (programme dynamique), phase 9 · 03 (Monte Carlo)
**Time:** ~75 minutes

##  problématique

Monte Carlo est possible, mais il a deux exigences très élevées. Il faut que les épisodes soient terminés et ne peuvent être mis à jour qu'après le retour final. Si votre épisode a 1000 étapes, MC doit attendre 1000 étapes pour mettre à jour quoi que ce soit.

La programmation dynamique 则相反:零方差的 bootstrapped backups, mais exige un modèle déjà connu。

L'apprentissage de la différence temporelle (TD) 折中了两者──根据单个过渡 `(s, a, r, s')`, construire une cible en une seule étape `r + γ V(s')`, et le mettre`V(s)`Il n'y a pas besoin de modèle, pas besoin d'épisodes complets, parce que dans le RHS, on utilise des approximations.`V`Il introduira des décalages, mais les décalages seront bien inférieurs à ceux du MC et, dès la première étape, il pourra être mis à jour en ligne.

C'est tout le contenu moderne RL ((DQN、A2C、PPO、SAC) dont dépend le point de départ.

## 概念

![Q-learning vs SARSA: off-policy max vs on-policy Q(s', a')](../assets/td.svg)

**用于 V 的 TD(0) update：**

`V(s) ← V(s) + α [r + γ V(s') - V(s)]`

方括号中量是 TD erreur `δ = r + γ V(s') - V(s)`C'est dans le MC.`G_t - V(s_t)`Les besoins en matière de réception`α`Je suis désolé.`Σ α = ∞`- Je suis désolé .`Σ α² < ∞`), et tous les États sont visités illimitées.

**Q-learning。**Une méthode de contrôle de la TD hors politique:

`Q(s, a) ← Q(s, a) + α [r + γ max_{a'} Q(s', a') - Q(s, a)]`

`max`假设从 `s'`开始会遵循 *贪* politique,不管 agent 实际采取什么行动――这种解让Q-learning 在代理 通过 ε-贪 探索时仍然学习`Q*`◊Mnih et al. (2015) va le transformer en Atari 上's profonde Q-apprentissage(Léction 05)。

**SARSA。**Une méthode de démarrage de la politique:

`Q(s, a) ← Q(s, a) + α [r + γ Q(s', a') - Q(s, a)]`

Ce nom vient de tuple .`(s, a, r, s', a')` SARSA Utiliser un agent `a'`, plutôt que cupide `argmax`Il est un peu trop grossier.`π`Pour la réponse`Q^π`; dans la limite`ε → 0`Ça va changer.`Q*`Il y a une autre.

**cliff-walking 的差异。**Dans les tâches classiques de cliff-walking (((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((`ε → 0`En pratique, c'est important: lorsque le déploiement est réellement en cours, le comportement du SARSA sera plus conservé.

**Expected SARSA。**- Je veux le faire .`π`  下的期望值替换 `Q(s', a')`- Le numéro de la liste:

`Q(s, a) ← Q(s, a) + α [r + γ Σ_{a'} π(a'|s') Q(s', a') - Q(s, a)]`

方差低于 SARSA(不对 `a'`Le but est de faire la politique.

**n-step TD 和 TD(λ)。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `n`步再 bootstrap, intègre la valeur entre TD(0) et MC`n=1`Oui, le TD,`n=∞`Il est MC. TD.`(1-λ)λ^{n-1}`Pour tout .`n`求平均── la plupart des profondeurs de RL utilisent entre 3 et 20 `n`Il y a une autre.


```figure
qlearning-gridworld
```

## - Je le construis.

### 步骤 1: SARSA basée sur une politique égoïste

```python
def sarsa(env, episodes, alpha=0.1, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})

    def choose(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        s = env.reset()
        a = choose(s)
        while True:
            s_next, r, done = env.step(s, a)
            a_next = choose(s_next) if not done else None
            target = r + (gamma * Q[s_next][a_next] if not done else 0.0)
            Q[s][a] += alpha * (target - Q[s][a])
            if done:
                break
            s, a = s_next, a_next
    return Q
```

La seule différence entre l'apprentissage de Q et le Q est que c'est le but de la première ligne.

### 步骤 2: Apprendre à faire des choses

```python
def q_learning(env, episodes, alpha=0.1, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    for _ in range(episodes):
        s = env.reset()
        while True:
            a = choose(s, Q, epsilon)
            s_next, r, done = env.step(s, a)
            target = r + (gamma * max(Q[s_next].values()) if not done else 0.0)
            Q[s][a] += alpha * (target - Q[s][a])
            if done:
                break
            s = s_next
    return Q
```

`max`Le code de la politique est la différence entre la politique et la politique.

### 步骤 3: courbes d'apprentissage

Suivre chaque 100 épisodes du retour moyen. Q-apprentissage en une simple détermination. GridWorld 上收更快.SARSA 在悬崖上更保守.`code/main.py`Le réseau 4×4 World`α=0.1, ε=0.1`Il y a environ 2 000 épisodes, et ils sont presque parfaits.

### 步骤 4: Comparer avec le DP

运行 valeur d'itération(L'enseignement 02) obtenir `Q*` Inspection`max_{s,a} |Q_learned(s,a) - Q*(s,a)|`Un agent de TD en forme de tableau dans 4×4 GridWorld, après 10 000 épisodes, il devrait être en train de se faire.`~0.5`Dans le même temps.

## La trappe

- **初始 Q values 很重要。**乐观初始化 负 récompense 任务中 `Q = 0`Il est possible de trouver une solution à cette question.
- **α schedule。**Le nombre de`α`Pour les problèmes de déstabilisation, il est possible de`α_n = 1/n`En théorie, on peut recevoir, mais en pratique, on est trop lent.`α` Fixée `[0.05, 0.3]`,并 surveiller la courbe d'apprentissage。
- **ε schedule。**Depuis le haut de la valeur`ε=1.0`), déclinée à `ε=0.05`"GLIE" (la cupidité dans la limite avec une exploration infinie)
- **Q-learning 中的 max bias。**- Je suis là .`Q`Il y a du bruit,`max`L'opérateur 存在向上偏差──会导致高估;Hasselt's Double Q-learning(L'apprentissage du double Q dans le cours 05
- **非终止 episodes。**TD peut être étudié sans terminal, mais vous devez limiter le nombre de pas, ou correctement traiter le démarrage en haut de la limite.
- **State hashing。**Si les états sont des tupiles/tensors, utilisez la clé de hashable (tuple, pas liste; les floats de quatre cents entrées dans le système de tupiles, pas floats bruts)

## Utilisez-le

Paysage TD de l'année 2026:

| Task | Method | Reason |
|------|--------|--------|
| 小型 tabular environments | Q-learning | 直接学习 optimal policy。 |
| On-policy safety-critical | SARSA / Expected SARSA | 探索期间更保守。 |
| High-dimensional state | DQN (Phase 9 · 05) | 带 replay 和 target net 的 Neural Network Q-function。 |
| Continuous actions | SAC / TD3 (Phase 9 · 07) | 在 Q-network 上做 TD update；policy net 发出 actions。 |
| LLM RL (reward-model-based) | PPO / GRPO (Phase 9 · 08, 12) | 使用通过 GAE 得到的 TD-style advantage 的 actor-critic。 |
| Offline RL | CQL / IQL (Phase 9 · 08) | 带 conservative regularization 的 Q-learning。 |

Vous avez lu dans le 2026 année de travaux, les neuf "RL", sont Q-apprentissage ou SARSA une sorte d'expansion.

## Je le livre.

保存为 `outputs/skill-td-agent.md`- Le numéro de la liste:

```markdown
---
name: td-agent
description: Pick between Q-learning, SARSA, Expected SARSA for a tabular or small-feature RL task.
version: 1.0.0
phase: 9
lesson: 4
tags: [rl, td-learning, q-learning, sarsa]
---

Given a tabular or small-feature environment, output:

1. Algorithm. Q-learning / SARSA / Expected SARSA / n-step variant. One-sentence reason tied to on-policy vs off-policy and variance.
2. Hyperparameters. α, γ, ε, decay schedule.
3. Initialization. Q_0 value (optimistic vs zero) and justification.
4. Convergence diagnostic. Target learning curve, `|Q - Q*|` check if DP is possible.
5. Deployment caveat. How will exploration behave at inference? Is SARSA's conservatism needed?

Refuse to apply tabular TD to state spaces > 10⁶. Refuse to ship a Q-learning agent without a max-bias caveat. Flag any agent trained with ε held at 1.0 throughout (no exploitation phase).
```

## 练习

1. **Easy。**Dans le 4×4 GridWorld 上 réaliser Q-learning 和 SARSA── dessiner 2000 épisodes de courbes d'apprentissage( pour chaque 100 épisodes de retour moyen)──
2. **Medium。**Construire un environnement de marche sur le roc ⋅ 4×12, l'ultime ligne est le roc, la récompense -100 et le réinitialiser jusqu'au point de départ ⋅ Comparer les politiques finales de Q-learning et SARSA ⋅ Cripte montrant leurs propres chemins ⋅ Quel est le plus proche du roc ?
3. **Hard。**实现 Double Q-learning──在 grille de récompense bruyante 上( donne par récompense étape 添加高斯音 σ=5), démontrer Q-learning 会明显高估 `V*(0,0)`, et le double Q-apprentissage ne va pas.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| TD error | "The update signal" | `δ = r + γ V(s') - V(s)`，bootstrapped residual。 |
| TD(0) | "One-step TD" | 每次 transition 后只使用 next state's estimate 进行更新。 |
| Q-learning | "Off-policy RL 101" | 对 next-state actions 使用 `max` 的 TD update；无论 behavior policy 如何，都会学习 `Q*`。 |
| SARSA | "On-policy Q-learning" | 使用实际 next action 的 TD update；为当前 ε-greedy π 学习 `Q^π`。 |
| Expected SARSA | "The low-variance SARSA" | 用 π 下的期望替换采样得到的 `a'`。 |
| GLIE | "Correct exploration schedule" | Greedy in the Limit with Infinite Exploration；Q-learning 收敛所需。 |
| Bootstrapping | "Using current estimate in the target" | 区分 TD 和 MC 的关键。是偏差来源，但能大幅降低方差。 |
| Maximization bias | "Q-learning overestimates" | 对有噪声 estimates 取 `max` 会产生向上偏差；由 Double Q-learning 修复。 |

## 延伸阅读
- [Watkins & Dayan (1992). Q-learning](https://link.springer.com/article/10.1007/BF00992698) Originaires et preuves
- [Sutton & Barto (2018). Ch. 6 — Temporal-Difference Learning](http://incompleteideas.net/book/RLbook2020.pdf) TD(0) 、SARSA、Q-apprentissage、SARSA attendue。
- [Hasselt (2010). Double Q-learning](https://papers.nips.cc/paper_files/paper/2010/hash/091d584fced301b442654dd8c23b3fc9-Abstract.html) Modification de la méthode de préjugé de maximisation
- [Seijen, Hasselt, Whiteson, Wiering (2009). A Theoretical and Empirical Analysis of Expected SARSA](https://ieeexplore.ieee.org/document/4927542) attendu SARSA's motifs:.
- [Rummery & Niranjan (1994). On-line Q-learning using connectionist systems](https://www.researchgate.net/publication/2500611_On-Line_Q-Learning_Using_Connectionist_Systems) 创建SARSA 这个术语的论文((quand il était appelé "l'apprentissage Q-connexion modifié")。
- [Sutton & Barto (2018). Ch. 7 — n-step Bootstrapping](http://incompleteideas.net/book/RLbook2020.pdf) 将 TD(0) 泛化到 TD(n), c'est à partir de Q-learning 走向资格的痕迹, ainsi que par la suite dans le PPO GAE 
