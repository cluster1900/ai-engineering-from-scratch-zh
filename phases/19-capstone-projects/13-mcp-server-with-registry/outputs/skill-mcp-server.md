---
name: mcp-server-platform
description: 设计一个无状态 MCP 2026-07-28 服务器，并提供 Registry 元数据、实时发现、授权、策略、审计和扩展性证据。
version: 2.0.0
phase: 19
lesson: 13
tags: [capstone, mcp, stateless, streamable-http, oauth, registry, governance]
---

给定内部平台需求，设计一个以 protocol 修订版 `2026-07-28` 为目标的无状态 MCP 服务器及治理边界。

构建计划：

1. 创建 schema 有效的 `server.json`，其反向 DNS 名称与发布者通过身份验证的 namespace 匹配。
2. 强制实现 `server/discover`，用于获取实时版本、能力、扩展和服务器身份。
3. 每个请求的 `_meta` 中包含版本和客户端能力；每个结果中包含 `resultType` 和服务器身份。
4. 实现包含 `ttlMs` 和 `cacheScope` 的确定性 `tools/list`。
5. 实现仅支持 POST 的 Streamable HTTP，并包含必需的版本、method 和名称 header；不使用 protocol session、GET stream、session DELETE 或 replay header。
6. 在每次调用中验证 issuer、audience、expiry 和 scope 的授权机制。
7. 针对 actor、Tool、目标和规范化参数执行策略。将高风险审批绑定到确切操作和 expiry，然后证明修改一个参数会导致 replay 被拒绝。
8. 在 Model 可见 Context 之外提供脱敏审计和 trace 证据。
9. 实现一个 Registry adapter，用于验证 `server.json`、探测 `server/discover`，并报告元数据与运行时之间的 drift。
10. 使用两个可互换的副本，以及不依赖 session affinity 的并发负载探针。

评分标准：

| 权重 | 标准 | 衡量方式 |
|:-:|---|---|
| 25 | Protocol 正确性 | 无状态封装、发现、结果、header 和 negative 用例 |
| 20 | 授权 | issuer、audience、expiry、scope 和确切操作审批用例 |
| 15 | Registry 完整性 | 有效的 `server.json`、实时探针和 drift 报告 |
| 15 | 策略和安全性 | 允许、拒绝、格式错误、过期审批和敏感数据用例 |
| 15 | 扩展性 | 两个不依赖 affinity 的副本，以及取消和恢复 |
| 10 | 可审计性 | 接收端脱敏审计和 trace 证据 |

硬性拒绝条件：

- 当前 MCP 设计使用 `initialize`、`notifications/initialized` 或 `Mcp-Session-Id`。
- 将 `server.json` 视为实时能力发现机制，或虚构 `.well-known/mcp-capabilities` 作为 MCP 要求。
- 发布的服务器名称不属于为该发布者完成身份验证的 namespace。
- 接受未验证 issuer 和 audience 或 resource 的 Token。
- 将 Tool annotation 或聊天审批视为授权。
- 审计记录持久化 secret 或原始敏感数据。

拒绝规则：

- 拒绝仅凭本地模拟宣称系统已达到生产就绪状态。
- 拒绝公开缺少策略和绑定具体操作的审批证据的状态变更 Tool。
- 拒绝发布指向无法验证实时发现结果的 endpoint 的元数据。

输出：一份构建计划和证据 Matrix，覆盖发布元数据、实时发现、无状态 transport、Tool schema、授权、策略、审批、审计和扩展性。最后指出风险最高的边界，以及能够证明该边界以关闭方式失败的确切故障测试。
