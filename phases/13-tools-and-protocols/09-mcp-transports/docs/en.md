# MCP 传输：stdio 与无状态 Streamable HTTP

> 传输负责承载 MCP 消息，但不会补充缺失的协议状态。在 `2026-07-28` 中，本地 stdio 与远程 Streamable HTTP 都承载自描述请求。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13，第 07 和 08 课
**Time:** ~65 分钟

## 学习目标

- 为本地子进程选择 stdio，为网络服务选择 Streamable HTTP。
- 实现现代的单端点、仅 POST 的 Streamable HTTP 契约。
- 根据 JSON-RPC 正文镜像并验证 MCP 版本、方法和名称标头。
- 正确交付请求作用域的 SSE 和长期运行的 `subscriptions/listen` 流。
- 迁移基于会话和旧版 HTTP+SSE 的部署，同时避免将旧版行为描述为现代行为。

## 问题

早期的 Streamable HTTP 修订版本将协议协商与连接和会话行为结合在一起。服务器可以生成 `Mcp-Session-Id`、公开独立的 GET 流、接受用于终止会话的 DELETE，并通过 `Last-Event-ID` 恢复 SSE。

MCP `2026-07-28` 从现代传输中移除了这些机制。每个请求都可以到达任意健康的工作节点，因为其协议版本和客户端能力会随请求正文一同传输。HTTP 标头会镜像选定字段以供路由和策略使用，但服务器会在执行前根据正文验证这些标头。

这样得到的结果更容易扩展，也更容易理解。这还意味着，将 2025 年的传输方式当作当前方式教授的服务器，所教授的是错误的故障与安全 Model。

## 概念

### stdio

stdio 绑定用于由客户端启动的子进程：

- 客户端向 stdin 写入以行为单位的 UTF-8 JSON-RPC 消息。
- 服务器向 stdout 写入以行为单位的 UTF-8 JSON-RPC 消息。
- 服务器将诊断信息写入 stderr。
- stdin EOF 后，服务器应立即退出。
- 每个现代请求都在 `params._meta` 中携带版本和客户端能力。

进程可以存活并处理多次调用，但它并不是现代协议会话。如果进程意外退出，所有进行中的请求都会丢失。此时应重启进程、重新发现、重新获取列表、重新打开订阅，并使用新的请求 id 重试安全操作。

### `2026-07-28` 中的 Streamable HTTP

现代服务器公开一个 MCP 端点，例如接受 POST 的 `/mcp`。

每个 JSON-RPC 请求或通知都是一次新的 HTTP POST。正文包含一条 JSON-RPC 消息。客户端不会向服务器发送 JSON-RPC 响应。

对于请求，服务器返回以下两种结果之一：

- `Content-Type: application/json`，其中包含一条 JSON-RPC 响应；或
- `Content-Type: text/event-stream`，其中包含与该请求相关的通知，最后跟随最终的 JSON-RPC 响应。

对于已接受的通知，服务器返回不带正文的 `202 Accepted`。

客户端声明同时接受这两种响应类型：

```http
Accept: application/json, text/event-stream
```

### 仅 POST 就意味着只能使用 POST

现代 Streamable HTTP 没有独立的 GET 流，也没有用于会话的 DELETE 端点。

- `GET /mcp` 返回 `405 Method Not Allowed`。
- `DELETE /mcp` 返回 `405 Method Not Allowed`。
- `Mcp-Session-Id` 会被忽略，且永远不会被生成或回显。
- `Last-Event-ID` 会被忽略，因为现代流不可恢复。

如果请求作用域的流在返回最终响应之前中断，客户端就会丢失该进行中的请求。在重试安全的情况下，客户端可以使用新的 JSON-RPC id 发起新请求，但不得尝试恢复该流。

### Origin 验证

服务器验证传入连接的 `Origin`，以防止 DNS rebinding。如果该标头存在但未被明确允许，则返回 `403 Forbidden`。非浏览器客户端可以省略 `Origin`，官方传输规则允许这样做。

本地服务器应绑定到 `127.0.0.1`，而不是所有网络接口。网络服务仍然需要对每个请求执行身份验证和授权。Origin 验证并不是身份验证。

