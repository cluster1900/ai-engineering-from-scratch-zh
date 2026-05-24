# 生产环境中的 MCP Auth — 基于 iii Primitives 的 DCR、JWKS Rotation、Audience 绑定 Token

> 第 16 课在内存中搭建了 OAuth 2.1 状态机。到 2026 年，你交付给真实组织的每个 MCP server 都位于生产级 auth 之后：dynamic client registration（RFC 7591）、authorization-server metadata discovery（RFC 8414）、不会破坏凌晨 3 点 Token validation 的 JWKS rotation，以及拒绝 confused-deputy 复用的 audience 绑定 Token。本课会把所有这些都接入 iii primitives：用 `iii.registerTrigger` 处理 HTTP 和 cron，用 `iii.registerFunction` 承载 auth 逻辑，用 `state::set/get` 缓存 keys，让 auth surface 像引擎中的其他 workload 一样可观测、可重启、可重放。

**Type:** Build
**语言:** Python (stdlib，iii primitives 为课程环境 mock)
**先修要求：** Phase 13 · 16 (OAuth 2.1 state machine), Phase 13 · 17 (gateways)
**Time:** ~90 分钟

## 学习目标
- 通过 RFC 8414 metadata 发现 authorization server，并验证其契约。
- 实现 RFC 7591 dynamic client registration，让 MCP clients 无需管理员介入即可注册。
- 使用 cron trigger 缓存并轮换 JWKS keys，让 signature verification 在 key roll-over 后仍能正常工作。
- 使用 RFC 8707 resource indicators 将 Token 绑定到单个 MCP resource，并拒绝 confused-deputy 复用。
- 将每个 endpoint 和 background job 都接为 iii primitives：HTTP triggers、cron triggers、named functions，以及 `state::*` reads，让一次重启即可重建 auth surface。
- 阅读 IdP capability matrix，并在 IdP 无法满足 MCP auth profile 时拒绝部署。

## 问题
第 16 课的 simulator 在内存中运行 OAuth 2.1。生产环境有三个仅靠内存 simulator 看不到的运维缺口。

第一个缺口是注册。真实组织会运行数百个 MCP servers 和数千个 MCP clients。运维人员不会把每个 Cursor 用户都手动注册为 OAuth client。RFC 7591 dynamic client registration 允许 client 向 authorization server `POST /register`，并当场获得 `client_id`（以及可选的 `client_secret`）。server 会在其 RFC 8414 metadata 中发布 `registration_endpoint`；client 无需带外配置即可发现它。

第二个缺口是 key rotation。JWT validation 依赖 authorization server 的 signing keys，这些 keys 以 JSON Web Key Set（JWKS）形式发布。authorization server 会按计划轮换这些 keys（通常每小时一次，在 incident response 下有时更快）。如果 MCP server 只在启动时获取一次 JWKS，那么在轮换窗口到来之前都能正常验证，一旦轮换发生，所有请求都会失败，直到重启。生产环境会将 JWKS 接为带缓存的值，并用 refresh job 在旧 keys 过期之前覆盖缓存；另外还要在 cache miss 时执行 fall-back fetch，以处理使用比缓存更新的 key 签名的 Token 到达的情况。

第三个缺口是 audience binding。第 16 课介绍了 RFC 8707 resource indicators。在生产环境中，该 indicator 会成为每个请求上的强制 claim check。MCP server 会将 `token.aud` 与自己的 canonical resource URL 比较，并用 HTTP 401 拒绝不匹配项。这是防止上游 MCP server（或持有某个 server 专用 Token 的恶意 client）在同一 trust mesh 中把该 Token 重放到另一 server 的唯一防线。

本课把这些缺口中的每一个都视为 iii primitive。metadata document 是一个 HTTP trigger，返回某个 function 的输出。JWKS rotation 是一个 cron trigger，调用 `auth::rotate-jwks`，该 function 写入 `state::set("auth/jwks/<issuer>", ...)`。JWT validation 是其他组件通过 `iii.trigger("auth::validate-jwt", token)` 调用的 function。MCP server 本身只是另一个 HTTP trigger，在 dispatch 前调用 validation。重启引擎：trigger registry 会重建；state 会保留；auth surface 无需手动协调即可运行。

