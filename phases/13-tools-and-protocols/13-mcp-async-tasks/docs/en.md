# Async Tasks (SEP-1686) — 面向长时间运行工作的立即调用、稍后获取

> 真实的 agent 工作需要数分钟到数小时：CI runs、deep-research synthesis、batch exports。同步 tool calls 会断开连接、超时，或阻塞 UI。SEP-1686 于 2025-11-25 合并，新增了 Tasks primitive：任何 request 都可以被增强为 task，结果可以稍后获取，或通过 state notifications 流式传输。Drift-risk note：Tasks 在 2026 上半年仍是 experimental；SDK surface 仍在围绕 spec 设计。

**Type:** Build
**Languages:** Python (stdlib, async task state machine)
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 09 (transports)
**Time:** ~75 分钟

## 学习目标
- 识别何时应将一个 tool 从 synchronous 提升为 task-augmented（server-side work 超过 30 秒）。
- 走通 task lifecycle：`working` → `input_required` → `completed` / `failed` / `cancelled`。
- 持久化 task state，使崩溃不会丢失 in-flight work。
- 正确轮询 `tasks/status` 并获取 `tasks/result`。

## 问题
一个 `generate_report` tool 会运行数分钟的 extraction pipeline。在 synchronous model 下的选项：

1. 让连接保持打开三分钟。Remote transports 会断开；clients 会超时；UIs 会冻结。
2. 立即返回一个 placeholder；要求 client 轮询 custom endpoint。破坏 MCP uniformity。
3. Fire-and-forget；没有结果。

这些都不好。SEP-1686 增加了第四种方式：task augmentation。任何 request（通常是 `tools/call`）都可以被标记为 task。Server 立即返回 task id。Client 轮询 `tasks/status`，完成后获取 `tasks/result`。Server-side state 可在重启后保留。

## 概念
### Task augmentation

通过设置 `params._meta.task.required: true`（或 `optional: true`，由 server 决定），request 会变成 task。Server 立即响应：

```json
{
  "jsonrpc": "2.0", "id": 1,
  "result": {
    "_meta": {
      "task": {
        "id": "tsk_9f7b...",
        "state": "working",
        "ttl": 900000
      }
    }
  }
}
```

`ttl` 是 server 对保留 state 的承诺；超过 ttl 后，task result 会被丢弃。

### Per-tool opt-in

Tool annotations 可以声明 task support：

- `taskSupport: "forbidden"` — 这个 tool 始终同步运行。适合快速 tools。
- `taskSupport: "optional"` — client 可以请求 task-augmentation。
- `taskSupport: "required"` — client 必须使用 task augmentation。

`generate_report` tool 会是 `required`。`notes_search` tool 会是 `forbidden`。

### States

```
working  -> input_required -> working  (loop via elicitation)
working  -> completed
working  -> failed
working  -> cancelled
```

State machine 是 append-only：一旦进入 `completed`、`failed` 或 `cancelled`，task 就是 terminal。

### Methods

- `tasks/status {taskId}` — 返回当前 state 和 progress hint。
- `tasks/result {taskId}` — 如果尚未完成，则阻塞或返回 404。
- `tasks/cancel {taskId}` — idempotent；terminal states 会忽略。
- `tasks/list` — optional；枚举 active 和 recently-completed tasks。

### Streaming state changes

当 server 支持时，client 可以订阅 state notifications：

```
server -> notifications/tasks/updated {taskId, state, progress?}
```

使用 stream 而不是 poll 的 clients 会获得更好的 UX。Polling 始终作为最小 surface 被支持。

### Durable state

Spec 要求声明 task support 的 servers 持久化 state。崩溃不应丢失 ttl 内的 completed results。Stores 可以从 SQLite 到 Redis 到 filesystem。Lesson 13 harness 使用 filesystem。

### Cancellation semantics

`tasks/cancel` 是 idempotent。如果 task 正在执行，server 会尝试停止（检查 executor-cooperative cancellation）。如果已经 terminal，该 request 是 no-op。

### Crash recovery

当 server process 重启时：

