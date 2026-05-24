# Capstone 08 — 面向受监管垂直领域的 Production RAG Chatbot

> Harvey、Glean、Mendable 和 LlamaCloud 在 2026 年都运行同一种 production 形态。使用 docling 或 Unstructured 以及面向视觉内容的 ColPali 进行 ingest。Hybrid search。用 bge-reranker-v2-gemma 重新排序。使用 Claude Sonnet 4.7 合成，并通过 prompt caching 达到 60-80% hit rate。用 Llama Guard 4 和 NeMo Guardrails 防护。用 Langfuse 和 Phoenix 观测。用 RAGAS 在 200 题 golden set 上评分。在受监管领域（legal、clinical、insurance）构建一个系统，这个 capstone 的通过标准是通过 golden set、red team 和 drift dashboard。

**Type:** Capstone
**Languages:** Python (pipeline + API), TypeScript (chat UI)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P5 · P7 · P11 · P12 · P17 · P18
**Time:** 30 小时

## 问题
受监管领域的 RAG（法律合同、临床试验方案、保险保单）是 2026 年最常交付到 production 的形态，因为 ROI 明确，风险也很具体。Harvey (Allen & Overy) 为法律场景构建了它。Mendable 交付 developer-docs 版本。Glean 覆盖 enterprise search。模式是：高保真 ingest，使用 hybrid retrieval 和 rerank，强制 citation 并使用 prompt caching 进行 synthesize，多层 safety 防护，并持续监控 drift。

难点不在模型。难点是 jurisdiction-aware compliance（HIPAA、GDPR、SOC2）、citation 级别的 auditability、成本控制（当 hit rate 很高时，prompt caching 可带来 60-90% 折扣）、通过 RAGAS faithfulness 进行 hallucination detection，以及当源文档更新但 index 未跟上时进行 drift detection。这个 capstone 要求你在 200 题 golden set 上交付完整系统，并配套 red-team suite。

## 概念
pipeline 有两侧。**Ingestion**：docling 或 Unstructured 解析结构化文档；ColPali 处理视觉丰富的文档；chunks 会获得 summaries、tags 和 role-based access labels。Vectors 进入 pgvector + pgvectorscale（低于 50M vectors）或 Qdrant Cloud；sparse BM25 并行运行。**Conversation**：LangGraph 处理 memory 和 multi-turn；每个 query 执行 hybrid retrieval，使用 bge-reranker-v2-gemma-2b rerank，使用 Claude Sonnet 4.7（prompt-cached）synthesize，通过 Llama Guard 4 和 NeMo Guardrails 处理输出，并发出 citation-anchored response。

eval stack 有四层。**Golden set**（200 个带 citations 的标注 Q/A）用于 correctness。**Red team**（jailbreaks、PII extraction attempts、off-domain questions）用于 safety。**RAGAS** 自动逐轮评估 faithfulness / answer relevance / context precision。**Drift dashboard**（Arize Phoenix）每周监控 retrieval quality 和 hallucination score。

Prompt caching 是成本杠杆。Claude 4.5+ 和 GPT-5+ 支持缓存 system prompts + retrieved context。在 60-80% hit rate 下，单次 query 成本下降 3-5x。pipeline 必须围绕稳定前缀设计（system prompt + reranked context first），以实现高 cache hit rates。

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

## 技术栈
- Ingestion: 用 Unstructured.io 或 docling 处理结构化文档；用 ColPali 处理视觉丰富的 PDFs
- Vector DB: 低于 50M vectors 时使用 pgvector + pgvectorscale；否则使用 Qdrant Cloud
- Sparse: 带 field weights 的 Tantivy BM25
- 编排: LlamaIndex Workflows（ingestion）+ LangGraph（conversation）
- Re-ranker: 自托管 bge-reranker-v2-gemma-2b 或 hosted Voyage rerank-2
- LLM: 带 prompt caching 的 Claude Sonnet 4.7；fallback 为 self-hosted Llama 3.3 70B
- Eval: RAGAS 0.2 online，DeepEval 用于 hallucination 和 jailbreak suites
- Observability: self-hosted Langfuse，带 annotation queue；Arize Phoenix 用于 drift
- Guardrails: Llama Guard 4 input/output classifier，NeMo Guardrails v0.12 policy，Presidio PII scrub
- Compliance: chunks 上的 role-based access labels；用于 GDPR/HIPAA 的 jurisdiction tags

