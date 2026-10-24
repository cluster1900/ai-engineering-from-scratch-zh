---
id: deep-learning-training
title: Training Neural Networks
code: TN
subtitle: 选择优化器、初始化、归一化、正则化和学习率调度。损失表现异常时再调试训练。
hue: 270
sources: phases/03-deep-learning-core/03-backpropagation, phases/03-deep-learning-core/04-activation-functions, phases/03-deep-learning-core/06-optimizers, phases/03-deep-learning-core/07-regularization, phases/03-deep-learning-core/08-weight-initialization, phases/03-deep-learning-core/09-learning-rate-schedules, phases/03-deep-learning-core/13-debugging-neural-networks
source_hash: 1b7829256d417a05
---

## 一次 AdamW 更新
type: architecture
from: phases/03-deep-learning-core/06-optimizers/docs/en.md

```arch
node | loss | 1,1 | Loss | forward pass output
node | bwd | 2,1 | loss.backward() | chain rule fills grads
node | clip | 3,1 | clip_grad_norm_ | max_norm=1.0
node | m | 1,2 | First moment m_t | mean, beta1 0.9
node | v | 2,2 | Second moment v_t | variance, beta2 0.999
node | hat | 3,2 | Bias correction | divide by 1 - beta^t
node | upd | 2,3 | Adam update | lr · m̂ / (√v̂ + ε)
node | wd | 3,3 | Decoupled decay | minus lr · λ · w
edge | loss | bwd |
edge | bwd | clip |
edge | clip | m |
edge | clip | v |
edge | m | hat |
edge | v | hat |
edge | hat | upd |
edge | upd | wd | AdamW
```

## 训练步
type: flow
from: phases/03-deep-learning-core/06-optimizers/docs/en.md

1. **zero_grad**：清除上一个 batch 的梯度。
2. **前向**：在该 batch 上运行模型。
3. **损失**：比较输出与目标。
4. **backward**：计算每个参数的梯度。
5. **裁剪**：限制全局梯度范数。这一步可选。
6. **step**：优化器更新权重。
7. **调度**：`scheduler.step()` 在 `optimizer.step()` 之后。

## 使用 AdamW 与余弦调度的训练循环
type: annotated-code
lang: python
from: phases/03-deep-learning-core/06-optimizers/docs/en.md, phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md

```python
optimizer = optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.01)
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100)
for epoch in range(100):
    optimizer.zero_grad()                  # clear old gradients
    output = model(torch.randn(32, 784))   # forward pass
    loss = torch.nn.functional.cross_entropy(output, torch.randint(0, 10, (32,)))
    loss.backward()                        # fill .grad by chain rule
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    optimizer.step()                       # update the weights
    scheduler.step()                       # after optimizer.step()
# Warmup then cosine, from the HuggingFace library
scheduler = get_cosine_schedule_with_warmup(
    optimizer, num_warmup_steps=2000, num_training_steps=100000)
```

## 关键公式
type: concepts
from: phases/03-deep-learning-core/03-backpropagation/docs/en.md, phases/03-deep-learning-core/06-optimizers/docs/en.md, phases/03-deep-learning-core/07-regularization/docs/en.md, phases/03-deep-learning-core/08-weight-initialization/docs/en.md, phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md

- **链式法则**：$\frac{dy}{dx} = f'(g(x)) \cdot g'(x)$
- **Adam 矩估计**：$m_t = \beta_1 m_{t-1} + (1 - \beta_1) \cdot \text{gradient}$ 与 $v_t = \beta_2 v_{t-1} + (1 - \beta_2) \cdot \text{gradient}^2$
- **偏差修正**：$\hat{m} = \frac{m_t}{1 - \beta_1^t}$ 与 $\hat{v} = \frac{v_t}{1 - \beta_2^t}$
- **AdamW 更新**：$w = w - \text{lr} \cdot \frac{\hat{m}}{\sqrt{\hat{v}} + \epsilon} - \text{lr} \cdot \lambda w$
- **余弦衰减**：$\text{lr}(t) = \text{lr}_{\min} + 0.5 \cdot (\text{lr}_{\max} - \text{lr}_{\min}) \cdot \left(1 + \cos\left(\frac{\pi t}{T}\right)\right)$
- **线性 warmup**：$\text{lr}(t) = \text{lr}_{\max} \cdot \frac{t}{\text{warmup\_steps}} \quad \text{for } t < \text{warmup\_steps}$
- **初始化方差**：Kaiming $\mathrm{Var}(w) = \frac{2}{\text{fan}_{\text{in}}}$，Xavier $\mathrm{Var}(w) = \frac{2}{\text{fan}_{\text{in}} + \text{fan}_{\text{out}}}$
- **Inverted dropout**：训练时 $\text{output} = \text{activation}(z) \cdot \text{mask} / (1 - p)$

## 按情况选择
type: command-table
from: phases/03-deep-learning-core/06-optimizers/docs/en.md, phases/03-deep-learning-core/08-weight-initialization/docs/en.md

| 情况 | 选择 |
|---|---|
| Transformer 或 LLM | AdamW, lr=1e-4, wd=0.01-0.1 |
| CNN 或 ResNet | SGD + Momentum, lr=0.1, momentum=0.9 |
| GAN | Adam, lr=2e-4, beta1=0.5 |
| 微调 | AdamW, lr=2e-5, wd=0.01 |
| 还不确定 | AdamW, lr=3e-4, wd=0.01 |
| Sigmoid 或 tanh 层 | Xavier 初始化 |
| ReLU、GELU 或 Swish 层 | Kaiming 初始化 |
| Transformer 残差层 | 按 1/sqrt(2N) 缩放，N 为层数 |

