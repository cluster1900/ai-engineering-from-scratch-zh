# MCP 可靠性、取消与流量控制

> 请求 ID 用于关联消息。它不能保证副作用安全，不能停止 worker，也不能保护 stream 免受慢速消费者影响。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 09 and 13
**Time:** ~120 分钟

## 学习目标

- 为 stdio 和 Streamable HTTP 实现正确的取消信号。
- 解决完成与取消的竞态，避免在取消后发送消息。
- 区分请求取消与持久化 `tasks/cancel` 语义。
- 根据副作用和显式幂等键构建重试决策。
- 限制进度队列，同时保留最终响应。
- 通过重新连接、重新获取和带抖动的退避恢复 stream。

## 问题

正常路径隐藏着代价最高昂的分布式系统 bug。

客户端调用一个 Tool。服务端开始工作。进度陆续到达。代理缓冲 stream。客户端达到超时并断开连接。一毫秒后，服务端完成工作。客户端使用新的 JSON-RPC id 重试。变更操作执行了两次。

每个组件在局部都表现正确，整个系统却在全局层面失败了。

MCP 定义了消息和传输行为，但你的应用仍需负责：

- 时间预算；
- 业务幂等性；
- 有界队列；
- 重试分类；
- 持久 Task 状态；
- 重新连接与重新获取策略。

本课将这些决策构建到一个确定性模拟器中。这里没有 sleep、socket 或随机失败。你可以直接控制取消事件的顺序。一个同步线程测试会强制两个账本客户端竞争同一个幂等键。

## 请求取消取决于传输方式

所有传输方式表达的意图都相同：客户端不再需要正在处理的结果。线上信号则有所不同。

### stdio

