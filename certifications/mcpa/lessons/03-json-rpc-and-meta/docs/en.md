# JSON-RPC 消息信封

> 一个此前从未与你通信过的服务端，仅凭这一条消息本身就必须明确：你是否期待回复、你使用的是哪个协议版本，以及你的协议元数据在何处结束、业务参数从何处开始。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 02
**Time:** ~45 minutes

## 学习目标

- 能够将线缆中传输的任何符合 2026-07-28 规范的消息分类为请求（Request）、通知（Notification）、成功响应（Result Response）或错误响应（Error Response），并说出界定各形态的 `id` 规则
- 深入解释 `resultType` 的设计语义，阐明为何 `complete` 与 `input_required` 是两大核心取值，以及客户端必须如何处理未识别或缺失该字段的情况
- 熟练依据前缀与名称的语法规范校验 `_meta` 键名，并通过检查第二级标签而非第一级标签，准确识别 MCP 官方保留前缀
- 指明请求、通知和结果各应携带哪些 MCP 官方保留的 `_meta` 键，以及针对 OpenTelemetry 分布式链路追踪上下文设立的唯一例外
- 解释为何缺少必要 `_meta` 字段的请求会被返回 `-32602` 错误直接拒绝，以及为何 MCP 严禁在单次批处理中传输多条消息

## 问题背景

在第 02 课中，我们观察了一个客户端如何成功发现两个此前从未见过的服务端，并分别调用它们提供的工具。在这一交互表象之下，隐藏着一个更加微观且锐利的考查核心，认证考试要求考生对此毫无犹豫地做出判断：面对通过 stdio 管道传输或作为可流式传输 HTTP（Streamable HTTP）POST 请求体抵达的一段任意 JSON 数据，它到底属于哪种消息形态？接收方对它做出的行为假设究竟是什么？

JSON-RPC 2.0 规范为 MCP 提供了四种基础消息形态，而协议规范对于接收方如何分辨它们有着极为严苛的要求，因为无状态的服务端根本无法依赖任何连接级别的预设上下文。在通信链路建立时，从来没有过一次预先协商好“本连接采用版本 X”或“当前数据流仅承载来自客户端 Y 的请求”的握手流程。每一条独立的消息都必须自带完备的身份说明信息，以至于任何处理该消息的接收方节点（极可能是集群中与处理前一条消息完全不同的另一个服务端副本），孤立地审视该消息时都能次次推导出一模一样的结论。

这种自描述能力在两个层次上展开。外层是消息信封本身：这是需要回复的请求、不需要回复的通知、执行完毕的结果，还是执行受阻的错误？如果 `id` 字段的使用发生差错，服务端就无法区分客户端发来的是请求还是通知，客户端也无法将收到的响应与先前发起的调用精准配对。内层则是 `_meta` 结构，请求、通知或响应都可以利用它来携带协议层面的事实数据（例如该请求声明所采用的协议版本），同时避免这些协议元数据与应用程序自身业务参数中恰好命名为 `version` 或 `capabilities` 的业务字段发生命名碰撞。如果违反了 `_meta` 的命名法则，自定义扩展字段就可能悄无声息地遮蔽协议核心字段，或者反过来被核心字段覆盖。

## 核心概念

**四种消息形态，各遵循一条铁律。** 请求（Request）必须携带 `id`、`method` 以及可选的 `params`；`id` 必须是字符串或整数，绝不能为 `null`，且绝不能重复使用发送方当前仍在等待响应中的未完成 ID。

```json
{"jsonrpc": "2.0", "id": 7, "method": "tools/call", "params": {"name": "get_weather", "arguments": {"location": "Pune"}}}
```

通知（Notification）携带 `method` 和可选的 `params`，但绝对不能包含 `id`。接收方无论成功还是失败，都坚决不得对通知发送任何响应。

```json
{"jsonrpc": "2.0", "method": "notifications/progress", "params": {"progressToken": 7, "progress": 1, "total": 2}}
```

