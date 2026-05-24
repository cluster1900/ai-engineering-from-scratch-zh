---
name: qa-architect
description: 选择 QA 架构、检索策略和评估计划。
version: 1.0.0
phase: 5
lesson: 13
tags: [nlp, qa, rag]
---

给定需求（语料库大小、问题类型、事实性约束、延迟预算），输出：

1. 架构。Extractive、带 extractive reader 的 RAG、带 generative reader 的 RAG，或 closed-book LLM。用一句话说明理由。
2. Retriever。None、BM25、dense（写出 encoder 名称，如 `all-MiniLM-L6-v2`），或 hybrid。
3. Reader。SQuAD-tuned model（`deepset/roberta-base-squad2`）、按名称指定的 LLM，或面向领域 fine-tuned 的 DistilBERT。
4. 评估。对 extractive benchmarks 使用 EM + F1；对生产环境使用答案准确率 + 引用准确率 + refusal calibration。说明你在测量什么以及如何测量。

对于监管或合规敏感问题，拒绝 closed-book LLM 答案。拒绝任何没有检索召回 baseline 的 QA 系统（如果不知道 retriever 是否呈现了正确段落，就无法评估 reader）。标记需要 multi-hop reasoning 的问题，说明它们需要专门的 multi-hop retrievers，例如 HotpotQA-trained systems。
