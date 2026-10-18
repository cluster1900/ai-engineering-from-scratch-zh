# Capstone 08  面向受监管垂直领域的生产RAG Chatbot

> Harvey、Glean、Mendable 和 LlamaCloud em 2026 todos os anos operarão com a mesma produção 形态── usando docling ou Unstructured 以及面向视觉内容的 ColPali 进行摄入──Hybrid search── usando bge-reranker-v2-gemma 重新排序── usando Claude Sonnet 4.7 合成,并通过快速缓存 达到 60-80% hit rate── usando Llama Guard 4 和 NeMo Guardrails 防护──使用 Langfuse 和 Phoenix 观测──使用RAGAS在200题黄金套评分上分──在监管领域(法律、临床、保险) 构建一个系统,这个顶点标准是通过黄金套设置和漂移团队和仪表板──

**Type:** Capstone
**Languages:** Python (pipeline + API), TypeScript (chat UI)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P5 · P7 · P11 · P12 · P17 · P18
**Time:** 30 小时

## 问题
O RAG (RG) de contratos legais, programas de experimentação clínica, seguros e seguros) é o formato de produção mais comum de 2026, pois o ROI 明确,风险也很具体──Harvey (Allen & Overy) construiu o RAG em um cenário legal──Mendable 交付 developer-docs 版本──Glean 覆盖企业搜索──模式是:高保真 ingest, use hybrid retrieval 和 rerank, compulsory citation 并 use prompt caching 进行合成,多层安全 防护,并持续监控漂移──

难点不在模型──难点是管辖区意识的合规(HIPAA、GDPR、SOC2) 引用 级别的审核能力、成本控制(当击率 很高时,快速缓存可带来 60-90% 折扣) 通过RAGAS fidelidade 进行幻觉检测,以及当源文档更新但索引未跟上时进行漂移检测──这个顶石 要求你在200题黄金套上交付完整系统,并配套红团套套──

## 概念
O oleoduto tem dois lados.**Ingestion**O que é o que acontece com os vectores? O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é.**Conversation**:LangGraph 处理 memory 和 multi-turn; cada consulta  executa recuperação híbrida, usando bge-reranker-v2-gemma-2b rerank, usando Claude Sonnet 4.7(prompt-cached) sintetizar, através de Llama Guard 4 和 NeMo Guardrails 处理输出,并发出引用-ancorada resposta。

A pilha de avaliação tem quatro níveis.**Golden set**(200 个带引用的标注 Q/A) para a correcção:**Red team**(prisioneros, tentativas de extracção de PII, questões fora do domínio) para segurança.**RAGAS**Automaticamente avaliar a fidelidade / relevância da resposta / precisão do contexto。**Drift dashboard**(Arize Phoenix) Cada semana monitoramento de qualidade de recuperação 和 alucinação pontuação.

Caching rápido é custo杆──Claude 4.5+ 和 GPT-5+ 支持缓存系统提示 + contextos recuperados──在 60-80% hit rate 下,单次查询 成本下降 3-5x──管道 必须围绕稳定前设计(system prompt + rranking context first),以实现高缓存 hit rate──

## Arquitetura
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
- Ingestão: Us Unstructured.io ou docling 处理结构化文档; Us ColPali 处理视觉丰富的 PDFs
- DB vetor: 低于 50M vetores 时使用 pgvector + pgvector scale;否则使用 Qdrant Cloud
- Esparsa: 带 campo pesos de Tantivy BM25
- 编排: LlamaIndex Workflows(ingestion) + LangGraph(conversação)
- Re-ranking: 自托管 bge-re-ranking-v2-gemma-2b ou Voyage-re-ranking-2
- LLM: 带 prompt caching of Claude Sonnet 4.7; fallback for self-hosted Llama 3.3 70B
- RAGAS 0.2 online, DeepEval para alucinação e jailbreak suites
- Observabilidade: auto-hosted Langfuse,带 anotação fila;Arize Phoenix us us us us us us us us us drift
- Guardrails: Llama Guard 4 classificador de entrada/saída,NeMo Guardrails v0.12 política,Presidio PII scrub
- Compliance: blocos de etiquetas de acesso baseadas em funções; para tags de jurisdição do GDPR/HIPAA


