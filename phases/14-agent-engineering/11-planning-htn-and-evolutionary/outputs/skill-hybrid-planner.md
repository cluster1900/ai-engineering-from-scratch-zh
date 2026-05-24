---
name: hybrid-planner
description: 构建一个 hybrid planner — 用 ChatHTN 处理可证明 sound 的 plans，用 AlphaEvolve 处理带机器可检查 evaluator 的 code search — 并为问题选择正确方案。
version: 1.0.0
phase: 14
lesson: 11
tags: [planning, htn, chathtn, alphaevolve, evolutionary-search]
---

给定一个问题类别（policy-bound workflow vs code optimization vs open-ended task），选择一个 planner 并产出正确 scaffold。

决策：

1. 问题是否有硬性 preconditions / policy / scheduling constraints？-> HTN (ChatHTN)。
2. 问题是否有 deterministic、机器可检查的 fitness function？-> Evolutionary (AlphaEvolve)。
3. 都没有？-> 改用 ReAct (Lesson 01) 或 ReWOO (Lesson 02)。

对于 HTN，产出：

1. 带有 `preconditions`、`effects_add`、`effects_remove` 的 `Operator` type。
2. 带有 `task`、`preconditions`、`subtasks` 的 `Method` type。
3. 一个 planner：先尝试 methods，fallback 到 LLM decomposition，并缓存成功的 LLM decompositions。
4. 一个 validation step：拒绝引用 unknown operators 或 methods 的 LLM decompositions。

对于 Evolutionary，产出：

1. 一组 candidate programs 的 seed population。
2. 一个返回 scalar fitness 的 deterministic evaluator。
3. 一个 mutation operator（LLM-driven 或 rule-based）。
4. 一个 selection loop（保留 top-k、mutate、repeat），带 early stopping。

硬性拒绝：

- ChatHTN 中直接应用 LLM output，而没有 operator-schema validation。Soundness 主张失败。
- AlphaEvolve 中 evaluator 调用 LLM judge。Fitness 必须 deterministic；LLM judges 会引入 loop 无法恢复的 stochastic noise。
- 任一模式用于 open-ended tasks（“write a blog post”）。没有 evaluator，没有 preconditions -> 使用 ReAct。

拒绝规则：

- 如果 domain 没有清晰的 operator schema，拒绝 ChatHTN。建议使用 ReWOO 或 plain ReAct。
- 如果 domain 没有机器可检查的 fitness，拒绝 AlphaEvolve。建议使用 Self-Refine (Lesson 05)。
- 如果用户想要“planner + LLM makes final call”，拒绝。Symbolic correctness 和 LLM exploration 之间的分工是关键承重结构。

输出：`operators.py`、`methods.py`、`planner.py`（HTN）或 `evaluator.py`、`mutator.py`、`loop.py`（evolutionary），外加带有决策理由的 `README.md`。最后用 “what to read next” 结尾：如果 debate-style verification 适合该问题，指向 Lesson 25；如果这个任务最终其实更像 ReWOO，则指向 Lesson 02。
