# MCP Resource 与 Prompt：无状态服务器的可寻址 Context

> Tool 执行操作。Resource 暴露可寻址内容。Prompt 封装由用户选择的消息模板。优秀的 MCP 服务器会让这些契约保持分离且行为可预测。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lesson 07（构建 MCP 服务器）, Phase 13, Lesson 09（MCP Transport）
**Time:** ~60 分钟

## 学习目标

- 根据消费者的意图，在 Tool、Resource 和 Prompt 之间进行选择。
- 通过必需的 `server/discover` 公布 Resource 和 Prompt 接口。
- 构建确定性的 `resources/list` 和 `prompts/list` result。
- 应用 `ttlMs` 和 `cacheScope`，同时避免泄露用户特定数据。
- 对无效或未知的 Resource URI 返回 JSON-RPC error `-32602`。
- 打开 `subscriptions/listen` POST response stream，并通过 subscription ID 关联每个 event。
- 将 Resource 内容和 Prompt 模板视为不可信的服务器输出。

## 从消费者出发

误用 MCP 最容易出现的方式，就是从实现代码开始思考。数据库查询因为 function 更熟悉而变成 Tool。可复用 workflow 因为存储在文件中而变成 Resource。Prompt 因为 host 可以注入它而变成隐藏 policy。

应当先确定由谁选择，以及他们期望获得什么。

| Primitive | 主要意图 | 选择主体 | 典型 result |
|---|---|---|---|
| Tool | 执行操作 | Model 或应用 | 结构化操作 result |
| Resource | 读取 URI 上的内容 | Host、应用或用户 | 文本或二进制内容 |
| Prompt | 启动可复用的消息 workflow | 用户通过 host UI | 一条或多条 Prompt message |

位于 `notes://note-1` 的笔记是 Resource，因为它是可寻址内容。`delete_note` 是 Tool，因为它会改变 state。`review_note` 是 Prompt，因为用户会选择预先准备好的审查 workflow。

不要仅仅为了显得功能完整，就将同一个操作同时暴露为三种形式。每增加一个接口，都需要 discovery、authorization、caching、error handling、测试和文档。

## 2026-07-28 无状态 Envelope

本课以 MCP protocol revision `2026-07-28` 为目标。在此 profile 中，不存在 initialization handshake 或 protocol session。每个 request 都通过保留的 `_meta` key 携带其 protocol version 和 client capabilities。

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

服务器必须实现 `server/discover`。其 result 会公布受支持的
version、Resource 和 Prompt capabilities、实现 identity，以及
cache hint。client 可以直接调用其他 method，但 discovery 能在其
构建 UI 之前提供一个稳定 snapshot。

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

普通 result 声明 `"resultType": "complete"`。response `_meta` 使用 `io.modelcontextprotocol/serverInfo` 标识提供服务的实现。此信息对诊断很有用，但它不是 authentication identity。携带不受支持 revision 的 request 会返回 `-32022`，其中同时包含请求的 revision 和服务器支持的 revision。

无状态契约会改变你的设计直觉。list 不能依赖同一 connection 上先前的调用。由于 credential 是 request input，authorization 可以改变可见集合，但 connection history 不得影响它。

## Resource 是稳定的 URI 契约

Resource 是由 URI 标识的内容。应当先设计 URI，再编写 handler。

良好的 URI 应具备以下特性：

- 足够稳定，能够加入书签或在多个 request 之间传递。
- 使用服务器 domain 的 namespace。
- 不依赖 process ID 或 connection。
- 在访问 storage 之前完成验证。
- 每次读取时都执行 authorization。

`notes://note-1` 优于 `note-1`，因为它的 namespace 是显式的。文件服务器可以使用 `file://` URI，但在解析 symlink 和相对路径片段之后，它仍然必须检查配置的目录边界。

`resources/list` 返回调用方当前可见的 Resource。应按 URI 等稳定 key 排序。确定性的顺序可以避免产生不必要的 cache miss、不断变化的 snapshot，以及在刷新之间跳动的 host UI。

```json
{
  "resultType": "complete",
  "resources": [
    {
      "uri": "notes://note-1",
      "name": "架构决策",
      "description": "服务为何使用无状态边界",
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

`resources/read` 返回一个或多个 content item。未知 URI 不能被当作成功的空读取。当前 Resources specification 将无效或未知的 Resource URI 归类为 JSON-RPC invalid parameters，code 为 `-32602`。

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32602,
    "message": "未知或无效的 Resource URI",
    "data": {
      "uri": "notes://missing"
    }
  }
}
```

