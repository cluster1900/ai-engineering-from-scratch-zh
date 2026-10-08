# Agente 可观测性: Langfuse, Phoenix, Opik

> Tres agentes de código abierto 可观测性平台主导了 2026 年──Langfuse (MIT)  Cada mes 6M+ instalaciones, rastreo + gestión de solicitudes + evaluaciones + repetición de sesiones──Arize Phoenix (Elastic 2.0)  En profundidad 专用 evals、RAG 相关性、OpenInference auto-instrumentation──Comet Opik (Apache 2.0)  Automatización de solicitudes 优化、guardrails、LLM-judge 幻觉检测──

**类型：**El aprendizaje
**语言：**Python (stdlib)
**前置要求：**Fase 14 · 23 (OTel GenAI)
**时间：** 45 minutos

## El objetivo del aprendizaje

- Expone tres plataformas de código abierto de alto nivel y sus licencias.
- 区分每个平台最擅长的方面:Langfuse (secciones de mgmt + rápidas) Phoenix (RAG + auto-instrumentación) Opik (optimización + barandillas) 
-  Explicar por qué para 2026 el 89% de los informes de la organización ya han desplegado agente 可观测性──
- 实现 una con LLM-juzgado  evaluación de la traza de la tabla de control de la información 

##  problemas

OTel GenAI (Lección 23) te dio un esquema. Todavía necesitas una plataforma para ingerir versiones rápidas de almacenamiento y exponer regresiones.

## 核心概念 核心概念 核心概念 核心概念

### El proyecto de investigación

- Cada mes 6M+ SDK se instala, 19k+ GitHub estrellas.
- 功能:tracing、带 versioning + prompt management of playground、 evaluation(LLM-as-judge、user反、自定义) 、sesión de reemplazo。
- 2025 年 6 月:原先的商业模块(LLM-as-a-judge、anotation queues、prompt experiments、Playground) en MIT abajo fuente abierta。
- Lo mejor es que no se pueda hacer nada.

### Arize Phoenix (licencia elástica 2.0)

- Más profundo de Agente 专用评估: trace clustering, detección de anomalías, relevancia de la recuperación de RAG, en la actualidad.
- Originarios de la información abiertaInferencia auto-instrumentamiento
- Esta versión de Arize AX se utiliza en la producción.
- 没有快速版本  定位是与更广泛平台配合使用的漂移/行为-回归工具
- Última información: RAG 相关性、drift comportamental、detección de anomalías―

### Cometa Opik (Apache 2.0)

- A través de experimentos A/B                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
- Redes de seguridad (reducción de PII, restricciones de tema)
- Juez de LLM 幻觉检测。
- Comet  auto-medida de referencia: Opik logs + evals Us时 23.44s, mientras que Langfuse es 327.15s (aproximadamente 14x 差距) 
- Lo mejor es: ciclo de optimización, experimentación automática, aplicación de vigilancia.

### Datos de la industria

Según el análisis de campo de Maxim: el 89% de las organizaciones ya ha desplegado agentes可观测性; el problema de calidad es el principal obstáculo de producción.

### ¿Cómo elegir

| 需求 | 选择 |
|------|------|
| 带 prompt management 的一体化方案 | Langfuse |
| 深度 RAG 评估 + drift | Phoenix |
| 自动化 optimization + guardrails | Opik |
| 开放 license，不要 ELv2 | Langfuse (MIT) 或 Opik (Apache 2.0) |
| Datadog / New Relic 集成 | 任意 — 它们都导出 OTel |

### Este modo es fácil de salir mal donde

- **没有 eval strategy。**No hay rastreo de evaluación, sólo una extracción de madera costosa.
- **没有 grounding 的自建 LLM-judge。**Patrón crítico (LECCIÓN 05) 适用  jueces 需要外部工具进行事实验证──
- **Prompt versions 没有关联到 traces。**Cuando el prod se produce una regresión, no puedes dividir hasta que se produzca el problema.


```figure
wb-trace-ingest
```

## Construirlo

`code/main.py`实现 un colector de huellas de la empresa + evaluador de jueces de LLM:

- Ingesta de género 形态的跨度──
- 按 sesión 分组,标记失败 runs (según sesiones, marcas de seguridad, evaluaciones de seguridad)
- Un juez de LLM con guión, según la rúbrica Respostas de Agentes 评分──
- 类似仪表板的总结: tasa de fallas, razones de fallas principales, distribución de puntajes de la evaluación.

运行:

```
python3 code/main.py
```

输出: puntuaciones de evaluación de cada sesión y clasificación de fracasos, con arreglo al contenido de Langfuse/Phoenix/Opik 会展示.

## Usalo

- **Langfuse**Auto-hosted o en la nube; a través de OTel o de sus SDK 接入──
- **Arize Phoenix**Auto-hosted;auto-instrument OpenInference。
- **Comet Opik**auto-hosted o en la nube; bucle de optimización de automatización.
- **Datadog LLM Observability**适合已运行 Datadog de operaciones mixtas+ML 团队。

##  entregarlo

`outputs/skill-obs-platform-wiring.md`选择一个平台,并将追踪+evalues+prompte versions 接入现有代理──

##  ejercicios

1. ¿Qué sesiones han fracasado? ¿Por qué?
2. Para tu campo redactar una rubrica de LLM-juzgado ((( facts正确性、语气、范围遵循) ⋅ 在 50 条 条 痕 上测──
3. Comparar la versión de Langfuse con el clustering de pista de Phoenix... ¿cuál puede decirte qué está mal?
4. 阅读Opik's guardrail doc.──为你的一个代理运行 接入PII redacción guardrail──
5. En tu cuerpo, en el punto de referencia, estas tres plataformas, ignoran los números publicados por el proveedor, y miden tu propio.

## 关键术语: "El hombre es un hombre"

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tracing | “Spans collector” | Ingest OTel / SDK spans；按 session 建索引 |
| Prompt management | “Prompt CMS” | 关联到 traces 的 versioned prompts |
| LLM-as-judge | “Automated eval” | 单独的 LLM 按 rubric 对 Agent output 评分 |
| Session replay | “Trace playback” | 逐步回放过去的 runs 以便 debugging |
| RAG relevancy | “Retrieval quality” | retrieved context 是否匹配 query |
| Trace clustering | “Behavioral grouping” | 对相似 runs 聚类，用于 drift detection |
| Guardrail enforcement | “Policy at log time” | 对 logged content 做 PII/toxicity/scope checks |

## 延伸阅读

- [Langfuse docs](https://langfuse.com/) rastreo, evaluaciones, inmediato
- [Arize Phoenix docs](https://docs.arize.com/phoenix) auto-instrumentación  derivación
- [Comet Opik](https://www.comet.com/site/products/opik/) optimización + barandillas
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) Tres plataformas de todos los gastos esquema
