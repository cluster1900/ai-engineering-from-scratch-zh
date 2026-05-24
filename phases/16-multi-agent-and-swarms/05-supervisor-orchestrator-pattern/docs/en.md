# Supervisor / Orchestrator-Worker Pattern

> 一个 lead agent 负责规划和委派；专门化 workers 在并行 contexts 中执行并回报结果。这是 Anthropic Research system 背后的 pattern（Claude Opus 4 作为 lead，Sonnet 4 作为 subagents），在 internal research evals 上相比 single-agent Opus 4 提升 +90.2%。Anthropic 的工程文章报告称，BrowseComp 上 80% 的方差仅由 Token usage 解释 —— multi-agent 之所以获胜，很大程度上是因为每个 subagent 都获得一个全新的 context window。本课从 primitives 构建 supervisor pattern，并覆盖来自 production deployments 的 2026 engineering lessons。

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

## 问题

Research 是 single-agent systems 会失败的典型任务。你问“2023 到 2026 年间 multi-agent systems 发生了什么变化？”单个 agent 会依次阅读五篇论文，把一半 context 填满论文文本，然后还必须把它们一起推理。等读到第五篇时，它已经忘了第一篇。它无法并行化。

Supervisor pattern 修复了这一点：一个 lead agent 规划搜索，把每个 sub-question 委派给一个 worker，然后进行 synthesis。每个 worker 都为一个狭窄问题获得自己的 200k-Token window。Lead 永远不会看到 raw papers —— 只看到 worker summaries。

Anthropic 的 production Research system 报告称，在 internal research evals 上相比 single Opus 4 提升 +90.2%。同一篇文章指出，BrowseComp 方差的 80% 仅由 *Token usage alone* 解释。每个 subagent 拥有 fresh context 是主要机制。

## 概念

### 这个 pattern

```
                 ┌──────────────┐
                 │   Lead       │  plans, decomposes,
                 │  (Opus 4)    │  synthesizes
                 └──┬────┬───┬──┘
                    │    │   │
            ┌───────┘    │   └───────┐
            ▼            ▼           ▼
      ┌─────────┐  ┌─────────┐  ┌─────────┐
      │ Worker1 │  │ Worker2 │  │ Worker3 │
      │(Sonnet) │  │(Sonnet) │  │(Sonnet) │
      └─────────┘  └─────────┘  └─────────┘
         fresh       fresh        fresh
         context     context      context
```

Lead 永远不阅读 raw materials。Workers 在 lead synthesis 之前永远不会看到彼此的工作。每个箭头都是一次带有狭窄 artifact 的 handoff。

### 为什么它有效

三种机制：

1. **每个 subagent 都有 fresh context。** 探索“FIPA-ACL heritage”的 worker 不会携带 lead 在规划上消耗的 40k Tokens。它获得一个 200k window 来处理一个问题。
2. **通过 prompt 实现 specialization。** Lead 的 prompt 是“decompose and synthesize”，不是“research”。每个 worker 的 prompt 都很窄：“find what changed in X.” 聚焦的 prompts 会产生聚焦的 outputs。
3. **Parallelism。** Workers 并发运行。Wall-clock time 大致是 `max(worker_times) + plan + synthesis`，而不是 `sum(worker_times)`。

### Engineering lessons (Anthropic 2025)

Anthropic 文章列出了几条到 2026 年仍然相关的 production lessons：

- **Scale effort to query complexity.** 简单 queries：一个 agent，3-10 次 tool calls。复杂 queries：10+ agents。必须由 lead 估算这一点，而不是 caller。
- **Broad then narrow.** 先分解为宽泛 sub-questions，然后在答案需要深度时为每个 sub-question 生成更多 workers。
- **Rainbow deployments.** Agents 是 long-running 且 stateful 的。传统 blue-green 不适用。Anthropic 使用 rainbow：逐步 rollout 新版本，同时让旧版本 drain。
- **Token usage dominates.** Multi-agent 大约是 single-agent 的 15 倍 Tokens。只有当 task value 足以证明成本合理时才运行它。

### LangGraph 转向

LangGraph 最初发布了一个带高层 `create_supervisor` helper 的 `langgraph-supervisor` library。2025 年，LangChain 将推荐做法改为通过 tool-calling 直接实现 supervisor pattern，因为 tool calls 能更好地控制 *supervisor sees what*（context engineering）。这个 library 仍然可用；docs 现在推荐 tool-calling 形式。

### Failure modes

- **Lead hallucinates the plan.** 如果 lead 生成的 sub-questions 没有分解真实问题，workers 会在错误目标上做精确 research。
- **Workers over-explore.** 如果没有明确 scope boundaries，workers 会偏离分配给它们的 sub-question，并污染 synthesis step。
- **Synthesis conflicts.** 两个 workers 返回互相矛盾的 facts。Lead 必须重新询问（增加一轮）或明确标注分歧。默默选择一方是最糟糕的 failure：用户永远不知道发生过分歧。

