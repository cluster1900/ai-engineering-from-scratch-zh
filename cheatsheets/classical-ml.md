---
id: classical-ml
title: Classical Machine Learning
code: CM
subtitle: 用 scikit-learn 拟合、验证、调参并修复回归、分类和聚类模型。
hue: 120
sources: phases/02-ml-fundamentals/02-linear-regression, phases/02-ml-fundamentals/03-logistic-regression, phases/02-ml-fundamentals/04-decision-trees, phases/02-ml-fundamentals/05-support-vector-machines, phases/02-ml-fundamentals/06-knn-and-distances, phases/02-ml-fundamentals/07-unsupervised-learning, phases/02-ml-fundamentals/08-feature-engineering, phases/02-ml-fundamentals/09-model-evaluation, phases/02-ml-fundamentals/10-bias-variance, phases/02-ml-fundamentals/11-ensemble-methods, phases/02-ml-fundamentals/12-hyperparameter-tuning, phases/02-ml-fundamentals/13-ml-pipelines, phases/02-ml-fundamentals/14-naive-bayes, phases/02-ml-fundamentals/17-imbalanced-data, phases/02-ml-fundamentals/18-feature-selection
source_hash: e9148bde41cb124d
---

## 拟合模型
type: task-table
col: 1
from: phases/02-ml-fundamentals/02-linear-regression/docs/en.md, phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md, phases/02-ml-fundamentals/04-decision-trees/docs/en.md, phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md, phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md, phases/02-ml-fundamentals/07-unsupervised-learning/docs/en.md

| 任务 | 代码 |
|---|---|
| L2 正则化回归 | `Ridge(alpha=1.0)` |
| 稀有正例的分类器 | `LogisticRegression(class_weight="balanced")` |
| 随机森林 | `RandomForestClassifier(n_estimators=100, random_state=42)` |
| 核 SVM | `SVC(kernel="rbf", C=1.0, gamma="scale")` |
| 大数据上的线性 SVM | `LinearSVC(C=1.0, max_iter=10000)` |
| k 近邻 | `KNeighborsClassifier(n_neighbors=5, metric="euclidean")` |
| K-Means 聚类 | `KMeans(n_clusters=3, random_state=42).fit(data)` |
| 密度聚类与噪声点 | `DBSCAN(eps=1.5, min_samples=5).fit(data)` |

## 指标
type: command-table
col: 2
from: phases/02-ml-fundamentals/09-model-evaluation/docs/en.md, phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md

| 指标 | 公式与用途 |
|---|---|
| 准确率 | $(TP + TN) / (TP + TN + FP + FN)$。类别不平衡时有误导性 |
| 精确率 | $TP / (TP + FP)$。假阳性代价高时使用 |
| 召回率 | $TP / (TP + FN)$。假阴性代价高时使用 |
| F1 | $2 \cdot P \cdot R / (P + R)$。两者的调和平均 |
| AUC-ROC | 0.5 为随机，1.0 为完美。与阈值无关 |
| R-squared | $1 - SS_{\text{res}} / SS_{\text{tot}}$。低于 0 表示比均值还差 |

## 关键公式
type: concepts
col: 3
from: phases/02-ml-fundamentals/02-linear-regression/docs/en.md, phases/02-ml-fundamentals/03-logistic-regression/docs/en.md, phases/02-ml-fundamentals/04-decision-trees/docs/en.md, phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md, phases/02-ml-fundamentals/10-bias-variance/docs/en.md

- **MSE**：$\text{MSE} = \frac{1}{n} \sum (y_{\text{predicted}} - y_{\text{actual}})^2$
- **正规方程**：$w = (X^T X)^{-1} X^T y$。代价是特征数的 $O(n^3)$。
- **Ridge**：$\text{Cost} = \text{MSE} + \lambda \sum w_i^2$
- **对数损失**：$-\frac{1}{n} \sum \left( y \log(p) + (1-y) \log(1-p) \right)$，$p = \sigma(wx + b)$
- **Gini**：$\text{Gini}(S) = 1 - \sum_k p_k^2$。0 表示纯节点。
- **软间隔 SVM**：$\min \frac{1}{2} \lVert w \rVert^2 + C \sum_i \max(0, 1 - y_i (w^T x_i + b))$
- **RBF 核**：$K(x, z) = \exp(-\gamma \lVert x - z \rVert^2)$
- **误差分解**：$\text{Bias}^2 + \text{Variance} + \text{Irreducible Noise}$

