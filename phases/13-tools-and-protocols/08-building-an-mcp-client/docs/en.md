# 构建 MCP Client — Discovery、Invocation、Session Management

> 大多数 MCP 内容会提供 server tutorial，却对 client 一笔带过。Client code 才是复杂 orchestration 所在：process spawning、capability negotiation、跨多个 server 合并 tool list、sampling callbacks、reconnection，以及 namespace collision resolution。本课会构建一个 multi-server client，把三个不同的 MCP server 提升到一个给模型使用的扁平 tool namespace 中。

**Type:** Build
**Languages:** Python (stdlib, multi-server MCP client)
**Prerequisites:** Phase 13 · 07 (building an MCP server)
**Time:** ~75 minutes

## 学习目标
- 将 MCP server 作为 child process 启动，完成 `initialize`，并发送 `notifications/initialized`。
- 维护 per-server session state（capabilities、tool list、last-seen notification ids）。
- 将多个 server 的 tool list 合并为一个 namespace，并处理 collision。
- 将 tool call 路由到拥有它的 server，并重新组装 response。

## 问题
真实的 agent host（Claude Desktop、Cursor、Goose、Gemini CLI）会同时加载多个 MCP server。用户可能同时运行 filesystem server、Postgres server 和 GitHub server。Client 的工作是：

1. 启动每个 server。
2. 独立与每个 server 完成 handshake。
3. 对每个 server 调用 `tools/list` 并 flatten 结果。
4. 当模型发出 `notes_search` 时，在合并后的 namespace 中查找它，并路由到正确的 server。
5. 处理来自任意 server 的 notifications（`tools/list_changed`），且不阻塞。
6. 在 transport failure 时重连。

手写这一整套逻辑，是区分 "toy" 和 "serviceable" 的关键。官方 SDKs 会封装这些内容，但心智模型必须由你自己掌握。

## 概念
### Child-process spawning

使用 `subprocess.Popen`，并设置 `stdin=PIPE, stdout=PIPE, stderr=PIPE`。设置 `bufsize=1`，并使用 text mode 逐行读取。每个 server 是一个 process；client 为每个 server 持有一个 `Popen` handle。

### Per-server session state

每个 server 一个 `Session` object，保存：

- `process` — Popen handle。
- `capabilities` — server 在 `initialize` 时声明的内容。
- `tools` — 最近一次 `tools/list` 的结果。
- `pending` — request id 到等待 response 的 promise/future 的 map。

Requests 本质上是 async 的；发给 server A 的 `tools/call`，不能因为 server B 正在 call 中而被阻塞。可以使用 threads with queues，也可以使用 asyncio。

### Merged namespace

当 client 看到聚合后的 tool list 时，name 可能会 collision。两个 server 可能都暴露 `search`。Client 有三种选择：

1. **Prefix by server name.** `notes/search`、`files/search`。清晰但不美观。
2. **Silent first-come.** 后加载 server 的 `search` 覆盖先前的。风险高；会隐藏 collision。
3. **Collision rejection.** 拒绝加载第二个 server；通知用户。对 security-sensitive hosts 来说最安全。

Claude Desktop 使用 prefix-by-server。Cursor 使用 collision rejection，并给出清晰错误。VS Code MCP 也采用 prefix-by-server。

### Routing

合并后，dispatch table 会映射 `tool_name -> session`。模型按 name 发出 call；client 找到对应 session，并向该 server 的 stdin 写入 `tools/call` message，然后等待 response。

### Sampling callback

如果 server 在 `initialize` 时声明了 `sampling` capability，它可能会发送 `sampling/createMessage`，请求 client 运行它的 LLM。Client 必须：

1. 在 sample resolve 前阻塞发往该 server 的后续 requests，或者在 implementation 支持 concurrency 时进行 pipeline。
2. 调用自己的 LLM provider。
3. 将 response 发回 server。

Lesson 11 会端到端覆盖 sampling。本课为了完整性会 stub 它。

### Notification handling

`notifications/tools/list_changed` 表示需要重新调用 `tools/list`。`notifications/resources/updated` 表示如果该 resource 正在使用中，就重新读取它。Notifications 不应产生 responses，不要尝试 ack 它们。

一个常见 client bug：在 `tools/call` 上阻塞 read loop，导致 notification 留在 stream 中。使用 background reader thread，把每条 message 推入 queue；main thread 从 queue 中取出并 dispatch。

### Reconnection

