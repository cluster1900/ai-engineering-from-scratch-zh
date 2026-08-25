# 生产级 Agent Runtime — 快速实例化与类型化工作流

> 生产级 Agent Runtime 会优化原型框架忽略的方面：实例化成本、类型化工作流接口，以及可直接用于服务的后端。2026 年的组合是：Agno（Python）以微秒级 Agent 实例化和无状态 FastAPI 后端为目标。Mastra 基于 Vercel AI SDK，提供 Agent、Tool、工作流、统一 Model 路由和组合式存储。

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01（Agent Loop），Phase 14 · 13（LangGraph）
**Time:** ~45 分钟

## 学习目标

- 识别 Agno 的性能目标，以及这些目标何时重要。
- 说出 Mastra 的三个原语 — Agent、Tool、工作流 — 以及支持的服务器适配器。
- 解释为什么无状态、Session 范围的 FastAPI 后端是推荐的 Agno 生产路径。
- 根据给定技术栈（Python 优先或 TypeScript 优先）选择 Agno 或 Mastra。

## 问题

LangGraph、AutoGen、CrewAI 都是重量级框架。希望“只要 Agent Loop，在我的 Runtime 中快速运行”的团队会选择 Agno（Python）或 Mastra（TypeScript）。两者都舍弃了一部分由框架负责的原语，以换取原始速度以及与周边技术栈更紧密的契合。

## 概念

### Agno

- Python Runtime，前身为 Phi-data。
- “没有 graph、chain 或复杂难懂的模式 — 只有纯粹的 python。”
- 其文档中的性能目标：Agent 实例化约 2μs、每个 Agent 约占用 3.75 KiB 内存、约 23 个 Model Provider。
- 生产路径：无状态、Session 范围的 FastAPI 后端。每个请求都会启动一个全新的 Agent；Session 状态存储在 DB 中。
- 原生 Multimodal（文本、图像、音频、视频、文件）和 Agentic RAG。

当你每秒需要创建数千个生命周期很短的 Agent 时（聊天流量汇聚、Evaluation Pipeline），这些速度目标很重要。当一个 Agent 要运行 10 分钟时，它们的重要性就小得多。

### Mastra

- TypeScript，构建于 Vercel AI SDK 之上。
- 三个原语：**Agent**、**Tool**（使用 Zod 定义类型）、**工作流**。
- Unified Model Router — 覆盖 94 个 Provider 的 3,300 多个 Model（2026 年 3 月）。
- 组合式存储：Memory、工作流、可观测性可分别使用不同后端；大规模可观测性场景推荐使用 ClickHouse。
- 采用 Apache 2.0，但 `ee/` 目录使用源码可用的企业许可证。
- 为 Express、Hono、Fastify、Koa 提供服务器适配器；对 Next.js 和 Astro 提供一等集成。
- 提供用于调试的 Mastra Studio（localhost:4111）。
- 在 1.0 版本发布时（2026 年 1 月），拥有 22k+ GitHub stars 和 300k+ npm 每周下载量。

### 定位

两者都不是为了成为 LangGraph。它们在以下方面竞争：

- **语言适配。** Agno 适合 Python 优先的团队；Mastra 适合 TypeScript 优先的团队。
- **Runtime 易用性。** Agno = 接近零开销；Mastra = 与 Vercel 生态系统集成。
- **可观测性。** 两者都能与 Langfuse/Phoenix/Opik（第 24 课）集成，但 Mastra Studio 是第一方产品。

### 各自的适用场景

- **Agno** — Python 后端、大量生命周期很短的 Agent、严格的性能要求、使用 FastAPI 的团队。
- **Mastra** — TypeScript 后端、部署到 Next.js / Vercel、统一的多 Provider Model 路由、使用 Zod 定义类型的 Tool。
- **LangGraph**（第 13 课）— 持久状态和显式 graph 推理比原始速度更重要时。
- **OpenAI / Claude Agent SDK** — 希望采用 Provider 产品化形态时（第 16–17 课）。

### 这种模式容易出错的地方

- **为性能而性能。** 仅仅因为“2μs”听起来不错就选择 Agno，而实际工作负载是每个请求只执行一次缓慢的 Agent 调用。此时开销并不是瓶颈。
- **生态系统锁定。** Mastra 偏向 Vercel 的集成在 Vercel 上是优势，在其他环境中则是劣势。
- **企业许可证混淆。** Mastra 的 `ee/` 目录是源码可用，而不是 Apache 2.0。如果计划 fork，请阅读许可证。

```figure
wb-runtime-spawn
```

## 动手构建

本课主要进行比较 — 任何单一代码产物都无法公平展示两个框架。请查看 `code/main.py` 中的并列示例：一个最小化的“运行 Agent、流式输出、持久化 Session”流程，以两种方式实现（一次采用 Agno 形态，一次采用 Mastra 形态）。

运行：

```
python3 code/main.py
```

你会看到两段结构不同但功能等价的 Trace。

## 实际使用

- **Agno** — 需要速度和 FastAPI 形态的 Python 后端。
- **Mastra** — 使用多个 Provider 和工作流原语的 TypeScript 后端。
- 两者都提供第一方可观测性 Hook，也都能与 Langfuse 集成。

## 交付成果

`outputs/skill-runtime-picker.md` 会根据技术栈、延迟预算和运维形态，在 Agno、Mastra、LangGraph 或 Provider SDK 中作出选择。

## 练习

1. 阅读 Agno 文档。将 stdlib ReAct Loop（第 01 课）迁移到 Agno。哪些内容消失了？哪些保留了下来？
2. 阅读 Mastra 文档。将同一个 Loop 迁移到 Mastra。Tool 的类型定义发生了什么变化（Zod 与无类型定义相比）？
3. Benchmark：测量你的技术栈中的 Agent 实例化延迟。Agno 的 2μs 对你的工作负载重要吗？
4. 设计一次迁移：如果你一直在 Python 中运行 CrewAI，迁移到 Agno 时会破坏哪些内容？
5. 阅读 Mastra 的 `ee/` 许可证条款。哪些限制会影响开源 fork？

## 关键术语

| 术语 | 人们通常怎么说 | 实际含义 |
|------|----------------|------------------------|
| Agno | “快速的 Python Agent” | 无状态、Session 范围的 Agent Runtime |
| Mastra | “Vercel AI SDK 上的 TypeScript Agent” | Agent + Tool + 工作流 + Model Router |
| Unified Model Router | “多 Provider 访问” | 使用单个 Client 访问 94 个 Provider 的 3,300 多个 Model |
| Composite storage | “多个后端” | Memory、工作流、可观测性分别使用不同的存储 |
| Mastra Studio | “本地调试器” | 用于检查 Agent 内部状态的 localhost:4111 UI |
| Source-available | “不是 OSS” | 许可证允许阅读源码，但限制商业用途 |

## 延伸阅读

- [Agno Agent Framework 文档](https://www.agno.com/agent-framework) — 性能目标、FastAPI 集成
- [Mastra 文档](https://mastra.ai/docs) — 原语、服务器适配器、Model Router
- [LangGraph 概览](https://docs.langchain.com/oss/python/langgraph/overview) — 有状态 graph 的替代方案
- [Comet Opik](https://www.comet.com/site/products/opik/) — Mastra 集成所引用的可观测性比较