## 概念
### RFC 8414 — OAuth Authorization Server Metadata

位于 `/.well-known/oauth-authorization-server` 的 document 描述了 client 所需的一切：

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

获得 MCP resource URL 的 client 会进行链式发现：RFC 9728 中的 `oauth-protected-resource`（resource server 的 document）会指明 issuer，然后 `oauth-authorization-server`（本 RFC）会列出每个 endpoint。client 永远不会硬编码 authorization URL。

在信任某个 IdP 用于 MCP 之前，需要验证的契约：

- `code_challenge_methods_supported` 包含 `S256`（PKCE per RFC 7636）。
- `grant_types_supported` 包含 `authorization_code`，并拒绝 `password` 和 `implicit`。
- 存在 `registration_endpoint`（支持 RFC 7591）。
- 对于 OAuth 2.1，`response_types_supported` 必须正好是 `["code"]`。

如果缺少其中任意一项，MCP server 会拒绝针对该 IdP 部署。错误在 deployment manifest，而不在代码。

### RFC 9728（回顾）— Protected Resource Metadata

第 16 课已经讲过 RFC 9728。生产环境中的差异是：这个 document 是 client 查找被*这个* MCP server 信任的 authorization servers 的唯一位置。单个 MCP server 可以接受来自多个 IdPs 的 Token（一个用于员工，一个用于合作伙伴）。RFC 9728 声明这个集合；RFC 8414 说明每个 IdP 支持什么。

```json
{
  "resource": "https://notes.example.com",
  "authorization_servers": ["https://auth.example.com", "https://partners.example.com"],
  "scopes_supported": ["mcp:tools.invoke"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://notes.example.com/docs"
}
```

### RFC 7591 — Dynamic Client Registration

如果没有 DCR，每个 MCP client（Cursor、Claude Desktop、自定义 agent）都需要与 IdP 管理员进行带外交换。有了 DCR，client 会提交：

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

server 会响应 `client_id` 和用于后续更新的 `registration_access_token`：

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

`token_endpoint_auth_method: none` 是运行在用户设备上的 MCP clients 的正确默认值。它们只获得 `client_id`，没有可被外泄的 `client_secret`。PKCE 提供 public clients 所需的 proof-of-possession。

三个生产环境陷阱：

- registration endpoint 必须按 source IP 做 rate-limit。否则，恶意行为者可以编写脚本创建数百万个假注册并耗尽 `client_id` namespace。iii 让这件事很简单：registration HTTP trigger 在 dispatch 到 registrar 之前调用 `auth::rate-limit` function。
- 某些企业 IdPs 要求 `software_statement`（一个为 client 背书的 signed JWT）。本课的 mock 会跳过它；生产环境会接入一个 verification step，拒绝除 localhost redirect URIs 之外的任何 unsigned registrations。
- `registration_access_token` 必须以 hash 形式存储，而不是 plaintext。该 Token 被盗意味着攻击者可以重写 client 的 redirect URIs。

### RFC 8707（回顾）— Resource Indicators

第 16 课已经建立了其形态。生产规则是：每个 Token request 都包含 `resource=<canonical-mcp-url>`，并且 MCP server 在每次调用时验证 `token.aud` 与自己的 resource URL 匹配。如果 MCP server 可通过 `https://notes.example.com/mcp` 访问，则 canonical URL 是 `https://notes.example.com`，排除 path component，这样单个 server 可以在同一 audience 下托管多个 paths。

### RFC 7636（回顾）— PKCE

PKCE 在 OAuth 2.1 中是强制的。本课的 authorization-code flow 始终携带 `code_challenge` 和 `code_verifier`。server 会拒绝任何没有 verifier，或 verifier 无法 hash 到已存储 challenge 的 Token request。

### MCP Spec 2025-11-25 Auth Profile

MCP spec（2025-11-25）对 MCP server 的 authorization layer 必须执行的事项规定得很精确：

