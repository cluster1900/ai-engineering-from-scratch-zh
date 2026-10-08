# MARL  MADDPG, QMIX, MAPPO

> En el año 2026 todavía afectará al sistema de agentes de LLM.**MADDPG**(Lowe et al., NeurIPS 2017, arXiv:1706.02275)  introdujo la Capacitación Centralizada, Ejecución Descentralizada (CTDE): durante el entrenamiento, cada crítico puede ver el estado y movimiento de todos los agentes; el test en el que solo se ejecuta un actor local.**QMIX**(Rashid et al., ICML 2018, arXiv:1803.11485) es la descomposición de valor de la red de mezcla monótona; cada agente de Q 会组合成 conjunto Q, por lo tanto `argmax`Se puede distribuir de forma directa a cada agente en el StarCraft Multi-Agent Challenge (SMAC).**MAPPO**(Yu et al., NeurIPS 2022, arXiv:2103.01955) es una función de valor centralizada PPO; en el mundo de partículas, SMAC, Google Research Football, Hanabi, sólo se necesita muy poco de modificación sobre  sorprendentemente eficaz── estos métodos apoyan la política de equipo de agentes de acción entrenamiento──MAPPO es**2026 年 cooperative-MARL 的默认 baseline** Esta clase se desarrollará desde un pequeño juguete de red-mundo  Construir cada método, antes de contactar con el entrenamiento de agente LLM , primero, entrenar estas tres ideas en la memoria muscular 

**类型：**El aprendizaje
**语言：**Python (stdlib,小型无 NumPy 实现)
**先修：**Fase 09 (aprendizaje de refuerzo), Fase 16 · 09 (Redes de enjambres paralelas)
**时间：**- 90 minutos

##  problemas

La política de coordinación entre agentes de LLM: ¿何时 defer、何时 act、调用哪个同行──dice cómo entrenar este tipo de políticas. La documentación de esta política es el aprendizaje de refuerzo de múltiples agentes (MARL), que fue anterior a la ola de LLM, y ya tiene un pequeño grupo de algoritmos principales──

Si no hay un vocabulario de patrones, lee MARL 论文会很痛苦──entrenamiento centralizado con ejecución descentralizada (CTDE) ‧descomposición de valores y críticos centralizados no son palabras de moda  它们 son respuestas concretas a problemas concretos:

- RL independiente (cada agente 单独学习) desde el punto de vista de cada agente es no estacionario.
- RL centralizada (un agente control) no puede expandirse y viola las restricciones de ejecución.
- CTDE 兼得两者优点: con información global 训练, con políticas locales 部署。

## 概念

### 论文使用的三类环境

- **Particle World (multi-agent particle env)。**简单 2D física, incluye tarea cooperativa/competitiva―MADDPG original testbed―
- **StarCraft Multi-Agent Challenge (SMAC)。**La cooperación en el micro-gestión, la observación parcial, la evaluación de la calidad de la información, las acciones discretas, los estados continuos,
- **Google Research Football, Hanabi, MPE。**Línea de base del MAPPO:

Diferente env hay diferentes acciones/observaciones 类型──algoritmo 会据此选择──

### MADDPG (2017)  patrón de CTDE

Cada agente .`i`Hay un actor en la ciudad .`mu_i(o_i)`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , y , , , , , , , , y , , , , , , , , , , , ,`Q_i(x, a_1, ..., a_n)`, durante el entrenamiento ve todas las observaciones y todas las acciones.

```
actor update:    grad_theta_i J = E[grad_theta mu_i(o_i) * grad_a_i Q_i(x, a_1..n) at a_i=mu_i(o_i)]
critic update:   TD on Q_i(x, a_1..n) given next-state joint estimate
```

Por qué usar CTDE: cuando entrenamos, sabemos la acción de todos; usamos esta información para reducir la variación de cada crítico.`o_i`,并调用 `mu_i(o_i)`¿Qué es eso?

失败模式:critics 会随 N 个代理 增长 输入包含所有行动) ⋅ Si no hay aproximación, es muy difícil ampliar a ~10 个以上的代理──

### QMIX (2018)  Descomposición de valor

仅适用于合作社――Global reward 之和: 之和: 之和: 适用于合作社. Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和: Global reward 之和 之和: Global reward 之和 之和: Global reward 之和 之和 之和: Global reward 之和 之和 之和 之和 之和: Global reward 之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之之

```
Q_tot(tau, a) = f(Q_1(tau_1, a_1), ..., Q_n(tau_n, a_n)),   df/dQ_i >= 0
```

