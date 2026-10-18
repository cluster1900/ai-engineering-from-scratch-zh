# Capstone 08  面向受监管垂直领域 Producción RAG Chatbot

> Harvey、Glean、Mendable 和 LlamaCloud en 2026 año todo funcionará con la misma producción 形态──Use docling o Unstructured 以及面向视觉内容的 ColPali 进行摄入──Hybrid search──Use bge-reranker-v2-gemma 重新排序──Use Claude Sonnet 4.7 合成,并通过快速缓存 达到 60-80% hit rate──Use Llama Guard 4 和 NeMo Guardrails 防护──Use Langfuse 和 Phoenix 观测──Use RAGAS en 200 temas de juego de oro 评分──在监管领域(legal、临床、保险) Construir un sistema, este capstone de estándares es a través de juego de oro、 drift team 和仪表.

**Type:** Capstone
**Languages:** Python (pipeline + API), TypeScript (chat UI)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P5 · P7 · P11 · P12 · P17 · P18
**Time:** 30 小时

##  problemas
El RG (RG) de los contratos legales, de los ensayos clínicos, de los seguros y de las pruebas es el modelo de producción más habitual del año 2026, ya que el ROI es claro, el riesgo es también muy específico. Harvey (Allen & Overy) construyó el proyecto en un escenario legal.

难点不在模型──难点是管辖区意识的遵守(HIPAA、GDPR、SOC2) 引用 级别的审计性、成本控制(当击率 很高时,快速缓存可带来 60-90% 折扣) 通过RAGAS fidelidad 进行幻觉检测,以及当源文档更新但索引未跟上时进行漂移检测──这个顶点 要求你在200题黄金套上交付完整系统,并配套红团套套──

## 概念
El oleoducto tiene dos lados.**Ingestion**:docling o Unstructured 解析结构化文档;ColPali 处理视觉丰富的文档;chunks 会获得总结、tags 和角色基于访问标签。Vectores 进入 pgvector + pgvector scale(<50M vectores) o Qdrant Cloud;sparse BM25 并行运行。**Conversation**:LangGraph 处理 memory 和 multi-turn; cada consulta  ejecutar la recuperación híbrida, usando bge-reranker-v2-gemma-2b rerank, usando Claude Sonnet 4.7(prompt-caché) sintetizar, a través de Llama Guard 4 和 NeMo Guardrails 处理输出,并发出引用-anchored response。

La pila de evaluación tiene cuatro niveles.**Golden set**(200 个带引用的标注 Q/A) para su corrección.**Red team**(incrementos de seguridad, intentos de extracción de PII, preguntas fuera del dominio) para la seguridad.**RAGAS**Automaticamente evalúa la fidelidad / relevancia de la respuesta / precisión del contexto.**Drift dashboard**(Arize Phoenix) Cada semana control de calidad de recuperación y puntuación de alucinación.

El caché rápido es el costo杆──Claude 4.5+ 和 GPT-5+ 支持缓存系统提示+回收文本──在 60-80% de la tasa de hits 下,单次查询 成本下降 3-5x──管线 必须围绕稳定前设计(sistema rápido + rangoado contexto primero), para lograr altas tasas de hits de caché──

## 架构
```
documents（contracts, protocols, policies）
      |
      v
docling / Unstructured parse + 用于 visuals 的 ColPali
      |
      v
chunks + summaries + role-labels + jurisdiction tags
      |
      v
pgvector + pgvectorscale  +  BM25 (Tantivy)
      |
query + role + jurisdiction
      |
      v
LangGraph conversational agent
   +--- retrieve (hybrid)
   +--- 按 role + jurisdiction 过滤
   +--- rerank (bge-reranker-v2-gemma-2b or Voyage rerank-2)
   +--- synthesize (Claude Sonnet 4.7, prompt cached)
   +--- guard (Llama Guard 4 + NeMo Guardrails + Presidio output PII scrub)
   +--- cite + return
      |
      v
eval:
  RAGAS faithfulness / answer_relevance / context_precision（online）
  Langfuse annotation queue（sampled）
  Arize Phoenix drift（weekly）
  red team suite（pre-release）
```

## 技术
- Ingestión: Usando Unstructured.io o docling 处理结构化文档; Usando ColPali 处理视觉丰富的 PDFs
- DB de vectores: 低于 50M vectores 时使用 pgvector + pgvector scale;否则使用 Qdrant Cloud
- Esparsa: 带 campos de pesas de Tantivy BM25
- 编排: LlamaIndex flujos de trabajo(ingestión) + LangGraph(conversación)
- Re-ranqueador: 自托管 bge-re-ranqueador-v2-gemma-2b o de viaje de alojamiento
- LLM: 带 prompt caching de Claude Sonnet 4.7; fallback para auto-hosted Llama 3.3 70B
- Eval: RAGAS 0.2 en línea, DeepEval para alucinaciones y suites de jailbreak
- Observabilidad: Langfuse auto-hosted,带 anotación cola; Arize Phoenix Usándolo en deriva
- Guardrails: Llama Guard 4 clasificador de entrada/salida,NeMo Guardrails v0.12 política,Presidio PII scrub
- Cumplimiento: piezas de etiquetas de acceso basadas en el papel; para etiquetas de jurisdicción de GDPR/HIPAA


```figure
canary-rollout
```

