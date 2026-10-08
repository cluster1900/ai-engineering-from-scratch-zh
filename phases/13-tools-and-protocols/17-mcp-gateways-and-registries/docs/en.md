# 无状态 MCP 网关与 Registry 准入

> 网关应当让每一条路由都清晰明确。2026-07-28 规范赋予了它方法、名称、版本、capability、身份标识、缓存和跟踪边界，而无需依赖任何传输层会话。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 15 (security), Phase 13 · 16 (authorization)
**Time:** ~75 minutes

## 学习目标

- 将多个 MCP server 聚合在单一 2026-07-28 端点之后，且不依赖会话亲和性（Session Affinity）。
- 在应用策略或转发之前，先验证逐请求元数据与路由头部。
- 依托稳定命名空间、确定性排序、descriptor 锁定、RBAC 和私有缓存进行 tools 合并。
- 将 registry 记录视为服务发现的证据，但仍需强制执行网关准入策略。
- 正确路由请求级作用域的 SSE、`subscriptions/listen`、MRTR 重试以及 Tasks 扩展调用。
- 将遗留的握手和 session 支持与现代代码路径进行物理隔离。

## 问题

将单个客户端直接连接到单个 server 非常简单。但随着规模扩大，更复杂的生产环境需要对以下难题给出统一答案：

- 允许接入哪些 server？
- 哪个主体能够查看到并调用特定的 tool？
- 当两个后端暴露相同名称时该如何处理？
- 如何审查 descriptor 的后续变更？
- 速率限制与审计事件应当在何处执行？
- 集群中任意一个实例是否都能处理下一次到来的请求？

网关（Gateway）充当客户端与各后端 MCP server 之间的中介。它对外暴露统一的 MCP 端点，施加横切的安全策略，并负责转发经过批准的请求。

旧版网关设计往往将一个客户端 session 多路复用到多个后端 session 中，并对 `Mcp-Session-Id` 进行重写。这纯粹属于旧版兼容设计。2026-07-28 核心协议中已经没有任何协议 session 的概念。

## 概念

### 现代网关请求路径

针对每一个入站请求：

1. 从传输层鉴权中认证请求主体（principal）。
2. 验证 `MCP-Protocol-Version`、`Mcp-Method`、`Mcp-Name` 以及 `params._meta`。
3. 对主体、目标资源、调用方法、tool 以及 arguments 进行授权。
4. 应用 descriptor 策略、registry 准入策略、限流策略和数据合规策略。
5. 为所选后端构建一个全新的、自包含的下游请求。
6. 校验后端返回的结果，并向客户端返回网关层的处理结果。
7. 记录审计事件，且绝不打印密钥明文。

整个过程不需要任何隐藏的协议 session。应用级状态依然可以妥善持久化在数据库、显式句柄、Tasks 扩展或具有完整性保护的 MRTR 状态中。

### 运行时策略是网关的第一决策

准入机制决定了哪个版本的后端可以接入网关，但它绝不代表批准某次具体的实时调用。针对每一次请求，网关都必须基于已认证主体、签发者与资源、租户、匹配的方法与名称、规范化参数、已准入的 descriptor 锁定凭据、后端实时健康状况、capability 交集、数据分级、限流状态以及任何动作绑定审批，重新计算安全策略。

这种优先级顺序至关重要：Registry 记录可能依然处于有效状态，但用户的角色可能已被吊销；某个 descriptor 的哈希锁定可能依然匹配，但目标参数可能已跨越租户边界；后端服务可能依旧合规，但安全事件应急策略可能正在对状态修改类调用实施全局隔离。因此，运行时策略才是决定允许还是拒绝的第一道门禁，Registry 和 descriptor 证据只是该决策的输入。

