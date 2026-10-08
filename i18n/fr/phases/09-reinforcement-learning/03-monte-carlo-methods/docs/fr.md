# Les méthodes de Monte Carlo  Apprendre des épisodes complets

> La programmation dynamique  nécessite un modèle. À l'exception des épisodes 什么都不需要── la politique de fonctionnement, les retours de l'observation, la moyenne.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming)
**Time:** ~75 minutes

##  problématique

La programmation dynamique est très élégante, mais on suppose que vous pouvez consulter chaque état et action.`P(s' | s, a)`◊ dans le monde réel, il n'y a pratiquement rien qui fonctionne de cette façon. ◊ Les robots ne peuvent pas calculer le couple commun à la suite des pixels de la caméra.

Vous avez besoin d'une méthode qui dépend uniquement de l'environnement.`s_0, a_0, r_1, s_1, a_1, r_2, …, s_T`Il faut en faire une estimation.

Le changement de DP à MC est important dans la philosophie: nous allons de * modèle connu + sauvegarde exacte *                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

## 概念

![Monte Carlo: rollout, compute returns, average; first-visit vs every-visit](../assets/monte-carlo.svg)

**核心思想，一行表达：** `V^π(s) = E_π[G_t | s_t = s] ≈ (1/N) Σ_i G^{(i)}(s)`, parmi lesquels `G^{(i)}(s)`Il est en politique.`π`Suivre `s`后观察到的回报──

**First-visit vs every-visit MC。** donner une plus fréquentation état `s`Les premières visites de MC sont uniquement les suivantes: chaque visite de MC est une visite totale.

**Incremental mean。**Il n'y a pas de réserve de rendements, mais une moyenne de fonctionnement actualisée:

`V_n(s) = V_{n-1}(s) + (1/n) [G_n - V_{n-1}(s)]`

Je suis en train de vous dire:`V_new = V_old + α · (target - V_old)`, parmi lesquels `α = 1/n`- Je suis désolé.`1/n`换成 constant taille de la étape `α ∈ (0, 1)`Tu as un estimateur MC non stationnaire, il suit.`π`Ce mouvement est de MC 跳到TD, à nouveau dans chaque algorithme RL moderne.

**Exploration 现在成了问题。**DP 通过枚举触及每个州──MC 只有看政策 会访问的州──如果`π`C'est déterministe, l'espace d'état, la région entière ne sera jamais échantillonnée, leurs estimations de valeur resteront toujours à zéro.

1. **Exploring starts。**De chaque épisode, vous pouvez pas mettre le robot à l'état souhaité.
2. **ε-greedy。**Comparé à la Q actuelle, il faut prendre des mesures avides, mais avec une probabilité de plus.`ε`选择随机action── toutes les paires d'action d'état sont progressivement échantillonnées──
3. **Off-policy MC。**Dans la politique de comportement `μ`Suivant la collecte de données, par l'échantillonnage d'importance, apprendre la politique cible `π` La variance est élevée, mais c'est le pont vers les méthodes de reprise-buffer DQN et autres.

**Monte Carlo Control。**Évaluer → améliorer → évaluer, comme l'itération de la politique, mais l'évaluation est basée sur l'échantillonnage:

1. 运行  référencement`π`Je suis en train de faire un épisode.
2. Selon les résultats observés  Update `Q(s, a)`Il y a une autre.
3. Je veux dire .`π`Par rapport à`Q`Il est devenu avide.
4. Je vous en prie.

Dans des conditions de température, chaque paire est visité sans limite.`α`Résultat de la réception de l' émission de la série.`Q*`et `π*`Il y a une autre.

## 动手构建

### Étape 1: déploiement → (s, a, r) 列表

```python
def rollout(env, policy, max_steps=200):
    trajectory = []
    s = env.reset()
    for _ in range(max_steps):
        a = policy(s)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r))
        s = s_next
        if done:
            break
    return trajectory
```

Pas de modèle, seulement.`env.reset()`et `env.step(s, a)` Interface et environnement de gym sont similaires, mais élaborés en détail

