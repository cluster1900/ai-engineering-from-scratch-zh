# 生产环境中的MCP 认证与识别权:绑定签发人注册与代币机制

> 第16课构建了OAuth 2.1 状态机. 本课针对MCP 2026-07-28 规范加固其生产环境边界:首选客户端 ID 元数据文档 (CIMD),仅将废弃动态客户端注册作为兼容方案,严格检验授权响应中的发件人,根据发件人物理隔离客户端凭证,实现JWKS 定时查询更新,并精确每个无状态请求上受众绑定)
其他
> **规范说明（2026-07-28）：**动态客户端注册(DCR) 正式废弃,首选客户端 ID 元数据文档(CIMD) ・DCR 仅作为后后兼容机制保留――当不得不使用DCR 时,客户端必须声明正确的`application_type`△客户端必须验证存在的RFC 9207`iss`参数值,绝不能跨不同授权服务器签发者复用凭证.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 16 (OAuth 2.1 state machine), Phase 13 · 17 (gateways)
**Time:** ~90 minutes

## 学习目标

- 通过RFC 8414 元数据发现授权服务器并严格核验技术契约.
- 通过客户端ID 元数据文档 (CIMD) 完成客户端注册,并将废弃的DCR 隔离为回归方案.
- 校验 RFC 9207 `iss`根据授权服务器发发行人 (发行人) 分离索引,并将资源绑定
- 根据定时调度缓存和刷新 JWKS 密钥集,确保签名经验在密钥轮换 (Key Rollover) 期间平滑过渡.
- 利用RFC 8707 资源指示符将 Token 强绑定到单个MCP 资源,坚决拒绝混代理 (混-副) 与跨资源复用.
- 理性权衡 JWT 本地验证与代币内视,界定撤销时效性,并在身份基础设施依赖故障时安全降级.
- 完全解授权服务器,资源服务器和客户端的责任,让各方只负责自身边界内的安全检查.
- 对照生产部核对清单审计授权服务器,坚决拒绝不安全的注册模式或代币 跨域复用.

## 问题

第十六课 模拟器在内存中运行OAuth 2.1流程中.

第一个沟是**客户端注册与凭据隔离**△现实企业可能运行数百个MCP服务器和数千个MCP客户端──2026-07-28 规范优先推**客户端 ID 元数据文档（CIMD）**客户端使用其自身控制的带有路径的HTTPSURL作为其客户端标识符,授权服务器在需要时主动取取该元数据.`application_type`△客户端将根据授权服务器签发者分类存储,并将Access Token按`(issuer, resource)`发行者变更意味着必须重新注册,访问不同资源则必须使用单独绑定受众的代币.

第二个沟是**密钥轮换（Key Rotation）**◎JWT本地签名验证依赖于授权服务器发布的JSON Web Key Set (JWKS) ◎授权服务器会定期轮换这些签名密钥 (通常每小时,在安全事件响应时甚至更快) ◎一个在启动时只拉拉一次JWKS的MCP服务器,在首次密钥轮换前正常运行,随后所有后续请求都会因签名失败而报告错误,直到服务重启.

第三沟是**受众绑定（Audience Binding）**△第16课程引入了RFC 8707 资源指示符. 在生产环境中,该指示符成为每个请求不可逾越的硬性要求.`token.aud`与自己的规范化资源URL进行比较,不匹配则立即返回HTTP 401──这是对某个服务器的代币的恶意客户端的唯一防线.

本课程将这三个大沟一一映射到具体的工程构件中:元数据文档应对 HTTP 端点;JWKS 缓存刷新应对定时任务加值缓存;JWT 验证是资源服务器在分发任何工具前必须执行的例程――严格隔离三大角色并让各方仅执行自己的检查:授权服务器负责发送和更换密钥,资源服务器负责缓存和验证,客户端负责服务发现和注册.

## 适用范围:第16课后的生产落地强制规范