切勿将“允许”的决策结果缓存在某个连接或已被废弃的会话标识符下。当策略评估服务不可用时，必须按操作类别遵循明确的故障处理策略：安全的默认做法是对状态修改和敏感读取操作采取“故障闭合”（Fail-closed，直接拒绝）；而针对明确批准的公开读取路径，仅当风险模型允许时才可降级使用短时效的“最后已知策略”。在日志中明确记录是哪个策略版本与故障分支做出了该决策，并在将后端结果返回给客户端之前对其进行严格校验。

### 单一 POST 端点

现代 Streamable HTTP 将每一个 JSON-RPC 报文均通过 HTTP POST 发送：

```text
POST /mcp
Authorization: Bearer <gateway-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.search
Accept: application/json, text/event-stream
```

对于该 POST 请求，网关可以返回 JSON 响应，或者返回仅限于该请求作用域的 SSE 流。现代请求针对 GET 和 DELETE 均返回 HTTP 405 Method Not Allowed。`Mcp-Session-Id` 与 `Last-Event-ID` 绝不产生任何授权、会话亲和性或重放能力。

HTTP Header 与 JSON-RPC Body 的值必须完全一致。在查找后端之前，一旦发现不一致，立即返回 `-32020` 错误进行拒绝。这样负载均衡器、网关与限流器便无需完整解析 Body 即可完成快速路由，同时保障了端到端的完整性。

底层报文校验遵循严格时序：JSON-RPC 及元数据类型有效性、header 与 body 一致性，然后检查匹配的版本是否受支持。不匹配返回 HTTP 400 与错误码 `-32020`。若 header 与 body 一致但版本不受支持，返回 HTTP 400 与错误码 `-32022`，且 `data` 精确为 `{"supported":["2026-07-28"],"requested":"<actual>"}`。未知方法返回 HTTP 404 与错误码 `-32601`。

`ProtocolError` 可携带可选的 `data`，网关会将其序列化进 JSON-RPC 错误对象中。通知（Notification）因为没有 `id`，所以永远不会收到 JSON-RPC 成功或错误响应。被接受的 HTTP 通知返回 HTTP 202 且响应体为空。

### 在每一层都实现服务发现（Discovery）

网关面向客户端实现 `server/discover`。同时，网关也会对各个后端执行服务发现，从而获知后端支持的协议版本、capabilities 以及扩展（extensions）。

网关返回的发现结果示例：

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

仅向外声明网关自身能够端到端完全支持的 capability 交集。后端支持的特性并不意味着直接透传就安全；而网关自身声明了、但后端根本无法支持的特性对外暴露毫无意义。

`serverInfo` 纯粹是自报告的展示和调试数据，切勿将其当作 registry 或发布者的真实性凭据。

### 逐请求的客户端 Capabilities

每一个转发给后端的请求都需要携带最新的 `_meta` 信封：

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

不要盲目地把外部客户端的 capabilities 原样照抄给后端。在后端眼里，网关自身才是客户端。仅声明网关能够正确中介与处理的协议特性。

### 确定性的命名空间隔离

将各后端 tools 合并在稳定的公共命名空间之下：

```text
notes.search
notes.create
issues.list
issues.open
```

维护从公共名称到后端实例及原始 tool 名称的映射表。绝不能按发现先后顺序随意处理重名碰撞。公共名称构成了审批与审计契约的一部分，变更公共名称属于 Breaking Migration。

`tools/list` 的返回必须是确定性的。当不同主体可见的 tool 列表存在差异时，必须返回 `cacheScope: private`。设定合理的 `ttlMs` 上限可在减轻后端服务发现压力的同时，防止用户专有的列表跨越授权边界泄露。

每个对外暴露的 tool descriptor 都必须包含稳定的名称、描述以及以 object 为根节点的 `inputSchema`。命名空间转换绝不能剥离必须的 descriptor 字段。完整的列表响应还必须包含 `resultType`、服务器身份元数据及缓存提示。

### 锁定已批准的 Descriptors（Pinning）

