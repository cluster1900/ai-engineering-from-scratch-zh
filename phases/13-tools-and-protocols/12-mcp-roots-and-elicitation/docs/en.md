# Roots and Elicitation — 作用域界定与执行中途用户输入

> 一旦用户打开另一个项目，硬编码路径就会失效。当用户给出的信息不足时，预填的 tool arguments 也会失效。Roots 将 server 限定在一组由用户控制的 URI 内；elicitation 会在 tool call 执行中途暂停，通过表单或 URL 向用户请求结构化输入。两个 client primitives，分别修复常见 MCP failure modes。SEP-1036（URL-mode elicitation，2025-11-25）在 2026 上半年仍属实验性功能 —— 依赖它之前请检查 SDK 版本。

**Type:** Build
**Languages:** Python (stdlib, roots + elicitation demo)
**Prerequisites:** Phase 13 · 07 (MCP server)
**Time:** ~45 minutes

## 学习目标
- 声明 `roots` 并响应 `notifications/roots/list_changed`。
- 将 server 文件操作限制在已声明 root set 内的 URI。
- 使用 `elicitation/create` 在 tool call 执行中途向用户请求确认或结构化输入。
- 在 form-mode 和 URL-mode elicitation 之间做选择（后者是实验性的；已标注 drift-risk）。

## 问题
一个 notes MCP server 在生产环境中会遇到两个具体故障。

**错误的路径假设。** server 按 `~/notes` 编写。另一台机器上的用户把 notes 放在 `~/Documents/Notes`，tool call 会静默失败（找不到文件），更糟的是，可能写入错误位置。

**缺少用户知道的参数。** 用户说“delete the old TPS report note”。模型调用 `notes_delete(title: "TPS report")`，但有三条匹配的 notes，分别来自 2023、2024 和 2025。tool 不能猜。返回 “ambiguous” 很烦；对三条全部执行则是灾难。

Roots 解决第一个问题：client 在 `initialize` 时声明 server 可以触碰的 URI 集合。Elicitation 解决第二个问题：server 暂停 tool call，并发送 `elicitation/create` 让用户选择其中一个。

## 概念
### Roots

client 在 `initialize` 时声明 root list：

```json
{
  "capabilities": {"roots": {"listChanged": true}}
}
```

然后 server 可以调用 `roots/list`：

```json
{"roots": [{"uri": "file:///Users/alice/Documents/Notes", "name": "Notes"}]}
```

Servers 必须把 roots 视为边界：任何 root set 之外的文件读写都要被拒绝。这不是由 client 强制执行的（server 仍然是用户信任的代码），但符合 spec 的 servers 会遵守它。

当用户添加或移除 root 时，client 会发送 `notifications/roots/list_changed`。server 重新调用 `roots/list` 并更新其边界。

### 为什么 roots 是 client primitive

Roots 由 client 声明，因为它们代表用户的同意模型。用户告诉 Claude Desktop：“允许这个 notes server 访问这两个目录”。server 不能扩大这个范围。

### Elicitation：默认 form-mode

`elicitation/create` 接收一个 form schema 加一个自然语言 prompt：

```json
{
  "method": "elicitation/create",
  "params": {
    "message": "Delete 'TPS report'? Multiple notes match; pick one.",
    "requestedSchema": {
      "type": "object",
      "properties": {
        "note_id": {
          "type": "string",
          "enum": ["note-3", "note-7", "note-14"]
        },
        "confirm": {"type": "boolean"}
      },
      "required": ["note_id", "confirm"]
    }
  }
}
```

client 渲染一个表单，收集用户答案，然后返回：

```json
{
  "action": "accept",
  "content": {"note_id": "note-14", "confirm": true}
}
```

三种可能的 action：`accept`（用户已填写）、`decline`（用户关闭）、`cancel`（用户中止整个 tool call）。

Form schemas 是扁平的 —— v1 不支持嵌套 objects。SDKs 通常会拒绝比单层更复杂的任何结构。

### Elicitation：URL mode (SEP-1036, experimental)

2025-11-25 新增。server 发送 URL，而不是 schema：

```json
{
  "method": "elicitation/create",
  "params": {
    "message": "Sign in to GitHub",
    "url": "https://github.com/login/oauth/authorize?client_id=..."
  }
}
```

client 在浏览器中打开 URL，等待完成，并在用户回来时返回。适用于 OAuth flows、payment authorization，以及表单不足以表达的 document signing。

