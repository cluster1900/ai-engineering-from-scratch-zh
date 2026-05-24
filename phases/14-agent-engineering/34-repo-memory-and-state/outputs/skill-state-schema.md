---
name: state-schema
description: 为 agent state 和 task board 生成项目专属 JSON Schemas、带 atomic writes 的 Python StateManager，以及 migration 脚手架，确保 schema bump 不会破坏 workbench。
version: 1.0.0
phase: 14
lesson: 34
tags: [state, schema, json-schema, atomic-writes, migrations]
---

给定一个 repo 以及在其中运行的 agent 产品，为 workbench 生成 schema-first state 文件。

生成：

1. `schemas/agent_state.schema.json`，覆盖必需 key、允许的 status 值、array-vs-null 纪律，以及一个整数 `schema_version`。
2. `schemas/task_board.schema.json`，覆盖 task id pattern、允许的 owners、允许的 statuses，以及 acceptance arrays。
3. `tools/state_manager.py`，暴露 `load`、`commit` 和 `update`，并使用 temp-and-rename atomic writes。
4. `tools/migrate_state.py`，作为下一次 schema bump 的脚手架；如果文件来自未知版本，则 fail-loud。
5. `agent_state.json` 和 `task_board.json`，以 `schema_version: 1` 和一个新的 backlog 初始化。

硬性拒绝：

- 缺少 `schema_version` 字段的 schema。Migrations 不是可选项。
- 在期望 array 的地方允许 `null`。`null` 是伪装成数据的写入时 bug。
- 使用普通 `open(path, "w")` 的 writer。只允许 atomic writes；部分文件会破坏 source of truth。
- 在 state 中存储 tokens、原始 chat transcripts 或 PII。State 只用于与 repo 相关的事实。

拒绝规则：

- 如果 repo 没有 version control，拒绝交付 state 文件。Atomic writes 加 git diff 才是 durability story。
- 如果项目没有至少一个 acceptance command 来验证 `done` transition，拒绝 `status: done` enum value。没有 acceptance check 就添加 `done` 只是摆设。
- 如果项目打算在没有 lock strategy 的情况下跨 processes 共享 state，在交付前指出这一发现；atomic rename 是必要条件，但并不充分。

输出结构：

```
<repo>/
├── agent_state.json
├── task_board.json
├── schemas/
│   ├── agent_state.schema.json
│   └── task_board.schema.json
└── tools/
    ├── state_manager.py
    └── migrate_state.py
```

最后以“接下来阅读什么”结尾，并指向：

- Lesson 35：启动时调用 manager 的 initialization script。
- Lesson 38：读取 state 来评分 completion 的 verification gate。
- Lesson 40：消费同一 schema 的 handoff generator。
