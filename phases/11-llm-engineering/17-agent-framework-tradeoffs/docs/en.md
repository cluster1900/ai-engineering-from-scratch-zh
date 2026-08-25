# Agent 框架权衡——图、角色与 Actor 编排

> 每个框架都在展示同一种 Demo（研究 Agent 生成报告），也都隐藏着同一种 bug（状态 schema 与编排层相互冲突）。选择核心抽象与问题形态相匹配的框架；其他所有部分都只是你要写两遍的胶水代码。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 16 (LangGraph)
**Time:** ~45 分钟

## 问题

你有一项需要多次调用 LLM 的任务。它可能是研究工作流（计划、搜索、总结、引用），可能是代码审查流水线（解析 diff、批评、修补、验证），也可能是一个负责预订航班、撰写邮件和提交费用报告的多轮 assistant。于是你选择了一个框架。

三天后，你发现框架的抽象开始泄漏。CrewAI 提供了角色，但当“researcher”需要把结构化计划交给“writer”时，它却处处掣肘。AutoGen 支持 Agent 之间聊天，但没有一等的状态，因此你的 Checkpoint 只是序列化对话日志得到的 pickle。LangGraph 提供状态图，却迫使你在还不知道 Agent 将做什么之前，就为每次转换命名。Agno 提供单 Agent 抽象，但当你尝试 fanout 到三个并发 worker 时，它就难以应对。

解决办法不是“选择最好的框架”，而是让框架的核心抽象与问题的形态匹配。本课将绘制这张地图。

## 概念

![Agent 框架Matrix：核心抽象与问题形态](../assets/framework-matrix.svg)

四个框架主导着 2026 年的格局。它们的核心抽象并不相同。

| 框架 | 核心抽象 | 最适合 | 最不适合 |
|------|----------|--------|----------|
| **LangGraph** | `StateGraph`——类型化状态、节点、条件边、checkpointer。 | 具有显式状态和 human-in-the-loop 中断的工作流；需要时间回溯调试的生产级 Agent。 | 拓扑结构未知、由角色驱动的自由头脑风暴。 |
| **CrewAI** | `Crew`——角色（目标、背景故事）、任务、流程（顺序或分层）。 | 具有简短线性或分层计划的角色扮演或 persona 驱动工作流。 | 超出 crew 回合历史的任何有状态场景；复杂分支。 |
| **AutoGen** | `ConversableAgent` pair——两个或更多 Agent 轮流发言，直到满足退出条件。 | 思考过程从聊天中涌现的多 Agent *对话*（teacher-student、proposer-critic、actor-reviewer）。 | 具有已知 DAG 的确定性工作流；任何需要跨重启持久化状态的场景。 |
| **Agno** | `Agent`——单个 LLM + Tools + memory，可组合为 team。 | 快速构建的单 Agent 和轻量级 team；强大的 Multimodal 能力和内置存储 driver。 | 具有自定义 reducers 的深层显式分支图。 |

### “抽象”的实际含义

框架的核心抽象，就是你在白板上介绍架构时画出的东西。

- **LangGraph** → 你画一张图。节点是步骤，边是转换，每个位置的状态对象都有明确类型。它的思维模型是状态机。
- **CrewAI** → 你画一张组织结构图。每个角色都有职位描述，由 manager 路由任务。它的思维模型是一支小型专家团队。
- **AutoGen** → 你画一个 Slack DM。两个 Agent 互发消息；需要 moderator 时再让第三个加入。它的思维模型是聊天。
- **Agno** → 你画一个连接着 Tools 的方框。将多个方框并排放置即可组成 team。它的思维模型是“开箱即用的 Agent”。

### 状态问题

大多数框架选择都会在生产环境中因状态问题而崩溃。

- **LangGraph。** 类型化状态（`TypedDict` 或 Pydantic model）、逐字段 reducers、一等 checkpointer（SQLite/Postgres/Redis）。恢复、中断和时间回溯都是内置能力。*（参见 Phase 11 · 16。）*
- **CrewAI。** 状态通过 `context` 字段以字符串形式在任务间流动，或者通过 `output_pydantic` 以结构化形式流动。默认没有持久化的 per-crew 存储；如果 crew 必须在重启后继续运行，你需要自行添加。
- **AutoGen。** 状态是聊天历史和用户定义的 `context`。对话记录可以持久化；任意工作流状态则不行，除非你编写 adapter。
- **Agno。** 通过 `storage=` 将内置存储 driver（SQLite、Postgres、Mongo、Redis、DynamoDB）连接到 `Agent`——对话 session 和用户 memory 会自动持久化。它不是完整的图 checkpointer，而是 session 存储。

