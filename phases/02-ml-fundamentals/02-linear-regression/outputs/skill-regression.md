---
name: skill-regression
description: 根据数据特征和问题约束选择合适的 Regression 方法
version: 1.0.0
phase: 2
lesson: 2
tags: [regression, linear-regression, polynomial-regression, ridge, regularization]
---

# Regression 策略指南

Regression 用于预测连续值。合适的方法取决于特征与目标之间的关系、特征数量，以及过拟合风险。

## 决策检查清单

1. 特征与目标之间的关系是否近似线性？
   - 是：从普通 Linear Regression 开始
   - 否：尝试 polynomial features 或非线性模型

2. 相对于样本数量，你有多少特征？
   - 特征少、样本多：普通 Linear Regression 就可以很好地工作
   - 特征多、样本少：使用 regularization（Ridge 或 Lasso）
   - 特征数量多于样本数量：使用 Lasso (L1) 选择特征，或使用 Ridge (L2) 收缩所有权重

3. 你是否需要可解释性？
   - 是：使用少量特征的 Linear Regression，或用 Lasso 进行自动特征选择
   - 否：使用 polynomial features，或转向 tree-based models 或 neural networks

4. 你的 dataset 是否较小（少于 10,000 行）？
   - 使用 normal equation（closed-form solution）以提高速度
   - Cross-validation 对可靠评估至关重要

5. 你的 dataset 是否很大（数百万行）？
   - 使用 stochastic gradient descent (SGD) 或 mini-batch gradient descent
   - normal equation 因为 O(n^3) Matrix inversion 会太慢

## 何时使用每种方法

**Ordinary Linear Regression**：任何 Regression 任务的 baseline。从这里开始。如果 R-squared 可接受且模型简单，就停在这里。

**Polynomial Regression**：scatter plot 显示的是曲线，而不是直线。从 degree 2 开始。只有在 validation performance 支持时才增加 degree。Degree > 5 几乎总是会过拟合。

**Ridge Regression (L2)**：存在许多相关特征。所有权重都会向零收缩，但没有任何权重会精确变为零。当你认为所有特征都有贡献时很适合。

**Lasso Regression (L1)**：特征很多，并且你怀疑只有少数特征重要。Lasso 会把无关特征的权重压到精确为零，从而执行自动特征选择。

**Elastic Net**：结合 L1 和 L2 penalties。当你有许多相关特征，并且希望进行一定程度的特征选择时使用。

## 常见错误

- 在 Gradient Descent 前跳过 feature scaling（convergence 会变得极慢）
- 使用 test set performance 调整 hyperparameters（应使用 validation set 或 cross-validation）
- 在不检查 validation error 的情况下拟合 high-degree polynomials（training R^2 总是会随 degree 增加）
- 忽略 residual plots（如果 residuals 显示出模式，R^2 可能具有误导性）
- 把 R^2 当作唯一 metric（应检查 residual distribution、MAE 和领域特定阈值）

## 快速参考

| Method | When to use | Regularization | Feature selection |
|--------|------------|---------------|-------------------|
| OLS | Baseline，特征少 | None | Manual |
| Ridge | 特征多，且都相关 | L2（收缩） | No |
| Lasso | 特征多，少数相关 | L1（归零） | Automatic |
| Elastic Net | 许多相关特征 | L1 + L2 | Partial |
| Polynomial | 非线性关系 | 在其上添加 Ridge/Lasso | 手动选择 degree |
