# दृष्टि परिवर्तनक (ViT)

> एक वाक्य टोकन से बना है एक छवि एक पैच से बना है एक वाक्य टोकन से बना है एक ही ट्रांसफार्मर से बना है।

**Type:** Build
**Languages:** Python
**先修要求:**चरण 7 · 05 (पूर्ण ट्रांसफार्मर), चरण 4 · 03 (सीएनएन), चरण 4 · 14 (विजन ट्रांसफार्मर का परिचय)
**Time:** ~45 minutes

## 问题

2020 से पहले, कंप्यूटर विजन 基本就意味着 convolution──ImageNet、COCO 和 डिटेक्शन बेंचमार्क 上的所有 SOTA 都使用 CNN रीढ़ की हड्डी── ट्रांसफॉर्मर 则用于语言──

Dosovitskiy et al. (2020) का एक छवि 16x16 शब्द                                                                                                                                                                                                                                                      

ViT 2026 साल की बड़ी प्रवृत्ति की शुरुआत हैः एक संरचना, कई प्रकार के मोडेलिजमॆ विस्पर ऑडियो टोकनलाइजमॆ विट छवियों को टोकनलाइजमॆ रोबोटिक्स एक्शन टोकनलाइजमॆ विडियोपिक्सेल टोकनलाइजमॆ ट्रांसफार्मरॆ नहीं फ़िक्र में है इनपुट क्या है, जब तक इसे एक क्रम दे, यह सीख सकता है。

