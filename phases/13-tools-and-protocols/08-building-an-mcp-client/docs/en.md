# 构建 MCP Client：发现、路由与双时代回退

> 现代 MCP client 会在每个请求中重复其契约。最困难的兼容性决策，是判断旧 server 是否真的旧，以及现代 server 是否只是在报告一个可修正的错误。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lesson 07
**Time:** ~85 分钟

## 学习目标

- 使用当前元数据构建每个 MCP `2026-07-28` 请求。
- 使用 `server/discover` 探测 stdio server，并选择双方都支持的版本。
- 仅为明确列入 allowlist 的 peer 授权一次有界的旧版探测。
- 只有在验证受支持版本的正向 `initialize` 结果后，才接受旧版时代。
- 合并确定性的 Tool 列表，且不静默覆盖冲突。
- 将调用路由到拥有相应 Tool 的 peer，且不虚构协议会话。

## 问题

一个 Agent host 通常会与多个 MCP server 通信。它必须发现每个 server、合并 Tool 目录、解决重名问题、路由调用，并从传输故障中恢复。

`2026-07-28` 版本让稳态操作更简单，因为每个请求都是自包含的。兼容性则使启动过程更加微妙。Client 可能遇到：

- 支持首选版本的现代 server；
- 返回已知版本或 header 错误的现代 server；
- 从未听说过 `server/discover` 的旧版 server；
- 在收到 `initialize` 之前始终保持静默的旧版 server。

将每个探测错误都视为旧版是危险的。格式错误的现代请求、过载的 server、已终止的进程和旧 server，都可能产生相同的超时或连接关闭。这些信号具有歧义。Client 在选择旧版时代之前，必须将明确的操作者意图与正向协议证据结合起来。

## 概念

### Peer，而非协议会话

为每个 server 进程或 endpoint 保留一条传输 peer 记录：

- 传输句柄或发送函数；
- 已选择的协议时代和版本；
- 最近发现的 server capabilities；
- 最近一次确定性的 Tool 列表；
- 用于关联的待处理请求 id；
- 传输健康状态。

这是 client 端的记录管理，并非协议会话状态。在现代 MCP 中，server 仍会在每个请求中接收当前版本和 capabilities。

### 从头构建每个现代请求

```python
def modern_request(request_id, method, params, version, capabilities):
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": {
            **params,
            "_meta": {
                "io.modelcontextprotocol/protocolVersion": version,
                "io.modelcontextprotocol/clientCapabilities": capabilities,
                "io.modelcontextprotocol/clientInfo": CLIENT_INFO,
            },
        },
    }
```

不要只把元数据附加到连接对象一次，然后假定它已到达线路。应在最终序列化的请求上加盖元数据并进行检查。

### 现代发现

`server/discover` 返回支持的版本、server capabilities、instructions、缓存提示和推荐的 server identity。Client 选择双方共同支持的最高现代版本。

对于仅支持现代版本的 client，发现是可选的，但建议在 stdio 上使用。一些旧版 server 会在初始化前接受某项操作，因此先发送 `tools/list` 可能产生有歧义的成功结果。`server/discover` 能建立清晰的时代边界。

### stdio 兼容性探测

双时代 stdio client 会先发送带有首选现代元数据的 `server/discover`，之后才发送任何其他请求。结果分为三类：

1. **DiscoverResult。** Server 是现代版本。选择双方都支持的版本，然后继续使用逐请求元数据。
2. **已知的现代错误。** Server 是现代版本。对于 `-32022`，从 `data.supported` 中选择版本，并使用新的请求 id 重试。对于 header 或 capability 错误，应修正请求。不要发送 `initialize`。
3. **歧义信号。** 未知的 JSON-RPC 错误、超时、连接关闭或空响应均无法确定时代。除非已为该特定 peer 配置旧版兼容性，否则应以关闭方式失败。

已知的现代协议错误包括：