[第 16 课：基于 OAuth 2.1 的 MCP 安全](../../16-mcp-security-oauth-2-1/docs/en.md)本课程将重复定义第二套OAuth流程. 本课程将在上述协议基础上探讨上线资源服务器如何在密钥轮换,不透明的代币验证,证书撤销,基础设施故障,版本发布和安全事件响应等现实运营场景中持续实施这些安全规范.

产落地边界更加关注底层运营维护:

-  JWT 路径在每个请求上验证确定发发件者,算法,验证公钥,受众,时间索赔和目的,同时安全更新 JWKS;;
- 不透明代币 路径调用发发发发发发发经认证的内视 端点,校验回归的活跃 状态、受众或资源、过期时间、主体以及 Scope──
- 撤销策略 确定证书必须在长时间内完全失效,以及可能延迟失效的缓存层.
- 由于不需要的基础设施,系统的确定性行为.
- 审计证据记录驱动决策的发行者元数据、公钥集或内查询 响应、代币索赔、策略版本以及拒绝原因,且绝不保存代币 明文。

课程模块的良好正确性. 第十六课证流程的连接性. 第十八课证证证证证证证证证证证,在到达真实的MCP请求路径后,是否能在长期运维中保持可信性,或者在异常时被坚定拦截.

## 概念

### 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签

位于`/.well-known/oauth-authorization-server`文件描述客户端所需的所有信息:

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

客户端在获取MCP资源URL后进行链接发现:先通过RFC 9728的`oauth-protected-resource`通过RFC 8414 (本规范文档) 获取该发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发

对于包含路径的资源标识符,请在该路径前插入已知字段.`https://mcp.example.com/team/server`应对受保护资源的数据址应解析为`https://mcp.example.com/.well-known/oauth-protected-resource/team/server`切勿将`/.well-known/...`错误地增加在资源路径后.

在信任某身份提供商 (IDP) 用于MCP前必须核实的合同项:

- `code_challenge_methods_supported`必须包含`S256`规范明确指出:如果该字段**缺失**则表示该授权服务器不支持PKCE,客户端**必须**拒绝继续执行.
- `grant_types_supported`包含`authorization_code`坚决拒绝`password`和 `implicit`,我知道.
- 至少支持一个注册模式:`client_id_metadata_document_supported: true`预先配置的客户端凭据,或`registration_endpoint`(已废弃的RFC 7591 兼容模式)
- 青春`authorization_response_iss_parameter_supported`实际上,客户端强制要求授权响应中返回RFC 9207 `iss`并且严格将其与重定向前记录发发行者相比.
- 在 OAuth 2.1 规范下,`response_types_supported`必须精确为`["code"]`,我知道.

若缺少`S256`支持,MCP服务器 坚决拒绝接入该 IdPPKCE 没有降级模式――若既未声明任何注册模式,又没有预先配置`client_id`现在应该修改部署清单配置,而不是修改代码.

### 保护资源元数据

第16课介绍了RFC 9728――在生产环境中的关键点是:该文档是客户端获知**当前**单个MCP服务器可以同时信任多个IDP (如一个用于内部员工,另一个用于外部合作伙伴)  RFC 9728 声明这个集合;RFC 8414 声明每个IDP的不同技术能力.

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

客户端不再向授权服务器请求动态生成一个 客户端不再向授权服务器请求动态生成一个`client_id`而是直接控制自己的某个HTTPSURL.**作为**其 其他`client_id`△该URL指向一个JSON元数据文档;授权服务器在OAuth流程中按需主动拉取该文档──信任关系根植于DNS系统:如果服务端运维人员信任`app.example.com`域名,那就在信任管理中`https://app.example.com/client.json`系统的使用率, 系统的使用率,`client_id`命名空间耗尽风险,也省去了跨服务器同步状态的复杂性.

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

文档内部的`client_id`字段值**必须**授权服务器将严格对应,一旦不一致直接拒绝.`client_id_metadata_document_supported: true`声明支持此特征.

