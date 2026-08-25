# MCP Tasks Extension：无状态核心上的持久化工作

> 无状态 MCP 并不意味着每个操作都必须在一次请求中完成。官方 Tasks extension 为长时间运行的工作提供了显式的持久化 handle。Server 可以从 `tools/call` 返回该 handle，任意实例都可以响应 `tasks/get`，而 client 输入则通过 `tasks/update` 到达，无需恢复协议会话。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09（transports）、Phase 13 · 11（无状态 MRTR）、Phase 13 · 12（elicitation）
**Time:** ~90 分钟

## Learning Objectives

- 区分无状态协议 transport 与持久化应用 task 状态。
- 在每请求 capabilities 和 `server/discover` 中协商 `io.modelcontextprotocol/tasks` extension。
- 仅在持久化创建完成后，返回由 server 决定的 `CreateTaskResult`，其中包含 `resultType: "task"`。
- 使用 `tasks/get` 轮询、使用 `tasks/update` 提交 task 输入，并使用 `tasks/cancel` 请求协作式取消。
- 移除旧版中有关 `tasks/status`、`tasks/result` 和 `tasks/list` 的假设。
- 通过 POST 响应 SSE stream 上的 `subscriptions/listen` 订阅可选的 task notifications。
- 正确建模 task 过期、重启恢复、输入 key 去重和执行 error。

## 为什么 Tasks 是 Extension

Tasks 最初在 2025-11-25 中作为实验性核心功能出现。2026 年 7 月的重新设计将其移入官方 `io.modelcontextprotocol/tasks` extension，使 client 和 server 可以选择采用额外的生命周期，而不必为所有使用者扩展核心协议。

尽管 Tasks extension 目前是 Tasks 的官方归属，但其 specification 仍处于 draft 阶段。请固定 SDK 支持的 extension 版本、运行 conformance 场景，并将 wire adapter 与 worker 和 storage domain 隔离。

当操作具有以下一个或多个属性时，应使用 task：

- 它可能超过普通请求的 timeout。
- 已有 worker queue 或外部 job system 负责执行。
- Client 需要在自身重启后恢复。
- 操作在执行期间会暂停，以等待用户或 Model 输入。
- 取消和持久化结果检索属于产品要求。

不要为开销很小的确定性查询创建 task。Handle、持久化、轮询、过期和取消都会带来实际复杂度。

## 无状态核心，有状态应用

MCP 2026-07-28 移除了 `initialize`、`notifications/initialized`、协议会话和 `Mcp-Session-Id`。这并不禁止构建有状态产品。

Task id 是显式应用状态：

- Server 在返回它之前对其进行持久化。
- Client 可以存储它，并在重启后再次轮询。
- 该 id 可以路由到由同一持久化 store 支持的任意 replica。
- 每个 task method 都会检查授权。
- 过期和删除由 task 字段定义，而不是由 transport 生命周期定义。

这在运维层面不同于附加到连接上的隐藏状态。

将以下四种生命周期分开：

| 状态 | 生命周期 | 归属位置 |
|---|---|---|
| 协议元数据 | 单次请求 | `params._meta`，每次调用时重新验证 |
| Transport 工作 | 单次 stdio 请求或 HTTP 响应 | 具有有界 deadline 的 in-flight coordinator |
| MRTR continuation | 单个重试序列 | 受完整性保护的 `requestState`，并在需要时配合 replay 控制 |
| 持久化 task | 跨请求、replica、重启和重新连接 | 以已授权 `taskId` 为 key 的共享应用 store |

将 task 记录放入进程内存不会使 MCP 变为有状态协议，只会使应用变得不可靠。协议仍然无状态，但之后路由到其他 replica 的 `tasks/get` 无法恢复记录。先完成持久化再返回 handle，然后让每个 task method 在 tenant 和 principal 检查下解析同一条共享记录。

## Capability 协商

Client 在每个符合条件的请求中声明支持：

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

Server 从 `server/discover` 返回准确的 `supportedVersions`、capabilities、`ttlMs` 和 `cacheScope`，并在 capabilities 下包含相同的 extension。因为它通告了 Tools，所以还会实现强制要求的 `tools/list`。该结果返回确定性的 `generate_report` 描述符、有效的 object `inputSchema`、`resultType: "complete"`、server 身份元数据和公共 cache 提示。

