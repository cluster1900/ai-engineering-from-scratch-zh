# MCP 鉴权与授权：CIMD、Issuer 绑定、PKCE 与权限提升（Step-Up）

> 远程 MCP 请求是无状态的，但它的授权绝非匿名。必须将每一份凭据与创建它的签发者（Issuer）强绑定，并将每一个 token 与接收它的资源强绑定。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 15 (security)
**Time:** ~90 minutes

## 学习目标

- 通过受保护资源元数据（Protected-Resource Metadata）发现授权服务器（Authorization Server）。
- 优先采用客户端 ID 元数据文档（CIMD），而非已废弃的动态客户端注册（DCR）。
- 在无法避免 DCR 兼容路径时，正确声明 `application_type`。
- 校验授权响应中的 `iss` 参数，并按签发者物理隔离凭据。
- 熟练运用 PKCE、资源指示符（Resource Indicators）、受众验证（Audience Validation）以及增量 Scope。
- 在不依赖协议 session 的前提下发送符合 2026-07-28 规范的受权 MCP 请求。

## 问题

远程 MCP server 可能会读取私有记录、向外部系统写入数据，或触发代价昂贵的运算。身份认证（Authentication）仅说明是谁出示了凭据。而授权（Authorization）还必须回答以下问题：

- 是哪个授权服务器签发了该凭据？
- 该 token 是专门为哪个 MCP 资源签发的？
- 是哪个客户端以及哪个重定向 URI 完成了该授权流程？
- 资源所有者（用户）具体批准了哪些操作？
- 当前这个精确的请求是否依然符合当时的批准范围？

2026-07-28 版本的授权规范加固了客户端注册与签发者处理机制。它优先采用客户端 ID 元数据文档（Client ID Metadata Documents，简称 CIMD），废弃了动态客户端注册（Dynamic Client Registration，简称 DCR），强制要求在 DCR 中指定正确的 `application_type`，校验 RFC 9207 签发者响应，并严禁跨签发者复用凭据。

这些安全规则与无状态的核心协议相辅相成。它们绝不恢复协议层的核心握手，也不会重新引入 `Mcp-Session-Id`。

## 概念

### 明确三大核心角色

- **MCP Client（客户端）：** 代表资源所有者发起请求。
- **MCP Resource Server（资源服务器）：** 验证 Access Token 并提供 MCP 端点服务。
- **Authorization Server（授权服务器）：** 认证资源所有者、收集用户同意并签发 tokens。

资源服务器与授权服务器可以由同一个团队运维，但必须保持两者的标识符与验证职责完全独立。

### 授权应用于 HTTP 传输层

MCP 授权规范专门针对基于 HTTP 的传输层。本地基于 stdio 的 server 运行在同一进程和操作系统的信任边界内，切勿仅为了表面的“对称性”而给 stdio 凭空套上伪造的浏览器 OAuth 流程。

对于远程 Streamable HTTP 传输，必须在每个请求的 `Authorization` 头部中携带 Bearer Token。**绝不能**把 token 放在 URL 查询参数中。

### 从受保护资源元数据开始

资源服务器负责发布符合 RFC 9728 规范的元数据：

```json
{
  "resource": "https://notes.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["notes:delete", "notes:read", "notes:write"]
}
```

客户端从 MCP 资源 URL 出发，获取该元数据文档，选择其中声明的授权服务器，随后再获取该授权服务器的 OAuth 或 OpenID Connect 元数据。

在构造 RFC 9728 的 well-known URL 时，必须保留原有资源路径。对于资源 `https://notes.example.com/mcp`，本课使用的标准路径为 `https://notes.example.com/.well-known/oauth-protected-resource/mcp`。若丢弃 `/mcp` 后缀，可能会错误地选到该域名下其他受保护资源的元数据。

不要根据主机名凭空猜测授权服务器。也不要轻信未经验证的错误响应体中给出的签发者信息。客户端应维护一份自身愿意信任的签发者许可策略。

### 验证授权服务器元数据

授权服务器元数据应当暴露各端点及所支持的安全控制特性：

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

强制要求 PKCE 采用 S256 算法。完整记录签发者（issuer）字符串。这个精确的字符串将成为客户端后续注册信息与 token 存储的核心索引键（Key）。

### 遵循注册优先级规则

若客户端与所选签发者之间已存在显式的预配置关系，直接使用预先注册的客户端凭据。否则，当授权服务器声明支持时，首选客户端 ID 元数据文档（CIMD）。仅在必要时才将已废弃的 DCR 作为向后兼容的回退方案；若两者均不可用，再向用户提示手动输入客户端凭据。

### 优先采用客户端 ID 元数据文档（CIMD）

客户端 ID 元数据文档（CIMD）为授权服务器提供了一个 HTTPS URL，该 URL 既是客户端的唯一标识符（`client_id`），同时又是其元数据文档的获取地址：

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

授权服务器获取并校验该文档。`client_id` 必须是包含路径的 HTTPS URL，且文档内部声明的值必须与该 URL 完全一致。文档的必填字段包括 `client_id`、`client_name` 与 `redirect_uris`。本例中包含的 `application_type` 虽不是 CIMD 的强制要求，但其作为强制字段出现在了 DCR 路径中。

