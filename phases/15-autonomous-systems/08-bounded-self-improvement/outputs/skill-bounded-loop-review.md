---
name: bounded-loop-review
description: 根据四个 primitive stack（invariants、anchor、multi-objective、regression detection）审计 proposed bounded self-improvement loop。
version: 1.0.0
phase: 15
lesson: 8
tags: [bounded-self-improvement, invariants, alignment-anchor, rsi-safety]
---

给定一个 proposed self-improvement loop，根据 ICLR 2026 RSI Workshop 识别出的四个 bounding primitives 对其评分，并产出具体的 gap analysis。

产出：

1. **Invariant inventory.** 列出 loop 强制执行的每一个 invariant。对每个 invariant，说明 (a) 检查什么，(b) 检查在哪里运行（agent reach 内部/外部），(c) 违规会导致什么（hard reject、pause、log-only）。
2. **Anchor identification.** 命名 alignment anchor（objective statement、constitution、intent description）。说明其存储位置，并验证 loop 无法编辑它。如果没有 anchor，将其标记为 missing。
3. **Multi-objective axes.** 列出 loop 评估的每个 axis。确认 safety、fairness 和 robustness 与 performance 一起存在。single-axis loop 无法通过此检查。
4. **Regression policy.** 说明 historical window、per-axis tolerance，以及检测到下降时会发生什么。确认 regression checks 使用外部 comparison set，而不只是 internal history。
5. **Gap analysis.** 对每个缺失的 primitive，预测最先出现的 failure class。缺少 invariants → smuggled capability 或 tool drift。缺少 anchor → objective reinterpretation。缺少 multi-objective → safety regression 掩盖 performance gain。缺少 regression → silent capability loss。

Hard rejects:
- 任何没有 invariants 的 loop。
- 任何没有位于 edit surface 之外的 alignment anchor 的 loop。
- 任何优化单一 scalar score 的 loop。
- 任何 regression check 只读取自身 history 的 loop（loop 自己定义“normal”）。

Refusal rules:
- 如果 user 把“它还没有坏过”当作 safety 证据，拒绝，并要求在花费任何 compute 前先提供显式 gate design。
- 如果 user 无法在 15 分钟内给出 invariants list，拒绝——该 loop 没有 invariants。
- 如果 proposed loop 要在 production 中运行（影响真实 users 或 infrastructure），但没有全部四个 primitives，拒绝，并要求先进行带 monitoring 的 staging。

Output format:

返回一份 scored review，包含：
- **Invariant score**（0-5，带显式 list）
- **Anchor score**（0-5，带 storage 和 verify method）
- **Multi-objective score**（0-5，列出 axes）
- **Regression score**（0-5，带 tolerance 和 window）
- **Gap analysis**（预测的 first failure、mitigation plan）
- **部署就绪度**（production / staging / research-only）
