# Capstone 02  Codebase 上的 RAG(跨 Repo Buscar semántica)

> En 2026 años, cada organización de ingeniería seria llevará a cabo una búsqueda de código interno que no sólo se ajuste a la búsqueda de código interno. En el año 2026, cada organización de ingeniería será capaz de realizar una búsqueda de código interno. En el año 2026, cada organización de ingeniería será capaz de realizar una búsqueda de código interno. En el año 2026, cada organización de ingeniería será capaz de entender el significado y no sólo de combinar la búsqueda de código interno. En el año 2026, cada organización de ingeniería urbana implementará una búsqueda de código interno. En el año 2026, cada organización de ingeniería implementará una búsqueda de código interno. En el año 2026, cada organización de ingeniería urbana implementará una búsqueda de código interno. En el año 2026, cada organización de ingeniería implementará una búsqueda de código interno. En el año 2026, cada organización de ingeniería implementará una búsqueda de código interno. En el año 2026, cada organización de ingeniería implementará una búsqueda de código interno. En el código base de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de

**类型：**Capstone
**语言：**Python (ingestión) ✓ Tipo de escritura (API + UI)
**前置要求：**Fase 5 (fundamentos de la PNL) Fase 7 (transformadores) Fase 11 (ingeniería de la LM) Fase 13 (herramientas) Fase 17 (infraestructura)
**练习到的 Phases：**P5 · P7 · P11 · P13 · P17
**时间：**30 小时

##  problemas
Para 2026, cada agente de codificación fronteriza estará preparado para la recuperación de código base, ya que sólo se puede resolver en contextos de las ventanas de contexto 跨 repo 问题;; el contexto 1M-Token de Claude tiene ayuda; pero no eliminará la demanda de recuperación clasificada;; hacer una simple búsqueda cosina de los trozos en bruto, generar código、monorepo duplicación, así como muy pocos símbolos importados 长尾上污染结果;; la respuesta de la clase de producción es: hacer híbridos en los trozos conscientes de AST dense + BM25) búsqueda, además de re-ranquear, y por símbolos de referencia gráfico 支;;

Usted va a pasar por la indicación de una flota real para aprender esto, en lugar de sólo la indicación de un repos tutorial, y medir la fidelidad de MRR@10 , citación y la frescura incremental. Los modos de fracaso son a nivel de infraestructura: un monorepo de archivo de 100k, una vez cambiar la mitad de los archivos, una necesidad de atravesar cuatro repos para responder correctamente a la pregunta.

## 概念
El proceso de ingestión de datos de la plataforma AST-consciente utiliza el árbol-sister 解析每个文件,提取函数 和 class nodes, y en los límites de los nodos en lugar de fijarse Token windows 上切 chunk。 cada chunk 会得到三种表示:dense Embedding(Voyage-code-3 或 nomic-embed-code) ̇sparse BM25 términos,以及一句简短的自然语言总结──总结 增加了第三种可检索模态:用户会问 如何是X授权,而总结会提到 authz,即使代码里只有`check_permission`¿Qué es eso?

Recuperación es híbrido de──una consulta 会同时触发密集 和 BM25 búsquedas,合并 top-k,并把 union 交给跨编码重排名(Cohere rerank-3 或 bge-reranker-v2-gemma-2b)──re-ranked list 会进入长文段合成器(带快速缓存的Claude Sonnet 4.7,或自主主机Llama 3.3 70B),并要求每个索赔都用 和线域引用──没有引用的答案文件将被后过拒绝──

La actualidad incremental es un problema de infraestructura. GIT Push 会触发 diff: ¿qué documentos han cambiado, qué símbolos han cambiado? Sólo los fragmentos afectados se volverán a incorporar.

