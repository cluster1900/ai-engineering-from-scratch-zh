# MCP Resource 与 Prompt:无状态 Server 的可寻址上下文

> Araç, işlem gerçekleştirmek için kullanılır. Kaynak, açığa çıkarabilir içeriği kullanılır. Kullanıcı seçimi mesaj şablonunu kapsamaya kullanılır.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lesson 07 (Building an MCP Server), Phase 13, Lesson 09 (MCP Transports)
**Time:** ~60 minutes

## Öğrenme hedefi

- Kullanıcının niyetine göre araç, kaynak ve tescil arasında doğru seçim yapılmalıdır.
- Zorlayıcı talepler ile.`server/discover`声明资源与快速能力 接口──
- 构建确定性的 `resources/list`ile`prompts/list`Sonuçları geri getirmek.
- 合理应用 `ttlMs`ile`cacheScope`, belirli kullanıcı verilerini sızdırmaktan kaçınmak için:
- 遇到无效或未知资源 URI 时返回 JSON-RPC 错误 `-32602`- Evet.
- Açıklama`subscriptions/listen`POST 响应流,并通过订阅 ID 关联每个事件──
- Kaynak  içeriği ve hızlı 模板一律视为不可信的服务器 输出──

## Kullanıcı tarafından gönderilen

MCP'yi kullanmanın en kolay yolu doğrudan kod başlatma işleminden ibarettir. Veritaban sorguları bir araç haline getirilmiştir.

Öncelikle kimden seçileceğini ve neyi bekleyeceğini sor.

| Primitive | 主要意图 | 选择主体 | 典型结果 |
|---|---|---|---|
| Tool | 执行某项操作 | Model 或应用程序 | 结构化动作结果 |
| Resource | 读取特定 URI 的内容 | Host、应用程序或用户 | 文本或二进制内容 |
| Prompt | 启动可复用的消息工作流 | 用户（通过 Host UI） | 一条或多条 prompt 消息 |

位于 `notes://note-1`Not bir kaynak çünkü bu da adreslenebilir bir içeriğidir.`delete_note`Bu bir araç çünkü değişir.`review_note`Bu bir sürpriz, çünkü kullanıcı tarafından seçilen bir verileme iş akışı vardır.

Sadece işlevsel olarak görünmek için aynı işlevi aynı anda bu üç kişiye göstermek için değil. Her bir yüzey eklenmesi için ek keşif, yetki, depolama, hata işlem, test ve dosya bakım maliyetleri gerekmektedir.

## 2026-07-28 无状态信封

Bu dersi MCP 协议 versiyonu için`2026-07-28` Bu düzen düzenlemesinde, başlangıç el sıkışması veya protokol seansı yoktur  protokol toplantısı  Her istek de saklıdır `_meta`键中携带其协议版本和客户端功能──

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

Sunucu  gerçekleştirilmelidir `server/discover` Resurs ve prompt yetenekleri, gerçekleştirilen tanımlama ve cache ipucuları (cache ipuçları)  Müşteri doğrudan diğer yöntemleri kullanabilir, ancak keşif  müşteri  UI'yi inşa etmeden önce sabit bir hızlı görüntü elde edebilmektedir.

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "resources": {"listChanged": true, "subscribe": true},
    "prompts": {"listChanged": true}
  },
  "ttlMs": 3600000,
  "cacheScope": "public"
}
```

常规结果会声明 `"resultType": "complete"`◊ 响应`_meta`Görüşmek için .`io.modelcontextprotocol/serverInfo`标识服务端的实现信息──该信息用于诊断排错,不是身份识别权凭证──携带未支持协议版本的请求将回复 `-32022`错误,同时带上所请求的版本以及服务器 支持的版本列表──

无状态契约会重塑你的设计直觉――列表查询不能依赖单条连接上前调历史――鉴权凭证作为请求输入可以改变返回的可见集合,但连接历史绝不能影响结果――

## Kaynakı is stabil URI 契约

Kaynak URI tarafından tanımlanmıştır.

良好的 URI 应具有的属性:

- 足够稳定,可以加入书签或在多次请求之间传递──
- 划分在服务器的专有命名空间 (name space) 下。
- 独立于具体进程 ID或连接──
- Arşiv ziyaretinden önce önce test edilmiş.
- Her zaman okuduğumda da yetkililik hakkı veriliyor.

`notes://note-1`优于                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `note-1`Çünkü adı açık. Dosya sunucusu kullanılabilir.`file://`URI, ancak çözümlü sembol bağlantıları ve ilişkili yollardan sonra, düzenli olarak düzenlenmiş bir katalog sınırını sıkı bir şekilde kontrol etmesi gerekir.

