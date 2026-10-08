# MCP 鉴权与授权:CIMD、Emitter 绑定、PKCE 与权限提升(Step-Up)

> 远程MCP 请求是无状态的,但它的授权绝非匿名――必须将每证书与创建者 (发发行者) 强绑定,并将每证券与收件者资源强绑定――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 15 (security)
**Time:** ~90 minutes

## Öğrenme hedefi

- 通過受保护资源元数据(Protected-Resource Metadata) 发现授权服务器(Authorization Server) ⋅
-  öncelikle müşteri kimliklerini kullanmak yerine, terk edilmiş olan aktif müşteri kayıtlarını kullanmak
- Çözüm: DCR 兼容路径时,正确声明`application_type`- Evet.
- 校验授权响应中 `iss`参数,并根据签发者物理隔离凭证──
- 熟练运用 PKCE、资源指示符 (Ressource Indicators) 、受众验证 (Audience Validation) 及增量 Scope (Durumlandırma)
- 2026-07-28 规范的受权MCP 请求

## 问题

远程MCP sunucu可能会读取私有记录、向外部系统写入数据,或触发代价昂贵的运算──身份认证(Authentication) Sadece kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır veya kim tarafından onaylanmıştır, kim tarafından onaylanmıştır, kim tarafından onaylanmıştır veya onaylanmıştır.

- Bu sertifika hangi yetkili sunucu tarafından veriliyor?
- Bu token özel olarak hangi MCP kaynakları için yayınlanmıştır?
- Hangi müşteriye ve hangi yönlendirme URI'ye bu yetki süreci tamamlandı?
- 资源所有者 (Ressource Owners) hangi operasyonları onayladı?
- Bu kesin taleb hâlâ o zamanki onay alanına uygun mu?

2026-07-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `application_type`, RFC 9207 签发人响应,并严禁跨签发人复用凭证──

Bu güvenlik kuralları, devletsiz çekirdek protokolü ile bir arada bulunmaktadır.`Mcp-Session-Id`- Evet.

## 概念

### 明确三大核心角色

- **MCP Client（客户端）：**代表資源所有者发起请求──
- **MCP Resource Server（资源服务器）：**验证 Access Token 并提供 MCP 端点服务──
- **Authorization Server（授权服务器）：**认证资源所有者、收集用户同意并签发代币──

资源服务器 ve yetkili hizmetçi aynı ekip tarafından çalıştırılabilir, ancak ikisinin de tanımlama ve doğrulama sorumluluklarını tamamen bağımsız tutmalıdır.

### 授权应用于 HTTP 传输层

MCP  Uygulama Kuralları özel olarak HTTP tabanlı aktarım katmanına yöneliktir.

Removable HTTP                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `Authorization`Baş部中携带 Bearer Token。**绝不能**# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

### Korunmuş Kaynaklar

资源服务器 sorumlu RFC 9728 规范的元数据发布:

```json
{
  "resource": "https://notes.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["notes:delete", "notes:read", "notes:write"]
}
```

客户端 MCP 资源 URL'den çıkış, bu değerli veri dosyasını elde etmek, açıklamadan oluşan yetkili sunucuyu seçmek ve ardından bu yetkili sunucunun OAuth veya OpenID Connect 元データını yeniden elde etmek.

RFC 9728'in bilinen URL'lerini oluştururken, orijinal kaynak yollarını korumak gerekir.`https://notes.example.com/mcp`,本课使用的标准路径为 `https://notes.example.com/.well-known/oauth-protected-resource/mcp`Eğer terk edilmişse`/mcp`后, yanlışlıkla bu alan adı altında diğer korunan kaynakların veri değerlerine seçilebilir.

Ürün sahibi adı ile boş tahmin otoriteleri servisörleri için kullanmayın. Ayrıca, kullanıcıların kendi isteklerine göre kullanmaları gereken bir kullanıcı izni stratejisi için kullanın.

### 验证授权服务器元数据

