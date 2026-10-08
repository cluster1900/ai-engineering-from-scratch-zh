# 模型交互流程 (Model Interaction Flow)

> 工具调用绝非网络上的一条孤立消息。它是宿主在用户、模型与服务端之间驱动的闭环交互，该循环的每一次轮转都决定了模型下一步能看到什么。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 09
**Time:** ~45 minutes

## 学习目标

- 完整追踪从用户请求开始，经过宿主构建模型上下文、工具选择、确认拦截关卡（confirmation gate）、`tools/call`、服务端执行，直至结果返回给模型的全链路交互路径
- 准确陈述模型在每个轮次中实际看到的数据：调用前仅能看到工具名称、描述及 Schema，调用后能看到 content 内容或 `isError` 状态标志
- 依据清单审阅课中的注解默认值规则，在具有破坏性的调用实际发送至网络之前，应用确认关卡将拟调用的输入参数呈现在人类面前进行确认
- 阐明为何确定性工具排序（deterministic tool ordering）能同时保护客户端本地缓存与大模型提供商的 Prompt 缓存机制
- 能够清晰区分 `input_required` 业务中断、工具执行错误以及协议层错误，并说明它们各自如何改变交互循环的下一步决策

## 问题背景

前几节课深入探讨了服务端交付给客户端的三个标准文档：discover 结果、工具列表以及需要带着审慎态度审阅的清单。然而，这些文档并未揭示当用户实际输入请求的瞬间究竟发生了什么。安静躺在 `tools/list` 中的工具定义本身是静态的，直到外部机制将其转化为具体的决策、网络调用与响应，而这个机制正是宿主（Host）内部运行的交互循环，而非单次孤立的请求。如果跳过对该循环的研究，你或许依然能回答关于消息报文格式的考题，但一旦遇到涉及运行时行为的问题就会失分：例如客户端是否应当重试畸形的请求、在执行破坏性操作前是否必须先由人类确认、以及在轮次之间重新对工具数组排序为何会悄无声息地破坏模型提供商赖以优化的缓存。

在这套交互循环中常常出现两类性质完全不同的错误，而认证考试对两者均会进行深度考查。第一类是协议层面的技术错误：直接将裸 JSON-RPC 错误抛回给模型并妄图让其自行纠错，或者在处理 `input_required` 结果进行重试时，忘记递增分配全新 ID 以及逐字节原样回传 `requestState`。第二类是纯宿主设计层面的缺陷，这类问题甚至完全不会在网络通信层留下痕迹：例如跳过确认提示、在执行敏感调用前对用户隐瞒模型拟传入的参数，或者在每一轮交互中随意打乱工具列表的先后顺序。一个客户端即使在网络报文规范上表现得无懈可击，依然可能因为糟糕的宿主策略而彻底搞砸交互循环，因为这个闭环中有一半的逻辑属于规范仅给出强烈建议但由宿主全权掌控的策略范畴。

## 核心概念

回顾关于宿主（Host）、客户端（Client）与服务端（Server）分工的核心理念：宿主针对每个服务端运行一个客户端实例，并全权掌控与模型的对话上下文；而客户端仅仅是负责将上层决策转换为底层网络请求的轻量薄层。本课追踪的交互循环包含五个关键阶段，各阶段环环相扣依次递进。

第一阶段，宿主构建模型上下文。宿主本地已持有缓存的 `tools/list` 结果（来自服务发现环节），并将每个工具条目转换为模型真正获准查看的信息：`name`、`description`、`inputSchema`，以及服务端在声明时提供的 `annotations`。工具在底层是如何实现的绝对不会跨越这道边界。模型永远无法看到服务端的源代码、访问凭据或注册表元数据，它所能感知的仅限于审查者在清单审阅时看到的这些公共字段。

第二阶段，模型（在本次实验中由一个确定性的小型模拟函数充当 LLM）结合上下文以及用户的原始输入，推导出拟调用的工具名称以及具体参数。此时尚未产生任何网络报文，这纯粹是宿主内部完成的一项决策。

第三阶段，在客户端向网络发送任何数据之前，宿主必须执行确认关卡（confirmation gate）。规范明确要求，人类用户应当具备拒绝工具调用的控制权，且客户端在实际调用前应当向用户展示拟传入的工具参数；清单审阅课中的注解默认值在这里决定了确认关卡是否被触发：`readOnlyHint` 默认为 `false`，而 `destructiveHint` 默认为 `true`。因此，任何未提供 `annotations` 块的工具在默认规则下均被视作破坏性操作，必须获得人类明确许可方能继续。若用户拒绝授权，交互循环便在此刻彻底终止。客户端绝不会构造 `tools/call` 请求，因而被拒绝的调用在网络线缆上不留任何痕迹，仅由宿主在其内部状态中记录一条审计日志。

