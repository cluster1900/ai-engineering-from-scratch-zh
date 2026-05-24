# MCP Apps — 通过 `ui://` 提供 Interactive UI Resources

> 纯文本 tool output 限制了 agents 能展示的内容。MCP Apps（SEP-1724，2026 年 1 月 26 日正式发布）让 tool 返回 sandboxed interactive HTML，并在 Claude Desktop、ChatGPT、Cursor、Goose 和 VS Code 中 inline 渲染。Dashboards、forms、maps、3D scenes，都通过一个 extension 实现。本课会讲解 `ui://` resource scheme、`text/html;profile=mcp-app` MIME、iframe-sandbox postMessage protocol，以及允许 server 渲染 HTML 所带来的 security surface。

**类型：** 构建
**语言：** Python（stdlib、UI resource emitter）、HTML（sample app）
**先修要求：** Phase 13 · 07（MCP server）、Phase 13 · 10（resources）
**时间：** 约 75 分钟

## 学习目标

- 从 tool call 返回一个 `ui://` resource，并设置正确的 MIME 和 metadata。
- 使用 `_meta.ui.resourceUri`、`_meta.ui.csp` 和 `_meta.ui.permissions` 声明 tool 关联的 UI。
- 实现用于 UI-to-host communication 的 iframe sandbox postMessage JSON-RPC。
- 应用 CSP 和 permissions-policy defaults，防御 UI-originated attacks。

## 问题

2025 年代的 `visualize_timeline` tool 可以返回“这里有 14 条按时间顺序组织的笔记：...”。这只是一段文字。用户真正想要的是 interactive timeline。在 MCP Apps 之前，选项是：client-specific widget APIs（Claude artifacts、OpenAI Custom GPT HTML），或者完全没有 UI。

MCP Apps（SEP-1724，2026 年 1 月 26 日发布）标准化了这个 contract。tool result 包含一个 `resource`，其 URI 为 `ui://...`，MIME 为 `text/html;profile=mcp-app`。host 会在 sandboxed iframe 中渲染它，使用受限 CSP，并且除非显式授予，否则没有 network access。iframe 内的 UI 通过一个很小的 postMessage JSON-RPC dialect 向 host 发送消息。

每个兼容 client（Claude Desktop、ChatGPT、Goose、VS Code）都会以相同方式渲染同一个 `ui://` resource。一个 server，一个 HTML bundle，通用 UI。

## 概念

### `ui://` resource scheme

tool 返回：

```json
{
  "content": [
    {"type": "text", "text": "Here is your notes timeline:"},
    {"type": "ui_resource", "uri": "ui://notes/timeline"}
  ],
  "_meta": {
    "ui": {
      "resourceUri": "ui://notes/timeline",
      "csp": {
        "defaultSrc": "'self'",
        "scriptSrc": "'self' 'unsafe-inline'",
        "connectSrc": "'self'"
      },
      "permissions": []
    }
  }
}
```

然后 host 对 `ui://notes/timeline` URI 调用 `resources/read`，并取回：

```json
{
  "contents": [{
    "uri": "ui://notes/timeline",
    "mimeType": "text/html;profile=mcp-app",
    "text": "<!doctype html>..."
  }]
}
```

### Iframe sandbox

host 在 sandboxed `<iframe>` 中渲染 HTML，配置为：

- `sandbox="allow-scripts allow-same-origin"`（或根据 server declaration 使用更严格设置）
- 通过 response headers 应用 server-declared CSP。
- 没有来自 host origin 的 cookies，也没有 localStorage。
- Network access 限制在 CSP 的 `connectSrc` 内。

### postMessage protocol

iframe 通过 `window.postMessage` 与 host 通信。一个很小的 JSON-RPC 2.0 dialect：

始终将 `targetOrigin` 固定到 peer 的精确 origin，并在接收侧处理任何 payload 前，根据 allowlist 验证 `event.origin`。此通道任一侧都不要使用 `"*"`，因为 body 携带 tool calls 和 resource reads。

```js
// iframe to host  (pin to host origin)
window.parent.postMessage({
  jsonrpc: "2.0",
  id: 1,
  method: "host.callTool",
  params: { name: "notes_update", arguments: { id: "note-14", title: "..." } }
}, "https://host.example.com");

// host to iframe  (pin to iframe origin)
iframe.contentWindow.postMessage({
  jsonrpc: "2.0",
  id: 1,
  result: { content: [...] }
}, "https://iframe.example.com");

// receiver on both sides
window.addEventListener("message", (event) => {
  if (event.origin !== "https://expected-peer.example.com") return;
  // safe to process event.data
});
```

UI 可以调用的 host-side methods：

- `host.callTool(name, arguments)` — 调用 server tool。
- `host.readResource(uri)` — 读取 MCP resource。
- `host.getPrompt(name, arguments)` — 获取 prompt template。
- `host.close()` — 关闭 UI。

每次调用仍然会经过 MCP protocol，并继承 server 的 permissions。

### Permissions

`_meta.ui.permissions` list 请求额外 capabilities：

- `camera` — 访问用户 camera（用于 scan-a-document UIs）。
- `microphone` — voice input。
- `geolocation` — location。
- `network:*` — 比仅由 `connectSrc` 允许的范围更宽的 network access。

每个 permission 都会成为用户在 UI 渲染前看到的 prompt。

### Security risks

iframe 中的 HTML 仍然是 HTML。新的 attack surface：

