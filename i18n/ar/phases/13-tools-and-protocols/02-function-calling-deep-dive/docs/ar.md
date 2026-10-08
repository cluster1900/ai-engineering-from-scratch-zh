# الوظيفة الاتصال 深入解析  OpenAI, انتروبيك, جيمين

> هذا المقدمين الحدود الثلاثة في عام 2024 تم الحصول على نفس حلقة الاتصال الأداة ، ثم في جميع الأماكن الأخرى تموز طريق التسجيل.`tools`和 `tool_calls`استخدام الأنثروبي`tool_use`和 `tool_result`كتلة: جيميني استخدام `functionDeclarations`وارتباط الهوية الفريدة. هذا الدراسة سوف تكون مختلفة، والسماح في مزود واحد على تسليم الكود في نقل إلى مزود آخر لن يتلف.

**Type:** Build
**Languages:** Python (stdlib, schema translators)
**Prerequisites:** Phase 13 · 01（the tool interface）
**Time:** ~75 分钟

## 學习目标
- يقولون أن OpenAI、Anthropic 和 Gemini وظيفة دعوة الحمل المفيد   三类形状 差异(إعلان、دعوة、نتيجة)
- سوف أضع إعلان أداة 翻译到三个 تنسيق مزود,并预测 صارمة وضع القيود 会在哪里不同──
- في كل مزود 中使用 `tool_choice`لضغط أو منع أو اختيار أدوات الاتصال تلقائيًا
- معرفة الحدود الصعبة لكل مزود (عدد الأدوات، عمق الخطة، طول الحجج) ، وكذلك الاختراقات في الحدود، وقائع الأخطاء التي يصدرها كل مزود.

## 问题
شكل طلب الدعوة إلى الوظيفة من خلال المقدم و غيرها.

**OpenAI Chat Completions / Responses API.**أنت传入 `tools: [{type: "function", function: {name, description, parameters, strict}}]` رد النموذج 包含 `choices[0].message.tool_calls: [{id, type: "function", function: {name, arguments}}]`، من بينهم`arguments`هو عليك تحليل سلسلة JSON.`strict: true`) من خلال تشفير القيود القيادة 强制方案遵守──

