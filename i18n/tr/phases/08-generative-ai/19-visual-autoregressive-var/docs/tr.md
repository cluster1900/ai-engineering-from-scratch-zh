# Görsel Autoregressive Modeling (VAR):Bir sonraki ölçekli tahmin

> Değişiklik modeli zamanla 代采样 (代采样) ︎ VAR 代采样 (代采样) ︎, yani önce bir 1x1 Tokeni tahmin, 2x2 tekrar tahmin, sonra 4x4'e kadar, son çözünürlük, her ölçü öncesine göre ölçülür.

**Type:** Build
**Languages:** Python (with PyTorch)
**Prerequisites:** Phase 7 Lesson 03 (Multi-Head Attention), Phase 8 Lesson 06 (DDPM)
**Time:** ~90 minutes

## 问题

Autoregressive 生成之所以主导语言建模,是因为它能预测地扩展:更多计算、更多参数、更低困惑、更好的输出──2024 yılına kadar, görüntü üretimi iki tür AR 尝试:PixelRNN/PixelCNN(逐像素) ve DALL-E 1 / Parti / MuseGAN(在VQ-VAE kodlarında 上逐 Token) ⋅

两者都困难生成顺序问题──像素和代币 排列在2D 网格中,但AR 模型必须使用1D 拉斯特顺序 访问它们──早期角落像素不知道图像最终将变成什么──生成质量的扩展性与文本上的GPT差异,也从未在匹配计算量时达到 Diffusion 模型质量──

VAR önerleme yoluyla nesne üretimi sorunu çözmek için ∼VAR, uzayda bireysel olarak görüntü belirleme değil, sürekli yükselen çözünürlük belirleme ile tüm görüntü belirlemelidir. ∼ Step 1: bir 1x1 belirlemeyi belirlemelidir. ∼Tüm görüntü belirlemeyi belirlemelidir. ∼ Step 2: bir 2x2 belirlemeyi belirlemelidir. ∼ Daha kaba özellikler. ∼ Step 3: bir 4x4 belirlemelidir. ∼ Step K: bir sonucu belirlemelidir. ∼H/8) ∼W/8) ∼ ∼ ∼ ∼ ∼

Her ölçüde tüm önceki ölçülere dikkat eder ve kendi ölçüsüne gider.

## 概念

### VQ-VAE Çok Ölçekli Tokenizer

VAR   ihtiyacı var **multi-scale discrete Tokenizer**❖ X görüntü için, çözünürlüğü yavaş yavaş artan bir dizi oluşturur.

```
x -> encoder -> latent f
f -> tokenize at 1x1: token grid z_1 of shape (1, 1)
f -> tokenize at 2x2: token grid z_2 of shape (2, 2)
...
f -> tokenize at (H/p)x(W/p): token grid z_K of shape (H/p, W/p)
```

Her bir z_k aynı kod defterini kullanır. Tipik olarak 4096-16384 olarak bilinir.

```
f ≈ upsample(embed(z_1), target_size) + ... + upsample(embed(z_K), target_size)
```

Bu bir **residual VQ**变体──尺度 k 捕获尺度 1..k-1 遗漏的内容──decoder 接收所有尺度 嵌入的和并生成图像──

Çok ölçekli VQ Tokenizer sadece bir kez eğitimlidir, sonra tüm üretilen işlerin tamamlanması için bir süredir.

### Sonraki Ölçekli Tahmin

生成模型 bir Transformer'dir, tüm önceki boyutların Token'ini görür ve bir sonraki boyutların Token'ini tahmin eder.

Giriş sırası yapısı:
```
[START, z_1 tokens, z_2 tokens, z_3 tokens, ..., z_K tokens]
```

Yerleşim Eklemesi Aynı zamanda kodlama ölçü indeksi ve ölçü içindeki uzay konumlarıdır.

訓練 Loss: 在每个尺度 k,给定所有之前尺度的代币,预测代币 z_k。对离散 VQ代码使用交叉 Entropy Loss──结构与GPT类似,只是在这里序列变成了尺度结构化的序列──

### Özgür

推理时:
```
generate z_1 = sample from p(z_1)                    # 1 token
generate z_2 = sample from p(z_2 | z_1)              # 4 tokens in parallel
generate z_3 = sample from p(z_3 | z_1, z_2)         # 16 tokens in parallel
...
decode: f = sum of embed-and-upsample scales 1..K
image = VAE_decoder(f)
```

K = 10 个尺度时,生成需要10次 Transformer forward pass──每次通过都并行生成整个尺度,而不是在尺度内逐个代币自归──对于 256x256 图像,这大约是10次通过,而DiT是28-50次──

### Neden Next-Scale  Yeni Token ' i yendi ?

Üç yapısal avantaj:
1. **从粗到细符合自然图像统计规律。**İnsan görsel algısı ve görüntü verileri tümüyle ölçüm ile ilgili düzenlemeler: düşük frekanslı yapı sabit ve tahmin edilebilir; yüksek frekanslı detaylar düşük frekanslı içeriğe koşullanmıştır.
2. **尺度内并行生成。**GPT'den farklı olarak, bir adım bir ölçü oluşturur.
3. **没有生成顺序偏置。**Ölçüm k'in Token'i tüm ölçek k-1'i görebilir;  sol tarafı veya  yukarı'nın yönlendirilmesi yoktur, erken Token'in geç dönemlerde aşağıda kullanılabilir olmadan önce bir sözleşme yapmasını zorlamaz.

### Ölçekleme Kanunu

