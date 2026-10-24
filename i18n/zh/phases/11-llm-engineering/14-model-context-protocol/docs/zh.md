# 模型上下文协议 (模型文本协议,MCP)

> 为了 AI 主机提供统一的协议,用于动态发现和调用工具 (工具) 资源 (资源) 和提示模板 (提示) 提示 (提示) 版本) 修订版使该协议完全无化:能力声明与版本状态下文随着每一个请求独立传递,不再依赖连接绑定的握手.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (函数调用), Phase 11 · 03 (结构化输出)
**Time:** ~75 分钟

## 学习目标

- 明确区分 MCP 主机、客户、服务器、传输层(运输) 与服务器 原语(原始) ⋅
- 构建携带MCP 2026-07-28 规范必填元数据的JSON-RPC 请求──
- 使用 `server/discover`检查版本、身份与能力声明。
- 从工具、资源和提示 返回具有类型标识与缓存感知的合规结果──
- 解释现代无状态MCP 如何与握手时代的传承服务器实现双时代互操作――
- 为服务器建立安全状态边界,传输策略和人工审批通道.

## 问题背景

没有统一的通信协议,每个AI主机都必须完全相同的能力编写专有的发现,调用,错误处理,传输和识别粘合码.

服务器暴露出标准的JSON-RPC接口;任何合规的客户端均可发现该接口,将其呈现给模型或用户,执行调用和解析结果,无需为具体的服务器定制适配器.

但是有一个关键边界至关重要:MCP 负责标准化通信协议本身. 它不负责决定模型应该调用哪些工具,也不负责自动变化不可信的内容安全,也不会自动转换无状态请求为持久应用状态.

## 核心概念

![MCP Host、无状态请求与 Server 原语](../assets/mcp-architecture.svg)

### 三大服务器 原语

1. **Tools（工具）**导读:可调用动作──每个工具包含名称、描述、JSON Schema 输入约束及执行函数──
2. **Resources（资源）**根据URI寻址的内容,供客户读取.
3. **Prompts（提示模板）**服务器 展示给用户.

服务器通信――传输层负责在两个之间移动JSON-RPC报文――

### 无状态请求取代传统握手

现在,我们已经完全移除了.`initialize`和 `notifications/initialized`通过协议层次的会议,`params._meta`现在,我们需要一个完整的解读:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

协议版本与客户 能力为强制必填项,客户身份为推项.`_meta`、缺少必填字段或字段类型错误均属于参数形,返回不有效参数 错误码(`-32602`虽然版本字符串合法但服务器无法支持,返回`UnsupportedProtocolVersionError`(`-32022`服务器可以在完全没有历史协商记录的前提下独立处理任何有效请求.

无状态绝对不意味着应用无法保持业务状态.`Mcp-Session-Id`间:如果工作流需要跨调用连续性,由服务器生成不透明状态句柄,客户在后调中将其作为普通工具 参数传入.

### 服务发现与版本协商

所有现代服务器必须实现`server/discover`△其回归结果广播支持的协议版本、能力集合与服务器身分:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "supportedVersions": ["2026-07-28"],
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {}
    },
    "ttlMs": 3600000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "demo-server",
        "version": "1.0.0"
      }
    }
  }
}
```

客户端也可以直接调用业务方法并处理版本错误,但调用发现能使能力显示与版本协商更明显透明.`UnsupportedProtocolVersionError`错误码`-32022`△其数据包含`supported`服务器支持的修订版数组`requested`没有任何其他方法.

在工作室 模式下,双时代(双时代) 客户使用 `server/discover`发起探测. 发现成功或收到.`UnsupportedProtocolVersionError`等已被识别的现代错误,均证明对方为现代服务器;只有非现代错误或超时才允许回到2025-11-25的旧版本.`initialize`握手──遗产 行为仅仅作为兼容补偿,绝不是现代默认──

### 显而易见的结果结构

2026-07-28 核心规范中的每一个成功结果都带来了`resultType`其他:

- `complete`表示操作已彻底完成.
- `input_required`表示服务器需要通过多轮请求模式 (MRTR) 发起补充交互.`tools/call`,我知道.`resources/read`或`prompts/get`返回此类型――

客户必须将缺少`resultType`旧版响应应作完整处理.

服务器应在每个结果中`_meta`中包含`io.modelcontextprotocol/serverInfo`△该身份由服务器自行声明,仅用于展示,日志和调试,不能作为安全决策的依据.

列表和读取操作的结果也附带`ttlMs`没有任何一个人能让我知道.`cacheScope`确定性`tools/list`排序加上新鲜度提示,使客户端能够安全缓存服务发现结果,并提升模型快速缓存的稳定性.`cacheScope: public`允许跨上下文共享缓存,`private`则严格限制发起请求的私有上下文内.

### 线缆格式与传输层

通过MCP在工作室或流式HTTP上运行JSON-RPC 2.0:

- 请求:包含`jsonrpc`,我知道.`id`,我知道.`method`和 `params`,我知道.
- 响应:包含相匹配的`id`及`result`或`error`,我知道.
- 通知:无 `id`没有任何反应.

现代流通 HTTP 暴露单个仅接受 POST 的端点──每个 JSON-RPC 消息应应一次独立的 POST──请求 POST 接收单个 JSON 对象,或接收到最终响应的请求作用域 SSE 流──被接受的通知 POST 返回无响应的 HTTP 202──本核心修订版未通过任何定义流通 HTTP 从客户端发送到服务器的通知──

规范中**不存在**独立的MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`基于`Last-Event-ID`断点重放――长周期的变更通知推送统一使用 `subscriptions/listen`求,其响应保持长连接 SSE 流开.