Drift-risk note：SEP-1036 的响应形状仍在稳定中；有些 SDKs 返回 callback URL，另一些返回 completion token。在生产环境使用 URL mode 之前，请阅读你的 SDK release notes。

### 何时 elicitation 是合适的 tool

- 破坏性操作前的用户确认（destructive hint + elicitation）。
- 消歧（从 N 个 matches 中选择一个）。
- 首次运行设置（API keys、directories、preferences）。
- OAuth-style flows（URL mode）。

### When elicitation is wrong

- 填写模型本可以用普通对话询问的 tool required arguments。使用正常的重新提问，而不是 elicitation dialog。
- 高频调用。Elicitation 会打断对话；不要在 loop 内触发它。
- 任何 server 可以事后验证的内容。先验证，返回 error，让模型用文本向用户询问。

### Human-in-the-loop bridge

Elicitation 与 sampling 结合，可以启用 MCP 的 “human-in-the-loop” 模型。server 的 agent loop 可以为用户输入（elicitation）或模型推理（sampling）而暂停。Phase 13 · 11 讲过 sampling；本课讲 elicitation。将二者结合即可获得完整的 mid-loop control。

## 使用它
`code/main.py` 扩展了 notes server，包含：

- `roots/list` 响应，server 会在收到 root-list-changed notifications 后重新查询它。
- 一个 `notes_delete` tool，当多条 notes 匹配时使用 `elicitation/create` 消歧。
- 一个 `notes_setup` tool，使用 URL-mode elicitation 打开首次运行配置页面（模拟）。
- 一个 boundary check，拒绝对已声明 roots 之外 URI 的操作。

demo 运行三个场景：happy path（一个 match）、disambiguation（三个 matches，触发 elicitation）、out-of-root-write（被拒绝）。

## 交付它
本课产出 `outputs/skill-elicitation-form-designer.md`。给定一个可能需要用户确认或消歧的 tool，该 skill 会设计 elicitation form schema 和 message template。

## 练习
1. 运行 `code/main.py`。触发 disambiguation 路径；确认模拟用户答案会被路由回 tool。

2. 添加一个新的 tool `notes_archive`，每次都要求 elicitation confirmation（destructive hint）。检查 UX：这与模型在文本中重新询问相比如何？

3. 为首次运行 OAuth flow 实现 URL-mode elicitation。标注 drift risk，并添加 SDK-version guard。

4. 扩展 `roots/list` 处理：当 notification 到达时，server 应该以原子方式重新读取并重新扫描可能已经超出作用域的 open file handles。

5. 阅读 GitHub 上的 SEP-1036 issue discussion thread。找出一个会影响 servers 如何处理 URL-mode callbacks 的开放问题。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Root | “Consent boundary” | client 已允许 server 触碰的 URI |
| `roots/list` | “Server asks for scope” | Client 返回当前 root set |
| `notifications/roots/list_changed` | “User changed scope” | Client 表示 root set 已发生变化 |
| Elicitation | “Ask the user mid-call” | server 发起的结构化用户输入请求 |
| `elicitation/create` | “The method” | elicitation requests 使用的 JSON-RPC method |
| Form mode | “Schema-driven form” | 在 client UI 中渲染为表单的扁平 JSON Schema |
| URL mode | “Browser redirect” | SEP-1036 实验性功能；打开一个 URL 并等待 |
| `accept` / `decline` / `cancel` | “User response outcomes” | server 处理的三个分支 |
| Disambiguation | “Pick one” | tool 有 N 个 candidates 时常见的 elicitation use case |
| Flat form | “Top-level properties only” | Elicitation schemas 不能嵌套 |

## 延伸阅读
- [MCP — Client roots spec](https://modelcontextprotocol.io/specification/draft/client/roots) — canonical roots reference
- [MCP — Client elicitation spec](https://modelcontextprotocol.io/specification/draft/client/elicitation) — canonical elicitation reference
- [Cisco — MCP elicitation、structured content、OAuth 增强的新变化](https://blogs.cisco.com/developer/whats-new-in-mcp-elicitation-structured-content-and-oauth-enhancements) — 2025-11-25 新增内容讲解
- [MCP — GitHub SEP-1036](https://github.com/modelcontextprotocol/modelcontextprotocol) — URL-mode elicitation proposal（实验性，drift-risk）
- [The New Stack — elicitation 如何把 human-in-the-loop 带入 AI tools](https://thenewstack.io/how-elicitation-in-mcp-brings-human-in-the-loop-to-ai-tools/) — UX 讲解
