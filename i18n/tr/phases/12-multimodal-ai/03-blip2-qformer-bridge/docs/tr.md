# CLIP'den BLIP-2'e kadar  Q-Former  Modality Bridge olarak

> CLIP, resim ve metin için, ama başlık oluşturamıyor, soru yanıt veya sohbet yaptırıyor. BLIP-2 (Salesforce, 2023) bu sorunu küçük bir eğitimli köprü ile çözdü. 32 个学习可用桥接用解决了这个问题:32 个学习可用桥接用解决了这个问题.

**Type:** Build
**Languages:** Python (stdlib, cross-attention + learnable-query demo)
**前置要求:**12 · 02 aşaması (CLIP), 7 aşaması (Transformatörler)
**Time:** ~180 minutes

## Öğrenme hedefi
-                                                                                                                                                                                                                                                               
- 实现一个跨重视区块,其中一组固定的学习性查询 关注外部图像特征──
- 走读 BLIP-2 的两阶段预训:representation (ITC + ITM + ITG), sonra generative (doğan dekoder kullanmak) ⋅
- Q-Former ile LLaVA'da kullanılan daha basit MLP projeksiyonu  karşılaştırın,并论证各自何时更占优──

## 问题
Bir dondurulmuş ViT'de, her görüntü için 256 ′′ dim 1408′′ patch Token üretilir. Bir dondurulmuş 7B LLM'de, 4096′′ Token Embedding'i bekler. Görünen o ki, 1408'den 4096′a kadar olan doğrusal katman  çalışabilir, ancak tüm 256 ′′ patch Token'i LLM bağlamına sokarken, her görüntü için 256 ′′ patch ekstra tüketimini sağlayacaktır.

BLIP-2 sorusu şu: 256-Token resim temsilini daha az bir Token olarak sıkıştırmak mümkün mü? (örneğin 32), aynı zamanda yeterli bilgiyi korumak, LLM'nin resim oluşturma başlığı için soruları cevaplayabilmesini ve düşüncelerini yürütmesini sağlamak için yeterli bilgiyi korumak? ve buzlanmış omurganlara dokunmadan bu köprüyi eğitmek mümkün mü?

答案是:Q-Former──32 个可学习的"query" Vector,对 ViT'in patch Token做做交叉出席,生成一个 32-Token的视觉摘要为LLM使用──总计188M 参数──在接触 LLM 之前,先使用对比性、匹配和生成性目标 训练──

## 概念
### Öğrenilme Sorular

Q-Former'in temel teknikleri: LLM'nin metin simgesi değil, yeni 32 öğrenilebilir sorgu vektörü oluşturmak.`Q`,并让*它们*关注图像补丁. Bunlar, eğitim sırasında öğrenilen model parametreleridir ve aynı grupta 32 soru oluşturulur.

                                                                                                                                                                                                                                                              

### Mimarlık

Q-Former bir küçük transformatördür.

1. Sorgu yolu:32 个 sorgu vektörü 流经自我注意(彼此之间), sonra dondurulmuş ViT'in yama Token yaparak çapraz dikkat,最后经过FFN──
2. Metin yolu: BERT'e benzer bir metin kodlayıcısı ile sorgu yolu 共享自我注意 和 FFN ağırlıklar。 metin yolu 禁用横断注意。

訓練時二条路都会运行──查詢 和文本通過共享自我注意 交互, bu da,文本的任务需要的任务中 (ITM、ITG) anlamına gelir.

### İki aşamalı eğitim

BLIP-2 分两阶段预训练:

1. aşama: temsilcilik öğrenimi ((无 LLM)。三种损失:
- ITC (image-text contrast):CLIP tarzı kontrast,作用于 pooled query Token 和 text CLS Token。
- ITM (resim-metin eşleşimi):biner sınıflandırıcı  这对图像-text 是否匹配?使用硬负面挖矿──
- ITG (resim tabanlı metin üretimi): metinde nedençi LM başlığı, sorguları 为条件――迫使查询 编码可由文本生成的内容――

Sadece eğitim Q-Former。ViT dondurulmuş。 LLM yok  katılmak。

2. aşama: Geliştirici öğrenim.  Dondurulmuş bir LLM'ye girmek. • OPT-2.7B veya Flan-T5-XL ve diğerleri. • Küçük bir doğrusal katman üzerinden 32 sorguya cevap verecek. • LLM'nin yerleştirme boyutuna doğru proje çıkaracak. • Onları önüne koyup metin üzerine koyulacak. • Sadece bir yazma sonrası + resim + başlık 序列indeki LM kaybı  LM kaybı  Q-Former 

2. aşama 之后,Q-Former + projection 就是完整的视觉适配器──Inference 时:image → ViT → Q-Former → linear project → 前置到文 → frozen LLM 发出输出──

### Parametre ekonomisi

BLIP-2 使用 ViT-g/14(1.1B, dondurulmuş) + OPT-6.7B(6.7B, dondurulmuş) + Q-Former(188M, eğitilmiş) = 总计 8B, eğitimi 188M。Q-Former 本身約为完整堆積的参数 2.4%──訓練成本也体现这一点:少量 A100 上训练数天,而不是终端训练数周──

质量:BLIP-2 在零射VQA 上达到或超过 Flamingo-80B,同时体量小 50倍──这个桥接有效──

### Yönlendirme BLIP ile yönlendirme 感知型 Q-Former

InstructBLIP (2023) bir ekstra输入 ile genişletti Q-Former:instruction text 本身──在交叉注意时,查询现在可以访问图像补丁和指示──查询可以根据指示 专门化(" arabaları sayacağım"、"ruhiyyemi açıklayacağım"),而不是学习单个固定摘要──在举办的任务上基准 提升──

### MiniGPT-4 sadece projeksiyonla yaklaşım

MiniGPT-4 Q-Former'i koruyor, ancak sadece doğrusal projeksiyon üretmeyi eğitmektedir, aynı zamanda diğer tüm bölümleri de bitirir.

### Neden LLaVA daha basit oldu ?

LLaVA(2023, Ders 12.05) sıradan 2 katlı MLP ile değiştirildi Q-Former, her ViT patch Token'i LLM 空间  için 24x24 网格, her张图像 576 个 Token için, LLM'ye tüm ücreti ile aktarılmasını sağlar.

2026 yılına kadar, alanlar açığa çıkıyor: Q-Former Token bütçesinde  önemli olaylarda saklanıyor; MLP projektoru her Token'in orijinal kalitesi öncelikli olaylarda baskınlık yapıyor.

### Çaplak dikkat: Flamingo, bu ata

Flamingo(Lection 12.04) BLIP-2'den önce aynı çapraz dikkatini kullanmıştı, ancak tek bir köprü olarak değil, her dondurulmuş LLM katmanında gerçekleşir. BLIP-2'nin gösterdiği gibi sadece giriş katmanına kadar sıkıştırılabilirsiniz, hala geçerlidir.

### 2026'daki soylular

- S-Eski:BLIP-2、InstructBLIP、MiniGPT-4, ve çoğu Token bütçesi 原因のビデオ言語模型──
- Farkçı resampler:Flamingo'nun变体(Düşünme 12.04);Idefics ailesi、Eagle、OmniMAE。
- MLP projekörü:LLaVA、LLaVA-NeXT、LLaVA-OneVision、Cambrian-1。
- Dikkat Havuzu:VILA、PaliGemma。

Çıktı geçerli. Kararlılık sorusu, Token bütçesine sınırlı mı, yoksa Token başına kaliteye mı sınırlı mı?


```figure
modality-projection
```

## Kullan
`code/main.py`Bir stdlib Q-Former tarzı çapraz ilgi oluşturun:

1. 256 个 görüntü yama Token ((dim 128)。
2. 实例化 32 个学习性查询 (Öğrenilme imkanı)
3. 运行 ölçekli nokta- ürün çaplı dikkat ((Q sorulardan, K/V yamalardan)
4. 透過線性層 投影到 LLM-dim ((512)
5. 32 tane LLM hazır görsel Token çıkartmak.

Tüm matematikler saf Python ile yapılır. Vector ile yapılır.

## - Söyle.
本课生成 `outputs/skill-modality-bridge-picker.md` VLM 配置 (Vision Encoder Token 数、LLM bağlam bütçesi、部署约束、质量目標) bir hedef belirler, Q-Former vs MLP vs Perceiver resampler önerir, kısa bir neden ve her köprü için parametre değerlendirmesini verir.

## 练习
1. PyTorch kullanılarak  实现 cross-attention block──验证在 32 个查询 和 256 个键/值 下,attention-weight Matrix is 32 x 256,并且软max 后每一行求和为 1──

2. BLIP-2 aşamasında 1., Q-Former 同时运行三种损失:ITC、ITM、ITG──pseudo-kod kullanarak her türlü ileri imza yazıyor── hangi tür metin kodlayıcı yolu aktif durumda?

3. तुलना:Q-Former'ın fiyatı: 12 katlı, 768 gizli) vs 2 katlı MLP projekörü: 1408 → 4096, iki katlı)

4. 阅读 BLIP-2 paper(arXiv:2301.12597) Bölüm 3.2, Q-Former'ın nasıl başlatıldığını öğrenmek, BERT tabanından neden başlatıldığını açıklamak, herhangi bir şekilde değil, hızlandırılmasını sağlamak.

5. Bir 10 dakika video için, 1 FPS 采样到 60 ,计算每 Token 成本:(Q-Former → 32 token/frame) vs (MLP projekörü → 576 token/frame) ―― hangi bir tane 128k-Token LLM bağlam penceresine koyabilir?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Q-Former | "Querying transformer" | 带有 32 个可学习 query Vector 的小型 transformer，对 frozen ViT features 做 cross-attend |
| Learnable queries | "Soft prompt for vision" | 一组固定参数，作为 cross-attention 的 query 侧；按模型学习，在所有输入之间共享 |
| Cross-attention | "Q from here, K/V from there" | query、key、value 来自不同来源的 Attention；queries 从 ViT patches 拉取信息的方式 |
| ITC | "Image-text contrastive" | 应用于 Q-Former pooled queries vs text CLS 的 CLIP-style loss |
| ITM | "Image-text matching" | 在 hard-negative-mined pairs 上的 binary classifier；迫使 queries 区分细粒度不匹配 |
| ITG | "Image-grounded text generation" | 文本以 queries 为条件生成时的 causal LM loss；迫使 queries 编码 text-decodable content |
| Two-stage pretraining | "Representation then generative" | Stage 1 单独训练 Q-Former（ITC/ITM/ITG）；Stage 2 接入 frozen LLM，并且只训练 projection + Q-Former |
| Frozen backbone | "Do not finetune" | vision encoder 和 LLM weights 固定；只训练 bridge |
| Projection head | "Linear to LLM dim" | 将 Q-Former 输出映射到 LLM Embedding dimension 的最终 linear layer |
| Perceiver resampler | "Flamingo's version" | 类似的 learnable-query cross-attention，由 Flamingo 在每一层使用，而不是作为单个 bridge |

## 延伸阅读
- [Li et al. — BLIP-2 (arXiv:2301.12597)](https://arxiv.org/abs/2301.12597) 核心 paper。
- [Li et al. — BLIP (arXiv:2201.12086)](https://arxiv.org/abs/2201.12086) 使用 ITC/ITM/ITG 三件套的前身──
- [Li et al. — ALBEF (arXiv:2107.07651)](https://arxiv.org/abs/2107.07651) "Fusadan önce uyum"  1. aşama eğitiminin kavramı
- [Dai et al. — InstructBLIP (arXiv:2305.06500)](https://arxiv.org/abs/2305.06500) talimatlı Q-Former。
- [Zhu et al. — MiniGPT-4 (arXiv:2304.10592)](https://arxiv.org/abs/2304.10592)                                                                                                                                                                                                                                                              
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) öğrenilme-soru sorusu çapraz dikkatin genel yapı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