- 发布 `/.well-known/oauth-protected-resource`（RFC 9728）。
- 仅通过 `Authorization: Bearer ...` 接受 Token。
- 按请求验证 `aud`、`iss`、`exp` 和 required scopes。
- 对每个 401 和 403 返回携带 `Bearer error=...` 的 `WWW-Authenticate`，并在适用时包含 `scope=` 和 `resource=` 参数。
- 拒绝 `aud` 与 canonical resource 不匹配的 Token。
- 拒绝 `iss` 不在 protected-resource metadata 的 `authorization_servers` 列表中的 Token。

OAuth 2.1 draft 是底层基底；RFC 8414/7591/8707/9728 + RFC 7636 是表层接口；MCP spec 是 profile。

### IdP capability matrix

并非每个 IdP 都支持完整的 MCP profile。下表记录截至 2025-11-25 spec 的事实性 capability statements。它是一个*部署门禁*，不是推荐。

| IdP category | RFC 8414 metadata | RFC 7591 DCR | RFC 8707 resource | RFC 7636 S256 PKCE | Notes |
|---|---|---|---|---|---|
| Self-hosted (Keycloak) | yes | yes | yes (since 24.x) | yes | 本课中 MCP profile 的参考 IdP；端到端支持每个 RFC。 |
| Enterprise SSO (Microsoft Entra ID) | yes | yes (premium tiers) | yes | yes | DCR 可用性因 tenant tier 而异；部署前要在目标 tenant 中验证。 |
| Enterprise SSO (Okta) | yes | yes (Okta CIC / Auth0) | yes | yes | DCR 在 Auth0（现 Okta CIC）上可用；classic Okta orgs 需要管理员预注册。 |
| Social login IdPs (generic) | varies | rarely | rarely | yes | 大多数 social IdPs 将 clients 视为静态 partners；不要依赖 DCR。仅将其用作 identity source，并在其上层叠加你自己的 MCP-aware authorization server。 |
| Custom / homegrown | depends | depends | depends | depends | 如果你交付自己的实现，就交付完整 profile。跳过上述四个 RFC 中的任何一个，都会破坏 MCP auth contract。 |

deployment manifest 的拒绝规则：如果所选 IdP 没有返回 `registration_endpoint`，且没有在 `code_challenge_methods_supported` 中列出 `S256`，MCP server 会拒绝启动。不存在 degraded mode。

### 使用 iii 的 JWKS rotation pattern

生产故障模式是过期的 JWKS cache。用 cron trigger 和 `state::*` cache 解决它：

```python
iii.registerTrigger(
    "cron",
    {"schedule": "0 */6 * * *", "name": "auth::jwks-refresh"},
    "auth::rotate-jwks",
)
```

每六小时，cron trigger 会调用 `auth::rotate-jwks`，后者获取 `<issuer>/.well-known/jwks.json`，并写入 `state::set("auth/jwks/<issuer>", {keys, fetched_at})`。validator 从 `state::get` 读取。如果某个 Token 的 `kid` 在缓存中不存在，会触发一次同步的 `auth::rotate-jwks` 调用作为 fall-back。这样可以同时处理两种情况：scheduled rotation（cron）和 key-overlap windows（同步 fall-back）。

state 形态：

```json
{
  "auth/jwks/https://auth.example.com": {
    "keys": [
      {"kid": "k_2026_03", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"},
      {"kid": "k_2026_04", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"}
    ],
    "fetched_at": 1772668800
  }
}
```

同时存在两个 keys 是稳定状态。Authorization servers 会先引入下一个 key（`k_2026_04`），再停用前一个 key（`k_2026_03`），因此在旧 key 下签发的 Token 在过期前仍然有效。cache 持有并集；validator 按 `kid` 选择。

### iii primitive wiring（本课真正关注的部分）

五个 primitives 组合出 auth surface：

