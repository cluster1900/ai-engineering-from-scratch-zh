# MCP 授权：CIMD、Issuer 绑定、PKCE 与权限提升

> 远程 MCP 请求是无状态的，但其授权并非匿名。将每个 credential 绑定到创建它的 issuer，并将每个 Token 绑定到接收它的 resource。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09（transport）、Phase 13 · 15（安全）
**Time:** ~90 分钟

## 学习目标

- 通过 protected-resource metadata 发现 authorization server。
- 优先使用 Client ID Metadata Document，而不是已弃用的 Dynamic Client Registration。
- 在不可避免地使用 DCR 兼容路径时，声明正确的 `application_type`。
- 验证 authorization response 的 `iss`，并按 issuer 隔离 credential。
- 使用 PKCE、resource indicator、audience 验证和增量 scope。
- 在不使用 protocol session 的情况下发送经过授权的 MCP 2026-07-28 请求。

## 问题

远程 MCP server 可能读取私有记录、写入外部系统，或触发成本高昂的工作。身份验证会告知它是谁提交了 credential。授权还必须回答：

- 哪个 authorization server 签发了 credential？
- Token 面向哪个 MCP resource？
- 哪个 client 和 redirect URI 完成了授权流程？
- 用户批准了哪些操作？
- 这个具体请求是否仍符合该批准范围？

2026-07-28 authorization profile 强化了 client enrollment 和 issuer 处理。它优先采用 Client ID Metadata Document，弃用 Dynamic Client Registration，要求 DCR 使用正确的 `application_type`，验证 RFC 9207 issuer response，并禁止跨 issuer 重用 credential。

这些规则是对无状态核心的补充。它们不会恢复核心 handshake 或 `Mcp-Session-Id`。

## 概念

### 了解三个角色

- **MCP client：** 代表 resource owner 发送请求。
- **MCP resource server：** 接收 access Token 并提供 MCP endpoint。
- **Authorization server：** 对 resource owner 进行身份验证、收集 consent 并签发 Token。

Resource server 和 authorization server 可以由同一方运营，但应将它们的 identifier 和验证职责分开。

### 授权适用于 HTTP

MCP authorization specification 适用于基于 HTTP 的 transport。本地 stdio server 在进程和操作系统信任边界下运行。不要仅为了形式对称，就为 stdio 添加虚假的浏览器 OAuth 流程。

对于远程 Streamable HTTP，应在每个请求的 `Authorization` header 中发送 bearer Token。绝不要将其放入 URL。

### 从 protected-resource metadata 开始

Resource server 发布 RFC 9728 metadata：

```json
{
  "resource": "https://notes.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["notes:delete", "notes:read", "notes:write"]
}
```

Client 从 MCP resource URL 开始，获取此文档，选择其中公布的 authorization server，然后获取该 server 的 OAuth 或 OpenID Connect metadata。

构造 RFC 9728 well-known URL 时，应保留 resource path。对于 resource `https://notes.example.com/mcp`，本课程使用 `https://notes.example.com/.well-known/oauth-protected-resource/mcp`。丢弃 `/mcp` 后缀可能会选择同一 origin 上另一个 protected resource 的 metadata。

不要根据 hostname 猜测 authorization server。不要跟随从未验证的错误 body 中发现的 issuer。应制定 policy，规定 client 愿意信任哪些 issuer。

### 验证 authorization server metadata

Metadata 应公开 endpoint 和支持的控制措施：

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

PKCE 必须使用 S256。记录精确的 issuer 字符串。这个精确值将成为 registration 和 Token 存储的 key。

### 遵循 registration 优先级

当 client 已与所选 issuer 建立明确关系时，使用预注册的 client 信息。否则，当 authorization server 声明支持 Client ID Metadata Document 时，优先使用它。仅将 DCR 用作已弃用的兼容性 fallback；如果这些机制均不可用，再提示用户提供 client 信息。

### 优先使用 Client ID Metadata Document

Client ID Metadata Document 向 authorization server 提供一个 HTTPS URL，该 URL 同时作为 client identifier 和其 metadata 的位置：

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

Authorization server 获取并验证该文档。`client_id` 必须是包含 path 的 HTTPS URL，并且文档内的值必须与该 URL 完全相等。必需的文档字段为 `client_id`、`client_name` 和 `redirect_uris`。本示例中包含 `application_type`，但它并不是 CIMD 的要求。它新增的强制使用场景专门针对 DCR 路径。

应将文档获取操作视为 SSRF 敏感操作。解析并验证目标地址，拒绝 loopback、private、link-local 及其他不允许的地址；在 redirect 和 DNS 变化后重新检查；限制 redirect 次数、字节数和时间；要求返回 JSON；并且仅按照经过验证的 HTTP cache control 进行缓存。将 `client_name` 和其他显示字段视为不可信文本。

CIMD 不再需要在每次首次接触时创建新的动态 identifier。它不会取消 redirect URI 验证、issuer policy 或用户 consent。