`resources/list`返回调用方当前可见的资源──必需按照稳定键 (örneğin URI) 排序──确定性的顺序可以防止缓存震荡击穿 (缓存震荡) 缓存流失 (cache misses) 快照漂移以及主机UI 在刷新时发生跳动──

```json
{
  "resultType": "complete",
  "resources": [
    {
      "uri": "notes://note-1",
      "name": "Architecture decision",
      "description": "Why the service uses a stateless boundary",
      "mimeType": "text/markdown"
    }
  ],
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

`resources/read`返回一个或多内容项──未知URI 不代表读取成功但内容为空──当前资源规范将无效或未知资源URI JSON-RPC 无效参数,错码为`-32602`- Evet.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32602,
    "message": "Unknown or invalid resource URI",
    "data": {
      "uri": "notes://missing"
    }
  }
}
```

Bu ayrım, müşterinin kaynakların mevcut olmayan ve geçerli olmayan belgelerle açıkça ayırt edebilmesini sağlarken, aynı zamanda, beklenmedik şekilde daha geniş çaplı aramalara geri dönmesini önler.

### Kaynak 模板

Kaynak 模板, bir 族带参数 URI'yi tanımlamak için kullanılır.`notes://projects/{project}/decisions/{decision}` Müşteriye  nasıl geçerli bir adres oluşturulacağını söyleyin, tüm kararlarını bir kez listelenmeden 

模板, incelemeyi kolaylaştırmak anlamına gelmez. 模板, çözme değişikliği, yürütme tanımlama hakkı, uzunluğu ve karakter sınırlamalarını zorunlu kılmak, güçlü tipli parametreler kullanarak depo sorgularını oluşturmak değildir.

### İçerik:

Kaynak 文本可能包含即时注入、密钥、误导性命令或恶意格式的标记──主机 应保留来源追踪(来源),并将资源 内容一律视为数据──服务器 应限制内容大小、返回准确的MIME 类型、脱敏调用方无权访问的字段,并避免返回无关记录──

## Hızlı kullanıcı kontrolü modülü

MCP prompt 专为用户显式选择而设计──Host bunları 染为斜命令 (slash komutları) 、菜单项或工作流按──协议本身不限某种特定的 UI 表现形式──

Aynı talep hakkı için aşağıdaki`prompts/list`Her bir istek için sabit bir isim, kullanışlı bir açıklama ve ev sahibi tarafından ayarlanabilmesi gerekir.`prompts/get`之前收集输入的参数声明。

```json
{
  "resultType": "complete",
  "prompts": [
    {
      "name": "review_note",
      "title": "Review a note",
      "description": "Review one note for a named concern",
      "arguments": [
        {
          "name": "uri",
          "description": "The note resource URI",
          "required": true
        }
      ]
    }
  ],
  "ttlMs": 600000,
  "cacheScope": "public"
}
```

`prompts/get`Bu, konaklayıcının sistem talimatlarını değiştirmeyecek. Konaklayıcının geri dönüş mesajının nasıl modelde girmesi konusunda son karar yetkisi vardır ve her zaman kendi güvenilirlik stratejisini daha yüksek önceliklere sahip tutmaktadır.

