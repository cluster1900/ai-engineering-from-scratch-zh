# 范数和距离

> 你的距离函数定义了什么叫“相似”。选错了，下游的一切都会出问题。

**Type:** Build
**Language:** Python
**前置要求：** Phase 1，Lessons 01 (Linear Algebra Intuition)，02 (Vectors, Matrices & Operations)
**Time:** ~90 分钟

## 学习目标

- 从零实现 L1、L2、cosine、Mahalanobis、Jaccard 和 edit distance 函数
- 为给定 ML 任务选择合适的距离度量，并解释为什么其他选择会失败
- 将 L1 和 L2 范数与 LASSO、Ridge 正则化及其几何约束区域联系起来
- 展示同一数据集在不同度量下会产生不同的 nearest neighbors

## 问题

你有两个 Vectors。它们可能是 word embeddings。也可能是用户画像。也可能是像素数组。你需要知道：它们有多接近？

答案完全取决于你选择哪个距离函数。两个数据点在一种度量下可能是 nearest neighbors，在另一种度量下却相距很远。你的 KNN classifier、推荐引擎、vector database、clustering algorithm、Loss Function 都依赖这个选择。选错了，你的模型就会优化错误的目标。

不存在通用的最佳距离。L2 适合空间数据。Cosine similarity 在 NLP 中占主导。Jaccard 处理集合。Edit distance 处理字符串。Mahalanobis 会考虑相关性。Wasserstein 会移动概率质量。每一种都编码了关于“相似”含义的不同假设。

本课会从零构建每一种主要距离函数，说明什么时候该用哪一种，并展示同一份数据如何因为使用不同度量而产生完全不同的 nearest neighbors。

## 概念

### Norms：测量 Vector 大小

范数衡量一个 Vector 的“大小”。两个 Vectors 之间的每个距离函数都可以写成它们差值的范数：d(a, b) = ||a - b||。所以理解范数就是理解距离。

### L1 Norm（Manhattan distance）

L1 norm 对所有分量的绝对值求和。

```
||x||_1 = |x_1| + |x_2| + ... + |x_n|
```

它被称为 Manhattan distance，因为它衡量的是你在城市网格中行走的距离，在那里你只能沿坐标轴移动，不能走对角线。

```
Point A = (1, 1)
Point B = (4, 5)

L1 distance = |4-1| + |5-1| = 3 + 4 = 7

On a grid, you walk 3 blocks east and 4 blocks north.
```

何时使用 L1：
- 高维稀疏数据（文本特征、one-hot encodings）
- 当你希望对 outliers 更稳健时（单个巨大差异不会主导结果）
- 特征选择问题（L1 regularization 会促进稀疏性）

与 L1 regularization（Lasso）的联系：在你的 Loss Function 中加入 ||w||_1，会惩罚权重绝对值之和。这会把较小的权重推到精确的零，从而执行自动特征选择。L1 penalty 会在权重空间中产生菱形约束区域，而菱形的角位于坐标轴上，在那里某些权重为零。

与 Loss Functions 的联系：Mean Absolute Error（MAE）是预测值和目标值之间 L1 distance 的平均值。它线性惩罚所有误差，因此相比 MSE 对 outliers 更稳健。

### L2 Norm（Euclidean distance）

L2 norm 是直线距离。它等于平方分量之和的平方根。

```
||x||_2 = sqrt(x_1^2 + x_2^2 + ... + x_n^2)
```

这就是你在几何课上学过的距离。n 维中的勾股定理。

```
Point A = (1, 1)
Point B = (4, 5)

L2 distance = sqrt((4-1)^2 + (5-1)^2) = sqrt(9 + 16) = sqrt(25) = 5.0

The straight line, cutting diagonally through the grid.
```

何时使用 L2：
- 低到中等维度的连续数据
- 当特征尺度可比较时
- 物理距离（空间数据、传感器读数）
- 像素级别的图像相似度

与 L2 regularization（Ridge）的联系：在你的 Loss Function 中加入 ||w||_2^2，会惩罚较大的权重。与 L1 不同，它不会把权重推到零。它会按比例把所有权重向零收缩。L2 penalty 会产生圆形约束区域，所以坐标轴上没有角。权重会变小，但很少精确为零。

