# OpenTelemetry GenAI  端到端 تتبع أداة المكالمات

> واحد الوكيل 调用五个工具、三个 MCP服务器和两个 فرعية وكيل──你需要一个贯穿所有环节的痕迹──OpenTelemetry GenAI 语义公约(v1.37 及以上版本中的稳定属性) هو معيار عام 2026 ،并由 Datadog、Langfuse、Arize Phoenix、OpenLLMetry 和 AgentOps 原生支持──本课会列必需属性,出讲跨度层次️agent → LLM → tool),并提供一个stdlib emitter,你可以将它连接到任何 OTel صادرات️

**Type:** Build
**Languages:** Python (stdlib, OTel span emitter)
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## 學习目标
- وتفصيل فترة LLM وفترة أداة تنفيذ المطلوب من صفات OTel GenAI
- 构建覆盖 وكيل حلقة LLM دعوة 工具 دعوة 和 MCP خريطة إرسال الهيئرية التتبعية‬
- قرر أن يتم القبض على أي محتوى (التخيار) ووضعها على غرار التحرير
- في حالة عدم إعادة كتابة رمز الأداة، سوف تمتد 发送到本地收藏家(Jaeger、Langfuse) 

## 问题
في عام 2026، حدث إصلاحات: مستخدم تقرير عميلتي أحياناً يستغرق 30 ثانية فقط للرد على ذلك. في وقت آخر فقط 3 ثانية. لا يوجد آثار.

لا يوجد تعقب من نهايتها، لا يمكنك تحديد المشكلة.

هذه الاتفاقيات في 2025-2026 عاما من قبل مجموعة الاتفاقيات التلفزيونية التلفزيونية OpenTelemetry 定型── فهم حددوا أسماء الصفات المستقرة، وبالتالي Datadog、Langfuse、Phoenix、OpenLLMetry 和 AgentOps 都能解析 the same spans──只需要仪器一次;即可发送到任意后端──

## 概念
### تسلسل تسلسل

```
agent.invoke_agent  (top, INTERNAL span)
 ├── llm.chat       (CLIENT span)
 ├── tool.execute   (INTERNAL)
 │    └── mcp.call  (CLIENT span)
 ├── llm.chat       (CLIENT span)
 └── subagent.invoke (INTERNAL)
```

整个流程嵌套在同一个追踪ID 下。Span ids 连接父母孩子关系。

### الميزات المطلوبة

وفقاً لـ 2025-2026

- `gen_ai.operation.name` `"chat"`.`"text_completion"`.`"embeddings"`.`"execute_tool"`.`"invoke_agent"`.
- `gen_ai.provider.name` `"openai"`.`"anthropic"`.`"google"`.`"azure_openai"`.
- `gen_ai.request.model` طلبات سلسلة نموذجية`"gpt-4o-2024-08-06"`(‬)
- `gen_ai.response.model` 实际提供服务的模型──
- `gen_ai.usage.input_tokens`- لا ، لا`gen_ai.usage.output_tokens`.
- `gen_ai.response.id` باستخدام معرف استجابة المزود من关联

 بالنسبة لفترات الأدوات:

- `gen_ai.tool.name` معرف الأداة
- `gen_ai.tool.call.id` 具体呼叫 id──
- `gen_ai.tool.description` وصف الأداة 可选)

对于 وكيل المدة:

- `gen_ai.agent.name`- لا ، لا`gen_ai.agent.id`- لا ، لا`gen_ai.agent.description`.

### أنواع السباق

- `SpanKind.CLIENT`استخدام المزودين بـ (LLM ✓ خادم MCP)
- `SpanKind.INTERNAL`باستخدام العميل خطوات الحلقة الخاصة به و تنفيذ الأداة

### التقاط المحتوى المختار

