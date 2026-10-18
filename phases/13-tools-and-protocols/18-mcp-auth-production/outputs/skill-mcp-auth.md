---
name: mcp-auth-wiring
description: Design MCP 2026-07-28 authorization with issuer-bound enrollment, CIMD, protected-resource metadata, JWKS refresh, audience pinning, and per-request validation.
version: 2.0.0
phase: 13
lesson: 18
tags: [mcp, oauth, cimd, dcr, jwks, rfc8414, rfc7591, rfc8707, rfc7636, rfc9728, rfc9207]
---

根据 MCP 服务器配置和身份提供商（IdP）的能力集合，给出构成生产级 MCP 授权层的认证接口及拒绝规则。

输入：

- `mcp_resource_url`：规范资源 URL（使用最具体的标识符；仅当路径用于区分同一主机上的服务器时才保留路径），用作 `aud` 和受保护资源元数据的 `resource` 值。
- `idp_metadata_url`：IdP 的 `/.well-known/oauth-authorization-server`（或 OpenID Connect Discovery）URL。
- `idp_capabilities`：实际观测到的 `issuer`、`code_challenge_methods_supported`、`grant_types_supported`、`client_id_metadata_document_supported`、已弃用的 `registration_endpoint`、`response_types_supported` 和 `authorization_response_iss_parameter_supported` 值。
- `pre_registered_client_ids`：可选的签发者到客户端 ID 映射，由授权服务器运维方提供。优先使用这种按签发者划分的身份，其次选择 CIMD，最后才以已弃用的 DCR 作为兼容路线。
- `application_type`：`native` 或 `web`；选择已弃用的 DCR 兼容路线时必填。
- `credential_store`：以授权服务器签发者为键保存客户端 ID 和注册凭据，以 `(issuer, mcp_resource_url)` 为键保存访问令牌。
- `tools`：MCP 工具列表及每个工具所需的权限范围。

交付内容：

1. **拒绝门禁。** 任一硬性条件不满足时，拒绝接入并停止：
   - `code_challenge_methods_supported` 中缺少 `S256`（PKCE 不允许降级）。
   - `grant_types_supported` 中缺少 `authorization_code`。
   - `response_types_supported` 不严格等于 `["code"]`。
   - 没有可用的注册路线：既无预注册 `client_id`，也无 `client_id_metadata_document_supported: true`，亦无已弃用的 DCR 兼容端点。
   - 选择 CIMD，但 `client_id` 不是带路径的绝对 HTTPS 文档 URL、与文档 URL 不一致，或文档缺少非空的 `client_name` 或 `redirect_uris` 数组。CIMD 的 `application_type` 可选。
   - 返回的 RFC 9207 `iss` 与重定向前记录的签发者不同，或服务器声明支持却未返回该参数。
   - 已弃用的 DCR 缺少 `application_type`，或其重定向 URI 策略与 `native` 或 `web` 冲突。

2. MCP 服务器的**受保护资源元数据文档**（RFC 9728）。对于带路径的资源，在路径之前插入 well-known 段：`https://host/team/mcp` 映射到 `https://host/.well-known/oauth-protected-resource/team/mcp`。包含 `resource`、`authorization_servers`（签发者允许列表）、`scopes_supported` 和 `bearer_methods_supported: ["header"]`。

3. **HTTP 端点。**
   - `GET /.well-known/oauth-protected-resource`：返回第 (2) 项文档。
   - `POST /mcp`（无状态 MCP 传输）：在分派任何工具之前，验证当前请求的持有者令牌。
   - 仅用于 DCR 兼容：`POST /register`，在调用前进行应用类型检查和限流检查。

4. **后台任务与例程。**
   - 定期刷新 JWKS，将 `jwks_uri` 重新获取到缓存 `{keys, fetched_at}`。操作必须幂等，绝不生成密钥。密钥由授权服务器轮换；资源服务器只负责刷新。默认计划为 `0 */6 * * *`；对于高频轮换的 IdP，缩短为 `*/15 * * * *`。
   - `validate` 例程：检查 `iss` 允许列表、基于缓存 JWKS 的签名、`aud == mcp_resource_url`、`exp` 和必需权限范围。
   - 增权签发路线：仅当工具列表包含受用户初始未授予的权限范围保护的操作时需要。

5. **缓存方案。** 每个接受的签发者占一条记录，以 `issuer` 为键，保存 `{keys, fetched_at}`。说明读取方式：验证器读取缓存，遇到 `kid` 未命中时回退到一次同步刷新（重新获取，而非轮换；重新获取具有幂等性，不能被利用为密钥创建型拒绝服务攻击）。

6. **权限范围映射。** 将每个工具映射到所需权限范围。输出表格：
   `| tool | required_scope | rationale |`。为破坏性工具划分独立权限范围；写入工具绝不能复用读取权限范围。

7. **运行时拒绝规则**（必须编码到验证器中）：
   - 当 `aud != mcp_resource_url` 时拒绝 → 401 `Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="<prm_url>"`。
   - 当 `iss not in authorization_servers` 时拒绝。
   - 单次重新获取回退后，缓存 JWKS 中仍没有 `kid` 时拒绝。
   - 缺少必需权限范围时拒绝 → 403 `Bearer error="insufficient_scope", scope="<required>", resource_metadata="<prm_url>"`。
   - 拒绝没有 S256 `code_challenge` 的授权请求；若令牌请求的 `code_verifier`、客户端、重定向 URI 或 `resource` 与一次性授权码记录不匹配，同样拒绝。
   - 拒绝签发者与凭据存储键不匹配的凭据或令牌。签发者变更要求重新注册。

必须否决（绝不接入以下设计；拒绝请求并记录原因）：

- 以明文存储 `client_secret`。公开客户端使用 `token_endpoint_auth_method: none`；机密客户端使用 `private_key_jwt`。静态存储和注册响应日志中都不得出现明文共享秘密。
- 验证器跳过 `aud` 检查。受众绑定（限制访问令牌权限）正是 RFC 8707 与 RFC 9728 的目的。
- 将 JWKS 缓存未命中回退接到轮换并生成密钥，而不是重新获取。前者无法产生所缺少的 `kid`，还会让攻击者控制的 `kid` 强迫系统无界创建密钥。回退必须使用幂等刷新。
- 允许不带 PKCE 的授权码请求。OAuth 2.1 禁止这种行为；若存储的授权码记录缺少 `code_challenge`，验证器必须拒绝 `/token` 交换。
- 缓存 JWKS 却不提供刷新任务。要么一并交付定时刷新，要么不部署这套认证接口。
- 没有允许列表就信任 `iss` 声明。接受任意 `iss` 令牌的验证器，会让攻击者通过自建 IdP 伪造令牌。
- 将入站 MCP 令牌转发到上游 API（令牌透传）。MCP 服务器调用上游 API 时必须获取独立令牌；透传会引发混淆代理问题。
- 明文存储 `registration_access_token`。静态存储应使用哈希；每次更新要求提供明文令牌。
- 将 MCP 请求元数据或已移除的协议会话当作授权状态。`2026-07-28` 传输无状态；每个请求都必须单独认证和授权。

输出：一页方案，包含受保护资源文档、按签发者组织的注册布局、按签发者与资源组织的令牌布局、选定注册路线、HTTP 端点、JWKS 刷新任务、权限范围映射和运行时拒绝规则。最后指出从授权服务器实际元数据中发现的第一个未满足的部署门禁。