必须将拉取该文档的操作视为防范 SSRF（服务端请求伪造）的高敏操作：解析并验证目标 IP，拒绝环回地址、私有网络、链路本地地址及受限网段，防范重定向与 DNS 重新绑定（DNS rebinding），限制重定向次数、响应大小与超时时间，强制要求 `application/json`，并严格依照有效的 HTTP 缓存控制头进行缓存。对于 `client_name` 等展示字段，一律视为不可信文本。

CIMD 消除了初次连接时动态派发新标识符的繁琐步骤，但并不会免除重定向 URI 校验、签发者信任策略或用户授权同意的要求。

### DCR 仅作为向后兼容路径

动态客户端注册（DCR）仍可供较旧的授权服务器使用，但对于新的 MCP 实现已被正式废弃。

在使用 DCR 时，必须声明 `application_type`：

```json
{
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

- 桌面端、移动端、命令行工具及采用回环地址的客户端使用 `native`。
- 远程托管的 Web 浏览器应用使用 `web`，并配置远程 HTTPS 重定向地址。

若省略此字段，OpenID Connect 注册实现可能会默认将其视为 `web`，从而导致合法的回环重定向直接失败。

将 DCR 代码置于显式的降级决策之后。切勿在 CIMD 验证发生非预期失败时静默回退到 DCR，这可能会把安全检查失效演变成采用防御更弱的注册路径。

### 将凭据与签发者强绑定

由签发者派发的注册凭据必须存储在精确的签发者键名下：

```text
issuer_credentials[issuer] = pre_registered_or_dcr_client
tokens[(issuer, resource)] = access_token
```

若受保护资源的发现结果从 `https://auth-one.example` 变成了 `https://auth-two.example`，必须重新评估信任链。绝不能将属于第一个签发者的 client secret、DCR client id、注册访问 token、refresh token 或 access token 发送给第二个签发者。预注册或 DCR 客户端必须使用专门为新签发者下发的凭据。

CIMD 客户端 ID 则有所不同：由于它是一个自托管的 HTTPS URL，而非由授权服务器派发的内部凭据，因此相同的 CIMD URL 具备可移植性——新的受信任签发者可以直接拉取并验证该文档，而无需走 DCR 重新注册。但授权响应和生成的 token 依然必须隔离存储在新签发者的键名下。

### 带 PKCE 的授权码模式

交互式授权流程包含以下步骤：

1. 生成高熵的随机数 `code_verifier`。
2. 使用 SHA-256 派生出 `code_challenge`（S256 方式）。
3. 发送授权请求，携带精确的 `client_id`、`redirect_uri`、`scope`、`code_challenge` 以及 `resource`。
4. 接收授权响应，该响应包含授权码 `code`，并在支持时携带 `iss`。
5. 在使用响应中的任何字段前，严格比对 `iss` 与预先记录的签发者是否完全一致。
6. 使用 `code_verifier`、完全相同的重定向 URI 及相同的 `resource` 换取 token。
7. 将获取到的 token 存储在 `(issuer, resource)` 复合键下。

来自 RFC 8707 的 `resource` 参数同时出现在授权请求和 token 请求中，它精确标识了权威的 MCP server URI。

### 严格校验 `iss` 参数

RFC 9207 可防止来自一个签发者的授权响应与来自另一个签发者的响应发生混淆（Mix-up 攻击）。

当响应中出现 `iss` 参数时，将其与记录的 issuer 进行比对，禁止大小写折叠、末尾斜杠增删、默认端口移除或 URL 百分号编码规范化。一旦不匹配，不得使用该授权码，甚至不得展示该响应中由攻击者控制的错误详情。

若授权服务器包含 `iss`，通常会在元数据中声明 `authorization_response_iss_parameter_supported: true`。现代客户端即使在未看到该声明的情况下，一旦响应中包含 `iss`，也依然会严格执行该校验。

### 在 MCP Server 端校验受众（Audience）

资源服务器仅接受专门为其签发的 tokens：

```text
token.issuer == configured_authorization_server
token.audience == canonical_mcp_resource
```

任何无效、过期、签发者不匹配或受众不匹配的 token 都会收到 HTTP 401 Unauthorized。MCP server 绝不能接受或中转本应发往其他服务的 token。

### 仅申请当前最小所需 Scope

遵循最小权限原则，仅申请当前操作所需的 scope。若后续某个 tool 需要更高权限，server 会返回 HTTP 403 以及权威的 scope 质询（Challenge）：

```text
WWW-Authenticate: Bearer error="insufficient_scope",
  scope="notes:delete",
  resource_metadata="https://notes.example.com/.well-known/oauth-protected-resource/mcp"
```

客户端向用户解释该新权限的必要性，获取用户同意，以包含新旧 scope 的组合集合发起新的授权流程，并使用新的 JSON-RPC id 重试刚才的 MCP 请求。

切勿假设质询中要求的 scope 必然包含在最初的 `scopes_supported` 中，质询头才是当前操作最具权威性的权限要求。

