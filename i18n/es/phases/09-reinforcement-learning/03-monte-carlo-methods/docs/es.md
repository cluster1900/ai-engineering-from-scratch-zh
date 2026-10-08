# Métodos de Monte Carlo  Aprender de episodios completos

> La programación dinámica  necesita modelo. Además de los episodios 什么都不需要.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming)
**Time:** ~75 minutes

##  problemas

La programación dinámica es muy buena, pero supone que puedes hacer preguntas sobre cada estado y acción.`P(s' | s, a)`△ en el mundo real casi nada funciona así―Robot 无法解析地计算施施加合扭矩 后摄像头像素的分布― algoritmo de precios 无法对待每种可能客户反应 积分―LLM 无法枚举某代币 后所有可能延续――

Necesitas una única estrategia de desarrollo que dependa del medio ambiente.`s_0, a_0, r_1, s_1, a_1, r_2, …, s_T`Usé el valor de la estimación.

La transición de DP a MC es importante en la filosofía: nos desplazamos de *modelo conocido + respaldo exacto* a *desarrollo de muestras + retorno promedio*。La variación aumentará, pero la adaptabilidad aumentará explosivamente―.

## 概念

![Monte Carlo: rollout, compute returns, average; first-visit vs every-visit](../assets/monte-carlo.svg)

**核心思想，一行表达：** `V^π(s) = E_π[G_t | s_t = s] ≈ (1/N) Σ_i G^{(i)}(s)`, entre ellos `G^{(i)}(s)`Es en política.`π`Siguiente visita`s`后观察到的回报──

**First-visit vs every-visit MC。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `s`En el caso de los primeros visitantes, el MC sólo tiene una primera visita después de la vuelta; cada visita MC 统计所有访问──二者在极限下都是无偏见──第一访问更容易分析(iid样本)──每次访问 每次访问 使用更多数据,在实践中通常收更快──

**Incremental mean。**No se almacena todo, sino que se actualiza el promedio de ejecución:

`V_n(s) = V_{n-1}(s) + (1/n) [G_n - V_{n-1}(s)]`

Cuentas de nuevo:`V_new = V_old + α · (target - V_old)`, entre ellos `α = 1/n`¿Qué es eso?`1/n`换成 constante tamaño de paso `α ∈ (0, 1)`, tienes un estimador de MC no estacionario, que seguirá`π`Este movimiento es el salto de MC a TD, volver a saltar a todos los algoritmos RL modernos.

**Exploration 现在成了问题。**DP 通过枚举触及每个州──MC 只有看到政策 会访问的州──如果`π`Es determinista, el espacio de estado, la región entera nunca será muestrada, sus estimaciones de valor permanecerán siempre en el zero.

1. **Exploring starts。**Desde随机 (s, a) par 开始每个集──保证 覆盖;实践中不现实(你不能把机器人 重置到任意状态)──
2. **ε-greedy。**Comparado con el actual Q  adoptar acciones codiciosas, pero con probabilidad `ε`选择随机action── todos los pares de acciones de estado fueron tomados en muestra.
3. **Off-policy MC。**En la política de comportamiento`μ`Recolección de datos, mediante muestreo de importancia`π` Variación alta, pero es un puente de métodos de repetición de buffer para DQN.

**Monte Carlo Control。**Evaluar → mejorar → evaluar,就像政策代代一样,但评估是基于样本:

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `π`, tengo un episodio.
2. Según los resultados observados  actualización `Q(s, a)`¿Qué es eso?
3. ¿ Qué ?`π`En comparación con`Q`变成 ε-compulsivo。
4. ¿Qué es eso?

En condiciones de temperatura, cada pareja recibe visitas ilimitadas.`α`满足 Robbins-Monro), se reunirá con una probabilidad de 1 收到 `Q*`Y `π*`¿Qué es eso?

## 动手构建 动手构建

### Paso 1: despliegue → (s, a, r) 列表

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

No hay modelo, sólo `env.reset()`Y `env.step(s, a)`                                                                                                                                                                                                                                                              

### Paso 2: 计算 devuelve(反向扫)

```python
def returns_from(trajectory, gamma):
    returns = []
    G = 0.0
    for _, _, r in reversed(trajectory):
        G = r + gamma * G
        returns.append(G)
    return list(reversed(returns))
```

