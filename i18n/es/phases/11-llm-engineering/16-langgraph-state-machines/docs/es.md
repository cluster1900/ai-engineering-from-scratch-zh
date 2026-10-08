# LangGraph  Máquinas del Estado de Agente

> El ciclo de ReAct es un`while True` Usar un LangGraph 写的 ReAct loop es un gráfico, puedes ver el punto de control, interrumpir, ramificar, y realizar un viaje en el tiempo.

**Type:** Build
**Languages:** Python
**前置要求:**Fase 11 · 09 (Llamamiento a funciones), Fase 11 · 14 (Modelio de protocolo de contexto)
**Time:** ~75 minutes

##  problemas

Usted publicó un agente de llamada de función. Se ejecuta normal, luego sale el problema: modelo  intentar convocar una herramienta de retorno de 500, usuario en el medio de la tarea cambiar de idea, o agente en caso de no tener la firma humana decide para el pedido de devolución.`while True:`Loop sin gancho. Usted no puede suspenderlo, no puede regresar a él, tampoco puede forjarse. Si el modelo entonces eligió otra herramienta, ¿cómo se va a hacer? Una vez que lo llevas de la demostración a un entorno real, el agente se convierte en una caja negra: ¿suceder, o fracasar?

Una vez que se compruebe esto, el siguiente paso es evidente. El agente es una máquina de estado: sistema de mensaje de inmediato, historia de mensajes, llamadas de herramientas pendientes, otra acción.

LangGraph es una biblioteca de esta abstracción. No es un marco de agente en el sentido de LangChain. Aquí hay un agente ejecutor.

## 概念

![LangGraph StateGraph: nodes, edges, and the checkpointer](../assets/langgraph-stategraph.svg)

Una de ellas .`StateGraph`Hay tres cosas.

1. **State.**Un dictado tipado ([[Dicto tipado]] o modelo pidantico), se encuentra en el gráfico 中流动── cada nodo recibe un estado completo, y regresa a una actualización parcial, el LongGraph se utiliza para cada campo a su vez para combinar los campos de *reducción* para unirlos :`operator.add`,默认则覆盖──
2. **Nodes.**Funciones de Python `state -> partial_state`每个节点是一个离散步: 调用模型运行工具总结──
3. **Edges.**Los nodos  entre transiciones―Ramos estáticos ∞ hacia posición fija―Ramos condicionales 接收一个路由器功能 `state -> next_node_name`, haga que el gráfico puede basarse en la salida del modelo

Usted compila este gráfico. Compilación de la topología de la unión, añadir un punto de control.`thread_id`调用它── cada paso de ejecución                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `(thread_id, checkpoint_id)`Por el punto de control clave.

### Cuatro supercapacidades

**Checkpointing.**Cada paso de nodo, se hace un nuevo estado de memoria, producido con Postgres/Redis/SQLite.`thread_id`Re-调用 gráfico 即可恢复──graph 会从暂停的位置继续──

**Interrupts.**¿ Qué ?`interrupt_before=["human_review"]`标记一个节点,执行 会在该节点 运行前停止――状态 会被持久化――tu API向用户 返回等待批准──之后对同一个 `thread_id`¿ Qué pasa ?`Command(resume=...)`La solicitud es la de reanudar la ejecución.

**Streaming.** `graph.stream(state, mode="updates")`Las regiones del delta se producen en el estado.`mode="messages"`Los nodos del modelo de flujo de la LLM dentro de los tokens de la LLM.`mode="values"`Le darán instantáneas completas. Puede elegir cual mostrar en la interfaz de usuario.

**Time-travel.** `graph.get_state_history(thread_id)`Retorn completo registro de los puntos de control `checkpoint_id`¿ Qué pasa ?`graph.invoke`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,

### Los reducidores 才是重点

Cada campo de estado tiene un reducidor. La mayoría de los comportamientos están en juego.`operator.add`, así nuevos mensajes se agregarán, en lugar de reemplazar. Los bordes paralelos se fusionarán a través del reducidor.`messages`, y tú olvidaste .`Annotated[list, add_messages]`, la segunda reunión se va a perder la mitad del contenido. Reducer es la única cosa delicada de esta biblioteca.

### Cuatro nodos de ReAct gráfico

Un agente de producción ReAct de cuatro nodos y dos bordes  Compuesto:

1. `agent` Utilize current message history 调用 LLM── devolver el mensaje de asistente (incluyendo las llamadas de herramienta)──
2. `tools`  ejecutar el último mensaje de asistente 中的所有工具_calls,并把工具结果 作为工具消息添加进去──
3. Desde`agent`Fuente condicional: Si el último mensaje tiene llamadas de herramienta, entonces la ruta hacia `tools`,否则到 `END`¿Qué es eso?
4. Desde`tools`De vuelta`agent`De un borde estático.

