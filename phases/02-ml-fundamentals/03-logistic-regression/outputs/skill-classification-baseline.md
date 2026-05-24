---
name: skill-classification-baseline
description: 在使用复杂模型之前，建立一个强 Classification baseline
version: 1.0.0
phase: 2
lesson: 3
tags: [classification, logistic-regression, baseline, preprocessing]
---

# Classification Baseline 指南

在尝试复杂模型之前，先用 logistic regression 建立 baseline。它能在几秒内完成训练，输出概率，并且完全可解释。现实世界中有相当多的问题根本不需要更复杂的东西。

## 决策检查清单

1. decision boundary 是否可能是线性的？
   - 是：logistic regression 很可能就足够了
   - 否：你仍然需要它作为 baseline，用来衡量改进幅度

2. 你有多少个 features？
   - 少于 50：标准 logistic regression 可以正常工作
   - 50 到 10,000：加入 L2 regularization (Ridge)
   - 超过 10,000（例如 TF-IDF 文本 features）：使用 L1 regularization (Lasso) 或 LinearSVC

3. dataset 是否 imbalanced？
   - 比例低于 5:1：通常不需要调整
   - 5:1 到 50:1：在 sklearn 中使用 `class_weight="balanced"`
   - 超过 50:1：将 class weighting 与合适的 metric（precision、recall 或 F1）结合使用

4. features 是否处于不同尺度？
   - 在 logistic regression 之前始终进行标准化。它使用基于 Gradient 的优化，未缩放的 features 会减慢收敛，或扭曲 decision boundary。

5. 是否存在缺失值？
   - 在 fitting 之前进行 impute。logistic regression 无法处理 NaNs。
   - 对数值列使用中位数 imputation，对类别列使用 mode。

## 什么时候 logistic regression 已经足够好

- Binary Classification，并且 feature 关系大多是线性的
- 你需要概率输出（而不仅是 class labels）
- 需要可解释性（标准化后，系数表示 feature 重要性的方向和相对大小）
- 训练数据较小（数百到几千个 samples）
- 你需要一个用于实时 serving 的快速模型（inference 时只需一次 dot product）
- 监管或合规要求需要 explainability

## 什么时候应该升级

- accuracy 明显低于目标并进入平台期，而且你已经尝试过 feature engineering
- features 和 target 之间的关系明显非线性（检查 residual plots）
- 你有大型 tabular data（10k+ 行）：尝试 gradient boosting（XGBoost 或 LightGBM）
- features 存在复杂交互，polynomial features 无法捕获
- 你有图像、文本或序列数据：直接在 raw inputs 上使用 logistic regression 不会有效

## Classification baseline 的 preprocessing 步骤

1. **Train/test split** 要先做，早于任何 preprocessing。这可以防止 data leakage。
2. **处理缺失值**：数值列用中位数 impute，类别列用 mode impute。
3. **Encode categoricals**：低 cardinality（少于 10 个值）用 one-hot，更高 cardinality 用 target encoding。target encoding 只在 training folds 上 fit（使用 out-of-fold encoding 防止 leakage）。
4. **Scale numerics**：StandardScaler（零均值、单位方差）。在 train 上 fit，对两者都 transform。
5. **Fit logistic regression**，使用 `C=1.0`（默认 regularization）。
6. **Evaluate**：confusion matrix、precision、recall、F1。不只看 accuracy。
7. **Tune threshold**：默认的 0.5 很少是最优的。扫描 0.1 到 0.9，并选择与你的 precision/recall 优先级匹配的 threshold。

## 常见错误

- 在 imbalanced data 上只评估 accuracy（预测 majority class 的模型得分很高，但没有实际用处）
- 忘记 scale features（使用未缩放 features 的 logistic regression 训练很慢，并且会收敛到更差的解）
- 使用 test set 来调 decision threshold（应使用 validation 或 cross-validation）
- 跳过 baseline，直接上 XGBoost（你会失去可解释性，也没有参考点）
- 不检查 multicollinearity（高度相关的 features 会放大 coefficient variance）

## 快速参考

| 场景 | Model | Regularization | 关键设置 |
|----------|-------|---------------|-------------|
| features 少，需要可解释 | LogisticRegression | L2（默认） | C=1.0 |
| features 多，有些不相关 | LogisticRegression | L1 | penalty="l1", solver="saga" |
| High-dim sparse（文本） | SGDClassifier | L1 或 ElasticNet | loss="log_loss" |
| Imbalanced classes | LogisticRegression | L2 | class_weight="balanced" |
| 需要概率 | LogisticRegression | L2 | predict_proba() |
| 只需要 class labels | LinearSVC | L2 | 对大数据比 LR 更快 |
