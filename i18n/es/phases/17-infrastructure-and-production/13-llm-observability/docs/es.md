# LLM 可观测性 Estaca 选择

> El mercado de observación de 2026 se divide en dos categorías: plataformas de desarrollo: LangSmith, Langfuse, Comet Opik) pone la vigilancia y evaluaciones, la gestión rápida, la repetición de sesiones, juntos. Gateway/instrumentalismo: Helicone, SigNoz, OpenLLMetry, Phoenix) se centra en la remoción. Langfuse es un núcleo con licencia MIT y obtiene un buen equilibrio en el aspecto de la OSS.

**Type:** Learn
**Languages:** Python (stdlib, toy trace-sampling simulator)
**前置要求：**Fase 17 · 08 (Métricas de inferencia), Fase 14 (Ingeniería de agentes)
**Time:** ~60 分钟

## El objetivo del aprendizaje
- 区分开发平台(打包:evals + prompts + sessions)
- Se pueden utilizar en el proceso de diseño de las máquinas de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de diseño de la máquina de la máquina de diseño de la máquina de diseño de la máquina de la máquina de diseño de la máquina de la máquina de la máquina de la máquina de la máquina de diseño de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina de la máquina
- Explicar OpenTelemetry  Mode de unión, que permite que puedas poner la puerta de enlace  herramientas con una plataforma de evaluación independiente  组合起来──
- Explicar los costes de AX en 2026 (Arize AX's zero-copy method vs monolithic ingest), y explicar el multiplicador de aproximadamente 100x.

##  problemas
Usted está en línea con una función de LLM ⋅ puede trabajar. Pero usted no ve a fallas rápidas, bucles de herramientas, regresiones de latencia, picos de costos, o tasa de éxito de caché rápido. Usted Google LLM observabilidad, verá ocho herramientas que afirman resolver el mismo problema, y el precio de la página también está dividido en tres arquivos.

它们解决的不是同一个问题. LangSmith 回答为什么这次 LangGraph run 失败了? Phoenix 回答我的RAG管道是否漂浮? Helicone 回答哪个应用正在烧 टोकन? Langfuse 回答我能自主主办整个东西? 工具不同,受众不同──

¿Se trata de un sistema de gestión de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos$100/mo？$1000/mo?) y auto-hosting (¿necesita ser agradable a tener?)

## 概念
### 两类

**开发平台**Colocar observación y evaluaciones, control de datos, repetición de sesiones, y hacer regresión de los datos.

**Gateway/telemetry 工具**Para las llamadas de inferencia hacer la recopilación de herramientas  rapidez, respuesta, token, latencia, modelo, costo, Helicone, SigNoz, OpenLLMetry, Phoenix, más ligero, puede ser utilizado a través de OpenTelemetry y un conjunto de herramientas de evaluación independiente.

### Langfuse  OSS 平衡

- Core Apache / MIT con licencia; a través de Docker auto-hosting.
- Número gratuito en la nube: 50K eventos/mes.
- Evals, gestión de la rapidez, rastreo, conjuntos de datos, para las cuatro características de la plataforma de desarrollo tienen una cobertura razonable.
- Sweet spot: quieres funciones de LangSmith, pero debes ser auto-anfitrión o tener licencia OSS.

### Phoenix (Arize)  Telemetría-primero,OpenTelemetría-nativo

- Licencia Elastica 2.0; auto-acogida 很简单──
- 非常擅长 RAG 和漂移可视化──Embedding-space scatter plots es una función
- No es el diseño de la producción posterior a la perdurable, sino el desarrollo de la observabilidad.
- Punto dulce:Rag pipeline  desarrollo  deriva debugging,并与独立门户 搭配用于生产。

### Arize AX  juego en escala

- Comercial──a través de Iceberg/Parquet   lograr el lago de datos de copia cero 集成──
- 声称在尺度下比单石可观性(Datadog-class)便宜约100x──计算方式:你把痕迹存在自己 S3 上的Parquet 中;Arize 直接读取──
- "Punto dulce:> 10M de trazas/día"", ya hay un lago de datos"",quiero paneles específicos para LLM, pero no quiero pagar Datadog 价格。

### LangSmith  LangChain/LangGraph  prioridad

- Comercial, $39/usuario/mes. Solo Enterprise  soporte al propio host.
- Las pilas de LangChain y LangGraph son las mejores de su clase. Si no utilizas ambas, la atracción será mucho menor.
- El equipo ya está en la cadena de LangChain,并愿意付费.

### Helicone   base proxy de mínimo viable

-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `OPENAI_API_BASE`替换为 Helicone proxy,15-30 分钟完成设置──
- Licenciado por el MIT;100K recetas/m 免费, pagado $20/m + ⋅
- 包含 failover, caching, rate limits  也可充当 gateway──
- La profundidad de los rastros de agentes / múltiples pasos es menor.
- Sweet spot: rápidamente empezar, aplicación de pila única, necesita gateway + observabilidad 合一。

