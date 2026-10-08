# Diferencia temporal  Q-Learning y SARSA

> Monte Carlo 会一直等到集结.TD 通过bootstrap 下一个价值估计,在每一步后更新.Q-learning es fuera de política y prejuicio de la política.SARSA es en política y prejuicio de la prudencia.

**Type:** Build
**Languages:** Python
**前置要求:**Fase 9 · 01 (MDPs), Fase 9 · 02 (Dynamic Programming), Fase 9 · 03 (Monte Carlo)
**Time:** ~75 minutes

##  problemas

Monte Carlo es posible, pero tiene dos requisitos muy altos. Requiere que se terminen los episodios y sólo se pueden actualizar después de que se recuperen. Si tu episodio tiene 1.000 pasos, MC debe esperar 1.000 pasos para actualizar cualquier cosa.

La programación dinámica 则相反:零方差的 bootstrapped backups, pero requiere un modelo ya conocido。

Diferencia temporal (TD) aprendizaje 折中了两者──根据单个过渡 `(s, a, r, s')`, construye un objetivo de un paso .`r + γ V(s')`,并把 `V(s)`朝它推近──不需要模型──不需要完整的集──由于在RHS上使用近似的`V`Se introducirá una diferencia, pero la diferencia es mucho menor que la MC, y desde el primer paso se puede actualizar en línea.

Este es todo el contenido moderno RL ((DQN、A2C、PPO、SAC) de que depende.

## 概念

![Q-learning vs SARSA: off-policy max vs on-policy Q(s', a')](../assets/td.svg)

**用于 V 的 TD(0) update：**

`V(s) ← V(s) + α [r + γ V(s') - V(s)]`

方括号中量是 TD error `δ = r + γ V(s') - V(s)`Es el MC.`G_t - V(s_t)`La información que se ofrece en línea es la información que se ofrece en línea.`α`满足 Robbins-Monro`Σ α = ∞`¿ Qué ?`Σ α² < ∞`), y todos los estados fueron visitados ilimitadamente.

**Q-learning。**Un método de TD fuera de la política para controlar:

`Q(s, a) ← Q(s, a) + α [r + γ max_{a'} Q(s', a') - Q(s, a)]`

`max`假设从                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `s'`开始会遵循 *贪的* política,不管代理 实际采取什么行动――这种解让Q-learning 在代理 通过 ε-贪的探索时仍然学习`Q*`◊Mnih et al. (2015) 将将将转换为Atari 上的深度Q-learning (Leyón 05) ◊

**SARSA。**Una especie de TD en política:

`Q(s, a) ← Q(s, a) + α [r + γ Q(s', a') - Q(s, a)]`

Este nombre viene de tuple .`(s, a, r, s', a')` SARSA Utiliza agente siguiente paso* práctica* de la acción`a'`, en lugar de codicioso .`argmax`◊ Se recibirá hasta el actual funcionamiento arbitrario ε-avidos `π`En el caso de la`Q^π`En la extrema`ε → 0`Se convertirá en`Q*`¿Qué es eso?

**cliff-walking 的差异。**En el clásico trabajo de caminar en acantilados (fall down cliff = reward -100), el aprendizaje Q aprende a recorrer el mejor camino a lo largo del borde del acantilado, pero ocasionalmente se come a pena durante la exploración.`ε → 0`En la práctica, esto es importante: cuando la implementación de SARSA se realiza, el comportamiento de SARSA se mantiene mejor.

**Expected SARSA。**¿ Qué ?`π` 下的期望值替换 `Q(s', a')`¿Qué es esto ?

`Q(s, a) ← Q(s, a) + α [r + γ Σ_{a'} π(a'|s') Q(s', a') - Q(s, a)]`

方差低于 SARSA(不对 `a'`采样), el objetivo es también en política.

**n-step TD 和 TD(λ)。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `n`步再 bootstrap, en TD(0) y entre MC 插值──`n=1`Sí, TD,`n=∞`Es el MC.TD.`(1-λ)λ^{n-1}`Para todo`n`求平均── la mayoría de las profundidades de RL utiliza entre 3 a 20 `n`¿Qué es eso?


```figure
qlearning-gridworld
```

## Construirlo

### Paso 1: SARSA basado en la política de avaricia

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

La única diferencia entre el aprendizaje de Q y el objetivo es ese.

### Paso 2: Aprendizaje de Q

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

`max`El objetivo y el comportamiento se diferencian entre la política y la política.

### 步骤 3: curvas de aprendizaje

Seguir cada 100 episodios de retorno medio. Q-learning en una simple determinación. GridWorld 上收更快.SARSA 在悬崖上更保守.`code/main.py`El 4×4 GridWorld en el centro, dos en el centro.`α=0.1, ε=0.1`Bajo, unos 2.000 episodios, después de todo, casi todo.

