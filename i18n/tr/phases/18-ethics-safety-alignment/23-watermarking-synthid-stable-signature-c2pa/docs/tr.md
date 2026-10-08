# Su işaretleme  SynthID、Stabil İmza、C2PA

> Üç teknik oluşturur 2026 yılında AI üretilen içerik kaynakları takip temelini oluşturur.SynthID (Google DeepMind)  görüntü su işaretleme 2023 Ağustos ayında başlatıldı, metin + video 2024 Mayıs ayında başlatıldı.Gemini + Veo), metin 2024 Oktâbr ayında Responsible GenAI Toolkit tarafından açıldı, 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体探知器 统一的多媒体传媒 统一的多媒体传媒 统一传媒 统一的多媒体传媒 统一传媒 统一的多媒体传媒 统一传媒 统一的多媒体传媒 统一传媒 统一的多媒体 统一传媒 统一的多媒体 统一传媒 统一传媒 统一的多媒体 统一 统一 统一 统一 统一 统一 统一 统一 统一 统一的传 统计 统计 统计 统计 统计 统计 统计 统计 统计 统计 统计 统计 统计 统计 统计 统计 统计 

**Type:** Build
**Languages:** Python (stdlib, token-watermark embed + detect)
**Prerequisites:** Phase 10 · 04 (sampling), Phase 01 · 09 (information theory)
**Time:** ~75 分钟

## Öğrenme hedefi

- 描述 token-level watermarking (tıklama seviyesinde su işaretleme) SynthID-text 风格) ve denenebilir mekanizması
- Stabil İmza'yı ve 2024 yılında onu ortadan kaldırma saldırısını tanımlayın.
- C2PA'nın etkisini ve neden su işaretleme ile birlikte olduğunu açıklayın.
- 描述关键限制:model-spesifik sinyal、paraphrase 下的鲁棒性, yanı sıra anlam koruma saldırıları (arXiv:2508.20228)。

## 问题

2023-2024 yılları, derin fakiler ve AI üretimi içeriği büyük çapta siyasete ve tüketim sahnesine girdi. Su işaretleme önerilen teknik kaynak sinyalleri: oluşturma sırasında işaretlenen içerik üretimi, sonra yeniden denetlenmesi. 2025 yılının kanıtı: hiçbir su işaretinin  koşulsuz                                                                                                                                                                                                                                                                                                                                                                                                                                                        

## 概念

### Metin su işaretleme(SynthID-text 风格)

Kirchenbauer et al. 2023 机制, Google tarafından 产品化:

1. Her bir çözme aşamasında, öncekiler için K 个 代币 yapın, bir pseudorandom bölüm oluşturun, sözlükleri "yeşil" ve "kırmızı" 集合 olarak bölünür.
2. 通过给绿色logits加上 δ,使样本采集 偏向绿色集合──
3. 生成 結果 içeren yeşil Token sayısı herhangi bir durumda beklentiden daha yüksek olacaktır.

检测:对每个预写重新 hash,统计生成结果中的绿色代号,计算 z-score──水标文字的 z-score >0,人文 约为 0──

 özellikleri:
- 读者难以察觉 (d 足够小,质量损失较轻)
- Sözlük bölümü fonksiyonuna erişmek mümkündür.
- Bu mesajı bozmak için bir yazı yazmak için.

SynthID-text 于 2024 年 10 月通过 Google'ın Responsible GenAI Toolkit 开源──

### Stabil İmza (resim)

Fernandez et al. ICCV 2023──Fine-tune latent difüzyon dekodörü, her bir görüntü ürettiğinde bir yazılı latent temsilinin sabit ikili mesajı bulunur.

2024 yıl 5 月 "Stable Signature is Unstable" (arXiv:2405.07145):fine-tuning decoder images quality can be in keeping image quality simultaneously moving watermark──对抗性的 post-generation fine-tuning 成本很低; bu watermark'ın rakip dayanıklılığı sınırlıdır──

### SynthID birleşik dedektörü ((2025年 11月)

Gemini 3 Pro ile birlikte aynı yayın: Aynı API'de metin, görüntü, ses ve video içindeki SynthID sinyallerini okuyabilen bir multimedya dedektörü. Google'ın kaynak takip tekniğini birleştirdi.

### C2PA

İçerik Kaynak ve Doğruluk Koalisyonu── Kriptografik olarak imzalanan sahtekarlıktan kaynaklanan metadata standardı──C2PA 2.2 Açıklayıcı (2025)──C2PA manifesti 会记录 provenance iddiaları(谁创建、何时创建、做过哪些转变),并由创始人关键 签名──

