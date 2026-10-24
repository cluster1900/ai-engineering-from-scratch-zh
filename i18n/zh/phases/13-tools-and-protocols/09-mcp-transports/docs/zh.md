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

如果请求作用域的SSE流在收到最终响应前中断,客户视该次的过程请求已丢失.在确认安全后,客户可以使用全新的JSON-RPC ID发出新的独立请求,但绝不能尝试恢复该流.

### 源站校验(原始验证)

服务器在接收传入连接时验证`Origin`请头以防范DNS重绑定攻击 (DNS重绑定攻击) ⋅如果头存在且不允许在白名单内,返回`403 Forbidden`〔非浏览器客户端可以省略〕`Origin`官方传输规则允许

本地开发服务器应被绑定到`127.0.0.1`而不是所有网络接口.网络服务必须在每个请求上执行认证和授权.

在完成规范化配置后使用精确的源站匹配.`origin.startswith("https://trusted.example")`由于它可能接受攻击者控制后,

### 必须填写的 HTTP 元数据请求头

每个现代 POST 请求均包含:

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

规则要求:

- `MCP-Protocol-Version`必须填写,必须与`params._meta.io.modelcontextprotocol/protocolVersion`完全一致.
- `Mcp-Method`必须填写,必须与JSON-RPC 进行`method`完全一致.
- `Mcp-Name`在`tools/call`,我知道.`resources/read`和 `prompts/get`时强制必填.
- `Mcp-Name`应对`params.name`(或 `resources/read`时的`params.uri`
- 请求头的值区分大小写,尽管请求头名称不区分大小写.

对于包含非ASCII或特殊字符的`Mcp-Name`通过精确的UTF-8 Base64哨兵格式:

```text
=?base64?{Base64EncodedValue}?=
```

服务器在与请求体比较之前先解码该值.

任何缺失或不符合要求的镜像,立即返回HTTP`400`与错误码`-32020`△若头体版本一致但服务器不支持该版本,返回HTTP `400`与错误码`-32022`附带精确的错误数据,例如`{"supported":["2026-07-28"],"requested":"2027-01-01"}`,我知道.

未知的现代方法返回 HTTP `404`与JSON-RPC`-32601`◎JSON-RPC 响应体很重要,因为双时代客户端依赖于它区分现代错误与遗产端点未命中.

### 要求作用域的短周期 SSE

服务器可以使用 SSE 进行更长时间的单个请求:

```text
POST tools/call id=41
  <- notifications/progress related to id=41
  <- notifications/progress related to id=41
  <- JSON-RPC response id=41
stream closes
```

服务器绝不能在这个流中主动向客户端发起独立的JSON-RPC请求――样本化、请求与根 交互使用多轮往返请求(多轮回程请求) 结果――关闭响应流即代表取消该请求――

不要重放添加 SSE 事件身份证.`Last-Event-ID`恢复机制不属于现代修订版.

### 长周期变更推送:`subscriptions/listen`

变更通知必须通过客户主动发起的请求启动,而不是独立的GET:

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

响应是一个长连接 SSE 流――其首条协议消息为`notifications/subscriptions/acknowledged`应确认通知,后续每次变更通知以及最终结果均为`_meta`携带中`io.modelcontextprotocol/subscriptionId`服务器可以发送SSE注释作为保证活信号――流开后,客户端发出新的`subscriptions/listen`并重新获取可能已变更的数据.

`resources/subscribe`与`resources/unsubscribe`属于传统时代,不要在现代连接上使用它们.

### 显而易见的应用层状态

移除协议 会议绝对不意味着禁止有状态的工作流――服务器可以生成一个不透明的状态句柄 (State Handle) 并在正常的工具结果中返回它―― 客户端在后调中将该句柄作为显式参数传入――

通过使用,它将被强制使用,并将其与认证主体绑定,赋予不可估测的随机性和有效过期时间,并且在每次使用时严格授权.

由于隐藏的副本状态引发的故障是机械式的:

1. 请在该进程内存中创建草稿.
2. 响应没有回复草稿句柄,因为实现假定连接本身就能识别草稿.
3. 要求B是全新的帖子,到达副本 2.
4. 副本 2 拥有合法的协议元数据,但无法命名或加载该草稿,因此工作流失败或读取错误的本地对象.
5. 粘性路由 (粘性路由) 似乎修复了症状,直到一次重启,发布,重新调整或故障转移把下一个请求转移.

正确边界包含两个部分:协议上下文保留在每个请求中;持久的应用状态存储在共享存储库中,以服务器生成并返回客户端的句柄为关键.下一次调用提供该句柄,任意副本都能加载相同的记录,授权则将记录绑定到已认证的主体和租户.

根据生命周期选择状态机制:请求内局部变量只用于单次调用;短暂的MRTR 续接可以使用带完整性保护的`requestState`草稿或持久任务需要显式的句柄,再加上共享持久化,过期,并发控制等性.

### 双时代兼容

同时支持现代与传承服务器的客户端 首先尝试现代 POST──如果收到HTTP `400`,我知道.`404`或`405`检查答案:

- 已识别的现代 JSON-RPC 错误证明 服务器是现代的──修改请求或改用对方公布的版本重试,不要降级──
- 空响应体或无法识别的响应可能意味着这是遗产HTTP+SSE服务器.`endpoint`事件.

迁移期间,服务器可以同时支持两个时代:把携带现代元数据的请求路由到现代纯 POST 实现,同时为旧客户端保持独立的遗产端点.绝不需要将遗产的 GET、DELETE、Session ID 或重放行为描述为`2026-07-28`部分的部分.

```figure
tp-transport-handshake
```

## 动手实践

`code/main.py`仅使用Python 标准库实现一个有限的现代流式HTTP服务器――它校验 原始与镜像请求头,忽略已移动的会话请求头,为普通调用返回JSON,并演示一个有限的`subscriptions/listen`,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.

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
- 版本不支持时返回 `-32022`及精确的`supported`与`requested`数据
- 接收的无身份证通知返回 HTTP `202`响应体;
- 请直接返回 HTTP `405`其他
- `subscriptions/listen`是一个 POST 响应流,其确认通知,变更通知和最终结果都携带对应的订阅ID.

## 交付物品

本课交付 `outputs/skill-mcp-transport-migrator.md`提供规范指导,以移除过期协议会议补充头部校验`subscriptions/listen`替代裸GET流,并使遗产适配层保持清晰独立――

## 练习与思考

1. 从一个 POST 中移动`Mcp-Method`确认返回 HTTP `400`与错误`-32020`,我知道.
2. 发送请求头与请求体一致的版本`2027-01-01`确认返回 HTTP `400`、错误`-32022`及精确的数据`{"supported":["2026-07-28"],"requested":"2027-01-01"}`,我知道.
3. 为一个非ASCII资源URI发送基地64哨兵格式的`Mcp-Name`确认解码后的值与`params.uri`进行比较.
4. 在有限的听力流回归最终响应前将其中断,使用新的JSON-RPCID重新发起并重新拉取工具.
5. 为 工具添加显式工作流句柄,将其绑定到授权主体,而不依赖连接亲和性.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| stdio | 基于 Client 发起的子进程 stdin/stdout、以换行符分隔的 JSON-RPC 传输 |
| Streamable HTTP | 单一端点架构，其中每条现代消息均为一次全新的 HTTP POST 调用 |
| 请求作用域 SSE (Request-scoped SSE) | 针对单个请求的 POST 响应流，输出相关通知及最终响应后自动关闭 |
| `subscriptions/listen` | 客户端主动开启的长周期 POST 请求，用于接收选择订阅的变更通知 |
| 请求头不匹配 (Header mismatch) | 当镜像请求头与请求体内容不一致时，返回 HTTP 400 与 -32020 报错 |
| 源站校验 (Origin validation) | 针对传入网络连接的 DNS 重绑定防御机制，不能替代身份认证 |
| 显式状态句柄 (Explicit state handle) | 作为普通业务参数传递的应用层 Token，代替隐藏的 Session 状态 |
| Legacy 桥接层 (Legacy bridge) | 专门隔离保留的旧版本行为，仅用于向后兼容历史客户端 |

## 延伸阅读

- [MCP Transport Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
