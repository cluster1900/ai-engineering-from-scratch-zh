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
3. **Prompts（提示模板）**简单的结构化模板,供主机展示给用户快捷触发

服务器 通信――传输层负责在两者之间搬运 JSON-RPC 报文――

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

无状态绝对不意味着应用无法保持业务状态.`Mcp-Session-Id`间:如果工作流需要跨调用连续性,由服务器 生成不透明状态句柄,客户在后调中将其作为普通工具 参数传入.

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

客户端也可以直接调用业务方法并处理版本错误,但调用发现能使能力显示与版本协商更明显的透明度.`-32022`附加数据包含服务器支持的`supported`版本数组以及被拒绝的`requested`版本:

在工作室 模式下,双时代(双时代) 客户使用 `server/discover`发起探测──发现成功或收到如`-32022`等已被识别的现代错误,均证明对方为现代服务器;只有非现代错误或超时才允许回到2025-11-25的旧版本.`initialize`握手──遗产 行为仅仅作为兼容补偿,绝不是现代默认──

### 显而易见的结果结构

2026-07-28 核心规范中的每一个成功结果都带来了`resultType`其他:

- `complete`表示操作已彻底完成.
- `input_required`表示服务器需要通过多轮请求模式 (MRTR) 发起补充交互.`tools/call`,我知道.`resources/read`或`prompts/get`返回此类型――

客户必须将缺少`resultType`旧版响应应作完整处理.

列表和读取操作的结果也附带`ttlMs`没有任何一个人能让我知道.`cacheScope`确定性`tools/list`排序加上新鲜度提示,使客户端能够安全缓存服务发现结果,大幅提升模型快速缓存的稳定性.`cacheScope: public`允许跨上下文共享缓存,`private`则严格限制发起请求的私有上下文内.

### 线缆格式与传输层

通过MCP在工作室或流式HTTP上运行JSON-RPC 2.0:

- 请求:包含`jsonrpc`,我知道.`id`,我知道.`method`和 `params`,我知道.
- 响应:包含相匹配的`id`及`result`或`error`,我知道.
- 通知:无 `id`没有任何反应.

现代流式HTTP 暴露单个仅接受 POST 的端点――每个JSON-RPC 消息应应一次独立的 POST――请求 POST 接收单个JSON 对象,或接收最终响应结尾的请求作用域 SSE 流――被接受的通知 POST 返回无响应体的HTTP 202――

规范中**不存在**独立的MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`基于`Last-Event-ID`断点重放――长周期的变更通知推送统一使用 `subscriptions/listen`求,其响应保持长连接 SSE 流开.

```figure
mcp-nxm-collapse
```

## 动手实践

### 步骤1:注册服务器 表面

在`code/main.py`中,纯靠Python 标准库实现服务注册与报文解析:

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

### 步骤3:HTTP 镜像映射

远程调用通过HTTP POST发起时,需要镜像指定头部:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

当请求与请求不一致时,立即返回HTTP 400与错误码.`-32020`,我知道.

运行测试命令:

```bash
cd phases/11-llm-engineering/14-model-context-protocol
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

## 交付物品

本课交付 `outputs/skill-mcp-server-designer.md`△它可以将特定业务领域转化为符合现代无状态MCP规范的架构方案,包括发现合约,对请求的数据,确定性缓存列表,明显状态句子,传输头验和审批策略.

## 继续深入MCP 生产级体系

在第13阶段,以下四节核心进步课程将覆盖更严格的生产边界:

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md)包含严格的输入方案,结构化内容,路由数据,分页识别权以及协议与业务错误的区分.
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md)包含取消请求,持久任务取消,截止日期等性,背压及重连机制.
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md)产品可信来源不可变锁定实时漂移 准入凭证与回滚策略
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md)黄金标准和反向测试例,严格版本时代,代理网络证书,脱敏以及发布安全禁令.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| MCP | 用于向 AI Host 暴露服务发现、工具、资源、提示模板与扩展的 JSON-RPC 协议 |
| Host | 拥有大模型与用户交互界面、挂载一个或多个 MCP Client 的 AI 应用程序 |
| Client | 代表 Host 与单个具体 Server 执行 MCP 通信的连接器组件 |
| 无状态 MCP (Stateless MCP) | 每个请求携带版本与能力元数据，不存在与底层物理连接绑定的协议状态 |
| `server/discover` | 强制实现的 Server 方法，用于公布支持版本、能力集与身份标识 |
| `resultType` | 区分成功结果状态的鉴别字段（如 `complete` 或 `input_required`） |
| 显式状态句柄 (State handle) | 由 Server 签发、作为普通业务参数传递的应用层唯一标识符 |
| Streamable HTTP | 单一 POST 端点架构，返回常规 JSON 或请求作用域的 SSE 响应 |
| MRTR (多轮请求模式) | 嵌入在响应结果中的输入请求，完成后由客户端重新发起原始操作重试 |

## 延伸阅读

- [MCP 2026-07-28 核心变更](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 服务发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 多轮请求模式 (MRTR)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