### 无需服务器 发起请求的客户端 输入

旧修订版允许服务器通过流发送`sampling/createMessage`,我知道.`roots/list`或`elicitation/create`之类的请求──当前协议改用多轮往返请求(MRTR)──符合条件的工具调用、资源读取或快速获取会返回`resultType: input_required`并至少携带`inputRequests`或`requestState`之一──客户 收集所需输入,使用新的JSON-RPCID和对应的 `inputResponses`重试原始方法;若提供了`requestState`没有了.`inputRequests`试试时省略`inputResponses`,我知道.

根、样本与登记 仍可使用但已被废弃,新实现不应采用它们──现有的根或样本 请放在MRTR的`inputRequests`中传递,绝不作为独立的服务器到客户端 JSON-RPC 请求――优先使用显而易见的文件或目录参数、资源URI、服务器配置以及与模型提供商的直接集成――studio 下的诊断信息写入 stderr,生产远测使用OpenTelemetry――

```figure
mcp-nxm-collapse
```

## 动手构建

### 步骤1:注册服务器 表面

尽管请求协议已经改变,但注册方式仍然很简单:

```python
server = MCPServer("demo-server")

@server.tool(
    "add",
    "Add two integers.",
    {
        "type": "object",
        "properties": {
            "a": {"type": "integer"},
            "b": {"type": "integer"}
        },
        "required": ["a", "b"]
    }
)
def add(a: int, b: int) -> dict:
    return {"sum": a + b}
```

`code/main.py`中的完整实现还注册了一个资源和一个提示――它只是使用标准库,让你能看清每个信封结构,而不是把协议细节交给SDK――

### 步骤2:为每一个请求添加数据

```python
def request(method, params=None):
    body_params = dict(params or {})
    body_params["_meta"] = {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/clientInfo": {
            "name": "demo-client",
            "version": "1.0.0"
        }
    }
    return {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": body_params
    }
```

不要只把这些数据存储在连接对象中.服务器会在每个请求上验证它.

### 步骤3: 首先发现再列出

调用`server/discover`选择一个受支持的版本,然后调用`tools/list`,如果你已经知道版本并能处理`-32022`直接调用`tools/list`同样合法.

演示按名称顺序返回工具列表,并附带 `ttlMs`,我知道.`cacheScope`,我知道.`resultType`与服务器的身份. 工具调用返回完整但不可缓存的结果,因为其输出可能取决于当前状态.

### 步骤 4:把同一请求映射到HTTP

远程`tools/call`带镜像 JSON-RPC 请求体的请求头:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

