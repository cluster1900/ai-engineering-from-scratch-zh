# MCP Tool 契约与内容

> 只有当发现、参数、结果、分页和传输元数据遵循同一份契约时，Tool 才能被安全地自动化。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13，第 07、09 和 10 课
**Time:** ~120 分钟

## 学习目标

- 使用 JSON Schema 2020-12 定义 Tool 输入和输出。
- 验证结构化结果，而不假定它们是 JSON 对象。
- 在文本、图像、音频、资源链接和Embedding式资源之间作出选择。
- 在 Tool 到达 Model 前拒绝不安全的 `x-mcp-header` 定义。
- 编码参数 header 值，并验证 header 与 body 是否完全一致。
- 遍历 cursor 分页，而不解释 cursor 值。
- 限制 `completion/complete` 建议并对其进行授权。

## 问题

调用 Python 函数很容易。通过 AI host 调用远程能力则是一个契约问题。

Server 发布 descriptor。Client 将该 descriptor 转换为 Model Context 和用户界面。Model 创建参数。Gateway 可能根据镜像 header 路由请求。Server 执行 Tool。随后，Client 决定结果是否足够安全且有效，可以返回给 Model。

任何一处薄弱边界都会破坏整条链路。

考虑以下五种故障：

- descriptor 声明结果是对象，但 Server 返回数组。
- 当 `nextCursor` 是空字符串时，Client 停止分页。
- Token 参数被镜像到 HTTP header 中，并因此暴露给中间节点。
- Unicode 路由值以原始 header 形式发送，随后 Gateway 和源站对相同字节作出不同解释。
- completion endpoint 向无权访问生产环境的调用方建议了生产环境。

这些故障无法通过更好的 Prompt 修复。它们需要明确的协议契约和应用契约。

## 契约 Pipeline

将每次 Tool 调用视为五道 gate：

1. **发现。** 读取确定性的分页 Tool 列表。
2. **准入。** 验证每个 descriptor，并应用本地安全策略。
3. **调用。** 验证参数并构建传输元数据。
4. **执行。** 运行 handler，并正确分类故障。
5. **消费。** 在供 Model 使用前验证内容块和结构化输出。

```figure
mcp-contract-pipeline
```

Host 负责准入 gate 和消费 gate。Server 无法强迫 Client 信任其 annotation、schema 或输出。

## JSON Schema 是 Runtime 边界

在 MCP `2026-07-28` 中，`inputSchema` 和 `outputSchema` 使用 JSON Schema。当 `$schema` 缺失时，默认 dialect 为 2020-12。

输入 schema 必须是 schema 对象。即使 Tool 没有参数，也仍应准确声明它接受什么：

```json
{
  "type": "object",
  "additionalProperties": false
}
```

这比 `{ "type": "object" }` 更严格，后者接受任意属性。

输出 schema 是可选的。一旦 Server 发布了输出 schema，每个完整的 Tool
结果都承诺返回符合要求的 `structuredContent`，包括
`isError: true` 的结果。错误标志用于对执行结果进行分类；它不会
免除已发布的输出契约。Client 应验证结果，而不是信任 descriptor。

### 结构化内容可以是任意 JSON 值

不要将 `structuredContent` 硬编码为 dictionary。它可以是：

- 对象；
- 数组；
- 字符串；
- 数字；
- boolean；
- `null`。

这个 Tool 返回数组：

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

它的成功结果是有效的：

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

为了兼容性，结构化结果还应在文本块中包含序列化的 JSON。文本不是验证来源，`structuredContent` 才是。

### 小型 validator 仍能阐明边界

本课特意使用 JSON Schema 的一个子集，因为这样可以保持在 Python 标准库范围内。它检查示例 Tool 使用的机制：

- object、array、string、integer、number、boolean 和 null 类型；
- 必需属性；
- `additionalProperties: false`；
- 数组 items；
- enum 值；
- 最小字符串长度。

这不能替代完整的生产级 validator。可复用的教学重点在于验证发生的位置：发现后验证 descriptor，执行前验证参数，消费前验证结构化结果。

