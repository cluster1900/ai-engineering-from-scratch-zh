# Görme Transformerleri (ViT)

> Bir resim bir token tarafından oluşturulmuştur. Aynı bir transformator tarafından işlenmiştir.

**Type:** Build
**Languages:** Python
**先修要求:**7. · 05 aşaması (Tüm Transformer), 4. · 03 aşaması (CNNs), 4. · 14 aşaması (Vision Transformers giriş)
**Time:** ~45 minutes

## 问题

2020 yılına kadar, bilgisayar görme 基本就意味着卷曲──ImageNet、COCO 和检测基准 上的所有SOTA 都使用CNN脊柱──Transformers则用于语言──

Dosovitskiy et al. (2020) An Image is Worth 16x16 Words                                                                                                                                                                                                                                                     

ViT 2026 yılının daha büyük bir eğilim başlangıcıdır: bir yapı, çeşitli modaliteler.

2026 yılına kadar, ViT ve sonraki halefi (DeiT、Swin、DINOv2、ViT-22B、SAM 3) görme alanının büyük kısmını ele almıştır.

## 概念

![Image → patches → tokens → transformer](../assets/vit.svg)

### Adım 1  Yapıştır

Bir tane olacak .`H × W × C`Bir resim parçalanır.`N × (P·P·C)`平 patch 序列── tipik ayar:`224 × 224`Resimler,`16 × 16`Çizgiler → 196 个补丁, her birinde 768 个值 bulunmaktadır.

```
image (224, 224, 3) → 14 × 14 grid of 16x16x3 patches → 196 vectors of length 768
```

Patch boyutu, önemli bir kontrol değeri. Daha küçük patches = daha fazla token, daha iyi çözünürlük, ikinci yön dikkat, daha büyük patches = daha kaba, daha uygun.

### Adım 2  Düzsel yerleştirme

Tek bir öğrenilmiş matris her düzlemde bir patç oluşturur .`d_model`                                                                                                                                                                                                                                                              `P`İşe yarayacak.`P`PyTorch'de bu aslında `nn.Conv2d(C, d_model, kernel_size=P, stride=P)`Sadece 2 tane yapılması gerekiyor.

### 步骤 3  前置 `[CLS]`Token,添加 pozisyonsal yerleşimler

- Bir öğrenilene ekle.`[CLS]`token── son gizli durumunu sınıflandırma için kullanılan bir görüntü göstergesi olarak kullanır──
- 添加可学习的位置嵌入式 (ViT 原版) 或 sinusoidal 2D (后续变体)
- 2024'ten sonra, RoPE 2 boyutlu pozisyonlara genişletilir ve artık açık bir yerleştirme gerektirmez.

### 步骤 4  标准 Transformer kodlayıcı

Bir sürü şey .`LayerNorm → Self-Attention → + → LayerNorm → MLP → +`Bloklar, BERT ile tamamen aynıdır. Görüşü özel katmanları yoktur.

### Adım 5  baş

对于Taplama:取 `[CLS]`Gizli durum → doğrusal → yumuşak maksimum── DINOv2 veya SAM için, 则丢弃`[CLS]`, doğrudan patch yerleştirmelerini kullanmak için

###  önemli değişim

| Model | Year | Change |
|-------|------|--------|
| ViT | 2020 | 原始版本。固定 patch size，完整 global attention。 |
| DeiT | 2021 | Distillation；只用 ImageNet-1k 就能训练。 |
| Swin | 2021 | 使用 shifted windows 的层级结构。固定的 sub-quadratic 成本。 |
| DINOv2 | 2023 | Self-supervised（无 labels）。最好的通用 vision features。 |
| ViT-22B | 2023 | 22B 参数；scaling laws 适用。 |
| SigLIP | 2023 | ViT + language pair，sigmoid contrastive loss。 |
| SAM 3 | 2025 | Segment anything；ViT-Large + promptable mask decoder。 |