```python
# 1. RFC 8414 metadata document
iii.registerTrigger(
    "http",
    {"path": "/.well-known/oauth-authorization-server", "method": "GET"},
    "auth::serve-asm",
)

# 2. RFC 7591 dynamic client registration
iii.registerTrigger(
    "http",
    {"path": "/register", "method": "POST"},
    "auth::register-client",
)

# 3. JWT validation as a callable function (the resource server triggers it)
iii.registerFunction("auth::validate-jwt", validate_jwt_handler)

# 4. Step-up issuance for incremental scope (SEP-835 from L16)
iii.registerFunction("auth::issue-step-up", issue_step_up_handler)

# 5. Cron-driven JWKS rotation
iii.registerTrigger(
    "cron",
    {"schedule": "0 */6 * * *"},
    "auth::rotate-jwks",
)
iii.registerFunction("auth::rotate-jwks", rotate_jwks_handler)
```

MCP server 本身永远不直接调用 validation。它会这样做：

```python
result = iii.trigger("auth::validate-jwt", {"token": bearer_token, "resource": self.resource})
if not result["valid"]:
    return {"status": 401, "WWW-Authenticate": result["www_authenticate"]}
```

这一层间接调用就是 iii 的下注点。明天你可以把 validator 替换为并行咨询两个 IdPs 的 fanout，或者添加 span emitter，或者缓存 positive validations。MCP server 不需要改变。

### 使用 audience binding 的 confused-deputy walkthrough

Server A（`notes.example.com`）和 Server B（`tasks.example.com`）都注册到同一个 authorization server。Server A 被攻陷。攻击者拿到用户的 notes Token，并将其重放到 Server B。

Server B 的 validator：

1. Decode JWT，按 `kid` 获取 JWKS，验证 signature。
2. 根据其 protected-resource metadata 的 `authorization_servers` 检查 `iss`。（通过 — 同一个 IdP。）
3. 检查 `aud == "https://tasks.example.com"`。（失败 — Token 的 `aud` 是 `https://notes.example.com`。）
4. 返回 401，并带上 `WWW-Authenticate: Bearer error="invalid_token", error_description="audience mismatch"`。

audience claim 是 protocol layer 中抵御该攻击的唯一防线。为了性能而跳过它是最常见的生产错误；validator 必须在每个请求上运行，而不只是 session start 时运行。

### Failure modes

- **Stale JWKS.** validator 会在 key rotation 后拒绝有效 Token。修复方式是上面的 cron+fall-back pattern。绝不要在没有 refresh job 的情况下缓存 JWKS。
- **缺少 `aud` claim。** 某些 IdPs 默认会省略 `aud`，除非 Token request 中存在 `resource`。validator 必须拒绝缺少 `aud` 的 Token，而不是把 absence 视为 wildcard。
- **Scope upgrade race.** 同一用户的两个并发 step-up flows 可能都会成功，并产生两个 scope 不同的 access tokens。validator 必须使用请求中呈现的 Token，而不是查找“用户当前的 scope”，否则会产生 TOCTOU window。
- **Registration token theft.** 泄露的 `registration_access_token` 会让攻击者重写 redirect URIs。在静态存储时对其做 hash；要求 client 在每次更新时呈现 cleartext；一旦怀疑泄露就轮换。
- **`iss` 未绑定。** 接受任意 `iss` 的 validator 会让攻击者搭建自己的 authorization server，为目标 audience 注册 client 并签发 Token。protected-resource metadata 的 `authorization_servers` 列表就是 allow-list；必须强制执行。

## 使用它
`code/main.py` 使用 stdlib Python 和一个小型 `iii_mock` registry 演示完整生产流程，该 registry 模拟 `iii.registerFunction`、`iii.registerTrigger`、`iii.trigger` 和 `state::set/get`。流程如下：

1. Authorization server 在 `/.well-known/oauth-authorization-server` 发布 RFC 8414 metadata。
2. MCP client 调用 metadata endpoint，发现 registration endpoint。
3. MCP client 向 `/register`（RFC 7591）提交并收到 `client_id`。
4. MCP client 使用带 PKCE 保护的 authorization code flow（RFC 7636），并携带 `resource` indicator（RFC 8707）。
5. MCP client 使用 `Authorization: Bearer ...` 调用 MCP server 上的 tool。
6. MCP server 触发 `auth::validate-jwt`，后者从 `state::get` 读取 JWKS。
7. cron trigger 触发 `auth::rotate-jwks`，替换 state 中的 JWKS。
8. 下一次调用无需重启即可基于新 keys 进行验证。
9. 针对不同 MCP resource 的 confused-deputy 尝试会因为 audience mismatch 收到 401。

