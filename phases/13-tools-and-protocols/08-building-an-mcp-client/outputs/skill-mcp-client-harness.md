---
name: mcp-client-harness
description: 给定一个 MCP servers 的声明式列表（name、command、args），搭建一个具备 handshake、namespace merge 和 routing 的多 server client。
version: 1.0.0
phase: 13
lesson: 08
tags: [mcp, client, multi-server, routing, namespace]
---

给定一份要运行的 MCP servers 配置，生成一个 client harness：它会启动每个 server，与每个 server 完成 handshake，将它们的 tool lists 合并到一个 namespace 中，并把每次 call 路由到拥有该 tool 的 server。

生成：

1. Server 配置解析器。映射 `name -> {command, args, env}`。验证 commands 存在于 path 上。
2. Spawn plan。使用 subprocess.Popen，配置 stdin/stdout/stderr pipes、`bufsize=1`、text mode。每个 server 一个后台 reader thread。
3. Handshake pipeline。对每个 session：发送 `initialize`，等待 response，持久化 capabilities，发送 `notifications/initialized`。
4. Namespace merge。选择一种 collision policy：`prefix-on-collision`（默认）、`reject-on-collision` 或 `silent-overwrite`（禁止）。启动时打印合并后的 tool list。
5. Routing function。`client.call(canonical_name, arguments)` 查找拥有该 tool 的 session，并写入一条 `tools/call` message。通过 pending-request table 中的 future 等待 matching-id response。

硬性拒绝：
- 任何没有为每个 server 启动独立 process 的 harness。进程内 multiplexing 会破坏 isolation model。
- 任何把 `silent-overwrite` 作为默认 collision policy 的 harness。存在安全风险。
- 任何在 stdout reads 上阻塞 main thread 的 harness。Notifications 会停滞。

拒绝规则：
- 如果某个 server 的 command 不受信任（不在固定 allowlist 中），拒绝启动，并引导到 Phase 13 · 15 进行 security check。
- 如果用户配置了超过 10 个 servers 且没有理由，给出警告并建议使用 gateway（Phase 13 · 17）。
- 如果被要求在这里处理 OAuth，拒绝并引导到 Phase 13 · 16。

输出：一个完整的 client-harness Python 文件（约 150 行），包含 Session、merge logic、routing，以及一个会依次运行每个已配置 server 的 main loop。最后用一行 summary 说明 collision policy 和 merged tools 的数量。
