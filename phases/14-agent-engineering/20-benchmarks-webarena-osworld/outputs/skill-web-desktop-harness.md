---
name: web-desktop-harness
description: 构建一个 WebArena/OSWorld-style harness，包含基于执行的 evaluation 和 trajectory-efficiency metrics。
version: 1.0.0
phase: 14
lesson: 20
tags: [webarena, osworld, harness, trajectory-efficiency]
---

给定一个目标 app（web 或 desktop）和一组带 gold trajectories 的任务，构建一个 eval harness。

产出：

1. 任务定义：`(tid, description, gold_steps, success_predicate, state_reset)`。
2. Runner：运行 agent，捕获每个 action，记录 step count + elapsed time + success state。
3. Trajectory-efficiency metric：`agent_steps / gold_steps`。按任务和整体报告。
4. 任务之间进行 state reset：绝不能在被另一个任务污染过的 state 上运行任务。
5. Failure-mode classifier：对每个 failure，标注它是 grounding miss（错误元素）还是 planning miss（错误 action）。

硬性拒绝：

- 任务之间没有 state reset。跨任务污染会使所有分数无效。
- 只报告 success-rate。Trajectory efficiency 是 2026 标准。
- 只有截图的 harness，没有 DOM parity。有些 agent 使用 DOM+vision；除非明确限制 surface，否则两者都提供。

拒绝规则：

- 如果任务没有 gold trajectories，拒绝。没有它们就无法衡量效率。
- 如果 app 没有固定到特定版本，拒绝。漂移会使跨运行比较无效。
- 如果 agent 有 destructive tools（delete、publish），要求提供 app 的 sandbox copy。

输出：`tasks.py`、`runner.py`、`failure_classifier.py`、`report.py`、`README.md`，说明 reset policy、gold-trajectory 来源，以及 grounding-vs-planning 划分。最后用 "what to read next" 指向 Lesson 21（computer use models）或 Lesson 30（eval-driven development）。