这里的 mock JWT 使用带 shared secret 的 HS256（这样本课只依赖 stdlib 就能运行）。生产环境使用 RS256 或 EdDSA，并采用上面的 JWKS pattern；validation 逻辑除此之外完全相同。

## 交付它
本课会产出 `outputs/skill-mcp-auth-iii.md`。给定 MCP server config 和 IdP capability set，该 skill 会输出要注册的 iii primitives、JWKS rotation schedule、scope mapping，以及当 IdP 不支持完整 RFC profile 时要应用的 refusal rules。

## 练习
1. 运行 `code/main.py`。追踪 9 步流程。注意在 `auth::rotate-jwks` 覆盖它之前，`state::get` 在哪里返回了 stale data，以及下一次请求如何开始用新 key 验证。

2. 向 protected-resource metadata 的 `authorization_servers` 列表添加一个新的 IdP。签发一个由新 IdP 签名的 Token，并确认 validator 接受它。签发一个由未列出的 IdP 签名的 Token，并确认 validator 使用 `WWW-Authenticate: Bearer error="invalid_token", error_description="iss not allowed"` 拒绝它。

3. 将 `auth::rate-limit` 实现为 iii function，并在 registrar 运行之前从 registration HTTP trigger 内部调用它。使用保存在 `state::set("auth/ratelimit/<ip>", ...)` 中、按 source IP 区分的 token-bucket。

4. 阅读 RFC 7591，找出本课的 `/register` handler 没有验证的两个字段。添加验证。（提示：`software_statement` 和 `redirect_uris` URI scheme。）

5. 阅读 MCP spec 2025-11-25 authorization section。找出本课的 validator 当前没有发出的、关于 `WWW-Authenticate` headers 的一个 normative requirement。添加它。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ASM | “OAuth metadata document” | RFC 8414 `/.well-known/oauth-authorization-server` JSON |
| DCR | “Self-service client registration” | RFC 7591 `POST /register` flow |
| JWKS | “Public keys for JWT validation” | JSON Web Key Set，从 `jwks_uri` 获取，并按 `kid` 索引 |
| Resource indicator | “Audience parameter” | RFC 8707 `resource` parameter，将 Token 绑定到一个 server |
| `aud` claim | “Audience” | validator 与 canonical resource URL 比较的 JWT claim |
| Confused deputy | “Token replay” | 将为 Server A 签发的 Token 呈现给 Server B 的攻击 |
| `iss` allow-list | “Trusted authorization servers” | protected-resource metadata 的 `authorization_servers` 中命名的集合 |
| Key rotation | “Rolling JWKS” | 带 overlap windows 的 signing keys 定期替换 |
| Public client | “Native or browser client” | 没有 `client_secret` 的 OAuth client；由 PKCE 补偿 |
| `WWW-Authenticate` | “401/403 response header” | 携带驱动 client recovery 的 `Bearer error=...` directives |

## 延伸阅读
- [MCP — Authorization spec (2025-11-25)](https://modelcontextprotocol.io/specification/draft/basic/authorization) — 本课实现的 MCP auth profile
- [RFC 8414 — OAuth 2.0 Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414) — discovery contract
- [RFC 7591 — OAuth 2.0 Dynamic Client Registration Protocol](https://datatracker.ietf.org/doc/html/rfc7591) — DCR
- [RFC 7636 — Proof Key for Code Exchange (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636) — public-client proof-of-possession
- [RFC 8707 — OAuth 2.0 的 Resource Indicators](https://datatracker.ietf.org/doc/html/rfc8707) — audience pinning
- [RFC 9728 — OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728) — resource server discovery
- [OAuth 2.1 draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1) — 统一后的 OAuth substrate
