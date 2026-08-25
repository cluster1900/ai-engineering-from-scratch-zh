# Model Context Protocol (MCP)

> MCP 为 AI Host 提供了一种用于发现和调用 Tools、Resources 与 Prompts 的统一 Protocol。2026-07-28 修订版使该 Protocol 变为无状态：能力与版本 Context 随每个请求传递，而不是保存在与连接绑定的握手中。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 03 (Structured Outputs)
**Time:** ~75 分钟

## 学习目标

- 区分 MCP Host、Client、Server、Transport 和 Server primitive。
- 构建包含 MCP 2026-07-28 所需元数据的 JSON-RPC 请求。
- 使用 `server/discover` 检查版本、身份和能力。
- 从 Tools、Resources 和 Prompts 返回带类型且支持缓存的结果。
- 解释现代无状态 MCP 如何与握手时代的 Server 互操作。
- 为 Server 选择安全的状态、Transport 和审批边界。

## 问题

你的应用需要执行数据库查询、日历操作和文件读取。如果没有共享 Protocol，每个 AI Host 都需要为这些相同能力定制发现、调用、错误处理、Transport 和授权衔接逻辑。

MCP 缩小了这个集成Matrix。Server 发布标准的 JSON-RPC 接口。兼容的 Client 无需针对 Server 编写专用适配器，就能发现该接口、将其呈现给 Model 或用户、调用它并解释结果。

这里有一条很容易被忽略的重要边界。MCP 标准化的是通信。它不会决定 Model 应该调用哪个 Tool，不会让不可信内容变得安全，也不会把无状态请求转化为持久的应用状态。这些决策仍然由你的 Host 和 Server 负责。

## 概念

![MCP Host、无状态请求和 Server primitives](../assets/mcp-architecture.svg)

### 三种 Server primitives

1. **Tools** 是可调用的操作。每个 Tool 都有名称、描述、JSON Schema 输入和处理程序。
2. **Resources** 是具有名称、通过 URI 寻址且可由 Client 读取的内容。
3. **Prompts** 是 Host 可以向用户提供的可复用模板。

Host 是 AI 应用。Host 内部的一个 MCP Client 与一个 Server 通信。Transport 在两者之间传递 JSON-RPC 消息。

### 无状态请求取代握手

MCP 2026-07-28 移除了 `initialize` 和 `notifications/initialized`，同时也移除了 Protocol 层会话。每个请求都会在 `params._meta` 中携带解释该请求所需的 Context：

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

Protocol 版本和 Client 能力是必需的。建议提供 Client 身份。缺少 `_meta`、缺少必填字段，或必填字段类型错误，都属于格式错误，并返回 Invalid Params (`-32602`)。如果版本字符串格式正确但 Server 不支持，则返回 `UnsupportedProtocolVersionError` (`-32022`)。Server 无需恢复之前的协商记录，就可以处理有效请求。

无状态并不意味着应用永远不能维护状态。它意味着状态不会隐藏在 MCP 连接或 `Mcp-Session-Id` 背后。如果工作流需要连续性，Server 会生成一个不透明句柄，Client 在后续调用中将该句柄作为普通 Tool 参数传入。每个请求仍然必须进行授权检查。

### 发现与版本选择

每个现代 Server 都会实现 `server/discover`。其结果会公布支持的版本、能力和 Server 身份：

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

Client 可以直接调用其他方法并处理版本错误，但发现机制可以明确展示能力并选择版本。不支持的版本会返回代码为 `-32022` 的 `UnsupportedProtocolVersionError`。其 data 包含 Server 修订版本数组 `supported`，以及被拒绝的修订版本 `requested`。

在 stdio 上，兼容两个时代的 Client 会使用 `server/discover` 进行探测。发现结果或可识别的现代错误（例如 `UnsupportedProtocolVersionError`）表明对方是现代 Server。只有出现无法识别为现代错误的错误或超时时，才允许回退到 2025-11-25 的 `initialize` 流程。旧版行为属于兼容代码，而不是现代默认行为。

### 结果是显式的

每个核心 2026-07-28 结果都有 `resultType`：

- `complete` 表示操作已经完成。
- `input_required` 表示 Server 需要通过 Multi Round-Trip Requests 模式进行另一次往返。核心 Server 只能从 `tools/call`、`resources/read` 或 `prompts/get` 返回该值。

