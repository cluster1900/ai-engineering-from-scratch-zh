# A2A 规定了什么

> A2A 为彼此看不到内部的 agent 定义了一个数据模型、一组操作和三种绑定，而把 agent 内部的一切留给实现。

你的 planner 需要在 commit `9f3c2e1` 上运行 `payments-api` 的单元测试。`test-runner` agent 在端口 41241 上做这项工作，它运行在平台团队拥有的一个容器里。你不能把它当作函数导入。你只能给它发请求，再读取返回的内容。

规范把这类 agent 描述为独立的 AI agent 系统，其内部可以隐藏 {{spec §1}}。读完本节后，你能说出这三层，陈述核心规则，并说出 A2A 在哪里止步。

## 规范中的三层 {#s-what-a2a-standardizes-three-layers-in-the-specification}

规范有三个相互独立的层 {{spec §1.3}}。

**数据模型：** 记录是什么。第 1 层把它们定义为 Protocol Buffer message {{spec §1.3}}，proto 文件具有规范效力 {{spec §1.4}}。

**操作：** 客户端能请求什么。第 2 层描述 `A2AService` 的十一个 RPC {{proto A2AService}}，与承载它们的协议分开 {{spec §1.3}}。

**绑定：** 字节如何传输。第 3 层把这些操作映射到 JSON-RPC、gRPC 和 HTTP+JSON {{spec §1.3}}。

