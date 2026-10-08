# LLaVA-OneVision: Bir modeldeki tek görüntü, birden fazla görüntü ve video

> LLaVA-OneVision'da (L.L.A.V.A. ve diğerleri, 2024 yılının Ağustos ayında) açılan VLM Dünya'nın birbirinden ayrı bir dizi modeli var: tek görüntüde kullanılan LLaVA-1.5, Mantis ve VILA gibi çoklu görüntü modelleri, ayrıca Video-LLaVA ve Video-LLaMA gibi video modelleri. Her biri kendi referansını kazanırken diğer sahnelerde başarısız olur. L.L.A.V.A.V.Pogent, tek bir ders planı, tek bir modelin aynı anda bu üç sahneyi yönlendirebileceğini, ayrıca yeni görev transfer etmesini sağlayabileceğini belirten tek bir ders planı, tek bir resim becerisini videoya, tek bir resim fikrine, tek bir resim fikrine, bir resim fikrine, bir resim fikrine taşıyabilir.

**Type:** Build
**Languages:** Python (stdlib, token budget solver + curriculum planner)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 12 · 06 (any-resolution)
**Time:** ~180 minutes

## Öğrenme hedefi
- Design a in single image、 multiple image and video input arasında sabit bir görüntü belirtiyi tutmak  bütçe
- 排列一训练课程,使技能从单图像迁移到视频,同时避免灾难性忘记──
-  Neden aynı parametre ölçeğinde, eğer kurikulum doğru yapılırsa, tek bir model uzman modelden üstün gelir 
- LLaVA-OneVision  raporının üç yeni yeteneği: çoklu kamera akıl yürütme, işaretleme uyarı, iPhone ekran görüntüsü ajanı,

## 问题
图像、多图像和视频将以不同的方式给模型施压──

单图像需要高分辨率 Token(AnyRes,约2880 视觉代币) OCR 和细节──每个样本的预算:1张图像,2880 视觉代币──

Çoğu görüntü çok fazla orta çözünürlüklü görüntü gerektirir (~ 576 Token), böylece her örnek için bütçe: 4-8 张图像, 576 Token, toplam 2300-4600 Token;;

视频需要许多低分辨率(pooling 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后每约196 代币) 后后每约196 代币) 后后每约196 代币) 后后每约196 代币) 后后后每约196 代币) 后后后每约196 代币) 后后后每约196 代币,后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后

Eğer bir çok bağımsız model eğitirseniz, her model için bir bütçe seçersiniz.

OnVision'a kadar, bir sahneyi eğitmek, diğer sahneyi göz ardı etmek için bir tane daha eğitmek için bir tane daha yapıldı.

## 概念
### OneVision Token 预算

LLaVA-OneVision  seçin bir birleştirilmiş görsel simge  bütçe, her örnek yaklaşık 3000-4000 simge, ve farklı sahneye göre dağıt:

- 单图像:AnyRes-9(3x3 bez + küçük resim), her bez 384, içerir 729 个 yama, 激进的使用 2x2 bilinear pooling → Her bez 182 个标记──总计:9 * 182 + 182 = 1820 个标记──或 AnyRes-4, her bez 729 个标记 = 2916 + 729──
- Çoğu resim: her resim kullanımı ortalama çözünürlük(384, hiç kaplama),729 Token, hiç birleştirme。 bütçe 6 张图像 → 4374 个 Token。
- 视频:32 ,384 分辨率,激进的 3x3 bilinear pool → 每 81 个代币──总计:32 * 81 = 2592 个代币──

Bu dağıtım, toplam token sayısını kalıcı olarak tutmayacaktır. LLM'nin hiçbir zaman bir araya gelme bağlamının bir seri görmeyecektir.

### Üç aşama eğitim programı

LLaVA-OneVision 分三个阶段训练:

1. 单图像 SFT(stade SI) ∼ tüm veriler tek görüntü-daha-metinlerdir。 yüksek çözünürlükte AnyRes 输入训练。
2. OneVision SFT(stage OV) ――混合单图像 + 多图像 + 视频(均采样) ・・・在统一代币 预算上训练。这会教会模型处理异构批形──不重置权重,而是从阶段 SI 继续──
3. Görev transfer(tape TT)。 hedef görev kitlesini kullanmaya devam edin, genellikle ürünlerin ihtiyaçlarına göre ince ayarlama yapılır.

Önemli olan, aynı veriyi kullanmak, önce video veya daha fazla görüntü eğitimi yapmaktır.

### Neden kurikulum etkili?

单图像训练建立感知基础──Patch Token 携带细粒度视觉特征;LLM öğrenciler bunları metinle birleştirir──多图像和视频引入结构性挑战(哪张图像是哪张,什么先发生), eğer güçlü bir感知基础 yoksa, bu zorluklar öğrenmek kolaydır──

Eğer sıfırdan başlayarak tüm olayları bir araya getirirseniz, model uygun olmayan algılamalar elde edersiniz.

Eğitimsel düzen, aşama SI'den algılama gücünü elde etmenizi sağlar, aşama OV'den yeniden bir araya gelme/zaman düşünme yeteneğini elde ederken hiçbir şeyi kaybetmemenizi sağlar.

