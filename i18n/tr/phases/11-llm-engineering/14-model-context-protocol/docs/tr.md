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
3. **Prompts（提示模板）**Host 展现给用户: kullanılabilir yapılandırılmış modular,

Host 指 AI  uygulamaları。Host içindeki bir MCP istemcisi ve bir sunucu 通信。 传输层 is responsible between the two to move JSON-RPC 报文。

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

无状态绝对不意味着应用无法保持业务状态――它只意味着状态不再隐藏在底层MCP 连接或 连接或 `Mcp-Session-Id` Eğer iş akışı geçiş süresi gerektirirse, Server tarafından üretilen açık olmayan durum sözcükleri (Opaque Handle), Müşteri sonraki işlev sırasında sıradan bir Araç olarak kullanılır                                                                                                                                                                                                                                                                   

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

Müşteri de doğrudan iş yöntemini kullanabilir ve hata sürümünü işleyebilir, ancak sürümün kullanımı, sürümle görüşme yeteneğini daha açık bir şekilde göstermesini sağlayabilir.`UnsupportedProtocolVersionError`, hata kodu `-32022`△ Onun verileri 包含 `supported`(Server 支持的修订版数组) ile`requested`(被拒绝的修订版)

Çalıştığım zaman, iki zamanlı bir müşteri kullanımı`server/discover`Başarılı bulma veya alınma`UnsupportedProtocolVersionError`等已识别的现代错误,均证明对方为现代服务器;唯有非现代错误或超时才允许回到2025-11-25 的旧版`initialize`握手──Legacy 行為のみ兼容補償として, kesinlikle modern默认──

### 显式的结果结构

2026-07-28 Közel kurallarda her başarı sonuçları taşınır `resultType`- ...

- `complete`İşlem tamamlandı:
- `input_required`: gösterir Server 需要通过多轮请求模式(MRTR)发起补充交互──核心规范中只允许从 `tools/call`- Evet.`resources/read`Ya da`prompts/get`Bu tipte geri dönmek.

Müşteri eksik olacak .`resultType`Bu yüzden, bu konuda daha fazla bilgi almak için lütfen lütfen lütfen lütfen.

Sunucu 应在每个结果的 `_meta`İçeriyor`io.modelcontextprotocol/serverInfo` Bu durum, yalnızca gösterim için kullanılır, güvenlik kararlarına dayalı değildir.

Liste ve çalışma sonuçları da dahil`ttlMs`(Milli saniye hayatta kalmak için) ve `cacheScope`(缓存范围) ―― kesin `tools/list`排序加上新鲜度提示,使客户端能够安全缓存服务发现结果,并提升模型 Prompt Cache'ın sabitliğini`cacheScope: public`允许跨上下文共享缓存,`private`则严格限制发起请求的私有上下文内──

### 线缆格式与传输层

MCP stadio veya Streamable HTTP 上运行 JSON-RPC 2.0:

- Lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen lütfen`jsonrpc`- Evet.`id`- Evet.`method`和 `params`- Evet.
- 响应(Response): içerir相匹配的 `id`Ve `result`Ya da`error`- Evet.
- 通知(Bildirme):无 `id`, herhangi bir yanıt gerektirmez.

现代 Streamable HTTP 暴露单个只接受 POST 的端点──每个 JSON-RPC 消息应应一次独立的 POST──请求 POST 接收单个 JSON 对象,或接收最终响应结尾的请求作用域 SSE 流──被接受通知 POST 返回无响应体的 HTTP 202──本核心修订版未定义任何通过 Streamable HTTP 从客户端发送到服务器的通知──

2026-07-28 规范中**不存在**独立的 MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`Ya da temelinde`Last-Event-ID`Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri Çeviri: Çeviri Çeviri: Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Ç Ç Ç Ç Çeviri Çeviri Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç`subscriptions/listen`POST Lütfen, onun yanıtını tutun.

### 无需 Server 发起请求的客户端 输入

Eski modified version izin sunucu 流发送 `sampling/createMessage`- Evet.`roots/list`Ya da`elicitation/create`之类的请求──当前协议改用多轮往返请求(MRTR)──符合条件的工具 调用、资源读取或快速 获取会回归 `resultType: input_required`,并至少携带 `inputRequests`Ya da`requestState`之一──Bilici 收集所需输入, yeni JSON-RPC ID 和对应的 `inputResponses`重试原始方法;  provided `requestState`...şimdilik de öyle değil.`inputRequests`,重试时省略 `inputResponses`- Evet.

Kökler、Sampling ve Logging  hala kullanılabilir ama terk edilmiş, yeni gerçekleşme onları kullanmamalı── mevcut Kökler veya Örnekleme istekleri MRTR'nin `inputRequests`Orta aktarım, kesinlikle bağımsız Server olarak Client JSON-RPC istekleri için kullanılmayacaktır. Açık dosya veya katalog parametrelerini, kaynak URI'leri, sunucu konumu ve model sağlayıcılarıyla doğrudan birleştirilmesini öncelikle kullanır.

```figure
mcp-nxm-collapse
```

## 动手构建

### 步骤 1: 注册 Sunucu 表面

Bu konuda bir değişiklik yapılmış olsa da, kayıt yolu hala basit:

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

`code/main.py`Ortalama tam gerçekleşme bir kaynak ve bir prompt'ı da kayıt altına aldı.

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

Bu verileri sadece bağlantı nesneleri içinde bulundurmayın.

### 步骤 3: ((可选) önce yeniden liste

调用 `server/discover`, seçin bir desteklenmiş versiyon, sonra kullanın `tools/list` Eğer biliyorsan, sürümün işlenmesi mümkün değil.`-32022`, doğrudan调用 `tools/list`Aynı şekilde yasal.

演示按名称顺序返回工具列表,并附带 `ttlMs`- Evet.`cacheScope`- Evet.`resultType`Server Servisinin Yapısı: ツール 调用返回完整但不可缓存的结果,因为其输出可能依赖于当前状态──

### 步骤 4: Aynı istekleri HTTP'ye gönder

远程 `tools/call`POST  taşıyıcı görüntü JSON-RPC

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

`MCP-Protocol-Version`Talepler ile birlikte`_meta`Orta versiyon uyumlı`Mcp-Method`Her bir JSON-RPC istekleri, her birinde de bulunmalıdır.`method`Birlikte.`Mcp-Name`Sadece`tools/call`- Evet.`resources/read`ile`prompts/get`时必填,且必须与工具名、资源 URI或提示名一致──缺失必填请求头或不一致时,返回 HTTP 400 与 `HeaderMismatch`错误码 `-32020`- Evet.

### Adım 5: Anlaşmanın dışında güvenlik uygulanması

- Bu nedenle, bu programın tüm programları, programları ve programları ile birlikte yapılması gerekiyor.
- 本地 Server  Localhost'a bağlı ve Akışlı HTTP Üst sınıfı `Origin`- Evet.
- Kullan .`destructiveHint: true`标记会修改状态的工具,并要求主持人 审批──
- 显式传递目录与文件范围, 显式传递目录与文件范围, 显式传递目录与文件范围,而不是依赖已废弃的 Roots──
- Kaynak ve araç ihracatı inanılmaz bir veri olarak görülecektir.
- stdio 下 stdout 专用于 JSON-RPC;诊断信息写入 stderr。

## 动手实践

Klasör Kayıtında:

```bash
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

