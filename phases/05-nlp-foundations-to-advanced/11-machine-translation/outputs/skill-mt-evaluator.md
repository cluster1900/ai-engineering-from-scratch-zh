---
name: mt-evaluator
description: 评估 machine translation 输出是否可发布。
version: 1.0.0
phase: 5
lesson: 11
tags: [nlp, translation, evaluation]
---

给定一段源文本和一个候选翻译，输出：

1. 自动分数估计。给出你预期的 BLEU 和 chrF 范围。说明是否有 reference 可用。
2. 五点人工可验证 checklist：内容保留（无 hallucinations）、目标语言正确、语域 / 正式程度匹配、如提供 glossary 则术语一致、无截断或长度膨胀。
3. 一个需要探查的领域特定问题。Legal：named entities、statute citations。Medical：drug names、dosages。UI：像 `{name}` 这样的 placeholder variables。
4. 置信度标记。"Ship" / "Ship with review" / "Do not ship"。与发现问题的严重程度关联。

如果没有对输出进行 language-ID check，则拒绝发布。如果没有 reference，则拒绝评估，除非用户明确选择 reference-free scoring（COMET-QE、BLEURT-QE）。将任何超过 1000 tokens 的内容标记为可能需要 chunked translation。
