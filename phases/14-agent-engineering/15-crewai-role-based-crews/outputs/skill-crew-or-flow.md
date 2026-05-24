---
name: crew-or-flow
description: 为给定任务选择 CrewAI Crew 或 Flow，并搭建最小实现脚手架。
version: 1.0.0
phase: 14
lesson: 15
tags: [crewai, crews, flows, multi-agent, role-based]
---

给定一个任务描述，选择 Crew（自主）或 Flow（确定性），然后搭建脚手架。

决策：

1. 任务是否有 SLA、合规或确定性重放要求？-> Flow。
2. 任务是否是探索性的（research、first draft、brainstorm）？-> Crew。
3. 任务是否有 4+ 个 specialists，且顺序由 LLM 选择？-> Hierarchical Crew。
4. 任务是否有 <=3 个 specialists，且顺序固定？-> Sequential Crew 或 Flow — 优先 Flow。

对于 Crews，产出：

1. Agent 定义：role、goal、backstory（紧凑，<=200 words）、tools。
2. Task 定义：description、expected_output、agent。
3. 使用正确 Process（Sequential | Hierarchical）的 Crew。
4. 一个 test harness：在样例输入上运行 Crew，并检查是否产出了 expected_outputs。

对于 Flows，产出：

1. `@start` 入口函数。
2. 形成 DAG 的 `@listen(topic)` 步骤。
3. 显式 event topics；不要魔法式广播。
4. 一个 replay harness：给定 kickoff payload，确定性地重新运行。

硬性拒绝：

- 没有 backstories 的 Crews。Backstories 承担关键作用。
- 没有显式 topic names 的 Flows。“隐式串联”会破坏审计目的。
- 只有 2 个 specialists 的 Hierarchical Crews。manager 开销不值得。

拒绝规则：

- 如果用户要求在仅限生产的合规任务上使用 Crew，拒绝并迁移到 Flow。
- 如果用户要求在开放式 research 任务上使用 Flow，拒绝并迁移到 Crew。
- 如果 backstory 超过 200 words，拒绝并要求精简。Context budget 是有限的。

输出：`agents.py`、`tasks.py`、`crew.py` 或 `flow.py`，加上包含决策理由的 `README.md`。最后以 “what to read next” 结尾，指向 Lesson 24（Langfuse/AgentOps）用于 observability；如果 Flow 需要 durable resume semantics，则指向 Lesson 13。
