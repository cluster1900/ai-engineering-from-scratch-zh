# MCP Resources and Prompts — 工具之外的 Context 暴露

> Tools 得到了 MCP 90% 的关注。另外两个 server primitive 解决的是不同问题。Resources 暴露可读取的数据；prompts 暴露可复用的模板，作为 slash-commands。许多 server 应该使用 resources，而不是把读取操作包进 tools；也应该使用 prompts，而不是把 workflow 硬编码进 client prompts。本课会说明决策规则，并走读 `resources/*` 和 `prompts/*` messages。

**Type:** Build
**Languages:** Python (stdlib, resource + prompt handler)
**Prerequisites:** Phase 13 · 07 (MCP server)
**Time:** ~45 分钟

## Learning Objectives

- 针对给定 domain，判断应把 capability 暴露为 tool、resource 还是 prompt。
- 实现 `resources/list`、`resources/read`、`resources/subscribe`，并处理 `notifications/resources/updated`。
- 使用 argument templates 实现 `prompts/list` 和 `prompts/get`。
- 识别 host 什么时候把 prompts 呈现为 slash-commands，什么时候作为自动注入的 context。

## The Problem

一个 naive 的 notes app MCP server 会把所有东西都暴露为 tools：`notes_read`、`notes_list`、`notes_search`。这会把每次数据访问都包成一次由模型驱动的 tool call。后果是：

- 模型必须为每个可能受益于 context 的 query 决定是否调用 `notes_read`。
- 只读内容无法被订阅，也无法流式传到 host 的侧边面板。
- Client UIs（Claude Desktop 的 resource attachment panel、Cursor 的 "Include file" picker）无法呈现这些数据。

正确的拆分方式是：把数据暴露为 resource，把会修改状态或需要计算的 actions 暴露为 tools，把可复用的多步 workflows 暴露为 prompts。每个 primitive 都有自己的 UX affordance 和访问模式。

## The Concept

### Tools vs resources vs prompts — 决策规则

| Capability | Primitive |
|------------|-----------|
| 用户想搜索、过滤或转换数据 | tool |
| 用户想让 host 把这些数据作为 context 包含进来 | resource |
| 用户想要一个可以反复运行的模板化 workflow | prompt |

Guideline：如果模型会在每个相关 query 中受益于调用它，它就是 tool。如果用户会受益于把它附加到 conversation，它就是 resource。如果用户想复用的单元是整个多步 workflow，它就是 prompt。

### Resources

`resources/list` 返回 `{resources: [{uri, name, mimeType, description?}]}`。`resources/read` 接收 `{uri}`，返回 `{contents: [{uri, mimeType, text | blob}]}`。

URIs 可以是任何可寻址对象：

- `file:///Users/alice/notes/mcp.md`
- `postgres://my-db/query/SELECT ...`
- `notes://note-14`（自定义 scheme）
- `memory://session-2026-04-22/recent`（server-specific）

`contents[]` 同时支持文本和二进制。二进制使用 `blob` 作为 base64-encoded string，并附带 `mimeType`。

### Resource subscriptions

在 capabilities 中声明 `{resources: {subscribe: true}}`。Client 调用 `resources/subscribe {uri}`。当 resource 变化时，server 发送 `notifications/resources/updated {uri}`。Client 再重新读取。

Use case：一个 notes server 的 resources 是磁盘上的文件；file watcher 触发 update notifications；Claude Desktop 在文件于 host 外部被编辑时，重新把文件拉入 context。

### Resource templates（2025-11-25 addition）

`resourceTemplates` 让你暴露参数化 URI pattern：`notes://{id}`，其中 `id` 是 completion target。Client 可以在 resource picker 中 autocomplete ids。

### Prompts

`prompts/list` 返回 `{prompts: [{name, description, arguments?}]}`。`prompts/get` 接收 `{name, arguments}`，返回 `{description, messages: [{role, content}]}`。

prompt 是一个模板，会填充成 host 提交给其模型的一组 messages。例如，`code_review` prompt 接收 `file_path` argument，返回三条 message sequence：一条 system message、一条带有 file body 的 user message，以及一条带有 reasoning template 的 assistant kickoff。

### Hosts and prompts

Claude Desktop、VS Code 和 Cursor 会在 chat UI 中把 prompts 暴露为 slash-commands。用户输入 `/code_review`，并从表单中选择 arguments。Server 的 prompt 是“用户 shortcut”和“发送给模型的完整 prompt”之间的 contract。

不是每个 client 都已经支持 prompts，请检查 capability negotiation。一个声明了 prompt capability 的 server，如果 client 没有 prompt support，就不会看到这些 slash commands。

### The "list changed" notification

