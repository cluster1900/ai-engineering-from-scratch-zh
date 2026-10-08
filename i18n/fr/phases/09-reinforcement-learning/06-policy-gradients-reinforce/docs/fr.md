# Politique Gradient  de zéro réalisation de REINFORCE

> 停止估值值──直接参数化政策,计算预期回报的渐进,然后沿上坡方向更新──Williams (1992) utilise un théorème 写清了它──这也是PPO、GRPO以及每个LLM RL loop 存在的原因──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 03 (Monte Carlo), Phase 9 · 04 (TD Learning)
**Time:** ~75 分钟

##  problématique

Q-apprentissage 和 DQN paramétriser de la est *value* fonction──你通过 `argmax Q`选择行动――这对离散行动 和离散状态 没有问题――但当行动是连续时就会失效`argmax`?), ou quand vous voulez une politique stochastique, ça va aussi échouer.`argmax`La construction est déterministe.

Les gradients de politique 改为 paramétrent *politique*。`π_θ(a | s)`Il s'agit d'un réseau neural, de l'action de sortie, de la distribution de l'action.`θ`Il n'y a pas de changement de direction.`argmax`Il n'y a pas de récursion Bellman.`J(θ) = E_{π_θ}[G]`Faites une ascension gradiente.

Le théorème de la force (Williams 1992)  vous dire ce gradient est calculable:`∇J(θ) = E_π[ G · ∇_θ log π_θ(a | s) ]`◊运行一个节目――计算回来――把每一步的 ◊`∇ log π_θ(a | s)`乘以 return──取平均──做 Gradient-ascent──完成──

Chaque algorithme LLM-RL:PPO、DPO、GRPO, de 2026 ans, est un raffinement de REINFORCE, il est une condition préalable de la phase 10 · 07 (implémentation du RLHF) et de la phase 10 · 08 (DPO).

## 概念

![Policy gradient: softmax policy, log-π gradient, return-weighted update](../assets/policy-gradient.svg)

**Policy gradient theorem。**Pour tout`θ`politique paramétrisée `π_θ`- Le numéro de la liste:

`∇J(θ) = E_{τ ~ π_θ}[ Σ_{t=0}^{T} G_t · ∇_θ log π_θ(a_t | s_t) ]`

Parmi eux `G_t = Σ_{k=t}^{T} γ^{k-t} r_{k+1}`C' est de l' étape.`t`Retour à la prime de départ:`π_θ`Les trajectories complètes de l'échantillon `τ`Ce que vous avez obtenu.

**证明很短。**Dans l' attente,`J(θ) = Σ_τ P(τ; θ) G(τ)`求导──使用 `∇P(τ; θ) = P(τ; θ) ∇ log P(τ; θ)`(truc de dérivé de log)`log P(τ; θ) = Σ log π_θ(a_t | s_t) + environment terms that do not depend on θ`Les termes environnementaux disparaissent.

**Variance reduction 技巧。**La variance de la vanille est très élevée.`∇ log π`Il y a beaucoup de bruit, et la quantité est très bruyante.

1. **Baseline subtraction。**À l' indépendance`a_t``b(s_t)`Je suis là .`G_t`替换成 `G_t - b(s_t)`Il est impartial, parce que`E[b(s_t) · ∇ log π(a_t | s_t)] = 0`◊ typical choix: par le critique `b(s_t) = V̂(s_t)`→ acteur-critique (leçon 07)
2. **Reward-to-go。**Je ne sais pas .`Σ_t G_t · ∇ log π_θ(a_t | s_t)`替换成 `Σ_t G_t^{from t} · ∇ log π_θ(a_t | s_t)` Pour une action déterminée, seulement les retours futurs 相关, les récompenses passées ▌ contribueront à un bruit nul-ménior 

Je suis en train de faire ça.

`∇J ≈ (1/N) Σ_{i=1}^{N} Σ_{t=0}^{T_i} [ G_t^{(i)} - V̂(s_t^{(i)}) ] · ∇_θ log π_θ(a_t^{(i)} | s_t^{(i)})`

C'est le RENFORCE de la ligne de base, et aussi l'ancêtre direct de l'A2C (leçon 07) et du PPO (leçon 08).

**Softmax policy parameterization。**Pour les actions discrètes, le standard de sélection est:

`π_θ(a | s) = exp(f_θ(s, a)) / Σ_{a'} exp(f_θ(s, a'))`

Parmi eux `f_θ`Il y a un réseau neural pour chaque action.

`∇_θ log π_θ(a | s) = ∇_θ f_θ(s, a) - Σ_{a'} π_θ(a' | s) ∇_θ f_θ(s, a')`

C'est le score de l'action prise en diminuant la valeur attendue en politique.

**用于 continuous actions 的 Gaussian policy。** `π_θ(a | s) = N(μ_θ(s), σ_θ(s))`Il y a une autre.`∇ log N(a; μ, σ)`Il y a une forme fermée. C'est tout ce dont le SAC a besoin pour la phase 9 · 07 .


```figure
policy-gradient-landscape
```

## Faites-le

### Étape 1: réseau de politique softmax

```python
def policy_logits(theta, state_features):
    return [dot(theta[a], state_features) for a in range(N_ACTIONS)]

def softmax(logits):
    m = max(logits)
    exps = [exp(l - m) for l in logits]
    Z = sum(exps)
    return [e / Z for e in exps]
```

Pour l'environnement tabulaire Utilisez une politique linéaire (pour chaque action un vecteur de poids)

### Étape 2: prélèvement d'échantillons et probabilité de stockage

```python
def sample_action(probs, rng):
    x = rng.random()
    cum = 0
    for a, p in enumerate(probs):
        cum += p
        if x <= cum:
            return a
    return len(probs) - 1

def log_prob(probs, a):
    return log(probs[a] + 1e-12)
```

### Étape 3: déploiement avec des sondes de journaux capturées

```python
def rollout(theta, env, rng, gamma):
    trajectory = []
    s = env.reset()
    while not done:
        logits = policy_logits(theta, s)
        probs = softmax(logits)
        a = sample_action(probs, rng)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r, probs))
        s = s_next
    return trajectory
```

### Étape 4: Mise à jour de REINFORCE

```python
def reinforce_step(theta, trajectory, gamma, lr, baseline=0.0):
    returns = compute_returns(trajectory, gamma)
    for (s, a, _, probs), G in zip(trajectory, returns):
        advantage = G - baseline
        grad_log_pi_a = [-p for p in probs]
        grad_log_pi_a[a] += 1.0
        for i in range(N_ACTIONS):
            for j in range(len(s)):
                theta[i][j] += lr * advantage * grad_log_pi_a[i] * s[j]
```

Gradient `∇ log π(a|s) = e_a - π(·|s)`(le secteur de l'énergie)`a`Le système de calcul de la probabilité de réduction de la chaleur est au cœur des gradients de la politique de softmax.

### Étape 5: lignes de base

Pour les épisodes récents `G`取 running mean, déjà assez pour faire 4×4 GridWorld  run up; environ 500 épisodes 收──把 baseline 升级为学习 `V̂(s)`On a un critique d'acteur.

## Les pièges

- **Exploding gradients。**Les retours sont très importants.`∇ log π`之前,始终在批内把 `G`normalité à`~N(0, 1)`Il y a une autre.
- **Entropy collapse。**Politique 过早收到近似决定性的的行动,停止探索,然后卡住──修复方式:向目标 添加 Entropy bonus `β · H(π(·|s))`Il y a une autre.
- **High variance。**La réinforcement de la vanille 需要成千上万集──kritical baseline──Létion 07)
- **Sample inefficiency。**On-policy signifie que chaque transition dans une mise à jour  après  sera abandonnée                                                                                                                                                                                                                                                    
- **Non-stationary gradients。**100 épisodes de la même série que précédemment.`π`C'est la raison pour laquelle les méthodes de mise en œuvre de la politique sont mises à jour.
- **Credit assignment。**没有奖励-to-go 时,过去奖励 会贡献噪声──始终使用奖励-to-go──

## Utilisez-le

En 2026, la force de renversement est rarement directement utilisée, mais son équation de la force de renversement est absente:

| Use case | Derived method |
|----------|---------------|
| Continuous control | PPO / SAC with Gaussian policy |
| LLM RLHF | PPO with KL penalty, running on token-level policy |
| LLM reasoning (DeepSeek) | GRPO — REINFORCE with group-relative baseline, no critic |
| Multi-agent | Centralized-critic REINFORCE (MADDPG, COMA) |
| Discrete action robotics | A2C, A3C, PPO |
| Preference-only settings | DPO — REINFORCE rewritten as a preference-likelihood loss, no sampling |

