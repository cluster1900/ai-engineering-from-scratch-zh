# Unsupervised Learning

> 没有标签，没有老师。算法自行发现结构。

**类型:** 构建
**语言:** Python
**前置条件:** Phase 1（Norms & Distances、Probability & Distributions）、Phase 2 Lessons 1-6
**时间:** ~90 分钟

## 学习目标

- 从头实现 K-Means、DBSCAN 和 Gaussian Mixture Models，并比较它们的 Clustering 行为
- 使用 silhouette score 和 elbow method 评估 cluster 质量，并选择最优 K
- 解释 DBSCAN 何时优于 K-Means，并识别哪种算法能处理非球形 cluster 和 outlier
- 使用 Clustering 方法构建 anomaly detection pipeline，以标记偏离正常模式的点

## 问题

到目前为止，每一节 ML 课都假设数据带有标签：“这是输入，这是正确输出。”在真实世界中，标签成本很高。医院有数百万条患者记录，但没有人手工给每条记录标注疾病类别。电商网站有数百万个用户 session，但没有人手工标注客户分群。安全团队有网络日志，但没有人标记每一个 anomaly。

Unsupervised Learning 会在没有被告知要寻找什么的情况下发现模式。它会把相似的数据点分组，发现隐藏结构，并暴露 anomaly。如果 Supervised Learning 像是带着答案从教材中学习，那么 Unsupervised Learning 就是在凝视原始数据，直到模式自行显现。

问题在于：没有标签，你无法直接衡量“正确”或“错误”。你需要不同的工具来评估算法找到的结构是否有意义。

## 核心概念

### Clustering：把相似的事物分到一起

Clustering 会把每个数据点分配到一个组（cluster），使同一组内的点彼此之间比与其他组中的点更相似。问题始终是：“相似”到底是什么意思？

```mermaid
flowchart LR
    A[Raw Data] --> B{Choose Method}
    B --> C[K-Means]
    B --> D[DBSCAN]
    B --> E[Hierarchical]
    B --> F[GMM]
    C --> G[Flat, spherical clusters]
    D --> H[Arbitrary shapes, noise detection]
    E --> I[Tree of nested clusters]
    F --> J[Soft assignments, elliptical clusters]
```

### K-Means：常用主力方法

K-Means 会把数据划分为恰好 K 个 cluster。每个 cluster 都有一个 centroid（其质心），每个点都属于距离最近的 centroid。

Lloyd's algorithm：

1. 随机选择 K 个点作为初始 centroid
2. 将每个数据点分配给最近的 centroid
3. 将每个 centroid 重新计算为其所分配点的均值
4. 重复步骤 2-3，直到分配结果不再变化

目标函数（inertia）衡量每个点到其所属 centroid 的总平方距离。K-Means 会最小化这个值，但只能找到局部最小值。不同的初始化可能得到不同结果。

### 选择 K

两种标准方法：

**Elbow method：** 对 K = 1, 2, 3, ..., n 运行 K-Means。绘制 inertia 与 K 的关系图。寻找“elbow”，也就是继续增加 cluster 时 inertia 不再显著下降的位置。

**Silhouette score：** 对每个点，衡量它与自身 cluster 的相似程度（a）相对于最近的其他 cluster（b）如何。silhouette coefficient 为 (b - a) / max(a, b)，范围从 -1（分错 cluster）到 +1（cluster 划分良好）。对所有点取平均得到全局分数。

### DBSCAN：基于密度的 Clustering

K-Means 假设 cluster 是球形的，并要求你预先选择 K。DBSCAN 不做这两个假设。它会把 cluster 找成由稀疏区域分隔开的稠密区域。

两个参数：
- **eps**：邻域半径
- **min_samples**：形成稠密区域所需的最少点数

三类点：
- **Core point**：在 eps 距离内至少有 min_samples 个点
- **Border point**：位于某个 core point 的 eps 范围内，但自身不是 core point
- **Noise point**：既不是 core point，也不是 border point。这些是 outlier。

