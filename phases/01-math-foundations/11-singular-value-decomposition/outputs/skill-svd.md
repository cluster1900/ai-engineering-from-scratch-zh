---
name: skill-svd
description: 将 SVD 应用于实际问题，包括压缩、去噪、推荐和 least-squares 求解
phase: 1
lesson: 11
---

你是将 Singular Value Decomposition 应用于实际工程问题的专家。面对涉及 Matrix、数据压缩、噪声、缺失数据或线性系统的任务时，判断 SVD 是否是合适的工具，以及如何应用它。

## 决策框架

### 步骤 1： 识别问题类型

- **数据压缩 / dimensionality reduction**：使用 truncated SVD。保留前 k 个 singular value。通过 energy threshold（95% 是常见目标）或下游任务表现来选择 k。
- **噪声降低**：计算 full SVD。寻找 singular value spectrum 中的 gap。截断 gap 以下的部分。这个 gap 将信号与噪声分开。
- **缺失数据 / 推荐**：填充缺失 entry（row mean 或 zero），计算 SVD，并用 low rank 重建。在 production 中，使用能够原生处理缺失数据的 ALS 或 incremental SVD。
- **Least-squares / pseudoinverse**：计算 SVD。对非零 singular value 求逆。将 V Sigma+ U^T 与 target vector 相乘。比 normal equations 更稳定。
- **文本相似度 / topic modeling**：构建 term-document matrix。应用 SVD（这就是 LSA/LSI）。将 document 和 term 投影到 low-rank space。使用 cosine similarity 进行比较。
- **Numerical rank determination**：计算 SVD。统计高于 threshold（相对于最大 singular value）的 singular value 数量。这比 row reduction 更可靠。
- **Matrix norm computation**：Spectral norm = 最大 singular value。Frobenius norm = sqrt(squared singular value 之和)。Nuclear norm = singular value 之和。
- **Condition number**：sigma_max / sigma_min。它告诉你系统对扰动有多敏感。

### 步骤 2： 选择正确变体

| Situation | Method | Why |
|-----------|--------|-----|
| Dense matrix，需要 full decomposition | `np.linalg.svd(A)` / Julia 中的 `svd(A)` | 标准算法，数值稳定 |
| 只需要前 k 个 component | `scipy.sparse.linalg.svds(A, k)` | 当 k 较小时，比 full SVD 更快 |
| Sparse matrix | `scipy.sparse.linalg.svds` | 高效处理 sparse storage |
| Streaming data | Incremental SVD / online SVD | 无需从头重新计算即可更新 decomposition |
| 缺失数据（推荐） | ALS, Funk SVD, or NMF | 标准 SVD 要求完整 Matrix |
| 超大 Matrix（数百万行） | Randomized SVD (`sklearn.utils.extmath.randomized_svd`) | O(mn log k)，而不是 O(mn min(m,n)) |
| 对 centered data 做 PCA | centered data matrix 的 SVD | 等价于 covariance 的 eigendecomposition，但更稳定 |

### 步骤 3： 选择 rank k

- **Energy threshold**：计算 cumulative energy = sum(sigma_1^2 ... sigma_k^2) / sum(all sigma^2)。当 energy 超过 0.95（或在高保真任务中超过 0.99）时停止。
- **Gap detection**：绘制 singular value。寻找急剧下降。这个 gap 表明信号和噪声之间的边界。
- **Cross-validation**：对于下游任务，遍历 k，并在 held-out data 上测量表现。
- **Elbow method**：绘制 reconstruction error vs k。Elbow 是继续添加 component 不再有明显帮助的位置。
- **Domain knowledge**：如果你知道数据有 d 个 underlying factor，使用 k = d。

### 步骤 4： 验证结果

- **Reconstruction error**：计算 ||A - A_k|| / ||A||。如果截断有意义，它应该较小。
- **Explained variance**：对于 PCA/压缩，报告捕获的总方差（energy）比例。
- **Downstream task performance**：如果 SVD 是 preprocessing step，测量 end-to-end metric。
- **Visual inspection**：对于图像，直观比较原图和重建图。对于推荐，将预测与已知 rating 对比。

## 常见错误

- 通过 A^T A 的 eigendecomposition 计算 SVD。这会平方 condition number，并损失数值精度。使用专门的 SVD routine。
- 只需要前 k 个 component 时却使用 full SVD。对于大型 Matrix，使用 truncated 或 randomized SVD。
- 直接将 SVD 应用于带有缺失 entry 的 Matrix。标准 SVD 要求完整 Matrix。改用 matrix completion 方法（ALS, Funk SVD）。
- 忽略 centering。对于 PCA，数据必须在 SVD 前 centered（减去 mean）。没有 centering 时，第一个 component 捕获的是 mean，而不是 variance。
- 过度截断。如果保留的 singular value 太少，会丢失信号。如果保留太多，会保留噪声。使用 energy threshold 或 cross-validation。
- 混淆 SVD 和 eigendecomposition。SVD 适用于任何 Matrix（任何形状、任何 rank）。Eigendecomposition 要求 square matrix 且具有完整 eigenvector 集。对于 symmetric positive semi-definite matrix，二者相同。

## 代码模式

### 快速压缩
```python
U, S, Vt = np.linalg.svd(A, full_matrices=False)
k = np.searchsorted(np.cumsum(S**2) / np.sum(S**2), 0.95) + 1
A_compressed = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]
```

### 用于 least squares 的 pseudoinverse
```python
U, S, Vt = np.linalg.svd(A, full_matrices=False)
S_inv = np.array([1/s if s > 1e-10 else 0 for s in S])
x = Vt.T @ np.diag(S_inv) @ U.T @ b
```

### 去噪
```python
U, S, Vt = np.linalg.svd(noisy_data, full_matrices=False)
k = find_gap(S)
clean_data = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]
```

### Large-scale PCA
```python
from sklearn.utils.extmath import randomized_svd
U, S, Vt = randomized_svd(X_centered, n_components=50, random_state=42)
explained_variance = S**2 / (n_samples - 1)
```

## 什么时候不要使用 SVD

- Matrix 非常 sparse，而你只需要少量 component。直接使用 sparse eigensolver。
- 你需要 non-negative factor（topic modeling, spectral unmixing）。改用 NMF。
- 数据有很强的非线性结构，线性方法无法捕获。使用 autoencoder 或 manifold learning。
- 你需要对 streaming data 进行 real-time update，并且 Matrix 持续变化。使用 incremental/online SVD 或近似方法。
- Matrix 能放入内存，但大到连 randomized SVD 都太慢。考虑 sketching method 或 sampling-based approach。

## 计算成本

| Method | Time | Space |
|--------|------|-------|
| m x n Matrix 的 Full SVD | O(mn min(m,n)) | O(mn) |
| Truncated SVD（top k） | O(mnk) | O((m+n)k) |
| Randomized SVD（top k） | O(mn log k) | O((m+n)k) |
| Power iteration（1 vector） | O(mn * iters) | O(m+n) |

对于一个 10000 x 5000 Matrix：
- Full SVD：约 2500 亿次 operation
- Truncated SVD（k=50）：约 25 亿次 operation
- Randomized SVD（k=50）：约 5 亿次 operation

选择与你的规模和准确性要求相匹配的方法。
