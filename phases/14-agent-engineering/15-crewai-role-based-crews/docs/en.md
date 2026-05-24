# CrewAI: 基于角色的 Crews 和 Flows

> CrewAI 是 2026 年基于角色的 multi-agent framework。四个 primitives：Agent、Task、Crew、Process。两种顶层形态：Crews（自主、基于角色的协作）和 Flows（事件驱动、确定性）。docs 说得很直接：“对于任何 production-ready application，请从 Flow 开始。”

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求:** Phase 14 · 12 (Workflow Patterns), Phase 14 · 14 (Actor Model)
**Time:** ~75 分钟

## 学习目标
- 说出 CrewAI 的四个 primitives（Agent、Task、Crew、Process），以及每个 primitive 负责什么。
- 区分 Sequential、Hierarchical 和 Consensual processes；为每类 workload 选择一个。
- 区分 Crews（自主、基于角色）和 Flows（事件驱动、确定性），并解释 docs 中的生产建议。
- 使用 `@tool` decorator 和 `BaseTool` subclass 接入 tools；理解 structured outputs 与 free text 的取舍。
- 说出四种 CrewAI memory types，以及各自何时值得使用。
- 实现一个 stdlib 三 Agent crew（researcher、writer、editor），生成一份 brief。
- 识别三种 CrewAI failure modes：prompt-bloat、manager-LLM tax、brittle handoffs。

## 问题
采用 multi-agent frameworks 的团队会撞上同一堵墙。“自主协作”在 demo 里听起来很好。然后客户提交了一个 bug，你需要 deterministic replay。或者 finance 询问一次 LLM-routed crew 的运行成本是多少。或者 on-call 需要知道凌晨 3 点是哪个 agent 卡住了。

自由形式的 LLM-routed crews 无法干净地回答这些问题。纯 DAGs 都能回答，但会失去 brainstorming agent 所需的探索形态。

CrewAI 的拆分诚实地面对了这个取舍。Crews 用于协作式、基于角色、探索性的工作。Flows 用于事件驱动、由代码掌控、可审计的生产场景。同一个 framework，两种形态，按 surface 选择。

## 概念
### Four primitives

CrewAI 的 surface 很小。记住这点，剩下的就是 config。

- **Agent.** `role + goal + backstory + tools + (optional) llm`。backstory 很关键。它塑造语气、判断方式，以及 agent 何时停止。Tools 是 agent 可以调用的函数（见下文）。
- **Task.** `description + expected_output + agent + (optional) context + (optional) output_pydantic`。一个可复用的工作单元。`expected_output` 是契约。`context` 列出 upstream tasks，它们的 outputs 会被传入。`output_pydantic` 强制结构化形态。
- **Crew.** 容器。拥有 `agents` 列表、`tasks` 列表、`process`，以及可选的 `memory` + `verbose` + `manager_llm` settings。
- **Process.** 执行策略。Sequential、Hierarchical、Consensual。决定一次运行的形态。

Agents 不能直接看到彼此。Tasks 引用 agents。Crew 编排 tasks。Process 决定谁选择下一个 task。这就是完整的 mental model。

### Sequential vs Hierarchical vs Consensual

- **Sequential.** Tasks 按声明顺序运行。Task N 的 output 可作为 `context` 提供给 task N+1。成本最低。最可预测。适用于顺序固定的场景。
- **Hierarchical.** 一个 manager Agent（单独的 LLM call）在 specialists 之间路由。CrewAI 会根据你的 `manager_llm` config 或默认配置生成 manager。manager 每轮选择下一个 task，并且可以拒绝或重新路由。适用于你有四个或更多 specialists，且顺序确实依赖 prior output 的场景。
- **Consensual.** Beta。Agents 对下一步投票。除研究场景外，很少值得为它支付额外 round trips。

Hierarchical 会在每次 specialist call 之外增加一次每轮的 LLM call（manager）。一次五步运行的 Token 成本可能变成三倍。只有在确实需要 routing 时才为它付费。

