# Acteur-critique  A2C et A3C

> RENFORCE  Très bruyant。添加一个学习 `V̂(s)`Le critiste, en le retranchant, vous obtenez une attente similaire mais avec une variance beaucoup plus faible. C'est le critiste-acteur.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (TD Learning), Phase 9 · 06 (REINFORCE)
**Time:** ~75 分钟

##  problématique

La vanille peut travailler, mais sa variance est très mauvaise. Monte Carlo revient.`G_t`Il y a peut-être 10 fois plus de fluctuations entre les différents épisodes.`∇ log π`En moyenne, il sera produit un estimateur de degré, il faudra des milliers d'épisodes pour faire avancer la politique en utilisant beaucoup moins de mises à jour de DQN pour atteindre la distance.

La variance de l'utilisation des rendements bruts. Si vous déduisez une ligne de base `b(s_t)`: fonction de tout état, y compris la valeur apprise, l'attente 保持不变, tandis que la variance 会下降── la meilleure ligne de base traitable est `V̂(s_t)`Je suis en train de le faire.`∇ log π`La quantité est le *avantage*:

`A(s, a) = G - V̂(s)`

Si une action  produit un rendement plus élevé que la moyenne, c'est bon; si c'est moins moyen, c'est moins. Avec la RENFORCE de la critique apprise, c'est *acteur-critique*―critique  donner à un acteur un professeur de variance faible―c'est ainsi que chaque méthode de politique profonde de l'année 2015 après A2C、A3C、PPO、SAC、IMPALA)―

## 概念

![Actor-critic: policy net plus value net, TD residual as advantage](../assets/actor-critic.svg)

**两个 networks，一个 shared loss：**

- **Actor** `π_θ(a | s)`Le programme de formation est un programme de formation de la politique.
- **Critic** `V_φ(s)`: estimation du rendement attendu de l'émission de l'État `(V_φ(s) - target)²`- Je suis en train de faire des exercices.

**Advantage。**两种标准形式:

- *Avantage du MC*`A_t = G_t - V_φ(s_t)`Il est impartial, différent.
- *Avantages du TD*`A_t = r_{t+1} + γ V_φ(s_{t+1}) - V_φ(s_t)`◊biased(utilisation `V_φ`),variance 低得多──也叫 *TD résiduel* `δ_t`Il y a une autre.

**n-step advantage。**Entre les deux, la valeur de l'intervalle:

`A_t^{(n)} = r_{t+1} + γ r_{t+2} + … + γ^{n-1} r_{t+n} + γ^n V_φ(s_{t+n}) - V_φ(s_t)`

`n = 1`C'est une pure TD.`n = ∞`La plupart des applications sont utilisées par Atari.`n = 5`, en utilisant le PPO de MuJoCo `n = 2048`Il y a une autre.

**Generalized Advantage Estimation (GAE)。**Schulman et coll. (2016)  proposent des moyennes pondérées exponentielles pour tous les avantages de n-étape:

`A_t^{GAE} = Σ_{l=0}^{∞} (γλ)^l δ_{t+l}`

Parmi eux `λ ∈ [0, 1]`Il y a une autre.`λ = 0`Oui, la variance est faible, le biais est élevé.`λ = 1`C'est le cas de la société de l'information.`λ = 0.95`C'est la valeur par défaut de 2026: continue à régler jusqu'à ce que le dial de biais/variance atteigne la position que vous voulez.

**A2C：synchronous advantage actor-critic。**Dans le`N`个 environnements parallèles 上收集 `T`Les étapes sont les plus simples et les plus évolutives.

**A3C：asynchronous advantage actor-critic。**Mnih et coll. (2016)。initiation `N`个 worker threads, chaque thread 运行一个 env. 个工人在自己的 déploiement 上本地计算梯度, puis asynchronously 应用到共享参数服务器──不需要重复缓冲:workers 通过运行不同轨迹来去解调──A3C 证明你能在CPU上规模培训──到2026年,GPU-based A2C(batched parallel envs)占主导,因为GPUs 需要大批量──

**Combined loss。**

