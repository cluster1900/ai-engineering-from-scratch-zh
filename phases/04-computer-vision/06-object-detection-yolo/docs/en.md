# 目标检测 — 从零实现 YOLO

> Detection 是 Classification 加 Regression，在 feature map 的每个位置运行，然后用 non-maximum suppression 清理结果。

**类型：** 构建
**语言：** Python
**前置要求：** Phase 4 Lesson 03 (CNNs), Phase 4 Lesson 04 (Image Classification), Phase 4 Lesson 05 (Transfer Learning)
**时间：** 约 75 分钟

## 学习目标

- 解释 grid-and-anchor 设计如何把 detection 转化为 dense prediction 问题，并说明输出 tensor 中每个数字的含义
- 计算 box 之间的 Intersection-over-Union，并从零实现 non-maximum suppression
- 在 pretrained backbone 之上构建一个最小 YOLO 风格的 head，包括 classification、objectness 和 box-regression losses
- 读懂一行 detection metric（precision@0.5, recall, mAP@0.5, mAP@0.5:0.95），并判断下一步应该调整哪个 knob

## 问题

Classification 会说“这张图是一只狗”。Detection 会说“在 pixels (112, 40, 280, 210) 处有一只狗，在 (400, 180, 560, 310) 处有一只猫，画面中没有其他东西”。这个结构性变化——预测数量可变的带标签 box，而不是每张图一个 label——是每个自动驾驶系统、每个监控产品、每个文档布局 parser 和每条工厂视觉产线所依赖的能力。

Detection 也是视觉中所有工程取舍同时出现的地方。你希望 box 准确（regression head），希望每个 box 的 class 正确（classification head），希望模型知道什么时候没有东西需要检测（objectness score），还希望每个真实 object 只对应一个 prediction（non-maximum suppression）。任何一个环节出错，pipeline 就会漏检 object、报告幻觉 box，或者在稍有不同的位置上把同一个 object 预测十五次。

YOLO（You Only Look Once, Redmon et al. 2016）是一种设计，它通过 conv net 的单次 forward pass 让所有这些实时运行起来；同样的结构性决策至今仍是现代 detector（YOLOv8, YOLOv9, YOLO-NAS, RT-DETR）的 backbone。掌握核心之后，每个变体都只是相同部件的重新排列。

## 概念

### Detection 作为 dense prediction

Classifier 每张图输出 C 个数字。YOLO 风格 detector 每张图输出 `(S x S x (5 + C))` 个数字，其中 S 是 spatial grid size。

```mermaid
flowchart LR
    IMG["Input 416x416 RGB"] --> BB["Backbone<br/>(ResNet, DarkNet, ...)"]
    BB --> FM["Feature map<br/>(C_feat, 13, 13)"]
    FM --> HEAD["Detection head<br/>(1x1 convs)"]
    HEAD --> OUT["Output tensor<br/>(13, 13, B * (5 + C))"]
    OUT --> DEC["Decode<br/>(grid + sigmoid + exp)"]
    DEC --> NMS["Non-max suppression"]
    NMS --> RESULT["Final boxes"]

    style IMG fill:#dbeafe,stroke:#2563eb
    style HEAD fill:#fef3c7,stroke:#d97706
    style NMS fill:#fecaca,stroke:#dc2626
    style RESULT fill:#dcfce7,stroke:#16a34a
```

每个 `S * S` grid cell 会预测 `B` 个 box。对于每个 box：

- 4 个数字描述几何信息：`tx, ty, tw, th`。
- 1 个数字是 objectness score：“是否有一个 object 的中心落在这个 cell 中？”
- C 个数字是 class probabilities。

每个 cell 的总数：`B * (5 + C)`。对于 VOC，若 `S=13, B=2, C=20`，就是每个 cell 50 个数字。

### 为什么需要 grids 和 anchors

朴素 Regression 会为每个 object 预测绝对坐标形式的 `(x, y, w, h)`。这对 conv network 来说很难，因为平移图像不应该让所有 prediction 都平移相同的量——每个 object 都在空间上被锚定。grid 通过把每个 ground-truth box 分配给其中心所在的 grid cell 来解决这个问题；只有那个 cell 负责该 object。

Anchors 解决第二个问题。3x3 conv 很难从 16-pixel receptive field 的 feature cell 中 Regression 出一个 500-pixel-wide box。因此，我们在每个 cell 预先定义 `B` 个先验 box shape（anchors），并从每个 anchor 预测小的 deltas。模型学习选择正确的 anchor 并微调它，而不是从零 Regression。

