# 工具调用生命周期

> 工具调用绝非单一的孤立事件，而是一组严格有序的检查点序列；调用具体停在哪个检查点，直接决定了其适用两类错误通道中的哪一种，以及调用方下一步究竟该如何应对。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 16
**Time:** ~45 minutes

## 学习目标

- 完整梳理工具调用的每一个检查点：发现 (discover)、列表 (list)、选择 (select)、确认 (confirm)、发起调用 (call)、校验 (validate)、执行 (execute) 以及返回结果 (result)
- 准确区分哪些检查点仅存在于宿主应用 (Host Application) 内部，哪些检查点真正在网络传输层 (Wire) 产生了报文流动
- 深入理解为何未知工具始终属于协议级错误 (Protocol Error)，而非法参数几乎总是工具执行级错误 (Tool Execution Error)
- 掌握针对 `input_required`（需要输入）结果与网络流中断 (Broken Stream) 的重试规则：每次都必须分配全新的 JSON-RPC id，严禁复用已失败请求的 id
- 正确理解 `idempotentHint`（幂等性提示）仅为不可信的参考建议而非硬性保证，以此评估盲目重发调用的安全性
- 清晰区分导致客户端彻底放弃调用的硬性超时 (Hard Timeout)，与仅仅暂停当前调用以等待补充信息的 `input_required` 结果

## 问题背景

设想这样一个场景：智能体 (Agent) 要求服务端轮询构建状态、发布新版本或查询关键信息。在简化的认知模型中，工具调用常被视为一个单一事件：发出请求，拿到响应，任务完结。然而，真实的生产级调用并非如此运作。从大语言模型决定调用工具，到调用方最终拿到可供决策的终态结果之间，请求必须穿过数个泾渭分明的检查点 (Checkpoints)，且每个检查点都可能以完全不同的方式终止生命周期。如果调用方将所有失败混为一谈、施加相同的错误处理，就会持续做出错误的决策：它可能会盲目重试一个永远不可能成功的错误调用；或者在只需修正某个参数即可继续时过早放弃；甚至更危险的是，盲目重发具有副作用的操作，而该操作的首次尝试实际上早已在后端执行完毕。

解决之道不在于调用端实现多么精巧复杂的重试逻辑，而在于深刻理解每个工具调用所遵循的固定生命周期范式，从而根据“请求停在了哪里”精准回答“下一步该做什么”。一个因工具名称不存在而未通过校验的请求，与一个进入工具处理函数后触发业务规则校验失败的请求，两者的失败根源截然不同，所需的应对手段也完全不同。这恰恰是认证考试中权重最高的考点领域：“交互与执行 (Interactions and Execution)”反复考查的核心本质：究竟是协议级错误还是工具执行级错误，以及它发生在生命周期的哪一个具体检查点。

## 核心概念

在 2026-07-28 协议规范中，工具调用生命周期严格按顺序穿过八个检查点：发现 (discover)、列表 (list)、选择 (select)、确认 (confirm)、发起调用 (call)、校验 (validate)、执行 (execute) 以及返回结果 (result)。其中仅有部分检查点会在网络层实际产生传输报文，其余检查点则完全运行在宿主应用内部。仅监控 JSON-RPC 网络流量的客户端虽然无法直接窥见后者的存在，但这些内部检查点依然决定了大模型被允许执行的操作边界。

**发现 (Discover) 与列表 (List)** 属于网络层检查点，且两者均支持缓存。客户端通过调用 `server/discover` 获取服务端支持的协议版本、能力集合以及可选的系统指令说明 (`instructions`)，响应中附带缓存存活时间 (`ttlMs`) 与缓存范围 (`cacheScope`)。对客户端而言，调用此接口是可选的，但服务端必须予以实现。`tools/list` 则返回服务端暴露的每个工具的名称、描述、输入模式 (`inputSchema`) 以及注解信息 (`annotations`)，同样具备可缓存性，并且在同一认证权限下对于不同连接必须保持确定性（不过根据请求携带的授权信息不同，可见工具列表允许存在差异）。设计良好的客户端应当优先复用缓存中的工具清单，而不是在每次调用前重复发起全量查询，这也正是为什么“列表”与“调用”在生命周期中被拆分为两个独立检查点的原因。

