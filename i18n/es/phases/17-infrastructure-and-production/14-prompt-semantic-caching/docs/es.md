# Caching rápido y Caching semántico 经济学

> **Pricing snapshot 日期为 2026-04。**Las siguientes declaraciones de valor reflejan las tarjetas de tarifas de los vendedores recogidas durante la publicación de esta clase; en la siguiente página, antes de hacer referencia, por favor, primero, consulte el enlace de archivo de verificación.

> Caching 发生在两层──L2(provider-level)prompt/prefix caching 会为重复 prefix 复用注意 KV  Anthropic 的快速缓存文件 宣称,在长时间的提示上最高可降低90% 成本、降低85%延迟;对于Claude 3.5 Sonnet,cache reads为$0.30/M，而 fresh 为 $3.00/M,TTL para 5 minutos, 1 hora TTL 选项有2x write premium(docs.anthropic.com,2026-04)。OpenAI prompt caching 会自动应用于 ≥1024 tokens的提示,并将缓存输入 定价相对新鲜约90%折扣(platform.openai.com,2026-04); exacta tasa caché por modelo 取决于实速卡──L1app-level) 语义缓存 会在嵌入式相似性中完全跳过LLM──Vender 95%精度指的是匹配正确度,而不是击率  报告的击率从10%开封聊天) 升级到结构化查询) 不等;

**Type:** Learn
**Languages:** Python (stdlib, toy two-layer cache simulator)
**前置要求：**Fase 17 · 04 (VLLM Serving Internals), Fase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 分钟

