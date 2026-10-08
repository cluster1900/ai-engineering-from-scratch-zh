# تحويلات الرؤية (ViT)

> 一张图像由补丁组成网格──一句由代币组成网格──同一个变压器都能处理──

**Type:** Build
**Languages:** Python
**先修要求:**المرحلة 7 · 05 (المحول الكامل) ، المرحلة 4 · 03 (CNNs) ، المرحلة 4 · 14 (مرحلة تعريف للمحولات الرؤية)
**Time:** ~45 minutes

## 问题

في عام 2020، الرؤية الحاسوبية 基本就意味着 convolution──ImageNet、COCO 和检测基准 上所有SOTA 都使用CNN backbone──Transformers 则用于语言──

دوسويتسكي وآخرون (2020) الصورة تستحق 16 × 16 كلمة  تشير إلى أنه يمكنك التخلص تماما من التحولات‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

فيست هي بداية الاتجاهات الأكبر لعام 2026: نوع من البنية، العديد من الطرق. فيست سوف تدوين الصوت. فيست سوف تدوين الصور. فيست ستدوين الصور. فيست ستستخدم رموز العمل. فيست تستخدم رموز الفيديو. فيستعمل رموز البيكسل. فيستور ليس مهتمًا بالدخول.

بحلول عام 2026 ، تمتلك شركة ViT  ومتابعتها بعدها ((DeiT、Swin、DINOv2、ViT-22B、SAM 3) معظم مجالات الرؤية.

## 概念

![Image → patches → tokens → transformer](../assets/vit.svg)

### الخطوة 1  إصلاح

سأقوم`H × W × C`صورة تمزيقها إلى واحدة`N × (P·P·C)`序列──典型设置是:`224 × 224`الصور`16 × 16`اللصوص → 196 个 اللصوص، كل منها 768 个值──

```
image (224, 224, 3) → 14 × 14 grid of 16x16x3 patches → 196 vectors of length 768
```

حجم اللصقة هو عنصر أساسي التحكم. والصفات الأصغر = أكثر رموز.

### الخطوة 2  إضافة خطية

ماريخ واحد يتعلم سوف يضع كل ملصق مسطح`d_model` هذا يساوي حجم النجمة`P`خطوة`P`هذا هو الواقع في بيتورش`nn.Conv2d(C, d_model, kernel_size=P, stride=P)`، فقط تحتاج إلى 2 صفوف لتطبيقها

### 步骤 3  前置 `[CLS]`رمز، أضيف إضافة وضعية

- في البداية إضافة واحد يمكن التعلم `[CLS]`رمزها. ستعمل كنموذج لتحديد الصف.
- 添加可学习的位置嵌入式 (ViT 原版) أو سينوسيدال 2D (后续变体)
- بعد عام 2024، سيتم توسيع ROPE إلى وضع 2D، وبعدها لا تحتاج إلى إضافة واضحة.

### 步骤 4  标准 مُرسلات تحويل

堆叠 L 个 `LayerNorm → Self-Attention → + → LayerNorm → MLP → +`كتلة:                                                                                                                                                                                                                                                              

### الخطوة 5

对于 التصنيف:取 `[CLS]`الحالة الخفية → خطية → غاية الرقابة.`[CLS]`, مباشرة استخدام إضافة اللصوص

### غيرات مهمة

| Model | Year | Change |
|-------|------|--------|
| ViT | 2020 | 原始版本。固定 patch size，完整 global attention。 |
| DeiT | 2021 | Distillation；只用 ImageNet-1k 就能训练。 |
| Swin | 2021 | 使用 shifted windows 的层级结构。固定的 sub-quadratic 成本。 |
| DINOv2 | 2023 | Self-supervised（无 labels）。最好的通用 vision features。 |
| ViT-22B | 2023 | 22B 参数；scaling laws 适用。 |
| SigLIP | 2023 | ViT + language pair，sigmoid contrastive loss。 |
| SAM 3 | 2025 | Segment anything；ViT-Large + promptable mask decoder。 |

### لماذا استغرق الأمر وقتاً طويلاً حتى نجح

فيالت  بحاجة إلى الكثير من البيانات لتطابق سي إن إن ، لأنه لا يحتوي على تحيزات تحديدية مثل سي إن إن ((معدل غير متغير)) ، إذا لم يكن هناك أكثر من 100 مليون صورة معلقة أو تدريبات سابقة ذاتية إشرافية قوية ، في نفس الحساب أسفل سي إن إن إن  لا تزال أقوى.


```figure
n5-patch-stream
```

## بناءها

参见 `code/main.py` إصلاح المواد المزروعة + إضافة خطية + فحص الصحة العقلية.

### الخطوة 1: صورة مزيفة

صورة 24 × 24 RGB، استخدام `(R, G, B)`تعريف صفوف الأوراق التابعة للـ:

### الخطوة 2: إصلاح

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

ترتيب الرأس: حسب الصف الرئيسية 顺序排列──所有VT 都使用这种顺序──

### 步骤 3: إرسال خطي

سوف كل ملصق مسطح ضرب واحد من الاختيار`(patch_flat_size, d_model)`المصفوفة`[CLS]`后,验证输出形 为 `(N_patches + 1, d_model)`.

### الخطوة 4: 统计真实ViT 的参数

打印 ViT-Base 的参数:12 طبقة、12 رؤوس、d=768、patch=16──与ResNet-50(~25M)比较。

## استخدمها

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

**DINOv2 embeddings 是 2026 年 image features 的默认选择。**结脊椎, تدريب رأس صغير جدا. 适用于分类,检索,检测,标题化.

**Patch-size 选择。**小模型使用 16×16(ViT-B/16)。 التنبؤات الكثافة(التقسيم) استخدام 8×8 أو 14×14(SAM、DINOv2)。超大模型 استخدام 14×14。

## 交付 it

参见 `outputs/skill-vit-configurator.md` هذه المهارة سوف تبعاً لقياس مجموعة البيانات  القرار وميزانية الحساب، لمهام الرؤية الجديدة  اختيار فاريان ViT و حجم اللصوص 

## التدريب

1. **Easy.**运行 `code/main.py` تصحيح الملفات`(H/P) * (W/P)`, 平 ملصق 维度等于 `P*P*C`.
2. **Medium.**实现 2D sinusoidal position embeddings,即为每补丁的 `row`和 `col`إنشاء رمزين سينوسيدالين مستقلين، ووضعهم معا. وضعهم في جهاز PyTorch ViT صغير، ويقارن مع CIFAR-10 على دقة التوابل الموضعية القابلة للتعلم.
3. **Hard.**构建一个3层 ViT(PyTorch),使用4×4补丁 在 1,000 张 MNIST 图像上训练――测试精度──然后在同样 1,000 张图像上加入DINOv2预训练(简化版:只训练编码器 根据掩盖补丁 预测补丁嵌入) ――精度 是否提升?

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
- [Liu et al. (2021). Swin Transformer: Hierarchical Vision Transformer using Shifted Windows](https://arxiv.org/abs/2103.14030)سجن
- [Oquab et al. (2023). DINOv2: Learning Robust Visual Features without Supervision](https://arxiv.org/abs/2304.07193) دينوف2。
- [Darcet et al. (2023). Vision Transformers Need Registers](https://arxiv.org/abs/2309.16588) دينوف2 修复方案