DBSCAN 会把彼此位于 eps 范围内的 core point 连接成同一个 cluster。Border point 会加入附近 core point 所在的 cluster。Noise point 不属于任何 cluster。

优点：能发现任意形状的 cluster，自动确定 cluster 数量，识别 outlier。弱点：难以处理密度差异较大的 cluster。

### Hierarchical Clustering

构建嵌套 cluster 的树（dendrogram）。

Agglomerative（自底向上）：
1. 从每个点都是自己的 cluster 开始
2. 合并两个最近的 cluster
3. 重复，直到只剩一个 cluster
4. 在期望层级切分 dendrogram，得到 K 个 cluster

cluster 之间的“接近程度”可以这样衡量：
- **Single linkage**：两个 cluster 中任意两点之间的最小距离
- **Complete linkage**：任意两点之间的最大距离
- **Average linkage**：所有点对之间的平均距离
- **Ward's method**：导致 cluster 内总方差增加最小的合并方式

### Gaussian Mixture Models (GMM)

K-Means 给出硬分配：每个点恰好属于一个 cluster。GMM 给出软分配：每个点都有属于每个 cluster 的概率。

GMM 假设数据由 K 个 Gaussian distribution 的混合生成，每个 distribution 都有自己的均值和 covariance。Expectation-Maximization (EM) algorithm 在以下两步之间交替：

- **E-step**：计算每个点属于每个 Gaussian 的概率
- **M-step**：更新每个 Gaussian 的均值、covariance 和 mixing weight，以最大化数据 likelihood

GMM 可以建模椭圆形 cluster（而不仅仅是 K-Means 那样的球形），并且能自然处理重叠 cluster。

### 何时使用哪种方法

| Method | Best for | Avoid when |
|--------|----------|------------|
| K-Means | 大型数据集、球形 cluster、已知 K | 形状不规则、存在 outlier |
| DBSCAN | K 未知、任意形状、outlier detection | 密度差异大、维度非常高 |
| Hierarchical | 小型数据集、需要 dendrogram、K 未知 | 大型数据集（O(n^2) memory） |
| GMM | 重叠 cluster、需要软分配 | 非常大的数据集、维度过多 |

### 使用 Clustering 做 Anomaly Detection

Clustering 天然支持 anomaly detection：
- **K-Means**：远离任何 centroid 的点是 anomaly
- **DBSCAN**：根据定义，noise point 就是 anomaly
- **GMM**：在所有 Gaussian 下概率都很低的点是 anomaly

## 构建它

### 步骤 1：从头实现 K-Means

```python
import math
import random


def euclidean_distance(a, b):
    return math.sqrt(sum((ai - bi) ** 2 for ai, bi in zip(a, b)))


def kmeans(data, k, max_iterations=100, seed=42):
    random.seed(seed)
    n_features = len(data[0])

    centroids = random.sample(data, k)

    for iteration in range(max_iterations):
        clusters = [[] for _ in range(k)]
        assignments = []

        for point in data:
            distances = [euclidean_distance(point, c) for c in centroids]
            nearest = distances.index(min(distances))
            clusters[nearest].append(point)
            assignments.append(nearest)

        new_centroids = []
        for cluster in clusters:
            if len(cluster) == 0:
                new_centroids.append(random.choice(data))
                continue
            centroid = [
                sum(point[j] for point in cluster) / len(cluster)
                for j in range(n_features)
            ]
            new_centroids.append(centroid)

        if all(
            euclidean_distance(old, new) < 1e-6
            for old, new in zip(centroids, new_centroids)
        ):
            print(f"  Converged at iteration {iteration + 1}")
            break

        centroids = new_centroids

    return assignments, centroids
```

### 步骤 2：Elbow method 和 silhouette score

