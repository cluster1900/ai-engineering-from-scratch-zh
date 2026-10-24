---
id: detection-segmentation
title: Detection and Segmentation Compared
code: DC
subtitle: 边界框、像素掩码、实例掩码、关键点与文本提示掩码。输出、损失、指标与修复并排对比。
hue: 355
sources: phases/04-computer-vision/06-object-detection-yolo, phases/04-computer-vision/07-semantic-segmentation-unet, phases/04-computer-vision/08-instance-segmentation-mask-rcnn, phases/04-computer-vision/21-keypoint-pose, phases/04-computer-vision/24-sam3-open-vocab-segmentation
source_hash: e1f1a8ff6ce84643
---

## 并排对比
type: comparison
from: phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md, phases/04-computer-vision/21-keypoint-pose/docs/en.md, phases/04-computer-vision/24-sam3-open-vocab-segmentation/docs/en.md

| 任务 | 输出 | 指标 |
|---|---|---|
| 检测（YOLO） | `(N, H, W, num_anchors, 5 + C)` | mAP@0.5:0.95, AP@0.5 |
| 语义分割（U-Net） | `(N, C, H, W)` | 每类 IoU、mIoU、Dice |
| 实例分割（Mask R-CNN） | `(N, 1, H, W)` | 掩码 AP 与框 mAP |
| 姿态（热力图） | `(N, K, H, W)` | OKS, PCK |
| 开放词表（SAM 3） | 框 + 标签 + 分数 + 掩码 + ID | 掩码 IoU |

## 何时选用
type: concepts
from: phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md, phases/04-computer-vision/21-keypoint-pose/docs/en.md, phases/04-computer-vision/24-sam3-open-vocab-segmentation/docs/en.md

- **YOLO 式检测器**：一次前向传播实时给出框和类别。
- **U-Net 语义分割**：每个像素一个类别。两辆挨着的车会变成一团。
- **Mask R-CNN 实例分割**：每个物体一个掩码，即使物体同属一类。
- **全景分割**：每个像素都有类别，每个实例都有唯一 id。
- **自顶向下姿态估计**：精度最高。成本随人数增长。
- **自底向上姿态估计**：适合人群。无论人群多大，耗时恒定。
- **SAM 3**：一次前向传播即可为一个名词短语给出掩码和实例 ID。
- **Grounded SAM 2 或 YOLO-World**：需要换检测器或其他许可证时。YOLO-World 适合高 fps 下出框。

## Mask R-CNN
type: architecture
from: phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md

```arch
node | img | 1,1 | Input | image tensor | client
node | bb | 2,1 | ResNet backbone | strides 4, 8, 16, 32 | model
node | fpn | 3,1 | FPN | top-down + lateral
node | rpn | 4,1 | RPN | ~1000 proposals, NMS 0.7
node | ra | 4,2 | RoIAlign | bilinear, no rounding
node | bh | 3,2 | Box head | class + refine
node | mh | 2,2 | Mask head | 28x28 per class
node | out | 1,2 | Output | boxes + classes + masks
edge | img | bb |
edge | bb | fpn |
edge | fpn | rpn |
edge | rpn | ra | top-K proposals
edge | ra | bh | 7x7
edge | ra | mh | 14x14
edge | bh | out | NMS
edge | mh | out |
```

## YOLO 推理：后处理
type: flow
from: phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/06-object-detection-yolo/code/main.py

1. **头**：一个 1x1 卷积给出 `(N, H, W, num_anchors, 5 + C)`。
2. **拆包**：每个 anchor 包含 `tx, ty, tw, th, obj` 和 C 个类别 logit。
3. **打分**：`sigmoid(obj)` 乘以最佳类别的 sigmoid。
4. **阈值**：分数低于 `conf_threshold` 时丢弃该框。
5. **解码**：中心为 sigmoid 偏移加单元格坐标，再乘以 `stride`。尺寸为 anchor 乘以 `np.exp`。
6. **NMS**：`nms(boxes, scores, iou_threshold)` 为每个物体保留一个框。
7. **返回**：`boxes[keep], scores[keep], classes[keep]`。

