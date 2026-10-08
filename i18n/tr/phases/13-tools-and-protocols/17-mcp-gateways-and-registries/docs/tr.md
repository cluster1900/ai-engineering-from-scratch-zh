# 无状态 MCP 网关与 Registry 准入

> 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网    网 网    网 网            网 网                                                        

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 15 (security), Phase 13 · 16 (authorization)
**Time:** ~75 minutes

## Öğrenme hedefi

- Bir çok MCP sunucusu 聚在单一2026-07-28 端点后,且不依赖会话亲和性(Session Affinity)
- Uygulama stratejisi veya dönüşümünden önce, öncelikle isteklenen veriyi ve yol başını onaylayın.
- Değişken, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlenmiş, belirlen, belirlen, belirlen, belirlen, belirlen, belirlen, belirlen, belirlen, belirlen, belirlen, belirlen, belirlen, belir.
- Bu kayıtlar, hizmet bulmalarının kanıtlarını kaydetmek için gerekli olan bir strateji oluşturmaktadır.
- Doğru yolu ile talep seviyesinin etki alanı SSE`subscriptions/listen`、MRTR 重试以及 Tasks 扩展调用──
- ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒    ⇒ ⇒ ⇒   ⇒ ⇒    ⇒ ⇒   ⇒ ⇒      ⇒                ⇒                                                                                                                                                                                                                  

## 问题

Tek bir müşteriyi tek bir sunucuya doğrudan bağlamak çok basit. Ancak büyüklüğün genişlemesi ve daha karmaşık üretim ortamının gereksinimleri aşağıdaki zorluklara bir cevap verir:

- Hangi sunucuya bağlanmasına izin ver?
- Hangi kişi belirli bir araç görebilir ve kullanabilir?
- İki sonradan aynı isimle ortaya çıktığında nasıl ele alınacak?
- Nasıl bir tanımlayıcıyı incelemek için?
- ırk kısıtlamaları ve denetim olayları nerede uygulanmalıdır?
- 集群'da herhangi bir örnek bir sonraki gelen talebi işleyebilir mi?

网关(Gateway) yüklenen müşteri ile her bir sonraki MCP sunucusu arasındaki 中介──; MCP'nin birleştirilmiş MCP'leri dışa çıkarır, güvenlik stratejilerini artırır, ve onaylanan talepleri gönderme sorumlusu bulunur.

旧版网关设计往往将一个客户端会议多路复用多后端会议 中,并对 `Mcp-Session-Id`进行重写──这纯粹属于旧版兼容设计──2026-07-28 核心协议中已经没有任何协议会议的概念──

## 概念

### 现代网关请求路径

 için her giriş istekleri:

1. Sınıfın başkanı:
2. 验证 `MCP-Protocol-Version`- Evet.`Mcp-Method`- Evet.`Mcp-Name`Ve `params._meta`- Evet.
3. Konu, hedef kaynak, yöntem, araç ve argümanlara yetki verilmesi için.
4. 应用描述器 策略、登录 准入策略、限流策略和数据合规策略──
5. Seçili son son olarak yeni bir ̳ öz içeren  aşağı游请求 oluşturmak.
6. 校验后端返回的结果,并向客户端返回网关层的处理结果──
7. - Kayıtlar, ve kesinlikle anahtarları yazma.

Tüm süreç herhangi bir gizli protokol seansına ihtiyaç duymaz. Uygulama seviyesinin durumu, veri tabanında iyice kalıcı hale gelebilir.

### 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运行时策略 运策略 运行时策策策策策策策 运策策策 运策策 运策策策 运策策策 策策策策策 运运运策 策策策 策策策策策策 策策策 策策策策策策 策策策策 策策策 策策

Giriş mekanizması, hangi versiyonun arka ucunun internet bağlantısına erişebileceğini belirler, ancak bu kesinlikle belirli bir gerçek zamanlı ayarlama onaylamayı temsil etmez. Her bir istek için, internet bağlantısı, onaylanmış bir kişiye, yayıncıya ve kaynaklara, kiracıya, uyumlu bir yöntem ve isim, düzenleme parametrelerine, giriş tanımlayıcısına, kilitli belgelere, gerçek zamanlı sağlık durumuna, yeteneğe, teslimatına, veri sınıflandırma sınıfına, akış durumuna ve herhangi bir harekete bağlılık onayına, yeniden hesaplanmış güvenlik stratejisine dayanmalıdır.

