---
name: elicitation-form-designer
description: Design explicit resource scope and stateless MCP 2026-07-28 elicitation with authorization, safe forms, and signed retry state.
version: 2.0.0
phase: 13
lesson: 12
tags: [mcp, elicitation, mrtr, scope, authorization]
---

为面向协议修订版 `2026-07-28` 的 MCP 操作设计用户输入步骤。

请给出：

1. 范围契约。在可见的工具参数或服务器配置中明确工作区、目录或资源 URI。说明哪些已认证主体可以使用它。
2. 边界检查。定义 URI 规范化、基于路径组件的包含关系检查、符号链接策略和操作系统沙箱。
3. 触发条件。明确指出哪种歧义、确认需求或外部交互需要用户输入。
4. 发现与能力门禁。通过 `server/discover` 返回准确的 `supportedVersions`、能力、`ttlMs` 和 `cacheScope`。如果声明工具能力，还须提供确定性的 `tools/list` 描述符，包含有效的对象类型 `inputSchema`、服务器身份元数据和缓存提示。将 `elicitation: {}` 和显式的 `elicitation.form` 都视为支持表单。缺少能力或仅支持 URL 时，以 `-32021` 和 `data.requiredCapabilities.elicitation.form` 拒绝；版本不受支持时，使用 `-32022` 并提供准确的 `supported` 和 `requested` 数据。
5. MRTR 结果。返回 `resultType: "input_required"`，包含稳定的 `inputRequests` 键和 `elicitation/create` 请求。
6. 交互设计。表单模式提供纯文本消息和受限的扁平模式；URL 模式展示 HTTPS 目标地址及带外完成规则。
7. 重试契约。要求使用新的 JSON-RPC ID、原方法和参数、当前的 `inputResponses`、逐请求 `_meta`，并原样回传 `requestState`。
   没有 ID 的通知绝不能收到 JSON-RPC 结果或错误；已接受的 Streamable HTTP 通知返回无响应体的 `202`。
8. 分支处理。将 `accept`、`decline` 和 `cancel` 分别映射到不同的安全结果。
9. 状态保护。将 HMAC 或认证加密绑定到已认证主体、原参数摘要、候选集合、操作阶段、有效期和一次性 nonce。使用所有处理器实例共享、容量受限且按 TTL 清理的重放存储，以原子方式消耗 nonce。
10. 最终复核。在执行修改前，立即重新检查授权、记录的实时状态和包含关系。

必须否决：

- 将已弃用的 Roots 视为授权、路径边界约束或沙箱机制。
- 在新的 `2026-07-28` 设计中使用 `roots/list` 或 `notifications/roots/list_changed`。
- 发送反向 `elicitation/create` 请求，而不是通过 MRTR 返回该请求。
- 在表单模式中收集密码、API 密钥、访问令牌或支付凭据。
- 发送当前逐请求能力中未声明的 elicitation 模式。
- 将 `clientInfo` 视为已认证的用户身份。
- 在有效接受和最终授权检查之前执行破坏性操作。
- 使用携带候选项或权限相关数据的未签名 `requestState`。

拒绝规则：

- 用户明确拒绝后，不再重复提示。
- 对服务器可自行推导或验证的值，不请求用户补充。
- 拒绝包含凭据、用户秘密或预先授权的持有者值的 URL。
- 拒绝使用隐藏协议会话状态、`initialize` 或 `Mcp-Session-Id` 的请求。

输出一页设计，涵盖范围、授权、边界约束、交互模式、模式或 URL、MRTR 消息结构、状态字段、响应分支、重放策略和最终复核清单。
