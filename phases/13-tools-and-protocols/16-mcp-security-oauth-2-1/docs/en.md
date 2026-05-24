# MCP Security II — OAuth 2.1、Resource Indicators、Incremental Scopes

> Remote MCP servers 需要 authorization，而不只是 authentication。2025-11-25 spec 与 OAuth 2.1 + PKCE + resource indicators (RFC 8707) + protected-resource metadata (RFC 9728) 对齐。SEP-835 增加了 incremental scope consent，并在 403 WWW-Authenticate 上进行 step-up authorization。本课将 step-up flow 实现为 state machine，让你看到每一次跳转。

**Type:** 构建
**Languages:** Python (stdlib, OAuth state machine simulator)
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 15 (security I)
**Time:** ~75 分钟

## 学习目标
- 区分 resource server 与 authorization server 的职责。
- 走通受 PKCE 保护的 OAuth 2.1 authorization code flow。
- 使用 `resource` (RFC 8707) 和 protected-resource metadata (RFC 9728) 来防止 confused-deputy attacks。
- 实现 step-up authorization：server 返回 403，并通过 WWW-Authenticate 请求更高的 scope；client 重新提示用户 consent，然后重试。

## 问题
早期 MCP（2025 年之前）发布 remote servers 时使用临时拼凑的 API keys，甚至没有 auth。2025-11-25 spec 用完整的 OAuth 2.1 profile 补上了这个缺口。

三个真实世界需求：

- **普通 remote servers。** 用户安装一个访问其 Notion / GitHub / Gmail 的 remote MCP server。带 PKCE 的 OAuth 2.1 是合适的形态。
- **Scope escalation。** 已授予 `notes:read` 的 notes server 后续可能因为某个具体 action 需要 `notes:write`。不用重新执行完整 flow，step-up (SEP-835) 会请求额外的 scope。
- **Confused deputy 防护。** Client 持有面向 Server A 的 token audience scope。Server A 是恶意的，并试图把该 token 提交给 Server B。Resource indicators (RFC 8707) 会将 token 固定到其预期 audience。

OAuth 2.1 并不新。新的部分是 MCP 的 profile：明确要求的 flows（仅 authorization code + PKCE；默认不允许 implicit，不允许 client credentials）、每次 token request 都必须带 resource indicators，以及发布 protected-resource metadata，让 clients 知道该去哪里。

## 概念
### Roles

- **Client。** MCP client（Claude Desktop、Cursor 等）。
- **Resource server。** MCP server（notes、GitHub、Postgres，或其他）。
- **Authorization server。** 签发 tokens。可以与 resource server 是同一个 service，也可以是单独的 IdP（Auth0、Keycloak、Cognito）。

在 MCP 的 profile 中，resource 和 authorization servers 可以是同一 host，但应该通过 URLs 区分。

### Authorization code + PKCE

Flow：

1. Client 生成 `code_verifier`（随机）和 `code_challenge`（SHA256）。
2. Client 将用户重定向到 `/authorize?response_type=code&client_id=...&redirect_uri=...&scope=notes:read&code_challenge=...&resource=https://notes.example.com`。
3. 用户 consent。Authorization server 重定向到 `redirect_uri?code=...`。
4. Client POST 到 `/token?grant_type=authorization_code&code=...&code_verifier=...&resource=...`。
5. Authorization server 根据已存储的 challenge 校验 verifier 的 hash，并签发 access token。
6. Client 使用该 token：在发往 resource server 的每个 request 上带 `Authorization: Bearer ...`。

PKCE 防止 authorization-code interception attacks。Resource indicators 防止 token 在其他地方有效。

### Protected-resource metadata (RFC 9728)

Resource server 发布 `.well-known/oauth-protected-resource` document：

```json
{
  "resource": "https://notes.example.com",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["notes:read", "notes:write", "notes:delete"]
}
```

Client 从 resource server 发现 authorization server。减少配置量 — client 只需要 resource URL。

### Resource indicators (RFC 8707)

Token request 中的 `resource` parameter 会固定 token 的预期 audience。签发的 token 包含 `aud: "https://notes.example.com"`。另一个 MCP server 收到该 token 时检查 `aud` 并拒绝它。

### Scope model

Scopes 是用空格分隔的字符串。常见 MCP conventions：

- `notes:read`, `notes:write`, `notes:delete`
- `admin:*` 用于 admin capabilities（谨慎使用）
- `profile:read` 用于 identity

Scope 选择应该遵循 least-privilege：现在只请求你需要的 scope，需要更多时再 step up。

### Step-up authorization (SEP-835)

用户授予 `notes:read`。之后他们要求 agent 删除一条 note。Server 返回：

```
HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer error="insufficient_scope",
    scope="notes:delete", resource="https://notes.example.com"
```

Client 看到 insufficient_scope error，弹出 consent dialog 请求用户授予额外 scope，为其执行一次 mini OAuth flow，然后用新 token 重试 request。