### Crews vs Flows

这是 docs 在 2026 年主推的 framing。

- **Crew.** LLM-driven autonomy。framework 在 runtime 选择形态。适合：研究、brainstorming、初稿，以及任何“路径本身就是答案一部分”的场景。难以 replay。难以测试。原型成本低。
- **Flow.** 你拥有的事件驱动 graph。`@start` 标记入口。`@listen(topic)` 标记当另一个 step 发出该 topic 时触发的 step。每个 step 都是普通 Python（内部可以调用 Crew）。适合：生产。可观测。可测试。确定性。

docs 的 2026 生产建议：从 Flow 开始。当自主性值得付出成本时，把 Crews 作为 Flow steps 内部的 `Crew.kickoff()` calls 折叠进去。Flow 给你 audit trail，Crew 给你 exploration。组合使用，不要二选一。

### Tool integration

给 Agent 提供 tool 有三种方式。选择最简单且适合的一种。

1. **`@tool` decorator.** 纯函数变成 tools。Signature 是 schema；docstring 是 LLM 看到的 description。最适合一次性 helpers。

   ```python
   from crewai.tools import tool

   @tool("Search the web")
   def search(query: str) -> str:
       """Return top results for the query."""
       return run_search(query)
   ```

2. **`BaseTool` subclass.** 基于 class 的 tool，带有显式 args schema、async support、retries。当 tool 有状态（client、cache）或需要 structured args 时使用。

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

3. **Built-in toolkits.** CrewAI 提供第一方 adapters：`SerperDevTool`、`FileReadTool`、`DirectoryReadTool`、`CodeInterpreterTool`、`RagTool`、`WebsiteSearchTool`。一次 import 即可接入。

Structured outputs 使用 Pydantic。在 Task 上传入 `output_pydantic=MyModel`。CrewAI 会根据该 model 验证 LLM response，并进行 coercion 或 retry。把它和严格的 `expected_output` string 配合使用。Free-text outputs 用于 drafts 没问题；structured outputs 才是 downstream Flows 可以消费的内容。

### Memory hooks

CrewAI 开箱提供四种 memory types。它们可以组合：一个 Crew 可以同时启用四种。

- **Short-term.** 单次运行内的 conversation buffer。结束时清空。
- **Long-term.** 跨运行持久化。存储在 Vector DB 中（默认 Chroma，可替换）。通过与当前 task 的 similarity 进行 retrieval。
- **Entity.** 按 entity 存储 facts。“Customer X is on the enterprise plan.” 按 entity keyed，而不是按 similarity。跨运行保留。
- **Contextual.** 组装时 retrieval。在 Agent 需要它的时刻拉取相关 memory，而不是预加载。

在 Crew 上用 `memory=True` 或 per-type config 启用。由你配置的 embeddings provider 支撑（默认 OpenAI，可替换为本地）。Memory 是 CrewAI 相比更薄 frameworks 更有价值的地方之一；纯 LangGraph 要求你自己接好这些部分。

### When CrewAI fits

- 三到六个 agents，具有明确命名角色和协作 workflow。Drafting、reviewing、planning、brainstorming。
- LLM 对下一步的判断本身就是价值一部分的 routing（Hierarchical）。
- 团队更愿意阅读 `role + goal + backstory`，而不是 graph definition 的任何场景。

### When CrewAI does not fit

- 严格排序的 deterministic DAGs。使用 LangGraph（Lesson 13）。graph shape 是正确抽象；CrewAI 的角色 framing 会带来摩擦。
- 亚秒级 latency budgets。Hierarchical 会增加 round trips。即使 Sequential 也会序列化包含 backstories 和 prior outputs 的 prompts。
- Single-agent loops。跳过 framework；一个 agent loop（Lesson 1）加 tool registry 更短。

Lesson 17（Agent Framework Tradeoffs）用 Matrix 展示了这一点。简短版本：CrewAI 位于“collaborative role-based”角落。

### Dependency shape