Client 必须将省略 `resultType` 的旧版结果视为 complete。

Server 应在每个结果的 `_meta` 中包含 `io.modelcontextprotocol/serverInfo`。该身份由 Server 自行报告，仅用于显示、日志记录和调试，不能用于安全决策。

列表和读取结果还会携带 `ttlMs` 与 `cacheScope`。确定性的 `tools/list` 顺序加上新鲜度提示，可以让 Client 安全地缓存发现结果，并提高 Prompt 缓存的稳定性。`cacheScope: public` 允许共享缓存；`private` 将复用限制在当前调用 Context 内。

### Wire 格式与 Transport

MCP 通过 stdio 或 Streamable HTTP 使用 JSON-RPC 2.0。

- 请求包含 `jsonrpc`、`id`、`method` 和 `params`。
- 响应包含匹配的 `id`，以及 `result` 或 `error`。
- 通知不包含 `id`，也不期待响应。

现代 Streamable HTTP 公开一个接受 POST 的端点。每条 JSON-RPC 消息使用一次独立的 POST。请求 POST 会收到单个 JSON 对象，或一个作用域限定于该请求、并以最终响应结束的 Server-Sent Events 流。被接受的通知 POST 会收到不含响应正文的 HTTP 202；该核心修订版未定义通过 Streamable HTTP 发送的 Client-to-Server 通知。

2026-07-28 中不存在独立的 MCP GET 流、DELETE 会话端点、`Mcp-Session-Id` 或 `Last-Event-ID` 重放。长时间存活的变更通知使用 `subscriptions/listen` POST，其响应会作为 SSE 流保持打开。

### 无需 Server 主动发起请求的 Client 输入

旧版允许 Server 通过流发送 `sampling/createMessage`、`roots/list` 或 `elicitation/create` 等请求。当前 Protocol 改用 Multi Round-Trip Requests。符合条件的 Tool 调用、Resource 读取或 Prompt 获取操作会返回 `resultType: input_required`，并至少包含 `inputRequests` 或 `requestState` 之一。Client 收集所请求的输入，然后使用新的 JSON-RPC ID 和对应的 `inputResponses` 重试原始方法；如果提供了 `requestState`，还要原样回传该值。如果之前没有 `inputRequests`，重试时应省略 `inputResponses`。

Roots、Sampling 和 Logging 仍然可用，但已被弃用，因此新实现不应采用它们。现有 Roots 或 Sampling 请求通过 MRTR `inputRequests` 传递，绝不能作为独立的 Server-to-Client JSON-RPC 请求。优先使用显式的文件或目录参数、Resource URI、Server 配置，以及与 Model provider 的直接集成。stdio 诊断使用 stderr，生产环境遥测使用 OpenTelemetry。

```figure
mcp-nxm-collapse
```

## 构建

### 第 1 步：注册 Server 接口

尽管请求契约发生了变化，注册过程仍然很简单：

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

`code/main.py` 中交付的实现还注册了一个 Resource 和 Prompt。它特意使用标准库，让你可以看到每个消息封装，而不是将 Protocol 委托给 SDK。

### 第 2 步：为每个请求附加元数据

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

不要只将这些元数据缓存在连接对象中。Server 会在每个请求中验证它们。

### 第 3 步：可选择在列出内容前执行发现

调用 `server/discover`，选择一个受支持的版本，然后调用 `tools/list`。如果你已经知道版本并且能够处理 `-32022`，也可以直接调用 `tools/list`。

Demo 会按名称顺序返回 Tool 列表，并附加 `ttlMs`、`cacheScope`、`resultType` 和 Server 身份。Tool 调用会返回 complete 且不可缓存的结果，因为其输出可能依赖当前状态。

### 第 4 步：将同一请求映射到 HTTP

远程 `tools/call` POST 包含与 JSON-RPC 正文相对应的 header：

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

`MCP-Protocol-Version` header 必须与 `_meta` 中的版本匹配。每个 JSON-RPC 请求都必须包含 `Mcp-Method`，并且其值必须与 `method` 匹配。只有 `tools/call`、`resources/read` 和 `prompts/get` 需要 `Mcp-Name`，其值必须分别匹配 Tool 名称、Resource URI 或 Prompt 名称。缺少必需的 header 或值不匹配时，会返回 HTTP 400 和代码为 `-32020` 的 `HeaderMismatch`。