- **通过 UI 的 Prompt-injection。** 恶意 server UI 可以显示看起来像 system message 的文本并欺骗用户。Host rendering 应该明显区分 server UI 和 host UI。
- **通过 `connectSrc` 的 Exfiltration。** 如果 CSP 允许 `connect-src: *`，UI 可以把数据发送到任何地方。Default 应该严格。
- **Clickjacking。** UI 覆盖 host chrome。Hosts 必须阻止 z-index manipulation，并强制执行 opacity rules。
- **Steal focus。** UI 获取 keyboard focus 并捕获下一条 message。Hosts 必须拦截。

Phase 13 · 15 会在 MCP security 中深入讲解这些内容；本课先做介绍。

### `ui/initialize` handshake

iframe 加载后，会通过 postMessage 发送 `ui/initialize`：

```json
{"jsonrpc": "2.0", "id": 0, "method": "ui/initialize",
 "params": {"theme": "dark", "locale": "en-US", "sessionId": "..."}}
```

Host 响应 capabilities 和 session token。UI 在之后每一次 host call 中都会使用 session token。

### AppRenderer / AppFrame SDK primitives

ext-apps SDK 暴露两个便捷 primitives：

- `AppRenderer`（server side）— 包装 React / Vue / Solid component，并发出带有正确 MIME 和 metadata 的 `ui://` resource。
- `AppFrame`（client side）— 接收 resource，挂载 iframe，并调解 postMessage。

你可以使用这些 primitives，也可以手写 HTML 和 JSON-RPC。

### Ecosystem status

MCP Apps 于 2026 年 1 月 26 日发布。截至 2026 年 4 月的 client support：

- **Claude Desktop。** 自 2026 年 1 月起 full support。
- **ChatGPT。** 通过 Apps SDK full support（底层使用相同的 MCP Apps protocol）。
- **Cursor。** Beta；通过 settings 启用。
- **VS Code。** 仅 Insider builds。
- **Goose。** Full support。
- **Zed, Windsurf。** 已列入 roadmap。

生产中的 servers：dashboards、map visualizations、data tables、chart builders、sandbox IDE previews。

## 使用它

`code/main.py` 扩展了 notes server，添加一个 `visualize_timeline` tool，它返回 `ui://notes/timeline` resource，并为该 URI 上的 `resources/read` 添加 handler，返回一个小而完整的 HTML bundle，其中包含 SVG timeline。HTML 使用 stdlib templating，不需要 build system。由于 stdlib 无法驱动 browser，postMessage 以 JS comments 形式勾勒。

关注点：

- tool response 上的 `_meta.ui` 携带 resourceUri、CSP、permissions。
- HTML 在没有 network access 的情况下渲染；所有 data 都是 inlined。
- JS 通过 `window.parent.postMessage` 调用 `host.callTool`（已文档化，但在这个 stdlib demo 中是 inert）。

## 发布它

本课产出 `outputs/skill-mcp-apps-spec.md`。给定一个可以从 interactive UI 中受益的 tool，该 skill 会产出完整的 MCP Apps contract：`ui://` URI、CSP、permissions、postMessage entrypoints 和 security checklist。

## 练习

1. 运行 `code/main.py` 并检查生成的 HTML。直接在 browser 中打开 HTML；验证 SVG 是否渲染。然后草拟 UI 用来调用 `host.callTool("notes_update", ...)` 的 postMessage contract。

2. 收紧 CSP：移除 `'unsafe-inline'`，并使用 nonce-based script policy。HTML generation code 需要做哪些修改？

3. 添加第二个 UI resource `ui://notes/editor`，提供一个用于就地编辑 note 的 form。当用户提交时，iframe 调用 `host.callTool("notes_update", ...)`。

4. 审计 UI 的 attack surface。恶意 server 可能在哪里注入 content？iframe sandbox 能防御什么，不能防御什么？

5. 阅读 SEP-1724 spec，找出 MCP Apps SDK 中一个此 toy implementation 未使用的 capability。（提示：component-level state sync。）

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| MCP Apps | “Interactive UI resources” | 2026-01-26 发布的 SEP-1724 extension |
| `ui://` | “App URI scheme” | UI bundles 的 resource scheme |
| `text/html;profile=mcp-app` | “The MIME” | MCP App HTML 的 Content-type |
| Iframe sandbox | “Render container” | 使用 CSP 和 permissions 对 UI 进行 browser sandboxing |
| postMessage JSON-RPC | “UI-to-host wire” | 用于 host calls 的小型 JSON-RPC-over-postMessage dialect |
| `_meta.ui` | “Tool-UI binding” | 将 tool result 链接到 UI resource 的 metadata |
| CSP | “Content-Security-Policy” | 声明 scripts、network、styles 的 allowed sources |
| AppRenderer | “Server SDK primitive” | 将 framework component 转换为 `ui://` resource |
| AppFrame | “Client SDK primitive” | 调解 postMessage 的 iframe mount helper |
| `ui/initialize` | “Handshake” | UI 发给 host 的第一个 postMessage |

## 延伸阅读

- [MCP ext-apps — GitHub](https://github.com/modelcontextprotocol/ext-apps) — reference implementation 和 SDK
- [MCP Apps specification 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx) — 正式 spec document
- [MCP — Apps extension overview](https://modelcontextprotocol.io/extensions/apps/overview) — high-level documentation
- [MCP blog — MCP Apps launch](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) — 2026 年 1 月 launch post
- [MCP Apps API reference](https://apps.extensions.modelcontextprotocol.io/api/) — JSDoc-style SDK reference