Una vez,`O(T)` Contra la recurrencia`G_t = r_{t+1} + γ G_{t+1}`避免了重复求和──

### Paso 3: Evaluación de la primera visita de MC

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

El primer visitante en el país se encuentra en el estado de marcas.

### Paso 4: control de la política de la MC

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

### Paso 5: Con respecto al estándar de oro DP

Cuando los episodios → ∞ 时, tu对 `V^π`El resultado de la lección 02 debería compararse con el resultado de la DP. En la práctica: en 4×4 GridWorld, se ejecutaron 50.000 episodios, se puede alcanzar una diferencia entre el resultado de la DP y el resultado de la lección 02`~0.1`En el ámbito de la...

## 常见陷

- **Infinite episodes。**MC   exigen episodios  deben *terminar*― Si su política podría ser un ciclo para siempre, por favor configurar `max_steps`Por lo tanto, no hay que olvidar que el tiempo de espera de la política de la red mundial es normal, siempre y cuando se asegure de que el cálculo es correcto.
- **Variance。**MC utiliza retornos completos. En los episodios más largos, la variación es grande, la última vez que se vuelve la recompensa será igual.`V(s_0)` métodos de TD (Lección 04) a través de bootstrapping 降低这一点──
- **State coverage。**En el nuevo Q 上做贪 MC, si aparecen lazos, sólo continuará intentando una acción.
- **Non-stationary policies。**Si es que`π`发生变化(如 MC control 中那样), viejo retorno de diferentes políticas.
- **Off-policy importance sampling。**权重         `π(a|s)/μ(a|s)`Se puede utilizar la opción de "Corte de IS" ponderada por decisión, o de "Cambio a TD").


```figure
epsilon-greedy
```

## Usalo

Métodos de Monte Carlo en el año 2026:

| Use case | Why MC |
|----------|--------|
| Short-horizon games（blackjack、poker） | Episodes 自然 terminate；returns 清晰。 |
| Logged policy 的 offline evaluation | 对 stored trajectories 的 discounted returns 求平均。 |
| Monte Carlo Tree Search（AlphaZero） | 从 tree leaves 发起的 MC rollouts 指导 selection。 |
| LLM RL evaluation | 为给定 policy 计算 sampled completions 的 average reward。 |
| PPO 中的 baseline estimation | Advantage target `A_t = G_t - V(s_t)` 使用 MC `G_t`。 |
| RL 教学 | 最简单且真正有效的 algorithm；去掉 bootstrapping 就能看到核心。 |

Los algoritmos modernos de RL profundos (PPO、SAC) pasarán`n`-retorno de paso o GAE, en puro MC (retorno completo) y puro TD (retorno de arranque de un paso) entre el valor de inserción.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-mc-evaluator.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy.**实现 4×4 GridWorld 上 uniforme-random policy 首次访问MC评价──运行 10,000 episodios──将 `V(0,0)`随着剧集数 变化的曲线与 DP 答案对照绘制──
2. **Medium.**¿ Qué ?`ε ∈ {0.01, 0.1, 0.3}`实现 ε-greedy MC control──comparar 20.000 episodios 后的平均回归──Curve 看起来是什么样?
3. **Hard.**Utilización de muestreo de importancia                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `μ`Se recopilan datos, se evalúa la política óptima determinista `π`de la `V^π`◊ Comparar la diferencia IS ≠ por decisión IS 和 ponderada IS ⋅ ¿cuál es la variación mínima?

## 关键术语: "El hombre es un hombre"

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
- [Singh & Sutton (1996). Reinforcement Learning with Replacing Eligibility Traces](https://link.springer.com/article/10.1007/BF00114726) análisis de primera visita frente a cada visita
- [Precup, Sutton, Singh (2000). Eligibility Traces for Off-Policy Policy Evaluation](http://incompleteideas.net/papers/PSS-00.pdf) control de variaciones y MC fuera de la política
- [Mahmood et al. (2014). Weighted Importance Sampling for Off-Policy Learning](https://arxiv.org/abs/1404.6362) 现代 estimadores de IS de baja variación。
- [Tesauro (1995). TD-Gammon, A Self-Teaching Backgammon Program](https://dl.acm.org/doi/10.1145/203330.203343) MC/TD auto-juego 收到超人玩的首个大规模实证展示; también es el precursor del concepto de la última mitad de la fase de cada sección de la clase.