```
Anchor box priors (example for 416x416 input):

  small:   (30,  60)
  medium:  (75,  170)
  large:   (200, 380)

At each grid cell, every anchor emits (tx, ty, tw, th, obj, c_1, ..., c_C).
```

现代 detector 通常使用 FPN，在不同 resolution 上使用不同 anchor sets——浅层高分辨率 maps 上放 small anchors，深层低分辨率 maps 上放 large anchors。同样的思想，更多尺度。

### 解码 predictions

原始的 `tx, ty, tw, th` 不是 box coordinates；它们是需要在绘制前转换的 Regression targets：

```
centre x  = (sigmoid(tx) + cell_x) * stride
centre y  = (sigmoid(ty) + cell_y) * stride
width     = anchor_w * exp(tw)
height    = anchor_h * exp(th)
```

`sigmoid` 把中心偏移限制在 cell 内。`exp` 让 width 可以从 anchor 自由缩放而不会发生符号翻转。`stride` 把 grid coordinates 缩放回 pixels。这个 decode 步骤自 v2 以来在每个 YOLO 版本中都是一样的。

### IoU

Detection 中衡量两个 box 相似度的通用 metric：

```
IoU(A, B) = area(A intersect B) / area(A union B)
```

IoU = 1 表示完全相同；IoU = 0 表示没有重叠。prediction 和 ground-truth box 之间的 IoU 决定某个 prediction 是否算作 true positive（通常 IoU >= 0.5）。两个 predictions 之间的 IoU 是 NMS 用来去重的依据。

### Non-maximum suppression

在相邻 anchors 上训练的 conv network 通常会为同一个 object 预测重叠 box。NMS 保留 confidence 最高的 prediction，并删除任何 IoU 高于阈值的其他 prediction。

```
NMS(boxes, scores, iou_threshold):
    sort boxes by score descending
    keep = []
    while boxes not empty:
        pick the top-scoring box, add to keep
        remove every box with IoU > iou_threshold to the picked box
    return keep
```

典型阈值：object detection 中为 0.45。近期 detector 会用 `soft-NMS`、`DIoU-NMS` 替代标准 NMS，或者直接学习 suppression（RT-DETR），但结构性目的相同。

### Loss

YOLO loss 是三个带权重的 losses 相加：

```
L = lambda_coord * L_box(pred, target, where obj=1)
  + lambda_obj   * L_obj(pred, 1,     where obj=1)
  + lambda_noobj * L_obj(pred, 0,     where obj=0)
  + lambda_cls   * L_cls(pred, target, where obj=1)
```

只有包含 object 的 cells 才会贡献 box-regression 和 classification losses。不含 object 的 cells 只贡献 objectness loss（教模型保持沉默）。`lambda_noobj` 通常较小（约 0.5），因为绝大多数 cells 都是空的，否则会主导总 loss。

现代变体会把 MSE box loss 换成 CIoU / DIoU（直接优化 IoU），用 focal loss 处理 class imbalance，并用 quality focal loss 平衡 objectness。三组件结构保持不变。

### Detection metrics

Accuracy 不能直接迁移到 detection。下面四个数字可以：

- **Precision@IoU=0.5** — 在被计为 positives 的 predictions 中，有多少实际正确。
- **Recall@IoU=0.5** — 在真实 objects 中，我们找到了多少。
- **AP@0.5** — IoU threshold 0.5 下 precision-recall curve 的面积；每个 class 一个数。
- **mAP@0.5:0.95** — 在 IoU thresholds 0.5, 0.55, ..., 0.95 上对 AP 求平均。COCO metric；最严格，也最有信息量。

四个都要报告。如果一个 detector 在 mAP@0.5 上很强，但在 mAP@0.5:0.95 上很弱，说明定位大致正确但不够紧；用更好的 box-regression loss 修复。如果 detector precision 高、recall 低，说明它过于保守；降低 confidence threshold 或提高 objectness 权重。

```figure
object-detection-nms
```

## 构建它

### 步骤 1： IoU

整节课的核心工具。作用于两个 `(x1, y1, x2, y2)` 格式的 box arrays。

