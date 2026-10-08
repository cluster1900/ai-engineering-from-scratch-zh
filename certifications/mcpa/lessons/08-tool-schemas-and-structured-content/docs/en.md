# 工具定义中的契约机制

> inputSchema 绝非大模型可以随性意会的软性建议：在处理函数（Handler）启动之前，服务端就会依据它严格校验参数，且格式非法的参数依然会作为大模型可读、可纠偏的执行结果规范返回。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 07
**Time:** ~45 minutes

## 学习目标

- 全面列举工具定义中除 name 和 description 之外的所有规范字段（包括 outputSchema、icons 及 annotations 等），并明确指出 inputSchema 绝对不能为何种值
- 深入解释为何 JSON Schema 2020-12 是 inputSchema 与 outputSchema 的默认方言标准、Schema 何时应显式声明其他方言，以及 SEP-2106 如何放宽了 Schema 所允许使用的关键字限制
- 系统梳理 structuredContent 如何契合 outputSchema 的约束，以及服务端为何必须同时将相同内容序列化为一个文本内容块（text content block）
- 牢记工具命名的硬性语法规范，并解释聚合多个服务端的宿主为何必须使用服务端 ID 作为前缀，而不能盲目依赖 serverInfo 的唯一性
- 严格区分未知工具（协议级错误）与未能通过 Schema 校验的参数输入（包含 isError: true 的工具执行错误），并解释为何唯有后者能够可靠地传递给大模型用于自纠

## 问题背景

在第 07 课中介绍的服务发现步骤，能够让客户端获取当前服务端提供的工具清单，每个工具都包含可供大模型阅读的名称与功能描述。然而，文本描述纯属自然语言散文，程序代码根本无法针对一段自然语言散文来对传入的参数对象执行确定性校验。“根据 SKU 查询商品信息”这样的一句话虽然告诉了读者工具的作用，但它完全没有定义参数字段名究竟拼写为 `sku` 还是 `productId`、字段类型应该是字符串还是整数，或者当调用方完全漏传该字段时系统应当做出何种反应。

工具定义通过引入第二个更为严谨的部分来弥合这一鸿沟：`inputSchema`，一个客户端与服务端均能以相同标准解析的 JSON Schema 对象。它绝非摆在代码旁边的静态参考文档，而是参数对象在获准递交给底层业务处理函数（Handler）之前所必须严格满足的数据形态。任何合规的服务端在每一次调用到达时都必须严格执行这一校验，无论发起调用的客户端声称自己构建参数时有多么严密。

正确理解这一校验过程之所以在认证考试中占据极高权重，还源于另一个核心架构原因：参数不满足 Schema 与调用了一个凭空捏造的未知工具名，从宏观表象上看似乎都是“调用失败了”，但在 2026-07-28 规范的线缆通信中，两者的处理通道有着天壤之别。混淆这两类错误是工程实现中最常见的严重缺陷之一，也是本课重点纠正的常见直觉误区：即误以为任何非法的 `tools/call` 都应当作为 JSON-RPC 协议错误返回。

## 核心概念

一个完整的工具定义所包含的字段，远比简单的名称、描述和 inputSchema 丰富。完整的字段集合包括：`name`（名称）、可选的用于展示的 `title`（标题）、`description`（描述）、可选的 `icons`（图标集合）、必需的 `inputSchema`（输入模式）、可选的 `outputSchema`（输出模式）、可选的 `annotations`（注解提示，例如 `readOnlyHint` 只读提示与 `destructiveHint` 破坏性提示，除非服务端本身具备受信任凭据，否则默认不可全信，详见后续清单分析课程），以及可选的 `_meta`。在整个结构中有一条不可逾越的硬性规则：`inputSchema` 必须是一个合法的 JSON Schema 对象，且**绝对不能为 null**。对于不需要任何输入参数的无参工具，官方推荐的标准声明形式为 `{"type": "object", "additionalProperties": false}`，该定义仅严格接受一个空对象 `{}`；而如果仅仅声明 `{"type": "object"}`，则依然会被动接受携带了未定义多余属性的脏数据对象。

`inputSchema` 与 `outputSchema` 均采用 JSON Schema 标准。当 Schema 未显式包含 `$schema` 声明时，协议默认遵循 JSON Schema 2020-12 方言标准。Schema 亦可通过显式声明指定采用其他特定方言：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {"a": {"type": "number"}},
  "required": ["a"]
}
```

在 SEP-2106 提案通过之前，早期规范曾将 `inputSchema` 机械限制在 `type`、`properties` 和 `required` 几个基础关键字上，导致类似 `oneOf` 这样的高级组合校验能力无法使用。自 SEP-2106 起，`inputSchema` 依然保持外层 `type: object` 约束（因为工具调用参数始终是键值对对象），但允许自由采用 2020-12 规范支持的任何其他关键字；而对于 `outputSchema`，规范允许采用任何合法的 JSON Schema 结构，完全不再强加 `type: object` 的硬性限制，因为工具的执行输出完全可能是一个对象、一个数组甚至是一个基础标量值：

```json
{
  "type": "object",
  "oneOf": [
    {"properties": {"id": {"type": "string"}}, "required": ["id"]},
    {"properties": {"name": {"type": "string"}}, "required": ["name"]}
  ]
}
```

当 Schema 允许采用任意 JSON Schema 表达时，必须在实现层附加两项至关重要的安全防御边界：第一，解析为网络外部 URI（例如绝对路径的 https 地址）而非同文档内部指针（如 `#/$defs/Sku`）的 `$ref` 引用，**绝对不能自动发起网络反向解析**。一个毫无防备、盲目拉取每个 `$ref` 指向地址的校验器，实际上等同于直接为外部攻击者敞开了利用服务端作为跳板向任意目标发起网络请求（SSRF 攻击）的危险通道。系统可以提供主动开启网络解析的模式，但该模式必须保持默认关闭、受白名单严格约束并设置防御上限；第二，对复杂组合关键字（`anyOf`、`oneOf`、`allOf`、`if/then/else`）以及 `$defs` 引用的递归深度、子模式数量或单次校验耗时必须设置防御上限，以防止病态构造的恶意 Schema 将参数校验过程本身变成拒绝服务攻击（ReDoS）的温床。

`outputSchema` 与 `structuredContent` 是相辅相成的配对概念。`structuredContent` 可以是任何合法的 JSON 数据值，并不局限于对象形态：当 `outputSchema` 明确声明时，纯数组记录或裸露的数字标量均完全合规。在服务端定义了 `outputSchema` 时，工具执行成功所返回的 `structuredContent` 必须完全契合该 Schema 约束；同时，为了保证向下兼容只能读取普通文本消息的旧版客户端，服务端 SHOULD 必须同时将该结构化对象序列化为对应的文本内容块（text content block）：

```json
{
  "content": [{"type": "text", "text": "{\"sku\": \"SKU-100\", \"priceUsd\": 24.99}"}],
  "structuredContent": {"sku": "SKU-100", "priceUsd": 24.99}
}
```

工具命名同样有严格的规范：长度限制为 1 至 128 个字符、大小写敏感、仅允许由英文字母、数字、下划线、连字符和点号构成，且必须保证在单个服务端内部全局唯一。当宿主将来自多个独立服务端的工具聚合到同一套环境时，完全可能会遭遇类似 `search` 这样的名称冲突。这也是宿主必须使用自身分配的服务端标识符作为前缀对其进行消除歧义的原因，绝对不能指望 `serverInfo.name`，因为协议规范明确说明自声明名称无法保证跨生态的绝对唯一。

现在重点进行逻辑纠偏。当传入的参数未能通过 `inputSchema` 校验时（无论是缺失必填字段、类型错误、枚举值越界，还是传入了被禁止的多余属性），这在规范中被明确归类为**工具执行错误（Tool execution error）**：即返回一个常规的成功响应对象，但其内部包含 `isError: true`，并在文本内容中详细说明错误原因与纠正建议。这**绝不是** JSON-RPC 协议错误，特别严禁返回 `-32602`。协议级错误（例如当调用了一个服务端从未注册的未知工具名时返回的 `-32602`，或者请求消息本身未能满足 CallToolRequest 的协议模式）仅保留给大模型无法通过微调参数自行修正的真正底层缺陷。SEP-1303 提案在各大工程团队频繁错误地将参数校验失败汇报为协议错误之后，将这一分界线显式标准化：客户端通常只会把工具执行错误完整呈现给大模型，如果将校验失败隐藏在底层协议错误之中，大模型将完全丧失分析错误并自动重新尝试正确参数的能力。

```figure
mcpa-08-schema-contract
```

## Interactive Lab

上方图表左侧展示了一个工具的 `inputSchema` 与 `outputSchema`，紧接着是一个用于决定是否放行调用至 Handler 的校验门禁。顺着两条不同的执行路径进行观察：若 Schema 校验失败，虚线路径直接阻断请求触达底层 Handler，并就地生成包含 `isError: true` 的常规业务结果；若校验通过，实线路径放行执行 Handler，并在返回 `structuredContent` 的同时附带其文本镜像块。观察图表右侧：当请求调用了一个服务端从未声明过的工具名称时，流量直接走向了一条完全独立的硬错误路径，触发 `-32602` 协议错误，因为面对一个根本不存在的工具，底层没有任何 Schema 可供比对校验。打开 `code/main.py` 并运行，随后将控制台输出的每一条响应与图表中的两条路径准确对应。

```bash
python3 code/main.py
```

按顺序阅读打印出的通信记录：首先是一次针对 `lookup_product` 的合法调用，紧接着是触发 Schema 校验失败的四种不同错误调用（遗漏 `sku` 必填项、`region` 传入了枚举之外的值、`sku` 传入了错误的类型，以及传入了被禁止的多余属性）；随后观察无参工具 `server_time` 的正常调用以及传入多余参数时的被拒情况；最后观察针对一个服务端从未注册过的工具名称发起的调用。前述所有参数校验失败均以 `isError: true` 的形式规范返回；唯有最后一次针对未知工具名的调用，返回了标准的 JSON-RPC 协议错误。

