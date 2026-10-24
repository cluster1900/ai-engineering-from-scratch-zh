---
id: mcp-server-build
title: Building an MCP Server
code: BM
subtitle: 校验、分发、封装并缓存一个无状态 MCP 2026-07-28 服务器。工具、资源、prompt、策略。
hue: 172
sources: phases/13-tools-and-protocols/07-building-an-mcp-server, phases/13-tools-and-protocols/10-mcp-resources-and-prompts, phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content, phases/19-capstone-projects/13-mcp-server-with-registry, projects/memory-server
source_hash: 04ba5f070c3f22cc
---

## 运行课程服务器
type: task-table
from: phases/13-tools-and-protocols/07-building-an-mcp-server/docs/en.md, phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py, phases/13-tools-and-protocols/10-mcp-resources-and-prompts/docs/en.md, phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md, phases/19-capstone-projects/13-mcp-server-with-registry/docs/en.md

| 任务 | 代码 |
|---|---|
| 以 stdio 提供服务 | `python3 main.py` |
| 运行有限演示 | `python3 main.py --demo` |
| 运行 TypeScript 移植版 | `npx tsx main.ts --demo` |
| 运行课程测试 | `python3 -m unittest discover tests -v` |
| 用 `_meta` 构建请求 | `make_request(2, "tools/list")` |
| 运行 capstone 模型 | `python3 code/main.py` |
| 检查 capstone TypeScript | `npm run typecheck` |

## 分发循环
type: flow
from: phases/13-tools-and-protocols/07-building-an-mcp-server/docs/en.md, phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py

1. **serve_stdio**：从 stdin 读一行。坏 JSON 返回 `-32700`。
2. **dispatch**：没有 `id` 即为通知。服务器不发送响应。
3. **validate_request**：检查 `params._meta` 中的版本和 capabilities。
4. **HANDLERS**：按 `method` 路由。未知方法返回 `-32601`。
5. **complete**：给 handler 结果加上 `resultType` 和 serverInfo。
6. **serve_stdio**：向 stdout 写一行 JSON、flush，然后丢弃元数据。

## 校验并封装每个请求
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py

```python
meta = params.get("_meta")                     # -32602 when missing
requested = meta.get(VERSION_KEY)              # protocolVersion key
if requested not in SUPPORTED_VERSIONS:
    raise RpcProblem(-32022, "Unsupported protocol version",
        {"requested": requested, "supported": SUPPORTED_VERSIONS.copy()})
if not isinstance(meta.get(CAPABILITIES_KEY), dict):
    raise RpcProblem(-32602, f"{CAPABILITIES_KEY} is required")
result = {"resultType": "complete", **payload,
    "_meta": {SERVER_INFO_KEY: SERVER_INFO.copy()}}
if ttl_ms is not None:                         # lists, reads, discovery
    result["ttlMs"] = ttl_ms
    result["cacheScope"] = cache_scope         # default "private"
```

## 注册工具及其执行器
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py

```python
TOOL_EXECUTORS = {"notes_search": exec_notes_search}  # name to function
def handle_tools_list(params):
    return complete({"tools": sorted(TOOLS, key=lambda tool: tool["name"])},
                    ttl_ms=60_000, cache_scope="public")
def handle_tools_call(params):
    executor = TOOL_EXECUTORS.get(name)
    if executor is None:                      # result, not RPC error
        return complete({"content": [...], "isError": True})
    try:
        return complete({"content": executor(arguments), "isError": False})
    except (KeyError, TypeError, ValueError) as exc:
        return complete({"content": [...], "isError": True})
```

## 工具、资源还是 prompt
type: comparison
from: phases/13-tools-and-protocols/10-mcp-resources-and-prompts/docs/en.md

| 因素 | 工具 | 资源 | Prompt |
|---|---|---|---|
| 意图 | 执行操作 | 读取某个 URI 的内容 | 启动消息工作流 |
| 选择方 | 模型或应用 | 宿主、应用或用户 | 用户通过宿主 UI |
| 结果 | 结构化操作结果 | 文本或二进制内容 | Prompt 消息 |
| 方法 | `tools/list`, `tools/call` | `resources/list`, `resources/read` | `prompts/list`, `prompts/get` |
| 示例 | `delete_note` | `notes://note-1` | `review_note` |

## 提示
type: tips
from: phases/13-tools-and-protocols/07-building-an-mcp-server/docs/en.md, phases/13-tools-and-protocols/10-mcp-resources-and-prompts/docs/en.md, phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md, phases/19-capstone-projects/13-mcp-server-with-registry/docs/en.md, projects/memory-server/solution

- 用户数据用 `cacheScope: "private"`，密钥用 `ttlMs: 0`。
- 拒绝镜像 `password`、`secret`、`token` 或 `authorization` 的描述符。
- 限制请求 body 大小。memory 服务器超过 50000 字节返回 413。

