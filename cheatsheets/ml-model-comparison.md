---
id: ml-model-comparison
title: Classical Models Compared
code: CC
subtitle: 线性回归与逻辑回归、决策树与随机森林、SVM、KNN 和朴素贝叶斯并排对比，以及各自的适用场景。
hue: 30
sources: phases/02-ml-fundamentals/02-linear-regression, phases/02-ml-fundamentals/03-logistic-regression, phases/02-ml-fundamentals/04-decision-trees, phases/02-ml-fundamentals/05-support-vector-machines, phases/02-ml-fundamentals/06-knn-and-distances, phases/02-ml-fundamentals/14-naive-bayes
source_hash: e76464be4e3d4e8a
---

## 模型并排对比
type: comparison
span: 2
from: phases/02-ml-fundamentals/02-linear-regression/docs/en.md, phases/02-ml-fundamentals/03-logistic-regression/docs/en.md, phases/02-ml-fundamentals/04-decision-trees/docs/en.md, phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md, phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md, phases/02-ml-fundamentals/14-naive-bayes/docs/en.md

| 模型 | 训练方式 | 决策边界、预测成本与内存 |
|---|---|---|
| 线性回归 | 梯度下降 | 一个超平面。正规方程在特征数上是 $O(n^3)$ |
| 逻辑回归 | 二元交叉熵 | 始终是线性的。边界在 p = 0.5 处 |
| 决策树 | Gini 不纯度 | 贪心切分得到的矩形区域。高方差 |
| 随机森林 | Bagging | 多棵树的多数投票或平均 |
| SVM | Hinge 损失 | 最大间隔。只存储支持向量 |
| KNN | 惰性学习 | 无需训练。每次查询 $O(n \cdot d)$，存储全部数据 |
| 朴素贝叶斯 | 统计频率 | 线性。预测就是一次矩阵乘法 |

## 缩放与最适合的数据
type: comparison
from: phases/02-ml-fundamentals/02-linear-regression/docs/en.md, phases/02-ml-fundamentals/04-decision-trees/docs/en.md, phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md, phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md, phases/02-ml-fundamentals/14-naive-bayes/docs/en.md

| 模型 | 需要特征缩放 | 擅长 |
|---|---|---|
| 线性回归 | 是 | 所有回归任务的基线 |
| 决策树与森林 | 否 | 表格数据、混合类型、少于 10k 行 |
| SVM | 是 | 小数据或高维稀疏数据 |
| KNN | 是 | 小数据，最多约 20-50 个特征 |
| Multinomial NB | 否 | 训练样本少的文本 |
| Gaussian NB | 否 | 接近钟形分布的连续特征 |

## 何时使用各模型
type: tips
from: phases/02-ml-fundamentals/02-linear-regression/docs/en.md, phases/02-ml-fundamentals/03-logistic-regression/docs/en.md, phases/02-ml-fundamentals/04-decision-trees/docs/en.md, phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md, phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md, phases/02-ml-fundamentals/14-naive-bayes/docs/en.md

- 把线性回归作为每个回归任务的基线。
- 是非问题需要概率且边界线性时，用逻辑回归。
- 扁平表格用随机森林，几乎不需要调超参数。
- 小数据或带 TF-IDF 特征的稀疏文本用 SVM。
- 数据频繁变化且希望零训练时间时用 KNN。
- 训练样本少于 10,000 的文本用 TF-IDF 加 MultinomialNB。
- 短文本用 BernoulliNB。在 CountVectorizer 中设置 `binary=True`。

## 损失与公式
type: concepts
from: phases/02-ml-fundamentals/02-linear-regression/docs/en.md, phases/02-ml-fundamentals/03-logistic-regression/docs/en.md, phases/02-ml-fundamentals/04-decision-trees/docs/en.md, phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md, phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md, phases/02-ml-fundamentals/14-naive-bayes/docs/en.md

