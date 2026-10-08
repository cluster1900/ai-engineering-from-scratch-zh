# Redes Q profundas (DQN)

> 2013:Mnih en los píxeles primitivos 上 entrenó una red de Q-learning, en siete juegos Atari  derrotó a todos los agentes RL clásicos. 2015: expandió a 49 juegos, publicado en Nature 上,点燃了深度RL时代.

**类型：**Construir
**语言：**Python
**前置要求：**Fase 3 · 03 (repropagación), Fase 9 · 04 (aprendizaje Q, SARSA)
**时间：**~ 75 minutos

##  problemas

El aprendizaje de Q tabulado  necesita para cada uno (estado, acción) para guardar un valor Q. Una tabla de ajedrez ∼ aproximadamente 1043 estados ∼ una  Atari 画面是 210×160×3 = 100,800 个特征── Tabulado RL en varios miles de estados 时就会失效,更不用说数十亿个州──

Lo que pasa es que es evidente que se ha modificado con la red neuronal.`Q(s, a; θ)` sustituir la tabla Q-¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

1. **Experience replay**让过渡 去相关──
2. **Target network**结 objetivo de arranque.
3. **Reward clipping**归一化 Gradiente 幅度──

El DQN de Atari arriba es la primera vez que utiliza un único arquitetura y un único hiperparámetro 集合, desde los píxeles originales  resolver varios problemas de control  posteriormente todos los métodos deep-RL construidos, incluyendo DDQN, Rainbow, Dueling, Distribucional, R2D2, Agent57, están superpuestos en esta base de tres técnicas .

## 概念

![DQN training loop: env, replay buffer, online net, target net, Bellman TD loss](../assets/dqn.svg)

**目标。**DQN en función Neural Q 上 minimizar pérdida TD de un paso:

`L(θ) = E_{(s,a,r,s')~D} [ (r + γ max_{a'} Q(s', a'; θ^-) - Q(s, a; θ))² ]`

`θ`= red en línea, cada paso a través de Descenso Gradiente 更新──`θ^-`= red objetivo, periodicidad desde`θ`复制(约每10,000 步一次)`D`= Buffer de reproducción de las transiciones pasadas.

**三个技巧，按重要性排序：**

**Experience replay。**Un contenido`~10⁶`Cada paso de entrenamiento está en un pequeño grupo. Esto rompe el tiempo de la conexión. Las marcas de entrenamiento son casi idénticas.

**Target network。**En Bellman  Equipo ambos lados usan la misma red `Q(·; θ)`, dejará que el objetivo en cada actualización se mueva, es decir, seguir su propio tabotape running──`Q(·; θ^-)`, sus pesos 结──每隔 `C`步,复制 `θ → θ^-`Esto permitirá que el objetivo de regresión en miles de pasos graduales en mantenerse estable.`θ^- ← τ θ + (1-τ) θ^-`(para DDPG, SAC) es un cambio más suave.

**Reward clipping。**La amplitud de recompensa de Atari es de 1 a 1000+`{-1, 0, +1}`Puede detener un Gradiente de dominio de un solo juego. Cuando la magnitud de la recompensa es importante, es un error. Pero para Atari, puede, porque sólo los símbolos son importantes.

**Double DQN。**Hasselt (2016) 修复了最大化偏见: usar la red en línea 来*选择* acción, usar la red de objetivo 来*评估*它。

`target = r + γ Q(s', argmax_{a'} Q(s', a'; θ); θ^-)`

Esto es un reemplazo de caída, el efecto está mejor.

**其他改进（Rainbow, 2017）：**Reproducción priorizada(更多采样 alto TD-error transiciones) ]] Dueling arquitectura(分离 `V(s)`Y las cabezas de ventaja) 、 redes ruidosas) 、 exploración aprendida) 、 n-grados de retorno 、 Q (C51/QR-DQN) 、 multi-grados de arranque ‖ cada uno de ellos traerá varios cientos de puntos de aumento; ‖


```figure
f3-dqn-stability
```

## Construirlo

El código aquí es sólo stdlib y libre de numpy: estamos en una pequeña red continua GridWorld 上 usando MLP de capas ocultas escritas a mano, por lo que cada paso de entrenamiento puede ejecutarse en microsecondas.

### Paso 1: Reproduce el amortiguador

```python
class ReplayBuffer:
    def __init__(self, capacity):
        self.buf = []
        self.capacity = capacity
    def push(self, s, a, r, s_next, done):
        if len(self.buf) == self.capacity:
            self.buf.pop(0)
        self.buf.append((s, a, r, s_next, done))
    def sample(self, batch, rng):
        return rng.sample(self.buf, batch)
```

