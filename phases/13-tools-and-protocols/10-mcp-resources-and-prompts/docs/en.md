# MCP Resource 与 Prompt：无状态 Server 的可寻址上下文

> Tool 用于执行操作。Resource 用于暴露可寻址内容。Prompt 用于封装用户选择的消息模板。一个优秀的 MCP server 会保持这些契约清晰分离且具有可预测性。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lesson 07 (Building an MCP Server), Phase 13, Lesson 09 (MCP Transports)
**Time:** ~60 minutes

## 学习目标

- 根据使用者的意图在 tool、resource 和 prompt 之间做出正确选择。
- 通过强制要求的 `server/discover` 声明 resource 与 prompt capability 接口。
- 构建确定性的 `resources/list` 与 `prompts/list` 返回结果。
- 合理应用 `ttlMs` 与 `cacheScope`，避免泄露特定用户的数据。
- 遇到无效或未知的 resource URI 时返回 JSON-RPC 错误 `-32602`。
- 开启 `subscriptions/listen` POST 响应流，并通过 subscription ID 关联每个事件。
- 将 resource 内容和 prompt 模板一律视为不可信的 server 输出。

## 从使用者的意图出发

滥用 MCP 最容易的方式就是直接从实现代码着手。数据库查询因为像函数就被做成了 tool；可复用工作流因为存放在文件里就被做成了 resource；prompt 因为 host 可以注入就变成了隐藏策略。

请首先从“谁来选择”以及“他们期望什么”出发。

| Primitive | 主要意图 | 选择主体 | 典型结果 |
|---|---|---|---|
| Tool | 执行某项操作 | Model 或应用程序 | 结构化动作结果 |
| Resource | 读取特定 URI 的内容 | Host、应用程序或用户 | 文本或二进制内容 |
| Prompt | 启动可复用的消息工作流 | 用户（通过 Host UI） | 一条或多条 prompt 消息 |

位于 `notes://note-1` 的笔记是一个 resource，因为它是可寻址的内容。`delete_note` 是一个 tool，因为它会变更状态。`review_note` 是一个 prompt，因为是由用户主动选择预设的审核工作流。

切勿仅仅为了“看起来功能完备”而把同一操作同时暴露为这三者。每增加一种 surface，都需要额外的 discovery、authorization、缓存、错误处理、测试以及文档维护成本。

## 2026-07-28 无状态信封

本课针对 MCP 协议版本 `2026-07-28`。在此规范配置下，不存在 initialization handshake（初始化握手）或 protocol session（协议会话）。每个请求都在保留的 `_meta` 键中携带其协议版本和客户端 capabilities。

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

Server 必须实现 `server/discover`。其返回结果向外声明支持的版本、resource 与 prompt capabilities、实现标识以及缓存提示（cache hints）。Client 可以直接调用其它方法，但 discovery 让 client 能够在构建 UI 前获得一份稳定的快照。

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "resources": {"listChanged": true, "subscribe": true},
    "prompts": {"listChanged": true}
  },
  "ttlMs": 3600000,
  "cacheScope": "public"
}
```

常规结果会声明 `"resultType": "complete"`。响应的 `_meta` 会通过 `io.modelcontextprotocol/serverInfo` 标识服务端的实现信息。该信息用于诊断排错，并不是身份鉴权凭证。携带不受支持协议版本的请求会返回 `-32022` 错误，同时带上所请求的版本以及 server 支持的版本列表。

无状态契约会重塑你的设计直觉。列表查询不能依赖单条连接上先前的调用历史。鉴权凭证作为请求输入可以改变返回的可见集合，但连接历史绝不能影响结果。

## Resource 是稳定的 URI 契约

Resource 是由 URI 标识的内容。在编写 handler 之前，先设计好 URI。

良好的 URI 应具备的属性：

- 足够稳定，可以被加入书签或在多次请求之间传递。
- 划分在 server 的专有命名空间（namespace）下。
- 独立于具体的进程 ID 或连接。
- 在访问存储之前先经过验证。
- 每次读取时都进行授权鉴权。

`notes://note-1` 优于 `note-1`，因为它的命名空间是明确的。文件 server 可以使用 `file://` URI，但在解析符号链接（symlinks）和相对路径后，必须严格检查配置好的目录边界。

`resources/list` 返回调用方当前可见的 resources。务必按照稳定键（例如 URI）排序。确定性的顺序可以防止缓存震荡击穿（cache misses）、快照漂移以及 host UI 在刷新时发生跳动。

```json
{
  "resultType": "complete",
  "resources": [
    {
      "uri": "notes://note-1",
      "name": "Architecture decision",
      "description": "Why the service uses a stateless boundary",
      "mimeType": "text/markdown"
    }
  ],
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

`resources/read` 返回一个或多个内容项。未知的 URI 不代表读取成功但内容为空。当前的 Resources 规范将无效或未知的 resource URI 归类为 JSON-RPC 无效参数，错误码为 `-32602`。

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32602,
    "message": "Unknown or invalid resource URI",
    "data": {
      "uri": "notes://missing"
    }
  }
}
```

