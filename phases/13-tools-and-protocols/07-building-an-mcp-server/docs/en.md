# 构建 MCP 服务器：无状态 Python 与 TypeScript

> 现代 MCP 服务器不会记住 handshake。它会验证每个请求的元数据，运行一个 handler，并返回一个带类型的结果。

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 13, Lesson 06
**Time:** 约 85 分钟

## 学习目标

- 为 MCP `2026-07-28` 实现强制性的 `server/discover`。
- 验证每个请求的协议版本和客户端 capabilities。
- 以确定性的列表顺序公开 Tool、Resource 和 Prompt。
- 在正确的结果中返回 `resultType`、服务器身份和缓存提示。
- 通过 newline-delimited stdio，在 Python 和 TypeScript 中提供相同的无状态契约。

## 问题

在收到第一条消息后存储客户端 capabilities 的服务器很容易构建，却很难运维。同一个 process 可能依次服务多个客户端。远程请求可能落到不同的 worker 上。过期的 capability 声明可能导致行为跨授权边界泄漏。

MCP `2026-07-28` 通过让每个请求都具备自描述性，解决了这个问题中与协议有关的部分。你的应用仍然可以保存持久笔记、job 或显式状态 handle。但它不能保留会改变后续请求解码方式的隐藏协议状态。

本课将构建两个版本的笔记服务器。Python 和 TypeScript 版本的协议核心都只使用各自的标准库。两者公开相同的 method，并执行相同的 wire contract。

## 概念

### 现代 dispatch loop

```text
读取一行 JSON-RPC
解析 envelope
如果它是 notification，则不响应
验证此请求的 params._meta
根据 method 路由
使用 resultType 和 serverInfo 包装成功结果
写入一行 JSON-RPC 响应
忘记请求范围内的元数据
```

仍需注意三条 stdio 规则：

- 只向 stdout 写入 JSON-RPC 消息。将诊断信息发送到 stderr。
- 使用换行符分隔消息，并在每次响应后执行 flush。
- 当 stdin 到达 EOF 时立即退出。

process 的生命周期是 transport 的生命周期。它不是现代 MCP session。

### 请求验证

每个请求必须包含：

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

前两个字段是必需的。建议提供 `clientInfo`。验证已提供身份信息的结构，但不要将它视为身份认证。

如果版本不受支持，则返回代码 `-32022`，并包含 `requested` 和 `supported`。缺少请求元数据属于无效参数，代码为 `-32602`。绝不要使用先前调用中的值填充缺失字段。

### 强制发现

现代服务器必须实现 `server/discover`。完整的发现结果包括支持的现代版本、capabilities、可选说明、缓存提示，以及结果 `_meta` 中的服务器身份：

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

发现操作不会解锁服务器。客户端可以在不调用发现操作的情况下调用 `tools/list`，因为 `tools/list` 已携带相同的请求元数据。

### Tools

`tools/list` 返回确定性的 Tool descriptor 列表。稳定的排序可以改善响应缓存，并保持 Model Context 稳定。该结果还必须包含 `ttlMs` 和 `cacheScope`。

`tools/call` 返回 content block 和 `isError`。当协议 envelope 或 method 参数无效时，使用 JSON-RPC 错误。当有效的 Tool 调用已经运行，但 Tool 本身执行失败时，使用 `isError: true`。

Tool annotation 仍然只是提示，而不是强制机制：

- `readOnlyHint`
- `destructiveHint`
- `idempotentHint`
- `openWorldHint`

host 应使用它们来进行确认和展示。服务器仍然必须执行真正的授权检查。

### Resources

`resources/list` 返回稳定的 URI descriptor。`resources/read` 返回带类型的内容。两者在 `2026-07-28` 中均可缓存，因此都包含 `ttlMs` 和 `cacheScope`。

对于用户特定的笔记数据，使用 `cacheScope: "private"`。共享缓存不得跨授权 Context 复用私有响应。

