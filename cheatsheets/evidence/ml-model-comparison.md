# Evidence: cheatsheets/ml-model-comparison.md

Abbreviations: P2 = phases/02-ml-fundamentals. LR = P2/02-linear-regression, LG = P2/03-logistic-regression, DT = P2/04-decision-trees, SV = P2/05-support-vector-machines, KN = P2/06-knn-and-distances, NB = P2/14-naive-bayes. d = docs/en.md. Code files: LRc = LR/code/linear_regression.py, DTc = DT/code/trees.py, SVc = SV/code/svm.py, KNc = KN/code/knn.py, NBc = NB/code/naive_bayes.py.

## 模型并排对比 (defaults)
- Linear regression, gradient descent, hyperplane, normal equation O(n^3): LR/d:62, 105, 115
- Logistic regression, binary cross-entropy, linear boundary at 0.5: LG/d:73, 77, 123
- Decision tree, Gini impurity, rectangular regions, greedy, high variance: DT/d:29, 49, 89, 135
- Random forest, bagging, majority vote or average: DT/d:147, 155
- SVM, hinge loss, maximum margin, only support vectors stored: SV/d:81, 114, 376
- KNN lazy, no training, O(n · d) per query, stores training set: KN/d:195-201
- Naive Bayes, count frequencies, linear, matrix multiply: NB/d:188, 194, 197

## 缩放与最适合的数据 (defaults)
- Linear regression: standardize features, baseline for every regression task: LR/d:23, 117
- Trees: mixed types without preprocessing, small datasets < 10k rows: DT/d:21, 182
- SVM: always scale, small data and high-dim sparse: SV/d:228-229, 337
- KNN: requires scaling, works up to about 20-50 features: KN/d:160, 302
- Multinomial NB: no scaling, text, small training sets: NB/d:21, 408
- Gaussian NB: no scaling, continuous bell-curve features: NB/d:120, 126, 408

## 何时使用各模型 (tips)
- linear regression baseline: LR/d:23
- logistic regression yes-or-no with probabilities, linear boundary: LG/d:3, 21, 123
- random forest, almost no hyperparameter tuning, trees default for flat tables: DT/d:188, 436
- SVM small data, TF-IDF sparse: SV/d:228-229
- KNN when data changes often, zero training time: KN/d:206-208
- TF-IDF + MultinomialNB, fewer than 10,000 samples: NB/d:368
- BernoulliNB short text, binary=True in CountVectorizer: NB/d:372, 384

## 损失与公式 (concepts)
- MSE and gradient 2/n: LR/d:52-53, 79-82
- R squared, 1.0 perfect, 0.0 the mean: LR/d:135-143
- Sigmoid, 0.5 at z = 0: LG/d:47-54
- Binary cross-entropy and gradient (p - y) x: LG/d:79-80, 95-98
- Gini, 6 cats 4 dogs 0.48: DT/d:51-60
- Hinge, zero beyond margin: SV/d:114
- RBF kernel, near 1 for close points: SV/d:181, 185
- Multinomial NB smoothing, log space: NB/d:112-113, 175-178

## 先缩放，再拟合 (annotated-code)
- Pipeline, StandardScaler, SVC(kernel="rbf", C=1.0, gamma="scale"): SV/d:328-330
- clf.fit, clf.score, n_support_: SV/d:331-333
- LinearSVC(C=1.0, max_iter=10000), primal for large data: SV/d:339, 346
- KNeighborsClassifier(n_neighbors=5, metric="euclidean"): KN/d:326
- MultinomialNB(alpha=1.0), mnb.fit(X_train_counts, y_train): NB/d:330-331
- MultinomialNB no scaling: NB/d:408

## 生长一片随机森林 (flow)
1. bootstrap with replacement, about 63%: DT/d:155
2. out-of-bag rows for validation: DT/d:155
3. sqrt(n_features) for classification: DT/d:157
4. highest information gain: DT/d:89, 99
5. pure node or pre-pruning limit: DT/d:247
6. n_trees default 100: DTc:226
7. majority vote or average: DT/d:147

## 权衡偏差与方差的旋钮 (command-table)
- Large C narrow margin, overfits: SV/d:101
- Small C wide margin, underfits: SV/d:102
- K = 1 zero training error, high variance: KN/d:56
- K = N majority class, maximum bias: KN/d:59
- max depth pre-pruning: DT/d:109-110
- NB alpha higher stronger smoothing: NB/d:160
- Ridge lambda higher smaller weights: LR/d:154
- SVR epsilon wider tube fewer support vectors: SV/d:213

## 课程代码中的默认值 (defaults)
- max_depth=None, min_samples_split=2, criterion="gini": DTc:76-77
- pure leaves without stopping: DT/d:107
- Gini vs entropy nearly identical: DTc:574, 636
- n_trees=100, max_features="sqrt": DTc:226-227, n_estimators=100: DT/d:430
- regression n_features/3: DT/d:157
- k=5: KNc:50, sqrt(N) and odd K: KN/d:61
- rbf_kernel gamma=0.5, polynomial_kernel degree=3: SVc:29, 33
- var_smoothing=1e-9: NBc:49, zero variance smoothing: NB/d:404

## 故障与修复 (troubleshooting)
- logistic on circles, linear boundary, polynomial features: LG/d:123, 510
- SVM unscaled features: SV/d:337
- SVC O(n^2) to O(n^3), LinearSVC: SV/d:339
- KNN curse of dimensionality, PCA/UMAP first: KN/d:160
- single tree high variance, forests: DT/d:135
- MDI bias, permutation importance: DT/d:171-173
- zero probability, Laplace smoothing alpha 1: NB/d:150-158
- negative values, GaussianNB or shift: NB/d:402

## 问答 (qa)
- MSE non-convex with sigmoid, BCE convex: LG/d:77, 89
- ranking over calibration: NB/d:53, 59
- averaging decorrelated trees: DT/d:159
- support vectors only, hinge zero outside margin: SV/d:114, 143
- start with NB, switch to LR: NB/d:204
- normal equation small, gradient descent large: LR/d:105
- CalibratedClassifierCV cv=5: NB/d:388-393

## 从零实现的类 (task-table)
- LinearRegressionNormal(): LRc:68
- gini_impurity(labels): DTc:5
- rbf_kernel(x, z, gamma=0.5): SVc:33
- hinge_loss(X, y, w, b): SVc:38
- MultinomialNB(alpha=1.0): NBc:4-5