这种区分让 client 能够清晰辨别“资源不存在”与“有效的空文档”，同时也防止了意外回退到更大范围的宽泛查找。

### Resource 模板

Resource 模板用于描述一族带参数的 URI。当枚举所有具体项成本过高或数量无界时，应使用模板。例如 `notes://projects/{project}/decisions/{decision}` 告诉 client 如何构造有效地址，而无需一次性列出所有决策条目。

模板并不意味着放松校验。解析变量、执行鉴权、强制长度与字符限制，并使用强类型参数构建存储查询。绝对不要直接将任意 URI 后缀拼接到文件系统路径或数据库语句中。

### 内容并非可信指令

Resource 文本可能包含 prompt 注入、密钥、误导性命令或恶意格式的标记。Host 应保留来源追踪（provenance），并将 resource 内容一律视为数据。Server 应限制内容大小、返回准确的 MIME 类型、脱敏调用方无权访问的字段，并避免返回无关记录。

## Prompt 是用户控制的模板

MCP prompt 专为用户显式选择而设计。Host 可以将它们渲染为斜杠命令（slash commands）、菜单项或工作流按钮。协议本身并不限定某一种具体的 UI 表现形式。

对于相同的请求鉴权上下文，`prompts/list` 的输出应是确定性的。每个 prompt 都需要一个稳定的名称、有用的描述，以及能让 host 在调用 `prompts/get` 之前收集输入的参数声明。

```json
{
  "resultType": "complete",
  "prompts": [
    {
      "name": "review_note",
      "title": "Review a note",
      "description": "Review one note for a named concern",
      "arguments": [
        {
          "name": "uri",
          "description": "The note resource URI",
          "required": true
        }
      ]
    }
  ],
  "ttlMs": 600000,
  "cacheScope": "public"
}
```

`prompts/get` 会将参数解析为一组消息。它不会替换 host 的系统指令。Host 拥有决定返回的消息如何进入模型上下文的最终裁量权，并始终保持自身受信任策略具有更高优先级。

在 server 边界处严格校验 prompt 参数。Prompt 中引用的 URI 必须通过与直接读取 resource 相同的鉴权检查。切勿让 prompt 成为绕过 resource 访问控制的侧信道。

## 缓存提示是正确性的一部分

`ttlMs` 告知 client 结果可以复用多久。`cacheScope` 描述了谁可以共享该缓存值。

| 范围 | 含义 | 典型用途 |
|---|---|---|
| `public` | 在鉴权许可的前提下可在多用户间复用 | 公共 prompt 目录 |
| `private` | 绑定到请求发起用户或凭证上下文 | 用户名下的私有笔记内容 |

根据数据的变更频率以及过期陈旧可能造成的损害来选择 TTL。公共 prompt 目录可能适合设为 5 分钟，而私有笔记读取可能设为 1 分钟。

MCP 规范中 `cacheScope` 的有效值仅定义了 `public` 和 `private`。对于包含敏感秘密或变更极其频繁的结果，应返回 `cacheScope: "private"` 配合 `ttlMs: 0`，随后在 host 端的缓存策略中应用更严格的 no-store 规则。`no-store` 本身并不是 MCP 规范中的 `cacheScope` 取值。

缓存提示永远不能代替鉴权。缓存键必须包含所有会影响可见性的请求维度，包括租户（tenant）、用户、权限范围（scope）、语言区域（locale）以及分页游标（pagination cursor）。如果共享缓存无法安全地表达这些维度，请使用 `private` 配合 0 TTL，并在 host 层实施 no-store 策略。

## 订阅使用客户端发起的响应流

现代的订阅模式取代了原先的 `resources/subscribe` RPC 以及旧版基于 HTTP GET 的事件端点。

Client 以常规 JSON-RPC 请求的形式发送 `subscriptions/listen`。在 Streamable HTTP 传输层上，这是一个 POST 请求，其 HTTP 响应保持打开状态作为 SSE（Server-Sent Events）流。`notifications` 对象是一个白名单。Server 绝不能投递未经请求的通知类型。

```json
{
  "jsonrpc": "2.0",
  "id": 17,
  "method": "subscriptions/listen",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    },
    "notifications": {
      "resourcesListChanged": true,
      "promptsListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

请求 ID 即为订阅 ID（Subscription ID）。在发送任何所请求的事件之前，server 会发送 `notifications/subscriptions/acknowledged` 通知。其中的过滤条件仅包含 server 实际接受的子集。

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "notifications": {
      "resourcesListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

后续该流上的每个事件都携带相同的元数据：

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "uri": "notes://note-1"
  }
}
```