授权服务器元数据应暴露各端点及支持的安全控制特性:

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "code_challenge_methods_supported": ["S256"],
  "authorization_response_iss_parameter_supported": true,
  "client_id_metadata_document_supported": true
}
```

强制要求 PKCE 采用 S256 算法──完整记录签发者(issuer) 字符串──这个精确的字符串将成为客户端后续注册信息与代币存储的核心索引键(Key)──

### 登录 öncelikli kurallarına uyma

Eğer bir müşteri ile seçilen yayıncı arasında açık bir önceden konutlama ilişkisi varsa, önceden kayıtlı müşteri sertifikalarını doğrudan kullanmak gerekir.

### 优先采用客户端 ID 元数据文档(CIMD)

客户端 ID 元数据文档(CIMD) otoriterli sunucu için bir HTTPS URL sağladı, bu URL 既是客户端的唯一标识符(`client_id`), aynı zamanda kendi veri arşivinin elde edilebilir adresleri:

```json
{
  "client_id": "https://client.example.com/oauth/metadata.json",
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

授权服务器获取并校验该文档──`client_id`必須, yolun içindeki HTTPS URL'dir ve belge içi açıklamanın değeri bu URL'ye tamamen uyumludur.`client_id`- Evet.`client_name`ile`redirect_uris`△本例中包含的`application_type`CIMD'nin zorunlu gereksinimleri olmasa da, zorunlu bir bölüm olarak DCR yollarında ortaya çıktı.

Bu dosyanın işleyişini de çekmek zorundadır. Bu işlemler: çözme ve doğrulama hedef IP, reddetme, çevrimiçi adresleri, özel ağlar, bağlantılar, yerel adresler ve sınırlı ağlar, DNS'e yeniden yönlendirme, DNS'e yeniden bağlanma, yeniden yönlendirme sayısını sınırlama, büyüklüğüne ve aşırı zamanına cevap verme, zorlayıcı talepler.`application/json`,并严格按照有效的HTTP 缓存控制头进行缓存──对于 `client_name`Bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de

CIMD, ilk bağlantı sırasında yeni tanımlayıcılar gönderme engelleri ortadan kaldırdı, ancak URI'ye yönlendirme 校验、发发商信策略或用户授权同意的要求不免──

### DCR  yalnızca 向后兼容 yolu olarak

动态客户端注册 (DCR) hala eski yetkili hizmetçilerden kullanılabilir, ancak yeni MCP'lerin gerçekleştirilmesi için resmi olarak iptal edilmiştir.

DCR kullanırken, açıklamalıdır.`application_type`- ...

```json
{
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

- 桌面端、移动端、命令行工具及回环地址的客户端使用`native`- Evet.
- 远程托管的 Web 浏览器应用使用 `web`,并配置远程 HTTPS 重定向地址──

Bu bölümden kaçınırsanız, OpenID Connect'i kayıt altına almak için bir süre ayırın.`web`Bu da yasal dönemin yeniden doğrudan başarısızlığa yol açar.

DCR kodunu açık bir derecelendirme kararına bırakmak için CIMD tescilinin beklenmedik başarısızlığı olduğunda DCR'ye geri dönmeyin, bu güvenlik kontrolünün başarısızlığını savunma daha zayıf bir kayıt yoluna dönüştürür.

### İznini ve İznini İznine Alıcıyı Güçle Bağlı

Kayıtlı kayıt belgesi, belirlenmiş kayıtlı isim altında depolanmalıdır:

```text
issuer_credentials[issuer] = pre_registered_or_dcr_client
tokens[(issuer, resource)] = access_token
```

Korunmuş kaynakların bulunması sonucu`https://auth-one.example`Değişmiş .`https://auth-two.example`, güven zinciri yeniden değerlendirilmelidir. İlk yayıncının müşteri sırrı asla ilk yayıncının müşteri kimliği olmayacaktır.

CIMD  müşteri kimliği farklıdır: Bir HTTPS URL olduğu için, yetkili sunucu tarafından gönderilen iç sertifika değil, aynı CIMD URL'nin taşınabilirliği olan yeni güvenilir yayıncı tarafından dosyayı doğrudan çekip doğrulayabilir ve DCR'ye tekrar kayıt edilmesi gerekmez. Ancak yetkili cevap ve üretilen token hala yeni yayıncıya ait anahtar adıyla ayırılmalıdır.

### 带 PKCE 的授权码模式

交互式授权流程 aşağıdaki adımları içerir:

1.  生成高 的随机数 `code_verifier`- Evet.
2. SHA-256 派生出  kullanmak`code_challenge`(S256 方式)
3. 发送授权请求,携带精确的 `client_id`- Evet.`redirect_uri`- Evet.`scope`- Evet.`code_challenge`Ve `resource`- Evet.
4. 接收授权响应,该响应包含授权码 `code`Ve destekle onu taşı .`iss`- Evet.
5. Bu yüzden, bu konuda çok ciddi bir şey var.`iss`Önceki kayıtların yayımcıları ile tamamen uyumlu olup olmadığını
6. Kullanım`code_verifier`、 Tamamen aynı ağır yönlendirme URI 及 aynı `resource`- Değişmek için.
7. Alınacak parayı depolama .`(issuer, resource)`复合键下――

RFC 8707'den alıntılandı.`resource`参数 aynı zamanda geçerli bir şekilde belirtilen bir istek ve bir işaret istekinde, MCP sunucusunun URI'sini doğru tanımladı.

### 严格校验 `iss`参数

RFC 9207 Bir yayımcının yetkili yanıtının diğer yayımcının yanıtıyla karışmasını önleyebilir.

Çözümler içinde ortaya çıktığında`iss`参数时,将其与记录的发行人进行对比,禁止大小写折叠、末尾斜增删除、默认端口移除或URL 百分号编码规范化── once not matched, must use this authorized code, even must show the error details of the attackers control in the response──

Eğer otoriter servis içerir `iss`, genellikle bir dolar verisi içinde açıklanır .`authorization_response_iss_parameter_supported: true`❖Modern Client Even in Unseen This Statement, once Response contains `iss`Bu sınavı yine de sıkı bir şekilde yürütülecek.

### MCP Server'da 端校验受众(İzleyici)

资源服务器 sadece özel olarak gönderilen tokenleri kabul eder:

```text
token.issuer == configured_authorization_server
token.audience == canonical_mcp_resource
```

任何无效、过期、发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发

### 仅申请当前最小所需 范围

 minimum güç sınırları prensibini takip ederek, sadece mevcut işlem için gereken kapsamı başvurun.

```text
WWW-Authenticate: Bearer error="insufficient_scope",
  scope="notes:delete",
  resource_metadata="https://notes.example.com/.well-known/oauth-protected-resource/mcp"
```

客户端 kullanıcıya yeni yetki gerekliliğini açıklamak, kullanıcı rızasını almak, yeni eski kapsamlılıkları içeren bir kitle oluşturmak için yeni yetki süreci başlatmak ve yeni JSON-RPC kimliği kullanarak MCP isteklerini yeniden başlatmak için.

Soruların kapsamını ilk olarak içerir gibi görmeyin.`scopes_supported`Bu nedenle, sorgu başlığı sadece mevcut işleyişin en yetkili yetki talepidir.

### 授权与无状态 MCP 底层报文

经过授权的工具 调用仍然携带完整的现代请求信封:

```text
POST /mcp
Authorization: Bearer <access-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.delete
```

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "tools/call",
  "params": {
    "name": "notes.delete",
    "arguments": {"id": "note-7"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "oauth-lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Token, yetkili kişiye yetki vermesi için kullanılır; talep edilen veri, müzakere anlaşması için kullanılır.

底层报文校验遵循固定时序:JSON-RPC 及元数据类型有效性、header与体 一致性,然后是协议版本支持校验──路由或版本 header 不匹配回归 HTTP 400 与错码`-32020` Eğer başlık ve vücut aynı ama sürüm desteklenmiyorsa, HTTP 400 ile hata koduna dön`-32022`, ve `data`精确为`{"supported":["2026-07-28"],"requested":"<actual>"}` request unknown method return HTTP 404 with error code `-32601`- Evet.

Tüm sorulardaki hatalar: 401 Token 无效和 403 Scope 不足) % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %`id`Yöntemli JSON-RPC  error信封包装── yapılandırılmış kurtarma bilgisi seçilebilir hatalar içinde`data`字段中;`WWW-Authenticate`则作为标准 HTTP 响应头返回──通知因为没有 `id`,所以不返回 JSON-RPC 响应体──被接受的HTTP 通知返回HTTP 202 且响应体为空──

Sunucu gerçekleştirildi .`server/discover`Bu nedenle zorunlu bir şekilde desteklenmesi de gerekmektedir.`tools/list`方法── tool descriptor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `inputSchema`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ `resultType`、 server ID ID DATA、limited `ttlMs`ile`cacheScope` Servis Discover and User Unrelated General Tool List (Hızlı Kullanıcılar ve Kullanıcılar)  Listeden önce erişilebilir; Eğer listenin içeriği konuların kimliğine göre değişirse, normal bir yetki stratejisi uygulanmalı ve özel depolama (Private Caching)  kullanılması gerekir.

### 禁止 Token 直通转发(Birinmeyen Token Geçitleri)

MCP sunucuları, müşteriler tarafından gönderilen MCP erişim tokenlerini doğrudan aşağıdaki API'ye aktaramaz. Aşağıdaki servis için tek başvurusu gerçekleştirmek veya açıkça Token Exchange'i kullanmak gerekir.

### Yenilenme Token 处理

Refresh Token is optional. Bir kez indirildiğinde, sıkı gizli depolama ve yayımcı ve kaynaklara göre ikili indirim yapılmalıdır.

```figure
t3-scope-stepup
```

## 动手构建

`code/main.py`Bu, bir süreç içi protokol ve yetkili simülatördür. Bu, tümüyle korunan kaynakların bulunmasını, yetkili sunucuların veri verilerini, CIMD kayıtlarını, sürüm kontrolünü, DCR geri dönüşünü, uygulama türlerini, testlerini, PKCE'yi, yayıncıların onaylarını, kaynakları bağlama tokenlarını, kapsamını, yetki yükseltmelerini,`server/discover`- Evet.`tools/list`Ve statüssiz araçlar.

Modelle çözülmüş istekler ve yol başlıkları alır.`Content-Type`Ya da`Accept`△You can connect to Section 09                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `Content-Type: application/json`Ve`Accept`需同時支持 `application/json`和 `text/event-stream`- Evet.

- Yapma .

```bash
cd phases/13-tools-and-protocols/16-mcp-security-oauth-2-1
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Kontrolü, çıkış, gösterim, hizmet bulma, CIMD kayıt, düzenli okuma, iki bağımsız kapsam, yetki yükseltme süreci ve yayıncıların ayrılıklarındaki belgeler depolama mekanizması.

## Kullan

Classe mapping in the simulator to production component:

- `ResourceServer.protected_resource_metadata`映射为 RFC 9728 元数据端点──
- `AuthorizationServer.metadata`映射为 RFC 8414 或 OpenID Connect 发现端点──
- `Client.enroll`映射为 CIMD 解析及显式的 DCR 兼容回退分支──
- 签发者派发的客户端凭证及 `tokens_by_issuer_resource`映射为加密存储记录──CIMD URL 保持可移植,而授权产物则始终绑定到特定发发发人──
- `ResourceServer.handle`映射为校验现代 MCP başlıkları、token 和 tool scope 的网关中间件,分发前将所有请求错误封装进匹配的 JSON-RPC 信封中──

## - Söyle.

本课交付 `outputs/skill-oauth-scope-planner.md` Bir bütün tasarlanmıştır; kayıt önceliklerini, yayıncıların ayırma yetenekleri depolama, uygulama türleri, PKCE, kaynak göstericileri, kapsam sorguları ve mevcut durumsuz talep sınırları için pratik planlama becerileri kapsamaktadır.

## 课后深练习

1. "For simulator increase Refresh Token 轮换机制,并测试拒绝重复使用上一次已轮换的旧 Refresh Token──"
2. 增加签发者白名单机制──When checked to issuers change when, only copy portable CIMD URL, firmly reject all credentials and tokens of this previous old issuers's sending──
3. Üstün bir süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli
4. DCR'deki orijinal verilerdeki farklılıklara göre uzak mesafeli HTTPS ağır yönlendirme adresleri ile bir Web 客户端 varyasyonu oluşturmak.
5. Aynı yayımcı altında ikinci kaynak kayıtlı, onaylanan yeni kaynak başvurusu için erişim işaretleri ilk kaynak uçlarında kesinlikle kullanılmayacaktır.

## 关键术语

| 术语 | 含义 |
|------|------|
| 受保护资源元数据 | RFC 9728 文档，用于声明资源地址、授权服务器列表及支持的 scopes |
| CIMD | 客户端 ID 元数据文档（Client ID Metadata Document），其 HTTPS URL 即为 OAuth client_id |
| DCR | 动态客户端注册（Dynamic Client Registration），已废弃并仅作为向后兼容路径保留 |
| `application_type` | `native` 或 `web`，用于校验重定向 URI 的合法性规则 |
| PKCE | 包含 verifier 与 S256 challenge 的机制，用于防止授权码拦截攻击 |
| `iss` | RFC 9207 授权响应中的签发者标识符，用于防范 Mix-up 混淆攻击 |
| 资源指示符（Resource indicator） | RFC 8707 参数，用于将 Token 申请显式绑定到目标 MCP 资源 |
| 受众（Audience） | Token 允许被使用的合法资源范围 |
| 权限提升（Step-Up） | 针对当前操作需要的新 scope，发起用户再次同意并获取新 token 的机制 |
| 签发者绑定凭据 | 将客户端注册凭据与 Token 严格按授权服务器签发者物理隔离的存储机制 |

## 延伸阅读

- [MCP 2026-07-28 授权规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [RFC 9728: OAuth 2.0 受保护资源元数据（Protected Resource Metadata）](https://www.rfc-editor.org/rfc/rfc9728)
- [RFC 8707: OAuth 2.0 资源指示符（Resource Indicators）](https://www.rfc-editor.org/rfc/rfc8707)
- [RFC 9207: OAuth 2.0 授权服务器签发者识别（Issuer Identification）](https://www.rfc-editor.org/rfc/rfc9207)
- [OAuth 客户端 ID 元数据文档（CIMD）规范草案](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/)
