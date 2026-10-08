# 长时间运行的后台 Agentes:持久化执行

> Los agentes de producción no se ejecutarán en el`while True`En el marco de la aplicación de la ley, el programa de aprendizaje de código abierto (Code Cloud) se desarrolla en el marco de la aplicación de la ley de código abierto (Code Cloud) y se puede utilizar en el proceso de implementación de código abierto (Code Cloud).`thread_id`Por último, el nuevo punto de control 恢复──nova facilidad de uso, detrás, es un viejo modo Workflow 编排只是多一个新的输入:LLM 调用作为不确定性活动,必须在恢复时被确定性重播──

**Type:** Learn
**Languages:** Python (stdlib, minimal durable-execution state machine)
**先修要求：**Fase 15 · 10 (Modos de autorización), Fase 15 · 01 (agentes de largo horizonte)
**Time:** ~60 minutes

##  problemas

设想一个运行四小时的代理――它调用了三个工具,两次提示用户,并进行了四十次LLM 调用――运行到一半时,承载它的主机重启了――¿Qué pasará?

- En lo más simple.`while True`循环中:一切都会丢失──Run 从头开始──三工具调用(带有真实副作用) 将再次执行──用户会再次被要求批准已批准的事项──四十次 LLM 调用会被重新计费──
- Utilizacion de la permanencia:Run se realiza desde el punto de control más reciente 恢复── Actividades ya completadas no se volverán a ejecutar; sus resultados se reproducirán desde el registro de la permanencia── usuario no necesita volver a aprobar los hechos ya aprobados── ya completados LLM 调用不会重新计费──

Este es el mismo modelo que los motores de flujo de trabajo han estado entregando durante décadas (Temporal, Cadence, Uber's Cherami) ⋅ Nuevo cambio es LLM 调用现在也成为一种活动不确定性昂贵带有副作用并且它们很自然适应这一模式

La línea principal de este curso es: el ciclo largo de fiabilidad disminuirá. Si el diseño es correcto, es un nuevo método de falla de seguridad, si el diseño es incorrecto, entonces se va a fracasar de manera insegura.

## 概念

### Actividades  Flujos de trabajo y repetición

- **Workflow**Se debe ser de carácter definido, para que pueda reproducirse en el registro de eventos, sin que surjan diferencias inesperadas.
- **Activity**Una actividad puede ser conectada con sus entradas, así como las salidas después de su finalización, y se registran juntas.
- **Event log**Cada actividad comienza, completa, fracasa, se retira, y cada decisión del flujo de trabajo se registra.
- **Replay**Cuando se recupere, el flujo de trabajo se reinicializa; cada actividad ya realizada regresará a sus resultados registrados, pero no se reinicializa.

Esto se compara con React  en relación con DOM virtuales, o Git desde hace volver a construir el árbol de trabajo de la misma forma.

### ¿Por qué LLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

LLM 调用 tiene las siguientes características:
- La temperatura > 0; incluso la temperatura 0 también se debe a las versiones del modelo  cambios y desplazamientos)
- 昂贵(成本和延迟)
- Puede que no.
- 带有副作用 (如果它们调用工具)

Esta es la imagen típica de la actividad. Se puede utilizar una capa de la actividad cada vez que se realiza el LLM, así como el control de la repetición de la prueba de la actividad con un retiro exponencial.

### Es`thread_id`Por los puntos de control clave

LangGraph、Microsoft Agent Framework、Cloudflare Durable Objects 和 Claude Code Routines fueron recibidas con la misma API 形态:一个 `thread_id`(o similar) sesión de identificación; cada transición de estado se mantiene hasta el final de la sesión.

后端选择 es muy importante:

- **PostgreSQL**El programa de trabajo de la empresa de investigación de la industria de la información (LGIS) se ha desarrollado en el sector de la información.
- **SQLite**: sólo para el desarrollo local; a través del host 会丢失数据。
- **Redis**: velocidad rápida, pero si no se configura AOF/snapshot es temporal.
- **Cloudflare Durable Objects**: transparente distribuido; por exclusiva clave limitada;可存活数小时到数周──

