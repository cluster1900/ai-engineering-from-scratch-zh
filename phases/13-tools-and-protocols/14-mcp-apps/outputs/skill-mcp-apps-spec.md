---
name: mcp-apps-spec
description: 基于无状态 2026-07-28 协议设计和审查 MCP App 契约。
version: 2.0.0
phase: 13
lesson: 14
tags: [mcp, apps, stateless, ui-resources, csp, sandbox]
---

给定一个可能需要交互式视图的 MCP Tool，生成一个与框架无关的契约。

## 必需输入

- Tool 名称、参数、普通文本结果和结构化结果。
- 视图必须支持的用户交互。
- 数据敏感度，以及响应是否随授权 Context 变化。
- 视图所需的浏览器权限和外部 origin。
- 不支持 Apps 的 host 所使用的纯文本行为。

## 生成内容

1. 当前核心 envelope。展示 `2026-07-28`、每个请求中的 `protocolVersion`、`clientCapabilities`、推荐的 `clientInfo`、相匹配的 `Mcp-Method` 和 `Mcp-Name` header，以及 `resultType` 响应。
2. Discovery 条目。在 `server/discover` 中声明 `io.modelcontextprotocol/ui`，并使用保守的 `ttlMs` 和 `cacheScope`。
3. Tool 声明。将嵌套的 `_meta.ui.resourceUri` 放入 `tools/list` 返回的 Tool 中。不要等到 `tools/call` 才公开 UI。
4. Resource 契约。在 `resources/read` 之前包含确定性的 `resources/list` metadata。提供一个规范的 `ui://` URI、稳定的名称和描述、`text/html;profile=mcp-app`、缓存提示、CSP domain 列表（`connectDomains`、`resourceDomains`、`frameDomains`、`baseUriDomains`），以及最小权限对象。
5. Result 契约。无论 host 是否渲染 App，都返回有用的文本和结构化数据。
6. Bridge 契约。列出每个 Apps `ui/*` 或被代理的方法、准确的消息 origin、参数 schema、结果 schema，以及 host 侧的同意检查。
7. Fallback。描述客户端省略 Apps extension capability 时的 Tool 和结果。
8. 验证表。覆盖 routing 前因 header 不匹配而返回的 HTTP 400 `-32020`、包含准确 supported 和 requested version 数据的 HTTP 400 `-32022`、包含 `data.requiredCapabilities` 的 HTTP 400 `-32021`、HTTP 404 `-32601`、空 body 的 202 notification、CSP 违规、不可信内容、未授权的 bridge 调用，以及文本 fallback。
9. Transport 边界。如果实现接收的是已解析的请求和 header，请将其标记为进程内协议 Model，并将其连接至 Lesson 09 的完整 Streamable HTTP adapter。真实的 adapter 必须要求 JSON Content-Type，以及同时包含 JSON 和 SSE 的 Accept 值。

## 硬性拒绝项

- 将核心 `initialize`、`notifications/initialized` 或 `Mcp-Session-Id` 路径作为当前 MCP 展示。
- 使用通配符 `postMessage` 目标 origin，或接收方跳过 `event.origin` 验证。
- 仅在 Tool 运行后才公开 UI 绑定。
- 使用通配符 CSP domain 列表、无限制的网络 origin，或没有可见功能与之对应的权限。
- 在没有定义 sanitization 边界的情况下插入用户控制的 HTML。
- 对会造成实际后果的 UI 操作，将 iframe 点击视为 host 授权。
- 服务器声明了 resources 却省略 `resources/list`。
- 对不带 `id` 的 notification 返回任何 JSON-RPC 响应 body。

## 兼容性边界

可以将旧版扁平 UI metadata 作为 fallback 读取，但新输出使用嵌套的 `_meta.ui.resourceUri`。仅当 `ui/initialize` 被明确标识为 Apps postMessage handshake 时才允许使用。它绝不能替代已移除的 MCP 核心 initialization。

## 输出格式

返回一个紧凑的设计，并使用以下标题：Core Wire、Discovery、Tool、Resource、Result、Bridge、Security、Fallback、Verification。最后指出风险最高的一项 origin、权限或同意假设。
