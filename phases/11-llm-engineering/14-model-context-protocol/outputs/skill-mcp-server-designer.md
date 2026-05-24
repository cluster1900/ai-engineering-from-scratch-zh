---
name: mcp-server-designer
description: 设计并搭建一个具备 tools、resources 和安全默认设置的 MCP server。
version: 1.0.0
phase: 11
lesson: 14
tags: [llm-engineering, mcp, tool-use]
---

给定一个领域（内部 API、database、file source）以及将挂载该 server 的 hosts，输出：

1. Primitive map。哪些能力成为 `tools`（action），哪些成为 `resources`（read-only data），哪些成为 `prompts`（用户调用的 templates）。每个 primitive 一行。
2. Auth plan。Stdio（可信本地）、带 API key 的 streamable HTTP，或带 PKCE 的 OAuth 2.1。选择一种并说明理由。
3. Schema draft。每个 tool 参数的 JSON Schema，其中 `description` 字段要针对模型 tool-selection 进行调优（不是 API docs）。
4. Destructive-action list。每个会改变状态的 tool；要求 `destructiveHint: true` 并需要人工批准。
5. Test plan。每个 tool：一个只验证 schema 的 contract test，一个通过 MCP client 的 round-trip test，一个 red-team prompt-injection case。

拒绝发布任何会写入磁盘或调用外部 API 但没有批准路径的 server。拒绝在一个 server 上暴露超过 20 个 tools；应拆分为按领域划分的 servers。
