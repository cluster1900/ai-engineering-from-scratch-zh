---
name: skill-clustering-guide
description: 根据 data shape、noise 和约束选择合适的 Clustering algorithm
version: 1.0.0
phase: 2
lesson: 7
tags: [clustering, k-means, dbscan, hierarchical, gmm, unsupervised]
---

# Clustering Algorithm 选择指南

Clustering 没有单一的最佳 algorithm。正确选择取决于 cluster shape、你是否知道 cluster 数量、data 中有多少 noise，以及 dataset 有多大。

## 决策清单

1. 你知道 cluster 数量吗？
   - 是：K-Means 或 GMM
   - 否：DBSCAN（自动发现 clusters），或 hierarchical（在不同层级 cut dendrogram）

2. clusters 是什么形状？
   - 大致为球形（blob-like）：K-Means
   - 大小不同的椭圆形：GMM
   - 任意形状（新月形、环形、链状）：DBSCAN
   - 嵌套或 hierarchical：hierarchical clustering

3. data 是否包含 noise 或 outliers？
   - 是：DBSCAN（明确标记 noise points）或 GMM（低概率 points 是 outliers）
   - 否：K-Means 就可以

4. 你需要 soft assignments（probabilities）吗？
   - 是：GMM 为每个 cluster 给出 P(cluster | data point)
   - 否：K-Means 或 DBSCAN 给出 hard assignments

5. dataset 有多大？
   - 低于 10,000：任何 algorithm 都可用
   - 10,000 到 1,000,000：K-Means（快），Mini-Batch K-Means（更快）
   - 超过 1,000,000：Mini-Batch K-Means 或 BIRCH。Hierarchical 太慢。

## 何时使用每种方法

**K-Means**：默认起点。快速（O(n * k * iterations)）、简单，并且对很多问题已经足够好。使用 elbow method 或 silhouette score 来选择 K。局限：假设 clusters 为球形，对 initialization 敏感（使用 K-Means++ 或运行多次），不能很好处理不同大小的 clusters。

**DBSCAN**：最适合发现任意形状的 clusters，并自动检测 outliers。两个 parameters：eps（neighborhood radius）和 min_samples（minimum density）。不需要指定 K。局限：当 clusters 密度差异很大时表现吃力，并且 tuning eps 可能有难度。使用 k-distance plot 来估计 eps：计算到每个 point 的第 k 个 nearest neighbor 的 distance，排序，然后寻找 elbow。

**Hierarchical (Agglomerative)**：构建 merges 的 tree。当你想以多个 granularity 探索 cluster structure 时很有用（在不同高度 cut dendrogram）。Ward's linkage 最适合 compact clusters。Single linkage 能发现 elongated clusters，但对 noise 敏感。局限：O(n^2) memory 和 O(n^3) time，因此不适合 large datasets。

**GMM (Gaussian Mixture Models)**：带 probabilistic assignments 的 soft clustering。将每个 cluster 建模为具有自身 mean 和 covariance 的 Gaussian distribution。当 clusters 是椭圆形或重叠时，比 K-Means 更好。使用 BIC (Bayesian Information Criterion) 选择 components 数量。局限：假设 Gaussian distributions，可能在 non-convex shapes 上失败，对 initialization 敏感。

## 评估 cluster quality（无 labels）

| Metric | 衡量什么 | Range | 何时使用 |
|--------|-----------------|-------|----------|
| Silhouette score | Cohesion vs separation | -1 到 1（越高越好） | 比较 K values 或 algorithms |
| Inertia (within-cluster SS) | clusters 的紧密程度 | 0 到 inf（越低越好） | K-Means 的 elbow method |
| BIC / AIC | 带 complexity penalty 的 model fit | 越低越好 | 选择 GMM components 数量 |
| Calinski-Harabasz index | between variance 与 within variance 的比率 | 越高越好 | 快速比较 |
| Davies-Bouldin index | clusters 之间的平均相似度 | 越低越好 | 惩罚 overlapping clusters |

## 常见错误

- 在不缩放 features 的情况下运行 K-Means（scale 更大的 features 会主导 distance calculation）
- 当实际 data 是 high-dimensional 时，通过肉眼观察 2D data 来选择 K（使用 silhouette scores）
- 在 non-spherical clusters 上使用 K-Means（新月形或环形 data 需要 DBSCAN）
- 将 DBSCAN eps 设置得太大（所有东西都在一个 cluster 中）或太小（所有东西都是 noise）
- 把 cluster labels 当作 ground truth（Clustering 是探索性的；用 domain knowledge 验证）
- 在超过 20,000 个 points 的 datasets 上运行 hierarchical clustering（memory 和 time 会爆炸）

## 快速参考

| Algorithm | Cluster shape | Finds K | Handles noise | Soft assignments | Scalability |
|-----------|--------------|---------|---------------|-----------------|-------------|
| K-Means | 球形 | 否（你设置 K） | 否 | 否 | Millions |
| Mini-Batch K-Means | 球形 | 否 | 否 | 否 | Tens of millions |
| DBSCAN | 任意 | 是 | 是 | 否 | Hundreds of thousands |
| Hierarchical | 任意（取决于 linkage） | 灵活（cut dendrogram） | 取决于 linkage | 否 | Under 20k |
| GMM | 椭圆形 | 否（你设置 K） | 部分（低概率） | 是 | Under 100k |
| HDBSCAN | 任意 | 是 | 是 | 部分 | Hundreds of thousands |
