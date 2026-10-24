---
id: mcp-client-transports
title: MCP Clients and Transports
code: MP
subtitle: 通过 stdio 和 Streamable HTTP 探测、合并并路由 MCP 2026-07-28 对端。重试 MRTR 轮次。封装 JSON-RPC 帧。
hue: 190
sources: phases/11-llm-engineering/14-model-context-protocol, phases/13-tools-and-protocols/08-building-an-mcp-client, phases/13-tools-and-protocols/09-mcp-transports, phases/13-tools-and-protocols/11-mcp-sampling, phases/19-capstone-projects/22-jsonrpc-stdio-transport, projects/mcp-at-scale
source_hash: d897fd9af9387495
---

## 多服务器客户端
type: architecture
from: phases/13-tools-and-protocols/08-building-an-mcp-client/docs/en.md, phases/13-tools-and-protocols/08-building-an-mcp-client/code/main.py

```arch
node | host | 1,1 | Host | model and UI | client
node | client | 2,1 | MultiServerClient | one Peer per server | process
node | reg | 2,2 | registry | canonical name to peer | store
node | notes | 3,1 | notes | modern peer | process
node | files | 3,2 | files | modern peer | process
node | archive | 3,3 | archive | legacy, allow_legacy=True | process
edge | host | client | canonical name
edge | client | reg | lookup
edge | client | notes | _meta on each request
edge | client | files | _meta on each request
edge | client | archive | one initialize probe
```

## stdio 时代探测
type: flow
from: phases/13-tools-and-protocols/08-building-an-mcp-client/docs/en.md

1. **客户端**：在任何其他请求之前发送 `server/discover`。
2. **结果**：现代版本。选双方都支持的最高版本。
3. **-32022**：现代版本。从 `data.supported` 中选。用新 id 重试。
4. **-32020, -32021**：现代版本。修正请求。不要 `initialize`。
5. **超时、关闭、未知错误**：无法判定。失败即关闭（fail closed）。
6. **白名单对端**：一次有界的 `initialize`。检查 `protocolVersion`、`capabilities`、`serverInfo`。
7. **时代缓存**：在整个传输生命周期内保留。

## 代码中的客户端任务
type: task-table
span: 2
from: phases/13-tools-and-protocols/08-building-an-mcp-client/code/main.py, phases/13-tools-and-protocols/08-building-an-mcp-client/docs/en.md, phases/13-tools-and-protocols/09-mcp-transports/code/main.py, phases/19-capstone-projects/22-jsonrpc-stdio-transport/code/main.py

| 任务 | 代码 |
|---|---|
| 注册现代对端 | `client.add_server("notes", notes)` |
| 允许一次旧版探测 | `client.add_server("archive", archive, allow_legacy=True)` |
| 按名称顺序探测每个对端 | `client.connect_all()` |
| 列出每个在线对端的工具 | `client.discover_tools()` |
| 拒绝重名 | `client.merge(policy="reject")` |
| 按规范名调用 | `client.call("notes/search", {})` |
| 把 body 字段镜像到 header | `http_headers_for(message)` |
| 处理 JSON-RPC 行直到 EOF | `serve(handler, StdioTransport(stdin, stdout))` |

## 运行课程代码
type: command-table
from: phases/11-llm-engineering/14-model-context-protocol/docs/en.md, phases/13-tools-and-protocols/08-building-an-mcp-client/docs/en.md, phases/13-tools-and-protocols/09-mcp-transports/docs/en.md, phases/13-tools-and-protocols/09-mcp-transports/code/main.py, phases/13-tools-and-protocols/11-mcp-sampling/docs/en.md, phases/19-capstone-projects/22-jsonrpc-stdio-transport/code/main.py

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` | 11.14：在 `2026-07-28` 发现 `demo-server` |
| `python3 main.py` | `code/` 中的 13.08：对端、合并后的工具、调用 |
| `python3 main.py --probe` | 13.09：在空闲端口上运行 HTTP 探测 |
| `python3 main.py --serve` | 13.09：提供 `http://127.0.0.1:8017/mcp` 服务 |
| `python3 main.py` | `code/` 中的 13.11：请求 id `[1, 2, 3]` |
| `python3 code/main.py` | 19.22：BytesIO 演示，打印 `server_responses` |
| `python3 -m unittest discover tests -v` | 运行 `code/` 中的测试 |

## 给每个现代请求打上标记
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/08-building-an-mcp-client/code/main.py

```python
def modern_request(request_id, method, params, version, capabilities=None):
    body_params = dict(params or {})
    body_params["_meta"] = request_meta(version, capabilities)  # new on each call
    return {"jsonrpc": "2.0", "id": request_id, "method": method, "params": body_params}
VERSION_KEY = "io.modelcontextprotocol/protocolVersion"          # required
CAPABILITIES_KEY = "io.modelcontextprotocol/clientCapabilities"  # required
CLIENT_INFO_KEY = "io.modelcontextprotocol/clientInfo"           # client identity
RECOGNIZED_MODERN_ERRORS = {-32020, -32021, -32022}              # never downgrade
```

## stdio 还是 Streamable HTTP
type: comparison
from: phases/13-tools-and-protocols/09-mcp-transports/docs/en.md, phases/11-llm-engineering/14-model-context-protocol/docs/en.md

