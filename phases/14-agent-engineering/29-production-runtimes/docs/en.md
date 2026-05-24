# Production Runtimes：Queue、Event、Cron

> Production agent 运行在六种 runtime shape 上：request-response、streaming、durable execution、queue-based background、event-driven 和 scheduled。先选择 shape，再选择 framework。Observability 在每一种 shape 中都是 load-bearing。

**类型：** 学习
**语言：** Python (stdlib)
**先修要求：** Phase 14 · 13 (LangGraph), Phase 14 · 22 (Voice)
**时间：** ~60 分钟

## 学习目标

- 说出六种 production runtime shape，并将每一种匹配到一个 framework / product pattern。
- 解释为什么 durable execution (LangGraph) 对 long-horizon task 很重要。
- 描述 event-driven runtime，以及 Claude Managed Agents 适用的场景。
- 解释 multi-step agent 中 observability-as-load-bearing 这一说法。

## 问题

Production agent 的失败方式，是 Jupyter notebook 暴露不出来的：第 37 步出现 network timeout，用户在 voice call 途中挂断，cron job 在机器 reboot 时死亡，background worker 内存耗尽。runtime shape 决定了哪些失败是可恢复的。

## 概念

### Request-response

- Synchronous HTTP。用户等待完成。
- 只适用于短任务（<30s）。
- 技术栈：Agno (Python + FastAPI)、Mastra (TypeScript + Express/Hono/Fastify/Koa)。
- Observability：标准 HTTP access log + OTel span。

### Streaming

- 使用 SSE 或 WebSocket 进行 progressive output。
- LiveKit 将其扩展到 WebRTC，用于 voice/video（Lesson 22）。
- Stack：任何支持 streaming 的 framework + 能处理 SSE/WS 的 frontend。
- Observability：每个 chunk 的耗时、first-token latency、tail latency。

### Durable execution

- 每一步之后都会 checkpoint state；失败时自动恢复。
- AutoGen v0.4 actor model 将失败隔离到单个 agent（Lesson 14）。
- LangGraph 的核心差异点（Lesson 13）。
- 当 step count 未知且 recovery cost 很高时，这是必需的。

### Queue-based / background

- Job 进入 queue，worker 拉取执行，结果通过 webhook 或 pub/sub 回流。
- 对 long-horizon agent 是必需的（每个 task 有几十到几百步，见 Anthropic 的 computer use announcement）。
- Stack：Celery (Python)、BullMQ (Node)、SQS + Lambda (AWS)、custom。
- Observability：queue depth、每个 job 的 latency distribution、DLQ size。

### Event-driven

- Agent 订阅 trigger：new email、PR opened、cron fire。
- Claude Managed Agents 开箱即支持这一点（Lesson 17）。
- CrewAI Flows（Lesson 15）用于组织 event-driven deterministic workflow。
- Observability：trigger source、event-to-start latency、agent latency。

### Scheduled

- 周期性运行的 cron-shaped agent。
- 与 durable execution 结合使用，这样失败的 nightly run 可以在下一次 tick 时恢复。
- 技术栈：Kubernetes CronJob + durable framework；托管方案（Render cron、Vercel cron）。

### 2026 deployment pattern

- **CrewAI Flows** 用于 event-driven production。
- **Agno** stateless FastAPI 用于 Python microservice。
- **Mastra** server adapter（Express、Hono、Fastify、Koa）用于 embedding。
- **Pipecat Cloud / LiveKit Cloud** 用于 managed voice（Lesson 22）。
- **Claude Managed Agents** 用于 hosted long-running async。

### Observability 是 load-bearing

如果没有 OpenTelemetry GenAI span（Lesson 23）以及 Langfuse/Phoenix/Opik backend（Lesson 24），你无法调试一个在第 40 步失败的 multi-step agent。这对 production 来说不是可选项。它决定了你是在“快速 debug”，还是“从头 replay 并增加更多 logging”。

### Production runtime 失败的位置

- **选错 shape。** 为一个 5 分钟任务选择 request-response。用户挂断；worker 堆积；retry 叠加。
- **没有 DLQ。** Queue worker 没有 dead-letter。失败的 job 会消失。
- **不透明的 background work。** Background agent 运行时不导出 trace。直到用户报告问题之前，失败都是不可见的。
- **跳过 durable state。** 任何超过 30 秒、且你无法承受重启代价的 run，都需要 durable execution。

## 构建它

`code/main.py` 是一个 stdlib multi-shape demo：

- Request-response endpoint（普通函数）。
- Streaming handler（generator）。
- 带 DLQ 的 queue-based worker。
- Event trigger registry。
- Cron-shaped scheduler。

运行：

```bash
python3 code/main.py
```

输出：五条 trace，展示同一个 task 在每种 shape 下的行为。同一套 agent logic，不同的外层 shell。Durable execution（第六种 shape）有意放在 Lesson 13 中通过 LangGraph checkpointing 讲解。

## 使用它

- **Request-response** 用于 chat-style UX。
- **Streaming** 用于 progressive response。
- **Durable** 用于 long-horizon task。
- **Queue** 用于 batch / async / long-running。
- **Event** 用于 agent reactivity。
- **Cron** 用于 housekeeping（memory consolidation、eval、cost report）。

## 发布它

`outputs/skill-runtime-shape.md` 会为一个 task 选择 runtime shape，并连接 observability requirements。

## 练习

1. 将你的 Lesson 01 ReAct loop 移植到你 stack 中的全部六种 shape。哪种 shape 适合哪种 product surface？
2. 给 queue-based demo 添加 DLQ。模拟 10% job failure；暴露 DLQ size。
3. 编写一个 cron-triggered eval agent，每晚针对当天 top 20 trace 运行。
4. 实现带 backpressure 的 streaming：如果 client 很慢，就暂停 agent。这如何与 turn budget 交互？
5. 阅读 Claude Managed Agents docs。什么时候你会把 self-hosted long-horizon agent 迁移到 managed？

## 关键术语

| 术语 | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Request-response | “Synchronous” | 用户等待；只适合短任务 |
| Streaming | “SSE / WS” | Progressive output；更好的 UX；每个 chunk 的 latency 可观察 |
| Durable execution | “Resume from failure” | Checkpointed state；从最后一步 restart |
| Queue-based | “Background jobs” | Producer / worker pool / DLQ |
| Event-driven | “Trigger-based” | Agent 对 external event 作出反应 |
| DLQ | “Dead-letter queue” | 失败 job 的停车场 |
| Claude Managed Agents | “Hosted harness” | Anthropic-hosted long-running async，带 caching + compaction |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — durable execution 细节
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) — 托管的 long-running async
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) — “每个 task 几十到几百步”
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — actor-model fault isolation