独立于 LangChain。Python 3.10 到 3.13。使用 `uv`。2026 年初 GitHub stars 超过 30k。AWS Bedrock integration 有文档；他们的 benchmarks 声称在 QA tasks 上比 LangGraph 快 5.76x。把 framework vendor 的数字当作方向性参考。

### 这个模式容易出错的地方

- **Prompt-bloat from backstories.** 每个 agent 一段 2000 词 backstory，加上五个 agent 的 crew，会在第一次 tool call 前耗尽 context budget。把 backstories 控制在 200 词以内。跨 agents 复用短语；不要把 house style 重复五次。
- **Manager-LLM token tax.** Hierarchical process 会在每次 specialist call 前增加一次 manager LLM call。一个五 task crew 会变成六次 LLM calls，而不是五次，并且 manager call 携带完整 task list 加 prior outputs。除非 routing 依赖 output，否则切换到 Sequential。
- **Brittle handoffs.** Task N 的 `expected_output` 是“an outline”。Task N+1 把它作为 `context` 读取，并尝试解析三个 sections。LLM 产出了四个。downstream Agent 开始即兴发挥。用 Task N 上的 `output_pydantic` 修复，让 Task N+1 读取 typed object，而不是 free text。
- **Crew-as-prod.** 自由形式的 Crew 没有 Flow wrapper 就发布到生产。Output variability 高；replay 不可能；on-call 无法对比 bad run 和 good run。用 Flow 包起来。

## 构建它
`code/main.py` 实现了两种形态的 stdlib 版本，以及一个三 Agent crew。

Shape:

- `Agent`、`Task` dataclasses，匹配 CrewAI 的 surface。
- `SequentialCrew.kickoff(inputs)` 按声明顺序运行 tasks，并把 outputs 作为 `context` 串起来。
- `HierarchicalCrew.kickoff(topic)` 增加一个 manager Agent，每轮选择下一个 specialist，并在 "done" 时停止。
- 带有 `@start` 和 `@listen(topic)` decorators 的 `Flow`，一个很小的 event loop，以及 trace。
- `tool(name)` decorator，模拟 CrewAI 的 `@tool` 形态。
- 带有 `short_term`、`long_term`、`entity` stores 的 `Memory`；mocked similarity 使用 numpy。
- Mock LLM responses 是根据 role 加 input prefix keyed 的 hardcoded strings。无网络。确定性。

具体 demo：researcher、writer、editor crew，生成关于 "agent engineering 2026" 的 brief。Researcher 拉取（mocked）sources。Writer 起草。Editor 精修。同一个 crew 通过 Flow 运行，以展示确定性形态。

运行：

```bash
python3 code/main.py
```

Trace 覆盖：sequential crew 通过 `context` 串联 outputs，hierarchical crew 带有 manager picks（researcher、writer、editor，然后 "done"），flow 使用显式 topics（`researched`、`drafted`、`edited`）运行同样三步，tool calls 通过 `@tool` routing，以及 long-term memory 在两次 kickoffs 之间保留。

Crew trace 是流动的；manager 原则上可以重新排序。Flow trace 是固定的。这个选择就是本课重点。

## 使用它
- **CrewAI Flow** 用于生产。即使 Flow 只有一步，且该步调用 `Crew.kickoff()`。Flow 提供 audit boundary。
- **CrewAI Crew (Sequential)** 用于顺序清晰的协作工作，尤其是初稿和 review loops。
- **CrewAI Crew (Hierarchical)** 用于 routing 依赖 output，并且你有四个或更多 specialists 的场景。
- **LangGraph**（Lesson 13）用于显式 state machines、durable resume、严格排序。
- **AutoGen v0.4**（Lesson 14）用于 actor-model concurrency 和 fault isolation。
- **OpenAI Agents SDK**（Lesson 16）用于 OpenAI-first products，带 handoffs 和 guardrails。
- **Claude Agent SDK**（Lesson 17）用于 Claude-first products，带 subagents 和 session store。

