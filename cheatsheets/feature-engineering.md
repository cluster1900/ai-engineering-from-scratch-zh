---
id: feature-engineering
title: Feature Engineering and Pipelines
code: FE
subtitle: 在一条无泄漏的 pipeline 中完成填补、缩放、编码、选择和集成。代码来自课程中的 Python。
hue: 30
sources: phases/02-ml-fundamentals/08-feature-engineering, phases/02-ml-fundamentals/11-ensemble-methods, phases/02-ml-fundamentals/13-ml-pipelines, phases/02-ml-fundamentals/18-feature-selection
source_hash: 25a47477c7c00c8d
---

## 面向混合列的一条 pipeline
type: architecture
from: phases/02-ml-fundamentals/13-ml-pipelines/docs/en.md

```arch
node | raw | 1,1 | Training data | X_train only
node | num | 2,1 | numeric_pipe | median impute, scale
node | cat | 2,2 | categorical_pipe | most_frequent, one-hot
node | pre | 3,1 | ColumnTransformer | preprocess step
node | model | 4,1 | Model | GradientBoostingClassifier
node | pred | 4,2 | Prediction | transform, then predict
edge | raw | num | numeric cols
edge | raw | cat | categorical cols
edge | num | pre |
edge | cat | pre |
edge | pre | model | fit
edge | model | pred |
```

## 在 sklearn 中构建
type: annotated-code
lang: python
from: phases/02-ml-fundamentals/13-ml-pipelines/docs/en.md

```python
numeric_pipe = Pipeline([
    ("impute", SimpleImputer(strategy="median")),
    ("scale", StandardScaler()),
])
categorical_pipe = Pipeline([
    ("impute", SimpleImputer(strategy="most_frequent")),
    ("encode", OneHotEncoder(handle_unknown="ignore")),  # unseen city gives zeros
])
preprocessor = ColumnTransformer([
    ("num", numeric_pipe, ["age", "income", "score"]),
    ("cat", categorical_pipe, ["city", "gender", "plan"]),
])
full_pipeline = Pipeline([("preprocess", preprocessor),
                          ("model", GradientBoostingClassifier())])
```

## fit 与 predict 做了什么
type: flow
from: phases/02-ml-fundamentals/13-ml-pipelines/docs/en.md, phases/02-ml-fundamentals/13-ml-pipelines/code/pipeline.py

1. **先切分**：在任何 fit 之前调用 `X_train, X_test = X[:800], X[800:]`。
2. **pipe.fit**：每个 transformer 在 X_train 上调用 `fit_transform`。
3. **pipe.fit**：最后一步在变换后的 X_train 上调用 `fit`。
4. **pipe.predict**：每个 transformer 调用 `transform`，而不是 `fit_transform`。
5. **pipe.predict**：模型在变换后的 X_test 上调用 `predict`。
6. **交叉验证**：每一折都在自己的训练切分上拟合预处理器。

## 变换与编码任务
type: task-table
from: phases/02-ml-fundamentals/08-feature-engineering/code/features.py

| 任务 | 代码 |
|---|---|
| 缩放到 [0, 1] | `min_max_scale(values)` |
| 均值 0、标准差 1 | `standardize(values)` |
| 压缩右偏 | `log_transform(values)` 使用 log(v + 1) |
| 等宽分箱 | `bin_values(values, n_bins=5)` |
| 平方项与两两交互 | `polynomial_features(row, degree=2)` |
| 平滑的目标均值 | `target_encode(feature_values, target_values, smoothing=10)` |
| 先标记缺失 | `add_missing_indicator(values)` |
| 文本权重 | `tfidf(documents)` 返回 vectors、vocab |

## 特征选择任务
type: task-table
from: phases/02-ml-fundamentals/18-feature-selection/code/feature_selection.py, phases/02-ml-fundamentals/18-feature-selection/docs/en.md

| 任务 | 代码 |
|---|---|
| 删除近似常数列 | `variance_threshold(X, threshold=0.01)` |
| 按 MI 排序 | `mutual_information(X, y, n_bins=10)` |
| 按权重剪枝 | `rfe(X, y, n_features_to_select=5)` |
| 用 L1 把权重置零 | `l1_feature_selection(X, y, alpha=0.1)` |
| 分裂增益重要度 | `tree_importance(X, y, n_trees=50)` |
| sklearn RFE | `RFE(LogisticRegression(), n_features_to_select=10)` |
| sklearn L1 | `SelectFromModel(Lasso(alpha=0.01))` |
| sklearn 树模型 | `rf.feature_importances_` |

## 集成方法：何时用哪个
type: command-table
from: phases/02-ml-fundamentals/11-ensemble-methods/docs/en.md

| 命令 | 作用 |
|---|---|
| Bagging / Random Forest | 降低方差。适合噪声数据、特征多 |
| AdaBoost | 降低偏差。适合干净数据。受离群点伤害 |
| Gradient Boosting | 降低偏差。适合表格数据。容易过拟合 |
| XGBoost / LightGBM | 两者兼顾。生产表格 ML 从这里开始 |
| Stacking | 两者兼顾。榨取最后 1-2% 准确率。使用 CV 元特征 |
| Soft voting | 平均多样化模型的概率 |

