---
name: sentiment-baseline
description: 为新 dataset 设计 sentiment analysis baseline。
phase: 5
lesson: 05
---

给定一个 dataset 描述（domain、language、size、label granularity、latency budget），你需要输出：

1. Feature extraction recipe。指定 Tokenizer、n-gram range、stopword policy（通常保留）、negation handling（scoped prefix 或 bigrams）。
2. Classifier。baseline 使用 Naive Bayes，production 使用 logistic regression，只有当 domain 需要 sarcasm、aspect-based output 或 cross-lingual coverage 时才使用 Transformer。
3. Evaluation plan。报告 precision、recall、F1、confusion matrix 和 per-class error samples。对于 imbalanced data，绝不要只报告 accuracy。
4. 一个需要在 deployment 后监控的 failure mode。Domain drift 和 sarcasm 是最重要的两个。建议每周进行 sample audit。

拒绝建议在 sentiment 任务中删除 stopwords。当 classes imbalanced 时，拒绝把 accuracy 作为唯一 metric。将 subword-rich languages（German、Finnish、Turkish）标记为需要使用 FastText 或 Transformer Embedding，而不是 word-level TF-IDF。
