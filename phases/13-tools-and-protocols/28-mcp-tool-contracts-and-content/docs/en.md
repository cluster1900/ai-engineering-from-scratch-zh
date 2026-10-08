# MCP Tool Contracts 与内容

> 只有当发现、参数、结果、分页以及传输元数据达成统一契约时，工具才能安全地实现自动化。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 07, 09, and 10
**Time:** ~120 minutes

## 学习目标

- 使用 JSON Schema 2020-12 定义工具的输入与输出。
- 校验结构化结果，而不假设其必为 JSON object。
- 在文本（text）、图像（image）、音频（audio）、资源链接（resource_link）与内嵌资源（resource）之间做出合理选择。
- 在工具暴露给模型之前，拒绝不安全的 `x-mcp-header` 定义。
- 对参数标头值进行准确编码，并验证请求头与请求体之间的严格一致性。
- 在不解析游标具体数值的前提下遍历游标分页。
- 对 `completion/complete` 补全建议进行范围界定与权限控制。

## 核心问题

调用普通的 Python 函数很简单。但通过 AI host 调用远程能力，则是一个典型的契约问题。

服务端发布描述符（descriptor）。客户端将该描述符转换为模型的上下文与用户界面。模型生成调用参数。网关可能根据镜像的 HTTP 标头进行请求路由。服务端执行该工具。最后，客户端决定返回的结果是否足够安全且有效，以供返回给模型。

整条调用链条中只要有一个边界存在漏洞，就会破坏全局。

考虑以下五种常见故障：

- 描述符声明返回结果是一个 object，但服务端实际返回了一个 array。
- 客户端在 `nextCursor` 为空字符串时便提前终止了分页。
- 敏感的 token 参数被镜像到了 HTTP 标头中，从而暴露给所有中间代理与日志系统。
- 包含 Unicode 的路由值被作为原始标头发送，导致网关与源站对字节序列的解析不一致。
- 自动补全端点向一个无权访问生产环境的调用者推荐了生产环境的名称。

这些故障没有一个能通过“更好的 Prompt”来解决。它们必须依赖明确的协议与应用层契约。

## 契约流水线

我们将每一次工具调用拆分为五个依次执行的关口（Gates）：

1. **发现（Discover）**：读取确定性、已分页的工具列表。
2. **准入（Admit）**：校验每个工具描述符并执行本地安全策略。
3. **调用（Invoke）**：校验调用参数并构建传输层元数据。
4. **执行（Execute）**：运行工具处理函数并对错误进行正确分类。
5. **消费（Consume）**：在交给模型使用之前，校验内容块与结构化输出。

```figure
mcp-contract-pipeline
```

Host 拥有准入关口与消费关口的主导权。服务端不能强迫客户端盲目信任其注解、Schema 或输出结果。

## JSON Schema 是运行时边界

在 MCP `2026-07-28` 规范中，`inputSchema` 与 `outputSchema` 均采用 JSON Schema。当省略 `$schema` 声明时，默认方言为 2020-12。

输入 Schema 必须是一个 schema object。即使一个工具不需要任何参数，也应当准确声明其接受的格式：

```json
{
  "type": "object",
  "additionalProperties": false
}
```

这比 `{ "type": "object" }` 严格得多，后者允许传入任意多余属性。

输出 Schema 是可选的。但服务端一旦发布了 `outputSchema`，每一次返回完整工具结果时都承诺返回符合该契约的 `structuredContent`，即使结果中包含 `isError: true` 也是如此。错误标记只是对执行结果的分类，它绝不能免除已发布的输出契约。客户端应当主动校验结果，而不是被动信任描述符。

### 结构化内容可以是任意 JSON 值

不要把 `structuredContent` 硬编码为字典（dict/object）。它可以是：

- 一个 object；
- 一个 array；
- 一个 string；
- 一个 number；
- 一个 boolean；
- `null`。

例如下面这个返回数组的工具：