## 课程中的缓存提示
type: defaults
span: 1
from: phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py, phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code/main.py, phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/code/main.py, phases/19-capstone-projects/13-mcp-server-with-registry/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `server/discover` ttl | 3_600_000 | 毫秒，`cacheScope` public |
| `tools/list` ttl | 60_000 | public。capstone 用 private |
| `resources/list` ttl | 10_000 | 第 07 课，private |
| `resources/read` ttl | 5_000 | 第 07 课，private |
| `prompts/list` ttl | 600_000 | 第 10 课，public |
| `cache_scope` | private | 第 07 课中 `complete()` 的默认值 |
| `notes_search` 的 `limit` | 10 | 1 到 50 的整数 |
| `MAX_TOOL_LIST_PAGES` | 100 | 第 28 课客户端分页上限 |

## 错误码
type: troubleshooting
from: phases/13-tools-and-protocols/07-building-an-mcp-server/docs/en.md, phases/13-tools-and-protocols/07-building-an-mcp-server/code/main.py, phases/13-tools-and-protocols/10-mcp-resources-and-prompts/docs/en.md, phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `-32700` Parse error | 该行不是 JSON | 每行发送一个 JSON 对象 |
| `-32600` Invalid Request | 没有 `jsonrpc` 2.0 或没有 method | 修正信封 |
| `-32602` invalid params | 缺少 `params._meta` | 每次都发送版本和 capabilities |
| `-32022` | 版本字符串不受支持 | 用 `supported` 中的版本重试 |
| `-32601` | 方法不在 `HANDLERS` 中 | 添加 handler 或修正名称 |
| `resources/read` 上的 `-32602` | URI 未知或无效 | 绝不返回空读取结果 |
| HTTP `400` 和 `-32020` | `Mcp-Param-*` header 与 body 不一致 | 在分发前拒绝 |
| 客户端解析失败 | 日志写到了 stdout | 把诊断写到 stderr |

## 工具契约
type: concepts
from: phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md, phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/code/main.py

- **inputSchema**：JSON Schema。没有 `$schema` 时，方言为 2020-12。
- **无参数**：`{"type": "object", "additionalProperties": false}`。
- **outputSchema**：可选。一旦发布，每个结果都要带符合 schema 的 `structuredContent`。
- **structuredContent**：任意 JSON 值。同时以文本块发送该 JSON。
- **内容块**：`text`、`image`、`audio`、`resource_link`、`resource`。
- **x-mcp-header**：把一个顶层参数镜像到 `Mcp-Param-{name}`。仅限字符串、整数或布尔值。
- **Header 编码**：非 ASCII 或有首尾空白的值使用 `=?base64?{Base64UTF8}?=`。
- **游标**：不透明。空的 `nextCursor` 也合法。只在 `None` 时停止。

## Memory 服务器项目
type: command-table
from: projects/memory-server/README.md, projects/memory-server/API.md, projects/memory-server/project.json, projects/memory-server/solution

| 命令 | 作用 |
|---|---|
| `project_test.py --init <workspace>` | 创建你的工作区。全新的 starter 会失败 |
| `project_test.py --all --path <workspace> --strict` | 为全部四个阶段评分 |
| `cli.ts --data-dir <dir> --put <file>` | 向 JSONL 日志追加修订 1 |
| `cli.ts --data-dir <dir> --query "<text>"` | 0.6 词法分加 0.4 余弦分 |
| `cli.ts --data-dir <dir> --history <id>` | 每个修订及其来源 |
| `--put <file> --revision 1` | 追加修订 2。修订 0 冲突 |
| `cli.ts --data-dir <dir> --serve --port 8788` | 同一存储上的 REST 和 MCP。需要 MEMORY_TOKEN |

## Capstone 策略闸门
type: architecture
from: phases/19-capstone-projects/13-mcp-server-with-registry/docs/en.md, phases/19-capstone-projects/13-mcp-server-with-registry/code/main.py

```arch
node | reg | 1,1 | Registry API | server.json | store
node | client | 2,1 | MCP client | server/discover, tools/list | client
node | gw | 3,1 | policy_decide | issuer, audience, scope | process
node | ro | 4,1 | Read-only replicas | no affinity | process
node | appr | 2,2 | Approval record | arguments_digest | store
node | rw | 3,2 | State-changing replicas | destructive tools | process
node | audit | 4,2 | Audit sink | redacted entries | store
edge | reg | client | remote URL
edge | client | gw | tools/call
edge | gw | ro | allow
edge | gw | rw | allow
edge | appr | rw | approval
edge | ro | audit |
edge | rw | audit |
```

## 问答
type: qa
from: phases/13-tools-and-protocols/07-building-an-mcp-server/docs/en.md, phases/13-tools-and-protocols/10-mcp-resources-and-prompts/docs/en.md, phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md, phases/19-capstone-projects/13-mcp-server-with-registry/docs/en.md, projects/memory-server/project.json

- **工具错误还是协议错误？** 有效调用失败返回 `isError: true`。坏信封返回 JSON-RPC 错误。
- **发现能解锁服务器吗？** 不能。`tools/list` 携带相同的请求元数据。
- **服务器能向客户端要输入吗？** 它返回 `input_required`。它从不发送自己的请求。
- **客户端如何得知资源变了？** 它打开 `subscriptions/listen`，然后再次调用 `resources/read`。
- **注解能授权吗？** 不能。`readOnlyHint` 和 `destructiveHint` 只是提示。