## 公式
type: concepts
from: phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md, phases/04-computer-vision/21-keypoint-pose/docs/en.md

- **YOLO 输出**：$S \times S \times B(5 + C)$。VOC 取 S=13、B=2、C=20 时每个单元格 50 个值。
- **解码**：$c_x = (\sigma(t_x) + \mathrm{cell}_x) \cdot \mathrm{stride}$，$w = a_w e^{t_w}$
- **IoU**：交集面积除以并集面积。命中需要 IoU >= 0.5。
- **mAP@0.5:0.95**：在 IoU 0.5, 0.55, ..., 0.95 上的平均 AP。COCO 指标。
- **Dice**：$2 \sum p y / (\sum p + \sum y + \epsilon)$。损失为 1 - Dice。
- **由 IoU 求 Dice**：$\mathrm{Dice} = 2 \cdot \mathrm{IoU} / (1 + \mathrm{IoU})$
- **Mask R-CNN 损失**：rpn_cls + rpn_box + box_cls + box_reg + mask。
- **热力图目标**：$\exp(-((x - c_x)^2 + (y - c_y)^2) / 2\sigma^2)$

## 非极大值抑制
type: annotated-code
lang: python
from: phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/06-object-detection-yolo/code/main.py

```python
def nms(boxes, scores, iou_threshold=0.45):
    order = np.argsort(-scores)                  # best score first
    keep = []
    while len(order) > 0:
        i = order[0]
        keep.append(i)
        if len(order) == 1:
            break
        rest = order[1:]
        ious = box_iou(boxes[[i]], boxes[rest])[0]
        order = rest[ious <= iou_threshold]      # drop the overlaps
    return np.array(keep, dtype=np.int64)
```

## U-Net 损失
type: annotated-code
lang: python
from: phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md, phases/04-computer-vision/07-semantic-segmentation-unet/code/main.py

```python
def dice_loss(logits, targets, num_classes, eps=1e-6):
    probs = F.softmax(logits, dim=1)
    targets_one_hot = F.one_hot(targets, num_classes).permute(0, 3, 1, 2).float()
    dims = (0, 2, 3)                                    # batch, H, W
    intersection = (probs * targets_one_hot).sum(dim=dims)
    denom = probs.sum(dim=dims) + targets_one_hot.sum(dim=dims)
    dice = (2 * intersection + eps) / (denom + eps)     # eps for absent classes
    return 1 - dice.mean()                              # macro Dice
def combined_loss(logits, targets, num_classes, lam=1.0):
    ce = F.cross_entropy(logits, targets)               # (N, C, H, W) and (N, H, W)
    dc = dice_loss(logits, targets, num_classes)
    return ce + lam * dc, {"ce": ce.item(), "dice": dc.item()}
```

## 微调 Mask R-CNN
type: annotated-code
lang: python
from: phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/code/main.py

```python
model = maskrcnn_resnet50_fpn_v2(weights=MaskRCNN_ResNet50_FPN_V2_Weights.DEFAULT)
in_features = model.roi_heads.box_predictor.cls_score.in_features
model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)  # counts background
in_features_mask = model.roi_heads.mask_predictor.conv5_mask.in_channels
model.roi_heads.mask_predictor = MaskRCNNPredictor(in_features_mask, 256, num_classes)
for p in model.backbone.parameters():
    p.requires_grad = False                      # freezes the FPN too
loss_dict = model(images, targets)               # train mode: dict of losses
losses = sum(loss for loss in loss_dict.values())
binary_masks = (p['masks'] > 0.5).squeeze(1)     # eval mode: (N, H, W)
```

