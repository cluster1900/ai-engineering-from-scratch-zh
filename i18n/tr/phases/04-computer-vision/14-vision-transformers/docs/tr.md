# Görme Transformerleri (ViT)

> Resimleri parça parça olarak kes, her bir parça bir kelime olarak, standart transformatör kullanın.

**类型：**Yapım
**语言：**Python
**前置要求：**7. aşama 02 ders (Öz dikkat), 4. aşama 04 ders (İsmin sınıflandırması)
**时间：**~ 45 dakika

## Öğrenme hedefi

- ZERO patch embedden, öğrenilmiş pozisyonsal embedden, sınıf jetonu ve transformatör kodlayıcı bloklarını oluşturarak, en az bir ViT oluşturun.
- Neden VT'nin deniz öncesi eğitim verilerine ihtiyacı olduğu düşünülmüştü, ancak DeiT ve MAE'nin kanıtladığı kadar bu doğru değildi.
- Architektur öncesinden açılardan karşılaştırın ViT、Swin 和 ConvNeXt(无先验、局部窓注意、conv omurgası)
- Kullanım`timm`和標準 linear-probe / fine-tune 流程,在小数据集上 fine-tune 预训ViT

## 问题

On yıl boyunca, dönüşüm 几乎就是计算机视觉的同义词──CNN 具有很强的诱导偏见,包括本地性、翻译等差,没人认为你能替代它们──随后 Dosovitskiy et al. (2020) 证明, a direct应用于展平图像补丁的普通变压器,完全不使用 convolutional 机制,也能在规模足够大时匹配甚至超过最好的CNN──

关键在于规模足够大──在 ImageNet-1k 上,ViT 输给了ResNet──先在 ImageNet-21k 或 JFT-300M 上预训,再在 ImageNet-1k 上细调的ViT则超过了它──当时的结论是:变压器 缺少有用的先验,但可以从足够多的数据中学习这些先验──后续工作 ((DeiT、MAE、DINO) 显示, eğitim biçimi doğruysa, örneğin güçlü büyütme、自监督预训、蒸,ViT 在小数据上也可以训练很好──

2026 yılına kadar, tamamen CNN kenar cihazlarda hala rekabet gücü vardır. ConvNeXt en güçlüdür. Ancak transformörler diğer neredeyse tüm yönleri yönlendiriyor.

## 核心概念

### 流程

```mermaid
flowchart LR
    IMG["Image<br/>(3, 224, 224)"] --> PATCH["Patch embedding<br/>conv 16x16 s=16<br/>-> (768, 14, 14)"]
    PATCH --> FLAT["Flatten to<br/>(196, 768) tokens"]
    FLAT --> CAT["Prepend<br/>[CLS] token"]
    CAT --> POS["Add learned<br/>positional embed"]
    POS --> ENC["N transformer<br/>encoder blocks"]
    ENC --> CLS["Take [CLS]<br/>token output"]
    CLS --> HEAD["MLP classifier"]

    style PATCH fill:#dbeafe,stroke:#2563eb
    style ENC fill:#fef3c7,stroke:#d97706
    style HEAD fill:#dcfce7,stroke:#16a34a
```

七个步骤――Patches -> tokens -> attention -> classifier──每个变体(DeiT、Swin、ConvNeXt、MAE pretraining) 都只改变这七步中的一个两个,其余保持不变──

### Çizgileme yerleştirme

İlk konvulsiyon önemli bir noktayı oluşturur. Kernel boyutu 16, aşama 16, bu nedenle bir 张 224x224 图像会变成 14x14 的网格,由 16x16 补丁组成,每个补丁被投影为768-dimen嵌入──这个单独的 conv 同时完成补丁 和线性投射──

```
Input:  (3, 224, 224)
Conv (3 -> 768, k=16, s=16, no padding):
Output: (768, 14, 14)
Flatten spatial: (196, 768)
```

196 yama = 196 token。 her token'un özellik boyutu 768(ViT-B)、1024(ViT-L) veya 1280(ViT-H)。

### Sınıf simgesi

Bir öğrenilmiş vektör ekle:

```
tokens = [CLS; patch_1; patch_2; ...; patch_196]   shape (197, 768)
```

Transformer bloklarından geçtikten sonra,`[CLS]`Çıkışı, tüm tablo görüntü gösterimi.

### Konum yerleştirme

Transformers 没有内置的空间位置概念──为每个代号加上一个学习向量:

```
tokens = tokens + learned_pos_embedding   (also shape (197, 768))
```

Bu yerleştirme, modelin bir parametresidir; gradient tabanlı eğitim onu 2D  görüntü yapısına uyumlu hale getirir.

### Transformer kodlayıcı blok

标准结构──Multi-head self-attention、MLP、residual connections、pre-LayerNorm──

```
x = x + MSA(LN(x))
x = x + MLP(LN(x))

MLP is two-layer with GELU: Linear(d -> 4d) -> GELU -> Linear(4d -> d)
```

ViT-B/16                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

### Neden LN öncesi kullanın

早期 transformator 使用 post-LN(`x = LN(x + sublayer(x))`), ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒                                                                                                                                                                `x = x + sublayer(LN(x))`) ısınma olmadan daha derin ağları düzenleyebilirsiniz.

