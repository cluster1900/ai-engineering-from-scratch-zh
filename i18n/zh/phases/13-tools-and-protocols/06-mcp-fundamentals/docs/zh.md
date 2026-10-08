# 基础:无状态请求与JSON-RPC

> 现代MCP既没有握手,也没有协议会议.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 01 至 05（Tool 接口与函数调用）
**Time:** ~55 分钟

## 学习目标

- 区分 MCP 的服务器原语(原始性) 与客户端特性的差异──
- 为MCP`2026-07-28`规范构建合规的JSON-RPC 2.0 请求与响应包装
- 在每个请求中附加协议版本号、客户能力声明 (Capacities) 和客户身份识别.
- 使用 `server/discover`并处理`UnsupportedProtocolVersionError`没有任何初始握手.
- 完整追踪单个独立请求从元数据校验到返回结果的生命周期.

## 问题背景

在同一运行过程或HTTP Worker上,MCP服务器可能会连续接到来自不同客户端的两个请求,具有不同的能力.如果服务器记住或依赖于请求声明的下文,就会出现错误的应用权限规则,或者返回不兼容的报文结构.

股`2026-07-28`规范彻底消除了这种歧义:**协议核心完全无状态**◎服务器必须根据当前请求本身来决定如何处理当前请求,而绝对不依赖连接的历史记录.

这彻底改变了心智模型. 旧时代的顺序是:先建立联系,然后执行握手,最后开始业务操作.

1. 客户端发送一个完全自定义的独立请求.
2. 服务器校验该请求携带的协议版本和客户端能力.
3. 服务器处理对应的方法――
4. 服务器返回带类型标识的结果 (typed result) 或 JSON-RPC 错误――

下一个请求将从零开始重复这个完整的过程.

## 核心概念

### 服务器原语(服务器原始)

暴露三个核心原语:

1. **Tools（工具）**通过:由模型驱动的操作,通过 `tools/list`发现并由`tools/call`调用.
2. **Resources（资源）**根据URI寻址的数据,通过`resources/list`发现并由`resources/read`读取:
3. **Prompts（提示模板）**通过:可复用模板`prompts/list`发现并由`prompts/get`染色.

根、样本和登记 在`2026-07-28`模式中为了兼容性保留,但已被明确标记为废弃 (deprecated) ⋅在全新的实现中,应使用显式的工具或资源输入替代根,使用直接模型提供商API 替代样本,使用stderr或OpenTelemetry 替代登录.

### 简单的文件

使用JSON-RPC 2.0的MCP底层:

- 求:`{jsonrpc, id, method, params}`
- 响应:`{jsonrpc, id, result}`或`{jsonrpc, id, error}`
- 通知:`{jsonrpc, method, params}`没有`id`字段

在请求中`id`仅用于关联单次响应,不会创建任何协议级会议.

### 必须填写的请求数据

每个现代要求都在`params`内部携带一个`_meta`标题:

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

协议版本号`protocolVersion`)和客户能力`clientCapabilities`客户的身份`clientInfo`) 作为安全证据,绝不能作为自报展示和调试信息的建议.

服务器严禁从前的请求,工作室 进程环境,HTTP 连接或传输层请求头单独推断这些数据.

### 完整结果与服务器身份

每一个成功的现代结果都包含`resultType`△常规的终态结果使用`"complete"`◎服务器也应在结果元数据中声明自己的身份:

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

`tools/list`,我知道.`resources/list`,我知道.`prompts/list`,我知道.`resources/templates/list`,我知道.`resources/read`及`server/discover`平均可存储结果必须包含`ttlMs`现在,我们在这个世界里,`cacheScope`安全的默认值是`ttlMs: 0`和 `cacheScope: "private"`△列表结果中的条目必须采用确定性排序,以确保等价的响应能够产生稳定的缓存键和一致的模型上下文.

### 无握手的服务发现 (无握手的服务发现)

每个现代服务器必须实现`server/discover`◎客户可以在创业方法前调用它以获得:

- `supportedVersions`服务器支持协议版本列表
- `capabilities`服务器提供能力字典
- 可选的使用说明文档`instructions`)
- 结果`_meta`中部服务器身份识别
- 缓存提示`ttlMs`和 `cacheScope`)

服务发现非常有用,但它不是访问的前提.`tools/list`作为首个请求,因为该请求本身已经完全携带了协议版本和客户端能力.

如果请求版本不支持,服务器返回JSON-RPC错误码`-32022`附加数据:

```json
{
  "requested": "2027-01-01",
  "supported": ["2026-07-28"]
}
```