2026 तक, ViT  और उसके बाद के उत्तराधिकारी ((DeiT、Swin、DINOv2、ViT-22B、SAM 3) ने दृष्टि के अधिकांश क्षेत्र पर कब्जा कर लिया है।

## 概念

![Image → patches → tokens → transformer](../assets/vit.svg)

### चरण 1  पैच करें

एक होगा `H × W × C`图像拆成一个 `N × (P·P·C)`平 पैच 序列──典型设置是:`224 × 224`चित्र,`16 × 16`पैच → 196 个 पैच, प्रत्येक में 768 个值 शामिल हैं

```
image (224, 224, 3) → 14 × 14 grid of 16x16x3 patches → 196 vectors of length 768
```

पैच आकार है की कुंजी नियंत्रण स्तंभ── छोटे पैच = अधिक टोकन、 बेहतर रिज़ॉल्यूशन、 दूसरी ओर ध्यान 成本── बड़े पैच = 更粗、更便宜──

### चरण 2  रैखिक एम्बेडिंग

एक अलग सीखा मैट्रिक्स प्रत्येक 平 पैच 投影 `d_model` यह खजाने के आकार के बराबर है `P`≈ कदम ≈`P`के संभलण में।`nn.Conv2d(C, d_model, kernel_size=P, stride=P)`, केवल 2 कदम की जरूरत है इसे पूरा करने के लिए.

### 步骤 3  前置 `[CLS]`टोकन,添加 स्थितिगत एम्बेडिंग

- एक सीखना शुरू में जोड़ा `[CLS]`प्रतीक── इसकी अंतिम छिपी हुई स्थिति 会作为用于 वर्गीकरण के चित्र表示──
- 添加可学习的位置嵌入式 (ViT 原版) या सिनुसोइडल 2D (后续变体)
- 2024 के बाद, RoPE को 2D स्थिति में विस्तारित किया जाएगा, कभी कभी स्पष्ट रूप से एम्बेडिंग की आवश्यकता नहीं होगी।

### 步骤 4  标准 ट्रांसफार्मर एन्कोडर

堆叠 L 个 `LayerNorm → Self-Attention → + → LayerNorm → MLP → +`ब्लॉक── BERT के साथ 完全相同── कोई दृष्टि-विशिष्ट परतें नहीं── यह इस लेख में शिक्षण पर केंद्रीय निष्कर्ष है──

### चरण 5  सिर

对于 वर्गीकरण:取 `[CLS]`छिपी हुई अवस्था → रैखिक → नरम अधिकतम── DINOv2 अथवा SAM के लिए,则丢弃 `[CLS]`, सीधे पैच एम्बेड का उपयोग करें

###  महत्वपूर्ण परिवर्तन

| Model | Year | Change |
|-------|------|--------|
| ViT | 2020 | 原始版本。固定 patch size，完整 global attention。 |
| DeiT | 2021 | Distillation；只用 ImageNet-1k 就能训练。 |
| Swin | 2021 | 使用 shifted windows 的层级结构。固定的 sub-quadratic 成本。 |
| DINOv2 | 2023 | Self-supervised（无 labels）。最好的通用 vision features。 |
| ViT-22B | 2023 | 22B 参数；scaling laws 适用。 |
| SigLIP | 2023 | ViT + language pair，sigmoid contrastive loss。 |
| SAM 3 | 2025 | Segment anything；ViT-Large + promptable mask decoder。 |

### क्यों यह सफल होने के लिए एक समय लगा

वीआईटी को सीएनएन के साथ मेल खाने के लिए बड़ी मात्रा में डेटा की आवश्यकता होती है, क्योंकि इसमें सीएनएन के प्रेरक पूर्वाग्रहों का कोई अभाव नहीं है।


```figure
n5-patch-stream
```

##  इसे निर्माण

参见 `code/main.py`纯 stdlib के पैचिफ + रैखिक एम्बेडिंग + सेनेटरी चेक ️ नहीं किया जाता, क्योंकि किसी भी वास्तविक आकार के ViT को PyTorch और कुछ घंटों के GPU  समय की आवश्यकता होती है

### 步骤 1: नकली छवि

एक 24 × 24 आरजीबी छवि, उपयोग `(R, G, B)`tuples का行列表表示──我们使用 6×6 पैच → 16 个 पैच, प्रत्येक पैच का एम्बेडिंग वेक्टर 长度为 108──

### 步骤 2: पैच

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

रैस्टर क्रम:按网格的排列顺序-主要顺序―― सभी वीटी इस क्रम का उपयोग करते हैं

### 步骤 3: रैखिक एम्बेड

प्रत्येक 平 पैच एक के साथ गुणा `(patch_flat_size, d_model)`मैट्रिक्स──添加 `[CLS]`后,验证输出形 为 `(N_patches + 1, d_model)`

### 步骤 4: 统计真实 ViT के तत्व

打印 ViT-Base के पैरामीटर:12 परत、12 सिर、d=768、patch=16──与ResNet-50(~25M) तुलना。ViT-Base 大约是 ~86M──ViT-Large ~307M──ViT-Huge ~632M──

## इसका उपयोग करें

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

**DINOv2 embeddings 是 2026 年 image features 的默认选择。**结脊椎, प्रशिक्षण एक बहुत छोटा सिर──适用于 वर्गीकरण, पुनर्प्राप्ती, पता लगाने, कैप्शनिंग──मेटा के DINOv2 चेक पॉइंट्स 在所有非文本视觉任务上都超越CLIP──

**Patch-size 选择。**小模型使用 16×16(ViT-B/16)。 घनत्व भविष्यवाणी(विभाजन) 8×8 या 14×14(SAM、DINOv2)。超大模型使用 14×14。

## 交付 यह

参见 `outputs/skill-vit-configurator.md` यह कौशल डाटासेट आकार, संकल्प और गणना बजट के आधार पर, नए दृष्टि कार्य के लिए  एक ViT संस्करण और पैच आकार का चयन करें

## अभ्यास

1. **Easy.**运行 `code/main.py` सत्यापन पैच संख्या बराबर `(H/P) * (W/P)`,平 पैच 维度等于 `P*P*C`
2. **Medium.**实现 2D sinusidal स्थिति सम्मिलित, यानी प्रत्येक पैच के लिए `row`和 `col` दो स्वतंत्र सिनोसाइडल कोड बनाएं, उन्हें एक साथ लिखें, उन्हें एक छोटे से PyTorch ViT में भेजें, और CIFAR-10 की तुलना इसे सीखने योग्य स्थिति एम्बेडिंग की सटीकता से करें
3. **Hard.**建构一个3层 ViT(PyTorch), 4×4 पैचों का उपयोग करके 1,000 张 MNIST 图像上训练――测试精度――然后在同样 1,000 张图像上加入 DINOv2 प्री-训练(简化版:只训练编码器 根据掩盖补丁 预测补丁嵌入) ――精度是否提升?

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

- [Dosovitskiy et al. (2020). An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929) ViT 论文──
- [Touvron et al. (2021). Training data-efficient image transformers & distillation through attention](https://arxiv.org/abs/2012.12877) डेटिट。
- [Liu et al. (2021). Swin Transformer: Hierarchical Vision Transformer using Shifted Windows](https://arxiv.org/abs/2103.14030) स्विन。
- [Oquab et al. (2023). DINOv2: Learning Robust Visual Features without Supervision](https://arxiv.org/abs/2304.07193) DINOv2──
- [Darcet et al. (2023). Vision Transformers Need Registers](https://arxiv.org/abs/2309.16588) DINOv2 का रजिस्टर-टोकन 修复方案──
