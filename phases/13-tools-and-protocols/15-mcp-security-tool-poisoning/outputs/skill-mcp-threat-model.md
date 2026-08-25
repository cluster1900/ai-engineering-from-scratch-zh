---
name: mcp-threat-model
description: 对 MCP 2026-07-28 部署的元数据、路由、授权、MRTR 和兼容性边界进行威胁建模。
version: 2.0.0
phase: 13
lesson: 15
tags: [mcp, security, stateless, tool-poisoning, mrtr]
---

给定一个 MCP 部署，生成基于证据的威胁模型。假设任何 server、package、cache、registry entry 或 gateway route 都可能遭到入侵。

## 必需输入

- Client、gateway、server、authorization server 和 registry 的信任边界。
- 完整的规范化 tool descriptor 和已批准的 digest。
- 身份验证 principal、issuer、audience、scope 和 tool policy。
- 当前及旧版可接受的 protocol revision。
- MRTR operation、input schema、state protection 和 replay policy。
- Cache scope、TTL、subscription route 和 audit retention。

## 生成内容

1. Wire 验证。验证每个请求的 version 和 capability，然后在检查 version 支持情况之前验证 routing header 是否相等。对于不匹配，要求返回 HTTP 400 `-32020`；对于匹配但不受支持的 version，要求返回 HTTP 400 `-32022`，并包含准确的 supported 和 requested 数据；对于未知 method，要求返回 HTTP 404 `-32601`；对于已接受的 notification，要求返回 202 和空 body。
2. Descriptor 审查。报告 poisoning 指标、完整 descriptor 的 digest 变更、未知 tool，以及 schema 或 annotation 变更。
3. Namespace 映射。为每个 backend tool 提供一个限定的公开名称，并拒绝静默解决冲突。
4. 授权 Matrix。将经过身份验证的 principal 和 issuer 映射到 resource、tool、argument constraint 和 scope。不要使用 `clientInfo` 或 `serverInfo` 作为身份。
5. MRTR 审查。确认每个 `inputRequests` 条目都是受 client 声明的 capability 支持的完整Embedding式请求。将 `elicitation: {}` 视为隐式支持 form，将 `elicitation: {form: {}}` 视为显式支持 form。对于仅支持 URL 的 elicitation，使用 HTTP 400 `-32021` 和 `data.requiredCapabilities.elicitation.form` 拒绝。将受保护的 `requestState` 绑定到 method、tool、精确 argument、principal、purpose、expiry 和 nonce。在由每个 handler instance 共享、容量受限且按 TTL 清理的 replay store 中以原子方式消费 nonce 之前，按 key 匹配并验证每个 `inputResponses` 条目。
6. 风险轴审查。标记任何同时结合不可信输入、敏感数据和重大后果操作的自动步骤。
7. Cache 和 subscription 审查。确保依赖用户的结果为 private，并让长期运行的 notification 使用 `subscriptions/listen`。
8. 兼容性边界。将任何旧版 handshake、session、GET stream、server callback 或实验性 task 行为隔离在显式 version gating 之后。
9. Transport 边界。确定实现是完整的 HTTP adapter，还是进程内 protocol model。将 model 连接到第 09 课，以验证 JSON Content-Type 以及同时包含 JSON 和 SSE 的 Accept。
10. 修复顺序。给出杠杆效应最高的三项修复，以及对应 owner 和验收证据。

## 硬性拒绝项

- 静默覆盖 tool，或按照发现顺序选择 route。
- 未经人工或 policy 重新批准便更新 descriptor digest。
- 将自行报告的 client 或 server 信息视为身份验证。
- 将声明的 capability 视为权限。
- 对重大后果操作信任纯文本或未签名的 `requestState`。
- 将唯一的 replay ledger 保存在单个 gateway 或 server instance 内。
- 仅使用 `Mcp-Session-Id` 作为 rate limit 或 approval state 的 key。
- 将已弃用的 Sampling、Roots、Logging 或旧版 HTTP 加 SSE 作为新的实现路径。

## 输出格式

返回名为 Trust Boundaries、Wire Findings、Descriptor Findings、Route Map、Authorization Matrix、MRTR Findings、Compatibility Findings 和 Remediation 的章节。将已确认的证据与假设分开。最后给出当前跨越边界最多的单一攻击路径。
