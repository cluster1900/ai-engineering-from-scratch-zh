# Evidence: cheatsheets/math-for-ml.md

Abbreviation: P01 = phases/01-math-foundations. All paths are docs/en.md unless the line says otherwise.

## Architecture: 计算图：前向与反向
- x1 "x1 = 2", "dy/dx1 = 3": P01/05-chain-rule-and-autodiff/docs/en.md:68, 83
- x2 "x2 = 3", "dy/dx2 = 2": P01/05-chain-rule-and-autodiff/docs/en.md:69, 84
- mul "Multiply", "a = 6": P01/05-chain-rule-and-autodiff/docs/en.md:68, 70
- b "b = 1", "dy/db = 1": P01/05-chain-rule-and-autodiff/docs/en.md:71, 82
- add "Add", "c = 7": P01/05-chain-rule-and-autodiff/docs/en.md:70, 72
- relu "relu", "y = 7": P01/05-chain-rule-and-autodiff/docs/en.md:72-73
- seed "Seed", "dy/dy = 1": P01/05-chain-rule-and-autodiff/docs/en.md:80, 106
- edges a, c: P01/05-chain-rule-and-autodiff/docs/en.md:70, 72. edge "backward": P01/05-chain-rule-and-autodiff/docs/en.md:76-87 (backward pass graph)

## 关键公式
- Chain rule: P01/05-chain-rule-and-autodiff/docs/en.md:34
- Bayes: P01/07-bayes-theorem/docs/en.md:49
- Entropy: P01/09-information-theory/docs/en.md:54
- Cross-entropy: P01/09-information-theory/docs/en.md:73
- KL = H(P, Q) - H(P), not symmetric: P01/09-information-theory/docs/en.md:92-93, 99
- Log-sum-exp: P01/13-numerical-stability/docs/en.md:145 (exp written as e^)
- Cosine similarity, -1 to +1: P01/14-norms-and-distances/docs/en.md:142, 145
- SVD and rank k: P01/11-singular-value-decomposition/docs/en.md:49, 141

## 更新规则
- Gradient descent: P01/08-optimization/docs/en.md:39
- Momentum: P01/08-optimization/docs/en.md:96-97
- Adam moments: P01/08-optimization/docs/en.md:131-132 (gradient written as g)
- Bias correction: P01/08-optimization/docs/en.md:133-134
- Adam step: P01/08-optimization/docs/en.md:135
- Cosine schedule: P01/08-optimization/docs/en.md:153
- Newton step: P01/04-calculus-for-ml/docs/en.md:240
- Temperature: P01/16-sampling-methods/docs/en.md:244-245

## NumPy 中的任务
- Dense layer: P01/02-vectors-matrices-operations/docs/en.md:289
- np.linalg.solve(A, b): P01/17-linear-systems/docs/en.md:559
- np.linalg.lstsq(X, y, rcond=None)[0]: P01/17-linear-systems/docs/en.md:528
- Thin SVD: P01/11-singular-value-decomposition/docs/en.md:423, 436
- Rank k approximation: P01/11-singular-value-decomposition/docs/en.md:437
- np.linalg.pinv(A) @ b: P01/11-singular-value-decomposition/docs/en.md:482
- Row norms: P01/14-norms-and-distances/docs/en.md:458
- Batched einsum: P01/12-tensor-operations/docs/en.md:229

## PyTorch 与 SciPy 中的任务
- AdamW, "for transformers": P01/08-optimization/docs/en.md:327, 336
- CosineAnnealingLR: P01/08-optimization/docs/en.md:329
- clip_grad_norm_: P01/13-numerical-stability/docs/en.md:334
- gradcheck: P01/13-numerical-stability/docs/en.md:267
- log_softmax: P01/13-numerical-stability/docs/en.md:387
- stats.norm(...).ppf(0.975): P01/16-sampling-methods/docs/en.md:620-622 (two lines joined)
- SklearnPCA(n_components=2).fit_transform: P01/10-dimensionality-reduction/docs/en.md:289-290 (two lines joined)
- TSNE(n_components=2, perplexity=30, random_state=42): P01/10-dimensionality-reduction/docs/en.md:298

