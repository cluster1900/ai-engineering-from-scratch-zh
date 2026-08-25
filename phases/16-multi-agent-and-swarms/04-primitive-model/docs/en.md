# Multi-Agent Primitive Model

> 只有四种 primitive，不多不少——Agent、handoff、shared state、orchestrator——它们构成了一个四维设计空间，而 2026 年发布的主要 multi-Agent framework（AutoGen、LangGraph、CrewAI、OpenAI Agents SDK、Microsoft Agent Framework）都是这个空间中的点。本课将从零构建这些 primitive，在一个简单系统中运行全部四种 primitive，再将每个主要 framework 映射到相同坐标轴上，使你只需阅读一个段落便能理解任何新版本。

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14（Agent Engineering），Phase 16 · 01（为何需要 Multi-Agent）
**Time:** ~60 分钟

## 问题

每隔六个月就会出现一个新的 multi-Agent framework。2023 年的 AutoGen，2024 年的 CrewAI，2024 年的 LangGraph 和 OpenAI Swarm，2025 年 4 月的 Google ADK，以及 2026 年 2 月的 Microsoft Agent Framework RC。每篇新闻稿都声称自己是“正确的 abstraction”。

如果你试图逐一学习它们，很快就会精疲力竭。API 看起来各不相同。文档对“Agent”的定义也存在分歧。一个 framework 将共享 memory 称为“blackboard”，另一个称为“message pool”，第三个则称为“StateGraph”。你开始怀疑这个领域只是在不断制造新名词。

事实并非如此。在营销术语之下，四种 primitive 始终保持稳定。只需学习一次，就能通过一个段落理解每个新 framework。

## 概念

### 四种 primitive

1. **Agent**——一个 system Prompt 加上一组 Tool。无状态；每次运行都从其 system Prompt 和当前消息历史开始。
2. **Handoff**——将控制权从一个 Agent 结构化转移到另一个 Agent。从机制上看，它是返回新 Agent 的 Tool call，或者根据条件选择的图 edge。
3. **Shared state**——任何可由多个 Agent 读取（有时也可写入）的数据结构。Message pool、blackboard、key-value store、Vector memory。
4. **Orchestrator**——决定下一个发言者的主体。可选方式包括：显式图（确定性）、LLM speaker-selector（柔性）、上一位发言者的 handoff call（OpenAI Swarm），或者基于队列的 scheduler（swarm architecture）。

这就是完整的设计空间。每个 framework 都会为每个坐标轴选择默认值，其余都只是表层语法。

### 2026 年各 framework 如何映射到这些 primitive

| Framework | Agent | Handoff | Shared state | Orchestrator |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | Tool 返回 Agent | 由调用方负责 | LLM 的下一次 handoff call |
| AutoGen v0.4 / AG2 | `ConversableAgent` | GroupChat 上的 speaker-selector | message pool | selector function（LLM 或 round-robin） |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | 串联的 Task 输出 | Manager LLM 或静态顺序 |
| LangGraph | node function | 图 edge + condition | `StateGraph` reducer | 图，具有确定性 |
| Microsoft Agent Framework | Agent + orchestration pattern | 特定于 pattern | thread / Context | 特定于 pattern |
| Google ADK | Agent + A2A card | A2A Task | A2A artifact | 由 host 决定 |

表层差异看起来很大。其底层仍然是相同的四个旋钮。

### 这为什么重要

一旦看清这些 primitive，framework 比较就会变成一份简短的检查清单：

- Orchestrator 是信任 LLM 进行路由（Swarm），还是在代码中固定路由（LangGraph）？
- Shared state 是完整历史（GroupChat），还是经过投影的状态（StateGraph reducer）？
- Agent 能否修改彼此的 Prompt（CrewAI Manager），还是只能 handoff（Swarm）？

这三个问题足以回答某个 framework 是否适合给定问题时 80% 的关键判断。你不再寻找“最好的 multi-Agent framework”，而是开始围绕真正重要的坐标轴进行设计。

### 无状态这一洞见

除了 shared state，每一种 primitive 都是无状态的。Agent 是 `(Prompt, tools)` 的函数。Handoff 是一次 function call。Orchestrator 是 scheduler。**系统中唯一有状态的部分是 shared state。**所有有意思的 bug 都出现在这里：memory poisoning（Lesson 15）、消息顺序、版本控制和写入争用。

隐藏 shared state 的 framework（Swarm）会将问题推给调用方。集中管理 shared state 的 framework（LangGraph checkpoint、AutoGen pool）使其可被检查，但会将协调成本转移到 shared-state 实现上。

### 单个 primitive 的构成

#### Agent

```
Agent = (system_prompt, tools, model, optional_name)
```

没有 memory。没有 state。具有相同 system Prompt 和 Tool 的两个 Agent 可以互换。所有看起来像是每个 Agent 独有的 state，实际上都存在于 shared state 或 handoff protocol 中。

#### Handoff

```
Handoff = (from_agent, to_agent, reason, payload)
```

目前主要有三种实现：

- **Function return**——Tool 返回下一个 Agent。这是 OpenAI Swarm pattern。Agent 在其 Tool schema 中携带路由信息。
- **Graph edge**——LangGraph。Edge 采用声明式定义。LLM 生成一个值；condition 选择下一个 node。
- **Speaker selection**——AutoGen GroupChat。Selector function（有时本身也是一次 LLM call）读取 pool 并选择下一个发言者。

#### Shared state

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

它至少包含一个消息列表，通常还包括更多内容：结构化 artifact（CrewAI Task 输出）、类型化 Context（LangGraph reducer）、外部 memory（MCP、Vector DB）。

