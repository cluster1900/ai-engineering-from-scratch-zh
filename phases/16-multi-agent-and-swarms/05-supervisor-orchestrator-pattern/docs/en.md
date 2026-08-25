# Supervisor / Orchestrator-Worker Pattern

> 一个 lead Agent 负责规划和委派；专业 worker 在并行 Context 中执行任务并返回报告。这是 Anthropic Research 系统背后的 pattern（Claude Opus 4 担任 lead，Sonnet 4 担任 subagent）。在内部研究 Evaluation 中，它比单 Agent Opus 4 高出 90.2%。Anthropic 的工程文章指出，BrowseComp 上 80% 的方差仅由 Token 使用量解释——multi-Agent 之所以胜出，很大程度上是因为每个 subagent 都能获得新的 Context window。本课将从 primitive 构建 supervisor pattern，并介绍从生产部署中总结出的 2026 年工程经验。

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04（Primitive Model）
**Time:** ~75 分钟

## 问题

研究是单 Agent 系统难以完成的一类典型任务。你提出“2023 年至 2026 年间 multi-Agent 系统发生了哪些变化？”单个 Agent 会依次阅读五篇论文，用论文内容填满一半 Context，然后还必须将它们放在一起推理。等读到第五篇论文时，它已经忘记了第一篇。它也无法进行并行处理。

Supervisor pattern 可以解决这个问题：一个 lead Agent 规划搜索，将每个子问题委派给 worker，然后进行综合。每个 worker 都会针对一个范围有限的问题获得自己的 200k Token window。Lead 永远不会看到原始论文——只会看到 worker 的摘要。

Anthropic 的生产 Research 系统报告称，在内部研究 Evaluation 中，相比单个 Opus 4 提升了 90.2%。同一篇文章还指出，BrowseComp 上 80% 的方差仅由*Token 使用量*解释。每个 subagent 拥有全新 Context 是主要机制。

## 概念

### 该 pattern

```
                 ┌──────────────┐
                 │   Lead       │  规划、分解、
                 │  (Opus 4)    │  综合
                 └──┬────┬───┬──┘
                    │    │   │
            ┌───────┘    │   └───────┐
            ▼            ▼           ▼
      ┌─────────┐  ┌─────────┐  ┌─────────┐
      │ Worker1 │  │ Worker2 │  │ Worker3 │
      │(Sonnet) │  │(Sonnet) │  │(Sonnet) │
      └─────────┘  └─────────┘  └─────────┘
         全新        全新         全新
         Context     Context      Context
```

Lead 永远不会阅读原始材料。Worker 在 lead 进行综合前，也不会看到彼此的工作。每个箭头都是一次携带范围有限 artifact 的 handoff。

### 它为什么有效

有三种机制：

1. **每个 subagent 都拥有全新 Context。** 探索“FIPA-ACL 传承”的 worker 不会携带 lead 在规划时使用的 40k Token。它会针对一个问题获得 200k window。
2. **通过 Prompt 实现专业化。** Lead 的 Prompt 是“分解并综合”，而不是“研究”。每个 worker 的 Prompt 都很聚焦：“找出 X 发生了哪些变化。”聚焦的 Prompt 会产生聚焦的输出。
3. **并行。** Worker 并发运行。Wall-clock time 大致为 `max(worker_times) + plan + synthesis`，而不是 `sum(worker_times)`。

### 工程经验（Anthropic 2025）

Anthropic 的文章列出了几项生产经验，到 2026 年依然适用：

- **根据 query 复杂度调整投入。** 简单 query：一个 Agent，3–10 次 Tool call。复杂 query：10 个以上 Agent。应由 lead 估算，而不是调用方。
- **先宽后窄。** 先分解为宽泛的子问题，如果答案值得深入，再为每个子问题创建更多 worker。
- **Rainbow deployment。** Agent 运行时间长且有状态。传统 blue-green 不适用。Anthropic 使用 rainbow：逐步发布新版本，同时等待旧版本完成运行。
- **Token 使用量占主导。** multi-Agent 使用的 Token 约为单 Agent 的 15 倍。只有在任务价值足以证明成本合理时才应运行。

### 转向 graph-native

LangGraph 最初提供了一个 `langgraph-supervisor` 库，其中包含高层级 `create_supervisor` helper。2025 年，LangChain 将推荐方式改为通过 Tool calling 直接实现 supervisor pattern，因为 Tool call 可以更精细地控制*supervisor 能看到什么*（Context engineering）。该库仍然可用；目前文档推荐采用 Tool calling 形式。

### 失效模式

- **Lead 虚构计划。** 如果 lead 生成的子问题无法正确分解真实问题，worker 就会针对错误目标开展精确研究。
- **Worker 过度探索。** 如果没有明确的范围边界，worker 会偏离分配的子问题，并污染综合步骤。
- **综合冲突。** 两个 worker 返回互相矛盾的事实。Lead 必须重新询问（增加一轮），或者明确指出分歧。悄悄选择其中一方是最糟糕的失效方式：用户永远不会知道存在分歧。

### 哪些情况不适合使用 supervisor