与 Loss Functions 的联系：Mean Squared Error（MSE）是 L2 distances 平方的平均值。平方会比小误差更重地惩罚大误差。

```
MAE (L1 loss):  |y - y_hat|         Linear penalty. Robust to outliers.
MSE (L2 loss):  (y - y_hat)^2       Quadratic penalty. Sensitive to outliers.
```

### Lp Norms：通用族

L1 和 L2 是 Lp norm 的特殊情况：

```
||x||_p = (|x_1|^p + |x_2|^p + ... + |x_n|^p)^(1/p)
```

不同的 p 值会产生不同形状的“unit balls”（距离原点为 1 的所有点的集合）：

```
p=1:    Diamond shape      (corners on axes)
p=2:    Circle/sphere      (the usual round ball)
p=3:    Superellipse       (rounded square)
p=inf:  Square/hypercube   (flat sides along axes)
```

### L-infinity Norm（Chebyshev distance）

当 p 趋近无穷大时，Lp norm 收敛到最大绝对分量。

```
||x||_inf = max(|x_1|, |x_2|, ..., |x_n|)
```

两个点之间的距离由它们差异最大的那个维度决定。所有其他维度都会被忽略。

```
Point A = (1, 1)
Point B = (4, 5)

L-inf distance = max(|4-1|, |5-1|) = max(3, 4) = 4
```

何时使用 L-infinity：
- 当任一单独维度中的最坏情况偏差很重要时
- 游戏棋盘（国际象棋中的国王按 L-infinity 移动：任意方向走一步的代价都是 1）
- 制造公差（每个维度都必须在规格范围内）

### Cosine Similarity 和 Cosine Distance

Cosine similarity 衡量两个 Vectors 之间的角度，忽略它们的大小。

```
cos_sim(a, b) = (a . b) / (||a||_2 * ||b||_2)
```

它的范围是 -1（方向相反）到 +1（方向相同）。垂直 Vectors 的 cosine similarity 为 0。

Cosine distance 将它转换为距离：cosine_distance = 1 - cosine_similarity。范围是 0（方向相同）到 2（方向相反）。

```
a = (1, 0)    b = (1, 1)

cos_sim = (1*1 + 0*1) / (1 * sqrt(2)) = 1/sqrt(2) = 0.707
cos_dist = 1 - 0.707 = 0.293
```

为什么 cosine 在 NLP 和 embeddings 中占主导：在文本中，文档长度不应影响相似度。一篇关于猫的文档即使比另一篇关于猫的文档长两倍，也仍然应该是“相似”的。Cosine similarity 会忽略大小（长度），只关心方向。两个词分布相同但长度不同的文档指向同一方向，并得到 1.0 的 cosine similarity。

何时使用 cosine similarity：
- 文本相似度（TF-IDF vectors、word embeddings、sentence embeddings）
- 任何大小是噪声、方向是信号的领域
- 推荐系统（用户偏好 Vectors）
- Embedding search（vector databases 几乎总是使用 cosine 或 dot product）

### Dot Product Similarity vs Cosine Similarity

两个 Vectors 的 dot product 是：

```
a . b = a_1*b_1 + a_2*b_2 + ... + a_n*b_n
      = ||a|| * ||b|| * cos(angle)
```

Cosine similarity 是按两个大小归一化后的 dot product。当两个 Vectors 已经是单位归一化（大小 = 1）时，dot product 和 cosine similarity 完全相同。

```
If ||a|| = 1 and ||b|| = 1:
    a . b = cos(angle between a and b)
```

它们不同的情况：dot product 包含大小信息。大小更大的 Vector 会得到更高的 dot product 分数。在一些检索系统中，如果你希望“热门”物品排名更高，这一点很重要。大小会作为隐式的质量或重要性信号。

```
a = (3, 0)    b = (1, 0)    c = (0, 1)

dot(a, b) = 3     dot(a, c) = 0
cos(a, b) = 1.0   cos(a, c) = 0.0

Both agree on direction, but dot product also reflects magnitude.
```