## 代码中的初始化、归一化与正则化
type: task-table
from: phases/03-deep-learning-core/08-weight-initialization/docs/en.md, phases/03-deep-learning-core/07-regularization/docs/en.md, phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md, phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md

| 任务 | 代码 |
|---|---|
| 面向 ReLU 的 Kaiming 初始化 | `nn.init.kaiming_normal_(layer.weight, nonlinearity='relu')` |
| Xavier 初始化 | `nn.init.xavier_uniform_(layer.weight)` |
| Linear 之后接 BatchNorm | `nn.BatchNorm1d(256)` |
| Transformer 中的 LayerNorm | `nn.LayerNorm(d_model)` |
| MLP 中的 Dropout | `nn.Dropout(0.3)` |
| 余弦衰减到下限 | `CosineAnnealingLR(optimizer, T_max=1000, eta_min=1e-5)` |
| 找到第一个 NaN 或 Inf | `with torch.autograd.detect_anomaly():` |
| 测量梯度范数 | `torch.nn.utils.clip_grad_norm_(model.parameters(), float("inf"))` |

## 优化器默认值
type: defaults
from: phases/03-deep-learning-core/06-optimizers/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Adam lr | 0.001 | 首先调整 lr |
| beta1 | 0.9 | 几乎从不修改 |
| beta2 | 0.999 | 如有需要，第二个调整 |
| epsilon | 1e-8 | 几乎从不修改 |
| AdamW weight_decay | 0.01 | 不受自适应速率缩放 |
| SGD momentum | 0.9 | 约等于最近 10 个梯度 |
| CNN 上的 SGD 权重衰减 | 1e-4 | 配合阶梯或余弦调度 |
| 梯度裁剪 max_norm | 1.0 | 按全局范数裁剪 |

## 正则化与调度默认值
type: defaults
from: phases/03-deep-learning-core/07-regularization/docs/en.md, phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md, phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Dropout，Transformer | 0.1 | 使用 LayerNorm 的模型 |
| Dropout，MLP | 0.5 | 关掉一半神经元 |
| BatchNorm momentum | 0.1 | 90% 旧值加 10% 新值 |
| BatchNorm eps | 1e-5 | 加到方差上 |
| Warmup 占比 | 3-5% | 占总步数 |
| 余弦下限 eta_min | 1e-5 | 最低 lr |
| 阶梯衰减系数 | 0.1 | 在固定 epoch 处 |
| 对数截断 eps | 1e-7 | 让 log(p) 保持有限 |

## 故障排查
type: troubleshooting
from: phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md, phases/03-deep-learning-core/03-backpropagation/docs/en.md, phases/03-deep-learning-core/08-weight-initialization/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 损失停在 -log(1/num_classes) | 模型预测均匀分布 | 检查数据流水线和标签 |
| 几步之后损失变成 NaN | 学习率过高 | 把 lr 降低 10x |
| 损失一开始就是 NaN | log(0) 或除以零 | 把预测截断到 [eps, 1-eps] |
| 损失来回震荡 | 没有 `optimizer.zero_grad()` | 在 `loss.backward()` 之前调用它 |
| 测试准确率每次运行都不同 | 没有 `model.eval()` | 加上 `model.eval()` 和 `torch.no_grad()` |
| 训练准确率高，测试准确率低 | 过拟合 | dropout、权重衰减、更多数据 |
| 梯度全为零 | ReLU 死亡或计算图被断开 | LeakyReLU，检查 `.requires_grad` |
| 浅层停止学习 | sigmoid 导数最大只有 0.25 | ReLU 或 GELU 配合 Kaiming 初始化 |

## 术语表
type: glossary
from: phases/03-deep-learning-core/06-optimizers/docs/en.md, phases/03-deep-learning-core/07-regularization/docs/en.md, phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md, phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md

- **SGD**：在 mini-batch 上的随机梯度下降。
- **AdamW**：权重衰减解耦的 Adam。
- **BatchNorm**：在 mini-batch 维度上归一化每个特征。
- **LayerNorm**：在特征维度上归一化每个样本。
- **RMSNorm**：不减均值的 LayerNorm。
- **1cycle**：lr 在一个周期内先升后降。
- **SGDR**：带热重启的余弦退火。
- **LR 范围测试**：在一次短训练中逐步提高 lr，找出损失发散的位置。

## 问答
type: qa
from: phases/03-deep-learning-core/06-optimizers/docs/en.md, phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md, phases/03-deep-learning-core/07-regularization/docs/en.md, phases/03-deep-learning-core/08-weight-initialization/docs/en.md

- **为什么用 AdamW 而不是 Adam 加 L2？** Adam 会用自适应速率缩放 L2 项。AdamW 让每个权重按相同比例收缩。
- **为什么需要 warmup？** Adam 的矩从零开始。早期的大步长依据的是糟糕的统计量。
- **为什么需要偏差修正？** 第 1 步、beta1 为 0.9 时，m 只有梯度的 0.1 倍。
- **Transformer 为什么用 LayerNorm？** 它不依赖 batch 大小或序列长度。
- **ReLU 为什么用 Kaiming？** ReLU 把一半激活置零，所以方差为 2/fan_in。

## 提示
type: tips
from: phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md, phases/03-deep-learning-core/06-optimizers/docs/en.md

- 先做单 batch 过拟合测试。损失必须降到接近零。
- 在怪罪其他因素之前，先试 3 个相差 10x 的学习率。
- 如果只调一个超参数，就调学习率。
- 调试时在每个操作之后打印张量形状。
- 检查各层的梯度大小是否相近。
- 对模型和数据使用 `.to(device)`。
