---
name: mcp-apps-spec
description: 为需要交互式 UI resource 的 tool 生成完整 MCP Apps contract。
version: 1.0.0
phase: 13
lesson: 14
tags: [mcp, apps, ui-resources, csp, iframe-sandbox]
---

给定一个适合使用交互式 UI 的 tool（timeline、form、dashboard、map、chart），生成 MCP Apps contract。

生成：

1. `ui://` URI。为 UI resource 指定一个规范名称（例如 `ui://notes/timeline`）。
2. Tool result 形状。`content[]` 包含 `text` preamble 和 `ui_resource` block；填充 `_meta.ui`。
3. CSP。为 `default-src`、`script-src`、`connect-src`、`img-src`、`style-src` 设置最小 allowlist。除非必要，避免使用 `'unsafe-inline'`。
4. Permissions list。需要时包含 camera / mic / geolocation / network；不需要则为空。
5. postMessage entry points。UI 会调用哪些 `host.*`，以及它们返回什么。
6. Security checklist。区分于 host、防 clickjacking、严格的 connect-src；如果渲染任何用户内容，则进行 HTML sanitization。

Hard rejects:
- CSP 使用 `default-src *`。这是过度开放的安全风险。
- 任何超出 UI 实际使用范围的 `permissions` 请求。最小权限。
- 任何加载外部 scripts 的 ui:// resource。应打包或拒绝。
- 任何在未 sanitization 的情况下渲染用户可控 HTML 的 UI。这是 XSS vector。

Refusal rules:
- 如果 UI 只是静态结果，拒绝 scaffold App；返回 text content。
- 如果 tool 更适合使用原生 host widgets（progress bars、confirmation dialogs），则推荐使用它们。
- 如果 host 尚不支持 MCP Apps（截至 2026-04 的 VS Code stable、Zed、Windsurf），标记 fallback-to-text 路径。

Output: 一页 contract，包含 `ui://` URI、tool result JSON、CSP、permissions、postMessage entry points 和 security checklist。最后用一句话说明能渲染此 UI 的最低 host 要求。
