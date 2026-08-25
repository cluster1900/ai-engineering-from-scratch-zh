# 生产环境中的 MCP Auth：绑定 issuer 的注册与 Token

> Lesson 16 构建了 OAuth 2.1 状态机。本课针对 MCP 2026-07-28 强化其生产边界：优先使用 Client ID Metadata Documents，仅将已弃用的动态注册用于兼容，验证授权响应的 issuer，使用以 issuer 为 key 的客户端凭据，刷新 JWKS，并在每个无状态请求中使用绑定 audience 的 Token。
>
> **规范说明（2026-07-28）：** Dynamic Client Registration 已被弃用，推荐改用 Client ID Metadata Documents。DCR 仍作为兼容机制保留。使用 DCR 时，客户端应声明正确的 `application_type`。客户端会验证响应中存在的 RFC 9207 `iss` 值，并且绝不会在不同授权服务器 issuer 之间复用凭据。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 16（OAuth 2.1 状态机），Phase 13 · 17（gateway）
**Time:** ~90 分钟

## 学习目标

- 通过 RFC 8414 metadata 发现授权服务器并验证其契约。
- 通过 Client ID Metadata Document 完成注册，并将已弃用的 DCR 隔离为后备方案。
- 验证 RFC 9207 `iss`，按授权服务器 issuer 对注册信息进行分 key，并按 issuer 与 resource 对绑定资源的 Token 进行分 key。
- 按计划缓存并刷新 JWKS key，使签名验证能够在密钥轮换期间继续工作。
- 使用 RFC 8707 resource indicator 将 Token 绑定到单个 MCP resource，并拒绝 confused-deputy 式复用。
- 在 JWT 验证与 Token introspection 之间作出选择，定义撤销新鲜度，并在身份依赖不可用时安全失败。
- 分离授权服务器、资源服务器和客户端，使每个角色仅执行自身负责的检查。
- 根据部署检查清单审计授权服务器，并拒绝不安全的注册或 Token 复用。

## 问题

Lesson 16 模拟器在内存中运行 OAuth 2.1。生产环境存在三个仅使用内存的模拟器无法发现的运维缺口。

第一个缺口是注册与凭据隔离。真实组织可能运行数百个 MCP server 和数千个 MCP client。2026-07-28 修订版推荐使用 **Client ID Metadata Document**：客户端使用一个由自己控制、包含路径的 HTTPS URL 作为标识符，授权服务器拉取其 metadata。RFC 7591 动态注册仅作为已弃用的兼容路径保留。当无法避免 DCR 时，请求必须声明正确的 `application_type`。客户端将注册信息存储在授权服务器 issuer 下，并将 access Token 存储在 `(issuer, resource)` 对下。issuer 发生变化意味着需要重新注册，不同的 resource 则需要单独绑定 audience 的 Token。

第二个缺口是密钥轮换。JWT 验证依赖授权服务器的签名 key，这些 key 以 JSON Web Key Set（JWKS）形式发布。授权服务器会按计划轮换这些 key（通常每小时一次，在事件响应期间有时会更频繁）。仅在启动时获取一次 JWKS 的 MCP server，在轮换窗口到来前都能正常验证，但轮换后每个请求都会失败，直到服务重启。生产环境会将 JWKS 作为缓存值，并配置刷新任务，在旧 key 过期前覆盖缓存；同时还会在缓存未命中时执行一次后备获取，以处理由比缓存更新的 key 签名的 Token 先于下次计划刷新到达的情况。

第三个缺口是 audience 绑定。Lesson 16 引入了 RFC 8707 resource indicator。在生产环境中，该 indicator 会成为每个请求都必须执行的严格 claim 检查。MCP server 将 `token.aud` 与自身的规范 resource URL 比较，并以 HTTP 401 拒绝不匹配的请求。这是防止上游 MCP server（或持有仅供某个 server 使用的 Token 的恶意客户端）在同一信任网格中的另一台 server 上重放该 Token 的唯一手段。

本课会将每个缺口映射到实际 surface 的具体组成部分。metadata document 是一个 HTTP endpoint。JWKS 缓存刷新由计划任务和 key-value 缓存组成。JWT 验证是资源服务器在分派任何 Tool 前运行的例程。请保持三个角色相互分离，使每个角色只执行自己负责的检查：授权服务器签发 Token 并轮换 key，资源服务器缓存并验证，客户端执行发现和注册。

## 范围：Lesson 16 之后的生产级执行

