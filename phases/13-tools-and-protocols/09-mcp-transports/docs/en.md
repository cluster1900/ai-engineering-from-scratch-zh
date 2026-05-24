# MCP Transports — stdio vs Streamable HTTP vs SSE 迁移

> stdio 只适合本地，别处都不适合。Streamable HTTP (2025-03-26) 是远程标准。旧的 HTTP+SSE transport 已被弃用，并将在 2026 年中期移除。选错 transport 会带来一次迁移成本；选对 transport 会得到一个可远程托管的 MCP server，并具备 session continuity 和 DNS-rebinding 防护。

**Type:** Learn
**Languages:** Python (stdlib, Streamable HTTP endpoint skeleton)
**Prerequisites:** Phase 13 · 07, 08 (MCP server and client)
**Time:** ~45 minutes

## 学习目标
- 根据 deployment shape（local vs remote、single-process vs fleet）在 stdio 和 Streamable HTTP 之间做选择。
- 实现 Streamable HTTP single-endpoint pattern：POST 用于 requests，GET 用于 session stream。
- 强制执行 `Origin` validation 和 session-id semantics，以防御 DNS-rebinding。
- 在 2026 年中期移除截止日期之前，将 legacy HTTP+SSE server 迁移到 Streamable HTTP。

## 问题
第一个 MCP remote transport（2024-11）是 HTTP+SSE：两个 endpoints，一个用于 client 的 POST，另一个 Server-Sent-Events channel 用于 server-to-client stream。它能工作。但它也很笨重：每个 session 两个 endpoints，某些 CDN 前面的 caches 会失效，并且强依赖 long-lived SSE connections，而有些 WAF 会激进地终止这些连接。

2025-03-26 spec 用 Streamable HTTP 替代了它：一个 endpoint，POST 用于 client requests，GET 用于建立 session stream，二者共享一个 `Mcp-Session-Id` header。自那以后构建或迁移的每个 server 都使用 Streamable HTTP。旧的 SSE mode 正在被弃用：Atlassian Rovo 于 2026 年 6 月 30 日移除它；Keboola 于 2026 年 4 月 1 日移除；大多数剩余 enterprise servers 会在 2026 年底前移除。

而 stdio 对本地 servers 仍然重要。Claude Desktop、VS Code 以及每个 IDE-shaped client 都通过 stdio 启动 servers。正确的 mental model：stdio 用于“这台机器”，Streamable HTTP 用于“通过网络”。不要交叉使用。

## 概念
### stdio

- Child-process transport。Client 启动 server，通过 stdin/stdout 通信。
- 每行一个 JSON object。Newline-delimited。
- 没有 session id；process identity 就是 session。
- 不需要 auth（child 继承 parent 的 trust boundary）。
- 永远不要用于 remote servers；否则你需要 SSH 或 socat 来 tunnel，那时就应该使用 Streamable HTTP。

### Streamable HTTP

单 endpoint `/mcp`（或任何 path）。支持三种 HTTP methods：

- **POST /mcp.** Client 发送 JSON-RPC message。Server 返回单个 JSON response，或一个包含一个或多个 responses 的 SSE stream（对 batched responses 以及与该 request 相关的 notifications 很有用）。
- **GET /mcp.** Client 打开一个 long-lived SSE channel。Server 用它发送 server-to-client requests（sampling、notifications、elicitation）。
- **DELETE /mcp.** Client 显式终止 session。

Sessions 由 `Mcp-Session-Id` header 标识：server 在第一次 response 上设置它，client 在之后每个 request 中回传它。Session ids MUST 是 cryptographically random（128+ bits）；出于安全考虑，拒绝 client-chosen ids。

### Single endpoint vs two

旧 spec 中的 two-endpoint mode 在 2026 年仍然可调用，spec 声明它是“legacy compatible”。但所有新 servers 都应该使用 single-endpoint。官方 SDKs 生成 single-endpoint；只有在与尚未迁移的 remote 通信时才使用 legacy mode。

