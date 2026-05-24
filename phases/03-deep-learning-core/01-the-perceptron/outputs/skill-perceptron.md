---
name: skill-perceptron
description: 理解 perceptron 模式，以及何时使用 single-layer 与 multi-layer 架构
version: 1.0.0
phase: 3
lesson: 1
tags: [perceptron, neural-networks, classification, deep-learning]
---

# Perceptron 模式

perceptron 会计算输入加权和再加上 bias，然后应用 step function 以产生 binary output。它是 Neural Network 的基本单元。

```
output = step(w1*x1 + w2*x2 + ... + wn*xn + bias)
```

## 什么时候单个 perceptron 就足够

- 问题是线性可分的：一条直线（或 hyperplane）可以把两个 classes 分开
- Logic gates：AND、OR、NOT、NAND
- 简单的 threshold 决策："is the score above X?"
- 数据聚成两个不重叠区域的 Binary classifiers

## 什么时候你需要多层

- 问题不是线性可分的：没有一条单独的直线可以分开这些 classes
- XOR 和 parity 问题
- 任何需要 "this but not that" 推理的任务（条件组合）
- 真实世界的 Classification：图像、文本、音频 - 几乎总是 non-linear

## 决策清单

1. 绘制或检查你的数据。你能在 classes 之间画出一条单独的直线边界吗？
   - 是：single perceptron 可行
   - 否：你至少需要两层
2. 这个问题能否分解为更简单线性决策的 AND/OR？
   - 这种分解会告诉你最小 network 结构
   - XOR = (A OR B) AND (NOT (A AND B)) = 2 层中的 3 个 perceptrons
3. 对于超过两个 classes 的问题，每个 class 都需要一个 output node

## 训练规则

```
error = expected - predicted
weight_new = weight_old + learning_rate * error * input
bias_new = bias_old + learning_rate * error
```

如果预测正确，什么都不会改变。如果错误，weights 会移动以减少 error。这只适用于 single-layer perceptrons。Multi-layer networks 需要 Backpropagation。

## 常见错误

- 试图用 single perceptron 学习 non-linear patterns（它永远不会 converge）
- 将 learning rate 设得太高（weights 振荡）或太低（训练耗时极长）
- 忘记 bias term（没有它，decision boundary 必须穿过原点）
- 将 perceptron convergence（对线性可分数据有保证）与一般 Neural Network convergence（无保证）混淆
