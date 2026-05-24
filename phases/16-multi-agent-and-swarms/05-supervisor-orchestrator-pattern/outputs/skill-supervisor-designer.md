---
name: supervisor-designer
description: 为给定的研究型 query 设计 supervisor/orchestrator-worker system，指定 lead prompt、worker roles、decomposition rules 和 synthesis template。
version: 1.0.0
phase: 16
lesson: 05
tags: [multi-agent, supervisor, orchestrator, anthropic-research, langgraph]
---

给定一个适合并行 subagent 研究的用户 query，产出一个可接入任意框架（LangGraph、OpenAI Agents SDK、CrewAI Hierarchical）的 supervisor-pattern 设计。

产出：

1. **复杂度估计。** 这个 query 是简单（1 个 agent，3-10 次 tool call）、中等（2-4 个 workers），还是复杂（5+ 个 workers）？用 Anthropic 的 scale-effort heuristic 用一句话说明理由。
2. **Lead system prompt。** 必须包含：(a) decomposition instructions，(b) synthesis instructions，(c) 明确规则：lead 绝不读取原始 source content，只读取 worker summaries。
3. **Worker system prompts。** 每个 role 一个，分别说明其狭窄 scope，以及 lead 期望的 output format。
4. **Sub-question decomposition rules。** lead 如何拆分 query？先广后窄，还是直接 decomposition？什么会让一个 sub-question 不合格（与另一个重叠、过宽）？
5. **Synthesis template。** 明确 conflict-handling rule：如果两个 workers 返回相互矛盾的事实，synthesis 必须呈现分歧，而不是默默选择其中一个。
6. **Model pairing。** lead 使用哪个 model（reasoning tier），workers 使用哪个 model（更快/更便宜 tier）。解释 tradeoff。
7. **Observability requirements。** 最低 trace points：plan、每个 worker start/end、synthesis input、synthesis output。

硬性拒绝：

- 任何让 lead 自己执行 tool-use 的设计。Lead 只负责 plan 和 synthesize。
- 允许 scope drift 的 worker prompts（例如没有边界的“research anything related to X”）。
- 隐藏 conflicts 的 synthesis templates。

拒绝规则：

- 如果 query 很简单（估计总计少于 10 次 tool call），拒绝该设计并推荐 single-agent。引用 Anthropic 15× Token cost finding。
- 如果 query 是 sequential（step 2 需要 step 1 的输出），拒绝并推荐 pipeline/chain pattern。
- 如果用户在优化 determinism 和 audit，拒绝 supervisor 并推荐 LangGraph static graph。

输出：一页 design brief。以复杂度估计和 pattern-fit verdict（"supervisor fits"）开头。如果系统会持续运行，以 rainbow-deployment reminder 结尾。
