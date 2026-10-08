# 生产环境中的 MCP 认证与鉴权：绑定签发者的注册与 Token 机制

> 第 16 课构建了 OAuth 2.1 状态机。本课针对 MCP 2026-07-28 规范加固其生产环境边界：首选客户端 ID 元数据文档（CIMD），仅将废弃的动态客户端注册作为兼容方案，严格校验授权响应中的签发者，按签发者物理隔离客户端凭据，实现 JWKS 定时轮询刷新，并在每一个无状态请求上精确校验受众绑定（Audience-Pinned Tokens）。
>
> **规范说明（2026-07-28）：** 动态客户端注册（DCR）已被正式废弃，首选客户端 ID 元数据文档（CIMD）。DCR 仅作为向后兼容机制保留。当不得不使用 DCR 时，客户端必须声明正确的 `application_type`。客户端必须校验存在的 RFC 9207 `iss` 参数值，绝不能跨不同的授权服务器签发者复用凭据。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 16 (OAuth 2.1 state machine), Phase 13 · 17 (gateways)
**Time:** ~90 minutes

## 学习目标

- 通过 RFC 8414 元数据发现授权服务器并严格核验技术契约。
- 通过客户端 ID 元数据文档（CIMD）完成客户端注册，并将已废弃的 DCR 隔离为回退方案。
- 校验 RFC 9207 `iss`，将客户端注册凭据按授权服务器签发者（Issuer）隔离索引，并将资源绑定 Token 按签发者与资源双重索引存储。
- 按照定时调度缓存和刷新 JWKS 密钥集，确保签名校验在密钥轮换（Key Rollover）期间平滑过渡。
- 利用 RFC 8707 资源指示符将 Token 强绑定到单一 MCP 资源，坚决拒绝混淆代理（Confused-Deputy）与跨资源复用。
- 理性权衡 JWT 本地验证与 Token Introspection，界定撤销时效性（Revocation Freshness），并在身份基础设施依赖故障时安全降级。
- 彻底解耦授权服务器、资源服务器与客户端的职责，使各方仅负责自身边界内的安全检查。
- 对照生产部署核对清单审计授权服务器，坚决拒绝不安全的注册模式或 Token 跨域复用。

## 问题

第 16 课的模拟器是在内存中运行 OAuth 2.1 流程的。但在真实生产环境中，存在纯内存模拟器所无法察觉的三大工程鸿沟：

第一个鸿沟是**客户端注册与凭据隔离**。现实企业可能运行着数百个 MCP server 和数千个 MCP client。2026-07-28 规范优先推荐**客户端 ID 元数据文档（CIMD）**：客户端使用由其自身掌控的、带有路径的 HTTPS URL 作为其客户端标识符，授权服务器在需要时主动拉取该元数据。RFC 7591 动态客户端注册（DCR）仅作为已废弃的向后兼容路径保留。在不得不使用 DCR 的场景下，请求必须明确声明正确的 `application_type`。客户端将注册凭据按授权服务器签发者分类存储，并将 Access Token 按 `(issuer, resource)` 二元组建立索引。签发者变更意味着必须重新注册，而访问不同资源则必须使用单独绑定受众的 Token。

第二个鸿沟是**密钥轮换（Key Rotation）**。JWT 本地签名校验依赖于授权服务器发布的 JSON Web Key Set（JWKS）。授权服务器会定期轮换这些签名密钥（通常是每小时，在安全事件响应时甚至更快）。一个在启动时仅拉取一次 JWKS 的 MCP server，在首次密钥轮换前能正常运行，随后所有后续请求都将因验签失败而报错，直至服务重启。生产环境必须将 JWKS 封装为带缓存的键值存储，通过定时刷新任务在旧密钥失效前拉取最新公钥，并在遇到未知密钥时支持一次回退刷新，以应对因时钟差异提前到达的新密钥签发 Token。

第三个鸿沟是**受众绑定（Audience Binding）**。第 16 课引入了 RFC 8707 资源指示符。在生产环境中，该指示符成为每个请求上不可逾越的硬性 Claim 校验。MCP server 会把 `token.aud` 与自身的规范化资源 URL 进行比对，不匹配则立即返回 HTTP 401。这是防御上游 MCP server（或持有针对某台 server 的 Token 的恶意客户端）在同一信任网格内向另一台 server 重放 Token 的唯一防线。

本课将这三大鸿沟一一映射到具体的工程构件中：元数据文档对应一个 HTTP 端点；JWKS 缓存刷新对应一个定时任务加键值缓存；JWT 验证是资源服务器在分发任何 tool 前必须执行的例程。严格隔离三大角色并让各方仅执行自身所属的检查：授权服务器负责签发与轮换密钥，资源服务器负责缓存与验证，客户端负责服务发现与注册。

## 适用范围：第 16 课之后的生产落地强制规范