## Annotated code: 几行代码实现自动微分
- torch.tensor, expression, y.backward(), print(x.grad) 7.0: P01/05-chain-rule-and-autodiff/docs/en.md:152-155
- "builds the graph", "reverse mode": P01/05-chain-rule-and-autodiff/docs/en.md:161-162
- __mul__, out = Value(...), _backward, grads, return: P01/05-chain-rule-and-autodiff/docs/en.md:204-214 (the isinstance line is left out)
- "+= sums over all uses": P01/05-chain-rule-and-autodiff/docs/en.md:221
- self.grad = 1.0, reversed(topo), v._backward(): P01/05-chain-rule-and-autodiff/docs/en.md:237-239; seed dy/dy = 1: P01/05-chain-rule-and-autodiff/docs/en.md:242

## Annotated code: 稳定的 softmax 与交叉熵
- softmax_stable: P01/13-numerical-stability/docs/en.md:419-423
- "largest term is 1": P01/13-numerical-stability/docs/en.md:148
- cross_entropy_stable: P01/13-numerical-stability/docs/en.md:460-465
- "stay in log space": P01/13-numerical-stability/docs/en.md:103

## Flow: 用 SVD 做 PCA
1. Center: P01/10-dimensionality-reduction/docs/en.md:52
2. Covariance C = X^T X / (n-1): P01/11-singular-value-decomposition/docs/en.md:338
3. np.linalg.svd(A), avoid eig of A^T A: P01/11-singular-value-decomposition/docs/en.md:329
4. Right singular vectors V are the components: P01/11-singular-value-decomposition/docs/en.md:348
5. Variance sigma_i^2 / (n-1): P01/11-singular-value-decomposition/docs/en.md:349
6. 90 to 95% cumulative variance: P01/10-dimensionality-reduction/docs/en.md:89
7. Project top k: P01/10-dimensionality-reduction/docs/en.md:56

## 默认值与数字
- Adam lr 0.001: P01/08-optimization/docs/en.md:72, 141
- Adam beta2 0.999, beta1 0.9: P01/08-optimization/docs/en.md:141
- Adam epsilon 1e-8: P01/08-optimization/docs/en.md:141
- SGD momentum lr 0.01, momentum 0.9: P01/08-optimization/docs/en.md:72, 335
- Gradient check h 1e-5, 1e-5 to 1e-7: P01/13-numerical-stability/docs/en.md:253
- max_norm 1.0, 0.5 RL, 5.0 simpler: P01/13-numerical-stability/docs/en.md:336
- Dynamic loss scale 65536, halve and double: P01/13-numerical-stability/docs/en.md:294
- Top-p 0.9 with temperature 0.7: P01/16-sampling-methods/docs/en.md:303-304

## 故障排查
- Loss NaN: P01/13-numerical-stability/docs/en.md:365-367
- Loss stuck at log(num_classes): P01/13-numerical-stability/docs/en.md:369-371
- Accuracy 1 to 3% low: P01/13-numerical-stability/docs/en.md:373-375
- Gradient norm 0.0: P01/13-numerical-stability/docs/en.md:377-379
- Results differ across GPUs, use_deterministic_algorithms: P01/13-numerical-stability/docs/en.md:381-383
- 0.1 + 0.2 == 0.3, math.isclose(): P01/13-numerical-stability/docs/en.md:56-81
- Condition number, add lambda I, drop features: P01/17-linear-systems/docs/en.md:312-334, 391
- Naive Bayes zero probability, Laplace smoothing: P01/07-bayes-theorem/docs/en.md:140-146

## 问答
- Reverse mode: P01/05-chain-rule-and-autodiff/docs/en.md:113
- Cross-entropy maximizes likelihood: P01/09-information-theory/docs/en.md:257
- bfloat16 range, 65,504: P01/13-numerical-stability/docs/en.md:303, 307
- SVD vs eig(A.T @ A), squared condition number: P01/11-singular-value-decomposition/docs/en.md:314, 329
- Reparameterization trick: P01/16-sampling-methods/docs/en.md:326-333

## 提示
- (m x n) @ (n x p) = (m x p): P01/02-vectors-matrices-operations/docs/en.md:53
- Sum log probabilities: P01/07-bayes-theorem/docs/en.md:255
- Never compare floats with ==: P01/13-numerical-stability/docs/en.md:81
- Check gradients for a new layer or loss: P01/13-numerical-stability/docs/en.md:267
- Perplexity is exp of cross-entropy in nats: P01/09-information-theory/docs/en.md:275-280
- Relative error below 1e-5 is acceptable: P01/13-numerical-stability/docs/en.md:263