### 什么时候 supervisor 是错误选择

- **Sequential tasks.** 如果 step 2 确实需要 step 1 的 output，parallelism 没有收益。使用 pipeline（CrewAI Sequential、LangGraph linear graph）。
- **Simple queries.** Single-agent 处理它们更快且更便宜。在生成 workers 前使用 lead 的“scale effort”检查。
- **Strict determinism.** Supervisor 使用 LLM-selected delegation。当 audit/replay 比 adaptability 更重要时，static graphs 更好。

## 构建它

`code/main.py` 使用 `threading` 实现了一个由三个并行 workers 组成的 supervisor。Lead 将 query 分解为 sub-questions，workers 并发处理每个 sub-question，lead 进行 synthesis。没有真实 LLMs —— workers 是 scripted，用来模拟 fetch-and-summarize。

关键结构：

- `Lead.plan(query)` 将 query 拆分为 3 个 sub-questions。
- `Worker.run(sub_q)` 返回一个 fake summary（在 production 中可以是任何 tool-using agent）。
- `Lead.run(query)` 在线程中启动 workers，join，然后 synthesis。

运行：

```
python3 code/main.py
```

Output 会展示 plan、带 start/end timestamps 的并行 worker traces，以及 final synthesis。你可以看到 wall-clock 收益：三个 0.3 秒 workers 在约 0.35 秒内完成，而不是 0.9 秒。

## 使用它

`outputs/skill-supervisor-designer.md` 接收一个 user query，并产出 supervisor-pattern design：lead system prompt、worker roles、sub-question decomposition rules，以及 synthesis template。在构建新的 research-style agent system 前使用它。

## 发布它

部署 supervisor pattern 前的 checklist：

- **Model pairing.** Lead 使用 reasoning-tier model（Opus class、`o3` class）。Workers 使用更快、更便宜的 model（Sonnet、`o4-mini`）。
- **Worker timeout.** 任何超过 2× median runtime 的 worker 都会被 kill；lead 要么用更窄 scope 重新 spawn，要么在没有它的情况下继续。
- **Token cap per worker.** Hard limit（比如 10× expected synthesis input）防止 runaway worker 撑爆预算。
- **Observability.** Trace lead 的 plan、每个 worker 的 tool calls，以及 synthesis。这是任何 post-hoc debugging 的基础。
- **Rainbow rollout.** Stateful long-running agents 需要逐步 version transition，而不是 hot swap。

## 练习

1. 运行 `code/main.py`，然后修改 lead，使其生成 5 个 workers 而不是 3 个。观察 wall-clock effect。在这个 demo 中，worker count 到多少时 spawn overhead 会超过 parallel savings？
2. 实现 worker timeout：kill 任何运行超过 0.5 秒的 worker，并让 lead synthesis 剩余结果。你需要什么 observability 才能知道某个 worker 被 cut？
3. 给 lead 的 synthesis 添加 conflict-detection step：如果两个 workers 返回互相矛盾的 answers，lead 标注分歧，而不是选择其中一个。不调用 LLM 时，你如何检测 contradiction？
4. 阅读 Anthropic 的 Research-system engineering post。列出这个 toy demo 要在 production 中运行需要采纳的三项 practices。
5. 比较 LangGraph 的 `create_supervisor`（legacy）和新的 tool-calling recommendation。哪一个让你更好地控制 supervisor 能看到什么？为什么 Anthropic 明确只把 sub-answers 传入 synthesis，而不是 raw worker context？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor | “Lead agent” | 一个 orchestrator agent，负责规划、委派和 synthesis。它不亲自执行工作。 |
| Worker | “Subagent” | 由 supervisor 以狭窄 scope 调用的 focused agent，并拥有自己的 context window。 |
| Orchestrator-worker | “Supervisor pattern” | 同一件事，不同名称。2026 文献两种说法都会使用。 |
| Fresh context | “Clean window” | Worker 的 context 从它的 system prompt 和分配的问题开始，而不是 lead 的 history。 |
| Rainbow deployment | “Gradual rollout” | Long-running stateful agents 需要 versioned drain-and-replace，而不是 blue-green。 |
| Token dominance | “Context is the variable” | 根据 Anthropic，research-eval 方差的 80% 来自使用的总 Tokens，而不是 model choice。 |
| Scale effort | “Match agent count to complexity” | Lead 估算 query 难度，并据此生成 1 个或 10+ workers。 |
| Synthesis conflict | “Workers disagree” | 两个 workers 返回互相矛盾的 facts；lead 必须暴露分歧，而不是默默选择一方。 |

## 延伸阅读
- [Anthropic engineering — 我们如何构建 multi-agent 研究系统](https://www.anthropic.com/engineering/multi-agent-research-system) — supervisor pattern 的 production reference
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — tool-calling supervisor 现在是推荐形式
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) — legacy helper，2026 production 中仍在使用
- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) — 基于 handoff 的 supervisor 变体
