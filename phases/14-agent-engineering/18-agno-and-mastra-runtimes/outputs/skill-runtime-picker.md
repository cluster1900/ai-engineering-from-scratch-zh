---
name: runtime-picker
description: 针对给定 stack、latency budget 和 operational shape，选择生产 Agent Runtime（Agno、Mastra、LangGraph、provider SDK）。
version: 1.0.0
phase: 14
lesson: 18
tags: [agno, mastra, langgraph, runtime, selection]
---

给定 stack、latency budget、所需 primitives 和 operational shape，选择一个 Runtime。

Decision:

1. Python + FastAPI + 每秒数千个短生命周期 Agent -> **Agno**。
2. TypeScript + Next.js/Vercel + 统一 multi-provider -> **Mastra**。
3. Durable state、显式 graph、resume-on-failure -> **LangGraph**（Lesson 13）。
4. Claude-first 产品，想要 Claude Code harness 形态 -> **Claude Agent SDK**（Lesson 17）。
5. OpenAI-first 产品，想要 handoffs + guardrails + tracing -> **OpenAI Agents SDK**（Lesson 16）。
6. Multi-agent team、actor-model concurrency、fault isolation -> **AutoGen v0.4** / **Microsoft Agent Framework**（Lesson 14）。
7. Role-based collaboration 或 event-driven deterministic workflows -> **CrewAI** Crew 或 Flow（Lesson 15）。
8. 以上都不是 -> direct API calls + Lesson 01 中的 stdlib loop。

Produce:

- 一份简短 decision document：stack、latency target、所需 primitives、观察到的 trade-offs。
- 所选 Runtime 中的最小 scaffold。
- 如果当前正在使用另一个 Runtime，则提供 migration plan。

Hard rejects:

- 当 workload 是每个 request 一次很慢的 call 时，纯粹基于“performance”选择 Agno 或 Mastra。Performance 很少是 bottleneck。
- 在 Python monorepo 中选择 TypeScript Runtime，却没有理由。Mixed-language Agent code 是 operational tax。
- 为 stateless short tasks 选择 LangGraph。checkpointer 会增加 overhead，而简单 workflow（Lesson 12）可以避免。

Refusal rules:

- 如果用户想要“all five runtimes, to compare”，拒绝。请在你的 workload 上做 Benchmark；framework vendor benchmarks 只能提供方向性参考。
- 如果用户想 self-host Mastra 的 `ee/` features，拒绝并指向 license terms。
- 如果产品需要 long-running async work（hours-to-days），拒绝 self-hosted，并转向 Claude Managed Agents 或 queue-based architecture（Lesson 29）。

Output: decision doc + scaffold + README。结尾用“what to read next”指向 Lesson 24（observability）和 Lesson 29（production runtimes），作为 framework 之上的 operational layer。