### DCR 是兼容路径

Dynamic Client Registration 仍可用于旧版 authorization server，但在新的 MCP 实现中已被弃用。

使用 DCR 时，应声明 `application_type`：

```json
{
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

- Desktop、mobile、command-line 和 loopback client 使用 `native`。
- 远程托管的浏览器应用使用 `web` 和远程 HTTPS redirect。

在 OpenID Connect registration 实现中，省略该字段可能会默认使用 `web`，导致合法的 loopback redirect 失败。

将 DCR 代码置于显式 fallback 决策之后。不要在任意 CIMD 验证失败后静默 fallback。否则可能会将一次安全失败转变为较弱的 enrollment 路径。

### 将 credential 绑定到 issuer

按照精确的 issuer 存储由 issuer 创建的 enrollment material：

```text
issuer_credentials[issuer] = pre_registered_or_dcr_client
tokens[(issuer, resource)] = access_token
```

如果 protected-resource discovery 从 `https://auth-one.example` 变为 `https://auth-two.example`，应重新评估信任关系。绝不要将第一个 issuer 的 client secret、DCR client id、registration access Token、refresh Token 或 access Token 发送给第二个 issuer。预注册和 DCR client 必须使用新 issuer 签发的 credential。

CIMD client id 则有所不同，因为它是自行托管的 HTTPS URL，而不是 authorization server 创建的 credential。同一个 CIMD URL 可以移植：新的可信 issuer 无需重新进行 DCR registration，便可获取并验证该文档。Authorization response 和 Token 仍应在新 issuer 下进行验证和存储。

### 使用 PKCE 的 authorization code

交互流程如下：

1. 生成高熵 `code_verifier`。
2. 派生 S256 `code_challenge`。
3. 发送 authorization request，其中包含精确的 `client_id`、`redirect_uri`、`scope`、`code_challenge` 和 `resource`。
4. 接收包含 `code` 以及所提供 `iss` 的 authorization response。
5. 在使用任何 response 字段之前，对照精确记录的 issuer 验证 `iss`。
6. 使用 `code_verifier`、相同的 redirect URI 和相同的 `resource` 交换 code。
7. 将生成的 Token 存储在 `(issuer, resource)` 下。

RFC 8707 的 `resource` 参数同时出现在 authorization request 和 Token request 中。它标识规范 MCP server URI。

### 精确验证 `iss`

RFC 9207 可防止将来自一个 issuer 的 authorization response 与另一个 issuer 的 response 混淆。

当 `iss` 存在时，应直接与记录的 issuer 比较，不进行大小写折叠、尾部斜杠变更、默认端口移除或百分号编码规范化。如果不匹配，不要处理 code，甚至不要显示该 response 中由攻击者控制的错误详情。

包含 `iss` 的 authorization server 会声明 `authorization_response_iss_parameter_supported: true`。即使缺少此声明，当前 client 仍会验证已存在的 `iss`。

### 在 MCP server 验证 audience

Resource server 仅接受为自身签发的 Token：

```text
token.issuer == configured_authorization_server
token.audience == canonical_mcp_resource
```

无效、过期、issuer 错误或 audience 错误的 Token 将收到 401。MCP server 不得接受或转发面向其他服务的 Token。

### 请求当前所需的最小 scope

从当前所需的 scope 开始。如果后续 tool 需要更多权限，server 会返回 403，并提供权威的 scope challenge：

```text
WWW-Authenticate: Bearer error="insufficient_scope",
  scope="notes:delete",
  resource_metadata="https://notes.example.com/.well-known/oauth-protected-resource/mcp"
```

Client 说明新增权限、取得 consent、使用合并后的 scope 集执行新的 authorization flow，然后使用新的 JSON-RPC id 重试 MCP 请求。

不要假设 challenge 中的 scope 是 `scopes_supported` 的子集。Challenge 对当前操作具有权威性。

### 授权与无状态 MCP wire

经过授权的 tool call 仍携带完整的当前请求 envelope：

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

Token 为 principal 授权。请求 metadata 协商协议行为。两者不能相互替代。

按照固定顺序验证 wire：先验证 JSON-RPC 和 metadata 类型，再验证 header 与 body 是否相等，最后检查协议支持情况。Routing 或 version header 不匹配时返回 HTTP 400 和 `-32020`。如果 header 和 body 一致，但 version 不受支持，则返回 HTTP 400 和 `-32022`，其中 `data` 必须恰好为 `{"supported":["2026-07-28"],"requested":"<actual>"}`。未知 method 返回 HTTP 404 和 `-32601`。

每个请求错误，包括 401 无效 Token 和 403 scope 不足，都采用包含原始请求 `id` 的 JSON-RPC error envelope。结构化恢复信息应放入可选的错误 `data` 中；`WWW-Authenticate` 仍作为 HTTP response header。Notification 没有 `id`，因此不会收到 JSON-RPC body。已接受的 HTTP notification 返回 202 和空 body。

