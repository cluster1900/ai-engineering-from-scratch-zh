# MDPs, Estados, Acciones y Recompensas

> El proceso de decisión de Markov está formado por cinco cosas: estados, acciones, transiciones, recompensas, descuentos.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Probability & Distributions), Phase 2 · 01 (ML Taxonomy)
**Time:** ~45 minutes

##  problemas

Estás escribiendo un bot de ajedrez... o un planificador de inventario... o un agente de comercio... o un ciclo de PPO de un modelo de razonamiento entrenado... en cuatro áreas diferentes, pero hay un hecho sorprendente: todas se pueden clasificar en el mismo objeto matemático.

Aprendizaje supervisado 给你 `(x, y)`Los pares,并 requieren que se adapte a una función. Reforcement Learning no te da etiquetas, sólo te da una serie de estados, acciones que tomas, así como una recompensa de escala. ¿Este movimiento ha ganado? ¿Esta decisión de reabastecimiento ha ahorrado dinero? ¿Este comercio ha ganado? ¿LLM Token recién generado ¿trae una recompensa mayor del juez?

Antes de la formalización, no podías aprender de esta corriente. I saw what、i did what、 what happened next、this is good cada uno de ellos debe convertirse en un objeto que puedas razonar. This formalization is Markov Decision Process🏼 Cada algoritmo RL en esta fase, incluyendo los últimos bucles RLHF y GRPO, se optimiza en esta forma🏼

## 概念

![Markov decision process: states, actions, transitions, rewards, discount](../assets/mdp.svg)

**五个对象。**

- **States** `S`En el GridWorld, es un juego. En el ajedrez, es un juego. En el LLM, es una ventana de contexto, además de cualquier memoria.
- **Actions** `A`△可选行为──上/下/左/右移动──下一步棋──输出一个代币──
- **Transitions** `P(s' | s, a)` Un estado determinado`s`y acción `a`,diferencia del siguiente estado: en el ajedrez, el centro es determinista, en el inventario, el centro es estocástico, en el decodificación LLM, casi determinista.
- **Rewards** `R(s, a, s')` 标量信号──赢 = +1,输 = -1──收入减成本──GRPO 中的日志-概率比项──
- **Discount** `γ ∈ [0, 1)`◊ recompensa futura 相對当前的回報的权重──`γ = 0.99`买到约100 pasos del horizonte;`γ = 0.9`¿Qué es eso?

**Markov property** `P(s_{t+1} | s_t, a_t) = P(s_{t+1} | s_0, a_0, …, s_t, a_t)`◊ el futuro sólo depende del estado actual. Si no existe, la representación estatal es incompleta.

**Policies 与 returns。**Política `π(a | s)`Añadir estados  mapu a las distribuciones de acción―Return `G_t = r_t + γ r_{t+1} + γ² r_{t+2} + …`Es la suma descuentada de las recompensas futuras.`V^π(s) = E[G_t | s_t = s]`Es en política.`π`De abajo`s`开始的预期回报──Q-value `Q^π(s, a) = E[G_t | s_t = s, a_t = a]`Es un regreso esperado de una acción específica. Cada algoritmo de RL estimará uno de estos dos y luego se debe mejorar.`π`¿Qué es eso?

**Bellman equations。**En esta fase todo el contenido se utilizará hasta las ecuaciones de punto fijo:

`V^π(s) = Σ_a π(a|s) Σ_{s', r} P(s', r | s, a) [r + γ V^π(s')]`
`Q^π(s, a) = Σ_{s', r} P(s', r | s, a) [r + γ Σ_{a'} π(a'|s') Q^π(s', a')]`

它们 desglosan el rendimiento esperado de este paso 加上落点的折扣值──递归──本 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .


```figure
discount-horizon
```

## Construye el mismo

### Paso 1: Una MDP determinista de un extremo pequeño

Un 4×4 GridWorld──Agent de la esquina izquierda arriba comienza, terminal en la esquina derecha abajo, cada paso recompensa por -1, acciones por `{up, down, left, right}`¿Qué es eso?`code/main.py`¿Qué es eso?

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

五行──这是完整环境──Deterministic transitions、恒定步罚、absorbing terminal state──

### Paso 2: Desarrollar una política

La política es la función de distribución de la acción desde el estado hasta la distribución de la acción.

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

运行随机政策 1000 次──这个4×4板的平均回报 大约是 -60到 -80──最佳回报是 -6(沿直线路径向下再向右)──缩小这个差距,就是9阶段的全部内容──

### Paso 3: a través de la ecuación Bellman 精确计算 `V^π`

Para los MDPs pequeños, la ecuación de Bellman es un sistema lineal.

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

Es la evaluación iterativa de políticas. Es el primer algoritmo de Sutton & Barto, y es la base teórica de cada método RL posterior.

