# Les PDM, les États, les actions et les récompenses

> Le processus de décision de Markov est composé de cinq choses: États, actions, transitions, récompenses, réductions.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Probability & Distributions), Phase 2 · 01 (ML Taxonomy)
**Time:** ~45 minutes

##  problématique

Vous écrivez un robot d'échecs... ou un planificateur d'inventaire... ou un agent de trading... ou un cycle de PPO de modèle de raisonnement... dans quatre domaines différents, mais il y a un fait extraordinaire: ils peuvent tous être classés dans le même objet mathématique...

Apprentissage supervisé 给你 `(x, y)`Les deux parties,并 vous demandent de vous adapter à une fonction. L'apprentissage de renforcement ne vous donne pas de labels, mais seulement une série d'états, de actions que vous avez prises, ainsi qu'une récompense de taille. Cette décision a-t-elle gagné ? Cette décision de rechargement a-t-elle économisé de l'argent ? Cette transaction a-t-elle été rentable ?

Avant la formalisation, vous ne pouviez pas apprendre à partir de ce flux. J'ai vu ce que j'ai fait. Il y a eu des choses qui se sont passées. Il y a beaucoup de bien que chacun de ces objets soit devenu un objet que vous pouvez comprendre. Cette formalisation est le processus de décision de Markov. Dans cette phase, chaque algorithme RL, y compris les derniers boucles RLHF et GRPO, est optimisé sur cette forme.

## 概念

![Markov decision process: states, actions, transitions, rewards, discount](../assets/mdp.svg)

**五个对象。**

- **States** `S`Dans GridWorld, il est joué. Dans les échecs, il est joué. Dans le LLM, il est la fenêtre contextuelle, et il y a aussi la mémoire.
- **Actions** `A`◊可选行为──上/下/左/右移动──下一步棋──输出一个代币──
- **Transitions** `P(s' | s, a)` Un état déterminé`s`et action `a`,départition de l'état suivant: dans le jeu, déterministe, dans l'inventaire, stochastique, dans le décoding LLM, presque déterministe.
- **Rewards** `R(s, a, s')` Équence de signal, gagne = +1,输 = -1♦ revenu réduit de coûts, Ratio de log-probabilité en GRPO 项♦
- **Discount** `γ ∈ [0, 1)`◊ Future reward 相对当前奖励的权重──`γ = 0.99`买到约100 étapes de l'horizon;`γ = 0.9`Je l'ai acheté à 10 ans.

**Markov property** `P(s_{t+1} | s_t, a_t) = P(s_{t+1} | s_0, a_0, …, s_t, a_t)`◊ futur dépend seulement de l'état actuel. Si cela n'est pas le cas, la représentation de l'état est incomplète.

**Policies 与 returns。**Politique `π(a | s)`Mettre les états 映射到动作分布──Retour `G_t = r_t + γ r_{t+1} + γ² r_{t+2} + …` est la somme réduite des récompenses futures `V^π(s) = E[G_t | s_t = s]`Il est en politique.`π`Je suis là .`s`开始的预期回报──Q-value `Q^π(s, a) = E[G_t | s_t = s, a_t = a]`L'algorithme RL de chaque ville estimera l'une des deux, puis devrait s'améliorer.`π`Il y a une autre.

**Bellman equations。**Dans cette phase, tout le contenu sera utilisé pour les équations à point fixe:

`V^π(s) = Σ_a π(a|s) Σ_{s', r} P(s', r | s, a) [r + γ V^π(s')]`
`Q^π(s, a) = Σ_{s', r} P(s', r | s, a) [r + γ Σ_{a'} π(a'|s') Q^π(s', a')]`

Ils ont décomposé le rendement attendu de cette étape en plus de la valeur réduite du point de chute.


```figure
discount-horizon
```

## Faites-le

### Étape 1: un MDP déterministe extrêmement petit

Un 4×4 GridWorld──Agent du côté gauche, terminant au côté droit, chaque étape récompense −1, actions −`{up, down, left, right}`Je vous en prie.`code/main.py`Il y a une autre.