- `-32020` HeaderMismatch
- `-32021` MissingRequiredClientCapability
- `-32022` UnsupportedProtocolVersion

即使 peer 位于旧版 allowlist 中，已知的现代错误仍然属于现代时代。一旦 server 证明它理解现代错误词汇，再发送 `initialize` 就属于降级。

不要将 `-32601` 当作正向旧版证据。它只会让明确列入 allowlist 的 peer 获得一次旧版探测资格。同样的规则也适用于超时、连接关闭或空响应。

### Allowlist 是操作者意图，而非证据

旧版兼容性必须是某一条固定 peer 配置的明确属性：

```python
client.add_server("archive", archive_transport, allow_legacy=True)
```

将该选择绑定到配置的命令或 endpoint。不要使用会让任意 server 自行选择较弱语义的通配符。未设置 `allow_legacy=True` 的 peer 会在出现有歧义的发现结果后失败，并且永远不会收到 `initialize`。

Allowlist 授予探测权限，但不会选择时代。Client 会在传输层强制执行的截止时间内发送一次 `initialize`，然后要求满足以下所有条件：

- JSON-RPC `2.0` 响应的请求 id 匹配；
- 只包含一个 `result`，且不包含 `error`；
- `protocolVersion` 位于 client 配置的旧版版本集合中；
- `capabilities` 字段的值是 object；
- `serverInfo` 是 object，且 `name` 和 `version` 字段均为非空字符串。

超时、连接关闭、错误响应、格式错误的结果、不匹配的 id 或不受支持的版本，都会以关闭方式失败。只有结构有效的正向结果才能选择旧版时代。代码会将 `legacy_probe_timeout_ms` 传给传输适配器；真正的 stdio 或 HTTP 适配器必须强制执行该截止时间，而不能只是记录它。

为传输 peer 缓存所选时代。不要在每次调用前重新探测。

### 旧版是兼容性分支

一旦有界探测返回有效的正向旧版证据，client 就会严格按照该版本的定义使用所选旧版版本：

1. 验证响应 envelope 和 correlation id。
2. 验证协商的版本位于配置的旧版集合中。
3. 记录经过验证的 capabilities 和 server identity。
4. 仅在所有检查都通过后发送 `notifications/initialized`。
5. 在该传输生命周期内使用旧版请求结构。

该分支用于与已知 peer 互操作。它不是新 server 或新请求的默认设计。如果传输重启或其 endpoint 发生变化，请丢弃 peer 时代缓存并重新协商。

### 发现并缓存 Tools

对每个活跃 peer 调用 `tools/list`。现代结果包含 `resultType`、`ttlMs` 和 `cacheScope`。在正确的授权 Context 中遵循新鲜度提示。过期后或收到已订阅的列表变更事件后重新获取。

Client 必须将旧版 server 中缺失的 `resultType` 视为 `"complete"`。不要要求较早协商时代的响应包含现代缓存字段。

Server 应返回确定性顺序。Client 也应该在合并前排序，使本地注册表顺序不依赖进程启动时序。

### 冲突安全的命名空间合并

两个 server 可能都暴露 `search`。请选择一项明确声明的策略：

1. **冲突时添加前缀。** 保留第一个规范名称，并将之后的冲突项暴露为 `<server>/<tool>`。
2. **冲突时拒绝。** 不加载重复项，并显示明确的配置错误。
3. **静默覆盖。** 绝不要使用这种方式。它会隐藏 Model 选择的操作最终被发送到哪个 server。

同时存储规范名称和本地名称。Model 看到的是规范名称。发出的 `tools/call` 使用拥有该 Tool 的 server 所声明的本地名称。

### 路由调用

路由是一次纯查找：

```text
规范 Tool 名称
  -> peer 名称 + 本地 Tool 名称
  -> 新的 JSON-RPC 请求 id
  -> 现代请求元数据或明确的旧版结构
  -> 匹配的响应 id
```

