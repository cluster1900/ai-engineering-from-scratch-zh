# 范数和距离

> 你的距离函数定义了什么叫相似的──选错了,下游的一切都会出问题──

**Type:** Build
**Language:**字符串
**前置要求：**阶段1课程01 (线性代数直观),02 (向量,矩阵和运算)
**Time:** ~90 分钟

## 学习目标

- 从零实现 L1、L2、cosine、Mahalanobis、Jaccard 和编辑距离函数
- 为确定ML任务选择合适的距离度,并解释为什么其他选择会失败
- 将L1和L2范数与LASSO、Ridge正规化及其几何束区联系起来
- 显示相同的数据集在不同度量下产生不同的近邻

## 问题

你有两个向量.它们可能是词嵌入式.也可能是用户图像.也可能是像素数组.你需要知道:它们有多接近?

答案完全取决于你选择哪个距离函数――两个数据点在一个度量下可能是最接近的邻居,在另一度量下却是很远的距离――你的KN分类器、推引擎、向量数据库、集群算法、损失函数都取决于这个选择――选择错误,你的模型就会优化错误的目标――

没有通用最佳距离――L2 适合空间数据――近亲相似性 在NLP中占主导地位――杰卡德 处理集合――编辑距离 处理字符串――马哈拉诺比会考虑相关性――华斯斯坦会移动概率质量――每种都编码了关于相似含义的不同假设――

本课程将从零构建每个主要距离函数,说明何时使用哪种,并展示相同数据如何因使用不同度量而产生完全不同的近邻.

## 概念

### 标准:测量向量 大小

范数衡量一个向量的大小──两个向量之间的每个距离函数都可以写成它们的差值范数:d,a,b = 时的距离.

### 标准的曼哈顿距离)

对于所有分数的绝对值求和的L1标准

```
||x||_1 = |x_1| + |x_2| + ... + |x_n|
```

它被称为曼哈顿距离,因为它衡量你在城市网格中走的距离,在那里你只能沿坐标轴移动,不能走对角线.

```
Point A = (1, 1)
Point B = (4, 5)

L1 distance = |4-1| + |5-1| = 3 + 4 = 7

On a grid, you walk 3 blocks east and 4 blocks north.
```