```python
import numpy as np

def box_iou(boxes_a, boxes_b):
    ax1, ay1, ax2, ay2 = boxes_a[:, 0], boxes_a[:, 1], boxes_a[:, 2], boxes_a[:, 3]
    bx1, by1, bx2, by2 = boxes_b[:, 0], boxes_b[:, 1], boxes_b[:, 2], boxes_b[:, 3]

    inter_x1 = np.maximum(ax1[:, None], bx1[None, :])
    inter_y1 = np.maximum(ay1[:, None], by1[None, :])
    inter_x2 = np.minimum(ax2[:, None], bx2[None, :])
    inter_y2 = np.minimum(ay2[:, None], by2[None, :])

    inter_w = np.clip(inter_x2 - inter_x1, 0, None)
    inter_h = np.clip(inter_y2 - inter_y1, 0, None)
    inter = inter_w * inter_h

    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union = area_a[:, None] + area_b[None, :] - inter
    return inter / np.clip(union, 1e-8, None)
```

返回一个 `(N_a, N_b)` 的 pairwise IoUs Matrix。要和单个 ground-truth box 比较时，把其中一个 array 做成 shape `(1, 4)`。

### 步骤 2: Non-max suppression

```python
def nms(boxes, scores, iou_threshold=0.45):
    order = np.argsort(-scores)
    keep = []
    while len(order) > 0:
        i = order[0]
        keep.append(i)
        if len(order) == 1:
            break
        rest = order[1:]
        ious = box_iou(boxes[[i]], boxes[rest])[0]
        order = rest[ious <= iou_threshold]
    return np.array(keep, dtype=np.int64)
```

确定性实现，排序带来 `O(N log N)` 复杂度，并且在相同输入上匹配 `torchvision.ops.nms` 的行为。

### 步骤 3：Box encoding and decoding

在 pixel coordinates 和 network 实际 Regression 的 `(tx, ty, tw, th)` targets 之间转换。

```python
def encode(box_xyxy, cell_x, cell_y, stride, anchor_wh):
    x1, y1, x2, y2 = box_xyxy
    cx = 0.5 * (x1 + x2)
    cy = 0.5 * (y1 + y2)
    w = x2 - x1
    h = y2 - y1
    tx = cx / stride - cell_x
    ty = cy / stride - cell_y
    tw = np.log(w / anchor_wh[0] + 1e-8)
    th = np.log(h / anchor_wh[1] + 1e-8)
    return np.array([tx, ty, tw, th])


def decode(tx_ty_tw_th, cell_x, cell_y, stride, anchor_wh):
    tx, ty, tw, th = tx_ty_tw_th
    cx = (sigmoid(tx) + cell_x) * stride
    cy = (sigmoid(ty) + cell_y) * stride
    w = anchor_wh[0] * np.exp(tw)
    h = anchor_wh[1] * np.exp(th)
    return np.array([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2])


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))
```

测试：encode 一个 box 再 decode——你应该能得到非常接近原始值的结果（当 `tx` 不在 post-sigmoid range 中时，sigmoid inverse 并非完全可逆，因此会有轻微差异）。

### 步骤 4： 一个最小 YOLO head

feature map 上的一个 1x1 conv，reshape 为 `(B, S, S, num_anchors, 5 + C)`。

```python
import torch
import torch.nn as nn

class YOLOHead(nn.Module):
    def __init__(self, in_c, num_anchors, num_classes):
        super().__init__()
        self.num_anchors = num_anchors
        self.num_classes = num_classes
        self.conv = nn.Conv2d(in_c, num_anchors * (5 + num_classes), kernel_size=1)

    def forward(self, x):
        n, _, h, w = x.shape
        y = self.conv(x)
        y = y.view(n, self.num_anchors, 5 + self.num_classes, h, w)
        y = y.permute(0, 3, 4, 1, 2).contiguous()
        return y
```

输出 shape：`(N, H, W, num_anchors, 5 + C)`。最后一个维度保存 `[tx, ty, tw, th, obj, cls_0, ..., cls_{C-1}]`。

### 步骤 5：ground-truth assignment

对于每个 ground-truth box，决定哪个 `(cell, anchor)` 负责它。