客户端首先读取 `AgentCard`，通常位于 `/.well-known/agent-card.json` {{spec §8.2}}，用的是一个普通的 `GET`，它不属于那十一个操作。`test-runner` 的 card 列出了 `/a2a/jsonrpc` 和 `/a2a/rest`，[图](#fig-spec-layers)把它们背后的各层堆叠起来。

在虚线以下，`test-runner` 构建了协议没有规定的部分：一个 HTTP 路由器、一个请求处理器、一个任务存储和一个事件广播。§1.3 的图列出了一个 §3.1 从未定义的 Get Agent Card 操作（[冲突 D25](#s-ref-sources)），§1.4 写错了 proto 的路径（[冲突 D15](#s-ref-sources)）。

```figure
id: fig-spec-layers
kind: layers
title: the A2A stack for test-runner
claim: A2A defines the card, the bindings, the operations, and the objects, while test-runner's server parts and agent logic below the dashed line belong to its owner.
caption: Read from the planner down. Above the dashed line sit the three layers of spec §1.3 with test-runner's real paths from the captured agent cards. Below it are the kit's own parts, and dashed boxes mark what a production agent adds.
```

## 核心规则 {#s-what-a2a-standardizes-the-core-rules}

**agent 是不透明的：** agent 协同工作时不共享内部推理、计划或工具代码 {{spec §1.2}}，所以客户端只看到返回的内容。

**服务器选择回复方式：** 一条消息得到的回复要么是一个新的 `Task`，要么是一条直接的 `Message` {{spec §3.1.1}}。直接回复适合简单的交互，[SendMessage](#s-send-message) 一节展示了两种方式。

**服务器拥有任务：** 客户端不能为新任务提供 `taskId` {{spec §3.4.2}}，客户端只生成 `messageId` {{proto Message}}。

**任务处于九个状态之一：** `status.state` 保存一个 `TaskState` 值 {{proto TaskState}}，其中四个是终止状态，两个是中断状态。[Task、TaskStatus 和 TaskState](#s-task-and-task-state) 一节列出了全部九个。

**终止的任务不再改变：** 任何消息都不能再推动它，[CancelTask 与终止状态](#s-cancel-task-and-terminal-states)一节展示了这一点。

```rule
label: the end of a task
source: spec §3.1.1
---
A task in a terminal state takes no more messages. The terminal states are `TASK_STATE_COMPLETED`, `TASK_STATE_FAILED`, `TASK_STATE_CANCELED`, and `TASK_STATE_REJECTED`.
```

**结果由 artifact 承载：** 消息不应承载任务的输出 {{spec §3.7}}，所以 planner 从 `summary.json` 读取测试数量。

**事件按顺序到达：** 每个实现都必须按事件的创建顺序投递事件 {{spec §3.5.2}}。重新连接的客户端用 `GetTask` 确认状态 {{spec §3.7}}。

**凭据放在 HTTP header 中传输：** 客户端在每个 A2A 请求中把凭据放进传输层的 header 或 metadata {{spec §7.3}}。所以 planner 在发给 `deployer` 的每个请求中都带上 `Authorization: Bearer`。

## 与 MCP 的边界 {#s-what-a2a-standardizes-the-boundary-with-mcp}

MCP 把 agent 连接到它的工具和资源，A2A 把 agent 彼此连接起来 {{docs a2a-and-mcp}}。1.0 的发布公告把它概括为：MCP 在 agent 内部工作，A2A 在 agent 之间工作 {{docs announcing-1.0}}。没有哪张 card 会列出工具：`test-runner` card 上的 `run-tests` skill 描述了这项工作，仅此而已。[MCP 基础](phases/13-tools-and-protocols/06-mcp-fundamentals)讲解另一个协议。

## A2A 留给宿主的部分 {#s-what-a2a-standardizes-what-a2a-leaves-to-the-host}

A2A 没有定义注册中心：规范没有为精选注册中心规定标准 API {{docs agent-discovery}}。它不签发凭据，因为身份由传输层处理，而不是 A2A 本身 {{spec §7}}。它不规定保留期限，所以一个任务 id 可能无效、已过期，或者已完成并被删除 {{spec §3.3.2}}。它不保证恰好一次的效果，因为 Send Message 操作可以是幂等的，但不必是 {{spec §3.3.1}}。此外，webhook 至少会得到一次尝试 {{spec §4.3.3}}。[图](#fig-guarantees)把每项保证与宿主的工作配成一对。

```figure
id: fig-guarantees
kind: comparison
title: what A2A guarantees and what the host builds
claim: A2A fixes the messages, states, and events between agents, while trust, discovery, retention, and exactly-once effects stay with the host.
caption: Read across each row, one row per step. The left box is what the specification guarantees, and the grey box beside it is what you build. No capture: the rows come from spec §1, §3.3.1, §3.4.1, §3.7, §4.3.3, §7, §8.2, and §13.1.
```

规范还在十处会影响你代码的地方自相矛盾，下表列出了它们，[来源参考](#s-ref-sources)给出了结论。

| 冲突 | 哪里不一致 |
|---|---|
| [D1](#s-ref-sources) | `SubscribeToTask` 的 HTTP 方法 |
| [D2](#s-ref-sources) | 普通的 `SendMessage` 是否等待 |
| [D3](#s-ref-sources) | 流是否在中断状态时关闭 |
| [D4](#s-ref-sources) 和 [D5](#s-ref-sources) | 推送配置对象的名称 |
| [D6](#s-ref-sources) | card 的安全字段名 |
| [D11](#s-ref-sources) | 已弃用的 OAuth flow |
| [D12](#s-ref-sources) | `ListTasks` 的分页字段名 |
| [D13](#s-ref-sources) | HTTP+JSON 的错误 body |
| [D36](#s-ref-sources) | 访问另一个客户端的任务时返回的错误 |

```takeaways
- 针对操作和对象构建客户端，并把每种绑定放在一个模块中。
- 把远程 agent 端点背后的一切都视为私有。
- 为每条消息生成新的 `messageId`，从 artifact 读取结果，并在 HTTP header 中发送凭据。
```

Sources: spec §1, §1.2, §1.3, §1.4, §3.1.1, §3.3.1, §3.3.2, §3.4.1, §3.4.2, §3.5.2, §3.7, §4.3.3, §7, §7.3, §8.2, §13.1 (research/sources/specification.md); proto A2AService, Message, TaskState (research/sources/a2a.proto); docs a2a-and-mcp, announcing-1.0, agent-discovery (research/sources/docs.md); capture/a2a_ref.py, capture/planner.py; capture/out/01-agent-cards.http, 03-blocking-task.http, 10-cancel.http, 19-planner.http