```python
GRID = 4
TERMINAL = (3, 3)
ACTIONS = {"up": (-1, 0), "down": (1, 0), "left": (0, -1), "right": (0, 1)}

def step(state, action):
    if state == TERMINAL:
        return state, 0.0, True
    dr, dc = ACTIONS[action]
    r, c = state
    nr = min(max(r + dr, 0), GRID - 1)
    nc = min(max(c + dc, 0), GRID - 1)
    return (nr, nc), -1.0, (nr, nc) == TERMINAL
```

五行──这是完整环境──déterministiques transitions、恒定步罚、absorbant l'état terminal──

### Étape 2: Développer une politique

La politique est la fonction de la distribution de l'état à l'action. La plus simple est le hasard uniforme.

```python
def uniform_policy(state):
    return {a: 0.25 for a in ACTIONS}

def rollout(policy, max_steps=200):
    s, total, steps = (0, 0), 0.0, 0
    for _ in range(max_steps):
        a = sample(policy(s))
        s, r, done = step(s, a)
        total += r
        steps += 1
        if done:
            break
    return total, steps
```

运行随机政策 1000次──这个4×4板的平均回报 大约是 -60到 -80──最佳回报是 -6(沿直线路径向下再向右)──缩小这个差距,就是9阶段的全部内容──

### Étape 3: par l'équation Bellman 精确计算 `V^π`

Pour les MDP de petite taille, l'équation de Bellman est un système linéaire.

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in all_states()}
    while True:
        delta = 0.0
        for s in all_states():
            if s == TERMINAL:
                continue
            v = 0.0
            for a, pi_a in policy(s).items():
                s_next, r, _ = step(s, a)
                v += pi_a * (r + gamma * V[s_next])
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

C'est l'évaluation politique itérative. C'est le premier algorithme de Sutton & Barto, et la base théorique de chaque méthode RL ultérieure.

### Étape 4:`γ`est un hyperparamètre ayant un sens physique

L' horizon est efficace .`1 / (1 - γ)`Il y a une autre.`γ = 0.9`→ 10 étapes`γ = 0.99`→ 100 pas.`γ = 0.999`→ 1000 pas

太低时,agent 会目光短浅──太高时,credit assignment 会变噪,因为许多早期步骤都会共同承担远未来奖励的责任──LLM RLHF`γ = 1`,因为 épisodes 短且有界──Tâches de contrôle 使用 `0.95–0.99`❖ Jeux de stratégie à long terme`0.999`Il y a une autre.

## La trappe

- **Non-Markovian state.**Si vous avez besoin de trois observations récentes 才能决策, alors state 不只是当前观察──修复:stack frames(DQN 在 Atari 上堆叠 4 ) 或使用复制状态(在观测上使用 LSTM/GRU)──
- **Sparse rewards.**Il est possible de se faire un petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit petit
- **Reward hacking.**Optimiser la récompense par procuration  Régulièrement générer des comportements pathologiques  OpenAI's boat-racing agent 一直原地转圈 collect powerups, plutôt que de terminer la course  Always from goal result defin reward, rather than from proxy definition ◦
- **Discount mis-spec.**Dans une tâche à horizon infini 上使用 `γ = 1`J'ai toujours utilisé un horizon fini ou`γ < 1`Pour limiter.
- **Reward scale.**Les récompenses de {+100, -100} et {+1, -1} donneront les mêmes politiques optimales, mais la magnitude du gradient 会非常不同──接入PPO/DQN 前,把它正常化到近似`[-1, 1]`Il y a une autre.

## Utilisez-le

Avant la mise en place de la stack de 2026 de CODE CONTACT, chaque pipeline RL est réduite en un MDP:

| Situation | State | Action | Reward | γ |
|-----------|-------|--------|--------|---|
| Control（locomotion, manipulation） | Joint angles + velocities | Continuous torques | Task-specific shaped | 0.99 |
| Games（chess, Go, poker） | Board + history | Legal move | Win=+1 / loss=-1 | 1.0（finite） |
| Inventory / pricing | Stock + demand | Order qty | Revenue - cost | 0.95 |
| RLHF for LLMs | Context tokens | Next token | Reward-model score at end | 1.0（episode ~200 tokens） |
| GRPO for reasoning | Prompt + partial response | Next token | Verifier 0/1 at end | 1.0 |