实践中：
- 当你想要纯方向相似度时，使用 cosine similarity
- 当大小携带有意义信息时，使用 dot product
- 许多 vector databases（Pinecone、Weaviate、Qdrant）允许你在二者之间选择
- 如果你的 embeddings 已经 L2-normalized，那么选择哪个都无所谓

### Mahalanobis Distance

Euclidean distance 平等对待所有维度。但如果你的特征相关，或者尺度不同，L2 会给出误导性结果。

Mahalanobis distance 会考虑数据的 covariance 结构。

```
d_M(x, y) = sqrt((x - y)^T * S^(-1) * (x - y))
```

其中 S 是数据的 covariance matrix。

直观理解：Mahalanobis distance 会先对数据去相关并归一化（whitening），然后在变换后的空间中计算 L2 distance。如果 S 是 identity matrix（不相关、单位方差特征），Mahalanobis distance 就会退化为 Euclidean distance。

```
Example: height and weight are correlated.
Someone 6'2" and 180 lbs is not unusual.
Someone 5'0" and 180 lbs is unusual.

Euclidean distance might say they are equally far from the mean.
Mahalanobis distance correctly identifies the second as an outlier
because it accounts for the height-weight correlation.
```

何时使用 Mahalanobis distance：
- Outlier detection（与均值 Mahalanobis distance 较大的点是 outliers）
- 当特征尺度不同且存在相关性时的 Classification
- 当你有足够数据来估计可靠的 covariance matrix 时
- 制造质量控制（多变量过程监控）

### Jaccard Similarity（用于集合）

Jaccard similarity 衡量两个集合之间的重叠程度。

```
J(A, B) = |A intersect B| / |A union B|
```

它的范围是 0（没有重叠）到 1（集合相同）。Jaccard distance = 1 - Jaccard similarity。

```
A = {cat, dog, fish}
B = {cat, bird, fish, snake}

Intersection = {cat, fish}         size = 2
Union = {cat, dog, fish, bird, snake}  size = 5

Jaccard similarity = 2/5 = 0.4
Jaccard distance = 0.6
```

何时使用 Jaccard：
- 比较标签、类别或特征集合
- 基于词是否出现的文档相似度（而不是频率）
- 近重复检测（Jaccard 的 MinHash 近似）
- 比较二值特征 Vectors（存在/不存在数据）
- 评估分割模型（Intersection over Union = Jaccard）

### Edit Distance（Levenshtein Distance）

Edit distance 计算把一个字符串转换成另一个字符串所需的最少单字符操作数。操作包括：插入、删除或替换。

```
"kitten" -> "sitting"

kitten -> sitten  (substitute k -> s)
sitten -> sittin  (substitute e -> i)
sittin -> sitting (insert g)

Edit distance = 3
```

使用动态规划计算。填充一个 Matrix，其中条目 (i, j) 是字符串 A 的前 i 个字符与字符串 B 的前 j 个字符之间的 edit distance。

```
        ""  s  i  t  t  i  n  g
    ""   0  1  2  3  4  5  6  7
    k    1  1  2  3  4  5  6  7
    i    2  2  1  2  3  4  5  6
    t    3  3  2  1  2  3  4  5
    t    4  4  3  2  1  2  3  4
    e    5  5  4  3  2  2  3  4
    n    6  6  5  4  3  3  2  3
```

何时使用 edit distance：
- 拼写检查和纠正
- DNA sequence alignment（带加权操作）
- 模糊字符串匹配
- 脏文本数据去重

### KL Divergence（不是距离，但常被当作距离使用）

KL divergence 衡量一个概率分布与另一个概率分布的差异。本内容在 Lesson 09 中讲过，但它属于这次讨论，因为人们经常把它当作“距离”使用，尽管它并不是距离。

```
D_KL(P || Q) = sum(p(x) * log(p(x) / q(x)))
```

关键性质：KL divergence 不是对称的。

```
D_KL(P || Q) != D_KL(Q || P)
```

