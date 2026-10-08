# Votación, autoconcordancia y topología del debate

> La agregación más conveniente: tomar N 个 independiente agentes, luego mayoría-voto──Wang et al. 2022 autoconsistencia Usar un modelo 采样 N 次来做这个事──Multi-agent 通过 **heterogeneous**Los agentes  ampliarlo, para escapar de la monocultura, diferentes modelos, diferentes prompts, diferentes temperaturas, diferentes contextos.**graph 最适合 research**, y más de 4 agentes 后会出现协调税──AgentVerse(ICLR 2024) registró dos tipos de patrones emergentes, comportamientos voluntarios y comportamientos de conformidad, mientras que la conformidad 既是一个特征,也是一风险,也是一风险,Lesson 24)──本课会绘画拓拓空间,构建每种变体,并测量协调税──

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Fase 16 · 07 (Sociedad de la mente y el debate), Fase 16 · 14 (Consenso y BFT)
**Time:** ~75 minutes

##  problemas
El debate puede aumentar la precisión, depende de cuatro opciones estructurales:

1. 谁和谁对话 (topología)
2. Doos rondas ((De 2023: rondas y agentes son independientes de cada uno)
3. Los agentes de la monocultura son heterogéneos o no.
4. Sí existe una voz adversaria (steel-manning vs. straw-manning)

Para ejecutar 5 agentes y votar, los equipos de la tarea, siempre más que un solo agente, más que nunca, el fracaso no es casual.

## 概念
### Autoconsistencia, modelo único de referencia

Wang et al. 2022(AutoConsistencia Mejora la cadena del razonamiento del pensamiento) en temperatura > 0 时对同一个模型采样 N 次,并对理性-path答案做做多数投票──GSM8K 上的结果是:N=40 muestras 相比单个贪解码 有显著提升──AutoConsistencia es multi-agente de votación 单个代理 前身──

限制:auto-consistencia Utiliza un modelo base―errores en la estructura es correlacionado―si el modelo tiene sesgo sistemático, todas las muestras N 个 都会共享它―

### Voto multi-agente, extensión heterogénea

Utilizando N 个* diferentes* agentes 替代 N 个样本;; diferentes modelos base;;Claude、GPT、Llama) 、 diferentes instrucciones、 diferentes acceso a herramientas。收益:errores no correlacionados。成本:不同 agents 的成本不同;协调它们会增加的总费──

El debate heterogéneo en 2026 año canónico 名称是**A-HMAD**, es decir, el debate heterogéneo multiagente adversario. Este nombre aún no ha sido adoptado generalizadamente, pero el artículo lo utiliza para representar el debate de diferentes modelos, lo que reduce los errores correlacionados del colapso de la monocultura.

### Cuatro topologías

```
star                chain               tree                graph

    ┌─A─┐           A─B─C─D         ┌──A──┐              A───B
    │   │                           │     │              │ × │
    B   C                           B     C              D───C
    │   │                          / \   / \
    D   E                         D   E F   G           (fully connected)
```

Estrella: un centro, todos los demás agentes sólo y el centro para hablar.
Cadena: estructura de la cadena, cada agente see anterior uno de los agentes ∞
Árbol: estructura de nivel, por sistemas de agentes jerárquicos.
Gráfico: cualquier a cualquier. Incluye clique totalmente conectado y cualquier DAGs.

### Impuesto de coordinación (MultiAgentBench)

MultiAgentBench(MARBLE, ACL 2025, arXiv:2503.01935) en una suite de tareas que contiene investigación、código y planificación  了 star、chain、tree、graph──

- **Graph**Topología en tareas de investigación 上获胜──信息 cualquiera a cualquiera 流动; agentes pueden criticarse mutuamente──
- **Star**En tareas de respuesta rápida y factuales 上获胜──Hub 负责 filter 和 consolidar──
- **Chain**En los oleoductos gradual (en etapas de refinamiento)
- **Coordination tax**En la topología gráfica aparecen más de 4 agentes.

El techo de 4 agentes es empírico, no fundamental. Reflecta la capacidad del contexto de LLM de 2026: el contexto de cada agente es llenado por los resultados de sus pares; una vez que todos puedan ver a todos, el valor marginal del agregado de agente N+1 se reducirá.

### Estrategias de debate multi-agentes ¿Deberíamos estar volviéndonos locos?

ArXiv:2311.17371 es un estudio de estrategias MAD de 2023 ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅    ⋅ ⋅                                                                                                                                                     

### Los patrones emergentes de agenteVerse

AgenteVerse(ICLR 2024, https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf）记录了En el debate multi-agente, incluso sin un diseño manifiesto, surgen dos tipos de comportamientos:

- **Volunteer。**El agente 主动提供帮助(Puedo dar el siguiente paso)。 útil: se asigna el trabajo al agente más adecuado de una subtarefa。
- **Conformity。**El agente 调整 su propia posición para adaptarse al crítico, incluso el crítico es erróneo.

Conformidad  explicó por qué el debate hasta el acuerdo 会奖励欺凌者──Runs restringidos 加上独立法官 可以缓解──

### Heterogeneidad: realmente impulsa la precisión de la rotación

Un modelo en la literatura práctica de 2024-2026: transformar uno de los N 个 agentes en un modelo base diferente, aumentar la precisión generalmente más grande que aumentar N 1―直觉是单文化, cada nueva fuente de error independiente tiene más de una muestra correlacionada adicional que tiene más valor―

En casos extremos, la heterogeneidad supera la numeridad. En la mayoría de las tareas de la verdad de base, tres modelos diferentes superan cinco copias de un modelo.

### Métodos de los jurados

En la literatura de Minsky-LLM se cita en el marco de Sibyl) formalizado un jurado, es decir, un pequeño grupo de agentes especializados, en cada etapa, a través de votaciones para refinar las respuestas. Diferente del voto de la mayoría ordinaria, el jurado tiene funciones: un agente inter-examinos, un proveedor de contexto, un proveedor de plausibilidad.