### 跨场景 gelişen beceriler

LLaVA-OneVision 论文 rapor üç yeni gelişen yetenek:

1. Çoklu kamera akıl yürütme── ayrı ayrı çoklu görüntüler + video üzerinde eğitim; düşünce sırasında, çoklu kamera süren bir sahneyi anlamak zorunda kalmak── eğitimde hiç bu kadar kesin bir biçim görmemiş olmasına rağmen, model hala çoklu bakış açısını doğru bir şekilde birleştirebilir──
2. Seti-of-mark istekleri── kullanıcı ile sayısal işaretler 注释图像中的对象;模型推理mark 3 相对标志 7 在做什么──既没有在标志上训练,也没有在注释上训练;
3. iPhone ekran görüntüsü ajanı, kullanıcılar bir iPhone ekran görüntüsü sağlar, bir sonraki kez tıklama planını gerektirir.

Bunlar eğitim görevleri değil; kurikulumun yapılandırma yapısından ortaya çıkmıştır.

### 视觉 İşaret birleştirme

Token  bütçe birleştirme gerektirir OneVision 2D patch grid 上 binaylı interpolasyon kullanmak:24x24 = 576 个 patch 变成12x12 = 144(2x faktörü) veya 8x8 = 64(3x faktörü) ――Pooling 在 patch-grid 空间中完成,而不是在 Token 空间中完成,以保留局部性──

Her bir sahnenin birleştirme faktörü 選択本身は1 hiperparameterです。更少の集合 = 更多の集合 = 更丰富的表示──更多の集合 = 更少の集合 = 能放入更多/图像──

### LLaVA-OneVision-1.5

2025 yılının sonraki sürümü (((LLaVA-OneVision-1.5, arXiv 2509.23661) eğitim verileri, model ağırlığı ve kodları üzerinde tamamen açık ︎.

### Qwen2.5 VL'ye kıyasla

Qwen2.5-VL(Lection 12.09) farklı bir seçim yaptı. M-RoPE ve dinamik FPS kullanıyor, sabit birleştirme yerine.


```figure
l5-onevision-budget
```

## Kullan
`code/main.py`Bir VLM kurikulum ve bütçe planlayıcısı olarak kullanılır. Her bir örneğin belirlenmiş bir token  bütçesi ve hedef bir sahne kitlesi vardır.

- Her bir olay için çözünürlük, birleştirme faktörü ve çerçeveler dağıtılmaktadır.
- Her olayın paylaşılan bütçeye düşüp düşmediğini kontrol et.
- 報告预期 Token 数量、LLM FLOPs, ve hangi durumlar az tokenize edildi.
- 打印逐阶段训练计划──

OneVision'ın ince ayarlarını planlamak veya VLM'nin her talep maliyetini kontrol etmek için kullanın.

## - Söyle.
本课会产 出 `outputs/skill-onevision-budget-planner.md` Görev dağılımını ve bütçeyi belirleyerek, herhangi bir Res faktörü üretir, çerçeve birleştirme, video sayısı ve kurikulum aşama ağırlıkları.

## 练习
1. Ürünlerin desteği %80 单图像、10% 多图像(2-4 张图像)、10% 视频(8-16 ) ・・・ tasarım token 预算──由于不做重度多图像而省下额外预算,你将放在哪里?

2. LLaVA-OneVision Bölüm 4.3 (Önemli yetenekler)  Önemli bir ders planı önerir, ancak 4. yeni yetenek rapor edilmez.

3. 交换课程 顺序:先训练多图像,再训练单图像,最后训练视频──预测哪些基准会下降,以及原因──

4. 论文报告的视频基准每样只用8 训练――¿Bu, önerme zamanı 30 saniyelik video olarak genişletilmiş olabilir mi?

5. 24x24 patch yapmak bilinear birleştirme 12x12 kadar, her boyutta 4x azaltma olacaktır.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OneVision scenario | “单图像、多图像，或视频” | 统一 VLM 处理的三种输入 shape 之一；预算在三者之间保持恒定 |
| Token budget | “每个样本多少 Token” | LLM 在每个训练/推理样本中看到的视觉 Token 总数，通常为 3000-4000 |
| Curriculum | “训练顺序” | 为了 emergent transfer 而选择的阶段排序（单图像 → 多图像 → 视频） |
| Bilinear pooling | “Token 缩减” | 对 patch grid（2D）应用 bilinear interpolation，以在保留局部性的同时减少 Token 数量 |
| Emergent skill | “没训练过，但仍然能用” | 由于 curriculum composition，在没有匹配训练数据的情况下于推理时出现的能力 |
| AnyRes-k | “k-tile setup” | k 个固定分辨率子 tile 加一个 thumbnail，典型 k ∈ {4, 9} |
| Task transfer | “跨场景泛化” | 在单图像上学到的技能，通过共享 backbone 应用于视频（反之亦然） |

## 延伸阅读
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326)
- [LLaVA-OneVision-1.5: Fully Open Framework (arXiv:2509.23661)](https://arxiv.org/abs/2509.23661)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Lin et al. — VILA (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
