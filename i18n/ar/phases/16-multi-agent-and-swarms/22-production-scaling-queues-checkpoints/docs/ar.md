# 生产扩展  队列、检查点、耐用性

> أنظمة متعددة الوكلاء  توسيع إلى آلاف و تشغيل، تحتاج **durable execution**◊ وقت تشغيل LongGraph 会在每一个超级步骤 后写入一个由 `thread_id`标识的检查站 (默认使用 Postgres);工人 崩会释放租,另一个工人 会接手恢复──代理可以无限休息,等待人工输入──**MegaAgent**(arXiv:2408.09955) 运行 划分的生产消费者队列,包含三种状态(Idle / Processing / Response) 和两层协调(组内聊天 + 组间管理聊天)**Fiber/async**优于线程-per-job:threads 99% of the time都在空等待令牌,而纤维会在 I/O 上协作式让出――反方观点:Ashpreet Bedi "توسيع البرمجيات الوكالة" 主张在载证明需要之前使用**FastAPI + Postgres + nothing else**، simple architecture went farther than expected. هذا الدراسة سوف تكوين سجل نقطة التفتيش الدائمة.

**Type:** Learn + Build
**Languages:** Python (stdlib, `asyncio`, `sqlite3`)
**前置要求：**المرحلة 16 · 09 (شبكات الجماعة المتوازية) ، المرحلة 16 · 13 (الذاكرة المشتركة)
**Time:** ~75 minutes

## 问题

نموذج نظام متعددة الوكلاء في جهاز كمبيوتر محمول 上 باستخدام ثلاثة وكلاء و حلقة الحدث في الذاكرة 能正常工作──你把它迁移到生产环境:

- العملاء أحياناً يعملون في بعض الأوقات
- عمليات العمال 会崩──重启会失失状态──
- الحمل القصوى هو 10 مرات الحمل المتوسط؛ تحتاج إلى ارتفاع مستوى.
- المستخدم على أساس وكيل تدير 付费; تحتاج إلى استخدام حساب الفائدة بالضبط مرة واحدة

في الحدث في الذاكرة حلقة  غير قادرة على معالجة هذه المشاكل. تحتاج في الأسفل لزيادة طبقة التنفيذ الدائمة.

1. 带 نقاط التفتيش  موتور سير العمل  Temporal、LangGraph runtime)
2. 带 دولة متجر ‬صف الرسائل ‬Postgres + SQS/RabbitMQ)‬
3. الأطر النموذجية للجهات الفاعلة (ميكاجنت)
4. 手写 FastAPI + Postgres(منظور بادي)。

هذا الدروس سوف يُبني نسخة صغيرة من كل منهج

## 概念

### الإنفاذ المستمر، هذا النموذج

