# MCP 模型输入: عينات 迁移与无状态 MRTR

> MCP 2026-07-28 规范弃用面向新设计的样本特性,并移动到服务器向客户端 发送反向请求的通道──若现有工作流仍需使用客户端模型,服务器会回来`input_required`نتيجة لذلك، يقوم العميل بإنتاج النموذج مرة أخرى في الطلب الأصلي.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources and prompts)
**Time:** ~75 minutes

## 學习目标

- 解释为什么 MCP 2026-07-28 弃用样本化,并为新构建的服务 选择直接集成模型 (直接模型集成) 的默认架构──
- 实现一套兼容工作流,通过多轮往返请求(Multi Round-Trip Requests, MRTR) تحمل `sampling/createMessage`.
- في كل طلب`_meta`إصدارات الاتفاقات والقدرات على المستخدمين
- عودتي`resultType: "input_required"`,并使用全新的 JSON-RPC id 重试原始方法──
- على`requestState`进行完整性保护(نزاهة محمية) ،并将其绑定到主体(主体) 、方法、参数及过期时间──
-  من خلال القدرة 校验、人工批准、响应验证和轮次上限، إجراء قيود صارمة على دورة مساعدة النموذج

## في تصميم النظام الأساسي قبل

形如 `summarize_repo`أداة عادة ما تحتاج إلى نوعين من العمل:

1. 确定性工作:列出文件、读取允许访问文件、校验路径以及组装内容──
2. 模型工作:挑选代表性文件并综合生成摘要──

الآن لديك نوعان من الاختيارات القانونية

### 新建 Server: مباشرة集成模型提供方

هذا هو الممارسة الراهنة الاختيار النموذجية التدريبية على الخادم على حدة إدارة الخدمة اختيار، إعداد الأهداف، استخدام الميزانية، إعادة التجربة استراتيجية، والنظر.`tools/call`نتيجة

عندما يكون الخادم هو خدمة استضافة أو عندما يكون أداء النموذج المتوقع أكثر أهمية من نموذج مضيف مستخدم، فاختر هذه الخطة.

### 现有 工作流: نقل إلى MRTR

في فترة الانتقال المرفوضة، لا يزال العينات موجودة.`sampling/createMessage`في المقابل، سيتم وضع الطلب في`InputRequiredResult`أعود إلى هنا

فقط عندما تستخدم النموذج والبروتوكولات من جانب العميل هي حاجة صلبة واضحة للمنتج، فقط يتم اختيار هذا الطريق المضمون.

## 无状态契约

تم نقل إطار الاتفاقية لعام 2026`initialize`交互握手`notifications/initialized`و`Mcp-Session-Id`: ماضى الحفاظ على المعلومات في اليدين، الآن مباشرة من كل طلب

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

الخادم سوف يكون في كل طلب إصدار اتفاقية تجربة.`-32602`△ لا يدعم الإصدار 字符串返回 `-32022`, و تحمل بيانات دقيقة ,`{"supported":["2026-07-28"],"requested":"<client version>"}` عدم وجود القدرة على أخذ العينات 则返回 `-32021`,并将 `data.requiredCapabilities`设为 `{"sampling":{}}`.

 بدون JSON-RPC `id`في الصفحة الاخرى من HTTP                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `202 Accepted`.

يجب أن يتم تنفيذ الخادم مع التأكد`supportedVersions`المهارات`ttlMs`和 `cacheScope``server/discover`方法, حتى يتمكن العميل من معرفة و حفظ الخادم من الاتفاقات قبل استخدام الوسيلة.`tools`كما يجب أن يطبق الخادم الإجبارية`tools/list`تأكدها`summarize_repo`描述符包含合法的 الموضوع 类型 `inputSchema`.`resultType: "complete"`الخادم و بيانات المستخدم و المعلومات العامة

كل اتفاق جديد ناجح يعود نتيجة تحتوي على جهاز تحديد التمييز:

- `resultType: "complete"`أظهرت أن العملية قد تمت
- `resultType: "input_required"`يعبر العميل عن الجهاز التابع لـ "موقع"
- يمكن تحديد النوع من النتائج الإضافية، على سبيل المثال في الصف الثالث عشر`"task"`.

## 单轮 MRTR 交互流程

