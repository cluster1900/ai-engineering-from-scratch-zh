# RL de múltiples agentes

> El agente único RL 假设环境是静止的──把两个 agentes que están aprendiendo 放入同一个世界,这个假设就会失效: cada agente es parte de otro agente 环境, y ambos están en cambio──Multi-agent RL es un grupo de hacer aprender en la suposición de Markov 没有再成立时仍能收取技巧──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (Q-learning), Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~45 minutes

##  problemas

Un robot aprendiendo a navegar en la habitación, es un solo agente RL 问题── un equipo de fútbol 不是── AlphaStar对战StarCraft对手不是── un mercado compuesto por agentes de licitación 没有── dos vehículos negocia a través de la ruta de paramiento de cuatro direcciones tampoco── muchos problemas reales en muchos otros son no──

En cada entorno multi-agente, desde el punto de vista de cualquier agente, los otros agentes son parte del medio ambiente. Con el tiempo que aprenden a cambiar su comportamiento, el medio ambiente se vuelve no estacionario. La propiedad de Markov depende del estado actual y de mi acción.

Esto destruirá las pruebas de convergencia tabular (Q-learning) ⋅ también destruirá a los agentes de RL profundos ingenuos que se persiguen mutuamente en un ciclo, siempre incapaces de alcanzar una política estable ⋅ necesitas un multi-agente  专用技术:entrainamiento centralizado / ejecución descentralizada ⋅ líneas de base contrafactuales ⋅ juego de liga ⋅ auto-juego ⋅

Las aplicaciones del año 2026 incluyen: enjambres de robots, enrutamiento de tráfico, flotas de vehículos autónomos, simuladores de mercado, sistemas de LLM multi-agente, la fase 16), así como cualquier juego con más jugadores inteligentes.

## 概念

![Four MARL regimes: indep, centralized critic, self-play, league](../assets/marl.svg)

**Formalism: Markov Game.**MDP                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `S`、acción conjunta `a = (a_1, …, a_n)`、transición `P(s' | s, a)`, así como las recompensas de cada agente .`R_i(s, a, s')` Cada agente `i`En su propia política .`π_i`Si las recompensas son exactamente las mismas, es**fully cooperative**Si es suma cero, es**adversarial**Si se mezcla, entonces es**general-sum**¿Qué es eso?

**核心挑战：**

- **Non-stationarity.**Desde el agente`i`Desde el punto de vista,`P(s' | s, a_i)`取决于  `π_{-i}`, y está cambiando.
- **Credit assignment.**En la recompensa compartida, ¿quién es el agente que lo llevó?
- **Exploration coordination.**Los agentes deben explorar estrategias de intercambio, en lugar de volver a explorar el mismo estado.
- **Scalability.**Espacio de acción común`n`El número de personas en el mundo
- **Partial observability.**Cada agente sólo puede ver su propia observación; el estado global es oculto.

**四种主导范式：**

**1. Independent Q-learning / independent PPO (IQL, IPPO).**Cada agente aprendió su propia política o Q, y los demás agentes fueron parte del entorno.

**2. Centralized training, decentralized execution (CTDE).**Lo más habitual de los modernos es que cada agente tiene su propia política.`π_i`, se basa en la observación local .`o_i`Para la implementación de este programa, la implementación estándares de la ejecución descentralizada.`Q(s, a_1, …, a_n)`El estado global completo y la acción conjunta en condiciones:
- **MADDPG**(Lowe et al. 2017): 带有每个代理 一个集中批评的 DDPG──
- **COMA**(Foerster et al. 2017): base contrafactual 问`a'`¿Cuál es mi recompensa? ¿Separado de mi contribución?
- **MAPPO**- ¿ Qué ?**IPPO**con el crítico compartido (Yu et al. 2022): 带有集中价值功能的 PPO──2026年合作社 MARL 中的主导方法──
- **QMIX**(Rashid et al. 2018): decomposición del valor`Q_tot(s, a) = f(Q_1(s, a_1), …, Q_n(s, a_n))`,并使用 mezcla monótona。

**3. Self-play.**Las dos copias de un agente se enfrentan a la otra. La política de los demás. La política de los demás.

**4. League play.**Auto-juego hacia entornos de suma general / adversarios: retener un grupo de políticas pasadas y actuales, desde la liga a la selección de oponentes, y dirigirse a ellos entrenar.

**Communication.**允许 agentes  entre ellos enviar mensajes aprendidos `m_i` En entornos cooperativos 中有效──Foerster et al. (2016) 表明,diferenciable inter-agentes comunicación puede ser entrenado de extremo a extremo──Hoy basado en sistemas multi-agentes de LLM (Fase 16) en esencia se utiliza la lengua natural comunicación──