### Paso 4:`γ`Es un hiperparámetro de significado físico.

El horizonte efectivo es aproximadamente`1 / (1 - γ)`¿Qué es eso?`γ = 0.9`→ 10 pasos.`γ = 0.99`→ 100 pasos.`γ = 0.999`→ 1000 pasos

太低时,代理会目光短浅──太高时,信贷分配会变噪,因为许多早期步骤都会共同承担远未来奖励的责任──LLM RLHF normalmente se utiliza `γ = 1`,因为 episodios 短且有界──Trabajos de control 使用 `0.95–0.99`❖ Juegos de estrategia de largo horizonte `0.999`¿Qué es eso?

## 陷

- **Non-Markovian state.**Si necesitas tres observaciones recientes 才能决策, entonces state 不只是当前观察──修复:stack frames(DQN 在 Atari 上堆叠 4 ) o usar estado recurrente(在观察上使用LSTM/GRU)──
- **Sparse rewards.**Sólo en el momento de la victoria, dará recompensa, hará que el aprendizaje en los espacios de gran estado sea casi imposible.
- **Reward hacking.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- **Discount mis-spec.**En tarea de horizonte infinito 上使用 `γ = 1`¡Ahora que cada valor se vuelva infinito! ¡Siempre usando horizontes finitos!`γ < 1`Para limitar.
- **Reward scale.**Las recompensas de {+100, -100} con {+1, -1} darán las mismas políticas óptimas, pero la magnitud del gradiente 会非常不同──接入PPO/DQN 前,把它正常化到近似`[-1, 1]`¿Qué es eso?

## Usalo

Antes de que la pila de 2026 se encuentre en contacto, reducir cada línea de RL a un MDP:

| Situation | State | Action | Reward | γ |
|-----------|-------|--------|--------|---|
| Control（locomotion, manipulation） | Joint angles + velocities | Continuous torques | Task-specific shaped | 0.99 |
| Games（chess, Go, poker） | Board + history | Legal move | Win=+1 / loss=-1 | 1.0（finite） |
| Inventory / pricing | Stock + demand | Order qty | Revenue - cost | 0.95 |
| RLHF for LLMs | Context tokens | Next token | Reward-model score at end | 1.0（episode ~200 tokens） |
| GRPO for reasoning | Prompt + partial response | Next token | Verifier 0/1 at end | 1.0 |

Antes de escribir cualquier ciclo de entrenamiento, primero escriba este grupo de cinco componentes. La mayoría de los informes de errores de RL no funcionan, y finalmente se pueden remontar a la formulación de MDP que ya está rota en el papel.

## Envío

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-mdp-modeler.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy.**En el`code/main.py`En el caso de la aplicación de la política de 4×4 GridWorld, el rollout de la política de 4×4 GridWorld y el rollout de la política de 10 000 episodios, el rollo de la política de 4×4 GridWorld y el rollout de la política de 4×4 GridWorld, el rollout de la política de 4×4 GridWorld y el rollout de la política de 4×4 GridWorld y el rollout de la política de 4×4 GridWorld y el rollout de la política de 4×4 GridWorld y el rollout de la política de 4×4 GridWorld y el rollout de la política de 4×4 GridWorld y el rollout de la política de 4×4 GridWorld y el rollout de la política de 4×4 GridWorld y el rollout de la política de 4×6
2. **Medium.**Para la política uniforme aleatoria, uso `γ ∈ {0.5, 0.9, 0.99}`运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `policy_evaluation`把 cada uno `V`Impresión para 4×4 red,.. Explica por qué terminal  Valores de estado cercanos 会随之大大`γ`Más rápido crecimiento.
3. **Hard.**Transformar la RedWorld en estocástica: cada acción en probabilidad`p = 0.1`滑向相邻方向── reevaluación de la política uniforme──`V[start]`¿Vamos a ser mejores o peores?

## 关键术语: "El hombre es un hombre"

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

- [Sutton & Barto (2018). Reinforcement Learning: An Introduction, 2nd ed.](http://incompleteideas.net/book/RLbook2020.pdf) 教科書。第3 章介绍 MDPs 和 Bellman equations;第1 章提出奖励假设,它支后续每一课──
- [Bellman (1957). Dynamic Programming](https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming) Fuente de la ecuación de Bellman
- [OpenAI Spinning Up — Part 1: Key Concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) Desde el ángulo profundo de la RL 写的简洁 MDP primer.
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887)   关于MDPs和精确解决方法的操作研究 参考书──
- [Littman (1996). Algorithms for Sequential Decision Making (PhD thesis)](https://www.cs.rutgers.edu/~mlittman/papers/thesis-main.pdf) El MDPs  como la mejor orientación de la programación dinámica 
