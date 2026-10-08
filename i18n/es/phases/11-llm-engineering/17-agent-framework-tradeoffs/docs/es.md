# Marco de agentes 取舍  LangGraph vs CrewAI vs AutoGen vs Agno

> Cada marco está en venta con una misma demostración, un agente de investigación, un informe de construcción, también hay un mismo error, un esquema de estado y una capa de orquestación, uno contra el otro.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 16 (LangGraph)
**Time:** ~45 minutes

##  problemas

Tienes una tarea, necesitas no más de una llamada de LLM. Quizás sea un flujo de trabajo de investigación (plan, búsqueda, resumen, cita)

Tres días después, descubres que el abstracto de este marco comienza a salir de agua. El equipo te da roles, pero cuando el investigador necesita un plan estructurado para entregarle al escritor, se compara con ti. AutoGen te da un chat entre agentes, pero no tiene un estado, así que tu punto de control es sólo un picillo del registro de conversaciones. La gráfica de longitud te da un gráfico de estado, pero te obliga a no saber qué hará el agente antes de que se haga una transición.

修复方式 no es la mejor estructura 选择最好的框架──而是把框架的核心抽象匹配到你的问题形状──本课会绘画这个地图──

## 概念

![Agent framework 矩阵：核心抽象 vs 问题形状](../assets/framework-matrix.svg)

Cuatro marcos principales se dirigen a la situación del año 2026: sus estrategias centrales no son las mismas.

| Framework | 核心抽象 | 最适合 | 最不适合 |
|-----------|----------|--------|----------|
| **LangGraph** | `StateGraph` — typed state、nodes、conditional edges、checkpointer。 | 有显式 state 和 human-in-the-loop interrupts 的 workflows；需要 time-travel debugging 的 production agents。 | 拓扑未知、由 role 驱动的松散 brainstorming。 |
| **CrewAI** | `Crew` — roles（goal、backstory）、tasks、process（sequential 或 hierarchical）。 | 有短线性/层级 plan 的 role-playing 或 persona-driven workflows。 | 超出 crew turn history 的任何 stateful 场景；复杂 branching。 |
| **AutoGen** | `ConversableAgent` pair — 两个或更多 agents 轮流说话，直到满足 exit condition。 | Multi-agent *dialogue*（teacher-student、proposer-critic、actor-reviewer），其中思考从 chat 中涌现。 | 有已知 DAG 的 deterministic workflows；任何需要跨重启 durable state 的场景。 |
| **Agno** | `Agent` — 单个 LLM + tools + memory，可组合成 teams。 | 快速构建 single agents 和 lightweight teams；强 Multimodality 和内置 storage drivers。 | 带 custom reducers 的深度、显式分支 graphs。 |

### ¿Qué es lo que significa?

El resumen central de un marco es lo que dibujas en el tablero blanco mientras hablas de arquitectura.

- **LangGraph**→ Usted dibuja un gráfico. Los nodos son pasos, los bordes son transiciones, cada punto del objeto de estado está escrito.
- **CrewAI**→ Usted dibuja una tabla de organización. Cada rol tiene una descripción de trabajo.
- **AutoGen**→ Usted dibuja una Slack DM── dos agentes 互发消息; si necesita moderador, tercer加入── modelo mental es chat──
- **Agno**→ Tú dibujas una caja única, junto a las herramientas.

### Estado  problemas

El Estado es el lugar donde la mayoría de los marcos se desmoronan en la producción.

