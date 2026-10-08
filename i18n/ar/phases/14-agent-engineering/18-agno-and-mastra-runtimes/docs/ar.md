# أغنو ومسترا:生产 Runtime

> Agno (Python) 和 Mastra (TypeScript) هي 2026 سنة من الإنتاج Runtime 组合。Agno 目标是微秒级 Agent 实例化和无状态 FastAPI backend。Mastra 基于 Vercel AI SDK 底层,提供代理、工具、工作流、统一模型路由和复合存储──

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 13 (LangGraph)
**Time:** ~45 minutes

## 學习目标
- 识别Agnos performance goals,以及这些目标在什么场景下重要.
- يقولون أن ثلاثة من أسباب ماستر  وكلاء  أدوات  تدفقات العمل  و دعم المعدلات الخادم‬
- 解释为什么没有状态、session-scoped FastAPI backend 是推的Agno 生产路径──
- 根据给定堆 选择 Agno 或 Mastra(بايتون-اول مقابل تايب سكريبت-اول)。

## 问题
LangGraph、AutoGen、CrewAI كانت تحسب الإطار ثقيل── تريد طالما أن اللفة العميل، يجب أن تكون سريعة، ويضيف في عملي Runtime 里运行  的团队، سوف تختار Agno (Python) أو Mastra (TypeScript)── كلتا مع جزء من الإطار المملوكة البدائية 换取原始速度، فضلا عن مع الدرج المحيط أكثر وضيقة تشكيل‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## 概念
### (أجنو)

- وقت تشغيل بايثون، السابق هو بيانات في-ديتا
- لا يوجد رسومات أو سلسلة أو نمط معقد فقط
- أهداف الأداء في أدواتها: حوالي 2μs وكيل 实例化、 كل وكيل 约3.75 كيب ذاكرة、 حوالي 23 مزود نموذج‬
- 生产路径:无状态、session-scoped 的 FastAPI backend── كل طلب تم تشغيل وكيل جديد؛ حالة الجلسة 存在 DB 中──
- المواد متعددة النظام (صورة الصورة الصوتية الفيديو الملف) والمركزية RAG

عندما يكون لديك آلاف العملاء في كل ثانية (أنشطة التقييم) ، هذه الأهداف السريعة مهمة.

### مستر

- نوع النص، بنيت على Vercel AI SDK 之之之
- ثلاثة بدائيات:**Agents**.**Tools**(مختلفة عن الزود)**Workflows**.
- نموذج موجه موجه  跨 94 个供应商的 3,300+ موديلات(2026 年 3 月) 👇
- تخزين مركب:ذاكرة ‬تدفقات العمل‬التلاحظ 可接入不同 خلفيات 推 ClickHouse‬
- أباتشي 2.0، مصدر الصفحة`ee/`حالياً، يتم استخدام رخصة المؤسسة المتاحة من المصدر.
- 支持 Express、Hono、Fastify、Koa's خادم المعدلات؛ على Next.js 和 Astro 提供一流 التكامل‬
- 提供 Mastra Studio ((مضيف محلي:4111) لتحريف الأجهزة
- 1.0 版本时(2026 年 1 月) هناك 22k+ نجوم GitHub 、300k+ كل أسبوع نيم تنزيلات‬

### الموقع

两者都不是成为 لانغغراف.

- **Language fit.**Agno 面向 Python-first 团队;Mastra 面向 TypeScript-first
- **Runtime ergonomics.**Agno = تقريبا صفر التكلفة الجوية;Mastra = 与 Vercel النظام البيئي 集成。
- **Observability.**两者都集成 لانغفوز/فينيكس/أوبيك (درس 24) ، لكن استوديو ماسترا هو الحزب الأول

### متى يجب اختيار كل واحد

- **Agno** Python backend 大量短生命周期 Agent 强性能要求 FastAPI 团队
- **Mastra** نوع النص الخلفي Next.js / Vercel نشر 统一 متعدد مزود نموذج توجيه  أدوات نوع زود
- **LangGraph**(الدرس 13)  عندما تكون حالة دائمة وبرنامج الرسم البياني التفكير أكثر أهمية من السرعة الأصلية 
- **OpenAI / Claude Agent SDK** عندما تريد مزود 產品化后的形态时(درس 1617)

### هذا النمط سهل في الخروج من هنا

- **Perf-for-perf's-sake.**لأنّه يبدو خطأ في اختيار Agno، لكنّ الحملة هي كل طلب واحد من العملاء بطيئة.
- **Ecosystem lock-in.**التكامل ذو النكهة الفوركية في Mastra هو إضافة في Vercel، وفي أماكن أخرى يمكن أن يكون إضافة في خفض في Vercel.
- **Enterprise license confusion.**الماسترة `ee/`النص هو متوفر من المصدر، وليس آباشي 2.0... إذا كنت تخطط للشكل، يرجى قراءة الترخيصات...


```figure
wb-runtime-spawn
```

## بناءها
هذا الدرس هو في الأساس مقارنة   واحد رمز الفن 无法公正呈现两个框架──参见`code/main.py`中的旁边玩具:一个最小的运行 وكيل、流出、持续会议流程,实现了两次(一次Agnō形,一次Mastra形)

运行它:

```
python3 code/main.py
```

سوف نرى اثنين من الهياكل المختلفة ولكن آثار التكافؤ

## استخدمها
- **Agno** 需要速度和 FastAPI 形态 Python خلفية‬
- **Mastra** 拥有多个供应商和工作流原始的TypeScript后台──
- 两者都提供第一方可观性──两者都集成 兰富斯──

## 交付 it
`outputs/skill-runtime-picker.md`سيتم اختيارها حسب ميزانية التأخير والشكل التشغيلي، في Agno、Mastra、LangGraph أو SDK المزود.

## التدريب
1. 阅读Agno's docs──把 stdlib ReAct loop(درس 01) نقل إلى Agno── ماذا اختفى؟ ماذا احتفظت؟
2. 阅读Mastra's docs──把同一个循环 移植到Mastra── أداة كتابة ما الذي حدث في التغييرات (((زود مقابل لا شيء) ؟
3. مقياس: قياسك على كومة العاملة  مثالية التأخير  2μs من Agno على عبء العمل الخاص بك  مهم؟
4. الهجرة التصميمية: إذا كنت تعمل في Python CrewAI، تحرك إلى Agno 会破坏什么؟
5. 阅读 الماسترا `ee/`شروط الترخيص... ما هي القيود التي ستؤثر على مفتوح المصدر؟

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agno | “Fast Python agents” | 无状态、session-scoped 的 Agent Runtime |
| Mastra | “TypeScript agents on Vercel AI SDK” | Agents + Tools + Workflows + Model Router |
| Unified Model Router | “Multi-provider access” | 跨 94 个 providers、面向 3,300+ models 的单一 client |
| Composite storage | “Multiple backends” | Memory/workflows/observability 分别接入不同 store |
| Mastra Studio | “Local debugger” | 用于 introspecting Agents 的 localhost:4111 UI |
| Source-available | “Not OSS” | License 允许阅读 source，但限制 commercial use |

## 延伸阅读
- [Agno Agent Framework docs](https://www.agno.com/agent-framework)  performance goal  تدمير FastAPI
- [Mastra docs](https://mastra.ai/docs) البدائيات ‬معدلات الخادم ‬نموذج جهاز التوجيه
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) الرسم البياني الحكومي 替代方案
- [Comet Opik](https://www.comet.com/site/products/opik/) تكاملات ماستر 引用的可观性比较
