# Programming dynamique  Iteration des politiques et Iteration des valeurs

> La programmation dynamique est la RL de la RL. Vous savez déjà la transition et les fonctions de récompense; vous avez seulement besoin de répétition de l'équation Bellman jusqu'à ce que`V`Ou `π`Il s'agit de chaque méthode basée sur l'échantillonnage qui tente de se rapprocher de la base.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs)
**Time:** ~75 minutes

##  problématique

Vous avez un modèle connu de MDP: vous pouvez sur l' arbitration de l' état-action paire `P(s' | s, a)`et `R(s, a, s')`◊ stock management savoir la demande de distribution ◊ jeu de cartes a des transitions déterminées ◊ GridWorld seulement besoin de quatre lignes Python ◊ vous avez un * modèle *♦

RL sans modèle ((Q-learning、PPO、REINFORCE) est une situation inventée pour le manque de modèle, c'est-à-dire que vous ne pouvez échantillonner que dans l'environnement. Mais quand vous avez réellement un modèle, il y a des méthodes plus rapides et meilleures: la programmation dynamique. Bellman a conçu ces méthodes en 1957 et elles sont toujours définis correctement: quand les gens disent que cette politique optimale du MDP est une politique de retour.

Vous en avez encore besoin en 2026 pour trois raisons. Premièrement, dans la recherche sur le RL, dans chaque environnement tabulaire, vous allez utiliser le DP pour générer une politique de standard d'or. Deuxièmement, des valeurs précises vous permettront de déboguer les méthodes de prélèvement: si l'apprentissage Q est en train de se faire.`V*(s_0)`Les résultats de l'étude de la recherche de la RL sont basés sur des modèles de recherche de la phase 9 et 10 (Tous les modèles de recherche basés sur des modèles de recherche de la phase 9 et 10 sont apprises ou utilisées pour la période précédente).

## 概念

![Policy iteration and value iteration, side by side](../assets/dp.svg)

**两个算法，都是 Bellman 上的 fixed-point iteration。**

**Policy iteration。**交替执行两步,直到政策不再变──

1. *Évaluation:* 给定 politique `π`, Répondre à l'application`V(s) ← Σ_a π(a|s) Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`, jusqu'à ce que vous receviez, afin de calculer`V^π`Il y a une autre.
2. * Amélioration:* 给定 `V^π`Je vous en prie .`π`Par rapport à`V^π`变为 avide:`π(s) ← argmax_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`Il y a une autre.

Il y a une garantie, parce que chaque étape d'amélioration doit être maintenue.`π`Il faut donc améliorer de façon stricte certains états.`V^π`, b) L'espace des politiques déterministes est limité. Même dans les grands espaces d'état, il se produit généralement à environ 520 fois des itérations extérieures.

**Value iteration。**L'évaluation et l'amélioration seront réalisées en une seule fois. Appliquer l'équation Bellman *optimalité*:

`V(s) ← max_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`

Je vais vous dire:`max_s |V_{new}(s) - V(s)| < ε`◊ enfin, en choisissant une action avide 提取政策── chaque fois, il y a une série d'itérations 严格更快, car il n'y a pas de boucle d'évaluation interne, mais il faut généralement plus d'itérations 才能收──

**Generalized policy iteration (GPI)。**统一视角──Value fonction 和 policy sont bloqués dans un cycle d'amélioration à deux sens; tout en même temps, les deux sont encouragés à un processus cohérent avec les autres méthodes:

**为什么 `γ < 1` 很重要。**L' opérateur Bellman est en sup-norme .`γ`- contraction:`||T V - T V'||_∞ ≤ γ ||V - V'||_∞`◊ Contraction signifie le seul point fixe 和几何收──`γ < 1`Vous avez perdu la garantie, vous avez besoin d'un horizon fini ou d'un état terminal absorbant.

## 动手构建

### Étape 1: 构建 GridWorld modèle MDP

Utiliser la même leçon 01 dans le même 4×4 GridWorld...`0.1`Le taux de probabilité de glissement est de direction verticale.

```python
SLIP = 0.1

def transitions(state, action):
    if state == TERMINAL:
        return [(state, 0.0, 1.0)]
    outcomes = []
    for direction, prob in action_probs(action):
        outcomes.append((apply_move(state, direction), -1.0, prob))
    return outcomes
```

`transitions(s, a)`Retour`(s', r, p)`C'est le modèle tout entier.

### Étape 2: évaluation des politiques

 donner une politique`π(s) = {action: prob}`, 代 Bellman équation, jusqu'à `V`Il est également utilisé pour la fabrication de produits de haute qualité.

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = sum(pi_a * sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a))
                   for a, pi_a in policy(s).items())
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

