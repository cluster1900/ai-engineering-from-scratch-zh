# Productos de producción  队列、Checkpoints、Durabilidad

> Para ampliar los sistemas multi-agentes a miles de operaciones, se necesita**durable execution**◊ El tiempo de ejecución de LangGraph 会在每一个超级步骤 后写入一个由 `thread_id`标识的检查点(默认使用 Postgres); trabajador 崩会释租, otro trabajador 会接手恢复──Agentes pueden descansar indefinidamente, esperar a la entrada artificial──**MegaAgent**(arXiv:2408.09955) 运行一个按代理 划分的生产消费者队列,包含三种状态 (Idle / Processing / Response) 和两层协调 (组内聊天 + 组间管理聊天)**Fiber/async**优于线程-per-jobs:threads 99% del tiempo están en el espacio esperando tokens, mientras que las fibras 会在 I/O 上协作式让出.**FastAPI + Postgres + nothing else**, simple arquitectura que se esperaba más lejos. Este curso construirá un registro duradero de puntos de control, una cola de trabajo por agente con cambios de estado, una demostración de sincronización contra hilos, y se implementará desde simple comienzo.

**Type:** Learn + Build
**Languages:** Python (stdlib, `asyncio`, `sqlite3`)
**前置要求：**Fase 16 · 09 (Redes de Encargo Paralelo), Fase 16 · 13 (Memoria Compartida)
**Time:** ~75 minutes

##  problemas

Un prototipo de sistema multi-agente en una computadora portátil, con tres agentes y un bucle de eventos en memoria, puede funcionar normalmente.

- Los agentes tienen que trabajar durante un tiempo.
- Los procesos de trabajo se derrumbarán.
- La carga de máximo valor es 10 veces la carga media; necesitas un nivel de expansión.
- Usuario por agente 付费; necesitas para la semántica de la cuotación exactamente una vez.

En el ciclo de eventos de memoria  no se pueden resolver estos problemas. Usted necesita añadir una capa de ejecución duradera en la base.

1. 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints 带 checkpoints  带 checkpoints  带 checkpoints                                                                                                                                                                                                                                                                                                                                                                                
2. 带 estado tienda de mensajes de cola(Postgres + SQS/RabbitMQ)
3. En el marco de los modelos de actores, el productor-consumidor de MegaAgent por agente)
4. Hand写 FastAPI + Postgres(Bedi 的观点)。

Esta clase construirá una versión micro de cada tipo de programa.

## 概念

### Ejecución duradera, este modelo

El motor de ejecución duradera 会在每一个"步骤" (en el lenguaje de "language") después de haberse prolongado el estado completo del programa.

```
worker crashes mid-step
  -> lease timeout
  -> another worker picks up the thread_id
  -> resumes from last checkpoint
  -> no duplicate side effects
```

Para que funcione, se necesita satisfacer:

- **Serializable state。**Todos los estados de agentes deben ser permanentes.
- **Deterministic resume。**给定相同状态和相同输入,agente 会产生相同行动 (或将LLM calls 委托给外部决定主义 Oracle) 
- **Idempotent side effects。**Las llamadas externas (llamadas a herramientas, pagos) deben ser idempotentes o utilizar la clave de deduplicación.

LangGraph en cada super-paso 后写检查点;Temporal在每个活动 后写;Restate 使用事件源日志──三者实现是同一个模式──

### Tiempo de ejecución de LangGraph

Cada agente tiene una .`thread_id`;estado es escrito dictado; cada super paso se dirige a la tabla de puntos de control 写入一行。恢复时,runtime desde el último punto de control 继续, en lugar de desde头开始──Agentes pueden `interrupt()`Esperar la entrada artificial; tiempo de ejecución: Persistencia y liberación de trabajadores. Cuando llegue la entrada, cualquier trabajador puede recuperarse.

Este es el diseño de producción de referencia de abril de 2026

### Cuadra por agente de MegaAgent

