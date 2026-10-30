---
id: unsupervised-anomaly
title: Clustering, Dimensionality Reduction and Anomalies
code: CD
subtitle: 无标签地聚类、降维并标记异常。K-Means、DBSCAN、GMM、PCA、Isolation Forest、LOF。
hue: 280
sources: phases/02-ml-fundamentals/07-unsupervised-learning, phases/02-ml-fundamentals/16-anomaly-detection, phases/01-math-foundations/10-dimensionality-reduction
source_hash: 3ccb116dd003a31f
---

## 三项无标签任务
type: architecture
from: phases/02-ml-fundamentals/07-unsupervised-learning/docs/en.md, phases/02-ml-fundamentals/16-anomaly-detection/docs/en.md, phases/01-math-foundations/10-dimensionality-reduction/docs/en.md

```arch
node | raw | 1,2 | Raw data | no labels
node | pca | 2,1 | PCA | keep 90-95% variance
node | clu | 3,1 | Clustering | K-Means, DBSCAN, GMM
node | det | 2,3 | Detector | Isolation Forest, LOF
node | rec | 3,2 | Reconstruction error | high error is an outlier
node | score | 3,3 | Anomaly score | rank, then threshold
node | flag | 4,2 | Flagged points | human review
edge | raw | pca |
edge | pca | clu | reduced
edge | pca | rec |
edge | raw | det |
edge | det | score |
edge | rec | flag |
edge | score | flag |
```

## 从零实现的调用
type: task-table
from: phases/02-ml-fundamentals/07-unsupervised-learning/code/clustering.py, phases/01-math-foundations/10-dimensionality-reduction/code/dim_reduction.py, phases/02-ml-fundamentals/16-anomaly-detection/code/anomaly_detection.py

| 任务 | 代码 |
|---|---|
| K 个簇，硬标签 | `kmeans(data, k=3)` |
| 每个 K 的 inertia 与 silhouette | `find_best_k(data, max_k=6)` |
| 稠密区域，噪声为 -1 | `dbscan(data, eps=1.5, min_samples=5)` |
| 用 EM 得到软标签 | `gmm(data, k=3)` |
| 投影到 2 个轴 | `PCA(n_components=2).fit_transform(X)` |
| 分开圆环 | `kernel_pca(X, n_components, kernel="rbf", gamma=1.0)` |
| 按标准差标记 | `zscore_detect(X, threshold=3.0)` |
| 标记篱笆外的点 | `iqr_detect(X, factor=1.5)` |

## 在 sklearn 中同样的调用
type: annotated-code
lang: python
from: phases/02-ml-fundamentals/07-unsupervised-learning/docs/en.md, phases/02-ml-fundamentals/16-anomaly-detection/docs/en.md, phases/01-math-foundations/10-dimensionality-reduction/docs/en.md

```python
km = KMeans(n_clusters=3, random_state=42).fit(data)
db = DBSCAN(eps=1.5, min_samples=5).fit(data)
gmm_model = GaussianMixture(n_components=3, random_state=42).fit(data)
sklearn_pca = SklearnPCA(n_components=2)          # explained_variance_ratio_
tsne = TSNE(n_components=2, perplexity=30, random_state=42)
reducer = UMAP(n_components=2, n_neighbors=15, min_dist=0.1, random_state=42)
iso = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
iso.fit(X_train)                                  # fit on normal data
lof = LocalOutlierFactor(n_neighbors=20, contamination=0.05, novelty=True)
oc_svm = OneClassSVM(kernel="rbf", gamma="auto", nu=0.05)
```

## 公式
type: concepts
from: phases/02-ml-fundamentals/07-unsupervised-learning/docs/en.md, phases/02-ml-fundamentals/16-anomaly-detection/docs/en.md, phases/01-math-foundations/10-dimensionality-reduction/docs/en.md

- **Inertia**：每个点到其质心的平方距离之和。越低越紧。
- **Silhouette**：$(b - a) / \max(a, b)$，从 -1（分错簇）到 +1。
- **Z-score**：$(x - \text{mean}) / \text{std}$。绝对值超过阈值时标记。
- **IQR 篱笆**：$Q1 - \text{factor} \cdot IQR$ 和 $Q3 + \text{factor} \cdot IQR$，其中 $IQR = Q3 - Q1$。
- **Isolation score**：$2^{-\text{average\_path\_length}(x) / c(n)}$。接近 1 是异常，接近 0.5 是正常。
- **c(n)**：`2 * H(n-1) - 2*(n-1)/n`，一次失败搜索的期望路径长度。
- **解释比例**：$\text{eigenvalue}_k / \sum \text{all eigenvalues}$
- **PCA 丢失比例**：丢掉的特征值除以全部特征值。

## 聚类：何时用 X
type: command-table
from: phases/02-ml-fundamentals/07-unsupervised-learning/docs/en.md

| 命令 | 作用 |
|---|---|
| K-Means | 大数据、球形簇、已知 K。会被异常点伤害 |
| DBSCAN | K 未知、任意形状、能找噪声。密度变化时失败 |
| Hierarchical | 小数据，需要树状图。$O(n^2)$ 内存 |
| GMM | 重叠的椭圆形簇，软分配 |
| Ward linkage | 合并使簇内方差升幅最小的那一对 |