[Lesson 16：使用 OAuth 2.1 保护 MCP](../../16-mcp-security-oauth-2-1/docs/en.md) 负责授权码状态机、PKCE、受保护资源发现、resource indicator 和 scope 决策。本课不会定义第二套 OAuth flow。它从这些契约已经存在的地方开始，探讨已部署的资源服务器如何在密钥轮换、不透明 Token 验证、撤销、依赖故障、发布和事件响应期间持续执行这些契约。

生产边界更窄，也更偏向运维：

- JWT 路径会在每个请求中验证固定的 issuer、algorithm、签名 key、audience、时间 claim 和 scope，同时安全刷新 JWKS。
- 不透明 Token 路径会调用 issuer 经过身份验证的 introspection endpoint，并验证返回的 active 状态、audience 或 resource、过期时间、subject 和 scope。
- 撤销策略定义凭据必须在多长时间内停止生效，以及哪个缓存可能延迟这一事实。
- 故障策略决定发现、JWKS、introspection 或撤销基础设施不可用时应执行什么操作。
- 证据会记录由哪个 issuer metadata、key set 或 introspection 响应、Token claim、策略版本及拒绝原因产生了最终结果，但不会存储 Token。

这种区分使课程可以组合使用。Lesson 16 证明 flow 正确。Lesson 18 证明 Token 到达真实 MCP 请求路径后仍然可信，否则就会被拒绝。

## 概念

### RFC 8414 — OAuth Authorization Server Metadata

位于 `/.well-known/oauth-authorization-server` 的文档描述客户端需要的一切：

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

拿到 MCP resource URL 后，客户端会串联执行发现：RFC 9728 的 `oauth-protected-resource`（资源服务器的文档）指定 issuer，随后本 RFC 的 `oauth-authorization-server` 指定所有 endpoint。客户端绝不硬编码授权 URL。

对于包含路径的 resource 标识符，请在该路径之前插入 well-known 段。例如，`https://mcp.example.com/team/server` 的受保护资源 metadata 位于 `https://mcp.example.com/.well-known/oauth-protected-resource/team/server`。将 `/.well-known/...` 追加到 resource 路径之后是不正确的。

在信任用于 MCP 的 IdP 前，需要验证以下契约：

- `code_challenge_methods_supported` 包含 `S256`（RFC 7636 定义的 PKCE）。规范明确指出：如果此字段**不存在**，则授权服务器不支持 PKCE，客户端**必须**拒绝继续。
- `grant_types_supported` 包含 `authorization_code`，并拒绝 `password` 和 `implicit`。
- 至少存在一种注册路径：`client_id_metadata_document_supported: true`（CIMD，首选）、预注册客户端，或 `registration_endpoint`（已弃用的 RFC 7591 兼容方式）。
- 如果 `authorization_response_iss_parameter_supported` 为 true，客户端必须要求返回 RFC 9207 `iss`，并将其与重定向前记录的 issuer 进行精确比较。
- 对于 OAuth 2.1，`response_types_supported` 必须恰好为 `["code"]`。

如果缺少 `S256`，MCP server 将拒绝针对该 IdP 进行部署，因为 PKCE 不存在降级模式。如果没有公布任何注册路径，并且你也没有预注册的 `client_id`，则同样无法注册；有问题的是部署 manifest，而不是代码。

### RFC 9728（回顾）— Protected Resource Metadata

Lesson 16 已介绍 RFC 9728。生产环境中的变化是：客户端只能通过此文档查找受到*当前* MCP server 信任的授权服务器。单个 MCP server 可能接受来自多个 IdP 的 Token（一个供员工使用，另一个供合作伙伴使用）。RFC 9728 声明这个集合；RFC 8414 则描述每个 IdP 支持的能力。

```json
{
  "resource": "https://notes.example.com",
  "authorization_servers": ["https://auth.example.com", "https://partners.example.com"],
  "scopes_supported": ["mcp:tools.invoke"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://notes.example.com/docs"
}
```

### Client ID Metadata Documents（推荐的默认方式）

CIMD 将注册过程从*推送*反转为*拉取*。客户端不再请求授权服务器生成 `client_id`，而是将自己控制的 HTTPS URL **直接作为** `client_id`。该 URL 会解析为 JSON metadata document；授权服务器会在 OAuth flow 期间按需获取它。信任根植于 DNS：如果服务器运营方信任 `app.example.com`，它就信任由 `https://app.example.com/client.json` 提供的客户端。无需注册往返，不会耗尽 `client_id` namespace，也无需维护需要跨服务器同步的状态。

