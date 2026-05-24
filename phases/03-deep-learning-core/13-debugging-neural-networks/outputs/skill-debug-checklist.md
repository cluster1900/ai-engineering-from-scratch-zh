---
name: skill-debug-checklist
description: 用于调试 Neural Network training 失败的决策树清单
version: 1.0.0
phase: 3
lesson: 13
tags: [debugging, neural-networks, training, diagnostics, deep-learning]
---

# Neural Network 调试清单

当 training 出问题时使用的系统化调试协议。按顺序完成这些步骤 -- 大多数 bug 都会在前 3 步中被发现。

## Training 之前（预防 bug）

1. 打印模型架构和参数数量。这个规模对你的数据来说合理吗？
2. 用随机输入运行一次 forward pass。输出 shape 是否与你的 target shape 匹配？
3. 检查 labels 是否为正确的 dtype（CrossEntropyLoss 需要 Long，BCELoss 需要 Float）
4. 验证数据归一化：inputs 的 mean 应接近 0，std 应接近 1
5. 打印 5 组随机的 (input, label)。labels 是否符合你的预期？
6. 确认 train/test split 中没有重复样本

## Overfit-one-batch 测试（60 秒，能抓到 80% 的 bug）

1. 从 training set 中取 8-32 个样本
2. 用合理的 learning rate 训练 200 步
3. Loss 应接近 0。Training accuracy 应达到 100%
4. 如果失败：bug 在你的模型、Loss Function 或 training loop 中 -- 不在你的数据或 hyperparameters 中
5. 如果通过：继续进行完整 training

## Loss 不下降

1. 检查 learning rate。尝试 3 个值：current/10、current、current*10
2. 打印每层的 Gradient norms。全为 0 表示网络已死或 graph 被 detached
3. 检查参数上的 `requires_grad=True`。检查是否调用了 `loss.backward()`
4. 检查是否在 `loss.backward()` 之前调用了 `optimizer.zero_grad()`
5. 检查是否在 `loss.backward()` 之后调用了 `optimizer.step()`
6. 验证模型参数是否传给了 Optimizer：`optimizer = Adam(model.parameters())`

## Loss 是 NaN 或 Inf

1. 将 learning rate 降低 10 倍
2. 给所有 log() 调用添加 epsilon：`torch.log(x + 1e-7)`
3. 给所有除法添加 epsilon：`x / (y + 1e-8)`
4. 在 BCE loss 之前 clamp predictions：`torch.clamp(pred, 1e-7, 1 - 1e-7)`
5. 使用 `torch.autograd.detect_anomaly()` 找到确切的操作
6. 检查 input data 中是否存在 NaN：`assert not torch.isnan(x).any()`

## Loss 振荡

1. 将 learning rate 降低 3-10 倍
2. 增大 batch size（减少 Gradient noise）
3. 添加 Gradient clipping：`torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)`
4. 从 SGD 切换到 Adam（每个参数使用自适应 LR）
5. 在 training 的前 5-10% 添加 learning rate warmup

## 过拟合（train acc 高，test acc 低）

1. 添加 dropout（从 p=0.1 开始，增加到 0.5）
2. 给 Optimizer 添加 weight decay：`Adam(params, weight_decay=1e-4)`
3. 减小模型规模（更少的层或更窄的层）
4. 添加 data augmentation
5. 使用 early stopping：当 validation loss 连续 5+ 个 epochs 上升时停止
6. 检查 train 和 test sets 之间是否存在 data leakage

## 欠拟合（train 和 test acc 都低）

1. 增加模型 capacity（更多层、更宽层）
2. 训练更多 epochs
3. 提高 learning rate（谨慎）
4. 暂时移除 regularization，以验证模型是否能够学习
5. 检查你的模型对任务来说是否有足够的表达能力

## 死 ReLU neurons

1. 检查每层 zero activations 的比例。>50% 就是问题
2. 切换到 LeakyReLU(0.01) 或 GELU
3. 对 weights 使用 Kaiming initialization
4. 降低 learning rate（过大的 updates 会把 neurons 推入 dead zone）
5. 在 activation functions 之前添加 batch normalization

## 快速参考：learning rate 起点

| Optimizer | 任务 | 起始 LR |
|-----------|------|------------|
| Adam | 从零开始 training | 1e-3 |
| Adam | Fine-tuning pretrained | 1e-5 |
| SGD + momentum | 从零开始 training | 1e-1 |
| SGD + momentum | Fine-tuning pretrained | 1e-3 |
| AdamW | Transformer training | 3e-4 |

## 快速参考：batch size 影响

| Batch size | Gradient noise | Memory | Generalization |
|-----------|---------------|--------|---------------|
| 8-16 | 高（噪声大） | 低 | 通常更好 |
| 32-64 | 中等 | 中等 | 良好的默认值 |
| 128-256 | 低（平滑） | 高 | 可能需要 warmup |
| 512+ | 非常低 | 非常高 | 需要 LR scaling |

## 当什么都不起作用时

1. 将模型简化为 1 个 hidden layer。它能学习吗？
2. 将数据简化为 100 个样本。它会过拟合吗？
3. 将你的 Loss 替换为 MSE。它会收敛吗？
4. 将你的 Optimizer 替换为 SGD(lr=0.01)。它有进展吗？
5. 将你的数据替换为 synthetic data（例如，y = x[0] > 0）。它能学习吗？
6. 如果这些都不起作用：bug 在你没有查看的代码中（data loading、preprocessing、tensor shapes）
