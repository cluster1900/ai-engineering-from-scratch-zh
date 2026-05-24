---
name: workbench-audit
description: 在任何 agent 工作开始前，审计一个 repo 的七个 agent workbench 表面，并报告哪些缺失、部分完成或健康。
version: 1.0.0
phase: 14
lesson: 31
tags: [workbench, audit, reliability, agent-engineering]
---

给定一个 repository path 和将在其中运行的 agent product，审计七个 workbench 表面并生成 readiness report。

七个表面：

1. Instructions：agent 最先读取的 root file（例如 `AGENTS.md`），内容简短，并路由到更深入的规则。
2. State：一个持久、machine-readable 的文件，用于记录 task、touched files、blockers、next action。
3. Scope：每个 task 的 contract，列出 allowed files、forbidden files、acceptance criteria、rollback plan。
4. Feedback：一个 runner，用于捕获 command、stdout、stderr、exit code，并将结果反馈回循环。
5. Verification：一个 gate，用于运行 tests、lint、type-check、smoke run，并确认 acceptance criteria。
6. Review：由不同角色进行的第二遍检查，builder 不能标记自己的工作。
7. Handoff：一个 artifact，用于总结改了什么、为什么改、还剩什么，以及下一步最佳行动。

产出：

- 每个表面的分数：0 缺失，1 部分完成，2 健康。将每个分数关联到你观察到的文件或流程。
- 按杠杆作用排序的三个优先级：先补哪个缺失表面，能消除最多 failure modes。
- 一个 machine-readable 的 `workbench_audit.json` 报告，加上一个 human-readable 的 `workbench_audit.md` 摘要。
- 针对最弱表面的 starter patch：能将分数从 0 提升到 1 的最小文件改动。

硬性拒绝：

- 没有文件路径或流程引用的“健康”分数。没有证据的 audits 会腐化。
- 单一合并的“agent config”表面。合并表面会在 task 出错时掩盖到底是哪一面失败。
- 因为 tests 很慢就跳过 verification。如果 workbench 上没有 verification，builders 就会批改自己的作业。

拒绝规则：

- 如果 repo 完全没有 test command，拒绝给 verification 打分，并将其作为 blocking finding 暴露出来。
- 如果 repo 没有 version control history，拒绝给 handoff 打分，并将其作为 blocking finding 暴露出来。
- 如果 agent product 以 root 身份运行，或拥有不受限制的文件访问权限，在定义 sandbox 或 write list 之前拒绝给 scope 打分。

输出结构：

```
workbench-audit/
├── workbench_audit.json
├── workbench_audit.md
├── patches/
│   └── <weakest-surface>.patch
└── README.md
```

最后以 "what to read next" 结尾，并指向：

- Lesson 32：minimal repo layout。
- Lesson 33：instructions surface 的深入讲解。
- Lesson 38：verification gate。
