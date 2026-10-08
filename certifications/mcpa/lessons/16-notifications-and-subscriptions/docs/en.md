# 订阅流：通知、进度与任务取消 (The Subscription Stream: Notifications, Progress, and Cancellation)

> 通知绝不会收到任何回复，因此它必须能独立表明自身属于哪一次对话：是最初建立的长效事件流，还是仍在等待结果的单次请求。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 15
**Time:** ~45 minutes

## 学习目标

- 准确区分通知（Notification）与请求（Request），并阐明为何接收方绝对不可向通知发送应答响应
- 建立 `subscriptions/listen` 事件流，解析其首包确认应答，并基于 `subscriptionId` 对流中承载的各类通知实施多路解复用
- 严格依据底层传输通道将流级通知（列表变更、资源更新）与请求级通知（进度、日志消息）区分开来，摒弃主观猜测
- 追踪进度通知中的令牌（token）与总进度（total），并解释为何进度数值必须保持严格单调递增
- 掌握针对不同传输层实施请求或订阅取消的标准规范，并妥善处理取消信号与已在途中飞行消息之间的并发竞态

## 问题背景

MCP 的大部分通信均遵循“一问一答”的单请求单响应模式。客户端发起请求，服务端返回结果，交互即告终结。然而，这一经典模式无法契合服务端向客户端推送信息的全部诉求。某些信息属于长期持续性的状态演进：工具列表发生了动态调整、已订阅的资源被写入了新数据，或者动态增补了新 Prompt 模板。单次响应报文绝无法承载“后续有变动请持续通知我”的语义，因为返回响应的那一刻该请求便已彻底关闭。另一些信息则属于伴随执行过程的瞬态汇报：一个需要耗时三十秒的复杂调用，中途汇报当前已完成五分之一是极具价值的，但这种进度并非最终答案，而仅仅是计算过程中的附带状态。此外，客户端还可能在请求或订阅启动后中途反悔，而在缺乏 Session 的架构下，根本没有长效会话对象可供挂载取消标志。第 04 课确立的无状态核心意味着服务端从一开始就没有为特定物理连接维护私有状态，因此取消操作必须像其他协议行为一样：作为带有明确 ID 标识的自包含报文独立流转。

MCP 针对上述持续性场景引入了由客户端显式开启的专用事件流 `subscriptions/listen`；而针对伴随单次调用的瞬态场景，则引入了绑定在特定请求生命周期内的专属通知：`notifications/progress` 以及第 15 课讲解的已废弃日志特性中的 `notifications/message`。上述所有消息在底层均为纯粹的 JSON-RPC 通知：包含方法名与参数，没有 `id` 字段，且永远不需要接收方回复。区分它们的核心依据在于承载它们的通信通道，以及当多项任务并发运行时接收方如何准确识别归属。

## 核心概念

回顾第 03 课的信封结构：通知（Notification）是 JSON-RPC 规范中唯一没有 `id` 字段的消息形态。它不构成对任何具体请求的直接回复，且接收方严禁向其回传任何响应。这一根本法则直接决定了 MCP 为何必须为通知设立两处截然不同的寄宿载体。单次请求的响应通道仅在该请求处于活动状态时存在，因此凡是绑定在单次调用生命周期内的附带信息（例如该调用的执行进度），自然沿着该通道顺流而下。然而，单次调用的生命周期绝不可能用来传达“当前工具目录已变更”这类的持续性变化，因为当变更发生时，网络上甚至可能没有任何正在飞行的业务调用。为此，协议必须引入一条生命周期超越任何单次请求的长效通道：由独立请求显式建立并主动维持心跳的长效事件流。

客户端通过 `subscriptions/listen` 发起请求以开启该事件流。这是一个标准的请求，其 `params.notifications` 字段作为一个事件过滤器：`toolsListChanged`、`promptsListChanged` 与 `resourcesListChanged` 为布尔开关，而 `resourceSubscriptions` 则为需要监听更新的具体资源 URI 列表。服务端绝对不可下发客户端未曾订阅的通知类型，且在自身完全不具备某项能力时，有权仅批准过滤器中的部分子集。

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "subscriptions/listen",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    },
    "notifications": {
      "toolsListChanged": true,
      "resourceSubscriptions": ["file:///project/config.json"]
    }
  }
}
```

服务端在建立该流后，在发送任何后续消息之前，下发的第一条消息必定是 `notifications/subscriptions/acknowledged`。该通知回显了服务端实际批准生效的过滤器子集，并在 `_meta["io.modelcontextprotocol/subscriptionId"]` 中明确回显了当初开启该流的 `subscriptions/listen` 请求的 ID（本例中为 `7`）。这就是整套多路解复用机制的精髓所在：后续属于该流的所有消息（包括首包确认以及随后的每一条事件通知），均恒定重复携带这一相同的订阅 ID。哪怕客户端在同一个 stdio 管道中并发维持了两个独立订阅，或在不同的 HTTP 流中同时监听，也完全能够通过审阅该字段准确分流，因为底层传输连接不等于订阅，订阅也绝不等于连接。

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {"io.modelcontextprotocol/subscriptionId": 7},
    "notifications": {"toolsListChanged": true, "resourceSubscriptions": ["file:///project/config.json"]}
  }
}
```