### 第 5 步：在 Protocol 状态之外实施安全措施

- 验证每个 HTTP 请求的授权和 audience。
- 将本地 Server 绑定到 localhost，并在 Streamable HTTP 上验证 `Origin`。
- 使用 `destructiveHint: true` 标记会修改状态的 Tools，并要求 Host 审批。
- 显式传递目录和文件作用域，不要依赖已弃用的 Roots。
- 将 Resources 和 Tool 输出视为不可信数据。
- 在 stdio 下将 stdout 专用于 JSON-RPC；将诊断信息写入 stderr。

## 使用

从课程目录运行：

```bash
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

第一行应报告在 Protocol `2026-07-28` 下发现了 `demo-server`。然后检查 `MCPClient.request`：它会为每次调用重新构建 `_meta`。从某个请求中移除元数据，并观察 Server 如何拒绝该请求。

## 交付

`outputs/skill-mcp-server-designer.md` 可以将一个领域转化为无状态 MCP 设计。它的验收关卡要求包含发现结果、逐请求元数据策略、确定且支持缓存的列表、显式状态句柄、Transport header、授权以及审批规则。

## 继续深入学习 MCP

本课为你提供 Protocol 模型。Phase 13 将四个生产边界拆分为独立的构建与验证课程：

1. [MCP Tool 契约与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md)涵盖封闭输入 schema、结构化内容、路由元数据、不透明分页、补全授权，以及 Protocol 错误与 Tool 领域错误之间的区别。
2. [MCP 可靠性、取消与流量控制](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md)涵盖请求取消、持久任务取消、截止时间、幂等性、背压、代理缓冲和重连行为。
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md)涵盖 namespace 证明、产物来源、不可变 pin、实时漂移、Registry 状态、准入证据和回滚。
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md)涵盖 golden 与 negative wire transcript、严格版本时代划分、SDK 差异、代理证据、脱敏、健康关卡和发布回滚。

当 Server 将跨越团队或信任边界时，请按顺序学习这些课程。它们共同推动系统从“方法可以工作”发展到“契约在部署过程中始终安全且可诊断”。

## 练习

1. 添加一个 `subtract` Tool，并确认 `tools/list` 仍按字母顺序排列。
2. 移除 Protocol 版本 key，并验证 Invalid Params (`-32602`)。然后发送格式正确但不受支持的版本 `2025-11-25`，验证 `-32022`，确认 `requested` 原样返回该修订版本，并从 `supported` 中进行选择。
3. 为创建操作添加一个由 Server 生成的 `draftId`，然后要求更新操作将其作为参数传入。解释为什么这是应用状态，而不是 Protocol 会话。
4. 从需要用户确认的 Tool 返回 `input_required`。使用新的 ID、一个 `inputResponses` 条目和完全一致的 `requestState` 重试原始调用，而不是虚构一个 Server-to-Client JSON-RPC 请求。
5. 草拟一个兼容两个时代的 stdio Client。将结果或可识别的现代错误视为现代行为，并且只在出现无法识别的错误或超时时才允许回退到 `initialize`。

## 关键术语

| 术语 | 人们常说的含义 | 实际含义 |
|------|-----------------|------------------------|
| MCP | “面向 LLMs 的 Tool Protocol” | 用于 Server 发现、Tools、Resources、Prompts 和扩展的 JSON-RPC Protocol |
| Host | “AI 应用” | 拥有 Model 和 UI，并挂载一个或多个 MCP Clients |
| Client | “连接器” | 代表 Host 与一个 Server 进行 MCP 通信 |
| Stateless MCP | “无会话” | 每个请求都携带版本和能力；不会根据连接索引 Protocol 状态 |
| `server/discover` | “能力探测” | 必需的 Server 方法，用于公布版本、能力和身份 |
| `resultType` | “结果状态” | 将结果标记为 `complete` 或 `input_required` |
| State handle | “工作流 id” | 由 Server 生成并作为普通参数传递的应用标识符 |
| Streamable HTTP | “远程 Transport” | 一个 POST 端点，返回 JSON 或作用域限定于请求的 SSE 响应 |
| MRTR | “询问并重试” | Embedding结果中的输入请求，随后重试原始操作 |

## 延伸阅读

- [MCP 2026-07-28 关键变更](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP Server 发现](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 已弃用功能](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