```python
def compute_inertia(data, assignments, centroids):
    total = 0.0
    for point, cluster_id in zip(data, assignments):
        total += euclidean_distance(point, centroids[cluster_id]) ** 2
    return total


def silhouette_score(data, assignments):
    n = len(data)
    if n < 2:
        return 0.0

    clusters = {}
    for i, c in enumerate(assignments):
        clusters.setdefault(c, []).append(i)

    if len(clusters) < 2:
        return 0.0

    scores = []
    for i in range(n):
        own_cluster = assignments[i]
        own_members = [j for j in clusters[own_cluster] if j != i]

        if len(own_members) == 0:
            scores.append(0.0)
            continue

        a = sum(euclidean_distance(data[i], data[j]) for j in own_members) / len(own_members)

        b = float("inf")
        for cluster_id, members in clusters.items():
            if cluster_id == own_cluster:
                continue
            avg_dist = sum(euclidean_distance(data[i], data[j]) for j in members) / len(members)
            b = min(b, avg_dist)

        if max(a, b) == 0:
            scores.append(0.0)
        else:
            scores.append((b - a) / max(a, b))

    return sum(scores) / len(scores)


def find_best_k(data, max_k=10):
    print("Elbow method:")
    inertias = []
    for k in range(1, max_k + 1):
        assignments, centroids = kmeans(data, k)
        inertia = compute_inertia(data, assignments, centroids)
        inertias.append(inertia)
        print(f"  K={k}: inertia={inertia:.2f}")

    print("\nSilhouette scores:")
    for k in range(2, max_k + 1):
        assignments, centroids = kmeans(data, k)
        score = silhouette_score(data, assignments)
        print(f"  K={k}: silhouette={score:.4f}")

    return inertias
```

### 步骤 3：从头实现 DBSCAN

```python
def dbscan(data, eps, min_samples):
    n = len(data)
    labels = [-1] * n
    cluster_id = 0

    def region_query(point_idx):
        neighbors = []
        for i in range(n):
            if euclidean_distance(data[point_idx], data[i]) <= eps:
                neighbors.append(i)
        return neighbors

    visited = [False] * n

    for i in range(n):
        if visited[i]:
            continue
        visited[i] = True

        neighbors = region_query(i)

        if len(neighbors) < min_samples:
            labels[i] = -1
            continue

        labels[i] = cluster_id
        seed_set = list(neighbors)
        seed_set.remove(i)

        j = 0
        while j < len(seed_set):
            q = seed_set[j]

            if not visited[q]:
                visited[q] = True
                q_neighbors = region_query(q)
                if len(q_neighbors) >= min_samples:
                    for nb in q_neighbors:
                        if nb not in seed_set:
                            seed_set.append(nb)

            if labels[q] == -1:
                labels[q] = cluster_id

            j += 1

        cluster_id += 1

    return labels
```

### 步骤 4：Gaussian Mixture Model（EM algorithm）

```python
def gmm(data, k, max_iterations=100, seed=42):
    random.seed(seed)
    n = len(data)
    d = len(data[0])

    indices = random.sample(range(n), k)
    means = [list(data[i]) for i in indices]
    variances = [1.0] * k
    weights = [1.0 / k] * k

    def gaussian_pdf(x, mean, variance):
        d = len(x)
        coeff = 1.0 / ((2 * math.pi * variance) ** (d / 2))
        exponent = -sum((xi - mi) ** 2 for xi, mi in zip(x, mean)) / (2 * variance)
        return coeff * math.exp(max(exponent, -500))

    for iteration in range(max_iterations):
        responsibilities = []
        for i in range(n):
            probs = []
            for j in range(k):
                probs.append(weights[j] * gaussian_pdf(data[i], means[j], variances[j]))
            total = sum(probs)
            if total == 0:
                total = 1e-300
            responsibilities.append([p / total for p in probs])

        old_means = [list(m) for m in means]

        for j in range(k):
            r_sum = sum(responsibilities[i][j] for i in range(n))
            if r_sum < 1e-10:
                continue

            weights[j] = r_sum / n

            for dim in range(d):
                means[j][dim] = sum(
                    responsibilities[i][j] * data[i][dim] for i in range(n)
                ) / r_sum

            variances[j] = sum(
                responsibilities[i][j]
                * sum((data[i][dim] - means[j][dim]) ** 2 for dim in range(d))
                for i in range(n)
            ) / (r_sum * d)
            variances[j] = max(variances[j], 1e-6)

        shift = sum(
            euclidean_distance(old_means[j], means[j]) for j in range(k)
        )
        if shift < 1e-6:
            print(f"  GMM converged at iteration {iteration + 1}")
            break

    assignments = []
    for i in range(n):
        assignments.append(responsibilities[i].index(max(responsibilities[i])))

    return assignments, means, weights, responsibilities
```