何时使用 L1:
- 高维稀疏数据 ((文本特征,一个热的编码)
- 当你希望对异常更稳健时 (单个巨大的差异不会主导结果)
- 特征选择问题 (L1规范化 会促进稀疏性)

与L1规律化asso的联系: 中会加入你的损失函数1,将你的权重的惩罚处罚绝对值之和和. 这将把较小权重推向精确的零,从而执行自动特征选择.

与损失函数的联系:平均绝对错误 (MAE) 是预测值和目标值之间的 L1 距离的平均值.

### L2 标准 (圆距离)

L2规范是直线距离. 它等于平方分量和平方根.

```
||x||_2 = sqrt(x_1^2 + x_2^2 + ... + x_n^2)
```

这就是你在几何课上学到的距离.

```
Point A = (1, 1)
Point B = (4, 5)

L2 distance = sqrt((4-1)^2 + (5-1)^2) = sqrt(9 + 16) = sqrt(25) = 5.0

The straight line, cutting diagonally through the grid.
```

何时使用 L2:
- 低到中等维度的连续数据
- 标志性尺度可比较时
- 物理距离 (空间数据、传感器读数)
- 像素级图像相似度

与L2规律化 (Ridge) 联系:在你的损失函数中加入你的损失函数2^2,将惩罚较大的权重.与L1不同,它不会推重到零. 它将按比例把所有权重向零缩小.

与损失函数的联系:平均平方错误 (MSE) 是 L2 距离的平方的平均值.

```
MAE (L1 loss):  |y - y_hat|         Linear penalty. Robust to outliers.
MSE (L2 loss):  (y - y_hat)^2       Quadratic penalty. Sensitive to outliers.
```

### 标准:通用族

L1 和 L2 是 Lp 规范的特殊情况:

```
||x||_p = (|x_1|^p + |x_2|^p + ... + |x_n|^p)^(1/p)
```

不同的 p 值会产生不同形状的单元球 ((距离原点为 1 的所有点的集合):

```
p=1:    Diamond shape      (corners on axes)
p=2:    Circle/sphere      (the usual round ball)
p=3:    Superellipse       (rounded square)
p=inf:  Square/hypercube   (flat sides along axes)
```

### 无限度标准 (Chebyshev距离)

当p 趋近无穷大时,Lp 标准收到最大绝对分量.

```
||x||_inf = max(|x_1|, |x_2|, ..., |x_n|)
```

两个点之间的距离由它们最大的差异决定的维度决定.

```
Point A = (1, 1)
Point B = (4, 5)

L-inf distance = max(|4-1|, |5-1|) = max(3, 4) = 4
```

何时使用L-无限性:
- 当一个单独的情况差距很重要时
- 游戏棋盘(国际象棋中的国王按L无限 移动:任意方向走一步的代价都是1)
- 制造公差 (每个维度都必须在规格范围内)

### 子相似性和子距离

测量两个向量之间的角度,忽略它们的大小.

```
cos_sim(a, b) = (a . b) / (||a||_2 * ||b||_2)
```

它的范围是 -1 ((方向相反) 到 +1 ((方向相同) △垂直向量的共数相似性为 0。

距离将其转换为距离:cosine_distance = 1 - cosine_similarity──范围是 0(方向相同) 到 2 ((方向相反)──

```
a = (1, 0)    b = (1, 1)

cos_sim = (1*1 + 0*1) / (1 * sqrt(2)) = 1/sqrt(2) = 0.707
cos_dist = 1 - 0.707 = 0.293
```

为什么在NLP和嵌入中占主导地位:在文本中,文档长度不应影响相似性――一篇关于猫的文档甚至比另一篇关于猫的文档长度两倍,也仍然应该是相似的――

何时使用共数相似性:
- 文本相似度(TF-IDF向量、字符嵌入式、句子嵌入式)
- 任何大小都是噪音,方向都是信号的领域
- 推系统(用户偏好向量)
- 嵌入向量数据库几乎总是使用kosine或点产量)

### 点产品相似性与可西因相似性

两个向量的点数是:

```
a . b = a_1*b_1 + a_2*b_2 + ... + a_n*b_n
      = ||a|| * ||b|| * cos(angle)
```

太空相似性是按两个大小归化后的点产量.

```
If ||a|| = 1 and ||b|| = 1:
    a . b = cos(angle between a and b)
```

它们不同情况:点产品包含大小信息. 大小更大的向量会得到更高的点产品 分数. 在一些检索系统中,如果你希望热门物品排名更高,这一点很重要.

```
a = (3, 0)    b = (1, 0)    c = (0, 1)

dot(a, b) = 3     dot(a, c) = 0
cos(a, b) = 1.0   cos(a, c) = 0.0

Both agree on direction, but dot product also reflects magnitude.
```

实践中:
- 当你想要纯方向相似度时,使用宇宙相似性
- 当大小携带有意义信息时,使用点产品
- 许多向量数据库 (Pinecone、Weaviate、Qdrant) 允许你在二者之间选择
- 如果你的嵌入式已经正常化,那么选择哪个都无所谓

### 马哈拉诺比斯距离

尤克利德的距离等于所有维度.但是如果你的特征相关,或者尺度不同,L2会给出误导性结果.

马哈拉诺比距离会考虑数据的变量结构.

```
d_M(x, y) = sqrt((x - y)^T * S^(-1) * (x - y))
```

其中,S是数据的变量矩阵.

直观理解:Mahalanobis距离会先对数据进行相关并归化(白化),然后在变换后的空间中计算 L2距离──如果 S 是身份矩阵(不相关、单位差特征),Mahalanobis距离就会归化为尤克利德距离──

```
Example: height and weight are correlated.
Someone 6'2" and 180 lbs is not unusual.
Someone 5'0" and 180 lbs is unusual.

Euclidean distance might say they are equally far from the mean.
Mahalanobis distance correctly identifies the second as an outlier
because it accounts for the height-weight correlation.
```

何时使用马哈拉诺比斯距离:
- 异常检测 (与平均值 马哈拉诺比距离 较大的点是异常)
- 类别的特征尺度不同且存在相关性
- 当你有足够的数据来估计可靠的变量矩阵时
- 制造质量控制 (多变量过程监控)

### 卡德类似性 (用于集合)

杰卡德的相似性 衡量两个集合之间的重叠程度.

```
J(A, B) = |A intersect B| / |A union B|
```

它的范围是0 (没有重叠) 到1 (集合相同) △杰卡德距离 =1 - 杰卡德相似性。

```
A = {cat, dog, fish}
B = {cat, bird, fish, snake}

Intersection = {cat, fish}         size = 2
Union = {cat, dog, fish, bird, snake}  size = 5

Jaccard similarity = 2/5 = 0.4
Jaccard distance = 0.6
```

何时使用 Jaccard:
- 比较标签类或特征集合
- 基于词是否出现的文档相似度 (而不是频率)
- 近重复检测(杰卡德的MinnHash近似)
- 比较二值特征向量 (存在/不存在数据)
- 评估分割模型 (卡德)

### 修改距离 (Levenshtein距离)

编辑距离 计算把一个字符串转换为另一个字符串所需的最小单字符操作数――操作包括:插入、删除或替换――

```
"kitten" -> "sitting"

kitten -> sitten  (substitute k -> s)
sitten -> sittin  (substitute e -> i)
sittin -> sitting (insert g)

Edit distance = 3
```

使用动态规划计算──填充一个矩阵,其中条目 (i, j) 是字符串 A 的前i 个字符和字符串 B 的前i 个字符之间的编辑距离──

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

何时使用编辑距离:
- 拼写检查和纠正
-  DNA 序列配列 (带加权操作)
- 模糊字符串匹配
- 脏文本数据去重

### KL差距(不是距离,但常被当作距离使用)

基因差异测量一个概率分布与另一个概率分布的差异. 本内容在第09课中讲述,但它属于这一讨论,因为人们经常把它视为距离,尽管它不是距离.

```
D_KL(P || Q) = sum(p(x) * log(p(x) / q(x)))
```

关键性质:KL分歧 不是对称的.

```
D_KL(P || Q) != D_KL(Q || P)
```

这意味着它不满足距离量的基本要求.

:Q 试图覆盖P的所有模式.
逆 KL(D_KL(Q  P)) 是模式寻找:Q 专注于P的单个模式──

你会看到这些地方的KL分歧:
-                                                                                                                                                                                                                                                   
- 知识蒸 (学生 试图匹配老师的分布)
- 改模型 保持接近基模型)
- 政策梯度方法 (约束政策更新)

### 瓦斯斯坦距离 (Earth Mover's Distance)

瓦斯斯特恩距离 测量把一个概率分布转换为另一个概率分布所需的最小工作──可以这样理解:如果一个分布是土堆,另一个是坑,你需要移动多少土,移动多远?

```
W(P, Q) = inf over all transport plans gamma of E[d(x, y)]
```

对于1D分布,它将简化为累计分布函数绝对差的积分:

```
W_1(P, Q) = integral |CDF_P(x) - CDF_Q(x)| dx
```

为什么瓦斯斯特林重要:
- 它是真正的指标 (对称,满足三角不等等式)
- 即使分布不重叠,它也能提供梯度.
- 这种性质使它成为瓦斯斯坦GAN的核心,后者解决了原始GAN的训练不稳定的问题

```
Distributions with no overlap:

P: [1, 0, 0, 0, 0]    Q: [0, 0, 0, 0, 1]

KL divergence: infinity (log of zero)
Wasserstein: 4 (move all mass 4 bins)

Wasserstein gives a meaningful gradient. KL does not.
```

何时使用Wasserstein:
- 培训 (GAN)
- 比较可能不重叠的分布
- 优质交通问题
- 图像检索(比较颜色直方图)

### 为什么不同任务需要不同的距离

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

### 与损失功能的联系

损失函数是应用于预测值和目标值之间的距离函数.

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

### 与正规化联系

加入重量范数惩罚.

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

为什么L1会产生稀疏性而L2不会:想象2D权重空间中的约束区域――L1是形,L2是圆形――等高线的损失函数 (圆) 最可能在角上接触形,而那里有一点权重为零――它们会在平平点接触圆形,而那里两个权重都非零――

### 寻找最接近的邻居

问题:给定一个查询点,在数据集中找到最接近的点.

查询的复杂性是O (n * d) ,对于大型数据集来说,这太慢了.

接近近邻的算法用少量准确率换取巨大的速度提升:

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

现代导向数据库中占主导地位的算法. 它构建一个多层图,每个节点连接到其近似的邻居.


```figure
norm-unit-balls
```

## 构建它

### 步骤1:所有范数和距离函数

完整实现见`code/distances.py`△每个函数都是从零构建,只使用基础 Python 数学.

### 步骤2:相同的数据,不同距离,不同邻居

`distances.py`中的演示会创建一个数据集,选择一个查询点,并展示最近的邻居如何随距离变量变化和变化.

### 步骤3:嵌入式类似性搜索

代码包含一个模拟嵌入式相似性搜索,使用共数相似性与L2距离 查找与查询 最相似的文档,展示排名可能不同──

## 使用它

最常见的实际用途:在向量数据库中查找相似项.

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

当你调用`model.encode(text)`然后搜索向量数据库,底层发生的就是这件事情.嵌入模型会把文本映射为向量.

## 练习

1. 计算 (1, 2, 3) 和 (4, 0, 6) 之间的 L1、L2 和 L-无限距离――验证对任意一对点,总有 L-inf <= L2 <= L1――证明为什么这个顺序一定成立――

2. 创建两个向量,使宇宙相似性很高 ((<0.9),但L2距离很大 ((<0.5) 』.

3. 实现一个函数,接收一个数据集和一个查询点,并分别返回 L1、L2、科西因和马哈拉诺比距离下下的最近邻居――找到一个数据集,使四种距离对哪个点最近的全部意见不一致――

4. 使用CDF 方法手动计算 [0.5,0.5,0,0] 和 [0,0,0,0.5,0.5] 之间的Wasserstein距离──然后计算 [0.25,0.25,0.25,0.25] 和 [0,0,0,0.5,0.5] 之间的距离──哪个更大,为什么?

5. 为近似Jaccard相似性 实现 MinHash──生成100个随机集合,计算所有对的精确Jaccard,并使用50、100、200个哈希函数的 MinHash 近似进行比较──绘制近似误差──

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

- [FAISS: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss)-  Meta 用于数亿美元规模的 ANN 搜索库
- [Wasserstein GAN (Arjovsky et al., 2017)](https://arxiv.org/abs/1701.07875)- 将地球移动器的距离引入GAN的论文
- [Locality-Sensitive Hashing (Indyk & Motwani, 1998)](https://dl.acm.org/doi/10.1145/276698.276876)- 基础 ANN 算法
- [Efficient Estimation of Word Representations (Mikolov et al., 2013)](https://arxiv.org/abs/1301.3781)置中成为默认选择的地方
- [sklearn.neighbors documentation](https://scikit-learn.org/stable/modules/neighbors.html)- 微小学习 中距离测量和邻居算法的实用指南