Server 实现 `server/discover` 并公布 tool，因此也会实现强制要求的 `tools/list` method。其 tool descriptor 具有稳定的名称、description 和以 object 为根的 `inputSchema` 值。列表具有确定性，并返回 `resultType`、server identity metadata、受限的 `ttlMs` 和 `cacheScope`。Discovery 和不依赖用户的 tool list 可以在授权前提供。如果其中任意一项因 principal 而异，则应用常规 policy 和 private caching。

### 禁止 Token passthrough

MCP server 不得将 client 的 MCP access Token 转发给下游 API。应获取具有正确 audience 的独立下游 Token，或使用显式 Token exchange 设计。只有当服务拒绝为其他对象签发的 Token 时，audience 验证才有效。

### Refresh Token

Refresh Token 是可选的。签发后，应以保密方式存储，并按 issuer 和 resource 设置 key。不要假设它们一定存在。当 authorization server 支持 rotation 时，应轮换 Refresh Token，并检测已失效值的重复使用。

```figure
t3-scope-stepup
```

## 动手构建

`code/main.py` 是一个进程内协议和授权模拟器。它实现了 protected-resource discovery、authorization server metadata、CIMD enrollment、带 version gating 的 DCR fallback、application type 检查、PKCE、issuer 验证、绑定 resource 的 Token、scope step-up、`server/discover`、`tools/list`，以及无状态 tool 请求。

该 model 接收解析后的请求 body 和 routing header。它不是完整的 HTTP adapter，也不解析 `Content-Type` 或 `Accept`。将其连接到第 09 课的 Streamable HTTP adapter；该 adapter 要求 `Content-Type: application/json`，并要求 `Accept` 值同时包含 `application/json` 和 `text/event-stream`。

运行：

```bash
cd phases/13-tools-and-protocols/16-mcp-security-oauth-2-1
python3 code/main.py
python3 -m unittest discover code/tests -v
```

输出会依次展示 discovery、CIMD enrollment、普通读取、两次独立的 scope step-up，以及以 issuer 为 key 的 credential 存储。

## 实际使用

将模拟器 object 映射到生产组件：

- `ResourceServer.protected_resource_metadata` 对应 RFC 9728 endpoint。
- `AuthorizationServer.metadata` 对应 RFC 8414 或 OpenID Connect discovery。
- `Client.enroll` 对应 CIMD resolution 加上显式 DCR 兼容分支。
- 由 issuer 创建的 client credential 和 `tokens_by_issuer_resource` 对应加密记录。CIMD URL 可以保持可移植，而其授权结果仍与 issuer 绑定。
- `ResourceServer.handle` 对应 middleware：在 dispatch 前验证当前 MCP header、Token 和 tool scope，同时让每个请求错误都保留在匹配的 JSON-RPC envelope 中。

## 交付成果

本课程交付 `outputs/skill-oauth-scope-planner.md`。它现在可以设计 enrollment 优先级、绑定 issuer 的 credential 存储、application type、PKCE、resource indicator、scope challenge，以及当前的无状态请求边界。

## 练习

1. 添加 Refresh Token rotation，并拒绝重复使用之前的 Refresh Token。
2. 添加 issuer allowlist。当 issuer 发生变化时，仅重用可移植的 CIMD URL；拒绝之前 issuer 创建的所有 credential 和 Token。
3. 为 authorization code 添加 expiry，并确认超时交换会失败。
4. 构建使用远程 HTTPS redirect 的 web client 变体，并将其 DCR metadata 与 native client 进行比较。
5. 在同一 issuer 下添加第二个 resource。确认其 access Token 无法用于第一个 resource。

## 关键术语

| 术语 | 含义 |
|------|---------|
| Protected-resource metadata | 用于标识 resource 和 authorization server 的 RFC 9728 文档 |
| CIMD | URL 同时作为 OAuth client identifier 的 HTTPS metadata 文档 |
| DCR | 为兼容性保留的、已弃用的动态 client enrollment |
| `application_type` | `native` 或 `web`，用于验证 redirect URI 规则 |
| PKCE | 用于保护被截获 authorization code 的 verifier 和 S256 challenge |
| `iss` | RFC 9207 authorization response issuer identifier |
| Resource indicator | 将 Token request 绑定到 MCP resource 的 RFC 8707 参数 |
| Audience | Token 对其有效的 resource |
| Step-up | 针对当前操作新增 scope 进行新的 consent 和 Token 签发 |
| Issuer-bound credentials | 按精确的 authorization server issuer 隔离的 registration 和 Token 记录 |

## 延伸阅读

- [MCP 2026-07-28 authorization specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [RFC 9728：OAuth 2.0 Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728)
- [RFC 8707：Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707)
- [RFC 9207：OAuth 2.0 Authorization Server Issuer Identification](https://www.rfc-editor.org/rfc/rfc9207)
- [OAuth Client ID Metadata Document draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/)
