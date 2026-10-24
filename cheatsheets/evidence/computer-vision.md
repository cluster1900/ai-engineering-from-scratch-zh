# Evidence: cheatsheets/computer-vision.md

Abbreviations: P04 = phases/04-computer-vision. L01 = P04/01-image-fundamentals, L02 = P04/02-convolutions-from-scratch, L03 = P04/03-cnns-lenet-to-resnet, L04 = P04/04-image-classification, L05 = P04/05-transfer-learning, L06 = P04/06-object-detection-yolo, L07 = P04/07-semantic-segmentation-unet, L08 = P04/08-instance-segmentation-mask-rcnn, L14 = P04/14-vision-transformers. All docs paths are docs/en.md unless code/main.py is named.

## Architecture: Mask R-CNN 流水线 (8 nodes)
- img "Input image, list of (3, H, W)": L08/docs/en.md:28, 188-189 (model([x]) with x = torch.randn(3, 400, 600))
- bb "ResNet backbone, strides 4, 8, 16, 32": L08/docs/en.md:29, 47
- fpn "FPN, top down + lateral": L08/docs/en.md:29, 48
- rpn "RPN, about 1000 proposals": L08/docs/en.md:30, 49
- roi "RoIAlign, bilinear, no rounding": L08/docs/en.md:31, 50, 64-67
- box "Box head, class + refine": L08/docs/en.md:33, 51
- mask "Mask head, 28x28 per class": L08/docs/en.md:34, 51, 78
- nms "NMS, boxes, labels, masks": L08/docs/en.md:35-37, 101-107
- edges: L08/docs/en.md:28-37 (edge "top K" L08/docs/en.md:32, "features" L08/docs/en.md:31)

## Flow: 为预训练模型做预处理 (7 steps)
1. decode uint8 HWC [0, 255]: L01/docs/en.md:33, 232
2. RGB, BGR costs ten points: L01/docs/en.md:19, 34
3. divide by 255, HWC to NCHW: L01/docs/en.md:37, 39-40, 386, 414
4. resize shorter side 256, bilinear: L01/docs/en.md:389, 395, 414
5. center crop 224x224: L01/docs/en.md:400-402, 414
6. standardize ImageNet mean and std: L01/docs/en.md:147, 404-406, 414
7. input matches training input: L01/docs/en.md:29, 414

## 关键公式 (concepts, 8)
- output size: L02/docs/en.md:74-76
- same padding P = (K - 1) / 2: L02/docs/en.md:88
- conv params C_out * C_in * K * K + C_out: L02/docs/en.md:143
- receptive field 1 + L * (K - 1): L02/docs/en.md:173
- residual y = F(x) + x: L03/docs/en.md:120-124
- IoU: L06/docs/en.md:92-94
- Dice and Dice = 2 IoU / (1 + IoU): L07/docs/en.md:101-105, 122
- YOLO decode: L06/docs/en.md:77-84

## 代码中的任务 (task-table, 8)
- img_hwc.permute(2, 0, 1): L01/docs/en.md:116
- nn.Conv2d(in_channels=3, out_channels=64, kernel_size=3, stride=1, padding=1): L02/docs/en.md:345
- nn.CrossEntropyLoss(label_smoothing=0.1): L04/docs/en.md:103
- model.fc = nn.Linear(model.fc.in_features, num_classes): L05/docs/en.md:290
- timm.create_model("resnet50", pretrained=True, num_classes=10): L05/docs/en.md:296
- nms(boxes, scores, iou_threshold=0.45): L06/docs/en.md:180
- smp.Unet(encoder_name="resnet34", encoder_weights="imagenet", in_channels=3, classes=3): L07/docs/en.md:355-360 (joined to one line)
- timm.create_model("vit_base_patch16_224", pretrained=True, num_classes=10): L14/docs/en.md:238

## Annotated code: ViT 前向传播 (13 lines)
- self.proj conv k=s=patch_size: L14/code/main.py:9
- cls_token, pos_embed: L14/code/main.py:45-46
- proj, flatten(2).transpose(1, 2): L14/code/main.py:13-14. Shape (768, 14, 14), (196, 768): L14/docs/en.md:50-55
- cls expand, torch.cat, + pos_embed: L14/code/main.py:55-57. (197, 768): L14/docs/en.md:64
- normed = self.ln1(x), attn, x + a, mlp: L14/code/main.py:32-35. Pre-LN: L14/docs/en.md:84-85. MLP d to 4d to d with GELU: L14/docs/en.md:87
- return self.head(self.ln(x[:, 0])): L14/code/main.py:60. [CLS] output: L14/docs/en.md:67
- Note: lines from PatchEmbedding, Block and ViT are joined into one forward listing.

