# 扩展:建立在无状态核心上的持久化任务

> 无状态的MCP并不意味着每个操作都必须在单个请求中完成. 官方任务 扩展到长期生命周期工作提供了显而易见的持久化句柄.`tools/call`中返回这个句子,任何实例都能响应`tasks/get`客户的输入通过`tasks/update`送达,无需复活任何协议会话.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 11 (stateless MRTR), Phase 13 · 12 (elicitation)
**Time:** ~90 minutes

## 学习目标

- 严格区分无状态协议传输层与持久化应用级任务状态
- 在每一个请求能力与`server/discover`中协商 `io.modelcontextprotocol/tasks`扩展.
- 只有在完成的持久化创建后,返回由服务器主导和带有`resultType: "task"`的`CreateTaskResult`,我知道.
- 使用 `tasks/get`进行轮询,使用`tasks/update`提交任务输入,并使用 `tasks/cancel`发起协作式取消──
- 彻底放弃旧版中关于`tasks/status`,我知道.`tasks/result`和 `tasks/list`陈旧假设:
- 通过 POST 响应的 SSE 流使用 `subscriptions/listen`订阅可选的任务变更通知.
- 正确建模任务过期机制、重启恢复逻辑、输入键 去重以及执行错误语义。

## 为什么任务是扩展

任务最初作为实验性核心特性出现了2025-11-25 规范中.`io.modelcontextprotocol/tasks`扩展中,从而允许客户端和服务器自主选择是否进入额外任务生命周期,而无需为所有场景膨胀MCP核心协议.

虽然该扩展规范目前是任务的官方归宿,但它仍然处于草案 (草案) 发展状态.

如果某个操作具有以下一个或多个特征,请使用任务:

- 执行时间可能超出普通的要求超时值.
- 已由工作队列 (工人队列) 或外部作业系统接管执行.
- 客户需要在自动重启后恢复查询能力.
- 操作在执行过程中需要暂停等待用户或模型提供进一步输入.
- 支持取消操作和持久化结果检查是明确的产品功能需求.

勿为廉价确定性寻找操作创建任务――引入句柄,持久储存,轮询机制,过期策略和取消流转都将带来实际复杂性――

## 无状态核心,有状态应用

移除了`initialize`,我知道.`notifications/initialized`协议会话以及`Mcp-Session-Id`,这绝对不排除构建现状的产品功能.

任务 id 属于显式应用状态:

- 在返回任务 ID 之前,服务器必须已经持久化.
- 客户能够持久存储该ID,并在重启后重新查询.
- 通过相同的持久存储支的任何服务器,
- 每次调用任务 相关方法时都必须重新验证权.
- 过期与清理是由任务定义的,而不是由传输层连接的生命周期决定.

这与附加在连接上隐藏状态在运维层面存在的实质区别.

清晰解开下列四种生命周期:

| 状态类别 | 生命周期 | 归属位置 |
|---|---|---|
| 协议元数据 | 单次请求 | `params._meta`，在每次调用中重新校验 |
| 传输层任务 | 单个 stdio 请求或 HTTP 响应 | 具有有界超时期限的正在进行的协调器（in-flight coordinator） |
| MRTR 交互延续 | 单次重试序列 | 受完整性保护的 `requestState`，必要时叠加防重放控制 |
| 持久化任务 | 跨越请求、副本、重启与重连 | 以受权的 `taskId` 为键的共享应用程序存储 |

记录单个进程内存中的简单保存不能让MCP变成状态协议,只会让应用程序变得极不可靠.`tasks/get`必须在返回句子之前完成持久性写入,并让每个任务都在租户和主体检查下解析相同的共享记录.

## 能力 协商

客户端在每个适用的请求上声明扩展支持:

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

服务器从`server/discover`中返回准确的`supportedVersions`能力`ttlMs`和 `cacheScope`由于它宣布了工具,因此也实现了强制性.`tools/list`△该结果返回确定性`generate_report`描述符、合法的对象 类型 `inputSchema`,我知道.`resultType: "complete"`、服务器身份元数据以及公共缓存提示──

如果客户端未声明扩展,但调用任务方法,服务器将返回`-32021`(缺失客户能力),并将`data.requiredCapabilities`设为`{"extensions":{"io.modelcontextprotocol/tasks":{}}}`△不支持的协议字符串返回`-32022`没有确切的`supported`与`requested`数据;缺失或非字符串的版本返回 `-32602`,我知道.

没有JSON-RPC`id`收件者可以处理它,但既不发出JSON-RPC 结果也不发出错误. 在流式HTTP适配层中,已接受的通知会返回无正文的.`202 Accepted`,我知道.

目前,只有`tools/call`支持以任务形式增强执行――请合理设计内部抽象,以便未来的请求类型无需重写存储层――

## 服务器主导任务创建

旧版客户端标志`params._meta.task.required`已被完全移除. 现在的机制是:客户声明支持此扩展,然后由服务器自行决定某种具体的情况.`tools/call`是否转化为任务.

求你:

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

响应:

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