Bu öncelik sırası önemlidir:Registry 记录可能仍然有效状态,但用户的角色可能已被吊销;Bir tanımlayıcı'nın hash 锁定可能仍然匹配,但目标参数可能已跨越租户边界;后端服务可能依旧合规,但安全事件应急策略可能正在实施全局隔离. Bu nedenle, çalışma zamanının stratejisi yalnızca ilk giriş yasağı,Registry 和 descriptor 证据只是该决策的输入的实施.

                                                                                                                                                                                                                                                              

### 单一 POST 端点

现代 Streamable HTTP her bir JSON-RPC 报文均均通过 HTTP POST 发送:

```text
POST /mcp
Authorization: Bearer <gateway-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.search
Accept: application/json, text/event-stream
```

对于该 POST 请求,网关可以返回 JSON 响应,或返回仅限于该请求作用域的 SSE 流――现代请求针对 GET 和 DELETE 均返回 HTTP 405 Method Not Allowed。`Mcp-Session-Id`ile`Last-Event-ID`Hiç bir yetki yoktur, bir konuşma ve yeniden konuşma yetkisi yoktur.

HTTP başlığı JSON-RPC Bodies değerleriyle tamamen uyumlu olmalıdır.`-32020`错误进行拒绝──这样的负载均衡器、网关与限流器便无需完整解析 机体 即可完成快速路由,同时保证端到端的完整性──

底层报文校验遵循严格时序:JSON-RPC 及元数据类型有效性、header与体 一致性,然后检查匹配的版本是否支持──不匹配返回 HTTP 400 与错误码`-32020` Eğer başlık ve vücut aynı ama sürüm desteklenmiyorsa, HTTP 400 ile hata koduna dön`-32022`, ve `data`精确为`{"supported":["2026-07-28"],"requested":"<actual>"}`◊ HTTP 404 ile hata kodu nasıl döndürüleceğini bilmiyoruz `-32601`- Evet.

`ProtocolError`Çekilmek için seçilebilir`data`, net关会将其序列化到 JSON-RPC 错误对象中──通知(通知) 由于没有 `id`, bu yüzden JSON-RPC başarısı veya hata cevabı asla alınmaz.

### Her aşamada hizmet aşkarlama (Discovery)

网关面向客户端实现 `server/discover`Aynı zamanda, net关 da her bir sonuncu hizmetin gerçekleştirilmesi için kullanılır. Böylece sonuncu desteklenen protokol sürümleri, yetenekleri ve genişleme imkanları da bilinir.

网关返回的发现结果例:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": true}
  },
  "ttlMs": 30000,
  "cacheScope": "private",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "enterprise-gateway",
      "version": "2.0.0"
    }
  }
}
```

Sadece dışa açıklamalar net关 kendisinin sonuna kadar tam olarak destekleyebilme yeteneği 交交交集──后端支持的特性并不意味着直接传输就安全;而网关本身声明──但后端根本无法支持的特性对外暴露毫无意义──

`serverInfo`Sadece raporların gösterilmesi ve test edilmesi için veri veri veri, kayıt veya yayıncının gerçekliğinin kanıtı olarak kullanılmamalıdır.

### 逐请求的客户端 Capabilities 逐请求的客户端 Capabilities

Her bir geri dönüşüm istekleri sonrakileri getirmek zorunda.`_meta`Şen封:

```json
{
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
  "io.modelcontextprotocol/clientInfo": {
    "name": "enterprise-gateway",
    "version": "1.0.0"
  }
}
```

Dış müşteri yeteneklerini körü körüne bakmayın. Geriye bakıldığında, netleşme kendiliğinden sadece müşteriye ait. Sadece netleşmenin doğru bir şekilde aracılık ve işleme protokol özelliklerini açıklayabildiği söyleniyor.

### 确定性的命名空间隔离

Her bir son araçları 合并稳定的公共命名空间 altında:

```text
notes.search
notes.create
issues.list
issues.open
```

维护 from public名称 to后端实例及原始工具 名称的映射表──绝不能按发现先后顺序随意处理重名碰撞──公共名称构成审批与审审协议的一部分,变更公共名称属于 Breaking Migration──

`tools/list`Bu, farklı konularda görülebilir araçların listesi farklı olduğunda, geri dönüş yapılması gerekir.`cacheScope: private`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖`ttlMs`Üst sınır, hizmetin son kesiminde baskıyı azaltarak kullanıcıların özel listelerinin sınır sınırlarının üzerinden sızmasını önleyebilir.

Dıştan ortaya çıkan her araç tanımlayıcıda, belirli bir isim, tanım ve nesne için kök noktası bulunmalıdır.`inputSchema`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △    △ △ △ `resultType`、 server ID ID ve cache

### 锁定已批准的描述符 (Bekleme)

Hazırlık aşamasında, tam bir tanımlayıcı için düzenlenmiş işleme yapılır ve hesaplanmış bir dijesin, tamamen sınırlı bir kamu adı altında kalmasını sağlar.

Bir kez test edebilmek için:

- Hemen geliyorum.`tools/list`Çekilmek üzere.
- 坚决拒绝直接调用──
- Güvenlik denetimi olayı.
- Yeni bir kilitleme yapmadan önce, strateji veya yapay bir yeniden onay zorunlu olmalıdır.

网关 güçlü bir merkezi kontrol noktasıdır, ancak ilk kez görülen bir tanımlayıcıyı güvenli hale getiremez.

### Kayıt  yardımcı hizmet bulma, güvenlik kararları değil

Kayıt`server.json`提供软件发布元数据── bir yazılım tabanlı paket yönetimi kayıtları genellikle aşağıdaki gibi gösterir:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "com.example/notes",
  "description": "Example notes MCP server.",
  "version": "1.0.0",
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@example/notes-mcp",
      "version": "1.0.0",
      "transport": {"type": "stdio"}
    }
  ]
}
```