在准入阶段，对完整的 descriptor 进行规范化处理并计算哈希 digest，将其保存在完全限定的公共名称下。在列表展示和分发调用时，严格比对实时 descriptor 与已批准的 digest。

一旦检测到变更：

- 立即将其从 `tools/list` 中摘除。
- 坚决拒绝直接调用。
- 触发安全审计事件。
- 在更新锁定哈希之前，必须强制经过策略或人工重新审批。

网关是一个强有力的集中控制点，但它并不能让一个初次见到的 descriptor 凭空变得安全。最初的人工或自动化审查依然不可或缺。

### Registry 辅助服务发现，而非安全决策

Registry 的 `server.json` 提供了软件发布元数据。一个基于软件包托管的记录通常如下所示：

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

发布元数据本身并不代表网关的安全准入决策。应将经过验证的发布者信息与来源出处凭证保存在独立的准入状态库中：

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

网关负责校验 `server.json` 的结构，并将其与外部准入状态建立关联。网关依然需要执行独立的准入策略。

针对每一个获准入的后端，完整记录：

- 精确的 registry 及记录标识符。
- 经过验证的发布者命名空间或域名凭据。
- 允许使用的传输协议与端点地址。
- 锁定的版本号或已批准的升级策略。
- 软件制品或 descriptor 的哈希 digest。
- 授权服务器签发者（Issuer）与资源标识符。
- 审查人员、审批时间及过期时间。

切勿仅仅因为某个 server 的显示名称看起来与某个知名产品相似就放行。切勿把 Registry 上存在某条记录当作已通过运维安全审查。即便某些私有 server 永远不会出现在公开 Registry 中，它们也可以通过相同的准入证据模式完成准入。

本课实现了网关层的数据衔接：在后端变得可路由之前，将发布凭据与本地准入状态进行联合。[第 30 课：MCP Registry 供应链、准入、漂移与回滚](../../30-mcp-registry-supply-chain-and-drift/docs/en.md) 将构建完整的控制平面，覆盖精确命名空间证明、软件制品溯源、不可变哈希锁定、实时 descriptor 漂移检测、Registry 状态对齐、防篡改准入账本以及基于证据的回滚机制。必须将上述供应链状态与逐请求的运行时决策清晰隔离。

### 凭据中介机制（Credential Mediation）

网关对外部调用者进行身份认证，并独立向后端各 server 进行身份认证。后端的认证凭据绝不能泄露给前端客户端。

保持以下映射绑定关系显式清晰：

```text
outer principal -> gateway role and policy
backend issuer + resource -> backend registration and token
```

绝不能把外部的网关 token 透传给后端。绝不能把某个后端的 token 复用到其他签发者或资源上。若某个 tool 需要代表最终终端用户执行操作，应通过专门设计的 Token Exchange 或 Claims 委托模型传递该身份，切勿使用共享的服务账号凭据冒充用户。

### 不依赖 Session 的速率限制

根据已认证主体、签发者、资源、公共 tool 名称、成本等级以及时间窗口实施限流。协议 session id 已经不复存在，即便存在也极易被轮换绕过。

在执行高开销的业务逻辑之前，先执行低开销的合法性验证。明确区分因非法调用被拦截是否计入防滥用频次限制、业务配额限制或两者兼有。

### 审计整个决策链路

记录足以完整复现一次调用的全套审计要素：

- 请求 ID 与链路追踪 ID（Trace ID）。
- 已认证的主体与签发者。
- 公共 tool 名称与最终后端路由。
- Descriptor 哈希锁定版本。
- 策略决策结果与判定原因。
- 响应耗时与结果类别。
- MRTR 往返轮次或任务标识符（若适用）。

对 Bearer Tokens、授权码、Refresh Tokens、原始密钥明文以及非必要的敏感参数执行强制脱敏。

### 请求级作用域的 SSE

当某个请求执行期间需要流式传输数据时，普通的 POST 请求可以直接返回请求级作用域的 SSE 响应。关闭该 HTTP 响应流即代表取消该正在进行的现代 HTTP 请求。

