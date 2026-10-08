# Capstone 08  面向受监管垂直领域 de la production RAG Chatbot

> Harvey、Glean、Mendable 和 LlamaCloud dans 2026 ans tout fonctionner la même production 形态── utiliser docling ou non structurée et face à visuel contenu ColPali  pour effectuer une ingestion── recherche hybride── utiliser bge-reranker-v2-gemma 重新排序── utiliser Claude Sonnet 4.7 合成,并通过快速缓存 达到 60-80% hit rate── utiliser Llama Guard 4 和 NeMo Guardrails 防护──使用 Langfuse 和 Phoenix 观测──使用 RAGAS在200题黄金套评分上分──在监管领域((法律、临床、保险) 构建一个系统,这个顶点的标准是通过黄金套设置和漂移团队和仪表板────

**Type:** Capstone
**Languages:** Python (pipeline + API), TypeScript (chat UI)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P5 · P7 · P11 · P12 · P17 · P18
**Time:** 30 小时

##  problématique
Le RAG (Règlement général sur les contrats juridiques, les programmes de tests cliniques, les assurances) est le modèle le plus courant de 2026 pour la production, car le ROI est clair, le risque est également très spécifique. Harvey (Allen & Overy) a construit le cadre juridique.

难点不在模型──难点是管辖区意识的合规性(HIPAA、GDPR、SOC2) 引用 级别的审计性、成本控制(当击率 很高时,快速缓存可带来 60-90% 折扣) 通过RAGAS fidelity 进行幻觉检测,以及当源文档更新但索引未跟上时进行漂移检测──这个顶点 要求你在200题黄金套上交付完整系统,并配套红团套套──

## 概念
Le pipeline a deux côtés.**Ingestion**:docling ou non structurée 解析结构化文档;ColPali 处理视觉丰富的文档; chunks 会获得总结、tags 和角色基访问标签。Vecteurs 进入 pgvector + pgvector scale(<50M vectors) ou Qdrant Cloud;sparse BM25 并行运行。**Conversation**:LangGraph  traitement de la mémoire 和 multi-turn; chaque requête  exécuter la récupération hybride, en utilisant bge-reranker-v2-gemma-2b renc, en utilisant Claude Sonnet 4.7(prompte-caché) synthétiser, via Llama Guard 4 和 NeMo Guardrails 处理输出,并发出引用-ancrée réponse。

La pile d'évaluation a quatre niveaux.**Golden set**(200 个带引用的标注 Q/A) pour une précision**Red team**(prison breaks, tentatives d'extraction de données personnelles, questions hors domaine) pour la sécurité.**RAGAS**Autonomie de l'évaluation de la fidélité / de la pertinence de la réponse / de la précision du contexte。**Drift dashboard**(Arize Phoenix) Chaque semaine de surveillance de la qualité de récupération et de la notation des hallucinations.

Le caching rapide est le coût杆──Claude 4.5+ 和 GPT-5+ 支持缓存系统提示+回收文text──在 60-80% hit rate 下,单次查询 成本下降 3-5x──管道 必须围绕稳定前设计(系统提示+重排文text先),以实现高缓存 hit rate──

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
- Ingestion: avec Unstructured.io ou docling 处理结构化文档; avec ColPali 处理视觉丰富的 PDF
- Vecteur DB: 低于 50M vecteurs 时使用 pgvector + pgvector scale;否则使用 Qdrant Cloud
- Sparse: 带 champs poids de Tantivy BM25
- 编排: flux de travail LlamaIndex (ingestion) + LangGraph (conversation)
- Rencontre: Autotubes bge-rencontre-v2-gemma-2b ou encore Rencontre de voyage hébergé-2
- LLM: 带 prompt caching de Claude Sonnet 4.7; fallback pour l'hébergement personnel de Llama 3.3 70B
- Eval: RAGAS 0.2 en ligne, DeepEval utilisé pour les hallucinations et les suites de jailbreak
- Observabilité: Langfuse auto-hébergée, avec file d'attente d'annotation; Arize Phoenix utilisé pour la dérive
- Garde-rails: Llama Guard 4 classifiateur d'entrée/sortie,Politique de NeMo Guardrails v0.12,PII scrub
- Conformité: des blocs de l'accès basé sur le rôle; pour les étiquettes de compétence du RGPD/HIPAA


