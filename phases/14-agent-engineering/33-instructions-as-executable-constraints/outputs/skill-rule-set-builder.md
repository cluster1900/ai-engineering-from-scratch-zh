---
name: rule-set-builder
description: 访谈项目 owner，将他们现有的散文式指令分类为五个操作类别，并输出一个带版本的 agent-rules.md 加一个 Python 检查器 stub。
version: 1.0.0
phase: 14
lesson: 33
tags: [rules, instructions, constraints, checker, workbench]
---

给定一个 repo 和任何现有的散文式指令（`AGENTS.md`、`CONTRIBUTING.md`、入职 docs），生成一个工作台可以执行的五类别规则集。

五个类别：

1. `startup` — 工作开始前必须满足什么。
2. `forbidden` — 什么事情绝对不能发生。
3. `definition_of_done` — 什么能证明任务已完成。
4. `uncertainty` — Agent 不确定时该做什么。
5. `approval` — 什么需要人工 sign-off。

生成：

1. `docs/agent-rules.md`，每条规则使用一个 `##` heading。每条规则都带有 `category`、`check` 和一行描述。
2. `tools/rule_checker.py`，包含一个 `RuleChecker` class，为每个 `check` 暴露一个 method。每个 method 接收一个 `TurnTrace` dataclass 并返回 `bool`。
3. `tools/rule_report.py` runner，加载规则，在 trace 上运行检查器，并输出一个 `rule_report.json`。
4. 一份 migration notes 文件：哪些散文行变成了哪条规则，哪些作为愿景式内容被丢弃，以及原因。

硬性拒绝：

- 没有 `check` 字段的规则。只有愿景的规则属于入职 docs，不属于工作台规则集。
- 单条“be careful”规则。指定类别和检查，否则删除它。
- 需要 LLM 调用的检查。规则检查必须是确定性的且便宜，这样才能每个 turn 都运行。
- 超过 200 行的规则文件。按类别拆分为 `agent-rules.{startup,forbidden,done,uncertainty,approval}.md`，并从父 index 路由。

拒绝规则：

- 如果 Agent 产品无法提供 `TurnTrace`（没有 instrumentation），则拒绝接入检查器，直到至少记录 `read_state_file`、`edited_files` 和 `tests_exit_code`。
- 如果现有指令大多是愿景式的（>50%），在输出规则前先呈现这个发现。规则集会显得很薄；这是正确的。
- 如果某条规则是因为单个过去事件而添加的，附上 incident id，以便未来评审判断它是否仍然需要。

输出结构：

```
<repo>/
├── docs/
│   └── agent-rules.md
├── tools/
│   ├── rule_checker.py
│   └── rule_report.py
└── docs/migration-notes.md
```

最后以“what to read next”结尾，指向：

- Lesson 36，了解扩展 forbidden 类别的 per-task scope contracts。
- Lesson 38，了解消费规则报告的 verification gates。
- Lesson 39，了解对规则合规性评分的 reviewer agent。
