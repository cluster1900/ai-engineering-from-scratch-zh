---
id: ml-evaluation-metrics
title: Model Evaluation, Bias-Variance and Tuning
code: ME
subtitle: 数据划分与交叉验证、指标公式、偏差-方差诊断、搜索策略和类别不平衡。
hue: 210
sources: phases/02-ml-fundamentals/09-model-evaluation, phases/02-ml-fundamentals/10-bias-variance, phases/02-ml-fundamentals/12-hyperparameter-tuning, phases/02-ml-fundamentals/17-imbalanced-data
source_hash: cea3e6a1e5fa41e7
---

## 诊断训练误差与测试误差
type: troubleshooting
from: phases/02-ml-fundamentals/10-bias-variance/docs/en.md, phases/02-ml-fundamentals/09-model-evaluation/docs/en.md, phases/02-ml-fundamentals/12-hyperparameter-tuning/docs/en.md, phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 训练误差高，测试误差高 | 高偏差 | 更多特征、更复杂的模型、更少正则化 |
| 训练误差低，测试误差高 | 高方差 | 更多数据、正则化、更简单的模型 |
| 训练误差下降，测试误差上升 | 正在过拟合 | 早停 |
| 两条曲线都平且高 | 偏差。加数据没用 | 换模型 |
| 差距大，验证误差仍在下降 | 数据可以修复的方差 | 收集更多数据 |
| 准确率 99%，正例一个没抓到 | 类别不平衡 | F1、AUPRC 或 MCC |
| 验证分数过于乐观 | 划分前就拟合了 scaler | 在 `Pipeline` 内做预处理 |
| 最佳值落在搜索边界 | 范围太窄 | 扩大搜索空间 |

## 划分、调参、汇报
type: architecture
from: phases/02-ml-fundamentals/09-model-evaluation/docs/en.md

```arch
node | data | 1,2 | Full dataset |
node | train | 2,1 | Train set | 60-70%
node | val | 2,2 | Validation set | 15-20%
node | test | 2,3 | Test set | 15-20%, use once
node | fit | 3,1 | Fit model |
node | tune | 3,2 | Tune hyperparameters | select models
node | final | 4,2 | Final model |
node | report | 4,3 | Report performance |
edge | data | train |
edge | data | val |
edge | data | test |
edge | train | fit |
edge | fit | tune | validate
edge | tune | final |
edge | final | report |
edge | test | report |
```

## 指标公式
type: concepts
from: phases/02-ml-fundamentals/09-model-evaluation/docs/en.md, phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md, phases/02-ml-fundamentals/10-bias-variance/docs/en.md

- **Accuracy（准确率）**：$(TP + TN) / (TP + TN + FP + FN)$。类别不平衡时会误导。
- **Precision（精确率）**：$TP / (TP + FP)$。误报代价高时使用。
- **Recall（召回率）**：$TP / (TP + FN)$。漏报代价高时使用。
- **F1**：$2PR / (P + R)$，精确率与召回率的调和平均。
- **F-beta**：$(1+\beta^2) P R / (\beta^2 P + R)$。$\beta > 1$ 更看重召回率。欺诈检测常用 F2。
- **MCC**：$(TP \cdot TN - FP \cdot FN) / \sqrt{\ldots}$。取值从 -1 到 +1。
- **AUC-ROC**：0.5 是随机猜测，1.0 是完美区分。
- **AUPRC**：随机模型的得分等于正类比例。
- **RMSE 与 MAE**：RMSE 是 $\sqrt{\text{MSE}}$，与目标同单位。MAE 对离群点稳健。
- **分解**：期望误差 $= \text{Bias}^2 + \text{Variance} + \sigma^2$。

## 逐步修复模型
type: flow
from: phases/02-ml-fundamentals/10-bias-variance/docs/en.md

1. **训练**：计算训练误差和测试误差。
2. **两者都高**：偏差问题。跳到第 4 步。
3. **训练低、测试高**：方差问题。画学习曲线。数据无效时再正则化。
4. **验证曲线**：扫描主要的复杂度旋钮，找到最佳点。
5. **学习曲线**：在最佳点画出它。差距大就需要数据或正则化。
6. **Alpha 扫描**：用 `cross_val_score` 试 Ridge 或 Lasso 的 alpha，保留 CV 误差最低的。

## 交叉验证与调参
type: annotated-code
lang: python
from: phases/02-ml-fundamentals/09-model-evaluation/docs/en.md, phases/02-ml-fundamentals/12-hyperparameter-tuning/docs/en.md

```python
scores = cross_val_score(model, X, y, cv=StratifiedKFold(5), scoring="f1")
param_dist = {
    "learning_rate": loguniform(1e-4, 0.5),      # log scale
    "max_depth": randint(2, 10),
    "n_estimators": randint(50, 500),
}
search = RandomizedSearchCV(GradientBoostingRegressor(), param_dist,
    n_iter=100, cv=5, scoring="neg_mean_squared_error", n_jobs=-1)
search.fit(X_train, y_train)
search.best_params_                               # best settings
outer_scores = cross_val_score(inner_cv, X, y, cv=5, scoring="neg_mean_squared_error")
```

