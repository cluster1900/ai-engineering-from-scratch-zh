---
name: skill-naive-bayes-chooser
description: 为你的 Classification 任务选择正确的 Naive Bayes 变体
phase: 2
lesson: 14
---

你是 probabilistic Classification 方面的专家。当有人需要选择 Naive Bayes 变体时，引导他们完成这个决策流程。

## 决策 Checklist

### 步骤 1： 你的 features 是什么？

- **Word counts 或 TF-IDF values** -> MultinomialNB
- **连续测量值（temperature, height, sensor readings）** -> GaussianNB
- **二元指示变量（word present/absent, checkbox states）** -> BernoulliNB
- **Mixed types** -> 拆分为 subsets，或全部转换为一种类型

### 步骤 2： 你有多少数据？

- **少于 1,000 samples**：Naive Bayes 是一个强选择。它的强 prior（independence assumption）可以防止 overfitting。
- **1,000 到 50,000 samples**：NB 仍然有竞争力。与 logistic regression 进行比较。
- **超过 50,000 samples**：logistic regression 或 gradient boosting 很可能优于 NB。把 NB 用作 baseline。

### 步骤 3： 调整 smoothing

- 从 alpha=1.0（Laplace smoothing）开始。
- 如果 accuracy 较低且你有足够数据，尝试 alpha=0.1 或 0.01。
- 如果 model 正在 overfitting（train >> test accuracy），把 alpha 增加到 5.0 或 10.0。
- 始终用 cross-validation 验证 smoothing，而不是单次 train/test split。

### 步骤 4： 检查 assumptions

- **MultinomialNB**：Features 必须为 non-negative。如果你有 negative values，请平移数值或使用 GaussianNB。
- **GaussianNB**：当每个 class 内的 features 大致呈 bell-shaped 时效果最好。用 histograms 检查。
- **BernoulliNB**：先 binarize 你的 features。仔细选择 threshold（对于 text：present=1, absent=0）。

## 常见错误

1. **在 text data 上使用 GaussianNB。** Word counts 不是 Gaussian。使用 MultinomialNB。
2. **忘记 Laplace smoothing。** 一个从未见过的 word 会让整个 probability 归零。始终进行 smoothing。
3. **信任 probability outputs。** NB probabilities 的 calibration 很差。把它们用于 ranking，而不是 confidence scores。如果你需要 calibrated probabilities，使用 CalibratedClassifierCV。
4. **忽视 class imbalance。** NB priors 反映 class frequencies。当 99% 为 negative、1% 为 positive 时，prior 会压过 likelihood。手动调整 priors 或 resample。

## 快速参考

| Question | MultinomialNB | GaussianNB | BernoulliNB |
|----------|:---:|:---:|:---:|
| Text classification? | 是 | 否 | 可能（short text） |
| Continuous features? | 否 | 是 | 否 |
| Binary features? | 否 | 否 | 是 |
| 需要非常快的 training？ | 是 | 是 | 是 |
| Small training set? | 好 | 好 | 好 |
| 需要 calibrated probabilities？ | 否 | 否 | 否 |

## 什么时候不要使用 Naive Bayes

- Features 高度相关，并且你有足够数据来使用能处理 correlations 的 model（logistic regression, gradient boosting）
- 你需要尽可能高的 accuracy，并且有大量数据
- 你的 features 是 images、sequences 或 graphs（使用 Neural Network）
- 你需要一个能捕捉 feature interactions 的 model（使用 tree-based methods）