客户选择双方共同支持的现代协议版本,并使用全新的JSON-RPC 请求ID进行重试――

### 单次请求的完整生命周期

请严格按照以下顺序追踪处理现代请求:

1. 解析单个JSON-RPC包裹.
2. 校验`jsonrpc`字段为`"2.0"`存在`id`没有任何`method`为字符串,且`params`为了象征.
3. 校验`params._meta`中包含版本字符串与能力对象;若元数据缺失或形式非法,返回错误码 `-32602`,我知道.
4. 在 HTTP 边界,比对协议版本头、方法头及对应的名称请求头与请求体是否一致.`-32020`(即使其中一个版本值也没有支持)
5. 在确定后,如果请求的版本得到支持,但本服务器不兼容,返回`-32022`,我知道.
6. 检查所需能力,然后根据`method`路由并校验方法专有参数――
7. 在具体处理器 执行前完成认证 (认证) 与授权 (授权) 授权 (授权)
8. 返回带有服务器 身份信息的完整结果(完整结果)。
9. 立即遗忘当前请求作用域的协议元数据──

由于这种严格的顺序,可以在组件之间产生不同调用的不一致理解.`Mcp-Name: notes.read`同时由源站执行`params.name: notes.delete`也使得形输入,头条信息混,版本协商,能力缺失,授权失败和经理业务报错成为彼此分辨的诊断证据.

关闭 关闭 关闭  HTTP 响应连接仅代表传输层生命周期的结束,它不会结束任何协议会议,因为现代MCP根本没有协议会议.

### 显式遗产兼容

`2025-11-25`及更早版本依赖`initialize`,我知道.`notifications/initialized`、连接绑定能力,以及早期流媒体HTTP中可选的会议──当双时代双时代) 客户和旧服务器通信时,这些机制仍然具有其价值──

但是必须彻底分开两个时代.现代请求通过强制的每次请求来识别数据;旧版本连接只能通过专门的文档规定的倒退路径来确定.**绝不能把 `initialize` 当作连接 `2026-07-28` Server 的默认行为。**

```figure
mcp-tool-call
```

## 动手实践

`code/main.py`在不依赖任何框架的前提下,纯粹依赖标准库构建,校验,追踪并发出现代MCP报文.

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

在输出中重点观察三个关键不变量:

- 每个请求都完整复复其`_meta`字段.
- 每个成功结果都包含`resultType: "complete"`并包含服务器身份识别.
- 列表结果具有严格确定性的排序,并附带显然的缓存提示 (TTL 和缓存范围)

## 交付物品

本课交付 `outputs/skill-mcp-handshake-tracer.md`虽然保留了历史文件名称,但该文物现在是一个无状态请求追踪器 (无状态请求追踪器). 它对每条报道进行独立审计,只有在真正存在的握手交互时才标记遗产握手流量.

## 练习与思考

1. 将一个请求的协议版本修改为 `2027-01-01`确认错误码为`-32022`字段中正确广播了支持版本列表.
2. 从第二个请求中移动`io.modelcontextprotocol/clientCapabilities`❖确认服务器绝不会使用第一个请求中声明的能力.
3. 颠倒内存中的工具注册表顺序――确认`tools/list`输出仍然保持完全相同的确定性排序.
4. 将`cacheScope`从`public`修改为`private`解释在两种情况下分别允许使用该响应的授权.
5. 编写一个省略`clientInfo`测试用例:确认请求仍然有效,因为客户身份识别仅为推项而不是强制项.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 无状态协议 (Stateless protocol) | 每一个请求都自包含解析它所需的完整元数据 |
| 请求元数据 (Request metadata) | 在 `params._meta` 中携带的协议版本、Client 能力声明及推荐的 Client 身份 |
| `server/discover` | 强制实现的 Server 方法，用于声明支持版本、能力、使用说明及身份 |
| `resultType` | 每个现代成功结果上的类型鉴别字段（如 `"complete"`） |
| 可缓存结果 (Cacheable result) | 必须包含 `ttlMs` 与 `cacheScope` 提示的查询或列表结果 |
| 协议时代 (Protocol era) | 现代基于每次请求元数据的模式，或旧版连接作用域初始化的模式 |
| 传输生命周期 (Transport lifetime) | 进程、连接或响应流的物理生存周期，不等同于协议 Session |
| `-32022` | 不支持的协议版本错误码，返回请求的版本及支持的版本列表 |

## 延伸阅读

- [MCP Architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture)
- [MCP Base Protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
