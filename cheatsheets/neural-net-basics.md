---
id: neural-net-basics
title: Neural Network Basics
code: NN
subtitle: 感知机、前向传播、反向传播、损失选择与迷你框架。公式、形状、默认值与修复。
hue: 265
sources: phases/03-deep-learning-core/01-the-perceptron, phases/03-deep-learning-core/02-multi-layer-networks, phases/03-deep-learning-core/03-backpropagation, phases/03-deep-learning-core/05-loss-functions, phases/03-deep-learning-core/10-mini-framework
source_hash: 79fe5ec046db5770
---

## 两层网络的前向与反向
type: architecture
from: phases/03-deep-learning-core/03-backpropagation/docs/en.md, phases/03-deep-learning-core/02-multi-layer-networks/docs/en.md

```arch
node | x | 1,1 | Input x | no computation | client
node | l1 | 2,1 | Hidden layer | a1 = sigmoid(W1 x + b1) | process
node | l2 | 3,1 | Output layer | a2 = sigmoid(W2 a1 + b2) | process
node | loss | 4,1 | Loss | L = (a2 - y)^2 | store
node | g2 | 4,2 | dL/dz2 | 2(a2 - y) a2 (1 - a2) |
node | w2 | 3,2 | dL/dW2 = dL/dz2 a1 | dL/da1 = dL/dz2 W2 |
node | g1 | 2,2 | dL/dz1 | dL/da1 a1 (1 - a1) |
node | w1 | 1,2 | dL/dW1 = dL/dz1 x | dL/db1 = dL/dz1 |
edge | x | l1 | forward
edge | l1 | l2 | a1
edge | l2 | loss | a2
edge | loss | g2 | backward
edge | g2 | w2 |
edge | w2 | g1 |
edge | g1 | w1 |
```

## 一次训练步骤
type: flow
from: phases/03-deep-learning-core/10-mini-framework/docs/en.md, phases/03-deep-learning-core/03-backpropagation/docs/en.md

1. **DataLoader**：产出一批输入和目标。每个 epoch 打乱。
2. **Model**：按层前向传播。每层保存自己的输入和输出。
3. **Loss**：比较预测与目标，得到一个标量。
4. **Optimizer**：`optimizer.zero_grad()` 把每个梯度重置为 0。
5. **Loss**：`loss.backward()` 沿图从右向左传梯度。
6. **Optimizer**：`optimizer.step()` 更新每个参数；SGD 为 `param -= lr * grad`。
7. **Model**：测试前调用 `model.eval()`。推理只跑前向传播。

## 公式
type: concepts
from: phases/03-deep-learning-core/01-the-perceptron/docs/en.md, phases/03-deep-learning-core/02-multi-layer-networks/docs/en.md, phases/03-deep-learning-core/03-backpropagation/docs/en.md, phases/03-deep-learning-core/05-loss-functions/docs/en.md

- **阶跃**：$\text{step}(z) = 1$ 当 $z \ge 0$，否则为 0。
- **感知机规则**：`w_i = w_i + learning_rate * error * x_i`，其中 error = y_true 减 y_pred。
- **Sigmoid**：$\sigma(z) = \frac{1}{1 + e^{-z}}$，范围 (0, 1)。导数是 $a(1 - a)$。
- **层**：$z = W x + b$，然后 $a = \text{sigmoid}(z)$。
- **MSE**：$\frac{1}{n} \sum (y_{\text{pred}} - y_{\text{true}})^2$，梯度 $\frac{2}{n}(y_{\text{pred}} - y_{\text{true}})$。
- **BCE**：$-\left(y \log(p) + (1 - y) \log(1 - p)\right)$
- **CCE**：$-\sum_i y_i \log(p_i)$。只有真实类有贡献。
- **Softmax 加 CE 的梯度**：真实类是概率减 1，其余类是概率本身。

## 代码中的任务
type: task-table
from: phases/03-deep-learning-core/01-the-perceptron/docs/en.md, phases/03-deep-learning-core/02-multi-layer-networks/docs/en.md, phases/03-deep-learning-core/03-backpropagation/docs/en.md, phases/03-deep-learning-core/05-loss-functions/docs/en.md, phases/03-deep-learning-core/10-mini-framework/docs/en.md

| 任务 | 代码 |
|---|---|
| 在 AND 上训练感知机 | `p_and = Perceptron(2)` 然后 `p_and.train(and_data)` |
| 串联各层 | `Network([hidden, output])` |
| Autograd 网络，2-4-1 | `net = Network([2, 4, 1])` |
| 从损失做反向传播 | `total_loss.backward()` |
| 稳定的多类损失 | `F.cross_entropy(logits, labels)` |
| 平滑目标 | `label_smoothing=0.1` |
| 选优化器 | `Adam(model.parameters(), lr=0.01)` |
| 分批数据 | `DataLoader(train_data, batch_size=16, shuffle=True)` |

## 带反向的 Value 节点
type: annotated-code
lang: python
from: phases/03-deep-learning-core/03-backpropagation/docs/en.md, phases/03-deep-learning-core/03-backpropagation/code/main.py

```python
out = Value(self.data + other.data, (self, other), '+')
self.grad += out.grad                 # add passes the gradient through
other.grad += out.grad
out = Value(self.data * other.data, (self, other), '*')
self.grad += other.data * out.grad    # mul swaps the inputs
other.grad += self.data * out.grad
self.grad += (s * (1 - s)) * out.grad # sigmoid reuses s
build_topo(self)                      # topological sort of the graph
self.grad = 1.0                       # dL/dL = 1
for v in reversed(topo):
    v._backward()                     # push gradients to children
```

## 迷你框架训练循环
type: annotated-code
lang: python
from: phases/03-deep-learning-core/10-mini-framework/docs/en.md, phases/03-deep-learning-core/10-mini-framework/code/main.py

