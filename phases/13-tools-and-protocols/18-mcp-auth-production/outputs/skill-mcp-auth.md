---
name: mcp-auth-wiring
description: 独立生产 MCP 授权（RFC 8414、CIMD、7591、8707、7636 PKCE、9728、9207）— 受保护资源元数据、注册、JWKS 刷新和每个请求令牌验证。
version: 1.1.0
phase: 13
lesson: 18
tags: [mcp, oauth, cimd, dcr, jwks, rfc8414, rfc7591, rfc8707, rfc7636, rfc9728, rfc9207]
---
给定 MCP 服务器配置和 IdP 功能集，发出构成生产 MCP 授权层的身份验证表面和拒绝规则。

输入：

- `mcp_resource_url` — 规范资源 URL（最具体的标识符；仅在区分共同托管服务器时保留路径），用作 `aud` 和受保护资源元数据 `resource` 值。
- `idp_metadata_url` — IdP 的 `/.well-known/oauth-authorization-server`（或 OpenID Connect Discovery）URL。
- `idp_capabilities` — `code_challenge_methods_supported`、`grant_types_supported`、`client_id_metadata_document_supported` (CIMD)、`registration_endpoint` (DCR)、`response_types_supported`、`authorization_response_iss_parameter_supported` (RFC 9207) 的观测值。
- `tools` — MCP 工具列表以及每个工具所需的范围。

生产：

1. **拒绝门。** 如果任何硬条件失败，则拒绝接线并停止：
   - `code_challenge_methods_supported` 中缺少 `S256`（PKCE 无降级模式）。
   - `grant_types_supported` 中缺少 `authorization_code`。
   - `response_types_supported` 与 `["code"]` 不同。
   - 不存在注册路径：预注册的`client_id`、`client_id_metadata_document_supported: true`（CIMD）或`registration_endpoint`（DCR）均不可用。任何一个都足够了 - DCR 缺失不再是拒绝（2025 年 11 月 25 日将 DCR 降级为 `MAY`；CIMD 是首选默认值）。

2. **受保护资源元数据文档** (RFC 9728)，供 MCP 服务器在 `/.well-known/oauth-protected-resource` 发布。包括`resource`、`authorization_servers`（发行人白名单）、`scopes_supported`、`bearer_methods_supported: ["header"]`。

3. **HTTP 端点。**
   - `GET /.well-known/oauth-protected-resource` — 返回 (2) 中的文档。
   - `POST /mcp`（MCP 传输）— 在调度任何工具之前运行令牌验证。
   -（仅限 DCR 路径）`POST /register` — 注册商，前面有速率限制检查。

4. **后台作业+例程。**
   - 计划的 JWKS 刷新将 `jwks_uri` 重新提取到缓存 `{keys, fetched_at}` 中。幂等；从不铸造钥匙。 AS 旋转；资源服务器仅刷新。默认`0 */6 * * *`；对于高周转 IdP，紧固至 `*/15 * * * *`。
   - `validate` 例程 — 检查 `iss` 允许列表、针对缓存的 JWKS、`aud == mcp_resource_url`、`exp` 的签名、所需范围。
   - 升级发布路径 - 仅当工具列表包含用户最初未授予的范围后的操作时。

5. **缓存计划。** 每个接受的发行人有一个条目，由 `issuer` 键入，持有 `{keys, fetched_at}`。记录读取模式：验证器读取缓存，并在 `kid` 未命中时回退到单个同步刷新（重新获取，而不是旋转 - 重新获取是幂等的，不能转变为密钥创建 DoS）。

6. **范围映射。** 将每个工具映射到其所需的范围。输出一个表：
   `| tool | required_scope | rationale |`。将破坏性工具归入其自己的范围内；切勿将读取范围重复用于写入工具。

7. **运行时的拒绝规则**（验证器必须对这些规则进行编码）：
   - 当 `aud != mcp_resource_url` → 401 `Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="<prm_url>"` 时拒绝。
   - 当`iss not in authorization_servers`时拒绝。
   - 在单次重新获取回退后，当 `kid` 不在缓存的 JWKS 中时拒绝。
   - 当所需范围不存在时拒绝 → 403 `Bearer error="insufficient_scope", scope="<required>", resource_metadata="<prm_url>"`。
   - 拒绝任何没有 `code_verifier` 或 `resource` 参数的令牌请求。

硬拒绝（切勿发送任何这些 - 拒绝请求并记录原因）：

- 以明文形式存储 `client_secret`。公众客户端使用`token_endpoint_auth_method: none`；机密客户使用`private_key_jwt`。静态或注册响应日志中没有明文共享机密。
- 跳过验证器上的 `aud` 检查。受众绑定（访问令牌权限限制）是 RFC 8707 + RFC 9728 的全部原因。- 将 JWKS 缓存未命中回退连接到旋转和铸造而不是重新获取。它永远不会生成丢失的 `kid`，并让攻击者控制的 `kid` 值强制创建无限制的密钥。后备必须是幂等刷新。
- 允许无 PKCE 授权码请求。 OAuth 2.1 禁止它；验证者必须拒绝任何存储的授权码记录缺少 `code_challenge` 的 `/token` 交换。
- 缓存 JWKS，无需刷新作业。要么是计划的刷新发送，要么是身份验证表面未部署。
- 在没有允许列表的情况下信任 `iss` 声明。任何接受来自任何 `iss` 令牌的验证器都可以让攻击者建立自己的 IdP 并伪造令牌。
- 将入站 MCP 令牌转发到上游 API（令牌直通）。如果 MCP 服务器调用上游 API，它必须获取自己的单独令牌；直通会产生混淆副问题。
- 以明文形式存储 `registration_access_token`。静态哈希；每次更新都需要明文。

输出：一页计划，其中包含受保护资源文档、所选注册路径（CIMD/预注册/DCR）、HTTP 端点、JWKS 刷新作业、缓存计划、范围映射表和编码的运行时拒绝规则。以最有可能针对所选 IdP 出现的单一部署阻塞差距结束 — 通常是否支持 CIMD，然后回退到企业 SSO 的 DCR 可用性。