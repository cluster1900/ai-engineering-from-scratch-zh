# Görüş Transformers &amp; Patch-Token 原语

> Herhangi bir çok model işleminden önce, resim tümü transformatör dönüştürülmelidir İşlemlenebilir Token 序列.2020 yılında ViT 论文 16x16 像素补丁、线性投影和位置 Embedding kullanılarak bu soruyu cevapladı.

**Type:** Learn
**Languages:** Python (stdlib, patch tokenizer + geometry calculator)
**Prerequisites:** Phase 7 (Transformers), Phase 4 (Computer Vision)
**Time:** ~120 分钟

## Öğrenme hedefi
- HxWx3 ı resimler için değiştirmek için doğru konum kodlaması ile bir patch Token 序列
- Verilen ViT(batç boyutu, çözünürlük, gizli kalınlık, derinlik) hesaplama dizinin uzunluğu, parametrelerin sayısı, FLOP'lar
- ViT'yi 2020 yılından 2026 yılına kadar geliştirmek için yapılan araştırma sonuçları: kendi kendine denetlenen ön eğitim, DINO/MAE kayıt simgeler ve yerel çözünürlüklü paketleme.
- Çıktı. Çıktı. Çıktı. Çıktı. Çıktı.

## 问题
Transformer  işlemci vektör 序列。文本本本就是序列──bytes 或 tokens──图像是带有三个颜色通道的2D 像素网格,不是序列── eğer gösterge平每一个像素,一张 224x224 RGB 图像将变成150,528 符号,而这个长度上的自我关注 完全不可行──对序列长度是二次复杂性──

2020 yılından önce bir CNN özellik çıkarıcısı ile bir önceki bağlantıda bir yöntem olacak: ResNet  2048-dim Vector ından oluşan bir 7x7 özellik haritasını üretir, bu 49 Token 输入 Transformer ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ 

Dosovitskiy et al. (2020)  doğrudan bir soru ortaya koydu: Eğer CNN'den atlasa nasıl olur? resmini sabit büyüklükteki bir yama olarak ayırırız? (örneğin 16x16 像素) her yama 線性投影をベクトルに変換します.

2026 yılına kadar, ViT orijinal dili zaten tartışmasız bir temel olmuştur. Her açık ağırlıklı VLM vizyon kulesinin bir sonraki nesli vardır.

## 概念
### Token olarak yamalar

给定一个形状为 `(H, W, 3)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `x`和 yama boyutu `P`Resimi bir taneye keseceksin.`(H/P) x (W/P)`网格──每一个补丁都一个 `P x P x 3`Bu, her bir çubuğu bir çubuğa dönüştürür.`3 P^2`vektör.`(3 P^2, D)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `W_E`Her yama modelin gizli boyutlarına yerleştir .`D`- Evet.

ViT-B/16 için klasik yapılandırma:
- Çözüm 224, patch boyutu 16 → grid 14x14 → 196 个 patch tokens──
- Her yama `16 x 16 x 3 = 768`个像素值,投影到 `D = 768`- Evet.
- 加入一个可学习的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `[CLS]`Token → sekans uzunluğu 197。

Patch projesi matematiğe göre çekirdek boyutuna eşit olarak`P`İşe yarayacak.`P`、 Dışarı çıkış yol sayısı için `D`2D dönüşümü.`nn.Conv2d(3, D, kernel_size=P, stride=P)`Linear proje                                                                                                                                                                                                                                                            

### Konum yerleşimleri

