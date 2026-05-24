---
name: long-context-eval
description: 为给定模型和 use case 设计一组 long-context evaluation 测试。
version: 1.0.0
phase: 5
lesson: 28
tags: [nlp, long-context, evaluation]
---

给定目标模型、目标上下文长度和 use case，输出：

1. 测试。NIAH 深度 × 长度网格；RULER multi-hop；自定义领域任务。
2. 采样。每个长度下的深度 0, 0.25, 0.5, 0.75, 1.0。
3. 指标。Retrieval pass rate；reasoning pass rate；time-to-first-token；cost-per-query。
4. 截止点。有效检索长度（90% pass）和有效推理长度（70% pass）。两者都要报告。
5. 回归。固定 harness，在每次模型升级时重跑，并展示 deltas。

拒绝只根据 model card 信任上下文窗口。拒绝对任何 multi-hop workload 只做 NIAH evaluation。拒绝把供应商自报的 long-context 分数当作独立证据。
