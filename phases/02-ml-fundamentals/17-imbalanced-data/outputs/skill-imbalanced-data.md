---
name: skill-imbalanced-data
description: 处理不平衡 Classification 问题的决策检查清单
version: 1.0.0
phase: 2
lesson: 17
tags: [imbalanced-data, smote, class-weights, threshold-tuning, evaluation]
---

# Imbalanced Data 策略

用于处理不平衡 Classification 的决策检查清单。按照这个顺序，为你的问题选择合适的方法。

## 步骤 1： 衡量不平衡程度

- 统计每个 class 的样本数
- 计算不平衡比例（多数类 / 少数类）
- 轻度：比例 < 3:1（例如 70/30）
- 中度：比例 3:1 到 20:1（例如 95/5）
- 严重：比例 > 20:1（例如 99/1）

## 步骤 2： 选择合适的 metric

对于不平衡数据集，优先使用 precision/recall/F1，而不是 accuracy。根据你的问题选择：

| 情况 | 主要 Metric | 次要 Metric |
|-----------|---------------|-----------------|
| 漏掉 positives 的代价很高（欺诈、疾病） | Recall | F2 score |
| 误报代价很高（spam filter、recommendations） | Precision | F0.5 score |
| 两者大致同等重要 | F1 score | MCC |
| 需要单一排序 metric | AUPRC | AUC-ROC |
| 需要跨数据集比较 | MCC | AUPRC |

## 步骤 3： 选择重新平衡策略

### 按不平衡严重程度

| 不平衡程度 | 首先尝试 | 其次尝试 | 避免 |
|-----------|-----------|------------|-------|
| 轻度（< 3:1） | Class weights | Threshold tuning | Oversampling（不必要） |
| 中度（3:1 到 20:1） | SMOTE + class weights | 在此基础上做 threshold tuning | Undersampling（数据损失过多） |
| 严重（> 20:1） | SMOTE + class weights + threshold | 使用 balanced bagging 的 ensemble | 仅使用 undersampling |

### 按数据集大小

| 数据集大小 | 首选策略 | 原因 |
|-------------|-------------------|--------|
| < 1,000 个样本 | Oversampling 或 SMOTE | 承受不起丢失多数类数据 |
| 1,000 - 10,000 | SMOTE + threshold tuning | 少数类样本足够用于 k-NN |
| > 10,000 | Class weights 或 undersampling | 快速，少数类数据足够 |

## 步骤 4： 应用技术

### Class weights（总是先尝试）
- 在 sklearn 中：`class_weight='balanced'`
- 不需要修改数据
- 适用于任何基于 Loss 的 model
- 在期望意义上等价于 oversampling

### SMOTE
- 只应用于训练数据（绝不要用于 test/validation）
- 使用 k=5 neighbors（默认）
- 与 class weights 结合可获得最佳结果
- 注意边界附近有噪声的 synthetic points

### Threshold tuning
- 训练 model，在 validation set 上获取 predicted probabilities
- 从 0.05 到 0.95 扫描 thresholds
- 选择能最大化你所选 metric 的 threshold
- 总是在 validation data 上调优，绝不要在 test data 上调优

## 步骤 5： 正确验证

- 使用 stratified cross-validation（保留每个 fold 中的 class ratios）
- 在原始（未重采样）test set 上报告 metrics
- 绝不要在 splitting 前应用 SMOTE -- 只在 training folds 上应用
- 与“总是预测多数类”的 baseline 进行比较

## 步骤 6： 避免常见错误

- 在 train/test split 之前对整个数据集应用 SMOTE（data leakage）
- 使用 accuracy 作为 evaluation metric
- 没有先尝试 class weights（最简单的方法，通常已经足够）
- Oversampling 后再做 cross-validating（synthetic points 会跨 folds 泄漏）
- 忽略 threshold tuning（免费提升性能，不需要重新训练）
- 在小数据集上使用 random undersampling（丢弃太多数据）

## 快速决策树

1. 不平衡比例是否 < 3:1？ -> 只尝试 class weights
2. 数据集是否 > 10,000 个样本？ -> Class weights + threshold tuning
3. 数据集是否 < 1,000 个样本？ -> SMOTE + class weights
4. 否则 -> SMOTE + class weights + threshold tuning
5. 仍然不够好？ -> Balanced bagging ensemble