## Practice Lab

在 `code/main.py` 中扩展 `build_catalog_server`，添加第三个工具 `list_regions`：其 `outputSchema` 在根节点描述一个字符串数组（而非对象），以匹配 SEP-2106 所允许的数组及标量 `structuredContent` 特性。按照官方推荐的无参形式为其编写空的 `inputSchema`，并使其处理函数直接返回一个原生的 Python 列表。使用 `validate_arguments` 验证你返回的数组在新定义的 Schema 约束下没有任何字段缺失或类型错误（本课内建的轻量校验器覆盖了 type、properties、required、enum 和 additionalProperties，这正是生产级 JSON Schema 库扩展至完整 2020-12 词汇的核心子集）。随后尝试注册一个其 `inputSchema` 中包含指向外部网络主机的 `$ref` 的恶意工具（类似代码中 `attempt_network_ref_registration` 所演示的拦截场景），确认该注册请求在任何调用执行前就被服务端底层坚决拒绝。

## Shipped Artifact

`outputs/tool-schema-reference.md` 是本课交付的单页工具模式参考手册：全面收录了工具定义的每个字段规范、JSON Schema 方言及 `$ref` 解析安全红线、`outputSchema` 与 `structuredContent` 的契约规范、工具命名语法表，以及通过详实对比展示两大错误通道具体 Payload 的对照清单。在面对陌生服务端的 `tools/list` 输出时建议常备此表，以便快速判定即将发起的调用是否能够顺利合规通行。

## Verify It

在课程目录下执行单元测试：

```bash
python3 -m unittest discover code/tests
```

测试将对本课的核心技术规则进行逐一严密核验：合规的参数能够产出自身亦能通过 `outputSchema` 校验的 `structuredContent`；缺失必填字段、类型错误、枚举值违规以及违规多余属性均统一作为 `isError: true` 返回而非返回 JSON-RPC 协议错误；无参工具严格接受空对象但坚决拒绝携带多余属性的对象；未知的工具名称准确返回协议级错误而非 `isError`；指向外部网络的 `$ref` 在工具注册阶段即被坚决阻断；以及工具命名规则能够准确判定合法与非法名称。通信校验器同样审查测试通信记录是否符合 2026-07-28 规则：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/08-tool-schemas-and-structured-content
```

## Capstone Connection

在 Capstone 项目答辩中，评审员会要求你为所搭建生态中的每一个工具设计进行严格论证。“Schema 能够捕获异常”这一论断只有在 Schema 定义足够精确、且服务端将其作为工具执行错误而非可能被客户端屏蔽的协议错误返回给大模型时，才具有真正的工程意义。当在 Capstone 中设计接收复杂用户输入的工具或引用共享模式片段时，请务必贯彻本课传授的命名规则与 `$ref` 外部引用防御准则；在规划 Handler 的异常捕获与汇报机制时，始终遵循本课明确的两大错误通道分离模型。

## Key Terms

| 术语 | 定义 |
|------|------|
| inputSchema | 工具定义中的必需 JSON Schema 对象，调用参数对象在执行前必须完全满足其约束 |
| outputSchema | 工具定义中的可选 JSON Schema 对象，成功返回的 structuredContent 必须契合其约束 |
| structuredContent | 工具执行返回的任意合法 JSON 数据值，定义了 outputSchema 时须受其校验 |
| additionalProperties | Schema 核心关键字，显式设为 false 时坚决拒绝携带未声明多余属性的输入对象 |
| $ref | 模式引用关键字，指向外部网络 URI 目标的引用绝对严禁自动发起网络反向解析 |
| 工具执行错误 (Tool execution error) | 包含 isError: true 的常规成功信封，用于汇报模型可读懂并自纠的业务与校验异常 |
| 协议级错误 (Protocol error) | 形如 -32602 的底层 JSON-RPC 错误，汇报大模型无法通过微调参数自纠的根本性违规 |
| 工具命名规范 (Tool naming rules) | 长度 1 至 128 字符、大小写敏感、仅含字母数字下划线连字符和点、单服务端内唯一 |

## Further Reading

- [MCP 规范 2026-07-28：工具原语 (Tools)](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)，涵盖本课讲授的规范字段、模式规则与错误处理准则
- [MCP 规范 2026-07-28：JSON Schema 使用规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/index#json-schema-usage)，涵盖方言选择与 $ref 解析限制
- [SEP-2106：工具 inputSchema 与 outputSchema 全面遵循 JSON Schema 2020-12](https://modelcontextprotocol.io/seps/2106-json-schema-2020-12)
- [SEP-1303：输入参数校验错误统一作为工具执行错误规范化](https://modelcontextprotocol.io/seps/1303-input-validation-errors-as-tool-execution-errors)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md` 第 5 节与第 10 节
- 本仓库中的 `phases/13-tools-and-protocols/05-tool-schema-design`，面向大模型调用的参数模式设计最佳实践
- 本仓库中的 `phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content`，JSON Schema 运行时边界与内容块深度剖析