Avant d'écrire n'importe quel cycle de formation, écrivez d'abord ce groupe de 5 personnes. La plupart des rapports de bugs de RL ne fonctionnent pas, et ils peuvent être tracés jusqu'à la formulation de MDP déjà défectueuse sur le papier.

## La faire partir

保存为 `outputs/skill-mdp-modeler.md`- Le numéro de la liste:

```markdown
---
name: mdp-modeler
description: 给定一个 task description，在训练前产出 Markov Decision Process spec 并标记 formulation risks。
version: 1.0.0
phase: 9
lesson: 1
tags: [rl, mdp, modeling]
---

给定一个 task（control / game / recommendation / LLM fine-tuning），输出：

1. State。精确的 feature vector 或 tensor spec。解释 Markov property。
2. Action。Discrete set 或 continuous range。Dimensionality。
3. Transition。Deterministic、stochastic-with-known-model，或 sample-only。
4. Reward。Function 与 source。Sparse vs shaped。Terminal vs per-step。
5. Discount。Value 与 horizon justification。

拒绝交付任何 state 为 non-Markovian、且未明确提到 frame-stacking 或 recurrent state 的 MDP。拒绝任何不是根据 target outcome 定义的 reward。标记 infinite-horizon task 上的任何 `γ ≥ 1.0`。标记任何 reward range 超过 typical step reward 100x 的情况，因为这很可能是 gradient-explosion source。
```

## 练习

1. **Easy.**Dans le`code/main.py`Le rapport rapport de retour est basé sur la moyenne et le rapport de retour est basé sur la moyenne.
2. **Medium.**Pour une politique uniforme et aléatoire, usage `γ ∈ {0.5, 0.9, 0.99}`运行  référencement`policy_evaluation`- Je veux le faire.`V`打印为4×4 grid──解释为什么终端 附近的状态值会随着变大 `γ`Il y a plus de croissance.
3. **Hard.**Pour transformer le monde du réseau en stochastique: chaque action en probabilité`p = 0.1`滑向相邻方向── réévaluer la politique uniforme──`V[start]`Ça va changer ou mieux ?

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| MDP | “Reinforcement Learning setup” | 满足 Markov property 的元组 `(S, A, P, R, γ)`。 |
| State | “Agent 看到的东西” | 在所选 policy class 下，future dynamics 的 sufficient statistic。 |
| Policy | “Agent 的行为” | Conditional distribution `π(a \| s)` 或 deterministic map `s → a`。 |
| Return | “Total reward” | 从当前 step 开始的 discounted sum `Σ γ^t r_t`。 |
| Value | “一个 state 有多好” | 在 `π` 下从 `s` 开始的 expected return。 |
| Q-value | “一个 action 有多好” | 在 `π` 下从 `s` 开始并以第一个 action `a` 开始的 expected return。 |
| Bellman equation | “Dynamic programming recursion” | 把 value / Q 分解为 one-step reward 加 discounted successor value 的 fixed-point。 |
| Discount `γ` | “未来 vs 现在” | 远未来 reward 的 geometric weight；effective horizon 为 `~1/(1-γ)`。 |

## 延伸阅读

- [Sutton & Barto (2018). Reinforcement Learning: An Introduction, 2nd ed.](http://incompleteideas.net/book/RLbook2020.pdf) 教科書。第3 章介绍 MDPs 和 Bellman equations;第1 章 proposer l'hypothèse de récompense, elle支后续每一课──
- [Bellman (1957). Dynamic Programming](https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming) Source de l'équation de Bellman
- [OpenAI Spinning Up — Part 1: Key Concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) D'un angle de profondeur RL 写的简洁 MDP primer──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887)                                                                                                                                                                                                                                                              
- [Littman (1996). Algorithms for Sequential Decision Making (PhD thesis)](https://www.cs.rutgers.edu/~mlittman/papers/thesis-main.pdf) Le MDP  comme le plus clair guide de la programmation dynamique 
