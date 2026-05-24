---
name: task-store-designer
description: 为长时间运行的 MCP tool 设计 task store：state shape、ttl、durability、cancellation、crash recovery。
version: 1.0.0
phase: 13
lesson: 13
tags: [mcp, tasks, durable-store, long-running, sep-1686]
---

给定一个长时间运行的 tool（research、build、export、report generation），设计支撑 SEP-1686 task augmentation 的 task store。

产出：

1. State shape。最少字段：`id`、`state`、`progress`、`result`、`error`、`ttl`、`created_at`。可选：`request_meta`、`parent_task_id`（用于未来的 subtasks）。
2. Durability 选择。玩具项目用 filesystem；单进程用 SQLite；多副本用 Redis。说明理由。
3. taskSupport 标志。每个 tool 使用 `forbidden`、`optional` 或 `required`；用一句话说明理由。
4. Cancellation 方案。worker 如何检查 cancel signal；partial progress 会发生什么。
5. Crash recovery。启动时 reload 规则；`CRASH_RECOVERY` failure 在 client 看起来是什么样。

硬性拒绝：
- 任何在 ttl 内丢失 completed results 的 store。
- 任何没有显式 terminal states（`completed`、`failed`、`cancelled`）的 task state。
- 任何非 idempotent 的 cancellation。

拒绝规则：
- 如果 tool 运行时间低于 5 秒，拒绝提升为 task。同步更简单。
- 如果 task 会生成超过 10 MB 的 result，拒绝并建议使用 streaming content blocks。
- 如果 server 没有能够持久化 state 的进程（stateless edge function），拒绝并建议迁移到 durable runtime。

输出：一页 store design，包含 state shape、durability choice、taskSupport flag、cancellation plan 和 crash-recovery rule。最后用一句话说明 SEP-1686 subtasks 发布后是否会影响此设计。