### Neden başarılı olmak için uzun zaman aldı?

CNN'e uymak için çok fazla veri gerektirir çünkü CNN'in indüktif önyargıları yoktur. Eğer 100M'den fazla etiketli görüntü veya güçlü kendiliğinden denetimli önceden eğitim yoksa, aynı hesapta aşağıdaki CNN'ler daha güçlüdür.


```figure
n5-patch-stream
```

## Yapın onu.

参见 `code/main.py`△ Pure stdlib patchify + linear embedding + sanity checks── hiç eğitim yapılmıyor, çünkü herhangi bir gerçek boyutlu ViT için PyTorch ve birkaç saatlik GPU 时间──

### 步骤 1: sahte görüntü

Bir 24 × 24 RGB görüntü, kullan `(R, G, B)`tuples さんの行列表表示── 我们使用 6×6 patches → 16 个 patches,每个 patch 的嵌入向量 长度为 108──

### 步骤 2: patchify

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

Raster sırası: net格'ın büyük satırına göre 顺序排列── tüm ViT 都使用这种顺序──

### 步骤 3: Düzsel yerleştirme

Her düzlemeyi bir düzleme olarak çarpın .`(patch_flat_size, d_model)`Matrix── 添加`[CLS]`后,验证输出形 为 `(N_patches + 1, d_model)`- Evet.

### 步骤 4: 统计真实 ViT 的参数

打印 ViT-Base'nin parametre sayısı: 12 katman、12 baş、d=768、patch=16──=ResNet-50(~25M) 比較。ViT-Base 大約是 ~86M──ViT-Large ~307M──ViT-Huge ~632M──

## Kullan

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

**DINOv2 embeddings 是 2026 年 image features 的默认选择。**结脊椎,训练一个很小的头――适用于分类,检索,检测,标题化――Meta'nın DINOv2 kontrol noktaları 在所有非文本视觉任务上都超越 CLIP――

**Patch-size 选择。**小模型使用 16×16(ViT-B/16)。 yoğunluk tahminı(segmentasyon) 8×8 veya 14×14(SAM、DINOv2)。超大模型使用 14×14。

## - Söyle.

参见 `outputs/skill-vit-configurator.md`◊ Bu beceri, veri kümesi boyutuna göre ⋅ çözünürlük ve hesaplama bütçesine göre yeni bir vizyon görevi için ⋅ bir ViT varianti ve patch boyutunu seçmek.

## 练习

1. **Easy.**运行  İşlem`code/main.py`△ Test patch 数量等于 `(H/P) * (W/P)`,平 yama 维度等于 `P*P*C`- Evet.
2. **Medium.**实现 2D sinusoidal pozisyonsal yerleşimleri, yani için her yama `row`和 `col`İki bağımsız sinusoidal kod oluşturup, onları birbiriyle birleştirerek küçük bir PyTorch ViT'ye gönderir ve CIFAR-10'a göre öğrenilebilir konumsal yerleşimlerin doğruluğunu karşılaştırır.
3. **Hard.**构建一个3层 ViT(PyTorch),使用4×4 patches 在 1,000 张 MNIST 图像上训练――测试精度──然后在同样 1,000 张图像上加入 DINOv2预训(简化版:只训练编码器 根据掩盖补丁 预测补丁嵌入) ――精度是否提升?

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
- [Touvron et al. (2021). Training data-efficient image transformers & distillation through attention](https://arxiv.org/abs/2012.12877)- Evet.
- [Liu et al. (2021). Swin Transformer: Hierarchical Vision Transformer using Shifted Windows](https://arxiv.org/abs/2103.14030)- Swin.
- [Oquab et al. (2023). DINOv2: Learning Robust Visual Features without Supervision](https://arxiv.org/abs/2304.07193)DINOv2──
- [Darcet et al. (2023). Vision Transformers Need Registers](https://arxiv.org/abs/2309.16588)DINOv2'in kayıt simgesi 修复方案。
