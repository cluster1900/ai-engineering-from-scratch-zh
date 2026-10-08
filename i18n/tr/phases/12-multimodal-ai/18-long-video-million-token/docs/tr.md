# Milyon Konuşulan Kontext 下的长视频理解

> Bir 1 saatlik 4K video, 24 FPS, patching ve embedden sonra yaklaşık 6 milyon Token üretilir. Bir transkriptin ardından 2 saatlik podcast tekesi 30.000 Token üretilir. Bir uzun Blu-ray filmi, yoğun bir birleşim ısıtıcı kullanılarak bile yüz binlerce Token üretir. Google Gemini 1.5 (Mart 2024) 1000 milyon Token bağlamında bu zaman başlatıldı.

**Type:** Build
**Languages:** Python (stdlib, needle-in-haystack simulator + agentic-retrieval router)
**Prerequisites:** Phase 12 · 17 (video temporal tokens)
**Time:** ~180 minutes

## Öğrenme hedefi
- 計算不同 FPS 和聚合下长视频的总视觉标记 数量──
- 解释三条扩展路径:brute context(Gemini 1.5) 、ring attention(LWM) 、token compression(LongVILA / Video-XL) 。
- Doğruluk oranı ve gecikme oranı, çürük bağlam video VLM'leri ve ajantik geri alım video VLM'leri ile karşılaştırın.
- 30 dakika video tasarım bir iğne-bir-hay asası 测试,并测量特定分钟处的召回率──

## 问题
Qwen2.5-VL  ölçümlü bir patch, 384 orijinal yaşam çözünürlüğünde, tek  yaklaşık 729  Token ∞ kullanmak 3x3 birleştirme ∞, her  81  Token ∞, bir 30 dakika bölümü 1 FPS  hesap = 1800  = 145,800  Token ∞ 2025 yılına kadar açık VLM'ler yapabilir, ancak çok yakından ∞, 2 FPS  hesapta, ise 291,600  Token, sadece en büyük bağlamlı model yüklenebilir ∞

Bir bölüm 2 saat film 1 FPS ile 583k Token.

Çıkışlar:

## 概念
### Yolu 1: kaba bağlam ((Gemini 1.5, Claude Opus)

Çözüm için kullanılan bir cihaz.

Gemini 1.5 Pro  yayınlama sırasında destek 1M Token; Gemini 1.5 Ultra  10M ulaştı; 2026 yılının Gemini 2.5 Pro 能可靠处理数小时视频──论文(arXiv:2403.05530) en yüksek 9.5M Token altında, iğne-a-haystack 召回率 99.7% 〜

工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程上: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程: 工程:     工程:     工程:                                                                                                                                                                   

### 路径 2: Çember dikkat (LWM, LongVILA)

Çember dikkatini uzatmak Uzun diziyi bir çok cihazeye dağıtmak, bir ring oluşturmak, her cihaze bir parça vardır.

LWM(Liu et al., 2024) bu şekilde 1M-Token bağlamı 模型── eğitim hesaplama miktarı bağlamı 线性扩展, yerine kare genişleme, çünkü dikkatin kare maliyeti halka içindeki cihazlara dağılmış olarak △

LongVILA(arXiv:2408.10188)把该模式适配到VLMs──1400 视频,每 192 个代币 = 268k bağlamı,并使用8 yön paralelism 戒指注意训练──

### 路径 3:Token 压缩 (Video-XL, LongVA)

Daha uygun olan durum: LLM'de  see序列 öncesinde                                                                                                                                                                                                                                                       

Video-XL(arXiv:2409.14485) görsel özetleme simgesi kullanın: her N  ′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′′

LongVA kullanmak long context transfer teknik, LLM bağlamını 200k  genişletmek 2M 〜 önce uzun bağlamlı metin 上訓練,再通過共享表示迁移到长文脈视频〜

Token sıkıştırılması belirli zamanların çağrılama yeteneğini kullanarak genişletilmesi için değişir.

### 路径 4:Agentik geri alım (VideoAgent)

Tam videoyu LLM'ye girmeyin. Tersine, videoyu veri tabanı olarak çevirin ve LLM'yi kullanarak sorguya geçin.