客户端托管的 metadata document：

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

文档中的 `client_id` 值**必须**等于提供该文档的 URL（授权服务器会验证这一点；不匹配时将拒绝请求）。授权服务器通过 RFC 8414 metadata 中的 `client_id_metadata_document_supported: true` 公布支持情况。

在当前 CIMD 契约中，`client_id`、`client_name` 和非空 `redirect_uris` 数组为必填项。客户端标识符必须是包含路径的绝对 HTTPS URL。可以包含 `application_type`，但它不是 CIMD 的必填字段。不要将 DCR 对 `application_type` 的要求复制到首选的 CIMD 路径中。

规范明确强调了两个安全事实：

- **SSRF。** 授权服务器会获取攻击者提供的 URL。它必须防御 server-side request forgery（禁止获取内部或管理 endpoint）。
- **localhost 冒充。** 仅使用 CIMD 无法阻止本地攻击者声称拥有合法客户端的 metadata URL，并绑定任意 `localhost` 重定向。授权服务器在请求用户同意时**必须**清楚显示重定向 URI 的 hostname，并且对于仅使用 `localhost` 的重定向**应该**发出警告。

由于 CIMD 不需要服务端状态，因此无需像 DCR 那样搭建注册服务。客户端侧是只读的：通过静态 HTTPS endpoint 提供 metadata document，让授权服务器自行拉取。

如果授权服务器运营方已经配置了客户端标识符，请先使用该 issuer 范围内的注册信息，再尝试自动注册。否则优先使用 CIMD。仅当 issuer 无法使用预注册或 CIMD 时，才使用已弃用的 DCR。

### RFC 7591：已弃用的兼容注册

DCR 在 2026-07-28 修订版中已被弃用。仅为无法使用 CIMD 且预注册不现实的授权服务器保留它。兼容客户端会发送：

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

服务器返回 `client_id`，以及用于后续更新的 `registration_access_token`：

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

`application_type` 不是装饰性字段。使用 loopback 的桌面客户端声明 `native`；由服务器托管的客户端声明 `web`，并使用 HTTPS 重定向 URI。对于公开的 native 客户端，`token_endpoint_auth_method: none` 是正确的默认值。它只获得 `client_id`，由 PKCE 提供 proof-of-possession。

三个生产陷阱：

- 注册 endpoint 必须按来源 IP 进行速率限制。否则，恶意行为者可以通过脚本创建数百万个虚假注册，并耗尽 `client_id` namespace。在 registrar 处理请求前执行速率限制检查。
- 某些企业 IdP 要求提供 `software_statement`（为客户端背书的已签名 JWT）。本课的 mock 会跳过它；生产环境应接入验证步骤，拒绝除 localhost 重定向 URI 以外的所有未签名注册。
- `registration_access_token` 必须以 hash 形式存储，而不能以明文存储。此 Token 一旦被盗，攻击者就能重写客户端的重定向 URI。

### RFC 8707（回顾）— Resource Indicators

Lesson 16 已确定基本形式。生产规则是：每个 Token 请求都包含 `resource=<canonical-mcp-url>`，MCP server 在每次调用时都验证 `token.aud` 是否与自身的规范 resource URL 匹配。规范 URI 是该 server *最具体*的标识符：scheme 和 host 使用小写，不包含 fragment，通常也不包含末尾斜杠。规则**不会**移除 path 组成部分，当需要标识单独的 MCP server 时，规范会保留该部分。`https://mcp.example.com`、`https://mcp.example.com/mcp`、`https://mcp.example.com:8443` 和 `https://mcp.example.com/server/mcp` 都是有效的规范 URI。为每台 server 选择一个，并让 `aud` 精确绑定到该 URI。（为简洁起见，本课 mock 使用类似 `https://notes.example.com` 的纯 host audience；在同一 origin 下共同托管多个 MCP server 的部署环境会通过路径区分它们。）

### RFC 7636（回顾）— PKCE

OAuth 2.1 强制要求 PKCE。本课的授权码 flow 始终携带 `code_challenge` 和 `code_verifier`。如果 Token 请求缺少 verifier，或 verifier 的 hash 与存储的 challenge 不匹配，服务器会拒绝请求。

### MCP 2026-07-28 授权 profile

当前 MCP 修订版保留了 OAuth 资源服务器边界，同时使 MCP transport 保持无状态。协议 session 中不存在可用于缓存身份决策的位置。因此，授权层会独立验证每个请求：

