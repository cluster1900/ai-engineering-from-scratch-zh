# CrewAI：基于角色的 Crews 和 Flows

> CrewAI 是 2026 年基于角色的 multi-agent framework。四个基本构件：Agent、Task、Crew、Process。两种顶层形态：Crews（自主、基于角色的协作）和 Flows（事件驱动、确定性）。文档说得很直接：“对于任何生产就绪的应用，都从 Flow 开始。”

**类型：** 学习 + 构建
**语言：** Python (stdlib)
**先修：** Phase 14 · 12 (Workflow Patterns), Phase 14 · 14 (Actor Model)
**时间：** 约 75 分钟

## 学习目标

- 说出 CrewAI 的四个基本构件（Agent、Task、Crew、Process）以及每个构件负责什么。
- 区分 Sequential、Hierarchical 和计划中的 Consensus process；为每类工作负载选择一种。
- 区分 Crews（自主的基于角色）与 Flows（事件驱动的确定性），并解释文档中的生产建议。
- 使用 `@tool` decorator 和 `BaseTool` subclass 接入 tools；理解 structured outputs 与 free text 的取舍。
- 说出四种 CrewAI memory types，以及各自在什么时候值得使用。
- 实现一个 stdlib 三 Agent crew（researcher、writer、editor），产出一份 brief。
- 识别三种 CrewAI failure modes：prompt-bloat、manager-LLM tax、brittle handoffs。

## 问题

采用 multi-agent frameworks 的团队会撞上同一堵墙。“自主协作”在 demo 里听起来很棒。然后客户提交 bug，你需要 deterministic replay。或者 finance 问一个由 LLM 路由的 crew 每次运行要花多少钱。或者 on-call 需要知道凌晨 3 点哪个 agent 卡住了。

自由形式、由 LLM 路由的 crews 都不能干净地回答这些问题。纯 DAG 可以回答全部问题，但会失去 brainstorming agent 需要的探索形态。

CrewAI 的拆分诚实地面对了这个取舍。Crews 用于协作式、基于角色、探索性的工作。Flows 用于事件驱动、代码拥有、可审计的生产。同一个 framework，两种形态，按 surface 选择。

## 概念

### 四个基本构件

CrewAI 的 surface 很小。记住这个，其余都是配置。

- **Agent。** `role + goal + backstory + tools + (optional) llm`。backstory 很关键。它塑造语气、判断，以及 agent 何时停止。Tools 是 agent 可以调用的函数（下面会讲）。
- **Task。** `description + expected_output + agent + (optional) context + (optional) output_pydantic`。可复用的工作单元。`expected_output` 是契约。`context` 列出上游 tasks，其输出会被传入。`output_pydantic` 强制使用结构化形态。
- **Crew。** 容器。拥有 `agents` 列表、`tasks` 列表、`process`，以及可选的 `memory` + `verbose` + `manager_llm` 设置。
- **Process。** 执行策略。Sequential、Hierarchical、Consensus（计划中）。选择运行的形态。

Agents 不会直接看到彼此。Tasks 引用 agents。Crew 对 tasks 进行编排。Process 决定谁选择下一个 task。这就是完整的心智模型。