在当前的CIMD规范中,`client_id`,我知道.`client_name`与非空的`redirect_uris`客户端标识符必须是带有路径的绝对HTTPSURL──虽然可以包含`application_type`但它不是CIMD的强制性字段.`application_type`强制要求机械套件使用到首选的CIMD路径上.

规范明确指出的两个核心安全事实:

- **防范 SSRF：**授权服务器取取是攻击者提供的URL,必须严密防范服务端请求伪造(严禁访问内部私有网络及管理端点)
- **防范 localhost 冒充：**单靠CIMD 无法阻止本地攻击者使用合法客户端的元数据URL并绑定任意`localhost`因此,授权服务器在显示用户同意授权页面时,**必须**清晰展示重定向 URI 主机名,并**应当**对于纯粹`localhost`发出安全警报.

由于CIMD 无需在服务端持久注册状态,因此不再需要像DCR那样维护复杂的注册服务中心.

如果授权服务器管理员已经预先分配客户端标识符,应优先使用针对特定发件人的预注册凭证,然后再尝试自动注册.

### 已废弃的兼容注册路径

已正式废除了2026-07-28 规范修订中. 仅针对无法使用CIMD的旧版授权服务器保留,并且无法进行人工预注册.

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

服务端响应`client_id`及后续更新配置使用的`registration_access_token`其他:

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

`application_type`具有严格约束力:使用回环地址的桌面客户端必须声明为`native`基于服务端托管的网络应用客户端必须声明为`web`没有使用HTTPS重定向URI──对于公共原生客户端,`token_endpoint_auth_method: none`是正确的默认配置,此时客户端只分配到`client_id`拥有权证明完全依赖于PKCE保障.

生产落地三大防御陷:

- 登录端点必须基于源头IP进行严格的限制.否则攻击者可以编写脚本登记数百万虚假客户端,耗尽.`client_id`命名空间――必须在注册器处理业务前执行流程限量校验――
- 某些企业级IDP强制要求提供`software_statement`对于客户端背书的已签名JWT) 〔本课例将其省略;但在生产中应增加校验逻辑,拒绝除本地回环重定向之外未签名注册〕
- `registration_access_token`在存储时必须加密,绝不能明文保存.

### 资源指示符 (RFC 8707 资源指标)

