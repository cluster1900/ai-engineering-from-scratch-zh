---
id: cnn-architectures
title: CNN Architectures and Transfer Learning
code: CA
subtitle: 计算卷积尺寸，从 LeNet 搭到 ResNet，训练分类器，并微调预训练骨干网络。PyTorch 与 NumPy。
hue: 15
sources: phases/04-computer-vision/02-convolutions-from-scratch, phases/04-computer-vision/03-cnns-lenet-to-resnet, phases/04-computer-vision/04-image-classification, phases/04-computer-vision/05-transfer-learning
source_hash: d153dcbc9565a455
---

## 公式
type: concepts
from: phases/04-computer-vision/02-convolutions-from-scratch/docs/en.md, phases/04-computer-vision/03-cnns-lenet-to-resnet/docs/en.md, phases/04-computer-vision/04-image-classification/docs/en.md, phases/04-computer-vision/05-transfer-learning/docs/en.md

- **输出尺寸**：$H_{out} = \lfloor (H - K + 2P) / S \rfloor + 1$
- **Same 填充**：奇数 $K$ 且 $S = 1$ 时 $P = (K - 1) / 2$。
- **卷积参数量**：`C_out * C_in * K * K + C_out`。最后一项是偏置。
- **感受野**：$L$ 个步长为 1 的卷积堆叠时为 $1 + L (K - 1)$。
- **两个 3x3 还是一个 5x5**：视野同为 5x5。参数量 $18C^2$ 对比 $25C^2$。
- **残差块**：$y = F(x) + x$。当 $F(x) = 0$ 时该块学到恒等映射。
- **交叉熵**：在原始 logits 上为 $-z_y + \log \sum_j \exp(z_j)$。
- **逐层学习率衰减**：$\mathrm{lr}_k = \mathrm{base} \cdot \mathrm{decay}^{L - k}$

## 四大家族
type: concepts
from: phases/04-computer-vision/03-cnns-lenet-to-resnet/docs/en.md

- **LeNet-5（1998）**：卷积、平均池化、全连接、tanh。60,000 个参数。
- **AlexNet（2012）**：ReLU、dropout、5 个卷积层和 3 个全连接层。60M 参数。
- **VGG（2014）**：只用 3x3 卷积，16 或 19 层。138M 参数。
- **Inception（2014）**：1x1、3x3、5x5 和池化并行，然后拼接。
- **ResNet（2015）**：恒等跳跃连接。100+ 层也能训练。
- **BasicBlock**：两个 3x3 卷积加一条跳跃连接。ResNet-18 和 ResNet-34。
- **Bottleneck**：1x1 降维、3x3、1x1 升维。ResNet-50、-101、-152。
- **ResNet-18 或 VGG-16**：11.7M 或 138M 参数。Top-1 为 69.8% 或 71.6%。

## 面向 32x32 输入的 TinyResNet
type: architecture
from: phases/04-computer-vision/03-cnns-lenet-to-resnet/docs/en.md, phases/04-computer-vision/03-cnns-lenet-to-resnet/code/main.py

```arch
node | in | 1,1 | Input | (1, 3, 32, 32)
node | stem | 2,1 | stem | 3x3 conv, 32 ch, BN, ReLU
node | l1 | 3,1 | layer1 | 2 BasicBlocks, 32 ch
node | l2 | 4,1 | layer2 | stride 2, 64 ch
node | l3 | 4,2 | layer3 | stride 2, 128 ch
node | l4 | 3,2 | layer4 | stride 2, 256 ch
node | head | 2,2 | head | AdaptiveAvgPool2d, Linear
node | out | 1,2 | Logits | 10 classes
edge | in | stem |
edge | stem | l1 |
edge | l1 | l2 |
edge | l2 | l3 |
edge | l3 | l4 |
edge | l4 | head |
edge | head | out |
```

## ResNet BasicBlock
type: annotated-code
lang: python
from: phases/04-computer-vision/03-cnns-lenet-to-resnet/docs/en.md, phases/04-computer-vision/03-cnns-lenet-to-resnet/code/main.py

