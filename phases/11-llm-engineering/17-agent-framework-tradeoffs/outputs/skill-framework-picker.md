---
name: framework-picker
description: 根据 abstraction 与 problem shape 的匹配，为 agent task 选择 LangGraph、CrewAI、AutoGen、Agno 或 plain Python。
version: 1.0.0
phase: 11
lesson: 17
tags: [langgraph, crewai, autogen, agno, agent-framework, orchestration, decision-matrix]
---

给定任务描述（problem shape、每次运行的总 LLM calls、branching pattern、durability 和 resume needs、human-in-the-loop checkpoints、parallel fanout、session memory、预期每日运行量），输出：

1. Shape match。用一句话命名适合的 abstraction：graph（typed state、named transitions）、org chart（specialist roles、manager-routed handoffs）、chat（agents 交谈直到完成）、single agent with tools。如果你无法选择一个，说明任务还不是 agent-shaped；停止并拆解。
2. Branching authority。谁选择下一步：developer（explicit edges）、manager LLM（CrewAI hierarchical）、conversational emergent（AutoGen GroupChat）、tool-call self-routed（Agno）。如果适用，指出 LLM-selected routing 的 per-turn token cost。
3. State budget。确认是否需要 resume-after-restart、time-travel 或 human interrupts。如果需要，LangGraph 凭借 state-first abstractions 胜出；Agno 只覆盖 session-scoped memory。
4. Framework choice。输出 langgraph、crewai、autogen、agno、plain_python 之一。包含一句 justification，把 shape 和 state 答案映射到该 framework 的核心 abstraction。
5. Escape hatch。如果 daily run volume 超过 10_000，或任务是不带 state 的两次或更少 LLM calls，改为推荐 plain Python with the provider SDK。当任务很小时，没有 framework 是最快的 framework。

拒绝为有已知 DAG 的 deterministic workflows 推荐 AutoGen；`GroupChatManager` 会花 tokens 选择 speakers，而 developer 本可以静态连线。CrewAI 确实通过 `output_pydantic` / `output_json` 支持 structured task outputs（见 [docs.crewai.com/en/concepts/tasks](https://docs.crewai.com/en/concepts/tasks)），但它的 `context` channel 仍然会通过下一项 task 的 prompt string 流动。当 workflow 依赖 raw `context` 在 tasks 之间携带 structured state、却没有接好这些 output schemas 之一时，要对 CrewAI 提出质疑。对于 two-call summarizer，要对 LangGraph 提出质疑；StateGraph overhead 纯粹是税。对于 fan out 到 4 个以上 parallel sub-workers 且带 reducer semantics 的任务，要对 Agno 提出质疑；Agno 提供了一个 `Parallel` block，其 outputs 会 join 成以 step name 为 key 的 dict（见 [docs-v1.agno.com/workflows_2/overview](https://docs-v1.agno.com/workflows_2/overview) 和 [docs.agno.com/workflows/access-previous-steps](https://docs.agno.com/workflows/access-previous-steps)），但它没有暴露可与 LangGraph 的 Send-style fanout-and-reduce API 相比的能力。

示例输入: "长时间运行的 research workflow：制定 plan，fan out 到三个 retrievers，综合结果，由人工批准 brief，撰写 report，引用 sources。必须能在 crash 后恢复。生产环境每天 50 次运行。"

示例输出:
- Shape: graph。Typed plan、三个 parallel retrievers、synthesize 和 write 之间的 named transitions。
- Branching: developer-decided，通过 conditional edges。没有 per-turn manager LLM。
- State: 需要 resume 和 human interrupt。LangGraph mandatory。
- Framework: langgraph。State、Send fanout、interrupt_before 和 PostgresSaver 都是一等能力。
- Escape hatch: 不适用。每天 50 次运行远低于 plain-Python threshold，而且 workflow 过于 stateful，不适合无 framework。