第16课 建立了该报文结构――生产铁律为:每一个标志 要求都必须包含`resource=<canonical-mcp-url>`并且每次调用时都必须验证`token.aud`规范化URI是服务器最具特异性的标识符:采用小写协议名和主机名,不带URL片段(#碎片),通常不带末尾斜──根据规范,路径部分**不应**随意剥离它精准识别了单独的MCP服务器.`https://mcp.example.com`,我知道.`https://mcp.example.com/mcp`,我知道.`https://mcp.example.com:8443`及`https://mcp.example.com/server/mcp`对于每个服务器,选取一个规范的URI,并将`aud`与其完全固定──(本课为了代码简洁使用纯主机名受众如`https://notes.example.com`在同一域名下协同托管多个MCP服务器的生产部署中,应按路径精准分区.

### 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签

在OAuth 2.1 中,PKCE已成为强制规范.`code_challenge`和 `code_verifier`△服务端坚决拒绝任何不带验证器或验证器的哈希值与预存挑战 不符的代币请求。

### 授权 规范

当前MCP规范在建立OAuth资源服务器安全边界时,将MCP传输层全面转向无状态化.

- 实现RFC 9728受保护资源数据,其访问路径可通过401 响应中`WWW-Authenticate: Bearer resource_metadata="..."`头部提供,**或者**通过知名端点`/.well-known/oauth-protected-resource`访问(SEP-985 将该响应头设为可选,并以知名端点作为底) ――元数据中`authorization_servers`字段**必须**列出至少一个受信任的授权服务器.
- 在**每一个**要求均通过`Authorization: Bearer ...`接收代币绝不能放在URL查询参数中,也绝不能仅仅在会话建立时验证一次.
- 逐请求校验`aud`,我知道.`iss`,我知道.`exp`以及所需的范围──服务器**必须**验证代币是专门发行的;缺少或不匹配`aud`必须直接拒绝,绝不能作为通配符放行.
- 在回归401/403 响应时,回归带有`error=...`,我知道.`resource_metadata="<PRM-URL>"`随着403 权限不足的运载`scope="..."`的`WWW-Authenticate: Bearer`头――注意:该质询参数名为`resource_metadata`发现指针,质询头中没有所谓的`resource`参数.
- 授权服务器服务发现同时兼容RFC 8414 OAuth 元数据与OpenID Connect Discovery 1.0;客户端应按优先级次尝试这两个知名后──
- 客户端 (而非服务端) 负责防御**混淆攻击（Mix-Up Attacks）**预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期记录 预期`issuer`之前,严格校验授权响应中返回的RFC 9207 `iss`参数值――单纯依赖PKCE 无法防范混合攻击,因为客户端会盲目地将`code_verifier`提交给被恶意引导的目标标志 端点.
- 客户端注册凭证属于单个授权服务器发发发件人. 如果服务发现已解决了不同的发发发件人,客户端必须重新注册,坚决不能表现旧的.`client_id`、注册令牌或访问令牌──
- 首选的客户端注册机制.`application_type`,我知道.

标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签

### 生产部署能力核对清单

厂商的特性宣传文档很快就会过去了时间. 必须直接抓取实际部署授权服务器返回的元数据文档进行审查.

| 核对项目 | 强制要求 |
|---|---|
| 发现的 Issuer | 必须与策略预期的 HTTPS Issuer 字符串精确匹配 |
| PKCE 支持 | 明确声明支持 `S256`；否则坚决终止接入 |
| 注册机制 | 首选 CIMD，接受预注册，仅将 DCR 作为废弃兼容路径 |
| 授权响应 | 出现或声明支持时，必须校验 RFC 9207 `iss` 参数 |
| 资源绑定 | Token 请求携带 `resource`；资源服务器强制校验匹配的 `aud` |
| 凭据存储 | 客户端 ID 与注册凭据以 Issuer 为键；Access Token 以 Issuer + Resource 双重索引 |
| DCR 兼容规范 | 必须声明 `native` 或 `web`；坚决拒绝不符合声明类型的重定向 URI |

由于不需要使用任何技术支持的技术,因此不需要使用任何技术支持的技术支持.

###  JWKS 刷新模式(AS 负责 转换,资源服务器负责 更新)

必须严格区分两个动词,在生产中混它们是非常容易发生的真实错误:

- **轮换（Rotate）：**是的**授权服务器（AS）**行为:生成新的签名私钥,在JWKS中公布对应公钥,然后稍后将旧密钥废除.
- **刷新（Refresh）：**是的**资源服务器**通过HTTP GET 重新拉取公开发布的JWKS并更新其本地缓存――这是资源服务器唯一需要执行的JWKS操作――

生产环境中最典型的故障模式是**缓存过期失效**◎解决方案是采用**定时刷新任务 + 键值缓存**△资源服务器运行调度任务 (Cron、定时器或运行时调度机制),以固定时间间隔抓取`<issuer>/.well-known/jwks.json`并覆盖写入`cache[issuer] = {keys, fetched_at}`△验签器直接读取该内存缓存──若某个代币的 △`kid`在当前缓存中未命中,触发**单次**同步回刷新,然后重新检查. 这同时解决了两个大场景:定时周期刷新,以及在下一个周期刷新之前,采用全新密钥发发行的代币 提前抵达的密钥重叠窗口期.

返回操作**必须是重新拉取（Re-fetch），绝对不能是轮换（Rotate）**△如果将缓存未定中路径错误地连接为轮换并发发,会引发两大崩级缺陷:`kid`攻击者恶意并发发送携带随机虚假`kid`标志将迫使系统无限生成新密钥,造成灾难性的自拒服务,而重新拉取是等,伪造的.`kid`最后只会带来一次无害的无效的开销.

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

稳定运行状态下通常同时存在两个密钥.授权服务器在淘汰旧密钥.`k_2026_03`之前,会提前引入下一代新密钥`k_2026_04`),以确保在旧密钥下发发行的存储量代币在自然过期前仍然有效.`kid`进行精准路由.