### Étape 3: Amélioration des politiques

Avec le rapport`V`La politique avide est en train de changer.`π`Si vous êtes un homme`π`Il n'y a pas de changement, on revient, parce que nous avons atteint l'optimisme.

```python
def policy_improvement(V, gamma=0.99):
    new_policy = {}
    for s in states():
        best_a = max(
            ACTIONS,
            key=lambda a: sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a)),
        )
        new_policy[s] = best_a
    return new_policy
```

### Étape 4: Rassemblez-vous

```python
def policy_iteration(gamma=0.99):
    policy = {s: "up" for s in states()}   # arbitrary start
    for _ in range(100):
        V = policy_evaluation(lambda s: {policy[s]: 1.0}, gamma)
        new_policy = policy_improvement(V, gamma)
        if new_policy == policy:
            return V, policy
        policy = new_policy
```

Dans 4×4 上典型会在 46 fois l'iteration extérieure 内收──输出 `V*(0,0) ≈ -6`Il s'agit d'une politique de réduction des émissions de gaz.

### Étape 5: Iteration de valeur

```python
def value_iteration(gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = max(sum(p * (r + gamma * V[s_prime])
                       for s_prime, r, p in transitions(s, a))
                   for a in ACTIONS)
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            break
    policy = policy_improvement(V, gamma)
    return V, policy
```

Le même point fixe, moins de code.

## 常见陷

- **忘记处理 terminals。**Si vous utilisez Bellman, il obtiendra toujours une action qui ne changera rien.`if s == terminal: V[s] = 0`La défense.
- **Sup-norm vs L2 convergence。**Utilisation `max |V_new - V|`, ne pas utiliser la valeur moyenne. La garantie théorique est sup-norme.
- **In-place vs synchronous updates。**Origins et nouveautés `V[s]`(Gauss-Seidel) Comparé à l'utilisation de l' unité`V_new`Dictation de la production
- **Policy ties。**Si deux actions ont la même valeur Q,`argmax`Peut être chaque fois que l'itération utilise une manière différente de briser la situation, ce qui conduit à une stabilité de la politique  检查振荡── utiliser une rupture de la relation stable  固定序列中的第一个动作)
- **State-space explosion。**DP chaque fois que vous fouillez`O(|S| · |A|)`◊ le plus utilisé dans environ 107 États ◊ au-delà de cette taille, vous avez besoin d'une approximation de fonction ◊Phase 9 · 05 et sur)


```figure
value-iteration-gamma
```

## Utilisez-le

En 2026, le DP est une véritable base de données, et aussi une boucle interne des planificateurs:

| Use case | Method |
|----------|--------|
| 精确求解小型 tabular MDP | Value iteration（更简单）或 policy iteration（outer steps 更少） |
| 验证 Q-learning / PPO 实现 | 在 toy environment 上与 DP-optimal V* 对比 |
| Model-based RL（Phase 9 · 10） | 在 learned transition model 上做 Bellman backup |
| AlphaZero / MuZero 中的 Planning | Monte Carlo Tree Search = async Bellman backup |
| Offline RL（CQL、IQL） | Conservative Q-iteration，即带有 OOD actions penalty 的 DP |

