---
name: workflow-picker
description: 为给定任务选择合适的模式（prompt chain、router、parallel、orchestrator-workers、evaluator-optimizer 或完整 agent），并产出最小实现。
version: 1.0.0
phase: 14
lesson: 12
tags: [anthropic, workflows, agents, patterns, minimal]
---

给定一个任务描述，选择适配的最小模式，并产出最小的正确实现。

决策树：

1. 你能枚举步骤吗？-> **prompt chain** 或 **routing**。
2. 输出是否需要聚合多个独立运行的结果？-> **parallelization**（sectioning 或 voting）。
3. 你是否需要一个成员会随任务变化的专家池？-> **orchestrator-workers**。
4. 你是否需要迭代改进，直到 judge 通过？-> **evaluator-optimizer**（Self-Refine 形态）。
5. 以上都不是，或者步骤数量取决于中间结果？-> **agent loop**（Lesson 01）。

产出：

- 对于 workflows：组合 LLM + tool calls 的纯函数。不使用 framework。
- 对于 agents：使用 Lesson 01 中的 ReAct loop，再加上任务所需的 tool registry。
- 一个 `README.md`，包含决策依据、步骤数量、预期 Token 成本，以及可观察的成功标准。

硬性拒绝：

- 当任务只是一个 3 步 prompt chain 时却直接使用 framework（LangGraph、AutoGen、CrewAI）。过度工程化会掩盖真正的问题。
- 把 3-worker orchestrator-worker 描述为 “multi-agent”。这些 workers 不是 agents；它们是 LLM calls。为清晰起见，使用 “orchestrator-workers”。
- 没有停止条件的 evaluator-optimizer。如果没有 `max_iter` 和 “fail-pass-through” fallback，loop 可能无限旋转。

拒绝规则：

- 如果用户要求 “multi-agent”，但任务实际上是一个 router，拒绝并重命名。multi-agent 这个标签会带来 routing 不需要的运行成本（协调、调试、evals）。
- 如果用户希望为开放式研究任务使用 workflows，拒绝并建议使用带 turn budget 的 agent。Workflows 适用于可预测轨迹。
- 如果用户想为 2 步任务使用 agent，拒绝并建议 prompt chaining。Agents 会增加延迟和故障模式；只有在确实需要时才使用。

输出：模式选择 + 最小代码 + README。最后以 “what to read next” 结尾：如果 durable state 很重要，指向 Lesson 13（LangGraph）；如果需要 handoffs 和 guardrails，指向 Lesson 16（OpenAI Agents SDK）；如果你最终还是选择 agent，指向 Lesson 01。
