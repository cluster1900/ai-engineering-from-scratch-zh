# Programación dinámica  Iteración de políticas y iteración de valores

> La programación dinámica es la RL de la contagia. Ya sabes las funciones de transición y recompensa. Sólo necesitas repetir la ecuación de Bellman hasta que`V`O `π`No se vuelve a cambiar. Es un método basado en muestras que se trata de acercarse a la base.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs)
**Time:** ~75 minutes

##  problemas

Usted tiene un modelo conocido de MDP: usted puede hacer cualquier par de acción de estado  consulta `P(s' | s, a)`Y `R(s, a, s')` Gestión de reservas sabe la demanda de distribución  juegos de tablero tienen transiciones definidas  GridWorld sólo necesita cuatro líneas de Python  tienes un *modelo*♦

RL libre de modelos ((Q-learning、PPO、REINFORCE) es una situación desarrollada por el hecho de que no hay modelos, es decir, que solo puedes probar en el entorno. Pero cuando realmente tienes un modelo, hay un método más rápido y mejor: la programación dinámica. Bellman diseñó estos métodos en 1957.

Usted en 2026 todavía las necesita, por razones hay tres puntos. Primero, la investigación de RL en cada entorno tabular (GridWorld, FrozenLake, CliffWalking) utilizará DP para obtener una solución, para generar una política de oro estándar. Segundo, los valores precisos pueden permitir que *debug* métodos de muestreo: si Q-learning para`V*(s_0)`La evaluación de la respuesta de DP es de 30%, tu aprendizaje de Q tiene un error.

## 概念

![Policy iteration and value iteration, side by side](../assets/dp.svg)

**两个算法，都是 Bellman 上的 fixed-point iteration。**

**Policy iteration。**交替执行两个步骤, hasta que la política no cambie más.

1. *Evaluación:* 给定 política `π`,反复应用 `V(s) ← Σ_a π(a|s) Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`, hasta que reciba, para calcular.`V^π`¿Qué es eso?
2. * Mejoramiento:* 给定 `V^π`, hacer `π`En comparación con`V^π`变为 codicioso:`π(s) ← argmax_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`¿Qué es eso?

收是有保证的, porque (a) cada paso de mejora debe mantenerse `π`No cambia, ¿tiene que mejorar estrictamente ciertos estados `V^π`,(b) El espacio de las políticas deterministas es limitado. Incluso en grandes espacios de estado, normalmente también se encuentran en aproximadamente 520 veces iteraciones externas.

**Value iteration。**La evaluación y mejora se realizarán en una sola prueba.

`V(s) ← max_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`

- ¿Qué pasa ?`max_s |V_{new}(s) - V(s)| < ε`◊ Finalmente, por medio de la elección de la acción codiciosa 提取政策── cada vez más 严格更快, pues no hay un ciclo interno de evaluación, pero normalmente se necesitan más iteraciones 才能收──

**Generalized policy iteration (GPI)。**统一视角──La función de valor y la política están bloqueadas en un ciclo de mejora bidireccional; cualquier simultáneo fomento de los dos hacia un método coherente.

**为什么 `γ < 1` 很重要。**Operador Bellman en la sup-norma abajo es un`γ`- contracción:`||T V - T V'||_∞ ≤ γ ||V - V'||_∞`◊ Contracción significa único punto fijo 和几何收── desaparecer `γ < 1`, tu ya has perdido la seguridad, necesitas un horizonte finito o un estado terminal de absorción.

## 动手构建 动手构建

### Paso 1: 构建 GridWorld modelo MDP

Utiliza la misma lección 01 en 4×4 GridWorld...`0.1`La probabilidad de que el rango de la velocidad de la velocidad sea de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de

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

`transitions(s, a)` regresar `(s', r, p)`列表── ése es todo el modelo──

### Paso 2: Evaluación de las políticas

给定 política `π(s) = {action: prob}`, 代 Bellman ecuación, hasta `V`No se puede cambiar.

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

### Paso 3: Mejora de las políticas

Usado en comparación con`V`La política de la codicia`π`Si es que`π`No hay cambios, regresamos, porque ya hemos alcanzado el óptimo.

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

### Paso 4: 组合起来

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

En 4×4 上典型会在 46 veces iteraciones externas 内收──输出 `V*(0,0) ≈ -6`, así como una política de reducción de la cantidad de pasos.

### Paso 5: iteración de valor

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

El mismo punto fijo, menor número de código de la línea.

## 常见陷

- **忘记处理 terminals。**Si se aplica el estado de absorción Bellman, todavía obtendrá una acción mejor que nunca.`if s == terminal: V[s] = 0`防护。
- **Sup-norm vs L2 convergence。**Uso `max |V_new - V|`, no utilice el valor medio. La teoría asegura que la sup-norma es superior.
- **In-place vs synchronous updates。**Originalmente actualizada`V[s]`(Gauss-Seidel) Comparado con el uso individual`V_new`dict(Jacobi)收更快──Código de producción Utiliza en el lugar──
- **Policy ties。**Si dos acciones tienen el mismo valor Q,`argmax`Puede que cada iteración use different ways to break the平局, conduciendo a la estabilidad de la política  检查振荡── utilizar un equilibrio estable  固定顺序中的第一个动作)
- **State-space explosion。**DP cada vez que barremos es`O(|S| · |A|)`◊ más utilizado en aproximadamente 107 estados. ◊ Más allá de esta escala, necesitas una aproximación de la función.