Así es. Usas aproximadamente 40 行代码, y puedes obtener un ciclo completo de ReAct. Pensamiento → Acción → Observación → Pensamiento → ...), al mismo tiempo que tienes puntos de control, interrupciones y transmisión.

### EstadoGraph vs Enviar (Fanout)

`Send(node_name, state)`允许 un nodo enviar subgrafos paralelos― ejemplo: agente decide simultáneamente consulta 三个 retrievers― cada `Send`La ciudad generará una ejecución paralela de un nodo objetivo; sus resultados se producirán a través de la fusión del reducidor de estado.

### Subgrafos

Un gráfico compilado puede ser utilizado como otro gráfico de nodos en el medio. Un gráfico externo es un único nodo; un gráfico interno tiene su propio estado y sus propios puntos de control.


```figure
l5-state-graph-ledger
```

## Construirlo

### 步骤 1: estado y nodos

```python
from typing import Annotated, TypedDict
from langchain_core.messages import AnyMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

def agent_node(state: State) -> dict:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: State) -> str:
    last = state["messages"][-1]
    return "tools" if getattr(last, "tool_calls", None) else END

tool_node = ToolNode(tools=[search_web, read_file])

graph = StateGraph(State)
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

app = graph.compile(checkpointer=MemorySaver())
```

`add_messages`Es hacer que la lista de mensajes se acumula en lugar de reducir la cobertura. Olvídate de que es el bug LangGraph más común.

### 步骤 2: ejecutar con un hilo

```python
config = {"configurable": {"thread_id": "user-42"}}
for event in app.stream(
    {"messages": [HumanMessage("find the Anthropic headquarters address")]},
    config,
    stream_mode="updates",
):
    print(event)
```

Cada actualización es un dictado .`{node_name: state_delta}` Tu frontend puede enviar estos flujos a la UI, dejar que los usuarios vean agent está pensando... está utilizando la búsqueda_web... obtiene el resultado... está respondiendo

### Paso 3: 添加 interrupción humana en el circuito

Marque un nodo, deja que la ejecución se detenga antes de que funcione.

```python
app = graph.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["tools"],  # pause before every tool call
)

state = app.invoke({"messages": [HumanMessage("delete the production database")]}, config)
# state["__interrupt__"] is set. Inspect proposed tool calls.
# If approved:
from langgraph.types import Command
app.invoke(Command(resume=True), config)
# If denied: write a rejection message and resume
app.update_state(config, {"messages": [AIMessage("Blocked by human reviewer.")]})
```

Estado, punto de control y hilo de la memoria, excepto durante la ejecución, no hay nada que exista en la memoria.

### Paso 4: Usar para el viaje en el tiempo de la prueba

```python
history = list(app.get_state_history(config))
for snapshot in history:
    print(snapshot.values["messages"][-1].content[:80], snapshot.config)

# Fork from a prior checkpoint
target = history[3].config  # three steps back
for event in app.stream(None, target, stream_mode="values"):
    pass  # replay from that point forward
```

¿ Qué ?`None` Como entrada 传入, se reproducirá desde un determinado punto de control; 传入 a un valor, se aplicará en el currículum pre-lo como una actualización de apéndice al estado de ese punto de control .

### Paso 5: sustituir el puesto de control para el medio ambiente de producción

```python
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string("postgresql://...") as checkpointer:
    checkpointer.setup()
    app = graph.compile(checkpointer=checkpointer)
```

SQLite、Redis 和 Postgres han sido proporcionados`MemorySaver`Para pruebas... cualquier cosa que necesite reiniciar... que exista de forma permanente, debería utilizar una tienda real...

## 技能

> Usted ha construido agentes para gráficos, en lugar de`while True`Los bucles.

Antes de usar LangGraph, primero haz un diseño de 60 segundos:

1. **命名 nodes。**Cada decisión de separación o acción secundaria es un nodo. El agente piensa que la herramienta se ejecuta. El revisor aprueba los flujos de respuesta. Si no los realiza, esta tarea no tiene un agente.
2. **声明 state。**Utiliza el mínimo TypedDict,并为每一个列表字段 配减机──不要把一切都塞进`messages`;把 campos específicos de tareas`plan`¿Qué es esto?`budget`Contador uno`retrieved_docs`Lista) se eleva al nivel superior.
3. **画出 edges。**Además de que el siguiente paso dependa de la salida del modelo, o bien utilizar estática.
4. **一开始就选择 checkpointer。**pruebas`MemorySaver`, otros escenarios con Postgres/Redis/SQLite― no publicar en condiciones sin puesto de control sin puesto de control, sin currículum, sin interrupción, sin viajes en el tiempo―
5. **在 tools 运行前决定 interrupts，而不是运行后。**Las aprobaciones deben colocarse en el borde del nodo de efecto secundario, para que puedas cancelar antes de causar el impacto; la validación debe colocarse en el borde del modelo después de la salida, para que puedas rechazar malos llamados a bajo costo.
6. **默认 stream。**Uso de la U.`mode="updates"`,modelo de nodos  interna de nivel de token de streaming Usado `mode="messages"`,Eval                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `mode="values"`¿Qué es eso?

 rechazar la publicación de ningún agente LangGraph de control.  rechazar la publicación de efectos secundarios  sólo después de interrumpir el agente LangGraph.  rechazar la publicación `messages`campo 没有使用 `add_messages`作为减轻剂的LangGraph agente──

##  ejercicios

1. **Easy.**Utiliza la herramienta de calculadora y la herramienta de búsqueda web 实现 arriba de cuatro nudos ReAct gráfico。验证对一个两转对话,`list(app.get_state_history(config))`Al menos regresen a los cuatro puestos de control.
2. **Medium.**Añade uno en`agent`之前运行的 `planner`nodo,并向状态 写入结构化的 `plan: list[str]`¿Qué quieres?`agent`¡Planear los pasos! ¡Si!`plan`En el punto de control, el reanudación de los resultados se reduce a un error de cálculo.
3. **Hard.**构建一个监督图,使用 `Send`En tres subgrafos`researcher`¿Qué es esto?`writer`¿Qué es esto?`reviewer`Cada subgrafo tiene su propio estado y punto de control.`interrupt_before=["writer"]`, que el ser humano pueda aprobar la investigación breve, confirmación de un control previo, viajar en el tiempo, sólo volverá a operar la rama bifurcada.

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| StateGraph | “LangGraph graph” | 你在 compile 前向其中添加 nodes 和 edges 的 builder object。 |
| Reducer | “field 如何 merge” | 当 node 返回某个 field 的 update 时应用的函数 `(old, new) -> merged`；默认是 overwrite，`add_messages` 会 append。 |
| Thread | “一个 conversation ID” | 一个 `thread_id` 字符串，用于限定一个 session 的所有 checkpoints。 |
| Checkpoint | “一个 paused state” | node transition 后完整 graph state 的持久化 snapshot，以 `(thread_id, checkpoint_id)` 为 key。 |
| Interrupt | “暂停等待 human” | `interrupt_before` / `interrupt_after` 会在 node boundary 停止 execution；用 `Command(resume=...)` resume。 |
| Time-travel | “从之前的 step fork” | `graph.invoke(None, config_with_old_checkpoint_id)` 会从该 checkpoint 向前 replay。 |
| Send | “Parallel subgraph dispatch” | node 可以返回的 constructor，用于 spawn N 个 target node 的 parallel executions。 |
| Subgraph | “作为 node 的 compiled graph” | 在另一个 graph 中作为 node 使用的 compiled StateGraph；保留自己的 state scope。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) EstadoGrafa, reducidores, puntos de control y interrupciones de la autoridad referencia
- [LangGraph concepts: state, reducers, checkpointers](https://langchain-ai.github.io/langgraph/concepts/low_level/) Este modelo mental de uso del curso, directamente de la fuente oficial.
- [LangGraph Persistence and Checkpoints](https://langchain-ai.github.io/langgraph/concepts/persistence/) 关于 Postgres/SQLite/Redis tiendas 查询点名区 和线程ID 的细节──
- [LangGraph Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/)¿ Qué es esto ?`interrupt_before`¿Qué es esto?`interrupt_after`¿Qué es esto?`Command(resume=...)`Y el patrón de estado de edición.
- [Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)](https://arxiv.org/abs/2210.03629) Cada agente de LangGraph tiene un patrón de realización; lee que puede entender la base de rastros de razonamiento.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) Explicar que debería estar en la hora de elegir qué formas de gráfico (chain 、router 、orquestrator-workers 、evaluator-optimizer) 
- Fase 11 · 09 (Llamada de funciones)  Cada nodo de agente LangGraph 复用工具-call primitivo。
- Fase 11 · 14 (Modelo de Protocolo de Contexto)  Descubrimiento de herramientas externas, disponible a través del adaptador MCP 接入 LangGraph `ToolNode`¿Qué es eso?
- Fase 11 · 17 (Compromiso de marco de agentes)  何时选择 LangGraph, en lugar de CrewAI、AutoGen o Agno。
