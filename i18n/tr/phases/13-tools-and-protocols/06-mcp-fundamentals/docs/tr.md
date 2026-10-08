# MCP 基础: statesiz istek ve JSON-RPC

> Modern MCP Ne el ele ne de anlaşma Sessiyonu. Her istek bağımsız olarak yeterli veri taşımalıdır.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 01 至 05（Tool 接口与函数调用）
**Time:** ~55 分钟

## Öğrenme hedefi

- 区分 MCP's Server 原语(primitiv) Client端特性的差──
- Çekilme`2026-07-28`规范构建合规的 JSON-RPC 2.0 Dilek ve yanıt Kapaklık
- Bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümü ile ilgili olarak, bu uygulamaların tümüyle ilgili olarak, bu uygulamaların tümüyle ilgili olarak, bu uygulamaların tümüyle,
- Kullanım`server/discover`İşleme`UnsupportedProtocolVersionError`, herhangi bir başlangıç el ele ihtiyacı yok.
- 完整追踪单个独立请求从元数据校验到返回结果的生命周期──

## 问题背景

Aynı işletim sürecinde veya HTTP Worker'de, MCP Server farklı istemciden farklı yeteneklere sahip iki talebi sürekli olarak alabilir. Eğer Server bir talebi belirttiği üst üyenin üzerine kalırsa, yanlış bir şekilde uygulama yetki kurallarına veya uyumsuz bir rapor yapısına geri dönebilir.

MCP `2026-07-28`规范 bu farklılıkları tamamen ortadan kaldırdı:**协议核心完全无状态**❖ Sunucu, mevcut talebi nasıl ele alacağını belirlemek için sadece mevcut talebi kendisinden almalıdır, ve kesinlikle bağlantıların tarihi kayıtlarına bağlı değildir.

Bu, zihinsel modelini tamamen değiştirdi. Eski zamanın sırası: önce bağlantı kurmak, sonra el ele tutmak, son olarak iş operasyonu başlatmak.

1. Müşteri, kendi kendini tanımlayan bir bağımsız talebi gönderir.
2. Server 校验该请求携带的协议版本和客户端能力──
3. Server 处理对应的方法──
4. Server 返回带类型标识的结果(typed result) veya JSON-RPC 错误──

Sonraki talebimiz bu süreçte geri dönmeye başlar.

## 核心概念

### Server 原语(Server Primitivler)

MCP Server 暴露三个核心原语:

1. **Tools（工具）**Modelle tarafından yönlendirilmiş işlemler, geçiyor.`tools/list`发现并由 `tools/call`- Evet.
2. **Resources（资源）**URI'ye göre,`resources/list`发现并由 `resources/read`- Ne?
3. **Prompts（提示模板）**: kullanılabilir modular, geçiyor `prompts/list`发现并由 `prompts/get`染──

Kökler, örnekleme ve kayıtlama`2026-07-28`模式中为了兼容性予以保留,但已被明确标记为废弃 (废弃) ⋅全新实现中,应使用显式的工具或资源 输入替代 Roots,使用直接模型提供商 API 替代样本化,使用 stderr或 OpenTelemetry 替代登录化.

### JSON-RPC zarfları

MCP 底层 JSON-RPC 2.0 kullanımı:

- Lütfen.`{jsonrpc, id, method, params}`
- 响应( Cevap):`{jsonrpc, id, result}`Ya da`{jsonrpc, id, error}`
- 通知(Bildirme):`{jsonrpc, method, params}`,无 `id`字段

Dilekçelerden`id`Sadece bağlantı için kullanılan tek bir cevap, herhangi bir protokol seviyesinin oturumu oluşturmaz.

### Bulma isteği

Her çağdaş istek var .`params`İçeri bir tane getir .`_meta`Görevi:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/list",
  "params": {
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

协议版本号(`protocolVersion`) ve Müşteri 能力`clientCapabilities`) is mandat必填的── Müşteri olarak(`clientInfo`) öneriler için, kendiliğinden gösterilen ve denetlenen bilgilere ait, kesinlikle güvenlik belgesi olarak kullanılamaz.

Server  strictly banned from previous request、studio  process environment、HTTP  connection or transmission layer request头中单独推断这些元数据──

### 完整结果与 Server Kimliği

