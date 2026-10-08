# 生产环境中的 MCP 认证与鉴权:绑定签发人注册与代币机制

> 第 16  ders OAuth 2.1  durum makinesi oluşturdu. Bu ders MCP 2026-07-28 规范加固其生产环境边界:首选客户端 ID 元数据文档(CIMD), sadece imha edilmiş hareketli müşteri kayıtlarını bir uyumlu program olarak, sıkı bir sınavla onaylı yanıt veren, imhacıya göre fiziksel olarak ayırılmış müşteri sertifikalarını, JWKS'i düzenli olarak sorgulamayı, her durumsuz istek üzerinde kesin bir şekilde öğrencilere bağlı olarak gerçekleştirmek için.
>
> **规范说明（2026-07-28）：**动态客户端注册(DCR) resmi olarak iptal edildi,首选客户端 ID 元数据文档(CIMD) ・DCR 仅作为后后兼容机制保留──当不得不使用DCR 时,客户端必须声明正确的`application_type`◊ Müşteriye RFC 9207'nin varlığını kanıtlamak zorundadır.`iss`参数值,绝不能跨不同授权服务器签发者复用凭证──

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 16 (OAuth 2.1 state machine), Phase 13 · 17 (gateways)
**Time:** ~90 minutes

## Öğrenme hedefi

- RFC 8414 tarafından yapılan verileşme ve verileşme çalışmaları
- 通过客户端 ID 元数据文档(CIMD) client register'ı tamamlamak için, 已废弃的 DCR 隔离为回归方案――
- 校验 RFC 9207 `iss`,将客户端注册凭据根据授权服务器签发者(发行人) 隔离索引,并将资源绑定 Token 根据签发者与资源双重索引存储──
- 定時调度缓存和刷新 JWKS 密钥集, imzalama sınavı key rotation (Key Rollover) sırasında kolay geçiş sağlayın.
- RFC 8707 资源指示符将 Token 强绑定到单一 MCP 资源,坚决拒绝混代理 (Belişmiş-Veri)
- 理性权衡 JWT 本地验证与 Token Introspection,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效率,界定撤销时效率,界定撤销时效率,界定撤销时效率,界定撤销时效率,界定撤销时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时时
- Yetkili hizmetçilerin, kaynak hizmetçilerinin ve müşterilerin sorumluluklarını tamamen çözmek, her tarafın kendi sınırlarındaki güvenlik kontrollerini yapmasına izin vermek.
- Kontrol Üretim Bakanlığı, Çekim Denetim Yetkilileri Hizmetçilerine, Güvende olmayan kayıt modeli veya Token 跨域复用を断断断断断断断断.

## 问题

Bölüm 16                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

İlk açıdan**客户端注册与凭据隔离**◊ Gerçek işletmeler yüzlerce MCP sunucusunda ve binlerce MCP istemcisinde çalışabilir.**客户端 ID 元数据文档（CIMD）**: müşteri kendi kontrolü altında bulunan ✓ yollu HTTPS URL'lerini müşteri tanımlayıcıları olarak kullanır, yetkili sunucu ihtiyaç olduğunda bu değerli verileri aktif olarak çekir. RFC 7591 动态客户端注册(DCR) sadece atık geriye uyumlu yol olarak korunur.`application_type` Müşteri, yetkili servisçi tarafından kayıtlı olarak, Access Token'i kullanır.`(issuer, resource)`İndeksi oluşturmak için bir grup oluşturmak. İndirimci değişmek yeniden kayıt edilmesi gerektiği anlamına gelir.

İkinci açı:**密钥轮换（Key Rotation）**JWT yerel imza sınavı, yetkili sunucu tarafından yayınlanan JSON Web Anahtar Setinden (JWKS) kaynaklanır. Yetkili sunucu bu imza anahtarlarını düzenli olarak düzenli olarak düzenler. Genellikle her saat, güvenlik olaylarına yanıt verirken hatta daha hızlı.)

Üçüncü açı:**受众绑定（Audience Binding）**16. Sınıf RFC 8707 资源指示符を導入しました.`token.aud`Kendi düzenlenmiş kaynak URL'leri ile karşılaştırıldığında, uyumsuzluk hemen HTTP 401'e geri döner. Bu, bir sunucuya yönelik Token'in tek koruma hattıdır.

Bu ders, bu üç büyük bağlantıyı belirli bir proje bileşeni arasında bir araya getirecektir: HTTP bir uç noktasına karşılık gelen veri dosyası; JWKS 缓存 缓存 刷新应对定时任务加值缓存; JWT 验证是资源服务器在分发任何工具前必须执行的例程──严格隔离三大角色并让各方只执行自己属的检查:授权服务器负责发发发和轮换密钥,资源服务器负责缓存和验证,客户端负责服务发现和注册──

## 适用范围:第 16 课后的生产落地强制规范

[第 16 课：基于 OAuth 2.1 的 MCP 安全](../../16-mcp-security-oauth-2-1/docs/en.md)Bu ders, yetkili kod durum makinesi, PKCE, korunan kaynakların keşfi, kaynak göstericileri ve kapsamı karar verme mekanizması'nı kapsar. Bu ders, yukarıdaki sözleşmeler üzerine kurulan ikinci bir OAuth süreç setiyi yeniden tanımlamayacak. Bu ders, açık olmayan token verifikasyonu, sertifika iptalı, altyapı hataları, sürüm yayınları ve güvenlik olayları yanıtları gibi gerçek operasyonlar ve güvenlik durumları sahnesinde bu güvenlik kurallarını nasıl sürdürülebilir şekilde uygulayacağını araştırmaktadır.

Üretim ve üretim sınırları daha çok alt seviyede ulaşım ve güvenlik üzerine odaklanmıştır:

- JWT 路径 校验固定的发发发者、算法、验签公钥、受众、时间 Claims and Scope,同时安全更新 JWKS──
- Çözümsüz Token 路径调用签发者经认证的内视点,校验回归的活跃状态、受众或资源、过期时间、主体以及 Scope──
- Çekilme stratejisi belirleme hakkı uzun süre içinde tamamen geçersiz kalmalı ve hangi depolama katmanları geçersiz kalmaya geciktiği belirlenmelidir.
- Önemli olan, hizmetin bulunması, JWKS, incelemesi veya sökülmesi, altyapı kullanılamazken sistemin belirlenme davranışlarıdır.
- 审计证据记录驱动决策的发发言人元数据、公钥集或内视 响应、Token Claims、策略版本以及拒绝原因,且绝不保存 Token 明文──

Bu görev bölümü, ders modüllerinin iyi ilişkisini korudu. 16. ders doğrulama sürecinin bağlantılılığını; 18. ders, Token'in gerçek MCP'ye ulaşma yoluyla gelen taleplerin uzun süreli süreli süre içinde güvenilir kalıp kalıp kalıp kalıp kalmadığını veya olağandışı zamanlarda kesin olarak engellenmediğini gösterir.

## 概念

### RFC 8414  OAuth 授权服务器元数据

位于 `/.well-known/oauth-authorization-server`Bu dosya, müşteriye ihtiyaç duyduğu tüm bilgileri açıklar:

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "client_id_metadata_document_supported": true,
  "registration_endpoint": "https://auth.example.com/register",
  "authorization_response_iss_parameter_supported": true,
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "scopes_supported": ["mcp:tools.read", "mcp:tools.invoke"],
  "token_endpoint_auth_methods_supported": ["none", "private_key_jwt"]
}
```

客户端在获取 MCP 资源 URL 后进行链式发现:先通过RFC 9728 的 `oauth-protected-resource`(资源服务器文档) 获知所信任的发发发商,随后通过RFC 8414 (本规范文档) 获取该发发发商的各服务端点──客户端永远不要硬编码授权端点 URL──

包含路径的资源标识符, lütfen 字段──如,`https://mcp.example.com/team/server`Respondent korunan kaynaklar için veri adresleri çözülmelidir`https://mcp.example.com/.well-known/oauth-protected-resource/team/server`❖ ❖ ❖ ❖`/.well-known/...`错误地追加在资源路径后──

MCP'nin onaylanması gereken anlaşmalarda kullanılır:

- `code_challenge_methods_supported`必須包含 `S256`(RFC 7636'ın PKCE 要求'ına uygun)**缺失**,则表示该授权服务器不支持 PKCE,客户端**必须**İcra etmeyi reddetti.
- `grant_types_supported`包含 `authorization_code`Kesinlikle reddet .`password`和 `implicit`- Evet.
- En azından bir kayıt modüsünü destekleyin:`client_id_metadata_document_supported: true`(CIMD,首选) 、 önceden ayarlanmış müşteri bilgisi, veya `registration_endpoint`(RFC 7591 兼容模式'un geçersiz kılınması)
- Eğer`authorization_response_iss_parameter_supported`Gerçek, müşteri zorlayıcı talepleri otoriteye cevap olarak RFC 9207'ye geri dönmek için.`iss`,并严格将其与重定向前记录发发发人对对对.
- OAuth 2.1 规范下,`response_types_supported`必須精确為`["code"]`- Evet.

Eğer eksik`S256`支持,MCP server 坚决拒绝连接该 IdPPKCE 没有降级模式──若既未声明任何注册模式,又没有预配置的 `client_id`, aynı zamanda bağlantıyı tamamlayamıyor; şimdi kod değiştirmek yerine deployment clear configuration'ı değiştirmek gerekir.

### RFC 9728 ((回顾)  受保护资源元数据

第 16 课介绍了RFC 9728──在生产环境中的关键点是:该文档是客户端获知**当前**MCP sunucuları; güvenceye sahip yetkili sunucuların toplamının tek yetki kaynağı; tek bir MCP sunucu aynı anda birden fazla IDP'ye güvenir.

```json
{
  "resource": "https://notes.example.com",
  "authorization_servers": ["https://auth.example.com", "https://partners.example.com"],
  "scopes_supported": ["mcp:tools.invoke"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://notes.example.com/docs"
}
```

### 客户端 ID 元数据文档(推默认方案)

CIMD, müşteriye kayıt yaptırmak için geleneksel 推 (Push)  modelini 拉 (Pull)  modeline çevirir.`client_id`Bunun yerine kendi kontrolünü yapabilecek bir HTTPS URL ' i doğrudan kullanacak .**作为**Diğerleri`client_id`◊ bu URL bir JSON 元データ dosyasına işaret eder; otoriter servisör OAuth 流ü sırasında bu dosyayı baştan başta çekmek için gerekli ◊ bu ilişki DNS 体系ine dayanır: eğer servis端运维人员信任`app.example.com`Domain Name, o zaman bu bir güvence.`https://app.example.com/client.json`Bu mekanizma, hareketli kayıtların ve dönüşlerin ortadan kaldırılması ve iletişimden kaçınması için`client_id`命名空间耗尽风险,也省去了跨服务器同步状态的复杂性──

客户端所托管的元数据文档结构如下:

```json
{
  "client_id": "https://app.example.com/oauth/client.json",
  "client_name": "Example MCP Client",
  "client_uri": "https://app.example.com",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:7333/callback", "http://localhost:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

文档内部的 `client_id`字段值**必须**Bu dosyanın URL'leri tamamen uyumlu olacaktır.`client_id_metadata_document_supported: true`Bu özellikten destek duyuruyor.

CIMD'nin mevcut kuralları arasında,`client_id`- Evet.`client_name`Özgürlük`redirect_uris`HTTPS URL'leri, kesinlikle içerebilirken, kullanıcı tanımlayıcılarının yolları olması gerekir.`application_type`Ama CIMD'nin zorlayıcı bir parçası değil.`application_type`CIMD  rotası üzerinde ilk seçime kadar kullanılan makineler.

规范明确指出的两大核心安全事实:

- **防范 SSRF：**授权服务器拉取的是攻击者提供的URL,必须严密防范服务端请求伪造(严禁访问内部私有网络及管理端点)
- **防范 localhost 冒充：**CIMD ' den bağımsız olarak yerel saldırganların yasal bir müşteriye ait bir veri adresini kullanmasını engelleyemedik ve herhangi bir şekilde bağlanmamıştı .`localhost`重定向端口── bu nedenle, otorizasyon sunucuları kullanıcı onaylı otorizasyon sayfasını gösterirken,**必须**清晰展示重定向 URI 的主机名,并**应当**Tamamen`localhost`Güvenlik uyarısı yayınlamaya kararlıyım.

CIMD'nin serviste kayıt durumunu sürdürmesi gerekmediğinden, artık DCR gibi karmaşık kayıt hizmet merkezi gibi bir hizmet merkezi gerekmiyor.

Eğer yetkili hizmet yöneticisi bir müşteri tanımlayıcısı önceden dağıtılmışsa, öncelikle belirli bir yayıncıya yönelik bu kayıt belgesi kullanmalı ve sonra otomatik olarak kayıt yaptırmayı denemelmelidir.

### RFC 7591: Abandoned兼容注册路径

DCR 2026-07-28 规范修订中已正式废弃――CIMD kullanılamayan ve yapay olarak önceden kayıt yapılamayan eski sürümlü yetkili hizmetçiyi korumak için yalnızca---兼容客户端发送如下注册请求:

```json
POST /register
Content-Type: application/json

{
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "scope": "mcp:tools.invoke",
  "client_name": "Cursor",
  "software_id": "com.cursor.cursor",
  "software_version": "0.42.0"
}
```

服务端响应 `client_id`Ve sonrasında da yeni bir konutlama kullanımı.`registration_access_token`- ...

```json
{
  "client_id": "c_3e7f1a",
  "client_id_issued_at": 1769472000,
  "redirect_uris": ["http://127.0.0.1:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "registration_access_token": "regt_b2...",
  "registration_client_uri": "https://auth.example.com/register/c_3e7f1a"
}
```

`application_type`具有严格约束力: 回环地址的桌面客户端的使用回环地址的桌面客户端的使用回环地址的使用桌面客户端的使用回环地址的使用桌面客户端的使用回环地址的使用回环地址的使用桌面客户端的使用`native`; servisüstü yönetimlere dayanan web  uygulama müşteriye açıklama yapılması gerekmektedir.`web`HTTPS kullanmak için URI'yi yeniden yönlendirmek`token_endpoint_auth_method: none`Bu doğru varsayılan yapılandırma, bu sırada sadece müşteriye dağıtıldı.`client_id`, sahiplik hakkı kanıtı tamamen PKCE 保障¬¬

Ürünlerin üç büyük savunma tuzağı:

- Kayıt noktası, kaynak IP'ye dayalı olarak çok sıkı bir sınırlama uygulanmalıdır. Aksi halde saldırgan, milyonlarca sahte müşteriyi kaydetmek için bir yazı yazabilir.`client_id`命名空间──必須在注册器处理事業前执行限流校验──
- Bazı işletmeler için zorunlu bir IDP gereksinimleri`software_statement`Bu ders örneği ise kaydedilmeyi gerektirir; ancak üretim sırasında sınavın logikasını artırmak için, kendi yerlerine dönüp yeniden yönlendirilmesinden başka bir şekilde imzalanmamış kayıt reddedilmektedir.
- `registration_access_token`Depolama sırasında gizlenmesi gerekir, kesinlikle açıkça saklanamaz. Bu token 漏洩 saldırganın bu istemci URI'sinin yeniden yönlendirilmesini değiştirebileceği anlamına gelir.

### RFC 8707 回顾) 资源指示符 (Ressource Indicators)

第 16 课 确立该报文结构――生产铁律为: her bir Token 请求都必须包含 `resource=<canonical-mcp-url>`MCP sunucusu , her çağrılmadan önce de doğrulanmalıdır .`token.aud`Kendi kaynak URL'leri ile doğru uyumlu olması. URI'si sunucu için en özel tanımlayıcıdır.**不应**Hızlı bir şekilde ayrılmış.`https://mcp.example.com`- Evet.`https://mcp.example.com/mcp`- Evet.`https://mcp.example.com:8443`Ve `https://mcp.example.com/server/mcp`URI'yi yasal olarak düzenlemektedir.`aud`Bu ders için basitçe kullanıldı.`https://notes.example.com`; aynı domen adı altında işbirliği yapan ve yöneten birden fazla MCP sunucusunun üretim bölümünde, yönteme göre ayrıntılı olarak ayrıştırılmalıdır.

### RFC 7636 ((回顾)  PKCE

PKCE OAuth 2.1 içinde zorunlu bir kural haline geldi.`code_challenge`和 `code_verifier` servis端坚决拒绝任何不带验证器或验证器的哈希值与预存挑战 不符的Token 请求──

### MCP 2026-07-28 授权 Profil 规范

MCP 规范在建立 OAuth 资源服务器安全边界同时, MCP 传输层全面转向无状态化――缓存主体身份决策的协议会议不存在――因此, yetkili层必须对每一个请求进行独立验证:

- RFC 9728 tarafından korunan kaynaklar için veri, 401                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `WWW-Authenticate: Bearer resource_metadata="..."`Başlık sağlıyoruz.**或者**Bilgi noktası üzerinden`/.well-known/oauth-protected-resource`访问(SEP-985 ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓                                                                                                                                                             `authorization_servers`字段**必须**En az bir güvenilir yetkili servisçi listesi oluşturun.
- Bu arada**每一个**Sadece kabul edilmesi için`Authorization: Bearer ...`接收令绝对不能放在URL 查询参数中,也绝对不能仅在会话建立时验证一次.
- 逐请求校验 `aud`- Evet.`iss`- Evet.`exp`Ve gerekli kapsamlar.**必须**验证 Token is specially for its own issuance; eksikliği veya uyumsuzluğu`aud`Doğrudan reddetmek gerekir, asla bir yol olarak kabul edilmez.
- 401/403'e geri dönün.`error=...`- Evet.`resource_metadata="<PRM-URL>"`(元数据文档的完整获取URL*,而非*裸资源地址) ve 403 权限不足时携带 `scope="..."``WWW-Authenticate: Bearer`头──注意:该质问参数名为 `resource_metadata`, bulma işaretine, sorgu başlığı içinde sözde varlık yok`resource`参数。
- 授权服务器服务发现同时兼容 RFC 8414 OAuth 元数据与OpenID Connect Discovery 1.0;客户端应按优先次尝试这两个知名后──
- 客户端(而非服务端) sorumlu savunma**混淆攻击（Mix-Up Attacks）**: 重定向之前记录预期的`issuer`, ve önce, RFC 9207'nin geri dönüşü için sert bir sınavı`iss`参数值──单纯依赖 PKCE 无法防守 Mix-Up 攻击,因为客户端会盲地将 `code_verifier` kötü niyetle yönlendirilmiş hedefler için gönderilme Token 端点──
- 客户端注册凭证属于单个授权服务器发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发`client_id`、 kayıt simgesi veya erişim simgesi
- CIMD ilk seçilen müşteri kayıt mekanizmasıdır.`application_type`- Evet.

OAuth 2.1 草案是底层基石;RFC 8414/7591/8707/9728/9207 + RFC 7636 + CIMD 构成交互表面;MCP 规范则则是集大成的个人资料──

### Çekim ve üretim kapasitesi

Üreticinin özellikleri yayımlanan belgeleri kısa sürede geçecek.

| 核对项目 | 强制要求 |
|---|---|
| 发现的 Issuer | 必须与策略预期的 HTTPS Issuer 字符串精确匹配 |
| PKCE 支持 | 明确声明支持 `S256`；否则坚决终止接入 |
| 注册机制 | 首选 CIMD，接受预注册，仅将 DCR 作为废弃兼容路径 |
| 授权响应 | 出现或声明支持时，必须校验 RFC 9207 `iss` 参数 |
| 资源绑定 | Token 请求携带 `resource`；资源服务器强制校验匹配的 `aud` |
| 凭据存储 | 客户端 ID 与注册凭据以 Issuer 为键；Access Token 以 Issuer + Resource 双重索引 |
| DCR 兼容规范 | 必须声明 `native` 或 `web`；坚决拒绝不符合声明类型的重定向 URI |

Ürün adı veya fiyat seviyesinden teknik destek kapasitesini çıkarmayın.

### JWKS 刷新模式(AS 负责 Rotate,资源服务器负责 Refresh)

İki kelimeyi birbirinden ayırmak zorundadır.

- **轮换（Rotate）：**Evet**授权服务器（AS）**Yapım: Yeni imza özel anahtarı oluşturmak, JWKS'de açıklama yapmak ve daha sonra eski anahtarı kaldırmak.
- **刷新（Refresh）：**Evet**资源服务器**Yapım: HTTP GET üzerinden 重新拉取公开发布的 JWKS 并更新其本地缓存──这是资源服务器唯一需要执行的 JWKS 操作──

Üretim ortamında en tipik sorun modeli**缓存过期失效**Çözüm: Kullanım**定时刷新任务 + 键值缓存** Resource server run a调度任务 (Cron、定时器 or runtime调度机制) olarak belirlenmiş zaman aralığında kullanılır.`<issuer>/.well-known/jwks.json`Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not:`cache[issuer] = {keys, fetched_at}`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △       △ △                                        `kid`Bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu da, bu arada, bu da, bu arada, bu da, bu arada, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu da, bu, bu da, bu, bu da, bu, bu, bu da, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu, bu,**单次**Aynı zamanda iki büyük durumu çözüyor: sabit zaman döngüsü dolaşması ve bir sonraki döngüsü dolaşmadan önce, tüm yeni anahtarlar gönderilen Token'in 提前抵达的密钥重叠窗口期'ı kullanmak.

Geri dönme işleminde**必须是重新拉取（Re-fetch），绝对不能是轮换（Rotate）**◊ Eğer bir kassa kaydedilmezse yanlış bir şekilde 轮换并发发 için bağlanırsa, iki büyük çöküş derecesi eksikliği ortaya çıkarır:`kid`* hala * eşleşemiyor gönderilen Token, test签仍然失败;`kid`Bu, sistemin yeni anahtarlar üretmesini zorlayacak.`kid`En azından bir kez zararsız ve verimsiz satışa çıkaracak.

缓存结构:

```json
{
  "https://auth.example.com": {
    "keys": [
      {"kid": "k_2026_03", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"},
      {"kid": "k_2026_04", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"}
    ],
    "fetched_at": 1772668800
  }
}
```

稳定运行状态下通常同时存在两个密钥.`k_2026_03`Önceden, önceden yeni anahtarlar getirdim.`k_2026_04`), böylece eski anahtar altında gönderilen stok Token'in doğal olarak geçerli kalmasını sağlamak için geçerlidir.`kid`- Evet.

### 统一的 İşaret Verification例程

MCP sunucusu her türlü aracı birleştirmeden önce birleştirmeli.`code/main.py`Orta standart standartlar:

```python
result = server.validate(bearer_token, required_scope="mcp:tools.invoke")
if not result["valid"]:
    return {"status": result["status"], "WWW-Authenticate": result["www_authenticate"]}
```

`validate`函数负责解码 JWT, from JWKS 缓存中解析签名公钥(未命中时触发单次回回退刷新),校验数字签名,然后依次检查 `iss`İle, beyaz liste içinde mi yer alır?`aud`Bu sunucu'nun kurallarına uygun olup olmadığını,`exp`Bu süre tamamlanıp bitmediği ve herhangi bir kontrol başarısız olduğunda, belirli hata açıklamaları ile hemen geri dönüp getirilen bir süre için gerekli kapsamı olup olmadığını belirtmek.`WWW-Authenticate`质询头―― Resource Server'daki tüm kontroller için bu tek örneğin, her bir trafik girişinin (ne olursa olsun) tamamen uyumlu güvenlik kapsamından geçmesini sağlayabilir.

### Çözümlü Token  Kör Tahminler yerine İntrospeksiyon Kullan

Not all Access Token 都是 JWT. Eğer emitter'ın dosyası aşağıda belirtilen açık olmayan Token olduğunu gösterirse, Resource Server cannot locally decode it for credible Claims. Bu durumda, Token'i RFC 7662 Introspection 端点,并强迫要求返回`active: true`、 beklenen emisyoncuların üzerinde aşağıdaki ifadeler 、 kesin eşleşen MCP'ler 、 kullanıcılar veya kaynaklar 、 geçersiz zaman etkinlik iddiaları ve mevcut özel araçların gerekli amaçları 、

İçeri gözden geçirme sonuçları için, kendi yerlerinde depolama yapılması, göndericiler için, Token için, tek yönlü bir bölüm özetleri için, ayrıca MCP kaynakları için karmaşık depolama anahtarı olarak kullanılması.**绝不能**İlk Token'i bir日志 etiketi veya bir缓存 anahtarı olarak kullanmak. TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir缓存 amacıyla TTL'de geçerli bir kez kullanılır.

勿让攻击者通过伪造代币内容诱导服务切换验证模式――必须根据经验证的发发发商元数据和系统配置,预先确定采用JWT 本地签还是网络内视.`jwks_uri`;绝不盲目顺从 Token 头部中声明的密钥URL或加密算法──

### İptal bir zamanlılık anlaşmasıdır.

RFC 7009  Client request authorization server to revoke a Token  Ancak bu revoke request does not automatically delete already existing copy text on various distributed resource servers  Bu revoke request, her türlü dağıtımlı kaynak sunucusunda mevcut olan kopya metni otomatik olarak silmez. Sistemin en fazla kaldırma gecikmesini kabul edebilmesini ve tüm yerel depoları bu zamanın etkisine göre zorlamasını belirlemek zorundadır.

 Açıklama olmayan Token yapılarının kullanımı, yüksek riskli bir şekilde kullanılarak, sıkı bir hazırlıklı bir çıkış veya kısıtlı bir şekilde kullanılarak, sıkı bir çıkış yapılması için geçerli bir bekleme oluşturabilir.  JWT yapılarının kullanımı genellikle aşağıdaki bir kombinasyon kullanılır: Access Token'in geçerli yaşam döngüsünü kısaltmak  IDP tarafında Refresh Token'in iptal edilmesini gerçekleştirmek  Genel güvenlik olayları olduğunda imzalı kamu anahtarını değiştirmek,  ve kullanıcılara yönelik, toplantı veya Token ID'nin yerel siyah isimleri için bir mekanizma uygulamak                                                                                                                                                                                    

Kullanıcı kayıt, hesap kapatma, iptal yetkisi ve acil müdahale, farklı başlatma kaynaklarına ait olsa da, sonuçta bir ölçülebilir sert göstergeye sahip olmalıdır: ilanın iptal penceresinin geçmesi sonrasında, gruptaki tüm kopya örnekler bu sertifikayı kesin olarak reddetmelidir. Bu gösterge, yüklemeden dengeleyici aracılığıyla gerçek bir uçtan sona test başlatmalı, sadece tek bir sıcaklıkta başlayan süreçte kendi kendini test etmemelidir.

### Dışişleri Bakanlığı'nın belirgin bir açıklama gerektiren karar stratejisi

绝不要在异常捕获 (试捕) 代码块中临场发挥发挥制定可用性策略──

| 故障场景 | 生产环境安全应对策略 |
|---|---|
| 定时 JWKS 刷新失败，已知 `kid` 仍在尚未过期的受限缓存中 | 仅在声明的故障容忍窗口内允许降级继续运行，并向外暴露系统健康度降级告警证据 |
| Token 携带未知 `kid` 且仅有的一次重试刷新拉取失败 | 坚决拒绝；绝不接受无法完成密码学验签的 Token |
| Introspection 内部端点不可用 | 针对受保护调用严格执行故障闭合（Fail-closed）；绝不把网络超时转化为 `active: true` |
| 受保护资源或签发者元数据发生非预期突变 | 立即停止接受新注册与新 Token 申请；在受限应急策略下仅维系明确锁定的有效配置 |
| 撤销端点不可用 | 将登出或撤销标记为“未完成”，尽可能在本地将该凭据置为不可用，绝不对外谎称全局撤销成功 |
| 系统时钟源异常或 Claim 时间格式无效 | 坚决拒绝；严禁通过扩大时钟容忍偏差（Clock Skew）来强行放行 Token |

 Altyapı güvenliği bozukluklarla kendiliğinden yasa dışı bir ayrım yapılması gerekir.  Güçlü olmayan sistem bozuklukları, sağlık kontrolü ve yeniden deneme mekanizması işlemeyi birleştirmek için kullanılabilir hale gelmelidir.  Güçsüz imzalanma  İletişim verenlerin eşleşmemesi  İttifak etmeyenlerin  İttifak etmeyenlerin  İttifak etmeyenlerin  İttifak etme hakkı  İkisinin de belirli bir işletme aracı  Logiği ile temas etmesi gerekir.

### 受众重放攻击全流程演练(Açış-Token imtiyazları kısıtlaması)

假设 Server A`notes.example.com`) ile Server B`tasks.example.com`A. Server A. Black Attack tarafından uğursuzca işgal edilmiştir. saldırgan bir kullanıcı notu tokenini çalmış ve B. Server'e yeniden göndermeye çalışmıştır.

Server B'nin test programı aşağıdaki gibi:

1. 解码 JWT, göre `kid`检索 JWKS,验证数字签名──(通过)
2. 核对 `iss`Bu, korunan kaynaklar için veri açıklamasından geçerli mi?`authorization_servers`列表中──((通过属于同一个IDP)
3. 校验 `aud == "https://tasks.example.com"`❖**失败**Token 中真实的 `aud`Çı`https://notes.example.com`)
4. HTTP 401'e geri dön,并携带 `WWW-Authenticate: Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="https://tasks.example.com/.well-known/oauth-protected-resource"`- Evet.

Sözleşme seviyesinde, İzleyiciler İddiaları, bu tür Vietnam Hakkına yönelik saldırıların savunmasında tek engel.**每一个独立请求**Ün kararlı bir şekilde gerçekleştirmek, kesinlikle sadece bir kez bir toplantıda bulunmak için kullanılabilir.**访问令牌特权限制（Access-Token Privilege Restriction）**: MCP sunucusu **必须**İçindeki hiç belirsiz bir özeti belirtilen herhangi bir işaretten kesin olarak kaçınmak.

> **命名辨析：**规范将**混淆代理（Confused Deputy）** Özellikle diğer türde ilgili ama farklı bir hata durumu belirtmek için kullanılır:**代理（Proxy）**, Static All-State Client ID'yi kullanarak, belirli bir terminal kullanıcılarına yönelik yetkili onay almadan körü körü körü gönderme Tokenleri, yukarıda belirtilen hizmetler arası yeniden gönderme saldırılarını çözmek için kullanılır.**并且**严禁将进入站收到的原始代币 直接透传给上游 API(MCP sunucusu **必须**独立申请专门发发往上游 API 的全新独立代币)

### Karışık 混 saldırı (service端无法代劳的客户端防御)

Müşteri, yaşam döngüsü içinde genellikle çeşitli yetkili sunucularla iletişim kurmalıdır. Kötü niyet AS, müşteriyi doğru bir şekilde yasal bir AS olarak gönderilen yetkili kodlara yönlendirebilir.

1. 客户端在发起重定向授权前, 预期的 AS 元数据记录 预期的 AS 元数据记录 预期的 AS 元数据记录 预期的 AS 元数据记录 预期的 AS 元数据记录 预期的 AS 元数据记录 预期的 AS 元数据记录 预期的 AS 元数据记录 预期的 AS 元数据记录 预期的 AS 元数据记录 预期的 AS 元数据记录 预期的 AS 元数据记录 预期的`issuer`İletişim.
2.  Uygulama cevaplarını aldıktan sonra, müşteri, uygulama kodu herhangi bir ağ son noktasına göndermeden önce, önce bunların arasında `iss`参数与此前记录的发发发人进行纯字符精确比对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对
3. Bir zaman eşleşmez veya AS 声明支持`authorization_response_iss_parameter_supported`Bu durumda yanıtlar eksikliği`iss`)→ ııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııııı`error`报错信息――