```json
{
  "name": "tag_catalog",
  "inputSchema": {
    "type": "object",
    "additionalProperties": false
  },
  "outputSchema": {
    "type": "array",
    "items": {"type": "string"}
  }
}
```

其成功返回的结果是完全合法的：

```json
{
  "resultType": "complete",
  "content": [
    {
      "type": "text",
      "text": "[\"contracts\", \"mcp\", \"stateless\"]"
    }
  ],
  "structuredContent": ["contracts", "mcp", "stateless"],
  "isError": false
}
```

为了保持向后兼容性，返回结构化结果时通常也应在 text 内容块中附带序列化的 JSON 文本。但文本不是校验的数据源，`structuredContent` 才是。

### 简明校验器依然能阐明边界本质

本课程特意实现了一个 JSON Schema 校验子集，以便完全保持在 Python 标准库范围内。它检查示例工具所使用的核心机制：

- object、array、string、integer、number、boolean 和 null 类型；
- required 必填属性；
- `additionalProperties: false`；
- array items；
- enum 枚举值；
- 字符串最小长度 minLength。

这并不是用来替代生产级校验器的完整实现。这节课真正可复用的知识在于明确**校验发生的时机与位置**：在发现后对描述符进行校验、在执行前对调用参数进行校验，以及在消费前对结构化结果进行校验。

## 内容块承载不同的成本

`content` 数组可以组合多种内容块类型：

| 类型 | 适用场景 | 核心安全与控制边界 |
|------|------------|---------------|
| `text` | 人类与模型可读的摘要文本 | 将文本视为不可信输出 |
| `image` | 以 Base64 编码的视觉凭证 | 严格校验媒体类型（media type）与文件大小 |
| `audio` | 以 Base64 编码的语音或音频 | 严格校验媒体类型与时长上限 |
| `resource_link` | 客户端后续可按需拉取的 URI | 在后续读取资源时重新执行鉴权 |
| `resource` | 直接内嵌在当前结果中的数据 | 在当前调用立即强制执行载荷与内容上限 |

资源链接（`resource_link`）并不保证该资源必定出现在 `resources/list` 的列表中。它是本次工具调用所返回的一个引用。当客户端尝试访问该 URI 时，仍然需要执行其本地资源访问控制策略。

内嵌资源（`resource`）避免了额外的一次网络往返，但会增加当前响应报文的体积。对于大型或变动频繁的工件，建议使用资源链接；对于必须与本次工具结果原子绑定的少量凭证数据，则使用内嵌资源。

本课示例代码中的 `evidence_bundle` 结果同时涵盖了这五种类型。客户端在接受结果前会对每一个块进行合法性校验。

## `x-mcp-header` 是路由元数据

在 `inputSchema` 内部的某个属性可以声明 `x-mcp-header`。在 Streamable HTTP 传输协议下，客户端会将该参数镜像为 `Mcp-Param-{name}` 标头。

```json
{
  "region": {
    "type": "string",
    "x-mcp-header": "Region"
  }
}
```

当参数为 `region: "eu-west"` 时，传输层即可发出如下标头：

```http
Mcp-Param-Region: eu-west
```

引入该注解的目的是让负载均衡器、网关或策略引擎在无需解析完整 JSON 请求体的情况下完成路由。这里**绝对不能**用来传递鉴权凭证或敏感数据。

协议对该注解施加了严格约束：

- 标头名称必须非空，且符合 HTTP field-name token 语法规范；
- 标头名称在不区分大小写的前提下必须全局唯一；
- 参数属性类型只能是 string、integer 或 boolean；
- 不允许使用 `number`（浮点数）；
- 该注解只能直接出现在 `inputSchema.properties` 的第一层直接子节点中；
- 整数取值范围必须限制在 `-9007199254740991` 到 `9007199254740991`（JavaScript 安全整数范围）之内。