[第 16 课：基于 OAuth 2.1 的 MCP 安全](../../16-mcp-security-oauth-2-1/docs/en.md) 涵盖了授权码状态机、PKCE、受保护资源发现、资源指示符以及 Scope 决策机制。本课不会重复定义第二套 OAuth 流程。本课在上述契约建立的基础上，探讨已上线的资源服务器如何在密钥轮换、不透明 Token 验证、证书撤销、基础设施故障、版本灰度发布和安全事件响应等真实运维场景中持续落实这些安全规范。

生产落地边界更加聚焦于底层运维保障：

- JWT 路径在每个请求上校验固定的签发者、算法、验签公钥、受众、时间 Claims 与 Scopes，同时安全地刷新 JWKS。
- 不透明 Token 路径调用签发者经过认证的 Introspection 端点，校验返回的 active 状态、受众或资源、过期时间、主体以及 Scopes。
- 撤销策略明确定义凭证必须在多长时间内彻底失效，以及哪些缓存层可能会延迟该失效。
- 故障策略明确界定在服务发现、JWKS、Introspection 或撤销基础设施不可用时系统的确定性行为。
- 审计证据记录驱动决策的签发者元数据、公钥集或 Introspection 响应、Token Claims、策略版本以及拒绝原因，且绝不保存 Token 明文。

这种职责划分保持了课程模块的良好正交性。第 16 课验证流程的连通性；第 18 课则证明 Token 在抵达真实的 MCP 请求路径后，能否在长期运维中依然保持可信，或在异常时被坚决拦截。

## 概念

### RFC 8414 — OAuth 授权服务器元数据

位于 `/.well-known/oauth-authorization-server` 的文档描述了客户端所需的一切信息：

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

客户端在获得 MCP 资源 URL 后进行链式发现：先通过 RFC 9728 的 `oauth-protected-resource`（资源服务器文档）获知所信任的签发者，随后通过 RFC 8414（本规范文档）获取该签发者的各个服务端点。客户端永远不要硬编码授权端点 URL。

对于包含路径的资源标识符，请在该路径前插入 well-known 字段。例如，`https://mcp.example.com/team/server` 对应的受保护资源元数据地址应解析为 `https://mcp.example.com/.well-known/oauth-protected-resource/team/server`。切勿将 `/.well-known/...` 错误地追加在资源路径之后。

在信任某个身份提供商（IdP）用于 MCP 前必须核验的契约项：

- `code_challenge_methods_supported` 必须包含 `S256`（符合 RFC 7636 的 PKCE 要求）。规范明确指出：如果该字段**缺失**，则表示该授权服务器不支持 PKCE，客户端**必须**拒绝继续执行。
- `grant_types_supported` 包含 `authorization_code`，坚决拒绝 `password` 和 `implicit`。
- 至少支持一种注册模式：`client_id_metadata_document_supported: true`（CIMD，首选）、预先配置的客户端凭据，或者 `registration_endpoint`（已废弃的 RFC 7591 兼容模式）。
- 若 `authorization_response_iss_parameter_supported` 为 true，客户端强制要求授权响应中返回 RFC 9207 `iss`，并严格将其与重定向之前记录的签发者比对。
- 在 OAuth 2.1 规范下，`response_types_supported` 必须精确为 `["code"]`。

若缺少 `S256` 支持，MCP server 坚决拒绝接入该 IdP——PKCE 没有降级模式。若既未声明任何注册模式，又没有预先配置的 `client_id`，同样无法完成接入；此时应修正部署清单配置，而不是修改代码。

### RFC 9728（回顾）— 受保护资源元数据

第 16 课介绍了 RFC 9728。在生产环境中的关键点是：该文档是客户端获知**当前** MCP server 所信任的授权服务器集合的唯一权威来源。单个 MCP server 可以同时信任多个 IdP（如一个用于内部员工，另一个用于外部合作伙伴）。RFC 9728 声明这一集合；RFC 8414 则声明每个 IdP 各自的技术能力。

```json
{
  "resource": "https://notes.example.com",
  "authorization_servers": ["https://auth.example.com", "https://partners.example.com"],
  "scopes_supported": ["mcp:tools.invoke"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://notes.example.com/docs"
}
```

### 客户端 ID 元数据文档（推荐默认方案）

CIMD 将客户端注册从传统的“推（Push）”模式反转为“拉（Pull）”模式。客户端不再向授权服务器请求动态生成一个 `client_id`，而是直接将自身能够控制的某个 HTTPS URL **作为**其 `client_id`。该 URL 指向一份 JSON 元数据文档；授权服务器在 OAuth 流程中按需主动拉取该文档。信任关系根植于 DNS 体系：如果服务端运维人员信任 `app.example.com` 域名，那么它就信任托管在 `https://app.example.com/client.json` 上的客户端。这一机制消除了动态注册往返交互，避免了 `client_id` 命名空间耗尽风险，也省去了跨服务器同步状态的复杂性。

