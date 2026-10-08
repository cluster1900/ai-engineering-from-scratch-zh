# 模型上下文协议(مثال بروتوكول السياق، MCP)

> MCP 为 AI Host 提供统一的协议,用于动态发现和调用工具 (工具) 资源 (资源) 资源) 提示模板 (提示模板) 提示) 提示 (提示) ⋅2026-07-28 修订版使该协议完全无化:能力声明与版本状态下文随着每一个请求独立传递,不再依赖连接绑定的握手.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (函数调用), Phase 11 · 03 (结构化输出)
**Time:** ~75 分钟

## 學习目标

- 明确区分 MCP مضيف、عميل、خادم、传输层(نقل) مع الخادم 原语(بدائية)
- 构建携带MCP 2026-07-28 规范必填元数据的JSON-RPC 请求──
- استخدام `server/discover`检查版本、身份与能力声明。
- من الأدوات、موارد وطلبات  العودة مع نوع التعرف و الحفاظ على الإدراك 
- 解释现代无状态 MCP 如何与握手时代的 Legacy Server 实现双时代互操作──
- لتحديد الحدود الأمنية للخادم، استراتيجية النقل والمرورات المعتمدة الاصطناعية.

## 问题背景

تطبيقاتك تتطلب استفسارات قاعدة البيانات  عملية التاريخ و وظائف قراءة الملفات  إذا لم يكن هناك اتفاقية اتصال موحدة ، يجب على كل مضيف AI أن يكتب كودًا خاصًا ومختصًا ومختصًا ومختصًا ومختصًا ومختصًا بنفس القدرة.

MCP يضع هذا المجموعة الكبيرة من N×M المكاملة المكاملة. الخادم يظهر على واجهة JSON-RPC المعيارية. أي مشترك في المواصفات يمكن أن يجد هذا المواصلة.

ولكن هناك حدّ رئيسيٌ مهم: MCP  المسؤول عن اتفاقية الاتصالات الموحدة نفسها ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## مفهوم الأساسي

![MCP Host、无状态请求与 Server 原语](../assets/mcp-architecture.svg)

### 三大 Server 原语

1. **Tools（工具）**:可调用动作── كل أداة تحتوي على اسم、 وصف、 JSON Schema 输入约束及执行函数──
2. **Resources（资源）**:具名且按 URI 寻址的内容,供客户 读取──
3. **Prompts（提示模板）**: قابل للرد من المستخدمات المستخدمة، لضمان المضيف 展现给用户快捷触发──

المضيف يدل على AI  مستضيف التطبيقات (مثل كلود ديسكوب)  العميل MCP داخل المضيف 专职与特定的服务 通信──传输层负责在两者之间搬运 JSON-RPC 报文──

### 无状态请求取代 التقليدية اليد

المملكة المتحدة 2026-07-28 تم تحريرها`initialize`和 `notifications/initialized`، و أيضاً نقل الجلسة من مستوى الاتفاقية . كل طلب متوافق`params._meta`ويتم تحليل كل ما يحتاجه

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

协议版本与客户 能力为强制必填项,客户身份为推项──缺失 `_meta`、缺少必填字段或字段类型错误均属于参数形,返回`-32602`(‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬`UnsupportedProtocolVersionError`(`-32022`)― الخادم يمكن أن يعالج بشكل مستقل أي طلبات فعالة دون سجل تاريخي كامل

عدم الحالة لا يعني أن التطبيق لا يمكن أن يبقى في حالة عمل.`Mcp-Session-Id` إذا كان العمل يتطلب عبر المستخدم تسلسلية، من قبل الخادم 生成不透明的状态句柄(Opaque Handle) ، العميل في المستخدم في المستخدم في الملاحظات بعد ذلك سوف يستخدمها كوسيلة عادية 参数传入。

### 服务发现与版本协商

جميع الأجهزة الحديثة يجب أن تنفيذها`server/discover`△其返回结果广播支持的协议版本、能力集合与服务身分:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "supportedVersions": ["2026-07-28"],
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {}
    },
    "ttlMs": 3600000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "demo-server",
        "version": "1.0.0"
      }
    }
  }
}
```

يمكن للمستخدم أيضاً استخدام طريقة العمل مباشرة ومعالجة إصدار خاطئ، ولكن استخدام إكتشاف يمكن أن يجعل القدرة على عرض الإصدارات ومناقشة الإصدارات أكثر وضوحاً.`-32022`, تتضمن البيانات الإضافية الخادم  دعم `supported` عدد الإصدارات ورفضها `requested`إصدار

في الاستديو 模式下,双时代(دوئي عصر) العميل استخدام `server/discover`发起探测──发现成功或收到如 `-32022`等已识别的现代错误,均证明对方为现代服务;唯有非现代错误或超时才允许回到到2025-11-25的旧版本 `initialize`اليد المتحركة. التراث يُعتبر مجرد تعويض متضامن.

### النتائج واضحة

2026-07-28 كل نجاح في النظام الأساسي`resultType`:

- `complete`:表示操作已彻底完成──
- `input_required`: يظهر الخادم  بحاجة إلى مرجعية الطلبات `tools/call`.`resources/read`أو`prompts/get`返回此类型──

العميل يجب أن يكون غائب`resultType`الإصدار القديم يجب أن يكون كامل

列表和读取操作的结果还附带 `ttlMs`(ملي ثانية من الوقت) و `cacheScope`(缓存范围) ――确定性的 `tools/list`排序加上新鲜度提示,使客户端能够安全缓存服务发现结果,大幅提升模型 Prompt Cache 的稳定性──`cacheScope: public`允许跨上下文共享缓存،`private`تقيد بشكل صارم في إرسال الطلبات الخاصة على النص التالي

### 线缆格式与传输层

MCP في الاستديو أو HTTP المباشر 上运行 JSON-RPC 2.0:

- طلب:包含 `jsonrpc`.`id`.`method`和 `params`.
- 响应(رد): يتضمن相匹配 `id`و`result`أو`error`.
- 通知(إعلان):无 `id`, لا تحتاج إلى أي رد فعل

现代 Streamable HTTP 暴露单个只接受 POST 的端点──每个 JSON-RPC 消息对应一次独立的 POST──请求 POST 接收单个 JSON 对象,或接收以最终响应结尾的请求作用域 SSE 流──被接受通知 POST 返回无响应体的 HTTP 202──

2026-07-28 规范中**不存在**独立的 MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`أو على أساس`Last-Event-ID`                                                                                                                                                                                                                                                              `subscriptions/listen`POST من فضلكم، انجبجوا على الارتباط الطويل