如果 client 未声明该 extension，却调用 task method，则返回 `-32021` Missing Required Client Capability，并将 `data.requiredCapabilities` 设置为 `{"extensions":{"io.modelcontextprotocol/tasks":{}}}`。不受支持的协议字符串返回 `-32022`，并包含准确的 `supported` 和 `requested` 数据；缺失或非 string 类型的版本返回 `-32602`。

不包含 JSON-RPC `id` 的 envelope 是 notification。接收方可以处理它，但不会发送 JSON-RPC result 或 error。对于已接受的 notification，Streamable HTTP adapter 返回无响应体的 `202 Accepted`。

目前只有 `tools/call` 支持 task 增强执行。设计内部抽象时，应确保未来的请求类型不需要重写 storage。

## 由 Server 决定创建 Task

旧版 client flag `params._meta.task.required` 已被移除。Client 声明支持该 extension，之后由 server 决定特定 `tools/call` 是否转为 task。

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
    "statusMessage": "正在准备报告大纲。",
    "createdAt": "2026-08-21T10:30:00Z",
    "lastUpdatedAt": "2026-08-21T10:30:00Z",
    "ttlMs": 900000,
    "pollIntervalMs": 1000
  }
}
```

在能够通过 `tasks/get` 解析该 id 之前，server 不得返回此 handle。在 eventually consistent store 中，应等待数据可读后再响应。否则，client 可能收到一个看似有效的 id，却立即得到“未找到”结果。

Task 响应在某种意义上是未经请求的，因为 client 并未主动请求 task 模式。但它并非未经协商：当前请求仍必须声明该 extension。

## Task 结构

每个 task 都包含：

- `taskId`：由 server 生成的稳定标识符；
- `status`：`working`、`input_required`、`completed`、`cancelled` 或 `failed`；
- `createdAt` 和 `lastUpdatedAt`：ISO 8601 时间戳；
- `ttlMs`：从创建时开始计算的过期时长；如果没有声明限制，则为 `null`；
- 可选的 `pollIntervalMs`：server 当前建议的最小轮询间隔；
- 可选的 `statusMessage`：面向用户或 Model 的 Context。

仅在相关时才出现特定状态的字段：

- `input_required` 包含 `inputRequests`。
- `completed` 包含原始请求的 `result` 结构。
- `failed` 包含 JSON-RPC `error` object。

Client 应遵守 `pollIntervalMs`。Server 可以对更频繁的轮询进行 rate limit，并且可以在 task 生命周期内更改该间隔。

## 使用 `tasks/get` 轮询

Client 请求当前 snapshot：

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

`tasks/get` 本身已经完成，因此其结果始终具有 `resultType: "complete"`。嵌套的 task 仍可能处于 `status: "working"` 或 `status: "input_required"`。

这种区别可以防止一种常见的 parser bug：

```text
result.resultType = complete    表示 tasks/get RPC 已完成
result.status = working        表示所表示的 job 仍在运行
```

不存在 `tasks/result` 调用。Task 完成后，下一次 `tasks/get` 响应会将原始 `CallToolResult` 内联到 `result` 下：

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
      {"type": "text", "text": "已使用获批的大纲生成大型报告。"}
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

外层 `resultType` 表示 `tasks/get` RPC 已完成。嵌套的 `result.resultType` 表示原始 Tool 调用已完成。这个嵌套 discriminator 是必需的。嵌套的 `CallToolResult` 也应该携带自己的 `io.modelcontextprotocol/serverInfo`；本课会包含它，而不是存储无类型 payload。

不存在 `tasks/list`。无会话 server 无法安全推断哪些 task 应归入连接范围内的列表。需要历史记录的应用应公开一个经过授权的 domain Tool，并提供显式 filter 和 ownership 规则。

## Task 执行期间的输入

Task 输入与核心 MRTR 看起来相似，但使用不同的 continuation。

### 创建 Task 前需要输入

从原始 `tools/call` 返回核心 `resultType: "input_required"`。Client 提交所需输入，并重试该原始调用。只有在这些同步 MRTR 轮次完成后才能创建 task。

### 创建 Task 后需要输入

将 task 设置为 `input_required`。`tasks/get` 会公开尚未处理的 `inputRequests`，client 则通过 `tasks/update` 发送响应。Client 不会重试原始 `tools/call`。

Snapshot：

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
        "message": "是否批准生成的报告大纲？",
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

成功响应是空 acknowledgement，并带有 `resultType: "complete"`。状态变化可能是 eventually consistent，因此 client 会继续轮询或监听。

每个 `inputRequests` key 在 task 的整个生命周期内都必须唯一。重复的 `tasks/get` snapshot 可能显示相同的待处理 key；client 会对 UI 去重，server 则忽略对未知、已取代或已完成 key 的响应。部分更新可能使 task 保持 `input_required`，直到所有必需 key 都得到响应。

## 取消是协作式的

`tasks/cancel` 表达取消意图，并返回空的 complete acknowledgement。该 acknowledgement 并不保证 worker 已停止。工作可能先完成、忽略取消，或稍后才发生状态转换。

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

对于全部三个 task method，`Mcp-Name` 都与 `params.taskId` 一致。它不会重复 JSON-RPC method 名称。`code/main.py` 在 `make_http_request` 中集中处理该规则。

本课 worker 会立即遵守取消请求，从而使重复调用具有 idempotent 特性。生产环境中的 client 仍必须将取消视为协作式过程，而不能根据 acknowledgement 推断最终 task 状态。

不要使用 `notifications/cancelled` 取消 task。该 notification 用于取消请求，而不是取消持久化 Tasks。

这种区别在路由边界上非常重要。请求取消的目标是一个 in-flight JSON-RPC 操作或其请求范围的 HTTP 响应。如果 `tools/call` 已经返回 `resultType: "task"`，则该请求已经完成，关闭其 transport 无法指定或停止持久化 job。`tasks/cancel` 是一个新的已授权 RPC。它携带 `params.taskId`，在 `Mcp-Name` 中映射该 id，解析拥有该 task 的 backend，记录协作式取消意图，并返回 acknowledgement，而不会声称 worker 已经停止。

因此，gateway 必须将请求 coordinator 和 task route 保存在不同的表中。响应完成后，请求表即可删除。Task route 必须保留到 terminal 状态和 retention 期限届满为止。[第 29 课：MCP 可靠性、取消与流量控制](../../29-mcp-reliability-cancellation-and-flow-control/docs/en.md)构建了两条路径的竞态、timeout、idempotency、backpressure 和重试规则。

## 可选 Notifications

轮询是基线方案。希望获得 push 更新的 client 可以使用 task id 发送 `subscriptions/listen`。对于 Streamable HTTP，这是一个 POST，其响应为请求范围的 SSE stream。不存在独立的 GET event stream，也不存在需要保持活动的协议会话。

Server 使用 `notifications/subscriptions/acknowledged` 确认已接受的 id，随后可以通过 `notifications/tasks` 发送完整 snapshot。Acknowledgement 和每个 task notification 都会在 `_meta` 中携带 `io.modelcontextprotocol/subscriptionId`，其值等于 `subscriptions/listen` 的请求 id。除此之外，每个 task notification 都等同于同一时刻 `tasks/get` 返回的结果。

Client 仍必须声明 Tasks extension。它们应重新连接，并从持久化 task id 恢复，而不是依赖 event replay 或 `Last-Event-ID`。

## 失败语义

正确使用两层 error。

### 协议 Error

无效的 method 参数或未知 task id 会返回 JSON-RPC error，通常为 `-32602`。缺少 extension 支持时返回 `-32021`，并包含所需的 capability object。

### Task 执行结果

- 包含 `isError: true` 的普通 Tool 结果仍属于 `completed` task，因为该 Tool 调用产生了其定义的结果。
- 延迟执行期间发生 JSON-RPC error 会使 task 变为 `failed`，并将该 JSON-RPC error 存储在 `error` 下。
- 用户拒绝可以产生 `cancelled`、已完成的拒绝结果或其他 domain 特定的安全结果。请记录所选方案。

## 持久化、过期与 Ownership

至少持久化 task id、状态、时间戳、ttl、轮询间隔、原始操作 ownership、result 或 error、尚未处理的输入请求，以及所有已签发的输入 key。

Storage key 必须包含或能够解析出权威 tenant 和 principal。仅知道 task id 不得授予访问权限。在每次 `tasks/get`、`tasks/update`、`tasks/cancel` 和订阅时检查 ownership。

`ttlMs` 从创建时开始计算，并且可能发生变化。当 task 不再产生可观测更新时，client 可以将其视为最终保障期限。Server 可以先将过期 task 标记为失败，再于之后删除。不要将它描述为承诺在完成后继续保留结果相应毫秒数。

使用原子写入或 transaction。本课先写入临时文件，再通过原子 rename 完成存储。多 replica 服务应使用共享持久化 store，并采用 worker lease 或等效的并发控制。

```figure
tp-task-lifecycle
```

## Build It

`code/main.py` 实现了一个确定性的 task 服务：

- `server/discover` 返回 `supportedVersions`、cache 提示和 Tasks extension。
- `tools/list` 返回确定性且可 cache 的 `generate_report` 描述符，其中包含有效的输入 schema。
- `tools/call` 在返回 `resultType: "task"` 之前创建并持久化 task。
- 新的服务实例会重新加载同一 task，以演示重启恢复。
- `tasks/get` 返回完整的 task snapshot。
- Worker 从 `working` 转换为 `input_required`。
- `tasks/update` 接受表单响应，并返回空的 complete acknowledgement。
- Worker 存储嵌套的 `CallToolResult`，其中包含自身的 `resultType` 和 server 身份，随后转换为 `completed`。
- 本实现中的 `tasks/cancel` 具有 idempotent 特性。
- HTTP builder 为 `tasks/get`、`tasks/update` 和 `tasks/cancel` 将 `Mcp-Name` 设置为 `params.taskId`。
- Notification helper 使用 `notifications/subscriptions/acknowledged` 和 `notifications/tasks`，两者都使用 listen 请求 id 进行标记。
- 无 id 的 notifications 不会产生 JSON-RPC 响应。

Worker 通过显式调用推进，而不是在后台 thread 中休眠。这样可以使每次状态转换都具有确定性，并将协议示例与 queue 机制分开。

## Use It

从 repository root 运行：

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

还应验证 `tasks/status`、`tasks/result` 和 `tasks/list` 在现代服务中返回 method-not-found。
验证 `tools/list` 具有确定性，并且每个当前 HTTP task method 都通过 `Mcp-Name` 映射其 task id。

## Ship It

`outputs/skill-task-store-designer.md` 现在会生成具备 extension 感知能力的设计：capability 协商、返回前持久化创建、当前 method、输入更新流程、ownership、过期、取消、订阅，以及从已移除实验性 method 迁移的方案。

## Exercises

1. 添加第二个尚未处理的输入 key。发送部分 `tasks/update`，并证明在两个 key 都得到响应之前，task 会保持 `input_required`。
2. 为 store 添加 tenant ownership，并拒绝由错误已认证主体提交的有效 task id。
3. 添加具有过期时间的 worker lease。演示两个服务实例无法并发完成同一 task。
4. 为 `subscriptions/listen` 实现 POST 响应 SSE adapter。不要添加 GET、`Last-Event-ID` 或 session header。
5. 添加过期清理。区分已过期 task 和格式错误的 task id，同时不泄露跨 tenant 的存在信息。

## Key Terms

| 术语 | 在当前 extension 中的含义 |
|------|----------------------------------|
| Tasks extension | 用于持久化异步工作的可选 `io.modelcontextprotocol/tasks` capability |
| `CreateTaskResult` | 对符合条件的请求返回的、由 server 决定的 `resultType: "task"` 响应 |
| `tasks/get` | 轮询完整的当前 task snapshot，包括 terminal 结果或待处理输入 |
| `tasks/update` | 为 task 尚未处理的 `inputRequests` 提交响应 |
| `tasks/cancel` | 确认协作式取消意图 |
| `input_required` | 表示仍在等待 client 输入的 task 状态 |
| `pollIntervalMs` | Server 建议在再次轮询前等待的最短时间 |
| `ttlMs` | 从 task 创建时开始计算的过期时长 |
| Durable-before-return | 发送 task handle 之前，task id 必须可解析的规则 |
| `notifications/tasks` | 在已订阅 SSE 响应上传递的可选完整 task snapshot |

## 旧版兼容性

2025-11-25 的实验性接口使用由 client 请求的 task augmentation、`tasks/status`、`tasks/result` 和可选的 `tasks/list`。仅在固定版本的旧版 adapter 中保留这些名称。当前 client 使用 extension capability，接受由 server 决定的 handle，轮询 `tasks/get`，使用 `tasks/update` 提供输入，并从 task snapshot 中读取最终结果。

## Further Reading

- [官方 MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