客户端所托管的元数据文档结构如下：

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

文档内部的 `client_id` 字段值**必须**与托管该文档的 URL 完全一致（授权服务器会严格比对，一旦不一致直接拒绝）。授权服务器在自身的 RFC 8414 元数据中通过 `client_id_metadata_document_supported: true` 声明支持此特性。

在当前的 CIMD 规范中，`client_id`、`client_name` 与非空的 `redirect_uris` 数组为必填项。客户端标识符必须是带有路径的绝对 HTTPS URL。虽然可以包含 `application_type`，但它并不是 CIMD 的强制字段。不要将 DCR 中对 `application_type` 的强制要求机械套用到首选的 CIMD 路径上。

规范明确指出的两大核心安全事实：

- **防范 SSRF：** 授权服务器拉取的是攻击者提供的 URL，必须严密防范服务端请求伪造（严禁访问内部私有网络及管理端点）。
- **防范 localhost 冒充：** 单靠 CIMD 无法阻止本地攻击者冒用合法客户端的元数据 URL 并绑定任意 `localhost` 重定向端口。因此，授权服务器在展示用户同意授权页面时，**必须**清晰展示重定向 URI 的主机名，并**应当**对纯 `localhost` 重定向发出安全警示。

由于 CIMD 无需在服务端持久化注册状态，因此不再需要像 DCR 那样维护复杂的注册服务中心。客户端侧完全是只读的：只需将元数据文档挂载在静态 HTTPS 端点上，等待授权服务器拉取即可。

如果授权服务器管理员已经预先分配了客户端标识符，应优先使用该针对特定签发者的预注册凭证，然后再尝试自动注册。否则首选 CIMD。仅在签发者既不支持预注册也不支持 CIMD 时，才回退到已废弃的 DCR 方案。

### RFC 7591：已废弃的兼容注册路径

DCR 在 2026-07-28 规范修订中已被正式废弃。仅针对无法使用 CIMD 且无法进行人工预注册的旧版授权服务器保留。兼容客户端发送如下注册请求：

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

服务端响应 `client_id` 以及供后续更新配置使用的 `registration_access_token`：

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

`application_type` 具有严格约束力：使用回环地址的桌面客户端必须声明为 `native`；基于服务端托管的 Web 应用客户端必须声明为 `web` 并使用 HTTPS 重定向 URI。对于公共 Native 客户端，`token_endpoint_auth_method: none` 是正确的默认配置，此时客户端仅分配到 `client_id`，所有权证明完全依赖 PKCE 保障。

生产落地的三大防御陷阱：

- 注册端点必须基于源 IP 进行严格限流。否则攻击者可编写脚本注册数百万虚假客户端，耗尽 `client_id` 命名空间。必须在注册器处理业务前执行限流校验。
- 某些企业级 IdP 强制要求提供 `software_statement`（为客户端背书的已签名 JWT）。本课示例将其省略；但在生产中应增加校验逻辑，拒绝除本地回环重定向之外的未签名注册。
- `registration_access_token` 在存储时必须哈希加密，绝不能明文保存。该 Token 泄漏意味着攻击者可以篡改该客户端的重定向 URI。

### RFC 8707（回顾）— 资源指示符（Resource Indicators）

第 16 课确立了该报文结构。生产铁律为：每一个 Token 请求都必须包含 `resource=<canonical-mcp-url>`，且 MCP server 在每次被调用时都必须验证 `token.aud` 与自身的资源 URL 精确匹配。规范化 URI 是 server 最具特异性的标识符：采用小写协议名和主机名，不带 URL 片段（#fragment），通常不带末尾斜杠。根据规范，路径部分**不应**被随意剥离——它精准标识了单独的 MCP server。`https://mcp.example.com`、`https://mcp.example.com/mcp`、`https://mcp.example.com:8443` 以及 `https://mcp.example.com/server/mcp` 都是合法的规范化 URI。为每台 server 选取一个规范 URI，并将 `aud` 与之完全固定。（本课为了代码简洁使用了纯主机名受众如 `https://notes.example.com`；在同一域名下协同托管多个 MCP server 的生产部署中，应按路径精准区分。）

### RFC 7636（回顾）— PKCE

PKCE 在 OAuth 2.1 中已成为强制规范。本课的授权码流程始终携带 `code_challenge` 和 `code_verifier`。服务端坚决拒绝任何不带 verifier 或 verifier 的哈希值与预存 challenge 不符的 Token 请求。

### MCP 2026-07-28 授权 Profile 规范

当前 MCP 规范在确立 OAuth 资源服务器安全边界的同时，将 MCP 传输层全面转向无状态化。不存在任何可以缓存主体身份决策的协议 session。因此，授权层必须对每一个请求进行独立验证：

