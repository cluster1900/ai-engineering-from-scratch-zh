# MCP Tasks 扩展：构建于无状态核心之上的持久化任务

> 无状态的 MCP 并不意味着每项操作都必须在单个请求内完成。官方 Tasks 扩展为长生命周期工作提供了显式的持久化句柄（durable handle）。Server 可以从 `tools/call` 中返回该句柄，任何实例都能响应 `tasks/get`，而 client 的输入则通过 `tasks/update` 送达，无需复活任何协议会话。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 11 (stateless MRTR), Phase 13 · 12 (elicitation)
**Time:** ~90 minutes

## 学习目标

- 严格区分无状态的协议传输层与持久化的应用级任务状态。
- 在每请求 capabilities 与 `server/discover` 中协商 `io.modelcontextprotocol/tasks` 扩展。
- 仅在完成持久化创建后，返回由 server 主导且带有 `resultType: "task"` 的 `CreateTaskResult`。
- 使用 `tasks/get` 进行轮询，使用 `tasks/update` 提交任务输入，并使用 `tasks/cancel` 发起协作式取消。
- 彻底摒弃旧版中关于 `tasks/status`、`tasks/result` 和 `tasks/list` 的陈旧假设。
- 通过 POST 响应的 SSE 流使用 `subscriptions/listen` 订阅可选的任务变更通知。
- 正确建模任务过期机制、重启恢复逻辑、输入 key 去重以及执行错误语义。

## 为什么 Tasks 是一个扩展

Tasks 最初作为实验性核心特性出现在 2025-11-25 规范中。2026 年 7 月的架构重构将其移入了官方的 `io.modelcontextprotocol/tasks` 扩展中，从而允许 client 和 server 自主选择是否接入额外的任务生命周期，而无需为所有场景膨胀 MCP 核心协议。

尽管该扩展规范目前是 Tasks 的官方归宿，但它仍处于草案（draft）演进状态。请务必锁定 SDK 所支持的扩展版本，运行一致性测试（conformance scenarios），并将底层连线适配器与工作进程及存储领域逻辑解耦。

当某项操作具备以下一个或多个特征时，请使用 task：

- 执行耗时可能超出普通的请求超时阈值。
- 已经由工作队列（worker queue）或外部作业系统接管执行。
- Client 需要在自身重启后具备恢复查询能力。
- 操作在执行过程中需要暂停以等待用户或模型提供进一步输入。
- 支持取消操作与持久化结果检索是明确的产品功能需求。

切勿为廉价的确定性查找操作创建 task。引入句柄、持久化存储、轮询机制、过期策略与取消流转都会带来实打实的复杂度。

## 无状态核心，有状态应用

MCP 2026-07-28 移除了 `initialize`、`notifications/initialized`、协议会话以及 `Mcp-Session-Id`。这绝不排斥构建有状态的产品功能。

Task id 属于显式的应用程序状态：

- Server 在返回 task id 之前必须已将其持久化。
- Client 能够持久存储该 id，并在重启后重新轮询。
- 该 id 可以被路由到由相同持久化存储支撑的任何 server 副本。
- 每次调用 task 相关方法时都必须重新校验鉴权。
- 过期与清理是由 task 字段定义的，而非由传输层连接生命周期决定。

这与附加在连接上的隐式状态在运维层面上存在本质区别。

将以下四种生命周期清晰拆解开来：

| 状态类别 | 生命周期 | 归属位置 |
|---|---|---|
| 协议元数据 | 单次请求 | `params._meta`，在每次调用中重新校验 |
| 传输层任务 | 单个 stdio 请求或 HTTP 响应 | 具有有界超时期限的正在进行的协调器（in-flight coordinator） |
| MRTR 交互延续 | 单次重试序列 | 受完整性保护的 `requestState`，必要时叠加防重放控制 |
| 持久化任务 | 跨越请求、副本、重启与重连 | 以受权的 `taskId` 为键的共享应用程序存储 |

