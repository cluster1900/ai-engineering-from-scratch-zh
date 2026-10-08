# SDK de agentes de OpenAI: Propiedades, protecciones, seguimiento

> OpenAI Agents SDK está basado en Respuestas API Construir un marco multi-agente de nivel ligero 五个原始人:Agent、Handoff、Guardrail、Session、Tracing。Handoff es el nombre de`transfer_to_<agent>`Las herramientas de control de seguridad se encuentran en la entrada o salida de control de control de seguridad.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## El objetivo del aprendizaje
- Explicar las cinco primitivas de OpenAI Agents SDK:
- Explicar las entregas: por qué se construyen como herramientas, el nombre del modelo, la forma y el contexto de cómo se transfieren.
- 区分 entradas de barandillas, salida de barandillas y herramientas de barandillas; explicación `run_in_parallel`Con el modo de bloqueo.
- Usando el tiempo de ejecución de un rastreo de estilo de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de reloj de r.

##  problemas
Los agentes de los delegados no pueden limpiar el contenido, pero finalmente lo ponen en un instante. Los agentes sin barreras entregarán PII, o lo harán en un ciclo permanente.

## 概念
### Cinco primitivos

1. **Agent.**LLM + instrucciones + herramientas + entregas。
2. **Handoff.**Delegar a otro agente.`transfer_to_<agent_name>`de la herramienta.
3. **Guardrail.**Para la entrada (solo el primer agente) ‧ salida (solo el último agente) o la invocación de herramientas (solo la invocación de herramientas) de cada función (solo la herramienta) validar la validación.
4. **Session.**跨 turns de la historia de conversación automática
5. **Tracing.**Generaciones de LLM, llamadas de herramientas, ayudas, vigilancia de las instalaciones de la aplicación.

### Las entregas como herramientas

模型会在它的工具列表中看 `transfer_to_billing_agent`❖调用 it will be into runtime 发出信号:

1. 复制 contexto de conversación `nest_handoff_history`beta se derrumbará)
2. Utiliza las instrucciones del agente objetivo inicializar el agente objetivo.
3. Utilice el agente objetivo para continuar corriendo.

Éste es el patrón de supervisión de la producción.

### Barras de seguridad

Tres tipos:

- **Input guardrails.**En cualquier llamada de LLM, antes de rechazar las solicitudes de inseguridad o de más allá del alcance,
- **Output guardrails.**En último agente de salida 上运行── capturar filtraciones de PII─ violaciones de políticas─respuestas malformadas―
- **Tool guardrails.**按 función-herramienta 运行──validar los argumentos、 permisos de inspección、 ejecución de auditoría──

Modo de trabajo:

- **Parallel**(默认) ――Guardrail LLM con el principal LLM 同时运行。更低尾延迟──如果触发,主要LLM的工作会被丢弃(浪费代币)。
- **Blocking**(El artículo`run_in_parallel=False`La primera de las llamadas de la compañía es la de la compañía de la compañía de la marca.

Los cables de tres tramos se lanzarán .`InputGuardrailTripwireTriggered`- ¿ Qué ?`OutputGuardrailTripwireTriggered`¿Qué es eso?

### Trazación

默认开启──每次LLM generación、 herramienta llamada、handoff 和 guardrail ciudades emitirán un span──`OPENAI_AGENTS_DISABLE_TRACING=1`Me voy a ir.`add_trace_processor(processor)`Las extensiones se extenderán hasta su propio backend, al mismo tiempo que se enviarán a OpenAI.

### Sesiones

`Session`将 conversación historia 存储在后端 中(SQLite、Redis、自定义)`Runner.run(agent, input, session=session)`¡Me voy a cargar y añadir!

### Este modo es fácil de salir mal donde

- **Handoff drift.**Agente A, la mano de vuelta a la agente B, Agente B, la mano de vuelta a la agente A.
- **Guardrail bypass.**Las barandillas de herramientas sólo están en las herramientas de función; herramientas de inserción (lector de archivos, búsqueda web) necesitan una política independiente.
- **Over-tracing.**Las líneas de contenido incluyen contenido sensible.


```figure
ae-agent-handoff
```

## Construirlo
`code/main.py`Usando el SDK forma dlib  implementado:

- `Agent`¿Qué es esto?`FunctionTool`¿Qué es esto?`Handoff`(como herramienta de función de la transcripción de la lengua)
- 带 input/output/tool guardrails、handoff dispatch 和 hop counter 的 `Runner`¿Qué es eso?
- Un simple emisor de espacio, para mostrar rastros de forma.
- Un agente de triaje, según la consulta del usuario, entregará la facturación o el soporte; guardrail 会在一个输入上触发.

运行:

```
python3 code/main.py
```

Trace mostró dos entregas exitosas, un viaje en barandillas de entrada y un árbol de espacio que emite contenido en relación con el SDK real.

## Usalo
- **OpenAI Agents SDK**Utilizado en los primeros productos de OpenAI.
- **Claude Agent SDK**(Lección 17) para productos de primera clase de claudio.
- **LangGraph**(Lección 13) Para usar la situación de tu estado explícito y resumen duradero que deseas.
- **Custom**Usar para que usted necesita un control preciso de la situación de la voz, multi-proveedores, despliegues federados.

##  entregarlo
`outputs/skill-agents-sdk-scaffold.md`Un equipo de trabajo de un equipo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de trabajo de

##  ejercicios
1. 添加 handoff hop counter: más de N 次 transferencias 后拒绝;; rastrear este comportamiento;;
2. ¿ Qué ?`nest_handoff_history`实现为一个选项:在转载前将 anteriores mensajes colapsar 成一个总结──
3. 编写一个阻塞输出 guardrail──比较会触发它的提示与通过提示的延迟──
4. ¿ Qué ?`add_trace_processor`connect to JSON logger―¿Qué forma emite para cada espacio?
5. 阅读SDK doc──将你的stdlib port de juguete hasta `openai-agents-python`¿En qué lugares has construido?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "LLM + instructions" | SDK 中的 Agent type；拥有 tools 和 handoffs |
| Handoff | "Transfer" | 模型调用以 delegate 给另一个 agent 的 tool |
| Guardrail | "Policy check" | 对 input / output / tool invocation 的 validation |
| Tripwire | "Guardrail trip" | guardrail 拒绝时抛出的 exception |
| Session | "History store" | runs 之间持久化的 conversation memory |
| Tracing | "Spans" | 覆盖 LLM + tool + handoff + guardrail 的内置 observability |
| Blocking guardrail | "Sequential check" | Guardrail 先运行；trip 时不浪费 Token |
| Parallel guardrail | "Concurrent check" | Guardrail 同时运行；latency 更低，trip 时浪费 Token |

## 延伸阅读
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) primitivos, manantiales, vigilancia, rastreo
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Claude 风格's homólogo
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)¿Cuándo realmente debería usar las ofertas?
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) Agentes SDK abarcan 映射到的标准