完成规范化配置后，应使用精确的 Origin 匹配。`origin.startswith("https://trusted.example")` 之类的前缀检查并不安全，因为它可能接受由攻击者控制的后缀。

### 必需的 HTTP 元数据标头

每个现代 POST 请求都包含：

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

标头规则：

- `MCP-Protocol-Version` 为必填项，并且必须等于 `params._meta.io.modelcontextprotocol/protocolVersion`。
- `Mcp-Method` 为必填项，并且必须等于 JSON-RPC `method`。
- `tools/call`、`resources/read` 和 `prompts/get` 必须提供 `Mcp-Name`。
- `Mcp-Name` 等于 `params.name`；对于 `resources/read`，则等于 `params.uri`。
- 尽管标头名称不区分大小写，但标头值区分大小写。

不安全或非 ASCII 的 `Mcp-Name` 值使用以下精确的 UTF-8 Base64 哨兵格式：

```text
=?base64?{Base64EncodedValue}?=
```

服务器在将该值与正文比较之前对其进行解码。

镜像标头缺失、格式错误或不匹配时，返回 HTTP `400` 和 JSON-RPC 错误码 `-32020`。如果标头和正文中的版本一致，但服务器不支持该版本，则返回 HTTP `400`、错误码 `-32022`，以及类似 `{"supported":["2026-07-28"],"requested":"2027-01-01"}` 的精确错误数据。

未知的现代方法返回 HTTP `404` 和 JSON-RPC `-32601`。JSON-RPC 正文非常重要，因为双时代客户端会使用它区分现代错误与旧版端点缺失。

### 请求作用域的 SSE

服务器可以为一个长时间运行的请求选择 SSE：

```text
POST tools/call id=41
  <- 与 id=41 相关的 notifications/progress
  <- 与 id=41 相关的 notifications/progress
  <- JSON-RPC 响应 id=41
流关闭
```

服务器不得在此流上发送独立的 JSON-RPC 请求。Sampling、elicitation 和 roots 交互使用 Multi Round-Trip Request 结果。关闭响应流会取消该请求。

不要为了重放而添加 SSE 事件 id。现代修订版本不支持通过 `Last-Event-ID` 恢复。

### 长期变更使用 subscriptions/listen

变更通知使用客户端发起的请求，而不是独立的 GET：