```python
def assign_targets(boxes_xyxy, classes, anchors, stride, grid_size, num_classes):
    num_anchors = len(anchors)
    target = np.zeros((grid_size, grid_size, num_anchors, 5 + num_classes), dtype=np.float32)
    has_obj = np.zeros((grid_size, grid_size, num_anchors), dtype=bool)

    for box, cls in zip(boxes_xyxy, classes):
        x1, y1, x2, y2 = box
        cx, cy = 0.5 * (x1 + x2), 0.5 * (y1 + y2)
        gx, gy = int(cx / stride), int(cy / stride)
        bw, bh = x2 - x1, y2 - y1

        ious = np.array([
            (min(bw, aw) * min(bh, ah)) / (bw * bh + aw * ah - min(bw, aw) * min(bh, ah))
            for aw, ah in anchors
        ])
        best = int(np.argmax(ious))
        aw, ah = anchors[best]

        target[gy, gx, best, 0] = cx / stride - gx
        target[gy, gx, best, 1] = cy / stride - gy
        target[gy, gx, best, 2] = np.log(bw / aw + 1e-8)
        target[gy, gx, best, 3] = np.log(bh / ah + 1e-8)
        target[gy, gx, best, 4] = 1.0
        target[gy, gx, best, 5 + cls] = 1.0
        has_obj[gy, gx, best] = True
    return target, has_obj
```

Anchor selection 是“与 ground truth 具有最佳 shape IoU”——这是一个廉价 proxy，匹配 YOLOv2/v3 的 assignment。v5 及后续版本使用更复杂的策略（task-aligned matching, dynamic k）来细化同一思路。

### 步骤 6： 三个 losses

```python
def yolo_loss(pred, target, has_obj, lambda_coord=5.0, lambda_obj=1.0, lambda_noobj=0.5, lambda_cls=1.0):
    has_obj_t = torch.from_numpy(has_obj).bool()
    target_t = torch.from_numpy(target).float()

    # box-regression loss: only on cells with objects
    box_pred = pred[..., :4][has_obj_t]
    box_true = target_t[..., :4][has_obj_t]
    loss_box = torch.nn.functional.mse_loss(box_pred, box_true, reduction="sum")

    # objectness loss
    obj_pred = pred[..., 4]
    obj_true = target_t[..., 4]
    loss_obj_pos = torch.nn.functional.binary_cross_entropy_with_logits(
        obj_pred[has_obj_t], obj_true[has_obj_t], reduction="sum")
    loss_obj_neg = torch.nn.functional.binary_cross_entropy_with_logits(
        obj_pred[~has_obj_t], obj_true[~has_obj_t], reduction="sum")

    # classification loss on cells with objects
    cls_pred = pred[..., 5:][has_obj_t]
    cls_true = target_t[..., 5:][has_obj_t]
    loss_cls = torch.nn.functional.binary_cross_entropy_with_logits(
        cls_pred, cls_true, reduction="sum")

    total = (lambda_coord * loss_box
             + lambda_obj * loss_obj_pos
             + lambda_noobj * loss_obj_neg
             + lambda_cls * loss_cls)
    return total, {"box": loss_box.item(), "obj_pos": loss_obj_pos.item(),
                   "obj_neg": loss_obj_neg.item(), "cls": loss_cls.item()}
```

五个 hyper-parameters，每个 YOLO tutorial 要么 hardcode，要么 sweep。比例很重要：`lambda_coord=5, lambda_noobj=0.5` 对应原始 YOLOv1 paper，并且至今仍是合理默认值。

### 步骤 7: Inference pipeline

Decode 原始 head output，应用 sigmoid/exp，按 objectness threshold 过滤，然后执行 NMS。

```python
def postprocess(pred_tensor, anchors, stride, img_size, conf_threshold=0.25, iou_threshold=0.45):
    pred = pred_tensor.detach().cpu().numpy()
    grid_h, grid_w = pred.shape[1], pred.shape[2]
    num_anchors = len(anchors)

    boxes, scores, classes = [], [], []
    for gy in range(grid_h):
        for gx in range(grid_w):
            for a in range(num_anchors):
                tx, ty, tw, th, obj, *cls = pred[0, gy, gx, a]
                score = sigmoid(obj) * sigmoid(np.array(cls)).max()
                if score < conf_threshold:
                    continue
                cls_idx = int(np.argmax(cls))
                cx = (sigmoid(tx) + gx) * stride
                cy = (sigmoid(ty) + gy) * stride
                w = anchors[a][0] * np.exp(tw)
                h = anchors[a][1] * np.exp(th)
                boxes.append([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2])
                scores.append(float(score))
                classes.append(cls_idx)

    if not boxes:
        return np.zeros((0, 4)), np.zeros((0,)), np.zeros((0,), dtype=int)
    boxes = np.array(boxes)
    scores = np.array(scores)
    classes = np.array(classes)
    keep = nms(boxes, scores, iou_threshold)
    return boxes[keep], scores[keep], classes[keep]
```

