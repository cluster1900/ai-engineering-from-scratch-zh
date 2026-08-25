---
name: task-store-designer
description: 使用当前 Tasks 扩展、无状态请求、显式所有权、轮询、输入更新和取消机制来设计持久化 MCP 工作。
version: 2.0.0
phase: 13
lesson: 13
tags: [mcp, tasks, extension, durable-state, stateless]
---

基于 `io.modelcontextprotocol/tasks` 扩展设计长时间运行的 MCP 工作。

产出：

1. 适用性决策。解释为什么该操作需要任务，而不能使用同步的 `tools/call`。
2. 能力契约。在 `server/discover` 中展示准确的 `supportedVersions`、capabilities、`ttlMs` 和 `cacheScope`，并在每个请求的客户端 capabilities 中包含 Tasks 扩展。如果公布了 Tools，则应包含强制性的确定性 `tools/list` 描述符，其中具有有效的 object `inputSchema`、服务器身份元数据和缓存提示。当扩展缺失时，使用 `-32021` 并附带 `requiredCapabilities` object；当版本不受支持时，使用 `-32022` 并附带准确的 `supported` 和 `requested` 数据。
3. 创建事务。持久化任务，直到 `tasks/get` 能够解析该任务，然后返回由服务器决定的 `resultType: "task"`。
4. 状态结构。包含 `taskId`、`status`、`statusMessage`、ISO 时间戳、`ttlMs`、`pollIntervalMs`、权威所有者、原始操作引用、结果或错误、待处理的输入请求以及所有已签发的输入 key。已完成任务中嵌套的 `CallToolResult` 必须具有 `resultType: "complete"`，并且应该包含自身的 `io.modelcontextprotocol/serverInfo` 元数据。
5. 当前方法。定义 `tasks/get`、`tasks/update` 和 `tasks/cancel`。对于 Streamable HTTP，每个请求都将 `Mcp-Name` 设置为 `params.taskId`。不要引入 `tasks/status`、`tasks/result` 或 `tasks/list`。
6. 输入延续。将创建前的 MRTR 与创建后的 `tasks/get` 加 `tasks/update` 分开。要求输入 key 在整个任务生命周期内唯一，并处理部分响应。
7. 持久化方案。选择原子文件系统存储、事务型数据库，或共享队列和存储。包含 worker 租约和重启行为。
8. 所有权策略。按 tenant 和 principal 对每个任务方法及订阅进行授权。绝不能将知晓 task id 视为权限。
9. 取消契约。明确说明确认采用协作式语义，且不一定会进入 `cancelled` 状态。
10. 通知选项。在 POST 响应 SSE 流上使用 `subscriptions/listen` 和 `notifications/tasks`，并将轮询作为基准方案。在确认和每个任务通知中放入 `io.modelcontextprotocol/subscriptionId`，其值等于 listen 请求 id。没有 id 的通知不会收到 JSON-RPC 响应；被接受的 HTTP 通知返回不含 body 的 `202`。
11. 过期策略。从创建时刻开始解释 `ttlMs`，定义清理行为，并避免泄露其他 tenant 的任务是否存在。
12. 迁移映射。使用当前扩展流程替换客户端请求的任务 flag 和已移除的实验性方法。

硬性拒绝项：

- 在任务具备持久化读取可见性之前返回任务 handle。
- 向未声明该扩展的请求返回 `resultType: "task"`。
- 将 `params._meta.task.required`、`tasks/status`、`tasks/result` 或 `tasks/list` 用作当前 API。
- 使用 `initialize`、`Mcp-Session-Id`、粘性路由或隐藏的传输会话状态作为任务存储。
- 将 `tasks/cancel` 确认真正视为 worker 已停止的证明。
- 在同一任务生命周期内重复使用 `inputRequests` key。
- 向并非任务权威所有者的调用方返回任务。
- 通过独立 GET、会话 SSE 或 `Last-Event-ID` 重放实现通知传递。

拒绝规则：

- 对快速且确定性的查询拒绝使用任务，除非调用方给出了具体的持久化要求。
- 当工作必须在进程重启后继续存在时，拒绝仅使用内存的生产存储。
- 拒绝无界结果 payload；将大型产物存储在外部，并返回经过授权的 Resource handle。
- 拒绝缺少显式 tenant 所有权、过滤、分页和保留策略的历史记录 endpoint。

输出一页设计，其中包含生命周期表、wire 方法、持久化事务、所有权规则、输入流程、轮询频率、取消语义、订阅选项、过期清理、故障模型和旧版迁移映射。