## Construirlo
1. **Ingestion.**Utiliza Unstructured o docling 解析 your corpus (construcción estricta generalmente de 1000 a 10000 个文档) ⋅ para páginas de análisis / 视觉密集页面,路由到 ColPali──生成带总结、角色标签、管辖的标签的块──

2. **Index.**Embedings densas ((Voyage-3 或 Nomic-embed-v2)写入 pgvector + pgvector scale──通过Tantivy 建立 BM25 side-index──Role 和 jurisdicción filtros──作为实用载荷──

3. **Hybrid retrieve.**Antes según el rol+jurisdiccin 过; luego并行 dense + BM25; con la fusión de rango recíproco 合并;top-20 送入重排;top-5 送入合成──

4. **Synthesize with prompt caching.**Políticas de sistema + estáticas  colocar en la caché de encabezado; contexto reordenado como extensión de caché; pregunta del usuario como sufijo no caché;; estado estable  objetivo es 60-80% tasa de caché de éxito;;

5. **Guardrails.**输入经过 Llama Guard 4;NeMo Guardrails rails 阻止非域问题或政策禁止主题;Presidio 清理输出中的意外PII;引号执法后过──

6. **Golden set.**Por el área especializada en etiquetado 200 pares de preguntas y respuestas, incluyendo (respuesta, citas) ⋅ según la correspondencia exacta de citas ⋅respuesta correcta ⋅ fidelidad (RAGAS) ⋅

7. **Red team.**50 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 

8. **Drift dashboard.**Arize Phoenix Cada semana seguimiento calidad de recuperación (nDCG 引用忠诚度) ∼ Abajo 5% 时告警─

9. **Cost report.**Langfuse: tasa de caché de acceso inmediato, tokens por consulta, por etapas de separación de $/cuestión.

## Usalo
```
$ chat --role=analyst --jurisdiction=GDPR
> 根据我们的合同，EU 用户资料的数据保留义务是什么？
[retrieve]  hybrid top-20 filtered to GDPR + analyst-role
[rerank]    top-5 kept
[synth]     claude-sonnet-4.7, cache hit 74%, 0.8s
answer:
  该合同（Section 12.4, Master Services Agreement dated 2024-03-11）
  要求在终止后 30 天内删除 EU 用户资料，以遵守 GDPR
  Article 17。DPA amendment（DPA-v2.1, Section 5）将该期限扩展为
  “restricted”类别数据的 14 天。
  citations: [MSA-2024-03-11 s12.4, DPA-v2.1 s5]
```

##  entregarlo
`outputs/skill-production-rag.md`描述 deliverable──一个部署在受监管领域的聊天机,带合规标签,通过条款,并使用现场漂流监测 观测──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | RAGAS faithfulness + answer relevance | golden set（200 Q/A）上的 online scores |
| 20 | Citation correctness | 带可验证 source anchors 的 answers 占比 |
| 20 | Guardrail coverage | Llama Guard 4 pass rate + jailbreak suite results |
| 20 | Cost / latency engineering | Prompt-cache hit rate、p95 latency、$/query |
| 15 | Drift monitoring dashboard | Phoenix live dashboard，带每周 retrieval-quality trend |
| **100** | | |

##  ejercicios
1. En otra jurisdicción, la siguiente sección se construye:

2. 测量一周 production traffic 的快速缓存击率──找出哪些查询 破坏了缓存预写──重新组织──

3. 添加带 10k-token summary buffer de memoria multi-turn──测量 con la conversación 增长, fidelidad 是否下降──

4. Jugará a Claude Sonnet 4.7 en cambio de Llama 3.3 70B.

5. 添加 不确定模式: si las puntuaciones más altas re-ranqueadas 低于门值, agente dice no tengo citas seguras, en lugar de responder──测量 false-confiance reducción──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Prompt caching | “Cached system + context” | Claude/OpenAI 功能：cache hit 时 cached prefix tokens 可享 60-90% 折扣 |
| RAGAS | “RAG evaluator” | 自动评分 faithfulness、answer relevance、context precision |
| Golden set | “Labeled eval” | 200+ 个专家标注的带 citations 的 Q/A；ground truth |
| Jurisdiction tag | “Compliance label” | 附加到 chunks 的 GDPR/HIPAA/SOC2 scope；由 retrieval filter 强制执行 |
| Citation faithfulness | “Grounded answer rate” | 由可检索 source spans 支撑的 claims 占比 |
| Drift | “Retrieval quality decay” | nDCG 或 citation score 的每周变化；alert threshold 5% |
| Red team | “Adversarial eval” | Pre-release jailbreak、PII extraction、off-domain probes |

## 延伸阅读
- [Harvey AI](https://www.harvey.ai) 参考法律 producción de la pila
- [Glean enterprise search](https://www.glean.com) escala de la empresa 下的参考RAG
- [Mendable documentation](https://mendable.ai) Documento de desarrollo RAG 参考
- [LlamaCloud Parse + Index](https://docs.llamaindex.ai/en/stable/examples/llama_cloud/llama_parse/) Ingestión controlada
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) 成本杆参考
- [RAGAS 0.2 documentation](https://docs.ragas.io/) 标准 RAG marco de evaluación
- [Arize Phoenix](https://github.com/Arize-ai/phoenix)  Referencia a la observabilidad de la deriva
- [Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) Clasificación de seguridad 2026
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) marco ferroviario de la política