في حالة افتراضية، يمتد المدة  تحمل المعايير والتوقيت، وليس الإرشادات أو الإكمالات  الحملات المفيدة الكبيرة 和 PII 默认关闭──设置 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`ووضع المحتوى المحدد في البيانات المحتملة.

### الأحداث على المدى

يمكن أن تكون أحداث مستوى الرمز على أنها أحداث فترة 添加:

- `gen_ai.content.prompt`رسائل دخول
- `gen_ai.content.completion`رسائل إخراجية
- `gen_ai.content.tool_call` 记录下来工具呼唤──

الأحداث في فترة من الزمن في ترتيب الوقت، وسهلة للاستعادة التفصيلية.

### المصدرون

تمدد OTel يمكن أن يتم إصدارها إلى:

- **Jaeger / Tempo.**أوس، على الموقع
- **Langfuse.**面向 LLM قابل للملاحظة؛可视化 استخدام الرمز
- **Arize Phoenix.**التسجيلات + التتبع
- **Datadog.**商业产品;原生解析 `gen_ai.*`الصفات ..
- **Honeycomb.**المتحركات العمودية؛便于查询。

它们都使用OTLP,也就是电缆格式──你的代码无需关心──

### التنشر عبر MCP

عندما يقوم عميل MCP 调用 خادم 时,把 W3C traceparent header 注入请求──Streamable HTTP 支持标准头──Stdio 不原生携带HTTP头;该规范的2026路线图 讨论在 JSON-RPC通话上添加 `_meta.traceparent`字段。

قبل أن يتم نشر: يدخل في كل طلب`_meta`中包含 traceparent──Server 记录 trace id──

### المقاييس

بالإضافة إلى المدة، قام "جن إي سيمكون" بتعريف المقاييس:

- `gen_ai.client.token.usage` رسم تاريخي‬
- `gen_ai.client.operation.duration` رسم تاريخي‬
- `gen_ai.tool.execution.duration` رسم تاريخي‬

سيتم استخدام هذه المفاتيح بدون الحاجة إلى تفاصيل كل مكالمة

### طبقة AgentOps

AgentOps (تم تأسيسها في عام 2024)) متخصصة في قابلية مشاهدة GenAI. أنها تغطي الإطارات المشهورة.


```figure
t3-span-waterfall
```

## استخدمها
`code/main.py`سوف نستخدم أدوات تشكيلة OTel  ارسال إلى stdout (باستخدام شكل مشابه ل OTLP-JSON) ، لتنفيذ LLM    إرسال أدوات ، وإجراء وكيل MCP ذهابًا وإيابًا  بدون مصدر حقيقي 本课专注于跨度形和属性集──把输出粘贴到 OTLP- متوافق معالم ، أو مباشرة قراءتها──

需要关注的点:

- 所有 spans 共享同一个 痕迹 id──
- الروابط بين الوالدين والأطفال       `parentSpanId`编码――
- ضرورية`gen_ai.*`الصفات 已填充──
- التقاط المحتوى 默认关闭؛ واحدة من المشهد سوف تمر عبر البحث 打开它──

## 交付 it
本课会产出 `outputs/skill-otel-genai-instrumentation.md` إعطاء قاعدة رمزية للعميل، هذه المهارة سوف تولد خطة أدوات:

## التدريب
1. 运行 `code/main.py` الإحصائيات تتجاوز عدد، ومعرفه ما هو العميل، ما هو الداخلي.

2. 打开 ضبط المحتوى `gen_ai.content.prompt`和 `gen_ai.content.completion`الأحداث. لاحظ تأثير هذه على إصدارات الدول.

3. 添加 أداة- تنفيذ المقاييس `gen_ai.tool.execution.duration`،并按每次打电话将其作为图案样本 发送──

4. لنقل التتبع من وكيل الأم إلى طلب MCP`_meta.traceparent`字段──验证 سيرفر MCP سوف يرى نفس الهوية التتبعية──

5. 阅读 OTel GenAI semconv spec。 找出一个 semconv 中列出但本课代码没有发送的属性── 添加它──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OTel | "OpenTelemetry" | 用于 traces、metrics、logs 的开放标准 |
| GenAI semconv | "GenAI semantic conventions" | LLM / tool / agent spans 的稳定 attribute names |
| `gen_ai.*` | "The attribute namespace" | 所有 GenAI attributes 都共享此前缀 |
| Span | "Timed operation" | 一个具有 start、end 和 attributes 的 work unit |
| Trace | "Cross-span ancestry" | 共享同一个 trace id 的 spans 树 |
| SpanKind | "CLIENT / SERVER / INTERNAL" | 关于 span direction 的提示 |
| OTLP | "OpenTelemetry Line Protocol" | exporters 使用的 wire format |
| Opt-in content | "Prompt / completion capture" | 默认关闭；通过 env var 启用 |
| traceparent | "W3C header" | 跨 services 传播 trace context |
| Exporter | "Backend-specific shipper" | 将 spans 发送到 Jaeger / Datadog / 等的组件 |

## 延伸阅读
- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) تمتد المقاييس والحوادث من خلال مؤتمرات جنرال إيرلندي
- [OpenTelemetry — GenAI spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) LLM و إدارة أدوات المدى صفة 列表
- [OpenTelemetry — GenAI agent spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) مستوى الوكيل `invoke_agent`المدة
- [open-telemetry/semantic-conventions — GenAI spans](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/gen-ai-spans.md) مصدر سلطة GitHub 托管
- [Datadog — LLM OTel semantic convention](https://www.datadoghq.com/blog/llm-otel-semantic-convention/) تكامل الإنتاج 讲解
