---
name: skill-evaluation
description: Classification 和 Regression models 的 Evaluation 策略检查清单
version: 1.0.0
phase: 2
lesson: 9
tags: [evaluation, metrics, cross-validation, model-selection]
---

# Model Evaluation 策略

用于正确评估任何 ML model 的检查清单。按此顺序操作，可以避免最常见的 evaluation 错误。

## 步骤 1： 正确拆分数据

- 在任何 preprocessing（scaling、imputation、encoding）之前先拆分
- 对 Classification 任务使用 stratified splits
- 保留一个 test set，并且只在最后使用一次
- 对于小数据集，使用 5-fold 或 10-fold cross-validation，而不是单次拆分
- 对于 time series，使用基于时间的拆分（绝不要 shuffle）

## 步骤 2： 选择正确的 metric

### Classification

| Situation | Use this metric | Why |
|-----------|----------------|-----|
| 类别均衡，简单比较 | Accuracy | 易于解释，当类别数量相等时有意义 |
| False positives 代价高（spam filter、fraud alerts） | Precision | 衡量被标记的项目中有多少确实是 positive |
| False negatives 代价高（cancer screening、security） | Recall | 衡量实际 positive 中你捕获了多少 |
| 需要平衡 precision 和 recall | F1 Score | 调和平均数，会惩罚极端不均衡 |
| 跨 threshold 比较 models | AUC-ROC | 与 threshold 无关的排序质量 |
| 数据不均衡 | F1、AUC-ROC 或 PR-AUC | 对 imbalanced classes 来说，Accuracy 具有误导性 |

### Regression

| Situation | Use this metric | Why |
|-----------|----------------|-----|
| 标准 Regression，outliers 可接受 | RMSE | 与 target 使用相同单位，会惩罚大误差 |
| 对 outliers 稳健的 evaluation | MAE | 平等对待所有 errors，不会被 outliers 主导 |
| 比较不同尺度上的 models | R-squared | 标准化的 0-1 尺度（解释的 variance 比例） |
| 业务需要 dollar amounts | MAE 或 RMSE | 可直接解释为 error magnitude |

## 步骤 3： 建立 baselines

在评估你的 model 之前，计算 baseline performance：
- Classification：majority class predictor（始终预测最常见的 class）
- Regression：始终预测 training target 的 mean
- 任何无法超过这些 baselines 的 model 都没有在学习

## 步骤 4： Cross-validate

- 使用 K-fold（K=5 或 K=10）获得稳定估计
- 对 Classification 使用 stratified K-fold
- 报告各 folds 的 mean 和 standard deviation
- mean=0.85 且 std=0.02 的 model，比 mean=0.87 且 std=0.10 的 model 更可信

## 步骤 5： 统计性地比较 models

- 不要在没有检查 significance 的情况下选择平均分最高的 model
- 在 cross-validation folds 上使用 paired t-test
- 如果 |t| < 2.78（对于 K=5，df=4，p<0.05），差异可能来自随机性
- 当性能差异不显著时，考虑更简单的 model

## 步骤 6： 检查常见错误

- Data leakage：是否有任何 test data 信息流入 training？（拆分前 scaling、由 target 派生的 features）
- Class imbalance：accuracy 是否掩盖了较差的 minority-class performance？
- Overfitting：training 和 validation performance 之间的差距是否很大？
- 评估次数过多：你是否查看 test set 超过一次？

## 步骤 7： 报告最终 performance

- 在 train + validation 合并后的数据上训练
- 在 held-out test set 上只评估一次
- 如果可能，报告所选 metric 及 confidence intervals
- 说明 baseline comparison（比 random/mean 好多少）