resources 和 prompts 都会在集合发生变化时发出 `notifications/list_changed`。一个刚导入 20 条新 notes 的 notes server 会发出 `notifications/resources/list_changed`；client 重新调用 `resources/list` 来获取新增项。

### Content type conventions

对于文本：`mimeType: "text/plain"`、`text/markdown`、`application/json`。
对于二进制：`image/png`、`application/pdf`，再加上 `blob` 字段。
对于 MCP Apps（Lesson 14）：`ui://` URI 中的 `text/html;profile=mcp-app`。

### Dynamic resources

resource URI 不必对应一个静态文件。`notes://recent` 可以在每次读取时返回最新的五条 notes。`db://query/users/active` 可以执行参数化 query。Server 可以自由动态计算内容。

规则：如果 client 可以按 URI 缓存，那么 URI 必须稳定。如果 computation 是一次性的，URI 应该包含 timestamp 或 nonce，避免 client cache 变旧。

### Subscriptions vs polling

支持 subscription 的 clients 通过 `notifications/resources/updated` 获得 server push。Pre-subscription clients 或不支持它的 hosts 则通过重新读取来 polling。两者都符合 spec。Server 的 capability declaration 会告诉 client 它支持哪一种。

Subscriptions 的成本：server 上的 per-session state（谁订阅了什么）。保持 subscribed set 有界；断开的 clients 应该 timeout。

### Prompts vs system prompts

MCP 中的 prompts 不是 system prompts。Host 的 system prompt（它自己的操作指令）和 MCP prompts（server 提供、由用户调用的模板）并行存在。行为良好的 client 不会让 server prompt 覆盖自己的 system prompt；它会把它们分层叠加。

## Use It

`code/main.py` 扩展了 Lesson 07 的 notes server，加入：

- Per-note resources（`notes://note-1` 等），支持 `resources/subscribe`。
- 一个 `review_note` prompt，会渲染成三条 message template。
- 一个 file-watcher simulation，在 note 被修改时发出 `notifications/resources/updated`。
- 一个 `notes://recent` dynamic resource，始终返回最新的五条 notes。

运行 demo 查看完整流程。

## Ship It

本课产出 `outputs/skill-primitive-splitter.md`。给定一个 proposed MCP server，这个 skill 会把每个 capability 分类为 tool / resource / prompt，并给出 rationale。

## Exercises

1. 运行 `code/main.py`。观察初始 resource list，然后触发一次 note edit，验证 `notifications/resources/updated` event 是否发出。

2. 添加一个 `resources/list_changed` emitter：当新 note 被创建时，发送 notification，让 clients 重新发现。

3. 为 GitHub MCP server 设计三个 prompts：`summarize_pr`、`triage_issue`、`release_notes`。每个都带 argument schemas。Prompt body 应该无需进一步编辑即可运行。

4. 取 Lesson 07 server 中一个已有 tool，判断它应该继续作为 tool，还是拆成 resource + tool pair。用一句话说明理由。

5. 阅读 spec 的 `server/resources` 和 `server/prompts` sections。找出 `resources/read` 中一个很少填充但 spec 支持的字段。Hint：查看 resource content 上的 `_meta`。

## Key Terms

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Resource | “暴露的数据” | host 可读取的 URI-addressable content |
| Resource URI | “指向数据的 pointer” | 带 scheme prefix 的 identifier（`file://`、`notes://` 等） |
| `resources/subscribe` | “监听变化” | 针对特定 URI，由 client opt-in 的 server-push updates |
| `notifications/resources/updated` | “Resource 已变化” | 向 client 发出的信号，表示被订阅的 resource 有新内容 |
| Resource template | “参数化 URI” | 带 completion hints 的 URI pattern，供 host picker 使用 |
| Prompt | “Slash-command template” | 带 argument slots 的命名 multi-message template |
| Prompt arguments | “Template inputs” | host 在渲染前收集的 typed parameters |
| `prompts/get` | “渲染模板” | Server 返回填充后的 message list |
| Content block | “Typed chunk” | `{type: text \| image \| resource \| ui_resource}` |
| Slash-command UX | “用户 shortcut” | Host 把 prompts 呈现为以 `/` 开头的 commands |

## Further Reading

- [MCP — Concepts: Resources](https://modelcontextprotocol.io/docs/concepts/resources) — resource URIs、subscriptions 和 templates
- [MCP — Concepts: Prompts](https://modelcontextprotocol.io/docs/concepts/prompts) — prompt templates 和 slash-command integration
- [MCP — Server resources spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/server/resources) — 完整 `resources/*` message reference
- [MCP — Server prompts spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/server/prompts) — 完整 `prompts/*` message reference
- [MCP — Protocol info site: resources](https://modelcontextprotocol.info/docs/concepts/resources/) — 扩展官方 docs 的 community guide