## 不同内容块具有不同成本

`content` 数组可以组合多种内容类型。

| 类型 | 用途 | 主要边界 |
|------|------------|---------------|
| `text` | 供人类和 Model 阅读的摘要 | 将文本视为不可信输出 |
| `image` | 编码为 base64 的视觉证据 | 验证媒体类型和大小 |
| `audio` | 编码为 base64 的语音或录音输出 | 验证媒体类型和时长限制 |
| `resource_link` | Client 稍后可获取的 URI | 再次授权后续的资源读取 |
| `resource` | 直接Embedding结果中的数据 | 立即执行 payload 和内容限制 |

资源链接并不能证明该资源会出现在 `resources/list` 中。它只是本次 Tool 调用返回的引用。Client 在跟随该 URI 时仍需应用其资源策略。

Embedding式资源避免了额外的往返，但会增大当前响应。对于大型或独立变化的产物，应使用链接。对于必须与结果以原子方式一同传输的小型证据，应使用Embedding式资源。

本课的 `evidence_bundle` 结果包含全部五种类型。Client 会先验证每个内容块，再接受结果。

## `x-mcp-header` 是路由元数据

`inputSchema` 中的属性可以声明 `x-mcp-header`。在 Streamable HTTP 上，Client 会将该参数镜像到 `Mcp-Param-{name}`。

```json
{
  "region": {
    "type": "string",
    "x-mcp-header": "Region"
  }
}
```

当 `region: "eu-west"` 时，传输层可以发出：

```http
Mcp-Param-Region: eu-west
```

该 annotation 的存在，是为了让负载均衡器、Gateway 或策略引擎无需解析 JSON body 即可进行路由。它不是存放凭证的位置。

协议对该 annotation 作出以下约束：

- header 名称非空，并遵循 HTTP field-name Token 语法；
- header 名称不区分大小写时必须唯一；
- 属性类型为 string、integer 或 boolean；
- 不允许使用 `number`；
- annotation 只能出现在 `inputSchema.properties` 的直接成员上；
- integer 值必须处于 `-9007199254740991` 到 `9007199254740991` 之间。

位置规则是语法性的，并采用 fail-closed 策略。遍历整个 schema 树，
而不只是 validator 恰好理解的属性。拒绝位于嵌套对象 `properties`、
`oneOf` 分支、`items`、通过 `$ref` 到达的定义或任意输出 schema 下的
annotation。解析引用不会使被引用节点变成直接的顶层属性。

本课还添加了一项部署策略：拒绝镜像 `password`、`secret`、`token`、`api_key` 或 `authorization` 等名称的 descriptor。官方规范建议 Server 作者不要镜像敏感参数。Client 可以将该建议转化为强制准入规则。

审计 header 名称，而不是它的值。示例代码会记录 `Mcp-Param-Region`，同时避免将 `eu-west` 写入审计事件。

### 构建 HTTP header 前先编码值

只有当参数值是由 `!` 到 `~` 范围内的可见 ASCII 字符组成的非空字符串，
并且看起来不像编码 sentinel 时，才能以纯文本形式传输。其他所有值都使用以下精确格式：

```text
=?base64?{Base64UTF8}?=
```

`Base64UTF8` 是对精确 UTF-8 字节执行标准 base64 编码的结果。不要先对值进行
trim、normalize 或替换。应编码 Unicode、空字符串、空格、tab、控制字符、
CR 或 LF、开头或结尾的空白，以及任何以 `=?base64?` 开头的值。
再次编码看起来像 sentinel 的值，可以让接收方恢复原始字面文本，而不会
将其解码为传输语法。

Boolean 渲染为小写 `true` 或 `false`。Integer 以十进制渲染，并且
必须处于 JavaScript safe integer 范围内。超出该范围的值将被拒绝，
而不是被中间节点舍入。

### Server 检查镜像副本

Header 生成只是 Client 侧的一半工作。在 Streamable HTTP 边界，
Server 必须：

