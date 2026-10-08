# 长耗时任务与 Tasks 扩展规范

> 将网络连接长时间阻塞以等待数分钟甚至数小时的后台作业完成，会彻底葬送无状态架构所带来的全部工程红利：任何集群副本都将无法代答，而一次轻微的网络抖动就会导致作业状态彻底丢失。Tasks 扩展规范将这种阻塞式调用优雅置换为持久化任务句柄。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 20
**Time:** ~45 minutes

## 学习目标

- 深刻剖析针对长耗时作业阻塞网络请求的致命弊端：请求与传输层超时、执行中途缺乏交互输入通道，以及进程崩溃后无法恢复
- 掌握 `io.modelcontextprotocol/tasks` 扩展规范的单请求动态协商机制：在 `clientCapabilities.extensions` 中按需声明，并在 `server/discover` 中双向确认
- 熟练解析由服务端主导生成的 `CreateTaskResult` (`resultType: "task"`) 并轮询 `tasks/get`，严格区分 RPC 顶层的 `resultType` 与任务内层嵌套的 `status`
- 掌握使用 `tasks/update` 提交中途补充输入以及通过 `tasks/cancel` 发起协作式取消的范式，理解为何二者仅返回空确认报文
- 清晰区分当前标准扩展与 2025-11-25 实验性旧版任务方案的本质差异，掌握替代 `tasks/result` 与 `tasks/list` 的现代标准方案
- 针对具体业务场景，在普通调用、MRTR 多轮往返、异步任务 (Task) 与服务端签发句柄四种架构模式之间做出科学技术选型

## 问题背景

在实际工程中，某些工具调用的耗时天然无法被压缩进单个瞬时请求之中。CI/CD 构建流水线、大规模批量数据导入、中途需要等待人类管理员审批的操作：此类业务往往持续数秒、数分钟甚至更久，其耗时本质是由业务逻辑决定的客观属性，而非可以通过局部代码优化消除的系统缺陷。如果简单粗暴地将底层网络连接持续保持打开、直至最后一个字节处理完成，系统会瞬间遭遇三记重锤。

第一记重锤来自并非由服务端掌控的外部链路超时。大语言模型与目标服务端之间的各类网络客户端、反向代理、API 网关及负载均衡器，均对单次 HTTP 请求的存活时长施加了严格上限；这些超时阈值通常是针对普通检索设计的，绝不可能为了一个耗时 20 分钟的部署流水线而无限期保持挂起。第二记重锤是在阻塞式单连接中，服务端彻底丧失了向客户端反向索取补充输入的通信通道。如果某个工具在执行到一半时发现必须获得人类用户的二次安全授权，它在物理上没有合法的信道来发起这一询问：普通的 MRTR 机制虽然能在同一打开请求内交互，但绝不可能将单一物理连接维持数小时之久。第三记重锤是系统持久性 (Durability) 的丧失。如果客户端进程重启，或者网络连接发生短暂闪断，阻塞式的挂起调用将不留下任何可追踪的痕迹。客户端无法确认后端任务究竟是否执行完成，只能要么陷入无限期的被动等待，要么盲目重发可能早已在后台运行且具有破坏性副作用的操作（例如重复触发生产部署）。

无状态核心原则让这一矛盾变得更加尖锐。第 04 课阐明了系统不存在可以依赖的 Session 上下文：请求之间毫无记忆，服务端无法隐式地将后台作业与某一特定连接强行绑定并在断线后默默等待重连。长耗时作业迫切需要一个明确的架构解答：究竟依靠什么在跨越多个离散请求、进程重启与多副本负载均衡的复杂环境中唯一标识该项后台作业，从而允许任何无状态节点都能随时接续管理？

## 核心概念

MCP 官方通过标准化扩展 `io.modelcontextprotocol/tasks` (SEP-2663) 彻底解决了这一难题。支持该扩展的服务端在收到符合条件的工具调用时，不再同步阻塞等待终态，而是立即向调用方返回一个具备持久性保证的任务句柄 (Task Handle)；客户端随后围绕该句柄，通过规范定义的三个方法执行状态轮询、输入补充与协同取消。

