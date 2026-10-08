# RAG multimodal y recuperación transmodal

> RAG es un documento nativo de visión 只是 una de las piezas  Producción de RAG de nivel multimodal  Producción de nivel multimodal                                                                                                                                                                                                                                             

**Type:** Build
**语言:**Python (stdlib,带 fusion + generador en tierra de retriever transmodal)
**先修要求：**Fase 12 · 23 (ColPali), Fase 11 (bases del RAC)
**Time:** ~180 分钟

## El objetivo del aprendizaje
- 设计 cross-modal retrieval:text → image、image → text、audio → video etc。
- Compare tres estrategias de fusión: fusión de puntaje, fusión basada en la atención, fusión de MoE,
- Explicar la generación de tierra: cuando la fuente es una mezcla de múltiples modalidades, cita tus fuentes
- Explicar la taxonomía de los problemas de los RAG, así como sus hijos.

##  problemas
RAG de modalidad única es un modelo ya maduro: consulta integrada, fragmentos integrados, recuperación, inserción en la LLM.

1. Cada modalidad necesita un emplazamiento en el espacio de la capacidad).
2. 跨 modalidad 融合 resultados de recuperación
3. La generación de tierra, necesita citar la modalidad de la fuente.
4. 覆盖 cross-modal signal de evaluación de las métricas

Estas encuestas de 2025 finalmente dieron la misma taxonomía.

## 概念
### Recuperación transmódica

给定 modalidad A de la consulta, recuperar documentos de modalidad B──三种模式:

1. Espacio de incorporación compartido──CLIP 和 CLAP 在共享空间中生成文字 +图像 /文字 + audio Embedding──跨 modality 的共弦相似性 可以直接使用──受限于CLIP 训练过的配对──

2. Encodrador de modalidad + traducción。Encodrador de texto + codificador de imagen + un módulo de traducción pequeño, utilizado para mapear entre diferentes espacios。Gupta et al. de Sen2Sen y otros diseños de 2024 pertenecen a esta clase―灵活, pero aumentan la complejidad―.

3. VLM como codificador. Utilice estados ocultos de VLM como representación de recuperación. Cualquier modalidad de VLM 支持都可用.质量更高,成本也更高.

选择:text+image 用 CLIP / SigLIP 2;text+audio 用 CLAP;frontier 质量跨模式 用 VLM-hidden-states。

### Estrategias de fusión

Usted recuperó 10 resultados: 5 imágenes, 3 pasajes de texto, 2 clips de audio, ¿cómo se puede combinar?

Fusión de puntajes (最便宜) ∼ Cada modalidad tiene su propio retriever, cada retriever 返回分点──先在 modalidad内正常化分点,再求和──简单,通常有效──

Fusión basada en la atención, hacer una pequeña red de atención, darles más poder, necesitar entrenamiento.

Fusión de la red de puertas 路由到特种特种专家──不同查询 类型走不同路由,例如, visual question 会给图像更高权重──

Producción de resultados: fusión de puntajes, y una modalidad dominante de búsqueda un poco más orientada. Si A/B muestra un beneficio evidente en su dominio, vuelva a subir a MoE.

### Aterrizaje de generación

LLM  debería citar es el artículo recuperado 支了每一个索赔──对于多模式:

- Fuente de texto: Standard citation `[1]`¿Qué es eso?
- Fuente de imagen:`[img 3]`, con una breve leyenda.
- Audio:`[audio 2 at 0:34]`¿Qué es eso?

Utiliza datos conocedores de la base  entrenamiento generador: objetivo de formación En cada afirmación se marca el índice de fuente.

### Las encuestas de 2025

