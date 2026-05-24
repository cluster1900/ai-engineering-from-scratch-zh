# 构建 MCP Server — Python + TypeScript SDKs

> 大多数 MCP tutorials 只展示 stdio hello-world。真正的 server 会暴露 tools、resources 和 prompts，处理 capability negotiation，发出 structured errors，并且在不同 SDKs 中行为一致。本课端到端构建一个 notes server：stdlib stdio transport、JSON-RPC dispatch、三个 server primitives，以及一种 pure-function 风格，等你进阶后可以直接放进 Python SDK 的 FastMCP 或 TypeScript SDK。

**Type:** Build
**Languages:** Python (stdlib, stdio MCP server)
**Prerequisites:** Phase 13 · 06 (MCP fundamentals)
**Time:** ~75 分钟

## 学习目标
- 实现 `initialize`、`tools/list`、`tools/call`、`resources/list`、`resources/read`、`prompts/list` 和 `prompts/get` methods。
- 编写一个 dispatch loop，从 stdin 读取 JSON-RPC messages，并向 stdout 写入 responses。
- 按照 JSON-RPC 2.0 spec 和 MCP 的附加 codes 发出 structured error responses。
- 在不重写 tool logic 的情况下，将 stdlib implementation 进阶到 FastMCP（Python SDK）或 TypeScript SDK。

## 问题
在你能使用 remote transport（Phase 13 · 09）或 auth layer（Phase 13 · 16）之前，需要一个干净的 local server。Local 意味着 stdio：server 由 client 作为 child process 启动，messages 通过 stdin/stdout 逐行流动。

2025-11-25 spec 规定 stdio messages 编码为 JSON objects，并带有显式的 `\n` separator。这里没有 SSE；SSE 是旧的 remote mode，并将在 2026 年中移除（Atlassian 的 Rovo MCP server 已于 2026 年 6 月 30 日弃用它；Keboola 于 2026 年 4 月 1 日弃用）。对于 stdio，每行一个 JSON object 就是完整的 wire format。

notes server 是一个很好的形状，因为它会练到全部三个 server primitives。Tools 做 mutation（`notes_create`）。Resources 暴露 data（`notes://{id}`）。Prompts 提供 templates（`review_note`）。本课的形状可以泛化到任何 domain。

## 概念
### Dispatch loop

```
loop:
  line = stdin.readline()
  msg = json.loads(line)
  if has id:
    handle request -> write response
  else:
    handle notification -> no response
```

三条规则：

- 不要向 stdout 打印任何不是 JSON-RPC envelope 的内容。Debug logs 写到 stderr。
- 每个 request MUST 匹配一个带有相同 `id` 的 response。
- Notifications MUST NOT 被响应。

### 实现 `initialize`

```python
def initialize(params):
    return {
        "protocolVersion": "2025-11-25",
        "capabilities": {
            "tools": {"listChanged": True},
            "resources": {"listChanged": True, "subscribe": False},
            "prompts": {"listChanged": False},
        },
        "serverInfo": {"name": "notes", "version": "1.0.0"},
    }
```

只声明你支持的内容。client 依赖 capability set 来 gate features。

### 实现 `tools/list` 和 `tools/call`

`tools/list` 返回 `{tools: [...]}`，其中每个 entry 都有 `name`、`description`、`inputSchema`。`tools/call` 接收 `{name, arguments}`，并返回 `{content: [blocks], isError: bool}`。

Content blocks 是有类型的。最常见的有：

```json
{"type": "text", "text": "Found 2 notes"}
{"type": "resource", "resource": {"uri": "notes://14", "text": "..."}}
{"type": "image", "data": "<base64>", "mimeType": "image/png"}
```

Tool errors 有两种形状。Protocol-level errors（unknown method、bad params）是 JSON-RPC errors。Tool-level errors（valid call，但 tool 失败）会作为 `{content: [...], isError: true}` 返回。这让模型能在其 context 中看到失败。

### 实现 resources

Resources 按设计是 read-only。`resources/list` 返回 manifest；`resources/read` 返回 content。URIs 可以是 `file://...`、`http://...`，或像 `notes://` 这样的 custom scheme。

当你把 data 作为 resource 而不是 tool 暴露时：

- 模型不会“call”它；client 可以按 user request 将它注入 context。
- Subscriptions 允许 server 在 resource 变化时 push updates（Phase 13 · 10）。
- Phase 13 · 14 用 `ui://` 将其扩展到 interactive resources。

### 实现 prompts

Prompts 是带 named arguments 的 templates。host 会把它们作为 slash-commands 展示。`review_note` prompt 可以接收一个 `note_id` argument，并生成一个 multi-message prompt template，client 再把它喂给自己的模型。

