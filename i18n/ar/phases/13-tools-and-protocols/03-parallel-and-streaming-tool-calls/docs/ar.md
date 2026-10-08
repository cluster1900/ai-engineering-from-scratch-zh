# أدوات متوازية الاتصالات و أدوات التدفق

> إذا تم تنفيذ سلسلة ، فهي ثلاث مرات ذهابًا وإيابًا. بعد أن تم تنفيذها ، فإن إجمالي استهلاك الوقت ينخفض إلى أبطأ تدوين واحد.

**类型：**بناء
**语言：**Python(stdlib، حوض الخيوط + حزمة التدفق)
**前置要求：**المرحلة 13 · 02(العمل الذي يدعو للغوص العميق)
**时间：**حوالي 75 دقيقة

## 學习目标

- تفسير لماذا هناك`parallel_tool_calls: true`، و متى يجب أن يمنع استخدامها
- خلال الموازية المروحة 期间,将流动论点块 关联到正确的工具-调用 id──
- قبل أن يتم تحليلها مبكرًا ،`arguments`سلسلة 重组为完整 JSON。
- 运行一个三城市天气基准, عرض التسلسل مقابل التخفيف المتوازي

## 问题

没有 مواصلات متوازية 时,一位代理 回答 what is the weather in Bengaluru, Tokyo, and Zurich 会这样做:

```
user -> LLM
LLM -> call get_weather(Bengaluru)
host -> run executor, reply with result
LLM -> call get_weather(Tokyo)
host -> run executor, reply with result
LLM -> call get_weather(Zurich)
host -> run executor, reply with result
LLM -> final text answer
```

ثلاث مرات LLM 往返,每次還要付出执行器延迟──大约是理想壁表时间的4倍──

استخدام المكالمات المتوازية:

```
user -> LLM
LLM -> call get_weather(Bengaluru); call get_weather(Tokyo); call get_weather(Zurich)
host -> run all three executors concurrently, reply with three results
LLM -> final text answer
```

في OpenAI、Anthropic 和 Gemini 上的生产基准显示, بالنسبة لتحملات العمل المتحركة, يمكن تقليل ساعات الجدار 60٪ إلى 70٪.

代价是相关性复杂性── عندما يتم إنجاز ثلاثة تدوينات، يجب أن تكون نتائجك متطابقة `tool_call_id`، فلتسمح النموذج بتركيبها معا. عندما يعود النتيجة في شكل سلسلة، يجب عليك أولاً جمع بعض قطع الحجج إلى JSON كاملة، ثم إعادة تنفيذها.

## 概念

### 启用 متوازية

- **OpenAI。** `parallel_tool_calls: true`默认开启──设置为 `false`.إجبار على التسلسل
- **Anthropic。** من خلال `disable_parallel_tool_use: false`实现 متوازية  及以上默认开启)`true`-أجل
- **Gemini。**始终具备平行能力`tool_config.function_calling_config.mode = "AUTO"`让模型决定──

عندما الأدوات لديها ترتيب يعتمد`create_file`ثم`write_file`) 、 بعض المواد المستخدمة لتأثير المواد المستخدمة الأخرى، أو المحدد السعر ‬ لا يمكن تحمل التميز ‬، منع الموازاة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

### التواصل بين

كل نموذج يستخدم لديه واحد`id`كل نتيجة من المضيف يجب أن تحتوي على نفس الهوية.

- **OpenAI。**كل رسالة أداة-دور`tool_call_id`.
- **Anthropic。**كل واحد`tool_result`المكتبة العليا`tool_use_id`.
- **Gemini。**كل واحد`functionResponse`العليا`id`(الجبال 3 及以上;الجبال 2 按名匹配,这会在同名的平行呼叫时出错)

### 并发运行 مكالمات

المضيف 会在自己的线程、Coroutine 或远程工 上运行每个调用执行器──最简单的使用线程池;生产环境使用asyncio 配合 `asyncio.gather`أو التناغم المهيكلي.

عادة ما يكون هذا العمل، لأن النموذج فقط يهتم.`tool_call_id`ولكن إذا فقدت أو أعادت النتائج، فإنّ المخططات المقدمة ستجعل التجربة أكثر صعوبة.