## 交付它
`outputs/skill-crew-or-flow.md` 为某个 task 选择 Crew vs Flow，并搭建最小实现。硬性拒绝 Crew-without-backstory、Flow-without-explicit-topics、少于三个 specialists 的 Hierarchical。

## 陷阱
- **Backstory as flavor.** 它会塑造 outputs。每个 agent 测试三个 variants；variance 真实存在。选一个并冻结。
- **Skipping `expected_output`.** 没有每个 task 的 contract，downstream tasks 会接收 LLM 生成的任意内容。Crew 可以运行；audit 会失败。
- **Memory always-on.** Long-term 每次运行都会写入。Vector DB 增长。Retrieval 变得嘈杂。只在 fact 具有持久性时，对相应 tasks 限定 writes。
- **Manager prompt drift.** Hierarchical 的 manager prompt 是隐式的。如果 routing 变得奇怪，在 verbose mode dump 出来并阅读。
- **Tool side effects in Crews.** Crew 调用 tool 的次数可能超过预期。POST、DELETE、payment 属于 Flow step，绝不要作为 Crew tool。

## 练习
1. 把 Sequential crew 转换为 Flow。统计 variability 降低的 touchpoints。记录 readability 下降的位置。
2. 给 crew 添加 entity memory：关于某个 customer 的 facts 会跨 kickoffs 保留。验证 retrieval 拉取了正确的 entity。
3. 实现一个 Hierarchical process：manager 在 writer 的 output 至少有三段之前，拒绝 routing 到 editor。追踪 retry。
4. 为一个（mocked）web search 接入 `BaseTool` subclass。比较 trace shape 与 `@tool` decorator 版本的差异。
5. 给 editor task 添加 `output_pydantic=Brief`，其中 `Brief` 包含 `title`、`summary`、`sections`。让 writer task 先输出一次 malformed JSON；验证 CrewAI 在 trace 中的 retry behavior。
6. 阅读 CrewAI 的 docs intro。把 toy 移植到真实 `crewai` API。stdlib 版本跳过了哪些 guarantees？
7. 把 AgentOps 或 Langfuse（Lesson 24）接到一次真实运行。stdlib 版本中你缺少了哪些 traces？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "Persona" | Role + goal + backstory + tools |
| Task | "Unit of work" | Description + expected output + assignee + optional structured output |
| Crew | "Agent team" | Agents + Tasks + Process 的容器 |
| Process | "Execution strategy" | Sequential / Hierarchical / Consensual |
| Flow | "Deterministic workflow" | 事件驱动、由代码掌控、可测试 |
| Backstory | "Persona prompt" | Agent 的语气和判断塑造器 |
| `@tool` | "Function tool" | 将函数转换为 Agent 可调用 tool 的 decorator |
| `BaseTool` | "Class tool" | 带 args schema、retries、async support 的基于 class 的 tool |
| Entity memory | "Per-entity facts" | 限定到 customer / account / issue 的 memory |
| Long-term memory | "Cross-run memory" | 在 kickoffs 之间保留的 Vector-backed memory |
| Contextual memory | "Just-in-time retrieval" | 在 Agent 需要时拉取的 memory |
| Manager LLM | "Router agent" | Hierarchical process 中选择下一个 task 的额外 LLM |
| `expected_output` | "Task contract" | 告诉 Agent（以及 audit）应返回何种形态的 string |

## 延伸阅读
- [CrewAI docs introduction](https://docs.crewai.com/en/introduction)：概念和推荐的生产路径
- [CrewAI Flows guide](https://docs.crewai.com/en/concepts/flows)：事件驱动形态，`@start`、`@listen`
- [CrewAI tools reference](https://docs.crewai.com/en/concepts/tools)：`@tool`、`BaseTool`、built-in toolkits
- [CrewAI memory](https://docs.crewai.com/en/concepts/memory)：short-term、long-term、entity、contextual
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)：multi-agent 何时有帮助，何时没有帮助
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)：state-machine alternative