- 实现 RFC 9728 protected-resource metadata，并通过 401 响应中的 `WWW-Authenticate: Bearer resource_metadata="..."` header 或 well-known URI `/.well-known/oauth-protected-resource` 提供其位置（SEP-985 使 header 变为可选，并提供 well-known 后备方式）。metadata 的 `authorization_servers` 字段**必须**指定至少一台服务器。
- 在**每个**请求中，只通过 `Authorization: Bearer ...` 接受 Token，绝不能通过 query string 接收，也不能只在 session 开始时验证一次。
- 在每个请求中验证 `aud`、`iss`、`exp` 和所需 scope。服务器**必须**验证 Token 是专门为自己签发的（audience）；缺失或不匹配的 `aud` 必须被拒绝，绝不能视为 wildcard。
- 对于 401/403，返回携带 `error=...`、`resource_metadata="<PRM-URL>"` 参数（metadata document 的 URL，*不是*裸 resource），以及在 `insufficient_scope`（403）时使用的 `scope="..."` 的 `WWW-Authenticate: Bearer`。请注意：参数是作为发现指针的 `resource_metadata`，challenge 中不存在 `resource` 参数。
- 授权服务器发现可以接受 RFC 8414 OAuth metadata **或** OpenID Connect Discovery 1.0；客户端必须按优先级依次尝试两个 well-known suffix。
- 客户端（而不是服务器）负责防御 **mix-up attack**：客户端在重定向前记录预期的 `issuer`，并在兑换授权码前验证实际授权响应中返回的 `iss` 值（RFC 9207）。PKCE 本身无法阻止 mix-up，因为客户端会将 `code_verifier` 交给它被引导访问的任何 Token endpoint。
- 客户端凭据只属于一台授权服务器 issuer。如果发现过程解析出不同的 issuer，客户端会重新注册，而不是提交旧的 `client_id`、注册 Token 或 access Token。
- CIMD 是首选注册机制。DCR 已被弃用；兼容性 DCR 请求仍然需要声明正确的 `application_type`。

OAuth 2.1 draft 是底层基础；RFC 8414/7591/8707/9728/9207、RFC 7636 和 CIMD 构成 surface；MCP 规范则是 profile。

### 部署能力检查清单

供应商功能表很快就会过时。应检查实际部署的授权服务器返回的 metadata。该关卡是机械化的：

| 检查项 | 必需决策 |
|---|---|
| 发现的 issuer | 必须与策略预期的 HTTPS issuer 完全一致 |
| PKCE | 必须公布 `S256`；否则停止 |
| 注册 | 首选 CIMD，接受预注册，仅将 DCR 用作已弃用的兼容方式 |
| 授权响应 | 当 RFC 9207 `iss` 存在或已公布支持时进行验证 |
| Resource 绑定 | Token 请求携带 `resource`；资源服务器要求匹配的 `aud` |
| 凭据存储 | 按 issuer 对客户端 ID 和注册凭据进行分 key；按 issuer 与 resource 对 access Token 进行分 key |
| DCR 兼容性 | 声明 `native` 或 `web`；拒绝不符合所声明 application type 的重定向 URI |

不要根据产品名称或定价层级推断支持情况。将发现得到的文档记录到部署证据中，并在缺少必填字段时执行 fail closed。

### JWKS 刷新模式（在 AS 轮换，在资源服务器刷新）

请明确区分两个动作，因为混淆它们会造成真实的生产 bug：

- **Rotate** 是*授权服务器*执行的操作：生成新的签名 key，将其发布到 JWKS，并在稍后停用旧 key。资源服务器不参与这一过程，也无法执行此操作，因为它不持有 IdP 的 private key。
- **Refresh** 是*资源服务器*执行的操作：重新 `GET` 已发布的 JWKS 并写入缓存。这是资源服务器唯一会执行的 JWKS 操作。

生产故障模式是缓存过期。可以通过计划刷新任务和 key-value 缓存解决。资源服务器运行一个任务（cron、timer 或运行时提供的任何机制），按固定间隔获取 `<issuer>/.well-known/jwks.json`，并覆盖 `cache[issuer] = {keys, fetched_at}`。validator 从该缓存读取。对于 `kid` 不在缓存中的 Token，触发**一次**同步刷新作为后备，然后重新检查。这样可以同时处理两种情况：计划刷新，以及在 key 重叠窗口中，由全新 key 签名的 Token 早于下一次计划刷新到达。