Veri yayınlaması kendiliğinden bir web bağlantısının güvenlik girişi kararlarını temsil etmez. Veri verilecek olan yayıncıların bilgileri ve kaynak kaynakları, verilişin bağımsız giriş durumunda bulunması için geçerlidir:

```json
{
  "registryName": "com.example/notes",
  "registryVersion": "1.0.0",
  "publisher": {"namespace": "com.example", "status": "verified"},
  "provenance": {
    "source": "registry.modelcontextprotocol.io",
    "recordId": "com.example/notes@1.0.0"
  },
  "admission": {"status": "approved", "reviewedBy": "gateway-policy"}
}
```

网关负责校验 `server.json`Bu nedenle, internet bağlantısı, diğer ülkelerle bağlantılıdır.

Her giriş sonuna göre, tam kayıt:

- 精确的注册表及记录标识符──
- 经验证的发行者命名空间或域名凭证──
- 允许使用的传输协议与端点地址──
- Kilitli bir sürüm veya onaylanmış bir yükseltme stratejisi
- 软件制品或描述器 的哈希消化──
- 授权服务器签发者(İstederi)
- 审查人员、审核时间及过期时间──

勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿勿------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ye kadar 18 Kic. Nindeye kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar kadar

Bu ders, internet bağlantısı aşamasındaki verileri gerçekleştirdi: Sonunda yol açılabilir hale gelmeden önce, sertifikaların yerel giriş durumuna birleştirilmesi yapılacaktır.[第 30 课：MCP Registry 供应链、准入、漂移与回滚](../../30-mcp-registry-supply-chain-and-drift/docs/en.md)Tam bir kontrol yüzeyinin oluşturulması, tam olarak isimlendirme alanı kanıtını kapsaması, yazılım ürünlerinin kökenliliği, değişmezlik, kilitleme, gerçek zaman tanımlayıcıları, hareketli kontroller, kayıtlar, durumlar, kayıplar ve kanıtlara dayalı bir dönüş mekanizması oluşturulması, tedarik zinciri durumunun ve taleplerin işlevsel olarak belirtilmesi, kararların net bir şekilde ayrılması gerekir.

### 凭据中介机制(İttifak Ortalama)

网关对外调用者进行身份认证,并独立向后端各服务器进行身份认证;;后端的认证凭证绝不能泄露给前端客户端;;

保持以下映射绑定关系显式清晰:

```text
outer principal -> gateway role and policy
backend issuer + resource -> backend registration and token
```

绝不能将外部网关代币传递后端――绝不能将某后端代币复用到其他发发行人或资源―― eğer bir araç son kullanıcıyı temsil etmeyi gerektirirse, özel olarak tasarlanmış bir Token Exchange veya Claims 委托模型传递该身份, asla paylaşılan hizmet hesap凭借冒充用户应通过.

### İbadet süresi sınırlaması

 Anlaşmanın verilişi  İşlemci  Kaynak  Kamu aracı  Adı  Masraf derecesi  Zaman penceresi uygulama sınırları  Anlaşmanın oturum kimliği  Artık mevcut değil, hatta mevcut ve kolayca çevrilen 

Yüksek satışlı işletme mantığını yürütmeden önce, önce düşük satışlı işletme yasallığı doğrulanması gerçekleştirilmelidir.

### 审计 Tüm kararlar

记录足以完整复现一次调用全套审计要素:

- Lütfen kimlik ve bağlantı izleme kimliği isteyin.
- 已认证的主体与签发者──
- 公共工具 名称与最终后端路由──
- Descriptor 哈希锁定版本──
- 策略决策 sonucu ve belirlenme nedenleri:
- 响应耗时与结果类别──
- MRTR 往返轮次或任务标识符 (Yarımlı olarak kullanılırsa)