1. 查找已识别的 `Mcp-Param-*` 名称，且不区分 header 名称大小写；
2. 如果存在精确的 base64 sentinel 格式，则对其进行解码；
3. 将解码后的文本与 JSON body 中对应的参数进行精确比较；
4. 在 dispatch 前拒绝缺失、重复、意外、格式错误或不匹配的
   已识别 header。

拒绝响应使用 HTTP `400` 和 JSON-RPC 错误码 `-32020`。Body 中的值及其
编码后的 header 形式都不应写入审计记录。只记录已识别的 header 名称和
拒绝类别。

`code/main.py` 直接模拟了该边界。[第 09 课](../../09-mcp-transports/)
介绍更完整的 Streamable HTTP 验证顺序，包括 method 和
protocol-version 一致性。

## 分页 Cursor 是不透明的

MCP 列表操作使用 cursor 分页。Server 选择页面大小和 cursor 格式。Client 只需作出一个判断：

```python
if result.get("nextCursor") is None:
    break
cursor = result["nextCursor"]
```

不要这样写：

```python
if not result.get("nextCursor"):
    break
```

空字符串是有效的 cursor。使用 truthiness 会过早停止。

Client 不得解码 cursor、递增 cursor、将其与之前的 cursor 比较顺序，也不得推断页码。Server 可能会对 cursor 签名、将其绑定到某个 catalog 版本，或将其映射到私有状态。这些都是 Server 的实现细节。

示例 Server 特意在第一页之后返回 `""`。Client 必须在第二次请求中发送该精确值。其 trace 为：

```text
<第一次请求，不带 cursor>
<第二次请求，cursor 为 "">
```

无效 cursor 会产生 JSON-RPC invalid params，错误码为 `-32602`。

## Completion 是授权层面

`completion/complete` 为 Prompt 参数和资源模板参数提供建议。它对交互式表单很有用，但也可能泄露常规列表方法所保护的名称。

Completion 请求会指定一个引用以及正在补全的参数：

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

结果最多返回 100 个值，并可以报告 `total` 和 `hasMore`。

应用与被引用 Prompt 或资源相同的授权边界。示例中的 analyst 会收到 `development` 和 `staging`。只有 operator 才能收到 `production`。

生产环境中的 completion 还需要：

- 输入验证；
- 根据调用方进行过滤；
- Client 中的请求 debounce；
- Server 中的 rate limiting；
- 有界的结果数量；
- 不暴露敏感建议值的日志。

Completion 是辅助功能，而不是绕过发现机制的手段。

## 两层错误

将协议错误与 Tool 执行错误分开。

当 MCP 请求无法被正确 dispatch 时，使用 JSON-RPC error：

- 未知 Tool 名称；
- 请求结构格式错误；
- 缺少请求元数据；
- 无效 cursor。

当调用已到达 Tool，而 Tool 报告可操作的失败时，返回带有 `isError: true` 的完整 Tool 结果：

- 报告来源不可用；
- 日期超出支持范围；
- 业务规则拒绝所请求的操作。

Model 通常能够修复 Tool 执行错误，但无法修复违反自身输出 schema 的 Server。

如果 Tool 声明了输出 schema，应在该 schema 中对可操作的失败建模。
示例中的 `route_report` 失败结果会返回所请求的 region，并包含
`accepted: false`、便于人类阅读的错误文本以及 `isError: true`。

## 动手构建

`code/main.py` 使用 Python 标准库构建边界的两侧。

Server 实现了：

- 每个请求的 MCP 元数据验证；
- 带有 Tools 和 completions capability 的 `server/discover`；
- 确定性的 `tools/list` 分页；
- 四个 Tool descriptor，其中一个必须被拒绝；
- 数组结构化输出；
- 当前所有 Tool 内容块类型；
- 一个 Streamable HTTP 一致性 gate，用于解码已识别的参数 header，并在不匹配时
  返回 HTTP `400` 和 JSON-RPC `-32020`；
- 经过授权并受到 rate limiting 的 completion。

Client 实现了：

