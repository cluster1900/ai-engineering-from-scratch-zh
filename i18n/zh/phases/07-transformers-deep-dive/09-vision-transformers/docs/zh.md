# 视力转换器 (ViT)

> 一张图像是由补丁组成的网格―― 一句由代币组成的网格―― 同一个变压器都能处理――

**Type:** Build
**Languages:** Python
**先修要求:**阶段7 · 05 (全变压器),阶段4 · 03 (CNN),阶段4 · 14 (视觉变压器介绍)
**Time:** ~45 minutes

## 问题

在2020年之前,计算机视觉基本上意味着卷积.

索维茨基等人 (2020) 的 一个图像值16x16字 表明,你可以完全消除卷积──把图像切成固定大小的补丁,将每个补丁线性投影到一个嵌入,再把这个序列送进一个普通的变压器编码器──在足够大的规模下(ImageNet-21k预训或更大),ViT可以匹配甚至超过基于ResNet的模型──

维特是2026年更大的趋势的开端:一种架构,多种模式――语将把音频代码化――维特将图像代码化――机器人使用行动代码――视频使用像素代码――变压器并不在乎输入是什么,只要给它一个序列,它就能学习――

到2026年,ViT 及其后代公司已经占据了视觉领域的大部分领域.

## 概念

![Image → patches → tokens → transformer](../assets/vit.svg)

### 步骤 1  补丁

将一个`H × W × C`图像被拆成一个`N × (P·P·C)`的平补丁序列──典型设置是:`224 × 224`图像,`16 × 16`补丁 → 196 个补丁,每个包含 768 个值.

```
image (224, 224, 3) → 14 × 14 grid of 16x16x3 patches → 196 vectors of length 768
```

补丁尺寸是关键控制杆──更小的补丁 = 更多代币、更好的分辨率、第二方 注意 成本──更大的补丁 = 更粗、更便宜──

### 步骤 2 线性嵌入

一个单独的学习矩阵将每个平面补丁投影到`d_model`△ 这等于内核尺寸为`P`步骤为`P`在 PyTorch 中,实际上就是`nn.Conv2d(C, d_model, kernel_size=P, stride=P)`只有2行才能实现.

### 步骤 3  前置 `[CLS]`标志,添加位置嵌入

- 在开头添加一个可学习的`[CLS]`标志――它的最终隐藏状态会作为用于分类的图像表示――
- 添加可学习的位置嵌入式 (ViT 原版) 或双向二维 (后续变体) 〔
- 在2024年之后,RoPE将扩展到2D位置,有时不再需要显式嵌入.

### 步骤 4  标准变压器编码器

堆叠的`LayerNorm → Self-Attention → + → LayerNorm → MLP → +`没有具体的视觉层面. 这就是这篇论文的核心结论.

### 步骤 5 头

对于分类:取`[CLS]`隐藏状态 →线性 →软max──对于DINOv2或 SAM,则丢弃`[CLS]`直接使用补丁嵌入式.

### 重要变体

| Model | Year | Change |
|-------|------|--------|
| ViT | 2020 | 原始版本。固定 patch size，完整 global attention。 |
| DeiT | 2021 | Distillation；只用 ImageNet-1k 就能训练。 |
| Swin | 2021 | 使用 shifted windows 的层级结构。固定的 sub-quadratic 成本。 |
| DINOv2 | 2023 | Self-supervised（无 labels）。最好的通用 vision features。 |
| ViT-22B | 2023 | 22B 参数；scaling laws 适用。 |
| SigLIP | 2023 | ViT + language pair，sigmoid contrastive loss。 |
| SAM 3 | 2025 | Segment anything；ViT-Large + promptable mask decoder。 |

### 为什么它花了很长时间才能成功

由于没有CNN的诱导偏见,因此需要大量数据来匹配CNN. 如果没有超过100万个标记图像或强大的自我监督预训练,在同一个计算下下CNN仍然更强大.


```figure
n5-patch-stream
```

## 构建它

参见`code/main.py`△纯体育的补丁+线性嵌入+智力检查――不进行训练,因为任何现实规模的VT都需要PyTorch和数小时的GPU时间――

### 步骤1:假图像

一个24×24RGB图像,用`(R, G, B)`图像表表示──我们使用6×6补丁 →16个补丁,每个补丁的嵌入向量长度为108──

### 步骤 2: 补丁

