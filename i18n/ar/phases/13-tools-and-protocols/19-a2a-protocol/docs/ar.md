# A2A  عميل إلى عميل 协议

> MCP هو وكيل إلى أداة (A2A) A2A (Agent2Agent) هو وكيل إلى وكيل (Agent2Agent) A2A (A2A) هو وكيل إلى وكيل (Agent2Agent) A2A هو اتفاق مفتوح لتمكين الكائنات الذكية غير الشفافة التي يتم بناؤها على أساس إطار مختلف من أن تكون متعاونة بشكل متبادل. أصدرت جوجل هذا الاتفاق في أبريل 2025، في نفس العام في يونيو/أيلول تمنح مؤسسة لينكس، وفي أبريل 2026 حققت v1.0, وتضم AWS، وسكو، مايكروسوفت، سيلزفورس، SAP و خدمةNow في 150+ من أشكال الدعم.

**Type:** Build
**Languages:** Python (stdlib, Agent Card + Task harness)
**Prerequisites:** Phase 13 · 06 (MCP 基础), Phase 13 · 08 (MCP Client)
**Time:** ~75 分钟

## 學习目标

- 区分 وكيل إلى أداة (MCP) وموقع التطبيق وكيل إلى وكيل (A2A)
- في`/.well-known/agent-card.json`发布包含 المهارات و `supportedInterfaces`بطاقة العميل
- 走通完整的 任务 生命周期:`TASK_STATE_SUBMITTED`.`TASK_STATE_WORKING`.`TASK_STATE_INPUT_REQUIRED`ووضعها`TASK_STATE_COMPLETED`.`TASK_STATE_FAILED`.`TASK_STATE_CANCELED`.`TASK_STATE_REJECTED`.
- استخدام كل جزء  فقط يحتوي `text`.`raw`.`url`أو`data`واحدة من الرسائل،并 استخدام القطع الأثرية 作为结构化产品输出──

## 问题背景

وكيل عميل يحتاج إلى تقديم تقرير كتابة و تفويضها إلى وكيل كتابة متخصصة.