Her başarının modern sonuçları içerir .`resultType`◊常规的终态结果使用 `"complete"`❖Server de sonuçlar için kendi kimliğini açıklamalı:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "complete",
    "tools": [],
    "ttlMs": 30000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "notes-server",
        "version": "1.0.0"
      }
    }
  }
}
```

`tools/list`- Evet.`resources/list`- Evet.`prompts/list`- Evet.`resources/templates/list`- Evet.`resources/read`Ve `server/discover`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `ttlMs`(Mili saniye hayatta kalmak için) ve `cacheScope`(缓存范围) ◦ Güvenliğin belirtilmiş değeri `ttlMs: 0`和 `cacheScope: "private"`◊ listenin sonuçlarındaki metinler kesinlik düzenini (deterministik düzenleme) kullanmalı, böylece eşit fiyatların yanıtları sabit bir depolama anahtarı ve uyumlu bir model oluşturur.

### 无握手的服务发现 (El sıkışmadan keşfetmek)

Her zamanki sunucuyu gerçekleştirmek zorundadır .`server/discover`Müşteri, işletme yöntemini başlatmadan önce kullanıp elde edebilmektedir:

- `supportedVersions`:Server 支持的协议版本列表
- `capabilities`:Server  provided能力字典
- Seçili kullanım açıklaması dosyası`instructions`)
- Sonuçlar`_meta`Orta Sunucu Kimlik Kimliği
- 缓存提示`ttlMs`和 `cacheScope`)

Servis çok yararlı ama ziyaret için şart değil. Müşteri doğrudan gönderebilir.`tools/list`İlk istek olarak, bu istek kendiliğinden tamamıyla bir protokol sürümü ve Müşteri kapasitesini taşıdı.

Eğer istek versiyonu desteklenmiyorsa,Server  JSON-RPC  errorcode `-32022`Ve veriler:

```json
{
  "requested": "2027-01-01",
  "supported": ["2026-07-28"]
}
```

Müşteri  seçmek  birlikte desteklenen modern protokol versiyonu, ve yeni JSON-RPC istek kimliği kullanmak  yeniden deneme yapmak

### Tek seferde istekte olanın tam yaşam döngüsü

Lütfen aşağıdaki sıraya göre takip etmesini yapın:

1. 解析单个 JSON-RPC Envelopes──
2. 校验 `jsonrpc`字段为 `"2.0"`Varlıklı .`id`- Evet .`method`Çıkışlı,`params`- Evet.
3. 校验 `params._meta`İçinde mevcut olan: if data missing or format illegal, return error code `-32602`- Evet.
4. HTTP sınırlarında, protokol sürümünün başlıkında, yöntem başlığı ve yanıtlayıcıya göre, isim istek başlığı ile istekçiye uyumlu olup olmadığını görerek, uyumsuzluk varsa hemen geri gönderilmelidir.`-32020`(Bunun bir versiyon değeri bile desteklenmiyor)
5. Eğer istekle ilgili bir sürüm desteklenir ama bu sunucu uyumlu değilse, geri dön.`-32022`- Evet.
6. 检查所需能力, sonra göre `method`路由并校验方法专有参数──
7. Bu işlemler, bir süre sonra gerçekleşecek.
8. 返回带有 Server 身份信息的完整结果(tam sonuç)。
9. 立即遗忘当前请求作用域的协议元数据──

Bu zorlu düzen, farklı yapılandırmalar arasında anlaşılmazlıklar yaratmayı mümkün kılar.`Mcp-Name: notes.read`Aynı zamanda kaynak istasyonunun da gerçekleştirilmesi.`params.name: notes.delete`                                                                                                                                                                                                                                                              

关闭 stdin 关闭 HTTP 响应连接 关闭 HTTP 响应连接 关闭 关闭 HTTP 响应连接 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 

### 显式 Miras 兼容

`2025-11-25`及更早版本依赖 `initialize`- Evet.`notifications/initialized`、 Bağlantı Bağlantıları, yanı sıra erken Streamable HTTP'de seçilebilir Sessiyonlar──当双时代(iki çağ) Müşteri ile eski sunucu 通信 sırasında, bu mekanizmalar hala değerlidir──

Ancak iki çağın tamamen ayırılması gerekir. Modern istekler zorunlu her istek için veri tanımlamaktadır. Eski sürüm bağlantıları yalnızca özel bir belge düzenlemesi yoluyla geri dönüş yolları ile belirlenir.**绝不能把 `initialize` 当作连接 `2026-07-28` Server 的默认行为。**

```figure
mcp-tool-call
```

## 动手实践

`code/main.py`Hiçbir çerçeveye bağımlı olmayan bir şartta, standart kütüphanesi oluşturma, deneme ve takip ile modern MCP 报文――运行命令:

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Çıkışın içinde重点观察 üç önemli değişimsizliğe sahip:

- Her dileği tamamıyla tekrar ediyoruz .`_meta`- Evet.
- Her başarı sonuçları içerir .`resultType: "complete"`Server Kimliği içermiyor.
- 列表結果具有严格确定性的排序,并附带显式的缓存提示 (TTL 和 Cache Scope)

## 交付物

本课交付 `outputs/skill-mcp-handshake-tracer.md`                                                                                                                                                                                                                                                              

## 练习与思考

1. Bir istek protokol versiyonunu değiştirmek için `2027-01-01`❖ Kesinlikle yanlış anlaşıldı.`-32022`, ve geri verilen veriler 字段中正确广播了支持的版本列表──
2. İkinci istekten çıkarıldı.`io.modelcontextprotocol/clientCapabilities`❖ Server'ın ilk istek içinde açıklama yeteneğini asla tekrarlamayacağını doğrula.
3. 颠倒内存中的工具注册表顺序──确认 `tools/list`输出 yine de tamamen aynı kesinlik sırası korunmaktadır.
4. - Ben de .`cacheScope`- Evet .`public`修改为 `private`                                                                                                                                                                                                                                                              
5. 编写一个省略 `clientInfo`Test Utilisası: Bildirme talebi hala geçerlidir, çünkü Müşteri Kimliği sadece tavsiye için değil zorunlu bir konudur.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 无状态协议 (Stateless protocol) | 每一个请求都自包含解析它所需的完整元数据 |
| 请求元数据 (Request metadata) | 在 `params._meta` 中携带的协议版本、Client 能力声明及推荐的 Client 身份 |
| `server/discover` | 强制实现的 Server 方法，用于声明支持版本、能力、使用说明及身份 |
| `resultType` | 每个现代成功结果上的类型鉴别字段（如 `"complete"`） |
| 可缓存结果 (Cacheable result) | 必须包含 `ttlMs` 与 `cacheScope` 提示的查询或列表结果 |
| 协议时代 (Protocol era) | 现代基于每次请求元数据的模式，或旧版连接作用域初始化的模式 |
| 传输生命周期 (Transport lifetime) | 进程、连接或响应流的物理生存周期，不等同于协议 Session |
| `-32022` | 不支持的协议版本错误码，返回请求的版本及支持的版本列表 |

## 延伸阅读

- [MCP Architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture)
- [MCP Base Protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
