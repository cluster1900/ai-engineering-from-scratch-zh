# Tiempos de ejecución de la producción: Cuadra, Evento, Cron

> Agente de producción 运行在六种运行时形 上:request-response、streaming、durable execution、queue-based background、event-driven 和 scheduled──先选择形,再选择 framework──Observability 在每种形中都是承载──

**类型：**El aprendizaje
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 13 (Langgrafo), Fase 14 · 22 (Voz)
**时间：**- 60 minutos

## El objetivo del aprendizaje

- Se han definido seis formas de ejecución de producción, y cada una se adaptará a un modelo de marco/producto.
-  Explicar por qué la ejecución duradera (LangGraph) para una tarea de largo horizonte  很重要──
- describir el tiempo de ejecución impulsado por el evento, así como los agentes administrados de Claude 适用场景──
- 解释 multi-step agent 中 observabilidad-as-load-bearing 这一说法。

##  problemas

El proceso de producción de un agente de producción, es el portátil de Jupyter  expone no sale: 37 pasos aparecen tiempo fuera de red, el usuario en llamada de voz  en camino de la conexión, cron trabajo en el reinicio de la máquina  muerte, el trabajador de fondo 內存耗尽──la forma del tiempo de ejecución decide qué fallas es recuperable──

## 概念

### Requisito y respuesta

- HTTP sincrono.
- Sólo se utiliza para tareas cortas.
- 技术:Agno (Python + FastAPI)、Mastra (TypeScript + Express/Hono/Fastify/Koa)。
- Observabilidad: estándar registro de acceso HTTP + OTel span。

### En streaming

- Utilice SSE o WebSocket para realizar una salida progresiva.
- LiveKit se extenderá a WebRTC, para uso de voz/vídeo (Lección 22)
- Estaca: cualquier framework de streaming + 能处理 SSE/WS del frente.
- Observabilidad: cada pieza de tiempo de consumo, latencia de primer token, latencia de cola.

### Ejecución duradera

- Cada paso después del cual se encuentra el estado del puesto de control; cuando falla, se recupera automáticamente.
- El modelo de actor de AutoGen v0.4 será un fracaso separado a un solo agente.
- Diferencias centrales de LangGraph (Lección 13)
- Cuando el número de pasos se desconoce y el costo de recuperación es alto, es necesario.

### Basado en la cola / fondo

- Trabajo en la cola, trabajador en la cola, resultado a través de un enlace web o un pub/sub.
- Para el agente de largo horizonte es necesario (cada tarea tiene unos cuantos pasos, véase el anuncio de uso de computadoras de Anthropic)
- Estaca:Celery (Python)、BullMQ (Node)、SQS + Lambda (AWS)、custom。
- Observabilidad: profundidad de cola, distribución de latencia de cada trabajo, tamaño de DLQ.

### El desarrollo de la actividad

- Agente 订阅 desencadenador: nuevo correo electrónico  PR abierto  Cron fuego ⋅
- Claude Administró Agentes 开箱即支持这一点 (Lección 17)
- Flujos de Equipos de Inteligencia Artificial (Equipos de Inteligencia Artificial) (lección 15) para organizar un flujo de trabajo determinista basado en eventos.
- Observabilidad: fuente de activación, latencia de inicio de eventos, latencia de agentes.

### Programación

- 周期性运行的 cron-shaped agent。
- Con ejecución duradera 结合使用, así el fracaso de la ejecución nocturna puede recuperarse en la próxima vez 时点.
- 技术:Kubernetes CronJob + marco duradero;托管方案(Render cron、Vercel cron)

### Modelo de despliegue de 2026

- **CrewAI Flows**Utilizándolo en la producción impulsada por eventos.
- **Agno**FastAPI sin estado Usado para microservicio Python.
- **Mastra**Adaptador de servidor(Express、Hono、Fastify、Koa) para su incorporación。
- **Pipecat Cloud / LiveKit Cloud**Con voz gestionada (lección 22)
- **Claude Managed Agents**Usándome en el asíncrono de larga duración.

### La observabilidad es la carga

Si no hay un espacio de OpenTelemetry GenAI (Lección 23) y un backend Langfuse/Phoenix/Opik (Lección 24), no puedes probar un agente multi-paso que no logre en el 40o paso. Esto no es una opción para la producción.

### Tiempo de ejecución de la producción 失败的位置

- **选错 shape。**Por un 5 minutos tareas seleccionar petición-respuesta.
- **没有 DLQ。**Trabajadores en cola 没有死字──失败的工作会消失──
- **不透明的 background work。**Agente de fondo 运行时不导出追踪. Hasta que el problema del usuario se informe, el fracaso es invisible.
- **跳过 durable state。**Cualquier cosa que exceda los 30 segundos, y no puedes soportar reiniciar el precio de ejecución, todo necesita una ejecución duradera.


```figure
wb-runtime-shapes
```

## Construirlo

`code/main.py`Es una demo multi-forma de stdlib:

- Punto final de respuesta a la solicitud (普通函数)
- El controlador de transmisión (generador)
- Trabajadores en cola de DLQ.
- Registro de activadores de eventos.
- Programación en forma de cron。

运行:

```bash
python3 code/main.py
```

输出:五条 痕迹,展示同一个任务在每种形下的行为──同一个套件代理逻辑,不同的外层 shell──可持续执行──第六种形) 已有意放在课13 中通过LangGraph检查点 讲解──

## Usalo

- **Request-response**Usado para el estilo de chat UX.
- **Streaming**Usó para una respuesta progresiva.
- **Durable**Usó para una tarea de largo plazo.
- **Queue**Utilizándolo en lote / sincronizado / de larga duración.
- **Event**Utilizando la reactividad del agente.
- **Cron**Para la gestión de la vivienda:

##  Publicarlo

`outputs/skill-runtime-shape.md`会为一个任务 选择运行时间形状,并连接可观测性要求──

##  ejercicios

1. ¿Cuál es la forma que se adapta a la superficie del producto?
2. 给排队的演示 添加 DLQ──模拟10% de fracaso de trabajo; exponer el tamaño de DLQ──
3. 编写一个 cron-triggered eval agent, cada noche para el día top 20 trace 运行
4. 实现带压力的流: si el cliente 很慢,就暂停代理――¿Cómo es esto con el presupuesto de turno 交互?
5. ¿Cuándo vas a mudarte a un agente de largo horizonte a administrado?

## 关键术语: "El hombre es un hombre"

| 术语 | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Request-response | “Synchronous” | 用户等待；只适合短任务 |
| Streaming | “SSE / WS” | Progressive output；更好的 UX；每个 chunk 的 latency 可观察 |
| Durable execution | “Resume from failure” | Checkpointed state；从最后一步 restart |
| Queue-based | “Background jobs” | Producer / worker pool / DLQ |
| Event-driven | “Trigger-based” | Agent 对 external event 作出反应 |
| DLQ | “Dead-letter queue” | 失败 job 的停车场 |
| Claude Managed Agents | “Hosted harness” | Anthropic-hosted long-running async，带 caching + compaction |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) ejecución duradera 细节
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) Asincronización de larga duración de la gestión
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use)  cada tarea 几十到几百步
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) aislamiento de fallas del modelo actor