- descriptor 准入；
- 完整 schema 树的 `x-mcp-header` 位置验证和敏感字段策略；
- 精确的纯可见 ASCII 或 base64 UTF-8 值编码；
- 跟随空字符串的不透明 cursor 循环；
- 参数和结果验证；
- 内容块验证；
- 只包含 header 名称而不包含值的审计事件。

这个特意设计为不安全的 descriptor 是教学数据。它证明拒绝一个 Tool 并不会妨碍其他有效 Tool 加载。

## 实际使用

从 repository 根目录运行：

```bash
cd phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/code
python3 main.py
python3 -m unittest discover tests -v
```

Demo 会输出获准的 Tool、被拒绝的 descriptor、两次分页请求、结构化数组内容、
内容块类型、镜像 header 名称、值是否需要编码、HTTP 一致性状态，以及
根据调用方过滤后的 completion 值。

## Interactive Lab

打开 `code/main.py` 并找到 `TOOLS`。

1. 将 `tag_catalog.outputSchema.type` 从 `array` 改为 `object`。
2. 运行 demo。Client 应拒绝返回的数组。
3. 恢复 schema。
4. 保持第一页的 `nextCursor` 为 `""`，然后让最后一页返回
   `nextCursor: None`，而不是省略该字段。
5. 运行测试并比较 cursor trace。
6. 向一个 string 属性添加 `x-mcp-header: "Authorization"`。
7. 确认 descriptor 准入在调用前将其拒绝。
8. 尝试包含 Unicode、换行符、两侧空格以及字面文本
   `=?base64?SGVsbG8=?=` 的 `region` 值。解码每个发出的 header，并证明
   原始值被精确保留。
9. 将 annotation 移到 `oneOf`、`items` 或 `$ref` 定义下。确认
   每个 descriptor 都会被拒绝，即使 demo 从未使用该分支。
10. 删除已识别的 header，或修改其解码后的值。确认 HTTP
    边界返回状态码 `400` 和 JSON-RPC 错误码 `-32020`。

重点不是记住一种 JSON 结构，而是观察每道 gate 如何在其负责的边界上失败。

## Practice Lab

使用 `search_evidence` Tool 扩展契约实验。

要求：

1. 它的输入 schema 接受 `query`、`limit` 和安全的 `region` 路由字段。
2. 它的输出 schema 是对象数组，每个对象包含 `uri`、`title` 和 `score`。
3. 结果包含兼容性文本以及每个条目对应的资源链接。
4. 参数拒绝未知属性。
5. `limit` 受到应用验证的限制。
6. 无权访问某个 URI 的调用方，绝不能通过 completion 或 Tool 输出看到该 URI。
7. 测试包含不符合约定的 score、无效 header annotation 和两页列表。
8. Header 值测试涵盖可见 ASCII、Unicode、控制字符、空白字符、
   看起来像 sentinel 的文本，以及 JavaScript safe integer 的两个边界值。
9. HTTP fixture 接受不区分大小写的 header 名称，但对于缺失或
   不匹配的已识别值，会返回状态码 `400` 和错误码 `-32020`。

## 交付产物

`outputs/skill-mcp-contract-reviewer.md` 是一个扁平且可复用的审查 Skill。向它提供 Tool descriptor、示例结果、分页行为和 completion 策略。它会返回准入决策、结果验证计划、header 策略和具体的失败测试。

## 验证

当以下陈述均为真时，本课即告完成：

- `tools/list` 在重复调用时返回相同的逻辑顺序。
- 当 `nextCursor` 为 `""` 时，Client 会发起第二次请求。
- 不安全的敏感 header descriptor 被排除，同时其他 Tool 仍然可用。
- 数组能够通过其数组输出 schema。
- 对象无法通过同一个数组 schema。
- 错误结果不能省略或违反已发布的输出 schema。
- 文本、图像、音频、资源链接和Embedding式资源块均能通过验证。
- Header 审计事件只包含名称，不包含值。
- 纯可见 ASCII 保持原样；Unicode、控制字符、带两侧空白的值、空值以及
  看起来像 sentinel 的值，都能通过精确的 base64 UTF-8 编码完成 round-trip。
