# 没有监督的学习

> 没有标签,没有老师.

**类型:**构建
**语言:**字符串
**前置条件:**阶段1(规范与距离、概率与分布) 阶段2课时1-6
**时间:**时间90分钟

## 学习目标

- 从头实现K-Means、DBSCAN 和高斯混合模型,并比较它们的集群行为
- 使用模具分数 和肘部方法 评估集群 质量,并选择最优 K
- 解释DBSCAN何时优于K-Means,并识别哪种算法能处理非球形集群和外形
- 使用集群方法构建异常检测管道,以标记偏离正常模式的点

## 问题

到目前为止,每节 ML 课程都假设数据有标签:这是输入,这是正确输出.在现实世界中,标签成本很高.

如果监督学习像是从教材中学习的答案,那么监督学习就在凝视原始数据,直到模式本身出现.

问题在于:没有标签,你无法直接衡量正或错──你需要不同的工具来评估算法找到的结构是否有意义──

## 核心概念

### 聚类:把相似的事物分到一起

集群将每个数据点分为一个组,使同一组内点相似于其他组中的点.

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

### 常用主力方法

意思是将数据分为恰恰K个群.每个群都有一个中心位,每个点都属于离最近的中心位.

劳埃德的算法:

1. 随机选择 K 个点作为初始中心点
2. 将每个数据点分配给最近的中心点
3. 将每个中心点重重计算其分配点的平均值
4. 重复步骤 2-3,直到分配结果不再变化

目标函数 (惰性) 衡量每个点到其所属中心点的总平方距离.

### 选择 K

两种标准方法:

**Elbow method：**对 K = 1, 2, 3, ..., n 运行 K-Means──绘制惯性与 K 的关系图──寻找,也就是继续增加集群时惯性 不再显著下降位置──

**Silhouette score：**对每个点,衡量它与自身集群的相似程度 (a) 与最近的其他集群相比 (b) 如何──丝系数 为 (b - a) / max (a, b),范围从 -1 (分错集群) 到 +1 (分错集群) 划分良好) ──对所有点取平均得到全局分数──

### 基于密度的集群

假设集群是球形的,并要求你先选择K――DBSCAN 不做这两个假设――它将集群 找成稀疏区域分离的密区――

两个参数:
- **eps**邻域半径
- **min_samples**形成密区所需的最小点数

三类点:
- **Core point**距离内至少有几个样本
- **Border point**位于某个核心点的范围,但本身不是核心点
- **Noise point**既不是核心点,也不是边界点.

边界点会加入附近的核心点. 所在的核心点――噪音点不属于任何集群――

优点:能发现任意形状的集群,自动确定集群数量,识别异差点:难以处理密度差异较大的集群.

### 层次性集群

构建嵌套集群的树

集体 (自底上):
1. 从每个点都是自己的集群开始
2. 合并两个最近的集群
3. 重复,直到剩下一个集群
4. 在期望层次分离的子图中,得到了K 个集群

集群之间的接近程度可以以此方式衡量:
- **Single linkage**两个集群中任意两点之间的最小距离
- **Complete linkage**任意两点之间的最大距离
- **Average linkage**所有点对之间的平均距离
- **Ward's method**导致集群内总方差增加最小的合并方式

### 盖斯混合物模型 (GMM)

基-指 给出硬分:每个点恰好属于一个集群.

基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基

- **E-step**计算每个点属于每个高斯人的概率
- **M-step**更新每一个高斯人的平均值,变量和混合权重,以最大化数据概率

基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基因基基基因基因基基基基因基因基基基基基基基基基基基基基基基基基基基基基基基基

### 何時使用哪种方法

| Method | Best for | Avoid when |
|--------|----------|------------|
| K-Means | 大型数据集、球形 cluster、已知 K | 形状不规则、存在 outlier |
| DBSCAN | K 未知、任意形状、outlier detection | 密度差异大、维度非常高 |
| Hierarchical | 小型数据集、需要 dendrogram、K 未知 | 大型数据集（O(n^2) memory） |
| GMM | 重叠 cluster、需要软分配 | 非常大的数据集、维度过多 |

### 使用集群做异常检测

集群天然支持异常检测:
- **K-Means**距离任何一个中心点的异常
- **DBSCAN**根据定义,噪音点就是异常.
- **GMM**在所有高斯人的下概率都很低,这是异常点.


```figure
kmeans-step
```

## 构建它

### 步骤1:从头开始实现K-Means

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

### 步骤2:肘部方法和模具分数

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

### 步骤3:从实现DBSCAN开始

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

### 步骤 4:高斯混合模型 (EM算法)

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

### 步骤5:生成测试数据并运行所有内容

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

使用小小学习,同样的算法可以一行完成:

```python
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.mixture import GaussianMixture
from sklearn.metrics import silhouette_score as sklearn_silhouette

km = KMeans(n_clusters=3, random_state=42).fit(data)
db = DBSCAN(eps=1.5, min_samples=5).fit(data)
agg = AgglomerativeClustering(n_clusters=3).fit(data)
gmm_model = GaussianMixture(n_components=3, random_state=42).fit(data)
```

从头实现的版本会准确展示这些库在计算什么――K-Means 在分配和重新计算之间代――DBSCAN 从密种子开始扩大集群――GMM 在期望和最大化之间交换――库版本会增加数值稳定性、更智能的初始化――K-Means++) 和GPU加快,但核心逻辑相同――

## 交付它

本课会产出从实现的K-Means、DBSCAN和GMM──这里的集群代码可以作为更高级的无监督方法的基础复用──

## 练习

1. 实现K-Means++初始化:不要随机选择中心位,而是先随机选择第一个中心位,然后每个中心位都被选用与最近已有中心位的平方距离正比的概率进行比较.
2. 向代码中加入等级聚合集群化――实现 Ward的链接,并生成图 (如合并的嵌套列表) ―― 在不同层次分分它,并与 K-Means 结果比较――
3. 构建一个简单的异常检测管道:在同一数据上运行 DBSCAN 和 GMM,标记两种方法都认为是异常的点(DBSCAN 中的噪音,GMM 中的低概率点) ⋅衡量重叠程度,并讨论这些方法何时会产生分歧──

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

- [Stanford CS229 - Unsupervised Learning](https://cs229.stanford.edu/notes2022fall/main_notes.pdf)- 关于集群和EM的讲座笔记
- [scikit-learn Clustering Guide](https://scikit-learn.org/stable/modules/clustering.html)- 对所有集群算法的实用比较,并配有可见的示例
- [DBSCAN original paper (Ester et al., 1996)](https://www.aaai.org/Papers/KDD/1996/KDD96-037.pdf)- 提出基于密度的集群论文
