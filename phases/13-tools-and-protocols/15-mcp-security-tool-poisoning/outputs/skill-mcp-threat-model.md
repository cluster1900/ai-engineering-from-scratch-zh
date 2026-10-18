---
name: mcp-threat-model
description: Threat-model an MCP 2026-07-28 deployment across metadata, routing, authorization, MRTR, and compatibility boundaries.
version: 2.0.0
phase: 13
lesson: 15
tags: [mcp, security, stateless, tool-poisoning, mrtr]
---

针对给定的 MCP 部署，建立以证据为依据的威胁模型。假设任意服务器、软件包、缓存、注册表条目或网关路由都可能被攻陷。

<a id="required-inputs"></a>

## 必需输入

- 客户端、网关、服务器、授权服务器和注册表的信任边界。
- 完整且经过规范化的工具描述符，以及已批准的摘要。
- 认证主体、签发者、受众、权限范围和工具策略。
- 接受的当前与旧版协议修订版。
- MRTR 操作、输入模式、状态保护及重放策略。
- 缓存作用域、TTL、订阅路由和审计保留期限。

<a id="produce"></a>

## 交付内容

1. 消息验证。验证逐请求版本和能力，然后在检查版本支持之前核对路由请求头是否一致。不匹配时必须返回 HTTP 400 `-32020`；匹配但不支持的版本返回 HTTP 400 `-32022`，并提供准确的支持版本与请求版本数据；未知方法返回 HTTP 404 `-32601`；已接受的通知返回空响应体的 202。
2. 描述符审查。报告投毒迹象、完整描述符摘要变化、未知工具，以及模式或注解的变化。
3. 命名空间映射。为每个后端工具给出一个带限定前缀的公开名称，拒绝静默解决命名冲突。
4. 授权矩阵。将已认证主体和签发者映射到资源、工具、参数约束及权限范围。不要将 `clientInfo` 或 `serverInfo` 用作身份。
5. MRTR 审查。确认每个 `inputRequests` 条目都是完整的嵌入请求，且客户端声明的能力支持它。将 `elicitation: {}` 视为隐式表单支持，将 `elicitation: {form: {}}` 视为显式表单支持。仅支持 URL 的 elicitation 应被拒绝，返回 HTTP 400 `-32021` 和 `data.requiredCapabilities.elicitation.form`。将受保护的 `requestState` 绑定到方法、工具、准确参数、主体、目的、有效期和 nonce。先按键匹配并验证每个 `inputResponses` 条目，再在所有处理器实例共享、容量受限且按 TTL 清理的重放存储中原子消耗 nonce。
6. 风险维度审查。标记同时结合不可信输入、敏感数据和具有重要后果的操作的所有自动步骤。
7. 缓存与订阅审查。确保依赖用户身份的结果保持私有，长连接通知使用 `subscriptions/listen`。
8. 兼容性边界。将旧版握手、会话、GET 流、服务器回调或实验性任务行为隔离在显式的版本门禁之后。
9. 传输边界。指出实现是完整 HTTP 适配器还是进程内协议模型。将模型接入第 09 课，执行 JSON Content-Type 及同时包含 JSON 和 SSE 的 Accept 验证。
10. 修复顺序。给出收益最高的三项修复，注明负责人和验收证据。

<a id="hard-rejects"></a>

## 必须否决

- 静默覆盖工具，或根据发现顺序选择路由。
- 未经人工或策略重新批准就更新描述符摘要。
- 将客户端或服务器自行报告的信息视为认证。
- 将声明的能力视为权限。
- 在具有重要后果的操作中信任明文或未签名的 `requestState`。
- 将唯一的重放台账保存在单个网关或服务器实例内。
- 仅以 `Mcp-Session-Id` 作为限流或审批状态的键。
- 将已弃用的 Sampling、Roots、Logging 或旧版 HTTP 加 SSE 作为新实现路线。

<a id="output-format"></a>

## 输出格式

返回以下章节：信任边界、消息发现、描述符发现、路由映射、授权矩阵、MRTR 发现、兼容性发现、修复措施。区分已确认的证据与假设。最后指出当前跨越边界最多的一条攻击路径。