这就是完整的 eval 路径：head -> decode -> threshold -> NMS。

## 使用它

`torchvision.models.detection` 提供了具备相同概念结构的生产级 detectors。加载 pretrained model 只需要三行。

```python
import torch
from torchvision.models.detection import fasterrcnn_resnet50_fpn_v2

model = fasterrcnn_resnet50_fpn_v2(weights="DEFAULT")
model.eval()
with torch.no_grad():
    predictions = model([torch.randn(3, 400, 600)])
print(predictions[0].keys())
print(f"boxes:  {predictions[0]['boxes'].shape}")
print(f"scores: {predictions[0]['scores'].shape}")
print(f"labels: {predictions[0]['labels'].shape}")
```

对于 real-time inference pipelines，`ultralytics`（YOLOv8/v9）是标准选择：`from ultralytics import YOLO; model = YOLO('yolov8n.pt'); model(img)`。模型会在内部处理 decoding 和 NMS，并返回与你上面构建的相同 `boxes / scores / labels` 三元组。

## 交付它

本课会产出：

- `outputs/prompt-detection-metric-reader.md` — 一个 prompt，把一行 `precision, recall, AP, mAP@0.5:0.95` 转换成一句诊断和最有用的下一个实验。
- `outputs/skill-anchor-designer.md` — 一个 skill，给定 ground-truth boxes 数据集后，在 `(w, h)` 上运行 k-means，并返回每个 FPN level 的 anchor sets 以及选择正确 anchor 数量所需的 coverage statistics。

## 练习

1. **（简单）** 实现 `box_iou`，并在 1,000 组随机 box pairs 上与 `torchvision.ops.box_iou` 对比。验证最大绝对差小于 `1e-6`。
2. **（中等）** 将 `yolo_loss` 移植为使用 `CIoU` box loss 而不是 MSE 的版本。在一个 100-image synthetic dataset 上展示：在相同 epoch 数下，CIoU 比 MSE 收敛到更好的最终 mAP@0.5:0.95。
3. **（困难）** 实现 multi-scale inference：以三种 resolution 将同一图像输入模型，合并 box predictions，并在最后运行一次 NMS。在 held-out set 上测量相较 single-scale inference 的 mAP 提升。

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|----------------------|
| Anchor | “Box prior” | 每个 grid cell 上的预定义 box shape，network 从中预测 deltas，而不是预测绝对坐标 |
| IoU | “Overlap” | 两个 box 的 Intersection-over-union；detection 中通用的相似度度量 |
| NMS | “Deduplicate” | 贪心算法，保留最高分 predictions，并移除高于阈值的重叠 predictions |
| Objectness | “Is there something here” | 每个 anchor、每个 cell 的 scalar，用于预测是否有 object 的中心落在该 cell 中 |
| Grid stride | “Downsample factor” | 每个 grid cell 对应的 pixels 数；416-px input 配 13-grid head 时 stride 为 32 |
| mAP | “Mean average precision” | precision-recall curve 下方面积的平均值，对 classes 求平均，并且（对 COCO）也对 IoU thresholds 求平均 |
| AP@0.5 | “PASCAL VOC AP” | IoU threshold 0.5 下的 average precision；该 metric 的宽松版本 |
| mAP@0.5:0.95 | “COCO AP” | 在 IoU thresholds 0.5..0.95、步长 0.05 上求平均；严格版本，也是当前社区标准 |

## 延伸阅读

- [YOLOv1: You Only Look Once (Redmon et al., 2016)](https://arxiv.org/abs/1506.02640) — 奠基 paper；此后的每个 YOLO 都是对该结构的改进
- [YOLOv3 (Redmon & Farhadi, 2018)](https://arxiv.org/abs/1804.02767) — 引入 multi-scale FPN-style heads 的 paper；至今仍有最清晰的 diagram
- [Ultralytics YOLOv8 docs](https://docs.ultralytics.com) — 当前生产参考；涵盖 dataset formats、augmentations、training recipes
- [The Illustrated Guide to Object Detection (Jonathan Hui)](https://jonathan-hui.medium.com/object-detection-series-24d03a12f904) — 对完整 detector zoo 最好的 plain-English 导览；对于理解 DETR、RetinaNet、FCOS 和 YOLO 之间的关系非常宝贵