### Étape 2: 计算 retourne(反向扫)

```python
def returns_from(trajectory, gamma):
    returns = []
    G = 0.0
    for _, _, r in reversed(trajectory):
        G = r + gamma * G
        returns.append(G)
    return list(reversed(returns))
```

Une fois passé,`O(T)` contre la récurrence `G_t = r_{t+1} + γ G_{t+1}`避免了重复求和──

### Étape 3: évaluation du MC lors de la première visite

```python
def mc_policy_evaluation(env, policy, episodes, gamma=0.99):
    V = defaultdict(float)
    counts = defaultdict(int)
    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for t, ((s, _, _), G) in enumerate(zip(trajectory, returns)):
            if s in seen:
                continue
            seen.add(s)
            counts[s] += 1
            V[s] += (G - V[s]) / counts[s]
    return V
```

真正工作的就是三行: première visite 标记状态 为见,增加数,更新运行平均──

### Étape 4: contrôle de la politique du MC

```python
def mc_control(env, episodes, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    counts = defaultdict(lambda: {a: 0 for a in ACTIONS})

    def policy(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for (s, a, _), G in zip(trajectory, returns):
            if (s, a) in seen:
                continue
            seen.add((s, a))
            counts[s][a] += 1
            Q[s][a] += (G - Q[s][a]) / counts[s][a]
    return Q, policy
```

### Étape 5: Comparativement au standard d'or DP

Quand les épisodes → ∞ 时, tu es contre `V^π`En pratique, la mise en service de 50 000 épisodes de 4×4 GridWorld peut atteindre une différence de 50 000 épisodes avec la réponse de DP.`~0.1`Dans la mesure où vous le savez.

## 常见陷

- **Infinite episodes。**MC                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `max_steps`La limite est atteinte, et le taux d'échec est atteint. Avec une politique aléatoire, le temps de retrait est normal, à condition de s'assurer que vous faites le bon calcul.
- **Variance。**MC utilise des retours complets. Dans les épisodes longs, la variance est grande, la dernière fois que la récompense est tombée, elle sera la même.`V(s_0)`Les méthodes de TD (leçon 04) par le démarrage
- **State coverage。**Dans le nouveau Q, je fais des MC avides, si des liens apparaissent, je vais essayer une action.
- **Non-stationary policies。**Si `π`发生变化(如 MC control 中那样), l'ancien retour provient d'une politique différente.
- **Off-policy importance sampling。**权重  référencement`π(a|s)/μ(a|s)`Réalisation de la trajectoire 连乘──Variance 会随地视野 爆炸──用 per-decision pondéré IS 截断,或切换到 TD──


```figure
epsilon-greedy
```

## Utilisez-le

Les méthodes de Monte Carlo dans le rôle de 2026:

| Use case | Why MC |
|----------|--------|
| Short-horizon games（blackjack、poker） | Episodes 自然 terminate；returns 清晰。 |
| Logged policy 的 offline evaluation | 对 stored trajectories 的 discounted returns 求平均。 |
| Monte Carlo Tree Search（AlphaZero） | 从 tree leaves 发起的 MC rollouts 指导 selection。 |
| LLM RL evaluation | 为给定 policy 计算 sampled completions 的 average reward。 |
| PPO 中的 baseline estimation | Advantage target `A_t = G_t - V(s_t)` 使用 MC `G_t`。 |
| RL 教学 | 最简单且真正有效的 algorithm；去掉 bootstrapping 就能看到核心。 |

Les algorithmes modernes de profondeur de la RL (PPO ̊SAC) seront approuvés`n`-répertoires de pas ou GAE, entre les MC pures et les TD pures (répertoires complètes) et les TD pures (répertoires de démarrage à un pas)

## Je le livre.

保存为 `outputs/skill-mc-evaluator.md`- Le numéro de la liste:

```markdown
---
name: mc-evaluator
description: 通过 Monte Carlo rollouts 评估 policy，并在可用时生成带有 DP-comparison 的 convergence report。
version: 1.0.0
phase: 9
lesson: 3
tags: [rl, monte-carlo, evaluation]
---

给定一个 environment（episodic，带 reset+step API）和一个 policy，输出：

1. 方法。First-visit vs every-visit MC。理由。
2. Episode budget。目标数量、variance diagnostic、预期 standard error。
3. Exploration plan。ε schedule（如需要）或 exploring starts。
4. Gold-standard comparison。如果是 tabular，则给出 DP-optimal V*；否则给出来自 Q-learning / PPO baseline 的 bound。
5. Termination check。Max-step cap、timeouts、non-terminating trajectories 的处理。

没有 finite horizon cap 时，拒绝在 non-episodic tasks 上运行 MC。对于 tabular tasks，如果每个 state 少于 100 个 episodes，拒绝报告 V^π estimates。将任何具有 zero-variance actions 的 policy 标记为 exploration risk。
```

## 练习

1. **Easy.**实现 4×4 GridWorld 上 uniform-random policy 首次访问MC évaluation──运行 10,000 épisodes──将 `V(0,0)`随剧数 变化的曲线与 DP 答案对照绘制──
2. **Medium.**- Je veux le faire .`ε ∈ {0.01, 0.1, 0.3}`实现 ε-greedy MC control──比较20 000 épisodes 后的平均回报──曲线看起来是什么样子?
3. **Hard.**Utilisation de l'échantillonnage d'importance  réalisation de la politique extérieure  MC: dans une politique uniforme et aléatoire `μ`La collecte de données, l'estimation déterministe de la politique optimale `π``V^π`◊ Comparer la simple IS 、par décision IS 和 pondéré IS ⋅ Quelle est la variance la plus basse ?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Monte Carlo | “Random sampling” | 通过对来自分布的 iid samples 求平均来估计 expectations。 |
| Return `G_t` | “Future reward” | 从 step `t` 到 episode 结束的 discounted rewards 总和：`Σ_{k≥0} γ^k r_{t+k+1}`。 |
| First-visit MC | “Count each state once” | 一个 episode 中只有第一次访问会贡献到 value estimate。 |
| Every-visit MC | “Use all visits” | 每次访问都会贡献；略有 biased，但 sample-efficient 更高。 |
| ε-greedy | “Exploration noise” | 以概率 `1-ε` 选择 greedy action；以概率 `ε` 选择 random action。 |
| Importance sampling | “Correcting for sampling from the wrong distribution” | 通过 `π(a\|s)/μ(a\|s)` 乘积对 returns 重新加权，从 `μ` 数据估计 `V^π`。 |
| On-policy | “Learn from my own data” | Target policy = behavior policy。Vanilla MC、PPO、SARSA。 |
| Off-policy | “Learn from someone else's data” | Target policy ≠ behavior policy。Importance-sampled MC、Q-learning、DQN。 |

## 延伸阅读

- [Sutton & Barto (2018). Ch. 5 — Monte Carlo Methods](http://incompleteideas.net/book/RLbook2020.pdf) 经典处理。
- [Singh & Sutton (1996). Reinforcement Learning with Replacing Eligibility Traces](https://link.springer.com/article/10.1007/BF00114726) analyse de la première visite par rapport à chaque visite 
- [Precup, Sutton, Singh (2000). Eligibility Traces for Off-Policy Policy Evaluation](http://incompleteideas.net/papers/PSS-00.pdf) contrôle des variantes de la politique MC 和
- [Mahmood et al. (2014). Weighted Importance Sampling for Off-Policy Learning](https://arxiv.org/abs/1404.6362) 现代 estimateurs IS à faible variance
- [Tesauro (1995). TD-Gammon, A Self-Teaching Backgammon Program](https://dl.acm.org/doi/10.1145/203330.203343) MC/TD Self-Play 收到超人玩的首个大规模实证展示; est également le précurseur du concept de la dernière partie de la phase de chaque partie de la classe.
