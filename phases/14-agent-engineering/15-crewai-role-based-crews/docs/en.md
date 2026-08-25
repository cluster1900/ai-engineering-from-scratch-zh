# 基于角色的 Agent 团队 — 角色、任务与流程

> 四个原语：Agent、Task、Crew、Process。两种顶层结构：Crews（自主、基于角色的协作）和 Flows（事件驱动、确定性）。CrewAI 是 2026 年的参考实现，其文档直言不讳：“对于任何可投入生产的应用，请从 Flow 开始。”

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12 (Workflow Patterns), Phase 14 · 14 (Actor Model)
**Time:** ~75 分钟

## 学习目标

- 说出 CrewAI 的四个原语（Agent、Task、Crew、Process）以及各自负责的内容。
- 区分 Sequential、Hierarchical 和规划中的 Consensus process；为不同工作负载选择合适的模式。
- 区分 Crews（自主、基于角色）和 Flows（事件驱动、确定性），并解释文档针对生产环境给出的建议。
- 使用 `@tool` decorator 和 `BaseTool` subclass 接入 Tool；分析结构化输出与自由文本的差异。
- 说出 CrewAI 的四种 Memory 类型，以及每种类型在什么情况下能带来收益。
- 实现一个基于 stdlib 的三 Agent Crew（researcher、writer、editor），用于生成一份 brief。
- 识别 CrewAI 的三种故障模式：Prompt 膨胀、manager LLM 成本和脆弱的 handoff。

## 问题

采用多 Agent 框架的团队都会撞上同一堵墙。“自主协作”在演示中听起来很棒。但当客户提交 bug 时，你需要确定性的重放。或者财务部门询问由 LLM 路由的 Crew 每次运行需要多少成本。又或者值班人员需要知道凌晨 3 点是哪个 Agent 停滞了。

自由形式、由 LLM 路由的 Crew 无法清晰回答这些问题。纯 DAG 可以全部回答，但会失去 brainstorming Agent 所需的探索性结构。

CrewAI 的划分坦率地呈现了这种权衡。Crews 用于协作式、基于角色的探索性工作。Flows 用于事件驱动、由代码控制且可审计的生产工作。同一个框架，两种结构，按使用场景进行选择。

## 概念

### 四个原语

CrewAI 的功能界面很精简。记住以下内容，其余都只是配置。

- **Agent。** `role + goal + backstory + tools + (optional) llm`。backstory 至关重要。它会塑造语气、判断方式，以及 Agent 何时停止。Tools 是 Agent 可以调用的函数（下文详述）。
- **Task。** `description + expected_output + agent + (optional) context + (optional) output_pydantic`。可复用的工作单元。`expected_output` 是契约。`context` 列出上游 Task，其输出会被传入当前 Task。`output_pydantic` 强制输出采用结构化形式。
- **Crew。** 容器。负责维护 `agents` 列表、`tasks` 列表、`process`，以及可选的 `memory` + `verbose` + `manager_llm` 设置。
- **Process。** 执行策略。包括 Sequential、Hierarchical、Consensus（规划中）。它决定运行采用何种结构。

Agent 不会直接看到彼此。Task 引用 Agent。Crew 对 Task 进行排序。Process 决定由谁选择下一个 Task。这就是完整的思维模型。

