---
name: gateway-bootstrap
description: 设计一个无状态 MCP 2026-07-28 网关，涵盖 Registry 准入、策略、路由和兼容性边界。
version: 2.0.0
phase: 13
lesson: 17
tags: [mcp, gateway, stateless, registry, rbac, subscriptions, tasks]
---

给定客户端、后端、授权要求和合规约束，产出一份网关设计。

## 必需输入

- 公共网关 resource URI、接受的协议修订版本和传输方式。
- 已认证的 principal 和角色 Model。
- 后端端点、issuer、resource、Registry 记录、发布者证据和已批准的描述符。
- Tool 可见性、参数策略、成本类别和数据敏感度。
- 流式传输、变更通知、MRTR 和 Tasks 要求。
- 审计、保留、追踪和脱敏要求。

## 产出内容

1. 无状态入口。使用一个 POST 端点、逐请求版本与 capabilities、相互匹配的 method 和 name header、JSON 或请求范围的 SSE，并对现代 GET 和 DELETE 返回 405。在检查版本支持之前验证 header 是否相等。明确 HTTP 400 `-32020`、携带准确 supported 和 requested 数据的 HTTP 400 `-32022`、HTTP 404 `-32601`、可选的错误数据序列化，以及 202 空响应体通知处理方式。
2. 发现计划。实现网关 `server/discover`，发现每个后端，仅公开安全的端到端 capability 交集，并包含当前的 `resultType`、`ttlMs`、`cacheScope` 和 server 身份元数据。
3. 准入表。分别验证官方 Registry `server.json` 的发布结构和 `com.example/*` 风格的名称，不要将其与安全准入混为一谈。对于每个后端，将记录与外部已验证的发布者 namespace、provenance 来源、端点、版本策略、描述符 digest、issuer、resource、批准状态和过期状态关联起来。
4. Namespace 映射。为每个后端 Tool 提供稳定且限定范围的公共名称，并在每个 `tools/list` 描述符中保留有效的对象根 `inputSchema`。拒绝因顺序产生的冲突。
5. 授权 Matrix。将 principal 和角色映射到公共 Tool、resource、参数和 scope。外层凭证与后端凭证必须分离，并绑定到 issuer。
6. 转发契约。构建新的、自包含的后端请求，只声明经过网关调解的客户端 capabilities，验证后端结果，并保留 trace 关联关系。
7. Cache 计划。将依赖 principal 的发现结果和列表设为 private。设置有界 TTL 和失效行为。
8. 速率与审计策略。根据 principal、issuer、resource、Tool、成本类别和时间确定限制 key。对凭证和不必要的敏感参数进行脱敏。
9. 交互路由。说明请求范围的 SSE、`subscriptions/listen` 确认和重连行为、逐字节一致的 MRTR 状态转发，以及通过 `Mcp-Name` 中的 task id 进行 Tasks 路由。
10. 传输适配器。如果网关接收的是已经解析的请求和 header，则将其标记为进程内协议 Model，并连接到第 09 课，以执行 JSON Content-Type 以及 JSON 加 SSE Accept 检查。
11. 兼容性适配器。将旧版初始化、session id、GET stream、resource subscription 和实验性 task method 隔离在现代网关核心之外。

## 强制拒绝

- 将 session affinity、session store 或 session-id 重写描述为 2026-07-28 的必需项。
- 在没有准入证据的情况下信任 Registry 中存在的记录或显示名称。
- 静默处理 Tool 冲突，或在未经重新批准的情况下更新描述符 pin。
- 在后端复用外层 bearer token，或在其他 issuer 或 resource 上复用后端 token。
- 公开缓存按 principal 过滤的列表。
- 独立的现代 GET event stream、Last-Event-ID 重放或 resource subscribe method。
- 新增 `tasks/list` 或 `tasks/result` 行为。
- 仅根据已移除的协议 session 设置速率限制。
- 在 `server.json` 内虚构安全验证，而不是使用独立的已验证准入与 provenance 状态。
- 省略 `inputSchema` 的 namespace 化 Tool 描述符。

## 输出格式

返回名为 Ingress、Discovery、Admission、Namespace Map、Authorization、Forwarding、Cache、Rate Limits、Audit、Interactions 和 Legacy Adapter 的章节。最后指出需要最严格验收测试的那一条路由。
