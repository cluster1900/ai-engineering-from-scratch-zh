---
name: memory-blocks
description: 生成一个 Letta 形态的三层 memory system（core blocks、recall、archival），并配有一个位于 critical path 之外的 sleep-time consolidation agent。
version: 1.0.0
phase: 14
lesson: 08
tags: [memory, letta, blocks, sleep-time, consolidation]
---

给定一个目标 runtime、一个 primary model，以及一个（可能更强的）sleep-time model，生成一个具有显式 block 类型和 async consolidation 的三层 memory system。

产出：

1. `Block` type，包含 `label`、`value`、`limit`、`description`、`version`、`history`。每次写入都会递增 version 并记录旧 value。暴露 `near_limit(threshold=0.8)`。
2. 一个 `BlockStore`，至少包含三个默认 blocks：`human`（关于用户的事实）、`persona`（agent 自我概念）和 `task`（当前 scope）。允许用户定义 blocks。
3. 一个 `Recall` store — 按 session 分页的 turn log。每个 turn 自动写入。达到 cap 时 tail 会被 evict，但仍可检索。
4. 一个 `Archival` store — 至少两个 backends（vector、KV）。Insert 返回 record id。遇到 contradiction 时执行 invalidate，而不是 delete。
5. 一个 `PrimaryAgent`，负责处理 turns，并且只发出 raw writes。critical path 上不做 summarization。
6. 一个 `SleepTimeAgent`，在 turns 之间运行：summarize 超过 threshold 的 blocks、invalidate 被 contradiction 的 archival records、将 `learned_context` 写入 shared blocks。

硬性拒绝项：

- 除 direct lookup 外，任何在面向用户的 turn 期间同步运行的 memory op。Summarization、consolidation、invalidation 都属于 sleep-time pass。
- 在 contradiction 时 delete archival records。应执行 invalidate，以便 history 保持可审计。
- 未经 review step 就写入 Persona 或 Safety block。这些 blocks 会全局塑造行为；silent writes 会掩盖 bugs。

拒绝规则：

- 如果 runtime 无法跨 sessions 持久化 blocks，则拒绝发布一个被描述为 "memory" 的产品。降低该声明。
- 如果 sleep-time agent 没有 trace output，则拒绝。Silent consolidation 是调试死区。
- 如果用户要求 "no invalidation, always trust latest write"，对于任何 historical claims 很重要的领域（compliance、medical、legal），都要拒绝。

Output：每个 component 一个文件，外加一个 `README.md`，其中说明 default blocks、sleep-time cadence 和 contradiction resolution policy。最后以 "what to read next" 结尾：如果 agent 需要基于 memory 进行 graph reasoning，指向 Lesson 09；如果产品需要 memory ops 上的 OTel spans，指向 Lesson 23。