## 降维与检测：何时用 X
type: command-table
from: phases/01-math-foundations/10-dimensionality-reduction/docs/en.md, phases/02-ml-fundamentals/16-anomaly-detection/docs/en.md

| 命令 | 作用 |
|---|---|
| PCA | 预处理与压缩。快，全局方差 |
| t-SNE | 局部邻域的 2D 图。低于 10k 个样本 |
| UMAP | 大规模 2D 图。保留部分全局结构 |
| Kernel PCA | 非线性流形。核矩阵是 n 乘 n |
| Z-score / IQR | 一次一个特征。非常快 |
| Isolation Forest | 无假设。在高维上有效 |
| LOF | 局部异常，不同密度的簇。慢 |
| One-Class SVM | 中小数据。核矩阵二次增长 |

## 异常检测流水线
type: flow
from: phases/02-ml-fundamentals/16-anomaly-detection/docs/en.md

1. **基线**：收集一段几乎没有异常的时期。
2. **特征**：加入滚动统计、时间特征和比率。
3. **训练**：在基线上拟合检测器。它学习正常。
4. **打分**：给每个新观测一个异常分数。
5. **阈值**：按误报和漏报的成本选切断点。
6. **告警**：把标记点交给人工审查。
7. **反馈**：记录真异常和误报。调整阈值。

## 默认值与数字
type: defaults
from: phases/02-ml-fundamentals/16-anomaly-detection/docs/en.md, phases/02-ml-fundamentals/16-anomaly-detection/code/anomaly_detection.py, phases/01-math-foundations/10-dimensionality-reduction/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Z-score `threshold` | 3.0 | 99.7% 的高斯数据落在内部 |
| IQR `factor` | 1.5 | 3.0 会标记更少的点 |
| `n_estimators` | 100 | Isolation 树。通常足够 |
| `max_samples` | 256 | 每棵树的行数，来自原论文 |
| `predict` 阈值 | 0.5 | 分数高于它就是异常 |
| `contamination` | 0.05 | 只设切断点，不改分数 |
| t-SNE perplexity | 30 | 典型范围 5-50 |
| 保留的方差 | 0.95 | 或 0.90 作为 PCA 切断点 |

## 失败与修复
type: troubleshooting
from: phases/02-ml-fundamentals/07-unsupervised-learning/docs/en.md, phases/02-ml-fundamentals/16-anomaly-detection/docs/en.md, phases/01-math-foundations/10-dimensionality-reduction/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| K-Means 把月亮形拆得很差 | 簇不是球形 | 用 eps=0.3 的 DBSCAN |
| 每次跑 K-Means 结果都变 | Inertia 的局部最小 | 固定种子或用 K-Means++ |
| Z-score 漏点 | 多峰数据，或训练里有异常 | 用 IQR 或 Isolation Forest |
| 按特征的方法漏掉一个点 | 只在联合空间里异常 | 用 Isolation Forest |
| 准确率 99.9%，什么都没抓住 | 0.1% 异常，准确率没用 | Precision@k 和 AUPRC |
| 运维人员忽略告警 | 误报太多 | 从一个高阈值开始 |
| 中位分数向上漂移 | 数据变了或模型过时 | 用近期正常数据重训 |
| t-SNE 簇间距各不相同 | 簇之间的距离没有意义 | 只读簇本身 |

## 缩写
type: glossary
from: phases/02-ml-fundamentals/07-unsupervised-learning/docs/en.md, phases/02-ml-fundamentals/16-anomaly-detection/docs/en.md, phases/01-math-foundations/10-dimensionality-reduction/docs/en.md

- **DBSCAN**：基于密度的聚类。核心点、边界点和噪声点。
- **GMM**：Gaussian Mixture Model。K 个高斯，带软分配。
- **EM**：Expectation-Maximization。E 步概率，M 步参数。
- **PCA**：Principal Component Analysis。最大方差的轴。
- **t-SNE**：t-Distributed Stochastic Neighbor Embedding。保留邻居。
- **UMAP**：Uniform Manifold Approximation and Projection。更快，更全局。
- **LOF**：Local Outlier Factor。高于 1.0 表示密度低于邻居。
- **AUPRC**：精确率-召回率曲线下面积。这里优于 AUROC。

## 问题
type: qa
from: phases/02-ml-fundamentals/07-unsupervised-learning/docs/en.md, phases/02-ml-fundamentals/16-anomaly-detection/docs/en.md, phases/01-math-foundations/10-dimensionality-reduction/docs/en.md

- **怎么选 K？** 在 inertia 里找肘部。再看 silhouette 分数。
- **为什么给正常数据建模？** 异常稀少而且会变。偏离正常的东西包含新类型。
- **最好的训练设置是什么？** 半监督：只在干净的正常集合上拟合。
- **只有少量带标签的异常？** 用来评估，不要用来训练。
- **为什么 Isolation Forest 快？** 每棵树只用一小份子样本。
- **为什么要降维？** 高维里距离会收敛。最近邻搜索会失效。
