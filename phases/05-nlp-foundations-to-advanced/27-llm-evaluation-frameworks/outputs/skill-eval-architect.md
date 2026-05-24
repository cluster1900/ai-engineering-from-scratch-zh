---
name: eval-architect
description: 设计一个带 calibrated judge 和 CI gates 的 LLM evaluation plan。
version: 1.0.0
phase: 5
lesson: 27
tags: [nlp, evaluation, rag]
---

给定一个 use case（RAG / agent / generative task），输出：

1. Metrics。Faithfulness / relevance / context-precision / context-recall + 任何带 criteria 的自定义 G-Eval metrics。
2. Judge model。命名 model + version，并说明 cost vs accuracy 的理由。
3. Calibration。手工标注集大小，目标 Spearman rho vs human > 0.7。
4. Dataset versioning。Tag 策略、change log、stratification。
5. CI gate。每个 metric 的 thresholds、regression-window logic、bottom-quantile alert。

拒绝依赖未在 ≥50 个人工标注示例上测试过的 judge。拒绝 self-evaluation（同一 model 生成 + 判断）。拒绝没有 bottom-10% surfacing 的 aggregate-only reporting。标记任何 judge upgrade 未经过 parallel baseline eval 就落地的 pipeline。
