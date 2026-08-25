# MCP 基础：无状态请求与 JSON-RPC

> 现代 MCP 没有 handshake，也没有协议 session。每个请求都必须携带足够的 metadata，使其能够独立地被理解、授权、路由和重试。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13，第 01 至 05 课
**Time:** 约 55 分钟

## 学习目标

- 区分 MCP 的 server 原语和 client 端功能。
- 为 MCP `2026-07-28` 构建有效的 JSON-RPC 2.0 请求和响应。
- 在每个请求中附加协议版本、client capability 和 client identity。
- 在没有 handshake 的情况下使用 `server/discover` 并处理 `UnsupportedProtocolVersionError`。
- 跟踪一个独立请求从验证到生成完整结果的全过程。

## 问题

一个 MCP server 可以在同一个进程或 HTTP worker 上连续收到来自不同 client、具有不同 capability 的两个请求。如果 server 记住了上一个请求所声明的内容，就可能应用错误的权限或返回错误的 wire 格式。

MCP `2026-07-28` 消除了这种歧义。协议核心是无状态的。server 必须根据当前请求本身，决定如何处理当前 client 的当前请求，而不能依赖连接历史。

这改变了我们的思维模型。旧流程是先建立连接，再进行 handshake，最后执行操作。现代流程更加简单：

1. client 发送一个自描述请求。
2. server 验证该请求的版本和 capability。
3. server 处理相应 method。
4. server 返回带类型的结果或 JSON-RPC error。

下一个请求会从头开始重复同一过程。

## 概念

### Server 原语

MCP server 公开三种主要原语：

1. **Tools** 是由 Model 控制的操作，通过 `tools/list` 发现，并通过 `tools/call` 调用。
2. **Resources** 是使用 URI 寻址的数据，通过 `resources/list` 发现，并通过 `resources/read` 获取。
3. **Prompts** 是可复用的模板，通过 `prompts/list` 发现，并通过 `prompts/get` 渲染。

为了保持兼容性，roots、sampling 和 logging 仍保留在 `2026-07-28` schema 中，但已经弃用。新实现应对 roots 使用显式的 Tool 或 resource 输入，对 sampling 直接使用 Model 提供商 API，并对 logging 使用 stderr 或 OpenTelemetry。Elicitation 仍可通过 Multi Round-Trip Requests 实现：server 返回输入请求，client 随后重试原始操作。现代 server 绝不会主动发起一个独立的 JSON-RPC 请求。

### JSON-RPC envelope

MCP 使用 JSON-RPC 2.0：

- 请求：`{jsonrpc, id, method, params}`
- 响应：`{jsonrpc, id, result}` 或 `{jsonrpc, id, error}`
- 通知：`{jsonrpc, method, params}`，不包含 `id`

请求 `id` 用于关联一个响应。它不会创建协议 session。

### 必需的请求 metadata

每个现代请求都在 `params` 内携带一个 `_meta` object：

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    }
  }
}
```

协议版本和 client capability 是必需的。推荐提供 client identity。它是自行报告的显示和调试数据，不是安全凭证。

server 不得从之前的请求、stdio 进程、HTTP 连接或单独的 transport header 推断这些值。

### 完整结果与 server identity

每个成功的现代结果都包含 `resultType`。普通的最终结果使用 `"complete"`。server 还应在结果 metadata 中标明自己的身份：

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "complete",
    "tools": [],
    "ttlMs": 30000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "notes-server",
        "version": "1.0.0"
      }
    }
  }
}
```

`tools/list`、`resources/list`、`prompts/list`、`resources/templates/list`、`resources/read` 和 `server/discover` 都是可缓存的结果。它们包含 `ttlMs` 和 `cacheScope`。安全的默认值是 `ttlMs: 0` 和 `cacheScope: "private"`。列表项应采用确定性顺序，使等价响应能够生成稳定的 cache key 和稳定的 Model Context。

### 无需 handshake 的发现机制

每个现代 server 都必须实现 `server/discover`。client 可以在调用其他 method 前调用它，以获取：

- `supportedVersions`
- server `capabilities`
- 可选的使用 `instructions`
- 结果 `_meta` 中的 server identity
- cache 提示

发现机制很有用，但它不是门禁。client 可以首先发送 `tools/list`，因为该请求已经携带协议版本和 capability。

如果请求的版本不受支持，server 会返回 JSON-RPC code `-32022`，并包含：

```json
{
  "requested": "2027-01-01",
  "supported": ["2026-07-28"]
}
```

client 会选择双方都支持的现代版本，并使用新的 JSON-RPC 请求 id 重试。

### 单个请求的生命周期

按照以下顺序跟踪一个现代请求：