```python
self.conv1 = nn.Conv2d(in_c, out_c, kernel_size=3, stride=stride, padding=1, bias=False)  # BN beta holds the bias
self.conv2 = nn.Conv2d(out_c, out_c, kernel_size=3, stride=1, padding=1, bias=False)
if stride != 1 or in_c != out_c:
    self.shortcut = nn.Sequential(
        nn.Conv2d(in_c, out_c, kernel_size=1, stride=stride, bias=False),
        nn.BatchNorm2d(out_c))               # 1x1 conv matches the shape
else:
    self.shortcut = nn.Identity()            # no-op skip
out = F.relu(self.bn1(self.conv1(x)))
out = self.bn2(self.conv2(out))              # no ReLU before the add
out = out + self.shortcut(x)                 # F(x) + x
return F.relu(out)
```

## 代码中的任务
type: task-table
from: phases/04-computer-vision/02-convolutions-from-scratch/code/main.py, phases/04-computer-vision/04-image-classification/code/main.py, phases/04-computer-vision/05-transfer-learning/code/main.py

| 任务 | 代码 |
|---|---|
| 单个卷积的输出尺寸 | `output_size(h_in, k, p, s)` |
| 堆叠的感受野 | `receptive_field(layers)` |
| 把卷积写成一次矩阵乘 | `conv2d_im2col(x, w, b, padding=1)` |
| 应用手写卷积核 | `apply_kernel(x[0], KERNELS["sobel_x"])` |
| 混合一个 batch | `mixup_batch(x, y, num_classes, alpha=0.2)` |
| 软标签上的损失 | `soft_cross_entropy(logits, soft_targets)` |
| 冻结骨干，换新头 | `make_feature_extractor(num_classes=10)` |
| 保留 BN 运行统计量 | `freeze_bn_stats(model)` |

## 一个训练 epoch
type: flow
from: phases/04-computer-vision/04-image-classification/docs/en.md

1. **增强**：`random_hflip()` 和 `random_crop(pad=4)`，使用反射填充。只用于训练集。
2. **归一化**：`standardize(mean, std)`，使用你训练集的均值和标准差。
3. **DataLoader**：训练用 `shuffle=True`，验证用 `shuffle=False`。
4. **模型**：先 `model.train()`。模型输出原始 logits (N, C)。
5. **损失**：mixup 时用 `soft_cross_entropy`，否则用 `cross_entropy` 配合 `label_smoothing=0.1`。
6. **更新步**：`optimizer.zero_grad()`、`loss.backward()`、`optimizer.step()`。
7. **指标**：累加 `loss.item()`，这样不会有计算图保持存活。
8. **Epoch 结束**：`scheduler.step()`。然后 `model.eval()`，并在 `torch.no_grad` 下评估。

## 用分层学习率微调
type: annotated-code
lang: python
from: phases/04-computer-vision/05-transfer-learning/docs/en.md, phases/04-computer-vision/05-transfer-learning/code/main.py

```python
model = resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)
model.fc = nn.Linear(model.fc.in_features, 10)   # new head
groups = discriminative_param_groups(model, base_lr=1e-3, decay=0.3)
optimizer = SGD(groups, momentum=0.9, weight_decay=1e-4, nesterov=True)
scheduler = CosineAnnealingLR(optimizer, T_max=epochs)
for epoch in range(epochs):
    model.train()
    if freeze_bn:
        freeze_bn_stats(model)                    # after model.train()
start, unfreeze = progressive_unfreeze_schedule(model)
start()                                           # only fc trains
unfreeze(epoch)                                   # layer4 first, then layer3
```

## 选择迁移方案
type: concepts
from: phases/04-computer-vision/05-transfer-learning/docs/en.md

