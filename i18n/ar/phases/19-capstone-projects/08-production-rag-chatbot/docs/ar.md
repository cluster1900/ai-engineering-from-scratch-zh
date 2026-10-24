# كابستون 08  面向受监管垂直领域的生产RAG Chatbot

> هارفي、غلين、مديبل 和 لاماكلود في 2026 سنة كلها تعمل بنفس الطريقة الإنتاج 形态‬ استخدام دوكلينغ أو غير منظمة ووضعها في إطار محتوى بصري ColPali  إجراء استهلاك‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**Type:** Capstone
**Languages:** Python (pipeline + API), TypeScript (chat UI)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P5 · P7 · P11 · P12 · P17 · P18
**Time:** 30 小时

## 问题
تم تحديد الموقع القانوني في مجال الرقابة (RAG) ((قانونية العقود 临床试验方案、保险保单) هو أكثر الشروط تسليمًا إلى الإنتاج في عام 2026 ، لأن ROI 明确,风险也很具体──Harvey (Allen & Overy) بنيت على المشهد القانوني── قابل للتغيير 交付 المطورين-دقائق 版本──Glean 覆盖 الشركات البحث──模式是:高保真 ingest, استخدام الاسترداد الهجين و renank, إقتباس إضافي 并使用快速缓存 进行合成,多层安全 防护,并持续监控漂移──

难点不在模型──难点是管辖区意识的合规性(HIPAA、GDPR、SOC2) 引用 级别的审计性、成本控制(当击率 很高时,快速缓存可带来 60-90% 折扣) 通过RAGAS fidelity 进行幻觉检测,以及当源文档更新但索引未跟上时进行漂移检测──这个顶石 要求你在200题黄金套上交付完整系统,并配套红团套套──

## 概念
أنابيب لديها جانبي**Ingestion**:docling أو Unstructured 解析结构化文档;ColPali 处理视觉丰富的文档; chunks 会获得摘要、标签 和基于角色的访问标签── المتجهات 进入 pgvector + pgvector scale(<50M متجهات) أو Qdrant Cloud;sparse BM25 并行运行──**Conversation**:LangGraph 处理 memory 和 multi-turn; كل استفسار  تنفيذ استرداد هجين، باستخدام bge-reranker-v2-gemma-2b rerank، باستخدام Claude Sonnet 4.7(مخزنة سريعة) التجميع، من خلال Llama Guard 4 和 NeMo Guardrails 处理输出،并发出引用-anchored response。

كومة تقييم لديها أربع طبقات**Golden set**(200 个带引用的标注 Q/A) للمصادقة**Red team**(تسلل السجون  محاولات استخراج المعلومات الشخصية ‬ أسئلة خارج النطاق)**RAGAS**تقييم التوقعات / صلة الإجابة / دقة السياق**Drift dashboard**(أريز فينيكس) كل أسبوع مراقبة جودة الاستعراض و نمط الهلوسة

التخزين السريع هو تكلفة杆──Claude 4.5+ 和 GPT-5+ 支持缓存系统提示 + استرداد السياق──在 60-80% نسبة ضربة 下,单次查询 成本下降 3-5x──管道 必须围绕稳定前设计(نظام التخزين + إعادة تصنيف السياق أولاً) ، لتحقيق معدلات ضربة عالية في التخزين──

## المكونات
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
- الإحتساء: استخدام Unstructured.io أو docling 处理结构化文档; استخدام ColPali 处理视觉丰富的 PDFs
- المتجهات DB: 低于 50M المتجهات 时使用 pgvector + pgvector scale;否则使用 Qdrant Cloud
- الدرجة: الوزن الميداني 带
- 编排: LlamaIndex سير العمل(إدراج) + LangGraph(حوار)
- إعادة التصنيف: 自托管 bge-reanker-v2-gemma-2b أو مستضيف Voyage
- ماجستير في العلوم: 带 prompt caching of Claude Sonnet 4.7; fallback 为自主托管 Llama 3.3 70B
- إيفال: راغاس 0.2 على الانترنت، DeepEval يستخدم للوهلوسة و الجيلبرك سويت
- الملاحظة: Langfuse المضيفة الذاتية،带 ملاحظات صف;Arize Phoenix 用于漂移
- الحراسة: حرس لاما 4 تصنيف المدخلات / الخروج، سياسة حرس نيو v0.12، مساحة المعلومات الشخصية في بريسيديو
- الامتثال: قطع علامات الوصول القائمة على الأدوار ؛ تستخدم علامات الولاية القضائية الخاصة بـ GDPR / HIPAA


```figure
canary-rollout
```

## بناءها
1. **Ingestion.**استخدام غير منظم أو المستندات 解析 your corpus(تصميمات صارمة عادةً تكون 1000-10000 个文档)。 بالنسبة إلى صفحات مسح / 视觉密集页面,路由到 ColPali──生成带总结、角色标签、管辖的标签的块──

2. **Index.**التوابل الكثيفة ((Voyage-3 أو Nomic-embed-v2)写入 pgvector + pgvector scale── عبر Tantivy 建立 BM25 side-index──دوار ومصفحات الولاية 作为 payload──

3. **Hybrid retrieve.**先按角色+司法 过; ثم并行 كثيفة + BM25; باستخدام مزيج الترتيب المتبادل 合并; أعلى 20 送入重排; أعلى 5 送入合成。

4. **Synthesize with prompt caching.**خطة النظام + سياسات ثابتة  وضعت رأس التخزين ؛ ترتيب السياق  كمتوسع التخزين ؛ سؤال المستخدم  كإضاف غير متخزين。 حالة ثابتة  هدف هو 60-80% معدل ضرب التخزين‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

5. **Guardrails.**输入经过 لاما گارد 4;NeMo Guardrails ريل 阻止 خارج النطاق الأسئلة أو المواضيع المحظورة للسياسة;Presidio 清理输出中的意外 PII;引文 إنفاذ بعد الفلتر。

6. **Golden set.**بواسطة مجال متخصصة العلامات 200 زوج من Q/A، تحتوي على (الجواب، الاقتباسات)

7. **Red team.**50 个 个 خصومية التحذيرات: دخول السجن ((PAIR、TAP) 、 محاولات إخلاء PII、 خارج النطاق、 تسريبات عبر الولايات القضائية。用pass/fail 和 severity 评分。

8. **Drift dashboard.**أريز فينيكس 每周跟踪检索质量 ((nDCG、引用忠诚度) ∼下降 5% 时告警──

9. **Cost report.**Langfuse: سعر النقاش السريع ‬الرموز لكل استفسار‬ ‬بعد التقسيم على مراحل

## استخدمها
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

## 交付 it
`outputs/skill-production-rag.md`描述 deliverable──一个部署在受监管领域的聊天机器人,带合规标签,通过条目,并使用现场漂移监测 观测──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | RAGAS faithfulness + answer relevance | golden set（200 Q/A）上的 online scores |
| 20 | Citation correctness | 带可验证 source anchors 的 answers 占比 |
| 20 | Guardrail coverage | Llama Guard 4 pass rate + jailbreak suite results |
| 20 | Cost / latency engineering | Prompt-cache hit rate、p95 latency、$/query |
| 15 | Drift monitoring dashboard | Phoenix live dashboard，带每周 retrieval-quality trend |
| **100** | | |

## التدريب
1. في مجال قضائية آخر، قم ببناء شريحة أخرى من المعلومات مثل "ضمن القانون القانوني للقانون" خارج القانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي للقانون الدولي الدولي للقانون الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولي الدولولولولولولولولولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدولية الدول

2. 测量一周生产 traffic                                                                                                                                                                                                                                                            

3. 添加带10k-token summary buffer ‬ ذاكرة متعددة التحولات‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

4. ستقوم بتبديل كلود سونيت 4.7 إلى إضافة للاما 3.3 70B

5. 添加 不确定模式: إذا كانت النتيجة أعلى تم إعادة تصنيفها 低于门, العميل يقول  ليس لدي اقتباسات واثقة, بدلا من الإجابة.

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
- [Harvey AI](https://www.harvey.ai) 参考法律 كومة الإنتاج
- [Glean enterprise search](https://www.glean.com) نطاق المؤسسة 下的参考RAG
- [Mendable documentation](https://mendable.ai) المطورين-دقائق RAG 参考
- [LlamaCloud Parse + Index](https://docs.llamaindex.ai/en/stable/examples/llama_cloud/llama_parse/) تناول المواد المدار
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) 成本杆参考
- [RAGAS 0.2 documentation](https://docs.ragas.io/) 标准 RAG إطار تقييم
- [Arize Phoenix](https://github.com/Arize-ai/phoenix)  参考 تحرك الملاحظة
- [Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) تصنيف السلامة 2026
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/)إطار السياسة السككية
