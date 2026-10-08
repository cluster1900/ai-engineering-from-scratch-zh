# OpenTelemetry GenAI 语义约定

> OpenTelemetry's GenAI SIG(2024年4月启动) definió el esquema estándar de la telemetría de agentes. Los nombres de dominio, los atributos y las reglas de captura de contenido se encuentran entre los diferentes proveedores, por lo que los rastros de agentes en Datadog、Grafana、Jaeger y Honeycomb representan el mismo significado.

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 24 (Observability Platforms)
**Time:** ~60 分钟

## El objetivo del aprendizaje
- Explicar las categorías de genAI:modelo/cliente, agente, herramienta
- 区分   Cómo es`invoke_agent`CLIENT y las extensiones internas, así como sus respectivas situaciones de uso.
- 列出顶层 GenAI atributos:Nombre del proveedor, modelo de solicitud, ID de fuente de datos.
- explicar contrato de captura de contenido:opt-in`OTEL_SEMCONV_STABILITY_OPT_IN`、recomendación de referencia externa¬¬¬

##  problemas
Cada vendedor ha inventado sus propios nombres de extensión. Los equipos de operaciones deben finalmente construir paneles de control separados para cada marco.

## 概念
### Categorías de extensión

1. **Model / client spans.**覆盖原始 LLM llamadas── por el proveedor SDKs(Antropic、OpenAI、Bedrock) y adaptadores de modelos de marco 发发出──
2. **Agent spans.** `create_agent`(agente de construcción 时) y `invoke_agent`(运行代理 时)
3. **Tool spans.**Cada vez que se invoca una herramienta, a través de la relación padre-hijo, se conecta con el agente.

### Nombramiento del agente span

- Nombre español: si se ha denominado,则为 `invoke_agent {gen_ai.agent.name}`El retraso`invoke_agent`¿Qué es eso?
- Tipo de espán:
  - **CLIENT** Usado para servicios de agentes remotos (OpenAI Assistants API, Bedrock Agents)
  - **INTERNAL** Utilizado en los marcos de agentes en proceso (LangChain, CrewAI, local ReAct)

### Los atributos clave

- `gen_ai.provider.name`¿ Qué es esto ?`anthropic`¿Qué es esto?`openai`¿Qué es esto?`aws.bedrock`¿Qué es esto?`google.vertex`¿Qué es eso?
- `gen_ai.request.model` Identificación del modelo。
- `gen_ai.response.model` 解析后的模型(可能因路由而不同于请求)。
- `gen_ai.agent.name` Identificación del agente。
- `gen_ai.operation.name`¿ Qué es esto ?`chat`¿Qué es esto?`completion`¿Qué es esto?`invoke_agent`¿Qué es esto?`tool_call`¿Qué es eso?
- `gen_ai.data_source.id`Para usar el RAG: consultó el cuerpo o la tienda.

Antropic、Azure AI Inference、AWS Bedrock、OpenAI tienen convenciones específicas de la tecnología―

### Captura de contenido

默认规则:instrumentations 默认 NO DEBE ser captado por las entradas/salidas.

- `gen_ai.system_instructions`
- `gen_ai.input.messages`
- `gen_ai.output.messages`

推的生产模式:将内容存储在外部(S3、你的日志店),在跨度上记录引用(pointer ID, y no en prosa) ⋅ es el método de envenenamiento de contenido de la Lección 27 防御接入可观察性──

### Estabilidad

截至 2026 年 3 月, la mayoría de las convenciones 仍是实验性──使用以下方式选择到稳定预览:

```
OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental
```

Datadog v1.37+ 会将 GenAI atributos 原生映射到其LLM Observability schema。其他 backends(Grafana、Honeycomb、Jaeger)

### Este modo es fácil de salir mal donde

- **在 spans 中捕获完整 prompts。**Los datos de los clientes entrarán en las operaciones.
- **没有 `gen_ai.provider.name`。**atribución 缺失时, panel de instrumentos multi-proveedor 会失效──
- **没有 parent links 的 spans。**Se producen espacios aislados de herramientas.
- **没有设置 stability opt-in。**Después de la subida, tus atributos podrían ser renombrados.


```figure
ae-genai-span-tree
```

## Construirlo
`code/main.py`实现 un emisor de espacio de tiempo compatible con las convenciones de GenAI:

- 带 GenAI esquema de atributos `Span`¿Qué es eso?
- 带 `start_span`、contexto anidado de `Tracer`¿Qué es eso?
- Un agente guionado corre, se lanzará:`create_agent`¿Qué es esto?`invoke_agent`(INTERNAL)  Espenso por herramienta  para llamadas de LLM `chat`extensiones
- Un modo de captura de contenido, se almacenan las instrucciones en el exterior y se extienden en los registros de IDs.

¿Qué es eso ?

```
python3 code/main.py
```

输出: un árbol de extensión que contiene todos los atributos de GenAI necesarios, así como una "tienda externa" que muestra referencias de contenido opt-in.

## Usalo
- **Datadog LLM Observability**(v1.37+) atributos de la distribución de origen.
- **Langfuse / Phoenix / Opik**(Lección 24)  auto-instrumental 生态。
- **Jaeger / Honeycomb / Grafana Tempo** rastros de OTel crudos; de los atributos de GenAI construir tablas de control。
- **Self-hosted** Utiliza un procesador de GenAI 运行 OTel Collector。

##  entregarlo
`outputs/skill-otel-genai.md`Se trata de un sistema de almacenamiento de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos

##  ejercicios
1. Uso `invoke_agent`(INTERNAL) + por herramienta se extiende instrumento Tu lección 01 Reacto ciclo──Enviar a una instancia Jaeger──
2. En el modo "sólo referencias" 中添加内容捕获:prompts 写入 SQLite,span attributes 只携带行 ID;;
3. 阅读   Cómo es`gen_ai.data_source.id`La especificación... se conectará a tu Lección 09 Memorando la búsqueda.
4.  configuración `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`,并验证 tus atributos no serán recogidos por el coleccionista Re-nombrado.
5. Construir un panel: sólo desde los atributos de GenAI, ver "qué errores en las herramientas se relacionan con qué modelos"―

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GenAI SIG | "OpenTelemetry GenAI group" | 定义 schema 的 OTel working group |
| invoke_agent | "Agent span" | 表示一次 agent run 的 span name |
| CLIENT span | "Remote call" | 调用 remote agent service 的 span |
| INTERNAL span | "In-process" | in-process agent run 的 span |
| gen_ai.provider.name | "Provider" | anthropic / openai / aws.bedrock / google.vertex |
| gen_ai.data_source.id | "RAG source" | retrieval 命中了哪个 corpus/store |
| Content capture | "Prompt logging" | 对 messages 的 opt-in capture；prod 中存储在外部 |
| Stability opt-in | "Preview mode" | 用于固定 experimental conventions 的 env var |

## 延伸阅读
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 规范
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 默认提供 GenAI extensiones
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) Inserido OTel
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) Contexto de rastreo de la W3C 传播
