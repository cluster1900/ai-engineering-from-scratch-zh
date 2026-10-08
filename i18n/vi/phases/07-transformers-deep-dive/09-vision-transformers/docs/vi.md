# Máy biến hình thị giác (ViT)

> Một bức ảnh được tạo ra bởi một bản vá 组成的网格── một câu được tạo ra bởi một token 组成的网格── cùng một Transformer 都能处理──

**Type:** Build
**Languages:** Python
**先修要求:**Giai đoạn 7 · 05 (Tổng biến thể), Giai đoạn 4 · 03 (CNNs), Giai đoạn 4 · 14 (Vision Transformers intro)
**Time:** ~45 minutes

## 问题

Trước năm 2020, tầm nhìn máy tính 基本就意味着 convolution──ImageNet、COCO 和检测基准 上的所有 SOTA đều sử dụng cột sống CNN──Transformers 则用于语言──

Dosovitskiy et al. (2020) An Image is Worth 16x16 Words 表明, bạn có thể hoàn toàn loại bỏ convolution。 đưa hình ảnh cắt thành các bản vá cố định, sẽ mỗi bản vá 线性投影 vào một Embedding, tái đưa chuỗi này vào một bộ mã hóa biến đổi thông thường。 ở quy mô đủ lớn dưới dạng ImageNet-21k pretraining hoặc lớn hơn),ViT có thể phù hợp thậm chí vượt quá các mô hình dựa trên ResNet。

ViT là sự khởi đầu của xu hướng lớn hơn năm 2026: một cấu trúc, nhiều phương pháp. ViT sẽ Tokenize âm thanh. ViT sẽ Tokenize hình ảnh. ViT sẽ sử dụng mã hành động.

Đến năm 2026, ViT và các thành viên tiếp theo của nó đã chiếm được phần lớn lĩnh vực tầm nhìn.

## 概念

![Image → patches → tokens → transformer](../assets/vit.svg)

### Bước 1  Lắp đặt

Một người`H × W × C`图像拆 thành một `N × (P·P·C)`序列. 平 patch 序列.`224 × 224`Hình ảnh,`16 × 16`Patches → 196 个 patch, mỗi chứa 768 个值──

```
image (224, 224, 3) → 14 × 14 grid of 16x16x3 patches → 196 vectors of length 768
```

Kích thước bản vá là điều khiển chính. Các bản vá nhỏ hơn = nhiều mã thông báo hơn, độ phân giải tốt hơn, độ phân tích thứ hai.

### Bước 2  nhúng tuyến tính

Một matrix học tập độc lập sẽ tạo ra mỗi bản vá bình thường`d_model`This is equal to kernel size 为 `P`      `P`Trong PyTorch, thực tế là như vậy.`nn.Conv2d(C, d_model, kernel_size=P, stride=P)`, chỉ cần 2 đường để thực hiện.

### 步骤 3  前置 `[CLS]`token,添加 vị trí nhúng

- Trong đầu tiên thêm một cái gì đó để học`[CLS]`token──đối cùng của nó được ẩn trạng thái 会作为用于分类的图像表示──
- 添加可学习的位置嵌入式 (ViT 原版) 或突状2D (后续变体)
- Sau năm 2024, RoPE được mở rộng đến vị trí 2D, đôi khi không còn cần phải tích hợp rõ ràng nữa.

### 步骤 4  标准 Transformer encoder

堆叠 L 个 `LayerNorm → Self-Attention → + → LayerNorm → MLP → +`Các khối── với BERT  hoàn toàn giống nhau── không có các lớp cụ thể về tầm nhìn── đây là kết luận cốt lõi của bài viết trên giảng dạy──

### Bước 5  đầu

对于Tân loại:取 `[CLS]`trạng thái ẩn → tuyến tính → mềmmax── đối với DINOv2 hoặc SAM,则丢弃 `[CLS]`, trực tiếp sử dụng các bản che phủ

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

