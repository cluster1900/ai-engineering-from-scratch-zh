# Multi-Agent Primitive Model

> 2026 年发布的每个 multi-agent framework —— AutoGen、LangGraph、CrewAI、OpenAI Agents SDK、Microsoft Agent Framework —— 都是四维设计空间中的一个点。四个 primitives，仅此而已：agent、handoff、shared state、orchestrator。本课从零构建它们，在四者之上运行一个玩具系统，然后把每个主流 framework 映射到同一组坐标轴上，让你能用一段话读懂任何新发布版本。

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 (Agent Engineering), Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

## 问题
每六个月就会有一个新的 multi-agent framework 发布。2023 年的 AutoGen。2024 年的 CrewAI。2024 年的 LangGraph 和 OpenAI Swarm。2025 年 4 月的 Google ADK。2026 年 2 月的 Microsoft Agent Framework RC。每一份 press release 都声称自己是“正确的 abstraction”。

如果你试图逐个学习它们，你会筋疲力尽。APIs 看起来不同。docs 对“agent”是什么说法不一。一个 framework 把它的 shared memory 称为“blackboard”，另一个称为“message pool”，第三个称为“StateGraph”。你开始怀疑这个领域只是在反复翻新。

并非如此。营销包装之下，四个 primitives 是稳定的。学一次，就能用一段话读懂每个新 framework。

## 概念
### The four primitives

1. **Agent** — 一个 system prompt 加一个 tool list。无状态；每次运行都从它的 system prompt 和当前 message history 开始。
2. **Handoff** — 控制权从一个 agent 到另一个 agent 的结构化转移。机制上，可以是返回新 agent 的 tool call，也可以是遵循某个条件的 graph edge。
3. **Shared state** — 任何能被多个 agent 读取（有时也能写入）的数据结构。Message pool、blackboard、key-value store、vector memory。
4. **Orchestrator** — 决定下一个由谁发言的角色。选项包括：显式 graph（确定性）、LLM speaker-selector（soft）、上一位 speaker 的 handoff call（OpenAI Swarm），或 queue 上的 scheduler（swarm architecture）。

这就是完整的设计空间。每个 framework 都为每个轴选择默认值；其余只是表层语法。

### How every 2026 framework maps to it

| Framework | Agent | Handoff | Shared state | Orchestrator |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | tool returns Agent | caller's problem | the LLM's next handoff call |
| AutoGen v0.4 / AG2 | `ConversableAgent` | speaker-selector on GroupChat | message pool | selector function (LLM or round-robin) |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | Task outputs chained | manager LLM or static order |
| LangGraph | node function | graph edge + condition | `StateGraph` reducer | the graph, deterministic |
| Microsoft Agent Framework | agent + orchestration patterns | pattern-specific | thread / context | pattern-specific |
| Google ADK | agent + A2A card | A2A task | A2A artifacts | host decides |

表层差异看起来很大。底层：同样四个旋钮。

### Why this matters

一旦看清 primitives，framework comparison 就变成一份简短 checklist：

- orchestrator 是信任 LLM 来 route（Swarm），还是把 routing 固定在 code 中（LangGraph）？
- shared state 是 full-history（GroupChat），还是 projected（StateGraph reducer）？
- agents 能修改彼此的 prompts（CrewAI manager），还是只能 hand off（Swarm）？

这三个问题能回答某个 framework 是否适合特定问题的 80%。你不再寻找“最好的 multi-agent framework”，而是开始围绕真正关心的轴来设计。

### The stateless insight

除了 shared state 之外，每个 primitive 都是无状态的。Agent 是 (prompt, tools) 的函数。Handoff 是一次 function call。Orchestrator 是 scheduler。**系统中唯一有状态的东西是 shared state。** 所有有趣的 bugs 都住在那里：memory poisoning（Lesson 15）、message ordering、versioning、write contention。

隐藏 shared state 的 frameworks（Swarm）会把问题推给 caller。集中管理 shared state 的 frameworks（LangGraph checkpoint、AutoGen pool）让它可检查，但会把 coordination cost 转移到 shared-state implementation 上。

### Anatomy of a single primitive

#### Agent

```
Agent = (system_prompt, tools, model, optional_name)
```

没有 memory。没有 state。拥有相同 system prompt 和 tools 的两个 agents 是可互换的。任何看起来像 per-agent state 的东西，实际上都在 shared state 或 handoff protocol 中。

#### Handoff

```
Handoff = (from_agent, to_agent, reason, payload)
```

三种实现占主导：

- **Function return** — tool 返回下一个 agent。这是 OpenAI Swarm pattern。Agents 在自己的 tool schemas 中携带 routing。
- **Graph edge** — LangGraph。Edges 是声明式的。LLM 生成一个 value；condition 选择下一个 node。
- **Speaker selection** — AutoGen GroupChat。selector function（有时它本身也是一次 LLM call）读取 pool 并选择下一位发言者。

#### Shared state

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

至少是一个 messages 列表。通常更多：structured artifacts（CrewAI Task outputs）、typed context（LangGraph reducers）、external memory（MCP、vector DB）。

两种 topologies：**full pool**（每个 agent 都看到每条 message）和 **projected**（agents 看到按 role scoped 的 view）。Full pools 简单但扩展性差。Projected pools 可扩展，但需要预先设计 schema。

