# 无状态 MCP Gateway 与 Registry Admission

> Gateway 应明确标示每一条 route。2026-07-28 protocol 无需 transport session，即可为其提供 method、name、version、capability、identity、cache 和 trace 边界。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 15（security）、Phase 13 · 16（authorization）
**Time:** ~75 分钟

## 学习目标

- 在不使用 session affinity 的情况下，将多个 MCP server 聚合到一个 2026-07-28 endpoint 后。
- 在执行 policy 或 forwarding 前，验证每个 request 的 metadata 和 routing header。
- 使用稳定 namespace、确定性顺序、descriptor pin、RBAC 和 private caching 合并 Tool。
- 将 Registry record 视为仍需通过 admission policy 的 discovery evidence。
- 正确路由 request-scoped SSE、`subscriptions/listen`、MRTR retry 和 Tasks extension call。
- 将旧版 handshake 和 session 支持与现代路径隔离。

## 问题

将一个 client 直接连接到一个 server 很简单。规模更大的部署需要对更困难的问题给出一致答案：

- 允许哪些 server？
- 哪个 principal 可以查看和调用每个 Tool？
- 当两个 backend 暴露相同 name 时会发生什么？
- 如何审查 descriptor 变更？
- 在哪里应用 rate limit 和 audit event？
- 任意 instance 是否都能处理下一个 request？

Gateway 位于 client 和 backend MCP server 之间。它提供一个 MCP endpoint，应用横切 policy，并转发获得批准的 request。

较旧的 Gateway 设计通常会将一个 client session 多路复用到多个 backend session，并重写 `Mcp-Session-Id`。这是旧版兼容性设计。2026-07-28 core 不包含 protocol session。

## 概念

### 现代 Gateway 路径

对于每个 request：

1. 从 transport authorization 中验证 principal 的身份。
2. 验证 `MCP-Protocol-Version`、`Mcp-Method`、`Mcp-Name` 和 `params._meta`。
3. 对 principal、resource、method、Tool 和 argument 执行 authorization。
4. 应用 descriptor、Registry、rate 和 data policy。
5. 为选定的 backend 创建一个全新的、自包含的 request。
6. 验证 backend result，并返回 Gateway result。
7. 在不记录 secret 的情况下写入 audit event。

所有步骤都不需要隐藏的 protocol session。Application state 仍可存在于 database、显式 handle、Tasks 或受完整性保护的 MRTR state 中。

### Runtime policy 是 Gateway 的主要决策

Admission 决定允许哪个 backend version 进入 Gateway。它并不授权实时 call。对于每个 request，Gateway 都会根据经过 authentication 的 principal、issuer 和 resource、tenant、匹配的 method 和 name、规范化 argument、已准入的 descriptor pin、当前 backend health、capability intersection、data classification、rate state，以及与操作绑定的任何 approval，重新计算 policy。

这个顺序至关重要。即使用户的 role 已被撤销，Registry record 仍可能保持 active。即使 destination argument 跨越 tenant 边界，descriptor 仍可能保持 pinned。即使 incident policy 已隔离会改变 state 的 call，backend 仍可能处于 approved 状态。因此，Runtime policy 是主要的 allow 或 deny 决策，而 Registry 和 descriptor evidence 则是其输入。

不要按 connection 或已移除的 session identifier 缓存 allow decision。如果 policy 不可用，应根据 operation class 遵循明确声明的 failure policy。安全的默认设置是对 state change 和 sensitive read 执行 fail closed；只有当风险 Model 允许时，经过明确批准的 public read 路径才能使用有效期较短的 last-known policy。记录做出决策的 policy version 和 failure path，然后在返回 backend result 前对其进行验证。

### 单一 POST endpoint

现代 Streamable HTTP 通过 POST 发送每条 JSON-RPC message：

```text
POST /mcp
Authorization: Bearer <gateway-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.search
Accept: application/json, text/event-stream
```

Gateway 可以针对该 POST 返回 JSON 或 request-scoped SSE。对于现代 request，GET 和 DELETE 返回 405。`Mcp-Session-Id` 和 `Last-Event-ID` 不会创建 authority、affinity 或 replay behavior。

Header 与 body 中的值必须一致。在查找 backend 前，使用 `-32020` 拒绝不匹配的 request。这样，load balancer、Gateway 和 rate limiter 无需解析完整 body 即可进行路由，同时还能保持端到端完整性。