### 统一的标志验证例程

在发行任何工具之前必须统一执行验证.`code/main.py`中的标准调用范式如下:

```python
result = server.validate(bearer_token, required_scope="mcp:tools.invoke")
if not result["valid"]:
    return {"status": result["status"], "WWW-Authenticate": result["www_authenticate"]}
```

`validate`函数负责解码 JWT,从 JWKS 缓存中解析签名公钥(未命中时触发单次回退刷新),校验数字签名,然后依次检查 `iss`是否位于白名单内,`aud`是否与本服务器规范化资源标识一致,`exp`检查失败后,立即返回,带有具体错误说明.`WWW-Authenticate`质询头.将所有检查封装为资源服务器的单一程序,可以确保每一个流量入口 (不管是什么工具调用,哪种传输层) 都经过完全一致的安全门禁,消除任何未经过的经验即可直接到达业务逻辑的绕过漏洞.

### 不透明代币 采用内观而非盲目猜测

并非所有访问代币都是 JWT. 如果发行者文件表明下发发的是不透明的代币,资源服务器便无法本地将其解码为可信的索赔.`active: true`、符合预期的发发行人下文、精确匹配的MCP受众或资源、未过期的时效索赔以及当前具体工具所需的目标──

作为一个复合缓存键,MCP资源也被用于进行本地缓存.**绝不能**把原始代币 明文作为日志标签或缓存钥匙.将有效缓存条目的 TTL 上限限制在代币到期时间,发行者缓存指南以及系统定义的撤销时效性目标三者中最早的时间点. 对否定缓存的缓存时间 ((负面缓存,即无效代币) 的缓存时间要足够短,以免合法新发行的代币被误判为未持续激活. 即使不透明的代币字符串本身完全相同,通过某个资源验证的结果也绝不能过权授权另一个资源.

勿让攻击者通过伪造代币内容诱导服务切换验证模式.必须根据经验验的发件者数据和系统配置,预先确定采用JWT本地签证还是网络内查.`jwks_uri`绝不盲目遵守标记头部声明的密钥URL或加密算法

### 撤销是一种时效性契约 (Freshness Contract)

客户端请求授权服务器撤销某个代币.但该撤销请求不会自动删除已存在的各分布式资源服务器上的副本文本.必须确定系统所能容忍的最大撤销延迟,并强制所有本地缓存遵守该时效约束.

采用不透明代币的架构可以通过高危调用发出逐步的内查询或配置极短的有效缓存来实现严格的准实时撤销.而自含的JWT架构通常采用以下组合拳:缩短Access Token的有效生命周期.在IDP侧实现Refresh Token撤销.在发生全局安全事件时执行签名公钥轮换退役,并帮助针对主体,会话或代币ID的本地黑名单机制应对紧急阻.已签名的JWT在达到标志的期限之前,在密码学上始终有效,除非资源服务器获得权威的外部撤销证据.

虽然属于不同的触发源,但最终都必须得到一个可量化的硬指标:在宣布的撤销窗口的过期后,集群中的所有副本实例必须坚决拒绝该证书.

### 应对外界的依赖障碍需要明确声明的决策策策略

绝对不要在异常捕获中试图捕获代码块发挥可用的策略.

| 故障场景 | 生产环境安全应对策略 |
|---|---|
| 定时 JWKS 刷新失败，已知 `kid` 仍在尚未过期的受限缓存中 | 仅在声明的故障容忍窗口内允许降级继续运行，并向外暴露系统健康度降级告警证据 |
| Token 携带未知 `kid` 且仅有的一次重试刷新拉取失败 | 坚决拒绝；绝不接受无法完成密码学验签的 Token |
| Introspection 内部端点不可用 | 针对受保护调用严格执行故障闭合（Fail-closed）；绝不把网络超时转化为 `active: true` |
| 受保护资源或签发者元数据发生非预期突变 | 立即停止接受新注册与新 Token 申请；在受限应急策略下仅维系明确锁定的有效配置 |
| 撤销端点不可用 | 将登出或撤销标记为“未完成”，尽可能在本地将该凭据置为不可用，绝不对外谎称全局撤销成功 |
| 系统时钟源异常或 Claim 时间格式无效 | 坚决拒绝；严禁通过扩大时钟容忍偏差（Clock Skew）来强行放行 Token |

必须将基础设施依赖故障与凭证本身的非法清晰区分. 依赖不可用的运维层级的系统故障,需要结合健康检查和重试机制处理;而无效签名、发行者不匹配、受众不符、超时过期或权限不足属于确定性的识别权拒绝. 两者都不得触及具体的业务工具逻辑,并且两者都不允许在审计日志中泄露完整的代币 明文.

### 受众重放攻击全流程演练(访问代码特权限制)

假设服务器 A`notes.example.com`) 与服务器B`tasks.example.com`攻击者窃取了某个用户的备注代币,并试图将其重置到B服务器上调用任务接口.