成功结果响应（Result response）必须回显请求的 `id`，并携带 `result` 对象。该对象中必须包含 `resultType` 字段。

```json
{"jsonrpc": "2.0", "id": 7, "result": {"resultType": "complete", "content": [{"type": "text", "text": "Pune: sunny, 26C"}], "isError": false}}
```

错误响应（Error response）同样必须回显请求的 `id`（唯一的例外是请求结构本身严重畸形损坏导致根本无法解析出 `id` 的罕见场景）；它携带包含整数 `code` 和字符串 `message` 的 `error` 对象，并可按需附加 `data` 详情。

```json
{"jsonrpc": "2.0", "id": 3, "error": {"code": -32602, "message": "Missing required _meta field(s): io.modelcontextprotocol/protocolVersion"}}
```

**`resultType` 告知客户端如何解读后续数据。** 取值为 `"complete"` 意味着结果中包含了最终生成的业务内容，无需后续动作。取值为 `"input_required"` 则代表返回的是 `InputRequiredResult` 对象，这是多轮交互模式（Multi Round-Trip）下服务端在最终完成调用之前向客户端索取更多输入信息的数据结构；关于此重试交互机制，将在后续课程专门深入拆解。扩展模块还可以注册其他扩展枚举值（例如用于长耗时任务的 `"task"`），但前提是客户端必须预先声明了对等的能力支持。若客户端接收到无法识别的 `resultType`，必须将其直接判定为无效响应，而绝不能主观臆测其内部结构；唯一的向后兼容例外是：当客户端与不支持该特性的早期旧版服务端通信且响应完全缺少 `resultType` 时，客户端应默认将其作为 `"complete"` 处理。

**`_meta` 将协议元数据隔绝于应用命名空间之外。** 一个合法的 `_meta` 键名由两部分组成：可选的前缀（prefix）和名称（name）。当包含前缀时，前缀是由点号分隔的一个或多个标签后跟斜杠 `/` 组成；每个标签必须以英文字母开头，以字母或数字结尾，中间允许包含字母、数字或连字符。名称在非空时必须以字母数字开头和结尾，中间允许使用字母、数字、连字符、下划线和点号。对于 MCP 官方前缀而言，其核心保留规则是：当且仅当点号分隔的**第二级标签**（而不是第一级标签）为 `modelcontextprotocol` 或 `mcp` 时，该前缀被视为 MCP 协议的官方保留前缀。这正是考题极易命题的细节所在：`io.modelcontextprotocol/protocolVersion` 与 `dev.mcp/anything` 均属于官方保留前缀，因为 `modelcontextprotocol` 和 `mcp` 位于第二级位置；而 `com.example.mcp/scanId` 则不是保留前缀，因为其第二级标签是 `example`，`mcp` 仅出现在第三级；形如 `mcp.example/thing` 的键名同样不属于保留前缀，因为 `mcp` 位于第一级标签且第二级非保留字。官方强烈建议开发者为自定义扩展使用类似反向 DNS 的前缀命名（例如 `com.example/` 而非 `example.com/`），从而确保命名空间的隔离是主动规划的结果，而非意外冲突。

**每个请求声明自身版本与能力，每个结果可回显服务身份。** 位于 `io.modelcontextprotocol/` 命名空间下的三个请求级 `_meta` 键至关重要：`protocolVersion`（字符串，必需项）、`clientCapabilities`（对象，必需项，允许为空对象），以及 `clientInfo`（标注客户端身份信息的实现结构，虽非强校验项但除非客户端有意配置省略，否则预期始终携带）。第四个键 `logLevel` 允许单次请求针对已废弃的日志功能订阅日志通知。如果请求缺少上述任一必需项，即属畸形请求，合规服务端必须以 JSON-RPC 错误码 `-32602` 明确拒绝，在 HTTP 传输层则映射为 `400 Bad Request` 状态码。在回传方向上，服务端应当在响应结果的 `_meta` 中附带 `io.modelcontextprotocol/serverInfo`，以便明确回显产出该响应的服务端实现版本。需要明确的是，`clientInfo` 与 `serverInfo` 纯属双方自声明字段，底层协议从未对它们进行防篡改真实性验证；它们仅用于日志记录、界面展示与排查调试，若有网关或服务端将它们作为身份认证或权限路由的凭据，就犯了将客套自称错当安全凭据的严重架构错误。