Su işaretleme ile 互补:
- Metadata çıkarılabilir; su işaretleri genellikle kolay değildir.
- Metadata 信息丰富(完整 provenance chain);watermarks 承载 bit。
- C2PA platform kullanımı üzerine kurulu; su işaretleri otomatik olarak yazılır.

Google'da arama, reklam ve "Bu görüntü hakkında" olarak iki bölümde bir araya geldi.

###  limiti

- **Model-specific.**SynthID, SynthID etkinleştirilmiş modellerden oluşan üretim sonuçlarına su işaretleri ekleyecektir.
- **Paraphrase.**Metin su işaretleri 无法经受 anlam koruyan parafrase。
- **Transformation attacks.**arXiv:2508.20228 (2025)  destekli bir dizi resim su işaretini ve diğer birçok metni bozabilecek anlam koruma saldırıları göstermiştir.
- **Fine-tune removal.**"Stabil İmza Dursun"a göre, neslin sonrası ince ayarlamalar,

### AB AI Yasası 50 Maddesi

AI 生成 içeriği işaretleyen Şeffaflık Kodu(1st edition draft 2025年12月, 2nd edition draft 2026年3月,根据 [European Commission status page](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content),预计最终版 2026年 6月发布) ・截至 2026年 4月,该代码 仍为草案,时间线可能变化──监管层要求技术层提供这些措施──Deepfakes 必须标注──

### 18'inci aşamada yer alıyor.

Ders 22-23 关注模型输出的内容(özel veri、çıkış sinyalleri) ―― Ders 27 覆盖培训-数据治理── Ders 24 要求这些技术措施的监管框架──


```figure
an-watermark-greenlist
```

## Kullan

`code/main.py`构建一个玩具文本水印──Token是整数 0.N-1;watermarked sampling 会偏向哈希定义的绿色集合──Detektor 会计算绿色代币 z-score──你可以观察1000代币下的检测结果,看参句 如何破坏该信号,并测量人类文本上的错阳性率──

## - Söyle.

本课会产 出 `outputs/skill-provenance-audit.md` Bir kaynaklı iddia içeriği dağıtımını belirlerken, bu sürece su işaretleri mekanizması, her türlü modaliteyi kapsamaya yönelik kendi karşıtlık güçlüğü ve C2PA imzalı zinciri denetlenecektir.

## 练习

1. 运行  İşlem`code/main.py` Su işareti 1000 token jenerasyonu rapor ve insan yazılı metinlerin z puanları──% 95 güven eşiği aşınmak

2. 实现一个抛词攻击,用同义词 替换30%的代码──重新测量z-score──

3. Kirchenbauer et al. 2023 Bölüm 6 İçeriği Üstünlük Hakkında İçerikler. Neden metin su işaretleri aşağıda bir cümle içinde başarısız olurken, görüntü su işaretleri 能经受 cropping?

4. Design a using SynthID-text + C2PA metadata of deployment── describing the consumer see's provenance chain── identifying each component's failure mode──

5. 2024 yılında "Stabil İmza Dursun" sonuçları, ince ayarlama görüntü su işaretini kaldırılabilir göstermektedir.

## 关键术语

| Term | 人们怎么说 | 它实际含义 |
|------|------------|------------|
| SynthID | "Google's watermark" | Cross-modal provenance signal；text、image、audio、video |
| Token watermark | "Kirchenbauer-style" | Biased-sampling text watermark，可通过 green-token z-score 检测 |
| Stable Signature | "image watermark" | Fine-tuned-decoder watermark；ICCV 2023 |
| C2PA | "the metadata standard" | Cryptographically signed tamper-evident provenance metadata |
| Paraphrase robustness | "does rewording break it" | Text watermark 属性；目前有限 |
| Fine-tune removal | "adversarial unwatermark" | 通过 decoder fine-tuning 移除 image watermark 的攻击 |
| Cross-modal detector | "unified SynthID" | 2025 年 11 月跨 modalities 的 unified API |

## 延伸阅读

- [Kirchenbauer et al. — A Watermark for Large Language Models (ICML 2023, arXiv:2301.10226)](https://arxiv.org/abs/2301.10226) token-watermark 机制
- [Fernandez et al. — Stable Signature (ICCV 2023, arXiv:2303.15435)](https://arxiv.org/abs/2303.15435) resim su işaretleri 论文
- ["Stable Signature is Unstable" (arXiv:2405.07145)](https://arxiv.org/abs/2405.07145) Kaldırma saldırısı
- [Google DeepMind — SynthID](https://deepmind.google/models/synthid/) Çarşı modal su işaretleri
- [C2PA 2.2 Explainer (2025)](https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) Metadata Standartı