- **MSE**：$\frac{1}{n} \sum (\hat{y} - y)^2$。对 w 的梯度为 $\frac{2}{n} \sum (\hat{y} - y) x$。
- **R 方**：$1 - SS_{\text{res}} / SS_{\text{tot}}$。1.0 为完美，0.0 等同于预测均值。
- **Sigmoid**：$\sigma(z) = 1 / (1 + e^{-z})$。在 $z = 0$ 处为 0.5。
- **二元交叉熵**：$-\frac{1}{n} \sum (y \log p + (1-y) \log(1-p))$。梯度为 $\frac{1}{n} \sum (p - y) x$。
- **Gini**：$1 - \sum_k p_k^2$。6 只猫和 4 只狗得 0.48。
- **Hinge**：$\max(0, 1 - y f(x))$。间隔之外为零。
- **RBF 核**：$\exp(-\gamma \lVert x - z \rVert^2)$。点越近越接近 1。
- **Multinomial NB**：$(\text{count} + \alpha) / (\text{total} + \alpha \cdot V)$，在对数空间中求和。

## 先缩放，再拟合
type: annotated-code
lang: python
from: phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md, phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md, phases/02-ml-fundamentals/14-naive-bayes/docs/en.md

```python
clf = Pipeline([
    ("scaler", StandardScaler()),                       # SVM and KNN need it
    ("svm", SVC(kernel="rbf", C=1.0, gamma="scale")),   # dual form, kernels
])
clf.fit(X_train, y_train)
clf.score(X_test, y_test)                               # accuracy
clf['svm'].n_support_                                   # support vectors
("svm", LinearSVC(C=1.0, max_iter=10000))               # large data, primal
("knn", KNeighborsClassifier(n_neighbors=5, metric="euclidean"))
mnb = MultinomialNB(alpha=1.0)                          # counts, no scaling
mnb.fit(X_train_counts, y_train)
```

## 生长一片随机森林
type: flow
from: phases/02-ml-fundamentals/04-decision-trees/docs/en.md, phases/02-ml-fundamentals/04-decision-trees/code/trees.py

1. **Bootstrap**：有放回地抽样行。约 63% 的行会出现。
2. **袋外（Out-of-bag）**：其余的行可用于验证这棵树。
3. **特征子集**：分类时每次切分只看 $\sqrt{n_{\text{features}}}$ 个特征。
4. **贪心切分**：选信息增益最高的特征和阈值。
5. **停止**：节点纯净或达到预剪枝限制时结束该分支。
6. **重复**：构建 `n_trees` 棵树。默认 100。
7. **聚合**：分类用多数投票，回归取平均。

## 权衡偏差与方差的旋钮
type: command-table
from: phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md, phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md, phases/02-ml-fundamentals/04-decision-trees/docs/en.md, phases/02-ml-fundamentals/14-naive-bayes/docs/en.md, phases/02-ml-fundamentals/02-linear-regression/docs/en.md

| 命令 | 作用 |
|---|---|
| 大 `C` | 间隔窄，误分类少。过拟合 |
| 小 `C` | 间隔宽，违例多。欠拟合 |
| `K = 1` | 训练误差为零。高方差 |
| `K = N` | 预测多数类。偏差最大 |
| 最大深度 | 提前停止生长。预剪枝 |
| NB `alpha` | alpha 越大平滑越强 |
| Ridge $\lambda$ | 越大权重越小 |
| SVR $\epsilon$ | 管道更宽，支持向量更少 |

## 课程代码中的默认值
type: defaults
from: phases/02-ml-fundamentals/04-decision-trees/code/trees.py, phases/02-ml-fundamentals/04-decision-trees/docs/en.md, phases/02-ml-fundamentals/06-knn-and-distances/code/knn.py, phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md, phases/02-ml-fundamentals/05-support-vector-machines/code/svm.py, phases/02-ml-fundamentals/14-naive-bayes/code/naive_bayes.py, phases/02-ml-fundamentals/14-naive-bayes/docs/en.md

