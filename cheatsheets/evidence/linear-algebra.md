# Evidence: cheatsheets/linear-algebra.md

Abbreviations: P = phases/01-math-foundations. L01 = P/01-linear-algebra-intuition, L02 = P/02-vectors-matrices-operations, L03 = P/03-matrix-transformations, L11 = P/11-singular-value-decomposition, L17 = P/17-linear-systems. d = docs/en.md. L01/v = code/vectors.py, L03/t = code/transformations.py, L11/s = code/svd.py, L17/c = code/linear_systems.py.

## SVD：旋转、缩放、旋转 (architecture, 7 nodes, 6 edges)
- Input space n-dim: L11/d:31, 37
- V^T rotate: L11/d:31, 37
- Sigma scales along each axis, singular values sigma_i: L11/d:32, 54, 74-77
- U rotates: L11/d:33, 38
- Output space m-dim: L11/d:33, 38
- A^T A eigenvectors are V: L11/d:118
- A A^T eigenvectors are U: L11/d:126
- Edges follow the order V^T, Sigma, U: L11/d:24, 41

## 带部分主元的高斯消元 (flow, 6 steps)
1. Largest entry in column k at or below row k: L17/d:85
2. Swap with row k, small pivot amplifies rounding errors: L17/d:86, 115
3. Pivot below 1e-12 raises ValueError: L17/c:12-13
4. m = A[i][k] / A[k][k], subtract m times row k: L17/d:87-89
5. Back substitute from the last equation upward: L17/d:90
6. L stores multipliers, U is eliminated matrix, PA = LU: L17/d:136, 160

## NumPy 中的任务 (task-table, 8 rows)
- np.dot(a, b), np.linalg.norm(a): L01/d:375-376
- A @ B: L02/d:280
- A * B element-wise: L02/d:279
- np.linalg.matrix_rank(A): L01/d:390
- np.linalg.eig(A): L03/d:387
- np.linalg.svd(A, full_matrices=False): L11/d:423
- np.linalg.lstsq(A, b, rcond=None)[0]: L11/d:481
- np.allclose(Q @ Q.T, np.eye(3)): L01/d:397-398

## 用 SVD 截断、压缩与求逆 (annotated-code, 8 lines)
- np.linalg.svd(A, full_matrices=False), sorted in decreasing order: L11/d:59, 476
- U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :], best rank-k (Eckart-Young): L11/d:137, 437
- compressed_size = k * (rows + cols + 1): L11/d:448
- A_pinv = Vt.T @ S_inv @ U.T with S_inv = np.diag(1.0 / S): L11/d:477-478
- x_svd = A_pinv @ b, least squares: L11/d:296, 480
- x_pinv = np.linalg.pinv(A) @ b: L11/d:482
- svd_from_scratch(A) returns U, S, V with power iteration and deflation: L11/d:365, L11/s:24, 59
- pseudoinverse_via_svd(A, tol=1e-10), 1/s if s > tol: L11/s:77-80

## 从零求解 Ax = b (annotated-code, 9 lines)
- gaussian_elimination(A, b), O(n^3): L17/c:4, L17/d:111
- lu_decompose(A) returns P, L, U, PA = LU: L17/c:26, L17/d:160, 447
- lu_solve(P, L, U, b), O(n^2) per new b: L17/c:47, L17/d:146, 158
- cholesky(A), A = L L^T, SPD only: L17/c:62, L17/d:200
- cholesky_solve(L, b), forward then back substitution: L17/c:79-90
- w_ols = least_squares_normal(X, y), normal equations: L17/d:487-490, 525
- w_ridge = ridge_regression(X, y, lam=1.0), lam * np.eye(n): L17/d:494, 532
- conjugate_gradient(A, b) returns x and k + 1, at most n iterations: L17/c:114-136, L17/d:340
- condition_number(A) returns S[0] / S[-1], inf when S[-1] < 1e-15: L17/c:107-111