后备操作**必须是重新获取，绝不能是轮换**。如果将缓存未命中路径连接到“轮换并生成”，会破坏两件事：(1) 新生成的 key 会产生一个与 Token *仍然*不匹配的 `kid`，因此查找依旧失败；(2) 使用随机 `kid` 大量发送 Token 的攻击者会迫使系统无限创建 key，从而引发自我造成的 DoS。重新获取具有幂等性，因此伪造的 `kid` 最多只会浪费一次获取操作。

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

同时存在两个 key 是稳态。授权服务器会先引入下一个 key（`k_2026_04`），然后再停用前一个 key（`k_2026_03`），从而使使用旧 key 签发的 Token 在过期前仍然有效。缓存保存并集；validator 根据 `kid` 进行选择。

### 验证例程

MCP server 在分派任何 Tool 前运行验证。`code/main.py` 使用的形式如下：

```python
result = server.validate(bearer_token, required_scope="mcp:tools.invoke")
if not result["valid"]:
    return {"status": result["status"], "WWW-Authenticate": result["www_authenticate"]}
```

`validate` 会解码 JWT，从 JWKS 缓存中解析签名 key（未命中时刷新一次），验证签名，然后检查 `iss` 是否在 allow-list 中、`aud` 是否匹配当前 server 的规范 resource、`exp` 和所需 scope，并在第一次失败时返回 `WWW-Authenticate` challenge。将验证保留为资源服务器上的单一例程，意味着每个入口点（每次 Tool 调用、每种 transport）都会执行相同的检查；不存在能够在未验证的情况下访问 Tool 的路径。

### 不透明 Token 使用 introspection，而不是猜测

并非每个 access Token 都是 JWT。如果 issuer 声明的是不透明 Token，资源服务器就无法将其解码为可信 claim。它会通过经过身份验证的 backchannel 将 Token 发送到 issuer 的 RFC 7662 introspection endpoint，并要求 `active: true`、预期的 issuer Context、精确的 MCP audience 或 resource、未过期的时间 claim，以及具体 Tool 所需的 scope。

按 issuer、单向 Token digest 和 MCP resource 缓存 introspection。绝不能使用明文 Token 作为日志或缓存 label。positive cache entry 的期限应取 Token 过期时间、issuer 缓存指导和部署撤销新鲜度目标中的最早值。negative cache 应足够短，以免新签发的 Token 长时间被错误地视为 inactive。即使不透明 Token 字符串完全相同，针对一个 resource 得到的结果也不能授权另一个 resource。

不要根据攻击者可控的 Token 内容选择验证模式。应根据经过验证的 issuer metadata 和部署配置固定 JWT 或 introspection 行为。在 JWT 路径中，固定可接受的 algorithm 和可信 `jwks_uri`；绝不能仅根据 Token header 选择的 key URL 或 algorithm 执行操作。

### 撤销是一项新鲜度契约

RFC 7009 允许客户端请求授权服务器撤销 Token。该请求不会删除每台资源服务器已经缓存的副本。请定义可接受的最大撤销延迟，并让所有缓存遵守该限制。

不透明 Token 部署可以通过在每次高风险调用时执行 introspection，或使用短期 positive cache，实现更及时的撤销。自包含 JWT 部署通常会结合使用短期 access Token、refresh Token 撤销、用于 issuer 范围事件的 key 停用，以及可选的 subject、session 或 Token ID denylist，以便在紧急情况下进行本地拒绝。除非资源服务器掌握最新的外部撤销证据，否则已签名 JWT 在过期前仍然保持密码学上的有效性。

注销、账户禁用、撤回同意和事件响应是不同的触发器，但它们必须汇聚为一条可度量的陈述：最多经过声明的撤销窗口后，每个副本都必须拒绝该凭据。请通过负载均衡器测试这条陈述，而不只是针对一个已有热缓存的进程进行测试。

### 依赖故障需要预先声明决策

绝不要在 exception handler 中临时决定可用性策略。

| 故障 | 安全的生产行为 |
|---|---|
| 计划 JWKS 刷新失败，但已知 `kid` 仍位于尚未超过有效期限的有界缓存中 | 仅在声明的 stale-on-error 窗口内继续，并发出健康状态降级证据 |
| Token 包含未知 `kid`，且唯一允许的一次刷新失败 | 拒绝；绝不能接受无法验证的签名 |
| Introspection 不可用 | 对受保护调用执行 fail closed；不要将网络故障转换为 `active: true` |
| 受保护资源或 issuer metadata 意外变化 | 停止新的注册和 Token 获取；仅在有界事件策略下保留明确固定且未过期的配置 |
| 撤销 endpoint 不可用 | 将注销或撤销报告为未完成；在可能时将本地凭据保留为不可用状态，并且不要声称全局撤销已成功 |
| 时钟源或 claim 类型无效 | 拒绝请求，而不是扩大偏差范围，直到 Token 通过为止 |

