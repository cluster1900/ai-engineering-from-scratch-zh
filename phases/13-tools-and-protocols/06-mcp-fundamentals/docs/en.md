# MCP Fundamentals — Primitives、Lifecycle、JSON-RPC 基础

> MCP 之前的每个 integration 都是一次性的。Model Context Protocol 最初由 Anthropic 于 2024 年 11 月发布，现在由 Linux Foundation 的 Agentic AI Foundation 维护，它将 discovery 和 invocation 标准化，让任何 client 都能与任何 server 通信。2025-11-25 spec 命名了六个 primitives（三个 server primitives、三个 client primitives）、三阶段 lifecycle，以及 JSON-RPC 2.0 wire format。掌握这些，本 phase 中 MCP chapter 的其余内容就只是阅读。

**Type:** Learn
**Languages:** Python (stdlib, JSON-RPC parser)
**前置要求:** Phase 13 · 01 到 05（tool interface 与 function calling）
**Time:** ~45 minutes

## 学习目标
- 说出全部六个 MCP primitives（server 上的 tools、resources、prompts；client 上的 roots、sampling、elicitation），并各给出一个 use case。
- 走读三阶段 lifecycle（initialize、operation、shutdown），并说明每个 phase 中谁发送哪条 message。
- 解析并发出 JSON-RPC 2.0 request、response 和 notification envelopes。
- 解释 `initialize` 中的 capability negotiation 是什么，以及没有它会破坏什么。

## 问题
MCP 之前，每个使用 tool 的 agent 都有自己的 protocol。Cursor 有一个形似 MCP 但不兼容的 tool system。Claude Desktop 发布时带着另一套。VS Code 的 Copilot extension 又有第三套。一个构建了 "Postgres query" tool 的团队，要把同一个 tool 写三遍，每次对接不同 host 的 API。复用它意味着复制代码。

结果是一次性 integrations 的寒武纪大爆发，以及 ecosystem velocity 的上限。

MCP 通过标准化 wire format 解决这个问题。单个 MCP server 可在每个 MCP client 中工作：Claude Desktop、ChatGPT、Cursor、VS Code、Gemini、Goose、Zed、Windsurf，到 2026 年 4 月已有 300+ clients。每月 110M SDK downloads。10,000+ public servers。Linux Foundation 于 2025 年 12 月在新的 Agentic AI Foundation 下接手维护。

本 phase 使用的 spec revision 是 **2025-11-25**。它加入了 async Tasks (SEP-1686)、URL-mode elicitation (SEP-1036)、sampling with tools (SEP-1577)、incremental scope consent (SEP-835)，以及 OAuth 2.1 resource-indicator semantics。Phase 13 · 09 到 16 会覆盖这些 extensions。本课只讲基础部分。

## 概念
### Three server primitives

1. **Tools.** 可调用 actions。与 Phase 13 · 01 中相同的四步循环。
2. **Resources.** 暴露的数据。通过 URI 寻址的 read-only content：`file:///path`、`db://query/...`、custom schemes。
3. **Prompts.** 可复用 templates。Host UI 中的 slash-commands；server 提供 template，client 填充 arguments。

### Three client primitives

4. **Roots.** server 被允许触碰的 URI 集合。Client 声明它们；server 遵守它们。
5. **Sampling.** Server 请求 client 的 model 执行一次 completion。支持 server-hosted agent loops，而不需要 server-side API keys。
6. **Elicitation.** Server 在中途向 client 的 user 请求 structured input。Forms 或 URLs (SEP-1036)。

MCP 中的每个 capability 都精确归属于这六个 primitives 之一。Phase 13 · 10 到 14 会深入讲解每一个。

### Wire format: JSON-RPC 2.0

每条 message 都是带有这些 fields 的 JSON object：

- Requests: `{jsonrpc: "2.0", id, method, params}`。
- Responses: `{jsonrpc: "2.0", id, result | error}`。
- Notifications: `{jsonrpc: "2.0", method, params}` — 没有 `id`，不期望 response。

基础 spec 有约 15 个 methods，按 primitive 分组。重要的有：

- `initialize` / `initialized` (handshake)
- `tools/list`, `tools/call`
- `resources/list`, `resources/read`, `resources/subscribe`
- `prompts/list`, `prompts/get`
- `sampling/createMessage` (server-to-client)
- `notifications/tools/list_changed`, `notifications/resources/updated`, `notifications/progress`

### Three-phase lifecycle

**Phase 1: initialize.**

Client 发送带有自身 `capabilities` 和 `clientInfo` 的 `initialize`。Server 响应自己的 `capabilities`、`serverInfo`，以及它所使用的 spec version。Client 在消化 response 后发送 `notifications/initialized`。从这里开始，任意一方都可以按照 negotiated capabilities 发送 requests。

**Phase 2: operation.**

双向。Client 调用 `tools/list` 做 discovery，然后调用 `tools/call` 做 invocation。如果 server 声明了该 capability，它可以发送 `sampling/createMessage`。当 server 的 tool set 发生 mutation 时，它可以发送 `notifications/tools/list_changed`。当 user 改变 root scope 时，client 可以发送 `notifications/roots/list_changed`。

**Phase 3: shutdown.**

任意一方关闭 transport。MCP 中没有结构化 shutdown method；transport（stdio 或 Streamable HTTP，Phase 13 · 09）承载 end-of-connection signal。

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