该扩展的能力协商遵循逐请求独立绑定的原则，与协议中所有其他特性保持高度一致。客户端在具体发起的调用报文中，通过在 `io.modelcontextprotocol/clientCapabilities.extensions` 字典中注入该扩展标识符来表明自身支持异步任务；服务端则在 `server/discover` 响应的 `capabilities.extensions` 中同步声明对应支持。在一特定调用中声明扩展绝不会自动溢出至后续交互：由于不存在 Session 记忆，客户端若希望在随后的 `tasks/get` 查询中依然获得任务感知能力，在该次查询报文中仍须显式携带该扩展声明。

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "run_build_pipeline",
    "arguments": {"project": "web-storefront", "environment": "production"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {"io.modelcontextprotocol/tasks": {}}
      }
    }
  }
}
```

任务的生成完全由服务端自主裁定 (Server-directed)。客户端声明该扩展仅代表其具备处理异步任务的接收能力；究竟是将某次调用作为任务异步挂起，还是直接同步执行完毕，决定权完全在服务端手中。声明了扩展的客户端必须具备在同一个工具的多次调用中，无缝兼容接收常规 `CallToolResult` 或异步 `CreateTaskResult` 的鲁棒性。在当前协议规范中，仅 `tools/call` 原语支持任务化扩展。

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "resultType": "task",
    "taskId": "tsk_786512e29e0d",
    "status": "working",
    "statusMessage": "Installing dependencies and running tests.",
    "createdAt": "2026-09-24T10:30:00Z",
    "lastUpdatedAt": "2026-09-24T10:30:00Z",
    "ttlMs": 900000,
    "pollIntervalMs": 2000
  }
}
```

服务端在向客户端下发该任务句柄之前，必须确保后续针对该任务的 `tasks/get` 查询在物理上已经立即可查。在采用最终一致性存储架构的后端集群中，这意味着服务端必须等待任务写入操作对其他查询副本完全可见之后，才能向客户端正式发送该响应；若违反这一原则，客户端拿到的 `taskId` 将在首次轮询时立即报出“任务未找到”的严重假死，其破坏性远大于在首次响应时多等待几十毫秒。

客户端通过调用 `tasks/get` 并传入唯一的 `taskId` 实施状态轮询。这里是认证考试极易设置陷阱的高频考点：`tasks/get` 本身是一次完全合法的标准同步 JSON-RPC 请求，其顶层返回的 `resultType` 永远恒定为 `"complete"`。而底层后台作业的真实业务状态（如 `working`、`input_required`、`completed`、`failed` 或 `cancelled`），是承载在同一响应对象内层嵌套的 `status` 字段中的，绝非顶层的 `resultType`。若客户端混淆二者，误将顶层的 `resultType: "complete"` 判定为整个后台任务已完成并提前终止轮询，系统就会彻底瘫痪。

当前规范中已彻底废弃了 `tasks/result` 方法。当任务状态流转至 `completed` 时，紧随其后的下一次 `tasks/get` 响应体中会直接内联返回原始工具执行结果（位于 `result` 键下），其数据结构与该工具同步执行时的返回完全一致。若任务流转至 `failed` 状态，该响应会在 `error` 键下内联承载 JSON-RPC 协议错误。这里必须注意工具执行错误的定级规则：若工具自身在业务层面返回了 `isError: true`，在任务状态机中依然被视为 `completed`，因为该调用在协议通信层面顺利走完了全流程；`failed` 状态被严格限定为执行期间遭遇了底层的严重系统级协议崩溃。

当前规范中同样彻底删除了 `tasks/list` 方法。2025-11-25 实验版本曾短暂提供过该接口，但在彻底剥离 Session 的现代无状态服务端中，根本不存在可以安全界定任务归属的隔离边界：缺乏长连接或 Session 的物理约束，朴素的任务列表接口要么会导致严重的数据越权泄漏（跨租户泄露所有调用者的后台任务），要么需要凭空发明一套基础协议中不存在的复杂鉴权模型。需要任务历史的产品应自行暴露经过严格鉴权过滤的专用业务工具；通用任务列表功能被官方坚决移除，以杜绝默认不安全的架构隐患。