Monotonismo , seguro .`argmax_a Q_tot`Puede pasar por cada agente  Independent Select `argmax_{a_i} Q_i`Para calcular esto es lo que necesitas.**decentralized execution property** Entrenamiento, mezcla de red de cada agente de la Q 生成 `Q_tot`¿Qué es eso?

Por qué QMIX en SMAC 上获胜:cooperative StarCraft micro-management 具有同质的代理商、本地 obs、全球奖励 与价值分解 完美契合──

失败模式:constraint monotonicity 限制较强; algunas tareas de la estructura de recompensa no es monótono descomponible (por ejemplo, un agente para el sacrificio del equipo)  extender métodos (QTRAN、QPLEX)  liberar este punto.

### MAPPO (2022)  被低估的默认选择

Multi-Agent PPO:带集中价值函数的 PPO── cada agente tiene su propia política; todos los agentes 共享(或拥有 per-agent) pueden ver el estado completo de la función de valor── Yu et al. 2022 在五个基准上将MAPPO与MADDPG、QMIX 及其扩展进行比较,并发现:

- MAPPO en el mundo de las partículas, SMAC, Google Research Football, Hanabi, MPE, y más allá de la política MARL 方法.
- Necesidad de ajuste de hiperparámetro 极少──
- 训练稳定; transsear 可复现──

Antes de este artículo, la comunidad había subestimado la MARL en política. Hasta 2026, el MAPPO es la base de referencia de la MARL cooperativa; cualquier nuevo método debe vencerlo.

### ¿Por qué el ingeniero de agente LLM debería preocuparse?

Tres usos directos:

1. **Router training。**Meta-agente  seleccionar qué sub-agente  procesar tarea― es una que contiene N 个分级代理 和一个集中路由器的 MARL 问题―MAPPO 适合―
2. **Role emergence。**En la simulación de agente generativo, el agente de entrenamiento a medida que se adopta el papel complementario, es en esencia un problema de MARL  de forma falsa                                                                                                                                                                                                                                           
3. **Multi-agent tool use。**Cuando los agentes comparten herramientas y no compiten con el presupuesto, a través de la capacitación CTDE pueden obtener políticas locales desplegables y respetar las restricciones de recursos.

实践提醒: hasta 2026 años, la mayoría de la producción de LLM-agentes 系统 es la política de los mismos, en lugar de entrenarlos.

### CTDE como patrón de diseño fuera de RL 

Incluso no entrenar, CTDE también es útil patrón de arquitectura:

- En la fase de diseño, supongamos tener visibilidad completa del equipo.
- En la etapa de ejecución, la ejecución descentralizada es obligatoria.`o_i`¿Qué es eso?

Este patrón te obliga a determinar el mantenimiento por estado de agente,并提前思考部分可观性── muchos sistemas de producción multi-agente 默默假设 de todas partes tienen estado compartido  disciplina CTDE puede prevenir esto──

### no estacionariedad 问题

Cuando varios agentes, al mismo tiempo que se aprende, cada agente de entorno (incluyendo la política de otros agentes) son no estacionarios.

- MADDPG: el crítico global ve todas las acciones, por lo que su estimación de valor es estacionaria.
- QMIX: la descomposición de valores transferirá el aprendizaje al espacio de Q conjunta, donde la óptimalidad tiene un significado definido.
- MAPPO: función de valor centralizado que inhibe la variación de cambios en las políticas de otros agentes.

En el sistema de agentes de LLM, la no estacionariedad se manifiesta como mi agente 上个月还正常, ahora arriba游另一个代理 改了,我的就异常了──带 CTDE的 MARL training是原则性的修复方式;

### 本课不涵盖什么