`L(θ, φ) = -E[ A_t · log π_θ(a_t | s_t) ]  +  c_v · E[(V_φ(s_t) - G_t)²]  -  c_e · E[H(π_θ(·|s_t))]`

3 éléments: perte de la politique-gradient, régression de la valeur, bonus entropie`c_v ~ 0.5`- Je suis là.`c_e ~ 0.01`C'est un point de départ canonique.


```figure
actor-critic
```

## Faites-le

### Étape 1: un critique

Le critique linéaire `V_φ(s) = w · features(s)`Utilisation de l' émission 更新:

```python
def critic_update(w, x, target, lr):
    v_hat = dot(w, x)
    err = target - v_hat
    for j in range(len(w)):
        w[j] += lr * err * x[j]
    return v_hat
```

Dans l'environnement tablaire, les critiques se sont retrouvés dans plusieurs centaines d'épisodes.

### Étape 2: avantage de n-étape

给定长度为 `T`Le déploiement et le démarrage final `V(s_T)`- Le numéro de la liste:

```python
def compute_advantages(rewards, values, gamma=0.99, lam=0.95, last_value=0.0):
    advantages = [0.0] * len(rewards)
    gae = 0.0
    for t in reversed(range(len(rewards))):
        next_v = values[t + 1] if t + 1 < len(values) else last_value
        delta = rewards[t] + gamma * next_v - values[t]
        gae = delta + gamma * lam * gae
        advantages[t] = gae
    returns = [a + v for a, v in zip(advantages, values)]
    return advantages, returns
```

`returns`C'est une cible critique.`advantages`Oui, c'est le cas.`∇ log π`Le contenu de la page

### Étape 3: mise à jour combinée

```python
for step_i, (x, a, _r, probs) in enumerate(traj):
    adv = advantages[step_i]
    target_v = returns[step_i]

    # critic
    critic_update(w, x, target_v, lr_v)

    # actor
    for i in range(N_ACTIONS):
        grad_logpi = (1.0 if i == a else 0.0) - probs[i]
        for j in range(N_FEAT):
            theta[i][j] += lr_a * adv * grad_logpi * x[j]
```

Sur la politique, chaque mise à jour, un déploiement, acteur et critique utilisez des taux d'apprentissage différents.

### Étape 4: parallélisation (A3C contre A2C)

- **A3C：** lancement `N`个线程──每个线程──运行自己的 env 和自己的前进通行──周期性地把 Gradient updates 推送到共享主──master 上不加锁:races 没关系,它们只是增加噪声──
- **A2C：**Dans un processus unique`N`个 env instances, mettre des observations en pile 成 `[N, obs_dim]`Les résultats de l'enquête ont été obtenus en 2026 par le gouvernement de l'État de l'Union européenne.

Notre code de jouets est simple, il suffit de trois lignes de numpy.

## Les pièges

- **Critic bias before actor gradient。**Si le critique est aléatoire, il n'y a pas de quantité d'information, alors que vous êtes en train de faire du bruit pur.
- **Advantage normalization。**Dans chaque lot, les avantages se normalisent à zéro moyenne/unité-std.
- **Shared trunk。**Pour les entrées d'image, pour acteur et critique Utilisez l'extracteur de fonctionnalités partagées.
- **On-policy contract。**A2C pour les données précises réutiliser une mise à jour.
- **Entropy collapse。**Il n' y a pas de`c_e > 0`La politique sera mise à jour à plusieurs centaines de fois et sera plus déterministe.
- **Reward scale。**Les magnitudes d'avantage dépendent de l'échelle de récompense. Normalizer les récompenses, par exemple en dehors de la mise en marche, afin de maintenir une cohérence entre les différentes tâches.

## Utilisez-le

A2C/A3C en 2026 est rarement la sélection finale, mais elles sont la base de tous les raffinements architecturaux ultérieurs:

| Method | Relation to A2C |
|--------|----------------|
| PPO | A2C + clipped importance ratio for multi-epoch updates |
| IMPALA | A3C + V-trace off-policy correction |
| SAC (Phase 9 · 07) | Off-policy A2C with a soft-value critic (next lesson) |
| GRPO (Phase 9 · 12) | A2C without the critic — group-relative advantage |
| DPO | A2C collapsed into a preference-ranking loss, no sampling |
| AlphaStar / OpenAI Five | A2C with league training + imitation pre-training |