正在执行中的任务允许在中途挂起以等待调用端补充必要输入。此时任务的 `status` 变为 `input_required`，且对应的 `tasks/get` 响应中会新增一个 `inputRequests` 字典，字典内的每个子条目在格式上均符合标准的 MRTR 原语形态（如 `elicitation/create`、`sampling/createMessage` 或 `roots/list`）。客户端对此的响应方式是调用专属的 `tasks/update` 方法，提交按相同键名严格对应的 `inputResponses` 载荷；该调用仅会换来服务端的一个空结构体确认回执，更新后的任务最新状态将在随后的下一次 `tasks/get` 轮询中正式呈现。这种接续机制与基础核心 MRTR 存在本质技术差异：MRTR 是使用全新 id 对原始请求进行带有上下文的重试，而 `tasks/update` 是一个直接作用于持久化 `taskId` 的独立 API，客户端绝不需要、也绝不能重新发起原始的 `tools/call` 请求。每个输入请求的 Key 在任务生命周期内保持全局唯一，服务端会自动幂等忽略未签发或已处理过的旧 Key，而客户端在重复轮询时也应妥善去重已向用户展示过的输入请求。

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tasks/update",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "inputResponses": {
      "approve_deploy": {"action": "accept", "content": {"approved": true}}
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {"io.modelcontextprotocol/tasks": {}}
      }
    }
  }
}
```

任务取消遵循相同的异步协作模式：客户端调用 `tasks/cancel` 并传入 `taskId`，服务端同样仅返回空的确认回执。该取消动作是协作式的 (Cooperative)，并不构成绝对立即中断的强硬保证：服务端仅负责如实记录取消意图，若中途强行掐断会导致不可逆的数据损坏或物理上已无法中止，服务端仍有权选择继续推进完成作业。在此场景下，千万不要尝试发送 `notifications/cancelled`：该单向通知的作用域被严格限定为在底层物理传输流上直接销毁某一尚未响应的活跃请求，而在任务场景下，原始请求在返回 `resultType: "task"` 的瞬间早已经安全终结，传输层上根本不存在任何挂起的悬挂请求供其取消。一旦持久化任务句柄已经生成，`tasks/cancel` 是唯一合法的取消途径。

若客户端在未于当前请求中声明该扩展的前提下盲目调用任务相关方法，服务端将严格返回协议错误 `-32021` (`MissingRequiredClientCapability`)，并在 `data.requiredCapabilities` 中明确指出缺失该扩展。若传入了一个未知或已过期的 `taskId`，服务端统一返回 `-32602`。因为在协议规范中，`tasks/get`、`tasks/update` 与 `tasks/cancel` 均为平等的标准 JSON-RPC 请求，必须恪守所有常规校验准则。

在实际架构设计中，面对具体业务应当在四种处理范式之间精准权衡：
1. **普通同步调用 (Plain Call)：** 适用于耗时极短且确定性高的常规操作。
2. **多轮往返交互 (MRTR)：** 适用于服务端在返回终态前，仅需快速索取一次简短输入即可闭环当前请求的场景。
3. **异步任务 (Task)：** 适用于耗时可能突破网络超时门槛、中途需要异步输入介入，或必须在客户端意外重启与显式取消场景下维持持久状态的高价值长作业。
4. **服务端签发句柄 (Server-minted Handle)：** 解决的是跨越多次独立业务调用的持久上下文（如购物车、多步骤审批流）作为普通入参传递的问题；`taskId` 恰恰是这一模式在异步延迟作业轮询领域的专业化特化落地。

```figure
mcpa-21-task-states
```

## Interactive Lab (交互式实验)

上方的状态机架构图清晰描绘了异步任务可能流转的每一个状态，以及驱动各状态跃迁的具体 API 调用。追踪 `working` 向左上方指向 `input_required` 的跃迁线：该跃迁纯粹由服务端内部逻辑触发，不依赖客户端发送任何新请求；而观察其向右下方的返回路径，则清晰标注了客户端必须实际调用的唯一交互接口：`tasks/update`。在图表右侧，从 `working` 状态发散出三个终态分支：因顺利产出结果而达成的 `completed`、因客户端主动诉求而达成的 `cancelled`，以及因底层遭遇系统异常而导致的 `failed`。这三个终态全部使用虚线边框标注：一旦任务状态机落入这三个终态之一，后续所有的 `tasks/get` 轮询均将幂等返回该终态快照，不会再发生任何进一步的状态迁移。

## Practice Lab (实战演练)

查看 `code/main.py` 源码。`run_build_pipeline` 是一个拥有统一输入模式的构建部署工具：在底层执行完全相同的构建、测试并在获批后部署的业务逻辑。代码唯一的差异，仅在于调用方是否在请求中显式声明了 `io.modelcontextprotocol/tasks` 扩展。

在课程目录下运行实战脚本：

```bash
python3 code/main.py
```

对照前文核心概念研读终端打印的调用轨迹：未声明该扩展的调用以纯同步模式执行，并明确警告部署阶段需要该扩展方可进行安全人工审批；而声明了扩展的调用则立即获得了 `resultType: "task"` 异步句柄。该实验通过显式单步推进任务状态来模拟真实微服务集群中后台 Worker 在离散请求间的作业推进，而非使用不可靠的后台线程 Sleep，确保运行日志中的每一次状态流转都绝对确定且可复现。追踪同一个 `taskId` 从初次轮询的 `working` 状态演进到 `input_required`，随后观察客户端调用 `tasks/update` 提交 `{"approved": true}` 授权，直至最后一次轮询获取到 `completed` 终态，并对比其内联的 `result` 与同步调用返回的结构。最后观察两处异常防御：针对伪造的 `taskId` 发起 `tasks/get` 稳定触发 `-32602` 错误；而针对真实合法的 `taskId`，若客户端在轮询时漏掉了扩展声明，则稳定收到 `-32021` 缺失能力报错。

## Shipped Artifact (交付产物)

`outputs/long-running-work-patterns.md` 是一份权威长耗时架构决策指南：涵盖了在同步调用、MRTR 往返、Task 与服务端句柄之间取舍的精准准则；能力协商操作清单；`CreateTaskResult` 字段定义；包含顶层 `resultType` 与内层嵌套 `status` 判别逻辑的轮询准则；以及 2025-11-25 实验方法被现代机制全面取代的权威对照表。在设计可能耗时较长、随时面临客户端耐心或网关超时考验的复杂工具时，请将其作为标准设计规范。

## Verify It (验证步骤)

在当前课程目录下执行单元测试：

```bash
python3 -m unittest discover code/tests
```

测试集系统性核验了本课建立的全部规则：不带扩展的调用能够平稳退化返回常规结果；携带扩展的调用立即获得标准任务句柄；轮询能够正确观察到底层状态从 `working` 演进为 `input_required`；处于等待输入状态的快照暴露出结构完备的 `inputRequests` 条目；`tasks/update` 能够成功唤醒并恢复任务执行；处于 `completed` 状态的快照在内层直接内联了原始结果；`tasks/cancel` 能够将运行中的任务置为 `cancelled`；未知 `taskId` 返回标准协议错误；而在未声明扩展能力时调用该方法严格返回 `-32021`。运行协议通信校验器：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/21-long-running-work-and-tasks
```