```json
{
  "jsonrpc": "2.0",
  "id": "listen-1",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true,
      "resourceSubscriptions": ["notes://note-1"]
    },
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

POST 响应是一个长期运行的 SSE 流。它的第一条协议消息是 `notifications/subscriptions/acknowledged`。确认消息、每条变更通知和最终结果都会在 `_meta` 中携带 `io.modelcontextprotocol/subscriptionId`，其值等于 listen 请求 id。服务器可以发送 SSE 注释作为 keepalive。当流中断时，客户端使用新的请求 id 重新发出 `subscriptions/listen`，并重新获取受影响的数据。

`resources/subscribe` 和 `resources/unsubscribe` 属于旧版时代。不要在现代连接上使用它们。

### 显式应用状态

移除协议会话并不禁止带状态的工作流。服务器可以生成一个不透明的状态句柄，并将其作为普通 Tool 结果返回。客户端在后续调用中将该句柄作为显式参数传入。

将句柄绑定到经过身份验证的主体，使其不可猜测，为其设置过期时间，并对每次使用进行授权。这样可以让状态在应用层可见，而不是隐藏在传输亲和性中。

隐藏副本状态所导致的故障是机械性的：

1. 请求 A 到达副本 1，并在该进程的内存中创建草稿。
2. 响应没有返回草稿句柄，因为实现假定连接能够标识该草稿。
3. 请求 B 是一次新的 POST，并到达副本 2。
4. 副本 2 拥有有效的协议元数据，但无法命名或加载该草稿，因此工作流失败或读取到错误的本地对象。
5. 粘性路由似乎修复了症状，直到重启、发布、重新调度或故障转移将下一个请求移至其他位置。

正确的边界由两部分组成。协议 Context 保留在每个请求中。持久的应用状态存放在共享存储中，并使用服务器生成且返回给客户端的句柄。下一次调用提供该句柄，任意副本都能加载同一条记录，授权机制则将记录绑定到经过身份验证的主体和租户。副本内存可以缓存记录，但它不能成为保证正确性所需的唯一副本。

根据生命周期选择状态机制。请求局部变量可以服务于一次调用。短期 MRTR 延续过程可以使用受完整性保护的 `requestState`。草稿或持久任务需要显式句柄、共享持久化、过期机制、并发控制和幂等性。这些对象都不是 MCP 协议会话。

### HTTP 双时代兼容性

同时支持现代和旧版服务器的客户端首先尝试现代 POST。如果收到 HTTP `400`、`404` 或 `405`，则检查正文：

- 可识别的现代 JSON-RPC 错误证明服务器是现代服务器。纠正请求或使用服务器声明支持的版本重试。不要降级。
- 空正文或无法识别的响应可能表明目标是旧版 HTTP+SSE 服务器。只有此时才能尝试旧的 GET 端点，并等待其旧版 `endpoint` 事件。

迁移期间，服务器可以通过将现代元数据路由到现代的仅 POST 实现，同时为旧客户端保留单独的旧版端点，从而支持两个时代。绝不要将旧版 GET、DELETE、会话 id 或重放行为描述为 `2026-07-28` 的一部分。

```figure
tp-transport-handshake
```

## 使用它

`code/main.py` 使用 Python 标准库实现了一个有限运行的现代 Streamable HTTP 服务器。它会验证 Origin 和镜像标头，忽略已移除的会话标头，为普通调用返回 JSON，并演示一个有限运行的 `subscriptions/listen` SSE 流。

```bash
cd code
python3 main.py --probe
python3 -m unittest discover tests -v
```

该探测会检查：

- 拒绝无效的 Origin；
- 不使用会话 id 即可成功完成发现；
- 忽略 `Mcp-Session-Id` 和 `Last-Event-ID`；
- 标头不匹配时返回 `-32020`；
- 版本不受支持时返回 `-32022`，并提供精确的 `supported` 和 `requested` 数据；
- 已接受且不含 id 的通知返回不带正文的 HTTP `202`；
- GET 和 DELETE 返回 `405`；
- `subscriptions/listen` 是一个 POST 响应流，其确认消息、通知和最终结果都携带对应的订阅 id。

## 交付它

本课交付 `outputs/skill-mcp-transport-migrator.md`。它会移除现代协议会话、添加标头与正文验证、使用 `subscriptions/listen` 替代独立 GET，并将所有旧版桥接逻辑保持为明显分离的实现。

## 练习

1. 从 POST 中移除 `Mcp-Method`。确认返回 HTTP `400` 和错误 `-32020`。
2. 在标头和正文中发送一致的版本 `2027-01-01`。确认返回 HTTP `400`、错误 `-32022`，以及精确数据 `{"supported":["2026-07-28"],"requested":"2027-01-01"}`。
3. 为非 ASCII 资源 URI 发送采用 Base64 哨兵格式的 `Mcp-Name`。确认解码后的值会与 `params.uri` 比较。
4. 在有限运行的 listen 流返回最终响应之前将其断开。使用新的 JSON-RPC id 重新发出请求，并重新获取 Tool。
5. 为 ping Tool 添加显式工作流句柄。将其绑定到授权主体，而不使用连接亲和性。

## 关键术语

| 术语 | 含义 |
|------|---------|
| stdio | 通过客户端启动的子进程传输以换行符分隔的 JSON-RPC |
| Streamable HTTP | 每条现代消息都是一次新 POST 的单端点传输 |
| 请求作用域的 SSE | 包含相关通知和最终响应的 POST 响应流 |
| `subscriptions/listen` | 用于接收已选择加入的变更通知的长期 POST 请求 |
| 标头不匹配 | 镜像标头与正文不一致时返回 HTTP `400` 和 JSON-RPC `-32020` |
| Origin 验证 | 针对传入连接的 DNS-rebinding 防御措施，不是身份验证 |
| 显式状态句柄 | 作为普通参数传递的应用 Token，用于替代隐藏的会话状态 |
| 旧版桥接 | 仅为兼容性保留的、单独实现的早期时代行为 |

## 延伸阅读

- [MCP 传输概览](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [MCP stdio 传输](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 订阅](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP `2026-07-28` 变更日志](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
