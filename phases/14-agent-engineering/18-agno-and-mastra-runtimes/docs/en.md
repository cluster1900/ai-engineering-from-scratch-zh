# Agno and Mastra：生产 Runtime

> Agno (Python) 和 Mastra (TypeScript) 是 2026 年的生产 Runtime 组合。Agno 目标是微秒级 Agent 实例化和无状态 FastAPI backend。Mastra 基于 Vercel AI SDK 底层，提供 Agents、tools、workflows、统一 model routing 和 composite storage。

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 13 (LangGraph)
**Time:** ~45 minutes

## 学习目标
- 识别 Agno 的性能目标，以及这些目标在什么场景下重要。
- 说出 Mastra 的三个 primitives —— Agents、Tools、Workflows —— 以及支持的 server adapters。
- 解释为什么无状态、session-scoped 的 FastAPI backend 是推荐的 Agno 生产路径。
- 根据给定 stack 选择 Agno 或 Mastra（Python-first vs TypeScript-first）。

## 问题
LangGraph、AutoGen、CrewAI 都偏 framework-heavy。想要“只要 Agent loop，要快，并且在我的 Runtime 里运行”的团队，会选择 Agno (Python) 或 Mastra (TypeScript)。两者都用一部分 framework-owned primitives 换取原始速度，以及与周边 stack 更紧密的契合。

## 概念
### Agno

- Python Runtime，前身是 Phi-data。
- “没有 graphs、chains 或复杂模式 —— 只有纯 python。”
- 其 docs 中的性能目标：约 2μs Agent 实例化、每个 Agent 约 3.75 KiB memory、约 23 个 model providers。
- 生产路径：无状态、session-scoped 的 FastAPI backend。每个 request 都启动一个新的 Agent；session state 存在 DB 中。
- 原生 Multimodal（text、image、audio、video、file）和 agentic RAG。

当你每秒有数千个短生命周期 Agent（chat fan-in、evaluation pipelines）时，这些速度目标很重要。当一个 Agent 运行 10 分钟时，它们就不那么重要。

### Mastra

- TypeScript，构建在 Vercel AI SDK 之上。
- 三个 primitives：**Agents**、**Tools**（Zod-typed）、**Workflows**。
- Unified Model Router —— 跨 94 个 providers 的 3,300+ models（2026 年 3 月）。
- Composite storage：memory、workflows、observability 可接入不同 backends；规模化 observability 推荐 ClickHouse。
- Apache 2.0，源码中的 `ee/` 目录采用 source-available enterprise license。
- 支持 Express、Hono、Fastify、Koa 的 server adapters；对 Next.js 和 Astro 提供 first-class integration。
- 提供 Mastra Studio（localhost:4111）用于 debugging。
- 1.0 版本时（2026 年 1 月）有 22k+ GitHub stars、300k+ 每周 npm downloads。

### Positioning

两者都不是要成为 LangGraph。它们竞争的是：

- **Language fit.** Agno 面向 Python-first 团队；Mastra 面向 TypeScript-first。
- **Runtime ergonomics.** Agno = 近乎零 overhead；Mastra = 与 Vercel ecosystem 集成。
- **Observability.** 两者都集成 Langfuse/Phoenix/Opik（Lesson 24），但 Mastra Studio 是 first-party。

### When to pick each

- **Agno** —— Python backend、大量短生命周期 Agent、强性能要求、FastAPI 团队。
- **Mastra** —— TypeScript backend、Next.js / Vercel deploy、统一 multi-provider model routing、Zod-typed tools。
- **LangGraph**（Lesson 13）—— 当 durable state 和显式 graph reasoning 比原始速度更重要时。
- **OpenAI / Claude Agent SDK** —— 当你想要 provider 产品化后的形态时（Lessons 16–17）。

### 这个 pattern 容易在哪里出错

- **Perf-for-perf's-sake.** 因为“2μs”听起来不错就选择 Agno，但 workload 是每个 request 一次很慢的 Agent call。Overhead 不是 bottleneck。
- **Ecosystem lock-in.** Mastra 的 Vercel-flavored integration 在 Vercel 上是加分项，在别处可能是减分项。
- **Enterprise license confusion.** Mastra 的 `ee/` 目录是 source-available，不是 Apache 2.0。如果你计划 fork，请阅读 licenses。

## 构建它
本课主要是对比性的 —— 单一 code artifact 无法公正呈现两个 frameworks。参见 `code/main.py` 中的 side-by-side toy：一个最小的“运行 Agent、stream output、persist session”流程，实现了两次（一次 Agno-shaped，一次 Mastra-shaped）。

运行它：

```
python3 code/main.py
```

会看到两个结构不同但功能等价的 traces。

## 使用它
- **Agno** —— 需要速度和 FastAPI 形态的 Python backend。
- **Mastra** —— 拥有多个 providers 和 workflow primitives 的 TypeScript backend。
- 两者都提供 first-party observability hooks。两者都集成 Langfuse。

## 交付它
`outputs/skill-runtime-picker.md` 会根据 stack、latency budget 和 operational shape，在 Agno、Mastra、LangGraph 或 provider SDK 中做选择。

## 练习
1. 阅读 Agno 的 docs。把 stdlib ReAct loop（Lesson 01）移植到 Agno。什么消失了？什么保留下来了？
2. 阅读 Mastra 的 docs。把同一个 loop 移植到 Mastra。tool typing 中发生了什么变化（Zod vs nothing）？
3. Benchmark：测量你 stack 上的 Agent 实例化 latency。Agno 的 2μs 对你的 workload 重要吗？
4. 设计 migration：如果你一直在 Python 中运行 CrewAI，迁移到 Agno 会破坏什么？
5. 阅读 Mastra 的 `ee/` license terms。哪些限制会影响 open-source fork？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agno | “Fast Python agents” | 无状态、session-scoped 的 Agent Runtime |
| Mastra | “TypeScript agents on Vercel AI SDK” | Agents + Tools + Workflows + Model Router |
| Unified Model Router | “Multi-provider access” | 跨 94 个 providers、面向 3,300+ models 的单一 client |
| Composite storage | “Multiple backends” | Memory/workflows/observability 分别接入不同 store |
| Mastra Studio | “Local debugger” | 用于 introspecting Agents 的 localhost:4111 UI |
| Source-available | “Not OSS” | License 允许阅读 source，但限制 commercial use |

## 延伸阅读
- [Agno Agent Framework docs](https://www.agno.com/agent-framework) —— 性能目标、FastAPI integration
- [Mastra docs](https://mastra.ai/docs) —— primitives、server adapters、Model Router
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) —— stateful-graph 替代方案
- [Comet Opik](https://www.comet.com/site/products/opik/) —— Mastra integrations 引用的 observability comparisons