Sadece PKCE'ye güvenmek, karıştırma saldırılarını savunmak için yetersiz. Çünkü müşteri kendi saldırılarını gerçek anlamda yapmaktadır.`code_verifier`İşte kötü niyetle yönlendirilmiş hedef noktalara teslim edilmiştir. Bu, talep durumunda beklenen göndericinin ve PKCE doğrulayıcısının talep edilmesi gereken zorunlu bir kural ve `state`Aynı kayıtlı nedenlerle.

### 常见故障模式(Başarısız Modlar)

- **陈旧过期的 JWKS：**AS anahtarı değiştirildikten sonra, test sigilci hatası yasal olacaktır Token 拦截── çözüm yukarıda belirtilen 定時刷新任务 + 未命中回退拉取 模式──切勿在没有刷新机制的前提下死板缓存 JWKS──
- **回退机制误搞成密钥轮换：**Bu, çok ciddi bir mantık hatasıdır. Bu sadece bir istek için kayıp olan bir hata değildir.`kid`Ayrıca saldırganların sahte şeyleri kullanmasına izin verecektir.`kid`Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözümler: Çözüm: Ç Ç Ç Çizlem
- **缺失 `aud` Claim：**某些旧版 IdP 默认会省略 `aud`,Birinci olarak , müşteri tarafından açıkça gösterilen bir işaret istekinden başka .`resource`❖ Test makinesinin eksikliği kesin olarak reddetmesi gerekir `aud`Bu işareti, kesinlikle görme engelliğini göstermek için kullanılabilir.
- **遗漏 `iss` 校验导致的 Mix-Up 攻击：**客户端若未校验 RFC 9207 授权响应中                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `iss`参数, dürüst AS'in yetkili kodunu bir kullanıcı kontrolü token 端点'a göndermek için kandırılabilecek. Bu tipik bir müşteri eksikliği, kaynak servisçisinin telafi edemeyeceği bir durumdur.
- **Scope 提升并发竞争：**Aynı kullanıcı'nın iki kez işlem yapma yetkisi yükseltmesi (Step-Up) süreci, önceliklerini başarıyla gerçekleştirerek, farklı amaçlarla iki erişim simgesi üretmelidir.
- **注册 Token 泄露：**Çıkışlar.`registration_access_token`Saldırıcıların kullanıcıların URI'sinin yeniden yönlendirilmesini değiştirmesini sağlar. Depoda bu işlemin daha fazla gizli kalmasını zorlar.
- **未固定 `iss` 白名单：**验签器若盲目接受任何                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `iss`, saldırgan kendi kendine kötü niyet yetkisi sunucu oluşturur, hedef alıcıya yönelik kötü niyet Tokenleri yayımlamak için `authorization_servers`列表就是白名单, 列表就是白名单, 列表就是白名单, 列表就是白名单, 列表就是白名单, 列表就是白名单, 列表就是白名单, 列表就是白名单, 列表就是白名单, 列表就是白名单, 列表就是白名单, 列表就是白名单, 列表就是白名单, 列表就是白名单, 列表就是白名, 列表就是白名, 列表就是白名, 列表就是白名, 列表就是白名, 列表就是白名, 列表就是白名, 列表就是白名, 列表就是白名, 列表就是白名, 列表就是白名, 列表是白名, 列表是白名, 列表是白名, 列表是白名, 列表是白名, 列表是白名, 列表是是白名, 列表是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是是
- **凭据或 Token 缓存键混淆：**客户端 if if if only according to resources on registration certificates to build an index, it may be displaying the credentials of an authorized server sent to another server. 客户端 if only according to issuer on Access Token  if if only according to issuer on Access Token  if only according to resources on registration certificates to build an index, it may be putting the Token  erroneously relayed onto the wrong audience resources.   if only according to the issuer on Access Token  if only according to issuer on Access Token  if only according to issuer on access token  if only according to issuer on access token  if only according to issuer on an index, it may be relayed onto the wrong audience on erroneous audience resources ⋅`(issuer, resource)`复合索引 Erişim Tokeni, ve bir kez签发者变更 yeniden kayıt edilmelidir.