## El objetivo del aprendizaje
- 区分 L2 prompt/prefix caching (provedor lado KV 复用) con L1 semántico caching (L1 comparado con similarmente instrucciones) 绕过LLM)。
- 解释 Antropic 的 `cache_control`显式标记, así como dos opciones TTL ((5 min y 1 hora) y sus multiplicadores de precios。
- 根据击率、快速/响应混合和代币价格,计算预期月度节省。
- Dice que el encuentro hace que la inflación de los libros sea de 5-10 veces más anti-patrón de paralelación, así como que hace que la tasa de impacto se derrumbe en un patrón anti-patrón de contenido dinámico.

##  problemas
Usted le da su propio servicio RAG加了快速缓存. Usted mide la tasa de éxito; sólo 7%. Sus instrucciones parecen estar en estado de estado, pero en realidad no son  sistema de instrucciones 包含按分钟格式化的当前日期, ID de solicitud, así como ejemplos de la diversidad y la reestructuración de cada solicitud.

Además, su agente responderá a cada pregunta del usuario y ejecutará diez llamadas de herramientas.

El caché es un acuerdo, no una bandera. Dos niveles, dos modos de falla diferentes.

## 概念
### L2  almacenamiento en caché de los servicios de proveedores

Proveedor  almacenamiento cacheable prefijo de atención KV, y en el siguiente ajuste la solicitud de este prefijo 上复用它──你只支付一次写费,阅读 几乎免费──

**Anthropic (Claude 3.5 / 3.7 / 4 series)**:solicitud 中的显式 `cache_control`marcador──你标记哪些块可缓存──TTL:5 minutos(costos de escritura 为 1.25x base) o 1 hora(costos de escritura 为 2x base)──Cache se lee:Claude 3.5 Sonnet 上为$0.30/M，而 fresh 为 $3.00/M  便宜 10x(docs.anthropic.com,截至2026-04)。 diferentes precios de modelos 不同(Opus/Haiku 分别发布);始终交叉核对现场价格页──

**OpenAI**Las instrucciones de ≥1024 tokens se almacenan en caché automático (WEB (WEB (WEB (WEB) (WEB (WEB) (WEB) (WEB (WEB) (WEB) (WEB (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB) (WEB (WEB) (WEB) (WEB) (WEB) (WEB (WEB) (WEB) (WEB (WEB) (WEB) (WEB (WEB) (WEB (WEB) (WEB (WEB) (WEB) (WEB (WEB) (WEB (WEB) (WEB (WEB) (WEB) (WEB (WEB) (WEB (WEB) (WEB) (WEB (WEB) (WEB) (WEB (WEB) (WEB) (WEB) (WEB (WEB) (WEB) (en inglés) (en inglés) (WEB (en inglés) (en inglés) (en inglés) (en inglés) (en inglés)`usage.cached_tokens`Para medir tu propia situación.

**Google (Gemini)**: a través de API abierta hacer caché de contexto; 1M-token context significa caché de beneficios mayores.

**Self-hosted (vLLM, SGLang)**:Fase 17 · 06 介绍 RadixAttention  在你的自己的计算上采用相同模式──

### L1  aplicación 级 caché semántico

En el caso de los programas de formación de estudiantes, los estudiantes de la Universidad de California, San Diego, pueden obtener una respuesta de la misma manera que los estudiantes de la Universidad de California, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, San Diego, y otras otras otras personas que no pueden estar en el camino a la búsqueda de la búsqueda de la misma.

Fuente abierta:Similaridad de vectores redis、GPTCache、Qdrant。Comercial:Cache de llave de puerto、Cache de helicón。

Las afirmaciones de precisión del proveedor se refieren a la respuesta almacenada en caché de devolución en la frecuencia de respuesta adecuada en términos de lenguaje, en lugar de la frecuencia de producción.

- Con un chat abierto: 10-15%
- Preguntas frecuentes/apoyo estructurados: 40-70%
- Las preguntas de código: 20-30%
- Agentes de voz que repiten las instrucciones:50-80%

### El patrón antiparallelización

Su agente no ha lanzado 10 llamadas de herramientas. Todas las 10 tienen el mismo sistema de 4K-token de pedido. Cache antropico escribe es por solicitud. Primera caché-escrita en el proveedor. Ver el pedido  Después de unos 300 ms 完成.

修复:batch con secuencial-primero  单独发起请求 1,然后在 1 的缓存 已填充后再触发 2-10──给第一个工具调用 增加300 ms;节省 5-10x 账单──

### El antipatrón de contenido dinámico

Su sistema de respuesta se ve como:

```
You are a helpful assistant. The current time is 14:32:17.
User ID: abc123. Today is Tuesday...
```

Cada petición es única. Cada petición será escrita.

修复:把所有真正静态的内容移动到缓存前置;把动态内容 添加到缓存边界 之后:

```
[cacheable]
You are a helpful assistant. [rules, examples, instructions]
[/cacheable]
[dynamic, not cached]
Current time: 14:32:17. User: abc123.
```

ProjectDiscovery                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

### Batch de pila + caché para cargas de trabajo nocturnas

Las APIs de lote ((Fase 17 · 15) en el giro de 24 horas 下 ofrecer 50% de descuento.

### Números que debes recordar

Los puntos de precios son datos de 2026-04 recogidos de los documentos de los vendedores enlazados, y cada mes se cambian  Dependiendo de ellos, antes de revisar.

- Antropic se guardó en caché:Claude 3.5 Sonnet 上 $0.30/M, aproximadamente en comparación con la entrada fresca 便宜 10x(docs.anthropic.com)
- Antropic cache escribe premium:1.25x(5-min TTL) o 2x(1-hora TTL)。
- OpenAI auto-cache: se aplica a las instrucciones de ≥1024 tokens; en las tarjetas de tasa actual, la entrada caché 定价约为新输入的 10% ((platform.openai.com) 👇
- Taxa de hits de caché semántico(reportado por la comunidad):cate abierto 约 ~10%; FAQ estructurada 最高约 ~70%──no se documenta en base al proveedor。
- ProyectoDescubrimiento: a través de un proyecto de blog, el proyecto de proyecto de proyecto de 2021-2021
- Anti-patrón de paralelalización: típico informe muestra, cuando N 个 solicitudes paralelas 错过第一次 cache write 时,账单会膨胀 510x。


```figure
semantic-cache-hit
```

## Usalo
`code/main.py`模拟混合工作负载 上的 L1 + L2 caching──报告 hit rates、billo,并显示并并行处罚──

##  entregarlo
本课产 出  `outputs/skill-cache-auditor.md` Proponer una plantilla de tráfico y de tráfico, revisar la cachéabilidad y recomendar la reestructuración.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿Cuánto cambió la bandera de la paralela?
2. Su sistema de respuesta tiene un período de tiempo.
3. En caso de un dato de la tasa de llegada de la solicitud, calcular el break-even de 1 hora TTL ((2x escribir) con 5 minutos TTL ((1.25x escribir)
4. Caching semántico en el umbral de 0.95 下命中 20%──在 0.85 下命中 50%, pero ves errores de respuestas almacenadas en el caché── seleccionar el umbral correcto 并说明理由──
5. Usted para cada grupo de preguntas de usuario 10 subcuestiones paralelas.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| L2 prompt cache | "prefix cache" | Provider 存储重复 prefix 的 KV |
| `cache_control` | "Anthropic cache marker" | 标记 cacheable blocks 的显式 attribute |
| Cache write premium | "write tax" | 从首次 miss 到 cache 的额外成本（1.25x 或 2x） |
| L1 semantic cache | "embedding cache" | 调用 LLM 前在 app-level 进行 hash-and-embed |
| GPTCache | "LLM caching lib" | 流行的 OSS L1 cache library |
| Cache hit rate | "hits / total" | 从 cache 服务的 requests 占比 |
| Parallelization anti-pattern | "the N-write trap" | N 个 parallel requests 会 N 次 miss cache |
| Dynamic content trap | "the time-in-prompt trap" | prefix 中的 dynamic bytes 会破坏 hit rate |
| RadixAttention | "intra-replica cache" | SGLang 的 prefix-cache implementation |

## 延伸阅读
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) oficial `cache_control`La semántica y los TTLs
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) comportamiento de almacenamiento en caché automático y elegibilidad。
- [TianPan — Semantic Caching for LLMs Production](https://tianpan.co/blog/2026-04-10-semantic-caching-llm-production)
- [ProjectDiscovery — Cut LLM Costs 59% With Prompt Caching](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching)
- [DigitalOcean / Anthropic — Prompt Caching](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)
