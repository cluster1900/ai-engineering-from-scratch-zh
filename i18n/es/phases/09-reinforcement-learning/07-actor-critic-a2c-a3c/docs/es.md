# Actrices y críticos  A2C y A3C

> ReINFORCE  Muy ruidoso。添加一个学习 `V̂(s)`El crítico, desde el retorno en el medio, lo elimina, te da una expectativa similar pero con variación de ventaja mucho menor.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (TD Learning), Phase 9 · 06 (REINFORCE)
**Time:** ~75 分钟

##  problemas

Vanilla ReINFORCE 能工作, pero su variación 很糟──Monte Carlo regresa `G_t`Entre los diferentes episodios puede haber un flujo de 10 veces mayor amplitud.`∇ log π`En un nuevo promedio, se producirá un estimador de gradiente, que necesita miles de episodios para impulsar la política con menos actualizaciones de DQN para alcanzar la distancia.

Variación de la utilización de los resultados en bruto. Si se reduce una línea de base `b(s_t)`La función de cualquier estado, incluyendo el valor aprendido, la expectativa  mantener invariable, mientras que la variación 会下降── la mejor línea de base tratable es `V̂(s_t)`Ahora me voy a llevar.`∇ log π`La cantidad es la ventaja:

`A(s, a) = G - V̂(s)`

Si una acción produce un rendimiento superior al promedio, es bueno; si es inferior al promedio, es diferente.

## 概念

![Actor-critic: policy net plus value net, TD residual as advantage](../assets/actor-critic.svg)

**两个 networks，一个 shared loss：**

- **Actor** `π_θ(a | s)`La política. Muestra.
- **Critic** `V_φ(s)`El resultado esperado del estado de salida se reduce al mínimo.`(V_φ(s) - target)²`訓練── hace mucho tiempo.

**Advantage。**两种标准形式:

- *Vantaje de la MC:* `A_t = G_t - V_φ(s_t)`◊ imparcial, variación 更高──
- *Vantaje de la TD:* `A_t = r_{t+1} + γ V_φ(s_{t+1}) - V_φ(s_t)`△ biado △`V_φ`),variante 低得多──也叫 *TD residual* `δ_t`¿Qué es eso?

**n-step advantage。**Entre los dos valores:

`A_t^{(n)} = r_{t+1} + γ r_{t+2} + … + γ^{n-1} r_{t+n} + γ^n V_φ(s_{t+n}) - V_φ(s_t)`

`n = 1`Es pura TD.`n = ∞`Es MC. La mayoría de las implementaciones están en uso en Atari.`n = 5`, en el uso de MuJoCo PPO `n = 2048`¿Qué es eso?

**Generalized Advantage Estimation (GAE)。**Schulman et al. (2016)  propone hacer una media ponderada exponencialmente para todas las ventajas de n-pasos:

`A_t^{GAE} = Σ_{l=0}^{∞} (γλ)^l δ_{t+l}`

