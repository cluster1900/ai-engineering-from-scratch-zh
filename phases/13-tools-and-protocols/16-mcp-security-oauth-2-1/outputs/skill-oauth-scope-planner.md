---
name: oauth-scope-planner
description: 使用 CIMD、issuer 隔离、resource indicator 和 step-up scope 设计 MCP 2026-07-28 authorization。
version: 2.0.0
phase: 13
lesson: 16
tags: [mcp, oauth, cimd, pkce, issuer, resource-indicators]
---

给定一个远程 HTTP MCP server 及其 Tool 列表，设计完整的 authorization 边界。

## 必需输入

- 规范 MCP resource URI 和 protected-resource metadata 位置。
- 允许的 authorization server issuer。
- Client runtime：native 或 web，并提供精确的 redirect URI。
- Tool 到 scope 的映射以及具有重大影响的操作。
- Token、refresh 和 credential storage 约束。
- 不支持 CIMD 的旧版 authorization server（如有）。

## 产出

1. Resource metadata。起草 RFC 9728 `resource`、`authorization_servers` 和 `scopes_supported`。保留 well-known 段之后的 resource 路径，例如对于 `https://notes.example.com/mcp`，应使用 `https://notes.example.com/.well-known/oauth-protected-resource/mcp`。
2. Issuer policy。说明允许的确切 issuer、metadata 验证、变更处理以及 RFC 9207 `iss` 比较方式。
3. Enrollment。可用时使用预注册，否则优先使用 Client ID Metadata Document。带路径的 HTTPS URL 即为 `client_id`；要求 redirect URI 完全匹配，并将展示用 metadata 视为不可信数据。此处的 `application_type` 是可选项。
4. DCR fallback。如确有需要，应将其标记为 deprecated，声明 `application_type`，并定义允许 fallback 的精确条件。不要在发生一般性 CIMD 安全失败后降级。
5. Credential key。按 issuer 存储预注册和 DCR credential，按 `(issuer, resource)` 存储 Token。禁止跨 issuer 复用。说明自行托管的 CIMD URL 具有可移植性，并且在受信任 issuer 发生变化时不需要重新执行 DCR 注册。
6. PKCE flow。要求使用 S256、精确匹配 redirect URI、验证 authorization response issuer，并在 authorization request 和 token request 中使用相同的 resource。
7. Scope model。将每个 Tool 映射到其最小 scope。将当前 `WWW-Authenticate` scope challenge 视为权威依据。
8. Step-up experience。确定新增 scope、面向用户的说明、consent point、新的 authorization，以及使用全新 MCP request id 发起的重试。
9. Resource-server check。实现对外公布的 `tools/list`，其中包含有效的 object-root schema、确定性顺序、result type、server identity 和 cache hint。在分派 Tool 前验证 issuer、audience、expiry、scope、当前 MCP header 和 request metadata。
10. Token hygiene。只允许 Bearer header，禁止 query token，禁止 token passthrough，采用机密 refresh storage，并制定 rotation 计划。
11. Error contract。在 JSON-RPC error envelope 中保留每个 request id，包括 OAuth 失败。要求先针对 header 不匹配返回 HTTP 400 `-32020`，再执行返回 HTTP 400 `-32022` 的 version support 检查；提供精确的 supported 和 requested 数据；针对未知 method 返回 HTTP 404 `-32601`；针对已接受的 notification 返回 202 和空 body。
12. Transport boundary。将 parsed-body 示例标记为 in-process protocol model，并将其连接到 Lesson 09 的完整 Streamable HTTP adapter，以验证 JSON Content-Type 以及同时包含 JSON 和 SSE 的 Accept。

## 硬性拒绝项

- 将 DCR 作为首选的新 enrollment 机制。
- 使用 DCR 但不提供 `application_type`。
- issuer 发生变化后，继续复用由 issuer 签发的 registration credential、access token 或 refresh token。自行托管的 CIMD URL 是可移植的例外，而不是由 issuer 签发的 secret。
- 在比较前对 authorization response `iss` 进行规范化。
- 缺少 PKCE S256，或 authorization request 和 token request 中缺少 `resource`。
- 接受面向其他 audience 的 Token，或将 MCP Token 转发到下游。
- 使用 `clientInfo`、`serverInfo`、capability 或已移除的 protocol session 进行 authentication。
- 仅为了模仿远程 HTTP 而向本地 stdio 添加 OAuth。
- 构造 RFC 9728 metadata URL 时丢弃 protected resource 路径。
- 针对 MCP request error 返回纯文本或临时拼凑的 object，而不是带有相同 id 的 JSON-RPC envelope。

## 输出格式

返回名为 Resource、Issuers、Enrollment、Credential Store、PKCE Flow、Scope Matrix、Step-Up、Server Validation、Token Hygiene 和 Compatibility 的章节。结尾说明触发 issuer review 的确切事件；对于由 issuer 签发的 client，还要说明触发重新 enrollment 的确切事件。
