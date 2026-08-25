# 编排模式：Supervisor、Swarm、Hierarchical

> 2026 年的各种框架中反复出现四种编排模式：supervisor-worker、swarm / peer-to-peer、hierarchical、debate。Anthropic 的建议是：“关键在于为你的需求构建正确的系统。”从简单方案开始；只有当单个 Agent 加五种工作流模式仍无法满足需求时，才增加拓扑结构。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12（工作流模式），Phase 14 · 25（Multi-Agent Debate）
**Time:** ~60 分钟

## 学习目标

- 说出四种反复出现的编排模式，以及各自适用的场景。
- 描述 LangChain 在 2026 年的建议：基于 Tool Call 的监督与 Supervisor Library 之间如何选择。
- 解释 Anthropic 的“构建正确的系统”原则，以及它如何限制拓扑选择。
- 使用 stdlib 和一个通用的脚本化 LLM 实现全部四种模式。

## 问题

团队经常在真正需要之前就开始采用“Multi-Agent”。各种框架中反复出现四种模式；一旦能准确说出它们，你就能选择正确的模式 — 或者完全跳过拓扑结构。

## 概念

### Supervisor-worker

- 中央路由 LLM 将任务分派给专业 Agent。
- 它负责决定：回到自身继续循环、移交给专业 Agent，或终止。
- 专业 Agent 之间不直接通信；所有路由都经过 Supervisor。

框架：LangGraph `create_supervisor`、Anthropic orchestrator-workers、CrewAI Hierarchical Process。

**LangChain 在 2026 年的建议：**通过直接 Tool Call 实现监督，而不是使用 `create_supervisor`。这样可以对 Context Engineering 进行更精细的控制 — 由你准确决定每个专业 Agent 能看到什么。

### Swarm / peer-to-peer

- Agent 通过共享 Tool 接口直接移交任务。
- 没有中央 Router。
- 延迟低于 Supervisor（中间跳转更少）。
- 更难推理（没有单一控制点）。

框架：LangGraph swarm topology、OpenAI Agents SDK handoff（当所有 Agent 都可以将任务移交给其他所有 Agent 时）。

### Hierarchical

- Supervisor 管理下级 Supervisor，下级 Supervisor 再管理 Worker。
- 在 LangGraph 中实现为嵌套 subgraph；在 CrewAI 中实现为嵌套 Crew。
- 能扩展到大规模 Agent 群体，但代价是运维复杂性。

适用场景：当单个 Supervisor 的 Context 预算无法容纳所有专业 Agent 的描述时。

### Debate

- 并行 Proposer + 迭代式交叉 Critique（第 25 课）。
- 严格来说并不是编排 — 更接近验证 — 但在框架中经常作为一种拓扑选择出现。

### 自主 Crew 与确定性 Flow

CrewAI 规范了两种部署模式：

- **Flow** 用于确定性的事件驱动自动化（推荐作为生产环境的起点）。
- **Crew** 用于基于角色的自主协作。

这与上述四种模式相互独立，但可以映射到拓扑：Flow 通常采用 Supervisor 或 Hierarchical；Crew 通常采用带 LLM Router 的 Supervisor。

### Anthropic 的建议

“在 LLM 领域取得成功，并不取决于构建最复杂的系统，而在于为你的需求构建正确的系统。”

决策顺序：

1. 单个 Agent + 工作流模式（第 12 课）— 从这里开始。
2. Supervisor-worker — 当你有 2–4 个专业 Agent 时。
3. Swarm — 当延迟比推理清晰度更重要时。
4. Hierarchical — 仅当 Supervisor 的 Context 预算不足时。
5. Debate — 当准确性比成本更重要时。

### 这种模式容易出错的地方

- **拓扑优先思维。** 尚未明确 Multi-Agent 要解决什么问题，就先认定“我们需要 Multi-Agent”。
- **Swarm 中的往返移交。** A -> B -> A -> B。使用跳转计数器。
- **虚假层级。** 因为“企业级”而设置三层结构，实际却只有两个团队。应当合并层级。

```figure
orchestration-pattern
```

## 动手构建

`code/main.py` 使用 stdlib 和一个脚本化 LLM 实现全部四种模式：

- `Supervisor` — 中央 Router。
- `Swarm` — 通过直接 handoff 实现 peer-to-peer。
- `Hierarchical` — Supervisor 的 Supervisor。
- `Debate` — 并行 Proposer + Critique。

每种模式都处理相同的三种意图任务（退款 / bug / 销售），但 Trace 形态不同。

运行：

```
python3 code/main.py
```

输出：每种模式的 Trace + 操作次数。Supervisor 最清晰；Swarm 最短；Hierarchical 最深；Debate 成本最高。

## 实际使用

- **LangGraph** 用于 Supervisor 和 Hierarchical（嵌套 subgraph）。
- **OpenAI Agents SDK** 用于将 handoff 作为 Tool（呈 Supervisor 形态）。
- **CrewAI Flow** 用于生产环境中的确定性流程。
- **Custom** 用于 Debate，或需要精确控制时。

## 交付成果

`outputs/skill-orchestration-picker.md` 会选择一种拓扑并实现它。

## 练习

1. 通过移除 Router，将 Supervisor-worker 转换为 Swarm。什么被破坏了？什么得到改善？
2. 为 Swarm 添加跳转计数器：3 次 handoff 后拒绝继续。它能捕获 A->B->A 的往返移交吗？
3. 为一个包含 12 个专业 Agent 的领域构建两层 Hierarchical 系统。如果不使用嵌套，Context 预算会在哪里不足？
4. 使用接近生产环境的工作负载分析四种模式。分别在哪些指标上胜出（延迟、成本、准确性、可调试性）？
5. 阅读 Anthropic 的“Building Effective Agents”文章。将你的每个生产流程映射到四种模式之一。是否存在无法清晰映射的流程？

## 关键术语

| 术语 | 人们通常怎么说 | 实际含义 |
|------|----------------|------------------------|
| Supervisor-worker | “Router + 专业 Agent” | 中央 LLM 将任务分派给专业 Agent；它们之间不直接通信 |
| Swarm | “Peer-to-peer” | 通过共享 Tool 直接 handoff；没有中央 Router |
| Hierarchical | “Supervisor 的 Supervisor” | 面向大规模 Agent 群体的嵌套 subgraph |
| Debate | “Proposer + Critique” | 并行 Proposer、交叉 Critique（第 25 课） |
| Tool-call-based supervision | “不使用 Library 的 Supervisor” | 将 Supervisor 实现为直接 Tool Call，以便控制 Context |
| Crew | “自主团队” | CrewAI 基于角色的协作模式 |
| Flow | “确定性工作流” | CrewAI 事件驱动的生产模式 |

## 延伸阅读

- [Anthropic，Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — 五种模式 + Agent 与工作流的区别
- [LangGraph 概览](https://docs.langchain.com/oss/python/langgraph/overview) — Supervisor、Swarm、Hierarchical
- [CrewAI 文档](https://docs.crewai.com/en/introduction) — Crew 与 Flow
- [Du 等，Society of Minds（arXiv:2305.14325）](https://arxiv.org/abs/2305.14325) — Debate 模式