Atari usa una capacidad de 50.000; nuestro entorno de juguetes usa 5.000.

### Paso 2: una red Q muy pequeña (MLP)

```python
class QNet:
    def __init__(self, n_in, n_hidden, n_actions, rng):
        self.W1 = [[rng.gauss(0, 0.3) for _ in range(n_in)] for _ in range(n_hidden)]
        self.b1 = [0.0] * n_hidden
        self.W2 = [[rng.gauss(0, 0.3) for _ in range(n_hidden)] for _ in range(n_actions)]
        self.b2 = [0.0] * n_actions
    def forward(self, x):
        h = [max(0.0, sum(w * xi for w, xi in zip(row, x)) + b) for row, b in zip(self.W1, self.b1)]
        q = [sum(w * hi for w, hi in zip(row, h)) + b for row, b in zip(self.W2, self.b2)]
        return q, h
```

Pasar hacia adelante: lineal → ReLU → lineal―, ése es toda la red―.

### 步骤 3: actualización de DQN

```python
def train_step(online, target, batch, gamma, lr):
    grads = zeros_like(online)
    for s, a, r, s_next, done in batch:
        q, h = online.forward(s)
        if done:
            y = r
        else:
            q_next, _ = target.forward(s_next)
            y = r + gamma * max(q_next)
        td_error = q[a] - y
        accumulate_grads(grads, online, s, h, a, td_error)
    apply_sgd(online, grads, lr / len(batch))
```

Su forma es Q-learning en la lección 04 , sólo hay dos puntos de diferencia:`Q(·; θ)`Hacer la retropropagación, en lugar de la tabla de indicios;`Q(·; θ^-)`¿Qué es eso?

### Paso 4: Bucle de la capa exterior

Para cada episodio, basado en`Q(·; θ)` ejecutar ε-compulsivo,把 transiciones 放入缓冲,采样 minibatch, ejecutar una vez Gradiente paso,并周期性同步 `θ^- ← θ`❖ Modelo como:

```python
for episode in range(N):
    s = env.reset()
    while not done:
        a = epsilon_greedy(online, s, epsilon)
        s_next, r, done = env.step(s, a)
        buffer.push(s, a, r, s_next, done)
        if len(buffer) >= batch:
            train_step(online, target, buffer.sample(batch), gamma, lr)
        if steps % sync_every == 0:
            target = copy(online)
        s = s_next
```

En este caso, en el pequeño GridWorld, el agente se encuentra en unos 500 episodios, en el Atari, se expande a 200 millones de cuadros y se añade un extractor de funciones de CNN.

## 常见陷

- **Deadly triad。**Aproximación de la función + fuera de la política + arranque posible发散──DQN Utilize target net + replay 缓解 this problem; don't remove any one──
- **Exploration。**ε 必须衰减, normalmente en la fase de aproximadamente el 10% de la formación previo a 1.0 衰减到0.01── Si la exploración temprana no es suficiente, Q-net 会收到局部盆──
- **Overestimation。**Para el ruido`max`Se producen diferencias de producción y producción de doble DQN.
- **Reward scale。**剪剪或归归化奖励; Gradiente 幅度与奖励 magnitud 成正比──
- **Replay buffer coldstart。**En el buffer  tener varios miles de transiciones  antes no entrenar ⋅ basado en aproximadamente 20 muestras de Gradientes tempranos ⋅
- **Target sync frequency。**太频繁 ≈ 没有目标网;太不频繁 ≈目标 过时――Atari DQN 使用 10,000 个 env steps──经验规则:每约1/100 个训练视界 同步一次──
- **Observation preprocessing。**Atari DQN 堆叠 4 , hacer estado 满足 Markov── cualquier contenido de información de velocidad del entorno  都 necesita de la estructura-estacling o estado recurrente──

## Usalo

Para 2026, DQN ya es muy poco de vanguardia, pero sigue siendo un algoritmo de referencia fuera de la política:

| Task | 首选 Method | 为什么不是 DQN？ |
|------|-------------|------------------|
| Discrete-action Atari-like | Rainbow DQN or Muesli | 同一框架，更多技巧。 |
| Continuous control | SAC / TD3 (Phase 9 · 07) | DQN 没有 policy network。 |
| On-policy / high-throughput | PPO (Phase 9 · 08) | 没有 replay buffer；更容易扩展。 |
| Offline RL | CQL / IQL / Decision Transformer | Conservative Q targets，没有 bootstrapping blowups。 |
| Large discrete action spaces (recommender) | DQN with action embedding, or IMPALA | 可以；细节装饰很重要。 |
| LLM RL | PPO / GRPO | Sequence-level，而不是 step-level；Loss 不同。 |