将 task 记录简单保存在单个进程的内存中并不能让 MCP 变成有状态协议，只会让应用程序变得极不可靠。协议本身依然是无状态的，但如果后续的 `tasks/get` 被路由到另一个副本，将无法恢复该记录。必须在返回句柄前完成持久化写入，并让每个 task 方法都在租户与主体检查下解析同一份共享记录。

## Capability 协商

Client 在每个适用的请求上声明扩展支持：

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "extensions": {
        "io.modelcontextprotocol/tasks": {}
      }
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "lesson-client",
      "version": "1.0.0"
    }
  }
}
```

Server 从 `server/discover` 中返回准确的 `supportedVersions`、capabilities、`ttlMs` 和 `cacheScope`，并在 capabilities 下挂载该扩展。由于它声明了 tools，因此同样实现了强制性的 `tools/list`。该结果返回确定性的 `generate_report` 描述符、合法的 object 类型 `inputSchema`、`resultType: "complete"`、server 身份元数据以及 public 缓存提示。

若 client 未声明该扩展却调用了 task 方法，server 将返回 `-32021`（Missing Required Client Capability），并将 `data.requiredCapabilities` 设为 `{"extensions":{"io.modelcontextprotocol/tasks":{}}}`。不受支持的协议字符串返回 `-32022` 并带有准确的 `supported` 与 `requested` 数据；缺失或非字符串的版本返回 `-32602`。

没有 JSON-RPC `id` 的信封属于 notification。接收方可以处理它，但既不发出 JSON-RPC 结果也不发出错误。在 Streamable HTTP 适配层中，已接受的 notification 会返回无正文的 `202 Accepted`。

目前，仅有 `tools/call` 支持以 task 形式增强执行。请合理设计内部抽象，以便未来的请求类型无需重写存储层。

## Server 主导的任务创建

旧版的客户端标志 `params._meta.task.required` 已被彻底移除。现在的机制是：client 声明支持该扩展，随后由 server 自行决定某个具体的 `tools/call` 是否转化为 task。

请求：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_report",
    "arguments": {"size": "large"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

响应：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "task",
    "taskId": "tsk_786512e29e0d",
    "status": "working",
    "statusMessage": "Preparing report outline.",
    "createdAt": "2026-08-21T10:30:00Z",
    "lastUpdatedAt": "2026-08-21T10:30:00Z",
    "ttlMs": 900000,
    "pollIntervalMs": 1000
  }
}
```

直到该 id 已经能够被 `tasks/get` 解析读取之前，server 绝不能提前返回该句柄。在最终一致性存储系统中，必须等待其具备可读可见性（read visibility）后再做应答。否则 client 拿到一个看起来合法的 id 却会立即遭遇“未找到”的错误。

Task 响应具有“非主动请求（unsolicited）”的特征，即 client 并不显式要求进入任务模式；但它绝非“未经协商的（unnegotiated）”：当前请求仍然必须事先声明了扩展支持。

## Task 对象结构

每个 task 对象都携带以下字段：

- `taskId`：由 server 生成的稳定标识符；
- `status`：取值为 `working`、`input_required`、`completed`、`cancelled` 或 `failed`；
- `createdAt` 与 `lastUpdatedAt`：ISO 8601 时间戳；
- `ttlMs`：自创建以来的过期时间（毫秒），或 `null` 表示不声明上限；
- 可选的 `pollIntervalMs`：server 当前建议的最小轮询间隔；
- 可选的 `statusMessage`：面向用户或模型的上下文描述。

特定状态专用的字段仅在相关时才出现：

- `input_required` 包含 `inputRequests`。
- `completed` 包含原始请求的 `result` 结构。
- `failed` 包含 JSON-RPC 的 `error` 对象。

Client 应当遵守 `pollIntervalMs`。Server 可以对过于激进的轮询施加限流，并可以在 task 生命周期中动态调整该时间间隔。

## 使用 tasks/get 进行轮询

Client 请求当前的快照：

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/get
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tasks/get",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

`tasks/get` 本次 RPC 调用本身已经顺利完成，因此其最外层的响应总是包含 `resultType: "complete"`。而内部嵌套的 task 对象其 `status` 依然可以是 `working` 或 `input_required`。

