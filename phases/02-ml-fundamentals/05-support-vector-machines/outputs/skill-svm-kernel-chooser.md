---
name: skill-svm-kernel-chooser
description: 为你的问题选择合适的 SVM kernel，并调优 C 和 gamma
version: 1.0.0
phase: 2
lesson: 5
tags: [svm, kernel, classification, hyperparameter-tuning]
---

# SVM Kernel 选择指南

SVM 由两个选择定义：kernel（决定决策边界的形状）和正则化参数（控制 margin 宽度与 Classification 错误之间的权衡）。把这些选对，是无用模型和强模型之间的差别。

## 决策检查清单

1. 数据是否线性可分（或接近线性可分）？
   - 是：使用 linear kernel。它更快，也更容易解释。
   - 否：进入第 2 步。

2. features 和 samples 的数量关系如何？
   - Features >> samples（例如，使用 TF-IDF 的文本）：使用 linear kernel。高维数据通常是线性可分的。RBF 会增加复杂度，却没有收益。
   - Samples >> features（例如，包含 10-50 个 features 的表格数据）：RBF kernel 是默认选择。

3. 预期的决策边界是否平滑？
   - 平滑、连续的边界：RBF kernel
   - 多项式形状的边界：polynomial kernel（从 degree 2 或 3 开始）
   - 领域知识表明存在特定交互项：使用匹配 degree 的 polynomial kernel

4. dataset 有多大？
   - 10,000 个 samples 以下：任何 kernel 都可用，RBF 是稳妥的默认选择
   - 10,000 到 100,000：linear kernel 或 LinearSVC（primal formulation，每个 epoch 为 O(n)）
   - 超过 100,000：不要使用 kernel SVM。改用 linear SVM、gradient boosting 或 neural networks。

5. 你是否缩放了 features？
   - SVM 需要 feature scaling。拟合前始终进行标准化（零均值、单位方差）。未缩放的 features 会扭曲 margin 几何结构。

## Kernel 选择流程图

```
Start
  |
  v
Features > 1000 or features >> samples?
  Yes --> Linear kernel (LinearSVC for speed)
  No  --> Dataset < 10k samples?
            Yes --> Try RBF first (best general-purpose kernel)
            No  --> Linear kernel (kernel SVMs are O(n^2) to O(n^3))
```

如果 RBF 效果不好，尝试 polynomial degree 2-3。如果仍然失败，这个问题可能不适合 SVM。

## 调优 C（正则化）

C 控制对 misclassifications 的惩罚。它与正则化强度成反比。

| C value | 影响 | 何时使用 |
|---------|--------|-------------|
| 0.001 - 0.01 | 宽 margin，允许较多 violations | 噪声数据，希望提升泛化能力 |
| 0.1 - 1.0 | 平衡 | 良好的起始范围 |
| 10 - 1000 | 窄 margin，violations 较少 | 干净数据，需要高准确率 |

调优策略：
- 从 C=1.0 开始
- 在 log scale 上搜索：[0.001, 0.01, 0.1, 1, 10, 100, 1000]
- 使用 cross-validation 选择最佳值
- 如果最佳 C 位于搜索范围边缘，就朝该方向扩展范围

## 调优 gamma（RBF kernel）

Gamma 控制单个训练点的影响范围。它定义 Gaussian 的宽度。

| gamma value | 影响 | 何时使用 |
|-------------|--------|-------------|
| Small (0.001) | 每个点影响较大区域。边界平滑、简单 | Underfitting 或 features 较少 |
| Medium (auto: 1/n_features) | sklearn 默认值。合理的起点 | 通用场景 |
| Large (10+) | 每个点只影响附近的点。边界复杂、波动明显 | 有 overfitting 风险 |

调优策略：
- 从 gamma="scale" 开始（1 / (n_features * X.var())，sklearn 默认值）
- 在 log scale 上搜索：[0.001, 0.01, 0.1, 1, 10]
- Low gamma + high C 往往会 overfit
- High gamma + low C 往往会 underfit

## 联合调优 C 和 gamma

C 和 gamma 会相互作用。始终一起调优它们，而不是独立调优。

推荐方法：
1. 粗粒度 grid search：C in [0.01, 0.1, 1, 10, 100]，gamma in [0.001, 0.01, 0.1, 1, 10]（25 个组合）
2. 找到最佳区域
3. 围绕最佳区域进行细粒度 grid search（例如，C in [5, 10, 20, 50]，gamma in [0.05, 0.1, 0.2]）
4. 全程使用 5-fold cross-validation

## 常见错误

- 在高维稀疏数据上使用 RBF kernel（linear 更好，且快 100 倍）
- 忘记缩放 features（最常见的 SVM 错误）
- 在噪声数据上把 C 设得太高（会记住噪声，而不是学习边界）
- 在超过 50k samples 的 datasets 上使用 kernel SVM（训练时间过高）
- 没有一起调优 C 和 gamma（它们会相互补偿）
- 默认使用 polynomial degree 5+（非常容易 overfit，先尝试 2 或 3）

## 快速参考

| Kernel | 何时使用 | 关键参数 | 训练复杂度 |
|--------|------------|----------------|-------------------|
| Linear | Text/TF-IDF、features 多、大数据 | 仅 C | 每个 epoch 为 O(n) |
| RBF | 通用场景，10k samples 以下 | C, gamma | O(n^2) 到 O(n^3) |
| Polynomial | 已知存在多项式关系 | C, degree, coef0 | O(n^2) 到 O(n^3) |
| Sigmoid | 很少有用（等价于两层 neural net） | C, gamma, coef0 | O(n^2) 到 O(n^3) |
