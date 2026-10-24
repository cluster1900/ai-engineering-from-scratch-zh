---
id: mcp
title: Model Context Protocol (MCP)
code: MC
subtitle: 通过 stdio 和 Streamable HTTP 构建、调用并提供无状态 MCP 2026-07-28 服务器。
hue: 160
sources: phases/13-tools-and-protocols/06-mcp-fundamentals, phases/13-tools-and-protocols/07-building-an-mcp-server, phases/13-tools-and-protocols/08-building-an-mcp-client, phases/13-tools-and-protocols/09-mcp-transports, phases/13-tools-and-protocols/12-mcp-roots-and-elicitation, phases/13-tools-and-protocols/16-mcp-security-oauth-2-1, phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control
source_hash: 971c475a75b5a0e9
---

## 任务
type: task-table
from: phases/13-tools-and-protocols/07-building-an-mcp-server/docs/en.md, phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py, phases/13-tools-and-protocols/08-building-an-mcp-client/code/main.py, phases/13-tools-and-protocols/09-mcp-transports/docs/en.md, phases/13-tools-and-protocols/09-mcp-transports/code/main.py

| 任务 | 代码 |
|---|---|
| 通过 stdio 提供服务 | `python3 main.py` |
| 运行 stdio 演示 | `python3 main.py --demo` |
| 提供 Streamable HTTP 服务 | `python3 main.py --serve` |
| 探测 HTTP 服务器 | `python3 main.py --probe` |
| 发现服务器 | `make_request(1, "server/discover")` |
| 列出工具 | `make_request(2, "tools/list")` |
| 调用工具 | `make_request(5, "tools/call", {"name": "<tool>", "arguments": <args>})` |
| 添加旧版对端 | `client.add_server("<name>", <transport>, allow_legacy=True)` |

## 定义并运行一个工具
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py

```python
TOOLS = [{
    "name": "notes_search",                    # name the model sees
    "description": "Search note titles and bodies by keyword.",
    "inputSchema": {"type": "object",          # JSON Schema of arguments
        "properties": {"query": {"type": "string"}},
        "required": ["query"]},
    "annotations": {"readOnlyHint": True},     # hint only
}]
def handle_tools_call(params):
    executor = TOOL_EXECUTORS.get(params.get("name"))
    if executor is None:                       # unknown tool
        return complete({"content": [...], "isError": True})
    content = executor(params.get("arguments", {}))
    return complete({"content": content, "isError": False})
```

## 通过 HTTP 发起一次 tools/call
type: annotated-code
lang: text
from: phases/13-tools-and-protocols/09-mcp-transports/docs/en.md, phases/13-tools-and-protocols/06-mcp-fundamentals/docs/en.md

```text
POST /mcp                                  # one message per POST
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28           # equals the _meta version
Mcp-Method: tools/call                     # equals the JSON-RPC method
Mcp-Name: notes_search                     # equals params.name
{"jsonrpc": "2.0", "id": 7, "method": "tools/call",
 "params": {"name": "notes_search", "arguments": {"query": "MCP"},
  "_meta": {
   "io.modelcontextprotocol/protocolVersion": "2026-07-28",
   "io.modelcontextprotocol/clientCapabilities": {}}}}
```

## 架构
type: architecture
from: phases/13-tools-and-protocols/08-building-an-mcp-client/docs/en.md, phases/13-tools-and-protocols/08-building-an-mcp-client/code/main.py, phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py, phases/13-tools-and-protocols/09-mcp-transports/docs/en.md, phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/docs/en.md

```arch
node | host | 1,1 | Agent host | merges tool catalogs
node | client | 2,1 | MultiServerClient | one Peer per server
node | stdio | 3,1 | stdio | one JSON line each
node | server | 4,1 | MCP server | dispatch, HANDLERS
node | authz | 2,2 | Authorization server | issues tokens
node | http | 3,2 | Streamable HTTP | POST /mcp
node | prims | 4,2 | Primitives | tools, resources, prompts
edge | host | client | route
edge | client | stdio | subprocess
edge | client | authz | token
edge | client | http | POST
edge | stdio | server | stdin
edge | http | server | /mcp
edge | server | prims | handler
```

## 发现、列出、调用
type: flow
from: phases/13-tools-and-protocols/06-mcp-fundamentals/docs/en.md, phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py, phases/13-tools-and-protocols/07-building-an-mcp-server/docs/en.md

1. **客户端**：发送 `server/discover`，在 `params._meta` 中带上版本和能力。
2. **服务器**：返回 `supportedVersions` 和 `capabilities`。不会建立会话。
3. **客户端**：发送 `tools/list`。得到一个带 `ttlMs` 和 `cacheScope` 的有序列表。
4. **客户端**：发送 `tools/call`，带上 `name`、`arguments` 和一个新的 `id`。
5. **服务器**：`validate_request()` 检查 `params._meta`。版本不对时返回 `-32022`。
6. **服务器**：`dispatch()` 按 `method` 路由到 `handle_tools_call()`。
7. **服务器**：返回 `resultType` 为 complete 的结果，带 `content` 和 `isError`。

## 方法
type: command-table
from: phases/13-tools-and-protocols/06-mcp-fundamentals/docs/en.md, phases/13-tools-and-protocols/09-mcp-transports/docs/en.md, phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md

| 命令 | 作用 |
|---|---|
| `server/discover` | 版本、能力、说明、服务器身份 |
| `tools/list` | 列出工具。可缓存 |
| `tools/call` | 运行一个工具。返回内容块 |
| `resources/list` | 列出按 URI 寻址的数据。可缓存 |
| `resources/read` | 按 URI 读取一个资源 |
| `prompts/list`、`prompts/get` | 列出并渲染提示词模板 |
| `subscriptions/listen` | 用于变更事件的长连接 POST 流 |
| `notifications/cancelled` | 在 stdio 上取消一个请求。无响应 |

