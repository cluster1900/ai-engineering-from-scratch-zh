# 模型上下文协议(Model Kontext Protocol, MCP)

> MCP için AI Host                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (函数调用), Phase 11 · 03 (结构化输出)
**Time:** ~75 分钟

## Öğrenme hedefi

- 明确区分 MCP Host、Client、Server、传输层(Transport) vs Server 原语(Primitiv)。
- 构建携带 MCP 2026-07-28 规范必填元数据的 JSON-RPC 请求──
- Kullanım`server/discover`检查版本、身份与能力声明。
- Bu, bir diğer diğer yöntemdir.
- 解释现代无状态 MCP 如何与握手时代的 Legacy Server 实现双时代互操作──
- Sunucu güvenli bir durum sınırları, aktarım stratejileri ve yapay onay geçitleri oluşturur.

## 问题背景

Uygulamalarınız veritabanı sorguları, günlük işlemleri ve dosya okuma işlevlerini gerektirir. Eğer bir iletişim protokolü yoksa, her AI Host'u özel keşif, düzenleme, hata işlem, aktarım ve tanımlama kodları tamamıyla aynı kapasiteye sahip olarak yazmak zorundadır.

MCP bu büyük N×M 集成矩阵ı  Server  standart JSON-RPC 接口ı  aşık; herhangi bir konformasyondaki Client  bu 接口ı  bulabilir  model veya kullanıcı  yerine getirir 调用并解析结果,  Server 定制适配器 için gerek yoktur.

Ancak bir anahtar sınır vardır: MCP standartlaşmış iletişim protokolü için sorumludur. Bu, modelin hangi araçları kullanması gerektiğine karar vermeye, güvenilmez içeriği otomatik olarak güvenliğe dönüştürmeye ve durumsuz bir istek için otomatik olarak kalıcı uygulama durumuna dönüştürülmeye sorumludur.

## 核心概念

![MCP Host、无状态请求与 Server 原语](../assets/mcp-architecture.svg)

### 三大 Server 原语

1. **Tools（工具）**:可调用动作──每个工具包含名称、描述、JSON Schema 输入约束及执行函数──
2. **Resources（资源）**:name ve URI 寻址的内容,供客户 读取──
3. **Prompts（提示模板）**Host'un kullanıcılara gösterdiği:

Host 指 AI 宿主应用程序 (Örneğin Claude Desktop) ――Host içindeki MCP Client 专职与特定的 Server 通信──传输层负责在两者之间搬运 JSON-RPC 报文──

### 无状态请求取代传统握手

MCP 2026-07-28 tamamen kaldırıldı.`initialize`和 `notifications/initialized`, ayrıca anlaşma seviyesindeki Sessiyonu kaldırdı.`params._meta`İçinde taşıyıp, gerekli olanları çözmek için aşağıdaki yazıyı kullan:

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

协议版本与客户 能力为强制必填项,客户身份为推项──缺失 `_meta`、缺少必填字段或字段类型错误均属于参数形,返回 不行参数 错误码`-32602`)。若版本字符串合法但服务器 无法支持,返回 `UnsupportedProtocolVersionError`(`-32022`)―Server, tümüyle tarihsel müzakere kayıtları olmadan herhangi bir geçerli talebi bağımsız olarak işleyebilir.

无状态绝对不意味着应用无法保持业务状态――它只意味着状态不再隐藏在底层MCP 连接或 连接或 `Mcp-Session-Id`△ Eğer iş akışı geçiş süresi gerektirirse, Server tarafından üretilen açık olmayan durum satırı (Opaque Handle), Müşteri sonraki kullanım sırasında sıradan bir araç olarak kullanılır.

### 服务发现与版本协商

Bütün modern sunucular 均必须实现 `server/discover`△其返回结果广播支持的协议版本、能力集合与服务器身分:

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

Müşteri de doğrudan iş yöntemini kullanabilir ve bir sürüm hatasını işleyebilir, ancak sürümle görüşme yapabilme yeteneğini gösterme ve sürümle görüşmeyi daha açıkça açık hale getirebilir.`-32022`, özeti verileri içerir Server  desteklenmiş `supported`版本数组以及被拒绝的 `requested`版本──