位置规则是语法级别的，并且必须是安全失败（fail-closed）机制。必须遍历整棵 Schema 树，而不能仅仅检查校验器碰巧识别的顶级属性。只要注解出现在嵌套对象的 `properties` 下、`oneOf` 分支中、`items` 内、通过 `$ref` 引用的定义中，或是任何输出 Schema 内，都必须坚决拒绝。解析引用并不会使被引用的节点变成直接的一级属性。

本课增加了一项部署安全策略：凡是镜像名称包含 `password`、`secret`、`token`、`api_key` 或 `authorization` 的描述符一律予以拒绝。官方规范明确建议服务端作者不要镜像敏感参数，而客户端则可将这一建议落实为严格的准入控制规则。

审计时只记录标头名称，不记录其具体数值。示例代码会记录审计事件 `Mcp-Param-Region`，而将具体取值 `eu-west` 排除在审计日志之外。

### 在构建 HTTP 标头前进行数值编码

参数值只有在满足以下条件时，才可以直接以纯文本形式在标头中传输：非空字符串，由 ASCII 可见字符（`!` 到 `~`）组成，且不包含编码哨兵前缀。其余所有取值必须严格采用如下编码格式：

```text
=?base64?{Base64UTF8}?=
```

其中 `Base64UTF8` 是对参数完全精确的 UTF-8 字节序列进行的标准 Base64 编码。绝对不要在此之前对字符串执行 trim（去除首尾空格）、规范化或替换操作。Unicode 字符、空字符串、空格、制表符、控制字符、CR 或 LF、带有前导或尾随空白的值，以及任何原本就以 `=?base64?` 开头的值，都必须进行编码。对形似哨兵前缀的值再次进行编码，正是接收端能够准确还原原始字面文本、而不会将其误解析为传输层语法的关键保证。

布尔值统一渲染为小写的 `true` 或 `false`。整数统一以 10 进制字符串渲染，且必须落在 JavaScript 安全整数范围内。超出该范围的数值必须直接拒绝，避免中间代理在解析时发生精度截断或舍入。

### 服务端校验镜像副本

生成标头只是客户端这一半的工作。在 Streamable HTTP 边界处，服务端必须：

1. 在不区分标头名称大小写的前提下，查找所有识别出的 `Mcp-Param-*`；
2. 若存在 Base64 哨兵格式，进行精确解码；
3. 将解码后的文本与对应的 JSON 请求体参数进行严格比对；
4. 若发现已识别标头存在缺失、重复、未预期出现、格式错误或与请求体不一致，在业务分发前直接拒绝。

该拒绝应当返回 HTTP `400` 以及 JSON-RPC 错误码 `-32020`。请求体的值与编码后的标头形式都不属于审计记录的内容，审计记录中仅记录识别出的标头名称与拒绝原因类别。

`code/main.py` 直接模拟了这一边界逻辑。[第 09 课](../../09-mcp-transports/)进一步讲解了包括 HTTP Method 和协议版本一致性在内的更广义 Streamable HTTP 校验顺序。

## 分页游标是不透明的

MCP 的列表操作采用游标分页（cursor pagination）。服务端决定每页的大小与游标格式。客户端只需遵循一个唯一的判断：

```python
if result.get("nextCursor") is None:
    break
cursor = result["nextCursor"]
```

**绝对不要**写成如下形式：

```python
if not result.get("nextCursor"):
    break
```

因为空字符串 `""` 也是合法的游标值！如果直接使用 Python 的真值判定（truthiness），会导致遍历过早中断。

客户端绝不能尝试对游标进行解码、自增运算、将新游标与旧游标比对以判断顺序，或者推断页码。服务端可能会对游标进行签名、将其绑定到特定目录版本，或者将其映射到底层私有状态，这些全部属于服务端内部实现细节。

示例服务端在第一页之后特意返回了 `""`。客户端在发送第二页请求时必须原样携带该值。其请求追踪过程如下：

```text
<first request with no cursor>
<second request with cursor "">
```

无效的游标输入应当产生 JSON-RPC invalid params 错误（错误码 `-32602`）。