## Boosting 循环
type: annotated-code
lang: python
from: phases/02-ml-fundamentals/11-ensemble-methods/docs/en.md, phases/02-ml-fundamentals/11-ensemble-methods/code/ensembles.py

```python
weights = np.full(n, 1 / n)                  # AdaBoost starts uniform
err = np.clip(err, 1e-10, 1 - 1e-10)         # weighted stump error
alpha = 0.5 * np.log((1 - err) / err)        # low error, high vote
weights *= np.exp(-alpha * y * pred)         # misses gain weight
weights /= weights.sum()
self.initial_pred = np.mean(y)               # gradient boosting start
residuals = y - current_pred                 # squared error gradient
current_pred += self.lr * update             # shrink each tree
```

## 默认值与数字
type: defaults
from: phases/02-ml-fundamentals/08-feature-engineering/code/features.py, phases/02-ml-fundamentals/11-ensemble-methods/docs/en.md, phases/02-ml-fundamentals/11-ensemble-methods/code/ensembles.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| 目标编码 `smoothing` | 10 | 把稀有类别拉向全局均值 |
| `remove_correlated` 阈值 | 0.9 | 删除一对中的第二列 |
| `AdaBoostScratch` `n_estimators` | 50 | 决策桩 |
| `GradientBoostingScratch` | 100 | learning_rate=0.1，max_depth=3 |
| `BaggingClassifier` | 20 | n_estimators=20，max_depth=5 |
| 学习率范围 | 0.01 到 0.3 | 越小需要越多的树 |
| Bootstrap 唯一行占比 | 63.2% | 36.8% 袋外样本用于验证 |
| 森林分裂特征数 | `sqrt(n_features)` | 回归用 `n_features / 3` |

## Pipeline 故障
type: troubleshooting
from: phases/02-ml-fundamentals/13-ml-pipelines/docs/en.md, phases/02-ml-fundamentals/08-feature-engineering/docs/en.md, phases/02-ml-fundamentals/18-feature-selection/docs/en.md, phases/02-ml-fundamentals/11-ensemble-methods/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 测试分数过高 | 在切分前拟合了 scaler | 使用带 `cross_val_score` 的 Pipeline |
| 训练与线上输出不同 | 变换在 pipeline 之外 | 两边使用同一个 Pipeline 对象 |
| 遇到新城市就崩溃 | 编码器从未见过该值 | `OneHotEncoder(handle_unknown="ignore")` |
| schema 变化就出错 | 硬编码列名 | 从配置读取列名列表 |
| 随机 ID 排名很高 | 树重要度的基数偏差 | 用置换重要度检查 |
| 目标编码过拟合 | 在测试行上编码 | 只在训练数据上拟合并平滑 |
| Stacking 泄漏 | 元特征来自已拟合数据 | 用交叉验证生成元特征 |

## 公式
type: concepts
from: phases/02-ml-fundamentals/08-feature-engineering/docs/en.md, phases/02-ml-fundamentals/18-feature-selection/docs/en.md, phases/02-ml-fundamentals/11-ensemble-methods/docs/en.md

- **TF-IDF**：$\frac{\text{count in doc}}{\text{words in doc}} \cdot \log \frac{\text{docs}}{\text{docs with word}}$
- **互信息**：$I(X; Y) = \sum_x \sum_y p(x, y) \log \frac{p(x, y)}{p(x) p(y)}$，独立时为零。
- **L1 损失**：预测误差加 $\alpha \sum \lvert w_i \rvert$。alpha 越大，置零的权重越多。
- **多数投票**：21 个 60% 准确率的分类器约达 74%。101 个达 84%。
- **RFE 成本**：$N - \text{target}$ 次训练。从 500 个特征减到 10 个需 490 次。
- **MI 分箱**：$\sqrt{n}$ 个箱或 Sturges 规则 $1 + \log_2 n$。

## 问答
type: qa
from: phases/02-ml-fundamentals/08-feature-engineering/docs/en.md, phases/02-ml-fundamentals/13-ml-pipelines/docs/en.md, phases/02-ml-fundamentals/18-feature-selection/docs/en.md, phases/02-ml-fundamentals/11-ensemble-methods/docs/en.md

- **为什么要缩放特征？** K-Means、KNN 和 SVM 使用距离。缩放让所有特征同等重要。
- **为什么加缺失指示列？** 数据缺失这一事实本身可能就有信息。
- **为什么用 MI 而不是相关系数？** MI 能捕捉二次或周期性关系。相关系数可能读出零。
- **为什么用 soft voting？** 它利用了置信度信息。通常优于 hard voting。
- **什么让一次运行可复现？** 固定随机种子、锁定依赖、为数据和配置文件加版本。
- **表格数据先用哪个模型？** 默认参数的 LightGBM 或 XGBoost。