- 实现 RFC 9728 受保护资源元数据，其访问路径可通过 401 响应中的 `WWW-Authenticate: Bearer resource_metadata="..."` 头部提供，**或者**通过知名端点 `/.well-known/oauth-protected-resource` 访问（SEP-985 将该响应头设为可选，并以知名端点作为兜底）。元数据中的 `authorization_servers` 字段**必须**列出至少一个受信任的授权服务器。
- 在**每一个**请求上均仅通过 `Authorization: Bearer ...` 接收 Token——绝不能放在 URL 查询参数中，也绝不能仅在会话建立时验证一次。
- 逐请求校验 `aud`、`iss`、`exp` 以及所需 Scopes。Server **必须**验证 Token 是专门为其自身签发的（受众检查）；缺少或不匹配的 `aud` 必须直接拒绝，绝不能作为通配符放行。
- 在返回 401/403 响应时，返回带有 `error=...`、`resource_metadata="<PRM-URL>"`（元数据文档的完整获取 URL，*而非*裸资源地址）以及在 403 权限不足时携带 `scope="..."` 的 `WWW-Authenticate: Bearer` 头。注意：该质询参数名为 `resource_metadata`，属于发现指针，质询头中不存在所谓的 `resource` 参数。
- 授权服务器服务发现同时兼容 RFC 8414 OAuth 元数据与 OpenID Connect Discovery 1.0；客户端应按优先级依次尝试这两个知名后缀。
- 客户端（而非服务端）负责防御**混淆攻击（Mix-Up Attacks）**：在重定向之前记录预期的 `issuer`，并在用授权码兑换 Token 之前，严格校验授权响应中返回的 RFC 9207 `iss` 参数值。单纯依靠 PKCE 无法防御 Mix-Up 攻击，因为客户端会盲目地将 `code_verifier` 提交给被恶意引导的目标 Token 端点。
- 客户端注册凭据归属于单一授权服务器签发者。若服务发现解析到了不同的签发者，客户端必须重新注册，坚决不能出示旧的 `client_id`、注册 token 或 access token。
- CIMD 是首选的客户端注册机制。DCR 已被废弃；兼容性的 DCR 请求仍须声明正确的 `application_type`。

OAuth 2.1 草案是底层基石；RFC 8414/7591/8707/9728/9207 + RFC 7636 + CIMD 构成了交互表面；MCP 规范则是集大成的 Profile。

### 生产部署能力核对清单

厂商的特性宣传文档很快就会过时。务必直接抓取实际部署的授权服务器所返回的元数据文档进行审查。准入门禁必须是机械化的：

| 核对项目 | 强制要求 |
|---|---|
| 发现的 Issuer | 必须与策略预期的 HTTPS Issuer 字符串精确匹配 |
| PKCE 支持 | 明确声明支持 `S256`；否则坚决终止接入 |
| 注册机制 | 首选 CIMD，接受预注册，仅将 DCR 作为废弃兼容路径 |
| 授权响应 | 出现或声明支持时，必须校验 RFC 9207 `iss` 参数 |
| 资源绑定 | Token 请求携带 `resource`；资源服务器强制校验匹配的 `aud` |
| 凭据存储 | 客户端 ID 与注册凭据以 Issuer 为键；Access Token 以 Issuer + Resource 双重索引 |
| DCR 兼容规范 | 必须声明 `native` 或 `web`；坚决拒绝不符合声明类型的重定向 URI |

不要从产品名称或定价层级推断其技术支持能力。在部署审计证据中固化实际发现的文档，当缺失必要字段时强制执行故障闭合（Fail-closed）。

### JWKS 刷新模式（AS 负责 Rotate，资源服务器负责 Refresh）

必须严格区分两个动词，在生产中混淆它们是极易发生的真实 Bug：

- **轮换（Rotate）：** 是**授权服务器（AS）**的行为：生成新的签名私钥、在 JWKS 中公布对应公钥、并在稍后将旧密钥作废。资源服务器既无权参与也无法执行该操作——它根本不持有 IdP 的签名私钥。
- **刷新（Refresh）：** 是**资源服务器**的行为：通过 HTTP GET 重新拉取公开发布的 JWKS 并更新其本地缓存。这是资源服务器唯一需要执行的 JWKS 操作。

生产环境中最典型的故障模式是**缓存过期失效**。解决方案是采用**定时刷新任务 + 键值缓存**。资源服务器运行一个调度任务（Cron、定时器或运行时调度机制），以固定的时间间隔抓取 `<issuer>/.well-known/jwks.json` 并覆盖写入 `cache[issuer] = {keys, fetched_at}`。验签器直接读取该内存缓存。若某个 Token 的 `kid` 在当前缓存中未命中，触发**单次**同步回退刷新，随后重新检查。这同时解决了两大场景：定时周期刷新，以及在下一次周期刷新到来前，采用全新密钥签发的 Token 提前抵达的密钥重叠窗口期。