请严格按以下顺序验证：JSON-RPC 和 metadata type、header 与 body 是否相等，然后验证匹配 version 是否受支持。不匹配时返回 HTTP 400 和 `-32020`。如果 header 与 body 对某个不受支持的 version 保持一致，则返回 HTTP 400 和 `-32022`，并让 `data` 精确等于 `{"supported":["2026-07-28"],"requested":"<actual>"}`。未知 method 返回 HTTP 404 和 `-32601`。

`ProtocolError` 携带可选的 `data`，Gateway 会将其序列化到 JSON-RPC error object 中。Notification 没有 `id`，因此绝不会收到 JSON-RPC success 或 error。已接受的 HTTP notification 返回 202 和空 body。

### 在每一层实现 discovery

Gateway 为 client 实现 `server/discover`。它还会发现每个 backend，从而了解 protocol version、capability 和 extension。

Gateway result 示例：

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": true}
  },
  "ttlMs": 30000,
  "cacheScope": "private",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "enterprise-gateway",
      "version": "2.0.0"
    }
  }
}
```

只公布 Gateway 可以端到端兑现的 capability intersection。Backend feature 并不会自动变得适合公开。没有 backend 路径的 Gateway feature 也不值得公布。

`serverInfo` 是自行报告的展示和诊断数据。不要将其用作 Registry 或 publisher proof。

### 每个 request 的 client capability

每个被转发的 request 都需要当前 `_meta` envelope：

```json
{
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
  "io.modelcontextprotocol/clientInfo": {
    "name": "enterprise-gateway",
    "version": "1.0.0"
  }
}
```

不要盲目地将外层 client capability 复制到 backend。Gateway 是 backend 的 client。只公布 Gateway 能正确协调的 feature。

### 确定性 namespace

使用稳定的 public name 合并 backend Tool：

```text
notes.search
notes.create
issues.list
issues.open
```

维护从 public name 到 backend 和原始 Tool name 的映射。绝不要在冲突时选择第一个或最后一个结果。Public name 是 approval 和 audit contract 的一部分，因此变更 public name 属于一次 migration。

`tools/list` 必须具有确定性。当不同 principal 的可见性不同时，返回 `cacheScope: private`。有界的 `ttlMs` 可以减少 backend discovery 负载，同时避免特定于用户的列表跨 authorization context 泄露。

每个公开的 Tool descriptor 都包含稳定的 name、description 和 object-root `inputSchema`。Namespace 不能移除必需的 descriptor field。完整的 list result 还包含 `resultType`、server identity metadata 和 cache hint。

### 固定已批准的 descriptor

在 admission 时，对完整 descriptor 进行规范化，并将其 digest 存储在合格的 public name 下。在 list 和 call 时，将 live descriptor 与已批准的 digest 进行比较。

如果发生变化：

- 将其从 `tools/list` 中移除。
- 拒绝直接 call。
- 发出 audit event。
- 更新 pin 前，要求重新进行 policy 或人工 approval。

Gateway 是一个实用的中央 enforcement point，但它不会让初次看到的 descriptor 自动变得安全。初始审查仍然不可或缺。

### Registry 有助于 discovery，而非决策

Registry `server.json` 提供 publication metadata。由 package 支持的 record 可以如下所示：

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "com.example/notes",
  "description": "Example notes MCP server.",
  "version": "1.0.0",
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@example/notes-mcp",
      "version": "1.0.0",
      "transport": {"type": "stdio"}
    }
  ]
}
```

Publication metadata 不包含 Gateway 的安全决策。请将经过验证的 publisher 和 provenance evidence 保存在独立的 admission state 中：

```json
{
  "registryName": "com.example/notes",
  "registryVersion": "1.0.0",
  "publisher": {"namespace": "com.example", "status": "verified"},
  "provenance": {
    "source": "registry.modelcontextprotocol.io",
    "recordId": "com.example/notes@1.0.0"
  },
  "admission": {"status": "approved", "reviewedBy": "gateway-policy"}
}
```

Gateway 检查 `server.json` 结构，并将其与该外部 state 关联。Gateway 仍然需要 admission policy。

对于每个已准入的 backend，记录：

- 精确的 Registry 和 record identifier。
- 经过验证的 publisher namespace 或 domain evidence。
- 允许的 transport 和 endpoint。
- 固定的 version 或已批准的 upgrade policy。
- Artifact 或 descriptor digest。
- Authorization issuer 和 resource。
- Reviewer、approval time 和 expiry。

不要因为 server 的 display name 与熟悉的产品相似就接受它。不要将存在于 Registry 中等同于已经过运行安全审查。即使 private server 从未出现在 public Registry 中，也可以通过相同的 evidence schema 对其进行准入。

