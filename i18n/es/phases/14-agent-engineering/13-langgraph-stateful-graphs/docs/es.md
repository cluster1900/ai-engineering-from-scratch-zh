# LangGraph:Graficos de estado con ejecución duradera

> LangGraph es un estándar de referencia para la orquestación estatales de bajo nivel de 2026 años. El agente es un estado; los nodos son una función; los bordes son un estado transferido; el estado es inmutable, y en cada paso después de un punto de control. Cualquier fracaso puede ser obtenido desde un punto de partida.

**类型：**学习 + 构建
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 01 (localización de agentes), Fase 14 · 12 (patrones de flujo de trabajo)
**时间：**~ 75 minutos

## El objetivo del aprendizaje

- 描述 LangGraph's core model:带有不变状态、功能节点、条件边和后步检查点的状态机――
- Explicar que el sistema de memoria de la persona en el circuito es un sistema de memoria integral.
- 解释 LangGraph 支持的三种管弦类型:supervisor、peer-to-peer (cruce)、hierárquico (subgrafos anidados)。
- 实现 un gráfico de estado de un estado de un estado, que contiene estados inmutables, bordes condicionales y ciclo de control/resumen.

##  problemas

Los agentes y los flujos de trabajo tienen un problema común: cuando un funcionamiento de 40 pasos falla en el paso 38, usted desea comenzar a comenzar desde el paso 38, en lugar de comenzar desde el principio. El modelo de estado de segundo grado permitirá a los operadores rodear una hipótesis de que cada vez son una biblioteca de todo nuevo funcionamiento.

La respuesta al diseño de LangGraph es: estado es un objeto tipado de igual tipo, mutaciones son evidentes, y los puntos de control se perpetuan después de cada nodo. Resumen es una vez.`load_state(session_id)`调用── también

## 概念

### gráfico

Un gráfico definido por la siguiente parte:

- **State type.**Un dictado tipado (o modelo pidantico), cada nodo de la ciudad se puede leer y modificar.
- **Nodes.**纯函数 `(state) -> state_update`❖ Actualizaciones 会在返回后合并进状态──
- **Edges.**Transiciones condicionales o directas entre nodos.
- **Entry and exit.** `START`Y `END`Los nodos de sentinela 标记边界。

Ejemplo: una contiene `classify`¿Qué es esto?`refund`¿Qué es esto?`bug`¿Qué es esto?`sales`¿Qué es esto?`done`Agente de nodos, es decir, un flujo de trabajo de enrutamiento en forma de gráfico.

### Ejecución duradera

Cada nodo regresa después, el tiempo de ejecución se encuentra en el estado de secuenciación, y se escribe en el punto de control.`resume(session_id)`,并带带精确状态 从第 N+1 步继续──

LangGraph 文档 claramente enfatiza la importancia de este punto para los usuarios de producción:Klarna、Uber、J.P. Morgan──

### En streaming

Cada nodo puede producir una salida parcial. Grafico Reunión hacia el flujo de llamadas por eventos del nodo-delta, hacer que el usuario pueda en el gráfico 运行时更新.

### Hombre en el ciclo

En los nodos  entre controles y modificaciones de estado. Método de realización: en el nodo crítico  前暂停,将状态 展示给人,接受修改,然后再续.

### La memoria

A corto plazo (一次运行内, es decir, historia de conversación en el medio del estado) y a largo plazo (跨运行, es decir, a través de un punto de control, 加上独立长期存储 持久化)

### Tres tipos de topología

1. **Supervisor.**El router central LLM se distribuye a los sub-computados especializados.`langgraph-supervisor`En el centro`create_supervisor()`(LangChain 团队 en 2026 sugiere hacer llamadas directas a través de herramientas para obtener un mejor control de contexto)
2. **Swarm / peer-to-peer.**Agentes  a través de la superficie de la herramienta compartida  directamente de la mano
3. **Hierarchical.**Supervisores 管理 sub-supervisors,以 subgrafos anidados ⋅

### Este modo es fácil de salir mal donde

- **Checkpoints too small.**Sólo la conversación del punto de control se vuelve 会让 herramienta estado 和 memoria escribe 无法恢复──full state 必须可序列化──
- **Non-deterministic nodes.**Resumen 假设 node inputs 会产生 igual estado de actualización──Random seeds、wall-clock、external APIs deben ser capturadas──
- **Over-use of conditional edges.**Cada borde es un gráfico condicional, un estado inalcanzable.


```figure
langgraph-state
```

## Construirlo

`code/main.py`实现 un gráfico de estados de un estado:

- `State`: un dictado de tipo, contenida `messages`¿Qué es esto?`step`¿Qué es esto?`route`¿Qué es esto?`output`¿Qué es esto?`human_approval`¿Qué es eso?
- `Node`: Recibir estado y volver a actualizar dictado de llamada.
- `StateGraph`:nodes + bordes + bordes condicionales + run + resume。
- `SQLiteCheckpointer`(falso en memoria): en cada nodo 后序列化 estado;`load(session_id)` Recuperación
- Una demo grafico:clasificar -> rama(reembolso / bug / ventas) -> puerta humana -> enviar。

¿Qué es eso ?

```
python3 code/main.py
```

Trace 会 muestra la primera operación en la puerta humana 失败、完成持久化, luego reanudar y producir la salida final―

## Usalo

- **LangGraph**: en referencia a la realización,producción-pronto, uso`create_react_agent`¿Qué es esto?`create_supervisor`, o construir tu propio gráfico.
- **AutoGen v0.4**(Lección 14): Adaptado a escenarios de alta competencia.
- **Claude Agent SDK**(Lección 17): Arnes administrado de la tienda de sesiones integrada.
- **Custom**Cuando necesite un control de estado o un control de control de la parte posterior del punto de control,

##  entregarlo

`outputs/skill-state-graph.md`Se puede generar un gráfico de estado en forma de LangGraph, y luego hacer un checkpoint con el resumen.

##  ejercicios

1. Cuando la confianza en la clasificación es baja en el valor, desde`classify`添加一条 límite condicional hasta `end`❖ En el hombre`route`后 resume 运行──
2. Se puede utilizar un control de SQLite falso para reemplazarlo con un verdadero SQLite.
3. 实现 bordes paralelos: dos nodos并发运行,并通过定制减速器 合并──Immutable state 在这里带来了什么?
4. 阅读   Cómo es`langgraph-supervisor`Referencia: ¿Cuál es el número de juegos?`create_supervisor`❖ Comparar las formas de rastro―
5. 添加流: cada nodo en el funcionamiento produce estado parcial―印印到达的deltas―

## 关键术语: "El hombre es un hombre"

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| State graph | “Agent 即状态机” | Typed state + nodes + edges + reducers |
| Checkpointer | “Persistence backend” | 在每个 node 后序列化 state；支持 resume |
| Reducer | “State merger” | 将当前 state 与 node update 组合起来的函数 |
| Conditional edge | “Branch” | 由 state 函数选择的 edge |
| Subgraph | “Nested graph” | 作为另一个 graph 中 node 使用的 graph |
| Durable execution | “从失败处 resume” | 使用精确 state 从最后一个成功 node 重启 |
| Supervisor | “Router LLM” | 面向 specialist subagents 的 central dispatcher |
| Swarm | “P2P agents” | Agents 通过 shared tools hand off；没有 central router |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Documento de referencia
- [langgraph-supervisor reference](https://reference.langchain.com/python/langgraph/supervisor/) API de patrón de supervisión
- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) actor modelo 替代方案
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) tienda de sesiones y subagentes