不要创建独立的 GET 流，也不要依赖基于 `Last-Event-ID` 的重放机制。这些都属于早期旧版传输协议的假设。

### 长生命周期的变更通知

对于列表与资源的变更通知，现代客户端通过 POST 发送 `subscriptions/listen` 并接收 SSE 响应。通知过滤器使用扁平字段：`toolsListChanged`、`promptsListChanged`、`resourcesListChanged` 以及 `resourceSubscriptions`：

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

首个事件用于确认所支持的通知子集。其订阅标识符即为开启该连接流的请求所携带的 JSON-RPC id：

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

网关随后仅转发已确认的变更类型。该连接流上的每一条通知都在 `params._meta` 中携带相同的 `io.modelcontextprotocol/subscriptionId`。不存在自动重放或自动重新监听机制。断线重连后，客户端应重新开启订阅并主动拉取刷新其依赖的列表数据。由服务端发起的主动平滑关闭将返回一个标记有相同订阅 ID 的最终 complete 结果。

现代路径彻底取代了 `resources/subscribe`、`resources/unsubscribe` 以及非请求的独立 GET 流。这些旧特性仅作为带有版本控制的旧版路径保留。

### 穿透网关的 MRTR 交互

当后端返回 `resultType: input_required` 时，只有在外部客户端声明支持所需输入请求的前提下，网关才能向下游转发该结果。除非网关刻意终结并重新生成交互流程，否则必须逐字节原样透传 `requestState`。

客户端使用全新的 JSON-RPC id 与 `inputResponses` 重试原始公共 tool。网关对重试请求重新鉴权，校验相同的公共路由，然后构建全新的后端请求向下转发。网关绝不能假定先前的轮次已经获得了不受限制的无限批准。

### Tasks Extension 路由

Tasks 是一项官方扩展，标识符为 `io.modelcontextprotocol/tasks`。它绝不是核心协议 session 的替代品。

客户端在逐请求的 clientCapabilities 中声明支持该扩展，且网关仅在能够端到端保证该任务生命周期时，才在 discovery 中向外声明支持。对于支持的 `tools/call`，完全由后端自行决定返回常规结果还是 `resultType: task`。任务结果直接包含 `taskId`、`status`、时间戳、`ttlMs` 以及可选的 `pollIntervalMs`。在发送该结果之前，任务状态必须已经可靠持久化且可被读取。

网关针对该不透明的 task 标识符记录已认证的主体与后端路由。随后的 `tasks/get`、`tasks/update` 以及 `tasks/cancel` 调用均使用 `params.taskId` 作为 `Mcp-Name`，这为各类中间件提供了天然的路由键。`tasks/get` 返回带有当前任务状态的 `resultType: complete`，并在进入终态时内联最终结果或协议错误。`tasks/update` 发送带键名的 `inputResponses` 以提供任务所需的未决输入，并返回空的 complete 确认响应。`tasks/cancel` 表达协作式取消意图，返回空的 complete 确认响应，但不保证后台任务立即停止。

不要实现新的 `tasks/list` 或 `tasks/result` 方法，它们属于旧版实验性模型。需要输入的任务通过 `tasks/get` 暴露完整的内嵌请求；客户端通过 `tasks/update` 进行回复，而不是重试最初的 tool call。客户端依然按照建议的间隔轮询；任务的创建依然完全由服务端主导。

持久化的任务路由状态属于按任务句柄索引的业务应用数据，绝非协议 session。

### 向后兼容边界

若网关必须兼容旧版客户端或后端：

- 显式探测协议所处的时代版本。
- 将初始化握手、传输层 session、独立 GET 流、资源订阅和旧版 task 语法完全隔离在 legacy 适配器内部。
- 绝不能将旧版 session id 泄露到现代路由或鉴权逻辑中。
- 优先采用受限的服务发现探测和显式的回退策略，避免发生静默降级。