首包确认之后，仅有四种通知方法获准在该事件流中流转，且全部携带相同的订阅 ID：`notifications/tools/list_changed`、`notifications/prompts/list_changed`、`notifications/resources/list_changed`，以及携带发生变更 URI 的 `notifications/resources/updated`。任何其他消息均严禁混入该流。`notifications/progress` 与 `notifications/message` 属于**请求作用域**（request-scoped）：它们仅仅服务于触发它们的单次调用，绝不从属于任何订阅流，也绝不携带订阅 ID。进度通知改由 `progressToken` 进行标识（由客户端生成且在其所有活动请求中保持唯一），附带一个在每次通知中必须**严格单调递增**的数值 `progress`（即便未知总数亦须递增），以及可选的 `total` 总量与面向人类的 `message` 文本。服务端可自行把控进度的汇报节奏，但一旦请求执行终结必须立即停止下发，且双方均应进行速率限制以防打爆信道。至于第 15 课提及的废弃日志通知 `notifications/message`，仅在特定请求显式声明了日志级别的响应流中才获准发送。

取消操作根据底层传输协议的不同而分为两套机制。在 Streamable HTTP 协议下，直接关闭请求专属的 SSE 响应流本身就是最直接的取消信号，无需也不应发送任何额外的取消通知。在 stdio 传输下，由于没有独立的单请求流可供断开，客户端必须发送 `notifications/cancelled` 通知，指明需要终止的 `requestId` 以及可选的 `reason` 缘由。服务端自身主动下发 `notifications/cancelled` 的唯一合法场景，是主动断开并终结其正在维护的 `subscriptions/listen` 事件流；严禁将该通知用于其他任何目的，因此一旦客户端收到服务端发来的此类消息，即可确凿断定某条监听流已被对端主动关闭。

订阅流同样支持优雅关闭（Graceful closure）。从协议形式上看，`subscriptions/listen` 请求在整条事件流存活期间一直处于未终结状态。当服务端在关机或维护时决定主动终结订阅时，应在关闭底层流之前，针对原始请求回传一个带有相同订阅 ID 的 `resultType: "complete"` 正常结果。该终结响应是让客户端精确区分“服务平稳关闭”与“物理传输异常断开”的关键依据。此外，由于取消信号与消息推送在并发环境下必定存在时间差，在取消生效前夕已经发出的通知完全可能在客户端注销监听后才姗姗来迟。协议要求双方均须平稳包容这种不可避免的网络竞态：发送方无需因任务已结束而慌乱，而接收方对于已注销 ID 的迟到消息直接就地丢弃即可，严禁将其视为协议异常。

无状态哲学在此处体现得淋漓尽致：若底层 stdio 进程崩溃重启，全新的服务端进程对旧进程建立的订阅毫无记忆；客户端必须针对每一个依然需要的事件流，重新分配全新的 ID 重新发送 `subscriptions/listen`。没有任何自动重放，没有任何断点续传，因为根本没有可供保存会话的载体。

```figure
mcpa-16-subscription-stream
```

## Interactive Lab

本节架构图在左右两侧分别列出客户端与服务端，并沿着垂直时间线生动展示了一次多流复用场景。两条 `subscriptions/listen` 请求先后建立，每条流的首包确认均在 `_meta` 中标注了自身的唯一 ID，随后的通知消息严格保持相同的标注，使得工具变更流与纯资源变更流即便在同一物理通道中交织传输也绝不会产生混淆。在图示下方，一个独立的 `tools/call` 请求运行着自身的请求与响应闭环，并穿插着属于自身的进度汇报报文；请注意，这三条进度通知绝不携带任何订阅 ID，因为它们完全隶属于当前调用本身。在图谱末尾，客户端主动取消了第二个订阅，而一条已经在途中飞行的残余更新通知即便随后抵达，也会被客户端直接静默丢弃而非分发上层。阅读图示时，请重点关注 `subscriptionId` 与 `progressToken` 是如何从机制上杜绝信道串扰的。

## Practice Lab