```figure
f3-marl-orbit
```

## Construirlo

Este curso utiliza un 6×6 GridWorld, que contiene dos agentes cooperativos. Ellos comienzan desde la esquina de la relación, deben alcanzar un objetivo compartido.`-1`Dos cosas llegan .`+10`参见 `code/main.py`¿Qué es eso?

### 步骤 1: entorno multiagente

```python
class CoopGridWorld:
    def __init__(self):
        self.size = 6
        self.goal = (5, 5)

    def reset(self):
        return ((0, 0), (5, 0))  # 两个 agents

    def step(self, state, actions):
        a1, a2 = state
        new1 = move(a1, actions[0])
        new2 = move(a2, actions[1])
        done = (new1 == self.goal) and (new2 == self.goal)
        reward = 10.0 if done else -1.0
        return (new1, new2), reward, done
```

* Espacio de acción conjunto `|A|² = 16`El estado global es de dos posiciones.

### 步骤 2: aprendizaje independiente de Q

Cada agente 运行自己的Q-table,以共同状态 作为关键. Cada paso:两者都选择 ε-greedy actions, recoger la transición conjunta,并各自使用共享奖励 更新自己的Q──

```python
def independent_q(env, episodes, alpha, gamma, epsilon):
    Q1, Q2 = defaultdict(default_q), defaultdict(default_q)
    for _ in range(episodes):
        s = env.reset()
        while not done:
            a1 = epsilon_greedy(Q1, s, epsilon)
            a2 = epsilon_greedy(Q2, s, epsilon)
            s_next, r, done = env.step(s, (a1, a2))
            target1 = r + gamma * max(Q1[s_next].values())
            target2 = r + gamma * max(Q2[s_next].values())
            Q1[s][a1] += alpha * (target1 - Q1[s][a1])
            Q2[s][a2] += alpha * (target2 - Q2[s][a2])
            s = s_next
```

Es eficaz en esta tarea, porque las recompensas son densas y en conjunto. En tareas estrechamente vinculadas, por ejemplo, un agente debe esperar a la tarea de otro agente.

### Paso 3: actualización de Q centralizada y valor descompuesto

Para acciones conjuntas utiliza una Q:`Q(s, a_1, a_2)` Usar la recompensa compartida 更新──执行时通过边缘化 来分散化:`π_i(s) = argmax_{a_i} max_{a_{-i}} Q(s, a_1, a_2)`¡La acción conjunta de la clase índice se sustituye por una visión global* correcta

### 步骤 4: 简单 auto-juego

Con un agente, dos roles.`K`个集,把 A's Weights 复制到 B――对称训练,进展一致――AlphaZero recipe 的缩写版――

## 常见陷

- **Non-stationary replay.**Usando agentes independientes, la experiencia se repite mejor que un agente único, peor, porque las viejas transiciones son de los oponentes ya superados.
- **Credit assignment ambiguity.**长 episodio 后得到共享奖励;没有明确方式说明哪个代理做出贡献──修复:counterfactual baselines(COMA),或按代理做奖励塑造──
- **Policy drift / chasing.**La mejor respuesta de cada agente se produce con la actualización y cambio de otro agente.
- **Reward hacking via coordination.**Los agentes 找到了设计者没有预期到的协调 exploits──Augmentistas 会收到报价零──修复:谨慎的奖励设计、行为限制──
- **Exploration redundancy.**两个 agentes 探索相同的状态行动对──修复: cada agente utiliza bonificaciones de entropía, o acondicionamiento de roles──
- **League cycles.**純自遊可能卡在支配周期 中──修复:使用包含多样对手的联赛比赛──
- **Sample explosion.** `n`个 agentes × espacio de estado × acciones conjuntas。用 función aproximación 近似; utilizar espacios de acción factorados(cada agente una cabeza de salida de política)。

## Usalo

2026 años MARL 应用图谱:

| Domain | Method | Notes |
|--------|--------|-------|
| Cooperative navigation / manipulation | MAPPO / QMIX | CTDE；shared critic + decentralized actors。 |
| Two-player games (chess, Go, poker) | Self-play with MCTS (AlphaZero) | Zero-sum；对称训练。 |
| Complex multiplayer (Dota, StarCraft) | League play + imitation pretraining | OpenAI Five, AlphaStar。 |
| Autonomous-vehicle fleets | CTDE MAPPO / PPO with attention | Partial obs；可变 team sizes。 |
| Auction markets | Game-theoretic equilibrium + RL | 当 `n` → ∞ 时使用 mean-field RL。 |
| LLM multi-agent systems (Phase 16) | Natural-language comm + role conditioning | RL loop 位于 agent-planning layer。 |