### `Origin` 校验与 DNS-rebinding

Browsers 目前不是 MCP clients，但攻击者可以构造一个网页，说服 browser 向 `localhost:1234/mcp` 发送 POST，而那里可能正是用户的本地 MCP server 在监听。如果 server 不检查 `Origin`，browser 的 same-origin policy 无法保护它，因为 `Origin: http://evil.com` 是有效的 cross-origin。

2025-11-25 spec 要求 servers 拒绝 `Origin` 不在 allowlist 中的 requests。allowlist 通常包含 MCP client host（`https://claude.ai`、`vscode-webview://*`）以及用于 local UIs 的 localhost variants。

### Session id lifecycle

1. Client 发送第一个 request，不带 `Mcp-Session-Id`。
2. Server 分配一个 random id，并在 response header 上设置 `Mcp-Session-Id`。
3. Client 在所有后续 requests 中回传该 header，并在用于 stream 的 `GET /mcp` 上也回传它。
4. Session 可以被 server 撤销；client 在后续 requests 上看到 404，必须重新 initialize。
5. Client 可以显式 DELETE session 以干净 shutdown。

### Keepalive and reconnect

SSE connections 会断开。Client 通过使用相同的 `Mcp-Session-Id` 重新 GET 来重新建立连接。Server MUST queue outage 期间错过的 events（在合理窗口内），并通过 client 回传的 `last-event-id` header replay。

Phase 13 · 13 讲 Tasks，它们能让 long-running work 即使在 full-session reconnect 后仍然存活。

### 向后兼容性 probe

想同时支持新旧 servers 的 client：

1. POST 到 `/mcp`。
2. 如果 response 是带 JSON 或 SSE 的 `200 OK`，这就是 Streamable HTTP。
3. 如果 response 是 `200 OK`，且 `Content-Type: text/event-stream` 并且有一个指向 secondary endpoint 的 `Location` header，这就是 legacy HTTP+SSE；跟随 `Location`。

### Cloudflare、ngrok 与 hosting

2026 年的生产 remote MCP servers 运行在 Cloudflare Workers（使用它们的 MCP Agents SDK）、Vercel Functions，或 containerized Node/Python 上。关键点：你的 hosting 必须支持 SSE GET 所需的 long-lived HTTP connections。Vercel 的 free tier 限制为 10 秒，不适合。Cloudflare Workers 支持 indefinite streams。

### Gateway composition

当你用 gateway（Phase 13 · 17）为多个 MCP servers 做前置时，gateway 是一个 single Streamable HTTP endpoint，它会改写 session ids 并 multiplex upstream。Tools 在 gateway layer 合并；client 看到的是一个单一 logical server。

### Transport failure modes

- **stdio SIGPIPE.** Child process 在 write 中途死亡会触发 SIGPIPE；servers 应该干净退出。Clients 应该检测 EOF 并将 session 标记为 dead。
- **HTTP 502 / 504.** Cloudflare、nginx 和其他 proxies 会在 upstream failure 时发出这些错误。Streamable HTTP clients 应该在 short backoff 后 retry 一次。
- **SSE connection drop.** TCP RST、proxy timeout 或 client network change 会关闭 stream。Client 使用 `Mcp-Session-Id` 和可选的 `last-event-id` 重新连接以 resume。
- **Session revocation.** Server 使某个 session id 失效；client 在下一个 request 上看到 404。Client 必须重新 handshake。
- **Clock skew.** Client 上的 Resource-TTL 计算与 server 出现偏差。Client 应该把 server timestamps 视为 authoritative。

### 何时绕过 Streamable HTTP

一些企业会在自己的网络内部，把 MCP servers 部署在 gRPC 或 message-queue transports 后面。这是 non-standard：MCP 的 spec 没有正式定义这些。Gateways 可以在内部使用 gRPC，同时向 MCP clients 暴露 Streamable HTTP surface。保持 external surface spec-compliant；gateway 负责 translation。