Chaque fois que quelqu'un dit que la fonction de valeur optimale, ils font référence à la fonction de point fixe de la DP.`V*`Ou `Q*`Alors, imaginez cette boucle.

## Je le livre.

保存为 `outputs/skill-dp-solver.md`- Le numéro de la liste:

```markdown
---
name: dp-solver
description: 通过 policy iteration 或 value iteration 精确求解小型 tabular MDP。报告收敛行为。
version: 1.0.0
phase: 9
lesson: 2
tags: [rl, dynamic-programming, bellman]
---

给定一个已知 model 的 MDP，输出：

1. 选择。Policy iteration vs value iteration。理由需关联 |S|、|A|、γ。
2. 初始化。V_0、starting policy。Convergence sensitivity。
3. 停止条件。Sup-norm tolerance ε。预期 sweeps 数。
4. 验证。精确计算的 V*(s_0)。提取出的 Greedy policy。
5. 使用方式。这个 baseline 将如何用于 debug/evaluate sampling-based methods。

拒绝在 state spaces > 10⁷ 上运行 DP。没有 sup-norm check 时，拒绝声称收敛。将 infinite-horizon task 上任何 γ ≥ 1 标记为 guarantee violation。
```

## 练习

1. **Easy.**Dans le monde des réseaux 4×4`γ ∈ {0.9, 0.99}`运行 l'itération de la valeur.`max |ΔV| < 1e-6`Il faut combien de temps pour passer ?`V*`打印为4×4 grille
2. **Medium.**Dans le monde des grilles, la probabilité de glissement`0.1`) Upparer l'itération de la politique et l'itération de la valeur.`V*(0,0)`◊ Qui est le plus rapide dans les itérations ?
3. **Hard.**construire une politique modifiée: dans la phase d'évaluation,`k`Il faut passer à la recherche.`k ∈ {1, 2, 5, 10, 50}` dessin `V*(0,0)`erreur vs `k`◊ cette courbe  vous dit l'évaluation / amélioration de l'offre de quoi ?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy iteration | “DP algorithm” | 交替进行 evaluation（`V^π`）和 improvement（相对于 `V^π` 的 greedy `π`），直到 policy 不再变化。 |
| Value iteration | “Faster DP” | Bellman optimality backup 在一次 sweep 中应用；几何收敛到 `V*`。 |
| Bellman operator | “The recursion” | `(T V)(s) = max_a Σ P (r + γ V(s'))`；sup-norm 下的 `γ`-contraction。 |
| Contraction | “Why DP converges” | 任何满足 `\|\|T x - T y\|\| ≤ γ \|\|x - y\|\|` 的 operator `T` 都有唯一 fixed point。 |
| GPI | “Everything is DP” | Generalized Policy Iteration：任何推动 `V` 和 `π` 达到相互一致的方法。 |
| Synchronous update | “Jacobi-style” | 在一次 sweep 中始终使用旧的 `V`；便于清晰分析，但更慢。 |
| In-place update | “Gauss-Seidel-style” | 使用正在被更新的 `V`；实践中收敛更快。 |

## 延伸阅读

- [Sutton & Barto (2018). Ch. 4 — Dynamic Programming](http://incompleteideas.net/book/RLbook2020.pdf) l'itération de la politique et l'itération de la valeur
- [Bertsekas (2019). Reinforcement Learning and Optimal Control](http://www.athenasc.com/rlbook.html) Réglementation de la cartographie de la contraction 论证的严谨处理──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) l'itération de la politique modifiée  et son analyse de convergence 
- [Howard (1960). Dynamic Programming and Markov Processes](https://mitpress.mit.edu/9780262582300/dynamic-programming-and-markov-processes/) Originiel papier d'itération de la politique
- [Bertsekas & Tsitsiklis (1996). Neuro-Dynamic Programming](http://www.athenasc.com/ndpbook.html) De DP à approximatif-DP / profond RL de pont, suivants chaque section de cours seront utilisés jusqu'à:
