---
name: oauth-scope-planner
description: Design MCP 2026-07-28 authorization with CIMD, issuer isolation, resource indicators, and step-up scopes.
version: 2.0.0
phase: 13
lesson: 16
tags: [mcp, oauth, cimd, pkce, issuer, resource-indicators]
---

针对远程 HTTP MCP 服务器及其工具列表，设计完整的授权边界。

<a id="required-inputs"></a>

## 必需输入

- 规范的 MCP 资源 URI 和受保护资源元数据位置。
- 允许的授权服务器签发者。
- 客户端运行环境：原生或 Web，以及准确的重定向 URI。
- 工具到权限范围的映射，以及具有重要后果的操作。
- 令牌、刷新和凭据存储约束。
- 不支持 CIMD 的旧版授权服务器（如果存在）。

<a id="produce"></a>

## 交付内容

1. 资源元数据。编写 RFC 9728 的 `resource`、`authorization_servers` 和 `scopes_supported`。在 well-known 段之后保留资源路径，例如 `https://notes.example.com/mcp` 对应 `https://notes.example.com/.well-known/oauth-protected-resource/mcp`。
2. 签发者策略。准确说明允许的签发者、元数据验证、变更处理和 RFC 9207 `iss` 比较。
3. 注册。可以预注册时采用预注册，否则优先使用客户端 ID 元数据文档（CIMD）。它带路径的 HTTPS URL 就是 `client_id`；要求准确的重定向 URI，并将展示元数据视为不可信内容。这里的 `application_type` 是可选项。
4. DCR 回退。如果必须使用，标明它已弃用，声明 `application_type`，并定义允许回退的准确条件。不能因为一般性的 CIMD 安全检查失败就降级。
5. 凭据索引键。按签发者存储预注册和 DCR 凭据，按 `(issuer, resource)` 存储令牌。禁止跨签发者复用。说明自托管 CIMD URL 可迁移，在可信签发者变更时不需要重新进行 DCR 注册。
6. PKCE 流程。要求 S256、准确的重定向 URI、授权响应签发者验证，以及授权请求和令牌请求中相同的资源。
7. 权限范围模型。将每个工具映射到最小权限范围。以当前 `WWW-Authenticate` 权限范围质询为准。
8. 增权体验。明确新增权限范围、给用户的说明、同意环节、新授权流程，以及使用新 MCP 请求 ID 的重试。
9. 资源服务器检查。实现所声明的 `tools/list`，包含有效的对象根模式、确定性顺序、结果类型、服务器身份和缓存提示。在分派工具前验证签发者、受众、有效期、权限范围、当前 MCP 请求头及请求元数据。
10. 令牌安全。仅使用 Bearer 请求头，不在查询参数中传递令牌、不透传令牌，安全存储刷新凭据，并制定轮换方案。
11. 错误契约。在 JSON-RPC 错误封装中保留每个请求 ID，包括 OAuth 失败。先检查请求头不匹配并返回 HTTP 400 `-32020`，再进行返回 HTTP 400 `-32022` 的版本支持检查，附上准确的支持版本与请求版本数据；未知方法返回 HTTP 404 `-32601`；已接受的通知返回空响应体的 202。
12. 传输边界。将接收已解析消息体的示例标为进程内协议模型，并接入第 09 课的完整 Streamable HTTP 适配器，验证 JSON Content-Type 及同时包含 JSON 和 SSE 的 Accept。

<a id="hard-rejects"></a>

## 必须否决

- 将 DCR 描述为新注册的首选机制。
- 使用 DCR 却没有 `application_type`。
- 签发者变更后继续复用其签发的注册凭据、访问令牌或刷新令牌。自托管 CIMD URL 是可迁移的例外，不是签发者生成的秘密。
- 在比较前规范化授权响应的 `iss`。
- 缺少 PKCE S256，或授权和令牌请求中缺少 `resource`。
- 接受面向其他受众的令牌，或将 MCP 令牌转发给下游。
- 将 `clientInfo`、`serverInfo`、能力或已移除的协议会话用作认证。
- 仅为模仿远程 HTTP 而给本地 stdio 添加 OAuth。
- 构造 RFC 9728 元数据 URL 时丢弃受保护资源的路径。
- MCP 请求出错时返回纯文本或临时拼凑的对象，而非带相同 ID 的 JSON-RPC 封装。

<a id="output-format"></a>

## 输出格式

返回以下章节：资源、签发者、注册、凭据存储、PKCE 流程、权限范围矩阵、增权、服务器验证、令牌安全、兼容性。最后指出触发签发者复核的准确事件；对由签发者签发凭据的客户端，同时指出何时必须重新注册。
