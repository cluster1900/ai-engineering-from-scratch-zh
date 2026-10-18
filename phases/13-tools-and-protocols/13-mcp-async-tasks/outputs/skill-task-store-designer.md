---
name: task-store-designer
description: Design durable MCP work with the current Tasks extension, stateless requests, explicit ownership, polling, input updates, and cancellation.
version: 2.0.0
phase: 13
lesson: 13
tags: [mcp, tasks, extension, durable-state, stateless]
---

基于 `io.modelcontextprotocol/tasks` 扩展设计长时间运行的 MCP 工作。

请给出：

1. 适用性判断。解释为什么该操作需要任务，而不是同步 `tools/call`。
2. 能力契约。在 `server/discover` 中展示准确的 `supportedVersions`、能力、`ttlMs` 和 `cacheScope`，并在逐请求客户端能力中声明 Tasks 扩展。如果声明工具能力，还须提供确定性的 `tools/list` 描述符，包含有效的对象类型 `inputSchema`、服务器身份元数据和缓存提示。缺少扩展时，使用 `-32021` 并提供 `requiredCapabilities` 对象；版本不受支持时，使用 `-32022` 并提供准确的 `supported` 和 `requested` 数据。
3. 创建事务。先持久化任务，确保 `tasks/get` 可以查询到它，再返回由服务器决定的 `resultType: "task"`。
4. 状态结构。包含 `taskId`、`status`、`statusMessage`、ISO 时间戳、`ttlMs`、`pollIntervalMs`、权威所有者、原操作引用、结果或错误、待处理输入请求，以及所有已发出的输入键。已完成任务内嵌的 `CallToolResult` 必须包含 `resultType: "complete"`，且应包含自己的 `io.modelcontextprotocol/serverInfo` 元数据。
5. 当前方法。定义 `tasks/get`、`tasks/update` 和 `tasks/cancel`。使用 Streamable HTTP 时，每个请求将 `Mcp-Name` 设为 `params.taskId`。不要引入 `tasks/status`、`tasks/result` 或 `tasks/list`。
6. 输入续接。区分创建前的 MRTR 与创建后的 `tasks/get` 加 `tasks/update`。要求输入键在整个任务生命周期内唯一，并支持部分响应处理。
7. 持久化方案。选择原子文件系统存储、事务数据库，或共享队列与存储。包含工作进程租约和重启行为。
8. 所有权策略。按租户和主体为每个任务方法及订阅授权。绝不能将知晓任务 ID 视为拥有权限。
9. 取消契约。说明取消确认只表示协作式处理，不一定最终进入 `cancelled` 状态。
10. 可选通知。在 POST 响应 SSE 流上使用 `subscriptions/listen` 和 `notifications/tasks`，同时将轮询作为基本方案。在确认响应和每条任务通知中加入 `io.modelcontextprotocol/subscriptionId`，其值等于监听请求的 ID。没有 ID 的通知不接收 JSON-RPC 响应；已接受的 HTTP 通知返回无响应体的 `202`。
11. 过期策略。从创建时刻起计算 `ttlMs`，定义清理行为，并避免泄露其他租户的任务是否存在。
12. 迁移映射。将由客户端请求任务的标记和已移除的实验性方法替换为当前扩展流程。

必须否决：

- 在任务持久化并可读之前返回任务句柄。
- 向未声明该扩展的请求返回 `resultType: "task"`。
- 将 `params._meta.task.required`、`tasks/status`、`tasks/result` 或 `tasks/list` 用作当前 API。
- 将 `initialize`、`Mcp-Session-Id`、粘性路由或隐藏的传输会话状态用作任务存储。
- 将 `tasks/cancel` 确认视为工作进程已停止的证明。
- 在同一任务生命周期内复用 `inputRequests` 键。
- 将任务返回给并非其权威所有者的调用方。
- 通过独立 GET、会话 SSE 或 `Last-Event-ID` 重放来交付通知。

拒绝规则：

- 对快速且确定性的查询，除非调用方给出具体的持久化需求，否则拒绝使用任务。
- 如果工作必须在进程重启后继续，拒绝仅驻留内存的生产存储方案。
- 拒绝无大小限制的结果载荷；大型产物应存放在外部，并返回已授权的资源句柄。
- 拒绝缺少明确租户所有权、过滤、分页和保留策略的历史查询端点。

输出一页设计，涵盖生命周期表、线上方法、持久化事务、所有权规则、输入流程、轮询频率、取消语义、可选订阅、过期清理、失败模型和旧版迁移映射。
