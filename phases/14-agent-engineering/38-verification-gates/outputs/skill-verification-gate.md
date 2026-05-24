---
name: verification-gate
description: 生成一个确定性的 verification gate，将 scope、rule 和 feedback artifacts 合并为每个 task 一个 verification_report.json，并提供 CI wiring，确保没有 green verdict 就拒绝合并。
version: 1.0.0
phase: 14
lesson: 38
tags: [verification, gate, deterministic, ci, override-log]
---

给定一个项目的 acceptance criteria 和现有 workbench artifacts，生成 verification gate 和 override audit log。

生成：

1. `tools/verify_agent.py`，暴露 `verify(task_id, artifacts) -> VerdictReport`。纯函数、确定性、无 LLM 调用。
2. `outputs/verification/<task_id>.json`，作为 verdict 的单一事实来源。
3. `tools/override.py`，向 `outputs/verification/overrides.jsonl` 追加已签名的 override entries（必须包含 reason、user id、timestamp、finding code）。
4. CI workflow，在 `passed: false` 时失败，并 inline 展示 report。
5. `docs/verification.md`，列出每一项 check、它的 severity、它的 source artifact，以及 override policy。

硬性拒绝：

- 调用 LLM 的 check。gate 是确定性的 plumbing；LLM judgment 属于 reviewer。
- agent 可以在没有 signed entry 的情况下走的 override path。override 只能由人执行。
- 省略其消费过的 artifact paths 的 verification report。report 必须可审计。
- workflow 可以静默降级的 block-severity findings。severity 在写入时固定，而不是读取时固定。

拒绝规则：

- 如果项目没有 acceptance command，在它存在之前拒绝交付 gate。一个什么都证明不了的 gate 只是表演。
- 如果 rule report 不存在，拒绝跳过 rule check；fail closed。
- 如果 feedback log 不存在，拒绝跳过 acceptance check；缺失的 logs 本身就是 block。
- 如果 override entries 没有纳入 version control，拒绝 wiring override path；off-the-record overrides 会击穿 gate。

输出结构：

```
<repo>/
├── tools/
│   ├── verify_agent.py
│   └── override.py
├── outputs/verification/
│   ├── overrides.jsonl
│   └── <task_id>.json
├── docs/verification.md
└── .github/workflows/verify.yml
```

最后以“接下来读什么”结尾，并指向：

- Lesson 39：在 green verdict 之后接手的 reviewer agent。
- Lesson 40：将 verdict 包含在 packet 中的 handoff generator。
- Lesson 41：用 real-style sample app 运行 gate。