现代变更传递不使用 `resources/subscribe`。客户端打开 `subscriptions/listen`，并请求 `resourceSubscriptions` 或列表变更类别。Lesson 10 将构建这一流程。

### Prompts

`prompts/list` 可缓存且具有确定性。`prompts/get` 使用参数渲染指定的 Prompt。渲染后的 Prompt 结果是完整的，但它并不属于需要缓存提示的可缓存列表或读取结果。

### 每个成功结果都有类型

示例为每个成功结果使用同一个 wrapper：

```python
def complete(payload):
    return {
        "resultType": "complete",
        **payload,
        "_meta": {SERVER_INFO_KEY: SERVER_INFO},
    }
```

列表、读取和发现 handler 会添加 `ttlMs` 与 `cacheScope`。集中使用这个 wrapper，可以防止某个 handler 静默遗漏现代结果字段。

### 不允许服务器发起请求

现代服务器可以发送与客户端请求相关的 notification，也可以在客户端打开的 `subscriptions/listen` stream 上发送 notification。但它不得发送自己的 JSON-RPC request。

当 handler 需要 sampling、elicitation 或 roots 输入时，它会返回 `input_required` 结果。客户端完成其中Embedding的输入请求，然后使用新的 request id 重试原始 method。Lesson 11 将介绍这种 Multi Round-Trip Request 模式。

### 显式旧版兼容性

双时代服务器还可以在明确隔离的旧版分支中实现 `2025-11-25` handshake。当请求中存在必需的现代 `_meta` 字段时，它选择现代行为；当收到 `initialize` 时，它选择旧版行为。

不要让 `2026-07-28` 请求经过旧版 handshake 路径。不要在旧版初始化结果中加入现代 `resultType` 字段。本课代码特意只支持现代协议，以便清晰呈现其不变量。

```figure
t3-dispatch-loop
```

## 使用它

运行 Python 服务器的有限 demo 和测试：

```bash
cd code
python3 main.py --demo
python3 -m unittest discover tests -v
```

使用 TypeScript runner 运行 TypeScript 移植版本：

```bash
npx tsx main.ts --demo
```

demo 会发送 `server/discover`、列出每种 primitive、调用 Tool，并展示不支持版本的错误。每个现代请求都会重复携带元数据。每个成功结果都包含服务器身份。

## 交付它

本课交付 `outputs/skill-mcp-server-scaffolder.md`。它会生成一个现代服务器方案，其中包含发现契约、逐请求验证、确定性的可缓存列表，以及可选的隔离式旧版 adapter。

## 练习

1. 从一个请求中移除 capabilities，并证明服务器不会复用上一个请求的声明。
2. 反转 `TOOLS`、`PROMPTS` 和笔记的插入顺序。确认所有列表结果仍保持稳定。
3. 添加一个破坏性的 `notes_delete` Tool，并要求在 executor 内部进行授权检查。仅将 `destructiveHint` 保留为 UX 提示。
4. 添加带有 `ttlMs`、`cacheScope` 和确定性排序的 `resources/templates/list`。
5. 为 `2025-11-25` 构建一个独立的旧版 adapter。添加测试，证明现代请求绝不会进入该 adapter。

## 关键术语

| 术语 | 含义 |
|------|---------|
| 无状态服务器 | 根据每个请求自身的元数据处理该请求，无需协议 session memory |
| `server/discover` | 公布版本和 capabilities 的强制性现代 method |
| 完整结果 | 带有 `resultType: "complete"` 的现代成功结果 |
| 可缓存结果 | 带有 `ttlMs` 和 `cacheScope` 的发现、列表或 Resource 读取结果 |
| 确定性列表 | 相同的逻辑 registry 会生成相同的项目顺序 |
| 服务器身份 | 结果 `_meta` 中推荐的 `io.modelcontextprotocol/serverInfo` |
| Tool 错误 | 有效的 Tool 调用返回包含 `isError: true` 的内容 |
| 协议错误 | 通过 `error` 返回的无效 JSON-RPC 或 MCP 请求 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
