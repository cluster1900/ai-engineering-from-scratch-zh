# العميل 可观测性: لانغفوز، فينيكس، أوبيك

> ثلاث وكلاء مفتوحة المصدر 可观测性平台主导了 2026 年──Langfuse (MIT)  كل شهر 6M+ تثبيتات، تتبع + إدارة السرعة + تقييمات + إعادة عرض جلسات──Arize Phoenix (Elastic 2.0)  عميقة دخول وكيل 专用 evals、RAG 相关性、OpenInference الآلات الذاتية──Comet Opik (Apache 2.0)  تحريك السرعة 优化、 محافظات、LLM-قاضي 幻觉检测──

**类型：**學习
**语言：**Python (stdlib)
**前置要求：**المرحلة 14 · 23 (OTel GenAI)
**时间：**45 دقيقة

## 學习目标

- ثلاثة من أفضل منصات العملاء المفتوحة المصدر ومراخصها
- 区分每个平台最擅长的方面:Langfuse (مغامات سريعة + جلسات)
- ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬
- 实现一个带有LLM-قاضي 评估的 stdlib

## 问题

أعطت لك النظام. لازلت بحاجة إلى منصة لتناول الإنتشارات، وتقييم التشغيل، وتخزين الإصدارات السريعة، وتعرض للعودات.

## مفهوم الأساسي

### لاندفوز (MIT)

- كل شهر يتم تثبيت 6M+ SDK، 19k+ نجوم GitHub.
- 功能:tracing、带 versioning + management prompt of playground、评估(LLM-as-judge、user反、自定义)、إعادة الإجراءات الجلسة‬
- 2025 年 6 月:原先的商业模块(LLM-as-a-judge、注释队列、快速实验、Playground) 在 MIT 下开源――
- 最擅长:带紧密快速管理循环 的端到端可观测性

### أريز فينيكس (مرخصة مرنة 2.0)

- أكثر عمقا العميل  خصيصا تقييم:ترايس تشكيل اكتشاف الانحرافات التواصل في الاستعراض من RAG‬
- أدوات ذاتية مفتوحة الإستعراض
- إصدار أريز أكس المستخدم في الإنتاج
- 没有快速版本  定位是与更广泛平台配合使用的漂移/行为-regression 工具──
- 最擅长:RAG 相关性、التحرك السلوكي、اكتشاف الفجوة‬

### المذنب (أوبيك) (أباتشي 2.0)

- 通過 تجربات A/B 实现自动化快速 优化.
- الحراسة (إصدار إحصائيات المعلومات، القيود الموضوعية)
- القاضي في القانون
- من المذنب  قياسات نفسها مقياس: أوبيك سجلات + تقييمات استخدام 23.44s، بينما لانغفوز هو 327.15s  حوالي 14x 差距)  سوف البائع مقياسات 视为方向性参考──
- 最擅长: حلقة التحسين 自動化 التجربة  إنفاذ الحواجز

### إحصائيات الصناعة

وفقاً لـ Maxim ((2026 عام تحليل ميداني):89% من المنظمات قد قامت بتنفيذ وكيل 可观测性؛ والمسألة الجودة هي العقبة الرئيسية في الإنتاج ((32% من المشاركين يذكرونها)

### كيف تختار

| 需求 | 选择 |
|------|------|
| 带 prompt management 的一体化方案 | Langfuse |
| 深度 RAG 评估 + drift | Phoenix |
| 自动化 optimization + guardrails | Opik |
| 开放 license，不要 ELv2 | Langfuse (MIT) 或 Opik (Apache 2.0) |
| Datadog / New Relic 集成 | 任意 — 它们都导出 OTel |

### هذا النمط سهل الخروج من المكان

- **没有 eval strategy。**لا يوجد تعقب للاستجواب فقط التقطيع الغالي الثمن
- **没有 grounding 的自建 LLM-judge。**نمط نقدي ((درس 05)适用  القضاة 需要外部工具进行事实验证。
- **Prompt versions 没有关联到 traces。**عندما يظهر التراجع، لا يمكنك تقسيمها إلى ما يسبب السؤال.


```figure
wb-trace-ingest
```

## بناءها

`code/main.py`实现 a stdlib trace collector + LLM-Judge evaluator:

- إبتعدى مجموعة من النوعيات
- 按 session 分组,标记失败 runs ((رحلات الحراسة、低置信度 evals)
- قاضي ماجستير في العلوم، وفقا لمرجع الردود على العملاء 评分──
- 类似仪表板的摘要:عدد الفشل أسباب الفشل العليا توجه النتيجة التقليدية‬

运行:

```
python3 code/main.py
```

输出: نقاط تقييم كل جلسة و تصنيف الفشل، مع Langfuse/Phoenix/Opik 会 عرض محتويات توافق

## استخدمها

- **Langfuse**المضيفة الذاتية أو السحابة؛ من خلال OTel أو SDK الخاصة بهم 接入
- **Arize Phoenix**إضافة إلى ذلك، فإنّه لا يُمكن أن يُستخدم في أيّة من الأدوات.
- **Comet Opik**المضيفة الذاتية أو السحابة؛ حلقة تحسين التلقائيات
- **Datadog LLM Observability**适合已运行 Datadog 的混合 ops+ML 团队。

## 交付 it

`outputs/skill-obs-platform-wiring.md`选择一个平台,并将追踪 + evals + prompt versions 接入现有代理──

## التدريب

1. ستقوم بتسجيل أثرات أسبوع من OTel إلى سحابة Langfuse
2. لقطاعك كتابة عنوان محكم ماجستير في العلوم (الجامعة) (( facts correctness、语气、范围遵循)
3. مقارنة إصدارات Langfuse على الفور مع مجموعة أثر Phoenix... أيّ من هذه الأسلوبات يمكنه أن يخبرك بسرعة أكثر عن ما حدث؟
4. قراءة أوراق حراسة أوبيك...
5. في جسمك على مقياس هذه المنصات ثلاثة.

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tracing | “Spans collector” | Ingest OTel / SDK spans；按 session 建索引 |
| Prompt management | “Prompt CMS” | 关联到 traces 的 versioned prompts |
| LLM-as-judge | “Automated eval” | 单独的 LLM 按 rubric 对 Agent output 评分 |
| Session replay | “Trace playback” | 逐步回放过去的 runs 以便 debugging |
| RAG relevancy | “Retrieval quality” | retrieved context 是否匹配 query |
| Trace clustering | “Behavioral grouping” | 对相似 runs 聚类，用于 drift detection |
| Guardrail enforcement | “Policy at log time” | 对 logged content 做 PII/toxicity/scope checks |

## 延伸阅读

- [Langfuse docs](https://langfuse.com/) تتبع توقعات تعليقات
- [Arize Phoenix docs](https://docs.arize.com/phoenix) الاستعمال الذاتي
- [Comet Opik](https://www.comet.com/site/products/opik/) التحسين + الحراسة
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) ثلاث منصات مدونة استهلاك
