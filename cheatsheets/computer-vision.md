---
id: computer-vision
title: Computer Vision
code: CV
subtitle: 对图像做预处理、卷积、分类、微调、检测、分割和切块。来自课程的 PyTorch 与 NumPy 代码。
hue: 5
sources: phases/04-computer-vision/01-image-fundamentals, phases/04-computer-vision/02-convolutions-from-scratch, phases/04-computer-vision/03-cnns-lenet-to-resnet, phases/04-computer-vision/04-image-classification, phases/04-computer-vision/05-transfer-learning, phases/04-computer-vision/06-object-detection-yolo, phases/04-computer-vision/07-semantic-segmentation-unet, phases/04-computer-vision/08-instance-segmentation-mask-rcnn, phases/04-computer-vision/14-vision-transformers
source_hash: 39d79137b3c784bf
---

## Mask R-CNN 流水线
type: architecture
from: phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md

```arch
node | img | 1,1 | Input image | list of (3, H, W)
node | bb | 2,1 | ResNet backbone | strides 4, 8, 16, 32
node | fpn | 3,1 | FPN | top down + lateral
node | rpn | 4,1 | RPN | about 1000 proposals
node | roi | 3,2 | RoIAlign | bilinear, no rounding
node | box | 2,2 | Box head | class + refine
node | mask | 4,2 | Mask head | 28x28 per class
node | nms | 1,2 | NMS | boxes, labels, masks
edge | img | bb |
edge | bb | fpn |
edge | fpn | rpn |
edge | fpn | roi | features
edge | rpn | roi | top K
edge | roi | box |
edge | roi | mask |
edge | box | nms |
```

## 为预训练模型做预处理
type: flow
from: phases/04-computer-vision/01-image-fundamentals/docs/en.md

1. **解码**：文件变成 `[0, 255]` 中的 `uint8` HWC。
2. **颜色**：转换为 RGB。输入 BGR 大约会损失十个百分点。
3. **浮点与布局**：除以 255，再把 HWC 转为 NCHW。
4. **缩放**：短边缩放到 256，双线性插值。
5. **裁剪**：中心裁剪到 224x224。
6. **标准化**：减去 ImageNet 均值，再除以标准差。
7. **模型**：此时输入与训练时的输入一致。

## 关键公式
type: concepts
from: phases/04-computer-vision/02-convolutions-from-scratch/docs/en.md, phases/04-computer-vision/03-cnns-lenet-to-resnet/docs/en.md, phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md, phases/04-computer-vision/04-image-classification/docs/en.md

- **输出尺寸**：$H_{\text{out}} = \left\lfloor \frac{H - K + 2P}{S} \right\rfloor + 1$
- **Same 填充**：奇数 $K$ 且 $S = 1$ 时 $P = (K - 1) / 2$
- **卷积参数量**：$C_{\text{out}} \cdot C_{\text{in}} \cdot K \cdot K + C_{\text{out}}$
- **感受野**：$L$ 个步长为 1 的卷积堆叠时为 $1 + L \cdot (K - 1)$
- **残差**：$y = F(x) + x$
- **IoU**：$\mathrm{IoU}(A, B) = \frac{\mathop{\mathrm{area}}(A \cap B)}{\mathop{\mathrm{area}}(A \cup B)}$
- **Dice**：$\frac{2 \sum (p \cdot y)}{\sum p + \sum y + \epsilon}$，且 $\text{Dice} = 2 \cdot \text{IoU} / (1 + \text{IoU})$
- **YOLO 解码**：$x = (\sigma(t_x) + \text{cell}_x) \cdot \text{stride}$，$w = \text{anchor}_w \cdot \exp(t_w)$

## 代码中的任务
type: task-table
from: phases/04-computer-vision/01-image-fundamentals/docs/en.md, phases/04-computer-vision/02-convolutions-from-scratch/docs/en.md, phases/04-computer-vision/04-image-classification/docs/en.md, phases/04-computer-vision/05-transfer-learning/docs/en.md, phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md, phases/04-computer-vision/14-vision-transformers/docs/en.md