### Tại sao nó mất một thời gian để thành công?

ViT 需要大量数据才能匹配CNN,因为它没有CNN的诱导偏见(翻译不变性、本地性) ⋅如果没有超过100M的标签图像或强大的自我监督预训,在同样的计算下CNNs 仍然更强.


```figure
n5-patch-stream
```

##  xây dựng nó

参见 `code/main.py` Phân tích các bản vá của các máy tính tự động và không cần phải tập luyện, vì bất kỳ ViT nào có kích thước thực đều cần PyTorch và số giờ GPU  thời gian。

### 步骤 1: hình ảnh giả

Một hình ảnh RGB 24 × 24, dùng`(R, G, B)`tuples 的行列表表示──我们使用 6×6 patches → 16 patches, mỗi patch của Embedding Vector 长度为 108──

### 步骤 2: Patchify

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

Trật tự Raster:按网格的行-主要 顺序排列──所有 ViT 都使用这种顺序──

### 步骤 3: nhúng tuyến tính

Mỗi đệm sẽ được nhân bằng một đệm tùy ý.`(patch_flat_size, d_model)`Matrix──添加 `[CLS]`后, xác nhận xuất dạng 为 `(N_patches + 1, d_model)`

### Bước 4: 统计 thực sự ViT của các tham số

打印 ViT-Base 的参数:12 lớp、12 đầu、d=768、patch=16──与ResNet-50(~25M) 比较。ViT-Base 大约是 ~86M──ViT-Large ~307M──ViT-Huge ~632M──

## Sử dụng nó

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

**DINOv2 embeddings 是 2026 年 image features 的默认选择。**结脊椎,训练一个很小的头――适用于分类,检索,检测,标题化――Meta's DINOv2 checkpoints 在所有非文本视觉任务上都超过CLIP――

**Patch-size 选择。**小模型使用 16×16(ViT-B/16)。 Dự đoán mật độ (Density prediction)  phân đoạn (segmentation)  sử dụng 8×8 hoặc 14×14(SAM、DINOv2)。超大模型使用 14×14。

## 交付 nó

参见 `outputs/skill-vit-configurator.md`◊ kỹ năng này sẽ dựa trên kích thước bộ dữ liệu, độ phân giải và ngân sách tính toán, cho nhiệm vụ tầm nhìn mới  chọn một biến thể ViT và kích thước váy.

## 练习

1. **Easy.**运行 `code/main.py` Kiểm tra đệm số lượng bằng `(H/P) * (W/P)`,平 patch 维度等于 `P*P*C`
2. **Medium.**实现 2D sinusoidal vị trí nhúng, tức为 mỗi váy `row`和 `col`Tạo hai mã sinusoidal độc lập, và sẽ viết chúng lại. Đưa chúng vào một PyTorch ViT nhỏ, và so sánh CIFAR-10 với độ chính xác của việc nhúng vị trí có thể học được.
3. **Hard.**构建一个3层 ViT(PyTorch), sử dụng 4×4 patch 在 1,000 张 MNIST 图像上训练――测量测试精度──然后在同样 1,000 张图像上加入 DINOv2预训(简化版:只训练编码器 根据掩盖补丁 预测补丁嵌入) ――精度是否提升?

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

- [Dosovitskiy et al. (2020). An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929) ViT 论文。
- [Touvron et al. (2021). Training data-efficient image transformers & distillation through attention](https://arxiv.org/abs/2012.12877) DeiT。
- [Liu et al. (2021). Swin Transformer: Hierarchical Vision Transformer using Shifted Windows](https://arxiv.org/abs/2103.14030) Đồ lôi.
- [Oquab et al. (2023). DINOv2: Learning Robust Visual Features without Supervision](https://arxiv.org/abs/2304.07193) DINOv2──
- [Darcet et al. (2023). Vision Transformers Need Registers](https://arxiv.org/abs/2309.16588) DINOv2's registry-token 修复方案。