Ürün sahibi Tokens, yetki kodları, yenileme Tokens, orijinal anahtar anahtarı ve gereksiz hassas parametreler için zorunlu bir açıdan açılımı uygulanması.

### Başvuru Sınıfı Etkinliği

Bir istek gerçekleştirilmesinde akışlı aktarım verisi gerektiğinde, normal POST istekleri doğrudan istek seviyesinin etki alanına geri dönebilir.

Ne bağımsız bir GET kurma, ne de temel olarak güven.`Last-Event-ID`Bu durumlar eski aktarım protokollerinin varsayımlarına bağlıdır.

### 长生命周期的变更通知 (Düzenli yaşam döngüsü değişimi bildirimi)

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `subscriptions/listen`Ve SSE 响应──通知过器使用平字段:`toolsListChanged`- Evet.`promptsListChanged`- Evet.`resourcesListChanged`Ve `resourceSubscriptions`- ...

```json
{
  "jsonrpc": "2.0",
  "id": "listen-tools",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

İlk olay desteklenen bildirimleri onaylamak için kullanılır.

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": "listen-tools"
    },
    "notifications": {
      "toolsListChanged": true
    }
  }
}
```

网关 后仅转发已确认的变更类型── 后仅转发已确认的变更类型── 后仅转发已确认的变更类型── 后仅转发已确认的变更类型── 后后仅转发已确认的变更类型── 后后仅转发已确认的变更类型── 后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后`params._meta`Aynı şeyi taşıyım.`io.modelcontextprotocol/subscriptionId` otomatik yeniden yükleme veya otomatik yeniden izleme mekanizması yoktur.  Kütleyici yeniden bağlantı kurduktan sonra, abonelik yeniden açmalı ve bağımlılık listesi verilerini aktif olarak çekmelidir.

Modern yollar tamamen değişti.`resources/subscribe`- Evet.`resources/unsubscribe`Ve istenmeyen bağımsız GET 流. Bu eski özellikler sadece eski sürüm kontrol yolları olarak korunmaktadır.

### 穿透网关的 MRTR 交互

Geri dönünce`resultType: input_required`, sadece dış müşteri açıklaması gerekli giriş isteklerini destekleme şartıyla, nternet-关 able to downstream to send the result.`requestState`- Evet.

客户端                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `inputResponses`Yeniden deneme talebini yeniden tanımlama hakkı, aynı kamu yollarını deneme ve daha sonra yeni bir sonrakı talebi aşağıya aktarma yapma hakkı.

### Görevler Uzatma 路由

Görevler bir resmi genişleme, tanımlama için.`io.modelcontextprotocol/tasks`️Bu kesinlikle çekirdek protokol seansının bir takviyesi değildir.

客户端在逐个请求的客户端Capabilities 中声明支持这个扩展,而网关只在能够终端到终端保证这个任务生命周期时,才在发现中向外声明支持――对支持`tools/call`... ... ve her şeyi kendiliğinden halletmek için ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ...`resultType: task`◊ görev sonuçları doğrudan içerir `taskId`- Evet.`status`Zamanı.`ttlMs`Ve seçilebilir.`pollIntervalMs` Bu sonuç gönderilmeden önce görev durumunun kalıcı ve okunması gereken bir durum olmalıdır.

网关针对这个不透明的任务 标识符记录已认证主体与后端路由──随后 `tasks/get`- Evet.`tasks/update`Ve `tasks/cancel`调用均使用 `params.taskId` olarak `Mcp-Name`Bu, her türlü aracı için doğal bir yol anahtarı sağladı.`tasks/get`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `resultType: complete`, ve son haline girdi.`tasks/update`发送带键名 的 `inputResponses`Görevlerin gerekli belirlenmemiş girişlerini sağlamak ve boşluğu tam olarak onaylamak için cevaplar göndermek.`tasks/cancel`İstifadeden sonra, bu görev hemen durdurulmasını garanti etmez.

Yeni bir şey başlatmayın.`tasks/list`Ya da`tasks/result`方法, they belong to the old version experimental model.  Görevlerin girişine ihtiyaç vardır.`tasks/get`暴露完整的内嵌请求;客户端通过 `tasks/update` Başlangıçtaki araç çağrısını yeniden denemek yerine, tekrar yapılması  Müşteri hala önerilirken ara sıra sorgulamayı sürdürüyor; görevlerin oluşturulması tamamen hizmetçi tarafından yönlendiriliyor 

