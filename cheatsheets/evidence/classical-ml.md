# Evidence: cheatsheets/classical-ml.md

Abbreviations: 02 = phases/02-ml-fundamentals/02-linear-regression, 03 = phases/02-ml-fundamentals/03-logistic-regression, 04 = phases/02-ml-fundamentals/04-decision-trees, 05 = phases/02-ml-fundamentals/05-support-vector-machines, 06 = phases/02-ml-fundamentals/06-knn-and-distances, 07 = phases/02-ml-fundamentals/07-unsupervised-learning, 08 = phases/02-ml-fundamentals/08-feature-engineering, 09 = phases/02-ml-fundamentals/09-model-evaluation, 10 = phases/02-ml-fundamentals/10-bias-variance, 11 = phases/02-ml-fundamentals/11-ensemble-methods, 12 = phases/02-ml-fundamentals/12-hyperparameter-tuning, 13 = phases/02-ml-fundamentals/13-ml-pipelines, 14 = phases/02-ml-fundamentals/14-naive-bayes, 17 = phases/02-ml-fundamentals/17-imbalanced-data, 18 = phases/02-ml-fundamentals/18-feature-selection, D = docs/en.md.


## 拟合模型 (task-table, 8)
- Ridge(alpha=1.0): 02/D:514
- LogisticRegression(class_weight="balanced"): 17/D:481, 493
- RandomForestClassifier(n_estimators=100, random_state=42): 04/D:430
- SVC(kernel="rbf", C=1.0, gamma="scale"): 05/D:330
- LinearSVC(C=1.0, max_iter=10000) for large datasets: 05/D:339-346
- KNeighborsClassifier(n_neighbors=5, metric="euclidean"): 06/D:326
- KMeans(n_clusters=3, random_state=42).fit(data): 07/D:467
- DBSCAN(eps=1.5, min_samples=5).fit(data), noise points: 07/D:468, 76

## 指标 (command-table, 6)
- Accuracy formula, misleading when imbalanced: 09/D:103
- Precision, false positives costly: 09/D:104
- Recall, false negatives costly: 09/D:105
- F1 harmonic mean: 09/D:106
- AUC-ROC 0.5 random, 1.0 perfect, threshold independent: 09/D:107
- R-squared, negative when worse than mean: 09/D:114

## 关键公式 (concepts, 8)
- MSE: 02/D:52-54
- Normal equation, O(n^3) in features: 02/D:101-105
- Ridge cost: 02/D:150-152
- Log loss, p = sigma(wx + b): 03/D:79-81, 102
- Gini, 0 = pure: 04/D:51-53, 459
- Soft margin hinge form: 05/D:110-112
- RBF kernel: 05/D:177-182
- Bias, variance, noise split: 10/D:56-58

## 无泄漏的预处理 (annotated-code, 13 lines)
- leaky X_scaled = scaler.fit_transform(X): 13/D:53, comment 13/D:59
- X_train_scaled, X_test_scaled: 13/D:66-67
- Pipeline scaler + LogisticRegression: 13/D:81-84
- pipe.fit, pipe.predict and what each step calls: 13/D:86-96
- cross_val_score(full_pipe, df, y, cv=5, scoring="accuracy"): 13/code/pipeline.py:550. Per fold fit: 13/D:41, 312

## ColumnTransformer 流水线 (architecture, 7 nodes)
- raw DataFrame with numeric and categorical columns: 13/code/pipeline.py:520-527
- numeric columns age, income, score: 13/code/pipeline.py:541
- categorical columns city, plan: 13/code/pipeline.py:542
- SimpleImputer median, then StandardScaler: 13/D:109-112
- SimpleImputer most_frequent, then OneHotEncoder: 13/D:114-117
- ColumnTransformer joins both: 13/D:102, 119-122, 339
- Model GradientBoostingClassifier, predict: 13/D:125-128, 13/code/pipeline.py:545-548

## 无泄漏地验证 (flow, 7)
1. test set touched exactly once: 09/D:47
2. K folds, stratified: 09/D:84-90
3. scaler fit_transform on training data: 13/D:91
4. model fit on scaled data: 13/D:92
5. scaler transform on held out data, then predict: 13/D:95-96
6. average K scores: 09/D:86
7. report on test set: 09/D:47, 49

## 超参数调优 (annotated-code, 12 lines)
- param_dist with loguniform, randint: 12/D:492-499
- RandomizedSearchCV args n_iter=100, cv=5, scoring, random_state=42, n_jobs=-1: 12/D:501-509
- n_jobs=-1 all CPU cores, loguniform for rates, randint for integers: 12/D:515
- search.fit, best_params_, -best_score_: 12/D:510-512

## 起始值 (defaults, 8)
- threshold 0.5, lower for imbalance: 17/D:159
- K = 5 or 10: 09/D:88
- sqrt(n_features), n_features / 3: 11/D:70
- 100 trees: 04/D:430 (n_estimators=100)
- learning_rate 0.1, typical 0.01 to 0.3: 11/D:266, 137
- max_depth 3: 11/D:266
- Naive Bayes alpha 1.0 Laplace: 14/D:168
- out of bag 36.8%, free validation: 11/D:66

## 故障排查 (8)
- high train and test error, bias: 10/D:155
- low train, high test, variance: 10/D:156
- test error rising, early stopping: 10/D:158
- fit on full data, Pipeline with cross_val_score: 13/D:251
- new category crash, handle_unknown="ignore": 13/D:130, 253
- 99% accuracy with zero positives: 17/D:33-38. Fixes class weights and threshold: 17/D:139-159
- unscaled features for SVM: 05/D:337. KNN needs scaling: 06/D:365
- best value at search edge: 12/D:523

## 问答 (qa, 5)
- MSE non-convex with sigmoid, log loss convex: 03/D:77, 89
- SVM margin depends on norm of w: 05/D:337
- L1 pushes weights to zero: 10/D:98
- more data does not fix high bias: 09/D:120, 10/D:230
- class weights equal oversampling in expectation: 17/D:155

## 提示 (6)
- sweep learning rate first: 12/D:224
- log scale for learning rate and regularization: 12/D:226
- n_estimators high with early stopping: 12/D:228
- nested cross-validation for final estimate: 12/D:521
- was_this_missing indicator before imputing: 08/D:87
- threshold from validation set: 17/D:163

## 缩写 (glossary, 4)
- AUC-ROC: 09/D:107
- SMOTE k-NN interpolation of minority samples: 17/D:529
- GMM, soft assignments, EM: 07/D:98-102, 494
- RFE, train rank prune repeat: 18/D:519