### 分支问题

每个非平凡 Agent 都会产生分支。关键在于由谁决定分支。

- **LangGraph**——由你通过条件边决定。路由是一个包含命名分支的 Python 函数。分支是已编译图中的一等元素；checkpointer 会记录选择了哪个分支。
- **CrewAI**——在 hierarchical 模式下由 manager 决定；在 sequential 模式下由你在构建时决定。路由隐含在任务列表中；除了 manager 的 Prompt，没有一等的“if”。
- **AutoGen**——由 Agents 通过聊天决定。分支根据下一个发言者涌现。`GroupChatManager` 选择下一个发言者；你可以手写 `speaker_selection_method`，但默认由 LLM 驱动。
- **Agno**——Agent 根据接下来调用哪个 Tool 决定。Team 具有 coordinator/router/collaborator 模式；除此之外的分支由开发者负责。

### 可观测性问题

- **LangGraph**——通过 LangSmith 或任意 OTel exporter 使用 OpenTelemetry。每次节点转换都是一个 trace span；Checkpoint 同时也是可以重放的 trace。LangSmith 是第一方方案；Langfuse/Phoenix 也提供 adapter。
- **CrewAI**——从 2025 年末开始将 OpenTelemetry 作为一等能力；集成 Langfuse、Phoenix、Opik、AgentOps。
- **AutoGen**——通过 `autogen-core` 集成 OpenTelemetry；AgentOps 和 Opik 提供 connector。追踪粒度是每条 Agent 消息，而不是每个节点。
- **Agno**——内置 `monitoring=True` 标志和 OpenTelemetry exporter；与 Langfuse 紧密集成，用于 session trace。

### 成本和延迟

四个框架都会为每次调用增加开销（框架逻辑、验证、序列化）。按开销从低到高的大致顺序是：Agno ≈ LangGraph < CrewAI ≈ AutoGen。差异主要取决于框架执行了多少额外的 LLM 路由。CrewAI 的 hierarchical manager 会消耗 Token 来决定下一个执行者；AutoGen 的 `GroupChatManager` 也一样。LangGraph 只在你编写 `llm.invoke` 的地方消耗 Token。Agno 的单 Agent 路径很轻量。

当每次运行的成本很重要时，优先选择显式路由（LangGraph edges、AutoGen `speaker_selection_method`），而不是由 LLM 选择路由。

### 互操作性

- **LangGraph** ↔ **LangChain** Tools、retrievers、LLMs。提供一等 MCP adapter（以 MCP server 形式导入 Tools）。
- **CrewAI** ↔ Tools 继承自 `BaseTool`；LangChain Tools、LlamaIndex Tools 和 MCP Tools 都可以接入。通过 `allow_delegation=True` 在 crew 之间委派。
- **AutoGen** → `FunctionTool` 可以包装任意 Python callable；提供 MCP adapter。Agent 间模式与 AG2 生态系统紧密耦合。
- **Agno** → 使用 `@tool` decorator 或 BaseTool subclass；提供 MCP adapter；Tools 可以在 Agents 和 teams 之间共享。

## Skill

> 你能够用一句话解释，为什么某个框架适合某个 Agent 问题。

构建前检查清单：

1. **画出形态。** 这是图（类型化状态、命名转换）？角色扮演（专家移交工作）？聊天（Agents 交流直到完成）？还是配备 Tools 的单 Agent？
2. **决定由谁选择分支。** 开发者决定的分支 → LangGraph。Manager Agent 决定 → CrewAI hierarchical。聊天涌现 → AutoGen。Tool 调用决定 → Agno。
3. **检查状态预算。** 是否需要从 Checkpoint 恢复？时间回溯？运行中途的人工中断？如果需要，默认选择 LangGraph；Agno session 可以覆盖对话作用域内的状态。
4. **检查成本预算。** LLM 选择路由会在每个回合消耗额外 Token。如果 Agent 每天运行数千次，应优先选择显式路由。
5. **为框架开销制定预算。** 每个框架都会增加一个依赖。如果任务只是两次 LLM 调用和一个 Tool，编写 30 行普通 Python 即可；没有任何框架比不使用框架更便宜。