```python
model = Sequential(Linear(2, 16), ReLU(), Linear(16, 16), ReLU(),
                   Linear(16, 8), ReLU(), Linear(8, 1), Sigmoid())
criterion = BCELoss()
optimizer = Adam(model.parameters(), lr=0.01)
model.train()                          # dropout and batch stats on
for batch_inputs, batch_targets in loader:
    for x, t in zip(batch_inputs, batch_targets):
        pred = model.forward(x)
        loss = criterion(pred, t)
        optimizer.zero_grad()
        grad = criterion.backward()    # dL/dpred
        model.backward(grad)           # modules in reverse
        optimizer.step()
model.eval()                           # running stats, no dropout
```

## 选哪种损失
type: command-table
from: phases/03-deep-learning-core/05-loss-functions/docs/en.md

| 命令 | 作用 |
|---|---|
| `F.mse_loss` | 回归。对离群点二次惩罚 |
| MAE / Huber | 对离群点更稳健的回归 |
| `F.binary_cross_entropy` | 概率上的二分类 |
| `F.cross_entropy` | 多类。一步完成 log-softmax 与 NLL |
| Label smoothing | 多类 CE 过于自信时加上 |
| Focal Loss | 类别不平衡。降低易分样本权重 |
| Triplet Loss | 锚点、正样本、负样本，带间隔 |
| InfoNCE | 大批次自监督嵌入 |

## 课程代码中的默认值
type: defaults
from: phases/03-deep-learning-core/01-the-perceptron/docs/en.md, phases/03-deep-learning-core/05-loss-functions/docs/en.md, phases/03-deep-learning-core/10-mini-framework/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Perceptron `learning_rate` | 0.1 | `epochs=100` |
| Adam `lr` | 0.001 | `beta1=0.9`, `beta2=0.999`, `eps=1e-8` |
| SGD `lr` | 0.01 | `param -= lr * grad` |
| Dropout `p` | 0.5 | 幸存者按 1/(1-p) 缩放 |
| BatchNorm | `momentum=0.1` | `eps=1e-5`，eval 用 running stats |
| BCE clip `eps` | 1e-15 | 框架里的 `BCELoss` 用 1e-7 |
| `alpha` | 0.1 | Label smoothing，10 类时目标 0.91 |
| `temperature` | 0.07 | 对比损失，SimCLR 默认 |

## 要记住的数字
type: tips
from: phases/03-deep-learning-core/03-backpropagation/docs/en.md, phases/03-deep-learning-core/05-loss-functions/docs/en.md, phases/03-deep-learning-core/02-multi-layer-networks/docs/en.md

- Sigmoid 导数在 $a = 0.5$ 时峰值是 0.25。
- 十层 sigmoid 最多把梯度缩到 $0.25^{10} = 0.000001$。
- 在 50/50 二分类上用 MSE 预测 0.5，得到 0.25，学不到东西。
- 交叉熵给出 $-\log(0.5) = 0.693$ 和 $-\log(0.99) = 0.01$。
- 错误且自信的猜测 $p = 0.01$ 代价是 $-\log(0.01) = 4.6$。
- 10 类上的随机猜测代价是 $-\log(0.1) = 2.3$。
- $\gamma = 2$ 的 Focal loss 给易分样本权重 0.01，难分样本 0.81。
- 一次反向传播得到全部梯度。逐个扰动每个权重则每个权重需要一次前向。

## 故障排查
type: troubleshooting
from: phases/03-deep-learning-core/01-the-perceptron/docs/en.md, phases/03-deep-learning-core/02-multi-layer-networks/docs/en.md, phases/03-deep-learning-core/03-backpropagation/docs/en.md, phases/03-deep-learning-core/05-loss-functions/docs/en.md, phases/03-deep-learning-core/10-mini-framework/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 感知机在 XOR 上永不收敛 | XOR 线性不可分 | 加隐藏层 |
| 分类器对所有样本输出 0.5 | 分类用了 MSE | 改用交叉熵 |
| 前几层学不到 | Sigmoid 逐层缩小梯度 | ReLU（第 04 课）、缩放初始化 |
| 损失为 inf 或 NaN | $\log(0) = -\infty$ | 把 p 裁到 [eps, 1 - eps] |
| `math.exp(1000)` 溢出 | sigmoid 输入过大 | 钳制到 [-500, 500] |
| 被复用的值梯度错误 | `=` 覆盖了其他路径 | 用 `+=` 累加 |
| 梯度每步变大 | 旧梯度还在 | 先调用 `zero_grad()` |
| 测试结果每次都变 | Dropout 仍开着 | 调用 `model.eval()` |

## 问答
type: qa
from: phases/03-deep-learning-core/01-the-perceptron/docs/en.md, phases/03-deep-learning-core/02-multi-layer-networks/docs/en.md, phases/03-deep-learning-core/03-backpropagation/docs/en.md, phases/03-deep-learning-core/05-loss-functions/docs/en.md, phases/03-deep-learning-core/10-mini-framework/docs/en.md

- **W 的形状是什么？** 行对应当前层。列对应上一层。
- **训练为什么用 sigmoid 而不是阶跃？** Sigmoid 光滑，所以存在梯度。
- **为什么保存激活值？** 反向传播需要它们。用内存换一次遍历。
- **为什么做拓扑排序？** 节点要先收齐自己的梯度，再往下传。
- **为什么用 `F.cross_entropy` 而不是先 softmax 再 log？** 一次运算数值更稳定。
- **为什么要 `train()` 和 `eval()`？** Dropout 和 BatchNorm 在两种模式下行为不同。
- **为什么 `zero_grad` 是单独调用？** 梯度用 `+=` 累加，直到你重置它们。
