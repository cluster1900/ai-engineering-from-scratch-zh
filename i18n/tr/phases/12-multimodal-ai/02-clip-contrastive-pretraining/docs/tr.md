# CLIP ve Kontrast Görüş Dil Eğitim

> OpenAI'nin CLIP(2021) bir yeterli güç oluşturmak için bir kanıt bir sonraki beş yılın temel fikri: sadece 杂 Web görüntü-caption çiftleri ile bir kontrast kaybı, görüntü kodlayıcı ve metin kodlayıcıyı aynı vektör alanına doğru uzattırmak için.

**Type:** Build
**Languages:** Python（stdlib，InfoNCE + sigmoid loss 实现）
**Prerequisites:** Phase 12 · 01（ViT patches），Phase 7（Transformers）
**Time:** ~180 分钟

## Öğrenme hedefi
- Karşılıklı bilgi 推导 InfoNCE kaybı,并实现一个数值稳定的矢量化版本──
- Sigmoid çiftlik kaybı (SigLIP) 32768+ partiye kadar genişletilebilir ve softmax gereksinimini gerektirmez.
- 通过构造文本模板(`a photo of a {class}`)并对 cosine benzerliği 取 argmax,运行零射 ImageNet sınıflandırması。
- CLIP / SigLIP öncesi eğitimini anlatmak size dört değnek verecektir:

## 问题
CLIP'den önceki vizyon: denetim altında tutulmaktadır. Etiketlenmiş veri kümelerini toplamak, CNN'yi eğitmek ve yayınlamak için; Etiketler pahalı, etiketler etiketlerin etiketleyicilerin uyumlu içeriğe ulaşmasına yönlendirilir ve ince ayarlama olmaksızın, etiketler yeni görevlere taşınamaz.

Fotoğraflar: "Köpeğim Max Parkta" yazısı ile birlikte bir kontrol sinyalini taşıyor.

CLIP'in cevabı: Sehif-sırh çiftlerini birleştirmek. Bu iki şeyin bir arada olmasıdır. Bu iki şeyin bir arada olmasıdır. Bu N-1 sı bir arada değildir.

得到的嵌入空间 能做不止 CLIP 被训练做的事情──ImageNet 能工作,是因为"bir kedinin fotoğrafı" 嵌入会接近那些从未被明显标记为猫的猫图像──这是催生每2026 VLM 的注──

## 概念
### Çift kodlayıcı

İki kule var:

- Resim kodlayıcı`f`:ViT veya ResNet, her 张 resim 输出一个D-dim Vector──
- Metin kodlayıcı`g`: Küçük transformatör, her yazı 输出一个D-dim Vector──

İki kule, çıkışını birim uzunluğuna normalleştirdi.`cos(f(x), g(y)) = f(x)^T g(y)`- Evet.

对于一个包含N 个(图片,标题) 双的批,构建形 为 `(N, N)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `S`- ...

```
S[i, j] = cos(f(x_i), g(y_j)) / tau
```

İçlerinden `tau`Clip başlangıç 0.07; log-space 中学习)

### InfoNCE Kayıpları

CLIP &amp; apos; de satırlarda &amp; apos; üst sütunlarda simetrik çapraz entropi kullanılır:

```
loss_i2t = CE(S, labels=identity)     # each image's positive is its own caption
loss_t2i = CE(S^T, labels=identity)   # each caption's positive is its own image
loss = (loss_i2t + loss_t2i) / 2
```

İşte InfoNCE──CE içindeki softmax 强制每张图像与其标题的匹配程度高于批中所有其他标题──"negatif"──其他批物──更大的批物 = 更多负面 = 更强信号──CLIP 在批 32k 上训练;规模 很重要──

### Temperatür

`tau`控制 softmax 的尖度──低 tau → 尖分布,具有硬负矿业效果──高 tau → 软,所有样品都会贡献──CLIP 学习 log(1/tau),并进行剪断以防崩──SigLIP 2 固定初始 tau,并改用学习偏见──

### Neden sigmoid 扩展性更好(SigLIP)

Softmax  tüm benzerlik gerektirir Matrix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

SigLIP UZ element-wise sigmoid 替代软max:对对对 `(i, j)`, kaybı ikili bir sınıflandırma, karar  bu eşleşen çift değil mi?  pozitif sınıf etiketleri diyagonal, diğer tüm negatiflerdir.

```
L = -1/N sum over (i, j) [ y_ij log sigmoid(S[i,j]) + (1-y_ij) log sigmoid(-S[i,j]) ]
```

Eğer `i == j`,则 `y_ij = 1`, yoksa 0 için. Her çiftin kaybı bağımsızdır. Tümünü toplamak gerekecek değildir.

### sıfır atış sınıflandırması

给定 N 个 sınıf isimleri, için her sınıf 构建一个文本模板:

```
"a photo of a {class}"
```

Metin kodlayıcı Ekleme Her şablonı. Ekleme resim kodlayıcı. Ekleme resim. Argmax kozin benzerliği = öngörülen sınıf.

Çabuk şablonlar  çok önemlidir。CLIP 原论文为每个类使用了80个模板(seder, sanatsal, fotoğraf, resim vb)并平均嵌入式。ImageNet 提升 +3点──现代用法通常选择一两个模板──

### Düzsel araştırma ve ince ayarlama

ZERO-shot is baseline──Linear probe( on frozen CLIP features 之上为目标 classes 训练一个线性层) on-domain tasks 上胜过零-shot──Full fine tuning 在在domain 上胜过线性探针,但可能损害零-shot transfer──三种政体,三种交易──

### SigLIP 2: NaFlex 和 yoğun özellikler

SigLIP 2(2025)加入:
- NaFlex:单个模型 处理变量 aspect ratios 和 resolutions──
- Daha iyi yoğun özellikler, segmentasyon ve derinlik tahminleri için kullanılır, hedef VLM'ler arasında donmuş omurgan olarak kullanılır.
- Çok dilli: 100+ dilde 上訓練, CLIP ise sadece İngilizce olarak kullanılır.
- 1B param ölçeği, ve CLIP en yüksek 400M'ye kadar.

2026 yılında açık VLM'ler arasında, SigLIP 2 SO400m/14 öntanımlı görme kulesi.

### ALIGN, BASIC, OpenCLIP, EVA-CLIP

ALIGN(Google,2021): CLIP ile aynı fikir, 1.8B çift ölçek,% 90 gürültülü.

### - Çatı sıfır çekim

CLIP sınıfı modellerinin ImageNet sıfır çekim yukarı sınır yaklaşık %76'dır.


```figure
multimodal-fusion
```

## Kullan
`code/main.py`实现了:

1. Bir oyuncak çift kodlayıcı ((hash tabanlı görüntü özellikleri, metin grafik özellikleri),让你无需 numpy 就能看到 InfoNCE 的形状──
2. 純 Python'un InfoNCE kaybı(log-sum-exp yoluyla sayısal istikrarı garantile)
3. Karşılaştırma sigmoid çiftlik kaybı için kullanılır.
4. Bir sıfır çekim sınıflandırma rutin: hesaplama bir grup metin sorgularıyla birlikte, argmax kullanarak tahmin yaptırmak için

运行它并观察损失曲线──绝对数值是玩具;形状与真实CLIP trainer 输出一致──

## - Söyle.
本课生成 `outputs/skill-clip-zero-shot.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                              `openai/clip-vit-large-patch14`)Embedding 两侧,并返带相似性分的前-1 /前-5 tahminleri。该技能 拒绝对提示列表 中不存在的类做出判断。