Sunucu sınırlarında sert bir sınavı 参数。Sunucuda alıntılanan URI 直接読み取資源と相等の識別権チェック。切勿让 prompt 成为資源の周回 访问制御の側信道。

## 缓存提示正确性 bir parçası

`ttlMs`Müşteriye bildirim veriyorum.`cacheScope`Bu kayda kim paylaşabilir?

| 范围 | 含义 | 典型用途 |
|---|---|---|
| `public` | 在鉴权许可的前提下可在多用户间复用 | 公共 prompt 目录 |
| `private` | 绑定到请求发起用户或凭证上下文 | 用户名下的私有笔记内容 |

Verilerin değişim sıklığına ve geçmişi eskiye neden olabilecek hasarlara göre TTL seçmek için kullanılır. Halkın istedikleri bir an için, kayıtlar 5 dakika için, özel notlar için ise 1 dakika için kullanılabilir.

MCP 规范中 `cacheScope`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `public`和 `private`❖ Duygusal gizli veya çok sık değişen sonuçlar için geri dönmek gerekir `cacheScope: "private"`配合 `ttlMs: 0`Daha sonra, ev sahibi tarafından depolama stratejisinde daha sıkı bir şekilde kullanılmış.`no-store`Ben MCP 规范中 değilim`cacheScope`取值──

缓存提示永远不能代替鉴权――缓存键必须包含所有影响可见性的请求维度,包括租户(租户)、用户、权限范围(scope)、语言区域(局部) 以及分页游标标(页面标标 (页面标标) ⋅ Eğer paylaşım缓存 güvenli bir şekilde bu boyutları ifade edemezse, lütfen kullanın`private`配合 0 TTL, ve host 层实施 no-store 策略──

## 订阅 客户端发起的响应流

Modern bir abonelik modeli, önceki birini değiştirdi.`resources/subscribe`RPC ve eski sürümler HTTP GET'in olay端点¬leri üzerine kuruluyor.

Müşteri olarak geleneksel JSON-RPC istek biçimi ile gönderilmek`subscriptions/listen`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊   ◊ ◊      ◊                                                                                                                                                     `notifications`Objective is a white list──Server 绝绝不能发送未经请求的通知类型──

```json
{
  "jsonrpc": "2.0",
  "id": 17,
  "method": "subscriptions/listen",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    },
    "notifications": {
      "resourcesListChanged": true,
      "promptsListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

İtiraf et, İtiraf et.`notifications/subscriptions/acknowledged`通知──                                                                                                                                                                                                                                                              

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "notifications": {
      "resourcesListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

Sonraki akıştaki her olay aynı veriyi taşıyor:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "uri": "notes://note-1"
  }
}
```

通知表明资源 已发生变更──客户在当前的鉴定权约束下通过 `resources/read`Bu kaynakla ilgili yeni bir bilgi alınmıştır.

Çok sayıda abone aynı stüdyoyu paylaşabilir, yollar, abonelik kimliği, müşteriye birçok yolla cevap vermesini sağlar. HTTP'de, kapanış cevap akışı, kapanış akışı, kayda geçebilir.`resultType: "complete"`响应。

切勿将订阅流当作协议会话(protocol session) kullanımı。后续的读取操作仍然是完整的独立请求,能够路由至任何健康的服务器 实例。

```figure
t3-primitive-sort
```

## 交互式实验

Projenin takip sistemindeki beş çeşit yetenekleri için grafik kullanmak için: sorular detayları) √ oluşturma sorunu) √ oluşturma sorunu) √ örev inceleme modeli) √ projenin kural kuralı √ projen politikası) √ kapatma sorunu) √ kapatma sorunu) √ sonra hangi listelerin kamuoyu tarafından açılabileceği, hangi okumaların özel tutulması gereken, ve hangi kaynakların √ düzenlenmesi gereken yeni bildirimleri √

