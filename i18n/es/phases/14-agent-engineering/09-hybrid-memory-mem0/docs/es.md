# Memoria híbrida: Vector + Gráfico + KV (Mem0)

> Mem0 (Chhikara et al., 2025) se dividirá en tres conjuntos de almacenamiento: vector utilizado para la similaridad de idiomas, KV utilizado para la búsqueda de hechos rápidos, gráfico utilizado para la teoría de relaciones físicas.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 minutes

## El objetivo del aprendizaje
- 解释为什么单一存储(仅载体、仅图、仅KV) es insuficiente para支代理 记忆──
- Explicar los tres objetivos de Mem0 de almacenamiento en línea, así como el objetivo de optimizar cada uno de ellos.
- 描述 Mem0的融合评分:相关性,重要性,近期性,并解释为什么它是加权和,而不是层级结构──
- Usando el tiempo para lograr una memoria de juego, entre ellas.`add()`写入全部三个存储,`search()`融合結果──

##  problemas
 Para una de las tres clases de consultas, un solo almacén se ha equivocado:

- **语义相似性**¿Qué hemos discutido sobre la deriva de agentes?
- **事实查找**   用户的电话号码是什么? KV 胜出; Vektor 浪费资源,Graph 过于复杂──
- **关系推理**¿Qué clientes comparten con una misma entidad de facturación?

Los agentes en el entorno de producción se encuentran en una misma sesión y emiten tres tipos de consultas.`add`- ¿ Qué ?`search`表面后,并使用评分函数融合它们──

## 概念
### Tres y un ejemplos de almacenamiento

Mem0 (arXiv:2504.19413, abril 2025) Location`add(text, user_id, metadata)`时:

1. Desde el texto en el que se trata de un candidato (en inglés)
2. 将每个事实写入 Vector store (Embedding), para la búsqueda de palabras.
3. Para escribir cada hecho en KV store,以 (usu_id, fact_type, entity) como clave, para usar O(1) 查找。
4. Para cada hecho, escribir en el gráfico (Mem0g), para la consulta de relaciones.

En el`search(query, user_id)`时:

1. Almacenamiento vectorial 按 Embedding cosine 返回 top-k。
2. KV store 返回基于查询派生的 (user_id, tipo, entidad) clave de la direct命中──
3. Almacenamiento de gráficos  Retorno de la consulta a la subgrafía de la entrada
4. Un nivel de evaluación de la integración.

### Punto de puntuación de fusión

```
score = w_relevance * relevance(q, record)
      + w_importance * importance(record)
      + w_recency * recency(record)
```