## 形状 (command-table, 7)
- decoded (H, W, 3) uint8: L01/docs/en.md:232
- model input (N, 3, 224, 224) float32: L01/docs/en.md:402, 408-409, 414
- conv weight (C_out, C_in, K, K): L02/docs/en.md:140
- YOLO head (N, H, W, num_anchors, 5 + C): L06/docs/en.md:252
- segmentation logits (N, C, H, W), target (N, H, W): L07/docs/en.md:87
- Mask R-CNN masks (N, 1, H, W) in [0, 1]: L08/docs/en.md:106
- ViT tokens (197, 768): L14/docs/en.md:64

## 默认值与数字 (defaults, 8)
- ImageNet mean 0.485, 0.456, 0.406 on [0, 1]: L01/docs/en.md:147
- ImageNet std 0.229, 0.224, 0.225: L01/docs/en.md:147
- NMS iou_threshold 0.45: L06/docs/en.md:112, 180. RPN NMS 0.7: L08/docs/en.md:74
- conf_threshold 0.25, objectness times class score: L06/docs/en.md:334, 340
- lambda_noobj 0.5, lambda_coord 5.0: L06/docs/en.md:296, 323
- mixup alpha 0.2, Beta(alpha, alpha): L04/docs/en.md:90, 219
- patch size 16, 196 tokens: L14/docs/en.md:48, 98
- MAE mask 75%, encoder sees 25%: L14/docs/en.md:124

## 骨干网络 (command-table, 6)
- LeNet-5 61,706: L03/docs/en.md:192
- AlexNet 60M, ReLU, dropout, depth: L03/docs/en.md:57-59
- VGG-16 138M, 3x3 only: L03/docs/en.md:65, 74, 348
- ResNet-18 11.7M, 69.8%: L03/docs/en.md:348
- ViT-B/16 86M, 12 blocks, 12 heads, 768: L14/docs/en.md:90, 267
- Mask R-CNN 46M, 91 classes: L08/docs/en.md:182

## 故障排查 (8)
- raw uint8 into model: L01/docs/en.md:19, 147
- channels-last makes first conv treat height as channel: L01/docs/en.md:19, fix L01/docs/en.md:116
- softmax before CE: L04/docs/en.md:49, 68
- missing zero_grad: L04/docs/en.md:49, 296
- fine-tuned below linear probe, LR or BN bug: L05/docs/en.md:113. freeze_bn_stats: L05/docs/en.md:196
- 99% accuracy useless, Dice: L07/docs/en.md:97-99, 110-116
- checkerboard artifacts, bilinear + 3x3 conv: L07/docs/en.md:80-81
- num_classes includes background: L08/docs/en.md:224

## 缩写 (glossary, 8)
- IoU: L06/docs/en.md:405
- NMS: L06/docs/en.md:402
- mAP@0.5:0.95: L06/docs/en.md:138, 407
- mIoU: L07/docs/en.md:121, 390
- FPN: L08/docs/en.md:48, 279
- RPN: L08/docs/en.md:49, 280
- ViT: L14/docs/en.md:1, 267
- MAE: L14/docs/en.md:124, 269

## 问答 (qa, 5)
- 3x3 vs 5x5 parameters: L02/docs/en.md:178, L03/docs/en.md:72
- residual identity: L03/docs/en.md:127
- RoIAlign 3 to 4 mask AP: L08/docs/en.md:55, 70
- anchors predict deltas: L06/docs/en.md:59
- pre-LN without warmup: L14/docs/en.md:94

## 提示 (6)
- dataset-specific mean and std: L04/docs/en.md:395
- nearest for masks and labels: L01/docs/en.md:191, 197
- print pretrained-only and fine-tuned: L05/docs/en.md:108-113
- rebuild optimizer when trainable set changes: L05/docs/en.md:281
- IoU per class: L07/docs/en.md:125
- report the four detection numbers: L06/docs/en.md:135-140

## Dropped facts
- Lessons 12, 13 and 15 to 28 (video, 3D, edge, CLIP, OCR, tracking and others): not covered, kept out to fit two pages.
- Diffusion, GAN and Stable Diffusion lessons (L09 to L11, L23): left to the diffusion-models topic.