这意味着它不满足距离度量的基本要求。它也不满足三角不等式。它是 divergence，不是 distance。

Forward KL（D_KL(P || Q)）是“mean-seeking”：Q 试图覆盖 P 的所有 modes。
Reverse KL（D_KL(Q || P)）是“mode-seeking”：Q 专注于 P 的单个 mode。

你会在这些地方看到 KL divergence：
- VAEs（ELBO 中的 KL 项会把 latent distribution 推向 prior）
- Knowledge distillation（student 试图匹配 teacher 的分布）
- RLHF（KL penalty 让 fine-tuned model 保持接近 base model）
- Policy gradient methods（约束 policy updates）

### Wasserstein Distance（Earth Mover's Distance）

Wasserstein distance 衡量把一个概率分布转换成另一个概率分布所需的最小“work”。可以这样理解：如果一个分布是一堆土，另一个是一个坑，你需要移动多少土、移动多远？

```
W(P, Q) = inf over all transport plans gamma of E[d(x, y)]
```

对于 1D 分布，它会简化为累计分布函数绝对差的积分：

```
W_1(P, Q) = integral |CDF_P(x) - CDF_Q(x)| dx
```

为什么 Wasserstein 重要：
- 它是真正的 metric（对称，满足三角不等式）
- 即使分布不重叠，它也能提供 Gradients（KL divergence 会趋于无穷大）
- 这个性质使它成为 Wasserstein GANs（WGANs）的核心，后者解决了原始 GANs 的训练不稳定问题

```
Distributions with no overlap:

P: [1, 0, 0, 0, 0]    Q: [0, 0, 0, 0, 1]

KL divergence: infinity (log of zero)
Wasserstein: 4 (move all mass 4 bins)

Wasserstein gives a meaningful gradient. KL does not.
```

何时使用 Wasserstein：
- GAN training（WGAN、WGAN-GP）
- 比较可能不重叠的分布
- Optimal transport 问题
- 图像检索（比较颜色直方图）

### 为什么不同任务需要不同距离

| Task | Best distance | Why |
|------|--------------|-----|
| 文本相似度 | Cosine | 大小是噪声，方向是含义 |
| 图像像素比较 | L2 | 空间关系重要，特征尺度可比较 |
| 稀疏高维特征 | L1 | 稳健，不会放大罕见的大差异 |
| 集合重叠（标签、类别） | Jaccard | 数据天然是集合值，而不是 Vector 型 |
| 字符串匹配 | Edit distance | 操作映射到人类编辑直觉 |
| Outlier detection | Mahalanobis | 考虑特征相关性和尺度 |
| 比较分布 | KL divergence | 衡量使用 Q 而不是 P 时丢失的信息 |
| GAN training | Wasserstein | 即使分布不重叠也能提供 Gradients |
| Embeddings（vector DB） | Cosine or dot product | Embeddings 被训练为在方向中编码含义 |
| 推荐 | Dot product | 大小可以编码流行度或置信度 |
| DNA sequences | Weighted edit distance | 替换成本因核苷酸对而异 |
| Manufacturing QC | L-infinity | 任意维度中的最坏情况偏差都很重要 |

### 与 Loss Functions 的联系

Loss Functions 是应用于预测值与目标值之间的距离函数。

```
Loss function       Distance it uses       Behavior
MSE                 L2 squared             Penalizes large errors heavily
MAE                 L1                     Penalizes all errors equally
Huber loss          L1 for large errors,   Best of both: robust to outliers,
                    L2 for small errors    smooth gradient near zero
Cross-entropy       KL divergence          Measures distribution mismatch
Hinge loss          max(0, margin - d)     Only penalizes below margin
Triplet loss        L2 (typically)         Pulls positives close, pushes
                                           negatives away
Contrastive loss    L2                     Similar pairs close, dissimilar
                                           pairs beyond margin
```

### 与正则化的联系

正则化会在 Loss Function 上加入对权重的范数惩罚。