通知表明 resource 已发生变更。Client 在当前的鉴权约束下通过 `resources/read` 重新读取该资源。Client 不应假设通知事件本身就包含最新文档内容。

多个订阅可以共享同一条 stdio 通道。Subscription ID 让 client 能够对其进行多路解复用（demultiplex）。在 HTTP 上，关闭响应流即可取消订阅。平稳关闭流的 server 会返回一个与最初请求关联的最终 `resultType: "complete"` 响应。

切勿将订阅流当作协议会话（protocol session）使用。后续的读取操作仍然是完整的独立请求，能够路由至任何健康的 server 实例。

```figure
t3-primitive-sort
```

## 交互式实验

利用图示对项目跟踪系统中的五种能力进行分类：问题详情（issue details）、创建问题（create issue）、迭代评审模板（sprint review template）、项目规范策略（project policy）以及关闭问题（close issue）。然后判断哪些列表可以公开缓存，哪些读取必须保持私有，以及哪些 resource 值得配置更新通知。

在做每一次分类时，明确其选择主体。如果由模型执行动作，使用 tool；如果 host 读取按 URI 寻址的内容，使用 resource；如果由用户启动预设的消息工作流，使用 prompt。

## 动手实验

在仓库根目录下运行模拟器：

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

按以下顺序检查交互记录（transcript）：

1. 确认 `server/discover` 声明了当前协议版本以及两项 capabilities。
2. 确认两次列表查询的结果均已排序且包含 `resultType: "complete"`。
3. 确认列表和读取结果均携带了合乎预期的缓存提示。
4. 将读取的 URI 改为 `notes://missing` 并观察返回的 `-32602` 错误。
5. 确认订阅确认通知先于 resource 更新事件发出。
6. 确认事件与平稳关闭均携带订阅 ID `5`。

该 Python 模型并不打开真实的 HTTP 连接。它模拟展示了 SDK 必须放置在请求作用域响应流中的消息结构。生产环境中请使用官方 SDK 处理分帧和传输层细节。

## 交付产物

`outputs/skill-primitive-splitter.md` 是一个用于 MCP primitive 选择的可复用设计审查指南。它现在能够检查确定性 discovery、缓存范围、无效 URI 处理行为以及现代订阅过滤器。

本课还附带 `assets/primitive-split.svg`，提供了 primitive 与订阅边界的静态图解供离线学习。

## 验证它

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果：主程序输出 JSON 交互记录，测试命令报告至少 12 个通过的测试用例。

## Capstone 连接

当你的 capstone server 除了 action 之外还暴露可寻址知识时，请应用此契约。应包含一个确定性的目录快照、一次经过授权的 resource 读取、一次 prompt 解析、一个无效 URI 处理用例以及一段订阅交互记录。

你的测试凭证应能证明：任何列表都不依赖连接历史，且订阅事件绝不会向未授权方泄漏底层 resource 的访问权限。

## 课后练习

1. 添加一个 `notes://projects/{project}/notes/{id}` resource 模板，并对两个变量进行校验。
2. 为 `resources/list` 添加分页支持，同时保持排序的确定性。
3. 将某个 resource 设为 `cacheScope: "private"` 且 `ttlMs: 0`，增加 host 级 no-store 策略，并解释支撑这两项控制措施的威胁模型。
4. 添加 prompt 列表变更订阅，并证明当过滤条件省略 `promptsListChanged` 时不会发送任何事件。
5. 创建两个并发订阅，并证明每个事件都携带了正确的请求 ID。
6. 为 read handler 添加鉴权主体（subject），并证明缓存条目无法跨主体越权复用。

## 关键术语

- **Resource：** MCP server 暴露的、通过 URI 寻址的内容。
- **Prompt：** MCP server 暴露的、由用户控制的消息模板。
- **确定性列表（Deterministic list）：** 针对相同的请求输入，其成员与顺序保持稳定的 discovery 结果。
- **`ttlMs`：** 缓存新鲜度持续时间（毫秒）。
- **`cacheScope`：** 缓存结果的共享边界（`public` 或 `private`）。
- **`subscriptions/listen`：** 一种长生命周期请求，其响应流按显式过滤条件投递通知。
- **Subscription ID（订阅 ID）：** 原始 listen 请求的 ID，在通知元数据中重复回传。
- **无效参数（Invalid parameters）：** JSON-RPC 错误 `-32602`，用于无效或未知的 resource URI。
- **不支持的协议版本（Unsupported protocol version）：** JSON-RPC 错误 `-32022`，包含 `supported` 与 `requested` 版本列表。
- **`server/discover`：** 强制要求的 server 方法，返回支持的版本、capabilities、服务身份标识及可选的缓存提示。

## 延伸阅读

- [MCP 2026-07-28 Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP 2026-07-28 Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP 2026-07-28 Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)