### مكالمات أداة التدفق

عندما النموذج 以 سلسلة 形式输出时`arguments`سوف تصل إلى ثلاثة مكالمات متوازية سوف تتصل على كل شخص

按供应商的结构:

- **OpenAI。**كل قطعة هي`choices[0].delta.tool_calls[i].function.arguments`(حبل جزئي)`index`(قائمة الاتصال وسط الموقع)`id`أول مرة ظهر فيها وقرأها`finish_reason = "tool_calls"`时解析 JSON。
- **Anthropic。**أحداث التدفق هو `message_start`ثم كلّ بلوك واحد`content_block_start`, نوع`tool_use`(تحتوي على اسم يد يدخل)`content_block_delta`الأحداث 携带 `input_json_delta`قطع ..`content_block_stop`أغلق كلّ بلوك
- **Gemini。** `streamFunctionCallArguments`(التوأم 3 及以上)`functionCallId`"الجميل الثالث" قبل التدفق "كل مرة تعود مكالمة كاملة"

### جزئي JSON و parse-early 陷

في`arguments`完整之前不能解析──像 `{"city": "Beng`مثل هذا JSON جزئي غير فعال JSON، سوف يرمي خطأ.`finish_reason = "tool_calls"`أنثروبيكا`content_block_stop`أو حدث آخر في التيار التوأم فقط حتى ذلك الوقت حاول`json.loads` ممارسة أكثر قوة هي استخدام محاكاة JSON متزايدة، في النظام المكتمل عندما تنتج الأحداث؛ دليل البث المباشر OpenAI  توصية هذه الممارسة، لاستخدامها في عرض UX في الوقت الحقيقي التفكير مؤشر  حساب الوساطة ‬ كمختبر الكمال ‬مُثقلة ‬السلسلة المقتبسة أو الوساطة في المحتوى المنفذ ‬سوف تؤدي إلى إيجابيات خاطئة، ‬ما يمكن أن تكون مجرد هيرستية إزالة رسمية‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

### الإكمال خارج النظام

```
call_A: fast API, returns first
call_B: slow API, returns second
call_C: median API, returns third
```

رد المضيف  مازال يجب أن يردد:

```
[{role: "tool", tool_call_id: "call_A", content: ...},
 {role: "tool", tool_call_id: "call_B", content: ...},
 {role: "tool", tool_call_id: "call_C", content: ...}]
```

في OpenAI أو Anthropic 上، الإجابة في الصفحة الوسطى لا تؤثر على الصوابية.

### المرجعية: متتالية مقابل متوازية

`code/main.py`模拟三个执行器, latency 分别为 400、600 和 800 ms── 序列运行总共需要 1800 ms── 并行运行需要最大(400,600,800) = 800 ms──差异是常量,而不是比例,所以节省会随工具数 增长──

حقيقة العالم الاهتمام: المكالمات المتوازية 会给下游 APIs 增加压力──对率有限的服务做10路风扇-out 会失败──Phase 13 · 17 会覆盖 gateway-level backpressure;retry semantics 计划放在未来阶段──

### التدفق المروحة خارج من ساعة الحائط

إذا كان النموذج نفسه ينطلق على شكل سلسلة ، يمكنك تنفيذ حججات المكالمة مباشرة بعد التكمل ، بدلا من جميع المكالمات الأخرى التي يتم إتمامها. هذا هو نوع من التحسينات التي سجلتها OpenAI ، ولكن ليس جميع SDK تم الكشف عنها.


```figure
tp-parallel-fanout
```

## استخدمها

`code/main.py`هناك جزءان.`concurrent.futures.ThreadPoolExecutor`، ترتيب ومشيطة عمل ثلاث مكالمات مثلية للأرصاد الجوية، ومطبوعة على ساعة الجدار الوقت.`arguments`قطع،并用 `StreamAccumulator`按 id 重组── بدون ماجستير في العلوم، لا شبكة، فقط重组逻辑──

关注点:

- التوقيت المتسلسل يصل إلى 1.8 ثانية. التوقيت المتوازي في نفس التأخيرات المزيفة يصل إلى 0.8 ثانية.
- الاكمبيوتر من خلال تثبيت الهوية، و فقط في كل مكالمة من JSON 完整时解析,处理乱序到达的块──
- المفيد في بعض الحجج تُنهي 后立即启动، بدلاً من كل التيارات 结束.

## 交付 it

本课会产出 `outputs/skill-parallel-call-safety-check.md` إعطاء سجل أداة، هذه المهارة 会审计 أي أدوات يمكن أن تكون متوازية بشكل آمن، أي معتمدات التنظيم، أي معتمدات الضغط  أسفل أسعار التداول،并返回一个带有每工具 `parallel_safe`سجل تعديلات العلامات

## التدريب

1. 运行 `code/main.py`و تغيير التخفيفات المماثلة، و تأكيد النسبة المماثلة إلى التسلسل`max/sum`(حقيقة أن التخطيطات المشتركة تتطلب تخطيطات التسلسلات والتحديدات والتحويلات المشتركة والتحويلات المشتركة والتحويلات المشتركة والتحويلات المشتركة)

2. 扩展蓄積器,处理 通话 تم إلغاءه في منتصف التيار 情况:`cancelled`حدث. أي مزود تم تسجيل هذه الحالة؟`content_block_stop`语义和 OpenAI 的 `finish_reason: "length"`行为‬

3. استخدام`asyncio.gather`بدل مجموعة الخيوط── على كلتا اثنين做 مقياس── يجب أن ترى التزامن مع بعض النتائج، لأن تكلفة تغيير السياق أقل، ولكن الافتراض هو أن المنفذين يقومون بإجراء I/O الحقيقي──

4. 选择两个不应对对的工具 (على سبيل المثال)`create_file`ثم`write_file`إلى السجل إضافة واحدة`ordering_dependency`الرسم البياني،并 على أساس الرسم البياني على الموازاة المروحة-ماكنة البوابة.

5. 阅读OpenAI's متوازي الوظيفة-دعوة قسم 和 الأنثروپي `disable_parallel_tool_use`أدوات العالم الحقيقي للنواحي الموازية

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Parallel tool calls | “一个 turn 里的 fan-out” | Model 在单个 assistant message 中发出多个 tool calls |
| `parallel_tool_calls` | “OpenAI 的 flag” | 启用或禁用 multi-call emission |
| `disable_parallel_tool_use` | “Anthropic 的反向开关” | Opt-out flag；默认启用 parallel |
| Tool call id | “Correlation handle” | 每次调用的标识符，result message 必须原样回显 |
| Accumulator | “Stream buffer” | 用于 partial `arguments` chunks 的 per-id string buffer |
| Out-of-order completion | “最快的先返回” | Parallel calls 以不可预测的顺序完成；ids 是粘合剂 |
| Dependency graph | “Ordering constraints” | 某些 tools 的输出会进入其他 tools 的输入；不能 parallelize |
| Parse-early trap | “JSON.parse 炸了” | 尝试解析不完整的 `arguments` string |
| `streamFunctionCallArguments` | “Gemini 3 feature” | 带有每次调用 unique id 的 streamed argument chunks |
| Completion-order reply | “不要等全部完成” | 结果一到就回复，并按 id 标记 |

## 延伸阅读

- [OpenAI — Parallel function calling](https://platform.openai.com/docs/guides/function-calling#parallel-function-calling) 默认行为和选择退出旗
- [Anthropic — Tool use: implementing tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implementing-tool-use) `disable_parallel_tool_use`و نتيجة الإفراز
- [Google — Gemini function calling parallel section](https://ai.google.dev/gemini-api/docs/function-calling) من جيمين 3 الهوية المرتبطة الاتصالات المتوازية
- [OpenAI — Streaming responses with tools](https://platform.openai.com/docs/api-reference/responses-streaming) إعادة تجميع الحجج المقطوعة لتدفقات OpenAI
- [Anthropic — Streaming messages](https://docs.anthropic.com/en/api/messages-streaming) 带 `input_json_delta``content_block_delta`
