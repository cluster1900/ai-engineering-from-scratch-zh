# Capstone 11  LLM 可观测性与Eval Dashboard

> Langfuse 转向开源核心──Arize Phoenix 发布了2026 GenAI semconv 映射──Helicone 和 Braintrust 都加码了按用户成本归因──Traceloop's OpenLLMetry 成为事实上的SDK仪器化──生产形态是使用ClickHouse 存储的痕迹,使用Postgres 存储的元数据,使用Next.js做UI,再加上一小支 eval、jobs(DeepEvalRAGAS、LLM-judge) 在样本的痕迹上运行──构建一个自主机版,至少从四类SDK家族摄入,并演示在五分钟内捕获一个注入的回归──

**Type:** Capstone
**Languages:** TypeScript (UI), Python / TypeScript (ingest + evals), SQL (ClickHouse)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P11 · P13 · P17 · P18
**Time:** 25 小时

##  problemas
Para 2026, cada operación de producción de flujo de IA  equipos  estarán en el lado del modelo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

Usted construirá un panel de control auto-hostado, que ingere al menos de cuatro clases de SDK familia, para detectar rastros muestrados 运行一小组 eval jobs,检测漂移并发发告警――衡门:给定一个故意注入的回归(一个开始产生 PII的提示), el panel de control puede capturarlo en cinco minutos并触发告警――

## 概念
Ingest utiliza OTLP HTTP。SDK 生成 GenAI-semconv se extiende:`gen_ai.system`¿Qué es esto?`gen_ai.request.model`¿Qué es esto?`gen_ai.usage.input_tokens`¿Qué es esto?`gen_ai.response.id`¿Qué es esto?`llm.prompts`¿Qué es esto?`llm.completions` Espasos 落入 ClickHouse hacer análisis columnar; metadatos(usuarios, sesiones, aplicaciones) 落入 Postgres。

Evals como trabajos de lote en las huellas de muestras 上运行。DeepEval 评估 fidelidad、toxicidad 和 respuesta relevancia。当 trace 携带检索背景 时,RAGAS 评估检索指标──自定义LLM-judges 运行域特定检查(PII leak、off-policy response)──Eval runs 会作为链接到父母追踪的 eval span 写回同一个 ClickHouse。

Detección de derivación  observar con el tiempo de cambios Embedding 空间分布(basado en la divergencia de PSI o KL de Embeddings prompt) así como en la evaluación de puntaje 趋势。Alertas  entrar en Prometheus AlertManager, luego en Slack / PagerDuty。UI 使用 Next.js 15 和 Recharts。

## 架构
```
production apps:
  OpenAI SDK  +  Anthropic SDK  +  Google GenAI SDK
  LangChain + LlamaIndex + vLLM
       |
       v
  OpenTelemetry SDK with GenAI semconv
       |
       v  OTLP HTTP
  collector (ingest, sample, fan-out)
       |
       +-------------+-----------+
       v             v           v
   ClickHouse    Postgres    S3 archive
   (spans)       (metadata)  (raw events)
       |
       +---> eval jobs (DeepEval, RAGAS, LLM-judge)
       |     sampled or all-trace
       |     write eval spans back
       |
       +---> drift detector (PSI / KL on prompt embeddings)
       |
       +---> Prometheus metrics -> Alertmanager -> Slack / PagerDuty
       |
       v
   Next.js 15 dashboard (Recharts)
```

## 技术
- Ingesta: SDKs de OpenTelemetry + convenciones semánticas de GenAI; transporte HTTP OTLP
- Colector: Colector de Telemetría Abierta, con procesador de muestreo de cola (para usar en el control de costes)
- Almacenamiento: ClickHouse 存 span, Postgres 存 metadatos, S3 存 archivo de eventos crudos
- Evals: DeepEval, RAGAS 0.2, paquete de evaluadores Arize Phoenix, juez de LLM personalizado
- Drift: PSI / KL en las incorporaciones rápidas conjuntas (transformadores de oraciones) semanalmente
- Alerta: Prometheus Alertmanager -> Slack / PagerDuty
- Interfaz de usuario: Next.js 15 App Router + Recharts + acciones del servidor
- 开箱即用支持的 SDKs: OpenAI, Antropic, Google GenAI, LangChain, LlamaIndex, vLLM


```figure
ce-otel-drift
```

## Construirlo
1. **Collector config.**Configurar el Colector de Telemetría Abierta, que incluye un receptor HTTP OTLP, un muestreo de cola de rastro de error del 100% y rastro de éxito del 10% y exportadores de ClickHouse y S3.

2. **ClickHouse schema.**   `spans`Las columnas de la GenAI se convierten en:`gen_ai_system`¿Qué es esto?`gen_ai_request_model`¿Qué es esto?`input_tokens`¿Qué es esto?`output_tokens`¿Qué es esto?`latency_ms`¿Qué es esto?`prompt_hash`¿Qué es esto?`trace_id`¿Qué es esto?`parent_span_id`, volver a añadir una bolsa JSON para grandes cargas útiles.

