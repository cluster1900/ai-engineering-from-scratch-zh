---
name: entity-linker
description: 设计一个 entity linking pipeline — KB、candidate generator、disambiguator、evaluation。
version: 1.0.0
phase: 5
lesson: 25
tags: [nlp, entity-linking, knowledge-graph]
---

给定一个 use case（domain KB、language、volume、latency budget），输出：

1. 知识库。Wikidata / Wikipedia / 自定义 KB。版本日期。刷新频率。
2. Candidate generator。Alias-index、embedding，或 hybrid。Target mention recall @ K。
3. Disambiguator。Prior + context、embedding-based、generative，或 LLM-prompted。
4. NIL strategy。Threshold on top score、classifier，或 explicit NIL candidate。
5. 评估。Mention recall @ 30、top-1 accuracy、NIL-detection F1 on held-out set。

拒绝任何没有 mention-recall baseline 的 EL pipeline（如果不知道 candidate gen 是否 surfaced 了正确 entity，就无法评估 disambiguator）。拒绝任何使用 LLM-prompted EL 但没有 constrained output 到 valid KB ids 的 pipeline。标记 popularity bias 会影响 minority entities（例如 name-clashes）且没有 domain fine-tuning 的 systems。