Patch 没有内在顺序  Transformer 看到的是一个集合──早期 ViT 加入可学习的 1D 位置 Embedding((每个位置一个768-dim Vector,总共 197 个) ──

Modern Vision Backbone 2D-RoPE (Qwen2-VL'nin M-RoPE、SigLIP 2'nin varsayılan programı) veya faktörleştirilmiş 2D pozisyonları。2D-RoPE 会根据补丁的(列, sütun) 索引旋转查询 和键向,因此模型可以从旋转角度推断对2D位置──不需要位置表──模型在推理时可以处理任意的格格尺寸──

### CLS Token、birleştirilmiş çıkış 和 kayıt tokenleri

图像级表示是什么? 三种选择并存:

1. `[CLS]`token──把一个可学习向量 前置到补丁序列──经过所有变压器块──后,CLS token'ın gizli durumu 就是图像表示──继承自BERT──原始 ViT、CLIP 使用这种方式──
2. Ortalama havuz── patch tokenlerinin çıkışı gizli durumlar 取平均──SigLIP、DINOv2 和大多数现代VLM使用这种方式──
3. Register tokenleri。Darcet et al. (2023)  observe, no apparent sink token 训练的ViT 会产生高范数的artifact patches,并劫持自我注意──加入 416 个可学习登录 token 可以吸收这个部分负载,并提升密集预测质量(细分化、深度)──DINOv2 和 SigLIP 2 都随模型提供登录──

Bu seçim aşağıdaki görevleri etkiler. CLS  sınıflandırmaya uygun. LLM'nin VLM'sına girdiğiniz zaman, her bir parşın bir LLM'ye girdiği bir parşın içine dönüşmesi gerekir.

### 预训练:监督式、对比式、masked、自蒸

2020 yılının ViT kullan JFT-300M 上 上 上                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

- CLIP (2021): 400M'de resim verilerine karşı karşıt bir görüntü-metin yapın.
- MAE (2021, He et al.):% 75'lik yama maskesi, yeniden inşa edilmesi, kendiliğinden denetim edilmesi, saf görüntüler için uygulanması
- DINO (2021) / DINOv2 (2023): Öğrenci-öğretmen kullanımı yapın kendi kendini distillatör, etiketsiz、 başlıksız。2023 yılının DINOv2 ViT-g/14 en güçlü saf görüntü omurgasıdır, ayrıca  yoğun özellikler                                                                                                                                                                                                                             
- SigLIP / SigLIP 2 (2023, 2025):带 sigmoid loss 和 NaFlex 原生宽高比支持的 CLIP──2026 yıl açık VLMs(Qwen、Idefics2、LLaVA-OneVision) 中的主流视觉塔──

Çekilme: CLIP/SigLIP  Çekilme: CLIP/SigLIP  Çekilme: CLIP/SigLIP  Çekilme: CLIP/SigLIP  Çekilme: CLIP/SigLIP  Çekilme: CLIP/SigLIP  Çekilme: CLIP/SigLIP  Çekilme: CLIP/SigLIP  Çekilme: CLIP/SigLIP/SigLIP  Çekilme: CLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/SigLIP/siglIP/siglIP/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl/sigl

### Ölçekleme yasaları

ViT ölçeklendirme ((Zhai et al. 2022) gösterir, ViT'in kalitesi model boyutunda, veri boyutu ve hesaplama üzerinde belirlenebilir öngörüleme kurallarına uymaktadır.
- Daha büyük model + daha fazla veri → Daha iyi kalite..
- Patch boyutu, dizinin uzunluğu ile sadakat arasındaki düzen 杆──Patch 14 ((DINOv2/SigLIP SO400m tipi yapılandırması) karşılaştırıldığında 16 (per image) için daha fazla token üretmek için yapılacak.
- Kararlılık başka bir büyük değerdir. 224'ten 384'e kadar ve 512'e kadar.

ViT-g/14(1B paramları、patch 14、resolüsyona 224 → 256 token) ve SigLIP SO400m/14(400M paramları、patch 14) 2026 yılının açık VLM'lerinin iki ana güç kodlayıcılarıdır。

### Bir ViT için parametre sayısı

完整计算位于 `code/main.py`❖ 224 Aşağıdaki ViT-B/16 için:

```
patch_embed = 3 * 16 * 16 * 768 + 768  =  591k
cls + pos    = 768 + 197 * 768          =  152k
block        = 4 * 768^2 (QKVO) + 2 * 4 * 768^2 (MLP) + 2 * 2*768 (LN)
             = 12 * 768^2 + 3k          =  7.1M
12 blocks    = 85M
final LN    = 1.5k
total       ≈ 86M
```

Kontrol noktasının yüklenmesi öncesinde, önce bu şekilde her bir VT için kaba bir tahmin yapın.

### 2026 üretim düzenlemesi

2026 yılında çoğu açık VLM'de 随模型 tarafından sağlanan kodlayıcı ise nati生 çözünürlüğü ((NaFlex) altında SigLIP 2 SO400m/14。
- 400M parametreleri.
- Patch boyutu 14,默认解析度 384 → 每张图像 729 个 patch tokens──
- 图像级任务使用平均池;VQA içindeki tüm 729 补丁都流入LLM。
- 4 kayıt simgesi, LLM teslimatında
- 2D-RoPE kullanılarak, ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇

Bu konumda her karar, okuyabileceğiniz bir makaleye dayanır.


```figure
image-patch-tokens
```

## Kullan
`code/main.py`Bu bir patch tokenizer 和 geometri hesap makinesi.

- 后的格格形和序列长度──
- Bir sintet 8x8 像素 oyuncak görüntüsü 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序列 序 序列 序列 序列 序 序 序 序 序 序 序 序 序 序 序 序 序 序 序 序    序 序  序      序 序     序                      序                                                                                                             
- Patch                                                                                                                                                                                                                                                              
- 目標 çözünürlüğü 下单次前進通過の FLOPs──
- ViT-B/16 @ 224、ViT-L/14 @ 336、DINOv2 ViT-g/14 @ 224、SigLIP SO400m/14 @ 384

运行它──把参数 counts 和已发布数字对齐──调整补丁尺寸 和解析度,感受 Token 数量成本──

## - Söyle.
本课会生成 `outputs/skill-patch-geometry-reader.md` Verilmiş bir ViT yapılandırması ((patch büyüklüğü, çözünürlük, gizli derinlik, derinlik), bunun nedenlerle açıklama oluşturduğu belirti sayısı, parametreler sayısı ve VRAM tahminleri vardır.

## 练习
1. 計算 Qwen2.5 VL 在原生 1280x720 输入、补丁尺寸 14 下的补丁-token 序列长度──它与只使用 CLS 的表示相比如何?

2. Bir 1080p çerçeve ((1920x1080) Patch 14'de Aşağıda kaç tane Token üretilir? 30 FPS 、5 dakika video video ٬ toplam görsel token sayısı kaç tane? hangi maliyet azaltması en etkili: birleştirme 、 çerçeve örnekleme, ya da token birleşimi?

3. Temiz Python kullanılarak patch tokens gerçekleştirmek için                                                                                                                                                                                                                                                         `forward`返回的结果一致──

4. 阅读 "Vision Transformers Need Registers" (ArXiv:2309.16588) bölümünün 3. bölümünde, 吸收的艺术品是什么以及它为什么影响下游密集预测──

5. 修改 `code/main.py`以支持 patch-n'-pack:给定一组不同分辨率的图像,生成一个包装的序列和块-diagonal attention mask──到课 12.06 时再进行验证──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Patch | “16x16 像素方块” | 输入图像中固定大小、非重叠的区域；会变成一个 Token |
| Patch embedding | “Linear projection” | 一个共享的学习 Matrix（或 stride=P 的 Conv2d），将展平后的 patch 像素映射到 D-dim Vector |
| CLS token | “Class token” | 前置的可学习 Vector，其最终 hidden state 表示整张图像；在 2026 年是可选项 |
| Register token | “Sink token” | 额外的可学习 Token，用于吸收 ViT 在 pretraining 期间产生的高范数 Attention artifacts |
| Position embedding | “Positional info” | 每个位置的 Vector 或旋转，使序列具备顺序感知；2D-RoPE 是现代默认方案 |
| Grid | “Patch grid” | 对于给定 resolution 和 patch size，patch 形成的 (H/P) x (W/P) 2D 数组 |
| NaFlex | “Native flexible resolution” | SigLIP 2 特性：单个模型无需重新训练即可服务多种 aspect ratios 和 resolutions |
| Backbone | “Vision tower” | 预训练 image encoder，其 patch-token 输出会在 VLM 中输入 LLM |
| Pooling | “Image-level summary” | 将 patch tokens 转换为一个 Vector 的策略：CLS、mean、attention pool 或 register-based |
| Patch 14 vs 16 | “Finer vs coarser grid” | Patch 14 每张图像产生更多 Token，对 OCR 有更好 fidelity，但更慢；patch 16 是经典默认值 |

## 延伸阅读
- [Dosovitskiy et al. — An Image is Worth 16x16 Words (arXiv:2010.11929)](https://arxiv.org/abs/2010.11929) 原始 ViT。
- [He et al. — Masked Autoencoders Are Scalable Vision Learners (arXiv:2111.06377)](https://arxiv.org/abs/2111.06377) MAE, kendi kendine denetim altında eğitim öncesi eğitim
- [Oquab et al. — DINOv2 (arXiv:2304.07193)](https://arxiv.org/abs/2304.07193) Büyük çapta kendi kendine destillatı, etiketsiz。
- [Darcet et al. — Vision Transformers Need Registers (arXiv:2309.16588)](https://arxiv.org/abs/2309.16588) kayıt simgeler 和 eser 分析。
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)2026 yılında, görme kulesi.
- [Zhai et al. — Scaling Vision Transformers (arXiv:2106.04560)](https://arxiv.org/abs/2106.04560) 经验性 ölçekleme yasaları。
