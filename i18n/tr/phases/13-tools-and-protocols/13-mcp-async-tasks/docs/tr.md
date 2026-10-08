# MCP Görevleri  genişleme: Durumsuz çekirdeğin üzerinde yapılandırılmış kalıcılık görevleri

> 无状态 MCP, her işlemin tek bir istek içinde tamamlanması gerektiği anlamına gelmez. 官方 Tasks  extending for long life cycle work provides a clear persisting phrase handle (durable handle)  Server'dan yapılabilir`tools/call`Bu cümleyi geri çevirin.`tasks/get`, ve müşterinin girişleri geçiyor .`tasks/update`- Hayır, hayır. - Hayır, hayır.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 11 (stateless MRTR), Phase 13 · 12 (elicitation)
**Time:** ~90 minutes

## Öğrenme hedefi

-  Strength distinction between protocol transmission layer and the application class of task state.
- Her istek kapasitesini ve`server/discover`中协商 `io.modelcontextprotocol/tasks`扩展──
- Sadece kuruluş tamamlanınca, sunucu tarafından yönlendirilmiş ve yüklenmiş olarak geri döner.`resultType: "task"``CreateTaskResult`- Evet.
- Kullanım`tasks/get` rotasyon, kullanım `tasks/update`提交任务输入,并使用 `tasks/cancel`发起协作式取消──
- 彻底弃旧版中关于 `tasks/status`- Evet.`tasks/result`和 `tasks/list`Eski bir varsayım.
- 通过 POST 响应的 SSE 流使用 `subscriptions/listen`订阅可选的任务变更通知──
- Doğrudur, görev süresi geçiyor, yeniden başlatılıyor, yeniden başlatılıyor, logikayı yeniden başlatılıyor, giriş anahtarı yeniden başlatılıyor ve hatalar yapılıyor.

## Neden Görevler bir genişleme

Görevler başlangıçta deneysel çekirdek özellik olarak 2025-11-25 规范中.`io.modelcontextprotocol/tasks`扩展中, böylece müşteri ve sunucuların ek görev yaşam döngüsüne girmek veya girmek konusunda kendiliğinden seçim yapmasına izin verirken, tüm olaylar için MCP 核心协议ın genişlemesi gerekmez.

Bu genişleme kuralları şu anda görevlerin resmi bir konumu olmasına rağmen, henüz taslakın üzerinde duruyor.

Bir işlemin aşağıdaki özelliklerden biri veya daha fazla olduğunda, lütfen görev kullanın:

- 执行耗时可能超越普通的请求超时值──
- 已由工作队列 (işçi sırası) veya dış iş sisteminin (BİS)
- Müşteri kendi başından sonra tekrar sorgulama yeteneğine sahip olmalıdır.
- Operasyon, uygulama sürecinde kullanıcı veya modelin daha fazla giriş sağlanmasını beklemek için bir süreliğine durmalı.
- 支持取消操作与持久化结果检索是明确的产品功能需求──

Bu nedenle, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, bu süreçte, gerçekte, gerçekte, gerçekte, gerçekte, gerçekte, gerçekte, gerçekte, gerçekte, gerçekte, gerçekte, gerçekte, gerçekte, gerçekte, gerçekte, gerçekte, gerçekte, olan, karmaşıklıklı bir şekilde, gelecektir.

## 无状态核心,有状态应用

MCP 2026-07-28 移除了 `initialize`- Evet.`notifications/initialized`、 anlaşma toplantısı ve `Mcp-Session-Id`Bu kesinlikle yapısal durumlu ürün fonksiyonunu dışlamaktadır.

Görev id  açık bir uygulama durumuna aittir:

- Server, görevden önce geri dönüşü id'i sürdürmek zorunda.
- Müşteri bu kimliği kalıcı olarak depolayabilir ve yeniden başlatıldıktan sonra tekrar sorguya girebilir.
- Bu kimlik aynı kalıcı depolama tabanının herhangi bir sunucu tarafından yönlendirilebilir.
- Her görevde                                                                                                                                                                                                                                                              
- 过期与清理, 字段定义的任务而不是传输层连接的生命周期决定的任务而定义的.

Bu, bağlantıdaki gizli durumla birlikte, işletim düzeyinde gerçek bir fark vardır.

Aşağıdaki dört yaşam döngüsünü açıkça çözmek:

| 状态类别 | 生命周期 | 归属位置 |
|---|---|---|
| 协议元数据 | 单次请求 | `params._meta`，在每次调用中重新校验 |
| 传输层任务 | 单个 stdio 请求或 HTTP 响应 | 具有有界超时期限的正在进行的协调器（in-flight coordinator） |
| MRTR 交互延续 | 单次重试序列 | 受完整性保护的 `requestState`，必要时叠加防重放控制 |
| 持久化任务 | 跨越请求、副本、重启与重连 | 以受权的 `taskId` 为键的共享应用程序存储 |

Görevini kaydetmek, tek bir sürecin hafızasında kalmasını kolaylaştırır. MCP'yi bir durum protokolüne dönüştüremez, sadece uygulamanın çok güvenilir hale gelmesine neden olur.`tasks/get`Bu kayıt, geri dönmeden önce devamlı olarak yazılmalıdır ve her görevi kiracı ve başkası kontrol altında çözmek için aynı paylaşım kayıtlarını bırakmalıdır.

## Yeteneklilik 协商

Müşteriye her uygun istek açıklaması genişletilmiş destek:

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "extensions": {
        "io.modelcontextprotocol/tasks": {}
      }
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "lesson-client",
      "version": "1.0.0"
    }
  }
}
```

Sunucu`server/discover`İçeri dönmek doğru`supportedVersions`、 yetenekleri`ttlMs`和 `cacheScope`Bu genişlemeyi yapabilmek için, araçları açıkladığından, zorunlu bir şekilde de gerçekleştirildi.`tools/list`◊该结果返回确定性的 `generate_report`描述符、合法的 nesne 类型 `inputSchema`- Evet.`resultType: "complete"`、server kimliği ve kamu 缓存提示──

Eğer müşteri açıklamadı, ama görev yöntemi kullanıyorsa, sunucu geri dönecektir.`-32021`(Memleketlik İsteğe bağlılık eksikliği),并将 `data.requiredCapabilities`设为 `{"extensions":{"io.modelcontextprotocol/tasks":{}}}`△ desteklenmeyen anlaşma ∞`-32022`Kesinlikle değil.`supported`ile`requested`Görev; eksik veya olmayan satırların versiyonu geri döndü`-32602`- Evet.

没有 JSON-RPC `id`Bu mesajlar, iletiye bağlıdır. Alıcı tarafından işlenir, ancak zaten JSON-RPC gönderilmiyor. Sonuçlar da yanlış gönderilmiyor.`202 Accepted`- Evet.

Şu anda sadece var.`tools/call`支持以任务形式增强执行――, gelecekte talepleri yeniden yazmak için iç iç çekimleri makul şekilde tasarlayın.

## Server 主导的任务创建

旧版的客户端标志 `params._meta.task.required`已完全移除──现在的机制是:客户端声明支持此扩展,随后由服务器自行决定某具体的 `tools/call`Yapılmadı mı görev olarak?

Lütfen:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_report",
    "arguments": {"size": "large"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

响应:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "task",
    "taskId": "tsk_786512e29e0d",
    "status": "working",
    "statusMessage": "Preparing report outline.",
    "createdAt": "2026-08-21T10:30:00Z",
    "lastUpdatedAt": "2026-08-21T10:30:00Z",
    "ttlMs": 900000,
    "pollIntervalMs": 1000
  }
}
```

Bu kadarı bile bile bilebilsin.`tasks/get`解析读取之前,server 绝不能提前返回该句柄──最終一致性存储系统中,必须等待其具有可读可见性 (okuyucu görünürlük) 后再做应答──否则客户端 获得一个看起来合法的 id 却会立即遭遇未找到的错误──

Görev 响应 has 非主动请求未请求的特征,即客户端并非显然要求进入任务模式;但它绝非未经协商的未经协商的未经谈判) :

## Görev yapı

Her görevde aşağıdaki bölümler vardır:

- `taskId`: Server tarafından oluşturulan sabit tanımlayıcı;
- `status`:取值为 `working`- Evet.`input_required`- Evet.`completed`- Evet.`cancelled`Ya da`failed`- ...
- `createdAt`ile`lastUpdatedAt`:ISO 8601 时间;
- `ttlMs`: yaratılmasından beri geçen süre (mm), veya`null`Üst sınır gösterme;
- Seçilebilir`pollIntervalMs`:server 当前建议的最小轮询间隔;
- Seçilebilir`statusMessage`: user or model'ın üst aşağıdaki tanımı:

特定状態专用字段 sadece ilgili olarak ortaya çıkmıştır:

- `input_required`包含 `inputRequests`- Evet.
- `completed`包含原始请求的 `result`Yapı:
- `failed`包含 JSON-RPC 的 `error`- Önemli bir şey.