在能够画出图、组织结构图、聊天或 Agent 方框之前，拒绝使用框架。拒绝选择会迫使你为实际需求对抗其状态模型的框架。

## 决策Matrix

| 问题形态 | 首选框架 | 原因 |
|----------|----------|------|
| 具有类型化状态、人工批准和长时间运行需求的工作流 DAG | LangGraph | 一等状态、checkpointer、中断、时间回溯。 |
| 具有明确角色的研究/写作流水线 | CrewAI（sequential）或 LangGraph 子图 | 在 CrewAI 中，每个任务对应一个角色很容易表达；当分支变复杂时，使用 LangGraph 扩展。 |
| Proposer-critic 或 teacher-student 对话 | AutoGen | 双 Agent 聊天是它的原生形态。 |
| 具有 Tools、session 和 memory 的单 Agent | Agno | 配置最轻量，内置存储和 memory。 |
| 数千个带 reducers 的并行 fanout | LangGraph + `Send` | 唯一提供一等并行分派 API 的框架。 |
| 快速 prototype，不承诺使用任何框架 | 普通 Python + provider SDK | 不使用框架才是最快的框架。 |

```figure
l5-framework-fit
```

## 练习

1. **简单。** 使用同一项任务——“研究 Anthropic 总部，撰写一份 200 词的简报，并引用来源”——分别通过 LangGraph（四个节点：plan、search、write、cite）和 CrewAI（三个角色：researcher、writer、editor）实现。报告每次运行的 Token 成本和代码行数。
2. **中等。** 使用 AutoGen（researcher ↔ writer 聊天，editor 通过 `GroupChat` 加入）和 Agno（一个配备 `search_tools`、`write_tools` 和 session 存储的单 Agent）实现同一任务。按照以下维度对四种实现排序：(a) 每次运行成本；(b) 崩溃后恢复的能力；(c) 在写作步骤前插入人工批准的能力。
3. **困难。** 构建决策树脚本 `pick_framework.py`，接收简短的问题描述（JSON：`{has_typed_state, has_roles, has_dialogue, has_parallel_fanout, needs_resume}`），并返回建议和一句话理由。使用你自己设计的六个案例验证它。

## 关键术语

| 术语 | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Orchestration | “Agents 如何协调” | 决定下一个运行哪个节点、角色或 Agent 的层。 |
| Durable state | “重启后恢复” | 进程终止后仍然存在，并附加到 Checkpoint 或 session 存储的状态。 |
| LLM-selected routing | “让 Model 决定” | planner LLM 在每个回合选择下一步；灵活，但每次决策都会消耗 Token。 |
| Explicit routing | “开发者决定” | Python 函数或静态边选择下一步；成本低且可审计。 |
| Crew | “一个 CrewAI team” | 角色 + 任务 + 流程（sequential 或 hierarchical）绑定成一个可运行对象。 |
| GroupChat | “AutoGen 的多 Agent 聊天” | N 个 Agents 之间由发言者选择器管理的对话。 |
| Team (Agno) | “多 Agent Agno” | 在一组 Agents 上运行的 route / coordinate / collaborate 模式。 |
| StateGraph | “LangGraph 的图” | 类型化状态、节点、条件边和 checkpointer 抽象。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/)——StateGraph、checkpointers、interrupts、time-travel。
- [CrewAI documentation](https://docs.crewai.com/)——Crews、Flows、Agents、Tasks、Processes。
- [AutoGen documentation](https://microsoft.github.io/autogen/)——ConversableAgent、GroupChat、teams、tools。
- [Agno documentation](https://docs.agno.com/)——Agent、Team、Workflow、storage、memory。
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents)——与框架无关的模式库（prompt chaining、routing、parallelization、orchestrator-workers、evaluator-optimizer）。
- [Yao et al., "ReAct: Synergizing Reasoning and Acting" (ICLR 2023)](https://arxiv.org/abs/2210.03629)——每个框架都会包装的循环。
- [Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" (2023)](https://arxiv.org/abs/2308.08155)——AutoGen 的设计论文。
- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023)](https://arxiv.org/abs/2304.03442)——CrewAI 风格 persona 技术栈所依据的角色扮演基础。
- Phase 11 · 16 (LangGraph)——本课进行基准比较时使用的框架。
- Phase 11 · 19 (Reflexion)——一种可以自然映射到 LangGraph、却很难映射到 CrewAI 的模式。
- Phase 11 · 22 (Production observability)——如何为你选择的框架添加可观测性。