本课程实现 Gateway 的连接边界：在 backend 可路由前，将 publication evidence 与本地 admission 关联起来。[Lesson 30: MCP Registry Supply Chain, Admission, Drift, and Rollback](../../30-mcp-registry-supply-chain-and-drift/docs/en.md) 构建完整的 control plane，涵盖精确 namespace proof、artifact provenance、immutable pin、live descriptor drift、Registry status reconciliation、tamper-evident admission ledger 和 evidence-backed rollback。请将该 supply-chain state 与上述每个 request 的 runtime decision 分开。

### Credential mediation

Gateway 对调用方执行 authentication，并单独向 backend 进行 authentication。Backend credential 绝不会发送给 client。

明确维护以下绑定关系：

```text
outer principal -> gateway role and policy
backend issuer + resource -> backend registration and token
```

绝不要将外层 Gateway Token 传递给 backend。绝不要在不同 issuer 或 resource 中复用 backend Token。如果某个 Tool 代表 end user 执行操作，应通过经过设计的 exchange 或 claims model 保留该 delegation，而不是使用共享 service credential 冒充用户。

### 不依赖 session 的 rate limit

按经过 authentication 的 principal、issuer、resource、public Tool、cost class 和 time window 设置 limit key。Session id 并不存在；即使存在，也很容易被轮换。

在消耗昂贵资源前先应用低成本验证。确定被拒绝的 call 是否计入 abuse limit、business quota，或两者都计入。

### 审计决策链

记录足够的信息以重建一次 call：

- Request 和 trace identifier。
- 经过 authentication 的 principal 和 issuer。
- Public Tool 和 backend route。
- Descriptor pin version。
- Policy decision 和 reason。
- Latency 和 result class。
- 适用时记录 MRTR round 或 task identifier。

对 bearer token、authorization code、refresh token、原始 secret 和不必要的 sensitive argument 进行脱敏。

### Request-scoped SSE

当工作在单次 request 期间进行流式传输时，普通 POST 可以返回 request-scoped SSE。关闭 response stream 会取消该进行中的现代 HTTP request。

不要创建单独的 GET stream，也不要承诺 Last-Event-ID replay。这些属于旧版 transport 假设。

### 长期 change notification

对于 list 和 resource change notification，当前 client 通过 POST 发送 `subscriptions/listen` 并接收 SSE response。Notification filter 使用精确的扁平 field `toolsListChanged`、`promptsListChanged`、`resourcesListChanged` 和 `resourceSubscriptions`：

```json
{
  "jsonrpc": "2.0",
  "id": "listen-tools",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

第一个 event 对受支持的子集进行确认。其 subscription identifier 是打开该 stream 的 request 的 JSON-RPC id：

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": "listen-tools"
    },
    "notifications": {
      "toolsListChanged": true
    }
  }
}
```

随后，Gateway 只转发已确认的 change type。该 stream 上的每条 notification 都会在 `params._meta` 中携带相同的 `io.modelcontextprotocol/subscriptionId`。系统不会自动 replay，也不会自动重新 listen。重新连接时，client 会重新打开 subscription，并刷新其依赖的 list。由 server 发起的 graceful close 会返回一个带有相同 subscription id 的最终 complete result。

现代路径取代了 `resources/subscribe`、`resources/unsubscribe` 和未经请求的独立 GET streaming。仅在按 version 隔离的旧版路径中保留这些功能。

### 通过 Gateway 执行 MRTR

当 backend 返回 `resultType: input_required` 时，只有在外层 client 支持所需 input request 的情况下，Gateway 才能转发该 result。除非 Gateway 有意终止并重新发起 interaction，否则应逐字节保留 `requestState`。

Client 使用新的 JSON-RPC id 和 `inputResponses` 重试原始 public Tool。Gateway 对 retry 重新执行 authorization，检查相同的 public route，然后转发新的 backend request。它不能假定前一轮已授予不受限制的 approval。

### Tasks extension 路由

Tasks 是由 `io.modelcontextprotocol/tasks` 标识的官方 extension。它不是 core session 的替代品。

Client 在每个 request 的 client capability 中声明该 extension；只有当 Gateway 能端到端保留其 lifecycle 时，才会在 discovery 中公布它。对于受支持的 `tools/call`，只有 backend 可以决定返回普通 result，还是返回 `resultType: task`。Task result 直接在 result 中携带 `taskId`、`status`、timestamp、`ttlMs` 和可选的 `pollIntervalMs`。发送该 result 前，必须已能持久读取该 task。