该回退操作**必须是重新拉取（Re-fetch），绝对不能是轮换（Rotate）**。若将缓存未命中路径错误地连接为“轮换并签发”，会引发两大崩溃级缺陷：(1) 盲目生成全新密钥所得到的 `kid` *依然*无法匹配发来的 Token，验签依然失败；(2) 攻击者恶意并发发送携带随机虚假 `kid` 的 Token，将迫使系统无限生成新密钥——造成灾难性的自身拒绝服务（Self-inflicted DoS）。而重新拉取是幂等的，伪造的 `kid` 最多只会带来一次无害的无效拉取开销。

缓存结构：

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

稳定运行状态下通常同时存在两个密钥。授权服务器在淘汰旧密钥（`k_2026_03`）之前，会提前引入下一代新密钥（`k_2026_04`），从而确保在旧密钥下签发的存量 Token 在其自然过期前依然有效。本地缓存保存两者的并集；验签器按 `kid` 进行精准路由。

### 统一的 Token 验证例程

MCP server 在分发执行任何 tool 之前必须统一执行验证。`code/main.py` 中的标准调用范式如下：

```python
result = server.validate(bearer_token, required_scope="mcp:tools.invoke")
if not result["valid"]:
    return {"status": result["status"], "WWW-Authenticate": result["www_authenticate"]}
```

`validate` 函数负责解码 JWT，从 JWKS 缓存中解析签名公钥（未命中时触发单次回退刷新），校验数字签名，然后依次检查 `iss` 是否位于白名单内、`aud` 是否与本 server 的规范化资源标识一致、`exp` 是否过期，以及是否具备所需 Scope——一旦任何检查失败，立即返回携带具体错误说明的 `WWW-Authenticate` 质询头。将所有检查封装为资源服务器上的这单一例程，能确保每一个流量入口（无论哪种 tool 调用、何种传输层）都经过完全一致的安全门禁，杜绝任何未经校验即可直达业务逻辑的绕过漏洞。

### 不透明 Token 采用 Introspection，而非盲目猜测

并非所有 Access Token 都是 JWT。如果签发者文档表明下发的是不透明 Token（Opaque Token），资源服务器便无法在本地将其解码为可信的 Claims。此时必须通过经过认证的安全内网回传信道，将 Token 发送至签发者的 RFC 7662 Introspection 端点，并强制要求返回 `active: true`、符合预期的签发者上下文、精确匹配的 MCP 受众或资源、未过期的时效 Claims 以及当前具体 tool 所需的 Scopes。

对 Introspection 结果进行本地缓存，以签发者、Token 单向散列摘要（Digest）以及 MCP 资源作为复合缓存键。**绝不能**把原始 Token 明文作为日志标签或缓存 Key。将有效缓存条目的 TTL 上限限制在 Token 到期时间、签发者缓存指引以及系统定义的撤销时效性目标三者中的最早时间点。对于否定缓存（Negative Caching，即无效 Token）的缓存时间要足够短，以防合法新颁发的 Token 被误判为持续未激活。即便不透明 Token 字符串本身完全相同，为某个资源验证通过的结果也绝不能越权用于授权另一个资源。

切勿让攻击者通过伪造 Token 内容来诱导服务切换验证模式。必须根据经过验证的签发者元数据和系统配置，预先确定采用 JWT 本地验签还是网络 Introspection。在 JWT 路径上，强制锁定允许接受的算法和可信的 `jwks_uri`；绝不盲目顺从 Token 头部中声明的密钥 URL 或加密算法。

### 撤销是一种时效性契约（Freshness Contract）

RFC 7009 允许客户端请求授权服务器撤销某个 Token。但该撤销请求并不会自动抹去已经缓存在各个分布式资源服务器上的副本文本。必须明确定义系统所能容忍的最大撤销延迟，并强制所有本地缓存遵从该时效约束。

采用不透明 Token 的架构可以通过对高危调用发起逐次 Introspection 或配置极短的有效缓存来达成严苛的准实时撤销。而自包含的 JWT 架构通常采用如下组合拳：缩短 Access Token 的有效生命周期、在 IdP 侧实现 Refresh Token 撤销、在发生全局安全事件时执行签名公钥轮换退役，并辅以针对主体、会话或 Token ID 的本地黑名单机制以应对紧急阻断。已签名的 JWT 在到达其标称的到期时间之前，在密码学层面始终有效，除非资源服务器获得了权威的外部撤销证据。

用户登出、账号禁用、撤销授权以及应急响应虽然属于不同的触发源，但最终都必须收敛到一个可量化的硬指标：在宣告的撤销窗口期过后，集群中所有副本实例必须坚决拒绝该凭据。这一指标必须通过负载均衡器发起真实端到端测试，而不能仅在单台温启动的进程内自测。