لا يمكن للخادم استخدام العميل خلال عملية المعالجة للطلب.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "pick_files": {
        "method": "sampling/createMessage",
        "params": {
          "messages": [
            {
              "role": "user",
              "content": {
                "type": "text",
                "text": "Choose three representative files and return a JSON array."
              }
            }
          ],
          "systemPrompt": "Return only the requested value.",
          "modelPreferences": {
            "costPriority": 0.8,
            "intelligencePriority": 0.2
          },
          "maxTokens": 400
        }
      }
    },
    "requestState": "opaque-integrity-protected-value"
  }
}
```

العميل 验证 نفسه دعم العينات، تطبيقها الاختبار التأييد مع استراتيجية النموذج، ومحصول النموذج ردا.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "inputResponses": {
      "pick_files": {
        "role": "assistant",
        "content": {
          "type": "text",
          "text": "[\"README.md\", \"server.py\", \"docs/intro.md\"]"
        },
        "model": "host-model",
        "stopReason": "endTurn"
      }
    },
    "requestState": "opaque-integrity-protected-value",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}}
    }
  }
}
```

هذا التجربة الثانية ليست استمرارية للاجتماع غير المتفق. إنه طلب جديد بالكامل: إعادة التجربة الأساليب والعناصر، فقط إضافة الجولة السابقة.`inputResponses`,并原封不动地逐字节回显 `requestState`.

MRTR  فقط يسمح لي بالظهور `tools/call`.`prompts/get`和 `resources/read`中── الخادم 绝不能从无关方法中返回 `input_required`.

## إدارة الحالة

هذا الدرس يتطلب اثنين من النماذج:

1. `pick_files`返回一个 JSON 数组──
2. `summary`返回最终的摘要文字──

نظراً لأن كل مرة أخرى من التجارب تحمل فقط استجابة هذه الجولة، فإن الخادم بحاجة إلى المرحلة الحالية (مرحلة) وكذلك البيانات المتوسطة التي تمت عبر التجارب إلى المرحلة التالية.`requestState`في الوسط

من فضلكم تعتبروا هذه القيمة بيانات محتملة تحت سيطرة المهاجمين. يجب أن تكون الحالة مقيدة إلى:

- 经过鉴权的主体 ((المرجع المصرح به)) ، وليس إعلانات ذاتية`clientInfo`(إنه)
- الوسائل الاصلية المستخدمة
- المخرجات المعدنية
- 较短的过期时间؛
- والقيمة الوسطى للمرحلة السابقة والمرة التي تمت فيها التجربة.

في عدم الحاجة إلى الخصوصية يمكن استخدام HMAC. عندما لا يمكن العميل قراءة محتوى الحالة، يرجى استخدام الكشفية الموثقة.`-32602`.

العميل لا يستطيع تحديد أو تغيير`requestState`                                                                                                                                                                                                                                                              

## 模型偏好 فقط للمشورة

`costPriority`.`speedPriority`مع`intelligencePriority`يُعدّون إختيارات مستقلة عن بعضهم البعض. لا توجد توزيعات احتمالية، ولا تحتاج إلى 1.

إذا كنت لا تزال في الحفاظ على النسخة القديمة من عملية العينات، من فضلكم`includeContext`保持为 `"none"` النموذج الآخر على النص يزيد من خطر الإفصاح، و هو نفسه قد تم التخلي عنه.

## سلامة

بالنسبة لطلبات العينات المتضمنة، العميل هو الحدود الوحيدة

- عندما تتطلب الاستراتيجية الموافقة الاصطناعية، إلى المستخدم واضحة عرض الخادم هو في حال تطلب نموذج لتنفيذ ما العملية.
- حد MRTR 轮次上限──否则恶意服务可能构建无休的模型消费循环──
- قبل استخدام العينات على النحو الوارد، يجب إجراء اختبار صارم لها.
- الحد من عدد الحروف والرموز في كل جولة
- رفض طلب إدخال غير معلن في إمكانيات العميل الحالية
- 避免让模型输出决定授权鉴权逻辑──
- 记录发起的方法及输入请求钥匙,同时避免打入日志中的敏感的快速内容──

`clientInfo`和 `serverInfo`لا يمكن استخدامها على الإطلاق على أساس الحقوق في التعرف على البيانات.

```figure
t3-sampling-flip
```

## 手写实现

`code/main.py`لا تعتمد على أي مجموعة ثالثة، تمت إنجاز كاملة عملية ذهاب وراء وراء:

- `server/discover`عودتي`supportedVersions`, أداة الإعلان 支持,并返回缓存提示。
- `tools/list`返回具有对象输入方案的、确定性且可缓存的 `summarize_repo`描述符──
- `tools/call`校验每个请求的元数据──
- النتيجة الأولى تتضمن استخدام الملفات المختارة`sampling/createMessage`.
- نتيجة أول تجربة إعادة التجربة
- 受 HMAC 保护的`requestState`في مرحلة التنفيذ بين الطلبات الاستقلالية
- النتيجة النهائية`resultType: "complete"`.

模拟的主机 模型保证了示例的确定性──当连接到真实主机时,只需要更换`fake_host_model` حالة الجانب الخادم يجب أن يكون دائماً ثابتة وسهلة الاختبار

## استخدامات

في مخزن الجذور

```bash
cd phases/13-tools-and-protocols/11-mcp-sampling/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点:

- اكتشافات عودة مع`ttlMs`和 `cacheScope`‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬
- اكتشاف الأداة 返回排序相同的描述符,带有 `resultType`、خادم ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- إمكانات غياب مع نسخة غير مدعومة`-32021`مع`-32022`错误数据──
- 没有 id 的通知 不产生任何 JSON-RPC 响应──
- رجاءً أكتب`[1, 2, 3]`، يثبت كل MRTR 轮次均完全 مستقل
- النتائج النوعية`input_required`.
- النتيجة النهائية نوع`complete`,并包含 المستندات المختارة والمزيد من المعلومات النهائية.
- في التجربة الثانية 改 原始参数会导致 طلب-state 校验失败。

## 交付产物

`outputs/skill-sampling-loop-designer.md`现已升级为迁移规划器──它首先决定是否应废弃样本化 改用直接模型集成──如果必须保留兼容性, فإنه سوف يخلق MRTR 交互轮次、状态绑定、能力 门禁、预算控制、数据校验以及平稳退役方案──

## 课后练习

1. سوف يتم تحديد ردود الفعل لتحويلها إلى غير فعالة.`-32602`وليس نموذج إعتقاد أعمى
2. في التغيير بين التطبيق الأول والإعادة`audience`参数―― شرح لماذا حالة بعد التعبئة قادرة على منع عبر الطلبات من الاستخدام.
3. زيادة الجولة الثالثة من التواصل، مطالبة المضيف بإجراء مراجعة للاستعراضات.
4. 完全 نقل العينات: سوف يحول المضيف المماثل إلى الخادم نفسه.
5. إضافة اختبار متأخر: إدخال حالة قد تجاوزت الموعد النهائي 1 ثانية، التحقق من اختبار الفشل.

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Sampling | 已弃用特性，用于请求 client 端的模型执行文本补全 |
| MRTR | 多轮往返请求（Multi Round-Trip Requests），用于在请求中获取 client 输入的无状态重试模式 |
| `InputRequiredResult` | 带有 `resultType: "input_required"` 的结果对象 |
| `inputRequests` | Server 分配的映射表，包含内嵌的 elicitation、sampling 或 roots 请求 |
| `inputResponses` | Client 在当前轮次提交的响应，键名与 `inputRequests` 一一对应 |
| `requestState` | 不透明的 server 状态字符串，由 client 原样回显并由 server 校验完整性 |
| `resultType` | 现代 MCP 返回结果中必须包含的类型判别器 |
| 直接模型集成（Direct model integration） | 新建 server 需要模型推理时的官方推荐替代方案 |
| Capability 门禁（Capability gate） | 防止向未声明相应支持的 client 发送内嵌请求的安全规则 |
| 循环预算（Loop budget） | 本次操作允许的最大轮次、token 数、字节数、执行时长以及花费上限 |

## 旧版兼容性

المستخدم الثابت في إصدار 2025-11-25 قد يظل على اتصال حياً باستخدام الخادم القديم`sampling/createMessage`流程── يرجى إجراء هذا التصرف بعزل صارم في الإصدار المخصص المستخدم للتكييفات── لا يجب أن يكون هناك طريق للحديث كبنية أساسية لخادم 2026-07-28──

官方 SDK 可以将现代的 `input_required`处理程序转换为适应旧版对端的通信――这种片片

## 延伸阅读

- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP Sampling deprecation](https://modelcontextprotocol.io/seps/2577-deprecate-roots-sampling-and-logging)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