- **顺序任务。** 如果步骤 2 确实需要步骤 1 的输出，并行不会带来收益。应使用 pipeline（CrewAI Sequential、LangGraph linear graph）。
- **简单 query。** 单 Agent 能够更快、更便宜地处理它们。创建 worker 前，应先执行 lead 的“调整投入”检查。
- **严格确定性。** Supervisor 使用 LLM-selected delegation。当审计和 replay 比适应性更重要时，static graph 更合适。

```figure
supervisor-hierarchy
```

## 构建它

`code/main.py` 使用 `threading` 实现了一个包含三个并行 worker 的 supervisor。Lead 将 query 分解为多个子问题，worker 并发处理每个子问题，随后 lead 进行综合。这里不使用真实 LLM——worker 通过脚本模拟获取信息并生成摘要。

关键结构：

- `Lead.plan(query)` 将 query 拆分为 3 个子问题。
- `Worker.run(sub_q)` 返回一份模拟摘要（在生产环境中，可以替换为任何使用 Tool 的 Agent）。
- `Lead.run(query)` 在线程中启动 worker、等待它们结束，然后进行综合。

运行：

```
python3 code/main.py
```

输出会显示计划、包含开始/结束时间戳的并行 worker trace，以及最终综合结果。你可以看到 wall-clock time 的优势：三个耗时 0.3 秒的 worker 总计约运行 0.35 秒，而不是 0.9 秒。

## 使用它

`outputs/skill-supervisor-designer.md` 接收用户 query 并生成一套 supervisor-pattern 设计：lead system Prompt、worker 角色、子问题分解规则和综合模板。在构建新的研究型 Agent 系统前使用它。

## 交付它

部署 supervisor pattern 前的检查清单：

- **Model 配对。** Lead 使用推理级 Model（Opus 类、`o3` 类）。Worker 使用速度更快、成本更低的 Model（Sonnet、`o4-mini`）。
- **Worker timeout。** 任何运行时间超过中位数 2 倍的 worker 都会被终止；lead 要么以更窄范围重新创建 worker，要么在缺少该结果的情况下继续执行。
- **每个 worker 的 Token 上限。** 硬性限制（例如预期综合输入的 10 倍）可以防止失控 worker 耗尽预算。
- **可观测性。** 跟踪 lead 的计划、每个 worker 的 Tool call 和综合过程。这是事后调试的基础。
- **Rainbow rollout。** 有状态、长时间运行的 Agent 需要渐进式版本迁移，而不是 hot swap。

## 练习

1. 运行 `code/main.py`，然后修改 lead，使其创建 5 个而不是 3 个 worker。观察对 wall-clock time 的影响。在这个 Demo 中，worker 数量达到多少时，创建开销会超过并行带来的节省？
2. 实现 worker timeout：终止任何运行时间超过 0.5 秒的 worker，并让 lead 综合剩余结果。你需要哪些可观测性信息才能知道某个 worker 已被中止？
3. 在 lead 的综合过程中增加冲突检测步骤：如果两个 worker 返回互相矛盾的答案，lead 应指出分歧，而不是选择其中一个。无需调用 LLM 时，你如何检测矛盾？
4. 阅读 Anthropic 关于 Research 系统的工程文章。列出这个简单 Demo 若要在生产环境中运行，需要采用的三项实践。
5. 比较 LangGraph 的 `create_supervisor`（legacy）与新的 Tool calling 推荐方式。哪种方式能让你更好地控制 supervisor 所看到的内容？为什么 Anthropic 明确规定只将子答案传入综合阶段，而不传入 worker 的原始 Context？

## 关键术语

| 术语 | 人们常说的含义 | 它的实际含义 |
|------|----------------|------------------------|
| Supervisor | “Lead Agent” | 一种负责规划、委派和综合的 orchestrator Agent。它本身不执行具体工作。 |
| Worker | “Subagent” | Supervisor 调用的聚焦型 Agent，具有有限范围和独立的 Context window。 |
| Orchestrator-worker | “Supervisor pattern” | 同一事物的不同名称。2026 年的文献同时使用两者。 |
| Fresh Context | “干净的 window” | Worker 的 Context 从其 system Prompt 和分配的问题开始，而不是从 lead 的历史开始。 |
| Rainbow deployment | “渐进式 rollout” | 长时间运行且有状态的 Agent 需要按版本排空并替换，而不是 blue-green。 |
| Token dominance | “Context 是关键变量” | 根据 Anthropic 的数据，研究 Evaluation 中 80% 的方差来自 Token 使用总量，而不是 Model 选择。 |
| Scale effort | “根据复杂度匹配 Agent 数量” | Lead 估算 query 难度，并据此创建 1 个或 10 个以上 worker。 |
| Synthesis conflict | “Worker 意见不一致” | 两个 worker 返回互相矛盾的事实；lead 必须呈现分歧，而不是悄悄选择一方。 |

## 延伸阅读

- [Anthropic engineering — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — supervisor pattern 的生产参考
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — Tool calling supervisor 目前是推荐形式
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) — legacy helper，2026 年的生产环境仍在使用
- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) — 基于 handoff 的 supervisor 变体
