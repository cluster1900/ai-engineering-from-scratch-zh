---
name: grammar-pipeline
description: 为下游 NLP 任务设计经典 POS + dependency pipeline。
version: 1.0.0
phase: 5
lesson: 07
tags: [nlp, pos, parsing]
---

给定一个下游任务（information extraction、rewrite validation、query decomposition、lemmatization），你输出：

1. Tagset。仅限 English 的 legacy pipelines 使用 Penn Treebank，多语言或跨语言使用 Universal Dependencies。
2. Library。大多数生产场景使用 spaCy（`en_core_web_sm` / `_lg` / `_trf`），学术级多语言使用 stanza，最高 UD 准确率使用 trankit。
3. Integration snippet。调用 library 并消费 `.pos_`、`.dep_`、`.head` 的 3-5 行代码。
4. 要测试的 failure mode。名词-动词歧义（`saw`、`book`、`can`）和 PP-attachment 歧义是经典陷阱。抽样 20 个输出并人工检查。

拒绝推荐从零编写自己的 parser。Building parsers from scratch 是研究项目，不是应用任务。将任何消费 POS tags 但不处理 lowercase / uppercase 变体的 pipeline 标记为脆弱。
