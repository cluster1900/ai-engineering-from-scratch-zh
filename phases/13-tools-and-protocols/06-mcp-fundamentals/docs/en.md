# MCP 基础 — Primitives, Lifecycle, JSON-RPC Base

> MCP 之前的每个 integration 都是一次性的。Model Context Protocol 最早由 Anthropic 于 2024 年 11 月发布，现在由 Linux Foundation 的 Agentic AI Foundation 托管，它标准化了 discovery 和 invocation，让任何 client 都能与任何 server 通信。2025-11-25 spec 命名了六个 primitives（三个 server、三个 client）、一个三阶段 lifecycle，以及 JSON-RPC 2.0 wire format。掌握这些，本 phase 中 MCP 章节的其余部分就会变成阅读理解。

**Type:** Learn
**Languages:** Python (stdlib, JSON-RPC parser)
**Prerequisites:** Phase 13 · 01 through 05 (the tool interface and function calling)
**Time:** ~45 minutes

## Learning Objectives

- 说出全部六个 MCP primitives（server 侧的 tools、resources、prompts；client 侧的 roots、sampling、elicitation），并各给出一个 use case。
- 走读三阶段 lifecycle（initialize、operation、shutdown），并说明每个 phase 中谁发送哪条 message。
- 解析和发出 JSON-RPC 2.0 request、response 和 notification envelopes。
- 解释 `initialize` 中的 capability negotiation 是什么，以及没有它会破坏什么。

## 问题

MCP 之前，每个使用 tools 的 agent 都有自己的 protocol。Cursor 有一个形似 MCP 但不兼容的 tool system。Claude Desktop 带着另一个。VS Code 的 Copilot extension 又有第三个。一个构建 “Postgres query” tool 的团队要把同一个 tool 写三遍，每次对接不同 host 的 API。复用它意味着复制代码。

结果是一场一次性 integrations 的寒武纪爆发，同时也给 ecosystem velocity 设下了天花板。

MCP 通过标准化 wire format 来修复这个问题。单个 MCP server 可以在每个 MCP client 中工作：Claude Desktop、ChatGPT、Cursor、VS Code、Gemini、Goose、Zed、Windsurf，到 2026 年 4 月已有 300+ clients。每月 110M SDK downloads。10,000+ public servers。Linux Foundation 于 2025 年 12 月在新的 Agentic AI Foundation 下接管了 stewardship。

本 phase 使用的 spec revision 是 **2025-11-25**。它增加了 async Tasks（SEP-1686）、URL-mode elicitation（SEP-1036）、sampling with tools（SEP-1577）、incremental scope consent（SEP-835）和 OAuth 2.1 resource-indicator semantics。Phase 13 · 09 through 16 会覆盖这些 extensions。本课只停留在 base。

## 概念

### 三个 server primitives

1. **Tools.** 可调用操作。与 Phase 13 · 01 中相同的四步 loop。
2. **Resources.** 暴露的数据。按 URI 寻址的只读内容：`file:///path`、`db://query/...`、custom schemes。
3. **Prompts.** 可复用 templates。Host UI 中的 slash-commands；server 提供 template，client 填充 arguments。

### 三个 client primitives

4. **Roots.** server 被允许触碰的 URI 集合。Client 声明它们；server 遵守它们。
5. **Sampling.** Server 请求 client 的 model 执行 completion。让 server-hosted agent loops 不需要 server-side API keys。
6. **Elicitation.** Server 在执行中向 client 的 user 请求 structured input。Forms 或 URLs（SEP-1036）。

MCP 中的每项 capability 都恰好属于这六个之一。Phase 13 · 10 through 14 会深入覆盖每一项。

### Wire format: JSON-RPC 2.0

每条 message 都是一个 JSON object，带有这些 fields：

- Requests: `{jsonrpc: "2.0", id, method, params}`。
- Responses: `{jsonrpc: "2.0", id, result | error}`。
- Notifications: `{jsonrpc: "2.0", method, params}` — 没有 `id`，也不期待 response。

Base spec 有约 15 个 methods，按 primitive 分组。重要的是：

- `initialize` / `initialized`（handshake）
- `tools/list`, `tools/call`
- `resources/list`, `resources/read`, `resources/subscribe`
- `prompts/list`, `prompts/get`
- `sampling/createMessage`（server-to-client）
- `notifications/tools/list_changed`, `notifications/resources/updated`, `notifications/progress`

### 三阶段 lifecycle

**Phase 1: initialize.**

Client 发送带有自身 `capabilities` 和 `clientInfo` 的 `initialize`。Server 响应自己的 `capabilities`、`serverInfo` 和它使用的 spec version。Client 在消化响应后发送 `notifications/initialized`。从这里开始，任一方都可以根据已协商的 capabilities 发送 requests。

**Phase 2: operation.**

双向。Client 调用 `tools/list` 来 discovery，然后调用 `tools/call` 来 invoke。如果 server 声明了对应 capability，它可以发送 `sampling/createMessage`。当 server 的 tool set 发生变化时，它可以发送 `notifications/tools/list_changed`。当 user 更改 root scope 时，client 可以发送 `notifications/roots/list_changed`。

**Phase 3: shutdown.**

任一方关闭 transport。MCP 中没有结构化 shutdown method；transport（stdio 或 Streamable HTTP，Phase 13 · 09）承载 end-of-connection signal。

### Capability negotiation

`initialize` handshake 中的 `capabilities` 就是 contract。来自 server 的示例：

```json
{
  "tools": {"listChanged": true},
  "resources": {"subscribe": true, "listChanged": true},
  "prompts": {"listChanged": true}
}
```