Tian et al.  kanıtlar VAR on ImageNet'in FID  power-law ölçekleme eğri izler, GPT'nin karmaşıklığı gibi ︎ parametre veya hesaplama miktarı iki katına çıkarır, hata ︎ yarıya çıkarır. Bu, her yapısal deneyime bağlı olmaksızın VAR ölçeğinde  tahminlerin ölçümle hesaplanabileceği bir görüntü üretimi modeli olarak net şekilde ortaya çıkan ilk ︎ dil modelidir.

### Diffusion ile ilişki

VAR ve Diffusion ortak bir veri sıkıştırma hikayesi: ikisi de oluşturma sorunlarını daha kolay bir dizi çocuk soruna ayırır.

- Yayılma: yavaş yavaş gürültüye katılır, adım adım kaldırılır.
- VAR: Aradan artan çözünürlük, öğrenmek için bir sonraki boyut öngörmek.

它们穿过相同问题的不同轴线──两者都产生可处理的条件分布──经验上,VAR 推理更快(pass 更少,尺度内全并行),并且在类条件 ImageNet 上匹配或胜过DiT──文条件 VAR(VARclip、HART) 是一个活跃研究方向──


```figure
gx-var-next-scale
```

## Yapın onu.

- Evet .`code/main.py`İç, sen:
1. 2D Gaussian yüzükleri üzerinde yapım biçimleri**multi-scale VQ Tokenizer**- Evet.
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              **VAR-style Transformer**Sonraki ölçekli tahmin Token.
3. Transformer 4 次(4 个尺度)并解码来采样──
4. 验证按尺度顺序训练会让生成在尺度内并行──

Bu bir oyuncak uygulamasıdır. Önemli olan ölçümün yapılandırılmasını görmek. Dikkat maskası ve ölçüm içinde paralellik yaratmak.

## - Söyle.

本课会生成 `outputs/skill-var-tokenizer-designer.md`, bu çok ölçekli Tokenizer'in tasarımı için kullanılan bir yetenek: ölçüm sayısı, ölçüm oranı, kod defteri boyutu, kalıntı paylaşımı, dekodör mimarisi.

## 练习

1. **尺度数量消融。**4、6、8、10 尺度 eğitimi VAR。 yeniden inşaat kalitesi ile Autoregressive geçiş sayısal ilişki──更多尺度 = 更细残留 = 更好质量,但通过更多──

2. **Codebook size。**訓練代書サイズ 为 512、4096、16384 的 Tokenizer── daha büyük bir kod defteri 带来更好的重建,但预测更难──找到拐点──

3. **尺度内并行检查。**Eğitimli VAR, açık ölçüm Dikkat kalıpı── ölçüm k içinde, model mi Dikkat çapraz ölçek  konum ama değil Dikkat iç ölçek?

4. **VAR vs DiT scaling。**Aynı ImageNet sınıf koşullı  görev için, uyumlu parametre bütçesi altında VAR ve DiT eğitimi yaparak (örneğin 33M、130M、458M) ◊ FID vs. hesaplama çizimleri yaparak ve VAR'ın her boyutta DiT'yi önde tutması gerekir.

5. **Text conditioning。**扩展 VAR,让它通过 adaLN 接收文本嵌入(CLIP pooled)作为额外条件输入──这是HART 配方──它能让文本一致的采样 上的 FID 改善多少?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| VAR | "Visual AutoRegressive" | 通过在 VQ Token 网格金字塔上进行 next-scale prediction 来生成图像 |
| Next-scale prediction | "Predict coarser, then finer" | 模型以不断增加的分辨率尺度预测 Token，并以所有之前尺度为条件 |
| Multi-scale VQ tokenizer | "Residual VQ" | 生成 K 个分辨率递增 Token 网格的 VQ-VAE，decoder 会对所有尺度求和 |
| Scale k | "Pyramid level k" | K 个分辨率层级之一，从 k=1 的 1x1 到 k=K 的 (H/p)x(W/p) |
| Parallel-within-scale | "One forward per scale" | 尺度 k 的所有 Token 在一次 Transformer pass 中预测，而不是自回归预测 |
| Causal-across-scales | "Scale-ordered attention" | 尺度 k 的 Token 可以 Attention 到尺度 1..k 的全部内容，但不能 Attention 到尺度 k+1..K |
| Residual VQ | "Additive tokenization" | 每个尺度的 Token 编码较低尺度留下的 residual；decoder 对所有尺度 Embedding 求和 |
| VAR scaling law | "Image GPT scaling" | FID 随 compute 遵循可预测的 power law，类似语言模型的 perplexity |
| HART | "Hybrid VAR + text" | Text-conditional VAR 变体，将 MaskGIT-style iterative decoding 与 VAR 的尺度结构结合 |
| Scale position embedding | "(scale, row, col) triple" | Positional encoding 同时携带尺度索引和尺度内空间坐标 |

## 延伸阅读
- [Tian et al., 2024 — "Visual Autoregressive Modeling: Scalable Image Generation via Next-Scale Prediction"](https://arxiv.org/abs/2404.02905) VAR 论文,标准参考
- [Peebles and Xie, 2022 — "Scalable Diffusion Models with Transformers"](https://arxiv.org/abs/2212.09748) DiT,Difusion baseline karşı
- [Esser et al., 2021 — "Taming Transformers for High-Resolution Image Synthesis"](https://arxiv.org/abs/2012.09841)VQGAN,VAR'ın çok ölçekli Tokenizer
- [van den Oord et al., 2017 — "Neural Discrete Representation Learning"](https://arxiv.org/abs/1711.00937)VQ-VAE, İskele Görüntü Tokenizasyonunun Temel
- [Tang et al., 2024 — "HART: Efficient Visual Generation with Hybrid Autoregressive Transformer"](https://arxiv.org/abs/2410.10812) metin şartlı VAR