```figure
canary-rollout
```

## - Je le construis.
1. **Ingestion.**Utilisation de l'unité ou du documentation 解析 your corpus (construction stricte est généralement de 1000 à 10000 个文档) ⋅ Pour les pages de sélection / 视觉密集页面,路由到 ColPali──生成带总结、角色标签、司法权标签的块──

2. **Index.**Entraînements denses ((Voyage-3 ou Nomic-embed-v2) 写入 pgvector + pgvector scale── via Tantivy 建立 BM25 side-index──Role 和 jurisdiction filtres 作为 payload──

3. **Hybrid retrieve.**Précédent par rôle + juridiction 过; puis并行 dense + BM25; avec fusion de rang réciproque 合并; top-20 送入重排; top-5 送入合成。

4. **Synthesize with prompt caching.**Les politiques de prompt système + statiques  mettre en tête de cache;contextes réaffectés en tant qu'extension de cache;question utilisateur en tant que suffixe non caché;;état stable objectif est de 60 à 80% taux de succès du cache;;

5. **Guardrails.**输入经过 Llama Guard 4;NeMo Guardrails rails 阻止非域问题或政策禁止主题;Presidio 清理输出中的意外PII;quote de mise en œuvre post-filter。

6. **Golden set.**By domaine spécialisé dans les 200 paires de questions et réponses, contenant (réponse, citations) ⋅ selon la correspondance exacte de citations ⋅ réponse correction, fidélité (RAGAS) envers l'agent 评分。

7. **Red team.**50 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 

8. **Drift dashboard.**Arize Phoenix 每周跟踪 récupération qualité de la recherche

9. **Cost report.**Langfuse: taux de caching rapide de succès ∞ tokens par requête ∞ $/query par étape décomposée ∞

## Utilisez-le
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

## Je le livre.
`outputs/skill-production-rag.md`描述 deliverable──一个部署在受监管领域的聊天机,带合规标签,通过条款,并使用现场漂移监测 观测──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | RAGAS faithfulness + answer relevance | golden set（200 Q/A）上的 online scores |
| 20 | Citation correctness | 带可验证 source anchors 的 answers 占比 |
| 20 | Guardrail coverage | Llama Guard 4 pass rate + jailbreak suite results |
| 20 | Cost / latency engineering | Prompt-cache hit rate、p95 latency、$/query |
| 15 | Drift monitoring dashboard | Phoenix live dashboard，带每周 retrieval-quality trend |
| **100** | | |

## 练习
1. Dans une autre juridiction, construire une deuxième tranche de corpus, par exemple en dehors du RGPD, rejoindre l'HIPAA.

2. 测量一周 production traffic 快速缓存击率──找出哪些查询 破坏了缓存前──重新组织──

3. 添加带 10k-token summary buffer ∞ multi-turn memory ∞

4. Pour remplacer le sonnet 4.7 par un Llama 3.3 70B.

5. 添加 不确定模式: si les scores réévalués sont inférieurs au seuil, l'agent dit  Je n'ai pas de citations sûres, plutôt que de répondre── mesure la réduction de la fausse confiance──

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
- [Harvey AI](https://www.harvey.ai) 参考法律 production stack
- [Glean enterprise search](https://www.glean.com) échelle d'entreprise 下的参考RAG
- [Mendable documentation](https://mendable.ai) Documents de développement RAG 参考
- [LlamaCloud Parse + Index](https://docs.llamaindex.ai/en/stable/examples/llama_cloud/llama_parse/) ingestion gérée
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) 成本杆 référence
- [RAGAS 0.2 documentation](https://docs.ragas.io/) 标准 RAG cadre d'évaluation
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) reference à l'observabilité de la dérive
- [Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) Classification de la sécurité 2026
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) Cadre ferroviaire de la politique