## 搜索策略
type: command-table
from: phases/02-ml-fundamentals/12-hyperparameter-tuning/docs/en.md

| 命令 | 作用 |
|---|---|
| 网格搜索 | 遍历每种组合。成本指数增长 |
| 随机搜索 | 从分布中采样。同等预算下取值更多样 |
| 贝叶斯优化 | 代理模型加采集函数。评估次数少 2-5 倍 |
| Hyperband | 小预算跑大量配置。快 10-50 倍 |
| `MedianPruner` | 在某一步比中位数差的 trial 直接停止 |
| `GridSearchCV` | 带交叉验证的穷举网格 |
| `RandomizedSearchCV` | 带 CV 的随机搜索。`n_jobs=-1` 使用全部核心 |
| `trial.suggest_float` | Optuna 采样。lr 加上 `log=True` |

## 选择不平衡修复方法
type: defaults
from: phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md

| 设置 | 默认 | 说明 |
|---|---|---|
| 轻度，低于 70/30 | class weights | 先试它 |
| 中度，70/30 到 95/5 | SMOTE + class weights | 或 SMOTE 加阈值调优 |
| 重度，超过 95/5 | combine multiple strategies | SMOTE、类别权重和阈值 |
| 少于 1000 个样本 | Oversample or SMOTE, avoid undersampling | 小数据 |
| 1000-10000 个样本 | SMOTE + threshold tuning | 中等数据 |
| 超过 10000 个样本 | Undersampling OK, or class weights | 大数据 |

## 需要记住的数字
type: defaults
from: phases/02-ml-fundamentals/09-model-evaluation/docs/en.md, phases/02-ml-fundamentals/12-hyperparameter-tuning/docs/en.md, phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md, phases/02-ml-fundamentals/10-bias-variance/code/bias_variance.py, phases/02-ml-fundamentals/17-imbalanced-data/code/imbalanced.py

| 设置 | 默认 | 说明 |
|---|---|---|
| K 折 | 5 | 或 10 |
| 决策阈值 | 0.5 | 正例稀少时调低 |
| 随机搜索 trial 数 | 60 | 95% 概率落在最优值 5% 以内 |
| Hyperband 起始数 | 81 | 先各跑 1 个 epoch，保留前三分之一 |
| 嵌套 CV 拟合次数 | 675 | 外层 5 x 内层 5 x 27 个网格点 |
| Bootstrap 拟合次数 | 200 | 分解中的 `n_bootstrap=200` |
| SMOTE `k` | 5 | `n_synthetic=100` |
| 正类权重 | 10.0 | 1000 个样本，50 个正例 |

## 问答
type: qa
from: phases/02-ml-fundamentals/09-model-evaluation/docs/en.md, phases/02-ml-fundamentals/10-bias-variance/docs/en.md, phases/02-ml-fundamentals/12-hyperparameter-tuning/docs/en.md, phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md

- **为什么用分层折？** 每一折都保持完整数据集的类别比例。
- **为什么测试集只用一次？** 每看一次再调整，它就变成了第二个验证集。
- **为什么随机优于网格？** 6 个超参数里通常只有 1-2 个真正重要。
- **Bagging 还是 Boosting？** 高方差用 Bagging，高偏差用 Boosting。
- **类别权重还是过采样？** 期望意义上权重等价于过采样，且没有重复样本。
- **容量最差在哪里？** 在插值阈值处，即参数量接近样本数时。
- **最终分数怎么报？** 用嵌套 CV，或用调参期间从未碰过的测试集。

## 技巧
type: tips
from: phases/02-ml-fundamentals/09-model-evaluation/docs/en.md, phases/02-ml-fundamentals/12-hyperparameter-tuning/docs/en.md, phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md

- 先划分，再预处理。
- 先调学习率，在对数尺度上搜索。
- 用早停代替调 `n_estimators`。
- 把 60% 的调参预算花在最重要的 2 个超参数上。
- 从库默认值开始。先粗搜 20-50 次，再细搜 50-100 次。
- 在验证集上把阈值从 0.0 扫到 1.0，保留 F1 最好的。

## 从零实现的函数
type: task-table
from: phases/02-ml-fundamentals/09-model-evaluation/code/evaluation.py, phases/02-ml-fundamentals/17-imbalanced-data/code/imbalanced.py

| 任务 | 代码 |
|---|---|
| 分层折 | `stratified_kfold_split(y, k=5, seed=42)` |
| ROC 面积 | `auc_roc(y_true, y_scores)` |
| 合成少数类样本 | `smote(X_minority, k=5, n_synthetic=100)` |
| 平衡类别权重 | `compute_class_weights(y)` |
| 按 F1 选最佳阈值 | `find_optimal_threshold(y_true, y_probs)` |
