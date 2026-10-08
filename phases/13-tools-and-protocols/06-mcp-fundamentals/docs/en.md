# MCP 基础：无状态请求与 JSON-RPC

> 现代 MCP 既没有握手，也没有协议 Session。每个请求都必须独立携带足够的元数据，以便能够被独立解析、授权、路由和重试。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 01 至 05（Tool 接口与函数调用）
**Time:** ~55 分钟

## 学习目标

- 区分 MCP 的 Server 原语（primitives）与 Client 端特性的差异。
- 为 MCP `2026-07-28` 规范构建合规的 JSON-RPC 2.0 请求与响应 Envelope。
- 在每个请求中附加协议版本号、Client 能力声明（Capabilities）及 Client 身份标识。
- 使用 `server/discover` 并处理 `UnsupportedProtocolVersionError`，无需任何初始化握手。
- 完整追踪单个独立请求从元数据校验到返回结果的生命周期。

## 问题背景

在同一个运行进程或 HTTP Worker 上，MCP Server 可能会连续接收到来自不同 Client、具有不同能力的两个请求。如果 Server 记住或依赖上一个请求所声明的上下文，就会错误地应用权限规则，或者返回不兼容的报文结构。

MCP `2026-07-28` 规范彻底消除了这种歧义：**协议核心完全无状态**。Server 必须仅凭当前请求本身来决定如何处理当前请求，而绝不依赖连接的历史记录。

这彻底改变了心智模型。旧时代的顺序是：先建立连接，次之执行握手，最后发起业务操作。而现代规范的顺序更为简单直接：

1. Client 发送一个完全自描述的独立请求。
2. Server 校验该请求携带的协议版本和 Client 能力。
3. Server 处理对应的方法。
4. Server 返回带类型标识的结果（typed result）或 JSON-RPC 错误。

下一个请求将从零开始重复这一完整流程。

## 核心概念

### Server 原语（Server Primitives）

MCP Server 暴露三个核心原语：

1. **Tools（工具）**：由模型驱动的操作，通过 `tools/list` 发现并由 `tools/call` 调用。
2. **Resources（资源）**：按 URI 寻址的数据，通过 `resources/list` 发现并由 `resources/read` 读取。
3. **Prompts（提示模板）**：可复用的模板，通过 `prompts/list` 发现并由 `prompts/get` 渲染。

Roots、Sampling 和 Logging 在 `2026-07-28` 模式中为了兼容性予以保留，但已被明确标记为废弃（deprecated）。在全新的实现中，应使用显式的 Tool 或 Resource 输入替代 Roots，使用直接的模型提供商 API 替代 Sampling，使用 stderr 或 OpenTelemetry 替代 Logging。Elicitation 则通过多轮请求（Multi Round-Trip Requests, MRTR）保持可用，其中 Server 返回输入请求，Client 完成输入后重新发起原始操作。现代 Server 绝不主动发起独立的 JSON-RPC 请求。

### JSON-RPC Envelopes

MCP 底层使用 JSON-RPC 2.0：

- 请求（Request）：`{jsonrpc, id, method, params}`
- 响应（Response）：`{jsonrpc, id, result}` 或 `{jsonrpc, id, error}`
- 通知（Notification）：`{jsonrpc, method, params}`，无 `id` 字段

请求中的 `id` 仅用于关联单次响应，不会创建任何协议级的 Session。

### 必填的请求元数据

每个现代请求都在 `params` 内部携带一个 `_meta` 对象：

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

协议版本号（`protocolVersion`）和 Client 能力（`clientCapabilities`）是强制必填的。Client 身份（`clientInfo`）为推荐项，属于自报展示和调试信息，绝不能当作安全凭据。

Server 严禁从先前的请求、stdio 进程环境、HTTP 连接或传输层请求头中单独推断这些元数据。

### 完整结果与 Server 身份

每个成功的现代结果都包含 `resultType`。常规的终态结果使用 `"complete"`。Server 也应在结果元数据中声明自己的身份：

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

`tools/list`、`resources/list`、`prompts/list`、`resources/templates/list`、`resources/read` 以及 `server/discover` 均为可缓存结果，必须包含 `ttlMs`（毫秒存活时间）和 `cacheScope`（缓存范围）。安全的默认值是 `ttlMs: 0` 和 `cacheScope: "private"`。列表结果中的条目必须采用确定性排序（deterministic ordering），确保等价的响应能生成稳定的缓存键和一致的模型上下文。

### 无握手的服务发现（Discovery Without Handshake）

