---
name: skill-feature-selector
description: 用于选择合适 feature selection 方法的快速参考 decision tree
version: 1.0.0
phase: 2
lesson: 18
tags: [feature-selection, mutual-information, rfe, lasso, tree-importance]
---

# Feature Selection 策略

用于选择并应用合适 feature selection 方法的快速参考。

## 步骤 1： 从清理开始

在应用任何方法之前，先移除明显无用的 features：

- **Constant features**：variance = 0。移除它们。
- **Near-constant features**：variance < 0.01（或你的 threshold）。移除它们。
- **Duplicate features**：完全相同的列。保留一个，删除其余。
- **ID columns**：每行唯一，不携带可泛化信息。移除它们。

这只需要几秒钟，并且能在混乱的真实世界 datasets 中消除 10-30% 的 features。

## 步骤 2： 根据你的情况选择方法

### 快速 Decision Tree

1. **< 50 features?** 从 mutual information ranking 开始。保留 top K。
2. **50 - 500 features?** 先使用 variance threshold，然后如果使用 linear model，就用 L1 (Lasso)；如果使用 trees，就用 tree importance。
3. **> 500 features?** 串联方法：variance threshold -> mutual information filter（top 50%）-> 对保留下来的 features 执行 RFE。
4. **需要 interpretability?** L1 regularization 会给出精确的 zero/nonzero。Tree importance 会给出排序后的 scores。
5. **需要捕捉 nonlinear relationships?** 使用 mutual information 或 tree-based importance。避免使用 L1（仅 linear）。
6. **需要 feature interactions?** 使用 RFE 或 tree-based importance。Filter methods 会漏掉 interactions。

### 方法参考

| Method | 何时使用 | 何时避免 |
|--------|------------|---------------|
| Variance threshold | 始终作为第一步 | 永远不要跳过这个 |
| Mutual information | 快速 ranking、nonlinear relationships | 当你需要 feature interaction detection 时 |
| RFE | 彻底 selection、中等 feature 数量 | 非常昂贵的 models、> 1000 features |
| L1 / Lasso | Linear models、快速 embedded selection | Nonlinear problems、高度相关的 features |
| Tree importance | Nonlinear relationships、feature interactions | 会受到 high-cardinality features 的偏置影响 |
| Permutation importance | Model-agnostic validation、最终检查 | 对 initial screening 来说太慢 |

## 步骤 3： 验证你的 selection

- 比较使用 selected features 与使用 all features 时的 model performance
- 使用 cross-validation，而不是单一 train/test split
- 如果 performance 下降超过 1-2%，你可能移除了有用的 features
- 如果 performance 改善，你就成功移除了 noise

## 步骤 4： 处理常见陷阱

### Correlated features
- L1 会从一组 correlated features 中任意选一个，并将其他的置为零
- 先计算 correlation matrix，再决定保留哪些 correlated features
- Tree importance 会把 importance 分散到 correlated features 上

### Data leakage
- 只在 training data 上 fit feature selection
- 将相同的 selection 应用于 test data
- 在 cross-validation 中，feature selection 必须发生在每个 fold 内部

### 对 feature selection 过拟合
- 迭代次数过多的 RFE 可能会对 training set 过拟合
- 在 held-out data 上验证，而不是在用于 selection 的 data 上验证
- 使用 stability selection（在 subsamples 上重复）获得更稳健的结果

## 步骤 5： 生产检查清单

- [ ] Variance threshold 已作为第一道 filter 应用
- [ ] Feature selection 只在 training data 上 fit
- [ ] Selected features 已记录（names、使用的方法、scores）
- [ ] 已比较 performance：selected features vs all features
- [ ] 已 cross-validated，而不是 single-split evaluation
- [ ] Feature selection 已集成到 training pipeline 中（不是手动完成）
- [ ] 已设置 monitoring 来监测 feature drift（selected features 可能会过时）