محرك تنفيذ دائم 会在每一个"步骤" ((LangGraph 术语中的超级步骤) بعد استمرارية حالة البرنامج الكاملة.

```
worker crashes mid-step
  -> lease timeout
  -> another worker picks up the thread_id
  -> resumes from last checkpoint
  -> no duplicate side effects
```

لكي ينجح، يجب أن تلبي:

- **Serializable state。**جميع الوكلاء الحكومة يجب أن تكون مستمرة. مع وجود اتصال قاعدة البيانات في الوقت الحقيقي. إغلاق الوظيفة لا يمكن أن تبقى.
- **Deterministic resume。**给定相同状态和相同输入,代理会产生相同行动 (或将LLM calls 委托给外部决定主义 Oracle) 
- **Idempotent side effects。**المكالمات الخارجية ((المكالمات الأداة الدفع) يجب أن تكون غير قابلة، أو استخدام مفتاح التكرار

LangGraph في كل خطوة فائقة 后写检查点;Temporal 在每个活动 后写;Restate 使用事件-source journals──三者实现是同一个模式──

### وقت تشغيل LangGraph

كل عميل لديه واحد`thread_id`;state is typed dict; كل خطوة فائقة مدونة إلى جدول نقاط التفتيش 写入一行。恢复时,runtime من آخر نقطة التفتيش 继续, وليس من头开始── العملاء يمكن `interrupt()`لنتظر الإدخال الإصطناعي؛ وقت تشغيل 会持久化并释放 العامل.

هذا هو تصميم الإنتاج المرجعي لعام 2026

### صف الموظفين من MegaAgent

arXiv:2408.09955  وصف تجربة على نطاق واسع: مجموعة من الآلاف من العاملين المزدوج في المجموعة.

```
agent i:
  state ∈ {Idle, Processing, Response}
  in_queue   <- messages addressed to agent i
  out_queue  -> replies + side effects

coordinators:
  intra-group chat  (agents in the same group)
  inter-group admin chat  (high-level routing)
```

تسمح التنسيقات المرتفعة بالحوار داخل المجموعة بتحقيق كثافة عالية، بينما يبقى المجموعة نادرة، وهو نمطٌ يحافظ على التكلفة الخطية بين الآلاف من العملاء.

### التزامن مقابل الخيط لكل وظيفة

مكالمات LLM هي I/O-bound. انتظروا خيط التوكن التالي 99% من الوقت هي فارغة. كل خيط يستهلك حوالي 1MB من ذاكرة الوصول.

الألياف ((بيتون `asyncio`、ذهب إلى الروتينات 、الثمرة `tokio`كما يمكن وضع 10،000 مكالمة بسهولة في عملية واحدة.

مثال:الترابطات المتعلقة بعملية المعالجة بعد التزامن مع الكمبيوتر المركزي (CPU-bound post-processing) لا تزال تحتاج إلى أسلاك أو عمليات.

### وجهة نظر بادي

"توسيع البرمجيات الوكالة" (Ashpreet Bedi,2026) يعتقد أن معظم المجموعات في قياس الحمل قبل التجهيز المفرط

- سريع الـAPI + بعد التخرج
- كل عميل يدير هو واحد،الوضع يستخدم التزامن التفاؤل
-  من خلال `pg_notify`أو عمال صللية  تنفيذ وظائف خلفية
- في كود التطبيق تنفيذ سياسة إعادة المحاولة

بالنسبة لأقل من 100 عملية إطلاق وكيل، والتي تعتبر تحميل قابلة للسيطرة، هذا عادة ما يكون كافيا.

القاعدة هي: عندما تواجه مشكلة محددة لا يمكن حلها من خلال البنية البسيطة، استعمل إطار عمل دائم.

### -مُجرد مرة بالضبط

 لتنفيذ عمليات وكيل دفع، تحتاج إلى "مفعول مرة واحدة بالضبط" (على الأقل تسليم مرة واحدة + المستهلك غير المحتمل)

- **每个 run 一个 dedup key。**في كل مكالمة تأثير جانبي
- **Outbox pattern。**الآثار الجانبية أولاً و في الجدول، وإعادة من خلال عملية مستقلة
- **Compensating transactions。**عندما يكون التأثير الجانبي نجاح ولكن تتبع كتابة 失败时, ترتيب تعويض عمليات

هذه هي أنماط هندسة قاعدة البيانات، وليس ضريبة LLM محددة.

### نشر قوس قزح

نظام أبحاث Anthropic متعدد الوكلاء استخدام "تطبيقات قوس قزح": العديد من الوكلاء تشغيل  إصدار并发运行, بحيث العاملين الذين يعملون لفترة طويلة لا داعي للقتل في كل مرة يتم نشر فيها الرمز ⋅ على جزء صغير من التدفق القناري الجديد الإصدار؛ عندما الإصدار القديم العاملين  समाप्त بعد إعادة الاختيار الإصدار القديم。

هذه هي الممارسة القياسية للأنظمة ذات الحالة طويلة الأمد؛ نقطة التكيف في عام 2026 هي أن العملاء يمكن أن يعيشون بضع ساعات، لذلك دورات التنفيذ يجب أن تكون متوافقة مع هذا النقطة.

### 典型生产 قائمة التحقق

- حالة دائمة ((نقاط التحقق٬صور الفورية، أو صندوق خارجي + سجل قابل للعب)
- آثار جانبية غير فعالة
- يستخدم طبقة I/O غير متزامنة من مكالمات LLM
- 带 dedup 的 على الأقل مرة واحدة التسليم
- 面向 حالة من عبء العمل 
- الملاحظة:تتبع لكل عميل، تدقيق في خطوة فائقة، مقعد التراجع


```figure
sw-checkpoint-replay
```

## بناءها

`code/main.py`实现:

- `CheckpointStore` سجل نقاط التفتيش المدعومة من SQLite، استخدام مفاتيح العلامات.
- `run_with_checkpoint(agent, thread_id)` 模拟中期崩; عامل آخر من آخر نقطة تفتيش 恢复。
- `AgentQueue` لكل عميل أجهزة حالة غياب / معالجة / استجابة ، مع قطار عمل صغير
- `demo_async_vs_threads()` 通過 asyncio 和 الخيوط 运行 500 个并发模拟 "LLM مكالمات"; report جدار الساعة 和 الذكرى الذكرية الذكية ((近似) 』

运行:

```
python3 code/main.py
```

预期输出:模拟崩后检查点恢复 成功;async version 在 < 1s 内处理 500 个并发电话;thread version 需要几秒钟,并且每个并发单元使用的内存 高出数量级──

## استخدمها

`outputs/skill-scaling-advisor.md`会根据负载、状态-retention 需求和部署 频率,建议持久-执行 选择:FastAPI + Postgres、LangGraph runtime、Temporal 或 custom。

## أصدرها

典型生产加固:

- **从简单开始（Bedi 的规则）。**استخدم FastAPI + Postgres حتى تكتشف أنها فشلت
- **在优化之前 instrument everything。**تاريخومة تأخر في كل تشغيل ‧وقت في كل خطوة ‧عد التخفيض ‧ تصنيف الفشل‬
- **为 side effects 使用 outbox pattern。**خصوصاً المدفوعات ودعوات API الخارجية
- **Rainbow deploys。**خلال عمليات التنفيذ لا تقتل أبداً عمليات العميل في الطائرة
- **当你遇到具体问题时采用 durable-execution engines（Temporal / LangGraph / Restate）：**انتظارات الإنسانية المُطولة لمدة ساعة ‧تنسيق بين المنطقة ‧ سياسات تعويض/تعويضات معقدة‬
- **I/O layer 使用 async。**الخيوط تستخدم فقط في المعالجة اللاحقة المرتبطة بالسي بي أيه

## التدريب

1. 运行 `code/main.py` تأكيد استئناف نقطة التفتيش 生效; قياس التزامن مقابل التزامن الخيط 差异。
2. 实现 واحد **outbox**الجدول: كل مكالمة أداة قبل أن تكتب في الصندوق الخارجي، ثم من خلال عمل منفرد / مهمة تنفيذها.
3. 模拟一个 **rainbow deploy**: اثنين من إصدارات تشغيل؛ سوف نصف جديدة thread_ids 路由到各自版本؛ تأكد من الخيوط في الطائرة في الإصدار القديم 不会被中断──
4. 阅读下面链接中的 LangGraph runtime doc──识别 runtime 中哪些功能在手写FastAPI + Postgres 版本中最耗时──那是理由采用它,还是可以延迟?
5. 阅读MegaAgent (arXiv:2408.09955) القسم 3──两层协调(اندرا-جماعة + الدردشة الإدارية بين المجموعات) هو واضحة── رسم كيف ستقوم بتسجيلها إلى مع اثنين من أفراد صف الأسرة من صف الرسائل──

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| Durable execution | "Persist the program state" | Engine 在每个 super-step 后写入 state；crash recovery 是 deterministic 的。 |
| Super-step | "Transactional boundary" | Checkpoints 之间的 work unit。LangGraph 术语。 |
| thread_id | "Agent run identifier" | 绑定 checkpoints 和 resume logic 的 key。 |
| Idempotency | "Safe to retry" | 重复一个 side effect 产生的结果与一次尝试相同。 |
| Outbox pattern | "Decouple side effects" | 将 intent 写入 table；独立 executor 执行并标记完成。 |
| At-least-once delivery | "Possible duplicates" | Message queue semantics；dedup key 让 consumer 达到 effective-once。 |
| Rainbow deploy | "Overlapping versions" | 长时间运行 workloads 期间多个 runtime versions 并发存在。 |
| Async fiber | "Cooperative yielding" | User-mode concurrency；对于 I/O-bound loads，相比 threads 成本很低。 |
| Checkpoint | "State snapshot" | super-step 边界处的 serialized state；是 resume 的 key。 |

## 延伸阅读

- [LangChain — The runtime behind production deep agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) تصميم وقت تشغيل لنجراف
- [MegaAgent](https://arxiv.org/abs/2408.09955) صف المنتج والمستهلك لكل وكيل؛ آلاف وكلاء تمرّدون
- [Matrix](https://arxiv.org/abs/2511.21686)استخدام صفوف الرسائل كإطار لامركزي لترتيب الأساس
- [Temporal docs](https://docs.temporal.io/) تنفيذ مستمر  محرك سير العمل المرجعي
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) بما في ذلك نشر قوس قزح