> **已针对** CrewAI 0.86（2026-05）验证。更新版本可能会重命名或合并 process types；在依赖具体形态之前，请查看 [CrewAI Processes docs](https://docs.crewai.com/concepts/processes)。

### Sequential vs Hierarchical vs Consensus

- **Sequential。** Tasks 按声明顺序运行。Task N 的输出可作为 `context` 提供给 task N+1。成本最低。最可预测。当顺序固定时使用。
- **Hierarchical。** 一个 manager Agent（单独的 LLM call）在 specialists 之间路由。CrewAI 会根据你的 `manager_llm` config 或默认配置生成 manager。manager 每轮选择下一个 task，并且可以拒绝或重新路由。当你有四个或更多 specialists，并且顺序确实依赖前序输出时使用。
- **Consensus。** 计划中，当前 public API 尚未实现。文档保留该名称用于未来基于投票的 process。今天不要依赖它。

Hierarchical 会在每个 specialist call 之上增加每轮一次的 LLM call（manager）。在五步运行中，Token 成本可能变成三倍。只有在需要路由时才为它付费。

### Crews vs Flows

这是 2026 年文档开篇强调的 framing。

- **Crew。** LLM-driven autonomy。framework 在运行时选择形态。适合：research、brainstorming、first drafts，以及路径本身就是答案一部分的场景。难以 replay。难以测试。原型成本低。
- **Flow。** 你拥有的事件驱动 graph。`@start` 标记入口。`@listen(topic)` 标记一个 step，它会在另一个 step 发出该 topic 时触发。每个 step 都是普通 Python（内部可以调用 Crew）。适合：生产。可观测。可测试。确定性。

文档在 2026 年的生产建议：从 Flow 开始。当 autonomy 值得其成本时，把 Crews 作为 Flow steps 内部的 `Crew.kickoff()` calls 折进去。Flow 给你 audit trail，Crew 给你 exploration。组合使用，不要二选一。

### Tool 集成

给 Agent 配 tool 有三种方式。选择最简单且适合的一种。

1. **`@tool` decorator。** 纯函数变成 tools。Signature 是 schema；docstring 是 LLM 看到的描述。最适合一次性 helper。

   ```python
   from crewai.tools import tool

   @tool("Search the web")
   def search(query: str) -> str:
       """Return top results for the query."""
       return run_search(query)
   ```

2. **`BaseTool` subclass。** 基于 class 的 tool，带显式 args schema、async support、retries。当 tool 有状态（client、cache）或需要 structured args 时使用。

   ```python
   from crewai.tools import BaseTool
   from pydantic import BaseModel

   class SearchArgs(BaseModel):
       query: str
       limit: int = 10

   class SearchTool(BaseTool):
       name = "web_search"
       description = "Search the web and return top results."
       args_schema = SearchArgs

       def _run(self, query: str, limit: int = 10) -> str:
           return self.client.search(query, limit=limit)
   ```

3. **内置 toolkits。** CrewAI 提供 first-party adapters：`SerperDevTool`、`FileReadTool`、`DirectoryReadTool`、`CodeInterpreterTool`、`RagTool`、`WebsiteSearchTool`。一次 import 即可接入。

Structured outputs 使用 Pydantic。在 Task 上传入 `output_pydantic=MyModel`。CrewAI 会根据 model 验证 LLM response，并进行 coercion 或 retry。把它与严格的 `expected_output` string 配合使用。Free-text outputs 适合草稿；structured outputs 才是下游 Flows 能消费的内容。

### Memory hooks

CrewAI 开箱提供四种 memory types。它们可以组合：一个 Crew 可以同时启用四种。

> **已针对** CrewAI 0.86（2026-05）验证。近期版本把所有内容都路由到统一的 `Memory` system，该系统包装这四种 stores。下面的概念模型仍然成立，但在更新版本中，public class surface 可能会收敛为单一的 `Memory` entry-point；请查看 [CrewAI memory docs](https://docs.crewai.com/concepts/memory) 了解当前 API。

- **Short-term。** 单次运行内的 conversation buffer。结束时清空。
- **Long-term。** 跨运行持久化。存储在 vector DB 中（默认 Chroma，可替换）。按与当前 task 的相似度检索。
- **Entity。** 按 entity 记录事实。“Customer X is on the enterprise plan.” 按 entity keyed，而不是按相似度。跨运行保留。
- **Contextual。** 组装时检索。在 Agent 需要时拉取相关 memory，而不是预加载。

在 Crew 上用 `memory=True` 或按类型 config 启用。由你配置的 embeddings provider 支撑（默认 OpenAI，可替换为 local）。Memory 是 CrewAI 相比更薄 frameworks 体现价值的地方之一；纯 LangGraph 需要你自己接入每一种。

### 什么时候适合 CrewAI

- 三到六个 agents，具名角色和协作 workflow。起草、review、planning、brainstorming。
- LLM 对下一步的判断本身构成价值的 routing（Hierarchical）。
- 团队更愿意读 `role + goal + backstory`，而不是读 graph definition 的场景。

### 什么时候不适合 CrewAI

- 带严格顺序的 deterministic DAGs。使用 LangGraph（Lesson 13）。graph shape 是正确 abstraction；CrewAI 的角色 framing 会带来摩擦。
- 亚秒级 latency budgets。Hierarchical 会增加 round trips。即使 Sequential 也会序列化包含 backstories 和 prior outputs 的 prompts。
- Single-agent loops。跳过 framework；一个 agent loop（Lesson 1）加 tool registry 更短。

Lesson 17（Agent Framework Tradeoffs）用 Matrix 展示了这一点。简短版本：CrewAI 位于“collaborative role-based”角落。

### Dependency shape

独立于 LangChain。Python 3.10 到 3.13。使用 `uv`。Star count：见 [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)（截至 2026-05 的 snapshot）。AWS Bedrock integration 有文档；vendor benchmarks 报告其在 QA workloads 上相比 LangGraph 有显著提速，但方法论（dataset、hardware、evaluation metric）未公开，因此 framework-vendor numbers 只能作为方向性参考。

### 这种 pattern 会在哪里出错

- **Backstories 导致 prompt-bloat。** 每个 agent 一篇 2000 词的 backstory，再加五个 agent 的 crew，会在第一次 tool call 前烧掉 context budget。把 backstories 控制在 200 词以内。跨 agents 复用短语；不要把 house style 重复五遍。
- **Manager-LLM token tax。** Hierarchical process 会在每个 specialist call 前增加一个 manager LLM call。五个 task 的 crew 会从五次 LLM calls 变成六次，而且 manager call 携带完整 task list 加 prior outputs。除非 routing 依赖输出，否则切换到 Sequential。
- **Brittle handoffs。** Task N 的 `expected_output` 是“an outline”。Task N+1 把它作为 `context` 读取，并尝试 parse 三个 sections。LLM 生成了四个。下游 Agent 即兴处理。修复方式是在 Task N 上使用 `output_pydantic`，让 Task N+1 读取 typed object，而不是 free text。
- **Crew-as-prod。** 自由形式 Crew 在没有 Flow wrapper 的情况下被发布到生产。输出 variability 高；无法 replay；on-call 无法 diff 一次坏运行和一次好运行。用 Flow 包起来。

## 构建它

`code/main.py` 实现了两种形态的 stdlib 版本，以及一个三 Agent crew。

形态：

- `Agent`、`Task` dataclasses，匹配 CrewAI 的 surface。
- `SequentialCrew.kickoff(inputs)` 按声明顺序运行 tasks，并把 outputs 作为 `context` 传递。
- `HierarchicalCrew.kickoff(topic)` 增加一个 manager Agent，每轮选择下一个 specialist，并在 “done” 处停止。
- 带 `@start` 和 `@listen(topic)` decorators 的 `Flow`，一个很小的 event loop，以及 trace。
- `tool(name)` decorator，镜像 CrewAI 的 `@tool` shape。
- 带 `short_term`、`long_term`、`entity` stores 的 `Memory`；mocked similarity 使用 numpy。
- Mock LLM responses 是根据 role 加 input prefix keyed 的 hardcoded strings。无网络。确定性。

具体 demo：researcher、writer、editor crew，产出一份关于 “agent engineering 2026” 的 brief。Researcher 拉取（mocked）sources。Writer 起草。Editor 收紧。同一个 crew 通过 Flow 运行，以展示 deterministic shape。

运行它：

```bash
python3 code/main.py
```

Trace 覆盖：sequential crew 通过 `context` 串接 outputs，hierarchical crew 带 manager picks（researcher、writer、editor，然后 “done”），flow 使用显式 topics（`researched`、`drafted`、`edited`）运行同样三步，tool calls 通过 `@tool` 路由，以及 long-term memory 在两次 kickoffs 之间保留。

Crew trace 是流动的；manager 原则上可以重新排序。Flow trace 是固定的。这个选择就是本课重点。

## 使用它

- **CrewAI Flow** 用于生产。即使 Flow 只有一步调用 `Crew.kickoff()`。Flow 提供 audit boundary。
- **CrewAI Crew (Sequential)** 用于顺序清晰的协作工作，尤其是 first drafts 和 review loops。
- **CrewAI Crew (Hierarchical)** 当 routing 依赖输出，并且你有四个或更多 specialists 时使用。
- **LangGraph**（Lesson 13）用于显式 state machines、durable resume、strict ordering。
- **AutoGen v0.4**（Lesson 14）用于 actor-model concurrency 和 fault isolation。
- **OpenAI Agents SDK**（Lesson 16）用于 OpenAI-first products，带 handoffs 和 guardrails。
- **Claude Agent SDK**（Lesson 17）用于 Claude-first products，带 subagents 和 session store。

## 发布它

`outputs/skill-crew-or-flow.md` 会为一个 task 选择 Crew vs Flow，并 scaffold 最小实现。对 Crew-without-backstory、Flow-without-explicit-topics、少于三个 specialists 的 Hierarchical 进行硬拒绝。

## 常见坑

- **把 backstory 当作调味。** 它会塑造 outputs。每个 agent 测试三个 variants；variance 是真实存在的。选一个并冻结它。
- **跳过 `expected_output`。** 没有每个 task 的契约，下游 tasks 会拿到 LLM 产出的任意内容。Crew 能跑；audit 会失败。
- **Memory always-on。** Long-term 每次运行都会写入。Vector DB 增长。Retrieval 变得嘈杂。只在事实具备持久性时，把写入限定到对应 tasks。
- **Manager prompt drift。** Hierarchical 的 manager prompt 是隐式的。如果 routing 变奇怪，在 verbose mode dump 出来阅读。
- **Crews 中 tool side effects。** Crew 可能比预期更多次调用 tool。POST、DELETE、payment 属于 Flow step，绝不属于 Crew tool。

## 练习

1. 把 Sequential crew 转换为 Flow。数一数 variability 降低的接触点。记录 readability 下降的位置。
2. 给 crew 添加 entity memory：关于 customer 的 facts 在 kickoffs 之间持久化。验证 retrieval 拉取了正确 entity。
3. 实现一个 Hierarchical process：manager 在 writer 的 output 至少有三段之前，拒绝路由到 editor。Trace 这次 retry。
4. 为一个（mocked）web search 接入 `BaseTool` subclass。比较 trace shape 与 `@tool` decorator 版本。
5. 给 editor task 添加 `output_pydantic=Brief`，其中 `Brief` 有 `title`、`summary`、`sections`。让 writer task 输出一次 malformed JSON；验证 CrewAI 在 trace 中的 retry behavior。
6. 阅读 CrewAI 的 docs intro。把 toy 移植到真实 `crewai` API。stdlib 版本跳过了哪些 guarantees？
7. 将 AgentOps 或 Langfuse（Lesson 24）接入一次真实运行。stdlib 版本中你缺了哪些 traces？

## 关键术语

| Term | 大家常说 | 实际含义 |
|------|----------------|------------------------|
| Agent | “Persona” | Role + goal + backstory + tools |
| Task | “工作单元” | Description + expected output + assignee + optional structured output |
| Crew | “Agent team” | Agents + Tasks + Process 的容器 |
| Process | “执行策略” | Sequential / Hierarchical / Consensus（计划中） |
| Flow | “Deterministic workflow” | 事件驱动、代码拥有、可测试 |
| Backstory | “Persona prompt” | Agent 的语气与判断塑造器 |
| `@tool` | “Function tool” | 把函数变成 Agent 可调用 tool 的 decorator |
| `BaseTool` | “Class tool” | 带 args schema、retries、async support 的 class-based tool |
| Entity memory | “Per-entity facts” | 限定到某个 customer / account / issue 的 memory |
| Long-term memory | “Cross-run memory” | 在 kickoffs 之间保留的 vector-backed memory |
| Contextual memory | “Just-in-time retrieval” | Agent 需要时才拉取的 memory |
| Manager LLM | “Router agent” | Hierarchical process 中选择下一个 task 的额外 LLM |
| `expected_output` | “Task contract” | 告诉 Agent（和 audit）要返回什么形态的 string |

## 延伸阅读

- [CrewAI docs introduction](https://docs.crewai.com/en/introduction)：概念与推荐的生产路径
- [CrewAI Flows guide](https://docs.crewai.com/en/concepts/flows)：事件驱动形态、`@start`、`@listen`
- [CrewAI tools reference](https://docs.crewai.com/en/concepts/tools)：`@tool`、`BaseTool`、内置 toolkits
- [CrewAI memory](https://docs.crewai.com/en/concepts/memory)：short-term、long-term、entity、contextual
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)：multi-agent 什么时候有帮助，什么时候没有
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)：state-machine alternative