如果 client 没有声明 `sampling`，server 就不得调用 `sampling/createMessage`。对称地：如果 server 没有声明 `resources.subscribe`，client 就不得尝试 subscribe。

这就是防止 ecosystem drift 的机制。不支持 sampling 的 client 仍然是有效的 MCP client；不调用 `sampling` 的 server 仍然是有效的 MCP server。它们只是不会一起使用该 feature。

### Structured content 和 error shapes

`tools/call` 返回一个由 typed blocks 组成的 `content` array：`text`、`image`、`resource`。Phase 13 · 14 会把 MCP Apps（`ui://` interactive UI）加入这个列表。

Errors 使用 JSON-RPC error codes。Spec-defined additions：`-32002` "Resource not found"，`-32603` "Internal error"，以及作为 `error.data` 的 MCP-specific error data。

### Client capabilities 与 tool call 细节

一个常见困惑：`capabilities.tools` 表示 client 是否支持 tool-list-changed notifications。Client 是否会调用具体 tools 是由其 model 驱动的 runtime choice，而不是 capability flag。Capability flag 是 spec-level contract。Model 的选择与之正交。

### 为什么是 JSON-RPC，而不是 REST？

JSON-RPC 2.0 (2010) 是一种轻量级双向 protocol。REST 是 client-initiated。MCP 需要 server-initiated messages（sampling、notifications），所以具备对称 request/response 形状的 JSON-RPC 很自然地契合。JSON-RPC 也能在 stdio 和 WebSocket/Streamable HTTP 上干净组合，而不需要重新发明 HTTP 的 request shape。

## 使用它
`code/main.py` 提供一个最小 JSON-RPC 2.0 parser 和 emitter，然后手动走读 `initialize` → `tools/list` → `tools/call` → `shutdown` sequence，并打印每条 message。没有真实 transport；只有 message shapes。与 Further Reading 中链接的 spec 对照，验证每个 envelope。

要关注的点：

- `initialize` 双向声明 capabilities；response 包含 `serverInfo` 和 `protocolVersion: "2025-11-25"`。
- `tools/list` 返回 `tools` array；每个 entry 有 `name`、`description`、`inputSchema`。
- `tools/call` 使用 `params.name` 和 `params.arguments`。
- Response 的 `content` 是由 `{type, text}` blocks 组成的 array。

## 交付它
本课产出 `outputs/skill-mcp-handshake-tracer.md`。给定一段 pcap-style 的 MCP client-server interaction transcript，该 skill 会为每条 message 标注其 primitive、lifecycle phase，以及它依赖的 capability。

## 练习
1. 运行 `code/main.py`。找出发生 capability negotiation 的那一行，并描述如果 server 没有声明 `tools.listChanged` 会有什么变化。

2. 扩展 parser 以处理 `notifications/progress`。Message shape：`{method: "notifications/progress", params: {progressToken, progress, total}}`。在 long-running `tools/call` 进行中发出它，并确认 client handler 会显示 progress bar。

3. 从头到尾阅读 MCP 2025-11-25 spec — 整份文档大约 80 页。找出大多数 servers 并不需要的那个 capability flag。提示：它与 resource subscription 有关。

4. 在纸上画出一个假想的 "cron job" feature 应归属的 primitive。（提示：server 希望 client 在 scheduled time 调用它。今天六个 primitives 都不适合。）MCP 的 2026 roadmap 中有一个 draft SEP 覆盖这个方向。

5. 解析 GitHub 上某个 open MCP server 的一段 session log。统计 request、response、notification messages 的数量。计算 traffic 中 lifecycle 与 operation 各占多少比例。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MCP | "Model Context Protocol" | 用于 model-to-tool discovery 和 invocation 的开放 protocol |
| Server primitive | "server 暴露什么" | tools（actions）、resources（data）、prompts（templates） |
| Client primitive | "client 允许 servers 使用什么" | roots（scope）、sampling（LLM callbacks）、elicitation（user input） |
| JSON-RPC 2.0 | "wire format" | 对称 request/response/notification envelopes |
| `initialize` handshake | "Capability negotiation" | 第一组 message pair；servers 和 clients 声明它们支持的 features |
| `tools/list` | "Discovery" | Client 向 server 请求其当前 tool set |
| `tools/call` | "Invocation" | Client 请求 server 带 arguments 执行某个 tool |
| `notifications/*_changed` | "Mutation events" | Server 告诉 client 其 primitive list 已发生变化 |
| Content block | "Typed result" | Tool result 中的 `{type: "text" | "image" | "resource" | "ui_resource"}` |
| SEP | "Spec Evolution Proposal" | 具名 draft proposal（例如用于 async Tasks 的 SEP-1686） |

## 延伸阅读
- [Model Context Protocol — Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — canonical spec document
- [Model Context Protocol — Architecture concepts](https://modelcontextprotocol.io/docs/concepts/architecture) — 六个 primitive 的 mental model
- [Anthropic — Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) — 2024 年 11 月发布文章
- [MCP blog — First MCP anniversary](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/) — 一周年回顾与 2025-11-25 spec changes
- [WorkOS — MCP 2025-11-25 spec update](https://workos.com/blog/mcp-2025-11-25-spec-update) — SEP-1686、1036、1577、835 和 1724 的总结