## 变换矩阵 (command-table, 8 rows)
- rotation_2d(theta) [[c, -s], [s, c]], preserves distances, det 1: L03/d:241-243, 453
- scaling_2d(sx, sy), det sx * sy: L03/d:245-246, 224
- shearing_2d(kx, ky) [[1, kx], [ky, 1]], parallelograms: L03/d:100, 248-249
- reflection_y() [[-1, 0], [0, 1]], det -1: L03/d:221, 254-255
- reflection_x() [[1, 0], [0, -1]]: L03/d:251-252, 456
- mat_mul(S, R) is rotate then scale: L03/d:293
- eigenvalues_2x2(matrix), complex when discriminant < 0: L03/d:307-319
- eigenvector_2x2(matrix, eigenvalue), normalized: L03/d:323-336

## 关键公式 (concepts, 8 bullets)
- (m x n) @ (n x p) = (m x p): L02/d:53
- Cosine formula, 1 same direction, 0 orthogonal: L01/d:486
- Projection, residual perpendicular: L01/d:129, 489
- Av = lambda v, det(A - lambda I) = 0: L03/d:174, 462
- 2x2 characteristic equation: L03/d:307
- A = U Sigma V^T, A v_i = sigma_i u_i, rank = count of nonzero singular values: L11/d:49, 74, 537
- Normal equations, ridge adds lambda I: L17/d:235, 273
- kappa = sigma_max / sigma_min: L17/d:315

## 选择求解器 (command-table, 7 rows)
- Gaussian elimination: L17/d:369
- LU decomposition: L17/d:370
- QR decomposition: L17/d:371
- Cholesky, twice as fast as LU: L17/d:212, 372
- Normal equations: L17/d:373
- SVD / pseudoinverse: L17/d:374
- Conjugate gradient: L17/d:375

## 数字与默认值 (defaults, 8 rows)
- rank() zero test 1e-10: L01/v:109-116
- Pivot test 1e-12 raises ValueError: L17/c:12-13
- power_iteration num_iters=200, tol=1e-10: L11/s:4, 15-17
- conjugate_gradient tol=1e-10, max_iter = n: L17/c:114-117
- kappa < 100 safe: L17/d:330
- kappa near 10^{16} for float64 meaningless: L17/d:332
- k=50 gives 14.6% of 800 x 600: L11/d:173, 182
- LoRA rank 16, 131K vs 16M parameters: L01/d:442

## 故障排查 (troubleshooting, 8 rows)
- Shape mismatch from inner dimensions: L02/d:53-62, L02/d:325
- inverse_2x2 raises ValueError when determinant is 0: L02/d:212-213, 321
- "Matrix is not positive definite", add lambda I: L17/d:278, 476
- Collinear features cause unstable weights: L01/d:89, L17/d:391
- kappa near 10^k loses k digits, QR or SVD: L17/d:331, 381
- eig(A.T @ A) squares the condition number, use np.linalg.svd(A): L11/d:314, 329
- B @ A applies A first: L03/d:147, 457
- Tolerance such as 1e-9 for Gram-Schmidt checks: L01/d:461

## 问答 (qa, 5 bullets)
- LU: O(n^3) once, O(n^2) per solve: L17/d:158
- Cholesky for SPD, X^T X + lambda I SPD for lambda > 0: L17/d:200, 278
- Determinant: area scale, 0 crushed, -1 flipped: L03/d:215-221
- Eckart-Young, spectral error sigma_{k+1}: L11/d:137, 146
- Eigenvalue magnitude above 1 explodes, below 1 vanishes: L03/d:209

## 提示 (tips, 6 bullets)
- PCA is SVD on centered data, components are V: L11/d:333, 348
- Explained variance sigma_i^2 / (n-1): L11/d:349
- Gap in singular values, keep above it: L11/d:270-273
- Ridge condition number formula: L17/d:334
- Pseudoinverse gives smallest norm solution: L17/d:303-306
- Orthogonal initialization with QR: L17/d:387