- **相关性** Cosino vectorial KV 精确匹配 图路重──
- **重要性** En la escritura打标签或学习得到 ((( ciertos hechos son más importantes:姓名、ID、政策)
- **近期性**                                                                                                                                                                                                                                                              

权重按产品调优──聊天代理 使用更高的 `w_recency`; agentes de conformidad 使用更高的 `w_importance`; agentes de investigación  使用更高的`w_relevance`¿Qué es eso?

### Mem0g y el razonamiento temporal

Mem0g  aumentó el controlador de conflictos. Cuando los hechos nuevos se oponen a los límites existentes, los límites existentes se etiquetan como inválidos, pero no se eliminan.

Este es el patrón de invalidación de Letta y el comportamiento de la norma que se generaliza.

### Números de referencia

Mem0 documento 报告了以下结果(2025):

- **LoCoMo**(长篇对话记忆): 91.6
- **LongMemEval**(长时间跨度 memoria episódica): 93.4
- **BEAM 1M**(M-token 记忆 referencia): 64.1

En comparación con las líneas de base, la definición de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de datos de la base de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos

### Taxonomía de alcance

Mem0 按范围 划分记忆:

- **用户记忆** 跨会议 持久化,以 `user_id`Por la clave.
- **Session 记忆** En un hilo dentro de la perpetuidad
- **Agent 记忆** Estado de cada instancia de agente

Cada vez que escribe, escogerá un alcance. La búsqueda puede utilizar el peso de cada alcance.

### Este modo es fácil de salir mal donde

- **Embedding drift.**El resultado vectorial en las primeras cien consultas parece correcto, pero se incorporará con el corpus  crecimiento y retroceso ∞ para los registros más altos N- utilizados ∞ re-embedado periódico ∞
- **KV schema creep.** `(user_id, type, entity)`Parece simple, hasta que cada equipo se une a su propio.`type`◊ Tipo de auditoría de cada trimestre 集合。
- **Graph explosion.**Un extractor de ruido Cada mensaje añade 50 bordes... limita cada vez.`add`调用图 写入数;丢弃低置信度边缘──


```figure
ae-memory-fusion
```

## Construirlo
`code/main.py`Usdlib 实现三存储模式:

- `VectorStore` Usar simples símbolos de superposición de similitud 作为 Embedding 替代──
- `KVStore` 以 `(user_id, fact_type, entity)`Por lo que es lo que dice.
- `GraphStore` bordes tipados(sujeto, relación, objeto, válido)
- `Mem0` 顶层 fachada,包含 `add()`¿Qué es esto?`search()`、Puntura de fusión y recuperación consciente del alcance―
- Un usuario más, varias sesiones para un seguimiento completo de las conversaciones.

运行:

```
python3 code/main.py
```

输出会显示三条独立回忆路,以及融合后的顶-k――修改 `main()`Peso de puntuación de la parte superior, observe cómo cambia la clasificación.

## Usalo
- **Mem0 (Apache 2.0)** 生产就绪──可用 Postgres + Qdrant + Neo4j 自托管, también se puede utilizar la nube gestionada──
- **Letta** Tres niveles de núcleo/recall/archivo;自带 Vector 和 Graph backends。
- **Zep** 商业替代方案,带时间 KG 和 fact extraction──
- **Custom builds** Cuando necesite un control preciso de los pesos de extractor (合规) o de fusión (近期性占占主导的语音代理)

##  entregarlo
`outputs/skill-hybrid-memory.md`Se generará un esquadrón de memoria de tres almacenes, entre los cuales se conectará el puntero de fusión, la taxonomía del alcance y la invalidación temporal.

##  ejercicios
1. ¿Cuál es la diferencia entre los modelos de embedding y los modelos de embedding? ¿Qué es el modelo de embedding?
2. 添加时间查询:`search(query, as_of=timestamp)` Sólo devolver los registros válidos en el mismo tiempo o antes  ¿Cuál almacenaje necesita más cambios?
3. 实现冲突检测器: If传入事实与图边 矛盾,invalidate 旧边,并同时记录两者──在 user lives in Berlin -> user lives in Lisbon 上测试──
4. 扩展 fusion scorer,加入 `user_feedback`¿Cómo puedes evitar que el agente juegue? ¿Sólo devuelve los registros que ya le gustaron?
5. 阅读 Mem0 documentos (`docs.mem0.ai`•■¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡`mem0`Las llamadas de clientes. En las mismas 20 preguntas de prueba.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Hybrid memory | “Vector plus graph plus KV” | 三个并行写入的存储，在检索时融合 |
| Fact extraction | “Memory ingestion” | 将文本拆解为 (entity, relation, fact) tuples 的 LLM 步骤 |
| Fusion scoring | “Relevance ranking” | 相关性、重要性、近期性的加权和 |
| Scope | “Memory namespace” | user / session / agent，决定谁能看到什么 |
| Mem0g | “Memory graph” | 带时间有效性的 typed edges，用于关系查询 |
| Temporal invalidation | “Soft delete” | 将矛盾 edges 标记为 invalid；绝不删除 |
| Embedding drift | “Retrieval rot” | Vector 质量随 corpus 增长而下降；周期性 re-embed |

## 延伸阅读
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) Papel original
- [Mem0 docs](https://docs.mem0.ai/platform/overview) Producción de API, SDK, nube gestionada
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) contexto virtual 前身
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) Tres niveles de diseño hermano
