# Capstone 08  面向受监管垂直领域的生产RAG Chatbot

> Harvey、Glean、Mendable 和 LlamaCloud 2026 yılında tüm dünyada aynı üretim 形态── kullanmak docling veya Unstructured 以及面向视觉内容的 ColPali 进行 ingest──ハイбриd arama── kullanmak bge-reranker-v2-gemma 重新排序── kullanmak Claude Sonnet 4.7 合成,并通过快速缓存 达到 60-80% hit rate──使用 Llama Guard 4 和 NeMo Guardrails 防护──使用 Langfuse 和 Phoenix 观测──使用RAGAS 在 200 题金套评分 上分──在受监管领域(法律、临床、保险)

**Type:** Capstone
**Languages:** Python (pipeline + API), TypeScript (chat UI)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P5 · P7 · P11 · P12 · P17 · P18
**Time:** 30 小时

## 问题
RAK (RAG) ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒    ⇒     ⇒                                                                                                                                                 

难点不在模型──难点是管辖意识的遵守(HIPAA、GDPR、SOC2) 引用 级别的审计性、成本控制(当击率 很高时,快速缓存可带来 60-90% 折扣) 通过RAGAS fideleti 进行幻觉检测,以及当源文档更新但索引未跟上时进行漂移检测──这个顶石 要求你在200题黄金套上交付完整系统,并配套红团套套──

## 概念
Bu boru hattı iki tarafta.**Ingestion**:docling veya Unstructured 解析结构化文档;ColPali 处理视觉丰富的文档;chunks 会获得总结、tags 和角色基准访问标签。Vectors 进入 pgvector + pgvector scale(50M vector) or Qdrant Cloud;sparse BM25 并行运行。**Conversation**:LangGraph 处理 memory 和 multi-turn; her sorgu 执行 hybrid retrieval, using bge-reranker-v2-gemma-2b rerank, using Claude Sonnet 4.7(prompt-cached) synthesize, via Llama Guard 4 和 NeMo Guardrails 处理输出,并发出引用-anchored response。

Değerlendirme yığınının dört katı var.**Golden set**(200 个带引用的标注 Q/A) doğruluk için kullanılır.**Red team**(veya hapishaneden çıkış,PII çıkarma girişimleri,domain dışı sorular) güvenlik için kullanılır.**RAGAS**Otomatik olarak güvenilirliği / cevapların uygunluğu / bağlamsal hassasiyeti değerlendiriyor.**Drift dashboard**(Arize Phoenix) Her hafta izleme ve geri alım kalitesi, halüsinasyon puanı.

Hızlı önbelleğe kaydetme 成本杆──Claude 4.5+ 和 GPT-5+ 支持缓存系统提示 + 检索文本──在 60-80% hit rate 下,单次查询 成本下降 3-5x──管线 必须围绕稳定前设计(系统提示 + 排名文本首先),以实现高缓存 hit rate──

## Yapılandırma
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
- Yedik: Uss Unstructured.io veya docling 处理结构化文档; Uss ColPali 处理视觉丰富的 PDF'ler
- Vektor DB: 低于 50M vektörler 时使用 pgvector + pgvector scale;否则使用 Qdrant Cloud
- Çekil: 带 alan ağırlıkları of Tantivy BM25
- 编排: LlamaIndex İş akışları(ingestion) + LangGraph(sonuş)
- Yeniden sıralama: 自托管 bge-renker-v2-gemma-2b veya ev sahipliği yapan Voyage renk-2
- LLM: 带 prompt caching of Claude Sonnet 4.7;fallback for self-hosted Llama 3.3 70B
- Eval: RAGAS 0.2 online, DeepEval halüsinasyon ve jailbreak suiteları için kullanılıyor.
- Gözlem: kendi kendine barındırılan Langfuse,带 notasyon kuyruk;Arize Phoenix kullanımı drift
- Guardrails: Llama Guard 4 giriş/çıktı sınıflandırıcısı,NeMo Guardrails v0.12 politikası,Presidio PII scrub
- Uyum: bölümler 上的 roll-based access labels; GDPR/HIPAA'nın yargı yetkisi etiketleri için kullanılır


