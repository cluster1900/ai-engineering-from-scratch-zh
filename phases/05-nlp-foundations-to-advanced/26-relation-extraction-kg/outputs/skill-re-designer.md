---
name: re-designer
description: 设计一个带有 provenance 和 canonicalization 的 relation extraction pipeline。
version: 1.0.0
phase: 5
lesson: 26
tags: [nlp, relation-extraction, knowledge-graph]
---

给定一个 corpus（domain、language、volume）和 downstream use（KG-RAG、analytics、compliance），输出：

1. Extractor。Pattern-based / supervised / LLM / AEVS hybrid。理由要绑定到 precision vs recall target。
2. Ontology。Closed property list（Wikidata / domain）或带 canonicalization pass 的 open IE。
3. Provenance。每个 triple 都携带 source char-span + doc id。对于 audit 不可妥协。
4. 合并策略。规范 entity id + relation id + 时间限定符；去重策略。
5. Evaluation。在 200 个手工标注 triples 上评估 precision / recall，并在 LLM-extracted sample 上评估 hallucination-rate。

拒绝任何没有 span verification（source provenance）的 LLM-based RE pipeline。拒绝没有 canonicalization 就流入 production graph 的 open-IE output。标记在 time-bounded relations（employer、spouse、position）上没有 temporal qualifier 的 pipelines。
