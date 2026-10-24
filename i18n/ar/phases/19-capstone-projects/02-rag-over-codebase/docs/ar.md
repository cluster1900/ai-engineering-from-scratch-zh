# كابستون 02  قاعدة كود 上的 RAG(跨 Repo بحث تعبير)

> 2026 سنة، كل منظمة هندسية صارمة ستعمل على عمل واحد قادر على فهم المعنى وليس مجرد مطابقة خيط البحث الداخلي في الشفرة.

**类型：**كابستون
**语言：**Python ((إدمان) 、TypeScript ((API + UI)
**前置要求：**المرحلة الخامسة (أساسات النظام النووي) المرحلة السابعة (المحولات) المرحلة الحادية (التدريس في الهندسة) المرحلة الثالثة (الأدوات) المرحلة السابعة (البنية التحتية)
**练习到的 Phases：**P5 · P7 · P11 · P13 · P17
**时间：**30 ساعة

## 问题
بحلول عام 2026 ، سيتم إعداد كل وكيل برمجة حدودية لقطاع استرداد قاعدة البيانات ، لأن النوافذ السياقية فقط لا يمكن حلها عبر repo 问题;; سياق 1M-Token من كلود لديه مساعدة ؛ ولكن لن يزيل الطلب على الاسترداد المتدرج;; على قطع خام القيام باحث بسيط كوسين ، وسوف يتم تنفيذ رمزات 长尾上污染结果;;

سوف تتعلم هذا الأمر من خلال المؤشر مجموعة من الأسطول الحقيقي، بدلاً من مجرد مؤشر إعادة التأهيل التعليمي، وتقييم MRR@10٬ إئتمان الاقتباسات و إضافية الطفافة٬ أساليب الفشل هي على مستوى البنية التحتية:

## 概念
استخدام القناة الإدمانية الحساسة للشجرة استخدام القناة التدريبية لتحديد كل ملف، وتحديد وظيفة وفرق الفصل، وتحديد حدود العقد بدلا من تحديد النوافذ الوهمية فوق قطع قطعة. كل قطعة سوف تحصل على ثلاثة أنواع من تعبيرات: ضخمة إدراجات: ((مخطط الرحلة-3 أو رمز الإدراجات الإسمية) ، والحرف BM25، فضلا عن جملة قصيرة من ملخص لغة الطبيعة.`check_permission`.

استرداد هو هجين من.‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

الطفافة الزائدة هي مشكلة البنية التحتية. اضغط على التغيير: أي ملفات تغيرت، أي رموز تغيرت.

## المكونات
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
- الحل:带 17 种语言语法的树-sitter(Python、TS、Rust、Go、Java、C++等)
- التضمينات الكثيفة:مخطط الرحلة-3(مضيفة) أو اسمية-مضافة-مضيفة-v1.5(مضيفة ذاتية)
- مؤشر الخرق:带 BM25F 的 Tantivy(الخرق) ، على اسم الرمز 和 الجسم صنع معدل المجال
- المتجه DB:Qdrant 1.12, دعم البحث الهجين; أو وجه نحو 50M المتجهات
- نموذج ملخص:Claude Haiku 4.5 أو Gemini 2.5 Flash، مع التخزين السريع
- إعادة التصنيف:مرتبة 3 المرتبة التالية أو إعادة الترتيب
- التنسيق:LlamaIndex سير العمل يستخدم للاستهلاك، LongGraph يستخدم لجهاز الاستفسار
- المختلط: كلود سونيت 4.7 ((1M سياق) ،带 محفظة سرية سريعة
- الرسم البياني الرمزي:Neo4j(مدار) أو kuzu(مدمج) ، للمستحيل في الاستيراد و حواف الدعوة
- الملاحظة: كل خطوة استرداد + التوليد من Langfuse امتدادات


```figure
ce-hybrid-retrieval
```

## بناءها
1. **Ingestion walker。**في كل كوكة إضغط 上遍历 git تاريخها── جمع الملفات المعدلة── على كل ملف، باستخدام شجر-sitter 解析,提取 وظيفة 和 عقدة الفصل  وتسطوح المصدر الكامل لها──输出 شكل السجلات `{repo, path, start_line, end_line, symbol, body}`.

2. **Chunk summarizer。**سوف تقوم بتحفظ المكونات في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقها في محفظة الحاجز و تطبيقات الحاجز و تطبيقات الحاجز و تطبيقات الحاجز و تطبيقات

3. **Embedding pool。**两个并行排队: كثافة(رمز الرحلة-3 دفعة 128) وموجزة(الموديل نفسه، ولكن输入 الموجزة سلسلة)`{repo, path, start_line, end_line, symbol, kind}`.

4. **BM25 index。**مؤشر Tantivy الموزن في الحقل:سمبل اسم وزن 4،سمبل وزن الجسم 1،مجموع الوزن 2──它既支持 بحث عن الوظيفة المسمى X 查询،也支持 بحث عن الوظيفة التي تفعل X 查询──

5. **Symbol graph。**على كل قطعة  حواف السجل:الإيرادات(هذا الملف يستخدم من رمز repo Z Y) ‬النداء(هذا المهمة 调用了类 C 上的方法 M) ‬الوريثانس‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

6. **Query agent。**يحتوي على ثلاثة عقدات`retrieve`并行触发 كثيفة + BM25،按 (رپو، طريق، رمز) 去重──`rerank`في أعلى 50 上运行 الترميز المتقاطع،并保留 أعلى 10`synth`调用Claude Sonnet 4.7,把重排 放入文本,缓存系统提示,并要求 file:line citations──

7. **Citation enforcement。**解析 النموذج الخروج; أي `(repo/path:start-end)`دعوى المرسومة تم تسليطها باعتبارها استرداد أو هروبة.

8. **Incremental re-index。**كل مرة على شبكة الإنترنت، حساب رمز مستوى مختلفة. فقط إعادة إدراج 文本发生变化的 块.

9. **Eval。**标注 100 个跨 repo أسئلة,并给出金档:line answers──衡量MRR@10、nDCG@10、引用忠诚度(带可验证 ancors的索赔比例) 以及p50/p99 latency──

## استخدمها
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

## 交付 it
مهارة قابلة للتسليم`outputs/skill-codebase-rag.md`△给定一组 repos 语料,它能启动摄入管道、混合指数 和查询代理,并为任何跨 repo 问题回归带引用的答案── rubric:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Retrieval quality | 在 100-question held-out set 上的 MRR@10 和 nDCG@10 |
| 20 | Citation faithfulness | answer claims 中带可验证 file:line anchors 的比例 |
| 20 | Latency and scale | 在 indexed corpus size 上 10k QPS 时的 p95 query latency |
| 20 | Incremental indexing correctness | 从 git push 到可被搜索的时间，在 50-file commit 上衡量 |
| 15 | UX and answer formatting | Citation 可点击性、snippet previews、follow-up affordance |
| **100** | | |

## التدريب
1. سوف يبدل "Voyage-code-3" بـ "self-hosted nomic-embed-code" 

2. إلى الجسم 注入 20% من النشاطات المولدة (التي تنتجها اللم)并重新评估──观察 استرداد التسمم── إلى الحمل المفيد 添加一旗,并降低权重这些击──

3. في حجم جسمك أعلى مقياس البحث المختلفة المختلفة مع pgvector + pgvector scale.

4. إضافة إختبار التجول القائم على العينات: إعادة تشغيل 100 سؤال في الأسبوع

5. 扩展到跨语言符号解析:一个Python函数 通过gRPC 调用Go服务──使用符号图将它们关联起来──

## 关键术语
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
- [Sourcegraph Amp](https://ampcode.com) إنتاج درجة التخفيف بين الروابط
- [Sourcegraph Cody RAG architecture](https://sourcegraph.com/blog/how-cody-understands-your-codebase) 本 capstone 的参考 غوص عميق
- [Aider repo-map](https://aider.chat/docs/repomap.html) محيط الأشجار 排序的 repo 视图
- [Augment Code enterprise graph](https://www.augmentcode.com) 商业 الرمز الرسم البياني RAG
- [Qdrant hybrid search docs](https://qdrant.tech/documentation/concepts/hybrid-queries/) تنفيذ مرجع
- [Voyage AI code embeddings](https://docs.voyageai.com/docs/embeddings) تفاصيل الرحلات
- [Cohere rerank-3](https://docs.cohere.com/reference/rerank) إشارة مُعبرة
- [Pinterest MCP internal search](https://medium.com/pinterest-engineering) منصة داخلية 参考