Server 声明它可以发出 `tools/list_changed` notifications，并支持 `resources/subscribe`。Client 通过声明自己的 capabilities 表示同意：

```json
{
  "roots": {"listChanged": true},
  "sampling": {},
  "elicitation": {}
}
```

如果 client 没有声明 `sampling`，server 就不能调用 `sampling/createMessage`。对称地：如果 server 没有声明 `resources.subscribe`，client 就不能尝试订阅。

这就是防止 ecosystem drift 的机制。不支持 sampling 的 client 仍然是有效 MCP client；不调用 `sampling` 的 server 仍然是有效 MCP server。它们只是不会一起使用该 feature。

### Structured content 和 error shapes

`tools/call` 返回一个由 typed blocks 组成的 `content` array：`text`、`image`、`resource`。Phase 13 · 14 会把 MCP Apps（`ui://` interactive UI）加入这个列表。

Errors 使用 JSON-RPC error codes。Spec-defined additions：`-32002` "Resource not found"、`-32603` "Internal error"，以及作为 `error.data` 的 MCP-specific error data。

### Client capabilities vs tool call details

一个常见混淆：`capabilities.tools` 表示 client 是否支持 tool-list-changed notifications。Client 是否会调用具体 tools 是由它的 model 驱动的 runtime choice，而不是 capability flag。Capability flag 是 spec-level contract。Model 的选择是正交的。

### 为什么是 JSON-RPC 而不是 REST？

JSON-RPC 2.0（2010）是一个轻量双向 protocol。REST 是 client-initiated。MCP 需要 server-initiated messages（sampling、notifications），所以具有对称 request/response shape 的 JSON-RPC 是自然选择。JSON-RPC 也能干净地组合在 stdio 和 WebSocket/Streamable HTTP 之上，而不需要重新发明 HTTP 的 request shape。

## 使用它

`code/main.py` 提供一个最小 JSON-RPC 2.0 parser 和 emitter，然后手动走过 `initialize` → `tools/list` → `tools/call` → `shutdown` 序列，并打印每条 message。没有真实 transport；只有 message shapes。对照 Further Reading 中链接的 spec，验证每个 envelope。

要关注的点：

- `initialize` 双向声明 capabilities；response 有 `serverInfo` 和 `protocolVersion: "2025-11-25"`。
- `tools/list` 返回一个 `tools` array；每个 entry 都有 `name`、`description`、`inputSchema`。
- `tools/call` 使用 `params.name` 和 `params.arguments`。
- Response 的 `content` 是由 `{type, text}` blocks 组成的 array。

## 交付它

本课产出 `outputs/skill-mcp-handshake-tracer.md`。给定 MCP client-server interaction 的 pcap-style transcript，该 skill 会为每条 message 标注它属于哪个 primitive、哪个 lifecycle phase，以及依赖哪项 capability。

## 练习

1. 运行 `code/main.py`。找出 capability negotiation 发生的那一行，并描述如果 server 没有声明 `tools.listChanged` 会发生什么变化。

2. 扩展 parser 以处理 `notifications/progress`。Message shape：`{method: "notifications/progress", params: {progressToken, progress, total}}`。在 long-running `tools/call` 进行中发出它，并确认 client handler 会显示 progress bar。

3. 从头到尾阅读 MCP 2025-11-25 spec — 整个文档大约 80 页。找出多数 servers 并不需要的那一个 capability flag。Hint：它与 resource subscription 有关。

4. 在纸上草拟一个假想 “cron job” feature 应属于哪个 primitive。（Hint：server 希望 client 在 scheduled time 调用它。目前六个 primitives 都不适合。）MCP 的 2026 roadmap 有一个 draft SEP 涉及这一点。

5. 从 GitHub 上某个 open MCP server 解析一个 session log。统计 request vs response vs notification messages。计算 traffic 中 lifecycle vs operation 的比例。

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| MCP | “Model Context Protocol” | 用于 model-to-tool discovery 和 invocation 的开放 protocol |
| Server primitive | “server 暴露什么” | tools（actions）、resources（data）、prompts（templates） |
| Client primitive | “client 允许 servers 使用什么” | roots（scope）、sampling（LLM callbacks）、elicitation（user input） |
| JSON-RPC 2.0 | “wire format” | 对称的 request/response/notification envelopes |
| `initialize` handshake | “Capability negotiation” | 第一组 message pair；servers 和 clients 声明它们支持的 features |
| `tools/list` | “Discovery” | Client 向 server 请求其当前 tool set |
| `tools/call` | “Invocation” | Client 请求 server 带 arguments 执行一个 tool |
| `notifications/*_changed` | “Mutation events” | Server 告诉 client 它的 primitive list 已发生变化 |
| Content block | “Typed result” | tool result 中的 `{type: "text" \| "image" \| "resource" \| "ui_resource"}` |
| SEP | “Spec Evolution Proposal” | 命名的 draft proposal（例如用于 async Tasks 的 SEP-1686） |

## 延伸阅读

- [Model Context Protocol — Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — 权威 spec document
- [Model Context Protocol — Architecture concepts](https://modelcontextprotocol.io/docs/concepts/architecture) — 六个 primitive 的 mental model
- [Anthropic — Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) — 2024 年 11 月 launch post
- [MCP blog — First MCP anniversary](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/) — 一周年回顾和 2025-11-25 spec changes
- [WorkOS — MCP 2025-11-25 spec update](https://workos.com/blog/mcp-2025-11-25-spec-update) — SEP-1686、1036、1577、835 和 1724 的 summary