Bu işlemden sonra, kullanıcı tarafından seçilen konuyu belirleyin. Eğer model tarafından yürütülürse, araç kullanın. Eğer host tarafından URI adresinin içeriğine göre okunan ise, kaynak kullanın.

## 动手实验

Bu arada, bu da bir diğer şey.

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

按以下顺序检查交互记录(transcript):

1. 确认 `server/discover`声明了当前协议版本以及两项能力──
2.  iki liste sorgularının sonuçlarını doğrulamak `resultType: "complete"`- Evet.
3. 确认列表和读取结果均带有符合预期的缓存提示──
4. Çıkacak URI'yi değiştir`notes://missing`Ve geri dönmeyi gözlemle`-32602`Yanlış.
5. 确认订阅 确认通知先于资源 更新事件发发出──
6. 确认事件与平稳关闭均携带订阅 ID `5`- Evet.

Python'un modelinde gerçek HTTP bağlantısı açılmamıştır. Bu model, SDK'yi göstermiş gibi görünüyor.

## 交付产物

`outputs/skill-primitive-splitter.md`MCP'nin ilk sınıfına yönelik bir  seçeneği kullanılabilir tasarım inceleme yönlendirmeidir.

本课还附带 `assets/primitive-split.svg`, çevrimiçi öğrenim için ilkel ve abonelik sınırları'nın hareketli görüntüleri sağladı.

## Deney et .

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果: 主程序输出 JSON 交互记录,测试命令报告至少12 通过测试用例──

## Kapstone 连接

Eğer kapı taşı sunucunuz, eylem dışında da bulunabilir bilgi ortaya çıkarsa, bu anlaşmayı uygulamanız gerekir. Bu anlaşmayı uygulamanız gerekir.

Test凭证应证明: herhangi bir liste bağlantı tarihi üzerine kurulmamıştır ve abonelik olayları asla yetkisiz bir kişiye aşağı kaynakların erişim hakkını sızdırmaz.

## 课后练习

1. Bir ekle.`notes://projects/{project}/notes/{id}`kaynak 模板,并对两个变量进行验证――
2. Çı`resources/list`添加分页支持, sırayı kesin olarak korumakla birlikte.
3. Bir kaynak ayarlamak`cacheScope: "private"`Ve`ttlMs: 0`, host 级 no-store 策略,并解释支 these two control measures's threat model──
4. 添加 prompt 列表变更订阅,并证明当过条件省略 `promptsListChanged`Hiçbir olay göndermez.
5. İki kayıt oluşturup, her olayın doğru bir talep kimliği olduğunu kanıtlayın.
6. Bu nedenle, bu işlemler, bu işlemlerin yapılması için kullanılabilir.

## 关键术语

- **Resource：**MCP sunucu 暴露的、通过 URI 寻址的内容──
- **Prompt：**MCP sunucu 暴露的、由用户控制的消息模板──
- **确定性列表（Deterministic list）：**针对相同的请求输入,其成员与顺序保持稳定的发现结果──
- **`ttlMs`：**缓存新鲜度持续时间 (mm)
- **`cacheScope`：**缓存结果的共享边界(`public`Ya da`private`)。
- **`subscriptions/listen`：**Bir uzun yaşam döngüsü talebi, açıkça geçerli koşullara göre cevap verilir.
- **Subscription ID（订阅 ID）：**İlk dinle Dilekçenin kimliği, bildirim için veri içinde tekrar tekrar gönderilmek üzere.
- **无效参数（Invalid parameters）：**JSON-RPC 错误 `-32602`, işe yaramaz veya bilinmeyen kaynak URI için kullanılır.
- **不支持的协议版本（Unsupported protocol version）：**JSON-RPC 错误 `-32022`, içerir`supported`ile`requested`版本列表──
- **`server/discover`：**强制要求的服务器 方法,返回支持的版本、能力、服务身份识别及可选的缓存提示──

## 延伸阅读

- [MCP 2026-07-28 Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP 2026-07-28 Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP 2026-07-28 Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)
