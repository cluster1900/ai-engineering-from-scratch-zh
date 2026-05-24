# AutoGen v0.4：Actor Model 与 Agent Framework

> AutoGen v0.4（Microsoft Research，2025 年 1 月）围绕 actor model 重新设计了 agent orchestration。Async message exchange、event-driven agents、fault isolation、自然并发。该 framework 现在处于 maintenance mode，而 Microsoft Agent Framework（2025 年 10 月 public preview）正在成为其继任者。

**类型：** 学习 + 构建
**语言：** Python (stdlib)
**先修：** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**时间：** 约 75 分钟

## 学习目标

- 描述 actor model：agent 作为 actor，message 是唯一的 IPC，每个 actor 独立隔离故障。
- 说出 AutoGen v0.4 的三个 API 层级：Core、AgentChat、Extensions，以及各自用途。
- 解释为什么将 message delivery 与 handling 解耦会带来 fault isolation 和自然并发。
- 在 Python 中实现一个 stdlib actor runtime，并将一个双 agent code-review flow 移植到其上。

## 问题

大多数 agent framework 都是同步的：一个 agent 产生内容，一个 agent 消费内容，运行在一个 call stack 中。失败会让 stack 崩溃。并发是后来加上的。分布式需要重写。

AutoGen v0.4 的答案是：actor model。每个 agent 都是一个拥有私有 inbox 的 actor。Message 是唯一的交互方式。Runtime 将 delivery 与 handling 解耦。故障被隔离到单个 actor。并发是原生能力。分布式只是换一种 transport。

## 概念

### Actors

一个 actor 拥有：

- 私有 state（外部永远不能直接接触）。
- 一个 inbox（message queue）。
- 一个 handler：`receive(message) -> effects`，其中 effects 可以是“reply”、“send to other actor”、“spawn new actor”、“update state”、“stop self”。

两个 actor 不能共享 memory。它们只能发送 message。

### AutoGen v0.4 中的三个 API 层

1. **Core.** 底层 actor framework。`AgentRuntime`、`Agent`、`Message`、`Topic`。Async message exchange，event-driven。
2. **AgentChat.** 面向任务的高层 API（替代 v0.2 的 ConversableAgent）。`AssistantAgent`、`UserProxyAgent`、`RoundRobinGroupChat`、`SelectorGroupChat`。
3. **Extensions.** 集成：OpenAI、Anthropic、Azure、tools、memory。

### 为什么解耦很重要

在 v0.2 模型中，同步调用 `agent_a.chat(agent_b)` 会阻塞 agent_a，直到 agent_b 返回。在 v0.4 中，`send(agent_b, msg)` 会把 message 放入 agent_b 的 inbox，然后立即返回。Runtime 稍后 delivery。它带来三个结果：

- **Fault isolation.** Agent B 崩溃不会导致 Agent A 崩溃，runtime 会捕获 B 的 handler 中的失败，并决定如何处理（log、retry、dead-letter）。
- **自然并发。** 很多 message 可以同时在途；actor 并发处理自己的 inbox。
- **面向分布式。** 无论 actor 是 in-process 还是在另一台 host 上，inbox + transport 都是同一个抽象。

### 拓扑

- **RoundRobinGroupChat.** Agent 以固定轮转顺序轮流发言。
- **SelectorGroupChat.** Selector agent 根据 conversation context 选择下一位。
- **Magentic-One.** 用于 web browsing、code execution、file handling 的参考 multi-agent team。构建在 AgentChat 之上。

### 可观测性

内置支持 OpenTelemetry。每个 message 都会发出一个 span；tool call 根据 2026 OTel GenAI semantic conventions（Lesson 23）携带 `gen_ai.*` attributes。

### 状态：maintenance mode

2026 年初：AutoGen v0.7.x 对 research 和 prototyping 来说是稳定的。Microsoft 已将 active development 转向 Microsoft Agent Framework（2025 年 10 月 1 日 public preview；1.0 GA 目标为 2026 年 Q1 末）。AutoGen pattern 可以干净地向前移植，actor model 是持久的思想。

## 构建它

`code/main.py` 实现了一个 stdlib actor runtime：

- `Message`：带有 `sender`、`recipient`、`topic`、`body` 的类型化 payload。
- `Actor`：带有 `receive(message, runtime)` 的抽象。
- `Runtime`：带有共享 queue、delivery、fault isolation 的 event loop。
- 一个双 actor demo：`ReviewerAgent` review code，`ChecklistAgent` 运行 checklist；它们交换 message，直到达成 consensus。

运行：

```
python3 code/main.py
```

Trace 会展示 message delivery、某个 actor 中不会让另一个 actor 崩溃的模拟失败，以及它们收敛到共同 verdict 的过程。

## 使用它

- **AutoGen v0.4/v0.7**（maintenance）：适合 research、prototyping、multi-agent patterns。
- **Microsoft Agent Framework**（public preview）：未来路径；同样的 actor-model 思想，刷新后的 API。
- **LangGraph swarm topology**（Lesson 13）：通过 shared-tool handoff 实现类似 pattern。
- **Custom actor runtime**：当你需要特定 transport（NATS、RabbitMQ、gRPC）时。

## 交付它

`outputs/skill-actor-runtime.md` 会为给定的 multi-agent task 生成一个最小 actor runtime 和一个 team template（RoundRobin 或 Selector）。

## 练习

1. 添加 dead-letter queue：当 handler 抛出异常时，把失败 message 停放起来供人工检查。在你的 toy 中，DLQ 多久会被命中一次？
2. 实现 `SelectorGroupChat`：一个 selector actor 根据 conversation state 选择谁处理下一条 message。
3. 添加 distributed transport：把 in-process queue 替换为 JSON-over-HTTP server，让 actor 可以运行在独立进程中。
4. 为每条 message 接入一个 OTel span（或 no-op stand-in）。按 Lesson 23 发出 `gen_ai.agent.name`、`gen_ai.operation.name`。
5. 阅读 AutoGen v0.4 的 architecture post。把你的 toy 移植到真正的 `autogen_core` API。你跳过了哪些在 production 中重要的东西？

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Actor | "Agent" | 私有 state + inbox + handler；没有共享 memory |
| Message | "Event" | 类型化 payload；actor 交互的唯一方式 |
| Inbox | "Mailbox" | 每个 actor 的 pending message queue |
| Runtime | "Agent host" | 路由 message 并隔离失败的 event loop |
| Topic | "Channel" | actor 之间命名的 publish-subscribe route |
| Fault isolation | "Let it crash" | 一个 actor 失败不会让其他 actor 崩溃 |
| RoundRobinGroupChat | "固定轮转 team" | Agent 按顺序轮流行动 |
| SelectorGroupChat | "按 context 路由的 team" | Selector 选择下一位 |
| Magentic-One | "参考 team" | 用于 web + code + files 的 multi-agent squad |

## 延伸阅读

- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — redesign 文章
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — graph-shaped alternative
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — AutoGen 默认发出的 span