ArXiv:2408.09955  describe un experimento a escala: un grupo en el que hay miles de agentes de desarrollo.

```
agent i:
  state ∈ {Idle, Processing, Response}
  in_queue   <- messages addressed to agent i
  out_queue  -> replies + side effects

coordinators:
  intra-group chat  (agents in the same group)
  inter-group admin chat  (high-level routing)
```

La coordinación de dos niveles permite que la conversación en el grupo ocurra en alta densidad, mientras que el grupo se mantiene en escasez.

### Async vs hilo por trabajo

Las llamadas de LLM son I/O-bound. Esperar el siguiente hilo de token. El 99% del tiempo es en el espacio. Cada hilo consume aproximadamente 1 MB de RAM.

Las fibras de Python`asyncio`、Vete a las rutinas 、Rust `tokio`) se realizará en I/O. De igual manera, 10.000 llamadas pueden ser fácilmente puestas en un proceso.

Ejemplo:Pós-procesamiento vinculado a un CPU (implementación, tokenización, técnicas) todavía necesita hilos o procesos.

### Bedi's contraste

"Scaling Agentic Software" (Ashpreet Bedi, 2026) cree que la mayoría de los equipos en el proceso de carga de la medida están en exceso de ingeniamiento.

- Rapido + Posgrado.
- Cada agente ejecuta es una línea; estado utiliza una concurrencia optimista.
-  Por el `pg_notify`O simplemente trabajador de celería  ejecutar trabajos de fondo 
- En el código de aplicación implementar la política de retomación.

Para menos de 100 ejecuciones de agentes, la carga de tareas controlables, esto suele ser suficiente.

 regla es: cuando se encuentre con un problema concreto que una estructura simple no puede resolver, reutilice marcos de ejecución duraderos― la adopción prematura de tiempo se consumirá en rituales sin retorno―.

### Semántica de una vez exactamente

 para las operaciones de agente de pago, usted necesita "exactamente efectiva una vez" (por lo menos una entrega + un consumidor idempotente)

- **每个 run 一个 dedup key。**En cada llamada de efectos secundarios, se incluye.
- **Outbox pattern。**Los efectos secundarios primero se escriben en una tabla, luego se ejecutan por un proceso independiente.
- **Compensating transactions。**Cuando el efecto secundario éxito pero seguimiento escribir 失败时, organizar reparación operación.

Estos son patrones de ingeniería de base de datos, no son específicos de LLM.

### Despliegue del arco iris

Sistema de investigación multi-agente de Anthropic utiliza "implementaciones del arco iris": múltiples agentes runtime  versión并发运行, así que los agentes que funcionan durante mucho tiempo no tienen que ser eliminados en cada implementación de código ⋅ para una pequeña parte de la circulación canario nueva versión; cuando la versión antigua de los agentes 结束后再淘汰旧版本──

Esta es la práctica estándar de los sistemas de estado de larga duración; el punto de adaptación para el año 2026 es que los agentes pueden sobrevivir un número de horas, por lo que los ciclos de despliegue deben ser compatibles con este punto.

### 典型生产 lista de control

- Estado duradero de los puntos de control, instantáneas, o de la caja de salida + registro reproducible)
- Efectos secundarios impotentes。
- Utilizando la capa de I/O sincronizada de las llamadas de LLM.
- 带 dedup de al menos una entrega una vez.
- 面向状态ful workloads of rainbow/canary deployment──
- Observabilidad: rastro por agente, auditoría en superfase, contador de retiro.


```figure
sw-checkpoint-replay
```

## Construirlo

`code/main.py`实现:

- `CheckpointStore` Registro de puntos de control respaldados por SQLite, usar teclas de identificación de hilo。 cada super paso 追加一行。
- `run_with_checkpoint(agent, thread_id)` 模拟中运 崩; segundo trabajador desde el último puesto de control 恢复。
- `AgentQueue` por agente máquina de estado de inacción / procesamiento / respuesta, con una pequeña cola de trabajo。
- `demo_async_vs_threads()` 通过asyncio 和线程 运行 500 个并发模拟"LLM llamadas";报告 pared-reloj 和 pico de memoria(近似)。