**选择 (Select) 与确认 (Confirm)** 完全不触及底层网络传输。选择检查点是指大语言模型根据当前上下文窗口中已有的工具描述与模式定义，自主决定调用哪一个工具。确认检查点则是宿主应用决定是立即执行该决策，还是先征求人类用户的授权许可。MCP 规范将此步骤定义为应当遵循的建议 (SHOULD)，而非网络协议报文：宿主应用应当明确向用户展示当前暴露了哪些工具、在发起调用前呈现具体入参，并对敏感操作实施人工审批关卡。诸如 `destructiveHint`（破坏性操作提示）之类的工具注解可为该关卡提供参考，但除非服务端本身绝对可信，否则此类注解仅能作为不可信的参考提示，绝不能等同于强制性的安全保证。如果人类用户拒绝了授权，工具调用的生命周期将在此直接宣告终结，不会向服务端发出任何 `tools/call` 请求，后续的校验与执行检查点自然也就无从谈起。

**发起调用 (Call)** 是客户端实际向服务端发送 `tools/call` 请求的关键时刻。与 2026-07-28 版本中的所有请求一样，该报文自包含元数据，而不依赖预先建立的长连接握手状态：

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "tools/call",
  "params": {
    "name": "get_build_status",
    "arguments": {"build_id": "bld_7"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "progressToken": "pt-9"
    }
  }
}
```

**校验 (Validate)** 是服务端在收到请求后执行的第一个检查点。它只聚焦于一个核心问题：请求调用的工具名称是否属于该服务端实际暴露的工具清单？此时入参的具体内容完全不重要。如果工具名称与服务端列表中的任何一项都不匹配，调用将在此处直接终止，并向客户端返回协议级错误 (Protocol Error)。其错误码必须是 `-32602`（非法参数），而绝非极具诱惑性的 `-32601`（方法未找到）。这是因为就 JSON-RPC 协议层而言，`tools/call` 方法本身是完全合法且已被服务端实现的；未找到的仅仅是包装在参数内部的具体工具名称：

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "error": {"code": -32602, "message": "Unknown tool: delete_all_builds"}
}
```

未通过校验检查点的调用绝不会进入执行阶段，且永远不会生成任何 `result` 响应结构，仅会返回 `error` 报文。这一点至关重要：虽然完整的错误分类学将在后续课程中专门展开，但校验 (Validate) 与执行 (Execute) 的边界切分，正是认证考试中几乎所有关于工具调用错误考题的核心底色。