### 外部依赖故障需要明确声明的决策策略

绝不要在异常捕获（try-catch）代码块中临场发挥制定可用性策略。

| 故障场景 | 生产环境安全应对策略 |
|---|---|
| 定时 JWKS 刷新失败，已知 `kid` 仍在尚未过期的受限缓存中 | 仅在声明的故障容忍窗口内允许降级继续运行，并向外暴露系统健康度降级告警证据 |
| Token 携带未知 `kid` 且仅有的一次重试刷新拉取失败 | 坚决拒绝；绝不接受无法完成密码学验签的 Token |
| Introspection 内部端点不可用 | 针对受保护调用严格执行故障闭合（Fail-closed）；绝不把网络超时转化为 `active: true` |
| 受保护资源或签发者元数据发生非预期突变 | 立即停止接受新注册与新 Token 申请；在受限应急策略下仅维系明确锁定的有效配置 |
| 撤销端点不可用 | 将登出或撤销标记为“未完成”，尽可能在本地将该凭据置为不可用，绝不对外谎称全局撤销成功 |
| 系统时钟源异常或 Claim 时间格式无效 | 坚决拒绝；严禁通过扩大时钟容忍偏差（Clock Skew）来强行放行 Token |

必须将基础设施依赖故障与凭据本身非法清晰区分开来。依赖不可用属于运维层面的系统故障，需要结合健康检查与重试机制处理；而无效签名、签发者不匹配、受众不符、超时过期或权限不足属于确定性的鉴权拒绝。两者均不得触及具体的业务 tool 逻辑，且两者都不允许在审计日志中泄露完整的 Token 明文。

### 受众重放攻击全流程演练（Access-Token Privilege Restriction）

假设 Server A（`notes.example.com`）与 Server B（`tasks.example.com`）均在同一个授权服务器下注册。Server A 不幸被黑客攻破。攻击者窃取了某位用户的 notes token，并试图将其重放到 Server B 上调用任务接口。

Server B 的验签例程执行逻辑如下：

1. 解码 JWT，根据 `kid` 检索 JWKS，验证数字签名。（通过）
2. 核对 `iss` 是否位于其受保护资源元数据声明的 `authorization_servers` 列表中。（通过——属于同一个 IdP）
3. 校验 `aud == "https://tasks.example.com"`。（**失败**——Token 中真实的 `aud` 为 `https://notes.example.com`）
4. 返回 HTTP 401 响应，并携带 `WWW-Authenticate: Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="https://tasks.example.com/.well-known/oauth-protected-resource"`。

在协议层面上，Audience Claim 是防御此类横向越权攻击的唯一屏障。出于所谓的“性能优化”而跳过受众校验，是生产实践中最常见的低级漏洞；验签例程必须在**每一个独立请求**上坚决执行，绝不能仅在会话刚建立时验证一次。在规范术语中，该机制被称为**访问令牌特权限制（Access-Token Privilege Restriction）**：MCP server **必须**坚决拒绝任何在受众中未明确列出自身标识的 Token。

> **命名辨析：** 规范将**混淆代理（Confused Deputy）**专门用于指代另一类相关但不同的漏洞场景：即某台 MCP server 充当调用第三方 API 的 OAuth **代理（Proxy）**，使用静态全局的客户端 ID，在未获取针对具体终端用户授权同意的情况下盲目转发 Token。受众绑定用于解决上述的跨服务重放攻击；而混淆代理防御则要求遵循逐客户端授权同意原则，**并且**严禁将入站收到的原始 Token 直接透传给上游 API（MCP server **必须**独立申请专门发往上游 API 的全新独立 Token）。

### Mix-up 混淆攻击（服务端无法代劳的客户端防御）

客户端在其生命周期内通常需要与多个不同的授权服务器打交道。恶意 AS 可能会诱导客户端将诚实合法的 AS 签发的授权码，拿到攻击者所控制的 Token 端点去兑换。受众绑定对此无能为力——因为在兑换授权码的阶段，甚至都还没有签发任何 Token。防御机制必须完全由客户端侧落实（RFC 9207）：

1. 客户端在发起重定向授权前，根据已验证的 AS 元数据记录预期的 `issuer` 标识符。
2. 收到授权响应后，客户端在将授权码发送到任何网络端点之前，先将其中的 `iss` 参数与此前记录的签发者进行纯字符串精确比对（禁止大小写折叠或 URL 规范化）。
3. 一旦不匹配（或者在 AS 声明支持 `authorization_response_iss_parameter_supported` 的情况下响应中缺失 `iss`）→ 立即拒绝，并且绝不展示响应中由攻击者构造的 `error` 报错信息。

