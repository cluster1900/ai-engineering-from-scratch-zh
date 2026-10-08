# MCP 传输层：stdio 与无状态 Streamable HTTP

> 传输层负责承载 MCP 报文，但它绝不提供缺失的协议状态。在 `2026-07-28` 规范中，本地 stdio 与远程 Streamable HTTP 均承载完全自描述的独立请求。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 与 08（构建 MCP Server 与 Client）
**Time:** ~65 分钟

## 学习目标

- 为本地子进程选择 stdio，为网络服务选择 Streamable HTTP。
- 实现现代单端点、纯 POST（POST-only）的 Streamable HTTP 传输协议。
- 镜像并校验 MCP 版本号、方法名与 Name 请求头与 JSON-RPC 消息体的一致性。
- 正确交付请求作用域的短周期 SSE 与长周期的 `subscriptions/listen` 推送流。
- 迁移基于 Session 和早期 HTTP+SSE 的部署，杜绝将 Legacy 行为误当现代规范呈现。

## 问题背景

早期的 Streamable HTTP 修订版将协议协商与底层的连接和 Session 绑定混为一谈。Server 可以签发 `Mcp-Session-Id`、暴露独立的 GET 推送流、接受 DELETE 请求来注销 Session，并利用 `Last-Event-ID` 恢复 SSE 断点。

MCP `2026-07-28` 从网络线路上彻底移除了这些机制。任何请求都可以被分发到任何健康的 Worker 上，因为协议版本和 Client 能力均完整封装在请求体中。HTTP 头部仅镜像指定字段用于外部网关路由与策略控制，但在执行前 Server 必须严格比对头部与请求体。

这样构建出的系统具备更强的横向扩展能力与更清晰的调试心智。这也意味着：如果继续将 2025 年的传输层当成当前标准讲授，就会灌输错误的故障与安全模型。

## 核心概念

### stdio 模式

stdio 绑定专用于 Client 启动的本地子进程：

- Client 每行向 stdin 写入一条 UTF-8 编码的 JSON-RPC 消息。
- Server 每行向 stdout 写入一条 UTF-8 编码的 JSON-RPC 消息。
- Server 将所有调试诊断信息定向写入 stderr。
- 当 stdin 收到 EOF 时，Server 必须迅速退出。
- 每个现代请求均在 `params._meta` 中携带版本和能力。

进程生命周期属于物理传输生命周期，绝不是现代协议 Session。若子进程意外退出，中断的请求均已丢失。正确做法是重启进程、重新发现、重新列出工具、重新建立订阅，并仅对安全操作使用新请求 ID 发起重试。

### 2026-07-28 中的 Streamable HTTP

现代 Server 暴露一个单一的 MCP 端点（如 `/mcp`），且仅接受 POST 请求。

每一个 JSON-RPC 请求或通知，都是一次全新的 HTTP POST。请求体包含一条 JSON-RPC 报文。Client 绝不会向 Server 发送 JSON-RPC 响应。

对于收到的请求，Server 返回以下之一：

- `Content-Type: application/json`：返回单个 JSON-RPC 响应；
- `Content-Type: text/event-stream`：返回与该请求相关的通知事件，最后紧跟最终的 JSON-RPC 响应。

对于接收到的通知，Server 返回无响应体的 `202 Accepted`。

Client 在请求头中同时声明这两种响应支持：

```http
Accept: application/json, text/event-stream
```

### 纯 POST（POST-only）的铁律

现代 Streamable HTTP 不存在独立的 GET 推送端点，也没有 DELETE Session 端点：

- `GET /mcp` 直接返回 `405 Method Not Allowed`。
- `DELETE /mcp` 直接返回 `405 Method Not Allowed`。
- `Mcp-Session-Id` 直接被忽略，绝不生成，绝不回显。
- `Last-Event-ID` 直接被忽略，因为现代流不支持断点重放续传。

如果请求作用域的 SSE 流在收到最终响应前中断，Client 视该次在途请求已丢失。在确认安全后，Client 可以使用全新的 JSON-RPC ID 发起新的独立请求。

### 源站校验（Origin Validation）

Server 在收到传入连接时校验 `Origin` 请求头以防范 DNS 重绑定攻击（DNS Rebinding）。若该头存在且不在允许白名单内，返回 `403 Forbidden`。非浏览器 Client 可以省略 `Origin`，官方传输规范对此予以允许。

本地开发 Server 应绑定到 `127.0.0.1` 而不是 `0.0.0.0`。网络服务必须在每个请求上执行认证与授权；Origin 校验绝不能替代身份认证。

