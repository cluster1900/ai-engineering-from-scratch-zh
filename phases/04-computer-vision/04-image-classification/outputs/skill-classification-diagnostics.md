---
name: skill-classification-diagnostics
description: 给定一个 confusion matrix 和 class names，呈现每个 class 的失败情况，并提出单个影响最大的修复方案
version: 1.0.0
phase: 4
lesson: 4
tags: [computer-vision, classification, evaluation, debugging]
---

# Classification 诊断

用于阅读 confusion matrix 的视角。总体 accuracy 告诉你一个 classifier 是否有效。confusion matrix 告诉你它*还不知道什么*。

## 何时使用

- 第一次查看已训练 classifier 的 validation 性能。
- 在两次 training run 之间决定下一步要改什么。
- 在发布 model 之前：验证没有关键 class 在静默失败。
- 调试 production regression：overall accuracy 下降了一个百分点，而你需要知道原因。

## 输入

- `cm`: CxC confusion matrix（rows = true, cols = predicted）。
- `labels`: C 个 class names 的 list，顺序相同。
- 可选 `class_priors`: 每个 class 的 training frequency（默认使用 `cm` 的 row sums）。

## 步骤

1. **计算每个 class 的 metrics。** 将任何除以零视为该 class 的 metric 未定义，并报告为 `n/a`；绝不要静默替换为 0。
   - precision_i = cm[i,i] / sum(cm[:, i])   （当该 class 从未被预测时未定义）
   - recall_i    = cm[i,i] / sum(cm[i, :])   （当该 class 没有 ground-truth samples 时未定义）
   - f1_i        = 2 * p * r / (p + r)        （当任一 component 未定义时未定义）

2. **按 F1 排出最多三个最差 classes**。如果 confusion matrix 少于三个 classes，就列出实际存在的数量。排除所有 metrics 都未定义的 classes。

3. **找到每一 row 中最大的 off-diagonal cell** —— 最常从这个 class 抢走样本的那个 class。报告为 `true -> predicted`。

4. **为每个最差 class 判定 failure mode**。使用这些 quantitative thresholds，保证 label 可复现：
   - `ambiguity` — 与另一个 class 双向混淆：同时满足 `cm[i,j] / sum(cm[i, :]) >= 0.15` 和 `cm[j,i] / sum(cm[j, :]) >= 0.15`。
   - `imbalance` — 该 class 的 training count 小于其 top confuser 的 `< 0.5x`。
   - `label_noise` — `|precision_i - recall_i| >= 0.2`，且该 class 不在 imbalance / ambiguity 路径上。
   - `systematic` — 没有单个 confuser 超过该 class errors 的 0.2 share；errors 分散到三个或更多其他 classes。

5. **推荐单个影响最大的下一步行动**：
   - `ambiguity` -> 收集或合成有区分度的 examples，添加能保留 distinguishing feature 的 targeted augmentation。
   - `imbalance` -> oversample minority class，或应用 class-weighted loss。
   - `label_noise` -> audit 该 class 的 stratified sample；先修复 mislabels，再做任何其他改动。
   - `systematic` -> 为该 class 增加数据，或以更高权重关注该 class 的 loss 来 fine-tune。

## 报告

```
[diagnostics]
  aggregate accuracy: X.XX
  macro F1:           X.XX

[top-3 worst classes]
  1. class <name>  F1 = X.XX  prec = X.XX  rec = X.XX
     top confusion: <name> -> <other>  (N cases)
     failure mode:  ambiguity | imbalance | label_noise | systematic
     action:        <one sentence>

  2. ...
  3. ...

[recommendation]
  single biggest lever: <one sentence naming the class and the fix>
```

## 规则

- 最多返回三个 classes。更多会掩盖信号。
- 为每个最差 class 命名 dominant confuser；绝不要概括为“confuses with many”。
- 每条 recommendation 都必须基于 confusion matrix evidence。不要泛泛地说“add more data”，除非明确指出哪个 class。
- 当 precision 和 recall 的差异超过 0.2 时，始终将 label noise 标记为 candidate —— 真实 classes 在 training 后通常会有对齐的 P 和 R。