**无前缀的少量特殊保留键。** 不带任何前缀的 `progressToken` 允许请求开启进度通知监听。`io.modelcontextprotocol/subscriptionId` 则会出现在通过 `subscriptions/listen` 数据流派发的每条通知中，供客户端区分当前事件属于哪个订阅。`traceparent`、`tracestate` 与 `baggage` 则是前缀规则中唯一刻意保留的免命名空间例外：因为 W3C 与 OpenTelemetry 规范约定了这三个无前缀的标准名称，MCP 在 SEP-414 中决定对它们予以直接保留，避免破坏现有分布式链路追踪生态的开箱即用兼容性。

**消息绝不结伴成批传输。** JSON-RPC 批处理调用早在 2025-06-18 的修订版中就已被正式彻底移除，至今从未回归。在可流式传输 HTTP（Streamable HTTP）中，一个 POST 请求体只能承载一条请求或一条通知；在 stdio 传输中，一行换行符分隔的文本只能承载一条独立消息。如果客户端准备好发起三个并发请求，它必须发送三个独立的 HTTP POST 请求体，绝不能合并为一个包含三项的 JSON 数组。

```figure
mcpa-03-envelope
```

## 交互式实验

上方图表顶层并排对比了四种消息形态的判定核心：请求必须具备非空的 id、通知必须彻底没有 id、成功结果必须包含 resultType、错误响应必须具备 code 和 message。图表下半部分对 `_meta` 键名进行了两次深度剖析，将斜杠两边的标签与名称拆解展示。`io.modelcontextprotocol/protocolVersion` 高亮了第二级标签 `modelcontextprotocol`，清晰说明了其为何属于官方保留空间；而 `com.example.mcp/scanId` 同样高亮了其第二级标签，但由于该标签是 `example`，因此尽管字符串后部出现了 `mcp`，它依然属于自由使用的非保留前缀。并排对照两行高亮显示，规则一目了然：决定前缀是否为官方保留的关键在于位置，而不仅仅在于单词是否出现。

## 实战演练

打开 `code/main.py`。该脚本没有网络通信，也不依赖任何外部 SDK，纯粹聚焦于本课传授的消息形态逻辑。`classify_message` 接收原始字典并返回 `"request"`、`"notification"`、`"result"`、`"error"` 或 `"invalid"`，其判定严格遵循上述 id 规则：有 method 且无 id 归为通知，有 method 且 id 合法归为请求，有 method 但 id 为 null 则属于非法消息；`meta_key_status` 接收键名字符串并依据前缀语法及第二级标签规则，准确返回 `"reserved"`、`"free"` 或 `"invalid"`：

```bash
python3 code/main.py
```

首先对照核心概念研读控制台打印出的分类清单，随后观察 `run_scenario` 运行的一组消息交互演示：包含一个得到完整结果回复的合法 `tools/call` 请求、一个未产生任何回应的 `notifications/progress` 进度通知，以及被通信校验器视为违规流量的三个故意构造的错误示例（分别附带违规原因说明）。这三个错误包括：携带了不该出现的 id 的通知、id 为 null 的畸形请求，以及完全缺失 `_meta` 的请求；随后代码展示了合规服务端遇到此类情况时，通过相同的 `handle_request` 逻辑所真实生成的 `-32602` 错误响应。尝试将请求中缺失的字段从 `protocolVersion` 改为 `clientCapabilities` 并重新运行，观察报错信息如何精准指出另一个缺失的元数据键名。

## 交付产物

