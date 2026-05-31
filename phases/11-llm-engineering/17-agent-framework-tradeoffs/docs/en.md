# Agent Framework 取舍 — LangGraph vs CrewAI vs AutoGen vs Agno

> 每个 framework 都在卖同一个 demo（research agent 构建报告），也都藏着同一个 bug（state schema 和 orchestration layer 互相打架）。选择那个抽象与你的问题形状匹配的 framework；其余都是你要写两遍的 glue code。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 16 (LangGraph)
**Time:** ~45 minutes

## 问题

你有一个任务，需要不止一次 LLM call。也许它是一个 research workflow（plan、search、summarize、cite）。也许它是一个 code-review pipeline（parse diff、critique、patch、validate）。也许它是一个 multi-turn assistant，可以订机票、写邮件、提交报销。你选择了一个 framework。

三天后，你发现这个 framework 的抽象开始漏水。CrewAI 给你 roles，但当 “researcher” 需要把结构化 plan 交给 “writer” 时，它会和你较劲。AutoGen 给你 agents 之间的 chat，但没有一等 state，所以你的 checkpoint 只是 conversation log 的 pickle。LangGraph 给你 state graph，但会迫使你在还不知道 agent 会做什么之前，就命名每一条 transition。Agno 给你一个 single-agent abstraction，但当你想 fan out 到三个并发 worker 时，它会开始尖叫。

修复方式不是“选择最好的 framework”。而是把 framework 的核心抽象匹配到你的问题形状。本课会画出这张地图。

## 概念

![Agent framework 矩阵：核心抽象 vs 问题形状](../assets/framework-matrix.svg)

四个 framework 主导着 2026 年的 landscape。它们的核心抽象并不相同。

| Framework | 核心抽象 | 最适合 | 最不适合 |
|-----------|----------|--------|----------|
| **LangGraph** | `StateGraph` — typed state、nodes、conditional edges、checkpointer。 | 有显式 state 和 human-in-the-loop interrupts 的 workflows；需要 time-travel debugging 的 production agents。 | 拓扑未知、由 role 驱动的松散 brainstorming。 |
| **CrewAI** | `Crew` — roles（goal、backstory）、tasks、process（sequential 或 hierarchical）。 | 有短线性/层级 plan 的 role-playing 或 persona-driven workflows。 | 超出 crew turn history 的任何 stateful 场景；复杂 branching。 |
| **AutoGen** | `ConversableAgent` pair — 两个或更多 agents 轮流说话，直到满足 exit condition。 | Multi-agent *dialogue*（teacher-student、proposer-critic、actor-reviewer），其中思考从 chat 中涌现。 | 有已知 DAG 的 deterministic workflows；任何需要跨重启 durable state 的场景。 |
| **Agno** | `Agent` — 单个 LLM + tools + memory，可组合成 teams。 | 快速构建 single agents 和 lightweight teams；强 Multimodality 和内置 storage drivers。 | 带 custom reducers 的深度、显式分支 graphs。 |

### “抽象”到底是什么意思

一个 framework 的核心抽象，就是你在 whiteboard 上讲 architecture 时画出来的东西。

- **LangGraph** → 你画一个 graph。Nodes 是步骤，edges 是 transitions，每一点的 state object 都是 typed。mental model 是 state machine。
- **CrewAI** → 你画一个 org chart。每个 role 有 job description，manager 路由 tasks。mental model 是一个小型专家团队。
- **AutoGen** → 你画一个 Slack DM。两个 agents 互相发消息；如果需要 moderator，第三个加入。mental model 是 chat。
- **Agno** → 你画一个单独的 box，旁边挂着 tools。把多个 box 放在一起就是 team。mental model 是“自带全套功能的 agent”。

### State 问题

State 是大多数 framework 选择在 production 中崩掉的地方。

- **LangGraph.** Typed state（`TypedDict` 或 Pydantic model）、per-field reducers、一等 checkpointer（SQLite/Postgres/Redis）。Resume、interrupt 和 time-travel 都是免费的。*（见 Phase 11 · 16。）*
- **CrewAI.** State 通过 `context` field 以字符串形式在 tasks 之间流动，或通过 `output_pydantic` 结构化传递。开箱没有 durable per-crew store；如果 crew 必须在重启后存活，你需要自己接上。
- **AutoGen.** State 是 chat history 和任何 user-defined `context`。Conversation transcripts 可以持久化；任意 workflow state 不会持久化，除非你写 adapters。
- **Agno.** 内置 storage drivers（SQLite、Postgres、Mongo、Redis、DynamoDB），通过 `storage=` 挂到 `Agent` 上 — conversation sessions 和 user memories 会自动持久化。它不是完整 graph checkpointer；而是 session store。