这种区分能够有效避免常见的解析 bug：

```text
result.resultType = complete    表示 tasks/get RPC 本次调用完成
result.status = working        表示其代表的后台作业仍在运行中
```

当前规范中不存在 `tasks/result` 方法。当 task 完成时，下一次 `tasks/get` 响应会直接在 `result` 字段内嵌原始的 `CallToolResult`：

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "completed",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:34:12Z",
  "ttlMs": 900000,
  "result": {
    "resultType": "complete",
    "content": [
      {"type": "text", "text": "Generated large report with approved outline."}
    ],
    "structuredContent": {"size": "large", "approved": true},
    "isError": false,
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "tasks-demo",
        "version": "1.0.0"
      }
    }
  },
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "tasks-demo",
      "version": "1.0.0"
    }
  }
}
```

外层的 `resultType` 表示 `tasks/get` RPC 顺利执行；内层的 `result.resultType` 表示原始的 tool 调用已执行完成。这个内层的判别器是强制必需的。内层的 `CallToolResult` 同样应当携带其自身的 `io.modelcontextprotocol/serverInfo`；本课将其完整保留而非存储为无类型的普通载荷。

当前规范中不存在 `tasks/list`。无会话的 server 无法安全推断哪些任务应该出现在某个连接作用域的列表中。需要历史记录的应用应当暴露一个带有显式过滤与所有权规则的、经过授权的业务 domain tool。

## 任务执行期间的输入交互

Task 内部输入与核心 MRTR 看起来相似，但采用了不同的流程延续机制。

### 任务创建前所需的输入

从原始的 `tools/call` 中返回核心的 `resultType: "input_required"`。Client 履行输入并重试该原始调用。仅在这些同步的 MRTR 轮次全部结束后，才创建持久化任务。

### 任务创建后所需的输入

将 task 状态置为 `input_required`。通过 `tasks/get` 暴露未决的 `inputRequests`，由 client 通过 `tasks/update` 提交响应。Client **不需要**重试原始的 `tools/call`。

快照：

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "input_required",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:31:00Z",
  "ttlMs": 900000,
  "inputRequests": {
    "approve_outline": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Approve the generated report outline?",
        "requestedSchema": {
          "type": "object",
          "properties": {"approved": {"type": "boolean"}},
          "required": ["approved"]
        }
      }
    }
  }
}
```