- 超出 JavaScript safe range 的镜像 integer 会被拒绝。
- 位于 `oneOf`、`items`、嵌套对象、`$ref` 定义或
  输出 schema 下的 annotation 会在准入期间被拒绝。
- 不区分大小写的已识别 header 名称，只有在解码值与 body
  完全匹配时才能通过；缺失或不匹配的副本会产生 HTTP `400`
  和 JSON-RPC `-32020`。
- Analyst completion 永远不会返回 `production`。
- Tool 失败使用 `isError: true`；格式错误的协议调用使用 JSON-RPC `error`。

## 生产故障模式

| 故障 | 学习者看到的现象 | 正确响应 |
|---------|-----------------------|------------------|
| Client 假定输出为对象 | 有效数组失败或被静默包装 | 根据已发布的 schema 进行验证，不使用仅限对象的类型 |
| 空 cursor 被视为 false | 最后的页面消失 | 只要 `nextCursor` 存在且非 null，就继续分页 |
| 敏感值被镜像 | Secret 出现在 proxy、WAF 或 trace 数据中 | 拒绝 descriptor，并将 secret 保留在受保护的请求数据中 |
| 原始 Unicode 或空白被镜像 | Gateway 与源站产生分歧，或者值被 normalize | 使用精确的 base64 UTF-8 sentinel 编码，并在解码后比较 |
| Annotation 隐藏在 schema 分支中 | Client 在准入期间遗漏路由元数据 | 遍历整个 schema 树，并且只允许直接的顶层属性 |
| 大 integer 被镜像 | JavaScript 中间节点对路由值进行舍入 | 拒绝超出 JavaScript safe integer 范围的值 |
| Header 与 body 不一致 | Gateway 路由到一个目标，而源站执行另一个目标 | 在 dispatch 前拒绝，并返回 HTTP `400` 和 JSON-RPC `-32020` |
| 输出 schema 被忽略 | 下游代码消费损坏的结构 | 在供 Model 或应用使用前进行验证 |
| 资源链接被自动信任 | 调用方跟随未授权的 URI | 对每次资源读取重新授权 |
| Completion 共享全局建议 | 隐藏的 tenant 名称泄露 | 根据调用方、引用和授权进行过滤 |
| Tool annotation 被当作策略 | 破坏性操作绕过确认 | 在 annotation 之外实施授权和审批 |
| 一个格式错误的 Tool 破坏发现流程 | 整个 Server 变得不可用 | 拒绝有问题的 descriptor，并独立准入有效 Tool |

## Capstone Connection

Phase 13 capstone 需要一个能够合并多个 Server 上 Tool 的 Gateway。本课提供其准入核心。

使用该产物对以下四部分 capstone 证据评分：

- 确定且完整的分页发现；
- 在暴露给 Model 前进行 descriptor 验证；
- 经过验证的结构化输出以及有界的内容块；
- 能够保持授权边界的 completion 和路由元数据。

不要仅凭一次成功的 `tools/call` 就声称具备 Gateway 兼容性。捕获 descriptor、页面 trace、获准 Tool 集合、被拒绝 Tool 集合，以及一个经过验证的结果。

## 关键术语

| 术语 | 含义 |
|------|---------|
| `inputSchema` | 定义 Tool 可接受参数的 JSON Schema 对象 |
| `outputSchema` | 定义 `structuredContent` 的可选 JSON Schema |
| `structuredContent` | Tool 结果生成的任意 JSON 值 |
| 内容块 | 带有类型的文本、图像、音频、资源链接或Embedding式资源 |
| `x-mcp-header` | 将 primitive 参数镜像到 Streamable HTTP 元数据中的 schema annotation |
| 不透明 cursor | 由 Server 发出且 Client 不解释其值的分页 Token |
| Completion 引用 | 正在补全其参数的 Prompt 名称、资源 URI 或模板 |
| 准入 | Client 决定公开还是拒绝已发现 descriptor 的过程 |

## 延伸阅读

- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Completion](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/completion)
- [MCP Pagination](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/pagination)
- [MCP Streamable HTTP Parameter Headers](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#custom-headers-from-tool-parameters)
