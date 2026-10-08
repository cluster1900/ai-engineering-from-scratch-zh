# من Chatbot إلى وكلاء الأفق الطويل

> 2023، أجب على المدونات في محادثة واحدة على سؤال. حتى 2026، نموذج الحدود عادة ما يعمل على مهام فردية من دقائق إلى ساعات. مؤشر Time Horizon 1.1 من METR ((1 يناير 2026) يظهر، أن Claude Opus 4.6 في 50% موثوقية.

**Type:** Learn
**Languages:** Python (stdlib, horizon-curve simulator)
**Prerequisites:** Phase 14 · 01 (The Agent Loop)
**Time:** ~45 minutes

## 问题

إن الروبوت هو وظيفة بلا حالة. يتلقى طلباً، يعود إلى الرد، ثم ينسى. حتى أنظمة RAG التي يتم بناؤها حتى عام 2024، تعمل بهذه الطريقة: فهي تنظم في نافذة سياقية واحدة، وتنفيذ إجراءً واحداً، وتظهر النتائج.

وكيل مستقل في طبيعته مختلفة. فإنه يعمل حلقة. يقرر متى يتوقف. فإنه ينفق المال في عملية التشغيل. الوهم الحقيقي.

عدد METR يجعل هذا النقطة أكثر ملموسة. من GPT-2 إلى Claude Opus 4.6, الأفق الزمني ((الموديل مع 50% موثوقية  إكمال المهام البشرية طول) من بضع ثوان تزداد إلى نصف أيام عمل.

## 概念

### 用一段话解释 METR أفق الزمن

METR(ممثل ARC Evals) سوف تحدد احتمال نجاح المهام مع عدد المهام المتخصصة في وقت الانتهاء البشري الملائمة للسياق اللوجستي.

### عندما يتغير الأفق، ما هو الفشل الحقيقي؟

- **Context.**1-0: 1 - 14 ساعات من العملات التجارية تنتج مئات الآلاف من الملاحظات والتخرجات الأداة و آثار التفكير.
- **Trust.**في دورة واحدة من المحادثة، يمكنك قراءة كامل الجواب. في 1000 دورة، لا يمكنك مراجعة سطح.
- **Failure modes.**短运行会因为能力限制 失败――长运行也会因为漂移、循环、奖励黑客,以及评估-vs-deploy behavior gaps而失败――见下文)──这些失败在累积之前是不可见的──
- **Cost.**كلاود أوبوس 4.6 في استخدام أداة كاملة 下 تنفيذ مرة واحدة 14 ساعات مستقلة، قد يحرق ميزانية الدردشة لمدة شهر.
- **Observability.**تطلب السجلات غير كافية. تحتاج إلى التلفميترية على مستوى المسار. ميزانيات العمل و الـ "كاناري توكن" لتمكن من التقاط السلوك غير العادي الصامت.

### أوقات مضاعفة  و معناه

过去表现不保证未来,但这个趋势过于一致,不能忽视──METR的拟合(2025年3月)

- أفق 2026 (((今天的كلود أوبوس 4.6):~14 小时
- أفق 2027: ~ 48 小时
- أفق 2028

هذه هي القرارات المباشرة، وليس التنبؤات. إنها القياسات التي يجب أن يتحملها كل قرار تصميم في هذه المرحلة.

### ألعاب ذات السياق المتساو

2026 تقرير سلامة الذكاء الاصطناعي الدولي  سجل نماذج الحدود 能区分评估 السياق من سياق التنفيذ، ويعرض في التجارب إلى أكثر أمانا من القياسات.

实践后果:horizon 数字是能力上限,而不是可靠性下限──:

### التحول الواحد مقابل التفاصيل الطويلة,对比

| Property | Chatbot (single-turn) | Long-horizon agent |
|---|---|---|
| Run length | 秒 | 分钟到小时 |
| Tokens per run | 10^3 | 10^5 到 10^7 |
| State | 短暂 | 持久、checkpointed |
| Failure surface | model capability | capability + drift + loops + hacking |
| Review unit | final answer | trajectory |
| Cost profile | 可预测 | fat-tailed |
| Eval-vs-deploy gap | 小 | 已记录且正在增长 |

كلّ خطّة ستصبح جزءاً من مرحلة البن


```figure
task-decomposition
```

## استخدمها

运行 `code/main.py` سوف تتشابه مع منحنى الأفق METR و تظهر:

- 50٪ الأفق 如何随所选 مضاعفة الوقت 缩放──
- احتمال فشل كل خطوة  كيف في عملية واحدة
- وكيل موثوق بنسبة 99% على كل خطوة كيف يبقى في مسار الخطوة الـ 70

الممثل يستخدم فقط المعلم. الغرض هو التدريس: قبل أن يتم تشغيل العميل المُنزل، ضع أولئك الأرقام في الدماغ.

## 交付 it

`outputs/skill-horizon-reality-check.md`ساعدك في الإجابة على سؤال فعلي: بالنسبة لمهمة عميلك التي تريد تسليمها، هل الأفق الحدودي الحالي كافٍ لتغطيتها، أم أنك ستسلم نظامًا غير مسيطرة؟

## التدريب

1. تمرّد الممثل، في حالة تأكيد، 7 أشهر مضاعفة، كم من الأشهر تحتاج إلى أن تمرّ عبر 30 ساعة؟ 168 ساعة؟ رسم هذه النقاط المشتركة.

2. ستصبح موثوقية خطوة واحدة 0.995                                                                                                                                                                                                                                                         

3. 阅读METR's Time Horizon 1.1 مدونة البحث عن طريقة لتحديد التغييرات المختارة

4. 選擇一你知道的生产代理工作流程──估值工具通话中中的中介轨迹长度──乘以你对每步可靠性的最佳猜测──得到的端到端 数字是否对用户诚实?

5. قراءة 2026 تقرير سلامة الذكاء الاصطناعي الدولي حول القسم حول ألعاب تقييم السياق. تصميم بروتوكول تقييم، بحيث يمكن أن يبقى قوية على الوضع المختلف بين أداء النموذج في الاختبار والتنفيذ.

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Time horizon | “它能运行多久” | METR 的 50%-reliability 人类任务长度，通过 logistic regression 拟合 |
| HCAST | “METR 的 task suite” | 180+ 个 ML、cyber、SWE、reasoning tasks，跨度从 1 分钟到 8+ 小时 |
| RE-Bench | “Research engineering benchmark” | 71 个带有人类专家 baseline 的 ML research-engineering tasks |
| Doubling time | “horizons 增长得多快” | 50% horizon 翻倍所需时间；自 GPT-2 以来拟合约为 7 个月 |
| Trajectory | “Agent 的 action sequence” | 一次运行中 tool calls、observations 和 reasoning steps 的完整有序列表 |
| Eval-context gaming | “模型在测试中表现不同” | 模型推断自己正在被评估，并表现得更安全，从而抬高 benchmark scores |
| Alignment faking | “retraining attempts 下的表现” | Claude 在 Anthropic 2024 年测试的 12-78% 中表现出这一点 |
| Horizon as upper bound | “METR 数字是天花板” | Benchmark horizons 假设理想 tooling 且没有后果；部署更难 |

## 延伸阅读

- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) أوراق الأفق الأول 和方法论。
- [METR Time Horizons benchmark (Epoch AI)](https://epoch.ai/benchmarks/metr-time-horizons) 当前数字,更新至2026 年──
- [Anthropic — Measuring AI agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy)  حول الأفق ‬التزوير بالاتجاه و الفجوة في التنفيذ
- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) HCAST、RE-Bench、SWAA suite 规格‬
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 管控 طويلة الأفق تسلسل أولويات سلوك كلود
