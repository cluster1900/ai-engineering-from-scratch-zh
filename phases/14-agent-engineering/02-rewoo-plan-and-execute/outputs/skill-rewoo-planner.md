---
name: rewoo-planner
description: 根据用户请求和工具目录生成经过验证的 ReWOO plan DAG。
version: 1.0.0
phase: 14
lesson: 02
tags: [rewoo, plan-and-execute, planning, dag, distillation]
---

给定一个用户请求和一个工具目录（name、input schema、description），生成一个 ReWOO plan：包含工具调用和证据引用（`#E1`、`#E2`、...）的步骤 DAG。在交给 executor 之前验证该 plan。

生成：

1. 一个 plan DAG。每个 node 都有 id（`E1`、`E2`、...）、工具名称、argument dict（字符串可以包含 `#E<k>` 引用），以及可选的 `parallel_group` label。
2. 验证输出。通过拓扑排序进行无环性检查；引用解析检查（每个 `#E<k>` 都有一个在前的 producer）；工具存在性检查（每个工具名称都在目录中）；arg schema 检查（每个 argument 都匹配该工具的 input schema）。
3. 并行性提示。对每个拓扑层级，列出可以并发执行的 nodes。
4. Planner/solver 拆分建议。如果 plan 少于 3 个步骤，建议改用 ReAct。如果 plan 有无界循环需求（每一步都 replanning），建议使用带 replanner 的 Plan-and-Execute。如果 plan 超过 30 步或目标是 web/mobile，建议使用带 synthetic plan data 的 Plan-and-Act。

硬性拒绝：

- 带 cycle 的 plan。ReWOO 假设 DAG；cycle 是 ReAct 或 LATS 关注的问题。
- 引用 `#E<k>` 且 `k` 在拓扑顺序中尚不存在的 plan。输出失败的具体 edge。
- 调用目录中不存在的工具的 plan。不要为了让 plan 可行而发明工具。
- 引用的 argument 类型与工具 schema 不匹配的 plan（例如，`#E1` 替换为字符串，但工具期望 int）。

拒绝规则：

- 如果任务是开放式探索（所需工具未知、步骤未知），拒绝并建议使用 ReAct 或 LATS（Lesson 04）。
- 如果工具目录包含破坏性工具但没有 gating approval 工具，拒绝并指向 Lesson 09（permissions, sandboxing）。

输出：一个结构化 plan（JSON 或 YAML）、一个验证报告、一个并行性 map，以及一个后续行动，指向 executor（ReWOO Worker）、replanner（Plan-and-Execute）或更大的 trajectory-sampling loop（Plan-and-Act）。

最后附上一条 "what to read next" note：如果该任务类别以前尝试过，指向 Lesson 03（Reflexion）；如果该 plan 会受益于 search，指向 Lesson 04（LATS）。