## 构建它
1. **Ingestion.** 使用 Unstructured 或 docling 解析你的 corpus（严肃构建通常为 1000-10000 个文档）。对于扫描页 / 视觉密集页面，路由到 ColPali。生成带 summaries、role-labels、jurisdiction tags 的 chunks。

2. **Index.** Dense embeddings（Voyage-3 或 Nomic-embed-v2）写入 pgvector + pgvectorscale。通过 Tantivy 建立 BM25 side-index。Role 和 jurisdiction filters 作为 payload。

3. **Hybrid retrieve.** 先按 role+jurisdiction 过滤；然后并行 dense + BM25；用 reciprocal rank fusion 合并；top-20 送入 reranker；top-5 送入 synth。

4. **Synthesize with prompt caching.** System prompt + static policies 放在 cache header；reranked context 作为 cache extension；user question 作为 uncached suffix。steady state 目标是 60-80% cache hit rate。

5. **Guardrails.** 输入经过 Llama Guard 4；NeMo Guardrails rails 阻止 off-domain questions 或 policy-forbidden topics；Presidio 清理输出中的意外 PII；citation enforcement post-filter。

6. **Golden set.** 由领域专家标注 200 个 Q/A pairs，包含 (answer, citations)。按 exact-citation match、answer correctness、faithfulness (RAGAS) 对 agent 评分。

7. **Red team.** 50 个 adversarial prompts：jailbreaks（PAIR、TAP）、PII exfiltration attempts、off-domain、cross-jurisdiction leaks。用 pass/fail 和 severity 评分。

8. **Drift dashboard.** Arize Phoenix 每周跟踪 retrieval quality（nDCG、citation faithfulness）。下降 5% 时告警。

9. **Cost report.** Langfuse：prompt-caching hit rate、tokens per query、按阶段拆分的 $/query。

## 使用它
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

## 交付它
`outputs/skill-production-rag.md` 描述 deliverable。一个部署在受监管领域的 chatbot，带 compliance labels，通过 rubric，并用 live drift monitoring 观测。

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | RAGAS faithfulness + answer relevance | golden set（200 Q/A）上的 online scores |
| 20 | Citation correctness | 带可验证 source anchors 的 answers 占比 |
| 20 | Guardrail coverage | Llama Guard 4 pass rate + jailbreak suite results |
| 20 | Cost / latency engineering | Prompt-cache hit rate、p95 latency、$/query |
| 15 | Drift monitoring dashboard | Phoenix live dashboard，带每周 retrieval-quality trend |
| **100** | | |

## 练习
1. 在另一个 jurisdiction 下构建第二个 corpus slice（例如在 GDPR 之外加入 HIPAA）。在 20 题 cross-jurisdiction probe 上展示 role+jurisdiction filtering 如何防止 cross-leak。

2. 测量一周 production traffic 的 prompt-cache hit rate。找出哪些 queries 破坏了 cache prefix。重新组织。

3. 添加带 10k-token summary buffer 的 multi-turn memory。测量随着 conversation 增长，faithfulness 是否下降。

4. 将 Claude Sonnet 4.7 替换为 self-hosted Llama 3.3 70B。测量 $/query 和 faithfulness delta。

5. 添加 “unsure” mode：如果 top reranked scores 低于 threshold，agent 说 “I do not have confident citations”，而不是回答。测量 false-confidence reduction。

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
- [Harvey AI](https://www.harvey.ai) — 参考法律 production stack
- [Glean enterprise search](https://www.glean.com) — enterprise scale 下的参考 RAG
- [Mendable documentation](https://mendable.ai) — developer-docs RAG 参考
- [LlamaCloud Parse + Index](https://docs.llamaindex.ai/en/stable/examples/llama_cloud/llama_parse/) — managed ingestion
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — 成本杠杆参考
- [RAGAS 0.2 documentation](https://docs.ragas.io/) — 标准 RAG eval framework
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) — 参考 drift observability
- [Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) — 2026 safety classifier
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) — policy rail framework