```figure
canary-rollout
```

## Yapın onu.
1. **Ingestion.**Uygulama veya doklama kullanın 解析 your corpus(Strict construction usually for 1000-10000 个文档) ・・・ için扫描页 / 视觉密集页面,路由到 ColPali──生成带总结、角色标签、司法标签的块──

2. **Index.**Denek yerleşimler ((Voyage-3 veya Nomic-embed-v2)写入 pgvector + pgvector scale──通过Tantivy 建立 BM25 side-index──Role 和 jurisdiction filters──作为 payload──

3. **Hybrid retrieve.**Önceden rol+yurt yetkisi 过; sonra并行密集 + BM25; karşılıklı sıra birleşimi ile 合并; üst-20 送入重排; üst-5 送入合成。

4. **Synthesize with prompt caching.**Sistem prompt + statik politikaları  cache başlığı yerleştir; yeniden sıralamalı bağlam cache uzantısı olarak; kullanıcı sorusu cache dışı bir ek olarak。 sabit durum  hedef  60-80% cache çarpma oranı。

5. **Guardrails.**输入经过 Llama Guard 4;NeMo Guardrails rails 阻止非域问题或政策禁止的话题;Presidio 清理输出中的意外 PII;引用执法后过──

6. **Golden set.**By alan uzmanı etiket 200 个 Q/A çiftleri,包含 ( cevabı, alıntılar) ⋅e tam alıntı eşleşmesi 、 cevabı doğruluk、 sadakat (RAGAS) 评分──

7. **Red team.**50 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 

8. **Drift dashboard.**Arize Phoenix Her hafta takip kurtarma kalitesi

9. **Cost report.**Langfuse: hızlı saklama hit oranı, sorgu başına belirtiler, aşamalara göre ayrılmış $/ sorgular

## Kullan
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

## - Söyle.
`outputs/skill-production-rag.md`描述 deliverable──一个部署在受监管领域的聊天机, 带合规标签,通过条文,并使用现场漂流监测 观测──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | RAGAS faithfulness + answer relevance | golden set（200 Q/A）上的 online scores |
| 20 | Citation correctness | 带可验证 source anchors 的 answers 占比 |
| 20 | Guardrail coverage | Llama Guard 4 pass rate + jailbreak suite results |
| 20 | Cost / latency engineering | Prompt-cache hit rate、p95 latency、$/query |
| 15 | Drift monitoring dashboard | Phoenix live dashboard，带每周 retrieval-quality trend |
| **100** | | |

## 练习
1. Bir diğer yargı bölgesinde, bir başka parça oluşturmak için bir başka bölüm oluşturmak için, örneğin, GDPR dışında HIPAA'ya katılın.

2. 测量一周 production traffic 的 prompt-cache hit rate──找出哪些查询──破坏了缓存前──重新组织──

3. 添加带 10k-token summary buffer of multi-turn memory──测量 with conversation 增长, fidelity 是否下降──

4. Claude Sonnet 4.7'i kendi kendine ev sahipliği yapan Llama 3.3 70B'ye değiştirmek için...

5. 添加 不确定模式: Eğer en yüksek yeniden sıralamalı puanlar                                                                                                                                                                                                                                                      

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
- [Harvey AI](https://www.harvey.ai) 参考法律 üretim yığın
- [Glean enterprise search](https://www.glean.com) kurumsal ölçek 下的参考RAG
- [Mendable documentation](https://mendable.ai) geliştiriciler-doklar RAG 参考
- [LlamaCloud Parse + Index](https://docs.llamaindex.ai/en/stable/examples/llama_cloud/llama_parse/) Yönetilen içme
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) 成本杆参考
- [RAGAS 0.2 documentation](https://docs.ragas.io/) 标准 RAG değerlendirme çerçevesini
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) reference drift gözlemliliği
- [Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) 2026 güvenlik sınıflandırması
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) Politika demiryolu çerçevesini