## Capstone Connection (项目连接)

在毕业设计的综合评估场景中，某些受严格审计管控的工具调用由于耗时较长或需要中途人工确认，将被要求架构重构为标准任务形态而非普通同步阻塞。此时，本课阐述的四道核心考题将直接决定系统的可用性：客户端是否在单请求级正确声明了该扩展、服务端是否正确对外通告、任务句柄是否在下发前已达成存储持久化，以及轮询代码是否清醒地将外层 RPC 的 `resultType` 与内层后台作业的 `status` 严格隔离开来。

## 核心术语 (Key Terms)

| 术语 (Term) | 核心内涵解释 |
|---|---|
| `io.modelcontextprotocol/tasks` | MCP 官方标准化扩展标识，用于以异步持久化句柄处理长耗时作业 |
| `CreateTaskResult` | 服务端用于替代同步完成结果直接返回的异步任务创建响应 (`resultType: "task"`) |
| `tasks/get` | 通过 `taskId` 抓取单项任务完整、实时最新状态快照的标准轮询方法 |
| `tasks/update` | 针对任务提出的未决 `inputRequests` 提交对应 `inputResponses` 的输入补全方法 |
| `tasks/cancel` | 向特定任务发出协同取消诉求的控制方法 |
| `input_required` | 任务核心状态之一，表明服务端需要调用方提供进一步输入方可继续推进 |
| `pollIntervalMs` | 服务端建议调用方在两次轮询之间保持的最小安全延迟间隔（毫秒） |
| `ttlMs` | 任务从创建时刻开始算起的有效保留期时长 |
| Durable before return | 核心架构原则：`taskId` 在被交到客户端手中之前，必须在底层存储中已确立可查 |
| Cooperative cancellation | 协作式取消机制：`tasks/cancel` 仅登记取消意愿，不构成服务端强行掐断的绝对保证 |

## 延伸阅读 (Further Reading)

- [MCP 官方 Tasks 扩展规范文档](https://modelcontextprotocol.io/extensions/tasks/overview)
- [SEP-2663：Tasks 扩展标准定义](https://modelcontextprotocol.io/seps/2663-tasks-extension)
- [SEP-1686：Tasks 历史档案 (2025-11-25 实验性规范备忘)](https://modelcontextprotocol.io/seps/1686-tasks)
- [有状态工具设计规范 (Stateful Tools)](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#stateful-tools)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 4 与 14 章节
- `phases/13-tools-and-protocols/13-mcp-async-tasks`，亲手搭建具备进程崩溃恢复与共享持久化存储能力的异步任务工作节点
