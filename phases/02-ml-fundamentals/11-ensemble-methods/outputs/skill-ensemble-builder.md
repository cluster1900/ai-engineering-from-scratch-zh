---
name: skill-ensemble-builder
description: 为你的 problem 选择合适的 ensemble method 并完成配置
version: 1.0.0
phase: 2
lesson: 11
tags: [ensemble, bagging, boosting, random-forest, xgboost, stacking]
---

# Ensemble Method 选择指南

Ensembles 将多个 models 组合起来，产生比任何 single model 都更好的 predictions。问题始终是：使用哪一种 ensemble，以及什么时候使用？

## Decision Checklist

1. 你当前 model 的主要问题是什么？
   - High variance（overfitting）：使用 bagging（Random Forest）
   - High bias（underfitting）：使用 boosting（Gradient Boosting、XGBoost）
   - 两者都有，或你想要最高 accuracy：使用 stacking

2. 你有多少数据？
   - 低于 1,000 rows：Random Forest（稳健，很难配置错误）
   - 1,000 到 100,000：XGBoost 或 LightGBM（tabular 场景整体最佳）
   - 高于 100,000：LightGBM（最快的 gradient boosting，很好地处理 large data）

3. 你能投入多少 tuning time？
   - Minimal：使用 defaults 的 Random Forest（几乎总是有效）
   - Moderate：XGBoost with learning_rate=0.1，用 early stopping tune n_estimators
   - Maximum：LightGBM 或 XGBoost，配合 Bayesian hyperparameter search

4. 你需要 interpretability 吗？
   - 是：single decision tree 或 small Random Forest with feature importance
   - Partial：带 SHAP values 的 gradient boosting
   - No：stacking 或 deep ensembles

5. 数据是否 noisy 且有很多 outliers？
   - Yes：Random Forest（bagging 对 noise 很稳健）
   - No：gradient boosting（可以在 clean data 上进一步提升 accuracy）

## 什么时候使用每种方法

**Random Forest (Bagging)**：你的安全首选。它在 bootstrap samples 上训练许多 trees 并求平均。减少 variance，同时不增加 bias。在 moderate data 上几乎不可能 overfit。所需 tuning 极少：设置 n_estimators=100-500，其余保留 defaults。

**AdaBoost**：带 sample reweighting 的 sequential boosting。与简单 base learners（decision stumps）配合良好。对 outliers 和 noisy labels 敏感，因为它会提高 misclassified points 的权重。在实践中很大程度上已被 gradient boosting 取代。

**Gradient Boosting**：让每棵新 tree 拟合当前 ensemble 的 residuals。减少 bias。是 tabular data 上最强大的方法。需要 tuning：learning_rate、n_estimators、max_depth、min_child_weight、subsample。

**XGBoost**：带 regularization、second-order optimization 和 systems-level speedups 的 gradient boosting。原生处理 missing values。是 Kaggle competitions 和 production ML on tabular data 的默认选择。

**LightGBM**：使用 leaf-wise growth（而不是 level-wise）的 gradient boosting。在 large datasets 上比 XGBoost 更快。使用 histogram-based splits。最适合超过 50k rows 的 datasets。

**CatBoost**：带 native categorical feature handling 的 gradient boosting。不需要 one-hot encode。当你有许多 categorical features 时效果很好。

**Stacking**：在多个多样化 base models 的 predictions 上训练 meta-learner。当你需要绝对最佳 accuracy 且 compute 充足时使用。始终通过 cross-validation 生成 base model predictions，以避免 leakage。

**Voting**：最简单的 ensemble。Hard voting（majority class）或 soft voting（average probabilities）。无需 meta-learner，快速组合 2-3 个多样化 models。

## 常见错误
- 使用 gradient boosting 但没有 early stopping（如果运行 rounds 过多，它会 overfit）
- learning_rate 设置过高（高于 0.3 通常会导致 instability）
- 没有为 gradient boosting tune max_depth（unlimited 或非常深的 trees 默认值会 overfit）
- 用全是同一类型的 models 做 Stacking（diversity 才是 stacking 的关键）
- 在 noisy data 上使用 AdaBoost（outliers 每一轮都会获得越来越高的权重）
- 期待 Random Forest 修复 underfitting（它减少 variance，而不是 bias）

## 按方法划分的调优优先级

**Random Forest:**
1. n_estimators: 100-500（更多通常不会更差，只是更慢）
2. max_depth: None（让 trees 完全生长）或为了速度限制在 10-20
3. max_features: "sqrt" 用于 Classification，"log2" 或 n/3 用于 Regression

**XGBoost / LightGBM:**
1. learning_rate: 0.01-0.3（如果你有 compute 训练更多 trees，越低越好）
2. n_estimators: 在 validation set 上使用 early stopping，而不是猜测
3. max_depth: 3-8（从 6 开始）
4. min_child_weight / min_data_in_leaf: 1-20（更高可防止 overfitting）
5. subsample: 0.7-1.0
6. colsample_bytree: 0.7-1.0
7. reg_alpha (L1) and reg_lambda (L2): 0-10

## Quick reference

| Method | Reduces | Speed | Tuning effort | Best for |
|--------|---------|-------|--------------|----------|
| Random Forest | Variance | Fast | Low | Noisy data, quick baseline |
| AdaBoost | Bias | Fast | Low | Simple base learners, clean data |
| Gradient Boosting | Bias | Medium | High | Tabular data, competitions |
| XGBoost | Both | Fast | High | Production tabular ML |
| LightGBM | Both | Fastest | High | Large datasets (50k+ rows) |
| CatBoost | Both | Medium | Medium | Many categorical features |
| Stacking | Both | Slow | High | Maximum accuracy, diverse models |
| Voting | Variance | Fast | None | Quick combination of 2-3 models |