Si vous voyez un avantage dans un journal de 2026, pensez à un critique d'acteur.

## La faire partir

保存为 `outputs/skill-actor-critic-trainer.md`- Le numéro de la liste:

```markdown
---
name: actor-critic-trainer
description: 为给定 environment 生成 A2C / A3C / GAE configuration，并指定 advantage estimation 和 loss weights。
version: 1.0.0
phase: 9
lesson: 7
tags: [rl, actor-critic, gae]
---

给定一个 environment 和 compute budget，输出：

1. Parallelism。A2C（GPU batched）vs A3C（CPU async）以及 workers 数量。
2. Rollout length T。每个 env 每次 update 的 steps。
3. Advantage estimator。n-step 或 GAE(λ)；指定 λ。
4. Loss weights。`c_v`（value）、`c_e`（entropy）、gradient clip。
5. Learning rates。Actor 和 critic（如果使用则分开）。

拒绝在 horizon > 1000 的 environments 上使用 single-worker A2C（太 on-policy，太慢）。拒绝在没有 advantage normalization 的情况下交付。把任何 `c_e = 0` 且 observed entropy < 0.1 的 run 标记为 entropy-collapsed。
```

## Exercices

1. **Easy。**Dans le 4×4 GridWorld 上 utiliser MC avantage(`G_t - V(s_t)`) entraînement de l'efficacité de l'échantillon de l'acteur-critique.
2. **Medium。**切换到 TD-résiduel avantage`r + γ V(s') - V(s)`)― La variance des lots de mesure des avantages― elle a diminué combien?
3. **Hard。**实现 GAE(λ)。扫描 `λ ∈ {0, 0.5, 0.9, 0.95, 1.0}`◊ dessiner le retour final par rapport à l'efficacité de l'échantillon.

## Les termes clés

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Actor | “Policy net” | `π_θ(a\|s)`，由 policy gradient 更新。 |
| Critic | “Value net” | `V_φ(s)`，通过对 returns / TD targets 做 MSE regression 更新。 |
| Advantage | “比平均好多少” | `A(s, a) = Q(s, a) - V(s)` 或它的 estimators。`∇ log π` 的 multiplier。 |
| TD residual | “δ” | `δ_t = r + γ V(s') - V(s)`；one-step advantage estimate。 |
| GAE | “插值旋钮” | n-step advantages 的 exponentially weighted sum，由 `λ` parameterized。 |
| A2C | “Synchronous actor-critic” | 跨 envs batching；每个 rollout 做一次 Gradient step。 |
| A3C | “Async actor-critic” | Worker threads 把 gradients 推送到 shared param server。Original paper；2026 年较少见。 |
| Bootstrap | “在 horizon 使用 V” | 截断 rollout，添加 `γ^n V(s_{t+n})` 来闭合求和。 |

## Pour en savoir plus

- [Mnih et al. (2016). Asynchronous Methods for Deep Reinforcement Learning](https://arxiv.org/abs/1602.01783) A3C, le premier papier critique acteur-critique asynchrone
- [Schulman et al. (2016). High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438) GAE。
- [Sutton & Barto (2018). Ch. 13 — Actor-Critic Methods](http://incompleteideas.net/book/RLbook2020.pdf) fondations; lorsque le critique est le réseau neural 时,把它和 Ch. 9 approximation de fonction 配套阅读。
- [Espeholt et al. (2018). IMPALA](https://arxiv.org/abs/1802.01561) critique distribuée d'acteurs évolutifs avec correction hors politique de V-trace。
- [OpenAI Baselines / Stable-Baselines3](https://stable-baselines3.readthedocs.io/) 值得阅读的生产A2C/PPO des mises en œuvre 
- [Konda & Tsitsiklis (2000). Actor-Critic Algorithms](https://papers.nips.cc/paper/1786-actor-critic-algorithms) résultat de convergence fondamentale de la décomposition acteur-critique à deux échelles 