### Paso 4: Comparar con el valor real de la DP

运行 valor de la iteración(lección 02) obtener `Q*` Inspección`max_{s,a} |Q_learned(s,a) - Q*(s,a)|`◊ Un agente TD de tablas saludables en 4×4 GridWorld  entrenamiento 10.000 episodios  Después, debe caer `~0.5`En el interior.

## 陷

- **初始 Q values 很重要。**乐观初始化 负 recompensa 任务中                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `Q = 0`El gobierno de la República de China ha decidido que el gobierno de la República de China debe mantener su política de desarrollo.
- **α schedule。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `α`Para el problema de la estabilidad es posible.`α_n = 1/n`En teoría puede recibir, pero en la práctica es demasiado lento.`α` Fija en `[0.05, 0.3]`,并monitoring curva de aprendizaje。
- **ε schedule。**Desde el alto de la cantidad de dinero`ε=1.0`), disminución hasta `ε=0.05`La "GLIE" es codiciosa en el límite con una exploración infinita.
- **Q-learning 中的 max bias。**Cuando`Q`Hay ruido,`max`El operador 存在向上偏差──会导致高估;Hasselt's Double Q-learning(LECCIÓN 05 中 DDQN 使用的做法) con dos tablas Q 修复这个问题──
- **非终止 episodes。**TD puede aprender en caso de no tener terminales, pero necesitas limitar el número de pasos, o en el límite superior correctamente procesar el arranque.
- **State hashing。**Si los estados son tuples/tenseores, usar la clave de hashable (túple, no lista; floats de cuatro舍五入后的 tuple, no floats crudos)

## Usalo

Paisaje TD del año 2026:

| Task | Method | Reason |
|------|--------|--------|
| 小型 tabular environments | Q-learning | 直接学习 optimal policy。 |
| On-policy safety-critical | SARSA / Expected SARSA | 探索期间更保守。 |
| High-dimensional state | DQN (Phase 9 · 05) | 带 replay 和 target net 的 Neural Network Q-function。 |
| Continuous actions | SAC / TD3 (Phase 9 · 07) | 在 Q-network 上做 TD update；policy net 发出 actions。 |
| LLM RL (reward-model-based) | PPO / GRPO (Phase 9 · 08, 12) | 使用通过 GAE 得到的 TD-style advantage 的 actor-critic。 |
| Offline RL | CQL / IQL (Phase 9 · 08) | 带 conservative regularization 的 Q-learning。 |

En el 2026 el "RL" que se leerá en el artículo será una expansión de Q-learning o SARSA.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-td-agent.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy。**En 4×4 GridWorld 上实现 Q-learning 和 SARSA── dibujar curvas de aprendizaje de 2.000 episodios(por cada 100 episodios de retorno medio)── quién recibe más rápido?
2. **Medium。**Construir un entorno de caminata en acantilados  4×12, última línea es acantilado, recompensa -100 y reinicio hasta el punto de partida  Compare las políticas finales de Q-learning y SARSA  Retratar sus respectivos caminos  ¿Cuál es más cerca del acantilado?
3. **Hard。**实现 Double Q-learning──在 grido-recompensa GridWorld 上(给每步奖励 添加高斯音 σ=5), mostrar Q-learning 会明显高估 `V*(0,0)`, mientras que el doble Q-aprendizaje no se hará.

## 关键术语: "El hombre es un hombre"
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
- [Watkins & Dayan (1992). Q-learning](https://link.springer.com/article/10.1007/BF00992698) 原始论文和收证明──
- [Sutton & Barto (2018). Ch. 6 — Temporal-Difference Learning](http://incompleteideas.net/book/RLbook2020.pdf) TD(0) 、SARSA、Q-aprendizaje、SARSA esperada。
- [Hasselt (2010). Double Q-learning](https://papers.nips.cc/paper_files/paper/2010/hash/091d584fced301b442654dd8c23b3fc9-Abstract.html) la maximización de sesgo de la modificación método.
- [Seijen, Hasselt, Whiteson, Wiering (2009). A Theoretical and Empirical Analysis of Expected SARSA](https://ieeexplore.ieee.org/document/4927542) esperado SARSA de movimiento:.
- [Rummery & Niranjan (1994). On-line Q-learning using connectionist systems](https://www.researchgate.net/publication/2500611_On-Line_Q-Learning_Using_Connectionist_Systems) 创建SARSA 这个术语的论文(En ese momento se llamaba "la conexión modificada Q-learning")。
- [Sutton & Barto (2018). Ch. 7 — n-step Bootstrapping](http://incompleteideas.net/book/RLbook2020.pdf) 将 TD(0) 泛化到 TD(n), es el camino desde el aprendizaje Q hacia las huellas de elegibilidad, así como posteriormente en PPO en GAE.