| 任务 | 代码 |
|---|---|
| HWC 转 CHW | `img_hwc.permute(2, 0, 1)` |
| 尺寸不变的 3x3 卷积 | `nn.Conv2d(in_channels=3, out_channels=64, kernel_size=3, stride=1, padding=1)` |
| 带标签平滑的损失 | `nn.CrossEntropyLoss(label_smoothing=0.1)` |
| 替换 ResNet 的头 | `model.fc = nn.Linear(model.fc.in_features, num_classes)` |
| 任意家族的预训练骨干 | `timm.create_model("resnet50", pretrained=True, num_classes=10)` |
| 去除重复框 | `nms(boxes, scores, iou_threshold=0.45)` |
| 带预训练编码器的 U-Net | `smp.Unet(encoder_name="resnet34", encoder_weights="imagenet", in_channels=3, classes=3)` |
| 预训练 ViT | `timm.create_model("vit_base_patch16_224", pretrained=True, num_classes=10)` |

## ViT 前向传播
type: annotated-code
lang: python
from: phases/04-computer-vision/14-vision-transformers/code/main.py, phases/04-computer-vision/14-vision-transformers/docs/en.md

```python
self.proj = nn.Conv2d(in_channels, dim, kernel_size=patch_size, stride=patch_size)
self.cls_token = nn.Parameter(torch.zeros(1, 1, dim))  # one learned token
self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, dim))  # learned
x = self.proj(x)                                 # (N, dim, 14, 14) at 224 px
x = x.flatten(2).transpose(1, 2)                 # (N, 196, dim) tokens
cls = self.cls_token.expand(x.size(0), -1, -1)
x = torch.cat([cls, x], dim=1)                   # (N, 197, dim)
x = x + self.pos_embed                           # add position
normed = self.ln1(x)                             # pre-LN
a, _ = self.attn(normed, normed, normed, need_weights=False)
x = x + a                                        # residual
x = x + self.mlp(self.ln2(x))                    # D to 4D to D, GELU
return self.head(self.ln(x[:, 0]))               # classify from [CLS]
```

## 形状
type: command-table
from: phases/04-computer-vision/01-image-fundamentals/docs/en.md, phases/04-computer-vision/02-convolutions-from-scratch/docs/en.md, phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md, phases/04-computer-vision/14-vision-transformers/docs/en.md

| 张量 | 形状 |
|---|---|
| 解码后的图像 | `(H, W, 3)`，uint8 |
| 模型输入 | `(N, 3, 224, 224)`，float32 |
| 卷积权重 | `(C_out, C_in, K, K)` |
| YOLO 头输出 | `(N, H, W, num_anchors, 5 + C)` |
| 分割 logits | `(N, C, H, W)`，目标 `(N, H, W)` |
| Mask R-CNN 掩码 | `(N, 1, H, W)`，取值在 [0, 1] |
| 224 px 时的 ViT token | `(197, 768)`，含 [CLS] |

## 默认值与数字
type: defaults
from: phases/04-computer-vision/01-image-fundamentals/docs/en.md, phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/04-image-classification/docs/en.md, phases/04-computer-vision/14-vision-transformers/docs/en.md, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| ImageNet 均值 | 0.485, 0.456, 0.406 | 基于 [0, 1] 像素 |
| ImageNet 标准差 | 0.229, 0.224, 0.225 | 逐通道 |
| NMS iou_threshold | 0.45 | RPN 使用 0.7 |
| conf_threshold | 0.25 | objectness 乘以类别分数 |
| lambda_noobj | 0.5 | lambda_coord 为 5.0，YOLOv1 的比例 |
| Mixup alpha | 0.2 | lam 取自 Beta(alpha, alpha) |
| ViT patch 大小 | 16 | 224 px 时 196 个 token |
| MAE 掩码比例 | 75% | 编码器看到 25% |