Transport 可能失败：server 崩溃、OS 杀掉 process、stdio pipe 断开。Client 检测 stdout 上的 EOF，并将该 session 视为 dead。可选策略：

- 静默重启 server 并重新 handshake。适合纯 read-only servers。
- 向用户暴露 failure。适合带有 user-visible sessions 的 stateful servers。

Phase 13 · 09 会覆盖 Streamable HTTP reconnection semantics；stdio 更简单。

### Keepalive and session id

Streamable HTTP 使用 `Mcp-Session-Id` header。Stdio 没有 session id，process identity 就是 session。Keepalive pings 是可选的；stdio pipes 不会因为 inactivity 而断开。

## 使用它
`code/main.py` 会将三个模拟 MCP servers 作为 subprocesses 启动，与每个 server handshake，合并它们的 tool list，并将 tool calls 路由到正确的 server。这些 "servers" 实际上是运行 toy responders 的其他 Python processes（没有真实 LLM）。运行它可以看到：

- 三次 initialization，每个都有自己的 capability set。
- 三个 `tools/list` 结果合并成一个 7-tool namespace。
- 基于 tool name 的 routing decision。
- 通过 namespace prefixing 防止 collision。

需要关注：

- `Session` dataclass 清晰地保存 per-server state。
- Background reader thread 会从 stdout 取出每一行，不阻塞 main thread。
- Dispatch table 是一个简单的 `dict[str, Session]`。
- Collision handling 是显式的：当两个 server 声明相同 name 时，后一个会带 prefix 重命名。

## 交付它
本课会产出 `outputs/skill-mcp-client-harness.md`。给定一个声明式 MCP servers 列表（name、command、args），该 skill 会生成一个 harness，用于启动它们、合并 tool lists，并交付一个带 collision resolution 的 routing function。

## 练习
1. 运行 `code/main.py` 并观察 server spawn log。用 SIGTERM 杀掉其中一个模拟 server process，观察 client 如何检测 EOF 并将该 session 标记为 dead。

2. 实现 namespace prefixing。当两个 server 暴露 `search` 时，将第二个重命名为 `<server>/search`。更新 dispatch table，并验证 tool calls 是否正确路由。

3. 为 server restart 添加 connection-pool-style backoff：连续失败时 exponential backoff，上限 30 秒，三次失败后向用户发出 notification。

4. 设计一个支持 100 个并发 MCP servers 的 client。什么 data structure 可以替代简单的 dispatch dict？（提示：用于 prefix namespacing 的 trie，加上每个 server 的 tool count metric。）

5. 将 client 移植到官方 MCP Python SDK。SDK 会封装 `stdio_client` 和 `ClientSession`。代码应从约 200 行缩减到约 40 行，同时保留 multi-server routing。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MCP client | "The agent host" | 启动 servers 并 orchestrate tool calls 的 process |
| Session | "Per-server state" | Capabilities、tool list，以及 pending-request bookkeeping |
| Merged namespace | "One tool list" | 所有 active servers 的扁平 tool names 集合 |
| Namespace collision | "Two servers same tool" | Client 必须对重复项 prefix、reject 或 first-come |
| Routing | "Who gets this call?" | 从 tool name dispatch 到拥有它的 server |
| Background reader | "Non-blocking stdout" | 将 server stdout drain 到 queue 的 thread 或 task |
| Sampling callback | "LLM-as-a-service" | Client handler，用于处理 server 发来的 `sampling/createMessage` |
| `notifications/*_changed` | "Primitive mutated" | 提示 client 必须重新 discover 或重新 read 的 signal |
| Reconnection policy | "When server dies" | Transport 失败时的 restart semantics |
| Stdio session | "Process = session" | 没有 session id；child process lifetime 就是 session |

## 延伸阅读
- [Model Context Protocol — Client spec](https://modelcontextprotocol.io/specification/2025-11-25/client) — 权威 client behavior
- [MCP — Quickstart client guide](https://modelcontextprotocol.io/quickstart/client) — 使用 Python SDK 的 hello-world client tutorial
- [MCP Python SDK — client module](https://github.com/modelcontextprotocol/python-sdk) — 参考 `ClientSession` 和 `stdio_client`
- [MCP TypeScript SDK — Client](https://github.com/modelcontextprotocol/typescript-sdk) — TS 对应版本
- [VS Code — MCP in extensions](https://code.visualstudio.com/api/extension-guides/ai/mcp) — VS Code 如何在单个 editor host 中 multiplex 多个 MCP servers
