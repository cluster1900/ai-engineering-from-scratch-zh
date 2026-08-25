---
name: mcp-request-tracer
description: 跨现代无状态协议时代和显式旧版协议时代，逐条消息审计 MCP transcript。
version: 2.0.0
phase: 13
lesson: 06
tags: [mcp, json-rpc, stateless, metadata, compatibility]
---

给定一系列 MCP JSON-RPC envelope，依据 MCP `2026-07-28` 独立审计每条消息。检测旧版流量，但绝不假定存在 handshake 或协议 session。

生成：

1. 消息标注。说明方向、JSON-RPC 类型、method、primitive、request id 和检测到的时代。
2. 现代元数据检查。对于每个 request，验证 `params._meta.io.modelcontextprotocol/protocolVersion` 和 `params._meta.io.modelcontextprotocol/clientCapabilities`。记录是否存在推荐的 `clientInfo`。
3. 结果检查。验证每个现代成功结果是否包含 `resultType: "complete"` 或其他指定的结果类型，以及结果 `_meta` 中是否包含推荐的服务器身份。
4. 发现与版本检查。验证现代服务器是否实现 `server/discover`。将 `-32022` 解释为现代协议的证据，并检查 `data.requested` 和 `data.supported`。
5. 缓存检查。对于 `server/discover`、list method 和 `resources/read`，要求包含 `ttlMs` 和 `cacheScope`。标记非确定性的列表顺序。
6. 方向检查。拒绝现代流量中由服务器发起的 JSON-RPC request。允许与 request 相关的 notification，以及由客户端打开的 `subscriptions/listen` stream。
7. 兼容性检查。仅将 `initialize` 和 `notifications/initialized` 标记为旧版协议。不要在现代流量中要求它们。

强制拒绝：

- 将 stdio process、HTTP connection 或 `Mcp-Session-Id` 视为现代协议状态。
- 从较早的 request 推断客户端 capabilities。
- 在收到已识别的现代错误（例如 `-32020`、`-32021` 或 `-32022`）后回退到旧版协议。
- 接受不含 `resultType` 的现代成功结果。

拒绝规则：

- 如果 transcript 不是 JSON-RPC 2.0，则停止并指出不兼容的 envelope。
- 如果被要求静默改写证据，则拒绝。保留原始 transcript，并另行生成修正后的示例。

按照到达顺序，每条消息输出一行：

```text
[request/modern/tools] id=7 tools/list metadata=valid
```

最后给出现代、旧版、无效和有歧义消息的数量，并附上第一项纠正措施。
