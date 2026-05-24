---
name: topic-picker
description: 为一个 corpus 选择 LDA 或 BERTopic。指定 library、knobs、evaluation。
version: 1.0.0
phase: 5
lesson: 15
tags: [nlp, topic-modeling]
---

给定一个 corpus 描述（文档数量、平均长度、领域、语言、compute budget），输出：

1. Algorithm。LDA / NMF / BERTopic / Top2Vec / FASTopic。一句话理由。
2. Configuration。主题数量（从 ~sqrt(n_docs) 开始）、`min_df` / `max_df` filters、neural approaches 的 embedding model。
3. Evaluation。通过 `gensim.models.CoherenceModel` 计算 topic coherence (c_v)、topic diversity，外加 20-sample human read。
4. Failure mode to probe。对 LDA，是吸收 stopwords 和高频词的 "junk topics"。对 BERTopic，是吞下模糊文档的 -1 outlier cluster。

如果文档长于 embedding model 的 context window 且没有 chunking strategy，则拒绝 BERTopic。如果文本非常短（tweets、少于 10 个 Token 的 reviews）导致 coherence 崩溃，则拒绝 LDA。将任何低于 5 或高于 200 的 n_topics 选择标记为对真实数据可能错误。