### 必填的 HTTP 元数据请求头

每个现代 POST 请求均包含：

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

规则要求：

- `MCP-Protocol-Version` 必须与 `params._meta.io.modelcontextprotocol/protocolVersion` 完全一致。
- `Mcp-Method` 必须与 JSON-RPC 的 `method` 完全一致。
- `Mcp-Name` 在 `tools/call`、`resources/read` 和 `prompts/get` 时强制必填。
- `Mcp-Name` 对应 `params.name`（或 `resources/read` 时的 `params.uri`）。
- 请求头的值区分大小写。

对于包含非 ASCII 或特殊字符的 `Mcp-Name`，使用标准的 Base64 哨兵格式：

```text
=?base64?{Base64EncodedValue}?=
```

任何缺失、畸形或与请求体不一致的镜像头，立即返回 HTTP `400` 与错误码 `-32020`。若头体版本一致但 Server 不支持该版本，返回 HTTP `400` 与错误码 `-32022`。

### 请求作用域的短周期 SSE

Server 可以为耗时较长的单个请求采用 SSE：

```text
POST tools/call id=41
  <- notifications/progress (针对 id=41)
  <- notifications/progress (针对 id=41)
  <- JSON-RPC response (id=41)
流关闭
```

Server 绝不能在这个流中主动向 Client 发起独立的 JSON-RPC 请求。关闭响应流即代表取消该请求。

### 长周期变更推送：`subscriptions/listen`

变更通知必须通过 Client 主动发起的专用 POST 请求开启：

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

POST 响应是一个长连接 SSE 流。其首条协议消息为 `notifications/subscriptions/acknowledged`。该确认通知、后续的每一次变更通知以及最终结果，均在 `_meta` 中携带 `io.modelcontextprotocol/subscriptionId`，且值等于该监听请求的 ID。流断开后，Client 发起新的 `subscriptions/listen` 并重新拉取可能已变更的数据。

### 显式的应用层状态

移除协议 Session 绝不意味着禁止有状态的工作流。Server 可以生成一个不透明的状态句柄（State Handle）并在正常的 Tool 结果中返回它。Client 在后续调用中将该句柄作为显式参数传入。

将句柄与认证主体绑定，赋予不可猜测的随机性与有效过期时间，并在每次使用时严密授权。这样状态就清晰地呈现于应用层，而不是隐蔽在网络传输层的会话亲和性中。

```figure
tp-transport-handshake
```

## 动手实践

`code/main.py` 仅使用 Python 标准库实现了一个小巧、合规的现代 Streamable HTTP Server：

```bash
cd code
python3 main.py --probe
python3 -m unittest discover tests -v
```

探针会依次检验：

- 非法 Origin 会被拒绝；
- 服务发现在没有 Session ID 的情况下顺利完成；
- 传入的 `Mcp-Session-Id` 与 `Last-Event-ID` 被静默忽略；
- 头部与请求体不一致时返回 `-32020`；
- 版本不支持时返回 `-32022` 及其支持版本列表；
- 接收到的无 ID 通知返回 HTTP `202` 空响应体；
- GET 和 DELETE 请求直接返回 HTTP `405`；
- `subscriptions/listen` 建立长连接并在通知中携带对应的 subscription ID。

## 交付物

本课交付 `outputs/skill-mcp-transport-migrator.md`。它提供规范指引以移除过时的协议 Session、补充头部校验、用 `subscriptions/listen` 替代裸 GET 流，并使 Legacy 适配层保持清晰独立。

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| stdio | 基于 Client 发起的子进程 stdin/stdout、以换行符分隔的 JSON-RPC 传输 |
| Streamable HTTP | 单一端点架构，其中每条现代消息均为一次全新的 HTTP POST 调用 |
| 请求作用域 SSE (Request-scoped SSE) | 针对单个请求的 POST 响应流，输出相关通知及最终响应后自动关闭 |
| `subscriptions/listen` | 客户端主动开启的长周期 POST 请求，用于接收选择订阅的变更通知 |
| 请求头不匹配 (Header mismatch) | 当镜像请求头与请求体内容不一致时，返回 HTTP 400 与 -32020 报错 |
| 源站校验 (Origin validation) | 针对传入网络连接的 DNS 重绑定防御机制，不能替代身份认证 |
| 显式状态句柄 (Explicit state handle) | 作为普通业务参数传递的应用层 Token，代替底层隐藏的传输连接状态 |
| Legacy 桥接层 (Legacy bridge) | 专门隔离保留的旧版本行为，仅用于向后兼容历史客户端 |

## 延伸阅读

- [MCP Transport Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