第四阶段，一旦调用获得核准，它将变成一条标准的 `tools/call` 请求，如同本课程中的所有其它请求一样，其 `params._meta` 中携带着协议版本与能力声明。此时服务端可能返回三种不同形态的响应，每一种都会将交互循环导向完全不同的后续分支：

```json
{"jsonrpc": "2.0", "id": 5, "result": {"resultType": "input_required", "inputRequests": {"priority": {"method": "elicitation/create", "params": {"mode": "form", "message": "What priority should this ticket have?", "requestedSchema": {"type": "object", "properties": {"priority": {"type": "string"}}, "required": ["priority"]}}}}, "requestState": "eyJ0aXRsZSI6IlZQTiBkcm9wcyJ9"}}
```

第一种分支是 `resultType` 为 `complete` 且 `isError` 为 `false`，这是最顺畅的主干路径：模型读取 `content`（如果工具定义了 `outputSchema`，还会读取 `structuredContent`），宿主随后将该结果直接并入最终答复的生成中。第二种分支是 `resultType` 为 `complete` 但 `isError` 为 `true`，这代表工具执行错误（tool execution error），即双通道错误体系在循环内部的具体体现：模型读取错误解释文本，可以使用修正后的参数重新发起调用，该重试必须使用全新的 ID，且无需涉及 `inputResponses`，因为这仅仅是一次全新的常规调用，而非多轮交互模式。第三种分支是返回 `input_required` 结果（即多轮往返请求模式 MRTR）：服务端此时缺少继续执行所需的必要输入，它通过 `elicitation/create`、`sampling/createMessage` 或 `roots/list` 向宿主索取；宿主必须负责收集缺失的答案，并使用全新的 JSON-RPC ID 发起重试，重试时需将 `inputResponses` 按服务端指定的字段名进行映射，并且必须将 `requestState` 字符串原封不动、逐字节原样回传（客户端绝不能尝试解析其内部内容）。最后，如果服务端直接返回 JSON-RPC 协议错误（例如调用未知工具导致的 `-32602`），这属于底层的协议错误，交互循环绝不应当以相同的内容盲目重试：请求本身没有发生任何变化，重试也绝不可能得到不同的结果。

第五阶段，当宿主拿到 `complete` 结果或确认某一分支不被支持后，它将结果内容重新喂回模型的运行上下文中，模型据此生成最终回复。该回复必须如实引用工具实际返回的数据，而非脱离工具结果擅自编造猜测。

贯穿该交互循环每一轮的核心原则是：只要底层工具集合没有发生增删，`tools/list` 必须在每次调用时返回完全一致的工具排序。这绝非无关紧要的形式主义。宿主通常只在最初构建一次模型上下文中的工具数组，并在后续轮次中复用它；大多数主流模型提供商均对包含该数组的 Prompt 前缀实现了缓存。打乱数组顺序（哪怕只是在中间插入一个新发现的工具而非将其追加到末尾）都会直接导致 Prompt 缓存彻底失效，由此引发的额外 Token 开销往往远超工具定义本身的体积。确定性排序既是客户端信任本地缓存的基石，也是维系模型提供商 Prompt 缓存长效命中率的关键保障。

```figure
mcpa-10-interaction-flow
```

## Interactive Lab

本节架构图完整展现了一个请求流经全部五个阶段的全貌。跟随顶部第一行，从用户输入出发，历经宿主构建上下文、模型做出工具选择，直至到达确认拦截关卡。从该关卡分出两条路径：获得许可的调用继续向右发送至服务端；而被拒绝的调用则直接沉入下方的虚线框中暂存，绝不向外发送。在服务端下方，三种可能的结果发散展开：执行成功的结果向下汇入最终答复，而工具执行错误与 `input_required` 结果均以虚线形式回环向上折返至模型，表明它们属于重试链路而非正向推进。请注意，虽然两条重试路径在图示中形态相似，但其底层机制截然不同：只有其中一条需要分配全新 ID 并原样回传 `requestState`。

## Practice Lab

打开 `code/main.py` 并在课程目录下运行：

```bash
python3 code/main.py
```

