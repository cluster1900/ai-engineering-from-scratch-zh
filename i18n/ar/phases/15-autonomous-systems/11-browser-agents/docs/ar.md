# وكلاء المتصفحات مع长时程 Web 任务

> وكيل ChatGPT(7 مايو 2025) سوف يجمع المشغل وبحوث عميقة 合并 إلى عامل متصفح / محطة ، ويقوم بروس كومب على 68.9% 创始 SOTA。OpenAI 于 2025 مايو 31 日关闭 Operator هذا هو التكامل على مستوى المنتج。Anthropic 收购 Vercept 后, سوف يرفع كلود سونيت في OSWorld على النتائج من أقل من 15% 升至 72.5%Web──Arena-Verified(ServiceNow,ICLR 2026) تصحيح 11.3 نقطة مئوية من المعدل السلبي الكاذب في WebArena الأصلي ، ووضع 258-مهام القوة الصلبية. هذه الأرقام هي حقيقية.

**Type:** Learn
**Languages:** Python (stdlib, indirect prompt-injection attack surface model)
**先修要求：**المرحلة 15 · 10 (أوضاع الإذن) ، المرحلة 15 · 01 (مواد الأفق الطويل)
**Time:** ~45 minutes

## 问题

وكيل المتصفح هو وكيل بعيد الأفق: فإنه يقرأ المحتوى غير الموثوق به، ويجري عمليات عواقب. كل صفحة يزورها وكيل، هي إدخال مستخدم غير مكتوب. كل صفحة على كل صفحة، هي طريق أمر محتمل.

防御图景不舒服──OpenAI الاستعداد  المسؤول قال: الحقائق الخفية: لا يمكن إصلاح الحقن المباشر بشكل كامل ── السبب في الهجوم يحدث في حدود القراءة والعمل من العميل، والحدود هي في البنية المظلمة

本课会命名这个攻击面,命名基准图版图(BrowseComp、OSWorld、WebArena-Verified),并建模一个最小间接即时注射场景,让你推推理14和18中的真实防御──

## 概念

### 2026 سنة Edition: كل نظام

**ChatGPT agent (OpenAI).**تم إصدارها في 7 مايو 2025، تم تحديدها على موقع "مُشغل" (BrowseComp) و"بحوث عميقة" (Deep Research)

**Claude Sonnet + Vercept (Anthropic).**انتروبيك 收购 Vercept,重点放在计算机使用能力上――将Claude Sonnet 在 OSWorld 上的成绩从<15% 提升到72.5%──Claude Computer Use 作为工具 API 发布──

**Gemini 3 Pro with Browser Use (DeepMind).**إضافة استخدام المتصفح  إصدار التحكم في استخدام الكمبيوتر  FSF v3(2026 年 4 月,Lesson 20) خصيصاً تتبع الذاتية في مجال البحث والتطوير ML 

