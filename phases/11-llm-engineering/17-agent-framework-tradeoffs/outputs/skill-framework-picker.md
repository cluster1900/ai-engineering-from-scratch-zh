---
name: framework-picker
description: 通过将 abstraction 与问题形态匹配，为 agent 任务选择 LangGraph、CrewAI、AutoGen、Agno 或 plain Python。
version: 1.0.0
phase: 11
lesson: 17
tags: [langgraph, crewai, autogen, agno, agent-framework, orchestration, decision-matrix]
---

给定任务描述（问题形态、每次运行的 LLM 调用总数、分支模式、durability 和 resume 需求、human-in-the-loop 检查点、parallel fanout、session memory、预期每日运行量），输出：

1. 形态匹配。用一句话指出适合的 abstraction：graph（typed state、named transitions）、org chart（specialist roles、manager-routed handoffs）、chat（agents 一直对话直到完成）、single agent with tools。如果无法选择其中之一，说明该任务还不是 agent-shaped；停止并拆解。
2. 分支权威。谁选择下一步：developer（explicit edges）、manager LLM（CrewAI hierarchical）、conversational emergent（AutoGen GroupChat）、tool-call self-routed（Agno）。如果适用，说明 LLM-selected routing 的每轮 Token 成本。
3. State budget。确认是否需要 resume-after-restart、time-travel 或 human interrupts。如果需要，LangGraph 凭借 state-first abstractions 胜出；Agno 只覆盖 session-scoped memory。
4. Framework 选择。输出 langgraph、crewai、autogen、agno、plain_python 之一。包含一句话理由，将形态和 state 答案映射到该 framework 的 core primitive。
5. Escape hatch。如果每日运行量超过 10_000，或任务在没有 state 的情况下只需要两次或更少 LLM 调用，则改为推荐 plain Python 搭配 provider SDK。任务很小时，没有 framework 就是最快的 framework。

拒绝为已知 DAG 的 deterministic workflows 推荐 AutoGen；GroupChatManager 会花费 Token 选择 speaker，而 developer 本可以静态连线。CrewAI 确实通过 `output_pydantic` / `output_json` 支持 structured task outputs（见 [docs.crewai.com/en/concepts/tasks](https://docs.crewai.com/en/concepts/tasks)），但它的 `context` channel 仍然会流入下一个 task 的 prompt string。当 workflow 依赖原始 `context` 在 tasks 之间传递 structured state，却没有接入这些 output schemas 之一时，要反对使用 CrewAI。对于两次调用的 summarizer，要反对使用 LangGraph；StateGraph overhead 纯粹是负担。当任务 fan out 到超过 4 个 parallel sub-workers 且需要 reducer semantics 时，要反对使用 Agno；Agno 提供一个 `Parallel` block，其 outputs 会合并为按 step name 键控的 dict（见 [docs-v1.agno.com/workflows_2/overview](https://docs-v1.agno.com/workflows_2/overview) 和 [docs.agno.com/workflows/access-previous-steps](https://docs.agno.com/workflows/access-previous-steps)），但它没有暴露可与 LangGraph 的 Send 相比的 Send-style fanout-and-reduce primitive。

示例输入："Long-running research workflow: plan, fan out to three retrievers, synthesize, human approves brief, write report, cite sources. Must resume after crash. Production-bound to 50 runs per day."

示例输出：
- Shape: graph。Typed plan、三个 parallel retrievers，以及 synthesize 和 write 之间的 named transitions。
- Branching: 通过 conditional edges 由 developer 决定。没有每轮 manager LLM。
- State: 需要 resume 和 human interrupt。LangGraph 是必要选择。
- Framework: langgraph。State、Send fanout、interrupt_before 和 PostgresSaver 都是 first-class。
- Escape hatch: 不适用。每日 50 次运行远低于 plain-Python 阈值，并且该 workflow 的 stateful 程度太高，不能不使用 framework。