```figure
mcp-nxm-collapse
```

## 动手实践

### 步骤 1: ثبت الخادم 表面

في`code/main.py`في الصفحة التالية:

```python
server = MCPServer("demo-server")

@server.tool(
    "add",
    "Add two integers.",
    {
      "type": "object",
      "properties": {
        "a": {"type": "integer"},
        "b": {"type": "integer"}
      },
      "required": ["a", "b"]
    }
)
def add(a: int, b: int) -> dict:
    return {"sum": a + b}
```

### الخطوة 2: لكل طلب إضافة بيانات

```python
def request(method, params=None):
    body_params = dict(params or {})
    body_params["_meta"] = {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/clientInfo": {
            "name": "demo-client",
            "version": "1.0.0"
        }
    }
    return {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": body_params
    }
```

### 步骤 3:HTTP 镜像头映射

远程调用通过 HTTP POST 发起时,需要镜像指定头部:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

عندما يختلف الطلب عن الطلب ، ارجع على الفور إلى HTTP 400 مع رمز الخطأ `-32020`.

运行测试命令:

```bash
cd phases/11-llm-engineering/14-model-context-protocol
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

## 交付物

本课交付 `outputs/skill-mcp-server-designer.md` يمكن تحويل مجال عمل معين إلى إطار بنية يوافق مع قواعد MCP الحديثة غير الحالة، يشمل إيجاد اتفاقيات، بيانات طلبات، قائمة تخزينات تحديدات، بيانات حالة واضحة، استراتيجيات التجربة والإصدار.

## continued deep into MCP 生产级体系

هذا الدروس يُساعدك على إنشاء عقلات اتفاقية موحدة. خلال المرحلة 13، سيتم تغطية هذه الدروس الأربعة الأساسية المرحلة التالية على حدود إنتاج أكثر صرامة:

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md): يشمل صارمة إدخال مخططات، محتوى هيكلي، طريق البيانات، حق تقسيم الصفحات، والتحديد بين الاتفاقية والخطأ في الأعمال.
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md): يشمل طلب إزالة ‬استمرار المهام ‬إزالة ‬المدة النهائية ‬等性‬الضغط والإعادة التواصل ‬
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md): يشمل إثبات المجال التسمي٬ المنتج مصدر قابل للتصديق٬ لا يمكن تحديده٬ عمليات التنقل٬ إمكانية الحصول على شهادة دخول وتكرار استراتيجياتها٬
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md): يشمل المعايير الذهبية مع حالات الاستخدام المضادة للتجارب، والإصدارات الصارمة، والشهادات الوكالة على شبكة الإنترنت، والانفصال عن الانتباه، والإصدار من المراقبة الآمنة.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| MCP | 用于向 AI Host 暴露服务发现、工具、资源、提示模板与扩展的 JSON-RPC 协议 |
| Host | 拥有大模型与用户交互界面、挂载一个或多个 MCP Client 的 AI 应用程序 |
| Client | 代表 Host 与单个具体 Server 执行 MCP 通信的连接器组件 |
| 无状态 MCP (Stateless MCP) | 每个请求携带版本与能力元数据，不存在与底层物理连接绑定的协议状态 |
| `server/discover` | 强制实现的 Server 方法，用于公布支持版本、能力集与身份标识 |
| `resultType` | 区分成功结果状态的鉴别字段（如 `complete` 或 `input_required`） |
| 显式状态句柄 (State handle) | 由 Server 签发、作为普通业务参数传递的应用层唯一标识符 |
| Streamable HTTP | 单一 POST 端点架构，返回常规 JSON 或请求作用域的 SSE 响应 |
| MRTR (多轮请求模式) | 嵌入在响应结果中的输入请求，完成后由客户端重新发起原始操作重试 |

## 延伸阅读

- [MCP 2026-07-28 核心变更](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 服务发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 多轮请求模式 (MRTR)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
