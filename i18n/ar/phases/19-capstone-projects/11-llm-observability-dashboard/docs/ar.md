# كابستون 11  ماجستير في العلوم 可观测性 مع Eval Dashboard

> لانغفوز  تحول إلى مفتوحة الأساس。 أرس فينيكس  أصدرت 2026 GenAI semconv 映射。 هليكون 和 Braintrust 都加码了按用户成本归因──Traceloop 的 OpenLLMetry 成为事实上的 SDK仪器化── تصميم الإنتاج هو استخدام ClickHouse 存储痕迹، باستخدام Postgres 存储元数据, باستخدام Next.js 做 UI,再加上一小支 eval、 jobs ((DeepEval RAGAS、LLM-judge) في أعمال العينات 上运行──构建一个自主托管 版本,至少从四类 SDK 家庭摄入,并演示在五分钟内捕获一个注入的回归──

**Type:** Capstone
**Languages:** TypeScript (UI), Python / TypeScript (ingest + evals), SQL (ClickHouse)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P11 · P13 · P17 · P18
**Time:** 25 小时

## 问题
بحلول عام 2026 ، كل عمل من قوات الإنتاج من AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

ستقوم ببناء لوحة تحكمية مضيفة ذاتية، فإنها تتناول على الأقل من أربع فئات من أجهزة SDK العائلية، وتستهدف آثار عينات 运行一小组 eval jobs,检测漂移并发出告警──衡门:给定一个故意注入的回归(一个开始产生 PII的提示),لوحة التحكمية 能在五分钟内捕获它并触发告警──

## 概念
إدخال استخدام HTTP OTLP ――SDK 生成 GenAI-semconv امتدادات:`gen_ai.system`.`gen_ai.request.model`.`gen_ai.usage.input_tokens`.`gen_ai.response.id`.`llm.prompts`.`llm.completions` الإمدادات 落入 ClickHouse القيام بتحليلات عمودية؛ البيانات المعدنية(المستخدمين ̇ جلسات ‬التطبيقات) 落入 Postgres‬

تقييمات 作为批量工作 在样本的痕迹上运行──DeepEval 评估 fidelity、toxicity 和 answer relevance──当 trace 携带检索背景 时,RAGAS 评估检索指标──自定义LLM-judges 运行域特定检查(PII 泄漏、政策反应)──Eval runs 会作为链接到父母的追踪的评估跨度 写回同一个 ClickHouse──

اكتشاف التدفق  observar随时间变化的 Embedding 空间分布(基于 prompt Embeddings 的 PSI أو KL divergence) وكذلك تقييم النتيجة 趋势。إشعارات 进入 Prometheus AlertManager, ثم إلى Slack / PagerDuty。UI استخدام Next.js 15 和 Recharts。

## المكونات
```
production apps:
  OpenAI SDK  +  Anthropic SDK  +  Google GenAI SDK
  LangChain + LlamaIndex + vLLM
       |
       v
  OpenTelemetry SDK with GenAI semconv
       |
       v  OTLP HTTP
  collector (ingest, sample, fan-out)
       |
       +-------------+-----------+
       v             v           v
   ClickHouse    Postgres    S3 archive
   (spans)       (metadata)  (raw events)
       |
       +---> eval jobs (DeepEval, RAGAS, LLM-judge)
       |     sampled or all-trace
       |     write eval spans back
       |
       +---> drift detector (PSI / KL on prompt embeddings)
       |
       +---> Prometheus metrics -> Alertmanager -> Slack / PagerDuty
       |
       v
   Next.js 15 dashboard (Recharts)
```

## 技术
- إحتمال: OpenTelemetry SDKs + GenAI الاتفاقيات الترجمية؛ نقل HTTP OTLP
- المجموعة: OpenTelemetry Collector، معالج عينة الذيل (((للاستخدام في التحكم في التكلفة)
- التخزين: ClickHouse 存 مدة، البيانات البيانية البديلة 存، S3 存 أرشيف الأحداث الخام
- Evals: DeepEval، RAGAS 0.2، Arize Phoenix تقييم حزمة، المخصصة ماجستير في القانون-قضاة
- التدفق: PSI / KL على التوابل المشتركة السريعة (محولات الجملة) أسبوعيا
- الإشعار: Prometheus Alertmanager -> Slack / PagerDuty
- واجهة المستخدم: Next.js 15 App Router + Recharts + أعمال الخادم
- 开箱即用支持的 SDKs: OpenAI، انتروبيك، جوجل جناي، لانغ تشين، لاما إيندكس، vLLM


```figure
ce-otel-drift
```

## بناءها
1. **Collector config.**تكوين OpenTelemetry Collector، يحتوي على متلقي HTTP OTLP، واحتفاظ 100٪ آثار الخطأ و 10٪ نموذج الذيل من آثار النجاح، فضلا عن استيرادها إلى ClickHouse و S3 المصدرين.

2. **ClickHouse schema.**`spans`عمودات 镜像 GenAI semconv:`gen_ai_system`.`gen_ai_request_model`.`input_tokens`.`output_tokens`.`latency_ms`.`prompt_hash`.`trace_id`.`parent_span_id`, إضافة مرة أخرى إلى كيس JSON لتحملات طويلة المفيدة.

3. **SDK coverage test.**استخدم كل SDK ((OpenAI、Anthropic、Google、LangChain、LlamaIndex、vLLM) و OpenLLMetry آٹو-دائرة 编写一个小型客户端应用──验证每个 SDK 都能生成正规 GenAI spans,并落入 ClickHouse──

4. **Eval jobs.**عمل مخطط 读取最近 15 分钟的样本痕迹,并运行DeepEval الولاء、سمية 和 答案相关性──输出是链接到父母的追踪的评估跨度──

5. **Custom LLM-judge.**قاضي تسرب PII: اعطى رد فعل واحد, دعوة حارس LLM لتقييم احتمال تسرب PII.

6. **Drift detection.**العمل الأسبوعي 计算本周 集结即时嵌入与过去 4 周基线 之间的 PSI──如果 PSI 超过门,则告警──

7. **Dashboard.**استخدام Next.js 15,包含页面:概述(مدة/ثانية、تكلفة/ المستخدم、خفضة المدة p95) ✓ تتبع ✓ البحث + شلال) ✓ تقييمات ✓ اتجاه الوفاء ✓ سمية ✓ التدفق ✓ PSI على مر الزمن ✓ تحذيرات‬

8. **Alerting chain.**مصدر Prometheus 读取 eval score aggregates 和 latency percentiles;Alertmanager سوف تحذيرات 路由到Slack, سوف تنتهك النتائج الحرجة 路由到PagerDuty。

9. **Regression probe.**دخول خطأ: يتم تقييمها من قبل الروبوتات ، هناك احتمالات 1٪ من البدء في الإفشاء من SSNs المزيفة.

## استخدمها
```
$ curl -X POST https://my-otel-collector/v1/traces -d @trace.json
[collector]  accepted 1 trace, 3 spans
[clickhouse] inserted 3 spans (app=chat, user=u_42)
[eval]       DeepEval faithfulness 0.82, toxicity 0.03
[drift]      weekly PSI 0.08 (below 0.2 threshold)
[ui]         live at https://obs.example.com
```

## 交付 it
`outputs/skill-llm-observability.md`يُعطى طلب لدرجة العلوم، ويمكن لوحة المعلومات أن تتبعه، وتقوم بتقييمات، وتصدر إشعارات، وتظهر في Next.js تفرقة التكلفة/المستخدم.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Trace-schema coverage | 生成 canonical GenAI spans 的 SDK families 数量（目标：6+） |
| 20 | Eval correctness | DeepEval / RAGAS scores 对比 hand-labeled set |
| 20 | Dashboard UX | 注入 regression 的 MTTR（目标低于 5 分钟） |
| 20 | Cost / scale | 持续以 1k spans/sec ingest 且无 backlog |
| 15 | Alerting + drift detection | Prometheus/Alertmanager chain 端到端演练 |
| **100** | | |

## التدريب
1. إطار حشرة الخشب إضافة أدوات مخصصة`gen_ai.*`سمات 落入 ClickHouse。

2. في نفس المجموعة من البصمات 上把 DeepEval 换成 phoenix evaluators──测量两个 محركات تقييم 之间的分数漂移──

3. كشاف التحرك المضطرب: حسب تطبيق الهوية وليس ككل المحطة حساب PSI‬

4. 添加一个"أثر المستخدم" 页面:تكلفة لكل مستخدم و معدل الفشل لكل مستخدم,并带有闪林──

5. إنشاء سياسة أخذ عينات ذيل: الحفاظ على 100٪ من السموم > 0.5 من آثار، وإعادة إصدار 10% من العينات الطبقة الطبقة

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GenAI semconv | "OTel LLM attributes" | 2025 OpenTelemetry spec，用于 LLM span attributes（system、model、tokens） |
| Tail sampling | "Post-trace sample" | Collector 在 trace 完成后决定保留还是丢弃（可以查看 errors） |
| PSI | "Population stability index" | 比较两个分布的 drift metric；> 0.2 通常表示有意义的 drift |
| LLM-judge | "Eval as model" | 一个 LLM 按 rubric（faithfulness、toxicity、PII）为另一个 LLM 的 output 打分 |
| Tail-sampling policy | "Keep-rule" | 决定哪些 traces 持久化、哪些丢弃的规则；errored + sample-rate |
| Eval span | "Linked eval trace" | 携带 eval score、并链接到原始 LLM call span 的 child span |
| Cost per user | "Unit economics" | 在一个窗口内归因到某个 user_id 的美元成本；关键 product metric |

## 延伸阅读
- [Langfuse](https://github.com/langfuse/langfuse) 参考 مفتوحة النواة قابلية للملاحظة 平台
- [Arize Phoenix](https://github.com/Arize-ai/phoenix)  ذو دعم قوى التدفق
- [OpenLLMetry (Traceloop)](https://github.com/traceloop/openllmetry) عائلة SDK ذاتية الاستعمال
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) مخططات تناول
- [Helicone](https://www.helicone.ai) 另一个 قابل للملاحظة المضيفة
- [Braintrust](https://www.braintrust.dev) 另一个 eval-first منصة
- [ClickHouse documentation](https://clickhouse.com/docs) مخزن المدة العمودية
- [DeepEval](https://github.com/confident-ai/deepeval) مكتبة المقيّمين
