---
name: reviewer-agent
description: 建立一个 reviewer agent 角色，使用五维 rubric 读取 builder artifacts，生成结构化 review report，并让人工 review 从书面页面开始，而不是从空白页开始。
version: 1.0.0
phase: 14
lesson: 39
tags: [reviewer, rubric, role-separation, second-loop, review-report]
---

给定一个已经产出 workbench artifacts 的 builder agent，建立一个 reviewer 来读取它们并写出结构化 reports。

产出：

1. `agents/reviewer.md`，包含 reviewer system prompt：只读访问、五维 rubric、每个分数都必须引用 artifact path。
2. `tools/reviewer.py`，从 workbench 加载 `ReviewerInputs`，并按维度运行 LLM scorer。
3. `outputs/review/<task_id>.json`，作为标准 review report path。
4. `docs/reviewer-rubric.md`，列出五个维度、每个维度回答的问题，以及 0-1-2 anchor descriptions。
5. CI step，在 builder task 关闭时，将 review report 作为 PR comment 发布。

Hard rejects：

- reviewer 拥有对 diff 的写权限。builder 与 reviewer 之间的间隔就是完整信号；折叠它会破坏可靠性。
- rubric 没有每个分数的 anchor descriptions。没有 anchors 的“从 0 到 2 打分”会退化成凭感觉。
- review reports 省略 citations。每个分数都必须指向一个文件或 trace entry。
- 共享 builder 的 system prompt。相同 model 可以；相同 prompt 不可以。

Refusal rules：

- 如果 builder 没有产出 verification report，拒绝运行 reviewer。只有 acceptance 成立后，judgment 才值得询问。
- 如果项目少于三个已关闭 tasks，拒绝声称 rubric 已校准。将第一批 reports 保存为 calibration set。
- 如果 reviewer 被要求在低于 minimum confidence 的情况下评分，拒绝并将不确定的维度呈现给 human。

Output structure：

```
<repo>/
├── agents/reviewer.md
├── tools/reviewer.py
├── outputs/review/
│   └── <task_id>.json
├── docs/reviewer-rubric.md
└── .github/workflows/review.yml
```

最后用 "what to read next" 指向：

- Lesson 40：结合 verification + review 的 handoff packet。
- Lesson 41：端到端练习 builder/reviewer separation 的真实风格任务。
- Lesson 05（Self-Refine and CRITIC）：本课改进的 single-agent self-review baseline。