### Cuando el voto con debate domina

- 问题有基础真理 (hactos, matemáticas, comportamiento de código) ⋅ Convergencia de votos es significativa.
- Los agentes pueden acceder a diferentes fuentes o herramientas (heterogeneidad disponible)
- Las rondas tienen límites (normalmente 2-3), y hay juez o verificador independiente.
- El presupuesto permite 3-5 agentes. En la topología gráfica, más de 5-7 agentes.

### Cuando el voto con el debate duele

- problemas presentando en forma de opinión.  Los agentes recibirán la respuesta que parece más segura, no la más correcta.
- Todos los agentes compartieron un modelo básico.
- Rondas sin límite. Conformidad. Cada vez ganaremos.
- 任务很简单――使用N=5 autoconsistencia de un solo agente 更便宜,精度 也差不多――


```figure
sw-debate-topology
```

## Construirlo
`code/main.py` realización:

- `run_star(agents, hub, question)` hub 轮询 cada trabajador y agregado
- `run_chain(agents, question)` refinamiento secuencial。
- `run_tree(root, children, question)` estructura jerárquica de la agregación profundidad-2
- `run_graph(agents, question, rounds)` debate general, rondas limitadas―
- Un guión heterogéneo dial: cada agente tiene un .`error_bias`, muestra su error sistemático.
- Un arnés de medición, en N=3、5、7 下运行每种类型,并报告(exactitud、total_tokens、wallclock_simulated)

运行:

```
python3 code/main.py
```

预期输出:一张拓学 × N →(precisión、tokens、latency) 表──Graph 在 N=3-5 de tareas de estilo de investigación 上获胜;star 在快速事实任务 上获胜;N=7 的图表 显示协调税(latency膨胀速度快于准确性) ⋅

## Usalo
`outputs/skill-topology-picker.md`Es una habilidad, se lee la descripción de tareas, se propone la topología, la estrella / cadena / árbol / gráfico)

##  entregarlo
Para cualquier conjunto:

- Desde el uso de un modelo base fuerte de**self-consistency at N=5**Es un buen punto de partida.
- Si la precisión es importante, subir hasta**heterogeneous voting at N=3**◊ la medida del delta.
-  sólo cuando las tareas tienen estructura  investigación  múltiples pasos  y rondas limitadas **debate topology**¿Qué es eso?
- Siempre registran grupos minoritarios. Cuando la minoría se mantiene en el tiempo correcto, tienes una señal de diversidad.
- En la precisión 旁边同时基准墙-钟和代币──10x 成本换来更高精度是一个商业决定──

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` La curva de coordinación-taxa de la topología de gráficos: exactitud vs N ̊tokens vs N ̊曲线在什么 N 处 inflect?
2. 实现 A-HMAD: tres agentes con diferentes prejuicios intentados.  En el ataque de monocultura de la lección 14, ¿cómo se compara la base de todos los mismos prejuicios con A-HMAD?
3. 给图表topology 添加一个评委角色, no vota, sólo por el consenso final 打分. ¿Esto cambiará el comportamiento de conformidad emergente?
4. 阅读 AgentVerse paper(ICLR 2024) ――识别你的实现最强烈展现的是哪种新兴行为──你能通过快速变化 引出相反的行为 吗? ¿Cómo es posible que el cambio se produzca rápidamente?
5. 阅读 MultiAgentBench(arXiv:2503.01935) Sección 4(experimentos topológicos)。Uses your harness 在论文中的一个任务上复现图表-wins-research结果──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Self-consistency | “Sample N times, vote” | Wang 2022。Single model，N 个 temperature>0 samples，对 reasoning paths 做 majority vote。 |
| Heterogeneity | “Different models” | 由不同 base models 或 prompt families 组成的 ensemble。打破 monoculture。 |
| MAD | “Multi-agent debate” | agents 在多个 rounds 中交换 critiques 的通用术语。见 Du 2023。 |
| A-HMAD | “Adversarial Heterogeneous MAD” | 强调不同 models + adversarial structure 的 MAD variant。 |
| Topology | “Who talks to whom” | Star、chain、tree、graph。决定 information flow。 |
| Coordination tax | “Diminishing returns” | 在 graph 上超过约 4 个 agents 后，cost 增长快于 quality。 |
| Volunteer behavior | “Unprompted help” | AgentVerse emergent pattern：agent 主动提出承担一个 step。 |
| Conformity behavior | “Agreement under pressure” | AgentVerse emergent pattern：agent 与 critic 对齐。 |
| Jury | “Small specialized panel” | 带 roles（examiner、context、scorer）的 Sibyl-style ensemble。 |

## 延伸阅读
- [Wang et al. — Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/abs/2203.11171) Línea de base para un modelo único
- [Du et al. — Improving Factuality and Reasoning via Multiagent Debate](https://arxiv.org/abs/2305.14325)Los agentes y las rondas son importantes independientemente.
- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) índice de referencia de topología, muestra gráfico, cadena  adaptado a la investigación
- [Should we be going MAD?](https://arxiv.org/abs/2311.17371) Encuesta de estrategia de MAD; hallazgo de presupuestos iguales
- [AgentVerse (ICLR 2024)](https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) Voluntariado y patrones emergentes de conformidad
- [MARBLE repo](https://github.com/ulab-uiuc/MARBLE) Implementación de los índices de referencia
