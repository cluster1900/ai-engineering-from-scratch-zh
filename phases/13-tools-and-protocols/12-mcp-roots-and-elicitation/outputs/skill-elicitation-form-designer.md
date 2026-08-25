---
name: elicitation-form-designer
description: 为 MCP 2026-07-28 elicitation 设计显式资源范围和无状态流程，包括授权、安全表单和签名重试状态。
version: 2.0.0
phase: 13
lesson: 12
tags: [mcp, elicitation, mrtr, scope, authorization]
---

为面向协议修订版 `2026-07-28` 的 MCP 操作设计一个用户输入步骤。

产出：

1. 范围契约。将 workspace、目录或资源 URI 放入可见的 Tool 参数或 server 配置中。说明哪些已认证主体可以使用它。
2. 边界检查。定义 URI 规范化、路径组件包含关系、符号链接策略和操作系统 sandbox。
3. 触发条件。明确指出需要用户输入的确切歧义、确认事项或外部交互。
4. 发现和能力门控。从 `server/discover` 返回准确的 `supportedVersions`、capabilities、`ttlMs` 和 `cacheScope`。如果通告了 Tools，则包含强制且确定性的 `tools/list` 描述符，其中具有有效的 object `inputSchema`、server 身份元数据和 cache 提示。将 `elicitation: {}` 和显式的 `elicitation.form` 视为支持表单。对于缺失支持或仅支持 URL 的情况，使用 `-32021` 和 `data.requiredCapabilities.elicitation.form` 拒绝；对于不受支持的版本，使用 `-32022`，并提供准确的 `supported` 和 `requested` 数据。
5. MRTR 结果。返回 `resultType: "input_required"`，其中包含稳定的 `inputRequests` key 和 `elicitation/create` 请求。
6. 交互设计。对于表单模式，提供简明消息和受限的扁平 schema。对于 URL 模式，显示 HTTPS 目标地址和带外完成规则。
7. 重试契约。要求使用新的 JSON-RPC id、原始 method 和 arguments、当前 `inputResponses`、每个请求的 `_meta`，并准确回显 `requestState`。
   无 id 的 notification 永远不会收到 JSON-RPC result 或 error；已接受的 Streamable HTTP notification 会收到无响应体的 `202`。
8. 分支处理。将 `accept`、`decline` 和 `cancel` 映射到不同的安全结果。
9. 状态保护。使用 HMAC 或认证加密，将状态绑定到已认证主体、原始参数摘要、候选集合、操作阶段、过期时间和一次性 nonce。在由每个 handler 实例共享、有界且按 TTL 清理的 replay store 中，以原子方式消费 nonce。
10. 最终重新验证。在执行变更之前，立即重新检查授权、实时记录状态和包含关系。

硬性拒绝条件：

- 将已弃用的 Roots 视为授权、包含关系或 sandboxing。
- 在新的 2026-07-28 设计中使用 `roots/list` 或 `notifications/roots/list_changed`。
- 发送反向 `elicitation/create` 请求，而不是通过 MRTR 返回它。
- 在表单模式下收集密码、API key、access token 或支付凭证。
- 发送当前每请求 capabilities 中不存在的 elicitation 模式。
- 将 `clientInfo` 视为已认证的用户身份。
- 在经过验证的接受操作和最终授权检查之前执行破坏性操作。
- 使用未签名的 `requestState` 携带候选项或权限相关数据。

拒绝规则：

- 用户明确拒绝后，拒绝重复提示。
- 如果 server 可以在没有用户参与的情况下推导或验证某个值，则拒绝为该值发起 elicitation。
- 拒绝包含凭证、用户 secret 或预认证 bearer 值的 URL。
- 拒绝使用隐藏协议会话状态、`initialize` 或 `Mcp-Session-Id` 的请求。

输出一页设计，涵盖范围、授权、包含关系、交互模式、schema 或 URL、MRTR wire 结构、状态字段、响应分支、replay 策略和最终重新验证 checklist。
