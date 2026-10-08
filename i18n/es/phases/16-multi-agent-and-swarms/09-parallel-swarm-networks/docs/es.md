# Arquitecturas paralelas / conjuntas / en red

> Con respecto a un supervisor: no hay un decidero central. Los agentes 读取共享事件bus,异步领取工作,并写回结果. LongGraph 明确支持面向去中心化、动态环境的"Swarm Architecture" (arXiv:2511.21686) Matrix (arXiv:2511.21686) va a controlar el flujo y el flujo de datos y los mensajes transmitidos en filas distribuidas, para eliminar el orquestaje 瓶.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`, `queue`)
**前置要求：**Fase 16 · 05 (Patrón de supervisor), Fase 16 · 04 (Modelo primitivo)
**Time:** ~75 minutes

##  problemas
El supervisor puede extenderse a unos pocos trabajadores. ¿Qué? El supervisor en sí mismo se convertirá en un botellón: quien toma cada decisión debe pasar por un agente.

Arquitecturas de conjuntos Reversó este diseño. No es por el planificador central, sino que los trabajadores de la cola compartida se obtienen trabajos. La "coordinación" está en la semántica del bus de eventos.

## 概念
### La forma

```
                ┌──── shared queue ────┐
                │                      │
       ┌────────┼────────┐  ◄──────┬───┘
       ▼        ▼        ▼         │
     Worker  Worker  Worker   Worker
      A       B       C        D
       │        │        │         │
       └────────┴────────┴─────────┘
                 │
                 ▼
            results pool