İlk aşama:`2026-07-28`Aşağıda buldum.`demo-server`Sonra da bak.`MCPClient.request`Her seferinde yeniden inşa edilmek için kullanılıyor.`_meta`❖ Bir istekten veriyi kaldırmak, gözlem sunucu  reddetmek ❖

## 交付物

本课交付 `outputs/skill-mcp-server-designer.md` Bir işletme alanını statüssiz MCP tasarım programına dönüştürebilir.

## MCP'nin üretim sınıfı sistemine derinlemesine girmeye devam edin

Bu ders size bir protokol modeli oluşturmak için yardımcı olacaktır. 13 aşama, dört üretim sınırını kendi kendine bağımsız olarak  yapılandırma ve testleme  kursu olarak ayırır:

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md)Kapalı giriş şemalarını, yapılandırma içeriğini, yollardaki veriyi, şeffaflıktan kaynaklanan sayfaları, tamamlanmış yetkileri ve anlaşma ve iş hatalarının ayrımı kapsamaktadır.
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md): kapsamlı talep kaldırma, görev kaldırma, son tarih, eşlik, geri basınç, vekillik, yeniden bağlantı ve düzenleme
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md):涵盖命名空间证明、产物可信来源、不可变锁定、实时漂移、登录状态、准入证与回滚策略──
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md)Altın ve negatif tel transkriptleri) ✓ sıkı sürüm zaman ✓ SDK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

Server bir ekip veya bir güven sınırını geçince, onları sırayla öğrenin. Bu, tüm dağıtım sürecinde güvenli ve teşhis edilebilir bir anlaşma oluşturmak için kullanılabilecek yöntemlerden birlikte kullanılır.

## 练习与思考

1. Bir ekle.`subtract`工具,确认 `tools/list`仍按字母序排列──
2. 移除 protocol-version 键,验证返回 Geçersiz Params(`-32602`)¬ sonra gönderilmeli.`2025-11-25`,验证返回 `-32022`, onaylamak `requested`Bu değişiklik, yapıldı.`supported`Orta seçim versiyonu:
3. Server tarafından oluşturulan bir işlem oluşturmak için.`draftId`,并要求更新操作把它作为参数传入.
4. 让一个需要用户确认的工具返回 `input_required`Yeni kimlik kullan 、一条 `inputResponses`条目和原样 `requestState`重试原始调用, değil bir sunucu-kliyenin JSON-RPC istekleri oluşturmak için.
5. 设计一个双时代工作室客户端 草图:把结果或已识别的现代错误视为现代对端, yalnızca tanınmayan hatalar veya超时时才允许回归`initialize`- Evet.

## 核心专业术语

| 术语 | 通俗说法 | 实际含义 |
|------|-----------------|------------------------|
| MCP | “LLM 的工具协议” | 用于服务发现、工具、资源、提示模板与扩展的 JSON-RPC 协议 |
| Host | “AI 应用” | 拥有大模型与用户交互界面、挂载一个或多个 MCP Client 的 AI 应用程序 |
| Client | “连接器” | 代表 Host 与单个具体 Server 执行 MCP 通信的连接器组件 |
| 无状态 MCP (Stateless MCP) | “没有 Session” | 每个请求携带版本与能力元数据，不存在与底层物理连接绑定的协议状态 |
| `server/discover` | “能力探测” | 强制实现的 Server 方法，用于公布支持版本、能力集与身份标识 |
| `resultType` | “结果状态” | 把结果标记为 `complete` 或 `input_required` |
| 显式状态句柄 (State handle) | “工作流 ID” | 由 Server 签发、作为普通业务参数传递的应用层唯一标识符 |
| Streamable HTTP | “远程传输” | 单一 POST 端点架构，返回常规 JSON 或请求作用域的 SSE 响应 |
| MRTR (多轮请求模式) | “请求输入再重试” | 嵌入在响应结果中的输入请求，完成后由客户端重新发起原始操作重试 |

## 延伸阅读

- [MCP 2026-07-28 核心变更](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 服务发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 多轮请求模式 (MRTR)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 已弃用特性](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