### Stdio transport 细节

- Newline-delimited JSON。没有 length-prefixed framing。
- 不要 buffer。每次写入后调用 `sys.stdout.flush()`。
- client 控制 lifetime。当 stdin 关闭（EOF）时，干净退出。
- 不要静默处理 SIGPIPE；记录日志并退出。

### Annotations

每个 tool 都可以携带 `annotations` 来描述 safety properties：

- `readOnlyHint: true` — pure read，可安全重试。
- `destructiveHint: true` — 不可逆 side effects；client 应确认。
- `idempotentHint: true` — 相同 inputs 产生相同 outputs。
- `openWorldHint: true` — 与 external systems 交互。

client 使用这些来决定 UX（confirmation dialogs、status indicators）和 routing（Phase 13 · 17）。

### Graduation path

`code/main.py` 中的 stdlib server 大约 180 行。FastMCP（Python）将同样的 logic 压缩为 decorator-style：

```python
from fastmcp import FastMCP
app = FastMCP("notes")

@app.tool()
def notes_search(query: str, limit: int = 10) -> list[dict]:
    ...
```

TypeScript SDK 有等价的形状。准备好后，graduation path 可以直接替换；概念（capabilities、dispatch、content blocks）是相同的。

## 使用它
`code/main.py` 是一个完整的 notes MCP server，基于 stdio 且只使用 stdlib。它处理 `initialize`、三个 tools（`notes_list`、`notes_search`、`notes_create`）的 `tools/list` 和 `tools/call`、每条 note 的 `resources/list` 和 `resources/read`，以及一个 `review_note` prompt。你可以通过 pipe JSON-RPC messages 来驱动它：

```
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | python main.py
```

需要关注的点：

- dispatcher 是一个 `dict[str, Callable]`，以 method name 为 key。
- 每个 tool executor 返回 content blocks 列表，而不是 bare string。
- 当 executor 抛出异常时设置 `isError: true`。

## 交付它
本课产出 `outputs/skill-mcp-server-scaffolder.md`。给定一个 domain（notes、tickets、files、database），该 skill 会 scaffold 一个 MCP server，并带有合适的 tools / resources / prompts 划分以及 SDK graduation path。

## 练习
1. 运行 `code/main.py`，并用手写 JSON-RPC messages 驱动它。练习 `notes_create`，然后用 `resources/read` 取回新 note。

2. 添加一个带有 `annotations: {destructiveHint: true}` 的 `notes_delete` tool。验证 client 会展示 confirmation dialog（这需要真实 host；Claude Desktop 可用）。

3. 实现 `resources/subscribe`，让 server 在 note 被修改时 push `notifications/resources/updated`。添加 keepalive task。

4. 将 server 移植到 FastMCP。Python 文件应缩小到 80 行以内。wire behavior 必须完全一致；用同一个 JSON-RPC test harness 验证。

5. 阅读 spec 的 `server/tools` section，并找出一个本课 server 未实现的 tool definition 字段。（提示：有好几个；选一个并添加。）

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MCP server | “暴露 tools 的东西” | 通过 stdio 或 HTTP 说 MCP JSON-RPC 的 process |
| stdio transport | “Child process model” | Server 由 client 启动；通过 stdin/stdout 通信 |
| Dispatcher | “Method router” | JSON-RPC method name 到 handler function 的 map |
| Content block | “Tool result chunk” | tool response 的 `content` array 中的 typed element |
| `isError` | “Tool-level failure” | 表示 tool 失败；与 JSON-RPC error 区分开 |
| Annotations | “Safety hints” | readOnly / destructive / idempotent / openWorld flags |
| FastMCP | “Python SDK” | 构建在 MCP protocol 之上的 decorator-based higher-level framework |
| Resource URI | “Addressable data” | 标识 resource 的 `file://`、`db://` 或 custom scheme |
| Prompt template | “Slash-command brief” | server 提供的 template，带有供 host UIs 使用的 argument slots |
| Capability declaration | “Feature toggle” | 在 `initialize` 中声明的 per-primitive flags |

## 延伸阅读
- [Model Context Protocol — Python SDK](https://github.com/modelcontextprotocol/python-sdk) — Python 参考实现
- [Model Context Protocol — TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — 并行的 TS implementation
- [FastMCP — server framework](https://gofastmcp.com/) — 用于 MCP servers 的 decorator-style Python API
- [MCP — Quickstart server guide](https://modelcontextprotocol.io/quickstart/server) — 使用任一 SDK 的 end-to-end tutorial
- [MCP — Server tools spec](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) — tools/* messages 的完整 reference
