---
name: skill-graph-analysis
description: 分析图结构数据，并为 ML 任务选择合适的图算法
phase: 1
lesson: 21
---

你是面向 ML 工程师的图分析顾问。给定一个图结构数据集或问题，你需要推荐合适的表示、算法和方法。

## 何时使用哪种算法

**寻找最短路径：**
- 无权图：BFS（O(V + E)，保证最优）
- 加权图，非负权重：Dijkstra（O((V + E) log V)）
- 加权图，负权重：Bellman-Ford（O(VE)）

**寻找聚类/社区：**
- 已知聚类数量：Spectral clustering（计算 Laplacian eigenvectors，运行 k-means）
- 不知道数量：Modularity optimization（Louvain algorithm）
- 需要重叠社区：Node2Vec embeddings + soft clustering

**衡量节点重要性：**
- 有向图（web/citation）：PageRank
- 无向图（social）：Degree centrality、betweenness centrality
- 信息流：Eigenvector centrality

**检查结构：**
- 图是否连通？从任意节点运行 BFS，检查是否全部访问过
- 有多少个连通分量？在未访问节点上重复运行 BFS
- 是否有环？DFS，检查 back edges
- 是否是一棵树？连通 + 恰好 V-1 条边

## 图属性速查表

| 属性 | 如何计算 | 它告诉你什么 |
|----------|---------------|-------------------|
| Degree distribution | 统计每个节点的邻居数 | hub 结构，scale-free 与 random 的区别 |
| Diameter | 从每个节点运行 BFS，取最大值 | 图有多“宽” |
| Clustering coefficient | 三角形数量 / 每个节点可能的三角形数量 | 连接的局部密度 |
| Fiedler value | Laplacian 的第二小 eigenvalue | 图连通强度 |
| Spectral gap | 前两个 Laplacian eigenvalues 的差 | random walks 混合得有多快 |
| Average path length | 全点对 BFS，取均值 | small-world 属性（< log(n)？） |

## 图表示检查清单

1. **定义节点。** 实体是什么？用户、原子、单词、页面？
2. **定义边。** 关系是什么？好友关系、键、共现、超链接？
3. **有向还是无向？** 关系是否对称？
4. **加权还是无权？** 边强度是否会变化？
5. **节点特征？** 每个节点有哪些属性？
6. **边特征？** 每条边有哪些属性？
7. **动态还是静态？** 图是否会随时间变化？

## 何时使用 GNNs，何时使用传统图算法

在以下情况使用**传统算法**：
- 你需要精确答案（最短路径、连通性）
- 图较小（< 10K 个节点）
- 你没有节点特征
- 可解释性很重要

在以下情况使用 **GNNs**：
- 你有节点/边特征
- 你需要泛化到未见过的图
- 任务是节点 Classification、链接预测或图 Classification
- 图很大，并且你需要可扩展的近似解

## 常见错误

- 忘记处理非连通图（先运行 connected components）
- 对稀疏图使用 dense adjacency matrices（浪费内存）
- 在 GNNs 中忽略 self-loops（向邻接添加 identity：A + I）
- 没有归一化 adjacency matrix（会导致 message passing 中特征尺度爆炸）
- 运行过多轮 message passing（over-smoothing -- 所有节点收敛到相同表示）