```
L1 regularization (Lasso):   loss + lambda * ||w||_1
  -> Sparse weights. Some weights become exactly zero.
  -> Automatic feature selection.
  -> Solution has corners (non-differentiable at zero).

L2 regularization (Ridge):   loss + lambda * ||w||_2^2
  -> Small weights. All weights shrink toward zero.
  -> No feature selection (nothing goes to exactly zero).
  -> Smooth solution everywhere.

Elastic Net:                  loss + lambda_1 * ||w||_1 + lambda_2 * ||w||_2^2
  -> Combines sparsity of L1 with stability of L2.
  -> Groups of correlated features are kept or dropped together.
```

为什么 L1 会产生稀疏性而 L2 不会：想象 2D 权重空间中的约束区域。L1 是菱形，L2 是圆形。Loss Function 的等高线（椭圆）最可能在角上接触菱形，而那里某个权重为零。它们会在一个平滑点接触圆形，而那里两个权重都非零。

### Nearest Neighbor Search

每个距离函数都隐含一个 nearest neighbor search 问题：给定一个 query point，在数据集中找到最接近的点。

Exact nearest neighbor search 在包含 n 个点、d 个维度的数据集中，每次查询的复杂度是 O(n * d)。对于大型数据集来说，这太慢了。

Approximate Nearest Neighbor（ANN）算法用少量准确率换取巨大的速度提升：

```
Algorithm         Approach                      Used by
KD-trees          Axis-aligned space partition   scikit-learn (low-dim)
Ball trees        Nested hyperspheres            scikit-learn (medium-dim)
LSH               Random hash projections        Near-duplicate detection
HNSW              Hierarchical navigable         FAISS, Qdrant, Weaviate
                  small-world graph
IVF               Inverted file index with       FAISS (billion-scale)
                  cluster-based search
Product quant.    Compress vectors, search       FAISS (memory-constrained)
                  in compressed space
```

HNSW（Hierarchical Navigable Small World）是现代 vector databases 中占主导的算法。它构建一个多层图，每个节点连接到它的近似 nearest neighbors。搜索从顶层开始（稀疏、长跳跃），然后下降到底层（密集、短跳跃）。


```figure
norm-unit-balls
```

## 构建它

### 步骤 1：所有范数和距离函数

完整实现见 `code/distances.py`。每个函数都从零构建，只使用基础 Python 数学。

### 步骤 2：同一数据，不同距离，不同邻居

`distances.py` 中的 demo 会创建一个数据集，选择一个 query point，并展示 nearest neighbor 如何随距离度量变化而变化。在 L1 下“最近”的点，在 L2 或 cosine 下可能并不是最近的。

### 步骤 3：Embedding similarity search

代码包含一个 mock embedding similarity search，使用 cosine similarity 与 L2 distance 查找与 query 最相似的“documents”，展示排名可能不同。

## 使用它

最常见的实际用途：在 vector database 中查找相似项。

```python
import numpy as np

def cosine_similarity_matrix(X):
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    X_normalized = X / norms
    return X_normalized @ X_normalized.T

embeddings = np.random.randn(1000, 768)

sim_matrix = cosine_similarity_matrix(embeddings)

query_idx = 0
similarities = sim_matrix[query_idx]
top_k = np.argsort(similarities)[::-1][1:6]
print(f"Top 5 most similar to item 0: {top_k}")
print(f"Similarities: {similarities[top_k]}")
```

当你调用 `model.encode(text)` 然后搜索 vector database 时，底层发生的就是这件事。Embedding model 会把文本映射为 Vectors。Vector database 会计算你的 query vector 和每个已存储 Vector 之间的 cosine similarity（或 dot product），并使用 ANN 算法避免逐一检查全部 Vectors。

## 练习

1. 计算 (1, 2, 3) 和 (4, 0, 6) 之间的 L1、L2 和 L-infinity distances。验证对于任意一对点，总有 L-inf <= L2 <= L1。证明为什么这个顺序一定成立。

2. 创建两个 Vectors，使 cosine similarity 很高（> 0.9），但 L2 distance 很大（> 10）。从几何角度解释发生了什么。然后创建两个 Vectors，使 cosine similarity 很低（< 0.3），但 L2 distance 很小（< 0.5）。

