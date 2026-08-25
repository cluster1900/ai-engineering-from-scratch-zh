# 面向 Agent 的 Actor 模型 — 异步消息与类型化 Runtime

> 将 Agent 视为 Actor：异步消息交换、事件驱动的 handler、故障隔离、自然并发。AutoGen v0.4（Microsoft Research，2025 年 1 月）围绕这一模型重新设计了 Agent 编排；该框架目前已进入维护模式，Microsoft Agent Framework（2025 年 10 月公开预览）是其面向生产环境的继任者。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~75 分钟

## 学习目标

- 描述 Actor 模型：Agent 作为 Actor，消息是唯一的 IPC，每个 Actor 独立隔离故障。
- 说出 AutoGen v0.4 的三个 API 层级 — Core、AgentChat、Extensions — 以及各自的用途。
- 解释为什么将消息投递与处理解耦能够实现故障隔离和自然并发。
- 使用 Python 实现一个基于 stdlib 的 Actor Runtime，并将一个双 Agent 代码审查流程迁移到其中。

## 问题

大多数 Agent 框架都是同步的：一个 Agent 生成内容，另一个 Agent 在同一个调用栈中消费内容。故障会导致整个调用栈崩溃。并发是后期附加的功能。分布式部署则需要重写实现。

AutoGen v0.4 的答案是 Actor 模型。每个 Agent 都是一个拥有私有 inbox 的 Actor。消息是唯一的交互方式。Runtime 将消息投递与处理解耦。故障被隔离在单个 Actor 内。并发是原生能力。分布式部署只是使用不同的 transport。

## 概念

### Actor

一个 Actor 包含：

- 私有 state（外部绝不能直接访问）。
- inbox（消息队列）。
- handler：`receive(message) -> effects`，其中 effects 可以是“回复”“发送给其他 Actor”“创建新 Actor”“更新 state”或“停止自身”。

两个 Actor 不能共享内存。它们只能发送消息。

### 三个 API 层级

AutoGen v0.4 将其功能界面划分为三层：

1. **Core。** 底层 Actor 框架。`AgentRuntime`、`Agent`、`Message`、`Topic`。支持异步消息交换和事件驱动。
2. **AgentChat。** 任务驱动的高层 API（替代 v0.2 的 ConversableAgent）。`AssistantAgent`、`UserProxyAgent`、`RoundRobinGroupChat`、`SelectorGroupChat`。
3. **Extensions。** 集成层 — OpenAI、Anthropic、Azure、Tool、Memory。

### 解耦为何重要

在 v0.2 模型中，同步调用 `agent_a.chat(agent_b)` 会阻塞 agent_a，直到 agent_b 返回。在 v0.4 中，`send(agent_b, msg)` 会将消息放入 agent_b 的 inbox，然后立即返回。Runtime 稍后再进行投递。这会带来三个结果：

- **故障隔离。** Agent B 崩溃不会导致 Agent A 崩溃 — Runtime 会捕获 B 的 handler 中发生的故障，并决定如何处理（记录日志、重试或转入 dead-letter）。
- **自然并发。** 多条消息可以同时处于传输状态；各个 Actor 并发处理自己的 inbox。
- **为分布式部署做好准备。** 无论 Actor 位于进程内还是另一台主机上，inbox + transport 都是相同的抽象。

### 拓扑

- **RoundRobinGroupChat。** Agent 按照固定轮换顺序依次行动。
- **SelectorGroupChat。** selector Agent 根据对话 Context 选择下一个行动者。
- **Magentic-One。** 面向网页浏览、代码执行和文件处理的参考多 Agent 团队。构建于 AgentChat 之上。

### 可观测性

内置 OpenTelemetry 支持。每条消息都会发出一个 span；Tool 调用根据 2026 OTel GenAI semantic conventions（Lesson 23）携带 `gen_ai.*` 属性。

### 状态：维护模式

截至 2026 年初：AutoGen v0.7.x 在研究和原型设计场景中保持稳定。Microsoft 已将活跃开发工作转移到面向生产环境的继任者 Microsoft Agent Framework（2025 年 10 月 1 日公开预览；1.0 GA 原计划于 2026 年第一季度末发布）。AutoGen 模式能够顺利向前迁移 — Actor 模型才是持久有效的核心理念。

```figure
actor-mailbox
```

## 动手构建

`code/main.py` 实现了一个基于 stdlib 的 Actor Runtime：

- `Message` — 带有 `sender`、`recipient`、`topic`、`body` 的类型化 payload。
- `Actor` — 抽象类型，包含 `receive(message, runtime)`。
- `Runtime` — 包含共享队列、消息投递和故障隔离的事件循环。
- 一个双 Actor 演示：`ReviewerAgent` 审查代码，`ChecklistAgent` 执行 checklist；二者持续交换消息，直到达成共识。

运行：

```
python3 code/main.py
```

trace 展示了消息投递、单个 Actor 中不会导致另一个 Actor 崩溃的模拟故障，以及二者如何收敛到共同结论。

## 实际使用

- **AutoGen v0.4/v0.7**（维护中）— 稳定适用于研究、原型设计和多 Agent 模式。
- **Microsoft Agent Framework** — 面向生产环境的继任者（2025 年 10 月公开预览）；通过更新后的 API 延续相同的 Actor 模型理念。
- **LangGraph swarm topology**（Lesson 13）— 通过共享 Tool handoff 实现的类似模式。
- **自定义 Actor Runtime** — 适用于需要特定 transport（NATS、RabbitMQ、gRPC）的场景。

## 交付成果

`outputs/skill-actor-runtime.md` 可针对给定的多 Agent 任务生成一个最小 Actor Runtime，以及一个团队模板（RoundRobin 或 Selector）。

## 练习

1. 添加 dead-letter queue：当 handler 抛出异常时，将失败消息暂存起来供人工检查。在你的 toy 实现中，DLQ 多久会被命中一次？
2. 实现 `SelectorGroupChat`：由 selector Actor 根据对话 state 选择由谁处理下一条消息。
3. 添加分布式 transport：将进程内队列替换为 JSON-over-HTTP server，使 Actor 可以运行在不同进程中。
4. 为每条消息接入一个 OTel span（或无操作的替代实现）。按照 Lesson 23 发出 `gen_ai.agent.name`、`gen_ai.operation.name`。
5. 阅读 AutoGen v0.4 的架构文章。将你的 toy 实现迁移到真正的 `autogen_core` API。你省略了哪些在生产环境中至关重要的内容？

## 关键术语

| Term | 人们通常怎么说 | 它实际表示什么 |
|------|----------------|------------------------|
| Actor | “Agent” | 私有 state + inbox + handler；不共享内存 |
| Message | “Event” | 类型化 payload；Actor 之间唯一的交互方式 |
| Inbox | “Mailbox” | 每个 Actor 独立的待处理消息队列 |
| Runtime | “Agent host” | 路由消息并隔离故障的事件循环 |
| Topic | “Channel” | Actor 之间具名的 publish-subscribe 路由 |
| Fault isolation | “Let it crash” | 一个 Actor 发生故障不会导致其他 Actor 崩溃 |
| RoundRobinGroupChat | “固定轮换团队” | Agent 按顺序轮流行动 |
| SelectorGroupChat | “按 Context 路由的团队” | selector 选择下一个行动者 |
| Magentic-One | “参考团队” | 面向网页 + 代码 + 文件的多 Agent 团队 |

## 延伸阅读

- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — 介绍重新设计的文章
- [LangGraph 概览](https://docs.langchain.com/oss/python/langgraph/overview) — 图结构的替代方案
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — AutoGen 默认发出的 span