### Branching 问题

每个非平凡 agent 都会 branching。谁来决定 branch 很重要。

- **LangGraph** — 由你决定，通过 conditional edges。Routing 是带命名 branches 的 Python function。Branches 是 compiled graph 中的一等对象；checkpointer 会记录采取了哪条 branch。
- **CrewAI** — hierarchical mode 中由 manager 决定；sequential mode 中由你在构建时决定。Routing 隐含在 task list 中；除了 manager 的 prompt 外，没有一等的 “if”。
- **AutoGen** — agents 通过 chat 决定。Branching 从下一个发言者中涌现。`GroupChatManager` 选择 next speaker；你可以手写 `speaker_selection_method`，但默认由 LLM 驱动。
- **Agno** — agent 通过下一步调用哪个 tool 来决定。Teams 有 coordinator/router/collaborator mode；超出这些的 branching 是 developer 的责任。

### Observability 问题

- **LangGraph** — 通过 LangSmith 或任何 OTel exporter 使用 OpenTelemetry。每个 node transition 都是 trace span；checkpoints 同时也是可 replay 的 traces。LangSmith 是 first-party 选项；Langfuse/Phoenix 也有 adapters。
- **CrewAI** — 自 2025 年末起一等支持 OpenTelemetry；集成 Langfuse、Phoenix、Opik、AgentOps。
- **AutoGen** — 通过 `autogen-core` 集成 OpenTelemetry；AgentOps 和 Opik 有 connectors。Tracing 粒度是 per-agent-message，不是 per-node。
- **Agno** — 内置 `monitoring=True` flag 加 OpenTelemetry exporters；与 Langfuse 深度集成，用于 session traces。

### Cost 和 latency

四个 framework 都会增加 per-call overhead（framework logic、validation、serialization）。按 overhead 递增的大致顺序：Agno ≈ LangGraph < CrewAI ≈ AutoGen。差异主要由 framework 做了多少额外 LLM routing 决定。CrewAI 的 hierarchical manager 会花 tokens 决定谁接下来执行；AutoGen 的 `GroupChatManager` 也是如此。LangGraph 只在你写 `llm.invoke` 的地方花 tokens。Agno 的 single-agent path 很薄。

当每次运行的 cost 重要时，优先选择 explicit routing（LangGraph edges、AutoGen `speaker_selection_method`），而不是 LLM-selected routing。

### Interoperability

- **LangGraph** ↔ **LangChain** tools、retrievers、LLMs。一等 MCP adapter（tools 作为 MCP servers 导入）。
- **CrewAI** ↔ tools 继承自 `BaseTool`；LangChain tools、LlamaIndex tools 和 MCP tools 都可以适配进来。通过 `allow_delegation=True` 做 crew-to-crew delegation。
- **AutoGen** → `FunctionTool` 包装任何 Python callable；有 MCP adapter。对 agent-to-agent patterns 与 AG2 ecosystem 紧密耦合。
- **Agno** → `@tool` decorator 或 BaseTool subclass；MCP adapter；tools 可以在 agents 和 teams 之间共享。

## 技能

> 你可以用一句话解释，为什么某个 framework 适合某个 agent 问题。

构建前 checklist：

1. **画出形状。** 这是 graph（typed state、named transitions）吗？Role play（specialists 交接工作）吗？Chat（agents 交谈直到完成）吗？还是带 tools 的 single agent？
2. **决定谁来 branching。** Developer-decided branching → LangGraph。Manager-agent-decided → CrewAI hierarchical。Chat-emergent → AutoGen。Tool-call-decided → Agno。
3. **检查 state budget。** 你是否需要 resume-from-checkpoint？Time-travel？Human interrupts mid-run？如果是，LangGraph 是默认选择；Agno sessions 覆盖 conversation-scoped state。
4. **检查 cost budget。** LLM-selected routing 每轮会额外花 tokens。如果 agent 每天运行数千次，优先选择 explicit routing。
5. **为 framework overhead 做预算。** 每个 framework 都是另一个 dependency。如果任务只是两次 LLM calls 和一个 tool，写 30 行 plain Python；没有任何 framework 比 no framework 更便宜。