- **< 1k 张图像，接近 ImageNet**：冻结骨干，只训练头。
- **1k-10k，接近**：冻结前 2-3 个 stage，微调其余部分。
- **10k-100k，任意领域**：用分层学习率端到端微调。
- **100k+，领域差异大**：微调全部参数。可以考虑从头训练。
- **BN，>= 5k 个样本**：BN 保持 train 模式，更新其运行统计量。
- **BN，小数据集**：把 BN 冻结在 eval 模式，保留 ImageNet 统计量。
- **每张 GPU 的 batch 很小**：用 GroupNorm 替换 BN。
- **要替换的头**：`backbone.fc`（ResNet）、`backbone.classifier[1]`（EfficientNet、MobileNet）。

## 训练默认值
type: defaults
span: 1
from: phases/04-computer-vision/04-image-classification/docs/en.md, phases/04-computer-vision/05-transfer-learning/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| SGD `lr` | 0.1 | 从头训练 TinyResNet，10 个 epoch 余弦调度 |
| `momentum` | 0.9 | 配合 `nesterov=True` |
| `weight_decay` | 5e-4 | 微调时用 1e-4 |
| `label_smoothing` | 0.1 | 真实类别的目标值为 1-eps |
| Mixup `alpha` | 0.2 | lambda 取自 Beta(a, a) |
| `base_lr` | 1e-3 | fc 组。更早的 stage 更小 |
| `decay` | 0.3 | conv1 约为 0.00243 乘 `base_lr` |
| `batch_size` | 128 | 验证 loader 用 256 |

## 故障排查
type: troubleshooting
from: phases/04-computer-vision/03-cnns-lenet-to-resnet/docs/en.md, phases/04-computer-vision/04-image-classification/docs/en.md, phases/04-computer-vision/05-transfer-learning/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 梯度错误，曲线平坦 | 损失前先做了 softmax | 把原始 logits 传给 `CrossEntropyLoss` |
| 看起来像学习率不稳定 | 梯度在累积 | 每步调用 `optimizer.zero_grad()` |
| 准确率损失约 1% | 在 CIFAR-10 上用了 ImageNet 的均值和标准差 | 在你的训练集上计算统计量 |
| “6”变成了“9” | 增强改变了标签 | 使用更小的旋转范围 |
| 微调后反而不如只用预训练 | 学习率或 BN 有 bug | 使用分层学习率，检查 BN 模式 |
| 准确率悄无声息地损失 5-15% | BN 统计量来自另一分布 | 冻结 BN 统计量或改用 GroupNorm |
| 所有图像都被分到同一类 | 学习率破坏了预训练特征 | 降低骨干的学习率 |
| 深层的普通网络训练得更差 | 超过 ~20 层后出现退化 | 加上残差连接 |

## 问答
type: qa
from: phases/04-computer-vision/02-convolutions-from-scratch/docs/en.md, phases/04-computer-vision/03-cnns-lenet-to-resnet/docs/en.md, phases/04-computer-vision/04-image-classification/docs/en.md, phases/04-computer-vision/05-transfer-learning/docs/en.md

- **为什么用 3x3 卷积核？** 它是有中心的最小奇数卷积核。
- **不用池化如何下采样？** 使用带 `stride=2` 的卷积。它把 H 和 W 减半。
- **为什么 mixup 会让训练损失上升？** 目标是软的。测试准确率会上升。
- **迁移实验要报哪两个数？** 只用预训练是下限，微调后是上限。
- **为什么浅层用更小的学习率？** 它们保存的是通用的边缘和纹理特征。
- **什么时候重建优化器？** 每次可训练参数集合发生变化时。

## 卷积层形状
type: annotated-code
lang: python
from: phases/04-computer-vision/02-convolutions-from-scratch/docs/en.md

```python
conv = nn.Conv2d(in_channels=3, out_channels=64, kernel_size=3, stride=1, padding=1)
tuple(conv.weight.shape)                    # (C_out, C_in, K, K)
sum(p.numel() for p in conv.parameters())   # 64 * 3 * 3 * 3 + 64 = 1,792
y = conv(torch.randn(8, 3, 224, 224))       # padding=0 gives 222x222
```