1. 加载所有持久化的 task states。
2. 将任何 process 已死亡的 `working` tasks 标记为 `failed`，error 为 `CRASH_RECOVERY`。
3. 在它们的 ttl 内保留 `completed` / `failed` / `cancelled`。

### Async tasks plus sampling

一个 task 本身可以调用 `sampling/createMessage`。这就是 long-running research tasks 的工作方式：server 的 task thread 按需采样 client 的 model，同时 client 的 UI 将 task 显示为 `working`，并带有周期性 progress updates。

### Why this is experimental

SEP-1686 于 2025-11-25 发布，但更大的 roadmap 提到了三个 open issues：durable subscription primitives、subtasks（parent-child task relationships）以及 result-TTL standardization。预期 spec 会在 2026 年继续演进。Production code 应只把 Tasks 的 common case 视为 stable，并防范未来 subtasks 相关的 SDK changes。

## 使用它
`code/main.py` 实现了一个 durable task store（filesystem-backed）和一个在 background thread 中运行的 `generate_report` tool。Clients 调用该 tool，立即获得 task id，在 worker 更新 progress 时轮询 `tasks/status`，并在完成后获取 `tasks/result`。Cancellation 可用；crash recovery 通过杀死 worker thread 并重新加载 state 来模拟。

需要关注的内容：

- 持久化到 `/tmp/lesson-13-tasks/<id>.json` 的 Task state JSON。
- Worker thread 更新 `progress` 字段；poll 会显示其推进。
- Client side cancellation 设置一个 event；worker 检查后提前退出。
- “crash” 后重新加载 state，会将 in-flight task 标记为带有 `CRASH_RECOVERY` 的 `failed`。

## 交付它
本课产出 `outputs/skill-task-store-designer.md`。给定一个 long-running tool（research、build、export），该 skill 会设计 task store（state shape、ttl、durability），选择正确的 taskSupport flag，并勾勒 progress notifications。

## 练习
1. 运行 `code/main.py`。启动一个 `generate_report` task，轮询 status，然后获取 result。

2. 在运行过程中添加一个 `tasks/cancel` 调用。验证 worker 会遵守它，并且 state 变为 `cancelled`。

3. 模拟 crash recovery：杀死 worker thread，重启 loader，并观察 `CRASH_RECOVERY` failure mode。

4. 将 store 扩展到 SQLite。Durability 收益相同；query options 会增加（列出 session X 的所有 tasks）。

5. 阅读 2026 年的 MCP roadmap post。找出未来一年最可能影响 SDK API design 的一个 Tasks-related open issue。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Task | “Long-running tool call” | 使用 `_meta.task` 增强、用于 async execution 的 request |
| SEP-1686 | “Tasks spec” | 在 2025-11-25 添加 Tasks 的 Spec Evolution Proposal |
| `_meta.task` | “Task envelope” | 包含 id、state、ttl 的 per-request metadata |
| taskSupport | “Tool flag” | 每个 tool 的 `forbidden` / `optional` / `required` |
| `tasks/status` | “Poll method” | 获取当前 state 和可选 progress hint |
| `tasks/result` | “Fetch result” | 返回 completed payload；如果尚未完成则返回 404 |
| `tasks/cancel` | “Stop it” | Idempotent cancellation request |
| ttl | “Retention budget” | Server 承诺保留 task state 的毫秒数 |
| `notifications/tasks/updated` | “State push” | Server-initiated state-change event |
| Durable store | “Crash-safe state” | Filesystem / SQLite / Redis persistence layer |

## 延伸阅读
- [MCP — GitHub SEP-1686 issue](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1686) — 原始 proposal 和完整讨论
- [WorkOS — MCP async tasks for AI agent workflows](https://workos.com/blog/mcp-async-tasks-ai-agent-workflows) — 带 rationale 的设计 walkthrough
- [DeepWiki — MCP task system and async operations](https://deepwiki.com/modelcontextprotocol/modelcontextprotocol/2.7-task-system-and-async-operations) — 机制和 state machine
- [FastMCP — Tasks](https://gofastmcp.com/servers/tasks) — SDK-level task 实现模式
- [MCP blog — 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — open issues 和包含 subtasks 在内的 2026 priorities
