---
name: coref-picker
description: 选择 coreference 方法、evaluation plan 和 integration strategy。
version: 1.0.0
phase: 5
lesson: 24
tags: [nlp, coref, information-extraction]
---

给定一个 use case（single-doc / multi-doc、domain、language），输出：

1. Approach。Rule-based / neural span-based / LLM-prompted / hybrid。一句话说明原因。
2. Model。如果是 neural，给出命名 checkpoint。
3. Integration。操作顺序：tokenize → NER → coref → downstream task。
4. Evaluation。在 held-out set 上的 CoNLL F1（MUC + B³ + CEAF-φ4 平均值）+ 对 20 个 documents 的 manual cluster review。

拒绝不带 sliding-window merge、用于超过 2,000 tokens 文档的 LLM-only coref。拒绝任何没有 mention-level precision-recall report 就运行 coref 的 pipeline。标记部署在 demographically diverse text 中的 gender-heuristic systems。
