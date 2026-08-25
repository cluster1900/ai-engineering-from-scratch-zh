---
name: mcp-auth-wiring
description: 使用 issuer 绑定注册、CIMD、受保护资源元数据、JWKS 刷新、audience 固定和逐请求验证来设计 MCP 2026-07-28 授权。
version: 2.0.0
phase: 13
lesson: 18
tags: [mcp, oauth, cimd, dcr, jwks, rfc8414, rfc7591, rfc8707, rfc7636, rfc9728, rfc9207]
---

给定一个 MCP server 配置和一组 IdP 能力，生成构成生产级 MCP 授权层的授权接口和拒绝规则。

输入：

- `mcp_resource_url` — 规范资源 URL（最具体的标识符；仅当路径可区分共同托管的 server 时才保留路径），用作 `aud` 和受保护资源元数据的 `resource` 值。
- `idp_metadata_url` — IdP 的 `/.well-known/oauth-authorization-server`（或 OpenID Connect Discovery）URL。
- `idp_capabilities`：观测到的 `issuer`、`code_challenge_methods_supported`、`grant_types_supported`、`client_id_metadata_document_supported`、已弃用的 `registration_endpoint`、`response_types_supported` 和 `authorization_response_iss_parameter_supported` 值。
- `pre_registered_client_ids`：由 authorization server 运营方预配置的可选 issuer 到 client ID 映射。应优先使用这种限定于 issuer 的身份，然后使用 CIMD，最后才将已弃用的 DCR 作为兼容路径。
- `application_type`：`native` 或 `web`，选择已弃用的 DCR 兼容方案时必填。
- `credential_store`：以 authorization server issuer 为 key 存储的 client ID 和注册凭据，以及以 `(issuer, mcp_resource_url)` 为 key 存储的 access token。
- `tools`：MCP Tool 列表，以及每个 Tool 所需的 scope。

生成：

1. **拒绝门禁。** 如果任何硬性条件不满足，拒绝接线并停止：
   - `code_challenge_methods_supported` 中缺少 `S256`（PKCE 不存在降级模式）。
   - `grant_types_supported` 中缺少 `authorization_code`。
   - `response_types_supported` 不是严格等于 `["code"]`。
   - 不存在任何注册路径：预注册的 `client_id`、`client_id_metadata_document_supported: true` 和已弃用的 DCR 兼容 endpoint 均不可用。
   - 已选择 CIMD，但其 `client_id` 不是带路径的绝对 HTTPS 文档 URL、与文档 URL 不匹配，或文档缺少非空的 `client_name` 或 `redirect_uris` 数组。对于 CIMD，`application_type` 是可选的。
   - 返回的 RFC 9207 `iss` 与重定向前记录的 issuer 不同，或 server 已声明支持它却没有返回。
   - 已弃用的 DCR 缺少 `application_type`，或其 redirect URI 策略与 `native` 或 `web` 冲突。

2. MCP server 的**受保护资源元数据文档**（RFC 9728）。对于带路径的资源，将 well-known 段插入该路径之前：`https://host/team/mcp` 映射为 `https://host/.well-known/oauth-protected-resource/team/mcp`。包含 `resource`、`authorization_servers`（issuer allow-list）、`scopes_supported` 和 `bearer_methods_supported: ["header"]`。

3. **HTTP endpoints。**
   - `GET /.well-known/oauth-protected-resource` — 返回第（2）项中的文档。
   - `POST /mcp`（无状态 MCP transport）：在分派任何 Tool 前，验证本次请求的 bearer token。
   - 仅用于 DCR 兼容：`POST /register`，并在其之前执行 application type 检查和 rate limit 检查。

4. **后台任务与例程。**
   - 定时 JWKS 刷新任务，将 `jwks_uri` 重新获取到缓存 `{keys, fetched_at}` 中。具有幂等性；绝不生成 key。AS 负责轮换；resource server 只负责刷新。默认为 `0 */6 * * *`；对于高频轮换的 IdP，收紧为 `*/15 * * * *`。
   - `validate` 例程 — 检查 `iss` allow-list、针对缓存 JWKS 验证签名、`aud == mcp_resource_url`、`exp` 和所需 scope。
   - step-up 签发路径 — 仅当 Tool 列表包含由用户最初未授予的 scope 所限制的操作时启用。

5. **缓存方案。** 每个被接受的 issuer 对应一个以 `issuer` 为 key 的条目，保存 `{keys, fetched_at}`。记录读取模式：validator 读取缓存，并在 `kid` 未命中时回退到一次同步刷新（重新获取，而非轮换——重新获取具有幂等性，无法被转化为创建 key 的 DoS）。

6. **Scope 映射。** 将每个 Tool 映射到其所需的 scope。输出表格：
   `| tool | required_scope | rationale |`。将破坏性 Tool 归入其专属 scope；绝不要为写入 Tool 复用读取 scope。

7. **运行时拒绝规则**（validator 必须编码这些规则）：
   - 当 `aud != mcp_resource_url` 时拒绝 → 401 `Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="<prm_url>"`。
   - 当 `iss not in authorization_servers` 时拒绝。
   - 单次重新获取回退后，如果 `kid` 仍不在缓存的 JWKS 中，则拒绝。
   - 缺少所需 scope 时拒绝 → 403 `Bearer error="insufficient_scope", scope="<required>", resource_metadata="<prm_url>"`。
   - 拒绝任何没有 S256 `code_challenge` 的授权请求，并拒绝任何 `code_verifier`、client、redirect URI 或 `resource` 与一次性 authorization code 记录不匹配的 token 请求。
   - 拒绝 issuer 与其 credential store key 不匹配的任何凭据或 token。issuer 变更需要重新注册。

硬性拒绝项（绝不为以下情况接线——拒绝请求并记录原因）：

- 以明文存储 `client_secret`。公共 client 使用 `token_endpoint_auth_method: none`；机密 client 使用 `private_key_jwt`。静态存储或注册响应日志中不得出现明文共享 secret。
- 在 validator 中跳过 `aud` 检查。Audience 绑定（access token 权限限制）正是 RFC 8707 + RFC 9728 的核心意义。
- 将 JWKS 缓存未命中回退接到轮换并生成 key 的操作，而不是重新获取。这样做永远无法生成缺失的 `kid`，还会让由攻击者控制的 `kid` 值强制触发无限制的 key 创建。回退必须是幂等刷新。
- 允许不使用 PKCE 的 authorization code 请求。OAuth 2.1 禁止这样做；validator 必须拒绝存储的 authorization code 记录中缺少 `code_challenge` 的任何 `/token` 交换。
- 缓存 JWKS 却没有刷新任务。必须随系统交付定时刷新，否则不得部署授权接口。
- 在没有 allow-list 的情况下信任 `iss` claim。任何接受任意 `iss` 所签发 token 的 validator，都会允许攻击者搭建自己的 IdP 并伪造 token。
- 将传入的 MCP token 转发给上游 API（token 透传）。如果 MCP server 调用上游 API，则必须获取自己独立的 token；透传会产生 confused-deputy 问题。
- 以明文存储 `registration_access_token`。静态存储时使用哈希；每次更新时都要求提供明文。
- 将 MCP 请求元数据或已移除的协议 session 当作授权状态。2026-07-28 transport 是无状态的；必须对每个请求进行身份验证和授权。

输出：一页方案，其中包含受保护资源文档、以 issuer 为 key 的注册布局、以 issuer 和 resource 为 key 的 token 布局、选定的注册路径、HTTP endpoints、JWKS 刷新任务、scope 映射以及运行时拒绝规则。最后列出在 authorization server 实际元数据中发现的第一个未满足部署门禁。
