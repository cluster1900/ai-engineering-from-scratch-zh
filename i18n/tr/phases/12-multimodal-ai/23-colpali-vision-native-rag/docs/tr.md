# ColPali ve Vision-Native Document RAG

> 传统RAG 会将PDF 解析成文本,切成块,Embedding chunks,并存储矢量──每一步都会丢失信号:OCR 会丢失图表数据,chunking会断断表行,text embeddings会忽略数字──ColPali(Faysse et al., July 2024) daha basit bir soru ortaya koydu:为什么一定要提取文本?直接通过PaliGemma对页面图像做做Embedding,使用ColBERT-style late interaction做检索,并保留档携带的所有布局,图像,字体,和格式化信号──发布基准显示:在视觉丰富的文档上,结尾准确性比高高高高高高高20%──ColQwenS和GRAG 扩展这个模式──阅读本书本课程,构建一个微分文档,构建一个微分文档,构建一个微分文档.

**Type:** Build
**Languages:** Python (stdlib, multi-vector indexer + MaxSim scorer)
**先修要求：**11 . aşama (LLM Mühendisliği  RAG 基础), 12 . aşama · 05 .
**Time:** ~180 minutes

## Öğrenme hedefi

- 解释双码检索 (BIC) 每个文档一个向量) 和迟交互检索 (LATE-interaction) 每个文档多个向量) 的区别──
- ColBERT'in MaxSim işleyişini ve ColPali'nin nasıl metin işaretlerinden resimler yamalarına dönüştürdüğünü anlatın.
- 构建一个微型 ColPali-like index:page → patch embeddings → query-term embeddings 上的 MaxSim → top-k pages──
- Fakturaları / finansal raporları kullanma durumunu karşılaştırın 中的 ColPali + Qwen2.5-VL jeneratörü ve metin-RAG + GPT-4──

## 问题

PDF'ler Üstteki metin-RAG Kaybedilmiş Arşivin Çoğu Bilgi. Mali Rapor'un Üçüncü Kursa Dağıt Artışı Genellikle Çarşema'da bulunur. Tıbbi Rapor'un Bulguları Notlı Resimlerde bulunur. Yasal sözleşmenin imzası bloğu metin faktöründen ziyade düzenlemedir.

metin-RAG boru hattı:

1. PDF → OCR / pdftotext üzerinden metin
2. Metin → 300-500 Token parçaları。
3. Çıkış → iki kodlayıcı yerleştirme (((一个向量) 』
4. Kullanıcı sorusu → Ekleme → Kosinus benzerliği → üst-k parçalar。
5. Çünks + sorgu → LLM。

五个有损步骤──图表 捕获不到──表被分断 打断──多列布局 被展平──图表注释 消失──

ColPali'nın modification方式: OCR'den atlamak, doğrudan sayfa resmini yapmak, yerleştirmek, ColBERT tarzı geç etkileşimi kullanmak, geri alım yapmak, model sorgulama süresinde yaptırmak, 关注细粒度 patches──

## 概念

### Colbert (2020)

ColBERT(Khattab & Zaharia, arXiv:2004.12832) bir metin kurtarma yöntemi.

- Sorgu simgeler  elde kendi içe gömülmeleri  N_q vektörleri)
- Belge simgeler 获得 Embeddings(N_d vektörleri, genellikle önbelleğe alınır)。
- Score = sorgu simgeler 求和, her sorgu simgeler 取所有文档 tokens 中 cosine benzerliği:Σ_i max_j cos(q_i, d_j) 』

Bu MaxSim işlevi. Her sorgu simgesi, en uygun belge simgesi seçilir.

优点: hatırlayın 强,能处理 term-level semantics──缺点: her belge 需要 N_d vectors, storage 昂贵──

### KolPali

ColPali(Faysse et al., arXiv:2407.01449) ColBERT örneğini  uygulama resimlere

- Her bir sayfa PaliGemma tarafından düzenlenir.
- Her kullanıcı sorgu(metin) sorgu-tökeni yerleştirmeleri için编码:N_q vektörleri。
- Not = Σ_i max_j cos(q_i, p_j),也就是在查询文本标记和页面图像补丁 上做MaxSim。
- Top-k sayfaları üzerinden toplam puan alımı

Doküman-yıklama zamanı: PaliGemma ile her sayfada embed, depolama tüm yama embedleri için.

优点: 在视觉丰富文档上,端到端比文本RAG高 20-40%──每个补丁向量 捕获局部布局和内容──

缺点:每页 N_p yamaları × 4 byet yüzen × D-dim vektörler = depolama 增长很快──可通过 PQ / OPQ 缓解──

### ColQwen2 和 ColSmol

ColQwen2 (Illumin-tech, 2024-2025) PaliGemma'yı Qwen2-VL olarak değiştirir.

ColSmol yerel / kenar kullanım için daha küçük ölçekli bir variandır.

### VisRAG

VisRAG(Yu et al., arXiv:2410.10594) başka bir variandır: Yapımlarda değil, MaxSim yapın, ama VLM ile her sayfayı bir vektör haline getirerek, daha sonra iki kodlayıcı geri alınmak için yapın.

Kalite vs. Maliyet karşılığı: Kalitete öncelik ColPali, Skala'ya öncelik VisRAG。

### M3DocRAG

M3DocRAG(Cho et al., arXiv:2411.04952) çok sayfalık çok belge akıl yürütmesine genişleyecektir.

### ViDoRe  referans değer

ColPali'nin eşdeğer referansı──Visual Document Retrieval Evaluation── görevleri finansal raporlar─bilim makaleleri─adminatif belgeler─tıp kayıtları─analetler─Metrik:nDCG@5──

ColPali-v1 , ViDoRe'de %80 nDCG'yi oluşturur; aynı belge gruplarının üstteki metin-RAG'ı %50-60 civarında oluşturur.

### Sonundan sonuna kadar RAG boru hattı

Vision-native RAG için:

1. 摄取:PDF → 页面图像 → PaliGemma kodlama → 存储所有补丁嵌入式──
2. 查询:用户文本 → sorgu-token embedings → 对所有已索引页面执行 MaxSim → top-k 页面──
3. 生成:top-k 页面图像 + query → VLM(Qwen2.5-VL veya Claude)→ 答案。

Tüm yollar OCR yok. Şekiller, tablolar, yazı tipi, düzenleri...

### Kaydetme matematikleri

Bir 50 sayfalık mali rapor, her sayfa 729 patch,128 boyutlu yerleşim:

- ColPali:50 * 729 * 128 * 4 byte = ~18 MB çiğ,PQ 后 ~4 MB。
- Metin-RAG:50 parça * 768-dim * 4 byte = ~150 kB。

ColPali Her belge depolama ≈30x ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈  ≈ ≈ ≈ ≈          ≈ ≈     ≈      ≈                                   

### Text-RAG 仍然胜出的场景

- 没有布局信号的纯文本文档(wiki makale·聊天日志) ――Teks-RAG 更简单,存储 更便宜──
- 存储主导成本的多百万页档案──
- 严格监管要求在检索旁边保留可提取的OCR文献──

2026 yılındaki diğer olaylar için: finansal raporlar, bilimsel makaleler, yasal sözleşmeler, tıbbi kayıtlar, UX belgeleri, vizyon-devli RAG 胜出──


```figure
mm-maxsim
```

## Kullan

`code/main.py`- ...

- Oyuncak yama kodlayıcı:将一个"page"(小型 feature vectors 网格)映射为补丁嵌入阵列──
- MaxSim puanlayıcı: hesap sorgu simgesi yerleştirme seti 和 sayfa yama seti 之间的 ColBERT tarzı puanı。
- 5 oyuncak sayfasını indeksiyor, 3 sorguyu yürütüyor,并返回带得分的顶点――

## - Söyle.

本课会产 出 `outputs/skill-vision-rag-designer.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △

## 练习

1. Bir 200 sayfalık yıllık rapor, her sayfa 729 patch,128-dimensiyonlu emb, 4-bayt yüzen,

2. MaxSim is Σ_i max_j cos(q_i, p_j) ・・・ bu sorgu ve hangi basit ortalama benzerliği yakaladı?

3. ColPali sayfaları ötendirme için birleştirir. Eğer sözcük seviyesine göre ötendirme oluşturmak için değiştirirse, ne değişir?

4. 1M sayfalık bir korpus için sonundan sonuna kadar bir boru hattı tasarlayın, sorgu geçicilik bütçesi için 500 ms. Seçim ColQwen2 / VisRAG

5. 阅读 M3DocRAG(arXiv:2411.04952)── multi-page attention pattern, yanı sıra tek sayfalı ColPali geri alımının arasındaki farkı anlatın──

## 关键术语

| Term | 人们常说 | 它的实际含义 |
|------|-----------------|------------------------|
| Late interaction | "ColBERT-style" | 使用 per-token 或 per-patch embeddings + MaxSim 做 retrieval，而不是 single doc Vector |
| MaxSim | "Max-over-patches" | 对每个 query token，选择 similarity 最高的 document token；跨 query 求和 |
| Bi-encoder | "Single-vector" | 每个 document 一个 Vector；更快，但会丢失粒度 |
| Multi-vector | "Many-vectors-per-doc" | 每个 document / page 存储 N_p Vectors；storage cost 增长，但 recall 提升 |
| Patch embedding | "Page feature" | 来自 VLM encoder 的每个 image patch 的一个 Vector，按页 cached |
| ViDoRe | "Vision doc bench" | ColPali 用于 visual document retrieval 的 benchmark suite |
| PQ quantization | "Product quantization" | 在缩小 storage 约 8x 的同时保持 Vector similarity 的压缩方法 |

## 延伸阅读

- [Faysse et al. — ColPali (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449)
- [Khattab & Zaharia — ColBERT (arXiv:2004.12832)](https://arxiv.org/abs/2004.12832)
- [Yu et al. — VisRAG (arXiv:2410.10594)](https://arxiv.org/abs/2410.10594)
- [Cho et al. — M3DocRAG (arXiv:2411.04952)](https://arxiv.org/abs/2411.04952)
- [illuin-tech/colpali GitHub](https://github.com/illuin-tech/colpali)
