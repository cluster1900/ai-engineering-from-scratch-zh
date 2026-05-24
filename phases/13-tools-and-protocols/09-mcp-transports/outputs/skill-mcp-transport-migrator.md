---
name: mcp-transport-migrator
description: 生成从 legacy HTTP+SSE 迁移到 Streamable HTTP 的迁移计划，并保持 session id 连续性和 Origin validation。
version: 1.0.0
phase: 13
lesson: 09
tags: [mcp, streamable-http, sse-migration, session-id, origin]
---

给定一个现有的 HTTP+SSE（legacy）MCP server，生成迁移到单一 endpoint Streamable HTTP 的计划。

产出：

1. Endpoint 重写。将 `/messages` 和 `/sse` 合并为一个 `/mcp`。将 POST 映射到 request handling，GET 映射到 SSE stream，DELETE 映射到 session termination。
2. Session 连续性。首次 POST 时生成新的 `Mcp-Session-Id`。拒绝 client 提供的 ids。如果 client 首先发送 legacy session cookie，则保留 bridging logic。
3. Origin validation。允许明确的 production origins（`https://app.company.com`、`https://claude.ai`、localhost 变体）。对所有其他来源返回 403。
4. Last-event-id replay。为每个 session 保留近期 events 的 ring buffer，以便 reconnects 可以恢复。
5. 弃用窗口。记录 cut-over date 和 60 天 grace period，在此期间 legacy endpoints 通过 301 跳转到新 endpoint，并附带 warning header。

硬性拒绝：
- 任何让两个 endpoints 无限期同时存活的计划。Legacy SSE 将在 2026 年移除。
- 任何由 client 生成 session ids 的计划。这会破坏 cryptographic-randomness 要求。
- 任何没有 Origin validation 的计划。存在 DNS-rebinding vulnerability。

拒绝规则：
- 如果 server 仅限本地（stdio），拒绝迁移到 HTTP；stdio 对本地场景是正确的。
- 如果 server 还没有发布 OAuth，在公开暴露之前先完成 Phase 13 · 16。
- 如果 hosting target 不支持 long-lived HTTP（例如 Vercel free tier），拒绝并推荐 Cloudflare Workers。

Output：一份 migration runbook，包含 endpoint changes、Origin allowlist、session-id plan、deprecation schedule，以及覆盖 initialize、tools/list、streaming notifications、使用 last-event-id reconnect、显式 DELETE 的 test checklist。