Sürdürülmüş görev yolları durumu, kesinlikle anlaşma oturumunun iş uygulama verilerine göre göre işlemi sözcükleri indeksiye sahiptir.

### 往后兼容边界

Eğer net关, eski sürümün müşteriye veya sonüne uyumlu olmalıdır:

- 显式探测协议所处的时代版本──
- Bu uygulama, yeni bir uygulama oluşturmak için kullanılacak.
- 绝不能将旧版 session id 泄露到现代路由或鉴权逻辑中──
- Sessiz bir derecede düşüşten kaçınmak için, sınırlı hizmetler ve açık bir geri dönüş stratejilerini öncelikle kullanın.

```figure
t3-gateway-funnel
```

## 动手构建

`code/main.py` Bir süreç içindeki protokol net关 modeli ve iki arka uç sunucusu gerçekleştirilmektedir.  Her arka uç, mevcut protokolün taleplerine uygun olarak yeni yapılandırmaların tümünü alır.                                                                                                                                                                                                                                                                                                                 `tools/list`、Based in Naming Space's route、Registry `server.json`Dış giriş durumunun birleşik  tanımlayıcı  kilitleme  RBAC  başlık indekslerinin sınırlamalarına göre  denetim kararları, `subscriptions/listen`SSE 确认流程──

Modelle çözülmüş istekleri alır, yol başlığı ile onaylanmış taşıyıcı kimliği ile birlikte.`Content-Type`Ya da tam olarak.`Accept`规范──你将其连接到第09 课的流动 HTTP 适配器,后者强制要求 `Content-Type: application/json`Ve aynı zamanda içerir.`application/json`和 `text/event-stream``Accept`Başım...

- Yapma .

```bash
cd phases/13-tools-and-protocols/17-mcp-gateways-and-registries
python3 code/main.py
python3 -m unittest discover code/tests -v
```

演示程序, yeni oluşturulan son başvuru idini dış istek idinden basarak, durumsuz dönüşüm sürecini doğrudan gösterir.

## Kullan

Bu süreçte son son nesneyi gerçek modern protokol müşteriye değiştirmek için aynı sınırları korumak gerekir:

- 连接前检查准入记录──
- 暴露 yeteneği 前先完成后端サービス発見。
- 鉴权前先完成公共名称限定──
- 列表或调用前先核对描述器 哈希锁定──
- 转发前 yeniden inşa edilmesi için talep edilen veri¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- 返回前校試后端执行結果──

## - Söyle.

本课交付 `outputs/skill-gateway-bootstrap.md` Modern Net关 Engineering script structure design, kapsamlı bir set sunar.

## 课后深练习

1. Dış istek ve dönüşüm isteklerinin değer verilerine katılın, dağıtılmış bağlantı takiplerine katılın, ve denetim olaylarında ilişkileri kaydetin.
2. Görevler ve yetenekler sahibi bir kişiye bağlanıp,`Mcp-Name`中根据 görev id 完成 `tasks/get`- Evet.
3. 刻意修改其中一个后端的描述器,验证网关的服务发现列表与直接调用是否均被拦截阻断──
4. Özel sunucu kapasitesini eklemek için, bu hizmetin bulduğu sonuçlar neden özel depolama yapılması gerektiğini araştırmaya devam etmektedir.
5. 编写一个遗产 适配器接口,要求在不向现代 `Gateway`类中添加任何遗留状态的前提下完成兼容接入──

## 关键术语

| 术语 | 含义 |
|------|------|
| MCP 网关 | 位于客户端与后端 MCP server 之间的安全策略与路由中心 |
| 准入记录（Admission record） | 允许特定后端接入网关的完整安全证据与审批策略决策 |
| 完全限定 tool 名称 | 稳定的对外公共路由名称，如 `notes.search` |
| Descriptor 锁定（Pin） | 在服务发现和请求分发期间严格比对校验的已批准哈希 digest |
| 私有缓存作用域（Private cache） | 缓存结果严格受限于单一授权主体与上下文，禁止跨用户共享 |
| 请求级作用域 SSE | 直接挂载在单次 POST 请求上的流式响应，连接关闭即取消请求 |
| `subscriptions/listen` | 客户端通过 POST 打开的 SSE 长连接，用于监听特定的列表变更通知 |
| 任务路由（Task route） | 将不透明的 taskId 映射到具体后端的应用层状态映射 |
| Legacy 适配器 | 带有明确版本门禁的隔离层，用于兼容旧版握手与 session 机制 |

## 延伸阅读

- [Streamable HTTP 传输协议规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [服务发现（Server Discovery）规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [官方 Registry server.json 规范与要求](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [MCP Tasks 扩展规范草案](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
