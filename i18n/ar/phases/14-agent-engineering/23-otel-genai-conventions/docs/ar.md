# OpenTelemetry GenAI 语义约定

> OpenTelemetry's GenAI SIG (((2024 سنة 4 أشهر) حددت النظام المعياري للسيارة التلفزيونية للعميل. أسماء المجال، وصفات ومبادئ استيراد المحتوى تحدث بين البائعين، وبالتالي فإن آثار العميل تعبر عن نفس المعنى في Datadog、Grafana、Jaeger 和 Honeycomb.

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 24 (Observability Platforms)
**Time:** ~60 分钟

## 學习目标
- وتفصيل فئات المجموعة: النموذج/العميل
- 区分 `invoke_agent`العميل ومدى الإطار الداخلي، وكذلك المشهد المناسب لهم.
- 列出顶层 صفات GenAI:اسم المزود طلب النموذج DATA-source ID‬
- تفسير عقد استيعاب المحتوى: الاختيار`OTEL_SEMCONV_STABILITY_OPT_IN`、توصية مرجعية خارجية‬

## 问题
كل مبيع يبدء أسماء المجال الخاص به. فريق العمليات في النهاية يجب على كل إطار بناء أجهزة التحكم بشكل منفصل.

## 概念
### فئات المجال

1. **Model / client spans.**تغطي المكالمات الجامعية الأصلية.
2. **Agent spans.** `create_agent`(مُبنيّة) و`invoke_agent`(مُساعد في التنفيذ)
3. **Tool spans.**كل مرة استدعاء الأداة واحد؛ من خلال العلاقة الوالد-الطفل                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

### اسم العميل span

- اسم الإسبانية: إذا已命名,则为 `invoke_agent {gen_ai.agent.name}`؛ الانسحاب`invoke_agent`.
- نوع من النوع:
  - **CLIENT** تستخدم خدمات العملاء عن بعد ((OpenAI Assistants API、Bedrock Agents) ‬
  - **INTERNAL** باستخدام إطاريات وكيل في العملية ((LangChain、CrewAI、Local ReAct) 

### الصفات الرئيسية

- `gen_ai.provider.name` `anthropic`.`openai`.`aws.bedrock`.`google.vertex`.
- `gen_ai.request.model`هوية النموذج
- `gen_ai.response.model` 解析后的模型(可能因路由而不同于请求)。
- `gen_ai.agent.name` معرف الوكيل
- `gen_ai.operation.name` `chat`.`completion`.`invoke_agent`.`tool_call`.
- `gen_ai.data_source.id`استفسار عن أيّ مؤسسة أو متجر

الإنسانية  Azure AI إيجابية  AWS Bedrock  OpenAI كلها محددة في الاتفاقيات التقنية‬

### التقاط المحتوى

默认规则:المعدات 默认 لا يجب أن تتمكن من الاعتراض على المدخلات/المخرجات──الاعتراض 通过以下方式选择:

- `gen_ai.system_instructions`
- `gen_ai.input.messages`
- `gen_ai.output.messages`

推的生产模式:将内容存储在外部(S3、你的日志存储),在跨度上记录引用(شخصيات المؤشر، وليس النص) .

### الاستقرار

截至 2026 年 3 月، معظم الاتفاقيات 仍然是实验性──使用以下方式选择到稳定预览:

```
OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental
```

Datadog v1.37+ 会将 GenAI صفات 原生映射到其LLM ملاحظة النظام البيانات.

### هذا النمط سهل الخروج من المكان

- **在 spans 中捕获完整 prompts。**معلومات العملاء ستدخل العمليات يمكن قراءتها
- **没有 `gen_ai.provider.name`。**الإسمة 缺失时، لوحات التحكم متعددة المزودين 会失效。
- **没有 parent links 的 spans。**سوف تظهر أدوات منفصلة.
- **没有设置 stability opt-in。**بعد التطوير، قد يتم إعادة تسمية صفاتك


```figure
ae-genai-span-tree
```

## بناءها
`code/main.py`实现 a متوافق من اتفاقيات GenAI stdlib span emitter:

- 带 GenAI رسم سمة `Span`.
- 带 `start_span`السياقات المرتبطة`Tracer`.
- وكيل من المخططين يخرج`create_agent`.`invoke_agent`(داخل) ‧الفترات المتاحة للدراسة ‧التي تستخدم في دعوات الجامعة`chat`المدى
- وضع التقاط المحتوى، سيقوم بتخزين الطلبات خارجًا، ويمتد على تسجيل الهويات.

运行它:

```
python3 code/main.py
```

输出: واحد يتضمن كل الميزات اللازمة لـ GenAI ، فضلا عن "متجر خارجي" يظهر إشارات محتوى الاختيار.

## استخدمها
- **Datadog LLM Observability**(v1.37+) صفات المخططات الأصلية
- **Langfuse / Phoenix / Opik**(درس 24)  آلية الصلاحية 生态
- **Jaeger / Honeycomb / Grafana Tempo** آثار OTel خام؛ من صفات GenAI 构建仪表板──
- **Self-hosted**استخدام معالج GenAI 运行 OTel Collector

## 交付 it
`outputs/skill-otel-genai.md`سوف تتجاوز OTel GenAI 接入现有代理,并带有 المحتوى الاحتفاظ الافتراضية و التخزين الإشارة الخارجية

## التدريب
1. استخدام `invoke_agent`(داخل) + لكل أداة يمتد أداة الخاص بك دروس 01 ردة فعل حلقة── ارسال إلى مثال جيجر──
2. في وضع "المراجع فقط" 中添加内容捕捉:提示 写入 SQLite,span attributes 只携带行 IDs──
3. 阅读 `gen_ai.data_source.id`ستقوم بتوصيلها إلى دروسك التاسعة
4.  إعداد `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`,并验证 خصائصك لن يتم جمعها
5.  بناء لوحة تحكم: فقط من صفات GenAI انظر "أي أخطاء في الأدوات مع أي نماذج "‬

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GenAI SIG | "OpenTelemetry GenAI group" | 定义 schema 的 OTel working group |
| invoke_agent | "Agent span" | 表示一次 agent run 的 span name |
| CLIENT span | "Remote call" | 调用 remote agent service 的 span |
| INTERNAL span | "In-process" | in-process agent run 的 span |
| gen_ai.provider.name | "Provider" | anthropic / openai / aws.bedrock / google.vertex |
| gen_ai.data_source.id | "RAG source" | retrieval 命中了哪个 corpus/store |
| Content capture | "Prompt logging" | 对 messages 的 opt-in capture；prod 中存储在外部 |
| Stability opt-in | "Preview mode" | 用于固定 experimental conventions 的 env var |

## 延伸阅读
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 规范
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 默认提供 تمديدات جناي
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) إطارات OTel
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) إطار تعقب W3C 传播