打开 `code/main.py`。该脚本构建了一个 `SubscriptionServer`，将每个活动的 `subscriptions/listen` 请求记录为携带具体授权通知类型的 `Subscription` 对象，并将 `resource_updated`、`list_changed`、`cancel` 与 `close_gracefully` 作为产生流消息的唯一合法入口，且在订阅已关闭或未获授权时严正拒绝发送任何报文。`call_long_job` 用于响应常规的 `tools/call`，若请求携带了 `progressToken`，则会在返回最终结果的同时发射一系列进度通知，与外部的订阅流完全解耦隔离。`SubscriberClient` 发送监听请求、登记确认包，并通过 `receive_stream` 实现多路解复用（仅分发本地仍处于活动状态的订阅 ID 对应的通知）。

```bash
python3 code/main.py
```

对照核心概念研读终端打印出的交互记录。观察前两次订阅的首包确认：核验每个 `subscriptionId` 是否严格等于当初发起 `subscriptions/listen` 请求的 ID。接着观察针对 `run_build` 调用的三次进度通知：核实它们完全没有携带任何 `_meta` 订阅元数据。随后观察接近尾声处的订阅取消操作，以及紧随其后故意标记为违规演练的捕获条目：由于取消与网络传输存在竞态，一条针对刚取消订阅的 `resources/updated` 通知抵达了客户端，客户端严谨地将其就地丢弃而非向上传播。最后尝试为 `promptsListChanged` 开启第三个订阅并触发变更通知：观察其返回值直接为 `None`，因为该服务端在能力协商中从未声明支持 Prompt 机制，因此绝不可能越权下发该通知。

## Shipped Artifact

`outputs/notification-routing-table.md` 是本课交付的单页速查指南：将本课涉及的所有通知方法与其所属通道、必选字段及治理规则进行严格映射：哪四种方法绝对仅能在监听流中出现、哪两种通知被严格限制在请求作用域内及其深层原因，以及客户端在各类传输层实施取消时应采取的标准化手段。在后续做题排查交互日志时，请将该表与错误码速查表配合使用。

## Verify It

在课程目录下运行测试套件：

```bash
python3 -m unittest discover code/tests
```

测试全面验证了本课阐述的核心主张：确认应答必定是流中的第一条消息且回显原始请求 ID 作为订阅 ID；确认包严格仅回显服务端实际批准的通知类型；未订阅或未获批的通知类型绝不下发；进度数值严格保持单调递增且绝不携带订阅 ID，而正规流通知必定携带订阅 ID；取消订阅后服务端停止为其产生后续消息；在取消瞬间已在途中飞行的残留消息到达客户端后被直接丢弃而不予分发；优雅关闭结果完整携带订阅 ID 且重复关闭幂等安全；两个并发的活动订阅能依据 ID 实施精准的多路解复用。本仓库的通信检查脚本还会依据 2026-07-28 规范核验本课的通信记录：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/16-notifications-and-subscriptions
```

## Capstone Connection

Capstone 综合考核中的长耗时复杂任务深度依赖本课建立的技术规范：能够一眼看穿附带进度的普通调用绝非订阅流（它通过缺失 `taskId` 与后置课程的 Tasks 扩展产生本质区别），且能依靠订阅 ID 熟练分发各类异步通知。在 Capstone 场景中执行中途取消操作时，究竟是在 HTTP 上断开 SSE 响应流，还是在 stdio 上发送 `notifications/cancelled` 报文，完全取决于本课讲授的传输层分工规范。

## Key Terms

| 术语 | 含义 |
|------|------|
| Notification（通知） | 没有 id 且接收方绝不可回传任何应答的 JSON-RPC 消息 |
| `subscriptions/listen` | 客户端用于开启长效异步事件通知流的标准请求方法 |
| Subscription id（订阅 ID） | 开启订阅流的 listen 请求自身的 ID，在该流后续下发的每一条消息中恒定回显 |
| Stream notification（流级通知） | 仅获准在 listen 事件流中下发的 list_changed 或 resources/updated 通知 |
| Request-scoped notification（请求级通知） | 仅获准在特定业务调用的响应通道内流转的 progress 或 message 通知 |
| `progressToken` | 客户端为活动请求分配的唯一令牌，用于将进度通知与特定调用无歧义绑定 |
| Graceful closure（优雅关闭） | 服务端在断开前在原始 listen 请求上返回的 complete 结果，区别于突发性物理断链 |
| `notifications/cancelled` | stdio 传输下的取消通知；服务端使用该通知的唯一合法目的是主动终结监听流 |

## Further Reading

- [MCP 消息交互模式](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns)
- [MCP 订阅机制规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 进度通知规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/progress)
- [MCP 取消机制规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 8 节
- `phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control`，深入学习超时、流量控制与取消竞争