Çalıştığım zaman, iki zamanlı bir müşteri kullanımı`server/discover`发起探测──发现成功或收到如`-32022`等已识别的现代错误,均证明对方为现代服务器;唯有非现代错误或超时才允许回到2025-11-25 的旧版`initialize`握手──Legacy 行為のみ兼容補償として, kesinlikle modern默认──

### 显式的结果结构

2026-07-28 Közel kurallarda her başarı sonuçları taşınır `resultType`- ...

- `complete`İşlem tamamlandı:
- `input_required`: gösterir Server 需要通过多轮请求模式(MRTR)发起补充交互──核心规范中只允许从 `tools/call`- Evet.`resources/read`Ya da`prompts/get`Bu tipte geri dönmek.

Müşteri eksik olacak .`resultType`Bu yüzden, bu konuda daha fazla bilgi almak için lütfen lütfen lütfen lütfen.

Liste ve çalışma sonuçları da dahil`ttlMs`(Milli saniye hayatta kalmak için) ve `cacheScope`(缓存范围) ―― kesin `tools/list`排序加上新鲜度提示,使客户端能够安全缓存服务发现结果,大幅提升模型 Prompt Cache'ın sabitliğini`cacheScope: public`允许跨上下文共享缓存,`private`则严格限制发起请求的私有上下文内──

### 线缆格式与传输层

MCP stadio veya Streamable HTTP 上运行 JSON-RPC 2.0:

- Lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen`jsonrpc`- Evet.`id`- Evet.`method`和 `params`- Evet.
- 响应(Response): içerir相匹配的 `id`Ve `result`Ya da`error`- Evet.
- 通知(Bildirme):无 `id`, herhangi bir yanıt gerektirmez.

现代 Streamable HTTP 暴露单个只接受 POST 的端点──每个 JSON-RPC 消息对应一次独立的 POST──请求 POST 接收单个 JSON 对象,或接收以最终响应结尾的请求作用域 SSE 流──被接受的通知 POST 返回无响应体的 HTTP 202──

2026-07-28 规范中**不存在**独立的 MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`Ya da temelinde`Last-Event-ID`Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri Çeviri: Çeviri Çeviri: Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Ç Ç Ç Ç Çeviri Çeviri Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç`subscriptions/listen`POST Lütfen, onun yanıtını tutun.

```figure
mcp-nxm-collapse
```

## 动手实践

### 步骤 1: 注册 Sunucu 表面

- Evet .`code/main.py`Python'da yapılan bir program, Python'da yapılan bir program ve programdır.

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

### 步骤 2: Her istek için ekleyici veriler

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

远程调用通过 HTTP POST 发起时,镜像指定头部:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

Başvuru ile başvuru uyumsuz olduğunda, hemen HTTP 400 ile hata kodu geri gönderin `-32020`- Evet.

运行测试命令:

```bash
cd phases/11-llm-engineering/14-model-context-protocol
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

## 交付物

本课交付 `outputs/skill-mcp-server-designer.md` Özel bir işletme alanını, anlaşmaların bulunması, taleplerin veriyi, kesinlik depolama listesi, açık durum sözcükleri, nakliye başlıklı sınav ve onay stratejileri kapsamlı modern statüssiz MCP ırayla uyumlu yapısal programlara dönüştürmek mümkün olacaktır.

## MCP'nin üretim sınıfı sistemine derinlemesine girmeye devam edin

Bu ders size bir tek anlaşma akılını kurdu. 13 aşamada, aşağıdaki dört bölümün temel aşamaları daha sıkı üretim sınırlarını kapsayacak:

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md): kapsamlı sert giriş Şema, yapılandırma içeriği, yollar, veri, sayfa belirleme hakkı ve anlaşma ve iş hataları arasındaki ayrımı
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md): kapsamlı talep kaldırma, görev kaldırma, son tarih, gerileme ve yeniden bağlantı mekanizması
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md):: охваты имен пространство доказательства、产物可信来源、不可变锁定、实时漂移、准入凭证与回滚策略──
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md)Altın standartlar ve ters yönlü test kullanım örnekleri, sıkı sürümler, temsilci internet sertifikaları, açgözlülük ve güvenlik yasakları kapsamaktadır.

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
