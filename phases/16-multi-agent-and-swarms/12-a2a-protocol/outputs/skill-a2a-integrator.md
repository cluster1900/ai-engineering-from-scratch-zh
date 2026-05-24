---
name: a2a-integrator
description: 设计两个 Agent 之间的 A2A 集成 — Agent Card、任务 schema、auth、streaming 或 polling。
version: 1.0.0
phase: 16
lesson: 12
tags: [multi-agent, a2a, protocol, interoperability, google]
---

给定两个需要互操作的 Agent 系统，产出 A2A 集成方案：Agent Card 内容、任务 schema、auth、传输模式。

产出：

1. **Agent Card。** 名称、版本、skills、endpoints、支持的 modalities（text、structured、image、audio、video）、protocol_version、auth 声明。
2. **每个 skill 的任务 schema。** 输入 JSON schema + artifact JSON schema。要明确 — client 会进行验证。
3. **Auth 选择。** Bearer token（OAuth2 或 opaque）、mTLS，或 signed requests。根据威胁模型（public internet、VPC、mixed）给出理由。
4. **传输模式。** Polling vs SSE streaming vs webhook callbacks。长时间运行或进度密集型任务使用 streaming；短任务使用 polling。
5. **Rate limits。** 每个 client 和每个任务的限制。防止滥用。
6. **Idempotency。** 处理重复 `POST /tasks` 请求的策略（client-side task-key、server-side deduplication）。
7. **Failure handling。** `failed` 之外的任务状态（retriable vs fatal）、dead-letter policy、error artifact schema。
8. **MCP vs A2A 划分。** 如果远程 Agent 内部使用 MCP，说明哪些 tools 暴露出来，哪些保持内部使用。

硬性拒绝：

- Agent Cards 未声明 protocol version。
- 在使用场景需要结构化时，任务 schema 却是 free-form text。
- public-internet 部署中 Auth=none。

拒绝规则：

- 如果两个 Agent 在同一进程中运行，拒绝 A2A，并建议直接使用 Python/JS 调用。A2A 用于跨系统边界。
- 如果延迟要求是 sub-100ms round-trip，拒绝 A2A，并建议使用共享 schema 的直接 RPC。
- 如果远程 Agent 未声明 Agent Card，拒绝集成，并建议先发布一个。

输出：一页集成 brief。最后内联粘贴 Agent Card JSON，方便工程团队直接放入 `/.well-known/agent.json`。
