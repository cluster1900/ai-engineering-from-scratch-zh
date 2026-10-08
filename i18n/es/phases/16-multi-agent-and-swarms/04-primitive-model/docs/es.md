# Modelo primitivo multi-agente

> Cada marco multi-agente publicado en 2026  AutoGen、LangGraph、CrewAI、OpenAI Agents SDK、Microsoft Agent Framework  都是四维设计空间中的一个点──四个原始,仅此而已:agent、handoff、shared state、orchestrator──本课从零构建它们,运行一个玩具系统在四个人上,然后将每个主流框架映射到同一组坐标轴上,让你能用一段话读懂任何新发布版本──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 (Agent Engineering), Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

##  problemas
Cada seis meses se publicará un nuevo marco multiagente ⋅ AutoGen del año 2023 ⋅ CrewAI del año 2024 ⋅ LangGraph y OpenAI Swarm del año 2024 ⋅ Google ADK del 4 de abril del año 2025 ⋅ Microsoft Agent Framework RC del 2 de febrero del año 2026 ⋅ Cada comunicado de prensa se afirma como una abstracción correcta ⋅

Si intentas aprenderlos individualmente, te cansará de todo. Las APIs se ven diferentes.

No es así. Bajo el paquete de marketing, cuatro primitivas es estables.

## 概念
### Los cuatro primitivos

1. **Agent** Un sistema de instrucciones + una lista de herramientas── no tiene estado; cada vez que se ejecuta todo de su sistema de instrucciones 和当前消息史 开始──
2. **Handoff**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
3. **Shared state** 任何能被多个代理 读取(有时也能写入) de la estructura de datos.
4. **Orchestrator** decide下一个由谁发言的角色──选项包括:显式图表(确定性)、LLM orador-selector(soft)、上一位的 orador de la llamada de entrega(OpenAI Swarm), o cola arriba de la planificación(swarm arquitectura)。

Éste es el espacio de diseño completo. Cada marco tiene un valor de elección de cada eje; el resto es sólo un lenguaje de la superficie.

### Cómo cada marco 2026 se asigna a él

| Framework | Agent | Handoff | Shared state | Orchestrator |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | tool returns Agent | caller's problem | the LLM's next handoff call |
| AutoGen v0.4 / AG2 | `ConversableAgent` | speaker-selector on GroupChat | message pool | selector function (LLM or round-robin) |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | Task outputs chained | manager LLM or static order |
| LangGraph | node function | graph edge + condition | `StateGraph` reducer | the graph, deterministic |
| Microsoft Agent Framework | agent + orchestration patterns | pattern-specific | thread / context | pattern-specific |
| Google ADK | agent + A2A card | A2A task | A2A artifacts | host decides |

La diferencia de la superficie parece muy grande.

### ¿Por qué esto importa?

Una vez que se comprueba la primitiva, la comparación del marco se convierte en una lista de verificación breve:

- ¿Es el maestro de la orquesta o el maestro de la orquesta? ¿Es el maestro de la orquesta?
- estado compartido es historia completa, ¿GrupoChat), o proyectado, ¿Reducidor de StateGraph)?
- ¿Los agentes pueden cambiar las instrucciones de los demás? ¿O sólo pueden dejarse llevar?

Estos tres problemas pueden responder a un marco si se adapta al 80% de un problema específico.

### El insight sin estado

Además del estado compartido, cada primitivo está en estado. El agente es una función (prompto, herramientas).**系统中唯一有状态的东西是 shared state。**Todos los errores interesantes viven allí: envenenamiento de la memoria (lección 15)  ordenar mensajes  versionar  contención escrita―

Hidden frameworks of shared state (cuadro de estado compartido oculto) Swarm) will presentar el problema al llamador;集中管理 shared state frameworksLangGraph checkpointAutoGen pool) 让它可检查,但将把协调成本 转移到共享状态实施上.

### Anatomía de una sola primitiva

#### Agente , ¿ qué ?

```
Agent = (system_prompt, tools, model, optional_name)
```

没有记忆――没有状态――拥有相同的系统提示和工具的两个代理是可互换的――任何看起来像每代理状态的东西,实际上都在共享状态或交付协议中――

#### Entrega de dinero

```
Handoff = (from_agent, to_agent, reason, payload)
```

Tres tipos de realización:

- **Function return** herramienta 返回下一个代理──这是 OpenAI Swarm patrón──agentes en sus propios esquemas de herramientas llevan enrutamiento──
- **Graph edge** LangGraph。Edges is declar式的。LLM 生成一个值;condition 选择下一个节点。
- **Speaker selection** AutoGen GroupChat──elector función(有时它本身也是一次LLM llamada)读取池并选择下一位发言人──

#### Estado compartido

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

Al menos un mensaje 列表──通常更多:artefactos estructurados(CrewAI de tareas de salida) ‧tipo de contexto(Reducidores de longitud gráfica) ‧memoria externa(MCP、vector DB) ‧

两种类型:**full pool**(cada agente tiene un mensaje) y**projected**(agentes ven por función escopo de vista) ――Pollos completos 简单但扩展性差──Pollos proyectados se pueden ampliar, pero se necesita un esquema de diseño previo―

#### Orquestación

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

