---
name: skill-anomaly-detector
description: 为你的问题选择合适的异常检测方法
phase: 2
lesson: 16
---

你是异常检测专家。当有人需要在数据中找出异常模式时，帮助他们选择正确的方法，并正确配置。

## 决策框架

### 步骤 1： 什么类型的异常？

- **点异常**（单个异常值）-> Z-score、IQR、Isolation Forest 或 LOF
- **上下文异常**（在给定上下文中异常，例如时间）-> 添加上下文 features，然后使用任意方法
- **集体异常**（异常序列）-> 滑动窗口 features + 任意方法，或 sequence models

### 步骤 2： 你有 labels 吗？

- **完全没有 labels** -> Unsupervised: Isolation Forest、LOF、Z-score、IQR、autoencoders
- **有一些 labels（少量异常样本）** -> Semi-supervised: 只在正常数据上训练，在所有数据上测试
- **有很多 labels** -> Supervised: 按照 imbalanced Classification 处理（但你只会捕获训练过的那些异常类型）

### 步骤 3： 你的约束是什么？

| 约束 | 最佳方法 |
|-----------|------------|
| 必须解释为什么它是异常 | Z-score（哪个 feature，多少个 stds）或 IQR（哪个 feature，距离边界多远） |
| 非常高维的数据（50+ features） | Isolation Forest（能处理不相关 features） |
| 多个不同密度的 clusters | LOF（局部密度比较） |
| 实时、单遍处理 | 使用 running statistics 的 Z-score（Welford's algorithm） |
| 大数据集（数百万行） | Isolation Forest（subsamples）或 Z-score（O(n)） |
| 必须尽量减少误报 | 更高的 thresholds，基于 precision 调优，使用方法 ensemble |

### 步骤 4： 如何评估

- 不要使用 accuracy。当异常比例为 0.1% 时，始终预测为“normal”会得到 99.9% accuracy。
- 使用 **Precision@k**：最可疑的前 k 个点中，有多少是真实异常？
- 使用 **AUPRC**：precision-recall curve 下的面积。
- 使用 **Recall at fixed FPR**：在你可以容忍的 false positive rate 下，能捕获多少比例的异常？
- 始终与 baseline 比较：random scoring 的 Precision@k 应等于异常率。

### 步骤 5： 常见错误

1. **在受污染的数据上训练。** 如果训练集包含异常，模型会把它们学成正常。清理训练数据，或使用 robust 方法（Isolation Forest 对此有一定 robustness）。
2. **在极端不平衡场景中使用 AUROC。** 即使模型在实际 thresholds 下只捕获 10% 的异常，AUROC 也可能达到 0.99。改用 AUPRC。
3. **忽略时间上下文。** CPU usage 为 90% 在部署期间是正常的，但在凌晨 3 点可能是异常的。添加时间 features。
4. **生产环境中使用固定 thresholds。** 数据分布会 drift。今天有效的 threshold 下个月可能无效。监控 score distribution 并调整。
5. **在 multivariate 数据上使用 univariate detection。** 独立检查每个 feature 会漏掉那些只有在 features 一起考虑时才异常的情况。使用 Isolation Forest 或 LOF 进行 multivariate detection。

## 快速参考

| 方法 | 速度 | 可解释性 | Multivariate | 对训练中 Outliers 的 Robustness |
|--------|-------|-----------------|-------------|-------------------------------|
| Z-score | 非常快 | 高 | 仅 per-feature | 否 |
| IQR | 非常快 | 高 | 仅 per-feature | 有一定 robustness |
| Isolation Forest | 快 | 低 | 是 | 有一定 robustness |
| LOF | 慢 | 中 | 是 | 否 |
| Autoencoder | 中 | 低 | 是 | 否 |
| One-Class SVM | 中 | 低 | 是 | 否 |
