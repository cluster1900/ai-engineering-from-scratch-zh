---
id: linear-algebra
title: Linear Algebra for ML
code: LA
subtitle: 向量、变换、特征值、SVD 与 Ax = b 求解器。课程中从零实现的 Python 与 NumPy。
hue: 230
sources: phases/01-math-foundations/01-linear-algebra-intuition, phases/01-math-foundations/02-vectors-matrices-operations, phases/01-math-foundations/03-matrix-transformations, phases/01-math-foundations/11-singular-value-decomposition, phases/01-math-foundations/17-linear-systems
source_hash: d0fc32de779910f0
---

## SVD：旋转、缩放、旋转
type: architecture
from: phases/01-math-foundations/11-singular-value-decomposition/docs/en.md

```arch
node | x | 1,1 | Input space | n-dim
node | vt | 2,1 | V^T | rotate
node | sig | 3,1 | Sigma | scale by sigma_i
node | u | 4,1 | U | rotate
node | ata | 2,2 | A^T A | eigenvectors are V
node | aat | 3,2 | A A^T | eigenvectors are U
node | y | 4,2 | Output space | m-dim
edge | x | vt |
edge | vt | sig |
edge | sig | u |
edge | u | y |
edge | ata | vt | V
edge | aat | u | U
```

## 带部分主元的高斯消元
type: flow
from: phases/01-math-foundations/17-linear-systems/docs/en.md, phases/01-math-foundations/17-linear-systems/code/linear_systems.py

1. **选主元**：在第 k 列中，找出第 k 行及以下绝对值最大的元素。
2. **交换**：把该行与第 k 行交换。小的主元会放大舍入误差。
3. **检查**：主元低于 `1e-12` 时抛出 `ValueError`。
4. **消元**：对 k 以下的每一行 i，计算 m = A[i][k] / A[k][k]，减去 m 倍的第 k 行。
5. **回代**：先解最后一个方程，再逐行向上。
6. **复用**：L 保存乘数，U 是消元后的矩阵。PA = LU。

## NumPy 中的任务
type: task-table
from: phases/01-math-foundations/01-linear-algebra-intuition/docs/en.md, phases/01-math-foundations/02-vectors-matrices-operations/docs/en.md, phases/01-math-foundations/03-matrix-transformations/docs/en.md, phases/01-math-foundations/11-singular-value-decomposition/docs/en.md, phases/01-math-foundations/17-linear-systems/docs/en.md

| 任务 | 代码 |
|---|---|
| 点积与长度 | `np.dot(a, b)`, `np.linalg.norm(a)` |
| 矩阵乘法 | `A @ B` |
| 逐元素乘法 | `A * B` |
| 秩 | `np.linalg.matrix_rank(A)` |
| 特征值与特征向量 | `np.linalg.eig(A)` |
| 精简 SVD | `np.linalg.svd(A, full_matrices=False)` |
| 最小二乘 | `np.linalg.lstsq(A, b, rcond=None)[0]` |
| QR，检查 Q | `np.allclose(Q @ Q.T, np.eye(3))` |

## 用 SVD 截断、压缩与求逆
type: annotated-code
lang: python
from: phases/01-math-foundations/11-singular-value-decomposition/docs/en.md, phases/01-math-foundations/11-singular-value-decomposition/code/svd.py

```python
U, S, Vt = np.linalg.svd(A, full_matrices=False)  # S sorted in decreasing order
A_k = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]  # best rank-k approximation
compressed_size = k * (rows + cols + 1)  # storage for rank k
A_pinv = Vt.T @ np.diag(1.0 / S) @ U.T  # pseudoinverse, nonzero S only
x_svd = A_pinv @ b  # least-squares solution
x_pinv = np.linalg.pinv(A) @ b  # same result from NumPy
U, S, V = svd_from_scratch(A)  # power iteration and deflation
A_pinv = pseudoinverse_via_svd(A, tol=1e-10)  # 1/s only for s above tol
```

