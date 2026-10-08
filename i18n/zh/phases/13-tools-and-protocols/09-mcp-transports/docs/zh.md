# 传输层:studio与无状态 流式 HTTP

> 传输层负责承载MCP报文,但它绝对没有提供缺失协议状态.`2026-07-28`规范中,本地工作室和远程流媒体 HTTP 均承载完全自定义的独立请求.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 与 08（构建 MCP Server 与 Client）
**Time:** ~65 分钟

## 学习目标

- 为本地进程选择工作室,为网络服务选择流式HTTP──
- 实现现代单端点、纯 POST(POST-only) 的流媒体HTTP传输协议.
- 镜像并校验MCP 版本号、方法名与名称 请求头与JSON-RPC 消息体的一致性──
- 正确交付请求作用域的短周期 SSE 与长周期`subscriptions/listen`推送流.
- 迁移基于会议和早期HTTP+SSE的部署,绝对将遗留行为误当现代规范呈现.

## 问题背景

早期的流媒体HTTP修订版将与底层的连接和会议进行协议协商 绑定混为一谈――服务器可发行`Mcp-Session-Id`、暴露独立的GET 推送流、接受 DELETE 请求注销会议,并利用 `Last-Event-ID`恢复SSE 断点――

股`2026-07-28`网络线路上彻底移除了这些机制.任何请求都可以被发送到任何健康的工人上,因为协议版本和客户端能力均完全包装在请求体中.

这也意味着:如果继续将2025年传输层作为当前标准,就会灌输错误故障和安全模型.

## 核心概念

### 工作室

专用于客户端启动本地进程:

- 客户端每行向 stdin 写入一条 UTF-8 编码的 JSON-RPC 消息.
- 服务器每行向 stdout 写入一条 UTF-8 编码的 JSON-RPC 消息.
- 服务器将所有调试诊断信息转向写入系统.
- 当您收到EOF时,服务器必须迅速退出.
- 每个现代要求均在`params._meta`中携带版本和能力

进程生命周期属于物理传输生命周期,绝不是现代协议 会议. 如果进程意外退出,中断的请求均已丢失. 正确的做法是重启进程,重新发现,重新列出工具,重新订阅,并仅对安全操作使用新请求 ID 发起重试.

### 流通性HTTP中文

现代服务器 暴露一个单一的MCP端点(如 `/mcp`),且只接受 POST 请求

每个JSON-RPC请求或通知都是一份全新的HTTP POST──请求体包含一个条 JSON-RPC报文──客户端绝不会向服务器发送 JSON-RPC 响应──

对于收到的请求,服务器返回以下一个:

- `Content-Type: application/json`:返回单个JSON-RPC响应;
- `Content-Type: text/event-stream`返回与该请求相关的通知事件,最后紧跟最终的JSON-RPC响应.

对于收到的通知,服务器回来了无响应的`202 Accepted`,我知道.

客户在请求头上同时声明支持两种反应:

```http
Accept: application/json, text/event-stream
```

### 纯邮政 仅邮政) 的铁律

现代流式HTTP不存在独立的GET 推送端点,也没有 DELETE 会议端点:

- `GET /mcp`直接返回`405 Method Not Allowed`,我知道.
- `DELETE /mcp`直接返回`405 Method Not Allowed`,我知道.
- `Mcp-Session-Id`直接被忽视,绝不产生,绝不回显.
- `Last-Event-ID`直接被忽视,因为现代流不支持断点重放续传.

如果请求作用域的SSE流在收到最终响应前中断,客户视该次在途径请求已丢失.在确认安全后,客户可以使用全新的JSON-RPC ID发出新的独立请求.

### 源站校验(原始验证)

服务器在接收传入连接时验证`Origin`请头以防范DNS重绑定攻击 (DNS重绑定攻击) ⋅如果头存在且不允许在白名单内,返回`403 Forbidden`〔非浏览器客户端可以省略〕`Origin`官方传输规则允许

本地开发服务器应被绑定到`127.0.0.1`而不是`0.0.0.0`△网络服务必须在每一个请求上执行认证和授权;

### 必须填写的 HTTP 元数据请求头

每个现代 POST 请求均包含:

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

规则要求:

- `MCP-Protocol-Version`必须与`params._meta.io.modelcontextprotocol/protocolVersion`完全一致.
- `Mcp-Method`必须与JSON-RPC的`method`完全一致.
- `Mcp-Name`在`tools/call`,我知道.`resources/read`和 `prompts/get`时强制必填.
- `Mcp-Name`应对`params.name`(或 `resources/read`时的`params.uri`
- 求头的值区分大小写着.

对于包含非ASCII或特殊字符的`Mcp-Name`使用标准的Base64哨兵格式:

```text
=?base64?{Base64EncodedValue}?=
```

任何缺失或不符合要求的镜像,立即返回HTTP`400`与错误码`-32020`△若头体版本一致但服务器不支持该版本,返回HTTP `400`与错误码`-32022`,我知道.

### 要求作用域的短周期 SSE

服务器可以使用 SSE 进行更长时间的单个请求:

```text
POST tools/call id=41
  <- notifications/progress (针对 id=41)
  <- notifications/progress (针对 id=41)
  <- JSON-RPC response (id=41)
流关闭
```

服务器绝不能在这个流中主动向客户端发出独立的JSON-RPC请求.

### 长周期变更推送:`subscriptions/listen`

变更通知必须通过客户主动发起的专业邮件 请开启:

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

响应是一个长连接 SSE 流――其首条协议消息为`notifications/subscriptions/acknowledged`应确认通知,后续每次变更通知以及最终结果均为`_meta`携带中`io.modelcontextprotocol/subscriptionId`并且值等于该监听请求的ID. 流断开后,客户发起新的.`subscriptions/listen`并重新获取可能已变更的数据.

### 显而易见的应用层状态

移除协议 会议绝对不意味着禁止有状态的工作流――服务器可以生成一个不透明的状态句柄 (State Handle) 并在正常的工具结果中返回它―― 客户端在后调中将该句柄作为显式参数传入――

通过使用,它将被强制使用,并将其与认证主体绑定,赋予不可估测的随机性和有效过期时间,并且在每次使用时严格授权.

```figure
tp-transport-handshake
```

## 动手实践

`code/main.py`仅使用Python 标准库实现一个小巧、合规的现代流式HTTP服务器:

```bash
cd code
python3 main.py --probe
python3 -m unittest discover tests -v
```

探针会依次检查:

- 非法起源会被拒绝;
- 服务发现在没有会议ID的情况下顺利完成;
- 传入的`Mcp-Session-Id`与`Last-Event-ID`被忽视了.
- 头部与请求不一致时返回 `-32020`其他
- 版本不支持时返回 `-32022`及其支持版本列表;
- 接收的无身份证通知返回 HTTP `202`响应体;
- 请直接返回 HTTP `405`其他
- `subscriptions/listen`建立长连接,并携带应对者的订阅身份证.

## 交付物品

本课交付 `outputs/skill-mcp-transport-migrator.md`提供规范指导,以移除过期协议会议补充头部校验`subscriptions/listen`替代裸GET流,并使遗产适配层保持清晰独立――

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
