# OpenAI Hazırlık Çerçeve ve DeepMind Sınır Güvenlik Çerçeve

> OpenAI Hazırlık Çerçevi v2(2025 yıl 4 月) Araştırma Kategorilerini: Uzun mesafeli özerklik、Sandbagging、Autonom Replikasyon ve Adaptasyon、Kendirme Korumaları, izlenmiş Kategorilerden farklıdır. İzlenmiş Kategoriler Capabilities Raporlarını ve Koruma Raporlarını başlatacak.

**Type:** Learn
**Languages:** Python (stdlib, three-framework decision-table diff tool)
**Prerequisites:** Phase 15 · 19 (Anthropic RSP)
**Time:** ~45 minutes

## 问题

Ders 19  dikkatlice Antropik'in ölçeklendirme politikasını okudum. Bu ders OpenAI ve DeepMind'in politikasını okuyarak tüm görüntüyü tamamladı. Bu üç dosya aynı sınıf ürünleridir ve aynı soruyu ele alıyor: sınır laboratuvarı ne zaman bir modeli durdurmalı veya sınırlandırmalı; onlar bir grup sınıf üzerinde aynı yönde, bazı önemli konularda da ayrılığa düşmektedir.

趋同之处: 三者都把长远自治 标记为值得追踪的能力类别──三者都承认欺骗行为(alignment faking、sandbagging) is a specific type of risk──三者都有内部审查机构──分歧之处:OpenAI将类别分为Tracked(强制缓解) 和Research(不自动触发)──DeepMind将自治权纳入两个领域,而不是单独命名──实验室将使用Tracked Research、Critical vs Moderate、Tier-1 vs Tier-2等名称;能力落落在哪个桶里,将在不同的实验室产生不同的操作后──

Bunları birlikte okumak sadece yararlı bir uygulama. Aynı yetenek Antropik'te, OpenAI'de, izlenmiş ancak tetiklemeyen, DeepMind'de, belirli bir alanın takip edilmesi için de önemlidir.

## 概念

### OpenAI Hazırlık Çerçeve v2(2025年 4月)

结构:

- **Tracked Categories**Bu konuda, güvenlik danışmanlık grubu tarafından yapılan bir inceleme, güvenlik önlemleri raporları ve güvenlik önlemleri raporları ile ilgili olarak yapılan bir inceleme ve inceleme yapıldı.
- **Research Categories**:实验室正在追踪但尚未承诺具体缓解措施的模型能力──包括长途自治─沙包──自主复制和适应─ 破坏保障──

V2 İçin Önemli Özetler: Araştırma Kategorileri otomatik olarak hafifleme önlemleri uygulamaz.

### DeepMind Frontier Güvenlik Çerçeve v3(2025 yıl 9 月;Sahitlik Deneyimleri 于 2026 yıl 4 月 17 日加入)

结构:

- **Critical Capability Levels (CCLs)**:跨五个领域的能力值:Cyber、Bio、ML R&D、CBRN、Autonomy(纳入ML R&D 和 Cyber)
- **Tracked Capability Levels**:2026 yıl 4 月加入的额外粒度──具体例:ML R&D özerklik seviyesinin 1 = 以 karşılığında insan + AI araçları
- **Deceptive alignment monitoring**:明确承诺对仪器推理滥用进行自动监控──

Özerklik ifade şekli OpenAI'den farklıdır.DeepMind'in özerklik konusunda bir sonucu yoktur. Özerklik, bir meta risk şeklidir.

### Üç taraf ortak bir trend

- 内部 Güvenlik Danışmanlık Grubu(分别命名为人类SAG、OpenAISAG、DeepMind iç komitesi)。高能力模型部署前进行审查──
- 明确提到欺骗性/合伪造性 是一类风险──
- Etnâ€TMatâ€TMatâ€TMatâ€TMatâ€TMatâ€TMatâ€TMatâ€TMatâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€atâ€â€â€â€â€â€â€â€â€â€â€â€â€â€â€â€â€â€â€ââ€â€â€â€â€â€â€â€â€â€â€â€â€â€ââ€â€â€ââââ€â€â€â€ââ€â€ââââââ€â€âââ€â€â€â€â€âââââ€â€ââââ€â€ââââââââââââââââââââââââââââ€â€ââââ
- DepMind çok açık bir şekilde diyor: Automatik izleme uzun vadede yeterli olmayacaktır.

### 它们的分歧的处

- **Anthropic**:v3.0 移除了暂停承诺;AI R&D-4 eşiği 被命名的下一个门──
- **OpenAI**:Tracked vs Research 拆分;Tahlil Kategorileri (Uzun Uzaylı Otonomya da dahil) otomatik kapı olmayacaktır。
- **DeepMind**Özerklik diğer alanlara dahil edildi; İzlenen Yeteneklilik Deniyeleri 2026 yılında 4 月 daha küçük bir bölgeye katıldı.