## 无泄漏的预处理
type: annotated-code
col: 2
lang: python
from: phases/02-ml-fundamentals/13-ml-pipelines/docs/en.md, phases/02-ml-fundamentals/13-ml-pipelines/code/pipeline.py

```python
# Leaky: the scaler sees the test rows
X_scaled = scaler.fit_transform(X)
# Correct: fit on train, reuse on test
X_train_scaled = scaler.fit_transform(X_train)   # learn mean and std
X_test_scaled = scaler.transform(X_test)         # train statistics only
# Best: one Pipeline object for train and serve
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("model", LogisticRegression()),
])
pipe.fit(X_train, y_train)                       # fit_transform, then fit
predictions = pipe.predict(X_test)               # transform, then predict
scores = cross_val_score(full_pipe, df, y, cv=5, scoring="accuracy")  # refit per fold
```

## 无泄漏地验证
type: flow
col: 4
from: phases/02-ml-fundamentals/09-model-evaluation/docs/en.md, phases/02-ml-fundamentals/13-ml-pipelines/docs/en.md

1. **划分**：留出测试集。只在最后用它一次。
2. **折**：把其余数据分成 $K$ 折。按类别比例分层。
3. **拟合**：缩放器在 $K-1$ 个训练折上调用 `fit_transform`。
4. **训练**：模型在缩放后的训练折上调用 `fit`。
5. **评分**：缩放器在验证折上调用 `transform`，然后模型做预测。
6. **平均**：对每一折重复，并对 $K$ 个分数取平均。
7. **报告**：在测试集上给最终模型评分。

## 问答
type: qa
col: 4
from: phases/02-ml-fundamentals/03-logistic-regression/docs/en.md, phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md, phases/02-ml-fundamentals/10-bias-variance/docs/en.md, phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md, phases/02-ml-fundamentals/09-model-evaluation/docs/en.md

- **为什么逻辑回归不用 MSE？** 配合 sigmoid 时它是非凸的。对数损失是凸的。
- **为什么 SVM 之前要缩放？** 间隔取决于 $\lVert w \rVert$。
- **为什么 L1 能做特征选择？** 它会把部分权重压到恰好为零。
- **更多数据能解决高偏差吗？** 不能。要换模型。
- **为什么用类别权重而不是过采样？** 期望上相同，且没有重复行。

## 提示
type: tips
col: 1
from: phases/02-ml-fundamentals/12-hyperparameter-tuning/docs/en.md, phases/02-ml-fundamentals/09-model-evaluation/docs/en.md, phases/02-ml-fundamentals/08-feature-engineering/docs/en.md, phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md

- 先扫描学习率，其余参数固定为默认值。
- 在对数尺度上搜索学习率和正则化强度。
- 把 n_estimators 设大，让早停来决定。
- 最终估计使用嵌套交叉验证。
- 插补之前先加一列 was_this_missing。
- 在验证集而不是测试集上选阈值。

## ColumnTransformer 流水线
type: architecture
col: 1
from: phases/02-ml-fundamentals/13-ml-pipelines/docs/en.md, phases/02-ml-fundamentals/13-ml-pipelines/code/pipeline.py

```arch
node | raw | 1,1 | DataFrame | numeric and categorical
node | num | 1,2 | Numeric columns | age, income, score
node | cat | 2,2 | Categorical columns | city, plan
node | nimp | 1,3 | SimpleImputer | median, then StandardScaler
node | cimp | 2,3 | SimpleImputer | most_frequent, then OneHotEncoder
node | ct | 1,4 | ColumnTransformer | joins both outputs
node | model | 2,4 | Model | GradientBoostingClassifier, predict
edge | raw | num | select
edge | raw | cat | select
edge | num | nimp |
edge | cat | cimp |
edge | nimp | ct |
edge | cimp | ct |
edge | ct | model |
```