```figure
canary-rollout
```

## Construí-lo
1. **Ingestion.**Utilize Unstructured or docling 解析 your corpus (construção rigorosa geralmente de 1000 a 10000 个文档) ⋅ para páginas de análise / 视觉密集页面,路由到 ColPali──生成带总结、role-labels、jurisdiction tags的块──

2. **Index.**Embutidos densos ((Voyage-3 或 Nomic-embed-v2)写入 pgvector + pgvector scale── através de Tantivy 建立 BM25 side-index──Role 和 jurisdição filtros──作为 payload──

3. **Hybrid retrieve.**Primeiro por função + jurisdição 过; depois并行 dense + BM25; usando fusão de rango recíproco 合并; top-20 送入重排; top-5 送入合成。

4. **Synthesize with prompt caching.**Políticas de sistema de prompt + estática  coloque o cabeçalho do cache; conteúdo re-ranqueado como extensão do cache; pergunta do usuário como suffix não caçado。 estado estável  objetivo é taxa de hits de 60-80% do cache。

5. **Guardrails.**输入经过 Llama Guard 4;NeMo Guardrails rails 阻止非域问题或政策禁止的话题;Presidio 清理输出中的意外PII;引用执法后过──

6. **Golden set.**By domaine专家标注 200 个 Q/A pares,包含 (resposta, citações) ⋅ de acordo com a correspondência exata de citações、resposta corretão、 fidelidade (RAGAS) 评分──

7. **Red team.**50 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 

8. **Drift dashboard.**Arize Phoenix Cada semana acompanhamento qualidade de recuperação

9. **Cost report.**Langfuse: taxa de acessos de caching imediato, tokens por consulta, por fase de separação de $/query,

## Use-o
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

## Entrega-o
`outputs/skill-production-rag.md`描述 deliverable──一个部署在受监管领域的聊天机器人,带合规标签,通过条款,并使用现场漂流监测 观测──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | RAGAS faithfulness + answer relevance | golden set（200 Q/A）上的 online scores |
| 20 | Citation correctness | 带可验证 source anchors 的 answers 占比 |
| 20 | Guardrail coverage | Llama Guard 4 pass rate + jailbreak suite results |
| 20 | Cost / latency engineering | Prompt-cache hit rate、p95 latency、$/query |
| 15 | Drift monitoring dashboard | Phoenix live dashboard，带每周 retrieval-quality trend |
| **100** | | |

## 练习
1. Em outra jurisdição, construção de uma segunda parte do corpus, por exemplo, adicionar HIPAA para além do GDPR.

2. 测量一周 production traffic 的 prompt-cache hit rate──找出哪些查询──破坏了缓存前──重新组织──

3. 添加带 10k-token summary buffer                                                                                                                                                                                                                                                         

4. O que é que é que é o "Llama 3.3 70B"?

5. 添加 不确定模式: Se os pontuações mais altos re-ranqueados 低于门值,agente diz I don't have confident citations,而不是回答──测量 false-confidence reduction──

## 关键术语
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
- [Harvey AI](https://www.harvey.ai) 参考法律 produção de pilhas
- [Glean enterprise search](https://www.glean.com) escala empresarial 下的参考RAG
- [Mendable documentation](https://mendable.ai) desenvolvedores-documentos RAG 参考
- [LlamaCloud Parse + Index](https://docs.llamaindex.ai/en/stable/examples/llama_cloud/llama_parse/) ingestão gerenciada
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) 成本杆参考
- [RAGAS 0.2 documentation](https://docs.ragas.io/) 标准 RAG framework eval
- [Arize Phoenix](https://github.com/Arize-ai/phoenix)  Referência à observabilidade de deriva
- [Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) Classificação de segurança 2026
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) Estrutura ferroviária