| 设置 | 默认 | 说明 |
|---|---|---|
| 决策树 `max_depth` | None | 一直生长到每个叶子都纯净 |
| 决策树 `min_samples_split` | 2 | 预剪枝控制 |
| 决策树 `criterion` | "gini" | Gini 与熵的切分几乎相同 |
| 森林 `n_trees` | 100 | scikit-learn 使用 `n_estimators=100` |
| 森林 `max_features` | "sqrt" | 回归使用 n_features/3 |
| KNN `k` | 5 | 从 sqrt(N) 附近开始。二分类用奇数 K |
| SVM `rbf_kernel` gamma | 0.5 | `polynomial_kernel` 次数为 3 |
| GaussianNB `var_smoothing` | 1e-9 | 防止除以零方差 |

## 故障与修复
type: troubleshooting
from: phases/02-ml-fundamentals/03-logistic-regression/docs/en.md, phases/02-ml-fundamentals/04-decision-trees/docs/en.md, phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md, phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md, phases/02-ml-fundamentals/14-naive-bayes/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 逻辑回归在圆形数据上失败 | 边界始终是线性的 | 添加多项式特征 |
| SVM 准确率差 | 未缩放的特征扭曲了间隔 | 在 `Pipeline` 中使用 `StandardScaler` |
| `SVC` 太慢 | 对偶形式为 $O(n^2)$ 到 $O(n^3)$ | `LinearSVC` 原始形式 |
| 特征多时 KNN 变差 | 维度灾难 | 先做 PCA 或 UMAP |
| 单棵树随数据剧烈变化 | 单棵树方差高 | 改用随机森林 |
| MDI 把噪声特征排得很高 | 偏向高基数特征 | 置换重要性 |
| NB 给出概率 0 | 某类中出现了未见过的词 | 拉普拉斯平滑，alpha 取 1 |
| MultinomialNB 拒绝特征 | 特征值为负 | 用 GaussianNB 或平移数值 |

## 问答
type: qa
from: phases/02-ml-fundamentals/02-linear-regression/docs/en.md, phases/02-ml-fundamentals/03-logistic-regression/docs/en.md, phases/02-ml-fundamentals/04-decision-trees/docs/en.md, phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md, phases/02-ml-fundamentals/14-naive-bayes/docs/en.md

- **逻辑回归为什么不用 MSE？** 配合 sigmoid 时 MSE 非凸，二元交叉熵是凸的。
- **为什么假设错了 NB 也有效？** 分类需要的是正确的排序，而不是正确的概率。
- **为什么森林胜过单棵树？** 对去相关的树取平均可降低方差，且不增加偏差。
- **为什么只有支持向量起作用？** 间隔之外的点 hinge 损失为零。
- **NB 还是逻辑回归？** 先用 NB。数据量大且 NB 进入平台期时再切换。
- **正规方程还是梯度下降？** 小数据用正规方程，大数据用梯度下降。
- **NB 的概率可信吗？** 不可信。用 `CalibratedClassifierCV` 配合 `cv=5`。

## 从零实现的类
type: task-table
from: phases/02-ml-fundamentals/02-linear-regression/code/linear_regression.py, phases/02-ml-fundamentals/03-logistic-regression/code/logistic_regression.py, phases/02-ml-fundamentals/04-decision-trees/code/trees.py, phases/02-ml-fundamentals/05-support-vector-machines/code/svm.py, phases/02-ml-fundamentals/14-naive-bayes/code/naive_bayes.py

| 任务 | 代码 |
|---|---|
| 闭式解直线 | `LinearRegressionNormal()` |
| 节点不纯度 | `gini_impurity(labels)` |
| 核函数值 | `rbf_kernel(x, z, gamma=0.5)` |
| 批量 hinge 损失 | `hinge_loss(X, y, w, b)` |
| 文本分类器 | `MultinomialNB(alpha=1.0)` |