- **LangGraph.**Estado de tipo`TypedDict`O modelo pidantico) 、 reducidores por campo 、一等 checkpointers (SQLite/Postgres/Redis)  Resumen 、interrumpido 和 tiempo de viaje 都是免费的──*((见阶段 11 · 16──) *
- **CrewAI.**El Estado`context`campo 以字符串形式 entre las tareas 流动, o a través `output_pydantic`结构化传递──开箱没有 una tienda duradera por tripulación; si la tripulación 必须在重启后生存, usted necesita usted mismo接上──
- **AutoGen.**Estado es historial de chat y cualquier usuario definido `context`❖ Las transcripciones de conversación pueden ser perpetuadas; el estado de flujo de trabajo arbitrario no se perpetuará, a menos que escribas adaptadores―
- **Agno.**Interior de almacenamiento de controladores de SQLite, Postgres, Mongo, Redis, DynamoDB, a través de`storage=`¿ Qué es eso ?`Agent`上  sesiones de conversación 和 memorias de usuario 会自动持久化──它不是 un checkpointer gráfico completo; sino que almacenar sesiones──

### Enlace 问题

Cada agente extraordinario tiene una sucursal.

- **LangGraph** Por tu decisión, a través de bordes condicionales──Enrutamiento es la función Python de ramas de ramas de ramas─Ramas es un objeto de la misma clase en el gráfico compilado; checkpointer 会记录 adoptó哪条 ramas─
- **CrewAI** modo jerárquico en el que el gerente decide; modo secuencial en el que usted decide en la construcción;. Routing 隐含在任务列表; excepto en el instante del gerente.
- **AutoGen** agentes 通过聊天决定──branching 从下一个发言人中涌现──`GroupChatManager`选择 el próximo orador; puedes escribir`speaker_selection_method`Pero es un proceso de LLM.
- **Agno** agente 通過下一步调用哪个工具来决定── equipos tienen modo coordinador/router/colaborador; más allá de estas ramificaciones es responsabilidad del desarrollador──

### Observabilidad 问题

- **LangGraph**  a través de LangSmith o cualquier exportador de OTel utiliza OpenTelemetry。 cada transición de nodo son rastros de tiempo; puntos de control 同时也是可播放的痕迹──LangSmith es un programa de primera parte;Langfuse/Phoenix también tiene adaptadores──
- **CrewAI** Desde 2025 años de edad, desde finales de sus primeros años, apoyará OpenTelemetry; integrado Langfuse、Phoenix、Opik、AgentOps。
- **AutoGen**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `autogen-core`集成 OpenTelemetry;AgentOps 和 Opik tiene conectores。 Tracking 粒度 es por agente-mensaje, no por nodo。
- **Agno** 内置                `monitoring=True`bandera 加 OpenTelemetry exportadores; con Langfuse 深度集成, para utilizarse en las pistas de sesiones。

### Costo y latencia

Cuatro marcos han aumentado el gasto general por llamada (la lógica del marco, la validación, la serialización) ∼ según el gasto general ∼ LANGGRAPH < CrewAI ≈ AutoGen ∼ Diferencias principales por el marco han hecho cuánto extra LLM enrutamiento decide──El gerente jerárquico del equipo decide quién decide quién ejecutar; AutoGen ∼`GroupChatManager`También es así. LangGraph sólo cuando lo escribes.`llm.invoke`La ruta de Agno es muy baja.

Cuando cada vez se ejecuta el costo important , priorizar la opción de enrutamiento explícito Langgraph edges、AutoGen `speaker_selection_method`), en lugar de un enrutamiento seleccionado por el LLM.

### Interoperabilidad

- **LangGraph**¿ Qué es esto ?**LangChain**herramientas, retrievers, LLMs, un adaptador MCP, herramientas como servidores de MCP,
- **CrewAI** herramientas 继承自 `BaseTool`Las herramientas de LangChain, de LlamaIndex y de MCP pueden adaptarse a la industria.`allow_delegation=True`Hacer una delegación de tripulación a tripulación.
- **AutoGen**¿ Qué es esto ?`FunctionTool`包装任何Pythoncallable; hay un adaptador MCP──对代理对代理模式与AG2生态系统 紧密合──
- **Agno**¿ Qué es esto ?`@tool`Decorador o subclase BaseTool; adaptador MCP; herramientas pueden ser compartidas entre agentes y equipos.

## 技能

> Puedes explicar con una frase, ¿por qué un marco se adapta a un agente problemas―?

构建前 lista de verificación:

1. **画出形状。**¿Es un gráfico? ¿tipo de estado? ¿nombrados transiciones? ¿Juega un papel? ¿especialistas? ¿enlace? ¿enlace? ¿enlace? ¿agentes? ¿enlace hasta que se complete? ¿o con herramientas?
2. **决定谁来 branching。**La ramificación decidida por el desarrollador → LangGraph──Manager-agent-decide → CrewAI jerárquico──Chat-emergent → AutoGen──Tool-call-decide → Agno──
3. **检查 state budget。**¿Necesitas un reanudar desde el punto de control?Viaje en el tiempo?El ser humano interrumpe a mediados de carrera? si es, el LongGraph es una opción de tipo; sesiones de trabajo  cubrir el estado de la conversación en el que se desarrolla la conversación―
4. **检查 cost budget。**En el caso de los agentes que operan cada día miles de veces, priorizarán el enrutamiento explícito.
5. **为 framework overhead 做预算。**Cada marco es otra dependencia. Si la tarea es sólo dos llamadas de LLM y una herramienta, escribe 30 líneas de Python sencillo; sin ningún marco es más barato que ningún marco.