**执行 (Execute)** 仅在校验确认工具确实存在之后才会触发。该阶段涵盖了其后的全部处理逻辑：对照工具自身的 `inputSchema` 严格校验调用方传入的具体参数，并实际调用业务处理函数 (Handler)。缺失或畸形的参数正是在此阶段被拦截，而非在校验阶段；此时返回的并不是 JSON-RPC 协议错误，而是一个结构完整的普通响应，其内部携带 `resultType: "complete"` 与 `isError: true`，并附带可供模型理解与修正的结构化内容：

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "resultType": "complete",
    "content": [{"type": "text", "text": "Missing required argument(s): environment."}],
    "isError": true
  }
}
```

这是考试中出现频率极高的核心规则：未知工具属于在校验检查点拦截的协议级错误；而参数不符合模式定义、上游接口异常或业务规则冲突，全部属于在执行阶段产出的工具执行级错误。之所以这样设计，是因为大模型完全能够根据后者的报错信息进行自省和纠错，而面对前者的协议级错误则无能为力。这里需要注意一个重要的特例：如果执行过程中遭遇了未预料到的服务端底层系统崩溃（而非输入数据或业务逻辑问题），该异常仍应上报为协议级错误 `-32603`（内部错误），因为这同样不是调用方下次调整输入就能自行修复的。此外，如果请求在 `_meta` 中声明了 `progressToken`，执行检查点也是发送 `notifications/progress` 进度通知的发生地。每条通知必须携带相同的 token、严格单调递增的 `progress` 数值，以及可选的 `total` 和 `message` 字段，且只能在该请求专属的响应流中传输。

**返回结果 (Result)** 是执行阶段的最终归宿：其 `resultType` 只能是 `"complete"`（无论 `isError` 是否为 true）或 `"input_required"`，这是该生命周期所允许的仅有两类终态枚举值。收到 `input_required` 并不代表流程彻底终结，它通常携带 `inputRequests`、`requestState` 或二者兼有。客户端的应对方式是以全新的 JSON-RPC id 重新发起同一个逻辑调用，并在参数中附带匹配键名的 `inputResponses` 以及原样回显的 `requestState`（即前面课程介绍的多轮往返交互模式 MRTR；通过 HMAC 等机制对状态进行防篡改保护在引导式多轮交互课程中已有详细说明，此处保持精简以便聚焦于生命周期本身）。该重试请求将再次自顶向下穿过发起调用、校验、执行与返回结果检查点，这正是**重试 (retry)** 与**终态 (final)** 形成闭环的原因：重试本质上是携带上下文历史的发起调用，而终态则是最终达成的稳定结果（无论是成功的 `complete`，还是调用方决定放弃）。

放弃调用具有其标准形态。服务端应当为每个请求配置超时机制，即使在持续收到进度通知的情况下，硬性超时上限依然生效，因为进度仅证明后台在进行计算，并不能保证一定能在超时前完成。取消机制则与底层传输通道相关：在流式 HTTP (Streamable HTTP) 传输中，直接关闭请求流即代表取消，无需额外发送报文；在标准输入输出 (stdio) 传输中，客户端需要发送 `notifications/cancelled`，指明关联的 `requestId` 以及可选的取消理由。无论是超时还是主动取消，都不会生成专门的 `resultType`（协议中不存在 `"cancelled"` 或 `"timed_out"` 的响应枚举）；服务端只是不再向调用方发送其仍然关心的结果，而已经放弃该请求的客户端也必须主动忽略后续延迟到达的任何响应报文。

连接中断 (Broken Stream) 是一种相似但完全独立的故障类型：请求已成功发出，但在收到任何成功或错误响应之前底层网络连接便已中断。由于 2026-07-28 版本废弃了断点续传机制（不再支持 `Last-Event-ID` 或 SSE 重放），调用方唯一的选择就是使用全新的 id 重新发起调用。盲目重发是否安全，高度取决于工具的 `idempotentHint` 注解；而鉴于该注解仅仅是不可信的建议，严谨的客户端对于非幂等工具会采取防御性策略：并非盲目信任重试，而是依赖服务端在第一步返回的显式不透明句柄 (Opaque Handle)，使得包括流中断重发在内的后续检查点能够基于该句柄安全操作，避免意外重复执行已发生副作用的后台行为。

```figure
mcpa-17-lifecycle
```

## Interactive Lab (交互式实验)

上方的架构图将八个检查点自顶向下排列成链状管道，两条错误分支在各自发生的精确位置剥离开来：校验检查点 (Validate) 分流至 `-32602`（协议级错误，不触发执行，无结果返回），而执行检查点 (Execute) 分流至 `isError`（工具执行级错误，依然包装为标准的 complete 结果结构）。返回结果 (Result) 自身产生两条分流：complete 结束整条链路，而 input_required 则携带全新分配的 id 循环回到发起调用检查点，这也是全图中唯一一条向后回溯的边。请特别注意：选择 (Select) 与确认 (Confirm) 虽然位于调用管道之中，但绝不连接任何错误分支。它们既不会产生协议级错误，也不会产出工具执行级错误，因为它们根本不会向网络层发出任何 JSON-RPC 报文；在确认检查点被拒绝的请求，在发起调用之前便已优雅终止。

## Practice Lab (实战演练)

在课程目录下运行参考模块：

```bash
python3 code/main.py
```

终端打印的每一行均对应一个测试场景的检查点执行轨迹及其最终结局。请将输出中的每个状态转换对照架构图进行核验：`happy_path` 完整执行整条正常链路，并在中途伴随进度通知；`needs_input_then_retry` 展示了收到 input_required 后携带新 id 再次穿过调用、校验、执行与返回结果的二次循环；`confirmation_denied` 在确认未通过后立即中止，完全不发起网络调用；`unknown_tool` 在校验阶段被拦截；`invalid_arguments` 顺利通过校验但在执行阶段返回 isError；`broken_stream_reissue` 演示了针对同一个构建句柄使用两个不同 id 发起两次调用；`timeout_then_cancel` 模拟在持续收到未完成进度后触发超时放弃并忽略迟到响应；`internal_fault` 则演示了执行阶段遭遇意外服务端异常时，如何将其正确暴露为协议级错误而非普通的 isError。

随后打开终端，在当前目录下手动单步调试一个场景：

```python
import sys; sys.path.insert(0, "code")
import main
server, client = main.LifecycleServer(), None
client = main.Client(server)
run = main.run_needs_input_then_retry(server, client)
print(run.stages)
print(run.final)
```

尝试修改 `main.py` 中 `publish_release` 所要求的必填参数，或者为构建任务注入超出 `run_timeout_then_cancel` 轮询预算的时钟周期，重新运行代码观察检查点轨迹的变化。

## Shipped Artifact (交付产物)

`outputs/tool-lifecycle-state-chart.md` 是一份单页工具生命周期状态速查表：详细列出了每一个检查点、其属于网络可见还是宿主内部、可能触发的错误通道，以及针对各类调用暂停或故障场景的精准重试规则。在开发客户端或服务端实现时，可将其作为判定“当前环节应当发生什么”的架构设计参考标准。

## Verify It (验证步骤)

在课程根目录下执行单元测试套件：

```bash
python3 -m unittest discover code/tests
```

测试集系统性校验了本课提出的全部论断：正常路径下的各个检查点严格遵循文档规定的时序；`input_required` 结果必然伴随使用新 id 完成的重试请求；确认拒绝在网络调用前终止；未知工具在校验阶段以 `-32602` 报错；模式冲突在执行阶段体现为 `isError: true`；连接中断使用新 id 针对相同句柄安全重发；硬性超时能够触发请求取消并自动忽略后续延迟响应；执行阶段的非预期系统错误依然映射为协议级错误；`tools/list` 保持确定性排序输出；且所有请求与结果均包含当前协议规范所要求的完备字段。此外，课程配套的网络报文校验脚本也会同步验证本次运行的通信轨迹：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/17-tool-invocation-lifecycle
```