#### Orchestrator

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

四种风格：

- **Static** — graph 在 build time 固定（LangGraph deterministic、CrewAI Sequential）。
- **LLM-selected** — LLM 读取 pool 并选择下一位 speaker（AutoGen、CrewAI Hierarchical）。
- **Handoff-driven** — 当前 agent 通过调用 handoff tool 来决定（Swarm）。
- **Queue-driven** — workers 从 shared queue 拉取任务；没有显式 next-speaker（swarm architectures、Matrix）。

### What changes between frameworks

一旦 primitives 固定，剩余的设计决策就是：

- **Memory strategy** — ephemeral vs durable checkpointing（LangGraph checkpointer）。
- **Safety boundary** — 谁可以批准 handoff（human-in-the-loop）。
- **Cost accounting** — per-agent Token budgets。
- **Observability** — tracing handoffs，为 replay 持久化 state。

所有这些都可以在 primitives 之上实现。它们都不是新的 primitives。

## 构建它
`code/main.py` 用约 150 行 stdlib Python 实现四个 primitives。没有真正的 LLM —— 每个 agent 都是一个 scripted policy，因此重点保持在 coordination structure 上。

该文件导出：

- `Agent` — 包含 name、system prompt、tools、policy function 的 dataclass。
- `Handoff` — 返回新 agent 的 function。
- `SharedState` — thread-safe message pool。
- `Orchestrator` — 三个变体：`StaticOrchestrator`、`HandoffOrchestrator`、`LLMSelectorOrchestrator`（simulated）。

demo 通过所有三种 orchestrator types 运行同一个三 agent pipeline（research → write → review），并在最后打印 message pool。你可以看到，输出差异只在于 *who picks next*；agents 和 shared state 在每次运行中完全相同。

运行它：

```
python3 code/main.py
```

预期输出：三次 orchestrator runs，每种 pattern 一次。每次都会打印最终 message pool。如果 researcher 判断已经提前完成，handoff-driven run 会到达更少的 agents —— 这就是 LLM-routing tradeoff 的微缩版。

## 使用它
`outputs/skill-primitive-mapper.md` 是一个 skill，它读取任何 multi-agent codebase 或 framework doc，并返回 four-primitive mapping。在新的 framework release 上运行它，即可在深入阅读 docs 前获得一段话的理解。

## 交付它
在采用新 framework 前，先为它写出 primitive mapping。如果写不出来，说明 docs 不完整，或者该 framework 正在发明第五个 primitive（少见 —— 检查是否只是你没见过的 shared-state flavor）。

把 mapping 固定在你的 architecture doc 中。当新 team member 加入时，先把 mapping 发给他们，再发 API docs。当 framework versions 变化时，对比 mapping，而不是 changelog。

## 练习
1. 用不同的 agent policies 运行 `code/main.py` 三次。观察 orchestrator choice 如何改变哪些 agents 会运行。
2. 实现第四种 orchestrator type：queue-driven，其中 agents 轮询 shared state 寻找工作。可能发生什么 deadlock，你如何检测它？
3. 取 LangGraph quickstart (https://docs.langchain.com/oss/python/langgraph/workflows-agents)，把它改写成四个 primitives。LangGraph 的哪些 abstractions 是 1:1 映射，哪些是 convenience wrappers？
4. 阅读 OpenAI Swarm cookbook (https://developers.openai.com/cookbook/examples/orchestrating_agents)。识别 Swarm 让四个 primitives 中哪一个最 ergonomic，以及它把哪一个推给 caller。
5. 在此表中找一个完全隐藏 shared state 的 framework。解释当 agents 需要跨 handoffs 协调且不重新读取 history 时，什么会出问题。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | “一个带 tools 的 LLM” | 一个 `(system_prompt, tools, model)` triple。无状态。 |
| Handoff | “控制权转移” | 一个结构化 call，命名下一个 agent 和可选 payload。三种实现：function return、graph edge、speaker selection。 |
| Shared state | “Memory” / “context” | multi-agent system 中唯一有状态的部分。Message pool 或 blackboard。 |
| Orchestrator | “Coordinator” | 决定下一个运行者的人或机制。Static graph、LLM selector、handoff-driven，或 queue-driven。 |
| Primitive | “Abstraction” | 每个 framework 都会参数化的四个轴之一。不是 framework feature。 |
| Message pool | “Shared chat history” | Full-history shared state。容易推理，扩展性差。 |
| Projected state | “Scoped view” | 面向特定 role 的 shared state view。可扩展，需要 schema design。 |
| Speaker selection | “下一个谁说话” | 一种 orchestrator pattern，其中一个 function（通常是 LLM）从 group 中选择下一个 agent。 |

## 延伸阅读
- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) — 对 handoff-driven orchestration 最清晰的阐述
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/) — GroupChat + speaker selection 是 LLM-selected orchestration 的参考实现
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — graph-edge orchestration 和基于 reducer 的 shared state
- [CrewAI introduction](https://docs.crewai.com/en/introduction) — role-goal-backstory agents，Sequential / Hierarchical processes
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2) — Microsoft 将 v0.4 转入 maintenance 后仍在活跃的 AutoGen v0.2 线
