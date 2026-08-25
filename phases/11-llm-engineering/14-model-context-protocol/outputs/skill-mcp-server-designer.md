---
name: mcp-server-designer
description: 设计一个具有显式发现、状态、Transport 和安全契约的无状态 MCP 2026-07-28 Server。
version: 2.0.0
phase: 11
lesson: 14
tags: [llm-engineering, mcp, stateless, tool-use]
---

给定一个领域（内部 API、数据库或文件来源）以及将挂载该 Server 的 Hosts，输出：

1. Primitive 映射。哪些能力应成为 `tools`（操作）、哪些应成为 `resources`（只读数据）、哪些应成为 `prompts`（由用户调用的模板）。每个 primitive 一行。
2. 发现契约。草拟 `server/discover`，包含实现明确支持的版本、能力、Server 身份、说明、`ttlMs` 和 `cacheScope`。
3. 请求契约。要求每个请求都在 `params._meta` 中包含字符串类型的 Protocol 版本和对象类型的 Client 能力。建议提供 Client 身份。对于缺失或类型错误的必需元数据，返回 Invalid Params (`-32602`)。只有当请求提供了 Server 未实现的版本字符串时，才返回带有 `data.supported` 和 `data.requested` 的 `UnsupportedProtocolVersionError` (`-32022`)。
4. 结果契约。为每个适用的结果添加 `resultType`、Server 身份元数据、确定性的列表顺序和缓存策略。
5. MRTR 计划。仅对 `tools/call`、`resources/read` 或 `prompts/get` 使用 `input_required`。至少包含 `inputRequests` 或不透明的 `requestState` 之一；使用新的 JSON-RPC ID、所请求输入对应的响应，以及存在时完全一致的状态值重试原始方法。
6. 状态计划。为每个多次调用的工作流定义一个由 Server 生成的不透明句柄，并将其作为普通 Tool 参数传递。不要将状态隐藏在连接或 Protocol 会话背后。
7. Transport 与授权计划。选择 stdio 或 2026-07-28 Streamable HTTP POST 端点。对于 HTTP，定义 Origin 验证和逐请求授权。POST 请求必须包含 `MCP-Protocol-Version`，JSON-RPC 请求必须包含 `Mcp-Method`，只有 `tools/call`、`resources/read` 和 `prompts/get` 必须包含 `Mcp-Name`。被接受的通知 POST 返回不含正文的 HTTP 202。
8. Schema 草案。为每个 Tool 参数编写 JSON Schema，提供适合 Model 选择的描述，并为不可信输入设置明确边界。
9. 破坏性操作列表。使用 `destructiveHint: true` 标记每个会修改状态的 Tool，并要求人工审批。
10. 验证计划。涵盖通知不产生 JSON-RPC 响应、格式错误的消息封装和请求 ID、元数据拒绝、发现、确定性列表、版本不匹配、缓存字段、header 与正文不匹配、授权、审批，以及一个 Prompt injection 案例。

拒绝将 `initialize`、`notifications/initialized`、`Mcp-Session-Id`、独立 HTTP GET、HTTP DELETE 或 `Last-Event-ID` 用作现代路径的设计。只有在一个明确隔离、用于支持截至 2025-11-25 Protocol 版本的适配器中，才允许使用这些机制。不要在新实现中加入已弃用的 Roots、Sampling 或 Logging；必须标明兼容支持，并且 Roots 或 Sampling 输入必须使用 MRTR。拒绝任何在没有授权、验证和审批路径的情况下写入磁盘或调用外部 API 的 Server。
