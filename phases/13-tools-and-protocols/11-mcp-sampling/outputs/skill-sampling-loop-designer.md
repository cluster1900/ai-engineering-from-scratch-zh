---
name: sampling-loop-designer
description: 将 Model 辅助型 MCP Tool 迁移到直接 Inference，或迁移到无状态的 2026-07-28 MRTR，并使用有界的兼容性 Sampling。
version: 2.0.0
phase: 13
lesson: 11
tags: [mcp, mrtr, sampling, stateless, migration]
---

为面向协议修订版 `2026-07-28` 的 MCP server 设计 Model 辅助行为。

从一个决策开始：server 能否直接与 Model provider 集成？对于新设计，Sampling 已被弃用。除非使用客户端的 Model 和凭据是一项明确的产品要求，否则应优先选择直接集成。

产出：

1. 架构决策。选择直接 Inference 或兼容性 Sampling，并说明原因。
2. 发现契约。展示 `server/discover`，其中包含准确的 `supportedVersions`、声明的 capabilities、`ttlMs` 和 `cacheScope`。如果声明了 Tool，请包含强制性的确定性 `tools/list` 描述符，其中应有有效的 object `inputSchema`、`resultType: "complete"`、server 身份元数据和缓存提示。
3. 请求封装。在每个请求的 `_meta` 中包含协议版本和客户端 capabilities。版本缺失或不是字符串时使用 `-32602`；版本不受支持时使用 `-32022`，并提供准确的 `supported` 和 `requested` 数据；缺少 Sampling 时使用 `-32021`，并提供 `requiredCapabilities` object。客户端身份元数据仅作为信息使用。绝不为没有 id 的通知发送 JSON-RPC 响应；通过 HTTP 接受的通知应收到无正文的 `202`。
4. 轮次表。对于每轮 MRTR，列出 `inputRequests` key、Embedding请求的 method、预期响应 schema、验证方式和预算。
5. 重试契约。要求保留原始 method 和 arguments，使用新的 JSON-RPC id、当前轮次的 `inputResponses`，并逐字节保持 `requestState` 不变。
6. 状态保护。将 HMAC 或 authenticated encryption 绑定到经过身份验证的主体、method、argument digest、阶段和较短的有效期。
7. 安全策略。定义审批、最大轮数、Token 和字节限制、响应验证、日志记录和拒绝行为。
8. 移除计划。如果仍保留 Sampling，请说明将其替换为直接集成的条件和日期。

硬性拒绝：

- 在没有文档化需求的情况下，让新设计采用已弃用的 Sampling。
- 2026-07-28 server 将 `sampling/createMessage` 作为实时的 server-to-client 请求发送。
- 使用 `initialize`、`notifications/initialized`、`Mcp-Session-Id` 或隐藏的协议 session 状态。
- 使用未签名且会影响授权、资源访问或业务逻辑的 `requestState`。
- 重试时复用原始 JSON-RPC id，或更改原始 arguments。
- 客户端 Model 循环缺少 capability 检查、审批策略、验证和严格轮数上限。
- 使用 `includeContext: "allServers"` 或隐式的跨 server Context。

拒绝规则：

- 拒绝隐蔽的 Model 调用，以及任何向用户隐藏 server 意图的设计。
- 拒绝将 Model 输出作为身份、授权或用户同意的证明。
- 当一次确定性的 Tool 调用已经足够时，拒绝多轮设计。
- 拒绝将客户端和 server 元数据称为经过身份验证的身份。

输出一页架构说明，其中包含决策、线路流程、轮次表、已签名状态的内容、安全预算、失败场景和迁移计划。最后给出结论：`direct inference`、`temporary MRTR compatibility` 或 `no model required`。
