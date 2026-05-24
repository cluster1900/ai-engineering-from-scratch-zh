---
name: bert-finetuner
description: 为新的 Classification、抽取或 Retrieval 任务界定 BERT fine-tune 范围。
version: 1.0.0
phase: 7
lesson: 6
tags: [bert, fine-tuning, nlp]
---

给定一个下游任务（Classification / NER / Retrieval / reranking / NLI）、标注数据规模，以及部署约束（latency、device），输出：

1. Backbone 选择。Model 名称（ModernBERT-base / large、DeBERTa-v3、multilingual-e5 等）及一句话理由。对于需要 ≤8K context 的英文任务，优先选择 ModernBERT。
2. Head 规格。Classification：`[CLS]` → dropout → linear(num_classes)。NER：per-token linear + CRF 可选。Retrieval：mean-pool + contrastive loss。
3. 训练方案。Optimizer（AdamW，典型 lr 2e-5）、warmup %（6–10%）、epochs（3–5）、batch size、fp16/bf16。
4. Eval 计划。与任务匹配的 metrics（Classification 使用 accuracy + F1，NER 使用 entity-level F1，Retrieval 使用 MRR/NDCG）。Held-out split size。
5. Failure mode 检查。一个具名风险：label leakage、class imbalance、context truncation、pretrain 与 fine-tune corpora 之间的 Tokenizer mismatch。

拒绝将 BERT fine-tune 用于 generative output（text generation）——改为推荐 decoder-only。若 minority class 低于 10%，拒绝在没有 class-stratified eval 的情况下交付 fine-tune。标记任何在 <1,000 个标注样本下 unfreeze full backbone 的 fine-tune，提示其很可能 overfit。