### Kum çantası: bir kişinin karmaşıklaşmasını sağlayan belirli bir yetenek

Sandbagging (模型在评估中策略性表现不佳) yer alan OpenAI'nin Araştırma Kategorileri.

Eğer bir model değerlendirme sırasında sandbagsa, o zaman her çerçeve kapasitesi değerleri düşük değerlendirilir. Çerçeve sadece ölçümde geçerli olduğunda geçerlidir. Bu yüzden laboratuvarın kendi değerlendirmesi dışında, dış ölçümlere de ihtiyaç vardır.

### 政策阅读技能

- 定位: Sizin ilginiz olan her bir yetenek politikada bulunmalıdır.
- Kategoriler: İzlenmiş miydi? Araştırma mı? İzlenmedi mi? Açık AI'nin bu noktaya isim verdiği doğrudur.
- 节奏: politika, açıklamaların zaman çizelgesi güncellenir mi yoksa sadece belirli bir olayın ardından mı?
- 独立性: dış inceleme zorunlu mu yoksa seçilebilir mi?Antropik Apollo ile ABD AI Güvenlik Enstitüsü ile işbirliği;OpenAI ile METR 合作;DeepMind esas olarak iç SAG'lara bağlıdır.


```figure
a5-tracked-vs-research
```

## Kullan

`code/main.py` küçük bir karar tablosu farklılık aracı gerçekleştirmek için  belirli bir yetenek oluşturmak için  özerklik  aldatıcı bir uyumlandırma  Araştırma ve Geliştirme otomasyonu  siber yükseltme                                                                                                                                                                                                                                                 

## - Söyle.

`outputs/skill-cross-policy-diff.md`Üç çerçeveyi kullanmak, belirli bir yetenek oluşturmak için politika karşılığı oluşturmak için.

## 练习

1. 运行  İşlem`code/main.py`❖ farklı araçların çıkışını politika ile uyumlu olarak doğrula, en az iki kişiyi kontrol edebilme yeteneğini doğrula.

2. 完整阅读 OpenAI Preparedness Framework v2──识别每个研究类别──对每项,用一句话说明为什么它在研究而不是追踪──

3. DeepMind FSF v3, ayrıca 2026 yılının 4 ayının takip edilen yetenek seviyeleri 更新──识别 ML R&D otonomisi seviyesinin 1'ün spesifik değerlendirme standardı──你会如何从外部测量它?

4. Sandbagging  Located in OpenAI's Research Categories。 Design an evaluation,迫使会 sandbags'ın modelinin gerçek kapasitesini ortaya çıkarmasını。引用 Lesson 1 中关于 eval-context-gaming的讨论。

5. 针对某项具体能力 (由你选择) 比较三项政策――说明你认为哪项政策的分类最严谨的,哪项最不严谨的,使用源文本证明――

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Preparedness Framework | “OpenAI 的 scaling policy” | PF v2（2025 年 4 月）；Tracked vs Research categories |
| Tracked Category | “Mandatory mitigation” | 触发 Capabilities + Safeguards Reports；SAG review |
| Research Category | “Monitored only” | 被追踪但没有自动缓解措施；包括 Long-range Autonomy |
| Frontier Safety Framework | “DeepMind 的 scaling policy” | FSF v3（2025 年 9 月）+ Tracked Capability Levels（2026 年 4 月） |
| CCL | “Critical Capability Level” | DeepMind 每个领域的阈值（Cyber、Bio、ML R&D、CBRN） |
| ML R&D autonomy level 1 | “R&D automation” | 以有竞争力的成本完全自动化 AI R&D pipeline |
| Sandbagging | “Strategic underperformance” | 模型在 evals 中表现不佳；位于 OpenAI Research Categories |
| Instrumental reasoning | “Means-ends reasoning” | 关于如何实现目标的推理；DeepMind monitoring 的目标 |

## 延伸阅读

- [OpenAI — Updating our Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/)- İletişim.
- [OpenAI — Preparedness Framework v2 PDF](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf) 完整文档──
- [DeepMind — Strengthening our Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/)FSF v3 ilanı
- [DeepMind — Updating the Frontier Safety Framework (April 2026)](https://deepmind.google/blog/updating-the-frontier-safety-framework/) İzlenen Yeteneklilik Denizi 增补。
- [Gemini 3 Pro FSF Report](https://storage.googleapis.com/deepmind-media/gemini/gemini_3_pro_fsf_report.pdf) FSF 格式 Risk Raporu nüm nüm nüm¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