更新：

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/update
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tasks/update",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "inputResponses": {
      "approve_outline": {
        "action": "accept",
        "content": {"approved": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

成功响应是一个空的确认加上 `resultType: "complete"`。由于状态变更可能是最终一致的，client 应继续保持轮询或监听。

每个 `inputRequests` 的 key 在整个 task 生命周期内必须全局唯一。多次 `tasks/get` 快照可能会展示相同的未决 key；client 端应在 UI 层面进行去重，而 server 则应忽略针对未知、已被覆盖或已履行的 key 的响应。部分字段的更新可能会让任务保持在 `input_required` 状态，直到所有必需的 key 均被作答。

## 取消操作属于协作式取消

`tasks/cancel` 用于表达取消意图并返回一个空的 complete 确认。该确认并不保证后台 worker 已经立即停止。工作可能早已先一步完成，可能暂时忽略取消信号，或在稍后才完成状态流转。

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/cancel
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tasks/cancel",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

对于所有这三个 task 方法，`Mcp-Name` 请求头均镜像对应 `params.taskId`，而不是重复 JSON-RPC 方法名。`code/main.py` 在 `make_http_request` 中统一收敛了这条规则。

本课示例中的 worker 会立即响应取消，从而使得重复调用具备幂等性。生产环境中的 client 仍必须将取消视为协作式的，切勿仅凭一个确认响应就臆断任务已进入终态。

不要使用 `notifications/cancelled` 来取消 task。该通知属于请求级别的取消（request cancellation），而非持久化任务的取消。

这种区分在路由边界至关重要。请求取消针对的是正在执行的单次 JSON-RPC 操作或其请求作用域的 HTTP 响应。若 `tools/call` 已经返回了 `resultType: "task"`，说明该请求已经结束，关闭其传输通道既无法指代也无法终止持久化作业。`tasks/cancel` 是一个全新的、经过授权的 RPC 调用：它携带 `params.taskId`，在 `Mcp-Name` 中镜像该 id，路由到拥有该任务的后端，记录协作式取消意图，并返回确认响应而不声称 worker 已停止。

因此，网关必须将请求协调器（request coordinators）与任务路由表分别存放在不同的数据表中。请求表在响应完成后即可销毁，而任务路由表必须保留至终态及数据留存到期。[第 29 课：MCP 可靠性、取消与流控](../../29-mcp-reliability-cancellation-and-flow-control/docs/en.md)会深入构建这两条路径的竞争、超时、幂等、背压与重试规则。

## 可选的通知推送

轮询是基准方案。期望推送更新的 client 可以发送带有 task id 列表的 `subscriptions/listen`。在 Streamable HTTP 下，这是一个 POST 请求，其响应是一个请求作用域的 SSE 流。不存在独立的 GET 事件流，也不存在需要保活的协议会话。

Server 通过 `notifications/subscriptions/acknowledged` 确认接受的 id 列表，随后可以通过 `notifications/tasks` 发送完整的快照。确认通知与每个 task 通知都在 `_meta` 中携带 `io.modelcontextprotocol/subscriptionId`（其值等于 `subscriptions/listen` 的请求 id）。在其它方面，每个 task 通知都等价于此时调用 `tasks/get` 所返回的快照。

Client 仍必须声明 Tasks 扩展。它们应当基于持久化的 task id 进行重连和恢复，而非依赖事件重放或 `Last-Event-ID`。

## 失败语义

请正确区分两个层次的错误：

### 协议错误

无效的方法参数或未知的 task id 会返回 JSON-RPC 错误，通常为 `-32602`。缺失扩展支持返回 `-32021` 并在数据中携带所需的 capability 对象。

### 任务执行结果

- 带有 `isError: true` 的常规 tool 结果依然属于 `completed` 任务，因为 tool 调用已经产出了其定义的结果结构。
- 在延迟执行期间发生的 JSON-RPC 协议级错误会使任务进入 `failed` 状态，并在 `error` 字段下记录该 JSON-RPC 错误。
- 用户拒绝可以产生 `cancelled`、一个表示拒绝的已完成结果，或其它领域特定的安全产物。请在文档中明确记录该选择。

## 持久化、过期与所有权

必须至少持久化存储 task id、status、时间戳、ttl、轮询间隔、原始操作所有权、结果或错误、未决的输入请求以及所有已发放的输入 key。

存储键必须包含或能解析出权威的租户与主体。仅仅获知 task id 绝不能构成越权访问凭证。在每次 `tasks/get`、`tasks/update`、`tasks/cancel` 及订阅调用中都必须核验所有权。

`ttlMs` 是从创建时起算的有效时长，并可能发生动态调整。当任务停止产生可见更新时，client 可以将其作为保底的超时依据。Server 可以对已过期的任务标记失败并在稍后执行物理清理。切勿将其宣传为“在任务完成后继续保留已完成结果多少毫秒”的保留期保证。

采用原子写入或事务机制。本课先写入临时文件再执行原子重命名。跨多副本的服务应当使用共享的持久化存储，并配合 worker 租约（lease）或等价的并发控制机制。

```figure
tp-task-lifecycle
```

## 手写实现

`code/main.py` 实现了一个确定性的任务服务：

- `server/discover` 返回 `supportedVersions`、缓存提示与 Tasks 扩展。
- `tools/list` 返回确定性、可缓存的 `generate_report` 描述符，附带合法 input schema。
- `tools/call` 在返回 `resultType: "task"` 之前完成任务的创建与持久化。
- 一个全新的服务实例重新加载相同的任务，展示了重启恢复能力。
- `tasks/get` 返回完整的任务快照。
- Worker 从 `working` 状态流转至 `input_required`。
- `tasks/update` 接收表单响应并返回空的 complete 确认。
- Worker 存储内嵌的 `CallToolResult`（包含自身的 `resultType` 与 server 身份），随后状态流转至 `completed`。
- 本实现中的 `tasks/cancel` 具备幂等性。
- HTTP 构建器将 `tasks/get`、`tasks/update` 和 `tasks/cancel` 的 `Mcp-Name` 头统一设置为 `params.taskId`。
- 通知助手函数使用 `notifications/subscriptions/acknowledged` 与 `notifications/tasks`，均标注有 listen 请求 id。
- 无 id 的通知不产生任何 JSON-RPC 响应。

Worker 采用显式推进状态而非在后台线程中 sleep。这使得每个状态流转都具备确定性，并将协议示例与消息队列机制清晰剥离开来。

## 使用与运行

在仓库根目录下运行：

```bash
cd phases/13-tools-and-protocols/13-mcp-async-tasks/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果序列：

```text
id=0 resultType=complete status=ack
id=1 resultType=task status=working
id=2 resultType=complete status=working
id=3 resultType=complete status=input_required
id=4 resultType=complete status=ack
id=5 resultType=complete status=completed
```

同时验证在现代服务中调用 `tasks/status`、`tasks/result` 和 `tasks/list` 会返回方法未找到（method-not-found）错误。
验证 `tools/list` 具有确定性，且当前所有 HTTP task 方法均通过 `Mcp-Name` 镜像其 task id。

## 交付产物

`outputs/skill-task-store-designer.md` 现已提供适配扩展的设计：包括 capability 协商、返回前必须持久化（durable-before-return）、现代方法集、输入更新流、所有权隔离、过期管理、取消处理、订阅机制以及从已废弃的实验性方法平稳迁移的方案。

## 课后练习

1. 增加第二个未决输入 key。发送包含部分字段的 `tasks/update`，证明在两个 key 均作答完毕之前，任务依然保持为 `input_required` 状态。
2. 为存储引入租户所有权，当错误的已鉴权主体出示合法的 task id 时直接予以拒绝。
3. 引入带过期时间的 worker 租约。证明两个服务实例无法并发完成同一个任务。
4. 为 `subscriptions/listen` 实现 POST 响应的 SSE 适配器。切勿引入 GET 端点、`Last-Event-ID` 或 session 请求头。
5. 增加过期清理逻辑。在不造成跨租户存在性泄漏的前提下，准确区分已过期的任务与格式错误的 task id。

## 关键术语

| 术语 | 当前扩展中的含义 |
|------|----------------------------------|
| Tasks 扩展 | 用于持久化异步工作的可选 `io.modelcontextprotocol/tasks` capability |
| `CreateTaskResult` | 对符合条件请求返回的、由 server 主导的 `resultType: "task"` 响应 |
| `tasks/get` | 轮询完整的当前任务快照，包含终态结果或未决输入 |
| `tasks/update` | 针对任务当前未决的 `inputRequests` 提交响应 |
| `tasks/cancel` | 确认接收到协作式取消的意图 |
| `input_required` | 表示任务正在等待 client 提供输入的任务状态 |
| `pollIntervalMs` | Server 建议的下次轮询前的最小等待时长 |
| `ttlMs` | 自任务创建起计算的有效时长 |
| 返回前持久化（Durable-before-return） | 必须在 task id 具备可解析可读性之后才能发出其句柄的规则 |
| `notifications/tasks` | 在已订阅的 SSE 响应流上投递的可选完整任务快照 |

## 旧版兼容性

2025-11-25 实验性方案曾采用客户端请求增强、`tasks/status`、`tasks/result` 以及可选的 `tasks/list`。请仅在版本锁定的 legacy 适配器中保留这些名称。现代 client 应当声明扩展 capability，接收 server 主导下发的句柄，轮询 `tasks/get`，通过 `tasks/update` 提交输入，并从任务快照中读取最终结果。

## 延伸阅读

- [Official MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