## 自动补全是授权攻击面

`completion/complete` 方法为 Prompt 参数与资源模板参数提供自动补全建议。它在交互式表单中非常有用，但如果不加防护，可能会泄露普通列表接口所保护的敏感名称。

一个补全请求会声明被引用的对象以及当前正在补全的参数：

```json
{
  "method": "completion/complete",
  "params": {
    "ref": {
      "type": "ref/prompt",
      "name": "deployment_review"
    },
    "argument": {
      "name": "environment",
      "value": "st"
    }
  }
}
```

其返回结果最多包含 100 个建议值，并且可以附带 `total` 与 `hasMore` 字段。

必须在此应用与被引用的 Prompt 或资源完全一致的授权边界。在示例实现中，普通分析员（analyst）只能获得 `development` 与 `staging` 的补全提示；只有运维人员（operator）才能收到 `production` 的提示。

生产级补全服务还需要具备：

- 严格的输入校验；
- 区分调用者身份的过滤；
- 客户端防抖（debouncing）；
- 服务端限流（rate limiting）；
- 有界的结果数量限制；
- 在日志中避免暴露敏感的补全建议取值。

补全属于辅助输入手段，绝不能成为绕过发现权限检查的后门。

## 双层错误机制

必须将协议级错误与工具业务执行错误严格区分开来。

当 MCP 请求无法被正确分发时，使用 **JSON-RPC error**：

- 未知的工具名称；
- 格式错误的请求报文；
- 缺失必要的请求元数据；
- 无效的分页游标。

当调用成功抵达工具，并且工具上报的是一个可操作、可纠正的失败时，使用带有 `isError: true` 的 **完整工具结果（complete tool result）**：

- 某个报表数据源暂时不可用；
- 传入的日期超出了所支持的范围；
- 业务规则拒绝了所请求的操作。

大模型通常有能力理解并纠正工具执行错误，但大模型无法自行纠正违反了自身输出 Schema 的服务端。

如果工具声明了输出 Schema，应当在该 Schema 内部对可操作的失败进行建模。示例中的 `route_report` 失败时，会在返回的人类可读错误文本和 `isError: true` 之外，将其请求的 region 以 `accepted: false` 的结构化形式一同返回。

## 手写实现

`code/main.py` 使用 Python 标准库完整实现了边界两侧的核心逻辑。

服务端实现了：

- 针对每个请求的 MCP 元数据校验；
- 声明了 tools 和 completions 能力的 `server/discover`；
- 确定性的 `tools/list` 分页逻辑；
- 四个工具描述符（其中包括一个故意构造的、必须被拒绝的不安全描述符）；
- 数组类型的结构化输出；
- 当前所有的工具内容块类型支持；
- Streamable HTTP 一致性门禁：解码已识别的参数标头，并在内容不匹配时返回 HTTP `400` 和 JSON-RPC `-32020`；
- 带权限控制与限流的补全功能。

客户端实现了：

- 工具描述符准入机制；
- 全树遍历的 `x-mcp-header` 位置校验与敏感字段防护策略；
- 精确的纯 ASCII 可见字符直接传输或 Base64 UTF-8 编码；
- 正确追踪空字符串游标的不透明游标分页循环；
- 参数与返回结果校验；
- 内容块合法性校验；
- 仅包含标头名称而不包含敏感数值的标头审计事件记录。

故意包含的不安全描述符是极佳的教学样本。它证明了单个被拒绝的工具绝不会阻碍其他合规工具的正常加载与注册。

## 运行验证

从代码根目录出发：

```bash
cd phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/code
python3 main.py
python3 -m unittest discover tests -v
```

演示程序会依次打印已准入的工具、被拒绝的描述符、两次分页请求的往返详情、结构化数组内容、内容块类型、镜像标头名称、数值是否触发了编码、HTTP 一致性校验状态，以及根据调用者角色过滤后的补全建议列表。

## 交互式实验