运行:

```
python3 code/main.py
```

预期输出:模拟崩后检查点恢复 成功;async version 在 < 1s 内处理 500 个并发电话;thread version 需要几秒,并且每个并发单元使用的内存 高出数量级──

## Usalo

`outputs/skill-scaling-advisor.md`Las necesidades y la frecuencia de implementación se basan en la carga, la retención de estado, la recomendación de ejecución duradera, la opción:

##  Publicarlo

典型生产加固:

- **从简单开始（Bedi 的规则）。**Utiliza FastAPI + Postgres, hasta que te encuentres con el fracaso.
- **在优化之前 instrument everything。**Histograma de latencia por ejecución, tiempo por paso, recuento de retrasos, clasificación de fallos.
- **为 side effects 使用 outbox pattern。**), especialmente los pagos y las llamadas de API externas.
- **Rainbow deploys。**Durante el despliegue, no matarás a los agentes en vuelo.
- **当你遇到具体问题时采用 durable-execution engines（Temporal / LangGraph / Restate）：**Las medidas de recuperación y compensación se aplican en el marco de la política de cooperación entre las regiones.
- **I/O layer 使用 async。**Los hilos sólo se utilizan para el postprocesamiento en la CPU.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Confirmar el resumen de los puntos de control 生效; medir asíncrono vs concurrencia de hilos 差异──
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              **outbox**Tabla: Cada llamada de herramienta primero se escribe en la caja de salida, luego se ejecuta por la rutina/tarea de ejecución individual.
3. 模拟一个 **rainbow deploy**Dos versiones de ejecución fueron emitidas; se lanzarán a la mitad de los nuevos thread_ids hasta su versión; se confirmarán los hilos en vuelo de la versión anterior.
4. 阅读下面链接中的 LangGraph runtime doc――识别 runtime 中哪些功能在手写FastAPI + Postgres 版本中最耗时――那是理由采用它,还是可以延迟?
5. 阅读MegaAgent (arXiv:2408.09955) Sección 3──两层协调(intra-grupo + intergrupo admín chat) es evidente──画出你会如何将它映射到带两类队列家庭的消息队列──

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| Durable execution | "Persist the program state" | Engine 在每个 super-step 后写入 state；crash recovery 是 deterministic 的。 |
| Super-step | "Transactional boundary" | Checkpoints 之间的 work unit。LangGraph 术语。 |
| thread_id | "Agent run identifier" | 绑定 checkpoints 和 resume logic 的 key。 |
| Idempotency | "Safe to retry" | 重复一个 side effect 产生的结果与一次尝试相同。 |
| Outbox pattern | "Decouple side effects" | 将 intent 写入 table；独立 executor 执行并标记完成。 |
| At-least-once delivery | "Possible duplicates" | Message queue semantics；dedup key 让 consumer 达到 effective-once。 |
| Rainbow deploy | "Overlapping versions" | 长时间运行 workloads 期间多个 runtime versions 并发存在。 |
| Async fiber | "Cooperative yielding" | User-mode concurrency；对于 I/O-bound loads，相比 threads 成本很低。 |
| Checkpoint | "State snapshot" | super-step 边界处的 serialized state；是 resume 的 key。 |

## 延伸阅读

- [LangChain — The runtime behind production deep agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) Diseño de tiempo de ejecución de LangGraph
- [MegaAgent](https://arxiv.org/abs/2408.09955) por agente en la cola entre productores y consumidores; miles de agentes de distribución
- [Matrix](https://arxiv.org/abs/2511.21686) Utiliza colas de mensajes como un marco descentralizado de sustrato de coordinación
- [Temporal docs](https://docs.temporal.io/) ejecución duradera de referencia del motor de flujo de trabajo
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Incluye el despliegue del arco iris en la experiencia de producción