服务器B的验证程序执行逻辑如下:

1. 解码 JWT,根据 `kid`检索 JWKS,验证数字签名──(通过)
2. 核对`iss`是否存在其受保护资源数据声明`authorization_servers`列表中──(通过属于同一个IDP)
3. 校验`aud == "https://tasks.example.com"`〔(**失败**Token 中真实`aud`为`https://notes.example.com`)
4. 返回HTTP 401 响应,并携带 `WWW-Authenticate: Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="https://tasks.example.com/.well-known/oauth-protected-resource"`,我知道.

在协议层面上,观众声称是防御这种向越权攻击的唯一障碍.**每一个独立请求**在规范术语中,这个机制被称为"论" (construction) 系统.**访问令牌特权限制（Access-Token Privilege Restriction）**服务器:MCP **必须**坚决拒绝任何在受众中未明确列出自己的标志.

> **命名辨析：**规范将**混淆代理（Confused Deputy）**专门用于指代其他类型相关但不同的漏洞场景:即某个MCP服务器充当调用第三方API的OAuth**代理（Proxy）**通过静态全局客户端ID,在未获取针对特定终端用户授权同意的情况下盲目转发代币.受众绑定用于解决上述跨服务重置攻击;而混代理防御要求遵循客户端授权同意原则,**并且**严禁将进入站收到的原始代币 直接通过传输给上游API(MCP服务器 **必须**独立申请专门发往上游 API 的全新独立代币) 👇

### 混攻击 (服务端无法代劳的客户端防御)

客户端在其生命周期中通常需要与多个不同的授权服务器交互.恶意AS可能会诱导客户端将诚实合法的授权码发行,获得攻击者控制的代币端点去换.受众绑定对此无力为力因为在换授权码的阶段,甚至都还没有发行任何代币.防御机制必须完全由客户端侧实施:RFC 9207):

1. 客户端在发起重定向授权之前,根据已验证的AS元数据记录预期的`issuer`标识符.
2. 接收授权响应后,客户端将授权码发送到任何网络端点之前,首先将其中的`iss`参数与此前记录的发发发行者进行纯字符精确比对(禁止大小写折叠或URL规范化) 👇
3. 一旦不匹配或在 AS 声明支持`authorization_response_iss_parameter_supported`应应中缺失`iss`)→ 立即拒绝,绝不显示攻击者构建的反应`error`报错信息.

单纯依赖PKCE 无法防范混攻击,因为客户端会老实实地把自己的`code_verifier`手提交给被恶意诱导的目标端点. 这正是规范强制要求在逐请求状态中将预期的发射者与PKCE验证器`state`记录的原因.

### 常见故障模式 (故障模式)