在你能画出 graph、org chart、chat 或 agent box 之前，拒绝伸手拿 framework。也拒绝选择一个会迫使你为了真实需求而和它的 state model 对抗的 framework。

## 决策矩阵

| 问题形状 | 首选 framework | 原因 |
|----------|----------------|------|
| 带 typed state、human approvals、long-running 的 Workflow DAG | LangGraph | 一等 state、checkpointer、interrupts、time-travel。 |
| 有明确 roles 的 research / writing pipeline | CrewAI (sequential) 或 LangGraph subgraphs | 在 CrewAI 中表达 role-per-task 很便宜；当 branching 变复杂时用 LangGraph 扩展。 |
| Proposer-critic 或 teacher-student dialogue | AutoGen | Two-agent chat 是它的原生形状。 |
| 带 tools、sessions、memory 的 single agent | Agno | 设置最薄，内置 storage 和 memory。 |
| 带 reducers 的数千个 parallel fanouts | LangGraph + `Send` | 唯一拥有一等 parallel-dispatch API 的选择。 |
| 快速 prototype，不承诺 framework | Plain Python + provider SDK | 没有 framework 是最快的 framework。 |

## 练习

1. **Easy.** 取同一个任务 — “research Anthropic's headquarters, write a 200-word brief, cite sources” — 分别用 LangGraph（四个 nodes：plan、search、write、cite）和 CrewAI（三个 roles：researcher、writer、editor）实现。报告每次运行的 token cost 和代码行数。
2. **Medium.** 用 AutoGen（researcher ↔ writer chat，editor 通过 `GroupChat` 加入）和 Agno（带 `search_tools` 和 `write_tools` 的 single agent，再加 session store）构建同一任务。按 (a) 每次运行 cost，(b) crash 后 resume 能力，(c) 在 write step 前注入 human approval 的能力，对四个实现排序。
3. **Hard.** 构建一个 decision-tree script `pick_framework.py`，接受一个简短问题描述（JSON：`{has_typed_state, has_roles, has_dialogue, has_parallel_fanout, needs_resume}`），并返回推荐和一句话 justification。用你自己设计的六个 case 验证它。

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| Orchestration | “agents 如何协调” | 决定下一个运行哪个 node/role/agent 的 layer。 |
| Durable state | “重启后 resume” | 附着到 checkpoint 或 session store 上、能在 process death 后存活的 state。 |
| LLM-selected routing | “让 model 决定” | planner LLM 每轮选择下一步；灵活，但每次决策都要花 tokens。 |
| Explicit routing | “Developer 决定” | Python function 或 static edge 选择下一步；便宜且可审计。 |
| Crew | “一个 CrewAI team” | roles + tasks + process（sequential 或 hierarchical）绑定成一个 runnable。 |
| GroupChat | “AutoGen 的 multi-agent chat” | N 个 agents 之间由 speaker selector 管理的 conversation。 |
| Team (Agno) | “Multi-agent Agno” | 对一组 agents 使用 route / coordinate / collaborate mode。 |
| StateGraph | “LangGraph 的 graph” | typed-state、node、conditional-edge、checkpointer abstraction。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) — StateGraph、checkpointers、interrupts、time-travel。
- [CrewAI documentation](https://docs.crewai.com/) — Crews、Flows、Agents、Tasks、Processes。
- [AutoGen documentation](https://microsoft.github.io/autogen/) — ConversableAgent、GroupChat、teams、tools。
- [Agno documentation](https://docs.agno.com/) — Agent、Team、Workflow、storage、memory。
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) — 与 framework 无关的 pattern library（prompt chaining、routing、parallelization、orchestrator-workers、evaluator-optimizer）。
- [Yao et al., "ReAct: Synergizing Reasoning and Acting" (ICLR 2023)](https://arxiv.org/abs/2210.03629) — 每个 framework 都会包装起来的 loop。
- [Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" (2023)](https://arxiv.org/abs/2308.08155) — AutoGen 的 design paper。
- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023)](https://arxiv.org/abs/2304.03442) — CrewAI 风格 persona stacks 建立其上的 role-play foundation。
- Phase 11 · 16 (LangGraph) — 本课用来 benchmark 的 framework。
- Phase 11 · 19 (Reflexion) — 一个能干净映射到 LangGraph、但映射到 CrewAI 会很别扭的 pattern。
- Phase 11 · 22 (Production observability) — 如何 instrument 你选择的任何 framework。