## 从零求解 Ax = b
type: annotated-code
lang: python
from: phases/01-math-foundations/17-linear-systems/docs/en.md, phases/01-math-foundations/17-linear-systems/code/linear_systems.py

```python
x = gaussian_elimination(A, b)  # partial pivoting, O(n^3)
P, L, U = lu_decompose(A)  # PA = LU, pay O(n^3) one time
x = lu_solve(P, L, U, b)  # O(n^2) for each new b
L = cholesky(A)  # A = L L^T, symmetric positive definite only
x = cholesky_solve(L, b)  # forward, then back substitution
w_ols = least_squares_normal(X, y)  # solves A^T A x = A^T b
w_ridge = ridge_regression(X, y, lam=1.0)  # adds lam * np.eye(n)
x, iters = conjugate_gradient(A, b)  # SPD, at most n iterations
kappa = condition_number(A)  # S[0] / S[-1], inf if singular
```

## 变换矩阵
type: command-table
from: phases/01-math-foundations/03-matrix-transformations/docs/en.md, phases/01-math-foundations/03-matrix-transformations/code/transformations.py

| 命令 | 作用 |
|---|---|
| `rotation_2d(theta)` | [[c, -s], [s, c]]。保持距离。det 1 |
| `scaling_2d(sx, sy)` | [[sx, 0], [0, sy]]。det 为 sx * sy |
| `shearing_2d(kx, ky)` | [[1, kx], [ky, 1]]。矩形变成平行四边形 |
| `reflection_y()` | [[-1, 0], [0, 1]]。翻转方向。det -1 |
| `reflection_x()` | [[1, 0], [0, -1]]。det -1 |
| `mat_mul(S, R)` | 先旋转，再缩放。顺序很重要 |
| `eigenvalues_2x2(matrix)` | 特征方程的根。判别式 < 0 时为复数 |
| `eigenvector_2x2(matrix, eigenvalue)` | 某个特征值对应的单位特征向量 |

## 关键公式
type: concepts
from: phases/01-math-foundations/01-linear-algebra-intuition/docs/en.md, phases/01-math-foundations/02-vectors-matrices-operations/docs/en.md, phases/01-math-foundations/03-matrix-transformations/docs/en.md, phases/01-math-foundations/11-singular-value-decomposition/docs/en.md, phases/01-math-foundations/17-linear-systems/docs/en.md

- **形状**：(m x n) @ (n x p) = (m x p)。内侧维度必须相同。
- **余弦**：$\cos\theta = \frac{a \cdot b}{\lvert a\rvert \lvert b\rvert}$。1 表示同向，0 表示正交。
- **投影**：$\text{proj}_b a = \frac{a \cdot b}{b \cdot b} b$。残差垂直于 $b$。
- **特征**：$Av = \lambda v$。特征值是 $\det(A - \lambda I) = 0$ 的根。
- **2x2 特征值**：$\lambda^2 - (a+d)\lambda + (ad - bc) = 0$。
- **SVD**：$A = U \Sigma V^T$ 且 $A v_i = \sigma_i u_i$。秩是非零 $\sigma_i$ 的个数。
- **正规方程**：$A^T A x = A^T b$。岭回归在 $A^T A$ 上加 $\lambda I$。
- **条件数**：$\kappa = \sigma_{\max} / \sigma_{\min}$。

## 选择求解器
type: command-table
from: phases/01-math-foundations/17-linear-systems/docs/en.md

| 命令 | 作用 |
|---|---|
| 高斯消元 | 方阵、非奇异 A。O(n^3)。只解一次 |
| LU 分解 | 同一个 A 多次求解。每次 O(n^2) |
| QR 分解 | m >= n 的最小二乘。数值稳定 |
| Cholesky | 对称正定 A。比 LU 快一倍 |
| 正规方程 | 超定、n 较小。线性回归 |
| SVD / 伪逆 | 秩亏的 A。最小范数解 |
| 共轭梯度 | 大型稀疏 SPD A。迭代法 |