### Opik (Comet)  Plataforma de desarrollo OSS

- Apache 2.0, totalmente OSS.
- 功能集与 Langfuse 类似,带有彗星 传承──
- Lugar dulce: ya utilizó el equipo de ML de Comet, esperando obtener LLM en el mismo panel 可观测性──

### SigNoz  OpenTelemetry-first 完整APM

- Apache 2.0: a través de OpenTelemetry, también se trata de APM y LLM.
- El punto dulce:跨服务和 LLM llamadas de la unidad de observación.

### 粘合层:OpenTelemetry + Convenciones semánticas de GenAI

OpenTelemetry en 2025 años de finales publicó convenciones semánticas GenAI`gen_ai.system`¿Qué es esto?`gen_ai.request.model`¿Qué es esto?`gen_ai.usage.input_tokens`•■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

1. Desde cada LLM llamada 发发出符合GenaI convenciones OTel 
2. 路由到 gateway (Helicone / Portkey) para uso diario
3. 双写到 eval plataforma (Phoenix / Langfuse) para regresiones
4. 归档到数据湖(Iceberg), para ser utilizado a través de Arize AX o DuckDB hacer análisis de largo plazo.

### Entrapeamiento: en la equivocación de la capa de hacer herramientas

En el marco de los agentes 内部做工具化 (por ejemplo, añadir rastros de LangSmith) te llevará 合到该框架── en la capa de HTTP/OpenAI-SDK 做工具化 (a través de OpenLLMetry o tu puerta de enlace)

### Muestras  No puedes guardar todo

Cuando el volumen de solicitudes > 1M solicitudes/día 时, el coste de retención de seguimiento completo superará a las llamadas de LLM.

### Debes recordar el número

- Nube libre de Langfuse: 50K eventos/meses
- LangSmith: $39/usuario/meses
- Helicona libre: 100K reacutivos al mes.
- Arize AX afirma: en escala, inferior al monolito, es conveniente alrededor de 100 veces.
- Convenciones de OpenTelemetry GenAI: 2025  publicadas, 2026  ampliamente adoptadas.


```figure
i4-otel-glue
```

## Usalo
`code/main.py`模拟在不同保留策略(100% ingest,sampling,sampling + errors) 下一天 1M traces──报告存储成本以及每种策略下丢失的内容──

##  entregarlo
本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-observability-stack.md` De acuerdo con la pila, la escala, el presupuesto, la posición de la licencia  seleccionar los instrumentos 

##  ejercicios
1. Su equipo utiliza LangChain,并希望 OSS auto-hosted observabilidad──选择Langfuse或Opik 并说明理由──
2. En 5M rastros / día y Datadog 报价$ 150K / mes 时, calcular el equilibrio de Arize AX 
3. 设计一组你的组织指导方针 应要求每一个LLM call都必须包含的OpenTelemetry GenAI atributos。
4. ¿Fónix es suficiente para su producción? ¿Qué es?
5. El helicóptero tiene 20 ms de carga por proxy. ¿Cuando el P99 TTFT es de 300 ms, es aceptable?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OpenLLMetry | “OTel for LLMs” | 面向 LLMs 的开源 OpenTelemetry instrumentation |
| GenAI conventions | “OTel attributes” | LLM calls 的标准 OTel attribute names |
| LangSmith | “LangChain observability” | 与 LangChain ecosystem 打包的 commercial platform |
| Langfuse | “OSS LangSmith” | 具备类似功能集的 MIT OSS |
| Phoenix | “Arize dev tool” | OpenTelemetry-native dev/eval platform |
| Arize AX | “scale observability” | Commercial zero-copy Iceberg/Parquet observability |
| Helicone | “proxy observability” | 收集 LLM telemetry + gateway features 的 HTTP proxy |
| Opik | “Comet LLM” | 来自 Comet 的 Apache 2.0 OSS dev platform |
| Session replay | “trace rerun” | 带 tool calls 的完整 agent session replay |
| Eval | “offline test” | 在 labeled dataset 上运行 candidate model/prompt |

## 延伸阅读
- [SigNoz — 2026 顶级 LLM 可观测性工具](https://signoz.io/comparisons/llm-observability-tools/)
- [Langfuse — Arize AX Alternative analysis](https://langfuse.com/faq/all/best-phoenix-arize-alternatives)
- [PremAI — 设置 Langfuse、LangSmith、Helicone、Phoenix](https://blog.premai.io/llm-observability-setting-up-langfuse-langsmith-helicone-phoenix/)
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Arize Phoenix docs](https://docs.arize.com/phoenix)
- [Helicone docs](https://docs.helicone.ai/)