`MCP-Protocol-Version`要求必须与`_meta`中文版本一致.`Mcp-Method`在每个JSON-RPC请求中都是必填项,必须与`method`一致的.`Mcp-Name`只有在`tools/call`,我知道.`resources/read`与`prompts/get`时必填,且必须与工具名,资源URI或提示名一致.`HeaderMismatch`错误码`-32020`,我知道.

### 步骤5:在协议状态之外实现安全

- 在每一个HTTP请求上校验权与受众 (观众) 
- 本地服务器 绑定到本地主机,并在流式HTTP上校验 `Origin`,我知道.
- 用`destructiveHint: true`标记会修改状态的工具,并要求主机审批.
- 显式传递目录与文件范围,而不是依赖已被废弃的根.
- 将资源和工具输出视为不可信的数据.
- 专用于JSON-RPC;诊断信息写入 stderr。

## 动手实践

在课程目录下运行:

```bash
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

第一行 应报告在协议中`2026-07-28`发现了`demo-server`然后查看`MCPClient.request`它们每次都被调用,重建.`_meta`◎ 从某个请求中移动数据,观察服务器 拒绝它.

## 交付物品

本课交付 `outputs/skill-mcp-server-designer.md`△它可以将一个业务领域转化为无状态MCP设计方案. 其验收要求:发现结果,逐请求元数据,确定性缓存列表,显然状态句柄,传输头校验,授权和审批策略.

## 继续深入MCP 生产级体系

本课程为您建立协议模型. 第13阶段将四个生产边界分成各自独立的构建和验证课程:

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md)包含封闭的输入方案,结构化内容,路由元数据,不透明分页,补充权限以及协议与业务错误的区分.
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md)包含请求取消,持久任务取消,截止日期,等性,背压,代理缓冲及重连机制.
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md)产品可信来源不可变锁定实时漂移 登记处 进入证据与回滚策略
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md)据悉,在中国,中国的黄金和反例线上报文记录,

当服务器将跨越团队或信任边界时,请按顺序学习它们.它们将您从方法可以使用到协议在整个部署过程中保持安全和可诊断的.

## 练习与思考

1. 添加一个`subtract`工具,确认`tools/list`仍按字母序排列──
2. 移除协议版本 键,验证返回不有效参数(`-32602`◎然后发送正确但不支持的版本`2025-11-25`验证返回`-32022`确认`requested`已修订版,并从`supported`中选择版本──
3. 为创建操作添加由服务器生成的`draftId`解释为什么这是应用状态而不是协议会议.
4. 让一个需要用户确认的工具返回 `input_required` 使用新的身份证`inputResponses`条目和原样`requestState`重试原始调用,而不是假设建立一个服务器到客户端的JSON-RPC 请求.
5. 设计一个双时代工作室 草图:把结果或已识别的现代错误视为现代对端,只能遇到无法识别的错误或超时才允许回归`initialize`,我知道.

## 核心专业术语

| 术语 | 通俗说法 | 实际含义 |
|------|-----------------|------------------------|
| MCP | “LLM 的工具协议” | 用于服务发现、工具、资源、提示模板与扩展的 JSON-RPC 协议 |
| Host | “AI 应用” | 拥有大模型与用户交互界面、挂载一个或多个 MCP Client 的 AI 应用程序 |
| Client | “连接器” | 代表 Host 与单个具体 Server 执行 MCP 通信的连接器组件 |
| 无状态 MCP (Stateless MCP) | “没有 Session” | 每个请求携带版本与能力元数据，不存在与底层物理连接绑定的协议状态 |
| `server/discover` | “能力探测” | 强制实现的 Server 方法，用于公布支持版本、能力集与身份标识 |
| `resultType` | “结果状态” | 把结果标记为 `complete` 或 `input_required` |
| 显式状态句柄 (State handle) | “工作流 ID” | 由 Server 签发、作为普通业务参数传递的应用层唯一标识符 |
| Streamable HTTP | “远程传输” | 单一 POST 端点架构，返回常规 JSON 或请求作用域的 SSE 响应 |
| MRTR (多轮请求模式) | “请求输入再重试” | 嵌入在响应结果中的输入请求，完成后由客户端重新发起原始操作重试 |

## 延伸阅读

- [MCP 2026-07-28 核心变更](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 服务发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 多轮请求模式 (MRTR)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 已弃用特性](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