当 Tool 所属的传输不可用时，不要发送调用。重新连接或重启传输，然后重新运行发现和 `tools/list`。如果操作的安全策略允许，可以使用新的 JSON-RPC id 重试因传输中断而丢失的现代进行中请求。

### 通知与订阅

现代列表和 resource 变更仅通过 client 打开的 `subscriptions/listen` 流到达。Client 发送通知过滤器，等待 `notifications/subscriptions/acknowledged`，并通过通知元数据中的 listen 请求 id 关联事件。

断开连接后，使用新的请求 id 发起新的 listen 请求，并重新获取相关列表或 resources。现代流不会使用 `Last-Event-ID` 恢复。

### 不允许 server 发起请求

现代 server 不会针对 sampling、elicitation 或 roots 向 client 发起独立的 JSON-RPC 请求。它们会返回 `input_required`，client 在满足Embedding的输入请求后重试原始请求。

满足输入请求时，不要阻塞 peer 的响应读取器。保留关联信息，并为重试创建新的 JSON-RPC id。

```figure
tp-client-merge
```

## 使用它

`code/main.py` 使用进程内 peer 函数，使协议决策保持可见。它连接两个现代 peer 和一个有意列入 allowlist 的旧版 peer，然后合并并路由它们的 Tools。传输 callable 会接收超时预算，因此兼容性分支无法隐藏无界探测。

```bash
cd code
python3 main.py
python3 -m unittest discover tests -v
```

测试证明了普通演示容易遗漏的边界：

- 现代请求会重复元数据；
- `-32022` 会重试现代发现，而不会执行初始化；
- 已知的现代错误绝不会降级，即使 peer 位于 allowlist 中；
- 如果没有 allowlist，超时、连接关闭、空响应和未知错误不会触发 `initialize`；
- 只有在返回有效且受支持的 `initialize` 结果后，列入 allowlist 的 peer 才会变为旧版；
- 格式错误或不受支持的旧版结果会使 peer 保持不可用；
- 成功选择的时代会在传输生命周期内缓存。

## 交付它

本课程交付 `outputs/skill-mcp-client-harness.md`。它为现代请求元数据加盖、stdio 时代协商、确定性命名空间合并、路由，以及以关闭方式失败的旧版兼容性分支搭建脚手架。

## 练习

1. 让一个虚假 server 返回 `-32022`，且不提供双方共同支持的版本。确认 client 会失败，而不是发送 `initialize`。
2. 将一个虚假旧版 server 加入 allowlist，让其有界 `initialize` 探测超时，并证明 peer 会保持 `unknown` 且不可用。
3. 为两个授权 Context 添加 `cacheScope: "private"` 的 Tool 列表。确认 client 绝不会与另一个 Context 共享某个 Context 的缓存结果。
4. 将冲突策略改为拒绝，并让启动过程失败，同时在错误中包含两个 peer 名称。
5. 添加一个有限的 `subscriptions/listen` 模拟器。流丢失后，使用新的请求 id 重新 listen，并重新获取 Tools。

## 关键术语

| 术语 | 含义 |
|------|---------|
| Peer | Client 端针对单个 server 传输及其发现数据的记录 |
| 协议时代 | 现代逐请求元数据语义或旧版初始化语义 |
| 发现探测 | 用于识别 stdio 时代的初始 `server/discover` |
| 已知的现代错误 | 能证明现代行为并禁止旧版回退的错误 |
| 旧版 allowlist | 允许对固定 peer 执行一次有界兼容性探测的操作者配置 |
| 正向旧版证据 | 针对明确支持的旧版版本返回的、有效且已关联的 `initialize` 结果 |
| 合并后的命名空间 | 所有活跃 peer 之间的规范 Tool 名称 |
| 冲突策略 | 针对重复 Tool 名称添加前缀或拒绝的规则 |
| 时代缓存 | 为单个传输 peer 存储的现代或旧版行为选择 |
| 传输恢复 | 重启或重新连接、重新发现、重新列出，并使用新 id 安全重试 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