### 工输入 como estado de primer nivel

Proponer-entonces-comprometerse (Lección 15) requiere una espera prolongada en el estado humano.

### Desgraciamiento de 35 minutos

METR  observado, todos los agentes 类别在连续运行超过大约35分钟后都出现可靠性衰退――任务时间长翻倍,失败率大致变为四倍――持久化执行不会修复这一点; simplemente permite que usted pueda operar más allá de la duración de la curva de fiabilidad apoyada――安全模式将耐久性与重入时需要新 HITL的检查点 结合,并配合预算杀开切符 (Leyón 13), Wall-clock time 如何都限制总计算――

### ¿Cuándo la ejecución de la perpetuación no es la respuesta correcta?

- 运行时间短于几分钟且没有人工输入――开销 > 收益――
- 严格只读的信息检索──
- Requerimiento de exactitud en una ventana de contexto de las tareas realizadas de extremo a extremo (contiene algunas tareas de cálculo; algunas tareas de generación única)


```figure
memory-consolidation
```

## Usalo

`code/main.py`Usando Python 实现 una máquina de ejecución de duración mínima―.

- `@activity`decorador,将 entradas y salidas 记录到 JSON event log。
- Una función de flujo de trabajo para la orden de actividades                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
- Una de ellas .`run_or_replay(workflow, event_log)`Función, puede reproducir Actividades completadas, sin volver a ejecutarlas.

El conductor 会模拟一个三 Actividad del flujo de trabajo, en medio de la caída,并展示 (a) 朴素再试会重新执行所有内容, y (b) replay 只运行缺失的活动──

##  entregarlo

`outputs/skill-durable-execution-review.md`El Comité de Seguridad y Seguridad de los Estados miembros (CPS) examinará si el Programa de Acción de la Agencia tiene una forma de ejecución correcta de la duración de una operación:actividades, determinismo, punto de control, estado de entrada humana y política de HITL en el currículum.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ observar el simple retraso y la repetición  Actividad  ejecutar diferencias en el número de veces  Modificar el punto de choque,并 mostrar el número de repeticiones 会相应变化──

2. Cambiar el motor de juguete para uso evidente`thread_id` Simula dos sesiones de desarrollo compartidas del mismo motor, y confirma sus registros de eventos 

3. En el motor de juguete, seleccione una actividad. Introducir un no-determinismo.`Workflow.now()`Las APIs)

4. 阅读 LangChain's Runtime behind production deep agents 文章──列出 runtime 持久化的每种状态,并说明每种覆盖了哪种失败模式──

5. ¿En qué punto de control estarás? ¿Qué tipo de resumen en el colapso? ¿Qué lugares necesitan HITL fresco?

## 关键术语: "El hombre es un hombre"

| Term | 人们通常怎么说 | 实际含义 |
|---|---|---|
| Workflow | “Agent 的脚本” | 确定性编排代码；可从 event log replay |
| Activity | “一个步骤” | 非确定性单元（LLM call、tool call）；执行前后都会被记录 |
| Event log | “backing store” | 每一次 state transition 的持久化记录 |
| Replay | “恢复” | 重新运行 Workflow；已完成 Activities 返回已记录结果，不重新执行 |
| Checkpoint | “保存点” | 以 thread_id 为 key 的持久化 state；resume 时最新状态胜出 |
| thread_id | “Session key” | 用来限定 durable state 范围的 identifier |
| 35-minute degradation | “可靠性衰减” | METR：成功率随周期大约呈二次下降 |
| Non-determinism | “replay 漂移” | Wall clock、random、LLM output；必须注册为 side effect |

## 延伸阅读

- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) presupuesto, vueltas y currículum 语义。
- [Microsoft — Agent Framework: human-in-the-loop and checkpointing](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) RequestInfoEvent 形态。
- [LangChain — The Runtime Behind Production Deep Agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents)  Requisitos específicos de tiempo de ejecución¬
- [OpenAI Agents SDK + Temporal integration (Trigger.dev announcement)](https://trigger.dev) LLM 调用 Actividad 形态。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 35 minutos de degradación 参考。