Entre ellos `λ ∈ [0, 1]`¿Qué es eso?`λ = 0`Es TD ((baja varianza, alto sesgo)`λ = 1`Es muy variante, imparcial.`λ = 0.95`Es el valor de 2026: Continuar el ajuste hasta que el dial de sesgo/varianza llegue a la posición que desea.

**A2C：synchronous advantage actor-critic。**En el`N`个 entornos paralelos 上收集 `T`Paso por paso 计算优点──在组合批上更新 actor 和 critic──重复──这是A3C 更简单、更可扩展的兄弟姐妹──

**A3C：asynchronous advantage actor-critic。**Mnih et al. (2016)。 iniciación `N`个 worker threads, cada thread 运行一个 env. 个 worker 在自己的推出 上本地计算梯度,然后异步 应用到共享参数服务器──不需要重复缓冲:workers 通过运行不同轨迹来去解调──A3C 证明你能在CPU上规模培训──到2026年,GPU-based A2C(batched parallel envs)占主导,因为GPU 需要大批量──

**Combined loss。**

`L(θ, φ) = -E[ A_t · log π_θ(a_t | s_t) ]  +  c_v · E[(V_φ(s_t) - G_t)²]  -  c_e · E[H(π_θ(·|s_t))]`

Tres elementos: pérdida de políticas-gradientes, regresión de valor, bonificación entropía.`c_v ~ 0.5`¿Qué es esto?`c_e ~ 0.01`Es un punto de partida canónico.


```figure
actor-critic
```

## Construye el mismo

### Paso 1: un crítico

Crítico lineal `V_φ(s) = w · features(s)`Utilizaciones de MSE 更新:

```python
def critic_update(w, x, target, lr):
    v_hat = dot(w, x)
    err = target - v_hat
    for j in range(len(w)):
        w[j] += lr * err * x[j]
    return v_hat
```

En el entorno tabular, los críticos se encuentran en varios cientos de episodios. En Atari, los críticos lineal se sustituyen por el trunk de CNN compartido + el valor de la cabeza.

### Paso 2: ventaja de n-paso

给定长度为 `T`El despliegue y la final de arranque `V(s_T)`¿Qué es esto ?

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

`returns`Es un objetivo crítico.`advantages`Es un viaje .`∇ log π`El contenido de la película.

### Paso 3: actualización combinada

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

En política, cada actualización, un lanzamiento, actor y crítico, utilizan tasas de aprendizaje abiertas.

### Paso 4: paralelación (A3C vs. A2C)

- **A3C：** Inicio `N`个线程── cada hilo 运行自己的env 和自己的前进通行──周期性地把 Gradient updates 推送到共享主──master 上不加锁:races 没关系,它们只是增加噪声──
- **A2C：**En un proceso único en el que se ejecuta`N`个 env instantes,把 observaciones apilar 成 `[N, obs_dim]`Batch, ejecutar batch forward pass,batch backward pass, uso de GPUs, más alto, determinista, más fácil de hacer.

Nuestro código de juguete para mantener el hilo único, se puede cambiar a A2C en lote.

## Las trampas

- **Critic bias before actor gradient。**Si el crítico es aleatorio, su línea de base es que no hay información, mientras que usted está en ruido puro en el entrenamiento. Primero caliente el crítico.
- **Advantage normalization。**En cada lote, las ventajas se normalizan a cero-medio/unidad-std. Casi cero costo, pero pueden ser muy estabilizadas.
- **Shared trunk。**Para las entradas de imagen, para actor y crítico utiliza el extractor de características compartidas.
- **On-policy contract。**A2C para datos precisa replicar con una actualización. Más veces hacer que Gradient sesgado.
- **Entropy collapse。**No hay .`c_e > 0`La política se actualizó cientos de veces y se volvió determinista y no se detuvo a explorar.
- **Reward scale。**Las magnitudes de ventaja dependen de la escala de recompensa. Normaliza las recompensas, por ejemplo, para mantener la concordancia entre las diferentes tareas.

## Usalo

A2C/A3C en 2026 es muy poco la opción final, pero son la base de todos los posteriores refinamientos de la arquitectura:

| Method | Relation to A2C |
|--------|----------------|
| PPO | A2C + clipped importance ratio for multi-epoch updates |
| IMPALA | A3C + V-trace off-policy correction |
| SAC (Phase 9 · 07) | Off-policy A2C with a soft-value critic (next lesson) |
| GRPO (Phase 9 · 12) | A2C without the critic — group-relative advantage |
| DPO | A2C collapsed into a preference-ranking loss, no sampling |
| AlphaStar / OpenAI Five | A2C with league training + imitation pre-training |

Si en el periódico de 2026 ves una ventaja, piensa en el actor-crítico.

## Envío

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-actor-critic-trainer.md`¿Qué es esto ?

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

## Los ejercicios

1. **Easy。**En 4×4 GridWorld 上 utilizar ventaja MC(`G_t - V(s_t)`En el caso de los actores, la evaluación de la eficacia de la muestra se debe a la evaluación de la eficacia de la evaluación de la evaluación de la eficacia de la evaluación.
2. **Medium。**切换到 TD-residual advantage (en inglés: ventaja residual TD-residual advantage)`r + γ V(s') - V(s)`¿Cuánto ha disminuido la variación de los lotes de ventajas de medición?
3. **Hard。**实现 GAE(λ)。扫描 `λ ∈ {0, 0.5, 0.9, 0.95, 1.0}`◊ dibujar el retorno final vs la eficiencia de la muestra― esta tarea de sesgo/varianza punto dulce ¿Dónde está?

## Términos clave

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

## Leer más

- [Mnih et al. (2016). Asynchronous Methods for Deep Reinforcement Learning](https://arxiv.org/abs/1602.01783) A3C, inicial papel crítico de actores sincronizado
- [Schulman et al. (2016). High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438) GAE。
- [Sutton & Barto (2018). Ch. 13 — Actor-Critic Methods](http://incompleteideas.net/book/RLbook2020.pdf) fundamentos; cuando el crítico es la red neuronal 时,把它和 Ch. 9 de la función aproximación 配套阅读。
- [Espeholt et al. (2018). IMPALA](https://arxiv.org/abs/1802.01561) escalable distribuido actor-crítica con corrección fuera de la política de V-trace。
- [OpenAI Baselines / Stable-Baselines3](https://stable-baselines3.readthedocs.io/) 值得阅读的 producción A2C/PPO implementaciones。
- [Konda & Tsitsiklis (2000). Actor-Critic Algorithms](https://papers.nips.cc/paper/1786-actor-critic-algorithms) resultado de convergencia fundamental de la descomposición actor-crítica en dos escalas.
