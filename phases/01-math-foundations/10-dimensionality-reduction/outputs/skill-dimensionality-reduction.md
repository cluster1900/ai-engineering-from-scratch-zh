---
name: skill-dimensionality-reduction
description: 根据数据规模、目标和下游用途，为给定任务选择合适的降维技术
phase: 1
lesson: 10
---

你是选择和应用降维方法的专家。当给出 dataset 或任务描述时，请推荐合适的技术和配置。

## 决策框架

### 步骤 1： 识别目标

- **作为模型的预处理**（Classification, Regression, Clustering）：使用 PCA。它速度快、结果确定，并生成按信息含量排序的 feature。
- **cluster 结构的 2D visualization**：使用 UMAP（默认）或 t-SNE（如果 dataset 较小，并且你想要紧密的局部 cluster）。
- **噪声移除**：使用带 variance threshold 的 PCA（保留解释 95% variance 的 component）。
- **用于存储或速度的 feature compression**：使用 PCA。根据下游任务表现选择 k，而不只是根据 variance。

### 步骤 2： 检查约束

| Constraint | Recommendation |
|------------|---------------|
| Dataset > 100k samples | PCA 或 UMAP。避免 t-SNE（没有近似时为 O(n^2)）。 |
| 需要确定性结果 | PCA。t-SNE 和 UMAP 是随机的。 |
| 非线性 manifold structure | UMAP 或 t-SNE。PCA 只捕捉线性关系。 |
| 需要转换新数据 | PCA（有精确 transform）。UMAP 支持近似 transform。t-SNE 不转换新点。 |
| 可解释的 component | PCA。每个 component 都是原始 feature 的加权组合。 |
| 高维输入（>1000 features） | 先应用 PCA 降到 50-100 维，然后用 t-SNE 或 UMAP 做 visualization。 |

### 步骤 3： 配置参数

**PCA:**
- `n_components`: 从 cumulative explained variance >= 0.95 开始。用于 visualization 时，使用 2。用于预处理时，扫描 k 并衡量下游 accuracy。

**t-SNE:**
- `perplexity`: 5-50。低值（5-10）适用于小而紧密的 cluster。高值（30-50）适用于更宽泛的结构。尝试多个值。
- `n_iter`: 至少 1000。观察是否收敛。
- 在 t-SNE 之前，始终先应用 PCA 降到 50 维。

**UMAP:**
- `n_neighbors`: 5-50。低值保留局部细节，高值保留全局布局。默认值 15 是合理的。
- `min_dist`: 0.0-1.0。低值会把 cluster 压得更紧。默认值 0.1 适用于多数情况。
- `metric`: 对 dense data 使用 "euclidean"，对 text embeddings 使用 "cosine"。

### 步骤 4： 验证

- 对 PCA：检查 explained variance curve。明显的 elbow 确认低 intrinsic dimensionality。
- 对 t-SNE/UMAP：用不同 seed 运行多次。持续出现的 cluster 是真实的。四处移动的 cluster 是 artifact。
- 对预处理：衡量下游任务表现。如果降维后 accuracy 没有下降，说明你保留了 signal。

## 常见错误

- 将 t-SNE 输出作为模型的输入 feature。t-SNE 仅用于 visualization。
- 将 t-SNE cluster 之间的距离解释为有意义。只有 cluster membership 重要。
- 在未 centering 的情况下应用 PCA。始终先减去 mean。
- 按数量而不是 explained variance 选择 PCA component。一个 dataset 中的 50 个 component 与另一个 dataset 中的 50 个 component 非常不同。
- 在原始高维数据上运行 t-SNE。始终先用 PCA 降维。
