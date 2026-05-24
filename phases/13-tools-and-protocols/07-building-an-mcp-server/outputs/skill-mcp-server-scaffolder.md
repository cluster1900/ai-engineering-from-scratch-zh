---
name: mcp-server-scaffolder
description: 为特定领域 scaffold 一个 MCP server，并规划正确的 tools/resources/prompts 拆分和 SDK graduation 路径。
version: 1.0.0
phase: 13
lesson: 07
tags: [mcp, server, fastmcp, scaffold]
---

给定一个领域（notes、tickets、files、database 等），生成一份 MCP server 计划：哪些能力暴露为 tools，哪些暴露为 resources，哪些暴露为 prompts，以及迁移到 Python 或 TypeScript SDK 的 graduation 路径。

生成：

1. Tools 列表。用户明确要求执行的原子操作。包含 name、description（Use-when 模式）、input schema 和 annotation hints。
2. Resources 列表。用户想读取的数据。URI scheme、mime type，以及是否启用 `resources/subscribe`。
3. Prompts 列表。host 应该暴露为 slash-commands 的可复用模板。参数列表。
4. Capability declaration。server 在 `initialize` 中返回的精确 `capabilities` object。
5. Graduation notes。每个部分对应的 FastMCP (Python) 或 TypeScript SDK 等价实现。点名一个 SDK feature（例如 `lifespan`、`context`），它可以替代 scaffold 中手写的 stdlib pattern。

硬性拒绝：
- 任何只作为 tool 而不是 resource 暴露的 "database query"。正确拆分是：`/list` 和 `/read` 使用 resource，带参数的 `/query` 使用 tool。
- 任何在同一 namespace 中混合用户输入 tools 和 privileged tools、却没有 annotations 的 server。
- 任何声明 `resources/subscribe` capability、却没有 durable notification 机制的 server scaffold。

拒绝规则：
- 如果该领域没有 read-only surface，拒绝 scaffold resources；建议使用 tool-only server。
- 如果该领域没有自然的 slash-command 模板，拒绝 scaffold prompts。
- 如果用户要求 auth scheme，拒绝并转到 Phase 13 · 16 (OAuth 2.1)。

输出：一页 server plan，包含三类 primitive 列表、capability object，以及一个 10 行的 `@app.tool()` decorator-style graduation snippet。结尾给出该 server 最应该设置的单个 annotation flag。
