---
name: mcp-transport-migrator
description: 将旧版 MCP HTTP transport 迁移至无状态、仅支持 POST 的 2026-07-28 契约。
version: 2.0.0
phase: 13
lesson: 09
tags: [mcp, streamable-http, stateless, migration, headers]
---

给定一个基于 session 的 Streamable HTTP 或 HTTP+SSE 服务器，为 MCP `2026-07-28` 制定迁移运行手册。

需要产出：

1. Endpoint 映射。定义一个接受 POST 的现代 MCP endpoint。每个 JSON-RPC request 或 notification 都使用新的 POST。
2. Response 映射。对于单个 response，使用 `application/json`；对于相关 notification 后跟最终 response 的情况，使用 request 范围内的 `text/event-stream`。
3. 移除的行为。对于现代 GET 和 DELETE 返回 `405`。忽略 `Mcp-Session-Id` 和 `Last-Event-ID`；绝不创建、回显、撤销或恢复它们。
4. Request metadata。要求每个 body 的 `_meta` 中都包含 protocol version 和 client capabilities，并建议提供 client identity。
5. Header 验证。要求提供 `MCP-Protocol-Version`、`Mcp-Method`，并在适用时提供 `Mcp-Name`。解码 Base64 sentinel，并将 header 与 body 进行比较。不匹配时返回 `-32020`。当 version 匹配但不受支持时返回 `-32022`，且 data key 必须严格为 `supported` 和 `requested`。
6. Subscription 迁移。使用 POST `subscriptions/listen` 替换独立 GET、`resources/subscribe` 和 `resources/unsubscribe`。为 acknowledgement、每个 notification 和最终 result 添加 `io.modelcontextprotocol/subscriptionId`，其值等于 listen request id。
7. State 迁移。使用绑定到已认证 principal 的显式、不透明 application handle 替换 connection affinity。
8. 兼容窗口。将旧版 endpoint 分开保留并清楚标记。在进行任何旧版 fallback 之前，必须先检查现代 POST error。不要使用 `301` 或 `302` redirect POST，因为无法安全保留 method 和 body。
9. 验证。测试 Origin 拒绝、POST media negotiation、body metadata、镜像 header、JSON response、无 body 的已接受 notification `202`、带范围限制的 SSE subscription metadata、GET 和 DELETE `405`、忽略已移除的 header，以及 stream 中断后使用新 id 重试。

严格拒绝：

- 将 session id、独立 GET、DELETE 或 replay 描述为现代行为。
- 通过 process 或 connection memory 在多个 request 之间共享 capabilities。
- 发送服务器发起的 JSON-RPC request。
- 使用 `Last-Event-ID` 恢复现代 SSE stream。
- 在收到可识别的现代 error 后 fallback 到旧版。
- 在迁移期间使用 redirect 转移 JSON-RPC POST。

拒绝规则：

- 在没有 authentication、authorization 和精确 Origin policy 的情况下，拒绝公开暴露服务。
- 拒绝使用隐藏的 sticky routing 替代显式 workflow state。
- 在没有 application idempotency control 的情况下，拒绝自动重试非幂等操作。

输出迁移前后的 endpoint 表、分阶段 rollout、rollback 边界和可执行的 conformance checklist。最后注明移除旧版 route 的确切日期。