1. 解析一个 JSON-RPC envelope。
2. 确认 `jsonrpc` 为 `"2.0"`、存在 `id`、`method` 是字符串且 `params` 是 object。
3. 要求 `params._meta` 中包含版本字符串和 capability object；metadata 格式错误或缺失时返回 `-32602`。
4. 在 HTTP 边界，将 version、method 和适用的 name header 与 body 进行比较。即使两个版本值中有一个不受支持，只要不匹配，就返回 `-32020`。
5. 确认两者相等后，如果匹配的版本不受支持，则返回 `-32022`。
6. 检查所需 capability，然后根据 `method` 进行路由，并验证该 method 专用的参数。
7. 在 handler 运行前，对具体操作进行身份验证和授权。
8. 返回包含 server identity 的完整结果。
9. 丢弃请求范围内的协议 metadata。

这个顺序可以防止两个组件对调用产生不同的解释。gateway 不得在授权 `Mcp-Name: notes.read` 的同时，让 origin 执行 `params.name: notes.delete`。它还可以将格式错误的输入、header 混淆、版本协商、capability 失败、授权失败和 handler 失败保留为彼此独立的证据。

关闭 stdin 或 HTTP 响应只会结束 transport 活动。它不会终止协议 session，因为现代 MCP 根本不存在协议 session。

### 显式 legacy 兼容性

截至 `2025-11-25` 的版本使用 `initialize`、`notifications/initialized`、连接范围的 capability，以及早期 Streamable HTTP 中可选的协议 session。当双时代 client 与旧 server 通信时，这种行为仍然相关。

应将两个时代严格分开。现代请求通过必需的每请求 metadata 来识别。只有通过文档规定的 fallback 路径，才会选择 legacy 连接。不要默认向 `2026-07-28` server 发送 `initialize`。

因此，“无状态”具有特定于时代的含义。在 `2026-07-28` 中，它是协议不变量：每个普通请求都可以独立解释，并且不存在 MCP session。在截至 `2025-11-25` 的版本中，初始化和协商得到的 capability 属于连接，因此兼容 adapter 可以保留该 legacy 连接状态。双时代实现并不是一个宽松的状态机，而是由无状态的现代核心与隔离的 legacy adapter 并列组成，并且在任一 parser 运行之前作出明确的选择决定。

这两种含义都不禁止持久的应用状态。workflow、task 或 draft 可以通过共享 store 中的不透明 handle 保存。client 将该 handle 作为普通输入发送，每个 replica 都会对其使用进行身份验证和授权。协议 Context 不得泄漏到该 store 中，用来替代已经移除的 session。

```figure
mcp-tool-call
```

## 使用它

`code/main.py` 在不使用框架的情况下构建、验证、跟踪并分发现代 MCP 消息。运行：

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

注意输出中的三个不变量：

- 每个请求都会重复自己的 `_meta` 字段。
- 每个成功结果的 `resultType` 都是 `"complete"`，并包含 server identity。
- 列表结果采用确定性排序，并包含显式的 cache 提示。

## 交付它

本课交付 `outputs/skill-mcp-handshake-tracer.md`。这个历史文件名保持不变，但该产物现在是一个无状态请求跟踪器。它会独立审核每条消息，并且只在确实存在 legacy handshake 流量时才为其添加标签。

## 练习

1. 将一个请求的协议版本改为 `2027-01-01`。确认 error code 为 `-32022`，且 data 中公布了受支持的版本。
2. 从第二个请求中移除 `io.modelcontextprotocol/clientCapabilities`。确认 server 不会复用第一个请求的 capability。
3. 反转内存中的 Tool registry。确认 `tools/list` 仍然返回相同的确定性顺序。
4. 将 `cacheScope` 从 `public` 改为 `private`。解释在每种情况下，哪些授权 Context 可以复用该响应。
5. 添加一个可选的 `clientInfo` 缺失测试。该请求应保持有效，因为 client identity 是推荐项，而非必需项。

## 关键术语

| 术语 | 含义 |
|------|---------|
| Stateless protocol | 每个请求都提供解释自身所需的 metadata |
| Request metadata | `params._meta` 中的版本、client capability 和推荐的 client identity |
| `server/discover` | 用于获取版本、capability、instructions 和 identity 的强制 server method |
| `resultType` | 每个成功现代结果中的判别字段 |
| Cacheable result | 包含必需的 `ttlMs` 和 `cacheScope` 提示的结果 |
| Protocol era | 现代的每请求 metadata，或 legacy 的连接范围初始化 |
| Transport lifetime | 进程、连接或响应流的生命周期，不是协议 session 状态 |
| `-32022` | 不支持的协议版本错误，包含请求版本和受支持版本 |

## 延伸阅读

- [MCP Architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture)
- [MCP Base Protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
