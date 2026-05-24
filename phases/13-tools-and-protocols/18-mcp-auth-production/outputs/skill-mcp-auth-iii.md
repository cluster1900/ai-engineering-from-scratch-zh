---
name: mcp-auth-iii-wiring
description: 将生产级 MCP authorization（RFC 8414, 7591, 8707, 7636 PKCE, 9728）接入 iii primitives — registerTrigger 用于 HTTP/cron，registerFunction 用于 validation，state::* 用于 JWKS cache。
version: 1.0.0
phase: 13
lesson: 18
tags: [mcp, oauth, dcr, jwks, iii, rfc8414, rfc7591, rfc8707, rfc7636, rfc9728]
---

给定一个 MCP server config 和一个 IdP capability set，输出构成 production auth surface 的 iii primitives 和 refusal rules。

Inputs:

- `mcp_resource_url` — canonical resource URL（无 path），用作 `aud`，也用作 protected-resource metadata 的 `resource` value。
- `idp_metadata_url` — IdP 的 `/.well-known/oauth-authorization-server` URL。
- `idp_capabilities` — `code_challenge_methods_supported`、`grant_types_supported`、`registration_endpoint`、`response_types_supported` 的 observed values。
- `tools` — MCP tool list，包含每个 tool 所需的 scope。

生成：

1. **Refusal gate.** 如果以下四个条件中任一失败，拒绝 wiring 并停止：
   - `S256` 缺失于 `code_challenge_methods_supported`。
   - `authorization_code` 缺失于 `grant_types_supported`。
   - `registration_endpoint` 不存在（无 RFC 7591 DCR）。
   - `response_types_supported` 不是严格等于 `["code"]`。

2. **Protected-resource metadata document**（RFC 9728），供 MCP server 发布在 `/.well-known/oauth-protected-resource`。包含 `resource`、`authorization_servers`（issuer allow-list）、`scopes_supported`、`bearer_methods_supported: ["header"]`。

3. **iii trigger registrations.** 逐字输出每个调用：
   - `iii.registerTrigger("http", {"path": "/.well-known/oauth-protected-resource", "method": "GET"}, "auth::serve-protected-resource")`
   - `iii.registerTrigger("http", {"path": "/mcp", "method": "POST"}, "mcp::dispatch")` — dispatcher 在任何 tool 运行前调用 `iii.trigger("auth::validate-jwt", ...)`。
   - `iii.registerTrigger("cron", {"schedule": "<rotation_schedule>"}, "auth::rotate-jwks")` — schedule 默认是 `0 */6 * * *`；对于 high-rotation IdPs 收紧为 `*/15 * * * *`。

4. **iii function registrations.** 逐字输出每个调用：
   - `iii.registerFunction("auth::validate-jwt", handler)` — 检查 `iss` allow-list、针对 cached JWKS 的 signature、`aud == mcp_resource_url`、`exp`、required scope。
   - `iii.registerFunction("auth::rotate-jwks", handler)` — 获取 `jwks_uri`，写入 `state::set("auth/jwks/<iss>", {keys, fetched_at})`。
   - `iii.registerFunction("auth::serve-protected-resource", handler)` — 返回来自 (2) 的 document。
   - `iii.registerFunction("auth::issue-step-up", handler)` — 仅当 tool list 包含受某个用户初始未授予 scope 保护的 operations 时使用。

5. **State key plan.** 每个 accepted issuer 一个 key：`auth/jwks/<issuer>`，持有 `{keys, fetched_at}`。记录 read pattern：validator 从 `state::get` 读取，在 `kid` miss 时 fallback 到一次同步 `iii.trigger("auth::rotate-jwks", ...)`。

6. **Scope mapping.** 将每个 tool 映射到其所需 scope。输出表格：
   `| tool | required_scope | rationale |`。将 destructive tools 归入其自己的 scope；绝不要为 write tool 复用 read scope。

7. **Refusal rules at runtime**（validator 必须编码这些规则 — 在 handler body 中输出它们）：
   - 当 `aud != mcp_resource_url` 时拒绝。
   - 当 `iss not in authorization_servers` 时拒绝。
   - 当 `kid` 在一次 rotation fall-back 后仍不在 cached JWKS 中时拒绝。
   - 当 required scope 缺失时拒绝 → 403 `Bearer error="insufficient_scope", scope="<required>", resource="<mcp_resource_url>"`。
   - 拒绝任何没有 `code_verifier` 或 `resource` parameter 的 Token request。

Hard rejects（绝不要 wire 以下任何一项 — 拒绝请求并说明原因）：

- 在 iii state store 中以 plaintext 存储 `client_secret`。Public clients 使用 `token_endpoint_auth_method: none`；confidential clients 使用 `private_key_jwt`。`state::*` 或 registration response logs 中不得有 plaintext shared secrets。
- 在 validator 上跳过 `aud` check。Confused-deputy 正是 RFC 8707 + RFC 9728 的全部原因。
- 允许无 PKCE 的 authorization code requests。OAuth 2.1 禁止这种做法；validator 必须拒绝任何其 stored authorization-code record 缺少 `code_challenge` 的 `/token` exchange。
- 缓存 JWKS 但没有 refresh job。要么交付 cron trigger，要么 auth surface 不部署。
- 信任 `iss` claim 但没有 allow-list。任何接受任意 `iss` 的 validator 都会让攻击者架设自己的 IdP 并伪造 Tokens。
- 以 plaintext 存储 `registration_access_token`。Hash-at-rest；每次 update 都要求 cleartext。

Output: 一页 wiring plan，包含 protected-resource document、三个 `registerTrigger` 调用、四个 `registerFunction` 调用、state key plan、scope mapping table，以及已编码的 runtime refusal rules。最后给出最可能在所选 IdP 上出现的单个 deployment-blocking gap — 通常是 enterprise SSO 的 DCR availability。
