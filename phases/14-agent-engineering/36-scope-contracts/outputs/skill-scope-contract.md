---
name: scope-contract
description: 为每个任务生成 scope contract，包含允许/禁止的 globs、验收标准和回滚计划，并提供一个 CI-ready、感知 glob 的 checker，用于在每个 Agent diff 上运行。
version: 1.0.0
phase: 14
lesson: 36
tags: [scope, contract, globs, diff-check, ci]
---

给定一个任务描述和 repo 布局，生成一个 scope contract 和一个感知 diff 的 checker。

生成：

1. 该任务的 `scope_contract.json`，包含字段：`task_id`、`goal`、`allowed_files` (globs)、`forbidden_files` (globs)、`acceptance_criteria`、`rollback_plan`、`approvals_required`。
2. `tools/scope_check.py`，接收一个 contract 路径和一个 touched files 列表，并返回一个 `ScopeReport`；如有任何违规，则以非零状态退出。
3. CI 步骤（`.github/workflows/scope-check.yml` 或等价项），针对 merge diff 运行 checker。
4. `outputs/scope/closed/<task_id>.json` 归档约定，让 contracts 随变更历史一起交付。

硬性拒绝：

- 没有 `forbidden_files` 的 contract。负空间是 contract 的一部分。
- 对代码目录列出原始路径而不是 globs 的 contract。重构会在一夜之间让原始路径失效。
- `rollback_plan` 字段为空或写着 "see runbook."。要明确写出来。
- approvals 写成 "case by case."。审批边界必须可枚举。

拒绝规则：

- 如果任务描述没有约束 repo 中的某个区域，则拒绝仅根据描述编写 `allowed_files`。询问该任务所在的目录。
- 如果 repo 没有 test command，则在提供或 stub 出一个之前，拒绝添加 `acceptance_criteria`。无法验证的 contract 只是愿望。
- 如果 Agent runtime 无法遵守审批边界（没有 human-in-the-loop），在交付前指出这个缺口；scope creep 进入需要审批的动作会成为主要失败点。

输出结构：

```
<repo>/
├── scope_contract.json
├── outputs/scope/closed/
│   └── T-XXX.json
├── tools/
│   └── scope_check.py
└── .github/
    └── workflows/
        └── scope-check.yml
```

最后以 "what to read next" 结尾，指向：

- Lesson 37：runtime feedback，将已运行的 commands 链接回 contract。
- Lesson 38：verification gate，消费 scope report。
- Lesson 39：reviewer agent，审计已关闭的 contract archive。
