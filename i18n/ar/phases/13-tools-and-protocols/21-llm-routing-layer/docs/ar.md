# LLM طبقة التوجيه  LiteLLM, OpenRouter, Portkey

> مزود القفل في 代价高昂。 مختلف أدوات الاتصال 工作负载适合不同模型。 توجيه البوابة 提供统一的API 表面、重试、 failover、成本跟踪和 guardrails。2026 سنة هناك ثلاثة أشكال رئيسية:LiteLLM(开源、自托管)、OpenRouter(托管 SaaS)、Portkey(生产级,2026 年 3 月开源)。本课会说明决策标准,并演示一个 stdlib توجيه البوابة。

**Type:** Learn
**Languages:** Python (stdlib, routing + failover + cost tracker)
**Prerequisites:** Phase 13 · 02 (function calling), Phase 13 · 17 (gateways)
**Time:** ~45 分钟

## 學习目标
- 区分自托管、托管和生产级路由 选项──
- 实现 a fallback chain, في المقدم 失败时按定义好的优先级顺序重试──
- تتبع عبر مزود تكلفة الطلبات الوحيدة و استخدام الوهمات
- وبالنسبة لقيود الإنتاج المحددة، يتم اختيار بين LiteLLM、OpenRouter وPortkey

## 问题
الموقع المهم:

1. **成本。**كلود سونيت  تكلفة هو 3 أضعاف هايكو ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

2. **Failover。**افتتاح الآي خرج في حالة فاشل كل طلب فشل

3. **延迟。**实时聊天 UI 需要快速的时间到第一代标志――批量摘摘器不需要――按延迟 SLA 路由──

4. **合规。**يجب أن يظل المستخدمون في الاتحاد الأوروبي في منطقة الاتحاد الأوروبي.

5. **实验。**في نفس الحمل المالي على النموذجين إعداد A/B.

للكل من المشتركين كتابة هذه المنطقات مرة أخرى. بوابة توجيه توفر API متوافقة مع OpenAI، وتعامل مع الجزء المتبقية.

## 概念
### الوكيل الموافق مع OpenAI 形态

جميع الناس يستخدمون شكل OpenAI.`/v1/chat/completions`، تقبل مخطط OpenAI ، وتعمل داخلياً على الإنساني / جيمين / كوهير / أولاما / 任何后端──客户端不需要关心──

### الاسم الاسمية النموذجية

لا تكتب`claude-3-5-sonnet-20251022`بل كتبت`our_smart_model`بوابة ستقوم بتغيير الاسم التلقائي 映射到真实模型──当Anthropic 发布Claude 4 时,你在服务端修改 الاسم التلقائي;你的代码无需改变任何东西──

### السلاسل الخلفية

```
primary: openai/gpt-4o
on 5xx: anthropic/claude-3-5-sonnet
on 5xx: google/gemini-1.5-pro
on 5xx: refuse
```

البوابة في التكوينات تعريف هذه.

### الاحتفاظ بالتخزين

نفس أو شبه نفس المكالمة في الحافظة ، وليس مزود الوصول.

### الحراسة

网关级:

- **PII redaction.**في إرسال على الفور، أو على أساس إدارة الملفات المستخدمة.
- **Policy violations.**رفضت أن تتضمن محتوى محظور
- **Output filters.**الانتهاء من التنظيف

المفتاح والكونغ مدينة داخلية مع حواجز محددة الاتجاه.

### حدود أسعار كل مفتاح

مفتاح API = فريق واحد. ميزانية لكل مفتاح. منع استهلاك فريق واحد حصة مشتركة. معظم البوابات تدعم هذا النقطة.

### المضيفة الذاتية ومدارة

| Factor | LiteLLM (self-hosted) | OpenRouter (managed) | Portkey (production) |
|--------|----------------------|----------------------|----------------------|
| Code | 开源，Python | 托管 SaaS | 开源（2026 年 3 月）+ 托管 |
| Setup | 部署一个 proxy | 注册 | 二者均可 |
| Providers | 100+ | 300+ | 100+ |
| Billing | 你自己的 key | OpenRouter credits | 你自己的 key |
| Observability | OpenTelemetry | Dashboard | 完整 OTel + PII redaction |
| Best for | 想要完全控制的团队 | 快速原型开发 | 有合规需求的生产环境 |

عندما يكون لديك فريق SRE ومريد أن يكون لديك حقوق الملكية على البيانات،LiteLLM 胜出. عندما تريد فقط التسجيلات ولا تريد أن ترعى البنية التحتية،OpenRouter 胜出.

