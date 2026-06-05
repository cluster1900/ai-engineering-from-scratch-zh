# 生产中的 MCP Auth — 注册、JWKS 刷新、受众固定令牌

> 第 16 课在内存中建立了 OAuth 2.1 状态机。到 2026 年，您运送到真实组织的每台 MCP 服务器都位于生产身份验证之后：可扩展到无限客户端人口的客户端注册（首先是客户端 ID 元数据文档，动态客户端注册作为向后兼容的后备）、授权服务器元数据发现（RFC 8414 *或* OpenID Connect Discovery）、不会破坏凌晨 3 点令牌验证的 JWKS 缓存刷新，以及拒绝跨资源重播的受众固定令牌。本课程使用三个角色对整个表面进行建模 - 授权服务器、资源服务器（MCP 服务器）和客户端 - 因此您可以跟踪从发现到经过验证的工具调用的每一跳。
>
> **规范说明 (2025 年 11 月 25 日)：** 2025 年 11 月 MCP 授权规范将动态客户端注册从 `SHOULD` 降级为 `MAY`，并使 **客户端 ID 元数据文档 (CIMD)** 成为建议的默认注册机制。本课程按照规范的优先级顺序教授这两个内容，并且代码在演练中保留 DCR，因为它在一个进程中是完全独立的。

**Type:**构建
**Languages:** Python (stdlib)
**Prerequisites:** 第 13·16 阶段（OAuth 2.1 状态机）、第 13·17 阶段（网关）
**Time:** ~90 分钟

## 学习目标

- 通过 RFC 8414 元数据发现授权服务器并验证合同。
- 实施 RFC 7591 动态客户端注册，以便 MCP 客户端无需管理员干预即可注册。
- 按计划缓存和刷新 JWKS 密钥，以便签名验证在密钥翻转后仍然有效。
- 使用 RFC 8707 资源指示器将令牌固定到单个 MCP 资源，并拒绝混淆副重用。
- 清晰地分离三个角色——授权服务器、资源服务器、客户端——因此每个角色仅强制执行属于它的检查。
- 读取 IdP 能力矩阵，并在 IdP 无法满足 MCP 的身份验证配置文件时拒绝部署。

## 问题

第 16 课模拟器在内存中运行 OAuth 2.1。生产存在纯内存模拟器看不到的三个操作差距。

第一个差距是入学率。真实的组织运行数百个 MCP 服务器和数千个 MCP 客户端。运营商不会将每个 Cursor 用户手动注册为 OAuth 客户端。 2025 年 11 月 25 日规范为客户端提供了解决此问题的优先顺序：如果您有预注册的 `client_id`，请使用预注册的 `client_id`，否则使用 **客户端 ID 元数据文档**（客户端使用其控制的 HTTPS URL 标识自身，授权服务器*拉*元数据），否则回退到 **RFC 7591 动态客户端注册**（客户端*推送*`POST /register` 并接收当场`client_id`），否则提示用户。 CIMD 是推荐的默认设置，因为它完全删除了每个服务器的注册，同时保留了基于 DNS 的信任模型；保留 DCR 是为了向后兼容。两者都从授权服务器的元数据中发现其入口点：CIMD 为 `client_id_metadata_document_supported`，DCR 为 `registration_endpoint`。

第二个差距是密钥轮换。 JWT 验证取决于授权服务器的签名密钥，以 JSON Web 密钥集 (JWKS) 形式发布。授权服务器按计划轮换这些（通常每小时一次，有时在事件响应下更快）。在启动时获取 JWKS 一次的 MCP 服务器在轮换窗口之前验证良好，然后每个请求都会失败，直到重新启动。生产环境将 JWKS 作为缓存值与刷新作业连接起来，该刷新作业会在先前的密钥过期之前覆盖缓存，并在缓存未命中时进行回退获取，以应对由比缓存更新的密钥签名的令牌到达的情况。

第三个差距是受众约束。第 16 课介绍了 RFC 8707 资源指标。在生产中，该指标成为对每个请求的严格索赔检查。 MCP 服务器将 `token.aud` 与其自己的规范资源 URL 进行比较，并拒绝与 HTTP 401 不匹配的内容。这是针对上游 MCP 服务器（或持有用于一台服务器的令牌的恶意客户端）针对同一信任网格中的另一台服务器重放该令牌的唯一防御措施。