- تعريف REST API:可行، ولكن كل مجموعة配对都 مرة واحدة.
- 共享 Codebase: مطلوب اثنين من العملاء 运行在同一框架上.
- MCP: غير مناسب، MCP تستخدم أدوات التعبير، لا يمكن دعم اثنين من الوكلاء في الحفاظ على نظرياتهم الداخلية غير الشفافة ((المنطق العادي) في نفس الوقت إجراء تعاون على حد سواء.

A2A ملأ هذا الفراغ ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

A2A هو الاتفاقية المعيارية لـ "مراقبة العملاء عبر الإطار" .

## مفهوم الأساسي

### وكيل بطاقة ((智能体名片)

كل عميل يتوافق مع قواعد A2A`/.well-known/agent-card.json`暴露其名片:

```json
{
  "name": "research-agent",
  "description": "Summarizes academic papers and drafts citations.",
  "version": "1.2.0",
  "supportedInterfaces": [
    {
      "url": "https://research.example.com/a2a",
      "protocolBinding": "JSONRPC",
      "protocolVersion": "1.0"
    }
  ],
  "capabilities": {"streaming": true, "pushNotifications": true},
  "securitySchemes": {
    "bearer": {"httpAuthSecurityScheme": {"scheme": "Bearer"}}
  },
  "securityRequirements": [{"schemes": {"bearer": {"list": []}}}],
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/markdown"],
  "skills": [
    {
      "id": "summarize_paper",
      "name": "Summarize a paper",
      "description": "Read a paper PDF and produce a 3-paragraph summary.",
      "tags": ["research", "summarization"],
      "inputModes": ["text/plain", "application/pdf"],
      "outputModes": ["text/markdown"]
    }
  ]
}
```

الوصول إلى الجهاز على أساس URL:拉取名片,选择客户端所支持的第一个 `supportedInterfaces`条目,并枚举其暴露的技能──输入和输出模式均采用标准媒体类型──

### 签名 بطاقة العميل ((طاقات العميل الموقعة)

يمكن أن يحتوي على واحد`signatures`عدد المواد: كل مقالة هي واحدة من المواد المختلفة (RFC 7515) ، وذلك لتحقيق التخلص`signatures`字段后的名片 طبقاً لـ RFC 8785 规范化 JSON 计算生成──使用方方以同样方式规范化并校验签名,防止假冒伪造──

### المهام  حياتية

```text
TASK_STATE_SUBMITTED
  -> TASK_STATE_WORKING
  -> TASK_STATE_COMPLETED | TASK_STATE_FAILED | TASK_STATE_CANCELED | TASK_STATE_REJECTED

TASK_STATE_WORKING
  -> TASK_STATE_INPUT_REQUIRED
  -> TASK_STATE_WORKING (客户端发送携带相同 taskId 的补充消息)
```

العميل 发起 `SendMessage`, الخادم  إقامة المهمة   تمت تعيين الوكيل في كل حالة`GetTask`轮询، أو من خلال `SendStreamingMessage`مع`SubscribeToTask`إجراء SSE 流式监听──流式事件包含 `statusUpdate`مع`artifactUpdate`، و في المهام  دخول النهاية  توقفي`final`العلامة

### الرسائل والأجزاء

واحد الرسالة 包含 `messageId`.`role`(`ROLE_USER`أو`ROLE_AGENT`) وواحد أو أكثر من الأجزاء.**仅包含一个内容字段**,该字段名称即为其类型,不再使用 `kind`判别字段:

- `text`: مجرد كتاب محتوياتها
- `raw`:文件二进制流(在 JSON 中表现为 Base64),通常伴随 `filename`和 `mediaType`.
- `url`:إشارة إلى الملفات
- `data`: Structured JSON 数据载荷 (((为被调用代理 提供结构化输入)

نموذج:

```json
{
  "messageId": "msg-001",
  "role": "ROLE_USER",
  "parts": [
    {"text": "Summarize this paper."},
    {"raw": "...", "filename": "paper.pdf", "mediaType": "application/pdf"},
    {"data": {"targetLength": "3 paragraphs"}, "mediaType": "application/json"}
  ]
}
```

### الأثاث (صنع)

المهام المنتجة هي العناصر، وليس الخطوط المتفردة.

```json
{
  "artifactId": "art-001",
  "name": "summary",
  "parts": [{"text": "...", "mediaType": "text/markdown"}]
}
```

القطع الأثرية 支持流式分块传输──每个 `artifactUpdate`事件携带产品数据 و `append`和 `lastChunk`العلامة

### 三种协议绑定(بروتوكول التزام)

1. **JSON-RPC 2.0 over HTTP**(`JSONRPC`):POST 用于请求,SSE 用于流.`SendMessage`.`SendStreamingMessage`.`GetTask`.`ListTasks`.`CancelTask`.`SubscribeToTask`.`CreateTaskPushNotificationConfig`... و هكذا
2. **gRPC**(`GRPC`تطبق على بيئة عمل مؤسسة تدعم ج.ر.ب.ك، مع نفس الطريقة.
3. **HTTP+JSON/REST**(`HTTP+JSON`): معيار REST 资源路径، مثل `POST /message:send`和 `GET /tasks/{id}`.

ثلاثة أنواع من المعلومات المشتركة المشتركة تماما.`supportedInterfaces`条目声明对应的绑定类型与其`protocolVersion`العميل يجب أن يرسله في كل طلب`A2A-Version: 1.0`الطلب، وإلا الخادم قد يعالجها كإصدار قديم 0.3

```http
POST /a2a HTTP/1.1
Host: research.example.com
Content-Type: application/json
A2A-Version: 1.0

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "msg-001",
      "role": "ROLE_USER",
      "parts": [{"text": "Summarize this paper."}]
    }
  }
}
```

### عدم الشفافية الحفاظ على المجال

الفلسفة التصميمية الأساسية: الحالة الداخلية للعميل المُدَعَمُ هي غير مرئية للغاية.

سبب التصميم: A2A 让互竞争的公司也能合作,而无需暴露各自的内部实现. A2A يمكن أن يستخدم هذا العميل العملي، وذلك لا يعني أن العميل يعرف كيف يستخدم هذه الخدمة.

### 时间线

- **2025-04-09.**جوجل أصدرت A2A:
- **2025-06-23.**捐赠给Linux Foundation‬
- **2025-08.**استيعاب أيه بي إم ACP
- **2025-09.**AP2 扩展(دفع العملاء) نشر
- **2026-04.**إصدار v1.0، حصل على دعم أكثر من 150 منظمة.

### العلاقات مع الشركات المتعددة

| 维度 | MCP | A2A |
|---|---|---|
| 使用场景 | Agent-to-tool（智能体调用工具） | Agent-to-agent（智能体间对等协作） |
| 透明度 | 透明的 Tool 调用 | 不透明的内部推理与执行细节 |
| 典型调用方 | Agent Runtime | 另一个外部 Agent |
| 状态模型 | Tool 调用结果（无状态核心） | 具备完整生命周期的 Task |
| 授权鉴权 | OAuth 2.1 | Agent Card `securitySchemes` + `securityRequirements` |
| 传输层 | Stdio / Streamable HTTP | JSON-RPC / gRPC / HTTP+JSON |

عندما تحتاج إلى استخدام أدوات محددة عند استخدام MCP؛ عندما تحتاج إلى تفويض كل المهمة إلى جسم ذكي آخر عند استخدام A2A。 في بيئة الإنتاج غالبا ما تكون معلقة استخدام: وكيل  داخلي استخدام MCP  إدخال أدوات، على A2A خارجية  مشاركة في شبكة تعاون متعددة الذكاء。

```figure
a2a-task-lifecycle
```

## 动手实践

`code/main.py` تطبيق مجموعة اختبار خفيفة بناء على A2A 1.0.1  قائمة: كتابة وكيل  نشر أسمائها ، والبحث وكيل إلى إرسالها مع PDF جزء و نصوص`SendMessage`رجاءً ، تجربة المهمة`TASK_STATE_WORKING``TASK_STATE_INPUT_REQUIRED``TASK_STATE_WORKING``TASK_STATE_COMPLETED`, فوريًا للعودة إلى النص المتحركات.

重点观察:

- هيكل JSON من وكيل بطاقة:
- سرفر 端 رسالة الهوية 分配与状态转换──
- 通過内容字段自判别的部分 结构──
-  المهمة تنفيذها في الطريق `TASK_STATE_INPUT_REQUIRED`-أجل
- 终态时返回的艺术品──

## 交付物

本课交付 `outputs/skill-a2a-agent-spec.md` في إطار الرغبة في استخدام وكيل جديد من الخارج، فإنه يمكن أن تولد بطاقة وكيل قياسية JSON、مهارات  بيانات ووضع تصميمات اتصال

## التدريب

1. 运行 `code/main.py` تتبع كامل دورة الحياة المهام، بما في ذلك المُتَعَدّى العميل`TASK_STATE_INPUT_REQUIRED`توقفوا

2. إضافة بطاقة وكيل توقيع`signatures`中放入一条 `alg`设为 `HS256`من JWS 条目,对去掉 `signatures`字段后的卡 规范化 JSON 签名──编写验证器,并确认它在被改的卡 上验证失败──

3. استخدام`SendStreamingMessage`实现任务流式传输: كاتب وكيل حسب التسجيل `task`ثلاثة`artifactUpdate`-بطاقة واحدة`TASK_STATE_COMPLETED``statusUpdate`ثم أغلق السيارات، واستخدمها لتجمع هذه المكونات.

4. 设计一个封装 MCP Server 的 A2A代理――把每个 MCP 工具 映射为一个 A2A 技能――记下其中的取舍:失去了哪些不透明性?

5. 阅读A2A v1.0 الإعلان الإصداري، والبحث حتى 2026 سنة 4 月 لا يوجد أي إطار لتحقيق ذلك الميزة.

## 核心专业术语

| 术语 | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| A2A | “Agent-to-Agent 协议” | 用于不透明 Agent 协作的开放协议 |
| Agent Card | “`/.well-known/agent-card.json`” | 公开发布的元数据，描述 Agent 的 Skills 和 `supportedInterfaces` |
| Skill | “一个可调用单元” | Agent 支持的具名操作（类似于 MCP 中的 Tool） |
| Task | “委托单元” | 具有生命周期和最终 Artifact 的工作项 |
| Message | “Task 输入” | 承载 Parts（`text`、`raw`、`url`、`data`） |
| Part | “带类型的分块” | `text` / `raw` / `url` / `data` 中恰好一个，外加可选的 `mediaType`；没有 `kind` 字段 |
| Artifact | “Task 输出” | 完成时返回的具名、带类型输出 |
| AP2 | “Agent Payments Protocol” | 构建在 A2A 之上的支付扩展；Card 签名属于 A2A 核心（`signatures`） |
| Opacity | “黑盒协作” | 被调用 Agent 的内部实现对调用方隐藏 |
| `TASK_STATE_INPUT_REQUIRED` | “Task 暂停” | Agent 需要更多信息时的中断状态 |

## 延伸阅读

- [a2a-protocol.org](https://a2a-protocol.org/latest/) A2A 规范主站
- [a2aproject/A2A GitHub](https://github.com/a2aproject/A2A)  参考实现与SDK
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1) هذه الدورة تتبع قواعد مع اتفاقية بروتوبوف
- [Linux Foundation — A2A launch press release](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents) تحويل الحكم في يونيو 2025
- [Google Cloud — A2A protocol upgrade](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade) خطة التقدم مع الشراكة
- [Google Dev — A2A 1.0 milestone](https://discuss.google.dev/t/the-a2a-1-0-milestone-ensuring-and-testing-backward-compatibility/352258) v1.0  إصدار المعلومات مع إرشادات التوافق المتجهة