打开 `code/main.py` 并找到 `TOOLS` 变量：

1. 将 `tag_catalog.outputSchema.type` 从 `array` 改为 `object`。
2. 运行演示程序。观察客户端如何坚决拒绝返回的数组结果。
3. 恢复原始 Schema。
4. 保持第一页的 `nextCursor` 为 `""`，然后让最后一页返回 `nextCursor: None` 而不是直接省略该字段。
5. 运行测试并对比游标的追踪链路。
6. 为一个 string 属性添加 `x-mcp-header: "Authorization"`。
7. 确认描述符准入检查在调用前将其成功拒绝。
8. 尝试使用包含 Unicode、换行符、首尾空格以及字面文本 `=?base64?SGVsbG8=?=` 的 `region` 取值。解码发出的每个标头，验证原始值被完全无损地还原。
9. 将注解移到 `oneOf`、`items` 或 `$ref` 定义的深层分支下。确认即使演示程序从不走入该分支，描述符准入依然会将其拒绝。
10. 删除已识别标头或篡改其解码后的取值。确认 HTTP 边界返回状态码 `400` 以及 JSON-RPC 错误码 `-32020`。

本实验的核心目标不是死记硬背 JSON 字段，而是在各自所属的边界处观察每个关口如何精准生效。

## 动手实践

为契约实验扩展一个 `search_evidence` 工具。

需求规范：

1. 其输入 Schema 接受 `query`、`limit` 以及安全的 `region` 路由字段。
2. 其输出 Schema 为由对象组成的数组，每个对象包含 `uri`、`title` 和 `score`。
3. 结果中每一项需包含兼容性文本以及一个对应的资源链接（resource_link）。
4. 参数校验时拒绝未知属性。
5. `limit` 受到应用层校验的上限约束。
6. 无权访问特定 URI 的调用者，无论通过自动补全还是工具输出，都绝不能看到该 URI。
7. 编写测试，覆盖不合规的 score 评分、非法的标头注解，以及两页分页列表场景。
8. 标头数值测试需覆盖可见 ASCII、Unicode、控制字符、空白字符、形似哨兵的文本，以及 JavaScript 安全整数边界。
9. HTTP 测试夹具需支持大小写不敏感的标头名称查找，但遇到缺失或不匹配的已识别标头时，坚决返回状态码 `400` 与错误码 `-32020`。

## 交付产物

`outputs/skill-mcp-contract-reviewer.md` 是一个可直接复用的独立审查 Skill。输入工具描述符、示例结果、分页行为和补全策略，它即可输出准入决策、结果校验方案、标头安全策略以及具体的负面测试用例。

## 验证标准

当以下各项全部达成时，本节课目标即告完成：

- `tools/list` 在多次重复调用时保持完全相同的逻辑顺序。
- 客户端在 `nextCursor` 为 `""` 时能正确发起第二次分页请求。
- 包含不安全敏感标头的描述符被剔除，同时其他合规工具正常准入。
- 数组结果能通过其数组输出 Schema 校验。
- 对象结果在该数组 Schema 下校验失败。
- 报错结果（Error results）不得省略或违反已发布的输出 Schema。
- text、image、audio、resource_link 和 resource 五种内容块均通过校验。
- 标头审计事件仅记录标头名称，不记录其具体数值。
- 纯 ASCII 可见字符保持直传；Unicode、控制字符、带空格填充、空字符串及形似哨兵的值均通过 Base64 UTF-8 精确往返编解码。
- 镜像的整数超出 JavaScript 安全整数范围时被拒绝。
- 位于 `oneOf`、`items`、嵌套对象、`$ref` 或输出 Schema 中的注解在准入阶段被拦截。
- 大小写不敏感的已识别标头名称仅在解码值与请求体完全一致时通过；缺失或不匹配的标头产生 HTTP `400` 和 JSON-RPC `-32020`。
- 分析员的自动补全绝不返回 `production`。
- 工具自身业务失败使用 `isError: true`；协议格式畸变使用 JSON-RPC `error`。

