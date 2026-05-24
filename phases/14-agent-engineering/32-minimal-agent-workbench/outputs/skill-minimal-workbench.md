---
name: minimal-workbench
description: 为任何 repo 放置三文件的最低可行 agent workbench —— 简短的 AGENTS.md router、持久的 agent_state.json，以及一个按项目当前 backlog 编排的 JSON task_board.json。
version: 1.0.0
phase: 14
lesson: 32
tags: [workbench, agents-md, state, task-board, scaffold]
---

给定一个 repo 路径和一个简短的 backlog，scaffold 最低可行的 agent workbench。

生成：

1. `AGENTS.md` 不超过 80 行。它必须路由到：state 文件、task board、更深入的规则文档（即使为空），以及验证命令。此文件中不要放散文式教程。
2. `agent_state.json`，包含这些 key：`active_task_id`、`touched_files`、`assumptions`、`blockers`、`next_action`。所有可选字段默认值为空数组或空字符串；数组绝不能是 `null`。
3. `task_board.json`，作为任务的 JSON 数组。每个任务包含 `id`、`goal`、`owner`（`builder` | `reviewer` | `human`）、`acceptance`（字符串列表）和 `status`（`todo` | `in_progress` | `done` | `blocked`）。
4. `docs/agent-rules.md` 占位文件，每个 surface 只放一个 H2，供后续课程填充。

硬性拒绝：

- `AGENTS.md` 超过 80 行或少于 10 行。太长，agent 会跳过；太短，就没有足够的路由信息。
- state 文件引用聊天历史而不是 repo。repo 才是系统记录源。
- task board 缺少 `acceptance`。没有 acceptance criteria 的任务会变成“看起来不错”的橡皮图章。
- `owner` 为 `agent` 或 `model` 的任务。Owner 是角色，不是实体。

拒绝规则：

- 如果 repo 没有验证命令，拒绝写入 `AGENTS.md`，直到用户提供或 stub 一个命令。指向缺失 gate 的 router 比没有 router 更糟。
- 如果 backlog 有超过 12 个开放任务，拒绝并要求用户拆分。超过一屏的 board 会漂移成规划表演。
- 如果项目在 tracked 文件中携带 secrets，拒绝写入 state 文件，并先把 secret 泄漏作为 blocking finding 提出。

输出结构：

```
<repo>/
├── AGENTS.md
├── agent_state.json
├── task_board.json
└── docs/
    └── agent-rules.md
```

最后用“接下来阅读什么”指向：

- Lesson 33：将规则占位内容转化为可执行约束。
- Lesson 34：持久 state schema。
- Lesson 36：每个任务的 scope contract。
