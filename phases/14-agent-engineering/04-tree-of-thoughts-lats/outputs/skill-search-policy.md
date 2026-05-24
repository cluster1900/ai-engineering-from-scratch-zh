---
name: search-policy
description: 根据任务形态、Token 预算和评估器质量选择搜索策略（ReAct、ToT、LATS、evolutionary）。
version: 1.0.0
phase: 14
lesson: 04
tags: [tree-of-thoughts, lats, mcts, search, value-function]
---

给定任务形态（single-answer / multi-answer / open-ended）、Token 预算，以及可用评估器（scalar test / heuristic / self-eval），产出一份带有具体参数的搜索策略建议。

产出：

1. 决策。以下之一：linear ReAct、beam ToT（带 beam width k）、BFS ToT（带 max depth）、带 pruning 的 DFS ToT、MCTS LATS（带 iterations 和 UCT c）、evolutionary search（仅当评估器是 programmatic 且可检查时）。
2. 参数。对每种策略给出具体数值默认值：beam width、depth cap、branching factor K、每层 rollouts 数、UCT c（默认 1.4）、timeout。
3. Value function。精确说明 node 的 score 来自什么。选项：unit-test pass rate、到目标的 numeric distance、带格式的 prompted LLM score（sure/likely/impossible 或 1..10 或 vote），或 environment reward。
4. Token 预算估算。最坏情况 Token = branching_factor ^ depth * avg_prompt_tokens。展示该数字。如果超过用户预算，建议更便宜的策略。
5. 失败模式。对每个选定策略，列出前两个失败模式及其缓解措施（例如 LATS + noisy evaluator -> 按 CRITIC，Lesson 05 增加 tool-grounded verification）。

硬性拒绝：

- 当评估器不可靠时（仅 self-eval、没有 ground truth）推荐搜索。回退到 ReAct + CRITIC。
- 在没有充分理由的情况下将 branching factor K 设为高于 5。K=3-5 是论文默认值；K=10 会让成本爆炸。
- 将 LATS 应用于 chat-style 任务。对于没有 programmatic target 的对话式 Q&A，搜索没有帮助。
- 在没有 machine-checkable fitness 的情况下使用 evolutionary search。AlphaEvolve 只有在 fitness 是 programmatic（运行测试、测量速度、验证定理）时才有意义。

拒绝规则：

- 如果 Token 预算 < 单条 trajectory 成本的 5 倍，拒绝搜索并推荐 ReAct + Reflexion（Lesson 03）。
- 如果 wall-clock latency 预算 < 10 秒，拒绝 LATS 并推荐 ReAct。
- 如果任务是纯信息检索，拒绝搜索并推荐 ReWOO（Lesson 02）。

输出：一个推荐块（选定策略、参数、Value Function、预算估算）加上一条 "what to read next" 注释，指向 Lesson 05（CRITIC，用于评估器可靠性）、Lesson 11（AlphaEvolve，用于 evolutionary 变体），或 Lesson 30（eval-driven development，用于 benchmark-grade 验证）。