> **验证版本：** CrewAI 0.86（2026-05）。较新版本可能重命名或合并 process 类型；依赖特定结构之前，请查看 [CrewAI Processes 文档](https://docs.crewai.com/concepts/processes)。

### Sequential、Hierarchical 与 Consensus

- **Sequential。** Task 按声明顺序运行。Task N 的输出可作为 `context` 提供给 Task N+1。成本最低，最可预测。适用于顺序固定的场景。
- **Hierarchical。** manager Agent（一次独立的 LLM 调用）在 specialist 之间进行路由。CrewAI 会根据你的 `manager_llm` 配置或默认设置创建 manager。manager 在每一轮选择下一个 Task，并且可以拒绝或重新路由。适用于拥有四个或更多 specialist，并且执行顺序确实依赖先前输出的场景。
- **Consensus。** 仍在规划中，目前尚未在公共 API 中实现。文档为未来基于投票的 process 保留了这个名称。目前不要依赖它。

除每次 specialist 调用之外，Hierarchical 还会在每一轮增加一次 LLM 调用（manager）。在一个包含五个步骤的运行中，Token 成本可能增加到三倍。只有真正需要路由时，才值得为此付出成本。

### Crews 与 Flows

这是 2026 年文档首先强调的核心框架。

- **Crew。** 由 LLM 驱动的自主运行。框架在 Runtime 决定具体结构。适合研究、brainstorming、初稿，以及执行路径本身也是答案一部分的场景。难以重放，难以测试，但原型设计成本低。
- **Flow。** 由你掌控的事件驱动图。`@start` 标记入口。`@listen(topic)` 标记在其他步骤发出对应 topic 时触发的步骤。每个步骤都是普通 Python 代码（内部可以调用 Crew）。适合生产环境。可观测、可测试且具有确定性。

文档在 2026 年针对生产环境给出的建议是：从 Flow 开始。只有当自主性值得付出相应成本时，才在 Flow 步骤内部通过 `Crew.kickoff()` 调用引入 Crew。Flow 为你提供审计轨迹，Crew 为你提供探索能力。将二者组合起来，而不是二选一。

### Tool 集成

有三种方式可以为 Agent 提供 Tool。选择能够满足需求的最简单方式。

1. **`@tool` decorator。** 将纯函数转为 Tool。函数签名就是 schema；docstring 是 LLM 看到的描述。最适合一次性的辅助函数。

   ```python
   from crewai.tools import tool

   @tool("Search the web")
   def search(query: str) -> str:
       """Return top results for the query."""
       return run_search(query)
   ```

2. **`BaseTool` subclass。** 具有明确 args schema、async 支持和重试能力的 class-based Tool。适用于 Tool 包含 state（client、cache）或需要结构化参数的场景。

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

3. **内置 toolkit。** CrewAI 提供第一方 adapter：`SerperDevTool`、`FileReadTool`、`DirectoryReadTool`、`CodeInterpreterTool`、`RagTool`、`WebsiteSearchTool`。只需一次 import 即可接入。

结构化输出使用 Pydantic。在 Task 上设置 `output_pydantic=MyModel`。CrewAI 会依据该 Model 验证 LLM 响应，并执行类型转换或重试。应当配合严格的 `expected_output` 字符串使用。自由文本输出适合草稿；结构化输出才能被下游 Flow 稳定消费。

### Memory hook

CrewAI 默认提供四种 Memory。它们可以组合使用：一个 Crew 可以同时启用全部四种。

> **验证版本：** CrewAI 0.86（2026-05）。近期版本通过统一的 `Memory` 系统对这四种存储进行封装。下方的概念模型仍然成立，但较新版本可能将公共 class 界面收拢为单一 `Memory` 入口；请查看 [CrewAI Memory 文档](https://docs.crewai.com/concepts/memory)了解当前 API。

- **Short-term。** 单次运行期间的对话 buffer。运行结束时清除。
- **Long-term。** 跨运行持久保存。存储在 Vector DB 中（默认使用 Chroma，可以替换）。根据与当前 Task 的相似度进行检索。
- **Entity。** 针对每个 entity 保存事实。例如：“Customer X 使用 enterprise plan。”按 entity 建立索引，而不是按相似度检索。可以跨运行保留。
- **Contextual。** 在组装 Context 时进行检索。在 Agent 需要时提取相关 Memory，而不是预先加载。

可通过 Crew 上的 `memory=True` 或按类型配置来启用。底层使用你配置的 Embedding provider（默认为 OpenAI，也可替换为本地 provider）。与更轻量的框架相比，Memory 是 CrewAI 体现价值的领域之一；使用纯 LangGraph 时，你需要自行接入这些能力。

### 基于角色的团队适用于何时

- 由三到六个具有明确角色的 Agent 组成，并采用协作式工作流。包括起草、审阅、规划和 brainstorming。
- LLM 对下一步的判断本身就是价值的一部分时所需的路由（Hierarchical）。
- 团队更愿意阅读 `role + goal + backstory` 而不是图定义的任何场景。

### 何时不适用

- 具有严格顺序的确定性 DAG。请使用 LangGraph（Lesson 13）。图结构才是正确的抽象；CrewAI 的角色框架反而会增加阻力。
- 亚秒级延迟预算。Hierarchical 会增加往返调用。即使 Sequential 也会串行处理包含 backstory 和先前输出的 Prompt。
- 单 Agent 循环。跳过框架；Agent loop（Lesson 1）加 Tool registry 的实现更短。

Lesson 17（Agent Framework Tradeoffs）通过一个 Matrix 展示了这些差异。简而言之：CrewAI 位于“基于角色的协作”这一象限。

### 依赖结构

独立于 LangChain。支持 Python 3.10 至 3.13。使用 `uv`。Star 数量：参见 [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)（截至 2026-05 的快照）。文档中提供 AWS Bedrock 集成；供应商 benchmark 声称在 QA 工作负载中相较 LangGraph 有显著提速，但其方法（Dataset、硬件、Evaluation metric）并未公开，因此框架供应商提供的数据只能作为方向性参考。

### 此模式会在哪些地方出错

- **backstory 导致 Prompt 膨胀。** 每个 Agent 使用 2000 词的 backstory，再配上一个五 Agent Crew，第一次 Tool 调用之前就会耗尽 Context 预算。将 backstory 控制在 200 词以内。多个 Agent 之间应复用措辞；不要重复五遍团队风格说明。
- **manager LLM 的 Token 成本。** Hierarchical process 会在每次 specialist 调用前增加一次 manager LLM 调用。对于包含五个 Task 的 Crew，这意味着六次而不是五次 LLM 调用，而且 manager 调用会携带完整的 Task 列表和先前输出。除非路由依赖输出，否则请切换到 Sequential。
- **脆弱的 handoff。** Task N 的 `expected_output` 是“一份 outline”。Task N+1 将它作为 `context` 读取，并尝试解析三个 section，但 LLM 生成了四个。下游 Agent 只能临场发挥。解决方案是在 Task N 上使用 `output_pydantic`，让 Task N+1 读取类型化对象，而不是自由文本。
- **将 Crew 直接用于生产环境。** 自由形式的 Crew 在没有 Flow wrapper 的情况下进入生产环境。输出差异很大；无法重放；值班人员无法对比异常运行和正常运行。请使用 Flow 进行封装。

```figure
ae-crew-vs-flow
```

## 动手构建

`code/main.py` 使用 stdlib 实现了两种结构以及一个三 Agent Crew。

结构：

- 与 CrewAI 功能界面对应的 `Agent`、`Task` dataclass。
- `SequentialCrew.kickoff(inputs)` 按声明顺序运行 Task，并将输出依次作为 `context` 传递。
- `HierarchicalCrew.kickoff(topic)` 添加一个 manager Agent，由其在每一轮选择下一个 specialist，并在返回 `"done"` 时停止。
- 使用 `@start` 和 `@listen(topic)` decorator 的 `Flow`、一个微型事件循环和一份 trace。
- 模拟 CrewAI `@tool` 形式的 `tool(name)` decorator。
- 包含 `short_term`、`long_term`、`entity` store 的 `Memory`；模拟的相似度计算使用 numpy。
- Mock LLM 响应是根据角色和输入前缀设置的硬编码字符串。无需网络。结果具有确定性。

具体演示：由 researcher、writer 和 editor 组成的 Crew 生成一份关于“agent engineering 2026”的 brief。researcher 获取（模拟的）来源。writer 起草内容。editor 进行精简。同一个 Crew 还会通过 Flow 运行，以展示确定性的执行结构。

运行：

```bash
python3 code/main.py
```

trace 覆盖以下内容：Sequential Crew 通过 `context` 依次传递输出；Hierarchical Crew 由 manager 依次选择 researcher、writer、editor，最后返回 `"done"`；Flow 使用显式 topic（`researched`、`drafted`、`edited`）运行相同的三个步骤；Tool 调用通过 `@tool` 路由；long-term Memory 在两次 kickoff 之间继续保留。

Crew 的 trace 是灵活的；manager 原则上可以重新排序。Flow 的 trace 是固定的。如何选择正是本课的重点。

## 实际使用

- **CrewAI Flow** 用于生产环境。即使 Flow 只有一个调用 `Crew.kickoff()` 的步骤也是如此。Flow 提供审计边界。
- **CrewAI Crew (Sequential)** 用于顺序清晰的协作式工作，尤其是初稿和审阅循环。
- **CrewAI Crew (Hierarchical)** 用于路由依赖输出且拥有四个或更多 specialist 的场景。
- **LangGraph**（Lesson 13）用于显式 state machine、持久化恢复和严格排序。
- **AutoGen v0.4**（Lesson 14）用于 Actor 模型的并发与故障隔离。
- **OpenAI Agents SDK**（Lesson 16）用于采用 handoff 和 guardrail 的 OpenAI-first 产品。
- **Claude Agent SDK**（Lesson 17）用于采用 subagent 和 session store 的 Claude-first 产品。

## 交付成果

`outputs/skill-crew-or-flow.md` 会为任务选择 Crew 或 Flow，并生成最小实现的脚手架。它会直接拒绝没有 backstory 的 Crew、没有显式 topic 的 Flow，以及 specialist 少于三个的 Hierarchical。

## 常见陷阱

- **将 backstory 视为装饰。** 它会塑造输出。为每个 Agent 测试三个版本；差异确实存在。选择一个，然后固定下来。
- **跳过 `expected_output`。** 如果每个 Task 都没有契约，下游 Task 只能接收 LLM 碰巧生成的内容。Crew 可以运行，但审计无法通过。
- **始终启用 Memory。** long-term Memory 会在每次运行时写入。Vector DB 不断增长，检索噪声越来越多。仅对需要持久保存事实的 Task 执行写入。
- **manager Prompt 漂移。** Hierarchical 的 manager Prompt 是隐式的。如果路由开始出现异常，请在 verbose mode 下将其输出并仔细阅读。
- **Crew 中 Tool 的副作用。** Crew 调用 Tool 的次数可能超出预期。POST、DELETE 和支付操作应放在 Flow 步骤中，绝不能放进 Crew Tool。

## 练习

1. 将 Sequential Crew 转换为 Flow。统计可变性降低了多少个接触点，并记录可读性在哪些地方下降。
2. 为 Crew 添加 entity Memory：与客户有关的事实可以跨 kickoff 保留。验证检索结果是否提取了正确的 entity。
3. 实现一个 Hierarchical process：在 writer 输出至少包含三个段落之前，manager 拒绝路由到 editor。记录重试 trace。
4. 为（模拟的）网页搜索接入一个 `BaseTool` subclass。比较其 trace 结构与 `@tool` decorator 版本的差异。
5. 为 editor Task 添加 `output_pydantic=Brief`，其中 `Brief` 包含 `title`、`summary`、`sections`。让 writer Task 首次输出格式错误的 JSON；在 trace 中验证 CrewAI 的重试行为。
6. 阅读 CrewAI 文档的介绍。将 toy 实现迁移到真正的 `crewai` API。stdlib 版本省略了哪些保证？
7. 将 AgentOps 或 Langfuse（Lesson 24）接入一次真实运行。stdlib 版本遗漏了哪些 trace？

## 关键术语

| Term | 人们通常怎么说 | 它实际表示什么 |
|------|----------------|------------------------|
| Agent | “Persona” | Role + goal + backstory + tools |
| Task | “工作单元” | Description + expected output + assignee + 可选的 structured output |
| Crew | “Agent 团队” | Agent + Task + Process 的容器 |
| Process | “执行策略” | Sequential / Hierarchical / Consensus（规划中） |
| Flow | “确定性工作流” | 事件驱动、由代码控制、可测试 |
| Backstory | “Persona Prompt” | 塑造 Agent 的语气与判断方式 |
| `@tool` | “函数 Tool” | 将函数转换为 Agent 可调用 Tool 的 decorator |
| `BaseTool` | “class Tool” | 带有 args schema、重试和 async 支持的 class-based Tool |
| Entity memory | “每个 entity 的事实” | 限定于某个客户 / account / issue 的 Memory |
| Long-term memory | “跨运行 Memory” | 由 Vector 支持、可在多次 kickoff 之间保留的 Memory |
| Contextual memory | “即时检索” | 在 Agent 需要时提取的 Memory |
| Manager LLM | “路由 Agent” | Hierarchical process 中选择下一个 Task 的额外 LLM |
| `expected_output` | “Task 契约” | 告诉 Agent（以及审计系统）应返回何种结构的字符串 |

## 延伸阅读

- [CrewAI 文档介绍](https://docs.crewai.com/en/introduction)：概念与推荐的生产环境路径
- [CrewAI Flows 指南](https://docs.crewai.com/en/concepts/flows)：事件驱动结构、`@start`、`@listen`
- [CrewAI Tools 参考](https://docs.crewai.com/en/concepts/tools)：`@tool`、`BaseTool`、内置 toolkit
- [CrewAI Memory](https://docs.crewai.com/en/concepts/memory)：short-term、long-term、entity、contextual
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)：多 Agent 何时有帮助，何时没有帮助
- [LangGraph 概览](https://docs.langchain.com/oss/python/langgraph/overview)：state machine 替代方案