## 生产环境故障模式

| 故障现象 | 学习者看到的表象 | 正确处理方案 |
|---------|-----------------------|------------------|
| 客户端假定输出必定是 object | 合法的数组校验失败或被静默包装 | 依据发布的 Schema 进行校验，不假定结果必须为 object |
| 空字符串游标被当成 False 处理 | 最后一页数据意外丢失 | 只要 `nextCursor` 存在且非 null，就继续拉取下一页 |
| 镜像了敏感参数值 | 凭证密钥暴露在代理、WAF 或链路追踪日志中 | 拒绝该描述符，将机密保留在受保护的请求体内部 |
| 原始 Unicode 或空白字符直接镜像 | 网关与源站解析不一致，或值被意外规范化 | 使用 Base64 UTF-8 哨兵编码并在解码后进行比对 |
| 注解隐藏在 Schema 的复杂分支中 | 客户端在准入时漏检了路由元数据 | 遍历整棵 Schema 树，仅允许直接位于一级的属性携带注解 |
| 镜像了大整数 | 中间 JavaScript 代理对路由数值进行了舍入 | 拒绝超出 JavaScript 安全整数范围的数值 |
| 标头与请求体不一致 | 网关路由给服务 A，而源站实际执行服务 B | 在业务分发前以 HTTP `400` 和 JSON-RPC `-32020` 拒绝 |
| 忽略了输出 Schema | 下游程序消费了损坏的脏数据结构 | 在交给模型或应用程序前进行严格校验 |
| 盲目信任返回的资源链接 | 调用方直接读取了未获授权的 URI | 对每一次资源读取重新执行鉴权 |
| 自动补全共享了全局建议列表 | 多租户敏感隔离名称被泄露 | 按调用者身份、引用上下文与权限范围进行过滤 |
| 将工具注解当作安全策略 | 破坏性危险操作跳过了二次确认 | 在注解之外建立独立的授权与审批流 |
| 单个格式错误的工具搞垮整个发现流程 | 整台 MCP 服务端完全不可用 | 拒绝有问题的描述符，独立准入其余合规工具 |

## Capstone 串联

Phase 13 的 Capstone 项目需要一个能够聚合来自多个服务端的网关。本节课正是该网关的准入核心。

使用本课的交付工件来评估 Capstone 的四项核心凭证：

- 确定性且完整的游标分页发现过程；
- 在暴露给模型前的工具描述符校验；
- 校验通过的结构化输出与严格有界的内容块；
- 严密守护授权边界的补全与路由元数据。

不要仅仅因为一次 `tools/call` 调用成功就宣称兼容网关规范。请务必捕获描述符、分页链路追踪、已准入工具集、被拒绝工具集，以及至少一个完整的校验通过结果。

## 关键术语

| 术语 | 含义 |
|------|---------|
| `inputSchema` | 定义工具所接受参数的 JSON Schema 对象 |
| `outputSchema` | 定义 `structuredContent` 格式的可选 JSON Schema |
| `structuredContent` | 工具执行结果所生成的任意 JSON 结构化数值 |
| 内容块（Content block） | 具备类型化标记的 text、image、audio、resource_link 或 embedded resource |
| `x-mcp-header` | 将基础类型参数镜像为 Streamable HTTP 标头元数据的 Schema 注解 |
| 不透明游标（Opaque cursor） | 服务端发出的分页标记，客户端不得解释其内部含义 |
| 补全引用（Completion reference） | 正在请求参数补全的 Prompt 名称或资源 URI/模板 |
| 准入（Admission） | 客户端根据本地策略决定公开暴露还是拒绝已发现描述符的决策过程 |

## 延伸阅读

- [MCP Tools 规范](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Completion 自动补全规范](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/completion)
- [MCP Pagination 游标分页规范](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/pagination)
- [MCP Streamable HTTP 参数标头规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#custom-headers-from-tool-parameters)