Cuatro tipos:

- **Static** gráfico en el tiempo de construcción 固定(LangGraph determinista、CrewAI Sequencial)。
- **LLM-selected** LLM 读取 pool 并选择下一位讲者(AutoGen、CrewAI Jerárquico)
- **Handoff-driven** 当前代理 通过调用手渡工具 来决定(Swarm) 』
- **Queue-driven** trabajadores de la cola compartida 拉取任务; no hay un claro siguiente altavoz

### ¿Qué cambios se producen entre los marcos

Una vez que las primitivas se fijan, el resto de decisiones de diseño son:

- **Memory strategy** control efímero frente a control duradero  control LangGraph)
- **Safety boundary** 谁可以批准交付 (hombre en el circuito) 
- **Cost accounting** Presupuestos de tokens por agente。
- **Observability** rastreando las entregas, para repetición 持久化状态──

Todo esto puede ser logrado en primitivas. No son primitivas nuevas.


```figure
a5-primitive-radar
```

## Construirlo
`code/main.py`Utilizando aproximadamente 150 rp de Python  implementar cuatro primitivas  no hay un LLM real  Cada agente son una política scripted, por lo que el foco se mantiene en la estructura de coordinación 

El documento se expone:

- `Agent` 包含 nombre, sistema de instrucciones, herramientas, función de políticas de la clase de datos¬
- `Handoff` 返回新代理的功能──
- `SharedState` Cuadro de mensajes seguro de hilo。
- `Orchestrator` Tres cambios:`StaticOrchestrator`¿Qué es esto?`HandoffOrchestrator`¿Qué es esto?`LLMSelectorOrchestrator`(simulado)

demo 通過所有三種樂團編輯類型 运行同一個三代理管線 (investigación → escribir → revisión), y finalmente imprimir el grupo de mensajes── puedes ver, la diferencia de salida sólo depende de *quién elige el siguiente*; agentes 和 estado compartido 在每次运行中完全相同──

¿Qué es eso ?

```
python3 code/main.py
```

预期输出: Tres veces ejecutar el orquestaje, cada patrón una vez... Cada vez imprimirá el grupo de mensajes finales... Si el investigador 判断已经提前完成, ejecutar por el fondo, llegará a menos agentes...

## Usalo
`outputs/skill-primitive-mapper.md`Es una habilidad, que lee cualquier base de código multi-agente o documento marco, y regresa a la mapeo primitiva de cuatro. En el nuevo lanzamiento del marco, puede leer en profundidad los documentos.

##  entregarlo
En la adopción de un nuevo marco, primero se escribe un mapa primitivo. Si no se escribe, se indica que el documento no está completo, o el marco está en proceso de desarrollar el segundo primitivo.

Cuando un nuevo miembro del equipo se une, primero se le envía un mapa, luego se le envía un documento de API.

##  ejercicios
1. Con diferentes políticas de agentes`code/main.py`三次── observar la elección del orquestrador 如何改变哪些代理会运行──
2. 实现第四种管弦乐器类型:queue-driven, entre los agentes 轮询共享状态 寻找工作──可能发生什么死,你如何检测它?
3. 取 LangGraph rápido arranque (https://docs.langchain.com/oss/python/langgraph/workflows-agents), transformarlo en cuatro primitivas. ¿Cuáles son las abstracciones de LangGraph que son 1:1 映射, cuáles son las envolturas de conveniencia?
4. 阅读 OpenAI Cuinero de la multitud (https://developers.openai.com/cookbook/examples/orchestrating_agents◊ Identificar el grupo 让四个原始人中哪个最 ergonomic,以及它把哪个推给调用者──
5. En este cuadro se encuentra un marco de estado compartido completamente oculto.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | “一个带 tools 的 LLM” | 一个 `(system_prompt, tools, model)` triple。无状态。 |
| Handoff | “控制权转移” | 一个结构化 call，命名下一个 agent 和可选 payload。三种实现：function return、graph edge、speaker selection。 |
| Shared state | “Memory” / “context” | multi-agent system 中唯一有状态的部分。Message pool 或 blackboard。 |
| Orchestrator | “Coordinator” | 决定下一个运行者的人或机制。Static graph、LLM selector、handoff-driven，或 queue-driven。 |
| Primitive | “Abstraction” | 每个 framework 都会参数化的四个轴之一。不是 framework feature。 |
| Message pool | “Shared chat history” | Full-history shared state。容易推理，扩展性差。 |
| Projected state | “Scoped view” | 面向特定 role 的 shared state view。可扩展，需要 schema design。 |
| Speaker selection | “下一个谁说话” | 一种 orchestrator pattern，其中一个 function（通常是 LLM）从 group 中选择下一个 agent。 |

## 延伸阅读
- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) Para la orquestación impulsada por la mano
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/) GroupChat + selección de oradores es una orquestación seleccionada por el LLM para lograr
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) Orquestación de borde gráfico y estado compartido basado en reducidor
- [CrewAI introduction](https://docs.crewai.com/en/introduction) agentes de rol-objetivo-historia de fondo,procesos secuenciales/hiérarquicos
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2) Microsoft va a pasar a v0.4   sigue activo después de mantenimiento de AutoGen v0.2 