| 因素 | stdio | Streamable HTTP |
|---|---|---|
| 适用场景 | 由客户端启动的子进程 | 网络服务 |
| 分帧 | 每行一条 UTF-8 JSON-RPC 消息 | 每个 POST 一条 JSON-RPC 消息 |
| 版本上下文 | `params._meta` | `params._meta` 加镜像 header |
| 响应 | stdout 上一行 | JSON 或请求级 SSE |
| 通知 | 无响应行 | `202 Accepted`，无 body |
| 诊断 | 只用 stderr | HTTP 状态码加 JSON-RPC 错误 |
| 变更事件 | 重启后重新打开 | `subscriptions/listen` POST 流 |
| 安全 | stdin EOF 时退出 | 校验 `Origin`，绑定 `127.0.0.1` |

## Sampling 的 MRTR 轮次
type: flow
from: phases/13-tools-and-protocols/11-mcp-sampling/docs/en.md, phases/13-tools-and-protocols/11-mcp-sampling/code/main.py

1. **客户端**：调用 `tools/call`。capabilities 中包含 `sampling`。
2. **服务器**：返回 `input_required`、`inputRequests`、`requestState`。
3. **客户端**：检查策略并询问自己的模型。
4. **客户端**：相同方法和参数，新 id，`inputResponses`，原样的 `requestState`。
5. **服务器**：校验 HMAC、主体、参数摘要和过期时间。
6. **服务器**：最后一轮返回 `resultType: "complete"`。

## 课程代码中的默认值
type: defaults
from: phases/13-tools-and-protocols/08-building-an-mcp-client/code/main.py, phases/13-tools-and-protocols/09-mcp-transports/code/main.py, phases/13-tools-and-protocols/11-mcp-sampling/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `discovery_timeout_ms` | 1_000 | 必须为正 |
| `legacy_probe_timeout_ms` | 1_000 | 传给传输适配器 |
| `merge` 策略 | prefix-on-collision | 或 `reject` |
| 发现 `ttl_ms` | 3_600_000 | `cache_scope="public"` |
| `MAX_REQUEST_BYTES` | 1_048_576 | body 更大时返回 `-32700` |
| `READ_TIMEOUT_SECONDS` | 5.0 | 读取 body 的 socket 超时 |
| `maxTokens` | 400 | 每个内嵌 sampling 请求 |
| `requestState` 过期 | 300 | 首次调用后的秒数 |

## 状态码与错误码
type: troubleshooting
from: phases/13-tools-and-protocols/09-mcp-transports/docs/en.md, phases/13-tools-and-protocols/09-mcp-transports/code/main.py, phases/11-llm-engineering/14-model-context-protocol/docs/en.md, phases/13-tools-and-protocols/11-mcp-sampling/docs/en.md, phases/19-capstone-projects/22-jsonrpc-stdio-transport/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| HTTP 400，`-32020` | header 缺失或与 body 不一致 | 从最终 body 构建 header |
| HTTP 400，`-32022` | 版本不受支持 | 用 `supported` 中的值重试 |
| `-32021` | 客户端缺少必需的 capability | 读取 `data.requiredCapabilities` |
| `-32602` | 缺少 `_meta` 或 `requestState` 无效 | 发送 `_meta` 并回传 state |
| HTTP 403 | `Origin` 不在白名单中 | 使用精确的 origin 匹配 |
| HTTP 404，`-32601` | 未知的现代方法 | 不要当作旧版的证据 |
| HTTP 405 | 对 `/mcp` 发 GET 或 DELETE | 使用 POST 和 `subscriptions/listen` |
| `-32700`，id 为 null | 某一行 stdio 是坏 JSON | 循环继续处理下一行 |

## 问答
type: qa
from: phases/13-tools-and-protocols/08-building-an-mcp-client/docs/en.md, phases/13-tools-and-protocols/09-mcp-transports/docs/en.md, phases/13-tools-and-protocols/11-mcp-sampling/docs/en.md

- **-32601 能证明是旧版服务器吗？** 不能。它只让白名单对端获得一次探测。
- **流能恢复吗？** 不能。`Last-Event-ID` 会被忽略。用新 id 发送新请求。
- **工作流状态放在哪里？** 放在服务器签发的 handle 中，由客户端作为参数传回。
- **服务器能调用客户端吗？** 不能。它返回 `input_required`，由客户端重试。
- **模型偏好之和为一吗？** 不是。它们是相互独立的提示。

## 项目：MCP Tool Discovery Workbench
type: command-table
span: 2
from: projects/mcp-at-scale/README.md, projects/mcp-at-scale/API.md, projects/mcp-at-scale/project.json, projects/mcp-at-scale/solution

| 命令 | 作用 |
|---|---|
| `python3 scripts/project_test.py mcp-at-scale --all --path <dir> --strict` | 运行评分器。先用 `--init <dir>` 初始化 |
| `python3 cli.py samples/inventory.json --query "pods count" --max-chars 500` | 预算内的最佳 schema |
| `python3 cli.py /absolute/inventory.json --serve` | 带 `catalog_search` 的 stdio 服务器 |
| 检查项 | initialize 之前：-32002。每页 32 个工具。8 页共 250 个名称 |

## 提示
type: tips
from: phases/13-tools-and-protocols/08-building-an-mcp-client/docs/en.md, phases/13-tools-and-protocols/09-mcp-transports/docs/en.md, phases/13-tools-and-protocols/11-mcp-sampling/docs/en.md

- 检查最终序列化后的请求。
- 非 ASCII 的 `Mcp-Name` 以 `=?base64?{Base64EncodedValue}?=` 发送。
- 限制 MRTR 轮数。校验每个 sampling 响应。
- 流丢失时，重新发出 `subscriptions/listen` 并重新获取。
- 在 stdio 下，把诊断写到 stderr。