## 关键概念
type: concepts
from: phases/13-tools-and-protocols/06-mcp-fundamentals/docs/en.md, phases/13-tools-and-protocols/07-building-an-mcp-server/docs/en.md, phases/13-tools-and-protocols/09-mcp-transports/docs/en.md

- **无状态核心**：每个请求都携带解释它所需的元数据。
- **请求元数据**：版本和能力是必需的。建议带上 `clientInfo`。
- **完整结果**：每个成功结果都把 `resultType` 设为 complete。
- **可缓存结果**：列表、读取和发现结果都带 `ttlMs` 和 `cacheScope`。
- **工具注解**：`readOnlyHint`、`destructiveHint` 只是提示。由服务器强制执行。
- **stdio**：由客户端启动的子进程。JSON 写 stdout，日志写 stderr。
- **Streamable HTTP**：一个 `/mcp` 端点。每条消息都是一个新的 POST。
- **旧版时代**：到 `2025-11-25` 为止，先 `initialize` 再 `notifications/initialized`。

## 默认值
type: defaults
from: phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py, phases/13-tools-and-protocols/08-building-an-mcp-client/code/main.py, phases/13-tools-and-protocols/09-mcp-transports/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `PROTOCOL_VERSION` | 2026-07-28 | 课程中的现代修订版 |
| `server/discover` ttl | 3_600_000 | 毫秒（ms），`cacheScope` public |
| `tools/list` ttl | 60_000 | 毫秒（ms），`cacheScope` public |
| `resources/read` ttl | 5_000 | 毫秒（ms），`cacheScope` private |
| `cache_scope` | private | `complete()` 默认值 |
| HTTP 端口 | 8017 | `--serve` 绑定 127.0.0.1 |
| `MAX_REQUEST_BYTES` | 1_048_576 | HTTP 请求体上限 |
| `legacy_probe_timeout_ms` | 1_000 | 一次 `initialize` 探测的截止时间 |

## 故障排查
type: troubleshooting
from: phases/13-tools-and-protocols/06-mcp-fundamentals/docs/en.md, phases/13-tools-and-protocols/07-building-an-mcp-server/docs/en.md, phases/13-tools-and-protocols/08-building-an-mcp-client/docs/en.md, phases/13-tools-and-protocols/09-mcp-transports/docs/en.md, phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `-32022` | 版本不受支持 | 从 `data.supported` 中选一个。用新 id 重试 |
| `-32602` | 缺少请求元数据 | 在每个请求上打上 `_meta` |
| HTTP 400 `-32020` | header 与 body 不一致 | 精确镜像版本、方法和名称 |
| POST 返回 HTTP 403 | `Origin` 不被允许 | 把确切的 origin 加入白名单 |
| HTTP 405 | 对 `/mcp` 发 GET 或 DELETE | 用 POST，事件用 `subscriptions/listen` |
| stdio 客户端解析失败 | 日志写到了 stdout | 把诊断信息写到 stderr |
| HTTP 401 | token 无效、过期或受众不对 | 为该资源获取 token |
| 403 `insufficient_scope` | 工具需要更大的 scope | 按质询中的 scope 提升授权 |

## 术语表
type: glossary
from: phases/13-tools-and-protocols/06-mcp-fundamentals/docs/en.md, phases/13-tools-and-protocols/09-mcp-transports/docs/en.md, phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/docs/en.md, phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/docs/en.md

- **JSON-RPC 2.0**：每个 MCP 请求、响应和通知的信封格式。
- **SSE**：`text/event-stream` 响应。先是通知，然后是最终响应。
- **MRTR**：多轮往返请求（Multi Round-Trip Request）。先 `input_required`，再用新请求重试。
- **PKCE**：verifier 加 S256 challenge。保护被截获的授权码。
- **CIMD**：URL 即客户端 id 的 HTTPS 元数据文档。
- **DCR**：为兼容保留、已弃用的动态客户端注册。
- **RFC 9728**：受保护资源元数据。指明授权服务器。

## 问答
type: qa
from: phases/13-tools-and-protocols/07-building-an-mcp-server/docs/en.md, phases/13-tools-and-protocols/08-building-an-mcp-client/docs/en.md, phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/docs/en.md, phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md, phases/13-tools-and-protocols/06-mcp-fundamentals/docs/en.md

- **工具错误还是协议错误？** 合法调用执行失败用 `isError: true`。请求本身有问题用 JSON-RPC 错误。
- **服务器能调用客户端吗？** 不能。它返回 `input_required`。客户端用新 id 重试。
- **怎么取消？** stdio：发送 `notifications/cancelled`。HTTP：关闭响应流。
- **stdio 需要 OAuth 吗？** 不需要。授权只适用于 HTTP 传输。
- **什么时候发送 `initialize`？** 只发给白名单中的旧版对端。默认绝不发送。

## 提示
type: tips
from: phases/13-tools-and-protocols/06-mcp-fundamentals/docs/en.md, phases/13-tools-and-protocols/08-building-an-mcp-client/docs/en.md, phases/13-tools-and-protocols/09-mcp-transports/docs/en.md, phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/docs/en.md

- 对列表项排序。稳定的顺序带来稳定的缓存键和模型上下文。
- 本地服务器绑定到 `127.0.0.1`。Origin 检查不等于认证。
- 精确匹配 origin。前缀检查会放过攻击者加的后缀。
- bearer token 放在 `Authorization` 中发送。绝不放进 URL。
- 返回显式的状态句柄。粘性路由在故障切换时会失效。
- 工具重名时，加前缀或拒绝。绝不覆盖。