**WebArena-Verified (ServiceNow, ICLR 2026).**修复有充分记录的问题:原始WebArena 约有11.3%的错误负率(المهمات تم تسليطها على أنها فشلت، ولكن في الواقع قد تم حل) ―― الإصدار المحقق استخدام استخدام المعدات الاصطناعية معيار نجاح إعادة تقييم،并加入 258-مهام القوة الفرعية ((ICLR 2026 ورقة،openreview.net/forum?id=94tlGxmqkN) 』

### براؤز كومب vs أوس وورلد vs ويب آرينا

| Benchmark | 衡量什么 | Horizon |
|---|---|---|
| BrowseComp | 在时间压力下，在开放 Web 上查找特定事实 | 分钟级 |
| OSWorld | Agent 操作完整 desktop（mouse、keyboard、shell） | 数十分钟 |
| WebArena-Verified | 模拟网站中的事务型 Web 任务 | 分钟级 |
| Hard subset | 带有多页面状态转换的 WebArena-Verified 任务 | 数十分钟 |

轴线不同──高BrowseComp 分数说明代理 能找到事实; it does not explain agent 能预订航班──OSWorld 分数更接近它不能在我的桌面上工作──WebArena-Verified 更接近它不能完成流程──任何生产决策都需要选择与任务分布匹配的基准──

### 攻击面,命名如下

1. **Indirect prompt injection.**غير موثوق به الموقع محتويات التعليمات.
2. **URL fragment / query injection.**تم إمساكها`#fragment`أو سلسلة استفسار 包含命令──它们从不被可见染;但仍在代理的背景中──
3. **Memory-binding attacks.**页面指示代理 写入一条持续记忆(درس 12 涵盖持久状态) ・・・ في الجلسة التالية ، هذه الذاكرة في حالة عدم وجود جهاز تحفيز مرئية لتشغيل الحمل المفيد‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
4. **Authenticated sessions 上的 CSRF-shaped attacks.**الذاكرة المتلوثة 类:agent 已登录某处; صفحة المهاجم إصدار حالة变更请求,agent استخدام ملفات تعريف الارتباط للمستخدم 执行这些请求。
5. **One-click hijack.**وكيل تحميل بلا ضرر على الفيديو سوف يتبع الحمل المفيد.
6. **Agent host surface 中的 Content-Security-Policy holes.**تقديم و طبقات الأدوات 本身也可能成为攻击 矢量;浏览器-in-a-browser-agent stack 很宽──

### لماذا لا يمكن إصلاحها بالكامل؟

هذا النوع من الهجمات والإمكانيات والتركيب للعميل. يجب على العميل قراءة محتوى غير موثوق به لتنفيذ العمل. أي محتوى يقوم به العميل قد يحتوي على تعليمات. أي تعليمات يقوم بها العميل قد لا تتوافق مع طلبات المستخدم الحقيقية.

هذا مع نظرية لوب ((درس 8) هو نفس النمط التفكيري: العميل  لا يمكن أن يثبت أن التكنولوجيا التالية آمنة ؛ فإنه يمكن أن يبنئ فقط نظام ، جعل التكنولوجيا غير آمنة أكثر سهولة للاختبار.

### حقاً يمكن أن تكون على الخط

- **Read / write boundary.**读取永远不产生后果──写入(提交表单、发布内容、调用有副作用的工具) إذا كان المحتوى يبدأ من حدود الثقة، فإن الحكومة الخارجية تحتاج إلى موافقة جديدة على الموظفين──
- **Tool allowlist per task.**يمكن للعميل التصفح، إلا إذا تم تمكين أداة واضحة لهذا المهمة، وإلا لا يمكن أن يطلق النقود النقدية.
- **Session isolation.**جلسات وكيل المتصفح فقط باستخدام إثباتات محددة 运行。 لا وجود لأحد المنتجات، لا وجود لإلكترونية شخصية。 الحفاظ على كل طلب HTTP‬ 日志 للدراسة‬
- **Content sanitizer.**أحضر HTML في إطار نموذج 前,会剥离 معروف-سيئة الأنماط──(قلل من الهجمات السهلة;无法阻止复杂 payload──)
- **对 consequential actions 使用 HITL。**نمط الاقتراح ثم التزام (درس 15)
- **Canary tokens on memory.**إذا كان إدخال ذاكرة 触发، المستخدم سوف يراه ((درس 14) 👇


```figure
injection-boundary
```

## استخدمها

`code/main.py`建模一个小浏览器-代理运行,目标是三个合成页面──一页是良性,一个在可见文本中有直接提示注射斑点,一个有URL-fragment注射(不可见,但位于代理的背景中)──脚本展示了 (a) 无知代理会做什么,(b) 读/写界限会捕获什么,(c) 净化器会捕获什么,(d) 二者都捕获不了什么──

## 交付 it

`outputs/skill-browser-agent-trust-boundary.md`تحديد تنفيذ متصفح-وكيل مقترح: فإنه يصل إلى أي مناطق الثقة، ويتم ترخيصه للكتابة، وكذلك أول تشغيل قبل يجب أن يكون على موقع دفاعاتها.

## التدريب

1. 运行 `code/main.py` تحديد المطهر يمكن أن يلتقطه ولكن الحدود القراءة / الكتابة غير قادرة على التقاط الهجمات، وكذلك الحدود القراءة / الكتابة فقط يمكن أن يلتقط الهجمات

2. 扩展排毒, باستخدامها检测一类HashJack-style URL-fragment injection──在带有合法碎片的良性URL 上测量假阳性率──

3. 选择一个你知道的真实浏览器代理工作流程(例如,预订航班) ――列出每次阅读和每次写──标记哪些写 需要 HITL,以及为什么──

4. 阅读 WebArena-Verified ICLR 2026 ورقة──找到一个原始 WebArena 评分不可靠的任务类别,并解释

5. لتثبيت جهاز المتنبّس تصميم قناري ذاكرة.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|---|---|---|
| Indirect prompt injection | “坏页面文本” | Agent 读取的页面中有不受信任内容，其中包含 agent 会执行的指令 |
| Tainted Memories | “Memory attack” | Agent 将攻击者提供的指令写入 durable memory；下一次 session 触发 |
| HashJack | “URL fragment attack” | 隐藏在 URL fragment / query string 中的 payload 位于 agent 的 context 中，但不会被可见渲染 |
| One-click hijack | “坏按钮” | 可见 affordance 承载 agent 会执行的后续 payload |
| BrowseComp | “Web search benchmark” | 在开放 Web 上查找特定事实；分钟级 horizon |
| OSWorld | “Desktop benchmark” | 完整 OS control；多步骤 GUI tasks |
| WebArena-Verified | “修复后的 web-task benchmark” | ServiceNow 重新评分的 WebArena，带 Hard subset |
| Read/write boundary | “Side-effect gate” | 读取永远不产生后果；如果内容来自 trust 外部，写入需要新的批准 |

## 延伸阅读

- [OpenAI — Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) المُشغل و البحث العميق
- [OpenAI — Computer-Using Agent](https://openai.com/index/computer-using-agent/) سلسلة المشغل، وفي وقت لاحق أصبح معمارة وكيل ChatGPT.
- [Zhou et al. — WebArena](https://webarena.dev/) المرجح الأول
- [WebArena-Verified (OpenReview)](https://openreview.net/forum?id=94tlGxmqkN) ورق ICLR 2026 ذو مجموعة ثابتة
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 包含 المناقشة على سطح الهجوم وكلاء استخدام الكمبيوتر