### تتبع التكاليف

كل طلب يحمل`provider`.`model`.`input_tokens`.`output_tokens` يُعدّ حسب النموذج  حسب أسعار الوهمات  من البوابة  الصفحة التسعيرية  حسب المستخدم / 团队 / 项目聚合──

### MCP + توجيه

يمكن أن يتم عبر البوابة في نفس الوقت من خلال طلبات الـ LLM 调用和MCP استنتاج العينات.

### استراتيجيات التوجيه

- **Static priority.**الأول في قائمة، والخاطئ في العودة
- **Load balancing.**"مُسحَبَة" أو "مُضَافَة".
- **Cost-aware.**选择满足延迟 / 质量要求的最低成本模型──
- **Latency-aware.**选择过去 N 分钟内最快的模型──
- **Task-aware.**سوف يصنف العاجل طريق التشفير إلى نموذج، وسوف يختصر طريق التفاصيل إلى نموذج آخر.


```figure
tp-router-failover
```

## استخدمها
`code/main.py`استخدام 150 行 لتحقيق بوابة توجيه: قبول OpenAI شكلها الطلبات، تحويل إلى كل مزود stub،运行 الدرجة الأولوية سلسلة الردود الخلفي، تتبع تكلفة الطلبات،并对输入应用 PII ترميم مرور.

需要关注:

- `ROUTES`dict:alias -> 按优先级排序的具体供应商列表
- حلقة الاحتفال سوف تجري محاولة ثانية في 5xx
- سيقوم متابعة التكاليف بتعزيز حجم استخدام الوهم بمعدل قيمة كل نموذج
- محرر PII 会在转发前清理形形状类似SSN的模式.

## 交付 it
本课会产出 `outputs/skill-routing-config-designer.md` تخصيص ملف تحميل العمل ((延迟、成本、合规) ، هذه المهارة 会选择 LiteLLM / OpenRouter / Portkey،并生成 روटिंग تشكيل‬

## التدريب
1. 运行 `code/main.py` تسبب انقطاع الحركة؛ تأكيد الانقطاع إلى المزود الثاني، و التكلفة صحيحة

2. 添加语义缓存:prompt 的 SHA256 作为搜索密钥;缓存击立即返回──测量重复调用成本节省──

3. 添加一个快速分类器,将 `"code ..."`على الفور 路由到偏向智能的密碼,将 `"summarize ..."`السرعة المتحركة

4. وضع ميزانية لكل فريق: كل فريق لديه حد لإنفاق الشهر؛ بعد الوصول إلى الحد الأقصى، البوابة  رفض الطلب.

5. ويقولون: "كل منتج يقدم، والثانية لا تملك وظيفة واحدة".

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Routing gateway | "LLM proxy" | 位于多个 provider 前方的统一 API 表面层 |
| OpenAI-compatible | "Speaks the OpenAI schema" | 接受 `/v1/chat/completions` shape，并转换到任意 backend |
| Model alias | "our_smart_model" | 你代码中的名称，由 gateway 映射到具体模型 |
| Fallback chain | "Retry list" | 失败时按顺序尝试的 provider 列表 |
| Semantic caching | "Prompt-embedding cache" | Key 是 prompt 的 Embedding；近似重复内容共享一次 cache hit |
| Guardrails | "Input/output filters" | 脱敏 PII，拒绝 policy violations |
| Per-key rate limit | "Team budget" | 作用域限定到 API key 的 quota |
| Cost tracking | "Per-request spend" | 聚合 Token 使用量 x 每个模型的价格 |
| LiteLLM | "The open proxy" | 可自托管的 OSS routing gateway |
| OpenRouter | "The managed SaaS" | 基于 credit 计费的托管 gateway |
| Portkey | "The production option" | 开源 + 托管，内置 guardrails |

## 延伸阅读
- [LiteLLM — docs](https://docs.litellm.ai/) بوابة توجيه 自托管
- [OpenRouter — quickstart](https://openrouter.ai/docs/quickstart) 托管 توجيه SaaS
- [Portkey — docs](https://portkey.ai/docs) 带有护的生产级路由
- [TrueFoundry — LiteLLM vs OpenRouter](https://www.truefoundry.com/blog/litellm-vs-openrouter) 决策指南
- [Relayplane — LLM gateway comparison 2026](https://relayplane.com/blog/llm-gateway-comparison-2026) البائع 调研