## 超参数调优
type: annotated-code
col: 1
lang: python
from: phases/02-ml-fundamentals/12-hyperparameter-tuning/docs/en.md

```python
param_dist = {
    "learning_rate": loguniform(1e-4, 0.5),      # log scale for rates
    "max_depth": randint(2, 10),                 # integer range
    "n_estimators": randint(50, 500),
}
search = RandomizedSearchCV(
    GradientBoostingRegressor(), param_dist,
    n_iter=100, cv=5,                            # 100 samples, 5 folds each
    scoring="neg_mean_squared_error",            # negated, higher is better
    random_state=42, n_jobs=-1,                  # all CPU cores
)
search.fit(X_train, y_train)
print(search.best_params_, -search.best_score_)  # negate back to MSE
```

## 故障排查
type: troubleshooting
col: 3
from: phases/02-ml-fundamentals/10-bias-variance/docs/en.md, phases/02-ml-fundamentals/13-ml-pipelines/docs/en.md, phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md, phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md, phases/02-ml-fundamentals/12-hyperparameter-tuning/docs/en.md, phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 训练误差和测试误差都高 | 高偏差 | 更多特征、更复杂的模型、更少的正则化 |
| 训练误差低，测试误差高 | 高方差 | 更多数据、正则化、更简单的模型 |
| 测试误差上升，训练误差下降 | 正在过拟合 | 早停 |
| CV 分数高于线上表现 | 缩放器在全量数据上拟合 | 用 Pipeline 配合 cross_val_score |
| 遇到新类别时崩溃 | 编码器从未见过该值 | `OneHotEncoder(handle_unknown="ignore")` |
| 准确率 99%，却找不到任何正例 | 类别不平衡 | 类别权重、阈值调优 |
| SVM 或 KNN 分数低 | 特征未缩放 | 先做 `StandardScaler()` |
| 最优值落在搜索边界 | 搜索范围太窄 | 扩大搜索空间 |

## 起始值
type: defaults
col: 3
from: phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md, phases/02-ml-fundamentals/09-model-evaluation/docs/en.md, phases/02-ml-fundamentals/11-ensemble-methods/docs/en.md, phases/02-ml-fundamentals/04-decision-trees/docs/en.md, phases/02-ml-fundamentals/14-naive-bayes/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 决策阈值 | 0.5 | 稀有正例时调低 |
| CV 折数 K | 5 | 10 也是常用值 |
| 森林中每次分裂的特征数 | sqrt(n_features) | 回归时用 n_features / 3 |
| 森林中的树数 | 100 | 课程代码中的 n_estimators |
| Boosting learning_rate | 0.1 | 通常 0.01 到 0.3 |
| Boosting max_depth | 3 | 课程中的 GradientBoosting 类 |
| 朴素贝叶斯 alpha | 1.0 | 拉普拉斯平滑 |
| 袋外样本比例 | 36.8% | 免费的验证集 |

## 缩写
type: glossary
col: 3
span: 2
from: phases/02-ml-fundamentals/09-model-evaluation/docs/en.md, phases/02-ml-fundamentals/17-imbalanced-data/docs/en.md, phases/02-ml-fundamentals/07-unsupervised-learning/docs/en.md, phases/02-ml-fundamentals/18-feature-selection/docs/en.md

- **AUC-ROC**：Area Under the Receiver Operating Characteristic curve（ROC 曲线下面积）。
- **SMOTE**：用 k-NN 插值合成少数类样本。
- **GMM**：Gaussian Mixture Model（高斯混合模型）。用期望最大化（EM）得到软聚类。
- **RFE**：Recursive Feature Elimination（递归特征消除）。训练、排序、剪除，循环往复。