```

没有调教员──每一个工人反复执行:拉取一个任务,处理,写入结果(并可选地 enqueue follow-ups)──

### Cuando el enjambre se ajusta

- **许多独立 tasks。**Descargar, transformar, clasificar, tareas que no dependen de los demás.
- **可变时长的工作。**Si algunas tareas requieren 100 ms, mientras que otras requieren 10s, el grupo se pondrá a la altura de la carga  快速工会拉取后续工作──Supervisor 必须提提前预测时间──
- **Throughput 优先于 determinism。**Se trata de tiempo de finalización, no de ordenes estrictos.

### Cuando el enjambre falla

- **有序 workflows。**Si el paso 3 necesita la salida del paso 2, el grupo puede hacer el paso 3 en el paso 2 完成前触发。
- **Global-plan tasks。**complejos preguntas de investigación 受益于规划者──un enjambre de investigadores 会产出独立事实, en lugar de un informe连贯──
- **Debugging。**没有 registro central 且工作 异步时,复现 bug 成本很高──

### Matriz (arXiv:2511.21686)

Matrix es un artículo de 2025, que se va a envuelvar  Drift towards Nature Conclusion: control flow y data flow are in distributed queues                                                                                                                                                                                                                                             

贡献: un modelo de programación, en el que la coordinación multiagente es  este agente 订阅哪个消息主题?, en lugar de supervisor 下一步选择哪个代理?

### Arquitectura de los grupos de LangGraph

LangGraph 2025 doc 明确将"Arquitectura de la Enredada" 描述为多代理模式 之一:agents are nodes, pero los bordes 形成带周期的导向图, y cualquier nodo puede ser activado en el pool.

### Modo de falla: hambre y puntos calientes

Si todos los trabajadores se llevan a la tarea más rápida disponible, tareas de larga duración hasta que sólo quedan ellos entonces serán obtenidos.

Mitigación:
- 带显显老的 Priority queues 随着等待时间 提高优先)
- Especialización de los trabajadores: algunos trabajadores sólo reciben tareas "longas".
- Presión de retroceso: limitación de las tareas rápidas de la cola Número de

### El enlace de enrutamiento basado en el contenido

Swarm y el enrutamiento basado en contenido (Lección 22) natural配对―― no usar cola genérica, sino preparar una cola para cada tipo de mensaje― trabajadores especializados sólo suscriban su propio tipo― es la base de las arquitecturas de mensajes-buses de miles de agentes―.


```figure
sw-work-stealing
```

## Construirlo
`code/main.py`Realizar un enjambre de cuatro hilos de trabajadores, que se comparten.`queue.Queue`En la actualidad, el número de tareas es de aproximadamente un millón de personas.

- **Sequential baseline:**Un trabajador 串行处理所有任务──
- **Fixed assignment:**Cada tarea se asigna previamente a un trabajador específico (estilo de supervisor).
- **Swarm:**Trabajadores de la cola compartida

Swarm se pondrá en equilibrio automático de carga; asignación fija se pondrá en una tarea asignada 很慢时让快工 置──

- ¿Qué quieres decir ?

```
python3 code/main.py
```

Resultados 会 muestra cuentas de tareas de cada trabajador                                                                                                                                                                                                                                                         

## Usalo
`outputs/skill-swarm-fit.md`评估一个任务 应该使用群 还是监督者──Inputs:task independence、duration variance、ordering requirements、debugability needs──

##  entregarlo
Lista de control:

- **带 aging 的 Priority queue。**prevenir la hambruna de tareas largas―
- **Worker idempotency。**Si un trabajador se desploma en medio de la carrera, una tarea puede ser retrasada varias veces.
- **Durable queue。**Productos y servicios de transporte y transporte de personas`queue.Queue`Sólo en la memoria.
- **每个 task 的 observability。**Cada tarea tiene un ID de rastro; cada trabajador lo usa para registrar el comienzo y el final.
- **Back-pressure。**Si la cola crece más rápido que los trabajadores se desagüe, la velocidad de la misma disminuye.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ En carga de trabajo de duración variable arriba, ¿cuánto más que la secuencia 快多少?
2. 添加一个优先排列变体(使用 `queue.PriorityQueue`)── por tarea campo de "importancia" de prioridad de distribución── observar en carga continua
3. 实现 un detector de puntos calientes: cuando cualquier trabajador 处理的任务 数量达到最慢工作者的 3× 时记录日志──说明任务时间分布 存在什么情况?
4. 阅读Matrix paper (arXiv:2511.21686) 摘要 和 Section 3──识别Matrix 接受一个具体交易️扩展性获取) 以及它放弃一个交易️追溯性、定制主义) ‖
5. 将 swarm demo 改为使用由 (task_type, payload) tuples 组成的 `queue.Queue`Cuando las tareas se construyen, ¿cuáles son las reglas de enrutamiento que son razonables?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Swarm architecture | "Decentralized agents" | Workers 从 shared queue 中拉取；没有 central orchestrator。 |
| Event bus | "Agents subscribe to topics" | 按 type 或 content 将 tasks 路由给 workers 的 message broker。 |
| Starvation | "Task never runs" | 因为 higher-priority work 持续到达，low-priority task 永远不会被选中。 |
| Hot-spotting | "One worker drowns" | 一个 worker 获得大多数 tasks 的 load imbalance。 |
| Back-pressure | "Slow down the producer" | 当 queue 填满时，向 upstream 发出停止生产信号的 mechanism。 |
| Idempotent worker | "Safe to re-run" | 一个 task 被处理两次会产生相同 result。因为 workers 可能在 mid-run 崩溃，所以这是必需的。 |
| Durable queue | "Survives crashes" | 由 disk 或 replicated storage 支持的 queue；worker 崩溃时 tasks 不会丢失。 |
| Matrix framework | "Full message-passing swarm" | Data 和 control flow 都是在 distributed queues 上的 serialized messages。 |

## 延伸阅读
- [LangGraph workflows and agents — Swarm Architecture](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 明确支持 enjambre
- [Matrix — A Decentralized Framework for Multi-Agent Systems](https://arxiv.org/abs/2511.21686) 完整 mensaje de paso enjambre
- [Anthropic engineering — why supervisor not swarm in Research](https://www.anthropic.com/engineering/multi-agent-research-system)¿Por qué un sistema de producción específico?
- [AutoGen v0.4 actor-model docs](https://microsoft.github.io/autogen/stable/) actor impulsado por eventos reescribir,比 v0.2 de GroupChat más cerca enjambre