### Token audience validation

每个 request：server 检查 `token.aud == self.resource_url`。不匹配 = 401。这会阻止跨 server token reuse。

### 短生命周期 tokens 与轮换

Access tokens 应该是 short-lived（默认 1 小时）。Refresh tokens 在每次 refresh 时 rotation。Client 在后台处理 silent refresh。

### No token passthrough

Sampling servers（Phase 13 · 11）不得将 client 的 token 透传给其他 services。Sampling request 就是边界。

### Confused deputy 防护

Token 绑定到 `aud`。Client 绑定到 `client_id`。每个 request 都同时根据二者验证。Spec 明确禁止旧的 “pass-the-token” pattern，这种 pattern 在 pre-MCP remote tool ecosystems 中曾很常见。

### Client ID discovery

每个 MCP client 在固定 URL 发布自己的 metadata。Authorization servers 可以获取 client 的 metadata document，以发现 redirect URIs 和 contact info。这免去了手动 client registration。

### Gateways and OAuth

Phase 13 · 17 展示 enterprise gateway 如何处理 OAuth：gateway 持有 upstream servers 的 credentials，发给 client 的 tokens 由 gateway 签发，upstream tokens 永远不会离开 gateway。这会翻转 trust model — 用户只需向 gateway authentication 一次；gateway 处理 N 个 server authorizations。

## 使用它
`code/main.py` 将完整 OAuth 2.1 step-up flow 模拟为 state machine。它实现了：

- PKCE code-verifier / challenge 生成。
- 带 resource indicator 的 authorization code flow。
- Protected-resource metadata endpoint。
- 带 audience check 的 token validation。
- 在 `insufficient_scope` 上进行 step-up。

本课没有 HTTP server；state machine 在内存中运行，因此你可以追踪每一次跳转。Phase 13 · 17 的 gateway 课程会将它连接到实际 transport。

## 交付它
本课产出 `outputs/skill-oauth-scope-planner.md`。给定一个带 tools 的 remote MCP server，该 skill 会设计 scope set、pinning rules 和 step-up policy。

## 练习
1. 运行 `code/main.py`。追踪 two-scope step-up flow。注意 step-up 时哪些跳转会重复。

2. 添加 refresh-token rotation：每次 refresh 都签发新的 refresh token，并使旧 token 失效。模拟一个被盗 refresh token 在 rotation 后被使用，并确认它失败。

3. 使用 stdlib http.server 将 protected-resource metadata endpoint 实现为真实 HTTP response。参考 Lesson 09 中的 /mcp endpoint。

4. 为 GitHub MCP server 设计 scope hierarchy：read repo、write PR、approve PR、merge PR、admin。在每一层之间使用 step-up。

5. 阅读 RFC 8707 和 RFC 9728。找出 9728 中 MCP 与 RFC 示例用法不同的一个 field。（提示：它涉及 `scopes_supported`。）

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OAuth 2.1 | “Modern OAuth” | 统一后的 RFC，要求 PKCE 并禁止 implicit flow |
| PKCE | “Proof-of-possession” | Code verifier + challenge，用于阻止 authorization-code interception |
| Resource indicator | “Token audience” | RFC 8707 的 `resource` parameter，将 token 固定到一个 server |
| Protected-resource metadata | “Discovery doc” | RFC 9728 `.well-known/oauth-protected-resource` |
| Step-up authorization | “Incremental consent” | SEP-835 flow，用于按需增加 scopes |
| `insufficient_scope` | “403 with WWW-Authenticate” | Server 发出的信号，要求为更大的 scope 重新 consent |
| Confused deputy | “Token reuse across services” | 可信持有者不恰当地转发 token 的攻击 |
| Short-lived token | “Access token TTL” | 快速过期的 Bearer；refresh token 用于续期 |
| Scope hierarchy | “Least privilege stack” | 分层 scope set，各层之间通过 step-up 过渡 |
| Client ID metadata | “Client discovery doc” | Client 发布自身 OAuth metadata 的 URL |

## 延伸阅读
- [MCP — Authorization spec](https://modelcontextprotocol.io/specification/draft/basic/authorization) — 权威 MCP OAuth profile
- [den.dev — MCP November authorization spec](https://den.dev/blog/mcp-november-authorization-spec/) — 2025-11-25 变更详解
- [RFC 8707 — OAuth 2.0 的 Resource indicators](https://datatracker.ietf.org/doc/html/rfc8707) — audience-pinning RFC
- [RFC 9728 — OAuth 2.0 protected resource metadata](https://datatracker.ietf.org/doc/html/rfc9728) — discovery-document RFC
- [Aembit — MCP OAuth 2.1, PKCE and the future of AI authorization](https://aembit.io/blog/mcp-oauth-2-1-pkce-and-the-future-of-ai-authorization/) — 实用 step-up-flow walkthrough
