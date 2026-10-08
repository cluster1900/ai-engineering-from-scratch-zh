# 构建 MCP Server：无状态 Python 与 TypeScript

> 现代 MCP Server 绝不记住握手状态。它校验每个请求中的元数据，执行对应的 Handler，并返回单个带有类型标识的结果。

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 13 · 06（MCP 基础）
**Time:** ~85 分钟

## 学习目标

- 为 MCP `2026-07-28` 规范实现强制要求的 `server/discover` 方法。
- 在每个接收到的请求上校验协议版本号与 Client 能力声明。
- 以确定性排序暴露 Tools、Resources 和 Prompts 列表。
- 在正确的结果中返回 `resultType`、Server 身份标识（Server Identity）与缓存提示。
- 在 Python 和 TypeScript 中，通过换行符分隔的 stdio 实现完全相同的无状态协议契约。

## 问题背景

在收到首条消息后就在内存中保存 Client 能力的 Server，虽然实现简单，但在生产运维中极其脆弱。同一个进程可能会先后为多个 Client 提供服务；远程请求也可能被打散分发到不同的 Worker；陈旧的能力声明更可能跨越鉴权边界导致信息泄漏。

MCP `2026-07-28` 规范通过使**每个请求自描述**彻底解决了这一协议层面的问题。你的应用程序依然可以维护持久化的笔记、任务作业或显式状态句柄（State Handle）。但绝不能保留隐藏的协议状态来改变后续请求的解码方式。

本课将两次构建一个笔记 Server：Python 与 TypeScript 版本均仅使用其原生标准库来实现协议核心，两者暴露完全相同的接口方法，并强制执行完全相同的通信报文契约。

## 核心概念

### 现代请求分发循环（Dispatch Loop）

```text
读取一行 JSON-RPC 文本
解析外层 Envelope
若为通知（Notification），则不予响应
针对当前请求校验 params._meta
根据 method 执行路由分发
使用 resultType 与 serverInfo 封装成功结果
写回一行 JSON-RPC 响应文本
立即遗忘当前请求作用域的元数据
```

在 stdio 模式下，有三条关键规则：

- 仅向 stdout 写入 JSON-RPC 消息；所有调试与诊断日志必须定向输出至 stderr。
- 报文以换行符分隔，并且在每次写回响应后执行 flush。
- 当 stdin 接收到 EOF 时，进程应立即优雅退出。

进程的生命周期仅代表物理传输层的存活期，绝不是现代 MCP 协议意义上的 Session。

### 请求元数据校验

每个请求都必须包含：

```json
{
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "notes-client",
        "version": "1.0.0"
      }
    }
  }
}
```

前两个字段为强制项。`clientInfo` 为推荐项。如果提供了身份数据，可以校验其数据结构，但绝不能将其视为安全认证凭据。

若版本不受支持，返回错误码 `-32022` 并附带 `requested` 与 `supported`。若请求元数据缺失，属于非法参数，返回错误码 `-32602`。绝不能从历史调用中填充缺失的元数据。

### 强制的服务发现（Mandatory Discovery）

现代 Server 必须实现 `server/discover`。一个完整的服务发现结果包括所支持的现代协议版本、Server 能力集、可选的使用说明、缓存提示以及结果 `_meta` 中的 Server 身份标识：

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": false},
    "resources": {"listChanged": false, "subscribe": false},
    "prompts": {"listChanged": false}
  },
  "ttlMs": 3600000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

服务发现并不是解锁 Server 的前提大门。Client 完全可以在不调用 discovery 的情况下直接发起 `tools/list`，因为 `tools/list` 自身就已经携带了完全相同的请求元数据。

### Tools（工具）

`tools/list` 返回具有确定性排序的 Tool 描述符列表。稳定的排序能提高响应缓存命中率，并保持模型 Prompt 上下文的稳定性。该结果同样要求携带 `ttlMs` 和 `cacheScope`。

`tools/call` 返回内容块（content blocks）和 `isError` 状态。当协议封装或方法参数非法时，返回 JSON-RPC 错误响应；当合规的 Tool 调用成功触发但在业务执行层面失败时，返回带有 `isError: true` 的常规结果。

Tool 注解（Annotations）只是给 Host 的提示，不代表强制执行：

- `readOnlyHint`
- `destructiveHint`
- `idempotentHint`
- `openWorldHint`