## 数字与默认值
type: defaults
from: phases/01-math-foundations/01-linear-algebra-intuition/docs/en.md, phases/01-math-foundations/01-linear-algebra-intuition/code/vectors.py, phases/01-math-foundations/11-singular-value-decomposition/docs/en.md, phases/01-math-foundations/11-singular-value-decomposition/code/svd.py, phases/01-math-foundations/17-linear-systems/docs/en.md, phases/01-math-foundations/17-linear-systems/code/linear_systems.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `rank()` 中的零判断 | 1e-10 | 更小的元素视为零 |
| 消元中的主元判断 | 1e-12 | 主元更小时抛出 ValueError |
| `power_iteration` `num_iters` | 200 | 在 `tol=1e-10` 时提前停止 |
| `conjugate_gradient` `tol` | 1e-10 | `max_iter` 默认为 n |
| 安全的条件数 | < 100 | 解是准确的 |
| 对 float64 无意义 | 10^{16} | 矩阵实际上是奇异的 |
| 秩 k=50 的图像 | 14.6% | 占 800 x 600 个值的比例 |
| LoRA 秩 | 16 | 131K 参数，而不是 16M |

## 故障排查
type: troubleshooting
from: phases/01-math-foundations/01-linear-algebra-intuition/docs/en.md, phases/01-math-foundations/02-vectors-matrices-operations/docs/en.md, phases/01-math-foundations/03-matrix-transformations/docs/en.md, phases/01-math-foundations/11-singular-value-decomposition/docs/en.md, phases/01-math-foundations/17-linear-systems/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 形状不匹配错误 | 内侧维度不同 | 相乘前写出每个形状 |
| `inverse_2x2` 抛出 ValueError | 行列式为 0 | 使用伪逆 |
| "Matrix is not positive definite" | A 不是 SPD | 加上 lambda I，或改用 LU |
| 输入稍变权重就大幅摆动 | 特征共线，秩亏 | 删除特征或加正则 |
| 答案丢失有效数字 | kappa 接近 10^k 时丢失 k 位 | 正则化，或使用 QR 或 SVD |
| `np.linalg.eig(A.T @ A)` 不精确 | 它使条件数平方 | 使用 `np.linalg.svd(A)` |
| 复合变换得到错误的点 | B @ A 先作用 A | 按作用顺序的逆序相乘 |
| Gram-Schmidt 的点积不严格为 0 | 浮点误差 | 用 1e-9 之类的容差比较 |

## 问答
type: qa
from: phases/01-math-foundations/03-matrix-transformations/docs/en.md, phases/01-math-foundations/11-singular-value-decomposition/docs/en.md, phases/01-math-foundations/17-linear-systems/docs/en.md

- **为什么用 LU 分解？** O(n^3) 的代价只付一次。每个新的 b 只需 O(n^2)。
- **Cholesky 何时可用？** A 对称正定。$\lambda > 0$ 时 $X^T X + \lambda I$ 是 SPD。
- **行列式说明什么？** 面积缩放比例。0 会压扁一个维度，-1 会翻转方向。
- **为什么截断 SVD 是最佳的秩 k 近似？** Eckart-Young 定理。谱范数误差为 $\sigma_{k+1}$。
- **特征值如何反映稳定性？** 模大于 1 会爆炸，小于 1 会消失。

## 提示
type: tips
from: phases/01-math-foundations/01-linear-algebra-intuition/docs/en.md, phases/01-math-foundations/11-singular-value-decomposition/docs/en.md, phases/01-math-foundations/17-linear-systems/docs/en.md

- PCA 就是对中心化数据做 SVD。主成分是右奇异向量 V。
- 每个主成分的解释方差为 sigma_i^2 / (n-1)。
- 在奇异值中寻找明显的断层。去噪时保留断层以上的值。
- 岭回归把条件数改善为 $(\sigma_{\max} + \lambda) / (\sigma_{\min} + \lambda)$。
- 有多个解时，伪逆给出范数最小的解。
- 正交初始化用 QR 生成正交归一的权重列。