它有两种 topology：**full pool**（每个 Agent 都能看到每条消息）和 **projected**（Agent 只能看到按角色限定的视图）。Full pool 简单，但扩展性很差。Projected pool 更易扩展，但要求预先设计 schema。

#### Orchestrator

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

共有四种形式：

- **Static**——图在构建时固定（确定性的 LangGraph、CrewAI Sequential）。
- **LLM-selected**——LLM 读取 pool 并选择下一个发言者（AutoGen、CrewAI Hierarchical）。
- **Handoff-driven**——当前 Agent 通过调用 handoff Tool 做出决定（Swarm）。
- **Queue-driven**——worker 从共享队列提取任务；不存在显式的下一个发言者（swarm architecture、Matrix）。

### Framework 之间还有哪些变化

固定 primitive 后，剩余的设计决策包括：

- **Memory 策略**——临时存储还是持久化 checkpoint（LangGraph checkpointer）。
- **安全边界**——谁可以批准 handoff（human-in-the-loop）。
- **成本核算**——每个 Agent 的 Token 预算。
- **可观测性**——跟踪 handoff、持久化 state 以供 replay。

这些都可以在 primitive 之上实现。它们都不是新的 primitive。

```figure
a5-primitive-radar
```

## 构建它

`code/main.py` 使用约 150 行 stdlib Python 实现了这四种 primitive。这里不使用真实 LLM——每个 Agent 都是一项脚本化 policy，使重点始终放在协调结构上。

该文件导出：

- `Agent`——包含名称、system Prompt、Tool 和 policy function 的 dataclass。
- `Handoff`——返回新 Agent 的 function。
- `SharedState`——线程安全的 message pool。
- `Orchestrator`——三个变体：`StaticOrchestrator`、`HandoffOrchestrator`、`LLMSelectorOrchestrator`（模拟）。

Demo 通过全部三种 orchestrator 类型运行相同的三 Agent pipeline（研究 → 写作 → 审核），并在最后打印 message pool。你可以看到，输出仅在*由谁选择下一个 Agent*这一点上不同；各次运行中的 Agent 和 shared state 完全相同。

运行：

```
python3 code/main.py
```

预期输出：三次 orchestrator 运行，每种 pattern 一次。每次都会打印最终 message pool。如果研究 Agent 认定工作提前完成，handoff-driven 运行会经过更少的 Agent——这就是 LLM 路由权衡的缩影。

## 使用它

`outputs/skill-primitive-mapper.md` 是一个 Skill，可读取任意 multi-Agent codebase 或 framework 文档并返回四种 primitive 的映射。在深入阅读文档前，先对新发布的 framework 运行它，便可用一个段落理解其设计。

## 交付它

采用新 framework 前，先写出它的 primitive 映射。如果无法完成映射，说明文档并不完整，或者该 framework 发明了第五种 primitive（这种情况很少见——检查它是否只是一种你尚未见过的 shared-state 形式）。

将该映射固定在你的架构文档中。新团队成员加入时，先向其发送该映射，再发送 API 文档。Framework 版本变化时，比较映射差异，而不是 changelog。

## 练习

1. 使用不同的 Agent policy 运行 `code/main.py` 三次。观察 orchestrator 的选择如何改变实际运行的 Agent。
2. 实现第四种 orchestrator 类型：一种 queue-driven orchestrator，Agent 会轮询 shared state 以获取任务。可能发生哪种 deadlock？你如何检测它？
3. 获取 LangGraph quickstart（https://docs.langchain.com/oss/python/langgraph/workflows-agents），并使用四种 primitive 重写它。LangGraph 的哪些 abstraction 可以 1:1 映射，哪些只是便利 wrapper？
4. 阅读 OpenAI Swarm cookbook（https://developers.openai.com/cookbook/examples/orchestrating_agents）。确定 Swarm 使哪一种 primitive 最易于使用，以及它将哪一种 primitive 推给了调用方。
5. 在此表中找出一个完全隐藏 shared state 的 framework。说明当 Agent 需要跨 handoff 协调、又不重新读取历史时，会出现什么问题。

## 关键术语

| 术语 | 人们常说的含义 | 它的实际含义 |
|------|----------------|------------------------|
| Agent | “带有 Tool 的 LLM” | 一个 `(system_prompt, tools, model)` 三元组。无状态。 |
| Handoff | “控制权转移” | 一种结构化调用，用于指定下一个 Agent 和可选 payload。三种实现：function return、graph edge、speaker selection。 |
| Shared state | “Memory” / “Context” | multi-Agent 系统中唯一有状态的部分。Message pool 或 blackboard。 |
| Orchestrator | “协调者” | 决定下一个运行主体的角色。Static graph、LLM selector、handoff-driven 或 queue-driven。 |
| Primitive | “Abstraction” | 每个 framework 都会参数化的四个坐标轴之一。它不是 framework Feature。 |
| Message pool | “共享聊天历史” | 包含完整历史的 shared state。易于理解，但扩展性很差。 |
| Projected state | “限定范围的视图” | 针对特定角色的 shared state 视图。易于扩展，但需要 schema 设计。 |
| Speaker selection | “下一个由谁发言” | 一种 orchestrator pattern，由 function（通常是 LLM）从一组 Agent 中选择下一个 Agent。 |

## 延伸阅读

- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) — 对 handoff-driven orchestration 最清晰的阐述
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/) — GroupChat + speaker selection 是 LLM-selected orchestration 的参考实现
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — graph-edge orchestration 和基于 reducer 的 shared state
- [CrewAI introduction](https://docs.crewai.com/en/introduction) — role-goal-backstory Agent、Sequential / Hierarchical process
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2) — Microsoft 将 v0.4 转入维护阶段后仍在活跃开发的 AutoGen v0.2 分支