## 代码中的任务
type: task-table
from: phases/04-computer-vision/06-object-detection-yolo/code/main.py, phases/04-computer-vision/07-semantic-segmentation-unet/code/main.py, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/code/main.py, phases/04-computer-vision/21-keypoint-pose/code/main.py, phases/04-computer-vision/24-sam3-open-vocab-segmentation/code/main.py, phases/04-computer-vision/24-sam3-open-vocab-segmentation/docs/en.md

| 任务 | 代码 |
|---|---|
| 两两框 IoU | `box_iou(boxes_a, boxes_b)` |
| 头输出转为框 | `postprocess(pred_tensor, anchors, stride)` |
| 每个类别的 IoU | `iou_per_class(logits, targets, num_classes)` |
| 从特征图中裁出一个框 | `roi_align_single(feature, box)` |
| 热力图转为 (x, y) | `heatmap_to_coords(heatmaps)` |
| 亚像素关键点 | `subpixel_refine(heatmaps)` |
| 把句子拆成概念 | `split_concepts(sentence)` |
| SAM 3 文本提示 | `processor.set_text_prompt(inputs, "<concept>")` |

## 默认值
type: defaults
from: phases/04-computer-vision/06-object-detection-yolo/code/main.py, phases/04-computer-vision/07-semantic-segmentation-unet/code/main.py, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md, phases/04-computer-vision/21-keypoint-pose/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `iou_threshold` | 0.45 | 目标检测的 NMS |
| `conf_threshold` | 0.25 | objectness 乘以最佳类别 |
| `lambda_coord` | 5.0 | 框损失权重，YOLOv1 的比例 |
| `lambda_noobj` | 0.5 | 否则空单元格会占主导 |
| RPN NMS IoU | 0.7 | 在前 ~1,000 个框之后 |
| 掩码阈值 | 0.5 | 浮点掩码转二值掩码 |
| 热力图 `sigma` | 2.0 | 每个关键点一个高斯斑 |
| Dice 权重 `lam` | 1.0 | 损失为 ce 加 lam 乘以 dice |

## 故障排查
type: troubleshooting
from: phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 只有 mAP@0.5:0.95 偏低 | 框定位粗糙 | 更好的框损失，CIoU 或 DIoU |
| 精确率高，召回率低 | 检测器过于保守 | 降低置信度阈值 |
| 一个物体，多个框 | 相邻 anchor 重叠 | 以 0.45 运行 NMS |
| 像素准确率 99%，掩码为空 | 背景占主导 | 在交叉熵之外加上 Dice |
| mIoU 看起来不错 | 某个只有 15% 的类别被掩盖 | 按类别报告 IoU |
| 棋盘格伪影 | 转置卷积 | 双线性上采样 + 3x3 卷积 |
| 标签整体错开一位 | `num_classes` 没算背景 | 4 个类别用 `num_classes=5` |
| 500 张图像上过拟合 | 骨干和 FPN 都在训练 | 冻结 `model.backbone` |

## 问答
type: qa
from: phases/04-computer-vision/06-object-detection-yolo/docs/en.md, phases/04-computer-vision/07-semantic-segmentation-unet/docs/en.md, phases/04-computer-vision/08-instance-segmentation-mask-rcnn/docs/en.md, phases/04-computer-vision/21-keypoint-pose/docs/en.md, phases/04-computer-vision/24-sam3-open-vocab-segmentation/docs/en.md

- **为什么用 RoIAlign 而不是 RoIPool？** RoIPool 会对坐标取整。RoIAlign 让掩码 AP 提升 3-4 个点。
- **为什么用热力图而不是直接回归 (x, y)？** 卷积特征图与空间输出对齐。
- **为什么用 anchor？** 头只需预测相对先验框形状的小偏移。
- **U-Net 为什么要跳跃连接？** 编码器会丢失边缘细节。跳跃连接把高分辨率特征图送回来。
- **为什么 U-Net 输入必须能被 16 整除？** 编码器把分辨率减半四次。
- **SAM 3 比 Grounded SAM 2 快吗？** 通常持平，或略有提速。
