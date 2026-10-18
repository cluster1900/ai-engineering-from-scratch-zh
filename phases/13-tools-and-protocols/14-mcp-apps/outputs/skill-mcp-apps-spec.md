---
name: mcp-apps-spec
description: Design and review an MCP App contract on the stateless 2026-07-28 protocol.
version: 2.0.0
phase: 13
lesson: 14
tags: [mcp, apps, stateless, ui-resources, csp, sandbox]
---

针对可能需要交互视图的 MCP 工具，给出不依赖具体框架的契约。

<a id="required-inputs"></a>

## 必需输入

- 工具名称、参数、普通文本结果和结构化结果。
- 视图必须支持的用户交互。
- 数据敏感程度，以及响应是否随授权上下文变化。
- 视图所需的浏览器权限和外部来源。
- 对不支持 Apps 的宿主，规定纯文本行为。

<a id="produce"></a>

## 交付内容

1. 当前核心封装。展示 `2026-07-28`、逐请求的 `protocolVersion`、`clientCapabilities`、建议提供的 `clientInfo`、匹配的 `Mcp-Method` 与 `Mcp-Name` 请求头，以及 `resultType` 响应。
2. 发现条目。在 `server/discover` 中声明 `io.modelcontextprotocol/ui`，并保守设置 `ttlMs` 和 `cacheScope`。
3. 工具声明。在 `tools/list` 返回的工具中放置嵌套的 `_meta.ui.resourceUri`。不要等到 `tools/call` 时才披露界面。
4. 资源契约。在 `resources/read` 之前提供确定性的 `resources/list` 元数据。给出一个规范的 `ui://` URI、稳定的名称和描述、`text/html;profile=mcp-app`、缓存提示、CSP 域名列表（`connectDomains`、`resourceDomains`、`frameDomains`、`baseUriDomains`）和最小权限对象。
5. 结果契约。无论宿主是否渲染 App，都返回有用的文本和结构化数据。
6. 桥接契约。列出每个 Apps `ui/*` 方法或代理方法、准确的消息来源、参数模式、结果模式及宿主侧同意检查。
7. 回退方案。描述客户端未声明 Apps 扩展能力时的工具和结果。
8. 验证表。覆盖路由前的 HTTP 400 `-32020` 请求头不匹配、包含准确支持版本与请求版本数据的 HTTP 400 `-32022`、含 `data.requiredCapabilities` 的 HTTP 400 `-32021`、HTTP 404 `-32601`、空响应体的 202 通知、CSP 违规、不可信内容、未授权桥接调用和纯文本回退。
9. 传输边界。如果实现接收的是已解析请求和请求头，将其标记为进程内协议模型，并接入第 09 课的完整 Streamable HTTP 适配器。真正的适配器必须要求 JSON Content-Type，以及同时包含 JSON 和 SSE 的 Accept 值。

<a id="hard-rejects"></a>

## 必须否决

- 将核心 `initialize`、`notifications/initialized` 或 `Mcp-Session-Id` 路径描述为当前 MCP。
- `postMessage` 的目标来源使用通配符，或接收方不验证 `event.origin`。
- 工具执行后才披露界面绑定。
- CSP 域名列表使用通配符、网络来源没有边界，或权限没有对应的可见功能。
- 未定义净化边界就插入用户控制的 HTML。
- 具有重要后果的界面操作将 iframe 点击视为宿主授权。
- 服务器声明资源能力却缺少 `resources/list`。
- 为没有 `id` 的通知返回任何 JSON-RPC 响应体。

<a id="compatibility-boundary"></a>

## 兼容性边界

可以将旧版扁平界面元数据作为读取回退，但新输出使用嵌套的 `_meta.ui.resourceUri`。仅当明确标识为 Apps 的 postMessage 握手时，才允许 `ui/initialize`。它绝不能替代已移除的 MCP 核心初始化。

<a id="output-format"></a>

## 输出格式

返回简洁设计，使用以下标题：核心消息、发现、工具、资源、结果、桥接、安全、回退、验证。最后指出风险最大的一个来源、权限或同意假设。