```figure
t3-gateway-funnel
```

## 动手构建

`code/main.py` 实现了一个进程内的协议网关模型及两个后端 server。每个后端都会接收到全新构造的符合当前协议的请求。网关完整提供了服务发现、用户过滤的确定性 `tools/list`、基于命名空间的路由、Registry `server.json` 与外部准入状态的联合、descriptor 锁定、RBAC、按主体索引的限流、审计决策，以及模拟的 `subscriptions/listen` SSE 确认流程。

该模型接收已解析的请求体、路由头部与已认证的 Bearer 身份。它本身不是完整的 HTTP 适配器，不负责解析 `Content-Type` 或完整的 `Accept` 规范。你可将其连接至第 09 课的 Streamable HTTP 适配器，后者强制要求 `Content-Type: application/json` 以及同时包含 `application/json` 和 `text/event-stream` 的 `Accept` 头。

运行它：

```bash
cd phases/13-tools-and-protocols/17-mcp-gateways-and-registries
python3 code/main.py
python3 -m unittest discover code/tests -v
```

演示程序会打印出外部请求 id 与新生成的后端请求 id，以便直观展示无状态转发的过程。

## 使用它

将进程内的后端对象替换为真实的现代协议客户端。保持相同的分层边界：

- 连接前检查准入记录。
- 暴露 capability 前先完成后端服务发现。
- 鉴权前先完成公共名称限定。
- 列表或调用前先核对 descriptor 哈希锁定。
- 转发前重新构建逐请求元数据。
- 返回前校验后端执行结果。

## 交付它

本课交付 `outputs/skill-gateway-bootstrap.md`。它提供了一套完整的现代网关工程脚手架设计，覆盖流量入口、服务发现、准入控制、命名空间、授权鉴权、缓存、流式传输、订阅监听、MRTR、Tasks、可观测性以及旧版隔离。

## 课后深练习

1. 在外部请求与转发请求的元数据中加入分布式链路追踪上下文（Trace Context），并在审计事件中记录关联关系。
2. 接入一个具备 Tasks 能力的后端，并在 `Mcp-Name` 中根据 task id 完成 `tasks/get` 的精准路由。
3. 刻意修改其中一个后端的 descriptor，验证网关的服务发现列表与直接调用是否均被拦截阻断。
4. 为特定主体添加专门的 server capability，并深入论证为什么此时服务发现结果必须保持私有缓存（private cache）。
5. 编写一个 legacy 适配器接口，要求在不向现代 `Gateway` 类中添加任何遗留状态的前提下完成兼容接入。

## 关键术语

| 术语 | 含义 |
|------|------|
| MCP 网关 | 位于客户端与后端 MCP server 之间的安全策略与路由中心 |
| 准入记录（Admission record） | 允许特定后端接入网关的完整安全证据与审批策略决策 |
| 完全限定 tool 名称 | 稳定的对外公共路由名称，如 `notes.search` |
| Descriptor 锁定（Pin） | 在服务发现和请求分发期间严格比对校验的已批准哈希 digest |
| 私有缓存作用域（Private cache） | 缓存结果严格受限于单一授权主体与上下文，禁止跨用户共享 |
| 请求级作用域 SSE | 直接挂载在单次 POST 请求上的流式响应，连接关闭即取消请求 |
| `subscriptions/listen` | 客户端通过 POST 打开的 SSE 长连接，用于监听特定的列表变更通知 |
| 任务路由（Task route） | 将不透明的 taskId 映射到具体后端的应用层状态映射 |
| Legacy 适配器 | 带有明确版本门禁的隔离层，用于兼容旧版握手与 session 机制 |

## 延伸阅读

- [Streamable HTTP 传输协议规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [服务发现（Server Discovery）规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [官方 Registry server.json 规范与要求](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [MCP Tasks 扩展规范草案](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
