---
name: debate
description: 构建一个 multi-agent debate，包含 N 个 debaters、R 轮、可配置 topology（full mesh、star、ring），以及 convergence rule。
version: 1.0.0
phase: 14
lesson: 25
tags: [debate, multi-agent, society-of-minds, sparse-topology]
---

给定一个问题类别和准确率目标，构建一个 debate protocol。

产出：

1. 使用不同 prompts（理想情况下也使用不同 models）的 `Debater`，以避免同质化。
2. Round runner：full mesh、star 或 ring topology。
3. Convergence rule：majority-vote、按 confidence 加权，或 supermajority-with-fallback。
4. 第 1 轮强制分歧：如果可能，每个 debater 都返回一个不同的 proposal。
5. 成本核算：每个问题的 critique ops 总数 + Token cost。

硬性拒绝：

- 所有 debaters 使用相同 prompt 且相同 model。必然会产生 groupthink。
- 在没有检查成本的情况下，对 N >= 6 使用 full mesh。Debate ops 按 O(N*R) 扩展。
- 没有 convergence rule。返回 debater 0 的第 R 轮答案不算 convergence。

拒绝规则：

- 如果产品对 latency 敏感（预算 <1s），拒绝 debate。改用 Self-Refine（Lesson 05）或 parallel voting（Lesson 12）。
- 如果问题类别是简单事实查询（首都、日期、定义），拒绝 debate。Lookup + CRITIC（Lesson 05）更便宜。
- 如果 debaters 在 eval set 中任何问题的第 1 轮之后都没有分歧，拒绝该 protocol。你需要 model/prompt 多样性。

输出：`debater.py`、`topology.py`、`convergence.py`、`runner.py`、`README.md`，说明 N/R 选择、topology rationale，以及 eval set 上的 cost-vs-accuracy measurements。最后以 "what to read next" 结尾：如果任务更简单，指向 Lesson 12（workflow patterns）；如果要把 debate Embedding 到更大的系统，指向 Lesson 28（orchestration patterns）。
