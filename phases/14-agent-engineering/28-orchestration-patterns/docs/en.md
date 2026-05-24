# 编排模式：Supervisor, Swarm, Hierarchical

> 2026 年的框架中反复出现四种 Orchestration Patterns：supervisor-worker、swarm / peer-to-peer、hierarchical、debate。Anthropic 的指导原则是：“关键在于为你的需求构建正确的系统。” 从简单开始；只有当单个 agent 加五种 workflow patterns 仍然不足时，才添加 topology。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：** Phase 14 · 12 (Workflow Patterns), Phase 14 · 25 (Multi-Agent Debate)
**Time:** ~60 分钟

## 学习目标
- 说出四种反复出现的 orchestration patterns，以及每种适合的场景。
- 描述 2026 年 LangChain 的建议：基于 tool-call 的 supervision，而不是 supervisor libraries。
- 解释 Anthropic 的“构建正确系统”规则，以及它如何约束 topology 选择。
- 使用 stdlib，基于一个脚本化 LLM 实现全部四种模式。

## 问题
团队常常在真正需要之前就急着使用 “multi-agent”。四种模式会在不同框架中反复出现；一旦你能说出它们，就能选择正确的一种，或者完全跳过 topology。

## 概念
### Supervisor-worker

- 一个中心 routing LLM 分派任务给 specialist agents。
- 决策包括：回到自身循环、移交给 specialist、终止。
- Specialists 彼此不通信；所有 routing 都经过 supervisor。

框架：LangGraph `create_supervisor`、Anthropic orchestrator-workers、CrewAI Hierarchical Process。

**2026 LangChain 建议：**通过直接 tool calls 做 supervision，而不是使用 `create_supervisor`。这样可以获得更细粒度的 context engineering 控制，你可以精确决定每个 specialist 看到什么。

### Swarm / peer-to-peer

- Agents 通过共享的 tool surface 直接 hand off。
- 没有中心 router。
- 延迟低于 supervisor（hop 更少）。
- 更难推理（没有单一控制点）。

框架：LangGraph swarm topology、OpenAI Agents SDK handoffs（当所有 agents 都可以 hand off 给所有其他 agents 时）。

### Hierarchical

- Supervisors 管理 sub-supervisors，sub-supervisors 再管理 workers。
- 在 LangGraph 中实现为 nested subgraphs；在 CrewAI 中实现为 nested crews。
- 能扩展到大规模 agent 群体，但代价是运营复杂度更高。

何时需要：当单个 supervisor 的 context budget 无法容纳所有 specialists 的描述时。

### Debate

- 并行 proposers + 迭代 cross-critique（Lesson 25）。
- 严格来说不是 orchestration，更像 verification，但在框架中经常作为一种 topology 选择出现。

### CrewAI Crew vs Flow

CrewAI 形式化了两种部署模式：

- **Flow** 用于确定性的 event-driven automation（生产环境推荐起点）。
- **Crew** 用于自主的 role-based collaboration。

这与上面的四种模式正交，但会映射到 topology：Flow 通常是 supervisor 或 hierarchical；Crew 通常是带 LLM router 的 supervisor。

### Anthropic's guidance

“LLM 领域的成功，不在于构建最复杂的系统。而在于为你的需求构建正确的系统。”

决策顺序：

1. 单个 agent + workflow patterns（Lesson 12）——从这里开始。
2. Supervisor-worker —— 当你有 2-4 个 specialists 时。
3. Swarm —— 当延迟比推理清晰度更重要时。
4. Hierarchical —— 只有当 supervisor context budget 不足时。
5. Debate —— 当准确率比成本更重要时。

### 这个模式容易出错的地方

- **Topology-first thinking.** 在识别 multi-agent 解决什么问题之前，就说“我们需要 multi-agent”。
- **Bouncing handoffs in swarm.** A -> B -> A -> B。使用 hop counters。
- **Fake hierarchy.** 因为“enterprise”而做三层；实际只有两个团队。压平。

## 构建它
`code/main.py` 使用 stdlib，基于脚本化 LLM 实现全部四种模式：

- `Supervisor` —— 中心 router。
- `Swarm` —— 带直接 handoffs 的 peer-to-peer。
- `Hierarchical` —— supervisors 的 supervisors。
- `Debate` —— 并行 proposers + critique。

每种模式处理相同的三意图任务（refund / bug / sales）。Trace 形状不同。

运行：

```
python3 code/main.py
```

输出：每种模式的 trace + op count。Supervisor 最清晰；swarm 最短；hierarchical 最深；debate 最昂贵。

## 使用它
- **LangGraph** 用于 supervisor 和 hierarchical（nested subgraphs）。
- **OpenAI Agents SDK** 用于 handoffs-as-tools（supervisor-shaped）。
- **CrewAI Flow** 用于确定性的生产环境。
- **Custom** 用于 debate，或当你想要精确控制时。

## 交付它
`outputs/skill-orchestration-picker.md` 选择一个 topology 并实现它。

## 练习
1. 通过移除 router，把一个 supervisor-worker 转换为 swarm。什么会坏掉？什么会改善？
2. 给 swarm 添加 hop counter：3 次 handoffs 后拒绝。它能捕捉 A->B->A 的反复跳转吗？
3. 为一个 12-specialist domain 构建两级 hierarchical system。没有 nesting 时，context budget 会在哪里失败？
4. 在接近生产形态的 workload 上 profile 四种模式。哪种在什么指标上胜出（latency、cost、accuracy、debuggability）？
5. 阅读 Anthropic 的 “Building Effective Agents” 文章。把你的每个 production flows 映射到四种模式之一。有没有无法干净映射的？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor-worker | “Router + specialists” | 中心 LLM 分派给 specialists；它们彼此不通信 |
| Swarm | “Peer-to-peer” | 通过共享 tools 直接 handoffs；没有中心 router |
| Hierarchical | “Supervisors of supervisors” | 面向大规模群体的 nested subgraphs |
| Debate | “Proposer + critique” | 并行 proposers，cross-critique（Lesson 25） |
| Tool-call-based supervision | “Supervisor without a library” | 将 supervisor 实现为直接 tool calls，以控制 context |
| Crew | “Autonomous team” | CrewAI 的 role-based collaboration 模式 |
| Flow | “Deterministic workflow” | CrewAI 的 event-driven production 模式 |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — 五种模式 + agent vs workflow
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — supervisor、swarm、hierarchical
- [CrewAI docs](https://docs.crewai.com/en/introduction) — Crew vs Flow
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) — debate pattern