### Patch boyutu 权衡

- 16x16 yama -> 196 token, standart ayar
- 32x32 patches -> 49 token, daha hızlı ama çözünürlük daha düşük.
- 8x8 patches -> 784 token, daha net, ama O(n^2) dikkat maliyeti 扩展性很差──

Daha büyük yamalar = daha az token = daha hızlı ama uzay ayrıntıları daha az──SwinV2 hiyerarşik pencerelerde 4x4 yamalar kullanır──

### DeiT in ImageNet-1k 上训练 ViT'in yapısı

İlk ViT 需要JFT-300M 才能超过CNN──DeiT(Touvron et al., 2020) sadece ImageNet-1k ile,

1. Ağır artış: RandAugment、Mixup、CutMix、Random Erasing。
2. Stokastik derinlik:)))
3. Tekrarlanan artış ((( Aynı resim her partide 中采样 3 次)
4. CNN öğretmeni tarafından yapılan bir test, daha fazla doğruluk sağlayacak.

Her modern ViT eğitim üsteliği DeiT'den kaynaklanıyor.

### Swin vs ConvNeXt

- **Swin**(Liu et al., 2021)                                                                                                                                                                                                                                                           
- **ConvNeXt**(Liu et al., 2022)  重新设计的 CNN,匹配 Swin's架构选择(deeply convs、LayerNorm、GELU、inverted bottleneck) 

2026 yılında, ConvNeXt-V2 和 Swin-V2 都是生产级选择;正确选择取决于你的推理堆(ConvNeXt 更适合边缘 编译) 和预训 corpus──

### MAE öncesi eğitim

Maskeli Otomatik Kodlayıcı (Masked Autoencoder) (He et al., 2022):随机 mask 75% yamalar, training encoder 只处理可见的25%,再训练一个小码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码

MAE 让 ViT sadece ImageNet-1k ile eğitim, SOTA ulaşmak, ve şu anda kabul edilmiş kendi kendine denetim 配方──


```figure
batchnorm-inference
```

## Yapın onu.

### 步骤 1: Patch yerleştirme

```python
import torch
import torch.nn as nn

class PatchEmbedding(nn.Module):
    def __init__(self, in_channels=3, patch_size=16, dim=192, image_size=64):
        super().__init__()
        assert image_size % patch_size == 0
        self.proj = nn.Conv2d(in_channels, dim, kernel_size=patch_size, stride=patch_size)
        num_patches = (image_size // patch_size) ** 2
        self.num_patches = num_patches

    def forward(self, x):
        x = self.proj(x)
        return x.flatten(2).transpose(1, 2)
```

Bir kon, bir düz, bir transpose. İşte tam bir resim-to-token adım.

### 步骤 2: Transformer blok

Ön LN, çok kişilik özdeyiş, GELU'nun MLP'si, kalıntılı bağlantılar.

```python
class Block(nn.Module):
    def __init__(self, dim, num_heads, mlp_ratio=4, dropout=0.0):
        super().__init__()
        self.ln1 = nn.LayerNorm(dim)
        self.attn = nn.MultiheadAttention(dim, num_heads, dropout=dropout, batch_first=True)
        self.ln2 = nn.LayerNorm(dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim, dim * mlp_ratio),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(dim * mlp_ratio, dim),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        a, _ = self.attn(self.ln1(x), self.ln1(x), self.ln1(x), need_weights=False)
        x = x + a
        x = x + self.mlp(self.ln2(x))
        return x
```

`nn.MultiheadAttention`负责拆分头、规模点产品和输出投影──`batch_first=True`Bu yüzden şekiller de öyle.`(N, seq, dim)`- Evet.

### 3 adım:

```python
class ViT(nn.Module):
    def __init__(self, image_size=64, patch_size=16, in_channels=3,
                 num_classes=10, dim=192, depth=6, num_heads=3, mlp_ratio=4):
        super().__init__()
        self.patch = PatchEmbedding(in_channels, patch_size, dim, image_size)
        num_patches = self.patch.num_patches
        self.cls_token = nn.Parameter(torch.zeros(1, 1, dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, dim))
        self.blocks = nn.ModuleList([
            Block(dim, num_heads, mlp_ratio) for _ in range(depth)
        ])
        self.ln = nn.LayerNorm(dim)
        self.head = nn.Linear(dim, num_classes)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)

    def forward(self, x):
        x = self.patch(x)
        cls = self.cls_token.expand(x.size(0), -1, -1)
        x = torch.cat([cls, x], dim=1)
        x = x + self.pos_embed
        for blk in self.blocks:
            x = blk(x)
        x = self.ln(x[:, 0])
        return self.head(x)

vit = ViT(image_size=64, patch_size=16, num_classes=10, dim=192, depth=6, num_heads=3)
x = torch.randn(2, 3, 64, 64)
print(f"output: {vit(x).shape}")
print(f"params: {sum(p.numel() for p in vit.parameters()):,}")
```

Yaklaşık 2.8M parametreleri, CPU'da işlenebilen küçük bir ViT. Gerçek ViT-B 86M'dir; aynı sınıf tanımını kullanır,并设置`dim=768, depth=12, num_heads=12`- Evet.

### 步骤 4: Akıl sağlığı kontrolü  单图像推断

```python
logits = vit(torch.randn(1, 3, 64, 64))
print(f"logits: {logits}")
print(f"probs:  {logits.softmax(-1)}")
```

应该能无错运行── olasılıklar 总和为 1──

## Kullan

`timm`提供了所有 ViT 变体及其 ImageNet önceden eğitilmiş ağırlıklar──一行代码:

```python
import timm

model = timm.create_model("vit_base_patch16_224", pretrained=True, num_classes=10)
```

`timm`2026 yılında görme transformörlerinin üretimi için bir seçenek. Aynı API'de, ViT, DeiT, Swin, Swin-V2 ve ConvNeXt, ConvNeXt, MaxViT, MViT, EfficientFormer ve diğer onlarca model desteklenmektedir.

对于多动态 工作(resim + metin),`transformers`提供 CLIP、SigLIP、BLIP-2、LLaVA── bu modellerde görüntü kodlayıcıları bir çeşit ViT 变体──

## - Söyle.

Bu ders:

- `outputs/prompt-vit-vs-cnn-picker.md` Bir istek, veri kümesi boyutlarına göre, hesaplama ve sonuç yığınında,
- `outputs/skill-vit-patch-and-pos-embed-inspector.md` Bir beceri, ViT'in yama yerleştirmesini ve pozisyonal yerleştirme şekilleri doğrulanması için kullanılır.

## 练习

1. **（Easy）**印上小型 ViT 中一次前進パス 印上小型 ViT 中一次前進パス 印上小型 ViT 中一次前進パス 中一次前進パス 中一次前進的每次中部テンザー形──確認:input `(N, 3, 64, 64)`-> yamalar `(N, 16, 192)`-> CLS ile `(N, 17, 192)`-> sınıflandırıcı girişleri `(N, 192)`-> çıkış `(N, num_classes)`- Evet.
2. **（Medium）**Ders 4'te sentetik-CIFAR verilerinde ince ayarlama bir hazırlık yapın.`timm`ViT-S/16── ResNet-18 ince ayarlamaları ile aynı veriler ile karşılaştırma yapılması── rapor eğitim süresi 和 son doğruluk──
3. **（Hard）**Küçük bir ViT için ATA öncesi eğitimi: maske %75'lik yamalar, eğitim kodlayıcı + bir küçük dekodör yeniden yapılmış maske yamalar için ATA öncesi eğitimi

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| Patch embedding | “第一个 conv” | kernel size = stride = patch size 的 conv；将图像转换为 token embeddings 的网格 |
| Class token | “[CLS]” | 加在 token sequence 前面的 learned vector；它的最终 output 是全局图像表示 |
| Positional embedding | “Learned pos” | 添加到每个 token 上的 learned vector，让 transformer 知道每个 patch 来自哪里 |
| Pre-LN | “LayerNorm before sublayer” | 稳定的 transformer 变体：使用 `x + sublayer(LN(x))`，而不是 `LN(x + sublayer(x))` |
| Multi-head attention | “Parallel attention” | 标准 transformer attention，被拆分为 num_heads 个独立子空间，之后再 concatenated |
| ViT-B/16 | “Base, patch 16” | 规范尺寸：dim=768、depth=12、heads=12、patch_size=16、image=224；约 86M params |
| DeiT | “Data-efficient ViT” | 只用 ImageNet-1k 并配合强 augmentation 训练的 ViT；证明大型 pretraining datasets 并非绝对必要 |
| MAE | “Masked autoencoder” | Self-supervised pretraining：mask 75% 的 patches 并重建；主流 ViT pretraining 配方 |

## 延伸阅读

- [An Image is Worth 16x16 Words (Dosovitskiy et al., 2020)](https://arxiv.org/abs/2010.11929) ViT 论文
- [DeiT: Data-efficient Image Transformers (Touvron et al., 2020)](https://arxiv.org/abs/2012.12877) 如何只使用ImageNet-1k 训练ViT
- [Masked Autoencoders are Scalable Vision Learners (He et al., 2022)](https://arxiv.org/abs/2111.06377) MAE 预训练
- [timm documentation](https://huggingface.co/docs/timm) Üretim sırasında kullandığınız her vizyon transformatörüne ilişkin referans dosyası