## 使用它
`code/main.py` 使用 `http.server` (stdlib) 实现一个 minimal Streamable HTTP endpoint。它在 `/mcp` 上处理 POST、GET 和 DELETE，在第一次 response 上设置 `Mcp-Session-Id`，验证 `Origin`，并拒绝来自非 allowlisted origins 的 requests。Handler 复用 Lesson 07 notes server 的 dispatch logic。

要关注的内容：

- POST handler 读取 JSON-RPC body，dispatch，并写入 JSON response（single-response variant；SSE variant 在结构上类似）。
- `Origin` check 会拒绝默认的 `http://evil.example` probe，但接受 `http://localhost`。
- Session ids 是 random 128-bit hex strings；server 在内存中保存 per-session state。

## 交付它
本课产出 `outputs/skill-mcp-transport-migrator.md`。给定一个 HTTP+SSE（legacy）MCP server，该 skill 会生成一份迁移到 Streamable HTTP 的 migration plan，包含 session-id continuity、Origin checks 和 backwards-compatible probe support。

## 练习
1. 运行 `code/main.py`。用 `curl` POST 一个 `initialize`，观察 `Mcp-Session-Id` response header。POST 第二个 request 并回传该 header，验证 session continuity。

2. 添加一个会打开 SSE stream 的 GET handler。每五秒发送一个 `notifications/progress` event。用相同的 session id 重新 GET 来 reconnect，并确认 server 接受它。

3. 实现 `last-event-id` replay logic。Reconnect 时，replay 自该 id 以来生成的所有 events。

4. 扩展 `Origin` validation 以支持 wildcard pattern（`https://*.example.com`），并确认它接受 `https://app.example.com`，但拒绝 `https://evil.example.com.attacker.net`。

5. 从 official registry 中选一个 legacy HTTP+SSE server（有几个可选），勾勒 migration：endpoint handling、session id generation 和 header semantics 会发生什么变化。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| stdio transport | “Local child process” | 通过 stdin/stdout 传输的 JSON-RPC，newline-delimited |
| Streamable HTTP | “The remote transport” | Single-endpoint POST + GET + optional SSE，2025-03-26 spec |
| HTTP+SSE | “Legacy” | 将在 2026 年中期移除的 two-endpoint model |
| `Mcp-Session-Id` | “Session header” | Server-assigned random id，会在每个后续 request 上回传 |
| `Origin` allowlist | “DNS-rebinding defense” | 拒绝 Origin 未获批准的 requests |
| Single endpoint | “One URL” | `/mcp` 处理所有 session operations 的 POST / GET / DELETE |
| `last-event-id` | “SSE replay” | 用于 resume dropped stream 且不遗漏 events 的 header |
| Backwards-compat probe | “Old vs new detection” | 自动选择 transport 的 client response-shape check |
| Long-lived HTTP | “SSE streaming” | Server 在一个 TCP connection 上持续数分钟或数小时推送 events |
| Session revocation | “Force re-init” | Server 使 session id 失效；client 必须再次 handshake |

## 延伸阅读
- [MCP — Basic transports spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) — stdio 和 Streamable HTTP 的 canonical reference
- [MCP — Basic transports spec 2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports) — 引入 Streamable HTTP 的 revision
- [Cloudflare — MCP transport](https://developers.cloudflare.com/agents/model-context-protocol/transport/) — Workers-hosted Streamable HTTP 模式
- [AWS — MCP transport mechanisms](https://builder.aws.com/content/35A0IphCeLvYzly9Sw40G1dVNzc/mcp-transport-mechanisms-stdio-vs-streamable-http) — deployment shapes 之间的 comparison
- [Atlassian — HTTP+SSE deprecation notice](https://community.atlassian.com/forums/Atlassian-Remote-MCP-Server/HTTP-SSE-Deprecation-Notice/ba-p/3205484) — 具体 migration deadline example