**Anthropic Messages API.**أنت传入 `tools: [{name, description, input_schema}]`◊ رد`content: [{type: "text"}, {type: "tool_use", id, name, input}]`عودوا`input`لقد تم تحليلها (((هو كائن، ليس سلسلة)`user`الرسالة، تتضمن`{type: "tool_result", tool_use_id, content}`الحجر

**Google Gemini API.**أنت传入 `tools: [{functionDeclarations: [{name, description, parameters}]}]`(مُضَمّن في`functionDeclarations`أسفل: رد`candidates[0].content.parts: [{functionCall: {name, args, id}}]`حتى، من بينهم`id`في Gemini 3 及以上 الإصدارات هي فريدة من نوعها، تستخدم في ارتباط المكالمات المتوازية.`{functionResponse: {name, id, response}}`.

نفس الحلقة. أسماء الميدان المختلفة. التجمعات المختلفة. تقاليد السلسلة المختلفة. آليات التواصل المختلفة.

本课构建一个翻译,将三种格式统一成一个法典工具宣言,并在边做路由──Phase 13 · 17 会把同一模式泛化成 LLM gateway──

## 概念
### الهيكل المشترك

كل مزود يحتاج إلى خمسة أشياء:

1. **Tool list.**اسم كل أداة وصف و مخطط إدخال
2. **Tool choice.**强制使用特定工具、禁止工具,或让模型决定──
3. **Call emission.**أداة تسمية و النتائج المهيكلة
4. **Call id.**سوف يستجيب إلى مكالمة صحيحة
5. **Result injection.**رسالة أو حظر، وسوف النتيجة  مقيدة مرة أخرى المكالمة

### 个个场比较形状不同

| Aspect | OpenAI | Anthropic | Gemini |
|--------|--------|-----------|--------|
| Declaration envelope | `{type: "function", function: {...}}` | `{name, description, input_schema}` | `{functionDeclarations: [{...}]}` |
| Schema field | `parameters` | `input_schema` | `parameters` |
| Response container | assistant message 上的 `tool_calls[]` | type 为 `tool_use` 的 `content[]` | type 为 `functionCall` 的 `parts[]` |
| Arguments type | stringified JSON | parsed object | parsed object |
| Id format | `call_...`（OpenAI 生成） | `toolu_...`（Anthropic） | UUID（Gemini 3+） |
| Result block | role `tool`, `tool_call_id` | 带 `tool_result`, `tool_use_id` 的 `user` | 带匹配 `id` 的 `functionResponse` |
| Force-a-tool | `tool_choice: {type: "function", function: {name}}` | `tool_choice: {type: "tool", name}` | `tool_config: {function_calling_config: {mode: "ANY"}}` |
| Forbid tools | `tool_choice: "none"` | `tool_choice: {type: "none"}` | `mode: "NONE"` |
| Strict schema | `strict: true` | schema-is-schema（始终 enforce） | request level 的 `responseSchema` |

### ستواجهين قيود حقيقية

- **OpenAI.**كل طلب أقصى 128 أداة ✅عمق الخطة 5♦سلسلة الحجج <= 8192 بايتس♦وضع صارم                  `$ref`لا يوجد تداخلات`oneOf`-أجل`anyOf`-أجل`allOf`كل ممتلكات مدينة`required`في الوسط
- **Anthropic.**كل طلب أقصى 64 أداة  عمق الخطة  في الواقع لا يوجد حد أعلى، ولكن الحد العملي هو 10‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- **Gemini.**كل طلب أقصى 64 وظيفة. أنواع النظام هي OpenAPI 3.0 فرعية.

### `tool_choice`السلوك

ثلاثة طرق الجميع يدعمها، فقط اسم مختلف

- **Auto.**النموذج أداة اختيار أو نص.
- **Required / Any.**النموذج يجب أن يكون على الأقل مع أداة واحدة
- **None.**النموذج لا يستخدم الأدوات

بالإضافة إلى ذلك، كل مزود لديه نمط فريد:

- **OpenAI.**按名 强制使用特定工具──
- **Anthropic.**按名 强制使用特定工具;`disable_parallel_tool_use`العلم 区分 واحد مقابل متعددة
- **Gemini.** `mode: "VALIDATED"`سوف يجعل كل رد يمر عبر مؤكد النموذج، بغض النظر عن النموذج النية ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

### المكالمات المتوازية

OpenAI `parallel_tool_calls: true`(默认) سوف تنشر في رسالة مساعد في العديد من المكالمات.`tool_call_id`على تدوين دخول:`disable_parallel_tool_use: false`(截至Claude 3.5 的默认值) تمكين متعددة جيميني 2 允许平行通话,但没有提供稳定的 ids;Gemini 3 增加 UUIDs,因此 الردود خارج النظام يمكن أن تكون مرتبطة بشكل واضح.

### التدفق

三者都支持 تدفق أداة الاتصال.

- **OpenAI.** `tool_calls[i].function.arguments`قطعات الدلتا ستزداد إلى الوصول`finish_reason: "tool_calls"`.
- **Anthropic.**أحداث البدء المحدد / البلوك-دلتا / البلوك-ستاپ`input_json_delta`قطع 携带 جزئيات الحجج
- **Gemini.** `streamFunctionCallArguments`(أزواج 3 新增)`functionCallId`من قطع، لذلك العديد من المكالمات المتوازية يمكن أن تتصل.

المرحلة 13 · 03 会深入讲 متوازية + إعادة التجميع المتدفق.

### الأخطاء وإصلاحها

أظهار أخطاء الحجة غير الصالحة مختلفة أيضا.

- **OpenAI (non-strict).**النموذج 返回 `arguments: "{bad json}"`, محاكاة JSON الخاصة بك  فشل, أنت إدخال رسالة خطأ و إعادة الاتصال
- **OpenAI (strict).**التحقق من الصحة يحدث خلال عملية فك التشفير. JSON غير صالحة لا يمكن أن تظهر ، ولكن يمكن أن تظهر `refusal`.
- **Anthropic.** `input`قد يحتوي على حقل غير متوقعة؛ المخطط هو نصيحة.
- **Gemini.**OpenAPI 3.0 غرابة: حقل الأشياء 上的 `enum`سيتم تجاهلها، تحتاج إلى تأكيد نفسك

### نمط الترجمة

تصريح الأداة القنوني في 你代码 تبدو مثل هذا ((شكل من طرفك اختيار):

```python
Tool(
    name="get_weather",
    description="Use when ...",
    input_schema={"type": "object", "properties": {...}, "required": [...]},
    strict=True,
)
```

ثلاثى الصفحات ستترجمها إلى ثلاثة أشكال مُقدمة.`code/main.py`الحلطة الوسطى هو فعل هذا، ثم وضع أداة مزيفة دعوة من خلال كل مزود من شكل استجابة القيام به ذهابًا وإيابا.

فريق الإنتاج سيضع هذا المترجم`AbstractToolset`(الذكاء الاصطناعي البيدانتي)`UniversalToolNode`(لنجراف) أو `BaseTool`(LlamaIndex) ――المرحلة 13 · 17 会交付一个门户,在三者任意一个前面暴露OpenAI-形状API──


```figure
function-call-args
```

## استخدمها
`code/main.py`定义一个法典 `Tool`ومدرجة المعلومات، وذلك مع ثلاثة مترجمين، لإنتاج OpenAI、Anthropic 和 Gemini إعلان JSON── ثم سوف يقوم بتحليل استجابة مزود يدوي لكل شكل 解析为同一个定性呼叫对象,展示语义在表层之下是相同的──运行它,并并排排差三种声明──

需要观察的点:

- ثلاثة كتلة إعلانات فقط في الغلاف و أسماء المجال
- ثلاثة كتلة الاستجابة الاختلافات في المكالمة الموضعية`tool_calls`.`content[]`الحجر`parts[]`الدخول)
- واحد`canonical_call()`وظيفة من جميع أشكال الاستجابة 中提取 `{id, name, args}`.

## 交付 it
本课产出 `outputs/skill-provider-portability-audit.md` إعطاء وجهة لتكامل الدعوة الوظيفية لمقدم ما، هذه المهارة سوف تولد مراجعة المحمولة: تعتمد على ما هي حدود المقدم، ما هي المجالات التي تحتاج إلى إعادة تسمية، فضلا عن النقل إلى مزود آخر ما يحدث عند الاختراق.

## التدريب
1. 运行 `code/main.py`, التحقق من ثلاثة إعلانات مزود JSONs كل تسلسل في نفس الطبقة السفلية `Tool`أداة القنوني، إضافة مبرمج إينوم،并确认 فقط مترجم جيمين

2. لكل مزود إضافة واحدة`ListToolsResponse`المتحقق، من النموذج في`list_tools`أو دعوة اكتشاف 后返回的内容中提取工具列表──OpenAI 原生没有这个项目;记录这个不对称性──

3.  تحقيق `tool_choice`تحويل:将 قنوني `ToolChoice(mode="force", tool_name="x")`映射到三种供应商形状──然后映射 `mode="any"`和 `mode="none"`◊ check本课的差表──

4. 选择三个提供者中一个,从头到尾阅读其函数调用指南──找到它方案规范中一个其他两个不支持的领域──候选项:OpenAI `strict`أنثروبيك`disable_parallel_tool_use`التجميل`function_calling_config.allowed_function_names`.

5. كتب متجه اختبار: دليل  خلافا للنظام المعلن دعوة أداة. سوف تعمل على كل مزود من الموافقة.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Function calling | "Tool use" | 用于 structured tool-call emission 的 provider-level API |
| Tool declaration | "Tool spec" | Name + description + JSON Schema input payload |
| `tool_choice` | "Force / forbid" | Auto / required / none / specific-name modes |
| Strict mode | "Schema enforcement" | OpenAI flag，用于约束 decoding 以匹配 schema |
| `tool_use` block | "Anthropic's call shape" | 带 id、name、input 的 inline content block |
| `functionCall` part | "Gemini's call shape" | 包含 name、args 和 id 的 `parts[]` entry |
| Arguments-as-string | "Stringified JSON" | OpenAI 将 args 作为 JSON string 返回，而不是 object |
| Parallel tool calls | "Fan-out in one turn" | 一个 assistant message 中的多个 tool calls |
| Refusal | "Model declines" | strict-mode-only 的 refusal block，而不是 call |
| OpenAPI 3.0 subset | "Gemini schema quirk" | Gemini 使用一种类似 JSON-Schema 的 dialect，存在细微差异 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) 包含 وضع صارم و الإشارة القنوني للدعوات المتوازية
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) `tool_use`和 `tool_result`النطقية الكلي
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) دعوات متوازية 、تعرفات فريدة 和 OpenAPI فرعية
- [Vertex AI — Function calling reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling) سطح التجارة في جيمين
- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) نظام وضع صارم 强制执行细节