## 练习
1. Hand动为一个包含4 个对的批次 实现 InfoNCE──构建4x4 benzerlik Matrix,运行软max,取出横向,计算交叉 Entropy──使用这个手算结果验证你的Python实现──

2. Sıcaklık dışında SigLIP de kısıtlama parametresi kullanıyor.`b`- ...`S'[i,j] = S[i,j]/tau + b`◊ her partide  büyük sınıf dengesizliği                                                                                                                                                                                                                                                         `b`起什么作用? 阅读 SigLIP Bölümü 3  arXiv:2303.15343)

3. Kedi vs köpek için sıfır atış sınıflandırıcı oluşturun.`a photo of a {class}`和 `a picture of a {class}`◊ 100 张 test görüntülerinde ölçüm doğruluğu── Şablonların ansamblosu tek şablondan daha iyi mi?

4. 計算 512-GPU、batch 32k 运行时,softmax InfoNCE ile sigmoid çift olarak iletişim maliyeti──哪个按 O(N) ölçek,哪个按 O(N^2) ölçek?引用 SigLIP Bölüm 4──

5. 阅读OpenCLIP ölçekleme- yasaları kağıdı(arXiv:2212.07143,Cherti et al.)。 Grafu Reviews of Data Scaling:

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| InfoNCE | "Contrastive loss" | 对一个 batch 的 similarity Matrix 做 cross-entropy；每个 item 的 positive 是它配对的 item，negatives 是其他所有项 |
| Sigmoid loss | "SigLIP loss" | Per-pair binary cross-entropy；没有 softmax，没有 all-gather，在 distributed training 中低成本 scale |
| Temperature | "tau" | 在 softmax/sigmoid 之前缩放 logits 的 scalar；控制 distribution 的 sharpness |
| Zero-shot | "no-finetune classification" | 使用 text prompts 构建 class Embeddings，并通过 cosine similarity 分类；不在目标 classes 上训练 |
| Prompt template | "a photo of a ..." | 围绕 class name 的文本脚手架；会影响 zero-shot accuracy 1-5 points |
| Dual encoder | "Two-tower" | 一个 image encoder + 一个 text encoder，输出到共享 D-dim space |
| Hard negative | "Tough distractor" | 与 positive 足够相似的 negative，迫使 model 努力将它们分开 |
| Linear probe | "Frozen + one layer" | 只在 frozen features 之上训练一个 linear classifier；衡量 feature quality |
| NaFlex | "Native flexible resolution" | SigLIP 2 的能力：无需 resize 即可摄入任意 aspect ratio 和 resolution 的 images |
| Temperature scaling | "log-parametrized tau" | CLIP 将 `log(1/tau)` 参数化，使 gradients 表现良好；通过 clipping 防止 collapse 到接近零的 tau |

## 延伸阅读
- [Radford et al. — Learning Transferable Visual Models From Natural Language Supervision (arXiv:2103.00020)](https://arxiv.org/abs/2103.00020) CLIP kağıdı
- [Zhai et al. — Sigmoid Loss for Language Image Pre-Training (arXiv:2303.15343)](https://arxiv.org/abs/2303.15343)Siglip.
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) çok dilli + NaFlex。
- [Jia et al. — ALIGN (arXiv:2102.05918)](https://arxiv.org/abs/2102.05918)                                                                                                                                                                                                                                                              
- [Cherti et al. — Reproducible scaling laws for contrastive language-image learning (arXiv:2212.07143)](https://arxiv.org/abs/2212.07143) OpenCLIP ölçekleme yasaları。
