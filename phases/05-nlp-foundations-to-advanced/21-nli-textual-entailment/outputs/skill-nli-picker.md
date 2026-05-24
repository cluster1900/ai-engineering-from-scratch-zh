---
name: nli-picker
description: 为 classification / faithfulness / zero-shot 任务选择 NLI model、label template 和 evaluation setup。
version: 1.0.0
phase: 5
lesson: 21
tags: [nlp, nli, zero-shot]
---

给定一个 use case（faithfulness check、zero-shot classification、document-level inference），输出：

1. Model。具名 NLI checkpoint。理由需关联 domain、length、language。
2. Template（如果是 zero-shot）。Verbalization pattern。Example。
3. Threshold。用于 decision rule 的 entailment cutoff。理由基于 calibration。
4. Evaluation。在 held-out labeled set 上的 accuracy、hypothesis-only baseline、adversarial subset。

如果没有 100-example labeled sanity check，拒绝交付 zero-shot classification。拒绝在 document-length premises 上使用 sentence-level NLI model。标记任何声称 NLI 解决 hallucination 的说法——它会降低 hallucination；但不会消除 hallucination。