```python
def patchify(image, P):
    H = len(image)
    W = len(image[0])
    patches = []
    for i in range(0, H, P):
        for j in range(0, W, P):
            patch = []
            for di in range(P):
                for dj in range(P):
                    patch.extend(image[i + di][j + dj])
            patches.append(patch)
    return patches
```

拉斯特序列:按网格的排序排列.

### 步骤3:线性嵌入

将每一个平补丁乘以一个随机的`(patch_flat_size, d_model)`矩阵──添加 `[CLS]`后,验证输出形状 为 `(N_patches + 1, d_model)`,我知道.

### 步骤4: 统计真实VT的参数

打印ViT-Base的参数:12层、12头、d=768、补丁=16──与ResNet-50(~25M) 比较──ViT-Base 大约是 ~86M──ViT-大 ~307M──ViT-大 ~632M──

## 使用它

```python
from transformers import ViTImageProcessor, ViTModel
import torch
from PIL import Image

processor = ViTImageProcessor.from_pretrained("google/vit-base-patch16-224-in21k")
model = ViTModel.from_pretrained("google/vit-base-patch16-224-in21k")

img = Image.open("cat.jpg")
inputs = processor(img, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, 197, 768): [CLS] + 196 patches
cls_emb = out[:, 0]                       # image representation
```

**DINOv2 embeddings 是 2026 年 image features 的默认选择。**结脊柱,训练一个很小的头部――适用于分类,检索,检测,标题化――Meta的DINOv2检查站 在所有非文本视觉任务上都超过CLIP――

**Patch-size 选择。**小模型使用16×16(ViT-B/16) ――密度预测(分区) 使用8×8或14×14(SAM、DINOv2) ――超大模型使用14×14。

## 交付它

参见`outputs/skill-vit-configurator.md`△这个技能会根据数据集尺寸,分辨率和计算预算,为新的视觉任务选择一个VIT变体和补丁尺寸.

## 练习

1. **Easy.**运行`code/main.py`△验证补丁 数量等于`(H/P) * (W/P)`平补丁维度等于`P*P*C`,我知道.
2. **Medium.**实现2D突形定位嵌入式,即为每个补丁`row`和 `col`创建两个独立的突形代码,并将它们拼接在一起.把它们送进一个小型的 PyTorch ViT,并将其与可学习的位置嵌入式进行比较.
3. **Hard.**构建一个3层 ViT(PyTorch),使用4×4补丁在1000张MNIST图像上训练――测量测试精度――然后在同样的1000张图像上加入DINOv2预训练(简化版:只训练编码器根据面具补丁 预测补丁嵌入式) ――精度是否提升?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Patch | “vision-transformer token” | 图像中一个 `P × P × C` 区域的 pixel values 所组成的扁平 Vector。 |
| Patchify | “Chop + flatten” | 将图像切成不重叠的 patches，并将每个 patch flatten 成一个 Vector。 |
| `[CLS]` token | “图像摘要” | 添加在开头的可学习 token；它的最终 Embedding 是图像表示。 |
| Inductive bias | “模型预设的假设” | ViT 的 priors 比 CNNs 少；需要更多数据来弥补差距。 |
| DINOv2 | “Self-supervised ViT” | 使用 image augmentation + momentum teacher，在没有 labels 的情况下训练。2026 年最好的通用 image features。 |
| SigLIP | “CLIP 的继任者” | ViT + text encoder，使用 sigmoid contrastive loss 训练；在相同 compute 下优于 CLIP。 |
| Swin | “Windowed ViT” | 带有 local attention + shifted windows 的层级 ViT；sub-quadratic。 |
| Register tokens | “2023 trick” | 几个额外的可学习 tokens，用来吸收 attention sinks；可以改进 DINOv2 features。 |

## 延伸阅读

- [Dosovitskiy et al. (2020). An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929) 论文──
- [Touvron et al. (2021). Training data-efficient image transformers & distillation through attention](https://arxiv.org/abs/2012.12877)  
- [Liu et al. (2021). Swin Transformer: Hierarchical Vision Transformer using Shifted Windows](https://arxiv.org/abs/2103.14030)  
- [Oquab et al. (2023). DINOv2: Learning Robust Visual Features without Supervision](https://arxiv.org/abs/2304.07193)    
- [Darcet et al. (2023). Vision Transformers Need Registers](https://arxiv.org/abs/2309.16588) DINOv2 的注册代码修复方案
