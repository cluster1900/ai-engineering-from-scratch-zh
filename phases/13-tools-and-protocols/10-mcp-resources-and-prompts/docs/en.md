# MCP Resources and Prompts — Tools 之外的 Context 暴露

> Tools 获得了 MCP 90% 的关注。另外两个 server primitives 解决的是不同问题。Resources 暴露可读取的数据；prompts 将可复用模板暴露为 slash-commands。许多 servers 应该使用 resources，而不是把读取操作包装成 tools；也应该使用 prompts，而不是把 workflows 硬编码进 client prompts。本课给出决策规则，并讲解 `resources/*` 和 `prompts/*` messages。

**Type:** Build
**Languages:** Python (stdlib, resource + prompt handler)
**Prerequisites:** Phase 13 · 07 (MCP server)
**Time:** ~45 minutes

## 学习目标
- 针对给定 domain，判断应该将 capability 暴露为 tool、resource，还是 prompt。
- 实现 `resources/list`、`resources/read`、`resources/subscribe`，并处理 `notifications/resources/updated`。
- 使用 argument templates 实现 `prompts/list` 和 `prompts/get`。
- 识别 host 何时将 prompts 呈现为 slash-commands，何时作为 auto-injected context。

## 问题
一个朴素的 notes app MCP server 会把所有内容都暴露成 tools：`notes_read`、`notes_list`、`notes_search`。这会把每一次 data access 都包装成由 model 驱动的 tool call。后果：

- 对于每个可能受益于 context 的 query，model 都必须决定是否调用 `notes_read`。
- Read-only content 无法被订阅，也无法 streaming 到 host 的 side panel。
- Client UIs（Claude Desktop 的 resource attachment panel、Cursor 的 "Include file" picker）无法呈现这些数据。

正确的拆分方式：将数据暴露为 resource，将会变更状态或计算型 actions 暴露为 tools，将可复用的 multi-step workflows 暴露为 prompts。每个 primitive 都有自己的 UX affordance 和 access pattern。

## 概念
### Tools vs resources vs prompts — 决策规则

| Capability | Primitive |
|------------|-----------|
| 用户想要 search、filter 或 transform data | tool |
| 用户想要 host 将这些数据作为 context 包含进来 | resource |
| 用户想要一个可重复运行的 templated workflow | prompt |

Guideline：如果 model 会在每个相关 query 中受益于调用它，它就是 tool。如果用户会受益于把它附加到 conversation，它就是 resource。如果用户想要复用的单位是整个 multi-step workflow，它就是 prompt。

### Resources

`resources/list` 返回 `{resources: [{uri, name, mimeType, description?}]}`。`resources/read` 接收 `{uri}` 并返回 `{contents: [{uri, mimeType, text | blob}]}`。

URIs 可以是任何可寻址对象：

- `file:///Users/alice/notes/mcp.md`
- `postgres://my-db/query/SELECT ...`
- `notes://note-14`（custom scheme）
- `memory://session-2026-04-22/recent`（server-specific）

`contents[]` 同时支持 text 和 binary。Binary 使用 `blob` 作为 base64-encoded string，并搭配 `mimeType`。

### Resource subscriptions

在 capabilities 中声明 `{resources: {subscribe: true}}`。Client 调用 `resources/subscribe {uri}`。当 resource 发生变化时，server 发送 `notifications/resources/updated {uri}`。Client 重新读取。

Use case：一个 notes server，其 resources 是磁盘上的 files；file watcher 触发 update notifications；Claude Desktop 在 host 外部编辑该文件后，将其重新拉取到 context 中。

### Resource templates（2025-11-25 addition）

`resourceTemplates` 让你暴露 parameterized URI pattern：`notes://{id}`，其中 `id` 是 completion target。Client 可以在 resource picker 中 autocomplete ids。

### Prompts

`prompts/list` 返回 `{prompts: [{name, description, arguments?}]}`。`prompts/get` 接收 `{name, arguments}` 并返回 `{description, messages: [{role, content}]}`。

Prompt 是一个 template，会填充成 host 提供给其 model 的 messages 列表。例如，`code_review` prompt 接收 `file_path` argument，并返回一个 three-message sequence：一条 system message、一条包含 file body 的 user message，以及一条带 reasoning template 的 assistant kickoff。

### Hosts and prompts

Claude Desktop、VS Code 和 Cursor 会在 chat UI 中把 prompts 暴露为 slash-commands。用户输入 `/code_review`，并从表单中选择 arguments。Server 的 prompt 是 "user shortcut" 与 "full prompt sent to model" 之间的 contract。

并非每个 client 都已经支持 prompts — 请检查 capability negotiation。一个声明了 prompt capability 的 server，如果遇到不支持 prompt 的 client，后者 simply will not see the slash commands。