### 授权与无状态 MCP 底层报文

经过授权的 tool 调用依然携带完整的现代请求信封：

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

Token 用于授权主体权限；请求元数据用于协商协议行为。二者各司其职，不可相互替代。

底层报文校验遵循固定时序：JSON-RPC 及元数据类型有效性、header 与 body 一致性，然后是协议版本支持校验。路由或版本 header 不匹配返回 HTTP 400 与错误码 `-32020`。若 header 与 body 一致但版本不受支持，返回 HTTP 400 与错误码 `-32022`，且 `data` 精确为 `{"supported":["2026-07-28"],"requested":"<actual>"}`。请求未知方法返回 HTTP 404 与错误码 `-32601`。

所有请求级错误（包括 401 Token 无效和 403 Scope 不足）均使用与原始请求 `id` 对应的 JSON-RPC 错误信封包装。结构化恢复信息置于可选的错误 `data` 字段中；`WWW-Authenticate` 则作为标准 HTTP 响应头返回。通知因为没有 `id`，所以不返回 JSON-RPC 响应体。被接受的 HTTP 通知返回 HTTP 202 且响应体为空。

Server 实现了 `server/discover` 并声明支持 tools，因此也必须实现强制性的 `tools/list` 方法。其 tool descriptor 具有稳定的名称、描述以及以 object 为根节点的 `inputSchema`。该列表输出是确定性的，并返回 `resultType`、服务器身份元数据、有限的 `ttlMs` 与 `cacheScope`。服务发现和用户无关的通用 tool 列表可在授权前访问；若列表内容因主体身份而异，则必须应用正常的授权策略并采用私有缓存（private caching）。

### 禁止 Token 直通转发（No Token Passthrough）

MCP server 绝不能将客户端发来的 MCP Access Token 直接透传给下游 API。必须为下游服务单独申请具有正确受众（Audience）的 token，或者采用显式的 Token Exchange 方案。受众验证能够发挥防御作用的前提，正是每个服务都坚决拒绝本属于其他服务的 token。

### Refresh Token 处理

Refresh Token 是可选的。一旦下发，必须严格保密存储，并按签发者与资源进行双重索引。切勿假设其必然存在。若授权服务器支持轮换（Rotation），应当在刷新时执行轮换，并能检测对已作废旧 token 的非法复用。

```figure
t3-scope-stepup
```

## 动手构建

`code/main.py` 是一个进程内协议与授权模拟器。它完整实现了受保护资源发现、授权服务器元数据、CIMD 注册、带版本控制的 DCR 回退、应用类型校验、PKCE、签发者验证、资源绑定 token、Scope 权限提升、`server/discover`、`tools/list` 以及无状态 tool 请求。

该模型接收已解析的请求体和路由 headers。它本身不是完整的 HTTP 适配器，不负责解析 `Content-Type` 或 `Accept`。你可将其接入第 09 课的 Streamable HTTP 适配器，后者严格要求 `Content-Type: application/json` 且 `Accept` 需同时支持 `application/json` 和 `text/event-stream`。

运行它：

```bash
cd phases/13-tools-and-protocols/16-mcp-security-oauth-2-1
python3 code/main.py
python3 -m unittest discover code/tests -v
```

控制台输出按顺序展示服务发现、CIMD 注册、常规读取、两次独立的 Scope 权限提升流程，以及按签发者隔离的凭据存储机制。

## 使用它

将模拟器中的类映射到生产组件中：

- `ResourceServer.protected_resource_metadata` 映射为 RFC 9728 元数据端点。
- `AuthorizationServer.metadata` 映射为 RFC 8414 或 OpenID Connect 发现端点。
- `Client.enroll` 映射为 CIMD 解析及显式的 DCR 兼容回退分支。
- 签发者派发的客户端凭据及 `tokens_by_issuer_resource` 映射为加密存储记录。CIMD URL 保持可移植，而授权产物则始终绑定到特定签发者。
- `ResourceServer.handle` 映射为校验现代 MCP headers、token 和 tool scope 的网关中间件，并在分发前将所有请求错误封装进匹配的 JSON-RPC 信封中。

## 交付它

本课交付 `outputs/skill-oauth-scope-planner.md`。它设计了一整套覆盖注册优先级、签发者隔离凭据存储、应用类型、PKCE、资源指示符、Scope 质询以及当前无状态请求边界的实战规划技能。

## 课后深练习

1. 为模拟器增加 Refresh Token 轮换机制，并测试拒绝复用上一次已轮换的旧 Refresh Token。
2. 增加签发者白名单机制。当检测到签发者变更时，仅复用可移植的 CIMD URL，坚决拒绝此前旧签发者派发的所有凭据与 token。
3. 为授权码增加过期机制，并确认超时的授权码兑换请求必然失败。
4. 构建一个带有远程 HTTPS 重定向地址的 Web 客户端变体，对比其与 Native 客户端在 DCR 元数据上的差异。
5. 在同一个签发者下注册第二个资源，验证为该新资源申请的 Access Token 绝不能在第一个资源端被越权使用。

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