## 架构
```
git push --> webhook --> ingest worker (LlamaIndex Workflow)
                           |
                           v
             tree-sitter parse + AST chunk
                           |
            +--------------+----------------+
            v              v                v
          dense        BM25 index       summary (LLM)
        (Voyage / bge)  (Tantivy)        (Haiku 4.5)
            |              |                |
            +------> Qdrant / pgvector <----+
                            |
                            v
                      symbol graph (Neo4j / kuzu)
                            |
  query --> LangGraph agent (retrieve -> rerank -> synth)
                            |
                            v
                 Claude Sonnet 4.7 1M context
                            |
                            v
                 answer + file:line citations
```

## 技术
- Parsando:带 17 种语言语法的树-sitter (Python,TS,Rust,Go,Java,C++,etc.)
- Embedings densos:Voyage-code-3(hosted) o nomic-embed-code-v1.5(self-host),bge-code-v1 fallback
- Indice de dispersión:带 BM25F 的 Tantivy(Rust), para el nombre del símbolo 和 cuerpo hacer campo ponderado
- Vektor DB:Qdrant 1.12, apoyo a la búsqueda híbrida; o cara a 50M vectores
- Modelo de resumen de piezas: Claude Haiku 4.5 o Gemini 2.5 Flash, con caché rápido
- Re-ranqueador:Ranque de cohesión-3 o auto-control bge-renqueador-v2-gemma-2b
- Orquestación:LlamaIndex Flujos de trabajo Usados para ingestión,LangGraph Usados para agente de consulta
- Sintesis:Claude Sonnet 4.7 ((1M contexto),带 caché rápido
- Gráfico de símbolos:Neo4j(administrado) o kuzu(embedded), para importar y call edges
- Observabilidad: cada retorno + paso de síntesis de las extensiones de Langfuse


```figure
ce-hybrid-retrieval
```

## Construirlo
1. **Ingestion walker。**En cada gancho de empuje 上遍历 git historia── recoger archivos cambiados──对每个文件,用树座器 解析,提取函数 和类节点 及其完整源跨度──输出分段记录`{repo, path, start_line, end_line, symbol, body}`¿Qué es eso?

2. **Chunk summarizer。**Para hacer esto, se debe utilizar un sistema de almacenamiento en caché rápido.

3. **Embedding pool。**两个并行行队列:density(Voyage-code-3 lot 128) y resumen(同一个模型,但输入总结字符串)`{repo, path, start_line, end_line, symbol, kind}`¿Qué es eso?

4. **BM25 index。**Indice de Tantivy ponderado por campo:peso del nombre del símbolo 4,peso del cuerpo del símbolo 1,peso del cuerpo del resumen 2──它既支持 查找函数名 X 查询,也支持 查找函数名 X 查询──

5. **Symbol graph。**Para cada pieza de registro:importes(esta función utiliza el símbolo de repo Z Y) 、llamadas(Esta función 调用了类 C 上的方法 M) 、heritance──存入 kuzu──在查询时间使用它跨 repo boundaries 扩展检索──

6. **Query agent。**包含三个 nodos de LangGraph。`retrieve`并行触发 dense + BM25,按 (repo, camino, símbolo) 去重──`rerank`En el top-50 上运行 cruz-encoder,并保留 el top-10。`synth`调用 Claude Sonnet 4.7,把 rango de trozos 放入文本,缓存系统提示,并要求文件:line citations──

7. **Citation enforcement。**解析 modelo de salida; cualquier `(repo/path:start-end)`Los reclamos de anclaje se marcarán como re-asuntos o desechados. Sólo se devolverán a los usuarios con respuestas citadas.

8. **Incremental re-index。**Cada vez que se hace un enlace, el nivel de símbolo de cálculo difiere. Sólo se vuelve a incorporar los fragmentos de texto que cambian.

9. **Eval。**标注 100 个跨 repo preguntas,并给出金档:line answers──衡量MRR@10、nDCG@10、引用忠诚度(带可验证 anchors的索赔比例) y p50/p99 latency──

## Usalo
```
$ code-rag ask "how is S3 multipart abort wired into our retry budget?"
[retrieve]  12 chunks dense + 7 chunks bm25, 16 unique after dedup
[rerank]    top-5 kept (cohere rerank-3)
[synth]     claude-sonnet-4.7, cache hit rate 68%, 2.1s
answer:
  Multipart aborts are triggered by `AbortMultipartOnFail` in
  services/uploader/retry.go:122-148, which decrements the per-bucket
  retry budget defined in config/budgets.yaml:34-51 ...
  citations: [services/uploader/retry.go:122-148, config/budgets.yaml:34-51,
              libs/s3client/multipart.ts:44-61]
```

##  entregarlo
Habilidad de entrega `outputs/skill-codebase-rag.md`△给定一组 repos 语料, it can start ingestion pipeline、hybrid index 和 query agent,并为任何跨 repo 问题返回带引用的答案── rúbrica:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Retrieval quality | 在 100-question held-out set 上的 MRR@10 和 nDCG@10 |
| 20 | Citation faithfulness | answer claims 中带可验证 file:line anchors 的比例 |
| 20 | Latency and scale | 在 indexed corpus size 上 10k QPS 时的 p95 query latency |
| 20 | Incremental indexing correctness | 从 git push 到可被搜索的时间，在 50-file commit 上衡量 |
| 15 | UX and answer formatting | Citation 可点击性、snippet previews、follow-up affordance |
| **100** | | |

##  ejercicios
1. Se puede utilizar el código de viaje 3 para reemplazarlo por un código de incorporación nómica auto-hosted.

2. hacia corpus inyectar 20% de código generado (LLC-producido)并重新评估──观察 recuperando envenenamiento── hacia carga útil 添加一个发旗,并降低这些击的权重──

3. En su tamaño de corpus arriba referencia de búsqueda híbrida Qdrant con pgvector + pgvector escala.

4. 添加一个基于样本的漂移检查:每周重新运行100问题 eval──当 MRR@10 下降 > 5% 时告警──

5.  Extensión a resolución de símbolos interlinguísticos: una función Python                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| AST-aware chunking | “Function-level splits” | 在 tree-sitter node boundaries 而不是固定 Token windows 上切分代码 |
| Hybrid search | “Dense + sparse” | 并行运行 BM25 和 Vector search，合并 top-k，然后 rerank |
| Cross-encoder rerank | “Second-stage rank” | 将每个 (query, candidate) pair 放在一起评分的 model，比 cosine 更准确 |
| Prompt caching | “Cached system prompt” | 2026 年 Claude / OpenAI feature，可将重复 prefix Tokens 最高折扣 90% |
| Symbol graph | “Code graph” | 跨 files 和 repos 的 imports、calls、inheritance edges |
| Citation faithfulness | “Grounded answer rate” | 用户可以通过点击 anchor 并阅读 referenced span 来验证的 claims 比例 |
| Incremental re-index | “Push-to-search time” | 从 git push 到 changed symbols 可被查询的 wall-clock 时间 |

## 延伸阅读
- [Sourcegraph Amp](https://ampcode.com) Clasificación de código de inteligencia transversal de producción
- [Sourcegraph Cody RAG architecture](https://sourcegraph.com/blog/how-cody-understands-your-codebase) 本 capstone 的参考 de buceo profundo
- [Aider repo-map](https://aider.chat/docs/repomap.html) árbol-servidor 排序的 repo 视图
- [Augment Code enterprise graph](https://www.augmentcode.com) 商业 símbolo-grafo RAG
- [Qdrant hybrid search docs](https://qdrant.tech/documentation/concepts/hybrid-queries/) Implementación de referencia
- [Voyage AI code embeddings](https://docs.voyageai.com/docs/embeddings) Detalles del código de viaje-3
- [Cohere rerank-3](https://docs.cohere.com/reference/rerank) Referencia de codificación cruzada
- [Pinterest MCP internal search](https://medium.com/pinterest-engineering) plataforma interna 参考