单纯依靠 PKCE 无法防御 Mix-up 攻击，因为客户端会老老实实地把自己的 `code_verifier` 拱手提交给那个被恶意诱导的目标端点。这正是规范强制要求在逐请求状态中将预期的签发者与 PKCE verifier 及 `state` 一同记录的原因。

### 常见故障模式（Failure Modes）

- **陈旧过期的 JWKS：** 在 AS 轮换密钥后，验签器误将合法 Token 拦截。解决方案是上述的 定时刷新任务 + 未命中回退拉取 模式。切勿在没有刷新机制的前提下死板缓存 JWKS。
- **回退机制误搞成密钥轮换：** 将缓存未命中的回退路径错误实现为“本地生成新密钥”而非“向外重新拉取”，这是极为严重的逻辑 Bug：它不仅永远无法得到发来请求中缺失的那个 `kid`，还会让攻击者利用伪造的 `kid` 实施密钥爆炸式 DoS 攻击。回退操作必须是幂等的重新拉取。
- **缺失 `aud` Claim：** 某些旧版 IdP 默认会省略 `aud`，除非客户端在 Token 请求中显式提供了 `resource`。验签器必须坚决拒绝缺失 `aud` 的 Token，绝对不能把缺失视作通配放行。
- **遗漏 `iss` 校验导致的 Mix-Up 攻击：** 客户端若未校验 RFC 9207 授权响应中的 `iss` 参数，可能会被诱骗将诚实 AS 的授权码提交给黑客控制的 Token 端点。这是典型的客户端缺陷，资源服务器无法代为弥补。
- **Scope 提升并发竞争：** 同一用户的两次并发权限提升（Step-Up）流程可能先后成功，生成带有不同 Scopes 的两个 Access Token。验签器必须完全依据当前请求所附带的具体 Token 进行判断，绝不能去数据库异步查询所谓“该用户当前的最新 Scope”——那会产生严重的 TOCTOU 竞态漏洞。
- **注册 Token 泄露：** 泄露的 `registration_access_token` 将使攻击者能够篡改客户端的重定向 URI。必须在存储库中对其加盐哈希加密；强制客户端在每次更新时出示明文；一旦怀疑泄露立即轮换。
- **未固定 `iss` 白名单：** 验签器若盲目接受任何 `iss`，攻击者便可自建恶意授权服务器，针对目标受众签发恶意 Token。受保护资源元数据中的 `authorization_servers` 列表就是白名单，必须坚决执行匹配校验。
- **凭据或 Token 缓存键混淆：** 客户端若仅按资源对注册凭据建立索引，可能会将一个授权服务器派发的凭据出示给另一个服务器。客户端若仅按签发者对 Access Token 建立索引，则可能把 Token 错误地重放到错误的受众资源上。务必按验证后的签发者索引注册凭据，按 `(issuer, resource)` 复合索引 Access Token，且一旦签发者变更必须重新注册。

```figure
t3-jwks-rotate
```

## 使用它

`code/main.py` 使用 Python 标准库实现了完整的生产认证授权流水线，涵盖三大核心角色：`AuthorizationServer`、`ResourceServer` 与 `Client`。执行步骤如下：

在代码仓库根目录下运行：