Müşteriyi takip etmesi gerekir .`pollIntervalMs`❖Server aşırı aktif askeri askeri sınırlama akışına karşı hareketli olabilir ve ⇒ yaşam döngüsü içinde hareketleri ayarlayabilir ⇒

## Kullanım/Alım  Soru sorgulaması

Müşteri istekleri:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/get
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tasks/get",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

`tasks/get`Bu yeni RPC'nin kendiliğinden başarıyla tamamlanmıştır, bu nedenle en dış kattaki yanıtlar her zaman içerir.`resultType: "complete"`                                                                                                                                                                                                                                                              `status`Hala yapabilirim.`working`Ya da`input_required`- Evet.

Bu farklılık, sık görülen çözüme hataları önlemek için etkili olabilir:

```text
result.resultType = complete    表示 tasks/get RPC 本次调用完成
result.status = working        表示其代表的后台作业仍在运行中
```

Şimdiki kurallar yok .`tasks/result`方法──当任务 完成时,下一次 `tasks/get`响应会直接在 `result`字段内嵌原始的  字段内嵌原始的 `CallToolResult`- ...

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "completed",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:34:12Z",
  "ttlMs": 900000,
  "result": {
    "resultType": "complete",
    "content": [
      {"type": "text", "text": "Generated large report with approved outline."}
    ],
    "structuredContent": {"size": "large", "approved": true},
    "isError": false,
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "tasks-demo",
        "version": "1.0.0"
      }
    }
  },
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "tasks-demo",
      "version": "1.0.0"
    }
  }
}
```

Dışarıdaki `resultType`Göster`tasks/get`RPC 顺利执行;内层的 `result.resultType`Bu iç katın ayırt edici cihazı zorunlu bir şekilde gereklileştirilmiştir.`CallToolResult`Aynı şekilde kendi yükünü de taşımalıdır.`io.modelcontextprotocol/serverInfo`Bu ders, normal yüklerin bir türü olmayan bir şekilde saklanmadan tamamıyla saklanacak.

Şimdiki kurallar yok .`tasks/list`◊ konuşma olmadan sunucu  güvenli bir şekilde hangi görevlerin bir bağlantı etki alanı listesinde görünmesi gerektiğini tahmin edemez. ◊ tarihi kayıtların uygulamaları açık bir şekilde sahiplik kurallarına karşı gelen ◊ yetkili bir işletme alanı aracı ortaya çıkarmalıdır.

## Görevler gerçekleştirilmesinde yapılan girişler

Görev içi giriş, çekirdek MRTR'ye benzer görünüyor, ancak farklı bir süreç uzatma mekanizması kullanılmıştır.

### 任务创建前所需的输入

Asıldan `tools/call`İçine dön .`resultType: "input_required"`Müşteri, bu işlemlerin tümünün son bulunduktan sonra, sadece bir süreli olarak görevler oluşturdu.

### 任务创建后所需输入

Görev  Durumu `input_required`❖ Geçmiş`tasks/get`Açıklama belirlenmiyor`inputRequests`Müşteri tarafından.`tasks/update`提交响应──Müşteri **不需要**重试原始的 `tools/call`- Evet.

快照:

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "input_required",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:31:00Z",
  "ttlMs": 900000,
  "inputRequests": {
    "approve_outline": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Approve the generated report outline?",
        "requestedSchema": {
          "type": "object",
          "properties": {"approved": {"type": "boolean"}},
          "required": ["approved"]
        }
      }
    }
  }
}
```