请将依赖故障与无效凭据分别分类。依赖中断是一种运维错误，需要健康状态和重试策略。错误的签名、issuer、audience、过期时间或 scope 则属于授权拒绝。两者都不能进入 Tool handler，也都不应将 Token 内容泄漏到审计证据中。

### Audience 重放演练（access Token 权限限制）

Server A（`notes.example.com`）和 Server B（`tasks.example.com`）都向同一授权服务器注册。Server A 遭到入侵。攻击者获取用户的 notes Token，并在 Server B 上重放。

Server B 的 validator：

1. 解码 JWT，按 `kid` 获取 JWKS，并验证签名。
2. 检查 `iss` 是否存在于其 protected-resource metadata 的 `authorization_servers` 中。（通过，因为是同一个 IdP。）
3. 检查 `aud == "https://tasks.example.com"`。（失败，因为 Token 的 `aud` 是 `https://notes.example.com`。）
4. 返回 401，并携带 `WWW-Authenticate: Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="https://tasks.example.com/.well-known/oauth-protected-resource"`。

audience claim 是协议层抵御此攻击的唯一手段。为了性能而跳过它，是最常见的生产错误；validator 必须在每个请求上运行，而不只是 session 开始时。规范将此称为 **access-token privilege restriction**：MCP server **必须**拒绝 audience 中没有指定自身的任何 Token。

> **命名说明。** 规范将 *confused deputy* 一词保留给一个相关但不同的问题：作为第三方 API 的 OAuth **proxy** 的 MCP server 使用静态客户端 ID，并在未获得每个客户端的用户同意时转发 Token。audience 绑定解决的是上述重放问题；confused-deputy 的修复方案是逐客户端获取用户同意，**同时**绝不将入站 Token 直接传递给上游 API（MCP server **必须**获得自己独立的上游 Token）。

### Mix-up attack（服务器无法提供的客户端侧防御）

客户端在整个生命周期中会与多台授权服务器通信。恶意 AS 可能尝试让客户端在攻击者的 Token endpoint 上兑换由诚实 AS 签发的授权码。audience 绑定对此没有帮助，因为攻击发生时 Token 尚不存在。防御机制位于客户端（RFC 9207）：

1. 重定向前，客户端记录从已验证 AS metadata 中得到的预期 `issuer`。
2. 在授权响应中，客户端将返回的 `iss` 参数与记录的 issuer 比较（执行简单字符串比较，不做 normalization），然后才会将授权码发送到任何地方。
3. 不匹配（或 AS 已公布 `authorization_response_iss_parameter_supported`，但 `iss` 不存在）→ 拒绝，并且连 `error` 字段也不显示。

PKCE 本身无法阻止 mix-up，因为客户端会将 `code_verifier` 交给它被引导访问的任何 Token endpoint。正因如此，规范要求针对每个请求记录 issuer，并将其与 PKCE verifier 和 `state` 一起保存。

### 故障模式

- **过期的 JWKS。** AS 轮换 key 后，validator 会拒绝有效 Token。修复方法是使用上述 cron 刷新与缓存未命中重新获取模式。绝不要在没有刷新任务的情况下缓存 JWKS。
- **将轮换作为后备。** 将缓存未命中路径连接到“轮换并生成”而不是重新获取，是一个真实 bug：它永远不会生成缺失的 `kid`，还会将攻击者控制的 `kid` 值转化为创建 key 的 DoS。后备操作必须是幂等的 `refresh-jwks`。
- **缺失 `aud` claim。** 某些 IdP 默认省略 `aud`，除非 Token 请求中存在 `resource`。validator 必须拒绝缺少 `aud` 的 Token，不能将缺失视为 wildcard。
- **缺少 `iss` 检查导致 mix-up。** 如果客户端没有将 RFC 9207 授权响应参数 `iss` 与重定向前记录的 issuer 进行验证，就可能被引导至攻击者的 Token endpoint，并在那里兑换诚实 AS 的授权码。这属于客户端侧故障；资源服务器无法补偿。
- **Scope 升级竞争。** 同一用户的两个并发 step-up flow 可能同时成功，并生成两个 scope 不同的 access Token。validator 必须使用请求中提交的 Token，而不能查找“用户当前的 scope”，否则会产生 TOCTOU 窗口。
- **注册 Token 被盗。** 泄漏的 `registration_access_token` 会让攻击者重写重定向 URI。静态存储时对其进行 hash；每次更新时要求客户端提交明文；发现可疑情况时执行轮换。
- **未固定 `iss`。** 接受任意 `iss` 的 validator 会允许攻击者搭建自己的授权服务器，为目标 audience 注册客户端并签发 Token。protected-resource metadata 中的 `authorization_servers` 列表就是 allow-list，必须执行它。
- **凭据或 Token 缓存冲突。** 如果客户端仅按 resource 对注册信息进行分 key，就可能将一台授权服务器的身份提交给另一台服务器。如果客户端仅按 issuer 对 access Token 进行分 key，就可能在错误的 audience 上重放 Token。请按经过验证的 issuer 对注册信息进行分 key，按 `(issuer, resource)` 对 access Token 进行分 key，并在 issuer 发生变化时重新注册。

