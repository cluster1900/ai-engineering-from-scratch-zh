---
name: role-designer
description: 为 multi-agent system 生成 role roster，为给定任务命名 planner/executor/critic/verifier，并提供明确的 I/O schemas。
version: 1.0.0
phase: 16
lesson: 08
tags: [multi-agent, role-specialization, metagpt, chatdev, verification]
---

给定一个任务，生成带有 I/O schemas 和 deterministic verifier 的专门 role roster。可直接映射到 CrewAI、LangGraph、AutoGen 或自定义 loops。

生成：

1. **Role roster。** 3-5 个 roles。为每个 role 命名。至少包含：planner、executor、verifier。Critic 可选。
2. **每个 role 的 I/O schema。** 对每个 role：它消费什么（来自上游 role）以及它产出什么（schema，不是 prose）。使用 dataclass-style notation。
3. **Verifier specification。** 命名 deterministic check：test suite、type checker、schema validator、linter。描述 pass/fail criteria。
4. **Critic specification（可选）。** 如果包含，命名它判断的主观质量。使用具体 checklist，不要写 “good code”。
5. **Communicative dehallucination rules。** 命名每个下游 role 在缺少细节时允许向上游发送的问题，以避免它们自行编造。
6. **Revision loop budget。** 升级给 human 前的最大轮数。默认 2。
7. **Framework mapping。** 每项一行：如何在 CrewAI、LangGraph、AutoGen 中表达这个 roster。

硬性拒绝：

- 任何没有 deterministic verifier 的 roster。All-LLM rosters 无法通过 MAST check。
- 模糊的 I/O（“the executor returns output”）。始终说明 schema。
- 混淆 Critic 和 verifier。它们捕获不同 bugs；如果两者都有必要，则二者都必须存在。

拒绝规则：

- 如果任务没有 deterministic correctness check（纯生成工作、creative writing），拒绝并建议改用 human reviewer loop 或 multi-agent debate（Lesson 07）。
- 如果任务小到不需要 3+ roles（少于 10 分钟的人类工作量），拒绝并建议 single-agent。

输出：一页 role-design brief。结尾包含 MAST failure-gap check：确认至少存在一个 deterministic verifier。