这种区分让 client 能够分辨内容不存在和有效的空文档。它还可以防止意外 fallback 到范围更广的 lookup。

### Resource template

Resource template 描述一组参数化 URI。当列出每个具体 item 的成本过高或数量没有上限时，应使用 Resource template。例如，`notes://projects/{project}/decisions/{decision}` 告诉 client 如何构造有效地址，而无须返回所有决策。

template 不会放宽验证要求。解析 variable、执行 authorization、限制长度和字符，并使用类型化参数构造 storage query。绝不能将任意 URI 尾部直接拼接到 filesystem path 或 database statement 中。

### Content 不是可信 instruction

Resource 文本可能包含 Prompt injection、secret、误导性 command 或格式错误的 markup。host 应保留 provenance，并将 Resource 内容视为数据。服务器应限制内容大小、返回准确的 MIME type、遮盖调用方无权访问的 field，并避免返回无关 record。

## Prompt 是由用户控制的模板

MCP Prompt 专为用户显式选择而设计。host 可以将它们呈现为 slash command、menu item 或 workflow button。protocol 不要求采用某一种 UI。

对于相同的 request authorization，`prompts/list` 应具有确定性。每个 Prompt 都需要稳定的 name、实用的 description，以及能让 host 在调用 `prompts/get` 前收集 input 的 argument declaration。

```json
{
  "resultType": "complete",
  "prompts": [
    {
      "name": "review_note",
      "title": "审查笔记",
      "description": "针对指定关注点审查一篇笔记",
      "arguments": [
        {
          "name": "uri",
          "description": "笔记 Resource URI",
          "required": true
        }
      ]
    }
  ],
  "ttlMs": 600000,
  "cacheScope": "public"
}
```

`prompts/get` 将 argument 解析为 message。它不会取代 host 的 system instruction。host 决定返回的 message 如何进入 Model Context，并将自身可信的 policy 保持在更高优先级。

应在服务器边界验证 Prompt argument。Prompt URI 应通过与直接读取 Resource 相同的 authorization 检查。不要让 Prompt 成为绕过 Resource access 的 side channel。

## Cache Hint 是正确性的一部分

`ttlMs` 告诉 client，一个 result 可以复用多长时间。`cacheScope` 描述哪些主体可以共享该 cached value。

| Scope | 含义 | 典型用途 |
|---|---|---|
| `public` | 在 authorization 允许时，可跨用户复用 | 公开 Prompt catalog |
| `private` | 绑定到发起 request 的用户或 credential Context | 用户拥有的笔记内容 |

应根据数据的变化频率和过期数据可能造成的损害选择 TTL。公开 Prompt catalog 可以使用五分钟。private 笔记读取可以使用一分钟。

MCP 仅定义 `public` 和 `private` 两种 `cacheScope` value。对于包含 secret 或快速变化的 result，应返回 `cacheScope: "private"` 和 `ttlMs: 0`，然后在 host cache policy 中应用更严格的 no-store 规则。`no-store` 本身不是 MCP `cacheScope` value。

Cache hint 永远不能取代 authorization。cache key 必须包含所有会改变可见性的 request dimension，包括 tenant、user、scope、locale 和 pagination cursor。如果 shared cache 无法安全表达这些 dimension，请使用零 TTL 的 `private`，并采用 host 级 no-store policy。

## Subscription 使用由 Client 打开的 Response Stream

现代 subscription 模式取代了原来的 `resources/subscribe` RPC 和旧版 HTTP GET event endpoint。

client 将 `subscriptions/listen` 作为普通 JSON-RPC request 发送。使用 Streamable HTTP 时，这是一个 POST，其 response 会作为 SSE stream 保持打开。`notifications` object 是 allowlist。服务器不得发送未被请求的 notification type。

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

request ID 就是 subscription ID。在发送任何已请求 event 之前，服务器先发送 `notifications/subscriptions/acknowledged`。其 filter 仅包含服务器接受的子集。

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

该 stream 上后续的每个 event 都携带相同的 metadata。

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

notification 表示 Resource 已发生变化。client 会通过 `resources/read` 再次读取它，并接受当前 authorization 的约束。client 不应假定 event 中包含新文档。

