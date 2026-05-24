---
name: skill-statistical-testing
description: 为比较 ML 模型和评估实验选择正确的统计检验
version: 1.0.0
phase: 1
lesson: 15
tags: [statistics, hypothesis-testing, model-comparison]
---

# ML 统计检验

在比较模型、运行 A/B 实验或验证结果时，如何选择正确的检验。

## 决策清单

1. 你在比较什么？均值、比例、分布还是相关性？
2. 有多少组？单样本与参考值、两组，还是多组？
3. 观测值是配对的（同一测试集、同一 folds）还是独立的？
4. 数据是否服从正态分布？如果 n < 30 且不明显正态，使用非参数方法。
5. 数据是连续型、有序型，还是类别型？
6. 你要运行多少次检验？如果超过一次，请应用校正。

## 决策树

```text
比较均值？
  两组？
    配对（相同数据划分）？ --> Paired t-test（如果非正态则用 Wilcoxon signed-rank）
    独立？ --> Welch's t-test（如果非正态则用 Mann-Whitney U）
  多组？
    配对？ --> Repeated measures ANOVA（或 Friedman test）
    独立？ --> One-way ANOVA（或 Kruskal-Wallis）

比较比例？
  两组？ --> Chi-squared test 或 Fisher's exact test（小 n）
  多组？ --> Chi-squared test

比较分布？
  其中一个分布是参考分布？ --> Kolmogorov-Smirnov test
  两者都是经验分布？ --> Two-sample KS test

衡量关联？
  两者都是连续型，且大致正态？ --> Pearson correlation
  有序型或非正态？ --> Spearman rank correlation
  类别型 x 类别型？ --> Chi-squared test of independence

运行多次检验？
  应用 Bonferroni correction：alpha_adjusted = alpha / number_of_tests
  或使用 Holm-Bonferroni（较不保守，但仍控制 family-wise error）
```

## 每种检验何时使用

| Test | Data type | Assumptions | ML use case |
|---|---|---|---|
| Paired t-test | 连续型，配对 | 差值服从正态 | 在相同 k-fold 划分上比较 2 个模型 |
| Wilcoxon signed-rank | 连续型/有序型，配对 | 无（非参数） | 比较 2 个模型，k 较小（5-10 folds） |
| Welch's t-test | 连续型，独立 | 大致正态 | 在两个独立数据集上比较模型 |
| Mann-Whitney U | 连续型/有序型，独立 | 无 | 比较延迟分布 |
| ANOVA | 连续型，3+ 组 | 正态、方差相等 | 比较多个模型架构 |
| Kruskal-Wallis | 连续型/有序型，3+ 组 | 无 | 比较多个模型，指标非正态 |
| Chi-squared | 类别计数 | 期望计数 >= 5 | 比较类别分布、confusion matrices |
| Fisher's exact | 类别计数 | 小样本 | 稀有事件比较 |
| KS test | 连续型 | 无 | 检查预测是否符合期望分布 |
| Bootstrap CI | 任意统计量 | 无 | AUC、F1、任意指标的置信区间 |
| McNemar's test | 配对二元 | 无 | 在同一测试集上比较两个 classifiers |

## 模型比较流程

1. 在运行实验前定义指标和显著性水平（alpha = 0.05）。
2. 在相同 k-fold cross-validation 划分上运行两个模型（k = 5 或 10）。
3. 收集配对分数：(a_1, b_1), (a_2, b_2), ..., (a_k, b_k)。
4. 计算差值：d_i = b_i - a_i。
5. 运行配对检验（k <= 10 用 Wilcoxon，k > 10 或差值正态时用 paired t-test）。
6. 报告：p-value、平均差值、95% 置信区间、effect size（Cohen's d）。
7. 如果 p < alpha 且 effect size 有实际意义，则差异是真实的，并且值得采取行动。

## 常见错误

- 数据配对时使用独立检验。如果两个模型是在相同测试 folds 上评估的，就必须使用配对检验。独立检验会丢弃配对信息并损失统计功效。
- 只报告 p < 0.05 而不报告 effect size。统计显著的 0.1% accuracy 提升不值得部署。始终计算 Cohen's d 或原始平均差值。
- 在不同测试集上比较模型。两个模型的测试集必须完全相同。不同测试集会让比较失去意义。
- 运行 20 次比较，却不做 Bonferroni correction 就报告最好的一个。在 alpha = 0.05 的 20 次检验中，你预期会有 1 个偶然产生的 false positive。
- 在不平衡数据上使用 accuracy。在 99% 多数类上，一个平凡 classifier 也能达到 99%。请使用 F1、precision-recall AUC 或 Matthews correlation coefficient。
- 将 cross-validation folds 当作独立样本。它们共享训练数据，这违反了独立性假设。corrected resampled t-test 会考虑这一点。

## 快速参考：effect size 解读

| Cohen's d | Interpretation |
|---|---|
| 0.2 | 小效应 |
| 0.5 | 中等效应 |
| 0.8 | 大效应 |
| > 1.0 | 非常大的效应 |

| What to report | Why |
|---|---|
| p-value | 差异真实吗？ |
| Confidence interval | 差异可能有多大？ |
| Effect size (Cohen's d) | 差异有实际意义吗？ |
| Sample size (n or k folds) | 我们能信任结果吗？ |