Yenilik:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/update
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tasks/update",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "inputResponses": {
      "approve_outline": {
        "action": "accept",
        "content": {"approved": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

Başarılı cevap bir boşluktan oluşur.`resultType: "complete"`❖Devam değişimleri son olarak gerçekleşebilir, müşterinin sorgulamasını veya dinlemesini sürdürmesi gerekir.

Her biri .`inputRequests`Bu, tüm yaşam döngüsünde tek bir anahtar olmalı.`tasks/get`快照可能会显示相同未决密钥;客户端应在 UI 层面进行重复,而服务器则应忽略针对未知已覆盖或已执行的密钥的响应.`input_required`Tüm gerekli anahtarlar cevaplanana kadar.

## 取消操作属于协作式取消 取消

`tasks/cancel`Bu onay, bir işçinin hemen durduğunu garanti etmez. İşin bir adım daha önce tamamlanmış, bir an önce sinyal kaldırılmamış veya daha sonra tamamlanmamış olması mümkün.

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/cancel
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tasks/cancel",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

Bu üç görevi yerine getirmek için,`Mcp-Name`Lütfen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `params.taskId`, yerine重复 JSON-RPC 方法名──`code/main.py`- Evet .`make_http_request`Bu kuralları kabul etmiştir.

Bu ders örneğinde çalışanlar hemen cevap olarak kaldırılır, böylece yeniden çağrılmak için 等性── üretim ortamındaki müşteri  yine de işbirliği biçiminde kaldırılmalıdır, sadece bir onayla cevap olarak 

kullanmayın`notifications/cancelled`Bu bilgi, başvuru sınıfına aittir.

Bu farklılık, yolların sınırlarında önemlidir. İstem kaldırma, yürütülen tek bir JSON-RPC işlemine veya istek alanının HTTP yanıtlarına yöneliktir.`tools/call`Geri döndü .`resultType: "task"`Bu talep sona erdiğini, aktarım kanalının kapatılmasını ne yönlendirebilir ne de devamlı olarak bitirebilir.`tasks/cancel`Yeni bir RPC'yi taşıdı.`params.taskId`, `Mcp-Name`Görevini kaldırma şekli, görevinin sonuna kadar yolculuk, işçiyi durdurduğunu belirtmek, işçiyi durdurduğunu belirtmek ve tekrar onaylamak için bir görüntü oluşturur.

Bu nedenle, net关lar, istek koordinatörlerini) görev yolunun listesi ile ayrı ayrı farklı veri tablolarında depolmanları gerekir.[第 29 课：MCP 可靠性、取消与流控](../../29-mcp-reliability-cancellation-and-flow-control/docs/en.md)Bu iki yolun rekabet ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇

## Seçili bildirim gönderme

轮询是基准方案──期望推送更新客户可发送带有任务 id 列表的 `subscriptions/listen`◊ Streamable HTTP 下'de, bu bir POST istek, onun cevabı bir istek etki alanı SSE 流── yoktur bağımsız GET 事件流, ne var var ihtiyaçlarını korumak için protokol toplantısı──

Sunucuya geçiyor .`notifications/subscriptions/acknowledged`Kabul edilen kimlik listesini onaylayın.`notifications/tasks`发送完整的快照──确认通知与每个任务 通知都在 `_meta`İçinde taşı .`io.modelcontextprotocol/subscriptionId`(其值等于)`subscriptions/listen`Diğer taraftan, her görev 通知都等价于此时调用 `tasks/get`Geri dönüşün hızlı bir şekilde.

Müşteri  hala açıklamalı Görevler  genişleme                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `Last-Event-ID`- Evet.

## 失败语义

Lütfen iki aşamalı hatayı doğruyu doğruyu ayırt edin:

### 协议错误

无效的方法参数或未知任务 id 会返回 JSON-RPC 错误,通常为 `-32602`◊ eksikliği genişleme destek geri dönüş`-32021`Ve veriler içinde, gerekli kapasiteyi taşıyıp,

### 任务执行结果

- - Evet .`isError: true`结果仍然属于 `completed`任务, çünkü araç 调用已经产出了其定义的结果结构──
- Geç saatli bir uygulama sırasında meydana gelen JSON-RPC protokolü sınıfı hataları görevi içeriye soktu .`failed` durumu ve `error`字段下记录该 JSON-RPC 错误──
- Kullanıcı reddediyor .`cancelled`、 bir reddedilen sonuç veya başka bir alanda belirli güvenlik ürünleri belirtmek için belgelerde belirtilmiş bir kayıt seçmek için.

## Dönüşüm ve mülkiyet

 minimum olarak kalıcı bir depolama görevinin id·status·time、ttl·轮询间隔、原始操作所有权、结果或错误、未决输入请求以及所有已发行的输入密钥──

Depo anahtarı, yetkili kiracı ve sahibi oluşturmak veya çözmek zorundadır.`tasks/get`- Evet.`tasks/update`- Evet.`tasks/cancel`及订阅调用中都必须核验所有权──

`ttlMs`Bu, oluşturma sırasında etkin sürenin gerçekleşmesi ve hareketli ayarlamaların gerçekleşmesi anlamına gelir. Görev görünen bir güncelleme yapmayı durdurduğunda, müşteri onu temel süper zaman temelliği olarak değerlendirebilir.

原子書き込み又は事务機構を採用します. 本課前文書き込み临时文書再執行原子再命名します.

```figure
tp-task-lifecycle
```

## Çözüm

`code/main.py`实现一个确定性的任务服务:

- `server/discover`Geri dön .`supportedVersions`、缓存提示与 Görevler 扩展──
- `tools/list`返回确定性、可缓存的 `generate_report`描述符,附带合法输入方案──
- `tools/call`Geri dön .`resultType: "task"`之前完成任务的创建与持久化──
- Yeni bir servis örneği aynı görevleri yeniden yükleyerek yeniden başlama kabiliyetini gösterdi.
- `tasks/get`返回完整的任务快照──
- İşçi`working`状态流转至 `input_required`- Evet.
- `tasks/update`收表单响应并返回空的完整确认──
- İşçi depo  内嵌 `CallToolResult`(özünü içerir)`resultType`Sunucu olarak), sonra durum değişir.`completed`- Evet.
- Bu gerçekleşmiş bir süreçtir.`tasks/cancel`具備等性──
- HTTP yapılandırıcı `tasks/get`- Evet.`tasks/update`和 `tasks/cancel``Mcp-Name`头统一设置为 `params.taskId`- Evet.
- 通知助手函数使用 `notifications/subscriptions/acknowledged`ile`notifications/tasks`, 均标注有听 请求 id──
- 无 id 的通知不产生任何 JSON-RPC 响应──