## 骨干网络
type: command-table
from: phases/04-computer-vision/03-cnns-lenet-to-resnet/docs/en.md, phases/04-computer-vision/14-vision-transformers/docs/en.md, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md

| 模型 | 规模与思路 |
|---|---|
| LeNet-5 | 61,706 个参数。卷积、池化、全连接 |
| AlexNet | 60M。ReLU、dropout、深度 |
| VGG-16 | 138M。只用 3x3 卷积 |
| ResNet-18 | 11.7M。恒等跳跃连接，top-1 69.8% |
| ViT-B/16 | 86M。12 个块，12 个头，维度 768 |
| Mask R-CNN R50 FPN | 46M。91 个 COCO 类别 |

## 故障排查
type: troubleshooting
from: phases/04-computer-vision/01-image-fundamentals/docs/en.md, phases/04-computer-vision/04-image-classification/docs/en.md, phases/04-computer-vision/05-transfer-learning/docs/en.md, phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 输出是乱的，但没有报错 | 原始 uint8 直接送进模型 | 除以 255，再标准化 |
| 第一层卷积把高度当成通道 | 输入是 HWC | `permute(2, 0, 1)` 转为 CHW |
| 梯度错误，但没有报错 | 交叉熵之前做了 softmax | 传入原始 logits |
| 损失不稳定 | 每步没有 `zero_grad()` | 在 `backward()` 之前调用它 |
| 微调后不如线性探针 | 学习率或 BN 有 bug | 分层学习率，`freeze_bn_stats` |
| 像素准确率 99%，掩码却没用 | 类别不平衡 | 在损失中加入 Dice |
| 棋盘格伪影 | 转置卷积 | 双线性上采样 + 3x3 卷积 |
| 头少了一个类别 | 没有计入背景 | `num_classes` = 类别数 + 1 |

## 缩写
type: glossary
from: phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md, phases/04-computer-vision/14-vision-transformers/docs/en.md

- **IoU**：Intersection over Union（交并比）。两个框或掩码的重叠程度。
- **NMS**：Non-maximum suppression（非极大值抑制）。保留得分最高的框，去掉重叠框。
- **mAP@0.5:0.95**：COCO AP。在 IoU 0.5 到 0.95、步长 0.05 上取平均。
- **mIoU**：各类别 IoU 的平均。分割的标准指标。
- **FPN**：Feature Pyramid Network（特征金字塔网络）。每个步长上都有语义特征。
- **RPN**：Region Proposal Network（区域提议网络）。对每个 anchor 判断有无目标。
- **ViT**：Vision Transformer。把 patch 当作 token。
- **MAE**：Masked Autoencoder（掩码自编码器）。遮住 75% 的 patch，再重建。

## 问答
type: qa
from: phases/04-computer-vision/02-convolutions-from-scratch/docs/en.md, phases/04-computer-vision/03-cnns-lenet-to-resnet/docs/en.md, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md, phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/14-vision-transformers/docs/en.md

- **为什么到处都用 3x3？** 两个 3x3 卷积能看到 5x5，参数为 $18C^2$ 而不是 $25C^2$。
- **为什么用残差？** 块可以学到恒等映射，于是加深不再有害。
- **为什么用 RoIAlign 而不是 RoIPool？** 没有取整。在 COCO 上带来 3 到 4 个点的掩码 AP。
- **为什么用 anchor？** 头只需预测相对先验框的小偏移。
- **ViT 为什么用 pre-LN？** 不用 warmup 也能训练深层堆叠。

## 提示
type: tips
from: phases/04-computer-vision/04-image-classification/docs/en.md, phases/04-computer-vision/05-transfer-learning/docs/en.md, phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md, phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/01-image-fundamentals/docs/en.md

- 在你自己的训练集上计算均值和标准差。
- 掩码和标签图用最近邻缩放。
- 每次迁移实验都打印线性探针和微调后的准确率。
- 可训练参数集合变化时重建优化器。
- 按类别报告 IoU，而不只报告 mIoU。
- 同时报告精确率、召回率、AP@0.5 和 mAP@0.5:0.95。