每个现代 Server 必须实现 `server/discover`。Client 可以在发起业务方法前调用它以获取：

- `supportedVersions`：Server 支持的协议版本列表
- `capabilities`：Server 提供的能力字典
- 可选的使用说明文档（`instructions`）
- 结果 `_meta` 中的 Server 身份标识
- 缓存提示（`ttlMs` 和 `cacheScope`）

服务发现非常有用，但它不是访问的前提门禁。Client 可以直接发送 `tools/list` 作为首个请求，因为该请求自身就已经完整携带了协议版本和 Client 能力。

如果请求的版本不受支持，Server 返回 JSON-RPC 错误码 `-32022` 并附带数据：

```json
{
  "requested": "2027-01-01",
  "supported": ["2026-07-28"]
}
```

Client 选择双方共同支持的现代协议版本，并使用全新的 JSON-RPC 请求 ID 进行重试。

### 单次请求的完整生命周期

请严格按照以下顺序追踪处理现代请求：

1. 解析单个 JSON-RPC Envelope。
2. 校验 `jsonrpc` 字段为 `"2.0"`，存在 `id`，`method` 为字符串，且 `params` 为对象。
3. 校验 `params._meta` 中包含版本字符串与能力对象；若元数据缺失或格式非法，返回错误码 `-32602`。
4. 在 HTTP 边界上，比对协议版本头、方法头及对应的 Name 请求头与请求体是否一致。若存在不匹配，立即返回 `-32020`（即使其中一个版本值不受支持）。
5. 在确立头体一致后，若请求的版本受支持但本 Server 不兼容，返回 `-32022`。
6. 检查所需能力，然后根据 `method` 路由并校验方法专有参数。
7. 在具体 Handler 执行前完成认证（Authentication）与授权（Authorization）。
8. 返回带有 Server 身份信息的完整结果（complete result）。
9. 立即遗忘当前请求作用域的协议元数据。

这种严格顺序能够杜绝组件之间对不同调用产生不一致理解。网关绝不能在校验了 `Mcp-Name: notes.read` 的同时由源站执行 `params.name: notes.delete`。它也让畸形输入、头信息混淆、版本协商、能力缺失、授权失败和 Handler 业务报错成为彼此分明的诊断证据。

关闭 stdin 或关闭 HTTP 响应连接仅代表传输层生命周期的结束，它不会终止任何“协议 Session”，因为现代 MCP 根本不存在协议 Session。

### 显式 Legacy 兼容

`2025-11-25` 及更早版本依赖 `initialize`、`notifications/initialized`、连接绑定的 Capabilities，以及在早期 Streamable HTTP 中的可选 Session。当双时代（dual-era）Client 与老旧 Server 通信时，这些机制依然有其价值。

但必须将两个时代彻底隔开。现代请求通过强制的每次请求元数据来识别；旧版连接只能通过专门文档规定的 Fallback 路径来选定。**绝不能把 `initialize` 当作连接 `2026-07-28` Server 的默认行为。**

```figure
mcp-tool-call
```

## 动手实践

`code/main.py` 在不依赖任何框架的前提下，纯靠标准库构建、校验、追踪并分发了现代 MCP 报文。运行命令：

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

在输出中重点观察三个关键不变量（Invariants）：

- 每个请求都完整重复其 `_meta` 字段。
- 每个成功结果都包含 `resultType: "complete"` 并包含 Server 身份标识。
- 列表结果具备严格确定性的排序，并附带显式的缓存提示（TTL 和 Cache Scope）。

## 交付物

本课交付 `outputs/skill-mcp-handshake-tracer.md`。虽然保留了历史文件名，但该 Artifact 现在是一个无状态请求追踪器（stateless request tracer）。它对每条报文进行独立审计，仅在真正存在握手交互时才标记 legacy 握手流量。

## 练习与思考

1. 将一个请求的协议版本修改为 `2027-01-01`。确认错误码为 `-32022`，且返回的 data 字段中正确广播了支持的版本列表。
2. 从第二个请求中移除 `io.modelcontextprotocol/clientCapabilities`。确认 Server 绝不会复用第一个请求中声明的能力。
3. 颠倒内存中的工具注册表顺序。确认 `tools/list` 输出依然保持完全相同的确定性排序。
4. 将 `cacheScope` 从 `public` 修改为 `private`。解释在两种情况下分别允许哪些授权上下文复用该响应。
5. 编写一个省略 `clientInfo` 的测试用例。确认请求依然有效，因为 Client 身份标识仅为推荐项而非强制项。

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