İşçi, arka planda değil, açık bir ilerleme durumunu kullanıyor. Bu, her durumun değişmesini belirgin hale getiriyor ve protokol örneğini ve mesaj sıra mekanizmasını net bir şekilde ayrıştırıyor.

## Kullanım ve çalışmalar

Bu işlevler:

```bash
cd phases/13-tools-and-protocols/13-mcp-async-tasks/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果序列:

```text
id=0 resultType=complete status=ack
id=1 resultType=task status=working
id=2 resultType=complete status=working
id=3 resultType=complete status=input_required
id=4 resultType=complete status=ack
id=5 resultType=complete status=completed
```

同时验证在现代服务中调用 `tasks/status`- Evet.`tasks/result`和 `tasks/list`会返回方法未找到 (Yol-bulmadık) 错误──
验证 `tools/list`具有确定性,且当前所有HTTP任务 方法均通过 `Mcp-Name`Görev kimliği.

## 交付产物

`outputs/skill-task-store-designer.md`现已提供适应扩展的设计:包括能力 协商、返回前必须持久化 (bkz: müzakere etmesi gerekir, geri dönüşe kadar kalıcı olması gerekir) 现代方法集、输入更新流、所有权隔离、过期管理、取消处理、订阅机制以及废弃实验性方法的平稳迁移方案──

## 课后练习

1. 增加第二未决输入键──发送包含部分字段的 `tasks/update`, iki anahtar 均作答完毕之前, görev hala devam ediyor`input_required`Durum:
2. Bu, bir şirketin mülkiyetini bir şekilde ele geçirmek için kullanıldığı bir yerden geçerlidir.
3. 引入带过期时间的工人租约――证明两个服务实例无法并发完成同一个任务――
4. Çı`subscriptions/listen`实现 POST 响应的 SSE 适配器──切勿引入 GET 端点、`Last-Event-ID`Ya da oturma.
5. 增加过期清理逻辑── ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒     ⇒ ⇒    ⇒ ⇒     ⇒     ⇒ ⇒                                                                                                                                                                                                                                          

## 关键术语

| 术语 | 当前扩展中的含义 |
|------|----------------------------------|
| Tasks 扩展 | 用于持久化异步工作的可选 `io.modelcontextprotocol/tasks` capability |
| `CreateTaskResult` | 对符合条件请求返回的、由 server 主导的 `resultType: "task"` 响应 |
| `tasks/get` | 轮询完整的当前任务快照，包含终态结果或未决输入 |
| `tasks/update` | 针对任务当前未决的 `inputRequests` 提交响应 |
| `tasks/cancel` | 确认接收到协作式取消的意图 |
| `input_required` | 表示任务正在等待 client 提供输入的任务状态 |
| `pollIntervalMs` | Server 建议的下次轮询前的最小等待时长 |
| `ttlMs` | 自任务创建起计算的有效时长 |
| 返回前持久化（Durable-before-return） | 必须在 task id 具备可解析可读性之后才能发出其句柄的规则 |
| `notifications/tasks` | 在已订阅的 SSE 响应流上投递的可选完整任务快照 |

## 旧版兼容性

2025-11-25  deneysel programlar müşteri isteklerini güçlendirmek için kullanıldı`tasks/status`- Evet.`tasks/result`Ve seçilebilir.`tasks/list` Lütfen sadece versiyon kilitliğine 适配器中保留这些名称──现代客户端 应声明扩展能力,接收服务器 主导下发的句柄,轮询 `tasks/get`, geçiyor .`tasks/update`提交输入,并从任务快照中读取最终结果──

## 延伸阅读

- [Official MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
