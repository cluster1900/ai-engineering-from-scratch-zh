# MCP 传输层:studio ve statüsüz Akışlı HTTP

> 传输层 sorumlu taşıyan MCP 报文, ancak kesinlikle eksik bir anlaşma durumu sağlamaz.`2026-07-28`规范中,本地 studio ve uzak 流通 HTTP 均承载完全自描述的独立请求──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 与 08（构建 MCP Server 与 Client）
**Time:** ~65 分钟

## Öğrenme hedefi

- Çeviri: http://www.studio.com/
- 实现现代单端点、纯 POST(POST-only) 流通性 HTTP 传输协议。
- 镜像并校验 MCP 版本号、方法名与 Name 请求头与 JSON-RPC 消息体的一致性──
- Doğrudan teslimat istekleri rol alanının kısa döngüsü SSE ile uzun döngüsü `subscriptions/listen`- Evet.
- 迁移基于 Session 和早期 HTTP+SSE'nin deployment,杜绝将 Legacy 行为误当现代规范呈现──

## 问题背景

早期 Streamable HTTP 修订版将协议协商与底层的连接和会议 绑定混为一谈――Server 可以发发`Mcp-Session-Id`、 açığa çıkarmak bağımsızlık 推送流、 kabul DELETE `Last-Event-ID`恢复 SSE 断点──

MCP `2026-07-28`Bu mekanizmaları ağ hattından tamamen kaldırılmıştır. Herhangi bir taleb herhangi bir sağlıksız işçiye gönderilebilir. Çünkü protokol sürümü ve Müşteri kapasitesi tümüyle talebinde kaplıdır. HTTP başlığı yalnızca dış ağ bağlantı yolları ve strateji kontrolü için kullanılır. Ancak, işlemden önce sunucu başlık ve talebinin kontrolü için çok ciddi olmalıdır.

Bu şekilde inşa edilen sistem, daha güçlü bir yol genişleme kapasitesine ve daha net bir kontrol zihinine sahiptir. Bu da şunu da ifade eder: 2025'te aktarım aşamasını mevcut standart olarak sürdürürsek, hataların hata ve güvenlik modellerini aşılayacağız.

## 核心概念

### stdio 模式

stdio 绑定专用于客户端 启动的本地子进程:

- Müşteri her seferinde stdin 写入一条 UTF-8 编码的 JSON-RPC 消息──
- Sunucu Her Adım Çıkış 写入一条 UTF-8 编码的 JSON-RPC 消息──
- Sunucu tüm teşhis bilgileri yönlendirici olarak yazıya girecek.
- EOF'e ulaştığında, sunucu hızla çıkmak zorunda.
- Her çağdaş istek var.`params._meta`İçinde taşıyım versiyonu ve kapasitesi

进程生命周期, fiziksel aktarım yaşam döngüsüne ait değildir. 进程生命周期,绝不是现代协议 Session──若子进程意外退出,中断的请求均已丢失──正确做法是重启进程、重发现、重列列工具、重建订阅,并仅对安全操作使用新请求 ID 发起重试──

### 2026-07-28 İçinde Akışlanabilir HTTP

现代 Server 暴露一个单一的 MCP 端点(如 `/mcp`), ve sadece POST isteklerini kabul et.

Her bir JSON-RPC istek veya bildirim, tüm yeni bir HTTP POST olacaktır.

Server:

- `Content-Type: application/json`: Return single JSON-RPC 响应;
- `Content-Type: text/event-stream`: geri dönmek, son olarak son JSON-RPC                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

Alınan bildirim için, sunucu yanıtsız geri döndü.`202 Accepted`- Evet.

Müşteri, bu iki tepkiyi aynı anda talep başlığında açıklıyor:

```http
Accept: application/json, text/event-stream
```

### 纯 POST(POST-only)

现代 Streamable HTTP 不存在独立的 GET 推送端点,也没有 DELETE Session 端点:

- `GET /mcp`Doğrudan geri dön .`405 Method Not Allowed`- Evet.
- `DELETE /mcp`Doğrudan geri dön .`405 Method Not Allowed`- Evet.
- `Mcp-Session-Id`Doğrudan göz ardı edilmiştir, asla ortaya çıkmaz, asla ortaya çıkmaz.
- `Last-Event-ID`直接被忽视,因为现代流不支持断点重放续传.

Eğer talebin etki alanının SSE 流在收到最终响应前中断,Client 视该次在途请求已丢失.

### 源站校验(Origin Validation)

Sunucu , bağlantı sırasında iletişimi alıyor .`Origin`Lütfen başı DNS'e yeniden bağlayın. Eğer başı varsa ve izin verilmiyorsa, geri dön.`403 Forbidden`❖非浏览器 Müşteri kaydedilebilir `Origin`Bu konuda resmi nakliye kuralları kabul edilmektedir.

本地开发 Server                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `127.0.0.1`Hayır.`0.0.0.0` İnternet hizmetleri her talepte sertifikayı ve yetkiyi gerçekleştirmelidir;

### HTTP veritabanı istek başlığı

Her zamanki POST Dilekçeler içerir:

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

规则要求:

- `MCP-Protocol-Version`必須与 `params._meta.io.modelcontextprotocol/protocolVersion`Tamamen uyumlu.
- `Mcp-Method`必須 JSON-RPC `method`Tamamen uyumlu.
- `Mcp-Name`- Evet .`tools/call`- Evet.`resources/read`和 `prompts/get`时强制必填――
- `Mcp-Name`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `params.name`(Yada `resources/read`时的 `params.uri`)。
- Lütfen başlık değer bölümü

对于包含非ASCII或特殊字符的 `Mcp-Name`, Standard Base64 哨兵 biçimi kullan:

```text
=?base64?{Base64EncodedValue}?=
```

                                                                                                                                                                                                                                                              `400`Yanlış kodla.`-32020`◊ Eğer başlıklı sürüm aynıdır ama sunucu bu sürümü desteklemiyorsa, HTTP'ye dön`400`Yanlış kodla.`-32022`- Evet.

### Başvuru etki alanının kısa döngüsü SSE

Sunucu SSE'yi uzun süreli tek bir talebe göre kullanabilir:

```text
POST tools/call id=41
  <- notifications/progress (针对 id=41)
  <- notifications/progress (针对 id=41)
  <- JSON-RPC response (id=41)
流关闭
```

Sunucu 绝不能在这个流中主动向客户端发发起独立的 JSON-RPC 请求──关闭响应流即代表取消该请求──

### 长周期变更推送:`subscriptions/listen`

变更通知必须通过客户主动发起的专业 POST 变更通知必须通过客户主动发起的专业 POST 变更通知必须通过客户主动发起的专业发发发帖 变更通知必须通过客户主动发发起的专业发帖 变更通知必须通过客户主动发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发

```json
{
  "jsonrpc": "2.0",
  "id": "listen-1",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true,
      "resourceSubscriptions": ["notes://note-1"]
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    }
  }
}
```

POST 响应是一个长连接 SSE 流──其首条协议消息为 `notifications/subscriptions/acknowledged` Bildirme, sonraki her değişiklik haberleri ve son sonuçlar, her zaman`_meta`İçinde taşı .`io.modelcontextprotocol/subscriptionId`, ve değer, bu izleme istekinin kimliği ile eşittir.`subscriptions/listen`Ve yeniden çekilmesi mümkün değişmiş veriler.

### 显然的应用层状态

移除协议 Session 绝对不意味着禁止有状态的工作流──Server can generate an opaque state handle (Stanesi Hediye) ve normal Tool 结果中返回它──Client in subsequent调用中将该句柄作为显式参数传入──

Sözcükleri, sertifika konusu ile bağlamak, tahmin edilemez bir rastlantı ve geçerli sonlama süresi vererek, her kullanımda sıkı yetkilendirmek için kullanılır. Bu durum, ağ aktarım katmanındaki konuşmaların özel ve özel doğasında gizlenmek yerine, uygulama katmanında açıkça ortaya çıkar.

```figure
tp-transport-handshake
```

## 动手实践

`code/main.py`仅使用Python 标准库实现一个小巧、合规的现代 Streamable HTTP Server:

```bash
cd code
python3 main.py --probe
python3 -m unittest discover tests -v
```

探针会依次检验:

- 非法 Origin 会被拒绝;
- 服务发现在没有会议ID的情况下顺利完成;
- 传入的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `Mcp-Session-Id`ile`Last-Event-ID`Sessizlikle göz ardı edildi.
- Başlık ile başlıklı başlıklar eşleşmez`-32020`- ...
- 版本不支持时返回 `-32022` ve destekleme sürüm listesi;
- Alınmış kimliksiz  bildirim HTTP geri dön`202`Görevi;
- GET 和 DELETE Lütfen doğrudan HTTP'ye geri dönün`405`- ...
- `subscriptions/listen`长连接建立并带在通知中对应的订阅 ID──

## 交付物

本课交付 `outputs/skill-mcp-transport-migrator.md`◊ Zamanla yapılan protokollerin kaldırılması için kural rehberliği sağlar.`subscriptions/listen`替代裸 GET 流,并使 Legacy 适配层保持清晰独立──

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| stdio | 基于 Client 发起的子进程 stdin/stdout、以换行符分隔的 JSON-RPC 传输 |
| Streamable HTTP | 单一端点架构，其中每条现代消息均为一次全新的 HTTP POST 调用 |
| 请求作用域 SSE (Request-scoped SSE) | 针对单个请求的 POST 响应流，输出相关通知及最终响应后自动关闭 |
| `subscriptions/listen` | 客户端主动开启的长周期 POST 请求，用于接收选择订阅的变更通知 |
| 请求头不匹配 (Header mismatch) | 当镜像请求头与请求体内容不一致时，返回 HTTP 400 与 -32020 报错 |
| 源站校验 (Origin validation) | 针对传入网络连接的 DNS 重绑定防御机制，不能替代身份认证 |
| 显式状态句柄 (Explicit state handle) | 作为普通业务参数传递的应用层 Token，代替底层隐藏的传输连接状态 |
| Legacy 桥接层 (Legacy bridge) | 专门隔离保留的旧版本行为，仅用于向后兼容历史客户端 |

## 延伸阅读

- [MCP Transport Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