Estas experiencias siguen siendo generales. Reproduce y redes de destino aparecen en SAC, TD3, DDPG, SAC-X, AlphaZero, así como en cada método de RL fuera de línea.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-dqn-trainer.md`¿Qué es esto ?

```markdown
---
name: dqn-trainer
description: 为 discrete-action RL task 生成 DQN training config（buffer、target sync、ε schedule、reward clipping）。
version: 1.0.0
phase: 9
lesson: 5
tags: [rl, dqn, deep-rl]
---

给定一个 discrete-action environment（observation shape、action count、horizon、reward scale），输出：

1. Network。Architecture（MLP / CNN / Transformer）、feature dim、depth。
2. Replay buffer。Capacity、minibatch size、warmup size。
3. Target network。Sync strategy（hard every C steps 或 soft τ）。
4. Exploration。ε start / end / schedule length。
5. Loss。Huber vs MSE、gradient clip value、reward clipping rule。
6. Double DQN。默认启用，除非有明确理由禁用。

拒绝交付没有 target network、没有 replay buffer，或 ε 固定为 1 的 DQN。拒绝 continuous-action tasks（路由到 SAC / TD3）。标记任何 reward range > 10× per-step mean 的情况，说明需要 clipping 或 scale normalization。
```

##  ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ dibujar una curva de retorno por episodio―circuito medio 超-10 需要多少集?
2. **Medium。**禁用目标网络 (en inglés) 禁用目标网络 (en inglés) 禁用目标网络 (en inglés) 禁用目标网络 (en inglés) 禁用目标网络 (en inglés) 禁用目标网络 (en inglés) 禁用目标网络 (en inglés) 禁用目标网络 (en inglés) 禁用目标网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用网络 (en inglés) 禁用 (en inglés) 禁用 (en inglés) 禁用 (en inglés) 禁用 (en inglés) 禁用) 禁用 (en inglés) 禁用 (en inglés) 禁用 (en inglés)
3. **Hard。**添加 Double DQN: usar red en línea 选择 `argmax a'`, utilizar la red de destino 评估──Compare ruidosos retribuciones GridWorld 上训练 1,000 个集 后,使用与不使用双DQN 时`Q(s_0, best_a)`En realidad`V*(s_0)`El sesgo.

## 关键术语: "El hombre es un hombre"
| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| DQN | “Deep Q-learning” | 带有 Neural Q-function、replay buffer 和 target network 的 Q-learning。 |
| Experience replay | “Shuffled transitions” | 每个 Gradient step 都均匀采样的 ring buffer；让数据去相关。 |
| Target network | “Frozen bootstrap” | 用于 Bellman target 的 Q 的周期性副本；稳定训练。 |
| Deadly triad | “为什么 RL 会发散” | Function approximation + bootstrapping + off-policy = 没有收敛保证。 |
| Double DQN | “修复 maximization bias” | Online net 选择 action，target net 评估它。 |
| Dueling DQN | “V and A heads” | 分解 Q = V + A - mean(A)；输出相同，Gradient flow 更好。 |
| Rainbow | “所有技巧” | DDQN + PER + dueling + n-step + noisy + distributional 合在一起。 |
| PER | “Prioritized Replay” | 按 TD-error magnitude 成比例采样 transitions。 |

## 延伸阅读

- [Mnih et al. (2013). Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602)                                                                                                                                                                                                                                                              
- [Mnih et al. (2015). Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236) Nature 论文, 49 juego DQN。
- [Hasselt, Guez, Silver (2016). Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461) DDQN。
- [Wang et al. (2016). Dueling Network Architectures](https://arxiv.org/abs/1511.06581) Duelo de DQN。
- [Hessel et al. (2018). Rainbow: Combining Improvements in Deep RL](https://arxiv.org/abs/1710.02298) 叠加技巧的论文──
- [OpenAI Spinning Up — DQN](https://spinningup.openai.com/en/latest/algorithms/dqn.html) 清晰的现代讲解──
- [Sutton & Barto (2018). Ch. 9 — On-policy Prediction with Approximation](http://incompleteideas.net/book/RLbook2020.pdf) 教科書中对 致命三三 (aproximation de funciones + bootstrapping + fuera de la política) de tratamiento; red objetivo de DQN y buffer de reproducción está diseñado para cumplir con ello.
- [CleanRL DQN implementation](https://docs.cleanrl.dev/rl-algorithms/dqn/) Utilizado para la referencia de estudios de ablación DQN de archivo único; adaptado con la versión de cero de esta clase 阅读一起──