```bash
cd phases/13-tools-and-protocols/18-mcp-auth-production
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

第一个命令会输出绑定签发者的注册与 Token 验证的完整控制台轨迹日志。第二个命令会运行通过全部 18 项单元测试。两个命令均不会开启外部网络监听，也不会向磁盘写入持久化凭据。

1. 授权服务器在 `/.well-known/oauth-authorization-server` 发布 RFC 8414 元数据。
2. MCP 客户端调用该端点，审查其注册模式（`client_id_metadata_document_supported` 对应 CIMD，`registration_endpoint` 对应 DCR）以及对 `S256` PKCE 的支持情况。
3. 客户端优先核对预配置注册，否则使用其托管在 HTTPS 上的客户端 ID 元数据文档完成注册。废弃的 DCR 保留为独立的兼容性测试分支。
4. 客户端记录经核验的签发者，生成 S256 Challenge，接收单次授权码与 `iss`，核对返回的签发者，并携带原始 verifier 与 RFC 8707 `resource` 指示符向端点兑换 Token。
5. MCP 客户端携带 `Authorization: Bearer ...` 调用 MCP server 上的 tool。
6. MCP server 触发 `validate` 例程，从 JWKS 缓存中解析出对应的公钥完成验签。
7. IdP 模拟轮换公钥；定时刷新任务自动拉取最新 JWKS 并更新缓存。
8. 下一次调用在无需重启服务的情况下自动完成对新公钥的验签，且存量旧 Token 在重叠窗口期内依然保持有效。
9. 模拟向另一台 MCP 资源发起的受众重放攻击，精准触发 HTTP 401 报错，返回 `audience mismatch` 以及指引重新发现的 `resource_metadata` 指针。

示例中的 JWT 为了能在无第三方依赖的 Python 标准库中运行，采用了带有共享密钥的 HS256 算法。生产环境中直接替换为 RS256 或 EdDSA，配合上述 JWKS 缓存模式即可，核心验证逻辑完全一致。由于 IdP 与资源服务器运行在同一进程内，`refresh_jwks` 直接读取授权服务器的内存密钥列表；在线上环境中它就是一个发往 `jwks_uri` 的标准 HTTP GET 请求。

## 交付它

本课交付 `outputs/skill-mcp-auth.md`。给定一份 MCP server 配置与 IdP 能力清单，该技能可自动输出生产落地的全套认证防护构件——包括受保护资源元数据、选用的注册接入路径（CIMD、预注册或 DCR 兜底）、JWKS 刷新调度策略、Scope 映射关系，以及在 IdP 无法完全满足 RFC Profile 时的防御性拒绝规则。

## 课后深练习

1. 运行 `code/main.py`。仔细追踪执行流。观察 IdP 在步骤 6 中轮换密钥，定时 `refresh_jwks` 重新拉取已发布的公钥集合，验证旧 Token（重叠窗口期内）与新签发的 Token 如何均在不重启服务的情况下顺利验签通过。
2. 在受保护资源元数据的 `authorization_servers` 列表中新增一个合法的 IdP。签发一枚由该新 IdP 签名的 Token，验证验签例程顺利放行。随后签发一枚由未列入白名单的外部 IdP 签名的 Token，验证系统坚决阻断并返回 `WWW-Authenticate: Bearer error="invalid_token", error_description="iss not allowed"`。
3. 为 `register_client` 增加速率限制检查，在注册器真正处理请求前执行拦截。在内存中使用按来源 IP 为键的字典实现一个轻量级的 Token Bucket 限流器。
4. 研读 RFC 7591 规范，指出示例代码中 `/register` 处理器尚未校验的两个协议字段，并补全校验逻辑。（提示：`software_statement` 与 `redirect_uris` 的 URI Scheme 协议检查）。
5. 接入第二台授权服务器。验证客户端能够按签发者严格独立隔离保存不同的注册凭据，并坚决拒绝将第一个签发者的 Token 或 `client_id` 复用到第二台服务器上。
6. 动手复现并修复潜在的 DoS 漏洞：向验签器发送一个包含随机伪造 `kid` 的 Token，确认 `refresh_jwks` 最多仅触发一次，且授权服务器的公钥数量不会异常暴增。随后故意将回退逻辑改成“本地轮换生成新密钥”，观察伪造 Token 如何导致密钥数量暴增——实验结束后务必将其恢复为幂等的重新拉取逻辑。
7. 分别针对 `native` 与 `web` 两类客户端测试已废弃的 DCR 路径。验证带有 HTTP 重定向 URI 的 Web 客户端，以及未使用精确回环重定向的 Native 客户端会被系统准确拦截拒绝。

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

- [MCP 授权规范（2026-07-28 修订版）](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) - 当前权威的 MCP 授权 Profile
- [MCP 2026-07-28 更新日志](https://modelcontextprotocol.io/specification/2026-07-28/changelog) - 涵盖 CIMD、签发者校验、DCR 废弃以及凭据隔离的关键改动
- [OAuth 客户端 ID 元数据文档规范草案（draft-ietf-oauth-client-id-metadata-document-00）](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00) — CIMD 核心标准
- [RFC 8414 — OAuth 2.0 授权服务器元数据](https://datatracker.ietf.org/doc/html/rfc8414) — 服务发现技术契约
- [RFC 7591 — OAuth 2.0 动态客户端注册协议](https://datatracker.ietf.org/doc/html/rfc7591) — DCR 规范（向后兼容路径）
- [RFC 7636 — 代码兑换证明密钥（PKCE）](https://datatracker.ietf.org/doc/html/rfc7636) — 公共客户端所有权证明
- [RFC 8707 — OAuth 2.0 资源指示符](https://datatracker.ietf.org/doc/html/rfc8707) — 受众锁定核心机制
- [RFC 9728 — OAuth 2.0 受保护资源元数据](https://datatracker.ietf.org/doc/html/rfc9728) — 资源服务器服务发现
- [RFC 9207 — OAuth 2.0 授权服务器签发者识别](https://datatracker.ietf.org/doc/html/rfc9207) — 用于防御 Mix-Up 攻击的 `iss` 参数规范
- [RFC 7662: OAuth 2.0 Token 内省协议（Token Introspection）](https://datatracker.ietf.org/doc/html/rfc7662)
- [RFC 7009: OAuth 2.0 Token 撤销协议（Token Revocation）](https://datatracker.ietf.org/doc/html/rfc7009)