VideoAgent ((arXiv:2403.10517):

1. LLM 读取问题──
2. LLM Lütfen çekme aracı 提供相关片段(show me segments with a cat) 。
3. Araç 返回匹配的剪辑时间印──
4. LLM 通過VLM 读取这些片──
5. LLM  organize cevap, veya sonraki sorgular sunmak

Bu uygulamada, bir ajan olarak LLM yapılması daha kolay.

### İğne-hay döşek referans değerini

标准 long-context 测试: bir video veya metin işaretini videoda herhangi bir konumda yerleştirin ve sonra bu işaretin hatırlanması gereken bir soru sorununu ortaya koyun.

Metrik:跨视频长度和标记位置的 Recall@k。

Gemini 2.5 Pro, en uzun 90 dakikada %99 oranında çekildi.

Eğer araç  yeterince iyi ise, VideoAgent 2+ saatte  modeline uyum sağlayabilir veya daha fazla olabilecek, çünkü geri alım  can命中針──

### Hangi yolu seçmeliyiz?

Sınır doğruluğu için 15 dakika klip: Open 72B + 原生 bağlamı genellikle kullanılabilir.

对于 30 分钟到 1 小时内容:开放模型选择 LongVILA 或 Video-XL;闭源选择 Gemini 2.5 Pro──质量门很重要,边界 走闭源──

对于 2+ 小时内容:VideoAgent 或类似检索模式──或,摘要成更小块,并输入等级概要──

### 2026 üretim modeli

实践中,生产级长视频管道是混合式的:

1. Tüm video için dinamik-FPS örnekleme + agresif birleştirme (Buysa 100k Token'in tüm bölümünü gösterir)
2. 72B VLM'ye gönder.
3. Eğer kullanıcı detay sorunu sorduğunda, bu özetin bir indeks olarak kullanılması gerekir.

Bu, kaba bağlamın genel anlamını ve geri alımını oluşturur.


```figure
mm-video-token-budget
```

## Kullan
`code/main.py`- ...

- 計算 1 分钟到 3 小时视频在不同 FPS + pooling 下的代币 预算。
- 模拟一次针-in-a-haystack 运行:在随机时刻 注入标记,提出问题,并评估召回──
- VLM'nin belirli kliplerini seçmek için bir ajanik-içtikleme yönlendirme simülatörü içerir.

运行预算表,感受尺度差──

## - Söyle.
本课产 出 `outputs/skill-long-video-strategy-planner.md`△ belirlenmiş video süresi ve sorgu karmaşıklığı, çıplak bağlam ̊ sıkıştırma ve ajantik geri alım ̶ arasında seçim,并计算延迟 + 质量预期。

## 练习
1. Bir bölüm 45 dakika konuşma, 1 FPS, her  81  token.

2. 设计一个针-in-a-haystack 测试:

3. VideoAgent ile karşılaştırın. Hangisi çağrılmaya başlıyor? Hangisi geç kalıyor?

4. Çember dikkatinin kayda maliyeti, sırada uzunluk linear genişleme, ayrıca cihaz sayısı linear genişleme ile birlikte. Neden, ve eğer yüzük dönüşümünü kaybederse 阶段 will fail wherein── açıklamak.

5. Gemini 1.5 Bölüm 5 İğne-bir-hay asası içeriği hakkında. 1M ve 10M Token  sınırları arasındaki çağrıda ne buldu?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Brute context | “只是更多 Token” | 将 LLM context 扩展到数百万 Token；一次性处理所有内容 |
| Ring attention | “LWM-style parallel” | 分布式 attention 模式：每个设备持有一个 chunk 并轮转 |
| Token compression | “Summary tokens” | 在进入 LLM 前，通过 learned compressor 减少每个 clip 的 Token |
| Needle-in-haystack | “NIH test” | 在随机位置插入唯一 marker，在测试时要求模型回忆它 |
| Agentic retrieval | “LLM as query planner” | LLM 向 retrieval tool 请求相关 clips，通过 VLM 读取它们，并组织答案 |
| VideoAgent | “Retrieval pattern for video” | 规范的 agentic-retrieval 设计：question -> tool -> clip -> answer |

## 延伸阅读
- [Gemini Team — Gemini 1.5 (arXiv:2403.05530)](https://arxiv.org/abs/2403.05530)
- [Liu et al. — LWM / RingAttention (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Xue et al. — LongVILA (arXiv:2408.10188)](https://arxiv.org/abs/2408.10188)
- [Shu et al. — Video-XL (arXiv:2409.14485)](https://arxiv.org/abs/2409.14485)
- [Wang et al. — VideoAgent (arXiv:2403.10517)](https://arxiv.org/abs/2403.10517)