`outputs/message-shapes-reference.md` 是本课交付的单页消息结构参考速查文档：收录了四种基础消息形态定义、resultType 枚举取值、包含第二级标签校验准则的 `_meta` 语法规范，以及完整的保留键名速查清单（附带对应简报章节索引）。在审查原始 MCP 通信流量时建议常备此表，它能帮助你迅速判定特定消息结构是否合法、某个元数据键名是否可供业务自由使用。

## 验证方法

在课程目录下执行单元测试：

```bash
python3 -m unittest discover code/tests
```

这些测试验证了本课的核心技术规则：所有四种消息形态分类准确无误；null 的请求 id 与携带 id 的通知均被严格判定为非法；缺少 resultType 的结果对象被正确标记违规；`io.modelcontextprotocol/protocolVersion` 与 `dev.mcp/anything` 被判定为保留键，而 `com.example.mcp/anything` 被判定为自由键；四个无前缀的特殊保留键被准确识别；畸形键名判定为无效；请求缺失 `protocolVersion` 或缺失 `clientCapabilities` 均触发 `-32602` 协议错误；结构完备的合法请求能平稳完成；且通信记录中的每个解包结果均合规包含 resultType。仓库自带的通信校验器同样对测试通信记录执行严苛的 2026-07-28 规则审查（包括检验三个故意注入的违规示例是如何被包装记录的）：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/03-json-rpc-and-meta
```

## 项目连接

后续第 04 课直接在本文讲授的消息信封之上构建其“无状态（Stateless）”设计：服务端之所以能够将每个到达的请求视为自包含单元，正是因为每个请求都已在自身的 `_meta` 中注入了协议版本与能力声明，无需再从底层物理连接中获取推断信息。第 18 课的错误处理分类体系同样建立在此基础之上，要求熟记 `-32602` 是畸形元数据引发的错误码，且错误响应中的 `data` 属于可选拓展。在 Capstone 最终项目的端到端通信中，首条交互消息正是按照本课实验所示的标准信封规范（包含完备的 `_meta` 结构）构建的，信封构造稍有不慎，后续整条调用链都会直接崩溃。

## 核心术语

| 术语 | 定义 |
|------|------|
| Request (请求) | 包含 `id`、`method` 及可选 `params` 的消息，预期恰好获得一次响应 |
| Notification (通知) | 包含 `method` 及可选 `params` 但坚决不含 `id` 的单向消息，绝不获取响应 |
| Result response (结果响应) | 回显请求 id 并携带包含 resultType 的 `result` 对象的业务成功响应 |
| Error response (错误响应) | 携带包含整数 `code` 和字符串 `message` 的 `error` 对象的协议失败响应 |
| resultType | 指明当前结果完成阶段的字段：支持 complete、input_required 或扩展值 |
| `_meta` | 承载协议级元数据的属性，由可选的点分前缀和名称组合作为键名 |
| Reserved prefix (保留前缀) | 点分第二级标签为 `modelcontextprotocol` 或 `mcp` 的官方保留前缀 |
| protocolVersion | 位于 `_meta` 中的必需字段，明确声明单次请求所遵循的协议版本 |
| clientCapabilities | 位于 `_meta` 中的必需字段，声明与当前单次请求直接相关的客户端能力 |
| 自声明字段 (Self-reported) | clientInfo 与 serverInfo：由发送方自行填写的标识，未经验证，绝不可充当安全凭证 |

## 延伸阅读

- [MCP 规范 2026-07-28：基础协议](https://modelcontextprotocol.io/specification/2026-07-28/basic)，重点研读 Messages 与 `_meta` 通用字段
- [SEP-414：在 `_meta` 中引入 OpenTelemetry 链路追踪上下文](https://modelcontextprotocol.io/seps/414-request-meta)
- [TypeScript Schema：所有消息形态与数据类型的唯一真理来源](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2026-07-28/schema.ts)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md` 第 2 节与第 3 节
