---
name: mcp-reliability-reviewer
description: 审查 MCP 取消竞态、deadline、retry、idempotency、SSE flow control 和重连行为。
version: 1.0.0
phase: 13
lesson: 29
tags: [mcp, reliability, cancellation, idempotency, sse, backpressure]
---

审查一个 MCP 操作从请求开始到故障恢复的全过程。

如果缺少以下输入，请主动询问：

1. Transport：stdio 或 Streamable HTTP。
2. 操作语义和副作用。
3. 空闲超时和绝对最大超时。
4. progress-token 行为和速率限制。
5. retry 策略和业务 idempotency 存储。
6. SSE 缓冲区、代理、keepalive 和重连设置。
7. Durable Task 行为（如果操作使用 Tasks 扩展）。

生成以下章节。

## 取消通信

- 对于 stdio，要求客户端发送引用活跃请求 id 的 `notifications/cancelled` notification。
- 对于 Streamable HTTP，要求关闭该请求的响应流。拒绝普通的取消 POST。
- 要求不得对取消 notification 返回 JSON-RPC 响应。
- 将 server 发送的 `notifications/cancelled` 保留用于 stdio `subscriptions/listen` 拆除。
- 说明取消请求未知、格式错误、过晚或无法执行时会发生什么。

## 竞态表

为以下情况给出确定性结果：

| 事件顺序 | Server 最终状态 | 最终响应 | Client 行为 |
|------------|-----------------------|----------------|-----------------|
| 先取消，后完成 | 已取消 | 抑制 | 继续恢复 |
| 先完成，后取消 | 已完成 | 保留 | 忽略迟到的取消 |
| 超时后收到迟到的响应 | 取决于 Transport 的取消 | 根据观测顺序忽略或抑制 | 在不安全 retry 前进行对账 |
| progress 期间断开连接 | 取消进行中的请求 | 无可恢复的流 | 重连并重新获取 |

## Deadline 策略

同时要求空闲超时和绝对最大超时。只有当 progress 有效、单调且受速率限制时，才可以重置空闲时间。Keepalive 注释不算语义 progress。最大超时绝不重置。

## Retry 分类

为每个操作返回一个类别：

- `SAFE`：应用契约证明没有副作用。
- `CONDITIONAL`：mutation 使用一个持久化 idempotency key，并以相同参数重复使用。
- `UNSAFE`：mutation 缺少权威去重机制。

绝不要将新的 JSON-RPC id、Tool annotation 或 Transport 重连视为业务 idempotency。

对于条件 retry，要求存储参数 fingerprint 和已提交结果。拒绝以不同参数重复使用同一个 key。

要求使用一个原子且持久化的 ledger 边界，将 key 声明、参数
fingerprint、业务影响记录和已提交结果纳入其中。进程本地
dictionary 或 lock 不具备持久性，也无法协调多个副本。可以接受
共享数据库 transaction、transactional outbox，或强制使用相同 key
的上游提供方。说明实际纳入该边界的是哪项影响。

返回已提交结果的防御性副本。绝不要暴露 ledger 所持有的可变对象。
使用并发同 key fixture、重新打开 fixture 和 mutation-alias fixture
证明这两项属性。

## Flow control

- 设置明确的每流或每客户端容量。
- 合并可替换的 progress。
- 将被丢弃的 progress 标记为需要权威数据重新获取。
- 保留最终 JSON-RPC 响应。
- 为 SSE 设置 `Content-Type: text/event-stream`、`Cache-Control: no-cache` 和 `X-Accel-Buffering: no`。
- 分别定义 keepalive 周期和操作 progress。
- 拒绝无界队列。

## 重连方案

- 使用新 id 发起新请求。
- 恢复订阅过滤条件。
- 不要在 MCP 2026-07-28 中使用 `Last-Event-ID`。
- 重新获取受影响的资源、列表、Prompt 或 Task。
- 不要自动重放不安全的 mutation。
- 使用带 jitter 且设有上限的 exponential backoff。

## Durable Tasks

当 Task 存在时，将 `tasks/cancel` 与请求取消分开处理。完整的确认仅能证明取消意图已被接受。持续轮询或监听，直到持久化 Task 进入最终状态。

## 必需的 fixture

至少返回以下可执行场景：

1. stdio 在完成前取消；
2. stdio 完成后收到迟到的取消；
3. HTTP 流在完成前关闭；
4. progress 重置空闲超时，但最大超时仍然触发；
5. 使用两个 JSON-RPC id 且没有 idempotency key 的重复 mutation；
6. 使用同一个 key 和相同参数的重复 mutation；
7. 使用不同参数重复使用 key；
8. 慢速消费者超出 progress 缓冲区容量；
9. 流中断后建立新订阅并重新获取权威数据；
10. `tasks/cancel` 确认后，worker 延迟取消；
11. 两个独立 ledger 连接使用同一个 key 和相同参数发生竞态；
12. 调用方修改返回结果后，从持久化记录中进行干净重放。

当 retry 策略仅描述为
“超时后 retry”、ledger 位于进程本地、外部影响位于所声明的原子边界之外
且没有 outbox 或上游 key、返回记录与可变存储存在 alias，或者未指定队列容量时，
拒绝给出可用于生产环境的结论。