3. **SDK coverage test.**Utiliza cada SDK(OpenAI、Anthropic、Google、LangChain、LlamaIndex、vLLM) y OpenLLMetry auto-instrument 编写一个小型客户端应用──验证每个 SDK 都能生成可нонических GenAI spans,并落入 ClickHouse──

4. **Eval jobs.**Una tarea programada 读取近15分钟的样本痕迹,并运行DeepEval fidelidad、toxicidad 和答案相关性──输出是链接到父母痕迹的评估跨度──

5. **Custom LLM-judge.**Un juez de filtración de PII: Give determining a response,调用 a guard LLM to evaluate the probability of PII leak──高分 responses 进入 triage queue──

6. **Drift detection.**Trabajo semanal 计算本周 集结快速嵌入与过去4周基线之间的 PSI──如果PSI 超过门,则告警──

7. **Dashboard.**Utilización de la página:Visión de la página:Spanes/sec,costo/usuario,latencia de p95) Traces, búsqueda, cascada,evaluación, tendencia de fidelidad, toxicidad, desvío,PSI en el tiempo,alertas.

8. **Alerting chain.**Exportador Prometheus 读取 eval score aggregates 和 latency percentiles;Alertmanager va a advertir 路由到Slack,将关键违规 路由到PagerDuty。

9. **Regression probe.**Introducción de un error: está evaluado chatbot tiene un 1% de probabilidades de comenzar a salir falsas SSNs.

## Usalo
```
$ curl -X POST https://my-otel-collector/v1/traces -d @trace.json
[collector]  accepted 1 trace, 3 spans
[clickhouse] inserted 3 spans (app=chat, user=u_42)
[eval]       DeepEval faithfulness 0.82, toxicity 0.03
[drift]      weekly PSI 0.08 (below 0.2 threshold)
[ui]         live at https://obs.example.com
```

##  entregarlo
`outputs/skill-llm-observability.md`Es decir, el sistema de gestión de los datos de la empresa puede ser utilizado para evaluar los resultados de la aplicación.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Trace-schema coverage | 生成 canonical GenAI spans 的 SDK families 数量（目标：6+） |
| 20 | Eval correctness | DeepEval / RAGAS scores 对比 hand-labeled set |
| 20 | Dashboard UX | 注入 regression 的 MTTD（目标低于 5 分钟） |
| 20 | Cost / scale | 持续以 1k spans/sec ingest 且无 backlog |
| 15 | Alerting + drift detection | Prometheus/Alertmanager chain 端到端演练 |
| **100** | | |

##  ejercicios
1. Para el marco de Haystack 添加定制仪器化──验证 cánones de extensiones 以忠实 `gen_ai.*`Los atributos 落入 ClickHouse。

2. En la misma serie de rastros, arriba se cambia DeepEval a evaluadores Phoenix.

3. 强化漂移检测器: según la aplicación-id y no en todo el mundo calculado PSI.

4. 添加一个"impacto del usuario" 页面:cost-per-user 和 failure-rate-per-user,并带有闪光线──

5. Construir una política de muestreo de cola: conservar 100% de toxicidad > 0,5 de rastros, volver a hacer un 10% de muestreo estratificado sobre los demás rastros ⋅

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GenAI semconv | "OTel LLM attributes" | 2025 OpenTelemetry spec，用于 LLM span attributes（system、model、tokens） |
| Tail sampling | "Post-trace sample" | Collector 在 trace 完成后决定保留还是丢弃（可以查看 errors） |
| PSI | "Population stability index" | 比较两个分布的 drift metric；> 0.2 通常表示有意义的 drift |
| LLM-judge | "Eval as model" | 一个 LLM 按 rubric（faithfulness、toxicity、PII）为另一个 LLM 的 output 打分 |
| Tail-sampling policy | "Keep-rule" | 决定哪些 traces 持久化、哪些丢弃的规则；errored + sample-rate |
| Eval span | "Linked eval trace" | 携带 eval score、并链接到原始 LLM call span 的 child span |
| Cost per user | "Unit economics" | 在一个窗口内归因到某个 user_id 的美元成本；关键 product metric |

## 延伸阅读
- [Langfuse](https://github.com/langfuse/langfuse) referencia observabilidad en núcleo abierto 平台
- [Arize Phoenix](https://github.com/Arize-ai/phoenix)                                                                                                                                                                                                                                                              
- [OpenLLMetry (Traceloop)](https://github.com/traceloop/openllmetry) Familia de SDK de instrumentos automáticos
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) esquema de ingesta
- [Helicone](https://www.helicone.ai) 另一个 alojado observabilidad
- [Braintrust](https://www.braintrust.dev) 另一个 eval-first plataforma
- [ClickHouse documentation](https://clickhouse.com/docs) almacenaje de columnas
- [DeepEval](https://github.com/confident-ai/deepeval) Biblioteca de evaluadores