直到我已经被抓住了`tasks/get`在最终一致性存储系统中,必须等待其具有可读可见性 (可读可见性) 之后再做回应.否则客户端会得到一个看起来合法的ID,但会立即遇到未找到的错误.

任务响应具有未被要求的非主动请求的特征,即客户端并非显然要求进入任务模式;但它绝对不是未经协商的未经谈判的:当前请求仍然必须先声明扩展支持.

## 任务对象结构

每个任务对象都带有以下段落:

- `taskId`:由服务器生成的稳定标识符;
- `status`取值为`working`,我知道.`input_required`,我知道.`completed`,我知道.`cancelled`或`failed`其他
- `createdAt`与`lastUpdatedAt`时间:ISO 8601 时间;
- `ttlMs`创建以来的过期时间 (毫秒),或`null`表示不声明上限;
- 可选的`pollIntervalMs`服务器当前建议的最小轮询间隔;
- 可选的`statusMessage`面向用户或模型的上下文描述.

特定状态专用字段仅在相关时出现:

- `input_required`包含`inputRequests`,我知道.
- `completed`包含原始请求的`result`结构
- `failed`包含JSON-RPC 的`error`象征

客户应遵守`pollIntervalMs`◎服务器可以对待过度激进的轮询施加限制流,并可以调整任务的生命周期动态.

## 使用任务/获取 进行轮询

客户请求当前的快照:

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

`tasks/get`由于此次的调用已经顺利完成,因此其外层的反应总是包含`resultType: "complete"`,而内部嵌套的任务对象`status`仍然可以`working`或`input_required`,我知道.

这种区分能够有效避免常见的解析 bug:

```text
result.resultType = complete    表示 tasks/get RPC 本次调用完成
result.status = working        表示其代表的后台作业仍在运行中
```

当前规范中不存在`tasks/result`方法──当任务完成时,下一次`tasks/get`应会直接在`result`字段内嵌原始的 `CallToolResult`其他:

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

层外的`resultType`表示`tasks/get`顺利执行;内层的`result.resultType`表示原始的工具调用已完成了.`CallToolResult`它们也应该携带自己的东西.`io.modelcontextprotocol/serverInfo`本课程将全部保留而非存储为无类型的普通载荷.

当前规范中不存在`tasks/list`△无会话的服务器 无法安全地推断哪些任务应该出现在某个连接作用域的列表中.

## 任务执行期间的输入交互

任务内部输入与核心MRTR看起来相似,但采用不同的流程延续机制.

### 任务创建前所需的输入

从原始的`tools/call`中返回核心的`resultType: "input_required"`◎ 客户 执行输入并重试该原始调用―― 只有在这些同步的MRTR轮次全部结束后才创建持久化任务――

### 任务创建后所需的输入

将任务 状态置为`input_required`通过`tasks/get`暴露未决的`inputRequests`通过客户`tasks/update`提交响应.**不需要**重试原始的`tools/call`,我知道.

快照:

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

更新:

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

成功响应是一个空的确认加上`resultType: "complete"`由于情况变更可能是最终一致的,客户应继续进行询问或监听.

每个`inputRequests`关键在整个任务的生命周期中必须是唯一的.`tasks/get`快照可能显示相同的未决关键;客户端应在UI层面进行重复,而服务器则应忽略针对未知已覆盖或已执行的关键的响应.`input_required`状态,直到所有必需的钥匙被作答.

## 取消操作属于协作式取消

`tasks/cancel`为了表达取消意图并返回空空的完整确认. 确认不保证后台工人已经立即停止. 工作可能已经完成前一步,可能暂时忽略取消信号,或在稍后完成状态流转.

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

对于所有这三个任务的方法,`Mcp-Name`要求头均镜像对应`params.taskId`没有重复JSON-RPC方法名`code/main.py`在`make_http_request`中统一收了这条规则.

在本课程中,工作者会立即应取消,从而使重调用等性.

不要使用`notifications/cancelled`取消任务. 取消任务. 取消任务.

要求取消针对正在执行的单次JSON-RPC操作或其请求作用域的HTTP响应.`tools/call`已经回来了`resultType: "task"`要求已结束,关闭其传输通道既无法指代也无法终止持久化作业.`tasks/cancel`是一个全新的经授权的PC调用:它携带`params.taskId`在`Mcp-Name`中镜像该ID,路由到拥有该任务的后端,记录协作式取消意图,并返回确认响应而不声称工人已停止──

因此,网关必须将请求协调器 (请求协调员) 与任务路由表分别存放在不同的数据表中.请求表在响应完成后即可销毁,而任务路由表必须保留至终态和数据存储到期.[第 29 课：MCP 可靠性、取消与流控](../../29-mcp-reliability-cancellation-and-flow-control/docs/en.md)们将深入构建这两条道路的竞争,超时,等,背压和重试规则.

## 可选的通知推送

轮询是基准方案. 期望推送更新的客户可以发送有任务ID 列表的`subscriptions/listen`在流动 HTTP 下,这是一个 POST 请求,其响应是一个请求作用域的 SSE流――没有独立的 GET 事件流,也没有需要保存在的协议会话――