终端将打印出 9 组请求与响应报文对。首先审阅前两次 `get_forecast` 调用：模型最初草拟了一组空参数，服务端返回 `isError: true` 并明确指出了缺失的字段，随后模型才从用户的原始提示中提取出城市名称，并使用全新 ID 发起了第二次调用。接着审阅两次 `open_ticket` 调用：第一次调用提供了合法的 `title`，但依然返回了 `input_required`，因为该服务端设计为必须由人类确认工单优先级，绝不放任模型凭空猜测；随后发起的重试携带了 `inputResponses`，并原封不动地带回了服务端签发的 `requestState` 原始字符串。随后观察输出中的确认关卡部分：`close_ticket` 工具没有提供任何 `annotations` 块，因此宿主根据规范默认值直接将其判定为破坏性操作，在发送前将两个拟发起的调用均展示给人类进行确认。其中一个工单获得批准并实际发送到了网络中；另一个工单因为低优先级需要二级复核而被否决，根本没有生成任何 `tools/call` 请求。最后，模型尝试调用该服务端并未提供的 `archive_ticket` 工具，收到了 `-32602` 错误码，随后系统并未进行盲目重试。底部的最终答复直接引用了成功调用中返回的真实内容，而非凭空虚构。你可以尝试修改代码中的 `choose_priority` 或 `approve_close` 函数后重新运行，观察交互循环如何流向不同的分支路径。

## Shipped Artifact

`outputs/interaction-flow-trace.md` 是本课交付的单页交互追踪与决策指南：清晰梳理了模型在调用前后能看到的全部字段、`tools/call` 三种返回结果对交互循环的驱动分支，以及构建合规宿主循环时必须遵循的审查清单（在调用前展示参数、严禁使用相同参数盲目重试协议错误等）。

## Verify It

在课程目录下运行测试套件：

```bash
python3 -m unittest discover code/tests
```

测试全面验证了本课阐述的核心主张：`tools/list` 在每次调用中严格保持完全相同的确定性排序；会话中的每个请求均在 `_meta` 中完整携带协议版本与能力声明；缺失 `_meta` 的请求会被严谨地拒绝并返回 `-32602`；缺少 `annotations` 块的工具默认归为破坏性并触发确认拦截，而显式声明只读或非破坏性的工具则豁免拦截；确认关卡能确保被否决的 `close_ticket` 调用绝不触碰网络线缆，而获批的调用则顺利发送；`get_forecast` 的工具执行错误能正确反馈给模型并在新 ID 下成功重试；`open_ticket` 的 `input_required` 结果会准确阻塞循环直至收集到输入；随后的重试会在新 ID 下逐字节原样回传 `requestState`；`archive_ticket` 产生的协议错误绝不会被机械重试；最终输出的答复如实引用了工具执行的真实结果。本仓库的通信检查脚本还会依据 2026-07-28 规范核验本课的通信记录：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/10-model-interaction-flow
```

## Capstone Connection

Capstone 综合考核中的全流程交互正是本课循环机制的真实演练：构建上下文、交由模型决策、在敏感操作发出前进行人工拦截确认、正确解析三种返回形态，并基于工具返回的真实数据生成回复。当 Capstone 考核涉及“为何某一调用从未出现在网络中”或“为何某次重试必须采用全新 ID”时，其答案均直接溯源自本课讲解的交互循环机制，而非单纯依赖网络报文规则。

## Key Terms

| 术语 | 含义 |
|------|------|
| Model context（模型上下文） | 每个工具的名称、描述、inputSchema 及注解，是模型在做出选择前获准查看的全部信息 |
| Confirmation gate（确认拦截关卡） | 纯宿主内部的安全检查机制，在敏感调用发送至网络前向人类展示参数并请求授权 |
| Tool execution error（工具执行错误） | resultType 为 complete 且 isError: true 的结果；模型读取后可携带修正参数在全新 ID 下发起重试 |
| input_required | MRTR 多轮往返交互的中断标志；宿主收集缺失的输入并在全新 ID 下原样回传 requestState 进行重试 |
| Protocol error（协议错误） | 如 -32602 等底层的 JSON-RPC 错误；交互循环绝不应当以相同参数盲目重试 |
| Deterministic ordering（确定性排序） | tools/list 在工具集未变时始终返回完全相同的顺序，用以保护本地及模型服务商的 Prompt 缓存 |
| requestState | 服务端签发的不透明状态字符串，客户端在 MRTR 重试时必须原样逐字节回传，严禁读取或篡改 |
| Annotation defaults（注解默认值） | 当工具缺失注解时适用的 readOnlyHint: false 与 destructiveHint: true，确认关卡据此触发拦截 |

## Further Reading

- [MCP 规范 2026-07-28：工具、消息流与用户交互模型](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP 规范 2026-07-28：多轮往返请求 (MRTR)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 架构概览](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)
- [MCP 客户端最佳实践：与 Prompt 缓存的协同优化](https://modelcontextprotocol.io/docs/2026-07-28/develop/clients/client-best-practices)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 5、7 及 10 节
- `phases/13-tools-and-protocols/02-function-calling-deep-dive`，深入学习工具调用循环的模型侧逻辑
