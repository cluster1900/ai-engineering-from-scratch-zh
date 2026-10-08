# AutoGen v0.4: Modelo de actor y marco de agentes

> AutoGen v0.4 (Microsoft Research, 2025) Rondando el modelo de actores 重新设计了代理配套──Asinc mensajes de intercambio、agentes impulsados por eventos、 aislamiento de errores、自然并发──El marco está ahora en modo de mantenimiento, mientras que Microsoft Agent Framework (previsión pública de octubre de 2025) está convirtiéndose en su sucesor──

**类型：**学习 + 构建
**语言：**Python (stdlib)
**先修：**Fase 14 · 01 (localización de agentes), Fase 14 · 12 (patrones de flujo de trabajo)
**时间：**75 minutos

## El objetivo del aprendizaje

- 描述 actor model:agent 作为演员,信息是唯一的IPC,每个演员 独立隔离故障──
- Expone tres niveles de API de AutoGen v0.4:Core,AgentChat y Extensiones, así como sus respectivos usos.
- Explicar por qué la entrega de mensajes y el manejo de la solución traen aislamiento de fallas y la naturaleza de la evolución.
- En Python para implementar un tiempo de ejecución de actor stdlib,并将将一个双代理代码审查流移植到其上.

##  problemas

La mayoría de los agentes de la estructura están en el mismo tiempo: un agente produce contenido, un agente consume contenido, se ejecuta en una pila de llamadas en el centro.

La respuesta de AutoGen v0.4 es: modelo de actor. Cada agente es un actor que tiene una bandeja de entrada privada. El mensaje es el único modo de comunicación.

## 概念

### Actores

Un actor tiene:

- Private tiene estado (exterior siempre no puede tener contacto directo)
- Una colada de entrada de mensajes
- Un manipulador:`receive(message) -> effects`, entre los efectos puede ser replyenviar a otros actorspawn actor update estadostop self

Dos actores no pueden compartir memoria. Sólo pueden enviar mensajes.

### AutoGen v0.4 En el medio de las tres capas de API

1. **Core.**Es un marco de actores de nivel inferior.`AgentRuntime`¿Qué es esto?`Agent`¿Qué es esto?`Message`¿Qué es esto?`Topic`◊Cambio de mensajes sincronizados, impulsados por eventos―
2. **AgentChat.**面向任务的高层API( sustituye v0.2 de ConversableAgent)`AssistantAgent`¿Qué es esto?`UserProxyAgent`¿Qué es esto?`RoundRobinGroupChat`¿Qué es esto?`SelectorGroupChat`¿Qué es eso?
3. **Extensions.**集成:OpenAI、Antropic、Azure、tools、memoria―

### ¿Por qué es importante?

En el modelo 0.2, también se utiliza`agent_a.chat(agent_b)`La acción de la agencia de bloqueo se realizará hasta que el agente regrese.`send(agent_b, msg)`El mensaje se pone en la bandeja de entrada del agente y luego vuelve inmediatamente.

- **Fault isolation.**El agente B                                                                                                                                                                                                                                                              
- **自然并发。**Muchos mensajes pueden ser enviados al mismo tiempo; el actor no puede enviar su propia bandeja de entrada.
- **面向分布式。**Ya sea que el actor esté en proceso o en otra casa, la bandeja de entrada + el transporte son todos los mismos.

### ¿Qué es esto?

- **RoundRobinGroupChat.**Agente en el orden de la circulación de las palabras.
- **SelectorGroupChat.**Agente selector 根据对话背景 选择下一位──
- **Magentic-One.**Utilizado para la navegación web, ejecución de código, manejo de archivos de referencia equipo multi-agente.

### ¿Qué es eso?

内置支持 OpenTelemetry── cada mensaje ciudad will发发出一个 span; herramienta llamada 根据2026 OTel GenAI semántica convenciones(Ley 23)携带 `gen_ai.*`Los atributos

### 状态:modo de mantenimiento

Inicio del año 2026: AutoGen v0.7.x para la investigación y el prototipo para decir es estable. Microsoft 已将 desarrollo activo 转向 Microsoft Agent Framework (2025 年 10 月 1 日 预览公众;1.0 GA 目标为 2026 年 Q1 末) ⋅ AutoGen patrón 可以干净地向前移植, actor modelo 是持久的思想──


```figure
actor-mailbox
```

## Construirlo

`code/main.py`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

- `Message`: con`sender`¿Qué es esto?`recipient`¿Qué es esto?`topic`¿Qué es esto?`body`La carga útil de la tipografía
- `Actor`: con`receive(message, runtime)`De los rasgos.
- `Runtime`:带有共享 queue、delivery、fault isolation de evento ciclo。
- Una demostración de actores dobles:`ReviewerAgent`código de revisión,`ChecklistAgent`运行 checklist; intercambian mensajes hasta llegar a un consenso.

运行:

```
python3 code/main.py
```

Trace se muestra la entrega de mensajes, un actor en el que no dejará que otro actor se derrumbe, así como el proceso de recibir un veredicto común.

## Usalo

- **AutoGen v0.4/v0.7**(mantenimiento): adaptado a la investigación, el prototipo y los patrones multi-agentes.
- **Microsoft Agent Framework**(previsión pública): futuro; igual actor-modelo 思想,刷新后的API。
- **LangGraph swarm topology**(Lección 13): a través de la entrega de herramientas compartidas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- **Custom actor runtime**Cuando necesites un transporte específico (NATS, RabbitMQ, GRPC)

##  entregarlo

`outputs/skill-actor-runtime.md`Se trata de una tarea multi-agente determinada. Se produce un tiempo de ejecución de actores mínimos y una plantilla de equipo.

##  ejercicios

1. Añade la cola de letras muertas: Cuando el manejador lanza un mensaje de fracaso, deja de ponerlo para un control artificial.
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `SelectorGroupChat`: Un actor seleccionador 根据对话状态 选择谁处理下一条条消息。
3. Añadir transporte distribuido: poner la cola en proceso en sustitución de JSON-over-HTTP servidor, para que el actor pueda operar en un proceso independiente.
4. Por cada mensaje, se puede enviar un mensaje de OTel en el transcurso del tiempo.`gen_ai.agent.name`¿Qué es esto?`gen_ai.operation.name`¿Qué es eso?
5. 阅读AutoGen v0.4 的 arquitectura post. 把你的玩具移植到真正的`autogen_core`¿Qué cosas importantes saltaste en la producción?

## 关键术语: "El hombre es un hombre"

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Actor | "Agent" | 私有 state + inbox + handler；没有共享 memory |
| Message | "Event" | 类型化 payload；actor 交互的唯一方式 |
| Inbox | "Mailbox" | 每个 actor 的 pending message queue |
| Runtime | "Agent host" | 路由 message 并隔离失败的 event loop |
| Topic | "Channel" | actor 之间命名的 publish-subscribe route |
| Fault isolation | "Let it crash" | 一个 actor 失败不会让其他 actor 崩溃 |
| RoundRobinGroupChat | "固定轮转 team" | Agent 按顺序轮流行动 |
| SelectorGroupChat | "按 context 路由的 team" | Selector 选择下一位 |
| Magentic-One | "参考 team" | 用于 web + code + files 的 multi-agent squad |

## 延伸阅读

- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) rediseño 文章
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Alternativa en forma de gráfico
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) AutoGen 默认发射跨度