En 2026 el mayor crecimiento de MARL se basará en el sistema de LLM: el grupo de agentes del modelo de lenguaje que componen se consultará, debatirá, construirá software.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-marl-architect.md`¿Qué es esto ?

```markdown
---
name: marl-architect
description: 为给定任务选择正确的 multi-agent RL regime（IPPO, CTDE, self-play, league）。
version: 1.0.0
phase: 9
lesson: 10
tags: [rl, multi-agent, marl, self-play]
---

给定一个包含 `n` 个 agents 的任务，输出：

1. Regime classification。Cooperative / adversarial / general-sum。说明理由。
2. Algorithm。IPPO / MAPPO / QMIX / self-play / league。理由要关联 coupling tightness 和 reward structure。
3. Information access。Centralized training（哪些 global info 会进入 critic）？Decentralized execution？
4. Credit assignment。Counterfactual baseline、value decomposition，或 reward shaping。
5. Exploration plan。Per-agent entropy、population-based training，或 league。

在 tightly-coupled cooperative tasks 上拒绝 independent Q-learning。拒绝为存在 cycle risks 的 general-sum 推荐 self-play。标记任何没有 fixed-opponent eval 的 MARL pipeline（cherry-picked self-play numbers 很常见）。
```

##  ejercicios

1. **Easy.**En la cooperativa de 2 agentes GridWorld 上 entrenar aprendizaje Q independiente. Necesita cuántos episodios para hacer que el retorno sea > 0?
2. **Medium.**Añadir una misión de coordinación: ¿Sólo cuando dos agentes en el mismo ciclo se lanzan a un objetivo, se calcula que se alcanza el objetivo? ¿Q independiente todavía puede recibir? ¿Qué fallará?
3. **Hard.** Realizar un critico centralizado de formación en el estilo MAPPO y coordinar la tarea de convergencia con PPO independiente.

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Markov game | "Multi-agent MDP" | `(S, A_1, …, A_n, P, R_1, …, R_n)`；每个 agent 都有自己的 reward。 |
| CTDE | "Centralized training, decentralized execution" | Training time 使用 joint critic；每个 agent 的 policy 只使用 local obs。 |
| IPPO | "Independent PPO" | 每个 agent 单独运行 PPO。简单 baseline；经常被低估。 |
| MAPPO | "Multi-agent PPO" | 带有以 global state 为条件的 centralized value function 的 PPO。 |
| QMIX | "Monotonic value decomposition" | `Q_tot = f_monotone(Q_1, …, Q_n)` 允许 decentralized argmax。 |
| COMA | "Counterfactual multi-agent" | Advantage = 我的 Q 减去对我的 action 做 marginalizing 后的 expected Q。 |
| Self-play | "Agent vs past self" | 单个 agent，两个 roles；zero-sum games 的标准方法。 |
| League play | "Population training" | 缓存过去的 policies，从 pool 中采样 opponents；处理 strategy cycles。 |

## 延伸阅读

- [Lowe et al. (2017). Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments (MADDPG)](https://arxiv.org/abs/1706.02275) 带 centralizado crítico de CTDE。
- [Foerster et al. (2017). Counterfactual Multi-Agent Policy Gradients (COMA)](https://arxiv.org/abs/1705.08926) Utilizando las líneas de base contrafactuales de asignación de crédito。
- [Rashid et al. (2018). QMIX: Monotonic Value Function Factorisation](https://arxiv.org/abs/1803.11485) 带 monotonicidad de la descomposición de valor.
- [Yu et al. (2022). The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games (MAPPO)](https://arxiv.org/abs/2103.01955) PPO contra MARL por el deseo de la gente
- [Vinyals et al. (2019). Grandmaster level in StarCraft II using multi-agent reinforcement learning (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z) Grandes jugadas de liga.
- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270) juegos de suma cero 中的纯自动玩──
- [Sutton & Barto (2018). Ch. 15 — Neuroscience & Ch. 17 — Frontiers](http://incompleteideas.net/book/RLbook2020.pdf)                                                                                                                                                                                                                                                              
- [Zhang, Yang & Başar (2021). Multi-Agent Reinforcement Learning: A Selective Overview](https://arxiv.org/abs/1911.10635)                                                                                                                                                                                                                                                              