3. 实现一个函数，接收一个数据集和一个 query point，并分别返回 L1、L2、cosine 和 Mahalanobis distance 下的 nearest neighbor。找一个数据集，使四种距离对哪个点最近全部意见不一致。

4. 使用 CDF 方法手动计算 [0.5, 0.5, 0, 0] 和 [0, 0, 0.5, 0.5] 之间的 Wasserstein distance。然后计算 [0.25, 0.25, 0.25, 0.25] 和 [0, 0, 0.5, 0.5] 之间的距离。哪个更大，为什么？

5. 为近似 Jaccard similarity 实现 MinHash。生成 100 个随机集合，计算所有 pair 的精确 Jaccard，并用 50、100、200 个 hash functions 的 MinHash 近似进行比较。绘制近似误差。

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Norm | “Vector 的大小” | 一个把 Vector 映射到非负标量的函数，满足三角不等式、绝对齐次性，并且只有零 Vector 的值为零 |
| L1 norm | “Manhattan distance” | 分量绝对值之和。在优化中产生稀疏性。对 outliers 稳健 |
| L2 norm | “Euclidean distance” | 平方分量之和的平方根。Euclidean space 中的直线距离 |
| Lp norm | “Generalized norm” | 分量绝对值 p 次方之和的 p 次根。L1 和 L2 是特殊情况 |
| L-infinity norm | “Max norm” 或 “Chebyshev distance” | 最大绝对分量值。当 p 趋近无穷大时 Lp 的极限 |
| Cosine similarity | “Vectors 之间的角度” | 按两个大小归一化的 dot product。范围从 -1 到 +1。忽略 Vector 长度 |
| Cosine distance | “1 minus cosine similarity” | 将 cosine similarity 转换为距离。范围从 0 到 2 |
| Dot product | “Unnormalized cosine” | 按分量相乘后求和。等于 cosine similarity 乘以两个大小 |
| Mahalanobis distance | “Correlation-aware distance” | 在使用数据 covariance matrix 进行 whitened（去相关和归一化）后的空间中的 L2 distance |
| Jaccard similarity | “Set overlap” | 交集大小除以并集大小。用于集合，而不是 Vectors |
| Edit distance | “Levenshtein distance” | 将一个字符串转换为另一个字符串所需的最少插入、删除和替换次数 |
| KL divergence | “Distance between distributions” | 不是真正的距离（不对称）。衡量使用 Q 编码 P 时产生的额外 bits |
| Wasserstein distance | “Earth mover's distance” | 将质量从一个分布运输到另一个分布所需的最小 work。真正的 metric |
| Approximate nearest neighbor | “ANN search” | 比精确搜索快得多地找到近似最近点的算法（HNSW、LSH、IVF） |
| HNSW | “The vector DB algorithm” | Hierarchical Navigable Small World graph。用于快速 approximate nearest neighbor search 的多层图 |
| L1 regularization | “Lasso” | 将权重的 L1 norm 加入 Loss。把权重推向零（稀疏性） |
| L2 regularization | “Ridge” 或 “weight decay” | 将权重的平方 L2 norm 加入 Loss。将权重向零收缩，但不产生稀疏性 |
| Elastic Net | “L1 + L2” | 结合 L1 和 L2 regularization。比任意单独一种方法都更好地处理相关特征组 |

## 延伸阅读

- [FAISS: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss) - Meta 用于十亿规模 ANN search 的库
- [Wasserstein GAN (Arjovsky et al., 2017)](https://arxiv.org/abs/1701.07875) - 将 Earth Mover's distance 引入 GANs 的论文
- [Locality-Sensitive Hashing (Indyk & Motwani, 1998)](https://dl.acm.org/doi/10.1145/276698.276876) - 基础 ANN 算法
- [Efficient Estimation of Word Representations (Mikolov et al., 2013)](https://arxiv.org/abs/1301.3781) - Word2Vec，cosine similarity 在 embeddings 中成为默认选择的地方
- [sklearn.neighbors documentation](https://scikit-learn.org/stable/modules/neighbors.html) - scikit-learn 中距离度量和邻居算法的实用指南