多个 subscription 可以共享一个 stdio channel。subscription ID 让 client 能够对它们进行 demultiplex。通过 HTTP 使用时，关闭 response stream 就会取消 subscription。服务器正常结束 stream 时，会返回与原始 request 关联的最终 `resultType: "complete"` response。

不要将 subscription stream 用作 protocol session。后续读取仍然是完整 request，可以到达任意健康的服务器实例。

```figure
t3-primitive-sort
```

## 交互实验

使用图示对项目跟踪器中的五种 capability 进行分类：issue 详情、创建 issue、sprint review template、项目 policy 和关闭 issue。然后判断哪些 list 可以公开缓存、哪些 read 必须保持 private，以及哪些 Resource 值得发送 update notification。

对于每项分类，都要指出选择者。如果 Model 执行操作，请使用 Tool。如果 host 读取由 URI 寻址的内容，请使用 Resource。如果用户启动预先准备好的 message workflow，请使用 Prompt。

## 实践实验

从 repository root 运行 simulator：

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

按以下顺序检查 transcript：

1. 确认 `server/discover` 公布了当前 revision 和两种 capability。
2. 确认两个 list result 均已排序，并使用 `resultType: "complete"`。
3. 确认 list 和 read result 携带有明确意图的 cache hint。
4. 将 read URI 改为 `notes://missing`，观察 `-32602`。
5. 确认 subscription acknowledgement 出现在 Resource event 之前。
6. 确认 event 和正常关闭都携带 subscription ID `5`。

这个 Python Model 不会打开真实 HTTP connection。它表示 SDK 必须放入 request 范围 response stream 中的 message。在生产环境中，请使用官方 SDK 处理 framing 和 transport。

## 交付产物

`outputs/skill-primitive-splitter.md` 是一个可复用的 MCP primitive 选择设计审查工具。它现在会检查确定性的 discovery、cache scope、无效 URI 行为以及现代 subscription filter。

本课还交付 `assets/primitive-split.svg`，它是 primitive 与 subscription 边界的静态版本，可供离线学习。

## 验证

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果：主程序打印 JSON transcript，测试命令报告至少十二项测试通过。

## Capstone 衔接

当你的 capstone 服务器在 action 之外还暴露可寻址 knowledge 时，请使用此契约。应包含一个确定性的 catalog snapshot、一个经过 authorization 的 Resource read、一次 Prompt resolution、一个无效 URI case，以及一份 subscription transcript。

你的证据应表明，没有任何 list 依赖 connection history，并且 subscription event 永远不会授予对底层 Resource 的访问权限。

## 练习

1. 添加 `notes://projects/{project}/notes/{id}` Resource template，并验证两个 variable。
2. 为 `resources/list` 添加 pagination，同时保持确定性的顺序。
3. 将一个 Resource 改为 `cacheScope: "private"` 和 `ttlMs: 0`，添加 host 级 no-store policy，并解释需要这两项控制所针对的 threat。
4. 添加 Prompt list change subscription，并证明当 filter 省略 `promptsListChanged` 时不会发送 event。
5. 创建两个同时存在的 subscription，并证明每个 event 都携带正确的 request ID。
6. 为 read handler 添加 authorization subject，并证明 cache entry 无法跨 subject 使用。

## 关键术语

- **Resource：** MCP 服务器暴露的、通过 URI 寻址的内容。
- **Prompt：** MCP 服务器暴露的、由用户控制的 message template。
- **确定性 list：** 对于相同 request input，membership 和 ordering 均保持稳定的 discovery result。
- **`ttlMs`：** 以毫秒为单位的 cache freshness duration。
- **`cacheScope`：** cached result 的共享边界。
- **`subscriptions/listen`：** 一个长期运行的 request，其 response stream 会传递经过显式 filter 的 notification。
- **Subscription ID：** 原始 listen request ID，会在 notification metadata 中重复出现。
- **Invalid parameters：** JSON-RPC error `-32602`，用于无效或未知的 Resource URI。
- **Unsupported protocol version：** JSON-RPC error `-32022`，其中包含 `supported` 和 `requested` revision。
- **`server/discover`：** 必需的服务器 method，用于返回受支持的 revision、capabilities、identity 和可选 cache hint。

## 延伸阅读

- [MCP 2026-07-28 Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP 2026-07-28 Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP 2026-07-28 Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Caching](https://modelcontextprotocol.io/specification/2026-07-28/basic/utilities/caching)