```figure
t3-jwks-rotate
```

## Kullan

`code/main.py`Python standards library'i kullanarak, üç temel rolü kapsayan tam bir üretim sertifikası yetkisi akışını gerçekleştirdi:`AuthorizationServer`- Evet.`ResourceServer`ile`Client`❖ Aşağıdaki adımları uygulayın:

Çıkışlar:

```bash
cd phases/13-tools-and-protocols/18-mcp-auth-production
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Birinci emir, bağlanan göndericinin kayıt ve Token 验证ın tam kontrol tabanı 轨迹日志ı yayınlayacak. İkinci emir, tüm 18 birim testi ile yürütülecek.

1. 授权服务器在 `/.well-known/oauth-authorization-server`RFC 8414 元データ 発行する
2. MCP 客户端调用该端点,审查其注册模式(`client_id_metadata_document_supported`CIMD'ye karşı,`registration_endpoint`DCR'ye karşı ve`S256`PKCE'nin destek durumu:
3. 客户端优先审核对预配置注册,否则使用其托管在HTTPS上的客户端ID元数据文档完成注册──废弃的DCR保留为独立兼容性测试分支──
4. 客户端记录经验的签发者,生成 S256 Challenge,接收单次授权码与 `iss`, çekimle geri dönüş yapan, orijinal doğrulama aracı ile RFC 8707 `resource`指示符向端点 换 Token。
5. MCP 客户端携带 `Authorization: Bearer ...`MCP sunucusu 调用 上的工具──
6. MCP sunucusu 触发 `validate`Örneğin, JWKS'den kayda çözülür.
7. IDP 模拟轮换公钥;定时刷新任务自动拉取最新JWKS 并更新缓存──
8. Sonraki kez, servis yeniden başlatılmadan yeni anahtarın onayını otomatik olarak tamamlayın ve eski token miktarı yeniden yüklenme penceresi döneminde geçerli kalsın.
9. 模拟向另一台MCP 资源发起的受众重放攻击,精准触发 HTTP 401 报错,返回 `audience mismatch`Ve yeniden keşfedilenlerin yönlendirmeleri.`resource_metadata`İndeksi.

Örnekte JWT, üçüncü taraf bağımlılığı olmayan Python standart kütüphanesinde çalışabilmek için, ortak anahtarlı HS256 algoritmasını benimsemiştir.`refresh_jwks`直接读取授权服务器内存密钥列表; çevrimiçi ortamda sadece bir gönderme `jwks_uri`HTTP GET Standartları

## - Söyle.

本课交付 `outputs/skill-mcp-auth.md` MCP sunucusu 配置与 IdP 能力清单, bu beceri otomatik olarak idxal edilebilir doğuştan doğuştan yerleşim yerindeki tüm sertifikasyon koruma yapılarının  dahil olmak üzere korunan kaynaklar ve veriler  seçilen kayıt giriş yolu  CIMD  önceden kayıt veya DCR 底)  JWKS 刷新调度策略、Scope 映射关系,以及 idP 无法完全满足 RFC Profile 时的防御性拒绝规则──

## 课后深练习

1. 运行  İşlem`code/main.py`◊仔细追踪执行流──观察 IdP 在步骤 6 中轮换密钥,定时 `refresh_jwks`重新拉取已发行公钥集合,验证旧代币(重叠窗口期内) ile yeni签发的代币 如何均均在未重启服务的情况下顺利验证签通过──
2. Korunmuş kaynaklar için veri`authorization_servers`Listede yeni bir yasal IDP oluşturuldu. Yeni bir IDP imzaladığı Token, verification verification visa例例程顺利放行.`WWW-Authenticate: Bearer error="invalid_token", error_description="iss not allowed"`- Evet.
3. Çı`register_client`增加速率限制检查,在注册机真正处理请求前执行拦截──在内存中使用按来源IP 为键字典实现轻量级的代币桶 限流器──
4. 研读 RFC 7591 规范,指出示例代码中 `/register`处理器尚未校验的两个协议字段,并补全校验逻辑──(提示:`software_statement`ile`redirect_uris`URI Scheme 协议检查) 』
5. 接入第二台授权服务器──验证客户端能够根据发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发`client_id`İkinci servisçiye tekrar kullanın.
6. 动手复现并修复潜在的 DoS 漏洞: 试签器发送一个包含随机伪造 `kid`Çıkış, onay`refresh_jwks`En az bir kez başlatılır ve yetkili sunucuların kamu anahtarlarının sayısı anormal bir şekilde artmaz. Sonra da aklından gelen olarak geri dönüp mantık değiştirir. Yerel olarak yeni anahtarlar üretir.
7. Ayrılıklı `native`ile`web`两类客户端测试废弃 DCR 路径――验证带有HTTP重定向URI的Web 客户端,以及未使用精确回环重定向的本土客户端会被系统准确拦截拒绝――

## 关键术语

| 术语 | 通俗说法 | 精确工程含义 |
|------|---------|-------------|
| ASM | "OAuth 元数据文档" | RFC 8414 规范的 `/.well-known/oauth-authorization-server` JSON 文档 |
| CIMD | "客户端元数据 URL" | 客户端 ID 元数据文档（Client ID Metadata Document）：将 HTTPS URL 直接作为 `client_id`，由 AS 主动拉取 JSON。MCP 2026-07-28 首选注册方式 |
| DCR | "自助客户端动态注册" | RFC 7591 规定的 `POST /register`；在当前 MCP 规范中已废弃，仅作兼容兜底 |
| JWKS | "用于 JWT 验签的公钥集合" | JSON Web Key Set，从 `jwks_uri` 拉取，内部按 `kid` 进行哈希索引 |
| Rotate vs Refresh | "更新公钥" | **Rotate（轮换）** = 授权服务器签发/作废签名密钥；**Refresh（刷新）** = 资源服务器重新拉取发布的公钥。资源服务器仅能执行 Refresh |
| 资源指示符（Resource indicator） | "受众参数" | RFC 8707 规定的 `resource` 参数，用于将 Token 强绑定到特定 server |
| `aud` Claim | "受众标识" | JWT 中的 Claim 字段，验签器将其与自身的规范化资源 URL 进行严格字符串比对 |
| 受众重放（Audience replay） | "Token 重放攻击" | 将为 Server A 签发的 Token 拿到 Server B 去尝试调用；由受众校验防御（规范术语：访问令牌特权限制） |
| 混淆代理（Confused deputy） | "代理 Token 滥用" | 拥有静态客户端 ID 的 MCP 代理服务在未获取逐客户端同意授权的情况下盲目转发 Token；与受众重放本质不同 |
| Mix-up 混淆攻击 | "Token 端点走错门" | 客户端被恶意诱导将诚实 AS 派发的授权码拿到攻击者控制的端点去兑换；由客户端依照 RFC 9207 `iss` 校验进行防御 |
| `iss` 白名单 | "受信任的授权服务器集合" | 在受保护资源元数据的 `authorization_servers` 字段中显式声明的受信任列表 |
| `resource_metadata` | "去哪里查找 PRM 文档" | 401/403 质询头 `WWW-Authenticate` 中的标准参数，指向 RFC 9728 元数据文档的获取 URL |
| 公共客户端（Public client） | "Native 或浏览器端客户端" | 无法安全保管 `client_secret` 的客户端类型；依赖 PKCE 机制实现所有权证明 |
| `WWW-Authenticate` | "401/403 响应头" | 携带 `Bearer error=...` 等指令指导客户端如何进行凭据补全与错误恢复的标准 HTTP 响应头 |

## 延伸阅读

- [MCP 授权规范（2026-07-28 修订版）](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)- 当前权威的 MCP 授权 Profile
- [MCP 2026-07-28 更新日志](https://modelcontextprotocol.io/specification/2026-07-28/changelog)- CIMD, İhtiyaclı İşlemler, İhtiyaclı İşlemler ve İhtiyaclı İşlemler
- [OAuth 客户端 ID 元数据文档规范草案（draft-ietf-oauth-client-id-metadata-document-00）](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00) CIMD 核心标准
- [RFC 8414 — OAuth 2.0 授权服务器元数据](https://datatracker.ietf.org/doc/html/rfc8414) 服务发现技术契约
- [RFC 7591 — OAuth 2.0 动态客户端注册协议](https://datatracker.ietf.org/doc/html/rfc7591) DCR 规范(向后兼容路径)
- [RFC 7636 — 代码兑换证明密钥（PKCE）](https://datatracker.ietf.org/doc/html/rfc7636) 公共客户端 sahipliği kanıtı
- [RFC 8707 — OAuth 2.0 资源指示符](https://datatracker.ietf.org/doc/html/rfc8707) Halkın merkezi bir mekanizması
- [RFC 9728 — OAuth 2.0 受保护资源元数据](https://datatracker.ietf.org/doc/html/rfc9728) 资源服务器服务发现
- [RFC 9207 — OAuth 2.0 授权服务器签发者识别](https://datatracker.ietf.org/doc/html/rfc9207) Karışık saldırıların savunması için kullanılıyor `iss`参数规范
- [RFC 7662: OAuth 2.0 Token 内省协议（Token Introspection）](https://datatracker.ietf.org/doc/html/rfc7662)
- [RFC 7009: OAuth 2.0 Token 撤销协议（Token Revocation）](https://datatracker.ietf.org/doc/html/rfc7009)