```figure
value-iteration-gamma
```

## Usalo

En 2026 años, el DP es el verdadero punto de partida, también el circuito interno de los planificadores:

| Use case | Method |
|----------|--------|
| 精确求解小型 tabular MDP | Value iteration（更简单）或 policy iteration（outer steps 更少） |
| 验证 Q-learning / PPO 实现 | 在 toy environment 上与 DP-optimal V* 对比 |
| Model-based RL（Phase 9 · 10） | 在 learned transition model 上做 Bellman backup |
| AlphaZero / MuZero 中的 Planning | Monte Carlo Tree Search = async Bellman backup |
| Offline RL（CQL、IQL） | Conservative Q-iteration，即带有 OOD actions penalty 的 DP |

Cada vez que alguien dice que la función de valor óptimo, se refiere a que el punto fijo DP.`V*`O `Q*`时, por favor, imagina este ciclo.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-dp-solver.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy.**En 4×4 GridWorld 上使用 `γ ∈ {0.9, 0.99}`运行 Iteración de valor.`max |ΔV| < 1e-6`¿Cuántas veces se barría?`V*`打印为4×4 grid──
2. **Medium.**En el mundo de la rejilla de probabilidad`0.1`) sobre comparación de la iteración de la política y la iteración de valor.`V*(0,0)`¿Cuál es el más rápido en las iteraciones?
3. **Hard.**构建修改政策反复:在评估阶段 中,只运行 `k`Se hace un barrido, en vez de un barrido.`k ∈ {1, 2, 5, 10, 50}` dibujo `V*(0,0)`error vs `k`◊ esta curva  ¿Te dice qué información de la evaluación / mejora de la compensación?

## 关键术语: "El hombre es un hombre"

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

- [Sutton & Barto (2018). Ch. 4 — Dynamic Programming](http://incompleteideas.net/book/RLbook2020.pdf) Iteración de políticas y Iteración de valores
- [Bertsekas (2019). Reinforcement Learning and Optimal Control](http://www.athenasc.com/rlbook.html) El tratamiento de la contracción de mapas 论证的严谨处理──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) Iteración de políticas modificadas  y su análisis de convergencia。
- [Howard (1960). Dynamic Programming and Markov Processes](https://mitpress.mit.edu/9780262582300/dynamic-programming-and-markov-processes/) Original de la política de iteración papel。
- [Bertsekas & Tsitsiklis (1996). Neuro-Dynamic Programming](http://www.athenasc.com/ndpbook.html) Desde DP hasta aproximadamente-DP / profundidad RL de puentes, posterior cada sección de clases se utilizará hasta
