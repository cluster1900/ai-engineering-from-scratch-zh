---
name: sampling-loop-designer
description: Migrate model-assisted MCP tools to direct inference or stateless 2026-07-28 MRTR with bounded compatibility sampling.
version: 2.0.0
phase: 13
lesson: 11
tags: [mcp, mrtr, sampling, stateless, migration]
---

为面向协议修订版 `2026-07-28` 的 MCP 服务器设计模型辅助行为。

首先做一个决定：服务器能否直接集成模型提供商？新设计不应再使用已弃用的 Sampling（采样）。除非产品明确要求使用客户端的模型和凭据，否则优先直接集成。

请给出：

1. 架构决策。选择直接推理或兼容性 Sampling，并说明原因。
2. 发现契约。展示 `server/discover`，包含准确的 `supportedVersions`、声明的能力、`ttlMs` 和 `cacheScope`。如果声明工具能力，还须提供确定性的 `tools/list` 描述符，包含有效的对象类型 `inputSchema`、`resultType: "complete"`、服务器身份元数据及缓存提示。
3. 请求封装。每个请求都在 `_meta` 中携带协议版本和客户端能力。版本缺失或不是字符串时使用 `-32602`；版本不受支持时使用 `-32022`，并提供准确的 `supported` 和 `requested` 数据；缺少 Sampling 能力时使用 `-32021`，并提供 `requiredCapabilities` 对象。客户端身份元数据仅供参考。绝不为没有 ID 的通知发送 JSON-RPC 响应；已接受的 HTTP 通知返回无响应体的 `202`。
4. 轮次表。为每一轮 MRTR 指明 `inputRequests` 键、嵌入的请求方法、预期响应模式、验证方式和预算。
5. 重试契约。要求保留原方法和参数，使用新的 JSON-RPC ID、当前轮次的 `inputResponses`，并逐字节回传完全一致的 `requestState`。
6. 状态保护。将 HMAC 或认证加密绑定到已认证的主体、方法、参数摘要、阶段和较短的有效期。
7. 安全策略。定义审批、最大轮数、token 和字节限制、响应验证、日志记录及拒绝行为。
8. 移除计划。如果保留 Sampling，指明将其替换为直接集成的条件和日期。

必须否决：

- 没有记录明确需求，却在新设计中采用已弃用的 Sampling。
- `2026-07-28` 服务器以实时服务器到客户端请求的形式发送 `sampling/createMessage`。
- 使用 `initialize`、`notifications/initialized`、`Mcp-Session-Id` 或隐藏的协议会话状态。
- 使用会影响授权、资源访问或业务逻辑的未签名 `requestState`。
- 重试时复用原 JSON-RPC ID，或更改原参数。
- 客户端模型循环缺少能力检查、审批策略、验证或硬性轮数上限。
- 使用 `includeContext: "allServers"` 或隐式跨服务器上下文。

拒绝规则：

- 拒绝隐蔽的模型调用，以及向用户隐瞒服务器意图的设计。
- 拒绝将模型输出作为身份、授权或用户同意的证明。
- 一次确定性工具调用就足够时，拒绝多轮设计。
- 拒绝将客户端和服务器元数据称为已认证的身份。

输出一页架构说明，涵盖决策、线上消息流程、轮次表、签名状态的内容、安全预算、失败情况和迁移计划。最后给出结论：`direct inference`、`temporary MRTR compatibility` 或 `no model required`。
