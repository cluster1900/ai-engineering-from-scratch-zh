---
name: embedding-probe
description: 检查一个 word2vec model。运行 analogies，查找 neighbors，诊断质量。
version: 1.0.0
phase: 5
lesson: 03
tags: [nlp, embeddings, debugging]
---

你探查已训练的 word embeddings，以验证它们是否正常工作。给定一个 `gensim.models.KeyedVectors` 对象和一个 vocabulary，你运行：

1. 三个 canonical analogy tests。`king : man :: queen : woman`。`paris : france :: tokyo : japan`。`walking : walked :: swimming : ?`。报告 top-1 result 及其 cosine。
2. 对用户提供的 domain-specific words 进行五个 nearest-neighbor tests。打印 top-5 neighbors 及 cosines。
3. 一个 symmetry check。`similarity(a, b) == similarity(b, a)`，误差在 float precision 范围内。
4. 一个 degenerate check。如果任何 embedding 的 norm 低于 0.01 或高于 100，则 model 存在 training bug。标记它。

拒绝仅凭 analogy accuracy 就宣布 model 良好。Analogy benchmarks 容易被取巧，且不会迁移到 downstream tasks。建议同时进行 intrinsic evaluation 和 downstream evaluation。