Gateway 为 opaque task identifier 记录经过 authentication 的 principal 和 backend route。后续的 `tasks/get`、`tasks/update` 和 `tasks/cancel` call 使用 `params.taskId` 作为 `Mcp-Name`，从而为 intermediary 提供 routing key。`tasks/get` 返回 `resultType: complete`，其中包含当前 task state；在 terminal state 下，还会内联最终 result 或 protocol error。`tasks/update` 为尚未完成的 task input 发送带 key 的 `inputResponses`，并返回空的 complete acknowledgment。`tasks/cancel` 是一种合作式意图，返回空的 complete acknowledgment，并不保证工作一定停止。

不要实现新的 `tasks/list` 或 `tasks/result` method。它们属于旧版实验性 Model。需要 input 的 task 会通过 `tasks/get` 暴露完整的Embedding式 request；client 通过 `tasks/update` 回答，而不是重试原始 Tool call。Client 仍按照建议的 interval 进行 polling；task 创建仍由 server 决定。

持久化 task route state 是按 task handle 设置 key 的 application data，而不是 protocol session。

### 兼容性边界

如果 Gateway 必须服务旧版 client 或 backend：

- 明确检测其所属版本时期。
- 将 initialization、transport session、GET stream、resource subscription 和旧版 task vocabulary 保留在 legacy adapter 内。
- 绝不要让 legacy session id 泄露到现代 routing 或 authorization 中。
- 优先使用有界 discovery probe 和显式 fallback policy，而不是静默降级。

```figure
t3-gateway-funnel
```

## 动手构建

`code/main.py` 实现了一个 in-process protocol Gateway 和两个 backend server。每个 backend 都会收到一个全新的当前 protocol request。Gateway 提供 discovery、按用户过滤且具有确定性的 `tools/list`、带 namespace 的 routing、Registry `server.json` 加外部 admission state、descriptor pin、RBAC、按 principal 设置 key 的 rate limit、audit decision，以及经过建模的 `subscriptions/listen` SSE acknowledgment。

该 Model 接收已解析的 request body、routing header 和经过 authentication 的 bearer identity。它不是完整的 HTTP adapter，也不会解析 `Content-Type` 或完整的 `Accept` contract。请将其连接到 Lesson 09 的 Streamable HTTP adapter；该 adapter 要求 `Content-Type: application/json`，且 `Accept` 值同时包含 `application/json` 和 `text/event-stream`。

运行：

```bash
cd phases/13-tools-and-protocols/17-mcp-gateways-and-registries
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Demo 会打印外层 request id 和全新的 backend request id，从而直观展示无状态 hop。

## 实际应用

将 in-process backend object 替换为真实的当前 protocol client。保留相同的边界：

- 连接前检查 admission record。
- 暴露 capability 前执行 backend discovery。
- 执行 authorization 前确定合格的 public name。
- 执行 list 或 call 前检查 descriptor pin。
- 转发前添加每个 request 的全新 metadata。
- 返回前验证 result。

## 交付成果

本课程交付 `outputs/skill-gateway-bootstrap.md`。它会生成一份现代 Gateway 设计，涵盖 ingress、discovery、admission、namespace、authorization、caching、streaming、subscription、MRTR、Tasks、observability 和旧版隔离。

## 练习

1. 向外层和转发 request 的 metadata 添加 trace context，并在 audit event 中记录关联关系。
2. 添加支持 Tasks 的 backend，并根据 `Mcp-Name` 中的 task id 路由 `tasks/get`。
3. 修改一个 backend descriptor，并证明 discovery 和直接 call 都会被阻止。
4. 添加特定于 principal 的 server capability，并解释为什么 discovery 必须保持 private caching。
5. 编写 legacy adapter interface，但不要向现代 `Gateway` class 添加任何 legacy state。

## 关键术语

| 术语 | 含义 |
|------|---------|
| MCP Gateway | 位于 client 与 backend MCP server 之间的 policy 和 routing server |
| Admission record | 允许一个 backend 进入 Gateway 的 evidence 和 policy decision |
| Qualified Tool name | 稳定的 public route，例如 `notes.search` |
| Descriptor pin | 在 discovery 和 dispatch 期间检查的已批准 digest |
| Private cache scope | 仅限一个 authorization context 使用的 cached result |
| Request-scoped SSE | 附加到一个 POST request 的 streaming response |
| `subscriptions/listen` | 由 client 打开的 SSE stream，用于接收选定的长期 change notification |
| Task route | 从 opaque task id 到其 backend 的 application mapping |
| Legacy adapter | 针对旧版 handshake 和 session behavior、按 version 显式隔离的边界 |

## 延伸阅读

- [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [Server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [Official Registry server.json requirements](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