本课程将每个间隙映射到表面的混凝土块上。元数据文档是一个 HTTP 端点。 JWKS 缓存刷新是一个计划作业加上一个键值缓存。 JWT 验证是资源服务器在分派任何工具之前运行的例程。将这三个角色分开，每个角色仅强制执行其拥有的检查：授权服务器发布和轮换密钥，资源服务器缓存和验证，客户端发现和注册。

## 概念

### RFC 8414 — OAuth 授权服务器元数据

`/.well-known/oauth-authorization-server` 的文档描述了客户所需的一切：

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "registration_endpoint": "https://auth.example.com/register",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "scopes_supported": ["mcp:tools.read", "mcp:tools.invoke"],
  "token_endpoint_auth_methods_supported": ["none", "private_key_jwt"]
}
```

给定 MCP 资源 URL 链的客户端发现：RFC 9728（资源服务器的文档）中的 `oauth-protected-resource` 命名颁发者，然后 `oauth-authorization-server`（此 RFC）命名每个端点。客户端永远不会对授权 URL 进行硬编码。

您在信任 MCP 的 IdP 之前验证的合同：

- `code_challenge_methods_supported` 包括 `S256`（根据 RFC 7636 的 PKCE）。该规范是明确的：如果该字段**不存在**，则授权服务器不支持 PKCE，并且客户端**必须**拒绝继续。
- `grant_types_supported` 包括 `authorization_code` 并拒绝 `password` 和 `implicit`。
- 至少公布一种注册路径：`client_id_metadata_document_supported: true`（CIMD，首选）**或** `registration_endpoint`（RFC 7591 DCR，后备）。要么满足合同；您不再硬性要求 DCR。
- `response_types_supported` 与 OAuth 2.1 的 `["code"]` 完全相同。

如果 `S256` 丢失，MCP 服务器拒绝针对此 IdP 进行部署 — PKCE 没有降级模式。如果*两种*注册路径均未公布，并且您没有预注册 `client_id`，您也无法注册；部署清单错误，而不是代码错误。

### RFC 9728（回顾）——受保护的资源元数据

第 16 课涵盖了 RFC 9728。生产中的增量：此文档是客户端查找 *此* MCP 服务器信任的授权服务器的唯一位置。单个 MCP 服务器可以接受来自多个 IdP 的令牌（一个用于员工，一个用于合作伙伴）。 RFC 9728 声明了该集合； RFC 8414 记录了每个 IdP 支持的内容。

```json
{
  "resource": "https://notes.example.com",
  "authorization_servers": ["https://auth.example.com", "https://partners.example.com"],
  "scopes_supported": ["mcp:tools.invoke"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://notes.example.com/docs"
}
```

### 客户端 ID 元数据文档（推荐默认值）

CIMD 将注册从“推”反转为“拉”。客户端不要求授权服务器创建 `client_id`，而是使用它控制的 HTTPS URL 作为其 `client_id`。 URL 解析为 JSON 元数据文档；授权服务器在 OAuth 流程期间按需获取它。信任植根于 DNS：如果服务器操作员信任 `app.example.com`，它就会信任由 `https://app.example.com/client.json` 提供服务的客户端。无需注册往返，无需耗尽 `client_id` 命名空间，无需保持同步的每服务器状态。

客户端托管的元数据文档：

```json
{
  "client_id": "https://app.example.com/oauth/client.json",
  "client_name": "Example MCP Client",
  "client_uri": "https://app.example.com",
  "redirect_uris": ["http://127.0.0.1:7333/callback", "http://localhost:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

文档中的 `client_id` 值**必须**等于为其提供服务的 URL（授权服务器对此进行验证；不匹配的情况将被拒绝）。授权服务器在其 RFC 8414 元数据中通告 `client_id_metadata_document_supported: true` 的支持。

该规范直言不讳地提到了两个安全事实：

- **SSRF。** 授权服务器获取攻击者提供的 URL。它必须防御服务器端请求伪造（不提取内部/管理端点）。
- **本地主机模拟。** CIMD 本身无法阻止本地攻击者声明合法客户端的元数据 URL 并绑定任何 `localhost` 重定向。授权服务器**必须**在同意期间清楚地显示重定向 URI 主机名，并且**应该**对仅 `localhost` 的重定向发出警告。

由于 CIMD 不需要服务器端状态，因此没有注册商可以按照 DCR 要求的方式进行维护。客户端是只读的：从静态 HTTPS 端点提供元数据文档并让授权服务器拉取它。

### RFC 7591 — 动态客户端注册（后备/向后兼容性）

DCR 现在是 `MAY`，保留是为了向后兼容 2025 年 11 月 25 日之前的部署和尚不支持 CIMD 的 IdP。如果没有它（并且没有 CIMD 或预注册），每个 MCP 客户端（Cursor、Claude Desktop、自定义代理）都需要与 IdP 管理员进行带外交换。通过 DCR，客户发布：

```json
POST /register
Content-Type: application/json

{
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

服务器响应 `client_id` 和 `registration_access_token` 以供以后更新：

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

`token_endpoint_auth_method: none` 是在用户设备上运行的 MCP 客户端的正确默认值。他们只得到一个 `client_id`——没有 `client_secret` 可供渗透。 PKCE 提供公共客户所需的所有权证明。

三个生产陷阱：

- 注册端点必须按源 IP 进行速率限制。如果没有这个，敌对行为者就会编写数百万个虚假注册脚本并耗尽 `client_id` 命名空间。在注册商处理请求之前运行速率限制检查。
- 一些企业 IdP 需要 `software_statement`（为客户端提供签名的 JWT 担保）。课程的模拟会跳过它；生产环境连接了一个验证步骤，该步骤拒绝来自本地主机重定向 URI 以外的任何内容的未签名注册。
- `registration_access_token` 必须存储为哈希值，而不是明文。窃取此令牌意味着攻击者可以重写客户端的重定向 URI。

### RFC 8707（回顾）——资源指标

第 16 课确立了形状。生产规则：每个令牌请求都包含 `resource=<canonical-mcp-url>`，并且 MCP 服务器在每次调用时验证 `token.aud` 与其自己的资源 URL 匹配。规范 URI 是服务器的“最具体”标识符：它使用小写方案和主机，没有片段，并且通常没有尾部斜杠。路径组件**不会**被规则剥离——当需要识别单个 MCP 服务器时，规范会保留它。 `https://mcp.example.com`、`https://mcp.example.com/mcp`、`https://mcp.example.com:8443` 和 `https://mcp.example.com/server/mcp` 都是有效的规范 URI。每台服务器选择一个并将 `aud` 固定到该服务器上。 （为了简洁起见，本课程的模拟使用 `https://notes.example.com` 等裸主机受众；在一个源下共同托管多个 MCP 服务器的部署通过路径区分它们。）

### RFC 7636（回顾）——PKCE

PKCE 在 OAuth 2.1 中是强制性的。本课程的授权码流始终带有 `code_challenge` 和 `code_verifier`。服务器拒绝任何没有验证者或验证者未散列到存储的质询的令牌请求。

### MCP 规范 2025-11-25 授权简介

MCP 规范 (2025-11-25) 精确说明了 MCP 服务器的授权层必须执行的操作：

- 实施 RFC 9728 受保护资源元数据，并通过 401 上的 `WWW-Authenticate: Bearer resource_metadata="..."` 标头 **或** 众所周知的 URI `/.well-known/oauth-protected-resource` 提供其位置（SEP-985 使标头成为可选的，并具有众所周知的回退功能）。元数据 `authorization_servers` 字段**必须**命名至少一台服务器。
- 仅在 **每个** 请求上通过 `Authorization: Bearer ...` 接受令牌 - 从不在查询字符串中，从不仅在会话开始时验证。
- 验证 `aud`、`iss`、`exp` 以及每个请求所需的范围。服务器**必须**验证令牌是专门为其（受众）颁发的；丢失或不匹配的 `aud` 将被拒绝，永远不会被视为通配符。
- 在 401/403 上，返回 `WWW-Authenticate: Bearer`，携带 `error=...`、`resource_metadata="<PRM-URL>"` 参数（元数据文档的 URL，*不是*裸资源）以及 `insufficient_scope` 上的 `scope="..."` (403)。注意：参数是 `resource_metadata`，一个发现指针——挑战中没有 `resource` 参数。
- 授权服务器发现接受 **RFC 8414 OAuth 元数据 **或** OpenID Connect Discovery 1.0；客户必须按优先顺序尝试这两个众所周知的后缀。
- 客户端（而非服务器）防御**混合攻击**：它在重定向之前记录预期的 `issuer`，并在兑换代码之前验证 `iss` 授权响应参数 (RFC 9207)。 PKCE 本身并不能阻止混淆，因为客户端将其 `code_verifier` 交给它被引导到的任何令牌端点。

OAuth 2.1 草案是基础； RFC 8414/7591/8707/9728/9207 + RFC 7636 + CIMD 为表面； MCP 规格是配置文件。

### IdP 能力矩阵

并非每个 IdP 都支持完整的 MCP 配置文件。下面的矩阵记录了截至 2025 年 11 月 25 日规范的实际功能声明。这是一个“部署门”，而不是建议。

CIMD 在 2025 年 11 月 25 日规范中发布，底层 OAuth 草案仅在 2025 年 10 月才被采用，因此供应商支持仍在到来 - 将下面的“CIMD”视为“当前情况，在租户中验证”，而不是永久声明。

| IdP 类别 | AS 元数据 (8414/OIDC) | CIMD | RFC 7591 DCR | RFC 8707 资源 | RFC 7636 S256 PKCE | RFC 7636 S256 PKCE笔记|
|---|---|---|---|---|---|---|
|自托管（Keycloak）|是的 |新兴|是的 |是（自 24.x 起）|是的 |本课程中 MCP 配置文件的参考 IdP；端到端的完整 DCR 路径，CIMD 跟踪新规范。 |
|企业 SSO (Microsoft Entra ID) |是的 |新兴|是（高级级别）|是的 |是的 | DCR 可用性因租户级别而异；部署前在目标租户中进行验证。 |
|企业 SSO (Okta) |是的 |新兴|是（Okta CIC / Auth0）|是的 |是的 | DCR 可在 Auth0（现在的 Okta CIC）上使用；经典 Okta 组织需要管理员预先注​​册。 |
|社交登录 IdP（通用）|变化 |没有|很少|很少|是的 |大多数社交 IdP 将客户视为静态合作伙伴；没有自助注册。仅用作身份源，将您自己的 MCP 感知授权服务器置于顶层。 |
|定制/自制|取决于 |取决于 |取决于 |取决于 |取决于 |如果您自己提供，请提供完整的配置文件并首选 CIMD。跳过 PKCE 或受众绑定会破坏 MCP 身份验证合同。 |

部署清单的拒绝规则：如果所选 IdP 未在 `code_challenge_methods_supported` 中列出 `S256`，则 MCP 服务器拒绝启动 — PKCE 没有降级模式。注册是一个较软的门：您需要“一个”工作路径（预先注册的 `client_id`、`client_id_metadata_document_supported: true` 或 `registration_endpoint`）。仅 DCR 缺席不再是拒绝的触发因素，因为 CIMD 或预注册可以弥补这一点。

### JWKS刷新模式（在AS轮转，在资源服务器刷新）

将两个动词分开，因为将它们合并是一个真正的生产错误：

- **轮换**是*授权服务器*所做的事情：创建一个新的签名密钥，将其发布在 JWKS 中，稍后淘汰旧密钥。资源服务器不参与此操作，也无法执行此操作 — 它不持有 IdP 的私钥。
- **刷新**是*资源服务器*所做的：将发布的JWKS重新`GET`到其缓存中。这是资源服务器执行的唯一 JWKS 操作。

生产故障模式是陈旧的缓存。通过计划刷新作业加上键值缓存来解决该问题。资源服务器运行一个作业（cron、计时器，无论您的运行时提供什么），以固定的时间间隔获取 `<issuer>/.well-known/jwks.json` 并覆盖 `cache[issuer] = {keys, fetched_at}`。验证器从该缓存中读取。缓存中缺少 `kid` 的令牌会触发**一次**同步刷新作为后备，然后重新检查。这可以同时处理两种情况：计划刷新和密钥重叠窗口，其中由全新密钥签名的令牌在下一次计划刷新之前到达。

回退**必须是重新获取，而不是旋转**。如果将缓存未命中路径连接到旋转和铸造，则会破坏两件事：（1）铸造新密钥会产生一个“仍然”与令牌不匹配的 `kid`，因此查找无论如何都会失败； (2) 攻击者使用随机的 `kid` 值喷射令牌，强制创建一系列无限制的密钥——这是一种自我造成的 DoS。重新获取是幂等的，因此伪造的 `kid` 最多会浪费一次获取。

缓存形状：

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

同时按下两个键是稳定状态。授权服务器通过在淘汰前一个密钥 (`k_2026_03`) 之前引入下一个密钥 (`k_2026_04`) 进行轮换，因此根据旧密钥颁发的令牌在过期之前保持有效。缓存保存并集；验证者通过 `kid` 选择。

### 验证例程

MCP 服务器在分派任何工具之前运行验证。形状 `code/main.py` 使用：

```python
result = server.validate(bearer_token, required_scope="mcp:tools.invoke")
if not result["valid"]:
    return {"status": result["status"], "WWW-Authenticate": result["www_authenticate"]}
```

`validate` 解码 JWT，从 JWKS 缓存解析签名密钥（未命中时刷新一次），验证签名，然后对照允许列表检查 `iss`，对照此服务器的规范资源 `aud` 和所需范围检查 `aud` - 在第一次失败时返回 `WWW-Authenticate` 质询。将其保留在资源服务器上的单个例程意味着每个入口点（每个工具调用、每个传输）都要经过相同的检查；没有经过首先验证就可以到达工具的路径。

### 观众重播演练（访问令牌权限限制）

服务器 A (`notes.example.com`) 和服务器 B (`tasks.example.com`) 均向同一授权服务器注册。服务器 A 受到威胁。攻击者获取用户的笔记令牌并在服务器 B 上重放它。

服务器B的验证器：

1. 解码JWT，通过`kid`获取JWKS，验证签名。
2. 根据其受保护资源元数据的 `authorization_servers` 检查 `iss`。 （通过 — 相同 IdP。）
3.勾选`aud == "https://tasks.example.com"`。 （失败 — 代币的 `aud` 为 `https://notes.example.com`。）
4. 使用`WWW-Authenticate: Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="https://tasks.example.com/.well-known/oauth-protected-resource"`返回401。

观众声称是在协议层抵御这种攻击的唯一防御措施。为了性能而跳过它是最常见的生产错误；验证器必须在每个请求上运行，而不仅仅是在会话开始时运行。该规范将其称为**访问令牌权限限制**：MCP 服务器 `MUST` 拒绝任何未在受众中命名的令牌。

> **命名说明。** 该规范为一个相关但不同的问题保留了术语“困惑的代理人”：MCP 服务器充当第三方 API 的 OAuth **代理**，使用静态客户端 ID，在未获得每个客户端用户同意的情况下转发令牌。观众绑定修复了上面的重播；混淆代理修复是每个客户端同意**加上**从不将入站令牌传递到上游 API（MCP 服务器 `MUST` 获得自己单独的上游令牌）。

### 混合攻击（服务器无法提供的客户端防御）

客户端在其生命周期中与许多授权服务器进行通信。恶意 AS 可以尝试让客户端在攻击者的令牌端点处兑换诚实 AS 的授权代码。受众绑定在这里没有帮助——攻击发生在任何令牌存在之前。防御位于客户端（RFC 9207）：

1. 在重定向之前，客户端从已验证的 AS 元数据中记录预期的 `issuer`。
2. 在授权响应中，客户端将返回的 `iss` 参数与记录的颁发者进行比较（简单字符串比较，无标准化），然后将代码发送到任何地方。
3. 不匹配（或者AS通告`authorization_response_iss_parameter_supported`时`iss`不存在）→拒绝，甚至不显示`error`字段。

PKCE 本身并不能阻止混淆，因为客户端将其 `code_verifier` 传递给它被引导到的任何令牌端点。这就是规范将每个请求的发行者与 PKCE 验证者和 `state` 一起记录的原因。

### 故障模式- **过时的 JWKS。** AS 轮换密钥后，验证器会拒绝有效令牌。修复方法是上面的 cron-refresh + cache-miss-refetch 模式。切勿在没有刷新作业的情况下缓存 JWKS。
- **Rotate-as-fall-back。** 将缓存未命中路径连接到旋转和铸造而不是重新获取是一个真正的错误：它永远不会产生丢失的 `kid`，并且它将攻击者控制的 `kid` 值转变为密钥创建 DoS。后备必须是幂等 `refresh-jwks`。
- **缺少 `aud` 声明。** 某些 IdP 默认忽略 `aud`，除非令牌请求中存在 `resource`。验证者必须拒绝缺少 `aud` 的令牌，而不是将缺少视为通配符。
- **由于缺少 `iss` 检查而造成混淆。** 如果客户端未针对重定向前记录的颁发者验证 RFC 9207 `iss` 授权响应参数，则可以引导其在攻击者的令牌端点处兑换诚实的 AS 代码。这是客户端故障；资源服务器无法弥补。
- **范围升级竞赛。**同一用户的两个并发升级流程都可以成功并生成具有不同范围的两个访问令牌。验证器必须使用请求中提供的令牌，而不是查找“用户的当前范围”——这会创建一个 TOCTOU 窗口。
- **注册令牌盗窃。** 泄露的 `registration_access_token` 可让攻击者重写重定向 URI。在休息时对这些进行哈希处理；要求客户在每次更新时提供明文；因怀疑而旋转。
- **`iss` 未固定。** 接受任何 `iss` 的验证器可让攻击者建立自己的授权服务器，为目标受众注册客户端并颁发令牌。受保护资源元数据的 `authorization_servers` 列表是允许列表；强制执行。

## 使用它

`code/main.py` 使用 stdlib Python 和三个角色（`AuthorizationServer`、`ResourceServer` 和 `Client`）走完整的生产流程。流程：

1. 授权服务器在 `/.well-known/oauth-authorization-server` 发布 RFC 8414 元数据。
2. MCP 客户端调用元数据端点并检查其注册选项（对于 CIMD 为 `client_id_metadata_document_supported`，对于 DCR 为 `registration_endpoint`）和 `S256` PKCE 支持。
3. 本演练采用 DCR 后备路径：客户端发布到 `/register` (RFC 7591) 并接收 `client_id`。 （CIMD 客户端将提供其自己的 HTTPS `client_id` URL 并跳过此步骤。）
4. MCP 客户端使用 `resource` 指示器 (RFC 8707) 运行 PKCE 保护的授权代码流 (RFC 7636)。
5. MCP 客户端使用 `Authorization: Bearer ...` 调用 MCP 服务器上的工具。
6. MCP 服务器运行 `validate`，从 JWKS 缓存解析签名密钥。
7. IdP 轮换密钥；计划的刷新将 JWKS 重新拉入缓存。
8. 下一次调用将根据刷新的密钥进行验证而无需重新启动，并且上一个令牌在重叠窗口期间仍然有效。
9. 针对不同 MCP 资源的观众重播尝试会收到 401，并带有 `audience mismatch` 和 `resource_metadata` 指针。这里的 JWT 使用带有共享密钥的 HS256（因此本课程仅在 stdlib 上运行）。生产使用 RS256 或 EdDSA，并带有上述 JWKS 模式；验证逻辑在其他方面是相同的。由于IdP和资源服务器在同一个进程中，`refresh_jwks`直接读取授权服务器的密钥列表；通过网络，它是 HTTP `GET` 到 `jwks_uri`。

## 发货

本课程生成 `outputs/skill-mcp-auth.md`。给定 MCP 服务器配置和 IdP 功能集，该技能会发出要启动的身份验证表面 - 受保护资源元数据、要使用的注册路径（CIMD、预注册或 DCR 回退）、JWKS 刷新计划、范围映射以及 IdP 不支持完整 RFC 配置文件时要应用的拒绝规则。

## 练习

1.运行`code/main.py`。追踪流量。请注意 IdP 如何在步骤 6 中轮换密钥，计划的 `refresh_jwks` 重新拉取已发布的集合，并且旧令牌（重叠窗口）和新令牌都无需重新启动即可验证。

2. 将新的 IdP 添加到受保护资源元数据的 `authorization_servers` 列表中。发出由新 IdP 签名的令牌并确认验证器接受它。发出由未列出的 IdP 签名的令牌，并使用 `WWW-Authenticate: Bearer error="invalid_token", error_description="iss not allowed"` 确认验证器拒绝。

3. 向 `register_client` 添加速率限制检查，该检查在注册商接受请求之前运行。对每个源 IP 使用一个令牌桶，该令牌桶保存在由 IP 键入的小字典中。

4. 阅读 RFC 7591 并确定课程的 `/register` 处理程序未验证的两个字段。添加验证。 （提示：`software_statement` 和 `redirect_uris` URI 方案。）

5. 添加客户端 ID 元数据文档路径。提供一个`client.json`，其`client_id`等于其自己的URL，并让授权服务器获取并验证它（如果`client_id` ≠ URL则拒绝）。确认 CIMD 客户端在没有 `register_client` 调用的情况下注册。

6. 证明 DoS 修复。向验证器发送带有随机 `kid` 的令牌，并确认 `refresh_jwks` 最多运行一次，并且授权服务器的密钥计数不会增加。然后故意将回退重新连接到旋转和铸造，并观察每个虚假令牌的密钥计数攀升 - 之后恢复重新获取。

7. 从混合部分实现客户端 RFC 9207 `iss` 检查：在授权请求之前记录预期的颁发者，然后拒绝 `iss` 不匹配的授权响应。

## 关键术语

|术语 |人们怎么说|它实际上意味着什么 |
|------|----------------|------------------------|
|先进制造 | “OAuth 元数据文档”| RFC 8414 `/.well-known/oauth-authorization-server` JSON |
| CIMD | “客户端元数据 URL”|客户端 ID 元数据文档 — 用作 `client_id` 的 HTTPS URL； AS 拉取 JSON。自 2025 年 11 月 25 日起建议默认设置 |
|直流电阻| 「自助客户注册」 | RFC 7591 `POST /register` 流程；于 2025 年 11 月 25 日降级为 `MAY` 回退 |
| JWKS | “JWT 验证的公钥” | JSON Web密钥集，从`jwks_uri`获取，由`kid`索引 |
|旋转与刷新 | “更新密钥” | *轮换* = AS 铸造/淘汰签名密钥； *刷新* = 资源服务器重新获取已发布的集。资源服务器只刷新 |
|资源指标| “受众参数” | RFC 8707 `resource` 参数将令牌固定到一台服务器 |
| `aud` 索赔 | 「观众」 | JWT 声明验证器与规范资源 URL 进行比较 |
|观众回放 | “令牌重播” |为服务器 A 颁发的令牌呈现给服务器 B；通过受众验证进行辩护（规范：访问令牌权限限制）|
|困惑的副手| “代理令牌滥用”|具有静态客户端 ID 的 MCP 代理在未经每个客户端同意的情况下转发令牌；与观众重播不同|
|混合攻击| “错误的令牌端点” |客户端引导在攻击者端点兑换诚实的 AS 代码；通过 RFC 9207 `iss` 保护客户端 |
| `iss` 允许列表 | “可信授权服务器”|受保护资源元数据中命名的集合 `authorization_servers` |
| `resource_metadata` | “哪里可以找到 PRM 文档”| `WWW-Authenticate` 参数在 401/403 上命名 RFC 9728 元数据 URL |
|公共客户| “本机或浏览器客户端”|没有 `client_secret` 的 OAuth 客户端； PKCE 补偿 |
| `WWW-Authenticate` | “401/403 响应标头” |携带驱动客户端恢复的 `Bearer error=...` 指令 |

## 进一步阅读

- [MCP — 授权规范 (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) — 本课程实现的 MCP 身份验证配置文件
- [MCP 博客 — MCP 一年：2025 年 11 月规范发布](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/) — 2025 年 11 月 25 日发生了什么变化（CIMD、XAA、DCR 降级）
- [Aaron Parecki — 2025 年 11 月 MCP 授权规范中的客户注册](https://aaronparecki.com/2025/11/25/1/mcp-authorization-spec-update) — CIMD-over-DCR 基本原理
- [OAuth 客户端 ID 元数据文档 (draft-ietf-oauth-client-id-metadata-document-00)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00) — CIMD
- [RFC 8414 — OAuth 2.0 授权服务器元数据](https://datatracker.ietf.org/doc/html/rfc8414) — 发现合同
- [RFC 7591 — OAuth 2.0 动态客户端注册协议](https://datatracker.ietf.org/doc/html/rfc7591) — DCR（后备路径）
- [RFC 7636 — 代码交换证明密钥 (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636) — 公共客户端所有权证明
- [RFC 8707 — OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc8707) 的资源指示器 — 受众固定
- [RFC 9728 — OAuth 2.0 受保护的资源元数据](https://datatracker.ietf.org/doc/html/rfc9728) — 资源服务器发现
- [RFC 9207 — OAuth 2.0 授权服务器颁发者标识](https://datatracker.ietf.org/doc/html/rfc9207) — 防御混合攻击的 `iss` 参数
- [OAuth 2.1 草案](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1) — 合并的 OAuth 基础
