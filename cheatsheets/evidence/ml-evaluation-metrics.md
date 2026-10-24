# Evidence: cheatsheets/ml-evaluation-metrics.md

Abbreviations: P2 = phases/02-ml-fundamentals. EV = P2/09-model-evaluation, BV = P2/10-bias-variance, HT = P2/12-hyperparameter-tuning, IM = P2/17-imbalanced-data. d = docs/en.md. EVc = EV/code/evaluation.py, BVc = BV/code/bias_variance.py, IMc = IM/code/imbalanced.py.

## 诊断训练误差与测试误差 (troubleshooting)
- high train, high test: bias, more features, complex model, less regularization: BV/d:155
- low train, high test: variance, more data, regularization, simpler model: BV/d:156
- train decreasing, test increasing: early stopping: BV/d:158
- both flat and high, more data will NOT help, change model: BV/d:230, 232
- large gap still shrinking, collect more data: BV/d:229, 232
- 99% accuracy useless, use precision, recall, F1, AUPRC, MCC: EV/d:137, IM/d:13, 42
- scaler fit before split, preprocessing inside a Pipeline: EV/d:135, HT/d:519
- best value at search boundary, widen range: HT/d:523

## 划分、调参、汇报 (architecture)
- Full dataset: EV/d:31
- Train set 60-70%: EV/d:31
- Validation set 15-20%: EV/d:32
- Test set 15-20%, use once: EV/d:33, EV/d:47
- Fit model: EV/d:34
- Tune hyperparameters, select models: EV/d:36, EV/d:46
- Final model: EV/d:38
- Report performance: EV/d:40

## 指标公式 (concepts)
- accuracy, misleading when imbalanced: EV/d:103
- precision, false positives costly: EV/d:104
- recall, false negatives costly: EV/d:105
- F1 harmonic mean: EV/d:106
- F-beta, beta > 1 recall, F2 fraud: IM/d:52
- MCC, -1 to +1: IM/d:56
- AUC-ROC 0.5 random, 1.0 perfect: EV/d:107
- AUPRC random equals positive class rate: IM/d:54
- RMSE same units, MAE robust: EV/d:112-113
- Bias^2 + Variance + noise: BV/d:58-62

## 逐步修复模型 (flow)
1. train, compute train and test error: BV/d:421
2. both high, bias, skip to step 4: BV/d:422
3. train low test high, variance, learning curve, regularize: BV/d:423
4. validation curve, sweet spot: BV/d:424
5. learning curve at sweet spot, gap: BV/d:425
6. Ridge/Lasso alpha with cross_val_score, lowest CV error: BV/d:426

## 交叉验证与调参 (annotated-code)
- cross_val_score with StratifiedKFold(5), scoring="f1": EV/d:646
- param_dist loguniform(1e-4, 0.5), randint(2, 10), randint(50, 500): HT/d:495-499
- log scale for learning rate: HT/d:515
- RandomizedSearchCV, n_iter=100, cv=5, neg_mean_squared_error, n_jobs=-1: HT/d:501-509
- search.fit, search.best_params_: HT/d:510-511
- outer_scores = cross_val_score(inner_cv, X, y, cv=5, ...): HT/d:213-214

## 搜索策略 (command-table)
- grid search, exponential: HT/d:37
- random search, more unique values per budget: HT/d:56
- Bayesian, surrogate + acquisition, 2-5x fewer evaluations: HT/d:95-105
- Hyperband 10-50x faster: HT/d:114-116
- MedianPruner, median of completed trials at same step: HT/d:485
- GridSearchCV: HT/d:489
- RandomizedSearchCV, n_jobs=-1 all cores: HT/d:489, 515
- trial.suggest_float, log=True: HT/d:427, 447

## 选择不平衡修复方法 (defaults)
- < 70/30 mild, class weights first: IM/d:197
- 70/30 to 95/5 moderate, SMOTE + class weights: IM/d:198, SMOTE + threshold tuning: IM/d:66
- > 95/5 severe, combine multiple strategies: IM/d:199, 67
- < 1000 samples, oversample or SMOTE, avoid undersampling: IM/d:203
- 1000-10000, SMOTE + threshold tuning: IM/d:204
- > 10000, undersampling OK, or class weights: IM/d:205

## 需要记住的数字 (defaults)
- K = 5 or 10: EV/d:88
- threshold 0.5, optimal lower when imbalanced: IM/d:159
- 60 random trials, 95% within 5%: HT/d:78
- Hyperband 81 configs, 1 epoch, top third: HT/d:116
- 675 fits, 5 x 5 x 27: HT/d:220
- n_bootstrap=200: BVc:36, BV/d:294
- SMOTE k=5, n_synthetic=100: IMc:29
- positive weight 10.0 for 1000 samples with 50 positive: IM/d:141-143

## 问答 (qa)
- stratified preserves class distribution: EV/d:90
- test set single use: EV/d:47, 143
- only 1-2 of 6 matter: HT/d:75
- bagging high variance, boosting high bias: BV/d:192
- weights equal oversampling in expectation: IM/d:155
- interpolation threshold p ~ n worst: BV/d:133, 136
- nested CV or untouched test set: HT/d:521

## 技巧 (tips)
- split first, then preprocess: EV/d:135
- learning rate first, log scale: HT/d:224-226
- early stopping instead of n_estimators: HT/d:228
- 60% budget on top 2: HT/d:230
- defaults, coarse 20-50, fine 50-100: HT/d:164-167
- sweep thresholds 0.0 to 1.0, pick best F1: IM/d:163-166

## 从零实现的函数 (task-table)
- stratified_kfold_split(y, k=5, seed=42): EVc:46
- auc_roc(y_true, y_scores): EVc:151
- smote(X_minority, k=5, n_synthetic=100, seed=42): IMc:29
- compute_class_weights(y): IMc:114
- find_optimal_threshold(y_true, y_probs, metric="f1"): IMc:158