```figure
t3-jwks-rotate
```

## 使用它

`code/main.py` 使用 stdlib Python 和三个角色演示完整的生产 flow：`AuthorizationServer`、`ResourceServer` 和 `Client`。流程如下：

从 repository 根目录运行：

```bash
cd phases/13-tools-and-protocols/18-mcp-auth-production
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

第一条命令会输出绑定 issuer 的注册和 Token 验证记录。第二条命令会报告十八项检查通过。两条命令都不会打开网络 listener，也不会写入凭据。

1. 授权服务器在 `/.well-known/oauth-authorization-server` 发布 RFC 8414 metadata。
2. MCP client 调用 metadata endpoint，并检查注册选项（用于 CIMD 的 `client_id_metadata_document_supported`、用于 DCR 的 `registration_endpoint`）以及 `S256` PKCE 支持。
3. 客户端检查 issuer 范围内是否存在预注册；如果不存在，则使用自己的 HTTPS Client ID Metadata Document 注册。已弃用的 DCR 保留为可单独测试的兼容方法。
4. 客户端记录经过验证的 issuer，创建 S256 challenge，接收一次性授权码和 `iss`，验证返回的 issuer，然后使用原始 verifier 和 RFC 8707 `resource` indicator 兑换授权码。
5. MCP client 使用 `Authorization: Bearer ...` 调用 MCP server 上的 Tool。
6. MCP server 运行 `validate`，从 JWKS 缓存解析签名 key。
7. IdP 轮换 key；计划刷新任务重新拉取 JWKS 并写入缓存。
8. 下一次调用无需重启即可使用刷新后的 key 完成验证，旧 Token 在重叠窗口内仍能通过验证。
9. 针对另一个 MCP resource 的 audience 重放尝试会收到 401，其中包含 `audience mismatch` 和 `resource_metadata` 指针。

这里的 JWT 使用带共享 secret 的 HS256（因此本课仅依赖 stdlib 即可运行）。生产环境使用 RS256 或 EdDSA，并采用上述 JWKS 模式；除此之外，验证逻辑完全相同。由于 IdP 和资源服务器位于同一个进程中，`refresh_jwks` 会直接读取授权服务器的 key 列表；在线路上传输时，它对应向 `jwks_uri` 发出的 HTTP `GET`。

## 交付它

本课会生成 `outputs/skill-mcp-auth.md`。给定 MCP server 配置和 IdP 能力集合后，该 Skill 会生成需要搭建的 Auth surface，包括 protected-resource metadata、应使用的注册路径（CIMD、预注册或 DCR 后备）、JWKS 刷新计划、scope 映射，以及 IdP 不支持完整 RFC profile 时应采用的拒绝规则。

## 练习

1. 运行 `code/main.py`。跟踪整个 flow。注意 IdP 如何在第 6 步轮换 key，计划执行的 `refresh_jwks` 如何重新拉取已发布的集合，以及旧 Token（重叠窗口）和新 Token 如何都能在无需重启的情况下通过验证。

2. 向 protected-resource metadata 的 `authorization_servers` 列表添加一个新 IdP。签发由新 IdP 签名的 Token，并确认 validator 接受它。签发由未列出的 IdP 签名的 Token，并确认 validator 通过 `WWW-Authenticate: Bearer error="invalid_token", error_description="iss not allowed"` 拒绝它。

3. 向 `register_client` 添加速率限制检查，并确保它在 registrar 接受请求前运行。为每个来源 IP 使用 token bucket，将其保存在一个以 IP 为 key 的小型 dict 中。

4. 阅读 RFC 7591，并找出本课 `/register` handler 未验证的两个字段。添加这些验证。（提示：`software_statement` 和 `redirect_uris` URI scheme。）

5. 添加第二台授权服务器。确认客户端存储了独立的、以 issuer 为 key 的注册信息，并拒绝复用第一台 issuer 的 Token 或 `client_id`。

6. 证明 DoS 修复有效。向 validator 发送带有随机 `kid` 的 Token，并确认 `refresh_jwks` 最多运行一次，且授权服务器的 key 数量不会增加。然后故意将后备操作重新连接为“轮换并生成”，观察 key 数量如何随每个伪造 Token 增长，之后恢复为重新获取。

7. 使用 `native` 和 `web` 客户端测试已弃用的 DCR。确认使用 HTTP 重定向 URI 的 web 客户端，以及没有精确 loopback 重定向的 native 客户端都会被拒绝。

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|----------------|------------------------|
| ASM | “OAuth metadata document” | RFC 8414 `/.well-known/oauth-authorization-server` JSON |
| CIMD | “客户端 metadata URL” | Client ID Metadata Document：用作 `client_id` 的 HTTPS URL；AS 会拉取该 JSON。MCP 2026-07-28 中的首选注册方式 |
| DCR | “自助式客户端注册” | RFC 7591 `POST /register`；在当前 MCP 中已弃用，仅为兼容而保留 |
| JWKS | “用于 JWT 验证的 public key” | JSON Web Key Set，从 `jwks_uri` 获取，并按 `kid` 建立索引 |
| Rotate 与 refresh | “更新 key” | *Rotate* = AS 生成或停用签名 key；*refresh* = 资源服务器重新获取已发布的集合。资源服务器只会执行 refresh |
| Resource indicator | “Audience 参数” | RFC 8707 `resource` 参数，将 Token 绑定到一台 server |
| `aud` claim | “Audience” | validator 与规范 resource URL 进行比较的 JWT claim |
| Audience 重放 | “Token 重放” | 为 Server A 签发的 Token 被提交给 Server B；通过 audience 验证进行防御（规范称为 access-token privilege restriction） |
| Confused deputy | “Proxy Token 误用” | 使用静态客户端 ID 的 MCP proxy 在未取得逐客户端同意时转发 Token；与 audience 重放不同 |
| Mix-up attack | “错误的 Token endpoint” | 客户端被引导至攻击者的 endpoint，并在那里兑换诚实 AS 的授权码；客户端通过 RFC 9207 `iss` 进行防御 |
| `iss` allow-list | “可信授权服务器” | protected-resource metadata 的 `authorization_servers` 中指定的集合 |
| `resource_metadata` | “在哪里查找 PRM 文档” | 401/403 响应中的 `WWW-Authenticate` 参数，用于指定 RFC 9728 metadata URL |
| Public client | “Native 或浏览器客户端” | 没有 `client_secret` 的 OAuth client；由 PKCE 提供补偿 |
| `WWW-Authenticate` | “401/403 响应 header” | 携带驱动客户端恢复流程的 `Bearer error=...` 指令 |

## 延伸阅读

- [MCP authorization specification (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) - 当前 MCP authorization profile
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog) - CIMD、issuer 验证、DCR 弃用和以 issuer 为 key 的凭据变更
- [OAuth Client ID Metadata Document (draft-ietf-oauth-client-id-metadata-document-00)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00) — CIMD
- [RFC 8414 — OAuth 2.0 Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414) — 发现契约
- [RFC 7591 — OAuth 2.0 Dynamic Client Registration Protocol](https://datatracker.ietf.org/doc/html/rfc7591) — DCR（后备路径）
- [RFC 7636 — Proof Key for Code Exchange (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636) — public client 的 proof-of-possession
- [RFC 8707 — Resource Indicators for OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc8707) — audience 绑定
- [RFC 9728 — OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728) — 资源服务器发现
- [RFC 9207 — OAuth 2.0 Authorization Server Issuer Identification](https://datatracker.ietf.org/doc/html/rfc9207) — 用于防御 mix-up attack 的 `iss` 参数
- [RFC 7662: OAuth 2.0 Token Introspection](https://datatracker.ietf.org/doc/html/rfc7662)
- [RFC 7009: OAuth 2.0 Token Revocation](https://datatracker.ietf.org/doc/html/rfc7009)