### 步骤 5：生成测试数据并运行所有内容

```python
def make_blobs(centers, n_per_cluster=50, spread=0.5, seed=42):
    random.seed(seed)
    data = []
    true_labels = []
    for label, (cx, cy) in enumerate(centers):
        for _ in range(n_per_cluster):
            x = cx + random.gauss(0, spread)
            y = cy + random.gauss(0, spread)
            data.append([x, y])
            true_labels.append(label)
    return data, true_labels


def make_moons(n_samples=200, noise=0.1, seed=42):
    random.seed(seed)
    data = []
    labels = []
    n_half = n_samples // 2
    for i in range(n_half):
        angle = math.pi * i / n_half
        x = math.cos(angle) + random.gauss(0, noise)
        y = math.sin(angle) + random.gauss(0, noise)
        data.append([x, y])
        labels.append(0)
    for i in range(n_half):
        angle = math.pi * i / n_half
        x = 1 - math.cos(angle) + random.gauss(0, noise)
        y = 1 - math.sin(angle) - 0.5 + random.gauss(0, noise)
        data.append([x, y])
        labels.append(1)
    return data, labels


if __name__ == "__main__":
    centers = [[2, 2], [8, 3], [5, 8]]
    data, true_labels = make_blobs(centers, n_per_cluster=50, spread=0.8)

    print("=== K-Means on 3 blobs ===")
    assignments, centroids = kmeans(data, k=3)
    print(f"  Centroids: {[[round(c, 2) for c in cent] for cent in centroids]}")
    sil = silhouette_score(data, assignments)
    print(f"  Silhouette score: {sil:.4f}")

    print("\n=== Elbow Method ===")
    find_best_k(data, max_k=6)

    print("\n=== DBSCAN on 3 blobs ===")
    db_labels = dbscan(data, eps=1.5, min_samples=5)
    n_clusters = len(set(db_labels) - {-1})
    n_noise = db_labels.count(-1)
    print(f"  Found {n_clusters} clusters, {n_noise} noise points")

    print("\n=== GMM on 3 blobs ===")
    gmm_assignments, gmm_means, gmm_weights, _ = gmm(data, k=3)
    print(f"  Means: {[[round(m, 2) for m in mean] for mean in gmm_means]}")
    print(f"  Weights: {[round(w, 3) for w in gmm_weights]}")
    gmm_sil = silhouette_score(data, gmm_assignments)
    print(f"  Silhouette score: {gmm_sil:.4f}")

    print("\n=== DBSCAN on moons (non-spherical clusters) ===")
    moon_data, moon_labels = make_moons(n_samples=200, noise=0.1)
    moon_db = dbscan(moon_data, eps=0.3, min_samples=5)
    n_moon_clusters = len(set(moon_db) - {-1})
    n_moon_noise = moon_db.count(-1)
    print(f"  Found {n_moon_clusters} clusters, {n_moon_noise} noise points")

    print("\n=== K-Means on moons (will fail to separate) ===")
    moon_km, moon_centroids = kmeans(moon_data, k=2)
    moon_sil = silhouette_score(moon_data, moon_km)
    print(f"  Silhouette score: {moon_sil:.4f}")
    print("  K-Means splits moons poorly because they are not spherical")

    print("\n=== Anomaly detection with DBSCAN ===")
    anomaly_data = list(data)
    anomaly_data.append([20.0, 20.0])
    anomaly_data.append([-5.0, -5.0])
    anomaly_data.append([15.0, 0.0])
    anomaly_labels = dbscan(anomaly_data, eps=1.5, min_samples=5)
    anomalies = [
        anomaly_data[i]
        for i in range(len(anomaly_labels))
        if anomaly_labels[i] == -1
    ]
    print(f"  Detected {len(anomalies)} anomalies")
    for a in anomalies[-3:]:
        print(f"    Point {[round(v, 2) for v in a]}")
```