Abootorabi et al. ((arXiv:2502.08826,Ask in Any Modality):Taxonomía de RAG multimodal― 覆盖 recuperación、fusión、generación― 覆盖面最广──

Mei et al. ((arXiv:2504.08748,A Encuesta de RAG multimodal):重点关注 subtask benchmarks 和 failure modes──对评估设计 很有用──

Zhao et al. ((arXiv:2503.18016): encuesta de visión parcial― sobre el trabajo familiar de ColPali 理很强―

读完这三篇,你就能掌握到2025年春季的最新状态──大多数子问题仍开放──

### MuRAG  documento de base

MuRAG(Chen et al., 2022) es el primer artículo de Multimodal RAG―.

### Un ejemplo de planificador de viajes de producción

Pregunta: Ayuda a encontrar un brunch vegano tranquilo 

El gasoducto:

1. 分解 consulta──quiet → palabra clave de audio/revisión;vegan brunch → elemento del menú;luz natural → función de imagen
2. 按 modalidad recuperar:
   - Para las revisiones hacer la recuperación de texto: brunch vegano, ambiente tranquilo.
   - Para fotos de restaurantes hacer recuperación de imágenes: luz natural, aireada.
   - Para los clips de sonido ambiente hacer la recuperación de audio: Bajo decibel, sin música.
3. 融合 puntuaciones── cada restaurante tiene una puntuación compuesta──
4. Restaurantes de primera línea → Generador VLM, llevar todas las pruebas → 带引用 输出答案──

Esto ya está mucho más allá del texto-RAG. Cada modalidad ha incluido sólo el texto.

### Agentes de RAG multimodal

Multi-hop: si la primera recuperación  no regresa  高置信度答案, LLM 会重新формулировать并再次恢复──Fase 14 de Agente RAG 模式 se aplica aquí── ejemplos:

- Recuperar el top-10 inicial → LLM 询问太噪, filtro para <40 dB → volver a recuperar。
- Recuperar imágenes → LLM 发现其中一张有菜单 → recuperar el texto del menú → respuesta。

Esto aumentará la complejidad, pero puede procesar la extracción de una sola toma.

### Evaluación

Evaluamiento transmodal 仍不成熟──常见代理:

- Cada modalidad de la Recall@k。
- Precisión top-k fusionada
- El trabajo de la gente en el campo de la investigación.
- Completar las reservas, realizar compras y realizar compras)

没有覆盖所有modality的标准基准―― la mayoría de los documentos se encuentran en tareas específicas de dominio  上评价――


```figure
contrastive-matrix
```

## Usalo
`code/main.py`¿Qué es esto ?

- Tres falsos retrievers de texto, imagen y audio, operando en un corpus compartido de restaurantes.
- Punto de fusión, uso de pesas configurables 组合 modalidad de puntuación。
- Una fuente de generación, la respuesta final de las citas.
- Un simple ciclo de agentes, cuando la confianza es menor, reformula la consulta.

##  entregarlo
本课产 出  `outputs/skill-multimodal-rag-designer.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                                                                                 

##  ejercicios
1. ¿Qué modalidad de extraer de qué KB?

2. La fusión de puntaje es una simple suma ponderada. ¿Qué modo de falla es la fusión de MoE que se puede evitar?

3. 阅读 Abootorabi et al. 的 taxonomía(Sección 3)。 Tres subproblemas canónicos ¿qué es? ¿cómo se reflejan en el producto que usted elige?

4. ¿Qué métricas cubren el recuerdo de imágenes, el recuerdo de audio y la corrección compuesta?

5. Agente multi-hop RAG Cada ronda de ida y vuelta ciudades tienen impuestos de latencia. ¿Cuál es la precisión de la información?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Cross-modal retrieval | “Query 一个 modality，retrieve 另一个” | Text query retrieve images；image query retrieve text；需要 shared space 或 translator |
| Score fusion | “组合 scores” | 对每种 modality 的 retrieval scores 做 weighted sum；最简单的 fusion |
| MoE fusion | “Modality-routed experts” | Gating network 按 query 选择信任哪种 modality 的 scores |
| Grounded generation | “Cite your sources” | 答案中的每个 claim 都标注 source index |
| MuRAG | “第一个 Multimodal RAG” | 2022 年 paper，建立了 Multimodal RAG 模式 |
| Agentic multi-hop | “Reformulate and retry” | 当 first-pass confidence 较低时，LLM 重新 query retrievers |

## 延伸阅读
- [Abootorabi et al. — Ask in Any Modality (arXiv:2502.08826)](https://arxiv.org/abs/2502.08826)
- [Mei et al. — A Survey of Multimodal RAG (arXiv:2504.08748)](https://arxiv.org/abs/2504.08748)
- [Zhao et al. — Vision RAG Survey (arXiv:2503.18016)](https://arxiv.org/abs/2503.18016)
- [Chen et al. — MuRAG (arXiv:2210.02928)](https://arxiv.org/abs/2210.02928)
- [Liu et al. — REACT (arXiv:2301.10382)](https://arxiv.org/abs/2301.10382)