Quand vous verrez dans le script de formation de 2026`loss = -advantage * log_prob`, là avec la ligne de base de REINFORCE.

## La faire partir

保存为 `outputs/skill-policy-gradient-trainer.md`- Le numéro de la liste:

```markdown
---
name: policy-gradient-trainer
description: 为给定 task 生成 REINFORCE / actor-critic / PPO training config，并诊断 variance 问题。
version: 1.0.0
phase: 9
lesson: 6
tags: [rl, policy-gradient, reinforce]
---

给定一个 environment（discrete / continuous actions、horizon、reward stats），输出：

1. Policy head。Softmax（discrete）或 Gaussian（continuous），并包含 parameter counts。
2. Baseline。None（vanilla）、running mean、learned `V̂(s)`，或 A2C critic。
3. Variance controls。默认启用 reward-to-go、return normalization、gradient clip value。
4. Entropy bonus。Coefficient β 和 decay schedule。
5. Batch size。每次 update 的 episodes 数；on-policy data freshness contract。

拒绝在 horizons > 500 steps 上使用 REINFORCE-no-baseline。拒绝为 continuous-action control 使用 softmax head。把任何 `β = 0` 且 observed policy entropy < 0.1 的 run 标记为 entropy-collapsed。
```

## Exercices

1. **Easy。**Dans le 4×4 GridWorld 上, utilisez une politique de softmax linéaire 实现 REINFORCE──不使用基线, entraînez 1000 épisodes──绘制学习曲线;测量变量(retours de std)──
2. **Medium。**添加运行平均基线――再训练――把样品效率 和差与香运行对比――基线 让收所需步骤 降低了多少?
3. **Hard。**添加 bonus d' entropie `β · H(π)`◊ L'analyse`β ∈ {0, 0.01, 0.1, 1.0}`◊ dessiner le retour final et l'entropie politique.

## Les termes clés

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy gradient | “直接训练 policy” | `∇J(θ) = E[G · ∇ log π_θ(a\|s)]`；由 log-derivative trick 推导而来。 |
| REINFORCE | “最初的 PG algorithm” | Williams (1992)；Monte Carlo returns 乘以 log-policy Gradient。 |
| Log-derivative trick | “Score function estimator” | `∇P(τ;θ) = P(τ;θ) · ∇ log P(τ;θ)`；让 expectations 的 gradients 变得 tractable。 |
| Baseline | “Variance reduction” | 从 `G` 中减去的任意 `b(s)`；是 unbiased 的，因为 `E[b · ∇ log π] = 0`。 |
| Reward-to-go | “只计算未来 returns” | 使用 `G_t^{from t}` 而不是完整的 `G_0`；正确且 variance 更低。 |
| Entropy bonus | “鼓励探索” | `+β · H(π(·\|s))` 项防止 policy collapse。 |
| On-policy | “用你刚看到的数据训练” | Gradient expectation 是相对于当前 policy 的，不能直接复用旧数据。 |
| Advantage | “比平均好多少” | `A(s, a) = G(s, a) - V(s)`；带 baseline 的 REINFORCE 所乘的带符号 quantity。 |

## Pour en savoir plus

- [Williams (1992). Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning](https://link.springer.com/article/10.1007/BF00992696) Le premier papier de renfort
- [Sutton et al. (2000). Policy Gradient Methods for Reinforcement Learning with Function Approximation](https://papers.nips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html) 带 approximation de la fonction  带 théorème moderne de la politique-gradient 
- [Sutton & Barto (2018). Ch. 13 — Policy Gradient Methods](http://incompleteideas.net/book/RLbook2020.pdf) présentation de livres de lecture。
- [OpenAI Spinning Up — VPG / REINFORCE](https://spinningup.openai.com/en/latest/algorithms/vpg.html) 清晰的教学式讲解, contient le code PyTorch.
- [Peters & Schaal (2008). Reinforcement Learning of Motor Skills with Policy Gradients](https://homes.cs.washington.edu/~todorov/courses/amath579/reading/PolicyGradient.pdf) Réduction des variantes, ainsi que la REINFORCE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