- **陈旧过期的 JWKS：**在 AS 轮换密钥后,验签器误将合法 Token 拦截.解决方案是上述定时刷新任务 + 未预定回退拉取 模式.
- **回退机制误搞成密钥轮换：**缓存未预期的返回路错误实现为本地生成新密钥而不是向外重新拉取,这是一个极其严重的逻辑错误:它不仅永远无法发出请求中缺失的错误.`kid`攻击者也会利用伪造的东西`kid`实施密钥爆炸式DoS攻击.
- **缺失 `aud` Claim：**某些旧版本的IDP默认会省略`aud`否则客户端在代币请求中明确提供`resource`△ 验签器必须坚决拒绝缺失`aud`标志,绝对不能把缺失视为通配放行.
- **遗漏 `iss` 校验导致的 Mix-Up 攻击：**客户端若未校验 RFC 9207 授权响应中`iss`参数,可能会被诱惑将诚实AS的授权码提交给黑客控制的代币端点.
- **Scope 提升并发竞争：**同一个用户的两次发发权限升级 (Step-Up) 流程可能先后成功,产生具有不同 Scope 的两个 Access Token. 验证器必须完全根据当前请求附带的具体 Token 进行判断,绝不能去数据库异步查询所谓的该用户当前最新 Scope 那将产生严重的 TOCTOU 竞争态漏洞.
- **注册 Token 泄露：**泄露的`registration_access_token`攻击者将能够改客户端的重定向URI. 必须在存储库中加加密. 强制客户端在每次更新中显示明文.
- **未固定 `iss` 白名单：**验签器若盲目接受任何东西`iss`攻击者可自建恶意授权服务器,针对目标受众发送恶意代币.`authorization_servers`列表就是白名单,必须坚决执行匹配考试.
- **凭据或 Token 缓存键混淆：**客户端如果仅根据资源建立索引,可能会向另一个服务器展示授权服务器发送的证书.`(issuer, resource)`复合索引 访问令牌,并且一旦签发者变更必须重新注册.

```figure
t3-jwks-rotate
```

## 使用它

`code/main.py`使用Python 标准库实现了完整的生产认证授权流水线,包括三个核心角色:`AuthorizationServer`,我知道.`ResourceServer`与`Client`△执行步骤如下:

在代码仓库根目录下运行:

```bash
cd phases/13-tools-and-protocols/18-mcp-auth-production
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

第一个命令将输出绑定发件人注册和证券验证的完整控制台轨迹日志. 第二个命令将运行通过全部18个单元测试.

1. 授权服务器在`/.well-known/oauth-authorization-server`发布RFC 8414 元数据──
2. 客户端调用该端点,审查其注册模式`client_id_metadata_document_supported`对 CIMD,`registration_endpoint`对应DCR) 以及对`S256`支持PKCE的情况
3. 客户端优先核准预配置注册,否则使用其托管在HTTPS上客户端ID元数据文档完成注册――废弃的DCR保留为独立的兼容性测试分支――
4. 客户端记录经验的发发件人,生成S256挑战,接收单次授权码与`iss`核对返回发出者,并携带原始验证器与RFC 8707 `resource`指示符向端点换标志──
5. 客户端携带`Authorization: Bearer ...`调用MCP服务器上的工具──
6. 触发  MCP 服务器`validate`通过 JWKS 缓存中解析对应的公钥完成验证.
7.  idP 模拟轮换公钥;定时刷新任务自动拉取最新的 JWKS 并更新缓存.
8. 下一次调用在无需重启服务的情况下自动完成新公钥的验证,并且存储旧代币在重叠窗口期间仍然有效.
9. 模拟向另一家MCP发起受众重放攻击,精准触发HTTP 401 报错,返回 `audience mismatch`及重新发现的指导`resource_metadata`针

在示例中,JWT 为了能够在无第三方依赖的Python 标准库中运行,采用了带有共享密钥的HS256 算法.`refresh_jwks`直接读取授权服务器内存密钥列表;在线环境中它只是一个发往`jwks_uri`的标准 HTTP GET 请求──

## 交付它

本课交付 `outputs/skill-mcp-auth.md`△给一个MCP服务器配置与IDP能力清单,该技能可自动输入出生产地的全套认证防护构件,包括受保护资源元数据,可选的注册接入路径,CIMD,预注册或DCR的基础) ✓JWKS 更新调度策略,范围映射关系以及IDP无法完全满足RFC配置文件的防御性拒绝规则.

## 课后深度练习

1. 运行`code/main.py`仔细追踪执行流.观察 IdP 在步骤 6 中轮换密钥,定时 `refresh_jwks`重新拉取已发布的公钥集合,验证旧代币(重叠窗口期内) 与新发发行的代币 如何均在未重新启动服务的情况下顺利验证签通过.
2. 在受保护资源数据元的`authorization_servers`列表中新增一个合法的IDP──签发一个由该新IDP签署的代币,验证验证签证例程顺利放行──随后签发一个由未列入白名单的外部IDP签署的代币,验证系统坚决阻断并返回`WWW-Authenticate: Bearer error="invalid_token", error_description="iss not allowed"`,我知道.
3. 为`register_client`增加速度限制检查,在注册器真正处理请求前执行拦截. 在内存中使用按来源IP 为键字典实现轻量级的代币桶限制器.
4. 研读RFC 7591 规范,指出示例代码中 `/register`处理器尚未校验的两个协议字段,并补全校验逻辑──(提示:`software_statement`与`redirect_uris`协议检查) 〔
5. 接入第二台授权服务器.验证客户端能够根据发发件人严格独立保存不同的注册证书,并坚决拒绝将第一个发件人的代币或代币.`client_id`复用到第二台服务器上.
6. 动手复现并修复潜在的DoS漏洞:向验签器发送一个包含随机伪造的`kid`标志,确认`refresh_jwks`最多只触发一次,并且授权服务器的公钥数量不会异常增加. 然后故意将返回逻辑改成本地轮换生成新密钥,观察伪造的代币如何导致密钥数量增加.
7. 针对别人`native`与`web`两类客户端测试已废弃的DCR路径──验证带有HTTP重定向URI的Web客户端,以及未使用精确回环重定向的本地客户端会被系统准确拦截拒绝──

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

- [MCP 授权规范（2026-07-28 修订版）](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)- 当前权威的MCP 授权个人资料
- [MCP 2026-07-28 更新日志](https://modelcontextprotocol.io/specification/2026-07-28/changelog)- 涵盖CIMD、签发者校验、DCR 废弃以及凭据隔离的关键变化
- [OAuth 客户端 ID 元数据文档规范草案（draft-ietf-oauth-client-id-metadata-document-00）](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00) CIMD 核心标准
- [RFC 8414 — OAuth 2.0 授权服务器元数据](https://datatracker.ietf.org/doc/html/rfc8414) 服务发现技术契约
- [RFC 7591 — OAuth 2.0 动态客户端注册协议](https://datatracker.ietf.org/doc/html/rfc7591) DCR 规范 (向后兼容路径)
- [RFC 7636 — 代码兑换证明密钥（PKCE）](https://datatracker.ietf.org/doc/html/rfc7636) 公共客户端所有权证明
- [RFC 8707 — OAuth 2.0 资源指示符](https://datatracker.ietf.org/doc/html/rfc8707)受众锁定核心机制
- [RFC 9728 — OAuth 2.0 受保护资源元数据](https://datatracker.ietf.org/doc/html/rfc9728) 资源服务器服务发现
- [RFC 9207 — OAuth 2.0 授权服务器签发者识别](https://datatracker.ietf.org/doc/html/rfc9207)为了防守混攻击`iss`参数规范
- [RFC 7662: OAuth 2.0 Token 内省协议（Token Introspection）](https://datatracker.ietf.org/doc/html/rfc7662)
- [RFC 7009: OAuth 2.0 Token 撤销协议（Token Revocation）](https://datatracker.ietf.org/doc/html/rfc7009)