Host 应利用它们来进行交互确认和 UI 呈现，但 Server 必须在业务层强制执行真正的授权校验。

### Resources（资源）

`resources/list` 返回稳定的 URI 描述符。`resources/read` 返回带类型的内容。在 `2026-07-28` 规范中，两者均属于可缓存结果，必须包含 `ttlMs` 和 `cacheScope`。

对于用户专属的私有笔记数据，应使用 `cacheScope: "private"`。共享缓存绝不能跨授权上下文复用私有响应。

现代数据变更推送不再使用 `resources/subscribe`。Client 通过发起 `subscriptions/listen` 并声明 `resourceSubscriptions` 或列表变更事件来接收长连接推送。

### Prompts（提示模板）

`prompts/list` 同样可缓存且具备确定性排序。`prompts/get` 根据参数渲染指定的命名 Prompt。渲染后的 Prompt 结果属于 complete 结果，但不需要像列表或读操作那样附带缓存提示。

### 每个成功结果都是带类型的

在代码实现中，可以使用统一的包装器处理所有成功响应：

```python
def complete(payload):
    return {
        "resultType": "complete",
        **payload,
        "_meta": {SERVER_INFO_KEY: SERVER_INFO},
    }
```

列表、读取和服务发现的 Handler 会额外追加 `ttlMs` 与 `cacheScope`。集中化处理能够防止个别 Handler 疏漏了现代规范所必需的字段。

### 绝不发起 Server 端请求

现代 Server 可以发送与 Client 请求直接相关的通知，或者在 Client 打开的 `subscriptions/listen` 流中推送通知。但 Server **绝不能**主动发起独立的 JSON-RPC 请求。

当 Handler 需要 Sampling、Elicitation 或 Roots 输入时，它返回一个 `input_required` 结果。Client 在满足所请求的输入后，使用全新的请求 ID 重新发起原始方法调用。

```figure
t3-dispatch-loop
```

## 动手实践

运行 Python Server 的完整演示与测试：

```bash
cd code
python3 main.py --demo
python3 -m unittest discover tests -v
```

使用 TypeScript 运行器运行 TypeScript 版本：

```bash
npx tsx main.ts --demo
```

演示流程会发送 `server/discover`、列出各个原语、调用工具，并展示不受支持版本下的报错表现。观察每个现代请求都重复携带元数据，而每个成功结果都携带 Server 身份标识。

## 交付物

本课交付 `outputs/skill-mcp-server-scaffolder.md`。它能生成符合现代规范的 Server 设计蓝图，涵盖服务发现契约、逐请求校验、确定性缓存列表以及可选的独立 Legacy 适配层。

## 练习与思考

1. 从某个请求中移除 capabilities 字段，证明 Server 绝不会复用先前请求中声明的旧能力。
2. 颠倒 `TOOLS`、`PROMPTS` 及笔记数据的录入顺序，确认所有列表查询结果依然维持稳定的字母序。
3. 新增一个破坏性的 `notes_delete` 工具，并在执行器内部加入鉴权检查，验证 `destructiveHint` 仅作前端交互提示。
4. 补充 `resources/templates/list` 接口，要求附带 `ttlMs`、`cacheScope` 以及确定性排序。
5. 为 `2025-11-25` 编写一个完全隔离的 Legacy 适配器，并通过测试证明现代请求绝不会误入 Legacy 处理路径。

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 无状态 Server (Stateless server) | 仅从每个请求自身的元数据处理调用，无任何协议 Session 内存记忆 |
| `server/discover` | 强制实现的现代方法，用于向调用方公布支持的版本与功能集 |
| 完整结果 (Complete result) | 携带 `resultType: "complete"` 的成功现代结果 |
| 可缓存结果 (Cacheable result) | 附带强制 `ttlMs` 与 `cacheScope` 提示的发现、列表或只读结果 |
| 确定性列表 (Deterministic list) | 逻辑相同的注册表必须输出完全一致、可复现的条目顺序 |
| Server 身份 (Server identity) | 在结果 `_meta` 中携带的 `io.modelcontextprotocol/serverInfo` 标识 |
| Tool 业务错误 (Tool error) | Tool 调用正常被解析执行，但业务逻辑失败，返回包含 `isError: true` 的 content |
| 协议错误 (Protocol error) | 非法的 JSON-RPC 格式或无效的 MCP 请求参数，直接通过顶层 `error` 报错返回 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
