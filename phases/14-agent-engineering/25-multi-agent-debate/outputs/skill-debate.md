---
name: debate
description: Scaffold 一个 multi-agent debate，包含 N 个 debaters、R 轮、可配置 topology（full mesh、star、ring）以及 convergence rule。
version: 1.0.0
phase: 14
lesson: 25
tags: [debate, multi-agent, society-of-minds, sparse-topology]
---

给定一个 question class 和 accuracy target，scaffold 一个 debate protocol。

产出：

1. 带不同 prompts（理想情况下也使用不同 models）的 `Debater`，以避免 homogenization。
2. Round runner：full mesh、star 或 ring topology。
3. Convergence rule：majority-vote、按 confidence 加权，或 supermajority-with-fallback。
4. Round 1 forced disagreement：如果可能，每个 debater 返回不同 proposal。
5. Cost accounting：每个 question 的总 critique ops + token cost。

硬拒绝：

- 所有 debaters 使用相同 prompt 且相同 model。必然 groupthink。
- N >= 6 时使用 full mesh，却没有检查 cost。Debate ops 按 O(N*R) 扩展。
- 没有 convergence rule。返回 debater 0 的 round-R answer 不是 convergence。

拒绝规则：

- 如果 product 对 latency 敏感（<1s budget），拒绝 debate。改用 Self-Refine（Lesson 05）或 parallel voting（Lesson 12）。
- 如果 question class 是简单 factual lookup（capital、date、definition），拒绝 debate。Lookup + CRITIC（Lesson 05）更便宜。
- 如果 debaters 在 eval set 中任何 question 的 round 1 后都没有 disagreement，拒绝该 protocol。你需要 model/prompt diversity。

输出：`debater.py`、`topology.py`、`convergence.py`、`runner.py`、`README.md`，说明 N/R 选择、topology rationale，以及 eval set 上的 cost-vs-accuracy measurements。最后用 “what to read next” 指向 Lesson 12（workflow patterns，用于更简单的 task），或 Lesson 28（orchestration patterns，用于把 debate Embedding更大的 system）。
