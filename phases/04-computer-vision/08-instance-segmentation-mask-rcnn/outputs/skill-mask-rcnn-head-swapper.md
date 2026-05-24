---
name: skill-mask-rcnn-head-swapper
description: 为自定义 num_classes 生成在 torchvision Mask R-CNN 上替换 box 和 mask heads 的精确代码
version: 1.0.0
phase: 4
lesson: 8
tags: [computer-vision, mask-rcnn, fine-tuning, torchvision]
---

# Mask R-CNN Head Swapper

专门为 Mask R-CNN 生成 head-swap 模板代码。下面的模板假设存在 `model.roi_heads.box_predictor` 和 `model.roi_heads.mask_predictor`，它们只存在于 `maskrcnn_resnet50_fpn` 和 `maskrcnn_resnet50_fpn_v2`。Faster R-CNN 有 box predictor 但没有 mask predictor；RetinaNet 使用 `RetinaNetHead`，并且完全没有 `roi_heads`——两者都需要不同的技能。

## 何时使用

- 在自定义类别集合上 fine-tuning `maskrcnn_resnet50_fpn` 或 `maskrcnn_resnet50_fpn_v2`。
- 将在 COCO 上训练的 Mask R-CNN checkpoint 移植到非 COCO 类别数量。
- 调试因 `cls_score.out_features` 或 `mask_predictor` 不匹配而崩溃的 Mask R-CNN 训练运行。

## 范围之外

- `fasterrcnn_*`——没有 mask_predictor。只替换 `box_predictor`；使用单独的 Faster R-CNN head-swap recipe。
- `retinanet_*`——没有 `roi_heads`；classifier + regression heads 位于 `model.head.classification_head` 和 `model.head.regression_head` 下。使用 RetinaNet 专用技能。
- `keypointrcnn_*`——使用 `keypoint_predictor` 而不是 `mask_predictor`。

## 输入

- `model_name`: torchvision detection model constructor，例如 `maskrcnn_resnet50_fpn_v2`。
- `num_classes`: 包含 background。一个有 4 个 object class 的 dataset 意味着 `num_classes=5`。
- `freeze`: `backbone`、`backbone_fpn`、`none` 之一。

## 步骤

1. Import model constructor 和两个 predictor classes（`FastRCNNPredictor`、`MaskRCNNPredictor`）。
2. 加载 default-weights pretrained model。
3. 用新的 `FastRCNNPredictor(in_features, num_classes)` 替换 `model.roi_heads.box_predictor`。
4. 用新的 `MaskRCNNPredictor(in_features_mask, hidden_layer=256, num_classes)` 替换 `model.roi_heads.mask_predictor`。
5. 应用请求的 freeze policy。
6. 打印 confirmation block，列出每个 module 的 trainable params。

## 输出代码模板

```python
from torchvision.models.detection import {MODEL_NAME}, {MODEL_WEIGHTS}
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.models.detection.mask_rcnn import MaskRCNNPredictor

def build_model(num_classes={NUM_CLASSES}):
    model = {MODEL_NAME}(weights={MODEL_WEIGHTS}.DEFAULT)
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)
    in_features_mask = model.roi_heads.mask_predictor.conv5_mask.in_channels
    model.roi_heads.mask_predictor = MaskRCNNPredictor(in_features_mask, 256, num_classes)

    {FREEZE_BLOCK}

    return model
```

其中 `{FREEZE_BLOCK}` 为：

- `none` -> 空
- `backbone` ->
  ```python
  for p in model.backbone.parameters():
      p.requires_grad = False
  ```
- `backbone_fpn` ->
  ```python
  for p in model.backbone.parameters():
      p.requires_grad = False
  # FPN parameters live inside backbone.fpn
  ```

## 报告

```
[head-swap]
  model:         <MODEL_NAME>
  num_classes:   <N>  (includes background)
  freeze policy: <choice>
  trainable:     <N>
  total:         <N>
```

## 规则

- 永远不要推荐不包含 background 的 `num_classes`；始终提醒用户。
- 当可用时，始终使用 torchvision detection models 的 `_v2` variants；它们比 legacy variants 有更好的 pretrained weights。
- 不要在此技能中 instantiate model——生成代码块，让用户运行它。
- 如果用户在超过 10,000 张图像的 dataset 上请求 `freeze backbone`，建议他们也考虑 fine-tuning backbone。