通过服务器`notifications/subscriptions/acknowledged`确认接受的身份名单,然后可以通过`notifications/tasks`发送完整的快照. 确认通知与每个任务.`_meta`携带中`io.modelcontextprotocol/subscriptionId`(其值等于`subscriptions/listen`另一方面,每个任务都等于此时调用.`tasks/get`快照的回归.

客户必须声明任务 扩展 它们应基于持续的任务 id 进行重连和恢复,而不是依赖事件重放或`Last-Event-ID`,我知道.

## 失败语义

请正确区分两个层次的错误:

### 协议错误

无效方法参数或未知的任务ID将返回JSON-RPC 错误,通常为`-32602`△缺失扩展支持返回`-32021`携带数据中对象所需的能力.

### 任务执行结果

- 带有`isError: true`常规工具 结果仍然属于`completed`任务,因为工具调用已经产生了其定义的结果结构.
- 在延迟执行期间发生的 JSON-RPC 协议级错误使任务进入`failed`状态,并`error`字段下记录该 JSON-RPC 错误――
- 用户拒绝可以产生`cancelled`、一个表示拒绝已完成的结果,或其他领域的特定安全产品――请在文件中明确记录该选择――

## 持久化,过期与所有权

必须至少持久存储任务 id、status、时间、ttl、轮询间隔、原始操作所有权、结果或错误、未决输入请求以及所有已发行的输入密钥──

存储键必须包含或能够解析权威的租户和主体――只要知道任务ID绝不能构成越权访问证――在每次`tasks/get`,我知道.`tasks/update`,我知道.`tasks/cancel`及订阅调用中都必须核验所有权――

`ttlMs`服务器可以对过期任务标记失败,稍后执行物理清理. 请勿将其宣传为在任务完成后继续保留完成结果的保留期保证.

采用原子写入或事务机制――本课程先写入临时文件再执行原子重命名――跨多副本的服务应使用共享的持久存储,并配合工人租 (租) 或等价的并发控制机制――

```figure
tp-task-lifecycle
```

## 手写实现

`code/main.py`实现一个确定性的任务服务:

- `server/discover`返回`supportedVersions`、缓存提示与任务 扩展──
- `tools/list`返回确定性 可缓存`generate_report`描述符,附带合法输入方案──
- `tools/call`在回归`resultType: "task"`之前完成任务的创建和持久化.
- 一个全新的服务实例重新加载相同任务,显示了重新启动恢复能力.
- `tasks/get`返回完整的任务快照.
- 工人从`working`状态流转至`input_required`,我知道.
- `tasks/update`收录表单响应并返回空的完整确认──
- 工人存储内嵌的`CallToolResult`(包含自己的`resultType`接下来状态流转到`completed`,我知道.
- 本实现中`tasks/cancel`具备等性.
-  HTTP 构建器将 `tasks/get`,我知道.`tasks/update`和 `tasks/cancel`的`Mcp-Name`头统一设置为`params.taskId`,我知道.
- 通知助手函数使用 `notifications/subscriptions/acknowledged`与`notifications/tasks`您需要一个信息.
- 无 id 的通知不产生任何JSON-RPC 响应.

工人使用显然推进状态而不是在后台线程中睡觉. 这使每个状态流转都具有确定性,并将协议示例和消息队列机制清晰剥离出来.

## 使用与运行

在仓库根目录下运行:

```bash
cd phases/13-tools-and-protocols/13-mcp-async-tasks/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果序列:

```text
id=0 resultType=complete status=ack
id=1 resultType=task status=working
id=2 resultType=complete status=working
id=3 resultType=complete status=input_required
id=4 resultType=complete status=ack
id=5 resultType=complete status=completed
```

同时验证在现代服务中调用 `tasks/status`,我知道.`tasks/result`和 `tasks/list`会返回方法未找到 (误误).
验证`tools/list`具有确定性,并且目前所有HTTP任务均通过`Mcp-Name`镜像其任务的ID.

## 交付产物

`outputs/skill-task-store-designer.md`现已提供适应扩展的设计:包括能力 协商 返回 必须持久化 持续前返回) 现代方法集 输入更新流 拥有权隔离 过期管理 取消处理 订阅机制以及从废弃实验性方法平稳迁移方案.

## 课后练习

1. 增加第二个未决输入键.`tasks/update`证明在两个关键中完成之前,任务仍然保持在`input_required`状态
2. 作为存储引入租户所有权,当错误的已识别权主表达合法任务时,直接被拒绝.
3. 引入带过期时间的工人租.证明两个服务实例无法并发完成同一个任务.
4. 为`subscriptions/listen`实现 POST 响应的SSE 适配器──切勿引入 GET 端点、`Last-Event-ID`或会议 请求头
5. 增加过期清理逻辑――在不造成跨租户存在性泄漏的前提下,准确区分过期任务与形式错误的任务ID――

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

2025-11-25 实验性方案曾采用客户端请求增强`tasks/status`,我知道.`tasks/result`及可选的`tasks/list`◎ 请仅在版本锁定的遗产 适配器中保留这些名称.`tasks/get`通过`tasks/update`提交输入,并从任务快照中读取最终结果.

## 延伸阅读

- [Official MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