## Capstone Connection (项目连接)

MCPA 毕业设计中的端到端完整交互，本质上就是本课生命周期的实战落地：前期的服务发现与工具列表查询、需要严格校验参数模式的工具调用、针对 `input_required` 采用新 id 的多轮交互、执行过程中的进度推送与可能发生的超时取消，以及最终记录在审计日志中的不可篡改结果。当综合项目要求你论证为什么某种架构设计要以特定方式进行重试、放弃或上报错误时，底层标准始终是“该事件发生在哪一个检查点”，这正是本课帮助你建立的条件反射。

## 核心术语 (Key Terms)

| 术语 (Term) | 核心内涵解释 |
|---|---|
| Checkpoint (检查点) | 工具调用从发起至返回结果必须依次穿过的八个固定阶段之一 |
| Validate (校验) | 仅核实被调用工具名称是否合法的检查点；此阶段失败必为协议级错误 |
| Execute (执行) | 校验入参模式并运行处理函数的检查点；此阶段失败绝大多数为工具执行级错误 |
| Protocol error (协议级错误) | JSON-RPC 的 `error` 报文结构，模型无法直接根据其内容进行参数微调自愈 |
| Tool execution error (工具执行级错误) | 携带 `isError: true` 的完整结果，大语言模型可阅读其报错并自主修正入参 |
| Retry (重试) | MRTR 多轮往返重发机制：使用新分配的 JSON-RPC id、携带匹配响应并原样回显状态 |
| Reissue (重新签发) | 连接意外中断后使用新 id 重新发送调用；由于传输层无状态，不支持断点续传 |
| idempotentHint (幂等性提示) | 标识重复调用是否安全的参考提示，属于不可信建议，不能作为绝对安全保证 |

## 延伸阅读 (Further Reading)

- [MCP Tools 规范](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)，重点阅读错误处理 (Error Handling) 与有状态工具 (Stateful Tools) 章节
- [多轮往返请求 (MRTR) 规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [请求取消 (Cancellation)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation) 与 [进度通告 (Progress)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/progress)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 5、7 与 8 章节
- `phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control`，深入探讨超时、取消与流控机制