训练真实网络是Phase 09 的主题──本课构建脚本政策 版本,在没有梯次更新的情况下演示CTDE、值分解和集中值模式──目标是你使用完整的 MARL library((PyMARL、MARLlib、RLlib multi-agent) 之前,先内化这些模式──


```figure
sw-ctde
```

## Construirlo

`code/main.py`En un pequeño mundo de cooperativas de 2 agentes, se realizó tres patrones:

- Medio ambiente: 2 个代理 在4x4网上, una recompensa pellet──Reward = Si un agente llega a la pellet 则为 1;Tarea 结束──
- `IndependentAgents` Cada agente, cada otro agente, en el entorno.
- `MADDPGStyle` crítica centralizada 计算共同价值; actor policy 从中更新;; mejora de la política escrita。
- `QMIXStyle` Utiliza descomposición de valores del mezclador monótono。
- `MAPPOStyle` función de valor centralizada; política basada en la línea de base compartida 更新。

Cuatro personas ejecutaron el mismo episodio,并 reportaron el promedio de pasos a objetivos.

运行:

```
python3 code/main.py
```

预期输出:agentes independientes 平均需要 ~6 步; CTDE variante 会收到 ~3.5 步(4x4 grid 的最佳是3)── incluso utilizando políticas scripted, el patrón 差异也会显现──

## Usalo

`outputs/skill-marl-picker.md`Es una habilidad utilizada para determinar la tarea multiagente  seleccionar el algoritmo MARL: cooperativo vs competitivo  homogéneo vs heterogéneo  tipo de espacio de acción  escala  señal de recompensa 

##  entregarlo

MARL en producción 很少见──当你确实使用它时:

- **从 MAPPO 开始。**El artículo de 2022 lo establecerá como línea de base; primero, puede ser revisado en las próximas semanas para perseguir métodos más sofisticados.
- **记录每个 agent 的 observation 和 action stream。**No hay rastro de agentes, deshacerse de MARL casi no hay esperanza.
- **分离 training code 和 execution code。**El CTDE es una disciplina; deja que el camino de ejecución Verdes sólo ver`o_i`¿Qué es eso?
- **Reward shaping 警告。**MARL para el diseño de recompensas 极其敏感──forming en un bug de coordinación, agente 就会学会利用它──运行对抗性测试──
- **对于 LLM agents**, priorizar las políticas de nivel inmediato― sólo cuando los datos de interacción + señal de recompensa + infraestructura están disponibles, para iniciar la formación MARL―

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ Diferencia de paso a objetivo entre agentes independientes de medición y agentes de estilo MAPPO ◊ En la cuadrícula de 6x6, ¿esta diferencia será mayor o menor?
2.  Realizar una variante competitiva: dos agentes, una pelleta, sólo el primer agente que llega  obtener una recompensa  ¿Qué tipo de patrón  puede hacer frente a la competencia  Históricamente es MADDPG‬
3. 阅读 MADDPG (arXiv:1706.02275) Sección 3―Uz tu propia palabra,以伪代码 形式 simbólicamente 实现确切的批判更新规则―
4. 阅读MAPPO (arXiv:2103.01955) ――为什么作者认为集中价值+PPO在他们的基准上胜过非政策 MARL?列出三个强强主张──
5. ¿Hay algún tiempo de diseño disponible, pero de ejecución de información conjunta indispensable?

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| MARL | "Multi-Agent RL" | 面向 multi-agent 系统的 Reinforcement Learning。 |
| CTDE | "Centralized Training, Decentralized Execution" | 用 global info 训练；用 local policies 部署。 |
| MADDPG | "Multi-Agent DDPG" | CTDE，每个 agent 的 critic 能看到所有 observations + actions。 |
| QMIX | "Value decomposition" | 每个 agent 的 Q 的 monotonic mixing。Cooperative。 |
| MAPPO | "Multi-Agent PPO" | 带 centralized value function 的 PPO。2026 年默认 baseline。 |
| Value decomposition | "Sum of individual Qs" | Joint Q 表示为每个 agent 的 Q 的 monotone function。 |
| Non-stationarity | "Moving targets" | 当其他 agent 学习时，每个 agent 的 env 都在变化。MARL 的核心问题。 |
| On-policy / off-policy | "Learn from current / replay" | PPO 是 on-policy (MAPPO)；DDPG 和 Q-learning 是 off-policy。 |
| SMAC | "StarCraft Multi-Agent Challenge" | cooperative micromanagement benchmark；QMIX 的本土主场。 |

## 延伸阅读

- [Lowe et al. — Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments](https://arxiv.org/abs/1706.02275) MADDPG;NeurIPS 2017
- [Rashid et al. — QMIX: Monotonic Value Function Factorisation for Deep Multi-Agent Reinforcement Learning](https://arxiv.org/abs/1803.11485) QMIX;ICML 2018
- [Yu et al. — The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games](https://arxiv.org/abs/2103.01955) MAPPO;NeurIPS 2022
- [BAIR blog post on MAPPO](https://bair.berkeley.edu/blog/2021/07/14/mappo/) para el marco fácil de leer de los resultados de MAPPO
- [SMAC repository](https://github.com/oxwhirl/smac) StarCraft Multi-Agent Challenge