stdio 使用一条共享的双向通道。客户端发送一条 notification：

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/cancelled",
  "params": {
    "requestId": 41,
    "reason": "用户关闭了该操作"
  }
}
```

该 notification 发出后无需等待。服务端不会对其发送 JSON-RPC 响应。

服务端应停止工作、释放资源，并避免为已取消的请求发送响应。当请求未知、已完成或无法安全停止时，服务端可以忽略取消。

格式错误、未知以及针对已完成请求的取消 notification 会被忽略。将这些竞态转换为新错误，只会产生更多竞态。

### Streamable HTTP

现代 Streamable HTTP 会为每个请求提供独立的 HTTP 响应或 SSE 响应 stream。客户端通过关闭该请求的响应 stream 来取消请求。

对于普通 HTTP 请求，不要 POST `notifications/cancelled`。stream 关闭就是取消信号。

服务端观察到连接断开后，应停止工作，并且不得再为该请求发送更多消息。

### 服务端发起取消的适用范围很窄

服务端不会使用 `notifications/cancelled` 来取消任意客户端调用。在 stdio 中，服务端发起的取消仅用于终止 `subscriptions/listen` 请求。请将此路径与普通的客户端请求取消分开处理。

## 取消是一种竞态

下面两种事件顺序都有效。

### 取消胜出

```text
请求开始
客户端发送取消信号
服务端将请求标记为已取消
worker 执行到完成点
服务端抑制响应
```

### 完成胜出

```text
请求开始
worker 提交结果
服务端发送响应
取消信号延迟到达
服务端忽略延迟到达的 notification
```

客户端也必须忽略其已经放弃的请求所对应的延迟响应。由于存在网络延迟，任何一方都无法证明另一方先观察到了哪个事件。

```figure
mcp-reliability-race
```

本课的 `RequestCoordinator` 只存储一个终止状态。取消后，`complete()` 不会返回响应。延迟到达的取消无法改变已完成的记录。

## 超时需要两个时钟

单个不活跃计时器是不够的。

请使用两个限制：

1. **空闲超时。** 请求在没有产生活动的情况下最多可以持续多久。
2. **最大超时。** 从请求开始计算的绝对 wall-clock 时间预算。

进度可以重置空闲时钟，但绝不能移除最大截止时间。

```text
开始：0 ms
进度：400 ms
进度：800 ms
进度：1200 ms
空闲超时：500 ms
最大超时：2000 ms
```

在 1500 ms 时，请求仍然活跃，因为距离最近一次进度仅过去 300 ms。在 2000 ms 时，即使另一个进度事件于 1999 ms 到达，最大截止时间也会取消该请求。

进度是可选的。服务端可以接受 progress token，但不发送任何更新。绝不要因为存在 token 就将超时变为无限。

MCP 进度值必须递增。notification 会在完成或取消后停止。请对进度进行速率限制，避免快速 worker 淹没传输通道。

## 请求取消不等于 `tasks/cancel`

这些机制解决的是不同生命周期的问题。

| 机制 | 目标 | 信号 | 成功意味着什么 |
|-----------|--------|--------|--------------------|
| stdio 上的请求取消 | 一个正在处理的 RPC | `notifications/cancelled` | 客户端已放弃请求；服务端应在可行时停止 |
| HTTP 上的请求取消 | 一个正在处理的响应 stream | 关闭 stream | 客户端已放弃请求；服务端应在可行时停止 |
| `tasks/cancel` | 一个持久 Task | 普通 MCP 请求 | 服务端已确认取消意图 |

成功的 `tasks/cancel` 结果不能证明 worker 已停止。Task 可能会一直保持 `working`，直到 worker checkpoint 观察到该标志。工作也可能在到达该 checkpoint 前完成。

HTTP 连接关闭时，不要清除持久 Task 状态。创建 Task 的意义就在于，其生命周期比单个请求和单次连接更长。

## 新的 JSON-RPC ID 不代表幂等性

JSON-RPC id 用于关联请求与响应。它们不能标识业务操作。

假设客户端提交了一笔 id 为 `41` 的扣款，但响应丢失了，于是客户端使用 id `42` 重试。服务端看到的是两条不同消息。没有应用层 key，服务端无法知道它们代表同一次结账。

幂等键用于标识业务意图：

```json
{
  "name": "charge_account",
  "arguments": {
    "account": "acct-7",
    "cents": 1200,
    "idempotencyKey": "checkout-7"
  }
}
```

服务端存储：

- key；
- 操作参数的 fingerprint；
- 已提交的结果。

相同 key 和相同参数会返回已存储的结果。相同 key 与不同参数会被拒绝。这样可以防止意外复用 key，从而改变另一项业务操作。

### 账本边界必须是原子且持久的

以下顺序不安全：

```text
检查 key
执行变更
存储结果
```

两个 worker 可能都观察到 key 不存在，然后都执行变更。在产生效果后、存储前发生崩溃，会让重试产生同样的歧义。

本课使用基于文件的 SQLite 账本。`BEGIN IMMEDIATE` 将 key 检查、模拟业务效果、执行计数器和结果存储串行化到同一个事务中。因此，使用相同 key 进行竞争的两个独立账本连接会观察到一个已提交结果和一次执行。关闭并重新打开账本后，该记录仍然存在。

每个返回值都从已存储的 JSON 中重建。调用方绝不会收到由账本持有的可变 object，因此修改返回的 dictionary 不会破坏后续重放结果。

模拟器中的业务效果，是同一个 SQLite 事务内的收据和执行计数器。仅仅写入本地表，并不能让真实支付、部署或外部 API 调用变为原子操作。生产环境需要持久化共享数据库事务、transactional outbox，或者由上游提供方强制使用同一个幂等键。单靠进程锁无法保护多个 replica，也无法跨重启存续。

### 重试 Matrix

在实现重试前，先对其进行分类。

| 类别 | 示例 | 重试规则 |
|------|---------|------------|
| 安全 | 没有副作用的确定性读取 | 理解失败边界后，使用新的 JSON-RPC id 重试 |
| 有条件安全 | 使用持久幂等键的变更 | 使用相同 key 和完全相同的参数重试 |
| 不安全 | 没有业务去重的变更 | 不要自动重试；先进行核对 |

`readOnlyHint` 和 `idempotentHint` 等 Tool annotation 仍是不可信提示。应用契约和服务端实现决定重试是否安全。

## 背压是正确性的一部分

SSE producer 生成进度的速度可能快于客户端、代理或网络的消费速度。无界队列会将缓慢转化为内存耗尽。

使用有界队列，并定义哪些内容可以丢失。

进度可以被替换。对于同一个 token，较新的进度值可以取代较旧的进度值。最终 JSON-RPC 响应不可替换。

本课的 buffer 应用以下策略：

1. 合并同一 token 的相邻进度。
2. 达到容量上限时，丢弃最早的进度。
3. 将 stream 标记为需要从权威来源重新获取。
4. 保留最终响应。
5. 如果保留最终响应需要丢弃另一个最终响应，则拒绝进入该状态。

这是带有显式恢复机制的有界丢失。静默丢失不是一种策略。

### 代理缓冲

服务端可能正确地进行 stream 传输，但反向代理会将事件保留在 buffer 中。

对于 SSE 响应，请发送：

```http
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no
```

2026 Streamable HTTP 规范建议使用 `X-Accel-Buffering: no`，让兼容代理立即传递事件。

对于安静的长连接 stream，请定期发送一条 SSE comment：

```text
:
```

客户端会忽略 comment 行。中间设备则会看到流量，从而降低空闲连接被关闭的可能性。

keepalive 不是进度。不要仅仅因为收到传输层 comment，就重置操作的语义空闲超时。

## 重新连接意味着重新获取

现代 Streamable HTTP 不支持通过 `Last-Event-ID` 恢复 SSE。

当 `subscriptions/listen` stream 断开后：

1. 使用新的 JSON-RPC id 打开新的 listen 请求。
2. 恢复所需的 subscription filter。
3. 通过权威方法重新获取受影响的 Tool、resource、Prompt 或 Task。
4. 使用稳定标识符对应用状态去重。
5. 不要仅仅因为响应丢失，就重放不安全的变更。

示例恢复计划会明确将 `sendLastEventId` 设置为 false，并列出需要重新获取的 resource。

### 防止重新连接群聚

如果 10,000 个客户端都在恰好一秒后重新连接，正在恢复的服务端会再次失败。

使用带有抖动和上限的 exponential backoff。本课会根据客户端 id 和尝试次数计算确定性抖动，使测试保持可复现：

```text
尝试 0：最多 250 ms
尝试 1：最多 500 ms
尝试 2：最多 1000 ms
...
上限：8000 ms
```

生产环境可以使用 cryptographically secure randomness 或运行时随机性。不变量是分散性，而不是某个特定公式。

## Build It

`code/main.py` 构建了五个小型可靠性组件。

### `RequestCoordinator`

- 使用空闲和最大截止时间启动正在处理的请求；
- 发出单调递增的进度 notification；
- 生成正确的 stdio 或 HTTP 取消信号；
- 忽略无效的取消 notification；
- 明确呈现取消与完成之间的终止竞态；
- 将服务端发起的取消保留给 stdio subscription。

### `MutationLedger`

- 证明在没有业务 key 时，两个 JSON-RPC id 会执行两次；
- 使用基于文件的 SQLite 事务处理 key 检查、模拟效果、执行计数器和结果提交；
- 在独立账本连接之间，通过一个幂等键对匹配的参数进行去重；
- 拒绝使用不同参数复用同一个 key；
- 返回防御性副本，并在重新打开后保留已提交记录。

### `DurableTaskService`

- 确认取消请求；
- 在 worker checkpoint 到达前将 Task 保持为 `working`；
- 展示为什么确认不等于最终状态。

### `BoundedSseBuffer`

- 在压力下合并或丢弃进度；
- 记录需要从权威来源重新获取；
- 绝不丢弃最终响应。

### 恢复辅助函数

- 返回适合代理的 SSE Header 和 keepalive comment；
- 创建重新连接与重新获取计划；
- 使用确定性的 exponential backoff 和抖动分散重试。

## Use It

从 repository 根目录运行：

```bash
cd phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/code
python3 main.py
python3 -m unittest discover tests -v
```

Demo 会运行核心竞态的两种结果，在临时的基于文件的账本中执行一次通过事务去重的变更，使有界进度 buffer 过载，并展示持久 Task 如何从已确认取消转变为 worker 已观察到取消。

## Interactive Lab

在不添加 sleep 的情况下运行四种事件顺序。

1. 启动请求 `A`，将其取消，然后调用 `complete()`。
2. 启动请求 `B`，将其完成，然后传递取消信号。
3. 启动请求 `C`，在每个空闲截止时间前发出进度，然后越过最大截止时间。
4. 通过 Streamable HTTP 启动请求 `D`，并关闭其响应 stream。

记录每个场景的以下信息：

- 请求的终止状态；
- 是否存在最终响应；
- 放到线上的取消信号；
- 客户端应忽略哪个事件。

然后将 `D` 改为 stdio。操作保持不变，但取消信号必须改变。

## Practice Lab

向 `MutationLedger` 添加一个 `reserve_inventory` 变更。

要求：

1. key 绑定 SKU、数量、tenant 和操作名称。
2. 使用相同 key 和相同参数重试时，返回第一次预留结果。
3. 使用修改后的数量重试时失败，并且不会再次预留。
4. 已提交但响应丢失的执行可以通过 key 进行核对。
5. 结果不记录任何 secret 或支付数据。
6. 当客户端未提供 key 时，禁用自动重试。
7. 添加一次模拟 subscription 中断，并在决定下一步操作前重新获取库存记录。
8. 在 barrier 处启动两个账本连接，并发提交相同 key。断言仅提交了一次预留。
9. 修改第一次返回的预留 object。重放该 key，并证明已存储结果没有改变。
10. 关闭并重新打开账本文件，然后通过 key 核对预留。

确保实验如实反映现实：如果库存位于另一个服务中，请说明该服务是否接受同一个幂等键，或者是否由 transactional outbox 将本地提交桥接到远程效果。

## Shipped Artifact

`outputs/skill-mcp-reliability-reviewer.md` 是一个扁平化的可靠性审查 Skill。向它提供 MCP 操作、传输方式、超时策略、重试行为、队列策略和恢复计划。它会返回竞态表、重试分类、幂等边界、流量控制检查和失败 Fixture。

## Verify It

满足以下条件时，本课即为完成：

- stdio 取消会发送 `notifications/cancelled`，且不会收到响应。
- Streamable HTTP 取消会关闭请求 stream，且不会发送取消 POST。
- 先取消后完成会抑制最终响应。
- 先完成后取消会保留响应，并忽略延迟到达的取消。
- 进度可以重置空闲超时，但绝不能重置最大超时。
- 仅使用新的 JSON-RPC id 会再次执行变更。
- 在两个连接的并发竞态下，一个幂等键和相同参数仅执行一次。
- 已提交记录会在重新打开后继续存在，并且重放会返回防御性副本。
- 修改一个返回结果不能改变已存储的结果。
- 有界 buffer 保持在容量范围内，并保留最终响应。
- 重新连接会使用新请求，不发送 `Last-Event-ID`，并重新获取受影响的状态。
- `tasks/cancel` 确认会使 Task 保持非终止状态，直到 worker 观察到该信号。

## 生产环境失败模式

| 失败 | 可观察到的症状 | 正确响应 |
|---------|--------------------|------------------|
| HTTP 客户端 POST 取消 notification | 服务端与客户端对请求生命周期的理解不一致 | 关闭请求的 SSE 响应 stream |
| 服务端在接受取消后仍发送响应 | 客户端收到无法使用的延迟结果 | 取消胜出时停止工作并抑制后续消息 |
| 进度会重置所有截止时间 | 挂起的工作永远不会终止 | 保留独立的绝对最大超时 |
| 将新的 RPC id 视为去重依据 | 扣款、部署或删除执行两次 | 添加持久的应用幂等键 |
| key 检查与效果相互分离 | 并发 worker 都观察到 key 不存在 | 以原子方式提交 key claim、效果记录和结果 |
| 在多个 replica 之间使用内存账本 | 重启或另一个 worker 会忘记此前的提交 | 使用共享持久存储或上游幂等机制 |
| 直接返回已存储的可变结果 | 调用方的修改破坏后续重放 | 序列化已提交结果并返回防御性副本 |
| 使用修改后的参数复用 key | 一个 key 对应两个业务意图 | 存储并比较参数 fingerprint |
| 无界进度队列 | 面对慢速消费者时内存持续增长 | 在容量限制内合并并丢弃可替换的进度 |
| 压力下丢弃最终响应 | 客户端无法得知请求结果 | 预留容量或逐出进度，绝不丢弃最终响应 |
| 代理缓冲 SSE | 进度成批到达或在超时后到达 | 禁用缓冲并配置兼容的代理超时 |
| 假设支持 `Last-Event-ID` | 客户端从服务端不支持的状态继续 | 使用新请求重新连接并重新获取 |
| 所有客户端立即重新连接 | 恢复过程造成另一次故障 | 使用带抖动且有上限的 exponential backoff |
| 将 Task 确认视为最终取消 | UI 显示已停止后，worker 仍在运行 | 轮询 Task，直到其进入终止状态 |

## Capstone Connection

Tool 生态系统 Capstone 应将可靠性视为可执行证据，而不是架构图中的一段文字。

要求提供以下 Artifact：

- 每种传输方式各一份取消竞态 transcript；
- 每个对外暴露变更的重试表；
- 一条幂等键记录和一个不匹配 Fixture；
- 一份并发使用相同 key 的 transcript、一次重新打开检查和一次可变对象别名检查；
- 一个有界 buffer 过载结果；
- 反向代理 SSE Header 和空闲策略；
- 一份列出权威重新获取方法的重新连接计划；
- 当 Capstone 使用 Task 时，提供一份持久 Task 取消 trace。

本地进程中的一次绿色请求只能证明正常路径。只有当响应丢失、延迟取消、慢速消费者和重新连接群聚都有确定性结果时，Capstone 才具备生产就绪性。

## 关键术语

| 术语 | 含义 |
|------|---------|
| 请求取消 | 放弃一个正在处理的 MCP 请求 |
| 取消竞态 | 终止完成事件与取消事件之间的竞争 |
| 空闲超时 | 从上一次有效请求活动开始计算的限制 |
| 最大超时 | 从请求开始计算且不受进度影响的绝对限制 |
| 幂等键 | 对一个业务意图进行去重的应用标识符 |
| 原子账本 | 将 key claim、效果记录和结果作为一个单元提交的持久边界 |
| 背压 | 当 producer 速度超过 consumer 时施加的控制 |
| 进度合并 | 使用较新的权威值替换较旧的进度 |
| 重新获取 | 在 stream 出现缺口后再次读取当前状态 |
| 抖动 | 将重试分散到不同时间点的有意变化 |

## 延伸阅读

- [MCP Cancellation](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation)
- [MCP Progress](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/progress)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Tasks Extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