En el caso de los modelos de estado, los modelos de la realidad y los modelos de la oposición se pueden crear en el gráfico.

##  decisión de la dirección

| 问题形状 | 首选 framework | 原因 |
|----------|----------------|------|
| 带 typed state、human approvals、long-running 的 Workflow DAG | LangGraph | 一等 state、checkpointer、interrupts、time-travel。 |
| 有明确 roles 的 research / writing pipeline | CrewAI (sequential) 或 LangGraph subgraphs | 在 CrewAI 中表达 role-per-task 很便宜；当 branching 变复杂时用 LangGraph 扩展。 |
| Proposer-critic 或 teacher-student dialogue | AutoGen | Two-agent chat 是它的原生形状。 |
| 带 tools、sessions、memory 的 single agent | Agno | 设置最薄，内置 storage 和 memory。 |
| 带 reducers 的数千个 parallel fanouts | LangGraph + `Send` | 唯一拥有一等 parallel-dispatch API 的选择。 |
| 快速 prototype，不承诺 framework | Plain Python + provider SDK | 没有 framework 是最快的 framework。 |


```figure
l5-framework-fit
```

##  ejercicios

1. **Easy.**取同一个任务  research Antropic's headquarters, escriba un breve de 200 palabras, cita fuentes   分別使用 LangGraph(四个节点:plan、搜索、写、引用) y CrewAI(三个 papeles: investigador、 escritor、editor) 实现──报告每次运行代码行数和代码行数──
2. **Medium.**Utilizando AutoGen, el investigador, el escritor, el editor, el editor.`GroupChat`加入) 和 Agno(带 `search_tools`Y `write_tools`de un solo agente, re-aumento de la sesión de tienda) construir la misma tarea── según (a) cada vez el costo de la operación, (b) la capacidad de reanudar después del accidente, (c) en el escritura paso 前注入的人文批准的能力,对四个实现排序──
3. **Hard.**Construir un guión de árbol de decisión `pick_framework.py`, acepta una breve pregunta descripción:`{has_typed_state, has_roles, has_dialogue, has_parallel_fanout, needs_resume}`),并返回推和一句话理由──用你自己设计的六个案例 验证它──

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| Orchestration | “agents 如何协调” | 决定下一个运行哪个 node/role/agent 的 layer。 |
| Durable state | “重启后 resume” | 附着到 checkpoint 或 session store 上、能在 process death 后存活的 state。 |
| LLM-selected routing | “让 model 决定” | planner LLM 每轮选择下一步；灵活，但每次决策都要花 tokens。 |
| Explicit routing | “Developer 决定” | Python function 或 static edge 选择下一步；便宜且可审计。 |
| Crew | “一个 CrewAI team” | roles + tasks + process（sequential 或 hierarchical）绑定成一个 runnable。 |
| GroupChat | “AutoGen 的 multi-agent chat” | N 个 agents 之间由 speaker selector 管理的 conversation。 |
| Team (Agno) | “Multi-agent Agno” | 对一组 agents 使用 route / coordinate / collaborate mode。 |
| StateGraph | “LangGraph 的 graph” | typed-state、node、conditional-edge、checkpointer abstraction。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) Estado gráfico, puntos de control, interrupciones, viajes en el tiempo.
- [CrewAI documentation](https://docs.crewai.com/) Equipos, flujos, agentes, tareas, procesos.
- [AutoGen documentation](https://microsoft.github.io/autogen/) ConversableAgent,Cata de grupo, equipos, herramientas.
- [Agno documentation](https://docs.agno.com/) Agente, equipo, flujo de trabajo, almacenamiento, memoria.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) Con el marco 无关的图案库(prompto cadena, enrutamiento, paralelación, orquesta-trabajadores, evaluador-optimizador)
- [Yao et al., "ReAct: Synergizing Reasoning and Acting" (ICLR 2023)](https://arxiv.org/abs/2210.03629) Cada marco de la ciudad empaquetado en el ciclo de la creación 
- [Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" (2023)](https://arxiv.org/abs/2308.08155) Papel de diseño de AutoGen
- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023)](https://arxiv.org/abs/2304.03442) CrewAI 风格 persona stacks 建立其上角色扮演基础──
- Fase 11 · 16 (Langgraph)  本课用来基准的框架──
- Fase 11 · 19 (Reflexión)   一个能干净映射到 LangGraph、但映射到 CrewAI 会很不同的扭曲模式──
- Fase 11 · 22 (Observabilidad de producción)  如何仪器 你选择的任何框架──
