# Las APIs de lote  50%  descuento se convirtieron en estándar de la industria

> Cada proveedor principal ofrece una API de lote sincronizado, con un 50% de descuento y alrededor de 24 horas de redirección. OpenAI, Google, y la mayoría de las plataformas de inferencia (Fireworks batch tier, Together batch) implementan el mismo modelo. Se colocan en caché los lotes y los caches rápidos, el costo de las tuberías durante la noche disminuye hasta el 10% del costo de la caché sin sincronizada. La regla es muy simple: si no es interactivo, debe colocarse en caché.

**Type:** Learn
**Languages:** Python (stdlib, toy batch-vs-sync cost simulator)
**前置要求：**Fase 17 · 14 (Cacing de inmediato y semántico)
**Time:** ~45 minutes

## El objetivo del aprendizaje
- Cuentan tres proveedores de lotes de APIs ((OpenAI、Anthropic、Google) así como un 50% de descuento + 24 horas de cambio 保证──
- 计算 overnight Clasificación de carga de trabajo 中叠加批+缓存输入的成本,并与同步未缓存基线对比──
- Desarrollar una carga de trabajo en un lote interactivo / semi-interactivo, y explicar las razones del camino.
- Cuentan dos trampas: interactividad parcial (¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡

##  problemas
Tu equipo publicó una línea de generación de informes nocturnos, 50.000 documentos, resumen individual, resúmenes de cluster, reapreciación de un informe ejecutivo, y el proceso de ejecución requiere 4 horas, el costo es de $2,000 por noche.

Batch 能给你50% 折扣──你还在系统提示(所有50k通话共享) 启动了快速缓存──叠加后,账单降至180$/night约为基线的9%──同一个管道,只改了三个配置──

El lote es el LLM más barato en el libro de herramientas, pero muy pocos utilizan los pólos. La razón principal es a nivel de organización: el equipo pensaba que era en tiempo real, pero el SLA en realidad era en la mañana.

## 概念
### Tres lotes de API

**OpenAI Batch API**En la práctica, normalmente alrededor de 2-8 horas)`/v1/batches`punto final―: los datos de entrada que cumplen con las condiciones de caché pueden obtenerse también precios de entrada caché­dos­ sobre esta base―:

**Anthropic Message Batches**: JSONL carga ∙ 24 horas de cambio ∙ 50% de descuento ∙ 支持 `cache_control`cache escribe es obvio, lee 会在批内自动发生──

**Google Vertex AI Batch Prediction**: BigQuery o entrada GCS──Gemini tiene similar 50% de descuento──

### Semántica: sincronizada, no lenta

El lote es 我承诺在24小时内回归不是这会花24小时──典型P50 es 2-6小时──Provedor reunirá en la GPU 库存利用不足的非高峰窗口调度你的批量──

### Con el almacenamiento en caché

Una resumen de 50k documentos, usando el mismo sistema de 4K-token:

- Sincronización sin caché:$input × 4000 + $Producción × 200), a las tasas completas。
- Sincrono caché: sistema de respuesta en la primera escritura 后被缓存; residuos 49999 veces obtener便宜 10x de entrada 后被缓存.
- Batch caché:以上全部,再加上 read 和 write 两者的 50% 折扣──

叠加效果:batch + cache = 约为同步未缓存账单的10%── cualquier operación de la noche a la mañana y tener un sistema compartido de respuesta de carga de trabajo deberían usarlo──

### Clasificación de la carga de trabajo

**Interactive** Usador espera respuesta;;TTFT 很重要;;使用带快速缓存的同步调用;;不能批次;;

**Semi-interactive** Usuario enviar tareas, pocos minutos después volver a ver.

**Batch** Usuario espera resultados por la mañana o la próxima hora──contento pipelines、grandes dimensiones Clasificación、análisis fuera de línea──始终批,始终叠加缓存──

常见错误: puesto que el pipeline es producción, debemos clasificar todo en interactivo.

### Interacción parcial 陷

Algunas funciones parecen interactivas, pero pueden tolerar 5-10 minutos. Por ejemplo: llevar con refresh 按 de la información de salud de los clientes por la noche.

La pregunta es: ¿Qué significa 24 horas para este usuario? Si la respuesta es que no lo notarán, entonces lo harán.

### plan de salida 陷

Formatos de archivo de lote 因 proveedor 而异:

- JSONL, cada una de las peticiones.
- Antropic:JSONL, cada uno de los mensajes; formato de respuesta 内嵌。
- Vertex:BigQuery tabla o con prefijo de GCS de TFRecord.

跨供应商编写 one batch client 意思每一个供应商都需要适配码──宣传多供应商批发的门户 Portkey、LiteLLM的某些层) sigue siendo simplemente un formato crudo hacer un envase delgado──

### Debes recordar el número

- Descuento por lote de los proveedores: entrada + salida 统一 50%。
- SLA de giro:保证 24 小时, típico P50 为 2-6 小时──
- 叠加 lot + entrada almacenada en caché: aproximadamente 10% del costo sincronizado sin caché.
- Reglas de clasificación de carga de trabajo: Si la latencia de 24 horas es aceptable, siempre y cuando sea posible.


```figure
batch-lane-triage
```

## Usalo
`code/main.py`Para una carga de trabajo de 50k documentos  calcular el costo de sincronización, sincronización + caché, lote, lote + caché ⋅ reportar en $ 和 % de ahorros de datos ⋅

##  entregarlo
本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-batch-triager.md` Determinar las características de la carga de trabajo, dividir en interactivo/semi/parcela,并 estimular los ahorros.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Para un pipeline de 100k-doc, utilizar un sistema de 3K-token de inmediato y 500-token de salida, calcular la pila completa(batch + caché) en comparación con la línea de base de sincronización de ahorros。
2. 选择一个你熟悉的真实产品中的三个特点――将每个特点分流到互动/semi/batch――
3. Los usuarios se quejan de que su informe pasó 3 horas. ¿Es un error de selección de lote, o es interactivo legalmente?
4. Su batch API retorno SLA es 24h, pero P99 es 20 horas. ¿Cómo se comunica con el usuario en este punto?
5.  calcular el equilibrio: longitud compartida-prefijo  alcanzar cuánto tiempo, lote + caché 会会比你的自己的预留 GPU 上一夜运行更便宜?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Batch API | “async discount” | 50% off，24h turnaround |
| JSONL | “batch format” | 每行一个 JSON request；OpenAI/Anthropic standard |
| Message Batches | “Anthropic batch” | Anthropic 的 batch API product name |
| Batch prediction | “Vertex batch” | Vertex AI 的 batch API product |
| Turnaround SLA | “24h promise” | 保证，不是典型值；典型是 2-6h |
| Workload triage | “interactivity decision” | Interactive / semi / batch routing decision |
| Output schema | “response format” | 每个 provider 的 JSONL layout；不可移植 |
| Stacked discount | “batch + cache” | 两者都适用时，约为 uncached sync bill 的 10% |

## 延伸阅读
- [OpenAI Batch API](https://platform.openai.com/docs/guides/batch) formato JSONL 和 `/v1/batches`La semántica.
- [Anthropic Message Batches](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing) formato de lote 和 `cache_control`Interacción
- [Vertex AI Batch Prediction](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/batch-prediction) Batch Gemini 语义。
- [Finout — OpenAI vs Anthropic API Pricing 2026](https://www.finout.io/blog/openai-vs-anthropic-api-pricing-comparison)
- [Zen Van Riel — LLM API Cost Comparison 2026](https://zenvanriel.com/ai-engineer-blog/llm-api-cost-comparison-2026/)