### “list changed” notification

当集合发生变化时，resources 和 prompts 都会发出 `notifications/list_changed`。一个刚导入 20 条新 notes 的 notes server 会发出 `notifications/resources/list_changed`；client 重新调用 `resources/list` 以获取新增项。

### Content type conventions

For text：`mimeType: "text/plain"`、`text/markdown`、`application/json`。
For binary：`image/png`、`application/pdf`，外加 `blob` field。
For MCP Apps（Lesson 14）：`ui://` URI 中的 `text/html;profile=mcp-app`。

### Dynamic resources

Resource URI 不必对应 static file。`notes://recent` 可以在每次读取时返回最新的五条 notes。`db://query/users/active` 可以执行 parameterized query。Server 可以自由地动态计算 content。

规则：如果 client 可以按 URI cache，那么 URI 必须稳定。如果 computation 是 one-shot，URI 应包含 timestamp 或 nonce，这样 client cache 不会变陈旧。

### Subscriptions vs polling

支持 subscription 的 clients 通过 `notifications/resources/updated` 获得 server push。Pre-subscription clients 或不支持它的 hosts 会通过重新读取来 polling。两者都符合 spec。Server 的 capability declaration 会告诉 client 它支持哪一种。

Subscriptions 的成本：server 上的 per-session state（谁订阅了什么）。保持 subscribed set 有界；断开的 clients 应该 timeout。

### Prompts vs system prompts

MCP 中的 prompts 不是 system prompts。Host 的 system prompt（它自己的 operating instructions）和 MCP prompts（由用户调用的 server-supplied templates）并排存在。行为良好的 client 不会让 server prompt 覆盖自己的 system prompt；它会将它们分层叠加。

## 使用它
`code/main.py` 扩展了 Lesson 07 的 notes server，加入：

- Per-note resources（`notes://note-1` 等），支持 `resources/subscribe`。
- 一个 `review_note` prompt，会渲染成 three-message template。
- 一个 file-watcher simulation，在 note 被修改时发出 `notifications/resources/updated`。
- 一个 `notes://recent` dynamic resource，始终返回最新的五条 notes。

运行 demo 以查看完整 flow。

## 交付它
本课产出 `outputs/skill-primitive-splitter.md`。给定一个拟议的 MCP server，该 skill 会将每个 capability 分类为 tool / resource / prompt，并给出 rationale。

## 练习
1. 运行 `code/main.py`。观察初始 resource list，然后触发一次 note edit，并验证 `notifications/resources/updated` event 被触发。

2. 添加一个 `resources/list_changed` emitter：创建新 note 时，发送 notification，让 clients 重新 discover。

3. 为 GitHub MCP server 设计三个 prompts：`summarize_pr`、`triage_issue`、`release_notes`。每个都包含 argument schemas。Prompt body 应该无需进一步编辑即可运行。

4. 选择 Lesson 07 server 中的一个现有 tool，判断它应该保留为 tool，还是拆分成 resource plus tool pair。用一句话说明理由。

5. 阅读 spec 的 `server/resources` 和 `server/prompts` sections。找出 `resources/read` 中一个很少填充但 spec-supported 的 field。Hint：查看 resource content 上的 `_meta`。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Resource | "暴露的数据" | host 可以读取的 URI-addressable content |
| Resource URI | "指向数据的指针" | 带 scheme 前缀的 identifier（`file://`、`notes://` 等） |
| `resources/subscribe` | "监听变化" | 针对特定 URI 的 client-opt-in server-push updates |
| `notifications/resources/updated` | "Resource changed" | 通知 client：已订阅的 resource 有新内容 |
| Resource template | "Parameterized URI" | 带有 host picker completion hints 的 URI pattern |
| Prompt | "Slash-command template" | 带 argument slots 的命名 multi-message template |
| Prompt arguments | "Template inputs" | host 在渲染前收集的 typed parameters |
| `prompts/get` | "Render template" | server 返回填充后的 message list |
| Content block | "Typed chunk" | `{type: text | image | resource | ui_resource}` |
| Slash-command UX | "User shortcut" | host 将 prompts 呈现为以 `/` 开头的 commands |

## 延伸阅读
- [MCP — Concepts: Resources](https://modelcontextprotocol.io/docs/concepts/resources) — resource URIs、subscriptions 和 templates
- [MCP — Concepts: Prompts](https://modelcontextprotocol.io/docs/concepts/prompts) — prompt templates 和 slash-command integration
- [MCP — Server resources spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/server/resources) — 完整的 `resources/*` message reference
- [MCP — Server prompts spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/server/prompts) — 完整的 `prompts/*` message reference
- [MCP — Protocol info site: resources](https://modelcontextprotocol.info/docs/concepts/resources/) — 在 official docs 基础上扩展的 community guide