## 使用它

使用 scikit-learn，同样的算法都可以一行完成：

```python
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.mixture import GaussianMixture
from sklearn.metrics import silhouette_score as sklearn_silhouette

km = KMeans(n_clusters=3, random_state=42).fit(data)
db = DBSCAN(eps=1.5, min_samples=5).fit(data)
agg = AgglomerativeClustering(n_clusters=3).fit(data)
gmm_model = GaussianMixture(n_components=3, random_state=42).fit(data)
```

从头实现的版本会准确展示这些库在计算什么。K-Means 在分配和重新计算之间迭代。DBSCAN 从稠密 seed 开始扩展 cluster。GMM 在 expectation 和 maximization 之间交替。库版本会增加数值稳定性、更智能的初始化（K-Means++）和 GPU 加速，但核心逻辑相同。

## 交付它

本课会产出从头实现的 K-Means、DBSCAN 和 GMM。这里的 Clustering 代码可以作为更高级 unsupervised 方法的基础复用。

## 练习

1. 实现 K-Means++ 初始化：不要随机选择 centroid，而是先随机选择第一个 centroid，之后每个 centroid 都以与最近已有 centroid 的平方距离成正比的概率被选中。将其收敛速度与随机初始化进行比较。
2. 向代码中加入 hierarchical agglomerative clustering。实现 Ward's linkage，并生成 dendrogram（作为合并的嵌套列表）。在不同层级切分它，并与 K-Means 结果比较。
3. 构建一个简单的 anomaly detection pipeline：在同一数据上运行 DBSCAN 和 GMM，标记两种方法都认为是 outlier 的点（DBSCAN 中的 noise，GMM 中的低概率点）。衡量重叠程度，并讨论这些方法何时会产生分歧。

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Clustering | “把相似的事物分组” | 将数据划分为若干子集，使组内相似度高于组间相似度，并由特定距离度量来衡量 |
| Centroid | “cluster 的中心” | 分配给某个 cluster 的所有点的均值；K-Means 将其用作 cluster 的代表 |
| Inertia | “cluster 有多紧凑” | 每个点到其所属 centroid 的平方距离之和；越低表示越紧凑 |
| Silhouette score | “cluster 分离得有多好” | 对每个点计算 (b - a) / max(a, b)，其中 a 是平均 cluster 内距离，b 是最近 cluster 的平均距离 |
| Core point | “稠密区域中的点” | 在 DBSCAN 中，eps 距离内至少有 min_samples 个邻居的点 |
| EM algorithm | “软 K-Means” | Expectation-Maximization：迭代计算成员概率（E-step）并更新 distribution 参数（M-step） |
| Dendrogram | “cluster 的树” | 一种树状图，展示 hierarchical clustering 中 cluster 被合并的顺序以及合并时的距离 |
| Anomaly | “一个 outlier” | 不符合预期模式的数据点，在 DBSCAN 中被识别为 noise，或在 GMM 中被识别为低概率点 |

## 延伸阅读

- [Stanford CS229 - Unsupervised Learning](https://cs229.stanford.edu/notes2022fall/main_notes.pdf) - Andrew Ng 关于 Clustering 和 EM 的 lecture notes
- [scikit-learn Clustering Guide](https://scikit-learn.org/stable/modules/clustering.html) - 对所有 Clustering 算法的实用比较，并配有可视化示例
- [DBSCAN original paper (Ester et al., 1996)](https://www.aaai.org/Papers/KDD/1996/KDD96-037.pdf) - 提出 density-based clustering 的论文
